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

/**
 * Avancé (`performance`). Règle coach (5 oct. 2026) : le 4 nages vient de ce que le
 * nageur déclare. Choisir Avancé (« Je maîtrise les 4 nages ») le déclare par défaut,
 * mais il peut répondre Non dans Paramètres → le moteur suit swimStyle, pas le niveau.
 */
export function isAvanceLevelId(level) {
  const l = String(level || "").toLowerCase();
  return l === "performance" || l === "advanced";
}

/**
 * Style par défaut au choix du niveau : Débutant = crawl (imposé),
 * Avancé = 4 nages (déclaré par la case « Je maîtrise les 4 nages », modifiable
 * dans Paramètres), Intermédiaire = `null` (le nageur choisit).
 */
export function impliedSwimStyleForLevel(level) {
  if (isDebutantLevelId(level)) return "crawl";
  if (isAvanceLevelId(level)) return "4_nages";
  return null;
}
