/** Microcopy juridique réutilisable (UX), cohérent avec CGU/CGV. */
import { withLocalePrefix } from "../i18n/locale-path.js";

export const LEGAL_LINKS = {
  cgu: "/cgu",
  cgv: "/cgv",
  privacy: "/politique-confidentialite",
  cookies: "/politique-cookies",
  mentions: "/mentions-legales",
};

/** URL publique selon la langue (`/cgu` → `/fr/cgu` ou `/terms`). */
export function legalHref(key, locale = "fr") {
  const path = LEGAL_LINKS[key];
  return path ? withLocalePrefix(path, locale) : "/";
}

export const SIGNUP_AGE_LABEL =
  "Je confirme avoir 18 ans révolus.";

export const SIGNUP_TERMS_LABEL_PREFIX =
  "J’accepte les";

export const CARDLESS_TRIAL_NOTE =
  "7 jours d’essai offerts à la création du compte, sans carte. Ensuite tes séances se mettent en pause jusqu’à l’abonnement.";

export const CHECKOUT_RENEWAL_NOTICE =
  "Abonnement à reconduction tacite. Tu peux résilier à tout moment via « Gérer mon abonnement » (portail Stripe) ; l’accès reste actif jusqu’à la fin de la période déjà payée.";

export const CHECKOUT_WITHDRAWAL_LABEL =
  "Je demande l’accès immédiat à Premium et reconnais que, dès l’ouverture de l’accès, je perds mon droit de rétractation de 14 jours pour le service numérique pleinement exécuté (art. L221-28 du Code de la consommation), dans la mesure permise par la loi.";

export const CHECKOUT_CGV_LABEL_PREFIX =
  "J’accepte les";

export const SPORT_SAFETY_SHORT =
  "Entraîne-toi selon ta forme. Arrête en cas de symptôme inquiétant et consulte un professionnel de santé si besoin. Eau libre : ne nage jamais seul.";

export const ACCOUNT_DELETE_WARNING =
  "La suppression est définitive : profil, plans et données associées seront effacés dans la mesure techniquement possible. Résilie d’abord ton abonnement Stripe si tu veux éviter un prochain prélèvement.";

/** @deprecated use HEALTH_CONSENT_* from health-data.js */
export const INJURY_HEALTH_NOTICE =
  "Ces informations peuvent concerner ta santé. Elles servent uniquement à adapter l’intensité des séances proposées. MySWYM n’est pas un professionnel de santé et ne pose aucun diagnostic. En cas de doute, consulte un médecin.";

/** @deprecated */
export const INJURY_CONSENT_LABEL =
  "J’accepte que MySWYM traite ces informations (blessure / gêne / douleur) pour adapter mon plan. Je peux laisser « Aucune blessure » ou ne pas préciser.";
