/**
 * Server-side reminder scheduler
 * Checks for due reminders and sends push notifications to users
 */
import { eq, and, gt, isNull, lte, sql } from "drizzle-orm";
import { getDb } from "./db";
import { plants, pushTokens } from "../drizzle/schema";
import { sendExpoPush } from "./push";

export interface DueReminder {
  id: string;
  plantId: string;
  plantName: string;
  type: string;
  title: string;
  message: string;
  userId: string;
  scheduledTime: Date;
}

/**
 * Get all reminders that are due now (scheduled time <= now)
 */
export async function getDueReminders(
  now: Date = new Date(),
): Promise<DueReminder[]> {
  const db = getDb();

  // This is a simplified version - in production you'd have a proper reminders table
  // For now, we'll work with the plant-based reminder system
  const dueReminders = await db
    .select({
      id: plants.id,
      plantId: plants.id,
      plantName: plants.name,
      type: sql<string>`'watering'`,
      title: sql<string>`'💧 ' || ${plants.name} || ' gießen'`,
      message: sql<string>`${plants.name} braucht Wasser. Prüfe vorher die Feuchtigkeit des Substrats.`,
      userId: plants.userId,
      scheduledTime: plants.lastWateredAt,
    })
    .from(plants)
    .where(
      and(
        isNull(plants.deletedAt),
        sql`${plants.lastWateredAt} IS NOT NULL`,
        lte(
          sql`DATE_ADD(${plants.lastWateredAt}, INTERVAL ${plants.wateringInterval || 3} DAY)`,
          now,
        ),
      ),
    );

  return dueReminders as DueReminder[];
}

/**
 * Get push tokens for a user
 */
export async function getUserPushTokens(userId: string): Promise<string[]> {
  const db = getDb();
  const tokens = await db
    .select({ token: pushTokens.token })
    .from(pushTokens)
    .where(
      and(
        eq(pushTokens.userId, userId),
        eq(pushTokens.isValid, true),
        isNull(pushTokens.deletedAt),
      ),
    );
  return tokens.map((t) => t.token);
}

/**
 * Send push notifications for due reminders
 */
export async function sendReminderNotifications(): Promise<{
  sent: number;
  failed: number;
  errors: string[];
}> {
  const result = { sent: 0, failed: 0, errors: [] as string[] };

  try {
    const dueReminders = await getDueReminders();

    for (const reminder of dueReminders) {
      try {
        const tokens = await getUserPushTokens(reminder.userId);
        if (tokens.length === 0) continue;

        const pushResult = await sendExpoPush(tokens, {
          title: reminder.title,
          body: reminder.message,
        });

        result.sent += pushResult.accepted;
        result.failed += pushResult.failed;

        // Clean up invalid tokens
        if (pushResult.invalidTokens.length > 0) {
          await invalidateTokens(pushResult.invalidTokens);
        }
      } catch (error) {
        result.failed++;
        result.errors.push(`Failed to send reminder ${reminder.id}: ${error}`);
      }
    }
  } catch (error) {
    result.errors.push(`Failed to fetch due reminders: ${error}`);
  }

  return result;
}

/**
 * Invalidate tokens that Expo reported as invalid
 */
async function invalidateTokens(tokens: string[]): Promise<void> {
  const db = getDb();
  for (const token of tokens) {
    try {
      await db
        .update(pushTokens)
        .set({ isValid: false, updatedAt: new Date() })
        .where(eq(pushTokens.token, token));
    } catch (error) {
      console.error(`Failed to invalidate token: ${error}`);
    }
  }
}

/**
 * Update plant's last watered date
 */
export async function markPlantWatered(
  plantId: string,
  userId: string,
): Promise<void> {
  const db = getDb();
  await db
    .update(plants)
    .set({ lastWateredAt: new Date(), updatedAt: new Date() })
    .where(and(eq(plants.id, plantId), eq(plants.userId, userId)));
}
