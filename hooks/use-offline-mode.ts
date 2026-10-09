import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

const OFFLINE_DATA_KEY = "@growmaster_offline_data";

export interface CacheInfo {
  data: unknown;
  timestamp: number;
}

export interface UseOfflineModeReturn {
  /** true when the device has no internet connection */
  isOffline: boolean;
  /** true while the initial network check is still loading */
  isChecking: boolean;
  /** Cache arbitrary data under a key for offline access */
  cacheData: (key: string, data: unknown) => Promise<void>;
  /** Retrieve cached data; returns null if missing or older than maxAge (ms) */
  getCachedData: (key: string, maxAge?: number) => Promise<unknown | null>;
  /** Get cache metadata (data + timestamp) for a key */
  getCacheInfo: (key: string) => Promise<CacheInfo | null>;
  /** Remove all cached offline data */
  clearCache: () => Promise<void>;
  /** Manually re-check network status */
  recheck: () => Promise<void>;
}

/**
 * Hook that monitors network connectivity and provides offline data caching.
 *
 * Usage:
 * ```tsx
 * const { isOffline, cacheData, getCachedData } = useOfflineMode();
 *
 * // Cache data when online
 * await cacheData("plants", plants);
 *
 * // Read data (works offline)
 * const cached = await getCachedData("plants");
 * ```
 */
export function useOfflineMode(): UseOfflineModeReturn {
  const [isOffline, setIsOffline] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const checkNetwork = useCallback(async () => {
    try {
      const state = await NetInfo.fetch();
      setIsOffline(state.isConnected !== true);
    } catch {
      // If NetInfo fails, assume offline to be safe
      setIsOffline(true);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    // Initial check
    checkNetwork();

    // Subscribe to network changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(state.isConnected !== true);
      setIsChecking(false);
    });

    return () => unsubscribe();
  }, [checkNetwork]);

  const cacheData = useCallback(async (key: string, data: unknown) => {
    try {
      const cache = await getCache();
      cache[key] = { data, timestamp: Date.now() };
      await AsyncStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error("[useOfflineMode] Failed to cache data:", error);
    }
  }, []);

  const getCachedData = useCallback(
    async (key: string, maxAge: number = 24 * 60 * 60 * 1000) => {
      try {
        const cache = await getCache();
        const entry = cache[key];
        if (!entry) return null;

        const age = Date.now() - entry.timestamp;
        if (age > maxAge) return null;

        return entry.data;
      } catch (error) {
        console.error("[useOfflineMode] Failed to get cached data:", error);
        return null;
      }
    },
    [],
  );

  const getCacheInfo = useCallback(async (key: string) => {
    try {
      const cache = await getCache();
      const entry = cache[key];
      if (!entry) return null;
      return { data: entry.data, timestamp: entry.timestamp };
    } catch {
      return null;
    }
  }, []);

  const clearCache = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(OFFLINE_DATA_KEY);
    } catch (error) {
      console.error("[useOfflineMode] Failed to clear cache:", error);
    }
  }, []);

  const recheck = useCallback(async () => {
    setIsChecking(true);
    await checkNetwork();
  }, [checkNetwork]);

  return {
    isOffline,
    isChecking,
    cacheData,
    getCachedData,
    getCacheInfo,
    clearCache,
    recheck,
  };
}

// ─── Internal helpers ────────────────────────────────────────────────────────

async function getCache(): Promise<Record<string, CacheInfo>> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_DATA_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, CacheInfo>;
  } catch {
    return {};
  }
}
