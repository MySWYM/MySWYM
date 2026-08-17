/**
 * Auto-report Découverte — alimente `_engineHistory.maxContinuousDistance`
 * (le `known` de `maxContinuousForDecouverte`) sans changer les seuils moteur.
 *
 * Confiance écrite : 0.7 (milieu de 0.6–0.8). Auto-report honnête mais imprécis :
 * assez pour passer known≥100 → 0.35 et known≥200 → 0.45, sans prétendre un T100.
 */
import { normalizeUiLevel } from "./types.js";

/** @see file header — ne pas baisser sous 0.45, ne pas monter à 1. */
export const DECOUVERTE_CONTINUOUS_SELF_REPORT_CONFIDENCE = 0.7;

export const CONTINUOUS_ASK_MIN_SESSIONS = 4;
export const CONTINUOUS_ASK_MIN_DAYS = 21;
/** Plateau (3 réponses dans la même tranche) : 7 semaines, milieu de 6–8. */
export const CONTINUOUS_ASK_PLATEAU_DAYS = 49;

const BANDS_25 = Object.freeze([
  { id: "lt2", label: "Moins de 2 longueurs", meters: 25 },
  { id: "2to4", label: "2 à 4 longueurs", meters: 50 },
  { id: "4to8", label: "4 à 8 longueurs", meters: 100 },
  { id: "8plus", label: "8 longueurs et plus", meters: 200 },
]);

const BANDS_50 = Object.freeze([
  { id: "1", label: "1 longueur", meters: 50 },
  { id: "2", label: "2 longueurs", meters: 100 },
  { id: "3to4", label: "3 à 4 longueurs", meters: 150 },
  { id: "4plus", label: "4 longueurs et plus", meters: 200 },
]);

export const DECOUVERTE_CONTINUOUS_PROMPT_COPY =
  "Sans te prendre la tête — tu enchaînes combien de longueurs d'affilée, à ton rythme, avant de t'arrêter ?";

export function poolLength(pool) {
  return Number(pool) === 25 ? 25 : 50;
}

export function continuousBandOptions(pool) {
  return poolLength(pool) === 25 ? BANDS_25 : BANDS_50;
}

/** Borne basse de la tranche, en mètres. */
export function metersFromContinuousBand(bandId, pool) {
  const row = continuousBandOptions(pool).find((b) => b.id === bandId);
  return row ? row.meters : 0;
}

function answerMeters(answers) {
  return (Array.isArray(answers) ? answers : [])
    .map((a) => Number(a?.meters))
    .filter((n) => Number.isFinite(n) && n > 0);
}

/**
 * Anti yo-yo : known = max des 2 dernières réponses.
 * Si 2 réponses consécutives sont sous la valeur d'avant → baisse réelle (max de ces 2).
 * Si 3 consécutives plus basses → on retient la dernière.
 */
export function resolveKnownMeters(answers) {
  const meters = answerMeters(answers);
  if (!meters.length) return 0;
  if (meters.length === 1) return meters[0];
  const last = meters[meters.length - 1];
  const prev = meters[meters.length - 2];
  const older = meters.length >= 3 ? meters[meters.length - 3] : null;
  const oldest = meters.length >= 4 ? meters[meters.length - 4] : null;

  if (oldest != null && last < oldest && prev < oldest && older < oldest) {
    return last;
  }
  if (older != null && last < older && prev < older) {
    return Math.max(last, prev);
  }
  return Math.max(last, prev);
}

function isPlateauAnswers(answers) {
  const list = Array.isArray(answers) ? answers : [];
  if (list.length < 3) return false;
  const last3 = list.slice(-3);
  const band = last3[0]?.bandId;
  return !!band && last3.every((a) => a.bandId === band);
}

export function shouldAskDecouverteContinuous({
  level,
  history = {},
  completedSessions = 0,
  now = new Date(),
  planStartDate = null,
} = {}) {
  if (normalizeUiLevel(level) !== "decouverte") return false;
  const completed = Number(completedSessions) || 0;
  if (completed < CONTINUOUS_ASK_MIN_SESSIONS) return false;

  const lastAskedAt = history.maxContinuousLastAskedAt || null;
  const lastAskedCompleted = Number(history.maxContinuousLastAskedCompleted);
  const neverAsked = !lastAskedAt && !Number.isFinite(lastAskedCompleted);

  const sessionsSince = neverAsked
    ? completed
    : completed - (Number.isFinite(lastAskedCompleted) ? lastAskedCompleted : 0);
  if (sessionsSince < CONTINUOUS_ASK_MIN_SESSIONS) return false;

  const minDays = isPlateauAnswers(history.maxContinuousAnswers)
    ? CONTINUOUS_ASK_PLATEAU_DAYS
    : CONTINUOUS_ASK_MIN_DAYS;
  const anchor = lastAskedAt || planStartDate || history.planStartDate || null;
  if (anchor) {
    const elapsedDays = (new Date(now).getTime() - new Date(anchor).getTime()) / 86400000;
    if (elapsedDays < minDays) return false;
  }
  // Sans date (1re question, pas de début de plan) : on ne peut pas mesurer 3 semaines.
  // On exige quand même les 4 séances ; la date s'applique dès qu'elle existe.
  return true;
}

export function decouverteContinuousPrompt({
  level,
  pool,
  history = {},
  completedSessions = 0,
  now = new Date(),
  planStartDate = null,
} = {}) {
  if (!shouldAskDecouverteContinuous({ level, history, completedSessions, now, planStartDate })) return null;
  const p = poolLength(pool);
  return {
    pool: p,
    copy: DECOUVERTE_CONTINUOUS_PROMPT_COPY,
    options: continuousBandOptions(p).map(({ id, label }) => ({ id, label })),
  };
}

export function applyDecouverteContinuousResponse({
  history = {},
  completedSessions = 0,
  now = new Date(),
  pool = 25,
  bandId = null,
  skipped = false,
} = {}) {
  const at = new Date(now).toISOString();
  const asked = {
    maxContinuousLastAskedAt: at,
    maxContinuousLastAskedCompleted: Number(completedSessions) || 0,
  };
  if (skipped || !bandId) {
    return { ...history, ...asked };
  }
  const meters = metersFromContinuousBand(bandId, pool);
  if (!meters) {
    return { ...history, ...asked };
  }
  const answers = [
    ...(Array.isArray(history.maxContinuousAnswers) ? history.maxContinuousAnswers : []),
    { meters, bandId, pool: poolLength(pool), at },
  ].slice(-8);
  return {
    ...history,
    ...asked,
    maxContinuousAnswers: answers,
    maxContinuousDistance: resolveKnownMeters(answers),
    maxContinuousConfidence: DECOUVERTE_CONTINUOUS_SELF_REPORT_CONFIDENCE,
  };
}

export function previousSessionContextFromContinuous(history = {}, capacity = null) {
  const meters =
    Number(history.maxContinuousDistance) ||
    Number(capacity?.maxContinuousDistance) ||
    0;
  if (!meters) return null;
  const confidence =
    Number(capacity?.confidence) ||
    Number(history.maxContinuousConfidence) ||
    DECOUVERTE_CONTINUOUS_SELF_REPORT_CONFIDENCE;
  return {
    maxContinuousDistance: meters,
    capacity: {
      maxContinuousDistance: meters,
      confidence,
    },
  };
}

export function pickContinuousHistoryFields(source = {}) {
  return {
    maxContinuousDistance: source.maxContinuousDistance ?? null,
    maxContinuousConfidence: source.maxContinuousConfidence ?? null,
    maxContinuousAnswers: Array.isArray(source.maxContinuousAnswers)
      ? source.maxContinuousAnswers
      : [],
    maxContinuousLastAskedAt: source.maxContinuousLastAskedAt || null,
    maxContinuousLastAskedCompleted:
      source.maxContinuousLastAskedCompleted ?? null,
  };
}
