import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { requestNotificationPermissions } from "@/lib/reminder-system";
import {
  buildPlantEvents,
  DEFAULT_REMINDER_SETTINGS,
  type PlantPhase,
  type ReminderSettings,
} from "@/lib/plant-schedule";
import { findStrainByName } from "@/lib/strains-data";

/** Per-plant data that lives only on this device (the server sync does not carry it). */
export interface PlantMeta {
  floweringStart?: string;
  harvestDate?: string;
  lastWatered?: string;
  lastFed?: string;
  reminders: ReminderSettings;
  notificationIds: string[];
}

const metaKey = (plantId: string) => `plant_meta_${plantId}`;

export async function loadPlantMeta(plantId: string): Promise<PlantMeta> {
  try {
    const raw = await AsyncStorage.getItem(metaKey(plantId));
    const parsed = raw ? (JSON.parse(raw) as Partial<PlantMeta>) : {};
    return {
      ...parsed,
      reminders: { ...DEFAULT_REMINDER_SETTINGS, ...(parsed.reminders ?? {}) },
      notificationIds: parsed.notificationIds ?? [],
    };
  } catch {
    return {
      reminders: { ...DEFAULT_REMINDER_SETTINGS },
      notificationIds: [],
    };
  }
}

export async function savePlantMeta(plantId: string, meta: PlantMeta) {
  await AsyncStorage.setItem(metaKey(plantId), JSON.stringify(meta));
}

async function cancelIds(ids: string[]) {
  await Promise.all(
    ids.map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {}),
    ),
  );
}

export interface PlantLike {
  id: string;
  name: string;
  strain?: string;
  phase: PlantPhase;
  startDate: string;
}

/**
 * Replaces all scheduled notifications of a plant with the ones its current state calls for.
 * Returns false if reminders are on but the notification permission was denied.
 */
export async function syncPlantNotifications(
  plant: PlantLike,
  meta: PlantMeta,
): Promise<boolean> {
  if (Platform.OS === "web") return true;
  await cancelIds(meta.notificationIds);
  meta.notificationIds = [];

  const events = buildPlantEvents({
    plantName: plant.name,
    phase: plant.phase,
    startDate: plant.startDate,
    floweringStart: meta.floweringStart,
    harvestDate: meta.harvestDate,
    lastWatered: meta.lastWatered,
    lastFed: meta.lastFed,
    floweringText: findStrainByName(plant.strain)?.floweringText,
    settings: meta.reminders,
    now: new Date(),
  });

  let granted = true;
  if (events.length > 0) {
    granted = await requestNotificationPermissions();
    if (granted) {
      for (const e of events) {
        try {
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: e.title,
              body: e.body,
              data: { plantId: plant.id, kind: e.kind },
              sound: true,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: e.at,
              ...(Platform.OS === "android" ? { channelId: "reminders" } : {}),
            },
          });
          meta.notificationIds.push(id);
        } catch (error) {
          console.warn("Could not schedule reminder", error);
        }
      }
    }
  }
  await savePlantMeta(plant.id, meta);
  return granted;
}

export async function cancelPlantNotifications(plantId: string) {
  const meta = await loadPlantMeta(plantId);
  await cancelIds(meta.notificationIds);
  await AsyncStorage.removeItem(metaKey(plantId));
}

/** Re-plans the rolling reminder window of every plant that has reminders on (call on app/tab focus). */
export async function refreshAllReminders(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem("plants");
    const plants: PlantLike[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(plants)) return;
    for (const plant of plants) {
      const meta = await loadPlantMeta(plant.id);
      if (meta.reminders.enabled) await syncPlantNotifications(plant, meta);
    }
  } catch (error) {
    console.warn("Could not refresh reminders", error);
  }
}
