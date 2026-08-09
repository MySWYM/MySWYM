/**
 * Contrats du moteur sportif V1.
 * Voir docs/sports-engine-v1.md
 */

/** @typedef {'decouverte'|'regulier'|'sportif'|'performance'} UiLevel */
/** @typedef {'nager_progresser'|'reprendre'|'course_piscine'|'eau_libre'|'triathlon'|'diplome'|'autre'} ObjectifV1 */
/** @typedef {'aisance'|'technique'|'endurance'|'aerobie'|'seuil'|'vitesse'|'recuperation'|'eau_libre'|'specifique'|'test'} SessionFamily */
/** @typedef {'base'|'development'|'peak'|'taper'|'competition'|'test'|'bilan'} PlanPhase */
/** @typedef {'volume'|'effort_duration'|'density'|'intensity'|'specificity'|'complexity'} ProgressionLever */
/** @typedef {'PROGRESSER'|'MAINTENIR'|'AJUSTER'|'RECUPERER'} AdaptAction */
/** @typedef {'planche'|'pull'|'palmes'|'tuba'|'plaquettes'} EquipmentId */

import { normalizeStrokeFocus } from "./stroke-focus.js";
import { normalizeRaceTarget } from "./race-target.js";

export const OBJECTIF_V1 = {
  NAGER_PROGRESSER: "nager_progresser",
  REPRENDRE: "reprendre",
  COURSE_PISCINE: "course_piscine",
  EAU_LIBRE: "eau_libre",
  TRIATHLON: "triathlon",
  DIPLOME: "diplome",
  AUTRE: "autre",
};

export const SESSION_FAMILIES = [
  "aisance",
  "technique",
  "endurance",
  "aerobie",
  "seuil",
  "vitesse",
  "recuperation",
  "eau_libre",
  "specifique",
  "test",
];

export const EQUIPMENT_IDS = ["planche", "pull", "palmes", "tuba", "plaquettes", "elastique"];

/** Labels UI (IDs stables moteur). */
export const EQUIPMENT_LABELS = {
  planche: "Planche",
  pull: "Pull-buoy",
  palmes: "Palmes",
  tuba: "Tuba frontal",
  plaquettes: "Plaquettes",
  elastique: "Élastique",
};

/** Normalise une liste onboarding → IDs connus (jamais null après réponse). */
export function normalizeProfileEquipment(equipment) {
  if (!Array.isArray(equipment)) return null; // inconnu (legacy)
  return equipment
    .map((e) => {
      const s = String(e || "").toLowerCase().trim();
      if (s === "pullbuoy" || s === "pull-buoy" || s === "pull buoy") return "pull";
      if (s === "élastique" || s === "elastique" || s === "elastic") return "elastique";
      if (s === "snorkel" || s === "tuba frontal") return "tuba";
      if (s === "fins" || s === "palme") return "palmes";
      return s;
    })
    .filter((e) => EQUIPMENT_IDS.includes(e));
}

/** Mapping goal/category onboarding → objectif V1 */
export function mapGoalToObjectifV1(profile = {}) {
  const goal = profile.goal || "";
  const category = profile.category || "";
  // Objectifs explicites d'abord (reprendre ≠ nager_progresser même si category=progression)
  if (goal === "reprendre") return OBJECTIF_V1.REPRENDRE;
  if (goal === "perte_de_poids") return OBJECTIF_V1.REPRENDRE;
  if (goal === "competition_maitre" || goal === "course_piscine") return OBJECTIF_V1.COURSE_PISCINE;
  if (goal.startsWith("open_water") || goal.startsWith("eau_libre") || category === "open_water") {
    return OBJECTIF_V1.EAU_LIBRE;
  }
  if (category === "triathlon" || goal.startsWith("triathlon")) return OBJECTIF_V1.TRIATHLON;
  if (["bnssa", "bpjeps_aan", "tests_pompiers", "caepmns"].includes(goal)) return OBJECTIF_V1.DIPLOME;
  if (category === "progression" || goal === "progression" || profile.isSessionLoop) {
    return OBJECTIF_V1.NAGER_PROGRESSER;
  }
  return OBJECTIF_V1.AUTRE;
}

/** Objectif V1 → pool contenu générateur (eau_libre | mixte | endurance) */
export function objectifV1ToProfilObj(objectifV1) {
  if (objectifV1 === OBJECTIF_V1.EAU_LIBRE) return "eau_libre";
  if (
    objectifV1 === OBJECTIF_V1.TRIATHLON ||
    objectifV1 === OBJECTIF_V1.COURSE_PISCINE ||
    objectifV1 === OBJECTIF_V1.REPRENDRE
  ) {
    return "mixte";
  }
  return "endurance";
}

export function normalizeUiLevel(level) {
  if (
    level === "découverte" ||
    level === "decouverte" ||
    level === "beginner" ||
    level === "débutant" ||
    level === "debutant"
  ) {
    return "decouverte";
  }
  if (level === "régulier" || level === "regulier" || level === "intermédiaire") return "regulier";
  if (level === "sportif" || level === "intermediate") return "sportif";
  if (level === "performance" || level === "advanced") return "performance";
  return "regulier";
}

/**
 * Construit un SportProfile normalisé (sans side-effects).
 * @param {object} profile — profil App.jsx
 * @param {object} [opts]
 * @param {number} [opts.weeksAvailable]
 * @param {object} [opts.capacity]
 */
export function buildSportProfile(profile = {}, opts = {}) {
  const uiLevel = normalizeUiLevel(profile.level);
  const objectifV1 = mapGoalToObjectifV1(profile);
  const equipmentRaw = Array.isArray(profile.equipment)
    ? profile.equipment.filter((e) => EQUIPMENT_IDS.includes(e) || ["pullbuoy", "pull-buoy", "élastique", "elastique", "fins", "snorkel"].includes(String(e).toLowerCase()))
    : null;
  const equipment = equipmentRaw == null
    ? null
    : normalizeProfileEquipment(equipmentRaw) || [];
  const strokeFocus = normalizeStrokeFocus(profile, objectifV1);

  return {
    level: uiLevel,
    levelRaw: profile.level || "",
    category: profile.category || "",
    goal: profile.goal || "",
    objectifV1,
    profilObj: objectifV1ToProfilObj(objectifV1),
    pool: profile.pool === 25 ? 25 : 50,
    sessionsPerWeek: Math.min(5, Math.max(1, Number(profile.sessionsPerWeek) || 3)),
    weeksAvailable: opts.weeksAvailable ?? null,
    equipment,
    equipmentUnknown: equipment == null,
    pace100: profile.pace100 > 0 ? profile.pace100 : null,
    volumeAdj: Math.min(1.3, Math.max(0.7, Number(profile.volumeAdj) || 1)),
    injuryStatus: profile.injuryStatus || null,
    injuryNote: profile.injuryNote || "",
    hasPainConstraint: profile.injuryStatus === "oui" || profile.painFlag === true,
    swimStyle: profile.swimStyle || null,
    preferredStroke: profile.preferredStroke || null,
    strokeFocus,
    papillonMastered:
      profile.papillonMastered === true ||
      (Array.isArray(profile.strokesMastered) && profile.strokesMastered.includes("papillon")),
    strokesMastered: Array.isArray(profile.strokesMastered) ? profile.strokesMastered : null,
    taste: profile.taste || null,
    /** Disponibilité actuelle (questionnaire) — null = ancien profil / non renseigné */
    readinessProfile: profile.readinessProfile || null,
    capacity: opts.capacity || null,
    confidence: opts.capacity?.confidence ?? 0.2,
    // Course piscine — cible explicite uniquement (jamais inventée)
    raceTarget:
      normalizeRaceTarget(profile.raceTarget) ||
      normalizeRaceTarget(
        profile.raceDistance && (profile.raceTargetTimeSec || profile.raceTargetTime)
          ? {
              distance: profile.raceDistance,
              targetTimeSec: profile.raceTargetTimeSec || profile.raceTargetTime,
              stroke: profile.raceStroke || strokeFocus,
              competitionDate: profile.competitionDate || null,
              source: "user",
            }
          : null,
      ),
    recentBest: profile.recentBest || profile.recentBests || null,
    raceSplits: profile.raceSplits || profile.splits || null,
  };
}

/** Debug §40 — pourquoi cette séance */
export function explainSessionWhy(ctx = {}) {
  const parts = [
    ctx.objectifV1 && `objectif=${ctx.objectifV1}`,
    ctx.phase && `phase=${ctx.phase}`,
    ctx.family && `famille=${ctx.family}`,
    ctx.intent && `intent=${ctx.intent}`,
    ctx.volumeTarget && `volume≈${ctx.volumeTarget}m`,
    ctx.lever && `levier=${ctx.lever}`,
    ctx.adapt && `adapt=${ctx.adapt}`,
  ].filter(Boolean);
  return parts.join(" · ") || "séance par défaut moteur V1";
}
