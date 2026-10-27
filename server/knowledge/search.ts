import type { KnowledgeEntry, KnowledgePhase } from "./types";

const STOPWORDS = new Set([
  "und",
  "oder",
  "der",
  "die",
  "das",
  "den",
  "dem",
  "des",
  "ein",
  "eine",
  "einen",
  "einem",
  "ist",
  "sind",
  "war",
  "wie",
  "was",
  "wann",
  "wo",
  "warum",
  "wieso",
  "soll",
  "kann",
  "mein",
  "meine",
  "meiner",
  "meinen",
  "ich",
  "du",
  "wir",
  "mit",
  "von",
  "vom",
  "zum",
  "zur",
  "bei",
  "auf",
  "für",
  "fuer",
  "nicht",
  "kein",
  "keine",
  "auch",
  "noch",
  "nur",
  "sehr",
  "viel",
  "mehr",
  "habe",
  "haben",
  "hat",
  "wird",
  "werden",
  "muss",
  "muessen",
  "bitte",
  "gibt",
  "dass",
  "als",
  "aus",
  "nach",
  "vor",
  "über",
  "ueber",
  "wenn",
  "dann",
  "mal",
  "es",
  "im",
  "in",
  "am",
  "an",
]);

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

/** Prefix match in both directions so "giessen"/"gegossen"-style variants and plurals still hit. */
function matches(word: string, token: string): boolean {
  if (word === token) return true;
  const n = Math.min(word.length, token.length);
  return (
    n >= 5 &&
    word.startsWith(token.slice(0, 5)) &&
    (word.startsWith(token) || token.startsWith(word))
  );
}

export interface SearchOptions {
  phase?: KnowledgePhase;
  limit?: number;
  /** Entries scoring below this are dropped (default 3). */
  minScore?: number;
}

export interface ScoredEntry {
  entry: KnowledgeEntry;
  score: number;
}

export function searchEntries(
  entries: KnowledgeEntry[],
  query: string,
  options: SearchOptions = {},
): ScoredEntry[] {
  const tokens = [...new Set(tokenize(query))];
  if (tokens.length === 0) return [];
  const minScore = options.minScore ?? 3;
  const scored: ScoredEntry[] = [];
  for (const entry of entries) {
    const tagWords = entry.tags.flatMap((t) => tokenize(t));
    const topicWords = tokenize(entry.topic);
    const textWords = tokenize(entry.text);
    let score = 0;
    for (const token of tokens) {
      if (tagWords.some((w) => matches(w, token))) score += 3;
      else if (topicWords.some((w) => matches(w, token))) score += 2;
      else if (textWords.some((w) => matches(w, token))) score += 1;
    }
    if (score === 0) continue;
    if (options.phase && entry.phases.includes(options.phase)) score += 1;
    if (score >= minScore) scored.push({ entry, score });
  }
  scored.sort(
    (a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id),
  );
  return scored.slice(0, options.limit ?? 5);
}
