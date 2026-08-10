/**
 * Politique de réponse Instagram Shadow H1.
 * Déterministe : corrige hors-sujet / prix / CTA MySWYM trop agressifs
 * (offline + sortie LLM), sans toucher au webhook HMAC ni aux gates d’envoi.
 */
import type { ArthurStructuredOutput } from "../types.js";
import { inferIntentHeuristic } from "../intent.js";

const APP = () =>
  (process.env.APP_URL || "https://myswym.app").replace(/\/$/, "");

/** Tarifs produit (alignés Tarifs.jsx / Legal). */
export const MYSWYM_PRICING = {
  monthlyLabel: "4,99€",
  annualLabel: "39,99€",
  trialDays: 7,
} as const;

const MYSWYM_LINK_RE =
  /https?:\/\/(?:www\.)?myswym\.app[^\s]*|myswym\.app\/[^\s]*/gi;

const SWIM_RELEVANT_RE =
  /\b(nage|nager|natation|crawl|brasse|dos|papillon|piscine|bassin|eau\s*libre|triathlon|ironman|séance|entrain|entraîn|plan|programme|coach|objectif|progress|technique|respiration|virage|coulée|allure|volume|z[1-4]|premium|myswym|abonnement|tarif|prix|essai|compétition|course|bpjeps|bnssa)\b/i;

const OBVIOUS_OFFTOPIC_RE =
  /\b(kebab|pizza|burger|tacos|sushi|mcdonald|nourriture|manger|faim|recette|bitcoin|crypto|nft|forex|dating|rencontre|nude|onlyfans|crypto|voip|pharmacie|viagra)\b/i;

const PRICING_RE =
  /\b(prix|tarif|tarifs|combien|co[uû]t|abo|abonnement|premium|essai|mensuel|annuel|payer|paiement)\b/i;

export function containsMyswymLink(text: string): boolean {
  return MYSWYM_LINK_RE.test(text || "");
}

export function stripMyswymLinks(text: string): string {
  return String(text || "")
    .replace(MYSWYM_LINK_RE, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([.,!?])/g, "$1")
    .trim();
}

/** DM hors sujet / spam / sans lien natation-MySWYM. */
export function isOffTopicDm(message: string): boolean {
  const text = String(message || "").trim();
  if (!text) return true;
  if (OBVIOUS_OFFTOPIC_RE.test(text) && !SWIM_RELEVANT_RE.test(text)) {
    return true;
  }
  const intent = inferIntentHeuristic(text);
  if (
    intent === "other" &&
    !SWIM_RELEVANT_RE.test(text) &&
    text.length < 160
  ) {
    return true;
  }
  return false;
}

export function isPricingDm(message: string): boolean {
  const text = String(message || "").trim();
  if (!text) return false;
  if (!PRICING_RE.test(text)) return false;
  // « prix » dans un contexte purement food/spam → pas pricing produit
  if (isOffTopicDm(text) && !/myswym|app|appli|premium|abo/i.test(text)) {
    return false;
  }
  return (
    inferIntentHeuristic(text) === "subscription" ||
    /prix|tarif|combien.*(app|appli|premium|abo|myswym)|co[uû]te/i.test(text)
  );
}

export function buildPricingReplyMessage(): string {
  const base = APP();
  return (
    `Premium MySWYM : essai ${MYSWYM_PRICING.trialDays} jours (carte requise), ` +
    `puis ${MYSWYM_PRICING.monthlyLabel}/mois sans engagement, ` +
    `ou ${MYSWYM_PRICING.annualLabel}/an. ` +
    `Détails : ${base}/tarifs`
  );
}

export function buildOffTopicReplyMessage(): string {
  return "Je suis coach natation MySWYM — hors sujet pour moi. Si tu as une question nage ou entraînement, envoie-la.";
}

/**
 * Applique la politique Shadow sur une sortie structurée.
 * À utiliser pour le canal Instagram (et offline générique).
 */
export function applyShadowReplyPolicy(
  structured: ArthurStructuredOutput,
  inboundMessage: string,
): ArthurStructuredOutput {
  const inbound = String(inboundMessage || "").trim();
  const out: ArthurStructuredOutput = {
    ...structured,
    extracted_data: { ...structured.extracted_data },
    message: String(structured.message || "").trim(),
  };

  if (isPricingDm(inbound)) {
    out.intent = "subscription";
    out.lead_temperature = "warm";
    out.suggested_action = "continue";
    // Réponse tarifaire directe ; /tarifs en complément seulement.
    if (!/\b4[,.]99\b/.test(out.message) || !/\/tarifs\b/i.test(out.message)) {
      out.message = buildPricingReplyMessage();
    }
    out.extracted_data.shadow_policy = "pricing";
    return out;
  }

  if (isOffTopicDm(inbound) || out.intent === "other") {
    // Ne pas rétrograder une vraie question natation classée other à tort
    // si le message inbound est clairement pertinent.
    if (isOffTopicDm(inbound) || !SWIM_RELEVANT_RE.test(inbound)) {
      out.intent = "other";
      out.lead_temperature = "cold";
      out.suggested_action = "no_reply";
      out.message = stripMyswymLinks(out.message);
      if (
        !out.message ||
        containsMyswymLink(structured.message) ||
        /inscription|premium|plan suivi|génère/i.test(structured.message || "")
      ) {
        out.message = buildOffTopicReplyMessage();
      }
      // Garantie : zéro lien MySWYM
      out.message = stripMyswymLinks(out.message) || buildOffTopicReplyMessage();
      out.extracted_data.shadow_policy = "off_topic_no_promo";
      out.extracted_data.needs_plan = false;
      return out;
    }
  }

  // Pertinent : enlever les CTA MySWYM collés sur pure technique sans demande produit
  if (
    (out.intent === "technique" || out.intent === "swimming_question") &&
    out.suggested_action === "continue" &&
    /inscription\?ref=/i.test(out.message)
  ) {
    out.message = stripMyswymLinks(out.message).trim();
    if (!out.message) {
      out.message =
        "Conseil rapide : en crawl, garde une oreille dans l’eau à la respiration et allonge chaque coulée. Tu nages combien de fois par semaine ?";
    }
  }

  return out;
}
