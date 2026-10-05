import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { authTokens, userCredentials } from "../drizzle/schema";
import { getDb, hashPassword, getUserByOpenId } from "./db";

export type AuthTokenType = "password_reset" | "email_verify";

export const TOKEN_TTL_MS: Record<AuthTokenType, number> = {
  password_reset: 60 * 60_000, // 1 h
  email_verify: 24 * 60 * 60_000, // 24 h
};

// ---------- pure helpers ----------
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function isTokenUsable(row: { expiresAt: Date; usedAt: Date | null }, now = new Date()): boolean {
  return row.usedAt === null && row.expiresAt.getTime() > now.getTime();
}

/** Builds the link sent by mail. APP_BASE_URL (web) wins, otherwise the app deep link (scheme growmasterai). */
export function buildAppLink(path: "reset-password" | "verify-email", token: string, baseUrl = process.env.APP_BASE_URL): string {
  const q = `token=${encodeURIComponent(token)}`;
  if (baseUrl) return `${baseUrl.replace(/\/$/, "")}/${path}?${q}`;
  return `growmasterai://${path}?${q}`;
}

// ---------- DB ----------
export async function getCredentialByEmail(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [row] = await db
    .select({ openId: userCredentials.openId, email: userCredentials.email, emailVerifiedAt: userCredentials.emailVerifiedAt })
    .from(userCredentials)
    .where(eq(userCredentials.email, email.trim().toLowerCase()))
    .limit(1);
  return row ?? null;
}

/** Creates a new token and invalidates older unused tokens of the same type for this user. */
export async function createAuthToken(openId: string, type: AuthTokenType, now = new Date()): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(authTokens)
    .set({ usedAt: now })
    .where(and(eq(authTokens.openId, openId), eq(authTokens.type, type), isNull(authTokens.usedAt)));
  const { token, hash } = generateToken();
  await db.insert(authTokens).values({ openId, type, tokenHash: hash, expiresAt: new Date(now.getTime() + TOKEN_TTL_MS[type]) });
  return token;
}

/** Atomically consumes a token (single use). Returns the openId or null if invalid/expired/used. */
export async function consumeAuthToken(token: string, type: AuthTokenType, now = new Date()): Promise<string | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const hash = hashToken(token);
  const [row] = await db
    .select()
    .from(authTokens)
    .where(and(eq(authTokens.tokenHash, hash), eq(authTokens.type, type)))
    .limit(1);
  if (!row || !isTokenUsable(row, now)) return null;
  const [res] = await db
    .update(authTokens)
    .set({ usedAt: now })
    .where(and(eq(authTokens.id, row.id), isNull(authTokens.usedAt)));
  if ((res as any)?.affectedRows !== 1) return null; // lost the race
  return row.openId;
}

export async function setPasswordAndVerify(openId: string, newPassword: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // A successful reset proves control of the mailbox -> also marks the email as verified.
  await db
    .update(userCredentials)
    .set({ passwordHash: hashPassword(newPassword), emailVerifiedAt: new Date() })
    .where(eq(userCredentials.openId, openId));
}

export async function markEmailVerified(openId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(userCredentials).set({ emailVerifiedAt: new Date() }).where(eq(userCredentials.openId, openId));
}

export { getUserByOpenId };
