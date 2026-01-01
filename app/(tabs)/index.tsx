import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSubscription } from "@/lib/subscription-context";
import { SubscriptionBadge, UsageIndicator } from "@/components/upgrade-prompt";
import { TIER_INFO, TIER_LIMITS } from "@/lib/subscription";

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { tier, dailyDiagnoses, dailyMessages, remainingDiagnoses, remainingMessages } = useSubscription();
  const limits = TIER_LIMITS[tier];
  const tierInfo = TIER_INFO[tier];

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="items-center gap-2 pt-4">
            <View className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center mb-2">
              <IconSymbol name="leaf.fill" size={40} color={colors.primary} />
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-3xl font-bold text-foreground">GrowMaster AI</Text>
              <SubscriptionBadge />
            </View>
            <Text className="text-base text-muted text-center">
              Dein intelligenter Cannabis-Grow-Assistent
            </Text>
          </View>

          {/* Upgrade Banner for Free Users */}
          {tier === "free" && (
            <TouchableOpacity 
              className="bg-primary/10 rounded-2xl p-4 border border-primary/30"
              onPress={() => router.push("/paywall")}
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
                  <IconSymbol name="arrow.up.circle.fill" size={24} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">Upgrade auf Premium</Text>
                  <Text className="text-sm text-muted">Mehr Diagnosen, unbegrenzte Pflanzen & mehr</Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.primary} />
              </View>
            </TouchableOpacity>
          )}

          {/* Daily Usage */}
          <View className="bg-surface rounded-2xl p-4 border border-border gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-foreground">Heutiges Kontingent</Text>
              <View 
                className="px-2 py-1 rounded-full"
                style={{ backgroundColor: tierInfo.color + "20" }}
              >
                <Text className="text-xs font-medium" style={{ color: tierInfo.color }}>
                  {tierInfo.name}
                </Text>
              </View>
            </View>
            
            <UsageIndicator 
              used={dailyDiagnoses} 
              limit={limits.diagnosesPerDay} 
              label="Diagnosen"
            />
            <UsageIndicator 
              used={dailyMessages} 
              limit={limits.coachMessagesPerDay} 
              label="Coach-Nachrichten"
            />
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
                {remainingDiagnoses !== null && (
                  <Text className="text-xs text-primary mt-2">{remainingDiagnoses} übrig</Text>
                )}
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
                {remainingMessages !== null && (
                  <Text className="text-xs text-primary mt-2">{remainingMessages} übrig</Text>
                )}
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
                <Text className="text-2xl font-bold text-primary">{dailyDiagnoses}</Text>
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

          {/* Settings Link */}
          <TouchableOpacity 
            className="bg-surface rounded-xl p-4 border border-border flex-row items-center gap-4"
            onPress={() => router.push("/settings")}
          >
            <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
              <IconSymbol name="gear" size={20} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-medium text-foreground">Einstellungen</Text>
              <Text className="text-sm text-muted">Aktuell: {tierInfo.name}</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
