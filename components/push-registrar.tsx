import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { trpc } from "@/lib/trpc";
import { useAppAuth } from "@/lib/auth-context";
import { useGamification } from "@/lib/gamification-context";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Registers the device's Expo push token with the backend once the user is logged in.
 * Also sets up local notifications for streaks and reminders.
 * Renders nothing. Silently skips on web / simulators / when permission is denied.
 */
export function PushRegistrar() {
  const { isAuthenticated } = useAppAuth();
  const { stats } = useGamification();
  const register = trpc.push.registerToken.useMutation();
  const notificationListener = useRef<Notifications.EventSubscription | null>(
    null,
  );
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!isAuthenticated || Platform.OS === "web") return;
    let cancelled = false;

    (async () => {
      try {
        const existing = await Notifications.getPermissionsAsync();
        let status = existing.status;
        if (status !== "granted")
          status = (await Notifications.requestPermissionsAsync()).status;
        if (status !== "granted" || cancelled) return;

        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ??
          Constants.easConfig?.projectId;
        const { data } = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined,
        );
        if (!cancelled && data)
          register.mutate({ token: data, platform: Platform.OS });

        // Set up notification listeners
        notificationListener.current =
          Notifications.addNotificationReceivedListener((notification) => {
            // Handle notification received while app is in foreground
            console.log("Notification received:", notification);
          });

        responseListener.current =
          Notifications.addNotificationResponseReceivedListener((response) => {
            // Handle notification tap
            console.log("Notification tapped:", response);
          });
      } catch {
        // token retrieval is best-effort (simulator, missing FCM config, offline)
      }
    })();

    return () => {
      cancelled = true;
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [isAuthenticated]);

  // Schedule streak reminder notification
  useEffect(() => {
    if (!isAuthenticated || Platform.OS === "web" || !stats.loginStreak) return;

    const scheduleStreakReminder = async () => {
      try {
        // Cancel existing streak notifications
        await Notifications.cancelAllScheduledNotificationsAsync();

        // Schedule a reminder for 8 PM if user hasn't logged in today
        const now = new Date();
        const reminderTime = new Date();
        reminderTime.setHours(20, 0, 0, 0);

        if (now < reminderTime) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "🔥 Streak sichern!",
              body: `Logge dich heute ein, um deine ${stats.loginStreak}-Tage-Streak zu halten!`,
              data: { type: "streak_reminder", streak: stats.loginStreak },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
              hour: 20,
              minute: 0,
              repeats: false,
            },
          });
        }
      } catch (error) {
        console.error("Failed to schedule streak reminder:", error);
      }
    };

    scheduleStreakReminder();
  }, [isAuthenticated, stats.loginStreak]);

  return null;
}
