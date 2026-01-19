import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { getDb } from "./db";
import { plants, journalEntries, communityPosts, postComments, vendors, vendorProducts, messages, users, auctions, giveaways, diagnoses, userAchievements, vendorLeads, adBanners } from "../drizzle/schema";
import { eq, and, desc, sql, or, ne, gt, count } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";

// Diagnosis response schema
const diagnosisResponseSchema = z.object({
  problem: z.string(),
  recommendations: z.array(z.string()),
  careTips: z.array(z.string()),
  severity: z.enum(["low", "medium", "high"]),
});

// Coach response schema
const coachResponseSchema = z.object({
  answer: z.string(),
  tips: z.array(z.string()),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Plant diagnosis with AI
  diagnosis: router({
    analyze: publicProcedure
      .input(z.object({
        images: z.array(z.string()).min(1).max(4), // Base64 encoded images
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const imageContents = input.images.map((img) => ({
          type: "image_url" as const,
          image_url: {
            url: img.startsWith("data:") ? img : `data:image/jpeg;base64,${img}`,
            detail: "high" as const,
          },
        }));

        const result = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Du bist ein Experte für Cannabis-Pflanzengesundheit und -diagnose. Analysiere die bereitgestellten Bilder und identifiziere alle Probleme, Krankheiten, Schädlinge oder Nährstoffmängel.

Antworte IMMER auf Deutsch und im folgenden JSON-Format:
{
  "problem": "Detaillierte Beschreibung des identifizierten Problems",
  "recommendations": ["Empfehlung 1", "Empfehlung 2", "Empfehlung 3"],
  "careTips": ["Pflege-Tipp 1", "Pflege-Tipp 2", "Pflege-Tipp 3"],
  "severity": "low" | "medium" | "high"
}

Wenn die Pflanze gesund aussieht, beschreibe ihren guten Zustand und gib allgemeine Pflegetipps.`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text" as const,
                  text: input.notes
                    ? `Analysiere diese Cannabis-Pflanze. Zusätzliche Notizen vom Nutzer: ${input.notes}`
                    : "Analysiere diese Cannabis-Pflanze und identifiziere alle Probleme oder Auffälligkeiten.",
                },
                ...imageContents,
              ],
            },
          ],
          responseFormat: {
            type: "json_object",
          },
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
              severity: "medium" as const,
            };
          }
        }

        return {
          problem: "Analyse konnte nicht durchgeführt werden.",
          recommendations: ["Bitte versuche es erneut mit besseren Bildern."],
          careTips: [],
          severity: "low" as const,
        };
      }),
  }),

  // Gender Detection AI
  gender: router({
    detect: publicProcedure
      .input(z.object({
        image: z.string(), // Base64 encoded image
      }))
      .mutation(async ({ input }) => {
        const result = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Du bist ein Experte für Cannabis-Geschlechtsbestimmung. Analysiere das Bild und bestimme das Geschlecht der Pflanze.

Antworte IMMER auf Deutsch und im folgenden JSON-Format:
{
  "gender": "male" | "female" | "hermaphrodite" | "unknown",
  "confidence": 0-100,
  "indicators": ["Indikator 1", "Indikator 2"],
  "explanation": "Erklärung der Bestimmung",
  "recommendation": "Empfehlung was zu tun ist"
}

Weiblich: Weiße Härchen (Stigmen) an den Nodien
Männlich: Kleine runde Pollensäcke an den Nodien
Zwitter: Beide Merkmale vorhanden`,
            },
            {
              role: "user",
              content: [
                { type: "text" as const, text: "Bestimme das Geschlecht dieser Cannabis-Pflanze." },
                {
                  type: "image_url" as const,
                  image_url: {
                    url: input.image.startsWith("data:") ? input.image : `data:image/jpeg;base64,${input.image}`,
                    detail: "high" as const,
                  },
                },
              ],
            },
          ],
          responseFormat: { type: "json_object" },
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
      }),
  }),

  // Strain Identification AI
  strain: router({
    identify: publicProcedure
      .input(z.object({
        image: z.string(),
        additionalInfo: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Du bist ein Experte für Cannabis-Sorten-Identifikation. Analysiere das Bild und versuche die Sorte zu identifizieren.

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
  "healthAssessment": "Kurze Gesundheitseinschätzung",
  "tips": ["Tipp 1", "Tipp 2"]
}

Gib bis zu 3 mögliche Sorten an, sortiert nach Wahrscheinlichkeit.`,
            },
            {
              role: "user",
              content: [
                { type: "text" as const, text: input.additionalInfo ? `Identifiziere diese Cannabis-Sorte. Zusätzliche Info: ${input.additionalInfo}` : "Identifiziere diese Cannabis-Sorte." },
                {
                  type: "image_url" as const,
                  image_url: {
                    url: input.image.startsWith("data:") ? input.image : `data:image/jpeg;base64,${input.image}`,
                    detail: "high" as const,
                  },
                },
              ],
            },
          ],
          responseFormat: { type: "json_object" },
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
      }),
  }),

  // Harvest Readiness AI
  harvest: router({
    checkReadiness: publicProcedure
      .input(z.object({
        image: z.string(),
        strainInfo: z.string().optional(),
        floweringWeek: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Du bist ein Experte für Cannabis-Erntezeitpunkt-Bestimmung. Analysiere die Trichome und bestimme den optimalen Erntezeitpunkt.

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

Klar = zu früh, Milchig = THC-Peak, Bernstein = mehr CBD/CBN, entspannender`,
            },
            {
              role: "user",
              content: [
                { type: "text" as const, text: `Analysiere die Erntereife dieser Cannabis-Pflanze.${input.strainInfo ? ` Sorte: ${input.strainInfo}` : ""}${input.floweringWeek ? ` Blütewoche: ${input.floweringWeek}` : ""}` },
                {
                  type: "image_url" as const,
                  image_url: {
                    url: input.image.startsWith("data:") ? input.image : `data:image/jpeg;base64,${input.image}`,
                    detail: "high" as const,
                  },
                },
              ],
            },
          ],
          responseFormat: { type: "json_object" },
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
      }),
  }),

  // Grow Coach AI Chat
  coach: router({
    ask: publicProcedure
      .input(z.object({
        question: z.string().min(5),
        images: z.array(z.string()).max(2).optional(),
      }))
      .mutation(async ({ input }) => {
        const imageContents = input.images?.map((img) => ({
          type: "image_url" as const,
          image_url: {
            url: img.startsWith("data:") ? img : `data:image/jpeg;base64,${img}`,
            detail: "auto" as const,
          },
        })) || [];

        const result = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Du bist ein erfahrener Cannabis-Anbau-Experte und Grow Coach. Beantworte Fragen zum Cannabis-Anbau mit praktischen, hilfreichen Ratschlägen.

Antworte IMMER auf Deutsch und im folgenden JSON-Format:
{
  "answer": "Deine ausführliche Antwort auf die Frage",
  "tips": ["Praktischer Tipp 1", "Praktischer Tipp 2", "Praktischer Tipp 3"]
}

Sei freundlich, informativ und gib konkrete, umsetzbare Ratschläge. Berücksichtige verschiedene Erfahrungslevel der Nutzer.`,
            },
            {
              role: "user",
              content: imageContents.length > 0
                ? [
                  { type: "text" as const, text: input.question },
                  ...imageContents,
                ]
                : input.question,
            },
          ],
          responseFormat: {
            type: "json_object",
          },
        });

        const content = result.choices[0]?.message?.content;
        if (typeof content === "string") {
          try {
            const parsed = JSON.parse(content);
            return coachResponseSchema.parse(parsed);
          } catch {
            return {
              answer: content,
              tips: [],
            };
          }
        }

        return {
          answer: "Entschuldigung, ich konnte deine Frage nicht verarbeiten. Bitte versuche es erneut.",
          tips: [],
        };
      }),
  }),

  // Plants Management
  plants: router({
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        strain: z.string().optional(),
        growthStage: z.enum(['seedling', 'vegetative', 'flowering']),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) {
          throw new Error("Database connection failed");
        }

        const [result] = await db.insert(plants).values({
          userId: ctx.user.id,
          name: input.name,
          strain: input.strain,
          phase: input.growthStage,
          startDate: new Date(),
          growType: "indoor", // Default
        });

        return { success: true, plantId: result.insertId };
      }),
  }),


  // Journal Management
  journal: router({
    create: protectedProcedure
      .input(z.object({
        plantId: z.number().optional(),
        type: z.enum(["note", "watering", "feeding", "training", "photo", "measurement", "issue", "milestone"]),
        title: z.string().optional(),
        content: z.string().optional(),
        height: z.number().optional(),
        ph: z.number().optional(),
        ec: z.number().optional(),
        temperature: z.number().optional(),
        humidity: z.number().optional(),
        images: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const [result] = await db.insert(journalEntries).values({
          userId: ctx.user.id,
          plantId: input.plantId,
          type: input.type,
          title: input.title,
          content: input.content,
          height: input.height ? input.height.toString() : undefined,
          ph: input.ph ? input.ph.toString() : undefined,
          ec: input.ec ? input.ec.toString() : undefined,
          temperature: input.temperature ? input.temperature.toString() : undefined,
          humidity: input.humidity ? input.humidity.toString() : undefined,
          images: input.images,
        });

        return { success: true, entryId: result.insertId };
      }),

    list: protectedProcedure
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return db.select()
          .from(journalEntries)
          .where(eq(journalEntries.userId, ctx.user.id))
          .orderBy(desc(journalEntries.createdAt));
      }),

    byPlant: protectedProcedure
      .input(z.object({ plantId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return db.select()
          .from(journalEntries)
          .where(and(
            eq(journalEntries.userId, ctx.user.id),
            eq(journalEntries.plantId, input.plantId)
          ))
          .orderBy(desc(journalEntries.createdAt));
      }),
  }),


  // Community
  community: router({
    createPost: protectedProcedure
      .input(z.object({
        type: z.enum(["post", "question", "showcase", "giveaway"]),
        title: z.string().optional(),
        content: z.string().min(1),
        images: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const [result] = await db.insert(communityPosts).values({
          userId: ctx.user.id,
          type: input.type,
          title: input.title,
          content: input.content,
          images: input.images,
        });

        return { success: true, postId: result.insertId };
      }),

    listPosts: publicProcedure
      .input(z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.number().nullish(), // For pagination (offset or ID based)
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const limit = input.limit;
        const offset = input.cursor || 0;

        const posts = await db.select({
          post: communityPosts,
          user: {
            name: users.name,
            avatarUrl: users.avatarUrl,
            level: users.level,
          }
        })
          .from(communityPosts)
          .leftJoin(users, eq(communityPosts.userId, users.id))
          .where(eq(communityPosts.isApproved, true))
          .orderBy(desc(communityPosts.createdAt))
          .limit(limit + 1)
          .offset(offset);

        let nextCursor: typeof offset | undefined = undefined;
        if (posts.length > limit) {
          posts.pop();
          nextCursor = offset + limit;
        }

        return {
          items: posts,
          nextCursor,
        };
      }),

    createComment: protectedProcedure
      .input(z.object({
        postId: z.number(),
        content: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const [result] = await db.insert(postComments).values({
          userId: ctx.user.id,
          postId: input.postId,
          content: input.content,
        });

        // Update comment count on post (atomic increment ideally, simplified here)
        await db.update(communityPosts)
          .set({ comments: sql`${communityPosts.comments} + 1` })
          .where(eq(communityPosts.id, input.postId));

        return { success: true, commentId: result.insertId };
      }),
  }),

  // Marketplace
  marketplace: router({
    listProducts: publicProcedure
      .input(z.object({
        category: z.enum(["seeds", "equipment", "nutrients", "accessories", "other"]).optional(),
        limit: z.number().default(20),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        let query = db.select()
          .from(vendorProducts)
          .where(eq(vendorProducts.isActive, true))
          .orderBy(desc(vendorProducts.isFeatured), desc(vendorProducts.createdAt))
          .limit(input.limit);

        if (input.category) {
          // Add category filter if using query builder dynamically or filter locally if needed
          // For simplicity here assume direct where clause
          // query = query.where(eq(vendorProducts.category, input.category))
        }

        return query; // Simplified for now
      }),

    getVendor: publicProcedure
      .input(z.object({ vendorId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return db.select().from(vendors).where(eq(vendors.id, input.vendorId));
      }),

    listAuctions: publicProcedure
      .query(async () => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return db.select()
          .from(auctions)
          .where(eq(auctions.status, "active"))
          .orderBy(desc(auctions.endsAt))
          .limit(20);
      }),

    listRaffles: publicProcedure
      .query(async () => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return db.select()
          .from(giveaways)
          .where(eq(giveaways.status, "active"))
          .orderBy(desc(giveaways.endsAt))
          .limit(20);
      }),
  }),

  // Vendor Portal
  vendor: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      return db.query.vendors.findFirst({
        where: eq(vendors.userId, ctx.user.id),
      });
    }),

    getDashboard: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const vendor = await db.query.vendors.findFirst({
        where: eq(vendors.userId, ctx.user.id),
      });

      if (!vendor) return null;

      const activeProducts = await db
        .select({ count: count() })
        .from(vendorProducts)
        .where(and(eq(vendorProducts.vendorId, vendor.id), eq(vendorProducts.isActive, true)));

      const recentLeads = await db
        .select()
        .from(vendorLeads)
        .where(eq(vendorLeads.vendorId, vendor.id))
        .orderBy(desc(vendorLeads.createdAt))
        .limit(5);

      return {
        revenue: 0, // Placeholder: requires Order system
        sales: vendor.totalSales || 0,
        activeListings: activeProducts[0]?.count || 0,
        rating: parseFloat(vendor.rating || "0"),
        recentLeads,
      };
    }),

    getProducts: protectedProcedure
      .input(z.object({
        limit: z.number().default(50),
      }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const vendor = await db.query.vendors.findFirst({
          where: eq(vendors.userId, ctx.user.id),
        });
        if (!vendor) throw new Error("Vendor profile not found");

        return db.select()
          .from(vendorProducts)
          .where(eq(vendorProducts.vendorId, vendor.id))
          .orderBy(desc(vendorProducts.createdAt))
          .limit(input.limit);
      }),

    getCampaigns: protectedProcedure
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const vendor = await db.query.vendors.findFirst({
          where: eq(vendors.userId, ctx.user.id),
        });
        if (!vendor) throw new Error("Vendor profile not found");

        return db.select()
          .from(adBanners)
          .where(eq(adBanners.vendorId, vendor.id));
      }),

    getLeads: protectedProcedure
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const vendor = await db.query.vendors.findFirst({
          where: eq(vendors.userId, ctx.user.id),
        });
        if (!vendor) throw new Error("Vendor profile not found");

        return db.select()
          .from(vendorLeads)
          .where(eq(vendorLeads.vendorId, vendor.id))
          .orderBy(desc(vendorLeads.createdAt));
      }),

    updateSettings: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        website: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        await db.update(vendors)
          .set({
            name: input.name,
            description: input.description,
            website: input.website,
          })
          .where(eq(vendors.userId, ctx.user.id));

        return { success: true };
      }),
  }),

  // Messages
  messages: router({
    send: protectedProcedure
      .input(z.object({
        receiverId: z.number(),
        content: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        await db.insert(messages).values({
          senderId: ctx.user.id,
          receiverId: input.receiverId,
          content: input.content,
        });

        return { success: true };
      }),

    list: protectedProcedure
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const sender = alias(users, "sender");
        const receiver = alias(users, "receiver");

        return db.select({
          message: messages,
          sender: {
            id: sender.id,
            openId: sender.openId,
            name: sender.name,
            avatarUrl: sender.avatarUrl,
          },
          receiver: {
            id: receiver.id,
            openId: receiver.openId,
            name: receiver.name,
            avatarUrl: receiver.avatarUrl,
          },
        })
          .from(messages)
          .leftJoin(sender, eq(messages.senderId, sender.id))
          .leftJoin(receiver, eq(messages.receiverId, receiver.id))
          .where(or(
            eq(messages.senderId, ctx.user.id),
            eq(messages.receiverId, ctx.user.id)
          ))
          .orderBy(desc(messages.createdAt))
          .limit(50);
      }),
  }),

  achievements: router({
    getStats: protectedProcedure
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id));

        // Count related items
        const [diagnosesCount] = await db.select({ value: count() }).from(diagnoses).where(eq(diagnoses.userId, ctx.user.id));
        const [journalCount] = await db.select({ value: count() }).from(journalEntries).where(eq(journalEntries.userId, ctx.user.id));
        const [postsCount] = await db.select({ value: count() }).from(communityPosts).where(eq(communityPosts.userId, ctx.user.id));

        const unlocked = await db.select().from(userAchievements).where(eq(userAchievements.userId, ctx.user.id));

        return {
          stats: {
            totalDiagnoses: diagnosesCount?.value || 0,
            totalPlants: user.totalPlants,
            totalHarvests: user.totalHarvests,
            totalYield: parseFloat(user.totalYield || "0"),
            journalEntries: journalCount?.value || 0,
            loginStreak: user.streak,
            longestStreak: user.streak, // Default to current streak for MVP
            communityPosts: postsCount?.value || 0,
            helpfulAnswers: 0,
            contestsWon: 0,
            xp: user.xp,
            level: user.level,
          },
          unlockedAchievements: unlocked,
        };
      }),

    unlock: protectedProcedure
      .input(z.object({ achievementId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        // Check if already unlocked
        const [existing] = await db.select()
          .from(userAchievements)
          .where(and(
            eq(userAchievements.userId, ctx.user.id),
            eq(userAchievements.achievementId, input.achievementId)
          ));

        if (existing) return { success: true, new: false };

        await db.insert(userAchievements).values({
          userId: ctx.user.id,
          achievementId: input.achievementId,
        });

        return { success: true, new: true };
      }),

    updateStreak: protectedProcedure
      .mutation(async ({ ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id));
        if (!user) throw new Error("User not found");

        const now = new Date();
        const lastActive = user.lastActiveAt || new Date(0);

        // Check if same day
        const isSameDay = now.toDateString() === lastActive.toDateString();
        if (isSameDay) return { streak: user.streak };

        // Check if consecutive day
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const isConsecutive = yesterday.toDateString() === lastActive.toDateString();

        let newStreak = isConsecutive ? user.streak + 1 : 1;

        await db.update(users)
          .set({
            streak: newStreak,
            lastActiveAt: now,
            lastSignedIn: now,
          })
          .where(eq(users.id, ctx.user.id));

        return { streak: newStreak };
      }),
  }),
});

export type AppRouter = typeof appRouter;
