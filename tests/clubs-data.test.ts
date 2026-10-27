import { describe, it, expect } from "vitest";
import { safeClubUrl, sortedClubs } from "../lib/clubs-data";

describe("clubs-data", () => {
  it("allows only http(s) urls", () => {
    expect(safeClubUrl("https://example.org")).toBe("https://example.org");
    expect(safeClubUrl("javascript:alert(1)")).toBeUndefined();
    expect(safeClubUrl(undefined)).toBeUndefined();
  });

  it("sorts by city, then name", () => {
    const sorted = sortedClubs([
      { name: "B", city: "Köln" },
      { name: "A", city: "Berlin" },
      { name: "A", city: "Köln" },
    ]);
    expect(sorted.map((c) => `${c.city}/${c.name}`)).toEqual([
      "Berlin/A",
      "Köln/A",
      "Köln/B",
    ]);
  });
});

describe("clubSearchUrl", () => {
  it("builds an encoded https search link per Land", async () => {
    const { clubSearchUrl, BUNDESLAENDER } = await import("../lib/clubs-data");
    expect(BUNDESLAENDER).toHaveLength(16);
    const url = clubSearchUrl("Thüringen");
    expect(url.startsWith("https://www.google.com/search?q=")).toBe(true);
    expect(url).toContain(encodeURIComponent("Thüringen"));
  });
});
