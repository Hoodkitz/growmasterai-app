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

/**
 * Attempt counter with pre-counting: `acquire` counts an attempt BEFORE the (async) password check,
 * so parallel attempts are counted too; `release` takes it back on success. No sleeping, no
 * eviction of live entries: when the table is full of live keys, new keys share one overflow
 * counter (fail closed) instead of pushing out other accounts' counters.
 */
export function createAttemptCounter(opts: {
  windowMs: number;
  max: number;
  maxEntries?: number;
  now?: () => number;
}) {
  const now = opts.now ?? Date.now;
  const maxEntries = opts.maxEntries ?? 10_000;
  const OVERFLOW = "\u0000overflow";
  const table = new Map<string, { count: number; resetAt: number }>();

  function sweep(t: number) {
    for (const [k, v] of table) if (v.resetAt <= t) table.delete(k);
  }

  function entry(key: string, t: number) {
    let e = table.get(key);
    if (e && e.resetAt <= t) {
      table.delete(key);
      e = undefined;
    }
    if (!e) {
      if (table.size >= maxEntries) {
        sweep(t);
        if (table.size >= maxEntries && key !== OVERFLOW)
          return entry(OVERFLOW, t);
      }
      e = { count: 0, resetAt: t + opts.windowMs };
      table.set(key, e);
    }
    return e;
  }

  return {
    /** Counts the attempt if allowed; synchronous, so no await can interleave. */
    acquire(key: string): { allowed: boolean; retryAfterSec: number } {
      const t = now();
      const e = entry(key, t);
      const retryAfterSec = Math.max(1, Math.ceil((e.resetAt - t) / 1000));
      if (e.count >= opts.max) return { allowed: false, retryAfterSec };
      e.count += 1;
      return { allowed: true, retryAfterSec };
    },
    release(key: string): void {
      const e = table.get(key) ?? table.get(OVERFLOW);
      if (e && e.count > 0) e.count -= 1;
    },
    clear(key: string): void {
      table.delete(key);
    },
    size: () => table.size,
  };
}

/** Failed-login budget per account AND client IP (strict): others cannot lock the owner out. */
export const loginByAccountIp = createAttemptCounter({
  windowMs: 15 * 60_000,
  max: 10,
});
/** Budget per account over all IPs (looser): stops distributed guessing for unknown IPs. */
export const loginByAccount = createAttemptCounter({
  windowMs: 15 * 60_000,
  max: 50,
});

/** IPs with an earlier successful login for the account; they skip the account-wide budget. */
const knownIps = new Map<string, Set<string>>();
export function rememberIp(account: string, ip: string): void {
  let set = knownIps.get(account);
  if (!set) {
    set = new Set();
    if (knownIps.size >= 10_000) {
      const oldest = knownIps.keys().next().value;
      if (oldest !== undefined) knownIps.delete(oldest); // only a convenience list, not a limit
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

/**
 * Decides a login attempt before the password check. Returns a release function on success
 * (call it after a correct password) or the seconds to wait.
 */
export function beginLoginAttempt(
  email: string,
  ip: string,
): { ok: true; succeeded: () => void } | { ok: false; retryAfterSec: number } {
  const account = normalizeAccount(email);
  const pair = `${account}|${ip}`;
  const known = isKnownIp(account, ip);
  const p = loginByAccountIp.acquire(pair);
  if (!p.allowed) return { ok: false, retryAfterSec: p.retryAfterSec };
  const w = loginByAccount.acquire(account);
  if (!w.allowed && !known) {
    loginByAccountIp.release(pair);
    return { ok: false, retryAfterSec: w.retryAfterSec };
  }
  return {
    ok: true,
    succeeded: () => {
      loginByAccountIp.clear(pair);
      if (w.allowed) loginByAccount.release(account);
      rememberIp(account, ip);
    },
  };
}
