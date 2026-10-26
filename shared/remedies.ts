/**
 * Remedy suggestions for plant diagnoses.
 *
 * The LLM may propose remedies; a fixed keyword catalog backs it up so every diagnosis
 * with a recognisable problem gets sensible, legal plant-care products. Only the plain
 * search term is kept: links are built by the client from the affiliate config, never
 * taken from model output.
 */

export interface Remedy {
  /** Product or measure shown to the user, e.g. "Neemöl". */
  name: string;
  /** One sentence on why it helps for this problem. */
  purpose: string;
  /** Search term used to build the shop link. */
  searchTerm: string;
}

const MAX_REMEDIES = 4;

interface CatalogEntry extends Remedy {
  keywords: RegExp;
}

const CATALOG: CatalogEntry[] = [
  {
    keywords:
      /spinnmilb|thrips|blattlaus|blattläuse|weiße fliege|weisse fliege|schädling|schaedling|ungeziefer|raupe/i,
    name: "Neemöl",
    purpose:
      "Bio-Mittel gegen Spinnmilben, Thripse und Blattläuse. Abends sprühen, nicht in der Blüte.",
    searchTerm: "Neemöl Pflanzen Schädlingsbekämpfung bio",
  },
  {
    keywords: /trauermücke|trauermuecke|fungus gnat|larven im substrat/i,
    name: "Gelbtafeln",
    purpose: "Fangen erwachsene Trauermücken ab und senken den Befall.",
    searchTerm: "Gelbtafeln Trauermücken Zimmerpflanzen",
  },
  {
    keywords:
      /schimmel|mehltau|botrytis|knospenfäule|knospenfaeule|pilzbefall/i,
    name: "Hygrometer / Thermometer",
    purpose:
      "Luftfeuchte unter Kontrolle halten, denn Schimmel und Mehltau entstehen bei zu hoher Feuchte.",
    searchTerm: "Thermo-Hygrometer digital",
  },
  {
    keywords: /schimmel|mehltau|echter mehltau/i,
    name: "Mehltau-Spray (Kaliumhydrogencarbonat)",
    purpose: "Bio-Mittel gegen Mehltau in der Wachstumsphase.",
    searchTerm: "Kaliumhydrogencarbonat Mehltau Spray Pflanzen",
  },
  {
    keywords: /stickstoff/i,
    name: "Wachstumsdünger (Stickstoff)",
    purpose:
      "Gleicht Stickstoffmangel aus, erkennbar an gelben unteren Blättern.",
    searchTerm: "Flüssigdünger Wachstum Stickstoff Pflanzen",
  },
  {
    keywords: /calcium|magnesium|cal-?mag|rostflecken|rost-?flecken/i,
    name: "Cal-Mag Ergänzung",
    purpose:
      "Versorgt mit Calcium und Magnesium bei Flecken und verformten Blättern.",
    searchTerm: "Cal-Mag Dünger Calcium Magnesium Pflanzen",
  },
  {
    keywords: /kalium|phosphor|blütedünger|bluetedünger/i,
    name: "Blütedünger (PK)",
    purpose: "Deckt Kalium- und Phosphorbedarf in der Blütephase.",
    searchTerm: "Blütedünger Phosphor Kalium flüssig",
  },
  {
    keywords: /ph-?wert|ph wert|nährstoffsperre|naehrstoffsperre|ph-?problem/i,
    name: "pH-Messgerät und pH-Down",
    purpose:
      "Ein falscher pH-Wert blockiert die Nährstoffaufnahme. Messen und gezielt korrigieren.",
    searchTerm: "pH Messgerät Wasser digital pH Minus",
  },
  {
    keywords:
      /überdüngung|ueberduengung|nährstoffverbrennung|naehrstoffverbrennung|verbrannte spitzen|verbrannt/i,
    name: "EC-Messgerät",
    purpose: "Misst den Düngegehalt, damit die Gabe nicht zu hoch wird.",
    searchTerm: "EC TDS Messgerät Wasser Pflanzen",
  },
  {
    keywords:
      /wurzelfäule|wurzelfaeule|überwässer|ueberwaesser|staunässe|zu viel wasser|überwaesser/i,
    name: "Feuchtigkeitsmesser",
    purpose:
      "Hilft, nur bei trockener Erde zu gießen und Staunässe zu vermeiden.",
    searchTerm: "Bodenfeuchtigkeitsmesser Pflanzen",
  },
  {
    keywords: /wurzelfäule|wurzelfaeule|wurzelprobleme|schwache wurzel/i,
    name: "Mykorrhiza / Wurzelstimulator",
    purpose:
      "Unterstützt die Wurzelbildung und die Regeneration geschwächter Wurzeln.",
    searchTerm: "Mykorrhiza Wurzelstimulator Pflanzen",
  },
  {
    keywords:
      /lichtbrand|lichtstress|hitzestress|zu heiß|zu heiss|zu nah an der lampe/i,
    name: "Thermo-Hygrometer",
    purpose: "Zeigt Temperatur an der Pflanze, damit Licht und Abstand passen.",
    searchTerm: "Thermo-Hygrometer digital Min Max",
  },
];

function clean(value: unknown, max: number): string {
  if (typeof value !== "string") return "";

  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** Validates remedies coming from the model; drops anything incomplete. */
export function sanitizeRemedies(input: unknown): Remedy[] {
  if (!Array.isArray(input)) return [];
  const out: Remedy[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const name = clean(r.name, 60);
    const searchTerm = clean(r.searchTerm, 80);
    if (!name || !searchTerm) continue;
    out.push({ name, purpose: clean(r.purpose, 200), searchTerm });
  }
  return out;
}

/** Catalog lookup from free text (problem description plus recommendations). */
export function suggestRemedies(text: string): Remedy[] {
  const hits: Remedy[] = [];
  for (const { keywords, name, purpose, searchTerm } of CATALOG) {
    if (keywords.test(text) && !hits.some((h) => h.name === name)) {
      hits.push({ name, purpose, searchTerm });
    }
  }
  return hits;
}

/** Model remedies first, topped up from the catalog, capped and de-duplicated by name. */
export function mergeRemedies(modelRemedies: unknown, text: string): Remedy[] {
  const merged: Remedy[] = [];
  for (const r of [
    ...sanitizeRemedies(modelRemedies),
    ...suggestRemedies(text),
  ]) {
    if (merged.some((m) => m.name.toLowerCase() === r.name.toLowerCase()))
      continue;
    merged.push(r);
    if (merged.length >= MAX_REMEDIES) break;
  }
  return merged;
}
