/**
 * Sticker story : chiffres de séance, sans fond.
 * Usage: node src/lib/session-story-sticker.test.js
 */
import {
  formatStoryDistance,
  formatStoryDuration,
  formatStoryPace,
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
assert(formatStoryDuration(55) === "55 min", "durée");
assert(formatStoryDuration(75) === "1 h 15", "durée h");
assert(formatStoryPace({ distance: "2200m", duration: 55 }) === "2:30 /100 m", "allure");
assert(formatStoryPace({ distance: "50m", duration: 55 }) == null, "trop court");

const lines = storyStickerLines({ distance: "1000m", duration: 22 });
assert(lines.length === 3, "3 lignes");
assert(lines[0].label === "Distance", "label");
assert(lines[2].value.includes("/100 m"), "allure ligne");
assert(storyStickerLines({}).length === 0, "vide");

console.log("session-story-sticker.test.js OK");
