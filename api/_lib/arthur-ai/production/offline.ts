/**
 * Fallback offline Arthur — conseiller conversationnel (Phase G / Shadow H1).
 */
import { inferIntentHeuristic, fallbackStructured } from "../intent.js";
import type { ArthurStructuredOutput } from "../types.js";
import type { KnowledgeSnippet } from "../optimization/knowledge.js";
import {
  applyShadowReplyPolicy,
  buildConversationalReply,
  buildHumanHandoffMessage,
  buildOffTopicReplyMessage,
  isLegitimateHandoffDm,
  isOffTopicDm,
} from "../shadow/reply-policy.js";

const APP = () =>
  (process.env.APP_URL || "https://myswym.app").replace(/\/$/, "");

export type OfflineReason =
  | "flag_offline"
  | "openai_error"
  | "cost_budget_hard"
  | "no_api_key"
  | "channel_disabled"
  | "rate_limited";

export function buildOfflineResponse(
  userMessage: string,
  opts: {
    reason: OfflineReason;
    snippets?: KnowledgeSnippet[];
  },
): ArthurStructuredOutput {
  const intent = inferIntentHeuristic(userMessage);
  const tip = opts.snippets?.[0]?.content;

  let structured: ArthurStructuredOutput;

  if (opts.reason === "rate_limited") {
    structured = fallbackStructured(
      "Tu m’envoies beaucoup de messages — je prends un court break pour rester utile. Reviens dans un moment.",
    );
    structured.suggested_action = "continue";
  } else if (opts.reason === "cost_budget_hard") {
    structured = fallbackStructured(
      "Je suis en mode économie pour aujourd’hui. " +
        (tip || "Reviens un peu plus tard pour continuer sur ta natation ou MySWYM."),
    );
    structured.suggested_action = "continue";
  } else if (opts.reason === "channel_disabled") {
    structured = fallbackStructured(
      `Arthur est momentanément indisponible sur ce canal. En attendant : ${APP()} — ou ${"contact@myswym.app"}.`,
    );
    structured.suggested_action = "continue";
  } else if (isLegitimateHandoffDm(userMessage)) {
    structured = fallbackStructured(buildHumanHandoffMessage());
    structured.intent = "support";
    structured.suggested_action = "handoff_human";
    structured.lead_temperature = "warm";
  } else if (isOffTopicDm(userMessage)) {
    structured = fallbackStructured(buildOffTopicReplyMessage());
    structured.intent = "other";
    structured.suggested_action = "no_reply";
    structured.lead_temperature = "cold";
  } else {
    const built = buildConversationalReply(userMessage);
    if (built) {
      structured = built;
      if (tip && built.intent === "technique" && !built.message.includes(tip.slice(0, 24))) {
        // garder le tip knowledge en tête si plus précis
        structured = {
          ...built,
          message: `${tip} ${built.message}`.slice(0, 1000),
        };
      }
    } else {
      structured = fallbackStructured(
        tip ||
          "Dis-moi ton objectif natation ou ce que tu veux comprendre sur MySWYM — je t’oriente.",
      );
      structured.intent = intent;
      structured.suggested_action = "continue";
      structured.lead_temperature = "warm";
    }
  }

  structured.extracted_data = {
    ...structured.extracted_data,
    offline: true,
    offline_reason: opts.reason,
  };

  if (
    opts.reason === "rate_limited" ||
    opts.reason === "cost_budget_hard" ||
    opts.reason === "channel_disabled"
  ) {
    return structured;
  }

  return applyShadowReplyPolicy(structured, userMessage);
}

export function hasOpenAiApiKey(): boolean {
  return Boolean((process.env.OPENAI_API_KEY || "").trim());
}
