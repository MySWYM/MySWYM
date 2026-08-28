/**
 * Rôle de semaine Sheet (tri / OW) — hybride calé sur le jour J.
 *
 * Avec eventDate :
 *   S0 + S-1     → deload (S0 = semaine course, max 2 séances)
 *   S-2 → S-6    → construction (interdit test)
 *   S-7 et avant → cycle 7 construction → 1 test → 1 deload
 *
 * Sans eventDate : cycle seul (ancre = planStart ou index de semaines).
 *
 * Notation : S0 = semaine du jour J ; S-1 = semaine d’avant ; J-1 = veille (jours).
 */

const MS_WEEK = 7 * 24 * 60 * 60 * 1000;

/** @typedef {'construction'|'test'|'deload'} SheetPhase */
/** @typedef {'S0'|'S-1'|'S-2_S-6'|'far'|'no_date'} SheetWeekBand */

/**
 * Lundi 00:00 local de la semaine contenant `date`.
 * @param {Date|string|number} date
 */
export function startOfWeekMonday(date) {
  const d = date instanceof Date ? new Date(date.getTime()) : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 dim … 6 sam
  const offset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + offset);
  return d;
}

/**
 * Index S : 0 = semaine du jour J, 1 = S-1, 2 = S-2…
 * null si pas de date valide. Négatif = après la course.
 * @param {string|Date|null|undefined} eventDate
 * @param {Date} [now]
 */
export function weeksBeforeRaceWeek(eventDate, now = new Date()) {
  if (!eventDate) return null;
  const raceMon = startOfWeekMonday(eventDate);
  const nowMon = startOfWeekMonday(now);
  if (!raceMon || !nowMon) return null;
  return Math.round((raceMon.getTime() - nowMon.getTime()) / MS_WEEK);
}

/**
 * Position dans le cycle 9 semaines (0..8).
 * 0–6 construction · 7 test · 8 deload
 * @param {number} weekIndex — semaines depuis ancre (≥0)
 */
export function farCyclePhase(weekIndex) {
  const w = Math.max(0, Math.floor(Number(weekIndex) || 0));
  const pos = w % 9;
  if (pos <= 6) return "construction";
  if (pos === 7) return "test";
  return "deload";
}

/**
 * @param {number} weekIndex
 */
export function farCyclePosition(weekIndex) {
  return Math.max(0, Math.floor(Number(weekIndex) || 0)) % 9;
}

const BANNERS = Object.freeze({
  construction: null,
  test: "Semaine test — chronomètre 50 m, 100 m et 400 m et renseigne tes temps dans le profil.",
  deload: "Semaine allégée — volume bas, récupération.",
  race_week: "Semaine de course — 2 séances max, charge légère.",
});

/**
 * Résout le rôle Sheet de la semaine courante.
 *
 * @param {{
 *   eventDate?: string|Date|null,
 *   planStart?: string|Date|null,
 *   weekIndex?: number|null,
 *   now?: Date,
 * }} opts
 * weekIndex = semaines depuis début de plan (si fourni, prioritaire pour le cycle loin de J / sans date).
 */
export function resolveSheetWeekRole(opts = {}) {
  const now = opts.now instanceof Date ? opts.now : new Date();
  const sIndex = weeksBeforeRaceWeek(opts.eventDate, now);

  /** @type {SheetWeekBand} */
  let band = "no_date";
  /** @type {SheetPhase} */
  let phase = "construction";
  let label = "Construction";
  let maxSessions = null;
  let isRaceWeek = false;

  if (sIndex != null && sIndex >= 0) {
    if (sIndex === 0) {
      band = "S0";
      phase = "deload";
      label = "Semaine de course";
      maxSessions = 2;
      isRaceWeek = true;
    } else if (sIndex === 1) {
      band = "S-1";
      phase = "deload";
      label = "Semaine allégée (S-1)";
    } else if (sIndex >= 2 && sIndex <= 6) {
      band = "S-2_S-6";
      phase = "construction";
      label = "Construction (approche course)";
    } else {
      // S-7+ : cycle loin de J
      band = "far";
      const wi = resolveCycleWeekIndex(opts, now);
      phase = farCyclePhase(wi);
      label =
        phase === "test"
          ? "Semaine test"
          : phase === "deload"
            ? "Semaine allégée"
            : "Construction";
    }
  } else if (sIndex != null && sIndex < 0) {
    // Après course : construction douce
    band = "no_date";
    phase = "construction";
    label = "Après course";
  } else {
    // Pas de date → cycle seul
    band = "no_date";
    const wi = resolveCycleWeekIndex(opts, now);
    phase = farCyclePhase(wi);
    label =
      phase === "test" ? "Semaine test" : phase === "deload" ? "Semaine allégée" : "Construction";
  }

  const bannerKey = isRaceWeek ? "race_week" : phase;
  return {
    phase,
    band,
    label,
    banner: BANNERS[bannerKey] || null,
    weeksBeforeRace: sIndex,
    maxSessions,
    isRaceWeek,
    cycleWeekIndex: band === "far" || band === "no_date" ? resolveCycleWeekIndex(opts, now) : null,
    cyclePosition: band === "far" || band === "no_date" ? farCyclePosition(resolveCycleWeekIndex(opts, now)) : null,
  };
}

/**
 * @param {{ planStart?: string|Date|null, weekIndex?: number|null }} opts
 * @param {Date} now
 */
function resolveCycleWeekIndex(opts, now) {
  if (opts.weekIndex != null && Number.isFinite(Number(opts.weekIndex))) {
    return Math.max(0, Math.floor(Number(opts.weekIndex)));
  }
  if (opts.planStart) {
    const start = startOfWeekMonday(opts.planStart);
    const cur = startOfWeekMonday(now);
    if (start && cur) {
      return Math.max(0, Math.round((cur.getTime() - start.getTime()) / MS_WEEK));
    }
  }
  return 0;
}

/**
 * Plafond de séances / semaine (null = garder le profil).
 * @param {ReturnType<typeof resolveSheetWeekRole>} role
 * @param {number} sessionsPerWeek
 */
export function applySheetWeekSessionCap(role, sessionsPerWeek) {
  const spw = Math.max(1, Math.min(5, Number(sessionsPerWeek) || 3));
  if (role?.maxSessions == null) return spw;
  return Math.min(spw, role.maxSessions);
}

/**
 * Remplace l’ancien phaseFromLoopCursor pour les familles event Sheet.
 * @deprecated prefer resolveSheetWeekRole
 */
export function phaseFromSheetWeekRole(role) {
  return role?.phase || "construction";
}
