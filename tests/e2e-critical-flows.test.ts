import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

/**
 * E2E Tests for Critical User Flows
 * 
 * Tests the three most critical user journeys:
 * 1. Coach (AI assistance)
 * 2. Diagnosis (plant health analysis)
 * 3. Auth (login/logout flow)
 */

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockUser(): AuthenticatedUser {
  return {
    id: 1,
    openId: "test-user-123",
    email: "test@growmaster.ai",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    avatarUrl: null,
    bio: null,
    location: null,
    isPublic: true,
    level: 1,
    xp: 0,
    streak: 0,
    longestStreak: 0,
    lastActiveAt: null,
    subscriptionTier: "free",
    subscriptionExpiresAt: null,
    revenuecatId: null,
    totalPlants: 0,
    totalHarvests: 0,
    totalYield: "0",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
}

function createAuthContext(user?: AuthenticatedUser): TrpcContext {
  return {
    user: user || null,
    req: {
      protocol: "https",
      headers: {},
      ip: "127.0.0.1",
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("E2E Critical Flows", () => {
  describe("Coach Flow", () => {
    it("should accept a question and return structured advice", async () => {
      const ctx = createAuthContext(createMockUser());
      const caller = appRouter.createCaller(ctx);

      // Mock LLM response
      vi.mock("../server/_core/llm", () => ({
        invokeLLM: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  answer: "Die optimale Temperatur für Cannabis liegt zwischen 20-28°C.",
                  tips: [
                    "Vermeide große Temperaturschwankungen",
                    "Nachttemperatur sollte 5-10°C kühler sein",
                  ],
                }),
              },
            },
          ],
        }),
      }));

      const result = await caller.coach.ask({
        question: "Welche Temperatur ist ideal für Cannabis?",
      });

      expect(result).toHaveProperty("answer");
      expect(result).toHaveProperty("tips");
      expect(typeof result.answer).toBe("string");
      expect(Array.isArray(result.tips)).toBe(true);
    });

    it("should handle coach questions without authentication", async () => {
      const ctx = createAuthContext(); // No user
      const caller = appRouter.createCaller(ctx);

      // Should still work for public procedure
      const result = await caller.coach.ask({
        question: "Was ist pH-Wert?",
      });

      expect(result).toBeDefined();
    });
  });

  describe("Diagnosis Flow", () => {
    it("should analyze plant images and return diagnosis", async () => {
      const ctx = createAuthContext(createMockUser());
      const caller = appRouter.createCaller(ctx);

      // Mock base64 image data
      const mockImage = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";

      const result = await caller.diagnosis.analyze({
        images: [mockImage],
        notes: "Blätter werden gelb",
      });

      expect(result).toHaveProperty("problem");
      expect(result).toHaveProperty("recommendations");
      expect(result).toHaveProperty("careTips");
      expect(result).toHaveProperty("severity");
      expect(["low", "medium", "high"]).toContain(result.severity);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(Array.isArray(result.careTips)).toBe(true);
    });

    it("should validate image count constraints", async () => {
      const ctx = createAuthContext(createMockUser());
      const caller = appRouter.createCaller(ctx);

      // Too many images (max is 4)
      await expect(
        caller.diagnosis.analyze({
          images: ["img1", "img2", "img3", "img4", "img5"],
        })
      ).rejects.toThrow();

      // No images (min is 1)
      await expect(
        caller.diagnosis.analyze({
          images: [],
        })
      ).rejects.toThrow();
    });

    it("should include optional gender detection in response", async () => {
      const ctx = createAuthContext(createMockUser());
      const caller = appRouter.createCaller(ctx);

      const mockImage = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";

      const result = await caller.diagnosis.analyze({
        images: [mockImage],
        notes: "Blüten sichtbar",
      });

      // Gender detection is optional but should be valid if present
      if (result.plantGender) {
        expect(["male", "female", "hermaphrodite", "unknown"]).toContain(
          result.plantGender
        );
      }

      if (result.genderConfidence !== undefined) {
        expect(result.genderConfidence).toBeGreaterThanOrEqual(0);
        expect(result.genderConfidence).toBeLessThanOrEqual(100);
      }
    });
  });

  describe("Auth Flow", () => {
    it("should return user info when authenticated", async () => {
      const user = createMockUser();
      const ctx = createAuthContext(user);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.me();

      expect(result).toEqual(user);
      expect(result?.email).toBe("test@growmaster.ai");
    });

    it("should return null for unauthenticated users", async () => {
      const ctx = createAuthContext(); // No user
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.me();

      expect(result).toBeNull();
    });

    it("should logout successfully and clear cookies", async () => {
      const ctx = createAuthContext(createMockUser());
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.logout();

      expect(result).toEqual({ success: true });
      expect(ctx.res.clearCookie).toHaveBeenCalled();
    });

    it("should handle logout for unauthenticated users", async () => {
      const ctx = createAuthContext(); // No user
      const caller = appRouter.createCaller(ctx);

      // Logout should still succeed even if not authenticated
      const result = await caller.auth.logout();

      expect(result).toEqual({ success: true });
    });
  });

  describe("Integration: End-to-End User Journey", () => {
    it("should complete a full user session", async () => {
      // 1. Start unauthenticated
      let ctx = createAuthContext();
      let caller = appRouter.createCaller(ctx);
      let me = await caller.auth.me();
      expect(me).toBeNull();

      // 2. Simulate login (user gets authenticated)
      const user = createMockUser();
      ctx = createAuthContext(user);
      caller = appRouter.createCaller(ctx);
      me = await caller.auth.me();
      expect(me).toEqual(user);

      // 3. Use coach feature
      const coachResponse = await caller.coach.ask({
        question: "Wie oft sollte ich gießen?",
      });
      expect(coachResponse).toHaveProperty("answer");

      // 4. Use diagnosis feature
      const diagnosisResponse = await caller.diagnosis.analyze({
        images: ["data:image/jpeg;base64,test"],
        notes: "Test scan",
      });
      expect(diagnosisResponse).toHaveProperty("problem");

      // 5. Logout
      const logoutResult = await caller.auth.logout();
      expect(logoutResult.success).toBe(true);
    });
  });
});
