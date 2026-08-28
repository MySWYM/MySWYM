/**
 * Placeholders Sheet → départs D… et allures @… depuis le T100.
 *
 * Notation Google Sheet (exacte) :
 *   {D:moyen}  {D:vite}  {D:course}  {D:souple}
 *   {@:moyen}  {@:vite}  {@:course}  {@:souple}
 *
 * Alias acceptés : regulier/régulière→moyen, rapide→vite, triathlon/race→course,
 * facile/lent→souple, z1→souple, z2→moyen, z3→vite.
 *
 * Règles produit :
 * - Débutant = jamais de pace (tokens → repos / retirés), tous objectifs.
 * - Sinon : Premium + T100 renseigné ; sinon même fallback.
 */

import { appZoneMultForT100, formatPaceRange, zoneBandsForT100 } from "../swim-pace.js";

/** @typedef {'souple'|'moyen'|'vite'|'course'} PaceIntent */

const INTENT_ALIASES = Object.freeze({
  souple: "souple",
  facile: "souple",
  lent: "souple",
  z1: "souple",
  moyen: "moyen",
  regulier: "moyen",
  reguliere: "moyen",
  réguliere: "moyen",
  régulière: "moyen",
  z2: "moyen",
  vite: "vite",
  rapide: "vite",
  z3: "vite",
  course: "course",
  triathlon: "course",
  race: "course",
  allure_course: "course",
  allurecourse: "course",
});

/** Marge de récup (s) ajoutée au temps de nage pour le départ D. */
const REST_MARGIN_SEC = Object.freeze({
  souple: 20,
  moyen: 15,
  vite: 20,
  course: 12,
});

const PACE_TOKEN_RE = /\{([D@])\s*:\s*([a-zA-Zàâäéèêëïîôùûüç_]+)\}/gi;

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
  // « 100 m crawl moyen, {D:moyen} » — premier métrage isolé
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
 * Multiplicateur temps de nage vs T100, pour la distance 100 m.
 * @param {PaceIntent} intent
 * @param {number} pace100
 */
function swimMultForIntent(intent, pace100) {
  const zones = appZoneMultForT100(pace100);
  if (intent === "souple") return zones.easy;
  if (intent === "moyen") return (zones.easy + zones.threshold) / 2;
  if (intent === "vite") return zones.threshold;
  // course ≈ un peu au-dessus du T100 (tenue, pas max)
  return Math.min(1.05, zones.sprint + 0.06);
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
  if (intent === "souple") loHi = bands.Z1;
  else if (intent === "moyen") loHi = bands.Z2;
  else if (intent === "vite") loHi = bands.Z3;
  else loHi = bands.Z3; // course ≈ Z3 serré / un cran sous Z4
  if (intent === "course") {
    const [lo, hi] = bands.Z3;
    loHi = [lo * 0.98, hi * 0.98];
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

/**
 * Remplace `{D:…}` / `{@:…}` sur une ligne.
 * @param {string} line
 * @param {{ allowPace?: boolean, pace100?: number|null }} opts
 */
export function resolvePacePlaceholders(line, opts = {}) {
  const s = String(line || "");
  if (!/\{[D@]\s*:/i.test(s)) return s;

  const allowPace = opts.allowPace === true && Number(opts.pace100) > 0;
  const pace100 = Number(opts.pace100);
  const repMeters = inferRepMetersFromLine(s);

  const out = s.replace(PACE_TOKEN_RE, (_full, kind, intentRaw) => {
    const intent = normalizePaceIntent(intentRaw);
    if (!intent) return ""; // token inconnu → retirer
    if (!allowPace) {
      if (String(kind).toUpperCase() === "D") return "repos 30 s";
      return ""; // {@:} sans pace → retiré
    }
    if (String(kind).toUpperCase() === "D") {
      const sec = computeDepartSeconds(pace100, intent, repMeters);
      return sec != null ? formatSheetDepart(sec) : "repos 30 s";
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
