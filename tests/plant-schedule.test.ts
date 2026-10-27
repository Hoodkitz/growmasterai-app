import { describe, it, expect } from "vitest";
import {
  buildPlantEvents,
  parseFloweringDays,
  DEFAULT_REMINDER_SETTINGS,
  type ScheduleInput,
} from "../lib/plant-schedule";

const now = new Date("2026-10-27T12:00:00");
const base: ScheduleInput = {
  plantName: "Lemmi",
  phase: "vegetative",
  startDate: "2026-10-20T00:00:00",
  settings: { ...DEFAULT_REMINDER_SETTINGS, enabled: true },
  now,
};

describe("parseFloweringDays", () => {
  it("reads days, weeks and single values", () => {
    expect(parseFloweringDays("55–60 Tage")).toEqual({ min: 55, max: 60 });
    expect(parseFloweringDays("8–9 Wochen")).toEqual({ min: 56, max: 63 });
    expect(
      parseFloweringDays(
        "10–12 Wochen (indica-dominante Phänotypen ca. 8 Wochen)",
      ),
    ).toEqual({ min: 70, max: 84 });
    expect(parseFloweringDays("50 Tage")).toEqual({ min: 50, max: 50 });
    expect(parseFloweringDays("k. A.")).toBeNull();
    expect(parseFloweringDays(undefined)).toBeNull();
  });
});

describe("buildPlantEvents", () => {
  it("returns nothing when reminders are off", () => {
    expect(
      buildPlantEvents({
        ...base,
        settings: { ...base.settings, enabled: false },
      }),
    ).toEqual([]);
  });

  it("plans watering from now, only in the future, in order", () => {
    const events = buildPlantEvents(base);
    const water = events.filter((e) => e.kind === "watering");
    expect(water).toHaveLength(12);
    expect(water[0].at.getDate()).toBe(30); // 27 + 3 days
    expect(water[0].at.getHours()).toBe(9);
    expect(events.every((e) => e.at.getTime() > now.getTime())).toBe(true);
    expect(events.map((e) => e.at.getTime())).toEqual(
      [...events.map((e) => e.at.getTime())].sort((a, b) => a - b),
    );
  });

  it("counts watering from the last logged watering", () => {
    const events = buildPlantEvents({
      ...base,
      lastWatered: "2026-10-27T08:00:00",
    });
    expect(events.find((e) => e.key === "water-1")!.at.getDate()).toBe(30);
    const later = buildPlantEvents({
      ...base,
      lastWatered: "2026-10-26T08:00:00",
    });
    expect(later.find((e) => e.key === "water-1")!.at.getDate()).toBe(29);
  });

  it("adds repot checks and a flip reminder only while growing", () => {
    const veg = buildPlantEvents(base).map((e) => e.key);
    expect(veg).toContain("repot-2");
    expect(veg).toContain("flip");
    const flower = buildPlantEvents({
      ...base,
      phase: "flowering",
      floweringStart: "2026-10-20T00:00:00",
      floweringText: "55–60 Tage",
    }).map((e) => e.key);
    expect(flower).not.toContain("flip");
    expect(flower).not.toContain("repot-2");
  });

  it("derives harvest reminders from the breeder's flowering time", () => {
    const events = buildPlantEvents({
      ...base,
      phase: "flowering",
      floweringStart: "2026-10-20T00:00:00",
      floweringText: "55–60 Tage",
    });
    const soon = events.find((e) => e.key === "harvest-soon")!;
    const end = events.find((e) => e.key === "harvest-end")!;
    // 20 Oct + 48 days = 6 Dec, + 60 days = 19 Dec
    expect(soon.at.getMonth()).toBe(11);
    expect(soon.at.getDate()).toBe(7);
    expect(end.at.getDate()).toBe(19);
  });

  it("has no harvest reminders without a known flowering time", () => {
    const events = buildPlantEvents({
      ...base,
      phase: "flowering",
      floweringStart: "2026-10-20T00:00:00",
    });
    expect(events.some((e) => e.kind === "harvest")).toBe(false);
  });

  it("plans drying checks after harvest and stops watering", () => {
    const events = buildPlantEvents({
      ...base,
      phase: "harvest",
      harvestDate: "2026-10-26T00:00:00",
    });
    expect(events.some((e) => e.kind === "watering")).toBe(false);
    expect(events.filter((e) => e.kind === "drying").length).toBe(3);
  });

  it("respects the individual switches and intervals", () => {
    const events = buildPlantEvents({
      ...base,
      settings: {
        ...base.settings,
        watering: false,
        repotCheck: false,
        flip: false,
        feeding: true,
        feedingEveryDays: 2,
      },
    });
    expect(events.every((e) => e.kind === "feeding")).toBe(true);
    expect(events[0].at.getDate()).toBe(29);
  });
});
