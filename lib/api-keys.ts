/**
 * API Key Management for GrowMaster AI
 * Generate, store, and manage API keys for external integrations
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed?: string;
  permissions: ('read' | 'write' | 'export')[];
  isActive: boolean;
}

const API_KEYS_KEY = '@growmaster_api_keys';

function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'gm_';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function getApiKeys(): Promise<ApiKey[]> {
  try {
    const raw = await AsyncStorage.getItem(API_KEYS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ApiKey[];
  } catch {
    return [];
  }
}

export async function createApiKey(
  name: string,
  permissions: ('read' | 'write' | 'export')[] = ['read']
): Promise<ApiKey> {
  const keys = await getApiKeys();
  const newKey: ApiKey = {
    id: `key_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    key: generateApiKey(),
    createdAt: new Date().toISOString(),
    permissions,
    isActive: true,
  };
  keys.push(newKey);
  await AsyncStorage.setItem(API_KEYS_KEY, JSON.stringify(keys));
  return newKey;
}

export async function revokeApiKey(id: string): Promise<void> {
  const keys = await getApiKeys();
  const updated = keys.map((k) => (k.id === id ? { ...k, isActive: false } : k));
  await AsyncStorage.setItem(API_KEYS_KEY, JSON.stringify(updated));
}

export async function deleteApiKey(id: string): Promise<void> {
  const keys = await getApiKeys();
  const updated = keys.filter((k) => k.id !== id);
  await AsyncStorage.setItem(API_KEYS_KEY, JSON.stringify(updated));
}

export async function updateApiKeyUsage(id: string): Promise<void> {
  const keys = await getApiKeys();
  const updated = keys.map((k) =>
    k.id === id ? { ...k, lastUsed: new Date().toISOString() } : k
  );
  await AsyncStorage.setItem(API_KEYS_KEY, JSON.stringify(updated));
}

export async function validateApiKey(key: string): Promise<ApiKey | null> {
  const keys = await getApiKeys();
  const found = keys.find((k) => k.key === key && k.isActive);
  if (found) {
    await updateApiKeyUsage(found.id);
    return found;
  }
  return null;
}
