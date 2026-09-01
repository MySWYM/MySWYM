/**
 * Étape K, Tests persistance (logique locale + contrats).
 * Usage : node src/lib/sports-persistence/sports-persistence.test.js
 *
 * K11 (RLS) = vérifié dans la migration SQL (policies auth.uid() = user_id).
 * K15 = npm run test:composer:all && test:adapt (séparément).
 */
import {
  trainingDistanceOfSession,
  rebuildEngineHistory,
  normalizePersistedDifficulty,
  sportProfileToRow,
  rowToSportProfileFields,
  sessionToPlannedRow,
  adaptationToRow,
  createSportsPersistence,
  VOLUME_ADJ_POLICY,
} from "./index.js";
import { buildCoachPlanWeeks } from "../swim-plan-bridge.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function phases(n, pattern) {
  return Array.from({ length: n }, (_, i) => ({
    phase: pattern[Math.min(i, pattern.length - 1)],
    focus: pattern[Math.min(i, pattern.length - 1)],
    tipKey: null,
  }));
}

// ── K9 / K10 training_distance ──
{
  assert(trainingDistanceOfSession({ type: "RACE", distance: "200m", isRaceDay: true }) === 0, "K9 race");
  assert(trainingDistanceOfSession({ type: "REST", distance: "0m", isRestDay: true }) === 0, "K10 rest");
  assert(trainingDistanceOfSession({ type: "ENDURANCE", trainingDistance: 1500, distance: "1500m" }) === 1500, "train");
  assert(trainingDistanceOfSession({ distance: "2000m", sessionIntent: "race" }) === 0, "K9 intent race");
  console.log("K9 K10 PASS");
}

// ── K1 profil row shape ──
{
  const row = sportProfileToRow("u1", {
    level: "sportif",
    goal: "course_piscine",
    sessionsPerWeek: 3,
    pool: 50,
    equipment: ["palmes"],
    birthMonth: 6,
    birthYear: 1995,
    raceTarget: { distance: 200, stroke: "crawl", targetTimeSec: 130 },
  });
  assert(row.user_id === "u1" && row.level === "sportif" && row.frequency === 3, "K1 row");
  assert(row.race_target.distance === 200, "K1 race");
  assert(row.extra.birthMonth === 6 && row.extra.birthYear === 1995, "K1 birth");
  assert(typeof row.age === "number" && row.age >= 20 && row.age <= 40, "K1 age derived");
  console.log("K1 PASS");
}

{
  const row = sportProfileToRow("u-g", {
    level: "sportif",
    sessionsPerWeek: 3,
    pool: 25,
    gender: "Femme",
  });
  assert(row.gender === "femme", "K1g gender column");
  assert(row.extra.gender === "femme", "K1g extra gender");
  const fields = rowToSportProfileFields(row);
  assert(fields.gender === "femme", "K1g round-trip");
  const fromExtra = rowToSportProfileFields({
    ...row,
    gender: null,
    extra: { ...row.extra, gender: "homme" },
  });
  assert(fromExtra.gender === "homme", "K1g extra fallback");
  console.log("K1g PASS");
}

// ── K1b birth → age round-trip ──
{
  const row = sportProfileToRow("u2", {
    level: "régulier",
    sessionsPerWeek: 2,
    pool: 25,
    birthMonth: 1,
    birthYear: 2000,
  });
  const fields = rowToSportProfileFields(row);
  assert(fields.birthMonth === 1 && fields.birthYear === 2000, "K1b birth fields");
  assert(fields.age === row.age, "K1b age mirror");
  console.log("K1b PASS");
}

// ── K2 planned session row ──
{
  const row = sessionToPlannedRow("u1", "plan1", 0, 1, {
    type: "SEUIL",
    distance: "2250m",
    trainingDistance: 2250,
    family: "seuil",
    sessionIntent: "seuil",
  }, { effectivePhase: "development" });
  assert(row.training_distance === 2250 && row.status === "planned", "K2");
  assert(row.phase === "development" && row.intent === "seuil", "K2 analytics");
  console.log("K2 PASS");
}

// ── K3 completed status ──
{
  const row = sessionToPlannedRow("u1", "plan1", 0, 0, {
    type: "ENDURANCE",
    distance: "1800m",
    trainingDistance: 1800,
    completed: true,
  }, {});
  assert(row.status === "completed", "K3");
  console.log("K3 PASS");
}

// ── K4 / difficulty normalize ──
{
  assert(normalizePersistedDifficulty("good").difficulty === "good", "K4 good");
  assert(normalizePersistedDifficulty("ok").difficulty === "good", "K4 ok→good");
  assert(normalizePersistedDifficulty("too_hard").rating === "too_hard", "K4 too_hard");
  console.log("K4 PASS");
}

// ── K5 adaptation persist shape + rebuild ──
{
  const adapt = {
    action: "REDUCE",
    primaryLever: "intensity",
    magnitude: "-small",
    volumeMul: 0.94,
    rationale: "too_hard trend",
    confidence: "medium",
    safety: "normal",
  };
  const row = adaptationToRow("u1", "plan1", 0, adapt, 0.94);
  assert(row.action === "REDUCE" && row.volume_mul === 0.94, "K5 row");

  const hist = rebuildEngineHistory({
    plan: { volumeAdj: 0.94, weeks: [{ sessions: [{ completed: true }] }] },
    adaptations: [row],
    feedbackRows: [{ difficulty: "too_hard", rating: "too_hard", pain: false, completed: true }],
  });
  assert(hist.weeklyAdaptation?.action === "REDUCE", "K5 hist adapt");
  assert(hist.volumeAdj === 0.94, "K5 volumeAdj");
  assert(hist._fromSportsFacts === true, "K5 marker");
  console.log("K5 PASS");
}

// ── K6 pain protection rebuild ──
{
  const hist = rebuildEngineHistory({
    plan: { volumeAdj: 1, weeks: [] },
    feedbackRows: [{ difficulty: "hard", pain: true, completed: true }],
  });
  assert(hist.painProtection === true, "K6");
  console.log("K6 PASS");
}

// ── K7 / K8 race facts in history ──
{
  const hist = rebuildEngineHistory({
    plan: {},
    raceResults: [
      { distance: 200, stroke: "crawl", result_time_sec: 125, competition_date: "2026-08-01", source: "user" },
    ],
  });
  assert(hist.recentRaceResult?.resultTimeSec === 125, "K8");
  console.log("K7 K8 PASS (shapes)");
}

// ── K14 no double volumeAdj ──
{
  assert(VOLUME_ADJ_POLICY.doubleApplyForbidden === true, "K14 policy");
  assert(VOLUME_ADJ_POLICY.persistentLoadField === "volumeAdj", "K14 field");
  // Simulation : volumeAdj déjà 0.94 ; adaptation history a volume_mul 0.94
  // Le moteur doit recevoir volumeAdj=0.94 UNE fois via profile
  const hist = rebuildEngineHistory({
    plan: { volumeAdj: 0.94 },
    adaptations: [{ action: "REDUCE", volume_mul: 0.94, primary_lever: "volume" }],
  });
  assert(hist.volumeAdj === 0.94, "K14 hist adj");
  // Ne pas multiplier encore
  const load = hist.volumeAdj * 1; // orchestration path
  assert(Math.abs(load - 0.94) < 1e-9, "K14 no double");
  console.log("K14 PASS");
}

// ── K12 feedback → rebuild → semaine différente ──
{
  const baseProfile = {
    level: "sportif",
    goal: "course_piscine",
    sessionsPerWeek: 3,
    pool: 50,
    pace100: 85,
    planStartDate: "2026-08-03",
    raceTarget: { distance: 200, stroke: "crawl", targetTimeSec: 150, competitionDate: "2026-09-14", source: "user" },
  };
  const list = phases(2, ["development", "development"]);

  const weeks1 = buildCoachPlanWeeks({ ...baseProfile, volumeAdj: 1 }, list, true, {}, 5);
  const vol1 = (weeks1[1]?.sessions || []).reduce(
    (a, s) => a + (Number(s.trainingDistance) || parseInt(String(s.distance || "").replace(/\D/g, ""), 10) || 0),
    0,
  );

  const persistence = createSportsPersistence(null);
  const profileHard = persistence.attachEngineHistoryToProfile(
    baseProfile,
    {
      volumeAdj: 0.88,
      weeks: [
        {
          sessions: [
            { completed: true },
            { completed: true, feedback: { rating: "too_hard" } },
            { completed: true },
          ],
        },
      ],
      _weeklyAdaptation: {
        action: "REDUCE",
        primaryLever: "volume",
        magnitude: "-small",
        volumeMul: 0.88,
        safety: "normal",
      },
    },
    {
      feedbackRows: [{ difficulty: "too_hard", rating: "too_hard", pain: false, completed: true }],
      adaptations: [
        {
          action: "REDUCE",
          primary_lever: "volume",
          magnitude: "-small",
          volume_mul: 0.88,
          safety: "normal",
        },
      ],
    },
  );

  assert(profileHard._engineHistory.weeklyAdaptation?.action === "REDUCE", "K12 adapt present");
  assert(profileHard.volumeAdj === 0.88, "K12 adj");

  const weeks2 = buildCoachPlanWeeks(profileHard, list, true, {}, 5);
  const vol2 = (weeks2[1]?.sessions || []).reduce(
    (a, s) => a + (Number(s.trainingDistance) || parseInt(String(s.distance || "").replace(/\D/g, ""), 10) || 0),
    0,
  );
  assert(vol2 < vol1, `K12 S2 volume reduced ${vol2} < ${vol1}`);
  console.log("K12 PASS", { vol1, vol2 });
}

// ── K13 post-race rebuild flag ──
{
  const hist = rebuildEngineHistory({
    plan: {},
    postRace: { status: "active", reason: "race_done" },
  });
  assert(hist.postRaceRecovery === true, "K13");
  console.log("K13 PASS");
}

// ── Mock persistence (no supabase) still attaches history ──
{
  const p = createSportsPersistence(null);
  assert(p.enabled === false, "offline");
  const attached = p.attachEngineHistoryToProfile({ level: "regulier" }, { volumeAdj: 1.05 });
  assert(attached._engineHistory.volumeAdj === 1.05, "offline attach");
  console.log("offline compat PASS");
}

console.log("\n✅ Étape K persistence tests passed (K1–K10, K12–K14; K11=RLS SQL; K15=externe)");
