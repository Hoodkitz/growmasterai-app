import { describe, it, expect } from "vitest";
import {
  getMoonPhase,
  calculateVPD,
  calculateNutrients,
  getLightSchedule,
  estimateYield,
  calculateWatering,
} from "../lib/grow-tools";
import { STRAINS_DATABASE } from "../lib/strains-data";
import { NEWS_ARTICLES, FAQ_DATA } from "../lib/news-data";
import { MOCK_SHOPS, MOCK_NEARBY_MEMBERS } from "../lib/locations-data";

describe("Grow Tools", () => {
  describe("getMoonPhase", () => {
    it("should return a valid moon phase object", () => {
      const phase = getMoonPhase();
      expect(phase).toHaveProperty("name");
      expect(phase).toHaveProperty("emoji");
      expect(phase).toHaveProperty("description");
      expect(phase).toHaveProperty("growTip");
      expect(phase).toHaveProperty("percentage");
      expect(phase.percentage).toBeGreaterThanOrEqual(0);
      expect(phase.percentage).toBeLessThanOrEqual(100);
    });

    it("should return consistent results for the same date", () => {
      const date = new Date("2026-01-15");
      const phase1 = getMoonPhase(date);
      const phase2 = getMoonPhase(date);
      expect(phase1.name).toBe(phase2.name);
    });
  });

  describe("calculateVPD", () => {
    it("should calculate VPD correctly for optimal conditions", () => {
      const result = calculateVPD(25, 60);
      expect(result.vpd).toBeGreaterThan(0);
      expect(result.vpd).toBeLessThan(3);
      expect(["low", "optimal", "high"]).toContain(result.status);
      expect(result.recommendation).toBeTruthy();
    });

    it("should detect low VPD with high humidity", () => {
      const result = calculateVPD(20, 90);
      expect(result.status).toBe("low");
    });

    it("should detect high VPD with low humidity", () => {
      const result = calculateVPD(35, 20);
      expect(result.status).toBe("high");
    });
  });

  describe("calculateNutrients", () => {
    it("should calculate nutrients for seedling phase", () => {
      const nutrients = calculateNutrients("seedling", 10, 100);
      expect(nutrients.nitrogen).toBeGreaterThan(0);
      expect(nutrients.ec).toBeLessThan(1);
    });

    it("should calculate higher N for vegetative phase", () => {
      const veg = calculateNutrients("vegetative", 10, 100);
      const flower = calculateNutrients("flowering", 10, 100);
      expect(veg.nitrogen).toBeGreaterThan(flower.nitrogen);
    });

    it("should scale with water amount", () => {
      const small = calculateNutrients("vegetative", 5, 100);
      const large = calculateNutrients("vegetative", 10, 100);
      expect(large.nitrogen).toBeGreaterThan(small.nitrogen);
    });

    it("should scale with strength percentage", () => {
      const full = calculateNutrients("vegetative", 10, 100);
      const half = calculateNutrients("vegetative", 10, 50);
      expect(full.nitrogen).toBeGreaterThan(half.nitrogen);
    });
  });

  describe("getLightSchedule", () => {
    it("should return 18/6 for vegetative phase", () => {
      const schedule = getLightSchedule("vegetative");
      expect(schedule.lightHours).toBe(18);
      expect(schedule.darkHours).toBe(6);
    });

    it("should return 12/12 for flowering phase", () => {
      const schedule = getLightSchedule("flowering");
      expect(schedule.lightHours).toBe(12);
      expect(schedule.darkHours).toBe(12);
    });

    it("should return 20/4 for autoflower", () => {
      const schedule = getLightSchedule("autoflower");
      expect(schedule.lightHours).toBe(20);
      expect(schedule.darkHours).toBe(4);
    });

    it("should calculate DLI correctly", () => {
      const schedule = getLightSchedule("vegetative", 400);
      expect(schedule.dli).toBeGreaterThan(0);
    });
  });

  describe("estimateYield", () => {
    it("should estimate yield based on light wattage", () => {
      const estimate = estimateYield(400, 4, "intermediate", "soil");
      expect(estimate.minGrams).toBeGreaterThan(0);
      expect(estimate.maxGrams).toBeGreaterThan(estimate.minGrams);
      expect(estimate.avgGrams).toBe(Math.round((estimate.minGrams + estimate.maxGrams) / 2));
    });

    it("should give higher yields for experts", () => {
      const beginner = estimateYield(400, 4, "beginner", "soil");
      const expert = estimateYield(400, 4, "expert", "soil");
      expect(expert.avgGrams).toBeGreaterThan(beginner.avgGrams);
    });

    it("should give higher yields for hydro", () => {
      const soil = estimateYield(400, 4, "intermediate", "soil");
      const hydro = estimateYield(400, 4, "intermediate", "hydro");
      expect(hydro.avgGrams).toBeGreaterThan(soil.avgGrams);
    });
  });

  describe("calculateWatering", () => {
    it("should calculate watering schedule", () => {
      const schedule = calculateWatering(11, "vegetative", 24, 55);
      expect(schedule.amountMl).toBeGreaterThan(0);
      expect(schedule.frequencyDays).toBeGreaterThan(0);
      expect(schedule.tips.length).toBeGreaterThan(0);
    });

    it("should water less frequently for seedlings", () => {
      const seedling = calculateWatering(11, "seedling", 24, 55);
      const veg = calculateWatering(11, "vegetative", 24, 55);
      expect(seedling.frequencyDays).toBeGreaterThanOrEqual(veg.frequencyDays);
    });
  });
});

describe("Strains Database", () => {
  it("should have strains data", () => {
    expect(STRAINS_DATABASE.length).toBeGreaterThan(0);
  });

  it("should have required fields for each strain", () => {
    STRAINS_DATABASE.forEach((strain: any) => {
      expect(strain.id).toBeTruthy();
      expect(strain.name).toBeTruthy();
      expect(strain.type).toBeTruthy();
      expect(["indica", "sativa", "hybrid"]).toContain(strain.type);
      expect(strain.difficulty).toBeTruthy();
    });
  });

  it("should have affiliate links for strains", () => {
    const strainsWithLinks = STRAINS_DATABASE.filter((s: any) => s.affiliateLinks && s.affiliateLinks.length > 0);
    expect(strainsWithLinks.length).toBeGreaterThan(0);
  });
});

describe("News Data", () => {
  it("should have news articles", () => {
    expect(NEWS_ARTICLES.length).toBeGreaterThan(0);
  });

  it("should have required fields for each article", () => {
    NEWS_ARTICLES.forEach((article: any) => {
      expect(article.id).toBeTruthy();
      expect(article.title).toBeTruthy();
      expect(article.category).toBeTruthy();
    });
  });

  it("should have legal FAQ items", () => {
    expect(FAQ_DATA.length).toBeGreaterThan(0);
    FAQ_DATA.forEach((faq: any) => {
      expect(faq.question).toBeTruthy();
      expect(faq.answer).toBeTruthy();
    });
  });
});

describe("Locations Data", () => {
  it("should have shops data", () => {
    expect(MOCK_SHOPS.length).toBeGreaterThan(0);
  });

  it("should have required fields for each shop", () => {
    MOCK_SHOPS.forEach((shop: any) => {
      expect(shop.id).toBeTruthy();
      expect(shop.name).toBeTruthy();
      expect(shop.type).toBeTruthy();
      expect(shop.latitude).toBeTruthy();
      expect(shop.longitude).toBeTruthy();
    });
  });

  it("should have growers nearby data", () => {
    expect(MOCK_NEARBY_MEMBERS.length).toBeGreaterThan(0);
  });
});
