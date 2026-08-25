/**
 * Projection « ma semaine » — lecture seule pour se projeter (charge / types).
 */

function parseMeters(distance) {
  const n = parseInt(String(distance || "").replace(/\s/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

function isResolved(session) {
  return !!(session?.completed || session?.skipped);
}

/**
 * @returns {{
 *   label: string,
 *   focus: string|null,
 *   sessions: Array<{ title: string, type: string|null, distance: string, meters: number, status: 'done'|'todo'|'upcoming'|'skipped', isCurrent?: boolean }>,
 *   doneCount: number,
 *   totalCount: number,
 *   totalMeters: number,
 *   doneMeters: number,
 * }}
 */
export function buildWeekProjection(plan, profile = {}) {
  if (!plan?.weeks?.length) return null;

  if (plan.isSessionLoop) {
    const perWeek = Math.max(1, Math.min(7, Number(profile.sessionsPerWeek) || 3));
    const current = plan.weeks[0]?.sessions?.[0] || null;
    const history = Array.isArray(plan.history) ? plan.history : [];
    // Séances terminées « cette semaine » : on prend les (perWeek - 1) dernières + la courante
    const recentDone = history.filter((s) => s?.completed).slice(-(perWeek - 1));
    const slots = [];

    recentDone.forEach((s) => {
      slots.push({
        title: s.title || "Séance",
        type: s.type || null,
        distance: s.distance || "",
        meters: parseMeters(s.distance),
        status: "done",
        isCurrent: false,
      });
    });

    if (current) {
      const status = current.skipped
        ? "skipped"
        : current.completed
          ? "done"
          : "todo";
      slots.push({
        title: current.title || "Séance du jour",
        type: current.type || null,
        distance: current.distance || "",
        meters: parseMeters(current.distance),
        status,
        isCurrent: true,
      });
    }

    while (slots.length < perWeek) {
      slots.push({
        title: "À venir",
        type: null,
        distance: "",
        meters: 0,
        status: "upcoming",
        isCurrent: false,
      });
    }

    const weekSlots = slots.slice(0, perWeek);
    const doneCount = weekSlots.filter((s) => s.status === "done").length;
    const totalMeters = weekSlots.reduce((a, s) => a + (s.meters || 0), 0);
    const doneMeters = weekSlots.filter((s) => s.status === "done").reduce((a, s) => a + (s.meters || 0), 0);

    return {
      label: "Cette semaine",
      focus: null,
      sessions: weekSlots,
      doneCount,
      totalCount: perWeek,
      totalMeters,
      doneMeters,
      mode: "loop",
    };
  }

  const weeks = plan.weeks;
  let idx = weeks.findIndex((w) => !(w.sessions || []).every(isResolved));
  if (idx < 0) idx = Math.max(0, weeks.length - 1);
  const week = weeks[idx];
  if (!week) return null;

  const sessions = (week.sessions || []).map((s, i) => {
    let status = "todo";
    if (s.skipped) status = "skipped";
    else if (s.completed) status = "done";
    const firstOpen = (week.sessions || []).findIndex((x) => !isResolved(x));
    return {
      title: s.title || `Séance ${i + 1}`,
      type: s.type || null,
      distance: s.distance || "",
      meters: parseMeters(s.distance),
      status,
      isCurrent: i === firstOpen,
    };
  });

  const doneCount = sessions.filter((s) => s.status === "done" || s.status === "skipped").length;
  const totalMeters = sessions.reduce((a, s) => a + (s.meters || 0), 0);
  const doneMeters = sessions
    .filter((s) => s.status === "done")
    .reduce((a, s) => a + (s.meters || 0), 0);

  return {
    label: `Semaine ${week.number || idx + 1}`,
    focus: week.focus || week.phase || null,
    sessions,
    doneCount,
    totalCount: sessions.length,
    totalMeters,
    doneMeters,
    mode: "plan",
    weekIndex: idx,
  };
}
