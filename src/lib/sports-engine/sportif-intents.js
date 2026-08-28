/**
 * Intentions Gold Sportif — « s'entraîner pour progresser ».
 * Références qualité (pas de séances hardcodées).
 */

import { scaleMaxContinuousForRaceBand } from "./race-event.js";

/**
 * Capacité continue stroke-aware.
 * 500 m 4N continu ≠ 500 m crawl continu.
 * @param {object} brief
 * @param {{ stroke?: string }} [opts] — override nage ("crawl"|"4n"|"dos"|…)
 */
export function maxContinuousForSportif(brief = {}, opts = {}) {
  const known = Number(brief.maxContinuousDistance) || 0;
  const confidence = Number(brief.capacity?.confidence) || 0;
  const score = Number(brief.capacity?.score) || 0;
  const stroke =
    opts.stroke ||
    brief.strokeForContinuous ||
    (brief.sessionIntent === "quatre_nages" ? "4n" : null) ||
    brief.strokeFocus ||
    "crawl";

  let max = 400;
  if (known >= 800 && confidence >= 0.4) max = Math.min(1000, Math.round((known * 0.85) / 50) * 50);
  else if (known >= 400) max = 600;
  else if (score >= 0.65) max = 500;

  if (brief.objectif === "reprendre" || brief.sessionIntent === "reprise") {
    max = Math.min(max, 200);
  }
  if (brief.sessionIntent === "vitesse" || brief.sessionIntent === "vo2") {
    max = Math.min(max, 100);
  }

  // 4N : distances continues réduites sauf capacité / historique solide
  if (stroke === "4n" || stroke === "quatre_nages") {
    let fourNMax = 100; // défaut : 25/50/100, pas de long continu
    if (known >= 400 && confidence >= 0.45) fourNMax = 150;
    if (known >= 600 && confidence >= 0.5) fourNMax = 200;
    if (known >= 800 && score >= 0.65 && confidence >= 0.55) fourNMax = 400;
    max = Math.min(max, fourNMax);
    return Math.max(50, max);
  }

  // Autres nages non-crawl : un cran sous le crawl
  if (stroke === "dos" || stroke === "brasse" || stroke === "papillon") {
    max = Math.min(max, Math.round(max * 0.6 / 50) * 50 || 100);
  }

  return Math.max(200, scaleMaxContinuousForRaceBand(max, brief));
}

export const SPORTIF_INTENTS = Object.freeze({
  aerobie: {
    id: "aerobie",
    headline: "Aujourd'hui : endurance aérobie (Z2)",
    learnCue: "nage propre, rythme régulier",
    applyCue: "aérobie — tu pourrais parler",
    techPrimary: "respiration",
    quality: false,
    zone: "Z2",
    volumeHint: [2000, 3200],
  },
  technique_endurance: {
    id: "technique_endurance",
    headline: "Aujourd'hui : technique puis aérobie",
    learnCue: "conserve le mouvement travaillé",
    applyCue: "rythme aérobie régulier",
    techPrimary: "rattrape",
    quality: false,
    zone: "Z2",
    volumeHint: [1900, 3000],
  },
  seuil: {
    id: "seuil",
    headline: "Aujourd'hui : travail au seuil (Z3)",
    learnCue: "qualité avant la vitesse",
    applyCue: "soutenu contrôlé — allure seuil",
    techPrimary: "rattrape",
    quality: true,
    zone: "Z3",
    volumeHint: [1800, 2800],
  },
  allure_specifique: {
    id: "allure_specifique",
    headline: "Aujourd'hui : allure spécifique",
    learnCue: "calibrage d'allure",
    applyCue: "tiens l'allure cible sur chaque rep",
    techPrimary: "respiration",
    quality: true,
    zone: "Z3",
    volumeHint: [1800, 2800],
  },
  vitesse: {
    id: "vitesse",
    headline: "Aujourd'hui : vitesse (Z4 limité)",
    learnCue: "explosivité contrôlée",
    applyCue: "rapide / récupération complète",
    techPrimary: "nage",
    quality: true,
    zone: "Z4",
    volumeHint: [1600, 2400],
  },
  vo2: {
    id: "vo2",
    headline: "Aujourd'hui : efforts courts intenses",
    learnCue: "qualité de chaque rep",
    applyCue: "soutenu court — récupère bien",
    techPrimary: "nage",
    quality: true,
    zone: "Z4",
    volumeHint: [1600, 2400],
  },
  endurance: {
    id: "endurance",
    headline: "Aujourd'hui : construire l'endurance",
    learnCue: "économie de nage",
    applyCue: "allure aérobie constante",
    techPrimary: "respiration",
    quality: false,
    zone: "Z2",
    volumeHint: [2200, 3400],
  },
  eau_libre: {
    id: "eau_libre",
    headline: "Aujourd'hui : endurance + orientation",
    learnCue: "respiration + visée",
    applyCue: "sighting + allure régulière",
    techPrimary: "respiration",
    quality: false,
    zone: "Z2",
    volumeHint: [2000, 3200],
  },
  triathlon: {
    id: "triathlon",
    headline: "Aujourd'hui : nager économique (triathlon)",
    learnCue: "respiration régulière",
    applyCue: "économie d'énergie — allure tenable",
    techPrimary: "respiration",
    quality: false,
    zone: "Z2",
    volumeHint: [2000, 3200],
  },
  course_piscine: {
    id: "course_piscine",
    headline: "Aujourd'hui : spécificité course",
    learnCue: "départs et allure course",
    applyCue: "allure cible course",
    techPrimary: "nage",
    quality: false,
    // Par défaut aérobie + touches ; Z3 majoritaire seulement en peak / qualité B
    zone: "Z2",
    volumeHint: [1800, 2800],
  },
  quatre_nages: {
    id: "quatre_nages",
    headline: "Aujourd'hui : travail 4 nages",
    learnCue: "transitions propres",
    applyCue: "enchaîne les nages maîtrisées",
    techPrimary: "4n",
    quality: false,
    zone: "Z2",
    volumeHint: [1900, 3000],
  },
  recuperation: {
    id: "recuperation",
    headline: "Aujourd'hui : récupération active",
    learnCue: "mouvements souples",
    applyCue: "très facile — Z1",
    techPrimary: "nage",
    quality: false,
    zone: "Z1",
    volumeHint: [1400, 2200],
  },
  reprise: {
    id: "reprise",
    headline: "Aujourd'hui : reprise progressive",
    learnCue: "retrouver les sensations",
    applyCue: "volume contrôlé — écoute ton corps",
    techPrimary: "nage",
    quality: false,
    zone: "Z2",
    volumeHint: [1400, 2200],
  },
  test: {
    id: "test",
    headline: "Aujourd'hui : test de performance",
    learnCue: "échauffement complet",
    applyCue: "chrono honnête — donne le max contrôlé",
    techPrimary: "nage",
    quality: true,
    zone: "Z3",
    volumeHint: [1200, 2000],
    isTest: true,
  },
  seance_courte: {
    id: "seance_courte",
    headline: "Aujourd'hui : séance courte structurée",
    learnCue: "éducatif court",
    applyCue: "séries nettes",
    techPrimary: "rattrape",
    quality: false,
    zone: "Z2",
    volumeHint: [1400, 2000],
  },
});

/**
 * Résout l'intention Sportif.
 */
export function resolveSportifIntent(brief = {}) {
  if (brief.sessionIntent && SPORTIF_INTENTS[brief.sessionIntent]) {
    return SPORTIF_INTENTS[brief.sessionIntent];
  }
  const roleObj = String(brief.roleObjectif || brief.objectif || "").toLowerCase();
  if (brief.phase === "test" || brief.family === "test" || roleObj === "test" || brief.roleObjectif === "test") {
    return SPORTIF_INTENTS.test;
  }
  // Objectif produit AVANT le court-circuit strokeFocus 4n
  if (roleObj.includes("reprendre") || brief.objectif === "reprendre") {
    return SPORTIF_INTENTS.reprise;
  }
  if (roleObj.includes("triathlon") || brief.objectif === "triathlon") {
    return SPORTIF_INTENTS.triathlon;
  }
  if (
    roleObj.includes("eau_libre") ||
    brief.objectif === "eau_libre" ||
    brief.family === "eau_libre"
  ) {
    return SPORTIF_INTENTS.eau_libre;
  }
  if (
    roleObj.includes("course") ||
    roleObj.includes("compet") ||
    roleObj.includes("compét") ||
    roleObj.includes("maitre") ||
    roleObj.includes("maître") ||
    brief.objectif === "course_piscine"
  ) {
    if (brief.strokeFocus === "4n") {
      return {
        ...SPORTIF_INTENTS.quatre_nages,
        id: "quatre_nages_course",
        headline: "Aujourd'hui : 4 nages à allure course",
        applyCue: "segments nets, allure compétition",
        quality: true,
        zone: "Z3",
        volumeHint: [1800, 2800],
      };
    }
    return SPORTIF_INTENTS.course_piscine;
  }
  if (brief.qualitySession) {
    if (brief.family === "vitesse") return SPORTIF_INTENTS.vitesse;
    if (brief.intent === "allure_specifique") return SPORTIF_INTENTS.allure_specifique;
    return SPORTIF_INTENTS.seuil;
  }
  if (brief.strokeFocus === "4n") return SPORTIF_INTENTS.quatre_nages;
  if (Number(brief.durationTarget) <= 35) return SPORTIF_INTENTS.seance_courte;
  if (brief.family === "recuperation") return SPORTIF_INTENTS.recuperation;
  if (brief.family === "technique") return SPORTIF_INTENTS.technique_endurance;
  if (brief.family === "seuil") return SPORTIF_INTENTS.seuil;
  if (brief.family === "vitesse") return SPORTIF_INTENTS.vitesse;
  return SPORTIF_INTENTS.aerobie;
}

/**
 * Volume cohérent Sportif — peut baisser vs moteur, jamais gonfler.
 */
export function coherentVolumeForSportif(brief = {}) {
  const engine = Math.max(1200, Number(brief.volumeTarget) || 2200);
  const duration = Math.max(30, Number(brief.durationTarget) || 60);
  const intent = resolveSportifIntent(brief);
  const [hintLo, hintHi] = intent.volumeHint || [1800, 3000];

  let durationCap = 3200;
  if (duration <= 35) durationCap = 1800;
  else if (duration <= 45) durationCap = 2400;
  else if (duration <= 60) durationCap = 3200;
  else durationCap = 3800;

  if (intent.id === "reprise" || intent.id === "recuperation" || intent.id === "test") {
    durationCap = Math.min(durationCap, hintHi);
  }
  if (intent.id === "vitesse" || intent.id === "vo2") {
    durationCap = Math.min(durationCap, 2600);
  }

  const coherent = Math.min(engine, durationCap, hintHi);
  const floor = Math.min(hintLo, durationCap, engine);
  const floored = Math.max(floor, Math.min(coherent, engine));
  const minVol = duration <= 35 ? 1200 : 1500;
  return Math.min(engine, Math.max(minVol, Math.round(floored / 50) * 50));
}

/**
 * Volume cohérent Performance — plus haut que Sportif, jamais gonflé vs moteur.
 * Longues distances : pas d'inflation Z4 via volume.
 */
export function coherentVolumeForPerformance(brief = {}) {
  const engine = Math.max(1400, Number(brief.volumeTarget) || 2600);
  const duration = Math.max(40, Number(brief.durationTarget) || 70);
  const intent = resolveSportifIntent(brief);
  const [hintLo, hintHi] = intent.volumeHint || [2000, 3600];
  const hi = Math.max(hintHi, Math.round(hintHi * 1.15));

  let durationCap = 4000;
  if (duration <= 45) durationCap = 2600;
  else if (duration <= 60) durationCap = 3400;
  else if (duration <= 75) durationCap = 4000;
  else durationCap = 4600;

  if (intent.id === "reprise" || intent.id === "recuperation" || intent.id === "test") {
    durationCap = Math.min(durationCap, hi);
  }
  if (intent.id === "vitesse" || intent.id === "vo2") {
    durationCap = Math.min(durationCap, 2800); // Z4 limité — pas « plus de Z4 »
  }

  const raceDist = Number(brief.raceTarget?.distance || brief.raceDistance) || 0;
  if (raceDist >= 800) {
    durationCap = Math.min(durationCap + 200, engine);
  }

  const coherent = Math.min(engine, durationCap, hi);
  const floor = Math.min(Math.max(hintLo, 1600), durationCap, engine);
  let floored = Math.max(floor, Math.min(coherent, engine));
  const minVol = duration <= 45 ? 1400 : 1800;
  floored = Math.min(engine, Math.max(minVol, Math.round(floored / 50) * 50));

  // Étape I : taper/phase déjà dans effectiveWeekVolume — ne pas re-multiplier
  if (brief.taperAppliedUpstream || brief.volumeFinalized || brief.orchestration?.volumeFinalized) {
    if (brief.taperLoad?.taperStage === "race_day" || brief.isRaceDay || brief.isRestDay) return 0;
    const stage = brief.taperLoad?.taperStage;
    if (stage === "race_week" || stage === "s1" || stage === "s2") {
      return Math.min(engine, Math.max(500, Math.round(engine / 50) * 50));
    }
    return Math.min(engine, Math.max(Math.min(minVol, engine), Math.round(engine / 50) * 50));
  }

  // Legacy (sans orchestration) : appliquer taper une seule fois ici
  const tf = Number(brief.taperLoad?.volumeFactor);
  if (Number.isFinite(tf) && tf < 1) {
    const stage = brief.taperLoad?.taperStage;
    const days = brief.taperLoad?.daysToComp;
    const taperFloor =
      stage === "race_week"
        ? days != null && days <= 2
          ? 600
          : 800
        : stage === "s1"
          ? 900
          : stage === "s2"
            ? 1200
            : 1500;
    floored = Math.max(taperFloor, Math.round((floored * tf) / 50) * 50);
    floored = Math.min(floored, engine);
  }
  if (brief.taperLoad?.taperStage === "race_day" || brief.isRaceDay || brief.isRestDay) return 0;

  return floored;
}

/** Gold Sportif — métadonnées de référence. */
export const SPORTIF_GOLD_SCENARIOS = Object.freeze([
  { id: "SG1", intent: "aerobie", strokeFocus: "crawl", duration: 60, volumeBand: [2000, 3200] },
  { id: "SG2", intent: "seuil", strokeFocus: "crawl", duration: 55, volumeBand: [1800, 2800], qualitySession: true },
  { id: "SG3", intent: "vitesse", strokeFocus: "crawl", duration: 50, volumeBand: [1600, 2400], qualitySession: true },
  { id: "SG4", intent: "course_piscine", strokeFocus: "crawl", duration: 55, volumeBand: [1800, 2800], objectif: "course_piscine" },
  { id: "SG5", intent: "eau_libre", strokeFocus: "crawl", duration: 60, volumeBand: [2000, 3200], objectif: "eau_libre" },
  { id: "SG6", intent: "triathlon", strokeFocus: "crawl", duration: 60, volumeBand: [2000, 3200], objectif: "triathlon" },
  { id: "SG7", intent: "quatre_nages", strokeFocus: "4n", duration: 55, volumeBand: [1900, 3000], papillonMastered: false },
  { id: "SG8", intent: "test", strokeFocus: "crawl", duration: 45, volumeBand: [1200, 2000], qualitySession: true },
]);
