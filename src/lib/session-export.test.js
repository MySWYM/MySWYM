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
  equipmentUsed: ["palmes", "planche"],
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
assert(!/\bZ3\b/.test(text), "pas de Z3 dans le texte");
assert(!text.includes("SEUIL"), "pas le type brut SEUIL");

const html = buildSessionPrintHtml(sample);
assert(html.includes("<!DOCTYPE html>"), "html doc");
assert(html.includes("Seuil progressif"), "html title");
assert(html.includes("MySWYM"), "html brand");
assert(html.includes("Matériel"), "html matériel");
assert(html.includes("Palmes"), "html palmes");
assert(html.includes("Planche"), "html planche");
assert(!html.includes("Réf."), "pas de réf. support");
assert(!html.includes("SEUIL"), "pas le type brut");
assert(!/\bZ3\b/.test(html), "pas de Z3");
assert(html.includes("soutenu"), "zone → soutenu");
assert(html.includes("CRAWL") || html.includes("crawl"), "nage comme l’app");
assert(html.includes("D1") || html.includes("D1'"), "départ D comme l’app");

const structured = {
  title: "Pyramide vitesse",
  type: "VITESSE",
  distance: "2200m",
  duration: 65,
  intensity: "Z3, vitesse contrôlée",
  equipmentUsed: ["palmes"],
  details: [
    "-Échauffement : 300m mix souple",
    "-8 × 50m crawl, respiration 3 temps, repos 15s",
    "-Pyramide crawl 100 → 200 → 300 → 200 → 100, repos 20s",
    "-Retour au calme : 200m dos facile",
  ],
};
const structuredHtml = buildSessionPrintHtml(structured);
assert(structuredHtml.includes("Échauffement"), "phase échauffement");
assert(structuredHtml.includes("Corps de séance"), "phase corps");
assert(structuredHtml.includes("Retour au calme"), "phase retour");
assert(!/\bsouple\b/i.test(structuredHtml), "D9: pas souple");
assert(!/\bZ1\b/.test(structuredHtml), "D9: pas Z1");
assert(structuredHtml.includes("Facile"), "échauffement Facile");
assert(structuredHtml.includes("R15") || structuredHtml.includes("R15\""), "récup R15");

const fourNages = {
  title: "Technique 4 nages",
  composedBy: "natation-sheet",
  distance: "200m",
  duration: 20,
  details: [
    "4 × 50 m 4 nages (25 m ondule-tête (pap) + rattrapé vertical (dos) + brasse en opposition (brasse) + doigts à la surface (crawl) + 25 m) (4 nages)",
  ],
  sheetEducatifs: [
    { name: "ondule-tête" },
    { name: "rattrapé vertical" },
    { name: "brasse en opposition" },
    { name: "doigts à la surface" },
  ],
};
const fourHtml = buildSessionPrintHtml(fourNages);
assert(fourHtml.includes("4 éducatifs (1 / nage)"), "cue app 4 nages");
assert(fourHtml.includes("50 m papillon : ondule-tête"), "50 m pap");
assert(fourHtml.includes("50 m dos : rattrapé vertical"), "50 m dos");
assert(fourHtml.includes("50 m brasse : brasse en opposition"), "50 m brasse");
assert(fourHtml.includes("50 m crawl : doigts à la surface"), "50 m crawl");
assert(!/\+ 25 m/i.test(fourHtml.replace(/<style>[\s\S]*?<\/style>/, "")), "pas de +25 m dans le corps");

const drills4 = [
  { name: "ondule-tête" },
  { name: "rattrapé vertical" },
  { name: "brasse en opposition" },
  { name: "doigts à la surface" },
];
function fourTokenSession(line) {
  return {
    title: "Technique 4 nages",
    composedBy: "natation-sheet",
    distance: "400m",
    duration: 20,
    details: [line],
    sheetEducatifs: drills4,
  };
}

const imHtml = buildSessionPrintHtml(fourTokenSession("4 × 100 m 4 nages {par 25m}"));
assert(imHtml.includes("4 nages enchaîné, 25 m par nage"), "cue IM {par 25m}");
assert(imHtml.includes("25 m papillon : ondule-tête"), "IM 25 m pap");
assert(imHtml.includes("25 m dos : rattrapé vertical"), "IM 25 m dos");
assert(!imHtml.includes("100 m papillon : ondule-tête"), "IM pas 100 m entier");

const perRepHtml = buildSessionPrintHtml(fourTokenSession("4 × 100 m 4 nages {par 100m}"));
assert(perRepHtml.includes("4 éducatifs (1 / nage)"), "cue {par 100m}");
assert(perRepHtml.includes("100 m papillon : ondule-tête"), "100 m pap entier");
assert(perRepHtml.includes("100 m crawl : doigts à la surface"), "100 m crawl entier");

const mixHtml = buildSessionPrintHtml(
  fourTokenSession("4 × 100 m 4 nages {25m éducatif + 25m nage}"),
);
assert(mixHtml.includes("1 nage / 100 m · 25 m éducatif + 25 m nage"), "cue 25+25");
assert(mixHtml.includes("100 m papillon : 25 m ondule-tête + 25 m papillon"), "25 drill + 25 nage pap");
assert(mixHtml.includes("100 m crawl : 25 m doigts à la surface + 25 m crawl"), "25 drill + 25 nage crawl");

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
