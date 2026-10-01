import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { G } from "../theme/palette.js";
import Btn from "../ui/Btn.jsx";
import {
  APPLE_IAP_ANNUAL_SAVE_PCT,
  APPLE_IAP_MONTHLY_YEAR_EQUIV,
} from "../lib/apple-iap-catalog.js";
import { LEGAL_LINKS } from "../lib/legal-copy.js";
import { LocalizedLink } from "../i18n/locale-routing.jsx";
import "./IosIapPaywall.css";

const COMPARE_IDS = ["sessions", "pace", "adapt", "event"];

function Cell({ ok, noLabel }) {
  if (ok) return <Check size={18} color={G.blue} strokeWidth={2.5} aria-hidden />;
  return <span className="ms-iap-cell-no" aria-label={noLabel}>-</span>;
}

export default function IosIapPaywall({
  period,
  onPeriodChange,
  monthlyPrice,
  annualPrice,
  loading = false,
  err = null,
  onSubscribe,
  onRestore,
}) {
  const { t } = useTranslation("app");
  const isAnnual = period === "annual";
  const heroPrice = isAnnual ? annualPrice : monthlyPrice;
  const heroPeriod = isAnnual ? t("paywall.perYear") : t("paywall.perMonth");

  return (
    <div className="ms-iap-paywall">
      <div className="ms-iap-paywall-main">
        <h3 className="ms-iap-title">
          {isAnnual ? t("paywall.annual") : t("paywall.monthly")}
        </h3>
        <div className="ms-iap-price-row">
          {isAnnual ? (
            <span className="ms-iap-price-old">{APPLE_IAP_MONTHLY_YEAR_EQUIV}</span>
          ) : null}
          <span className="ms-iap-price">
            {heroPrice}
            <span className="ms-iap-price-period">{heroPeriod}</span>
          </span>
        </div>
        {isAnnual ? <p className="ms-iap-save">{t("paywall.save")}</p> : null}

        <div className="ms-iap-table" role="table" aria-label={t("paywall.tableAria")}>
          <div className="ms-iap-table-head" role="row">
            <span role="columnheader" className="ms-iap-table-feature" />
            <span role="columnheader">{t("paywall.afterTrial")}</span>
            <span role="columnheader" className="is-premium">{t("paywall.premiumCol")}</span>
          </div>
          {COMPARE_IDS.map((id) => (
            <div key={id} className="ms-iap-table-row" role="row">
              <span role="cell" className="ms-iap-table-feature">{t(`paywall.${id}`)}</span>
              <span role="cell" className="ms-iap-table-cell"><Cell ok={false} noLabel={t("profile.no")} /></span>
              <span role="cell" className="ms-iap-table-cell"><Cell ok noLabel={t("profile.no")} /></span>
            </div>
          ))}
        </div>

        <p className="ms-iap-reassure">
          {isAnnual ? t("paywall.annualReassure") : t("paywall.monthlyReassure")}
        </p>
      </div>

      <div className="ms-iap-paywall-dock">
        {err ? <p className="ms-iap-err">{err}</p> : null}

        {isAnnual ? (
          <button
            type="button"
            className="ms-iap-annual-cta"
            disabled={loading}
            onClick={onSubscribe}
          >
            {loading ? t("paywall.buying") : (
              <>
                {t("paywall.subscribeAnnual")}{" "}
                <span>{APPLE_IAP_ANNUAL_SAVE_PCT}</span>
              </>
            )}
          </button>
        ) : (
          <Btn variant="primary" onClick={onSubscribe} disabled={loading} style={{ width: "100%" }}>
            {loading ? t("paywall.buying") : t("paywall.subscribeMonthly", { price: monthlyPrice })}
          </Btn>
        )}

        {isAnnual ? (
          <button
            type="button"
            className="ms-iap-alt"
            disabled={loading}
            onClick={() => onPeriodChange("monthly_flex")}
          >
            {t("paywall.preferMonthly", { price: monthlyPrice })}
          </button>
        ) : (
          <button
            type="button"
            className="ms-iap-annual-cta"
            disabled={loading}
            onClick={() => onPeriodChange("annual")}
          >
            {t("paywall.subscribeAnnual")}{" "}
            <span>{APPLE_IAP_ANNUAL_SAVE_PCT}</span>
          </button>
        )}

        <button
          type="button"
          className="ms-iap-restore"
          disabled={loading}
          onClick={onRestore}
        >
          {t("paywall.restore")}
        </button>

        <p className="ms-iap-legal">
          {t("paywall.legal", { monthly: monthlyPrice, annual: annualPrice })}{" "}
          <LocalizedLink to={LEGAL_LINKS.cgv} target="_blank" rel="noopener noreferrer">{t("paywall.cgv")}</LocalizedLink>
          {t("paywall.andThe")}
          <LocalizedLink to={LEGAL_LINKS.cgu} target="_blank" rel="noopener noreferrer">{t("paywall.cgu")}</LocalizedLink>
          {t("paywall.andPrivacy")}
          <LocalizedLink to={LEGAL_LINKS.privacy} target="_blank" rel="noopener noreferrer">{t("paywall.privacy")}</LocalizedLink>
          .
        </p>
      </div>
    </div>
  );
}
