import { sql } from "drizzle-orm";
import { getDb } from "./db";

/**
 * Additive, idempotent schema bootstrap for the moderation tables
 * (drizzle migrations 0004/0005). Only creates what is missing; never
 * alters or drops existing data.
 */
export async function ensureModerationSchema(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS \`contentReports\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`reporterId\` int NOT NULL,
      \`targetType\` enum('post','comment','message','user') NOT NULL,
      \`targetId\` int NOT NULL,
      \`reportedUserId\` int NOT NULL,
      \`reason\` varchar(40) NOT NULL,
      \`details\` varchar(500),
      \`status\` enum('open','actioned','dismissed') NOT NULL DEFAULT 'open',
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      CONSTRAINT \`contentReports_id\` PRIMARY KEY(\`id\`),
      CONSTRAINT \`contentReports_reporter_target_unique\` UNIQUE(\`reporterId\`,\`targetType\`,\`targetId\`)
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS \`userBlocks\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`blockerId\` int NOT NULL,
      \`blockedId\` int NOT NULL,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      CONSTRAINT \`userBlocks_id\` PRIMARY KEY(\`id\`),
      CONSTRAINT \`userBlocks_blocker_blocked_unique\` UNIQUE(\`blockerId\`,\`blockedId\`)
    )`);
    const [rows] = (await db.execute(
      sql`SELECT COUNT(*) AS c FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'communityPosts' AND COLUMN_NAME = 'hiddenReason'`,
    )) as unknown as [{ c: number | string }[]];
    if (Number(rows?.[0]?.c ?? 0) === 0) {
      await db.execute(
        sql`ALTER TABLE \`communityPosts\` ADD \`hiddenReason\` varchar(10)`,
      );
    }
    console.log("[db] moderation schema ready");
  } catch (error) {
    console.error("[db] moderation schema bootstrap failed:", error);
  }
}
