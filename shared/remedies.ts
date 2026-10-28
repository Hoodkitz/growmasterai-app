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
      /trauermücke|trauermuecke|fungus gnat|larven im substrat|nematod/i,
    name: "Nematoden gegen Trauermücken",
    purpose:
      "Nützlinge, die die Larven im Substrat fressen. Mit Gießwasser ausbringen.",
    searchTerm: "Nematoden Trauermücken SF Nematoden",
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
    keywords: /curing|fermentier|lagern|einmachglas|weck|glas/i,
    name: "Lichtgeschützte Behälter (Curing)",
    purpose:
      "Blüten dunkel und kühl lagern (ca. 15–18 °C): Braunglas oder Edelstahldosen schützen vor Licht.",
    searchTerm: "Braunglas Weithalsglas 1 Liter luftdicht",
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
    keywords:
      /umluft|ventilator|luftbewegung|luftzirkulation|stehende luft|stängel stärk|staengel staerk/i,
    name: "Umluft-Ventilator (Clip)",
    purpose:
      "Bewegt die Luft im Zelt, stärkt die Stängel und beugt Schimmel und Feuchtenestern vor.",
    searchTerm: "Clip Ventilator Growzelt Umluft",
  },
  {
    keywords:
      /zeitschaltuhr|lichtzyklus|lichtrhythmus|lichtperiode|18\/6|12\/12|\btimer\b/i,
    name: "Zeitschaltuhr (digital)",
    purpose: "Schaltet Licht und Lüfter zuverlässig im richtigen Rhythmus.",
    searchTerm: "Zeitschaltuhr digital Steckdose 16A",
  },
  {
    keywords:
      /bewässerungs|bewaesserungs|tropfbewäss|urlaub|automatisch\w* gieß|automatisch\w* giess|selbstbewäss/i,
    name: "Bewässerungsset (Tropf/Urlaub)",
    purpose: "Gleichmäßige Wasserversorgung, auch wenn du mal nicht da bist.",
    searchTerm: "Tropfbewässerung Set Zimmerpflanzen Urlaub",
  },
  {
    keywords: /coco|kokos/i,
    name: "Kokossubstrat (Coco)",
    purpose:
      "Luftiges Substrat mit schneller Wirkung, braucht aber regelmäßige Düngung.",
    searchTerm: "Kokossubstrat Pflanzen Coco ungedüngt",
  },
  {
    keywords: /perlit|drainage|substrat auflockern|substrat mischen|verdicht/i,
    name: "Perlite (Drainage)",
    purpose: "Lockert Erde auf und verbessert Belüftung und Wasserabfluss.",
    searchTerm: "Perlite Blähperlit Pflanzen 10 Liter",
  },
  {
    keywords: /blumenerde|pflanzerde|\bsubstrat\b|light.?mix|erdmischung/i,
    name: "Hochwertige Blumenerde",
    purpose:
      "Lockere, torfarme Erde als Basis. Vorgedüngte Mischungen brauchen anfangs wenig Dünger.",
    searchTerm: "Blumenerde torffrei hochwertig 20 Liter",
  },
  {
    keywords: /scrog|screen of green|pflanzennetz|spalier|sea of green/i,
    name: "ScrOG-Netz / Pflanzennetz",
    purpose:
      "Elastisches Netz zum gleichmäßigen Verteilen der Triebe (Screen of Green).",
    searchTerm: "ScrOG Netz Pflanzennetz Growzelt 120x120",
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

/** A concrete amazon.de product (ASIN) chosen by the operator for a remedy. */
export interface RemedyProduct {
  label?: string;
  asin: string;
}

/** Cannabis base fertilizers (Grow + Bloom), organic and mineral. */
const FERTILIZERS: RemedyProduct[] = [
  { label: "BioBizz Grow + Bloom + Top-Max (organisch)", asin: "B008T0YBWG" },
  { label: "Plagron Terra Grow + Bloom (mineralisch)", asin: "B093RLJM7F" },
  { label: "Hesi Bio Grow + Bloom 1 L (organisch)", asin: "B0DD8R2K1X" },
  { label: "Hesi Bio Grow + Bloom 500 ml (organisch)", asin: "B0FJF7VNKP" },
  { label: "Green House Feeding BioBloom (Pulver, 50 g)", asin: "B0D8B8R1HF" },
  {
    label: "Advanced Nutrients Grow + Micro + Bloom (3 x 1 L)",
    asin: "B004FYSDFQ",
  },
  { label: "Canna Terra Vega 1 L (Erde)", asin: "B003XDJI3Q" },
  { label: "GHE Flora Series Tripart (Set)", asin: "B0GRV7NR9S" },
];

/** Growth-phase (nitrogen-led) cannabis fertilizers. */
const GROW_FERTILIZERS: RemedyProduct[] = [
  { label: "Canna Terra Vega 1 L (Wachstum, Erde)", asin: "B003XDJI3Q" },
  { label: "Canna Bio Vega 1 L (Wachstum, organisch)", asin: "B00DCUI7PA" },
  { label: "BioBizz Bio-Grow 1 L (organisch)", asin: "B005PX47FG" },
  {
    label: "Advanced Nutrients Grow + Micro + Bloom (3 x 1 L)",
    asin: "B004FYSDFQ",
  },
  { label: "Hesi Bio Grow + Bloom 1 L (organisch)", asin: "B0DD8R2K1X" },
];

/** Bloom-phase (PK) cannabis fertilizers and boosters. */
const BLOOM_FERTILIZERS: RemedyProduct[] = [
  { label: "Canna Terra Flores 1 L (Blüte, Erde)", asin: "B00Q6QSRWU" },
  { label: "Canna Bio Flores 1 L (Blüte, organisch)", asin: "B016K5C272" },
  { label: "BioBizz Bio-Bloom 1 L (organisch)", asin: "B0038WMGOU" },
  { label: "Plagron Terra Bloom 1 L (mineralisch)", asin: "B00871DJ70" },
  { label: "Canna PK 13/14 (Booster, 1 L)", asin: "B00FKZU84S" },
  { label: "Advanced Nutrients Bud Candy (Booster, 1 L)", asin: "B003OTZ2PW" },
  { label: "Atami Bloombastic (Booster, 1,25 L)", asin: "B00FKZTT1G" },
];

/** Calcium/magnesium supplements (also from the candidate list in docs/product-candidates.md). */
const CAL_MAG: RemedyProduct[] = [
  { label: "Atami VGN CalMag 250 ml (stickstofffrei)", asin: "B0GNT46MP7" },
  { label: "Xpert Nutrients Cal-Mag Amino 1 L", asin: "B09YJ19TCJ" },
  { label: "BUDXXL CalMag Grow Dünger", asin: "B0DQQCLQF9" },
  { label: "UP NUTRIENTS CALMAG UP 1 L", asin: "B0FDH1BN3X" },
];

/**
 * Products by remedy name. Everything not listed here falls back to an Amazon search for
 * the remedy's search term.
 */
const PRODUCTS: Record<string, RemedyProduct[]> = {
  "Lupe / Mikroskop-Aufsatz (Trichome prüfen)": [{ asin: "B09Y62T5B5" }],
  "Pflanzenclips / Bindedraht (Training)": [{ asin: "B07RZZJQXP" }],
  Anzuchterde: [{ asin: "B08TV1KWDP" }],
  "Mini-Gewächshaus / Anzuchtbox": [{ asin: "B09L4T4P5K" }],
  Feuchtigkeitsmesser: [{ asin: "B08V85KVWX" }],
  Bodenfeuchtigkeitsmesser: [{ asin: "B08V85KVWX" }],
  "pH-Messgerät und pH-Down": [
    { label: "Bluelab pH Pen (Profi-Messgerät)", asin: "B005POOJHG" },
    { label: "4-in-1 Messgerät (pH, EC, TDS, Temperatur)", asin: "B0DZNSB16W" },
    {
      label: "Weedness Digitalmessgerät für Wasser und Pflanzen",
      asin: "B0D3Y3DLKK",
    },
    { label: "Weedness Aqua Master H600 Messgerät", asin: "B0GTHXZ1X8" },
  ],
  "EC-Messgerät": [
    { label: "4-in-1 Messgerät (pH, EC, TDS, Temperatur)", asin: "B0DZNSB16W" },
    {
      label: "EZTOCH Leitwert-/Temperaturmesser (EC, Hydroponik)",
      asin: "B0FXXG9H6C",
    },
  ],
  "Thermo-Hygrometer": [
    { label: "Govee WLAN Thermo-Hygrometer", asin: "B0D1Q3TP7F" },
    { label: "TFA Dostmann Thermo-Hygrometer 30.5027.01", asin: "B0CCJGKGSR" },
    {
      label: "TFA Dostmann Thermo-Hygrometer 30.5046.02 (Min/Max)",
      asin: "B0977DBXVD",
    },
    { label: "SwitchBot Hygrometer mit Bluetooth", asin: "B0BVLYPYT1" },
  ],
  "Hygrometer / Thermometer": [
    { label: "Govee WLAN Thermo-Hygrometer", asin: "B0D1Q3TP7F" },
    { label: "TFA Dostmann Thermo-Hygrometer 30.5019.01", asin: "B00WQNBK4O" },
    { label: "TFA Dostmann Thermo-Hygrometer 30.5027.01", asin: "B0CCJGKGSR" },
  ],
  "Präzisions-Pflanzenschere": [
    { label: "Zerodis Bonsai-Schere, 190 mm", asin: "B07C2V85Q7" },
    { label: "Chikamasa B-600SUFB Präzisionsschere", asin: "B0CQKP68YT" },
    { label: "Kamikaze Erntescheren", asin: "B08W9LYPXT" },
    { label: "Gardena HerbCut Kräuterschere", asin: "B0BNLQ9HLK" },
  ],
  Growzelt: [
    { label: "TRAFIKA Growzelt mit Mylar", asin: "B07KM46T6W" },
    { label: "HORTOSOL Growzelt 120x120x200", asin: "B00GAEYNGW" },
    { label: "HOMEbox Ambient R120", asin: "B01EANHLU4" },
    {
      label: "Relaxdays Growzelt, reflektierend und lichtdicht",
      asin: "B08JYB3L5K",
    },
    { label: "your GEAR Plantsville Growzelt 120x120x200", asin: "B08WJG3X76" },
  ],
  "Dimmbare LED-Pflanzenlampe": [
    {
      label: "LED Grow Lampe 200 W (Samsung LM301D, dimmbar)",
      asin: "B0F22F1MJT",
    },
    { label: "Spider Farmer SF1000D 100 W (dimmbar)", asin: "B09ZK71SY7" },
    { label: "Mars Hydro TS1000 150 W (App-Steuerung)", asin: "B07ZVFBR34" },
    { label: "Vivosun LumaLight 100 W (dimmbar)", asin: "B0FB8RK4X1" },
    { label: "Greenception Vollspektrum-Lampe", asin: "B0CQ58V9SG" },
  ],
  "Stofftöpfe (Fabric Pots)": [
    { label: "CHUENHEI Stofftöpfe 11/18/27 l (15er-Set)", asin: "B0F6MQTW2T" },
    { label: "INTIRILIFE Pflanzsäcke aus Vlies", asin: "B08D6X6VHD" },
    { label: "TTL Garden Vlies-Pflanzsäcke", asin: "B0BY2YJNYJ" },
    { label: "OPPOLIFE Pflanzsäcke mit Griffen", asin: "B09P46NHCS" },
  ],
  "Trocknungsnetz zum Aufhängen": [
    { label: "Cerkkapo Trocknungsnetz 6 Ebenen", asin: "B0DRKNCH6F" },
    { label: "Weedness Grow-Trocknungsnetz mit Ebenen", asin: "B0DDTKHFC8" },
    { label: "Relaxdays faltbares Trocknungsnetz", asin: "B0DG5F563H" },
    { label: "Weedness Harvest Trocknungsset (3-teilig)", asin: "B08BYJ36HH" },
  ],
  "Aktivkohlefilter mit Abluft": [
    {
      label: "Mars Hydro Abluftset 100 mm mit Aktivkohlefilter",
      asin: "B08RZ3WH7N",
    },
    { label: "Weedness Abluftset mit Flansch", asin: "B0D9SJ119S" },
    {
      label: "Spider Farmer Luftfilter-Kit mit Drehzahlregler",
      asin: "B08KWGDY44",
    },
    { label: "Can-Lite Aktivkohlefilter mit Flansch", asin: "B0G5YXK4WJ" },
  ],
  Neemöl: [
    { label: "GebEarth Neemöl-Spray 1 l", asin: "B09W9S27X6" },
    { label: "Homegrow24 Neemöl-Spray", asin: "B0FPM2Y949" },
    { label: "Neudorff Spruzit Neem", asin: "B0BTCCJNCW" },
    { label: "Pure Zuprime Neemöl", asin: "B0CBW6MSKF" },
  ],
  Gelbtafeln: [
    { label: "Super Ninja Gelbtafeln (30 Stück)", asin: "B0B9H1JJ83" },
    { label: "nemabest Gelbsticker zum Einstecken", asin: "B09KM672QJ" },
    { label: "Pattler Gelbsticker gegen Trauermücken", asin: "B0HM54R968" },
    { label: "Neudorff Duo Gelbtafeln", asin: "B0F8NJ7WS8" },
  ],
  "Umluft-Ventilator (Clip)": [
    { label: "Grow Clip-Ventilator, EC-Motor, 20 cm", asin: "B0D9PDB3WD" },
    { label: "Garden HighPro ProFan Clip-Ventilator", asin: "B077P2PJ98" },
    { label: "Garden HighPro Clip-Ventilator mit Halter", asin: "B07DVC18VJ" },
    { label: "Grow Expert oszillierender Zeltventilator", asin: "B0DQVLN93L" },
  ],
  "Zeitschaltuhr (digital)": [
    { label: "goobay Zeitschaltuhr digital, 16 Programme", asin: "B0CW9ZCFXV" },
    { label: "Maxcio Digitale Zeitschaltuhr 16 A", asin: "B07PVYF6YB" },
    {
      label: "Brennenstuhl Comfort Line Digitale Zeitschaltuhr",
      asin: "B083KVNDZ4",
    },
    { label: "UNITEC Digitale Wochen-Zeitschaltuhr", asin: "B09NDGH96R" },
  ],
  "Bewässerungsset (Tropf/Urlaub)": [
    {
      label: "Gardena Urlaubsbewässerung mit Vorratsbehälter",
      asin: "B09J92VPH2",
    },
    { label: "Gardena Micro-Drip-System Balkon", asin: "B0BNLMJ7LQ" },
    { label: "Blumat Tonkegel Bewässerung", asin: "B0001IOZ98" },
    { label: "Relaxdays Urlaubsbewässerung", asin: "B08779K17M" },
  ],
  "Kokossubstrat (Coco)": [
    { label: "BioBizz Coco Mix 50 l", asin: "B08BB2HBPS" },
    { label: "Plagron Coco mit Perlite", asin: "B0G5Z1SD96" },
    { label: "Novatool Kokossubstrat ohne Dünger", asin: "B09VY83HMR" },
    { label: "Bio-Kokossubstrat XL", asin: "B07F7KMMWT" },
  ],
  "Perlite (Drainage)": [
    { label: "BIOVITA Perlite 10 l", asin: "B0D4QQ4V9R" },
    { label: "Plagron Perlite 10 l", asin: "B07WPKL662" },
    { label: "Floragard Perlite Profi", asin: "B0BVVMQ2B9" },
    { label: "Plagron Perlite 70 l", asin: "B00JJRCB2K" },
  ],
  "Hochwertige Blumenerde": [
    { label: "Floragard Professional Growmix 70 l", asin: "B08J8YVR4R" },
    { label: "BioBizz Light·Mix 50 l (Grow-Erde)", asin: "B004OOU3TG" },
    { label: "Plagron Royalmix 50 l (Grow-Erde)", asin: "B07DVPG8Q2" },
  ],
  "ScrOG-Netz / Pflanzennetz": [
    { label: "AC Infinity Mesh-Netz 120", asin: "B0H3G1P5ZZ" },
    { label: "POTLAB elastisches Pflanzennetz", asin: "B09THJJ4WY" },
    { label: "Hydrofarm HGN30S Polyester-Netz", asin: "B01NBU1VCM" },
    { label: "Weedness Pflanzennetz für Growboxen", asin: "B09G1B7LQ7" },
  ],
  "Nematoden gegen Trauermücken": [
    { label: "nemabest Nematoden gegen Trauermücken", asin: "B08SJF8Y7X" },
    { label: "Weedness Nematoden gegen Trauermücken", asin: "B0FZV5MGP9" },
    { label: "nemabest Hypoaspis miles (Raubmilben)", asin: "B0DZP6KSDW" },
  ],
  "Pflanzendünger (Wachstum/Blüte)": FERTILIZERS,
  "Wachstumsdünger (Stickstoff)": GROW_FERTILIZERS,
  "Blütedünger (PK)": BLOOM_FERTILIZERS,
  "Cal-Mag Ergänzung": CAL_MAG,
  "Mykorrhiza / Wurzelstimulator": [
    {
      label: "BioBizz Root·Juice 250 ml (Wurzelstimulator)",
      asin: "B09RFVMB9W",
    },
    { label: "CANNA Rhizotonic 1 L (Wurzelstimulator)", asin: "B003VNAT36" },
  ],
};

export function productsForRemedy(name: string): RemedyProduct[] {
  return PRODUCTS[name] ?? [];
}

/** First chosen product's ASIN for a remedy, if there is one. */
export function asinForRemedy(name: string): string | undefined {
  return PRODUCTS[name]?.[0]?.asin;
}

/** All remedy names of both catalogs (used to keep PRODUCT_ASINS in sync). */
export function catalogRemedyNames(): string[] {
  return [...CATALOG, ...COACH_CATALOG].map((c) => c.name);
}

export function productAsinNames(): string[] {
  return Object.keys(PRODUCTS);
}
