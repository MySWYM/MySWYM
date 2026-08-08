/**
 * Affichage utilisateur vs sets internes (progressive / descending / pyramid).
 * Volume affiché = volume des sets (jamais inventé).
 */

/**
 * @param {object[]} sets — sets d'un même format collapsable
 * @param {string} format
 * @returns {string[]|null} lignes UX compactes, ou null si pas de collapse sûr
 */
export function collapseSetsToDisplayLinesExact(sets = [], format) {
  if (!sets.length || !["progressive", "descending", "pyramid"].includes(format)) {
    return null;
  }
  if (sets.length < 3) return null;

  const vol = sets.reduce((a, s) => a + (Number(s.reps) || 0) * (Number(s.distancePerRep) || 0), 0);
  if (vol < 100) return null;
  const label = sets[0]?.label || "crawl";
  const restSec = sets.find((s) => s.restSec > 0)?.restSec || 20;

  if (format === "progressive") {
    const unit = sets[0]?.distancePerRep || 100;
    if (vol % unit !== 0) return null;
    const reps = vol / unit;
    return [
      `-${reps} × ${unit}m ${label} progressif — du facile vers le soutenu — repos ${restSec}s`,
    ];
  }

  if (format === "descending") {
    const unit = 100;
    if (vol % unit !== 0) {
      // Descending mixte : afficher total + intention, volume exact via un seul libellé
      return [
        `-${vol}m ${label} descendant — du long vers le court — repos ${restSec}s`,
      ];
    }
    const reps = vol / unit;
    return [
      `-${reps} × ${unit}m ${label} descendant — du long vers le court — repos ${restSec}s`,
    ];
  }

  if (format === "pyramid") {
    const peak = Math.max(...sets.map((s) => s.distancePerRep || 0));
    // Pas de second « Xm » (calcDetailsDistance compterait en double)
    return [
      `-${vol}m pyramide ${label} — montée / descente (sommet ${peak}) — repos variable`,
    ];
  }

  return null;
}

/** Alias historique */
export function collapseSetsToDisplayLines(sets, format) {
  return collapseSetsToDisplayLinesExact(sets, format);
}
