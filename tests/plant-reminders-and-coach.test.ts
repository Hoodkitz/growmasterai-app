import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  cancelPlantNotifications,
  loadPlantMeta,
  syncPlantNotifications,
  type PlantMeta,
} from "@/lib/plant-reminders";
import { DEFAULT_REMINDER_SETTINGS } from "@/lib/plant-schedule";
import { getCoachErrorMessage } from "@/lib/error-handling";

const {
  mockStorage,
  mockPlatform,
  scheduledNotifications,
  cancelledNotificationIds,
} = vi.hoisted(() => ({
  mockStorage: {} as Record<string, string>,
  mockPlatform: { OS: "web" as "web" | "android" | "ios" },
  scheduledNotifications: [] as unknown[],
  cancelledNotificationIds: [] as string[],
}));

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStorage[key] ?? null)),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
      return Promise.resolve();
    }),
  },
}));

vi.mock("react-native", () => ({
  Platform: mockPlatform,
}));

vi.mock("expo-notifications", () => ({
  SchedulableTriggerInputTypes: {
    DATE: "date",
  },
  scheduleNotificationAsync: vi.fn(async (req: unknown) => {
    scheduledNotifications.push(req);
    return `notif-${scheduledNotifications.length}`;
  }),
  cancelScheduledNotificationAsync: vi.fn(async (id: string) => {
    cancelledNotificationIds.push(id);
  }),
}));

vi.mock("@/lib/reminder-system", () => ({
  requestNotificationPermissions: vi.fn(async () => true),
}));

describe("Plant reminders persistence & Coach error handling", () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
    scheduledNotifications.length = 0;
    cancelledNotificationIds.length = 0;
    mockPlatform.OS = "web";
    vi.clearAllMocks();
  });

  it("persists PlantMeta to AsyncStorage even on web where native notifications are skipped", async () => {
    mockPlatform.OS = "web";
    const plant = {
      id: "plant-42",
      name: "Blue Dream",
      strain: "Blue Dream",
      phase: "flowering" as const,
      startDate: "2026-10-01T00:00:00.000Z",
    };
    const meta: PlantMeta = {
      floweringStart: "2026-11-01T10:00:00.000Z",
      lastWatered: "2026-11-12T08:00:00.000Z",
      lastFed: "2026-11-10T08:00:00.000Z",
      reminders: { ...DEFAULT_REMINDER_SETTINGS, wateringEveryDays: 2 },
      notificationIds: [],
    };

    const granted = await syncPlantNotifications(plant, meta);
    expect(granted).toBe(true);
    expect(scheduledNotifications).toHaveLength(0);

    const loaded = await loadPlantMeta("plant-42");
    expect(loaded.floweringStart).toBe("2026-11-01T10:00:00.000Z");
    expect(loaded.lastWatered).toBe("2026-11-12T08:00:00.000Z");
    expect(loaded.lastFed).toBe("2026-11-10T08:00:00.000Z");
    expect(loaded.reminders.wateringEveryDays).toBe(2);
  });

  it("schedules notifications on native and clears them on cancelPlantNotifications", async () => {
    mockPlatform.OS = "android";
    const plant = {
      id: "plant-99",
      name: "Northern Lights",
      strain: "Northern Lights",
      phase: "vegetative" as const,
      startDate: new Date().toISOString(),
    };
    const meta: PlantMeta = {
      lastWatered: new Date().toISOString(),
      reminders: { ...DEFAULT_REMINDER_SETTINGS, enabled: true },
      notificationIds: ["old-notif-1"],
    };

    const granted = await syncPlantNotifications(plant, meta);
    expect(granted).toBe(true);
    expect(cancelledNotificationIds).toContain("old-notif-1");
    expect(scheduledNotifications.length).toBeGreaterThan(0);

    const loaded = await loadPlantMeta("plant-99");
    expect(loaded.notificationIds.length).toBe(scheduledNotifications.length);

    await cancelPlantNotifications("plant-99");
    const afterCancel = await loadPlantMeta("plant-99");
    expect(afterCancel.notificationIds).toEqual([]);
  });

  it("marks Coach network errors as retryable and excludes error messages from persisted history", () => {
    const errDetails = getCoachErrorMessage(
      new Error("Network request failed"),
    );
    expect(errDetails.retryable).toBe(true);
    expect(errDetails.message.length).toBeGreaterThan(0);

    const messages = [
      { id: "1", role: "user" as const, content: "Wie oft gießen?" },
      {
        id: "2",
        role: "error" as const,
        content: errDetails.message,
        error: errDetails,
        retryQuestion: "Wie oft gießen?",
      },
      { id: "3", role: "assistant" as const, content: "Alle 2-3 Tage." },
    ];
    const persistable = messages.filter((m) => m.role !== "error").slice(-100);
    expect(persistable.map((m) => m.id)).toEqual(["1", "3"]);
  });
});
