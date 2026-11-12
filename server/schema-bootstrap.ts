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

/** Smart-Grow-Tabellen (drizzle 0006): nur anlegen, nie ändern oder löschen. */
export async function ensureSmartGrowSchema(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS \`growCommands\` (
	\`id\` int AUTO_INCREMENT NOT NULL,
	\`tentId\` int NOT NULL,
	\`deviceId\` int NOT NULL,
	\`actuator\` varchar(20) NOT NULL,
	\`payload\` json NOT NULL,
	\`reason\` varchar(300) NOT NULL,
	\`source\` enum('controller','ai','user','safety') NOT NULL,
	\`status\` enum('proposed','pending','sent','done','failed','expired','rejected') NOT NULL,
	\`result\` varchar(200),
	\`createdAt\` bigint NOT NULL,
	\`sentAt\` bigint,
	\`doneAt\` bigint,
	CONSTRAINT \`growCommands_id\` PRIMARY KEY(\`id\`),
	KEY \`growCommands_device_status\` (\`deviceId\`,\`status\`),
	KEY \`growCommands_tent_created\` (\`tentId\`,\`createdAt\`)
)`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS \`growDevices\` (
	\`id\` int AUTO_INCREMENT NOT NULL,
	\`tentId\` int NOT NULL,
	\`userId\` int NOT NULL,
	\`name\` varchar(80) NOT NULL,
	\`kind\` enum('http','simulator','homeassistant') NOT NULL,
	\`tokenHash\` varchar(64),
	\`tokenHint\` varchar(16),
	\`caps\` json NOT NULL,
	\`state\` json,
	\`lastSeenAt\` bigint,
	\`firmware\` varchar(40),
	\`createdAt\` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT \`growDevices_id\` PRIMARY KEY(\`id\`),
	CONSTRAINT \`growDevices_token_unique\` UNIQUE(\`tokenHash\`),
	KEY \`growDevices_tent_idx\` (\`tentId\`)
)`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS \`growEvents\` (
	\`id\` int AUTO_INCREMENT NOT NULL,
	\`tentId\` int NOT NULL,
	\`level\` enum('info','warn','alarm') NOT NULL,
	\`kind\` varchar(40) NOT NULL,
	\`message\` varchar(500) NOT NULL,
	\`createdAt\` bigint NOT NULL,
	CONSTRAINT \`growEvents_id\` PRIMARY KEY(\`id\`),
	KEY \`growEvents_tent_created\` (\`tentId\`,\`createdAt\`)
)`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS \`growReadings\` (
	\`id\` bigint AUTO_INCREMENT NOT NULL,
	\`tentId\` int NOT NULL,
	\`deviceId\` int NOT NULL,
	\`metric\` varchar(20) NOT NULL,
	\`value\` double NOT NULL,
	\`ts\` bigint NOT NULL,
	CONSTRAINT \`growReadings_id\` PRIMARY KEY(\`id\`),
	KEY \`growReadings_tent_metric_ts\` (\`tentId\`,\`metric\`,\`ts\`)
)`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS \`growSnapshots\` (
	\`id\` int AUTO_INCREMENT NOT NULL,
	\`tentId\` int NOT NULL,
	\`deviceId\` int NOT NULL,
	\`storageKey\` varchar(300) NOT NULL,
	\`analysis\` json,
	\`createdAt\` bigint NOT NULL,
	CONSTRAINT \`growSnapshots_id\` PRIMARY KEY(\`id\`),
	KEY \`growSnapshots_tent_created\` (\`tentId\`,\`createdAt\`)
)`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS \`growTents\` (
	\`id\` int AUTO_INCREMENT NOT NULL,
	\`userId\` int NOT NULL,
	\`name\` varchar(80) NOT NULL,
	\`settings\` json NOT NULL,
	\`limits\` json,
	\`automation\` json,
	\`adjustments\` json,
	\`mode\` enum('off','assist','auto') NOT NULL DEFAULT 'assist',
	\`simState\` json,
	\`lastTickAt\` bigint,
	\`aiReviewAt\` bigint,
	\`aiSummary\` json,
	\`createdAt\` timestamp NOT NULL DEFAULT (now()),
	\`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT \`growTents_id\` PRIMARY KEY(\`id\`),
	KEY \`growTents_user_idx\` (\`userId\`)
)`);
    console.log("[db] smart grow schema ready");
  } catch (error) {
    console.error("[db] smart grow schema bootstrap failed:", error);
  }
}
