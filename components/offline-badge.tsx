import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useOfflineMode } from "@/hooks/use-offline-mode";

/**
 * A small badge that appears when the device is offline.
 * Place it in the header or tab bar area.
 *
 * Usage:
 * ```tsx
 * <OfflineBadge />
 * ```
 */
export function OfflineBadge() {
  const { isOffline, isChecking } = useOfflineMode();

  if (isChecking) return null;
  if (!isOffline) return null;

  return (
    <View
      style={[styles.badge, { backgroundColor: "#ef4444" }]}
      accessibilityLabel="Offline-Modus"
      accessibilityRole="alert"
      testID="offline-badge"
    >
      <Text style={styles.text}>Offline</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "center",
  },
  text: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
});
