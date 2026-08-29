/**
 * Corps physio réel (banque Arthur) dans le composeur V1.
 * Aérobie seulement, qualité / Z3 / Z4 restent sur les formats composeur.
 * Pas de filler « 2ᵉ série, même allure ».
 */
import {
  getExerciseInventory,
  rejectsMissingEquipment,
} from "./exercise-library.js";

const TAPER_HOT = new Set(["s1", "s2", "race_week", "race_day"]);

export function poolKeyForCorps({ intentId = "", objectif = "" } = {}) {
  if (intentId === "eau_libre" || objectif === "eau_libre") return "eau_libre";
  if (intentId === "technique_endurance") return "mixte";
  return "endurance";
}

export function shouldUseCorpsBank(opts = {}) {
  const intentId = opts.intentId || "";
  if (opts.level === "decouverte") return false;
  if (opts.qualitySession) return false;
  if (/^(vitesse|vo2|seuil|allure_specifique|test|course_piscine)$/.test(intentId)) return false;
  if (opts.taperHot) return false;
  if (TAPER_HOT.has(opts.taperStage)) return false;
  return true;
}

function stripSendOff(line) {
  let restSec = 20;
  let betweenSec = 0;
  let text = String(line || "").trim();
  const between = text.match(/—\s*R(\d+)\s*''?\s*entre/i);
  if (between) {
    betweenSec = Math.min(90, Math.max(20, Number(between[1])));
    text = text.replace(between[0], "").trim();
  }
  const restD = text.match(/\s+D(\d+)\s*'?\s*$/i);
  const restR = text.match(/\s+R(\d+)\s*''?\s*$/i);
  const restMin = text.match(/\s+R(\d+)\s*'\s*$/i);
  if (restD) {
    restSec = Math.min(40, Math.max(15, Number(restD[1]) * 12));
    text = text.slice(0, restD.index).trim();
  } else if (restR) {
    restSec = Math.min(60, Math.max(10, Number(restR[1])));
    text = text.slice(0, restR.index).trim();
  } else if (restMin) {
    restSec = Math.min(60, Math.max(20, Number(restMin[1]) * 15));
    text = text.slice(0, restMin.index).trim();
  }
  return { text, restSec, betweenSec };
}

/** Cue affichable : pas de « 50m » parasite (sinon calcDetailsDistance double-compte). */
export function displaySafeCue(cue) {
  return String(cue || "")
    .replace(/(\d+)\s*m\b/gi, "")
    .replace(/\s*[+:]\s*$/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s,;:—–\-]+/, "")
    .trim();
}

/**
 * @returns {{ kind: string, reps?: number, distancePerRep?: number, distance?: number, blocks?: number, innerReps?: number, restSec: number, betweenSec: number, cue: string } | null}
 */
export function parseArthurCorpsLine(raw) {
  if (!raw) return null;
  const stripped = stripSendOff(String(raw).replace(/^[·\-*]\s*/, ""));
  const line = stripped.text;
  const nested = line.match(
    /^(\d+)\s*[x×]\s*\(\s*(\d+)\s*[x×]\s*(\d+)\s*m/i,
  );
  if (nested) {
    return {
      kind: "nested",
      blocks: Number(nested[1]),
      innerReps: Number(nested[2]),
      distancePerRep: Number(nested[3]),
      restSec: stripped.restSec,
      betweenSec: stripped.betweenSec || 45,
      cue: "en blocs",
    };
  }
  const cont = line.match(/^(\d+)\s*m\s+continu(.*)$/i);
  if (cont) {
    return {
      kind: "continuous",
      distance: Number(cont[1]),
      restSec: 0,
      betweenSec: 0,
      cue: displaySafeCue(cont[2] || "sans pause"),
    };
  }
  const nxm = line.match(/^(\d+)\s*[x×]\s*(\d+)\s*m?\s*(.*)$/i);
  if (!nxm) return null;
  const reps = Number(nxm[1]);
  const distancePerRep = Number(nxm[2]);
  if (!reps || !distancePerRep || reps < 1 || distancePerRep < 25) return null;
  let cue = displaySafeCue(nxm[3] || "");
  if (/↗|progressif/i.test(line)) cue = "lent → plus vite";
  if (/↘|dégressif|degressif/i.test(line)) cue = "plus vite → lent";
  return {
    kind: "repeated",
    reps,
    distancePerRep,
    restSec: stripped.restSec,
    betweenSec: 0,
    cue,
  };
}

export function corpsBankCandidates(opts = {}) {
  const {
    intentId,
    objectif,
    level = "regulier",
    equipment,
    painProtection = false,
    pool = 50,
    maxContinuous = 200,
    inventory = getExerciseInventory(),
  } = opts;
  const poolKey = poolKeyForCorps({ intentId, objectif });
  return inventory.filter((ex) => {
    if (ex.type !== "corps" || ex.poolKey !== poolKey) return false;
    if (Array.isArray(ex.pools) && ex.pools.length && !ex.pools.includes(pool)) return false;
    if (rejectsMissingEquipment(ex, equipment)) return false;
    if (ex.incompatibilities?.includes(level)) return false;
    const text = (ex.instructions || []).join(" ");
    if (pool === 50 && /\d+\s*[x×]\s*25\s*m/i.test(text) && !/50m\s*:/.test(text)) return false;
    if (painProtection && /R10|à bloc|sprint|Z4|chrono|plongé/i.test(text)) return false;
    if (level === "regulier" && /R10''|R10\b/.test(text)) return false;
    const parsed = parseArthurCorpsLine(text);
    if (!parsed) return false;
    if (parsed.kind === "continuous" && parsed.distance > maxContinuous) return false;
    const rep = parsed.distancePerRep || parsed.distance || 0;
    if (rep > maxContinuous && parsed.kind !== "nested") return false;
    if (pool === 50 && (parsed.distancePerRep === 25 || parsed.distance === 25)) return false;
    return true;
  });
}

export function pickCorpsFromBank(opts = {}) {
  const list = corpsBankCandidates(opts);
  if (!list.length) return null;
  const target = opts.targetVol || 800;
  const scored = list
    .map((ex) => ({
      ex,
      err: Math.abs((ex.rawDistance || 800) - target) / Math.max(1, target),
    }))
    .sort((a, b) => a.err - b.err);
  const near = scored.filter((s) => s.err <= 0.55);
  const pool = near.length >= 2 ? near : scored.slice(0, Math.min(6, scored.length));
  const rng = opts.rng;
  if (typeof rng === "function" && pool.length) {
    return pool[Math.floor(rng() * pool.length) % pool.length].ex;
  }
  return pool[0]?.ex || null;
}

function complementUnit(mainDist, remain, quantum) {
  if (mainDist >= 200) return remain >= 400 ? 100 : quantum;
  if (mainDist === 150) return 50;
  if (mainDist === 100) return remain >= 400 ? 200 : 50;
  if (mainDist === 50) return remain >= 400 ? 100 : 50;
  return 100;
}

function formatLine(s) {
  const cue = displaySafeCue(s.cue);
  const cueTxt = cue ? ` - ${cue}` : "";
  if (s.continuous || (s.reps === 1 && !s.restSec)) {
    return `-${s.distancePerRep}m ${s.label}${cueTxt}`;
  }
  return `-${s.reps} × ${s.distancePerRep}m ${s.label}${cueTxt} - repos ${s.restSec}s`;
}

function fitReps(target, dist, maxReps) {
  const reps = Math.round(target / dist);
  if (reps >= 4 && reps <= 8 && reps <= maxReps) return { reps, dist, used: reps * dist };
  if (reps === 10 && dist === 100 && reps <= maxReps) return { reps, dist, used: reps * dist };
  if (reps > 10 && dist === 100) return fitReps(target, 200, maxReps);
  if (reps >= 2 && reps <= maxReps && Math.abs(reps * dist - target) <= dist) {
    return { reps, dist, used: reps * dist };
  }
  if (reps > maxReps && dist < 200) {
    const next = dist <= 50 ? 100 : 200;
    return fitReps(target, next, maxReps);
  }
  const capped = Math.min(maxReps, Math.max(2, Math.floor(target / dist)));
  return { reps: capped, dist, used: capped * dist };
}

/**
 * @returns {{ sets: object[], lines: string[], displayLines: string[], setFormat: string, usedBank: boolean, exerciseId: string|null }}
 */
export function buildCorpsFromBank({
  corpsEx,
  targetVol,
  pool = 50,
  swimLabel = "crawl",
  applyCue = "allure confortable",
  zone = null,
  maxReps = 12,
  maxContinuous = 200,
  restFor = null,
} = {}) {
  const empty = {
    sets: [],
    lines: [],
    displayLines: [],
    setFormat: "repeated",
    usedBank: false,
    exerciseId: null,
  };
  if (!corpsEx || !targetVol) return empty;
  const quantum = pool === 25 ? 25 : 50;
  const target = Math.max(quantum * 2, Math.round(targetVol / quantum) * quantum);
  const parsed = parseArthurCorpsLine((corpsEx.instructions || [])[0]);
  if (!parsed) return empty;

  const restOf = (intensity, dist, fallback) => {
    if (typeof restFor === "function") {
      return Math.max(10, restFor({ intensity, distancePerRep: dist, block: "corps", zone }) || fallback);
    }
    return fallback;
  };

  const sets = [];
  const push = (s) => {
    if (zone) s.zone = zone;
    sets.push(s);
  };

  if (parsed.kind === "continuous") {
    const d = Math.min(parsed.distance, maxContinuous, target);
    const snapped = Math.max(quantum, Math.round(d / quantum) * quantum);
    if (snapped < quantum * 2 && snapped < 100) return empty;
    push({
      reps: 1,
      distancePerRep: snapped,
      restSec: 0,
      label: swimLabel,
      cue: parsed.cue || "sans pause",
      block: "corps",
      exerciseId: corpsEx.id,
      continuous: true,
      setFormat: "continuous",
    });
  } else if (parsed.kind === "nested") {
    let dist = parsed.distancePerRep;
    if (pool === 50 && dist === 25) dist = 50;
    if (dist > maxContinuous) return empty;
    const baseVol = parsed.blocks * parsed.innerReps * dist;
    const ratio = target / Math.max(1, baseVol);
    let inner = Math.max(3, Math.round(parsed.innerReps * Math.min(1.4, Math.max(0.7, ratio))));
    inner = Math.min(8, inner);
    const blocks = parsed.blocks >= 2 ? parsed.blocks : 2;
    let totalReps = inner * blocks;
    if (totalReps > maxReps) {
      inner = Math.max(3, Math.floor(maxReps / blocks));
      totalReps = inner * blocks;
    }
    const used = totalReps * dist;
    const restSec = restOf("facile", dist, parsed.restSec || 15);
    const between = parsed.betweenSec || 45;
    const blocCue = `en ${blocks} blocs de ${inner}, ${between}s entre`;
    const extra = displaySafeCue(applyCue);
    push({
      reps: totalReps,
      distancePerRep: dist,
      restSec,
      label: swimLabel,
      cue: extra && !/bloc/i.test(extra) ? `${blocCue} - ${extra}` : blocCue,
      block: "corps",
      exerciseId: corpsEx.id,
      continuous: false,
      setFormat: "broken",
      meta: { brokenBlocks: blocks, innerReps: inner, betweenSec: between },
    });
    // Ajuster légèrement le volume via le total déjà posé
    if (Math.abs(used - target) <= dist) {
      /* ok */
    }
  } else {
    let dist = parsed.distancePerRep;
    if (pool === 50 && dist === 25) {
      dist = 50;
    }
    if (dist > maxContinuous) return empty;
    const fit = fitReps(target, dist, maxReps);
    dist = fit.dist;
    const restSec = restOf("facile", dist, parsed.restSec || 20);
    let cue = displaySafeCue(parsed.cue) || displaySafeCue(applyCue);
    push({
      reps: fit.reps,
      distancePerRep: dist,
      restSec,
      label: swimLabel,
      cue,
      block: "corps",
      exerciseId: corpsEx.id,
      continuous: false,
      setFormat: /progressif/i.test(cue) ? "progressive" : /dégressif/i.test(cue) ? "descending" : "repeated",
    });
  }

  if (!sets.length) return empty;

  let used = sets.reduce((a, s) => a + s.reps * s.distancePerRep, 0);
  const remain = target - used;
  if (remain >= quantum * 2) {
    const mainDist = sets[0].distancePerRep;
    let cDist = complementUnit(mainDist, remain, quantum);
    if (cDist === mainDist && remain >= 200) cDist = mainDist === 100 ? 50 : 100;
    if (cDist > maxContinuous) cDist = Math.min(100, maxContinuous);
    cDist = Math.max(quantum, cDist);
    let reps = Math.min(maxReps, Math.floor(remain / cDist));
    if (reps < 2 && remain >= 100 && cDist > 50) {
      cDist = 50;
      reps = Math.min(maxReps, Math.floor(remain / 50));
    }
    if (reps >= 2) {
      const restSec = restOf("facile", cDist, cDist >= 100 ? 25 : 20);
      push({
        reps,
        distancePerRep: cDist,
        restSec,
        label: swimLabel,
        cue: displaySafeCue(applyCue) || "nage appliquée",
        block: "corps",
        exerciseId: `${corpsEx.id}_c`,
        continuous: false,
        setFormat: "repeated",
        meta: { blockPart: 2 },
      });
      used += reps * cDist;
    }
  }

  // Micro-fit dernier set (± unité)
  used = sets.reduce((a, s) => a + s.reps * s.distancePerRep, 0);
  const last = sets[sets.length - 1];
  if (!last.continuous && last.reps >= 2) {
    while (used > target + last.distancePerRep && last.reps > 2) {
      last.reps -= 1;
      used -= last.distancePerRep;
    }
    while (used < target - last.distancePerRep && last.reps < maxReps) {
      last.reps += 1;
      used += last.distancePerRep;
    }
  }

  const lines = sets.map(formatLine);
  return {
    sets,
    lines,
    displayLines: lines,
    setFormat: sets[0]?.setFormat || "repeated",
    usedBank: true,
    exerciseId: corpsEx.id,
  };
}
