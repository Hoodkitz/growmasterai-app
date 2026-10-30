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

describe("clientKey and login attempt budget", () => {
  it("ignores X-Real-IP and uses req.ip", async () => {
    const { clientKey } = await import("../server/_core/rateLimit");
    const req = { ip: "10.0.0.1", headers: { "x-real-ip": "1.2.3.4" } };
    expect(clientKey(req)).toBe("10.0.0.1");
  });

  it("limits parallel attempts because they are counted before the password check", async () => {
    const { beginLoginAttempt } = await import("../server/_core/rateLimit");
    const results = Array.from({ length: 50 }, () =>
      beginLoginAttempt("par@x.de", "5.5.5.5"),
    );
    expect(results.filter((r) => r.ok).length).toBe(10);
    const blocked = results.find((r) => !r.ok);
    expect(
      blocked && !blocked.ok && blocked.retryAfterSec,
    ).toBeGreaterThanOrEqual(1);
  });

  it("does not let an attacker on IP B lock out the owner on IP A", async () => {
    const { beginLoginAttempt } = await import("../server/_core/rateLimit");
    for (let i = 0; i < 20; i++) beginLoginAttempt("own@x.de", "2.2.2.2");
    expect(beginLoginAttempt("own@x.de", "1.1.1.1").ok).toBe(true);
  });

  it("stops distributed guessing from unknown IPs but not a known IP, and success resets", async () => {
    const { beginLoginAttempt, rememberIp } =
      await import("../server/_core/rateLimit");
    rememberIp("dist@x.de", "9.9.9.9");
    let okCount = 0;
    for (let i = 0; i < 80; i++) {
      if (beginLoginAttempt("dist@x.de", `7.7.${i}.1`).ok) okCount++;
    }
    expect(okCount).toBe(50);
    expect(beginLoginAttempt("dist@x.de", "9.9.9.9").ok).toBe(true);
    const a = beginLoginAttempt("reset@x.de", "3.3.3.3");
    if (a.ok) a.succeeded();
    for (let i = 0; i < 9; i++) beginLoginAttempt("reset@x.de", "3.3.3.3");
    expect(beginLoginAttempt("reset@x.de", "3.3.3.3").ok).toBe(true);
  });

  it("table overflow keeps other counters and falls back to a per-IP budget", async () => {
    const { createAttemptCounter } = await import("../server/_core/rateLimit");
    const c = createAttemptCounter({ windowMs: 60_000, max: 2, maxEntries: 5 });
    expect(c.acquire("victim", "1.1.1.1").allowed).toBe(true);
    expect(c.acquire("victim", "1.1.1.1").allowed).toBe(true);
    for (let i = 0; i < 100; i++) c.acquire(`flood${i}`, "6.6.6.6");
    expect(c.size()).toBeLessThanOrEqual(5);
    expect(c.acquire("victim", "1.1.1.1").allowed).toBe(false); // not evicted
    expect(c.acquire("new-key", "6.6.6.6").allowed).toBe(false); // flood IP used its own budget
    expect(c.acquire("new-key", "7.7.7.7").allowed).toBe(true); // other IPs unaffected
  });

  it("sweeps expired entries before treating the table as full", async () => {
    const { createAttemptCounter } = await import("../server/_core/rateLimit");
    let t = 0;
    const c = createAttemptCounter({
      windowMs: 1000,
      max: 2,
      maxEntries: 3,
      now: () => t,
    });
    for (let i = 0; i < 3; i++) c.acquire(`k${i}`, "1.1.1.1");
    t += 1500;
    expect(c.acquire("fresh", "1.1.1.1").allowed).toBe(true);
    expect(c.size()).toBe(1);
    expect(c.ipTableSize()).toBe(0);
  });

  it("normalises look-alike emails and groups IPv6 by /64", async () => {
    const { normalizeAccount, ipGroup } =
      await import("../server/_core/rateLimit");
    expect(normalizeAccount(" ＵＳＥＲ@Ｘ.de ")).toBe(
      normalizeAccount("user@x.de"),
    );
    expect(ipGroup("2001:db8:1:2:aaaa:bbbb:cccc:dddd")).toBe(
      ipGroup("2001:DB8:1:2::1"),
    );
    expect(ipGroup("2001:db8:1:3::1")).not.toBe(ipGroup("2001:db8:1:2::1"));
    expect(ipGroup("::ffff:1.2.3.4")).toBe("1.2.3.4");
    expect(ipGroup("1.2.3.4")).toBe("1.2.3.4");
  });
});
