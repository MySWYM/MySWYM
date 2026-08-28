/**
 * Tests calendrier Sheet S0 / S-1 / cycle.
 * Usage : node src/lib/natation-sheet/sheet-week-role.test.js
 */
import assert from "node:assert/strict";
import {
  applySheetWeekSessionCap,
  farCyclePhase,
  resolveSheetWeekRole,
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

  // Loin : weekIndex 7 → test
  const far = resolveSheetWeekRole({
    eventDate: race,
    now: new Date("2026-06-01"),
    weekIndex: 7,
  });
  assert.equal(far.band, "far");
  assert.equal(far.phase, "test");
  assert.match(far.banner || "", /test/i);
}

{
  const noDate = resolveSheetWeekRole({ weekIndex: 8, now: new Date("2026-08-01") });
  assert.equal(noDate.phase, "deload");
  assert.equal(noDate.band, "no_date");
}

assert.equal(applySheetWeekSessionCap({ maxSessions: 2 }, 4), 2);
assert.equal(applySheetWeekSessionCap({ maxSessions: null }, 4), 4);

console.log("sheet-week-role.test.js OK");
