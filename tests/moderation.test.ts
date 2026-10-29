import { describe, expect, it } from "vitest";
import {
  AUTO_HIDE_REPORTS,
  hiddenUserIds,
  shouldAutoHide,
  MIN_REPORTER_AGE_MS,
  dismissRestoresPost,
  reporterCutoff,
  MAX_POST_IMAGES,
  MAX_POST_IMAGE_CHARS,
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

describe("report abuse protection", () => {
  it("counts only reporters older than the minimum account age", () => {
    const now = 10_000_000_000;
    expect(reporterCutoff(now).getTime()).toBe(now - MIN_REPORTER_AGE_MS);
  });

  it("dismiss restores auto-hidden posts but not admin-removed ones", () => {
    expect(dismissRestoresPost("auto")).toBe(true);
    expect(dismissRestoresPost("admin")).toBe(false);
    expect(dismissRestoresPost(null)).toBe(false);
  });
});

describe("post image limits", () => {
  it("keeps total stored image data under the 15 MB request body cap", () => {
    expect(MAX_POST_IMAGES * MAX_POST_IMAGE_CHARS).toBeLessThan(
      15 * 1024 * 1024,
    );
  });
});
