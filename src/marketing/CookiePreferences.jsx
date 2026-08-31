import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  DEFAULT_COOKIE_PREFS,
  readConsent,
  writeConsent,
} from "../lib/cookie-consent.js";
import "../theme/cookie-consent.css";

export function CookieSwitch({ checked, disabled, label, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      className="ms-cookie-switch"
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      aria-label={label}
      onClick={() => {
        if (!disabled) onChange(!checked);
      }}
    />
  );
}

export function CookieCategories({ prefs, onPrefsChange }) {
  const { t } = useTranslation("common");
  const [openVendors, setOpenVendors] = useState({ analytics: false, performance: false });

  const toggleVendors = (key) => {
    setOpenVendors((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <div className="ms-cookie-cats">
      <div className="ms-cookie-cat">
        <div className="ms-cookie-cat-row">
          <CookieSwitch checked disabled label={t("cookies.necessaryTitle")} onChange={() => {}} />
          <div className="ms-cookie-cat-copy">
            <h3>{t("cookies.necessaryTitle")}</h3>
            <p>{t("cookies.necessaryDesc")}</p>
            <span className="ms-cookie-always">{t("cookies.alwaysOn")}</span>
          </div>
        </div>
      </div>

      <div className="ms-cookie-cat">
        <div className="ms-cookie-cat-row">
          <CookieSwitch
            checked={prefs.analytics}
            label={t("cookies.analyticsTitle")}
            onChange={(on) => onPrefsChange({ ...prefs, analytics: on })}
          />
          <div className="ms-cookie-cat-copy">
            <h3>{t("cookies.analyticsTitle")}</h3>
            <p>{t("cookies.analyticsDesc")}</p>
            <button type="button" className="ms-cookie-vendor-toggle" onClick={() => toggleVendors("analytics")} aria-expanded={openVendors.analytics}>
              {t("cookies.seeServices")}
              <ChevronDown size={16} style={{ transform: openVendors.analytics ? "rotate(180deg)" : "none" }} />
            </button>
            {openVendors.analytics ? (
              <ul className="ms-cookie-vendors">
                <li>PostHog, {t("cookies.vendorPosthog")}</li>
              </ul>
            ) : null}
          </div>
        </div>
      </div>

      <div className="ms-cookie-cat">
        <div className="ms-cookie-cat-row">
          <CookieSwitch
            checked={prefs.performance}
            label={t("cookies.performanceTitle")}
            onChange={(on) => onPrefsChange({ ...prefs, performance: on })}
          />
          <div className="ms-cookie-cat-copy">
            <h3>{t("cookies.performanceTitle")}</h3>
            <p>{t("cookies.performanceDesc")}</p>
            <button type="button" className="ms-cookie-vendor-toggle" onClick={() => toggleVendors("performance")} aria-expanded={openVendors.performance}>
              {t("cookies.seeServices")}
              <ChevronDown size={16} style={{ transform: openVendors.performance ? "rotate(180deg)" : "none" }} />
            </button>
            {openVendors.performance ? (
              <ul className="ms-cookie-vendors">
                <li>Vercel Speed Insights, {t("cookies.vendorVercel")}</li>
              </ul>
            ) : null}
          </div>
        </div>
      </div>

      <div className="ms-cookie-cat">
        <div className="ms-cookie-cat-row">
          <CookieSwitch checked={false} disabled label={t("cookies.declMarketingTitle")} onChange={() => {}} />
          <div className="ms-cookie-cat-copy">
            <h3>{t("cookies.declMarketingTitle")}</h3>
            <p>{t("cookies.declMarketing")}</p>
            <span className="ms-cookie-always">{t("cookies.notUsed")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CookiePreferenceActions({ prefs, onPersist, className = "ms-cookie-dialog-foot" }) {
  const { t } = useTranslation("common");
  return (
    <div className={className}>
      <button type="button" className="ms-cookie-btn ms-cookie-btn--secondary" onClick={() => onPersist({ analytics: false, performance: false })}>
        {t("cookies.rejectAll")}
      </button>
      <button type="button" className="ms-cookie-btn ms-cookie-btn--primary" onClick={() => onPersist({ analytics: true, performance: true })}>
        {t("cookies.acceptAll")}
      </button>
      <button type="button" className="ms-cookie-btn ms-cookie-btn--secondary" onClick={() => onPersist(prefs)}>
        {t("cookies.save")}
      </button>
    </div>
  );
}

function statusCopy(prefs, stored, t) {
  if (!stored) return t("cookies.pageStatusNone");
  if (prefs.analytics && prefs.performance) return t("cookies.pageStatusAll");
  if (!prefs.analytics && !prefs.performance) return t("cookies.pageStatusNoneOptional");
  return t("cookies.pageStatusMixed", {
    analytics: prefs.analytics ? t("cookies.on") : t("cookies.off"),
    performance: prefs.performance ? t("cookies.on") : t("cookies.off"),
  });
}

/** Module de consentement in-page (politique cookies). Même choix que la popup. */
export default function CookiePreferencesPanel() {
  const { t } = useTranslation("common");
  const [prefs, setPrefs] = useState(() => readConsent() || DEFAULT_COOKIE_PREFS);
  const [stored, setStored] = useState(() => !!readConsent());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const sync = () => {
      const current = readConsent();
      setPrefs(current || DEFAULT_COOKIE_PREFS);
      setStored(!!current);
    };
    window.addEventListener("myswym:cookie-consent-changed", sync);
    return () => window.removeEventListener("myswym:cookie-consent-changed", sync);
  }, []);

  const persist = (next) => {
    writeConsent(next);
    setPrefs(next);
    setStored(true);
    setSaved(true);
  };

  return (
    <section id="parametrage-cookies" className="ms-cookie-page" aria-labelledby="cookie-page-title">
      <p className="ms-cookie-page-kicker">{t("cookies.pageKicker")}</p>
      <h2 id="cookie-page-title" className="ms-cookie-page-title">{t("cookies.pageTitle")}</h2>
      <p className="ms-cookie-page-lead">{t("cookies.pageIntro")}</p>
      <p className="ms-cookie-page-status">
        <strong>{t("cookies.pageStatusLabel")}</strong>
        {" "}
        {statusCopy(prefs, stored, t)}
      </p>
      <CookieCategories prefs={prefs} onPrefsChange={setPrefs} />
      <CookiePreferenceActions prefs={prefs} onPersist={persist} className="ms-cookie-page-actions" />
      {saved ? <p className="ms-cookie-page-saved" role="status">{t("cookies.pageSaved")}</p> : null}
      <p className="ms-cookie-page-note">{t("cookies.pageNote")}</p>
    </section>
  );
}
