import { describe, expect, it } from "vitest";
import { resolveTierFromEntitlements, selectTierOfferings } from "../lib/entitlements";
import { parseRevenueCatEvent, verifyWebhookAuth } from "../server/_core/revenuecat";

const both = { entitlementPro: "Pro E", entitlementPremium: "Prem E" };
const proOnly = { entitlementPro: "Pro E", entitlementPremium: "" };

describe("resolveTierFromEntitlements", () => {
  it("pro wins, premium only when configured", () => {
    expect(resolveTierFromEntitlements(["Pro E", "Prem E"], both).tier).toBe("pro");
    expect(resolveTierFromEntitlements(["Prem E"], both).tier).toBe("premium");
    expect(resolveTierFromEntitlements(["Prem E"], proOnly).tier).toBe("free");
    expect(resolveTierFromEntitlements([], both).tier).toBe("free");
  });
});

describe("selectTierOfferings", () => {
  const pk = { availablePackages: [{}] };
  const cfg = { offeringPro: "", offeringPremium: "premium" };
  it("falls back to pro-only when premium offering missing", () => {
    expect(Object.keys(selectTierOfferings(pk, {}, cfg))).toEqual(["pro"]);
  });
  it("offers both when configured with packages", () => {
    expect(Object.keys(selectTierOfferings(pk, { premium: pk }, cfg)).sort()).toEqual(["premium", "pro"]);
  });
  it("ignores empty offerings and unset premium id", () => {
    expect(selectTierOfferings(pk, { premium: { availablePackages: [] } }, cfg).premium).toBeUndefined();
    expect(selectTierOfferings(pk, { premium: pk }, { offeringPro: "", offeringPremium: "" }).premium).toBeUndefined();
  });
});

describe("verifyWebhookAuth", () => {
  it("accepts exact/Bearer, rejects wrong or missing", () => {
    expect(verifyWebhookAuth("s3cret", "s3cret")).toBe(true);
    expect(verifyWebhookAuth("Bearer s3cret", "s3cret")).toBe(true);
    expect(verifyWebhookAuth("nope", "s3cret")).toBe(false);
    expect(verifyWebhookAuth(undefined, "s3cret")).toBe(false);
    expect(verifyWebhookAuth("x", undefined)).toBe(false);
  });
});

describe("parseRevenueCatEvent", () => {
  const now = new Date("2026-10-05T00:00:00Z");
  const future = Date.parse("2026-11-05T00:00:00Z");
  const past = Date.parse("2026-09-01T00:00:00Z");
  const ev = (o: Record<string, unknown>) => ({ event: { app_user_id: "u1", entitlement_ids: ["Pro E"], expiration_at_ms: future, ...o } });

  it("purchase/renewal/product change set tier + expiry", () => {
    for (const type of ["INITIAL_PURCHASE", "RENEWAL", "PRODUCT_CHANGE"]) {
      const a = parseRevenueCatEvent(ev({ type }), both, now);
      expect(a).toMatchObject({ kind: "set", tier: "pro", appUserIds: ["u1"] });
    }
    const p = parseRevenueCatEvent(ev({ type: "RENEWAL", entitlement_ids: ["Prem E"] }), both, now);
    expect(p).toMatchObject({ tier: "premium" });
    expect((p as any).expiresAt).toEqual(new Date(future));
  });
  it("lifetime (no expiry) keeps tier with null expiry", () => {
    expect(parseRevenueCatEvent(ev({ type: "INITIAL_PURCHASE", expiration_at_ms: null }), both, now)).toMatchObject({ tier: "pro", expiresAt: null });
  });
  it("cancellation keeps access until expiry, then free", () => {
    expect(parseRevenueCatEvent(ev({ type: "CANCELLATION" }), both, now)).toMatchObject({ tier: "pro" });
    expect(parseRevenueCatEvent(ev({ type: "CANCELLATION", expiration_at_ms: past }), both, now)).toMatchObject({ tier: "free" });
  });
  it("expiration sets free", () => {
    expect(parseRevenueCatEvent(ev({ type: "EXPIRATION", expiration_at_ms: past }), both, now)).toMatchObject({ kind: "set", tier: "free" });
  });
  it("ignores anonymous ids, unknown events, unmapped entitlements, garbage", () => {
    expect(parseRevenueCatEvent(ev({ type: "RENEWAL", app_user_id: "$RCAnonymousID:abc" }), both, now).kind).toBe("ignore");
    expect(parseRevenueCatEvent(ev({ type: "TEST" }), both, now).kind).toBe("ignore");
    expect(parseRevenueCatEvent(ev({ type: "RENEWAL", entitlement_ids: ["other"] }), both, now).kind).toBe("ignore");
    expect(parseRevenueCatEvent({}, both, now).kind).toBe("ignore");
    expect(parseRevenueCatEvent(null, both, now).kind).toBe("ignore");
  });
  it("uses aliases as fallback ids; legacy single entitlement defaults to pro", () => {
    const a = parseRevenueCatEvent(ev({ type: "RENEWAL", app_user_id: "$RCAnonymousID:x", aliases: ["$RCAnonymousID:x", "u9"], entitlement_ids: null }), proOnly, now);
    expect(a).toMatchObject({ tier: "pro", appUserIds: ["u9"] });
  });
});
