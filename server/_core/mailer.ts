import nodemailer from "nodemailer";
import { ENV } from "./env";

export class MailNotConfiguredError extends Error {
  constructor() {
    super("MAIL_NOT_CONFIGURED");
    this.name = "MailNotConfiguredError";
  }
}

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
  /** Link that is printed to the console when SMTP is not configured (dev only). */
  devLink?: string;
}

export function isMailConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.SMTP_HOST && env.MAIL_FROM);
}

/**
 * Sends a mail via SMTP (SMTP_HOST/PORT/USER/PASS, MAIL_FROM).
 * Without SMTP config: logs the message in non-production, throws MailNotConfiguredError in production.
 */
export async function sendMail(msg: MailMessage): Promise<"sent" | "logged"> {
  if (!isMailConfigured()) {
    if (ENV.isProduction) throw new MailNotConfiguredError();
    console.log(`[Mail:dev] SMTP nicht konfiguriert. An: ${msg.to} | ${msg.subject}\n${msg.devLink ?? msg.text}`);
    return "logged";
  }
  const port = Number(process.env.SMTP_PORT) || 587;
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? "" } : undefined,
  });
  await transport.sendMail({ from: process.env.MAIL_FROM, to: msg.to, subject: msg.subject, text: msg.text, html: msg.html });
  return "sent";
}
