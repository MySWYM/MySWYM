/**
 * Tests Étape H — Boucle adaptative Feedback → Capacity → Adaptation
 * Usage : node src/lib/sports-engine/feedback-loop.test.js
 */
import {
  normalizeSessionFeedback,
  interpretFeedback,
  computeFeedbackTrend,
  decideWeeklyAdaptation,
  runAdaptiveLoop,
  applyRaceResultToPerformance,
  resolvePostRaceRecovery,
  decideAdaptAction,
  missedSessionPolicy,
  prepareWeekContext,
  estimateCapacity,
  applyCapacitySignalUpdate,
} from "./index.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const sport = { level: "sportif", volumeAdj: 1, objectifV1: "nager_progresser" };

function weekOf(diffs, extra = {}) {
  return diffs.map((d, i) => ({
    sessionId: `s${i}`,
    difficulty: d,
    completed: true,
    qualitySession: !!extra.quality?.[i],
    sessionIntent: extra.intents?.[i] || (extra.quality?.[i] ? "seuil" : "aerobie"),
    ...extra.per?.[i],
  }));
}

function volAfter(feedbacks, ctx = {}) {
  const loop = runAdaptiveLoop({
    weekFeedbacks: feedbacks,
    sportProfile: { level: ctx.level || "sportif" },
    history: { volumeAdj: 1, completedSessions: ctx.completed || 6, ...(ctx.history || {}) },
    context: ctx,
  });
  return loop;
}

// ── Unit ──────────────────────────────────────────────────────────

// T1 good → stabilité
{
  const a = decideWeeklyAdaptation(weekOf(["good", "good", "good"]));
  assert(a.action === "HOLD", `t1 action ${a.action}`);
  assert(a.volumeMul === 1, `t1 mul ${a.volumeMul}`);
  assert(a.observeOnly === true, "t1 observe");
}

// T2 too_easy → petite progression (observe si isolé)
{
  const a = decideWeeklyAdaptation(weekOf(["too_easy"], { intents: ["aerobie"] }));
  assert(a.action === "PROGRESS", `t2 ${a.action}`);
  assert(a.observeOnly === true, "t2 observe single");
  assert(a.magnitude === "+small" || a.magnitude === "0", `t2 mag ${a.magnitude}`);
}

// T3 hard → maintien
{
  const a = decideWeeklyAdaptation(weekOf(["hard"]));
  assert(a.action === "HOLD" || a.action === "ADJUST", `t3 ${a.action}`);
  assert(a.observeOnly === true || a.volumeMul <= 1, "t3 no increase");
}

// T4 too_hard → réduction
{
  const a = decideWeeklyAdaptation(
    weekOf(["too_hard"], { quality: [true], intents: ["seuil"] }),
  );
  assert(a.action === "REDUCE", `t4 ${a.action}`);
  assert(a.volumeMul < 1, `t4 mul ${a.volumeMul}`);
  assert(a.qualityLoadNote, "t4 keep quality note");
}

// T5 pain → sécurité
{
  const a = decideWeeklyAdaptation([{ pain: true, completed: true, sessionId: "p1" }]);
  assert(a.action === "PROTECT", `t5 ${a.action}`);
  assert(a.safety === "pain", "t5 safety");
  assert(a.volumeMul <= 0.9, `t5 mul ${a.volumeMul}`);
  assert(a.primaryLever === "recovery", "t5 lever");
}

// T6 plusieurs too_easy → progression graduelle
{
  const a = decideWeeklyAdaptation(weekOf(["too_easy", "too_easy", "good"]));
  assert(a.action === "PROGRESS", `t6 ${a.action}`);
  assert(a.observeOnly === false, "t6 apply");
  assert(a.volumeMul > 1 && a.volumeMul <= 1.08, `t6 mul ${a.volumeMul}`);
  assert(a.primaryLever, "t6 one lever");
}

// T7 plusieurs hard → fatigue
{
  const t = computeFeedbackTrend(weekOf(["hard", "hard", "too_hard"]));
  assert(t.trend === "fatiguing", `t7 trend ${t.trend}`);
  const a = decideWeeklyAdaptation(weekOf(["hard", "hard", "too_hard"]));
  assert(a.action === "REDUCE", `t7 ${a.action}`);
  assert(a.volumeMul < 1, "t7 reduce");
}

// T8 missed + drop
{
  const a = decideWeeklyAdaptation([{ missed: true, completed: false, sessionId: "m1" }]);
  assert(a.missedPolicy === "drop", `t8 ${a.missedPolicy}`);
  assert(!/double|rattrap/i.test(a.rationale) || /no_catchup/.test(a.rationale), "t8 no catchup");
}

// T9 missed + reschedule
{
  assert(missedSessionPolicy({ isKeySession: true, missedInWeek: 1, totalMissed: 1 }) === "reschedule", "t9");
  const a = decideWeeklyAdaptation([
    { missed: true, completed: false, isKeySession: true, qualitySession: true, sessionId: "k1" },
  ]);
  assert(a.missedPolicy === "reschedule", `t9 pol ${a.missedPolicy}`);
}

// T10 missed + recompute
{
  assert(missedSessionPolicy({ totalMissed: 3 }) === "recompute", "t10");
  const a = decideWeeklyAdaptation(
    [
      { missed: true, completed: false, sessionId: "m1" },
      { missed: true, completed: false, sessionId: "m2" },
      { missed: true, completed: false, sessionId: "m3" },
    ],
    { totalMissed: 3 },
  );
  assert(a.missedPolicy === "recompute", `t10 ${a.missedPolicy}`);
}

// T11 Performance + too_hard
{
  const a = decideWeeklyAdaptation(weekOf(["good", "too_hard", "good"], { quality: [false, true, false] }), {
    level: "performance",
    performanceStrategy: { primaryQuality: "threshold" },
  });
  assert(a.action === "REDUCE", `t11 ${a.action}`);
  assert(/QualityToDevelop kept|KEEP aerobic|quality/i.test(a.rationale + (a.qualityLoadNote || "")), "t11 keep Q");
  assert(a.primaryLever === "intensity" || a.primaryLever === "density", `t11 lever ${a.primaryLever}`);
}

// T12 Performance + too_easy
{
  const a = decideWeeklyAdaptation(weekOf(["too_easy", "too_easy"], { intents: ["aerobie", "endurance"] }), {
    level: "performance",
  });
  assert(a.action === "PROGRESS", `t12 ${a.action}`);
  assert(a.volumeMul > 1, "t12 progress");
}

// T13 Taper + too_easy → pas de surcharge
{
  const a = decideWeeklyAdaptation(weekOf(["too_easy", "too_easy", "too_easy"]), {
    phase: "taper",
    taperStage: "s1",
  });
  assert(a.action === "HOLD", `t13 ${a.action}`);
  assert(a.volumeMul === 1, `t13 mul ${a.volumeMul}`);
  assert(a.taperBlocked, "t13 blocked");
}

// T14 Race result → mise à jour performance
{
  const upd = applyRaceResultToPerformance(
    { distance: 200, stroke: "crawl", resultTimeSec: 123, targetTimeSec: 120 },
    { recentBest: { 200: 126 } },
  );
  assert(upd.ok && upd.raceCompleted, "t14 ok");
  assert(upd.evidence.recentBest[200] === 123, `t14 best ${upd.evidence.recentBest[200]}`);
  assert(upd.postRaceRecovery, "t14 post");
  assert(applyRaceResultToPerformance({ resultTimeSec: null }).ok === false, "t14 no invent");
  const pr = resolvePostRaceRecovery({ daysSinceRace: 1 });
  assert(pr.state === "post_race_recovery" && pr.blockProgression, "t14 state");
}

// T15 feedback insuffisant → stabilité
{
  const a = decideWeeklyAdaptation([]);
  assert(a.action === "HOLD", "t15");
  assert(a.volumeMul === 1, "t15 mul");
}

// T16 capacity progressive — un too_easy ne flippe pas la capacité
{
  const base = estimateCapacity({ level: "sportif" }, { completedSessions: 4 });
  const a = decideWeeklyAdaptation(weekOf(["too_easy"]));
  const u = applyCapacitySignalUpdate(base, a, { sampleCount: 1 });
  assert(Math.abs(u.capacity.score - base.score) < 0.08, `t16 delta ${u.capacity.score - base.score}`);
  assert(u.confidence === "low", `t16 conf ${u.confidence}`);
}

// ── Séquences ─────────────────────────────────────────────────────

// A good×3
{
  const t = computeFeedbackTrend(weekOf(["good", "good", "good"]));
  assert(t.trend === "stable" || t.trend === "improving", `seqA ${t.trend}`);
}

// B too_easy×2 + good
{
  const loop = volAfter(weekOf(["too_easy", "too_easy", "good"]));
  assert(loop.adaptation.action === "PROGRESS", "seqB");
  assert(loop.nextVolumeAdj > 1, `seqB adj ${loop.nextVolumeAdj}`);
}

// C hard×2 + too_hard
{
  const loop = volAfter(weekOf(["hard", "hard", "too_hard"]));
  assert(loop.adaptation.action === "REDUCE", "seqC");
  assert(loop.nextVolumeAdj < 1, "seqC down");
}

// D good / hard / good — ne pas sur-réagir
{
  const a = decideWeeklyAdaptation(weekOf(["good", "hard", "good"]));
  assert(a.action === "HOLD" || (a.action === "ADJUST" && a.observeOnly), `seqD ${a.action}`);
  assert(a.volumeMul >= 0.94, `seqD mul ${a.volumeMul}`);
}

// E pain puis good×2 — protection ne disparaît pas trop vite
{
  const loop1 = runAdaptiveLoop({
    weekFeedbacks: [{ pain: true, completed: true }],
    sportProfile: { level: "sportif" },
    history: { volumeAdj: 1, completedSessions: 8 },
  });
  assert(loop1.adaptation.safety === "pain", "seqE1");
  const loop2 = runAdaptiveLoop({
    weekFeedbacks: weekOf(["good", "good"]),
    sportProfile: { level: "sportif" },
    history: { ...loop1.nextHistory, volumeAdj: loop1.nextVolumeAdj },
  });
  assert(loop2.nextHistory.painProtection === true || loop2.capacity.painProtection === true, "seqE protect persists");
  // good×2 seul ne doit pas PROGRESSER fort tant que painProtection
  assert(loop2.adaptation.action !== "PROGRESS" || loop2.adaptation.observeOnly, "seqE no aggressive progress");
}

// Signal structure
{
  const s = interpretFeedback({ difficulty: "too_hard", qualitySession: true, sessionIntent: "seuil" });
  assert(s.loadSignal === "too_high", "sig load");
  assert(s.progressionSignal === "reduce", "sig prog");
  assert(Array.isArray(s.evidence), "sig ev");
}

// prepareWeekContext consomme adaptation
{
  const hist = {
    completedSessions: 10,
    weeklyAdaptation: decideWeeklyAdaptation(weekOf(["too_hard"], { quality: [true] })),
    hardStreak: 2,
  };
  const ctx = prepareWeekContext(
    { level: "sportif", sessionsPerWeek: 3, goal: "progression" },
    { phase: "development" },
    2,
    3,
    5000,
    hist,
  );
  assert(ctx.adaptation, "ctx adapt");
  assert(ctx.volumePlan.weekTarget < 5000 || ctx.volumePlan.typeSemaine === "allegee", "ctx reduced/deload");
}

// decideAdaptAction rétrocompat
{
  const d = decideAdaptAction({ rating: "ok", finished: true });
  assert(d.action === "MAINTENIR", `compat ${d.action}`);
  assert(d.weeklyAdaptation, "compat weekly");
}

// Normalize
{
  const n = normalizeSessionFeedback({ rating: "easy", finished: true });
  assert(n.difficulty === "too_easy" && n.completed === true, "norm");
}

console.log("feedback-loop.test.js: OK");
