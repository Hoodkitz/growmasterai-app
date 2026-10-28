import { describe, expect, it } from "vitest";
import { isStoreMode } from "../lib/store-mode";

describe("isStoreMode", () => {
  it("is on only for 1 or true", () => {
    expect(isStoreMode("1")).toBe(true);
    expect(isStoreMode("true")).toBe(true);
    expect(isStoreMode("TRUE")).toBe(true);
  });

  it("is off when unset or anything else", () => {
    expect(isStoreMode(undefined)).toBe(false);
    expect(isStoreMode("")).toBe(false);
    expect(isStoreMode("0")).toBe(false);
    expect(isStoreMode("false")).toBe(false);
  });
});
