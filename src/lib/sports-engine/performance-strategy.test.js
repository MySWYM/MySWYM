/**
 * Tests Étape F — PerformanceStrategy → WeekRoles → Session
 * Usage : node src/lib/sports-engine/performance-strategy.test.js
 */
import {
  resolvePerformanceStrategy,
  performanceWeekRoles,
  weeksToCompetition,
  horizonBandFromWeeks,
  qualitiesForRaceDistance,
  composeSession,
  buildSportProfile,
  buildSessionBrief,
  assertVolumeConsistency,
  validateSportifHard,
  isComposerEnabledForLevel,
  SESSION_COMPOSER_ENABLED_LEVELS,
  sportifWeekRoles,
  regulierWeekRoles,
  decouverteWeekRoles,
} from "./index.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function roleIntents(roles) {
  return roles.map((r) => r.sessionIntent).join("|");
}

function briefPerf(opts = {}) {
  const {
    sessionIntent = "aerobie",
    qualitySession = false,
    family = "endurance",
    volumeTarget = 2600,
    seed = "perf",
    strokeFocus = "crawl",
    objectif = "course_piscine",
    phase = "development",
    raceTarget = null,
    sessionSpecificity = null,
    racePaceTouches = false,
    performanceStrategy = null,
    limitingStroke = null,
    papillonMastered = false,
  } = opts;

  const sport = buildSportProfile({
    level: "performance",
    goal:
      objectif === "eau_libre"
        ? "open_water_5k"
        : objectif === "triathlon"
          ? "triathlon_olympique"
          : objectif === "course_piscine"
            ? "course_piscine"
            : "progression",
    category:
      objectif === "eau_libre"
        ? "open_water"
        : objectif === "triathlon"
          ? "triathlon"
          : objectif === "course_piscine"
            ? "competition"
            : "progression",
    pool: 50,
    sessionsPerWeek: 3,
    strokeFocus,
    papillonMastered,
    raceTarget: raceTarget || undefined,
  });
  sport.objectifV1 = objectif;
  sport.strokeFocus = strokeFocus;
  sport.papillonMastered = papillonMastered;

  const brief = buildSessionBrief({
    sport,
    weekCtx: {
      sport,
      volumePlan: {
        weekTarget: volumeTarget * 3,
        sessionTargets: [volumeTarget, volumeTarget, volumeTarget],
        lever: "volume",
        typeSemaine: "normale",
      },
      maxZone: "Z4",
      phaseKey: phase,
      why: "perf-test",
      _phaseName: phase,
    },
    role: {
      objectif: "endurance",
      zone: qualitySession ? "Z3" : "Z2",
      family,
      intent: sessionIntent,
      sessionIntent,
      qualitySession,
      isKeySession: qualitySession,
      sessionSpecificity,
      racePaceTouches,
      performanceStrategy,
      limitingStroke,
    },
    weekIndex: 0,
    sessionIndex: qualitySession ? 1 : 0,
    durationTarget: 70,
    seed,
  });
  brief.level = "performance";
  brief.sessionIntent = sessionIntent;
  brief.qualitySession = qualitySession;
  brief.strokeFocus = strokeFocus;
  brief.papillonMastered = papillonMastered;
  if (sessionSpecificity) brief.sessionSpecificity = sessionSpecificity;
  brief.racePaceTouches = racePaceTouches;
  brief.performanceStrategy = performanceStrategy;
  brief.phase = phase;
  if (raceTarget) brief.raceTarget = raceTarget;
  return brief;
}

function assertPerfSession(session, brief) {
  assert(session.sets?.length >= 3, "sets");
  assert(/^Performance ·/.test(session.title), `title ${session.title}`);
  const cons = assertVolumeConsistency({
    sets: session.sets,
    details: session.details,
    announcedDistance: session.distance,
  });
  assert(cons.ok, `volume: ${cons.errors.join("; ")}`);
  const hard = validateSportifHard(session, {
    papillonOk: !!brief.papillonMastered,
    allowPaces: !!brief.allowPaces,
    intentId: brief.sessionIntent,
  });
  assert(hard.ok, `hard: ${hard.errors.join("; ")}`);
}

assert(SESSION_COMPOSER_ENABLED_LEVELS.includes("performance"), "flag");
assert(isComposerEnabledForLevel("performance"), "enabled");

const in8w = new Date(Date.now() + 10 * 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
const in5w = new Date(Date.now() + 5 * 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
const in3w = new Date(Date.now() + 3 * 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
const in1w = new Date(Date.now() + 1 * 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);

assert(horizonBandFromWeeks(10) === "far", "horizon far");
assert(horizonBandFromWeeks(5) === "build_specific", "horizon 4-8");
assert(horizonBandFromWeeks(3) === "specific_dominant", "horizon 2-4");
assert(horizonBandFromWeeks(1) === "pre_race", "horizon <2");
assert(qualitiesForRaceDistance(100).includes("specific_speed"), "100 qualities");
assert(qualitiesForRaceDistance(800).includes("aerobic_capacity"), "800 qualities");
assert(!qualitiesForRaceDistance(800).includes("specific_speed"), "800 no speed");

// 1 — Performance 100 déficit vitesse
{
  const roles = performanceWeekRoles(3, {
    objectifV1: "course_piscine",
    phase: "development",
    raceTarget: { distance: 100, stroke: "crawl", targetTimeSec: 60, source: "user" },
    recentBest: { 50: 33, 100: 68 },
    currentTimeSec: 68,
    capacity: { score: 0.8, confidence: 0.6 },
  });
  assert(roles.performanceStrategy.primaryQuality === "specific_speed", `t1 ${roles.performanceStrategy.primaryQuality}`);
  assert(roles[1].sessionIntent === "vitesse", `t1 B ${roles[1].sessionIntent}`);
  assert(roles[2].racePaceTouches, "t1 C touches");
  const r = composeSession(
    briefPerf({
      sessionIntent: roles[1].sessionIntent,
      qualitySession: true,
      family: "vitesse",
      seed: "t1",
      raceTarget: { distance: 100, stroke: "crawl", targetTimeSec: 60, source: "user" },
      performanceStrategy: roles.performanceStrategy,
    }),
  );
  assert(r.ok, `t1 compose ${r.reason}`);
  assertPerfSession(r.session, briefPerf({ sessionIntent: "vitesse", qualitySession: true }));
}

// 2 — Performance 200 déficit endurance
{
  const roles = performanceWeekRoles(3, {
    objectifV1: "course_piscine",
    phase: "development",
    raceTarget: { distance: 200, stroke: "crawl", targetTimeSec: 120, source: "user" },
    recentBest: { 50: 28, 200: 132 },
    currentTimeSec: 132,
    capacity: { score: 0.75, confidence: 0.6 },
  });
  assert(
    ["specific_endurance", "threshold"].includes(roles.performanceStrategy.primaryQuality),
    `t2 ${roles.performanceStrategy.primaryQuality}`,
  );
  assert(["seuil", "allure_specifique"].includes(roles[1].sessionIntent), `t2 B ${roles[1].sessionIntent}`);
}

// 3 — Performance 400
{
  const s = resolvePerformanceStrategy({
    objectifV1: "course_piscine",
    phase: "development",
    raceTarget: { distance: 400, stroke: "crawl", targetTimeSec: 280, source: "user" },
    currentTimeSec: 300,
  });
  assert(["aerobic_capacity", "threshold", "specific_endurance", "race_pace"].includes(s.primaryQuality), `t3 ${s.primaryQuality}`);
  assert(!["speed", "specific_speed"].includes(s.primaryQuality), "t3 no speed");
}

// 4 — Performance 800
{
  const roles = performanceWeekRoles(3, {
    objectifV1: "course_piscine",
    phase: "base",
    raceTarget: { distance: 800, stroke: "crawl", targetTimeSec: 600, source: "user" },
    currentTimeSec: 640,
  });
  assert(!["vitesse"].includes(roles[1].sessionIntent) || roles.performanceStrategy.primaryQuality !== "speed", "t4");
  assert(["aerobic_capacity", "threshold", "specific_endurance", "race_pace"].includes(roles.performanceStrategy.primaryQuality), `t4 ${roles.performanceStrategy.primaryQuality}`);
}

// 5 — Performance 1500
{
  const s = resolvePerformanceStrategy({
    objectifV1: "course_piscine",
    phase: "development",
    raceTarget: { distance: 1500, stroke: "crawl", targetTimeSec: 1200, source: "user" },
  });
  assert(s.primaryQuality === "aerobic_capacity" || s.confidence === "low", `t5 ${s.primaryQuality}`);
  assert(s.devExplain.includes("insufficient") || s.devExplain.includes("prudent") || s.devExplain.includes("RaceGap"), "t5 explain");
}

// 6 — Performance 200 4N nage limitante
{
  const roles = performanceWeekRoles(3, {
    objectifV1: "course_piscine",
    phase: "development",
    strokeFocus: "4n",
    raceTarget: { distance: 200, stroke: "4n", targetTimeSec: 150, source: "user" },
    currentTimeSec: 160,
    limitingStroke: "brasse",
  });
  assert(roles.performanceStrategy.primaryQuality === "weak_stroke", `t6 ${roles.performanceStrategy.primaryQuality}`);
  assert(roles.performanceStrategy.limitingStroke === "brasse", "t6 stroke");
  assert(/quatre_nages|technique/.test(roles[0].sessionIntent + roles[1].sessionIntent), `t6 roles ${roleIntents(roles)}`);
}

// 7 — Performance eau libre
{
  const roles = performanceWeekRoles(3, {
    objectifV1: "eau_libre",
    phase: "development",
    competitionDate: in5w,
  });
  assert(
    ["aerobic_capacity", "open_water_specificity", "threshold", "race_pace", "sighting"].includes(
      roles.performanceStrategy.primaryQuality,
    ),
    `t7 ${roles.performanceStrategy.primaryQuality}`,
  );
  assert(roles.some((r) => r.sessionIntent === "eau_libre" || r.family === "eau_libre"), `t7 ${roleIntents(roles)}`);
}

// 8 — Performance triathlon
{
  const roles = performanceWeekRoles(3, {
    objectifV1: "triathlon",
    phase: "development",
  });
  assert(["aerobic_capacity", "economy", "threshold", "race_pace"].includes(roles.performanceStrategy.primaryQuality), `t8 ${roles.performanceStrategy.primaryQuality}`);
  assert(roles.some((r) => r.sessionIntent === "triathlon"), `t8 ${roleIntents(roles)}`);
}

// 9 — avec chrono
{
  const s = resolvePerformanceStrategy({
    objectifV1: "course_piscine",
    phase: "development",
    raceTarget: { distance: 200, stroke: "crawl", targetTimeSec: 120, source: "user" },
    currentTimeSec: 126,
  });
  assert(s.raceAnalysis?.gap?.status === "ok", "t9 gap");
  assert(s.raceAnalysis?.qualityToDevelop, "t9 qtd");
  assert(s.devExplain.includes("Gap:"), "t9 explain gap");
}

// 10 — sans chrono
{
  const s = resolvePerformanceStrategy({
    objectifV1: "course_piscine",
    phase: "development",
    raceTarget: { distance: 200, stroke: "crawl", targetTimeSec: 120, source: "user", competitionDate: in8w },
  });
  assert(s.confidence === "low", `t10 conf ${s.confidence}`);
  assert(s.primaryQuality === "aerobic_capacity" || s.primaryQuality === "threshold" || s.primaryQuality === "race_pace" || s.primaryQuality === "technical_efficiency", `t10 ${s.primaryQuality}`);
  const roles = performanceWeekRoles(3, {
    objectifV1: "course_piscine",
    phase: "development",
    raceTarget: { distance: 200, stroke: "crawl", targetTimeSec: 120, source: "user" },
  });
  assert(roles.length === 3, "t10 week");
  assert(roles.filter((r) => r.qualitySession).length <= 1, "t10 one quality");
}

// 11 — multi-splits
{
  const s = resolvePerformanceStrategy({
    objectifV1: "course_piscine",
    phase: "development",
    raceTarget: { distance: 200, stroke: "crawl", targetTimeSec: 120, source: "user" },
    recentBest: { 50: 28, 100: 62, 200: 132 },
    currentTimeSec: 132,
  });
  assert(s.primaryQuality === "specific_endurance", `t11 ${s.primaryQuality}`);
  assert(["high", "medium"].includes(s.confidence), `t11 conf ${s.confidence}`);
}

// 12 — gap important + bonne capacité → spécifique
{
  const s = resolvePerformanceStrategy({
    objectifV1: "course_piscine",
    phase: "development",
    raceTarget: { distance: 200, stroke: "crawl", targetTimeSec: 120, source: "user" },
    currentTimeSec: 140,
    capacity: { score: 0.85, confidence: 0.7 },
  });
  assert(["specific_endurance", "threshold", "race_pace"].includes(s.primaryQuality), `t12 ${s.primaryQuality}`);
}

// 13 — gap faible
{
  const s = resolvePerformanceStrategy({
    objectifV1: "course_piscine",
    phase: "development",
    raceTarget: { distance: 200, stroke: "crawl", targetTimeSec: 120, source: "user" },
    currentTimeSec: 122,
  });
  assert(s.raceAnalysis.gap.gapSec === 2, "t13 gap");
  assert(s.primaryQuality, "t13 primary");
}

// 14 — échéance >8 semaines
{
  const s = resolvePerformanceStrategy({
    objectifV1: "course_piscine",
    phase: "development",
    raceTarget: {
      distance: 100,
      stroke: "crawl",
      targetTimeSec: 60,
      source: "user",
      competitionDate: in8w,
    },
    currentTimeSec: 68,
    recentBest: { 50: 33, 100: 68 },
    capacity: { score: 0.5, confidence: 0.4, conservative: true },
  });
  assert(s.horizonBand === "far", `t14 band ${s.horizonBand}`);
  // capacité bloque speed même si diagnostic speed
  assert(s.primaryQuality !== "specific_speed" && s.primaryQuality !== "speed", `t14 ${s.primaryQuality}`);
}

// 15 — échéance 4–8 semaines
{
  const s = resolvePerformanceStrategy({
    objectifV1: "course_piscine",
    phase: "development",
    competitionDate: in5w,
    raceTarget: { distance: 200, stroke: "crawl", targetTimeSec: 120, source: "user", competitionDate: in5w },
  });
  assert(s.horizonBand === "build_specific", `t15 ${s.horizonBand}`);
}

// 16 — échéance 2–4 semaines
{
  const s = resolvePerformanceStrategy({
    objectifV1: "course_piscine",
    phase: "development",
    competitionDate: in3w,
    raceTarget: { distance: 200, stroke: "crawl", targetTimeSec: 120, source: "user", competitionDate: in3w },
  });
  assert(s.horizonBand === "specific_dominant", `t16 ${s.horizonBand}`);
}

// Compose semaine complète 200
{
  const roles = performanceWeekRoles(3, {
    objectifV1: "course_piscine",
    phase: "development",
    raceTarget: { distance: 200, stroke: "crawl", targetTimeSec: 120, source: "user" },
    currentTimeSec: 126,
  });
  for (let i = 0; i < 3; i++) {
    const brief = briefPerf({
      sessionIntent: roles[i].sessionIntent,
      qualitySession: roles[i].qualitySession,
      family: roles[i].family,
      seed: `week-${i}`,
      sessionSpecificity: roles[i].sessionSpecificity,
      racePaceTouches: roles[i].racePaceTouches,
      performanceStrategy: roles.performanceStrategy,
      volumeTarget: 2500 + i * 50,
    });
    const r = composeSession(brief);
    assert(r.ok, `week si${i}: ${r.reason}`);
    assertPerfSession(r.session, brief);
  }
  assert(roles.performanceStrategy.devExplain.includes("Primary:"), "strategy explain");
}

// Non-régression niveaux
{
  assert(roleIntents(sportifWeekRoles(3, { objectifV1: "nager_progresser", phase: "base" })) === "technique_endurance|seuil|aerobie", "np");
  assert(sportifWeekRoles(3, { objectifV1: "course_piscine", phase: "base" })[2].racePaceTouches, "cp C");
  assert(regulierWeekRoles(3, { objectifV1: "nager_progresser" }).length === 3, "reg");
  assert(decouverteWeekRoles(3).length === 3, "dec");
}

console.log("performance-strategy.test.js: OK");
