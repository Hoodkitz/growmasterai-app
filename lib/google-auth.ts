import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { Platform } from "react-native";

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId:
    "824654272024-6iq3g2cq9tltl3o58mo4t654mhljl944.apps.googleusercontent.com",
  iosClientId:
    "824654272024-pamt0fdjln1o6imm97sttuflf0secn89.apps.googleusercontent.com",
  offlineAccess: true,
});

export function useGoogleAuth() {
  const signIn = async () => {
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
    }
  };

  const signOut = async () => {
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.error("Google Sign-Out Fehler:", error);
    }
  };

  const isLoading = false;

  return { signIn, signOut, isLoading };
}
