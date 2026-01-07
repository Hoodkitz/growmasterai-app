import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useAppAuth } from "@/lib/auth-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

type OnboardingStep = "welcome" | "auth" | "plant-setup" | "complete";

interface PlantSetup {
  name: string;
  strain: string;
  phase: "seedling" | "vegetative" | "flowering";
  growType: "indoor" | "outdoor" | "greenhouse";
}

export default function OnboardingScreen() {
  const colors = useColors();
  const { user, login } = useAppAuth();
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [isLoading, setIsLoading] = useState(false);
  const [plantSetup, setPlantSetup] = useState<PlantSetup>({
    name: "",
    strain: "",
    phase: "seedling",
    growType: "indoor",
  });
  const [skipPlant, setSkipPlant] = useState(false);

  const handleHaptic = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleLogin = async (method: "google" | "apple" | "email") => {
    handleHaptic();
    setIsLoading(true);
    try {
      await login(method);
      setStep("plant-setup");
    } catch (error) {
      Alert.alert("Fehler", "Anmeldung fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipAuth = () => {
    handleHaptic();
    setStep("plant-setup");
  };

  const handleCreatePlant = async () => {
    handleHaptic();
    if (!plantSetup.name.trim()) {
      Alert.alert("Fehler", "Bitte gib deiner Pflanze einen Namen.");
      return;
    }

    setIsLoading(true);
    try {
      // Save plant to AsyncStorage
      const existingPlants = await AsyncStorage.getItem("plants");
      const plants = existingPlants ? JSON.parse(existingPlants) : [];
      
      const newPlant = {
        id: Date.now().toString(),
        ...plantSetup,
        createdAt: new Date().toISOString(),
        startDate: new Date().toISOString(),
      };
      
      plants.push(newPlant);
      await AsyncStorage.setItem("plants", JSON.stringify(plants));
      await AsyncStorage.setItem("selectedPlantId", newPlant.id);
      
      setStep("complete");
    } catch (error) {
      Alert.alert("Fehler", "Pflanze konnte nicht erstellt werden.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipPlant = async () => {
    handleHaptic();
    setSkipPlant(true);
    setStep("complete");
  };

  const handleComplete = async () => {
    handleHaptic();
    try {
      await AsyncStorage.setItem("onboardingComplete", "true");
      router.replace("/(tabs)");
    } catch (error) {
      router.replace("/(tabs)");
    }
  };

  const renderWelcome = () => (
    <View className="flex-1 items-center justify-center px-6">
      <View className="w-32 h-32 rounded-3xl bg-primary/20 items-center justify-center mb-8">
        <Text className="text-6xl">🌿</Text>
      </View>
      
      <Text className="text-3xl font-bold text-foreground text-center mb-4">
        Willkommen bei GrowMaster AI
      </Text>
      
      <Text className="text-base text-muted text-center mb-8 leading-relaxed">
        Dein intelligenter Begleiter für erfolgreiches Cannabis-Growing. 
        KI-gestützte Diagnose, personalisierte Tipps und Community-Support.
      </Text>

      <View className="w-full gap-4">
        <View className="flex-row items-center gap-3 bg-surface p-4 rounded-xl">
          <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
            <IconSymbol name="camera.fill" size={20} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-foreground font-semibold">KI-Diagnose</Text>
            <Text className="text-muted text-sm">Krankheiten & Mängel erkennen</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-3 bg-surface p-4 rounded-xl">
          <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
            <IconSymbol name="message.fill" size={20} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-foreground font-semibold">Grow Coach</Text>
            <Text className="text-muted text-sm">Persönliche Experten-Beratung</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-3 bg-surface p-4 rounded-xl">
          <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
            <IconSymbol name="person.2.fill" size={20} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-foreground font-semibold">Community</Text>
            <Text className="text-muted text-sm">Austausch mit anderen Growern</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        className="w-full bg-primary py-4 rounded-2xl mt-8"
        onPress={() => {
          handleHaptic();
          setStep("auth");
        }}
        
      >
        <Text className="text-background font-bold text-lg text-center">
          Los geht's
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderAuth = () => (
    <View className="flex-1 px-6 pt-8">
      <Text className="text-2xl font-bold text-foreground text-center mb-2">
        Anmelden
      </Text>
      <Text className="text-muted text-center mb-8">
        Melde dich an, um deine Daten zu synchronisieren
      </Text>

      <View className="gap-4">
        <TouchableOpacity
          className="flex-row items-center justify-center gap-3 bg-surface border border-border py-4 rounded-2xl"
          onPress={() => handleLogin("google")}
          disabled={isLoading}
          
        >
          <Text className="text-2xl">🔵</Text>
          <Text className="text-foreground font-semibold text-base">
            Mit Google anmelden
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center justify-center gap-3 bg-surface border border-border py-4 rounded-2xl"
          onPress={() => handleLogin("apple")}
          disabled={isLoading}
          
        >
          <Text className="text-2xl">🍎</Text>
          <Text className="text-foreground font-semibold text-base">
            Mit Apple anmelden
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center justify-center gap-3 bg-surface border border-border py-4 rounded-2xl"
          onPress={() => handleLogin("email")}
          disabled={isLoading}
          
        >
          <IconSymbol name="envelope.fill" size={24} color={colors.foreground} />
          <Text className="text-foreground font-semibold text-base">
            Mit E-Mail anmelden
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        className="mt-6"
        onPress={handleSkipAuth}
        disabled={isLoading}
      >
        <Text className="text-muted text-center text-base">
          Später anmelden
        </Text>
      </TouchableOpacity>

      {isLoading && (
        <View className="absolute inset-0 bg-background/80 items-center justify-center">
          <Text className="text-foreground">Wird geladen...</Text>
        </View>
      )}
    </View>
  );

  const renderPlantSetup = () => (
    <ScrollView className="flex-1 px-6 pt-8" showsVerticalScrollIndicator={false}>
      <Text className="text-2xl font-bold text-foreground text-center mb-2">
        Deine erste Pflanze
      </Text>
      <Text className="text-muted text-center mb-8">
        Lege deine erste Pflanze an oder überspringe diesen Schritt
      </Text>

      <View className="gap-6">
        {/* Plant Name */}
        <View>
          <Text className="text-foreground font-semibold mb-2">Pflanzenname *</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
            placeholder="z.B. Grüne Greta"
            placeholderTextColor={colors.muted}
            value={plantSetup.name}
            onChangeText={(text) => setPlantSetup({ ...plantSetup, name: text })}
          />
        </View>

        {/* Strain */}
        <View>
          <Text className="text-foreground font-semibold mb-2">Sorte (optional)</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
            placeholder="z.B. Northern Lights"
            placeholderTextColor={colors.muted}
            value={plantSetup.strain}
            onChangeText={(text) => setPlantSetup({ ...plantSetup, strain: text })}
          />
        </View>

        {/* Phase */}
        <View>
          <Text className="text-foreground font-semibold mb-2">Aktuelle Phase</Text>
          <View className="flex-row gap-2">
            {(["seedling", "vegetative", "flowering"] as const).map((phase) => (
              <TouchableOpacity
                key={phase}
                className={`flex-1 py-3 rounded-xl border ${
                  plantSetup.phase === phase
                    ? "bg-primary border-primary"
                    : "bg-surface border-border"
                }`}
                onPress={() => {
                  handleHaptic();
                  setPlantSetup({ ...plantSetup, phase });
                }}
              >
                <Text
                  className={`text-center font-medium ${
                    plantSetup.phase === phase ? "text-background" : "text-foreground"
                  }`}
                >
                  {phase === "seedling" ? "🌱 Keimling" : phase === "vegetative" ? "🌿 Veg" : "🌸 Blüte"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Grow Type */}
        <View>
          <Text className="text-foreground font-semibold mb-2">Anbauart</Text>
          <View className="flex-row gap-2">
            {(["indoor", "outdoor", "greenhouse"] as const).map((type) => (
              <TouchableOpacity
                key={type}
                className={`flex-1 py-3 rounded-xl border ${
                  plantSetup.growType === type
                    ? "bg-primary border-primary"
                    : "bg-surface border-border"
                }`}
                onPress={() => {
                  handleHaptic();
                  setPlantSetup({ ...plantSetup, growType: type });
                }}
              >
                <Text
                  className={`text-center font-medium ${
                    plantSetup.growType === type ? "text-background" : "text-foreground"
                  }`}
                >
                  {type === "indoor" ? "🏠" : type === "outdoor" ? "☀️" : "🏡"}
                </Text>
                <Text
                  className={`text-center text-xs mt-1 ${
                    plantSetup.growType === type ? "text-background" : "text-muted"
                  }`}
                >
                  {type === "indoor" ? "Indoor" : type === "outdoor" ? "Outdoor" : "Gewächshaus"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View className="gap-3 mt-8 mb-8">
        <TouchableOpacity
          className="w-full bg-primary py-4 rounded-2xl"
          onPress={handleCreatePlant}
          disabled={isLoading}
        >
          <Text className="text-background font-bold text-lg text-center">
            Pflanze anlegen
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="py-3"
          onPress={handleSkipPlant}
          disabled={isLoading}
        >
          <Text className="text-muted text-center text-base">
            Später anlegen
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderComplete = () => (
    <View className="flex-1 items-center justify-center px-6">
      <View className="w-24 h-24 rounded-full bg-success/20 items-center justify-center mb-6">
        <Text className="text-5xl">✅</Text>
      </View>

      <Text className="text-2xl font-bold text-foreground text-center mb-2">
        Alles bereit!
      </Text>
      
      <Text className="text-muted text-center mb-8">
        {skipPlant
          ? "Du kannst jederzeit deine erste Pflanze anlegen."
          : `"${plantSetup.name}" wurde erfolgreich angelegt.`}
      </Text>

      <View className="w-full bg-surface rounded-2xl p-6 mb-8">
        <Text className="text-foreground font-semibold mb-4">Das kannst du jetzt tun:</Text>
        <View className="gap-3">
          <View className="flex-row items-center gap-3">
            <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center">
              <Text>📸</Text>
            </View>
            <Text className="text-foreground flex-1">Pflanze scannen für KI-Diagnose</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center">
              <Text>💬</Text>
            </View>
            <Text className="text-foreground flex-1">Grow Coach um Rat fragen</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center">
              <Text>📖</Text>
            </View>
            <Text className="text-foreground flex-1">Grow-Journal führen</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        className="w-full bg-primary py-4 rounded-2xl"
        onPress={handleComplete}
        
      >
        <Text className="text-background font-bold text-lg text-center">
          App starten
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      {/* Progress Indicator */}
      <View className="flex-row justify-center gap-2 py-4">
        {(["welcome", "auth", "plant-setup", "complete"] as OnboardingStep[]).map(
          (s, index) => (
            <View
              key={s}
              className={`h-1.5 rounded-full ${
                index <= ["welcome", "auth", "plant-setup", "complete"].indexOf(step)
                  ? "bg-primary w-8"
                  : "bg-border w-4"
              }`}
            />
          )
        )}
      </View>

      {step === "welcome" && renderWelcome()}
      {step === "auth" && renderAuth()}
      {step === "plant-setup" && renderPlantSetup()}
      {step === "complete" && renderComplete()}
    </ScreenContainer>
  );
}
