import AsyncStorage from "@react-native-async-storage/async-storage";
import { mergePlants, type SyncPlant, type Tombstones } from "../shared/plant-sync";

export const PLANTS_KEY = "plants";
export const PLANT_TOMBSTONES_KEY = "plants_deleted";

export async function loadTombstones(): Promise<Tombstones> {
  try {
    const raw = await AsyncStorage.getItem(PLANT_TOMBSTONES_KEY);
    return raw ? (JSON.parse(raw) as Tombstones) : {};
  } catch {
    return {};
  }
}

export async function saveTombstones(t: Tombstones) {
  await AsyncStorage.setItem(PLANT_TOMBSTONES_KEY, JSON.stringify(t));
}

/** Records a local deletion so a later sync can propagate it (and not resurrect the plant). */
export async function markPlantDeleted(id: string) {
  const t = await loadTombstones();
  t[id] = new Date().toISOString();
  await saveTombstones(t);
}

async function loadPlantList(): Promise<SyncPlant[]> {
  try {
    const raw = await AsyncStorage.getItem(PLANTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

type SyncFn = (input: { plants: SyncPlant[]; tombstones: Tombstones }) => Promise<{ plants: SyncPlant[]; tombstones: Tombstones }>;

/**
 * Pushes local state to the server and merges the answer back into AsyncStorage.
 * Local state is re-read after the request so edits made while syncing are not lost.
 * Throws on network/auth errors; callers should ignore them (offline-first).
 */
export async function syncPlantsWithServer(sync: SyncFn): Promise<SyncPlant[]> {
  const local = { plants: await loadPlantList(), tombstones: await loadTombstones() };
  const remote = await sync(local);
  const current = { plants: await loadPlantList(), tombstones: await loadTombstones() };
  const merged = mergePlants(current, remote);
  await AsyncStorage.setItem(PLANTS_KEY, JSON.stringify(merged.plants));
  await saveTombstones(merged.tombstones);
  return merged.plants;
}
