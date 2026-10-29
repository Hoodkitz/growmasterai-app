import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AGE_CONFIRMED_KEY,
  confirmAge,
  hasConfirmedAge,
} from "../lib/age-gate";

const store: Record<string, string> = {};
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn((k: string) => Promise.resolve(store[k] ?? null)),
    setItem: vi.fn((k: string, v: string) => {
      store[k] = v;
      return Promise.resolve();
    }),
  },
}));

describe("age gate", () => {
  beforeEach(() => {
    for (const k of Object.keys(store)) delete store[k];
  });

  it("is locked until confirmed", async () => {
    expect(await hasConfirmedAge()).toBe(false);
  });

  it("stays confirmed after confirmAge", async () => {
    await confirmAge();
    expect(store[AGE_CONFIRMED_KEY]).toBe("true");
    expect(await hasConfirmedAge()).toBe(true);
  });
});
