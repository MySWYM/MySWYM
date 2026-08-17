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
        headline: "Ton coach a noté la séance",
        subtitle: "Abonne-toi pour que le plan s’adapte vraiment à toi — 4,99€/mois sans engagement.",
      };
    case "trial_required":
      return {
        headline: weeks > 4
          ? `Ton plan ${weeks} semaines est prêt`
          : "Ton plan personnalisé est prêt",
        subtitle: "7 jours offerts sans carte à l’inscription. Ensuite l’app se gèle — abonne-toi pour continuer.",
      };
    case "trial_expired":
      return {
        headline: "L’app est gelée",
        subtitle: "Ton essai de 7 jours est terminé. Abonne-toi à 4,99€/mois sans engagement, ou choisis l’annuel, pour tout revoir.",
      };
    case "session_locked":
      return {
        headline: "La séance n’est plus visible",
        subtitle: "Abonne-toi pour voir les blocs, les consignes et cocher ta séance.",
      };
    case "feedback_adjust":
      return {
        headline: "Ajustement coach disponible",
        subtitle: "Volume et intensité des prochaines séances peuvent bouger selon ton ressenti — Premium uniquement.",
      };
    case "analysis":
      return {
        headline: "Projection de progression disponible",
        subtitle: "Courbe d’allures et estimation vers ton objectif — débloque avec Premium.",
      };
    default:
      return {
        headline: "MySWYM Premium",
        subtitle: trialEligible
          ? "7 jours offerts sans carte à l’inscription, puis 4,99€/mois. Après l’essai, l’app se gèle."
          : "Continue à 4,99€/mois sans engagement, ou choisis l’annuel.",
      };
  }
}
