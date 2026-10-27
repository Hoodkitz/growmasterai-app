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
