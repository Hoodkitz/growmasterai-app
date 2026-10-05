import { useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { trpc } from "@/lib/trpc";
import { useAppAuth } from "@/lib/auth-context";

/**
 * Registers the device's Expo push token with the backend once the user is logged in.
 * Renders nothing. Silently skips on web / simulators / when permission is denied.
 */
export function PushRegistrar() {
  const { isAuthenticated } = useAppAuth();
  const register = trpc.push.registerToken.useMutation();

  useEffect(() => {
    if (!isAuthenticated || Platform.OS === "web") return;
    let cancelled = false;
    (async () => {
      try {
        const existing = await Notifications.getPermissionsAsync();
        let status = existing.status;
        if (status !== "granted") status = (await Notifications.requestPermissionsAsync()).status;
        if (status !== "granted" || cancelled) return;
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        const { data } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
        if (!cancelled && data) register.mutate({ token: data, platform: Platform.OS });
      } catch {
        // token retrieval is best-effort (simulator, missing FCM config, offline)
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return null;
}
