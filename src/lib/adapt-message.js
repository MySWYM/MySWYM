/**
 * Message coach lisible après adaptation volume / feedback.
 * @param {{ volumeAdj?: number, _lastAdapt?: string } | null} plan
 * @returns {string | null}
 */
export function formatCoachAdaptLine(plan) {
  if (!plan) return null;
  const adj = Number(plan.volumeAdj);
  const last = plan._lastAdapt || null;
  if (Number.isFinite(adj) && adj < 0.97) {
    const pct = Math.round((1 - adj) * 100);
    return `Semaine prochaine : volume allégé (−${pct} %).`;
  }
  if (Number.isFinite(adj) && adj > 1.03) {
    const pct = Math.round((adj - 1) * 100);
    return `Semaine prochaine : volume un peu relevé (+${pct} %).`;
  }
  if (last && /hold|maintain|observe/i.test(String(last))) {
    return "Retour pris en compte, on maintient le cap.";
  }
  if (last) {
    return "Retour pris en compte, prochaines séances adaptées.";
  }
  return null;
}

/**
 * Toast court après feedback séance.
 */
export function formatFeedbackToast({ isPremium, legacyRating, hasPain, tasteDriven, plan }) {
  if (hasPain) {
    return "Retour noté. En cas de douleur inhabituelle, ne force pas, on allège la suite.";
  }
  if (!isPremium) {
    return "Retour enregistré. Premium ajuste volume et style des prochaines séances.";
  }
  const adapt = formatCoachAdaptLine(plan);
  if (adapt) return adapt;
  if (legacyRating === "easy") return "Trop facile noté, on pourra monter un peu la charge.";
  if (legacyRating === "hard") return "Trop dur noté, on allège un peu la suite.";
  if (tasteDriven) return "Prochaines séances adaptées à tes goûts.";
  return "Retour enregistré, merci.";
}
