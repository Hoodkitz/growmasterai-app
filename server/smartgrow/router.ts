/**
 * Smart Grow – App-Schnittstelle: Zelte, Geräte, Live-Status, Verlauf, Vorschläge, Handsteuerung.
 * Jede Abfrage prüft, dass Zelt/Gerät dem angemeldeten Nutzer gehört.
 */
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  growCommands,
  growDevices,
  growEvents,
  growReadings,
  growSnapshots,
  growTents,
  type GrowTent,
} from "../../drizzle/schema";
import {
  decide,
  DEFAULT_AUTOMATION,
  lightPlan,
} from "../../shared/smartgrow/controller";
import {
  clampAdjustments,
  DEFAULT_LIMITS,
  guard,
  HARD_LIMITS,
  sanitizeLimits,
} from "../../shared/smartgrow/safety";
import { SIM_START } from "../../shared/smartgrow/simulator";
import {
  ACTUATORS,
  DOSER_CHANNELS,
  MEDIA,
  METRICS,
  MODES,
  STAGES,
  type Command,
  type DeviceCaps,
} from "../../shared/smartgrow/types";
import {
  describeCommand,
  issueCommand,
  latestReadings,
  logEvent,
  mergeCaps,
  newDeviceToken,
  tentConfig,
  tickTent,
  usage,
  guardContextFor,
} from "./engine";
import { POLL_SECONDS } from "./device-api";
import { reviewTent, describeAdjustments, type AiSummary } from "./ai";
import {
  analyzeSnapshot,
  isJpeg,
  MAX_IMAGE_BYTES,
  saveSnapshot,
} from "./camera";
import { createRateLimiter } from "../_core/rateLimit";
import * as ha from "./homeassistant";

const snapshotLimiter = createRateLimiter({ windowMs: 86_400_000, max: 20 });
const haLimiter = createRateLimiter({ windowMs: 10 * 60_000, max: 15 });

const MAX_TENTS = 10;
const MAX_DEVICES = 12;

async function db() {
  const d = await getDb();
  if (!d)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Datenbank nicht verfügbar",
    });
  return d;
}

async function ownTent(userId: number, tentId: number): Promise<GrowTent> {
  const d = await db();
  const [t] = await d
    .select()
    .from(growTents)
    .where(and(eq(growTents.id, tentId), eq(growTents.userId, userId)))
    .limit(1);
  if (!t)
    throw new TRPCError({ code: "NOT_FOUND", message: "Zelt nicht gefunden" });
  return t;
}

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Uhrzeit als HH:MM");
const settingsInput = z.object({
  stage: z.enum(STAGES),
  medium: z.enum(MEDIA),
  lightsOn: hhmm,
  lightHoursOverride: z.number().min(0).max(24).nullable().optional(),
  rampMinutes: z.number().int().min(0).max(120),
  reservoirLiters: z.number().min(1).max(1000),
  purpleFinish: z.boolean(),
  harvestDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  probesCalibratedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  timeZone: z
    .string()
    .min(3)
    .max(60)
    .refine((tz) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    }, "Unbekannte Zeitzone"),
});
const capsInput = z.object({
  sensors: z.array(z.enum(METRICS)).max(METRICS.length),
  actuators: z
    .array(
      z.object({
        type: z.enum(ACTUATORS),
        dimmable: z.boolean().optional(),
        channels: z.array(z.enum(DOSER_CHANNELS)).max(6).optional(),
      }),
    )
    .max(ACTUATORS.length),
});
const commandInput = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("set"),
    actuator: z.enum(ACTUATORS).refine((a) => a !== "pump" && a !== "doser"),
    value: z.number().min(0).max(100),
  }),
  z.object({
    kind: z.literal("run"),
    actuator: z.literal("pump"),
    seconds: z.number().min(0).max(600),
  }),
  z.object({
    kind: z.literal("dose"),
    actuator: z.literal("doser"),
    channel: z.enum(DOSER_CHANNELS),
    ml: z.number().min(0.1).max(50),
  }),
]);

/** Simulator-Zelt mit allen Sensoren und Aktoren. */
const SIM_CAPS: DeviceCaps = {
  sensors: [
    "airTemp",
    "airRh",
    "co2",
    "leafTemp",
    "waterTemp",
    "waterEc",
    "waterPh",
    "waterLevel",
    "soilMoisture",
    "soilEc",
    "soilPh",
    "ppfd",
  ],
  actuators: [
    { type: "light", dimmable: true },
    { type: "exhaust" },
    { type: "intake" },
    { type: "circulation" },
    { type: "heater" },
    { type: "humidifier" },
    { type: "dehumidifier" },
    { type: "co2" },
    { type: "pump" },
    { type: "doser", channels: ["nutrientA", "nutrientB", "phDown", "phUp"] },
  ],
};

export const smartGrowRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const d = await db();
    const tents = await d
      .select()
      .from(growTents)
      .where(eq(growTents.userId, ctx.user.id))
      .orderBy(growTents.id);
    const now = Date.now();
    return Promise.all(
      tents.map(async (t) => {
        const cfg = tentConfig(t);
        const r = await latestReadings(d, t.id, now);
        const alarms = await d
          .select({ c: sql<number>`count(*)` })
          .from(growEvents)
          .where(
            and(
              eq(growEvents.tentId, t.id),
              inArray(growEvents.level, ["warn", "alarm"]),
              gte(growEvents.createdAt, now - 3_600_000),
            ),
          );
        return {
          id: t.id,
          name: t.name,
          mode: t.mode,
          stage: cfg.settings.stage,
          simulated: !!t.simState,
          airTemp: r.airTemp?.value ?? null,
          airRh: r.airRh?.value ?? null,
          lastValueAt: Math.max(0, ...Object.values(r).map((x) => x!.ts)),
          recentAlerts: Number(alarms[0]?.c ?? 0),
        };
      }),
    );
  }),

  /** Alles für das Zelt-Dashboard: Werte, Ziele, was der Regler gerade tun würde, Geräte, Protokoll, Vorschläge. */
  get: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const t = await ownTent(ctx.user.id, input.id);
      const d = await db();
      const now = Date.now();
      const cfg = tentConfig(t);
      const devices = await d
        .select()
        .from(growDevices)
        .where(eq(growDevices.tentId, t.id));
      const { caps, sensors } = mergeCaps(devices);
      const state: Record<string, number> = {};
      for (const dev of devices)
        Object.assign(
          state,
          (dev.state as Record<string, number> | null) ?? {},
        );
      const u = await usage(d, t.id, now, cfg.settings.timeZone);
      const readings = await latestReadings(d, t.id, now);
      const preview = decide({
        settings: cfg.settings,
        adjustments: cfg.adjustments,
        limits: cfg.limits,
        automation: cfg.automation,
        readings,
        caps,
        state: { ...state, ...u.inFlight },
        pumpSecondsToday: u.pumpSecondsToday,
        lastPumpAt: u.lastPumpAt,
        dosedToday: u.dosedToday,
        lastDoseAt: u.lastDoseAt,
        now,
      });
      const events = await d
        .select()
        .from(growEvents)
        .where(eq(growEvents.tentId, t.id))
        .orderBy(desc(growEvents.createdAt))
        .limit(40);
      const proposals = await d
        .select()
        .from(growCommands)
        .where(
          and(
            eq(growCommands.tentId, t.id),
            eq(growCommands.status, "proposed"),
          ),
        )
        .orderBy(desc(growCommands.createdAt))
        .limit(20);
      const snap = await d
        .select()
        .from(growSnapshots)
        .where(eq(growSnapshots.tentId, t.id))
        .orderBy(desc(growSnapshots.createdAt))
        .limit(1);
      return {
        id: t.id,
        name: t.name,
        mode: t.mode,
        settings: cfg.settings,
        limits: cfg.limits,
        automation: cfg.automation,
        adjustments: cfg.adjustments,
        simulated: !!t.simState,
        aiSummary: t.aiSummary as AiSummary | null,
        aiEnabled: !!process.env.GEMINI_API_KEY,
        readings,
        sensors: [...sensors],
        caps,
        state,
        usage: {
          pumpSecondsToday: u.pumpSecondsToday,
          dosedToday: u.dosedToday,
        },
        targets: preview.targets,
        isDay: preview.isDay,
        dayProgress: preview.dayProgress,
        vpd: preview.vpd,
        light: lightPlan(cfg.settings, preview.targets, now),
        alerts: preview.alerts,
        next: preview.decisions.map((x) => ({
          text: describeCommand(x.cmd),
          reason: x.reason,
          safety: !!x.safety,
        })),
        blocked: preview.blocked.map((b) => ({
          text: describeCommand(b.cmd),
          reason: b.reason,
        })),
        devices: devices.map((dev) => ({
          id: dev.id,
          name: dev.name,
          kind: dev.kind,
          caps: dev.caps as DeviceCaps,
          lastSeenAt: dev.lastSeenAt,
          firmware: dev.firmware,
          tokenHint: dev.tokenHint,
          online:
            dev.kind === "simulator" ||
            (!!dev.lastSeenAt && now - dev.lastSeenAt < 5 * 60_000),
        })),
        events: events.map((e) => ({
          id: e.id,
          level: e.level,
          kind: e.kind,
          message: e.message,
          at: e.createdAt,
        })),
        proposals: proposals.map((p) => ({
          id: p.id,
          text: describeCommand(p.payload as Command),
          reason: p.reason,
          at: p.createdAt,
        })),
        lastSnapshot: snap[0]
          ? {
              id: snap[0].id,
              at: snap[0].createdAt,
              analysis: snap[0].analysis,
            }
          : null,
        hardLimits: HARD_LIMITS,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(80),
        settings: settingsInput,
        simulator: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const d = await db();
      const n = await d
        .select({ c: sql<number>`count(*)` })
        .from(growTents)
        .where(eq(growTents.userId, ctx.user.id));
      if (Number(n[0]?.c ?? 0) >= MAX_TENTS)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Höchstens ${MAX_TENTS} Zelte.`,
        });
      const [res] = await d.insert(growTents).values({
        userId: ctx.user.id,
        name: input.name,
        settings: input.settings,
        limits: DEFAULT_LIMITS,
        automation: DEFAULT_AUTOMATION,
        adjustments: {},
        mode: input.simulator ? "auto" : "assist",
        simState: input.simulator ? SIM_START : null,
      });
      const id = Number((res as { insertId?: number }).insertId);
      if (input.simulator) {
        await d.insert(growDevices).values({
          tentId: id,
          userId: ctx.user.id,
          name: "Simulator",
          kind: "simulator",
          caps: SIM_CAPS,
          state: { light: 0, exhaust: 30, intake: 24, circulation: 50 },
        });
        await logEvent(
          d,
          id,
          "info",
          "created",
          "Simulator-Zelt angelegt – der Autopilot regelt ein virtuelles Zelt, damit du alles ohne Hardware testen kannst.",
        );
      } else {
        await logEvent(
          d,
          id,
          "info",
          "created",
          "Zelt angelegt. Verbinde jetzt deine Sensoren und Geräte.",
        );
      }
      return { id };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int(),
        name: z.string().trim().min(1).max(80).optional(),
        settings: settingsInput.optional(),
        limits: z.record(z.string(), z.number()).optional(),
        automation: z
          .object({
            shotSeconds: z.number().int().min(1).max(600),
            scheduleEveryHours: z.number().min(0).max(72),
            nutrientMlPerLiterPer01Ec: z.number().min(0.01).max(2),
            phMlPerLiterPer01: z.number().min(0.001).max(1),
            mixMinutes: z.number().int().min(5).max(240),
          })
          .partial()
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const t = await ownTent(ctx.user.id, input.id);
      const d = await db();
      const cfg = tentConfig(t);
      const set: Partial<typeof growTents.$inferInsert> = {};
      if (input.name) set.name = input.name;
      if (input.settings) {
        set.settings = input.settings;
        if (input.settings.stage !== cfg.settings.stage) set.adjustments = {}; // neue Phase: KI-Anpassungen zurücksetzen
      }
      if (input.limits)
        set.limits = sanitizeLimits({ ...cfg.limits, ...input.limits });
      if (input.automation)
        set.automation = { ...cfg.automation, ...input.automation };
      await d.update(growTents).set(set).where(eq(growTents.id, t.id));
      const changes = [
        input.settings && input.settings.stage !== cfg.settings.stage
          ? `Phase: ${input.settings.stage}`
          : null,
        input.limits ? "Sicherheitsgrenzen geändert" : null,
      ].filter(Boolean);
      if (changes.length)
        await logEvent(d, t.id, "info", "settings", changes.join(", "));
      return { ok: true as const };
    }),

  setMode: protectedProcedure
    .input(z.object({ id: z.number().int(), mode: z.enum(MODES) }))
    .mutation(async ({ ctx, input }) => {
      const t = await ownTent(ctx.user.id, input.id);
      const d = await db();
      await d
        .update(growTents)
        .set({ mode: input.mode })
        .where(eq(growTents.id, t.id));
      if (input.mode !== "assist")
        await d
          .update(growCommands)
          .set({ status: "expired", result: "Modus geändert" })
          .where(
            and(
              eq(growCommands.tentId, t.id),
              eq(growCommands.status, "proposed"),
            ),
          );
      await logEvent(
        d,
        t.id,
        "info",
        "mode",
        input.mode === "auto"
          ? "Autopilot an: Die KI regelt innerhalb der Sicherheitsgrenzen selbst."
          : input.mode === "assist"
            ? "Vorschlags-Modus: Die KI schlägt vor, du bestätigst. Notabschaltungen laufen automatisch."
            : "Autopilot aus: nur Überwachung und Alarme.",
      );
      return { ok: true as const };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const t = await ownTent(ctx.user.id, input.id);
      const d = await db();
      await d.transaction(async (tx) => {
        for (const tbl of [
          growReadings,
          growCommands,
          growEvents,
          growSnapshots,
          growDevices,
        ] as const)
          await tx.delete(tbl).where(eq(tbl.tentId, t.id));
        await tx.delete(growTents).where(eq(growTents.id, t.id));
      });
      return { ok: true as const };
    }),

  /** Neues Gerät: das Token wird nur jetzt im Klartext gezeigt. */
  addDevice: protectedProcedure
    .input(
      z.object({
        tentId: z.number().int(),
        name: z.string().trim().min(1).max(80),
        caps: capsInput,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const t = await ownTent(ctx.user.id, input.tentId);
      const d = await db();
      const n = await d
        .select({ c: sql<number>`count(*)` })
        .from(growDevices)
        .where(eq(growDevices.tentId, t.id));
      if (Number(n[0]?.c ?? 0) >= MAX_DEVICES)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Höchstens ${MAX_DEVICES} Geräte je Zelt.`,
        });
      const tok = newDeviceToken();
      const caps: DeviceCaps = {
        sensors: [...new Set(input.caps.sensors)],
        actuators: input.caps.actuators.filter(
          (a, i, arr) => arr.findIndex((b) => b.type === a.type) === i,
        ),
      };
      const [res] = await d.insert(growDevices).values({
        tentId: t.id,
        userId: ctx.user.id,
        name: input.name,
        kind: "http",
        tokenHash: tok.hash,
        tokenHint: tok.hint,
        caps,
        state: {},
      });
      await logEvent(
        d,
        t.id,
        "info",
        "device",
        `Gerät „${input.name}“ hinzugefügt.`,
      );
      return {
        id: Number((res as { insertId?: number }).insertId),
        token: tok.token,
        endpoint: "/api/device/v1/report",
        pollSeconds: POLL_SECONDS,
      };
    }),

  rotateDeviceToken: protectedProcedure
    .input(z.object({ deviceId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const d = await db();
      const [dev] = await d
        .select()
        .from(growDevices)
        .where(
          and(
            eq(growDevices.id, input.deviceId),
            eq(growDevices.userId, ctx.user.id),
          ),
        )
        .limit(1);
      if (!dev || dev.kind !== "http")
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Gerät nicht gefunden",
        });
      const tok = newDeviceToken();
      await d
        .update(growDevices)
        .set({ tokenHash: tok.hash, tokenHint: tok.hint })
        .where(eq(growDevices.id, dev.id));
      return { token: tok.token };
    }),

  removeDevice: protectedProcedure
    .input(z.object({ deviceId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const d = await db();
      const [dev] = await d
        .select()
        .from(growDevices)
        .where(
          and(
            eq(growDevices.id, input.deviceId),
            eq(growDevices.userId, ctx.user.id),
          ),
        )
        .limit(1);
      if (!dev)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Gerät nicht gefunden",
        });
      await d
        .update(growCommands)
        .set({ status: "expired", result: "Gerät entfernt" })
        .where(
          and(
            eq(growCommands.deviceId, dev.id),
            inArray(growCommands.status, ["pending", "sent", "proposed"]),
          ),
        );
      await d.delete(growDevices).where(eq(growDevices.id, dev.id));
      await logEvent(
        d,
        dev.tentId,
        "info",
        "device",
        `Gerät „${dev.name}“ entfernt.`,
      );
      return { ok: true as const };
    }),

  /** Verlauf einer Messgröße, auf höchstens ~200 Punkte verdichtet. */
  history: protectedProcedure
    .input(
      z.object({
        tentId: z.number().int(),
        metric: z.enum(METRICS),
        hours: z
          .number()
          .int()
          .min(1)
          .max(24 * 30)
          .default(24),
      }),
    )
    .query(async ({ ctx, input }) => {
      await ownTent(ctx.user.id, input.tentId);
      const d = await db();
      const since = Date.now() - input.hours * 3_600_000;
      const bucket = Math.max(
        60_000,
        Math.round((input.hours * 3_600_000) / 200),
      );
      const rows = await d
        .select({
          b: sql<number>`floor(${growReadings.ts} / ${bucket})`,
          v: sql<number>`avg(${growReadings.value})`,
          lo: sql<number>`min(${growReadings.value})`,
          hi: sql<number>`max(${growReadings.value})`,
        })
        .from(growReadings)
        .where(
          and(
            eq(growReadings.tentId, input.tentId),
            eq(growReadings.metric, input.metric),
            gte(growReadings.ts, since),
          ),
        )
        .groupBy(sql`floor(${growReadings.ts} / ${bucket})`)
        .orderBy(sql`floor(${growReadings.ts} / ${bucket})`);
      return rows.map((r) => ({
        t: Number(r.b) * bucket,
        v: Math.round(Number(r.v) * 100) / 100,
        lo: Number(r.lo),
        hi: Number(r.hi),
      }));
    }),

  /** Handsteuerung: läuft durch dieselbe Sicherheitsprüfung wie der Autopilot. */
  command: protectedProcedure
    .input(z.object({ tentId: z.number().int(), cmd: commandInput }))
    .mutation(async ({ ctx, input }) => {
      const t = await ownTent(ctx.user.id, input.tentId);
      const d = await db();
      const now = Date.now();
      const cmd = input.cmd as Command;
      const { g: ctxG, devices, owner } = await guardContextFor(d, t, now);
      const g = guard(cmd, ctxG);
      if (!g.ok)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Sicherheitsprüfung: ${g.reason}`,
        });
      const device = devices.find((x) => x.id === owner.get(cmd.actuator));
      if (!device)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Kein Gerät für diesen Aktor verbunden.",
        });
      const id = await issueCommand(
        d,
        t,
        device,
        g.cmd,
        "von Hand",
        "user",
        "pending",
        now,
      );
      await logEvent(
        d,
        t.id,
        "info",
        "manual",
        `${describeCommand(g.cmd)} – von Hand${g.note ? ` (${g.note})` : ""}`,
        now,
      );
      if (t.mode === "auto")
        await logEvent(
          d,
          t.id,
          "info",
          "manual-hint",
          "Hinweis: Im Autopilot kann der Regler die Stellung beim nächsten Takt wieder anpassen.",
          now,
        );
      return { id, cmd: g.cmd };
    }),

  /** Vorschlag bestätigen oder ablehnen (Modus „Vorschläge“). */
  decide: protectedProcedure
    .input(z.object({ commandId: z.number().int(), approve: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const d = await db();
      const [c] = await d
        .select()
        .from(growCommands)
        .where(eq(growCommands.id, input.commandId))
        .limit(1);
      if (!c) throw new TRPCError({ code: "NOT_FOUND" });
      const t = await ownTent(ctx.user.id, c.tentId);
      if (c.status !== "proposed")
        throw new TRPCError({
          code: "CONFLICT",
          message: "Vorschlag ist nicht mehr aktuell.",
        });
      const now = Date.now();
      let g: ReturnType<typeof guard> | null = null;
      let device: typeof growDevices.$inferSelect | undefined;
      if (input.approve) {
        // erst prüfen (Lage kann sich geändert haben) – bei Ablehnung bleibt der Vorschlag bestehen
        const ctxAll = await guardContextFor(d, t, now);
        device = ctxAll.devices.find((x) => x.id === c.deviceId);
        if (!device)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Gerät nicht mehr vorhanden",
          });
        g = guard(c.payload as Command, ctxAll.g);
        if (!g.ok)
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: `Sicherheitsprüfung: ${g.reason}`,
          });
      }
      // atomar beanspruchen: doppelte Bestätigung führt nicht zu zwei Befehlen
      const [res] = await d
        .update(growCommands)
        .set({
          status: input.approve ? "expired" : "rejected",
          result: input.approve ? "bestätigt" : "abgelehnt",
        })
        .where(
          and(eq(growCommands.id, c.id), eq(growCommands.status, "proposed")),
        );
      if (!(res as { affectedRows?: number }).affectedRows)
        throw new TRPCError({
          code: "CONFLICT",
          message: "Vorschlag wurde schon bearbeitet.",
        });
      if (!input.approve || !g?.ok || !device) return { ok: true as const };
      await issueCommand(
        d,
        t,
        device,
        g.cmd,
        `${c.reason} (bestätigt)`,
        "controller",
        "pending",
        now,
      );
      await logEvent(
        d,
        t.id,
        "info",
        "approved",
        `${describeCommand(g.cmd)} – bestätigt: ${c.reason}`,
        now,
      );
      return { ok: true as const };
    }),

  /** Einen Takt sofort rechnen (z. B. nach dem Anlegen, statt auf die nächste Minute zu warten). */
  tick: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const t = await ownTent(ctx.user.id, input.id);
      const d = await db();
      await tickTent(d, t); // tickTent verhindert selbst doppelte/zu schnelle Takte
      return { ok: true as const };
    }),

  /** KI-Einschätzung jetzt anfordern (höchstens alle 10 Minuten). */
  aiReview: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const t = await ownTent(ctx.user.id, input.id);
      if (t.aiReviewAt && Date.now() - t.aiReviewAt < 10 * 60_000) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Die letzte Einschätzung ist keine 10 Minuten alt.",
        });
      }
      if (!process.env.GEMINI_API_KEY)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "KI ist auf dem Server nicht eingerichtet.",
        });
      const d = await db();
      const r = await reviewTent(d, t);
      if (!r)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Noch zu wenige Messwerte für eine Einschätzung.",
        });
      return r;
    }),

  /** Vorgeschlagene KI-Anpassung übernehmen oder verwerfen (Modus „Vorschläge“). */
  aiDecide: protectedProcedure
    .input(z.object({ id: z.number().int(), apply: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const t = await ownTent(ctx.user.id, input.id);
      const d = await db();
      const cfg = tentConfig(t);
      const summary = t.aiSummary as AiSummary | null;
      if (!summary?.pending)
        throw new TRPCError({
          code: "CONFLICT",
          message: "Kein offener KI-Vorschlag.",
        });
      const next: AiSummary = { ...summary, pending: null };
      const set: Partial<typeof growTents.$inferInsert> = { aiSummary: next };
      if (input.apply) {
        // erneut begrenzen (Phase/Grenzen können sich geändert haben)
        const adj = clampAdjustments(
          summary.pending.adjustments,
          cfg.settings.stage,
          cfg.limits,
        );
        set.adjustments = { ...cfg.adjustments, ...adj };
        next.applied = adj;
        await logEvent(
          d,
          t.id,
          "info",
          "ai-adjust",
          `KI-Vorschlag übernommen: ${describeAdjustments(adj)}`,
        );
      }
      await d.update(growTents).set(set).where(eq(growTents.id, t.id));
      return { ok: true as const };
    }),

  /** Alle KI-Anpassungen zurücksetzen (zurück auf die Richtwerte der Phase). */
  resetAdjustments: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const t = await ownTent(ctx.user.id, input.id);
      const d = await db();
      await d
        .update(growTents)
        .set({ adjustments: {} })
        .where(eq(growTents.id, t.id));
      await logEvent(
        d,
        t.id,
        "info",
        "ai-reset",
        "KI-Anpassungen zurückgesetzt – es gelten die Richtwerte der Phase.",
      );
      return { ok: true as const };
    }),

  /** Foto vom Handy für die Blattkontrolle (JPEG, Base64). */
  uploadSnapshot: protectedProcedure
    .input(
      z.object({
        tentId: z.number().int(),
        jpegBase64: z.string().min(200).max(2_100_000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const t = await ownTent(ctx.user.id, input.tentId);
      if (!snapshotLimiter.check(`u:${ctx.user.id}`).allowed)
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Höchstens 20 Fotos pro Tag.",
        });
      const buf = Buffer.from(
        input.jpegBase64.replace(/^data:image\/jpeg;base64,/, ""),
        "base64",
      );
      if (!isJpeg(buf))
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Bitte ein JPEG-Foto.",
        });
      if (buf.length > MAX_IMAGE_BYTES)
        throw new TRPCError({
          code: "PAYLOAD_TOO_LARGE",
          message: "Foto zu groß (max. 1,5 MB).",
        });
      const d = await db();
      const id = await saveSnapshot(d, t, 0, buf, "app");
      const analysis = process.env.GEMINI_API_KEY
        ? await analyzeSnapshot(d, t, id)
        : null;
      return { id, analysis };
    }),

  /** Ein gespeichertes Bild (für die Anzeige). */
  snapshotImage: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const d = await db();
      const [s] = await d
        .select()
        .from(growSnapshots)
        .where(eq(growSnapshots.id, input.id))
        .limit(1);
      if (!s) throw new TRPCError({ code: "NOT_FOUND" });
      await ownTent(ctx.user.id, s.tentId);
      return {
        id: s.id,
        at: s.createdAt,
        source: s.source,
        dataUri: `data:image/jpeg;base64,${s.image}`,
        analysis: s.analysis,
      };
    }),

  /** Home Assistant: Verbindung testen und Entitäten für die Zuordnung liefern. */
  haEntities: protectedProcedure
    .input(
      z.object({
        baseUrl: z.string().max(300),
        token: z.string().min(20).max(400),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!haLimiter.check(`u:${ctx.user.id}`).allowed)
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Zu viele Versuche – bitte kurz warten.",
        });
      try {
        const base = await ha.validateBaseUrl(input.baseUrl);
        const entities = await ha.listEntities(base, input.token.trim());
        return { baseUrl: base, entities };
      } catch (e) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: (e as Error).message,
        });
      }
    }),

  /** Home-Assistant-Gerät anlegen: Sensoren/Aktoren ihren HA-Entitäten zuordnen. */
  addHaDevice: protectedProcedure
    .input(
      z.object({
        tentId: z.number().int(),
        name: z.string().trim().min(1).max(80),
        baseUrl: z.string().max(300),
        token: z.string().min(20).max(400),
        sensors: z.record(
          z.enum(METRICS),
          z.string().refine(ha.isEntityId, "Ungültige Entität"),
        ),
        actuators: z.record(
          z
            .enum(ACTUATORS)
            .refine(
              (a) => a !== "doser",
              "Dosierpumpen nicht über Home Assistant",
            ),
          z.string().refine(ha.isEntityId, "Ungültige Entität"),
        ),
        dimmableLight: z.boolean().default(false),
        camera: z
          .string()
          .refine(ha.isCameraEntity, "Ungültige Kamera")
          .nullable()
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const t = await ownTent(ctx.user.id, input.tentId);
      const d = await db();
      const n = await d
        .select({ c: sql<number>`count(*)` })
        .from(growDevices)
        .where(eq(growDevices.tentId, t.id));
      if (Number(n[0]?.c ?? 0) >= MAX_DEVICES)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Höchstens ${MAX_DEVICES} Geräte je Zelt.`,
        });
      let base: string;
      try {
        base = await ha.validateBaseUrl(input.baseUrl);
        await ha.listEntities(base, input.token.trim()); // Zugang prüfen, bevor gespeichert wird
      } catch (e) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: (e as Error).message,
        });
      }
      const cfg: ha.HaConfig = {
        baseUrl: base,
        tokenEnc: ha.encryptToken(input.token.trim()),
        sensors: input.sensors,
        actuators: input.actuators as ha.HaActuatorMap,
        camera: input.camera ?? null,
      };
      const caps: DeviceCaps = {
        sensors: Object.keys(input.sensors) as DeviceCaps["sensors"],
        actuators: (
          Object.keys(
            input.actuators,
          ) as DeviceCaps["actuators"][number]["type"][]
        ).map((a) => ({
          type: a,
          ...(a === "light" ? { dimmable: input.dimmableLight } : {}),
        })),
      };
      const [res] = await d.insert(growDevices).values({
        tentId: t.id,
        userId: ctx.user.id,
        name: input.name,
        kind: "homeassistant",
        caps,
        state: {},
        config: cfg,
      });
      await logEvent(
        d,
        t.id,
        "info",
        "device",
        `Home Assistant „${input.name}“ verbunden (${caps.sensors.length} Sensoren, ${caps.actuators.length} Geräte).`,
      );
      return { id: Number((res as { insertId?: number }).insertId) };
    }),

  /** Kamera-Verlauf: die letzten Beobachtungen (ohne Bilddaten) für Trends wie Höhe, Farben, Phase. */
  observations: protectedProcedure
    .input(z.object({ tentId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      await ownTent(ctx.user.id, input.tentId);
      const d = await db();
      const rows = await d
        .select({
          id: growSnapshots.id,
          at: growSnapshots.createdAt,
          source: growSnapshots.source,
          analysis: growSnapshots.analysis,
        })
        .from(growSnapshots)
        .where(eq(growSnapshots.tentId, input.tentId))
        .orderBy(desc(growSnapshots.createdAt))
        .limit(12);
      return rows;
    }),
});
