import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 64 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 10,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center" }}>
              <IconSymbol size={26} name="house.fill" color={color} />
              {focused && (
                <View style={{ 
                  width: 4, 
                  height: 4, 
                  borderRadius: 2, 
                  backgroundColor: colors.primary,
                  marginTop: 4,
                }} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="diagnose"
        options={{
          title: "Scan",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center" }}>
              <IconSymbol size={26} name="camera.fill" color={color} />
              {focused && (
                <View style={{ 
                  width: 4, 
                  height: 4, 
                  borderRadius: 2, 
                  backgroundColor: colors.primary,
                  marginTop: 4,
                }} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: "Coach",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center" }}>
              <IconSymbol size={26} name="message.fill" color={color} />
              {focused && (
                <View style={{ 
                  width: 4, 
                  height: 4, 
                  borderRadius: 2, 
                  backgroundColor: colors.primary,
                  marginTop: 4,
                }} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: "Community",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center" }}>
              <IconSymbol size={26} name="person.3.fill" color={color} />
              {focused && (
                <View style={{ 
                  width: 4, 
                  height: 4, 
                  borderRadius: 2, 
                  backgroundColor: colors.primary,
                  marginTop: 4,
                }} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="plants"
        options={{
          title: "Pflanzen",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center" }}>
              <IconSymbol size={26} name="leaf.fill" color={color} />
              {focused && (
                <View style={{ 
                  width: 4, 
                  height: 4, 
                  borderRadius: 2, 
                  backgroundColor: colors.primary,
                  marginTop: 4,
                }} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          href: null, // Hide from tab bar, accessible via plants
        }}
      />
    </Tabs>
  );
}
