/**
 * Séparation nom technique interne ↔ formulation utilisateur (Découverte).
 * Ne supprime pas l'info technique : elle reste en métadonnée / mapping.
 */

/** @type {Record<string, { internal: string, user: string }>} */
export const USER_FACING_TERMS = Object.freeze({
  godille: {
    internal: "godille",
    user: "petits mouvements des mains dans l'eau",
  },
  godilles: {
    internal: "godilles",
    user: "petits mouvements des mains dans l'eau",
  },
  RAC: {
    internal: "RAC",
    user: "récup",
  },
  sculling: {
    internal: "sculling",
    user: "petits mouvements des mains dans l'eau",
  },
});

/**
 * Remplace le jargon affiché pour un niveau débutant, sans toucher au moteur interne.
 */
export function humanizeUserFacingText(text, { level = "decouverte" } = {}) {
  if (!text || (level !== "decouverte" && level !== "découverte" && level !== "beginner")) {
    return text;
  }
  let out = String(text);
  out = out.replace(/\bgodilles?\b/gi, USER_FACING_TERMS.godilles.user);
  out = out.replace(/\bsculling\b/gi, USER_FACING_TERMS.sculling.user);
  out = out.replace(/\(RAC\)/gi, "(récup)");
  out = out.replace(/\bRAC\b/g, "récup");
  return out;
}

/** Extrait les termes internes encore présents (pour tests / debug). */
export function findInternalJargon(text) {
  const found = [];
  if (/\bgodilles?\b/i.test(text)) found.push("godille");
  if (/\bsculling\b/i.test(text)) found.push("sculling");
  if (/\bRAC\b/.test(text)) found.push("RAC");
  return found;
}
