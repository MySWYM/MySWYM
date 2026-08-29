/**
 * Base de connaissance produit MySWYM : disponible au runtime
 * (Cursor n’est pas une source de vérité en production).
 *
 * Alignée Tarifs.jsx / Legal / SupportBubble / landing.
 */
import type { KnowledgeSnippet } from "../optimization/knowledge.js";

const APP = () =>
  (process.env.APP_URL || "https://myswym.app").replace(/\/$/, "");

export const MYSWYM_PRODUCT = {
  name: "MySWYM",
  tagline: "Plans d’entraînement natation personnalisés",
  monthlyFlex: "9,99€",
  monthlyCommit: "4,99€",
  monthly: "9,99€",
  annual: "52,99€",
  trialDays: 7,
  paths: {
    tarifs: "/fr/tarifs",
    inscription: "/inscription",
    app: "/app",
    support: "contact@myswym.app",
  },
} as const;

/** Snippets produit + coaching toujours disponibles hors DB. */
export function getBuiltinMyswymKnowledge(): KnowledgeSnippet[] {
  const base = APP();
  return [
    {
      topic: "myswym_how_it_works",
      title: "Fonctionnement de l’app",
      content:
        `MySWYM génère un plan de natation personnalisé (bassin / eau libre / triathlon) via un moteur rule-based : tu renseignes objectif, niveau, fréquence et contraintes, puis tu suis des séances structurées (échauffement → technique → corps → retour calme). À la création du compte : essai Premium ${MYSWYM_PRODUCT.trialDays} jours sans carte. Ensuite tes séances se mettent en pause jusqu’à l’abonnement. Inscription : ${base}${MYSWYM_PRODUCT.paths.inscription}`,
      tags: [
        "fonctionne",
        "application",
        "app",
        "comment",
        "myswym",
        "inscription",
        "utiliser",
      ],
      intent_hints: ["myswym_question", "support", "other"],
      priority: 100,
    },
    {
      topic: "myswym_pricing",
      title: "Tarifs Premium",
      content:
        `Premium : essai ${MYSWYM_PRODUCT.trialDays} jours sans carte à l’inscription, puis ${MYSWYM_PRODUCT.monthlyFlex}/mois sans engagement, ${MYSWYM_PRODUCT.monthlyCommit}/mois avec engagement 12 mois, ou ${MYSWYM_PRODUCT.annual}/an en 1 fois. Après l’essai, tes séances se mettent en pause. Détails : ${base}${MYSWYM_PRODUCT.paths.tarifs}`,
      tags: ["prix", "tarif", "abonnement", "premium", "essai", "mensuel", "annuel"],
      intent_hints: ["subscription", "myswym_question"],
      priority: 100,
    },
    {
      topic: "myswym_cancel",
      title: "Résiliation",
      content:
        "Pour te désabonner : Profil → Paramètres → « Gérer mon abonnement » (portail Stripe) → Annuler l’abonnement. Tu restes Premium jusqu’à la fin de la période déjà payée, puis tes séances se mettent en pause. Essai 7 jours sans carte : rien à résilier, ça s’arrête tout seul. Offre 4,99€/mois : engagement 12 mois. Annuel 52,99€ : pas de remboursement au prorata hors cas légaux. Supprimer le compte ne résilie pas l’abonnement.",
      tags: ["résil", "annul", "résiliation", "annulation", "stripe"],
      intent_hints: ["subscription", "support"],
      priority: 90,
    },
    {
      topic: "myswym_features",
      title: "Fonctionnalités Premium",
      content:
        "Premium : plans complets, départs D…, allures cibles, adaptation selon le feedback. Essai 7 jours sans carte à l’inscription ; ensuite tes séances se mettent en pause jusqu’à l’abonnement.",
      tags: ["fonctionnalité", "premium", "plan", "allure", "adaptation"],
      intent_hints: ["myswym_question", "plan_request", "subscription"],
      priority: 85,
    },
    {
      topic: "technique_crawl",
      title: "Conseil crawl",
      content:
        "En crawl : respiration bilatérale (toutes les 3 coulées), oreille dans l’eau, allonge la coulée. La régularité (2-3 séances/semaine) bat les grosses séances isolées.",
      tags: ["crawl", "respiration", "technique", "progress"],
      intent_hints: ["technique", "swimming_question", "training"],
      priority: 90,
    },
    {
      topic: "triathlon",
      title: "Prépa triathlon natation",
      content:
        "Avec une échéance triathlon : d’abord nager la distance confortablement, puis monter le volume ~+10%/semaine max. Précise distance (S/M/L/Iron) et niveau actuel en natation pour orienter.",
      tags: ["triathlon", "ironman", "prépa", "mois", "échéance"],
      intent_hints: ["goal", "plan_request", "training"],
      priority: 95,
    },
    {
      topic: "sport_limits",
      title: "Limites conseil sportif",
      content:
        "Arthur donne des conseils généraux d’entraînement. Douleur vive, blessure récente ou question médicale individuelle : oriente vers un professionnel de santé, pas de diagnostic.",
      tags: ["blessure", "douleur", "santé", "médical"],
      intent_hints: ["support", "training"],
      priority: 70,
    },
    {
      topic: "brand_tone",
      title: "Ton de marque",
      content:
        "Français naturel, direct, sympathique, pas corporate. Une question utile max par message. Aide avant de vendre. Pas de jargon IA (« en tant qu’IA », « je me mets en pause »).",
      tags: ["ton", "marque"],
      intent_hints: ["myswym_question", "other"],
      priority: 50,
    },
  ];
}

export function matchBuiltinKnowledge(
  message: string,
  intent?: string | null,
  limit = 3,
): KnowledgeSnippet[] {
  const msg = (message || "").toLowerCase();
  const intentL = (intent || "").toLowerCase();
  const scored = getBuiltinMyswymKnowledge().map((s) => {
    let score = s.priority || 0;
    if (intentL && (s.intent_hints || []).includes(intentL)) score += 40;
    for (const tag of s.tags || []) {
      if (msg.includes(String(tag).toLowerCase())) score += 20;
    }
    return { s, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(({ s }) => s);
}
