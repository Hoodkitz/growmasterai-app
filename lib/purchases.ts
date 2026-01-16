import { Platform } from "react-native";
import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
  PACKAGE_TYPE,
} from "react-native-purchases";

// RevenueCat API Keys
// SDK API Key (Google Play)
const REVENUECAT_API_KEY = process.env.REVENUECAT_API_KEY || "goog_KaRWjmufAmhheobtrxzlqQKNyjC";

// Produkt-IDs für die Abos (wie angefordert)
export const PRODUCT_IDS = {
  MONTHLY: "monthly",
  YEARLY: "yearly",
  LIFETIME: "lifetime",
} as const;

// Entitlement ID (wie angefordert)
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

export interface PackageInfo {
  identifier: string;
  packageType: string;
  product: {
    title: string;
    description: string;
    price: number;
    priceString: string;
    currencyCode: string;
  };
  monthlyPrice?: string;
  savings?: { amount: string; percentage: number };
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

  try {
    // Debug-Logs aktivieren (nur für Entwicklung)
    if (process.env.NODE_ENV === 'development') {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }
    
    // SDK konfigurieren
    if (userId) {
      await Purchases.configure({ apiKey: REVENUECAT_API_KEY, appUserID: userId });
    } else {
      await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
    }
    
    console.log("[Purchases] RevenueCat initialized successfully with key:", REVENUECAT_API_KEY.substring(0, 10) + "...");
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
    console.log("[Purchases] User identified:", userId);
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
    console.log("[Purchases] User logged out");
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
    
    if (offerings.current) {
      console.log("[Purchases] Current offering:", offerings.current.identifier);
      console.log("[Purchases] Available packages:", offerings.current.availablePackages.length);
      
      offerings.current.availablePackages.forEach(pkg => {
        console.log(`[Purchases]   - ${pkg.identifier}: ${pkg.product.priceString}`);
      });
    }
    
    return offerings.current;
  } catch (error) {
    console.error("[Purchases] Failed to get offerings:", error);
    return null;
  }
}

/**
 * Holt ein spezifisches Package nach Typ
 */
export async function getPackageByType(type: "monthly" | "yearly" | "lifetime"): Promise<PurchasesPackage | null> {
  const offering = await getOfferings();
  if (!offering) return null;
  
  switch (type) {
    case "monthly":
      return offering.monthly || null;
    case "yearly":
      return offering.annual || null;
    case "lifetime":
      return offering.lifetime || null;
    default:
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
  userCancelled?: boolean;
}> {
  if (Platform.OS === "web") {
    return { success: false, error: "Purchases not available on web" };
  }

  // Prüfe ob pkg gültig ist
  if (!pkg || !pkg.identifier) {
    console.error("[Purchases] Invalid package provided");
    return { success: false, error: "Invalid package" };
  }
  
  try {
    console.log("[Purchases] Attempting purchase:", pkg.identifier);
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    
    // Prüfe ob Pro-Entitlement jetzt aktiv ist
    const isPro = customerInfo.entitlements.active[ENTITLEMENTS.PRO] !== undefined;
    console.log("[Purchases] Purchase successful! Pro active:", isPro);
    
    return { success: true, customerInfo };
  } catch (error: any) {
    // User hat Kauf abgebrochen
    if (error.userCancelled) {
      console.log("[Purchases] User cancelled purchase");
      return { success: false, error: "cancelled", userCancelled: true };
    }
    
    // RevenueCat nicht konfiguriert oder Produkte nicht eingerichtet
    if (error.code === "CONFIGURATION_ERROR" || error.message?.includes("not configured")) {
      console.log("[Purchases] RevenueCat not configured - using demo mode");
      return { success: false, error: "not_configured" };
    }
    
    console.error("[Purchases] Purchase failed:", error);
    return { success: false, error: error.message || "Purchase failed" };
  }
}

/**
 * Kauft ein Produkt nach ID
 */
export async function purchaseProductById(productId: string): Promise<{
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
}> {
  const offering = await getOfferings();
  if (!offering) {
    return { success: false, error: "No offerings available" };
  }
  
  const pkg = offering.availablePackages.find(p => p.product.identifier === productId);
  if (!pkg) {
    return { success: false, error: `Product not found: ${productId}` };
  }
  
  return purchasePackage(pkg);
}

/**
 * Stellt vorherige Käufe wieder her
 */
export async function restorePurchases(): Promise<{
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
  hasActiveEntitlement?: boolean;
}> {
  if (Platform.OS === "web") {
    return { success: false, error: "Purchases not available on web" };
  }
  
  try {
    console.log("[Purchases] Restoring purchases...");
    const customerInfo = await Purchases.restorePurchases();
    
    const hasActiveEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.PRO] !== undefined;
    console.log("[Purchases] Restore successful! Pro active:", hasActiveEntitlement);
    
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
  const defaultStatus: SubscriptionStatus = {
    isActive: false,
    tier: "free",
    expirationDate: null,
    willRenew: false,
    productId: null,
    isLifetime: false,
  };

  if (Platform.OS === "web") return defaultStatus;

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    
    // Prüfe Pro Entitlement
    const proEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.PRO];
    if (proEntitlement) {
      const isLifetime = proEntitlement.productIdentifier === PRODUCT_IDS.LIFETIME;
      
      return {
        isActive: true,
        tier: "pro",
        expirationDate: proEntitlement.expirationDate ? new Date(proEntitlement.expirationDate) : null,
        willRenew: proEntitlement.willRenew,
        productId: proEntitlement.productIdentifier,
        isLifetime,
      };
    }
    
    return defaultStatus;
  } catch (error) {
    console.error("[Purchases] Failed to get subscription status:", error);
    return defaultStatus;
  }
}

/**
 * Prüft ob der User Pro-Zugang hat
 */
export async function hasProAccess(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active[ENTITLEMENTS.PRO] !== undefined;
  } catch (error) {
    console.error("[Purchases] Failed to check pro access:", error);
    return false;
  }
}

/**
 * Holt die CustomerInfo
 */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (Platform.OS === "web") return null;
  
  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.error("[Purchases] Failed to get customer info:", error);
    return null;
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
  console.log("[Purchases] CustomerInfo update listener added");
  
  // RevenueCat SDK handles cleanup internally
  return () => {
    console.log("[Purchases] CustomerInfo update listener would be removed");
  };
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

/**
 * Gibt Package-Informationen formatiert zurück
 */
export function getPackageInfo(pkg: PurchasesPackage, monthlyPkg?: PurchasesPackage): PackageInfo {
  const info: PackageInfo = {
    identifier: pkg.identifier,
    packageType: pkg.packageType,
    product: {
      title: pkg.product.title,
      description: pkg.product.description,
      price: pkg.product.price,
      priceString: pkg.product.priceString,
      currencyCode: pkg.product.currencyCode,
    },
  };
  
  // Monatspreis für Jahresabos berechnen
  if (pkg.packageType === PACKAGE_TYPE.ANNUAL) {
    info.monthlyPrice = getMonthlyPriceFromYearly(pkg);
    
    // Ersparnis berechnen wenn monatliches Paket verfügbar
    if (monthlyPkg) {
      info.savings = calculateYearlySavings(monthlyPkg, pkg);
    }
  }
  
  return info;
}

/**
 * Setzt Customer Attributes
 */
export async function setCustomerAttributes(attributes: Record<string, string>): Promise<void> {
  if (Platform.OS === "web") return;
  
  try {
    await Purchases.setAttributes(attributes);
    console.log("[Purchases] Customer attributes set:", Object.keys(attributes));
  } catch (error) {
    console.error("[Purchases] Failed to set attributes:", error);
  }
}

/**
 * Setzt die E-Mail-Adresse
 */
export async function setEmail(email: string): Promise<void> {
  if (Platform.OS === "web") return;
  
  try {
    await Purchases.setEmail(email);
    console.log("[Purchases] Email set");
  } catch (error) {
    console.error("[Purchases] Failed to set email:", error);
  }
}

/**
 * Setzt den Display Name
 */
export async function setDisplayName(name: string): Promise<void> {
  if (Platform.OS === "web") return;
  
  try {
    await Purchases.setDisplayName(name);
    console.log("[Purchases] Display name set");
  } catch (error) {
    console.error("[Purchases] Failed to set display name:", error);
  }
}

/**
 * Error Handler für Purchase-Fehler
 */
export function getPurchaseErrorMessage(error: any): string {
  const errorCode = error?.code;
  
  switch (errorCode) {
    case "PURCHASE_CANCELLED":
      return "Kauf abgebrochen";
    case "STORE_PROBLEM":
      return "Problem mit dem Store. Bitte versuche es später erneut.";
    case "PURCHASE_NOT_ALLOWED":
      return "Käufe sind auf diesem Gerät nicht erlaubt.";
    case "PURCHASE_INVALID":
      return "Der Kauf ist ungültig.";
    case "PRODUCT_NOT_AVAILABLE":
      return "Dieses Produkt ist derzeit nicht verfügbar.";
    case "PRODUCT_ALREADY_PURCHASED":
      return "Du hast dieses Produkt bereits gekauft.";
    case "RECEIPT_ALREADY_IN_USE":
      return "Dieser Kauf ist bereits mit einem anderen Account verknüpft.";
    case "NETWORK_ERROR":
      return "Netzwerkfehler. Bitte prüfe deine Internetverbindung.";
    default:
      return error?.message || "Ein Fehler ist aufgetreten. Bitte versuche es erneut.";
  }
}
