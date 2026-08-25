/**
 * Insights coach rule-based (pas de LLM).
 * Utilisés pour PlanReady, paywalls contextuels et teasers Premium.
 */

const GOAL_LABELS = {
  triathlon: "triathlon",
  "eau libre": "eau libre",
  openwater: "eau libre",
  progression: "progression",
  wellness: "remise en forme",
  bnssa: "BNSSA",
  diplôme: "diplôme",
};

function goalLabel(profile) {
  const raw = (profile?.goal || profile?.category || "").toLowerCase();
  for (const [key, label] of Object.entries(GOAL_LABELS)) {
    if (raw.includes(key)) return label;
  }
  return profile?.goalLabel || "ton objectif";
}

function firstSessionHint(plan) {
  const s = plan?.weeks?.[0]?.sessions?.[0];
  if (!s) return null;
  const parts = [s.title || s.type].filter(Boolean);
  if (s.distance) parts.push(`${s.distance} m`);
  return parts.join(" · ");
}

function phaseFocus(plan) {
  const focuses = (plan?.weeks || [])
    .map((w) => w.focus)
    .filter(Boolean);
  if (!focuses.length) return null;
  const mid = focuses[Math.min(Math.floor(focuses.length / 2), focuses.length - 1)];
  const last = focuses[focuses.length - 1];
  if (mid && last && mid !== last) return `Construction → ${last}`;
  return mid || last;
}

/**
 * 3 insights max pour le sheet post-génération (pré-checkout).
 */
export function buildPlanReadyInsights(plan, profile) {
  const insights = [];
  const weeks = plan?.totalRealWeeks || plan?.weeks?.length || 0;
  const freq = profile?.sessionsPerWeek || 0;
  const isLoop = !!plan?.isSessionLoop || !!plan?.isProgression;
  const goal = goalLabel(profile);

  if (!isLoop && weeks > 0) {
    insights.push({
      id: "horizon",
      text: `${weeks} semaines construites jusqu’à ${goal}`,
    });
  } else if (isLoop) {
    insights.push({
      id: "loop",
      text: `Boucle « Nager & progresser » calibrée sur ${goal}`,
    });
  }

  if (freq > 0) {
    insights.push({
      id: "freq",
      text: `${freq}× / semaine adaptées à ton niveau${profile?.level ? ` (${profile.level})` : ""}`,
    });
  }

  const phase = phaseFocus(plan);
  if (phase) {
    insights.push({
      id: "phase",
      text: `Progression planifiée : ${phase}`,
    });
  }

  const first = firstSessionHint(plan);
  if (first && insights.length < 3) {
    insights.push({
      id: "first",
      text: `1ʳᵉ séance prête : ${first}`,
    });
  }

  if (profile?.pace100 && insights.length < 3) {
    insights.push({
      id: "pace",
      text: "Allures cibles calculées à la seconde (T100)",
    });
  }

  return insights.slice(0, 3);
}

/**
 * Copy paywall selon le contexte produit.
 */
export function getUpgradeCopy(softContext, { weeks = 0, trialEligible = true } = {}) {
  switch (softContext) {
    case "after_first_session":
      return {
        headline: "Belle première séance.",
        subtitle: "Le coach peut déjà adapter la suite. Abonne-toi pour garder ton plan vivant : 9,99 €/mois sans engagement, ou 4,99 €/mois sur 12 mois.",
      };
    case "buddies":
      return {
        headline: "Binômes réservés aux abonnés",
        subtitle: "Trouve un nageur près de chez toi. L’essai Premium n’ouvre pas le matching — un abonnement actif oui.",
      };
    case "trial_required":
      return {
        headline: weeks > 4
          ? `Ton plan ${weeks} semaines t’attend`
          : "Ton plan est prêt — active ton coach",
        subtitle: "7 jours offerts sans carte à l’inscription. Ensuite les séances se mettent en pause jusqu’à l’abonnement.",
      };
    case "trial_expired":
      return {
        headline: "Ton essai est fini — le coach est en pause",
        subtitle: "Reprends tes séances et l’adaptation : 9,99€/mois sans engagement, 4,99€/mois sur 12 mois, ou 52,99€/an.",
      };
    case "session_locked":
      return {
        headline: "Cette séance est verrouillée",
        subtitle: "Abonne-toi pour voir les blocs, les consignes et cocher ta séance du jour.",
      };
    case "feedback_adjust":
      return {
        headline: "Ton ressenti peut ajuster le plan",
        subtitle: "Volume et intensité des prochaines séances : Premium uniquement.",
      };
    case "analysis":
      return {
        headline: "Ta progression T100 est là",
        subtitle: "Courbe d’allures et projection — débloque avec Premium.",
      };
    default:
      return {
        headline: "MySWYM Premium",
        subtitle: trialEligible
          ? "7 jours offerts sans carte à l’inscription, puis 9,99€/mois sans engagement ou 4,99€/mois sur 12 mois. Après l’essai, tes séances se mettent en pause."
          : "Continue à 9,99€/mois sans engagement, 4,99€/mois sur 12 mois, ou 52,99€/an.",
      };
  }
}
