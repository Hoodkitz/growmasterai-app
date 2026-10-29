import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerGoogleOAuthRoutes } from "./googleOAuth";
import { registerRevenueCatRoutes } from "./revenuecat";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { csrfOriginGuard } from "./security";
import { createRateLimiter, rateLimitMiddleware } from "./rateLimit";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  // Railway terminates TLS in one proxy hop. Without this req.ip is the proxy address, so every
  // client would share one rate-limit bucket (global lockout after 10 logins) and logs show no real IPs.
  app.set("trust proxy", 1); // fallback for req.ip; on Railway clientKey prefers X-Real-IP
  const server = createServer(app);

  // SECURITY: Restricted CORS - only allow specific trusted origins
  const ALLOWED_ORIGINS = [
    process.env.WEB_APP_URL,
    process.env.MOBILE_APP_URL,
    "http://localhost:8081",
    "exp://localhost:8081",
    // Allow Expo dev servers on local network
    /^exp:\/\/192\.168\.\d{1,3}\.\d{1,3}:8081$/,
    /^exp:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:8081$/,
    // Allow tunnel domains (e.g., manuspre.computer)
    /^https?:\/\/.*\.manuspre\.computer$/,
  ].filter(Boolean);

  app.use((req, res, next) => {
    const origin = req.headers.origin;

    // Check if origin is in allowlist
    const isAllowed =
      origin &&
      ALLOWED_ORIGINS.some((allowed) => {
        if (typeof allowed === "string") {
          return allowed === origin;
        }
        // RegExp pattern
        return allowed instanceof RegExp && allowed.test(origin);
      });

    if (isAllowed && origin) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Credentials", "true");
    }

    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // SECURITY: CSRF defence via Origin check for state-changing requests
  app.use(csrfOriginGuard(ALLOWED_ORIGINS as (string | RegExp)[]));

  // SECURITY: baseline response headers (no extra dependency needed for an API server)
  app.disable("x-powered-by");
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'none'; frame-ancestors 'none'",
    );
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
    res.setHeader("Cross-Origin-Resource-Policy", "same-site");
    next();
  });

  // SECURITY: small default body limit; larger only for tRPC (base64 plant photos)
  app.use("/api/trpc", express.json({ limit: "15mb" }));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));

  // SECURITY: general per-IP API rate limit (auth endpoints have stricter limiters)
  app.use(
    "/api/trpc",
    rateLimitMiddleware(createRateLimiter({ windowMs: 60_000, max: 300 })),
  );

  // SECURITY: Rate limiting for authentication endpoints
  const oauthCallbackLimiter = createRateLimiter({
    windowMs: 15 * 60_000, // 15 minutes
    max: 10, // 10 attempts per window
  });

  registerOAuthRoutes(app);
  registerGoogleOAuthRoutes(app);
  registerRevenueCatRoutes(app);

  // Apply rate limiting to OAuth callback routes
  app.use("/oauth/callback", rateLimitMiddleware(oauthCallbackLimiter));
  app.use("/oauth/google/callback", rateLimitMiddleware(oauthCallbackLimiter));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
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
