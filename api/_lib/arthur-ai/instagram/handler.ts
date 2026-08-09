/**
 * Handler métier Instagram → Arthur AI.
 * Phase H1 Shadow Mode (défaut) : analyse + proposition, AUCUN envoi auto.
 * Live send uniquement si SHADOW=0 + ARTHUR_INSTAGRAM_LIVE_SEND=1.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { processArthurMessage } from "../service.js";
import { trackAiEvent } from "../tracking.js";
import { arthurLog } from "../logging.js";
import {
  ensurePendingIdentityLink,
  resolveVerifiedUserId,
} from "./identity.js";
import { sendInstagramTextMessage } from "./meta-client.js";
import {
  parseInstagramWebhook,
  type ParsedInstagramMessage,
} from "./parse-webhook.js";
import { isInstagramMockMode } from "./mock.js";
import { markFollowupReplied } from "../conversion/outcomes.js";
import {
  isInstagramShadowMode,
  canLiveSendInstagram,
  createShadowProposal,
} from "../shadow/index.js";

export async function handleInstagramWebhookBody(
  admin: SupabaseClient,
  body: unknown,
): Promise<{
  handled: number;
  replies: number;
  shadowed: number;
  errors: string[];
}> {
  const messages = parseInstagramWebhook(body).filter((m) => !m.isEcho);
  let replies = 0;
  let shadowed = 0;
  const errors: string[] = [];

  await trackAiEvent(admin, {
    eventType: "instagram_webhook_received",
    metadata: {
      count: messages.length,
      mock: isInstagramMockMode(),
      shadow: isInstagramShadowMode(),
    },
  });

  for (const msg of messages) {
    try {
      const outcome = await processOneInstagramMessage(admin, msg);
      if (outcome === "shadow") shadowed += 1;
      else replies += 1;
    } catch (err) {
      const name = err instanceof Error ? err.name : "Error";
      arthurLog("error", "instagram_message_failed", {
        name,
        sender: msg.senderId.slice(0, 6),
      });
      errors.push(name);
      await trackAiEvent(admin, {
        eventType: "instagram_message_failed",
        metadata: { sender_prefix: msg.senderId.slice(0, 6) },
      });
    }
  }

  return { handled: messages.length, replies, shadowed, errors };
}

async function processOneInstagramMessage(
  admin: SupabaseClient,
  msg: ParsedInstagramMessage,
): Promise<"shadow" | "sent"> {
  await ensurePendingIdentityLink(admin, "instagram", msg.senderId, {
    last_mid: msg.mid,
    attribution: msg.attribution,
  });

  const linkedUserId = await resolveVerifiedUserId(
    admin,
    "instagram",
    msg.senderId,
  );

  const result = await processArthurMessage(
    {
      channel: "instagram",
      externalUserId: msg.senderId,
      userId: linkedUserId,
      message: msg.text,
      accessToken: null,
      attribution: {
        source: msg.attribution.source,
        campaign: msg.attribution.campaign,
        reel_id: msg.attribution.reel_id,
        keyword: msg.attribution.keyword,
      },
    },
    { admin },
  );

  await markFollowupReplied(admin, {
    externalUserId: msg.senderId,
    conversationId: result.conversationId,
  });

  // Toujours créer une proposition shadow (audit) en mode shadow
  if (isInstagramShadowMode() || !canLiveSendInstagram()) {
    await createShadowProposal(admin, {
      conversationId: result.conversationId,
      externalUserId: msg.senderId,
      userId: linkedUserId,
      inboundMessage: msg.text,
      result,
      attribution: msg.attribution,
    });

    arthurLog("info", "instagram_shadow_no_send", {
      conversation: result.conversationId.slice(0, 8),
      shadow: isInstagramShadowMode(),
      live_gate: canLiveSendInstagram(),
    });

    // Jamais d’envoi en H1 shadow / sans live gate
    return "shadow";
  }

  // Live path — double gate déjà passée (SHADOW=0 + LIVE_SEND=1)
  const send = await sendInstagramTextMessage({
    recipientId: msg.senderId,
    text: result.message,
  });

  await trackAiEvent(admin, {
    conversationId: result.conversationId,
    userId: linkedUserId,
    eventType: send.ok ? "instagram_message_sent" : "instagram_message_failed",
    metadata: {
      mock: send.mock === true,
      mid: send.messageId || null,
      intent: result.intent,
      source: msg.attribution.source,
      campaign: msg.attribution.campaign,
      reel_id: msg.attribution.reel_id,
      keyword: msg.attribution.keyword,
      live: true,
    },
  });

  if (!send.ok) {
    throw new Error(send.error || "send_failed");
  }
  return "sent";
}
