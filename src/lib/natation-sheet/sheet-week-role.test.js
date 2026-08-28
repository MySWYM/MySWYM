/**
 * Tests calendrier Sheet S0 / S-1 / cycle 6 travail + test + allégée + garde début.
 * Usage : node src/lib/natation-sheet/sheet-week-role.test.js
 */
import assert from "node:assert/strict";
import {
  applyEarlyPlanConstructionGuard,
  applySheetWeekSessionCap,
  buildEventWeekTimeline,
  EARLY_PLAN_MIN_CONSTRUCTION,
  FAR_CYCLE_LEN,
  farCycleFromRaceSIndex,
  farCyclePhase,
  resolveSheetWeekRole,
  sheetPhaseShortLabel,
  startOfWeekMonday,
  weeksBeforeRaceWeek,
} from "./sheet-week-role.js";

assert.equal(FAR_CYCLE_LEN, 8);
assert.equal(EARLY_PLAN_MIN_CONSTRUCTION, 4);

{
  const mon = startOfWeekMonday("2026-08-12");
  assert.equal(mon.getDay(), 1);
  assert.equal(mon.getDate(), 10);
}

{
  const race = "2026-08-30";
  assert.equal(weeksBeforeRaceWeek(race, new Date("2026-08-26T12:00:00")), 0, "S0");
  assert.equal(weeksBeforeRaceWeek(race, new Date("2026-08-19T12:00:00")), 1, "S-1");
  assert.equal(weeksBeforeRaceWeek(race, new Date("2026-08-12T12:00:00")), 2, "S-2");
  assert.equal(weeksBeforeRaceWeek(race, new Date("2026-07-15T12:00:00")), 6, "S-6");
  assert.equal(weeksBeforeRaceWeek(race, new Date("2026-07-08T12:00:00")), 7, "S-7");
}

assert.equal(farCyclePhase(0), "construction");
assert.equal(farCyclePhase(5), "construction");
assert.equal(farCyclePhase(6), "test");
assert.equal(farCyclePhase(7), "deload");
assert.equal(farCyclePhase(8), "construction");

assert.equal(farCycleFromRaceSIndex(7).phase, "test");
assert.equal(farCycleFromRaceSIndex(8).phase, "construction", "S-8 = travail (pas allégée)");
assert.equal(farCycleFromRaceSIndex(9).phase, "construction");
assert.equal(farCycleFromRaceSIndex(13).phase, "construction");
assert.equal(farCycleFromRaceSIndex(14).phase, "deload", "allégée après test précédent");
assert.equal(farCycleFromRaceSIndex(15).phase, "test");

assert.equal(applyEarlyPlanConstructionGuard("test", 0), "construction");
assert.equal(applyEarlyPlanConstructionGuard("deload", 3), "construction");
assert.equal(applyEarlyPlanConstructionGuard("test", 4), "test");
assert.equal(applyEarlyPlanConstructionGuard("construction", 0), "construction");

{
  const race = "2026-08-30";
  const s0 = resolveSheetWeekRole({ eventDate: race, now: new Date("2026-08-26"), weekIndex: 0 });
  assert.equal(s0.phase, "deload");
  assert.equal(s0.isRaceWeek, true);
  assert.equal(s0.maxSessions, 2);

  const s1 = resolveSheetWeekRole({ eventDate: race, now: new Date("2026-08-19"), weekIndex: 0 });
  assert.equal(s1.phase, "deload");
  assert.equal(s1.isRaceWeek, false);

  const s3 = resolveSheetWeekRole({ eventDate: race, now: new Date("2026-08-05") });
  assert.equal(s3.phase, "construction");
  assert.equal(s3.band, "S-2_S-6");

  // S-7 = test si plan assez avancé
  const s7 = resolveSheetWeekRole({
    eventDate: race,
    now: new Date("2026-07-08T12:00:00"),
    weekIndex: 10,
  });
  assert.equal(s7.band, "far");
  assert.equal(s7.phase, "test");

  // S-7 en début de plan (weekIndex 2) → travail (garde 4 sem.)
  const s7early = resolveSheetWeekRole({
    eventDate: race,
    now: new Date("2026-07-08T12:00:00"),
    weekIndex: 2,
  });
  assert.equal(s7early.phase, "construction");
  assert.equal(s7early.earlyGuardApplied, true);

  const s8 = resolveSheetWeekRole({
    eventDate: race,
    now: new Date("2026-07-01T12:00:00"),
    weekIndex: 10,
  });
  assert.equal(s8.phase, "construction");

  const s14 = resolveSheetWeekRole({
    eventDate: race,
    now: new Date("2026-05-20T12:00:00"),
    weekIndex: 10,
  });
  assert.equal(weeksBeforeRaceWeek(race, new Date("2026-05-20T12:00:00")), 14);
  assert.equal(s14.phase, "deload");

  const s15 = resolveSheetWeekRole({
    eventDate: race,
    now: new Date("2026-05-13T12:00:00"),
    weekIndex: 10,
  });
  assert.equal(weeksBeforeRaceWeek(race, new Date("2026-05-13T12:00:00")), 15);
  assert.equal(s15.phase, "test");
}

{
  // Sans date : semaines 0–5 travail, 6 test, 7 allégée — mais garde force 0–3 travail
  assert.equal(resolveSheetWeekRole({ weekIndex: 0 }).phase, "construction");
  assert.equal(resolveSheetWeekRole({ weekIndex: 6 }).phase, "test");
  assert.equal(resolveSheetWeekRole({ weekIndex: 7 }).phase, "deload");
}

assert.equal(applySheetWeekSessionCap({ maxSessions: 2 }, 4), 2);
assert.equal(applySheetWeekSessionCap({ maxSessions: null }, 4), 4);

assert.equal(sheetPhaseShortLabel({ phase: "construction" }), "Travail");
assert.equal(sheetPhaseShortLabel({ phase: "test" }), "Test");
assert.equal(sheetPhaseShortLabel({ phase: "deload", isRaceWeek: true }), "Course");

{
  const race = "2026-08-30";
  const tl = buildEventWeekTimeline({
    eventDate: race,
    now: new Date("2026-08-05T12:00:00"),
    weekIndex: 0,
  });
  assert.equal(tl.mode, "to_race");
  assert.equal(tl.weeks.length, 4);
  assert.equal(tl.weeks[0].sLabel, "S-3");
  assert.equal(tl.weeks[0].shortLabel, "Travail");
  assert.equal(tl.weeks[2].sLabel, "S-1");
  assert.equal(tl.weeks[2].shortLabel, "Allégée");
  assert.equal(tl.weeks[3].sLabel, "S0");
  assert.equal(tl.weeks[3].shortLabel, "Course");
}

{
  // Comme le bug écran : à S-9 en début de plan → pas d’allégée en S-8
  const race = "2026-12-20";
  const nowS9 = new Date("2026-10-12T12:00:00");
  const atS9 = buildEventWeekTimeline({
    eventDate: race,
    now: nowS9,
    weekIndex: 0,
  });
  assert.equal(weeksBeforeRaceWeek(race, nowS9), 9);
  const byLabel = Object.fromEntries(atS9.weeks.map((w) => [w.sLabel, w.shortLabel]));
  assert.equal(byLabel["S-9"], "Travail");
  assert.equal(byLabel["S-8"], "Travail", "S-8 travail (ordre corrigé)");
  assert.equal(byLabel["S-7"], "Travail", "S-7 test reporté : garde début de plan");
  assert.equal(byLabel["S-1"], "Allégée");
  assert.equal(byLabel["S0"], "Course");
}

{
  const race = "2026-12-20";
  const far = buildEventWeekTimeline({
    eventDate: race,
    now: new Date("2026-08-05T12:00:00"),
    weekIndex: 20,
  });
  const byLabel = Object.fromEntries(far.weeks.map((w) => [w.sLabel, w.shortLabel]));
  assert.equal(byLabel["S-7"], "Test");
  assert.equal(byLabel["S-8"], "Travail");
  assert.equal(byLabel["S-6"], "Travail");
  assert.equal(byLabel["S-14"], "Allégée");
  assert.equal(byLabel["S-15"], "Test");
}

{
  const cycle = buildEventWeekTimeline({ weekIndex: 5, now: new Date("2026-08-01") });
  assert.equal(cycle.mode, "cycle");
  assert.equal(cycle.weeks.length, FAR_CYCLE_LEN);
  assert.equal(cycle.weeks[0].shortLabel, "Travail");
  assert.equal(cycle.weeks[1].shortLabel, "Test");
  assert.equal(cycle.weeks[2].shortLabel, "Allégée");
}

console.log("sheet-week-role.test.js OK");
