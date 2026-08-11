/**
 * Données de santé (art. 9 RGPD) — listes fermées + microcopy consentement.
 * Ne jamais proposer de champ texte libre pour diagnostic / traitement.
 */

export const INJURY_ZONES = Object.freeze([
  { id: "shoulder", label: "Épaule" },
  { id: "elbow", label: "Coude" },
  { id: "wrist", label: "Poignet / main" },
  { id: "neck", label: "Cou" },
  { id: "back", label: "Dos / lombaires" },
  { id: "hip", label: "Hanche" },
  { id: "knee", label: "Genou" },
  { id: "ankle", label: "Cheville / pied" },
  { id: "other", label: "Autre zone" },
]);

export const INJURY_SEVERITIES = Object.freeze([
  { id: "mild", label: "Légère", desc: "Gêne occasionnelle, nage possible" },
  { id: "moderate", label: "Modérée", desc: "Douleur fréquente, intensité à limiter" },
  { id: "significant", label: "Importante", desc: "Activité fortement limitée" },
]);

export const HEALTH_CONSENT_TITLE = "Données de santé (optionnel)";

export const HEALTH_CONSENT_BODY =
  "Pour adapter tes séances et limiter le risque de blessure, MySWYM peut traiter des données de santé au sens du RGPD : " +
  "fréquence cardiaque par séance (ex. via Strava) et historique de blessures / gênes que tu déclares. " +
  "Base légale : ton consentement explicite (art. 9.2.a RGPD). C’est facultatif : tu peux refuser et utiliser l’app sans ces données. " +
  "Tu peux retirer ton consentement à tout moment (Paramètres ou contact@myswym.app). " +
  "Ces données ne sont pas envoyées aux outils d’analytics tiers.";

export const HEALTH_CONSENT_CHECKBOX =
  "J’accepte explicitement que MySWYM traite ma fréquence cardiaque et mes déclarations de blessure / gêne pour adapter mes séances et prévenir le risque de blessure. Je peux refuser.";

export const HEALTH_DECLARATION_LABEL =
  "Je certifie sur l’honneur l’exactitude des informations de santé que je fournis.";

export const MEDICAL_WARNING_SHORT =
  "Les plans générés sont fournis à titre indicatif et ne remplacent pas l’avis d’un professionnel de santé. Vérifie ton aptitude physique (certificat médical si nécessaire) avant de suivre le programme.";

export function formatInjurySummary({ injuryStatus, injuryZone, injurySeverity } = {}) {
  if (injuryStatus !== "oui") return "Aucune";
  const zone = INJURY_ZONES.find((z) => z.id === injuryZone)?.label || "Zone non précisée";
  const sev = INJURY_SEVERITIES.find((s) => s.id === injurySeverity)?.label || "";
  return sev ? `${zone} · ${sev}` : zone;
}

export function hasHealthConsent(profileOrUser) {
  if (!profileOrUser) return false;
  if (profileOrUser.healthConsent === true) return true;
  if (profileOrUser.user_metadata?.health_consent === true) return true;
  if (profileOrUser.extra?.healthConsent === true) return true;
  return false;
}
