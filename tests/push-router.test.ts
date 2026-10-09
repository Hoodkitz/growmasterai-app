import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  EXPO_PUSH_URL,
  EXPO_PUSH_CHUNK_SIZE,
  isExpoPushToken,
  chunk,
  sendExpoPush,
} from "../server/push";

describe("Push Module", () => {
  describe("EXPO_PUSH_URL", () => {
    it("should be the correct Expo push API URL", () => {
      expect(EXPO_PUSH_URL).toBe("https://exp.host/--/api/v2/push/send");
    });
  });

  describe("EXPO_PUSH_CHUNK_SIZE", () => {
    it("should be 100", () => {
      expect(EXPO_PUSH_CHUNK_SIZE).toBe(100);
    });
  });

  describe("isExpoPushToken", () => {
    it("should return true for valid Expo push tokens", () => {
      expect(isExpoPushToken("ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]")).toBe(
        true,
      );
      expect(isExpoPushToken("ExpoPushToken[yyyyyyyyyyyyyyyyyyyyyyyy]")).toBe(
        true,
      );
    });

    it("should return false for invalid tokens", () => {
      expect(isExpoPushToken("")).toBe(false);
      expect(isExpoPushToken("invalid-token")).toBe(false);
      expect(isExpoPushToken("ExponentPushToken")).toBe(false);
      expect(isExpoPushToken("ExponentPushToken[]")).toBe(false);
      expect(isExpoPushToken("FCMToken[xxxxxxxxxxxxxxxxxxxxxx]")).toBe(false);
      expect(isExpoPushToken("ExponentPushToken[abc]extra")).toBe(false);
    });

    it("should return false for tokens with wrong prefix", () => {
      expect(isExpoPushToken("expoPushToken[xxxxxxxxxxxxxxxxxxxxxx]")).toBe(
        false,
      );
      expect(isExpoPushToken("EXPONENTPUSHTOKEN[xxxxxxxxxxxxxxxxxxxxxx]")).toBe(
        false,
      );
    });

    it("should return false for tokens with empty content", () => {
      expect(isExpoPushToken("ExponentPushToken[]")).toBe(false);
      expect(isExpoPushToken("ExpoPushToken[]")).toBe(false);
    });

    it("should return true for tokens with special characters in content", () => {
      expect(isExpoPushToken("ExponentPushToken[abc-123_def]")).toBe(true);
      expect(isExpoPushToken("ExpoPushToken[ABC123xyz]")).toBe(true);
    });
  });

  describe("chunk", () => {
    it("should return empty array for empty input", () => {
      expect(chunk([])).toEqual([]);
    });

    it("should return single chunk for small arrays", () => {
      const result = chunk([1, 2, 3]);
      expect(result).toEqual([[1, 2, 3]]);
    });

    it("should split array into chunks of specified size", () => {
      const result = chunk([1, 2, 3, 4, 5], 2);
      expect(result).toEqual([[1, 2], [3, 4], [5]]);
    });

    it("should handle exact multiples of chunk size", () => {
      const result = chunk([1, 2, 3, 4], 2);
      expect(result).toEqual([
        [1, 2],
        [3, 4],
      ]);
    });

    it("should use default chunk size of 100", () => {
      const largeArray = Array.from({ length: 101 }, (_, i) => i);
      const result = chunk(largeArray);
      expect(result.length).toBe(2);
      expect(result[0].length).toBe(100);
      expect(result[1].length).toBe(1);
    });

    it("should handle chunk size larger than array", () => {
      const result = chunk([1, 2, 3], 10);
      expect(result).toEqual([[1, 2, 3]]);
    });

    it("should handle chunk size of 1", () => {
      const result = chunk([1, 2, 3], 1);
      expect(result).toEqual([[1], [2], [3]]);
    });

    it("should work with string arrays", () => {
      const result = chunk(["a", "b", "c", "d"], 2);
      expect(result).toEqual([
        ["a", "b"],
        ["c", "d"],
      ]);
    });

    it("should work with object arrays", () => {
      const obj1 = { id: 1 };
      const obj2 = { id: 2 };
      const obj3 = { id: 3 };
      const result = chunk([obj1, obj2, obj3], 2);
      expect(result).toEqual([[obj1, obj2], [obj3]]);
    });
  });

  describe("sendExpoPush", () => {
    const mockFetch = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should return summary with zero attempted for empty tokens", async () => {
      const result = await sendExpoPush(
        [],
        { title: "Test", body: "Test" },
        mockFetch,
      );
      expect(result.attempted).toBe(0);
      expect(result.accepted).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.invalidTokens).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should filter out invalid tokens", async () => {
      const result = await sendExpoPush(
        ["invalid-token", "ExponentPushToken[valid123]"],
        { title: "Test", body: "Test" },
        mockFetch,
      );
      expect(result.attempted).toBe(1);
    });

    it("should deduplicate tokens", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [{ status: "ok" }, { status: "ok" }],
        }),
      });

      const result = await sendExpoPush(
        ["ExponentPushToken[abc]", "ExponentPushToken[abc]"],
        { title: "Test", body: "Test" },
        mockFetch,
      );
      expect(result.attempted).toBe(1);
    });

    it("should send push notification successfully", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [{ status: "ok" }],
        }),
      });

      const result = await sendExpoPush(
        ["ExponentPushToken[abc123]"],
        { title: "Test Title", body: "Test Body" },
        mockFetch,
      );

      expect(result.attempted).toBe(1);
      expect(result.accepted).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.invalidTokens).toEqual([]);
    });

    it("should handle failed push notifications", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [{ status: "error", details: { error: "SomeError" } }],
        }),
      });

      const result = await sendExpoPush(
        ["ExponentPushToken[abc123]"],
        { title: "Test", body: "Test" },
        mockFetch,
      );

      expect(result.attempted).toBe(1);
      expect(result.accepted).toBe(0);
      expect(result.failed).toBe(1);
    });

    it("should track DeviceNotRegistered as invalid token", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { status: "error", details: { error: "DeviceNotRegistered" } },
          ],
        }),
      });

      const result = await sendExpoPush(
        ["ExponentPushToken[abc123]"],
        { title: "Test", body: "Test" },
        mockFetch,
      );

      expect(result.invalidTokens).toEqual(["ExponentPushToken[abc123]"]);
    });

    it("should handle HTTP errors", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await sendExpoPush(
        ["ExponentPushToken[abc123]"],
        { title: "Test", body: "Test" },
        mockFetch,
      );

      expect(result.attempted).toBe(1);
      expect(result.failed).toBe(1);
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const result = await sendExpoPush(
        ["ExponentPushToken[abc123]"],
        { title: "Test", body: "Test" },
        mockFetch,
      );

      expect(result.attempted).toBe(1);
      expect(result.failed).toBe(1);
    });

    it("should handle multiple tokens in one batch", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [{ status: "ok" }, { status: "ok" }, { status: "ok" }],
        }),
      });

      const result = await sendExpoPush(
        [
          "ExponentPushToken[abc]",
          "ExponentPushToken[def]",
          "ExponentPushToken[ghi]",
        ],
        { title: "Test", body: "Test" },
        mockFetch,
      );

      expect(result.attempted).toBe(3);
      expect(result.accepted).toBe(3);
      expect(result.failed).toBe(0);
    });

    it("should chunk large token arrays", async () => {
      const tokens = Array.from(
        { length: 150 },
        (_, i) => `ExponentPushToken[token${i}]`,
      );

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: Array.from({ length: 100 }, () => ({ status: "ok" })),
        }),
      });

      const result = await sendExpoPush(
        tokens,
        { title: "Test", body: "Test" },
        mockFetch,
      );

      expect(result.attempted).toBe(150);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should send correct request body", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [{ status: "ok" }],
        }),
      });

      await sendExpoPush(
        ["ExponentPushToken[abc123]"],
        { title: "Test Title", body: "Test Body" },
        mockFetch,
      );

      expect(mockFetch).toHaveBeenCalledWith(
        EXPO_PUSH_URL,
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          body: expect.stringContaining("Test Title"),
        }),
      );
    });

    it("should handle mixed success and failure", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { status: "ok" },
            { status: "error", details: { error: "DeviceNotRegistered" } },
            { status: "ok" },
          ],
        }),
      });

      const result = await sendExpoPush(
        [
          "ExponentPushToken[abc]",
          "ExponentPushToken[def]",
          "ExponentPushToken[ghi]",
        ],
        { title: "Test", body: "Test" },
        mockFetch,
      );

      expect(result.attempted).toBe(3);
      expect(result.accepted).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.invalidTokens).toEqual(["ExponentPushToken[def]"]);
    });

    it("should handle missing data in response", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const result = await sendExpoPush(
        ["ExponentPushToken[abc]"],
        { title: "Test", body: "Test" },
        mockFetch,
      );

      expect(result.attempted).toBe(1);
      expect(result.failed).toBe(1);
    });

    it("should handle null data in response", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: null }),
      });

      const result = await sendExpoPush(
        ["ExponentPushToken[abc]"],
        { title: "Test", body: "Test" },
        mockFetch,
      );

      expect(result.attempted).toBe(1);
      expect(result.failed).toBe(1);
    });
  });
});
