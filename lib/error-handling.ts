/**
 * Improved error handling utilities for GrowMaster AI
 * Provides user-friendly, specific error messages in German
 */

import { TRPCClientError } from "@trpc/client";

export interface ErrorDetails {
  title: string;
  message: string;
  action?: string;
  retryable: boolean;
  retryDelay?: number; // seconds until retry is available
}

/**
 * Convert API/network errors into user-friendly German messages
 */
export function getErrorDetails(error: unknown): ErrorDetails {
  // TRPC errors
  if (error instanceof TRPCClientError) {
    const code = error.data?.code;
    const message = error.message;

    switch (code) {
      case "TOO_MANY_REQUESTS":
        // Extract retry time from message if available
        const retryMatch = message.match(/(\d+)s/);
        const retryDelay = retryMatch ? parseInt(retryMatch[1]) : 60;
        return {
          title: "Zu viele Anfragen",
          message: `Bitte warte ${retryDelay} Sekunden, bevor du es erneut versuchst.`,
          action: "Kurz Pause machen",
          retryable: true,
          retryDelay,
        };

      case "UNAUTHORIZED":
        return {
          title: "Anmeldung erforderlich",
          message: "Du musst angemeldet sein, um diese Funktion zu nutzen.",
          action: "Jetzt anmelden",
          retryable: false,
        };

      case "FORBIDDEN":
        return {
          title: "Zugriff verweigert",
          message: "Du hast keine Berechtigung für diese Aktion.",
          action: "Upgrade erforderlich",
          retryable: false,
        };

      case "NOT_FOUND":
        return {
          title: "Nicht gefunden",
          message: "Die angeforderten Daten konnten nicht gefunden werden.",
          retryable: false,
        };

      case "TIMEOUT":
        return {
          title: "Zeitüberschreitung",
          message: "Die Anfrage hat zu lange gedauert. Bitte versuche es erneut.",
          action: "Erneut versuchen",
          retryable: true,
        };

      case "INTERNAL_SERVER_ERROR":
        return {
          title: "Server-Fehler",
          message: "Ein interner Fehler ist aufgetreten. Unser Team wurde benachrichtigt.",
          action: "Später erneut versuchen",
          retryable: true,
        };

      default:
        // Check for specific error messages
        if (message.includes("network") || message.includes("fetch")) {
          return {
            title: "Verbindungsfehler",
            message: "Keine Internetverbindung. Bitte überprüfe deine Netzwerkeinstellungen.",
            action: "Verbindung prüfen",
            retryable: true,
          };
        }

        if (message.includes("Limit erreicht") || message.includes("Kontingent")) {
          return {
            title: "Tageslimit erreicht",
            message: "Du hast dein heutiges Kontingent aufgebraucht. Upgrade für mehr Nutzung.",
            action: "Premium holen",
            retryable: false,
          };
        }

        return {
          title: "Fehler",
          message: message || "Ein unerwarteter Fehler ist aufgetreten.",
          action: "Erneut versuchen",
          retryable: true,
        };
    }
  }

  // Network errors
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return {
      title: "Netzwerkfehler",
      message: "Verbindung zum Server fehlgeschlagen. Bitte überprüfe deine Internetverbindung.",
      action: "Verbindung prüfen",
      retryable: true,
    };
  }

  // Timeout errors
  if (error instanceof Error && error.message.includes("timeout")) {
    return {
      title: "Zeitüberschreitung",
      message: "Die Anfrage hat zu lange gedauert. Bitte versuche es erneut.",
      action: "Erneut versuchen",
      retryable: true,
    };
  }

  // Generic errors
  if (error instanceof Error) {
    return {
      title: "Fehler",
      message: error.message || "Ein unbekannter Fehler ist aufgetreten.",
      action: "Erneut versuchen",
      retryable: true,
    };
  }

  // Unknown error type
  return {
    title: "Unbekannter Fehler",
    message: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.",
    action: "Erneut versuchen",
    retryable: true,
  };
}

/**
 * Feature-specific error messages
 */

export function getDiagnosisErrorMessage(error: unknown): ErrorDetails {
  const baseError = getErrorDetails(error);

  // Customize for diagnosis feature
  if (baseError.title === "Server-Fehler") {
    return {
      ...baseError,
      message: "Die KI-Analyse ist derzeit nicht verfügbar. Bitte versuche es in wenigen Minuten erneut.",
    };
  }

  if (baseError.title === "Zeitüberschreitung") {
    return {
      ...baseError,
      message: "Die Bildanalyse dauert länger als erwartet. Versuche es mit weniger oder kleineren Bildern.",
    };
  }

  return baseError;
}

export function getCoachErrorMessage(error: unknown): ErrorDetails {
  const baseError = getErrorDetails(error);

  // Customize for coach feature
  if (baseError.title === "Server-Fehler") {
    return {
      ...baseError,
      message: "Der Coach ist derzeit nicht verfügbar. Bitte versuche es in wenigen Minuten erneut.",
    };
  }

  if (baseError.title === "Zeitüberschreitung") {
    return {
      ...baseError,
      message: "Der Coach denkt gerade sehr intensiv nach. Bitte versuche es erneut oder stelle eine einfachere Frage.",
    };
  }

  return baseError;
}

export function getRadarErrorMessage(error: unknown): ErrorDetails {
  const baseError = getErrorDetails(error);

  // Customize for radar/map feature
  if (baseError.title === "Netzwerkfehler" || baseError.title === "Verbindungsfehler") {
    return {
      title: "Kartendienst nicht erreichbar",
      message: "Die Karte konnte nicht geladen werden. Versuche es später erneut oder nutze zwischengespeicherte Daten.",
      action: "Offline-Daten verwenden",
      retryable: true,
    };
  }

  if (baseError.title === "Server-Fehler") {
    return {
      ...baseError,
      message: "Der Kartendienst ist derzeit nicht verfügbar. Zwischengespeicherte Daten werden angezeigt.",
    };
  }

  return baseError;
}

/**
 * Check if device is offline
 */
export async function isOffline(): Promise<boolean> {
  // For React Native, you'd use @react-native-community/netinfo
  // For now, return a simple check
  try {
    const response = await fetch("https://www.google.com", {
      method: "HEAD",
      mode: "no-cors",
      cache: "no-cache",
    });
    return false;
  } catch {
    return true;
  }
}

/**
 * Estimate time remaining for AI processing
 */
export function getEstimatedProcessingTime(feature: "diagnosis" | "coach" | "gender" | "strain" | "harvest"): number {
  // Returns estimated seconds
  switch (feature) {
    case "diagnosis":
      return 15; // 15 seconds for image analysis
    case "coach":
      return 10; // 10 seconds for text response
    case "gender":
      return 8;
    case "strain":
      return 12;
    case "harvest":
      return 10;
    default:
      return 10;
  }
}
