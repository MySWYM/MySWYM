/**
 * Rôle de semaine Sheet (tri / OW) — hybride calé sur le jour J.
 *
 * Avec eventDate :
 *   S0 + S-1     → deload (S0 = semaine course, max 2 séances)
 *   S-2 → S-6    → construction (interdit test)
 *   S-7 et avant → cycle ancré sur J : S-7 test, S-8 deload,
 *                  puis 7 construction → test → deload (S-16, S-17…)
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
 * Position dans le cycle 9 semaines (0..8) — sans date de course.
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

/**
 * Cycle loin de J, ancré sur l’index S (semaines avant course).
 * S-7 → test, S-8 → deload, S-9…S-15 → construction, S-16 → test…
 * @param {number} sIndex — weeksBeforeRaceWeek (≥ 7)
 * @returns {{ phase: SheetPhase, cyclePosition: number }}
 */
export function farCycleFromRaceSIndex(sIndex) {
  const s = Math.max(7, Math.floor(Number(sIndex) || 7));
  const pos = (s - 7) % 9;
  /** @type {SheetPhase} */
  let phase = "construction";
  if (pos === 0) phase = "test";
  else if (pos === 1) phase = "deload";
  return { phase, cyclePosition: pos };
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
 * weekIndex = semaines depuis début de plan (cycle sans date uniquement).
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
  /** @type {number|null} */
  let cycleWeekIndex = null;
  /** @type {number|null} */
  let cyclePosition = null;

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
      // S-7+ : cycle ancré sur J (S-7 = test)
      band = "far";
      const far = farCycleFromRaceSIndex(sIndex);
      phase = far.phase;
      cyclePosition = far.cyclePosition;
      cycleWeekIndex = sIndex;
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
    cycleWeekIndex = wi;
    cyclePosition = farCyclePosition(wi);
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
    cycleWeekIndex,
    cyclePosition,
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

/** Libellé court pour la timeline accueil. */
export function sheetPhaseShortLabel(role) {
  if (role?.isRaceWeek) return "Course";
  if (role?.phase === "test") return "Test";
  if (role?.phase === "deload") return "Allégée";
  return "Travail";
}

/**
 * Timeline de semaines pour l’accueil (tri / event Sheet).
 * Avec date de course : de la semaine courante jusqu’à S0 (piste complète).
 * `maxWeeks` optionnel = plafond d’affichage (tests / UI contrainte).
 * Sans date : un cycle 9 semaines à partir de `weekIndex`.
 *
 * @param {{
 *   eventDate?: string|Date|null,
 *   planStart?: string|Date|null,
 *   weekIndex?: number|null,
 *   now?: Date,
 *   maxWeeks?: number|null,
 * }} opts
 */
export function buildEventWeekTimeline(opts = {}) {
  const now = opts.now instanceof Date ? opts.now : new Date();
  const maxWeeks =
    opts.maxWeeks == null || opts.maxWeeks === Infinity
      ? null
      : Math.max(1, Math.min(52, Math.floor(Number(opts.maxWeeks))));
  const baseWeekIndex = Math.max(0, Math.floor(Number(opts.weekIndex) || 0));
  const sNow = weeksBeforeRaceWeek(opts.eventDate, now);

  /** @type {Array<{
   *   key: string,
   *   sIndex: number|null,
   *   sLabel: string,
   *   phase: SheetPhase,
   *   shortLabel: string,
   *   label: string,
   *   isCurrent: boolean,
   *   isRaceWeek: boolean,
   * }>} */
  const weeks = [];

  if (sNow != null && sNow >= 0) {
    const fullCount = sNow + 1;
    const count = maxWeeks == null ? fullCount : Math.min(fullCount, maxWeeks);
    for (let i = 0; i < count; i++) {
      const s = sNow - i;
      const fakeNow = new Date(now.getTime() + i * MS_WEEK);
      const role = resolveSheetWeekRole({
        eventDate: opts.eventDate,
        planStart: opts.planStart,
        weekIndex: baseWeekIndex + i,
        now: fakeNow,
      });
      weeks.push({
        key: `s-${s}`,
        sIndex: s,
        sLabel: s === 0 ? "S0" : `S-${s}`,
        phase: role.phase,
        shortLabel: sheetPhaseShortLabel(role),
        label: role.label,
        isCurrent: i === 0,
        isRaceWeek: !!role.isRaceWeek,
      });
    }
    return {
      mode: "to_race",
      weeks,
      truncated: maxWeeks != null && fullCount > maxWeeks,
      weeksBeforeRace: sNow,
      eventDate: opts.eventDate || null,
      current: weeks[0] || null,
    };
  }

  // Pas de date (ou après course) : afficher un cycle 9 semaines
  for (let i = 0; i < 9; i++) {
    const wi = baseWeekIndex + i;
    const role = resolveSheetWeekRole({
      eventDate: null,
      planStart: opts.planStart,
      weekIndex: wi,
      now,
    });
    weeks.push({
      key: `c-${wi}`,
      sIndex: null,
      sLabel: `Sem. ${i + 1}`,
      phase: role.phase,
      shortLabel: sheetPhaseShortLabel(role),
      label: role.label,
      isCurrent: i === 0,
      isRaceWeek: false,
    });
  }
  return {
    mode: sNow != null && sNow < 0 ? "after_race" : "cycle",
    weeks,
    truncated: false,
    weeksBeforeRace: sNow,
    eventDate: opts.eventDate || null,
    current: weeks[0] || null,
  };
}
