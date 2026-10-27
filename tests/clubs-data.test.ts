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
