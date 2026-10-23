import type { NextFunction, Request, Response } from "express";

/**
 * Cleans user text before it is interpolated into an LLM prompt (HIGH-001).
 * Removes control chars, angle brackets and backtick fences, collapses whitespace,
 * and truncates. This limits prompt-structure injection; it is not a complete defence.
 */
export function sanitizeUserInput(
  input: string | undefined | null,
  maxLength = 500,
): string {
  if (!input) return "";
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[<>`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

const COMMON_PASSWORDS = new Set([
  "12345678",
  "123456789",
  "1234567890",
  "password",
  "password1",
  "passwort",
  "passwort1",
  "qwertzui",
  "qwerty123",
  "11111111",
  "abc12345",
  "iloveyou",
  "welcome1",
  "letmein1",
]);

/** Password policy (MED-001): 8-200 chars, at least one letter and one digit, not a common password. */
export function validatePassword(password: unknown): {
  valid: boolean;
  error?: string;
} {
  if (typeof password !== "string" || password.length < 8) {
    return {
      valid: false,
      error: "Das Passwort muss mindestens 8 Zeichen lang sein",
    };
  }
  if (password.length > 200)
    return { valid: false, error: "Das Passwort ist zu lang" };
  if (!/[A-Za-zÀ-ɏ]/.test(password) || !/[0-9]/.test(password)) {
    return {
      valid: false,
      error:
        "Das Passwort muss mindestens einen Buchstaben und eine Zahl enthalten",
    };
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return {
      valid: false,
      error: "Dieses Passwort ist zu häufig. Bitte wähle ein anderes",
    };
  }
  return { valid: true };
}

export type OriginRule = string | RegExp;

export function isOriginAllowed(
  origin: string,
  rules: OriginRule[],
  host?: string,
): boolean {
  if (host) {
    try {
      if (new URL(origin).host === host) return true;
    } catch {
      return false;
    }
  }
  return rules.some((r) =>
    typeof r === "string" ? r === origin : r.test(origin),
  );
}

/**
 * CSRF defence for cookie-authenticated requests (HIGH-002).
 * Session cookies are SameSite=None, so state-changing requests that carry a browser
 * Origin header must come from an allowed origin. Native app requests send no Origin
 * header, and Bearer-token requests are not CSRF-able, so both pass.
 */
export function csrfOriginGuard(rules: OriginRule[]) {
  const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);
  return (req: Request, res: Response, next: NextFunction) => {
    if (SAFE.has(req.method)) return next();
    const origin = req.headers.origin;
    if (!origin || req.headers.authorization) return next();
    if (isOriginAllowed(origin, rules, req.headers.host)) return next();
    res.status(403).json({ error: "Origin nicht erlaubt" });
  };
}
