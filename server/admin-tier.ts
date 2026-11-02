import { z } from "zod";

/** Eingabe für admin.setUserTier: Tier per E-Mail setzen, ohne Ablauf = unbefristet. */
export const setUserTierInput = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  tier: z.enum(["free", "premium", "pro"]),
  /** ISO-Datum; leer/fehlend = unbefristet. Muss in der Zukunft liegen. */
  expiresAt: z
    .string()
    .datetime()
    .optional()
    .refine((v) => !v || new Date(v) > new Date(), {
      message: "expiresAt muss in der Zukunft liegen",
    }),
});

export type SetUserTierInput = z.infer<typeof setUserTierInput>;
