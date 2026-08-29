import { Clock } from "lucide-react";
import { G } from "../theme/palette.js";
import { FONT } from "../theme/brand.js";
import { ACCESS_STATUS } from "../lib/access.js";
import { PRICING } from "../lib/pricing.js";

function formatTrialEndDate(iso) {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/**
 * Accueil — décompte essai 7 jours + CTA conversion.
 * Copy bénéfice → urgence douce → prix ancré.
 */
export default function TrialCountdownBanner({
  accessState = null,
  onUpgrade,
}) {
  if (!accessState || accessState.status !== ACCESS_STATUS.TRIAL) return null;
  const days = Number(accessState.trialDaysLeft) || 0;
  if (days <= 0) return null;

  const urgent = days <= 2;
  const hot = days <= 3;
  const endLabel = formatTrialEndDate(accessState.trialEndsAt);
  const priceFrom = PRICING.monthlyCommit.label;

  let title;
  let body;
  let cta;
  if (days === 1) {
    title = "Dernier jour pour tout garder";
    body = "Demain, tes séances passent en pause. Garde ton plan, tes allures et ton coach — dès aujourd’hui.";
    cta = "Garder mon programme";
  } else if (days === 2) {
    title = "Plus que 2 jours d’entraînement guidé";
    body = endLabel
      ? `Le ${endLabel}, l’essai s’arrête. Continue sans perdre ta progression — dès ${priceFrom}/mois.`
      : `L’essai s’arrête bientôt. Continue sans perdre ta progression — dès ${priceFrom}/mois.`;
    cta = "Continuer Premium";
  } else if (days === 3) {
    title = "3 jours pour verrouiller ton rythme";
    body = endLabel
      ? `Jusqu’au ${endLabel} : ton coach et tes séances restent avec toi. Ensuite, pause sans abonnement.`
      : "Ton coach et tes séances restent avec toi. Ensuite, pause sans abonnement.";
    cta = "Rester Premium";
  } else {
    title = days >= 6
      ? "Ton essai Premium vient de démarrer"
      : `Encore ${days} jours d’essai Premium`;
    body = endLabel
      ? `Profite à fond jusqu’au ${endLabel}. Quand tu es prêt, garde tout dès ${priceFrom}/mois.`
      : `Nage avec ton plan et tes allures. Garde tout ensuite dès ${priceFrom}/mois.`;
    cta = "Voir les offres";
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
