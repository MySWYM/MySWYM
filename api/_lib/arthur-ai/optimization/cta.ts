/**
 * Tracking CTA Instagram / MySWYM (F3).
 * Pas d’envoi automatique — observation + attribution.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { arthurLog } from "../logging.js";
import { trackAiEvent } from "../tracking.js";
import { detectCtaInMessage } from "./quality.js";

const APP_URL = () =>
  (process.env.APP_URL || "https://myswym.app").replace(/\/$/, "");

/** Lien CTA trackable (ref arthur). */
export function buildTrackedCtaUrl(
  path: string,
  opts: { ctaType?: string; campaign?: string | null; reelId?: string | null } = {},
): string {
  const base = `${APP_URL()}${path.startsWith("/") ? path : `/${path}`}`;
  const u = new URL(base);
  u.searchParams.set("ref", "arthur_ig");
  if (opts.ctaType) u.searchParams.set("cta", opts.ctaType);
  if (opts.campaign) u.searchParams.set("campaign", opts.campaign);
  if (opts.reelId) u.searchParams.set("reel_id", opts.reelId);
  return u.toString();
}

export async function trackCtaSent(
  admin: SupabaseClient,
  input: {
    conversationId?: string | null;
    userId?: string | null;
    externalUserId?: string | null;
    channel?: string;
    message: string;
    suggestedAction?: string | null;
    reelId?: string | null;
    campaign?: string | null;
    leadId?: string | null;
  },
): Promise<{ tracked: boolean; cta_type?: string }> {
  const fromMsg = detectCtaInMessage(input.message);
  const fromAction =
    input.suggestedAction === "suggest_myswym" ? "suggest_myswym" : null;
  const cta_type = fromMsg.cta_type || fromAction;
  if (!cta_type && !fromMsg.detected) {
    return { tracked: false };
  }
  const type = cta_type || "suggest_myswym";

  try {
    await admin.from("ai_cta_events").insert({
      conversation_id: input.conversationId || null,
      lead_id: input.leadId || null,
      external_user_id: input.externalUserId || null,
      user_id: input.userId || null,
      channel: input.channel || "instagram",
      event_kind: "sent",
      cta_type: type,
      destination_path: type === "tarifs" ? "/fr/tarifs" : "/inscription",
      reel_id: input.reelId || null,
      campaign: input.campaign || null,
      metadata: { detected_in_message: fromMsg.detected },
    });

    await trackAiEvent(admin, {
      conversationId: input.conversationId,
      userId: input.userId,
      eventType: "cta_sent",
      metadata: {
        cta_type: type,
        channel: input.channel || null,
        reel_id: input.reelId || null,
      },
    });

    // Compat funnel F1
    if (fromMsg.detected) {
      await trackAiEvent(admin, {
        conversationId: input.conversationId,
        userId: input.userId,
        eventType: "myswym_link_sent",
        metadata: { cta_type: type, via: "optimization_f3" },
      });
    }

    return { tracked: true, cta_type: type };
  } catch (err) {
    arthurLog("warn", "cta_sent_track_failed", {
      name: err instanceof Error ? err.name : "Error",
    });
    return { tracked: false };
  }
}

export async function attributeCtaConversion(
  admin: SupabaseClient,
  input: {
    externalUserId?: string | null;
    userId?: string | null;
    kind: "attributed_signup" | "attributed_premium";
  },
): Promise<{ updated: number }> {
  try {
    const since = new Date(Date.now() - 14 * 86400000).toISOString();
    let q = admin
      .from("ai_cta_events")
      .select("id")
      .eq("event_kind", "sent")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(3);

    if (input.externalUserId) q = q.eq("external_user_id", input.externalUserId);
    else if (input.userId) q = q.eq("user_id", input.userId);
    else return { updated: 0 };

    const { data } = await q;
    if (!data?.length) return { updated: 0 };

    const src = data[0];
    await admin.from("ai_cta_events").insert({
      external_user_id: input.externalUserId || null,
      user_id: input.userId || null,
      channel: "instagram",
      event_kind: input.kind,
      cta_type: "attribution",
      metadata: { from_cta_event_id: src.id },
    });

    return { updated: 1 };
  } catch (err) {
    arthurLog("warn", "cta_attribution_failed", {
      name: err instanceof Error ? err.name : "Error",
    });
    return { updated: 0 };
  }
}
