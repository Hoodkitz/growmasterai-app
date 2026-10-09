import { useEffect, useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, Alert, Switch, Platform, Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { restorePurchases, getSubscriptionStatus } from "@/lib/purchases";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSubscription } from "@/lib/subscription-context";
import { TIER_INFO, TIER_LIMITS, TIER_PRICING } from "@/lib/subscription";
import { useAppAuth } from "@/lib/auth-context";
import { ExpenseTracker } from "@/components/expenses/expense-tracker";
import type { Expense } from "@/lib/cost-tracking";

const EXPENSES_KEY = "grow_expenses";

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tier, upgradeTo, dailyDiagnoses, dailyMessages, refresh } = useSubscription();
  const { user, isAdmin, logout } = useAppAuth();
  const [notifications, setNotificationsState] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(EXPENSES_KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw) as Array<Omit<Expense, "date"> & { date: string }>;
        setExpenses(parsed.map((e) => ({ ...e, date: new Date(e.date) })));
      })
      .catch(() => {});
  }, []);

  const addExpense = (expense: Omit<Expense, "id">) => {
    const next = [...expenses, { ...expense, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }];
    setExpenses(next);
    AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(next)).catch(() => {});
  };

  useEffect(() => {
    AsyncStorage.getItem("@growmaster_notifications_enabled").then((v) => {
      if (v !== null) setNotificationsState(v === "true");
    });
  }, []);

  const setNotifications = (value: boolean) => {
    setNotificationsState(value);
    AsyncStorage.setItem("@growmaster_notifications_enabled", String(value)).catch(() => {});
  };
  const [darkMode, setDarkMode] = useState(true);

  const tierInfo = TIER_INFO[tier];
  const limits = TIER_LIMITS[tier];

  const handleCancelSubscription = () => {
    if (tier === "free") return;
    // Subscriptions can only be cancelled in the store account, not in-app.
    const url =
      Platform.OS === "ios"
        ? "https://apps.apple.com/account/subscriptions"
        : "https://play.google.com/store/account/subscriptions";
    Alert.alert(
      "Abo verwalten",
      "Abos werden im App Store bzw. Google Play gekündigt. Du behältst die Vorteile bis zum Ende des Abrechnungszeitraums.",
      [
        { text: "Abbrechen", style: "cancel" },
        { text: "Öffnen", onPress: () => Linking.openURL(url) },
      ]
    );
  };

  const handleRestorePurchases = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Nicht verfügbar", "Käufe können nur in der mobilen App wiederhergestellt werden.");
      return;
    }
    const result = await restorePurchases();
    if (!result.success) {
      Alert.alert("Fehler", result.error || "Käufe konnten nicht wiederhergestellt werden.");
      return;
    }
    const status = await getSubscriptionStatus();
    if (status.isActive) {
      await upgradeTo(status.tier);
      Alert.alert("Käufe wiederhergestellt", "Dein Abo wurde wiederhergestellt.");
    } else {
      Alert.alert("Keine Käufe gefunden", "Es wurden keine aktiven Abonnements für dieses Konto gefunden.");
    }
  };

  const handleResetUsage = () => {
    Alert.alert(
      "Nutzung zurücksetzen",
      "Dies ist nur für Testzwecke. Möchtest du die tägliche Nutzung zurücksetzen?",
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Zurücksetzen",
          onPress: async () => {
            await AsyncStorage.multiSet([
              ["@growmaster_daily_diagnoses", "0"],
              ["@growmaster_daily_messages", "0"],
            ]);
            await refresh();
            Alert.alert("Zurückgesetzt", "Die tägliche Nutzung wurde zurückgesetzt.");
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <IconSymbol name="chevron.right" size={24} color={colors.foreground} style={{ transform: [{ rotate: "180deg" }] }} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-foreground">Einstellungen</Text>
        <View className="w-10" />
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Plan */}
        <View className="bg-surface rounded-2xl p-4 border border-border mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-foreground">Aktuelles Abo</Text>
            <View 
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: tierInfo.color + "20" }}
            >
              <Text className="text-sm font-medium" style={{ color: tierInfo.color }}>
                {tierInfo.name}
              </Text>
            </View>
          </View>

          <Text className="text-base text-muted mb-4">{tierInfo.description}</Text>

          {/* Limits Info */}
          <View className="gap-2 mb-4">
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">Diagnosen/Tag</Text>
              <Text className="text-sm text-foreground font-medium">
                {limits.diagnosesPerDay === -1 ? "Unbegrenzt" : limits.diagnosesPerDay}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">Coach-Nachrichten/Tag</Text>
              <Text className="text-sm text-foreground font-medium">
                {limits.coachMessagesPerDay === -1 ? "Unbegrenzt" : limits.coachMessagesPerDay}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">Max. Pflanzen</Text>
              <Text className="text-sm text-foreground font-medium">
                {limits.maxPlants === -1 ? "Unbegrenzt" : limits.maxPlants}
              </Text>
            </View>
          </View>

          {tier === "free" ? (
            <TouchableOpacity 
              className="bg-primary rounded-xl p-4 items-center"
              onPress={() => router.push("/paywall")}
            >
              <Text className="text-base font-semibold text-background">Jetzt upgraden</Text>
            </TouchableOpacity>
          ) : (
            <View className="gap-3">
              <TouchableOpacity 
                className="bg-primary rounded-xl p-4 items-center"
                onPress={() => router.push("/paywall")}
              >
                <Text className="text-base font-semibold text-background">
                  {tier === "premium" ? "Auf Pro upgraden" : "Abo verwalten"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="border border-error rounded-xl p-4 items-center"
                onPress={handleCancelSubscription}
              >
                <Text className="text-base font-semibold text-error">Abo kündigen</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Today's Usage */}
        <View className="bg-surface rounded-2xl p-4 border border-border mb-6">
          <Text className="text-lg font-semibold text-foreground mb-4">Heutige Nutzung</Text>
          
          <View className="gap-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-base text-foreground">Diagnosen</Text>
              <Text className="text-base text-primary font-medium">
                {dailyDiagnoses}{limits.diagnosesPerDay !== -1 ? `/${limits.diagnosesPerDay}` : ""}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-base text-foreground">Coach-Nachrichten</Text>
              <Text className="text-base text-primary font-medium">
                {dailyMessages}{limits.coachMessagesPerDay !== -1 ? `/${limits.coachMessagesPerDay}` : ""}
              </Text>
            </View>
          </View>
        </View>

        {/* App Settings */}
        <View className="bg-surface rounded-2xl p-4 border border-border mb-6">
          <Text className="text-lg font-semibold text-foreground mb-4">App-Einstellungen</Text>
          
          <View className="gap-4">
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
                  <IconSymbol name="exclamationmark.triangle.fill" size={20} color={colors.primary} />
                </View>
                <Text className="text-base text-foreground">Benachrichtigungen</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        {/* Account Actions */}
        <View className="bg-surface rounded-2xl border border-border mb-6 overflow-hidden">
          <Text className="text-lg font-semibold text-foreground p-4 pb-2">Konto</Text>
          
          <TouchableOpacity 
            className="flex-row items-center justify-between p-4 border-t border-border"
            onPress={handleRestorePurchases}
          >
            <Text className="text-base text-foreground">Käufe wiederherstellen</Text>
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Admin Section */}
        {isAdmin && (
          <View className="bg-error/10 rounded-2xl border border-error/30 mb-6 overflow-hidden">
            <View className="flex-row items-center gap-2 p-4 pb-2">
              <IconSymbol name="shield.fill" size={20} color={colors.error} />
              <Text className="text-lg font-semibold text-foreground">Admin</Text>
            </View>
            
            <TouchableOpacity 
              className="flex-row items-center justify-between p-4 border-t border-error/30"
              onPress={() => router.push("/admin")}
            >
              <Text className="text-base text-foreground">Admin Panel öffnen</Text>
              <IconSymbol name="chevron.right" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}

        {/* Ausgaben-Tracker */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-2">Ausgaben</Text>
          <ExpenseTracker expenses={expenses} onAddExpense={addExpense} />
        </View>

        {/* Debug Section - only visible in development builds */}
        {__DEV__ && (
          <View className="bg-surface rounded-2xl border border-border mb-6 overflow-hidden">
            <Text className="text-lg font-semibold text-foreground p-4 pb-2">Entwickler</Text>

            <TouchableOpacity
              className="flex-row items-center justify-between p-4 border-t border-border"
              onPress={handleResetUsage}
            >
              <Text className="text-base text-foreground">Nutzung zurücksetzen</Text>
              <IconSymbol name="chevron.right" size={20} color={colors.muted} />
            </TouchableOpacity>



            <TouchableOpacity
              className="flex-row items-center justify-between p-4 border-t border-border"
              onPress={() => upgradeTo("free")}
            >
              <Text className="text-base text-foreground">Test: Free zurücksetzen</Text>
              <IconSymbol name="chevron.right" size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>
        )}

        {/* API Keys Section */}
        <View className="bg-surface rounded-2xl border border-border mb-6 overflow-hidden">
          <Text className="text-lg font-semibold text-foreground p-4 pb-2">API-Zugang</Text>
          
          <TouchableOpacity 
            className="flex-row items-center justify-between p-4 border-t border-border"
            onPress={() => router.push("/api-keys")}
          >
            <Text className="text-base text-foreground">API-Keys verwalten</Text>
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity 
            className="flex-row items-center justify-between p-4 border-t border-border"
            onPress={() => router.push("/webhooks")}
          >
            <Text className="text-base text-foreground">Webhooks verwalten</Text>
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Legal Section */}
        <View className="bg-surface rounded-2xl border border-border mb-6 overflow-hidden">
          <Text className="text-lg font-semibold text-foreground p-4 pb-2">Rechtliches</Text>
          
          <TouchableOpacity 
            className="flex-row items-center justify-between p-4 border-t border-border"
            onPress={() => router.push("/legal")}
          >
            <Text className="text-base text-foreground">Impressum, Datenschutz & AGB</Text>
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View className="items-center gap-2 py-4">
          <Text className="text-sm text-muted">GrowMaster AI v1.0.0</Text>
          <Text className="text-xs text-muted">© 2026 GrowMaster</Text>
        </View>
      </ScrollView>
    </View>
  );
}
