// Cannabis Strain Database with ratings and affiliate links

export type StrainType = "indica" | "sativa" | "hybrid";
export type Difficulty = "beginner" | "intermediate" | "advanced" | "expert";
export type Effect = "relaxed" | "euphoric" | "creative" | "energetic" | "sleepy" | "hungry" | "focused" | "uplifted";
export type Flavor = "sweet" | "earthy" | "citrus" | "pine" | "berry" | "diesel" | "skunk" | "tropical" | "spicy" | "cheese";
export type MedicalUse = "pain" | "anxiety" | "depression" | "insomnia" | "appetite" | "nausea" | "inflammation" | "stress";

export interface Strain {
  id: string;
  name: string;
  type: StrainType;
  thcMin: number;
  thcMax: number;
  cbdMin: number;
  cbdMax: number;
  difficulty: Difficulty;
  floweringWeeks: number;
  yieldIndoor: string; // g/m²
  yieldOutdoor: string; // g/plant
  heightIndoor: string;
  heightOutdoor: string;
  effects: Effect[];
  flavors: Flavor[];
  medicalUses: MedicalUse[];
  description: string;
  growTips: string[];
  vulnerabilities: string[];
  genetics: string;
  breeder: string;
  rating: number;
  reviewCount: number;
  imageUrl?: string;
  affiliateLinks: AffiliateLink[];
  isPremium?: boolean;
}

export interface AffiliateLink {
  shop: string;
  url: string;
  price: number;
  currency: string;
  seedCount: number;
  type: "regular" | "feminized" | "autoflower";
}

export interface StrainReview {
  id: string;
  strainId: string;
  userId: string;
  userName: string;
  rating: number;
  difficulty: Difficulty;
  yieldRating: number;
  tasteRating: number;
  effectRating: number;
  comment: string;
  images?: string[];
  createdAt: Date;
  helpful: number;
}

// Affiliate partner shops
export const AFFILIATE_SHOPS = [
  { id: "sensiseeds", name: "Sensi Seeds", logo: "🌱", commission: 15 },
  { id: "royalqueen", name: "Royal Queen Seeds", logo: "👑", commission: 12 },
  { id: "dutchpassion", name: "Dutch Passion", logo: "🇳🇱", commission: 10 },
  { id: "barneys", name: "Barney's Farm", logo: "🚜", commission: 12 },
  { id: "fastbuds", name: "Fast Buds", logo: "⚡", commission: 15 },
];

export const STRAINS_DATABASE: Strain[] = [
  {
    id: "northern-lights",
    name: "Northern Lights",
    type: "indica",
    thcMin: 16,
    thcMax: 21,
    cbdMin: 0.1,
    cbdMax: 0.3,
    difficulty: "beginner",
    floweringWeeks: 7,
    yieldIndoor: "500-550",
    yieldOutdoor: "600-650",
    heightIndoor: "100-120cm",
    heightOutdoor: "180-220cm",
    effects: ["relaxed", "sleepy", "euphoric", "hungry"],
    flavors: ["sweet", "earthy", "pine"],
    medicalUses: ["insomnia", "pain", "stress", "anxiety"],
    description: "Northern Lights ist eine der bekanntesten und beliebtesten Indica-Sorten weltweit. Sie ist bekannt für ihre entspannende Wirkung und ihren süßen, erdigen Geschmack. Perfekt für Anfänger aufgrund ihrer Robustheit.",
    growTips: [
      "Sehr widerstandsfähig gegen Schimmel und Schädlinge",
      "Ideal für SOG und SCROG Methoden",
      "Niedrige Geruchsentwicklung während der Blüte",
      "Reagiert gut auf LST (Low Stress Training)",
    ],
    vulnerabilities: [
      "Kann bei Überwässerung Wurzelfäule entwickeln",
      "Empfindlich gegenüber extremer Hitze über 30°C",
    ],
    genetics: "Afghani x Thai",
    breeder: "Sensi Seeds",
    rating: 4.8,
    reviewCount: 1245,
    affiliateLinks: [
      { shop: "Sensi Seeds", url: "https://sensiseeds.com/northern-lights", price: 29.99, currency: "EUR", seedCount: 3, type: "feminized" },
      { shop: "Royal Queen Seeds", url: "https://royalqueenseeds.com/northern-lights", price: 25.00, currency: "EUR", seedCount: 3, type: "feminized" },
    ],
  },
  {
    id: "white-widow",
    name: "White Widow",
    type: "hybrid",
    thcMin: 18,
    thcMax: 25,
    cbdMin: 0.1,
    cbdMax: 0.2,
    difficulty: "beginner",
    floweringWeeks: 8,
    yieldIndoor: "450-500",
    yieldOutdoor: "550-600",
    heightIndoor: "80-100cm",
    heightOutdoor: "150-180cm",
    effects: ["euphoric", "creative", "energetic", "uplifted"],
    flavors: ["earthy", "pine", "spicy"],
    medicalUses: ["depression", "stress", "pain", "appetite"],
    description: "White Widow ist ein legendärer Hybrid aus den Niederlanden. Bekannt für ihre weißen, harzigen Blüten und den ausgewogenen, erhebenden Effekt. Eine der meistverkauften Sorten seit den 90er Jahren.",
    growTips: [
      "Sehr harzreich - ideal für Extrakte",
      "Kompakte Struktur, gut für kleine Räume",
      "Verträgt Temperaturschwankungen gut",
      "Moderate Nährstoffzufuhr empfohlen",
    ],
    vulnerabilities: [
      "Kann bei hoher Luftfeuchtigkeit Schimmel entwickeln",
      "Starker Geruch in der Blütephase",
    ],
    genetics: "Brazilian Sativa x South Indian Indica",
    breeder: "Green House Seeds",
    rating: 4.7,
    reviewCount: 2156,
    affiliateLinks: [
      { shop: "Dutch Passion", url: "https://dutch-passion.com/white-widow", price: 32.50, currency: "EUR", seedCount: 3, type: "feminized" },
      { shop: "Royal Queen Seeds", url: "https://royalqueenseeds.com/white-widow", price: 27.00, currency: "EUR", seedCount: 3, type: "feminized" },
    ],
  },
  {
    id: "gorilla-glue",
    name: "Gorilla Glue #4",
    type: "hybrid",
    thcMin: 25,
    thcMax: 30,
    cbdMin: 0.1,
    cbdMax: 0.1,
    difficulty: "intermediate",
    floweringWeeks: 9,
    yieldIndoor: "500-600",
    yieldOutdoor: "600-700",
    heightIndoor: "120-150cm",
    heightOutdoor: "200-250cm",
    effects: ["relaxed", "euphoric", "sleepy", "hungry"],
    flavors: ["diesel", "earthy", "pine"],
    medicalUses: ["pain", "insomnia", "stress", "depression"],
    description: "Gorilla Glue #4 ist eine extrem potente Sorte mit sehr hohem THC-Gehalt. Der Name kommt von den extrem klebrigen, harzigen Blüten. Mehrfacher Cannabis Cup Gewinner.",
    growTips: [
      "Benötigt Stützen wegen schwerer Blüten",
      "Hoher Nährstoffbedarf in der Blüte",
      "Regelmäßiges Entlauben empfohlen",
      "Längere Trocknungszeit für besten Geschmack",
    ],
    vulnerabilities: [
      "Anfällig für Spinnmilben",
      "Kann bei Überdüngung verbrennen",
      "Starke Geruchsentwicklung - Kohlefilter nötig",
    ],
    genetics: "Chem's Sister x Sour Dubb x Chocolate Diesel",
    breeder: "GG Strains",
    rating: 4.9,
    reviewCount: 3421,
    isPremium: true,
    affiliateLinks: [
      { shop: "Barney's Farm", url: "https://barneysfarm.com/gorilla-glue", price: 45.00, currency: "EUR", seedCount: 3, type: "feminized" },
      { shop: "Fast Buds", url: "https://fastbuds.com/gorilla-glue-auto", price: 35.00, currency: "EUR", seedCount: 3, type: "autoflower" },
    ],
  },
  {
    id: "blue-dream",
    name: "Blue Dream",
    type: "sativa",
    thcMin: 17,
    thcMax: 24,
    cbdMin: 0.1,
    cbdMax: 0.2,
    difficulty: "beginner",
    floweringWeeks: 9,
    yieldIndoor: "500-550",
    yieldOutdoor: "600-700",
    heightIndoor: "150-180cm",
    heightOutdoor: "200-300cm",
    effects: ["euphoric", "creative", "uplifted", "relaxed"],
    flavors: ["berry", "sweet", "citrus"],
    medicalUses: ["depression", "pain", "stress", "anxiety"],
    description: "Blue Dream ist eine der beliebtesten Sorten in den USA. Sie bietet einen sanften, ausgewogenen High mit süßem Beerengeschmack. Ideal für den Tag.",
    growTips: [
      "Wächst schnell und kräftig",
      "Gut für SCROG wegen langer Seitentriebe",
      "Verträgt höhere Temperaturen gut",
      "Outdoor-Ernte Ende Oktober",
    ],
    vulnerabilities: [
      "Kann sehr groß werden - Höhenkontrolle nötig",
      "Anfällig für Spinnmilben bei trockener Luft",
      "Benötigt viel Licht für optimale Erträge",
    ],
    genetics: "Blueberry x Haze",
    breeder: "DJ Short",
    rating: 4.6,
    reviewCount: 1876,
    affiliateLinks: [
      { shop: "Royal Queen Seeds", url: "https://royalqueenseeds.com/blue-dream", price: 29.00, currency: "EUR", seedCount: 3, type: "feminized" },
      { shop: "Fast Buds", url: "https://fastbuds.com/blue-dream-auto", price: 32.00, currency: "EUR", seedCount: 3, type: "autoflower" },
    ],
  },
  {
    id: "og-kush",
    name: "OG Kush",
    type: "hybrid",
    thcMin: 20,
    thcMax: 26,
    cbdMin: 0.1,
    cbdMax: 0.3,
    difficulty: "advanced",
    floweringWeeks: 8,
    yieldIndoor: "400-450",
    yieldOutdoor: "500-550",
    heightIndoor: "90-110cm",
    heightOutdoor: "150-180cm",
    effects: ["euphoric", "relaxed", "hungry", "sleepy"],
    flavors: ["earthy", "pine", "diesel"],
    medicalUses: ["stress", "pain", "depression", "insomnia"],
    description: "OG Kush ist eine legendäre Sorte aus Kalifornien und Grundlage vieler moderner Hybriden. Bekannt für ihren einzigartigen erdigen, dieselartigen Geschmack.",
    growTips: [
      "Benötigt stabile Umgebungsbedingungen",
      "Reagiert empfindlich auf pH-Schwankungen",
      "Moderate Düngung empfohlen",
      "Gute Luftzirkulation wichtig",
    ],
    vulnerabilities: [
      "Sehr anfällig für Mehltau",
      "Empfindlich gegenüber Überdüngung",
      "Benötigt präzise Bewässerung",
      "Anfällig für Wurzelprobleme",
    ],
    genetics: "Chemdawg x Hindu Kush",
    breeder: "Unknown",
    rating: 4.7,
    reviewCount: 2543,
    isPremium: true,
    affiliateLinks: [
      { shop: "Sensi Seeds", url: "https://sensiseeds.com/og-kush", price: 39.99, currency: "EUR", seedCount: 3, type: "feminized" },
      { shop: "Barney's Farm", url: "https://barneysfarm.com/og-kush", price: 42.00, currency: "EUR", seedCount: 3, type: "feminized" },
    ],
  },
  {
    id: "amnesia-haze",
    name: "Amnesia Haze",
    type: "sativa",
    thcMin: 20,
    thcMax: 25,
    cbdMin: 0.1,
    cbdMax: 0.1,
    difficulty: "intermediate",
    floweringWeeks: 11,
    yieldIndoor: "600-650",
    yieldOutdoor: "700-800",
    heightIndoor: "140-180cm",
    heightOutdoor: "200-250cm",
    effects: ["euphoric", "energetic", "creative", "uplifted"],
    flavors: ["citrus", "earthy", "sweet"],
    medicalUses: ["depression", "stress", "anxiety", "appetite"],
    description: "Amnesia Haze ist eine preisgekrönte Sativa mit starkem, zerebralem High. Bekannt für ihren zitrusartigen Geschmack und energetisierenden Effekt.",
    growTips: [
      "Lange Blütezeit - Geduld erforderlich",
      "Hohe Erträge bei richtiger Pflege",
      "Gut für warme Klimazonen",
      "Regelmäßiges Topping empfohlen",
    ],
    vulnerabilities: [
      "Lange Blütezeit erhöht Schimmelrisiko",
      "Kann bei Kälte Probleme bekommen",
      "Benötigt viel vertikalen Raum",
    ],
    genetics: "South Asian x Jamaican x Hawaiian",
    breeder: "Soma Seeds",
    rating: 4.5,
    reviewCount: 1654,
    affiliateLinks: [
      { shop: "Royal Queen Seeds", url: "https://royalqueenseeds.com/amnesia-haze", price: 35.00, currency: "EUR", seedCount: 3, type: "feminized" },
      { shop: "Dutch Passion", url: "https://dutch-passion.com/amnesia-haze", price: 38.00, currency: "EUR", seedCount: 3, type: "feminized" },
    ],
  },
  {
    id: "critical-auto",
    name: "Critical Auto",
    type: "indica",
    thcMin: 14,
    thcMax: 18,
    cbdMin: 0.5,
    cbdMax: 1.0,
    difficulty: "beginner",
    floweringWeeks: 7,
    yieldIndoor: "400-500",
    yieldOutdoor: "100-200",
    heightIndoor: "60-80cm",
    heightOutdoor: "80-100cm",
    effects: ["relaxed", "sleepy", "hungry"],
    flavors: ["sweet", "earthy", "citrus"],
    medicalUses: ["insomnia", "pain", "stress"],
    description: "Critical Auto ist perfekt für Anfänger. Kompakt, schnell und ertragreich. Automatische Blüte ohne Lichtzyklus-Änderung nötig.",
    growTips: [
      "Keine Lichtzyklus-Änderung nötig",
      "Von Samen bis Ernte in 8-9 Wochen",
      "Ideal für kleine Räume",
      "Wenig Pflege erforderlich",
    ],
    vulnerabilities: [
      "Geringerer Ertrag als photoperiodische Sorten",
      "Keine Möglichkeit zur Stecklingsvermehrung",
    ],
    genetics: "Critical x Ruderalis",
    breeder: "Royal Queen Seeds",
    rating: 4.4,
    reviewCount: 987,
    affiliateLinks: [
      { shop: "Royal Queen Seeds", url: "https://royalqueenseeds.com/critical-auto", price: 22.00, currency: "EUR", seedCount: 3, type: "autoflower" },
      { shop: "Fast Buds", url: "https://fastbuds.com/critical-auto", price: 25.00, currency: "EUR", seedCount: 3, type: "autoflower" },
    ],
  },
  {
    id: "girl-scout-cookies",
    name: "Girl Scout Cookies",
    type: "hybrid",
    thcMin: 25,
    thcMax: 28,
    cbdMin: 0.1,
    cbdMax: 0.2,
    difficulty: "advanced",
    floweringWeeks: 9,
    yieldIndoor: "350-450",
    yieldOutdoor: "450-550",
    heightIndoor: "80-100cm",
    heightOutdoor: "150-180cm",
    effects: ["euphoric", "relaxed", "creative", "hungry"],
    flavors: ["sweet", "earthy", "spicy"],
    medicalUses: ["pain", "depression", "stress", "appetite"],
    description: "Girl Scout Cookies (GSC) ist eine der begehrtesten Sorten weltweit. Extrem potent mit einzigartigem süßen Geschmack. Mehrfacher Cannabis Cup Gewinner.",
    growTips: [
      "Kompakte Struktur, gut für SOG",
      "Hoher Nährstoffbedarf",
      "Kältere Nachttemperaturen fördern lila Färbung",
      "Längere Aushärtung für besten Geschmack",
    ],
    vulnerabilities: [
      "Anfällig für Mehltau",
      "Moderate Erträge trotz hoher Qualität",
      "Empfindlich gegenüber Überdüngung",
    ],
    genetics: "OG Kush x Durban Poison",
    breeder: "Cookie Family",
    rating: 4.8,
    reviewCount: 2876,
    isPremium: true,
    affiliateLinks: [
      { shop: "Barney's Farm", url: "https://barneysfarm.com/gsc", price: 48.00, currency: "EUR", seedCount: 3, type: "feminized" },
      { shop: "Fast Buds", url: "https://fastbuds.com/gsc-auto", price: 38.00, currency: "EUR", seedCount: 3, type: "autoflower" },
    ],
  },
];

// Helper functions
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

export function getEffectLabel(effect: Effect): string {
  const labels: Record<Effect, string> = {
    relaxed: "Entspannt",
    euphoric: "Euphorisch",
    creative: "Kreativ",
    energetic: "Energetisch",
    sleepy: "Schläfrig",
    hungry: "Hungrig",
    focused: "Fokussiert",
    uplifted: "Gehoben",
  };
  return labels[effect];
}

export function getFlavorLabel(flavor: Flavor): string {
  const labels: Record<Flavor, string> = {
    sweet: "Süß",
    earthy: "Erdig",
    citrus: "Zitrus",
    pine: "Kiefer",
    berry: "Beere",
    diesel: "Diesel",
    skunk: "Skunk",
    tropical: "Tropisch",
    spicy: "Würzig",
    cheese: "Käse",
  };
  return labels[flavor];
}

export function getMedicalLabel(use: MedicalUse): string {
  const labels: Record<MedicalUse, string> = {
    pain: "Schmerzen",
    anxiety: "Angst",
    depression: "Depression",
    insomnia: "Schlaflosigkeit",
    appetite: "Appetit",
    nausea: "Übelkeit",
    inflammation: "Entzündung",
    stress: "Stress",
  };
  return labels[use];
}

// Mock reviews
export const MOCK_STRAIN_REVIEWS: StrainReview[] = [
  {
    id: "rev1",
    strainId: "northern-lights",
    userId: "user1",
    userName: "GreenThumb420",
    rating: 5,
    difficulty: "beginner",
    yieldRating: 5,
    tasteRating: 4,
    effectRating: 5,
    comment: "Perfekte Anfängersorte! Sehr robust und verzeiht Fehler. Toller entspannender Effekt.",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    helpful: 23,
  },
  {
    id: "rev2",
    strainId: "gorilla-glue",
    userId: "user2",
    userName: "CannaKing",
    rating: 5,
    difficulty: "intermediate",
    yieldRating: 5,
    tasteRating: 5,
    effectRating: 5,
    comment: "Unglaublich potent! Die Blüten sind so klebrig, dass die Schere ständig verklebt. Absolut top!",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    helpful: 45,
  },
];
