/**
 * Stats nageur par période.
 * Usage: node src/lib/swimmer-period-stats.test.js
 */
import {
  buildPeriodAnalytics,
  collectWeekBuckets,
  formatDeltaLabel,
  formatKm,
} from "./swimmer-period-stats.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const NOW = new Date(2026, 8, 2, 12).getTime(); // 2 sept. 2026

const weekSessions = (distances, completedMask) =>
  distances.map((distance, i) => ({
    distance: `${distance}m`,
    completed: !!completedMask[i],
  }));

const classicPlan = {
  startDate: new Date(2026, 7, 18, 10).getTime(), // 18 août 2026
  weeks: [
    { number: 1, sessions: weekSessions([2000, 2200, 3400], [1, 1, 1]) },
    { number: 2, sessions: weekSessions([2000, 2200, 3400], [1, 1, 1]) },
    { number: 3, sessions: weekSessions([2000, 2200, 3400], [1, 0, 0]) },
  ],
};

const buckets = collectWeekBuckets(classicPlan, { sessionsPerWeek: 3 }, NOW);
assert(buckets.length === 3, "3 semaines");
assert(buckets[2].isCurrent, "semaine 3 courante");
assert(buckets[0].doneMeters === 7600, `août S1 done ${buckets[0].doneMeters}`);
assert(buckets[2].doneMeters === 2000, `sept S3 done ${buckets[2].doneMeters}`);

const week = buildPeriodAnalytics(classicPlan, {}, "week", NOW);
assert(week.title === "Cette semaine", "titre semaine");
assert(week.doneMeters === 2000, `semaine done ${week.doneMeters}`);
assert(week.plannedMeters === 7600, "semaine prévue");
assert(week.doneSessions === 1 && week.plannedSessions === 3, "1/3 séances");
assert(week.showPrescribed, "prévu visible en semaine");
assert(week.isEmptyTarget === false, "pas vide");
assert(week.deltaLabel.includes("+") === false, `delta semaine ${week.deltaLabel}`);
assert(week.deltaLabel.includes("vs la semaine d’avant"), "libellé delta semaine");
assert(week.sparkline.some((bar) => bar.active && bar.label === "S3"), "sparkline S3 active");

const month = buildPeriodAnalytics(classicPlan, {}, "month", NOW);
assert(month.title === "Ce mois", "titre mois");
assert(month.doneMeters === 2000, `mois = semaines de sept. ${month.doneMeters}`);
assert(month.deltaLabel.startsWith("-"), `delta mois négatif ${month.deltaLabel}`);
assert(month.deltaLabel.includes("vs le mois d’avant"), "libellé delta mois");

const year = buildPeriodAnalytics(classicPlan, {}, "year", NOW);
const total = buildPeriodAnalytics(classicPlan, {}, "total", NOW);
assert(year.doneMeters === total.doneMeters, "année = total si tout en 2026");
assert(year.doneMeters === 7600 + 7600 + 2000, `total km ${year.doneMeters}`);
assert(total.deltaLabel === null, "pas de delta sur total");
assert(total.title === "Depuis le début", "titre total");

const emptyPlan = {
  startDate: new Date(2026, 8, 1, 10).getTime(),
  weeks: [{ number: 1, sessions: weekSessions([2000, 2200, 3400], [0, 0, 0]) }],
};
const emptyWeek = buildPeriodAnalytics(emptyPlan, {}, "week", NOW);
assert(emptyWeek.isEmptyTarget, "semaine 1 = objectif");
assert(emptyWeek.doneMeters === 0, "rien nagé");
assert(emptyWeek.plannedMeters === 7600, "cible 7.6 km");
assert(emptyWeek.deltaLabel === null, "pas de delta semaine 1");

const loopPlan = {
  isSessionLoop: true,
  startDate: new Date(2026, 7, 18, 10).getTime(),
  history: weekSessions([2000, 2200, 3400], [1, 1, 1]),
  weeks: [{ sessions: weekSessions([2100, 2300, 3500], [1, 0, 0]) }],
};
const loopWeek = buildPeriodAnalytics(loopPlan, { sessionsPerWeek: 3 }, "week", NOW);
assert(loopWeek.doneMeters === 2100, `loop semaine courante ${loopWeek.doneMeters}`);
assert(loopWeek.deltaLabel.includes("vs la semaine d’avant"), "loop delta");
const loopTotal = buildPeriodAnalytics(loopPlan, { sessionsPerWeek: 3 }, "total", NOW);
assert(loopTotal.doneMeters === 7600 + 2100, `loop total ${loopTotal.doneMeters}`);

assert(formatKm(0) === "0 km", "0 km");
assert(formatKm(400) === "400 m", "mètres");
assert(formatKm(2000) === "2.0 km", "2.0 km");
assert(formatDeltaLabel(0, "vs la semaine d’avant") === null, "delta 0 masqué");
assert(formatDeltaLabel(400, "vs la semaine d’avant") === "+400 m vs la semaine d’avant", "delta +m");
assert(formatDeltaLabel(-1200, "vs le mois d’avant") === "-1.2 km vs le mois d’avant", "delta -km");

assert(buildPeriodAnalytics(null, {}, "week", NOW) === null, "sans plan");

console.log("swimmer-period-stats PASS");
