/**
 * Technique banque → composeur (rétention essai : vrais drills, pas le 1er générique).
 * Usage : node src/lib/sports-engine/technique-from-bank.test.js
 */
import {
  parseArthurTechLine,
  adaptTechSetForPool,
  techniqueBankCandidates,
  pickTechniqueFromBank,
  buildTechniqueFromBank,
  resolveTechPrimaryForComposer,
} from "./technique-from-bank.js";
import { composeSession } from "./session-composer.js";
import { buildSportProfile, buildSessionBrief } from "./index.js";
import { hasBeatTubaConflict } from "./equipment-usage.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

console.log("TB1 parse");
{
  const a = parseArthurTechLine("· 8x25m rattrapé (bras dans l'axe des épaules) R15''");
  assert(a.reps === 8 && a.distancePerRep === 25 && /axe des épaules/.test(a.cue), "rattrapé 8x25");
  const b = parseArthurTechLine("· 6x50m jambes crawl planche R15''");
  assert(b.reps === 6 && b.distancePerRep === 50 && /planche/.test(b.cue), "jambes planche");
  const c = parseArthurTechLine("· 8x50 : 25m grand chien · 25m normal");
  assert(c.reps === 8 && c.distancePerRep === 50 && /grand chien/.test(c.cue), "compound 50");
}

console.log("TB2 pool 50 volume-preserving");
{
  const p = adaptTechSetForPool(
    parseArthurTechLine("· 8x25m rattrapé (bras dans l'axe) R15''"),
    50,
  );
  assert(p.distancePerRep === 50 && p.reps === 4, "8x25 → 4x50");
  assert(p.reps * p.distancePerRep === 200, "même volume");
}

console.log("TB3 regulier skip 7T/apnée");
{
  const hard = techniqueBankCandidates({
    focusKey: "technique_respiration",
    level: "regulier",
    equipment: [],
  });
  assert(hard.length > 0, "des drills respiration");
  assert(
    !hard.some((ex) => /7T|9T|apnée/.test((ex.instructions || []).join(" "))),
    "pas 7T/apnée régulier",
  );
}

console.log("TB4 pick varie selon rng");
{
  const ids = new Set();
  for (let i = 0; i < 40; i++) {
    let n = i * 9973 + 13;
    const rng = () => {
      n = (n * 1103515245 + 12345) >>> 0;
      return n / 4294967296;
    };
    const ex = pickTechniqueFromBank({
      focusKey: "technique_catchup",
      level: "regulier",
      equipment: [],
      rng,
    });
    if (ex) ids.add(ex.id);
  }
  assert(ids.size >= 3, `variété rattrapé (${ids.size} ids)`);
}

console.log("TB5 build + live compose");
{
  const sport = buildSportProfile({
    level: "régulier",
    goal: "progression",
    category: "progression",
    pool: 50,
    sessionsPerWeek: 3,
    equipment: [],
  });
  sport.objectifV1 = "nager_progresser";
  const brief = buildSessionBrief({
    sport,
    weekCtx: {
      sport,
      volumePlan: {
        weekTarget: 5400,
        sessionTargets: [1800, 1800, 1800],
        lever: "volume",
        typeSemaine: "normale",
      },
      maxZone: "Z3",
      phaseKey: "foncier",
      _phaseName: "base",
    },
    role: { objectif: "endurance", zone: "Z1", family: "endurance", intent: "endurance" },
    weekIndex: 0,
    sessionIndex: 0,
    durationTarget: 45,
    seed: "bank-tech-1",
  });
  brief.level = "regulier";
  const r = composeSession(brief);
  assert(r.ok, r.reason || "compose ok");
  const text = (r.session.details || []).join("\n");
  assert(!/\d+\s*[x×]\s*25\s*m/i.test(text), "pas de Nx25 en bassin 50");
  const techish = /rattrapé|respiration|roulis|jambes|glisse|axe|planche|3T|un bras|épaule/i.test(text);
  assert(techish, "technique réelle dans details");
}

console.log("TB6 jambes planche restituée");
{
  const built = buildTechniqueFromBank({
    techEx: {
      id: "technique_jambes_0",
      name: "Éducatif + jambes",
      instructions: ["· 4x25m rattrapé R15''", "· 6x50m jambes crawl planche R15''"],
    },
    targetVol: 400,
    pool: 50,
    swimLabel: "crawl",
    applyCue: "nage appliquée",
  });
  assert(built.usedBank, "jambes bank used");
  assert(/planche/.test(built.lines.join(" ")), "ligne planche restituée");
  assert(!/× 25m/.test(built.lines.join(" ")), "25m adapté en 50");
}

console.log("TB7 nage appliquée réservée");
{
  const built = buildTechniqueFromBank({
    techEx: {
      id: "technique_catchup_0",
      name: "Rattrapé",
      instructions: ["· 8x25m rattrapé (bras dans l'axe des épaules) R15''", "· 4x50m rattrapé lent, focus glisse"],
    },
    targetVol: 200,
    pool: 50,
    swimLabel: "crawl",
    applyCue: "économie d'énergie — allure tenable",
  });
  assert(built.usedBank, "TB7 bank");
  assert(built.sets.some((s) => /_apply$/.test(s.exerciseId)), "TB7 apply set");
  assert(/économie/.test(built.lines.join(" ")), "TB7 cue apply");
  assert(
    built.sets.reduce((a, s) => a + s.reps * s.distancePerRep, 0) === 200,
    "TB7 volume 200",
  );
}

console.log("EQ1 cycle éducatifs");
{
  assert(
    resolveTechPrimaryForComposer({ level: "regulier", weekIndex: 0, sessionIndex: 0 }, { techPrimary: "rattrape" }) ===
      "jambes",
    "S1 jambes",
  );
  assert(
    resolveTechPrimaryForComposer({ level: "regulier", weekIndex: 0, sessionIndex: 1 }, { techPrimary: "endurance" }) ===
      "respiration",
    "S2 respiration",
  );
  assert(
    resolveTechPrimaryForComposer({ level: "regulier", strokeFocus: "4n" }, { techPrimary: "rattrape" }) === "4n",
    "4n override",
  );
}

console.log("EQ2 planche sur jambes, jamais pull+palmes");
{
  const sport = buildSportProfile({
    level: "régulier",
    goal: "progression",
    category: "progression",
    pool: 50,
    sessionsPerWeek: 3,
    equipment: ["planche", "palmes", "pull", "tuba"],
  });
  sport.objectifV1 = "nager_progresser";
  const brief = buildSessionBrief({
    sport,
    weekCtx: {
      sport,
      volumePlan: {
        weekTarget: 5400,
        sessionTargets: [1800, 1800, 1800],
        lever: "volume",
        typeSemaine: "normale",
      },
      maxZone: "Z2",
      phaseKey: "foncier",
      _phaseName: "base",
    },
    role: { objectif: "endurance", zone: "Z1", family: "endurance", intent: "endurance" },
    weekIndex: 0,
    sessionIndex: 0,
    durationTarget: 45,
    seed: "eq-planche-1",
  });
  brief.level = "regulier";
  const r = composeSession(brief);
  assert(r.ok, r.reason || "eq2 compose");
  const text = (r.session.details || []).join("\n");
  assert(/planche|jambes/i.test(text), `jambes/planche attendu\n${text}`);
  assert(!(/pull/i.test(text) && /palmes/i.test(text)), "pas pull+palmes");
}

console.log("EQ3 respiration tempo : pas de tuba sur 3T/5T");
{
  const sport = buildSportProfile({
    level: "régulier",
    goal: "progression",
    category: "progression",
    pool: 50,
    sessionsPerWeek: 3,
    equipment: ["tuba", "palmes"],
  });
  sport.objectifV1 = "nager_progresser";
  const brief = buildSessionBrief({
    sport,
    weekCtx: {
      sport,
      volumePlan: {
        weekTarget: 5400,
        sessionTargets: [1800, 1800, 1800],
        lever: "volume",
        typeSemaine: "normale",
      },
      maxZone: "Z2",
      phaseKey: "foncier",
      _phaseName: "base",
    },
    role: { objectif: "endurance", zone: "Z1", family: "endurance", intent: "endurance" },
    weekIndex: 0,
    sessionIndex: 1,
    durationTarget: 45,
    seed: "eq-tuba-1",
  });
  brief.level = "regulier";
  const r = composeSession(brief);
  assert(r.ok, r.reason || "eq3 compose");
  const text = (r.session.details || []).join("\n");
  assert(/3T|5T|respiration|bilatéral/i.test(text), `respiration\n${text}`);
  const beatLines = text.split("\n").filter((l) => /\b(?:3|5|7|9)\s*T\b|respiration\s*(?:3|5|7|9)/i.test(l));
  assert(
    !beatLines.some((l) => /\btuba\b/i.test(l)),
    `pas tuba sur beats: ${beatLines.join(" | ")}`,
  );
  const techLines = text.split("\n").filter((l) => /3T|5T|respiration|bilatéral|tuba/i.test(l));
  assert(!techLines.some((l) => /palmes/i.test(l)), `pas palmes sur respi: ${techLines.join(" | ")}`);
}

console.log("EQ4 sans inventaire → pas de matos fantôme");
{
  const sport = buildSportProfile({
    level: "régulier",
    goal: "progression",
    category: "progression",
    pool: 50,
    sessionsPerWeek: 3,
    equipment: [],
  });
  sport.objectifV1 = "nager_progresser";
  const brief = buildSessionBrief({
    sport,
    weekCtx: {
      sport,
      volumePlan: {
        weekTarget: 5400,
        sessionTargets: [1800, 1800, 1800],
        lever: "volume",
        typeSemaine: "normale",
      },
      maxZone: "Z2",
      phaseKey: "foncier",
      _phaseName: "base",
    },
    role: { objectif: "endurance", zone: "Z1", family: "endurance", intent: "endurance" },
    weekIndex: 0,
    sessionIndex: 0,
    durationTarget: 45,
    seed: "eq-bare-1",
  });
  brief.level = "regulier";
  const r = composeSession(brief);
  assert(r.ok, r.reason || "eq4 compose");
  const text = (r.session.details || []).join("\n");
  assert(!/\bpalmes\b|\btuba\b|\bpull-buoy\b|\bplaquettes\b/i.test(text), `matos fantôme\n${text}`);
}

console.log("EQ5 pick préfère planche");
{
  const ex = pickTechniqueFromBank({
    focusKey: "technique_jambes",
    level: "regulier",
    equipment: ["planche"],
    preferEquipment: ["planche"],
    rng: () => 0.2,
  });
  assert(ex, "jambes candidate");
  assert(/planche/i.test((ex.instructions || []).join(" ")), "drill planche");
}

console.log("EQ6 tuba Excel préservé ; beat+tuba écarté");
{
  const inventory = [
    {
      id: "excel_tuba_align",
      type: "technique",
      focusKey: "technique_croisement",
      minLevel: "regulier",
      instructions: ["· 8x50m rattrapé + tuba frontal — alignement tête R20''"],
    },
    {
      id: "excel_beat_tuba_bad",
      type: "technique",
      focusKey: "technique_croisement",
      minLevel: "regulier",
      instructions: ["· 8x50m respiration 3T avec tuba frontal R20''"],
    },
  ];
  const picked = pickTechniqueFromBank({
    focusKey: "technique_croisement",
    level: "regulier",
    equipment: ["tuba"],
    preferEquipment: ["tuba"],
    inventory,
    rng: () => 0.1,
  });
  assert(picked?.id === "excel_tuba_align", `préfère Excel tuba sans beat, got ${picked?.id}`);
  const built = buildTechniqueFromBank({
    techEx: picked,
    targetVol: 400,
    pool: 50,
    matosNote: "",
  });
  assert(built.usedBank, "built");
  assert(/tuba/i.test(built.lines.join(" ")), `tuba Excel conservé\n${built.lines.join("\n")}`);
  assert(!hasBeatTubaConflict(built.lines), "pas beat+tuba");
}

console.log("✅ technique-from-bank tests passed");
