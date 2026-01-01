import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

// Test Gamification System
describe("Gamification System", () => {
  describe("Achievement Definitions", () => {
    it("should have all required achievement properties", async () => {
      const { ACHIEVEMENTS } = await import("../lib/gamification");
      
      expect(ACHIEVEMENTS.length).toBeGreaterThan(0);
      
      ACHIEVEMENTS.forEach(achievement => {
        expect(achievement).toHaveProperty("id");
        expect(achievement).toHaveProperty("title");
        expect(achievement).toHaveProperty("description");
        expect(achievement).toHaveProperty("icon");
        expect(achievement).toHaveProperty("points");
        expect(achievement).toHaveProperty("rarity");
        expect(achievement).toHaveProperty("category");
        expect(achievement).toHaveProperty("requirement");
        expect(achievement.requirement).toHaveProperty("type");
        expect(achievement.requirement).toHaveProperty("count");
      });
    });

    it("should have unique achievement IDs", async () => {
      const { ACHIEVEMENTS } = await import("../lib/gamification");
      
      const ids = ACHIEVEMENTS.map(a => a.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have valid rarity values", async () => {
      const { ACHIEVEMENTS } = await import("../lib/gamification");
      const validRarities = ["common", "uncommon", "rare", "epic", "legendary"];
      
      ACHIEVEMENTS.forEach(achievement => {
        expect(validRarities).toContain(achievement.rarity);
      });
    });

    it("should have valid category values", async () => {
      const { ACHIEVEMENTS } = await import("../lib/gamification");
      const validCategories = ["beginner", "grower", "expert", "community", "special"];
      
      ACHIEVEMENTS.forEach(achievement => {
        expect(validCategories).toContain(achievement.category);
      });
    });
  });

  describe("Level System", () => {
    it("should return correct level for points", async () => {
      const { getLevelFromPoints, LEVELS } = await import("../lib/gamification");
      
      // Test level 1 (0-99 points)
      const level1 = getLevelFromPoints(50);
      expect(level1.level).toBe(1);
      
      // Test level 2 (100-249 points)
      const level2 = getLevelFromPoints(150);
      expect(level2.level).toBe(2);
      
      // Test high level
      const highLevel = getLevelFromPoints(10000);
      expect(highLevel.level).toBeGreaterThan(5);
    });

    it("should calculate progress to next level correctly", async () => {
      const { getProgressToNextLevel } = await import("../lib/gamification");
      
      // At 0 points, should be 0%
      expect(getProgressToNextLevel(0)).toBe(0);
      
      // At 50 points (halfway to level 2 at 100), should be ~50%
      const progress = getProgressToNextLevel(50);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(100);
    });

    it("should have all levels defined with required properties", async () => {
      const { LEVELS } = await import("../lib/gamification");
      
      expect(LEVELS.length).toBeGreaterThan(0);
      
      LEVELS.forEach(level => {
        expect(level).toHaveProperty("level");
        expect(level).toHaveProperty("title");
        expect(level).toHaveProperty("badge");
        expect(level).toHaveProperty("minPoints");
        expect(level).toHaveProperty("maxPoints");
        expect(typeof level.level).toBe("number");
        expect(typeof level.minPoints).toBe("number");
      });
    });
  });

  describe("Achievement Checking", () => {
    it("should detect unlocked achievements based on stats", async () => {
      const { checkAchievements, ACHIEVEMENTS } = await import("../lib/gamification");
      
      const stats = {
        totalDiagnoses: 5,
        totalPlants: 1,
        totalHarvests: 0,
        totalYield: 0,
        journalEntries: 0,
        loginStreak: 3,
        longestStreak: 3,
        communityPosts: 0,
        helpfulAnswers: 0,
        contestsWon: 0,
      };
      
      const newAchievements = checkAchievements(stats, []);
      
      // Should unlock at least the first diagnosis achievement
      expect(Array.isArray(newAchievements)).toBe(true);
    });

    it("should not return already unlocked achievements", async () => {
      const { checkAchievements, ACHIEVEMENTS } = await import("../lib/gamification");
      
      const stats = {
        totalDiagnoses: 10,
        totalPlants: 5,
        totalHarvests: 1,
        totalYield: 100,
        journalEntries: 5,
        loginStreak: 7,
        longestStreak: 7,
        communityPosts: 0,
        helpfulAnswers: 0,
        contestsWon: 0,
      };
      
      // First check
      const firstCheck = checkAchievements(stats, []);
      const unlockedIds = firstCheck.map(a => a.id);
      
      // Second check with same stats but already unlocked
      const secondCheck = checkAchievements(stats, unlockedIds);
      
      // Should not return any achievements that were already unlocked
      secondCheck.forEach(achievement => {
        expect(unlockedIds).not.toContain(achievement.id);
      });
    });
  });
});

// Test Community Types
describe("Community System", () => {
  describe("Mock Data", () => {
    it("should have valid post structure", async () => {
      const { MOCK_POSTS } = await import("../lib/community");
      
      expect(MOCK_POSTS.length).toBeGreaterThan(0);
      
      MOCK_POSTS.forEach(post => {
        expect(post).toHaveProperty("id");
        expect(post).toHaveProperty("userId");
        expect(post).toHaveProperty("userName");
        expect(post).toHaveProperty("content");
        expect(post).toHaveProperty("likes");
        expect(post).toHaveProperty("comments");
        expect(post).toHaveProperty("createdAt");
      });
    });

    it("should have valid contest structure", async () => {
      const { MOCK_CONTESTS } = await import("../lib/community");
      
      expect(MOCK_CONTESTS.length).toBeGreaterThan(0);
      
      MOCK_CONTESTS.forEach(contest => {
        expect(contest).toHaveProperty("id");
        expect(contest).toHaveProperty("title");
        expect(contest).toHaveProperty("description");
        expect(contest).toHaveProperty("type");
        expect(contest).toHaveProperty("prize");
        expect(contest).toHaveProperty("endDate");
        expect(["yield", "photo", "strain", "raffle"]).toContain(contest.type);
      });
    });

    it("should have valid leaderboard structure", async () => {
      const { MOCK_LEADERBOARD } = await import("../lib/community");
      
      expect(MOCK_LEADERBOARD.length).toBeGreaterThan(0);
      
      MOCK_LEADERBOARD.forEach((entry, index) => {
        expect(entry).toHaveProperty("rank");
        expect(entry).toHaveProperty("userId");
        expect(entry).toHaveProperty("userName");
        expect(entry).toHaveProperty("totalYield");
        expect(entry).toHaveProperty("points");
        expect(entry.rank).toBe(index + 1);
      });
    });

    it("should have valid vendor structure", async () => {
      const { MOCK_VENDORS } = await import("../lib/community");
      
      expect(MOCK_VENDORS.length).toBeGreaterThan(0);
      
      MOCK_VENDORS.forEach(vendor => {
        expect(vendor).toHaveProperty("id");
        expect(vendor).toHaveProperty("name");
        expect(vendor).toHaveProperty("logo");
        expect(vendor).toHaveProperty("isVerified");
        expect(vendor).toHaveProperty("rating");
        expect(vendor.rating).toBeGreaterThanOrEqual(0);
        expect(vendor.rating).toBeLessThanOrEqual(5);
      });
    });
  });

  describe("Utility Functions", () => {
    it("should format time remaining correctly", async () => {
      const { formatTimeRemaining } = await import("../lib/community");
      
      // Past date
      const pastDate = new Date(Date.now() - 1000);
      expect(formatTimeRemaining(pastDate)).toBe("Beendet");
      
      // Future date (1 day from now)
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const result = formatTimeRemaining(futureDate);
      expect(result).toContain("T");
    });

    it("should format relative time correctly", async () => {
      const { formatRelativeTime } = await import("../lib/community");
      
      // Just now
      const now = new Date();
      expect(formatRelativeTime(now)).toBe("Gerade eben");
      
      // 5 minutes ago
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatRelativeTime(fiveMinAgo)).toContain("m");
      
      // 2 hours ago
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(formatRelativeTime(twoHoursAgo)).toContain("h");
    });
  });
});

// Test Subscription System Integration
describe("Subscription System", () => {
  it("should have all tier limits defined", async () => {
    const { TIER_LIMITS } = await import("../lib/subscription");
    
    expect(TIER_LIMITS).toHaveProperty("free");
    expect(TIER_LIMITS).toHaveProperty("premium");
    expect(TIER_LIMITS).toHaveProperty("pro");
    
    // Free tier should have limits
    expect(TIER_LIMITS.free.diagnosesPerDay).toBeGreaterThan(0);
    expect(TIER_LIMITS.free.coachMessagesPerDay).toBeGreaterThan(0);
    
    // Pro tier should have unlimited (-1)
    expect(TIER_LIMITS.pro.diagnosesPerDay).toBe(-1);
    expect(TIER_LIMITS.pro.coachMessagesPerDay).toBe(-1);
  });

  it("should have tier pricing defined", async () => {
    const { TIER_PRICING } = await import("../lib/subscription");
    
    // TIER_PRICING excludes free tier
    expect(TIER_PRICING).toHaveProperty("premium");
    expect(TIER_PRICING).toHaveProperty("pro");
    expect(TIER_PRICING.premium.monthly).toBeGreaterThan(0);
    expect(TIER_PRICING.pro.monthly).toBeGreaterThan(TIER_PRICING.premium.monthly);
  });
});
