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

// Public Overpass servers are often at capacity, so try mirrors in order.
const OVERPASS_ENDPOINTS = [
  OVERPASS_ENDPOINT,
  "https://overpass.openstreetmap.fr/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const OVERPASS_TIMEOUT_MS = 15_000;
// overpass-api.de answers 406 to the default okhttp user agent, so identify ourselves.
const OVERPASS_HEADERS = {
  "Content-Type": "application/x-www-form-urlencoded",
  Accept: "*/*",
  "User-Agent": "GrowMasterAI/1.0 (https://growmaster.app)",
};
export const SHOP_SEARCH_RADIUS_M = 25000;
export const SHOP_CACHE_KEY = "radar_shops_cache_v2";
export const SHOP_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
// Cache is reused if user moved less than this (km)
export const SHOP_CACHE_MAX_DRIFT_KM = 3;

// Only dedicated shops: garden centres/DIY stores are far too broad for cannabis growing.
// shop=hydroponics -> growshop; shop=cannabis / headshop -> headshop
const GROWSHOP_TAGS = ["hydroponics"];
const HEADSHOP_TAGS = ["cannabis", "headshop"];

// OSM tags are user-edited: only allow http(s) links to reach Linking.openURL.
function safeWebUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const url = value.trim();
  return /^https?:\/\//i.test(url) ? url : undefined;
}

// Coordinates are rounded to ~1 km before leaving the device (privacy); the
// 25 km search radius does not need more precision.
export function buildOverpassQuery(
  lat: number,
  lon: number,
  radiusM = SHOP_SEARCH_RADIUS_M,
): string {
  const tags = [...GROWSHOP_TAGS, ...HEADSHOP_TAGS];
  const around = `(around:${Math.round(radiusM)},${lat.toFixed(2)},${lon.toFixed(2)})`;
  const parts = tags.map((t) => `nwr["shop"="${t}"]${around};`).join("");
  return `[out:json][timeout:25];(${parts});out center tags 100;`;
}

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
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
export function parseOverpassShops(
  json: unknown,
  userLat?: number,
  userLon?: number,
): Location[] {
  const elements: OverpassElement[] =
    json &&
    typeof json === "object" &&
    Array.isArray((json as { elements?: unknown }).elements)
      ? (json as { elements: OverpassElement[] }).elements
      : [];

  const seen = new Set<string>();
  const result: Location[] = [];

  for (const el of elements) {
    const tags = el.tags;
    if (!tags || !tags.name) continue;
    const shopType = tags.shop;
    if (
      !shopType ||
      (!GROWSHOP_TAGS.includes(shopType) && !HEADSHOP_TAGS.includes(shopType))
    )
      continue;
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
      address: street
        ? houseNumber
          ? `${street} ${houseNumber}`
          : street
        : "",
      city: tags["addr:city"] ?? "",
      postalCode: tags["addr:postcode"] ?? "",
      phone: tags.phone ?? tags["contact:phone"],
      website: safeWebUrl(tags.website ?? tags["contact:website"]),
      openingHours: tags.opening_hours,
      osmShopType: shopType,
    };
    if (typeof userLat === "number" && typeof userLon === "number") {
      location.distance =
        Math.round(haversineKm(userLat, userLon, latitude, longitude) * 10) /
        10;
    }
    result.push(location);
  }

  return result.sort(
    (a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity),
  );
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
  if (now - cache.fetchedAt > SHOP_CACHE_TTL_MS || now < cache.fetchedAt)
    return false;
  return (
    haversineKm(cache.latitude, cache.longitude, lat, lon) <=
    SHOP_CACHE_MAX_DRIFT_KM
  );
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
    const AsyncStorage = (
      await import("@react-native-async-storage/async-storage")
    ).default;
    const raw = await AsyncStorage.getItem(SHOP_CACHE_KEY);
    return raw ? (JSON.parse(raw) as ShopCache) : null;
  } catch {
    return null;
  }
}

async function writeCache(cache: ShopCache): Promise<void> {
  try {
    const AsyncStorage = (
      await import("@react-native-async-storage/async-storage")
    ).default;
    await AsyncStorage.setItem(SHOP_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // cache is best-effort
  }
}

/**
 * Fetches real shops near the user (OpenStreetMap). Never returns fake data:
 * on permission denial / offline / API error the list is empty (or a stale cache).
 */
export async function fetchNearbyShops(
  opts: { forceRefresh?: boolean } = {},
): Promise<NearbyShopsResult> {
  let lat: number;
  let lon: number;
  try {
    const ExpoLocation = await import("expo-location");
    const perm = await ExpoLocation.requestForegroundPermissionsAsync();
    if (perm.status !== "granted")
      return { status: "permission_denied", shops: [] };
    const pos =
      (await ExpoLocation.getLastKnownPositionAsync()) ??
      (await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      }));
    lat = pos.coords.latitude;
    lon = pos.coords.longitude;
  } catch {
    return { status: "location_unavailable", shops: [] };
  }

  const cache = await readCache();
  if (!opts.forceRefresh && isShopCacheValid(cache, lat, lon)) {
    // re-rank by distance from current position
    const shops = cache.shops
      .map((s) => ({
        ...s,
        distance:
          Math.round(haversineKm(lat, lon, s.latitude, s.longitude) * 10) / 10,
      }))
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    return { status: "ok", shops, fromCache: true };
  }

  const staleFallback = (status: NearbyShopsStatus): NearbyShopsResult =>
    cache && Array.isArray(cache.shops) && cache.shops.length > 0
      ? { status: "ok", shops: cache.shops, stale: true, fromCache: true }
      : { status, shops: [] };

  let response: Response | null = null;
  let reachedServer = false;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    // AbortSignal.timeout() does not exist in React Native's Hermes runtime
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), OVERPASS_TIMEOUT_MS);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: OVERPASS_HEADERS,
        body: `data=${encodeURIComponent(buildOverpassQuery(lat, lon))}`,
        signal: controller.signal,
      });
      reachedServer = true;
      if (res.ok) {
        response = res;
        break;
      }
    } catch {
      // network error or timeout: try the next mirror
    } finally {
      clearTimeout(timer);
    }
  }
  if (!response) return staleFallback(reachedServer ? "api_error" : "offline");

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    return staleFallback("api_error");
  }
  const shops = parseOverpassShops(json, lat, lon);
  await writeCache({
    latitude: lat,
    longitude: lon,
    fetchedAt: Date.now(),
    shops,
  });
  return { status: "ok", shops, fromCache: false };
}

// Tutorial videos from YouTube
export interface TutorialVideo {
  id: string;
  title: string;
  videoId: string; // verified via YouTube oEmbed
  channel: string;
  category:
    | "basics"
    | "advanced"
    | "problems"
    | "harvest"
    | "equipment"
    | "strains";
  difficulty: "beginner" | "intermediate" | "advanced";
  language: "de" | "en";
  isPremium?: boolean;
}

export const TUTORIAL_VIDEOS: TutorialVideo[] = [
  {
    id: "54JClBM_cOc",
    videoId: "54JClBM_cOc",
    title: "Typische Anfängerfehler im 🥦 Garten - Was du wissen solltest!",
    channel: "Vince and Weed",
    category: "basics",
    difficulty: "beginner",
    language: "de",
  },
  {
    id: "SNzFVmHYkUs",
    videoId: "SNzFVmHYkUs",
    title:
      "INDOOR Anbau für Anfänger so einfach wie möglich | Das Gut und Günstig GROWSET | Teil 1",
    channel: "Garten Eden 🌱",
    category: "basics",
    difficulty: "beginner",
    language: "de",
  },
  {
    id: "g3hVIMeRLVo",
    videoId: "g3hVIMeRLVo",
    title:
      "Indoor Cannabis Anbau: 10 TIPPS für ein SUPER Ergebnis! l Legalisierung Eigenanbau",
    channel: "Growstorys",
    category: "basics",
    difficulty: "beginner",
    language: "de",
  },
  {
    id: "EtN3IHJhCXo",
    videoId: "EtN3IHJhCXo",
    title: "5 Anfänger Tipps für den eigenen Anbau 😨 Samen keimen und dann?",
    channel: "Pott Planter",
    category: "basics",
    difficulty: "beginner",
    language: "de",
  },
  {
    id: "hylMwwNgp5c",
    videoId: "hylMwwNgp5c",
    title: "Samen richtig keimen lassen - WAS KANN SCHIEFGEHEN 😐❓",
    channel: "Vince and Weed",
    category: "basics",
    difficulty: "beginner",
    language: "de",
  },
  {
    id: "mlYUHapmiI8",
    videoId: "mlYUHapmiI8",
    title: "Samen richtig keimen in Erde, Teil 1: Wie tief rein? 🥦",
    channel: "Der Hanf lebt",
    category: "basics",
    difficulty: "beginner",
    language: "de",
  },
  {
    id: "RQw5lcQicMo",
    videoId: "RQw5lcQicMo",
    title: "Samen richtig keimen, Teil 3: Light Mix Erde vs Jiffys 🥦",
    channel: "Der Hanf lebt",
    category: "basics",
    difficulty: "beginner",
    language: "de",
  },
  {
    id: "pqU_iWfYWmc",
    videoId: "pqU_iWfYWmc",
    title:
      "🥦 Samen in Wasser einweichen und keimen lassen oder direkt in Erde?",
    channel: "Der Hanf lebt",
    category: "basics",
    difficulty: "beginner",
    language: "de",
  },
  {
    id: "w0URefYmCQs",
    videoId: "w0URefYmCQs",
    title:
      "Keimung von Hanf in 48 Stunden? Diese 3 Methoden machen es möglich⚠️+ erhöhte Keimrate + Lagerung",
    channel: "crazyplantboy",
    category: "basics",
    difficulty: "beginner",
    language: "de",
  },
  {
    id: "3q7MG1daOd8",
    videoId: "3q7MG1daOd8",
    title: "Samen keimen lassen | Hanfsamen keimen lassen in Erde",
    channel: "Online Growshop Growchamp",
    category: "basics",
    difficulty: "beginner",
    language: "de",
  },
  {
    id: "ww7_81UuxDA",
    videoId: "ww7_81UuxDA",
    title:
      "Wie erkennt man ob eine Cannabis Pflanze männlich oder weiblich ist?",
    channel: "Vince and Weed",
    category: "basics",
    difficulty: "beginner",
    language: "de",
  },
  {
    id: "dED8tUjcgRE",
    videoId: "dED8tUjcgRE",
    title: "Welche Cannabis Samen sind die besten für ...?",
    channel: "Vince and Weed",
    category: "strains",
    difficulty: "beginner",
    language: "de",
  },
  {
    id: "24ODApfKRuY",
    videoId: "24ODApfKRuY",
    title:
      "STOPP! 😵 Darum werden deine Pflanzen gelb! Nährstoffmangel Düngen und Co.",
    channel: "Pott Planter",
    category: "problems",
    difficulty: "beginner",
    language: "de",
  },
  {
    id: "fClJHJ_eiGE",
    videoId: "fClJHJ_eiGE",
    title:
      "SPINNMILBEN BEKÄMPFEN: So gehst du ganz natürlich gegen die Schädlinge vor! 🕸",
    channel: "Natürlich im Garten [mit Neudorff]",
    category: "problems",
    difficulty: "beginner",
    language: "de",
  },
  {
    id: "W_i9rPBCeWM",
    videoId: "W_i9rPBCeWM",
    title: "Trauermücken loswerden: 3 wirksame Hausmittel",
    channel: "Wurzelwerk",
    category: "problems",
    difficulty: "beginner",
    language: "de",
  },
  {
    id: "DPPUnjoAnxk",
    videoId: "DPPUnjoAnxk",
    title: "Die NACHTEILE von NEEMÖL für Thripse, spinnmilben usw",
    channel: "Plentyplants",
    category: "problems",
    difficulty: "intermediate",
    language: "de",
  },
  {
    id: "Q9z8g7ObN9Q",
    videoId: "Q9z8g7ObN9Q",
    title:
      "LIVINGSOIL Experte Flo zeigt wie man richtiges Living Soil macht Ein Beet für 3 Pflanzen Florganics",
    channel: "WEED LAND",
    category: "equipment",
    difficulty: "intermediate",
    language: "de",
  },
  {
    id: "lvx5fdsyYGg",
    videoId: "lvx5fdsyYGg",
    title:
      "Greenhouse Powder Feeding / DOSIERUNG, ANWENDUNG, PREIS / meine Erfahrungen nach 3 Grows",
    channel: "Die Tomate",
    category: "equipment",
    difficulty: "intermediate",
    language: "de",
  },
  {
    id: "upejhnlRfVA",
    videoId: "upejhnlRfVA",
    title: "Grow Talk - ALLES WAS DU ÜBER RDWC WISSEN MUSST!",
    channel: "Doctor Terpenstein",
    category: "equipment",
    difficulty: "advanced",
    language: "de",
  },
  {
    id: "0R3hbKsQj8Q",
    videoId: "0R3hbKsQj8Q",
    title: "Growen ohne Erde - Was du vom Profi über Hydro lernen kannst!",
    channel: "Vince and Weed",
    category: "equipment",
    difficulty: "advanced",
    language: "de",
  },
  {
    id: "yhmb4TuUZDw",
    videoId: "yhmb4TuUZDw",
    title: "Anbau in fließendem Wasser - Mit Hydroponik zum maximalen Ertrag",
    channel: "Vince and Weed",
    category: "equipment",
    difficulty: "advanced",
    language: "de",
  },
  {
    id: "LYP6YlkjAoI",
    videoId: "LYP6YlkjAoI",
    title:
      "Cannabis-Anbau in Perfektion: Crop Steering auf Steinwolle auf 3 Ebenen",
    channel: "Research Gardens",
    category: "advanced",
    difficulty: "advanced",
    language: "de",
  },
  {
    id: "Dlk_wjP3Dmc",
    videoId: "Dlk_wjP3Dmc",
    title:
      "Wundermittel Mikroalgen? Mehr Ertrag? mehr Terpene? mehr Wirkstoff?",
    channel: "Vince and Weed",
    category: "advanced",
    difficulty: "advanced",
    language: "de",
  },
  {
    id: "tx6ue1yt5M4",
    videoId: "tx6ue1yt5M4",
    title: "Cannabis aus Jordanien? Indoor Anbau mit Sonnenlicht!",
    channel: "Vince and Weed",
    category: "advanced",
    difficulty: "advanced",
    language: "de",
  },
  {
    id: "bo3uA5hqh50",
    videoId: "bo3uA5hqh50",
    title:
      "Maximaler Ertrag – So füllst du dein gesamtes Zelt mit Low und High Stress Training",
    channel: "Vince and Weed",
    category: "advanced",
    difficulty: "intermediate",
    language: "de",
  },
  {
    id: "amXxEWTwlOc",
    videoId: "amXxEWTwlOc",
    title: "Low Stress Training für Automatics",
    channel: "Guerilla Growing",
    category: "advanced",
    difficulty: "intermediate",
    language: "de",
  },
  {
    id: "T7IhY1zzybA",
    videoId: "T7IhY1zzybA",
    title:
      "Low Stress Training LST für mehr Ertrag - (Anleitung) Growserie Folge 04",
    channel: "Hightere Gedanken",
    category: "advanced",
    difficulty: "intermediate",
    language: "de",
  },
  {
    id: "Zd3wrDjE9lQ",
    videoId: "Zd3wrDjE9lQ",
    title:
      "🍀Das erste Training: ➰Draht, Clips & ✂️Topping für erfolgreichen Anbau!",
    channel: "GrowWave420",
    category: "advanced",
    difficulty: "intermediate",
    language: "de",
  },
  {
    id: "uiwpZunCvWk",
    videoId: "uiwpZunCvWk",
    title: "Sie ist eskaliert 😨 Low Stress Training mal anders! Folge 2",
    channel: "Pott Planter",
    category: "advanced",
    difficulty: "intermediate",
    language: "de",
  },
  {
    id: "qP2OvKkt8_0",
    videoId: "qP2OvKkt8_0",
    title: "Toppen, LST, Lollipopping, uvm. - Trainingstechniken im Detail",
    channel: "CannaZen",
    category: "advanced",
    difficulty: "intermediate",
    language: "de",
  },
  {
    id: "sc8C9P8Mev0",
    videoId: "sc8C9P8Mev0",
    title:
      "Einfach mal schneiden! 😨 Topping früher oder später? Das ist passiert! Folge 1",
    channel: "Pott Planter",
    category: "advanced",
    difficulty: "intermediate",
    language: "de",
  },
  {
    id: "KX9QQue072w",
    videoId: "KX9QQue072w",
    title:
      "Cannabis Tag 30 Vorblüte - Düngen, Lollipopping & Low Stress Training (LST) für Autoflowers",
    channel: "Growkkoli",
    category: "advanced",
    difficulty: "intermediate",
    language: "de",
  },
  {
    id: "a2dvPckbWEU",
    videoId: "a2dvPckbWEU",
    title: "WIE du dein CANNABIS richtig TROCKNEST 🥦",
    channel: "Vince and Weed",
    category: "harvest",
    difficulty: "beginner",
    language: "de",
  },
  {
    id: "sx02puVyAVI",
    videoId: "sx02puVyAVI",
    title: "Die Ernte ist da 😱 Lagern und richtig Fermentieren für Anfänger!",
    channel: "Pott Planter",
    category: "harvest",
    difficulty: "beginner",
    language: "de",
  },
  {
    id: "Q1Iz4ak-OT0",
    videoId: "Q1Iz4ak-OT0",
    title: "Cannabis Ernten, Trocknen und Lagern 🥦 Komplette Anleitung",
    channel: "Ivo",
    category: "harvest",
    difficulty: "beginner",
    language: "de",
  },
  {
    id: "Gf4qZcyQnoo",
    videoId: "Gf4qZcyQnoo",
    title: "Zeit zu Ernten 🥦 Anbau #3 🌿Trocknung & Curing",
    channel: "CannaZen",
    category: "harvest",
    difficulty: "intermediate",
    language: "de",
  },
  {
    id: "N_DEZ4fLtsA",
    videoId: "N_DEZ4fLtsA",
    title: "Wann ist der Grow bereit zur Ernte? Geniale Methode",
    channel: "Blütephase",
    category: "harvest",
    difficulty: "beginner",
    language: "de",
  },
  {
    id: "8TZ0J7fKe84",
    videoId: "8TZ0J7fKe84",
    title:
      "Anleitung Cannabis Ernten Trocknen Schneidetechnik nass & trocken Schimmel frei für sichere Medizin",
    channel: "WEED LAND",
    category: "harvest",
    difficulty: "beginner",
    language: "de",
  },
  {
    id: "ztjCauoCtrA",
    videoId: "ztjCauoCtrA",
    title:
      "Ernte richtig trocknen 🥦 | Bedingungen | Ablauf | Mit und ohne Zelt, Automat, Box, Karton | Anfänger",
    channel: "Der Hanf lebt",
    category: "harvest",
    difficulty: "beginner",
    language: "de",
  },
  {
    id: "0Qx-riNCO6c",
    videoId: "0Qx-riNCO6c",
    title: "Der RICHTIGE ZEITPUNKT zum ERNTEN💜",
    channel: "Growmotion",
    category: "harvest",
    difficulty: "beginner",
    language: "de",
  },
  {
    id: "ItHnE6umsI0",
    videoId: "ItHnE6umsI0",
    title:
      "Der perfekte Erntezeitpunkt? 😱 Einfacher geht's nicht und so macht man es richtig!",
    channel: "Pott Planter",
    category: "harvest",
    difficulty: "beginner",
    language: "de",
  },
  {
    id: "z-PsD3LOCJs",
    videoId: "z-PsD3LOCJs",
    title: "Blüten trocknen & curen: Was Physik und Studien wirklich zeigen",
    channel: "HerbSpot",
    category: "harvest",
    difficulty: "intermediate",
    language: "de",
  },
];

// Grow Journal Steps/Checklist
export interface GrowStep {
  id: string;
  phase:
    | "germination"
    | "seedling"
    | "vegetative"
    | "flowering"
    | "harvest"
    | "drying"
    | "curing";
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
    description:
      "Wähle qualitativ hochwertige Samen von einem seriösen Anbieter.",
    tips: [
      "Feminisierte Samen für garantiert weibliche Pflanzen",
      "Autoflower für schnellere Ernte",
      "Auf Genetik und Bewertungen achten",
    ],
  },
  {
    id: "germ2",
    phase: "germination",
    order: 2,
    title: "Keimung starten",
    description:
      "Lege die Samen zwischen feuchte Papiertücher oder direkt in Anzuchterde.",
    tips: [
      "Temperatur 20-25°C optimal",
      "Dunkelheit während der Keimung",
      "Feucht, aber nicht nass halten",
    ],
    duration: "1-5 Tage",
  },
  {
    id: "germ3",
    phase: "germination",
    order: 3,
    title: "Keimling einpflanzen",
    description:
      "Sobald die Pfahlwurzel 1-2cm lang ist, vorsichtig einpflanzen.",
    tips: [
      "Wurzel nach unten zeigen lassen",
      "Nur 1-2cm tief einsetzen",
      "Leicht angießen",
    ],
  },
  // Seedling Phase
  {
    id: "seed1",
    phase: "seedling",
    order: 4,
    title: "Erste Blätter beobachten",
    description:
      "Die Keimblätter erscheinen, gefolgt von den ersten echten Blättern.",
    tips: [
      "Sanftes Licht verwenden",
      "Hohe Luftfeuchtigkeit (65-70%)",
      "Noch nicht düngen",
    ],
    duration: "1-2 Wochen",
  },
  {
    id: "seed2",
    phase: "seedling",
    order: 5,
    title: "Lichtplan einrichten",
    description:
      "18/6 Lichtzyklus für photoperiodische Sorten, 20/4 für Autoflower.",
    tips: [
      "LED-Abstand anpassen",
      "Keine direkte Sonneneinstrahlung",
      "Timer verwenden",
    ],
  },
  {
    id: "seed3",
    phase: "seedling",
    order: 6,
    title: "Erste leichte Düngung",
    description: "Nach 2-3 Wochen mit sehr verdünntem Dünger beginnen.",
    tips: [
      "1/4 der empfohlenen Dosis",
      "pH-Wert 6.0-6.5",
      "Überdüngung vermeiden",
    ],
  },
  // Vegetative Phase
  {
    id: "veg1",
    phase: "vegetative",
    order: 7,
    title: "Umtopfen",
    description: "Wenn die Wurzeln den Topf füllen, in größeren Topf umsetzen.",
    tips: [
      "Mindestens 11L Endtopf",
      "Vorsichtig mit Wurzeln",
      "Nach Umtopfen nicht sofort düngen",
    ],
    duration: "3-8 Wochen",
  },
  {
    id: "veg2",
    phase: "vegetative",
    order: 8,
    title: "Training beginnen",
    description: "LST, Topping oder SCROG anwenden für mehr Ertrag.",
    tips: [
      "LST ist am schonendsten",
      "Topping nur bei gesunden Pflanzen",
      "Nicht zu spät in der Vegi",
    ],
    isOptional: true,
  },
  {
    id: "veg3",
    phase: "vegetative",
    order: 9,
    title: "Nährstoffplan anpassen",
    description: "Stickstoffbetonten Dünger in der Wachstumsphase verwenden.",
    tips: [
      "NPK-Verhältnis beachten",
      "Auf Mangelerscheinungen achten",
      "Regelmäßig pH messen",
    ],
  },
  {
    id: "veg4",
    phase: "vegetative",
    order: 10,
    title: "Geschlecht bestimmen",
    description: "Bei regulären Samen auf Vorblüten achten.",
    tips: [
      "Männliche Pflanzen entfernen",
      "Weiblich: weiße Härchen",
      "Männlich: kleine Kugeln",
    ],
  },
  // Flowering Phase
  {
    id: "flow1",
    phase: "flowering",
    order: 11,
    title: "Blüte einleiten",
    description: "Lichtzyklus auf 12/12 umstellen (nicht bei Autoflower).",
    tips: [
      "Absolute Dunkelheit wichtig",
      "Keine Lichtlecks",
      "Stretch-Phase erwarten",
    ],
    duration: "7-12 Wochen",
  },
  {
    id: "flow2",
    phase: "flowering",
    order: 12,
    title: "Blütedünger verwenden",
    description: "Auf phosphor- und kaliumbetonten Dünger umstellen.",
    tips: [
      "Weniger Stickstoff",
      "PK-Booster in Woche 4-6",
      "Auf Überdüngung achten",
    ],
  },
  {
    id: "flow3",
    phase: "flowering",
    order: 13,
    title: "Stützen anbringen",
    description: "Schwere Blüten können Äste abknicken.",
    tips: [
      "Yo-Yos oder Netze verwenden",
      "Früh genug stützen",
      "Luftzirkulation erhalten",
    ],
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
    tips: [
      "Verbessert Geschmack",
      "Nährstoffe auswaschen",
      "Blätter werden gelb = normal",
    ],
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
    description:
      "Zuckerblätter entfernen - nass ist einfacher, trocken schonender.",
    tips: ["Trimm-Reste aufheben", "Scharfe Schere wichtig", "Geduld haben"],
  },
  // Drying Phase
  {
    id: "dry1",
    phase: "drying",
    order: 19,
    title: "Trocknung starten",
    description: "Aufhängen in dunklem Raum mit guter Luftzirkulation.",
    tips: [
      "Temperatur 18-22°C",
      "Luftfeuchtigkeit 50-60%",
      "Kein direkter Luftstrom",
    ],
    duration: "7-14 Tage",
  },
  {
    id: "dry2",
    phase: "drying",
    order: 20,
    title: "Trocknungsfortschritt prüfen",
    description: "Kleine Zweige sollten knacken, nicht biegen.",
    tips: [
      "Täglich kontrollieren",
      "Nicht zu schnell trocknen",
      "Schimmel vermeiden",
    ],
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
    tips: [
      "Erste 2 Wochen täglich",
      "Danach alle paar Tage",
      "Auf Ammoniakgeruch achten",
    ],
  },
  {
    id: "cure3",
    phase: "curing",
    order: 23,
    title: "Langzeitlagerung",
    description: "Nach 4+ Wochen Curing ist das Produkt bereit.",
    tips: [
      "Kühl und dunkel lagern",
      "Luftfeuchtigkeit 58-62%",
      "Kann monatelang halten",
    ],
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
  return `https://www.youtube.com/watch?v=${video.videoId}`;
}
