/**
 * Kamera-Blattkontrolle: Bilder aus der Zelt-Kamera (Gerät) oder vom Handy werden gespeichert und von
 * der Bild-KI geprüft (Mängel, Schädlinge, Schimmel, Hitzestress). Ernste Befunde lösen einen Alarm aus.
 */
import { and, desc, eq, gte, lt, notInArray } from "drizzle-orm";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import {
  growSnapshots,
  growTents,
  pushTokens,
  type GrowTent,
} from "../../drizzle/schema";
import { STAGE_LABEL } from "../../shared/smartgrow/types";
import { sendExpoPush } from "../push";
import { logEvent, tentConfig } from "./engine";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export const KEEP_SNAPSHOTS = 12;
export const MAX_IMAGE_BYTES = 1_500_000;
/** Geräte-Bilder werden höchstens so oft geprüft (Kosten/Rate-Limit), Handy-Bilder immer. */
export const DEVICE_ANALYSIS_INTERVAL_MS = 2 * 3_600_000;

export const leafAnalysis = z.object({
  healthy: z.boolean(),
  severity: z.enum(["none", "low", "medium", "high"]),
  summary: z.string().min(1).max(600),
  issues: z.array(z.string().max(200)).max(6).default([]),
  actions: z.array(z.string().max(250)).max(5).default([]),
  /** Pflanzenbeobachtung: Phase, Größe, Farben, Blütenentwicklung (alles Schätzungen aus dem Bild) */
  observation: z
    .object({
      stage: z
        .enum([
          "seedling",
          "veg",
          "earlyFlower",
          "lateFlower",
          "flush",
          "drying",
        ])
        .nullable()
        .default(null),
      stageConfidence: z.number().min(0).max(1).default(0),
      flowerWeek: z.number().int().min(1).max(16).nullable().default(null),
      heightCm: z.number().min(1).max(400).nullable().default(null),
      canopy: z.enum(["sparse", "medium", "dense"]).nullable().default(null),
      colors: z.array(z.string().max(40)).max(5).default([]),
      purple: z.boolean().default(false),
      buds: z.string().max(200).nullable().default(null),
      trainingTip: z.string().max(200).nullable().default(null),
    })
    .partial()
    .default({}),
});
export type LeafAnalysis = z.infer<typeof leafAnalysis>;

/** JPEG-Magic-Bytes prüfen (keine beliebigen Dateien speichern). */
export function isJpeg(buf: Buffer): boolean {
  return (
    buf.length > 100 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff
  );
}

export async function saveSnapshot(
  db: Db,
  tent: GrowTent,
  deviceId: number,
  jpeg: Buffer,
  source: "device" | "app",
  now = Date.now(),
): Promise<number> {
  if (!isJpeg(jpeg)) throw new Error("Nur JPEG-Bilder");
  if (jpeg.length > MAX_IMAGE_BYTES)
    throw new Error("Bild zu groß (max. 1,5 MB)");
  const [res] = await db.insert(growSnapshots).values({
    tentId: tent.id,
    deviceId,
    image: jpeg.toString("base64"),
    source,
    createdAt: now,
  });
  const id = Number((res as { insertId?: number }).insertId);
  // nur die letzten Bilder behalten
  const keep = await db
    .select({ id: growSnapshots.id })
    .from(growSnapshots)
    .where(eq(growSnapshots.tentId, tent.id))
    .orderBy(desc(growSnapshots.createdAt))
    .limit(KEEP_SNAPSHOTS);
  if (keep.length >= KEEP_SNAPSHOTS)
    await db.delete(growSnapshots).where(
      and(
        eq(growSnapshots.tentId, tent.id),
        notInArray(
          growSnapshots.id,
          keep.map((k) => k.id),
        ),
      ),
    );
  return id;
}

export type CameraDeps = {
  vision?: (system: string, user: string, jpegB64: string) => Promise<string>;
};

async function defaultVision(
  system: string,
  user: string,
  jpegB64: string,
): Promise<string> {
  const r = await invokeLLM({
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: [
          { type: "text", text: user },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${jpegB64}`,
              detail: "high",
            },
          },
        ],
      },
    ],
    responseFormat: { type: "json_object" },
  });
  const c = r.choices[0]?.message?.content;
  return typeof c === "string" ? c : "";
}

const SYSTEM = `Du prüfst als Pflanzen-Experte Bilder aus einem Cannabis-Growzelt (legaler Eigenanbau) auf Probleme an Blättern und Blüten:
Nährstoffmangel/-überschuss (z. B. Stickstoff-, Kalium-, Calcium-/Magnesiummangel, Nährstoffbrand), pH-Probleme, Hitze- oder Lichtstress (Bleaching, eingerollte Blätter),
Überwässerung, Schädlinge (Spinnmilben, Thripse, Trauermücken, Blattläuse), Schimmel/Mehltau/Budrot. Sei vorsichtig: Nur melden, was im Bild wirklich zu sehen ist.
Ist das Bild unbrauchbar (dunkel, unscharf, keine Pflanze), sage das in summary und setze severity "none".
Beobachte außerdem die Pflanzen: Wachstumsphase (Keimling/Wachstum/frühe/späte Blüte – Blüte erkennst du an weißen Stempeln/Blütenständen), grobe Blütewoche,
geschätzte Höhe (nur wenn ein Maßstab wie Topf oder Zeltstange erkennbar ist, sonst null), Dichte des Blätterdachs, Blattfarben (z. B. "sattgrün", "hellgrün", "gelblich", "lila"),
ob sich Blüten/Blätter lila färben, Zustand der Blüten (z. B. "Stempel weiß", "Stempel zu 50 % braun") und ob Training sinnvoll wäre (z. B. Entlauben, LST).
Antworte NUR als JSON: {"healthy": bool, "severity": "none|low|medium|high", "summary": "1-3 Sätze auf Deutsch", "issues": ["…"], "actions": ["konkrete Maßnahme"],
"observation": {"stage": "seedling|veg|earlyFlower|lateFlower|null", "stageConfidence": 0-1, "flowerWeek": n|null, "heightCm": n|null, "canopy": "sparse|medium|dense|null", "colors": ["…"], "purple": bool, "buds": "…"|null, "trainingTip": "…"|null}}`;

export async function analyzeSnapshot(
  db: Db,
  tent: GrowTent,
  snapId: number,
  now = Date.now(),
  deps: CameraDeps = {},
): Promise<LeafAnalysis | null> {
  const [snap] = await db
    .select()
    .from(growSnapshots)
    .where(and(eq(growSnapshots.id, snapId), eq(growSnapshots.tentId, tent.id)))
    .limit(1);
  if (!snap) return null;
  const cfg = tentConfig(tent);
  const raw = await (deps.vision ?? defaultVision)(
    SYSTEM,
    `Phase: ${STAGE_LABEL[cfg.settings.stage]}, Substrat: ${cfg.settings.medium}. Prüfe das Bild.`,
    snap.image,
  );
  let a: LeafAnalysis;
  try {
    a = leafAnalysis.parse(
      JSON.parse(raw.replace(/^```(json)?|```$/g, "").trim()),
    );
  } catch {
    return null;
  }
  await db
    .update(growSnapshots)
    .set({ analysis: { ...a, at: now } })
    .where(eq(growSnapshots.id, snap.id));
  const level =
    a.severity === "high" ? "alarm" : a.severity === "medium" ? "warn" : "info";
  await logEvent(
    db,
    tent.id,
    level,
    "leaf-check",
    `Blattkontrolle: ${a.summary}${a.actions[0] ? ` → ${a.actions[0]}` : ""}`,
    now,
  );
  // Kamera erkennt eine andere Phase als eingestellt -> Hinweis (Phase wechselt der Nutzer selbst)
  const o = a.observation ?? {};
  if (
    o.stage &&
    o.stage !== cfg.settings.stage &&
    (o.stageConfidence ?? 0) >= 0.7
  ) {
    await logEvent(
      db,
      tent.id,
      "info",
      "cam-stage",
      `Kamera: Die Pflanzen sehen nach „${STAGE_LABEL[o.stage]}“ aus${o.flowerWeek ? ` (ca. Blütewoche ${o.flowerWeek})` : ""} – eingestellt ist „${STAGE_LABEL[cfg.settings.stage]}“. Phase prüfen?`,
      now,
    );
  }
  if (o.trainingTip)
    await logEvent(
      db,
      tent.id,
      "info",
      "cam-training",
      `Kamera-Tipp: ${o.trainingTip}`,
      now,
    );
  if (a.severity === "high" || a.severity === "medium") {
    // Push ist "best effort": ein Fehler dort darf die Blattkontrolle nicht verwerfen
    try {
      const rows = await db
        .select({ token: pushTokens.token })
        .from(pushTokens)
        .where(eq(pushTokens.userId, tent.userId));
      if (rows.length)
        await sendExpoPush(
          rows.map((r) => r.token),
          {
            title: `${a.severity === "high" ? "🚨" : "⚠️"} ${tent.name}: Blattkontrolle`,
            body: a.summary,
          },
        );
    } catch (e) {
      console.error("[smartgrow] push failed:", (e as Error).message);
    }
  }
  return a;
}

/** Geräte-Bild: speichern; prüfen nur, wenn die letzte Prüfung länger her ist. */
export async function handleDeviceSnapshot(
  db: Db,
  tentId: number,
  deviceId: number,
  jpeg: Buffer,
  now = Date.now(),
  deps: CameraDeps = {},
) {
  const [tent] = await db
    .select()
    .from(growTents)
    .where(eq(growTents.id, tentId))
    .limit(1);
  if (!tent) throw new Error("Zelt fehlt");
  const id = await saveSnapshot(db, tent, deviceId, jpeg, "device", now);
  const recent = await db
    .select({ id: growSnapshots.id, analysis: growSnapshots.analysis })
    .from(growSnapshots)
    .where(
      and(
        eq(growSnapshots.tentId, tentId),
        gte(growSnapshots.createdAt, now - DEVICE_ANALYSIS_INTERVAL_MS),
        lt(growSnapshots.id, id),
      ),
    );
  const analyzedRecently = recent.some((r) => r.analysis);
  let analyzed = false;
  if (!analyzedRecently && (process.env.GEMINI_API_KEY || deps.vision)) {
    const a = await analyzeSnapshot(db, tent, id, now, deps).catch((e) => {
      console.error("[smartgrow] leaf check failed:", (e as Error).message);
      return null;
    });
    analyzed = !!a;
  }
  return { id, analyzed };
}
