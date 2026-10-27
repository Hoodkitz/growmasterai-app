// Strain database. Every entry is taken from the breeder's own product page (see `source`).
// Only facts stated there are stored; anything the page does not state is left out
// (no invented ratings, prices, effects or grow tips). Add new strains the same way.

export type StrainType = "indica" | "sativa" | "hybrid";
export type Difficulty = "beginner" | "intermediate" | "advanced" | "expert";

export interface Strain {
  id: string;
  name: string;
  breeder: string;
  /** Breeder page the facts below come from. */
  source: string;
  type?: StrainType;
  sativaPct?: number;
  indicaPct?: number;
  genetics?: string;
  /** "up to" value as stated by the breeder, in percent. */
  thcMax?: number;
  /** Exact value as stated by the breeder, in percent. */
  thcExact?: number;
  /** Indoor flowering time as stated, e.g. "45–50 Tage". */
  floweringText?: string;
  yieldIndoor?: string;
  yieldOutdoor?: string;
  heightIndoor?: string;
  harvestOutdoor?: string;
  /** Only set when the breeder rates the strain as easy / for novices. */
  difficulty?: Difficulty;
  isPremium?: boolean;
}

export const STRAINS_DATABASE: Strain[] = [
  {
    id: "northern-lights",
    name: "Northern Lights (fem.)",
    breeder: "Sensi Seeds",
    source:
      "https://sensiseeds.com/en/feminized-seeds/sensi-seeds/northern-lights",
    type: "indica",
    indicaPct: 90,
    sativaPct: 10,
    genetics: "Thai x Afghani (Landrace-Genetik)",
    floweringText: "45–50 Tage",
    yieldIndoor: "500 g/m²",
    heightIndoor: "80–130 cm",
    difficulty: "beginner",
  },
  {
    id: "skunk-1",
    name: "Skunk #1 (fem.)",
    breeder: "Sensi Seeds",
    source:
      "https://sensiseeds.com/en/feminized-seeds/sensi-seeds/skunk-1-feminised",
    type: "hybrid",
    indicaPct: 65,
    sativaPct: 35,
    difficulty: "beginner",
  },
  {
    id: "jack-herer",
    name: "Jack Herer (fem.)",
    breeder: "Sensi Seeds",
    source:
      "https://sensiseeds.com/en/feminized-seeds/sensi-seeds/jack-herer-feminized",
    type: "hybrid",
    indicaPct: 50,
    sativaPct: 50,
    floweringText: "10–12 Wochen (indica-dominante Phänotypen ca. 8 Wochen)",
  },
  {
    id: "hindu-kush",
    name: "Hindu Kush (fem.)",
    breeder: "Sensi Seeds",
    source: "https://sensiseeds.com/en/feminized-seeds/sensi-seeds/hindu-kush",
    type: "indica",
    floweringText: "45–50 Tage",
    difficulty: "beginner",
  },
  {
    id: "amnesia-haze",
    name: "Amnesia Haze (fem.)",
    breeder: "Royal Queen Seeds",
    source:
      "https://www.royalqueenseeds.com/us/feminized-cannabis-seeds/115-amnesia-haze.html",
    type: "sativa",
    sativaPct: 70,
    indicaPct: 30,
    genetics: "Original Amnesia Haze",
    thcMax: 22,
    floweringText: "65–70 Tage",
    yieldIndoor: "21–23 oz/m²",
    heightIndoor: "100 cm",
    harvestOutdoor: "Ende Oktober",
  },
  {
    id: "critical",
    name: "Critical (fem.)",
    breeder: "Royal Queen Seeds",
    source:
      "https://www.royalqueenseeds.com/us/feminized-cannabis-seeds/133-critical.html",
    type: "hybrid",
    sativaPct: 40,
    indicaPct: 60,
    genetics: "Afghani x Skunk",
    thcMax: 18,
    floweringText: "50–60 Tage",
    yieldIndoor: "600 g/m²",
    heightIndoor: "bis 100 cm",
    harvestOutdoor: "Ende September",
  },
  {
    id: "special-kush-1",
    name: "Special Kush #1 (fem.)",
    breeder: "Royal Queen Seeds",
    source:
      "https://www.royalqueenseeds.com/us/feminized-cannabis-seeds/138-special-kush-1.html",
    type: "indica",
    sativaPct: 20,
    indicaPct: 80,
    genetics: "Afghan x Kush",
    floweringText: "50–55 Tage",
    harvestOutdoor: "Ende September",
  },
  {
    id: "royal-cheese",
    name: "Royal Cheese Fast Flowering (fem.)",
    breeder: "Royal Queen Seeds",
    source:
      "https://www.royalqueenseeds.com/us/feminized-cannabis-seeds/140-royal-cheese-fast-flowering.html",
    type: "hybrid",
    sativaPct: 40,
    indicaPct: 60,
    genetics: "Old School Skunk x Afghani",
    thcMax: 17,
    floweringText: "50–55 Tage",
    yieldOutdoor: "19–21 oz/Pflanze",
    harvestOutdoor: "Anfang Oktober",
  },
  {
    id: "lemon-skunk",
    name: "Lemon Skunk (fem.)",
    breeder: "Royal Queen Seeds",
    source:
      "https://www.royalqueenseeds.com/us/feminized-cannabis-seeds/688-lemon-skunk.html",
    type: "hybrid",
    sativaPct: 50,
    indicaPct: 50,
    genetics: "Skunk 1 x Citral",
    thcMax: 19,
    floweringText: "55–60 Tage",
    harvestOutdoor: "Ende September",
  },
  {
    id: "white-widow",
    name: "White Widow (fem.)",
    breeder: "Green House Seed Company",
    source:
      "https://shop.greenhouseseeds.nl/award-winning-seeds/high-times-cannabis-cup/white-widow/",
    thcExact: 25.76,
    floweringText: "8–9 Wochen",
    yieldIndoor: "600 g/m²",
  },
];

/** Search link instead of invented shop URLs/prices: we have no verified partner deals. */
export function strainSearchUrl(
  strain: Pick<Strain, "name" | "breeder">,
): string {
  const q = `${strain.name} ${strain.breeder} Samen`;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

export function getDifficultyLabel(difficulty: Difficulty): string {
  const labels: Record<Difficulty, string> = {
    beginner: "Anfänger",
    intermediate: "Fortgeschritten",
    advanced: "Erfahren",
    expert: "Experte",
  };
  return labels[difficulty];
}

export function getDifficultyColor(difficulty: Difficulty): string {
  const colors: Record<Difficulty, string> = {
    beginner: "#22C55E",
    intermediate: "#F59E0B",
    advanced: "#EF4444",
    expert: "#7C3AED",
  };
  return colors[difficulty];
}

export function getTypeLabel(type: StrainType): string {
  const labels: Record<StrainType, string> = {
    indica: "Indica",
    sativa: "Sativa",
    hybrid: "Hybrid",
  };
  return labels[type];
}

export function getTypeColor(type: StrainType): string {
  const colors: Record<StrainType, string> = {
    indica: "#8B5CF6",
    sativa: "#F59E0B",
    hybrid: "#10B981",
  };
  return colors[type];
}

/** "Sativa 70% / Indica 30%" when the breeder states a ratio. */
export function getRatioLabel(strain: Strain): string | null {
  if (strain.sativaPct == null && strain.indicaPct == null) return null;
  const parts: string[] = [];
  if (strain.sativaPct != null) parts.push(`Sativa ${strain.sativaPct}%`);
  if (strain.indicaPct != null) parts.push(`Indica ${strain.indicaPct}%`);
  return parts.join(" / ");
}

export function getThcLabel(strain: Strain): string | null {
  if (strain.thcExact != null)
    return `${String(strain.thcExact).replace(".", ",")} %`;
  if (strain.thcMax != null) return `bis ${strain.thcMax} %`;
  return null;
}

/** Hersteller-Seite als Kurzname für "Quelle: …". */
export function getSourceLabel(strain: Strain): string {
  return strain.breeder;
}
