/**
 * Rôle de semaine Sheet (tri / OW) — hybride calé sur le jour J.
 *
 * Avec eventDate :
 *   S0 + S-1     → deload (S0 = semaine course, max 2 séances)
 *   S-2 → S-5    → construction (interdit test / allégée cycle)
 *   S-6 et avant → cycle ancré sur J (longueur 8) :
 *                  S-6 = allégée ; S-7 = test (depuis J : allégée puis test) ;
 *                  6 travail entre les couples
 *                  (ex. S-15 test → S-14 allégée → S-13…S-8 travail → S-7 test → S-6 allégée)
 *
 * Début de plan : les 2 premières semaines (weekIndex 0..1) forcent
 * construction sur le cycle loin / sans date — pas de test ni allégée « cycle ».
 * S0 / S-1 course restent prioritaires (taper intact).
 *
 * Sans eventDate : même cycle 6 travail → allégée → test (+ garde 2 sem.).
 *
 * Notation : S0 = semaine du jour J ; S-1 = semaine d’avant ; J-1 = veille (jours).
 */

const MS_WEEK = 7 * 24 * 60 * 60 * 1000;

/** Semaines de travail dans le cycle loin de J (avant le couple allégée+test). */
export const FAR_WORK_WEEKS = 6;
/** Cycle loin : 6 travail + 1 allégée + 1 test. */
export const FAR_CYCLE_LEN = FAR_WORK_WEEKS + 2;
/** Pas de test / allégée « cycle » avant N semaines de plan. */
export const EARLY_PLAN_MIN_CONSTRUCTION = 2;
/** Plus près de J autorisé pour test / allégée cycle (S-6). */
export const FAR_CYCLE_MIN_S_INDEX = 6;

/** @typedef {'construction'|'test'|'deload'} SheetPhase */
/** @typedef {'S0'|'S-1'|'S-2_S-5'|'far'|'no_date'} SheetWeekBand */

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
 * Position dans le cycle 8 semaines — sans date de course.
 * 0–5 construction · 6 deload · 7 test (allégée puis test)
 * @param {number} weekIndex — semaines depuis ancre (≥0)
 */
export function farCyclePhase(weekIndex) {
  const w = Math.max(0, Math.floor(Number(weekIndex) || 0));
  const pos = w % FAR_CYCLE_LEN;
  if (pos < FAR_WORK_WEEKS) return "construction";
  if (pos === FAR_WORK_WEEKS) return "deload";
  return "test";
}

/**
 * @param {number} weekIndex
 */
export function farCyclePosition(weekIndex) {
  return Math.max(0, Math.floor(Number(weekIndex) || 0)) % FAR_CYCLE_LEN;
}

/**
 * Cycle loin de J, ancré sur l’index S (semaines avant course).
 * S-6 → allégée ; S-7 → test ; depuis J : allégée puis test → 6 travail → …
 * (S-14 allégée, S-15 test, S-13…S-8 travail, S-6 allégée, S-7 test).
 * @param {number} sIndex — weeksBeforeRaceWeek (≥ 6)
 * @returns {{ phase: SheetPhase, cyclePosition: number }}
 */
export function farCycleFromRaceSIndex(sIndex) {
  const s = Math.max(FAR_CYCLE_MIN_S_INDEX, Math.floor(Number(sIndex) || FAR_CYCLE_MIN_S_INDEX));
  const pos = (s - FAR_CYCLE_MIN_S_INDEX) % FAR_CYCLE_LEN;
  /** @type {SheetPhase} */
  let phase = "construction";
  if (pos === 0) phase = "deload";
  else if (pos === 1) phase = "test";
  return { phase, cyclePosition: pos };
}

/**
 * Garde début de plan : pas de test / allégée cycle avant 2 semaines.
 * Ne s’applique pas aux bandes course S0 / S-1.
 * @param {SheetPhase} phase
 * @param {number|null|undefined} planWeekIndex
 * @param {{ skip?: boolean }} [opts]
 * @returns {SheetPhase}
 */
export function applyEarlyPlanConstructionGuard(phase, planWeekIndex, opts = {}) {
  if (opts.skip) return phase;
  if (phase !== "test" && phase !== "deload") return phase;
  if (planWeekIndex == null || !Number.isFinite(Number(planWeekIndex))) return phase;
  const wi = Math.floor(Number(planWeekIndex));
  if (wi < EARLY_PLAN_MIN_CONSTRUCTION) return "construction";
  return phase;
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
 * weekIndex = semaines depuis début de plan (garde 2 sem. + cycle sans date).
 */
export function resolveSheetWeekRole(opts = {}) {
  const now = opts.now instanceof Date ? opts.now : new Date();
  const sIndex = weeksBeforeRaceWeek(opts.eventDate, now);
  const planWeekIndex = resolveCycleWeekIndex(opts, now);

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
  let earlyGuardApplied = false;

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
    } else if (sIndex >= 2 && sIndex <= 5) {
      band = "S-2_S-5";
      phase = "construction";
      label = "Construction (approche course)";
    } else {
      // S-6+ : cycle ancré sur J (S-6 = allégée, S-7 = test)
      band = "far";
      const far = farCycleFromRaceSIndex(sIndex);
      const guarded = applyEarlyPlanConstructionGuard(far.phase, planWeekIndex);
      earlyGuardApplied = guarded !== far.phase;
      phase = guarded;
      cyclePosition = far.cyclePosition;
      cycleWeekIndex = sIndex;
      label =
        phase === "test"
          ? "Semaine test"
          : phase === "deload"
            ? "Semaine allégée"
            : earlyGuardApplied
              ? "Construction (début de plan)"
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
    const raw = farCyclePhase(planWeekIndex);
    const guarded = applyEarlyPlanConstructionGuard(raw, planWeekIndex);
    earlyGuardApplied = guarded !== raw;
    phase = guarded;
    cycleWeekIndex = planWeekIndex;
    cyclePosition = farCyclePosition(planWeekIndex);
    label =
      phase === "test"
        ? "Semaine test"
        : phase === "deload"
          ? "Semaine allégée"
          : earlyGuardApplied
            ? "Construction (début de plan)"
            : "Construction";
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
    earlyGuardApplied,
    planWeekIndex,
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
 * Sans date : un cycle FAR_CYCLE_LEN semaines à partir de `weekIndex`.
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

  // Pas de date (ou après course) : afficher un cycle FAR_CYCLE_LEN semaines
  for (let i = 0; i < FAR_CYCLE_LEN; i++) {
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
