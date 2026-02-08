import { useEffect, useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, Alert, ActivityIndicator, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSubscription } from "@/lib/subscription-context";
import {
  TIER_INFO,
  TIER_PRICING,
} from "@/lib/subscription";
import {
  initializePurchases,
  getOfferings,
  purchasePackage,
  restorePurchases,
  formatPrice,
  getSubscriptionStatus,
  isPurchasesAvailable,
  getPurchaseErrorMessage,
} from "@/lib/purchases";

type BillingPeriod = "monthly" | "yearly";

export default function PaywallScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tier: currentTier, setTier } = useSubscription();

  const [selectedTier, setSelectedTier] = useState<"premium" | "pro">("premium");
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("yearly");
  const [isLoading, setIsLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [offerings, setOfferings] = useState<any>(null);
  const [rcReady, setRcReady] = useState(false);

  // Initialisiere RevenueCat und lade Offerings beim Öffnen der Paywall
  useEffect(() => {
    if (Platform.OS === "web") return;

    let cancelled = false;
    (async () => {
      const ok = await initializePurchases();
      if (cancelled) return;
      setRcReady(ok);

      if (ok) {
        const off = await getOfferings();
        if (!cancelled) setOfferings(off);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // Finde das richtige Paket aus dem Offering
  const getSelectedPackage = () => {
    if (!offerings) return null;
    const packages = offerings.availablePackages || [];

    if (billingPeriod === "yearly") {
      return offerings.annual ?? packages.find((p: any) => p.identifier === "$rc_annual") ?? null;
    }
    return offerings.monthly ?? packages.find((p: any) => p.identifier === "$rc_monthly") ?? null;
  };

  const handlePurchase = async () => {
    const pkg = getSelectedPackage();

    if (pkg) {
      setIsLoading(true);
      try {
        const result = await purchasePackage(pkg);

        if (result.success) {
          // Sync tier from RevenueCat
          const status = await getSubscriptionStatus();
          setTier(status.tier);
          Alert.alert(
            "Kauf erfolgreich!",
            `Willkommen bei GrowMaster ${status.tier === "pro" ? "Pro" : "Premium"}! Alle Features sind jetzt freigeschaltet.`,
            [{ text: "OK", onPress: () => router.back() }]
          );
        } else if (result.userCancelled) {
          // User hat abgebrochen — kein Alert nötig
        } else {
          Alert.alert("Kauf fehlgeschlagen", getPurchaseErrorMessage({ message: result.error }));
        }
      } catch (error: any) {
        Alert.alert("Fehler", getPurchaseErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Kein Paket verfügbar
    if (!rcReady) {
      Alert.alert(
        "Nicht verfügbar",
        "In-App-Käufe konnten nicht initialisiert werden. Bitte stelle sicher, dass du eine aktive Internetverbindung hast und versuche es erneut.",
        [{ text: "OK" }]
      );
    } else {
      Alert.alert(
        "Keine Pakete gefunden",
        "Die Abo-Pakete konnten nicht geladen werden. Bitte versuche es später erneut.",
        [{ text: "OK" }]
      );
    }
  };

  const handleRestore = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Nicht verfügbar", "Käufe können nur in der mobilen App wiederhergestellt werden.");
      return;
    }

    setRestoring(true);
    try {
      if (!rcReady) {
        const ok = await initializePurchases();
        if (!ok) {
          Alert.alert("Fehler", "RevenueCat konnte nicht initialisiert werden.");
          setRestoring(false);
          return;
        }
      }

      const result = await restorePurchases();
      if (result.success && result.hasActiveEntitlement) {
        const status = await getSubscriptionStatus();
        setTier(status.tier);
        Alert.alert("Käufe wiederhergestellt!", `Dein Abo wurde wiederhergestellt.`);
      } else {
        Alert.alert("Keine Käufe gefunden", "Es wurden keine aktiven Abonnements für dieses Konto gefunden.");
      }
    } catch (error) {
      Alert.alert("Fehler", "Käufe konnten nicht wiederhergestellt werden.");
    } finally {
      setRestoring(false);
    }
  };

  const pricing = TIER_PRICING[selectedTier];

  // Preis: Nutze RevenueCat wenn verfügbar, sonst Fallback-Preise
  const getDisplayPrice = () => {
    const pkg = getSelectedPackage();
    if (pkg) return formatPrice(pkg);
    const price = billingPeriod === "monthly" ? pricing.monthly : pricing.yearly;
    return `€${price.toFixed(2)}`;
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <IconSymbol name="xmark.circle.fill" size={28} color={colors.muted} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-foreground">Upgrade</Text>
        <TouchableOpacity onPress={handleRestore} disabled={restoring} className="p-2">
          {restoring ? (
            <ActivityIndicator size="small" color={colors.muted} />
          ) : (
            <Text className="text-sm text-primary">Wiederherstellen</Text>
          )}
        </TouchableOpacity>
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
                <IconSymbol name="checkmark.circle.fill" size={16} color={colors.warning} style={{ width: 64, textAlign: "center" } as any} />
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
        <View className="bg-primary/10 rounded-xl p-4 flex-row items-center gap-3 mb-6">
          <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
          <View className="flex-1">
            <Text className="text-foreground font-medium">7 Tage Geld-zurück-Garantie</Text>
            <Text className="text-sm text-muted">Nicht zufrieden? Volle Erstattung, keine Fragen.</Text>
          </View>
        </View>

        {/* Legal Links */}
        <View className="flex-row justify-center gap-4 mb-4">
          <TouchableOpacity onPress={() => router.push("/legal")}>
            <Text className="text-sm text-primary">AGB</Text>
          </TouchableOpacity>
          <Text className="text-muted">•</Text>
          <TouchableOpacity onPress={() => router.push("/legal")}>
            <Text className="text-sm text-primary">Datenschutz</Text>
          </TouchableOpacity>
          <Text className="text-muted">•</Text>
          <TouchableOpacity onPress={() => router.push("/legal")}>
            <Text className="text-sm text-primary">Impressum</Text>
          </TouchableOpacity>
        </View>

        {/* Legal Text */}
        <Text className="text-xs text-muted text-center leading-5">
          Die Zahlung wird über deinen {Platform.OS === "ios" ? "Apple" : Platform.OS === "android" ? "Google" : "App Store"} Account abgerechnet.
          Das Abo verlängert sich automatisch, wenn es nicht mindestens 24 Stunden vor Ablauf gekündigt wird.
        </Text>
      </ScrollView>

      {/* Purchase Button */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-4"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <TouchableOpacity
          className="rounded-xl p-4 items-center flex-row justify-center gap-2"
          style={{ backgroundColor: selectedTier === "pro" ? colors.warning : colors.primary }}
          onPress={handlePurchase}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text className="text-lg font-bold text-background">
                {selectedTier === "premium" ? "Premium" : "Pro"} starten
              </Text>
              <Text className="text-sm text-background/80">
                {getDisplayPrice()}{billingPeriod === "yearly" ? "/Jahr" : "/Monat"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
