import { describe, expect, it } from "vitest";
import { createRateLimiter } from "../server/_core/rateLimit";
import { computeStreak } from "../server/streak";
import { summarizeOutreach } from "../lib/vendor-outreach";
import { hashPassword, verifyPasswordHash } from "../server/db";

describe("rate limiter", () => {
  it("blocks after max hits and recovers after the window", () => {
    let t = 1000;
    const rl = createRateLimiter({ windowMs: 1000, max: 2, now: () => t });
    expect(rl.check("a").allowed).toBe(true);
    expect(rl.check("a").allowed).toBe(true);
    const blocked = rl.check("a");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThanOrEqual(1);
    expect(rl.check("b").allowed).toBe(true); // separate key
    t += 1001;
    expect(rl.check("a").allowed).toBe(true);
  });
});

describe("computeStreak", () => {
  const now = new Date(2026, 9, 5, 12);
  it("keeps state on same day", () => {
    const r = computeStreak({ streak: 3, longestStreak: 0, lastActiveAt: new Date(2026, 9, 5, 1), now });
    expect(r).toEqual({ unchanged: true, streak: 3, longestStreak: 3 });
  });
  it("increments on consecutive day and raises longest", () => {
    const r = computeStreak({ streak: 4, longestStreak: 4, lastActiveAt: new Date(2026, 9, 4, 20), now });
    expect(r).toEqual({ unchanged: false, streak: 5, longestStreak: 5 });
  });
  it("resets streak but keeps longest after a gap", () => {
    const r = computeStreak({ streak: 7, longestStreak: 9, lastActiveAt: new Date(2026, 9, 1), now });
    expect(r).toEqual({ unchanged: false, streak: 1, longestStreak: 9 });
  });
});

describe("summarizeOutreach", () => {
  it("aggregates counts and conversion rate", () => {
    const s = summarizeOutreach([{ status: "sent", n: 3 }, { status: "converted", n: 1 }]);
    expect(s.total).toBe(4);
    expect(s.conversionRate).toBe(25);
    expect(s.byStatus.pending).toBe(0);
  });
});

describe("password hashing", () => {
  it("verifies correct and rejects wrong passwords", () => {
    const h = hashPassword("hunter2hunter2");
    expect(verifyPasswordHash("hunter2hunter2", h)).toBe(true);
    expect(verifyPasswordHash("nope", h)).toBe(false);
  });
});
