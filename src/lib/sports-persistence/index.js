/**
 * Étape K — Couche de persistance sportive.
 * Entoure le Sports Engine : faits Supabase ↔ vue `_engineHistory`.
 * NE CALCULE PAS de phase / volume / strategy / séance.
 */

/** Distance d'entraînement (jamais la course). Aligné week-orchestration. */
export function trainingDistanceOfSession(session) {
  if (!session) return 0;
  if (session.isRaceDay || session.type === "RACE" || session.sessionIntent === "race") return 0;
  if (session.isRestDay || session.type === "REST" || session.sessionIntent === "repos") return 0;
  if (Number.isFinite(Number(session.trainingDistance))) return Math.max(0, Number(session.trainingDistance));
  if (Number.isFinite(Number(session.volumeFromSets))) return Math.max(0, Number(session.volumeFromSets));
  return parseInt(String(session.distance || "").replace(/\D/g, ""), 10) || 0;
}

/**
 * Politique charge (Étape I + K) :
 * - `volumeAdj` = multiplicateur persistant cumulé (sur le plan blob)
 * - `weekly_adaptations.volume_mul` = fait historique de la décision
 * - Orchestration utilise UNIQUEMENT volumeAdj (pas de 2e ×)
 */
export const VOLUME_ADJ_POLICY = Object.freeze({
  persistentLoadField: "volumeAdj",
  adaptationHistoryTable: "weekly_adaptations",
  doubleApplyForbidden: true,
  note: "App cumule volumeAdj *= mul ; orchestration lit volumeAdjLegacy seulement",
});

/** Mappe rating UI → difficulty 4 niveaux + rating SQL rétrocompat. */
export function normalizePersistedDifficulty(rating) {
  const s = String(rating || "").toLowerCase();
  if (s === "too_easy" || s === "trop_facile") return { difficulty: "too_easy", rating: "too_easy" };
  if (s === "easy") return { difficulty: "too_easy", rating: "easy" };
  if (s === "good" || s === "ok" || s === "bien") return { difficulty: "good", rating: "good" };
  if (s === "hard" || s === "difficile") return { difficulty: "hard", rating: "hard" };
  if (s === "too_hard" || s === "trop_difficile") return { difficulty: "too_hard", rating: "too_hard" };
  return { difficulty: s || null, rating: s === "ok" ? "ok" : s || "ok" };
}

/**
 * Reconstruit la vue `_engineHistory` attendue par buildCoachPlanWeeks / prepareWeekContext.
 * Source : faits persistés (+ fallback blob plan pour compat).
 */
export function rebuildEngineHistory({
  plan = null,
  feedbackRows = [],
  adaptations = [],
  capacitySnapshots = [],
  raceResults = [],
  postRace = null,
  sportProfile = null,
} = {}) {
  const blobHist = plan?._engineHistory || {};
  const latestAdapt =
    adaptations[0] ||
    plan?._weeklyAdaptation ||
    blobHist.weeklyAdaptation ||
    null;

  const completedFromPlan = (plan?.weeks || []).reduce(
    (n, w) => n + (w.sessions || []).filter((s) => s.completed).length,
    0,
  );

  const recentFeedback = feedbackRows.slice(0, 8);
  const hardCount = recentFeedback.filter((f) =>
    ["hard", "too_hard"].includes(f.difficulty || f.rating),
  ).length;
  const easyCount = recentFeedback.filter((f) =>
    ["easy", "too_easy"].includes(f.difficulty || f.rating),
  ).length;
  const painProtection =
    !!blobHist.painProtection ||
    recentFeedback.some((f) => f.pain) ||
    latestAdapt?.safety === "pain" ||
    sportProfile?.injury_status === "oui";

  const latestCap = capacitySnapshots[0] || null;
  const dimensions =
    latestCap?.dimensions ||
    plan?._capacityDimensions ||
    blobHist.capacityDimensions ||
    null;

  const unfinishedRecent = recentFeedback.filter((f) => f.completed === false).length;

  return {
    planStartDate: plan?.planStartDate || plan?.startDate || blobHist.planStartDate || null,
    completedSessions: Math.max(completedFromPlan, Number(blobHist.completedSessions) || 0),
    hardStreak: hardCount >= 2 ? 2 : hardCount === 1 ? 1 : Number(blobHist.hardStreak) || 0,
    easyStreak: easyCount >= 1 ? Math.min(3, easyCount) : Number(blobHist.easyStreak) || 0,
    unfinishedRecent: unfinishedRecent || Number(blobHist.unfinishedRecent) || 0,
    weeklyAdaptation: latestAdapt
      ? {
          action: latestAdapt.action,
          primaryLever: latestAdapt.primary_lever || latestAdapt.primaryLever,
          magnitude: latestAdapt.magnitude,
          volumeMul: latestAdapt.volume_mul ?? latestAdapt.volumeMul,
          rationale: latestAdapt.rationale,
          confidence: latestAdapt.confidence,
          safety: latestAdapt.safety,
          devExplain: latestAdapt.dev_explain || latestAdapt.devExplain,
          ...(latestAdapt.payload || {}),
        }
      : null,
    trend: plan?._adaptTrend || blobHist.trend || null,
    painProtection,
    capacityDimensions: dimensions,
    capacityUpdate: latestCap
      ? { dimensions, confidence: latestCap.confidence, reason: latestCap.reason }
      : blobHist.capacityUpdate || null,
    postRaceRecovery: !!(postRace?.status === "active" || blobHist.postRaceRecovery || plan?.postRaceRecovery),
    volumeAdj: plan?.volumeAdj ?? blobHist.volumeAdj ?? 1,
    recentRaceResult: raceResults[0]
      ? {
          distance: raceResults[0].distance,
          stroke: raceResults[0].stroke,
          resultTimeSec: raceResults[0].result_time_sec,
          competitionDate: raceResults[0].competition_date,
          source: raceResults[0].source,
        }
      : blobHist.recentRaceResult || null,
    // Marqueur K : history reconstruite
    _fromSportsFacts: true,
    _factsVersion: 1,
  };
}

/** Profil nageur persistant → row sport_profiles (1:1 user). */
export function sportProfileToRow(userId, profile = {}) {
  const ageNum = profile.age != null && profile.age !== ""
    ? Number(profile.age)
    : null;
  const age = Number.isFinite(ageNum) ? Math.round(ageNum) : null;
  return {
    user_id: userId,
    level: profile.level || null,
    // objective = objectif du cycle courant (miroité pour compat Arthur / lectures)
    objective: profile.goal || profile.objectifV1 || profile.category || null,
    frequency: profile.sessionsPerWeek ?? null,
    session_duration: profile.sessionDuration ?? profile.durationTarget ?? null,
    equipment: Array.isArray(profile.equipment) ? profile.equipment : [],
    pool_length: profile.pool ?? null,
    preferred_stroke: profile.preferredStroke || profile.strokeFocus || null,
    swim_style: profile.swimStyle || null,
    age,
    race_target: profile.raceTarget || null,
    injury_status: profile.injuryStatus || null,
    injury_zone: profile.injuryZone || null,
    injury_severity: profile.injurySeverity || null,
    injury_note: null, // free-text désactivé (minimisation art. 9)
    health_consent: profile.healthConsent === true,
    health_consent_at: profile.healthConsent === true
      ? (profile.healthConsentAt || new Date().toISOString())
      : null,
    pace100: profile.pace100 ?? null,
    readiness_profile: profile.readinessProfile ?? null,
    extra: {
      eventDate: profile.eventDate || null,
      category: profile.category || null,
      trainingFocus: profile.trainingFocus || null,
      age,
      weightKg: profile.weightKg ?? null,
      heightCm: profile.heightCm ?? null,
      swimStyle: profile.swimStyle || null,
      age: profile.age ?? age,
      injuryZone: profile.injuryZone || null,
      injurySeverity: profile.injurySeverity || null,
      healthConsent: profile.healthConsent === true,
      healthConsentAt: profile.healthConsent === true
        ? (profile.healthConsentAt || new Date().toISOString())
        : null,
      healthDeclaration: profile.healthDeclaration === true,
      targetSessionDistance:
        Number(profile.targetSessionDistance) > 0 ? Number(profile.targetSessionDistance) : null,
      trainingWish: typeof profile.trainingWish === "string" ? profile.trainingWish.slice(0, 2000) : "",
      trainingWishMeta:
        profile.trainingWishMeta && typeof profile.trainingWishMeta === "object"
          ? profile.trainingWishMeta
          : null,
      preferredStroke: profile.preferredStroke || null,
    },
    updated_at: new Date().toISOString(),
  };
}

/** Row → champs profil pour le moteur (sans écraser le blob) */
export function rowToSportProfileFields(row) {
  if (!row) return {};
  const extra = row.extra && typeof row.extra === "object" ? row.extra : {};
  const age = row.age ?? (extra.age != null && extra.age !== "" ? Number(extra.age) : null);
  return {
    level: row.level,
    goal: row.objective,
    sessionsPerWeek: row.frequency,
    pool: row.pool_length,
    equipment: row.equipment || [],
    preferredStroke: row.preferred_stroke,
    swimStyle: row.swim_style || extra.swimStyle || null,
    age: Number.isFinite(Number(age)) ? Number(age) : (extra.age ?? null),
    raceTarget: row.race_target,
    injuryStatus: row.injury_status,
    injuryNote: null,
    injuryZone: row.injury_zone || extra.injuryZone || null,
    injurySeverity: row.injury_severity || extra.injurySeverity || null,
    healthConsent: row.health_consent === true || extra.healthConsent === true,
    healthConsentAt: row.health_consent_at || extra.healthConsentAt || null,
    healthDeclaration: extra.healthDeclaration === true,
    pace100: row.pace100,
    readinessProfile: row.readiness_profile ?? null,
    weightKg: extra.weightKg ?? null,
    heightCm: extra.heightCm ?? null,
    category: extra.category ?? null,
    eventDate: extra.eventDate ?? null,
    trainingFocus: extra.trainingFocus ?? null,
  };
}

/** Séance plan → row planned_sessions */
export function sessionToPlannedRow(userId, planId, weekIndex, sessionIndex, session, week = {}) {
  const training = trainingDistanceOfSession(session);
  let status = "planned";
  if (session?.completed) status = "completed";
  else if (session?.skipped === "missed") status = "missed";
  else if (session?.skipped) status = "skipped";

  return {
    user_id: userId,
    plan_id: String(planId),
    week_index: weekIndex,
    session_index: sessionIndex,
    scheduled_date: session?.scheduledDate || null,
    session_type: session?.type || null,
    objective: session?.objectif || week?.focus || null,
    family: session?.family || null,
    intent: session?.sessionIntent || session?.intent || null,
    phase: week?.effectivePhase || week?.phase || session?.phase || null,
    volume: parseInt(String(session?.distance || "").replace(/\D/g, ""), 10) || training || null,
    training_distance: training,
    status,
    session_payload: session || null,
    completed_at: status === "completed" ? session?.completedAt || new Date().toISOString() : null,
    actual_distance: session?.actualDistance ?? null,
    actual_duration: session?.actualDuration ?? null,
    actual_time_sec: session?.actualTimeSec ?? null,
    updated_at: new Date().toISOString(),
  };
}

export function adaptationToRow(userId, planId, weekIndex, weeklyAdaptation, volumeAdjAfter = null) {
  if (!weeklyAdaptation) return null;
  return {
    user_id: userId,
    plan_id: String(planId),
    week_index: weekIndex,
    action: weeklyAdaptation.action || null,
    primary_lever: weeklyAdaptation.primaryLever || weeklyAdaptation.primary_lever || null,
    magnitude: weeklyAdaptation.magnitude || null,
    volume_mul: weeklyAdaptation.volumeMul ?? weeklyAdaptation.volume_mul ?? null,
    rationale: weeklyAdaptation.rationale || null,
    confidence: weeklyAdaptation.confidence || null,
    safety: weeklyAdaptation.safety || null,
    dev_explain: weeklyAdaptation.devExplain || weeklyAdaptation.dev_explain || null,
    payload: {
      ...weeklyAdaptation,
      volumeAdjAfter,
      persistedAt: new Date().toISOString(),
    },
  };
}

/**
 * Client Supabase — opérations faits (fire-and-forget friendly).
 * Toutes les écritures filtrent user_id = auth user (RLS).
 */
export function createSportsPersistence(supabase) {
  if (!supabase) {
    return {
      enabled: false,
      upsertSportProfile: async () => ({ ok: false, reason: "no_supabase" }),
      upsertPlannedSessionsFromPlan: async () => ({ ok: false }),
      markSessionStatus: async () => ({ ok: false }),
      insertSessionFeedback: async () => ({ ok: false }),
      insertWeeklyAdaptation: async () => ({ ok: false }),
      insertCapacitySnapshot: async () => ({ ok: false }),
      upsertRaceTarget: async () => ({ ok: false }),
      insertRaceResult: async () => ({ ok: false }),
      upsertPostRaceRecovery: async () => ({ ok: false }),
      loadSportsFacts: async () => ({ ok: false, facts: emptyFacts() }),
      attachEngineHistoryToProfile: (profile, plan) => ({
        ...profile,
        volumeAdj: plan?.volumeAdj ?? profile?.volumeAdj ?? 1,
        _engineHistory: rebuildEngineHistory({ plan }),
        _weeklyAdaptation: plan?._weeklyAdaptation || null,
      }),
    };
  }

  return {
    enabled: true,

    async upsertSportProfile(userId, profile) {
      const row = sportProfileToRow(userId, profile);
      const { error } = await supabase.from("sport_profiles").upsert(row, { onConflict: "user_id" });
      return { ok: !error, error };
    },

    async upsertPlannedSessionsFromPlan(userId, planId, plan) {
      const rows = [];
      (plan?.weeks || []).forEach((week, wi) => {
        (week.sessions || []).forEach((session, si) => {
          rows.push(sessionToPlannedRow(userId, planId, wi, si, session, week));
        });
      });
      if (!rows.length) return { ok: true, count: 0 };
      // Upsert par lots
      const { error } = await supabase.from("planned_sessions").upsert(rows, {
        onConflict: "user_id,plan_id,week_index,session_index",
      });
      return { ok: !error, error, count: rows.length };
    },

    async markSessionStatus(userId, { planId, weekIndex, sessionIndex, status, actual = {} }) {
      const patch = {
        status,
        updated_at: new Date().toISOString(),
        ...(status === "completed" ? { completed_at: new Date().toISOString() } : {}),
        ...(actual.actual_distance != null ? { actual_distance: actual.actual_distance } : {}),
        ...(actual.actual_duration != null ? { actual_duration: actual.actual_duration } : {}),
        ...(actual.actual_time_sec != null ? { actual_time_sec: actual.actual_time_sec } : {}),
      };
      const { data, error } = await supabase
        .from("planned_sessions")
        .update(patch)
        .eq("user_id", userId)
        .eq("plan_id", String(planId))
        .eq("week_index", weekIndex)
        .eq("session_index", sessionIndex)
        .select("id")
        .maybeSingle();
      return { ok: !error, error, id: data?.id || null };
    },

    async insertSessionFeedback(userId, payload) {
      const norm = normalizePersistedDifficulty(payload.difficulty ?? payload.rating);
      const base = {
        user_id: userId,
        plan_id: payload.planId != null ? String(payload.planId) : null,
        week_number: payload.weekIndex ?? payload.week_number ?? null,
        session_index: payload.sessionIndex ?? payload.session_index ?? null,
        session_type: payload.sessionType || null,
        session_title: payload.sessionTitle || null,
        tags: Array.isArray(payload.tags) ? payload.tags : [],
        comment: payload.comment || null,
        created_at: new Date().toISOString(),
      };
      // Essai K (difficulty / pain / 4 niveaux) puis fallback schéma legacy easy|ok|hard
      const full = {
        ...base,
        rating: norm.rating || "ok",
        difficulty: norm.difficulty,
        pain: !!payload.pain,
        completed: payload.completed ?? true,
        notes: payload.notes || payload.comment || null,
        planned_session_id: payload.plannedSessionId || null,
      };
      let { error } = await supabase.from("session_feedback").insert(full);
      if (error) {
        const legacyRating =
          norm.difficulty === "too_easy"
            ? "easy"
            : norm.difficulty === "too_hard"
              ? "hard"
              : norm.difficulty === "good"
                ? "ok"
                : norm.rating === "too_easy"
                  ? "easy"
                  : norm.rating === "too_hard"
                    ? "hard"
                    : norm.rating === "good"
                      ? "ok"
                      : norm.rating || "ok";
        const legacy = { ...base, rating: legacyRating };
        ({ error } = await supabase.from("session_feedback").insert(legacy));
      }
      return { ok: !error, error };
    },

    async insertWeeklyAdaptation(userId, planId, weekIndex, weeklyAdaptation, volumeAdjAfter) {
      const row = adaptationToRow(userId, planId, weekIndex, weeklyAdaptation, volumeAdjAfter);
      if (!row) return { ok: true, skipped: true };
      const { error } = await supabase.from("weekly_adaptations").insert(row);
      return { ok: !error, error };
    },

    async insertCapacitySnapshot(userId, snap = {}) {
      const row = {
        user_id: userId,
        source_session_id: snap.sourceSessionId || null,
        plan_id: snap.planId != null ? String(snap.planId) : null,
        volume_tolerance: snap.volumeTolerance ?? snap.dimensions?.volume ?? null,
        intensity_tolerance: snap.intensityTolerance ?? snap.dimensions?.intensity ?? null,
        recovery_tolerance: snap.recoveryTolerance ?? snap.dimensions?.recovery ?? null,
        continuous_capacity: snap.continuousCapacity ?? snap.dimensions?.continuous ?? null,
        technical_confidence: snap.technicalConfidence ?? snap.dimensions?.technical ?? null,
        confidence: snap.confidence ?? null,
        reason: snap.reason || null,
        dimensions: snap.dimensions || {},
      };
      const { error } = await supabase.from("capacity_snapshots").insert(row);
      return { ok: !error, error };
    },

    async upsertRaceTarget(userId, target) {
      if (!target?.distance) return { ok: false, reason: "no_distance" };
      // Désactive les anciennes actives
      await supabase
        .from("race_targets")
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("active", true);
      const row = {
        user_id: userId,
        distance: Number(target.distance),
        stroke: target.stroke || null,
        target_time_sec: target.targetTimeSec ?? target.target_time_sec ?? null,
        competition_date: target.competitionDate || target.competition_date || null,
        source: target.source || "user",
        active: true,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase.from("race_targets").insert(row).select("id").maybeSingle();
      return { ok: !error, error, id: data?.id || null };
    },

    async insertRaceResult(userId, result) {
      if (!result?.resultTimeSec && !result?.result_time_sec) return { ok: false, reason: "no_time" };
      const row = {
        user_id: userId,
        race_target_id: result.raceTargetId || result.race_target_id || null,
        distance: Number(result.distance),
        stroke: result.stroke || null,
        result_time_sec: Number(result.resultTimeSec ?? result.result_time_sec),
        competition_date: result.competitionDate || result.competition_date || null,
        source: result.source || "user",
      };
      const { data, error } = await supabase.from("race_results").insert(row).select("id").maybeSingle();
      return { ok: !error, error, id: data?.id || null };
    },

    async upsertPostRaceRecovery(userId, recovery) {
      const row = {
        user_id: userId,
        race_result_id: recovery.raceResultId || null,
        status: recovery.status || "active",
        start_date: recovery.startDate || null,
        end_date: recovery.endDate || null,
        reason: recovery.reason || null,
      };
      const { error } = await supabase.from("post_race_recovery").insert(row);
      return { ok: !error, error };
    },

    async loadSportsFacts(userId, planId = null) {
      const facts = emptyFacts();
      const pid = planId != null ? String(planId) : null;

      const [prof, fb, adap, caps, races, results, post] = await Promise.all([
        supabase.from("sport_profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase
          .from("session_feedback")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(40),
        supabase
          .from("weekly_adaptations")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("capacity_snapshots")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase.from("race_targets").select("*").eq("user_id", userId).eq("active", true).maybeSingle(),
        supabase
          .from("race_results")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("post_race_recovery")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      facts.sportProfile = prof.data || null;
      facts.feedbackRows = (fb.data || []).filter((r) => !pid || r.plan_id === pid || r.plan_id == null);
      facts.adaptations = (adap.data || []).filter((r) => !pid || r.plan_id === pid);
      facts.capacitySnapshots = caps.data || [];
      facts.raceTarget = races.data || null;
      facts.raceResults = results.data || [];
      facts.postRace = post.data || null;
      facts.ok = !prof.error && !fb.error && !adap.error;

      // Tables absentes (migration pas encore appliquée) → soft fail
      if (prof.error && /relation .* does not exist|Could not find/i.test(prof.error.message || "")) {
        return { ok: false, reason: "migration_pending", facts: emptyFacts() };
      }
      return { ok: facts.ok, facts, errors: { prof: prof.error, fb: fb.error, adap: adap.error } };
    },

    attachEngineHistoryToProfile(profile, plan, facts = null) {
      const hist = rebuildEngineHistory({
        plan,
        feedbackRows: facts?.feedbackRows || [],
        adaptations: facts?.adaptations || [],
        capacitySnapshots: facts?.capacitySnapshots || [],
        raceResults: facts?.raceResults || [],
        postRace: facts?.postRace || null,
        sportProfile: facts?.sportProfile || null,
      });
      const fromRow = rowToSportProfileFields(facts?.sportProfile);
      const raceFromTable = facts?.raceTarget
        ? {
            distance: facts.raceTarget.distance,
            stroke: facts.raceTarget.stroke,
            targetTimeSec: facts.raceTarget.target_time_sec,
            competitionDate: facts.raceTarget.competition_date,
            source: facts.raceTarget.source,
          }
        : null;

      return {
        ...fromRow,
        ...profile,
        // Matériel : blob prioritaire si répondu ; sinon sport_profiles (reconnexion)
        equipment: Array.isArray(profile?.equipment)
          ? profile.equipment
          : (Array.isArray(fromRow.equipment) ? fromRow.equipment : profile?.equipment ?? null),
        volumeAdj: plan?.volumeAdj ?? profile?.volumeAdj ?? hist.volumeAdj ?? 1,
        raceTarget: profile?.raceTarget || raceFromTable || fromRow.raceTarget || null,
        _engineHistory: hist,
        _weeklyAdaptation: hist.weeklyAdaptation || plan?._weeklyAdaptation || null,
      };
    },
  };
}

function emptyFacts() {
  return {
    sportProfile: null,
    feedbackRows: [],
    adaptations: [],
    capacitySnapshots: [],
    raceTarget: null,
    raceResults: [],
    postRace: null,
    ok: false,
  };
}
