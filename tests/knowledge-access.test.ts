import { describe, expect, it } from "vitest";
import {
  FREE_BROWSE_LIMIT,
  browseKnowledge,
  hasPaidKnowledgeAccess,
} from "../server/knowledge/access";
import { KNOWLEDGE } from "../server/knowledge";

const future = new Date(Date.now() + 86_400_000);
const past = new Date(Date.now() - 86_400_000);

describe("hasPaidKnowledgeAccess", () => {
  it("rejects anonymous and free users", () => {
    expect(hasPaidKnowledgeAccess(null)).toBe(false);
    expect(hasPaidKnowledgeAccess({ subscriptionTier: "free" })).toBe(false);
  });

  it("accepts active premium/pro and owner accounts, rejects expired", () => {
    expect(
      hasPaidKnowledgeAccess({
        subscriptionTier: "pro",
        subscriptionExpiresAt: future,
      }),
    ).toBe(true);
    expect(hasPaidKnowledgeAccess({ subscriptionTier: "premium" })).toBe(true);
    expect(
      hasPaidKnowledgeAccess({
        subscriptionTier: "pro",
        subscriptionExpiresAt: past,
      }),
    ).toBe(false);
    expect(hasPaidKnowledgeAccess({ role: "admin" })).toBe(true);
  });
});

describe("browseKnowledge", () => {
  it("limits free users to short teasers without video fields", () => {
    const r = browseKnowledge(KNOWLEDGE, null, "trauermücken");
    expect(r.limited).toBe(true);
    expect(r.entries).toHaveLength(FREE_BROWSE_LIMIT);
    expect(r.total).toBeGreaterThan(FREE_BROWSE_LIMIT);
    for (const e of r.entries) {
      expect(e.videoId).toBeUndefined();
      expect(e.start).toBeUndefined();
      expect(e.text.length).toBeLessThanOrEqual(141);
    }
  });

  it("gives paying users every hit including video info", () => {
    const r = browseKnowledge(
      KNOWLEDGE,
      { subscriptionTier: "pro" },
      "trauermücken",
    );
    expect(r.limited).toBe(false);
    expect(r.entries.length).toBe(r.total);
    expect(r.entries[0].videoId).toBeTruthy();
  });
});
