import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  SubscriptionTier,
  TIER_LIMITS,
  TIER_INFO,
  TIER_PRICING,
  canUseDiagnosis,
  canSendMessage,
  canAddPlant,
  canAddJournalEntry,
  getRemainingDiagnoses,
  getRemainingMessages,
} from "../lib/subscription";

describe("Subscription System", () => {
  describe("Tier Limits Configuration", () => {
    it("should have correct limits for free tier", () => {
      const freeLimits = TIER_LIMITS.free;
      expect(freeLimits.diagnosesPerDay).toBe(3);
      expect(freeLimits.coachMessagesPerDay).toBe(5);
      expect(freeLimits.maxPlants).toBe(2);
      expect(freeLimits.maxJournalEntries).toBe(10);
      expect(freeLimits.advancedAnalysis).toBe(false);
      expect(freeLimits.adFree).toBe(false);
    });

    it("should have correct limits for premium tier", () => {
      const premiumLimits = TIER_LIMITS.premium;
      expect(premiumLimits.diagnosesPerDay).toBe(15);
      expect(premiumLimits.coachMessagesPerDay).toBe(50);
      expect(premiumLimits.maxPlants).toBe(10);
      expect(premiumLimits.maxJournalEntries).toBe(100);
      expect(premiumLimits.advancedAnalysis).toBe(true);
      expect(premiumLimits.adFree).toBe(true);
    });

    it("should have unlimited (-1) values for pro tier", () => {
      const proLimits = TIER_LIMITS.pro;
      expect(proLimits.diagnosesPerDay).toBe(-1);
      expect(proLimits.coachMessagesPerDay).toBe(-1);
      expect(proLimits.maxPlants).toBe(-1);
      expect(proLimits.maxJournalEntries).toBe(-1);
      expect(proLimits.prioritySupport).toBe(true);
    });
  });

  describe("Tier Info Configuration", () => {
    it("should have info for all tiers", () => {
      expect(TIER_INFO.free).toBeDefined();
      expect(TIER_INFO.premium).toBeDefined();
      expect(TIER_INFO.pro).toBeDefined();
    });

    it("should have correct names", () => {
      expect(TIER_INFO.free.name).toBe("Free");
      expect(TIER_INFO.premium.name).toBe("Premium");
      expect(TIER_INFO.pro.name).toBe("Pro");
    });

    it("should have features array for each tier", () => {
      expect(Array.isArray(TIER_INFO.free.features)).toBe(true);
      expect(Array.isArray(TIER_INFO.premium.features)).toBe(true);
      expect(Array.isArray(TIER_INFO.pro.features)).toBe(true);
      expect(TIER_INFO.free.features.length).toBeGreaterThan(0);
    });
  });

  describe("Tier Pricing Configuration", () => {
    it("should have pricing for premium tier", () => {
      expect(TIER_PRICING.premium.monthly).toBe(4.99);
      expect(TIER_PRICING.premium.yearly).toBe(39.99);
      expect(TIER_PRICING.premium.savings).toBe(33);
    });

    it("should have pricing for pro tier", () => {
      expect(TIER_PRICING.pro.monthly).toBe(9.99);
      expect(TIER_PRICING.pro.yearly).toBe(79.99);
      expect(TIER_PRICING.pro.savings).toBe(33);
    });

    it("should have yearly monthly equivalent less than monthly price", () => {
      expect(TIER_PRICING.premium.yearlyMonthly).toBeLessThan(TIER_PRICING.premium.monthly);
      expect(TIER_PRICING.pro.yearlyMonthly).toBeLessThan(TIER_PRICING.pro.monthly);
    });
  });

  describe("canUseDiagnosis", () => {
    it("should allow diagnosis when under limit for free tier", () => {
      expect(canUseDiagnosis("free", 0)).toBe(true);
      expect(canUseDiagnosis("free", 1)).toBe(true);
      expect(canUseDiagnosis("free", 2)).toBe(true);
    });

    it("should deny diagnosis when at limit for free tier", () => {
      expect(canUseDiagnosis("free", 3)).toBe(false);
      expect(canUseDiagnosis("free", 5)).toBe(false);
    });

    it("should always allow diagnosis for pro tier", () => {
      expect(canUseDiagnosis("pro", 0)).toBe(true);
      expect(canUseDiagnosis("pro", 100)).toBe(true);
      expect(canUseDiagnosis("pro", 1000)).toBe(true);
    });
  });

  describe("canSendMessage", () => {
    it("should allow messages when under limit for free tier", () => {
      expect(canSendMessage("free", 0)).toBe(true);
      expect(canSendMessage("free", 4)).toBe(true);
    });

    it("should deny messages when at limit for free tier", () => {
      expect(canSendMessage("free", 5)).toBe(false);
      expect(canSendMessage("free", 10)).toBe(false);
    });

    it("should always allow messages for pro tier", () => {
      expect(canSendMessage("pro", 0)).toBe(true);
      expect(canSendMessage("pro", 500)).toBe(true);
    });
  });

  describe("canAddPlant", () => {
    it("should allow adding plants when under limit for free tier", () => {
      expect(canAddPlant("free", 0)).toBe(true);
      expect(canAddPlant("free", 1)).toBe(true);
    });

    it("should deny adding plants when at limit for free tier", () => {
      expect(canAddPlant("free", 2)).toBe(false);
      expect(canAddPlant("free", 5)).toBe(false);
    });

    it("should allow more plants for premium tier", () => {
      expect(canAddPlant("premium", 5)).toBe(true);
      expect(canAddPlant("premium", 9)).toBe(true);
      expect(canAddPlant("premium", 10)).toBe(false);
    });

    it("should always allow plants for pro tier", () => {
      expect(canAddPlant("pro", 100)).toBe(true);
    });
  });

  describe("canAddJournalEntry", () => {
    it("should allow adding entries when under limit", () => {
      expect(canAddJournalEntry("free", 0)).toBe(true);
      expect(canAddJournalEntry("free", 9)).toBe(true);
    });

    it("should deny adding entries when at limit for free tier", () => {
      expect(canAddJournalEntry("free", 10)).toBe(false);
    });

    it("should always allow entries for pro tier", () => {
      expect(canAddJournalEntry("pro", 1000)).toBe(true);
    });
  });

  describe("getRemainingDiagnoses", () => {
    it("should return correct remaining count for free tier", () => {
      expect(getRemainingDiagnoses("free", 0)).toBe(3);
      expect(getRemainingDiagnoses("free", 1)).toBe(2);
      expect(getRemainingDiagnoses("free", 3)).toBe(0);
    });

    it("should return null for unlimited (pro) tier", () => {
      expect(getRemainingDiagnoses("pro", 0)).toBeNull();
      expect(getRemainingDiagnoses("pro", 100)).toBeNull();
    });

    it("should not return negative values", () => {
      expect(getRemainingDiagnoses("free", 10)).toBe(0);
    });
  });

  describe("getRemainingMessages", () => {
    it("should return correct remaining count for free tier", () => {
      expect(getRemainingMessages("free", 0)).toBe(5);
      expect(getRemainingMessages("free", 3)).toBe(2);
      expect(getRemainingMessages("free", 5)).toBe(0);
    });

    it("should return null for unlimited (pro) tier", () => {
      expect(getRemainingMessages("pro", 0)).toBeNull();
    });
  });

  describe("Tier Hierarchy", () => {
    it("should have increasing limits from free to pro", () => {
      // Diagnoses
      expect(TIER_LIMITS.free.diagnosesPerDay).toBeLessThan(TIER_LIMITS.premium.diagnosesPerDay);
      
      // Messages
      expect(TIER_LIMITS.free.coachMessagesPerDay).toBeLessThan(TIER_LIMITS.premium.coachMessagesPerDay);
      
      // Plants
      expect(TIER_LIMITS.free.maxPlants).toBeLessThan(TIER_LIMITS.premium.maxPlants);
    });

    it("should have premium features not available in free", () => {
      expect(TIER_LIMITS.free.advancedAnalysis).toBe(false);
      expect(TIER_LIMITS.premium.advancedAnalysis).toBe(true);
      
      expect(TIER_LIMITS.free.exportData).toBe(false);
      expect(TIER_LIMITS.premium.exportData).toBe(true);
    });

    it("should have pro-exclusive features", () => {
      expect(TIER_LIMITS.free.prioritySupport).toBe(false);
      expect(TIER_LIMITS.premium.prioritySupport).toBe(false);
      expect(TIER_LIMITS.pro.prioritySupport).toBe(true);
    });
  });
});
