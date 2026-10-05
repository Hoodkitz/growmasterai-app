import { describe, expect, it } from "vitest";
import { buildAppLink, generateToken, hashToken, isTokenUsable } from "../server/authTokens";
import { isMailConfigured } from "../server/_core/mailer";

describe("auth tokens", () => {
  it("generates unique tokens and stores only a hash", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a.token).not.toBe(b.token);
    expect(a.hash).toBe(hashToken(a.token));
    expect(a.hash).toHaveLength(64);
    expect(a.hash).not.toContain(a.token);
  });
  it("rejects used or expired tokens", () => {
    const now = new Date("2026-01-01T12:00:00Z");
    expect(isTokenUsable({ expiresAt: new Date("2026-01-01T13:00:00Z"), usedAt: null }, now)).toBe(true);
    expect(isTokenUsable({ expiresAt: new Date("2026-01-01T11:00:00Z"), usedAt: null }, now)).toBe(false);
    expect(isTokenUsable({ expiresAt: new Date("2026-01-01T13:00:00Z"), usedAt: now }, now)).toBe(false);
  });
  it("builds deep link or web link", () => {
    expect(buildAppLink("reset-password", "a b", undefined)).toBe("growmasterai://reset-password?token=a%20b");
    expect(buildAppLink("verify-email", "t", "https://x.de/")).toBe("https://x.de/verify-email?token=t");
  });
  it("detects SMTP configuration", () => {
    expect(isMailConfigured({})).toBe(false);
    expect(isMailConfigured({ SMTP_HOST: "h", MAIL_FROM: "a@b.de" })).toBe(true);
  });
});
