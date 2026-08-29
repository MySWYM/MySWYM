/**
 * Affichage utilisateur vs sets internes.
 * Pyramide / progressive / descending : pas de monolithe opaque , 
 * on laisse les lignes individuelles (nageables) quand le format est complexe.
 */

/**
 * @param {object[]} sets
 * @param {string} format
 * @returns {string[]|null}
 */
export function collapseSetsToDisplayLinesExact(sets = [], format) {
  // Pyramide : jamais collapsée, le nageur doit voir chaque palier.
  if (format === "pyramid") return null;

  if (!sets.length || !["progressive", "descending"].includes(format)) {
    return null;
  }
  if (sets.length < 3) return null;

  const vol = sets.reduce((a, s) => a + (Number(s.reps) || 0) * (Number(s.distancePerRep) || 0), 0);
  if (vol < 100) return null;
  const label = sets[0]?.label || "crawl";
  const restSec = sets.find((s) => s.restSec > 0)?.restSec || 20;

  // Progressive / descending → série classique lisible (conserver cue utile, pas le jargon format)
  if (format === "progressive" || format === "descending") {
    const unit = sets[0]?.distancePerRep || (format === "descending" ? 100 : 50);
    const rawCue = sets.find((s) => s.cue)?.cue || "";
    const cue = String(rawCue)
      .replace(/progressif|descendant|du long vers le court|du facile vers le soutenu|facile vers le soutenu|long vers le court/gi, "")
      .replace(/\s*[—\-]\s*$/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    const cuePart = cue ? ` ${cue}  - ` : "";
    if (vol % unit === 0) {
      const reps = vol / unit;
      return [`-${reps} × ${unit}m ${label}  - ${cuePart} repos ${restSec}s`];
    }
    return [`-${vol}m ${label}  - ${cuePart} repos ${restSec}s`];
  }

  return null;
}

/** Alias historique */
export function collapseSetsToDisplayLines(sets, format) {
  return collapseSetsToDisplayLinesExact(sets, format);
}
