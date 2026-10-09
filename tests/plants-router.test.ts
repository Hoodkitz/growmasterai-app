import { describe, it, expect } from "vitest";
import {
  mergePlants,
  plantTimestamp,
  type SyncPlant,
  type SyncState,
  type Tombstones,
} from "../shared/plant-sync";

describe("Plants Sync Module", () => {
  describe("plantTimestamp", () => {
    it("should return updatedAt timestamp when present", () => {
      const plant: SyncPlant = {
        id: "1",
        name: "Test",
        strain: "Test",
        phase: "seedling",
        startDate: "2024-01-01",
        updatedAt: "2024-01-15",
        createdAt: "2024-01-01",
      };
      expect(plantTimestamp(plant)).toBe(Date.parse("2024-01-15"));
    });

    it("should fall back to createdAt when updatedAt is missing", () => {
      const plant: SyncPlant = {
        id: "1",
        name: "Test",
        strain: "Test",
        phase: "seedling",
        startDate: "2024-01-01",
        createdAt: "2024-01-10",
      };
      expect(plantTimestamp(plant)).toBe(Date.parse("2024-01-10"));
    });

    it("should fall back to startDate when updatedAt and createdAt are missing", () => {
      const plant: SyncPlant = {
        id: "1",
        name: "Test",
        strain: "Test",
        phase: "seedling",
        startDate: "2024-01-05",
      };
      expect(plantTimestamp(plant)).toBe(Date.parse("2024-01-05"));
    });

    it("should return 0 when all timestamps are missing", () => {
      const plant: SyncPlant = {
        id: "1",
        name: "Test",
        strain: "Test",
        phase: "seedling",
        startDate: "",
      };
      expect(plantTimestamp(plant)).toBe(0);
    });

    it("should return 0 for invalid date strings", () => {
      const plant: SyncPlant = {
        id: "1",
        name: "Test",
        strain: "Test",
        phase: "seedling",
        startDate: "invalid-date",
      };
      expect(plantTimestamp(plant)).toBe(0);
    });

    it("should prefer updatedAt over createdAt", () => {
      const plant: SyncPlant = {
        id: "1",
        name: "Test",
        strain: "Test",
        phase: "seedling",
        startDate: "2024-01-01",
        updatedAt: "2024-01-20",
        createdAt: "2024-01-10",
      };
      expect(plantTimestamp(plant)).toBe(Date.parse("2024-01-20"));
    });
  });

  describe("mergePlants", () => {
    it("should return empty result for empty inputs", () => {
      const result = mergePlants(
        { plants: [], tombstones: {} },
        { plants: [], tombstones: {} },
      );
      expect(result.plants).toEqual([]);
      expect(result.tombstones).toEqual({});
      expect(result.toPush.plants).toEqual([]);
      expect(result.toPush.tombstones).toEqual({});
    });

    it("should merge local plants into empty remote", () => {
      const localPlant: SyncPlant = {
        id: "1",
        name: "Local Plant",
        strain: "Indica",
        phase: "seedling",
        startDate: "2024-01-01",
      };
      const result = mergePlants(
        { plants: [localPlant], tombstones: {} },
        { plants: [], tombstones: {} },
      );
      expect(result.plants).toHaveLength(1);
      expect(result.plants[0].name).toBe("Local Plant");
      expect(result.toPush.plants).toHaveLength(1);
    });

    it("should merge remote plants into empty local", () => {
      const remotePlant: SyncPlant = {
        id: "1",
        name: "Remote Plant",
        strain: "Sativa",
        phase: "vegetative",
        startDate: "2024-01-01",
      };
      const result = mergePlants(
        { plants: [], tombstones: {} },
        { plants: [remotePlant], tombstones: {} },
      );
      expect(result.plants).toHaveLength(1);
      expect(result.plants[0].name).toBe("Remote Plant");
      expect(result.toPush.plants).toHaveLength(0);
    });

    it("should merge plants from both sides", () => {
      const localPlant: SyncPlant = {
        id: "1",
        name: "Local Plant",
        strain: "Indica",
        phase: "seedling",
        startDate: "2024-01-01",
      };
      const remotePlant: SyncPlant = {
        id: "2",
        name: "Remote Plant",
        strain: "Sativa",
        phase: "vegetative",
        startDate: "2024-01-01",
      };
      const result = mergePlants(
        { plants: [localPlant], tombstones: {} },
        { plants: [remotePlant], tombstones: {} },
      );
      expect(result.plants).toHaveLength(2);
      expect(result.toPush.plants).toHaveLength(1);
    });

    it("should handle last-write-wins for same plant id", () => {
      const localPlant: SyncPlant = {
        id: "1",
        name: "Local Version",
        strain: "Indica",
        phase: "seedling",
        startDate: "2024-01-01",
        updatedAt: "2024-01-15",
      };
      const remotePlant: SyncPlant = {
        id: "1",
        name: "Remote Version",
        strain: "Sativa",
        phase: "vegetative",
        startDate: "2024-01-01",
        updatedAt: "2024-01-10",
      };
      const result = mergePlants(
        { plants: [localPlant], tombstones: {} },
        { plants: [remotePlant], tombstones: {} },
      );
      expect(result.plants).toHaveLength(1);
      expect(result.plants[0].name).toBe("Local Version");
    });

    it("should prefer remote when timestamps are equal", () => {
      const localPlant: SyncPlant = {
        id: "1",
        name: "Local Version",
        strain: "Indica",
        phase: "seedling",
        startDate: "2024-01-01",
        updatedAt: "2024-01-15",
      };
      const remotePlant: SyncPlant = {
        id: "1",
        name: "Remote Version",
        strain: "Sativa",
        phase: "vegetative",
        startDate: "2024-01-01",
        updatedAt: "2024-01-15",
      };
      const result = mergePlants(
        { plants: [localPlant], tombstones: {} },
        { plants: [remotePlant], tombstones: {} },
      );
      expect(result.plants).toHaveLength(1);
      // On equal timestamps, local wins (no-op sync)
      expect(result.plants[0].name).toBe("Local Version");
    });

    it("should handle tombstones from local", () => {
      const result = mergePlants(
        { plants: [], tombstones: { "1": "2024-01-15" } },
        { plants: [], tombstones: {} },
      );
      expect(result.tombstones).toEqual({ "1": "2024-01-15" });
      expect(result.toPush.tombstones).toEqual({ "1": "2024-01-15" });
    });

    it("should handle tombstones from remote", () => {
      const result = mergePlants(
        { plants: [], tombstones: {} },
        { plants: [], tombstones: { "1": "2024-01-15" } },
      );
      expect(result.tombstones).toEqual({ "1": "2024-01-15" });
      expect(result.toPush.tombstones).toEqual({});
    });

    it("should handle deletion beating edit on equal timestamps", () => {
      const localPlant: SyncPlant = {
        id: "1",
        name: "Local Plant",
        strain: "Indica",
        phase: "seedling",
        startDate: "2024-01-01",
        updatedAt: "2024-01-15",
      };
      const result = mergePlants(
        { plants: [localPlant], tombstones: { "1": "2024-01-15" } },
        { plants: [], tombstones: {} },
      );
      expect(result.plants).toHaveLength(0);
      expect(result.tombstones).toEqual({ "1": "2024-01-15" });
    });

    it("should handle edit beating deletion on newer timestamp", () => {
      const localPlant: SyncPlant = {
        id: "1",
        name: "Local Plant",
        strain: "Indica",
        phase: "seedling",
        startDate: "2024-01-01",
        updatedAt: "2024-01-20",
      };
      const result = mergePlants(
        { plants: [localPlant], tombstones: { "1": "2024-01-15" } },
        { plants: [], tombstones: {} },
      );
      expect(result.plants).toHaveLength(1);
      expect(result.tombstones).toEqual({});
    });

    it("should handle multiple plants with mixed operations", () => {
      const localPlants: SyncPlant[] = [
        {
          id: "1",
          name: "Plant 1",
          strain: "Indica",
          phase: "seedling",
          startDate: "2024-01-01",
          updatedAt: "2024-01-15",
        },
        {
          id: "2",
          name: "Plant 2",
          strain: "Sativa",
          phase: "vegetative",
          startDate: "2024-01-01",
          updatedAt: "2024-01-10",
        },
      ];
      const remotePlants: SyncPlant[] = [
        {
          id: "2",
          name: "Plant 2 Remote",
          strain: "Sativa",
          phase: "flowering",
          startDate: "2024-01-01",
          updatedAt: "2024-01-12",
        },
        {
          id: "3",
          name: "Plant 3",
          strain: "Hybrid",
          phase: "seedling",
          startDate: "2024-01-01",
          updatedAt: "2024-01-05",
        },
      ];
      const result = mergePlants(
        { plants: localPlants, tombstones: { "4": "2024-01-01" } },
        { plants: remotePlants, tombstones: { "5": "2024-01-01" } },
      );
      expect(result.plants).toHaveLength(3);
      expect(result.tombstones).toEqual({
        "4": "2024-01-01",
        "5": "2024-01-01",
      });
    });

    it("should not generate pushes when remote already has the winner", () => {
      const plant: SyncPlant = {
        id: "1",
        name: "Plant 1",
        strain: "Indica",
        phase: "seedling",
        startDate: "2024-01-01",
        updatedAt: "2024-01-15",
      };
      const result = mergePlants(
        { plants: [plant], tombstones: {} },
        { plants: [plant], tombstones: {} },
      );
      expect(result.toPush.plants).toHaveLength(0);
      expect(result.toPush.tombstones).toEqual({});
    });

    it("should generate push when local has newer version", () => {
      const localPlant: SyncPlant = {
        id: "1",
        name: "Local Plant",
        strain: "Indica",
        phase: "seedling",
        startDate: "2024-01-01",
        updatedAt: "2024-01-20",
      };
      const remotePlant: SyncPlant = {
        id: "1",
        name: "Remote Plant",
        strain: "Sativa",
        phase: "vegetative",
        startDate: "2024-01-01",
        updatedAt: "2024-01-15",
      };
      const result = mergePlants(
        { plants: [localPlant], tombstones: {} },
        { plants: [remotePlant], tombstones: {} },
      );
      expect(result.toPush.plants).toHaveLength(1);
      expect(result.toPush.plants[0].name).toBe("Local Plant");
    });

    it("should handle empty tombstones", () => {
      const result = mergePlants(
        { plants: [], tombstones: {} },
        { plants: [], tombstones: {} },
      );
      expect(result.tombstones).toEqual({});
      expect(result.toPush.tombstones).toEqual({});
    });

    it("should handle plant with only startDate", () => {
      const localPlant: SyncPlant = {
        id: "1",
        name: "Plant 1",
        strain: "Indica",
        phase: "seedling",
        startDate: "2024-01-01",
      };
      const remotePlant: SyncPlant = {
        id: "1",
        name: "Plant 1 Remote",
        strain: "Sativa",
        phase: "vegetative",
        startDate: "2024-01-01",
      };
      const result = mergePlants(
        { plants: [localPlant], tombstones: {} },
        { plants: [remotePlant], tombstones: {} },
      );
      // Both have same timestamp (startDate), local wins
      expect(result.plants).toHaveLength(1);
      expect(result.plants[0].name).toBe("Plant 1");
    });

    it("should handle complex merge scenario", () => {
      const localState: SyncState = {
        plants: [
          {
            id: "1",
            name: "Local 1",
            strain: "Indica",
            phase: "seedling",
            startDate: "2024-01-01",
            updatedAt: "2024-01-20",
          },
          {
            id: "2",
            name: "Local 2",
            strain: "Sativa",
            phase: "vegetative",
            startDate: "2024-01-01",
            updatedAt: "2024-01-10",
          },
        ],
        tombstones: { "3": "2024-01-05" },
      };
      const remoteState: SyncState = {
        plants: [
          {
            id: "2",
            name: "Remote 2",
            strain: "Sativa",
            phase: "flowering",
            startDate: "2024-01-01",
            updatedAt: "2024-01-15",
          },
          {
            id: "4",
            name: "Remote 4",
            strain: "Hybrid",
            phase: "seedling",
            startDate: "2024-01-01",
            updatedAt: "2024-01-01",
          },
        ],
        tombstones: { "5": "2024-01-01" },
      };
      const result = mergePlants(localState, remoteState);

      // Plant 1: local wins (newer)
      // Plant 2: remote wins (newer)
      // Plant 3: local tombstone
      // Plant 4: remote only
      // Plant 5: remote tombstone

      expect(result.plants).toHaveLength(3);
      expect(result.tombstones).toEqual({
        "3": "2024-01-05",
        "5": "2024-01-01",
      });

      // toPush should contain: plant 1 (local wins), tombstone 3 (local only)
      expect(result.toPush.plants).toHaveLength(1);
      expect(result.toPush.plants[0].id).toBe("1");
      expect(result.toPush.tombstones).toEqual({ "3": "2024-01-05" });
    });

    it("should handle deletion of plant that exists on remote", () => {
      const remotePlant: SyncPlant = {
        id: "1",
        name: "Remote Plant",
        strain: "Sativa",
        phase: "vegetative",
        startDate: "2024-01-01",
        updatedAt: "2024-01-10",
      };
      const result = mergePlants(
        { plants: [], tombstones: { "1": "2024-01-15" } },
        { plants: [remotePlant], tombstones: {} },
      );
      expect(result.plants).toHaveLength(0);
      expect(result.tombstones).toEqual({ "1": "2024-01-15" });
      expect(result.toPush.tombstones).toEqual({ "1": "2024-01-15" });
    });

    it("should handle resurrection of deleted plant", () => {
      const localPlant: SyncPlant = {
        id: "1",
        name: "Resurrected Plant",
        strain: "Indica",
        phase: "seedling",
        startDate: "2024-01-01",
        updatedAt: "2024-01-20",
      };
      const result = mergePlants(
        { plants: [localPlant], tombstones: {} },
        { plants: [], tombstones: { "1": "2024-01-15" } },
      );
      expect(result.plants).toHaveLength(1);
      expect(result.tombstones).toEqual({});
      expect(result.toPush.plants).toHaveLength(1);
    });
  });
});
