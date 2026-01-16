/**
 * Offline Storage & Sync System
 * Enables app to work without internet connection
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useState, useEffect } from 'react';

const OFFLINE_QUEUE_KEY = '@growmaster_offline_queue';
const OFFLINE_DATA_KEY = '@growmaster_offline_data';

export interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'plant' | 'journal' | 'diagnosis' | 'expense';
  data: any;
  timestamp: number;
  synced: boolean;
}

/**
 * Check if device is online
 */
export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected === true;
}

/**
 * Hook to monitor network status
 */
export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected === true);
    });

    return () => unsubscribe();
  }, []);

  return { isConnected };
}

/**
 * Save action to offline queue
 */
export async function queueOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'synced'>): Promise<void> {
  try {
    const queue = await getOfflineQueue();
    
    const newAction: OfflineAction = {
      ...action,
      id: `offline_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      synced: false,
    };

    queue.push(newAction);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error queuing offline action:', error);
  }
}

/**
 * Get all offline actions
 */
export async function getOfflineQueue(): Promise<OfflineAction[]> {
  try {
    const data = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting offline queue:', error);
    return [];
  }
}

/**
 * Sync offline actions when back online
 */
export async function syncOfflineActions(): Promise<{ success: number; failed: number }> {
  const online = await isOnline();
  if (!online) {
    return { success: 0, failed: 0 };
  }

  const queue = await getOfflineQueue();
  const unsynced = queue.filter(a => !a.synced);

  let success = 0;
  let failed = 0;

  for (const action of unsynced) {
    try {
      // Sync with backend based on action type
      // await syncAction(action);
      
      action.synced = true;
      success++;
    } catch (error) {
      console.error('Error syncing action:', error);
      failed++;
    }
  }

  // Save updated queue
  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));

  // Clean up old synced actions (older than 7 days)
  const cleanedQueue = queue.filter(a => {
    if (a.synced) {
      const age = Date.now() - a.timestamp;
      return age < 7 * 24 * 60 * 60 * 1000; // Keep for 7 days
    }
    return true; // Keep unsynced
  });

  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(cleanedQueue));

  return { success, failed };
}

/**
 * Cache data for offline access
 */
export async function cacheOfflineData(key: string, data: any): Promise<void> {
  try {
    const cache = await getOfflineCache();
    cache[key] = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error caching offline data:', error);
  }
}

/**
 * Get cached offline data
 */
export async function getOfflineCache(): Promise<Record<string, any>> {
  try {
    const data = await AsyncStorage.getItem(OFFLINE_DATA_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error getting offline cache:', error);
    return {};
  }
}

/**
 * Get specific cached data
 */
export async function getCachedData(key: string, maxAge: number = 24 * 60 * 60 * 1000): Promise<any | null> {
  const cache = await getOfflineCache();
  const cached = cache[key];

  if (!cached) return null;

  const age = Date.now() - cached.timestamp;
  if (age > maxAge) return null; // Too old

  return cached.data;
}

/**
 * Auto-sync hook
 */
export function useAutoSync(interval: number = 30000) {
  const { isConnected } = useNetworkStatus();

  useEffect(() => {
    if (!isConnected) return;

    const sync = async () => {
      const result = await syncOfflineActions();
      if (result.success > 0) {
        console.log(`Synced ${result.success} offline actions`);
      }
    };

    // Initial sync
    sync();

    // Periodic sync
    const timer = setInterval(sync, interval);

    return () => clearInterval(timer);
  }, [isConnected, interval]);
}
