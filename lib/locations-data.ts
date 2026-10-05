// Locations data for shops, clubs, and member radar

export type LocationType = "headshop" | "growshop";

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
  /** OSM shop tag the entry was derived from */
  osmShopType: string;
  /** distance to the user in km */
  distance?: number;
}

// ==================== REAL POI DATA (OpenStreetMap / Overpass) ====================
// Clubs and nearby members have no real data source -> intentionally no data here.

export const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";
export const SHOP_SEARCH_RADIUS_M = 25000;
export const SHOP_CACHE_KEY = "radar_shops_cache_v1";
export const SHOP_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
// Cache is reused if user moved less than this (km)
export const SHOP_CACHE_MAX_DRIFT_KM = 3;

// shop=hydroponics / garden_centre -> growshop; shop=cannabis / headshop -> headshop
const GROWSHOP_TAGS = ["hydroponics", "garden_centre"];
const HEADSHOP_TAGS = ["cannabis", "headshop"];

export function buildOverpassQuery(lat: number, lon: number, radiusM = SHOP_SEARCH_RADIUS_M): string {
  const tags = [...GROWSHOP_TAGS, ...HEADSHOP_TAGS];
  const around = `(around:${Math.round(radiusM)},${lat.toFixed(5)},${lon.toFixed(5)})`;
  const parts = tags.map(t => `nwr["shop"="${t}"]${around};`).join("");
  return `[out:json][timeout:25];(${parts});out center tags 100;`;
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

interface OverpassElement {
  type?: string;
  id?: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
}

/**
 * Pure parser: Overpass JSON -> Location[] sorted by distance.
 * Unnamed or coordinate-less elements are dropped; no data is invented.
 */
export function parseOverpassShops(json: unknown, userLat?: number, userLon?: number): Location[] {
  const elements: OverpassElement[] =
    json && typeof json === "object" && Array.isArray((json as { elements?: unknown }).elements)
      ? (json as { elements: OverpassElement[] }).elements
      : [];

  const seen = new Set<string>();
  const result: Location[] = [];

  for (const el of elements) {
    const tags = el.tags;
    if (!tags || !tags.name) continue;
    const shopType = tags.shop;
    if (!shopType || (!GROWSHOP_TAGS.includes(shopType) && !HEADSHOP_TAGS.includes(shopType))) continue;
    const latitude = el.lat ?? el.center?.lat;
    const longitude = el.lon ?? el.center?.lon;
    if (typeof latitude !== "number" || typeof longitude !== "number") continue;
    const id = `${el.type ?? "node"}/${el.id ?? `${latitude},${longitude}`}`;
    if (seen.has(id)) continue;
    seen.add(id);

    const street = tags["addr:street"];
    const houseNumber = tags["addr:housenumber"];
    const location: Location = {
      id,
      name: tags.name,
      type: GROWSHOP_TAGS.includes(shopType) ? "growshop" : "headshop",
      latitude,
      longitude,
      address: street ? (houseNumber ? `${street} ${houseNumber}` : street) : "",
      city: tags["addr:city"] ?? "",
      postalCode: tags["addr:postcode"] ?? "",
      phone: tags.phone ?? tags["contact:phone"],
      website: tags.website ?? tags["contact:website"],
      openingHours: tags.opening_hours,
      osmShopType: shopType,
    };
    if (typeof userLat === "number" && typeof userLon === "number") {
      location.distance = Math.round(haversineKm(userLat, userLon, latitude, longitude) * 10) / 10;
    }
    result.push(location);
  }

  return result.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
}

export interface ShopCache {
  latitude: number;
  longitude: number;
  fetchedAt: number;
  shops: Location[];
}

/** Pure: is the cache still usable for the given position? */
export function isShopCacheValid(
  cache: ShopCache | null | undefined,
  lat: number,
  lon: number,
  now = Date.now(),
): cache is ShopCache {
  if (!cache || !Array.isArray(cache.shops)) return false;
  if (now - cache.fetchedAt > SHOP_CACHE_TTL_MS || now < cache.fetchedAt) return false;
  return haversineKm(cache.latitude, cache.longitude, lat, lon) <= SHOP_CACHE_MAX_DRIFT_KM;
}

export type NearbyShopsStatus =
  | "ok"
  | "permission_denied"
  | "location_unavailable"
  | "offline" // network failure, no cache
  | "api_error"; // Overpass returned an error, no cache

export interface NearbyShopsResult {
  status: NearbyShopsStatus;
  shops: Location[];
  /** true if shops come from the cache although a fresh request failed */
  stale?: boolean;
  fromCache?: boolean;
}

async function readCache(): Promise<ShopCache | null> {
  try {
    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    const raw = await AsyncStorage.getItem(SHOP_CACHE_KEY);
    return raw ? (JSON.parse(raw) as ShopCache) : null;
  } catch {
    return null;
  }
}

async function writeCache(cache: ShopCache): Promise<void> {
  try {
    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    await AsyncStorage.setItem(SHOP_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // cache is best-effort
  }
}

/**
 * Fetches real shops near the user (OpenStreetMap). Never returns fake data:
 * on permission denial / offline / API error the list is empty (or a stale cache).
 */
export async function fetchNearbyShops(opts: { forceRefresh?: boolean } = {}): Promise<NearbyShopsResult> {
  let lat: number;
  let lon: number;
  try {
    const ExpoLocation = await import("expo-location");
    const perm = await ExpoLocation.requestForegroundPermissionsAsync();
    if (perm.status !== "granted") return { status: "permission_denied", shops: [] };
    const pos =
      (await ExpoLocation.getLastKnownPositionAsync()) ??
      (await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced }));
    lat = pos.coords.latitude;
    lon = pos.coords.longitude;
  } catch {
    return { status: "location_unavailable", shops: [] };
  }

  const cache = await readCache();
  if (!opts.forceRefresh && isShopCacheValid(cache, lat, lon)) {
    // re-rank by distance from current position
    const shops = cache.shops
      .map(s => ({ ...s, distance: Math.round(haversineKm(lat, lon, s.latitude, s.longitude) * 10) / 10 }))
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    return { status: "ok", shops, fromCache: true };
  }

  const staleFallback = (status: NearbyShopsStatus): NearbyShopsResult =>
    cache && Array.isArray(cache.shops) && cache.shops.length > 0
      ? { status: "ok", shops: cache.shops, stale: true, fromCache: true }
      : { status, shops: [] };

  let response: Response;
  try {
    response = await fetch(OVERPASS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(buildOverpassQuery(lat, lon))}`,
    });
  } catch {
    return staleFallback("offline");
  }
  if (!response.ok) return staleFallback("api_error");

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    return staleFallback("api_error");
  }
  const shops = parseOverpassShops(json, lat, lon);
  await writeCache({ latitude: lat, longitude: lon, fetchedAt: Date.now(), shops });
  return { status: "ok", shops, fromCache: false };
}


// Tutorial videos from YouTube
export interface TutorialVideo {
  id: string;
  title: string;
  description: string;
  youtubeSearchQuery: string; // opens a real YouTube search (no unverified video IDs)
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
    youtubeSearchQuery: "Cannabis Anbau für Anfänger Kompletter Guide",
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
    youtubeSearchQuery: "Die perfekte Beleuchtung für Indoor Growing",
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
    youtubeSearchQuery: "Schädlinge erkennen und bekämpfen",
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
    youtubeSearchQuery: "Ernte, Trocknung und Aushärtung",
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
    youtubeSearchQuery: "SCROG Technik Maximale Erträge",
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
    youtubeSearchQuery: "Nährstoffmangel erkennen Blattdiagnose",
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
    youtubeSearchQuery: "Die besten Sorten für Anfänger 2024",
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
    youtubeSearchQuery: "Hydroponik Setup für Einsteiger",
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

export function getTutorialUrl(video: TutorialVideo): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(video.youtubeSearchQuery)}`;
}
