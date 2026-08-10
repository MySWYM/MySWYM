/**
 * Affichage utilisateur vs sets internes (progressive / descending / pyramid).
 * Volume affiché = volume des sets (jamais inventé).
 * Pyramide : paliers + repos + rôle (montée/sommet/descente) — jamais un seul « Xm pyramide » opaque.
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
    // Uniquement les paliers (pyramidStep) — le fill hors pyramide est géré à part.
    const steps = sets.filter((s) => (s.meta?.pyramidStep ?? s.pyramidStep) != null);
    const use = steps.length >= 3 ? steps : sets;
    const stepDists = use.map((s) => Number(s.distancePerRep) || 0).filter((d) => d > 0);
    if (stepDists.length < 3) return null;
    const pyrVol = stepDists.reduce((a, b) => a + b, 0);
    const peak = Math.max(...stepDists);
    const rests = use.map((s) => Number(s.restSec) || 0).filter((r) => r > 0);
    const restMin = rests.length ? Math.min(...rests) : 20;
    const restMax = rests.length ? Math.max(...rests) : restMin;
    const restTxt =
      restMin === restMax ? `repos ${restMin}s` : `repos ${restMin}–${restMax}s`;
    // Chaîne sans « m » sur chaque palier → calcDetailsDistance ne double-compte pas.
    const chain = stepDists.join(" → ");
    // Header : volume = somme exacte des paliers. Pas de 2e « Xm » (sommet).
    return [
      // Pas de 2e « Xm » (sommet) — calcDetailsDistance compterait en double.
      `-${pyrVol}m pyramide ${label} : ${chain} (sommet ${peak}) — ${restTxt}`,
    ];
  }

  return null;
}

/** Alias historique */
export function collapseSetsToDisplayLines(sets, format) {
  return collapseSetsToDisplayLinesExact(sets, format);
}
