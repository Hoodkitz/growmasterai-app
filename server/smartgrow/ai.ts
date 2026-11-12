/**
 * KI-Einschätzung: Die KI liest alle paar Stunden den Verlauf (24 h), die Alarme, die Dosierungen und die
 * letzte Blattkontrolle und schlägt kleine Zielwert-Anpassungen vor. Die Sicherheitsschicht begrenzt sie
 * (clampAdjustments); im Autopilot werden sie übernommen, sonst als Vorschlag angezeigt.
 *
 * Die schnelle Regelung (jede Minute) macht der Regler – die KI arbeitet langsam und überlegt.
 */
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import {
  growCommands,
  growEvents,
  growReadings,
  growSnapshots,
  growTents,
  type GrowTent,
} from "../../drizzle/schema";
import { targetsFor, type Adjustments } from "../../shared/smartgrow/profiles";
import { clampAdjustments } from "../../shared/smartgrow/safety";
import {
  METRIC_INFO,
  STAGE_LABEL,
  STAGES,
  type Command,
  type Metric,
  type Stage,
} from "../../shared/smartgrow/types";
import { logEvent, tentConfig } from "./engine";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export const AI_INTERVAL_MS = 6 * 3_600_000;

export type AiSummary = {
  text: string;
  tips: string[];
  at: number;
  /** im Modus "Vorschläge": noch nicht übernommene Anpassung */
  pending?: { adjustments: Adjustments; reason: string } | null;
  stageSuggestion?: { stage: Stage; reason: string } | null;
  applied?: Adjustments | null;
};

const aiAnswer = z.object({
  summary: z.string().min(1).max(1200),
  tips: z.array(z.string().max(300)).max(5).default([]),
  adjustments: z
    .object({
      tempOffset: z.number().optional(),
      rhOffset: z.number().optional(),
      lightLevelOffset: z.number().optional(),
      ecTarget: z
        .object({ min: z.number(), max: z.number() })
        .nullable()
        .optional(),
      co2Target: z.number().nullable().optional(),
    })
    .partial()
    .default({}),
  adjustmentReason: z.string().max(400).default(""),
  stageSuggestion: z
    .object({ stage: z.enum(STAGES), reason: z.string().max(300) })
    .nullable()
    .optional(),
});

/** Kennzahlen der letzten 24 h je Messgröße. */
export async function stats24h(db: Db, tentId: number, now: number) {
  const rows = await db
    .select({
      metric: growReadings.metric,
      avg: sql<number>`avg(${growReadings.value})`,
      min: sql<number>`min(${growReadings.value})`,
      max: sql<number>`max(${growReadings.value})`,
      n: sql<number>`count(*)`,
    })
    .from(growReadings)
    .where(
      and(
        eq(growReadings.tentId, tentId),
        gte(growReadings.ts, now - 86_400_000),
      ),
    )
    .groupBy(growReadings.metric);
  return rows.map((r) => ({
    metric: r.metric as Metric,
    avg: Number(r.avg),
    min: Number(r.min),
    max: Number(r.max),
    n: Number(r.n),
  }));
}

/** Prompt bauen – nur Zahlen und Fakten, keine Nutzerdaten. */
export function buildPrompt(
  tent: GrowTent,
  stats: Awaited<ReturnType<typeof stats24h>>,
  events: { level: string; message: string }[],
  doses: string[],
  leafCheck: string | null,
  now: number,
): string {
  const cfg = tentConfig(tent);
  const tg = targetsFor(cfg.settings, cfg.adjustments, now);
  const s = cfg.settings;
  const lines = stats.map((x) => {
    const i = METRIC_INFO[x.metric];
    return `- ${i?.label ?? x.metric}: Ø ${x.avg.toFixed(2)} ${i?.unit ?? ""} (min ${x.min.toFixed(2)}, max ${x.max.toFixed(2)}, ${x.n} Werte)`;
  });
  return [
    `Phase: ${STAGE_LABEL[s.stage]} (${s.stage}), Substrat: ${s.medium}, Licht: ${tg.lightHours} h ab ${s.lightsOn}, Tank ${s.reservoirLiters} L${s.purpleFinish ? `, Lila-Finish gewünscht, Ernte geplant ${s.harvestDate ?? "unbekannt"}` : ""}.`,
    `Aktuelle Ziele: Tag ${tg.tempDay.min}–${tg.tempDay.max} °C, Nacht ${tg.tempNight.min}–${tg.tempNight.max} °C, rF ${tg.rh.min}–${tg.rh.max} %, VPD ${tg.vpd.min}–${tg.vpd.max} kPa, CO₂ ${tg.co2Target || "keine Anreicherung"}, EC ${tg.ec.min}–${tg.ec.max}, pH ${tg.ph.min}–${tg.ph.max}, Licht ${tg.lightLevel} %.`,
    `Bisherige KI-Anpassungen: ${JSON.stringify(cfg.adjustments)}`,
    `Messwerte letzte 24 h:\n${lines.join("\n") || "- keine"}`,
    `Hinweise/Alarme letzte 24 h:\n${events.map((e) => `- [${e.level}] ${e.message}`).join("\n") || "- keine"}`,
    `Dosierungen letzte 24 h: ${doses.join(", ") || "keine"}`,
    `Letzte Blattkontrolle (Kamera): ${leafCheck ?? "keine"}`,
  ].join("\n\n");
}

const SYSTEM = `Du bist ein erfahrener Indoor-Grow-Experte und steuerst als KI ein automatisiertes Cannabis-Zelt (legaler Eigenanbau).
Ein Regler hält jede Minute die Zielwerte; DU entscheidest langsam und vorsichtig, ob die Zielwerte angepasst werden sollten.
Regeln:
- Nur kleine Schritte: tempOffset −2…+2 °C, rhOffset −8…+8 %-Punkte, lightLevelOffset −20…+15 %-Punkte, ecTarget im üblichen Bereich der Phase, co2Target 0…1300 ppm.
- Keine Anpassung, wenn alles im Ziel ist – dann adjustments leer lassen.
- Bei Anzeichen von Nährstoffbrand/Überdüngung EC senken, bei Mangel vorsichtig erhöhen; bei Hitzestress Licht/Temperatur senken; bei Schimmelgefahr Luftfeuchte senken.
- Phasenwechsel nur vorschlagen (stageSuggestion), nie selbst durchführen.
- Antworte auf Deutsch, knapp und konkret. Keine Heilsversprechen.
Antworte NUR als JSON: {"summary": "2-4 Sätze Lage", "tips": ["…"], "adjustments": {"tempOffset"?: n, "rhOffset"?: n, "lightLevelOffset"?: n, "ecTarget"?: {"min": n, "max": n}, "co2Target"?: n}, "adjustmentReason": "…", "stageSuggestion": null | {"stage": "seedling|veg|earlyFlower|lateFlower|flush|drying", "reason": "…"}}`;

export type ReviewDeps = {
  llm?: (system: string, user: string) => Promise<string>;
};

async function defaultLlm(system: string, user: string): Promise<string> {
  const r = await invokeLLM({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    responseFormat: { type: "json_object" },
  });
  const c = r.choices[0]?.message?.content;
  return typeof c === "string" ? c : "";
}

/** Eine KI-Einschätzung für ein Zelt erstellen (und je nach Modus anwenden). */
export async function reviewTent(
  db: Db,
  tent: GrowTent,
  now = Date.now(),
  deps: ReviewDeps = {},
): Promise<AiSummary | null> {
  const stats = await stats24h(db, tent.id, now);
  if (!stats.length) return null;
  const cfg = tentConfig(tent);
  const events = await db
    .select({ level: growEvents.level, message: growEvents.message })
    .from(growEvents)
    .where(
      and(
        eq(growEvents.tentId, tent.id),
        gte(growEvents.createdAt, now - 86_400_000),
        inArray(growEvents.level, ["warn", "alarm"]),
      ),
    )
    .orderBy(desc(growEvents.createdAt))
    .limit(15);
  const doseRows = await db
    .select({ payload: growCommands.payload })
    .from(growCommands)
    .where(
      and(
        eq(growCommands.tentId, tent.id),
        gte(growCommands.createdAt, now - 86_400_000),
        eq(growCommands.actuator, "doser"),
        inArray(growCommands.status, ["sent", "done"]),
      ),
    );
  const doseSum: Record<string, number> = {};
  for (const r of doseRows) {
    const c = r.payload as Command;
    if (c.kind === "dose")
      doseSum[c.channel] = (doseSum[c.channel] ?? 0) + c.ml;
  }
  const snap = await db
    .select({ analysis: growSnapshots.analysis })
    .from(growSnapshots)
    .where(eq(growSnapshots.tentId, tent.id))
    .orderBy(desc(growSnapshots.createdAt))
    .limit(1);
  const leaf =
    (snap[0]?.analysis as { summary?: string } | null)?.summary ?? null;

  const prompt = buildPrompt(
    tent,
    stats,
    events,
    Object.entries(doseSum).map(
      ([k, v]) => `${k} ${Math.round(v * 10) / 10} ml`,
    ),
    leaf,
    now,
  );
  const raw = await (deps.llm ?? defaultLlm)(SYSTEM, prompt);
  let parsed: z.infer<typeof aiAnswer>;
  try {
    parsed = aiAnswer.parse(
      JSON.parse(raw.replace(/^```(json)?|```$/g, "").trim()),
    );
  } catch {
    await logEvent(
      db,
      tent.id,
      "info",
      "ai-error",
      "KI-Einschätzung konnte nicht gelesen werden – nächster Versuch später.",
      now,
    );
    await db
      .update(growTents)
      .set({ aiReviewAt: now })
      .where(eq(growTents.id, tent.id));
    return null;
  }

  // Sicherheitsschicht: begrenzen und mit bestehenden Anpassungen zusammenführen
  const proposed = clampAdjustments(
    parsed.adjustments as Adjustments,
    cfg.settings.stage,
    cfg.limits,
  );
  const hasChange = Object.keys(proposed).length > 0;
  const merged: Adjustments = { ...cfg.adjustments, ...proposed };
  const summary: AiSummary = {
    text: parsed.summary,
    tips: parsed.tips,
    at: now,
    stageSuggestion:
      parsed.stageSuggestion &&
      parsed.stageSuggestion.stage !== cfg.settings.stage
        ? parsed.stageSuggestion
        : null,
    pending:
      hasChange && cfg.mode !== "auto"
        ? { adjustments: proposed, reason: parsed.adjustmentReason }
        : null,
    applied: hasChange && cfg.mode === "auto" ? proposed : null,
  };
  const set: Partial<typeof growTents.$inferInsert> = {
    aiSummary: summary,
    aiReviewAt: now,
  };
  if (hasChange && cfg.mode === "auto") set.adjustments = merged;
  await db.update(growTents).set(set).where(eq(growTents.id, tent.id));
  tent.aiSummary = summary;
  if (hasChange && cfg.mode === "auto") {
    tent.adjustments = merged;
    await logEvent(
      db,
      tent.id,
      "info",
      "ai-adjust",
      `KI passt Ziele an (${describeAdjustments(proposed)}): ${parsed.adjustmentReason}`,
      now,
    );
  } else if (hasChange) {
    await logEvent(
      db,
      tent.id,
      "info",
      "ai-suggest",
      `KI schlägt vor (${describeAdjustments(proposed)}): ${parsed.adjustmentReason}`,
      now,
    );
  }
  if (summary.stageSuggestion)
    await logEvent(
      db,
      tent.id,
      "info",
      "ai-stage",
      `KI-Hinweis: Phase „${STAGE_LABEL[summary.stageSuggestion.stage]}“? ${summary.stageSuggestion.reason}`,
      now,
    );
  return summary;
}

export function describeAdjustments(a: Adjustments): string {
  const parts: string[] = [];
  if (a.tempOffset)
    parts.push(`Temperatur ${a.tempOffset > 0 ? "+" : ""}${a.tempOffset} °C`);
  if (a.rhOffset)
    parts.push(`Luftfeuchte ${a.rhOffset > 0 ? "+" : ""}${a.rhOffset} %`);
  if (a.lightLevelOffset)
    parts.push(
      `Licht ${a.lightLevelOffset > 0 ? "+" : ""}${a.lightLevelOffset} %`,
    );
  if (a.ecTarget) parts.push(`EC ${a.ecTarget.min}–${a.ecTarget.max}`);
  if (typeof a.co2Target === "number") parts.push(`CO₂ ${a.co2Target} ppm`);
  return parts.join(", ") || "keine";
}

/** Fällige Einschätzungen (alle 6 h, nur Zelte mit Messwerten und Modus ≠ aus). */
export async function reviewDue(now = Date.now()) {
  if (!process.env.GEMINI_API_KEY) return;
  const db = await getDb();
  if (!db) return;
  const tents = await db.select().from(growTents);
  for (const t of tents) {
    if (
      t.mode === "off" ||
      (t.aiReviewAt && now - t.aiReviewAt < AI_INTERVAL_MS)
    )
      continue;
    try {
      await reviewTent(db, t, now);
    } catch (e) {
      console.error(
        `[smartgrow] ai review tent ${t.id} failed:`,
        (e as Error).message,
      );
    }
  }
}
