/**
 * Envoi followup Instagram, **gated**.
 *
 * ARTHUR_FOLLOWUPS_SEND=1 requis pour tout envoi (mock ou live).
 * Sans ce flag : refuse (mesure / plan only).
 * Live Graph API seulement si SEND=1 et pas de mode mock.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { arthurLog } from "../logging.js";
import { trackAiEvent } from "../tracking.js";
import { sendInstagramTextMessage } from "../instagram/meta-client.js";
import { isInstagramMockMode } from "../instagram/mock.js";

export function isFollowupSendEnabled(): boolean {
  return process.env.ARTHUR_FOLLOWUPS_SEND === "1";
}

export function resolveFollowupSendMode(): "blocked" | "mock" | "live" {
  if (!isFollowupSendEnabled()) return "blocked";
  if (
    process.env.ARTHUR_FOLLOWUPS_SEND_MOCK === "1" ||
    isInstagramMockMode()
  ) {
    return "mock";
  }
  return "live";
}

export async function approveFollowup(
  admin: SupabaseClient,
  followupId: string,
): Promise<{ ok: boolean; error?: string }> {
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("ai_followups")
    .update({
      status: "approved",
      approved_at: now,
      updated_at: now,
    })
    .eq("id", followupId)
    .in("status", ["planned", "approved"])
    .select("id, conversation_id, user_id")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: error?.message || "followup_not_found" };
  }

  await trackAiEvent(admin, {
    conversationId: data.conversation_id,
    userId: data.user_id,
    eventType: "followup_approved",
    metadata: { followup_id: followupId },
  });
  return { ok: true };
}

/**
 * Envoie une relance approuvée.
 * Refuse si ARTHUR_FOLLOWUPS_SEND ≠ 1.
 */
export async function sendApprovedFollowup(
  admin: SupabaseClient,
  followupId: string,
): Promise<{
  ok: boolean;
  send_mode?: string;
  messageId?: string;
  error?: string;
}> {
  const mode = resolveFollowupSendMode();
  if (mode === "blocked") {
    return {
      ok: false,
      error:
        "sends_disabled, définir ARTHUR_FOLLOWUPS_SEND=1 après validation explicite",
    };
  }

  const { data: row, error } = await admin
    .from("ai_followups")
    .select("*")
    .eq("id", followupId)
    .maybeSingle();

  if (error || !row) {
    return { ok: false, error: "followup_not_found" };
  }
  if (row.status !== "approved" && row.status !== "queued") {
    return { ok: false, error: `invalid_status_${row.status}` };
  }
  if (!row.message_preview || !row.external_user_id) {
    return { ok: false, error: "missing_message_or_recipient" };
  }

  const now = new Date().toISOString();
  await admin
    .from("ai_followups")
    .update({ status: "queued", updated_at: now })
    .eq("id", followupId);

  // Mode mock : force INSTAGRAM_MOCK via env déjà lu par meta-client,
  // ou on simule sans Meta si SEND_MOCK.
  let sendResult: { ok: boolean; mock?: boolean; messageId?: string; error?: string };

  if (mode === "mock") {
    // Appel meta-client en mock si INSTAGRAM_MOCK, sinon enregistrement local sans Graph.
    if (isInstagramMockMode()) {
      sendResult = await sendInstagramTextMessage({
        recipientId: row.external_user_id,
        text: row.message_preview,
      });
    } else {
      arthurLog("info", "followup_send_mock_local", {
        id: followupId.slice(0, 8),
      });
      sendResult = { ok: true, mock: true, messageId: `followup_mock_${Date.now()}` };
    }
  } else {
    // LIVE, uniquement si credentials Meta présents
    sendResult = await sendInstagramTextMessage({
      recipientId: row.external_user_id,
      text: row.message_preview,
    });
    if (sendResult.mock) {
      // Sécurité : si meta-client est tombé en mock, on tagge mock pas live
      sendResult = { ...sendResult };
    }
  }

  if (!sendResult.ok) {
    await admin
      .from("ai_followups")
      .update({
        status: "failed",
        failed_at: now,
        send_mode: mode,
        updated_at: now,
        metadata: {
          ...(row.metadata || {}),
          last_error: sendResult.error || "send_failed",
        },
      })
      .eq("id", followupId);

    await trackAiEvent(admin, {
      conversationId: row.conversation_id,
      userId: row.user_id,
      eventType: "followup_failed",
      metadata: { followup_id: followupId, error: sendResult.error },
    });
    return { ok: false, error: sendResult.error || "send_failed", send_mode: mode };
  }

  const effectiveMode =
    sendResult.mock || mode === "mock" ? "mock" : "live";

  await admin
    .from("ai_followups")
    .update({
      status: "sent",
      sent_at: now,
      send_mode: effectiveMode,
      provider_message_id: sendResult.messageId || null,
      outcome: "pending",
      updated_at: now,
    })
    .eq("id", followupId);

  await trackAiEvent(admin, {
    conversationId: row.conversation_id,
    userId: row.user_id,
    eventType: "followup_sent",
    metadata: {
      followup_id: followupId,
      send_mode: effectiveMode,
      template_key: row.template_key,
    },
  });

  return {
    ok: true,
    send_mode: effectiveMode,
    messageId: sendResult.messageId,
  };
}
