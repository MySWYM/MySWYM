/**
 * Fallback offline Arthur — sans OpenAI (Phase G).
 * Réponses rule-based + knowledge optionnelle.
 * Respecte la politique Shadow (hors-sujet sans promo, prix directs).
 */
import { inferIntentHeuristic, fallbackStructured } from "../intent.js";
import type { ArthurStructuredOutput } from "../types.js";
import type { KnowledgeSnippet } from "../optimization/knowledge.js";
import {
  applyShadowReplyPolicy,
  buildOffTopicReplyMessage,
  buildPricingReplyMessage,
  isOffTopicDm,
  isPricingDm,
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
  const link = `${APP()}/inscription?ref=arthur_offline`;

  let message: string;
  let suggested_action = "continue";
  let lead_temperature: ArthurStructuredOutput["lead_temperature"] = "cold";

  if (opts.reason === "rate_limited") {
    message =
      "Tu m’envoies beaucoup de messages — je prends un court break pour rester utile. " +
      "Reviens dans un moment.";
  } else if (opts.reason === "cost_budget_hard") {
    message =
      "Je suis en mode économie pour aujourd’hui. " +
      (tip ? `${tip} ` : "") +
      (isOffTopicDm(userMessage)
        ? "Reviens plus tard pour une question natation."
        : `Tu peux avancer sur MySWYM : ${link}`);
  } else if (opts.reason === "channel_disabled") {
    message =
      `Arthur est momentanément indisponible sur ce canal. ` +
      `En attendant : ${APP()} — ou écris à contact@myswym.app.`;
  } else if (isPricingDm(userMessage)) {
    message = buildPricingReplyMessage();
    suggested_action = "continue";
    lead_temperature = "warm";
  } else if (isOffTopicDm(userMessage)) {
    message = buildOffTopicReplyMessage();
    suggested_action = "no_reply";
    lead_temperature = "cold";
  } else if (intent === "technique" || intent === "swimming_question") {
    message =
      tip ||
      "Conseil rapide : en crawl, garde une oreille dans l’eau à la respiration et allonge chaque coulée. Tu nages combien de fois par semaine ?";
    suggested_action = "qualify_frequency";
  } else if (intent === "plan_request") {
    message =
      "Je peux t’orienter vers un plan suivi. Précise distance / délai / séances par semaine — " +
      `ou génère-le sur MySWYM : ${link}` +
      (tip ? ` — ${tip}` : "");
    suggested_action = "suggest_myswym";
    lead_temperature = "warm";
  } else if (intent === "goal") {
    if (/triathlon/i.test(userMessage)) {
      message =
        "Triathlon avec une échéance : on construit une progression réaliste. Tu nages déjà combien de fois par semaine, et plutôt bassin ou eau libre ?";
    } else {
      message =
        tip ||
        "Bel objectif. Pour construire quelque chose de réaliste : tu nages déjà combien de fois par semaine, et sur quelle distance ?";
    }
    suggested_action = "qualify_frequency";
    lead_temperature = "warm";
  } else if (intent === "subscription" || intent === "myswym_question") {
    message = buildPricingReplyMessage();
    suggested_action = "continue";
    lead_temperature = "warm";
  } else if (intent === "training") {
    message =
      tip ||
      "Dis-moi ton volume actuel (séances / semaine) et ton focus (technique, endurance, vitesse) — je te guide concrètement.";
    suggested_action = "qualify_frequency";
  } else {
    message =
      tip ||
      "Dis-moi ton objectif natation (ex. triathlon, technique crawl, 2–3 séances/semaine) — je t’oriente.";
    suggested_action = "continue";
  }

  const structured = fallbackStructured(message.slice(0, 1000));
  structured.intent = isOffTopicDm(userMessage)
    ? "other"
    : isPricingDm(userMessage)
      ? "subscription"
      : intent;
  structured.lead_temperature = lead_temperature;
  structured.suggested_action = suggested_action;
  structured.extracted_data = {
    ...structured.extracted_data,
    offline: true,
    offline_reason: opts.reason,
  };

  return applyShadowReplyPolicy(structured, userMessage);
}

export function hasOpenAiApiKey(): boolean {
  return Boolean((process.env.OPENAI_API_KEY || "").trim());
}
