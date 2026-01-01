import { ScrollView, Text, View, TouchableOpacity, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSubscription } from "@/lib/subscription-context";
import { SubscriptionBadge, UsageIndicator } from "@/components/upgrade-prompt";
import { TIER_INFO, TIER_LIMITS } from "@/lib/subscription";
import { AdBanner } from "@/components/ad-banner";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { tier, dailyDiagnoses, dailyMessages, remainingDiagnoses, remainingMessages } = useSubscription();
  const limits = TIER_LIMITS[tier];
  const tierInfo = TIER_INFO[tier];

  // Mock achievements data
  const achievements = {
    level: 5,
    xp: 450,
    xpToNext: 500,
    streak: 7,
    totalDiagnoses: 23,
  };

  return (
    <ScreenContainer>
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 32 }} 
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Profile */}
        <View className="px-4 pt-2 pb-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <TouchableOpacity 
                className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center"
                onPress={() => router.push("/settings")}
              >
                <IconSymbol name="person.fill" size={24} color={colors.primary} />
              </TouchableOpacity>
              <View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-lg font-bold text-foreground">Willkommen!</Text>
                  <SubscriptionBadge />
                </View>
                <Text className="text-sm text-muted">Level {achievements.level} Grower</Text>
              </View>
            </View>
            <TouchableOpacity 
              className="w-10 h-10 rounded-full bg-surface items-center justify-center"
              onPress={() => router.push("/settings")}
            >
              <IconSymbol name="bell.fill" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* XP Progress Bar */}
        <View className="px-4 mb-4">
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2">
                <IconSymbol name="flame.fill" size={18} color={colors.warning} />
                <Text className="text-sm font-medium text-foreground">{achievements.streak} Tage Streak!</Text>
              </View>
              <Text className="text-sm text-muted">{achievements.xp}/{achievements.xpToNext} XP</Text>
            </View>
            <View className="h-2 bg-border rounded-full overflow-hidden">
              <View 
                className="h-full rounded-full bg-primary"
                style={{ width: `${(achievements.xp / achievements.xpToNext) * 100}%` }}
              />
            </View>
          </View>
        </View>

        {/* Upgrade Banner for Free Users */}
        {tier === "free" && (
          <View className="px-4 mb-4">
            <TouchableOpacity 
              className="rounded-2xl overflow-hidden"
              onPress={() => router.push("/paywall")}
            >
              <View className="bg-primary p-4">
                <View className="flex-row items-center gap-3">
                  <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center">
                    <IconSymbol name="crown.fill" size={24} color="#fff" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-white">Upgrade auf Premium</Text>
                    <Text className="text-sm text-white/80">Unbegrenzte Scans & mehr Features</Text>
                  </View>
                  <IconSymbol name="chevron.right" size={24} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions Grid */}
        <View className="px-4 mb-4">
          <Text className="text-lg font-bold text-foreground mb-3">Schnellzugriff</Text>
          <View className="flex-row gap-3">
            {/* Live Scan - Primary Action */}
            <TouchableOpacity 
              className="flex-1 bg-primary rounded-2xl p-4 items-center gap-2"
              onPress={() => router.push("/(tabs)/diagnose")}
            >
              <View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center">
                <IconSymbol name="viewfinder" size={28} color="#fff" />
              </View>
              <Text className="text-base font-bold text-white">Live Scan</Text>
              <Text className="text-xs text-white/80">Echtzeit-Analyse</Text>
            </TouchableOpacity>

            {/* Coach */}
            <TouchableOpacity 
              className="flex-1 bg-surface rounded-2xl p-4 items-center gap-2 border border-border"
              onPress={() => router.push("/(tabs)/coach")}
            >
              <View className="w-14 h-14 rounded-full bg-primary/20 items-center justify-center">
                <IconSymbol name="message.fill" size={28} color={colors.primary} />
              </View>
              <Text className="text-base font-bold text-foreground">Coach</Text>
              <Text className="text-xs text-muted">Frag den Experten</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Daily Usage Card */}
        <View className="px-4 mb-4">
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-semibold text-foreground">Heutiges Kontingent</Text>
              <View 
                className="px-2 py-1 rounded-full"
                style={{ backgroundColor: tierInfo.color + "20" }}
              >
                <Text className="text-xs font-medium" style={{ color: tierInfo.color }}>
                  {tierInfo.name}
                </Text>
              </View>
            </View>
            
            <View className="gap-3">
              <UsageIndicator 
                used={dailyDiagnoses} 
                limit={limits.diagnosesPerDay} 
                label="Scans"
              />
              <UsageIndicator 
                used={dailyMessages} 
                limit={limits.coachMessagesPerDay} 
                label="Coach-Nachrichten"
              />
            </View>
          </View>
        </View>

        {/* Achievements Preview */}
        <View className="px-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-foreground">Erfolge</Text>
            <TouchableOpacity>
              <Text className="text-sm font-medium text-primary">Alle anzeigen</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4">
            <View className="flex-row gap-3">
              {/* Achievement Cards */}
              <View className="bg-surface rounded-2xl p-4 border border-border w-36 items-center">
                <View className="w-14 h-14 rounded-full bg-warning/20 items-center justify-center mb-2">
                  <Text className="text-2xl">🌱</Text>
                </View>
                <Text className="text-sm font-semibold text-foreground text-center">Erste Pflanze</Text>
                <Text className="text-xs text-muted">+50 XP</Text>
              </View>
              
              <View className="bg-surface rounded-2xl p-4 border border-border w-36 items-center">
                <View className="w-14 h-14 rounded-full bg-primary/20 items-center justify-center mb-2">
                  <Text className="text-2xl">🔍</Text>
                </View>
                <Text className="text-sm font-semibold text-foreground text-center">10 Diagnosen</Text>
                <Text className="text-xs text-muted">+100 XP</Text>
              </View>
              
              <View className="bg-surface rounded-2xl p-4 border border-border w-36 items-center opacity-50">
                <View className="w-14 h-14 rounded-full bg-muted/20 items-center justify-center mb-2">
                  <IconSymbol name="lock.fill" size={24} color={colors.muted} />
                </View>
                <Text className="text-sm font-semibold text-foreground text-center">7 Tage Streak</Text>
                <Text className="text-xs text-muted">+200 XP</Text>
              </View>
              
              <View className="bg-surface rounded-2xl p-4 border border-border w-36 items-center opacity-50">
                <View className="w-14 h-14 rounded-full bg-muted/20 items-center justify-center mb-2">
                  <IconSymbol name="lock.fill" size={24} color={colors.muted} />
                </View>
                <Text className="text-sm font-semibold text-foreground text-center">Master Grower</Text>
                <Text className="text-xs text-muted">+500 XP</Text>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Community Highlights */}
        <View className="px-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-foreground">Community</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/community")}>
              <Text className="text-sm font-medium text-primary">Mehr</Text>
            </TouchableOpacity>
          </View>
          
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <View className="flex-row items-center gap-3 mb-3">
              <View className="w-10 h-10 rounded-full bg-warning/20 items-center justify-center">
                <IconSymbol name="trophy.fill" size={20} color={colors.warning} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">Aktives Gewinnspiel</Text>
                <Text className="text-sm text-muted">Höchster Ertrag Q1 2026</Text>
              </View>
              <TouchableOpacity 
                className="bg-primary px-3 py-1.5 rounded-full"
                onPress={() => router.push("/(tabs)/community")}
              >
                <Text className="text-sm font-medium text-white">Teilnehmen</Text>
              </TouchableOpacity>
            </View>
            
            <View className="flex-row items-center gap-4 pt-3 border-t border-border">
              <View className="flex-row items-center gap-1">
                <IconSymbol name="person.2.fill" size={16} color={colors.muted} />
                <Text className="text-sm text-muted">234 Teilnehmer</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <IconSymbol name="gift.fill" size={16} color={colors.muted} />
                <Text className="text-sm text-muted">€500 Preis</Text>
              </View>
            </View>
          </View>
        </View>

        {/* My Plants Quick View */}
        <View className="px-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-foreground">Meine Pflanzen</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/plants")}>
              <Text className="text-sm font-medium text-primary">Alle anzeigen</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            className="bg-surface rounded-2xl p-4 border border-border flex-row items-center gap-4"
            onPress={() => router.push("/(tabs)/plants")}
          >
            <View className="w-14 h-14 rounded-xl bg-primary/20 items-center justify-center">
              <IconSymbol name="leaf.fill" size={28} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground">Pflanze hinzufügen</Text>
              <Text className="text-sm text-muted">Starte dein Grow-Tracking</Text>
            </View>
            <IconSymbol name="plus.circle.fill" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Sponsored Ad */}
        <View className="px-4 mb-4">
          <AdBanner position="home" variant="medium" />
        </View>

        {/* Tips Section */}
        <View className="px-4">
          <Text className="text-lg font-bold text-foreground mb-3">Tipp des Tages</Text>
          <View className="bg-primary/10 rounded-2xl p-4 border border-primary/30">
            <View className="flex-row items-start gap-3">
              <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
                <IconSymbol name="sparkles" size={20} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground mb-1">Optimale Luftfeuchtigkeit</Text>
                <Text className="text-sm text-muted leading-5">
                  In der Blütephase sollte die Luftfeuchtigkeit zwischen 40-50% liegen, um Schimmelbildung zu vermeiden und die Trichom-Produktion zu maximieren.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
