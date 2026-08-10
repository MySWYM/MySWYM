/**
 * Affichage utilisateur vs sets internes.
 * Pyramide / progressive / descending : pas de monolithe opaque —
 * on laisse les lignes individuelles (nageables) quand le format est complexe.
 */

/**
 * @param {object[]} sets
 * @param {string} format
 * @returns {string[]|null}
 */
export function collapseSetsToDisplayLinesExact(sets = [], format) {
  // Pyramide : jamais collapsée — le nageur doit voir chaque palier.
  if (format === "pyramid") return null;

  if (!sets.length || !["progressive", "descending"].includes(format)) {
    return null;
  }
  if (sets.length < 3) return null;

  const vol = sets.reduce((a, s) => a + (Number(s.reps) || 0) * (Number(s.distancePerRep) || 0), 0);
  if (vol < 100) return null;
  const label = sets[0]?.label || "crawl";
  const restSec = sets.find((s) => s.restSec > 0)?.restSec || 20;

  // Progressive / descending → série classique lisible (pas de jargon « progressif »)
  if (format === "progressive" || format === "descending") {
    const unit = sets[0]?.distancePerRep || (format === "descending" ? 100 : 50);
    if (vol % unit === 0) {
      const reps = vol / unit;
      return [`-${reps} × ${unit}m ${label} — repos ${restSec}s`];
    }
    return [`-${vol}m ${label} — repos ${restSec}s`];
  }

  return null;
}

/** Alias historique */
export function collapseSetsToDisplayLines(sets, format) {
  return collapseSetsToDisplayLinesExact(sets, format);
}
