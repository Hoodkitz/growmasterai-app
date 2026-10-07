import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, Dimensions } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSubscription } from "@/lib/subscription-context";
import { SubscriptionBadge, UsageIndicator } from "@/components/upgrade-prompt";
import { TIER_INFO, TIER_LIMITS } from "@/lib/subscription";
import { AdBanner, type Ad } from "@/components/ad-banner";
import { trpc } from "@/lib/trpc";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getOnboardingStatus } from "@/components/onboarding/onboarding-flow";
import { useAppAuth } from "@/lib/auth-context";
import { useGamification } from "@/lib/gamification-context";
import { getMoonAge, getMoonPhase } from "@/lib/grow-tools";
import { PLANTS_KEY } from "@/lib/plants-storage";

interface HomePlant {
  id: string;
  name: string;
  strain?: string;
  phase?: "seedling" | "vegetative" | "flowering" | "harvest";
  deletedAt?: number | null;
}

const PHASE_LABELS: Record<string, string> = {
  seedling: "Keimling",
  vegetative: "Vegetativ",
  flowering: "Blüte",
  harvest: "Ernte",
};

const { width } = Dimensions.get("window");
const DIAL = Math.min(width - 48, 280);

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { tier, dailyDiagnoses, dailyMessages, remainingDiagnoses, remainingMessages } = useSubscription();

  // Echte Anzeige aus adBanners (nur für nicht-werbefreie Tiers laden)
  const adsQuery = trpc.ads.active.useQuery(
    { placement: "home", limit: 1 },
    { enabled: !TIER_LIMITS[tier].adFree, retry: false },
  );
  const trackImpression = trpc.ads.trackImpression.useMutation();
  const trackClick = trpc.ads.trackClick.useMutation();
  const homeAdRow = adsQuery.data?.[0];
  const homeAd: Ad | null = homeAdRow
    ? {
        id: String(homeAdRow.id),
        vendorName: homeAdRow.vendorName ?? "",
        vendorLogo: "📢",
        title: homeAdRow.title,
        subtitle: homeAdRow.vendorName ?? "Gesponsert",
        ctaText: "Ansehen",
        link: homeAdRow.targetUrl,
        backgroundColor: colors.surface,
        accentColor: colors.primary,
      }
    : null;
  const limits = TIER_LIMITS[tier];
  const tierInfo = TIER_INFO[tier];

  // Check if onboarding is complete
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const onboardingComplete = await getOnboardingStatus();
        if (!onboardingComplete) {
          router.replace("/onboarding");
        }
      } catch (error) {
        console.log("Error checking onboarding status");
      }
    };
    checkOnboarding();
  }, []);

    const { user, isAuthenticated } = useAppAuth();
  const { points, level, levelProgress, stats } = useGamification();
  const moon = getMoonPhase();
  const moonAge = getMoonAge();
  const [plants, setPlants] = useState<HomePlant[]>([]);

  // Pflanzen bei jedem Fokus neu laden (gleicher Speicher wie der Pflanzen-Tab)
  useFocusEffect(
    useCallback(() => {
      let active = true;
      AsyncStorage.getItem(PLANTS_KEY)
        .then((raw) => {
          if (!active) return;
          const parsed: HomePlant[] = raw ? JSON.parse(raw) : [];
          setPlants(parsed.filter((pl) => !pl.deletedAt));
        })
        .catch(() => active && setPlants([]));
      return () => {
        active = false;
      };
    }, []),
  );

  const achievements = {
    level: level.level,
    xp: points,
    streak: stats.loginStreak ?? 0,
  };

  return (
    <ScreenContainer>
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 32 }} 
        showsVerticalScrollIndicator={false}
      >
        {/* Mondzyklus als Uhr + Tipp für heute */}
        <View className="px-4 pt-2 mb-4 items-center">
          <View style={{ width: DIAL, height: DIAL, alignItems: "center", justifyContent: "center" }}>
            {Array.from({ length: 30 }).map((_, i) => {
              const reached = i <= Math.floor(moonAge);
              return (
                <View
                  key={i}
                  style={{
                    position: "absolute",
                    left: DIAL / 2 - 1.5,
                    top: DIAL / 2 - (i % 5 === 0 ? 8 : 5),
                    width: 3,
                    height: i % 5 === 0 ? 16 : 10,
                    borderRadius: 2,
                    backgroundColor: reached ? colors.primary : colors.border,
                    transform: [{ rotate: `${i * 12}deg` }, { translateY: -(DIAL / 2 - 10) }],
                  }}
                />
              );
            })}
            <View
              style={{
                width: DIAL - 56,
                height: DIAL - 56,
                borderRadius: (DIAL - 56) / 2,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 96, lineHeight: 112 }}>{moon.emoji}</Text>
            </View>
          </View>
          <Text className="text-2xl font-bold text-foreground mt-3">{moon.name}</Text>
          <Text className="text-sm text-muted">
            Tag {Math.floor(moonAge) + 1} von 30 · {moon.percentage}% beleuchtet
          </Text>

          <View className="w-full bg-primary/15 rounded-2xl p-4 border border-primary/40 mt-4">
            <Text className="text-xs text-muted mb-1">Tipp für heute</Text>
            <Text className="text-base text-foreground leading-6">{moon.growTip}</Text>
          </View>
        </View>

        {/* Login-Aufforderung */}
        {!isAuthenticated && (
          <View className="px-4 mb-4">
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-base font-semibold text-foreground mb-1">Melde dich an</Text>
              <Text className="text-sm text-muted mb-3">
                Sichere deine Pflanzen, synchronisiere sie auf allen Geräten und sammle XP.
              </Text>
              <TouchableOpacity
                className="bg-primary rounded-xl py-3 items-center"
                onPress={() => router.push("/login")}
              >
                <Text className="text-base font-semibold text-white">Anmelden / Registrieren</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Header with Profile */}
        <View className="px-4 pb-4">
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
                  <Text className="text-lg font-bold text-foreground">{isAuthenticated && user?.name ? `Hi, ${user.name}` : "Willkommen!"}</Text>
                  <SubscriptionBadge />
                </View>
                <Text className="text-sm text-muted">Level {achievements.level} · {level.title}</Text>
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
              <Text className="text-sm text-muted">{achievements.xp} XP</Text>
            </View>
            <View className="h-2 bg-border rounded-full overflow-hidden">
              <View 
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(100, Math.max(0, levelProgress))}%` }}
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
          
          {/* Primary Action - Diagnose */}
          <TouchableOpacity 
            className="bg-primary rounded-2xl p-6 items-center gap-3 mb-3"
            onPress={() => router.push("/(tabs)/diagnose")}
          >
            <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center">
              <IconSymbol name="camera.fill" size={32} color="#fff" />
            </View>
            <View className="items-center">
              <Text className="text-xl font-bold text-white">Pflanze scannen</Text>
              <Text className="text-sm text-white/80">KI-gestützte Diagnose</Text>
            </View>
          </TouchableOpacity>
          
          {/* Secondary Actions */}
          <View className="flex-row gap-3">
            <TouchableOpacity 
              className="flex-1 bg-surface rounded-2xl p-4 items-center gap-2 border border-border"
              onPress={() => router.push("/(tabs)/coach")}
            >
              <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center">
                <IconSymbol name="message.fill" size={24} color={colors.primary} />
              </View>
              <Text className="text-base font-bold text-foreground">Coach</Text>
              <Text className="text-xs text-muted">Frag den Experten</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-1 bg-surface rounded-2xl p-4 items-center gap-2 border border-border"
              onPress={() => router.push("/tools")}
            >
              <View className="w-12 h-12 rounded-full bg-warning/20 items-center justify-center">
                <IconSymbol name="wrench.fill" size={24} color={colors.warning} />
              </View>
              <Text className="text-base font-bold text-foreground">Tools</Text>
              <Text className="text-xs text-muted">Rechner & Kalender</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-1 bg-surface rounded-2xl p-4 items-center gap-2 border border-border"
              onPress={() => router.push("/marketplace")}
            >
              <View className="w-12 h-12 rounded-full bg-success/20 items-center justify-center">
                <IconSymbol name="cart.fill" size={24} color={colors.success} />
              </View>
              <Text className="text-base font-bold text-foreground">Shop</Text>
              <Text className="text-xs text-muted">Seeds & Equipment</Text>
            </TouchableOpacity>
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

          {plants.slice(0, 3).map((pl) => (
            <TouchableOpacity
              key={pl.id}
              className="bg-surface rounded-2xl p-4 border border-border flex-row items-center gap-4 mb-2"
              onPress={() => router.push("/(tabs)/plants")}
            >
              <View className="w-12 h-12 rounded-xl bg-primary/20 items-center justify-center">
                <IconSymbol name="leaf.fill" size={24} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">{pl.name}</Text>
                <Text className="text-sm text-muted">
                  {[pl.strain, pl.phase ? PHASE_LABELS[pl.phase] : null].filter(Boolean).join(" · ") || "Keine Details"}
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.muted} />
            </TouchableOpacity>
          ))}
          {plants.length > 3 && (
            <Text className="text-sm text-muted mb-2">+ {plants.length - 3} weitere</Text>
          )}

          <TouchableOpacity
            className="bg-surface rounded-2xl p-4 border border-border flex-row items-center gap-4"
            onPress={() => router.push("/(tabs)/plants")}
          >
            <View className="w-12 h-12 rounded-xl bg-primary/20 items-center justify-center">
              <IconSymbol name="plus.circle.fill" size={24} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground">Pflanze hinzufügen</Text>
              <Text className="text-sm text-muted">
                {plants.length === 0 ? "Starte dein Grow-Tracking" : `${plants.length} Pflanze${plants.length === 1 ? "" : "n"} aktiv`}
              </Text>
            </View>
          </TouchableOpacity>
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

        {/* Sponsored Ad */}
        <View className="px-4 mb-4">
          <AdBanner
            position="home"
            variant="medium"
            ad={homeAd}
            onImpression={() => homeAdRow && trackImpression.mutate({ id: homeAdRow.id })}
            onClick={() => homeAdRow && trackClick.mutate({ id: homeAdRow.id })}
          />
        </View>

      </ScrollView>
    </ScreenContainer>
  );
}
