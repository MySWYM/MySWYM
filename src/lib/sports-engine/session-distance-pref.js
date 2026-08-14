/**
 * Préférence distance moyenne / séance (questionnaire).
 * Ancre le volume des séances sans second moteur.
 */

export const SESSION_DISTANCE_PRESETS = [
  1000, 1250, 1500, 1750, 2000, 2250, 2500, 2750, 3000, 3500, 4000, 4500, 5000, 5500, 6000,
];

/** Bornes soft par niveau — évite des volumes absurdes (découverte ≠ 6 km). */
const LEVEL_BANDS = {
  decouverte: { min: 1000, max: 1500, def: 1000 },
  regulier: { min: 1000, max: 3500, def: 2000 },
  sportif: { min: 1500, max: 5000, def: 2500 },
  performance: { min: 2000, max: 6000, def: 3000 },
};

export function formatSessionDistanceLabel(meters) {
  const n = Math.round(Number(meters) || 0);
  if (!n) return "—";
  return `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f")} m`;
}

export function defaultSessionDistanceForLevel(level) {
  const band = LEVEL_BANDS[level] || LEVEL_BANDS.regulier;
  return band.def;
}

export function nearestSessionDistancePreset(meters) {
  const n = Number(meters);
  if (!Number.isFinite(n) || n <= 0) return null;
  let best = SESSION_DISTANCE_PRESETS[0];
  let bestDiff = Math.abs(best - n);
  for (const p of SESSION_DISTANCE_PRESETS) {
    const d = Math.abs(p - n);
    if (d < bestDiff) {
      best = p;
      bestDiff = d;
    }
  }
  return best;
}

/**
 * Normalise la préférence questionnaire.
 * @returns {number|null} null = legacy / non renseigné
 */
export function normalizeTargetSessionDistance(raw, level = "regulier") {
  if (raw == null || raw === "") return null;
  const n = typeof raw === "number" ? raw : parseInt(String(raw).replace(/\s/g, ""), 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  const band = LEVEL_BANDS[level] || LEVEL_BANDS.regulier;
  const clamped = Math.min(band.max, Math.max(band.min, n));
  return nearestSessionDistancePreset(clamped) || Math.round(clamped / 50) * 50;
}

/**
 * Multiplicateur selon type de semaine / phase (autour de l'ancre préférée).
 */
export function sessionDistancePhaseScale({ typeSemaine, effectivePhase, effectiveTaperStage } = {}) {
  if (effectiveTaperStage === "race_day" || effectivePhase === "race") return 0;
  if (
    typeSemaine === "allegee" ||
    effectivePhase === "taper" ||
    effectivePhase === "bilan" ||
    (effectiveTaperStage && ["s1", "s2", "s3", "race_week"].includes(effectiveTaperStage))
  ) {
    return 0.88;
  }
  if (typeSemaine === "test") return 0.95;
  if (typeSemaine === "reference") return 0.92;
  return 1;
}

/**
 * Recentre sessionTargets autour de la distance préférée (poids relatifs conservés).
 * @returns {{ sessionTargets: number[], weekTarget: number, applied: boolean, anchor: number }}
 */
export function applyTargetSessionDistanceToTargets(
  sessionTargets = [],
  targetSessionDistance,
  {
    level = "regulier",
    typeSemaine = "normale",
    effectivePhase = "development",
    effectiveTaperStage = null,
  } = {},
) {
  const preferred = normalizeTargetSessionDistance(targetSessionDistance, level);
  if (!preferred || !Array.isArray(sessionTargets) || sessionTargets.length === 0) {
    return {
      sessionTargets,
      weekTarget: sessionTargets.reduce((a, b) => a + (Number(b) || 0), 0),
      applied: false,
      anchor: null,
    };
  }

  const scale = sessionDistancePhaseScale({ typeSemaine, effectivePhase, effectiveTaperStage });
  if (scale <= 0) {
    return {
      sessionTargets: sessionTargets.map(() => 0),
      weekTarget: 0,
      applied: true,
      anchor: 0,
    };
  }

  const anchor = Math.max(400, Math.round((preferred * scale) / 50) * 50);
  const weights = sessionTargets.map((t, i) => {
    const n = Number(t);
    if (Number.isFinite(n) && n > 0) return n;
    return i === Math.min(1, sessionTargets.length - 1) ? 1.15 : 1;
  });
  const sumW = weights.reduce((a, b) => a + b, 0) || sessionTargets.length;
  const meanW = sumW / weights.length;
  const next = weights.map((w) => Math.max(400, Math.round((anchor * (w / meanW)) / 50) * 50));
  const weekTarget = next.reduce((a, b) => a + b, 0);

  return { sessionTargets: next, weekTarget, applied: true, anchor };
}
