import assert from "node:assert/strict";
import {
  buildWorkoutView,
  splitHeadline,
  formatRestLabel,
  parseMetersFromLine,
  scrubLegacyNormalWording,
  parseDepartInterval,
  formatDepartChip,
  formatDepartHuman,
  parseAllurePaceRange,
  formatAllurePaceChip,
  stripAllurePaceMarkers,
  stripDepartMarkers,
  stripSprintMarkers,
  parseRepAllureEnchainement,
  parseSequentialAllureEnchainement,
  parseAllureEnchainement,
  hasContrastingPaces,
  parseRestInterval,
  formatRestChip,
} from "./workout-display.js";
import { matchEducatif, getEducatifById } from "../content/educatifs-catalog.js";

{
  assert.equal(scrubLegacyNormalWording("Jambes crawl avec planche,"), "Jambes crawl avec planche");
  assert.equal(scrubLegacyNormalWording("Avec palmes,"), "Avec palmes");
  assert.equal(scrubLegacyNormalWording("crawl normal"), "crawl");
  assert.equal(scrubLegacyNormalWording("crawl*souple"), "crawl souple");
  assert.equal(scrubLegacyNormalWording("(1, 1 inversé)"), "1× normal · 1× inversé");
  assert.equal(scrubLegacyNormalWording("(2, 2 inversé)"), "2× normal · 2× inversé");
  assert.equal(scrubLegacyNormalWording("1, 1 inversé"), "1× normal · 1× inversé");
}

{
  const enc = parseRepAllureEnchainement(
    "4 × 50 m papillon (1 lent, 1 moyen, 1 rapide, 1 souple), départ 1 min",
  );
  assert.ok(enc);
  assert.equal(enc.cue, "1 lent · 1 moyen · 1 rapide · 1 souple");
  assert.equal(enc.steps.length, 4);
  assert.ok(hasContrastingPaces("(1 lent, 1 moyen, 1 rapide, 1 souple)"));
  assert.equal(parseRepAllureEnchainement("200 m crawl souple"), null);
  assert.equal(parseAllureEnchainement("200 m crawl souple"), null);
}

{
  const seq = parseSequentialAllureEnchainement("4 × 100 m crawl lent progressif R15\"");
  assert.ok(seq);
  assert.equal(seq.cue, "lent · progressif");
  assert.equal(seq.steps.length, 2);
  const seq3 = parseAllureEnchainement("6 × 100 m crawl souple moyen vite R45\"");
  assert.ok(seq3);
  assert.equal(seq3.cue, "souple · moyen · vite");
  assert.ok(hasContrastingPaces("crawl souple moyen vite"));
  assert.equal(parseSequentialAllureEnchainement("200 m crawl souple"), null);
}

{
  const view = buildWorkoutView({
    composedBy: "natation-sheet",
    details: ["-4 × 50 m papillon (1 lent, 1 moyen, 1 rapide, 1 souple), départ 1 min"],
    sets: [{ block: "corps", label: "4 × 50 m papillon (1 lent, 1 moyen, 1 rapide, 1 souple), départ 1 min" }],
  });
  const ex = view.exercises[0];
  assert.equal(ex.strokeLabel, "PAPILLON");
  assert.equal(ex.departLabel, "D1'");
  assert.ok(ex.allureEnchainement);
  assert.equal(ex.cue, "1 lent · 1 moyen · 1 rapide · 1 souple");
  assert.equal(ex.effortLabel, null, "pas de pastille souple unique sur un enchaînement");
  assert.ok(/\bsouple\b/.test(ex.cue), "souple conservé dans le cue (≠ strip)");
}

{
  const view = buildWorkoutView({
    composedBy: "natation-sheet",
    details: ['-4 × 100 m crawl lent progressif R15"'],
    sets: [{ block: "depart", label: '4 × 100 m crawl lent progressif R15"' }],
  });
  const ex = view.exercises[0];
  assert.ok(ex.allureEnchainement);
  assert.equal(ex.cue, "lent · progressif");
  assert.equal(ex.effortLabel, null);
  assert.equal(ex.strokeLabel, "CRAWL");
}

{
  const view = buildWorkoutView({
    composedBy: "natation-sheet",
    details: ['-6 × 100 m crawl souple moyen vite R45"'],
    sets: [{ block: "corps", label: '6 × 100 m crawl souple moyen vite R45"' }],
  });
  const ex = view.exercises[0];
  assert.ok(ex.allureEnchainement);
  assert.equal(ex.cue, "souple · moyen · vite");
  assert.equal(ex.effortLabel, null, "pas de pastille souple seule");
}

{
  assert.equal(parseDepartInterval("départ toutes les 2 min")?.seconds, 120);
  assert.equal(parseDepartInterval("D2'")?.seconds, 120);
  assert.equal(parseDepartInterval("D1'30\"")?.seconds, 90);
  assert.equal(formatDepartChip(120), "D2'");
  assert.equal(formatDepartChip(90), "D1'30\"");
  assert.equal(formatDepartHuman(120), "2 minutes");
  assert.equal(stripDepartMarkers("Sprint, départ toutes les 2 min"), "Sprint");
  assert.equal(stripSprintMarkers("Sprint"), null);
  assert.equal(formatRestLabel("D2'"), null);
  assert.equal(formatRestLabel("repos 30 s"), null, "repos → pastille R, pas MetaPill");
  assert.equal(parseRestInterval("repos 30 s")?.seconds, 30);
  assert.equal(parseRestInterval("R20")?.seconds, 20);
  assert.equal(parseRestInterval("R1'30\"")?.seconds, 90);
  assert.equal(formatRestChip(30), 'R30"');
  assert.equal(formatRestChip(90), "R1'30\"");
  assert.equal(parseAllurePaceRange("crawl @1:39-1:46")?.low, "1:39");
  assert.equal(parseAllurePaceRange("(Z2 @1:05-1:12)")?.high, "1:12");
  assert.equal(formatAllurePaceChip("1:39", "1:46"), "@1:39–1:46");
  assert.equal(stripAllurePaceMarkers("moyen @1:39-1:46"), "moyen");
  assert.equal(stripAllurePaceMarkers("(Z3 @1:20-1:26)"), null);
}

{
  const view = buildWorkoutView({
    composedBy: "natation-sheet",
    details: ['-8 × 100 m crawl, D2\'05" @1:39-1:46'],
    sets: [{ block: "corps", label: '8 × 100 m crawl, D2\'05" @1:39-1:46' }],
  });
  const ex = view.exercises[0];
  assert.equal(ex.departLabel, "D2'05\"");
  assert.equal(ex.allurePaceLabel, "@1:39–1:46");
  assert.equal(ex.allurePaceLow, "1:39");
  assert.equal(ex.allurePaceHigh, "1:46");
  assert.ok(!/@/.test(ex.cue || ""), "allure @ sortie du sous-texte");
}

{
  const view = buildWorkoutView({
    composedBy: "natation-sheet",
    details: ["-8 × 50 m crawl — Sprint, départ toutes les 2 min"],
    sets: [{ block: "corps", label: "8 × 50 m crawl — Sprint, départ toutes les 2 min" }],
  });
  const ex = view.exercises[0];
  assert.equal(ex.departLabel, "D2'");
  assert.equal(ex.departSeconds, 120);
  assert.equal(ex.sprint, true);
  assert.ok(!/départ/i.test(ex.cue || ""));
  assert.ok(!/sprint/i.test(ex.cue || ""));
}

{
  const view = buildWorkoutView({
    composedBy: "natation-sheet",
    details: ["-4 × 100 m crawl (1, 1 inversé), repos 20 s"],
    sets: [{ block: "corps", label: "4 × 100 m crawl (1, 1 inversé), repos 20 s" }],
  });
  const ex = view.exercises[0];
  assert.equal(ex.strokeLabel, "CRAWL");
  assert.equal(ex.cue, "1× normal · 1× inversé");
  assert.ok(!/\(1,\s*1/i.test(ex.cue || ""));
}

{
  const h = splitHeadline("100 m crawl*souple");
  assert.equal(h.volume, "100 m");
  assert.equal(h.stroke, "CRAWL");
  assert.equal(h.effort, "souple");
  assert.equal(h.rest, null);
}

{
  const view = buildWorkoutView({
    composedBy: "natation-sheet",
    details: ["-100 m crawl*souple"],
    sets: [{ block: "corps", label: "100 m crawl*souple" }],
  });
  const ex = view.exercises[0];
  assert.equal(ex.strokeLabel, "CRAWL");
  assert.equal(ex.effortLabel, "souple");
  assert.ok(!/souple/i.test(ex.cue || ""), "souple n’est plus en sous-texte");
}

{
  const h = splitHeadline("8 × 50 m crawl — respiration 3 temps");
  assert.equal(h.volume, "8 × 50 m");
  assert.equal(h.stroke, "CRAWL");
}

{
  const h = splitHeadline("100 m nage libre souple");
  assert.equal(h.volume, "100 m");
  assert.equal(h.stroke, "NAGE AU CHOIX");
  assert.equal(h.effort, "souple");
  assert.equal(h.rest, null);
  assert.equal(splitHeadline("200 m au choix").stroke, "NAGE AU CHOIX");
}

{
  const mix = splitHeadline("200 m en alternant (75 m crawl et 25 m dos)");
  assert.equal(mix.stroke, "MIXTE");
  assert.equal(mix.rest, "(75 m crawl et 25 m dos)");
  assert.equal(splitHeadline("200 m crawl / dos").stroke, "MIXTE");
  assert.equal(splitHeadline("200 m crawl / dos").rest, "(crawl / dos)");
  assert.equal(splitHeadline("8 × 50 m : 25 m crawl + 25 m au choix").stroke, "MIXTE");
  assert.equal(splitHeadline("8 × 50 m : 25 m crawl + 25 m au choix").rest, "(25 m crawl + 25 m au choix)");
  assert.equal(splitHeadline("300 m mix").stroke, "MIXTE");
  assert.equal(splitHeadline("200 m en alternant (50 m dos et 50 m brasse)").rest, "(50 m dos et 50 m brasse)");
  assert.equal(splitHeadline("4 × 100 m 4 nages").stroke, "4 NAGES");
  assert.equal(splitHeadline("400 m médley").stroke, "4 NAGES");
  assert.equal(splitHeadline("100 m crawl ou 4 nages souple").stroke, "CRAWL OU 4N");
  assert.equal(splitHeadline("100 m crawl ou 4 nages souple").effort, "souple");
  assert.equal(splitHeadline("100 m 4 nages ou crawl").stroke, "CRAWL OU 4N");
  assert.equal(splitHeadline("200 m nl ou 4 nages").stroke, "CRAWL OU 4N");
  assert.notEqual(splitHeadline("100 m nage libre").stroke, "CRAWL OU 4N");
}

{
  const view = buildWorkoutView({
    composedBy: "natation-sheet",
    details: ["-100 m crawl ou 4 nages souple"],
    sets: [{ block: "depart", label: "100 m crawl ou 4 nages souple" }],
  });
  const ex = view.exercises[0];
  assert.equal(ex.strokeLabel, "CRAWL OU 4N");
  assert.equal(ex.effortLabel, "souple");
  assert.equal(ex.cue, null, "pas de sous-texte doublon");
}

{
  // Main « 4 nages » + cue « Crawl ou 4 nages » → pas la pastille 4 NAGES imposée
  const view = buildWorkoutView({
    composedBy: "natation-sheet",
    details: ["-100 m 4 nages souple — Crawl ou 4 nages"],
    sets: [{ block: "depart", label: "100 m 4 nages souple — Crawl ou 4 nages" }],
  });
  const ex = view.exercises[0];
  assert.equal(ex.strokeLabel, "CRAWL OU 4N");
  assert.equal(ex.cue, null, "cue choice retiré (pastille suffit)");
}

{
  // Pastille LENT → pas de sous-texte « Lent »
  const view = buildWorkoutView({
    composedBy: "natation-sheet",
    details: ["-100 m crawl ou 4 nages lent"],
    sets: [{ block: "depart", label: "100 m crawl ou 4 nages lent" }],
  });
  const ex = view.exercises[0];
  assert.equal(ex.strokeLabel, "CRAWL OU 4N");
  assert.equal(ex.cue, null, "pas de doublon Lent sous pastille LENT");
  assert.equal(buildWorkoutView({
    details: ["-8 × 50 m crawl lent"],
    sets: [{ block: "corps", label: "8 × 50 m crawl lent" }],
  }).exercises[0].cue, null);
}

{
  // Enchaînement : garder l’ordre en sous-texte
  const view = buildWorkoutView({
    composedBy: "natation-sheet",
    details: ["-4 × 100 m crawl lent progressif"],
    sets: [{ block: "corps", label: "4 × 100 m crawl lent progressif" }],
  });
  assert.ok(view.exercises[0].allureEnchainement);
  assert.equal(view.exercises[0].cue, "lent · progressif");
}

{
  // souple + sprint → une pastille Enchaînement (pas SOUPLE + SPRINT)
  const view = buildWorkoutView({
    composedBy: "natation-sheet",
    details: ["-6 × 50 m nage au choix souple sprint — R30\""],
    sets: [{ block: "corps", label: "6 × 50 m nage au choix souple sprint — R30\"" }],
  });
  const ex = view.exercises[0];
  assert.ok(ex.allureEnchainement, "enchaînement détecté");
  assert.equal(ex.effortLabel, null);
  assert.equal(ex.sprint, false);
  assert.equal(ex.cue, "souple · sprint");
}

{
  // « souple » dans la parenthèse ne doit pas effacer la répartition MIXTE
  const view = buildWorkoutView({
    composedBy: "natation-sheet",
    details: ["-100 m en alternant (75 m crawl souple et 25 m dos)"],
    sets: [{ block: "corps", label: "100 m en alternant (75 m crawl souple et 25 m dos)" }],
  });
  const ex = view.exercises[0];
  assert.equal(ex.strokeLabel, "MIXTE");
  assert.equal(ex.effortLabel, "souple");
  assert.equal(ex.cue, "(75 m crawl et 25 m dos)");
}

{
  // Contraste d’allures : garder souple + progressif, pastille ENCHAÎNEMENT (pas SOUPLE seule)
  const view = buildWorkoutView({
    composedBy: "natation-sheet",
    details: ["-100 m crawl (75 m souple + 25 m progressif)"],
    sets: [{ block: "depart", label: "100 m crawl (75 m souple + 25 m progressif)" }],
  });
  const ex = view.exercises[0];
  assert.equal(ex.effortLabel, null);
  assert.ok(ex.allureEnchainement);
  assert.match(ex.cue || "", /75 m souple/);
  assert.match(ex.cue || "", /25 m progressif/);
  assert.ok(!/^\(75 m \+ 25 m\)$/.test(ex.cue || ""), `cue trop vide: ${ex.cue}`);
}

{
  const view = buildWorkoutView({
    composedBy: "natation-sheet",
    details: ["-8 × 100 m crawl (50 m moyen + 25 m vite + 25 m souple), repos 45 s"],
    sets: [{ block: "corps", label: "8 × 100 m crawl (50 m moyen + 25 m vite + 25 m souple), repos 45 s" }],
  });
  const ex = view.exercises[0];
  assert.equal(ex.effortLabel, null);
  assert.ok(ex.allureEnchainement);
  assert.match(ex.cue || "", /moyen/);
  assert.match(ex.cue || "", /vite/);
  assert.match(ex.cue || "", /souple/);
}

{
  assert.ok(formatRestLabel("R20") == null, "R… = pastille récup");
  assert.equal(formatRestLabel("D1'45\""), null, "D… = pastille départ, pas MetaPill récup");
}

{
  const view = buildWorkoutView({
    composedBy: "natation-sheet",
    details: ["-8 × 50 m crawl, repos 30 s"],
    sets: [{ block: "corps", label: "8 × 50 m crawl, repos 30 s" }],
  });
  const ex = view.exercises[0];
  assert.equal(ex.restChip, 'R30"');
  assert.equal(ex.restSeconds, 30);
  assert.equal(ex.restLabel, null);
}

{
  assert.equal(parseMetersFromLine("4 × 100 m crawl"), 400);
  assert.equal(parseMetersFromLine("300 m mix"), 300);
}

{
  const edu = matchEducatif("4×50m crawl — respiration 3 temps — repos 15s");
  assert.equal(edu?.id, "respiration_3t");
  assert.equal(edu?.ficheSource, "catalog");
  assert.ok(getEducatifById("godille")?.name);
  assert.equal(getEducatifById("godille")?.ficheSource, "arthur");
  assert.ok(getEducatifById("godille")?.cue?.includes("balayages") || getEducatifById("godille")?.cue?.length > 40);
  assert.equal(matchEducatif("300m crawl souple"), null);

  const fleche = matchEducatif("6×25m flèche avec palmes et tuba");
  assert.equal(fleche?.ficheSource, "arthur");
  assert.equal(fleche?.arthurId, "educatif_fleche");
  assert.ok(fleche?.level);

  const grand = matchEducatif("6×25m grand chien — facile");
  assert.equal(grand?.arthurId, "educatif_grand_chien");
  assert.equal(grand?.ficheSource, "arthur");

  const arthurNew = matchEducatif("4×25m crawl avec tuba frontal");
  assert.equal(arthurNew, null, "les 11 arthur_* ne doivent pas matcher automatiquement");
  assert.equal(matchEducatif("6×25m rattrapé cuisse"), null, "rattrapé cuisse ≠ crawl rattrapé");
}

{
  const session = {
    title: "Pyramide vitesse",
    type: "VITESSE",
    distance: "2200m",
    duration: 65,
    intensity: "Z3 — vitesse contrôlée",
    equipmentUsed: ["palmes"],
    details: [
      "-Échauffement : 300m mix souple",
      "-8 × 50m crawl — respiration 3 temps — repos 15s",
      "-Pyramide crawl 100 → 200 → 300 → 200 → 100 — repos 20s",
      "-Retour au calme : 200m dos facile",
    ],
  };
  const view = buildWorkoutView(session);
  assert.equal(view.header.title, "Pyramide vitesse");
  assert.ok(view.exercises.length >= 3);
  assert.ok(view.totalMeters >= 2000);
  const withDrill = view.exercises.find((e) => e.educatifId === "respiration_3t");
  assert.ok(withDrill, "éducatif 3T détecté");
  assert.ok(view.sections.some((s) => s.id === "warm" || s.id === "main"));
  assert.equal(view.sections.find((s) => s.id === "warm")?.exercises.length, 1);
  assert.equal(view.sections.find((s) => s.id === "cool")?.exercises.length, 1);
}

{
  // Classement via sets.block (sans préfixe Échauffement / Retour)
  const session = {
    title: "Crawl pur",
    distance: "1000m",
    details: [
      "-200 m crawl facile",
      "-8 × 50 m crawl — repos 20s",
      "-4 × 25 m flèche — repos 15s",
      "-100 m crawl facile",
    ],
    sets: [
      { block: "depart", reps: 1, distancePerRep: 200, label: "crawl facile" },
      { block: "corps", reps: 8, distancePerRep: 50, label: "crawl", restSec: 20 },
      { block: "technique", reps: 4, distancePerRep: 25, label: "flèche", restSec: 15 },
      { block: "fin", reps: 1, distancePerRep: 100, label: "crawl facile" },
    ],
  };
  const view = buildWorkoutView(session);
  assert.deepEqual(
    view.exercises.map((e) => e.section),
    ["warm", "main", "main", "cool"],
  );
  assert.equal(view.sections.length, 3);
  assert.ok(view.sections.find((s) => s.id === "warm")?.metersLabel);
  assert.equal(view.sections.find((s) => s.id === "main")?.exercises.length, 2);
}

{
  // Catalogue Sheet → 3 encadrés via sets.block
  const session = {
    title: "Séance · Flèche",
    distance: "1400m",
    details: [
      "-100 m nage libre souple",
      "-50 m crawl",
      "-100 m crawl (25 m Flèche + 25 m crawl)",
      "-2 × 50 m crawl allure régulière, repos 20 s",
      "-200 m crawl",
      "-100 m nage libre souple",
    ],
    sets: [
      { block: "depart", label: "100 m nage libre souple" },
      { block: "depart", label: "50 m crawl" },
      { block: "depart", label: "100 m crawl (25 m Flèche + 25 m crawl)" },
      { block: "corps", label: "2 × 50 m crawl allure régulière, repos 20 s" },
      { block: "corps", label: "200 m crawl" },
      { block: "fin", label: "100 m nage libre souple" },
    ],
  };
  const view = buildWorkoutView(session);
  assert.equal(view.sections.length, 3);
  assert.equal(view.sections[0].id, "warm");
  assert.equal(view.sections[0].label, "Échauffement");
  assert.equal(view.sections[1].id, "main");
  assert.equal(view.sections[1].label, "Corps de séance");
  assert.equal(view.sections[2].id, "cool");
  assert.equal(view.sections[2].label, "Retour au calme");
  assert.equal(view.sections[0].exercises.length, 3);
  assert.equal(view.sections[1].exercises.length, 2);
  assert.equal(view.sections[2].exercises.length, 1);
}

{
  // Sous-lignes d'intensité génériques masquées
  const session = {
    title: "Soft cues",
    distance: "900m",
    details: [
      "-100 m nage libre souple",
      "-4 × 100 m crawl — allure tenable, focus économie — repos 25s",
      "-100 m crawl facile — sans forcer",
      "-200 m crawl — confortable",
      "-50 m dos Normal",
    ],
  };
  const view = buildWorkoutView(session);
  for (const ex of view.exercises) {
    assert.equal(ex.cue, null, `cue soft: ${ex.raw} → ${ex.cue}`);
  }
  const dos = view.exercises.find((e) => e.strokeLabel === "DOS");
  assert.equal(dos?.volumeLabel, "50 m");
  assert.equal(dos?.cue, null);
}

{
  // « crawl normal » legacy → aligné Sheet (« crawl »)
  const session = {
    details: ["-100 m crawl (25 m Minimum de coup de bras + 25 m crawl normal)"],
  };
  const ex = buildWorkoutView(session).exercises[0];
  assert.equal(ex.cue, "(25 m Minimum de coup de bras + 25 m crawl)");
  assert.ok(!/normal/i.test(ex.cue));
}

{
  // Catalogue Sheet : fiche = onglet Éducatifs, jamais matchEducatif / Arthur .js
  const sheetFiche = {
    id: "sheet:toucher cuisse",
    name: "toucher cuisse",
    shortDescription: "Aller au bout de la traction",
    objective: "Aller au bout de la traction",
    cue: "Toucher la cuisse avec le pouce en fin de traction",
    level: "Intermédiaire · Avancé",
    equipment: "palmes",
    mistakes: [],
    ficheSource: "sheet",
  };
  const session = {
    composedBy: "natation-sheet",
    sheetEducatif: sheetFiche,
    details: ["-100 m crawl (25 m toucher cuisse + 25 m crawl)"],
  };
  const ex = buildWorkoutView(session).exercises[0];
  assert.equal(ex.educatif?.ficheSource, "sheet");
  assert.equal(ex.educatif?.name, "toucher cuisse");
  assert.ok(!/débutant/i.test(ex.educatif?.level || ""));
  assert.equal(ex.educatif?.cue, sheetFiche.cue);

  // Sans sheetEducatif attaché : pas de fallback Arthur
  const orphan = buildWorkoutView({
    composedBy: "natation-sheet",
    details: ["-100 m crawl (25 m toucher cuisse + 25 m crawl)"],
  }).exercises[0];
  assert.equal(orphan.educatif, null);

  // 4 nages : plusieurs fiches sur la même ligne
  const fourFiches = [
    { id: "sheet:pap", name: "Pap un bras", ficheSource: "sheet" },
    { id: "sheet:dos", name: "Dos deux bras", ficheSource: "sheet" },
    { id: "sheet:br", name: "Coulée brasse", ficheSource: "sheet" },
    { id: "sheet:cr", name: "Flèche", ficheSource: "sheet" },
  ];
  const fourEx = buildWorkoutView({
    composedBy: "natation-sheet",
    sheetEducatif: fourFiches[0],
    sheetEducatifs: fourFiches,
    details: ["-100 m 4 nages Pap un bras (pap) + Dos deux bras (dos) + Coulée brasse (brasse) + Flèche (crawl)"],
  }).exercises[0];
  assert.equal(fourEx.educatifs?.length, 4);
  assert.equal(fourEx.educatif?.name, "Pap un bras");
}

console.log("workout-display.test.js PASS");
