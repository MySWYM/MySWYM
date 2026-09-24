import {
  sessionCoef,
  paceBonus,
  weeklyScore,
  topPercent,
  rankRingRatio,
  rankCenterLabel,
} from "./weekly-rank.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
  console.log("  ✓", msg);
}

function close(a, b, msg) {
  assert(Math.abs(a - b) < 1e-9, msg);
}

console.log("weekly-rank");

assert(sessionCoef(0) === 0, "0 séance = coef 0");
assert(sessionCoef(1) === 1, "1 séance = ×1");
assert(sessionCoef(2) === 1.2, "2 séances = ×1,2");
assert(sessionCoef(3) === 1.5, "3 séances = ×1,5");
assert(sessionCoef(4) === 1.9, "4 séances = ×1,9");
assert(sessionCoef(5) === 2.4, "5 séances = ×2,4");
assert(sessionCoef(8) === 2.4, "5+ plafonne à ×2,4");

assert(paceBonus(null, 90, 70) === 1, "sans T100 = ×1");
assert(paceBonus(95, 90, 70) === 1, "plus lent que la médiane = ×1");
assert(paceBonus(90, 90, 70) === 1, "médiane = ×1");
close(paceBonus(70, 90, 70), 1.25, "p10 = bonus max");
close(paceBonus(80, 90, 70), 1.125, "à mi-chemin médiane / p10");

close(
  weeklyScore({ meters: 4000, sessions: 1, pace100: 95, medianPace: 90, p10Pace: 70 }),
  4,
  "4 km × 1 × 1 = 4 (allure sans bonus)",
);
close(
  weeklyScore({ meters: 4000, sessions: 5, pace100: 70, medianPace: 90, p10Pace: 70 }),
  4 * 2.4 * 1.25,
  "5× + allure p10",
);
assert(weeklyScore({ meters: 8000, sessions: 0 }) === 0, "0 séance = score 0");

const pool = [8, 6, 4, 2, 0, 0, 0, 0, 0, 0];
assert(topPercent(8, pool) === 10, "meilleur = Top 10% sur 10");
assert(topPercent(4, pool) === 30, "3e = Top 30%");
assert(topPercent(0, pool) === 100, "pas nagé = hors classement");
assert(topPercent(1, []) === 100, "population vide");

assert(rankRingRatio(18) === 0.82, "Top 18% remplit 82%");
assert(rankRingRatio(100) === 0, "hors classement = anneau vide");
assert(rankCenterLabel(18, true) === "Top 18%", "label Top 18%");
assert(rankCenterLabel(18, false) === "-", "sans score = tiret");

console.log("weekly-rank ok");
