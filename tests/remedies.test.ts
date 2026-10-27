import { describe, expect, it } from "vitest";
import {
  mergeRemedies,
  sanitizeRemedies,
  suggestRemedies,
  mergeCoachProducts,
  suggestCoachProducts,
  asinForRemedy,
  catalogRemedyNames,
  productAsinNames,
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

describe("coach products", () => {
  it("suggests matching equipment for coach topics", () => {
    const names = suggestCoachProducts(
      "Wie prüfe ich die Trichome vor der Ernte und wann topfe ich um?",
    ).map((r) => r.name);
    expect(names.some((n) => n.startsWith("Lupe"))).toBe(true);
    expect(names).toContain("Stofftöpfe (Fabric Pots)");
  });

  it("puts model proposals first, de-duplicates and caps at four", () => {
    const merged = mergeCoachProducts(
      [{ name: "pH-Messgerät", purpose: "p", searchTerm: "pH Messgerät" }],
      "Der pH-Wert, die Luftfeuchte, das Gießen, Düngen, Trocknen und der Zelt-Abluft Geruch",
    );
    expect(merged[0].name).toBe("pH-Messgerät");
    expect(merged.length).toBeLessThanOrEqual(4);
    expect(new Set(merged.map((m) => m.name.toLowerCase())).size).toBe(
      merged.length,
    );
  });

  it("returns nothing for unrelated text and ignores invalid model output", () => {
    expect(mergeCoachProducts("kaputt", "Hallo Welt")).toEqual([]);
  });
});

describe("fixed products", () => {
  it("only assigns ASINs to remedies that exist in a catalog", () => {
    const names = new Set(catalogRemedyNames());
    for (const n of productAsinNames()) expect(names.has(n)).toBe(true);
  });

  it("links a chosen product page and keeps search as fallback", () => {
    const asin = asinForRemedy("Präzisions-Pflanzenschere");
    expect(asin).toMatch(/^[A-Z0-9]{10}$/);
    const product = new URL(buildRemedyLink("x", "", asin).url);
    expect(product.pathname).toBe(`/dp/${asin}`);
    expect(product.searchParams.has("k")).toBe(false);
    expect(new URL(buildRemedyLink("Dünger", "", undefined).url).pathname).toBe(
      "/s",
    );
    expect(
      new URL(buildRemedyLink("x", "t-21", "B0DZNSB16W").url).searchParams.get(
        "tag",
      ),
    ).toBe("t-21");
    expect(new URL(buildRemedyLink("x", "", "bad id").url).pathname).toBe("/s");
  });
});
