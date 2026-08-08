/**
 * Rôles hebdo + familles V1 + séance clé.
 */
import { OBJECTIF_V1 } from "./types.js";
import { analyzeRaceWeek } from "./race-quality.js";
import { applyQualityToCourseRoles } from "./race-week-roles.js";

const FAMILY_FROM_ROLE = {
  Z1: "aisance",
  Z2: "endurance",
  Z3: "seuil",
  Z4: "vitesse",
};

/**
 * Enrichit les rôles COSD avec famille V1 + flag séance clé.
 * @param {Array<{objectif:string, zone:string}>} roles
 * @param {object} ctx — { phase, level, objectifV1 }
 */
export function enrichWeekRoles(roles, ctx = {}) {
  const n = roles.length;
  let keyIndex = 0;
  if (ctx.phase === "development" || ctx.phase === "peak") {
    keyIndex = Math.min(n - 1, n >= 3 ? 1 : 0);
  } else if (ctx.phase === "test") {
    keyIndex = roles.findIndex((r) => r.objectif === "test");
    if (keyIndex < 0) keyIndex = Math.min(1, n - 1);
  }

  return roles.map((role, i) => {
    let family = FAMILY_FROM_ROLE[role.zone] || "endurance";
    if (role.objectif?.startsWith("technique_")) family = "technique";
    if (role.objectif === "eau_libre") family = "eau_libre";
    if (role.objectif === "test") family = "test";
    if (role.objectif === "mixte" && ctx.objectifV1 === OBJECTIF_V1.TRIATHLON) family = "specifique";
    if (ctx.level === "decouverte" && (family === "seuil" || family === "vitesse")) {
      family = i === 0 ? "aisance" : "endurance";
    }
    if (ctx.hasPainConstraint && (family === "seuil" || family === "vitesse")) {
      family = "recuperation";
    }
    return {
      ...role,
      family,
      isKeySession: i === keyIndex,
      intent: family,
      qualitySession: false,
    };
  });
}

/**
 * Rôles Découverte simplifiés (3 séances).
 */
export function decouverteWeekRoles(n) {
  const templates = [
    { objectif: "endurance", zone: "Z1", family: "aisance", intent: "aisance", qualitySession: false },
    { objectif: "endurance", zone: "Z2", family: "endurance", intent: "endurance", qualitySession: false },
    { objectif: "technique_respiration", zone: "Z1", family: "technique", intent: "technique", qualitySession: false },
  ];
  return Array.from({ length: Math.max(1, n) }, (_, i) => ({
    ...templates[i % templates.length],
    isKeySession: i === 1 || (n === 1 && i === 0),
  }));
}

/**
 * Régulier 3×/sem : A technique+endurance · B une qualité · C récup.
 * ... existing ...
 */
export function regulierWeekRoles(n, ctx = {}) {
  const obj = ctx.objectifV1 || "";
  const stroke = ctx.strokeFocus || "mixte";
  const resume = ctx.resumeMode || obj === OBJECTIF_V1.REPRENDRE;
  const weekIndex = Number(ctx.weekIndex) || 0;

  let A = {
    objectif: "endurance",
    zone: "Z1",
    family: "technique",
    intent: "technique_endurance",
    sessionIntent: "technique_endurance",
    sessionSpecificity: "general",
    qualitySession: false,
    isKeySession: false,
  };
  let B = {
    objectif: "endurance",
    zone: "Z2",
    family: "endurance",
    intent: "qualite",
    sessionIntent: resume ? "reprise" : "qualite",
    sessionSpecificity: "general",
    qualitySession: !resume,
    isKeySession: true,
  };
  let C = {
    objectif: "endurance",
    zone: "Z1",
    family: "recuperation",
    intent: "recuperation",
    sessionIntent: "recuperation",
    sessionSpecificity: "general",
    qualitySession: false,
    isKeySession: false,
  };

  if (obj === OBJECTIF_V1.EAU_LIBRE) {
    A = {
      ...A,
      sessionIntent: "eau_libre",
      family: "eau_libre",
      intent: "eau_libre",
      sessionSpecificity: "goal_specific",
    };
    B = {
      ...B,
      sessionIntent: resume ? "reprise" : "allure_progressive",
      family: "eau_libre",
      qualitySession: !resume,
      sessionSpecificity: resume ? "general" : "goal_specific",
    };
  } else if (obj === OBJECTIF_V1.TRIATHLON) {
    A = {
      ...A,
      sessionIntent: "triathlon",
      family: "specifique",
      intent: "triathlon",
      sessionSpecificity: "goal_specific",
    };
    B = {
      ...B,
      sessionIntent: resume ? "reprise" : "qualite",
      family: "specifique",
      qualitySession: !resume,
      sessionSpecificity: resume ? "general" : "race_specific",
    };
  } else if (stroke === "4n") {
    // A = tech multi-nages + corps plutôt crawl ; C = davantage de 4N dans le corps
    A = {
      ...A,
      sessionIntent: "quatre_nages",
      family: "technique",
      intent: "quatre_nages",
      sessionSpecificity: "stroke_focus",
    };
    B = {
      ...B,
      sessionSpecificity: "stroke_focus",
    };
    C = {
      ...C,
      sessionIntent: "quatre_nages",
      family: "technique",
      intent: "quatre_nages",
      sessionSpecificity: weekIndex % 2 === 0 ? "race_specific" : "stroke_focus",
    };
  } else if (resume) {
    A = {
      ...A,
      sessionIntent: "reprise",
      qualitySession: false,
      sessionSpecificity: "general",
      reprisePattern: "sensations",
    };
    B = {
      ...B,
      sessionIntent: "reprise",
      qualitySession: false,
      isKeySession: true,
      sessionSpecificity: "general",
      reprisePattern: weekIndex % 2 === 0 ? "volume" : "enchainement",
    };
    C = { ...C, sessionIntent: "recuperation", qualitySession: false, sessionSpecificity: "general" };
  } else {
    // Variété légère sur nager_progresser
    const cycle = ["general", "stroke_focus", "goal_specific"];
    A = { ...A, sessionSpecificity: cycle[weekIndex % 3] };
  }

  const templates = [A, B, C];
  const count = Math.max(1, n);
  const roles = Array.from({ length: count }, (_, i) => ({ ...templates[i % templates.length] }));

  let seenQuality = false;
  return roles.map((r) => {
    if (r.qualitySession) {
      if (seenQuality) {
        return {
          ...r,
          qualitySession: false,
          sessionIntent: "endurance",
          intent: "endurance",
        };
      }
      seenQuality = true;
    }
    return r;
  });
}

/**
 * Sportif 3×/sem : polarisation — A aérobie/tech · B une qualité (seuil/vitesse) · C endurance/spécifique.
 * Une seule qualitySession. Pas 3 séances dures.
 */
export function sportifWeekRoles(n, ctx = {}) {
  const obj = ctx.objectifV1 || "";
  const stroke = ctx.strokeFocus || "mixte";
  const resume = ctx.resumeMode || obj === OBJECTIF_V1.REPRENDRE;
  const weekIndex = Number(ctx.weekIndex) || 0;
  const phase = ctx.phase || "base";
  const isTestWeek = phase === "test" || ctx.typeSemaine === "test";
  /** @type {import('./race-quality.js').RaceWeekAnalysis|null} */
  let raceAnalysis = null;

  // Qualité B : seuil majoritaire ; vitesse ponctuelle (~1/3)
  const qualityIntent =
    phase === "taper"
      ? "allure_specifique"
      : weekIndex % 3 === 2
        ? "vitesse"
        : phase === "peak" || phase === "specifique"
          ? "allure_specifique"
          : "seuil";

  let A = {
    objectif: "endurance",
    zone: "Z2",
    family: "technique",
    intent: "technique_endurance",
    sessionIntent: "technique_endurance",
    sessionSpecificity: "general",
    qualitySession: false,
    isKeySession: false,
  };
  let B = {
    objectif: "endurance",
    zone: qualityIntent === "vitesse" ? "Z4" : "Z3",
    family: qualityIntent === "vitesse" ? "vitesse" : "seuil",
    intent: qualityIntent,
    sessionIntent: resume ? "reprise" : qualityIntent,
    sessionSpecificity: "general",
    qualitySession: !resume,
    isKeySession: true,
  };
  let C = {
    objectif: "endurance",
    zone: "Z2",
    family: "endurance",
    intent: "endurance",
    sessionIntent: "endurance",
    sessionSpecificity: "general",
    qualitySession: false,
    isKeySession: false,
  };

  if (isTestWeek && !resume) {
    B = {
      ...B,
      sessionIntent: "test",
      intent: "test",
      family: "test",
      zone: "Z3",
      qualitySession: true,
      isKeySession: true,
    };
  }

  if (obj === OBJECTIF_V1.EAU_LIBRE) {
    A = {
      ...A,
      sessionIntent: "eau_libre",
      family: "eau_libre",
      intent: "eau_libre",
      sessionSpecificity: "goal_specific",
    };
    B = {
      ...B,
      sessionIntent: resume ? "reprise" : weekIndex % 2 === 0 ? "allure_specifique" : "seuil",
      family: "eau_libre",
      qualitySession: !resume,
      sessionSpecificity: "goal_specific",
    };
    C = {
      ...C,
      sessionIntent: "eau_libre",
      family: "eau_libre",
      intent: "eau_libre",
      sessionSpecificity: "goal_specific",
    };
  } else if (obj === OBJECTIF_V1.TRIATHLON) {
    A = {
      ...A,
      sessionIntent: "triathlon",
      family: "specifique",
      intent: "triathlon",
      sessionSpecificity: "goal_specific",
    };
    B = {
      ...B,
      sessionIntent: resume ? "reprise" : "seuil",
      family: "specifique",
      qualitySession: !resume,
      sessionSpecificity: "race_specific",
    };
    C = {
      ...C,
      sessionIntent: "triathlon",
      family: "specifique",
      sessionSpecificity: "goal_specific",
    };
  } else if (obj === OBJECTIF_V1.COURSE_PISCINE) {
    // Polarisation : B = qualité / seuil / spécifique ; C = aérobie + touches allure course.
    // Évite deux grosses séances Z3 (B+C) sauf phase peak (spécificité plus soutenue).
    A = {
      ...A,
      sessionIntent: "aerobie",
      family: "endurance",
      intent: "aerobie",
      sessionSpecificity: "general",
    };
    B = {
      ...B,
      sessionIntent: resume ? "reprise" : phase === "peak" ? "allure_specifique" : "seuil",
      sessionSpecificity: "race_specific",
    };
    C = {
      ...C,
      sessionIntent: phase === "peak" && !resume ? "course_piscine" : "endurance",
      family: phase === "peak" && !resume ? "specifique" : "endurance",
      intent: phase === "peak" && !resume ? "course_piscine" : "endurance",
      zone: "Z2",
      sessionSpecificity: "race_specific",
      qualitySession: false,
      racePaceTouches: true,
    };

    // RaceTarget → RaceGap → QualityToDevelop (Sportif + course_piscine uniquement).
    // Données insuffisantes → rôles ci-dessus inchangés.
    raceAnalysis = analyzeRaceWeek(
      {
        raceTarget: ctx.raceTarget,
        currentTimeSec: ctx.currentTimeSec,
        recentBest: ctx.recentBest || ctx.recentBests,
        recentBests: ctx.recentBests,
        splits: ctx.splits,
        pace100: ctx.pace100,
        allowT100Projection: ctx.allowT100Projection,
        feedbackHints: ctx.feedbackHints,
        validatedTestAsTarget: ctx.validatedTestAsTarget,
      },
      ctx.raceEvidence || {},
    );
    // qualityToDevelop forcé (tests / coach) OU diagnostic actif
    const forced = ctx.qualityToDevelop
      ? {
          quality: ctx.qualityToDevelop,
          confidence: ctx.qualityConfidence || "high",
          reason: ctx.qualityReason || "forced_override",
          evidence: [],
        }
      : raceAnalysis.qualityToDevelop;
    if (forced && (raceAnalysis.active || ctx.qualityToDevelop) && !resume) {
      const applied = applyQualityToCourseRoles({
        A,
        B,
        C,
        qualityToDevelop: forced,
        phase,
        resume,
        capacity: ctx.capacity || null,
        isTestWeek,
      });
      A = applied.A;
      B = applied.B;
      C = applied.C;
      raceAnalysis = {
        ...raceAnalysis,
        qualityToDevelop: forced,
        active: true,
        rolesApplied: !!applied.applied,
        rolesNote: applied.note || null,
        devExplain: [
          raceAnalysis.devExplain,
          applied.applied
            ? `Roles adjusted for quality=${forced.quality}${applied.note ? ` (${applied.note})` : ""}`
            : "Roles kept default (quality not applied)",
          `Final: A=${A.sessionIntent} B=${B.sessionIntent} C=${C.sessionIntent}`,
        ].join("\n"),
      };
    }
  } else if (stroke === "4n") {
    A = {
      ...A,
      sessionIntent: "quatre_nages",
      family: "technique",
      intent: "quatre_nages",
      sessionSpecificity: "stroke_focus",
    };
    B = { ...B, sessionSpecificity: "stroke_focus" };
    C = {
      ...C,
      sessionIntent: "quatre_nages",
      family: "technique",
      intent: "quatre_nages",
      sessionSpecificity: weekIndex % 2 === 0 ? "race_specific" : "stroke_focus",
    };
  } else if (resume) {
    A = { ...A, sessionIntent: "reprise", qualitySession: false };
    B = { ...B, sessionIntent: "reprise", qualitySession: false, isKeySession: true };
    C = { ...C, sessionIntent: "aerobie", qualitySession: false };
  } else if (phase === "base") {
    A = { ...A, sessionIntent: "technique_endurance" };
    C = { ...C, sessionIntent: "aerobie" };
  } else if (phase === "taper") {
    A = { ...A, sessionIntent: "aerobie", zone: "Z1" };
    B = {
      ...B,
      sessionIntent: "allure_specifique",
      qualitySession: true,
      zone: "Z3",
    };
    C = { ...C, sessionIntent: "recuperation", zone: "Z1", family: "recuperation" };
  }

  const templates = [A, B, C];
  const count = Math.max(1, n);
  const roles = Array.from({ length: count }, (_, i) => ({ ...templates[i % templates.length] }));

  let seenQuality = false;
  const out = roles.map((r) => {
    if (r.qualitySession) {
      if (seenQuality) {
        return {
          ...r,
          qualitySession: false,
          sessionIntent: "aerobie",
          intent: "aerobie",
          zone: "Z2",
          family: "endurance",
        };
      }
      seenQuality = true;
    }
    return r;
  });

  // Debug DEV inspectable (non affiché user)
  if (raceAnalysis) {
    Object.defineProperty(out, "raceAnalysis", {
      value: raceAnalysis,
      enumerable: false,
      configurable: true,
    });
    for (const r of out) {
      r.raceDevExplain = raceAnalysis.devExplain;
      if (raceAnalysis.qualityToDevelop) {
        r.qualityToDevelop = raceAnalysis.qualityToDevelop.quality;
      }
    }
  }

  return out;
}
