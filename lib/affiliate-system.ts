/**
 * Affiliate Link Management System
 * Manage and track affiliate links for partners
 */

export interface AffiliateLink {
  id: string;
  partnerId: string;
  partnerName: string;
  productName: string;
  category: 'seeds' | 'nutrients' | 'lights' | 'tents' | 'equipment' | 'accessories';
  baseUrl: string;
  affiliateCode: string;
  fullUrl: string;
  commission: number; // Percentage
  clicks: number;
  conversions: number;
  revenue: number;
  active: boolean;
  createdAt: Date;
}

export interface AffiliateProgramConfig {
  programName: string;
  partnerId: string;
  baseUrl: string;
  affiliateId: string;
  trackingParam: string; // e.g., "ref", "aff", "partner"
}

/**
 * Affiliate Program Configurations.
 * IDs come from EXPO_PUBLIC_AFFILIATE_<NAME> env vars. Programs without an ID
 * produce plain (untracked) links instead of links with a bogus placeholder ID.
 */
function envId(name: string): string {
  return (process.env[`EXPO_PUBLIC_AFFILIATE_${name}_ID`] || process.env[`EXPO_PUBLIC_AFFILIATE_${name}`] || '').trim();
}

export const AFFILIATE_PROGRAMS: Record<string, AffiliateProgramConfig> = {
  // SEEDS
  seedsman: {
    programName: 'Seedsman',
    partnerId: 'seedsman',
    baseUrl: 'https://www.seedsman.com',
    affiliateId: envId('SEEDSMAN'),
    trackingParam: 'a_aid',
  },
  
  ilgm: {
    programName: 'ILGM (I Love Growing Marijuana)',
    partnerId: 'ilgm',
    baseUrl: 'https://ilgm.com',
    affiliateId: envId('ILGM'),
    trackingParam: 'ref',
  },
  
  cropKingSeeds: {
    programName: 'Crop King Seeds',
    partnerId: 'cropking',
    baseUrl: 'https://www.cropkingseeds.com',
    affiliateId: envId('CROPKING'),
    trackingParam: 'aff',
  },

  // NUTRIENTS
  generalHydroponics: {
    programName: 'General Hydroponics',
    partnerId: 'gh',
    baseUrl: 'https://generalhydroponics.com',
    affiliateId: envId('GH'),
    trackingParam: 'ref',
  },

  advancedNutrients: {
    programName: 'Advanced Nutrients',
    partnerId: 'advnutrients',
    baseUrl: 'https://www.advancednutrients.com',
    affiliateId: envId('ADV'),
    trackingParam: 'affiliate',
  },

  foxFarm: {
    programName: 'Fox Farm',
    partnerId: 'foxfarm',
    baseUrl: 'https://foxfarm.com',
    affiliateId: envId('FOXFARM'),
    trackingParam: 'ref',
  },

  // LIGHTS
  marsHydro: {
    programName: 'Mars Hydro',
    partnerId: 'marshydro',
    baseUrl: 'https://www.mars-hydro.com',
    affiliateId: envId('MARS'),
    trackingParam: 'sca_ref',
  },

  spiderFarmer: {
    programName: 'Spider Farmer',
    partnerId: 'spiderfarmer',
    baseUrl: 'https://www.spider-farmer.com',
    affiliateId: envId('SPIDER'),
    trackingParam: 'ref',
  },

  // GROW TENTS & EQUIPMENT
  gorilla: {
    programName: 'Gorilla Grow Tent',
    partnerId: 'gorilla',
    baseUrl: 'https://www.gorillagrowtent.com',
    affiliateId: envId('GORILLA'),
    trackingParam: 'ref',
  },

  // GENERAL RETAILERS
  amazon: {
    programName: 'Amazon Associates',
    partnerId: 'amazon',
    baseUrl: 'https://www.amazon.com',
    affiliateId: envId('AMAZON'),
    trackingParam: 'tag',
  },
};

/**
 * Build affiliate URL with your tracking code
 */
export function buildAffiliateUrl(
  programId: keyof typeof AFFILIATE_PROGRAMS,
  productPath?: string,
  additionalParams?: Record<string, string>
): string {
  const program = AFFILIATE_PROGRAMS[programId];
  
  if (!program) {
    console.warn(`Affiliate program ${programId} not found`);
    return '';
  }

  const url = new URL(productPath || '', program.baseUrl);
  
  // Add affiliate tracking parameter
  if (program.affiliateId) {
    url.searchParams.set(program.trackingParam, program.affiliateId);
  }
  
  // Add additional parameters
  if (additionalParams) {
    Object.entries(additionalParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return url.toString();
}

/**
 * Track affiliate link click
 */
export async function trackAffiliateClick(
  programId: string,
  productId?: string,
  _userId?: string
): Promise<void> {
  try {
    // No affiliate backend exists yet: persist click counters locally.
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const key = 'affiliate_clicks';
    const raw = await AsyncStorage.getItem(key);
    const clicks: Record<string, number> = raw ? JSON.parse(raw) : {};
    const id = productId ? `${programId}:${productId}` : programId;
    clicks[id] = (clicks[id] || 0) + 1;
    await AsyncStorage.setItem(key, JSON.stringify(clicks));
  } catch (error) {
    console.error('Error tracking affiliate click:', error);
  }
}

/**
 * Popular product affiliate links
 * Pre-configured for common products
 */
export const POPULAR_PRODUCTS: Record<string, AffiliateLink> = {
  // SEEDS
  blueberry_seeds: {
    id: 'prod_blueberry_seeds',
    partnerId: 'seedsman',
    partnerName: 'Seedsman',
    productName: 'Blueberry Autoflower Seeds',
    category: 'seeds',
    baseUrl: 'https://www.seedsman.com/en/blueberry-autoflowering-feminised-seeds',
    affiliateCode: envId('SEEDSMAN'),
    fullUrl: buildAffiliateUrl('seedsman', '/en/blueberry-autoflowering-feminised-seeds'),
    commission: 10,
    clicks: 0,
    conversions: 0,
    revenue: 0,
    active: true,
    createdAt: new Date(),
  },

  northern_lights: {
    id: 'prod_northern_lights',
    partnerId: 'ilgm',
    partnerName: 'ILGM',
    productName: 'Northern Lights Seeds',
    category: 'seeds',
    baseUrl: 'https://ilgm.com/products/northern-lights-feminized-seeds',
    affiliateCode: envId('ILGM'),
    fullUrl: buildAffiliateUrl('ilgm', '/products/northern-lights-feminized-seeds'),
    commission: 15,
    clicks: 0,
    conversions: 0,
    revenue: 0,
    active: true,
    createdAt: new Date(),
  },

  // NUTRIENTS
  flora_trio: {
    id: 'prod_flora_trio',
    partnerId: 'gh',
    partnerName: 'General Hydroponics',
    productName: 'Flora Series Nutrient Trio',
    category: 'nutrients',
    baseUrl: 'https://generalhydroponics.com/floraseries',
    affiliateCode: envId('GH'),
    fullUrl: buildAffiliateUrl('generalHydroponics', '/floraseries'),
    commission: 8,
    clicks: 0,
    conversions: 0,
    revenue: 0,
    active: true,
    createdAt: new Date(),
  },

  // LIGHTS
  mars_ts1000: {
    id: 'prod_mars_ts1000',
    partnerId: 'marshydro',
    partnerName: 'Mars Hydro',
    productName: 'Mars Hydro TS 1000',
    category: 'lights',
    baseUrl: 'https://www.mars-hydro.com/buy-mars-hydro-ts-1000',
    affiliateCode: envId('MARS'),
    fullUrl: buildAffiliateUrl('marsHydro', '/buy-mars-hydro-ts-1000'),
    commission: 10,
    clicks: 0,
    conversions: 0,
    revenue: 0,
    active: true,
    createdAt: new Date(),
  },

  spider_sf1000: {
    id: 'prod_spider_sf1000',
    partnerId: 'spiderfarmer',
    partnerName: 'Spider Farmer',
    productName: 'Spider Farmer SF1000',
    category: 'lights',
    baseUrl: 'https://www.spider-farmer.com/products/sf1000-led-grow-light',
    affiliateCode: envId('SPIDER'),
    fullUrl: buildAffiliateUrl('spiderFarmer', '/products/sf1000-led-grow-light'),
    commission: 12,
    clicks: 0,
    conversions: 0,
    revenue: 0,
    active: true,
    createdAt: new Date(),
  },

  // GROW TENT
  gorilla_2x2: {
    id: 'prod_gorilla_2x2',
    partnerId: 'gorilla',
    partnerName: 'Gorilla',
    productName: 'Gorilla Grow Tent 2x2',
    category: 'tents',
    baseUrl: 'https://www.gorillagrowtent.com/2-x-2-gorilla-grow-tent',
    affiliateCode: envId('GORILLA'),
    fullUrl: buildAffiliateUrl('gorilla', '/2-x-2-gorilla-grow-tent'),
    commission: 10,
    clicks: 0,
    conversions: 0,
    revenue: 0,
    active: true,
    createdAt: new Date(),
  },
};

/**
 * Get affiliate products by category
 */
export function getProductsByCategory(
  category: AffiliateLink['category']
): AffiliateLink[] {
  return Object.values(POPULAR_PRODUCTS).filter(p => p.category === category);
}

/**
 * Search affiliate products
 */
export function searchProducts(query: string): AffiliateLink[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(POPULAR_PRODUCTS).filter(
    p =>
      p.productName.toLowerCase().includes(lowerQuery) ||
      p.partnerName.toLowerCase().includes(lowerQuery) ||
      p.category.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Generate deep link with UTM parameters for better tracking
 */
export function generateTrackedLink(
  programId: keyof typeof AFFILIATE_PROGRAMS,
  productPath: string,
  source: string = 'app',
  medium: string = 'marketplace',
  campaign: string = 'growmaster'
): string {
  return buildAffiliateUrl(programId, productPath, {
    utm_source: source,
    utm_medium: medium,
    utm_campaign: campaign,
  });
}
