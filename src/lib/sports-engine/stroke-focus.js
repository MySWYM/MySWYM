/**
 * Stroke focus, distinct de l'objectif (eau libre ≠ crawl).
 * UX simple → valeur moteur interne. Compatible futurs niveaux.
 *
 * swimStyle=4_nages : l'utilisateur nage les 4 nages → strokeFocus=4n.
 * Débutant : toujours crawl. Avancé : toujours 4 nages. Plus de nage favorite.
 */

import { isFourNagesDeclared, isFourNagesStyle } from "./four-nages-mix.js";
import { isDebutantLevelId } from "../onboarding-level-gate.js";

/** @typedef {'crawl'|'dos'|'brasse'|'papillon'|'4n'|'mixte'} StrokeFocus */

export const STROKE_FOCUS_IDS = Object.freeze([
  "crawl",
  "dos",
  "brasse",
  "papillon",
  "4n",
  "mixte",
]);

/** Options UX (onboarding futur) → strokeFocus interne */
export const STROKE_UX_TO_FOCUS = Object.freeze({
  crawl_mainly: "crawl",
  crawl: "crawl",
  plusieurs: "mixte",
  mixte: "mixte",
  multi: "mixte",
  "4n": "4n",
  "4_nages": "4n",
  quatre_nages: "4n",
  "4nages": "4n",
  medley: "4n",
  dos: "dos",
  brasse: "brasse",
  papillon: "papillon",
});

/**
 * Normalise le choix de nage depuis le profil.
 * swimStyle=crawl = 100 % crawl.
 * Débutant = crawl (pas de 4 nages). Avancé = 4 nages.
 * Défaut : crawl pour eau libre / triathlon ; mixte sinon.
 */
export function normalizeStrokeFocus(profile = {}, objectifV1 = null) {
  if (isDebutantLevelId(profile.level) || isDebutantLevelId(profile.levelRaw)) return "crawl";

  if (isFourNagesDeclared(profile) || isFourNagesStyle(profile.strokeFocus)) return "4n";

  if (String(profile.swimStyle || "").toLowerCase() === "crawl") return "crawl";

  const raw =
    profile.strokeFocus ||
    profile.strokesPreference ||
    profile.swimStyle ||
    null;

  if (raw && !isFourNagesStyle(raw) && STROKE_UX_TO_FOCUS[raw]) return STROKE_UX_TO_FOCUS[raw];
  if (raw && STROKE_FOCUS_IDS.includes(raw) && raw !== "4n") return raw;

  const obj = objectifV1 || profile.objectifV1;
  if (obj === "eau_libre" || obj === "triathlon") return "crawl";
  return "mixte";
}

/**
 * Papillon : autorisé si maîtrise déclarée, ou si l'utilisateur a coché 4 nages
 * (il a dit savoir nager les quatre nages). Volume papillon toujours fractionné.
 */
export function canUsePapillon(profileOrBrief = {}) {
  if (isFourNagesDeclared(profileOrBrief) || profileOrBrief.strokeFocus === "4n") return true;
  if (profileOrBrief.papillonMastered === true) return true;
  const mastered = profileOrBrief.strokesMastered || profileOrBrief.masteredStrokes;
  if (Array.isArray(mastered) && mastered.includes("papillon")) return true;
  return false;
}

/** Label nage pour consignes Découverte */
export function strokeSwimLabel(strokeFocus, { papillonOk = false } = {}) {
  switch (strokeFocus) {
    case "dos":
      return "dos facile";
    case "brasse":
      return "brasse facile";
    case "papillon":
      return papillonOk ? "papillon facile" : "crawl facile";
    case "4n":
      return "crawl facile";
    case "mixte":
      return "crawl / dos facile";
    case "crawl":
    default:
      return "crawl facile";
  }
}

/** Label départ selon stroke, crawl = 100 % crawl (pas de dos) */
export function strokeDepartLabel(strokeFocus) {
  if (strokeFocus === "dos") return "dos facile";
  if (strokeFocus === "brasse") return "brasse / crawl facile";
  if (strokeFocus === "mixte") return "crawl / dos facile";
  return "crawl facile";
}

/**
 * Nages d'une séance 4 nages : toujours les quatre, papillon inclus
 * (fractionné, jamais remplacé par une ondulation anonyme).
 */
export function strokesForDecouverte4n(_papillonOk) {
  return ["crawl", "dos", "brasse", "papillon"];
}

export function papillonAdaptedLabel() {
  return "ondulation (prépa papillon)";
}
