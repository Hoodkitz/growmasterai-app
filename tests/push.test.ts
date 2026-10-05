import { describe, expect, it } from "vitest";
import { chunk, isExpoPushToken, sendExpoPush } from "../server/push";

describe("push helpers", () => {
  it("chunks into groups of 100", () => {
    const parts = chunk(Array.from({ length: 250 }, (_, i) => i));
    expect(parts.map(p => p.length)).toEqual([100, 100, 50]);
    expect(chunk([])).toEqual([]);
  });

  it("validates token format", () => {
    expect(isExpoPushToken("ExponentPushToken[abc]")).toBe(true);
    expect(isExpoPushToken("ExpoPushToken[abc]")).toBe(true);
    expect(isExpoPushToken("fcm:xyz")).toBe(false);
  });

  it("sends chunked batches and summarises tickets", async () => {
    const tokens = Array.from({ length: 150 }, (_, i) => `ExponentPushToken[t${i}]`);
    const calls: number[] = [];
    const fakeFetch = (async (_url: string, init: { body: string }) => {
      const msgs = JSON.parse(init.body) as { to: string }[];
      calls.push(msgs.length);
      return {
        ok: true,
        json: async () => ({ data: msgs.map(m => (m.to === "ExponentPushToken[t3]" ? { status: "error", details: { error: "DeviceNotRegistered" } } : { status: "ok" })) }),
      };
    }) as unknown as typeof fetch;
    const s = await sendExpoPush([...tokens, "bad", tokens[0]], { title: "t", body: "b" }, fakeFetch);
    expect(calls).toEqual([100, 50]);
    expect(s).toMatchObject({ attempted: 150, accepted: 149, failed: 1, invalidTokens: ["ExponentPushToken[t3]"] });
  });

  it("counts failures on HTTP error / network error", async () => {
    const t = ["ExponentPushToken[a]", "ExponentPushToken[b]"];
    const s1 = await sendExpoPush(t, { title: "t", body: "b" }, (async () => ({ ok: false })) as unknown as typeof fetch);
    expect(s1.failed).toBe(2);
    const s2 = await sendExpoPush(t, { title: "t", body: "b" }, (async () => { throw new Error("x"); }) as unknown as typeof fetch);
    expect(s2.failed).toBe(2);
  });
});
