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

/** IPv6 addresses are grouped by /64 (one subscriber owns a whole /64); IPv4 stays as is. */
export function ipGroup(ip: string): string {
  if (!ip.includes(":")) return ip;
  const v4tail = ip.match(/^(?:::ffff:)(\d+\.\d+\.\d+\.\d+)$/i);
  if (v4tail) return v4tail[1];
  const [head, tail = ""] = ip.split("::");
  const h = head ? head.split(":") : [];
  const t = tail ? tail.split(":") : [];
  const full = ip.includes("::")
    ? [...h, ...Array(Math.max(0, 8 - h.length - t.length)).fill("0"), ...t]
    : h;
  return `${full
    .slice(0, 4)
    .map((g) => g.toLowerCase().replace(/^0+(?=.)/, ""))
    .join(":")}::/64`;
}

/**
 * Attempt counter with pre-counting: `acquire` counts an attempt BEFORE the (async) password check,
 * so parallel attempts are counted too; `release` takes it back on success. No sleeping and no
 * eviction of live entries. When the table is full of live keys, a new key is counted per client IP
 * (/64 for IPv6) in a second bounded table instead, so one flood IP cannot affect others.
 */
export function createAttemptCounter(opts: {
  windowMs: number;
  max: number;
  maxEntries?: number;
  now?: () => number;
}) {
  const now = opts.now ?? Date.now;
  const maxEntries = opts.maxEntries ?? 10_000;
  type Entry = { count: number; resetAt: number };
  const main = new Map<string, Entry>();
  const perIp = new Map<string, Entry>();

  function sweep(table: Map<string, Entry>, t: number) {
    for (const [k, v] of table) if (v.resetAt <= t) table.delete(k);
  }

  function get(
    table: Map<string, Entry>,
    key: string,
    t: number,
  ): Entry | null {
    let e = table.get(key);
    if (e && e.resetAt <= t) {
      table.delete(key);
      e = undefined;
    }
    if (e) return e;
    if (table.size >= maxEntries) {
      sweep(table, t);
      if (table.size >= maxEntries) return null;
    }
    e = { count: 0, resetAt: t + opts.windowMs };
    table.set(key, e);
    return e;
  }

  return {
    /** Counts the attempt if allowed; synchronous, so no await can interleave. */
    acquire(
      key: string,
      ip: string,
    ): { allowed: boolean; retryAfterSec: number } {
      const t = now();
      const e = get(main, key, t) ?? get(perIp, ipGroup(ip), t);
      // Both tables full of live entries: refuse (fail closed).
      if (!e)
        return {
          allowed: false,
          retryAfterSec: Math.ceil(opts.windowMs / 1000),
        };
      const retryAfterSec = Math.max(1, Math.ceil((e.resetAt - t) / 1000));
      if (e.count >= opts.max) return { allowed: false, retryAfterSec };
      e.count += 1;
      return { allowed: true, retryAfterSec };
    },
    release(key: string, ip: string): void {
      const e = main.get(key) ?? perIp.get(ipGroup(ip));
      if (e && e.count > 0) e.count -= 1;
    },
    clear(key: string): void {
      main.delete(key);
    },
    size: () => main.size,
    ipTableSize: () => perIp.size,
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

/** NFKC + lowercase + trim: look-alike spellings of one mailbox share one counter. */
export function normalizeAccount(email: string): string {
  return email.normalize("NFKC").trim().toLowerCase().slice(0, 320);
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
  const p = loginByAccountIp.acquire(pair, ip);
  if (!p.allowed) return { ok: false, retryAfterSec: p.retryAfterSec };
  const w = loginByAccount.acquire(account, ip);
  if (!w.allowed && !known) {
    loginByAccountIp.release(pair, ip);
    return { ok: false, retryAfterSec: w.retryAfterSec };
  }
  return {
    ok: true,
    succeeded: () => {
      loginByAccountIp.clear(pair);
      if (w.allowed) loginByAccount.release(account, ip);
      rememberIp(account, ip);
    },
  };
}
