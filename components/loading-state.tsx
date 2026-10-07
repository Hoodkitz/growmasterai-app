/**
 * Loading State Component with Progress Indication
 * Shows estimated time and progress for long-running operations
 */

import { View, Text, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useState, useEffect } from "react";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface LoadingStateProps {
  message?: string;
  estimatedSeconds?: number;
  showProgress?: boolean;
  compact?: boolean;
}

export function LoadingState({
  message = "Lädt...",
  estimatedSeconds = 0,
  showProgress = true,
  compact = false,
}: LoadingStateProps) {
  const colors = useColors();
  const [elapsed, setElapsed] = useState(0);
  const [dots, setDots] = useState(".");

  // Progress tracking
  useEffect(() => {
    if (!showProgress || estimatedSeconds === 0) return;

    const interval = setInterval(() => {
      setElapsed((prev) => Math.min(prev + 1, estimatedSeconds));
    }, 1000);

    return () => clearInterval(interval);
  }, [showProgress, estimatedSeconds]);

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const progress = estimatedSeconds > 0 ? (elapsed / estimatedSeconds) * 100 : 0;
  const remainingSeconds = Math.max(0, estimatedSeconds - elapsed);

  if (compact) {
    return (
      <View className="flex-row items-center gap-3 p-3 bg-primary/10 rounded-xl">
        <ActivityIndicator size="small" color={colors.primary} />
        <Text className="flex-1 text-sm text-foreground">
          {message}
          {dots}
        </Text>
        {showProgress && remainingSeconds > 0 && (
          <Text className="text-xs text-muted">~{remainingSeconds}s</Text>
        )}
      </View>
    );
  }

  return (
    <View className="bg-surface rounded-2xl p-6 border border-border items-center gap-4">
      <View className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>

      <View className="items-center gap-2 w-full">
        <Text className="text-lg font-semibold text-foreground text-center">
          {message}
          {dots}
        </Text>

        {showProgress && estimatedSeconds > 0 && (
          <>
            <Text className="text-sm text-muted text-center">
              Geschätzte Zeit: ~{remainingSeconds}s
            </Text>

            <View className="w-full h-2 bg-border rounded-full overflow-hidden mt-2">
              <View
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </View>

            <Text className="text-xs text-muted">
              {Math.min(Math.round(progress), 100)}%
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

/**
 * AI Processing Indicator
 * Specialized loading state for AI operations
 */
export function AIProcessingIndicator({
  feature,
  compact = false,
}: {
  feature: "diagnosis" | "coach" | "gender" | "strain" | "harvest";
  compact?: boolean;
}) {
  const colors = useColors();
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const getFeatureMessage = () => {
    switch (feature) {
      case "diagnosis":
        return "KI analysiert deine Pflanze";
      case "coach":
        return "Coach überlegt";
      case "gender":
        return "Geschlecht wird bestimmt";
      case "strain":
        return "Sorte wird identifiziert";
      case "harvest":
        return "Erntezeitpunkt wird analysiert";
      default:
        return "KI arbeitet";
    }
  };

  const getEstimatedTime = () => {
    switch (feature) {
      case "diagnosis":
        return 15;
      case "coach":
        return 10;
      case "gender":
        return 8;
      case "strain":
        return 12;
      case "harvest":
        return 10;
      default:
        return 10;
    }
  };

  if (compact) {
    return (
      <View className="flex-row items-center gap-3 p-4 bg-primary/10 rounded-xl border border-primary/30">
        <View className="relative">
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-medium text-foreground">
            {getFeatureMessage()}
            {dots}
          </Text>
          <Text className="text-xs text-muted mt-1">~{getEstimatedTime()}s</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-surface rounded-2xl p-6 border border-border items-center gap-4">
      <View className="relative">
        <View className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center">
          <IconSymbol name="brain.head.profile" size={32} color={colors.primary} />
        </View>
        <View className="absolute -bottom-1 -right-1 bg-background rounded-full p-1">
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </View>

      <View className="items-center gap-1">
        <Text className="text-lg font-semibold text-foreground text-center">
          {getFeatureMessage()}
          {dots}
        </Text>
        <Text className="text-sm text-muted text-center">
          Dies dauert etwa {getEstimatedTime()} Sekunden
        </Text>
      </View>

      <View className="w-full bg-primary/10 rounded-xl p-3 border border-primary/30">
        <View className="flex-row items-start gap-2">
          <IconSymbol name="lightbulb.fill" size={16} color={colors.primary} />
          <Text className="flex-1 text-xs text-muted">
            Die KI analysiert Millionen von Datenpunkten, um dir die beste Antwort zu geben.
          </Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Skeleton loader for content
 */
export function SkeletonLoader({ lines = 3 }: { lines?: number }) {
  const colors = useColors();

  return (
    <View className="gap-3">
      {Array.from({ length: lines }).map((_, i) => (
        <View
          key={i}
          className="h-4 rounded-full bg-border"
          style={{
            width: i === lines - 1 ? "70%" : "100%",
            opacity: 1 - i * 0.15,
          }}
        />
      ))}
    </View>
  );
}
