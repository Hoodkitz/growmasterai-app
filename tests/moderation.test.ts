import { describe, expect, it } from "vitest";
import {
  AUTO_HIDE_REPORTS,
  hiddenUserIds,
  shouldAutoHide,
} from "../server/moderation";

describe("moderation rules", () => {
  it("hides a post only from the threshold of distinct reports", () => {
    expect(shouldAutoHide(AUTO_HIDE_REPORTS - 1)).toBe(false);
    expect(shouldAutoHide(AUTO_HIDE_REPORTS)).toBe(true);
  });

  it("hides blocked users in both directions and ignores unrelated blocks", () => {
    const hidden = hiddenUserIds(1, [
      { blockerId: 1, blockedId: 2 },
      { blockerId: 3, blockedId: 1 },
      { blockerId: 4, blockedId: 5 },
    ]);
    expect([...hidden].sort()).toEqual([2, 3]);
  });
});
