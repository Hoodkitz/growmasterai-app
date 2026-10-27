import { describe, it, expect } from "vitest";
import { TUTORIAL_VIDEOS, getTutorialUrl } from "../lib/locations-data";
import { strainSearchUrl } from "../lib/strains-data";

describe("tutorial videos", () => {
  it("uses unique, well-formed YouTube ids and real channel names", () => {
    const ids = TUTORIAL_VIDEOS.map((v) => v.videoId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const v of TUTORIAL_VIDEOS) {
      expect(v.videoId).toMatch(/^[\w-]{11}$/);
      expect(v.channel.length).toBeGreaterThan(0);
      expect(getTutorialUrl(v)).toBe(
        `https://www.youtube.com/watch?v=${v.videoId}`,
      );
    }
    expect(TUTORIAL_VIDEOS.some((v) => v.channel === "Vince and Weed")).toBe(
      true,
    );
  });
});

describe("strainSearchUrl", () => {
  it("builds an encoded search link", () => {
    expect(
      strainSearchUrl({ name: "Northern Lights", breeder: "Sensi Seeds" }),
    ).toBe(
      "https://www.google.com/search?q=Northern%20Lights%20Sensi%20Seeds%20Samen",
    );
  });
});
