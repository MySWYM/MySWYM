/**
 * Restitue un drill TECHNIQUE réel (banque Arthur) dans le composeur V1.
 * Ne change pas la charge : on tient le volume technique du brief.
 */
import {
  getExerciseInventory,
  rejectsMissingEquipment,
} from "./exercise-library.js";
import { concreteApplyCue, concreteTechLabel, isVagueVolumeThemeTitle } from "./session-labels.js";
import { filterMatosNoteForLabel, hasBreathingBeat } from "./equipment-usage.js";

/** Danger réel (douleur) — pas ADVANCED_RE (qui tague aussi rattrapé / petit chien). */
const PAIN_SKIP_RE = /apnée|apnee|\b7T\b|\b9T\b|culbute|hypoxie|VO2|à bloc|depart plongé|sprint|Z4/i;

const LEVEL_RANK = { decouverte: 0, regulier: 1, sportif: 2, performance: 3 };

const APPLY_LINE_RE = /nage complète|nage normale|nage appliquée|retour à nage|crawl facile/i;

/** Cycle éducatifs composeur — ~3/8 jambes, chiens rare, pas de virages en régulier. */
export const COMPOSER_FOCUS_CYCLE_REGULIER = [
  "jambes",
  "respiration",
  "roulis",
  "jambes",
  "rattrape",
  "jambes",
  "respiration",
  "chiens",
];
export const COMPOSER_FOCUS_CYCLE_SPORTIF = [
  "jambes",
  "respiration",
  "roulis",
  "jambes",
  "rattrape",
  "virages",
  "jambes",
  "chiens",
];

export function resolveTechPrimaryForComposer(brief = {}, intent = {}) {
  const primary = intent?.techPrimary;
  if (primary === "4n" || brief.strokeFocus === "4n") return "4n";
  if (primary === "nage" && (intent.id === "recuperation" || intent.id === "reprise")) return "nage";
  const level = brief.level || "regulier";
  if (level === "decouverte") return primary || "flèche";
  const cycle = level === "regulier" ? COMPOSER_FOCUS_CYCLE_REGULIER : COMPOSER_FOCUS_CYCLE_SPORTIF;
  const idx = (Number(brief.weekIndex) || 0) * 3 + (Number(brief.sessionIndex) || 0);
  return cycle[((idx % cycle.length) + cycle.length) % cycle.length];
}

function drillText(ex) {
  return (ex.instructions || []).join(" ");
}

function drillHasEq(ex, eq) {
  const t = drillText(ex);
  if (eq === "planche") return /planche/i.test(t);
  if (eq === "palmes") return /palmes?/i.test(t);
  if (eq === "tuba") return /tuba/i.test(t);
  if (eq === "pull") return /pull/i.test(t);
  if (eq === "plaquettes") return /plaquette/i.test(t);
  return false;
}

/**
 * Parse une ligne Arthur « · 8x25m rattrapé … R15'' »
 * @returns {{ reps: number, distancePerRep: number, cue: string, restSec: number } | null}
 */
export function parseArthurTechLine(raw) {
  if (!raw) return null;
  let line = String(raw)
    .replace(/^[·\-*]\s*/, "")
    .trim();
  if (!line) return null;

  let restSec = 15;
  const restD = line.match(/\s+D(\d+)\s*'?\s*$/i);
  const restR = line.match(/\s+R(\d+)\s*''?\s*$/i);
  if (restD) {
    restSec = Math.min(30, Math.max(15, Number(restD[1]) * 15));
    line = line.slice(0, restD.index).trim();
  } else if (restR) {
    restSec = Math.min(40, Math.max(15, Number(restR[1])));
    line = line.slice(0, restR.index).trim();
  }

  const m = line.match(/^(\d+)\s*[x×]\s*(\d+)\s*m?\s*(.*)$/i);
  if (!m) return null;
  const reps = Number(m[1]);
  const distancePerRep = Number(m[2]);
  if (!reps || !distancePerRep || reps < 1 || distancePerRep < 25) return null;
  let cue = String(m[3] || "")
    .replace(/^[:—–\-]+\s*/, "")
    .replace(/^—\s*/, "")
    .trim();
  if (/^\(\s*Z\d/i.test(cue)) cue = cue.replace(/^\(Z\d[^)]*\)\s*[—–-]?\s*/, "").trim();
  return { reps, distancePerRep, cue, restSec };
}

/** Bassin 50 : pas de Nx25 — même volume (8×25 → 4×50), pas de sprint+relâché. */
export function adaptTechSetForPool(parsed, pool) {
  if (!parsed) return null;
  if (pool !== 50 || parsed.distancePerRep !== 25) return { ...parsed };
  const vol = parsed.reps * 25;
  const reps = Math.max(2, Math.round(vol / 50));
  return { ...parsed, reps, distancePerRep: 50 };
}

/**
 * Candidats banque pour un focus, filtrés niveau / matos / danger.
 */
export function techniqueBankCandidates(opts = {}) {
  const {
    focusKey,
    level = "regulier",
    equipment,
    painProtection = false,
    inventory = getExerciseInventory(),
  } = opts;
  if (!focusKey) return [];
  const rank = LEVEL_RANK[level] ?? 1;
  return inventory.filter((ex) => {
    if (ex.type !== "technique" || ex.focusKey !== focusKey) return false;
    if ((LEVEL_RANK[ex.minLevel] ?? 0) > rank) return false;
    if (ex.incompatibilities?.includes(level)) return false;
    if (rejectsMissingEquipment(ex, equipment)) return false;
    const text = (ex.instructions || []).join(" ");
    if (level === "regulier" && /apnée|apnee|\b7T\b|\b9T\b|culbute|hypoxie|VO2|à bloc|depart plongé/i.test(text)) {
      return false;
    }
    if (painProtection && PAIN_SKIP_RE.test(text)) return false;
    return true;
  });
}

export function pickTechniqueFromBank(opts = {}) {
  const list = techniqueBankCandidates(opts);
  const rng = opts.rng;
  const prefer = (opts.preferEquipment || []).filter(Boolean);
  const avoid = (opts.avoidEquipment || []).filter(Boolean);
  let pool = list;
  if (avoid.length) {
    const filtered = list.filter((ex) => !avoid.some((eq) => drillHasEq(ex, eq)));
    if (filtered.length) pool = filtered;
  }
  if (prefer.length) {
    const matching = pool.filter((ex) => prefer.some((eq) => drillHasEq(ex, eq)));
    if (matching.length) pool = matching;
  }
  if (!pool.length) return null;
  if (typeof rng === "function") {
    return pool[Math.floor(rng() * pool.length) % pool.length];
  }
  return pool[0];
}

/**
 * Transforme les lignes du drill en sets composeur, calés sur targetVol.
 * @returns {{ sets: object[], lines: string[], usedBank: boolean, exerciseId: string|null }}
 */
export function buildTechniqueFromBank({
  techEx,
  targetVol,
  pool = 50,
  swimLabel = "crawl",
  applyCue = "nage appliquée",
  matosNote = "",
  zone = null,
  maxReps = 12,
  restFor = null,
} = {}) {
  const empty = { sets: [], lines: [], usedBank: false, exerciseId: null };
  if (!techEx || !targetVol) return empty;

  const parsed = [];
  for (const raw of techEx.instructions || []) {
    const p = adaptTechSetForPool(parseArthurTechLine(raw), pool);
    if (!p) continue;
    if (p.reps > maxReps) {
      const vol = p.reps * p.distancePerRep;
      p.reps = maxReps;
      const unit = p.distancePerRep;
      const keep = p.reps * unit;
      if (keep < vol * 0.5 && unit === 50 && maxReps >= 6) {
        /* volume trop amputé : skip cette ligne */
        continue;
      }
    }
    parsed.push(p);
  }
  if (!parsed.length) return empty;

  const unit = pool === 25 ? 25 : 50;
  const hasSignature = parsed.some((p) =>
    /jambes|planche|palmes|roulis|tuba|3T|5T|grand chien|flèche/i.test(p.cue || ""),
  );
  const applyReserve =
    parsed.length <= 1 || !hasSignature
      ? targetVol >= unit * 4
        ? unit * 2
        : 0
      : 0;
  const drillBudget = Math.max(unit * 2, targetVol - applyReserve);

  const sets = [];
  let used = 0;
  for (const p of parsed) {
    let reps = p.reps;
    let dist = p.distancePerRep;
    const remain = drillBudget - used;
    if (remain < dist * 2 && sets.length) break;
    const lineVol = reps * dist;
    if (lineVol > remain && remain >= dist * 2) {
      reps = Math.max(2, Math.floor(remain / dist));
    }
    const laterSig = parsed.slice(parsed.indexOf(p) + 1).some((q) =>
      /jambes|planche|palmes/i.test(q.cue || ""),
    );
    if (laterSig && remain - reps * dist < dist * 2 && remain >= dist * 4) {
      reps = Math.max(2, Math.floor((remain - dist * 2) / dist));
    }
    if (reps * dist > remain && remain >= 50 && dist === 25 && pool === 50) {
      dist = 50;
      reps = Math.max(2, Math.floor(remain / 50));
    }
    if (reps < 2) continue;
    const restSec =
      typeof restFor === "function"
        ? restFor({ intensity: "facile", distancePerRep: dist, block: "technique", zone })
        : p.restSec;
    let label = concreteTechLabel(p.cue || techEx.name || "", techEx.focusKey);
    if (isVagueVolumeThemeTitle(`${reps} × ${dist}m ${label}`)) {
      label = concreteTechLabel("", techEx.focusKey);
    }
    const alreadyHasMatos = /palmes|tuba|pull|planche|plaquette|avec\s/i.test(label);
    const safeMatos = filterMatosNoteForLabel(label, matosNote);
    const skipGlue =
      !safeMatos ||
      alreadyHasMatos ||
      APPLY_LINE_RE.test(label) ||
      (/planche/i.test(safeMatos) && !/jambes|battement/i.test(label)) ||
      (/palmes/i.test(safeMatos) && (/3T|5T|7T|9T|respiration/i.test(label) || hasBreathingBeat(label))) ||
      (/tuba/i.test(safeMatos) && hasBreathingBeat(label));
    if (!skipGlue) label = `${label} avec ${safeMatos}`;
    const set = {
      reps,
      distancePerRep: dist,
      restSec: Math.max(15, restSec || 15),
      label,
      cue: "",
      block: "technique",
      exerciseId: techEx.id,
      continuous: false,
      compoundCue: /^\d/.test(p.cue || ""),
    };
    if (zone) set.zone = zone;
    sets.push(set);
    used += reps * dist;
    if (used >= drillBudget - 25) break;
  }

  if (!sets.length) return empty;

  const remain = targetVol - used;
  if (remain >= unit * 2) {
    const reps = Math.min(maxReps, Math.floor(remain / unit));
    if (reps >= 2) {
      const restSec =
        typeof restFor === "function"
          ? restFor({ intensity: "facile", distancePerRep: unit, block: "technique", zone })
          : 15;
      const apply = {
        reps,
        distancePerRep: unit,
        restSec: Math.max(15, restSec),
        label: concreteApplyCue(applyCue, swimLabel),
        cue: "",
        block: "technique",
        exerciseId: `${techEx.id}_apply`,
        continuous: false,
      };
      if (zone) apply.zone = zone;
      sets.push(apply);
    }
  }

  const lines = sets.map((s) => {
    const mid = s.compoundCue
      ? `${s.reps} × ${s.distancePerRep}m : ${s.label}`
      : `${s.reps} × ${s.distancePerRep}m ${s.label}`;
    const cue = s.cue ? ` — ${s.cue}` : "";
    return `-${mid}${cue} — repos ${s.restSec}s`;
  });

  return { sets, lines, usedBank: true, exerciseId: techEx.id };
}
