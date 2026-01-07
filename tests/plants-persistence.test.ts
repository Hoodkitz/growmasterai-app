import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock AsyncStorage
const mockStorage: Record<string, string> = {};

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
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

interface Plant {
  id: string;
  name: string;
  strain: string;
  phase: "seedling" | "vegetative" | "flowering" | "harvest";
  startDate: string;
  notes?: string;
  growType?: "indoor" | "outdoor" | "greenhouse";
  createdAt?: string;
}

const STORAGE_KEY = "plants";

// Simulate the storage functions from plants.tsx
async function loadPlants(): Promise<Plant[]> {
  const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
  const storedPlants = await AsyncStorage.getItem(STORAGE_KEY);
  if (storedPlants) {
    const parsed = JSON.parse(storedPlants);
    return parsed.map((p: Plant) => ({
      ...p,
      notes: p.notes || "",
    }));
  }
  return [];
}

async function savePlants(plants: Plant[]): Promise<void> {
  const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(plants));
}

// Simulate onboarding plant creation
async function createPlantFromOnboarding(plantSetup: {
  name: string;
  strain: string;
  phase: "seedling" | "vegetative" | "flowering";
  growType: "indoor" | "outdoor" | "greenhouse";
}): Promise<Plant> {
  const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
  const existingPlants = await AsyncStorage.getItem("plants");
  const plants = existingPlants ? JSON.parse(existingPlants) : [];
  
  const newPlant: Plant = {
    id: Date.now().toString(),
    ...plantSetup,
    createdAt: new Date().toISOString(),
    startDate: new Date().toISOString(),
  };
  
  plants.push(newPlant);
  await AsyncStorage.setItem("plants", JSON.stringify(plants));
  await AsyncStorage.setItem("selectedPlantId", newPlant.id);
  
  return newPlant;
}

describe("Plants Persistence", () => {
  beforeEach(() => {
    // Clear mock storage before each test
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  describe("Basic Storage Operations", () => {
    it("should return empty array when no plants exist", async () => {
      const plants = await loadPlants();
      expect(plants).toEqual([]);
    });

    it("should save and load plants correctly", async () => {
      const testPlants: Plant[] = [
        {
          id: "1",
          name: "Test Plant 1",
          strain: "Northern Lights",
          phase: "vegetative",
          startDate: "2024-01-01T00:00:00.000Z",
          notes: "Test notes",
        },
      ];

      await savePlants(testPlants);
      const loaded = await loadPlants();

      expect(loaded).toHaveLength(1);
      expect(loaded[0].name).toBe("Test Plant 1");
      expect(loaded[0].strain).toBe("Northern Lights");
    });

    it("should handle plants without notes field", async () => {
      // Simulate old data format without notes
      mockStorage[STORAGE_KEY] = JSON.stringify([
        {
          id: "1",
          name: "Old Plant",
          strain: "OG Kush",
          phase: "flowering",
          startDate: "2024-01-01T00:00:00.000Z",
        },
      ]);

      const loaded = await loadPlants();
      expect(loaded[0].notes).toBe("");
    });
  });

  describe("Onboarding Integration", () => {
    it("should create plant from onboarding and persist it", async () => {
      const plantSetup = {
        name: "My First Plant",
        strain: "White Widow",
        phase: "seedling" as const,
        growType: "indoor" as const,
      };

      const createdPlant = await createPlantFromOnboarding(plantSetup);

      expect(createdPlant.name).toBe("My First Plant");
      expect(createdPlant.strain).toBe("White Widow");
      expect(createdPlant.phase).toBe("seedling");
      expect(createdPlant.growType).toBe("indoor");
      expect(createdPlant.id).toBeDefined();
      expect(createdPlant.startDate).toBeDefined();
    });

    it("should load plant created in onboarding from Plants tab", async () => {
      // Step 1: Create plant in onboarding
      const plantSetup = {
        name: "Onboarding Plant",
        strain: "Blue Dream",
        phase: "seedling" as const,
        growType: "outdoor" as const,
      };

      await createPlantFromOnboarding(plantSetup);

      // Step 2: Load plants (simulating Plants tab mount)
      const plants = await loadPlants();

      expect(plants).toHaveLength(1);
      expect(plants[0].name).toBe("Onboarding Plant");
      expect(plants[0].strain).toBe("Blue Dream");
      expect(plants[0].growType).toBe("outdoor");
    });

    it("should preserve existing plants when creating new one in onboarding", async () => {
      // Pre-existing plant
      const existingPlants: Plant[] = [
        {
          id: "existing-1",
          name: "Existing Plant",
          strain: "Amnesia Haze",
          phase: "flowering",
          startDate: "2024-01-01T00:00:00.000Z",
        },
      ];
      await savePlants(existingPlants);

      // Create new plant in onboarding
      await createPlantFromOnboarding({
        name: "New Onboarding Plant",
        strain: "Gorilla Glue",
        phase: "seedling",
        growType: "greenhouse",
      });

      // Verify both plants exist
      const plants = await loadPlants();
      expect(plants).toHaveLength(2);
      expect(plants.find((p) => p.name === "Existing Plant")).toBeDefined();
      expect(plants.find((p) => p.name === "New Onboarding Plant")).toBeDefined();
    });
  });

  describe("Plants Tab Operations", () => {
    it("should add new plant and persist", async () => {
      const initialPlants = await loadPlants();
      expect(initialPlants).toHaveLength(0);

      const newPlant: Plant = {
        id: Date.now().toString(),
        name: "Added from Tab",
        strain: "Purple Haze",
        phase: "vegetative",
        startDate: new Date().toISOString(),
        notes: "Added via modal",
        createdAt: new Date().toISOString(),
      };

      await savePlants([newPlant]);

      const plants = await loadPlants();
      expect(plants).toHaveLength(1);
      expect(plants[0].name).toBe("Added from Tab");
    });

    it("should delete plant and persist", async () => {
      // Setup: 2 plants
      const plants: Plant[] = [
        {
          id: "1",
          name: "Plant 1",
          strain: "Strain 1",
          phase: "seedling",
          startDate: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Plant 2",
          strain: "Strain 2",
          phase: "flowering",
          startDate: new Date().toISOString(),
        },
      ];
      await savePlants(plants);

      // Delete plant 1
      const updatedPlants = plants.filter((p) => p.id !== "1");
      await savePlants(updatedPlants);

      // Verify
      const loaded = await loadPlants();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe("2");
    });
  });

  describe("Data Integrity", () => {
    it("should handle all plant phases", async () => {
      const phases = ["seedling", "vegetative", "flowering", "harvest"] as const;
      const plants: Plant[] = phases.map((phase, i) => ({
        id: String(i),
        name: `Plant ${phase}`,
        strain: "Test",
        phase,
        startDate: new Date().toISOString(),
      }));

      await savePlants(plants);
      const loaded = await loadPlants();

      expect(loaded).toHaveLength(4);
      phases.forEach((phase) => {
        expect(loaded.find((p) => p.phase === phase)).toBeDefined();
      });
    });

    it("should handle all grow types", async () => {
      const growTypes = ["indoor", "outdoor", "greenhouse"] as const;
      const plants: Plant[] = growTypes.map((growType, i) => ({
        id: String(i),
        name: `Plant ${growType}`,
        strain: "Test",
        phase: "seedling",
        startDate: new Date().toISOString(),
        growType,
      }));

      await savePlants(plants);
      const loaded = await loadPlants();

      expect(loaded).toHaveLength(3);
      growTypes.forEach((growType) => {
        expect(loaded.find((p) => p.growType === growType)).toBeDefined();
      });
    });
  });
});
