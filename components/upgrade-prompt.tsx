import { Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSubscription } from "@/lib/subscription-context";
import { TIER_INFO } from "@/lib/subscription";

interface UpgradePromptProps {
  feature: string;
  limit?: number;
  remaining?: number | null;
  compact?: boolean;
}

export function UpgradePrompt({ feature, limit, remaining, compact = false }: UpgradePromptProps) {
  const router = useRouter();
  const colors = useColors();
  const { tier } = useSubscription();

  if (compact) {
    return (
      <TouchableOpacity 
        className="bg-primary/10 rounded-xl p-3 flex-row items-center justify-between"
        onPress={() => router.push("/paywall")}
      >
        <View className="flex-row items-center gap-2 flex-1">
          <IconSymbol name="exclamationmark.triangle.fill" size={18} color={colors.warning} />
          <Text className="text-sm text-foreground flex-1">
            {remaining !== null && remaining !== undefined
              ? `Noch ${remaining} ${feature} heute verfügbar`
              : `${feature} Limit erreicht`}
          </Text>
        </View>
        <View className="bg-primary px-3 py-1 rounded-full">
          <Text className="text-xs font-medium text-background">Upgrade</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View className="bg-surface rounded-2xl p-4 border border-border gap-4">
      <View className="flex-row items-center gap-3">
        <View className="w-12 h-12 rounded-full bg-warning/20 items-center justify-center">
          <IconSymbol name="exclamationmark.triangle.fill" size={24} color={colors.warning} />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-semibold text-foreground">Limit erreicht</Text>
          <Text className="text-sm text-muted">
            {limit ? `${limit} ${feature} pro Tag im ${TIER_INFO[tier].name} Plan` : `${feature} nicht verfügbar`}
          </Text>
        </View>
      </View>

      <Text className="text-base text-foreground">
        Upgrade auf Premium oder Pro für mehr {feature} und zusätzliche Funktionen.
      </Text>

      <TouchableOpacity 
        className="bg-primary rounded-xl p-4 items-center"
        onPress={() => router.push("/paywall")}
      >
        <Text className="text-base font-semibold text-background">Jetzt upgraden</Text>
      </TouchableOpacity>
    </View>
  );
}

export function SubscriptionBadge() {
  const router = useRouter();
  const colors = useColors();
  const { tier } = useSubscription();

  if (tier === "free") return null;

  const tierInfo = TIER_INFO[tier];
  const badgeColor = tier === "pro" ? colors.warning : colors.primary;

  return (
    <TouchableOpacity 
      className="flex-row items-center gap-1 px-2 py-1 rounded-full"
      style={{ backgroundColor: badgeColor + "20" }}
      onPress={() => router.push("/paywall")}
    >
      <IconSymbol name="checkmark.circle.fill" size={14} color={badgeColor} />
      <Text className="text-xs font-medium" style={{ color: badgeColor }}>
        {tierInfo.name}
      </Text>
    </TouchableOpacity>
  );
}

export function UsageIndicator({ 
  used, 
  limit, 
  label 
}: { 
  used: number; 
  limit: number; 
  label: string;
}) {
  const colors = useColors();
  const percentage = limit === -1 ? 0 : (used / limit) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  if (limit === -1) {
    return (
      <View className="flex-row items-center gap-2">
        <Text className="text-sm text-muted">{label}:</Text>
        <Text className="text-sm text-primary font-medium">Unbegrenzt</Text>
      </View>
    );
  }

  return (
    <View className="gap-1">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-muted">{label}</Text>
        <Text 
          className="text-sm font-medium"
          style={{ color: isAtLimit ? colors.error : isNearLimit ? colors.warning : colors.foreground }}
        >
          {used}/{limit}
        </Text>
      </View>
      <View className="h-1.5 bg-border rounded-full overflow-hidden">
        <View 
          className="h-full rounded-full"
          style={{ 
            width: `${Math.min(100, percentage)}%`,
            backgroundColor: isAtLimit ? colors.error : isNearLimit ? colors.warning : colors.primary,
          }}
        />
      </View>
    </View>
  );
}
