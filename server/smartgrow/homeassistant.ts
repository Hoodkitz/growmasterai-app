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
import https from "node:https";
import type { Actuator, Command, Metric } from "../../shared/smartgrow/types";

export type HaActuatorMap = Partial<Record<Exclude<Actuator, "doser">, string>>;
export type HaConfig = {
  baseUrl: string;
  tokenEnc: string;
  sensors: Partial<Record<Metric, string>>;
  actuators: HaActuatorMap;
  /** optionale Zelt-Kamera (camera.*) für die KI-Beobachtung */
  camera?: string | null;
};

const ENTITY =
  /^(sensor|binary_sensor|switch|fan|light|number|input_number|climate|humidifier|input_boolean|camera)\.[a-z0-9_]{1,80}$/;
export const isCameraEntity = (e: string) =>
  /^camera\.[a-z0-9_]{1,80}$/.test(e);
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
/** Alles, was nicht öffentliches Unicast ist (IPv4 + IPv6 inkl. gemappter/übersetzter Formen). */
// getrennte Listen: Node prüft IPv4 sonst auch gegen ::ffff:0:0/96 (würde jede IPv4 sperren)
const BLOCKED4 = new net.BlockList();
const BLOCKED6 = new net.BlockList();
for (const [a, p] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const)
  BLOCKED4.addSubnet(a, p, "ipv4");
for (const [a, p] of [
  ["::", 128],
  ["::1", 128],
  ["::", 96] /* IPv4-kompatibel */,
  ["::ffff:0:0", 96] /* IPv4-gemappt */,
  ["64:ff9b::", 96] /* NAT64 */,
  ["64:ff9b:1::", 48],
  ["100::", 64],
  ["2001::", 32] /* Teredo */,
  ["2001:db8::", 32],
  ["2002::", 16] /* 6to4 */,
  ["fc00::", 7],
  ["fe80::", 10],
  ["fec0::", 10],
  ["ff00::", 8],
] as const)
  BLOCKED6.addSubnet(a, p, "ipv6");

export function isPrivateAddress(ip: string): boolean {
  const addr = ip.replace(/^\[|\]$/g, "").split("%")[0];
  if (net.isIPv4(addr)) return BLOCKED4.check(addr, "ipv4");
  if (net.isIPv6(addr)) return BLOCKED6.check(addr, "ipv6");
  return true; // Unbekanntes Format: sicherheitshalber sperren
}

/** DNS-Auflösung, bei der JEDE Adresse geprüft wird – wird bei jeder Verbindung benutzt (gegen DNS-Rebinding). */
function safeLookup(
  hostname: string,
  options: object,
  cb: (
    err: Error | null,
    address: string | { address: string; family: number }[],
    family?: number,
  ) => void,
) {
  lookup(hostname, { all: true }).then(
    (addrs) => {
      if (!addrs.length || addrs.some((a) => isPrivateAddress(a.address)))
        return cb(new Error("Interne Adressen sind nicht erlaubt"), "");
      if ((options as { all?: boolean }).all) return cb(null, addrs);
      cb(null, addrs[0].address, addrs[0].family);
    },
    (e) => cb(e as Error, ""),
  );
}

/** fetch-Ersatz über https.request mit geprüfter, festgenagelter IP; keine Weiterleitungen, max. 2 MB. */
export const pinnedFetch: HaFetch = (url, init) =>
  new Promise((resolve, reject) => {
    const u = new URL(url);
    if (u.protocol !== "https:") return reject(new Error("Nur https"));
    if (
      net.isIP(u.hostname.replace(/^\[|\]$/g, "")) &&
      isPrivateAddress(u.hostname)
    )
      return reject(new Error("Interne Adressen sind nicht erlaubt"));
    const req = https.request(
      u.href,
      {
        method: init.method ?? "GET",
        headers: init.headers as Record<string, string>,
        lookup: safeLookup as never,
        timeout: 8000,
      },
      (res) => {
        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (c: Buffer) => {
          size += c.length;
          if (size > 2_000_000) {
            req.destroy(new Error("Antwort zu groß"));
            return;
          }
          chunks.push(c);
        });
        res.on("end", () =>
          resolve(
            new Response(Buffer.concat(chunks), {
              status: res.statusCode ?? 500,
            }),
          ),
        );
        res.on("error", reject);
      },
    );
    req.on("timeout", () => req.destroy(new Error("Zeitüberschreitung")));
    req.on("error", reject);
    init.signal?.addEventListener("abort", () =>
      req.destroy(new Error("Abgebrochen")),
    );
    if (init.body) req.write(init.body as string);
    req.end();
  });

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
let haFetchImpl: HaFetch = pinnedFetch;
/** Nur für Tests: HA-Aufrufe umleiten (null = wieder die gesicherte Standard-Verbindung). */
export function setHaFetchForTests(f: HaFetch | null) {
  haFetchImpl = f ?? pinnedFetch;
}

async function haRequest(
  base: string,
  token: string,
  path: string,
  init: RequestInit = {},
  f: HaFetch = haFetchImpl,
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

/** Aktuelles Kamerabild über den HA-Kamera-Proxy (JPEG, max. 1,5 MB). */
export async function cameraSnapshot(
  cfg: HaConfig,
  f: HaFetch = haFetchImpl,
): Promise<Buffer> {
  if (!cfg.camera || !isCameraEntity(cfg.camera))
    throw new Error("Keine Kamera zugeordnet");
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 15000);
  try {
    const res = await f(`${cfg.baseUrl}/api/camera_proxy/${cfg.camera}`, {
      redirect: "manual",
      signal: ctl.signal,
      headers: { Authorization: `Bearer ${decryptToken(cfg.tokenEnc)}` },
    });
    if (res.status >= 300 && res.status < 400)
      throw new Error("Weiterleitung nicht erlaubt");
    if (!res.ok) throw new Error(`Kamera: HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 1_500_000)
      throw new Error(
        "Kamerabild zu groß (max. 1,5 MB) – in HA eine kleinere Auflösung wählen",
      );
    return buf;
  } finally {
    clearTimeout(t);
  }
}
