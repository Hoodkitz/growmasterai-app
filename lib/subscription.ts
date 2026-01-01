import AsyncStorage from "@react-native-async-storage/async-storage";

// Subscription Tiers
export type SubscriptionTier = "free" | "premium" | "pro";

// Feature Limits per Tier
export interface TierLimits {
  diagnosesPerDay: number;
  coachMessagesPerDay: number;
  maxPlants: number;
  maxJournalEntries: number;
  advancedAnalysis: boolean;
  exportData: boolean;
  prioritySupport: boolean;
  customReminders: boolean;
  detailedStatistics: boolean;
  adFree: boolean;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    diagnosesPerDay: 3,
    coachMessagesPerDay: 5,
    maxPlants: 2,
    maxJournalEntries: 10,
    advancedAnalysis: false,
    exportData: false,
    prioritySupport: false,
    customReminders: false,
    detailedStatistics: false,
    adFree: false,
  },
  premium: {
    diagnosesPerDay: 15,
    coachMessagesPerDay: 50,
    maxPlants: 10,
    maxJournalEntries: 100,
    advancedAnalysis: true,
    exportData: true,
    prioritySupport: false,
    customReminders: true,
    detailedStatistics: true,
    adFree: true,
  },
  pro: {
    diagnosesPerDay: -1, // unlimited
    coachMessagesPerDay: -1, // unlimited
    maxPlants: -1, // unlimited
    maxJournalEntries: -1, // unlimited
    advancedAnalysis: true,
    exportData: true,
    prioritySupport: true,
    customReminders: true,
    detailedStatistics: true,
    adFree: true,
  },
};

// Pricing (in EUR)
export interface TierPricing {
  monthly: number;
  yearly: number;
  yearlyMonthly: number; // monthly equivalent when paying yearly
  savings: number; // percentage saved with yearly
}

export const TIER_PRICING: Record<Exclude<SubscriptionTier, "free">, TierPricing> = {
  premium: {
    monthly: 4.99,
    yearly: 39.99,
    yearlyMonthly: 3.33,
    savings: 33,
  },
  pro: {
    monthly: 9.99,
    yearly: 79.99,
    yearlyMonthly: 6.67,
    savings: 33,
  },
};

// Tier Display Info
export interface TierInfo {
  name: string;
  description: string;
  color: string;
  icon: string;
  features: string[];
}

export const TIER_INFO: Record<SubscriptionTier, TierInfo> = {
  free: {
    name: "Free",
    description: "Grundfunktionen zum Ausprobieren",
    color: "#6B7280",
    icon: "leaf.fill",
    features: [
      "3 Diagnosen pro Tag",
      "5 Coach-Nachrichten pro Tag",
      "Bis zu 2 Pflanzen",
      "10 Journal-Einträge",
      "Basis-Analyse",
    ],
  },
  premium: {
    name: "Premium",
    description: "Für ambitionierte Grower",
    color: "#22C55E",
    icon: "leaf.fill",
    features: [
      "15 Diagnosen pro Tag",
      "50 Coach-Nachrichten pro Tag",
      "Bis zu 10 Pflanzen",
      "100 Journal-Einträge",
      "Erweiterte Analyse",
      "Daten-Export",
      "Erinnerungen",
      "Statistiken",
      "Werbefrei",
    ],
  },
  pro: {
    name: "Pro",
    description: "Für professionelle Grower",
    color: "#F59E0B",
    icon: "leaf.fill",
    features: [
      "Unbegrenzte Diagnosen",
      "Unbegrenzte Coach-Nachrichten",
      "Unbegrenzte Pflanzen",
      "Unbegrenzte Journal-Einträge",
      "Erweiterte Analyse",
      "Daten-Export",
      "Erinnerungen",
      "Detaillierte Statistiken",
      "Prioritäts-Support",
      "Werbefrei",
    ],
  },
};

// Storage Keys
const STORAGE_KEYS = {
  SUBSCRIPTION_TIER: "@growmaster_subscription_tier",
  DAILY_DIAGNOSES: "@growmaster_daily_diagnoses",
  DAILY_MESSAGES: "@growmaster_daily_messages",
  LAST_RESET_DATE: "@growmaster_last_reset_date",
};

// Helper Functions
export async function getSubscriptionTier(): Promise<SubscriptionTier> {
  try {
    const tier = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_TIER);
    return (tier as SubscriptionTier) || "free";
  } catch {
    return "free";
  }
}

export async function setSubscriptionTier(tier: SubscriptionTier): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_TIER, tier);
}

export async function getDailyUsage(): Promise<{ diagnoses: number; messages: number }> {
  try {
    const today = new Date().toDateString();
    const lastReset = await AsyncStorage.getItem(STORAGE_KEYS.LAST_RESET_DATE);
    
    // Reset counters if it's a new day
    if (lastReset !== today) {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_RESET_DATE, today);
      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_DIAGNOSES, "0");
      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_MESSAGES, "0");
      return { diagnoses: 0, messages: 0 };
    }
    
    const diagnoses = parseInt(await AsyncStorage.getItem(STORAGE_KEYS.DAILY_DIAGNOSES) || "0", 10);
    const messages = parseInt(await AsyncStorage.getItem(STORAGE_KEYS.DAILY_MESSAGES) || "0", 10);
    
    return { diagnoses, messages };
  } catch {
    return { diagnoses: 0, messages: 0 };
  }
}

export async function incrementDiagnoses(): Promise<number> {
  const { diagnoses } = await getDailyUsage();
  const newCount = diagnoses + 1;
  await AsyncStorage.setItem(STORAGE_KEYS.DAILY_DIAGNOSES, newCount.toString());
  return newCount;
}

export async function incrementMessages(): Promise<number> {
  const { messages } = await getDailyUsage();
  const newCount = messages + 1;
  await AsyncStorage.setItem(STORAGE_KEYS.DAILY_MESSAGES, newCount.toString());
  return newCount;
}

export function canUseDiagnosis(tier: SubscriptionTier, currentCount: number): boolean {
  const limit = TIER_LIMITS[tier].diagnosesPerDay;
  return limit === -1 || currentCount < limit;
}

export function canSendMessage(tier: SubscriptionTier, currentCount: number): boolean {
  const limit = TIER_LIMITS[tier].coachMessagesPerDay;
  return limit === -1 || currentCount < limit;
}

export function canAddPlant(tier: SubscriptionTier, currentCount: number): boolean {
  const limit = TIER_LIMITS[tier].maxPlants;
  return limit === -1 || currentCount < limit;
}

export function canAddJournalEntry(tier: SubscriptionTier, currentCount: number): boolean {
  const limit = TIER_LIMITS[tier].maxJournalEntries;
  return limit === -1 || currentCount < limit;
}

export function getRemainingDiagnoses(tier: SubscriptionTier, currentCount: number): number | null {
  const limit = TIER_LIMITS[tier].diagnosesPerDay;
  if (limit === -1) return null;
  return Math.max(0, limit - currentCount);
}

export function getRemainingMessages(tier: SubscriptionTier, currentCount: number): number | null {
  const limit = TIER_LIMITS[tier].coachMessagesPerDay;
  if (limit === -1) return null;
  return Math.max(0, limit - currentCount);
}
