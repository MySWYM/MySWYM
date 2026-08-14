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
  assert.ok(getEducatifById("godille")?.name);
  assert.equal(matchEducatif("300m crawl souple"), null);
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
}

console.log("workout-display.test.js PASS");
