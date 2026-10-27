import { describe, it, expect } from "vitest";
import {
  PHASE_TIPS,
  TIP_VIDEOS,
  tipsForPhase,
  tipVideoUrl,
  formatTimestamp,
} from "../lib/phase-tips";
import { TUTORIAL_VIDEOS } from "../lib/locations-data";

describe("phase tips", () => {
  it("cite a known, listed video with a timestamp", () => {
    const listed = new Set(TUTORIAL_VIDEOS.map((v) => v.videoId));
    const ids = new Set<string>();
    for (const t of PHASE_TIPS) {
      expect(ids.has(t.id)).toBe(false);
      ids.add(t.id);
      expect(TIP_VIDEOS[t.videoId]).toBeTruthy();
      expect(listed.has(t.videoId)).toBe(true);
      expect(t.start).toBeGreaterThanOrEqual(0);
      expect(t.text.length).toBeGreaterThan(20);
    }
  });

  it("builds timestamp links and filters by phase", () => {
    expect(tipVideoUrl({ videoId: "abc", start: 85 })).toBe(
      "https://www.youtube.com/watch?v=abc&t=85s",
    );
    expect(formatTimestamp(341)).toBe("5:41");
    expect(tipsForPhase("harvest").length).toBeGreaterThan(0);
    expect(
      tipsForPhase("germination").every((t) =>
        t.phases.includes("germination"),
      ),
    ).toBe(true);
  });
});
