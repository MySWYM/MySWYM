import { BADGE_DEFS, isBadgeEarned } from "./plan-stats.js";

export const LADDER_GROUPS = new Set(["km", "sessions", "streak"]);

export function ladderBadgeDefs() {
  return BADGE_DEFS.filter((def) => LADDER_GROUPS.has(def.group));
}

function ladderValue(def, stats) {
  if (def.group === "km") return Number(stats.totalMeters) || 0;
  if (def.group === "sessions") return Number(stats.totalSessions) || 0;
  return Number(stats.currentStreak) || 0;
}

function previousTarget(def) {
  const rungs = ladderBadgeDefs()
    .filter((row) => row.group === def.group)
    .map((row) => row.target)
    .sort((a, b) => a - b);
  const idx = rungs.indexOf(def.target);
  return idx > 0 ? rungs[idx - 1] : 0;
}

function homeValue(def, value, target) {
  if (def.group === "km") {
    const cur = target >= 1000
      ? (value / 1000).toLocaleString("fr-FR", { maximumFractionDigits: value >= 10000 ? 0 : 1 })
      : String(value);
    const tgt = target >= 1000
      ? (target / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 0 })
      : String(target);
    return `${cur} / ${tgt} km`;
  }
  return `${value} / ${target}`;
}

/** Badge échelle le plus proche d'être débloqué (série = courante). */
export function nextLadderBadge(stats) {
  const rows = [];
  for (const def of ladderBadgeDefs()) {
    if (isBadgeEarned(def, stats)) continue;
    const value = ladderValue(def, stats);
    const target = def.target;
    const prev = previousTarget(def);
    const span = target - prev || 1;
    const ratio = Math.min(1, Math.max(0, (value - prev) / span));
    rows.push({
      def,
      value,
      target,
      previous: prev,
      ratio,
      barLabel: homeValue(def, value, target),
      homeValue: homeValue(def, value, target),
    });
  }
  if (!rows.length) return null;
  rows.sort((a, b) => b.ratio - a.ratio || a.target - b.target);
  return rows[0];
}

export const BADGE_FILTERS = [
  { id: "all", label: "Tous" },
  { id: "sessions", label: "Assiduité" },
  { id: "km", label: "Distance" },
  { id: "streak", label: "Série" },
];

export function ladderSummary(stats) {
  const defs = ladderBadgeDefs();
  const earned = defs.filter((def) => isBadgeEarned(def, stats)).length;
  return { earned, total: defs.length };
}

export function filterLadderDefs(filterId) {
  const defs = ladderBadgeDefs();
  if (!filterId || filterId === "all") return defs;
  return defs.filter((def) => def.group === filterId);
}

/** Progrès affiché sur une carte (compteur → cible). */
export function ladderCardProgress(def, stats) {
  const earned = isBadgeEarned(def, stats);
  const raw = ladderValue(def, stats);
  const value = Math.min(raw, def.target);
  return {
    earned,
    value,
    target: def.target,
    fracLabel: homeValue(def, value, def.target),
  };
}
