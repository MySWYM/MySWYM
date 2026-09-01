/**
 * Données de santé (art. 9 RGPD), listes fermées + microcopy consentement.
 * Ne jamais proposer de champ texte libre pour diagnostic / traitement.
 *
 * `injuries[]` = collecte profil (plusieurs zones + gravité).
 * Le programme (Sheet / composeur) ne lit que `injuryStatus` via le miroir.
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

const INJURY_ZONE_IDS = new Set(INJURY_ZONES.map((z) => z.id));
const INJURY_SEVERITY_IDS = new Set(INJURY_SEVERITIES.map((s) => s.id));
const SEVERITY_RANK = Object.freeze({ mild: 1, moderate: 2, significant: 3 });
export const DEFAULT_INJURY_SEVERITY = "mild";

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

export function normalizeInjuries(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const out = [];
  for (const raw of list) {
    const zone = raw?.zone || raw?.id;
    if (!INJURY_ZONE_IDS.has(zone) || seen.has(zone)) continue;
    const severity = INJURY_SEVERITY_IDS.has(raw?.severity)
      ? raw.severity
      : DEFAULT_INJURY_SEVERITY;
    seen.add(zone);
    out.push({ zone, severity });
  }
  return out;
}

/** Miroir colonnes historiques : statut + zone / gravité les plus limitantes. */
export function injuryMirrorsFromList(injuries) {
  const list = normalizeInjuries(injuries);
  if (!list.length) {
    return {
      injuryStatus: "aucune",
      injuryZone: null,
      injurySeverity: null,
      injuries: [],
    };
  }
  let primary = list[0];
  for (const item of list) {
    if ((SEVERITY_RANK[item.severity] || 0) > (SEVERITY_RANK[primary.severity] || 0)) {
      primary = item;
    }
  }
  return {
    injuryStatus: "oui",
    injuryZone: primary.zone,
    injurySeverity: primary.severity,
    injuries: list,
  };
}

/**
 * Normalise un profil (complet ou partiel).
 * N’invente pas `injuries: []` si le patch n’a ni liste, ni zone, ni « aucune ».
 */
export function resolveInjuryFields(profile = {}) {
  if (!profile || typeof profile !== "object") return {};

  if (profile.injuryStatus === "aucune") {
    return {
      injuryStatus: "aucune",
      injuryZone: null,
      injurySeverity: null,
      injuries: [],
    };
  }

  if (Array.isArray(profile.injuries)) {
    const list = normalizeInjuries(profile.injuries);
    if (list.length) return injuryMirrorsFromList(list);
    if (profile.injuryStatus === "oui") {
      return {
        injuryStatus: "oui",
        injuryZone: null,
        injurySeverity: null,
        injuries: [],
      };
    }
    return {};
  }

  if (profile.injuryZone != null && profile.injuryZone !== "") {
    if (!INJURY_ZONE_IDS.has(profile.injuryZone)) {
      return {
        injuryStatus: "oui",
        injuryZone: null,
        injurySeverity: INJURY_SEVERITY_IDS.has(profile.injurySeverity)
          ? profile.injurySeverity
          : null,
        injuries: [],
      };
    }
    return injuryMirrorsFromList([
      { zone: profile.injuryZone, severity: profile.injurySeverity },
    ]);
  }

  return {};
}

export function toggleInjuryZone(injuries, zoneId) {
  const list = normalizeInjuries(injuries);
  if (!INJURY_ZONE_IDS.has(zoneId)) {
    return { ...injuryMirrorsFromList(list), injuryStatus: "oui", injuries: list };
  }
  const exists = list.some((i) => i.zone === zoneId);
  const next = exists
    ? list.filter((i) => i.zone !== zoneId)
    : [...list, { zone: zoneId, severity: DEFAULT_INJURY_SEVERITY }];
  return {
    ...injuryMirrorsFromList(next),
    injuryStatus: "oui",
    injuries: next,
  };
}

export function setInjurySeverity(injuries, zoneId, severity) {
  if (!INJURY_ZONE_IDS.has(zoneId) || !INJURY_SEVERITY_IDS.has(severity)) {
    return { ...injuryMirrorsFromList(injuries), injuryStatus: "oui" };
  }
  const list = normalizeInjuries(injuries);
  const next = list.some((i) => i.zone === zoneId)
    ? list.map((i) => (i.zone === zoneId ? { ...i, severity } : i))
    : [...list, { zone: zoneId, severity }];
  return { ...injuryMirrorsFromList(next), injuryStatus: "oui" };
}

export function clearInjuries() {
  return {
    injuryStatus: "aucune",
    injuryZone: null,
    injurySeverity: null,
    injuries: [],
    healthDeclaration: false,
  };
}

export function injuriesForUi(profile = {}) {
  const resolved = resolveInjuryFields(profile);
  if (Array.isArray(resolved.injuries)) return resolved.injuries;
  if (Array.isArray(profile.injuries)) return normalizeInjuries(profile.injuries);
  return [];
}

export function formatInjurySummary(profile = {}) {
  const resolved = { ...profile, ...resolveInjuryFields(profile) };
  if (resolved.injuryStatus !== "oui") return "Aucune";
  const list = normalizeInjuries(resolved.injuries);
  if (!list.length) {
    const zone = INJURY_ZONES.find((z) => z.id === resolved.injuryZone)?.label || "Zone non précisée";
    const sev = INJURY_SEVERITIES.find((s) => s.id === resolved.injurySeverity)?.label || "";
    return sev ? `${zone} : ${sev.toLowerCase()}` : zone;
  }
  return list
    .map((i) => {
      const zone = INJURY_ZONES.find((z) => z.id === i.zone)?.label || i.zone;
      const sev = INJURY_SEVERITIES.find((s) => s.id === i.severity)?.label || "";
      return sev ? `${zone} : ${sev.toLowerCase()}` : zone;
    })
    .join(" · ");
}

export function hasHealthConsent(profileOrUser) {
  if (!profileOrUser) return false;
  if (profileOrUser.healthConsent === true) return true;
  if (profileOrUser.user_metadata?.health_consent === true) return true;
  if (profileOrUser.extra?.healthConsent === true) return true;
  return false;
}
