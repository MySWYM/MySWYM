/**
 * Intentions Gold Découverte — références sportives (pas de séances hardcodées).
 * Le composeur génère des variantes cohérentes à partir de ces intentions.
 */

/** @typedef {'aisance'|'glisse'|'respiration'|'premieres_longueurs'|'endurance_facile'|'reprise'|'eau_libre_orientation'|'eau_libre_endurance'|'triathlon_facile'|'seance_courte'|'materiel'|'decouverte_4n'} DecouverteIntentId */

/**
 * Plafond de nage continue Découverte.
 * Profil « s'arrête après quelques longueurs » → 50 m par défaut.
 */
export function maxContinuousForDecouverte(brief = {}) {
  const pool = brief.pool === 25 ? 25 : 50;
  const known = Number(brief.maxContinuousDistance) || 0;
  const confidence = Number(brief.capacity?.confidence) || 0;
  const score = Number(brief.capacity?.score) || 0;

  let max = 50;
  if (known >= 200 && confidence >= 0.45) {
    max = Math.min(200, Math.round((known * 0.75) / 50) * 50);
  } else if (known >= 100 && confidence >= 0.35) {
    max = 100;
  } else if (score >= 0.5 && confidence >= 0.5) {
    max = 100;
  }
  return Math.max(pool === 25 ? 25 : 50, max);
}

export const DECOUVERTE_INTENTS = Object.freeze({
  aisance: {
    id: "aisance",
    headline: "Aujourd'hui : prendre confiance dans l'eau",
    learnCue: "poussée mur + glisse, tête entre les bras",
    applyCue: "nage tranquillement, sans forcer",
    techPrimary: "flèche",
    techAlt: "nage",
    volumeHint: [600, 800],
  },
  glisse: {
    id: "glisse",
    headline: "Aujourd'hui : améliorer ta glisse",
    learnCue: "poussée mur + glisse, tête entre les bras",
    applyCue: "essaie de retrouver la sensation de glisse",
    techPrimary: "flèche",
    techAlt: "chien",
    volumeHint: [600, 800],
  },
  respiration: {
    id: "respiration",
    headline: "Aujourd'hui : respirer plus calmement",
    learnCue: "respiration confortable, pauses autorisées",
    applyCue: "souffle doucement, nage confortable",
    techPrimary: "nage",
    techAlt: "flèche",
    volumeHint: [600, 800],
  },
  premieres_longueurs: {
    id: "premieres_longueurs",
    headline: "Aujourd'hui : enchaîner un peu plus longtemps",
    learnCue: "flèche puis nage normale",
    applyCue: "garde un rythme facile entre chaque longueur",
    techPrimary: "flèche",
    techAlt: "nage",
    volumeHint: [700, 900],
    preferLongerReps: true,
  },
  endurance_facile: {
    id: "endurance_facile",
    headline: "Aujourd'hui : rester dans l'eau sans forcer",
    learnCue: "nage normale détendue",
    applyCue: "allure confortable, respiration facile",
    techPrimary: "nage",
    techAlt: "flèche",
    volumeHint: [700, 900],
  },
  reprise: {
    id: "reprise",
    headline: "Aujourd'hui : retrouver les sensations",
    learnCue: "mouvements simples, sans chercher la perf",
    applyCue: "très facile, écoute ton corps",
    techPrimary: "flèche",
    techAlt: "nage",
    volumeHint: [600, 800],
  },
  eau_libre_orientation: {
    id: "eau_libre_orientation",
    headline: "Aujourd'hui : nager en te repérant",
    learnCue: "poussée mur + glisse, tête entre les bras",
    applyCue: "lève brièvement la tête puis reprends ta nage",
    techPrimary: "flèche",
    techAlt: "nage",
    volumeHint: [700, 900],
  },
  eau_libre_endurance: {
    id: "eau_libre_endurance",
    headline: "Aujourd'hui : nager plus longtemps sans forcer",
    learnCue: "nage calme, regard détendu",
    applyCue: "allure confortable, visée douce de temps en temps",
    techPrimary: "nage",
    techAlt: "flèche",
    volumeHint: [800, 1000],
  },
  triathlon_facile: {
    id: "triathlon_facile",
    headline: "Aujourd'hui : nager régulièrement sans te fatiguer",
    learnCue: "respiration confortable",
    applyCue: "crawl régulier, facile",
    techPrimary: "nage",
    techAlt: "flèche",
    volumeHint: [700, 900],
  },
  seance_courte: {
    id: "seance_courte",
    headline: "Aujourd'hui : une séance courte et réussie",
    learnCue: "flèche simple",
    applyCue: "garde la sensation, sans forcer",
    techPrimary: "flèche",
    techAlt: "nage",
    volumeHint: [500, 700],
  },
  materiel: {
    id: "materiel",
    headline: "Aujourd'hui : profiter du matériel pour mieux glisser",
    learnCue: "flèche avec sensation de flottaison",
    applyCue: "nage facile, position détendue",
    techPrimary: "flèche",
    techAlt: "chien",
    volumeHint: [700, 900],
  },
  decouverte_4n: {
    id: "decouverte_4n",
    headline: "Aujourd'hui : découvrir plusieurs nages",
    learnCue: "une nage différente à chaque longueur",
    applyCue: "alterne les nages que tu maîtrises, facile",
    techPrimary: "4n",
    techAlt: "nage",
    volumeHint: [600, 850],
  },
});

/**
 * Résout l'intention dominante (une seule contrainte principale).
 */
export function resolveDecouverteIntent(brief = {}) {
  if (brief.sessionIntent && DECOUVERTE_INTENTS[brief.sessionIntent]) {
    return DECOUVERTE_INTENTS[brief.sessionIntent];
  }

  const obj = brief.objectif;
  const duration = Number(brief.durationTarget) || 30;
  const stroke = brief.strokeFocus || "mixte";
  const hasMatos =
    Array.isArray(brief.equipment) &&
    brief.equipment.some((e) => e === "palmes" || e === "tuba");

  if (obj === "reprendre") return DECOUVERTE_INTENTS.reprise;
  if (stroke === "4n") return DECOUVERTE_INTENTS.decouverte_4n;
  if (duration <= 30 && obj !== "eau_libre") return DECOUVERTE_INTENTS.seance_courte;
  if (obj === "triathlon") return DECOUVERTE_INTENTS.triathlon_facile;
  if (obj === "eau_libre") {
    if (brief.family === "endurance" || brief.keySession) {
      return DECOUVERTE_INTENTS.eau_libre_endurance;
    }
    return DECOUVERTE_INTENTS.eau_libre_orientation;
  }
  if (hasMatos && (brief.sessionIndex || 0) % 3 === 2) {
    return DECOUVERTE_INTENTS.materiel;
  }

  const cycle = ["aisance", "glisse", "respiration", "premieres_longueurs", "endurance_facile"];
  const idx = ((brief.weekIndex || 0) + (brief.sessionIndex || 0)) % cycle.length;
  if (brief.primaryTechnicalGoal === "technique_fleche" && idx === 1) {
    return DECOUVERTE_INTENTS.glisse;
  }
  return DECOUVERTE_INTENTS[cycle[idx]];
}

/**
 * Volume cohérent : on peut BAISSER vs cible moteur, jamais gonfler artificiellement.
 */
export function coherentVolumeForDecouverte(brief = {}) {
  const engine = Math.max(400, Number(brief.volumeTarget) || 750);
  const duration = Math.max(20, Number(brief.durationTarget) || 30);
  const intent = resolveDecouverteIntent(brief);
  const [hintLo, hintHi] = intent.volumeHint || [600, 850];
  const maxCont = maxContinuousForDecouverte(brief);

  const byCapacity = maxCont <= 50 ? Math.min(hintHi, 850) : Math.min(hintHi + 100, 1000);
  const byDuration = Math.round((duration * 22) / 50) * 50;
  const durationCap = duration <= 30 ? Math.min(700, byDuration + 100) : duration <= 40 ? 850 : 1000;

  const coherent = Math.min(engine, byCapacity, durationCap, hintHi);
  const floored = Math.max(Math.min(hintLo, engine), Math.min(coherent, engine));
  return Math.min(engine, Math.max(500, Math.round(floored / 50) * 50));
}

/** Scénarios Gold — métadonnées de référence pour tests (pas de séances figées). */
export const GOLD_SCENARIOS = Object.freeze([
  { id: "GOLD1", intent: "aisance", strokeFocus: "crawl", duration: 45, equipment: [], volumeBand: [600, 800] },
  { id: "GOLD2", intent: "glisse", strokeFocus: "mixte", duration: 45, equipment: [], volumeBand: [600, 800] },
  { id: "GOLD3", intent: "respiration", strokeFocus: "crawl", duration: 40, equipment: [], volumeBand: [600, 800] },
  { id: "GOLD4", intent: "premieres_longueurs", strokeFocus: "crawl", duration: 45, equipment: [], volumeBand: [700, 900] },
  { id: "GOLD5", intent: "reprise", strokeFocus: "mixte", duration: 30, equipment: [], volumeBand: [600, 800] },
  { id: "GOLD6", intent: "eau_libre_orientation", strokeFocus: "crawl", duration: 45, equipment: [], volumeBand: [700, 900], objectif: "eau_libre" },
  { id: "GOLD7", intent: "eau_libre_endurance", strokeFocus: "crawl", duration: 45, equipment: [], volumeBand: [800, 1000], objectif: "eau_libre" },
  { id: "GOLD8", intent: "triathlon_facile", strokeFocus: "crawl", duration: 45, equipment: [], volumeBand: [700, 900], objectif: "triathlon" },
  { id: "GOLD9", intent: "seance_courte", strokeFocus: "crawl", duration: 30, equipment: [], volumeBand: [500, 700] },
  { id: "GOLD10", intent: "materiel", strokeFocus: "crawl", duration: 45, equipment: ["palmes", "tuba"], volumeBand: [700, 900] },
  { id: "GOLD11", intent: "decouverte_4n", strokeFocus: "4n", duration: 45, equipment: [], volumeBand: [600, 850], papillonMastered: false },
]);
