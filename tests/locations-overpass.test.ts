import { describe, expect, it } from "vitest";
import {
  buildOverpassQuery,
  haversineKm,
  isShopCacheValid,
  parseOverpassShops,
  SHOP_CACHE_TTL_MS,
} from "../lib/locations-data";

// Fixture shaped like a real Overpass `out center tags` response (synthetic values).
const FIXTURE = {
  version: 0.6,
  generator: "Overpass API",
  elements: [
    {
      type: "node", id: 101, lat: 52.521, lon: 13.41,
      tags: { shop: "hydroponics", name: "Hydro Test", "addr:street": "Teststr.", "addr:housenumber": "5", "addr:city": "Berlin", "addr:postcode": "10115", website: "https://example.org", opening_hours: "Mo-Fr 10:00-18:00" },
    },
    {
      type: "way", id: 202, center: { lat: 52.6, lon: 13.5 },
      tags: { shop: "garden_centre", name: "Gartencenter Test", "contact:phone": "+49 30 000" },
    },
    { type: "node", id: 303, lat: 52.52, lon: 13.4, tags: { shop: "cannabis", name: "CBD Laden" } },
    { type: "node", id: 404, lat: 52.5, lon: 13.4, tags: { shop: "hydroponics" } }, // no name
    { type: "node", id: 505, tags: { shop: "hydroponics", name: "No coords" } },
    { type: "node", id: 606, lat: 52.5, lon: 13.4, tags: { shop: "bakery", name: "Bäckerei" } },
    { type: "node", id: 101, lat: 52.521, lon: 13.41, tags: { shop: "hydroponics", name: "Hydro Test" } }, // duplicate
  ],
};

describe("parseOverpassShops", () => {
  const shops = parseOverpassShops(FIXTURE, 52.52, 13.4);

  it("keeps only named, located, relevant shops and dedupes", () => {
    expect(shops.map(s => s.id).sort()).toEqual(["node/101", "node/303", "way/202"]);
  });

  it("sorts by distance and computes it", () => {
    expect(shops[0].id).toBe("node/303");
    expect(shops[0].distance).toBe(0);
    expect(shops[1].id).toBe("node/101");
    expect(shops[2].distance).toBeGreaterThan(shops[1].distance!);
  });

  it("maps tags to type and address fields; uses center for ways", () => {
    const hydro = shops.find(s => s.id === "node/101")!;
    expect(hydro).toMatchObject({ type: "growshop", address: "Teststr. 5", city: "Berlin", postalCode: "10115", website: "https://example.org", openingHours: "Mo-Fr 10:00-18:00" });
    const way = shops.find(s => s.id === "way/202")!;
    expect(way.latitude).toBe(52.6);
    expect(way.phone).toBe("+49 30 000");
    expect(shops.find(s => s.id === "node/303")!.type).toBe("headshop");
  });

  it("handles garbage input without throwing", () => {
    expect(parseOverpassShops(null)).toEqual([]);
    expect(parseOverpassShops({ elements: "x" })).toEqual([]);
    expect(parseOverpassShops({})).toEqual([]);
  });

  it("omits distance without user position", () => {
    expect(parseOverpassShops(FIXTURE).every(s => s.distance === undefined)).toBe(true);
  });
});

describe("overpass helpers", () => {
  it("builds a query containing all tags and the position", () => {
    const q = buildOverpassQuery(52.52, 13.405, 1000);
    for (const t of ["hydroponics", "garden_centre", "cannabis", "headshop"]) expect(q).toContain(`"shop"="${t}"`);
    expect(q).toContain("around:1000,52.52000,13.40500");
    expect(q).toContain("out center");
  });

  it("haversine Berlin-Hamburg is ~255 km", () => {
    const d = haversineKm(52.52, 13.405, 53.5511, 9.9937);
    expect(d).toBeGreaterThan(250);
    expect(d).toBeLessThan(262);
  });

  it("validates cache by age and drift", () => {
    const now = 1_000_000_000_000;
    const cache = { latitude: 52.52, longitude: 13.4, fetchedAt: now - 1000, shops: [] };
    expect(isShopCacheValid(cache, 52.52, 13.4, now)).toBe(true);
    expect(isShopCacheValid(cache, 53.5, 10, now)).toBe(false);
    expect(isShopCacheValid({ ...cache, fetchedAt: now - SHOP_CACHE_TTL_MS - 1 }, 52.52, 13.4, now)).toBe(false);
    expect(isShopCacheValid(null, 52.52, 13.4, now)).toBe(false);
  });
});
