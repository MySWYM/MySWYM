/**
 * Usage : node src/lib/profile-goal.test.js
 */
import assert from "node:assert/strict";
import {
  familyIdFromProfile,
  familyNeedsSub,
  familyNeedsDate,
  buildGoalPatch,
  isSameGoalPatch,
  formatEventDateFr,
  formatEventLine,
  rhythmLine,
  currentWeekLine,
  todayIsoDate,
} from "./profile-goal.js";

assert.equal(familyIdFromProfile({ category: "triathlon", goal: "triathlon_sprint" }), "triathlon");
assert.equal(familyIdFromProfile({ goal: "progression" }), "progression");
assert.equal(familyIdFromProfile({ goal: "open_water_mid" }), "eau_libre");
assert.equal(familyNeedsSub("triathlon"), true);
assert.equal(familyNeedsSub("progression"), false);
assert.equal(familyNeedsDate("progression"), false);
assert.equal(familyNeedsDate("eau_libre"), true);

assert.deepEqual(
  buildGoalPatch({ category: "progression", goal: "triathlon_xs", eventDate: "2027-06-01" }),
  { category: "progression", goal: "progression", eventDate: "" },
);
assert.deepEqual(
  buildGoalPatch({ category: "triathlon", goal: "triathlon_sprint", eventDate: "2027-06-12" }),
  { category: "triathlon", goal: "triathlon_sprint", eventDate: "2027-06-12" },
);

assert.equal(
  isSameGoalPatch(
    { category: "progression", goal: "progression", eventDate: "" },
    { category: "progression", goal: "progression", eventDate: "" },
  ),
  true,
);
assert.equal(
  isSameGoalPatch(
    { category: "progression", goal: "progression" },
    { category: "triathlon", goal: "triathlon_xs", eventDate: "2027-01-01" },
  ),
  false,
);

assert.equal(formatEventDateFr("2027-06-12"), "12 juin 2027");
assert.equal(formatEventDateFr(""), "");
assert.equal(
  formatEventLine("2027-06-12", new Date(2026, 8, 21)),
  "12 juin 2027 · J-264",
);
assert.equal(rhythmLine({ sessionsPerWeek: 3 }), "3 séances / semaine");
assert.equal(rhythmLine({ sessionsPerWeek: 1 }), "1 séance / semaine");
assert.equal(rhythmLine({}), "");

assert.equal(
  currentWeekLine({
    weeks: [
      { focus: "Base", sessions: [{ completed: true }] },
      { focus: "Endurance", sessions: [{ completed: false }] },
    ],
  }),
  "Semaine 2 sur 2 · Endurance",
);
assert.equal(
  currentWeekLine({
    isSessionLoop: true,
    weeks: [{ focus: "Endurance", sessions: [{ completed: false }] }],
  }),
  "Semaine 1 · Endurance",
);
assert.equal(currentWeekLine({ weeks: [] }), "");
assert.match(todayIsoDate(new Date("2026-09-21T12:00:00")), /^\d{4}-\d{2}-\d{2}$/);

console.log("profile-goal.test.js ok");
