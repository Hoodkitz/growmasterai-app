import { describe, expect, it } from "vitest";
import {
  mergeRemedies,
  sanitizeRemedies,
  suggestRemedies,
} from "../shared/remedies";
import { buildRemedyLink } from "../lib/affiliates";

describe("suggestRemedies", () => {
  it("suggests neem oil for spider mites", () => {
    const names = suggestRemedies(
      "Befall mit Spinnmilben an den Blattunterseiten",
    ).map((r) => r.name);
    expect(names).toContain("Neemöl");
  });

  it("suggests cal-mag for calcium deficiency", () => {
    const names = suggestRemedies("Rostflecken durch Calcium-Mangel").map(
      (r) => r.name,
    );
    expect(names).toContain("Cal-Mag Ergänzung");
  });

  it("suggests nothing for a healthy plant", () => {
    expect(
      suggestRemedies("Die Pflanze sieht gesund und kräftig aus."),
    ).toEqual([]);
  });
});

describe("sanitizeRemedies", () => {
  it("drops entries without name or search term and strips control characters", () => {
    const out = sanitizeRemedies([
      { name: "Neemöl\n", searchTerm: "Neemöl bio", purpose: "hilft" },
      { name: "", searchTerm: "x" },
      { name: "ohne Suchbegriff" },
      "kein objekt",
    ]);
    expect(out).toEqual([
      { name: "Neemöl", purpose: "hilft", searchTerm: "Neemöl bio" },
    ]);
  });

  it("returns [] for non-arrays", () => {
    expect(sanitizeRemedies(undefined)).toEqual([]);
    expect(sanitizeRemedies({})).toEqual([]);
  });
});

describe("mergeRemedies", () => {
  it("puts model remedies first, tops up from the catalog and de-duplicates", () => {
    const out = mergeRemedies(
      [{ name: "neemöl", searchTerm: "Neemöl", purpose: "vom Modell" }],
      "Spinnmilben und Schimmel",
    );
    expect(out[0].purpose).toBe("vom Modell");
    expect(out.filter((r) => r.name.toLowerCase() === "neemöl")).toHaveLength(
      1,
    );
    expect(out.length).toBeGreaterThan(1);
  });

  it("caps the list at four", () => {
    const text =
      "Spinnmilben Schimmel Stickstoff Calcium pH-Wert Überdüngung Wurzelfäule";
    expect(mergeRemedies([], text).length).toBe(4);
  });
});

describe("buildRemedyLink", () => {
  it("adds the tag and flags the link as affiliate when configured", () => {
    const { url, isAffiliate } = buildRemedyLink("Neemöl bio", "mein-tag-21");
    const u = new URL(url);
    expect(u.hostname).toBe("www.amazon.de");
    expect(u.searchParams.get("k")).toBe("Neemöl bio");
    expect(u.searchParams.get("tag")).toBe("mein-tag-21");
    expect(isAffiliate).toBe(true);
  });

  it("builds a plain, non-affiliate link without a tag", () => {
    const { url, isAffiliate } = buildRemedyLink("Neemöl", "  ");
    expect(new URL(url).searchParams.has("tag")).toBe(false);
    expect(isAffiliate).toBe(false);
  });

  it("never lets the search term change the host", () => {
    const { url } = buildRemedyLink("https://evil.example/x", "t-21");
    expect(new URL(url).hostname).toBe("www.amazon.de");
  });
});
