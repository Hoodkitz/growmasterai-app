"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server/_core/index.ts
var import_config = require("dotenv/config");
var import_express = __toESM(require("express"));
var import_http = require("http");
var import_net = __toESM(require("net"));
var import_express2 = require("@trpc/server/adapters/express");

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
var import_drizzle_orm = require("drizzle-orm");
var import_mysql2 = require("drizzle-orm/mysql2");

// drizzle/schema.ts
var import_mysql_core = require("drizzle-orm/mysql-core");
var users = (0, import_mysql_core.mysqlTable)("users", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  openId: (0, import_mysql_core.varchar)("openId", { length: 64 }).notNull().unique(),
  name: (0, import_mysql_core.text)("name"),
  email: (0, import_mysql_core.varchar)("email", { length: 320 }),
  loginMethod: (0, import_mysql_core.varchar)("loginMethod", { length: 64 }),
  role: (0, import_mysql_core.mysqlEnum)("role", ["user", "admin", "vendor"]).default("user").notNull(),
  // Profile
  avatarUrl: (0, import_mysql_core.text)("avatarUrl"),
  bio: (0, import_mysql_core.text)("bio"),
  location: (0, import_mysql_core.varchar)("location", { length: 100 }),
  isPublic: (0, import_mysql_core.boolean)("isPublic").default(true),
  // Gamification
  level: (0, import_mysql_core.int)("level").default(1).notNull(),
  xp: (0, import_mysql_core.int)("xp").default(0).notNull(),
  streak: (0, import_mysql_core.int)("streak").default(0).notNull(),
  lastActiveAt: (0, import_mysql_core.timestamp)("lastActiveAt"),
  // Subscription
  subscriptionTier: (0, import_mysql_core.mysqlEnum)("subscriptionTier", ["free", "premium", "pro"]).default("free").notNull(),
  subscriptionExpiresAt: (0, import_mysql_core.timestamp)("subscriptionExpiresAt"),
  revenuecatId: (0, import_mysql_core.varchar)("revenuecatId", { length: 64 }),
  // Stats
  totalPlants: (0, import_mysql_core.int)("totalPlants").default(0).notNull(),
  totalHarvests: (0, import_mysql_core.int)("totalHarvests").default(0).notNull(),
  totalYield: (0, import_mysql_core.decimal)("totalYield", { precision: 10, scale: 2 }).default("0"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: (0, import_mysql_core.timestamp)("lastSignedIn").defaultNow().notNull()
});
var plants = (0, import_mysql_core.mysqlTable)("plants", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  userId: (0, import_mysql_core.int)("userId").notNull(),
  name: (0, import_mysql_core.varchar)("name", { length: 100 }).notNull(),
  strain: (0, import_mysql_core.varchar)("strain", { length: 100 }),
  strainType: (0, import_mysql_core.mysqlEnum)("strainType", ["indica", "sativa", "hybrid"]),
  phase: (0, import_mysql_core.mysqlEnum)("phase", ["seedling", "vegetative", "flowering", "harvest", "curing", "completed"]).default("seedling").notNull(),
  startDate: (0, import_mysql_core.timestamp)("startDate").defaultNow().notNull(),
  harvestDate: (0, import_mysql_core.timestamp)("harvestDate"),
  // Growing conditions
  growType: (0, import_mysql_core.mysqlEnum)("growType", ["indoor", "outdoor", "greenhouse"]).default("indoor"),
  medium: (0, import_mysql_core.varchar)("medium", { length: 50 }),
  lightSchedule: (0, import_mysql_core.varchar)("lightSchedule", { length: 20 }),
  // Stats
  height: (0, import_mysql_core.decimal)("height", { precision: 5, scale: 1 }),
  yield: (0, import_mysql_core.decimal)("yield", { precision: 8, scale: 2 }),
  notes: (0, import_mysql_core.text)("notes"),
  imageUrl: (0, import_mysql_core.text)("imageUrl"),
  isArchived: (0, import_mysql_core.boolean)("isArchived").default(false),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull()
});
var journalEntries = (0, import_mysql_core.mysqlTable)("journalEntries", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  userId: (0, import_mysql_core.int)("userId").notNull(),
  plantId: (0, import_mysql_core.int)("plantId"),
  type: (0, import_mysql_core.mysqlEnum)("type", ["note", "watering", "feeding", "training", "photo", "measurement", "issue", "milestone"]).default("note").notNull(),
  title: (0, import_mysql_core.varchar)("title", { length: 200 }),
  content: (0, import_mysql_core.text)("content"),
  // Measurements
  height: (0, import_mysql_core.decimal)("height", { precision: 5, scale: 1 }),
  ph: (0, import_mysql_core.decimal)("ph", { precision: 3, scale: 1 }),
  ec: (0, import_mysql_core.decimal)("ec", { precision: 4, scale: 2 }),
  temperature: (0, import_mysql_core.decimal)("temperature", { precision: 4, scale: 1 }),
  humidity: (0, import_mysql_core.decimal)("humidity", { precision: 4, scale: 1 }),
  // Media
  images: (0, import_mysql_core.json)("images").$type(),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull()
});
var diagnoses = (0, import_mysql_core.mysqlTable)("diagnoses", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  userId: (0, import_mysql_core.int)("userId").notNull(),
  plantId: (0, import_mysql_core.int)("plantId"),
  imageUrl: (0, import_mysql_core.text)("imageUrl").notNull(),
  // AI Results
  diagnosis: (0, import_mysql_core.text)("diagnosis"),
  confidence: (0, import_mysql_core.decimal)("confidence", { precision: 5, scale: 2 }),
  issues: (0, import_mysql_core.json)("issues").$type(),
  recommendations: (0, import_mysql_core.json)("recommendations").$type(),
  // Additional AI Analysis
  identifiedStrain: (0, import_mysql_core.varchar)("identifiedStrain", { length: 100 }),
  identifiedGender: (0, import_mysql_core.mysqlEnum)("identifiedGender", ["male", "female", "hermaphrodite", "unknown"]),
  growthStage: (0, import_mysql_core.varchar)("growthStage", { length: 50 }),
  healthScore: (0, import_mysql_core.int)("healthScore"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var userAchievements = (0, import_mysql_core.mysqlTable)("userAchievements", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  userId: (0, import_mysql_core.int)("userId").notNull(),
  achievementId: (0, import_mysql_core.varchar)("achievementId", { length: 50 }).notNull(),
  unlockedAt: (0, import_mysql_core.timestamp)("unlockedAt").defaultNow().notNull(),
  progress: (0, import_mysql_core.int)("progress").default(0),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var communityPosts = (0, import_mysql_core.mysqlTable)("communityPosts", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  userId: (0, import_mysql_core.int)("userId").notNull(),
  type: (0, import_mysql_core.mysqlEnum)("type", ["post", "question", "showcase", "giveaway"]).default("post").notNull(),
  title: (0, import_mysql_core.varchar)("title", { length: 200 }),
  content: (0, import_mysql_core.text)("content").notNull(),
  images: (0, import_mysql_core.json)("images").$type(),
  // Engagement
  likes: (0, import_mysql_core.int)("likes").default(0).notNull(),
  comments: (0, import_mysql_core.int)("comments").default(0).notNull(),
  shares: (0, import_mysql_core.int)("shares").default(0).notNull(),
  // Moderation
  isApproved: (0, import_mysql_core.boolean)("isApproved").default(true),
  isPinned: (0, import_mysql_core.boolean)("isPinned").default(false),
  // Giveaway specific
  giveawayEndsAt: (0, import_mysql_core.timestamp)("giveawayEndsAt"),
  giveawayPrize: (0, import_mysql_core.text)("giveawayPrize"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull()
});
var postComments = (0, import_mysql_core.mysqlTable)("postComments", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  postId: (0, import_mysql_core.int)("postId").notNull(),
  userId: (0, import_mysql_core.int)("userId").notNull(),
  parentId: (0, import_mysql_core.int)("parentId"),
  content: (0, import_mysql_core.text)("content").notNull(),
  likes: (0, import_mysql_core.int)("likes").default(0).notNull(),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull()
});
var messages = (0, import_mysql_core.mysqlTable)("messages", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  senderId: (0, import_mysql_core.int)("senderId").notNull(),
  receiverId: (0, import_mysql_core.int)("receiverId").notNull(),
  content: (0, import_mysql_core.text)("content").notNull(),
  isRead: (0, import_mysql_core.boolean)("isRead").default(false),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var vendors = (0, import_mysql_core.mysqlTable)("vendors", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  userId: (0, import_mysql_core.int)("userId"),
  name: (0, import_mysql_core.varchar)("name", { length: 200 }).notNull(),
  email: (0, import_mysql_core.varchar)("email", { length: 320 }).notNull(),
  website: (0, import_mysql_core.text)("website"),
  description: (0, import_mysql_core.text)("description"),
  logoUrl: (0, import_mysql_core.text)("logoUrl"),
  type: (0, import_mysql_core.mysqlEnum)("type", ["seedbank", "growshop", "headshop", "nutrient", "equipment", "other"]).default("other").notNull(),
  // Subscription
  plan: (0, import_mysql_core.mysqlEnum)("plan", ["basic", "professional", "enterprise"]).default("basic").notNull(),
  planExpiresAt: (0, import_mysql_core.timestamp)("planExpiresAt"),
  // Stats
  totalProducts: (0, import_mysql_core.int)("totalProducts").default(0),
  totalSales: (0, import_mysql_core.int)("totalSales").default(0),
  rating: (0, import_mysql_core.decimal)("rating", { precision: 3, scale: 2 }),
  // Status
  isVerified: (0, import_mysql_core.boolean)("isVerified").default(false),
  isActive: (0, import_mysql_core.boolean)("isActive").default(true),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull()
});
var vendorProducts = (0, import_mysql_core.mysqlTable)("vendorProducts", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  vendorId: (0, import_mysql_core.int)("vendorId").notNull(),
  name: (0, import_mysql_core.varchar)("name", { length: 200 }).notNull(),
  description: (0, import_mysql_core.text)("description"),
  price: (0, import_mysql_core.decimal)("price", { precision: 10, scale: 2 }).notNull(),
  currency: (0, import_mysql_core.varchar)("currency", { length: 3 }).default("EUR"),
  category: (0, import_mysql_core.mysqlEnum)("category", ["seeds", "equipment", "nutrients", "accessories", "other"]).default("other").notNull(),
  imageUrl: (0, import_mysql_core.text)("imageUrl"),
  externalUrl: (0, import_mysql_core.text)("externalUrl"),
  // For seeds
  strainName: (0, import_mysql_core.varchar)("strainName", { length: 100 }),
  seedCount: (0, import_mysql_core.int)("seedCount"),
  seedType: (0, import_mysql_core.mysqlEnum)("seedType", ["regular", "feminized", "autoflower"]),
  isActive: (0, import_mysql_core.boolean)("isActive").default(true),
  isFeatured: (0, import_mysql_core.boolean)("isFeatured").default(false),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull()
});
var auctions = (0, import_mysql_core.mysqlTable)("auctions", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  vendorId: (0, import_mysql_core.int)("vendorId").notNull(),
  productId: (0, import_mysql_core.int)("productId"),
  title: (0, import_mysql_core.varchar)("title", { length: 200 }).notNull(),
  description: (0, import_mysql_core.text)("description"),
  imageUrl: (0, import_mysql_core.text)("imageUrl"),
  startPrice: (0, import_mysql_core.decimal)("startPrice", { precision: 10, scale: 2 }).notNull(),
  currentPrice: (0, import_mysql_core.decimal)("currentPrice", { precision: 10, scale: 2 }).notNull(),
  buyNowPrice: (0, import_mysql_core.decimal)("buyNowPrice", { precision: 10, scale: 2 }),
  startsAt: (0, import_mysql_core.timestamp)("startsAt").notNull(),
  endsAt: (0, import_mysql_core.timestamp)("endsAt").notNull(),
  winnerId: (0, import_mysql_core.int)("winnerId"),
  status: (0, import_mysql_core.mysqlEnum)("status", ["pending", "active", "ended", "cancelled"]).default("pending").notNull(),
  totalBids: (0, import_mysql_core.int)("totalBids").default(0),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull()
});
var auctionBids = (0, import_mysql_core.mysqlTable)("auctionBids", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  auctionId: (0, import_mysql_core.int)("auctionId").notNull(),
  userId: (0, import_mysql_core.int)("userId").notNull(),
  amount: (0, import_mysql_core.decimal)("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var giveaways = (0, import_mysql_core.mysqlTable)("giveaways", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  vendorId: (0, import_mysql_core.int)("vendorId"),
  title: (0, import_mysql_core.varchar)("title", { length: 200 }).notNull(),
  description: (0, import_mysql_core.text)("description"),
  prize: (0, import_mysql_core.text)("prize").notNull(),
  prizeValue: (0, import_mysql_core.decimal)("prizeValue", { precision: 10, scale: 2 }),
  imageUrl: (0, import_mysql_core.text)("imageUrl"),
  entryFee: (0, import_mysql_core.decimal)("entryFee", { precision: 10, scale: 2 }).default("0"),
  maxEntries: (0, import_mysql_core.int)("maxEntries"),
  startsAt: (0, import_mysql_core.timestamp)("startsAt").notNull(),
  endsAt: (0, import_mysql_core.timestamp)("endsAt").notNull(),
  winnerId: (0, import_mysql_core.int)("winnerId"),
  status: (0, import_mysql_core.mysqlEnum)("status", ["pending", "active", "ended", "cancelled"]).default("pending").notNull(),
  totalEntries: (0, import_mysql_core.int)("totalEntries").default(0),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull()
});
var giveawayEntries = (0, import_mysql_core.mysqlTable)("giveawayEntries", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  giveawayId: (0, import_mysql_core.int)("giveawayId").notNull(),
  userId: (0, import_mysql_core.int)("userId").notNull(),
  ticketCount: (0, import_mysql_core.int)("ticketCount").default(1),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var adBanners = (0, import_mysql_core.mysqlTable)("adBanners", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  vendorId: (0, import_mysql_core.int)("vendorId").notNull(),
  title: (0, import_mysql_core.varchar)("title", { length: 200 }).notNull(),
  imageUrl: (0, import_mysql_core.text)("imageUrl").notNull(),
  targetUrl: (0, import_mysql_core.text)("targetUrl").notNull(),
  placement: (0, import_mysql_core.mysqlEnum)("placement", ["home", "community", "strains", "tools"]).default("home").notNull(),
  startsAt: (0, import_mysql_core.timestamp)("startsAt").notNull(),
  endsAt: (0, import_mysql_core.timestamp)("endsAt").notNull(),
  impressions: (0, import_mysql_core.int)("impressions").default(0),
  clicks: (0, import_mysql_core.int)("clicks").default(0),
  costPerClick: (0, import_mysql_core.decimal)("costPerClick", { precision: 6, scale: 4 }),
  totalSpent: (0, import_mysql_core.decimal)("totalSpent", { precision: 10, scale: 2 }).default("0"),
  isActive: (0, import_mysql_core.boolean)("isActive").default(true),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull()
});
var vendorInquiries = (0, import_mysql_core.mysqlTable)("vendorInquiries", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  companyName: (0, import_mysql_core.varchar)("companyName", { length: 200 }).notNull(),
  contactName: (0, import_mysql_core.varchar)("contactName", { length: 100 }).notNull(),
  email: (0, import_mysql_core.varchar)("email", { length: 320 }).notNull(),
  phone: (0, import_mysql_core.varchar)("phone", { length: 50 }),
  website: (0, import_mysql_core.text)("website"),
  businessType: (0, import_mysql_core.mysqlEnum)("businessType", ["seedbank", "growshop", "headshop", "nutrient", "equipment", "other"]).notNull(),
  message: (0, import_mysql_core.text)("message"),
  status: (0, import_mysql_core.mysqlEnum)("status", ["new", "contacted", "negotiating", "approved", "rejected"]).default("new").notNull(),
  notes: (0, import_mysql_core.text)("notes"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull()
});
var leaderboardEntries = (0, import_mysql_core.mysqlTable)("leaderboardEntries", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  userId: (0, import_mysql_core.int)("userId").notNull(),
  period: (0, import_mysql_core.mysqlEnum)("period", ["weekly", "monthly", "alltime"]).notNull(),
  periodStart: (0, import_mysql_core.timestamp)("periodStart").notNull(),
  totalYield: (0, import_mysql_core.decimal)("totalYield", { precision: 10, scale: 2 }).default("0"),
  totalPlants: (0, import_mysql_core.int)("totalPlants").default(0),
  totalDiagnoses: (0, import_mysql_core.int)("totalDiagnoses").default(0),
  xpEarned: (0, import_mysql_core.int)("xpEarned").default(0),
  rank: (0, import_mysql_core.int)("rank"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull()
});

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/db.ts
var _db = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = (0, import_mysql2.drizzle)(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where((0, import_drizzle_orm.eq)(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}

// server/_core/cookies.ts
var LOCAL_HOSTS = /* @__PURE__ */ new Set(["localhost", "127.0.0.1", "::1"]);
function isIpAddress(host) {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getParentDomain(hostname) {
  if (LOCAL_HOSTS.has(hostname) || isIpAddress(hostname)) {
    return void 0;
  }
  const parts = hostname.split(".");
  if (parts.length < 3) {
    return void 0;
  }
  return "." + parts.slice(-2).join(".");
}
function getSessionCookieOptions(req) {
  const hostname = req.hostname;
  const domain = getParentDomain(hostname);
  return {
    domain,
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
var import_axios = __toESM(require("axios"));
var import_cookie = require("cookie");
var import_jose = require("jose");
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(EXCHANGE_TOKEN_PATH, payload);
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(GET_USER_INFO_PATH, {
      accessToken: token.accessToken
    });
    return data;
  }
};
var createOAuthHttpClient = () => import_axios.default.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(platforms.filter((p) => typeof p === "string"));
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = (0, import_cookie.parse)(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new import_jose.SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await (0, import_jose.jwtVerify)(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    let token;
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice("Bearer ".length).trim();
    }
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = token || cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
async function syncUser(userInfo) {
  if (!userInfo.openId) {
    throw new Error("openId missing from user info");
  }
  const lastSignedIn = /* @__PURE__ */ new Date();
  await upsertUser({
    openId: userInfo.openId,
    name: userInfo.name || null,
    email: userInfo.email ?? null,
    loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
    lastSignedIn
  });
  const saved = await getUserByOpenId(userInfo.openId);
  return saved ?? {
    openId: userInfo.openId,
    name: userInfo.name,
    email: userInfo.email,
    loginMethod: userInfo.loginMethod ?? null,
    lastSignedIn
  };
}
function buildUserResponse(user) {
  return {
    id: user?.id ?? null,
    openId: user?.openId ?? null,
    name: user?.name ?? null,
    email: user?.email ?? null,
    loginMethod: user?.loginMethod ?? null,
    lastSignedIn: (user?.lastSignedIn ?? /* @__PURE__ */ new Date()).toISOString()
  };
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      await syncUser(userInfo);
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      const frontendUrl = process.env.EXPO_WEB_PREVIEW_URL || process.env.EXPO_PACKAGER_PROXY_URL || "http://localhost:8081";
      res.redirect(302, frontendUrl);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
  app.get("/api/oauth/mobile", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      const user = await syncUser(userInfo);
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({
        app_session_id: sessionToken,
        user: buildUserResponse(user)
      });
    } catch (error) {
      console.error("[OAuth] Mobile exchange failed", error);
      res.status(500).json({ error: "OAuth mobile exchange failed" });
    }
  });
  app.post("/api/auth/logout", (req, res) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });
  app.get("/api/auth/me", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json({ user: buildUserResponse(user) });
    } catch (error) {
      console.error("[Auth] /api/auth/me failed:", error);
      res.status(401).json({ error: "Not authenticated", user: null });
    }
  });
  app.post("/api/auth/session", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
        res.status(400).json({ error: "Bearer token required" });
        return;
      }
      const token = authHeader.slice("Bearer ".length).trim();
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({ success: true, user: buildUserResponse(user) });
    } catch (error) {
      console.error("[Auth] /api/auth/session failed:", error);
      res.status(401).json({ error: "Invalid token" });
    }
  });
}

// server/routers.ts
var import_zod2 = require("zod");

// server/_core/systemRouter.ts
var import_zod = require("zod");

// server/_core/notification.ts
var import_server = require("@trpc/server");
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL("webdevtoken.v1.WebDevService/SendNotification", normalizedBase).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new import_server.TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new import_server.TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new import_server.TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new import_server.TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new import_server.TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new import_server.TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
var import_server2 = require("@trpc/server");
var import_superjson = __toESM(require("superjson"));
var t = import_server2.initTRPC.context().create({
  transformer: import_superjson.default
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new import_server2.TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new import_server2.TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    import_zod.z.object({
      timestamp: import_zod.z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    import_zod.z.object({
      title: import_zod.z.string().min(1, "title is required"),
      content: import_zod.z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/_core/llm.ts
var ensureArray = (value) => Array.isArray(value) ? value : [value];
var normalizeContentPart = (part) => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") {
    return part;
  }
  if (part.type === "image_url") {
    return part;
  }
  if (part.type === "file_url") {
    return part;
  }
  throw new Error("Unsupported message content part");
};
var normalizeMessage = (message) => {
  const { role, name, tool_call_id } = message;
  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
    return {
      role,
      name,
      tool_call_id,
      content
    };
  }
  const contentParts = ensureArray(message.content).map(normalizeContentPart);
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text
    };
  }
  return {
    role,
    name,
    content: contentParts
  };
};
var normalizeToolChoice = (toolChoice, tools) => {
  if (!toolChoice) return void 0;
  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }
  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error("tool_choice 'required' was provided but no tools were configured");
    }
    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }
    return {
      type: "function",
      function: { name: tools[0].function.name }
    };
  }
  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name }
    };
  }
  return toolChoice;
};
var resolveApiUrl = () => ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions";
var assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
};
var normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema
}) => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error("responseFormat json_schema requires a defined schema object");
    }
    return explicitFormat;
  }
  const schema = outputSchema || output_schema;
  if (!schema) return void 0;
  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }
  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
    }
  };
};
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages: messages2,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format
  } = params;
  const payload = {
    model: "gemini-2.5-flash",
    messages: messages2.map(normalizeMessage)
  };
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(toolChoice || tool_choice, tools);
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  payload.max_tokens = 32768;
  payload.thinking = {
    budget_tokens: 128
  };
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`);
  }
  return await response.json();
}

// server/routers.ts
var diagnosisResponseSchema = import_zod2.z.object({
  problem: import_zod2.z.string(),
  recommendations: import_zod2.z.array(import_zod2.z.string()),
  careTips: import_zod2.z.array(import_zod2.z.string()),
  severity: import_zod2.z.enum(["low", "medium", "high"])
});
var coachResponseSchema = import_zod2.z.object({
  answer: import_zod2.z.string(),
  tips: import_zod2.z.array(import_zod2.z.string())
});
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  // Plant diagnosis with AI
  diagnosis: router({
    analyze: publicProcedure.input(import_zod2.z.object({
      images: import_zod2.z.array(import_zod2.z.string()).min(1).max(4),
      // Base64 encoded images
      notes: import_zod2.z.string().optional()
    })).mutation(async ({ input }) => {
      const imageContents = input.images.map((img) => ({
        type: "image_url",
        image_url: {
          url: img.startsWith("data:") ? img : `data:image/jpeg;base64,${img}`,
          detail: "high"
        }
      }));
      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Du bist ein Experte f\xFCr Cannabis-Pflanzengesundheit und -diagnose. Analysiere die bereitgestellten Bilder und identifiziere alle Probleme, Krankheiten, Sch\xE4dlinge oder N\xE4hrstoffm\xE4ngel.

Antworte IMMER auf Deutsch und im folgenden JSON-Format:
{
  "problem": "Detaillierte Beschreibung des identifizierten Problems",
  "recommendations": ["Empfehlung 1", "Empfehlung 2", "Empfehlung 3"],
  "careTips": ["Pflege-Tipp 1", "Pflege-Tipp 2", "Pflege-Tipp 3"],
  "severity": "low" | "medium" | "high"
}

Wenn die Pflanze gesund aussieht, beschreibe ihren guten Zustand und gib allgemeine Pflegetipps.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: input.notes ? `Analysiere diese Cannabis-Pflanze. Zus\xE4tzliche Notizen vom Nutzer: ${input.notes}` : "Analysiere diese Cannabis-Pflanze und identifiziere alle Probleme oder Auff\xE4lligkeiten."
              },
              ...imageContents
            ]
          }
        ],
        responseFormat: {
          type: "json_object"
        }
      });
      const content = result.choices[0]?.message?.content;
      if (typeof content === "string") {
        try {
          const parsed = JSON.parse(content);
          return diagnosisResponseSchema.parse(parsed);
        } catch {
          return {
            problem: content,
            recommendations: [],
            careTips: [],
            severity: "medium"
          };
        }
      }
      return {
        problem: "Analyse konnte nicht durchgef\xFChrt werden.",
        recommendations: ["Bitte versuche es erneut mit besseren Bildern."],
        careTips: [],
        severity: "low"
      };
    })
  }),
  // Gender Detection AI
  gender: router({
    detect: publicProcedure.input(import_zod2.z.object({
      image: import_zod2.z.string()
      // Base64 encoded image
    })).mutation(async ({ input }) => {
      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Du bist ein Experte f\xFCr Cannabis-Geschlechtsbestimmung. Analysiere das Bild und bestimme das Geschlecht der Pflanze.

Antworte IMMER auf Deutsch und im folgenden JSON-Format:
{
  "gender": "male" | "female" | "hermaphrodite" | "unknown",
  "confidence": 0-100,
  "indicators": ["Indikator 1", "Indikator 2"],
  "explanation": "Erkl\xE4rung der Bestimmung",
  "recommendation": "Empfehlung was zu tun ist"
}

Weiblich: Wei\xDFe H\xE4rchen (Stigmen) an den Nodien
M\xE4nnlich: Kleine runde Pollens\xE4cke an den Nodien
Zwitter: Beide Merkmale vorhanden`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Bestimme das Geschlecht dieser Cannabis-Pflanze." },
              {
                type: "image_url",
                image_url: {
                  url: input.image.startsWith("data:") ? input.image : `data:image/jpeg;base64,${input.image}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        responseFormat: { type: "json_object" }
      });
      const content = result.choices[0]?.message?.content;
      if (typeof content === "string") {
        try {
          return JSON.parse(content);
        } catch {
          return { gender: "unknown", confidence: 0, indicators: [], explanation: content, recommendation: "Bitte versuche es mit einem besseren Bild." };
        }
      }
      return { gender: "unknown", confidence: 0, indicators: [], explanation: "Analyse fehlgeschlagen", recommendation: "Bitte versuche es erneut." };
    })
  }),
  // Strain Identification AI
  strain: router({
    identify: publicProcedure.input(import_zod2.z.object({
      image: import_zod2.z.string(),
      additionalInfo: import_zod2.z.string().optional()
    })).mutation(async ({ input }) => {
      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Du bist ein Experte f\xFCr Cannabis-Sorten-Identifikation. Analysiere das Bild und versuche die Sorte zu identifizieren.

Antworte IMMER auf Deutsch und im folgenden JSON-Format:
{
  "possibleStrains": [
    { "name": "Sortenname", "confidence": 0-100, "type": "indica" | "sativa" | "hybrid" }
  ],
  "characteristics": {
    "leafShape": "Beschreibung der Blattform",
    "color": "Farbmerkmale",
    "structure": "Wuchsstruktur",
    "trichomes": "Trichom-Beschreibung"
  },
  "growthStage": "Aktuelles Wachstumsstadium",
  "healthAssessment": "Kurze Gesundheitseinsch\xE4tzung",
  "tips": ["Tipp 1", "Tipp 2"]
}

Gib bis zu 3 m\xF6gliche Sorten an, sortiert nach Wahrscheinlichkeit.`
          },
          {
            role: "user",
            content: [
              { type: "text", text: input.additionalInfo ? `Identifiziere diese Cannabis-Sorte. Zus\xE4tzliche Info: ${input.additionalInfo}` : "Identifiziere diese Cannabis-Sorte." },
              {
                type: "image_url",
                image_url: {
                  url: input.image.startsWith("data:") ? input.image : `data:image/jpeg;base64,${input.image}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        responseFormat: { type: "json_object" }
      });
      const content = result.choices[0]?.message?.content;
      if (typeof content === "string") {
        try {
          return JSON.parse(content);
        } catch {
          return { possibleStrains: [], characteristics: {}, growthStage: "Unbekannt", healthAssessment: content, tips: [] };
        }
      }
      return { possibleStrains: [], characteristics: {}, growthStage: "Unbekannt", healthAssessment: "Analyse fehlgeschlagen", tips: [] };
    })
  }),
  // Harvest Readiness AI
  harvest: router({
    checkReadiness: publicProcedure.input(import_zod2.z.object({
      image: import_zod2.z.string(),
      strainInfo: import_zod2.z.string().optional(),
      floweringWeek: import_zod2.z.number().optional()
    })).mutation(async ({ input }) => {
      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Du bist ein Experte f\xFCr Cannabis-Erntezeitpunkt-Bestimmung. Analysiere die Trichome und bestimme den optimalen Erntezeitpunkt.

Antworte IMMER auf Deutsch und im folgenden JSON-Format:
{
  "readiness": 0-100,
  "trichomeAnalysis": {
    "clear": 0-100,
    "milky": 0-100,
    "amber": 0-100
  },
  "recommendation": "Empfehlung zum Erntezeitpunkt",
  "expectedEffect": "Erwartete Wirkung bei Ernte jetzt",
  "optimalHarvestWindow": "Optimales Erntefenster",
  "tips": ["Tipp 1", "Tipp 2"]
}

Klar = zu fr\xFCh, Milchig = THC-Peak, Bernstein = mehr CBD/CBN, entspannender`
          },
          {
            role: "user",
            content: [
              { type: "text", text: `Analysiere die Erntereife dieser Cannabis-Pflanze.${input.strainInfo ? ` Sorte: ${input.strainInfo}` : ""}${input.floweringWeek ? ` Bl\xFCtewoche: ${input.floweringWeek}` : ""}` },
              {
                type: "image_url",
                image_url: {
                  url: input.image.startsWith("data:") ? input.image : `data:image/jpeg;base64,${input.image}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        responseFormat: { type: "json_object" }
      });
      const content = result.choices[0]?.message?.content;
      if (typeof content === "string") {
        try {
          return JSON.parse(content);
        } catch {
          return { readiness: 0, trichomeAnalysis: { clear: 0, milky: 0, amber: 0 }, recommendation: content, expectedEffect: "", optimalHarvestWindow: "", tips: [] };
        }
      }
      return { readiness: 0, trichomeAnalysis: { clear: 0, milky: 0, amber: 0 }, recommendation: "Analyse fehlgeschlagen", expectedEffect: "", optimalHarvestWindow: "", tips: [] };
    })
  }),
  // Grow Coach AI Chat
  coach: router({
    ask: publicProcedure.input(import_zod2.z.object({
      question: import_zod2.z.string().min(5),
      images: import_zod2.z.array(import_zod2.z.string()).max(2).optional()
    })).mutation(async ({ input }) => {
      const imageContents = input.images?.map((img) => ({
        type: "image_url",
        image_url: {
          url: img.startsWith("data:") ? img : `data:image/jpeg;base64,${img}`,
          detail: "auto"
        }
      })) || [];
      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Du bist ein erfahrener Cannabis-Anbau-Experte und Grow Coach. Beantworte Fragen zum Cannabis-Anbau mit praktischen, hilfreichen Ratschl\xE4gen.

Antworte IMMER auf Deutsch und im folgenden JSON-Format:
{
  "answer": "Deine ausf\xFChrliche Antwort auf die Frage",
  "tips": ["Praktischer Tipp 1", "Praktischer Tipp 2", "Praktischer Tipp 3"]
}

Sei freundlich, informativ und gib konkrete, umsetzbare Ratschl\xE4ge. Ber\xFCcksichtige verschiedene Erfahrungslevel der Nutzer.`
          },
          {
            role: "user",
            content: imageContents.length > 0 ? [
              { type: "text", text: input.question },
              ...imageContents
            ] : input.question
          }
        ],
        responseFormat: {
          type: "json_object"
        }
      });
      const content = result.choices[0]?.message?.content;
      if (typeof content === "string") {
        try {
          const parsed = JSON.parse(content);
          return coachResponseSchema.parse(parsed);
        } catch {
          return {
            answer: content,
            tips: []
          };
        }
      }
      return {
        answer: "Entschuldigung, ich konnte deine Frage nicht verarbeiten. Bitte versuche es erneut.",
        tips: []
      };
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = import_net.default.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = (0, import_express.default)();
  const server = (0, import_http.createServer)(app);
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.header("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });
  app.use(import_express.default.json({ limit: "50mb" }));
  app.use(import_express.default.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app);
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });
  app.use(
    "/api/trpc",
    (0, import_express2.createExpressMiddleware)({
      router: appRouter,
      createContext
    })
  );
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
  });
}
startServer().catch(console.error);
