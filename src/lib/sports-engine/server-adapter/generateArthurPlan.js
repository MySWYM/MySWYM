/**
 * Façade serveur Arthur AI → moteur MySWYM existant.
 *
 * NE CALCULE PAS volume / composer / readiness / périodisation interne.
 * Délègue le contenu des séances à buildCoachPlanWeeks (swim-plan-bridge).
 *
 * Hors scope V1 : objectifs diplôme (BNSSA, BPJEPS, …) qui passent encore
 * par SESSION_TEMPLATES dans App.jsx — refuser clairement.
 */
import {
  buildCoachPlanWeeks,
  shouldUseCoachGenerator,
} from "../../swim-plan-bridge.js";
import { loadSessionTemplates } from "../../session-templates-store.js";
import { normalizeProfileEquipment } from "../types.js";
import { buildPhaseListForProfile, PLAN_TIPS, isProgressionGoal } from "./plan-phases.js";
import {
  mergePreservingProgress,
  countPreservedWeeks,
} from "./preserve-progress.js";

/** Aligné App.jsx PLAN_VERSION — métadonnées uniquement. */
export const ARTHUR_PLAN_VERSION = 47;

const DIPLOMA_GOALS = new Set(["bnssa", "bpjeps_aan", "tests_pompiers", "caepmns"]);

const ALLOWED_LEVELS = new Set([
  "découverte",
  "beginner",
  "débutant",
  "debutant",
  "régulier",
  "sportif",
  "intermediate",
  "performance",
  "advanced",
]);

/**
 * @param {object} input
 * @param {string} [input.userId]
 * @param {object} [input.profile] — profil MySWYM (sessionsPerWeek, goal, level, …)
 * @param {string} [input.goal]
 * @param {string} [input.targetDate] — ISO date → profile.eventDate
 * @param {number} [input.weeks]
 * @param {number} [input.frequency]
 * @param {boolean} [input.isPremium=true]
 * @param {object|null} [input.existingPlan] — plan à merger (préservation)
 * @param {import('@supabase/supabase-js').SupabaseClient} [input.supabase] — charge session_templates
 * @param {number} [input.referenceTime]
 */
export async function generateArthurPlan(input = {}) {
  const profile = normalizeArthurProfile(input);
  const goal = profile.goal;

  if (isProgressionGoal(goal)) {
    return {
      success: false,
      error: "unsupported_goal",
      message:
        "Le mode « Nager & Progresser » (boucle séances) n’est pas généré via Arthur AI pour l’instant. Utilise l’app MySWYM.",
    };
  }

  if (DIPLOMA_GOALS.has(goal) || !shouldUseCoachGenerator(goal)) {
    return {
      success: false,
      error: "unsupported_goal",
      message:
        "Cet objectif (diplôme / prépa) utilise encore le générateur App dédié. Crée le plan depuis MySWYM.",
    };
  }

  if (input.supabase) {
    try {
      await loadSessionTemplates(input.supabase);
    } catch {
      // Fallback générateur JS si banque indisponible
    }
  }

  const referenceTime = input.referenceTime ?? Date.now();
  const { rawWeeks, phaseList } = buildPhaseListForProfile(
    profile,
    referenceTime,
    input.weeks ?? null,
  );

  const isPremium = input.isPremium !== false;
  const weeks = buildCoachPlanWeeks(profile, phaseList, isPremium, PLAN_TIPS, 5);

  let finalWeeks = weeks;
  let preservedWeeks = 0;
  if (input.existingPlan?.weeks?.length) {
    finalWeeks = mergePreservingProgress(input.existingPlan.weeks, weeks);
    preservedWeeks = countPreservedWeeks(input.existingPlan.weeks, weeks);
  }

  const plan = {
    weeks: finalWeeks,
    previewWeeks: [],
    totalRealWeeks: rawWeeks,
    isPremium,
    isProgression: false,
    isSessionLoop: false,
    startDate: referenceTime,
    planStartDate: profile.planStartDate || new Date(referenceTime).toISOString(),
    version: ARTHUR_PLAN_VERSION,
    volumeAdj: Number(profile.volumeAdj) || 1,
    _engineHistory: profile._engineHistory || null,
    source: "arthur_ai",
  };

  return {
    success: true,
    plan,
    profile,
    weeks_created: finalWeeks.length,
    preserved_weeks: preservedWeeks,
  };
}

export function normalizeArthurProfile(input = {}) {
  const base =
    input.profile && typeof input.profile === "object" ? { ...input.profile } : {};

  if (input.goal) base.goal = String(input.goal);
  if (input.targetDate) base.eventDate = String(input.targetDate);
  if (input.frequency != null) {
    const f = Math.round(Number(input.frequency));
    if (Number.isFinite(f)) base.sessionsPerWeek = Math.min(5, Math.max(1, f));
  }

  // Objectif générique "triathlon" → variante olympique par défaut
  if (base.goal === "triathlon") base.goal = "triathlon_olympic";
  if (base.goal === "eau_libre" || base.goal === "open_water") {
    base.goal = "open_water_1k";
  }

  if (!base.category) {
    const g = String(base.goal || "");
    if (g.startsWith("triathlon")) base.category = "triathlon";
    else if (g.startsWith("open_water") || g.startsWith("eau_libre")) {
      base.category = "open_water";
    } else if (g === "reprendre" || g === "perte_de_poids") {
      base.category = "wellness";
    } else if (g === "competition_maitre") base.category = "competition";
    else base.category = base.category || "triathlon";
  }

  if (!base.level || !ALLOWED_LEVELS.has(base.level)) {
    base.level = base.level || "sportif";
  }

  if (base.level === "découverte" || base.level === "beginner") {
    base.pace100 = null;
  }

  if (!base.sessionsPerWeek) base.sessionsPerWeek = 3;
  base.sessionsPerWeek = Math.min(5, Math.max(1, Number(base.sessionsPerWeek) || 3));

  if (base.pool !== 25 && base.pool !== 50) base.pool = 25;

  if (!Array.isArray(base.equipment)) base.equipment = [];
  else base.equipment = normalizeProfileEquipment(base.equipment) || [];

  if (!base.planStartDate) {
    base.planStartDate = new Date(input.referenceTime || Date.now()).toISOString();
  }

  return base;
}
