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
import { and, eq, inArray } from "drizzle-orm";
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
import { hashToken } from "./engine";

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
      ts: r.ts && Math.abs(r.ts - now) < 10 * 60_000 ? r.ts : now,
    }));
  const ignored = list.length - rows.length;
  if (rows.length) await db.insert(growReadings).values(rows);

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
      if (!c || (c.status !== "sent" && c.status !== "pending")) continue;
      await db
        .update(growCommands)
        .set({
          status: a.ok ? "done" : "failed",
          doneAt: now,
          result: a.result?.slice(0, 200) ?? null,
        })
        .where(eq(growCommands.id, c.id));
      const p = c.payload as Command;
      if (a.ok && p.kind === "set" && !b.state?.[p.actuator])
        state = { ...state, [p.actuator]: p.value };
    }
  }
  await db
    .update(growDevices)
    .set({ lastSeenAt: now, state, firmware: b.firmware ?? device.firmware })
    .where(eq(growDevices.id, device.id));

  // offene Befehle ausliefern
  const pending = await db
    .select()
    .from(growCommands)
    .where(
      and(
        eq(growCommands.deviceId, device.id),
        eq(growCommands.status, "pending"),
      ),
    )
    .orderBy(growCommands.id)
    .limit(20);
  if (pending.length)
    await db
      .update(growCommands)
      .set({ status: "sent", sentAt: now })
      .where(
        inArray(
          growCommands.id,
          pending.map((p) => p.id),
        ),
      );
  return {
    status: 200,
    json: {
      ok: true,
      serverTime: now,
      pollSeconds: POLL_SECONDS,
      accepted: rows.length,
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
}
