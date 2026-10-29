import { logSecurityEvent } from "./securityLogger";
import type { NextFunction, Request, Response } from "express";

/**
 * Minimal in-memory fixed-window rate limiter (per process).
 * Good enough for a single instance; use a shared store (Redis) when scaling out.
 */
export interface RateLimiter {
  /** Returns whether the key may proceed and, if not, seconds until reset. */
  check(key: string): { allowed: boolean; retryAfterSec: number };
  reset(): void;
}

export function createRateLimiter(opts: {
  windowMs: number;
  max: number;
  now?: () => number;
}): RateLimiter {
  const now = opts.now ?? Date.now;
  const hits = new Map<string, { count: number; resetAt: number }>();
  let lastSweep = now();

  return {
    check(key) {
      const t = now();
      // Opportunistic cleanup so the map cannot grow unbounded
      if (t - lastSweep > opts.windowMs) {
        for (const [k, v] of hits) if (v.resetAt <= t) hits.delete(k);
        lastSweep = t;
      }
      const entry = hits.get(key);
      if (!entry || entry.resetAt <= t) {
        hits.set(key, { count: 1, resetAt: t + opts.windowMs });
        return { allowed: true, retryAfterSec: 0 };
      }
      entry.count += 1;
      if (entry.count > opts.max) {
        return {
          allowed: false,
          retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - t) / 1000)),
        };
      }
      return { allowed: true, retryAfterSec: 0 };
    },
    reset() {
      hits.clear();
    },
  };
}

export function clientKey(req: {
  ip?: string;
  socket?: { remoteAddress?: string };
}): string {
  // Behind Railway, Express resolves req.ip through `trust proxy` (see server/_core/index.ts).
  // X-Real-IP is deliberately not used: Railway documents it but not that client values are overwritten.
  return req.ip || req.socket?.remoteAddress || "unknown";
}

/** Express middleware factory. */
export function rateLimitMiddleware(
  limiter: RateLimiter,
  message = "Zu viele Anfragen. Bitte später erneut versuchen.",
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = limiter.check(clientKey(req));
    if (!result.allowed) {
      logSecurityEvent({
        type: "rate_limit_exceeded",
        ip: clientKey(req),
        endpoint: req.path,
        success: false,
      });
      res.setHeader("Retry-After", String(result.retryAfterSec));
      res.status(429).json({ error: message });
      return;
    }
    next();
  };
}

// Shared limiters (per IP)
export const loginLimiter = createRateLimiter({
  windowMs: 15 * 60_000,
  max: 10,
});
export const registerLimiter = createRateLimiter({
  windowMs: 60 * 60_000,
  max: 5,
});
export const liveScanLimiter = createRateLimiter({ windowMs: 60_000, max: 20 });

// Passwort-Reset / Verifizierung: per IP and per target email (silently dropped, no enumeration)
export const forgotPasswordLimiter = createRateLimiter({
  windowMs: 15 * 60_000,
  max: 5,
});
export const forgotPasswordEmailLimiter = createRateLimiter({
  windowMs: 60 * 60_000,
  max: 3,
});
export const resetPasswordLimiter = createRateLimiter({
  windowMs: 15 * 60_000,
  max: 10,
});
export const verifyEmailLimiter = createRateLimiter({
  windowMs: 15 * 60_000,
  max: 20,
});

/** Counts only failures per key; success clears. Blocking one key never affects others. */
export function createFailureTracker(opts: {
  windowMs: number;
  max: number;
  maxEntries?: number;
  now?: () => number;
}) {
  const now = opts.now ?? Date.now;
  const maxEntries = opts.maxEntries ?? 10_000;
  const fails = new Map<string, { count: number; resetAt: number }>();
  let lastSweep = 0;

  function sweep(t: number) {
    // Opportunistic sweep of expired entries, like createRateLimiter.
    if (t - lastSweep >= opts.windowMs / 2 || fails.size > maxEntries) {
      lastSweep = t;
      for (const [k, v] of fails) if (v.resetAt <= t) fails.delete(k);
    }
    // Still too big (many live keys): drop the oldest inserted entries.
    while (fails.size > maxEntries) {
      const oldest = fails.keys().next().value;
      if (oldest === undefined) break;
      fails.delete(oldest);
    }
  }

  return {
    count(key: string): number {
      const e = fails.get(key);
      return e && e.resetAt > now() ? e.count : 0;
    },
    isBlocked(key: string): { blocked: boolean; retryAfterSec: number } {
      const e = fails.get(key);
      if (!e || e.resetAt <= now()) {
        fails.delete(key);
        return { blocked: false, retryAfterSec: 0 };
      }
      return {
        blocked: e.count >= opts.max,
        retryAfterSec: Math.max(1, Math.ceil((e.resetAt - now()) / 1000)),
      };
    },
    fail(key: string): void {
      const t = now();
      const e = fails.get(key);
      if (!e || e.resetAt <= t) {
        fails.delete(key); // re-insert so insertion order tracks age
        fails.set(key, { count: 1, resetAt: t + opts.windowMs });
      } else e.count += 1;
      sweep(t);
    },
    clear(key: string): void {
      fails.delete(key);
    },
    size: () => fails.size,
  };
}

/** Per account AND client IP: an attacker elsewhere cannot lock the owner out. Hard limit. */
export const accountLoginFailures = createFailureTracker({
  windowMs: 15 * 60_000,
  max: 10,
});

/** Per account over all IPs: slows distributed guessing with a growing delay, never locks. */
export const accountWideFailures = createFailureTracker({
  windowMs: 15 * 60_000,
  max: Number.POSITIVE_INFINITY,
});
export const ACCOUNT_WIDE_THRESHOLD = 50;
export const MAX_LOGIN_DELAY_MS = 10_000;

/** Delay for a login attempt after `fails` account-wide failures (0 below the threshold). */
export function progressiveDelayMs(
  fails: number,
  threshold = ACCOUNT_WIDE_THRESHOLD,
): number {
  if (fails < threshold) return 0;
  return Math.min(MAX_LOGIN_DELAY_MS, (fails - threshold + 1) * 250);
}

/** IPs that logged in successfully for an account: they skip the account-wide delay. */
const knownIps = new Map<string, Set<string>>();
export function rememberIp(account: string, ip: string): void {
  let set = knownIps.get(account);
  if (!set) {
    set = new Set();
    if (knownIps.size >= 10_000) {
      const oldest = knownIps.keys().next().value;
      if (oldest !== undefined) knownIps.delete(oldest);
    }
    knownIps.set(account, set);
  }
  if (set.size >= 20) set.delete(set.values().next().value as string);
  set.add(ip);
}
export function isKnownIp(account: string, ip: string): boolean {
  return knownIps.get(account)?.has(ip) ?? false;
}

export function normalizeAccount(email: string): string {
  return email.trim().toLowerCase().slice(0, 320);
}

export function accountKey(email: string, ip: string): string {
  return `acct:${normalizeAccount(email)}|${ip}`;
}
