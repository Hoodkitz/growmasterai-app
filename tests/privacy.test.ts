import { describe, expect, it } from "vitest";
import { PRIVACY_SECTIONS } from "../shared/privacy";

const all = JSON.stringify(PRIVACY_SECTIONS);

describe("privacy policy", () => {
  it("names the services the app really uses", () => {
    for (const term of [
      "Gemini",
      "Google",
      "RevenueCat",
      "Sentry",
      "Expo",
      "Railway",
      "Konto löschen",
      "team@growmaster.app",
    ]) {
      expect(all, term).toContain(term);
    }
  });

  it("has unique titles and no empty sections", () => {
    const titles = PRIVACY_SECTIONS.map((s) => s.title);
    expect(new Set(titles).size).toBe(titles.length);
    for (const s of PRIVACY_SECTIONS)
      expect(
        (s.text?.length ?? 0) + (s.bullets?.length ?? 0),
        s.title,
      ).toBeGreaterThan(0);
  });
});
