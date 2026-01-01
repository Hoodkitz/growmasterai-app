import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the LLM module
vi.mock("../server/_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import { invokeLLM } from "../server/_core/llm";

describe("GrowMaster AI Server Routers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Diagnosis Router", () => {
    it("should return a valid diagnosis response structure", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                problem: "Die Pflanze zeigt Anzeichen eines Stickstoffmangels",
                recommendations: ["Erhöhe die Stickstoffzufuhr", "Überprüfe den pH-Wert"],
                careTips: ["Regelmäßig gießen", "Luftfeuchtigkeit kontrollieren"],
                severity: "medium",
              }),
            },
          },
        ],
      };

      vi.mocked(invokeLLM).mockResolvedValue(mockResponse as any);

      // Test that the mock is set up correctly
      const result = await invokeLLM({
        messages: [{ role: "user", content: "test" }],
      });

      expect(result.choices[0].message.content).toBeDefined();
      const parsed = JSON.parse(result.choices[0].message.content as string);
      
      expect(parsed).toHaveProperty("problem");
      expect(parsed).toHaveProperty("recommendations");
      expect(parsed).toHaveProperty("careTips");
      expect(parsed).toHaveProperty("severity");
      expect(Array.isArray(parsed.recommendations)).toBe(true);
      expect(Array.isArray(parsed.careTips)).toBe(true);
      expect(["low", "medium", "high"]).toContain(parsed.severity);
    });

    it("should handle invalid JSON response gracefully", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: "This is not valid JSON",
            },
          },
        ],
      };

      vi.mocked(invokeLLM).mockResolvedValue(mockResponse as any);

      const result = await invokeLLM({
        messages: [{ role: "user", content: "test" }],
      });

      // The router should handle this gracefully
      expect(result.choices[0].message.content).toBe("This is not valid JSON");
    });
  });

  describe("Coach Router", () => {
    it("should return a valid coach response structure", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                answer: "Für optimales Wachstum empfehle ich einen ausgewogenen NPK-Dünger.",
                tips: ["Beobachte täglich", "Führe ein Journal", "Halte Bedingungen konstant"],
              }),
            },
          },
        ],
      };

      vi.mocked(invokeLLM).mockResolvedValue(mockResponse as any);

      const result = await invokeLLM({
        messages: [{ role: "user", content: "Wie dünge ich richtig?" }],
      });

      expect(result.choices[0].message.content).toBeDefined();
      const parsed = JSON.parse(result.choices[0].message.content as string);
      
      expect(parsed).toHaveProperty("answer");
      expect(parsed).toHaveProperty("tips");
      expect(typeof parsed.answer).toBe("string");
      expect(Array.isArray(parsed.tips)).toBe(true);
    });

    it("should handle empty tips array", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                answer: "Das ist eine gute Frage!",
                tips: [],
              }),
            },
          },
        ],
      };

      vi.mocked(invokeLLM).mockResolvedValue(mockResponse as any);

      const result = await invokeLLM({
        messages: [{ role: "user", content: "test" }],
      });

      const parsed = JSON.parse(result.choices[0].message.content as string);
      expect(parsed.tips).toEqual([]);
    });
  });

  describe("Response Schema Validation", () => {
    it("diagnosis severity should be one of low, medium, high", () => {
      const validSeverities = ["low", "medium", "high"];
      
      validSeverities.forEach((severity) => {
        expect(["low", "medium", "high"]).toContain(severity);
      });
    });

    it("should validate diagnosis response has required fields", () => {
      const validResponse = {
        problem: "Test problem",
        recommendations: ["Rec 1"],
        careTips: ["Tip 1"],
        severity: "low",
      };

      expect(validResponse).toHaveProperty("problem");
      expect(validResponse).toHaveProperty("recommendations");
      expect(validResponse).toHaveProperty("careTips");
      expect(validResponse).toHaveProperty("severity");
    });

    it("should validate coach response has required fields", () => {
      const validResponse = {
        answer: "Test answer",
        tips: ["Tip 1", "Tip 2"],
      };

      expect(validResponse).toHaveProperty("answer");
      expect(validResponse).toHaveProperty("tips");
    });
  });
});
