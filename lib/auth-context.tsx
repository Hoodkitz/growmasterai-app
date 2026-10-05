import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import { useAuth as useManusAuth } from "@/hooks/use-auth";
import * as Api from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import { initializePurchases, identifyUser, logoutUser } from "@/lib/purchases";
import { APP_ID, OAUTH_PORTAL_URL, getLoginUrl } from "@/constants/oauth";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: "user" | "admin" | "vendor";
  provider: "google" | "apple" | "email" | "manus";
  createdAt: Date;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isVendor: boolean;
  loading: boolean;
  login: (provider: "google" | "apple" | "email") => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = ["support@growmaster.app"];
const AUTH_STORAGE_KEY = "@growmaster_auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const manusAuth = useManusAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load saved auth state
  useEffect(() => {
    loadAuthState();
  }, []);

  // Sync with Manus auth
  useEffect(() => {
    if (manusAuth.user && manusAuth.isAuthenticated) {
      const profile: UserProfile = {
        id: manusAuth.user.openId,
        email: manusAuth.user.email || "",
        name: manusAuth.user.name || "User",
        role: ADMIN_EMAILS.includes(manusAuth.user.email || "") ? "admin" : "user",
        provider: "manus",
        createdAt: new Date(),
      };
      setUser(profile);
      saveAuthState(profile);
    }
  }, [manusAuth.user, manusAuth.isAuthenticated]);

  // RevenueCat-Nutzer mit der App-User-ID (= users.openId) verknüpfen, damit der
  // Webhook (/api/webhooks/revenuecat) den Kauf dem richtigen Konto zuordnen kann.
  const userId = user?.id;
  useEffect(() => {
    if (!userId || Platform.OS === "web") return;
    let cancelled = false;
    (async () => {
      const ok = await initializePurchases();
      if (ok && !cancelled) await identifyUser(userId);
    })().catch((e) => console.error("[Auth] RevenueCat identify failed:", e));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const loadAuthState = async () => {
    try {
      // Only trust the cached profile while a real session exists
      const token = await Auth.getSessionToken();
      const stored = token ? await AsyncStorage.getItem(AUTH_STORAGE_KEY) : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser({
          ...parsed,
          createdAt: new Date(parsed.createdAt),
        });
      } else if (!token) {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (error) {
      console.error("Error loading auth state:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveAuthState = async (profile: UserProfile | null) => {
    try {
      if (profile) {
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
      } else {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (error) {
      console.error("Error saving auth state:", error);
    }
  };

  const applyServerSession = async (
    mode: "login" | "register",
    payload: { email: string; password: string; name?: string },
  ) => {
    const { sessionToken, user: serverUser } = await Api.emailAuth(mode, payload);
    await Auth.setSessionToken(sessionToken);
    await Auth.setUserInfo({
      id: serverUser.id,
      openId: serverUser.openId,
      name: serverUser.name,
      email: serverUser.email,
      loginMethod: serverUser.loginMethod,
      lastSignedIn: new Date(serverUser.lastSignedIn || Date.now()),
    });
    const email = (serverUser.email || payload.email).toLowerCase();
    const profile: UserProfile = {
      id: serverUser.openId,
      email,
      name: serverUser.name || email.split("@")[0],
      role: ADMIN_EMAILS.includes(email) ? "admin" : "user",
      provider: "email",
      createdAt: new Date(),
    };
    setUser(profile);
    await saveAuthState(profile);
    await manusAuth.refresh();
  };

  // Google/Apple sign-in goes through the real OAuth portal; the session is
  // established by app/oauth/callback.tsx after the redirect.
  const login = async (provider: "google" | "apple" | "email") => {
    if (!OAUTH_PORTAL_URL || !APP_ID) {
      throw new Error(
        `${provider === "apple" ? "Apple" : "Google"}-Anmeldung ist nicht konfiguriert. Bitte melde dich mit E-Mail an.`,
      );
    }
    const url = getLoginUrl();
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.location.href = url;
    } else {
      await Linking.openURL(url);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      await applyServerSession("login", { email: email.trim(), password });
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      await applyServerSession("register", { email: email.trim(), password, name: name.trim() });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (manusAuth.logout) {
        await manusAuth.logout();
      }
      setUser(null);
      await saveAuthState(null);
      if (Platform.OS !== "web") await logoutUser(); // RevenueCat → anonym (loggt Fehler selbst)
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    
    const updated = { ...user, ...data };
    setUser(updated);
    await saveAuthState(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        isVendor: user?.role === "vendor",
        loading: loading || manusAuth.loading,
        login,
        loginWithEmail,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAppAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAppAuth must be used within an AuthProvider");
  }
  return context;
}
