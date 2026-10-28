import * as Sentry from "@sentry/react-native";

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

// No-op without a DSN, so local and test builds send nothing.
export function initSentry() {
  if (!dsn) return;
  Sentry.init({
    dsn,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    enableAutoSessionTracking: true,
  });
}

export function captureError(
  error: unknown,
  context?: Record<string, unknown>,
) {
  if (!dsn) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}
