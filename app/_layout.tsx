import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Platform } from "react-native";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import { SubscriptionProvider } from "@/lib/subscription-context";
import { AuthProvider } from "@/lib/auth-context";
import { GamificationProvider } from "@/lib/gamification-context";
import { ErrorBoundary } from "@/components/error-boundary";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";

import { trpc, createTRPCClient } from "@/lib/trpc";
import { initManusRuntime, subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  // Initialize Manus runtime for cookie injection from parent container
  useEffect(() => {
    initManusRuntime();
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

  // Create clients once and reuse them
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Disable automatic refetching on window focus for mobile
            refetchOnWindowFocus: false,
            // Retry failed requests once
            retry: 1,
          },
        },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient());

  // Ensure minimum 8px padding for top and bottom on mobile
  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  // Check onboarding status
  const [onboardingComplete, setOnboardingComplete] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    import('@/components/onboarding/onboarding-flow').then(({ hasCompletedOnboarding }) => {
      hasCompletedOnboarding().then(setOnboardingComplete);
    });
  }, []);

  // Redirect to onboarding if not completed
  React.useEffect(() => {
    if (onboardingComplete === false) {
      router.replace('/onboarding');
    }
  }, [onboardingComplete]);

  // Show nothing while checking
  if (onboardingComplete === null) {
    return null;
  }

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <GamificationProvider>
                <SubscriptionProvider>
                  {/* Default to hiding native headers so raw route segments don't appear (e.g. "(tabs)", "products/[id]"). */}
                  {/* If a screen needs the native header, explicitly enable it and set a human title via Stack.Screen options. */}
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="oauth/callback" />
                    <Stack.Screen name="login" options={{ presentation: "modal" }} />
                    <Stack.Screen name="paywall" options={{ presentation: "modal" }} />
                    <Stack.Screen name="settings" options={{ presentation: "modal" }} />
                    <Stack.Screen name="achievements" options={{ presentation: "modal" }} />
                    <Stack.Screen name="admin" options={{ presentation: "modal" }} />
                    <Stack.Screen name="marketplace" options={{ presentation: "modal" }} />
                    <Stack.Screen name="vendor-portal" options={{ presentation: "modal" }} />
                    <Stack.Screen name="tools" options={{ presentation: "modal" }} />
                    <Stack.Screen name="messages" options={{ presentation: "modal" }} />
                    <Stack.Screen name="legal" options={{ presentation: "modal" }} />
                    <Stack.Screen name="onboarding" options={{ presentation: "fullScreenModal", gestureEnabled: false }} />
                  </Stack>
                  <StatusBar style="auto" />
                </SubscriptionProvider>
              </GamificationProvider>
            </AuthProvider>
          </QueryClientProvider>
        </trpc.Provider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );

  const shouldOverrideSafeArea = Platform.OS === "web";

  if (shouldOverrideSafeArea) {
    return (
      <ThemeProvider>
        <SafeAreaProvider initialMetrics={providerInitialMetrics}>
          <SafeAreaFrameContext.Provider value={frame}>
            <SafeAreaInsetsContext.Provider value={insets}>
              {content}
            </SafeAreaInsetsContext.Provider>
          </SafeAreaFrameContext.Provider>
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>{content}</SafeAreaProvider>
    </ThemeProvider>
  );
}
