/**
 * Identité éditeur MySWYM.
 * Ne jamais inventer SIRET / adresse / médiateur : laisser les placeholders.
 */
export const LEGAL_ENTITY = {
  tradeName: "MySWYM",
  publisher: "Arthur Noel",
  legalForm: "Entrepreneur individuel",
  email: "contact@myswym.app",
  supportEmail: "support@myswym.app",
  dpoEmail: "contact@myswym.app",
  site: "https://myswym.app",
  // Obligatoires LCEN / information précontractuelle — à compléter par le propriétaire :
  siret: "", // [À FOURNIR]
  address: "", // [À FOURNIR]
  rcsCity: "", // [À FOURNIR] ex. « RCS Paris » si applicable, sinon laissez vide pour EI
  vatNumber: "", // [À FOURNIR] ou « Non assujetti à la TVA »
  capital: "", // N/A pour EI — laisser vide
  // Médiation de la consommation (obligatoire pour B2C) :
  mediatorName: "", // [À FOURNIR]
  mediatorWebsite: "", // [À FOURNIR]
  mediatorAddress: "", // [À FOURNIR]
  lastUpdated: "11 août 2026",
};

export function legalMissingFields() {
  const missing = [];
  if (!LEGAL_ENTITY.siret) missing.push("SIRET (ou SIREN)");
  if (!LEGAL_ENTITY.address) missing.push("Adresse du siège / établissement");
  if (!LEGAL_ENTITY.vatNumber) missing.push("Statut TVA / n° TVA");
  if (!LEGAL_ENTITY.mediatorName || !LEGAL_ENTITY.mediatorWebsite) {
    missing.push("Médiateur de la consommation (nom + site)");
  }
  return missing;
}
