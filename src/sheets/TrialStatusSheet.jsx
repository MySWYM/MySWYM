import { useState } from "react";
import { useTranslation } from "react-i18next";
import SoftMistSheet from "./SoftMistSheet.jsx";
import { APPLE_IAP_ANNUAL_ID } from "../lib/apple-iap-catalog.js";
import { PRICING } from "../lib/pricing.js";
import { intlLocaleFor, normalizeAppLanguage } from "../i18n/languages.js";

function formatDay(iso, locale) {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toLocaleDateString(locale, { day: "numeric", month: "long" });
}

/**
 * Fiche essai : date du 1er prélèvement, plan, passage annuel ou gestion.
 * N'ouvre jamais un nouveau checkout pendant l'essai.
 */
export default function TrialStatusSheet({
  open = true,
  accessState = null,
  onClose,
  onManage,
  onSwitchAnnual,
}) {
  const { t, i18n } = useTranslation("app");
  const [busy, setBusy] = useState(false);
  if (!open) return null;
  const locale = intlLocaleFor(normalizeAppLanguage(i18n.language));
  const endIso = accessState?.trialEndsAt || accessState?.subscriptionEndsAt;
  const date = formatDay(endIso, locale);
  const annual = accessState?.appleProductId === APPLE_IAP_ANNUAL_ID;
  const canceled = accessState?.cancelAtPeriodEnd === true;
  const price = accessState?.appleProductId
    ? (annual ? PRICING.annual.label : PRICING.monthlyFlex.label)
    : "";
  const amount = price ? `, ${price}` : "";

  const run = async (fn) => {
    if (!fn || busy) return;
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <SoftMistSheet
      open
      onClose={onClose}
      eyebrow={t("trial.statusEyebrow")}
      title={annual ? t("trial.planAnnual") : t("trial.planMonthly")}
      subtitle={canceled
        ? (date ? t("trial.statusEnd", { date }) : t("trial.canceledLastDayBody"))
        : (date ? t("trial.statusCharge", { date, amount }) : t("trial.chargeLastDayPlain"))}
      ariaLabel={t("trial.statusEyebrow")}
      className="ms-trial-status-overlay"
      footer={(
        <div className="ms-iap-paywall-dock">
          {!annual && !canceled ? (
            <button
              type="button"
              className="ms-app-btn"
              disabled={busy}
              onClick={() => { void run(onSwitchAnnual); }}
            >
              {t("trial.switchAnnual")}
            </button>
          ) : null}
          <button
            type="button"
            className="ms-iap-alt"
            disabled={busy}
            onClick={() => { void run(onManage); }}
          >
            {t("trial.manage")}
          </button>
        </div>
      )}
    />
  );
}
