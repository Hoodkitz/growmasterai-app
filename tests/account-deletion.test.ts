import { describe, expect, it } from "vitest";
import { getTableName } from "drizzle-orm";
import { deleteAccountData, type DeletionDb } from "../server/account-deletion";

function fakeDb(selectRows: Record<string, { id: number }[]> = {}) {
  const deleted: string[] = [];
  const db: DeletionDb = {
    delete: (table) => ({
      where: async () => {
        deleted.push(getTableName(table));
      },
    }),
    select: () => ({
      from: (table) => ({
        where: async () => selectRows[getTableName(table)] ?? [],
      }),
    }),
  };
  return { db, deleted };
}

describe("deleteAccountData", () => {
  it("removes user-owned data and the user row last", async () => {
    const { db, deleted } = fakeDb();
    await deleteAccountData(db, { id: 7, openId: "open-7" });
    for (const table of [
      "plants",
      "journalEntries",
      "diagnoses",
      "communityPosts",
      "postComments",
      "postLikes",
      "messages",
      "auctionBids",
      "giveawayEntries",
      "pushTokens",
      "auth_tokens",
      "user_credentials",
    ]) {
      expect(deleted, table).toContain(table);
    }
    expect(deleted[deleted.length - 1]).toBe("users");
  });

  it("skips vendor data when the user has no vendor profile", async () => {
    const { db, deleted } = fakeDb();
    await deleteAccountData(db, { id: 7, openId: "open-7" });
    expect(deleted).not.toContain("vendors");
    expect(deleted).not.toContain("vendorProducts");
  });

  it("deletes a vendor profile with products, auctions and bids", async () => {
    const { db, deleted } = fakeDb({
      vendors: [{ id: 3 }],
      auctions: [{ id: 11 }],
    });
    await deleteAccountData(db, { id: 7, openId: "open-7" });
    for (const table of [
      "vendors",
      "vendorProducts",
      "vendorLeads",
      "adBanners",
      "auctions",
    ]) {
      expect(deleted, table).toContain(table);
    }
    expect(deleted.indexOf("auctions")).toBeLessThan(
      deleted.indexOf("vendors"),
    );
  });

  it("deletes comments and likes on the user's own posts", async () => {
    const { db, deleted } = fakeDb({ communityPosts: [{ id: 5 }] });
    await deleteAccountData(db, { id: 7, openId: "open-7" });
    // once for comments on own posts, once for the user's own comments
    expect(deleted.filter((t) => t === "postComments")).toHaveLength(2);
    expect(deleted.filter((t) => t === "postLikes")).toHaveLength(2);
  });
});
