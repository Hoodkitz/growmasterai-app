import { describe, expect, it } from "vitest";
import { MIN_BID_INCREMENT, minimumNextBid, validateBid, validateRaffleEntry } from "../lib/auction-rules";

const now = new Date("2026-01-10T12:00:00Z");
const base = {
  status: "active" as const,
  startsAt: new Date("2026-01-01T00:00:00Z"),
  endsAt: new Date("2026-01-20T00:00:00Z"),
  vendorOwnerUserId: 99,
  currentPrice: 20,
  startPrice: 10,
  totalBids: 2,
};

describe("validateBid", () => {
  it("accepts current + min increment", () => {
    expect(validateBid(base, 1, 20 + MIN_BID_INCREMENT, now).ok).toBe(true);
  });
  it("rejects lower than current + increment", () => {
    const r = validateBid(base, 1, 20.5, now);
    expect(r.ok).toBe(false);
  });
  it("first bid may equal start price", () => {
    const a = { ...base, totalBids: 0, currentPrice: 10 };
    expect(minimumNextBid(a)).toBe(10);
    expect(validateBid(a, 1, 10, now).ok).toBe(true);
    expect(validateBid(a, 1, 9.99, now).ok).toBe(false);
  });
  it("rejects own auction", () => {
    const r = validateBid(base, 99, 50, now);
    expect(r).toMatchObject({ ok: false, code: "FORBIDDEN" });
  });
  it("rejects ended / inactive / not started", () => {
    expect(validateBid(base, 1, 50, new Date("2026-01-21T00:00:00Z")).ok).toBe(false);
    expect(validateBid({ ...base, status: "ended" }, 1, 50, now).ok).toBe(false);
    expect(validateBid(base, 1, 50, new Date("2025-12-31T00:00:00Z")).ok).toBe(false);
  });
  it("rejects invalid amounts", () => {
    expect(validateBid(base, 1, NaN, now).ok).toBe(false);
    expect(validateBid(base, 1, -5, now).ok).toBe(false);
  });
});

describe("validateRaffleEntry", () => {
  const raffle = { status: "active" as const, startsAt: base.startsAt, endsAt: base.endsAt, maxEntries: 2, totalEntries: 1, alreadyEntered: false };
  it("accepts a fresh entry", () => expect(validateRaffleEntry(raffle, now).ok).toBe(true));
  it("rejects duplicates", () => expect(validateRaffleEntry({ ...raffle, alreadyEntered: true }, now)).toMatchObject({ ok: false, code: "CONFLICT" }));
  it("rejects ended", () => expect(validateRaffleEntry(raffle, new Date("2026-02-01T00:00:00Z")).ok).toBe(false));
  it("rejects when full", () => expect(validateRaffleEntry({ ...raffle, totalEntries: 2 }, now).ok).toBe(false));
  it("rejects inactive", () => expect(validateRaffleEntry({ ...raffle, status: "cancelled" }, now).ok).toBe(false));
});
