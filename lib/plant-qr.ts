// Pure helpers for per-plant QR labels. Kept free of native imports so they can be unit tested.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const QRCode = require("qrcode/lib/core/qrcode");

/** Route of the plant card; expo-router maps `<scheme>://plant/<id>` to it. */
export function plantPath(id: string): string {
  return `plant/${encodeURIComponent(id)}`;
}

/** Extracts the plant id from a deep link or path, or null if it is not a plant link. */
export function parsePlantId(url: string): string | null {
  const match = /(?:^|[/:])plant\/([^/?#]+)/.exec(url.trim());
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

/** QR modules as rows of booleans (true = dark). */
export function qrMatrix(text: string): boolean[][] {
  const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
  const size: number = qr.modules.size;
  const data: ArrayLike<number> = qr.modules.data;
  const rows: boolean[][] = [];
  for (let y = 0; y < size; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < size; x++) row.push(!!data[y * size + x]);
    rows.push(row);
  }
  return rows;
}

/** One SVG path covering all dark modules (one `M x y h1 v1 h-1z` per module). */
export function qrSvgPath(matrix: boolean[][]): string {
  let d = "";
  matrix.forEach((row, y) =>
    row.forEach((dark, x) => {
      if (dark) d += `M${x} ${y}h1v1h-1z`;
    }),
  );
  return d;
}

export function qrSvgMarkup(text: string, pixelSize = 240): string {
  const m = qrMatrix(text);
  const quiet = 2;
  const full = m.length + quiet * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${pixelSize}" height="${pixelSize}" viewBox="${-quiet} ${-quiet} ${full} ${full}" shape-rendering="crispEdges"><rect x="${-quiet}" y="${-quiet}" width="${full}" height="${full}" fill="#fff"/><path d="${qrSvgPath(m)}" fill="#000"/></svg>`;
}

export function daysSince(dateIso: string, now: Date = new Date()): number {
  const start = new Date(dateIso).getTime();
  if (Number.isNaN(start)) return 0;
  return Math.max(0, Math.floor((now.getTime() - start) / 86_400_000));
}

export interface CareEntry {
  id: string;
  date: string; // ISO
  kind: "water" | "feed";
  note?: string;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Printable label page (A6-ish) for expo-print. */
export function plantLabelHtml(opts: {
  name: string;
  strain?: string;
  link: string;
  startDate: string;
}): string {
  const start = new Date(opts.startDate);
  const startText = Number.isNaN(start.getTime())
    ? ""
    : start.toLocaleDateString("de-DE");
  return `<html><head><meta charset="utf-8"><style>
body{font-family:sans-serif;text-align:center;margin:24px}
.label{display:inline-block;border:2px dashed #888;padding:16px;border-radius:12px}
h1{font-size:22px;margin:8px 0 2px}p{margin:2px 0;color:#444;font-size:14px}
</style></head><body><div class="label">${qrSvgMarkup(opts.link, 260)}<h1>${escapeHtml(opts.name)}</h1>${opts.strain ? `<p>${escapeHtml(opts.strain)}</p>` : ""}${startText ? `<p>Eingepflanzt: ${escapeHtml(startText)}</p>` : ""}<p style="font-size:11px;color:#888">GrowMaster AI</p></div></body></html>`;
}
