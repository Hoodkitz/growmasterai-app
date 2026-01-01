import { ScrollView, Text, View, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="items-center gap-2 pt-4">
            <View className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center mb-2">
              <IconSymbol name="leaf.fill" size={40} color={colors.primary} />
            </View>
            <Text className="text-3xl font-bold text-foreground">GrowMaster AI</Text>
            <Text className="text-base text-muted text-center">
              Dein intelligenter Cannabis-Grow-Assistent
            </Text>
          </View>

          {/* Quick Actions */}
          <View className="gap-4">
            <Text className="text-lg font-semibold text-foreground">Schnellzugriff</Text>
            
            <View className="flex-row gap-3">
              <TouchableOpacity 
                className="flex-1 bg-surface rounded-2xl p-4 border border-border active:opacity-80"
                onPress={() => router.push("/(tabs)/diagnose")}
              >
                <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center mb-3">
                  <IconSymbol name="camera.fill" size={24} color={colors.primary} />
                </View>
                <Text className="text-base font-semibold text-foreground">Diagnose</Text>
                <Text className="text-sm text-muted mt-1">Pflanze analysieren</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                className="flex-1 bg-surface rounded-2xl p-4 border border-border active:opacity-80"
                onPress={() => router.push("/(tabs)/coach")}
              >
                <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center mb-3">
                  <IconSymbol name="message.fill" size={24} color={colors.primary} />
                </View>
                <Text className="text-base font-semibold text-foreground">Grow Coach</Text>
                <Text className="text-sm text-muted mt-1">Frag den Experten</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Section */}
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">Übersicht</Text>
            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-primary">0</Text>
                <Text className="text-sm text-muted">Pflanzen</Text>
              </View>
              <View className="w-px bg-border" />
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-primary">0</Text>
                <Text className="text-sm text-muted">Diagnosen</Text>
              </View>
              <View className="w-px bg-border" />
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-primary">0</Text>
                <Text className="text-sm text-muted">Einträge</Text>
              </View>
            </View>
          </View>

          {/* Features Info */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Funktionen</Text>
            
            <View className="bg-surface rounded-xl p-4 border border-border flex-row items-center gap-4">
              <View className="w-10 h-10 rounded-full bg-success/20 items-center justify-center">
                <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-foreground">KI-Pflanzenanalyse</Text>
                <Text className="text-sm text-muted">Erkennt Krankheiten & Mängel</Text>
              </View>
            </View>

            <View className="bg-surface rounded-xl p-4 border border-border flex-row items-center gap-4">
              <View className="w-10 h-10 rounded-full bg-success/20 items-center justify-center">
                <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-foreground">Grow Coach</Text>
                <Text className="text-sm text-muted">Persönliche Anbau-Beratung</Text>
              </View>
            </View>

            <View className="bg-surface rounded-xl p-4 border border-border flex-row items-center gap-4">
              <View className="w-10 h-10 rounded-full bg-success/20 items-center justify-center">
                <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-foreground">Grow Journal</Text>
                <Text className="text-sm text-muted">Dokumentiere deinen Fortschritt</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
