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

/**
 * Equipment and care products for the Grow Coach, keyed on the topics the coach talks
 * about (the problem catalog above only covers diagnoses). Same rule as above: only the
 * search term is kept, links are built by the client.
 */
const COACH_CATALOG: CatalogEntry[] = [
  {
    keywords: /trichom|lupe|erntezeitpunkt|erntereif|bernstein/i,
    name: "Lupe / Mikroskop-Aufsatz (Trichome prüfen)",
    purpose:
      "Damit erkennst du, ob die Trichome klar, milchig oder schon bernsteinfarben sind.",
    searchTerm: "Taschenmikroskop 60x LED Lupe Pflanzen",
  },
  {
    keywords: /topping|toppen|beschneid|trimmen|entlaub|lollipop|schere/i,
    name: "Präzisions-Pflanzenschere",
    purpose: "Saubere Schnitte beim Toppen, Entlauben und Ernten.",
    searchTerm: "Präzisionsschere Pflanzen Bonsai Schere",
  },
  {
    keywords:
      /\blst\b|low.?stress|runterbinden|herunterbinden|pflanzenclips|biegen/i,
    name: "Pflanzenclips / Bindedraht (Training)",
    purpose: "Zum sanften Herunterbinden und Formen der Pflanze (LST).",
    searchTerm: "Pflanzenclips Bindedraht Pflanzen Training",
  },
  {
    keywords: /growzelt|growbox|anbauzelt|\bzelt\b/i,
    name: "Growzelt",
    purpose: "Lichtdichter, geschlossener Anbauraum mit konstantem Klima.",
    searchTerm: "Growzelt 80x80 Growbox",
  },
  {
    keywords:
      /pflanzenlampe|led.?lampe|beleuchtung|lampenabstand|vollspektrum|vergeil/i,
    name: "Dimmbare LED-Pflanzenlampe",
    purpose: "Lässt sich im Abstand und in der Leistung an die Phase anpassen.",
    searchTerm: "LED Pflanzenlampe dimmbar Vollspektrum",
  },
  {
    keywords: /keimen|keimung|anzucht|sämling|saemling|keimling/i,
    name: "Anzuchterde",
    purpose:
      "Leicht vorgedüngte, feine Erde für Keimung und die ersten Wochen.",
    searchTerm: "Anzuchterde torffrei",
  },
  {
    keywords: /keimen|keimung|anzucht|mini.?gewächshaus|gewaechshaus/i,
    name: "Mini-Gewächshaus / Anzuchtbox",
    purpose: "Hält Feuchtigkeit und Temperatur bei der Keimung konstant.",
    searchTerm: "Mini Gewächshaus Anzuchtbox mit Deckel",
  },
  {
    keywords: /samenschale|pinzette/i,
    name: "Präzisionspinzette",
    purpose: "Zum vorsichtigen Entfernen einer hängenden Samenschale.",
    searchTerm: "Präzisionspinzette Edelstahl",
  },
  {
    keywords:
      /umtopf|umgetopft|topfe\w* .{0,15}\bum\b|topfgröße|topfgroesse|stofftopf|fabric ?pot/i,
    name: "Stofftöpfe (Fabric Pots)",
    purpose:
      "Luftdurchlässige Töpfe für gesündere Wurzeln und einfaches Umtopfen.",
    searchTerm: "Stofftopf Pflanzen 11 Liter",
  },
  {
    keywords: /trocknen|trocknung|trockenphase/i,
    name: "Trocknungsnetz zum Aufhängen",
    purpose: "Zum gleichmäßigen, schonenden Trocknen der Blüten.",
    searchTerm: "Trocknungsnetz hängend faltbar Kräuter",
  },
  {
    keywords: /curing|fermentier|lagern|einmachglas|weck/i,
    name: "Einmachgläser (Curing)",
    purpose: "Luftdichtes Lagern und Curen nach dem Trocknen.",
    searchTerm: "Einmachgläser Weck 1 Liter",
  },
  {
    keywords: /geruch|abluft|aktivkohle|geruchsfilter/i,
    name: "Aktivkohlefilter mit Abluft",
    purpose: "Bindet Gerüche und sorgt für Luftaustausch im Zelt.",
    searchTerm: "Aktivkohlefilter Abluft Growzelt 100mm",
  },
  {
    keywords: /luftfeuchte|luftfeuchtigkeit|temperatur|raumklima/i,
    name: "Thermo-Hygrometer",
    purpose:
      "Zeigt Temperatur und Luftfeuchte, damit das Klima zur Phase passt.",
    searchTerm: "Thermo-Hygrometer digital Min Max",
  },
  {
    keywords: /gieß|giess|staunässe|staunaesse|übergossen|uebergossen/i,
    name: "Bodenfeuchtigkeitsmesser",
    purpose: "Hilft, nur bei trockener Erde zu gießen.",
    searchTerm: "Bodenfeuchtigkeitsmesser Pflanzen",
  },
  {
    keywords: /dünge|duenge|dünger|duenger|nährstoff|naehrstoff/i,
    name: "Pflanzendünger (Wachstum/Blüte)",
    purpose:
      "Bio- oder Mineraldünger passend zur Phase, nach Packungsangabe dosiert.",
    searchTerm: "Pflanzendünger Wachstum Blüte flüssig",
  },
];

/** Catalog lookup for coach topics. */
export function suggestCoachProducts(text: string): Remedy[] {
  const hits: Remedy[] = [];
  for (const { keywords, name, purpose, searchTerm } of COACH_CATALOG) {
    if (keywords.test(text) && !hits.some((h) => h.name === name)) {
      hits.push({ name, purpose, searchTerm });
    }
  }
  return hits;
}

/**
 * Coach products: model proposals first, then the coach catalog, then the problem
 * catalog (pH meter, Cal-Mag, ...), capped and de-duplicated by name.
 */
export function mergeCoachProducts(
  modelProducts: unknown,
  text: string,
): Remedy[] {
  const merged: Remedy[] = [];
  for (const r of [
    ...sanitizeRemedies(modelProducts),
    ...suggestCoachProducts(text),
    ...suggestRemedies(text),
  ]) {
    if (merged.some((m) => m.name.toLowerCase() === r.name.toLowerCase()))
      continue;
    merged.push(r);
    if (merged.length >= MAX_REMEDIES) break;
  }
  return merged;
}

/**
 * Concrete products chosen by the operator (amazon.de ASINs), keyed by remedy name.
 * Everything not listed here falls back to an Amazon search for the search term.
 */
const PRODUCT_ASINS: Record<string, string> = {
  "pH-Messgerät und pH-Down": "B0DZNSB16W",
  "EC-Messgerät": "B0DZNSB16W",
  "Hygrometer / Thermometer": "B0D1Q3TP7F",
  "Thermo-Hygrometer": "B0D1Q3TP7F",
  "Lupe / Mikroskop-Aufsatz (Trichome prüfen)": "B09Y62T5B5",
  "Präzisions-Pflanzenschere": "B07C2V85Q7",
  "Pflanzenclips / Bindedraht (Training)": "B07RZZJQXP",
  Anzuchterde: "B08TV1KWDP",
  "Mini-Gewächshaus / Anzuchtbox": "B09L4T4P5K",
  Feuchtigkeitsmesser: "B08V85KVWX",
  Bodenfeuchtigkeitsmesser: "B08V85KVWX",
  Growzelt: "B07KM46T6W",
  "Dimmbare LED-Pflanzenlampe": "B0F22F1MJT",
  "Stofftöpfe (Fabric Pots)": "B0F6MQTW2T",
  "Trocknungsnetz zum Aufhängen": "B0DRKNCH6F",
  "Aktivkohlefilter mit Abluft": "B08RZ3WH7N",
  Neemöl: "B09W9S27X6",
  Gelbtafeln: "B0B9H1JJ83",
};

/** ASIN of the operator's chosen product for a remedy, if there is one. */
export function asinForRemedy(name: string): string | undefined {
  return PRODUCT_ASINS[name];
}

/** All remedy names of both catalogs (used to keep PRODUCT_ASINS in sync). */
export function catalogRemedyNames(): string[] {
  return [...CATALOG, ...COACH_CATALOG].map((c) => c.name);
}

export function productAsinNames(): string[] {
  return Object.keys(PRODUCT_ASINS);
}
