import { ACCESS_STATUS } from "./access.js";
import { intlLocaleFor, normalizeAppLanguage } from "../i18n/languages.js";

/** Essai 7 jours encore ouvert. Le bouton « S’abonner » ne s’affiche pas ici. */
export function isLiveTrial(access, isPremium) {
  return Boolean(isPremium) && access?.status === ACCESS_STATUS.TRIAL;
}

export function canStopTrial(access, isPremium) {
  return isLiveTrial(access, isPremium) && access?.cancelAtPeriodEnd !== true;
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
