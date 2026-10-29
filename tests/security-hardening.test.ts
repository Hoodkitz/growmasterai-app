import { describe, expect, it, vi } from "vitest";
import {
  csrfOriginGuard,
  isOriginAllowed,
  sanitizeUserInput,
  validatePassword,
} from "../server/_core/security";

describe("sanitizeUserInput", () => {
  it("strips brackets, backticks, control chars and truncates", () => {
    expect(sanitizeUserInput("<b>hi</b>\u0000 `x`\n\n  y")).toBe("bhi/b x y");
    expect(sanitizeUserInput("a".repeat(900))).toHaveLength(500);
    expect(sanitizeUserInput("abc", 2)).toBe("ab");
    expect(sanitizeUserInput(undefined)).toBe("");
  });
});

describe("validatePassword", () => {
  it("enforces length, letter+digit and common-password blocklist", () => {
    expect(validatePassword("short1").valid).toBe(false);
    expect(validatePassword("nodigitshere").valid).toBe(false);
    expect(validatePassword("12345678").valid).toBe(false);
    expect(validatePassword("Passwort1").valid).toBe(false);
    expect(validatePassword("x".repeat(201) + "1").valid).toBe(false);
    expect(validatePassword(42).valid).toBe(false);
    expect(validatePassword("gruenes-Blatt7").valid).toBe(true);
  });
});

describe("csrfOriginGuard", () => {
  const rules = ["https://app.example.com", /^http:\/\/localhost:8081$/];
  const run = (method: string, headers: Record<string, string>) => {
    const next = vi.fn();
    const json = vi.fn();
    const res: any = { status: vi.fn(() => ({ json })) };
    csrfOriginGuard(rules)({ method, headers } as any, res, next);
    return { next, status: res.status, json };
  };
  it("allows safe methods, missing Origin and Bearer auth", () => {
    expect(run("GET", { origin: "https://evil.com" }).next).toHaveBeenCalled();
    expect(run("POST", {}).next).toHaveBeenCalled();
    expect(
      run("POST", { origin: "https://evil.com", authorization: "Bearer x" })
        .next,
    ).toHaveBeenCalled();
  });
  it("allows listed and same-host origins, blocks others", () => {
    expect(
      run("POST", { origin: "https://app.example.com" }).next,
    ).toHaveBeenCalled();
    expect(
      run("POST", { origin: "http://localhost:8081" }).next,
    ).toHaveBeenCalled();
    expect(
      run("POST", { origin: "https://api.x.de", host: "api.x.de" }).next,
    ).toHaveBeenCalled();
    const bad = run("POST", { origin: "https://evil.com" });
    expect(bad.next).not.toHaveBeenCalled();
    expect(bad.status).toHaveBeenCalledWith(403);
    expect(isOriginAllowed("not a url", rules, "h")).toBe(false);
  });
});

describe("clientKey and account limiter", () => {
  it("ignores X-Real-IP and uses req.ip", async () => {
    const { clientKey } = await import("../server/_core/rateLimit");
    const req = { ip: "10.0.0.1", headers: { "x-real-ip": "1.2.3.4" } };
    expect(clientKey(req)).toBe("10.0.0.1");
  });

  it("counts only failures, clears on success, and isolates by IP", async () => {
    const { createFailureTracker, accountKey } =
      await import("../server/_core/rateLimit");
    let t = 0;
    const tr = createFailureTracker({ windowMs: 1000, max: 3, now: () => t });
    const victimA = accountKey(" U@x.de ", "1.1.1.1");
    const attackerB = accountKey("u@x.de", "2.2.2.2");
    for (let i = 0; i < 3; i++) tr.fail(attackerB);
    expect(tr.isBlocked(attackerB).blocked).toBe(true);
    expect(tr.isBlocked(attackerB).retryAfterSec).toBeGreaterThanOrEqual(1);
    expect(tr.isBlocked(victimA).blocked).toBe(false); // owner on IP A unaffected
    tr.fail(victimA);
    tr.clear(victimA); // successful login resets
    for (let i = 0; i < 2; i++) tr.fail(victimA);
    expect(tr.isBlocked(victimA).blocked).toBe(false);
    t += 1001;
    expect(tr.isBlocked(attackerB).blocked).toBe(false);
  });
});
