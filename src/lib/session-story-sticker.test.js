/**
 * Sticker story : distance prévue, ou nage Strava du même jour.
 * Usage: node src/lib/session-story-sticker.test.js
 */
import {
  formatStoryDistance,
  formatPaceSeconds,
  matchStravaSwim,
  storyStickerLines,
  parseDistanceMeters,
} from "./session-story-sticker.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(parseDistanceMeters("2200m") === 2200, "m");
assert(parseDistanceMeters("2,2 km") === 2200, "km");
assert(formatStoryDistance("2200m").includes("200"), "distance");
assert(formatStoryDistance("2200m").includes("m"), "unité");
assert(formatPaceSeconds(110) === "1:50 /100 m", "allure réelle");
assert(formatPaceSeconds(20) == null, "allure trop rapide");

const planned = storyStickerLines({ distance: "1800m", duration: 51 });
assert(planned.length === 1, "sans Strava : distance seule");
assert(planned[0].label === "Distance", "label distance");
assert(!planned.some((line) => line.label === "Durée"), "pas de durée inventée");
assert(!planned.some((line) => line.label === "Allure"), "pas d'allure inventée");

const linked = storyStickerLines(
  { distance: "1800m", duration: 51 },
  { distance: 1650, pace: 102, activity_type: "Swim" },
);
assert(linked.length === 2, "avec Strava : distance + allure");
assert(linked[0].value.includes("650"), "distance réelle");
assert(linked[1].value === "1:42 /100 m", "allure Strava");

const now = new Date("2026-09-30T19:10:00");
const activities = [
  {
    activity_type: "Ride",
    distance: 20000,
    pace: 90,
    raw_data: { start_date_local: "2026-09-30T18:00:00" },
  },
  {
    activity_type: "Swim",
    distance: 1200,
    pace: 130,
    raw_data: { start_date_local: "2026-09-29T18:40:00" },
  },
  {
    activity_type: "Swim",
    distance: 2100,
    pace: 95,
    raw_data: { start_date_local: "2026-09-30T08:00:00" },
  },
  {
    activity_type: "OpenWaterSwim",
    distance: 1650,
    pace: 102,
    raw_data: { start_date_local: "2026-09-30T18:40:00" },
  },
];

const matched = matchStravaSwim(activities, { completedAt: "2026-09-30T19:00:00" }, now);
assert(matched?.distance === 1650, "nage la plus proche");
assert(matchStravaSwim(activities, { completedAt: "2026-09-28T19:00:00" }, now) == null, "autre jour");
assert(storyStickerLines({}).length === 0, "vide");

console.log("session-story-sticker.test.js OK");
