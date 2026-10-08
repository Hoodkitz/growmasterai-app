import type { Express, Request, Response } from "express";
import {
  getUserByOpenId,
  upsertUser,
  registerEmailUser,
  verifyEmailLogin,
} from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";
import { logSecurityEvent } from "./securityLogger";

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

export function registerAuthRoutes(app: Express) {
  // Email login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, password } = (req.body ?? {}) as Record<string, unknown>;
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email ||
      !password
    ) {
      res.status(400).json({ error: "E-Mail und Passwort erforderlich" });
      return;
    }
    try {
      const user = await verifyEmailLogin(email, password);
      if (!user) {
        logSecurityEvent({
          type: "login_failure",
          reason: "invalid_credentials",
          details: { email: email.toLowerCase() },
        });
        res.status(401).json({ error: "E-Mail oder Passwort falsch" });
        return;
      }
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || user.email || "User",
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });
      res.json({ app_session_id: sessionToken, user: buildUserResponse(user) });
      logSecurityEvent({
        type: "login_success",
        userId: user.id,
        openId: user.openId,
        details: { method: "email" },
      });
    } catch (error) {
      console.error("[Auth] Login failed", error);
      res.status(500).json({ error: "Anmeldung fehlgeschlagen" });
    }
  });

  // Email registration
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const { email, password, name } = (req.body ?? {}) as Record<
      string,
      unknown
    >;
    if (typeof email !== "string" || !email || email.length > 320) {
      res.status(400).json({ error: "Ungültige E-Mail-Adresse" });
      return;
    }
    if (
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 200
    ) {
      res
        .status(400)
        .json({ error: "Das Passwort muss mindestens 8 Zeichen lang sein" });
      return;
    }
    const displayName =
      typeof name === "string" && name.trim()
        ? name.trim().slice(0, 100)
        : email.split("@")[0];
    try {
      const user = await registerEmailUser(email, password, displayName);
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: displayName,
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });
      res.json({ app_session_id: sessionToken, user: buildUserResponse(user) });
      logSecurityEvent({
        type: "login_success",
        userId: user.id,
        openId: user.openId,
        details: { method: "register" },
      });
    } catch (error) {
      if (error instanceof Error && error.message === "EMAIL_EXISTS") {
        res.status(409).json({ error: "Diese E-Mail ist bereits registriert" });
        return;
      }
      console.error("[Auth] Register failed", error);
      res.status(500).json({ error: "Registrierung fehlgeschlagen" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
    logSecurityEvent({
      type: "logout",
    });
  });

  // Get current user
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json({ user: buildUserResponse(user) });
    } catch (error) {
      console.error("[Auth] /api/auth/me failed:", error);
      res.status(401).json({ error: "Not authenticated", user: null });
    }
  });
}
