// GrowMaster AI - Ultimate B2B Marketplace & Monetization System
// Das "Unicorn" Feature - Die perfekte Schnittstelle zwischen Anbietern und Kunden

// ============================================================================
// REVENUE STREAMS OVERVIEW
// ============================================================================
// 1. Subscriptions (Free/Premium/Pro) - Recurring Revenue
// 2. Vendor Subscriptions (Basic/Pro/Enterprise) - B2B Recurring
// 3. Transaction Fees (5-15% on all sales) - Transactional Revenue
// 4. Advertising (Banner, Featured, Sponsored) - Ad Revenue
// 5. Affiliate Commissions (10-20% from seed shops) - Affiliate Revenue
// 6. Raffle Ticket Sales (Platform keeps 20%) - Event Revenue
// 7. Auction Fees (10% seller fee) - Marketplace Revenue
// 8. Lead Generation (Pay-per-lead for vendors) - Lead Revenue
// 9. Data Insights (Anonymous analytics for vendors) - Data Revenue
// 10. White-Label Solutions (B2B licensing) - Enterprise Revenue

export type VendorType = "seedshop" | "growshop" | "equipment" | "nutrients" | "lighting" | "club" | "breeder";
export type VendorTier = "basic" | "pro" | "enterprise";
export type ListingType = "product" | "auction" | "raffle" | "deal" | "bundle";
export type AdPlacement = "home_banner" | "feed_native" | "search_top" | "category_featured" | "checkout_upsell" | "push_notification";

// Vendor Subscription Tiers with Pricing
export interface VendorSubscription {
  tier: VendorTier;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  limits: {
    products: number;
    auctions: number;
    raffles: number;
    deals: number;
    featuredSlots: number;
    pushNotifications: number;
    analyticsAccess: "basic" | "advanced" | "full";
    apiAccess: boolean;
    whiteLabel: boolean;
    dedicatedSupport: boolean;
  };
  transactionFee: number; // Percentage
  leadPrice: number; // Price per qualified lead
}

export const VENDOR_SUBSCRIPTIONS: Record<VendorTier, VendorSubscription> = {
  basic: {
    tier: "basic",
    name: "Starter",
    monthlyPrice: 49,
    yearlyPrice: 470, // 2 months free
    features: [
      "Bis zu 50 Produkte listen",
      "1 Auktion pro Monat",
      "1 Verlosung pro Monat",
      "Basis-Statistiken",
      "E-Mail Support",
    ],
    limits: {
      products: 50,
      auctions: 1,
      raffles: 1,
      deals: 2,
      featuredSlots: 0,
      pushNotifications: 0,
      analyticsAccess: "basic",
      apiAccess: false,
      whiteLabel: false,
      dedicatedSupport: false,
    },
    transactionFee: 15,
    leadPrice: 5,
  },
  pro: {
    tier: "pro",
    name: "Professional",
    monthlyPrice: 149,
    yearlyPrice: 1430, // 2 months free
    features: [
      "Unbegrenzte Produkte",
      "5 Auktionen pro Monat",
      "5 Verlosungen pro Monat",
      "3 Featured Slots",
      "Push-Benachrichtigungen (1000/Monat)",
      "Erweiterte Statistiken",
      "Prioritäts-Support",
      "Verifizierter Badge",
    ],
    limits: {
      products: -1, // unlimited
      auctions: 5,
      raffles: 5,
      deals: 10,
      featuredSlots: 3,
      pushNotifications: 1000,
      analyticsAccess: "advanced",
      apiAccess: true,
      whiteLabel: false,
      dedicatedSupport: false,
    },
    transactionFee: 10,
    leadPrice: 3,
  },
  enterprise: {
    tier: "enterprise",
    name: "Enterprise",
    monthlyPrice: 499,
    yearlyPrice: 4790, // 2 months free
    features: [
      "Alles aus Professional",
      "Unbegrenzte Auktionen & Verlosungen",
      "10 Featured Slots",
      "Unbegrenzte Push-Benachrichtigungen",
      "Vollständige Analytics & API",
      "White-Label Integration",
      "Dedizierter Account Manager",
      "Exklusive Sponsoring-Möglichkeiten",
      "Erste Wahl bei Events",
    ],
    limits: {
      products: -1,
      auctions: -1,
      raffles: -1,
      deals: -1,
      featuredSlots: 10,
      pushNotifications: -1,
      analyticsAccess: "full",
      apiAccess: true,
      whiteLabel: true,
      dedicatedSupport: true,
    },
    transactionFee: 5,
    leadPrice: 1,
  },
};

// Advertising System
export interface AdCampaign {
  id: string;
  vendorId: string;
  type: "cpm" | "cpc" | "cpa"; // Cost per mille/click/action
  placement: AdPlacement;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  startDate: Date;
  endDate: Date;
  targeting: AdTargeting;
  creative: AdCreative;
  status: "draft" | "pending" | "active" | "paused" | "completed";
}

export interface AdTargeting {
  locations?: string[]; // German states
  growExperience?: ("beginner" | "intermediate" | "advanced")[];
  subscriptionTiers?: ("free" | "premium" | "pro")[];
  interests?: string[]; // indoor, outdoor, hydro, organic, etc.
  ageRange?: { min: number; max: number };
  recentActivity?: string[]; // recently_diagnosed, recently_harvested, etc.
}

export interface AdCreative {
  title: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  destinationUrl: string;
}

export const AD_PRICING: Record<AdPlacement, { cpm: number; cpc: number; minBudget: number }> = {
  home_banner: { cpm: 15, cpc: 0.50, minBudget: 100 },
  feed_native: { cpm: 8, cpc: 0.30, minBudget: 50 },
  search_top: { cpm: 25, cpc: 1.00, minBudget: 200 },
  category_featured: { cpm: 12, cpc: 0.40, minBudget: 75 },
  checkout_upsell: { cpm: 30, cpc: 1.50, minBudget: 150 },
  push_notification: { cpm: 50, cpc: 2.00, minBudget: 250 },
};

// Lead Generation System
export interface Lead {
  id: string;
  vendorId: string;
  userId: string;
  type: "product_inquiry" | "quote_request" | "club_membership" | "consultation" | "bulk_order";
  source: string;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  value: number; // Estimated value
  createdAt: Date;
  contactedAt?: Date;
  convertedAt?: Date;
  notes?: string;
}

export interface LeadPackage {
  id: string;
  name: string;
  leadsPerMonth: number;
  pricePerLead: number;
  totalPrice: number;
  features: string[];
  guaranteedQuality: number; // Percentage of qualified leads
}

export const LEAD_PACKAGES: LeadPackage[] = [
  {
    id: "starter",
    name: "Starter",
    leadsPerMonth: 25,
    pricePerLead: 5,
    totalPrice: 99,
    features: ["25 qualifizierte Leads", "E-Mail Benachrichtigung", "Basis-Kontaktdaten"],
    guaranteedQuality: 60,
  },
  {
    id: "growth",
    name: "Growth",
    leadsPerMonth: 100,
    pricePerLead: 3.50,
    totalPrice: 299,
    features: ["100 qualifizierte Leads", "Sofort-Benachrichtigung", "Erweiterte Kontaktdaten", "Lead-Scoring"],
    guaranteedQuality: 70,
  },
  {
    id: "scale",
    name: "Scale",
    leadsPerMonth: 500,
    pricePerLead: 2,
    totalPrice: 899,
    features: ["500 qualifizierte Leads", "API-Integration", "CRM-Export", "Dedizierter Support", "Exklusivität pro Region"],
    guaranteedQuality: 80,
  },
];

// Marketplace Product System
export interface MarketplaceProduct {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorLogo: string;
  vendorVerified: boolean;
  type: ListingType;
  category: string;
  subcategory: string;
  name: string;
  description: string;
  images: string[];
  price: number;
  originalPrice?: number;
  currency: string;
  stock: number;
  sold: number;
  rating: number;
  reviewCount: number;
  shipping: ShippingInfo;
  affiliateCommission?: number; // Percentage for affiliate sales
  featured: boolean;
  sponsored: boolean;
  tags: string[];
  createdAt: Date;
  expiresAt?: Date;
}

export interface ShippingInfo {
  freeShipping: boolean;
  shippingCost: number;
  estimatedDays: number;
  countries: string[];
}

// Auction System with Fees
export interface MarketplaceAuction {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorLogo: string;
  title: string;
  description: string;
  images: string[];
  category: string;
  startingBid: number;
  currentBid: number;
  reservePrice?: number;
  buyNowPrice?: number;
  bidIncrement: number;
  bids: AuctionBid[];
  bidCount: number;
  watchCount: number;
  startDate: Date;
  endDate: Date;
  status: "upcoming" | "active" | "ended" | "sold" | "cancelled";
  winner?: string;
  platformFee: number; // 10% of final price
  featured: boolean;
}

export interface AuctionBid {
  id: string;
  auctionId: string;
  userId: string;
  userName: string;
  amount: number;
  timestamp: Date;
  isWinning: boolean;
}

// Raffle System with Revenue Split
export interface MarketplaceRaffle {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorLogo: string;
  title: string;
  description: string;
  images: string[];
  prize: string;
  prizeValue: number;
  ticketPrice: number;
  totalTickets: number;
  soldTickets: number;
  maxTicketsPerUser: number;
  participants: RaffleParticipant[];
  startDate: Date;
  endDate: Date;
  drawDate: Date;
  status: "upcoming" | "active" | "drawing" | "completed" | "cancelled";
  winner?: string;
  platformShare: number; // 20% of ticket sales
  vendorShare: number; // 80% of ticket sales
}

export interface RaffleParticipant {
  userId: string;
  userName: string;
  ticketCount: number;
  purchaseDate: Date;
}

// Bundle/Deal System
export interface MarketplaceBundle {
  id: string;
  vendorId: string;
  vendorName: string;
  title: string;
  description: string;
  products: BundleProduct[];
  originalTotal: number;
  bundlePrice: number;
  savings: number;
  savingsPercent: number;
  stock: number;
  sold: number;
  featured: boolean;
  expiresAt: Date;
}

export interface BundleProduct {
  productId: string;
  name: string;
  quantity: number;
  originalPrice: number;
}

// Vendor Analytics Dashboard
export interface VendorAnalytics {
  vendorId: string;
  period: "day" | "week" | "month" | "year";
  revenue: {
    total: number;
    products: number;
    auctions: number;
    raffles: number;
    bundles: number;
  };
  fees: {
    transactionFees: number;
    subscriptionFee: number;
    adSpend: number;
    leadCosts: number;
    totalFees: number;
  };
  netRevenue: number;
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    conversionRate: number;
    averageOrderValue: number;
    customerLifetimeValue: number;
  };
  topProducts: { productId: string; name: string; revenue: number; units: number }[];
  customerDemographics: {
    experienceLevel: Record<string, number>;
    subscriptionTier: Record<string, number>;
    location: Record<string, number>;
  };
}

// Platform Revenue Tracking
export interface PlatformRevenue {
  period: string;
  userSubscriptions: number;
  vendorSubscriptions: number;
  transactionFees: number;
  adRevenue: number;
  affiliateCommissions: number;
  raffleRevenue: number;
  auctionFees: number;
  leadRevenue: number;
  totalRevenue: number;
  growth: number; // Percentage vs previous period
}

// Automated Vendor Outreach System
export interface VendorOutreach {
  id: string;
  vendorEmail: string;
  vendorName: string;
  vendorType: VendorType;
  website?: string;
  status: "pending" | "sent" | "opened" | "clicked" | "responded" | "converted" | "declined";
  template: OutreachTemplate;
  sentAt?: Date;
  openedAt?: Date;
  respondedAt?: Date;
  followUpCount: number;
  notes?: string;
}

export interface OutreachTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: "initial" | "followup" | "special_offer";
  targetVendorType: VendorType[];
}

export const OUTREACH_TEMPLATES: OutreachTemplate[] = [
  {
    id: "initial_seedshop",
    name: "Samenshop Erstansprache",
    subject: "Partnerschaft mit GrowMaster AI - 50.000+ aktive Grower erreichen",
    body: `Sehr geehrte/r {{vendorName}},

ich bin der Gründer von GrowMaster AI, der führenden Cannabis-Grow-App in Deutschland mit über 50.000 aktiven Nutzern.

Unsere Community sucht aktiv nach hochwertigen Samen und wir möchten Ihnen eine exklusive Partnerschaft anbieten:

✅ Direkter Zugang zu kaufbereiten Kunden
✅ Integrierte Affiliate-Links mit 15-20% Provision für Sie
✅ Featured Placement in unserer Sorten-Datenbank
✅ Exklusive Verlosungen und Auktionen
✅ Detaillierte Analytics zu Ihrer Zielgruppe

Unsere Nutzer geben durchschnittlich €150/Jahr für Samen aus - das sind potenzielle €7,5 Mio. Umsatz für unsere Partner.

Interesse an einem kurzen Gespräch?

Mit freundlichen Grüßen,
{{senderName}}
GrowMaster AI`,
    type: "initial",
    targetVendorType: ["seedshop", "breeder"],
  },
  {
    id: "initial_growshop",
    name: "Growshop Erstansprache",
    subject: "GrowMaster AI sucht Premium-Partner für Equipment",
    body: `Sehr geehrte/r {{vendorName}},

GrowMaster AI ist die #1 Grow-App in Deutschland und wir erweitern unser Partner-Netzwerk.

Was wir bieten:
🎯 50.000+ aktive Grower als Zielgruppe
🛒 Integrierter Marketplace mit direktem Checkout
📊 Lead-Generierung für Ihre Produkte
🏆 Exklusive Deals und Bundle-Aktionen
📱 Push-Benachrichtigungen an interessierte Nutzer

Unsere Nutzer investieren durchschnittlich €500+ in Equipment - und sie vertrauen unseren Empfehlungen.

Lassen Sie uns besprechen, wie wir zusammenarbeiten können.

Mit freundlichen Grüßen,
{{senderName}}`,
    type: "initial",
    targetVendorType: ["growshop", "equipment", "lighting", "nutrients"],
  },
];

// Smart Matching System - Connects users with relevant vendors
export interface SmartMatch {
  userId: string;
  userProfile: {
    experienceLevel: string;
    growStyle: string[];
    currentPhase: string;
    interests: string[];
    budget: string;
    location: string;
  };
  matchedVendors: {
    vendorId: string;
    vendorName: string;
    matchScore: number;
    matchReasons: string[];
    recommendedProducts: string[];
  }[];
  matchedProducts: {
    productId: string;
    productName: string;
    vendorName: string;
    matchScore: number;
    matchReasons: string[];
  }[];
}

// Referral System for Vendors
export interface VendorReferral {
  referrerId: string;
  referredVendorId: string;
  status: "pending" | "signed_up" | "subscribed" | "paid";
  commission: number; // 20% of first year subscription
  createdAt: Date;
  convertedAt?: Date;
  paidAt?: Date;
}

// Mock Data for Marketplace
export const MOCK_MARKETPLACE_PRODUCTS: MarketplaceProduct[] = [
  {
    id: "mp1",
    vendorId: "v1",
    vendorName: "Royal Queen Seeds",
    vendorLogo: "👑",
    vendorVerified: true,
    type: "product",
    category: "Samen",
    subcategory: "Feminisiert",
    name: "Northern Lights Feminized 5-Pack",
    description: "Die legendäre Northern Lights - perfekt für Anfänger. 5 feminisierte Samen.",
    images: [],
    price: 35.00,
    originalPrice: 45.00,
    currency: "EUR",
    stock: 150,
    sold: 423,
    rating: 4.8,
    reviewCount: 89,
    shipping: { freeShipping: true, shippingCost: 0, estimatedDays: 3, countries: ["DE", "AT", "CH"] },
    affiliateCommission: 15,
    featured: true,
    sponsored: false,
    tags: ["anfänger", "indica", "indoor"],
    createdAt: new Date(),
  },
  {
    id: "mp2",
    vendorId: "v2",
    vendorName: "LED Grow Shop",
    vendorLogo: "💡",
    vendorVerified: true,
    type: "product",
    category: "Beleuchtung",
    subcategory: "LED",
    name: "Spider Farmer SF2000 LED",
    description: "200W Full Spectrum LED - perfekt für 2x4 Zelte. Samsung LM301B Dioden.",
    images: [],
    price: 289.00,
    originalPrice: 349.00,
    currency: "EUR",
    stock: 45,
    sold: 156,
    rating: 4.9,
    reviewCount: 67,
    shipping: { freeShipping: true, shippingCost: 0, estimatedDays: 2, countries: ["DE"] },
    affiliateCommission: 8,
    featured: true,
    sponsored: true,
    tags: ["led", "indoor", "professional"],
    createdAt: new Date(),
  },
];

export const MOCK_VENDOR_ANALYTICS: VendorAnalytics = {
  vendorId: "v1",
  period: "month",
  revenue: {
    total: 12450,
    products: 8900,
    auctions: 1200,
    raffles: 850,
    bundles: 1500,
  },
  fees: {
    transactionFees: 1245,
    subscriptionFee: 149,
    adSpend: 500,
    leadCosts: 150,
    totalFees: 2044,
  },
  netRevenue: 10406,
  metrics: {
    impressions: 45000,
    clicks: 3200,
    conversions: 156,
    conversionRate: 4.87,
    averageOrderValue: 79.80,
    customerLifetimeValue: 245,
  },
  topProducts: [
    { productId: "p1", name: "Northern Lights 5-Pack", revenue: 3500, units: 100 },
    { productId: "p2", name: "White Widow Auto 3-Pack", revenue: 2100, units: 70 },
  ],
  customerDemographics: {
    experienceLevel: { beginner: 45, intermediate: 35, advanced: 20 },
    subscriptionTier: { free: 60, premium: 30, pro: 10 },
    location: { "NRW": 25, "Bayern": 20, "Berlin": 15, "Andere": 40 },
  },
};

// Helper functions
export function calculatePlatformRevenue(
  transactions: { amount: number; fee: number }[],
  subscriptions: { tier: VendorTier; isYearly: boolean }[],
  adCampaigns: AdCampaign[],
  raffles: MarketplaceRaffle[]
): PlatformRevenue {
  const transactionFees = transactions.reduce((sum, t) => sum + t.fee, 0);
  const vendorSubs = subscriptions.reduce((sum, s) => {
    const sub = VENDOR_SUBSCRIPTIONS[s.tier];
    return sum + (s.isYearly ? sub.yearlyPrice : sub.monthlyPrice);
  }, 0);
  const adRevenue = adCampaigns.reduce((sum, c) => sum + c.spent, 0);
  const raffleRevenue = raffles.reduce((sum, r) => sum + (r.soldTickets * r.ticketPrice * 0.2), 0);

  return {
    period: new Date().toISOString().slice(0, 7),
    userSubscriptions: 0, // Would come from user subscription data
    vendorSubscriptions: vendorSubs,
    transactionFees,
    adRevenue,
    affiliateCommissions: 0, // Would come from affiliate tracking
    raffleRevenue,
    auctionFees: 0, // Would come from auction data
    leadRevenue: 0, // Would come from lead sales
    totalRevenue: vendorSubs + transactionFees + adRevenue + raffleRevenue,
    growth: 0,
  };
}

export function getVendorTierRecommendation(
  monthlyRevenue: number,
  productCount: number,
  wantsAuctions: boolean,
  wantsAnalytics: boolean
): VendorTier {
  if (monthlyRevenue > 10000 || productCount > 200 || wantsAnalytics) {
    return "enterprise";
  }
  if (monthlyRevenue > 2000 || productCount > 50 || wantsAuctions) {
    return "pro";
  }
  return "basic";
}

export function calculateAffiliateEarnings(
  sales: { productId: string; amount: number; commission: number }[]
): number {
  return sales.reduce((sum, sale) => sum + (sale.amount * sale.commission / 100), 0);
}
