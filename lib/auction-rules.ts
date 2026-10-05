/**
 * Pure validation rules for auction bids and raffle entries (used by tRPC + tests).
 */

export const MIN_BID_INCREMENT = 1; // EUR

export type RuleResult = { ok: true } | { ok: false; code: "BAD_REQUEST" | "FORBIDDEN" | "CONFLICT"; message: string };

export interface AuctionState {
  status: "pending" | "active" | "ended" | "cancelled";
  startsAt: Date;
  endsAt: Date;
  vendorOwnerUserId?: number | null;
  currentPrice: number;
  startPrice: number;
  totalBids: number;
}

/** Smallest acceptable next bid. The first bid may equal the start price. */
export function minimumNextBid(a: Pick<AuctionState, "currentPrice" | "startPrice" | "totalBids">): number {
  if (a.totalBids <= 0) return round2(a.startPrice);
  return round2(a.currentPrice + MIN_BID_INCREMENT);
}

export function validateBid(a: AuctionState, userId: number, amount: number, now = new Date()): RuleResult {
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, code: "BAD_REQUEST", message: "Ungültiger Betrag" };
  if (a.status !== "active") return { ok: false, code: "BAD_REQUEST", message: "Auktion ist nicht aktiv" };
  if (now < a.startsAt) return { ok: false, code: "BAD_REQUEST", message: "Auktion hat noch nicht begonnen" };
  if (now >= a.endsAt) return { ok: false, code: "BAD_REQUEST", message: "Auktion ist beendet" };
  if (a.vendorOwnerUserId != null && a.vendorOwnerUserId === userId) {
    return { ok: false, code: "FORBIDDEN", message: "Auf eigene Auktionen kann nicht geboten werden" };
  }
  const min = minimumNextBid(a);
  if (round2(amount) < min) {
    return { ok: false, code: "BAD_REQUEST", message: `Gebot muss mindestens €${min.toFixed(2)} betragen` };
  }
  return { ok: true };
}

export interface RaffleState {
  status: "pending" | "active" | "ended" | "cancelled";
  startsAt: Date;
  endsAt: Date;
  maxEntries?: number | null;
  totalEntries: number;
  alreadyEntered: boolean;
}

export function validateRaffleEntry(r: RaffleState, now = new Date()): RuleResult {
  if (r.status !== "active") return { ok: false, code: "BAD_REQUEST", message: "Verlosung ist nicht aktiv" };
  if (now < r.startsAt) return { ok: false, code: "BAD_REQUEST", message: "Verlosung hat noch nicht begonnen" };
  if (now >= r.endsAt) return { ok: false, code: "BAD_REQUEST", message: "Verlosung ist beendet" };
  if (r.alreadyEntered) return { ok: false, code: "CONFLICT", message: "Du nimmst bereits teil" };
  if (r.maxEntries != null && r.totalEntries >= r.maxEntries) {
    return { ok: false, code: "BAD_REQUEST", message: "Maximale Teilnehmerzahl erreicht" };
  }
  return { ok: true };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
