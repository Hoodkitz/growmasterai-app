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
 * Your Affiliate Program Configurations
 * UPDATE THESE WITH YOUR ACTUAL AFFILIATE IDs
 */
export const AFFILIATE_PROGRAMS: Record<string, AffiliateProgramConfig> = {
  // SEEDS
  seedsman: {
    programName: 'Seedsman',
    partnerId: 'seedsman',
    baseUrl: 'https://www.seedsman.com',
    affiliateId: 'YOUR_SEEDSMAN_ID', // TODO: Replace with your ID
    trackingParam: 'a_aid',
  },
  
  ilgm: {
    programName: 'ILGM (I Love Growing Marijuana)',
    partnerId: 'ilgm',
    baseUrl: 'https://ilgm.com',
    affiliateId: 'YOUR_ILGM_ID', // TODO: Replace
    trackingParam: 'ref',
  },
  
  cropKingSeeds: {
    programName: 'Crop King Seeds',
    partnerId: 'cropking',
    baseUrl: 'https://www.cropkingseeds.com',
    affiliateId: 'YOUR_CROPKING_ID', // TODO: Replace
    trackingParam: 'aff',
  },

  // NUTRIENTS
  generalHydroponics: {
    programName: 'General Hydroponics',
    partnerId: 'gh',
    baseUrl: 'https://generalhydroponics.com',
    affiliateId: 'YOUR_GH_ID', // TODO: Replace
    trackingParam: 'ref',
  },

  advancedNutrients: {
    programName: 'Advanced Nutrients',
    partnerId: 'advnutrients',
    baseUrl: 'https://www.advancednutrients.com',
    affiliateId: 'YOUR_ADV_ID', // TODO: Replace
    trackingParam: 'affiliate',
  },

  foxFarm: {
    programName: 'Fox Farm',
    partnerId: 'foxfarm',
    baseUrl: 'https://foxfarm.com',
    affiliateId: 'YOUR_FOXFARM_ID', // TODO: Replace
    trackingParam: 'ref',
  },

  // LIGHTS
  marsHydro: {
    programName: 'Mars Hydro',
    partnerId: 'marshydro',
    baseUrl: 'https://www.mars-hydro.com',
    affiliateId: 'YOUR_MARS_ID', // TODO: Replace
    trackingParam: 'sca_ref',
  },

  spiderFarmer: {
    programName: 'Spider Farmer',
    partnerId: 'spiderfarmer',
    baseUrl: 'https://www.spider-farmer.com',
    affiliateId: 'YOUR_SPIDER_ID', // TODO: Replace
    trackingParam: 'ref',
  },

  // GROW TENTS & EQUIPMENT
  gorilla: {
    programName: 'Gorilla Grow Tent',
    partnerId: 'gorilla',
    baseUrl: 'https://www.gorillagrowtent.com',
    affiliateId: 'YOUR_GORILLA_ID', // TODO: Replace
    trackingParam: 'ref',
  },

  // GENERAL RETAILERS
  amazon: {
    programName: 'Amazon Associates',
    partnerId: 'amazon',
    baseUrl: 'https://www.amazon.com',
    affiliateId: 'YOUR_AMAZON_TAG', // e.g., "growmaster-20"
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
  url.searchParams.set(program.trackingParam, program.affiliateId);
  
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
  userId?: string
): Promise<void> {
  try {
    // Log to your analytics
    console.log('[Affiliate] Click tracked:', {
      programId,
      productId,
      userId,
      timestamp: new Date().toISOString(),
    });

    // Send to backend for tracking
    // await trpc.affiliate.trackClick.mutate({ programId, productId, userId });
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
    affiliateCode: 'YOUR_SEEDSMAN_ID',
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
    affiliateCode: 'YOUR_ILGM_ID',
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
    affiliateCode: 'YOUR_GH_ID',
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
    affiliateCode: 'YOUR_MARS_ID',
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
    affiliateCode: 'YOUR_SPIDER_ID',
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
    affiliateCode: 'YOUR_GORILLA_ID',
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
