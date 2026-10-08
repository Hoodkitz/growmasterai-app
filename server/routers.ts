import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { getDb } from "./db";
import {
  plants,
  journalEntries,
  communityPosts,
  postComments,
  vendors,
  vendorProducts,
  messages,
  users,
  auctions,
  auctionBids,
  giveaways,
  giveawayEntries,
  pushTokens,
  diagnoses,
  userAchievements,
  vendorLeads,
  adBanners,
  postLikes,
  vendorOutreach,
  vendorInquiries,
} from "../drizzle/schema";
import {
  generateCacheKey,
  getCachedDiagnosis,
  setCachedDiagnosis,
  deduplicateRequest,
  getCacheStats,
} from "./_core/diagnosisCache";
import { eq, and, desc, sql, or, ne, gt, count, gte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { liveScanLimiter, clientKey } from "./_core/rateLimit";
import { computeStreak } from "./streak";
import {
  mergePlants,
  plantTimestamp,
  type SyncPlant,
} from "../shared/plant-sync";
import { summarizeOutreach } from "../lib/vendor-outreach";
import { alias } from "drizzle-orm/mysql-core";
import { systemRouter } from "./_core/systemRouter";
import {
  publicProcedure,
  protectedProcedure,
  router,
  adminProcedure,
} from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { ACHIEVEMENTS, getLevelFromPoints } from "../lib/gamification";
import { validateBid, validateRaffleEntry } from "../lib/auction-rules";
import { sendExpoPush } from "./push";

// Diagnosis response schema
const diagnosisResponseSchema = z.object({
  problem: z.string(),
  recommendations: z.array(z.string()),
  careTips: z.array(z.string()),
  severity: z.enum(["low", "medium", "high"]),
  plantGender: z
    .enum(["male", "female", "hermaphrodite", "unknown"])
    .optional(),
  genderConfidence: z.number().min(0).max(100).optional(),
  voiceResponse: z.string().optional(),
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
    analyze: protectedProcedure
      .input(
        z.object({
          images: z.array(z.string()).min(1).max(4), // Base64 encoded images
          notes: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        // Generate cache key from images + notes
        const cacheKey = generateCacheKey(input.images, input.notes);

        // Check cache first
        const cached = await getCachedDiagnosis(cacheKey);
        if (cached) {
          console.log("[Diagnosis] Cache hit:", cacheKey.slice(0, 12));
          return cached;
        }

        console.log(
          "[Diagnosis] Cache miss, invoking LLM:",
          cacheKey.slice(0, 12),
        );

        // Deduplicate concurrent requests
        const result = await deduplicateRequest(cacheKey, async () => {
          const imageContents = input.images.map((img) => ({
            type: "image_url" as const,
            image_url: {
              url: img.startsWith("data:")
                ? img
                : `data:image/jpeg;base64,${img}`,
              detail: "high" as const,
            },
          }));

          const startTime = Date.now();
          const llmResult = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `Du bist ein Experte für Cannabis-Pflanzengesundheit und -diagnose. Analysiere die bereitgestellten Bilder und identifiziere alle Probleme, Krankheiten, Schädlinge oder Nährstoffmängel.

WICHTIG: Bestimme auch das Geschlecht der Pflanze (männlich/weiblich/hermaphrodit) anhand sichtbarer Blüten, Pollensäcke oder Stigmata.

Antworte IMMER auf Deutsch und im folgenden JSON-Format:
{
  "problem": "Detaillierte Beschreibung des identifizierten Problems",
  "recommendations": ["Empfehlung 1", "Empfehlung 2", "Empfehlung 3"],
  "careTips": ["Pflege-Tipp 1", "Pflege-Tipp 2", "Pflege-Tipp 3"],
  "severity": "low" | "medium" | "high",
  "plantGender": "male" | "female" | "hermaphrodite" | "unknown",
  "genderConfidence": 0-100 (Zahl),
  "voiceResponse": "Kurze, gesprochene Zusammenfassung für Text-to-Speech (1-2 Sätze)"
}

Geschlechts-Bestimmung:
- "male": Pollensäcke sichtbar (kleine grüne Bälle an Nodien)
- "female": Weiße Stigmata (Härchen) sichtbar
- "hermaphrodite": Sowohl Pollensäcke als auch Stigmata
- "unknown": Geschlecht nicht erkennbar (z.B. vegetative Phase)

Die voiceResponse sollte eine natürlich klingende Zusammenfassung sein, z.B.:
"Deine Pflanze zeigt Anzeichen von Stickstoffmangel. Die Blätter sind gelblich. Erhöhe die Düngergabe."

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

          const duration = Date.now() - startTime;
          console.log(`[Diagnosis] LLM response time: ${duration}ms`);

          const content = llmResult.choices[0]?.message?.content;
          if (typeof content === "string") {
            try {
              const parsed = JSON.parse(content);
              const validated = diagnosisResponseSchema.parse(parsed);

              // Cache the successful response
              await setCachedDiagnosis(cacheKey, validated);

              return validated;
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
        });

        return result;
      }),
  }),

  // Live camera scan: real vision analysis returning positioned overlays
  liveScan: router({
    analyze: protectedProcedure
      .input(z.object({ image: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const limit = liveScanLimiter.check(
          ctx.user ? `u:${ctx.user.id}` : `ip:${clientKey(ctx.req)}`,
        );
        if (!limit.allowed) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `Zu viele Scans. Bitte in ${limit.retryAfterSec}s erneut versuchen.`,
          });
        }
        const result = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Du bist ein Experte für Cannabis-Anbau. Analysiere das Kamerabild und markiere bis zu 4 relevante Stellen.
Antworte IMMER auf Deutsch als JSON:
{"overlays":[{"type":"cut"|"issue"|"healthy"|"tip","x":0-1,"y":0-1,"label":"kurz (max 25 Zeichen)","description":"1-2 Sätze"}]}
x/y sind relative Positionen im Bild (0,0 = links oben). Nur Stellen markieren, die du wirklich im Bild siehst. Ist keine Pflanze erkennbar, gib {"overlays":[]} zurück.`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text" as const,
                  text: "Analysiere dieses Live-Kamerabild.",
                },
                {
                  type: "image_url" as const,
                  image_url: {
                    url: input.image.startsWith("data:")
                      ? input.image
                      : `data:image/jpeg;base64,${input.image}`,
                    detail: "low" as const,
                  },
                },
              ],
            },
          ],
          responseFormat: { type: "json_object" },
        });
        const content = result.choices[0]?.message?.content;
        const schema = z.object({
          overlays: z.array(
            z.object({
              type: z.enum(["cut", "issue", "healthy", "tip"]),
              x: z.number().min(0).max(1),
              y: z.number().min(0).max(1),
              label: z.string(),
              description: z.string(),
            }),
          ),
        });
        try {
          return schema
            .parse(JSON.parse(typeof content === "string" ? content : "{}"))
            .overlays.slice(0, 4);
        } catch {
          return [];
        }
      }),
  }),

  // Gender Detection AI
  gender: router({
    detect: publicProcedure
      .input(
        z.object({
          image: z.string(), // Base64 encoded image
        }),
      )
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
                {
                  type: "text" as const,
                  text: "Bestimme das Geschlecht dieser Cannabis-Pflanze.",
                },
                {
                  type: "image_url" as const,
                  image_url: {
                    url: input.image.startsWith("data:")
                      ? input.image
                      : `data:image/jpeg;base64,${input.image}`,
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
            return {
              gender: "unknown",
              confidence: 0,
              indicators: [],
              explanation: content,
              recommendation: "Bitte versuche es mit einem besseren Bild.",
            };
          }
        }
        return {
          gender: "unknown",
          confidence: 0,
          indicators: [],
          explanation: "Analyse fehlgeschlagen",
          recommendation: "Bitte versuche es erneut.",
        };
      }),
  }),

  // Strain Identification AI
  strain: router({
    identify: publicProcedure
      .input(
        z.object({
          image: z.string(),
          additionalInfo: z.string().optional(),
        }),
      )
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
                {
                  type: "text" as const,
                  text: input.additionalInfo
                    ? `Identifiziere diese Cannabis-Sorte. Zusätzliche Info: ${input.additionalInfo}`
                    : "Identifiziere diese Cannabis-Sorte.",
                },
                {
                  type: "image_url" as const,
                  image_url: {
                    url: input.image.startsWith("data:")
                      ? input.image
                      : `data:image/jpeg;base64,${input.image}`,
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
            return {
              possibleStrains: [],
              characteristics: {},
              growthStage: "Unbekannt",
              healthAssessment: content,
              tips: [],
            };
          }
        }
        return {
          possibleStrains: [],
          characteristics: {},
          growthStage: "Unbekannt",
          healthAssessment: "Analyse fehlgeschlagen",
          tips: [],
        };
      }),
  }),

  // Harvest Readiness AI
  harvest: router({
    checkReadiness: publicProcedure
      .input(
        z.object({
          image: z.string(),
          strainInfo: z.string().optional(),
          floweringWeek: z.number().optional(),
        }),
      )
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
                {
                  type: "text" as const,
                  text: `Analysiere die Erntereife dieser Cannabis-Pflanze.${input.strainInfo ? ` Sorte: ${input.strainInfo}` : ""}${input.floweringWeek ? ` Blütewoche: ${input.floweringWeek}` : ""}`,
                },
                {
                  type: "image_url" as const,
                  image_url: {
                    url: input.image.startsWith("data:")
                      ? input.image
                      : `data:image/jpeg;base64,${input.image}`,
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
            return {
              readiness: 0,
              trichomeAnalysis: { clear: 0, milky: 0, amber: 0 },
              recommendation: content,
              expectedEffect: "",
              optimalHarvestWindow: "",
              tips: [],
            };
          }
        }
        return {
          readiness: 0,
          trichomeAnalysis: { clear: 0, milky: 0, amber: 0 },
          recommendation: "Analyse fehlgeschlagen",
          expectedEffect: "",
          optimalHarvestWindow: "",
          tips: [],
        };
      }),
  }),

  // Grow Coach AI Chat
  coach: router({
    ask: protectedProcedure
      .input(
        z.object({
          question: z.string().min(5),
          images: z.array(z.string()).max(2).optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const imageContents =
          input.images?.map((img) => ({
            type: "image_url" as const,
            image_url: {
              url: img.startsWith("data:")
                ? img
                : `data:image/jpeg;base64,${img}`,
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
              content:
                imageContents.length > 0
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
          answer:
            "Entschuldigung, ich konnte deine Frage nicht verarbeiten. Bitte versuche es erneut.",
          tips: [],
        };
      }),
  }),

  // Plants Management
  plants: router({
    /**
     * Offline-first sync: client sends its full local state (plants + tombstones);
     * server merges last-write-wins per clientId, persists changes and returns the merged state.
     */
    sync: protectedProcedure
      .input(
        z.object({
          plants: z
            .array(
              z.object({
                id: z.string().min(1).max(64),
                name: z.string().min(1).max(100),
                strain: z.string().max(100).default(""),
                phase: z.enum([
                  "seedling",
                  "vegetative",
                  "flowering",
                  "harvest",
                ]),
                startDate: z.string().max(40),
                notes: z.string().max(10000).optional(),
                growType: z
                  .enum(["indoor", "outdoor", "greenhouse"])
                  .optional(),
                createdAt: z.string().max(40).optional(),
                updatedAt: z.string().max(40).optional(),
              }),
            )
            .max(500),
          tombstones: z
            .record(z.string().max(64), z.string().max(40))
            .default({}),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });

        const rows = await db
          .select()
          .from(plants)
          .where(
            and(
              eq(plants.userId, ctx.user.id),
              sql`${plants.clientId} IS NOT NULL`,
            ),
          );
        const remote = {
          plants: [] as SyncPlant[],
          tombstones: {} as Record<string, string>,
        };
        const rowByClientId = new Map<string, (typeof rows)[number]>();
        for (const r of rows) {
          const cid = r.clientId!;
          rowByClientId.set(cid, r);
          const iso = new Date(
            r.clientUpdatedAt ?? r.updatedAt.getTime(),
          ).toISOString();
          if (r.deletedAt != null) {
            remote.tombstones[cid] = new Date(r.deletedAt).toISOString();
          } else {
            remote.plants.push({
              id: cid,
              name: r.name,
              strain: r.strain ?? "",
              phase:
                r.phase === "seedling" ||
                r.phase === "vegetative" ||
                r.phase === "flowering"
                  ? r.phase
                  : "harvest",
              startDate: r.startDate.toISOString(),
              notes: r.notes ?? "",
              growType: r.growType ?? undefined,
              createdAt: r.createdAt.toISOString(),
              updatedAt: iso,
            });
          }
        }

        const merged = mergePlants(
          { plants: input.plants, tombstones: input.tombstones },
          remote,
        );

        for (const pl of merged.toPush.plants) {
          const startDate = new Date(pl.startDate);
          const values = {
            name: pl.name,
            strain: pl.strain || null,
            phase: pl.phase,
            startDate: Number.isNaN(startDate.getTime())
              ? new Date()
              : startDate,
            notes: pl.notes || null,
            growType: pl.growType ?? "indoor",
            clientUpdatedAt: plantTimestamp(pl),
            deletedAt: null,
          };
          const existing = rowByClientId.get(pl.id);
          if (existing)
            await db
              .update(plants)
              .set(values)
              .where(eq(plants.id, existing.id));
          else
            await db
              .insert(plants)
              .values({ ...values, userId: ctx.user.id, clientId: pl.id });
        }
        for (const [id, at] of Object.entries(merged.toPush.tombstones)) {
          const deletedAt = Date.parse(at) || Date.now();
          const existing = rowByClientId.get(id);
          if (existing)
            await db
              .update(plants)
              .set({ deletedAt, clientUpdatedAt: deletedAt })
              .where(eq(plants.id, existing.id));
          // Unknown plant deleted offline before it was ever synced: nothing to store.
        }

        return { plants: merged.plants, tombstones: merged.tombstones };
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          strain: z.string().optional(),
          growthStage: z.enum(["seedling", "vegetative", "flowering"]),
        }),
      )
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
      .input(
        z.object({
          plantId: z.number().optional(),
          type: z.enum([
            "note",
            "watering",
            "feeding",
            "training",
            "photo",
            "measurement",
            "issue",
            "milestone",
          ]),
          title: z.string().optional(),
          content: z.string().optional(),
          height: z.number().optional(),
          ph: z.number().optional(),
          ec: z.number().optional(),
          temperature: z.number().optional(),
          humidity: z.number().optional(),
          images: z.array(z.string()).optional(),
        }),
      )
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
          temperature: input.temperature
            ? input.temperature.toString()
            : undefined,
          humidity: input.humidity ? input.humidity.toString() : undefined,
          images: input.images,
        });

        return { success: true, entryId: result.insertId };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      return db
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.userId, ctx.user.id))
        .orderBy(desc(journalEntries.createdAt));
    }),

    byPlant: protectedProcedure
      .input(z.object({ plantId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return db
          .select()
          .from(journalEntries)
          .where(
            and(
              eq(journalEntries.userId, ctx.user.id),
              eq(journalEntries.plantId, input.plantId),
            ),
          )
          .orderBy(desc(journalEntries.createdAt));
      }),
  }),

  // Community
  community: router({
    createPost: protectedProcedure
      .input(
        z.object({
          type: z.enum(["post", "question", "showcase", "giveaway"]),
          title: z.string().optional(),
          content: z.string().min(1),
          images: z.array(z.string()).optional(),
        }),
      )
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
      .input(
        z.object({
          limit: z.number().min(1).max(50).default(20),
          cursor: z.number().nullish(), // For pagination (offset or ID based)
        }),
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const limit = input.limit;
        const offset = input.cursor || 0;

        const posts = await db
          .select({
            post: communityPosts,
            user: {
              name: users.name,
              avatarUrl: users.avatarUrl,
              level: users.level,
            },
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

    likePost: protectedProcedure
      .input(
        z.object({
          postId: z.number(),
          like: z.boolean(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        // Per-user idempotent: the unique (postId, userId) index guarantees one like per user.
        const changed = await db.transaction(async (tx) => {
          if (input.like) {
            const res = await tx
              .insert(postLikes)
              .ignore()
              .values({ postId: input.postId, userId: ctx.user.id });
            return (res[0]?.affectedRows ?? 0) > 0;
          }
          const res = await tx
            .delete(postLikes)
            .where(
              and(
                eq(postLikes.postId, input.postId),
                eq(postLikes.userId, ctx.user.id),
              ),
            );
          return (res[0]?.affectedRows ?? 0) > 0;
        });

        if (changed) {
          await db
            .update(communityPosts)
            .set({
              likes: input.like
                ? sql`${communityPosts.likes} + 1`
                : sql`GREATEST(${communityPosts.likes} - 1, 0)`,
            })
            .where(eq(communityPosts.id, input.postId));
        }

        const [post] = await db
          .select({ likes: communityPosts.likes })
          .from(communityPosts)
          .where(eq(communityPosts.id, input.postId));

        return { success: true, liked: input.like, likes: post?.likes ?? 0 };
      }),

    leaderboard: publicProcedure
      .input(
        z.object({ limit: z.number().min(1).max(50).default(10) }).optional(),
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const rows = await db
          .select({
            id: users.id,
            name: users.name,
            level: users.level,
            xp: users.xp,
          })
          .from(users)
          .orderBy(desc(users.xp))
          .limit(input?.limit ?? 10);

        return rows.map((r, i) => ({ rank: i + 1, ...r }));
      }),

    createComment: protectedProcedure
      .input(
        z.object({
          postId: z.number(),
          content: z.string().min(1),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const [result] = await db.insert(postComments).values({
          userId: ctx.user.id,
          postId: input.postId,
          content: input.content,
        });

        // Update comment count on post (atomic increment ideally, simplified here)
        await db
          .update(communityPosts)
          .set({ comments: sql`${communityPosts.comments} + 1` })
          .where(eq(communityPosts.id, input.postId));

        return { success: true, commentId: result.insertId };
      }),
  }),

  // Marketplace
  marketplace: router({
    listProducts: publicProcedure
      .input(
        z.object({
          category: z
            .enum(["seeds", "equipment", "nutrients", "accessories", "other"])
            .optional(),
          limit: z.number().min(1).max(100).default(20),
          featuredOnly: z.boolean().optional(),
        }),
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const conditions = [eq(vendorProducts.isActive, true)];
        if (input.category)
          conditions.push(eq(vendorProducts.category, input.category));
        if (input.featuredOnly)
          conditions.push(eq(vendorProducts.isFeatured, true));

        return db
          .select()
          .from(vendorProducts)
          .where(and(...conditions))
          .orderBy(
            desc(vendorProducts.isFeatured),
            desc(vendorProducts.createdAt),
          )
          .limit(input.limit);
      }),

    getVendor: publicProcedure
      .input(z.object({ vendorId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return db.select().from(vendors).where(eq(vendors.id, input.vendorId));
      }),

    listAuctions: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      return db
        .select()
        .from(auctions)
        .where(eq(auctions.status, "active"))
        .orderBy(desc(auctions.endsAt))
        .limit(20);
    }),

    listRaffles: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      return db
        .select()
        .from(giveaways)
        .where(eq(giveaways.status, "active"))
        .orderBy(desc(giveaways.endsAt))
        .limit(20);
    }),

    placeBid: protectedProcedure
      .input(
        z.object({
          auctionId: z.number().int(),
          amount: z.number().positive().max(1_000_000),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return db.transaction(async (tx) => {
          const [row] = await tx
            .select({ auction: auctions, ownerUserId: vendors.userId })
            .from(auctions)
            .leftJoin(vendors, eq(vendors.id, auctions.vendorId))
            .where(eq(auctions.id, input.auctionId))
            .for("update")
            .limit(1);
          if (!row)
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Auktion nicht gefunden",
            });
          const a = row.auction;
          const check = validateBid(
            {
              status: a.status,
              startsAt: new Date(a.startsAt),
              endsAt: new Date(a.endsAt),
              vendorOwnerUserId: row.ownerUserId,
              currentPrice: Number(a.currentPrice),
              startPrice: Number(a.startPrice),
              totalBids: a.totalBids ?? 0,
            },
            ctx.user.id,
            input.amount,
          );
          if (!check.ok)
            throw new TRPCError({ code: check.code, message: check.message });

          const amount = input.amount.toFixed(2);
          await tx
            .insert(auctionBids)
            .values({ auctionId: a.id, userId: ctx.user.id, amount });
          await tx
            .update(auctions)
            .set({ currentPrice: amount, totalBids: (a.totalBids ?? 0) + 1 })
            .where(eq(auctions.id, a.id));
          return {
            success: true,
            currentPrice: Number(amount),
            totalBids: (a.totalBids ?? 0) + 1,
          };
        });
      }),

    enterRaffle: protectedProcedure
      .input(z.object({ raffleId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return db.transaction(async (tx) => {
          const [g] = await tx
            .select()
            .from(giveaways)
            .where(eq(giveaways.id, input.raffleId))
            .for("update")
            .limit(1);
          if (!g)
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Verlosung nicht gefunden",
            });
          const [existing] = await tx
            .select({ id: giveawayEntries.id })
            .from(giveawayEntries)
            .where(
              and(
                eq(giveawayEntries.giveawayId, g.id),
                eq(giveawayEntries.userId, ctx.user.id),
              ),
            )
            .limit(1);
          const check = validateRaffleEntry({
            status: g.status,
            startsAt: new Date(g.startsAt),
            endsAt: new Date(g.endsAt),
            maxEntries: g.maxEntries,
            totalEntries: g.totalEntries ?? 0,
            alreadyEntered: !!existing,
          });
          if (!check.ok)
            throw new TRPCError({ code: check.code, message: check.message });

          await tx
            .insert(giveawayEntries)
            .values({ giveawayId: g.id, userId: ctx.user.id, ticketCount: 1 });
          await tx
            .update(giveaways)
            .set({ totalEntries: (g.totalEntries ?? 0) + 1 })
            .where(eq(giveaways.id, g.id));
          return { success: true, totalEntries: (g.totalEntries ?? 0) + 1 };
        });
      }),

    myRaffleEntries: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      const rows = await db
        .select({ giveawayId: giveawayEntries.giveawayId })
        .from(giveawayEntries)
        .where(eq(giveawayEntries.userId, ctx.user.id));
      return rows.map((r) => r.giveawayId);
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
        .where(
          and(
            eq(vendorProducts.vendorId, vendor.id),
            eq(vendorProducts.isActive, true),
          ),
        );

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
      .input(
        z.object({
          limit: z.number().default(50),
        }),
      )
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const vendor = await db.query.vendors.findFirst({
          where: eq(vendors.userId, ctx.user.id),
        });
        if (!vendor) throw new Error("Vendor profile not found");

        return db
          .select()
          .from(vendorProducts)
          .where(eq(vendorProducts.vendorId, vendor.id))
          .orderBy(desc(vendorProducts.createdAt))
          .limit(input.limit);
      }),

    getCampaigns: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const vendor = await db.query.vendors.findFirst({
        where: eq(vendors.userId, ctx.user.id),
      });
      if (!vendor) throw new Error("Vendor profile not found");

      return db
        .select()
        .from(adBanners)
        .where(eq(adBanners.vendorId, vendor.id));
    }),

    getLeads: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const vendor = await db.query.vendors.findFirst({
        where: eq(vendors.userId, ctx.user.id),
      });
      if (!vendor) throw new Error("Vendor profile not found");

      return db
        .select()
        .from(vendorLeads)
        .where(eq(vendorLeads.vendorId, vendor.id))
        .orderBy(desc(vendorLeads.createdAt));
    }),

    updateSettings: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          website: z.string().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        await db
          .update(vendors)
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
  ads: router({
    // Öffentlich: aktive Anzeigen für eine Platzierung (zeitfenster- und isActive-gefiltert)
    active: publicProcedure
      .input(
        z.object({
          placement: z.enum([
            "home",
            "community",
            "strains",
            "tools",
            "marketplace",
          ]),
          limit: z.number().int().min(1).max(10).default(3),
        }),
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const now = new Date();
        return db
          .select({
            id: adBanners.id,
            title: adBanners.title,
            imageUrl: adBanners.imageUrl,
            targetUrl: adBanners.targetUrl,
            placement: adBanners.placement,
            vendorName: vendors.name,
          })
          .from(adBanners)
          .leftJoin(vendors, eq(vendors.id, adBanners.vendorId))
          .where(
            and(
              eq(adBanners.placement, input.placement),
              eq(adBanners.isActive, true),
              sql`${adBanners.startsAt} <= ${now}`,
              sql`${adBanners.endsAt} >= ${now}`,
            ),
          )
          .orderBy(sql`RAND()`)
          .limit(input.limit);
      }),

    // Tracking (öffentlich, nur Zähler; Abrechnung/totalSpent bewusst NICHT hier, da unauthentifiziert manipulierbar)
    trackImpression: publicProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) return { success: false };
        await db
          .update(adBanners)
          .set({ impressions: sql`COALESCE(${adBanners.impressions}, 0) + 1` })
          .where(and(eq(adBanners.id, input.id), eq(adBanners.isActive, true)));
        return { success: true };
      }),

    trackClick: publicProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) return { success: false };
        await db
          .update(adBanners)
          .set({ clicks: sql`COALESCE(${adBanners.clicks}, 0) + 1` })
          .where(and(eq(adBanners.id, input.id), eq(adBanners.isActive, true)));
        return { success: true };
      }),
  }),

  messages: router({
    send: protectedProcedure
      .input(
        z.object({
          receiverId: z.number(),
          content: z.string().min(1),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        if (input.receiverId === ctx.user.id)
          throw new Error("Cannot send a message to yourself");
        const [recipient] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.id, input.receiverId))
          .limit(1);
        if (!recipient) throw new Error("Recipient not found");

        await db.insert(messages).values({
          senderId: ctx.user.id,
          receiverId: input.receiverId,
          content: input.content,
        });

        return { success: true };
      }),

    markRead: protectedProcedure
      .input(z.object({ senderId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        await db
          .update(messages)
          .set({ isRead: true })
          .where(
            and(
              eq(messages.senderId, input.senderId),
              eq(messages.receiverId, ctx.user.id),
              eq(messages.isRead, false),
            ),
          );
        return { success: true };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const sender = alias(users, "sender");
      const receiver = alias(users, "receiver");

      return db
        .select({
          message: messages,
          sender: {
            id: sender.id,
            openId: sender.openId,
            name: sender.name,
            avatarUrl: sender.avatarUrl,
            level: sender.level,
          },
          receiver: {
            id: receiver.id,
            openId: receiver.openId,
            name: receiver.name,
            avatarUrl: receiver.avatarUrl,
            level: receiver.level,
          },
        })
        .from(messages)
        .leftJoin(sender, eq(messages.senderId, sender.id))
        .leftJoin(receiver, eq(messages.receiverId, receiver.id))
        .where(
          or(
            eq(messages.senderId, ctx.user.id),
            eq(messages.receiverId, ctx.user.id),
          ),
        )
        .orderBy(desc(messages.createdAt))
        .limit(50);
    }),
  }),

  achievements: router({
    getStats: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id));

      // Count related items
      const [diagnosesCount] = await db
        .select({ value: count() })
        .from(diagnoses)
        .where(eq(diagnoses.userId, ctx.user.id));
      const [journalCount] = await db
        .select({ value: count() })
        .from(journalEntries)
        .where(eq(journalEntries.userId, ctx.user.id));
      const [postsCount] = await db
        .select({ value: count() })
        .from(communityPosts)
        .where(eq(communityPosts.userId, ctx.user.id));

      const unlocked = await db
        .select()
        .from(userAchievements)
        .where(eq(userAchievements.userId, ctx.user.id));

      return {
        stats: {
          totalDiagnoses: diagnosesCount?.value || 0,
          totalPlants: user.totalPlants,
          totalHarvests: user.totalHarvests,
          totalYield: parseFloat(user.totalYield || "0"),
          journalEntries: journalCount?.value || 0,
          loginStreak: user.streak,
          longestStreak: Math.max(user.longestStreak, user.streak),
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
        const [existing] = await db
          .select()
          .from(userAchievements)
          .where(
            and(
              eq(userAchievements.userId, ctx.user.id),
              eq(userAchievements.achievementId, input.achievementId),
            ),
          );

        if (existing) return { success: true, new: false };

        const def = ACHIEVEMENTS.find((a) => a.id === input.achievementId);
        if (!def) throw new Error("Unknown achievement");

        await db.insert(userAchievements).values({
          userId: ctx.user.id,
          achievementId: input.achievementId,
        });

        // Award XP defined by the achievement and recompute level
        const [current] = await db
          .select({ xp: users.xp })
          .from(users)
          .where(eq(users.id, ctx.user.id));
        const newXp = (current?.xp ?? 0) + def.points;
        await db
          .update(users)
          .set({ xp: newXp, level: getLevelFromPoints(newXp).level })
          .where(eq(users.id, ctx.user.id));

        return { success: true, new: true, xpAwarded: def.points };
      }),

    updateStreak: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id));
      if (!user) throw new Error("User not found");

      const now = new Date();
      const result = computeStreak({
        streak: user.streak,
        longestStreak: user.longestStreak,
        lastActiveAt: user.lastActiveAt,
        now,
      });
      if (result.unchanged)
        return { streak: user.streak, longestStreak: result.longestStreak };

      const newStreak = result.streak;

      await db
        .update(users)
        .set({
          streak: newStreak,
          longestStreak: result.longestStreak,
          lastActiveAt: now,
          lastSignedIn: now,
        })
        .where(eq(users.id, ctx.user.id));

      return { streak: newStreak, longestStreak: result.longestStreak };
    }),
  }),

  // Admin panel (admin role only)
  admin: router({
    stats: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const num = async (q: Promise<{ c: number }[]>) =>
        Number((await q)[0]?.c ?? 0);
      const [
        totalUsers,
        activeUsers,
        premiumUsers,
        proUsers,
        totalDiagnoses,
        totalPosts,
        activeContests,
        pendingRequests,
        activeAds,
      ] = await Promise.all([
        num(db.select({ c: count() }).from(users)),
        num(
          db
            .select({ c: count() })
            .from(users)
            .where(gte(users.lastActiveAt, since)),
        ),
        num(
          db
            .select({ c: count() })
            .from(users)
            .where(eq(users.subscriptionTier, "premium")),
        ),
        num(
          db
            .select({ c: count() })
            .from(users)
            .where(eq(users.subscriptionTier, "pro")),
        ),
        num(db.select({ c: count() }).from(diagnoses)),
        num(db.select({ c: count() }).from(communityPosts)),
        num(
          db
            .select({ c: count() })
            .from(giveaways)
            .where(eq(giveaways.status, "active")),
        ),
        num(
          db
            .select({ c: count() })
            .from(vendorInquiries)
            .where(eq(vendorInquiries.status, "new")),
        ),
        num(
          db
            .select({ c: count() })
            .from(adBanners)
            .where(eq(adBanners.isActive, true)),
        ),
      ]);
      const [ad] = await db
        .select({
          impressions: sql<number>`COALESCE(SUM(${adBanners.impressions}), 0)`,
          revenue: sql<number>`COALESCE(SUM(${adBanners.totalSpent}), 0)`,
        })
        .from(adBanners);
      return {
        totalUsers,
        activeUsers,
        premiumUsers,
        proUsers,
        totalDiagnoses,
        totalPosts,
        activeContests,
        pendingRequests,
        activeAds,
        adImpressions: Number(ad?.impressions ?? 0),
        adRevenue: Number(ad?.revenue ?? 0),
      };
    }),
    vendors: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      return db
        .select()
        .from(vendors)
        .orderBy(desc(vendors.createdAt))
        .limit(200);
    }),
    inquiries: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      return db
        .select()
        .from(vendorInquiries)
        .orderBy(desc(vendorInquiries.createdAt))
        .limit(200);
    }),
    updateInquiry: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum([
            "new",
            "contacted",
            "negotiating",
            "approved",
            "rejected",
          ]),
        }),
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");
        await db
          .update(vendorInquiries)
          .set({ status: input.status })
          .where(eq(vendorInquiries.id, input.id));
        return { success: true };
      }),
    giveaways: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      return db
        .select()
        .from(giveaways)
        .orderBy(desc(giveaways.createdAt))
        .limit(100);
    }),
    endGiveaway: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");
        await db
          .update(giveaways)
          .set({ status: "ended" })
          .where(eq(giveaways.id, input.id));
        return { success: true };
      }),
    createGiveaway: adminProcedure
      .input(
        z.object({
          title: z.string().min(1).max(200),
          prize: z.string().min(1),
          description: z.string().optional(),
          days: z.number().int().min(1).max(365),
        }),
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");
        const now = new Date();
        await db.insert(giveaways).values({
          title: input.title,
          prize: input.prize,
          description: input.description,
          startsAt: now,
          endsAt: new Date(now.getTime() + input.days * 86400000),
          status: "active",
        });
        return { success: true };
      }),
  }),

  // Vendor outreach tracking (persisted; admin only)
  push: router({
    registerToken: protectedProcedure
      .input(
        z.object({
          token: z.string().min(10).max(255),
          platform: z.string().max(16).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!/^(Exponent|Expo)PushToken\[[^\]]+\]$/.test(input.token)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Ungültiges Push-Token",
          });
        }
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");
        await db
          .insert(pushTokens)
          .values({
            userId: ctx.user.id,
            token: input.token,
            platform: input.platform,
          })
          .onDuplicateKeyUpdate({
            set: { userId: ctx.user.id, platform: input.platform ?? null },
          });
        return { success: true };
      }),

    tokenCount: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      const [row] = await db.select({ c: count() }).from(pushTokens);
      return { count: row?.c ?? 0 };
    }),

    broadcast: adminProcedure
      .input(
        z.object({
          title: z.string().min(1).max(100),
          body: z.string().min(1).max(500),
        }),
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");
        const rows = await db
          .select({ token: pushTokens.token })
          .from(pushTokens);
        const summary = await sendExpoPush(
          rows.map((r) => r.token),
          input,
        );
        if (summary.invalidTokens.length > 0) {
          const { inArray } = await import("drizzle-orm");
          await db
            .delete(pushTokens)
            .where(inArray(pushTokens.token, summary.invalidTokens));
        }
        return {
          attempted: summary.attempted,
          accepted: summary.accepted,
          failed: summary.failed,
          removed: summary.invalidTokens.length,
        };
      }),
  }),

  outreach: router({
    list: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      return db
        .select()
        .from(vendorOutreach)
        .orderBy(desc(vendorOutreach.createdAt))
        .limit(500);
    }),
    track: adminProcedure
      .input(
        z.object({
          companyName: z.string().min(1).max(200),
          contactName: z.string().max(200).optional(),
          email: z.string().email().max(320),
          website: z.string().max(500).optional(),
          vendorType: z
            .enum([
              "seedbank",
              "growshop",
              "headshop",
              "nutrient",
              "equipment",
              "other",
            ])
            .default("other"),
          country: z.string().max(8).optional(),
          templateId: z.string().min(1).max(64),
          status: z
            .enum([
              "pending",
              "sent",
              "opened",
              "replied",
              "converted",
              "rejected",
            ])
            .default("pending"),
          notes: z.string().max(5000).optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");
        const now = new Date();
        const [res] = await db.insert(vendorOutreach).values({
          ...input,
          sentAt: input.status === "sent" ? now : null,
        });
        return { id: res.insertId };
      }),
    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum([
            "pending",
            "sent",
            "opened",
            "replied",
            "converted",
            "rejected",
          ]),
          notes: z.string().max(5000).optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");
        const now = new Date();
        await db
          .update(vendorOutreach)
          .set({
            status: input.status,
            ...(input.notes ? { notes: input.notes } : {}),
            ...(input.status === "sent" ? { sentAt: now } : {}),
            ...(input.status === "opened" ? { openedAt: now } : {}),
            ...(input.status === "replied" ? { repliedAt: now } : {}),
          })
          .where(eq(vendorOutreach.id, input.id));
        return { success: true };
      }),
    stats: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      const rows = await db
        .select({ status: vendorOutreach.status, n: count() })
        .from(vendorOutreach)
        .groupBy(vendorOutreach.status);
      return summarizeOutreach(
        rows.map((r) => ({ status: r.status, n: Number(r.n) })),
      );
    }),
  }),
});

export type AppRouter = typeof appRouter;
