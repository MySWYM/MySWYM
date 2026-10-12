import { ACCESS_STATUS } from "./access.js";
import { intlLocaleFor, normalizeAppLanguage } from "../i18n/languages.js";

/** Essai 7 jours encore ouvert. Le bouton « S’abonner » ne s’affiche pas ici. */
export function isLiveTrial(access, isPremium) {
  return Boolean(isPremium) && access?.status === ACCESS_STATUS.TRIAL;
}

/** Vrai si le compte est dans un essai vivant (accès premium, pas encore payé). */
export function isLiveTrialAccess(accessState) {
  return accessState?.status === ACCESS_STATUS.TRIAL && accessState?.hasPremiumAccess === true;
}

export function canStopTrial(access, isPremium) {
  return isLiveTrial(access, isPremium) && access?.cancelAtPeriodEnd !== true;
}

/** Boutons du bloc Abonnement. L'abonnement payé passe avant l'essai. */
export function subscriptionPanelMode(access, isPremium) {
  if (access?.canManageSubscription) return "manage";
  const premium = Boolean(isPremium);
  if (premium && access?.status === ACCESS_STATUS.ACTIVE) return "manage";
  if (premium && access?.status === ACCESS_STATUS.CANCELED) {
    const endMs = Date.parse(access?.subscriptionEndsAt || "");
    if (Number.isFinite(endMs) && endMs > Date.now()) return "manage";
  }
  if (canStopTrial(access, isPremium)) return "stop_trial";
  if (isLiveTrial(access, isPremium)) return "trial_stopped";
  return "subscribe";
}

/** Où mène « Arrêter l'essai ». Sans fournisseur, le portail Stripe. */
export function stopTrialTarget(access, { nativeIos = false } = {}) {
  if (access?.billingProvider === "apple") {
    return nativeIos ? "apple_settings" : "apple_toast";
  }
  return "stripe_portal";
}

export function formatTrialChargeDate(iso, language) {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  const locale = intlLocaleFor(normalizeAppLanguage(language));
  return new Date(ms).toLocaleDateString(locale, { day: "numeric", month: "long" });
}

/** Phrase calme sous Abonnement. Null hors essai. */
export function trialSubscriptionHint(t, access, isPremium, language) {
  if (!isLiveTrial(access, isPremium)) return null;
  if (access?.cancelAtPeriodEnd) return t("settings.trialStopped");
  const date = formatTrialChargeDate(access?.trialEndsAt, language);
  return date
    ? t("settings.trialCharge", { date })
    : t("settings.trialChargePlain");
}
