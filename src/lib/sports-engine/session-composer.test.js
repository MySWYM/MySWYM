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

function hasSessionParts(details) {
  const hasDepart = details.some((l) =>
    /échauffement|souple|dos|tranquillement|brasse|mise en route/i.test(l),
  );
  const hasCorps = details.some(
    (l) =>
      /×/.test(l) &&
      /facile|sensation|respiration|visée|tête|alterne|rythme|lent|moyen|vite|seuil|sprint|jambes|glisse|allure/i.test(
        l,
      ),
  );
  const hasFin = details.some((l) =>
    /récup|rac|au choix|relâché|dos à deux bras|retour au calme|sans forcer/i.test(l),
  );
  return hasDepart && hasCorps && hasFin;
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
  if (brief.educatifSession) {
    assert(techSets.length >= 2, "séance éducatif : variété de drills");
  } else {
    assert(techSets.length === 0, "hors éducatif : pas de bloc technique");
  }
  assert(!/Technique ·/i.test(session.details.join("\n")), "pas de header Technique ·");
  const hard = validateDecouverteHard(session, {
    maxContinuous: maxCont,
    papillonOk: canUsePapillon(brief),
    strokeFocus: brief.strokeFocus,
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
assert(normalizeStrokeFocus({ swimStyle: "4_nages", preferredStroke: "dos" }) === "4n", "4n prime sur préférence");
assert(normalizeStrokeFocus({ swimStyle: "crawl", preferredStroke: "dos" }) === "dos", "sans 4n, préférence dos");
assert(normalizeStrokeFocus({}, "eau_libre") === "crawl", "défaut OW=crawl");
assert(canUsePapillon({ level: "decouverte", strokeFocus: "4n" }), "4n ⇒ papillon");
assert(!canUsePapillon({ level: "decouverte" }), "papillon off Découverte hors 4n");
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
  assert(hasSessionParts(s.details), "cas1: échauffement + corps + RAC");
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
  if (g.strokeFocus === "4n") {
    assert(/\bpapillon\b/i.test(r.session.details.join(" ")), `${g.id} papillon 4 nages`);
  }
}

// === 4N : les quatre nages, papillon inclus (fractionné) ===
{
  const fourN = briefFrom({
    level: "découverte",
    objectif: "nager_progresser",
    duration: 45,
    equipment: [],
    volumeTarget: 800,
    seed: "4n-all",
    strokeFocus: "4n",
    papillonMastered: false,
    sessionIntent: "decouverte_4n",
  });
  const r1 = composeSession(fourN);
  assert(r1.ok, r1.reason);
  const txt = r1.session.details.join("\n");
  assert(/\bcrawl\b/i.test(txt) && /\bdos\b/i.test(txt) && /brasse/i.test(txt) && /\bpapillon\b/i.test(txt), "4n quatre nages");
  assert(!/ondulation \(prépa papillon\)/i.test(txt), "pas de substitut ondulation");
}

// === Volume découverte : cibles > 1000 m ne sont plus écrêtées à ~700 m ===
{
  for (const [seed, volumeTarget, duration, objectif] of [
    ["vol-hi-1200", 1200, 45, "nager_progresser"],
    ["vol-hi-1400", 1400, 45, "eau_libre"],
  ]) {
    const brief = briefFrom({
      level: "découverte",
      objectif,
      duration,
      equipment: objectif === "eau_libre" ? ["palmes", "tuba"] : [],
      volumeTarget,
      family: objectif === "eau_libre" ? "eau_libre" : "endurance",
      seed,
      strokeFocus: "crawl",
    });
    if (objectif === "eau_libre") brief.objectif = "eau_libre";
    const coherent = coherentVolumeForDecouverte(brief);
    assert(
      Math.abs(coherent - volumeTarget) <= 150,
      `${seed} coherent ${coherent} trop loin de ${volumeTarget}`,
    );
    assert(coherent <= volumeTarget, `${seed} jamais gonflé`);
    const r = composeSession(brief);
    assert(r.ok, `${seed} compose: ${r.reason}`);
    const vol = r.session.volumeFromSets;
    assert(
      Math.abs(vol - volumeTarget) <= 150,
      `${seed} produit ${vol} trop loin de ${volumeTarget} (coherent=${coherent})`,
    );
  }
}

// Volume sets
assert(volumeFromSets([{ reps: 4, distancePerRep: 100 }]) === 400, "4×100");
assert(calcDetailsDistance(["-4 × 100m crawl"]) === 400, "parse");

console.log("session-composer.test.js: OK");
