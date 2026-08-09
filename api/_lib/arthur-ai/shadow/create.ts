/**
 * Création / lecture propositions Shadow Mode.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { arthurLog } from "../logging.js";
import { trackAiEvent } from "../tracking.js";
import {
  classifyRecommendedAction,
  type RecommendedAction,
} from "./mode.js";
import type { ProcessArthurMessageResult } from "../types.js";
import { scoreLead } from "../growth/scoring.js";

export interface CreateShadowProposalInput {
  conversationId: string;
  externalUserId: string;
  userId?: string | null;
  inboundMessage: string;
  result: ProcessArthurMessageResult;
  attribution?: {
    source?: string | null;
    campaign?: string | null;
    reel_id?: string | null;
    keyword?: string | null;
  };
}

export async function createShadowProposal(
  admin: SupabaseClient,
  input: CreateShadowProposalInput,
): Promise<{ ok: boolean; id?: string; recommended_action?: RecommendedAction }> {
  try {
    let leadId: string | null = null;
    let leadStatus: string | null = null;
    let leadScore: number | null = null;
    let leadBand: string | null = null;

    const { data: lead } = await admin
      .from("ai_leads")
      .select("id, status, score, score_band, intent, goal, level, reel_id, campaign, keyword")
      .eq("external_user_id", input.externalUserId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lead) {
      leadId = lead.id;
      leadStatus = lead.status;
      leadScore = lead.score;
      leadBand = lead.score_band;
    }

    const extracted = input.result.extracted_data || {};
    const scored = scoreLead({
      status: leadStatus,
      intent: input.result.intent,
      goal: (extracted.goal as string) || lead?.goal,
      level: (extracted.level as string) || lead?.level,
      reel_id: input.attribution?.reel_id || lead?.reel_id,
      campaign: input.attribution?.campaign || lead?.campaign,
      keyword: input.attribution?.keyword || lead?.keyword,
      lead_temperature: input.result.lead_temperature,
    });

    if (leadScore == null) {
      leadScore = scored.score;
      leadBand = scored.band;
    }

    const recommended_action = classifyRecommendedAction({
      suggested_action: input.result.suggested_action,
      intent: input.result.intent,
      lead_temperature: input.result.lead_temperature,
      lead_status: leadStatus,
      message: input.inboundMessage,
    });

    const { data: row, error } = await admin
      .from("ai_shadow_proposals")
      .insert({
        conversation_id: input.conversationId,
        lead_id: leadId,
        external_user_id: input.externalUserId,
        user_id: input.userId || null,
        channel: "instagram",
        inbound_message: String(input.inboundMessage || "").slice(0, 4000),
        proposed_message: String(input.result.message || "").slice(0, 4000),
        intent: input.result.intent,
        lead_temperature: input.result.lead_temperature,
        suggested_action: input.result.suggested_action,
        recommended_action,
        lead_status_guess: leadStatus,
        lead_score_snapshot: leadScore,
        lead_band_snapshot: leadBand,
        classification: {
          intent: input.result.intent,
          lead_temperature: input.result.lead_temperature,
          suggested_action: input.result.suggested_action,
          recommended_action,
          score_reasons: scored.reasons,
          extracted: {
            goal: extracted.goal ?? null,
            level: extracted.level ?? null,
            frequency: extracted.frequency ?? null,
          },
        },
        attribution: {
          source: input.attribution?.source || null,
          campaign: input.attribution?.campaign || null,
          reel_id: input.attribution?.reel_id || null,
          keyword: input.attribution?.keyword || null,
        },
        model: input.result.model,
        status: "pending",
        send_blocked_reason: "shadow_mode_h1",
        metadata: {
          mock: input.result.mock === true,
          tools: (input.result.toolCalls || []).map((t) => t.name),
        },
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .maybeSingle();

    if (error) {
      arthurLog("error", "shadow_proposal_insert_failed", { code: error.code });
      return { ok: false };
    }

    await trackAiEvent(admin, {
      conversationId: input.conversationId,
      userId: input.userId,
      eventType: "shadow_proposal_created",
      metadata: {
        proposal_id: row?.id || null,
        recommended_action,
        intent: input.result.intent,
        lead_temperature: input.result.lead_temperature,
      },
    });

    await trackAiEvent(admin, {
      conversationId: input.conversationId,
      userId: input.userId,
      eventType: "shadow_send_blocked",
      metadata: {
        proposal_id: row?.id || null,
        reason: "shadow_mode_h1",
      },
    });

    return { ok: true, id: row?.id, recommended_action };
  } catch (err) {
    arthurLog("warn", "shadow_proposal_create_exception", {
      name: err instanceof Error ? err.name : "Error",
    });
    return { ok: false };
  }
}
