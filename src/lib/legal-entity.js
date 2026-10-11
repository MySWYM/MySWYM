/**
 * Identité éditeur ForSwim / A.Natation.
 * Médiateur : laisser "[MÉDIATEUR À CONFIRMER]" jusqu’à inscription.
 */
import {
  BRAND_CONTACT_EMAIL,
  BRAND_NAME,
  BRAND_SITE_ORIGIN,
  BRAND_SUPPORT_EMAIL,
} from "./brand.js";

export const LEGAL_ENTITY = {
  tradeName: BRAND_NAME,
  commercialName: "A.Natation",
  publisher: "Arthur Noël",
  legalForm: "Entrepreneur individuel",
  email: BRAND_CONTACT_EMAIL,
  supportEmail: BRAND_SUPPORT_EMAIL,
  dpoEmail: BRAND_CONTACT_EMAIL,
  site: BRAND_SITE_ORIGIN,
  siret: "941 900 052 00015",
  address: "21 Rue du Cachon, 55000 Fains-Véel, France",
  apeCode: "4791A",
  vatNumber: "TVA non applicable, article 293 B du CGI (franchise en base)",
  capital: "",
  // Médiation, à remplacer une fois le médiateur choisi :
  mediatorName: "[MÉDIATEUR À CONFIRMER]",
  mediatorWebsite: "",
  mediatorAddress: "",
  subprocessors: [
    { name: "Supabase", role: "Authentification, base de données, stockage", dpa: "https://supabase.com/legal/dpa" },
    { name: "Stripe", role: "Paiement et portail abonnement", dpa: "https://stripe.com/legal/dpa" },
    { name: "Vercel", role: "Hébergement et diffusion du front", dpa: "https://vercel.com/legal/dpa" },
  ],
  lastUpdated: "11 octobre 2026",
};

export function legalMissingFields() {
  const missing = [];
  if (!LEGAL_ENTITY.mediatorName || LEGAL_ENTITY.mediatorName.includes("À CONFIRMER")) {
    missing.push("Médiateur de la consommation");
  }
  return missing;
}
