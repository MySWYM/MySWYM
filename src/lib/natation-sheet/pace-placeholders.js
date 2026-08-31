/**
 * Placeholders Sheet → départs D… et allures @… depuis le T100.
 *
 * Notation Google Sheet (canonique) :
 *   {D:facile}  {D:endurance}  {D:seuil}  {D:VO2}  {D:sprint}
 *   {@:facile}  {@:endurance}  {@:seuil}  {@:VO2}  {@:sprint}
 *
 * Alias (rétrocompat) :
 *   souple/lent/z1 → facile
 *   moyen/regulier/z2 → endurance
 *   vite/rapide/course/triathlon/z3 → seuil
 *   vo2max/z4 → VO2
 *   max/abloc → sprint
 *
 * Règles produit :
 * - Débutant = jamais de pace (tokens → repos / retirés), tous objectifs.
 * - Sinon : Premium + T100 renseigné ; sinon même fallback.
 */

import { appZoneMultForT100, formatPaceRange, zoneBandsForT100 } from "../swim-pace.js";

/** @typedef {'facile'|'endurance'|'seuil'|'vo2'|'sprint'} PaceIntent */

const INTENT_ALIASES = Object.freeze({
  // Canonique
  facile: "facile",
  endurance: "endurance",
  seuil: "seuil",
  vo2: "vo2",
  vo2max: "vo2",
  sprint: "sprint",
  // Alias → facile (Z1)
  souple: "facile",
  lent: "facile",
  z1: "facile",
  // Alias → endurance (Z2)
  moyen: "endurance",
  regulier: "endurance",
  reguliere: "endurance",
  z2: "endurance",
  // Alias → seuil (Z3)
  vite: "seuil",
  rapide: "seuil",
  course: "seuil",
  triathlon: "seuil",
  race: "seuil",
  allure_course: "seuil",
  allurecourse: "seuil",
  z3: "seuil",
  // Alias → VO2 (Z4)
  z4: "vo2",
  // Alias → sprint
  max: "sprint",
  abloc: "sprint",
  a_bloc: "sprint",
});

/**
 * Marge de récup (s) ajoutée au temps de nage pour le départ D.
 * VO2 = récup incomplète (marge plus courte) ; sprint = récup quasi complète (marge longue).
 */
const REST_MARGIN_SEC = Object.freeze({
  facile: 25,
  endurance: 15,
  seuil: 12,
  vo2: 15,
  sprint: 28,
});

const PACE_TOKEN_RE = /\{([D@])\s*:\s*([a-zA-Zàâäéèêëïîôùûüç_0-9]+)\}/gi;

/**
 * @param {string} raw
 * @returns {PaceIntent|null}
 */
export function normalizePaceIntent(raw) {
  const key = String(raw || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, "_")
    .trim();
  return INTENT_ALIASES[key] || null;
}

/**
 * Distance d’une rep sur la ligne Sheet (défaut 100 m).
 * @param {string} line
 */
export function inferRepMetersFromLine(line) {
  const s = String(line || "");
  const nx = s.match(/(\d+)\s*[x×]\s*(\d+)\s*m\b/i);
  if (nx) {
    const dist = parseInt(nx[2], 10);
    if (Number.isFinite(dist) && dist > 0) return dist;
  }
  const single = s.match(/\b(\d+)\s*m\b/i);
  if (single) {
    const dist = parseInt(single[1], 10);
    if (Number.isFinite(dist) && dist >= 25 && dist <= 800) return dist;
  }
  return 100;
}

/**
 * Pastille D… (arrondi 5 s, min 20 s).
 * @param {number} seconds
 */
export function formatSheetDepart(seconds) {
  const n = Math.max(20, Math.round(Number(seconds) / 5) * 5);
  const m = Math.floor(n / 60);
  const s = n % 60;
  if (s === 0) return `D${m}'`;
  return `D${m}'${String(s).padStart(2, "0")}"`;
}

/**
 * Multiplicateur temps de nage vs T100 (rep ramenée à 100 m).
 * @param {PaceIntent} intent
 * @param {number} pace100
 */
function swimMultForIntent(intent, pace100) {
  const zones = appZoneMultForT100(pace100);
  if (intent === "facile") return zones.easy;
  if (intent === "endurance") return (zones.easy + zones.threshold) / 2;
  if (intent === "seuil") return zones.threshold;
  if (intent === "vo2") return Math.min(1.02, zones.sprint + 0.04);
  // sprint = plus vite que VO2, effort max court
  return Math.min(0.98, zones.sprint);
}

/**
 * @param {number} pace100
 * @param {PaceIntent} intent
 * @param {number} repMeters
 */
export function computeDepartSeconds(pace100, intent, repMeters = 100) {
  const t100 = Number(pace100);
  if (!(t100 > 0)) return null;
  const dist = Math.max(25, Number(repMeters) || 100);
  const swim = t100 * swimMultForIntent(intent, t100) * (dist / 100);
  const rest = REST_MARGIN_SEC[intent] ?? 15;
  return swim + rest;
}

/**
 * Plage d’allure @mm:ss–mm:ss pour la distance de la rep.
 * @param {number} pace100
 * @param {PaceIntent} intent
 * @param {number} repMeters
 */
export function computeAllureAtRange(pace100, intent, repMeters = 100) {
  const t100 = Number(pace100);
  if (!(t100 > 0)) return null;
  const dist = Math.max(25, Number(repMeters) || 100);
  const bands = zoneBandsForT100(t100);
  let loHi;
  if (intent === "facile") loHi = bands.Z1;
  else if (intent === "endurance") loHi = bands.Z2;
  else if (intent === "seuil") loHi = bands.Z3;
  else if (intent === "vo2") loHi = bands.Z4;
  else {
    // sprint : un cran sous Z4 (plus vite)
    const [lo, hi] = bands.Z4;
    loHi = [lo * 0.96, hi * 0.96];
  }
  const [loM, hiM] = loHi;
  const low = t100 * loM * (dist / 100);
  const high = t100 * hiM * (dist / 100);
  return `@${formatPaceRange(low)}-${formatPaceRange(high)}`;
}

function tidyLine(line) {
  return String(line || "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ",")
    .replace(/^[,\s]+|[,\s]+$/g, "")
    .trim();
}

/** True si la ligne Sheet porte déjà un repos / R… (ne pas injecter un 2ᵉ « repos 30 s »). */
export function lineHasSheetRest(text) {
  const s = String(text || "");
  if (/\brepos\s+\d+\s*(?:s|sec|min)?/i.test(s)) return true;
  if (/\bR\s*\d+\s*['′]?\s*\d{0,2}\s*["″]?/i.test(s)) return true;
  return false;
}

/**
 * Remplace `{D:…}` / `{@:…}` sur une ligne.
 * Si `{D:}` ne peut pas devenir un départ : on retire le token quand un repos Sheet
 * est déjà là (évite « repos 30 s » + « repos 20 s »). Sinon fallback `repos 30 s`.
 * @param {string} line
 * @param {{ allowPace?: boolean, pace100?: number|null }} opts
 */
export function resolvePacePlaceholders(line, opts = {}) {
  const s = String(line || "");
  if (!/\{[D@]\s*:/i.test(s)) return s;

  const allowPace = opts.allowPace === true && Number(opts.pace100) > 0;
  const pace100 = Number(opts.pace100);
  const repMeters = inferRepMetersFromLine(s);
  const sheetRest = lineHasSheetRest(s);
  const dFallback = sheetRest ? "" : "repos 30 s";

  const out = s.replace(PACE_TOKEN_RE, (_full, kind, intentRaw) => {
    const intent = normalizePaceIntent(intentRaw);
    if (!intent) return "";
    if (!allowPace) {
      if (String(kind).toUpperCase() === "D") return dFallback;
      return "";
    }
    if (String(kind).toUpperCase() === "D") {
      const sec = computeDepartSeconds(pace100, intent, repMeters);
      return sec != null ? formatSheetDepart(sec) : dFallback;
    }
    return computeAllureAtRange(pace100, intent, repMeters) || "";
  });

  return tidyLine(out);
}

/**
 * True si le profil peut recevoir D/@ personnalisés.
 * Débutant = jamais, tous objectifs.
 * @param {{ levelBand?: string, isPremium?: boolean, pace100?: number|null }} opts
 */
export function canResolveSheetPace(opts = {}) {
  if (String(opts.levelBand || "").toLowerCase() === "debutant") return false;
  if (opts.isPremium !== true) return false;
  return Number(opts.pace100) > 0;
}

const PACE_INTENTS = /** @type {const} */ (["facile", "endurance", "seuil", "vo2", "sprint"]);

/**
 * Retrouve l’intent Sheet le plus proche d’un départ déjà matérialisé.
 * @param {number} pace100
 * @param {number} departSeconds
 * @param {number} [repMeters]
 * @returns {PaceIntent|null}
 */
export function inferPaceIntentFromDepart(pace100, departSeconds, repMeters = 100) {
  const t100 = Number(pace100);
  const target = Number(departSeconds);
  if (!(t100 > 0) || !(target > 0)) return null;
  let best = null;
  let bestDelta = Infinity;
  for (const intent of PACE_INTENTS) {
    const sec = computeDepartSeconds(t100, intent, repMeters);
    if (sec == null) continue;
    const delta = Math.abs(sec - target);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = intent;
    }
  }
  // Tolérance : si le D stocké est très loin de toute formule, ne pas inventer.
  if (best == null || bestDelta > 45) return null;
  return best;
}

/**
 * Intent depuis une plage @mm:ss-mm:ss déjà matérialisée (milieu de bande).
 * @param {number} pace100
 * @param {number} lowSeconds
 * @param {number} highSeconds
 * @param {number} [repMeters]
 * @returns {PaceIntent|null}
 */
export function inferPaceIntentFromAllure(pace100, lowSeconds, highSeconds, repMeters = 100) {
  const t100 = Number(pace100);
  const mid = (Number(lowSeconds) + Number(highSeconds)) / 2;
  if (!(t100 > 0) || !(mid > 0)) return null;
  let best = null;
  let bestDelta = Infinity;
  for (const intent of PACE_INTENTS) {
    const range = computeAllureAtRange(t100, intent, repMeters);
    if (!range) continue;
    const m = range.match(/@\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
    if (!m) continue;
    const lo = paceClockToSec(m[1]);
    const hi = paceClockToSec(m[2]);
    if (lo == null || hi == null) continue;
    const delta = Math.abs((lo + hi) / 2 - mid);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = intent;
    }
  }
  if (best == null || bestDelta > 25) return null;
  return best;
}

function paceClockToSec(mmss) {
  const m = String(mmss || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const min = parseInt(m[1], 10);
  const sec = parseInt(m[2], 10);
  if (!Number.isFinite(min) || !Number.isFinite(sec) || sec > 59) return null;
  return min * 60 + sec;
}

/**
 * Recalcule D… et @… d’une ligne à partir du nouveau T100 (même séance, pas de regen).
 * @param {string} line
 * @param {{ fromPace100: number, toPace100: number }} opts
 */
export function rewritePaceMarkersInLine(line, opts = {}) {
  const fromPace = Number(opts.fromPace100);
  const toPace = Number(opts.toPace100);
  const s = String(line || "");
  if (!(fromPace > 0) || !(toPace > 0) || fromPace === toPace) return s;
  if (!/\bD\s*\d/i.test(s) && !/@\s*\d{1,2}:\d{2}/.test(s)) return s;

  const repMeters = inferRepMetersFromLine(s);
  let out = s;

  const departRe = /\bD\s*(\d+)\s*['′]\s*(\d{0,2})\s*["″]?/gi;
  out = out.replace(departRe, (raw, minStr, secStr) => {
    const min = parseInt(minStr, 10);
    const sec = secStr != null && String(secStr).length ? parseInt(secStr, 10) : 0;
    const departSec = min * 60 + (Number.isFinite(sec) ? sec : 0);
    const intent = inferPaceIntentFromDepart(fromPace, departSec, repMeters);
    if (!intent) {
      // Fallback proportionnel (marge repos approximée).
      const scaled = Math.max(20, Math.round((departSec * toPace) / fromPace / 5) * 5);
      return formatSheetDepart(scaled);
    }
    const next = computeDepartSeconds(toPace, intent, repMeters);
    return next != null ? formatSheetDepart(next) : raw;
  });

  const allureRe = /@\s*(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})/g;
  out = out.replace(allureRe, (raw, low, high) => {
    const lo = paceClockToSec(low);
    const hi = paceClockToSec(high);
    if (lo == null || hi == null) return raw;
    const intent = inferPaceIntentFromAllure(fromPace, lo, hi, repMeters);
    if (!intent) return raw;
    return computeAllureAtRange(toPace, intent, repMeters) || raw;
  });

  return tidyLine(out);
}

/**
 * Recalcule D/@ sur une séance stockée (details + sets.label).
 * Ne touche pas aux séances validées / skippées.
 * @param {object} session
 * @param {{ fromPace100: number, toPace100: number, isPremium?: boolean, levelBand?: string }} opts
 */
export function rewriteSessionPaceMarkers(session, opts = {}) {
  if (!session || typeof session !== "object") return session;
  if (session.completed || session.skipped) return session;
  if (!canResolveSheetPace({
    levelBand: opts.levelBand,
    isPremium: opts.isPremium === true,
    pace100: opts.toPace100,
  })) {
    return session;
  }
  const fromPace = Number(opts.fromPace100);
  const toPace = Number(opts.toPace100);
  if (!(fromPace > 0) || !(toPace > 0) || fromPace === toPace) return session;

  const rewriteOpts = { fromPace100: fromPace, toPace100: toPace };
  const details = Array.isArray(session.details)
    ? session.details.map((line) => rewritePaceMarkersInLine(line, rewriteOpts))
    : session.details;
  const sets = Array.isArray(session.sets)
    ? session.sets.map((set) => {
        if (!set || typeof set !== "object") return set;
        if (set.label == null) return set;
        return { ...set, label: rewritePaceMarkersInLine(set.label, rewriteOpts) };
      })
    : session.sets;

  return { ...session, details, ...(sets ? { sets } : {}) };
}

/**
 * Applique le nouveau T100 à toutes les séances non validées du plan.
 * @param {object} plan
 * @param {{ fromPace100: number, toPace100: number, isPremium?: boolean, levelBand?: string }} opts
 */
export function rewritePlanPaceMarkers(plan, opts = {}) {
  if (!plan || !Array.isArray(plan.weeks)) return plan;
  const weeks = plan.weeks.map((week) => {
    if (!week || !Array.isArray(week.sessions)) return week;
    return {
      ...week,
      sessions: week.sessions.map((s) => rewriteSessionPaceMarkers(s, opts)),
    };
  });
  return { ...plan, weeks };
}
