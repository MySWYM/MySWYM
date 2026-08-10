/**
 * Tests Sportif — Étape D session composer.
 * Usage : node src/lib/sports-engine/session-composer-sportif.test.js
 */
import {
  buildSportProfile,
  buildSessionBrief,
  composeSession,
  assertVolumeConsistency,
  validateSportifHard,
  isComposerEnabledForLevel,
  SESSION_COMPOSER_ENABLED_LEVELS,
  sportifWeekRoles,
  SPORTIF_GOLD_SCENARIOS,
  coherentVolumeForSportif,
  scaleDetailLine,
  scaleSessionLinesToVolume,
  effortCue,
  resolvePaceContext,
  canUsePapillon,
  maxContinuousForSportif,
  collapseSetsToDisplayLinesExact,
  buildCorpsByFormat,
  MAX_PYRAMID_VOLUME,
  candidateSetFormats,
  ARTHUR_GOLD_TEST_FIXTURES,
} from "./index.js";
import { calcDetailsDistance } from "../swim-session-generator.js";
import {
  loadArthurGoldTestFixtures,
  resetSessionTemplatesCache,
  sessionTemplatesReady,
  pickArthurBankSession,
  getArthurGoldTemplates,
} from "../session-templates-store.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function briefFrom(opts = {}) {
  const {
    duration = 60,
    equipment = [],
    volumeTarget = 2400,
    family = "endurance",
    seed = "sp",
    strokeFocus = "crawl",
    papillonMastered = false,
    sessionIntent,
    qualitySession = false,
    objectif = "nager_progresser",
    pool = 50,
    pace100 = null,
    isPremium = false,
    sessionSpecificity = null,
    phase = "base",
  } = opts;

  const sport = buildSportProfile({
    level: "sportif",
    goal:
      objectif === "eau_libre"
        ? "open_water_5k"
        : objectif === "triathlon"
          ? "triathlon_olympique"
          : objectif === "course_piscine"
            ? "course_piscine"
            : objectif === "reprendre"
              ? "reprendre"
              : "progression",
    category:
      objectif === "eau_libre"
        ? "open_water"
        : objectif === "triathlon"
          ? "triathlon"
          : objectif === "course_piscine"
            ? "competition"
            : "progression",
    equipment,
    pool,
    sessionsPerWeek: 3,
    strokeFocus,
    papillonMastered,
    pace100: pace100 || undefined,
  });
  sport.objectifV1 = objectif;
  sport.strokeFocus = strokeFocus;
  sport.papillonMastered = papillonMastered;
  sport.isPremium = isPremium;
  if (pace100) sport.pace100 = pace100;

  const weekCtx = {
    sport,
    volumePlan: {
      weekTarget: volumeTarget * 3,
      sessionTargets: [volumeTarget, volumeTarget, volumeTarget],
      lever: "volume",
      typeSemaine: "normale",
    },
    maxZone: "Z4",
    phaseKey: phase,
    why: "test-sp",
  };

  const brief = buildSessionBrief({
    sport,
    weekCtx: { ...weekCtx, _phaseName: phase },
    role: {
      objectif: "endurance",
      zone: qualitySession ? "Z3" : "Z2",
      family,
      intent: sessionIntent || family,
      sessionIntent,
      qualitySession,
      isKeySession: qualitySession,
      sessionSpecificity,
    },
    weekIndex: 0,
    sessionIndex: qualitySession ? 1 : 0,
    durationTarget: duration,
    seed,
  });
  brief.level = "sportif";
  if (sessionIntent) brief.sessionIntent = sessionIntent;
  brief.strokeFocus = strokeFocus;
  brief.papillonMastered = papillonMastered;
  brief.qualitySession = qualitySession;
  if (sessionSpecificity) brief.sessionSpecificity = sessionSpecificity;
  brief.isPremium = isPremium;
  brief.allowPaces = !!(isPremium && pace100);
  if (pace100) brief.pace100Sec = pace100;
  return brief;
}

function assertSportif(session, brief) {
  assert(session.sets?.length >= 3, "sets");
  const cons = assertVolumeConsistency({
    sets: session.sets,
    details: session.details,
    announcedDistance: session.distance,
  });
  assert(cons.ok, `volume: ${cons.errors.join("; ")}`);
  assert(!/Aujourd'hui :/i.test(session.details.join("\n")), "pas de headline narratif");
  assert(session.details.length >= 3, "contenu nageable");
  const hard = validateSportifHard(session, {
    papillonOk: !!brief.papillonMastered,
    allowPaces: !!brief.allowPaces,
    intentId: brief.sessionIntent,
  });
  assert(hard.ok, `hard: ${hard.errors.join("; ")}`);
}

assert(SESSION_COMPOSER_ENABLED_LEVELS.includes("sportif"), "flag sportif");
assert(isComposerEnabledForLevel("sportif"), "enabled");
assert(isComposerEnabledForLevel("performance"), "perf on étape F");

// 1 — Sportif + nager_progresser + 3 séances
{
  const roles = sportifWeekRoles(3, { objectifV1: "nager_progresser", strokeFocus: "crawl", weekIndex: 0 });
  assert(roles.filter((r) => r.qualitySession).length === 1, "une qualité");
  const sessions = roles.map((role, si) => {
    const brief = briefFrom({
      seed: `s1-${si}`,
      sessionIntent: role.sessionIntent,
      qualitySession: role.qualitySession,
      family: role.family,
      volumeTarget: 2200 + si * 50,
    });
    const r = composeSession(brief);
    assert(r.ok, `s1 si${si}: ${r.reason}`);
    assertSportif(r.session, brief);
    return r.session;
  });
  assert(sessions.filter((s) => s.qualitySession).length === 1, "1 qualité composée");
  const zones = sessions.map((s) => s.composerWhy.zone);
  assert(zones.some((z) => z === "Z2" || z === "Z1"), "aérobie présente");
}

// 2 — eau_libre
{
  const r = composeSession(
    briefFrom({
      objectif: "eau_libre",
      sessionIntent: "eau_libre",
      family: "eau_libre",
      seed: "s2",
    }),
  );
  assert(r.ok, `s2: ${r.reason}`);
  assert(/orientation|sighting|visée|endurance/i.test(r.session.details.join(" ") + r.session.title), "OW");
}

// 3 — triathlon
{
  const r = composeSession(
    briefFrom({ objectif: "triathlon", sessionIntent: "triathlon", seed: "s3", duration: 60 }),
  );
  assert(r.ok, `s3: ${r.reason}`);
  assert(/économie|triathlon|aérobie|crawl/i.test(r.session.details.join(" ") + r.session.title), "tri");
}

// 4 — course_piscine
{
  const r = composeSession(
    briefFrom({
      objectif: "course_piscine",
      sessionIntent: "course_piscine",
      sessionSpecificity: "race_specific",
      seed: "s4",
    }),
  );
  assert(r.ok, `s4: ${r.reason}`);
  assert(/course|allure|spécif/i.test(r.session.title + r.session.details.join(" ")), "course");
}

// 5 — 4N + papillon non maîtrisé
{
  const r = composeSession(
    briefFrom({
      strokeFocus: "4n",
      sessionIntent: "quatre_nages",
      papillonMastered: false,
      sessionSpecificity: "race_specific",
      seed: "s5",
    }),
  );
  assert(r.ok, `s5: ${r.reason}`);
  assert(!canUsePapillon({ level: "sportif", strokeFocus: "4n", papillonMastered: false }), "no pap");
  assert(!/\b\d+\s*×\s*\d+m papillon\b/i.test(r.session.details.join("\n")), "pas papillon imposé");
  assert(/dos|brasse|ondulation/i.test(r.session.details.join(" ")), "multi nages");
}

// 6 — CSS/T100 disponible (Premium)
{
  const brief = briefFrom({
    sessionIntent: "seuil",
    qualitySession: true,
    pace100: 90,
    isPremium: true,
    seed: "s6",
  });
  assert(resolvePaceContext(brief).allowPaces, "paces on");
  const r = composeSession(brief);
  assert(r.ok, `s6: ${r.reason}`);
  assert(r.session.composerWhy.allowPaces, "why paces");
  assert(/@\d+:\d+/.test(r.session.details.join("\n")), "allure affichée");
}

// 7 — sans chrono
{
  const brief = briefFrom({ sessionIntent: "aerobie", seed: "s7", isPremium: false });
  assert(!resolvePaceContext(brief).allowPaces, "no paces");
  const r = composeSession(brief);
  assert(r.ok, `s7: ${r.reason}`);
  assert(!/@\d+:\d+/.test(r.session.details.join("\n")), "pas d'allure inventée");
  assert(/aérobie|facile|Z2/i.test(r.session.details.join(" ")), "label humain");
}

// 8 — test
{
  const brief = briefFrom({ sessionIntent: "test", qualitySession: true, seed: "s8", volumeTarget: 1800 });
  const r = composeSession(brief);
  assert(r.ok, `s8: ${r.reason}`);
  assert(r.session.isTest || r.session.type === "TEST", "test flag");
  assert(/test|chrono/i.test(r.session.details.join(" ")), "consigne test");
}

// 9 — scaling Arthur lignes
{
  const scaled = scaleDetailLine("8x200m crawl R30", 0.75, "reps");
  assert(/6×200m/i.test(scaled), `scale reps: ${scaled}`);
  const scaledD = scaleDetailLine("8x200m", 0.75, "distance");
  assert(/8×150m/i.test(scaledD), `scale dist: ${scaledD}`);
  const sess = scaleSessionLinesToVolume(
    { details: ["-8x200m crawl — Z2", "-200m récup"], distance: "1800m" },
    1800,
    1350,
  );
  assert(sess.volumeScaled, "scaled");
  assert(/[56]×200m/i.test(sess.details.join(" ")), `reps réduites: ${sess.details.join(" | ")}`);
}

// 10 — matériel
{
  let saw = false;
  for (let i = 0; i < 15; i++) {
    const r = composeSession(
      briefFrom({
        equipment: ["palmes", "tuba", "pull"],
        sessionIntent: "technique_endurance",
        seed: `s10-${i}`,
      }),
    );
    assert(r.ok, `s10 ${i}: ${r.reason}`);
    if ((r.session.composerWhy.equipmentApplied || []).length) {
      saw = true;
      assert(/palmes|tuba|pull/i.test(r.session.details.join(" ")), "matos visible");
    }
  }
  assert(saw, "matos parfois utilisé");
}

// Polarisation : séance aérobie majoritaire Z1/Z2
{
  const r = composeSession(briefFrom({ sessionIntent: "aerobie", seed: "pol", volumeTarget: 2500 }));
  assert(r.ok, r.reason);
  const zv = r.session.composerWhy.zoneVolumes || {};
  const aero = (zv.Z1 || 0) + (zv.Z2 || 0);
  const total = Object.values(zv).reduce((a, b) => a + b, 0);
  assert(aero / total >= 0.7, `polarisation aérobie ${aero}/${total}`);
}

// Z4 limitée sur vitesse
{
  const r = composeSession(
    briefFrom({ sessionIntent: "vitesse", qualitySession: true, seed: "z4", volumeTarget: 2000 }),
  );
  assert(r.ok, `z4: ${r.reason}`);
  const zv = r.session.composerWhy.zoneVolumes || {};
  assert((zv.Z4 || 0) <= 900, `Z4 plafonnée ${zv.Z4}`);
  assert((zv.Z2 || 0) + (zv.Z1 || 0) > 0, "complément aérobie");
}

// Gold refs
for (const g of SPORTIF_GOLD_SCENARIOS) {
  const brief = briefFrom({
    objectif: g.objectif || "nager_progresser",
    duration: g.duration,
    volumeTarget: g.volumeBand[1],
    seed: `sgold-${g.id}`,
    strokeFocus: g.strokeFocus,
    papillonMastered: g.papillonMastered === true,
    sessionIntent: g.intent,
    qualitySession: !!g.qualitySession,
  });
  const r = composeSession(brief);
  assert(r.ok, `${g.id}: ${r.reason}`);
  assertSportif(r.session, brief);
}

// Déterminisme
{
  const brief = briefFrom({ sessionIntent: "seuil", qualitySession: true, seed: "det-sp" });
  const a = composeSession(brief);
  const b = composeSession(brief);
  assert(JSON.stringify(a.session.details) === JSON.stringify(b.session.details), "déterministe");
}

// Cross-level volume : Sportif > Régulier cible typique
{
  const sp = coherentVolumeForSportif(
    briefFrom({ duration: 60, volumeTarget: 2800, sessionIntent: "aerobie" }),
  );
  assert(sp >= 1800, `vol sportif ${sp}`);
}

// === Corrections pré-Performance ===

// 11 — course piscine 3 séances : C pas auto-Z3
{
  const roles = sportifWeekRoles(3, {
    objectifV1: "course_piscine",
    strokeFocus: "crawl",
    weekIndex: 0,
    phase: "base",
  });
  assert(roles.filter((r) => r.qualitySession).length === 1, "cp: 1 qualité");
  assert(roles[1].sessionIntent === "seuil" || roles[1].qualitySession, "cp: B qualité");
  assert(roles[2].sessionIntent !== "seuil" && roles[2].sessionIntent !== "allure_specifique", "cp: C pas seuil");
  assert(roles[2].zone === "Z2" || roles[2].racePaceTouches, "cp: C aérobie");

  const sessions = roles.map((role, si) => {
    const brief = briefFrom({
      objectif: "course_piscine",
      seed: `cp-${si}`,
      sessionIntent: role.sessionIntent,
      qualitySession: role.qualitySession,
      family: role.family,
      sessionSpecificity: role.sessionSpecificity,
      volumeTarget: 2200,
      phase: "base",
    });
    brief.racePaceTouches = !!role.racePaceTouches;
    const r = composeSession(brief);
    assert(r.ok, `cp si${si}: ${r.reason}`);
    assertSportif(r.session, brief);
    return r.session;
  });

  const z3Share = (s) => {
    const zv = s.composerWhy.zoneVolumes || {};
    const tot = Object.values(zv).reduce((a, b) => a + b, 0) || 1;
    return (zv.Z3 || 0) / tot;
  };
  assert(z3Share(sessions[2]) < 0.3, `C Z3 trop élevé: ${(z3Share(sessions[2]) * 100).toFixed(0)}%`);
  const weekZ3 =
    sessions.reduce((a, s) => a + (s.composerWhy.zoneVolumes?.Z3 || 0), 0) /
    sessions.reduce(
      (a, s) => a + Object.values(s.composerWhy.zoneVolumes || {}).reduce((x, y) => x + y, 0),
      0,
    );
  assert(weekZ3 < 0.35, `semaine Z3 trop dense: ${(weekZ3 * 100).toFixed(0)}%`);
}

// 12 — vitesse : blockRoles explicites
{
  const r = composeSession(
    briefFrom({ sessionIntent: "vitesse", qualitySession: true, seed: "vr", volumeTarget: 2000 }),
  );
  assert(r.ok, `vr: ${r.reason}`);
  const roles = (r.session.sets || []).map((s) => s.blockRole).filter(Boolean);
  assert(roles.includes("preparation"), "prep role");
  assert(roles.includes("quality"), "quality role");
  assert(roles.includes("consolidation"), "consol role");
  assert(/Préparation aérobie|Bloc vitesse|Consolidation/i.test(r.session.details.join("\n")), "headers");
}

// 13 — 4N faible capacité : pas de long continu
{
  const brief = briefFrom({
    strokeFocus: "4n",
    sessionIntent: "quatre_nages",
    sessionSpecificity: "stroke_focus",
    seed: "4n-weak",
    volumeTarget: 2000,
  });
  brief.maxContinuousDistance = 100;
  brief.capacity = { score: 0.3, confidence: 0.2, maxContinuousDistance: 100 };
  const max4 = maxContinuousForSportif(brief, { stroke: "4n" });
  assert(max4 <= 100, `4n weak max ${max4}`);
  const r = composeSession(brief);
  assert(r.ok, `4n-w: ${r.reason}`);
  const cont4n = (r.session.sets || []).filter(
    (s) =>
      s.block === "corps" &&
      s.continuous &&
      /^(dos|brasse|papillon|ondulation)/i.test(String(s.label || "").trim()),
  );
  assert(
    cont4n.every((s) => s.distancePerRep <= max4),
    "continu 4n ≤ capacité",
  );
  const longCont = (r.session.sets || []).filter(
    (s) =>
      s.block === "corps" &&
      s.continuous &&
      s.distancePerRep > 200 &&
      /^(dos|brasse)/i.test(String(s.label || "").trim()),
  );
  assert(longCont.length === 0, "pas de 500m 4N continu si faible");
  // Unités 4N courtes en portion corps
  const fourSets = (r.session.sets || []).filter((s) => String(s.exerciseId || "").startsWith("corps_4n"));
  if (fourSets.length) {
    assert(
      fourSets.every((s) => s.distancePerRep <= Math.max(50, max4)),
      "unités 4N courtes",
    );
  }}

// 14 — 4N capacité élevée
{
  const brief = briefFrom({
    strokeFocus: "4n",
    sessionIntent: "quatre_nages",
    sessionSpecificity: "race_specific",
    seed: "4n-strong",
    volumeTarget: 2400,
  });
  brief.maxContinuousDistance = 800;
  brief.capacity = { score: 0.75, confidence: 0.7, maxContinuousDistance: 800 };
  const max4 = maxContinuousForSportif(brief, { stroke: "4n" });
  assert(max4 >= 200, `4n strong max ${max4}`);
  const maxCrawl = maxContinuousForSportif(brief, { stroke: "crawl" });
  assert(maxCrawl > max4, `crawl ${maxCrawl} > 4n ${max4}`);
  const r = composeSession(brief);
  assert(r.ok, `4n-s: ${r.reason}`);
  assertSportif(r.session, brief);
}

// 15 — continu crawl vs 4N
{
  const base = {
    maxContinuousDistance: 500,
    capacity: { score: 0.5, confidence: 0.5, maxContinuousDistance: 500 },
  };
  const crawlMax = maxContinuousForSportif({ ...base, strokeFocus: "crawl" }, { stroke: "crawl" });
  const fourMax = maxContinuousForSportif({ ...base, strokeFocus: "4n" }, { stroke: "4n" });
  assert(crawlMax > fourMax, `crawl ${crawlMax} vs 4n ${fourMax}`);
  assert(fourMax <= 200, `4n plafonné ${fourMax}`);
}

// 16 — progressive / descending → affichage coach classique (pas de jargon progressif)
{
  const built = buildCorpsByFormat("progressive", 600, {
    label: "crawl",
    cue: "progressif",
    restFor: () => 20,
    exerciseId: "prog",
    maxContinuous: 200,
    pool: 50,
    preferredUnit: 100,
  });
  assert(built.sets.length >= 3, "sets internes progressifs");
  const disp = built.displayLines || collapseSetsToDisplayLinesExact(built.sets, "progressive");
  assert(disp && disp.length >= 1, "lignes UX");
  assert(!/progressif|facile vers le soutenu/i.test(disp.join("\n")), `pas de jargon: ${disp[0]}`);
  assert(!/Z1.*Z2.*Z3/i.test(disp.join(" ")), "pas de détail zone par zone");
  const volSets = built.sets.reduce((a, s) => a + s.reps * s.distancePerRep, 0);
  const fromDisp = calcDetailsDistance(disp);
  assert(fromDisp === volSets, `volume UX ${fromDisp} = sets ${volSets}`);

  const desc = buildCorpsByFormat("descending", 600, {
    label: "crawl",
    cue: "descendant",
    restFor: () => 20,
    exerciseId: "desc",
    maxContinuous: 200,
    pool: 50,
  });
  const dDisp = desc.displayLines || [];
  assert(dDisp.length >= 1, "descending affiché");
  assert(!/descendant|long vers le court/i.test(dDisp.join("\n")), "pas de jargon descendant");
}

// 17 — Arthur Gold réellement chargé + scaling réel
{
  resetSessionTemplatesCache();
  assert(!sessionTemplatesReady(), "cache vide avant");
  loadArthurGoldTestFixtures();
  assert(sessionTemplatesReady(), "fixtures ready");
  assert(getArthurGoldTemplates("eau_libre").length >= 1, "OW gold");
  assert(ARTHUR_GOLD_TEST_FIXTURES.length >= 3, "fixtures count");

  const picked = pickArthurBankSession("eau_libre", 0, {
    family: "endurance",
    phase: "base",
    scaleVolume: false,
  });
  assert(picked, "sélection compatible");
  assert(picked.templateSlug, "slug");
  assert(/orientation|sighting|aérobie|crawl/i.test(picked.details.join(" ")), "contenu OW");

  const baseDist = 2400;
  const original = pickArthurBankSession("eau_libre", 0, {
    volumeTarget: baseDist,
    scaleVolume: true,
  });
  assert(original, "original");

  const down = pickArthurBankSession("eau_libre", 0, {
    volumeTarget: Math.round(baseDist * 0.75),
    scaleVolume: true,
  });
  assert(down.volumeScaled || down.scaleRatio < 1, "scaled -25%");
  assert(down.details.join(" ") !== original.details.join(" ") || down.scaleRatio < 1, "lignes changées -25%");
  assert(!/^2400m$/.test(String(down.distance)), "pas seulement distance header");

  const up = pickArthurBankSession("eau_libre", 0, {
    volumeTarget: Math.round(baseDist * 1.25),
    scaleVolume: true,
  });
  assert(up.volumeScaled || up.scaleRatio > 1, "scaled +25%");

  // Levier distance explicite
  const distScaled = scaleSessionLinesToVolume(
    {
      details: ["-8 × 200m crawl — Z2 — repos 25s", "-200m récup"],
      distance: "1800m",
      type: "ENDURANCE",
    },
    1800,
    1350,
    { lever: "distance" },
  );
  assert(distScaled.scaleLever === "distance", "lever distance");
  assert(/8×\d+m/i.test(distScaled.details.join(" ")), "reps conservées");
  assert(/8×150m/i.test(distScaled.details.join(" ")), `dist baissée: ${distScaled.details.join(" | ")}`);

  // Levier reps
  const repsScaled = scaleSessionLinesToVolume(
    {
      details: ["-8 × 200m crawl — Z2 — repos 25s", "-200m récup"],
      distance: "1800m",
      type: "ENDURANCE",
    },
    1800,
    1350,
    { lever: "reps" },
  );
  assert(repsScaled.scaleLever === "reps", "lever reps");
  assert(/[56]×200m/i.test(repsScaled.details.join(" ")), `reps: ${repsScaled.details.join(" | ")}`);

  // Intention physiologique conservée (Z2 / aérobie restent)
  assert(/Z2|aérobie|orientation/i.test(down.details.join(" ")), "intention OW");

  resetSessionTemplatesCache();
}

// 18 — Pyramide plafonnée + paliers visibles (pas 1750 m opaque Ironman)
{
  assert(MAX_PYRAMID_VOLUME <= 1000, `cap ${MAX_PYRAMID_VOLUME}`);

  const built = buildCorpsByFormat("pyramid", 1750, {
    label: "crawl",
    cue: "allure confortable",
    restFor: () => 20,
    exerciseId: "pyr_iron",
    maxContinuous: 400,
    pool: 50,
  });
  const pyrVol = built.sets
    .filter((s) => (s.meta?.pyramidStep ?? s.pyramidStep) != null)
    .reduce((a, s) => a + s.reps * s.distancePerRep, 0);
  assert(pyrVol <= MAX_PYRAMID_VOLUME, `pyramide ${pyrVol}m ≤ ${MAX_PYRAMID_VOLUME}`);
  assert(pyrVol < 1600, "pas de scale×2 vers 1600");
  const peak = Math.max(
    ...built.sets.filter((s) => (s.meta?.pyramidStep ?? s.pyramidStep) != null).map((s) => s.distancePerRep),
  );
  assert(peak <= 300, `sommet ${peak}m ≤ 300`);

  const disp = (built.displayLines || []).join("\n");
  assert(/crawl|repos/i.test(disp), `display pyramide: ${disp}`);
  assert(!/1750m\s+pyramide/i.test(disp), "pas de titre 1750m pyramide");
  // Paliers individuels nageables (plus de collapse opaque)
  assert((disp.match(/^\-\d+m /gm) || []).length >= 3, "paliers individuels");
  const fromDetails = calcDetailsDistance(built.displayLines || []);
  const fromSets = built.sets.reduce((a, s) => a + s.reps * s.distancePerRep, 0);
  assert(
    Math.abs(fromDetails - fromSets) <= 50,
    `volume display=${fromDetails} sets=${fromSets}`,
  );

  // Gros corps triathlon/perf → pyramide hors candidats
  const bigTri = candidateSetFormats({
    intentId: "triathlon",
    level: "performance",
    corpsTarget: 1750,
    maxContinuous: 400,
  });
  assert(!bigTri.includes("pyramid"), `pas de pyramide gros tri: ${bigTri}`);
  const smallTri = candidateSetFormats({
    intentId: "triathlon",
    level: "performance",
    corpsTarget: 800,
    maxContinuous: 400,
  });
  assert(smallTri.includes("pyramid"), `pyramide OK si court: ${smallTri}`);
}

// effortCue sans pace
{
  const c = effortCue({ zone: "Z3", distancePerRep: 200, brief: {} });
  assert(/seuil|soutenu/i.test(c), c);
}

console.log("session-composer-sportif.test.js: OK");
