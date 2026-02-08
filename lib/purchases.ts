import { Platform, NativeModules } from "react-native";

// ---------------------------------------------------------------------------
// Lazy-loaded RevenueCat SDK
// react-native-purchases runs native code at import time (NativeEventEmitter).
// If the native module isn't available or New Architecture interop fails,
// a static import would crash the entire app at startup.
// We lazy-load via require() so the crash is caught and the app degrades gracefully.
// ---------------------------------------------------------------------------

let RCPurchases: any = null;
let RC_LOG_LEVEL: any = null;
let RC_PACKAGE_TYPE: any = null;
let _nativeModuleLoaded = false;

function loadNativeModule(): boolean {
  if (_nativeModuleLoaded) return !!RCPurchases;
  _nativeModuleLoaded = true;

  if (Platform.OS === "web") return false;

  // Pre-check: is the native module even registered?
  if (!NativeModules.RNPurchases) {
    console.warn("[Purchases] RNPurchases native module not found. In-app purchases unavailable.");
    return false;
  }

  try {
    const mod = require("react-native-purchases");
    RCPurchases = mod.default;
    RC_LOG_LEVEL = mod.LOG_LEVEL;
    RC_PACKAGE_TYPE = mod.PACKAGE_TYPE;
    console.log("[Purchases] Native module loaded successfully");
    return true;
  } catch (error) {
    console.error("[Purchases] Failed to load native module:", error);
    return false;
  }
}

// Re-export types (type-only imports are safe — they're erased at compile time)
export type { PurchasesOffering, PurchasesPackage, CustomerInfo } from "react-native-purchases";

// RevenueCat API Key — EXPO_PUBLIC_ prefix required for client bundle
const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || "";

// Produkt-IDs für die Abos
export const PRODUCT_IDS = {
  MONTHLY: "monthly",
  YEARLY: "yearly",
  LIFETIME: "lifetime",
} as const;

// Entitlement ID
export const ENTITLEMENTS = {
  PRO: "GrowMaster AI Pro",
} as const;

export interface SubscriptionStatus {
  isActive: boolean;
  tier: "free" | "premium" | "pro";
  expirationDate: Date | null;
  willRenew: boolean;
  productId: string | null;
  isLifetime: boolean;
}

const DEFAULT_STATUS: SubscriptionStatus = {
  isActive: false,
  tier: "free",
  expirationDate: null,
  willRenew: false,
  productId: null,
  isLifetime: false,
};

// Track initialization
let _initialized = false;

/**
 * Prüft ob RevenueCat verfügbar ist
 */
export function isPurchasesAvailable(): boolean {
  return loadNativeModule();
}

/**
 * Initialisiert RevenueCat SDK
 */
export async function initializePurchases(userId?: string): Promise<boolean> {
  if (_initialized) return true;
  if (!loadNativeModule()) return false;
  if (!REVENUECAT_API_KEY) {
    console.warn("[Purchases] No API key configured. Skipping initialization.");
    return false;
  }

  try {
    if (__DEV__ && RC_LOG_LEVEL) {
      RCPurchases.setLogLevel(RC_LOG_LEVEL.DEBUG);
    }

    if (userId) {
      await RCPurchases.configure({ apiKey: REVENUECAT_API_KEY, appUserID: userId });
    } else {
      await RCPurchases.configure({ apiKey: REVENUECAT_API_KEY });
    }

    _initialized = true;
    console.log("[Purchases] RevenueCat initialized (key:", REVENUECAT_API_KEY.substring(0, 10) + "...)");
    return true;
  } catch (error) {
    console.error("[Purchases] Failed to initialize RevenueCat:", error);
    return false;
  }
}

/**
 * Holt die verfügbaren Angebote/Pakete
 */
export async function getOfferings(): Promise<any | null> {
  if (!loadNativeModule() || !_initialized) return null;

  try {
    const offerings = await RCPurchases.getOfferings();
    if (offerings.current) {
      console.log("[Purchases] Offering:", offerings.current.identifier,
        "packages:", offerings.current.availablePackages.length);
    }
    return offerings.current ?? null;
  } catch (error) {
    console.error("[Purchases] Failed to get offerings:", error);
    return null;
  }
}

/**
 * Führt einen Kauf durch
 */
export async function purchasePackage(pkg: any): Promise<{
  success: boolean;
  customerInfo?: any;
  error?: string;
  userCancelled?: boolean;
}> {
  if (!loadNativeModule()) {
    return { success: false, error: "Native module not available" };
  }
  if (!pkg || !pkg.identifier) {
    return { success: false, error: "Invalid package" };
  }

  try {
    console.log("[Purchases] Attempting purchase:", pkg.identifier);
    const { customerInfo } = await RCPurchases.purchasePackage(pkg);

    const isPro = customerInfo.entitlements.active[ENTITLEMENTS.PRO] !== undefined;
    console.log("[Purchases] Purchase successful! Pro active:", isPro);

    return { success: true, customerInfo };
  } catch (error: any) {
    if (error.userCancelled) {
      return { success: false, error: "cancelled", userCancelled: true };
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
  customerInfo?: any;
  error?: string;
  hasActiveEntitlement?: boolean;
}> {
  if (!loadNativeModule()) {
    return { success: false, error: "Native module not available" };
  }

  try {
    console.log("[Purchases] Restoring purchases...");
    const customerInfo = await RCPurchases.restorePurchases();

    const hasActiveEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.PRO] !== undefined;
    console.log("[Purchases] Restore done. Pro active:", hasActiveEntitlement);

    return { success: true, customerInfo, hasActiveEntitlement };
  } catch (error: any) {
    console.error("[Purchases] Restore failed:", error);
    return { success: false, error: error.message || "Restore failed" };
  }
}

/**
 * Holt den aktuellen Subscription-Status
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  if (!loadNativeModule() || !_initialized) return DEFAULT_STATUS;

  try {
    const customerInfo = await RCPurchases.getCustomerInfo();
    const proEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.PRO];

    if (proEntitlement) {
      return {
        isActive: true,
        tier: "pro",
        expirationDate: proEntitlement.expirationDate ? new Date(proEntitlement.expirationDate) : null,
        willRenew: proEntitlement.willRenew,
        productId: proEntitlement.productIdentifier,
        isLifetime: proEntitlement.productIdentifier === PRODUCT_IDS.LIFETIME,
      };
    }

    return DEFAULT_STATUS;
  } catch (error) {
    console.error("[Purchases] Failed to get subscription status:", error);
    return DEFAULT_STATUS;
  }
}

/**
 * Formatiert einen Preis für die Anzeige
 */
export function formatPrice(pkg: any): string {
  return pkg?.product?.priceString ?? "";
}

/**
 * Error Handler für Purchase-Fehler
 */
export function getPurchaseErrorMessage(error: any): string {
  switch (error?.code) {
    case "PURCHASE_CANCELLED": return "Kauf abgebrochen";
    case "STORE_PROBLEM": return "Problem mit dem Store. Bitte versuche es später erneut.";
    case "PURCHASE_NOT_ALLOWED": return "Käufe sind auf diesem Gerät nicht erlaubt.";
    case "PRODUCT_NOT_AVAILABLE": return "Dieses Produkt ist derzeit nicht verfügbar.";
    case "PRODUCT_ALREADY_PURCHASED": return "Du hast dieses Produkt bereits gekauft.";
    case "NETWORK_ERROR": return "Netzwerkfehler. Bitte prüfe deine Internetverbindung.";
    default: return error?.message || "Ein Fehler ist aufgetreten. Bitte versuche es erneut.";
  }
}
