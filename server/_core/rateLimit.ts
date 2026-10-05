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

export function createRateLimiter(opts: { windowMs: number; max: number; now?: () => number }): RateLimiter {
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
        return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - t) / 1000)) };
      }
      return { allowed: true, retryAfterSec: 0 };
    },
    reset() {
      hits.clear();
    },
  };
}

export function clientKey(req: { ip?: string; socket?: { remoteAddress?: string } }): string {
  return req.ip || req.socket?.remoteAddress || "unknown";
}

/** Express middleware factory. */
export function rateLimitMiddleware(limiter: RateLimiter, message = "Zu viele Anfragen. Bitte später erneut versuchen.") {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = limiter.check(clientKey(req));
    if (!result.allowed) {
      res.setHeader("Retry-After", String(result.retryAfterSec));
      res.status(429).json({ error: message });
      return;
    }
    next();
  };
}

// Shared limiters (per IP)
export const loginLimiter = createRateLimiter({ windowMs: 15 * 60_000, max: 10 });
export const registerLimiter = createRateLimiter({ windowMs: 60 * 60_000, max: 5 });
export const liveScanLimiter = createRateLimiter({ windowMs: 60_000, max: 20 });

// Passwort-Reset / Verifizierung: per IP and per target email (silently dropped, no enumeration)
export const forgotPasswordLimiter = createRateLimiter({ windowMs: 15 * 60_000, max: 5 });
export const forgotPasswordEmailLimiter = createRateLimiter({ windowMs: 60 * 60_000, max: 3 });
export const resetPasswordLimiter = createRateLimiter({ windowMs: 15 * 60_000, max: 10 });
export const verifyEmailLimiter = createRateLimiter({ windowMs: 15 * 60_000, max: 20 });
