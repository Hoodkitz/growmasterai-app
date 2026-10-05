/**
 * Pure merge logic for offline-first plant sync (last-write-wins per plant id).
 * Used on the client (AsyncStorage <-> server) and on the server (incoming <-> DB rows).
 */
export interface SyncPlant {
  id: string;
  name: string;
  strain: string;
  phase: "seedling" | "vegetative" | "flowering" | "harvest";
  startDate: string;
  notes?: string;
  growType?: "indoor" | "outdoor" | "greenhouse";
  createdAt?: string;
  /** ISO timestamp of the last local modification. Missing -> falls back to createdAt/startDate. */
  updatedAt?: string;
}

/** id -> ISO deletion timestamp */
export type Tombstones = Record<string, string>;

export interface SyncState {
  plants: SyncPlant[];
  tombstones: Tombstones;
}

export interface MergeResult extends SyncState {
  /** Entries where `local` won and `remote` needs an update (upsert/delete). */
  toPush: SyncState;
}

function ts(iso: string | undefined | null): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
}

export function plantTimestamp(p: SyncPlant): number {
  return ts(p.updatedAt) || ts(p.createdAt) || ts(p.startDate);
}

type Version = { side: "local" | "remote"; deleted: boolean; time: number; plant?: SyncPlant; deletedAt?: string };

/**
 * Merges two states. Per id the newest change wins; on equal timestamps a deletion beats an
 * edit, and `local` beats `remote` (so a no-op sync does not generate pushes).
 */
export function mergePlants(local: SyncState, remote: SyncState): MergeResult {
  const byId = new Map<string, Version[]>();
  const add = (id: string, v: Version) => {
    const list = byId.get(id);
    if (list) list.push(v);
    else byId.set(id, [v]);
  };
  for (const p of local.plants) add(p.id, { side: "local", deleted: false, time: plantTimestamp(p), plant: p });
  for (const [id, at] of Object.entries(local.tombstones)) add(id, { side: "local", deleted: true, time: ts(at), deletedAt: at });
  for (const p of remote.plants) add(p.id, { side: "remote", deleted: false, time: plantTimestamp(p), plant: p });
  for (const [id, at] of Object.entries(remote.tombstones)) add(id, { side: "remote", deleted: true, time: ts(at), deletedAt: at });

  const plants: SyncPlant[] = [];
  const tombstones: Tombstones = {};
  const toPush: SyncState = { plants: [], tombstones: {} };

  for (const [id, versions] of byId) {
    const winner = versions.reduce((best, v) => {
      if (v.time !== best.time) return v.time > best.time ? v : best;
      if (v.deleted !== best.deleted) return v.deleted ? v : best;
      if (v.side !== best.side) return v.side === "local" ? v : best;
      return best;
    });
    if (winner.deleted) tombstones[id] = winner.deletedAt!;
    else plants.push(winner.plant!);

    // Remote needs the winner if it holds no equivalent version.
    const remoteHasWinner = versions.some(
      (v) => v.side === "remote" && v.deleted === winner.deleted && v.time === winner.time,
    );
    if (!remoteHasWinner) {
      if (winner.deleted) toPush.tombstones[id] = winner.deletedAt!;
      else toPush.plants.push(winner.plant!);
    }
  }
  return { plants, tombstones, toPush };
}
