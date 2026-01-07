import { useState, useEffect, useCallback } from "react";
import { Text, View, TouchableOpacity, TextInput, Modal, FlatList, RefreshControl } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSubscription } from "@/lib/subscription-context";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { TIER_LIMITS } from "@/lib/subscription";

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

const PHASES = {
  seedling: { label: "Keimling", color: "#86EFAC" },
  vegetative: { label: "Vegetativ", color: "#4ADE80" },
  flowering: { label: "Blüte", color: "#22C55E" },
  harvest: { label: "Ernte", color: "#16A34A" },
};

const STORAGE_KEY = "plants";

export default function PlantsScreen() {
  const colors = useColors();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newPlant, setNewPlant] = useState({
    name: "",
    strain: "",
    phase: "seedling" as Plant["phase"],
    notes: "",
  });

  const { tier, canAddNewPlant } = useSubscription();
  const limits = TIER_LIMITS[tier];
  const canAdd = canAddNewPlant(plants.length);

  // Load plants from AsyncStorage
  const loadPlants = useCallback(async () => {
    try {
      const storedPlants = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedPlants) {
        const parsed = JSON.parse(storedPlants);
        // Ensure notes field exists for all plants
        const normalizedPlants = parsed.map((p: Plant) => ({
          ...p,
          notes: p.notes || "",
        }));
        setPlants(normalizedPlants);
      } else {
        setPlants([]);
      }
    } catch (error) {
      console.error("Failed to load plants:", error);
      setPlants([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save plants to AsyncStorage
  const savePlants = useCallback(async (updatedPlants: Plant[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlants));
    } catch (error) {
      console.error("Failed to save plants:", error);
    }
  }, []);

  // Load plants on mount
  useEffect(() => {
    loadPlants();
  }, [loadPlants]);

  // Reload plants when screen comes into focus (e.g., after onboarding)
  useFocusEffect(
    useCallback(() => {
      loadPlants();
    }, [loadPlants])
  );

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPlants();
    setRefreshing(false);
  }, [loadPlants]);

  const addPlant = async () => {
    if (!newPlant.name.trim()) return;
    if (!canAdd) return;
    
    const plant: Plant = {
      id: Date.now().toString(),
      name: newPlant.name.trim(),
      strain: newPlant.strain.trim(),
      phase: newPlant.phase,
      startDate: new Date().toISOString(),
      notes: newPlant.notes.trim(),
      createdAt: new Date().toISOString(),
    };
    
    const updatedPlants = [...plants, plant];
    setPlants(updatedPlants);
    await savePlants(updatedPlants);
    
    setNewPlant({ name: "", strain: "", phase: "seedling", notes: "" });
    setShowModal(false);
  };

  const deletePlant = async (id: string) => {
    const updatedPlants = plants.filter(p => p.id !== id);
    setPlants(updatedPlants);
    await savePlants(updatedPlants);
  };

  const getDaysSinceStart = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const handleAddPress = () => {
    if (canAdd) {
      setShowModal(true);
    }
  };

  const renderPlant = ({ item }: { item: Plant }) => (
    <View className="bg-surface rounded-2xl p-4 border border-border mb-3">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-foreground">{item.name}</Text>
          {item.strain && <Text className="text-sm text-muted">{item.strain}</Text>}
        </View>
        <TouchableOpacity 
          className="p-2"
          onPress={() => deletePlant(item.id)}
        >
          <IconSymbol name="xmark.circle.fill" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>
      
      <View className="flex-row gap-3 mb-3">
        <View 
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: PHASES[item.phase].color + "30" }}
        >
          <Text style={{ color: PHASES[item.phase].color }} className="text-sm font-medium">
            {PHASES[item.phase].label}
          </Text>
        </View>
        <View className="px-3 py-1 rounded-full bg-primary/20">
          <Text className="text-sm font-medium text-primary">
            Tag {getDaysSinceStart(item.startDate)}
          </Text>
        </View>
        {item.growType && (
          <View className="px-3 py-1 rounded-full bg-surface border border-border">
            <Text className="text-sm text-muted capitalize">{item.growType}</Text>
          </View>
        )}
      </View>
      
      {item.notes && (
        <Text className="text-sm text-muted">{item.notes}</Text>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <ScreenContainer className="p-4">
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">Lade Pflanzen...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <View>
          <Text className="text-2xl font-bold text-foreground">Meine Pflanzen</Text>
          <Text className="text-base text-muted">
            {plants.length}{limits.maxPlants !== -1 ? `/${limits.maxPlants}` : ""} Pflanze{plants.length !== 1 ? "n" : ""}
          </Text>
        </View>
        <TouchableOpacity 
          className={`w-12 h-12 rounded-full items-center justify-center ${canAdd ? "bg-primary" : "bg-muted/30"}`}
          onPress={handleAddPress}
          disabled={!canAdd}
        >
          <IconSymbol name="plus.circle.fill" size={24} color={canAdd ? "#fff" : colors.muted} />
        </TouchableOpacity>
      </View>

      {/* Limit Warning */}
      {!canAdd && plants.length > 0 && (
        <View className="mb-4">
          <UpgradePrompt feature="Pflanzen" limit={limits.maxPlants} />
        </View>
      )}

      {plants.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-4">
          <View className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center">
            <IconSymbol name="leaf.fill" size={40} color={colors.primary} />
          </View>
          <Text className="text-lg font-medium text-foreground">Keine Pflanzen</Text>
          <Text className="text-base text-muted text-center">
            Füge deine erste Pflanze hinzu, um mit dem Tracking zu beginnen.
          </Text>
          <TouchableOpacity 
            className="bg-primary px-6 py-3 rounded-xl mt-2"
            onPress={() => setShowModal(true)}
          >
            <Text className="text-base font-semibold text-background">Pflanze hinzufügen</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={plants}
          renderItem={renderPlant}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}

      {/* Add Plant Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-background rounded-t-3xl p-6 gap-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-xl font-bold text-foreground">Neue Pflanze</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Name *</Text>
              <TextInput
                className="bg-surface rounded-xl px-4 py-3 text-foreground border border-border"
                placeholder="z.B. Northern Lights #1"
                placeholderTextColor={colors.muted}
                value={newPlant.name}
                onChangeText={(text) => setNewPlant(prev => ({ ...prev, name: text }))}
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Sorte</Text>
              <TextInput
                className="bg-surface rounded-xl px-4 py-3 text-foreground border border-border"
                placeholder="z.B. Northern Lights"
                placeholderTextColor={colors.muted}
                value={newPlant.strain}
                onChangeText={(text) => setNewPlant(prev => ({ ...prev, strain: text }))}
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Phase</Text>
              <View className="flex-row flex-wrap gap-2">
                {(Object.keys(PHASES) as Plant["phase"][]).map((phase) => (
                  <TouchableOpacity
                    key={phase}
                    className={`px-4 py-2 rounded-full border ${
                      newPlant.phase === phase ? "bg-primary border-primary" : "border-border"
                    }`}
                    onPress={() => setNewPlant(prev => ({ ...prev, phase }))}
                  >
                    <Text className={newPlant.phase === phase ? "text-background font-medium" : "text-foreground"}>
                      {PHASES[phase].label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Notizen</Text>
              <TextInput
                className="bg-surface rounded-xl px-4 py-3 text-foreground border border-border min-h-[80px]"
                placeholder="Optionale Notizen..."
                placeholderTextColor={colors.muted}
                value={newPlant.notes}
                onChangeText={(text) => setNewPlant(prev => ({ ...prev, notes: text }))}
                multiline
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity 
              className={`rounded-xl p-4 items-center mt-2 ${newPlant.name.trim() ? "bg-primary" : "bg-muted/30"}`}
              onPress={addPlant}
              disabled={!newPlant.name.trim()}
            >
              <Text className={`text-base font-semibold ${newPlant.name.trim() ? "text-background" : "text-muted"}`}>
                Pflanze hinzufügen
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
