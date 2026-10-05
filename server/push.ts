/**
 * Expo Push API helpers (pure chunking + sender).
 */
export const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
export const EXPO_PUSH_CHUNK_SIZE = 100;

export function isExpoPushToken(token: string): boolean {
  return /^(Exponent|Expo)PushToken\[[^\]]+\]$/.test(token);
}

export function chunk<T>(items: T[], size = EXPO_PUSH_CHUNK_SIZE): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export interface PushSendSummary {
  attempted: number;
  accepted: number;
  failed: number;
  /** tokens Expo reported as DeviceNotRegistered -> should be deleted */
  invalidTokens: string[];
}

interface ExpoTicket { status: "ok" | "error"; details?: { error?: string } }

export async function sendExpoPush(
  tokens: string[],
  message: { title: string; body: string },
  fetchImpl: typeof fetch = fetch,
): Promise<PushSendSummary> {
  const valid = Array.from(new Set(tokens.filter(isExpoPushToken)));
  const summary: PushSendSummary = { attempted: valid.length, accepted: 0, failed: 0, invalidTokens: [] };
  for (const batch of chunk(valid)) {
    try {
      const res = await fetchImpl(EXPO_PUSH_URL, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(batch.map(to => ({ to, title: message.title, body: message.body, sound: "default" }))),
      });
      if (!res.ok) { summary.failed += batch.length; continue; }
      const json = (await res.json()) as { data?: ExpoTicket[] };
      const tickets = json.data ?? [];
      batch.forEach((token, i) => {
        const t = tickets[i];
        if (t?.status === "ok") summary.accepted++;
        else {
          summary.failed++;
          if (t?.details?.error === "DeviceNotRegistered") summary.invalidTokens.push(token);
        }
      });
    } catch {
      summary.failed += batch.length;
    }
  }
  return summary;
}
