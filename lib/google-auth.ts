import * as GoogleSignin from "@react-native-google-signin/google-signin";
import { GOOGLE_CLIENT_ID, getApiBaseUrl } from "@/constants/oauth";
import * as Auth from "@/lib/_core/auth";

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: GOOGLE_CLIENT_ID,
  offlineAccess: true,
  scopes: ["openid", "profile", "email"],
});

export function useGoogleAuth() {
  const signIn = async (): Promise<boolean> => {
    try {
      // Check if Play Services are available
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();

      // Get tokens
      const tokens = await GoogleSignin.getTokens();

      if (!tokens.idToken) {
        throw new Error("Kein ID-Token erhalten");
      }

      // Send ID token to backend
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/api/auth/google/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken: tokens.idToken,
          userInfo: {
            email: userInfo.user.email,
            name: userInfo.user.name || "",
            photo: userInfo.user.photo || "",
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        await Auth.setSessionToken(data.sessionToken);
        await Auth.setUserInfo(data.user);
        return true;
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Google Login fehlgeschlagen");
    } catch (error: any) {
      // User cancelled
      if (error?.code === "SIGN_IN_CANCELLED") {
        return false;
      }
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.error("Google Sign-Out error:", error);
    }
  };

  return { signIn, signOut, isLoading: false };
}
