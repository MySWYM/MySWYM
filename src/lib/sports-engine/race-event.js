/**
 * Épreuve choisie (UI) → bande d'entraînement (moteur).
 * Les IDs fins (Sprint, 5 km…) restent stockés / migrés ; le composeur lit 3 bandes.
 */

export const EVENT_BANDS = Object.freeze(["short", "mid", "long"]);

const OW_LEGACY_TO_CANONICAL = {
  open_water_500: "open_water_short",
  open_water_1k: "open_water_short",
  open_water_1500: "open_water_short",
  open_water_2k: "open_water_mid",
  open_water_2_5k: "open_water_mid",
  open_water_3k: "open_water_mid",
  open_water_5k: "open_water_mid",
  open_water_7_5k: "open_water_long",
  open_water_10k: "open_water_long",
  open_water_25k: "open_water_long",
};

const GOAL_TO_BAND = {
  triathlon_xs: "short",
  triathlon_sprint: "short",
  triathlon_olympic: "mid",
  triathlon_half: "long",
  triathlon_ironman: "long",
  open_water_short: "short",
  open_water_mid: "mid",
  open_water_long: "long",
};

/** Repère mètres nage (ancre, pas un volume de séance). */
const GOAL_TO_METERS = {
  triathlon_xs: 400,
  triathlon_sprint: 750,
  triathlon_olympic: 1500,
  triathlon_half: 1900,
  triathlon_ironman: 3800,
  open_water_short: 1500,
  open_water_mid: 3500,
  open_water_long: 10000,
};

export function canonicalizeGoal(goal) {
  const g = String(goal || "");
  return OW_LEGACY_TO_CANONICAL[g] || g;
}

export function eventBandFromGoal(goal) {
  return GOAL_TO_BAND[canonicalizeGoal(goal)] || null;
}

export function raceSwimMetersFromGoal(goal) {
  const n = GOAL_TO_METERS[canonicalizeGoal(goal)];
  return Number.isFinite(n) ? n : null;
}

/**
 * Plafond de nage continue : courte un peu plus fractionnée, longue un peu plus continue.
 * Découverte / reprise / vitesse : inchangé (sécurité et format qualité).
 */
export function scaleMaxContinuousForRaceBand(max, brief = {}) {
  const base = Number(max) || 0;
  if (!base || brief.level === "decouverte") return base;
  if (brief.objectif === "reprendre" || brief.sessionIntent === "reprise") return base;
  if (brief.sessionIntent === "vitesse" || brief.sessionIntent === "vo2") return base;
  const band = brief.raceBand || eventBandFromGoal(brief.goal);
  if (band === "short") return Math.max(50, Math.round((base * 0.8) / 50) * 50);
  if (band === "long") return Math.round((base * 1.25) / 50) * 50;
  return base;
}
