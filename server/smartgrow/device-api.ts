/**
 * Geräte-Protokoll v1 (HTTP/JSON) – für eigene Hardware (ESP32 & Co.) und Brücken.
 *
 *   POST /api/device/v1/report
 *   Authorization: Bearer gmd_…   (Geräte-Token aus der App, nur einmal sichtbar)
 *   { "readings": {"airTemp": 24.8, "airRh": 61} | [{"metric":"airTemp","value":24.8,"ts":1731400000000}],
 *     "state": {"light": 80, "exhaust": 35}, "acks": [{"id": 12, "ok": true}], "firmware": "gm-esp32 0.1" }
 *
 * Antwort: { "commands": [{ "id": 12, "actuator": "exhaust", "kind": "set", "value": 60 }, …],
 *            "pollSeconds": 30, "serverTime": …, "failsafe": {…} }
 *
 * Das Gerät meldet sich alle ~30 s, führt Befehle aus und bestätigt sie beim nächsten Melden.
 * Bekommt es länger als failsafe.afterSeconds keine Antwort, schaltet es selbst in den Notbetrieb.
 */
import type { Express, Request, Response } from "express";
import express from "express";
import { and, eq, gt, inArray, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { getDb } from "../db";
import { growCommands, growDevices, growReadings } from "../../drizzle/schema";
import { createRateLimiter } from "../_core/rateLimit";
import {
  isActuator,
  isMetric,
  METRIC_INFO,
  type Command,
  type DeviceCaps,
} from "../../shared/smartgrow/types";
import { COMMAND_TTL_MS, hashToken } from "./engine";
import {
  handleDeviceSnapshot,
  isJpeg,
  MAX_IMAGE_BYTES,
  type CameraDeps,
} from "./camera";

export const POLL_SECONDS = 30;
export const FAILSAFE = {
  afterSeconds: 300,
  /** sichere Stellungen ohne Server: nichts zuführen, lüften, Licht nach eigenem Zeitplan weiter */
  set: {
    pump: 0,
    doser: 0,
    co2: 0,
    heater: 0,
    humidifier: 0,
    exhaust: 50,
    intake: 40,
  },
  light: "keep-schedule",
} as const;

const readingObj = z.object({
  metric: z.string().max(20),
  value: z.number().finite(),
  ts: z.number().int().optional(),
});
const reportBody = z.object({
  readings: z
    .union([
      z.array(readingObj).max(100),
      z.record(z.string().max(20), z.number().finite()),
    ])
    .optional(),
  state: z.record(z.string().max(20), z.number().finite()).optional(),
  acks: z
    .array(
      z.object({
        id: z.number().int(),
        ok: z.boolean(),
        result: z.string().max(200).optional(),
      }),
    )
    .max(50)
    .optional(),
  firmware: z.string().max(40).optional(),
});

const limiter = createRateLimiter({ windowMs: 60_000, max: 30 });

/** Liest das Gerät zum Bearer-Token (oder null). */
export async function deviceFromRequest(req: Request) {
  const auth = req.headers.authorization ?? "";
  const m = /^Bearer (gmd_[A-Za-z0-9_-]{20,80})$/.exec(auth);
  if (!m) return null;
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(growDevices)
    .where(eq(growDevices.tokenHash, hashToken(m[1])))
    .limit(1);
  return rows[0] && rows[0].kind === "http" ? rows[0] : null;
}

export async function handleReport(
  deviceToken: string | undefined,
  body: unknown,
  now = Date.now(),
): Promise<{ status: number; json: unknown }> {
  const db = await getDb();
  if (!db) return { status: 503, json: { error: "Datenbank nicht verfügbar" } };
  const m = /^Bearer (gmd_[A-Za-z0-9_-]{20,80})$/.exec(deviceToken ?? "");
  if (!m) return { status: 401, json: { error: "Geräte-Token fehlt" } };
  const [device] = await db
    .select()
    .from(growDevices)
    .where(eq(growDevices.tokenHash, hashToken(m[1])))
    .limit(1);
  if (!device || device.kind !== "http")
    return { status: 401, json: { error: "Unbekanntes Gerät" } };
  if (!limiter.check(`dev:${device.id}`).allowed)
    return {
      status: 429,
      json: { error: "Zu viele Meldungen", pollSeconds: POLL_SECONDS },
    };
  const parsed = reportBody.safeParse(body);
  if (!parsed.success)
    return {
      status: 400,
      json: {
        error: "Ungültige Meldung",
        issues: parsed.error.issues
          .slice(0, 5)
          .map((i) => `${i.path.join(".")}: ${i.message}`),
      },
    };
  const b = parsed.data;
  const caps = device.caps as DeviceCaps;

  // Messwerte: nur angemeldete Sensoren, nur plausible Zeitstempel (sonst Serverzeit)
  const list = Array.isArray(b.readings)
    ? b.readings
    : Object.entries(b.readings ?? {}).map(([metric, value]) => ({
        metric,
        value,
        ts: undefined,
      }));
  const rows = list
    .filter((r) => isMetric(r.metric) && caps.sensors.includes(r.metric))
    .filter(
      (r) =>
        r.value >= METRIC_INFO[r.metric as keyof typeof METRIC_INFO].min &&
        r.value <= METRIC_INFO[r.metric as keyof typeof METRIC_INFO].max,
    )
    .map((r) => ({
      tentId: device.tentId,
      deviceId: device.id,
      metric: r.metric,
      value: r.value,
      // Zeitstempel nur aus der jüngeren Vergangenheit (max. 10 min alt, max. 60 s in der Zukunft)
      ts:
        r.ts && r.ts >= now - 10 * 60_000 && r.ts <= now + 60_000 ? r.ts : now,
    }));
  // höchstens ein Wert je Messgröße und Meldung (der neueste) – gegen Datenfluten
  const newest = new Map<string, (typeof rows)[number]>();
  for (const r of rows) {
    const o = newest.get(r.metric);
    if (!o || r.ts >= o.ts) newest.set(r.metric, r);
  }
  const ignored = list.length - newest.size;
  const kept = [...newest.values()];
  if (kept.length) await db.insert(growReadings).values(kept);

  // Bestätigungen: Befehl erledigt -> Stellung merken
  let state = { ...((device.state as Record<string, number> | null) ?? {}) };
  if (b.state)
    for (const [k, v] of Object.entries(b.state))
      if (isActuator(k)) state[k] = Math.max(0, Math.min(100, v));
  if (b.acks?.length) {
    const own = await db
      .select()
      .from(growCommands)
      .where(
        and(
          eq(growCommands.deviceId, device.id),
          inArray(
            growCommands.id,
            b.acks.map((a) => a.id),
          ),
        ),
      );
    for (const a of b.acks) {
      const c = own.find((o) => o.id === a.id);
      // auch späte Bestätigungen annehmen (bereits als abgelaufen markierte Befehle)
      if (!c || !["sent", "pending", "expired"].includes(c.status)) continue;
      await db
        .update(growCommands)
        .set({
          status: a.ok ? "done" : "failed",
          doneAt: now,
          result: a.result?.slice(0, 200) ?? null,
        })
        .where(eq(growCommands.id, c.id));
      const p = c.payload as Command;
      // gemeldete Stellung hat Vorrang; sonst nur übernehmen, wenn kein neuerer Befehl für den Aktor existiert
      if (a.ok && p.kind === "set" && b.state?.[p.actuator] === undefined) {
        const newer = await db
          .select({ id: growCommands.id })
          .from(growCommands)
          .where(
            and(
              eq(growCommands.deviceId, device.id),
              eq(growCommands.actuator, p.actuator),
              gt(growCommands.id, c.id),
              inArray(growCommands.status, ["sent", "done"]),
            ),
          )
          .limit(1);
        if (!newer.length) state = { ...state, [p.actuator]: p.value };
      }
    }
  }
  await db
    .update(growDevices)
    .set({ lastSeenAt: now, state, firmware: b.firmware ?? device.firmware })
    .where(eq(growDevices.id, device.id));

  // offene Befehle ausliefern: erst atomar beanspruchen (Markierung), dann genau diese lesen –
  // zwei gleichzeitige Meldungen bekommen so nie denselben Befehl; zu alte Befehle werden nicht mehr ausgeliefert
  const claim = `claim:${randomBytes(8).toString("hex")}`;
  await db.execute(sql`UPDATE growCommands SET status = 'sent', sentAt = ${now}, result = ${claim}
    WHERE deviceId = ${device.id} AND status = 'pending' AND createdAt >= ${now - COMMAND_TTL_MS} ORDER BY id LIMIT 20`);
  const pending = await db
    .select()
    .from(growCommands)
    .where(
      and(eq(growCommands.deviceId, device.id), eq(growCommands.result, claim)),
    )
    .orderBy(growCommands.id);
  if (pending.length)
    await db
      .update(growCommands)
      .set({ result: null })
      .where(eq(growCommands.result, claim));
  return {
    status: 200,
    json: {
      ok: true,
      serverTime: now,
      pollSeconds: POLL_SECONDS,
      accepted: kept.length,
      ignored,
      commands: pending.map((p) => ({ id: p.id, ...(p.payload as Command) })),
      failsafe: FAILSAFE,
    },
  };
}

export function registerDeviceRoutes(app: Express) {
  app.post(
    "/api/device/v1/report",
    express.json({ limit: "64kb" }),
    async (req: Request, res: Response) => {
      try {
        const r = await handleReport(req.headers.authorization, req.body);
        res.status(r.status).json(r.json);
      } catch (e) {
        console.error("[smartgrow] report failed:", e);
        res
          .status(500)
          .json({ error: "Interner Fehler", pollSeconds: POLL_SECONDS });
      }
    },
  );

  /**
   * Kamerabild (JPEG, max. 1,5 MB) für die KI-Blattkontrolle, z. B. von einer ESP32-CAM:
   *   POST /api/device/v1/snapshot   Content-Type: image/jpeg   Authorization: Bearer gmd_…
   */
  app.post(
    "/api/device/v1/snapshot",
    express.raw({
      type: ["image/jpeg", "application/octet-stream"],
      limit: "1600kb",
    }),
    async (req: Request, res: Response) => {
      try {
        const r = await handleSnapshot(req.headers.authorization, req.body);
        res.status(r.status).json(r.json);
      } catch (e) {
        console.error("[smartgrow] snapshot failed:", e);
        res.status(500).json({ error: "Interner Fehler" });
      }
    },
  );
}

const snapLimiter = createRateLimiter({ windowMs: 60 * 60_000, max: 12 });

export async function handleSnapshot(
  deviceToken: string | undefined,
  body: unknown,
  now = Date.now(),
  deps: CameraDeps = {},
): Promise<{ status: number; json: unknown }> {
  const db = await getDb();
  if (!db) return { status: 503, json: { error: "Datenbank nicht verfügbar" } };
  const m = /^Bearer (gmd_[A-Za-z0-9_-]{20,80})$/.exec(deviceToken ?? "");
  if (!m) return { status: 401, json: { error: "Geräte-Token fehlt" } };
  const [device] = await db
    .select()
    .from(growDevices)
    .where(eq(growDevices.tokenHash, hashToken(m[1])))
    .limit(1);
  if (!device || device.kind !== "http")
    return { status: 401, json: { error: "Unbekanntes Gerät" } };
  if (!snapLimiter.check(`snap:${device.id}`).allowed)
    return { status: 429, json: { error: "Höchstens 12 Bilder pro Stunde" } };
  if (!Buffer.isBuffer(body) || !isJpeg(body))
    return {
      status: 415,
      json: { error: "Bitte ein JPEG senden (Content-Type: image/jpeg)" },
    };
  if (body.length > MAX_IMAGE_BYTES)
    return { status: 413, json: { error: "Bild zu groß (max. 1,5 MB)" } };
  const r = await handleDeviceSnapshot(
    db,
    device.tentId,
    device.id,
    body,
    now,
    deps,
  );
  await db
    .update(growDevices)
    .set({ lastSeenAt: now })
    .where(eq(growDevices.id, device.id));
  return { status: 200, json: { ok: true, id: r.id, analyzed: r.analyzed } };
}
