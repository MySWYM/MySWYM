import { Check } from "lucide-react";
import { G } from "../theme/palette.js";
import Btn from "../ui/Btn.jsx";
import {
  APPLE_IAP_ANNUAL_CTA_FR,
  APPLE_IAP_ANNUAL_SAVE_FR,
  APPLE_IAP_ANNUAL_SAVE_PCT,
  APPLE_IAP_MONTHLY_YEAR_EQUIV,
} from "../lib/apple-iap-catalog.js";
import { LEGAL_LINKS, IOS_IAP_ANNUAL_REASSURE, IOS_IAP_LEGAL_PREFIX, IOS_IAP_MONTHLY_REASSURE } from "../lib/legal-copy.js";
import { LocalizedLink } from "../i18n/locale-routing.jsx";
import "./IosIapPaywall.css";

const COMPARE = [
  { id: "sessions", label: "Séances complètes du plan" },
  { id: "pace", label: "Allures à la seconde (T100)" },
  { id: "adapt", label: "Adaptation coach après feedback" },
  { id: "event", label: "Plan jusqu’à ton événement" },
];

function Cell({ ok }) {
  if (ok) return <Check size={18} color={G.blue} strokeWidth={2.5} aria-hidden />;
  return <span className="ms-iap-cell-no" aria-label="Non">-</span>;
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
  const isAnnual = period === "annual";
  const heroPrice = isAnnual ? annualPrice : monthlyPrice;
  const heroPeriod = isAnnual ? "/ an" : "/ mois";

  return (
    <div className="ms-iap-paywall">
      <div className="ms-iap-paywall-main">
        <h3 className="ms-iap-title">
          {isAnnual ? "Premium annuel" : "Premium mensuel"}
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
        {isAnnual ? <p className="ms-iap-save">{APPLE_IAP_ANNUAL_SAVE_FR}</p> : null}

        <div className="ms-iap-table" role="table" aria-label="Essai et Premium">
          <div className="ms-iap-table-head" role="row">
            <span role="columnheader" className="ms-iap-table-feature" />
            <span role="columnheader">Essai</span>
            <span role="columnheader" className="is-premium">Premium</span>
          </div>
          {COMPARE.map((row) => (
            <div key={row.id} className="ms-iap-table-row" role="row">
              <span role="cell" className="ms-iap-table-feature">{row.label}</span>
              <span role="cell" className="ms-iap-table-cell"><Cell ok={false} /></span>
              <span role="cell" className="ms-iap-table-cell"><Cell ok /></span>
            </div>
          ))}
        </div>

        <p className="ms-iap-reassure">
          {isAnnual ? IOS_IAP_ANNUAL_REASSURE : IOS_IAP_MONTHLY_REASSURE}
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
            {loading ? "Achat…" : (
              <>
                S’abonner à l’annuel et économiser{" "}
                <span>{APPLE_IAP_ANNUAL_SAVE_PCT}</span>
              </>
            )}
          </button>
        ) : (
          <Btn variant="primary" onClick={onSubscribe} disabled={loading} style={{ width: "100%" }}>
            {loading ? "Achat…" : `S’abonner : ${monthlyPrice} / mois`}
          </Btn>
        )}

        {isAnnual ? (
          <button
            type="button"
            className="ms-iap-alt"
            disabled={loading}
            onClick={() => onPeriodChange("monthly_flex")}
          >
            Non merci, je préfère le tarif mensuel : {monthlyPrice}
          </button>
        ) : (
          <button
            type="button"
            className="ms-iap-annual-cta"
            disabled={loading}
            onClick={() => onPeriodChange("annual")}
          >
            {APPLE_IAP_ANNUAL_CTA_FR}{" "}
            <span>{APPLE_IAP_ANNUAL_SAVE_PCT}</span>
          </button>
        )}

        <button
          type="button"
          className="ms-iap-restore"
          disabled={loading}
          onClick={onRestore}
        >
          J’ai déjà Premium, restaurer
        </button>

        <p className="ms-iap-legal">
          {IOS_IAP_LEGAL_PREFIX}{" "}
          <LocalizedLink to={LEGAL_LINKS.cgv} target="_blank" rel="noopener noreferrer">CGV</LocalizedLink>
          {", les "}
          <LocalizedLink to={LEGAL_LINKS.cgu} target="_blank" rel="noopener noreferrer">CGU</LocalizedLink>
          {" et la "}
          <LocalizedLink to={LEGAL_LINKS.privacy} target="_blank" rel="noopener noreferrer">politique de confidentialité</LocalizedLink>
          .
        </p>
      </div>
    </div>
  );
}
