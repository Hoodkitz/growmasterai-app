import { eq, sql } from "drizzle-orm";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, userCredentials } from "../drizzle/schema";
import * as schema from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL, { schema, mode: "default" });
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/** Setzt Tier/Ablauf für den ersten passenden openId (RevenueCat app_user_id). Gibt true zurück, wenn ein User aktualisiert wurde. */
export async function setUserSubscriptionByOpenIds(
  openIds: string[],
  tier: "free" | "premium" | "pro",
  expiresAt: Date | null,
): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    throw new Error("database not available");
  }
  // Single query: update all matching users at once (avoids N+1)
  const result = await db
    .update(users)
    .set({ subscriptionTier: tier, subscriptionExpiresAt: expiresAt })
    .where(sql`${users.openId} IN ${openIds}`);
  return (result as unknown as { affectedRows: number }).affectedRows > 0;
}

// ==================== EMAIL / PASSWORD CREDENTIALS ====================
// Table `user_credentials` is defined in drizzle/schema.ts and created by migration 0002.

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPasswordHash(password: string, stored: string): boolean {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(
    password,
    Buffer.from(saltHex, "hex"),
    expected.length,
  );
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function emailOpenId(email: string): string {
  // openId column is varchar(64): use a stable hash of the normalized email.
  const digest = scryptSync(email, "growmaster-email-openid", 24).toString(
    "hex",
  );
  return `email_${digest}`;
}

/** Creates an email user. Throws "EMAIL_EXISTS" if already registered. */
export async function registerEmailUser(
  email: string,
  password: string,
  name: string,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const normalized = email.trim().toLowerCase();
  const openId = emailOpenId(normalized);
  const existing = await db
    .select({ openId: userCredentials.openId })
    .from(userCredentials)
    .where(eq(userCredentials.email, normalized))
    .limit(1);
  if (existing.length > 0) throw new Error("EMAIL_EXISTS");
  try {
    await db
      .insert(userCredentials)
      .values({
        openId,
        email: normalized,
        passwordHash: hashPassword(password),
      });
  } catch (error) {
    // Unique constraint race (duplicate email / openId)
    if (
      (error as any)?.code === "ER_DUP_ENTRY" ||
      (error as any)?.cause?.code === "ER_DUP_ENTRY"
    ) {
      throw new Error("EMAIL_EXISTS");
    }
    throw error;
  }
  await upsertUser({
    openId,
    name,
    email: normalized,
    loginMethod: "email",
    lastSignedIn: new Date(),
  });
  return (await getUserByOpenId(openId))!;
}

/** Returns the user if credentials match, otherwise null. */
export async function verifyEmailLogin(email: string, password: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const normalized = email.trim().toLowerCase();
  const [row] = await db
    .select({
      openId: userCredentials.openId,
      passwordHash: userCredentials.passwordHash,
    })
    .from(userCredentials)
    .where(eq(userCredentials.email, normalized))
    .limit(1);
  if (!row || !verifyPasswordHash(password, row.passwordHash)) return null;
  await upsertUser({ openId: row.openId, lastSignedIn: new Date() });
  return (await getUserByOpenId(row.openId)) ?? null;
}
