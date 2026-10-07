import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";
import type { Express, Request, Response } from "express";
import { google } from "googleapis";
import { getUserByOpenId, upsertUser } from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

/**
 * Google OAuth 2.0 Integration für GrowMaster AI
 * 
 * Flow:
 * 1. Client ruft /api/auth/google auf → Redirect zu Google
 * 2. Google leitet nach Login zu /api/auth/google/callback weiter
 * 3. Backend tauscht Code gegen Token, holt User-Info, erstellt Session
 * 4. Redirect zu Frontend oder JSON-Response (mobile)
 */

// Google OAuth Client initialisieren
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "" // Redirect URI wird dynamisch gesetzt
);

/**
 * Generiert die Authorization URL für Google OAuth
 */
function getGoogleAuthUrl(redirectUri: string, state?: string): string {
  const scopes = [
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
  ];

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    redirect_uri: redirectUri,
    state: state || "",
    prompt: "select_account", // Zeigt immer Account-Auswahl
  });
}

/**
 * Tauscht Authorization Code gegen Tokens
 */
async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const { tokens } = await oauth2Client.getToken({ code, redirect_uri: redirectUri });
  oauth2Client.setCredentials(tokens);
  return tokens;
}

/**
 * Holt User-Informationen von Google
 */
async function getGoogleUserInfo(accessToken: string) {
  const oauth2 = google.oauth2({
    auth: oauth2Client,
    version: "v2",
  });

  const { data } = await oauth2.userinfo.get();
  
  return {
    openId: data.email || "", // Email als OpenID verwenden
    email: data.email || "",
    name: data.name || "",
    picture: data.picture || "",
  };
}

/**
 * Synchronisiert Google-User in lokaler DB
 */
async function syncGoogleUser(userInfo: {
  openId: string;
  email: string;
  name: string;
  picture?: string;
}) {
  const lastSignedIn = new Date();
  await upsertUser({
    openId: userInfo.openId,
    name: userInfo.name || null,
    email: userInfo.email,
    loginMethod: "google",
    lastSignedIn,
  });

  const saved = await getUserByOpenId(userInfo.openId);
  return saved ?? {
    openId: userInfo.openId,
    name: userInfo.name,
    email: userInfo.email,
    loginMethod: "google",
    lastSignedIn,
  };
}

/**
 * Registriert die Google OAuth Routes
 */
export function registerGoogleOAuthRoutes(app: Express) {
  
  /**
   * GET /api/auth/google
   * Startet den Google OAuth Flow
   * 
   * Query Params:
   * - redirect_uri: Wohin nach Callback redirected werden soll
   * - mode: "web" (Redirect) oder "mobile" (JSON Response)
   */
  app.get("/api/auth/google", (req: Request, res: Response) => {
    try {
      const mode = (req.query.mode as string) || "web";
      const clientRedirect = (req.query.redirect_uri as string) || 
        process.env.EXPO_WEB_PREVIEW_URL || 
        "http://localhost:8081";

      // Backend Callback URL
      const backendUrl = process.env.EXPO_PUBLIC_OAUTH_SERVER_URL || 
        process.env.API_BASE_URL || 
        "http://localhost:3000";
      
      const callbackPath = mode === "mobile" 
        ? "/api/auth/google/callback/mobile"
        : "/api/auth/google/callback";
      
      const redirectUri = `${backendUrl}${callbackPath}`;

      // State enthält Mode und Client-Redirect
      const state = Buffer.from(JSON.stringify({
        mode,
        clientRedirect,
      })).toString("base64");

      const authUrl = getGoogleAuthUrl(redirectUri, state);
      
      console.log(`[Google OAuth] Starting flow - mode: ${mode}, redirectUri: ${redirectUri}`);
      res.redirect(authUrl);
      
    } catch (error) {
      console.error("[Google OAuth] Start flow failed:", error);
      res.status(500).json({ 
        error: "OAuth-Start fehlgeschlagen",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * GET /api/auth/google/callback
   * Google OAuth Callback für Web (Cookie-basiert)
   */
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = req.query.code as string;
    const state = req.query.state as string;
    const error = req.query.error as string;

    if (error) {
      console.error("[Google OAuth] User denied access:", error);
      res.status(403).send("Zugriff verweigert");
      return;
    }

    if (!code || !state) {
      res.status(400).json({ error: "code und state sind erforderlich" });
      return;
    }

    try {
      // State dekodieren
      const { clientRedirect } = JSON.parse(Buffer.from(state, "base64").toString());

      // Redirect URI muss mit der beim Start verwendeten übereinstimmen
      const backendUrl = process.env.EXPO_PUBLIC_OAUTH_SERVER_URL || 
        process.env.API_BASE_URL || 
        "http://localhost:3000";
      const redirectUri = `${backendUrl}/api/auth/google/callback`;

      // Token Exchange
      const tokens = await exchangeCodeForTokens(code, redirectUri);
      
      if (!tokens.access_token) {
        throw new Error("Kein Access Token erhalten");
      }

      // User Info abrufen
      const userInfo = await getGoogleUserInfo(tokens.access_token);
      
      // User in DB synchronisieren
      const user = await syncGoogleUser(userInfo);

      // Session Token erstellen
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || user.email || "",
        expiresInMs: ONE_YEAR_MS,
      });

      // Cookie setzen
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { 
        ...cookieOptions, 
        maxAge: ONE_YEAR_MS 
      });

      console.log(`[Google OAuth] Web login successful - User: ${user.email}`);
      
      // Redirect zum Frontend
      res.redirect(302, clientRedirect);
      
    } catch (error) {
      console.error("[Google OAuth] Callback failed:", error);
      res.status(500).json({ 
        error: "OAuth Callback fehlgeschlagen",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * POST /api/auth/google
   * Tauscht Authorization Code gegen Tokens (für expo-auth-session Flow)
   * 
   * Body: { code: string, redirectUri: string }
   */
  app.post("/api/auth/google", async (req: Request, res: Response) => {
    const { code, redirectUri } = req.body as { code?: string; redirectUri?: string };

    if (!code) {
      res.status(400).json({ error: "code ist erforderlich" });
      return;
    }

    try {
      // Token Exchange
      const tokens = await exchangeCodeForTokens(code, redirectUri || "");

      if (!tokens.access_token) {
        throw new Error("Kein Access Token erhalten");
      }

      // User Info abrufen
      const userInfo = await getGoogleUserInfo(tokens.access_token);

      // User in DB synchronisieren
      const user = await syncGoogleUser(userInfo);

      // Session Token erstellen
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || user.email || "",
        expiresInMs: ONE_YEAR_MS,
      });

      console.log(`[Google OAuth] Mobile login successful - User: ${user.email}`);

      res.json({
        success: true,
        sessionToken,
        user: {
          id: (user as any)?.id ?? null,
          openId: user.openId,
          name: user.name,
          email: user.email,
          loginMethod: "google",
          lastSignedIn: (user.lastSignedIn ?? new Date()).toISOString(),
        },
      });

    } catch (error) {
      console.error("[Google OAuth] Mobile code exchange failed:", error);
      res.status(500).json({
        error: "OAuth Code Exchange fehlgeschlagen",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/auth/google/token
   * Verifiziert Google ID-Token (von nativem SDK) und erstellt Session
   * 
   * Body: { idToken: string, userInfo: { email, name, photo } }
   */
  app.post("/api/auth/google/token", async (req: Request, res: Response) => {
    const { idToken, userInfo: clientUserInfo } = req.body as { 
      idToken?: string; 
      userInfo?: { email?: string; name?: string; photo?: string };
    };

    if (!idToken) {
      res.status(400).json({ error: "idToken ist erforderlich" });
      return;
    }

    try {
      // ID-Token verifizieren
      const ticket = await oauth2Client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new Error("Ungültiges ID-Token");
      }

      const userInfo = {
        openId: payload.email,
        email: payload.email,
        name: payload.name || clientUserInfo?.name || "",
        picture: payload.picture || clientUserInfo?.photo || "",
      };

      // User in DB synchronisieren
      const user = await syncGoogleUser(userInfo);

      // Session Token erstellen
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || user.email || "",
        expiresInMs: ONE_YEAR_MS,
      });

      console.log(`[Google OAuth] Native login successful - User: ${user.email}`);

      res.json({
        success: true,
        sessionToken,
        user: {
          id: (user as any)?.id ?? null,
          openId: user.openId,
          name: user.name,
          email: user.email,
          loginMethod: "google",
          lastSignedIn: (user.lastSignedIn ?? new Date()).toISOString(),
        },
      });

    } catch (error) {
      console.error("[Google OAuth] ID-Token verification failed:", error);
      res.status(500).json({
        error: "ID-Token Verifizierung fehlgeschlagen",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/auth/google/callback/mobile
   * Google OAuth Callback für Mobile (JSON Response mit Token)
   */
  app.get("/api/auth/google/callback/mobile", async (req: Request, res: Response) => {
    const code = req.query.code as string;
    const state = req.query.state as string;
    const error = req.query.error as string;

    if (error) {
      console.error("[Google OAuth] Mobile - User denied access:", error);
      res.status(403).json({ error: "Zugriff verweigert" });
      return;
    }

    if (!code || !state) {
      res.status(400).json({ error: "code und state sind erforderlich" });
      return;
    }

    try {
      // State dekodieren
      const { clientRedirect } = JSON.parse(Buffer.from(state, "base64").toString());

      // Redirect URI
      const backendUrl = process.env.EXPO_PUBLIC_OAUTH_SERVER_URL || 
        process.env.API_BASE_URL || 
        "http://localhost:3000";
      const redirectUri = `${backendUrl}/api/auth/google/callback/mobile`;

      // Token Exchange
      const tokens = await exchangeCodeForTokens(code, redirectUri);
      
      if (!tokens.access_token) {
        throw new Error("Kein Access Token erhalten");
      }

      // User Info abrufen
      const userInfo = await getGoogleUserInfo(tokens.access_token);
      
      // User in DB synchronisieren
      const user = await syncGoogleUser(userInfo);

      // Session Token erstellen
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || user.email || "",
        expiresInMs: ONE_YEAR_MS,
      });

      // Cookie auch für Mobile setzen (falls WebView)
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { 
        ...cookieOptions, 
        maxAge: ONE_YEAR_MS 
      });

      console.log(`[Google OAuth] Mobile login successful - User: ${user.email}`);

      // Deep Link für Mobile App
      const deepLinkUrl = `growmasterai://auth/google/callback?token=${sessionToken}`;

      // JSON Response mit Token UND Redirect
      res.json({
        success: true,
        app_session_id: sessionToken,
        user: {
          id: (user as any)?.id ?? null,
          openId: user.openId,
          name: user.name,
          email: user.email,
          loginMethod: "google",
          lastSignedIn: (user.lastSignedIn ?? new Date()).toISOString(),
        },
        deep_link: deepLinkUrl,
        redirect_url: clientRedirect,
      });
      
    } catch (error) {
      console.error("[Google OAuth] Mobile callback failed:", error);
      res.status(500).json({ 
        error: "OAuth Mobile Callback fehlgeschlagen",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
}
