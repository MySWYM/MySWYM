/**
 * Politique de réponse Instagram Shadow H1.
 * Déterministe : hors-sujet → ignore + brouillon vide ;
 * handoff humain seulement si légitime + texte client exact.
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

/** Texte client exact — handoff humain légitime (Shadow H1). */
export const HUMAN_HANDOFF_CLIENT_MESSAGE =
  "Quelqu’un de l’équipe MySWYM te répondra dès que possible. En cas d’urgence : contact@myswym.app";

const MYSWYM_LINK_RE =
  /https?:\/\/(?:www\.)?myswym\.app[^\s]*|myswym\.app\/[^\s]*/gi;

const INTERNAL_BOT_SPEAK_RE =
  /arthur se met en pause|je te passe un humain|en tant qu['’]ia|je suis une (ia|intelligence)|chatbot|mode pause/i;

const SWIM_RELEVANT_RE =
  /\b(nage|nager|natation|crawl|brasse|dos|papillon|piscine|bassin|eau\s*libre|triathlon|ironman|séance|entrain|entraîn|plan|programme|coach|objectif|progress|technique|respiration|virage|coulée|allure|volume|z[1-4]|premium|myswym|abonnement|tarif|prix|essai|compétition|course|bpjeps|bnssa)\b/i;

const OBVIOUS_OFFTOPIC_RE =
  /\b(kebab|pizza|burger|tacos|sushi|mcdonald|nourriture|manger|faim|recette|bitcoin|crypto|nft|forex|dating|rencontre|nude|onlyfans|voip|pharmacie|viagra)\b/i;

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

/** DM hors sujet / spam / absurde / sans lien natation-MySWYM. */
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
  if (isOffTopicDm(text) && !/myswym|app|appli|premium|abo/i.test(text)) {
    return false;
  }
  return (
    inferIntentHeuristic(text) === "subscription" ||
    /prix|tarif|combien.*(app|appli|premium|abo|myswym)|co[uû]te/i.test(text)
  );
}

/**
 * Handoff humain légitime uniquement :
 * compte/paiement, remboursement, incident, plainte, médical individualisé,
 * ou demande explicite de parler à quelqu’un.
 */
export function isLegitimateHandoffDm(message: string): boolean {
  const t = String(message || "").trim();
  if (!t) return false;

  // Signaux handoff avant le filtre hors-sujet (sinon « remboursement » = other)
  if (
    /\b(parler\s+(à|a)\s+(un\s+|une\s+)?(humain|personne|conseiller|agent|quelqu)|parler\s+à\s+quelqu|stop\s+arthur|arr[eê]t\s+arthur)\b/i.test(
      t,
    ) ||
    (/\b(humain|conseiller|agent)\b/i.test(t) &&
      /\b(parler|voir|contacter|joindre|équipe|equipe)\b/i.test(t))
  ) {
    return true;
  }

  if (/\b(rembours\w*|plainte|r[eé]clamation|incident)\b/i.test(t)) return true;

  if (
    /\b(probl[eè]me|bug|erreur|bloqu).{0,48}(compte|paiement|cb|carte|stripe|abo|factur)/i.test(
      t,
    ) ||
    /\b(compte|paiement|cb|carte|stripe|abo|factur).{0,48}(probl[eè]me|bug|erreur|bloqu|marche\s*pas)/i.test(
      t,
    )
  ) {
    return true;
  }

  if (
    /\b(blessure|douleur|tendinite|m[eé]decin|docteur|physio|kin[eé]|diagnostic|urgent\s+m[eé]dical)\b/i.test(
      t,
    )
  ) {
    return true;
  }

  if (isOffTopicDm(t)) return false;

  // Question tarif pure → pas un handoff
  if (isPricingDm(t)) return false;

  return false;
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

/** Hors-sujet : brouillon vide (rien à approuver / envoyer). */
export function buildOffTopicReplyMessage(): string {
  return "";
}

export function buildHumanHandoffMessage(): string {
  return HUMAN_HANDOFF_CLIENT_MESSAGE;
}

/**
 * Applique la politique Shadow sur une sortie structurée.
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

  // 1) Handoff légitime d’abord (sinon « parler à un humain » tombe en hors-sujet)
  if (isLegitimateHandoffDm(inbound)) {
    out.intent = "support";
    out.lead_temperature = "warm";
    out.suggested_action = "handoff_human";
    out.message = HUMAN_HANDOFF_CLIENT_MESSAGE;
    out.extracted_data.shadow_policy = "human_handoff";
    out.extracted_data.needs_human = true;
    return out;
  }

  // 2) Hors-sujet / spam → ignore, brouillon vide, jamais de handoff
  if (isOffTopicDm(inbound)) {
    out.intent = "other";
    out.lead_temperature = "cold";
    out.suggested_action = "no_reply";
    out.message = "";
    out.extracted_data.shadow_policy = "off_topic_ignore";
    out.extracted_data.needs_plan = false;
    out.extracted_data.needs_human = false;
    return out;
  }

  // 3) Refuser un handoff inventé par le modèle
  if (out.suggested_action === "handoff_human") {
    out.suggested_action = "continue";
    if (
      !out.message ||
      INTERNAL_BOT_SPEAK_RE.test(out.message) ||
      /passe un humain|se met en pause/i.test(out.message)
    ) {
      out.message =
        "Dis-moi ton objectif natation ou ta question concrète — je t’oriente.";
    }
  }

  // 4) Nettoyer jargon interne s’il reste
  if (INTERNAL_BOT_SPEAK_RE.test(out.message)) {
    out.message = out.message
      .replace(INTERNAL_BOT_SPEAK_RE, "")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
  }

  if (isPricingDm(inbound)) {
    out.intent = "subscription";
    out.lead_temperature = "warm";
    out.suggested_action = "continue";
    if (!/\b4[,.]99\b/.test(out.message) || !/\/tarifs\b/i.test(out.message)) {
      out.message = buildPricingReplyMessage();
    }
    out.extracted_data.shadow_policy = "pricing";
    return out;
  }

  // intent other non pertinent (sans swim signal) → ignore vide
  if (out.intent === "other" && !SWIM_RELEVANT_RE.test(inbound)) {
    out.lead_temperature = "cold";
    out.suggested_action = "no_reply";
    out.message = "";
    out.extracted_data.shadow_policy = "off_topic_ignore";
    out.extracted_data.needs_plan = false;
    return out;
  }

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
