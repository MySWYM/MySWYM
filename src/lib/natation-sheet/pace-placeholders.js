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
    if (!intent) return "";
    if (!allowPace) {
      if (String(kind).toUpperCase() === "D") return "repos 30 s";
      return "";
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
