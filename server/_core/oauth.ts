import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";
import type { Express, Request, Response } from "express";
import { getUserByOpenId, upsertUser, registerEmailUser, verifyEmailLogin } from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import {
  loginLimiter,
  registerLimiter,
  rateLimitMiddleware,
  forgotPasswordLimiter,
  forgotPasswordEmailLimiter,
  resetPasswordLimiter,
  verifyEmailLimiter,
} from "./rateLimit";
import { isMailConfigured, sendMail } from "./mailer";
import {
  buildAppLink,
  consumeAuthToken,
  createAuthToken,
  getCredentialByEmail,
  markEmailVerified,
  setPasswordAndVerify,
} from "../authTokens";
import { ENV } from "./env";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

async function syncUser(userInfo: {
  openId?: string | null;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  platform?: string | null;
}) {
  if (!userInfo.openId) {
    throw new Error("openId missing from user info");
  }

  const lastSignedIn = new Date();
  await upsertUser({
    openId: userInfo.openId,
    name: userInfo.name || null,
    email: userInfo.email ?? null,
    loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
    lastSignedIn,
  });
  const saved = await getUserByOpenId(userInfo.openId);
  return (
    saved ?? {
      openId: userInfo.openId,
      name: userInfo.name,
      email: userInfo.email,
      loginMethod: userInfo.loginMethod ?? null,
      lastSignedIn,
    }
  );
}

function buildUserResponse(
  user:
    | Awaited<ReturnType<typeof getUserByOpenId>>
    | {
        openId: string;
        name?: string | null;
        email?: string | null;
        loginMethod?: string | null;
        lastSignedIn?: Date | null;
      },
) {
  return {
    id: (user as any)?.id ?? null,
    openId: user?.openId ?? null,
    name: user?.name ?? null,
    email: user?.email ?? null,
    loginMethod: user?.loginMethod ?? null,
    lastSignedIn: (user?.lastSignedIn ?? new Date()).toISOString(),
  };
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
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
      const sessionToken = await sdk.createSessionToken(userInfo.openId!, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Redirect to the frontend URL (Expo web on port 8081)
      // Cookie is set with parent domain so it works across both 3000 and 8081 subdomains
      const frontendUrl =
        process.env.EXPO_WEB_PREVIEW_URL ||
        process.env.EXPO_PACKAGER_PROXY_URL ||
        "http://localhost:8081";
      res.redirect(302, frontendUrl);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });

  app.get("/api/oauth/mobile", async (req: Request, res: Response) => {
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

      const sessionToken = await sdk.createSessionToken(userInfo.openId!, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({
        app_session_id: sessionToken,
        user: buildUserResponse(user),
      });
    } catch (error) {
      console.error("[OAuth] Mobile exchange failed", error);
      res.status(500).json({ error: "OAuth mobile exchange failed" });
    }
  });

  async function issueEmailSession(req: Request, res: Response, user: NonNullable<Awaited<ReturnType<typeof getUserByOpenId>>>) {
    const sessionToken = await sdk.createSessionToken(user.openId, {
      name: user.name || user.email || "User",
      expiresInMs: ONE_YEAR_MS,
    });
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
    res.json({ app_session_id: sessionToken, user: buildUserResponse(user) });
  }

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  app.post("/api/auth/register", rateLimitMiddleware(registerLimiter), async (req: Request, res: Response) => {
    const { email, password, name } = (req.body ?? {}) as Record<string, unknown>;
    if (typeof email !== "string" || !EMAIL_RE.test(email.trim()) || email.length > 320) {
      res.status(400).json({ error: "Ungültige E-Mail-Adresse" });
      return;
    }
    if (typeof password !== "string" || password.length < 8 || password.length > 200) {
      res.status(400).json({ error: "Das Passwort muss mindestens 8 Zeichen lang sein" });
      return;
    }
    const displayName = typeof name === "string" && name.trim() ? name.trim().slice(0, 100) : email.split("@")[0];
    try {
      const user = await registerEmailUser(email, password, displayName);
      // Verification mail is best effort: registration must not fail if mail is unavailable.
      void sendVerificationMail(email.trim().toLowerCase(), user.openId).catch((e) =>
        console.error("[Auth] Verification mail failed", e instanceof Error ? e.message : e),
      );
      await issueEmailSession(req, res, user);
    } catch (error) {
      if (error instanceof Error && error.message === "EMAIL_EXISTS") {
        res.status(409).json({ error: "Diese E-Mail ist bereits registriert" });
        return;
      }
      console.error("[Auth] Register failed", error);
      res.status(500).json({ error: "Registrierung fehlgeschlagen" });
    }
  });

  app.post("/api/auth/login", rateLimitMiddleware(loginLimiter), async (req: Request, res: Response) => {
    const { email, password } = (req.body ?? {}) as Record<string, unknown>;
    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
      res.status(400).json({ error: "E-Mail und Passwort erforderlich" });
      return;
    }
    try {
      const user = await verifyEmailLogin(email, password);
      if (!user) {
        res.status(401).json({ error: "E-Mail oder Passwort falsch" });
        return;
      }
      await issueEmailSession(req, res, user);
    } catch (error) {
      console.error("[Auth] Login failed", error);
      res.status(500).json({ error: "Anmeldung fehlgeschlagen" });
    }
  });

  async function sendVerificationMail(email: string, openId: string) {
    const token = await createAuthToken(openId, "email_verify");
    const link = buildAppLink("verify-email", token);
    await sendMail({
      to: email,
      subject: "GrowMaster AI: Bestätige deine E-Mail-Adresse",
      text: `Willkommen bei GrowMaster AI!\n\nBestätige deine E-Mail-Adresse (24 Stunden gültig):\n${link}\n\nFalls du dich nicht registriert hast, ignoriere diese Nachricht.`,
      devLink: link,
    });
  }

  async function sendResetMail(email: string, openId: string) {
    const token = await createAuthToken(openId, "password_reset");
    const link = buildAppLink("reset-password", token);
    await sendMail({
      to: email,
      subject: "GrowMaster AI: Passwort zurücksetzen",
      text: `Du hast ein neues Passwort angefordert. Der Link ist 1 Stunde gültig und nur einmal verwendbar:\n${link}\n\nFalls du das nicht warst, ignoriere diese Nachricht – dein Passwort bleibt unverändert.`,
      devLink: link,
    });
  }

  const GENERIC_MAIL_RESPONSE = { success: true, message: "Falls ein Konto mit dieser E-Mail existiert, haben wir dir eine Nachricht gesendet." };

  /**
   * Shared handler for forgot-password / resend-verification. Always answers identically
   * (no user enumeration); the mail is sent after responding so timing does not leak existence.
   */
  function mailRequestHandler(
    emailLimiter: typeof forgotPasswordEmailLimiter,
    action: (email: string, openId: string, verified: boolean) => Promise<void>,
  ) {
    return async (req: Request, res: Response) => {
      const { email } = (req.body ?? {}) as Record<string, unknown>;
      if (typeof email !== "string" || !EMAIL_RE.test(email.trim()) || email.length > 320) {
        res.status(400).json({ error: "Ungültige E-Mail-Adresse" });
        return;
      }
      if (ENV.isProduction && !isMailConfigured()) {
        res.status(503).json({ error: "E-Mail-Versand ist auf dem Server nicht konfiguriert. Bitte kontaktiere den Support." });
        return;
      }
      const normalized = email.trim().toLowerCase();
      res.json(GENERIC_MAIL_RESPONSE);
      if (!emailLimiter.check(normalized).allowed) return; // silently dropped
      try {
        const cred = await getCredentialByEmail(normalized);
        if (cred) await action(normalized, cred.openId, Boolean(cred.emailVerifiedAt));
      } catch (error) {
        console.error("[Auth] Mail request failed", error instanceof Error ? error.message : error);
      }
    };
  }

  app.post(
    "/api/auth/forgot-password",
    rateLimitMiddleware(forgotPasswordLimiter),
    mailRequestHandler(forgotPasswordEmailLimiter, (email, openId) => sendResetMail(email, openId)),
  );

  app.post(
    "/api/auth/resend-verification",
    rateLimitMiddleware(forgotPasswordLimiter),
    mailRequestHandler(forgotPasswordEmailLimiter, async (email, openId, verified) => {
      if (!verified) await sendVerificationMail(email, openId);
    }),
  );

  app.post("/api/auth/reset-password", rateLimitMiddleware(resetPasswordLimiter), async (req: Request, res: Response) => {
    const { token, password } = (req.body ?? {}) as Record<string, unknown>;
    if (typeof token !== "string" || !token || token.length > 200) {
      res.status(400).json({ error: "Ungültiger oder abgelaufener Link" });
      return;
    }
    if (typeof password !== "string" || password.length < 8 || password.length > 200) {
      res.status(400).json({ error: "Das Passwort muss mindestens 8 Zeichen lang sein" });
      return;
    }
    try {
      const openId = await consumeAuthToken(token, "password_reset");
      if (!openId) {
        res.status(400).json({ error: "Ungültiger oder abgelaufener Link" });
        return;
      }
      await setPasswordAndVerify(openId, password);
      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Reset password failed", error);
      res.status(500).json({ error: "Passwort konnte nicht zurückgesetzt werden" });
    }
  });

  app.post("/api/auth/verify-email", rateLimitMiddleware(verifyEmailLimiter), async (req: Request, res: Response) => {
    const { token } = (req.body ?? {}) as Record<string, unknown>;
    if (typeof token !== "string" || !token || token.length > 200) {
      res.status(400).json({ error: "Ungültiger oder abgelaufener Link" });
      return;
    }
    try {
      const openId = await consumeAuthToken(token, "email_verify");
      if (!openId) {
        res.status(400).json({ error: "Ungültiger oder abgelaufener Link" });
        return;
      }
      await markEmailVerified(openId);
      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Verify email failed", error);
      res.status(500).json({ error: "Verifizierung fehlgeschlagen" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });

  // Get current authenticated user - works with both cookie (web) and Bearer token (mobile)
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json({ user: buildUserResponse(user) });
    } catch (error) {
      console.error("[Auth] /api/auth/me failed:", error);
      res.status(401).json({ error: "Not authenticated", user: null });
    }
  });

  // Establish session cookie from Bearer token
  // Used by iframe preview: frontend receives token via postMessage, then calls this endpoint
  // to get a proper Set-Cookie response from the backend (3000-xxx domain)
  app.post("/api/auth/session", async (req: Request, res: Response) => {
    try {
      // Authenticate using Bearer token from Authorization header
      const user = await sdk.authenticateRequest(req);

      // Get the token from the Authorization header to set as cookie
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
        res.status(400).json({ error: "Bearer token required" });
        return;
      }
      const token = authHeader.slice("Bearer ".length).trim();

      // Set cookie for this domain (3000-xxx)
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ success: true, user: buildUserResponse(user) });
    } catch (error) {
      console.error("[Auth] /api/auth/session failed:", error);
      res.status(401).json({ error: "Invalid token" });
    }
  });
}
