/**
 * Config-driven Premium/Pro-Mapping für RevenueCat (reine Logik, ohne native Module).
 *
 * EXPO_PUBLIC_*-Variablen müssen als statische `process.env.EXPO_PUBLIC_X`-Zugriffe
 * stehen, damit Expo sie ins Bundle inlined.
 */
export type PaidTier = "premium" | "pro";

const trim = (v: string | undefined): string => (v ?? "").trim();

export const ENTITLEMENT_PRO = trim(process.env.EXPO_PUBLIC_RC_ENTITLEMENT_PRO) || "GrowMaster AI Pro";
/** Leer = Premium ist nicht konfiguriert (kein separates Entitlement). */
export const ENTITLEMENT_PREMIUM = trim(process.env.EXPO_PUBLIC_RC_ENTITLEMENT_PREMIUM);

/** Offering-IDs: Pro nutzt standardmäßig das „current“ Offering; Premium nur, wenn gesetzt. */
export const OFFERING_PRO = trim(process.env.EXPO_PUBLIC_RC_OFFERING_PRO);
export const OFFERING_PREMIUM = trim(process.env.EXPO_PUBLIC_RC_OFFERING_PREMIUM);

export interface TierConfig {
  entitlementPro: string;
  entitlementPremium: string;
}

export const DEFAULT_TIER_CONFIG: TierConfig = {
  entitlementPro: ENTITLEMENT_PRO,
  entitlementPremium: ENTITLEMENT_PREMIUM,
};

/** Pro hat Vorrang vor Premium; Premium zählt nur, wenn konfiguriert und verschieden von Pro. */
export function resolveTierFromEntitlements(
  activeEntitlementIds: string[],
  cfg: TierConfig = DEFAULT_TIER_CONFIG,
): { tier: "free" | PaidTier; entitlementId: string | null } {
  if (activeEntitlementIds.includes(cfg.entitlementPro)) {
    return { tier: "pro", entitlementId: cfg.entitlementPro };
  }
  if (
    cfg.entitlementPremium &&
    cfg.entitlementPremium !== cfg.entitlementPro &&
    activeEntitlementIds.includes(cfg.entitlementPremium)
  ) {
    return { tier: "premium", entitlementId: cfg.entitlementPremium };
  }
  return { tier: "free", entitlementId: null };
}

interface OfferingLike {
  identifier?: string;
  availablePackages?: unknown[];
}

/**
 * Wählt je Tier das Offering. Nur Tiers mit Offering UND mindestens einem Paket werden
 * zurückgegeben; Pro-Fallback = current Offering, falls kein Pro-Offering konfiguriert ist.
 */
export function selectTierOfferings(
  current: OfferingLike | null | undefined,
  all: Record<string, OfferingLike> | null | undefined,
  cfg: { offeringPro: string; offeringPremium: string } = {
    offeringPro: OFFERING_PRO,
    offeringPremium: OFFERING_PREMIUM,
  },
): Partial<Record<PaidTier, OfferingLike>> {
  const hasPackages = (o?: OfferingLike | null): o is OfferingLike => !!o && (o.availablePackages?.length ?? 0) > 0;
  const out: Partial<Record<PaidTier, OfferingLike>> = {};

  const pro = cfg.offeringPro ? all?.[cfg.offeringPro] : current;
  if (hasPackages(pro)) out.pro = pro;

  if (cfg.offeringPremium) {
    const premium = all?.[cfg.offeringPremium];
    if (hasPackages(premium)) out.premium = premium;
  }
  return out;
}
