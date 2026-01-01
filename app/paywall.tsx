import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSubscription } from "@/lib/subscription-context";
import { 
  SubscriptionTier, 
  TIER_INFO, 
  TIER_PRICING,
  TIER_LIMITS 
} from "@/lib/subscription";

type BillingPeriod = "monthly" | "yearly";

export default function PaywallScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tier: currentTier, upgradeTo } = useSubscription();
  const [selectedTier, setSelectedTier] = useState<"premium" | "pro">("premium");
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("yearly");

  const handlePurchase = async () => {
    // In a real app, this would integrate with App Store / Google Play
    Alert.alert(
      "Upgrade bestätigen",
      `Möchtest du auf ${TIER_INFO[selectedTier].name} upgraden?`,
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Bestätigen",
          onPress: async () => {
            await upgradeTo(selectedTier);
            Alert.alert(
              "Erfolgreich!",
              `Du bist jetzt ${TIER_INFO[selectedTier].name} Mitglied!`,
              [{ text: "OK", onPress: () => router.back() }]
            );
          },
        },
      ]
    );
  };

  const pricing = TIER_PRICING[selectedTier];
  const price = billingPeriod === "monthly" ? pricing.monthly : pricing.yearly;
  const monthlyPrice = billingPeriod === "monthly" ? pricing.monthly : pricing.yearlyMonthly;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <IconSymbol name="xmark.circle.fill" size={28} color={colors.muted} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-foreground">Upgrade</Text>
        <View className="w-10" />
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View className="items-center gap-3 mb-6">
          <View className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center">
            <IconSymbol name="leaf.fill" size={40} color={colors.primary} />
          </View>
          <Text className="text-2xl font-bold text-foreground text-center">
            Entfessle das volle Potenzial
          </Text>
          <Text className="text-base text-muted text-center">
            Wähle den Plan, der zu dir passt
          </Text>
        </View>

        {/* Current Plan Badge */}
        {currentTier !== "free" && (
          <View className="bg-primary/10 rounded-xl p-3 mb-4 flex-row items-center justify-center gap-2">
            <IconSymbol name="checkmark.circle.fill" size={20} color={colors.primary} />
            <Text className="text-primary font-medium">
              Aktueller Plan: {TIER_INFO[currentTier].name}
            </Text>
          </View>
        )}

        {/* Billing Toggle */}
        <View className="bg-surface rounded-xl p-1 flex-row mb-6">
          <TouchableOpacity
            className={`flex-1 py-3 rounded-lg ${billingPeriod === "monthly" ? "bg-primary" : ""}`}
            onPress={() => setBillingPeriod("monthly")}
          >
            <Text className={`text-center font-medium ${billingPeriod === "monthly" ? "text-background" : "text-foreground"}`}>
              Monatlich
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-3 rounded-lg ${billingPeriod === "yearly" ? "bg-primary" : ""}`}
            onPress={() => setBillingPeriod("yearly")}
          >
            <View className="items-center">
              <Text className={`font-medium ${billingPeriod === "yearly" ? "text-background" : "text-foreground"}`}>
                Jährlich
              </Text>
              <Text className={`text-xs ${billingPeriod === "yearly" ? "text-background/80" : "text-primary"}`}>
                Spare {pricing.savings}%
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Plan Cards */}
        <View className="gap-4 mb-6">
          {/* Premium Card */}
          <TouchableOpacity
            className={`rounded-2xl p-4 border-2 ${
              selectedTier === "premium" ? "border-primary bg-primary/5" : "border-border bg-surface"
            }`}
            onPress={() => setSelectedTier("premium")}
          >
            <View className="flex-row justify-between items-start mb-3">
              <View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-xl font-bold text-foreground">Premium</Text>
                  {selectedTier === "premium" && (
                    <View className="bg-primary px-2 py-0.5 rounded-full">
                      <Text className="text-xs text-background font-medium">Beliebt</Text>
                    </View>
                  )}
                </View>
                <Text className="text-sm text-muted">{TIER_INFO.premium.description}</Text>
              </View>
              <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                selectedTier === "premium" ? "border-primary bg-primary" : "border-border"
              }`}>
                {selectedTier === "premium" && (
                  <IconSymbol name="checkmark.circle.fill" size={16} color="#fff" />
                )}
              </View>
            </View>
            
            <View className="flex-row items-baseline gap-1 mb-3">
              <Text className="text-3xl font-bold text-foreground">
                €{billingPeriod === "monthly" ? TIER_PRICING.premium.monthly.toFixed(2) : TIER_PRICING.premium.yearlyMonthly.toFixed(2)}
              </Text>
              <Text className="text-muted">/Monat</Text>
              {billingPeriod === "yearly" && (
                <Text className="text-sm text-muted ml-2">(€{TIER_PRICING.premium.yearly.toFixed(2)}/Jahr)</Text>
              )}
            </View>

            <View className="gap-2">
              {TIER_INFO.premium.features.slice(0, 5).map((feature, index) => (
                <View key={index} className="flex-row items-center gap-2">
                  <IconSymbol name="checkmark.circle.fill" size={16} color={colors.primary} />
                  <Text className="text-sm text-foreground">{feature}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>

          {/* Pro Card */}
          <TouchableOpacity
            className={`rounded-2xl p-4 border-2 ${
              selectedTier === "pro" ? "border-warning bg-warning/5" : "border-border bg-surface"
            }`}
            onPress={() => setSelectedTier("pro")}
          >
            <View className="flex-row justify-between items-start mb-3">
              <View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-xl font-bold text-foreground">Pro</Text>
                  <View className="bg-warning px-2 py-0.5 rounded-full">
                    <Text className="text-xs text-background font-medium">Unbegrenzt</Text>
                  </View>
                </View>
                <Text className="text-sm text-muted">{TIER_INFO.pro.description}</Text>
              </View>
              <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                selectedTier === "pro" ? "border-warning bg-warning" : "border-border"
              }`}>
                {selectedTier === "pro" && (
                  <IconSymbol name="checkmark.circle.fill" size={16} color="#fff" />
                )}
              </View>
            </View>
            
            <View className="flex-row items-baseline gap-1 mb-3">
              <Text className="text-3xl font-bold text-foreground">
                €{billingPeriod === "monthly" ? TIER_PRICING.pro.monthly.toFixed(2) : TIER_PRICING.pro.yearlyMonthly.toFixed(2)}
              </Text>
              <Text className="text-muted">/Monat</Text>
              {billingPeriod === "yearly" && (
                <Text className="text-sm text-muted ml-2">(€{TIER_PRICING.pro.yearly.toFixed(2)}/Jahr)</Text>
              )}
            </View>

            <View className="gap-2">
              {TIER_INFO.pro.features.slice(0, 5).map((feature, index) => (
                <View key={index} className="flex-row items-center gap-2">
                  <IconSymbol name="checkmark.circle.fill" size={16} color={colors.warning} />
                  <Text className="text-sm text-foreground">{feature}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        </View>

        {/* Feature Comparison */}
        <View className="bg-surface rounded-2xl p-4 border border-border mb-6">
          <Text className="text-lg font-semibold text-foreground mb-4">Vergleich</Text>
          
          <View className="gap-3">
            <View className="flex-row justify-between items-center py-2 border-b border-border">
              <Text className="text-foreground">Diagnosen/Tag</Text>
              <View className="flex-row gap-4">
                <Text className="text-muted w-16 text-center">3</Text>
                <Text className="text-primary w-16 text-center">15</Text>
                <Text className="text-warning w-16 text-center">∞</Text>
              </View>
            </View>
            <View className="flex-row justify-between items-center py-2 border-b border-border">
              <Text className="text-foreground">Coach-Nachrichten</Text>
              <View className="flex-row gap-4">
                <Text className="text-muted w-16 text-center">5</Text>
                <Text className="text-primary w-16 text-center">50</Text>
                <Text className="text-warning w-16 text-center">∞</Text>
              </View>
            </View>
            <View className="flex-row justify-between items-center py-2 border-b border-border">
              <Text className="text-foreground">Pflanzen</Text>
              <View className="flex-row gap-4">
                <Text className="text-muted w-16 text-center">2</Text>
                <Text className="text-primary w-16 text-center">10</Text>
                <Text className="text-warning w-16 text-center">∞</Text>
              </View>
            </View>
            <View className="flex-row justify-between items-center py-2">
              <Text className="text-foreground">Prioritäts-Support</Text>
              <View className="flex-row gap-4">
                <Text className="text-muted w-16 text-center">—</Text>
                <Text className="text-muted w-16 text-center">—</Text>
                <IconSymbol name="checkmark.circle.fill" size={16} color={colors.warning} style={{ width: 64, textAlign: "center" }} />
              </View>
            </View>
          </View>
          
          <View className="flex-row justify-end gap-4 mt-2">
            <Text className="text-xs text-muted w-16 text-center">Free</Text>
            <Text className="text-xs text-primary w-16 text-center">Premium</Text>
            <Text className="text-xs text-warning w-16 text-center">Pro</Text>
          </View>
        </View>

        {/* Guarantee */}
        <View className="bg-primary/10 rounded-xl p-4 flex-row items-center gap-3">
          <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
          <View className="flex-1">
            <Text className="text-foreground font-medium">7 Tage Geld-zurück-Garantie</Text>
            <Text className="text-sm text-muted">Nicht zufrieden? Volle Erstattung, keine Fragen.</Text>
          </View>
        </View>
      </ScrollView>

      {/* Purchase Button */}
      <View 
        className="absolute bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-4"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <TouchableOpacity
          className="rounded-xl p-4 items-center"
          style={{ backgroundColor: selectedTier === "pro" ? colors.warning : colors.primary }}
          onPress={handlePurchase}
        >
          <Text className="text-lg font-bold text-background">
            {selectedTier === "premium" ? "Premium" : "Pro"} für €{price.toFixed(2)}{billingPeriod === "yearly" ? "/Jahr" : "/Monat"}
          </Text>
          <Text className="text-sm text-background/80">
            Jederzeit kündbar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
