/**
 * Security event logging for audit trail and threat detection
 * Logs authentication attempts, privilege escalation, and suspicious activity
 *
 * Writes structured JSON Lines to a daily rotating log file (logs/security-YYYY-MM-DD.log)
 * and to console. File writes are best-effort: logging must never crash the app.
 */

import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

export type SecurityEventType =
  | "login_attempt"
  | "login_success"
  | "login_failure"
  | "logout"
  | "admin_action"
  | "privilege_escalation_attempt"
  | "rate_limit_exceeded"
  | "invalid_token"
  | "suspicious_activity"
  | "password_reset_request"
  | "password_reset_success"
  | "email_verification";

export interface SecurityEvent {
  type: SecurityEventType;
  timestamp: string;
  userId?: number;
  openId?: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  success?: boolean;
  reason?: string;
  details?: Record<string, any>;
}

// ---------- file logging ----------

const LOG_DIR = process.env.SECURITY_LOG_DIR ?? "logs";
const LOG_FILE_PREFIX = "security-";
const LOG_FILE_SUFFIX = ".log";

function getLogFilePath(date: Date): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return join(
    LOG_DIR,
    `${LOG_FILE_PREFIX}${yyyy}-${mm}-${dd}${LOG_FILE_SUFFIX}`,
  );
}

let lastLogDir: string | null = null;

async function ensureLogDir(dir: string): Promise<void> {
  if (lastLogDir === dir) return;
  await mkdir(dir, { recursive: true, mode: 0o700 });
  lastLogDir = dir;
}

async function writeToFile(event: SecurityEvent): Promise<void> {
  try {
    const filePath = getLogFilePath(new Date(event.timestamp));
    await ensureLogDir(LOG_DIR);
    const line = JSON.stringify(event) + "\n";
    await appendFile(filePath, line, { encoding: "utf8", mode: 0o600 });
  } catch (err) {
    // Logging must never crash the application
    console.error(
      "[SECURITY] Failed to write to log file:",
      err instanceof Error ? err.message : err,
    );
  }
}

// ---------- public API ----------

/**
 * Logs security events to console and to a persistent daily log file.
 * File writes are best-effort: logging must never crash the app.
 */
export function logSecurityEvent(
  event: Omit<SecurityEvent, "timestamp">,
): void {
  const fullEvent: SecurityEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  // Format for console (structured logging)
  const logLevel = getLogLevel(event.type);
  const message = formatSecurityEvent(fullEvent);

  switch (logLevel) {
    case "error":
      console.error("[SECURITY]", message, fullEvent);
      break;
    case "warn":
      console.warn("[SECURITY]", message, fullEvent);
      break;
    default:
      console.log("[SECURITY]", message, fullEvent);
  }

  // Persistent file logging (fire-and-forget, never throws)
  void writeToFile(fullEvent);
}

function getLogLevel(type: SecurityEventType): "info" | "warn" | "error" {
  const errorEvents: SecurityEventType[] = [
    "privilege_escalation_attempt",
    "suspicious_activity",
  ];

  const warnEvents: SecurityEventType[] = [
    "login_failure",
    "rate_limit_exceeded",
    "invalid_token",
  ];

  if (errorEvents.includes(type)) return "error";
  if (warnEvents.includes(type)) return "warn";
  return "info";
}

function formatSecurityEvent(event: SecurityEvent): string {
  const parts: string[] = [event.type.toUpperCase()];

  if (event.userId) parts.push(`user=${event.userId}`);
  if (event.openId) parts.push(`openId=${event.openId.substring(0, 12)}...`);
  if (event.ip) parts.push(`ip=${event.ip}`);
  if (event.endpoint) parts.push(`endpoint=${event.endpoint}`);
  if (event.success !== undefined) parts.push(`success=${event.success}`);
  if (event.reason) parts.push(`reason=${event.reason}`);

  return parts.join(" | ");
}

/**
 * Helper to extract client IP from Express request
 */
export function getClientIp(req: {
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}): string {
  // Check X-Forwarded-For (when behind proxy/load balancer)
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ips.split(",")[0].trim();
  }

  // Check X-Real-IP
  const realIp = req.headers["x-real-ip"];
  if (realIp && typeof realIp === "string") {
    return realIp;
  }

  // Fallback to Express IP
  return req.ip || req.socket?.remoteAddress || "unknown";
}

/**
 * Express middleware to attach security logging helpers to request
 */
export function securityLoggingMiddleware() {
  return (req: any, res: any, next: any) => {
    req.logSecurityEvent = (
      event: Omit<SecurityEvent, "timestamp" | "ip" | "userAgent">,
    ) => {
      logSecurityEvent({
        ...event,
        ip: getClientIp(req),
        userAgent: req.headers["user-agent"] as string,
      });
    };
    next();
  };
}
