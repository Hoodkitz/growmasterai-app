import { createHash } from "node:crypto";
import { eq, inArray, or } from "drizzle-orm";
import {
  adBanners,
  auctionBids,
  auctions,
  authTokens,
  communityPosts,
  diagnoses,
  giveawayEntries,
  journalEntries,
  leaderboardEntries,
  messages,
  plants,
  postComments,
  postLikes,
  pushTokens,
  userAchievements,
  userCredentials,
  users,
  vendorLeads,
  vendorProducts,
  vendors,
} from "../drizzle/schema";

/** Marker id kept instead of the real openId, so a stale session token cannot re-create a deleted account. */
export function tombstoneOpenId(openId: string): string {
  return `del_${createHash("sha256").update(openId).digest("hex").slice(0, 48)}`;
}

/** The small part of a drizzle db or transaction this function needs. */
export interface DeletionDb {
  update(table: any): {
    set(values: any): { where(condition: any): PromiseLike<unknown> };
  };
  delete(table: any): { where(condition: any): PromiseLike<unknown> };
  select(fields: any): {
    from(table: any): { where(condition: any): PromiseLike<any[]> };
  };
}

/**
 * Removes a user and everything stored about them: own plants, journal, diagnoses, posts with
 * their comments and likes, messages in both directions, bids, prize-draw entries, push tokens,
 * login credentials and a vendor profile with its products, auctions, banners and leads.
 * Run it inside a transaction; the users row is anonymised last.
 */
export async function deleteAccountData(
  db: DeletionDb,
  user: { id: number; openId: string },
): Promise<void> {
  const uid = user.id;

  const vendorRows = await db
    .select({ id: vendors.id })
    .from(vendors)
    .where(eq(vendors.userId, uid));
  const vendorIds = vendorRows.map((v) => v.id as number);
  if (vendorIds.length > 0) {
    const auctionRows = await db
      .select({ id: auctions.id })
      .from(auctions)
      .where(inArray(auctions.vendorId, vendorIds));
    const auctionIds = auctionRows.map((a) => a.id as number);
    if (auctionIds.length > 0) {
      await db
        .delete(auctionBids)
        .where(inArray(auctionBids.auctionId, auctionIds));
    }
    await db.delete(auctions).where(inArray(auctions.vendorId, vendorIds));
    await db.delete(adBanners).where(inArray(adBanners.vendorId, vendorIds));
    await db
      .delete(vendorLeads)
      .where(inArray(vendorLeads.vendorId, vendorIds));
    await db
      .delete(vendorProducts)
      .where(inArray(vendorProducts.vendorId, vendorIds));
    await db.delete(vendors).where(inArray(vendors.id, vendorIds));
  }

  const postRows = await db
    .select({ id: communityPosts.id })
    .from(communityPosts)
    .where(eq(communityPosts.userId, uid));
  const postIds = postRows.map((p) => p.id as number);
  if (postIds.length > 0) {
    await db.delete(postComments).where(inArray(postComments.postId, postIds));
    await db.delete(postLikes).where(inArray(postLikes.postId, postIds));
  }
  await db.delete(postComments).where(eq(postComments.userId, uid));
  await db.delete(postLikes).where(eq(postLikes.userId, uid));
  await db.delete(communityPosts).where(eq(communityPosts.userId, uid));

  await db
    .delete(messages)
    .where(or(eq(messages.senderId, uid), eq(messages.receiverId, uid)));

  await db.delete(plants).where(eq(plants.userId, uid));
  await db.delete(journalEntries).where(eq(journalEntries.userId, uid));
  await db.delete(diagnoses).where(eq(diagnoses.userId, uid));
  await db.delete(userAchievements).where(eq(userAchievements.userId, uid));
  await db.delete(auctionBids).where(eq(auctionBids.userId, uid));
  await db.delete(giveawayEntries).where(eq(giveawayEntries.userId, uid));
  await db.delete(leaderboardEntries).where(eq(leaderboardEntries.userId, uid));
  await db.delete(pushTokens).where(eq(pushTokens.userId, uid));

  await db.delete(authTokens).where(eq(authTokens.openId, user.openId));
  await db
    .delete(userCredentials)
    .where(eq(userCredentials.openId, user.openId));

  // The users row stays as an anonymous tombstone (hashed id, no personal data) so that an old
  // session token is rejected instead of being re-provisioned; see authenticateRequest.
  await db
    .update(users)
    .set({
      openId: tombstoneOpenId(user.openId),
      name: null,
      email: null,
      loginMethod: "deleted",
      role: "user",
      avatarUrl: null,
      bio: null,
      location: null,
      isPublic: false,
      level: 1,
      xp: 0,
      streak: 0,
      longestStreak: 0,
      lastActiveAt: null,
      subscriptionTier: "free",
      subscriptionExpiresAt: null,
      revenuecatId: null,
      totalPlants: 0,
      totalHarvests: 0,
      totalYield: "0",
    })
    .where(eq(users.id, uid));
}
