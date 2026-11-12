export type KnowledgePhase =
  | "germination"
  | "seedling"
  | "vegetative"
  | "flowering"
  | "harvest";

export const KNOWLEDGE_PHASES: KnowledgePhase[] = [
  "germination",
  "seedling",
  "vegetative",
  "flowering",
  "harvest",
];

/**
 * One checked statement from a video. `text` is a German paraphrase (1-3 sentences) of what the
 * speaker says at `start`; it must not contain anything the video does not say.
 */
export interface KnowledgeEntry {
  /** Unique, kebab-case, prefixed with the topic file, e.g. "growth-repot-01". */
  id: string;
  topic: string;
  phases: KnowledgePhase[];
  /** Lower-case German search keywords, e.g. ["gießen", "überwässerung", "topf"]. */
  tags: string[];
  text: string;
  /** "video" (Standard): belegte Aussage aus einem Video. "praxis": Praxis-Tipp ohne Video, im Text als solcher gekennzeichnet. */
  source?: "video" | "praxis";
  /** 11-character YouTube id; the video must exist (checked via oEmbed). Pflicht außer bei Praxis-Tipps. */
  videoId?: string;
  /** Title of the video, as YouTube's oEmbed reports it. */
  videoTitle?: string;
  channel?: string;
  /** Start of the statement in seconds. */
  start?: number;
}
