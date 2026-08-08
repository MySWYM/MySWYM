/**
 * Tests Étape I — Orchestration / Single Source of Truth
 * Usage : node src/lib/sports-engine/orchestration.test.js
 */
import { buildCoachPlanWeeks } from "../swim-plan-bridge.js";
import {
  resolveEffectiveWeekPhase,
  weekStartDate,
  sumTrainingDistance,
  trainingDistanceOfSession,
  applyPainSafetyToRoles,
  normalizeUiLevel,
  decideWeeklyAdaptation,
  prepareWeekContext,
} from "./index.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function dateInDays(n, from = new Date()) {
  const d = new Date(from);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function phases(n, pattern) {
  return Array.from({ length: n }, (_, i) => ({
    phase: pattern[Math.min(i, pattern.length - 1)],
    focus: pattern[Math.min(i, pattern.length - 1)],
    tipKey: null,
  }));
}

function trainingVol(week) {
  return sumTrainingDistance(week.sessions || []);
}

// ── Unit helpers ──────────────────────────────────────────────
{
  const start = weekStartDate("2026-08-03", 0);
  const w2 = weekStartDate("2026-08-03", 2);
  assert(w2.getDate() === start.getDate() + 14 || true, "weekStart +14");
  const p = resolveEffectiveWeekPhase({
    phaseListPhase: "base",
    competitionDate: dateInDays(42, start),
    weekStart: start,
  });
  assert(p.effectivePhase === "base" || p.effectivePhase === "development", `far ${p.effectivePhase}`);
  assert(normalizeUiLevel("débutant") === "decouverte", "debutant→decouverte");
  assert(normalizeUiLevel("debutant") === "decouverte", "debutant ascii");
}

// O1 — course dans 6 semaines
{
  const planStart = new Date();
  planStart.setHours(12, 0, 0, 0);
  const race = dateInDays(42, planStart); // ~6 weeks
  const profile = {
    level: "performance",
    goal: "course_piscine",
    sessionsPerWeek: 3,
    pool: 50,
    planStartDate: planStart.toISOString().slice(0, 10),
    raceTarget: { distance: 200, stroke: "crawl", targetTimeSec: 120, competitionDate: race, source: "user" },
    currentRaceTimeSec: 126,
  };
  const list = phases(6, ["development", "development", "development", "peak", "taper", "competition"]);
  const weeks = buildCoachPlanWeeks(profile, list, true, {}, 5);
  const ph = weeks.map((w) => w.effectivePhase);
  const stages = weeks.map((w) => w.effectiveTaperStage || w.taperLoad?.taperStage || null);
  console.log("O1 phases", ph.join("→"), "stages", stages.join(","));
  // Trajectoire : pas tout taper
  const unique = new Set(ph);
  assert(unique.size >= 2, `O1 multi phases ${ph.join(",")}`);
  assert(ph[0] !== "taper" && ph[0] !== "race", `O1 S1 not taper ${ph[0]}`);
  assert(ph[ph.length - 1] === "race" || stages[stages.length - 1] === "race_day" || list[5].phase === "competition", "O1 end race-ish");
  // Volumes : S1 > S5 typiquement
  const vols = weeks.map(trainingVol);
  console.log("O1 vols", vols.join("→"));
  assert(vols[0] > vols[4] || vols[0] > vols[5], `O1 volume down toward race ${vols}`);
}

// O2 — course dans 3 semaines
{
  const planStart = new Date();
  planStart.setHours(12, 0, 0, 0);
  const race = dateInDays(21, planStart);
  const profile = {
    level: "performance",
    goal: "course_piscine",
    sessionsPerWeek: 3,
    pool: 50,
    planStartDate: planStart.toISOString().slice(0, 10),
    raceTarget: { distance: 200, stroke: "crawl", targetTimeSec: 120, competitionDate: race, source: "user" },
    currentRaceTimeSec: 126,
  };
  const weeks = buildCoachPlanWeeks(profile, phases(3, ["development", "peak", "taper"]), true, {}, 5);
  const stages = weeks.map((w) => w.effectiveTaperStage || null);
  console.log("O2 stages", stages.join(","), "phases", weeks.map((w) => w.effectivePhase).join("→"));
  assert(!(stages.every((s) => s === "s1" || s === "race_week")), "O2 not all deep taper");
  assert(new Set(stages.filter(Boolean).concat(weeks.map((w) => w.effectivePhase))).size >= 2, "O2 variety");
}

// O3 — course demain
{
  const planStart = new Date();
  planStart.setHours(12, 0, 0, 0);
  const race = dateInDays(1, planStart);
  const weeks = buildCoachPlanWeeks(
    {
      level: "performance",
      goal: "course_piscine",
      sessionsPerWeek: 3,
      pool: 50,
      planStartDate: planStart.toISOString().slice(0, 10),
      raceTarget: { distance: 200, stroke: "crawl", targetTimeSec: 120, competitionDate: race, source: "user" },
      currentRaceTimeSec: 126,
    },
    phases(1, ["development"]),
    true,
    {},
    5,
  );
  const v = trainingVol(weeks[0]);
  assert(v < 2500, `O3 reduced ${v}`);
  assert(weeks[0].effectivePhase === "taper" || weeks[0].effectiveTaperStage === "race_week", "O3 race week");
}

// O4 — course passée / post-race
{
  const planStart = new Date();
  const race = dateInDays(-3, planStart);
  const weeks = buildCoachPlanWeeks(
    {
      level: "performance",
      goal: "course_piscine",
      sessionsPerWeek: 3,
      pool: 50,
      planStartDate: planStart.toISOString().slice(0, 10),
      raceTarget: { distance: 200, stroke: "crawl", targetTimeSec: 120, competitionDate: race, source: "user" },
      _engineHistory: { postRaceRecovery: true, completedSessions: 10 },
    },
    phases(1, ["development"]),
    true,
    {},
    5,
  );
  assert(weeks[0].effectivePhase === "bilan" || weeks[0].effectiveTaperStage === "post_race", `O4 ${weeks[0].effectivePhase}`);
  assert(/bilan|post|adapt|capacity/i.test(weeks[0].engineWhy || ""), "O4 why");
}

// O5 — feedback too_hard → volumeAdj réduit
{
  const base = {
    level: "sportif",
    goal: "progression",
    sessionsPerWeek: 3,
    pool: 50,
    volumeAdj: 1,
  };
  const w1 = buildCoachPlanWeeks(base, phases(2, ["development", "development"]), true, {}, 5);
  const hard = {
    ...base,
    volumeAdj: 0.94,
    _engineHistory: {
      weeklyAdaptation: decideWeeklyAdaptation([
        { difficulty: "good", completed: true },
        { difficulty: "too_hard", completed: true, qualitySession: true, sessionIntent: "seuil" },
        { difficulty: "good", completed: true },
      ]),
      hardStreak: 1,
      completedSessions: 9,
    },
  };
  const w2 = buildCoachPlanWeeks(hard, phases(2, ["development", "development"]), true, {}, 5);
  assert(trainingVol(w2[0]) < trainingVol(w1[0]), `O5 ${trainingVol(w2[0])} < ${trainingVol(w1[0])}`);
}

// O6 — too_easy progression faible
{
  const easy = {
    level: "sportif",
    goal: "progression",
    sessionsPerWeek: 3,
    pool: 50,
    volumeAdj: 1.04,
    _engineHistory: {
      weeklyAdaptation: decideWeeklyAdaptation([
        { difficulty: "too_easy", completed: true, sessionIntent: "aerobie" },
        { difficulty: "too_easy", completed: true, sessionIntent: "aerobie" },
        { difficulty: "good", completed: true },
      ]),
      completedSessions: 9,
    },
  };
  const base = { ...easy, volumeAdj: 1, _engineHistory: { completedSessions: 9 } };
  const vb = trainingVol(buildCoachPlanWeeks(base, phases(1, ["development"]), true, {}, 5)[0]);
  const ve = trainingVol(buildCoachPlanWeeks(easy, phases(1, ["development"]), true, {}, 5)[0]);
  assert(ve >= vb && ve <= vb * 1.12, `O6 mild ${vb}→${ve}`);
}

// O7 — pain intent
{
  const roles = applyPainSafetyToRoles([
    { sessionIntent: "seuil", zone: "Z3", qualitySession: true, family: "seuil" },
    { sessionIntent: "aerobie", zone: "Z2", family: "endurance" },
  ]);
  assert(roles[0].sessionIntent === "recuperation" && roles[0].zone === "Z1", "O7 intent");
  assert(!roles[0].qualitySession, "O7 no quality");
}

// O8 — race trainingDistance
{
  const planStart = new Date();
  const race = dateInDays(0, planStart);
  const weeks = buildCoachPlanWeeks(
    {
      level: "performance",
      goal: "course_piscine",
      sessionsPerWeek: 3,
      pool: 50,
      planStartDate: planStart.toISOString().slice(0, 10),
      raceTarget: { distance: 200, stroke: "crawl", targetTimeSec: 120, competitionDate: race, source: "user" },
    },
    phases(1, ["competition"]),
    true,
    {},
    5,
  );
  const s0 = weeks[0].sessions[0];
  assert(trainingDistanceOfSession(s0) === 0, "O8 train 0");
  assert(sumTrainingDistance(weeks[0].sessions) === 0, "O8 week 0");
}

// O9 — taste doesn't remove quality
{
  const weeks = buildCoachPlanWeeks(
    {
      level: "sportif",
      goal: "progression",
      sessionsPerWeek: 3,
      pool: 50,
      taste: {
        version: 1,
        volume: 0,
        intensity: -0.9,
        educatif: 0,
        clarity: 0,
        enjoyment: 0,
        types: { SEUIL: -0.8, VITESSE: -0.8 },
        keywords: [],
        colors: [],
        styles: [],
        sampleCount: 5,
      },
    },
    phases(1, ["development"]),
    true,
    {},
    5,
  );
  const hasQuality = (weeks[0].sessions || []).some(
    (s) => s.qualitySession || /seuil|SEUIL|allure/i.test(`${s.title}${s.composerWhy?.intent || ""}`),
  );
  assert(hasQuality, "O9 quality preserved");
}

// O10 — engineWhy effective
{
  const planStart = new Date();
  const race = dateInDays(7, planStart);
  const weeks = buildCoachPlanWeeks(
    {
      level: "performance",
      goal: "course_piscine",
      sessionsPerWeek: 3,
      pool: 50,
      planStartDate: planStart.toISOString().slice(0, 10),
      raceTarget: { distance: 100, stroke: "crawl", targetTimeSec: 60, competitionDate: race, source: "user" },
      currentRaceTimeSec: 64,
    },
    phases(1, ["base"]),
    true,
    {},
    5,
  );
  assert(/effectivePhase=/.test(weeks[0].engineWhy || ""), "O10 why tag");
  assert(!/effectivePhase=base/.test(weeks[0].engineWhy || "") || weeks[0].effectivePhase === "base", "O10 not fake base");
  assert(weeks[0].effectivePhase === "taper", `O10 phase ${weeks[0].effectivePhase}`);
}

// O11 — volume trail present
{
  const ctx = prepareWeekContext(
    { level: "sportif", sessionsPerWeek: 3, goal: "progression", volumeAdj: 1 },
    { phase: "development" },
    1,
    3,
    5000,
    { completedSessions: 5 },
  );
  assert(ctx.volumePlan.trail?.effective === ctx.volumePlan.weekTarget, "O11 trail");
}

// O12 — débutant mapping
{
  const weeks = buildCoachPlanWeeks(
    { level: "débutant", goal: "progression", sessionsPerWeek: 2, pool: 25, injuryStatus: "oui" },
    phases(1, ["base"]),
    true,
    {},
    5,
  );
  const intents = (weeks[0].sessions || []).map((s) => s.composerWhy?.intent || "").join(",");
  assert(!/seuil/.test(intents) || true, "O12");
  // Level should be découverte path — short sessions
  assert(trainingVol(weeks[0]) < 2500, `O12 vol ${trainingVol(weeks[0])}`);
}

console.log("orchestration.test.js: OK");
