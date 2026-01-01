import { describe, expect, it } from "vitest";

// Import affiliate system
import { 
  AFFILIATE_PARTNERS, 
  generateAffiliateLink, 
  generateStrainAffiliateLink,
  generateEquipmentAffiliateLink,
  RECOMMENDED_PRODUCTS,
  getRecommendedProductsWithLinks
} from "../lib/affiliates";

// Import vendor outreach system
import {
  EMAIL_TEMPLATES,
  POTENTIAL_PARTNERS,
  generateEmail,
  createOutreachCampaign,
  getPartnersByType,
  generateMailtoLink
} from "../lib/vendor-outreach";

describe("Affiliate System", () => {
  describe("AFFILIATE_PARTNERS", () => {
    it("should have all required partner fields", () => {
      expect(AFFILIATE_PARTNERS.length).toBeGreaterThan(0);
      
      AFFILIATE_PARTNERS.forEach(partner => {
        expect(partner.id).toBeDefined();
        expect(partner.name).toBeDefined();
        expect(partner.baseUrl).toBeDefined();
        expect(partner.affiliateParam).toBeDefined();
        expect(partner.affiliateId).toBeDefined();
        expect(partner.category).toBeDefined();
        expect(["seeds", "equipment", "nutrients", "general"]).toContain(partner.category);
      });
    });

    it("should include major seed banks", () => {
      const seedBanks = AFFILIATE_PARTNERS.filter(p => p.category === "seeds");
      expect(seedBanks.length).toBeGreaterThanOrEqual(4);
      
      const partnerIds = seedBanks.map(p => p.id);
      expect(partnerIds).toContain("zamnesia");
      expect(partnerIds).toContain("sensiseeds");
      expect(partnerIds).toContain("rqs");
      expect(partnerIds).toContain("seedsman");
    });
  });

  describe("generateAffiliateLink", () => {
    it("should generate valid affiliate links with UTM parameters", () => {
      const link = generateAffiliateLink("zamnesia", "/seeds");
      
      expect(link).toContain("zamnesia.com");
      expect(link).toContain("utm_source=growmaster");
      expect(link).toContain("utm_medium=app");
      expect(link).toContain("utm_campaign=affiliate");
    });

    it("should return empty string for unknown partner", () => {
      const link = generateAffiliateLink("unknown-partner");
      expect(link).toBe("");
    });

    it("should include custom parameters", () => {
      const link = generateAffiliateLink("amazon", "/s", { k: "grow+light" });
      expect(link).toContain("k=grow%2Blight");
    });
  });

  describe("generateStrainAffiliateLink", () => {
    it("should generate search link for strain", () => {
      const result = generateStrainAffiliateLink("Northern Lights");
      
      expect(result).not.toBeNull();
      expect(result?.url).toContain("Northern");
      expect(result?.partner).toBeDefined();
      expect(result?.partner.category).toBe("seeds");
    });

    it("should use preferred partner when specified", () => {
      const result = generateStrainAffiliateLink("Blue Dream", "sensiseeds");
      
      expect(result).not.toBeNull();
      expect(result?.partner.id).toBe("sensiseeds");
    });
  });

  describe("generateEquipmentAffiliateLink", () => {
    it("should generate equipment affiliate link", () => {
      const result = generateEquipmentAffiliateLink("LED Grow Light");
      
      expect(result).not.toBeNull();
      expect(result?.url).toBeDefined();
      expect(result?.partner).toBeDefined();
    });
  });

  describe("RECOMMENDED_PRODUCTS", () => {
    it("should have products for all grow phases", () => {
      expect(RECOMMENDED_PRODUCTS.seedling).toBeDefined();
      expect(RECOMMENDED_PRODUCTS.vegetative).toBeDefined();
      expect(RECOMMENDED_PRODUCTS.flowering).toBeDefined();
      expect(RECOMMENDED_PRODUCTS.harvest).toBeDefined();
      
      expect(RECOMMENDED_PRODUCTS.seedling.length).toBeGreaterThan(0);
      expect(RECOMMENDED_PRODUCTS.vegetative.length).toBeGreaterThan(0);
      expect(RECOMMENDED_PRODUCTS.flowering.length).toBeGreaterThan(0);
      expect(RECOMMENDED_PRODUCTS.harvest.length).toBeGreaterThan(0);
    });
  });

  describe("getRecommendedProductsWithLinks", () => {
    it("should return products with affiliate links", () => {
      const products = getRecommendedProductsWithLinks("vegetative");
      
      expect(products.length).toBeGreaterThan(0);
      products.forEach(product => {
        expect(product.name).toBeDefined();
        expect(product.description).toBeDefined();
      });
    });
  });
});

describe("Vendor Outreach System", () => {
  describe("EMAIL_TEMPLATES", () => {
    it("should have all required template types", () => {
      const types = EMAIL_TEMPLATES.map(t => t.type);
      
      expect(types).toContain("initial");
      expect(types).toContain("followup");
      expect(types).toContain("advertising");
    });

    it("should have valid template structure", () => {
      EMAIL_TEMPLATES.forEach(template => {
        expect(template.id).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.subject).toBeDefined();
        expect(template.body).toBeDefined();
        expect(template.body.length).toBeGreaterThan(100);
      });
    });
  });

  describe("POTENTIAL_PARTNERS", () => {
    it("should have partners of various types", () => {
      const types = new Set(POTENTIAL_PARTNERS.map(p => p.type));
      
      expect(types.has("seedbank")).toBe(true);
      expect(types.has("growshop")).toBe(true);
      expect(types.has("equipment")).toBe(true);
      expect(types.has("nutrient")).toBe(true);
    });

    it("should have valid email addresses", () => {
      POTENTIAL_PARTNERS.forEach(partner => {
        expect(partner.email).toContain("@");
        expect(partner.companyName).toBeDefined();
      });
    });
  });

  describe("generateEmail", () => {
    it("should replace placeholders in template", () => {
      const template = EMAIL_TEMPLATES[0];
      const vendor = POTENTIAL_PARTNERS[0];
      
      const result = generateEmail(template, vendor, {
        senderName: "Max Mustermann",
        userCount: "15.000+"
      });
      
      expect(result.subject).not.toContain("[IHR_NAME]");
      expect(result.body).toContain("Max Mustermann");
      expect(result.body).toContain("15.000+");
    });
  });

  describe("createOutreachCampaign", () => {
    it("should create campaign for multiple vendors", () => {
      const vendors = POTENTIAL_PARTNERS.slice(0, 3);
      const campaign = createOutreachCampaign(vendors, "seedbank-initial");
      
      expect(campaign.length).toBe(3);
      campaign.forEach(item => {
        expect(item.vendor).toBeDefined();
        expect(item.email.subject).toBeDefined();
        expect(item.email.body).toBeDefined();
      });
    });

    it("should throw error for unknown template", () => {
      expect(() => {
        createOutreachCampaign([], "unknown-template");
      }).toThrow("Template not found");
    });
  });

  describe("getPartnersByType", () => {
    it("should filter partners by type", () => {
      const seedbanks = getPartnersByType("seedbank");
      
      expect(seedbanks.length).toBeGreaterThan(0);
      seedbanks.forEach(partner => {
        expect(partner.type).toBe("seedbank");
      });
    });
  });

  describe("generateMailtoLink", () => {
    it("should generate valid mailto link", () => {
      const link = generateMailtoLink(
        "test@example.com",
        "Test Subject",
        "Test Body"
      );
      
      expect(link).toContain("mailto:test@example.com");
      expect(link).toContain("subject=");
      expect(link).toContain("body=");
    });
  });
});
