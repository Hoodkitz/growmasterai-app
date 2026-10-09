/**
 * Webhook Management for GrowMaster AI
 * Register and manage webhooks for external notifications
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  isActive: boolean;
  createdAt: string;
  lastTriggered?: string;
  triggerCount: number;
}

export type WebhookEvent =
  | 'plant.created'
  | 'plant.updated'
  | 'plant.harvested'
  | 'diagnosis.completed'
  | 'expense.added'
  | 'export.completed'
  | 'backup.created';

const WEBHOOKS_KEY = '@growmaster_webhooks';

function generateSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'whsec_';
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function getWebhooks(): Promise<Webhook[]> {
  try {
    const raw = await AsyncStorage.getItem(WEBHOOKS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Webhook[];
  } catch {
    return [];
  }
}

export async function createWebhook(
  name: string,
  url: string,
  events: WebhookEvent[]
): Promise<Webhook> {
  const webhooks = await getWebhooks();
  const newWebhook: Webhook = {
    id: `wh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    url,
    events,
    secret: generateSecret(),
    isActive: true,
    createdAt: new Date().toISOString(),
    triggerCount: 0,
  };
  webhooks.push(newWebhook);
  await AsyncStorage.setItem(WEBHOOKS_KEY, JSON.stringify(webhooks));
  return newWebhook;
}

export async function toggleWebhook(id: string): Promise<void> {
  const webhooks = await getWebhooks();
  const updated = webhooks.map((w) =>
    w.id === id ? { ...w, isActive: !w.isActive } : w
  );
  await AsyncStorage.setItem(WEBHOOKS_KEY, JSON.stringify(updated));
}

export async function deleteWebhook(id: string): Promise<void> {
  const webhooks = await getWebhooks();
  const updated = webhooks.filter((w) => w.id !== id);
  await AsyncStorage.setItem(WEBHOOKS_KEY, JSON.stringify(updated));
}

export async function triggerWebhook(
  event: WebhookEvent,
  payload: Record<string, unknown>
): Promise<void> {
  const webhooks = await getWebhooks();
  const matching = webhooks.filter((w) => w.isActive && w.events.includes(event));

  for (const webhook of matching) {
    try {
      await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-GrowMaster-Event': event,
          'X-GrowMaster-Signature': webhook.secret,
        },
        body: JSON.stringify({
          event,
          timestamp: new Date().toISOString(),
          data: payload,
        }),
      });
      // Update trigger count
      const updated = webhooks.map((w) =>
        w.id === webhook.id
          ? { ...w, lastTriggered: new Date().toISOString(), triggerCount: w.triggerCount + 1 }
          : w
      );
      await AsyncStorage.setItem(WEBHOOKS_KEY, JSON.stringify(updated));
    } catch {
      // Webhook delivery failed - could implement retry logic here
    }
  }
}
