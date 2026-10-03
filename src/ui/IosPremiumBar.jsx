import { Clock, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { playUiSound } from "../lib/ui-sounds.js";
import { resolveTrialCountdown } from "../lib/access.js";

/** CTA Premium iOS, même barre sur Analyse / Profil / Accueil. */
export default function IosPremiumBar({
  onUpgrade,
  source = "ios_bar",
  accessState = null,
  hasSessionAccess = false,
}) {
  const { t } = useTranslation("app");
  const trial = resolveTrialCountdown(accessState, { hasSessionAccess });
  const label = trial
    ? t("trial.chip", { day: trial.dayIndex })
    : t("premium.cta");
  const sub = trial ? t("trial.chipDays", { count: trial.daysLeft }) : null;

  return (
    <button
      type="button"
      className={`ms-pill-cta ms-pill-cta-gold ios-premium-bar${trial ? " is-trial" : ""}`}
      onClick={() => {
        playUiSound("tap");
        onUpgrade?.(trial ? `${source}_trial` : source);
      }}
      aria-label={
        trial
          ? t("trial.chipAria", { day: trial.dayIndex, count: trial.daysLeft })
          : t("premium.cta")
      }
    >
      {trial ? (
        <Clock size={16} strokeWidth={2.25} aria-hidden />
      ) : (
        <Star size={16} strokeWidth={2.25} aria-hidden />
      )}
      <span className="ios-premium-bar-label">
        <span>{label}</span>
        {sub ? <span className="ios-premium-bar-sub">{sub}</span> : null}
      </span>
    </button>
  );
}
