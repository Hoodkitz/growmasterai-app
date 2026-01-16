/**
 * First Plant Setup Wizard
 * Helps user create their first plant after onboarding
 */

import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { trpc } from '@/lib/trpc';

export default function SetupFirstPlantScreen() {
  const [plantName, setPlantName] = useState('');
  const [strain, setStrain] = useState('');
  const [growthStage, setGrowthStage] = useState<'seedling' | 'vegetative' | 'flowering'>('seedling');

  const createPlantMutation = trpc.plants.create.useMutation({
    onSuccess: () => {
      router.replace('/(tabs)');
    },
  });

  const handleCreatePlant = () => {
    if (!plantName.trim()) {
      alert('Please enter a plant name');
      return;
    }

    createPlantMutation.mutate({
      name: plantName,
      strain: strain || undefined,
      growthStage,
    });
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 px-6 pt-12">
        {/* Header */}
        <Text className="text-4xl font-bold text-foreground mb-2">
          🌱 Create Your First Plant
        </Text>
        <Text className="text-lg text-muted mb-8">
          Let's set up your first grow! You can always add more plants later.
        </Text>

        {/* Form */}
        <View className="space-y-6">
          {/* Plant Name */}
          <View>
            <Text className="text-base font-semibold text-foreground mb-2">
              Plant Name *
            </Text>
            <TextInput
              value={plantName}
              onChangeText={setPlantName}
              placeholder="e.g., My First Plant, Blue Dream #1"
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base"
              placeholderTextColor="#6B7280"
            />
            <Text className="text-sm text-muted mt-1">
              Give your plant a unique name
            </Text>
          </View>

          {/* Strain (Optional) */}
          <View>
            <Text className="text-base font-semibold text-foreground mb-2">
              Strain (Optional)
            </Text>
            <TextInput
              value={strain}
              onChangeText={setStrain}
              placeholder="e.g., Blue Dream, OG Kush"
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base"
              placeholderTextColor="#6B7280"
            />
            <Text className="text-sm text-muted mt-1">
              What strain are you growing?
            </Text>
          </View>

          {/* Growth Stage */}
          <View>
            <Text className="text-base font-semibold text-foreground mb-2">
              Current Stage
            </Text>
            <View className="flex-row space-x-2">
              {['seedling', 'vegetative', 'flowering'].map((stage) => (
                <TouchableOpacity
                  key={stage}
                  onPress={() => setGrowthStage(stage as any)}
                  className={`flex-1 py-3 rounded-xl border-2 ${
                    growthStage === stage
                      ? 'bg-primary border-primary'
                      : 'bg-surface border-border'
                  }`}
                >
                  <Text className={`text-center font-semibold capitalize ${
                    growthStage === stage ? 'text-white' : 'text-foreground'
                  }`}>
                    {stage}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Info Box */}
          <View className="bg-primary/10 border border-primary/20 rounded-xl p-4">
            <Text className="text-sm text-foreground">
              💡 <Text className="font-semibold">Tip:</Text> You can add photos, notes, 
              and track progress in your grow journal after creating your plant.
            </Text>
          </View>

          {/* Buttons */}
          <View className="space-y-3 mt-8">
            <TouchableOpacity
              onPress={handleCreatePlant}
              disabled={createPlantMutation.isLoading}
              className="bg-primary rounded-xl py-4 shadow-lg"
            >
              <Text className="text-white text-center text-lg font-bold">
                {createPlantMutation.isLoading ? 'Creating...' : 'Create Plant 🌱'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSkip}
              className="py-4"
            >
              <Text className="text-muted text-center text-base">
                Skip for now
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
