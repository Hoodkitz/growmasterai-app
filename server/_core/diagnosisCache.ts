import { createHash } from "crypto";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";

const CACHE_DIR = process.env.DIAGNOSIS_CACHE_DIR || join(process.cwd(), ".cache", "diagnoses");
const CACHE_TTL_MS = parseInt(process.env.DIAGNOSIS_CACHE_TTL || "86400000"); // 24h default

// In-memory cache for active requests (deduplication)
const activeRequests = new Map<string, Promise<any>>();

// Simple in-memory LRU for hot responses
const memoryCache = new Map<string, { data: any; timestamp: number }>();
const MAX_MEMORY_CACHE = 100;

/**
 * Generate cache key from images (hash of base64 data)
 */
export function generateCacheKey(images: string[], notes?: string): string {
  const hash = createHash("sha256");
  
  for (const img of images) {
    // Hash the actual image data (skip data:image prefix)
    const data = img.includes("base64,") ? img.split("base64,")[1] : img;
    hash.update(data);
  }
  
  if (notes) {
    hash.update(notes);
  }
  
  return hash.digest("hex");
}

/**
 * Get cached diagnosis response
 */
export async function getCachedDiagnosis(cacheKey: string): Promise<any | null> {
  // Check memory cache first
  const memCached = memoryCache.get(cacheKey);
  if (memCached) {
    const age = Date.now() - memCached.timestamp;
    if (age < CACHE_TTL_MS) {
      return memCached.data;
    }
    memoryCache.delete(cacheKey);
  }

  // Check disk cache
  try {
    const cachePath = join(CACHE_DIR, `${cacheKey}.json`);
    const cached = await readFile(cachePath, "utf-8");
    const { data, timestamp } = JSON.parse(cached);
    
    const age = Date.now() - timestamp;
    if (age < CACHE_TTL_MS) {
      // Promote to memory cache
      memoryCache.set(cacheKey, { data, timestamp });
      pruneMemoryCache();
      return data;
    }
  } catch {
    // Cache miss or read error
  }
  
  return null;
}

/**
 * Save diagnosis response to cache
 */
export async function setCachedDiagnosis(cacheKey: string, data: any): Promise<void> {
  const timestamp = Date.now();
  
  // Save to memory cache
  memoryCache.set(cacheKey, { data, timestamp });
  pruneMemoryCache();
  
  // Save to disk cache (async, don't await)
  saveToDisk(cacheKey, data, timestamp).catch((err) => {
    console.error("[Cache] Failed to save to disk:", err);
  });
}

async function saveToDisk(cacheKey: string, data: any, timestamp: number): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  const cachePath = join(CACHE_DIR, `${cacheKey}.json`);
  await writeFile(cachePath, JSON.stringify({ data, timestamp }));
}

function pruneMemoryCache(): void {
  if (memoryCache.size <= MAX_MEMORY_CACHE) return;
  
  // Remove oldest entries
  const entries = Array.from(memoryCache.entries())
    .sort((a, b) => a[1].timestamp - b[1].timestamp);
  
  const toRemove = entries.slice(0, memoryCache.size - MAX_MEMORY_CACHE);
  for (const [key] of toRemove) {
    memoryCache.delete(key);
  }
}

/**
 * Deduplicate concurrent requests for the same diagnosis
 */
export async function deduplicateRequest<T>(
  cacheKey: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const existing = activeRequests.get(cacheKey);
  if (existing) {
    return existing as Promise<T>;
  }
  
  const promise = fetcher().finally(() => {
    activeRequests.delete(cacheKey);
  });
  
  activeRequests.set(cacheKey, promise);
  return promise;
}

/**
 * Get cache stats
 */
export function getCacheStats() {
  return {
    memoryEntries: memoryCache.size,
    activeRequests: activeRequests.size,
  };
}
