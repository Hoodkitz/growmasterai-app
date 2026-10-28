export interface FilterableEntry {
  topic: string;
  text: string;
  tags: string[];
  phases: string[];
}

/** All words must appear in topic, text or tags (case-insensitive). */
export function filterKnowledge<T extends FilterableEntry>(
  entries: T[],
  query: string,
  phase?: string,
): T[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return entries.filter((e) => {
    if (phase && !e.phases.includes(phase)) return false;
    const hay = `${e.topic} ${e.text} ${e.tags.join(" ")}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}
