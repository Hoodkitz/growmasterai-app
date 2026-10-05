import { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSubscription } from "@/lib/subscription-context";
import { TIER_LIMITS } from "@/lib/subscription";

export interface AdBannerProps {
  position: "home" | "community" | "marketplace";
  /** Echte Anzeige (z.B. aus der adBanners-Tabelle). Ohne Anzeige wird nichts gerendert. */
  ad?: Ad | null;
  variant?: "small" | "medium" | "large";
  /** Optional: einmal pro Mount, sobald eine Anzeige gerendert wird */
  onImpression?: () => void;
  /** Optional: beim Antippen */
  onClick?: () => void;
}

export interface Ad {
  id: string;
  vendorName: string;
  vendorLogo: string;
  title: string;
  subtitle: string;
  ctaText: string;
  link: string;
  backgroundColor: string;
  accentColor: string;
}

export function AdBanner({ ad, variant = "medium", onImpression, onClick }: AdBannerProps) {
  const { tier } = useSubscription();
  const impressionSent = useRef<string | null>(null);
  const visible = !TIER_LIMITS[tier].adFree && !!ad;

  useEffect(() => {
    if (visible && ad && impressionSent.current !== ad.id) {
      impressionSent.current = ad.id;
      onImpression?.();
    }
  }, [visible, ad, onImpression]);

  // Bezahlte Tiers sind werbefrei; ohne echte Anzeige nichts rendern (keine Fake-Werbung)
  if (TIER_LIMITS[tier].adFree) return null;
  if (!ad) return null;

  const handlePress = () => {
    onClick?.();
    Linking.openURL(ad.link).catch((e) => console.warn("[AdBanner] Link konnte nicht geöffnet werden:", e));
  };

  if (variant === "small") {
    return (
      <TouchableOpacity 
        className="flex-row items-center gap-3 p-3 rounded-xl border border-border"
        style={{ backgroundColor: ad.backgroundColor }}
        onPress={handlePress}
      >
        <View className="w-10 h-10 rounded-lg items-center justify-center" style={{ backgroundColor: ad.accentColor + "30" }}>
          <Text className="text-xl">{ad.vendorLogo}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-foreground">{ad.title}</Text>
          <Text className="text-xs text-muted">{ad.subtitle}</Text>
        </View>
        <View className="px-3 py-1.5 rounded-full" style={{ backgroundColor: ad.accentColor }}>
          <Text className="text-xs font-medium text-white">{ad.ctaText}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  if (variant === "large") {
    return (
      <TouchableOpacity 
        className="rounded-2xl p-5 border border-border"
        style={{ backgroundColor: ad.backgroundColor }}
        onPress={handlePress}
      >
        <View className="flex-row items-center gap-2 mb-3">
          <Text className="text-xs text-muted">Gesponsert</Text>
          <Text className="text-xs text-muted">•</Text>
          <Text className="text-xs text-muted">{ad.vendorName}</Text>
        </View>
        
        <View className="flex-row items-center gap-4">
          <View className="w-16 h-16 rounded-xl items-center justify-center" style={{ backgroundColor: ad.accentColor + "30" }}>
            <Text className="text-3xl">{ad.vendorLogo}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground mb-1">{ad.title}</Text>
            <Text className="text-sm text-muted mb-3">{ad.subtitle}</Text>
            <View className="self-start px-4 py-2 rounded-full" style={{ backgroundColor: ad.accentColor }}>
              <Text className="text-sm font-semibold text-white">{ad.ctaText}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Medium (default)
  return (
    <TouchableOpacity 
      className="rounded-xl p-4 border border-border"
      style={{ backgroundColor: ad.backgroundColor }}
      onPress={handlePress}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <Text className="text-lg">{ad.vendorLogo}</Text>
          <Text className="text-xs text-muted">{ad.vendorName}</Text>
        </View>
        <Text className="text-xs text-muted">Anzeige</Text>
      </View>
      
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-base font-semibold text-foreground">{ad.title}</Text>
          <Text className="text-sm text-muted">{ad.subtitle}</Text>
        </View>
        <View className="px-3 py-2 rounded-full" style={{ backgroundColor: ad.accentColor }}>
          <Text className="text-sm font-medium text-white">{ad.ctaText}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Vendor Ad Request Component
export function VendorAdRequest() {
  const colors = useColors();
  const router = useRouter();

  return (
    <View className="bg-surface rounded-2xl p-4 border border-border">
      <View className="flex-row items-center gap-3 mb-3">
        <View className="w-12 h-12 rounded-xl bg-primary/20 items-center justify-center">
          <IconSymbol name="megaphone.fill" size={24} color={colors.primary} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-foreground">Werbung schalten</Text>
          <Text className="text-sm text-muted">Erreiche tausende Grower</Text>
        </View>
      </View>
      
      <Text className="text-sm text-muted mb-4">
        Als verifizierter Anbieter kannst du Banner-Werbung schalten und deine Produkte 
        direkt an unsere Community bewerben.
      </Text>
      
      <View className="flex-row gap-3">
        <TouchableOpacity className="flex-1 bg-primary py-3 rounded-xl" onPress={() => router.push("/vendor-portal" as any)}>
          <Text className="text-center text-sm font-semibold text-white">Anbieter werden</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-surface border border-border py-3 rounded-xl"
          onPress={() => Linking.openURL("mailto:partners@growmaster.app?subject=Werbung%20schalten").catch(() => {})}
        >
          <Text className="text-center text-sm font-semibold text-foreground">Mehr erfahren</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
