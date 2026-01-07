// server/_core/index.ts
import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// drizzle/schema.ts
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, json } from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "vendor"]).default("user").notNull(),
  // Profile
  avatarUrl: text("avatarUrl"),
  bio: text("bio"),
  location: varchar("location", { length: 100 }),
  isPublic: boolean("isPublic").default(true),
  // Gamification
  level: int("level").default(1).notNull(),
  xp: int("xp").default(0).notNull(),
  streak: int("streak").default(0).notNull(),
  lastActiveAt: timestamp("lastActiveAt"),
  // Subscription
  subscriptionTier: mysqlEnum("subscriptionTier", ["free", "premium", "pro"]).default("free").notNull(),
  subscriptionExpiresAt: timestamp("subscriptionExpiresAt"),
  revenuecatId: varchar("revenuecatId", { length: 64 }),
  // Stats
  totalPlants: int("totalPlants").default(0).notNull(),
  totalHarvests: int("totalHarvests").default(0).notNull(),
  totalYield: decimal("totalYield", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var plants = mysqlTable("plants", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  strain: varchar("strain", { length: 100 }),
  strainType: mysqlEnum("strainType", ["indica", "sativa", "hybrid"]),
  phase: mysqlEnum("phase", ["seedling", "vegetative", "flowering", "harvest", "curing", "completed"]).default("seedling").notNull(),
  startDate: timestamp("startDate").defaultNow().notNull(),
  harvestDate: timestamp("harvestDate"),
  // Growing conditions
  growType: mysqlEnum("growType", ["indoor", "outdoor", "greenhouse"]).default("indoor"),
  medium: varchar("medium", { length: 50 }),
  lightSchedule: varchar("lightSchedule", { length: 20 }),
  // Stats
  height: decimal("height", { precision: 5, scale: 1 }),
  yield: decimal("yield", { precision: 8, scale: 2 }),
  notes: text("notes"),
  imageUrl: text("imageUrl"),
  isArchived: boolean("isArchived").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var journalEntries = mysqlTable("journalEntries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  plantId: int("plantId"),
  type: mysqlEnum("type", ["note", "watering", "feeding", "training", "photo", "measurement", "issue", "milestone"]).default("note").notNull(),
  title: varchar("title", { length: 200 }),
  content: text("content"),
  // Measurements
  height: decimal("height", { precision: 5, scale: 1 }),
  ph: decimal("ph", { precision: 3, scale: 1 }),
  ec: decimal("ec", { precision: 4, scale: 2 }),
  temperature: decimal("temperature", { precision: 4, scale: 1 }),
  humidity: decimal("humidity", { precision: 4, scale: 1 }),
  // Media
  images: json("images").$type(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var diagnoses = mysqlTable("diagnoses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  plantId: int("plantId"),
  imageUrl: text("imageUrl").notNull(),
  // AI Results
  diagnosis: text("diagnosis"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  issues: json("issues").$type(),
  recommendations: json("recommendations").$type(),
  // Additional AI Analysis
  identifiedStrain: varchar("identifiedStrain", { length: 100 }),
  identifiedGender: mysqlEnum("identifiedGender", ["male", "female", "hermaphrodite", "unknown"]),
  growthStage: varchar("growthStage", { length: 50 }),
  healthScore: int("healthScore"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var userAchievements = mysqlTable("userAchievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  achievementId: varchar("achievementId", { length: 50 }).notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
  progress: int("progress").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var communityPosts = mysqlTable("communityPosts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["post", "question", "showcase", "giveaway"]).default("post").notNull(),
  title: varchar("title", { length: 200 }),
  content: text("content").notNull(),
  images: json("images").$type(),
  // Engagement
  likes: int("likes").default(0).notNull(),
  comments: int("comments").default(0).notNull(),
  shares: int("shares").default(0).notNull(),
  // Moderation
  isApproved: boolean("isApproved").default(true),
  isPinned: boolean("isPinned").default(false),
  // Giveaway specific
  giveawayEndsAt: timestamp("giveawayEndsAt"),
  giveawayPrize: text("giveawayPrize"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var postComments = mysqlTable("postComments", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  parentId: int("parentId"),
  content: text("content").notNull(),
  likes: int("likes").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId").notNull(),
  receiverId: int("receiverId").notNull(),
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var vendors = mysqlTable("vendors", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  website: text("website"),
  description: text("description"),
  logoUrl: text("logoUrl"),
  type: mysqlEnum("type", ["seedbank", "growshop", "headshop", "nutrient", "equipment", "other"]).default("other").notNull(),
  // Subscription
  plan: mysqlEnum("plan", ["basic", "professional", "enterprise"]).default("basic").notNull(),
  planExpiresAt: timestamp("planExpiresAt"),
  // Stats
  totalProducts: int("totalProducts").default(0),
  totalSales: int("totalSales").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  // Status
  isVerified: boolean("isVerified").default(false),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var vendorProducts = mysqlTable("vendorProducts", {
  id: int("id").autoincrement().primaryKey(),
  vendorId: int("vendorId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("EUR"),
  category: mysqlEnum("category", ["seeds", "equipment", "nutrients", "accessories", "other"]).default("other").notNull(),
  imageUrl: text("imageUrl"),
  externalUrl: text("externalUrl"),
  // For seeds
  strainName: varchar("strainName", { length: 100 }),
  seedCount: int("seedCount"),
  seedType: mysqlEnum("seedType", ["regular", "feminized", "autoflower"]),
  isActive: boolean("isActive").default(true),
  isFeatured: boolean("isFeatured").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var auctions = mysqlTable("auctions", {
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
  status: mysqlEnum("status", ["pending", "active", "ended", "cancelled"]).default("pending").notNull(),
  totalBids: int("totalBids").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var auctionBids = mysqlTable("auctionBids", {
  id: int("id").autoincrement().primaryKey(),
  auctionId: int("auctionId").notNull(),
  userId: int("userId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var giveaways = mysqlTable("giveaways", {
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
  status: mysqlEnum("status", ["pending", "active", "ended", "cancelled"]).default("pending").notNull(),
  totalEntries: int("totalEntries").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var giveawayEntries = mysqlTable("giveawayEntries", {
  id: int("id").autoincrement().primaryKey(),
  giveawayId: int("giveawayId").notNull(),
  userId: int("userId").notNull(),
  ticketCount: int("ticketCount").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var adBanners = mysqlTable("adBanners", {
  id: int("id").autoincrement().primaryKey(),
  vendorId: int("vendorId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  imageUrl: text("imageUrl").notNull(),
  targetUrl: text("targetUrl").notNull(),
  placement: mysqlEnum("placement", ["home", "community", "strains", "tools"]).default("home").notNull(),
  startsAt: timestamp("startsAt").notNull(),
  endsAt: timestamp("endsAt").notNull(),
  impressions: int("impressions").default(0),
  clicks: int("clicks").default(0),
  costPerClick: decimal("costPerClick", { precision: 6, scale: 4 }),
  totalSpent: decimal("totalSpent", { precision: 10, scale: 2 }).default("0"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var vendorInquiries = mysqlTable("vendorInquiries", {
  id: int("id").autoincrement().primaryKey(),
  companyName: varchar("companyName", { length: 200 }).notNull(),
  contactName: varchar("contactName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  website: text("website"),
  businessType: mysqlEnum("businessType", ["seedbank", "growshop", "headshop", "nutrient", "equipment", "other"]).notNull(),
  message: text("message"),
  status: mysqlEnum("status", ["new", "contacted", "negotiating", "approved", "rejected"]).default("new").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var leaderboardEntries = mysqlTable("leaderboardEntries", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
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
      _db = drizzle(process.env.DATABASE_URL);
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
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
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
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
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
var createOAuthHttpClient = () => axios.create({
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
    const parsed = parseCookieHeader(cookieHeader);
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
    return new SignJWT({
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
      const { payload } = await jwtVerify(cookieValue, secretKey, {
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
import { z as z2 } from "zod";

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
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
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
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
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
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
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
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
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
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
var diagnosisResponseSchema = z2.object({
  problem: z2.string(),
  recommendations: z2.array(z2.string()),
  careTips: z2.array(z2.string()),
  severity: z2.enum(["low", "medium", "high"])
});
var coachResponseSchema = z2.object({
  answer: z2.string(),
  tips: z2.array(z2.string())
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
    analyze: publicProcedure.input(z2.object({
      images: z2.array(z2.string()).min(1).max(4),
      // Base64 encoded images
      notes: z2.string().optional()
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
    detect: publicProcedure.input(z2.object({
      image: z2.string()
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
    identify: publicProcedure.input(z2.object({
      image: z2.string(),
      additionalInfo: z2.string().optional()
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
    checkReadiness: publicProcedure.input(z2.object({
      image: z2.string(),
      strainInfo: z2.string().optional(),
      floweringWeek: z2.number().optional()
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
    ask: publicProcedure.input(z2.object({
      question: z2.string().min(5),
      images: z2.array(z2.string()).max(2).optional()
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
    const server = net.createServer();
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
  const app = express();
  const server = createServer(app);
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
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app);
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });
  app.use(
    "/api/trpc",
    createExpressMiddleware({
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
