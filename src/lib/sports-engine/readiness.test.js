/**
 * Readiness V1, tests R1–R6
 * Usage : node src/lib/sports-engine/readiness.test.js
 */
import { estimateCapacity, buildSportProfile } from "./index.js";
import {
  estimateReadinessModifier,
  normalizeReadinessProfile,
} from "./readiness.js";
import {
  sportProfileToRow,
  rowToSportProfileFields,
} from "../sports-persistence/index.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function ok(cond, msg) {
  assert(cond, msg);
  console.log("  ✓", msg);
}

const longBreakBeginner = {
  activityLevel: "low",
  swimmingRecency: "long_break",
  currentFitness: "low",
  recoveryQuality: "normal",
  trainingCaution: true,
};

const fitAthlete = {
  activityLevel: "high",
  swimmingRecency: "current",
  currentFitness: "good",
  recoveryQuality: "good",
  trainingCaution: false,
};

const poorRecovery = {
  activityLevel: "moderate",
  swimmingRecency: "recent",
  currentFitness: "normal",
  recoveryQuality: "poor",
  trainingCaution: false,
};

console.log("R1 - ancien profil sans readiness → aucune régression");
{
  const base = { level: "sportif", goal: "progression" };
  const a = estimateCapacity(buildSportProfile(base), { completedSessions: 0 });
  const b = estimateCapacity(buildSportProfile({ ...base, readinessProfile: null }), {
    completedSessions: 0,
  });
  ok(a.score === b.score, "score identique");
  ok(a.confidence === b.confidence, "confidence identique");
  ok(a.volumeFactor === b.volumeFactor, "volumeFactor identique");
  ok(a.conservative === b.conservative, "conservative identique");
  ok(b.readiness == null, "readiness null");
}

console.log("R2 - débutant + long_break → progression douce");
{
  const sport = buildSportProfile({
    level: "découverte",
    goal: "progression",
    readinessProfile: longBreakBeginner,
  });
  const cap = estimateCapacity(sport, { completedSessions: 0 });
  const mod = estimateReadinessModifier(longBreakBeginner);
  ok(mod.volumeFactor < 1, "mod volumeFactor < 1");
  ok(mod.conservative === true, "mod conservative");
  ok(mod.technicalBias === true, "mod technicalBias");
  ok(cap.volumeFactor < 0.5 + 0.35 * 0.9, "cap volume plus bas que base découverte");
  ok(cap.conservative === true, "cap conservative");
  ok(cap.readiness?.applied === true, "readiness applied");
  ok(String(mod.reason).includes("long_break"), "reason long_break");
}

console.log("R3 - sportif + good recovery → pas de surcharge");
{
  const without = estimateCapacity(
    buildSportProfile({ level: "sportif", goal: "course_piscine" }),
    { completedSessions: 0 },
  );
  const withR = estimateCapacity(
    buildSportProfile({
      level: "sportif",
      goal: "course_piscine",
      readinessProfile: fitAthlete,
    }),
    { completedSessions: 0 },
  );
  const mod = estimateReadinessModifier(fitAthlete);
  ok(mod.volumeFactor === 1, "mod n'augmente pas le volume");
  ok(withR.volumeFactor <= without.volumeFactor + 0.001, "pas de surcharge volume");
  ok(withR.confidence >= without.confidence, "confiance ≥ baseline");
}

console.log("R4 - recovery poor → pas d'intensité haute via dims");
{
  const cap = estimateCapacity(
    buildSportProfile({ level: "régulier", goal: "progression", readinessProfile: poorRecovery }),
    { completedSessions: 0 },
  );
  const mod = estimateReadinessModifier(poorRecovery);
  ok(mod.intensitySoftCap === 0.42, "soft cap intensité");
  ok(cap.dimensions.intensityTolerance <= 0.42 + 0.01, "intensityTolerance plafonnée");
  ok(cap.conservative === true, "conservative");
  ok(String(mod.reason).includes("recovery_poor"), "reason recovery_poor");
  // Signal capacité : pas d'invitation à monter l'intensité
  ok(cap.dimensions.intensityTolerance < cap.dimensions.volumeTolerance + 0.05, "intensité ≤ volume");
}

console.log("R5 - feedback too_hard après readiness → feedback prioritaire");
{
  const readiness = longBreakBeginner;
  const soft = estimateCapacity(
    buildSportProfile({ level: "sportif", readinessProfile: readiness }),
    { completedSessions: 2, recentHard: 0 },
  );
  const hard = estimateCapacity(
    buildSportProfile({ level: "sportif", readinessProfile: readiness }),
    { completedSessions: 2, recentHard: 2 },
  );
  const hardOnly = estimateCapacity(
    buildSportProfile({ level: "sportif", readinessProfile: null }),
    { completedSessions: 2, recentHard: 2 },
  );
  ok(soft.readiness?.applied === true, "sans hard : readiness applied");
  ok(hard.readiness?.applied === false, "avec hard : readiness muté");
  ok(hard.score === hardOnly.score, "score = feedback seul");
  ok(hard.volumeFactor === hardOnly.volumeFactor, "volumeFactor = feedback seul");
}

console.log("R6 - reload Supabase → readiness conservé");
{
  const profile = {
    level: "sportif",
    goal: "progression",
    sessionsPerWeek: 3,
    readinessProfile: fitAthlete,
  };
  const row = sportProfileToRow("u-r6", profile);
  ok(row.readiness_profile?.activityLevel === "high", "row readiness_profile");
  const back = rowToSportProfileFields(row);
  ok(back.readinessProfile?.recoveryQuality === "good", "roundtrip recovery");
  ok(normalizeReadinessProfile(back.readinessProfile)?.swimmingRecency === "current", "normalize ok");
}

console.log("readiness.test.js: R1–R6 OK");
