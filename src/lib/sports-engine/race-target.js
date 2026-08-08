/**
 * RaceTarget — ce que le nageur veut atteindre.
 * Ne jamais inventer une cible : uniquement sources explicites.
 */

/** @typedef {'user'|'recent_best'|'validated_test'|'t100_css'|'coach'} RaceTargetSource */

/**
 * @typedef {object} RaceTarget
 * @property {number} distance — mètres (50|100|200|400|…)
 * @property {string} stroke — crawl|dos|brasse|papillon|4n
 * @property {number} targetTimeSec
 * @property {string|null} [competitionDate]
 * @property {RaceTargetSource} source
 * @property {string} [id]
 */

/**
 * Normalise un objet cible s'il est valide ; sinon null.
 * @param {object|null|undefined} raw
 * @returns {RaceTarget|null}
 */
export function normalizeRaceTarget(raw) {
  if (!raw || typeof raw !== "object") return null;
  const distance = Number(raw.distance);
  const targetTimeSec = Number(raw.targetTimeSec ?? raw.targetTime ?? raw.timeSec);
  if (!Number.isFinite(distance) || distance < 25) return null;
  if (!Number.isFinite(targetTimeSec) || targetTimeSec <= 0) return null;
  const stroke = String(raw.stroke || raw.nage || "crawl").toLowerCase();
  const source = raw.source || "user";
  return {
    distance: Math.round(distance),
    stroke: stroke === "nl" || stroke === "freestyle" ? "crawl" : stroke,
    targetTimeSec: Math.round(targetTimeSec * 10) / 10,
    competitionDate: raw.competitionDate || raw.date || null,
    source,
    id: raw.id || null,
  };
}

/**
 * Résout RaceTarget depuis profil / contexte.
 * Sources acceptées uniquement (pas d'invention) :
 * - profile.raceTarget / ctx.raceTarget
 * - profile.raceDistance + profile.raceTargetTimeSec
 * - recent validated test marked as target (opts.validatedTestAsTarget)
 *
 * @param {object} profile
 * @param {object} [ctx]
 * @returns {RaceTarget|null}
 */
export function resolveRaceTarget(profile = {}, ctx = {}) {
  const fromCtx = normalizeRaceTarget(ctx.raceTarget);
  if (fromCtx) return fromCtx;

  const fromProfile = normalizeRaceTarget(profile.raceTarget);
  if (fromProfile) return fromProfile;

  // Champs plats
  if (profile.raceDistance && (profile.raceTargetTimeSec || profile.raceTargetTime)) {
    const flat = normalizeRaceTarget({
      distance: profile.raceDistance,
      targetTimeSec: profile.raceTargetTimeSec || profile.raceTargetTime,
      stroke: profile.raceStroke || profile.strokeFocus || "crawl",
      competitionDate: profile.competitionDate || null,
      source: "user",
    });
    if (flat) return flat;
  }

  // Test validé explicitement promu en cible
  if (ctx.validatedTestAsTarget) {
    const t = normalizeRaceTarget({
      ...ctx.validatedTestAsTarget,
      source: ctx.validatedTestAsTarget.source || "validated_test",
    });
    if (t) return t;
  }

  return null;
}

/**
 * Pace cible en sec / 100 m (pour comparaisons).
 * @param {RaceTarget} target
 */
export function raceTargetPacePer100(target) {
  if (!target?.distance || !target?.targetTimeSec) return null;
  return (target.targetTimeSec / target.distance) * 100;
}

export function formatRaceTime(sec) {
  if (!Number.isFinite(sec)) return "—";
  const s = Math.round(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}:${String(r).padStart(2, "0")}` : `${r}s`;
}
