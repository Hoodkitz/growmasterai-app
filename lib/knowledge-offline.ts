import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_KEY = "@growmaster_knowledge_v1";

export interface WissenEntry {
  id: string;
  topic: string;
  phases: string[];
  tags: string[];
  text: string;
  videoId: string;
  videoTitle: string;
  channel: string;
  start: number;
}

export async function loadCachedKnowledge(): Promise<WissenEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveCachedKnowledge(entries: WissenEntry[]) {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(entries));
  } catch {
    // Cache is best effort; the screen still works online.
  }
}

/** All words must appear in topic, text or tags (case-insensitive). */
export function filterKnowledge(
  entries: WissenEntry[],
  query: string,
  phase?: string,
): WissenEntry[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return entries.filter((e) => {
    if (phase && !e.phases.includes(phase)) return false;
    const hay = `${e.topic} ${e.text} ${e.tags.join(" ")}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}
