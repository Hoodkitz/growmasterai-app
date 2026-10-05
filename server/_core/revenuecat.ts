/**
 * RevenueCat Webhook: POST /api/webhooks/revenuecat
 * Auth: Header `Authorization` muss dem Wert aus REVENUECAT_WEBHOOK_SECRET entsprechen
 * (in RevenueCat unter „Authorization header value“ gesetzt; optionales „Bearer “-Präfix wird toleriert).
 */
import { timingSafeEqual } from "node:crypto";
import type { Express, Request, Response } from "express";

export type Tier = "free" | "premium" | "pro";

export interface RevenueCatConfig {
  entitlementPro: string;
  /** Leer = Premium nicht konfiguriert. */
  entitlementPremium: string;
}

export function getRevenueCatConfig(env: NodeJS.ProcessEnv = process.env): RevenueCatConfig {
  return {
    entitlementPro:
      (env.REVENUECAT_ENTITLEMENT_PRO || env.EXPO_PUBLIC_RC_ENTITLEMENT_PRO || "").trim() || "GrowMaster AI Pro",
    entitlementPremium: (env.REVENUECAT_ENTITLEMENT_PREMIUM || env.EXPO_PUBLIC_RC_ENTITLEMENT_PREMIUM || "").trim(),
  };
}

export function verifyWebhookAuth(header: string | undefined, secret: string | undefined): boolean {
  if (!secret || !header) return false;
  const norm = (v: string) => v.replace(/^Bearer\s+/i, "").trim();
  const a = Buffer.from(norm(header));
  const b = Buffer.from(norm(secret));
  return a.length === b.length && timingSafeEqual(a, b);
}

const SET_EVENTS = new Set(["INITIAL_PURCHASE", "RENEWAL", "PRODUCT_CHANGE", "UNCANCELLATION", "NON_RENEWING_PURCHASE"]);

export type WebhookAction =
  | { kind: "set"; appUserIds: string[]; tier: Tier; expiresAt: Date | null; eventType: string }
  | { kind: "ignore"; reason: string };

function tierFromEntitlements(ids: string[] | null | undefined, cfg: RevenueCatConfig): Tier | null {
  if (!ids || ids.length === 0) {
    // Legacy-Setup mit nur einem Entitlement: ohne Angabe gilt Pro
    return cfg.entitlementPremium ? null : "pro";
  }
  if (ids.includes(cfg.entitlementPro)) return "pro";
  if (cfg.entitlementPremium && ids.includes(cfg.entitlementPremium)) return "premium";
  return null;
}

/** Reine Logik: Webhook-Body → Aktion auf users.subscriptionTier / subscriptionExpiresAt. */
export function parseRevenueCatEvent(body: unknown, cfg: RevenueCatConfig, now: Date = new Date()): WebhookAction {
  const ev = (body as { event?: Record<string, any> } | null)?.event;
  if (!ev || typeof ev.type !== "string") return { kind: "ignore", reason: "no event" };

  const candidates = [ev.app_user_id, ev.original_app_user_id, ...(Array.isArray(ev.aliases) ? ev.aliases : [])]
    .filter((v): v is string => typeof v === "string" && v.length > 0 && !v.startsWith("$RCAnonymousID:"));
  const appUserIds = Array.from(new Set(candidates));
  if (appUserIds.length === 0) return { kind: "ignore", reason: "no identified app_user_id" };

  const expiresAt =
    typeof ev.expiration_at_ms === "number" && Number.isFinite(ev.expiration_at_ms)
      ? new Date(ev.expiration_at_ms)
      : null;
  const type: string = ev.type;

  if (type === "EXPIRATION") {
    return { kind: "set", appUserIds, tier: "free", expiresAt, eventType: type };
  }

  const tier = tierFromEntitlements(ev.entitlement_ids, cfg);
  if (!tier) return { kind: "ignore", reason: "entitlement not mapped" };

  if (SET_EVENTS.has(type)) {
    // Abgelaufenes Datum bei Kaufereignis → kein Zugriff
    if (expiresAt && expiresAt.getTime() <= now.getTime()) {
      return { kind: "set", appUserIds, tier: "free", expiresAt, eventType: type };
    }
    return { kind: "set", appUserIds, tier, expiresAt, eventType: type };
  }

  if (type === "CANCELLATION") {
    // Kündigung = Auto-Renew aus; Zugriff bleibt bis Laufzeitende (danach kommt EXPIRATION).
    const stillActive = !expiresAt || expiresAt.getTime() > now.getTime();
    return { kind: "set", appUserIds, tier: stillActive ? tier : "free", expiresAt, eventType: type };
  }

  return { kind: "ignore", reason: `event ${type} not handled` };
}

export function registerRevenueCatRoutes(app: Express) {
  app.post("/api/webhooks/revenuecat", async (req: Request, res: Response) => {
    const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
    if (!secret) {
      res.status(503).json({ error: "webhook not configured" });
      return;
    }
    if (!verifyWebhookAuth(req.headers.authorization, secret)) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }

    try {
      const action = parseRevenueCatEvent(req.body, getRevenueCatConfig());
      if (action.kind === "ignore") {
        res.json({ ok: true, ignored: action.reason });
        return;
      }
      const { setUserSubscriptionByOpenIds } = await import("../db");
      const updated = await setUserSubscriptionByOpenIds(action.appUserIds, action.tier, action.expiresAt);
      if (!updated) console.warn(`[RevenueCat] no user found for ${action.appUserIds.join(",")} (${action.eventType})`);
      res.json({ ok: true, updated });
    } catch (error) {
      console.error("[RevenueCat] webhook error:", error);
      res.status(500).json({ error: "internal error" }); // RevenueCat retried bei 5xx
    }
  });
}
