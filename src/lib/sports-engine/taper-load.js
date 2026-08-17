/**
 * Taper + Race Week — Performance (Étape G).
 * Réduit volume/densité/fatigue ; conserve touches d'allure et confiance.
 * Pas de coefficient uniforme unique ; pas de surcharge tardive.
 */

import { weeksToCompetition, horizonBandFromWeeks } from "./performance-strategy.js";

/**
 * @typedef {object} TaperLoad
 * @property {number} volumeFactor
 * @property {number} densityFactor
 * @property {number} intensityRetention
 * @property {number} specificityRetention
 * @property {number} recoveryFactor
 * @property {string} taperStage — s3|s2|s1|race_week|race_day|null
 * @property {string} phase — taper|race|… (phase plan effective)
 * @property {number|null} daysToComp
 * @property {number|null} weeksToComp
 * @property {string|null} horizonBand
 * @property {string} rationale
 */

/**
 * Jours jusqu'à la compétition (peut être 0 = jour J, négatif = passé).
 */
export function daysToCompetition(competitionDate, now = new Date()) {
  if (!competitionDate) return null;
  const d = competitionDate instanceof Date ? competitionDate : new Date(competitionDate);
  if (Number.isNaN(d.getTime())) return null;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - start.getTime()) / (24 * 3600 * 1000));
}

/**
 * Stage de taper depuis les jours restants.
 * @returns {'s3'|'s2'|'s1'|'race_week'|'race_day'|'post_race'|null}
 */
export function taperStageFromDays(days) {
  if (days == null || !Number.isFinite(days)) return null;
  // J3 : post_race limité (~10 j) — pas une traîne de repos jusqu'à la fin du plan
  if (days < 0) return days >= -10 ? "post_race" : null;
  if (days === 0) return "race_day";
  if (days <= 6) return "race_week";
  if (days <= 13) return "s1";
  if (days <= 20) return "s2";
  if (days <= 27) return "s3";
  return null;
}

/**
 * Phase plan dérivée (TAPER / RACE) — Performance.
 * Si pas de date : conserve ctx.phase (pas d'invention).
 */
export function resolveTaperPhase(ctx = {}, now = new Date()) {
  const date = ctx.competitionDate || ctx.raceTarget?.competitionDate || null;
  const days = daysToCompetition(date, now);
  const weeks = weeksToCompetition(date, now);
  const horizon = horizonBandFromWeeks(weeks);
  const stage = taperStageFromDays(days);

  let phase = ctx.phase || "development";
  if (stage === "race_day") phase = "race";
  else if (stage === "post_race") phase = "bilan";
  else if (stage === "s3" || stage === "s2" || stage === "s1" || stage === "race_week") phase = "taper";
  else if (ctx.phase === "taper" || ctx.phase === "competition") phase = ctx.phase === "competition" ? "race" : "taper";

  return {
    phase,
    taperStage: stage,
    daysToComp: days,
    weeksToComp: weeks,
    horizonBand: horizon,
    competitionDate: date,
  };
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Modèle de charge taper — paramètres de stratégie (pas règles absolues).
 * Ajusté par distance course / objectif / fréquence (pas un ×0.5 global).
 */
export function resolveTaperLoad(ctx = {}, now = new Date()) {
  const meta = resolveTaperPhase(ctx, now);
  const stage = meta.taperStage;
  const distance = Number(ctx.raceTarget?.distance || ctx.raceDistance) || 200;
  const freq = Math.max(1, Number(ctx.sessionsPerWeek) || Number(ctx.freq) || 3);
  const objectif = ctx.objectifV1 || "course_piscine";

  /** @type {TaperLoad} */
  const base = {
    volumeFactor: 1,
    densityFactor: 1,
    intensityRetention: 1,
    specificityRetention: 1,
    recoveryFactor: 1,
    taperStage: stage,
    phase: meta.phase,
    daysToComp: meta.daysToComp,
    weeksToComp: meta.weeksToComp,
    horizonBand: meta.horizonBand,
    rationale: "no_taper",
  };

  if (!stage || stage === "post_race") {
    if (stage === "post_race") {
      return {
        ...base,
        volumeFactor: 0.55,
        densityFactor: 0.5,
        intensityRetention: 0.3,
        specificityRetention: 0.4,
        recoveryFactor: 1.5,
        rationale: "post_race_stub — récup légère, pas de reconstruction",
      };
    }
    return base;
  }

  // Profils de charge par stage
  const profiles = {
    s3: { volumeFactor: 0.95, densityFactor: 0.9, intensityRetention: 0.85, specificityRetention: 1.0, recoveryFactor: 1.05 },
    s2: { volumeFactor: 0.72, densityFactor: 0.7, intensityRetention: 0.65, specificityRetention: 0.9, recoveryFactor: 1.2 },
    s1: { volumeFactor: 0.5, densityFactor: 0.5, intensityRetention: 0.5, specificityRetention: 0.8, recoveryFactor: 1.4 },
    race_week: { volumeFactor: 0.38, densityFactor: 0.4, intensityRetention: 0.4, specificityRetention: 0.7, recoveryFactor: 1.6 },
    race_day: { volumeFactor: 0, densityFactor: 0, intensityRetention: 0, specificityRetention: 1, recoveryFactor: 1 },
  };

  let load = { ...profiles[stage] };

  // Affiner race_week selon J-x (pas une seule charge pour J-6 et J-1)
  if (stage === "race_week" && Number.isFinite(meta.daysToComp)) {
    const d = meta.daysToComp;
    if (d <= 1) {
      load.volumeFactor *= 0.35;
      load.densityFactor *= 0.7;
      load.intensityRetention *= 0.5;
    } else if (d <= 2) {
      load.volumeFactor *= 0.55;
      load.densityFactor *= 0.8;
    } else if (d <= 3) {
      load.volumeFactor *= 0.7;
      load.intensityRetention *= 0.85;
    } else if (d <= 4) {
      load.volumeFactor *= 0.85;
    }
  }

  // Sprint distances : volume baisse un peu plus tôt ; longues : garder un peu plus d'aérobie en s3/s2
  if (distance <= 100) {
    load.volumeFactor *= stage === "s3" ? 0.97 : 0.92;
    load.intensityRetention = Math.min(1, load.intensityRetention + 0.05);
  } else if (distance >= 800) {
    if (stage === "s3" || stage === "s2") load.volumeFactor = Math.min(1, load.volumeFactor + 0.05);
    load.intensityRetention *= 0.9; // moins de Z4 absolu
  }

  // Fréquence élevée : un peu plus de réduction de densité (fatigue cumulée)
  if (freq >= 4) {
    load.densityFactor *= 0.92;
    load.recoveryFactor = Math.min(1.8, load.recoveryFactor + 0.1);
  } else if (freq <= 2) {
    // Moins de séances → chaque séance un peu moins écrasée en volume
    load.volumeFactor = Math.min(1, load.volumeFactor + 0.06);
  }

  // Objectifs
  if (objectif === "eau_libre" || objectif === "triathlon") {
    if (stage === "s1" || stage === "race_week") {
      load.volumeFactor *= 0.95;
      load.specificityRetention = Math.min(1, load.specificityRetention + 0.05);
    }
  }

  // Jamais de surcharge : volumeFactor ≤ 1
  load.volumeFactor = clamp(Math.round(load.volumeFactor * 100) / 100, 0, 1);
  load.densityFactor = clamp(Math.round(load.densityFactor * 100) / 100, 0.25, 1);
  load.intensityRetention = clamp(Math.round(load.intensityRetention * 100) / 100, 0.2, 1);
  load.specificityRetention = clamp(Math.round(load.specificityRetention * 100) / 100, 0.4, 1);
  load.recoveryFactor = clamp(Math.round(load.recoveryFactor * 100) / 100, 1, 1.8);

  const rationale = [
    `taperStage=${stage}`,
    `daysToComp=${meta.daysToComp}`,
    `vol×${load.volumeFactor.toFixed(2)}`,
    `dens×${load.densityFactor.toFixed(2)}`,
    `intRetain×${load.intensityRetention.toFixed(2)}`,
    `spec×${load.specificityRetention.toFixed(2)}`,
    `recup×${load.recoveryFactor.toFixed(2)}`,
    distance ? `raceDist=${distance}` : null,
    `freq=${freq}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    ...base,
    ...load,
    taperStage: stage,
    phase: meta.phase,
    daysToComp: meta.daysToComp,
    weeksToComp: meta.weeksToComp,
    horizonBand: meta.horizonBand,
    rationale,
  };
}

/**
 * Rôles A/B/C pour une semaine taper / race week.
 * Une qualité dominante courte ; pas de gros stimulus nouveau.
 */
export function taperWeekRoleIntents(taperLoad, ctx = {}) {
  const stage = taperLoad?.taperStage;
  const distance = Number(ctx.raceTarget?.distance || ctx.raceDistance) || 200;
  const objectif = ctx.objectifV1 || "course_piscine";
  const days = taperLoad?.daysToComp;
  const freq = Math.max(1, Number(ctx.sessionsPerWeek) || 3);

  if (stage === "race_day") {
    return {
      A: { sessionIntent: "race", family: "race", qualitySession: false, isRaceDay: true },
      B: null,
      C: null,
      note: "race_day",
    };
  }

  // Intentions selon distance / objectif
  let raceTouch = "allure_specifique";
  if (distance <= 100) raceTouch = "vitesse"; // touches courtes — volume plafonné ailleurs
  if (objectif === "eau_libre") raceTouch = "eau_libre";
  if (objectif === "triathlon") raceTouch = "triathlon";
  if (ctx.strokeFocus === "4n") raceTouch = "quatre_nages";

  if (stage === "s3") {
    return {
      A: { sessionIntent: "aerobie", family: "endurance", qualitySession: false },
      B: {
        sessionIntent: distance <= 100 ? "allure_specifique" : "seuil",
        family: "seuil",
        qualitySession: true,
        sessionSpecificity: "race_specific",
      },
      C: {
        sessionIntent: "endurance",
        family: "endurance",
        racePaceTouches: true,
        sessionSpecificity: "race_specific",
        qualitySession: false,
      },
      note: "s3_specific_near_normal",
    };
  }

  if (stage === "s2") {
    return {
      A: { sessionIntent: "technique_endurance", family: "technique", qualitySession: false },
      B: {
        sessionIntent: raceTouch === "vitesse" ? "allure_specifique" : raceTouch,
        family: raceTouch === "eau_libre" ? "eau_libre" : "seuil",
        qualitySession: true,
        sessionSpecificity: "race_specific",
        taperShortQuality: true,
      },
      C: {
        sessionIntent: "recuperation",
        family: "recuperation",
        racePaceTouches: true,
        qualitySession: false,
      },
      note: "s2_volume_down_keep_touches",
    };
  }

  if (stage === "s1") {
    return {
      A: { sessionIntent: "technique_endurance", family: "technique", qualitySession: false, zone: "Z1" },
      B: {
        sessionIntent: "allure_specifique",
        family: "seuil",
        qualitySession: true,
        sessionSpecificity: "race_specific",
        taperShortQuality: true,
      },
      C: {
        sessionIntent: "recuperation",
        family: "recuperation",
        qualitySession: false,
        zone: "Z1",
      },
      note: "s1_strong_volume_cut",
    };
  }

  // race_week — selon jours restants + fréquence
  // J-6/J-5 spécifique courte ; J-4/J-3 recup+activation ; J-2 très léger ; J-1 activation ou skip
  const dayPlan = raceWeekDayPlan(days, freq, { distance, objectif, strokeFocus: ctx.strokeFocus });
  return { ...dayPlan, note: `race_week_d${days}` };
}

/**
 * Construit jusqu'à `freq` intentions pour la race week (pas forcément 3 templates A/B/C classiques).
 */
export function raceWeekDayPlan(daysToComp, freq, ctx = {}) {
  const d = Number(daysToComp);
  // Templates selon proximité
  const slots = [];
  if (d >= 5) {
    // J-6 / J-5 zone
    slots.push({
      sessionIntent: "allure_specifique",
      family: "seuil",
      qualitySession: true,
      taperShortQuality: true,
      sessionSpecificity: "race_specific",
      label: "petite_specifique",
    });
    slots.push({
      sessionIntent: "recuperation",
      family: "recuperation",
      qualitySession: false,
      zone: "Z1",
      label: "recup_activation",
    });
    if (freq >= 3) {
      slots.push({
        sessionIntent: "technique_endurance",
        family: "technique",
        qualitySession: false,
        zone: "Z1",
        label: "tech_facile",
      });
    }
  } else if (d >= 3) {
    slots.push({
      sessionIntent: "recuperation",
      family: "recuperation",
      qualitySession: false,
      racePaceTouches: true,
      taperShortQuality: true,
      label: "recup_activation",
    });
    if (freq >= 2) {
      slots.push({
        sessionIntent: "technique_endurance",
        family: "technique",
        qualitySession: false,
        zone: "Z1",
        label: "tech_facile",
      });
    }
    if (freq >= 3) {
      // 3e slot = repos (pas une 3e séance d'entraînement à J-3/J-4)
      slots.push({
        sessionIntent: "repos",
        family: "recuperation",
        qualitySession: false,
        zone: "Z1",
        optional: true,
        taperRestPreferred: true,
        isRestDay: true,
        label: "repos",
      });
    }
  } else if (d === 2) {
    slots.push({
      sessionIntent: "recuperation",
      family: "recuperation",
      qualitySession: false,
      zone: "Z1",
      label: "tres_leger",
    });
    if (freq >= 2) {
      slots.push({
        sessionIntent: "recuperation",
        family: "recuperation",
        qualitySession: false,
        zone: "Z1",
        optional: true,
        label: "optionnel_leger",
      });
    }
  } else {
    // J-1 : activation courte ou repos selon profil (freq élevée → activation courte)
    if (freq >= 4) {
      slots.push({
        sessionIntent: "recuperation",
        family: "recuperation",
        qualitySession: false,
        zone: "Z1",
        taperActivation: true,
        label: "activation_courte",
      });
    } else {
      slots.push({
        sessionIntent: "recuperation",
        family: "recuperation",
        qualitySession: false,
        zone: "Z1",
        optional: true,
        taperRestPreferred: true,
        label: "repos_ou_activation",
      });
    }
  }

  // Pad seulement en début de race week (J-6/J-5) — jamais forcer 3 séances à J-2/J-1
  if (d >= 5) {
    while (slots.length < freq) {
      slots.push({
        sessionIntent: "recuperation",
        family: "recuperation",
        qualitySession: false,
        zone: "Z1",
        label: "recup",
      });
    }
  } else if (d <= 2) {
    // Compléter en repos optionnel (volume 0) pour coller à la freq UI sans charge
    while (slots.length < freq) {
      slots.push({
        sessionIntent: "repos",
        family: "recuperation",
        qualitySession: false,
        zone: "Z1",
        optional: true,
        taperRestPreferred: true,
        isRestDay: true,
        label: "repos",
      });
    }
  }
  const trimmed = slots.slice(0, freq);
  return {
    A: trimmed[0] || null,
    B: trimmed[1] || null,
    C: trimmed[2] || null,
    extra: trimmed.slice(3),
    sessions: trimmed,
  };
}

/**
 * Touches race pace recommandées (volume court) selon distance.
 */
export function taperRacePaceTouch(distance) {
  const d = Number(distance) || 200;
  if (d <= 100) return { reps: 4, dist: 25, cue: "touches race pace 25m" };
  if (d <= 200) return { reps: 4, dist: 50, cue: "touches race pace 50m" };
  if (d <= 400) return { reps: 4, dist: 100, cue: "touches race pace 100m" };
  return { reps: 3, dist: 100, cue: "touches allure course courtes" };
}

/**
 * Repos / slot optionnel en race week (volume entraînement = 0).
 */
export function buildRestDaySession(ctx = {}) {
  const label = ctx.taperActivation
    ? "Activation très courte optionnelle — ou repos si fatigué."
    : "Repos recommandé — pas de nouvelle charge avant la course.";
  return {
    type: "REST",
    title: ctx.taperActivation ? "Performance · Activation / repos" : "Performance · Repos",
    intensity: "Repos",
    details: [
      `→ ${ctx.taperRestPreferred ? "Veille de course" : "Race week"}`,
      label,
      "Pas de nouveau matériel ni nouvelle technique.",
    ],
    distance: "0m",
    duration: 0,
    completed: false,
    skipped: null,
    isRestDay: true,
    optional: true,
    family: "recuperation",
    qualitySession: false,
    volumeFromSets: 0,
    trainingDistance: 0,
    absoluteMetersByZone: { Z1: 0, Z2: 0, Z3: 0, Z4: 0 },
    composerWhy: {
      level: "performance",
      intent: "repos",
      taperStage: ctx.taperStage || "race_week",
      isRestDay: true,
      zoneVolumes: { Z1: 0, Z2: 0, Z3: 0, Z4: 0 },
      absoluteMetersByZone: { Z1: 0, Z2: 0, Z3: 0, Z4: 0 },
    },
    sets: [],
  };
}

/** Carte jour J (échauffement de course, pas un entraînement volume). */
export function isRaceDaySession(session) {
  if (!session || typeof session !== "object") return false;
  if (session.isRaceDay) return true;
  if (session.type === "RACE") return true;
  const intent = String(session.sessionIntent || session.intent || "");
  return intent === "race";
}

/**
 * Séance jour de course (pas un entraînement volume).
 * Affiche un échauffement 400–800 m + touches allure + 2–4 accélérations.
 */
export function buildRaceDaySession(ctx = {}) {
  const target = ctx.raceTarget || null;
  const distance = Number(target?.distance || ctx.raceDistance) || 0;
  const stroke = target?.stroke || ctx.strokeFocus || "crawl";
  const pool = Number(ctx.pool) === 25 ? 25 : 50;
  const timeLabel =
    target?.targetTimeSec != null
      ? `Objectif ${formatTime(target.targetTimeSec)}`
      : "Objectif : donner le meilleur le jour J";
  const accelLine =
    pool === 25
      ? `4×25m accélération — R30" — 2 à 4 accélérations, qualité`
      : `2×50m accélération — R30" — 2 à 4 accélérations, qualité`;

  const details = [
    "Échauffement : 200m nage facile — mise en route, sans forcer",
    "Échauffement : 200m nage facile — un peu plus d'amplitude",
    `Corps : 4×50m allure course — R30" — juste le feeling`,
    `Corps : ${accelLine}`,
    "Retour au calme : 100m nage facile",
    distance ? `Épreuve : ${distance}m ${stroke}` : "Épreuve : course",
    timeLabel,
    "Ce n'est pas un entraînement. Fais confiance au travail déjà fait.",
  ];

  return {
    type: "RACE",
    title: "Jour J",
    intensity: "Course — échauffement seulement",
    details,
    distance: "800m",
    duration: 25,
    completed: false,
    skipped: null,
    isRaceDay: true,
    raceTarget: target,
    family: "race",
    sessionIntent: "race",
    qualitySession: false,
    volumeFromSets: 0,
    trainingDistance: 0,
    absoluteMetersByZone: { Z1: 0, Z2: 0, Z3: 0, Z4: 0 },
    composerWhy: {
      level: "performance",
      intent: "race",
      taperStage: "race_day",
      isRaceDay: true,
      zoneVolumes: { Z1: 0, Z2: 0, Z3: 0, Z4: 0 },
      absoluteMetersByZone: { Z1: 0, Z2: 0, Z3: 0, Z4: 0 },
    },
    sets: [],
  };
}

/**
 * Stub résultat course — jamais inventé.
 * @returns {object|null}
 */
export function buildRaceResultStub({ distance, stroke, resultTimeSec, targetTimeSec } = {}) {
  if (!Number.isFinite(Number(resultTimeSec)) || Number(resultTimeSec) <= 0) return null;
  const result = Number(resultTimeSec);
  const target = Number(targetTimeSec);
  return {
    raceCompleted: true,
    raceResult: {
      distance: Number(distance) || null,
      stroke: stroke || null,
      resultTimeSec: result,
      targetTimeSec: Number.isFinite(target) && target > 0 ? target : null,
      deltaSec: Number.isFinite(target) && target > 0 ? Math.round((result - target) * 10) / 10 : null,
    },
  };
}

function formatTime(sec) {
  const s = Math.round(Number(sec));
  if (!Number.isFinite(s)) return "—";
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}:${String(r).padStart(2, "0")}` : `${r}s`;
}

/** Gold taper — scénarios de référence (métadonnées). */
export const TAPER_GOLD_SCENARIOS = Object.freeze([
  { id: "TG1", distance: 100, focus: "vitesse + race pace + tech", j7: "tech+vitesse courte", j3: "race pace courte", j1: "activation/repos" },
  { id: "TG2", distance: 200, focus: "spécifique court", j7: "petit bloc spécifique", j4: "50 race pace", j2: "très léger" },
  { id: "TG3", distance: 400, focus: "spécifique modéré", j7: "spécifique modérée", j4: "100 race pace", j2: "léger" },
  { id: "TG4", distance: 1500, focus: "endurance spécifique courte", j7: "ES courte", j4: "race pace courte", j2: "activation" },
  { id: "TG5", distance: 200, stroke: "4n", focus: "transitions, pas de gros volume" },
  { id: "TG6", objectif: "eau_libre", focus: "endurance + allure courte" },
  { id: "TG7", objectif: "triathlon", focus: "endurance + allure courte" },
]);

/**
 * Arthur compatible taper ? Volume cible doit pouvoir baisser sans détruire l'intention.
 */
export function arthurFitsTaper(template, taperLoad, volumeTarget) {
  if (!taperLoad?.taperStage || taperLoad.taperStage === "post_race") return true;
  if (taperLoad.taperStage === "race_day") return false;
  const base =
    Number(template?.base_distance_m) ||
    parseInt(String(template?.distance || "").replace(/\D/g, ""), 10) ||
    Number(template?.volumeFromDetails) ||
    0;
  if (!base || !volumeTarget) return false;
  // Refuse si la séance de base est >> 2× la cible taper (scaling trop destructeur)
  if (base > volumeTarget * 2.2) return false;
  const phases = template.phases || [];
  if (phases.length) {
    const ok = phases.some((p) => ["taper", "affutage", "peak", "specifique", "race"].includes(String(p)));
    if (!ok && ["s1", "race_week"].includes(taperLoad.taperStage)) return false;
  }
  // Intensité : en s1/race_week, éviter templates Z4 lourds
  if (["s1", "race_week"].includes(taperLoad.taperStage)) {
    const text = `${template.intensity || ""} ${(template.details || []).join(" ")}`;
    if (/Z4|sprint|à bloc/i.test(text) && base > 1800) return false;
  }
  return true;
}
