/**
 * Tests parse / pick / fill catalogue Sheet.
 * Usage : node src/lib/natation-sheet/parse.test.js
 */
import {
  fillPlaceholders,
  lineAllowsMateriel,
  materializeSession,
  parseEducatifsCsv,
  parseSessionsCsv,
  pickEducatif,
  pickMaterielForLine,
  pickSession,
  excludeSheetNsFromHistory,
  excludeEducatifNamesFromHistory,
  educatifRowToUiFiche,
  sheetFamilyIdFromProfile,
} from "./parse.js";

function ok(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

const eduCsv = `Nom,Nage,Débutant,Intermédiaire,Avancé,À quoi ça sert,Comment on le fait,Matériel optionnel,Garder,Notes
Petit chien,crawl,non,oui,oui,x,y,"pull-buoy et/ou tubas",oui,
Grand chien,crawl,oui,oui,oui,x,y,"pull-buoy et/ou tubas",oui,
Flèche,crawl,oui,oui,oui,x,y,"tubas et/ou palmes",oui,
Ignore moi,crawl,oui,oui,oui,x,y,,non,
`;

const edu = parseEducatifsCsv(eduCsv);
ok(edu.length === 4, "4 rows");
ok(edu.filter((e) => e.garder).length === 3, "3 garder");
ok(edu.find((e) => e.nom === "Grand chien").debutant, "grand chien deb");
ok(
  edu.find((e) => e.nom === "Petit chien").materiel.includes("pull") &&
    edu.find((e) => e.nom === "Petit chien").materiel.includes("tuba"),
  "et/ou → alternatives pull + tuba",
);
ok(
  edu.find((e) => e.nom === "Petit chien").materielRaw === "pull-buoy et/ou tubas",
  "materielRaw = texte Sheet",
);

const ficheMat = educatifRowToUiFiche(edu.find((e) => e.nom === "Flèche"));
ok(ficheMat.equipment === "tubas et/ou palmes", "fiche recopie le Sheet tel quel");


const sessCsv = `n°,bande,total_m,échauffement,bloc de séance,retour au calme,contrôle_somme
1,débutant,1400,"100 m souple
100 m crawl (25 m {éducatif} + 25 m crawl)","4 × 50 m crawl {matériel}, repos 20 s
200 m crawl","100 m souple",1400
2,débutant,1600,"100 m {éducatif}","8 × 50 m crawl","100 m",1600
3,débutant,2000,"200 m","10 × 100 m","100 m",2000
`;

const sessions = parseSessionsCsv(sessCsv, { hasPhase: false });
ok(sessions.length === 3, "3 sessions");
ok(sessions[0].total_m === 1400, "1400");

// Plus de filtre volume : rng 0 → 1ʳᵉ du pool complet
const picked = pickSession(sessions, {}, () => 0);
ok(picked && picked.n === 1, "random first of full pool");

const picked2 = pickSession(sessions, { excludeNs: [1, 2] }, () => 0);
ok(picked2 && picked2.n === 3, "exclude last → only n°3");

const histNs = excludeSheetNsFromHistory(
  [
    { sheetMeta: { n: 1 } },
    { sheetMeta: { n: 2 } },
    { composerWhy: { sessionN: 5 } },
  ],
  10,
);
ok(histNs[0] === 5 && histNs.includes(2) && histNs.includes(1), "history ns newest first");

const histEdu = excludeEducatifNamesFromHistory(
  [
    { sheetMeta: { educatif: "Flèche" } },
    { sheetMeta: { educatif: "Grand chien" } },
    { sheetEducatif: { name: "Flèche" } },
  ],
  5,
);
ok(histEdu[0] === "Flèche" || histEdu[0] === "Grand chien", "history educatifs");
ok(histEdu.filter((n) => /flèche/i.test(n)).length === 1, "dedupe educatif");

const eduPick = pickEducatif(edu, { levelBand: "debutant", nage: "crawl" }, () => 0);
ok(eduPick && eduPick.debutant, "deb educatif");
ok(eduPick.nom !== "Petit chien", "petit chien not debutant");

const eduNoMatosGate = pickEducatif(
  edu,
  { levelBand: "debutant", nage: "crawl", hardExcludeNames: ["Grand chien"] },
  () => 0,
);
ok(eduNoMatosGate && eduNoMatosGate.nom === "Flèche", "éducatif = niveau, pas matos");

const eduAvoid = pickEducatif(
  edu,
  {
    levelBand: "intermediaire",
    nage: "crawl",
    excludeNames: ["Flèche", "Grand chien"],
  },
  () => 0,
);
ok(eduAvoid && eduAvoid.nom === "Petit chien", "exclude recent → autre éducatif");

const eduNoRepeat = pickEducatif(
  edu,
  {
    levelBand: "intermediaire",
    nage: "crawl",
    hardExcludeNames: ["Petit chien"],
    excludeNames: ["Flèche", "Grand chien", "Petit chien"],
  },
  () => 0,
);
ok(
  eduNoRepeat && eduNoRepeat.nom !== "Petit chien",
  "hard exclude → jamais le même d’affilée s’il reste une option",
);

const eduFallback = pickEducatif(
  edu,
  {
    levelBand: "debutant",
    nage: "crawl",
    hardExcludeNames: ["Flèche", "Grand chien"],
  },
  () => 0,
);
ok(eduFallback && eduFallback.debutant, "pool trop petit → recyclage OK");

const filled = materializeSession(
  sessions[0],
  edu,
  { levelBand: "debutant", nage: "crawl", equipment: ["palmes", "tuba"] },
  () => 0,
);
ok(!filled.echauffement.includes("{éducatif}"), "filled educatif");
ok(/Flèche|Grand chien/.test(filled.echauffement), "real name");
ok(!filled.bloc.includes("{matériel}") || /palmes|tuba|pull/.test(filled.bloc) || !filled.bloc.includes("{"), "materiel handled");

ok(
  pickMaterielForLine({ materiel: ["pull", "tuba", "palmes"] }, ["tuba"], "200 m crawl {matériel}", () => 0) ===
    "tuba",
  "matériel ∈ inventaire",
);
ok(
  pickMaterielForLine({ materiel: ["palmes"] }, [], "200 m crawl {matériel}", () => 0) === null,
  "pas d’inventaire → pas de matériel",
);
ok(
  pickMaterielForLine({ materiel: ["plaquettes"] }, ["palmes", "tuba"], "200 m crawl {matériel}", () => 0) ===
    null,
  "matos fiche hors inventaire → null",
);

ok(lineAllowsMateriel("4 × 50 m crawl", ["palmes"]), "palmes alone ok");
ok(!lineAllowsMateriel("4 × 50 m crawl pull-buoy", ["palmes"]), "pull+palmes line no");

const fiche = educatifRowToUiFiche({
  nom: "toucher cuisse",
  debutant: false,
  intermediaire: true,
  avance: true,
  utilite: "Aller au bout de la traction",
  comment: "Toucher la cuisse avec le pouce",
  materiel: ["palmes"],
  materielRaw: "palmes et/ou tubas ou pull-buoy et/ou tubas",
  notes: "",
  garder: true,
  nage: "crawl",
});
ok(fiche.name === "toucher cuisse", "fiche name");
ok(fiche.ficheSource === "sheet", "fiche source sheet");
ok(!/débutant/i.test(fiche.level || ""), "pas débutant dans niveau");
ok(/Intermédiaire/i.test(fiche.level), "intermédiaire");
ok(fiche.cue.includes("cuisse"), "consigne sheet");
ok(
  fiche.equipment === "palmes et/ou tubas ou pull-buoy et/ou tubas",
  "matériel optionnel = texte Sheet brut",
);
ok(
  sheetFamilyIdFromProfile({ goal: "progression", level: "régulier", swimStyle: "crawl" }) ===
    "01 Nager deb crawl",
  "vague1 deb crawl → 01",
);
ok(
  sheetFamilyIdFromProfile({ goal: "progression", level: "sportif", swimStyle: "crawl" }) ===
    "02 Nager crawl",
  "vague1 int crawl → 02",
);
ok(
  sheetFamilyIdFromProfile({ goal: "progression", level: "sportif", swimStyle: "4_nages" }) ===
    "03 Nager 4 nages",
  "vague1 int 4n → 03",
);
ok(
  sheetFamilyIdFromProfile({ goal: "progression", level: "performance", swimStyle: "4_nages" }) ===
    "03 Nager 4 nages",
  "vague1 avancé → 03",
);
ok(
  sheetFamilyIdFromProfile({ goal: "triathlon_sprint", level: "sportif", swimStyle: "crawl" }) === null,
  "vague1 tri pas encore branché",
);
ok(
  sheetFamilyIdFromProfile({ goal: "open_water_5k", level: "sportif", swimStyle: "crawl" }) === null,
  "vague1 OW pas encore branché",
);

console.log("natation-sheet/parse.test.js OK");
