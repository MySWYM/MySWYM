/**
 * Helpers communs pour les parcours école (chaîne d’étapes).
 */

/**
 * @param {Array<Omit<import("./anc-track.js").SchoolStep, "id"|"prereq"> & { id?: string }>} defs
 * @param {string} prefix ex. "PAP"
 */
export function chainSteps(prefix, defs) {
  return defs.map((def, i) => {
    const id = def.id || `${prefix}${i + 1}`;
    const prevId = i === 0 ? null : defs[i - 1].id || `${prefix}${i}`;
    return {
      id,
      prereq: def.prereq === undefined ? prevId : def.prereq,
      title: def.title,
      objectif: def.objectif,
      cue: def.cue,
      bonSi: def.bonSi,
      pasEncore: def.pasEncore,
      avoid: def.avoid,
      dosage: def.dosage,
    };
  });
}

export function stepById(steps, id) {
  return steps.find((s) => s.id === id) || null;
}

export function stepIndexOf(steps, id) {
  return steps.findIndex((s) => s.id === id);
}

export function nextIdIn(steps, id) {
  const i = stepIndexOf(steps, id);
  if (i < 0 || i >= steps.length - 1) return null;
  return steps[i + 1].id;
}

export function prevIdIn(steps, id) {
  const i = stepIndexOf(steps, id);
  if (i <= 0) return null;
  return steps[i - 1].id;
}
