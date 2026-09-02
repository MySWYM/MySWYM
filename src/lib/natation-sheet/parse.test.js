/**
 * Tests parse / pick / fill catalogue Sheet.
 * Usage : node src/lib/natation-sheet/parse.test.js
 */
import {
  fillPlaceholders,
  fourNagesDisplayCue,
  lineAllowsMateriel,
  lineHasFourNagesEducatifs,
  materializeSession,
  parseFourNagesMode,
  stripFourNagesModeToken,
  parseEducatifsCsv,
  parseSessionsCsv,
  pickEducatif,
  pickFourNagesEducatifs,
  pickMaterielForLine,
  pickSession,
  excludeSheetNsFromHistory,
  excludeEducatifNamesFromHistory,
  educatifRowToUiFiche,
  sheetFamilyIdFromProfile,
  formatFourNagesEducatifsLabel,
  normalizeMaterielToken,
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
Pap un bras,papillon,non,oui,oui,x,y,,oui,
Dos deux bras,dos,non,oui,oui,x,y,,oui,
Coulée brasse,brasse,non,oui,oui,x,y,,oui,
`;

const edu = parseEducatifsCsv(eduCsv);
ok(edu.length === 7, "7 rows");
ok(edu.filter((e) => e.garder).length === 6, "6 garder");
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
ok(lineAllowsMateriel("4 × 50 m crawl pull-buoy", ["élastique"]), "pull+élastique ok");
ok(!lineAllowsMateriel("4 × 50 m crawl palmes", ["élastique"]), "élastique+palmes line no");
ok(!lineAllowsMateriel("4 × 50 m planche", ["élastique"]), "élastique+planche line no");
ok(normalizeMaterielToken("finger paddles") === "plaquettes_doigts", "finger paddles token");
ok(normalizeMaterielToken("plaquettes") === "plaquettes", "plaquettes token");
ok(normalizeMaterielToken("paddle") === "plaquettes", "paddle → plaquettes");

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
  sheetFamilyIdFromProfile({ goal: "triathlon_sprint", level: "sportif", swimStyle: "crawl" }) ===
    "05 XS-Sprint crawl",
  "vague2 sprint int crawl → 05",
);
ok(
  sheetFamilyIdFromProfile({ goal: "triathlon_xs", level: "régulier", swimStyle: "crawl" }) ===
    "04 XS-Sprint deb crawl",
  "vague2 XS deb → 04",
);
ok(
  sheetFamilyIdFromProfile({ goal: "triathlon_xs", level: "sportif", swimStyle: "4_nages" }) ===
    "06 XS-Sprint 4 nages",
  "vague2 XS int 4n → 06",
);
ok(
  sheetFamilyIdFromProfile({ goal: "triathlon_sprint", level: "performance", swimStyle: "crawl" }) ===
    "06 XS-Sprint 4 nages",
  "vague2 sprint avancé → 06",
);
ok(
  sheetFamilyIdFromProfile({ goal: "triathlon_olympic", level: "sportif", swimStyle: "crawl" }) ===
    "07 Oly-Half-Full crawl",
  "vague3 Oly int crawl → 07",
);
ok(
  sheetFamilyIdFromProfile({ goal: "triathlon_half", level: "régulier", swimStyle: "crawl" }) ===
    "07 Oly-Half-Full crawl",
  "vague3 Half deb → 07 (pas de feuille deb)",
);
ok(
  sheetFamilyIdFromProfile({ goal: "triathlon_ironman", level: "performance", swimStyle: "crawl" }) ===
    "08 Oly-Half-Full 4 nages",
  "vague3 Full avancé → 08",
);
ok(
  sheetFamilyIdFromProfile({ goal: "triathlon_olympic", level: "sportif", swimStyle: "4_nages" }) ===
    "08 Oly-Half-Full 4 nages",
  "vague3 Oly int 4n → 08",
);
ok(
  sheetFamilyIdFromProfile({ goal: "open_water_short", level: "régulier", swimStyle: "crawl" }) ===
    "09 OW courte deb crawl",
  "vague3 OW short deb → 09",
);
ok(
  sheetFamilyIdFromProfile({ goal: "open_water_1k", level: "sportif", swimStyle: "crawl" }) ===
    "10 OW courte crawl",
  "vague3 OW legacy 1k → 10",
);
ok(
  sheetFamilyIdFromProfile({ goal: "open_water_short", level: "sportif", swimStyle: "4_nages" }) ===
    "11 OW courte 4 nages",
  "vague3 OW short 4n → 11",
);
ok(
  sheetFamilyIdFromProfile({ goal: "open_water_5k", level: "sportif", swimStyle: "crawl" }) ===
    "12 OW moy-long crawl",
  "vague3 OW mid → 12",
);
ok(
  sheetFamilyIdFromProfile({ goal: "open_water_long", level: "performance", swimStyle: "crawl" }) ===
    "13 OW moy-long 4 nages",
  "vague3 OW long avancé → 13",
);
ok(
  sheetFamilyIdFromProfile({ goal: "open_water_25k", level: "régulier", swimStyle: "crawl" }) ===
    "12 OW moy-long crawl",
  "vague3 OW legacy 25k deb → 12",
);

ok(lineHasFourNagesEducatifs("100 m 4 nages éducatifs"), "détecte 4 nages + éducatifs");
ok(lineHasFourNagesEducatifs("4 × 50 m (25 m {éducatif} + 25 m) (4 nages)"), "détecte 4 nages + {éducatif}");
ok(lineHasFourNagesEducatifs("4 × 100 m 4 nages {par 25m}"), "jeton {par 25m}");
ok(lineHasFourNagesEducatifs("4 × 100 m 4 nages {par 100m}"), "jeton {par 100m}");
ok(lineHasFourNagesEducatifs("4 × 100 m 4 nages {25m éducatif + 25m nage}"), "jeton drill+nage");
ok(!lineHasFourNagesEducatifs("100 m crawl {éducatif}"), "pas 4 nages → mono");

ok(parseFourNagesMode("4 × 100 m 4 nages {par 25m}")?.kind === "im", "{par 25m} = IM");
ok(parseFourNagesMode("4 × 100 m 4 nages {par 100m}")?.kind === "per_rep", "{par 100m} = 1 nage / rep");
ok(parseFourNagesMode("4 × 50 m 4 nages {par 50m}")?.kind === "per_rep", "{par 50m} = 1 nage / rep");
ok(
  parseFourNagesMode("4 × 100 m 4 nages {25m éducatif + 25m nage}")?.kind === "drill_then_swim",
  "{25m éducatif + 25m nage}",
);
ok(!parseFourNagesMode("4 × 100 m 4 nages éducatifs"), "sans jeton → null (legacy injecte les noms)");
ok(
  stripFourNagesModeToken("4 × 100 m 4 nages {par 25m}") === "4 × 100 m 4 nages",
  "strip {par 25m}",
);
ok(
  fourNagesDisplayCue({ kind: "im", sliceMeters: 25 }) === "4 nages enchaîné, 25 m par nage",
  "cue IM",
);
ok(
  fourNagesDisplayCue({ kind: "per_rep" }) === "4 éducatifs (1 / nage)",
  "cue 1 nage / rep",
);
ok(
  fourNagesDisplayCue({ kind: "drill_then_swim", sliceMeters: 25 }, "4 × 100 m") ===
    "1 nage / 100 m · 25 m éducatif + 25 m nage",
  "cue 25 éducatif + 25 nage",
);

const keptIm = fillPlaceholders("4 × 100 m 4 nages {par 25m}", {
  fourNagesLabel: "ondule-tête (pap) + rattrapé (dos) + opp (brasse) + doigts (crawl)",
});
ok(keptIm.includes("{par 25m}"), "fill garde {par 25m}");
ok(!/ondule-tête/.test(keptIm), "fill ne dump pas les 4 noms si jeton");

const keptMix = fillPlaceholders("4 × 100 m 4 nages {25m éducatif + 25m nage}", {
  fourNagesLabel: "ondule-tête (pap) + rattrapé (dos)",
});
ok(keptMix.includes("{25m éducatif + 25m nage}"), "fill garde le jeton 25+25");
ok(!/ondule-tête/.test(keptMix), "fill ne casse pas éducatif du jeton");

const four = pickFourNagesEducatifs(edu, { levelBand: "intermediaire" }, () => 0);
ok(four.papillon?.nage === "papillon", "1 papillon");
ok(four.dos?.nage === "dos", "1 dos");
ok(four.brasse?.nage === "brasse", "1 brasse");
ok(/crawl/.test(four.crawl?.nage || ""), "1 crawl");
ok(four.list.length === 4, "quatuor");
const fourNames = new Set(four.list.map((e) => e.nom));
ok(fourNames.size === 4, "4 noms distincts");

const label = formatFourNagesEducatifsLabel(four);
ok(/pap\)/.test(label) && /dos\)/.test(label) && /\+/.test(label), "label 4 nages");

const sess4Csv = `n°,bande,total_m,échauffement,bloc de séance,retour au calme,contrôle_somme
1,intermédiaire,1400,"100 m 4 nages éducatifs","8 × 50 m 4 nages","100 m",1400
`;
const sess4 = parseSessionsCsv(sess4Csv, { hasPhase: false });
const filled4 = materializeSession(
  sess4[0],
  edu,
  { levelBand: "intermediaire", nage: "4_nages" },
  () => 0,
);
ok(!/éducatifs?/i.test(filled4.echauffement), "mot éducatif remplacé");
ok(/100 m 4 nages /.test(filled4.echauffement), "distance inchangée");
ok(filled4.educatifs?.length === 4, "4 éducatifs attachés");
ok(
  /Pap un bras|Dos deux bras|Coulée brasse|Flèche|Grand chien|Petit chien/.test(filled4.echauffement),
  "noms réels dans la ligne",
);

const sessTokCsv = `n°,bande,total_m,échauffement,bloc de séance,retour au calme,contrôle_somme
1,intermédiaire,1400,"100 m crawl","4 × 100 m 4 nages {par 25m}","4 × 100 m 4 nages {25m éducatif + 25m nage}",1400
`;
const sessTok = parseSessionsCsv(sessTokCsv, { hasPhase: false });
const filledTok = materializeSession(
  sessTok[0],
  edu,
  { levelBand: "intermediaire", nage: "4_nages" },
  () => 0,
);
ok(filledTok.bloc.includes("{par 25m}"), "materialize garde {par 25m}");
ok(
  filledTok.rac.includes("{25m éducatif + 25m nage}"),
  "materialize garde {25m éducatif + 25m nage}",
);
ok(filledTok.educatifs?.length === 4, "jetons : 4 éducatifs quand même attachés");
ok(!/Pap un bras/.test(filledTok.bloc), "jeton IM : pas de dump des noms dans la ligne");

const histEdu4 = excludeEducatifNamesFromHistory(
  [{ sheetMeta: { educatifs: ["Pap un bras", "Dos deux bras", "Coulée brasse", "Petit chien"] } }],
  5,
);
ok(histEdu4.length === 4, "historique multi-éducatifs");

console.log("natation-sheet/parse.test.js OK");
