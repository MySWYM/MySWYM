/**
 * Corps banque → composeur (rétention essai : vraies séries, pas 5×100 + 5×100 filler).
 * Usage : node src/lib/sports-engine/corps-from-bank.test.js
 */
import {
  parseArthurCorpsLine,
  displaySafeCue,
  corpsBankCandidates,
  pickCorpsFromBank,
  buildCorpsFromBank,
  shouldUseCorpsBank,
} from "./corps-from-bank.js";
import { composeSession } from "./session-composer.js";
import { buildSportProfile, buildSessionBrief } from "./index.js";
import { buildCorpsByFormat } from "./set-formats.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

console.log("CB1 parse");
{
  const a = parseArthurCorpsLine("8x100m D2'");
  assert(a.kind === "repeated" && a.reps === 8 && a.distancePerRep === 100, "8x100");
  const b = parseArthurCorpsLine("2x(4x100m R15'') - R45'' entre séries");
  assert(b.kind === "nested" && b.blocks === 2 && b.innerReps === 4 && b.distancePerRep === 100, "nested");
  const c = parseArthurCorpsLine("400m continu (sans pause)");
  assert(c.kind === "continuous" && c.distance === 400, "continu");
  const d = parseArthurCorpsLine("8x100m, visée toutes les 6 coups (sighting) R20''");
  assert(/sighting/.test(d.cue), "sighting cue");
}

console.log("CB2 cue sans mètres parasites");
{
  const safe = displaySafeCue("50m technique + 50m physio");
  assert(!/\d+\s*m/.test(safe), safe);
  assert(/technique/.test(safe) && /physio/.test(safe), "mots gardés");
}

console.log("CB3 regulier skip continu trop long");
{
  const list = corpsBankCandidates({
    intentId: "endurance",
    level: "regulier",
    pool: 50,
    maxContinuous: 200,
    equipment: [],
  });
  assert(list.length > 0, "des corps endurance");
  assert(
    !list.some((ex) => /^[8-9]\d{2,}m continu|^1\d{3}m continu/i.test((ex.instructions || []).join(" "))),
    "pas de 800/1200 continu régulier",
  );
}

console.log("CB4 pick varie");
{
  const ids = new Set();
  for (let i = 0; i < 30; i++) {
    let n = i * 7919 + 7;
    const rng = () => {
      n = (n * 1103515245 + 12345) >>> 0;
      return n / 4294967296;
    };
    const ex = pickCorpsFromBank({
      intentId: "endurance",
      level: "regulier",
      pool: 50,
      maxContinuous: 200,
      targetVol: 1000,
      equipment: [],
      rng,
    });
    if (ex) ids.add(ex.id);
  }
  assert(ids.size >= 3, `variété corps (${ids.size} ids)`);
}

console.log("CB5 scale + pas de 2e série");
{
  const built = buildCorpsFromBank({
    corpsEx: {
      id: "corps_endurance_0",
      instructions: ["8x100m D2'"],
    },
    targetVol: 1000,
    pool: 50,
    swimLabel: "crawl",
    applyCue: "allure confortable et constante",
    maxReps: 12,
    maxContinuous: 200,
  });
  assert(built.usedBank, "bank used");
  const vol = built.sets.reduce((a, s) => a + s.reps * s.distancePerRep, 0);
  assert(vol === 1000, `vol ${vol}`);
  assert(!/2ᵉ série|2e série, même allure/i.test(built.lines.join(" ")), "pas de filler");
  assert(!built.sets.some((s) => s.distancePerRep === 25), "pas de 25m");
}

console.log("CB6 nested affichage 2 blocs");
{
  const built = buildCorpsFromBank({
    corpsEx: {
      id: "corps_endurance_n",
      instructions: ["2x(4x100m R15'') - R45'' entre séries"],
    },
    targetVol: 800,
    pool: 50,
    swimLabel: "crawl",
    applyCue: "allure confortable",
    maxReps: 12,
    maxContinuous: 200,
  });
  assert(built.usedBank, "nested bank");
  assert(/blocs/.test(built.lines.join(" ")), built.lines.join(" | "));
}

console.log("CB7 live compose essai");
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
    seed: "bank-corps-1",
  });
  brief.level = "regulier";
  const r = composeSession(brief);
  assert(r.ok, r.reason || "compose ok");
  const text = (r.session.details || []).join("\n");
  assert(!/2ᵉ série, même allure/i.test(text), `filler encore là\n${text}`);
  assert(!/\d+\s*[x×]\s*25\s*m/i.test(text), "pas Nx25 bassin 50");
  const corpsish = /×\s*(50|100|150|200)\s*m/i.test(text);
  assert(corpsish, `corps nageable\n${text}`);
}

console.log("CB8 broken fallback = une ligne coach");
{
  const built = buildCorpsByFormat("broken", 1000, {
    label: "crawl",
    cue: "allure confortable",
    pool: 50,
    maxRepsPerSet: 12,
  });
  const disp = (built.displayLines || built.lines).join("\n");
  assert(/2 blocs/.test(disp), disp);
  assert(!/2ᵉ série, même allure/i.test(disp), disp);
}

console.log("CB9 shouldUse skip qualité");
{
  assert(!shouldUseCorpsBank({ level: "sportif", qualitySession: true, intentId: "seuil" }), "skip seuil");
  assert(shouldUseCorpsBank({ level: "sportif", intentId: "endurance" }), "endurance ok");
  assert(!shouldUseCorpsBank({ level: "decouverte", intentId: "endurance" }), "skip découverte");
}

console.log("✅ corps-from-bank tests passed");
