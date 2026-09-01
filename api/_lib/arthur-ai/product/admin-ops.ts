/**
 * File ops admin : support ouvert + avis landing. Pas de 13e fonction.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { attachLastMessages } from "../../support/preview.js";
import { isUuid } from "../security.js";
import { trialsEndingSoon, accessStatusOf, hasEntitlement } from "./nageurs-helpers.js";
import { loadInternalTestUserIds } from "./internal-test-accounts.js";

export type AdminOpsReport = {
  support_open: Array<{
    id: string;
    user_id: string;
    short_code: string;
    updated_at: string;
    last_body: string;
    last_role: string | null;
  }>;
  reviews_pending: Array<{
    id: string;
    author_name: string;
    rating: number;
    body: string;
    contact_email: string | null;
    created_at: string;
  }>;
  trials_ending: Array<{
    user_id: string;
    trial_ends_at: string | null;
    access_status: string;
  }>;
  cancel_at_period_end: number;
};

export async function buildAdminOpsReport(
  admin: SupabaseClient,
  { now = new Date() }: { now?: Date } = {},
): Promise<AdminOpsReport> {
  let support: AdminOpsReport["support_open"] = [];
  let reviews: AdminOpsReport["reviews_pending"] = [];
  let access: Array<{
    user_id?: string;
    access_status?: string;
    status?: string;
    trial_ends_at?: string | null;
    subscription_ends_at?: string | null;
    cancel_at_period_end?: boolean;
  }> = [];

  try {
    const { data: convs, error } = await admin
      .from("support_conversations")
      .select("id, user_id, short_code, status, updated_at")
      .eq("status", "open")
      .order("updated_at", { ascending: false })
      .limit(40);
    if (error) throw error;
    const list = convs || [];
    const ids = list.map((c) => c.id);
    let messages: Array<{
      conversation_id: string;
      id: string;
      role: string;
      body: string;
      created_at: string;
    }> = [];
    if (ids.length) {
      const { data: msgs } = await admin
        .from("support_messages")
        .select("id, conversation_id, role, body, created_at")
        .in("conversation_id", ids)
        .order("created_at", { ascending: false })
        .limit(200);
      messages = (msgs || []) as typeof messages;
    }
    support = attachLastMessages(
      list.map((c) => ({
        id: String(c.id),
        user_id: String(c.user_id),
        short_code: String(c.short_code),
        updated_at: String(c.updated_at),
      })),
      messages,
    );
  } catch {
    support = [];
  }

  try {
    const { data, error } = await admin
      .from("landing_reviews")
      .select("id, author_name, rating, body, contact_email, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(40);
    if (error) throw error;
    reviews = (data || []).map((r) => ({
      id: String(r.id),
      author_name: String(r.author_name || ""),
      rating: Number(r.rating) || 0,
      body: String(r.body || ""),
      contact_email: r.contact_email ? String(r.contact_email) : null,
      created_at: String(r.created_at),
    }));
  } catch {
    reviews = [];
  }

  try {
    const { data, error } = await admin
      .from("user_access_state")
      .select("user_id, access_status, trial_ends_at, subscription_ends_at, cancel_at_period_end")
      .in("access_status", ["trial", "active", "canceled"]);
    if (error) throw error;
    access = data || [];
  } catch {
    access = [];
  }

  const { ids: skip } = await loadInternalTestUserIds(admin);
  const productAccess = skip.size
    ? access.filter((r) => !r.user_id || !skip.has(String(r.user_id)))
    : access;

  const ending = trialsEndingSoon(productAccess, now, 48).map((r) => ({
    user_id: String(r.user_id || ""),
    trial_ends_at: r.trial_ends_at || null,
    access_status: accessStatusOf(r),
  }));

  const cancelAtEnd = productAccess.filter(
    (r) => r.cancel_at_period_end === true && hasEntitlement(r, now),
  ).length;

  return {
    support_open: support,
    reviews_pending: reviews,
    trials_ending: ending.slice(0, 40),
    cancel_at_period_end: cancelAtEnd,
  };
}

export async function moderateLandingReview(
  admin: SupabaseClient,
  { reviewId, status }: { reviewId: string; status: "published" | "rejected" },
): Promise<{ ok: boolean; error?: string }> {
  if (!isUuid(reviewId)) return { ok: false, error: "reviewId uuid requis" };
  if (status !== "published" && status !== "rejected") {
    return { ok: false, error: "status published ou rejected" };
  }
  const { error } = await admin
    .from("landing_reviews")
    .update({ status })
    .eq("id", reviewId)
    .eq("status", "pending");
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
