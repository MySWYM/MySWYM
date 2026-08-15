/**
 * Non-régression extraction banques (étape 1 refonte).
 * Usage : node src/lib/swim-banks/swim-banks.test.js
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  TECHNIQUE,
  CORPS_PHYSIO,
  DEPARTS_SEMAINE,
  DEPARTS_AVEC_JAMBES,
  FINS_SEMAINE,
  FOCUS_CYCLE,
  FOCUS_CYCLE_DECOUVERTE,
  OW_BASE_SESSIONS,
  TECHNIQUE_DRILL_ENTRIES,
  MAIN_SET_ENTRIES,
  WARMUP_ENTRIES,
  COOLDOWN_ENTRIES,
  SESSION_ARCHETYPE_ENTRIES,
  LABEL_ENTRIES,
  countBankItems,
  getBankCatalog,
} from "./index.js";
import * as gen from "../swim-session-generator.js";
import {
  composeSession,
  buildSessionBrief,
  buildSportProfile,
} from "../sports-engine/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SNAP_PATH = path.join(__dirname, "_pre-extract-snapshot.json");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function fingerprintTechnique(T) {
  return Object.fromEntries(
    Object.entries(T).map(([k, v]) => [
      k,
      { label: v.label, drills: v.drills.map((d) => ({ distance: d.distance, lines: d.lines })) },
    ]),
  );
}
function fingerprintCorps(C) {
  return Object.fromEntries(Object.entries(C).map(([k, arr]) => [k, arr.map((fn) => fn())]));
}
function fingerprintDeparts(arr) {
  return arr.map((fn) => fn());
}
function fingerprintFins(arr) {
  return arr.map((fn) => fn(200));
}
function fingerprintOw(arr) {
  return arr.map((fn, i) => {
    const s = fn(50, "performance", { isPremium: false });
    return { i, title: s.title, type: s.type, intensity: s.intensity, details: s.details };
  });
}

function makeBrief(level, objectif, seed, volumeTarget) {
  const sport = buildSportProfile({
    level,
    goal:
      objectif === "eau_libre"
        ? "open_water_5k"
        : objectif === "triathlon"
          ? "triathlon_olympique"
          : "progression",
    category:
      objectif === "eau_libre"
        ? "open_water"
        : objectif === "triathlon"
          ? "triathlon"
          : "progression",
    equipment: ["planche", "pull", "palmes", "tuba"],
    pool: 50,
    sessionsPerWeek: 3,
  });
  sport.objectifV1 = objectif;
  const weekCtx = {
    sport,
    capacity: sport.capacity,
    volumePlan: {
      weekTarget: volumeTarget * 3,
      sessionTargets: [volumeTarget, volumeTarget, volumeTarget],
      lever: "volume",
      typeSemaine: "normale",
    },
    phaseKey: "foncier",
    effectivePhase: "base",
  };
  return buildSessionBrief({
    sport,
    weekCtx,
    role: { family: "endurance", zone: "Z2", objectif: "endurance" },
    weekIndex: 2,
    sessionIndex: 1,
    durationTarget: 45,
    seed,
  });
}

assert(fs.existsSync(SNAP_PATH), `snapshot manquant: ${SNAP_PATH}`);
const snap = JSON.parse(fs.readFileSync(SNAP_PATH, "utf8"));

/* ---- Comptes ---- */
const counts = countBankItems();
assert(counts.techniqueDrills === 97, `technique drills ${counts.techniqueDrills} ≠ 97`);
assert(counts.techniqueDrills === snap.techniqueDrillCount, "techniqueDrillCount snapshot");
assert(counts.departs === 16, `departs ${counts.departs}`);
assert(counts.departsJambes === 4, `departs jambes ${counts.departsJambes}`);
assert(counts.fins === 10, `fins ${counts.fins}`);
assert(counts.mainSets === 84, `main sets ${counts.mainSets}`);
assert(counts.archetypes === 18, `archetypes ${counts.archetypes}`);
assert(counts.echauffementsDead === 7, "ECHAUFFEMENTS legacy count");
assert(counts.retoursDead === 12, "RETOURS_CALME legacy count");

assert(Object.keys(TECHNIQUE).length === snap.techniqueKeys.length, "TECHNIQUE keys count");
assert(deepEqual(Object.keys(TECHNIQUE).sort(), [...snap.techniqueKeys].sort()), "TECHNIQUE keys");
assert(deepEqual(FOCUS_CYCLE, snap.focus), "FOCUS_CYCLE");
assert(deepEqual(FOCUS_CYCLE_DECOUVERTE, snap.focusDecouverte), "FOCUS_CYCLE_DECOUVERTE");

/* ---- Identifiants stables (même schéma que exercise-library) ---- */
const drillIds = TECHNIQUE_DRILL_ENTRIES.map((e) => e.id).sort();
const expectedDrillIds = Object.keys(TECHNIQUE)
  .flatMap((k) => TECHNIQUE[k].drills.map((_, i) => `${k}_${i}`))
  .sort();
assert(deepEqual(drillIds, expectedDrillIds), "ids drills");

const mainIds = MAIN_SET_ENTRIES.map((e) => e.id).sort();
const expectedMainIds = Object.keys(CORPS_PHYSIO)
  .flatMap((k) => CORPS_PHYSIO[k].map((_, i) => `corps_${k}_${i}`))
  .sort();
assert(deepEqual(mainIds, expectedMainIds), "ids main sets");

assert(
  WARMUP_ENTRIES.filter((e) => e.kind === "depart").every((e, i) => e.id === `depart_${i}`),
  "ids departs",
);
assert(
  COOLDOWN_ENTRIES.filter((e) => e.kind === "fin").every((e, i) => e.id === `fin_${i}`),
  "ids fins",
);
assert(
  SESSION_ARCHETYPE_ENTRIES.every((e, i) => e.id === `ow_archetype_${i}`),
  "ids archetypes",
);

/* ---- Contenu vs snapshot pré-extraction ---- */
assert(deepEqual(fingerprintTechnique(TECHNIQUE), snap.technique), "contenu TECHNIQUE");
assert(deepEqual(fingerprintCorps(CORPS_PHYSIO), snap.corps), "contenu CORPS_PHYSIO");
assert(deepEqual(fingerprintDeparts(DEPARTS_SEMAINE), snap.departs), "contenu DEPARTS_SEMAINE");
assert(
  deepEqual(fingerprintDeparts(DEPARTS_AVEC_JAMBES), snap.departsJambes),
  "contenu DEPARTS_AVEC_JAMBES",
);
assert(deepEqual(fingerprintFins(FINS_SEMAINE), snap.fins), "contenu FINS_SEMAINE");
assert(deepEqual(fingerprintOw(OW_BASE_SESSIONS), snap.ow), "contenu OW_BASE_SESSIONS");

/* ---- Même référence generator ↔ banks ---- */
assert(gen.TECHNIQUE === TECHNIQUE, "gen.TECHNIQUE alias");
assert(gen.CORPS_PHYSIO === CORPS_PHYSIO, "gen.CORPS_PHYSIO alias");
assert(gen.DEPARTS_SEMAINE === DEPARTS_SEMAINE, "gen.DEPARTS alias");
assert(gen.FINS_SEMAINE === FINS_SEMAINE, "gen.FINS alias");
assert(gen.OW_BASE_SESSIONS === OW_BASE_SESSIONS, "gen.OW alias");

/* ---- Métadonnées id/source/status (banques runtime étape 1) ---- */
const catalog = getBankCatalog();
for (const [bucket, entries] of Object.entries(catalog)) {
  if (bucket === "canonicalDrills") continue; // étape 2 — schéma / sources distincts
  for (const e of entries) {
    assert(typeof e.id === "string" && e.id.length > 0, `${bucket} id`);
    assert(typeof e.source === "string" && e.source.includes("swim-session-generator.js"), `${bucket} source`);
    assert(["legacy", "candidate", "canonical"].includes(e.status), `${bucket} status ${e.status}`);
  }
}
assert(LABEL_ENTRIES.length >= 9, "labels focus + materiel");
assert(Array.isArray(catalog.canonicalDrills) && catalog.canonicalDrills.length > 0, "canonical drills exposés");

/* ---- 3 profils × 3 seeds : séances identiques au snapshot ---- */
const PROFILES = [
  { level: "decouverte", objectif: "nager_progresser", vol: 900 },
  { level: "regulier", objectif: "nager_progresser", vol: 1400 },
  { level: "sportif", objectif: "eau_libre", vol: 1800 },
];
const SEEDS = ["case1-decouverte-np-30", "case2-decouverte-ow-45", "case3-regulier"];

for (const p of PROFILES) {
  for (const seed of SEEDS) {
    const key = `${p.level}|${p.objectif}|${seed}`;
    const brief = makeBrief(p.level, p.objectif, `${seed}::${p.level}`, p.vol);
    const r = composeSession(brief);
    const expected = snap.seanceSamples[key];
    assert(expected, `sample manquant ${key}`);
    assert(r.ok === expected.ok, `${key} ok`);
    assert(r.session?.distance === expected.distance, `${key} distance`);
    assert(r.session?.title === expected.title, `${key} title`);
    assert(r.session?.type === expected.type, `${key} type`);
    assert(deepEqual(r.session?.details, expected.details), `${key} details`);
  }
}

console.log("swim-banks.test.js OK", counts);
