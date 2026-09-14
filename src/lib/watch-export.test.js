/**
 * Tests export montre Garmin (FIT).
 * Usage : node src/lib/watch-export.test.js
 */
import assert from "node:assert/strict";
import { buildWorkoutView } from "./workout-display.js";
import {
  buildWatchSteps,
  buildWatchExport,
  downloadWatchExport,
  encodeGarminFitWorkout,
  exportedDistanceMeters,
  isValidFitFile,
  poolLengthFromProfile,
  watchExportFilename,
} from "./watch-export.js";

const sheetSession = {
  title: "Seuil progressif",
  composedBy: "natation-sheet",
  distance: "1300m",
  duration: 45,
  details: [
    "-Échauffement : 300 m crawl facile",
    "-8 × 100 m crawl, D2'05\" @1:39-1:46",
    "-Bloc 2, consigne glisse",
    "-Retour au calme : 200 m dos facile, repos 20 s",
  ],
};

const composerSession = {
  title: "Régulier · endurance",
  composedBy: "session-composer",
  distance: "1500m",
  duration: 45,
  details: [
    "-300m crawl facile",
    "-8 × 50m crawl - repos 20s",
    "-6 × 100m crawl - repos 15s",
    "-200m crawl facile",
  ],
  sets: [
    { block: "depart", label: "300m crawl facile" },
    { block: "corps", label: "8 × 50m crawl" },
    { block: "corps", label: "6 × 100m crawl" },
    { block: "fin", label: "200m crawl facile" },
  ],
};

function viewMeters(session) {
  const view = buildWorkoutView(session);
  return (view.exercises || [])
    .filter((ex) => Number(ex.meters) > 0)
    .reduce((sum, ex) => sum + Number(ex.meters), 0);
}

function containsU32LE(bytes, value) {
  const v = value >>> 0;
  const b0 = v & 0xFF;
  const b1 = (v >> 8) & 0xFF;
  const b2 = (v >> 16) & 0xFF;
  const b3 = (v >> 24) & 0xFF;
  for (let i = 0; i < bytes.length - 3; i += 1) {
    if (bytes[i] === b0 && bytes[i + 1] === b1 && bytes[i + 2] === b2 && bytes[i + 3] === b3) {
      return true;
    }
  }
  return false;
}

assert.equal(poolLengthFromProfile({ pool: 50 }), 50);
assert.equal(poolLengthFromProfile({ pool: 25 }), 25);
assert.equal(poolLengthFromProfile({ pool: 0 }), 25);
assert.equal(poolLengthFromProfile({}), 25);
assert.equal(watchExportFilename(new Date("2026-09-14T12:00:00")), "myswym-seance-20260914.fit");

{
  const built = buildWatchSteps(sheetSession, { profile: { pool: 25 } });
  assert.equal(built.pool, 25);
  assert.ok(built.skipped.some((s) => s.reason === "no_meters"), "ligne sans mètres skippée");
  const distanceSteps = built.steps.filter((s) => s.kind === "distance");
  assert.equal(exportedDistanceMeters(built.steps), viewMeters(sheetSession));
  assert.equal(exportedDistanceMeters(built.steps), 1300);
  assert.equal(distanceSteps.length, 3);
  const paced = distanceSteps.find((s) => s.meters === 800);
  assert.ok(paced, "8 × 100 = 800 m");
  assert.ok(paced.paceLowSeconds > 0 && paced.paceHighSeconds > 0, "allure déjà calculée");
  const warm = distanceSteps.find((s) => s.intensity === "warmup");
  const cool = distanceSteps.find((s) => s.intensity === "cooldown");
  assert.ok(warm && warm.meters === 300, "échauffement");
  assert.ok(cool && cool.meters === 200, "RAC");
  assert.ok(built.steps.some((s) => s.kind === "rest" && s.seconds === 20), "repos RAC");
  const corps = distanceSteps.find((s) => s.meters === 800);
  assert.equal(corps.paceLowSeconds != null, true);
}

{
  const noPace = buildWatchSteps({
    composedBy: "natation-sheet",
    details: ["-Échauffement : 200 m crawl facile", "-4 × 50 m crawl, repos 15 s"],
  });
  assert.ok(noPace.steps.every((s) => !s.paceLowSeconds && !s.paceHighSeconds), "pas d’allure inventée");
  assert.ok(noPace.steps.some((s) => s.kind === "rest" && s.seconds === 15));
}

{
  const built = buildWatchExport(composerSession, {
    profile: { pool: 50 },
    now: new Date("2026-09-14T12:00:00"),
  });
  assert.equal(built.pool, 50);
  assert.equal(built.format, "fit");
  assert.equal(built.filename, "myswym-seance-20260914.fit");
  assert.ok(built.bytes.byteLength > 0, "fichier non vide");
  assert.ok(isValidFitFile(built.bytes), "CRC FIT");
  assert.equal(exportedDistanceMeters(built.steps), viewMeters(composerSession));
  assert.equal(exportedDistanceMeters(built.steps), 1500);
  assert.ok(built.steps.some((s) => s.intensity === "warmup"));
  assert.ok(built.steps.some((s) => s.intensity === "cooldown"));
  assert.ok(containsU32LE(built.bytes, 300 * 100), "300 m en cm dans le FIT");
  assert.ok(containsU32LE(built.bytes, 400 * 100), "8 × 50 = 400 m");
  assert.ok(containsU32LE(built.bytes, 600 * 100), "6 × 100 = 600 m");
  assert.ok(built.steps.every((s) => !s.paceLowSeconds), "composeur fixture : pas d’allure");
}

{
  const sheetFile = buildWatchExport(sheetSession, { profile: { pool: 25 } });
  assert.ok(sheetFile.bytes.byteLength > 0, "FIT Sheet non vide");
  assert.ok(isValidFitFile(sheetFile.bytes), "CRC Sheet");
  assert.equal(exportedDistanceMeters(sheetFile.steps), 1300);
  assert.ok(containsU32LE(sheetFile.bytes, 800 * 100), "800 m Sheet");
}

{
  const empty = encodeGarminFitWorkout({ steps: [], name: "Vide", pool: 25 });
  assert.ok(isValidFitFile(empty), "FIT vide toujours CRC-ok");
}

{
  const result = await downloadWatchExport(sheetSession, { profile: { pool: 25 } });
  assert.equal(result.ok, true);
  assert.equal(result.format, "fit");
  assert.equal(result.downloaded, false, "pas de DOM en Node");
}

{
  const result = await downloadWatchExport({ composedBy: "natation-sheet", details: ["-Focus : glisse"] });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "empty");
}

{
  const locked = await downloadWatchExport(sheetSession, { isPremium: false });
  assert.equal(locked.ok, false);
  assert.equal(locked.reason, "locked");
}

console.log("watch-export.test.js ok");
