import { Platform } from "react-native";
import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from "react-native-purchases";

// RevenueCat API Keys - Diese müssen in RevenueCat Dashboard erstellt werden
const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || "";
const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || "";

// Produkt-IDs für die Abos (müssen in App Store Connect / Google Play Console erstellt werden)
export const PRODUCT_IDS = {
  PREMIUM_MONTHLY: "growmaster_premium_monthly",
  PREMIUM_YEARLY: "growmaster_premium_yearly",
  PRO_MONTHLY: "growmaster_pro_monthly",
  PRO_YEARLY: "growmaster_pro_yearly",
} as const;

// Entitlement IDs (in RevenueCat Dashboard konfigurieren)
export const ENTITLEMENTS = {
  PREMIUM: "premium",
  PRO: "pro",
} as const;

export interface SubscriptionStatus {
  isActive: boolean;
  tier: "free" | "premium" | "pro";
  expirationDate: Date | null;
  willRenew: boolean;
  productId: string | null;
}

/**
 * Initialisiert RevenueCat SDK
 * Muss beim App-Start aufgerufen werden
 */
export async function initializePurchases(userId?: string): Promise<void> {
  if (Platform.OS === "web") {
    console.log("[Purchases] Web platform - skipping RevenueCat initialization");
    return;
  }

  const apiKey = Platform.OS === "ios" ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
  
  if (!apiKey) {
    console.warn("[Purchases] No RevenueCat API key configured for platform:", Platform.OS);
    return;
  }

  try {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    
    if (userId) {
      await Purchases.configure({ apiKey, appUserID: userId });
    } else {
      await Purchases.configure({ apiKey });
    }
    
    console.log("[Purchases] RevenueCat initialized successfully");
  } catch (error) {
    console.error("[Purchases] Failed to initialize RevenueCat:", error);
  }
}

/**
 * Identifiziert einen User bei RevenueCat (nach Login)
 */
export async function identifyUser(userId: string): Promise<CustomerInfo | null> {
  if (Platform.OS === "web") return null;
  
  try {
    const { customerInfo } = await Purchases.logIn(userId);
    return customerInfo;
  } catch (error) {
    console.error("[Purchases] Failed to identify user:", error);
    return null;
  }
}

/**
 * Loggt User aus RevenueCat aus
 */
export async function logoutUser(): Promise<void> {
  if (Platform.OS === "web") return;
  
  try {
    await Purchases.logOut();
  } catch (error) {
    console.error("[Purchases] Failed to logout user:", error);
  }
}

/**
 * Holt die verfügbaren Angebote/Pakete
 */
export async function getOfferings(): Promise<PurchasesOffering | null> {
  if (Platform.OS === "web") return null;
  
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error("[Purchases] Failed to get offerings:", error);
    return null;
  }
}

/**
 * Führt einen Kauf durch
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<{
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
}> {
  if (Platform.OS === "web") {
    return { success: false, error: "Purchases not available on web" };
  }
  
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { success: true, customerInfo };
  } catch (error: any) {
    // User hat Kauf abgebrochen
    if (error.userCancelled) {
      return { success: false, error: "cancelled" };
    }
    console.error("[Purchases] Purchase failed:", error);
    return { success: false, error: error.message || "Purchase failed" };
  }
}

/**
 * Stellt vorherige Käufe wieder her
 */
export async function restorePurchases(): Promise<{
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
}> {
  if (Platform.OS === "web") {
    return { success: false, error: "Purchases not available on web" };
  }
  
  try {
    const customerInfo = await Purchases.restorePurchases();
    return { success: true, customerInfo };
  } catch (error: any) {
    console.error("[Purchases] Restore failed:", error);
    return { success: false, error: error.message || "Restore failed" };
  }
}

/**
 * Holt den aktuellen Subscription-Status
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const defaultStatus: SubscriptionStatus = {
    isActive: false,
    tier: "free",
    expirationDate: null,
    willRenew: false,
    productId: null,
  };

  if (Platform.OS === "web") return defaultStatus;

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    
    // Prüfe Pro Entitlement zuerst (höherwertiger)
    const proEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.PRO];
    if (proEntitlement) {
      return {
        isActive: true,
        tier: "pro",
        expirationDate: proEntitlement.expirationDate ? new Date(proEntitlement.expirationDate) : null,
        willRenew: proEntitlement.willRenew,
        productId: proEntitlement.productIdentifier,
      };
    }
    
    // Prüfe Premium Entitlement
    const premiumEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM];
    if (premiumEntitlement) {
      return {
        isActive: true,
        tier: "premium",
        expirationDate: premiumEntitlement.expirationDate ? new Date(premiumEntitlement.expirationDate) : null,
        willRenew: premiumEntitlement.willRenew,
        productId: premiumEntitlement.productIdentifier,
      };
    }
    
    return defaultStatus;
  } catch (error) {
    console.error("[Purchases] Failed to get subscription status:", error);
    return defaultStatus;
  }
}

/**
 * Listener für Subscription-Änderungen
 */
export function addCustomerInfoUpdateListener(
  callback: (customerInfo: CustomerInfo) => void
): () => void {
  if (Platform.OS === "web") return () => {};
  
  Purchases.addCustomerInfoUpdateListener(callback);
  // RevenueCat SDK handles cleanup internally
  return () => {};
}

/**
 * Formatiert einen Preis für die Anzeige
 */
export function formatPrice(pkg: PurchasesPackage): string {
  return pkg.product.priceString;
}

/**
 * Berechnet den monatlichen Preis für Jahresabos
 */
export function getMonthlyPriceFromYearly(pkg: PurchasesPackage): string {
  const yearlyPrice = pkg.product.price;
  const monthlyPrice = yearlyPrice / 12;
  const currencyCode = pkg.product.currencyCode;
  
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: currencyCode,
  }).format(monthlyPrice);
}

/**
 * Berechnet die Ersparnis bei Jahresabos
 */
export function calculateYearlySavings(
  monthlyPkg: PurchasesPackage,
  yearlyPkg: PurchasesPackage
): { amount: string; percentage: number } {
  const monthlyTotal = monthlyPkg.product.price * 12;
  const yearlyPrice = yearlyPkg.product.price;
  const savings = monthlyTotal - yearlyPrice;
  const percentage = Math.round((savings / monthlyTotal) * 100);
  
  const currencyCode = yearlyPkg.product.currencyCode;
  const formattedSavings = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: currencyCode,
  }).format(savings);
  
  return { amount: formattedSavings, percentage };
}
