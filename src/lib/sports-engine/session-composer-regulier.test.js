/**
 * Tests Régulier, Étape C session composer.
 * Usage : node src/lib/sports-engine/session-composer-regulier.test.js
 */
import {
  buildSportProfile,
  buildSessionBrief,
  composeSession,
  volumeFromSets,
  assertVolumeConsistency,
  validateRegulierHard,
  isComposerEnabledForLevel,
  SESSION_COMPOSER_ENABLED_LEVELS,
  regulierWeekRoles,
  REGULIER_GOLD_SCENARIOS,
  rejectExerciseForBrief,
  getExerciseInventory,
  coherentVolumeForRegulier,
  restSecFor,
  selectSetFormat,
  candidateSetFormats,
  REPRISE_PATTERNS,
  fourNagesCorpsShare,
  humanizeUserFacingText,
  findInternalJargon,
  canUsePapillon,
} from "./index.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function briefFrom(opts = {}) {
  const {
    duration = 45,
    equipment = [],
    volumeTarget = 1800,
    family = "endurance",
    seed = "reg",
    strokeFocus = "crawl",
    papillonMastered = false,
    sessionIntent,
    qualitySession = false,
    objectif = "nager_progresser",
    pool = 50,
    sessionSpecificity = null,
    forcedSetFormat = null,
    reprisePattern = null,
  } = opts;

  const sport = buildSportProfile({
    level: "régulier",
    goal:
      objectif === "eau_libre"
        ? "open_water_5k"
        : objectif === "triathlon"
          ? "triathlon_olympique"
          : objectif === "reprendre"
            ? "reprendre"
            : "progression",
    category:
      objectif === "eau_libre" ? "open_water" : objectif === "triathlon" ? "triathlon" : "progression",
    equipment,
    pool,
    sessionsPerWeek: 3,
    strokeFocus,
    papillonMastered,
  });
  sport.objectifV1 = objectif;
  sport.strokeFocus = strokeFocus;
  sport.papillonMastered = papillonMastered;

  const weekCtx = {
    sport,
    volumePlan: {
      weekTarget: volumeTarget * 3,
      sessionTargets: [volumeTarget, volumeTarget, volumeTarget],
      lever: "volume",
      typeSemaine: "normale",
    },
    maxZone: "Z3",
    phaseKey: "foncier",
    why: "test-reg",
  };

  const brief = buildSessionBrief({
    sport,
    weekCtx: { ...weekCtx, _phaseName: "base" },
    role: {
      objectif: "endurance",
      zone: qualitySession ? "Z2" : "Z1",
      family,
      intent: sessionIntent || family,
      sessionIntent,
      qualitySession,
      isKeySession: qualitySession,
    },
    weekIndex: 0,
    sessionIndex: qualitySession ? 1 : 0,
    durationTarget: duration,
    seed,
  });
  if (sessionIntent) brief.sessionIntent = sessionIntent;
  brief.strokeFocus = strokeFocus;
  brief.papillonMastered = papillonMastered;
  brief.qualitySession = qualitySession;
  if (sessionSpecificity) brief.sessionSpecificity = sessionSpecificity;
  if (forcedSetFormat) brief.forcedSetFormat = forcedSetFormat;
  if (reprisePattern) brief.reprisePattern = reprisePattern;
  return brief;
}

function assertRegulierSport(session, brief) {
  assert(session.sets?.length >= 3, "sets présents");
  const cons = assertVolumeConsistency({
    sets: session.sets,
    details: session.details,
    announcedDistance: session.distance,
  });
  assert(cons.ok, `volume: ${cons.errors.join("; ")} (sets=${cons.fromSets} details=${cons.fromDetails})`);
  assert(!/Aujourd'hui :/i.test(session.details.join("\n")), "pas de headline narratif");
  assert(session.details.some((l) => /rattrap|godille|jambes|flèche|technique|crawl|dos/i.test(l)), "bloc technique");
  assert(session.details.some((l) => /×|x\s*\d/i.test(l)), "vraies séries");
  const hard = validateRegulierHard(session, {
    papillonOk: canUsePapillon(brief),
    strokeFocus: brief.strokeFocus,
    qualitySession: !!session.qualitySession,
  });
  assert(hard.ok, `hard: ${hard.errors.join("; ")}`);
  assert(!/Z4|VO2|hypoxie/i.test(session.details.join(" ")), "pas d'intensité club");
}

// Flag
assert(SESSION_COMPOSER_ENABLED_LEVELS.includes("regulier"), "Régulier enabled");
assert(SESSION_COMPOSER_ENABLED_LEVELS.includes("decouverte"), "Découverte still");
assert(isComposerEnabledForLevel("performance"), "Perf actif étape F");
assert(isComposerEnabledForLevel("sportif"), "Sportif enabled");

// === Cas 1 : Régulier + nager_progresser + 45 min ===
{
  const brief = briefFrom({
    objectif: "nager_progresser",
    duration: 45,
    volumeTarget: 1800,
    seed: "r1",
    sessionIntent: "endurance",
  });
  const r = composeSession(brief);
  assert(r.ok, `cas1: ${r.reason}`);
  assertRegulierSport(r.session, brief);
  assert(r.session.volumeFromSets >= 1400 && r.session.volumeFromSets <= 2000, `cas1 vol ${r.session.volumeFromSets}`);
  const r2 = composeSession(brief);
  assert(JSON.stringify(r2.session.details) === JSON.stringify(r.session.details), "cas1 déterministe");
}

// === Cas 2 : eau_libre + 45 ===
{
  const brief = briefFrom({
    objectif: "eau_libre",
    duration: 45,
    volumeTarget: 1800,
    seed: "r2",
    sessionIntent: "eau_libre",
    family: "eau_libre",
  });
  const r = composeSession(brief);
  assert(r.ok, `cas2: ${r.reason}`);
  assertRegulierSport(r.session, brief);
  assert(/visée|tête|orientation|endurance/i.test(r.session.details.join(" ") + r.session.title), "cas2 OW");
}

// === Cas 3 : triathlon + 60 ===
{
  const brief = briefFrom({
    objectif: "triathlon",
    duration: 60,
    volumeTarget: 2200,
    seed: "r3",
    sessionIntent: "triathlon",
  });
  const r = composeSession(brief);
  assert(r.ok, `cas3: ${r.reason}`);
  assertRegulierSport(r.session, brief);
  assert(/crawl/i.test(r.session.details.join(" ")), "cas3 crawl");
  assert(r.session.volumeFromSets <= 2500, "cas3 pas gonflé");
}

// === Cas 4 : 4N ===
{
  const brief = briefFrom({
    objectif: "nager_progresser",
    duration: 45,
    volumeTarget: 1700,
    seed: "r4",
    strokeFocus: "4n",
    papillonMastered: false,
    sessionIntent: "quatre_nages",
  });
  const r = composeSession(brief);
  assert(r.ok, `cas4: ${r.reason}`);
  assertRegulierSport(r.session, brief);
  assert(/dos|brasse|crawl|papillon/i.test(r.session.details.join(" ")), "cas4 nages");
  assert(/\bpapillon\b/i.test(r.session.details.join(" ")), "cas4 papillon 4 nages");
}

// === Cas 5 : reprise ===
{
  const brief = briefFrom({
    objectif: "reprendre",
    duration: 40,
    volumeTarget: 1600,
    seed: "r5",
    sessionIntent: "reprise",
    qualitySession: false,
  });
  const r = composeSession(brief);
  assert(r.ok, `cas5: ${r.reason}`);
  assertRegulierSport(r.session, brief);
  assert(r.session.volumeFromSets <= 1600, "cas5 volume réduit");
  assert(!r.session.qualitySession, "cas5 pas qualité");
}

// === Cas 6 : matériel incomplet ===
{
  const pullEx = getExerciseInventory().find((e) => e.requiredEquipment?.includes("pull") || /pull/i.test(e.instructions?.join(" ") || ""));
  const brief = briefFrom({ equipment: [], seed: "r6" });
  assert(
    rejectExerciseForBrief({ ...pullEx, requiredEquipment: ["pull"] }, { ...brief, equipment: [] }).rejected,
    "cas6 matos",
  );
  const r = composeSession(briefFrom({ equipment: [], seed: "r6b", sessionIntent: "endurance" }));
  assert(r.ok, `cas6 séance sans matos: ${r.reason}`);
}

// === Cas 7 : 30 min ===
{
  const brief = briefFrom({
    duration: 30,
    volumeTarget: 1800,
    seed: "r7",
    sessionIntent: "seance_courte",
  });
  const coherent = coherentVolumeForRegulier(brief);
  assert(coherent <= 1300, `cas7 coherent ${coherent}`);
  const r = composeSession(brief);
  assert(r.ok, `cas7: ${r.reason}`);
  assert(r.session.volumeFromSets <= 1400, `cas7 vol ${r.session.volumeFromSets}`);
  assertRegulierSport(r.session, brief);
}

// === Cas 8 : semaine 3 séances, une seule qualité ===
{
  const roles = regulierWeekRoles(3, { objectifV1: "nager_progresser", strokeFocus: "crawl" });
  assert(roles.filter((r) => r.qualitySession).length === 1, "une qualité / semaine");
  const sessions = roles.map((role, si) => {
    const brief = briefFrom({
      seed: `r8-s${si}`,
      sessionIntent: role.sessionIntent,
      qualitySession: role.qualitySession,
      family: role.family,
      volumeTarget: 1600 + si * 50,
    });
    const r = composeSession(brief);
    assert(r.ok, `cas8 s${si}: ${r.reason}`);
    return r.session;
  });
  assert(sessions.filter((s) => s.qualitySession).length === 1, "une qualité composée");
  assert(sessions.some((s) => /récup|facile|technique/i.test(s.composerWhy.intent + s.title)), "variété semaine");
}

// Gold refs (moteur génère)
for (const g of REGULIER_GOLD_SCENARIOS) {
  const brief = briefFrom({
    objectif: g.objectif || "nager_progresser",
    duration: g.duration,
    volumeTarget: g.volumeBand[1],
    seed: `rgold-${g.id}`,
    strokeFocus: g.strokeFocus,
    papillonMastered: g.papillonMastered === true,
    sessionIntent: g.intent,
    qualitySession: !!g.qualitySession,
  });
  const r = composeSession(brief);
  assert(r.ok, `${g.id}: ${r.reason}`);
  assertRegulierSport(r.session, brief);
  const vol = r.session.volumeFromSets;
  assert(vol >= g.volumeBand[0] - 100 && vol <= g.volumeBand[1] + 100, `${g.id} vol ${vol}`);
}

// === Refinement : plusieurs setFormat pour un même objectif ===
{
  const formats = new Set();
  for (let i = 0; i < 12; i++) {
    const brief = briefFrom({
      sessionIntent: "endurance",
      seed: `fmt-end-${i}`,
      volumeTarget: 1700,
    });
    const r = composeSession(brief);
    assert(r.ok, `fmt ${i}: ${r.reason}`);
    formats.add(r.session.composerWhy.setFormat);
  }
  assert(formats.size >= 3, `formats endurance trop monotones: ${[...formats]}`);
}

// === Refinement : récup différente selon intensité ===
{
  const easy = restSecFor({ intensity: "facile", distancePerRep: 100, qualitySession: true, intentId: "qualite" });
  const hard = restSecFor({ intensity: "soutenu", distancePerRep: 100, qualitySession: true, intentId: "qualite" });
  const recup = restSecFor({ intensity: "facile", distancePerRep: 50, intentId: "recuperation" });
  assert(hard > easy, `repos soutenu (${hard}) > facile (${easy})`);
  assert(easy !== 20 || hard !== 20 || recup !== 20, "pas tous à R20");
  assert(hard >= 30, `soutenu densifié ${hard}`);
}

// === Refinement : reprise non monotone + patterns ===
{
  assert(REPRISE_PATTERNS.length >= 4, "plusieurs patterns reprise");
  const patterns = new Set();
  const structures = new Set();
  for (let i = 0; i < 8; i++) {
    const brief = briefFrom({
      objectif: "reprendre",
      sessionIntent: "reprise",
      seed: `rep-${i}`,
      volumeTarget: 1500,
      duration: 40,
      weekIndex: i,
      sessionIndex: i % 3,
    });
    // inject week/session into brief
    brief.weekIndex = Math.floor(i / 2);
    brief.sessionIndex = i % 3;
    const r = composeSession(brief);
    assert(r.ok, `reprise ${i}: ${r.reason}`);
    assert(!r.session.qualitySession, "reprise pas qualité");
    patterns.add(r.session.composerWhy.reprisePattern);
    structures.add(r.session.composerWhy.setFormat);
    const corpsLines = r.session.details.filter((l) => /^-\d+\s*×/i.test(l) || /^-\d+m /i.test(l));
    const onlyFifty = corpsLines.every((l) => /×\s*50m/i.test(l)) && corpsLines.length <= 1;
    assert(!onlyFifty || structures.size > 1, "reprise ne doit pas être que Nx50 unique");
  }
  assert(patterns.size >= 3, `patterns reprise: ${[...patterns]}`);
  assert(structures.size >= 2, `formats reprise: ${[...structures]}`);
}

// === Refinement : engagement matériel (inventaire → visible, sauf récup) ===
{
  let engaged = 0;
  for (let i = 0; i < 12; i++) {
    const brief = briefFrom({
      equipment: ["palmes", "tuba", "pull"],
      sessionIntent: "technique_endurance",
      seed: `eq-${i}`,
      volumeTarget: 1700,
    });
    const r = composeSession(brief);
    assert(r.ok, `eq ${i}: ${r.reason}`);
    const usage = r.session.composerWhy.equipmentUsage;
    assert(usage === "meaningful" || usage === "optional", `eq ${i} usage engagé: ${usage}`);
    assert((r.session.composerWhy.equipmentApplied || []).length > 0, `eq ${i} applied`);
    assert(
      /palmes|tuba|pull/i.test(r.session.details.join(" ")),
      `eq ${i} matos visible`,
    );
    engaged += 1;
  }
  assert(engaged === 12, "engagement systématique hors exempt");

  let sawNoneOnRecup = false;
  for (let i = 0; i < 16; i++) {
    const brief = briefFrom({
      equipment: ["palmes", "tuba", "pull"],
      sessionIntent: "recuperation",
      seed: `eq-recup-${i}`,
      volumeTarget: 1200,
    });
    const r = composeSession(brief);
    assert(r.ok, `recup ${i}: ${r.reason}`);
    if (r.session.composerWhy.equipmentUsage === "none") sawNoneOnRecup = true;
  }
  assert(sawNoneOnRecup, "récup peut rester sans matos");
}

// === Refinement : 4N stroke_focus vs race_specific ===
{
  const sf = briefFrom({
    strokeFocus: "4n",
    sessionIntent: "quatre_nages",
    sessionSpecificity: "stroke_focus",
    papillonMastered: false,
    seed: "4n-sf",
    volumeTarget: 1700,
  });
  const rf = briefFrom({
    strokeFocus: "4n",
    sessionIntent: "quatre_nages",
    sessionSpecificity: "race_specific",
    papillonMastered: false,
    seed: "4n-race",
    volumeTarget: 1700,
  });
  assert(fourNagesCorpsShare("race_specific", "4n") > fourNagesCorpsShare("stroke_focus", "4n"), "race > stroke share");
  const rSf = composeSession(sf);
  const rRace = composeSession(rf);
  assert(rSf.ok && rRace.ok, `4n compose ${rSf.reason} ${rRace.reason}`);
  assert(rSf.session.sessionSpecificity === "stroke_focus", "spec sf");
  assert(rRace.session.sessionSpecificity === "race_specific", "spec race");
  const textRace = rRace.session.details.join("\n");
  assert(/dos|brasse/i.test(textRace), "race_specific corps multi-nages");
  assert(/\bpapillon\b/i.test(textRace), "race_specific papillon");
  assert(/\bpapillon\b/i.test(rSf.session.details.join("\n")), "sf papillon");
}

// === Refinement : rôles 4N portent sessionSpecificity ===
{
  const roles = regulierWeekRoles(3, { objectifV1: "nager_progresser", strokeFocus: "4n", weekIndex: 0 });
  assert(roles[0].sessionSpecificity === "stroke_focus", "A stroke_focus");
  assert(roles[2].sessionSpecificity === "race_specific", "C race_specific w0");
}

// === Refinement : wording Découverte godille ===
{
  const raw = "-100m au choix, dernière longueur en godilles";
  const hum = humanizeUserFacingText(raw, { level: "decouverte" });
  assert(!findInternalJargon(hum).includes("godille"), "pas de jargon godille affiché");
  assert(/petits mouvements des mains/i.test(hum), "formulation utilisateur");
}

// === Refinement : déterminisme conservé avec nouveaux champs ===
{
  const brief = briefFrom({
    sessionIntent: "endurance",
    seed: "det-refine",
    equipment: ["palmes", "tuba"],
    volumeTarget: 1700,
  });
  const a = composeSession(brief);
  const b = composeSession(brief);
  assert(a.ok && b.ok, "det ok");
  assert(JSON.stringify(a.session.details) === JSON.stringify(b.session.details), "déterministe refine");
  assert(a.session.composerWhy.setFormat === b.session.composerWhy.setFormat, "format stable");
}

// selectSetFormat candidats
{
  const c = candidateSetFormats({ intentId: "recuperation" });
  assert(c.includes("mixed") && c.includes("alternating"), "récup candidats");
  assert(!c.includes("repeated") || c[0] !== "repeated", "récup pas default repeated");
  assert(selectSetFormat({ forcedFormat: "pyramid" }, () => 0) === "pyramid", "force format");
}

console.log("session-composer-regulier.test.js: OK");
