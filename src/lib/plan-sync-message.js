/**
 * Copy toast quand un re-sync visibility applique réellement un merge remote.
 * Pas de PII — uniquement des signaux structurels (progression, nb plans, freq).
 */
import { planProgressScore } from "./plan-progress-merge.js";

export function summarizePlans(plans = []) {
  const list = Array.isArray(plans) ? plans : [];
  return {
    count: list.length,
    progress: list.reduce((s, e) => s + planProgressScore(e), 0),
    freqs: list
      .map((e) => Number(e?.profile?.sessionsPerWeek) || 0)
      .filter(Boolean)
      .sort((a, b) => a - b)
      .join(","),
  };
}

/**
 * @returns {{ message: string, reason: string } | null}
 * null = pas de changement utile à signaler (ne devrait pas arriver si on toast après apply).
 */
export function describePlanSyncChange({
  beforePlans = [],
  afterPlans = [],
  beforeActiveId = null,
  afterActiveId = null,
} = {}) {
  const before = summarizePlans(beforePlans);
  const after = summarizePlans(afterPlans);

  if (after.progress > before.progress) {
    return {
      reason: "progress_up",
      message: "Séances mises à jour depuis un autre appareil.",
    };
  }
  if (before.progress > after.progress) {
    // Garde devrait bloquer — message de repli si ça passe quand même
    return {
      reason: "progress_down",
      message: "Programme synchronisé.",
    };
  }
  if (beforeActiveId && afterActiveId && beforeActiveId !== afterActiveId) {
    return {
      reason: "active_plan",
      message: "Plan actif synchronisé.",
    };
  }
  if (before.count !== after.count) {
    return {
      reason: "plan_count",
      message: after.count > before.count
        ? "Nouveau plan synchronisé sur ce compte."
        : "Tes plans ont été synchronisés.",
    };
  }
  if (before.freqs && after.freqs && before.freqs !== after.freqs) {
    return {
      reason: "frequency",
      message: "Fréquence d’entraînement synchronisée.",
    };
  }
  return {
    reason: "generic",
    message: "Programme synchronisé.",
  };
}
