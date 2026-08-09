/**
 * Fallback offline Arthur — sans OpenAI (Phase G).
 * Réponses rule-based + knowledge optionnelle.
 */
import { inferIntentHeuristic, fallbackStructured } from "../intent.js";
import type { ArthurStructuredOutput } from "../types.js";
import type { KnowledgeSnippet } from "../optimization/knowledge.js";

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

  if (opts.reason === "rate_limited") {
    message =
      "Tu m’envoies beaucoup de messages — je prends un court break pour rester utile. " +
      `Reviens dans un moment, ou parcours MySWYM : ${APP()}`;
  } else if (opts.reason === "cost_budget_hard") {
    message =
      "Je suis en mode économie pour aujourd’hui. " +
      (tip ? `${tip} ` : "") +
      `Tu peux avancer sur MySWYM : ${link}`;
  } else if (opts.reason === "channel_disabled") {
    message =
      `Arthur est momentanément indisponible sur ce canal. ` +
      `En attendant : ${APP()} — ou écris à contact@myswym.app.`;
  } else {
    // offline générique / openai error
    if (intent === "technique" || intent === "swimming_question") {
      message =
        (tip ||
          "Conseil rapide : en crawl, garde une oreille dans l’eau à la respiration et allonge chaque coulée.") +
        ` Pour un plan suivi : ${link}`;
    } else if (intent === "plan_request" || intent === "goal") {
      message =
        "Je peux t’orienter : précise distance / délai / séances par semaine, " +
        `et génère ton plan sur MySWYM : ${link}` +
        (tip ? ` — ${tip}` : "");
    } else if (intent === "subscription" || intent === "myswym_question") {
      message = `MySWYM : plans natation personnalisés + essai Premium. Détails : ${APP()}/tarifs`;
    } else {
      message =
        (tip ||
          "Dis-moi ton objectif natation (ex. triathlon, technique crawl, 2–3 séances/semaine).") +
        ` Je te guide aussi sur ${APP()}`;
    }
  }

  const structured = fallbackStructured(message.slice(0, 1000));
  structured.intent = intent;
  structured.lead_temperature =
    intent === "plan_request" || intent === "subscription" ? "warm" : "cold";
  structured.suggested_action =
    intent === "plan_request" ? "suggest_myswym" : "continue";
  structured.extracted_data = {
    ...structured.extracted_data,
    offline: true,
    offline_reason: opts.reason,
  };
  return structured;
}

export function hasOpenAiApiKey(): boolean {
  return Boolean((process.env.OPENAI_API_KEY || "").trim());
}
