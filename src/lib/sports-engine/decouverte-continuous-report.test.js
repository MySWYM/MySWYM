/**
 * Auto-report continu Découverte — cadence, conversion, anti yo-yo, chaîne brief.
 * Usage : node src/lib/sports-engine/decouverte-continuous-report.test.js
 */
import {
  metersFromContinuousBand,
  resolveKnownMeters,
  shouldAskDecouverteContinuous,
  applyDecouverteContinuousResponse,
  previousSessionContextFromContinuous,
  DECOUVERTE_CONTINUOUS_SELF_REPORT_CONFIDENCE,
  CONTINUOUS_ASK_MIN_SESSIONS,
} from "./decouverte-continuous-report.js";
import { estimateCapacity, buildSportProfile, buildSessionBrief, maxContinuousForDecouverte, composeSession } from "./index.js";
import { resolveHardConstraints } from "./composer-constraints.js";
import { buildMinimalSafeSession } from "./composer-quality-gate.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

{
  assert(metersFromContinuousBand("4to8", 25) === 100, "25m 4–8 → 100m (borne basse)");
  assert(metersFromContinuousBand("8plus", 25) === 200, "25m 8+ → 200m");
  assert(metersFromContinuousBand("lt2", 25) === 25, "25m <2 → 25m");
  assert(metersFromContinuousBand("2", 50) === 100, "50m 2 longueurs → 100m");
  assert(metersFromContinuousBand("3to4", 50) === 150, "50m 3–4 → 150m");
  console.log("  ✓ conversion tranche → mètres (borne basse)");
}

{
  assert(resolveKnownMeters([{ meters: 100 }]) === 100, "une réponse");
  assert(resolveKnownMeters([{ meters: 100 }, { meters: 50 }]) === 100, "anti yo-yo : max des 2");
  assert(
    resolveKnownMeters([{ meters: 200 }, { meters: 50 }, { meters: 50 }]) === 50,
    "2 consécutives plus basses → baisse réelle",
  );
  assert(
    resolveKnownMeters([{ meters: 200 }, { meters: 100 }, { meters: 50 }, { meters: 50 }]) === 50,
    "3+ consécutives plus basses → dernière",
  );
  console.log("  ✓ anti yo-yo");
}

{
  const hist = {};
  assert(!shouldAskDecouverteContinuous({ level: "découverte", history: hist, completedSessions: 3 }), "pas avant 4 séances");
  assert(
    !shouldAskDecouverteContinuous({
      level: "découverte",
      history: hist,
      completedSessions: 4,
      now: "2026-01-15T00:00:00.000Z",
      planStartDate: "2026-01-01T00:00:00.000Z",
    }),
    "1re question : 4 séances mais < 3 semaines depuis le début de plan",
  );
  assert(
    shouldAskDecouverteContinuous({
      level: "découverte",
      history: hist,
      completedSessions: 4,
      now: "2026-01-23T00:00:00.000Z",
      planStartDate: "2026-01-01T00:00:00.000Z",
    }),
    "1re question : 4 séances ET ≥ 3 semaines",
  );
  assert(
    shouldAskDecouverteContinuous({ level: "découverte", history: hist, completedSessions: 4 }),
    "sans date de plan : 4 séances suffisent (on ne peut pas mesurer 3 semaines)",
  );
  assert(
    !shouldAskDecouverteContinuous({ level: "régulier", history: hist, completedSessions: 8 }),
    "jamais hors Découverte",
  );

  const asked = applyDecouverteContinuousResponse({
    history: hist,
    completedSessions: 4,
    now: "2026-01-01T00:00:00.000Z",
    skipped: true,
  });
  assert(
    !shouldAskDecouverteContinuous({
      level: "découverte",
      history: asked,
      completedSessions: 7,
      now: "2026-01-15T00:00:00.000Z",
    }),
    "skip : pas avant 4 séances ET ~3 semaines",
  );
  assert(
    shouldAskDecouverteContinuous({
      level: "découverte",
      history: asked,
      completedSessions: 8,
      now: "2026-01-23T00:00:00.000Z",
    }),
    "skip : retente au cycle suivant (4 séances + 21j)",
  );

  const plateau = applyDecouverteContinuousResponse({
    history: applyDecouverteContinuousResponse({
      history: applyDecouverteContinuousResponse({
        history: {},
        completedSessions: 4,
        now: "2026-01-01T00:00:00.000Z",
        pool: 25,
        bandId: "4to8",
      }),
      completedSessions: 8,
      now: "2026-02-01T00:00:00.000Z",
      pool: 25,
      bandId: "4to8",
    }),
    completedSessions: 12,
    now: "2026-03-01T00:00:00.000Z",
    pool: 25,
    bandId: "4to8",
  });
  assert(
    !shouldAskDecouverteContinuous({
      level: "découverte",
      history: plateau,
      completedSessions: 16,
      now: "2026-04-01T00:00:00.000Z",
    }),
    "plateau : 3 semaines insuffisant",
  );
  assert(
    shouldAskDecouverteContinuous({
      level: "découverte",
      history: plateau,
      completedSessions: 16,
      now: "2026-04-20T00:00:00.000Z",
    }),
    "plateau : 7 semaines OK",
  );
  console.log("  ✓ cadence 4 séances + 3 sem (7 si plateau)");
}

{
  const next = applyDecouverteContinuousResponse({
    history: {},
    completedSessions: 4,
    now: "2026-08-18T00:00:00.000Z",
    pool: 25,
    bandId: "4to8",
  });
  assert(next.maxContinuousDistance === 100, "écrit known 100m");
  assert(next.maxContinuousConfidence === DECOUVERTE_CONTINUOUS_SELF_REPORT_CONFIDENCE, "confiance 0.7");
  assert(next.maxContinuousAnswers.length === 1, "journal réponses");
  console.log("  ✓ écriture history");
}

{
  const history = applyDecouverteContinuousResponse({
    history: {},
    completedSessions: CONTINUOUS_ASK_MIN_SESSIONS,
    pool: 25,
    bandId: "4to8",
  });
  const sport = buildSportProfile({ level: "découverte", pool: 25, sessionsPerWeek: 2 });
  const capacity = estimateCapacity(sport, history);
  assert(capacity.maxContinuousDistance === 100, "capacity.maxContinuousDistance alimenté");
  assert(capacity.confidence >= 0.6 && capacity.confidence <= 0.8, `confidence ${capacity.confidence} dans 0.6–0.8`);

  const prev = previousSessionContextFromContinuous(history, capacity);
  const brief = buildSessionBrief({
    sport: buildSportProfile({ level: "découverte", pool: 25, sessionsPerWeek: 2 }, { capacity }),
    weekCtx: {
      capacity,
      volumePlan: { sessionTargets: [800], weekTarget: 800, lever: "volume", typeSemaine: "normale" },
      phaseKey: "foncier",
      maxZone: "Z2",
    },
    role: { family: "endurance", intent: "endurance", objectif: "endurance", sessionIntent: "endurance_facile" },
    durationTarget: 40,
    seed: "cont-feed-100",
    previousSessionContext: prev,
  });
  assert(brief.maxContinuousDistance >= 100, `brief.maxContinuousDistance=${brief.maxContinuousDistance}`);
  assert(brief.capacity?.maxContinuousDistance === 100, "brief.capacity.maxContinuousDistance");
  assert(brief.previousSessionContext?.capacity?.maxContinuousDistance === 100, "previousSessionContext.capacity");
  const maxCont = maxContinuousForDecouverte(brief);
  assert(maxCont === 100, `maxContinuousForDecouverte inchangé et donne 100 (reçu ${maxCont})`);

  const r = composeSession(brief);
  assert(r.ok, `compose ok: ${r.reason || ""}`);
  const corpsLong = (r.session.sets || []).some(
    (s) => s.block === "corps" && Number(s.distancePerRep) > 50,
  );
  assert(corpsLong, "corps Découverte : répétitions > 50m quand plafond = 100");
  console.log("  ✓ chaîne brief → maxContinuousForDecouverte → corps > 50m");
}

{
  const hc200 = resolveHardConstraints({
    level: "decouverte",
    pool: 25,
    maxContinuousDistance: 200,
    capacity: { confidence: 0.7, score: 0.4, maxContinuousDistance: 200 },
  });
  assert(hc200.maxContinuousDistance === 150, `haircut 200×0.75 → 150 (reçu ${hc200.maxContinuousDistance})`);

  const hc100 = resolveHardConstraints({
    level: "decouverte",
    pool: 25,
    maxContinuousDistance: 100,
    capacity: { confidence: 0.7, maxContinuousDistance: 100 },
  });
  assert(hc100.maxContinuousDistance === 100, "known 100 → 100, pas de haircut");

  const minimal = buildMinimalSafeSession(
    { level: "decouverte", volumeTarget: 700, pool: 25 },
    hc100,
  );
  const minLong = (minimal.sets || []).some((s) => Number(s.distancePerRep) > 50);
  assert(minLong, "fallback QG respecte maxContinuous 100 (pas recapé à 50)");
  console.log("  ✓ resolveHardConstraints 0,75 + fallback QG");
}

{
  const sport = buildSportProfile({ level: "découverte", pool: 25 });
  const cap = estimateCapacity(sport, { completedSessions: 2 });
  assert(cap.maxContinuousDistance == null, "sans auto-report : pas de mètres inventés");
  const regulier = estimateCapacity(buildSportProfile({ level: "régulier" }), {
    maxContinuousDistance: 400,
    maxContinuousConfidence: 0.7,
  });
  assert(regulier.maxContinuousDistance == null, "Régulier : pas d'injection découverte");
  console.log("  ✓ pas d'effet hors Découverte / sans réponse");
}

console.log("\n✅ decouverte-continuous-report tests passed");
