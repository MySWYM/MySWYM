import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { G } from "../theme/palette.js";
import { FONT } from "../theme/brand.js";
import { ACCESS_STATUS } from "../lib/access.js";
import { PRICING } from "../lib/pricing.js";
import { isNativeApp } from "../lib/native-platform.js";
import { intlLocaleFor, normalizeAppLanguage } from "../i18n/languages.js";

function formatTrialEndDate(iso, locale) {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toLocaleDateString(locale, { day: "numeric", month: "short" });
}

/**
 * Accueil, décompte essai 7 jours + CTA conversion.
 * Copy bénéfice → urgence douce → prix ancré.
 */
export default function TrialCountdownBanner({
  accessState = null,
  onUpgrade,
}) {
  const { t, i18n } = useTranslation("app");
  if (!accessState || accessState.status !== ACCESS_STATUS.TRIAL) return null;
  const days = Number(accessState.trialDaysLeft) || 0;
  if (days <= 0) return null;

  const urgent = days <= 2;
  const hot = days <= 3;
  const locale = intlLocaleFor(normalizeAppLanguage(i18n.language));
  const endLabel = formatTrialEndDate(accessState.trialEndsAt, locale);
  const native = isNativeApp();
  const priceFrom = native ? "" : PRICING.monthlyCommit.label;

  let title;
  let body;
  let cta;
  if (days === 1) {
    title = t("trial.lastDay");
    body = t("trial.lastDayBody");
    cta = t("trial.keepPlan");
  } else if (days === 2) {
    title = t("trial.twoDays");
    body = native
      ? (endLabel ? t("trial.twoDaysPlain", { date: endLabel }) : t("trial.swimPlain"))
      : (endLabel
        ? t("trial.twoDaysBody", { date: endLabel, price: priceFrom })
        : t("trial.twoDaysSoon", { price: priceFrom }));
    cta = t("trial.continue");
  } else if (days === 3) {
    title = t("trial.threeDays");
    body = endLabel
      ? t("trial.threeDaysBody", { date: endLabel })
      : t("trial.threeDaysPlain");
    cta = t("trial.stay");
  } else {
    title = days >= 6
      ? t("trial.justStarted")
      : t("trial.daysLeft", { count: days });
    body = native
      ? (endLabel ? t("trial.enjoyPlain", { date: endLabel }) : t("trial.swimPlain"))
      : (endLabel
        ? t("trial.enjoyUntil", { date: endLabel, price: priceFrom })
        : t("trial.swimThen", { price: priceFrom }));
    cta = t("trial.seeOffers");
  }

  return (
    <div
      className={`ms-trial-banner${urgent ? " is-urgent" : ""}${hot ? " is-hot" : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className="ms-trial-banner-row">
        <div className="ms-trial-banner-icon" aria-hidden>
          <Clock size={18} color={urgent ? G.coral : G.blue} />
        </div>
        <div className="ms-trial-banner-copy">
          <strong>{title}</strong>
          <span>{body}</span>
        </div>
      </div>
      <button
        type="button"
        className="ms-trial-banner-cta"
        onClick={() => onUpgrade?.(urgent ? "trial_countdown_urgent" : hot ? "trial_countdown_hot" : "trial_countdown")}
        style={{ fontFamily: FONT }}
      >
        {cta}
      </button>
    </div>
  );
}
