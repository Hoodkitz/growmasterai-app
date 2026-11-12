import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  formatPrice,
  getSmartGrowPackages,
  purchasePackage,
  restorePurchases,
} from "@/lib/purchases";
import { trpc } from "@/lib/trpc";

const FEATURES = [
  "Eigene Sensoren & Geräte verbinden (ESP32, Home Assistant, Shelly, AC Infinity …)",
  "KI-Autopilot: Licht, Klima, CO₂, Bewässerung, Dünger – phasenabhängig",
  "KI-Einschätzung alle 6 Stunden mit vorsichtiger Zielwert-Anpassung",
  "Kamera-Beobachtung: Blattprobleme, Phase, Größe, Farben",
  "Alarme aufs Handy, Notabschaltungen, Urlaubs-Modus",
];

/** Hinweis + Kauf des Add-ons „Smart Grow“ (Aufpreis zusätzlich zur App). */
export function AddonPaywall({ compact = false }: { compact?: boolean }) {
  const utils = trpc.useUtils();
  const [packages, setPackages] = useState<any[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => {
    if (Platform.OS === "web") return setPackages([]);
    getSmartGrowPackages()
      .then(setPackages)
      .catch(() => setPackages([]));
  }, []);

  const refreshAccess = async () => {
    // der Server erfährt den Kauf über den RevenueCat-Webhook – kurz warten und neu laden
    for (let i = 0; i < 5; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const a = await utils.smartGrow.access.fetch(undefined, { staleTime: 0 });
      if (a.active) break;
    }
    await utils.smartGrow.access.invalidate();
  };
  const buy = async (pkg: any) => {
    setBusy(pkg.identifier);
    try {
      const r = await purchasePackage(pkg);
      if (r.success) {
        await refreshAccess();
        Alert.alert("Danke!", "Smart Grow ist freigeschaltet.");
      } else if (!r.userCancelled)
        Alert.alert("Kauf nicht möglich", r.error ?? "Unbekannter Fehler");
    } finally {
      setBusy(null);
    }
  };

  return (
    <View
      testID="addon-paywall"
      className="bg-surface rounded-2xl p-4 border border-border gap-2"
    >
      <Text className="text-lg font-bold text-foreground">
        🔓 Add-on „Smart Grow“
      </Text>
      {!compact ? (
        FEATURES.map((f) => (
          <Text key={f} className="text-sm text-foreground">
            ✓ {f}
          </Text>
        ))
      ) : (
        <Text className="text-sm text-foreground">
          Echte Geräte, Autopilot, KI und Kamera gibt es mit dem Add-on. Der
          Simulator ist kostenlos.
        </Text>
      )}
      {packages === null ? (
        <ActivityIndicator />
      ) : packages.length ? (
        packages.map((p) => (
          <TouchableOpacity
            key={p.identifier}
            className="bg-primary rounded-xl p-4 items-center"
            disabled={!!busy}
            onPress={() => buy(p)}
          >
            {busy === p.identifier ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold">
                {p.packageType === "ANNUAL"
                  ? "Jährlich"
                  : p.packageType === "MONTHLY"
                    ? "Monatlich"
                    : (p.product?.title ?? "Freischalten")}{" "}
                – {formatPrice(p)}
              </Text>
            )}
          </TouchableOpacity>
        ))
      ) : (
        <Text className="text-xs text-muted">
          Das Add-on ist bald im Store erhältlich. Bis dahin kannst du den
          Simulator kostenlos ausprobieren.
        </Text>
      )}
      {packages?.length ? (
        <TouchableOpacity
          className="items-center p-2"
          onPress={async () => {
            const r = await restorePurchases();
            if (r.success) await refreshAccess();
          }}
        >
          <Text className="text-xs text-muted">Kauf wiederherstellen</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
