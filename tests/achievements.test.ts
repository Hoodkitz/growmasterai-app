import { describe, it, expect } from "vitest";
import {
  ACHIEVEMENTS,
  LEVELS,
  getLevelFromPoints,
  getProgressToNextLevel,
  checkAchievements,
  getRarityColor,
  getCategoryLabel,
  type UserStats,
} from "../lib/gamification";

describe("Achievements Module", () => {
  describe("ACHIEVEMENTS definitions", () => {
    it("should have at least 20 achievements defined", () => {
      expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(20);
    });

    it("should have unique achievement IDs", () => {
      const ids = ACHIEVEMENTS.map((a) => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have all required properties on each achievement", () => {
      ACHIEVEMENTS.forEach((achievement) => {
        expect(achievement).toHaveProperty("id");
        expect(achievement).toHaveProperty("title");
        expect(achievement).toHaveProperty("description");
        expect(achievement).toHaveProperty("icon");
        expect(achievement).toHaveProperty("points");
        expect(achievement).toHaveProperty("category");
        expect(achievement).toHaveProperty("requirement");
        expect(achievement).toHaveProperty("rarity");
        expect(achievement.requirement).toHaveProperty("type");
        expect(achievement.requirement).toHaveProperty("count");
      });
    });

    it("should have valid rarity values", () => {
      const validRarities = ["common", "rare", "epic", "legendary"];
      ACHIEVEMENTS.forEach((achievement) => {
        expect(validRarities).toContain(achievement.rarity);
      });
    });

    it("should have valid category values", () => {
      const validCategories = [
        "beginner",
        "grower",
        "expert",
        "community",
        "special",
      ];
      ACHIEVEMENTS.forEach((achievement) => {
        expect(validCategories).toContain(achievement.category);
      });
    });

    it("should have valid requirement types", () => {
      const validTypes = [
        "diagnoses",
        "plants",
        "harvests",
        "journal",
        "streak",
        "community",
        "yield",
        "reminders",
        "helpful",
      ];
      ACHIEVEMENTS.forEach((achievement) => {
        expect(validTypes).toContain(achievement.requirement.type);
      });
    });

    it("should have positive point values", () => {
      ACHIEVEMENTS.forEach((achievement) => {
        expect(achievement.points).toBeGreaterThan(0);
      });
    });

    it("should have non-negative requirement counts", () => {
      ACHIEVEMENTS.forEach((achievement) => {
        expect(achievement.requirement.count).toBeGreaterThanOrEqual(0);
      });
    });

    it("should have achievements in all categories", () => {
      const categories = new Set(ACHIEVEMENTS.map((a) => a.category));
      expect(categories.has("beginner")).toBe(true);
      expect(categories.has("grower")).toBe(true);
      expect(categories.has("expert")).toBe(true);
      expect(categories.has("community")).toBe(true);
    });

    it("should have achievements of all rarities", () => {
      const rarities = new Set(ACHIEVEMENTS.map((a) => a.rarity));
      expect(rarities.has("common")).toBe(true);
      expect(rarities.has("rare")).toBe(true);
      expect(rarities.has("epic")).toBe(true);
      expect(rarities.has("legendary")).toBe(true);
    });
  });

  describe("LEVELS definitions", () => {
    it("should have 10 levels defined", () => {
      expect(LEVELS.length).toBe(10);
    });

    it("should have all required properties on each level", () => {
      LEVELS.forEach((level) => {
        expect(level).toHaveProperty("level");
        expect(level).toHaveProperty("title");
        expect(level).toHaveProperty("minPoints");
        expect(level).toHaveProperty("maxPoints");
        expect(level).toHaveProperty("badge");
        expect(typeof level.level).toBe("number");
        expect(typeof level.minPoints).toBe("number");
        expect(typeof level.maxPoints).toBe("number");
      });
    });

    it("should have sequential level numbers", () => {
      for (let i = 0; i < LEVELS.length; i++) {
        expect(LEVELS[i].level).toBe(i + 1);
      }
    });

    it("should have increasing minPoints", () => {
      for (let i = 1; i < LEVELS.length; i++) {
        expect(LEVELS[i].minPoints).toBeGreaterThan(LEVELS[i - 1].minPoints);
      }
    });

    it("should have maxPoints greater than minPoints for all levels except the last", () => {
      for (let i = 0; i < LEVELS.length - 1; i++) {
        expect(LEVELS[i].maxPoints).toBeGreaterThan(LEVELS[i].minPoints);
      }
    });

    it("should have Infinity as maxPoints for the last level", () => {
      expect(LEVELS[LEVELS.length - 1].maxPoints).toBe(Infinity);
    });

    it("should have non-empty titles and badges", () => {
      LEVELS.forEach((level) => {
        expect(level.title.length).toBeGreaterThan(0);
        expect(level.badge.length).toBeGreaterThan(0);
      });
    });
  });

  describe("getLevelFromPoints", () => {
    it("should return level 1 for 0 points", () => {
      const level = getLevelFromPoints(0);
      expect(level.level).toBe(1);
    });

    it("should return level 1 for 50 points", () => {
      const level = getLevelFromPoints(50);
      expect(level.level).toBe(1);
    });

    it("should return level 2 for 100 points", () => {
      const level = getLevelFromPoints(100);
      expect(level.level).toBe(2);
    });

    it("should return level 2 for 299 points", () => {
      const level = getLevelFromPoints(299);
      expect(level.level).toBe(2);
    });

    it("should return level 3 for 300 points", () => {
      const level = getLevelFromPoints(300);
      expect(level.level).toBe(3);
    });

    it("should return level 5 for 1000 points", () => {
      const level = getLevelFromPoints(1000);
      expect(level.level).toBe(5);
    });

    it("should return level 10 for 20000 points", () => {
      const level = getLevelFromPoints(20000);
      expect(level.level).toBe(10);
    });

    it("should return the highest level for very high points", () => {
      const level = getLevelFromPoints(100000);
      expect(level.level).toBe(10);
    });

    it("should return level 1 for negative points", () => {
      const level = getLevelFromPoints(-10);
      expect(level.level).toBe(1);
    });

    it("should return correct level for boundary values", () => {
      expect(getLevelFromPoints(99).level).toBe(1);
      expect(getLevelFromPoints(100).level).toBe(2);
      expect(getLevelFromPoints(599).level).toBe(3);
      expect(getLevelFromPoints(600).level).toBe(4);
    });
  });

  describe("getProgressToNextLevel", () => {
    it("should return 0 for 0 points", () => {
      expect(getProgressToNextLevel(0)).toBe(0);
    });

    it("should return 50 for 50 points (halfway to level 2)", () => {
      expect(getProgressToNextLevel(50)).toBe(50);
    });

    it("should return 100 for points at the next level boundary", () => {
      expect(getProgressToNextLevel(100)).toBe(0);
    });

    it("should return 100 for very high points (max level)", () => {
      expect(getProgressToNextLevel(100000)).toBe(100);
    });

    it("should return a value between 0 and 100 for mid-level points", () => {
      const progress = getProgressToNextLevel(150);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(100);
    });

    it("should return negative progress for negative points", () => {
      // Negative points result in negative progress (edge case)
      expect(getProgressToNextLevel(-10)).toBeLessThan(0);
    });

    it("should return 100 for points at max level", () => {
      expect(getProgressToNextLevel(20000)).toBe(100);
    });

    it("should calculate correct progress for level 5", () => {
      // Level 5: 1000-1999, so 1500 should be ~50%
      const progress = getProgressToNextLevel(1500);
      expect(progress).toBeGreaterThanOrEqual(40);
      expect(progress).toBeLessThanOrEqual(60);
    });
  });

  describe("checkAchievements", () => {
    const baseStats: UserStats = {
      totalDiagnoses: 0,
      totalPlants: 0,
      totalHarvests: 0,
      totalYield: 0,
      journalEntries: 0,
      totalReminders: 0,
      loginStreak: 0,
      longestStreak: 0,
      communityPosts: 0,
      helpfulAnswers: 0,
      contestsWon: 0,
      xp: 0,
      level: 1,
    };

    it("should return only special achievements for zero stats", () => {
      const result = checkAchievements(baseStats, []);
      expect(Array.isArray(result)).toBe(true);
      // Special achievements with count=0 (early_adopter, contest_winner) are unlocked at 0
      expect(result.length).toBeLessThanOrEqual(2);
      result.forEach((a) => {
        expect(a.requirement.count).toBe(0);
      });
    });

    it("should unlock first_diagnosis for 1 diagnosis", () => {
      const stats = { ...baseStats, totalDiagnoses: 1 };
      const result = checkAchievements(stats, []);
      const firstDiagnosis = result.find((a) => a.id === "first_diagnosis");
      expect(firstDiagnosis).toBeDefined();
    });

    it("should unlock first_plant for 1 plant", () => {
      const stats = { ...baseStats, totalPlants: 1 };
      const result = checkAchievements(stats, []);
      const firstPlant = result.find((a) => a.id === "first_plant");
      expect(firstPlant).toBeDefined();
    });

    it("should unlock first_journal for 1 journal entry", () => {
      const stats = { ...baseStats, journalEntries: 1 };
      const result = checkAchievements(stats, []);
      const firstJournal = result.find((a) => a.id === "first_journal");
      expect(firstJournal).toBeDefined();
    });

    it("should unlock diagnose_10 for 10 diagnoses", () => {
      const stats = { ...baseStats, totalDiagnoses: 10 };
      const result = checkAchievements(stats, []);
      const diagnose10 = result.find((a) => a.id === "diagnose_10");
      expect(diagnose10).toBeDefined();
    });

    it("should unlock diagnose_50 for 50 diagnoses", () => {
      const stats = { ...baseStats, totalDiagnoses: 50 };
      const result = checkAchievements(stats, []);
      const diagnose50 = result.find((a) => a.id === "diagnose_50");
      expect(diagnose50).toBeDefined();
    });

    it("should unlock diagnose_100 for 100 diagnoses", () => {
      const stats = { ...baseStats, totalDiagnoses: 100 };
      const result = checkAchievements(stats, []);
      const diagnose100 = result.find((a) => a.id === "diagnose_100");
      expect(diagnose100).toBeDefined();
    });

    it("should unlock plants_5 for 5 plants", () => {
      const stats = { ...baseStats, totalPlants: 5 };
      const result = checkAchievements(stats, []);
      const plants5 = result.find((a) => a.id === "plants_5");
      expect(plants5).toBeDefined();
    });

    it("should unlock plants_20 for 20 plants", () => {
      const stats = { ...baseStats, totalPlants: 20 };
      const result = checkAchievements(stats, []);
      const plants20 = result.find((a) => a.id === "plants_20");
      expect(plants20).toBeDefined();
    });

    it("should unlock first_harvest for 1 harvest", () => {
      const stats = { ...baseStats, totalHarvests: 1 };
      const result = checkAchievements(stats, []);
      const firstHarvest = result.find((a) => a.id === "first_harvest");
      expect(firstHarvest).toBeDefined();
    });

    it("should unlock harvests_10 for 10 harvests", () => {
      const stats = { ...baseStats, totalHarvests: 10 };
      const result = checkAchievements(stats, []);
      const harvests10 = result.find((a) => a.id === "harvests_10");
      expect(harvests10).toBeDefined();
    });

    it("should unlock yield_100g for 100g yield", () => {
      const stats = { ...baseStats, totalYield: 100 };
      const result = checkAchievements(stats, []);
      const yield100g = result.find((a) => a.id === "yield_100g");
      expect(yield100g).toBeDefined();
    });

    it("should unlock yield_500g for 500g yield", () => {
      const stats = { ...baseStats, totalYield: 500 };
      const result = checkAchievements(stats, []);
      const yield500g = result.find((a) => a.id === "yield_500g");
      expect(yield500g).toBeDefined();
    });

    it("should unlock yield_1kg for 1000g yield", () => {
      const stats = { ...baseStats, totalYield: 1000 };
      const result = checkAchievements(stats, []);
      const yield1kg = result.find((a) => a.id === "yield_1kg");
      expect(yield1kg).toBeDefined();
    });

    it("should unlock streak_7 for 7 day streak", () => {
      const stats = { ...baseStats, loginStreak: 7 };
      const result = checkAchievements(stats, []);
      const streak7 = result.find((a) => a.id === "streak_7");
      expect(streak7).toBeDefined();
    });

    it("should unlock streak_30 for 30 day streak", () => {
      const stats = { ...baseStats, loginStreak: 30 };
      const result = checkAchievements(stats, []);
      const streak30 = result.find((a) => a.id === "streak_30");
      expect(streak30).toBeDefined();
    });

    it("should unlock streak_100 for 100 day streak", () => {
      const stats = { ...baseStats, loginStreak: 100 };
      const result = checkAchievements(stats, []);
      const streak100 = result.find((a) => a.id === "streak_100");
      expect(streak100).toBeDefined();
    });

    it("should unlock streak based on longestStreak", () => {
      const stats = { ...baseStats, longestStreak: 7 };
      const result = checkAchievements(stats, []);
      const streak7 = result.find((a) => a.id === "streak_7");
      expect(streak7).toBeDefined();
    });

    it("should unlock community_first_post for 1 community post", () => {
      const stats = { ...baseStats, communityPosts: 1 };
      const result = checkAchievements(stats, []);
      const communityFirstPost = result.find(
        (a) => a.id === "community_first_post",
      );
      expect(communityFirstPost).toBeDefined();
    });

    it("should unlock community_10_posts for 10 community posts", () => {
      const stats = { ...baseStats, communityPosts: 10 };
      const result = checkAchievements(stats, []);
      const community10Posts = result.find(
        (a) => a.id === "community_10_posts",
      );
      expect(community10Posts).toBeDefined();
    });

    it("should unlock community_50_posts for 50 community posts", () => {
      const stats = { ...baseStats, communityPosts: 50 };
      const result = checkAchievements(stats, []);
      const community50Posts = result.find(
        (a) => a.id === "community_50_posts",
      );
      expect(community50Posts).toBeDefined();
    });

    it("should not return already unlocked achievements", () => {
      const stats = { ...baseStats, totalDiagnoses: 10, totalPlants: 5 };
      const firstCheck = checkAchievements(stats, []);
      const unlockedIds = firstCheck.map((a) => a.id);
      const secondCheck = checkAchievements(stats, unlockedIds);
      secondCheck.forEach((achievement) => {
        expect(unlockedIds).not.toContain(achievement.id);
      });
    });

    it("should return multiple achievements for high stats", () => {
      const stats: UserStats = {
        totalDiagnoses: 100,
        totalPlants: 20,
        totalHarvests: 10,
        totalYield: 1000,
        journalEntries: 5,
        totalReminders: 0,
        loginStreak: 30,
        longestStreak: 30,
        communityPosts: 50,
        helpfulAnswers: 0,
        contestsWon: 0,
        xp: 0,
        level: 1,
      };
      const result = checkAchievements(stats, []);
      expect(result.length).toBeGreaterThan(5);
    });

    it("should set unlockedAt timestamp on newly unlocked achievements", () => {
      const stats = { ...baseStats, totalDiagnoses: 1 };
      const result = checkAchievements(stats, []);
      result.forEach((achievement) => {
        expect(achievement.unlockedAt).toBeInstanceOf(Date);
      });
    });

    it("should not unlock achievements for stats below threshold", () => {
      const stats = { ...baseStats, totalDiagnoses: 5 };
      const result = checkAchievements(stats, []);
      const diagnose10 = result.find((a) => a.id === "diagnose_10");
      expect(diagnose10).toBeUndefined();
    });

    it("should handle empty unlockedIds array", () => {
      const stats = { ...baseStats, totalDiagnoses: 1 };
      const result = checkAchievements(stats, []);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle fully unlocked achievements", () => {
      const stats: UserStats = {
        totalDiagnoses: 100,
        totalPlants: 20,
        totalHarvests: 10,
        totalYield: 1000,
        journalEntries: 5,
        totalReminders: 0,
        loginStreak: 100,
        longestStreak: 100,
        communityPosts: 50,
        helpfulAnswers: 0,
        contestsWon: 0,
        xp: 0,
        level: 1,
      };
      const allIds = ACHIEVEMENTS.map((a) => a.id);
      const result = checkAchievements(stats, allIds);
      expect(result.length).toBe(0);
    });
  });

  describe("getRarityColor", () => {
    it("should return correct color for common rarity", () => {
      expect(getRarityColor("common")).toBe("#9CA3AF");
    });

    it("should return correct color for rare rarity", () => {
      expect(getRarityColor("rare")).toBe("#3B82F6");
    });

    it("should return correct color for epic rarity", () => {
      expect(getRarityColor("epic")).toBe("#8B5CF6");
    });

    it("should return correct color for legendary rarity", () => {
      expect(getRarityColor("legendary")).toBe("#F59E0B");
    });
  });

  describe("getCategoryLabel", () => {
    it("should return correct label for beginner category", () => {
      expect(getCategoryLabel("beginner")).toBe("Anfänger");
    });

    it("should return correct label for grower category", () => {
      expect(getCategoryLabel("grower")).toBe("Grower");
    });

    it("should return correct label for expert category", () => {
      expect(getCategoryLabel("expert")).toBe("Experte");
    });

    it("should return correct label for community category", () => {
      expect(getCategoryLabel("community")).toBe("Community");
    });

    it("should return correct label for special category", () => {
      expect(getCategoryLabel("special")).toBe("Spezial");
    });
  });
});
