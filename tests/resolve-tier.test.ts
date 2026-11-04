import { describe, it, expect } from "vitest";
import { resolveTier } from "../lib/subscription";

describe("resolveTier (Server-Stufe aus dem Admin-Panel)", () => {
  const now = new Date("2026-11-04T10:00:00Z");

  it("nimmt die Server-Stufe, wenn lokal free ist", () => {
    expect(resolveTier("free", { tier: "pro" }, now)).toBe("pro");
    expect(resolveTier("free", { tier: "premium" }, now)).toBe("premium");
  });

  it("behält die höhere lokale Stufe", () => {
    expect(resolveTier("pro", { tier: "premium" }, now)).toBe("pro");
  });

  it("ignoriert abgelaufene Server-Stufen", () => {
    expect(
      resolveTier(
        "free",
        { tier: "pro", expiresAt: "2026-11-01T00:00:00Z" },
        now,
      ),
    ).toBe("free");
  });

  it("zählt noch gültige befristete Stufen", () => {
    expect(
      resolveTier(
        "free",
        { tier: "pro", expiresAt: "2026-12-01T00:00:00Z" },
        now,
      ),
    ).toBe("pro");
  });

  it("ignoriert free/unbekannt/fehlend auf dem Server", () => {
    expect(resolveTier("premium", { tier: "free" }, now)).toBe("premium");
    expect(resolveTier("free", { tier: "gold" }, now)).toBe("free");
    expect(resolveTier("free", undefined, now)).toBe("free");
    expect(resolveTier("free", null, now)).toBe("free");
  });
});
