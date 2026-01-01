import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
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
});

export type AppRouter = typeof appRouter;
