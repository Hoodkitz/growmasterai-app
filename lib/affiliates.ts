/**
 * GrowMaster AI - Affiliate System
 * 
 * Dieses Modul verwaltet alle Affiliate-Partnerschaften und Links.
 * Die Affiliate-IDs müssen nach Registrierung bei den jeweiligen Partnern
 * in den Umgebungsvariablen hinterlegt werden.
 */

// Affiliate IDs aus Umgebungsvariablen (nach Registrierung eintragen)
const AFFILIATE_IDS = {
  ZAMNESIA: process.env.EXPO_PUBLIC_AFFILIATE_ZAMNESIA || "growmaster",
  SENSISEEDS: process.env.EXPO_PUBLIC_AFFILIATE_SENSISEEDS || "growmaster",
  DUTCH_HEADSHOP: process.env.EXPO_PUBLIC_AFFILIATE_DUTCH_HEADSHOP || "growmaster",
  RQS: process.env.EXPO_PUBLIC_AFFILIATE_RQS || "growmaster",
  SEEDSMAN: process.env.EXPO_PUBLIC_AFFILIATE_SEEDSMAN || "growmaster",
  AMAZON: process.env.EXPO_PUBLIC_AFFILIATE_AMAZON || "plantdoctor-21",
  GROWLAND: process.env.EXPO_PUBLIC_AFFILIATE_GROWLAND || "growmaster",
  CANNACONNECTION: process.env.EXPO_PUBLIC_AFFILIATE_CANNACONNECTION || "growmaster",
  GROW_GURU: process.env.EXPO_PUBLIC_AFFILIATE_GROW_GURU || "087442201",
};

export interface AffiliatePartner {
  id: string;
  name: string;
  description: string;
  category: "seeds" | "equipment" | "nutrients" | "general";
  baseUrl: string;
  affiliateParam: string;
  affiliateId: string;
  logo?: string;
  commission: string;
  cookieDuration: string;
  signupUrl: string;
  featured: boolean;
}

export const AFFILIATE_PARTNERS: AffiliatePartner[] = [
  {
    id: "zamnesia",
    name: "Zamnesia",
    description: "Europas größter Online-Headshop mit riesiger Samen-Auswahl",
    category: "seeds",
    baseUrl: "https://www.zamnesia.com",
    affiliateParam: "ref",
    affiliateId: AFFILIATE_IDS.ZAMNESIA,
    commission: "10-15%",
    cookieDuration: "30 Tage",
    signupUrl: "https://www.zamnesia.com/affiliate-program",
    featured: true,
  },
  {
    id: "sensiseeds",
    name: "Sensi Seeds",
    description: "Legendäre Samenbank seit 1985 mit preisgekrönten Genetiken",
    category: "seeds",
    baseUrl: "https://sensiseeds.com",
    affiliateParam: "a_aid",
    affiliateId: AFFILIATE_IDS.SENSISEEDS,
    commission: "10%",
    cookieDuration: "90 Tage",
    signupUrl: "https://sensiseeds.com/affiliate",
    featured: true,
  },
  {
    id: "dutch-headshop",
    name: "Dutch-Headshop",
    description: "Niederländischer Headshop mit breitem Sortiment",
    category: "general",
    baseUrl: "https://www.dutch-headshop.de",
    affiliateParam: "ref",
    affiliateId: AFFILIATE_IDS.DUTCH_HEADSHOP,
    commission: "8%",
    cookieDuration: "30 Tage",
    signupUrl: "https://www.dutch-headshop.de/affiliate",
    featured: false,
  },
  {
    id: "rqs",
    name: "Royal Queen Seeds",
    description: "Premium Cannabis-Samen aus den Niederlanden",
    category: "seeds",
    baseUrl: "https://www.royalqueenseeds.de",
    affiliateParam: "ref",
    affiliateId: AFFILIATE_IDS.RQS,
    commission: "15%",
    cookieDuration: "60 Tage",
    signupUrl: "https://www.royalqueenseeds.com/affiliate-program",
    featured: true,
  },
  {
    id: "seedsman",
    name: "Seedsman",
    description: "Weltweiter Samen-Distributor mit über 4000 Sorten",
    category: "seeds",
    baseUrl: "https://www.seedsman.com",
    affiliateParam: "a_aid",
    affiliateId: AFFILIATE_IDS.SEEDSMAN,
    commission: "15%",
    cookieDuration: "90 Tage",
    signupUrl: "https://www.seedsman.com/affiliate-program",
    featured: true,
  },
  {
    id: "amazon",
    name: "Amazon",
    description: "Grow-Equipment, Bücher und Zubehör",
    category: "equipment",
    baseUrl: "https://www.amazon.de",
    affiliateParam: "tag",
    affiliateId: AFFILIATE_IDS.AMAZON,
    commission: "1-10%",
    cookieDuration: "24 Stunden",
    signupUrl: "https://partnernet.amazon.de",
    featured: false,
  },
  {
    id: "growland",
    name: "Growland",
    description: "Deutscher Growshop für Equipment und Zubehör",
    category: "equipment",
    baseUrl: "https://www.growland.net",
    affiliateParam: "ref",
    affiliateId: AFFILIATE_IDS.GROWLAND,
    commission: "5%",
    cookieDuration: "30 Tage",
    signupUrl: "https://www.growland.net/affiliate",
    featured: false,
  },
  {
    id: "cannaconnection",
    name: "CannaConnection",
    description: "Cannabis-Informationsportal mit Shop-Vergleich",
    category: "general",
    baseUrl: "https://www.cannaconnection.de",
    affiliateParam: "ref",
    affiliateId: AFFILIATE_IDS.CANNACONNECTION,
    commission: "Variable",
    cookieDuration: "30 Tage",
    signupUrl: "https://www.cannaconnection.com/affiliate",
    featured: false,
  },
  {
    id: "grow-guru",
    name: "Grow-Guru.com",
    description: "Premium Growshop für Equipment, Dünger und Zubehör",
    category: "equipment",
    baseUrl: "https://www.grow-guru.com",
    affiliateParam: "partner",
    affiliateId: AFFILIATE_IDS.GROW_GURU,
    commission: "5-10%",
    cookieDuration: "30 Tage",
    signupUrl: "https://www.grow-guru.com/partner",
    featured: true,
  },
];

/**
 * Generiert einen Affiliate-Link für einen Partner
 */
export function generateAffiliateLink(
  partnerId: string,
  path: string = "",
  additionalParams?: Record<string, string>
): string {
  const partner = AFFILIATE_PARTNERS.find(p => p.id === partnerId);
  if (!partner) {
    console.warn(`[Affiliates] Unknown partner: ${partnerId}`);
    return "";
  }

  const url = new URL(path || "/", partner.baseUrl);
  url.searchParams.set(partner.affiliateParam, partner.affiliateId);
  
  // UTM-Parameter für Tracking
  url.searchParams.set("utm_source", "growmaster");
  url.searchParams.set("utm_medium", "app");
  url.searchParams.set("utm_campaign", "affiliate");
  
  if (additionalParams) {
    Object.entries(additionalParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return url.toString();
}

/**
 * Generiert einen Affiliate-Link für eine bestimmte Sorte
 */
export function generateStrainAffiliateLink(
  strainName: string,
  preferredPartner?: string
): { url: string; partner: AffiliatePartner } | null {
  // Bevorzugten Partner oder ersten Seed-Partner wählen
  const partner = preferredPartner
    ? AFFILIATE_PARTNERS.find(p => p.id === preferredPartner)
    : AFFILIATE_PARTNERS.find(p => p.category === "seeds" && p.featured);
  
  if (!partner) return null;

  // Suchlink generieren
  const searchQuery = encodeURIComponent(strainName);
  let searchPath = "";
  
  switch (partner.id) {
    case "zamnesia":
      searchPath = `/de/search?q=${searchQuery}`;
      break;
    case "sensiseeds":
      searchPath = `/de/search?q=${searchQuery}`;
      break;
    case "rqs":
      searchPath = `/de/search?q=${searchQuery}`;
      break;
    case "seedsman":
      searchPath = `/search?q=${searchQuery}`;
      break;
    default:
      searchPath = `/search?q=${searchQuery}`;
  }

  return {
    url: generateAffiliateLink(partner.id, searchPath),
    partner,
  };
}

/**
 * Generiert einen Affiliate-Link für Equipment
 */
export function generateEquipmentAffiliateLink(
  productName: string,
  category?: "lights" | "tents" | "nutrients" | "ventilation" | "general",
  preferredPartner?: "amazon" | "grow-guru"
): { url: string; partner: AffiliatePartner } | null {
  // Partner-Auswahl: Bevorzugter Partner oder Featured Equipment Partner
  let partner: AffiliatePartner | undefined;
  
  if (preferredPartner) {
    partner = AFFILIATE_PARTNERS.find(p => p.id === preferredPartner);
  }
  
  // Fallback: Grow-Guru bevorzugen (featured), dann Amazon, dann irgendein Equipment-Partner
  if (!partner) {
    partner = AFFILIATE_PARTNERS.find(p => p.id === "grow-guru" && p.featured)
      || AFFILIATE_PARTNERS.find(p => p.id === "amazon")
      || AFFILIATE_PARTNERS.find(p => p.category === "equipment");
  }
  
  if (!partner) return null;

  const searchQuery = encodeURIComponent(productName);
  let searchPath = "";
  
  if (partner.id === "amazon") {
    searchPath = `/s?k=${searchQuery}`;
    if (category === "lights") {
      searchPath += "&rh=n%3A2165813031"; // Beleuchtung Kategorie
    }
  } else if (partner.id === "grow-guru") {
    searchPath = `/search?q=${searchQuery}`;
  } else {
    searchPath = `/search?q=${searchQuery}`;
  }

  return {
    url: generateAffiliateLink(partner.id, searchPath),
    partner,
  };
}

/**
 * Tracking-Event für Affiliate-Klicks
 */
export interface AffiliateClickEvent {
  partnerId: string;
  productType: "strain" | "equipment" | "general";
  productName?: string;
  timestamp: Date;
  userId?: string;
}

const clickHistory: AffiliateClickEvent[] = [];

export function trackAffiliateClick(event: Omit<AffiliateClickEvent, "timestamp">): void {
  const fullEvent: AffiliateClickEvent = {
    ...event,
    timestamp: new Date(),
  };
  
  clickHistory.push(fullEvent);
  
  // In Produktion: An Analytics-Service senden
  console.log("[Affiliates] Click tracked:", fullEvent);
}

export function getAffiliateClickHistory(): AffiliateClickEvent[] {
  return [...clickHistory];
}

/**
 * Empfohlene Produkte für verschiedene Grow-Phasen
 */
export const RECOMMENDED_PRODUCTS = {
  seedling: [
    { name: "Propagator Set", category: "general" as const, description: "Anzuchtset für Keimlinge" },
    { name: "Seedling Heat Mat", category: "general" as const, description: "Heizmatte für optimale Keimung" },
    { name: "Jiffy Pellets", category: "general" as const, description: "Quelltabletten für Samen" },
  ],
  vegetative: [
    { name: "LED Grow Light 200W", category: "lights" as const, description: "Vollspektrum LED für Veg-Phase" },
    { name: "Grow Tent 80x80", category: "tents" as const, description: "Growzelt für 2-4 Pflanzen" },
    { name: "BioBizz Grow", category: "nutrients" as const, description: "Organischer Wachstumsdünger" },
  ],
  flowering: [
    { name: "LED Grow Light 400W", category: "lights" as const, description: "Starke LED für Blütephase" },
    { name: "BioBizz Bloom", category: "nutrients" as const, description: "Organischer Blütedünger" },
    { name: "Carbon Filter", category: "ventilation" as const, description: "Aktivkohlefilter gegen Geruch" },
  ],
  harvest: [
    { name: "Trimming Scissors", category: "general" as const, description: "Präzisionsschere für Ernte" },
    { name: "Drying Net", category: "general" as const, description: "Trockennetz für Blüten" },
    { name: "Boveda Packs", category: "general" as const, description: "Feuchtigkeitsregler für Curing" },
  ],
};

/**
 * Holt empfohlene Produkte mit Affiliate-Links für eine Grow-Phase
 */
export function getRecommendedProductsWithLinks(
  phase: keyof typeof RECOMMENDED_PRODUCTS
): Array<{
  name: string;
  description: string;
  affiliateLink: string | null;
  partner: AffiliatePartner | null;
}> {
  const products = RECOMMENDED_PRODUCTS[phase];
  
  return products.map(product => {
    const result = generateEquipmentAffiliateLink(product.name, product.category);
    return {
      name: product.name,
      description: product.description,
      affiliateLink: result?.url || null,
      partner: result?.partner || null,
    };
  });
}
