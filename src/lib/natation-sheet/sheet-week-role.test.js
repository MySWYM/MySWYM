/**
 * Tests calendrier Sheet — couple allégée→test vers J, 6 travail, garde début.
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
  assert.equal(weeksBeforeRaceWeek(race, new Date("2026-07-08T12:00:00")), 7, "S-7");
}

assert.equal(farCyclePhase(0), "construction");
assert.equal(farCyclePhase(5), "construction");
assert.equal(farCyclePhase(6), "deload");
assert.equal(farCyclePhase(7), "test");
assert.equal(farCyclePhase(8), "construction");

assert.equal(farCycleFromRaceSIndex(7).phase, "test");
assert.equal(farCycleFromRaceSIndex(8).phase, "deload", "S-8 allégée puis S-7 test");
assert.equal(farCycleFromRaceSIndex(9).phase, "construction");
assert.equal(farCycleFromRaceSIndex(14).phase, "construction");
assert.equal(farCycleFromRaceSIndex(15).phase, "test");
assert.equal(farCycleFromRaceSIndex(16).phase, "deload");

assert.equal(applyEarlyPlanConstructionGuard("test", 0), "construction");
assert.equal(applyEarlyPlanConstructionGuard("deload", 3), "construction");
assert.equal(applyEarlyPlanConstructionGuard("test", 4), "test");

{
  const race = "2026-08-30";
  const s0 = resolveSheetWeekRole({ eventDate: race, now: new Date("2026-08-26"), weekIndex: 0 });
  assert.equal(s0.phase, "deload");
  assert.equal(s0.isRaceWeek, true);

  const s1 = resolveSheetWeekRole({ eventDate: race, now: new Date("2026-08-19"), weekIndex: 0 });
  assert.equal(s1.phase, "deload");

  const s7 = resolveSheetWeekRole({
    eventDate: race,
    now: new Date("2026-07-08T12:00:00"),
    weekIndex: 10,
  });
  assert.equal(s7.phase, "test");

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
  assert.equal(s8.phase, "deload");

  const s8early = resolveSheetWeekRole({
    eventDate: race,
    now: new Date("2026-07-01T12:00:00"),
    weekIndex: 1,
  });
  assert.equal(s8early.phase, "construction", "garde début : pas d’allégée cycle trop tôt");
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
  // Début de plan : garde → S-8 / S-7 restent travail (pas allégée/test cycle)
  assert.equal(byLabel["S-8"], "Travail");
  assert.equal(byLabel["S-7"], "Travail");
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
  assert.equal(byLabel["S-8"], "Allégée", "vers J : allégée puis test");
  assert.equal(byLabel["S-6"], "Travail");
  assert.equal(byLabel["S-15"], "Test");
  assert.equal(byLabel["S-16"], "Allégée");
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
