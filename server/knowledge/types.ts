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
  /** 11-character YouTube id; the video must exist (checked via oEmbed). */
  videoId: string;
  /** Title of the video, as YouTube's oEmbed reports it. */
  videoTitle: string;
  channel: string;
  /** Start of the statement in seconds. */
  start: number;
}
