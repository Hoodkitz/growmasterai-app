import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
  SubscriptionTier,
  TIER_LIMITS,
  TierLimits,
  getSubscriptionTier,
  setSubscriptionTier as saveSubscriptionTier,
  getDailyUsage,
  incrementDiagnoses,
  incrementMessages,
  canUseDiagnosis,
  canSendMessage,
  canAddPlant,
  canAddJournalEntry,
  getRemainingDiagnoses,
  getRemainingMessages,
} from "./subscription";

interface SubscriptionContextType {
  tier: SubscriptionTier;
  limits: TierLimits;
  dailyDiagnoses: number;
  dailyMessages: number;
  loading: boolean;
  
  // Tier setter (for external sync like RevenueCat)
  setTier: (tier: SubscriptionTier) => void;
  
  // Upgrade functions
  upgradeTo: (tier: SubscriptionTier) => Promise<void>;
  
  // Check functions
  canDiagnose: () => boolean;
  canMessage: () => boolean;
  canAddNewPlant: (currentCount: number) => boolean;
  canAddNewJournalEntry: (currentCount: number) => boolean;
  
  // Usage functions
  useDiagnosis: () => Promise<boolean>;
  useMessage: () => Promise<boolean>;
  
  // Remaining counts
  remainingDiagnoses: number | null;
  remainingMessages: number | null;
  
  // Refresh
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [dailyDiagnoses, setDailyDiagnoses] = useState(0);
  const [dailyMessages, setDailyMessages] = useState(0);
  const [loading, setLoading] = useState(true);

  const limits = TIER_LIMITS[tier];

  const refresh = useCallback(async () => {
    try {
      const [savedTier, usage] = await Promise.all([
        getSubscriptionTier(),
        getDailyUsage(),
      ]);
      setTier(savedTier);
      setDailyDiagnoses(usage.diagnoses);
      setDailyMessages(usage.messages);
    } catch (error) {
      console.error("Error refreshing subscription:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const upgradeTo = useCallback(async (newTier: SubscriptionTier) => {
    await saveSubscriptionTier(newTier);
    setTier(newTier);
  }, []);

  const canDiagnose = useCallback(() => {
    return canUseDiagnosis(tier, dailyDiagnoses);
  }, [tier, dailyDiagnoses]);

  const canMessage = useCallback(() => {
    return canSendMessage(tier, dailyMessages);
  }, [tier, dailyMessages]);

  const canAddNewPlant = useCallback((currentCount: number) => {
    return canAddPlant(tier, currentCount);
  }, [tier]);

  const canAddNewJournalEntry = useCallback((currentCount: number) => {
    return canAddJournalEntry(tier, currentCount);
  }, [tier]);

  const useDiagnosis = useCallback(async () => {
    if (!canUseDiagnosis(tier, dailyDiagnoses)) {
      return false;
    }
    const newCount = await incrementDiagnoses();
    setDailyDiagnoses(newCount);
    return true;
  }, [tier, dailyDiagnoses]);

  const useMessage = useCallback(async () => {
    if (!canSendMessage(tier, dailyMessages)) {
      return false;
    }
    const newCount = await incrementMessages();
    setDailyMessages(newCount);
    return true;
  }, [tier, dailyMessages]);

  const remainingDiagnoses = getRemainingDiagnoses(tier, dailyDiagnoses);
  const remainingMessages = getRemainingMessages(tier, dailyMessages);

  return (
    <SubscriptionContext.Provider
      value={{
        tier,
        limits,
        dailyDiagnoses,
        dailyMessages,
        loading,
        setTier,
        upgradeTo,
        canDiagnose,
        canMessage,
        canAddNewPlant,
        canAddNewJournalEntry,
        useDiagnosis,
        useMessage,
        remainingDiagnoses,
        remainingMessages,
        refresh,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}
