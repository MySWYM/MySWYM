/**
 * @server-only, ne pas importer depuis le client Vite.
 * Client Resend singleton (Node / Vercel serverless).
 */
import { Resend } from "resend";

let client: Resend | null = null;

export function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "[email] RESEND_API_KEY is missing. Set it in .env.local or Vercel env.",
    );
  }
  if (!client) {
    client = new Resend(apiKey);
  }
  return client;
}

export function getEmailFrom(): string {
  return process.env.EMAIL_FROM || "MySWYM <noreply@myswym.app>";
}

export function getEmailReplyTo(): string {
  return process.env.EMAIL_REPLY_TO || "contact@myswym.app";
}

/** Inbox that receives public contact form messages (Zoho). */
export function getContactInbox(): string {
  return (
    process.env.EMAIL_CONTACT_TO ||
    process.env.EMAIL_REPLY_TO ||
    "contact@myswym.app"
  );
}
