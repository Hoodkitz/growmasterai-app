import { describe, expect, it } from "vitest";
import { setUserTierInput } from "../server/admin-tier";

describe("setUserTierInput", () => {
  it("normalizes the email and allows an unlimited tier", () => {
    const r = setUserTierInput.parse({
      email: "  Foo@Example.COM ",
      tier: "pro",
    });
    expect(r).toEqual({ email: "foo@example.com", tier: "pro" });
  });

  it("rejects unknown tiers and invalid emails", () => {
    expect(() =>
      setUserTierInput.parse({ email: "a@b.de", tier: "admin" }),
    ).toThrow();
    expect(() =>
      setUserTierInput.parse({ email: "nope", tier: "pro" }),
    ).toThrow();
  });

  it("rejects an expiry in the past", () => {
    expect(() =>
      setUserTierInput.parse({
        email: "a@b.de",
        tier: "pro",
        expiresAt: "2020-01-01T00:00:00.000Z",
      }),
    ).toThrow();
  });

  it("accepts a future expiry", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(
      setUserTierInput.parse({
        email: "a@b.de",
        tier: "premium",
        expiresAt: future,
      }).expiresAt,
    ).toBe(future);
  });
});
