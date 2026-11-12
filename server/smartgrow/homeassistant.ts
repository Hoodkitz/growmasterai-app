/**
 * Home-Assistant-Brücke: fertige Geräte (Shelly, Tuya, AC Infinity, Sonoff, Zigbee-Sensoren …), die in
 * Home Assistant eingebunden sind, werden über dessen REST-API gelesen und geschaltet.
 *
 * Sicherheit: Die HA-Adresse gibt der Nutzer vor – der Server ruft sie auf. Deshalb nur https, keine
 * internen/privaten Adressen (auch nicht über DNS), keine Weiterleitungen, kurze Timeouts, kleine Antworten.
 * Der HA-Token liegt verschlüsselt (AES-256-GCM) in der Datenbank.
 */
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { lookup } from "node:dns/promises";
import net from "node:net";
import type { Actuator, Command, Metric } from "../../shared/smartgrow/types";

export type HaActuatorMap = Partial<Record<Exclude<Actuator, "doser">, string>>;
export type HaConfig = {
  baseUrl: string;
  tokenEnc: string;
  sensors: Partial<Record<Metric, string>>;
  actuators: HaActuatorMap;
};

const ENTITY =
  /^(sensor|binary_sensor|switch|fan|light|number|input_number|climate|humidifier|input_boolean)\.[a-z0-9_]{1,80}$/;
export const isEntityId = (e: string) => ENTITY.test(e);

// ---------- Verschlüsselung des HA-Tokens ----------
function key(): Buffer {
  const secret = process.env.SMARTGROW_SECRET || process.env.JWT_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("SMARTGROW_SECRET/JWT_SECRET fehlt");
  return createHash("sha256").update(`smartgrow-ha:${secret}`).digest();
}
export function encryptToken(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return `v1:${iv.toString("base64")}:${c.getAuthTag().toString("base64")}:${enc.toString("base64")}`;
}
export function decryptToken(blob: string): string {
  const [v, iv, tag, data] = blob.split(":");
  if (v !== "v1" || !iv || !tag || !data)
    throw new Error("Token-Format unbekannt");
  const d = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  d.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([
    d.update(Buffer.from(data, "base64")),
    d.final(),
  ]).toString("utf8");
}

// ---------- SSRF-Schutz ----------
export function isPrivateAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      a >= 224
    );
  }
  const x = ip.toLowerCase();
  if (x === "::1" || x === "::") return true;
  if (x.startsWith("::ffff:")) return isPrivateAddress(x.slice(7));
  return (
    x.startsWith("fc") ||
    x.startsWith("fd") ||
    x.startsWith("fe80") ||
    x.startsWith("ff")
  );
}

export type Resolver = (host: string) => Promise<string[]>;
const defaultResolver: Resolver = async (host) =>
  (await lookup(host, { all: true })).map((a) => a.address);

/** Prüft die HA-Adresse: https, öffentlicher Host. Gibt die normalisierte Basis-URL zurück. */
export async function validateBaseUrl(
  raw: string,
  resolve: Resolver = defaultResolver,
): Promise<string> {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    throw new Error("Ungültige Adresse");
  }
  if (u.protocol !== "https:")
    throw new Error("Nur https-Adressen (z. B. deine Nabu-Casa-Adresse)");
  if (u.username || u.password)
    throw new Error("Keine Zugangsdaten in der Adresse");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  )
    throw new Error("Interne Adressen sind nicht erlaubt");
  const ips = net.isIP(host)
    ? [host]
    : await resolve(host).catch(() => {
        throw new Error("Adresse nicht auflösbar");
      });
  if (!ips.length || ips.some(isPrivateAddress))
    throw new Error("Interne Adressen sind nicht erlaubt");
  return `${u.origin}${u.pathname.replace(/\/+$/, "")}`;
}

export type HaFetch = (url: string, init: RequestInit) => Promise<Response>;

async function haRequest(
  base: string,
  token: string,
  path: string,
  init: RequestInit = {},
  f: HaFetch = fetch,
): Promise<unknown> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 8000);
  try {
    const res = await f(`${base}${path}`, {
      ...init,
      redirect: "manual",
      signal: ctl.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
    if (res.status >= 300 && res.status < 400)
      throw new Error("Weiterleitung nicht erlaubt");
    if (res.status === 401) throw new Error("Home Assistant: Token ungültig");
    if (!res.ok) throw new Error(`Home Assistant: HTTP ${res.status}`);
    const text = await res.text();
    if (text.length > 2_000_000) throw new Error("Antwort zu groß");
    return text ? JSON.parse(text) : null;
  } finally {
    clearTimeout(t);
  }
}

type HaState = {
  entity_id: string;
  state: string;
  attributes?: Record<string, unknown>;
};

/** Verbindung testen und passende Entitäten auflisten (für die Zuordnung in der App). */
export async function listEntities(
  base: string,
  token: string,
  f?: HaFetch,
): Promise<
  { entity_id: string; name: string; unit?: string; state: string }[]
> {
  const states = (await haRequest(
    base,
    token,
    "/api/states",
    {},
    f,
  )) as HaState[];
  if (!Array.isArray(states))
    throw new Error("Unerwartete Antwort von Home Assistant");
  return states
    .filter((s) => isEntityId(s.entity_id))
    .slice(0, 800)
    .map((s) => ({
      entity_id: s.entity_id,
      state: String(s.state).slice(0, 40),
      name: String(s.attributes?.friendly_name ?? s.entity_id).slice(0, 80),
      unit:
        typeof s.attributes?.unit_of_measurement === "string"
          ? (s.attributes.unit_of_measurement as string)
          : undefined,
    }));
}

/** Messwert aus einem HA-Zustand lesen (Zahl, binärer Sensor -> 0/1). */
export function parseHaValue(metric: Metric, s: HaState): number | null {
  if (metric === "leak")
    return s.state === "on" ? 1 : s.state === "off" ? 0 : null;
  const v = Number(s.state);
  if (!Number.isFinite(v)) return null;
  // Temperaturen in °F umrechnen
  if (
    /°F/.test(String(s.attributes?.unit_of_measurement ?? "")) &&
    /temp/i.test(metric)
  )
    return Math.round((((v - 32) * 5) / 9) * 10) / 10;
  return v;
}

/** Stellung eines Aktors aus HA lesen (0–100). */
export function parseHaActuator(s: HaState): number | null {
  if (s.state === "unavailable" || s.state === "unknown") return null;
  const domain = s.entity_id.split(".")[0];
  if (domain === "light")
    return s.state === "on"
      ? Math.round((Number(s.attributes?.brightness ?? 255) / 255) * 100)
      : 0;
  if (domain === "fan")
    return s.state === "on" ? Number(s.attributes?.percentage ?? 100) : 0;
  if (domain === "number" || domain === "input_number")
    return Number.isFinite(Number(s.state)) ? Number(s.state) : null;
  return s.state === "on" ? 100 : s.state === "off" ? 0 : null;
}

export async function readAll(
  cfg: HaConfig,
  f?: HaFetch,
): Promise<{
  readings: { metric: Metric; value: number }[];
  state: Record<string, number>;
}> {
  const token = decryptToken(cfg.tokenEnc);
  const states = (await haRequest(
    cfg.baseUrl,
    token,
    "/api/states",
    {},
    f,
  )) as HaState[];
  const byId = new Map(states.map((s) => [s.entity_id, s]));
  const readings: { metric: Metric; value: number }[] = [];
  for (const [m, id] of Object.entries(cfg.sensors) as [Metric, string][]) {
    const s = byId.get(id);
    const v = s ? parseHaValue(m, s) : null;
    if (v !== null) readings.push({ metric: m, value: v });
  }
  const state: Record<string, number> = {};
  for (const [a, id] of Object.entries(cfg.actuators)) {
    const s = id ? byId.get(id) : undefined;
    const v = s ? parseHaActuator(s) : null;
    if (v !== null) state[a] = v;
  }
  return { readings, state };
}

/** HA-Dienstaufruf für einen Befehl. Pumpe: an, das Ausschalten übernimmt der Takt (pumpUntil). */
export function serviceFor(
  entity: string,
  cmd: Command,
): { path: string; body: Record<string, unknown> } {
  const domain = entity.split(".")[0];
  const on =
    cmd.kind === "set"
      ? cmd.value > 0
      : cmd.kind === "run"
        ? cmd.seconds > 0
        : false;
  if (cmd.kind === "set" && domain === "light")
    return on
      ? {
          path: "/api/services/light/turn_on",
          body: { entity_id: entity, brightness_pct: cmd.value },
        }
      : { path: "/api/services/light/turn_off", body: { entity_id: entity } };
  if (cmd.kind === "set" && domain === "fan")
    return on
      ? {
          path: "/api/services/fan/set_percentage",
          body: { entity_id: entity, percentage: cmd.value },
        }
      : { path: "/api/services/fan/turn_off", body: { entity_id: entity } };
  if (cmd.kind === "set" && (domain === "number" || domain === "input_number"))
    return {
      path: `/api/services/${domain}/set_value`,
      body: { entity_id: entity, value: cmd.value },
    };
  const d = [
    "switch",
    "input_boolean",
    "humidifier",
    "climate",
    "fan",
    "light",
  ].includes(domain)
    ? domain
    : "homeassistant";
  return {
    path: `/api/services/${d}/${on ? "turn_on" : "turn_off"}`,
    body: { entity_id: entity },
  };
}

export async function execute(
  cfg: HaConfig,
  cmd: Command,
  f?: HaFetch,
): Promise<void> {
  if (cmd.kind === "dose")
    throw new Error(
      "Dosierpumpen gehen nicht über Home Assistant (zu ungenau)",
    );
  const entity = cfg.actuators[cmd.actuator as keyof HaActuatorMap];
  if (!entity) throw new Error("Kein Gerät zugeordnet");
  const { path, body } = serviceFor(entity, cmd);
  await haRequest(
    cfg.baseUrl,
    decryptToken(cfg.tokenEnc),
    path,
    { method: "POST", body: JSON.stringify(body) },
    f,
  );
}
