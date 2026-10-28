import type { Remedy } from "./remedies";

export type AnswerSegment = { text: string; remedyIndex?: number };

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Splits a coach answer into plain and linked parts so product names can be
 * tappable right where they are mentioned. A `[[Name]]` marker from the model wins,
 * otherwise the first plain mention of a remedy name is linked. Each remedy is
 * linked once; markers that match no remedy are shown as plain text.
 */
export function splitAnswerWithLinks(
  answer: string,
  remedies: Remedy[],
): AnswerSegment[] {
  const text = answer.replace(/\[\[([^\]]+)\]\]/g, (_m, name: string) => {
    const idx = remedies.findIndex(
      (r) => r.name.toLowerCase() === name.trim().toLowerCase(),
    );
    return idx >= 0 ? `\u0000${idx}\u0001${name.trim()}\u0002` : name.trim();
  });

  const linked = new Set<number>();
  const segments: AnswerSegment[] = [];
  const marked = /\u0000(\d+)\u0001([^\u0002]*)\u0002/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = marked.exec(text)) !== null) {
    if (m.index > last) segments.push({ text: text.slice(last, m.index) });
    const idx = Number(m[1]);
    if (linked.has(idx)) segments.push({ text: m[2] });
    else {
      linked.add(idx);
      segments.push({ text: m[2], remedyIndex: idx });
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last) });

  // Unmarked mentions: link the first occurrence of remaining remedies.
  const out: AnswerSegment[] = [];
  for (const seg of segments) {
    if (seg.remedyIndex !== undefined) {
      out.push(seg);
      continue;
    }
    let rest = seg.text;
    for (;;) {
      let best: { index: number; len: number; idx: number } | null = null;
      remedies.forEach((r, idx) => {
        if (linked.has(idx) || !r.name.trim()) return;
        const re = new RegExp(escapeRegExp(r.name.trim()), "i");
        const hit = re.exec(rest);
        if (hit && (!best || hit.index < best.index))
          best = { index: hit.index, len: hit[0].length, idx };
      });
      if (!best) break;
      const b: { index: number; len: number; idx: number } = best;
      if (b.index > 0) out.push({ text: rest.slice(0, b.index) });
      out.push({
        text: rest.slice(b.index, b.index + b.len),
        remedyIndex: b.idx,
      });
      linked.add(b.idx);
      rest = rest.slice(b.index + b.len);
    }
    if (rest) out.push({ text: rest });
  }
  return out;
}

/** Indexes of remedies that got an inline link. */
export function linkedRemedyIndexes(segments: AnswerSegment[]): Set<number> {
  return new Set(
    segments.flatMap((s) =>
      s.remedyIndex !== undefined ? [s.remedyIndex] : [],
    ),
  );
}
