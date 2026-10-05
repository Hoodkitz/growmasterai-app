/**
 * First Plant Setup Wizard
 * Helps user create their first plant after onboarding
 */

import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenContainer } from '@/components/screen-container';

// Same storage key/shape as app/(tabs)/plants.tsx so the plant shows up in the plants tab.
const PLANTS_STORAGE_KEY = 'plants';

const STAGES: { id: 'seedling' | 'vegetative' | 'flowering'; label: string }[] = [
  { id: 'seedling', label: 'Keimling' },
  { id: 'vegetative', label: 'Vegetativ' },
  { id: 'flowering', label: 'Blüte' },
];

export default function SetupFirstPlantScreen() {
  const [plantName, setPlantName] = useState('');
  const [strain, setStrain] = useState('');
  const [growthStage, setGrowthStage] = useState<'seedling' | 'vegetative' | 'flowering'>('seedling');
  const [saving, setSaving] = useState(false);

  const handleCreatePlant = async () => {
    if (!plantName.trim()) {
      Alert.alert('Name fehlt', 'Bitte gib deiner Pflanze einen Namen.');
      return;
    }

    setSaving(true);
    try {
      const stored = await AsyncStorage.getItem(PLANTS_STORAGE_KEY);
      const existing = stored ? JSON.parse(stored) : [];
      const now = new Date().toISOString();
      const plant = {
        id: Date.now().toString(),
        name: plantName.trim(),
        strain: strain.trim(),
        phase: growthStage,
        startDate: now,
        notes: '',
        createdAt: now,
        updatedAt: now,
      };
      await AsyncStorage.setItem(PLANTS_STORAGE_KEY, JSON.stringify([...existing, plant]));
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to save first plant:', error);
      Alert.alert('Fehler', 'Die Pflanze konnte nicht gespeichert werden. Bitte versuche es erneut.');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 px-6 pt-12">
        {/* Header */}
        <Text className="text-4xl font-bold text-foreground mb-2">
          🌱 Deine erste Pflanze
        </Text>
        <Text className="text-lg text-muted mb-8">
          Starte deinen ersten Grow! Weitere Pflanzen kannst du jederzeit hinzufügen.
        </Text>

        {/* Form */}
        <View className="space-y-6">
          {/* Name der Pflanze */}
          <View>
            <Text className="text-base font-semibold text-foreground mb-2">
              Name der Pflanze *
            </Text>
            <TextInput
              value={plantName}
              onChangeText={setPlantName}
              placeholder="z. B. Meine erste Pflanze, Blue Dream #1"
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base"
              placeholderTextColor="#6B7280"
            />
            <Text className="text-sm text-muted mt-1">
              Gib deiner Pflanze einen eindeutigen Namen
            </Text>
          </View>

          {/* Sorte (optional) */}
          <View>
            <Text className="text-base font-semibold text-foreground mb-2">
              Sorte (optional)
            </Text>
            <TextInput
              value={strain}
              onChangeText={setStrain}
              placeholder="z. B. Blue Dream, OG Kush"
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base"
              placeholderTextColor="#6B7280"
            />
            <Text className="text-sm text-muted mt-1">
              Welche Sorte baust du an?
            </Text>
          </View>

          {/* Growth Stage */}
          <View>
            <Text className="text-base font-semibold text-foreground mb-2">
              Aktuelle Phase
            </Text>
            <View className="flex-row space-x-2">
              {STAGES.map(({ id: stage, label }) => (
                <TouchableOpacity
                  key={stage}
                  onPress={() => setGrowthStage(stage)}
                  className={`flex-1 py-3 rounded-xl border-2 ${growthStage === stage
                      ? 'bg-primary border-primary'
                      : 'bg-surface border-border'
                    }`}
                >
                  <Text className={`text-center font-semibold ${growthStage === stage ? 'text-white' : 'text-foreground'
                    }`}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Info Box */}
          <View className="bg-primary/10 border border-primary/20 rounded-xl p-4">
            <Text className="text-sm text-foreground">
              💡 <Text className="font-semibold">Tipp:</Text> Nach dem Erstellen kannst du Fotos und Notizen
              hinzufügen und deinen Fortschritt im Grow-Tagebuch festhalten.
            </Text>
          </View>

          {/* Buttons */}
          <View className="space-y-3 mt-8">
            <TouchableOpacity
              onPress={handleCreatePlant}
              disabled={saving}
              className="bg-primary rounded-xl py-4 shadow-lg"
            >
              <Text className="text-white text-center text-lg font-bold">
                {saving ? 'Speichern...' : 'Pflanze erstellen 🌱'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSkip}
              className="py-4"
            >
              <Text className="text-muted text-center text-base">
                Später
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
