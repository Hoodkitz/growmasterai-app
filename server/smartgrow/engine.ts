/**
 * Smart-Grow-Engine: läuft jede Minute für jedes Zelt.
 *
 * 1. Simulator-Zelte weiterrechnen (Messwerte erzeugen)
 * 2. Regler (shared/smartgrow/controller.ts) entscheiden lassen – inkl. Sicherheitsschicht
 * 3. Je nach Modus: ausführen (Befehl an Gerät), vorschlagen (Nutzer bestätigt) oder nur überwachen
 * 4. Alarme protokollieren und per Push melden (je Art höchstens einmal pro Stunde)
 */
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gte, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { getDb } from "../db";
import {
  growCommands,
  growDevices,
  growEvents,
  growReadings,
  growTents,
  pushTokens,
  users,
  type GrowDevice,
  type GrowTent,
} from "../../drizzle/schema";
import {
  decide,
  DEFAULT_AUTOMATION,
  localMinutes,
  type AutomationConfig,
  type ControllerOutput,
  type Decision,
  SAFETY_SENSORS,
} from "../../shared/smartgrow/controller";
import type {
  Adjustments,
  TentSettings,
} from "../../shared/smartgrow/profiles";
import {
  sanitizeLimits,
  type Alert,
  type GuardContext,
  type SafetyLimits,
} from "../../shared/smartgrow/safety";
import {
  SIM_START,
  simApply,
  simStep,
  type SimState,
} from "../../shared/smartgrow/simulator";
import {
  ACTUATOR_LABEL,
  DOSER_LABEL,
  type Actuator,
  type Command,
  type CommandSource,
  type DeviceCaps,
  type DoserChannel,
  type Metric,
  type Mode,
  type Reading,
} from "../../shared/smartgrow/types";
import { sendExpoPush } from "../push";
import { hasSmartGrow } from "../../shared/smartgrow/access";
import * as ha from "./homeassistant";
import type { HaConfig } from "./homeassistant";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export const COMMAND_TTL_MS = 3 * 60_000;
export const PROPOSAL_TTL_MS = 30 * 60_000;
export const ALERT_REPEAT_MS = 60 * 60_000;
export const DEVICE_OFFLINE_MS = 10 * 60_000;
export const HA_CAMERA_INTERVAL_MS = 30 * 60_000;
export const READING_RETENTION_MS = 30 * 86_400_000;

export const hashToken = (t: string) =>
  createHash("sha256").update(t).digest("hex");
export function newDeviceToken(): {
  token: string;
  hash: string;
  hint: string;
} {
  const token = `gmd_${randomBytes(24).toString("base64url")}`;
  return { token, hash: hashToken(token), hint: token.slice(0, 8) };
}

export type TentConfig = {
  settings: TentSettings;
  limits: SafetyLimits;
  automation: AutomationConfig;
  adjustments: Adjustments;
  mode: Mode;
};

export function tentConfig(t: GrowTent): TentConfig {
  return {
    settings: t.settings as TentSettings,
    limits: sanitizeLimits(t.limits as Partial<SafetyLimits> | null),
    automation: {
      ...DEFAULT_AUTOMATION,
      ...((t.automation as Partial<AutomationConfig> | null) ?? {}),
    },
    adjustments: (t.adjustments as Adjustments | null) ?? {},
    mode: t.mode,
  };
}

/** Alle Aktoren der Geräte eines Zelts; je Aktor das zuständige Gerät (das erste, das ihn hat). */
export function mergeCaps(devices: GrowDevice[]): {
  caps: DeviceCaps["actuators"];
  owner: Map<Actuator, number>;
  sensors: Set<Metric>;
} {
  const caps: DeviceCaps["actuators"] = [];
  const owner = new Map<Actuator, number>();
  const sensors = new Set<Metric>();
  for (const d of devices) {
    const c = d.caps as DeviceCaps;
    for (const s of c.sensors ?? []) sensors.add(s);
    for (const a of c.actuators ?? []) {
      if (owner.has(a.type)) continue;
      owner.set(a.type, d.id);
      caps.push(a);
    }
  }
  return { caps, owner, sensors };
}

export function describeCommand(cmd: Command): string {
  if (cmd.kind === "run")
    return cmd.seconds > 0
      ? `${ACTUATOR_LABEL.pump} ${cmd.seconds} s`
      : `${ACTUATOR_LABEL.pump} stopp`;
  if (cmd.kind === "dose") return `${DOSER_LABEL[cmd.channel]} ${cmd.ml} ml`;
  return `${ACTUATOR_LABEL[cmd.actuator]} ${cmd.value === 0 ? "aus" : cmd.value === 100 && cmd.actuator !== "exhaust" && cmd.actuator !== "intake" ? "an" : `${cmd.value} %`}`;
}

export async function latestReadings(
  db: Db,
  tentId: number,
  now: number,
): Promise<Partial<Record<Metric, Reading>>> {
  // je Messgröße der neueste Wert (eine Flut einer Größe verdrängt keine anderen)
  const [rows] = (await db.execute(sql`
    SELECT r.metric, r.value, r.ts FROM growReadings r
    JOIN (SELECT metric, MAX(ts) AS mts FROM growReadings WHERE tentId = ${tentId} AND ts >= ${now - 60 * 60_000} AND ts <= ${now + 60_000} GROUP BY metric) m
      ON r.metric = m.metric AND r.ts = m.mts
    WHERE r.tentId = ${tentId}`)) as unknown as [
    { metric: string; value: number; ts: number | string }[],
  ];
  const out: Partial<Record<Metric, Reading>> = {};
  for (const r of rows ?? [])
    if (!out[r.metric as Metric])
      out[r.metric as Metric] = {
        metric: r.metric as Metric,
        value: Number(r.value),
        ts: Number(r.ts),
      };
  return out;
}

/** Start des lokalen Tages (ms) in der Zeitzone des Zelts. */
export const localDayStart = (now: number, tz: string) =>
  now - localMinutes(now, tz) * 60_000 - (now % 60_000);

type Usage = {
  pumpSecondsToday: number;
  lastPumpAt: number | null;
  dosedToday: Partial<Record<DoserChannel, number>>;
  lastDoseAt: number | null;
  inFlight: Partial<Record<Actuator, number>>;
};

/** Verbrauch heute (ausgegebene Befehle zählen sofort, nicht erst nach Bestätigung) + noch offene Stellbefehle. */
export async function usage(
  db: Db,
  tentId: number,
  now: number,
  tz: string,
): Promise<Usage> {
  const since = localDayStart(now, tz);
  const rows = await db
    .select()
    .from(growCommands)
    .where(
      and(
        eq(growCommands.tentId, tentId),
        gte(growCommands.createdAt, Math.min(since, now - 26 * 3_600_000)),
        inArray(growCommands.status, [
          "pending",
          "sent",
          "done",
          "failed",
          "expired",
        ]),
      ),
    )
    .orderBy(growCommands.createdAt);
  const u: Usage = {
    pumpSecondsToday: 0,
    lastPumpAt: null,
    dosedToday: {},
    lastDoseAt: null,
    inFlight: {},
  };
  for (const r of rows) {
    const c = r.payload as Command;
    // Gießen/Dosieren zählt, sobald es ausgegeben bzw. ausgeliefert wurde – egal ob/ wann die Bestätigung kommt
    const issued = r.status === "pending" || r.sentAt != null;
    if ((c.kind === "run" || c.kind === "dose") && !issued) continue;
    if (c.kind === "run" && c.seconds > 0) {
      if (r.createdAt >= since) u.pumpSecondsToday += c.seconds;
      u.lastPumpAt = Math.max(u.lastPumpAt ?? 0, r.createdAt);
    }
    if (c.kind === "dose") {
      if (r.createdAt >= since)
        u.dosedToday[c.channel] = (u.dosedToday[c.channel] ?? 0) + c.ml;
      u.lastDoseAt = Math.max(u.lastDoseAt ?? 0, r.createdAt);
    }
    if (c.kind === "set" && (r.status === "pending" || r.status === "sent"))
      u.inFlight[c.actuator] = c.value;
  }
  return u;
}

export async function logEvent(
  db: Db,
  tentId: number,
  level: "info" | "warn" | "alarm",
  kind: string,
  message: string,
  now = Date.now(),
) {
  await db.insert(growEvents).values({
    tentId,
    level,
    kind: kind.slice(0, 40),
    message: message.slice(0, 500),
    createdAt: now,
  });
}

async function notify(db: Db, userId: number, title: string, body: string) {
  // Push ist "best effort": Fehler dürfen den Regeltakt nicht abbrechen
  try {
    const rows = await db
      .select({ token: pushTokens.token })
      .from(pushTokens)
      .where(eq(pushTokens.userId, userId));
    if (rows.length)
      await sendExpoPush(
        rows.map((r) => r.token),
        { title, body },
      );
  } catch (e) {
    console.error("[smartgrow] push failed:", (e as Error).message);
  }
}

/** Alarme: protokollieren und pushen, aber dieselbe Art höchstens einmal pro Stunde. */
async function raise(db: Db, tent: GrowTent, alerts: Alert[], now: number) {
  if (!alerts.length) return;
  const recent = await db
    .select({ kind: growEvents.kind })
    .from(growEvents)
    .where(
      and(
        eq(growEvents.tentId, tent.id),
        gte(growEvents.createdAt, now - ALERT_REPEAT_MS),
        inArray(growEvents.level, ["warn", "alarm"]),
      ),
    );
  const seen = new Set(recent.map((r) => r.kind));
  for (const a of alerts) {
    if (seen.has(a.kind)) continue;
    seen.add(a.kind);
    await logEvent(
      db,
      tent.id,
      a.level === "info" ? "info" : a.level,
      a.kind,
      a.message,
      now,
    );
    if (a.level !== "info")
      await notify(
        db,
        tent.userId,
        `${a.level === "alarm" ? "🚨" : "⚠️"} ${tent.name}`,
        a.message,
      );
  }
}

/** Befehl ausführen (Gerät holt ihn ab) bzw. im Simulator sofort anwenden. */
export async function issueCommand(
  db: Db,
  tent: GrowTent,
  device: GrowDevice,
  cmd: Command,
  reason: string,
  source: CommandSource,
  status: "pending" | "proposed",
  now: number,
) {
  if (cmd.kind === "set") {
    // ältere, noch nicht abgeholte Stellbefehle für denselben Aktor sind überholt
    await db
      .update(growCommands)
      .set({ status: "expired", result: "ersetzt" })
      .where(
        and(
          eq(growCommands.deviceId, device.id),
          eq(growCommands.actuator, cmd.actuator),
          inArray(
            growCommands.status,
            status === "proposed" ? ["proposed"] : ["pending", "proposed"],
          ),
        ),
      );
  }
  const [res] = await db.insert(growCommands).values({
    tentId: tent.id,
    deviceId: device.id,
    actuator: cmd.actuator,
    payload: cmd,
    reason: reason.slice(0, 300),
    source,
    status,
    createdAt: now,
  });
  const id = Number((res as { insertId?: number }).insertId);
  if (status === "pending" && device.kind === "simulator")
    await completeSimCommand(db, tent, device, id, cmd, now);
  if (status === "pending" && device.kind === "homeassistant")
    await completeHaCommand(db, device, id, cmd, now);
  return id;
}

/** Home Assistant: Befehl sofort über die HA-API ausführen. Pumpe: an + Zeitgeber fürs Ausschalten. */
async function completeHaCommand(
  db: Db,
  device: GrowDevice,
  id: number,
  cmd: Command,
  now: number,
) {
  const cfg = device.config as HaConfig | null;
  try {
    if (!cfg) throw new Error("Home Assistant nicht eingerichtet");
    await ha.execute(cfg, cmd);
    const state = {
      ...((device.state as Record<string, number> | null) ?? {}),
    };
    if (cmd.kind === "set") state[cmd.actuator] = cmd.value;
    if (cmd.kind === "run") {
      state.pump = cmd.seconds > 0 ? 100 : 0;
      state.pumpUntil = cmd.seconds > 0 ? now + cmd.seconds * 1000 : 0;
      if (cmd.seconds > 0) schedulePumpOff(db, device.id, cmd.seconds * 1000);
    }
    device.state = state;
    await db
      .update(growDevices)
      .set({ state, lastSeenAt: now })
      .where(eq(growDevices.id, device.id));
    await db
      .update(growCommands)
      .set({
        status: "done",
        sentAt: now,
        doneAt: now,
        result: "Home Assistant",
      })
      .where(eq(growCommands.id, id));
  } catch (e) {
    await db
      .update(growCommands)
      .set({
        status: "failed",
        sentAt: now,
        doneAt: now,
        result: (e as Error).message.slice(0, 200),
      })
      .where(eq(growCommands.id, id));
  }
}

/** Pumpe nach Ablauf ausschalten (zusätzlich prüft jeder Takt pumpUntil, falls der Server neu startet). */
function schedulePumpOff(db: Db, deviceId: number, ms: number) {
  setTimeout(() => {
    void pumpOffIfDue(db, deviceId, Date.now() + 1000);
  }, ms).unref?.();
}

async function pumpOffIfDue(db: Db, deviceId: number, now: number) {
  const [d] = await db
    .select()
    .from(growDevices)
    .where(eq(growDevices.id, deviceId))
    .limit(1);
  const st = (d?.state as Record<string, number> | null) ?? {};
  if (!d || !st.pumpUntil || now < st.pumpUntil) return;
  try {
    await ha.execute(d.config as HaConfig, {
      actuator: "pump",
      kind: "run",
      seconds: 0,
    });
    await db
      .update(growDevices)
      .set({ state: { ...st, pump: 0, pumpUntil: 0 } })
      .where(eq(growDevices.id, d.id));
  } catch (e) {
    console.error("[smartgrow] HA pump off failed:", (e as Error).message);
  }
}

/** Home Assistant abfragen: Messwerte speichern, Stellungen übernehmen, abgelaufene Pumpe aus. */
async function pollHa(
  db: Db,
  tent: GrowTent,
  d: GrowDevice,
  now: number,
): Promise<Alert | null> {
  const cfg = d.config as HaConfig | null;
  if (!cfg) return null;
  try {
    await pumpOffIfDue(db, d.id, now);
    const r = await ha.readAll(cfg);
    const prevState = (d.state as Record<string, number> | null) ?? {};
    // nur neue Messungen speichern (gleicher HA-Zeitstempel = derselbe Wert wie beim letzten Abruf)
    const fresh = r.readings.filter(
      (x) => x.ts > (prevState.lastHaPoll ?? 0) - 1000 || !prevState.lastHaPoll,
    );
    if (fresh.length)
      await db.insert(growReadings).values(
        fresh.map((x) => ({
          tentId: tent.id,
          deviceId: d.id,
          metric: x.metric,
          value: x.value,
          ts: x.ts, // echter Messzeitpunkt aus HA – alte Werte werden so als veraltet erkannt
        })),
      );
    const prev = (d.state as Record<string, number> | null) ?? {};
    const state = {
      ...prev,
      ...r.state,
      pumpUntil: prev.pumpUntil ?? 0,
      lastHaPoll: now,
    };
    d.state = state;
    d.lastSeenAt = now;
    await db
      .update(growDevices)
      .set({ state, lastSeenAt: now })
      .where(eq(growDevices.id, d.id));
    return null;
  } catch (e) {
    return {
      level: "warn",
      kind: `ha-${d.id}`,
      message: `Home Assistant („${d.name}“) nicht erreichbar: ${(e as Error).message}`,
    };
  }
}

async function completeSimCommand(
  db: Db,
  tent: GrowTent,
  device: GrowDevice,
  id: number,
  cmd: Command,
  now: number,
) {
  const cfg = tentConfig(tent);
  const sim = simApply(
    (tent.simState as SimState | null) ?? SIM_START,
    cmd,
    cfg.settings.reservoirLiters,
    cfg.automation.nutrientMlPerLiterPer01Ec,
    cfg.automation.phMlPerLiterPer01,
  );
  tent.simState = sim;
  await db
    .update(growTents)
    .set({ simState: sim })
    .where(eq(growTents.id, tent.id));
  if (cmd.kind === "set") {
    const state = {
      ...((device.state as Record<string, number> | null) ?? {}),
      [cmd.actuator]: cmd.value,
    };
    device.state = state;
    await db
      .update(growDevices)
      .set({ state })
      .where(eq(growDevices.id, device.id));
  }
  await db
    .update(growCommands)
    .set({ status: "done", sentAt: now, doneAt: now, result: "simuliert" })
    .where(eq(growCommands.id, id));
}

/** Ein Zelt einen Takt weiterrechnen. Gibt die Entscheidung zurück (für Tests/Anzeige). */
const ticking = new Set<number>();
/** Mindestabstand zwischen zwei Takten eines Zelts (Scheduler, „Jetzt rechnen“, mehrere Server-Instanzen). */
export const MIN_TICK_GAP_MS = 20_000;
const TICK_CONCURRENCY = 5;
const TICK_TIMEOUT_MS = 45_000;

/**
 * Ein Zelt einen Takt weiterrechnen – nie zweimal gleichzeitig: Sperre im Prozess plus atomarer
 * Anspruch in der Datenbank (wirkt auch über mehrere Server-Instanzen).
 */
export async function tickTent(
  db: Db,
  tent: GrowTent,
  now = Date.now(),
): Promise<ControllerOutput | null> {
  if (ticking.has(tent.id)) return null;
  ticking.add(tent.id);
  try {
    const prev = tent.lastTickAt;
    const [res] = await db
      .update(growTents)
      .set({ lastTickAt: now })
      .where(
        and(
          eq(growTents.id, tent.id),
          or(
            isNull(growTents.lastTickAt),
            lt(growTents.lastTickAt, now - MIN_TICK_GAP_MS),
          ),
        ),
      );
    if (!(res as { affectedRows?: number }).affectedRows) return null;
    tent.lastTickAt = prev; // für die Simulator-Zeitspanne
    const out = await tickTentInner(db, tent, now);
    tent.lastTickAt = now;
    return out;
  } finally {
    ticking.delete(tent.id);
  }
}

async function tickTentInner(
  db: Db,
  tent: GrowTent,
  now: number,
): Promise<ControllerOutput | null> {
  const devices = await db
    .select()
    .from(growDevices)
    .where(eq(growDevices.tentId, tent.id));
  if (!devices.length) return null;
  const cfg = tentConfig(tent);
  // ohne Add-on (außer Simulator): nur Überwachung, Alarme und Notabschaltungen – keine Regelung
  const [ownerRow] = await db
    .select({ role: users.role, smartGrowUntil: users.smartGrowUntil })
    .from(users)
    .where(eq(users.id, tent.userId))
    .limit(1);
  // kostenlos ist nur ein reines Simulator-Zelt (nach Gerätetyp, nicht nach Zelt-Flag)
  const onlySimulator = devices.every((d) => d.kind === "simulator");
  if (!onlySimulator && !hasSmartGrow(ownerRow)) cfg.mode = "off";

  // 1. Simulator: Physik weiterrechnen und Messwerte schreiben
  const sim = devices.find((d) => d.kind === "simulator");
  if (sim) {
    const minutes = Math.min(
      15,
      Math.max(0.5, (now - (tent.lastTickAt ?? now - 60_000)) / 60_000),
    );
    const s = simStep(
      (tent.simState as SimState | null) ?? SIM_START,
      (sim.state as Partial<Record<Actuator, number>> | null) ?? {},
      minutes,
    );
    tent.simState = s;
    const caps = sim.caps as DeviceCaps;
    await db
      .update(growTents)
      .set({ simState: s })
      .where(eq(growTents.id, tent.id));
    if (caps.sensors.length)
      await db.insert(growReadings).values(
        caps.sensors.map((m) => ({
          tentId: tent.id,
          deviceId: sim.id,
          metric: m,
          value: Math.round((s[m] ?? 0) * 100) / 100,
          ts: now,
        })),
      );
    await db
      .update(growDevices)
      .set({ lastSeenAt: now })
      .where(eq(growDevices.id, sim.id));
    sim.lastSeenAt = now;
  }

  // Home-Assistant-Geräte abfragen (Messwerte + Stellungen)
  const haAlerts: Alert[] = [];
  for (const d of devices) {
    if (d.kind !== "homeassistant") continue;
    const al = await pollHa(db, tent, d, now);
    if (al) haAlerts.push(al);
  }

  // abgelaufene Befehle/Vorschläge aufräumen
  await db
    .update(growCommands)
    .set({ status: "expired", result: "nicht abgeholt" })
    .where(
      and(
        eq(growCommands.tentId, tent.id),
        inArray(growCommands.status, ["pending", "sent"]),
        lt(growCommands.createdAt, now - COMMAND_TTL_MS),
      ),
    );
  await db
    .update(growCommands)
    .set({ status: "expired", result: "nicht bestätigt" })
    .where(
      and(
        eq(growCommands.tentId, tent.id),
        eq(growCommands.status, "proposed"),
        lt(growCommands.createdAt, now - PROPOSAL_TTL_MS),
      ),
    );

  // 2. Regler
  const { caps, owner, sensors } = mergeCaps(devices);
  const state: Partial<Record<Actuator, number>> = {};
  for (const d of devices)
    Object.assign(state, (d.state as Record<string, number> | null) ?? {});
  const u = await usage(db, tent.id, now, cfg.settings.timeZone);
  Object.assign(state, u.inFlight);
  const readings = await latestReadings(db, tent.id, now);
  const out = decide({
    settings: cfg.settings,
    adjustments: cfg.adjustments,
    limits: cfg.limits,
    automation: cfg.automation,
    readings,
    caps,
    state,
    pumpSecondsToday: u.pumpSecondsToday,
    lastPumpAt: u.lastPumpAt,
    dosedToday: u.dosedToday,
    lastDoseAt: u.lastDoseAt,
    now,
    sensors: [...sensors],
  });

  const alerts = [...out.alerts, ...haAlerts];
  // Home-Assistant-Kamera: bei Licht an alle 30 Minuten ein Bild für die KI-Beobachtung
  for (const d of devices) {
    const hc = d.config as HaConfig | null;
    if (d.kind !== "homeassistant" || !hc?.camera || !out.isDay) continue;
    const st = (d.state as Record<string, number> | null) ?? {};
    if (st.lastCameraAt && now - st.lastCameraAt < HA_CAMERA_INTERVAL_MS)
      continue;
    try {
      const jpeg = await ha.cameraSnapshot(hc);
      const { handleDeviceSnapshot } = await import("./camera");
      await handleDeviceSnapshot(db, tent.id, d.id, jpeg, now);
    } catch (e) {
      alerts.push({
        level: "warn",
        kind: `ha-cam-${d.id}`,
        message: `Kamera über Home Assistant: ${(e as Error).message}`,
      });
    }
    const next = { ...st, lastCameraAt: now };
    d.state = next;
    await db
      .update(growDevices)
      .set({ state: next })
      .where(eq(growDevices.id, d.id));
  }
  for (const d of devices) {
    if (
      d.kind === "http" &&
      d.lastSeenAt &&
      now - d.lastSeenAt > DEVICE_OFFLINE_MS
    ) {
      alerts.push({
        level: "warn",
        kind: `offline-${d.id}`,
        message: `Gerät „${d.name}“ meldet sich seit über 10 Minuten nicht. Es schaltet dann in seinen sicheren Notbetrieb.`,
      });
    }
  }

  // 3. Ausführen je nach Modus
  {
    const pendingProposals =
      cfg.mode === "assist"
        ? await db
            .select()
            .from(growCommands)
            .where(
              and(
                eq(growCommands.tentId, tent.id),
                eq(growCommands.status, "proposed"),
              ),
            )
        : [];
    for (const d of out.decisions) {
      const devId = owner.get(d.cmd.actuator);
      const device = devices.find((x) => x.id === devId);
      if (!device) continue;
      // Notabschaltungen laufen in jedem Modus – auch bei „Aus“
      const execute = cfg.mode === "auto" || d.safety;
      if (!execute && cfg.mode === "off") continue;
      if (execute) {
        await issueCommand(
          db,
          tent,
          device,
          d.cmd,
          d.reason,
          d.safety ? "safety" : "controller",
          "pending",
          now,
        );
        if (
          logworthy(d) &&
          !(
            d.safety &&
            (await loggedRecently(
              db,
              tent.id,
              `${describeCommand(d.cmd)} – ${d.reason}`,
              now,
            ))
          )
        )
          await logEvent(
            db,
            tent.id,
            d.safety ? "warn" : "info",
            d.safety ? "safety" : "action",
            `${describeCommand(d.cmd)} – ${d.reason}`,
            now,
          );
      } else if (
        !pendingProposals.some((p) => sameCommand(p.payload as Command, d.cmd))
      ) {
        await issueCommand(
          db,
          tent,
          device,
          d.cmd,
          d.reason,
          "controller",
          "proposed",
          now,
        );
      }
    }
  }
  await raise(db, tent, alerts, now);
  await db
    .update(growTents)
    .set({ lastTickAt: now })
    .where(eq(growTents.id, tent.id));
  tent.lastTickAt = now;
  return out;
}

/**
 * Sicherheitskontext für Hand- und Freigabe-Befehle: Stellungen ALLER Geräte + unterwegs befindliche Befehle,
 * nur gültige (frische, plausible) Messwerte und ausgefallene Sicherheitssensoren – wie im Regeltakt.
 */
export async function guardContextFor(db: Db, tent: GrowTent, now: number) {
  const cfg = tentConfig(tent);
  const devices = await db
    .select()
    .from(growDevices)
    .where(eq(growDevices.tentId, tent.id));
  const { caps, owner, sensors } = mergeCaps(devices);
  const state: Partial<Record<Actuator, number>> = {};
  for (const d of devices)
    Object.assign(state, (d.state as Record<string, number> | null) ?? {});
  const u = await usage(db, tent.id, now, cfg.settings.timeZone);
  Object.assign(state, u.inFlight);
  const readings = await latestReadings(db, tent.id, now);
  const out = decide({
    settings: cfg.settings,
    adjustments: cfg.adjustments,
    limits: cfg.limits,
    automation: cfg.automation,
    readings,
    caps,
    state,
    pumpSecondsToday: u.pumpSecondsToday,
    lastPumpAt: u.lastPumpAt,
    dosedToday: u.dosedToday,
    lastDoseAt: u.lastDoseAt,
    now,
    sensors: [...sensors],
  });
  const g: GuardContext = {
    limits: cfg.limits,
    stage: cfg.settings.stage,
    isDay: out.isDay,
    values: out.values,
    state,
    caps,
    pumpSecondsToday: u.pumpSecondsToday,
    lastPumpAt: u.lastPumpAt,
    dosedToday: u.dosedToday,
    now,
    missing: [...sensors].filter(
      (m) => out.values[m] === undefined && SAFETY_SENSORS.includes(m),
    ),
  };
  return { g, devices, owner };
}

/** Gleiche Notfall-Meldung höchstens einmal pro Stunde ins Protokoll. */
async function loggedRecently(
  db: Db,
  tentId: number,
  message: string,
  now: number,
) {
  const r = await db
    .select({ id: growEvents.id })
    .from(growEvents)
    .where(
      and(
        eq(growEvents.tentId, tentId),
        eq(growEvents.message, message.slice(0, 500)),
        gte(growEvents.createdAt, now - ALERT_REPEAT_MS),
      ),
    )
    .limit(1);
  return r.length > 0;
}

/** Sonnenauf-/untergang erzeugt jede Minute einen kleinen Dimmschritt – der gehört nicht ins Protokoll. */
const logworthy = (d: Decision) =>
  d.safety || !(d.cmd.actuator === "light" && /Sonnen/.test(d.reason));

export function sameCommand(a: Command, b: Command): boolean {
  if (a.actuator !== b.actuator || a.kind !== b.kind) return false;
  if (a.kind === "set" && b.kind === "set") return a.value === b.value;
  if (a.kind === "run" && b.kind === "run") return a.seconds === b.seconds;
  if (a.kind === "dose" && b.kind === "dose")
    return a.channel === b.channel && Math.abs(a.ml - b.ml) < 0.05;
  return false;
}

let running = false;
/** Alle Zelte einmal durchrechnen (Intervall-Aufruf). Fehler eines Zelts stoppen die anderen nicht. */
export async function tickAll(now = Date.now()): Promise<number> {
  if (running) return 0;
  running = true;
  try {
    const db = await getDb();
    if (!db) return 0;
    const tents = await db.select().from(growTents);
    // mehrere Zelte parallel, je Zelt höchstens TICK_TIMEOUT_MS – ein langsames Home Assistant bremst niemanden
    let next = 0;
    const worker = async () => {
      while (next < tents.length) {
        const t = tents[next++];
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
          await Promise.race([
            tickTent(db, t, now),
            new Promise((_, rej) => {
              timer = setTimeout(
                () => rej(new Error("Zeitüberschreitung")),
                TICK_TIMEOUT_MS,
              );
            }),
          ]);
        } catch (e) {
          console.error(
            `[smartgrow] tent ${t.id} tick failed:`,
            (e as Error).message,
          );
        } finally {
          clearTimeout(timer);
        }
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(TICK_CONCURRENCY, tents.length) }, worker),
    );
    return tents.length;
  } finally {
    running = false;
  }
}

/** Alte Messwerte löschen (30 Tage). */
export async function pruneReadings(now = Date.now()) {
  const db = await getDb();
  if (!db) return;
  // in Portionen löschen, damit die Tabelle nicht lange gesperrt ist
  for (let i = 0; i < 200; i++) {
    const [r] = (await db.execute(
      sql`DELETE FROM growReadings WHERE ts < ${now - READING_RETENTION_MS} LIMIT 5000`,
    )) as unknown as [{ affectedRows?: number }];
    if (!r?.affectedRows) break;
  }
  await db
    .delete(growEvents)
    .where(lt(growEvents.createdAt, now - 90 * 86_400_000));
  await db
    .delete(growCommands)
    .where(lt(growCommands.createdAt, now - 90 * 86_400_000));
}

export function startSmartGrowScheduler() {
  if (process.env.SMARTGROW_SCHEDULER === "0") return;
  setInterval(() => {
    tickAll().catch((e) => console.error("[smartgrow] tick failed:", e));
  }, 60_000).unref();
  setInterval(() => {
    pruneReadings().catch(() => undefined);
  }, 6 * 3_600_000).unref();
  // KI-Einschätzung: alle 15 Minuten prüfen, welche Zelte fällig sind (je Zelt alle 6 h)
  setInterval(() => {
    import("./ai")
      .then((m) => m.reviewDue())
      .catch((e) => console.error("[smartgrow] ai review failed:", e));
  }, 15 * 60_000).unref();
  console.log("[smartgrow] scheduler started");
}
