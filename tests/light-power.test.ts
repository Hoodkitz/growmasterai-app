import { describe, it, expect } from "vitest";
import { calculateLightPower } from "../lib/grow-tools";

describe("calculateLightPower", () => {
  it("computes kWh and cost", () => {
    const r = calculateLightPower(200, 18, 0.35, 1);
    expect(r.kwhPerDay).toBeCloseTo(3.6);
    expect(r.kwhPerMonth).toBeCloseTo(108);
    expect(r.costPerMonth).toBeCloseTo(37.8);
    expect(r.wattPerM2).toBe(200);
  });

  it("returns null density without an area and clamps negatives", () => {
    const r = calculateLightPower(-5, 12, 0.3);
    expect(r.kwhPerDay).toBe(0);
    expect(r.wattPerM2).toBeNull();
  });
});
