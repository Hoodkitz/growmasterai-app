import {
  int,
  bigint,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  decimal,
  json,
  uniqueIndex,
  index,
  double,
  mediumtext,
} from "drizzle-orm/mysql-core";

/**
 * GrowMaster AI - Database Schema
 *
 * Dieses Schema definiert alle Tabellen für die App:
 * - Users: Benutzerkonten und Auth
 * - Plants: Pflanzen-Tracking
 * - JournalEntries: Grow-Tagebuch
 * - Diagnoses: KI-Diagnosen
 * - Achievements: Gamification
 * - CommunityPosts: Community-Beiträge
 * - Messages: Direktnachrichten
 * - Vendors: Anbieter/Partner
 * - Subscriptions: Abo-Verwaltung
 */

// ==================== USERS ====================
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "vendor"])
    .default("user")
    .notNull(),

  // Profile
  avatarUrl: text("avatarUrl"),
  bio: text("bio"),
  location: varchar("location", { length: 100 }),
  isPublic: boolean("isPublic").default(true),

  // Gamification
  level: int("level").default(1).notNull(),
  xp: int("xp").default(0).notNull(),
  streak: int("streak").default(0).notNull(),
  longestStreak: int("longestStreak").default(0).notNull(),
  lastActiveAt: timestamp("lastActiveAt"),

  // Subscription
  subscriptionTier: mysqlEnum("subscriptionTier", ["free", "premium", "pro"])
    .default("free")
    .notNull(),
  subscriptionExpiresAt: timestamp("subscriptionExpiresAt"),
  /** Smart-Grow-Add-on (Aufpreis) aktiv bis; null = nicht gebucht */
  smartGrowUntil: timestamp("smartGrowUntil"),
  revenuecatId: varchar("revenuecatId", { length: 64 }),

  // Stats
  totalPlants: int("totalPlants").default(0).notNull(),
  totalHarvests: int("totalHarvests").default(0).notNull(),
  totalYield: decimal("totalYield", { precision: 10, scale: 2 }).default("0"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ==================== PLANTS ====================
export const plants = mysqlTable(
  "plants",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),

    name: varchar("name", { length: 100 }).notNull(),
    strain: varchar("strain", { length: 100 }),
    strainType: mysqlEnum("strainType", ["indica", "sativa", "hybrid"]),

    phase: mysqlEnum("phase", [
      "seedling",
      "vegetative",
      "flowering",
      "harvest",
      "curing",
      "completed",
    ])
      .default("seedling")
      .notNull(),
    startDate: timestamp("startDate").defaultNow().notNull(),
    harvestDate: timestamp("harvestDate"),

    // Growing conditions
    growType: mysqlEnum("growType", [
      "indoor",
      "outdoor",
      "greenhouse",
    ]).default("indoor"),
    medium: varchar("medium", { length: 50 }),
    lightSchedule: varchar("lightSchedule", { length: 20 }),

    // Stats
    height: decimal("height", { precision: 5, scale: 1 }),
    yield: decimal("yield", { precision: 8, scale: 2 }),

    notes: text("notes"),
    imageUrl: text("imageUrl"),
    isArchived: boolean("isArchived").default(false),

    // Offline sync: client-generated id, client-side last-modified (epoch ms) and soft-delete marker (epoch ms)
    clientId: varchar("clientId", { length: 64 }),
    clientUpdatedAt: bigint("clientUpdatedAt", { mode: "number" }),
    deletedAt: bigint("deletedAt", { mode: "number" }),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => ({
    userClientUnique: uniqueIndex("plants_user_client_unique").on(
      t.userId,
      t.clientId,
    ),
  }),
);

export type Plant = typeof plants.$inferSelect;
export type InsertPlant = typeof plants.$inferInsert;

// ==================== JOURNAL ENTRIES ====================
export const journalEntries = mysqlTable("journalEntries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  plantId: int("plantId"),

  type: mysqlEnum("type", [
    "note",
    "watering",
    "feeding",
    "training",
    "photo",
    "measurement",
    "issue",
    "milestone",
  ])
    .default("note")
    .notNull(),
  title: varchar("title", { length: 200 }),
  content: text("content"),

  // Measurements
  height: decimal("height", { precision: 5, scale: 1 }),
  ph: decimal("ph", { precision: 3, scale: 1 }),
  ec: decimal("ec", { precision: 4, scale: 2 }),
  temperature: decimal("temperature", { precision: 4, scale: 1 }),
  humidity: decimal("humidity", { precision: 4, scale: 1 }),

  // Media
  images: json("images").$type<string[]>(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = typeof journalEntries.$inferInsert;

// ==================== DIAGNOSES ====================
export const diagnoses = mysqlTable("diagnoses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  plantId: int("plantId"),

  imageUrl: text("imageUrl").notNull(),

  // AI Results
  diagnosis: text("diagnosis"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  issues: json("issues").$type<string[]>(),
  recommendations: json("recommendations").$type<string[]>(),

  // Additional AI Analysis
  identifiedStrain: varchar("identifiedStrain", { length: 100 }),
  identifiedGender: mysqlEnum("identifiedGender", [
    "male",
    "female",
    "hermaphrodite",
    "unknown",
  ]),
  growthStage: varchar("growthStage", { length: 50 }),
  healthScore: int("healthScore"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Diagnosis = typeof diagnoses.$inferSelect;
export type InsertDiagnosis = typeof diagnoses.$inferInsert;

// ==================== ACHIEVEMENTS ====================
export const userAchievements = mysqlTable("userAchievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),

  achievementId: varchar("achievementId", { length: 50 }).notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
  progress: int("progress").default(0),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;

// ==================== COMMUNITY POSTS ====================
export const communityPosts = mysqlTable("communityPosts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),

  type: mysqlEnum("type", ["post", "question", "showcase", "giveaway"])
    .default("post")
    .notNull(),
  title: varchar("title", { length: 200 }),
  content: text("content").notNull(),
  images: json("images").$type<string[]>(),

  // Engagement
  likes: int("likes").default(0).notNull(),
  comments: int("comments").default(0).notNull(),
  shares: int("shares").default(0).notNull(),

  // Moderation
  isApproved: boolean("isApproved").default(true),
  // Why a post is hidden: "auto" = threshold of reports (reversible by dismiss), "admin" = removed by an admin.
  hiddenReason: varchar("hiddenReason", { length: 10 }),
  isPinned: boolean("isPinned").default(false),

  // Giveaway specific
  giveawayEndsAt: timestamp("giveawayEndsAt"),
  giveawayPrize: text("giveawayPrize"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CommunityPost = typeof communityPosts.$inferSelect;
export type InsertCommunityPost = typeof communityPosts.$inferInsert;

// ==================== POST COMMENTS ====================
export const postComments = mysqlTable("postComments", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  parentId: int("parentId"),

  content: text("content").notNull(),
  likes: int("likes").default(0).notNull(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PostComment = typeof postComments.$inferSelect;
export type InsertPostComment = typeof postComments.$inferInsert;

// ==================== MESSAGES ====================
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId").notNull(),
  receiverId: int("receiverId").notNull(),

  content: text("content").notNull(),
  isRead: boolean("isRead").default(false),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// ==================== VENDORS ====================
export const vendors = mysqlTable("vendors", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),

  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  website: text("website"),
  description: text("description"),
  logoUrl: text("logoUrl"),

  type: mysqlEnum("type", [
    "seedbank",
    "growshop",
    "headshop",
    "nutrient",
    "equipment",
    "other",
  ])
    .default("other")
    .notNull(),

  // Subscription
  plan: mysqlEnum("plan", ["basic", "professional", "enterprise"])
    .default("basic")
    .notNull(),
  planExpiresAt: timestamp("planExpiresAt"),

  // Stats
  totalProducts: int("totalProducts").default(0),
  totalSales: int("totalSales").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }),

  // Status
  isVerified: boolean("isVerified").default(false),
  isActive: boolean("isActive").default(true),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = typeof vendors.$inferInsert;

// ==================== VENDOR PRODUCTS ====================
export const vendorProducts = mysqlTable("vendorProducts", {
  id: int("id").autoincrement().primaryKey(),
  vendorId: int("vendorId").notNull(),

  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("EUR"),

  category: mysqlEnum("category", [
    "seeds",
    "equipment",
    "nutrients",
    "accessories",
    "other",
  ])
    .default("other")
    .notNull(),
  imageUrl: text("imageUrl"),
  externalUrl: text("externalUrl"),

  // For seeds
  strainName: varchar("strainName", { length: 100 }),
  seedCount: int("seedCount"),
  seedType: mysqlEnum("seedType", ["regular", "feminized", "autoflower"]),

  isActive: boolean("isActive").default(true),
  isFeatured: boolean("isFeatured").default(false),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VendorProduct = typeof vendorProducts.$inferSelect;
export type InsertVendorProduct = typeof vendorProducts.$inferInsert;

// ==================== AUCTIONS ====================
export const auctions = mysqlTable("auctions", {
  id: int("id").autoincrement().primaryKey(),
  vendorId: int("vendorId").notNull(),
  productId: int("productId"),

  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),

  startPrice: decimal("startPrice", { precision: 10, scale: 2 }).notNull(),
  currentPrice: decimal("currentPrice", { precision: 10, scale: 2 }).notNull(),
  buyNowPrice: decimal("buyNowPrice", { precision: 10, scale: 2 }),

  startsAt: timestamp("startsAt").notNull(),
  endsAt: timestamp("endsAt").notNull(),

  winnerId: int("winnerId"),
  status: mysqlEnum("status", ["pending", "active", "ended", "cancelled"])
    .default("pending")
    .notNull(),

  totalBids: int("totalBids").default(0),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Auction = typeof auctions.$inferSelect;
export type InsertAuction = typeof auctions.$inferInsert;

// ==================== AUCTION BIDS ====================
export const auctionBids = mysqlTable("auctionBids", {
  id: int("id").autoincrement().primaryKey(),
  auctionId: int("auctionId").notNull(),
  userId: int("userId").notNull(),

  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuctionBid = typeof auctionBids.$inferSelect;
export type InsertAuctionBid = typeof auctionBids.$inferInsert;

// ==================== GIVEAWAYS ====================
export const giveaways = mysqlTable("giveaways", {
  id: int("id").autoincrement().primaryKey(),
  vendorId: int("vendorId"),

  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  prize: text("prize").notNull(),
  prizeValue: decimal("prizeValue", { precision: 10, scale: 2 }),
  imageUrl: text("imageUrl"),

  entryFee: decimal("entryFee", { precision: 10, scale: 2 }).default("0"),
  maxEntries: int("maxEntries"),

  startsAt: timestamp("startsAt").notNull(),
  endsAt: timestamp("endsAt").notNull(),

  winnerId: int("winnerId"),
  status: mysqlEnum("status", ["pending", "active", "ended", "cancelled"])
    .default("pending")
    .notNull(),

  totalEntries: int("totalEntries").default(0),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Giveaway = typeof giveaways.$inferSelect;
export type InsertGiveaway = typeof giveaways.$inferInsert;

// ==================== GIVEAWAY ENTRIES ====================
export const giveawayEntries = mysqlTable(
  "giveawayEntries",
  {
    id: int("id").autoincrement().primaryKey(),
    giveawayId: int("giveawayId").notNull(),
    userId: int("userId").notNull(),

    ticketCount: int("ticketCount").default(1),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({
    // one entry per user and raffle
    giveawayUserUnique: uniqueIndex("giveawayEntries_giveaway_user_unique").on(
      t.giveawayId,
      t.userId,
    ),
  }),
);

export type GiveawayEntry = typeof giveawayEntries.$inferSelect;
export type InsertGiveawayEntry = typeof giveawayEntries.$inferInsert;

// ==================== AD BANNERS ====================
export const adBanners = mysqlTable("adBanners", {
  id: int("id").autoincrement().primaryKey(),
  vendorId: int("vendorId").notNull(),

  title: varchar("title", { length: 200 }).notNull(),
  imageUrl: text("imageUrl").notNull(),
  targetUrl: text("targetUrl").notNull(),

  placement: mysqlEnum("placement", [
    "home",
    "community",
    "strains",
    "tools",
    "marketplace",
  ])
    .default("home")
    .notNull(),

  startsAt: timestamp("startsAt").notNull(),
  endsAt: timestamp("endsAt").notNull(),

  impressions: int("impressions").default(0),
  clicks: int("clicks").default(0),

  costPerClick: decimal("costPerClick", { precision: 6, scale: 4 }),
  totalSpent: decimal("totalSpent", { precision: 10, scale: 2 }).default("0"),

  isActive: boolean("isActive").default(true),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdBanner = typeof adBanners.$inferSelect;
export type InsertAdBanner = typeof adBanners.$inferInsert;

// ==================== VENDOR INQUIRIES ====================
export const vendorInquiries = mysqlTable("vendorInquiries", {
  id: int("id").autoincrement().primaryKey(),

  companyName: varchar("companyName", { length: 200 }).notNull(),
  contactName: varchar("contactName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  website: text("website"),

  businessType: mysqlEnum("businessType", [
    "seedbank",
    "growshop",
    "headshop",
    "nutrient",
    "equipment",
    "other",
  ]).notNull(),
  message: text("message"),

  status: mysqlEnum("status", [
    "new",
    "contacted",
    "negotiating",
    "approved",
    "rejected",
  ])
    .default("new")
    .notNull(),
  notes: text("notes"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VendorInquiry = typeof vendorInquiries.$inferSelect;
export type InsertVendorInquiry = typeof vendorInquiries.$inferInsert;

// ==================== VENDOR LEADS ====================
export const vendorLeads = mysqlTable("vendorLeads", {
  id: int("id").autoincrement().primaryKey(),
  vendorId: int("vendorId").notNull(),

  customerName: varchar("customerName", { length: 200 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }),
  type: mysqlEnum("type", [
    "product_inquiry",
    "bulk_order",
    "consultation",
    "other",
  ])
    .default("product_inquiry")
    .notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).default("0"),
  status: mysqlEnum("status", [
    "new",
    "contacted",
    "qualified",
    "converted",
    "lost",
  ])
    .default("new")
    .notNull(),

  message: text("message"),
  notes: text("notes"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VendorLead = typeof vendorLeads.$inferSelect;
export type InsertVendorLead = typeof vendorLeads.$inferInsert;

// ==================== LEADERBOARD ====================
export const leaderboardEntries = mysqlTable("leaderboardEntries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),

  period: mysqlEnum("period", ["weekly", "monthly", "alltime"]).notNull(),
  periodStart: timestamp("periodStart").notNull(),

  totalYield: decimal("totalYield", { precision: 10, scale: 2 }).default("0"),
  totalPlants: int("totalPlants").default(0),
  totalDiagnoses: int("totalDiagnoses").default(0),
  xpEarned: int("xpEarned").default(0),

  rank: int("rank"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LeaderboardEntry = typeof leaderboardEntries.$inferSelect;
export type InsertLeaderboardEntry = typeof leaderboardEntries.$inferInsert;

// ==================== USER CREDENTIALS (E-Mail/Passwort) ====================
export const userCredentials = mysqlTable("user_credentials", {
  openId: varchar("openId", { length: 64 }).primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  emailVerifiedAt: timestamp("emailVerifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserCredential = typeof userCredentials.$inferSelect;
export type InsertUserCredential = typeof userCredentials.$inferInsert;

// ==================== POST LIKES ====================
export const postLikes = mysqlTable(
  "postLikes",
  {
    id: int("id").autoincrement().primaryKey(),
    postId: int("postId").notNull(),
    userId: int("userId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({
    postUserUnique: uniqueIndex("postLikes_post_user_unique").on(
      t.postId,
      t.userId,
    ),
  }),
);

export type PostLike = typeof postLikes.$inferSelect;
export type InsertPostLike = typeof postLikes.$inferInsert;

// ==================== VENDOR OUTREACH ====================
export const vendorOutreach = mysqlTable("vendorOutreach", {
  id: int("id").autoincrement().primaryKey(),
  companyName: varchar("companyName", { length: 200 }).notNull(),
  contactName: varchar("contactName", { length: 200 }),
  email: varchar("email", { length: 320 }).notNull(),
  website: varchar("website", { length: 500 }),
  vendorType: mysqlEnum("vendorType", [
    "seedbank",
    "growshop",
    "headshop",
    "nutrient",
    "equipment",
    "other",
  ])
    .default("other")
    .notNull(),
  country: varchar("country", { length: 8 }),
  templateId: varchar("templateId", { length: 64 }).notNull(),
  status: mysqlEnum("status", [
    "pending",
    "sent",
    "opened",
    "replied",
    "converted",
    "rejected",
  ])
    .default("pending")
    .notNull(),
  notes: text("notes"),
  sentAt: timestamp("sentAt"),
  openedAt: timestamp("openedAt"),
  repliedAt: timestamp("repliedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VendorOutreachRecord = typeof vendorOutreach.$inferSelect;
export type InsertVendorOutreach = typeof vendorOutreach.$inferInsert;

// ==================== AUTH TOKENS (Passwort-Reset / E-Mail-Verifizierung) ====================
// Only the SHA-256 hash of the token is stored; tokens are single-use (usedAt) and expire (expiresAt).
export const authTokens = mysqlTable(
  "auth_tokens",
  {
    id: int("id").autoincrement().primaryKey(),
    openId: varchar("openId", { length: 64 }).notNull(),
    type: mysqlEnum("type", ["password_reset", "email_verify"]).notNull(),
    tokenHash: varchar("tokenHash", { length: 64 }).notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    usedAt: timestamp("usedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({
    tokenHashUnique: uniqueIndex("auth_tokens_hash_unique").on(t.tokenHash),
  }),
);

export type AuthToken = typeof authTokens.$inferSelect;
export type InsertAuthToken = typeof authTokens.$inferInsert;

// ==================== PUSH TOKENS ====================
export const pushTokens = mysqlTable(
  "pushTokens",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    platform: varchar("platform", { length: 16 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => ({
    tokenUnique: uniqueIndex("pushTokens_token_unique").on(t.token),
  }),
);

export type PushToken = typeof pushTokens.$inferSelect;
export type InsertPushToken = typeof pushTokens.$inferInsert;

// ==================== CONTENT REPORTS (UGC moderation) ====================
export const contentReports = mysqlTable(
  "contentReports",
  {
    id: int("id").autoincrement().primaryKey(),
    reporterId: int("reporterId").notNull(),
    targetType: mysqlEnum("targetType", [
      "post",
      "comment",
      "message",
      "user",
    ]).notNull(),
    targetId: int("targetId").notNull(),
    reportedUserId: int("reportedUserId").notNull(),
    reason: varchar("reason", { length: 40 }).notNull(),
    details: varchar("details", { length: 500 }),
    status: mysqlEnum("status", ["open", "actioned", "dismissed"])
      .default("open")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({
    reporterTargetUnique: uniqueIndex(
      "contentReports_reporter_target_unique",
    ).on(t.reporterId, t.targetType, t.targetId),
  }),
);

export type ContentReport = typeof contentReports.$inferSelect;

// ==================== USER BLOCKS ====================
export const userBlocks = mysqlTable(
  "userBlocks",
  {
    id: int("id").autoincrement().primaryKey(),
    blockerId: int("blockerId").notNull(),
    blockedId: int("blockedId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({
    blockUnique: uniqueIndex("userBlocks_blocker_blocked_unique").on(
      t.blockerId,
      t.blockedId,
    ),
  }),
);

export type UserBlock = typeof userBlocks.$inferSelect;

// ==================== SMART GROW (Sensoren, Steuerung, KI-Autopilot) ====================
export const growTents = mysqlTable(
  "growTents",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 80 }).notNull(),
    /** TentSettings (shared/smartgrow/profiles.ts) */
    settings: json("settings").notNull(),
    /** SafetyLimits, AutomationConfig, KI-Adjustments */
    limits: json("limits"),
    automation: json("automation"),
    adjustments: json("adjustments"),
    mode: mysqlEnum("mode", ["off", "assist", "auto"])
      .default("assist")
      .notNull(),
    /** Simulator-Zustand (nur Simulator-Zelte) */
    simState: json("simState"),
    lastTickAt: bigint("lastTickAt", { mode: "number" }),
    aiReviewAt: bigint("aiReviewAt", { mode: "number" }),
    /** letzte KI-Einschätzung (Text + Hinweise) */
    aiSummary: json("aiSummary"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => ({ userIdx: index("growTents_user_idx").on(t.userId) }),
);

export const growDevices = mysqlTable(
  "growDevices",
  {
    id: int("id").autoincrement().primaryKey(),
    tentId: int("tentId").notNull(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 80 }).notNull(),
    kind: mysqlEnum("kind", ["http", "simulator", "homeassistant"]).notNull(),
    /** SHA-256 des Geräte-Tokens; Klartext sieht der Nutzer nur einmal */
    tokenHash: varchar("tokenHash", { length: 64 }),
    tokenHint: varchar("tokenHint", { length: 16 }),
    /** DeviceCaps: Sensoren + Aktoren */
    caps: json("caps").notNull(),
    /** zuletzt bekannte Aktor-Stellungen */
    state: json("state"),
    lastSeenAt: bigint("lastSeenAt", { mode: "number" }),
    firmware: varchar("firmware", { length: 40 }),
    /** Brücken-Konfiguration (Home Assistant: Adresse, verschlüsselter Token, Zuordnung) */
    config: json("config"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({
    tokenUnique: uniqueIndex("growDevices_token_unique").on(t.tokenHash),
    tentIdx: index("growDevices_tent_idx").on(t.tentId),
  }),
);

export const growReadings = mysqlTable(
  "growReadings",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    tentId: int("tentId").notNull(),
    deviceId: int("deviceId").notNull(),
    metric: varchar("metric", { length: 20 }).notNull(),
    value: double("value").notNull(),
    ts: bigint("ts", { mode: "number" }).notNull(),
  },
  (t) => ({
    tentMetricTs: index("growReadings_tent_metric_ts").on(
      t.tentId,
      t.metric,
      t.ts,
    ),
  }),
);

export const growCommands = mysqlTable(
  "growCommands",
  {
    id: int("id").autoincrement().primaryKey(),
    tentId: int("tentId").notNull(),
    deviceId: int("deviceId").notNull(),
    actuator: varchar("actuator", { length: 20 }).notNull(),
    /** Command (shared/smartgrow/types.ts) */
    payload: json("payload").notNull(),
    reason: varchar("reason", { length: 300 }).notNull(),
    source: mysqlEnum("source", [
      "controller",
      "ai",
      "user",
      "safety",
    ]).notNull(),
    status: mysqlEnum("status", [
      "proposed",
      "pending",
      "sent",
      "done",
      "failed",
      "expired",
      "rejected",
    ]).notNull(),
    result: varchar("result", { length: 200 }),
    createdAt: bigint("createdAt", { mode: "number" }).notNull(),
    sentAt: bigint("sentAt", { mode: "number" }),
    doneAt: bigint("doneAt", { mode: "number" }),
  },
  (t) => ({
    deviceStatus: index("growCommands_device_status").on(t.deviceId, t.status),
    tentCreated: index("growCommands_tent_created").on(t.tentId, t.createdAt),
  }),
);

export const growEvents = mysqlTable(
  "growEvents",
  {
    id: int("id").autoincrement().primaryKey(),
    tentId: int("tentId").notNull(),
    level: mysqlEnum("level", ["info", "warn", "alarm"]).notNull(),
    kind: varchar("kind", { length: 40 }).notNull(),
    message: varchar("message", { length: 500 }).notNull(),
    createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  },
  (t) => ({
    tentCreated: index("growEvents_tent_created").on(t.tentId, t.createdAt),
  }),
);

export const growSnapshots = mysqlTable(
  "growSnapshots",
  {
    id: int("id").autoincrement().primaryKey(),
    tentId: int("tentId").notNull(),
    deviceId: int("deviceId").notNull(),
    /** JPEG als Base64 (klein skaliert, max. ~1,5 MB); je Zelt werden nur die letzten Bilder behalten */
    image: mediumtext("image").notNull(),
    source: mysqlEnum("source", ["device", "app"]).default("device").notNull(),
    /** Ergebnis der KI-Blattkontrolle */
    analysis: json("analysis"),
    createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  },
  (t) => ({
    tentCreated: index("growSnapshots_tent_created").on(t.tentId, t.createdAt),
  }),
);

export type GrowTent = typeof growTents.$inferSelect;
export type GrowDevice = typeof growDevices.$inferSelect;
