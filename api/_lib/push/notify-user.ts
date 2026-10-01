/**
 * Envoi push aux jetons d’un user (service role).
 */
import { createClient } from "@supabase/supabase-js";
import { apnsHostLabel, isApnsConfigured, sendApnsToDevice, type PushPayload } from "./apns.js";

function adminClient() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function pushToUser(
  userId: string,
  payload: PushPayload,
): Promise<{ sent: number; skipped: string; pruned: number; reason?: string; host?: string }> {
  if (!userId) return { sent: 0, skipped: "no_user", pruned: 0 };
  if (!isApnsConfigured()) return { sent: 0, skipped: "apns_not_configured", pruned: 0 };
  const admin = adminClient();
  if (!admin) {
    console.error("[push] no_admin", {
      hasUrl: Boolean(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL),
      hasService: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    });
    return { sent: 0, skipped: "no_admin", pruned: 0 };
  }

  const { data: rows, error } = await admin
    .from("device_push_tokens")
    .select("id, token, platform")
    .eq("user_id", userId)
    .eq("platform", "ios");

  if (error || !rows?.length) {
    return { sent: 0, skipped: error?.message || "no_tokens", pruned: 0 };
  }

  let sent = 0;
  const pruneIds: string[] = [];
  let lastReason = "";
  let lastHost = apnsHostLabel();
  for (const row of rows) {
    const result = await sendApnsToDevice(row.token, payload);
    if (result.host) lastHost = result.host;
    if (result.ok) {
      sent += 1;
      continue;
    }
    lastReason = String(result.reason || `http_${result.status || "?"}`);
    console.error("[push] apns fail", {
      status: result.status,
      reason: lastReason,
      host: result.host,
      tokenTail: String(row.token || "").slice(-6),
    });
    if (result.status === 410 || result.reason === "BadDeviceToken" || result.reason === "Unregistered") {
      pruneIds.push(row.id);
    }
  }
  if (pruneIds.length) {
    await admin.from("device_push_tokens").delete().in("id", pruneIds);
  }
  if (sent) return { sent, skipped: "", pruned: pruneIds.length, host: lastHost };
  return {
    sent: 0,
    skipped: "all_failed",
    pruned: pruneIds.length,
    reason: lastReason || "unknown",
    host: lastHost,
  };
}
