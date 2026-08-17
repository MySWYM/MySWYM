/**
 * Tests Étape G — Taper + Race Week Performance
 * Usage : node src/lib/sports-engine/taper-load.test.js
 */
import {
  daysToCompetition,
  taperStageFromDays,
  resolveTaperLoad,
  resolvePerformanceStrategy,
  performanceWeekRoles,
  buildRaceDaySession,
  buildRaceResultStub,
  taperRacePaceTouch,
  arthurFitsTaper,
  TAPER_GOLD_SCENARIOS,
  composeSession,
  buildSportProfile,
  buildSessionBrief,
  assertVolumeConsistency,
} from "./index.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function dateInDays(n) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function rolesAt(days, extra = {}) {
  return performanceWeekRoles(extra.freq || 3, {
    objectifV1: extra.objectifV1 || "course_piscine",
    phase: "development",
    competitionDate: dateInDays(days),
    raceTarget: {
      distance: extra.distance || 200,
      stroke: extra.stroke || "crawl",
      targetTimeSec: extra.targetTimeSec || 120,
      source: "user",
      competitionDate: dateInDays(days),
    },
    currentTimeSec: extra.currentTimeSec || 126,
    sessionsPerWeek: extra.freq || 3,
    freq: extra.freq || 3,
    strokeFocus: extra.strokeFocus || "crawl",
    capacity: extra.capacity || { score: 0.75, confidence: 0.6 },
    ...extra,
  });
}

function weekVolume(roles, days, extra = {}) {
  let vol = 0;
  const abs = { Z1: 0, Z2: 0, Z3: 0, Z4: 0 };
  for (let i = 0; i < roles.length; i++) {
    const role = roles[i];
    if (role.isRaceDay) {
      const s = buildRaceDaySession({ raceTarget: extra.raceTarget || roles.performanceStrategy?.raceAnalysis?.target });
      continue;
    }
    if (role.isRestDay || role.sessionIntent === "repos") {
      continue;
    }
    const sport = buildSportProfile({
      level: "performance",
      goal: "course_piscine",
      category: "competition",
      pool: 50,
      sessionsPerWeek: roles.length,
      raceTarget: {
        distance: extra.distance || 200,
        stroke: "crawl",
        targetTimeSec: 120,
        source: "user",
        competitionDate: dateInDays(days),
      },
    });
    sport.objectifV1 = extra.objectifV1 || "course_piscine";
    const volumeTarget = Math.round(2600 * (roles.taperLoad?.volumeFactor || 1));
    const brief = buildSessionBrief({
      sport,
      weekCtx: {
        sport,
        volumePlan: {
          weekTarget: volumeTarget * roles.length,
          sessionTargets: Array(roles.length).fill(volumeTarget),
          lever: "volume",
          typeSemaine: "allegee",
        },
        maxZone: "Z4",
        phaseKey: "taper",
        why: "taper-test",
        _phaseName: "taper",
      },
      role: { ...role, performanceStrategy: roles.performanceStrategy, taperLoad: roles.taperLoad },
      weekIndex: 0,
      sessionIndex: i,
      durationTarget: 60,
      seed: `taper-${days}-${i}`,
    });
    brief.level = "performance";
    brief.sessionIntent = role.sessionIntent;
    brief.qualitySession = !!role.qualitySession;
    brief.taperLoad = roles.taperLoad;
    brief.taperShortQuality = !!role.taperShortQuality;
    brief.performanceStrategy = roles.performanceStrategy;
    brief.phase = "taper";
    brief.raceTarget = sport.raceTarget;
    const r = composeSession(brief);
    assert(r.ok, `compose d${days} si${i}: ${r.reason}`);
    if (r.session.isRaceDay || r.session.isRestDay) continue;
    vol += parseInt(String(r.session.distance).replace(/\D/g, ""), 10) || 0;
    const zv = r.session.absoluteMetersByZone || r.session.composerWhy?.zoneVolumes || {};
    for (const z of Object.keys(abs)) abs[z] += zv[z] || 0;
  }
  return { vol, abs };
}

assert(TAPER_GOLD_SCENARIOS.length >= 7, "gold taper");
assert(taperStageFromDays(21) === "s3", "s3");
assert(taperStageFromDays(14) === "s2", "s2");
assert(taperStageFromDays(7) === "s1", "s1");
assert(taperStageFromDays(3) === "race_week", "rw");
assert(taperStageFromDays(0) === "race_day", "race");
assert(taperRacePaceTouch(100).dist === 25, "touch 100");
assert(taperRacePaceTouch(200).dist === 50, "touch 200");
assert(taperRacePaceTouch(400).dist === 100, "touch 400");

assert(buildRaceResultStub({ resultTimeSec: null }) === null, "no invent result");
const stub = buildRaceResultStub({ distance: 200, stroke: "crawl", resultTimeSec: 124, targetTimeSec: 120 });
assert(stub.raceCompleted && stub.raceResult.deltaSec === 4, "stub delta");

assert(!arthurFitsTaper({ base_distance_m: 5000, details: [] }, { taperStage: "s1" }, 1200), "arthur reject huge");
assert(arthurFitsTaper({ base_distance_m: 1600, phases: ["taper"], details: ["-Z2"] }, { taperStage: "s1" }, 1200), "arthur ok");

// T1 — 3 semaines (S-3)
{
  const roles = rolesAt(21);
  assert(roles.taperLoad.taperStage === "s3", `t1 stage ${roles.taperLoad.taperStage}`);
  assert(roles.taperLoad.volumeFactor >= 0.9 && roles.taperLoad.volumeFactor <= 1, `t1 vol ${roles.taperLoad.volumeFactor}`);
  assert(roles.performanceStrategy.phase === "taper", "t1 phase");
  const { vol, abs } = weekVolume(roles, 21);
  assert(vol >= 4000, `t1 vol abs ${vol}`);
  assert(abs.Z3 + abs.Z4 > 0, "t1 keep some intensity");
}

// T2 — 2 semaines (S-2)
{
  const roles = rolesAt(14);
  assert(roles.taperLoad.taperStage === "s2", "t2");
  assert(roles.taperLoad.volumeFactor < 0.85, `t2 volF ${roles.taperLoad.volumeFactor}`);
  assert(roles.taperLoad.volumeFactor > rolesAt(7).taperLoad.volumeFactor, "t2 > t3 factor");
}

// T3 — 7 jours (S-1)
{
  const roles = rolesAt(7);
  assert(roles.taperLoad.taperStage === "s1", "t3");
  assert(roles.taperLoad.volumeFactor <= 0.55, `t3 ${roles.taperLoad.volumeFactor}`);
  const { vol, abs } = weekVolume(roles, 7);
  const s3 = weekVolume(rolesAt(21), 21);
  assert(vol < s3.vol * 0.75, `t3 volume down ${vol} vs ${s3.vol}`);
  assert(abs.Z3 + abs.Z4 < s3.abs.Z3 + s3.abs.Z4, "t3 intensity absolute down");
}

// T4 — 3 jours
{
  const roles = rolesAt(3);
  assert(roles.taperLoad.taperStage === "race_week", "t4");
  assert(roles.taperLoad.volumeFactor < 0.45, `t4 ${roles.taperLoad.volumeFactor}`);
  assert(roles.every((r) => r.sessionIntent !== "seuil" || r.taperShortQuality || r.qualitySession), "t4 no heavy seuil bare");
  const { vol, abs } = weekVolume(roles, 3);
  const s1 = weekVolume(rolesAt(7), 7);
  assert(vol < s1.vol, `t4 vol ${vol} < s1 ${s1.vol}`);
  assert(abs.Z3 + abs.Z4 <= s1.abs.Z3 + s1.abs.Z4, "t4 intensity abs not up");
}

// T5 — veille
{
  const roles = rolesAt(1, { freq: 3 });
  assert(roles.taperLoad.taperStage === "race_week", "t5");
  assert(roles.some((r) => r.sessionIntent === "recuperation" || r.sessionIntent === "repos" || r.taperRestPreferred || r.taperActivation), `t5 ${roles.map((r) => r.sessionIntent)}`);
  const training = roles.filter((r) => !r.isRestDay && r.sessionIntent !== "repos");
  assert(training.length <= 2, `t5 few trainings ${training.length}`);
}

// T6 — jour J
{
  const roles = rolesAt(0);
  assert(roles.taperLoad.taperStage === "race_day", "t6");
  assert(roles[0].isRaceDay || roles[0].sessionIntent === "race", "t6 race role");
  assert(roles.slice(1).every((r) => r.isRestDay || r.sessionIntent === "repos" || r.taperRestPreferred), "t6 rest slots");
  const s = buildRaceDaySession({
    raceTarget: { distance: 200, stroke: "crawl", targetTimeSec: 120, source: "user" },
  });
  assert(s.isRaceDay && s.type === "RACE", "t6 session");
  assert(s.volumeFromSets === 0, "t6 not training volume");
  assert(s.title === "Jour J", "t6 title");
  assert(s.details.some((d) => /échauffement/i.test(d)), "t6 warmup");
  assert(s.details.some((d) => /allure course/i.test(d)), "t6 race pace");
}

// T7 — 100 m
{
  const roles = rolesAt(7, { distance: 100, targetTimeSec: 60, currentTimeSec: 64 });
  assert(roles.performanceStrategy.primaryQuality === "race_pace", `t7 ${roles.performanceStrategy.primaryQuality}`);
  assert(taperRacePaceTouch(100).reps === 4, "t7 touch");
}

// T8 — 200 m
{
  const roles = rolesAt(14, { distance: 200 });
  assert(roles.taperLoad.taperStage === "s2", "t8");
}

// T9 — 400 m
{
  const roles = rolesAt(7, { distance: 400, targetTimeSec: 280, currentTimeSec: 300 });
  assert(roles.taperLoad.intensityRetention <= 0.55, "t9 int");
  assert(taperRacePaceTouch(400).dist === 100, "t9 100m touches");
}

// T10 — 1500
{
  const roles = rolesAt(21, { distance: 1500, targetTimeSec: 1200, currentTimeSec: 1260 });
  assert(roles.taperLoad.taperStage === "s3", "t10");
  assert(roles.taperLoad.volumeFactor >= 0.9, "t10 keep some volume early");
}

// T11 — 4N
{
  const roles = rolesAt(7, { distance: 200, stroke: "4n", strokeFocus: "4n", limitingStroke: "brasse" });
  assert(roles.performanceStrategy.devExplain.includes("entretenu") || roles.taperStage === "s1", "t11 no rebuild");
  assert(roles.performanceStrategy.primaryQuality === "race_pace", `t11 ${roles.performanceStrategy.primaryQuality}`);
}

// T12 — eau libre
{
  const roles = rolesAt(7, { objectifV1: "eau_libre", distance: 5000 });
  assert(roles.taperLoad.taperStage === "s1", "t12");
  assert(roles.taperLoad.volumeFactor < 0.6, "t12 vol down");
}

// T13 — triathlon
{
  const roles = rolesAt(7, { objectifV1: "triathlon" });
  assert(roles.taperLoad.taperStage === "s1", "t13");
}

// T14 — freq 2
{
  const roles = rolesAt(7, { freq: 2 });
  assert(roles.length === 2, "t14 len");
  assert(roles.taperLoad.volumeFactor > rolesAt(7, { freq: 4 }).taperLoad.volumeFactor - 0.01, "t14 freq effect");
}

// T15 — freq 3
{
  assert(rolesAt(7, { freq: 3 }).length === 3, "t15");
}

// T16 — freq 4+
{
  const roles = rolesAt(7, { freq: 4 });
  assert(roles.length === 4, "t16");
  assert(roles.taperLoad.densityFactor < 0.55, `t16 dens ${roles.taperLoad.densityFactor}`);
}

// Pas de surcharge : S-3 vol factor ≤ 1
{
  const load = resolveTaperLoad({
    competitionDate: dateInDays(21),
    raceTarget: { distance: 200, targetTimeSec: 120, source: "user", competitionDate: dateInDays(21) },
  });
  assert(load.volumeFactor <= 1, "no overload");
}

// Strategy sans date = pas de taper inventé
{
  const s = resolvePerformanceStrategy({
    objectifV1: "course_piscine",
    phase: "development",
    raceTarget: { distance: 200, stroke: "crawl", targetTimeSec: 120, source: "user" },
    currentTimeSec: 126,
  });
  assert(!s.taperStage, "no invent taper");
}

console.log("taper-load.test.js: OK");
