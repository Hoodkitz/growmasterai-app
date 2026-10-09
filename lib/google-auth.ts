import { useState } from "react";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import Constants from "expo-constants";

// Read webClientId from app.config.ts (via expo-constants) or process.env
const googleSigninPlugin = Constants.expoConfig?.plugins?.find(
  (plugin: any) =>
    Array.isArray(plugin) &&
    plugin[0] === "@react-native-google-signin/google-signin",
) as
  | [
      string,
      { webClientId?: string; iosClientId?: string; iosUrlScheme?: string },
    ]
  | undefined;

const webClientId =
  googleSigninPlugin?.[1]?.webClientId ||
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  "366301588725-dnado2jdl944lm823n51jnf31fnta60v.apps.googleusercontent.com";

const iosClientId =
  googleSigninPlugin?.[1]?.iosClientId ||
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
  "824654272024-pamt0fdjln1o6imm97sttuflf0secn89.apps.googleusercontent.com";

let isConfigured = false;

// Configure Google Sign-In
function ensureConfigured() {
  if (isConfigured) return;
  GoogleSignin.configure({
    webClientId,
    iosClientId,
    offlineAccess: true,
  });
  isConfigured = true;
}

// Auto-configure on module load
ensureConfigured();

export function useGoogleAuth() {
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async () => {
    ensureConfigured();
    setIsLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      return userInfo;
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error("Anmeldung abgebrochen.");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error("Anmeldung bereits im Gange.");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error("Google Play Services nicht verfügbar.");
      } else {
        throw new Error(error.message || "Google Anmeldung fehlgeschlagen.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.error("Google Sign-Out Fehler:", error);
    }
  };

  return { signIn, signOut, isLoading };
}
