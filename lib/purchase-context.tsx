import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Platform, Alert } from "react-native";
import { PurchasesOffering, PurchasesPackage, CustomerInfo } from "react-native-purchases";
import {
  initializePurchases,
  getOfferings,
  purchasePackage,
  restorePurchases,
  getSubscriptionStatus,
  addCustomerInfoUpdateListener,
  identifyUser,
  logoutUser,
  SubscriptionStatus,
  PRODUCT_IDS,
} from "./purchases";
import { useSubscription } from "./subscription-context";

interface PurchaseContextType {
  // State
  isInitialized: boolean;
  isLoading: boolean;
  offerings: PurchasesOffering | null;
  subscriptionStatus: SubscriptionStatus;
  
  // Actions
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;
  identifyPurchaseUser: (userId: string) => Promise<void>;
  logoutPurchaseUser: () => Promise<void>;
}

const PurchaseContext = createContext<PurchaseContextType | undefined>(undefined);

export function PurchaseProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    isActive: false,
    tier: "free",
    expirationDate: null,
    willRenew: false,
    productId: null,
    isLifetime: false,
  });
  
  const { setTier } = useSubscription();

  // Initialisiere RevenueCat beim Mount
  useEffect(() => {
    async function init() {
      if (Platform.OS === "web") {
        setIsInitialized(true);
        return;
      }

      try {
        await initializePurchases();
        
        // Lade Offerings
        const currentOfferings = await getOfferings();
        setOfferings(currentOfferings);
        
        // Lade aktuellen Status
        const status = await getSubscriptionStatus();
        setSubscriptionStatus(status);
        setTier(status.tier);
        
        setIsInitialized(true);
      } catch (error) {
        console.error("[PurchaseContext] Initialization failed:", error);
        setIsInitialized(true); // Trotzdem als initialisiert markieren
      }
    }

    init();
  }, [setTier]);

  // Listener für Subscription-Änderungen
  useEffect(() => {
    if (Platform.OS === "web") return;

    const handleCustomerInfoUpdate = async (customerInfo: CustomerInfo) => {
      const status = await getSubscriptionStatus();
      setSubscriptionStatus(status);
      setTier(status.tier);
    };

    const unsubscribe = addCustomerInfoUpdateListener(handleCustomerInfoUpdate);
    return unsubscribe;
  }, [setTier]);

  // Kauf durchführen
  const purchase = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Nicht verfügbar",
        "In-App-Käufe sind nur in der mobilen App verfügbar. Bitte lade die App aus dem App Store oder Google Play Store."
      );
      return false;
    }

    setIsLoading(true);
    
    try {
      const result = await purchasePackage(pkg);
      
      if (result.success && result.customerInfo) {
        const status = await getSubscriptionStatus();
        setSubscriptionStatus(status);
        setTier(status.tier);
        
        Alert.alert(
          "Kauf erfolgreich! 🎉",
          `Willkommen bei GrowMaster ${status.tier === "pro" ? "Pro" : "Premium"}! Alle Features sind jetzt freigeschaltet.`
        );
        return true;
      } else if (result.error === "cancelled") {
        // User hat abgebrochen - keine Fehlermeldung
        return false;
      } else {
        Alert.alert("Kauf fehlgeschlagen", result.error || "Ein unbekannter Fehler ist aufgetreten.");
        return false;
      }
    } catch (error) {
      console.error("[PurchaseContext] Purchase error:", error);
      Alert.alert("Fehler", "Der Kauf konnte nicht abgeschlossen werden. Bitte versuche es später erneut.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [setTier]);

  // Käufe wiederherstellen
  const restore = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Nicht verfügbar",
        "Käufe können nur in der mobilen App wiederhergestellt werden."
      );
      return false;
    }

    setIsLoading(true);
    
    try {
      const result = await restorePurchases();
      
      if (result.success) {
        const status = await getSubscriptionStatus();
        setSubscriptionStatus(status);
        setTier(status.tier);
        
        if (status.isActive) {
          Alert.alert(
            "Käufe wiederhergestellt! 🎉",
            `Dein ${status.tier === "pro" ? "Pro" : "Premium"} Abo wurde wiederhergestellt.`
          );
        } else {
          Alert.alert(
            "Keine Käufe gefunden",
            "Es wurden keine aktiven Abonnements für dieses Konto gefunden."
          );
        }
        return status.isActive;
      } else {
        Alert.alert("Fehler", result.error || "Käufe konnten nicht wiederhergestellt werden.");
        return false;
      }
    } catch (error) {
      console.error("[PurchaseContext] Restore error:", error);
      Alert.alert("Fehler", "Käufe konnten nicht wiederhergestellt werden. Bitte versuche es später erneut.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [setTier]);

  // Status aktualisieren
  const refreshStatus = useCallback(async () => {
    if (Platform.OS === "web") return;
    
    try {
      const status = await getSubscriptionStatus();
      setSubscriptionStatus(status);
      setTier(status.tier);
    } catch (error) {
      console.error("[PurchaseContext] Refresh status error:", error);
    }
  }, [setTier]);

  // User identifizieren (nach Login)
  const identifyPurchaseUser = useCallback(async (userId: string) => {
    if (Platform.OS === "web") return;
    
    try {
      await identifyUser(userId);
      await refreshStatus();
    } catch (error) {
      console.error("[PurchaseContext] Identify user error:", error);
    }
  }, [refreshStatus]);

  // User ausloggen
  const logoutPurchaseUser = useCallback(async () => {
    if (Platform.OS === "web") return;
    
    try {
      await logoutUser();
      setSubscriptionStatus({
        isActive: false,
        tier: "free",
        expirationDate: null,
        willRenew: false,
        productId: null,
        isLifetime: false,
      });
      setTier("free");
    } catch (error) {
      console.error("[PurchaseContext] Logout user error:", error);
    }
  }, [setTier]);

  return (
    <PurchaseContext.Provider
      value={{
        isInitialized,
        isLoading,
        offerings,
        subscriptionStatus,
        purchase,
        restore,
        refreshStatus,
        identifyPurchaseUser,
        logoutPurchaseUser,
      }}
    >
      {children}
    </PurchaseContext.Provider>
  );
}

export function usePurchases() {
  const context = useContext(PurchaseContext);
  if (!context) {
    throw new Error("usePurchases must be used within a PurchaseProvider");
  }
  return context;
}

// Helper Hook für Offerings
export function useOfferings() {
  const { offerings, isLoading } = usePurchases();
  
  // Neue Produkt-IDs: monthly, yearly, lifetime
  const monthly = offerings?.availablePackages.find(
    p => p.product.identifier === PRODUCT_IDS.MONTHLY || p.identifier === "$rc_monthly"
  );
  const yearly = offerings?.availablePackages.find(
    p => p.product.identifier === PRODUCT_IDS.YEARLY || p.identifier === "$rc_annual"
  );
  const lifetime = offerings?.availablePackages.find(
    p => p.product.identifier === PRODUCT_IDS.LIFETIME || p.identifier === "$rc_lifetime"
  );
  
  return {
    isLoading,
    monthly,
    yearly,
    lifetime,
    // Backwards compatibility
    premiumMonthly: monthly,
    premiumYearly: yearly,
    proMonthly: monthly,
    proYearly: yearly,
    allPackages: offerings?.availablePackages || [],
  };
}
