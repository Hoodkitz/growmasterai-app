import { describe, expect, it } from "vitest";
import { getSessionCookieOptions } from "../server/_core/cookies";

function mockReq(overrides: {
  hostname?: string;
  protocol?: string;
  headers?: Record<string, string | string[]>;
}) {
  return {
    hostname: overrides.hostname ?? "localhost",
    protocol: overrides.protocol ?? "http",
    headers: overrides.headers ?? {},
  } as any;
}

describe("getSessionCookieOptions", () => {
  it("returns httpOnly and sameSite none for all requests", () => {
    const opts = getSessionCookieOptions(mockReq({}));
    expect(opts.httpOnly).toBe(true);
    expect(opts.sameSite).toBe("none");
    expect(opts.path).toBe("/");
  });

  it("sets secure=true for https protocol", () => {
    const opts = getSessionCookieOptions(mockReq({ protocol: "https" }));
    expect(opts.secure).toBe(true);
  });

  it("sets secure=false for http protocol", () => {
    const opts = getSessionCookieOptions(mockReq({ protocol: "http" }));
    expect(opts.secure).toBe(false);
  });

  it("detects https via x-forwarded-proto header", () => {
    const opts = getSessionCookieOptions(
      mockReq({
        protocol: "http",
        headers: { "x-forwarded-proto": "https" },
      }),
    );
    expect(opts.secure).toBe(true);
  });

  it("handles multiple forwarded protocols", () => {
    const opts = getSessionCookieOptions(
      mockReq({
        protocol: "http",
        headers: { "x-forwarded-proto": "http, https" },
      }),
    );
    expect(opts.secure).toBe(true);
  });

  it("does not set domain for localhost", () => {
    const opts = getSessionCookieOptions(mockReq({ hostname: "localhost" }));
    expect(opts.domain).toBeUndefined();
  });

  it("does not set domain for 127.0.0.1", () => {
    const opts = getSessionCookieOptions(mockReq({ hostname: "127.0.0.1" }));
    expect(opts.domain).toBeUndefined();
  });

  it("does not set domain for IPv6", () => {
    const opts = getSessionCookieOptions(mockReq({ hostname: "::1" }));
    expect(opts.domain).toBeUndefined();
  });

  it("does not set domain for simple IP addresses", () => {
    const opts = getSessionCookieOptions(mockReq({ hostname: "192.168.1.1" }));
    expect(opts.domain).toBeUndefined();
  });

  it("sets parent domain for subdomains", () => {
    const opts = getSessionCookieOptions(
      mockReq({ hostname: "3000-abc.manuspre.computer" }),
    );
    expect(opts.domain).toBe(".manuspre.computer");
  });

  it("does not set domain for two-part hostnames", () => {
    const opts = getSessionCookieOptions(
      mockReq({ hostname: "manuspre.computer" }),
    );
    expect(opts.domain).toBeUndefined();
  });

  it("handles undefined hostname", () => {
    const opts = getSessionCookieOptions(
      mockReq({ hostname: undefined as any }),
    );
    expect(opts.domain).toBeUndefined();
  });
});
