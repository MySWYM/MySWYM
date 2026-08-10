/**
 * Politique Shadow H1 — conseiller conversationnel.
 * Ignore seulement spam/hors-sujet évident.
 * Handoff seulement cas bloquants.
 */
import type { ArthurStructuredOutput } from "../types.js";
import { inferIntentHeuristic } from "../intent.js";
import {
  MYSWYM_PRODUCT,
  matchBuiltinKnowledge,
} from "../knowledge/myswym-product.js";

const APP = () =>
  (process.env.APP_URL || "https://myswym.app").replace(/\/$/, "");

export const MYSWYM_PRICING = {
  monthlyLabel: MYSWYM_PRODUCT.monthly,
  annualLabel: MYSWYM_PRODUCT.annual,
  trialDays: MYSWYM_PRODUCT.trialDays,
} as const;

export const HUMAN_HANDOFF_CLIENT_MESSAGE =
  "Quelqu’un de l’équipe MySWYM te répondra dès que possible. En cas d’urgence : contact@myswym.app";

const MYSWYM_LINK_RE =
  /https?:\/\/(?:www\.)?myswym\.app[^\s]*|myswym\.app\/[^\s]*/gi;

const INTERNAL_BOT_SPEAK_RE =
  /arthur se met en pause|je te passe un humain|en tant qu['’]ia|je suis une (ia|intelligence)|chatbot|mode pause/i;

/** Pertinent : produit, natation, sport, objectifs, support soft. */
const RELEVANT_RE =
  /\b(nage|nager|natation|crawl|brasse|dos|papillon|piscine|bassin|eau\s*libre|triathlon|ironman|séance|entrain|entraîn|plan|programme|coach|objectif|progress|technique|respiration|virage|coulée|allure|volume|z[1-4]|premium|myswym|abonnement|tarif|prix|essai|compétition|course|bpjeps|bnssa|appli|application|app|fonctionne|fonctionnement|inscription|inscrire|résil|annul|comment|utiliser|entraînement|entrainement|prep|prépa)\b/i;

const OBVIOUS_OFFTOPIC_RE =
  /\b(kebab|pizza|burger|tacos|sushi|mcdonald|nourriture|manger|faim|recette|bitcoin|crypto|nft|forex|dating|rencontre|nude|onlyfans|voip|pharmacie|viagra)\b/i;

const PRICING_RE =
  /\b(prix|tarif|tarifs|combien|co[uû]t|abo|abonnement|premium|essai|mensuel|annuel|payer|paiement|résil|annul)\b/i;

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

export function isRelevantConversationalDm(message: string): boolean {
  const text = String(message || "").trim();
  if (!text) return false;
  if (OBVIOUS_OFFTOPIC_RE.test(text) && !RELEVANT_RE.test(text)) return false;
  if (RELEVANT_RE.test(text)) return true;
  const intent = inferIntentHeuristic(text);
  return intent !== "other";
}

/** Spam / absurde / hors sujet sans lien MySWYM-sport. */
export function isOffTopicDm(message: string): boolean {
  const text = String(message || "").trim();
  if (!text) return true;
  if (isRelevantConversationalDm(text)) return false;
  if (OBVIOUS_OFFTOPIC_RE.test(text)) return true;
  const intent = inferIntentHeuristic(text);
  return intent === "other" && text.length < 160;
}

export function isPricingDm(message: string): boolean {
  const text = String(message || "").trim();
  if (!text || isOffTopicDm(text)) return false;
  if (!PRICING_RE.test(text)) return false;
  return (
    inferIntentHeuristic(text) === "subscription" ||
    /prix|tarif|combien|co[uû]te|abonnement|essai|résil|annul/i.test(text)
  );
}

/**
 * Handoff uniquement cas bloquants :
 * remboursement, paiement/compte (accès interne), plainte sensible,
 * technique non résolue explicite, médical personnel fort, demande humaine explicite.
 */
export function isLegitimateHandoffDm(message: string): boolean {
  const t = String(message || "").trim();
  if (!t) return false;

  // Jamais de handoff sur une question coaching / produit classique
  if (
    /\b(crawl|triathlon|ironman|progress|fonctionne|application|appli|prix|tarif|essai|plan|séance|nage)\b/i.test(
      t,
    ) &&
    !/\b(rembours|plainte|r[eé]clamation|parler\s+(à|a)\s+(un\s+)?humain|stop\s+arthur)\b/i.test(
      t,
    )
  ) {
    // sauf si vraiment compte/paiement cassé
    if (
      !/\b(probl[eè]me|bug|erreur|bloqu).{0,40}(compte|paiement|cb|carte|stripe)\b/i.test(
        t,
      )
    ) {
      return false;
    }
  }

  if (
    /\b(parler\s+(à|a)\s+(un\s+|une\s+)?(humain|personne|conseiller|agent|quelqu)|parler\s+à\s+quelqu|stop\s+arthur|arr[eê]t\s+arthur)\b/i.test(
      t,
    ) ||
    (/\b(humain|personne réelle)\b/i.test(t) &&
      /\b(parler|voir|contacter|joindre)\b/i.test(t))
  ) {
    return true;
  }

  if (/\b(rembours\w*|plainte|r[eé]clamation)\b/i.test(t)) return true;

  if (
    /\b(probl[eè]me|bug|erreur|bloqu|ne\s*(marche|fonctionne)\s*pas).{0,48}(compte|paiement|cb|carte|stripe|factur)/i.test(
      t,
    ) ||
    /\b(compte|paiement|cb|carte|stripe|factur).{0,48}(probl[eè]me|bug|erreur|bloqu|marche\s*pas)/i.test(
      t,
    )
  ) {
    return true;
  }

  // Médical personnel explicite (pas un simple conseil technique)
  if (
    /\b(j['’]ai\s+(une\s+)?blessure|je\s+souffre|douleur\s+vive|urgence\s+m[eé]dicale|avis\s+(d['’])?(un\s+)?(m[eé]decin|docteur|physio|kin[eé])|diagnostic)\b/i.test(
      t,
    )
  ) {
    return true;
  }

  return false;
}

export function buildPricingReplyMessage(): string {
  const base = APP();
  return (
    `Premium MySWYM : essai ${MYSWYM_PRICING.trialDays} jours (carte requise), ` +
    `puis ${MYSWYM_PRICING.monthlyLabel}/mois sans engagement, ` +
    `ou ${MYSWYM_PRICING.annualLabel}/an. ` +
    `Détails : ${base}${MYSWYM_PRODUCT.paths.tarifs} — tu vises plutôt le mensuel flexible ou l’annuel ?`
  );
}

export function buildOffTopicReplyMessage(): string {
  return "";
}

export function buildHumanHandoffMessage(): string {
  return HUMAN_HANDOFF_CLIENT_MESSAGE;
}

/** Réponses conversationnelles déterministes (offline + filet policy). */
export function buildConversationalReply(
  inboundMessage: string,
): ArthurStructuredOutput | null {
  const inbound = String(inboundMessage || "").trim();
  if (!inbound || isOffTopicDm(inbound)) return null;
  if (isLegitimateHandoffDm(inbound)) return null;

  const intent = inferIntentHeuristic(inbound);
  const tip = matchBuiltinKnowledge(inbound, intent, 1)[0]?.content;
  const base = APP();
  const linkInscription = `${base}${MYSWYM_PRODUCT.paths.inscription}`;

  if (isPricingDm(inbound)) {
    return {
      message: buildPricingReplyMessage(),
      intent: "subscription",
      lead_temperature: "warm",
      extracted_data: { shadow_policy: "pricing" },
      suggested_action: "continue",
    };
  }

  if (
    intent === "myswym_question" ||
    /\b(fonctionne|fonctionnement|comment.*(app|appli|application|myswym)|c['’]est quoi|à quoi sert)\b/i.test(
      inbound,
    )
  ) {
    return {
      message:
        `MySWYM crée un plan de natation personnalisé selon ton objectif, ton niveau et ta fréquence : séances structurées (technique + volume) pour progresser sans improviser. ` +
        (tip ? `${tip} ` : "") +
        `Tu peux démarrer ici : ${linkInscription} — c’est quoi ton objectif principal (technique, triathlon, régularité…) ?`,
      intent: "myswym_question",
      lead_temperature: "warm",
      extracted_data: { shadow_policy: "product_explain" },
      suggested_action: "qualify_frequency",
    };
  }

  if (intent === "technique" || /\bcrawl\b/i.test(inbound)) {
    return {
      message:
        (tip ||
          "Pour progresser en crawl : respiration toutes les 3 coulées, oreille dans l’eau, et allonge chaque coulée.") +
        " Tu nages plutôt 1, 2 ou 3 fois par semaine en ce moment ? " +
        `MySWYM peut ensuite te construire un plan adapté à ta fréquence : ${linkInscription}`,
      intent: "technique",
      lead_temperature: "warm",
      extracted_data: { shadow_policy: "crawl_advice" },
      suggested_action: "qualify_frequency",
    };
  }

  if (intent === "goal" || /\btriathlon|ironman\b/i.test(inbound)) {
    return {
      message:
        (tip ||
          "Avec une échéance triathlon, on priorise d’abord nager la distance à l’aise, puis on monte le volume progressivement.") +
        " Tu prépares quelle distance (S, M, L…) et tu te situes comment en natation aujourd’hui (débutant, à l’aise sur 750 m, plus) ?",
      intent: "goal",
      lead_temperature: "warm",
      extracted_data: { shadow_policy: "triathlon_qualify", goal: "triathlon" },
      suggested_action: "qualify_frequency",
    };
  }

  if (intent === "plan_request") {
    return {
      message:
        `Oui — MySWYM est fait pour ça : un plan suivi selon ton objectif et ta dispo. ` +
        `Dis-moi fréquence (séances/semaine) et échéance si tu en as une, ou commence ici : ${linkInscription}`,
      intent: "plan_request",
      lead_temperature: "hot",
      extracted_data: { needs_plan: true, shadow_policy: "plan_request" },
      suggested_action: "suggest_myswym",
    };
  }

  if (intent === "training" || intent === "swimming_question") {
    return {
      message:
        (tip ||
          "En natation, la régularité compte plus que la séance héroïque : 2 séances solides battent une seule très longue.") +
        " Tu vises plutôt technique, endurance, ou une course ?",
      intent: intent === "training" ? "training" : "swimming_question",
      lead_temperature: "warm",
      extracted_data: { shadow_policy: "training_chat" },
      suggested_action: "qualify_frequency",
    };
  }

  if (intent === "subscription") {
    return {
      message: buildPricingReplyMessage(),
      intent: "subscription",
      lead_temperature: "warm",
      extracted_data: { shadow_policy: "pricing" },
      suggested_action: "continue",
    };
  }

  // Message pertinent non classé finement → engager la conversation
  if (isRelevantConversationalDm(inbound)) {
    return {
      message:
        "Je peux t’aider sur MySWYM, la natation ou un objectif (crawl, triathlon, plan). " +
        "Tu veux plutôt comprendre l’app, un conseil technique, ou préparer une échéance ?",
      intent: "myswym_question",
      lead_temperature: "warm",
      extracted_data: { shadow_policy: "open_qualify" },
      suggested_action: "continue",
    };
  }

  return null;
}

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

  if (isLegitimateHandoffDm(inbound)) {
    out.intent = "support";
    out.lead_temperature = "warm";
    out.suggested_action = "handoff_human";
    out.message = HUMAN_HANDOFF_CLIENT_MESSAGE;
    out.extracted_data.shadow_policy = "human_handoff";
    out.extracted_data.needs_human = true;
    return out;
  }

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

  // Remplacer ignore/handoff erronés + brouillons vides sur messages pertinents
  const needsConversationalFix =
    out.suggested_action === "no_reply" ||
    out.suggested_action === "handoff_human" ||
    !out.message ||
    INTERNAL_BOT_SPEAK_RE.test(out.message) ||
    (out.intent === "other" && isRelevantConversationalDm(inbound));

  if (needsConversationalFix) {
    const built = buildConversationalReply(inbound);
    if (built) {
      return {
        ...built,
        extracted_data: {
          ...out.extracted_data,
          ...built.extracted_data,
          shadow_policy_repaired: true,
        },
      };
    }
    out.suggested_action = "continue";
    if (!out.message || INTERNAL_BOT_SPEAK_RE.test(out.message)) {
      out.message =
        "Je t’écoute — tu veux un conseil natation, comprendre MySWYM, ou préparer un objectif ?";
    }
  }

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
    if (!/\b4[,.]99\b/.test(out.message)) {
      out.message = buildPricingReplyMessage();
    }
    out.extracted_data.shadow_policy = "pricing";
  }

  return out;
}
