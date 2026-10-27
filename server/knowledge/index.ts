import { searchEntries, type SearchOptions } from "./search";
import { KNOWLEDGE_PHASES, type KnowledgeEntry } from "./types";
import seed from "./entries/seed.json";
import growth from "./entries/growth.json";
import trainingLight from "./entries/training-light.json";
import harvest from "./entries/harvest.json";
import problems from "./entries/problems.json";
import nutrients from "./entries/nutrients.json";
import pestsDiseases from "./entries/pests-diseases.json";
import propagationTechniques from "./entries/propagation-techniques.json";
import mediaMethods from "./entries/media-methods.json";

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/** Guards against malformed entries (e.g. from generated content). */
export function isValidEntry(e: unknown): e is KnowledgeEntry {
  if (!e || typeof e !== "object") return false;
  const x = e as Record<string, unknown>;
  return (
    typeof x.id === "string" &&
    x.id.length > 0 &&
    typeof x.topic === "string" &&
    x.topic.length > 0 &&
    Array.isArray(x.phases) &&
    x.phases.length > 0 &&
    x.phases.every((p) =>
      (KNOWLEDGE_PHASES as string[]).includes(p as string),
    ) &&
    Array.isArray(x.tags) &&
    x.tags.every((t) => typeof t === "string") &&
    typeof x.text === "string" &&
    x.text.length >= 20 &&
    typeof x.videoId === "string" &&
    VIDEO_ID.test(x.videoId) &&
    typeof x.videoTitle === "string" &&
    typeof x.channel === "string" &&
    typeof x.start === "number" &&
    Number.isInteger(x.start) &&
    x.start >= 0
  );
}

function collect(...lists: unknown[][]): KnowledgeEntry[] {
  const seen = new Set<string>();
  const out: KnowledgeEntry[] = [];
  for (const list of lists) {
    for (const item of list) {
      if (isValidEntry(item) && !seen.has(item.id)) {
        seen.add(item.id);
        out.push(item);
      }
    }
  }
  return out;
}

export const KNOWLEDGE: KnowledgeEntry[] = collect(
  seed,
  growth,
  trainingLight,
  harvest,
  problems,
  nutrients,
  pestsDiseases,
  propagationTechniques,
  mediaMethods,
);

export function searchKnowledge(query: string, options?: SearchOptions) {
  return searchEntries(KNOWLEDGE, query, options);
}

export function knowledgeForPhase(phase: KnowledgeEntry["phases"][number]) {
  return KNOWLEDGE.filter((e) => e.phases.includes(phase));
}

export { KNOWLEDGE_PHASES };
export type { KnowledgeEntry };
