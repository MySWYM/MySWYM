/**
 * Vérifications manuelles / CI légère pour src/lib/swim-pace.js
 * Usage : node src/lib/swim-pace.test.js
 */
import {
  appZoneMultForT100,
  maxCareerPaceGainFromT100,
  maxPaceGainFromT100,
  paceTagFromT100,
  projectedPaceAtWeek,
  projectedPaceAtYears,
  speedFactorFromT100,
  zoneBandsForT100,
} from "./swim-pace.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// 1) T100 rapide → speedFactor élevé
assert(speedFactorFromT100(55) > speedFactorFromT100(110), "rapide > lent");

// 2) Zones plus tolérantes (mult plus haut) pour nageur rapide
const slowZ1 = zoneBandsForT100(120).Z1[0];
const fastZ1 = zoneBandsForT100(55).Z1[0];
assert(fastZ1 > slowZ1, `Z1 rapide (${fastZ1}) doit être > Z1 lent (${slowZ1})`);

const slowApp = appZoneMultForT100(120);
const fastApp = appZoneMultForT100(55);
assert(fastApp.easy > slowApp.easy, "easy plus tolérant si T100 rapide");
assert(fastApp.threshold > slowApp.threshold, "seuil plus tolérant si T100 rapide");

// 3) Gain de progression : plus petit si T100 déjà rapide
const gainSlow = maxPaceGainFromT100(120);
const gainFast = maxPaceGainFromT100(55);
assert(gainSlow > gainFast, `gain lent (${gainSlow}) > gain rapide (${gainFast})`);
assert(gainFast >= 0.02 && gainFast <= 0.04, "gain expert borné ~2–4 %");
assert(gainSlow >= 0.08 && gainSlow <= 0.11, "gain débutant borné ~8–10 %");

// 4) Projection asymptotique + rendements décroissants
const endSlow = projectedPaceAtWeek(120, 12, 12);
const endFast = projectedPaceAtWeek(55, 12, 12);
const pctSlow = (120 - endSlow) / 120;
const pctFast = (55 - endFast) / 55;
assert(pctSlow > pctFast, `Δ% lent (${pctSlow}) > Δ% rapide (${pctFast})`);

// 5) Tag sans dépendre d'un 400 m
const tag = paceTagFromT100(90, "Z2", 100);
assert(/\(Z2 @/.test(tag), `tag attendu, reçu: ${tag}`);
assert(!tag.includes("undefined"), "pas d'undefined dans le tag");

// 6) Projection multi-années : conservatrice, décroissante
const careerSlow = maxCareerPaceGainFromT100(120);
const careerFast = maxCareerPaceGainFromT100(55);
assert(careerSlow > careerFast, "plafond carrière lent > rapide");
assert(careerSlow >= 0.10 && careerSlow <= 0.13, "carrière lent ~10–12 %");
assert(careerFast >= 0.03 && careerFast <= 0.05, "carrière rapide ~3–5 %");

const y0 = projectedPaceAtYears(105, 0);
assert(Math.abs(y0 - 105) < 0.01, "année 0 = départ");
const y2 = projectedPaceAtYears(105, 2); // ~1:45
const y5 = projectedPaceAtYears(105, 5);
assert(y2 < 105 && y5 < y2, "temps ↓ avec les années");
const pct2 = (105 - y2) / 105;
const pct5 = (105 - y5) / 105;
assert(pct2 >= 0.05 && pct2 <= 0.08, `2 ans 1:45 ~5–8 % (reçu ${(pct2 * 100).toFixed(1)} %)`);
assert(pct5 >= 0.08 && pct5 <= 0.12, `5 ans 1:45 ~8–12 % (reçu ${(pct5 * 100).toFixed(1)} %)`);
assert(pct5 < careerSlow + 0.01, "5 ans n’atteint pas un plafond fantasque");

console.log("swim-pace.test.js OK");
console.log({
  slowZ1, fastZ1,
  slowEasy: slowApp.easy, fastEasy: fastApp.easy,
  gainSlow: +gainSlow.toFixed(3), gainFast: +gainFast.toFixed(3),
  pctSlow: +(pctSlow * 100).toFixed(1) + "%",
  pctFast: +(pctFast * 100).toFixed(1) + "%",
  y2: Math.round(y2), y5: Math.round(y5),
  pct2: +(pct2 * 100).toFixed(1) + "%",
  pct5: +(pct5 * 100).toFixed(1) + "%",
  tag,
});
