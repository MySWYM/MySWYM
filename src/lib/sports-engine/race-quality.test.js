/**
 * Tests RaceTarget → RaceGap → QualityToDevelop → WeekRoles
 * Usage : node src/lib/sports-engine/race-quality.test.js
 */
import {
  normalizeRaceTarget,
  resolveRaceTarget,
  computeRaceGap,
  resolveQualityToDevelop,
  analyzeRaceWeek,
  applyQualityToCourseRoles,
  sportifWeekRoles,
  regulierWeekRoles,
  decouverteWeekRoles,
  RACE_DECISION_PRIORITY,
} from "./index.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function roleIntents(roles) {
  return roles.map((r) => r.sessionIntent).join("|");
}

const target200 = normalizeRaceTarget({
  distance: 200,
  stroke: "crawl",
  targetTimeSec: 120,
  source: "user",
});
const target100 = normalizeRaceTarget({
  distance: 100,
  stroke: "crawl",
  targetTimeSec: 60,
  source: "user",
});

assert(target200 && target200.targetTimeSec === 120, "normalize 200");
assert(resolveRaceTarget({ raceTarget: target200 })?.distance === 200, "resolve profile");
assert(resolveRaceTarget({}) === null, "no invent");
assert(RACE_DECISION_PRIORITY[0] === "safety_constraints", "priority");

// --- Test 1 : target + current, gap clair ---
{
  const gap = computeRaceGap(target200, { currentTimeSec: 126 });
  assert(gap.status === "ok", "t1 ok");
  assert(gap.gapSec === 6, `t1 gap ${gap.gapSec}`);
  assert(gap.direction === "behind", "t1 behind");
  const q = resolveQualityToDevelop(target200, gap, { currentTimeSec: 126 });
  assert(q?.quality === "specific_endurance", `t1 quality ${q?.quality}`);
  assert(q.confidence === "low", `t1 conf ${q.confidence} (level1 only)`);
}

// --- Test 2 : gap faible ---
{
  const gap = computeRaceGap(target200, { currentTimeSec: 122 });
  assert(gap.status === "ok" && gap.gapSec === 2, "t2 gap");
  const q = resolveQualityToDevelop(target200, gap, {});
  assert(["threshold", "race_pace", "specific_endurance"].includes(q.quality), `t2 ${q.quality}`);
  assert(q.confidence === "low", "t2 low");
}

// --- Test 3 : gap important ---
{
  const gap = computeRaceGap(target200, { currentTimeSec: 140 });
  assert(gap.gapPct >= 0.15, `t3 pct ${gap.gapPct}`);
  const q = resolveQualityToDevelop(target200, gap, {});
  assert(q.quality === "specific_endurance", `t3 ${q.quality}`);
}

// --- Test 4 : données insuffisantes ---
{
  const gap = computeRaceGap(target200, {});
  assert(gap.status === "insufficient_data", "t4 gap");
  const q = resolveQualityToDevelop(target200, gap, {});
  assert(q === null, "t4 no quality");
  const analysis = analyzeRaceWeek({ raceTarget: target200 });
  assert(!analysis.active, "t4 inactive");
  const roles = sportifWeekRoles(3, {
    objectifV1: "course_piscine",
    strokeFocus: "crawl",
    phase: "base",
    raceTarget: target200,
    // pas de current
  });
  assert(roleIntents(roles) === "aerobie|seuil|endurance", `t4 default roles ${roleIntents(roles)}`);
}

// --- Test 5 : multi-chronos vitesse vs endurance ---
{
  // Court OK, long faible → specific_endurance
  const gap = computeRaceGap(target200, { recentBest: { 200: 132 } });
  const qEnd = resolveQualityToDevelop(target200, gap, {
    recentBest: { 50: 28, 200: 132 }, // 50 pace 56/100, target 60/100 → short ahead; 200 pace 66
  });
  assert(qEnd.quality === "specific_endurance", `t5 end ${qEnd.quality}`);
  assert(qEnd.confidence === "high", `t5 end conf ${qEnd.confidence}`);

  // Court faible → specific_speed
  const gapSp = computeRaceGap(target100, { recentBest: { 100: 68 } });
  const qSp = resolveQualityToDevelop(target100, gapSp, {
    recentBest: { 50: 33, 100: 68 }, // short lag
  });
  assert(qSp.quality === "specific_speed", `t5 speed ${qSp.quality}`);
}

// --- Test 6 : T100 disponible ---
{
  const gap = computeRaceGap(target200, { recentBest: { 200: 128 } });
  const q = resolveQualityToDevelop(target200, gap, {
    pace100: 58, // meilleur que target pace 60 → T100 OK + gap 200 → endurance
    recentBest: { 200: 128 },
  });
  assert(q.quality === "specific_endurance", `t6 ${q.quality}`);
  assert(["medium", "high"].includes(q.confidence), `t6 conf ${q.confidence}`);
}

// --- Test 7 : quality = threshold → B seuil ---
{
  const roles = sportifWeekRoles(3, {
    objectifV1: "course_piscine",
    phase: "base",
    raceTarget: target200,
    currentTimeSec: 126,
    qualityToDevelop: "threshold",
  });
  assert(roles[1].sessionIntent === "seuil", `t7 B ${roles[1].sessionIntent}`);
  assert(roles[1].qualitySession, "t7 quality");
  assert(roles[2].racePaceTouches, "t7 C touches");
  assert(roles.raceAnalysis?.devExplain?.includes("threshold"), "t7 explain");
}

// --- Test 8 : specific_endurance ---
{
  const roles = sportifWeekRoles(3, {
    objectifV1: "course_piscine",
    phase: "base",
    raceTarget: target200,
    currentTimeSec: 126,
    qualityToDevelop: "specific_endurance",
  });
  assert(["seuil", "allure_specifique"].includes(roles[1].sessionIntent), `t8 B ${roles[1].sessionIntent}`);
  assert(roles[2].sessionIntent === "endurance", `t8 C ${roles[2].sessionIntent}`);
  assert(roles[2].racePaceTouches, "t8 touches");
}

// --- Test 9 : specific_speed ---
{
  const roles = sportifWeekRoles(3, {
    objectifV1: "course_piscine",
    phase: "development",
    raceTarget: target100,
    currentTimeSec: 64,
    qualityToDevelop: "specific_speed",
    capacity: { score: 0.75, confidence: 0.6 },
  });
  assert(roles[1].sessionIntent === "vitesse", `t9 B ${roles[1].sessionIntent}`);
  assert(roles[1].zone === "Z4", "t9 Z4");
  assert(roles[2].sessionIntent === "endurance", "t9 C controlled");
  assert(roles[2].racePaceTouches, "t9 touches");
}

// --- Test 10 : phase peak/specific + quality ---
{
  const roles = sportifWeekRoles(3, {
    objectifV1: "course_piscine",
    phase: "peak",
    raceTarget: target200,
    currentTimeSec: 126,
    qualityToDevelop: "specific_endurance",
  });
  assert(roles[1].sessionIntent === "allure_specifique", `t10 B ${roles[1].sessionIntent}`);
  // Peak + specific_endurance → C peut être plus spécifique
  assert(["endurance", "course_piscine"].includes(roles[2].sessionIntent), `t10 C ${roles[2].sessionIntent}`);
  assert(roles.raceAnalysis?.rolesApplied, "t10 applied");
}

// Capacité bloque vitesse
{
  const roles = sportifWeekRoles(3, {
    objectifV1: "course_piscine",
    phase: "development",
    qualityToDevelop: "specific_speed",
    raceTarget: target100,
    currentTimeSec: 70,
    capacity: { score: 0.4, conservative: true },
  });
  assert(roles[1].sessionIntent === "seuil", `cap block ${roles[1].sessionIntent}`);
  assert(roles.raceAnalysis?.rolesNote?.includes("capacity"), `note ${roles.raceAnalysis?.rolesNote}`);
}

// applyQualityToCourseRoles unitaire
{
  const base = {
    A: { sessionIntent: "aerobie" },
    B: { sessionIntent: "seuil", qualitySession: true },
    C: { sessionIntent: "endurance" },
  };
  const r = applyQualityToCourseRoles({
    ...base,
    qualityToDevelop: { quality: "race_pace", confidence: "medium", reason: "x", evidence: [] },
    phase: "base",
    resume: false,
  });
  assert(r.B.sessionIntent === "allure_specifique", "unit race_pace");
}

// --- Non-régression ---
{
  const np = sportifWeekRoles(3, { objectifV1: "nager_progresser", phase: "base", weekIndex: 0 });
  assert(roleIntents(np) === "technique_endurance|seuil|aerobie", `np ${roleIntents(np)}`);

  const ow = sportifWeekRoles(3, { objectifV1: "eau_libre", phase: "base", weekIndex: 0 });
  assert(ow[0].sessionIntent === "eau_libre", "ow A");
  assert(!ow.raceAnalysis, "ow no race analysis");

  const tri = sportifWeekRoles(3, { objectifV1: "triathlon", phase: "base" });
  assert(tri[0].sessionIntent === "triathlon", "tri");

  const reg = regulierWeekRoles(3, { objectifV1: "course_piscine", strokeFocus: "crawl" });
  assert(reg.length === 3, "regulier");
  assert(typeof reg.raceAnalysis === "undefined", "regulier no race");

  const dec = decouverteWeekRoles(3);
  assert(dec.length === 3, "decouverte");
}

// Course sans raceTarget = défaut polarisé (inchangé)
{
  const roles = sportifWeekRoles(3, { objectifV1: "course_piscine", phase: "base" });
  assert(roleIntents(roles) === "aerobie|seuil|endurance", `default cp ${roleIntents(roles)}`);
}

console.log("race-quality.test.js: OK");
