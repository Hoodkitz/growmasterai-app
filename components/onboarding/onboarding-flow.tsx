/**
 * Interactive Onboarding Flow
 * Guides new users through the app in 60 seconds
 */

import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

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
    title: '🌱 Welcome to GrowMaster AI',
    description: 'Your AI-powered companion for growing cannabis. Track, diagnose, and optimize your grows like a pro.',
    image: '🌿',
    actionLabel: 'Get Started',
  },
  {
    id: 2,
    title: '📸 AI Plant Diagnosis',
    description: 'Take a photo of your plant and get instant AI-powered diagnosis. Identify problems before they become serious.',
    image: '🔍',
    actionLabel: 'Sounds Amazing',
  },
  {
    id: 3,
    title: '💬 24/7 AI Coach',
    description: 'Ask any question about growing. Our AI coach provides expert advice anytime, anywhere.',
    image: '🤖',
    actionLabel: 'I Need This',
  },
  {
    id: 4,
    title: '📓 Smart Grow Journal',
    description: 'Track your plants with photos, notes, and automatic reminders. Never forget to water again!',
    image: '📱',
    actionLabel: 'Let\'s Go!',
  },
];

const ONBOARDING_KEY = '@growmaster_onboarding_completed';

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
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/(tabs)');
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    // Navigate to plant setup wizard
    router.replace('/onboarding/setup-first-plant');
  };

  const step = ONBOARDING_STEPS[currentStep];

  return (
    <View className="flex-1 bg-background">
      <LinearGradient
        colors={['#10B981', '#059669']}
        className="flex-1"
      >
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
                  index === currentStep
                    ? 'w-8 bg-white'
                    : 'w-2 bg-white/40'
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
              {step.actionLabel || 'Next'}
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
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

/**
 * Reset onboarding (for testing)
 */
export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(ONBOARDING_KEY);
}
