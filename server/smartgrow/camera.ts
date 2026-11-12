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
  const [res] = await db
    .insert(growSnapshots)
    .values({
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
Antworte NUR als JSON: {"healthy": bool, "severity": "none|low|medium|high", "summary": "1-3 Sätze auf Deutsch", "issues": ["…"], "actions": ["konkrete Maßnahme"]}`;

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
