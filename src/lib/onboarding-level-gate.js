/**
 * Débutant (régulier) : pas d’Olympique / Half / Full ni OW moyenne / longue.
 */
import { canonicalizeGoal } from "./sports-engine/race-event.js";

const BEGINNER_BLOCKED_GOALS = new Set([
  "triathlon_olympic",
  "triathlon_half",
  "triathlon_ironman",
  "open_water_mid",
  "open_water_long",
]);

export function isBeginnerBlockedForGoal(goal) {
  return BEGINNER_BLOCKED_GOALS.has(canonicalizeGoal(goal));
}

export function isBeginnerLevelId(level) {
  const l = String(level || "");
  return l === "régulier" || l === "regulier" || l === "beginner" || l === "découverte" || l === "decouverte";
}

/** Débutant onboarding (`régulier`) : pas de question 4 nages, crawl seulement. */
export function isDebutantLevelId(level) {
  const l = String(level || "");
  return l === "régulier" || l === "regulier" || l === "beginner";
}

/** Avancé (`performance`) : 4 nages implicite, pas de question. */
export function isAvanceLevelId(level) {
  const l = String(level || "").toLowerCase();
  return l === "performance" || l === "advanced";
}

/** Style imposé par le niveau, ou `null` si le nageur choisit (Intermédiaire). */
export function impliedSwimStyleForLevel(level) {
  if (isDebutantLevelId(level)) return "crawl";
  if (isAvanceLevelId(level)) return "4_nages";
  return null;
}
