// Locations data for shops, clubs, and member radar

export type LocationType = "headshop" | "growshop" | "club" | "member";

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  postalCode: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  rating: number;
  reviewCount: number;
  description?: string;
  features?: string[];
  isVerified?: boolean;
  distance?: number; // calculated based on user location
}

export interface MemberProfile {
  id: string;
  userName: string;
  avatar?: string;
  level: number;
  badge: string;
  experienceYears: number;
  specialties: string[];
  isOnline: boolean;
  lastActive: Date;
  latitude?: number;
  longitude?: number;
  distance?: number;
  isVisible: boolean; // privacy setting
  bio?: string;
}

// Mock shop locations in Germany
export const MOCK_SHOPS: Location[] = [
  {
    id: "shop1",
    name: "Green Galaxy Headshop",
    type: "headshop",
    latitude: 52.5200,
    longitude: 13.4050,
    address: "Warschauer Str. 34",
    city: "Berlin",
    postalCode: "10243",
    phone: "+49 30 12345678",
    website: "https://greengalaxy.de",
    openingHours: "Mo-Sa 11:00-20:00",
    rating: 4.6,
    reviewCount: 234,
    description: "Berlins größter Headshop mit riesiger Auswahl an Bongs, Vaporizern und Zubehör.",
    features: ["Vaporizer", "Bongs", "Papers", "Grinder", "CBD"],
    isVerified: true,
  },
  {
    id: "shop2",
    name: "Grow City Hamburg",
    type: "growshop",
    latitude: 53.5511,
    longitude: 9.9937,
    address: "Reeperbahn 56",
    city: "Hamburg",
    postalCode: "20359",
    phone: "+49 40 87654321",
    website: "https://growcity-hh.de",
    openingHours: "Mo-Fr 10:00-19:00, Sa 10:00-16:00",
    rating: 4.8,
    reviewCount: 189,
    description: "Professioneller Growshop mit Beratung. Alles für Indoor und Outdoor Anbau.",
    features: ["LED-Lampen", "Zelte", "Dünger", "Substrate", "Belüftung", "Beratung"],
    isVerified: true,
  },
  {
    id: "shop3",
    name: "Hanf Haus München",
    type: "headshop",
    latitude: 48.1351,
    longitude: 11.5820,
    address: "Sonnenstr. 12",
    city: "München",
    postalCode: "80331",
    phone: "+49 89 11223344",
    openingHours: "Mo-Sa 10:00-19:00",
    rating: 4.4,
    reviewCount: 156,
    description: "Traditioneller Headshop seit 1995. Große Auswahl an Hanfprodukten.",
    features: ["Bongs", "Papers", "Hanfkleidung", "CBD", "Bücher"],
    isVerified: true,
  },
  {
    id: "shop4",
    name: "Indoor Garden Köln",
    type: "growshop",
    latitude: 50.9375,
    longitude: 6.9603,
    address: "Ehrenstr. 78",
    city: "Köln",
    postalCode: "50672",
    phone: "+49 221 99887766",
    website: "https://indoorgarden-koeln.de",
    openingHours: "Mo-Fr 11:00-19:00, Sa 11:00-17:00",
    rating: 4.7,
    reviewCount: 203,
    description: "Spezialist für Hydroponik und Indoor-Growing. Professionelle Beratung.",
    features: ["Hydroponik", "LED-Systeme", "Automatisierung", "Nährstoffe", "Klima"],
    isVerified: true,
  },
  {
    id: "shop5",
    name: "Smoke & Grow Frankfurt",
    type: "headshop",
    latitude: 50.1109,
    longitude: 8.6821,
    address: "Zeil 45",
    city: "Frankfurt",
    postalCode: "60313",
    openingHours: "Mo-Sa 10:00-20:00",
    rating: 4.3,
    reviewCount: 98,
    description: "Headshop mit großer Auswahl an Rauchzubehör und CBD-Produkten.",
    features: ["Vaporizer", "CBD", "Papers", "Grinder"],
    isVerified: false,
  },
];

// Mock Cannabis Social Clubs
export const MOCK_CLUBS: Location[] = [
  {
    id: "club1",
    name: "Green Circle Berlin",
    type: "club",
    latitude: 52.4934,
    longitude: 13.4234,
    address: "Mitgliedschaft erforderlich",
    city: "Berlin",
    postalCode: "10999",
    website: "https://greencircle-berlin.de",
    rating: 4.9,
    reviewCount: 67,
    description: "Einer der ersten Cannabis Social Clubs in Berlin. Fokus auf Bio-Anbau und Gemeinschaft.",
    features: ["Bio-Anbau", "Workshops", "Community Events", "Beratung"],
    isVerified: true,
  },
  {
    id: "club2",
    name: "Hanf Verein Hamburg",
    type: "club",
    latitude: 53.5653,
    longitude: 10.0014,
    address: "Mitgliedschaft erforderlich",
    city: "Hamburg",
    postalCode: "20095",
    rating: 4.7,
    reviewCount: 45,
    description: "Anbauvereinigung mit Fokus auf medizinische Sorten und Patientenbetreuung.",
    features: ["Medizinische Sorten", "Patientenberatung", "Qualitätskontrolle"],
    isVerified: true,
  },
  {
    id: "club3",
    name: "Cannabis Kultur Köln",
    type: "club",
    latitude: 50.9413,
    longitude: 6.9583,
    address: "Mitgliedschaft erforderlich",
    city: "Köln",
    postalCode: "50667",
    rating: 4.6,
    reviewCount: 38,
    description: "Kulturverein mit regelmäßigen Events und Bildungsangeboten rund um Cannabis.",
    features: ["Kulturevents", "Bildung", "Gemeinschaft", "Verschiedene Sorten"],
    isVerified: true,
  },
];

// Mock nearby members (for radar feature)
export const MOCK_NEARBY_MEMBERS: MemberProfile[] = [
  {
    id: "member1",
    userName: "GreenThumb420",
    level: 7,
    badge: "👑",
    experienceYears: 5,
    specialties: ["Indoor", "Hydroponik", "Autoflower"],
    isOnline: true,
    lastActive: new Date(),
    distance: 2.3,
    isVisible: true,
    bio: "Leidenschaftlicher Indoor-Grower. Immer offen für Erfahrungsaustausch!",
  },
  {
    id: "member2",
    userName: "CannaQueen",
    level: 5,
    badge: "🌳",
    experienceYears: 3,
    specialties: ["Outdoor", "Organisch", "Sativa"],
    isOnline: false,
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
    distance: 4.7,
    isVisible: true,
    bio: "Outdoor-Enthusiastin. Liebe die Natur und natürlichen Anbau.",
  },
  {
    id: "member3",
    userName: "MedGrower",
    level: 8,
    badge: "⭐",
    experienceYears: 8,
    specialties: ["Medizinisch", "CBD", "Extrakte"],
    isOnline: true,
    lastActive: new Date(),
    distance: 6.1,
    isVisible: true,
    bio: "Fokus auf medizinische Anwendungen und CBD-reiche Sorten.",
  },
  {
    id: "member4",
    userName: "SeedCollector",
    level: 6,
    badge: "🌲",
    experienceYears: 4,
    specialties: ["Genetik", "Züchtung", "Samen"],
    isOnline: false,
    lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000),
    distance: 8.9,
    isVisible: true,
    bio: "Sammler seltener Genetik. Tausche gerne Samen und Wissen.",
  },
];

// Tutorial videos from YouTube
export interface TutorialVideo {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
  channel: string;
  channelAvatar?: string;
  duration: string;
  views: number;
  category: "basics" | "advanced" | "problems" | "harvest" | "equipment" | "strains";
  difficulty: "beginner" | "intermediate" | "advanced";
  language: "de" | "en";
  isPremium?: boolean;
}

export const TUTORIAL_VIDEOS: TutorialVideo[] = [
  {
    id: "tut1",
    title: "Cannabis Anbau für Anfänger - Kompletter Guide",
    description: "Alles was du für deinen ersten Grow wissen musst. Von der Samenauswahl bis zur Ernte.",
    youtubeId: "dQw4w9WgXcQ", // placeholder
    channel: "GrowGuide DE",
    duration: "45:23",
    views: 234567,
    category: "basics",
    difficulty: "beginner",
    language: "de",
  },
  {
    id: "tut2",
    title: "Die perfekte Beleuchtung für Indoor Growing",
    description: "LED vs. HPS - Welche Lampe ist die richtige? Lichtspektrum und Abstände erklärt.",
    youtubeId: "dQw4w9WgXcQ",
    channel: "Indoor Grow Pro",
    duration: "28:15",
    views: 156789,
    category: "equipment",
    difficulty: "intermediate",
    language: "de",
  },
  {
    id: "tut3",
    title: "Schädlinge erkennen und bekämpfen",
    description: "Spinnmilben, Trauermücken, Thripse - So wirst du sie los ohne Chemie.",
    youtubeId: "dQw4w9WgXcQ",
    channel: "GrowGuide DE",
    duration: "32:45",
    views: 98765,
    category: "problems",
    difficulty: "intermediate",
    language: "de",
  },
  {
    id: "tut4",
    title: "Ernte, Trocknung und Aushärtung",
    description: "Der wichtigste Schritt für Qualität. So holst du das Maximum aus deiner Ernte.",
    youtubeId: "dQw4w9WgXcQ",
    channel: "Cannabis Kultur",
    duration: "38:20",
    views: 187654,
    category: "harvest",
    difficulty: "beginner",
    language: "de",
  },
  {
    id: "tut5",
    title: "SCROG Technik - Maximale Erträge",
    description: "Screen of Green erklärt. Schritt für Schritt zur perfekten Canopy.",
    youtubeId: "dQw4w9WgXcQ",
    channel: "Advanced Growing",
    duration: "42:10",
    views: 76543,
    category: "advanced",
    difficulty: "advanced",
    language: "de",
    isPremium: true,
  },
  {
    id: "tut6",
    title: "Nährstoffmangel erkennen - Blattdiagnose",
    description: "Gelbe Blätter? Braune Flecken? Lerne die Symptome zu deuten.",
    youtubeId: "dQw4w9WgXcQ",
    channel: "GrowGuide DE",
    duration: "25:30",
    views: 145678,
    category: "problems",
    difficulty: "beginner",
    language: "de",
  },
  {
    id: "tut7",
    title: "Die besten Sorten für Anfänger 2024",
    description: "Robuste, ertragreiche Sorten die Fehler verzeihen. Top 10 Empfehlungen.",
    youtubeId: "dQw4w9WgXcQ",
    channel: "Strain Reviews DE",
    duration: "18:45",
    views: 234567,
    category: "strains",
    difficulty: "beginner",
    language: "de",
  },
  {
    id: "tut8",
    title: "Hydroponik Setup für Einsteiger",
    description: "DWC, NFT, Ebb & Flow - Welches System passt zu dir?",
    youtubeId: "dQw4w9WgXcQ",
    channel: "Hydro Grow",
    duration: "52:15",
    views: 65432,
    category: "equipment",
    difficulty: "advanced",
    language: "de",
    isPremium: true,
  },
];

// Grow Journal Steps/Checklist
export interface GrowStep {
  id: string;
  phase: "germination" | "seedling" | "vegetative" | "flowering" | "harvest" | "drying" | "curing";
  order: number;
  title: string;
  description: string;
  tips: string[];
  duration?: string;
  isOptional?: boolean;
}

export const GROW_STEPS: GrowStep[] = [
  // Germination Phase
  {
    id: "germ1",
    phase: "germination",
    order: 1,
    title: "Samen auswählen",
    description: "Wähle qualitativ hochwertige Samen von einem seriösen Anbieter.",
    tips: ["Feminisierte Samen für garantiert weibliche Pflanzen", "Autoflower für schnellere Ernte", "Auf Genetik und Bewertungen achten"],
  },
  {
    id: "germ2",
    phase: "germination",
    order: 2,
    title: "Keimung starten",
    description: "Lege die Samen zwischen feuchte Papiertücher oder direkt in Anzuchterde.",
    tips: ["Temperatur 20-25°C optimal", "Dunkelheit während der Keimung", "Feucht, aber nicht nass halten"],
    duration: "1-5 Tage",
  },
  {
    id: "germ3",
    phase: "germination",
    order: 3,
    title: "Keimling einpflanzen",
    description: "Sobald die Pfahlwurzel 1-2cm lang ist, vorsichtig einpflanzen.",
    tips: ["Wurzel nach unten zeigen lassen", "Nur 1-2cm tief einsetzen", "Leicht angießen"],
  },
  // Seedling Phase
  {
    id: "seed1",
    phase: "seedling",
    order: 4,
    title: "Erste Blätter beobachten",
    description: "Die Keimblätter erscheinen, gefolgt von den ersten echten Blättern.",
    tips: ["Sanftes Licht verwenden", "Hohe Luftfeuchtigkeit (65-70%)", "Noch nicht düngen"],
    duration: "1-2 Wochen",
  },
  {
    id: "seed2",
    phase: "seedling",
    order: 5,
    title: "Lichtplan einrichten",
    description: "18/6 Lichtzyklus für photoperiodische Sorten, 20/4 für Autoflower.",
    tips: ["LED-Abstand anpassen", "Keine direkte Sonneneinstrahlung", "Timer verwenden"],
  },
  {
    id: "seed3",
    phase: "seedling",
    order: 6,
    title: "Erste leichte Düngung",
    description: "Nach 2-3 Wochen mit sehr verdünntem Dünger beginnen.",
    tips: ["1/4 der empfohlenen Dosis", "pH-Wert 6.0-6.5", "Überdüngung vermeiden"],
  },
  // Vegetative Phase
  {
    id: "veg1",
    phase: "vegetative",
    order: 7,
    title: "Umtopfen",
    description: "Wenn die Wurzeln den Topf füllen, in größeren Topf umsetzen.",
    tips: ["Mindestens 11L Endtopf", "Vorsichtig mit Wurzeln", "Nach Umtopfen nicht sofort düngen"],
    duration: "3-8 Wochen",
  },
  {
    id: "veg2",
    phase: "vegetative",
    order: 8,
    title: "Training beginnen",
    description: "LST, Topping oder SCROG anwenden für mehr Ertrag.",
    tips: ["LST ist am schonendsten", "Topping nur bei gesunden Pflanzen", "Nicht zu spät in der Vegi"],
    isOptional: true,
  },
  {
    id: "veg3",
    phase: "vegetative",
    order: 9,
    title: "Nährstoffplan anpassen",
    description: "Stickstoffbetonten Dünger in der Wachstumsphase verwenden.",
    tips: ["NPK-Verhältnis beachten", "Auf Mangelerscheinungen achten", "Regelmäßig pH messen"],
  },
  {
    id: "veg4",
    phase: "vegetative",
    order: 10,
    title: "Geschlecht bestimmen",
    description: "Bei regulären Samen auf Vorblüten achten.",
    tips: ["Männliche Pflanzen entfernen", "Weiblich: weiße Härchen", "Männlich: kleine Kugeln"],
  },
  // Flowering Phase
  {
    id: "flow1",
    phase: "flowering",
    order: 11,
    title: "Blüte einleiten",
    description: "Lichtzyklus auf 12/12 umstellen (nicht bei Autoflower).",
    tips: ["Absolute Dunkelheit wichtig", "Keine Lichtlecks", "Stretch-Phase erwarten"],
    duration: "7-12 Wochen",
  },
  {
    id: "flow2",
    phase: "flowering",
    order: 12,
    title: "Blütedünger verwenden",
    description: "Auf phosphor- und kaliumbetonten Dünger umstellen.",
    tips: ["Weniger Stickstoff", "PK-Booster in Woche 4-6", "Auf Überdüngung achten"],
  },
  {
    id: "flow3",
    phase: "flowering",
    order: 13,
    title: "Stützen anbringen",
    description: "Schwere Blüten können Äste abknicken.",
    tips: ["Yo-Yos oder Netze verwenden", "Früh genug stützen", "Luftzirkulation erhalten"],
  },
  {
    id: "flow4",
    phase: "flowering",
    order: 14,
    title: "Trichome beobachten",
    description: "Mit Lupe die Trichome auf Reife prüfen.",
    tips: ["Klar = zu früh", "Milchig = THC-Peak", "Bernstein = mehr CBD/CBN"],
  },
  {
    id: "flow5",
    phase: "flowering",
    order: 15,
    title: "Spülen vor der Ernte",
    description: "Letzte 1-2 Wochen nur mit klarem Wasser gießen.",
    tips: ["Verbessert Geschmack", "Nährstoffe auswaschen", "Blätter werden gelb = normal"],
  },
  // Harvest Phase
  {
    id: "harv1",
    phase: "harvest",
    order: 16,
    title: "Erntezeitpunkt bestimmen",
    description: "70-90% milchige Trichome mit 10-30% bernsteinfarbenen.",
    tips: ["Morgens ernten", "Vor dem Gießen", "Scharfe, saubere Schere"],
    duration: "1 Tag",
  },
  {
    id: "harv2",
    phase: "harvest",
    order: 17,
    title: "Pflanze schneiden",
    description: "Ganze Pflanze oder einzelne Äste abschneiden.",
    tips: ["Große Blätter entfernen", "Handschuhe tragen", "Werkzeug reinigen"],
  },
  {
    id: "harv3",
    phase: "harvest",
    order: 18,
    title: "Nass- oder Trockentrimmen",
    description: "Zuckerblätter entfernen - nass ist einfacher, trocken schonender.",
    tips: ["Trimm-Reste aufheben", "Scharfe Schere wichtig", "Geduld haben"],
  },
  // Drying Phase
  {
    id: "dry1",
    phase: "drying",
    order: 19,
    title: "Trocknung starten",
    description: "Aufhängen in dunklem Raum mit guter Luftzirkulation.",
    tips: ["Temperatur 18-22°C", "Luftfeuchtigkeit 50-60%", "Kein direkter Luftstrom"],
    duration: "7-14 Tage",
  },
  {
    id: "dry2",
    phase: "drying",
    order: 20,
    title: "Trocknungsfortschritt prüfen",
    description: "Kleine Zweige sollten knacken, nicht biegen.",
    tips: ["Täglich kontrollieren", "Nicht zu schnell trocknen", "Schimmel vermeiden"],
  },
  // Curing Phase
  {
    id: "cure1",
    phase: "curing",
    order: 21,
    title: "In Gläser füllen",
    description: "Getrocknete Blüten in luftdichte Gläser geben.",
    tips: ["Gläser nur 3/4 füllen", "Boveda-Packs optional", "Dunkel lagern"],
    duration: "2-8 Wochen",
  },
  {
    id: "cure2",
    phase: "curing",
    order: 22,
    title: "Tägliches Burpen",
    description: "Gläser täglich für 15-30 Minuten öffnen.",
    tips: ["Erste 2 Wochen täglich", "Danach alle paar Tage", "Auf Ammoniakgeruch achten"],
  },
  {
    id: "cure3",
    phase: "curing",
    order: 23,
    title: "Langzeitlagerung",
    description: "Nach 4+ Wochen Curing ist das Produkt bereit.",
    tips: ["Kühl und dunkel lagern", "Luftfeuchtigkeit 58-62%", "Kann monatelang halten"],
  },
];

// Helper functions
export function getPhaseLabel(phase: GrowStep["phase"]): string {
  const labels: Record<GrowStep["phase"], string> = {
    germination: "Keimung",
    seedling: "Sämling",
    vegetative: "Wachstum",
    flowering: "Blüte",
    harvest: "Ernte",
    drying: "Trocknung",
    curing: "Aushärtung",
  };
  return labels[phase];
}

export function getPhaseColor(phase: GrowStep["phase"]): string {
  const colors: Record<GrowStep["phase"], string> = {
    germination: "#8B5CF6",
    seedling: "#10B981",
    vegetative: "#22C55E",
    flowering: "#F59E0B",
    harvest: "#EF4444",
    drying: "#6366F1",
    curing: "#EC4899",
  };
  return colors[phase];
}

export function getCategoryLabel(category: TutorialVideo["category"]): string {
  const labels: Record<TutorialVideo["category"], string> = {
    basics: "Grundlagen",
    advanced: "Fortgeschritten",
    problems: "Probleme lösen",
    harvest: "Ernte",
    equipment: "Equipment",
    strains: "Sorten",
  };
  return labels[category];
}

export function formatViews(views: number): string {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(0)}K`;
  return views.toString();
}
