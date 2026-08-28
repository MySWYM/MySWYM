/**
 * Tests calendrier Sheet S0 / S-1 / cycle ancré sur J.
 * Usage : node src/lib/natation-sheet/sheet-week-role.test.js
 */
import assert from "node:assert/strict";
import {
  applySheetWeekSessionCap,
  buildEventWeekTimeline,
  farCycleFromRaceSIndex,
  farCyclePhase,
  resolveSheetWeekRole,
  sheetPhaseShortLabel,
  startOfWeekMonday,
  weeksBeforeRaceWeek,
} from "./sheet-week-role.js";

{
  // Lundi 10 août 2026
  const mon = startOfWeekMonday("2026-08-12"); // mercredi
  assert.equal(mon.getDay(), 1);
  assert.equal(mon.getDate(), 10);
}

{
  // Course le dimanche 30 août 2026 → semaine du 24–30 août = S0
  const race = "2026-08-30";
  assert.equal(weeksBeforeRaceWeek(race, new Date("2026-08-26T12:00:00")), 0, "S0");
  assert.equal(weeksBeforeRaceWeek(race, new Date("2026-08-19T12:00:00")), 1, "S-1");
  assert.equal(weeksBeforeRaceWeek(race, new Date("2026-08-12T12:00:00")), 2, "S-2");
  assert.equal(weeksBeforeRaceWeek(race, new Date("2026-07-15T12:00:00")), 6, "S-6");
  assert.equal(weeksBeforeRaceWeek(race, new Date("2026-07-08T12:00:00")), 7, "S-7");
}

assert.equal(farCyclePhase(0), "construction");
assert.equal(farCyclePhase(6), "construction");
assert.equal(farCyclePhase(7), "test");
assert.equal(farCyclePhase(8), "deload");
assert.equal(farCyclePhase(9), "construction");

assert.equal(farCycleFromRaceSIndex(7).phase, "test");
assert.equal(farCycleFromRaceSIndex(8).phase, "deload");
assert.equal(farCycleFromRaceSIndex(9).phase, "construction");
assert.equal(farCycleFromRaceSIndex(15).phase, "construction");
assert.equal(farCycleFromRaceSIndex(16).phase, "test");
assert.equal(farCycleFromRaceSIndex(17).phase, "deload");

{
  const race = "2026-08-30";
  const s0 = resolveSheetWeekRole({ eventDate: race, now: new Date("2026-08-26") });
  assert.equal(s0.phase, "deload");
  assert.equal(s0.isRaceWeek, true);
  assert.equal(s0.maxSessions, 2);
  assert.ok(s0.banner);

  const s1 = resolveSheetWeekRole({ eventDate: race, now: new Date("2026-08-19") });
  assert.equal(s1.phase, "deload");
  assert.equal(s1.isRaceWeek, false);

  const s3 = resolveSheetWeekRole({ eventDate: race, now: new Date("2026-08-05") });
  assert.equal(s3.phase, "construction");
  assert.equal(s3.band, "S-2_S-6");

  // S-7 = test (ancré sur J, pas sur weekIndex)
  const s7 = resolveSheetWeekRole({
    eventDate: race,
    now: new Date("2026-07-08T12:00:00"),
    weekIndex: 0,
  });
  assert.equal(s7.band, "far");
  assert.equal(s7.phase, "test");
  assert.match(s7.banner || "", /test/i);

  const s8 = resolveSheetWeekRole({
    eventDate: race,
    now: new Date("2026-07-01T12:00:00"),
  });
  assert.equal(s8.phase, "deload");

  const s16 = resolveSheetWeekRole({
    eventDate: race,
    now: new Date("2026-05-06T12:00:00"),
  });
  assert.equal(weeksBeforeRaceWeek(race, new Date("2026-05-06T12:00:00")), 16);
  assert.equal(s16.phase, "test");
}

{
  const noDate = resolveSheetWeekRole({ weekIndex: 8, now: new Date("2026-08-01") });
  assert.equal(noDate.phase, "deload");
  assert.equal(noDate.band, "no_date");
}

assert.equal(applySheetWeekSessionCap({ maxSessions: 2 }, 4), 2);
assert.equal(applySheetWeekSessionCap({ maxSessions: null }, 4), 4);

assert.equal(sheetPhaseShortLabel({ phase: "construction" }), "Travail");
assert.equal(sheetPhaseShortLabel({ phase: "test" }), "Test");
assert.equal(sheetPhaseShortLabel({ phase: "deload", isRaceWeek: true }), "Course");

{
  const race = "2026-08-30";
  // S-3 (5 août) → 4 semaines jusqu’à S0
  const tl = buildEventWeekTimeline({
    eventDate: race,
    now: new Date("2026-08-05T12:00:00"),
    weekIndex: 0,
  });
  assert.equal(tl.mode, "to_race");
  assert.equal(tl.weeks.length, 4);
  assert.equal(tl.weeks[0].sLabel, "S-3");
  assert.equal(tl.weeks[0].shortLabel, "Travail");
  assert.equal(tl.weeks[0].isCurrent, true);
  assert.equal(tl.weeks[2].sLabel, "S-1");
  assert.equal(tl.weeks[2].shortLabel, "Allégée");
  assert.equal(tl.weeks[3].sLabel, "S0");
  assert.equal(tl.weeks[3].shortLabel, "Course");
  assert.equal(tl.truncated, false);
}

{
  const race = "2026-12-20";
  const far = buildEventWeekTimeline({
    eventDate: race,
    now: new Date("2026-08-05T12:00:00"),
  });
  assert.equal(far.mode, "to_race");
  assert.equal(far.truncated, false);
  assert.equal(far.weeks[far.weeks.length - 1].sLabel, "S0");
  assert.equal(far.weeks[far.weeks.length - 1].shortLabel, "Course");

  const byLabel = Object.fromEntries(far.weeks.map((w) => [w.sLabel, w.shortLabel]));
  assert.equal(byLabel["S-7"], "Test");
  assert.equal(byLabel["S-8"], "Allégée");
  assert.equal(byLabel["S-6"], "Travail");
  assert.equal(byLabel["S-16"], "Test");
  assert.equal(byLabel["S-17"], "Allégée");

  const capped = buildEventWeekTimeline({
    eventDate: race,
    now: new Date("2026-08-05T12:00:00"),
    maxWeeks: 8,
  });
  assert.equal(capped.truncated, true);
  assert.equal(capped.weeks.length, 8);
}

{
  const cycle = buildEventWeekTimeline({ weekIndex: 6, now: new Date("2026-08-01") });
  assert.equal(cycle.mode, "cycle");
  assert.equal(cycle.weeks.length, 9);
  assert.equal(cycle.weeks[0].shortLabel, "Travail");
  assert.equal(cycle.weeks[1].shortLabel, "Test");
  assert.equal(cycle.weeks[2].shortLabel, "Allégée");
}

console.log("sheet-week-role.test.js OK");
