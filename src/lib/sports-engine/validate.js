/**
 * Validation séance (§34) avant proposition.
 */

/**
 * @param {object} session, { details, distance, type, intensity, equipmentRequired? }
 * @param {object} sportProfile
 * @param {object} ctx, { volumeTarget, maxIntensityZone, durationMin }
 */
export function validateSession(session, sportProfile, ctx = {}) {
  const errors = [];
  const warnings = [];

  const dist = parseInt(String(session.distance || "").replace(/\D/g, ""), 10) || 0;
  const target = ctx.volumeTarget || 0;
  if (target > 0 && dist > 0) {
    const ratio = dist / target;
    if (ratio < 0.7 || ratio > 1.35) {
      warnings.push(`volume hors fourchette (${dist}m vs cible ${target}m)`);
    }
  }

  if (sportProfile.level === "decouverte") {
    const text = (session.details || []).join(" ");
    if (/Z3|Z4|CSS|seuil|VO2|hypoxie|apnée/i.test(text) && !/facile|souple/i.test(text)) {
      errors.push("intensité incompatible Découverte");
    }
    if (/rattrapé|catch-up|roulis|virage|petit chien/i.test(text) && !/grand chien|flèche/i.test(text)) {
      // soft: warning only, generator may still emit
      warnings.push("éducatif avancé pour Découverte");
    }
  }

  if (Array.isArray(sportProfile.equipment) && session.equipmentRequired?.length) {
    for (const eq of session.equipmentRequired) {
      if (!sportProfile.equipment.includes(eq)) {
        errors.push(`matériel manquant: ${eq}`);
      }
    }
  }

  if (sportProfile.hasPainConstraint) {
    const text = (session.details || []).join(" ");
    if (/Z3|Z4|meilleur effort|best effort|sprint/i.test(text)) {
      errors.push("intensité trop élevée avec contrainte douleur/blessure");
    }
  }

  if (ctx.maxIntensityZone === "Z2") {
    const text = (session.details || []).join(" ");
    if (/Z4|Z3 @/i.test(text)) warnings.push("zone au-dessus du plafond");
  }

  const duration = session.duration || Math.round(dist / 35);
  if (ctx.durationMin > 0 && duration > ctx.durationMin * 1.4) {
    warnings.push("durée estimée longue vs disponible");
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

/** Plafond zone selon niveau / douleur */
export function maxZoneForProfile(sportProfile) {
  if (sportProfile.hasPainConstraint) return "Z2";
  if (sportProfile.level === "decouverte") return "Z2";
  if (sportProfile.level === "regulier") return "Z3";
  return "Z4";
}
