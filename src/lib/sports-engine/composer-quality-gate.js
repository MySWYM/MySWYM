/**
 * Composer Quality Gate (Étape J2).
 * validateComposedSession → errors hard → recomposition bornée.
 */

import {
  resolveHardConstraints,
  applyConstraintsToBrief,
  minFourNageBodyShare,
} from "./composer-constraints.js";
import { MAX_PYRAMID_VOLUME } from "./set-formats.js";
import { isEquipmentEngagementExempt } from "./equipment-usage.js";

const FOUR_N_STROKE_RE = /\b(dos|brasse|papillon|ondulation|4\s*nages|quatre\s*nages|multi-?nages)\b/i;
const CRAWL_ONLY_RE = /\bcrawl\b/i;

function zoneMetersFromSets(sets = []) {
  const by = { Z1: 0, Z2: 0, Z3: 0, Z4: 0, other: 0 };
  for (const s of sets) {
    const m = (Number(s.reps) || 0) * (Number(s.distancePerRep) || 0);
    const z = s.zone || null;
    if (z && by[z] != null) by[z] += m;
    else by.other += m;
  }
  return by;
}

function volumeOfSession(session) {
  if (Number.isFinite(Number(session?.trainingDistance))) return Number(session.trainingDistance);
  if (Number.isFinite(Number(session?.volumeFromSets))) return Number(session.volumeFromSets);
  if (Array.isArray(session?.sets) && session.sets.length) {
    return session.sets.reduce((a, s) => a + (Number(s.reps) || 0) * (Number(s.distancePerRep) || 0), 0);
  }
  return parseInt(String(session?.distance || "").replace(/\D/g, ""), 10) || 0;
}

function detailsText(session) {
  return (session?.details || []).join("\n");
}

function countZ3FromText(text) {
  // Heuristic for Arthur (details-only): count (Z3) blocks roughly via distances on Z3 lines
  let meters = 0;
  const lines = text.split("\n");
  for (const line of lines) {
    if (!/\(Z3\)|Z3\s*@|seuil|race\s*pace|allure\s*course/i.test(line)) continue;
    const nxm = line.match(/(\d+)\s*[×x]\s*(\d+)\s*m/i);
    if (nxm) {
      meters += Number(nxm[1]) * Number(nxm[2]);
      continue;
    }
    const single = line.match(/-?\s*(\d+)\s*m/i);
    if (single) meters += Number(single[1]);
  }
  return meters;
}

function countZ4FromText(text) {
  let meters = 0;
  for (const line of text.split("\n")) {
    if (!/\(Z4\)|Z4\s*@|sprint|à bloc|rapide/i.test(line)) continue;
    const nxm = line.match(/(\d+)\s*[×x]\s*(\d+)\s*m/i);
    if (nxm) meters += Number(nxm[1]) * Number(nxm[2]);
    else {
      const single = line.match(/-?\s*(\d+)\s*m/i);
      if (single) meters += Number(single[1]);
    }
  }
  return meters;
}

function bodyMetersAndFourN(session) {
  const sets = session?.sets || [];
  let body = 0;
  let fourN = 0;
  for (const s of sets) {
    // 4N peut être en technique (Découverte) ou corps
    if (s.block === "depart" || s.block === "fin") continue;
    const m = (Number(s.reps) || 0) * (Number(s.distancePerRep) || 0);
    body += m;
    const label = `${s.label || ""} ${s.cue || ""} ${s.stroke || ""} ${s.exerciseId || ""}`;
    const stroke = String(s.stroke || "");
    if (
      (stroke && stroke !== "crawl") ||
      FOUR_N_STROKE_RE.test(label) ||
      /nages au choix|multi-nages|plusieurs nages|4n/i.test(label)
    ) {
      fourN += m;
    }
  }
  if (!sets.length) {
    const text = detailsText(session);
    for (const line of text.split("\n")) {
      const nxm = line.match(/(\d+)\s*[×x]\s*(\d+)\s*m/i);
      const single = line.match(/-?\s*(\d+)\s*m/i);
      const m = nxm ? Number(nxm[1]) * Number(nxm[2]) : single ? Number(single[1]) : 0;
      if (!m) continue;
      if (FOUR_N_STROKE_RE.test(line) || /nages au choix|multi-nages/i.test(line)) fourN += m;
      if (/×|crawl|dos|brasse|nage/i.test(line) && !/échauff|souple|récup|fin/i.test(line)) {
        body += m;
      }
    }
  }
  return { body, fourN };
}

function isDevLog() {
  return (
    (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DEV) ||
    (typeof process !== "undefined" && process.env && (process.env.NODE_ENV === "development" || process.env.MYSWYM_QG_LOG))
  );
}

export function logQualityGateAttempt(attempt, validation) {
  if (!isDevLog()) return;
  const status = validation.valid ? "PASS" : "FAIL";
  const detail = validation.valid
    ? ""
    : (validation.errors || []).slice(0, 3).join("; ");
  // eslint-disable-next-line no-console
  console.info(`[QG] compose attempt ${attempt} ${status}${detail ? `: ${detail}` : ""}`);
}

/**
 * Validation sportive finale.
 * @returns {{ valid: boolean, errors: string[], warnings: string[], constraintsChecked: string[] }}
 */
export function validateComposedSession(session, brief = {}, constraints = null) {
  const c = constraints || brief.hardConstraints || resolveHardConstraints(brief);
  const errors = [];
  const warnings = [];
  const constraintsChecked = [];

  if (!session) {
    return { valid: false, errors: ["session manquante"], warnings, constraintsChecked };
  }

  // Race / rest : skip most sporting checks
  if (session.isRaceDay || session.type === "RACE" || session.sessionIntent === "race") {
    constraintsChecked.push("race_day");
    return { valid: true, errors, warnings, constraintsChecked };
  }
  if (session.isRestDay || session.type === "REST" || session.sessionIntent === "repos") {
    constraintsChecked.push("rest_day");
    return { valid: true, errors, warnings, constraintsChecked };
  }

  const vol = volumeOfSession(session);
  const sets = session.sets || [];
  const text = detailsText(session);
  const zones = sets.length ? zoneMetersFromSets(sets) : {
    Z1: 0,
    Z2: 0,
    Z3: countZ3FromText(text),
    Z4: countZ4FromText(text),
    other: 0,
  };

  // --- volume ---
  constraintsChecked.push("volume");
  if (c.maxVolume != null && vol > c.maxVolume) {
    errors.push(`taper/volume: ${vol}m > maxVolume ${c.maxVolume}m`);
  }
  const target = Number(brief.volumeTarget) || 0;
  if (target > 0 && vol > target * (c.volumeToleranceHi || 1.12)) {
    // block floors : tolérance ; au-delà = error soft→warning sauf si taper
    if (c.taperConstraints) {
      errors.push(`volume hors tolérance taper (${vol}m vs cible ${target}m)`);
    } else {
      warnings.push(`volume légèrement au-dessus (${vol}m vs ${target}m)`);
    }
  }

  // --- continuous ---
  constraintsChecked.push("continuousDistance");
  const maxCont = c.maxContinuousDistance ?? 100;
  for (const s of sets) {
    const continuous = s.continuous === true || (s.reps === 1 && s.restSec === 0 && s.block !== "technique");
    if (continuous && Number(s.distancePerRep) > maxCont) {
      errors.push(
        `continuous ${s.distancePerRep}m > maxContinuous ${maxCont}m (block=${s.block || "?"})`,
      );
    }
  }
  // Text fallback for Arthur / détails
  if (!sets.length && c.level === "decouverte") {
    const m = text.match(/-(\d{2,4})m\s+(crawl|dos|souple)/i);
    if (m && Number(m[1]) > maxCont) {
      errors.push(`continuous détail ${m[1]}m > maxContinuous ${maxCont}m`);
    }
  }

  // --- repetitions ---
  constraintsChecked.push("repetitionCount");
  const maxReps = c.maxRepsPerSet ?? 12;
  for (const s of sets) {
    if (s.continuous) continue;
    if (Number(s.reps) > maxReps) {
      errors.push(`reps ${s.reps} × ${s.distancePerRep}m > maxRepsPerSet ${maxReps}`);
    }
  }
  if (!sets.length) {
    for (const line of text.split("\n")) {
      const m = line.match(/(\d+)\s*[×x]\s*(\d+)\s*m/i);
      if (m && Number(m[1]) > maxReps) {
        errors.push(`reps détail ${m[1]}×${m[2]}m > maxRepsPerSet ${maxReps}`);
      }
    }
  }

  // --- rest = 0 ---
  constraintsChecked.push("recovery");
  if (c.requirePositiveRestUnlessContinuous !== false) {
    for (const s of sets) {
      if (s.continuous) continue;
      if (Number(s.reps) > 1 && Number(s.restSec) === 0) {
        errors.push(`série ${s.reps}×${s.distancePerRep}m avec rest=0 (non continuous)`);
      }
    }
    // détail : "N × Xm ... repos 0" or missing rest with NxM without "sans pause"
    for (const line of text.split("\n")) {
      if (!/\d+\s*[×x]\s*\d+\s*m/i.test(line)) continue;
      if (/sans pause|continu/i.test(line)) continue;
      if (/repos\s*0\s*s/i.test(line)) {
        errors.push(`repos 0s sur série répétée: ${line.trim().slice(0, 60)}`);
      }
    }
  }

  // --- intensity / pain / taper Z3/Z4 ---
  constraintsChecked.push("intensity");
  constraintsChecked.push("pain");
  constraintsChecked.push("taper");
  const z3 = zones.Z3 || 0;
  const z4 = zones.Z4 || 0;

  if (c.painProtection) {
    if (z3 > 0 || z4 > 0 || /\(Z3\)|\(Z4\)|Z3\s*@|Z4\s*@/i.test(text)) {
      errors.push("pain: Z3/Z4 interdit sous painProtection");
    }
    const intent = brief.sessionIntent || session.composerWhy?.intent || "";
    if (c.forbiddenIntents?.includes(intent)) {
      errors.push(`pain: intent interdit ${intent}`);
    }
    if (/touches allure course|race\s*pace|allure spécifique/i.test(text) && /Z3/i.test(text)) {
      errors.push("pain: race pace / touches Z3 interdites");
    }
  }

  if (c.maxZ3Meters != null && z3 > c.maxZ3Meters) {
    errors.push(`Z3 ${z3}m > maxZ3Meters ${c.maxZ3Meters}m`);
  }
  if (c.maxZ4Meters != null && z4 > c.maxZ4Meters) {
    errors.push(`Z4 ${z4}m > maxZ4Meters ${c.maxZ4Meters}m`);
  }
  if (c.maxIntensity === "Z2" && (z3 > 0 || z4 > 0)) {
    errors.push(`intensité > maxIntensity Z2 (Z3=${z3} Z4=${z4})`);
  }

  if (c.taperConstraints?.forbidThresholdBlock) {
    const hardBlocks = sets.filter(
      (s) => s.block === "corps" && (s.zone === "Z3" || s.zone === "Z4") && !s.blockRole?.includes?.("specific"),
    );
    const bigZ3 = sets.filter(
      (s) => s.zone === "Z3" && s.reps * s.distancePerRep >= 400 && Number(s.reps) >= 4,
    );
    if (bigZ3.length && z3 > (c.maxRacePaceMeters || 200)) {
      errors.push("taper: gros bloc seuil interdit");
    }
    if (c.forbidLongProgressive && /progressif|pyramide/i.test(text) && vol > (c.maxVolume || 9999) * 0.7) {
      errors.push("taper: série progressive / pyramide trop lourde");
    }
    void hardBlocks;
  }

  if (c.taperConstraints && c.maxRacePaceMeters != null && c.allowRacePaceTouch) {
    // race pace touches counted as Z3 specific
    const touchVol = sets
      .filter((s) => s.blockRole === "specific" || /allure course|race/i.test(s.cue || ""))
      .reduce((a, s) => a + s.reps * s.distancePerRep, 0);
    if (touchVol > c.maxRacePaceMeters + 50) {
      errors.push(`taper race pace ${touchVol}m > maxRacePaceMeters ${c.maxRacePaceMeters}m`);
    }
  }

  // --- level complexity ---
  constraintsChecked.push("level");
  constraintsChecked.push("complexity");
  if (c.level === "decouverte") {
    if (/Z3|Z4|CSS|seuil|VO2|hypoxie/i.test(text)) {
      errors.push("Découverte: intensité incompatible");
    }
    if (/rattrapé|catch-up|roulis|virage|petit chien/i.test(text) && !/grand chien|flèche/i.test(text)) {
      warnings.push("Découverte: éducatif avancé");
    }
  }

  // --- equipment ---
  constraintsChecked.push("equipment");
  if (Array.isArray(brief.equipment) && session.equipmentRequired?.length) {
    for (const eq of session.equipmentRequired) {
      if (!brief.equipment.includes(eq)) {
        errors.push(`material_missing:${eq}`);
        errors.push(`matériel manquant: ${eq}`);
      }
    }
  }
  if (/pull/i.test(text) && /palmes/i.test(text) && /pull.*palmes|palmes.*pull/i.test(text)) {
    // same line pull+palmes
    for (const line of text.split("\n")) {
      if (/pull/i.test(line) && /palmes/i.test(line)) {
        errors.push("matériel incompatible: pull + palmes");
      }
    }
  }
  // Engagement composeur : matos déclaré → ≥1 item appliqué (hors récup/taper/course)
  if (
    Array.isArray(brief.equipment) &&
    brief.equipment.length > 0 &&
    session.composerWhy?.equipmentUsage != null &&
    !isEquipmentEngagementExempt(brief)
  ) {
    const used = session.equipmentUsed || session.equipmentRequired || [];
    const visible = /palmes|tuba|pull|planche|plaquette|élastique|elastique/i.test(text);
    if (!used.length || !visible) {
      errors.push("equipment_engagement: matos déclaré non appliqué");
    }
  }

  // --- 4N ---
  constraintsChecked.push("fourN");
  constraintsChecked.push("objective");
  if (c.isFourN && c.minFourNageBodyShare > 0) {
    const { body, fourN } = bodyMetersAndFourN(session);
    const bodyVol = body || vol * 0.5;
    const share = bodyVol > 0 ? fourN / bodyVol : 0;
    const minShare = c.minFourNageBodyShare || minFourNageBodyShare(c.level);
    if (share + 0.001 < minShare * 0.85) {
      // 15% tolerance on share measurement
      errors.push(
        `4N: share ${(share * 100).toFixed(0)}% < min ${(minShare * 100).toFixed(0)}% (fourN=${fourN} body=${bodyVol})`,
      );
    }
    // crawl-only body rejection
    if (fourN === 0 && CRAWL_ONLY_RE.test(text) && !FOUR_N_STROKE_RE.test(text)) {
      errors.push("4N: corps essentiellement crawl");
    }
  }

  // --- phase ---
  constraintsChecked.push("phase");
  const taperStage = c.taperConstraints?.taperStage;
  if (taperStage === "race_week" && vol > 1600) {
    errors.push(`race_week volume trop élevé (${vol}m)`);
  }
  if (taperStage === "race_week") {
    if (z3 > (c.maxZ3Meters ?? 150) + 20) errors.push(`race_week Z3 trop élevé (${z3}m)`);
    if (/pyramide/i.test(text) && vol > 700) errors.push("race_week: pyramide interdite");
  }
  if (taperStage === "s1") {
    if (/pyramide/i.test(text) && vol > 900) errors.push("taper s1: pyramide filler");
    for (const line of text.split("\n")) {
      const m = line.match(/(\d+)\s*[×x]\s*100\s*m/i);
      if (m && Number(m[1]) >= 10) errors.push("taper s1: série trop longue (≥10×100)");
    }
  }

  // --- J3 intensité réelle vs intent ---
  constraintsChecked.push("intent_intensity");
  if (c.requireIntentIntensity !== false) {
    const intent = String(brief.sessionIntent || session.composerWhy?.intent || "");
    const forceSafe = !!brief._qualityGateForceSafe || !!brief._qualityGateShortTouch;
    const needsZ3 =
      /^(seuil|threshold|allure_specifique|race_pace)$/i.test(intent) ||
      (intent === "course_piscine" && !!brief.qualitySession);
    const needsZ4 = /^(vitesse|vo2)$/i.test(intent);
    if (!forceSafe && !c.painProtection) {
      if (needsZ3 && !c.forbidThresholdBlock) {
        const minZ3 =
          intent === "allure_specifique" || intent === "race_pace"
            ? Math.min(200, Math.max(100, Math.round((Number(brief.volumeTarget) || 1500) * 0.12)))
            : Math.min(400, Math.max(200, Math.round((Number(brief.volumeTarget) || 1500) * 0.18)));
        const z3Eff = z3 > 0 ? z3 : countZ3FromText(text);
        if (z3Eff < minZ3 * 0.5) {
          errors.push(
            `intent ${intent}: Z3 réel ${z3Eff}m < minimum ~${minZ3}m (intensité annoncée absente)`,
          );
        }
      }
      if (needsZ4 && (c.maxZ4Meters == null || c.maxZ4Meters > 0)) {
        const minZ4 = Math.min(200, Math.max(100, Math.round((Number(brief.volumeTarget) || 1500) * 0.1)));
        const z4Eff = z4 > 0 ? z4 : countZ4FromText(text);
        if (z4Eff < minZ4 * 0.5) {
          errors.push(
            `intent ${intent}: Z4 réel ${z4Eff}m < minimum ~${minZ4}m (vitesse absente)`,
          );
        }
      }
    }
  }

  // --- J3 anti-filler ---
  constraintsChecked.push("filler");
  if (/—\s*suite\b/i.test(text)) {
    errors.push("filler: bloc « suite » artificiel");
  }
  if (/repos\s+variable/i.test(text)) {
    errors.push("filler: repos variable non nageable");
  }
  if (c.forbidPyramidFiller && /pyramide/i.test(text)) {
    errors.push("filler: pyramide interdite (taper/pain)");
  }

  // --- J3 pain shape ---
  if (c.painProtection) {
    for (const s of sets) {
      if (!s.continuous && Number(s.reps) > (c.maxRepsPerSet || 8) && Number(s.distancePerRep) >= 100) {
        errors.push(`pain: série trop longue ${s.reps}×${s.distancePerRep}m`);
      }
    }
  }

  // --- J3 spécificité objectif ---
  const objectif = brief.objectif || "";
  const intentNow = String(brief.sessionIntent || session.composerWhy?.intent || "");
  const skipObjCue =
    c.painProtection ||
    brief._qualityGateForceSafe ||
    intentNow === "recuperation" ||
    intentNow === "repos" ||
    c.level === "decouverte";
  if (!skipObjCue && objectif === "eau_libre") {
    if (!/sighting|visée|orientation|navigation|lève|repér|draft/i.test(text)) {
      errors.push("objectif eau_libre: cue sighting/orientation absent du corps");
    }
  }
  if (!skipObjCue && objectif === "triathlon" && /triathlon|seuil|aerobie|endurance|allure/i.test(intentNow)) {
    if (!/triathlon|économie|draft|sighting|allure régulière|allure course|énergie/i.test(text)) {
      errors.push("objectif triathlon: cue spécifique absent");
    }
  }
  if (
    !skipObjCue &&
    objectif === "course_piscine" &&
    (/seuil|allure_specifique|course_piscine|race|vitesse|vo2/i.test(intentNow) || brief.qualitySession)
  ) {
    const hasQuality =
      z3 >= 100 ||
      z4 >= 100 ||
      /allure course|race|seuil|Z3|Z4|spécifique|rapide|vitesse/i.test(text);
    if (!hasQuality) {
      errors.push("objectif course_piscine: pas de travail allure/seuil/vitesse réel");
    }
  }

  // --- pyramide : jamais un monolithe 1750 m sans info (Ironman / triathlon perf) ---
  constraintsChecked.push("pyramid");
  const setsArr = Array.isArray(session?.sets) ? session.sets : [];
  const pyramidStepVol = setsArr
    .filter((s) => (s.meta?.pyramidStep ?? s.pyramidStep) != null)
    .reduce((a, s) => a + (Number(s.reps) || 0) * (Number(s.distancePerRep) || 0), 0);
  if (pyramidStepVol > MAX_PYRAMID_VOLUME) {
    errors.push(`pyramide trop longue: ${pyramidStepVol}m > max ${MAX_PYRAMID_VOLUME}m`);
  }
  // Affichage opaque « Xm pyramide » sans paliers (ex. « 1750m pyramide ») = erreur
  if (/pyramide/i.test(text)) {
    const opaque = text.match(/-(\d+)\s*m\s+pyramide\b(?![^:\n]*→)/gi) || [];
    for (const m of opaque) {
      const n = parseInt(m.replace(/\D/g, ""), 10);
      if (n > MAX_PYRAMID_VOLUME) {
        errors.push(`pyramide affichée trop longue / sans paliers: ${n}m`);
      }
    }
    // Ligne pyramide sans chaîne de paliers (aucune info coach)
    const pyrLines = text.split("\n").filter((l) => /pyramide/i.test(l) && /^\s*-/.test(l));
    for (const line of pyrLines) {
      if (!/→/.test(line) && !/montée|descente|sommet|\d+\s*[→\-–]\s*\d+/i.test(line)) {
        warnings.push("pyramide sans détail de paliers");
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    constraintsChecked,
  };
}

/**
 * Valide une séance Arthur (details) contre les mêmes hard constraints.
 */
export function validateArthurCandidate(session, brief = {}, constraints = null) {
  const c = constraints || resolveHardConstraints(brief);
  const fakeBrief = { ...brief, hardConstraints: c };
  return validateComposedSession(session, fakeBrief, c);
}

/**
 * Compose avec quality gate + recomposition (max 3) + fallback safe.
 * @param {object} brief
 * @param {(b: object) => {ok:boolean, session?:object, reason?:string}} composeOnce
 */
export function composeWithQualityGate(brief, composeOnce) {
  const baseConstraints = resolveHardConstraints(brief);
  const attemptLogs = [];

  for (let attempt = 1; attempt <= 3; attempt++) {
    const attemptBrief = applyConstraintsToBrief(brief, baseConstraints, attempt);
    const constraints = attemptBrief.hardConstraints || resolveHardConstraints(attemptBrief);
    const result = composeOnce(attemptBrief);
    if (!result?.ok || !result.session) {
      const fail = { attempt, valid: false, errors: [result?.reason || "compose failed"] };
      attemptLogs.push(fail);
      logQualityGateAttempt(attempt, fail);
      continue;
    }

    const validation = validateComposedSession(result.session, attemptBrief, constraints);
    attemptLogs.push({ attempt, ...validation });
    logQualityGateAttempt(attempt, validation);

    if (validation.valid) {
      return {
        ok: true,
        session: {
          ...result.session,
          qualityGate: {
            attempt,
            attempts: attemptLogs,
            constraintsChecked: validation.constraintsChecked,
            hardConstraints: summarizeConstraints(constraints),
          },
        },
        warnings: [...(result.warnings || []), ...validation.warnings],
      };
    }
  }

  // Fallback safe : session minimale construite pour PASSER les hard constraints
  const safeBrief = applyConstraintsToBrief(
    {
      ...brief,
      sessionIntent: "recuperation",
      family: "recuperation",
      qualitySession: false,
      racePaceTouches: false,
      _qualityGateForceSafe: true,
    },
    baseConstraints,
    3,
  );
  const cap = Math.min(
    safeBrief.volumeTarget,
    baseConstraints.maxVolume || safeBrief.volumeTarget,
    brief.level === "decouverte" ? 700 : brief.level === "regulier" ? 1100 : 1000,
  );
  safeBrief.volumeTarget = Math.max(brief.level === "decouverte" ? 400 : 500, cap);

  const safe = composeOnce(safeBrief);
  if (safe?.ok && safe.session) {
    let v = validateComposedSession(safe.session, safeBrief, safeBrief.hardConstraints);
    logQualityGateAttempt("fallback", v);
    if (v.valid) {
      return {
        ok: true,
        session: {
          ...safe.session,
          qualityGate: {
            attempt: "fallback",
            attempts: attemptLogs,
            forced: true,
            constraintsChecked: v.constraintsChecked,
            hardConstraints: summarizeConstraints(safeBrief.hardConstraints),
          },
        },
        warnings: [...(safe.warnings || []), ...v.warnings],
      };
    }
  }

  // Ultime : séance minimale handcrafted (garantit hard constraints)
  const minimal = buildMinimalSafeSession(safeBrief, baseConstraints);
  // Respect papillon maîtrisé dans le minimal 4N
  if (baseConstraints.isFourN && brief.papillonMastered) {
    const corps = minimal.sets.filter((s) => s.block === "corps");
    if (corps.length && !minimal.details.some((l) => /papillon/i.test(l))) {
      minimal.sets.push({
        reps: 2,
        distancePerRep: 25,
        restSec: 20,
        label: "papillon",
        cue: "touches multi-nages",
        block: "corps",
        continuous: false,
        zone: "Z1",
        stroke: "papillon",
        exerciseId: "safe_pap",
      });
      minimal.details.splice(-1, 0, "-2 × 25m papillon — touches multi-nages — repos 20s");
      const vol = minimal.sets.reduce((a, s) => a + s.reps * s.distancePerRep, 0);
      minimal.volumeFromSets = vol;
      minimal.trainingDistance = vol;
      minimal.distance = `${vol}m`;
    }
  }
  const vMin = validateComposedSession(minimal, safeBrief, baseConstraints);
  logQualityGateAttempt("minimal", vMin);
  return {
    ok: true,
    session: {
      ...minimal,
      qualityGate: {
        attempt: "minimal",
        attempts: attemptLogs,
        forced: true,
        valid: vMin.valid,
        errors: vMin.errors,
        constraintsChecked: vMin.constraintsChecked,
        hardConstraints: summarizeConstraints(baseConstraints),
      },
    },
    warnings: vMin.valid ? [] : vMin.errors.map((e) => `minimal: ${e}`),
  };
}

function buildMinimalSafeSession(brief, constraints) {
  const level = brief.level || "regulier";
  const maxVol = Math.min(
    constraints.maxVolume ?? 900,
    Number(brief.volumeTarget) || 900,
    level === "decouverte" ? 600 : 900,
  );
  const maxCont = Math.min(constraints.maxContinuousDistance || 50, 50);
  const unit = Math.min(50, maxCont);
  const zone = constraints.painProtection || level === "decouverte" ? "Z1" : "Z1";
  const sets = [];
  const details = [];
  const pushSeries = (reps, dist, label, cue, block) => {
    const s = {
      reps,
      distancePerRep: dist,
      restSec: 20,
      label,
      cue,
      block,
      continuous: false,
      zone,
      exerciseId: `safe_${block}`,
    };
    sets.push(s);
    details.push(`-${reps} × ${dist}m ${label} — ${cue} — repos 20s`);
  };
  // départ
  const depReps = Math.min(3, Math.max(2, Math.floor((maxVol * 0.15) / unit)));
  pushSeries(depReps, unit, "crawl / dos souple", "échauffement facile", "depart");
  // tech
  pushSeries(4, Math.min(25, unit), "nage appliquée", "mouvement propre", "technique");
  // corps
  let used = sets.reduce((a, s) => a + s.reps * s.distancePerRep, 0);
  let remain = Math.max(unit * 2, maxVol - used - unit);
  // 4N si requis
  if (constraints.isFourN) {
    const fourN = Math.max(unit * 3, Math.round(remain * (constraints.minFourNageBodyShare || 0.35)));
    const per = Math.max(1, Math.floor(fourN / unit / 3));
    for (const stroke of ["dos", "brasse", "crawl"]) {
      pushSeries(per, unit, stroke, "touches multi-nages", "corps");
    }
    used = sets.reduce((a, s) => a + s.reps * s.distancePerRep, 0);
    remain = Math.max(0, maxVol - used - unit);
  }
  // J3: même en fallback minimal, garder un cue objectif si compatible (pas douleur stricte)
  const obj = String(brief.objectif || brief.goalFamily || "").toLowerCase();
  let corpsCue = "très facile — Z1";
  if (!constraints.painProtection) {
    if (/eau_libre|open_water/.test(obj)) corpsCue = "très facile — Z1 — sighting + allure régulière";
    else if (/triathlon/.test(obj)) corpsCue = "très facile — Z1 — économie d'énergie — allure régulière";
  }
  while (remain >= unit * 2 && sets.filter((s) => s.block === "corps").length < 4) {
    const reps = Math.min(constraints.maxRepsPerSet || 12, Math.floor(remain / unit));
    if (reps < 2) break;
    pushSeries(reps, unit, "crawl", corpsCue, "corps");
    remain -= reps * unit;
  }
  // fin
  pushSeries(2, unit, "au choix", "récupération", "fin");
  const vol = sets.reduce((a, s) => a + s.reps * s.distancePerRep, 0);
  details.unshift(`-${Math.max(unit * 2, 100)}m crawl souple — Z1`);
  return {
    type: "ENDURANCE",
    title: level === "performance" ? "Performance · séance sécurisée" : `${level} · séance sécurisée`,
    intensity: "Z1",
    details,
    distance: `${vol}m`,
    duration: Math.max(20, Math.round(vol / 35)),
    completed: false,
    skipped: null,
    family: "recuperation",
    sets,
    volumeFromSets: vol,
    trainingDistance: vol,
    composedBy: "quality-gate-minimal",
    composerWhy: { intent: "recuperation", qualityGateMinimal: true, volumeFromSets: vol },
  };
}

function summarizeConstraints(c) {
  if (!c) return null;
  return {
    maxVolume: c.maxVolume,
    maxContinuousDistance: c.maxContinuousDistance,
    maxRepsPerSet: c.maxRepsPerSet,
    maxZ3Meters: c.maxZ3Meters,
    maxZ4Meters: c.maxZ4Meters,
    painProtection: c.painProtection,
    taperStage: c.taperConstraints?.taperStage || null,
    isFourN: c.isFourN,
    minFourNageBodyShare: c.minFourNageBodyShare,
  };
}
