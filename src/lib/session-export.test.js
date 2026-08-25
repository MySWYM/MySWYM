/**
 * Tests export séance + projection semaine.
 * Usage: node src/lib/session-export.test.js
 */
import { formatSessionPlainText, buildSessionPrintHtml } from "./session-export.js";
import { buildWeekProjection } from "./week-projection.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const sample = {
  title: "Seuil progressif",
  type: "SEUIL",
  distance: "2200m",
  duration: 55,
  intensity: "Z3",
  details: [
    "400 m aisance crawl",
    "8×100 m seuil D1'40",
    "200 m retour easy",
  ],
};

const text = formatSessionPlainText(sample);
assert(text.includes("Seuil progressif"), "titre");
assert(text.includes("MySWYM"), "brand");
assert(/Échauffement|Corps|Retour/i.test(text), `phases dans texte: ${text.slice(0, 200)}`);

const html = buildSessionPrintHtml(sample);
assert(html.includes("<!DOCTYPE html>"), "html doc");
assert(html.includes("Seuil progressif"), "html title");
assert(html.includes("MySWYM"), "html brand");

const planWeek = {
  isSessionLoop: false,
  weeks: [
    {
      number: 1,
      focus: "Endurance",
      sessions: [
        { title: "Aéro", type: "ENDURANCE", distance: "2000m", completed: true },
        { title: "Technique", type: "TECHNIQUE", distance: "1800m" },
        { title: "Seuil", type: "SEUIL", distance: "2100m" },
      ],
    },
  ],
};
const proj = buildWeekProjection(planWeek, { sessionsPerWeek: 3 });
assert(proj?.totalCount === 3, "3 séances");
assert(proj.doneCount === 1, "1 faite");
assert(proj.sessions[1].isCurrent === true, "courante = 2e");
assert(proj.label.includes("1"), "label sem");

const loop = {
  isSessionLoop: true,
  weeks: [{ sessions: [{ title: "Du jour", type: "ENDURANCE", distance: "1500m" }] }],
  history: [
    { title: "Hier", type: "TECHNIQUE", distance: "1600m", completed: true },
  ],
};
const loopProj = buildWeekProjection(loop, { sessionsPerWeek: 3 });
assert(loopProj.totalCount === 3, "loop 3 slots");
assert(loopProj.sessions.some((s) => s.status === "upcoming"), "slots à venir");
assert(loopProj.sessions.some((s) => s.isCurrent), "slot courant");

console.log("session-export.test.js OK");
