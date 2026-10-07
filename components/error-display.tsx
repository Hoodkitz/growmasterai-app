/**
 * Error Display Component with Retry Functionality
 * Shows user-friendly error messages with action buttons
 */

import { View, Text, TouchableOpacity } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import type { ErrorDetails } from "@/lib/error-handling";
import { useState, useEffect } from "react";

interface ErrorDisplayProps {
  error: ErrorDetails;
  onRetry?: () => void;
  onAction?: () => void;
  compact?: boolean;
}

export function ErrorDisplay({ error, onRetry, onAction, compact = false }: ErrorDisplayProps) {
  const colors = useColors();
  const [retryCountdown, setRetryCountdown] = useState(error.retryDelay || 0);

  useEffect(() => {
    if (retryCountdown > 0) {
      const timer = setTimeout(() => setRetryCountdown(retryCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [retryCountdown]);

  const canRetry = error.retryable && (!error.retryDelay || retryCountdown === 0);

  if (compact) {
    return (
      <View className="bg-error/10 rounded-xl p-3 border border-error/30">
        <View className="flex-row items-center gap-2 mb-2">
          <IconSymbol name="exclamationmark.triangle.fill" size={18} color={colors.error} />
          <Text className="flex-1 text-sm font-medium text-foreground">{error.title}</Text>
        </View>
        <Text className="text-sm text-muted mb-2">{error.message}</Text>
        {onRetry && canRetry && (
          <TouchableOpacity
            className="bg-primary rounded-lg py-2 items-center"
            onPress={onRetry}
          >
            <Text className="text-sm font-semibold text-white">Erneut versuchen</Text>
          </TouchableOpacity>
        )}
        {retryCountdown > 0 && (
          <Text className="text-xs text-center text-muted mt-2">
            Erneuter Versuch in {retryCountdown}s möglich
          </Text>
        )}
      </View>
    );
  }

  return (
    <View className="bg-surface rounded-2xl p-6 border border-border items-center gap-4">
      <View className="w-16 h-16 rounded-full bg-error/20 items-center justify-center">
        <IconSymbol name="exclamationmark.triangle.fill" size={32} color={colors.error} />
      </View>

      <View className="items-center gap-2">
        <Text className="text-xl font-bold text-foreground text-center">{error.title}</Text>
        <Text className="text-base text-muted text-center leading-6">{error.message}</Text>
      </View>

      {retryCountdown > 0 && (
        <View className="bg-warning/10 rounded-xl px-4 py-2 border border-warning/30">
          <Text className="text-sm text-foreground text-center">
            Warte noch {retryCountdown} Sekunden
          </Text>
        </View>
      )}

      <View className="w-full gap-3">
        {onRetry && canRetry && (
          <TouchableOpacity
            className="bg-primary rounded-xl py-4 items-center"
            onPress={onRetry}
          >
            <View className="flex-row items-center gap-2">
              <IconSymbol name="arrow.clockwise" size={20} color="#fff" />
              <Text className="text-base font-semibold text-white">
                {error.action || "Erneut versuchen"}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {onAction && error.action && !error.retryable && (
          <TouchableOpacity
            className="bg-primary rounded-xl py-4 items-center"
            onPress={onAction}
          >
            <Text className="text-base font-semibold text-white">{error.action}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

/**
 * Inline error message (for smaller spaces)
 */
export function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const colors = useColors();

  return (
    <View className="flex-row items-center gap-2 p-3 bg-error/10 rounded-lg border border-error/30">
      <IconSymbol name="exclamationmark.circle.fill" size={20} color={colors.error} />
      <Text className="flex-1 text-sm text-foreground">{message}</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry}>
          <IconSymbol name="arrow.clockwise" size={20} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}
