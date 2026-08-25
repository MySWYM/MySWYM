/**
 * Usage: node src/lib/buddy-match.test.js
 */
import { buddyMatchScore, sortBuddiesForViewer } from "./buddy-match-rank.js";

const viewer = {
  city: "Lyon",
  level: "régulier",
  goal_category: "eau_libre",
  availability_days: ["sat", "sun"],
  availability_slots: ["morning"],
};

const a = { city: "Lyon", level: "régulier", goal_category: "eau_libre", availability_days: ["sat"], availability_slots: ["morning"], updated_at: new Date().toISOString() };
const b = { city: "Paris", level: "découverte", goal_category: "triathlon", availability_days: ["mon"], availability_slots: ["evening"], updated_at: "2020-01-01" };

if (!(buddyMatchScore(a, viewer) > buddyMatchScore(b, viewer))) {
  throw new Error("Lyon match should score higher");
}
const sorted = sortBuddiesForViewer([b, a], viewer);
if (sorted[0] !== a) throw new Error("sort order");

console.log("buddy-match.test.js OK");
