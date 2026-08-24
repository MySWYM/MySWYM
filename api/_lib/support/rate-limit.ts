/**
 * Rate-limit contact landing + messages bulle support (anti-spam Telegram / Resend).
 */
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { VercelRequest } from "@vercel/node";
import { createArthurAdminClient } from "../arthur-ai/supabase.js";

export const CONTACT_RATE = {
  ipPer10Min: 3,
  emailPerDay: 5,
  globalPerHour: 20,
} as const;

export const SUPPORT_RATE = {
  userPer10Min: 20,
  userPerHour: 60,
} as const;

export const RATE_LIMIT_MESSAGE = "Trop de messages. Réessaie dans un moment.";

export function windowStartIso(windowSeconds: number, now = Date.now()): string {
  const ms = Math.max(1, windowSeconds) * 1000;
  return new Date(Math.floor(now / ms) * ms).toISOString();
}

export function hashBucketPart(value: string): string {
  return createHash("sha256").update(String(value || "")).digest("hex").slice(0, 16);
}

export function clientIp(req: VercelRequest): string {
  const xf = req.headers["x-forwarded-for"];
  const raw = Array.isArray(xf) ? xf[0] : String(xf || "");
  const first = raw.split(",")[0]?.trim();
  if (first) return first;
  const real = String(req.headers["x-real-ip"] || "").trim();
  return real || "unknown";
}

async function consume(
  admin: SupabaseClient,
  bucket: string,
  windowSeconds: number,
  limit: number,
): Promise<boolean> {
  try {
    const { data, error } = await admin.rpc("consume_notify_rate", {
      p_bucket: bucket,
      p_window_start: windowStartIso(windowSeconds),
      p_limit: limit,
    });
    if (error) {
      console.warn("[support] rate-limit rpc", error.message);
      return true;
    }
    return data === true;
  } catch (err) {
    console.warn("[support] rate-limit", err instanceof Error ? err.message : err);
    return true;
  }
}

export async function allowContactNotify(
  req: VercelRequest,
  email: string,
  admin: SupabaseClient = createArthurAdminClient(),
): Promise<boolean> {
  const ip = hashBucketPart(clientIp(req));
  const mail = hashBucketPart(email.trim().toLowerCase());
  const globalOk = await consume(admin, "contact:global", 3600, CONTACT_RATE.globalPerHour);
  if (!globalOk) return false;
  const ipOk = await consume(admin, `contact:ip:${ip}`, 600, CONTACT_RATE.ipPer10Min);
  if (!ipOk) return false;
  return consume(admin, `contact:email:${mail}`, 86400, CONTACT_RATE.emailPerDay);
}

export async function allowSupportSend(
  userId: string,
  admin: SupabaseClient = createArthurAdminClient(),
): Promise<boolean> {
  const key = `support:user:${userId}`;
  const burstOk = await consume(admin, `${key}:10m`, 600, SUPPORT_RATE.userPer10Min);
  if (!burstOk) return false;
  return consume(admin, `${key}:1h`, 3600, SUPPORT_RATE.userPerHour);
}
