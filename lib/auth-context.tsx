import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth as useManusAuth } from "@/hooks/use-auth";

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

  const loadAuthState = async () => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser({
          ...parsed,
          createdAt: new Date(parsed.createdAt),
        });
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

  const login = async (provider: "google" | "apple" | "email") => {
    setLoading(true);
    try {
      // For demo purposes, simulate OAuth login
      // In production, this would use actual OAuth providers
      const mockUser: UserProfile = {
        id: `${provider}_${Date.now()}`,
        email: provider === "google" ? "user@gmail.com" : "user@icloud.com",
        name: "Demo User",
        role: "user",
        provider,
        createdAt: new Date(),
      };
      
      setUser(mockUser);
      await saveAuthState(mockUser);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Check for admin account
      const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
      
      const profile: UserProfile = {
        id: `email_${Date.now()}`,
        email: email.toLowerCase(),
        name: email.split("@")[0],
        role: isAdmin ? "admin" : "user",
        provider: "email",
        createdAt: new Date(),
      };
      
      setUser(profile);
      await saveAuthState(profile);
    } catch (error) {
      console.error("Email login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const profile: UserProfile = {
        id: `email_${Date.now()}`,
        email: email.toLowerCase(),
        name,
        role: "user",
        provider: "email",
        createdAt: new Date(),
      };
      
      setUser(profile);
      await saveAuthState(profile);
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
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
