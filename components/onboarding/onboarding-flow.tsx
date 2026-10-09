/**
 * Interactive Onboarding Flow
 * Guides new users through the app in 60 seconds
 */

import { View, Text, TouchableOpacity } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  image: string;
  actionLabel?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: "🌱 Willkommen!",
    description:
      "GrowMaster AI hilft dir, gesunde Cannabis-Pflanzen zu züchten. Ganz einfach mit deinem Handy.",
    image: "🌿",
    actionLabel: "Los geht's",
  },
  {
    id: 2,
    title: "📸 Foto machen",
    description:
      "Mach ein Foto von deiner Pflanze. Die KI sagt dir sofort, ob alles okay ist oder was sie braucht.",
    image: "📷",
    actionLabel: "Verstanden",
  },
  {
    id: 3,
    title: "💬 Fragen stellen",
    description:
      "Frag einfach, wenn du Hilfe brauchst. Der KI-Coach antwortet rund um die Uhr.",
    image: "🤖",
    actionLabel: "Fertig!",
  },
];

const ONBOARDING_KEY = "@growmaster_onboarding_completed";

export async function getOnboardingStatus(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(ONBOARDING_KEY);
    return v === "true";
  } catch {
    return false;
  }
}
export async function setOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, "true");
}
export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(ONBOARDING_KEY);
}

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    router.replace("/(tabs)");
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    // Navigate to plant setup wizard
    router.replace("/onboarding/setup-first-plant");
  };

  const step = ONBOARDING_STEPS[currentStep];

  return (
    <View className="flex-1 bg-background">
      <LinearGradient colors={["#10B981", "#059669"]} className="flex-1">
        {/* Skip Button */}
        <View className="absolute top-12 right-6 z-10">
          <TouchableOpacity onPress={handleSkip}>
            <Text className="text-white/80 text-base font-semibold">Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className="flex-1 justify-center items-center px-8">
          {/* Large Emoji/Icon */}
          <Text className="text-9xl mb-8">{step.image}</Text>

          {/* Title */}
          <Text className="text-white text-3xl font-bold text-center mb-4">
            {step.title}
          </Text>

          {/* Description */}
          <Text className="text-white/90 text-lg text-center mb-8 leading-relaxed">
            {step.description}
          </Text>
        </View>

        {/* Bottom Section */}
        <View className="p-8 pb-12">
          {/* Progress Dots */}
          <View className="flex-row justify-center mb-8">
            {ONBOARDING_STEPS.map((_, index) => (
              <View
                key={index}
                className={`h-2 rounded-full mx-1 ${
                  index === currentStep ? "w-8 bg-white" : "w-2 bg-white/40"
                }`}
              />
            ))}
          </View>

          {/* Next Button */}
          <TouchableOpacity
            onPress={handleNext}
            className="bg-white rounded-2xl py-4 px-8 shadow-lg"
          >
            <Text className="text-primary text-center text-lg font-bold">
              {step.actionLabel || "Next"}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

/**
 * Check if user has completed onboarding
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  return getOnboardingStatus();
}

/**
 * Reset onboarding (for testing)
 */
export async function resetOnboardingLegacy(): Promise<void> {
  await AsyncStorage.removeItem(ONBOARDING_KEY);
}
