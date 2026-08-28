/**
 * Tests calendrier Sheet — depuis J : S-6 allégée → S-7 test ; 6 travail ; garde 2 sem.
 * Usage : node src/lib/natation-sheet/sheet-week-role.test.js
 */
import assert from "node:assert/strict";
import {
  applyEarlyPlanConstructionGuard,
  applySheetWeekSessionCap,
  buildEventWeekTimeline,
  EARLY_PLAN_MIN_CONSTRUCTION,
  FAR_CYCLE_LEN,
  FAR_CYCLE_MIN_S_INDEX,
  farCycleFromRaceSIndex,
  farCyclePhase,
  resolveSheetWeekRole,
  sheetPhaseShortLabel,
  startOfWeekMonday,
  weeksBeforeRaceWeek,
} from "./sheet-week-role.js";

assert.equal(FAR_CYCLE_LEN, 8);
assert.equal(EARLY_PLAN_MIN_CONSTRUCTION, 2);
assert.equal(FAR_CYCLE_MIN_S_INDEX, 6);

{
  const mon = startOfWeekMonday("2026-08-12");
  assert.equal(mon.getDay(), 1);
  assert.equal(mon.getDate(), 10);
}

{
  const race = "2026-08-30";
  assert.equal(weeksBeforeRaceWeek(race, new Date("2026-08-26T12:00:00")), 0, "S0");
  assert.equal(weeksBeforeRaceWeek(race, new Date("2026-08-19T12:00:00")), 1, "S-1");
  assert.equal(weeksBeforeRaceWeek(race, new Date("2026-07-15T12:00:00")), 6, "S-6");
}

assert.equal(farCyclePhase(0), "construction");
assert.equal(farCyclePhase(5), "construction");
assert.equal(farCyclePhase(6), "deload");
assert.equal(farCyclePhase(7), "test");
assert.equal(farCyclePhase(8), "construction");

assert.equal(farCycleFromRaceSIndex(6).phase, "deload");
assert.equal(farCycleFromRaceSIndex(7).phase, "test", "depuis J : S-6 allégée puis S-7 test");
assert.equal(farCycleFromRaceSIndex(8).phase, "construction");
assert.equal(farCycleFromRaceSIndex(13).phase, "construction");
assert.equal(farCycleFromRaceSIndex(14).phase, "deload");
assert.equal(farCycleFromRaceSIndex(15).phase, "test");

assert.equal(applyEarlyPlanConstructionGuard("test", 0), "construction");
assert.equal(applyEarlyPlanConstructionGuard("deload", 1), "construction");
assert.equal(applyEarlyPlanConstructionGuard("test", 2), "test");

{
  const race = "2026-08-30";
  const s0 = resolveSheetWeekRole({ eventDate: race, now: new Date("2026-08-26"), weekIndex: 0 });
  assert.equal(s0.phase, "deload");
  assert.equal(s0.isRaceWeek, true);

  const s1 = resolveSheetWeekRole({ eventDate: race, now: new Date("2026-08-19"), weekIndex: 0 });
  assert.equal(s1.phase, "deload");

  const s5 = resolveSheetWeekRole({
    eventDate: race,
    now: new Date("2026-07-22T12:00:00"),
    weekIndex: 10,
  });
  assert.equal(s5.phase, "construction", "pas de test/allégée cycle avant S-6");
  assert.equal(s5.band, "S-2_S-5");

  const s6 = resolveSheetWeekRole({
    eventDate: race,
    now: new Date("2026-07-15T12:00:00"),
    weekIndex: 10,
  });
  assert.equal(s6.phase, "deload");

  const s6early = resolveSheetWeekRole({
    eventDate: race,
    now: new Date("2026-07-15T12:00:00"),
    weekIndex: 1,
  });
  assert.equal(s6early.phase, "construction");
  assert.equal(s6early.earlyGuardApplied, true);

  const s7 = resolveSheetWeekRole({
    eventDate: race,
    now: new Date("2026-07-08T12:00:00"),
    weekIndex: 10,
  });
  assert.equal(s7.phase, "test");

  const s7early = resolveSheetWeekRole({
    eventDate: race,
    now: new Date("2026-07-08T12:00:00"),
    weekIndex: 0,
  });
  assert.equal(s7early.phase, "construction", "garde début : pas de test cycle trop tôt");
}

{
  assert.equal(resolveSheetWeekRole({ weekIndex: 6 }).phase, "deload");
  assert.equal(resolveSheetWeekRole({ weekIndex: 7 }).phase, "test");
}

assert.equal(sheetPhaseShortLabel({ phase: "deload", isRaceWeek: true }), "Course");

{
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
  // Début de plan : garde 2 sem. → S-9 / S-8 travail ; S-7 test / S-6 allégée OK
  assert.equal(byLabel["S-8"], "Travail");
  assert.equal(byLabel["S-7"], "Test");
  assert.equal(byLabel["S-6"], "Allégée");
  assert.equal(byLabel["S-5"], "Travail");
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
  assert.equal(byLabel["S-6"], "Allégée");
  assert.equal(byLabel["S-7"], "Test", "depuis J : allégée puis test");
  assert.equal(byLabel["S-5"], "Travail");
  assert.equal(byLabel["S-14"], "Allégée");
  assert.equal(byLabel["S-15"], "Test");
}

{
  const cycle = buildEventWeekTimeline({ weekIndex: 5, now: new Date("2026-08-01") });
  assert.equal(cycle.weeks.length, FAR_CYCLE_LEN);
  assert.equal(cycle.weeks[0].shortLabel, "Travail");
  assert.equal(cycle.weeks[1].shortLabel, "Allégée");
  assert.equal(cycle.weeks[2].shortLabel, "Test");
}

assert.equal(applySheetWeekSessionCap({ maxSessions: 2 }, 4), 2);

console.log("sheet-week-role.test.js OK");
