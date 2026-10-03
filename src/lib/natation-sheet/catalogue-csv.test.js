/**
 * Aller-retour CSV Supabase → parseur Sheet.
 * Usage : node src/lib/natation-sheet/catalogue-csv.test.js
 */
import assert from "node:assert/strict";
import { educatifsToCsv, sessionsToCsv } from "./catalogue-csv.js";
import { parseEducatifsCsv, parseSessionsCsv } from "./parse.js";

const sessions = [
  {
    n: 1,
    phase: "build",
    bande: "intermédiaire",
    total_m: 1200,
    echauffement: "200m crawl",
    bloc: "4 × 50m, repos 20s",
    rac: "100m dos",
  },
  {
    n: 2,
    phase: null,
    bande: "avancé",
    total_m: 800,
    echauffement: 'ligne "citée"',
    bloc: "a\nb",
    rac: "",
  },
];

const rebuilt = sessionsToCsv(sessions, { hasPhase: true });
const parsed = parseSessionsCsv(rebuilt, { hasPhase: true });
assert.equal(parsed.length, 2);
assert.equal(parsed[0].n, 1);
assert.equal(parsed[0].bloc, "4 × 50m, repos 20s");
assert.equal(parsed[1].echauffement, 'ligne "citée"');
assert.equal(parsed[1].bloc, "a\nb");
assert.equal(parsed[1].phase, null);

const edu = educatifsToCsv([
  {
    nom: "Rattrapé",
    nage: "crawl",
    debutant: true,
    intermediaire: true,
    avance: false,
    utilite: "glisse",
    comment: "bras, puis l'autre",
    materielRaw: "palmes et/ou pull-buoy",
    garder: true,
    notes: "",
  },
]);
const eduParsed = parseEducatifsCsv(edu);
assert.equal(eduParsed.length, 1);
assert.equal(eduParsed[0].nom, "Rattrapé");
assert.equal(eduParsed[0].debutant, true);
assert.equal(eduParsed[0].avance, false);
assert.deepEqual(eduParsed[0].materiel, ["palmes", "pull"]);
assert.equal(eduParsed[0].materielRaw, "palmes et/ou pull-buoy");

console.log("catalogue-csv.test.js OK");
