import { describe, expect, it } from "vitest";
import { getTableName } from "drizzle-orm";
import {
  deleteAccountData,
  tombstoneOpenId,
  type DeletionDb,
} from "../server/account-deletion";

const SECRET = "test-secret-with-at-least-32-characters!!";

function fakeDb(selectRows: Record<string, { id: number }[]> = {}) {
  const deleted: string[] = [];
  const updated: { table: string; values: Record<string, unknown> }[] = [];
  const db: DeletionDb = {
    update: (table) => ({
      set: (values) => ({
        where: async () => {
          updated.push({ table: getTableName(table), values });
        },
      }),
    }),
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
  return { db, deleted, updated };
}

describe("deleteAccountData", () => {
  it("removes user-owned data and anonymises the user row instead of keeping it", async () => {
    const { db, deleted, updated } = fakeDb();
    await deleteAccountData(db, { id: 7, openId: "open-7" }, SECRET);
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
    // only the cleanup of an older tombstone deletes from users, the account row itself is updated
    expect(deleted.filter((t) => t === "users")).toHaveLength(1);
    expect(updated).toHaveLength(1);
    expect(updated[0].table).toBe("users");
    const values = updated[0].values;
    expect(values.openId).toBe(tombstoneOpenId("open-7", SECRET));
    expect(values.openId).not.toContain("open-7");
    expect(values.loginMethod).toBe("deleted");
    expect(values.email).toBeNull();
    expect(values.name).toBeNull();
  });

  it("makes tombstone ids deterministic, hashed and within the column length", () => {
    expect(tombstoneOpenId("a", SECRET)).toBe(tombstoneOpenId("a", SECRET));
    expect(tombstoneOpenId("a", SECRET)).not.toBe(tombstoneOpenId("b", SECRET));
    expect(tombstoneOpenId("a", SECRET).length).toBeLessThanOrEqual(64);
  });

  it("cannot be recomputed without the server secret", () => {
    expect(tombstoneOpenId("a", SECRET)).not.toBe(
      tombstoneOpenId("a", "another-secret-with-32-characters!!!"),
    );
  });

  it("skips vendor data when the user has no vendor profile", async () => {
    const { db, deleted } = fakeDb();
    await deleteAccountData(db, { id: 7, openId: "open-7" }, SECRET);
    expect(deleted).not.toContain("vendors");
    expect(deleted).not.toContain("vendorProducts");
  });

  it("deletes a vendor profile with products, auctions and bids", async () => {
    const { db, deleted } = fakeDb({
      vendors: [{ id: 3 }],
      auctions: [{ id: 11 }],
    });
    await deleteAccountData(db, { id: 7, openId: "open-7" }, SECRET);
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
    await deleteAccountData(db, { id: 7, openId: "open-7" }, SECRET);
    // once for comments on own posts, once for the user's own comments
    expect(deleted.filter((t) => t === "postComments")).toHaveLength(2);
    expect(deleted.filter((t) => t === "postLikes")).toHaveLength(2);
  });
});
