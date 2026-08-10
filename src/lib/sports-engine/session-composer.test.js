/**
 * Tests déterministes — session composer V1 (Étape A→B Découverte + Gold/stroke).
 * Usage : node src/lib/sports-engine/session-composer.test.js
 */
import {
  buildSportProfile,
  buildSessionBrief,
  composeSession,
  volumeFromSets,
  assertVolumeConsistency,
  validateDecouverteHard,
  rejectExerciseForBrief,
  countTechniqueDrills,
  getExerciseInventory,
  filterExercises,
  isComposerEnabledForLevel,
  SESSION_COMPOSER_ENABLED_LEVELS,
  maxContinuousForDecouverte,
  coherentVolumeForDecouverte,
  normalizeStrokeFocus,
  canUsePapillon,
  GOLD_SCENARIOS,
} from "./index.js";
import { calcDetailsDistance } from "../swim-session-generator.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function briefFrom({
  level,
  objectif,
  duration,
  equipment,
  volumeTarget,
  family,
  seed,
  pool = 50,
  strokeFocus,
  papillonMastered,
  sessionIntent,
  maxContinuousDistance,
  capacity,
} = {}) {
  const sport = buildSportProfile({
    level,
    goal:
      objectif === "eau_libre"
        ? "open_water_5k"
        : objectif === "nager_progresser"
          ? "progression"
          : objectif === "reprendre"
            ? "reprendre"
            : objectif === "triathlon"
              ? "triathlon_olympique"
              : objectif,
    category:
      objectif === "eau_libre"
        ? "open_water"
        : objectif === "triathlon"
          ? "triathlon"
          : "progression",
    equipment,
    pool,
    sessionsPerWeek: 3,
    strokeFocus,
    papillonMastered,
  });
  sport.objectifV1 = objectif;
  if (strokeFocus) sport.strokeFocus = strokeFocus;
  if (papillonMastered != null) sport.papillonMastered = papillonMastered;
  if (capacity) sport.capacity = capacity;
  const weekCtx = {
    sport,
    capacity: sport.capacity,
    volumePlan: {
      weekTarget: volumeTarget * 3,
      sessionTargets: [volumeTarget, volumeTarget, volumeTarget],
      lever: "volume",
      typeSemaine: "normale",
    },
    maxZone: "Z2",
    phaseKey: "foncier",
    why: "test",
  };
  const brief = buildSessionBrief({
    sport,
    weekCtx: { ...weekCtx, _phaseName: "base" },
    role: {
      objectif: family === "technique" ? "technique_fleche" : "endurance",
      zone: "Z1",
      family: family || "endurance",
      intent: family || "endurance",
      isKeySession: family === "endurance" && objectif === "eau_libre",
      sessionIntent,
    },
    weekIndex: 0,
    sessionIndex: 0,
    durationTarget: duration,
    seed,
    previousSessionContext: maxContinuousDistance
      ? { maxContinuousDistance }
      : null,
  });
  if (sessionIntent) brief.sessionIntent = sessionIntent;
  if (strokeFocus) brief.strokeFocus = strokeFocus;
  if (papillonMastered != null) brief.papillonMastered = papillonMastered;
  return brief;
}

function hasFourBlocks(details) {
  const hasDepart = details.some((l) => /échauffement|souple|dos|tranquillement|brasse/i.test(l));
  const hasTech = details.some((l) => /technique|flèche|grand chien|plusieurs nages|ondulation/i.test(l));
  const hasCorps = details.some(
    (l) => /×/.test(l) && /facile|sensation|respiration|visée|tête|alterne|rythme/i.test(l),
  );
  const hasFin = details.some((l) => /récup|rac|au choix|souple|relâché/i.test(l));
  return hasDepart && hasTech && hasCorps && hasFin;
}

function assertSportDecouverte(session, brief) {
  const maxCont = session.maxContinuousAllowed ?? maxContinuousForDecouverte(brief);
  const corpsSets = (session.sets || []).filter((s) => s.block === "corps");
  for (const s of corpsSets) {
    const continuous = s.continuous === true || s.reps === 1;
    if (continuous) {
      assert(s.distancePerRep <= maxCont, `corps continu ${s.distancePerRep} > max ${maxCont}`);
      assert(!s.restSec, "pas de repos sur continu");
    } else {
      assert(s.distancePerRep <= 50 || maxCont >= 100, `rep corps trop longue ${s.distancePerRep}`);
      assert(s.restSec > 0, "série répétée doit avoir repos");
    }
  }
  assert(!/sans pause[^\n]*repos/i.test(session.details.join("\n")), "repos incohérent");
  assert(!/Aujourd'hui :/i.test(session.details.join("\n")), "pas de headline narratif");
  assert(session.details.length >= 3 || /Découverte ·/i.test(session.title), "contenu");
  const techSets = (session.sets || []).filter((s) => s.block === "technique");
  assert(techSets.length >= 2, "variété technique minimale");
  assert(!/Technique ·/i.test(session.details.join("\n")), "pas de header Technique ·");
  const hard = validateDecouverteHard(session, {
    maxContinuous: maxCont,
    papillonOk: !!brief.papillonMastered,
    allowLongReps: maxCont >= 100,
  });
  assert(hard.ok, `hard sport: ${hard.errors.join("; ")}`);
}

// --- Inventaire ---
assert(countTechniqueDrills() === 97, `attendu 97 drills TECHNIQUE, got ${countTechniqueDrills()}`);
const inv = getExerciseInventory();
assert(inv.filter((e) => e.type === "technique").length === 97, "inventaire technique");

// --- Flag Étape B ---
assert(SESSION_COMPOSER_ENABLED_LEVELS.includes("decouverte"), "Découverte enabled");
assert(SESSION_COMPOSER_ENABLED_LEVELS.includes("regulier"), "Régulier enabled (étape C)");
assert(isComposerEnabledForLevel("sportif"), "Sportif actif étape D");

// --- Stroke focus ---
assert(normalizeStrokeFocus({ strokeFocus: "crawl_mainly" }) === "crawl", "ux crawl");
assert(normalizeStrokeFocus({ strokeFocus: "plusieurs" }) === "mixte", "ux mixte");
assert(normalizeStrokeFocus({ strokeFocus: "4n" }) === "4n", "ux 4n");
assert(normalizeStrokeFocus({}, "eau_libre") === "crawl", "défaut OW=crawl");
assert(!canUsePapillon({ level: "decouverte" }), "papillon off Découverte");
assert(canUsePapillon({ level: "decouverte", papillonMastered: true }), "papillon on si maîtrisé");

// === Cas 1 ===
{
  const brief = briefFrom({
    level: "découverte",
    objectif: "nager_progresser",
    duration: 30,
    equipment: [],
    volumeTarget: 1000,
    family: "endurance",
    seed: "case1-decouverte-np-30",
    strokeFocus: "crawl",
  });
  const r = composeSession(brief);
  assert(r.ok, `cas1 fail: ${r.reason}`);
  const s = r.session;
  assert(hasFourBlocks(s.details), "cas1: 4 blocs");
  const cons = assertVolumeConsistency({ sets: s.sets, details: s.details, announcedDistance: s.distance });
  assert(cons.ok, `cas1 volume: ${cons.errors.join("; ")}`);
  // Soft volume : 30 min ne force pas 1000 m
  assert(s.volumeFromSets <= 750, `cas1 volume ≤750 pour 30min (got ${s.volumeFromSets})`);
  assertSportDecouverte(s, brief);
  assert(/crawl/i.test(s.details.join(" ")), "cas1 stroke crawl");
  const r2 = composeSession(brief);
  assert(JSON.stringify(r2.session.details) === JSON.stringify(s.details), "cas1 déterministe");
}

// === Cas 2 ===
{
  const brief = briefFrom({
    level: "découverte",
    objectif: "eau_libre",
    duration: 45,
    equipment: ["palmes", "tuba"],
    volumeTarget: 1400,
    family: "eau_libre",
    seed: "case2-decouverte-ow-45",
    strokeFocus: "crawl",
  });
  brief.objectif = "eau_libre";
  brief.family = "eau_libre";
  const r = composeSession(brief);
  assert(r.ok, `cas2 fail: ${r.reason}`);
  assert(/palmes|tuba/i.test(r.session.details.join(" ")), "cas2 matos");
  assertSportDecouverte(r.session, brief);
}

// === Cas 3 : Régulier — désormais actif (détails dans session-composer-regulier.test.js) ===
{
  const brief = briefFrom({
    level: "régulier",
    objectif: "eau_libre",
    duration: 45,
    equipment: [],
    volumeTarget: 1600,
    family: "eau_libre",
    seed: "case3-regulier",
  });
  const r = composeSession(brief);
  assert(r.ok, `cas3 Régulier doit composer: ${r.reason}`);
}

// === Cas 4 : Sportif — composeur actif Étape D ===
{
  const brief = briefFrom({
    level: "sportif",
    objectif: "course_piscine",
    duration: 50,
    equipment: [],
    volumeTarget: 2000,
    family: "seuil",
    seed: "case4-sportif",
  });
  // briefFrom may force decouverte — override level
  brief.level = "sportif";
  brief.sessionIntent = "seuil";
  brief.qualitySession = true;
  const r = composeSession(brief);
  assert(r.ok, `cas4 Sportif: ${r.reason}`);
  assert(r.session.composerWhy.level === "sportif", "cas4 level");
}

assert(isComposerEnabledForLevel("performance"), "cas5: Perf actif étape F");

// === Cas 6–7 reject ===
{
  const pullEx = getExerciseInventory().find((e) => /pull/i.test(e.instructions.join(" ")));
  const brief = briefFrom({ level: "découverte", objectif: "nager_progresser", duration: 30, equipment: [], volumeTarget: 1000, seed: "c6" });
  assert(rejectExerciseForBrief({ ...pullEx, requiredEquipment: ["pull"] }, { ...brief, equipment: [] }).rejected, "cas6");
  const complex = getExerciseInventory().find((e) => e.focusKey === "technique_virages");
  assert(rejectExerciseForBrief(complex, brief).rejected, "cas7");
}

// === Soft volume : pas de mètres artificiels ===
{
  const brief = briefFrom({
    level: "découverte",
    objectif: "nager_progresser",
    duration: 30,
    equipment: [],
    volumeTarget: 1200,
    seed: "soft-vol",
    strokeFocus: "crawl",
    sessionIntent: "seance_courte",
  });
  const coherent = coherentVolumeForDecouverte(brief);
  assert(coherent <= 700, `coherent ≤700 got ${coherent}`);
  assert(coherent <= brief.volumeTarget, "jamais gonflé vs moteur");
  const r = composeSession(brief);
  assert(r.ok, r.reason);
  assert(r.session.volumeFromSets <= 750, "séance courte ≤750");
}

// === Gold scenarios (moteur génère, pas hardcodé) ===
for (const g of GOLD_SCENARIOS) {
  const brief = briefFrom({
    level: "découverte",
    objectif: g.objectif || "nager_progresser",
    duration: g.duration,
    equipment: g.equipment,
    volumeTarget: g.volumeBand[1],
    seed: `gold-${g.id}`,
    strokeFocus: g.strokeFocus,
    papillonMastered: g.papillonMastered === true,
    sessionIntent: g.intent,
    family: g.objectif === "eau_libre" ? "eau_libre" : "endurance",
  });
  const r = composeSession(brief);
  assert(r.ok, `${g.id} fail: ${r.reason}`);
  assertSportDecouverte(r.session, brief);
  const vol = r.session.volumeFromSets;
  assert(vol >= g.volumeBand[0] - 50 && vol <= g.volumeBand[1] + 50, `${g.id} volume ${vol} hors ${g.volumeBand}`);
  assert(r.session.composerWhy.intent === g.intent, `${g.id} intent`);
  if (g.strokeFocus === "4n" && g.papillonMastered === false) {
    assert(!/\bpapillon\b/i.test(r.session.details.join(" ")) || /ondulation|prépa/i.test(r.session.details.join(" ")), `${g.id} pas papillon imposé`);
  }
}

// === 4N + papillon maîtrisé vs non ===
{
  const noPap = briefFrom({
    level: "découverte",
    objectif: "nager_progresser",
    duration: 45,
    equipment: [],
    volumeTarget: 800,
    seed: "4n-nopap",
    strokeFocus: "4n",
    papillonMastered: false,
    sessionIntent: "decouverte_4n",
  });
  const r1 = composeSession(noPap);
  assert(r1.ok, r1.reason);
  assert(/ondulation|dos|brasse|crawl/i.test(r1.session.details.join(" ")), "4n alternatif");
  assert(!/\b\d+\s*×\s*\d+m papillon\b/i.test(r1.session.details.join("\n")), "pas de série papillon");

  const yesPap = briefFrom({
    level: "découverte",
    objectif: "nager_progresser",
    duration: 45,
    equipment: [],
    volumeTarget: 800,
    seed: "4n-pap",
    strokeFocus: "4n",
    papillonMastered: true,
    sessionIntent: "decouverte_4n",
  });
  const r2 = composeSession(yesPap);
  assert(r2.ok, r2.reason);
  assert(/papillon/i.test(r2.session.details.join(" ")), "4n avec papillon si maîtrisé");
}

// Volume sets
assert(volumeFromSets([{ reps: 4, distancePerRep: 100 }]) === 400, "4×100");
assert(calcDetailsDistance(["-4 × 100m crawl"]) === 400, "parse");

console.log("session-composer.test.js: OK");
