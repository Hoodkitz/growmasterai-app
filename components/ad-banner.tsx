import { View, Text, TouchableOpacity, Linking } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSubscription } from "@/lib/subscription-context";

interface AdBannerProps {
  position: "home" | "community" | "marketplace";
  variant?: "small" | "medium" | "large";
}

interface Ad {
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

const MOCK_ADS: Record<string, Ad[]> = {
  home: [
    {
      id: "ad1",
      vendorName: "SeedBank Pro",
      vendorLogo: "🌱",
      title: "Premium Genetik",
      subtitle: "20% Rabatt auf alle Samen",
      ctaText: "Jetzt shoppen",
      link: "https://seedbankpro.com",
      backgroundColor: "#10B98120",
      accentColor: "#10B981",
    },
  ],
  community: [
    {
      id: "ad2",
      vendorName: "GrowTech",
      vendorLogo: "💡",
      title: "LED Sale",
      subtitle: "Bis zu 40% auf Beleuchtung",
      ctaText: "Angebote ansehen",
      link: "https://growtech.com",
      backgroundColor: "#3B82F620",
      accentColor: "#3B82F6",
    },
  ],
  marketplace: [
    {
      id: "ad3",
      vendorName: "NutrientKing",
      vendorLogo: "🧪",
      title: "Bio Dünger",
      subtitle: "Gratis Versand ab €50",
      ctaText: "Entdecken",
      link: "https://nutrientking.com",
      backgroundColor: "#F59E0B20",
      accentColor: "#F59E0B",
    },
  ],
};

export function AdBanner({ position, variant = "medium" }: AdBannerProps) {
  const colors = useColors();
  const { tier } = useSubscription();

  // Pro users don't see ads
  if (tier === "pro") return null;

  const ads = MOCK_ADS[position] || [];
  if (ads.length === 0) return null;

  const ad = ads[0];

  const handlePress = () => {
    Linking.openURL(ad.link);
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
        <TouchableOpacity className="flex-1 bg-primary py-3 rounded-xl">
          <Text className="text-center text-sm font-semibold text-white">Anbieter werden</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 bg-surface border border-border py-3 rounded-xl">
          <Text className="text-center text-sm font-semibold text-foreground">Mehr erfahren</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
