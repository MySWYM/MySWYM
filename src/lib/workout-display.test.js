import assert from "node:assert/strict";
import { buildWorkoutView, splitHeadline, formatRestLabel, parseMetersFromLine } from "./workout-display.js";
import { matchEducatif, getEducatifById } from "../content/educatifs-catalog.js";

{
  const h = splitHeadline("8 × 50 m crawl — respiration 3 temps");
  assert.equal(h.volume, "8 × 50 m");
  assert.equal(h.stroke, "CRAWL");
}

{
  assert.ok(formatRestLabel("R20")?.includes("Récup"));
  assert.ok(formatRestLabel("D1'45\"")?.includes("Départ"));
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

console.log("workout-display.test.js PASS");
