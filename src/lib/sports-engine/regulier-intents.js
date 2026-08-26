/**
 * Intentions Gold Régulier — références sportives (pas de séances hardcodées).
 * Philosophie : « apprendre à s'entraîner » (vs Découverte = aisance).
 */

import { scaleMaxContinuousForRaceBand } from "./race-event.js";

export function maxContinuousForRegulier(brief = {}) {
  const known = Number(brief.maxContinuousDistance) || 0;
  const confidence = Number(brief.capacity?.confidence) || 0;
  const score = Number(brief.capacity?.score) || 0;
  // Régulier : enchaîne mieux — défaut 200 m continu OK
  let max = 200;
  if (known >= 400 && confidence >= 0.4) max = Math.min(400, Math.round((known * 0.8) / 50) * 50);
  else if (known >= 200) max = 200;
  else if (score >= 0.55 && confidence >= 0.4) max = 300;
  if (brief.objectif === "reprendre" || brief.sessionIntent === "reprise") {
    max = Math.min(max, 100);
  }
  return Math.max(100, scaleMaxContinuousForRaceBand(max, brief));
}

export const REGULIER_INTENTS = Object.freeze({
  technique_endurance: {
    id: "technique_endurance",
    headline: "Aujourd'hui : technique puis endurance",
    learnCue: "conserve le mouvement travaillé",
    applyCue: "garde la sensation sur toute la série",
    techPrimary: "rattrape",
    quality: false,
    volumeHint: [1400, 2000],
  },
  endurance: {
    id: "endurance",
    headline: "Aujourd'hui : construire l'endurance",
    learnCue: "nage appliquée, rythme régulier",
    applyCue: "allure confortable et constante",
    techPrimary: "respiration",
    quality: false,
    volumeHint: [1500, 2000],
  },
  allure_progressive: {
    id: "allure_progressive",
    headline: "Aujourd'hui : gérer ton allure",
    learnCue: "passage facile → modéré",
    applyCue: "monte progressivement sans forcer trop tôt",
    techPrimary: "rattrape",
    quality: true,
    volumeHint: [1600, 1900],
  },
  qualite: {
    id: "qualite",
    headline: "Aujourd'hui : séance un peu plus soutenue",
    learnCue: "qualité de nage avant la vitesse",
    applyCue: "1–4 modéré, 5–8 un peu plus soutenu",
    techPrimary: "rattrape",
    quality: true,
    volumeHint: [1500, 1900],
  },
  eau_libre: {
    id: "eau_libre",
    headline: "Aujourd'hui : endurance + orientation",
    learnCue: "respiration + visée contrôlée",
    applyCue: "lève brièvement la tête puis reprends",
    techPrimary: "respiration",
    quality: false,
    volumeHint: [1600, 2100],
  },
  triathlon: {
    id: "triathlon",
    headline: "Aujourd'hui : nager efficacement sans gaspiller",
    learnCue: "respiration régulière",
    applyCue: "crawl régulier, économie d'énergie",
    techPrimary: "respiration",
    quality: false,
    volumeHint: [1700, 2100],
  },
  quatre_nages: {
    id: "quatre_nages",
    headline: "Aujourd'hui : progresser sur plusieurs nages",
    learnCue: "une nage propre par longueur",
    applyCue: "alterne les nages maîtrisées",
    techPrimary: "4n",
    quality: false,
    volumeHint: [1500, 2000],
  },
  recuperation: {
    id: "recuperation",
    headline: "Aujourd'hui : récupérer en nageant",
    learnCue: "mouvements souples",
    applyCue: "très facile, aucune recherche de perf",
    techPrimary: "nage",
    quality: false,
    volumeHint: [1200, 1600],
  },
  seance_courte: {
    id: "seance_courte",
    headline: "Aujourd'hui : séance courte et structurée",
    learnCue: "éducatif court",
    applyCue: "séries nettes, sans forcer le volume",
    techPrimary: "rattrape",
    quality: false,
    volumeHint: [1000, 1300],
  },
  reprise: {
    id: "reprise",
    headline: "Aujourd'hui : retrouver les sensations",
    learnCue: "simplement nager proprement",
    applyCue: "volume réduit, écoute ton corps",
    techPrimary: "nage",
    quality: false,
    volumeHint: [1000, 1500],
  },
});

/**
 * Résout l'intention Régulier (une contrainte principale).
 * qualitySession du rôle hebdo prime pour la séance B.
 */
export function resolveRegulierIntent(brief = {}) {
  if (brief.sessionIntent && REGULIER_INTENTS[brief.sessionIntent]) {
    return REGULIER_INTENTS[brief.sessionIntent];
  }
  const roleObj = String(brief.roleObjectif || brief.objectif || "").toLowerCase();
  if (brief.qualitySession) return REGULIER_INTENTS.qualite;
  if (roleObj.includes("reprendre") || brief.objectif === "reprendre") {
    return REGULIER_INTENTS.reprise;
  }
  if (roleObj.includes("triathlon") || brief.objectif === "triathlon") {
    return REGULIER_INTENTS.triathlon;
  }
  if (roleObj.includes("eau_libre") || brief.objectif === "eau_libre" || brief.family === "eau_libre") {
    return REGULIER_INTENTS.eau_libre;
  }
  if (
    roleObj.includes("course") ||
    roleObj.includes("compet") ||
    roleObj.includes("compét") ||
    brief.objectif === "course_piscine"
  ) {
    return REGULIER_INTENTS.allure_progressive;
  }
  if (brief.strokeFocus === "4n") return REGULIER_INTENTS.quatre_nages;
  if (Number(brief.durationTarget) <= 30) return REGULIER_INTENTS.seance_courte;
  if (brief.family === "recuperation" || brief.intent === "recuperation") {
    return REGULIER_INTENTS.recuperation;
  }
  if (brief.family === "technique" || brief.intent === "technique_endurance") {
    return REGULIER_INTENTS.technique_endurance;
  }
  if (brief.family === "seuil" || brief.intent === "allure_progressive") {
    return REGULIER_INTENTS.allure_progressive;
  }
  return REGULIER_INTENTS.endurance;
}

/**
 * Volume cohérent Régulier — peut baisser vs moteur, jamais gonfler.
 */
export function coherentVolumeForRegulier(brief = {}) {
  const engine = Math.max(800, Number(brief.volumeTarget) || 1600);
  const duration = Math.max(25, Number(brief.durationTarget) || 45);
  const intent = resolveRegulierIntent(brief);
  const [hintLo, hintHi] = intent.volumeHint || [1400, 2000];

  let durationCap = 2000;
  if (duration <= 30) durationCap = 1300;
  else if (duration <= 45) durationCap = 2000;
  else if (duration <= 60) durationCap = 2500;
  else durationCap = 2800;

  if (intent.id === "reprise" || intent.id === "recuperation") {
    durationCap = Math.min(durationCap, hintHi);
  }

  const coherent = Math.min(engine, durationCap, hintHi);
  // hintLo ne doit pas remonter au-dessus du plafond durée
  const floor = Math.min(hintLo, durationCap, engine);
  const floored = Math.max(floor, Math.min(coherent, engine));
  // Séance courte : plancher plus bas
  const minVol = duration <= 30 ? 900 : 1000;
  return Math.min(engine, Math.max(minVol, Math.round(floored / 50) * 50));
}

/** Gold Régulier — métadonnées de référence (pas de séances figées). */
export const REGULIER_GOLD_SCENARIOS = Object.freeze([
  { id: "RG1", intent: "endurance", strokeFocus: "crawl", duration: 45, volumeBand: [1500, 2000] },
  { id: "RG2", intent: "allure_progressive", strokeFocus: "crawl", duration: 45, volumeBand: [1600, 1900], qualitySession: true },
  { id: "RG3", intent: "eau_libre", strokeFocus: "crawl", duration: 45, volumeBand: [1600, 2100], objectif: "eau_libre" },
  { id: "RG4", intent: "triathlon", strokeFocus: "crawl", duration: 60, volumeBand: [1700, 2200], objectif: "triathlon" },
  { id: "RG5", intent: "quatre_nages", strokeFocus: "4n", duration: 45, volumeBand: [1500, 2000], papillonMastered: false },
  { id: "RG6", intent: "qualite", strokeFocus: "crawl", duration: 45, volumeBand: [1500, 1900], qualitySession: true },
  { id: "RG7", intent: "recuperation", strokeFocus: "mixte", duration: 40, volumeBand: [1200, 1600] },
  { id: "RG8", intent: "seance_courte", strokeFocus: "crawl", duration: 30, volumeBand: [1000, 1300] },
  { id: "RG9", intent: "endurance", strokeFocus: "crawl", duration: 60, volumeBand: [2000, 2500] },
  { id: "RG10", intent: "reprise", strokeFocus: "mixte", duration: 40, volumeBand: [1000, 1500], objectif: "reprendre" },
]);
