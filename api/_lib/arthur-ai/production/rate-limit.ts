/**
 * Rate limiting + enregistrement usage (Phase G).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { arthurLog } from "../logging.js";
import type { AuthContext } from "../types.js";

export interface RateLimitConfig {
  perHour: number;
  perDay: number;
}

export function getRateLimitConfig(): RateLimitConfig {
  return {
    perHour: Math.max(1, Number(process.env.ARTHUR_RATE_PER_HOUR) || 40),
    perDay: Math.max(1, Number(process.env.ARTHUR_RATE_PER_DAY) || 200),
  };
}

export function rateBucketKey(auth: AuthContext): string {
  const id = auth.userId || auth.externalUserId || "anon";
  return `${auth.channel}:${id}`;
}

function hourWindowStart(now = new Date()): Date {
  const d = new Date(now);
  d.setUTCMinutes(0, 0, 0);
  return d;
}

function dayWindowStart(now = new Date()): Date {
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function getBucketCount(
  admin: SupabaseClient,
  bucketKey: string,
  windowStart: Date,
): Promise<number> {
  const { data } = await admin
    .from("ai_rate_buckets")
    .select("request_count")
    .eq("bucket_key", bucketKey)
    .eq("window_start", windowStart.toISOString())
    .maybeSingle();
  return data?.request_count || 0;
}

export async function checkRateLimit(
  admin: SupabaseClient,
  auth: AuthContext,
): Promise<{
  allowed: boolean;
  reason?: string;
  hourCount?: number;
  dayCount?: number;
}> {
  const cfg = getRateLimitConfig();
  const key = rateBucketKey(auth);
  try {
    const hourCount = await getBucketCount(admin, key, hourWindowStart());
    if (hourCount >= cfg.perHour) {
      return { allowed: false, reason: "rate_hour", hourCount };
    }
    const dayStart = dayWindowStart();
    const { data: dayRows } = await admin
      .from("ai_rate_buckets")
      .select("request_count")
      .eq("bucket_key", key)
      .gte("window_start", dayStart.toISOString());
    const dayCount = (dayRows || []).reduce(
      (a, r) => a + (r.request_count || 0),
      0,
    );
    if (dayCount >= cfg.perDay) {
      return { allowed: false, reason: "rate_day", hourCount, dayCount };
    }
    return { allowed: true, hourCount, dayCount };
  } catch (err) {
    arthurLog("warn", "rate_limit_check_failed", {
      name: err instanceof Error ? err.name : "Error",
    });
    return { allowed: true };
  }
}

export async function recordUsage(
  admin: SupabaseClient,
  auth: AuthContext,
  usage: {
    tokensIn?: number | null;
    tokensOut?: number | null;
    costUsd?: number | null;
  },
): Promise<void> {
  const key = rateBucketKey(auth);
  const window = hourWindowStart().toISOString();
  const tokensIn = usage.tokensIn || 0;
  const tokensOut = usage.tokensOut || 0;
  const cost = usage.costUsd || 0;

  try {
    const { data: existing } = await admin
      .from("ai_rate_buckets")
      .select("request_count, tokens_in, tokens_out, cost_usd")
      .eq("bucket_key", key)
      .eq("window_start", window)
      .maybeSingle();

    if (existing) {
      await admin
        .from("ai_rate_buckets")
        .update({
          request_count: (existing.request_count || 0) + 1,
          tokens_in: (existing.tokens_in || 0) + tokensIn,
          tokens_out: (existing.tokens_out || 0) + tokensOut,
          cost_usd: Number(existing.cost_usd || 0) + cost,
          updated_at: new Date().toISOString(),
        })
        .eq("bucket_key", key)
        .eq("window_start", window);
    } else {
      await admin.from("ai_rate_buckets").insert({
        bucket_key: key,
        window_start: window,
        request_count: 1,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        cost_usd: cost,
        updated_at: new Date().toISOString(),
      });
    }
  } catch (err) {
    arthurLog("warn", "rate_usage_record_failed", {
      name: err instanceof Error ? err.name : "Error",
    });
  }
}
