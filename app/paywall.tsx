import { useEffect, useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, Alert, ActivityIndicator, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSubscription } from "@/lib/subscription-context";
import {
  TIER_INFO,
  TIER_LIMITS,
  TIER_PRICING,
} from "@/lib/subscription";
import {
  initializePurchases,
  getTierOfferings,
  purchasePackage,
  restorePurchases,
  formatPrice,
  getSubscriptionStatus,
  isPurchasesAvailable,
  getPurchaseErrorMessage,
  PRODUCT_IDS,
} from "@/lib/purchases";

type PaidTier = "premium" | "pro";
type BillingPeriod = "monthly" | "yearly" | "lifetime";

export default function PaywallScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tier: currentTier, setTier } = useSubscription();

  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("yearly");
  const [isLoading, setIsLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [tierOfferings, setTierOfferings] = useState<Partial<Record<PaidTier, any>>>({});
  const [selectedTier, setSelectedTier] = useState<PaidTier>("pro");
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
        const off = await getTierOfferings();
        if (cancelled) return;
        setTierOfferings(off);
        // Nur konfigurierte Tiers anbieten; Pro bleibt Fallback
        if (!off.pro && off.premium) setSelectedTier("premium");
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // Angebotene Tiers: nur solche mit konfiguriertem Offering/Paketen (Pro-Fallback ohne Premium)
  const availableTiers: PaidTier[] = (["premium", "pro"] as const).filter((t) => !!tierOfferings[t]);
  const offerings = tierOfferings[selectedTier] ?? null;

  // Finde das richtige Paket aus dem Offering
  const getPackageFor = (billingPeriod: BillingPeriod) => {
    if (!offerings) return null;
    const packages = offerings.availablePackages || [];

    if (billingPeriod === "lifetime") {
      return offerings.lifetime ?? packages.find((p: any) => p.identifier === "$rc_lifetime" || p.product?.identifier === PRODUCT_IDS.LIFETIME) ?? null;
    }
    if (billingPeriod === "yearly") {
      return offerings.annual ?? packages.find((p: any) => p.identifier === "$rc_annual") ?? null;
    }
    return offerings.monthly ?? packages.find((p: any) => p.identifier === "$rc_monthly") ?? null;
  };
  const getSelectedPackage = () => getPackageFor(billingPeriod);

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

  // Tier-Mapping ist per Env konfigurierbar (lib/entitlements.ts, docs/REVENUECAT_TIERS.md).
  // Ohne Premium-Offering wird nur Pro angeboten.
  const pricing = TIER_PRICING[selectedTier];
  const hasLifetime = !!getPackageFor("lifetime");

  const fmt = (n: number) => (n === -1 ? "∞" : String(n));
  const comparisonRows: { label: string; free: string; pro: string }[] = [
    { label: "Diagnosen/Tag", free: fmt(TIER_LIMITS.free.diagnosesPerDay), pro: fmt(TIER_LIMITS.pro.diagnosesPerDay) },
    { label: "Coach-Nachrichten", free: fmt(TIER_LIMITS.free.coachMessagesPerDay), pro: fmt(TIER_LIMITS.pro.coachMessagesPerDay) },
    { label: "Pflanzen", free: fmt(TIER_LIMITS.free.maxPlants), pro: fmt(TIER_LIMITS.pro.maxPlants) },
    { label: "Journal-Einträge", free: fmt(TIER_LIMITS.free.maxJournalEntries), pro: fmt(TIER_LIMITS.pro.maxJournalEntries) },
    { label: "Werbefrei", free: TIER_LIMITS.free.adFree ? "✓" : "—", pro: TIER_LIMITS.pro.adFree ? "✓" : "—" },
    { label: "Daten-Export", free: TIER_LIMITS.free.exportData ? "✓" : "—", pro: TIER_LIMITS.pro.exportData ? "✓" : "—" },
    { label: "Prioritäts-Support", free: TIER_LIMITS.free.prioritySupport ? "✓" : "—", pro: TIER_LIMITS.pro.prioritySupport ? "✓" : "—" },
  ];

  // Preis: Nutze RevenueCat wenn verfügbar, sonst Fallback-Preise
  const getDisplayPrice = () => {
    const pkg = getSelectedPackage();
    if (pkg) return formatPrice(pkg);
    if (billingPeriod === "lifetime") return "—";
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
          {hasLifetime && (
            <TouchableOpacity
              className={`flex-1 py-3 rounded-lg ${billingPeriod === "lifetime" ? "bg-primary" : ""}`}
              onPress={() => setBillingPeriod("lifetime")}
            >
              <Text className={`text-center font-medium ${billingPeriod === "lifetime" ? "text-background" : "text-foreground"}`}>
                Lifetime
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tier-Auswahl (nur wenn mehrere Tiers konfiguriert sind) */}
        {availableTiers.length > 1 && (
          <View className="bg-surface rounded-xl p-1 flex-row mb-4">
            {availableTiers.map((t) => (
              <TouchableOpacity
                key={t}
                className={`flex-1 py-3 rounded-lg ${selectedTier === t ? "bg-primary" : ""}`}
                onPress={() => setSelectedTier(t)}
              >
                <Text className={`text-center font-medium ${selectedTier === t ? "text-background" : "text-foreground"}`}>
                  {TIER_INFO[t].name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Plan Card */}
        <View className="rounded-2xl p-4 border-2 border-warning bg-warning/5 mb-6">
          <View className="mb-3">
            <View className="flex-row items-center gap-2">
              <Text className="text-xl font-bold text-foreground">{TIER_INFO[selectedTier].name}</Text>
              {selectedTier === "pro" && (
                <View className="bg-warning px-2 py-0.5 rounded-full">
                  <Text className="text-xs text-background font-medium">Unbegrenzt</Text>
                </View>
              )}
            </View>
            <Text className="text-sm text-muted">{TIER_INFO[selectedTier].description}</Text>
          </View>

          <View className="flex-row items-baseline gap-1 mb-3">
            <Text className="text-3xl font-bold text-foreground">{getDisplayPrice()}</Text>
            <Text className="text-muted">{billingPeriod === "lifetime" ? "einmalig" : billingPeriod === "yearly" ? "/Jahr" : "/Monat"}</Text>
          </View>

          <View className="gap-2">
            {TIER_INFO[selectedTier].features.slice(0, 5).map((feature, index) => (
              <View key={index} className="flex-row items-center gap-2">
                <IconSymbol name="checkmark.circle.fill" size={16} color={colors.warning} />
                <Text className="text-sm text-foreground">{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Feature Comparison (Werte aus TIER_LIMITS) */}
        <View className="bg-surface rounded-2xl p-4 border border-border mb-6">
          <Text className="text-lg font-semibold text-foreground mb-4">Vergleich</Text>

          <View className="gap-3">
            {comparisonRows.map((row, i) => (
              <View
                key={row.label}
                className={`flex-row justify-between items-center py-2 ${i < comparisonRows.length - 1 ? "border-b border-border" : ""}`}
              >
                <Text className="text-foreground">{row.label}</Text>
                <View className="flex-row gap-4">
                  <Text className="text-muted w-16 text-center">{row.free}</Text>
                  <Text className="text-warning w-16 text-center">{row.pro}</Text>
                </View>
              </View>
            ))}
          </View>

          <View className="flex-row justify-end gap-4 mt-2">
            <Text className="text-xs text-muted w-16 text-center">Free</Text>
            <Text className="text-xs text-warning w-16 text-center">Pro</Text>
          </View>
        </View>

        {/* Hinweis statt nicht durchsetzbarer Garantie */}
        <View className="bg-primary/10 rounded-xl p-4 flex-row items-center gap-3 mb-6">
          <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
          <View className="flex-1">
            <Text className="text-foreground font-medium">Erstattung nach Store-Richtlinien</Text>
            <Text className="text-sm text-muted">
              Rückerstattungen richten sich nach den Bedingungen von Apple bzw. Google und werden dort beantragt.
            </Text>
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
          Abos verlängern sich automatisch, wenn es nicht mindestens 24 Stunden vor Ablauf gekündigt wird.
        </Text>
      </ScrollView>

      {/* Purchase Button */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-4"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <TouchableOpacity
          className="rounded-xl p-4 items-center flex-row justify-center gap-2"
          style={{ backgroundColor: colors.warning }}
          onPress={handlePurchase}
          disabled={isLoading || (billingPeriod === "lifetime" && !hasLifetime)}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text className="text-lg font-bold text-background">
                Pro starten
              </Text>
              <Text className="text-sm text-background/80">
                {getDisplayPrice()}{billingPeriod === "lifetime" ? " einmalig" : billingPeriod === "yearly" ? "/Jahr" : "/Monat"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
