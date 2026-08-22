import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LocalizedLink } from "./i18n/locale-routing.jsx";
import {
  DEFAULT_COOKIE_PREFS,
  readConsent,
  writeConsent,
} from "./lib/cookie-consent.js";
import {
  CookieCategories,
  CookiePreferenceActions,
} from "./marketing/CookiePreferences.jsx";
import "./theme/cookie-consent.css";

export default function CookieBanner() {
  const { t } = useTranslation("common");
  const titleId = useId();
  const dialogRef = useRef(null);
  const [banner, setBanner] = useState(false);
  const [manager, setManager] = useState(false);
  const [tab, setTab] = useState("categories");
  const [prefs, setPrefs] = useState(DEFAULT_COOKIE_PREFS);

  useEffect(() => {
    const syncBanner = () => setBanner(!readConsent());
    syncBanner();
    const openManager = () => {
      setPrefs(readConsent() || DEFAULT_COOKIE_PREFS);
      setTab("categories");
      setManager(true);
    };
    window.addEventListener("myswym:cookie-consent-changed", syncBanner);
    window.addEventListener("myswym:cookie-manager-open", openManager);
    return () => {
      window.removeEventListener("myswym:cookie-consent-changed", syncBanner);
      window.removeEventListener("myswym:cookie-manager-open", openManager);
    };
  }, []);

  useEffect(() => {
    if (!manager) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => {
      dialogRef.current?.querySelector("[data-cookie-close]")?.focus();
    }, 0);
    const onKey = (event) => {
      if (event.key === "Escape") {
        setManager(false);
        setTab("categories");
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [manager]);

  const persist = (next) => {
    writeConsent(next);
    setBanner(false);
    setManager(false);
  };

  const closeManager = () => {
    setManager(false);
    setTab("categories");
  };

  return (
    <>
      {banner && !manager ? (
        <div className="ms-cookie-banner" role="dialog" aria-label={t("cookies.bannerAria")}>
          <p>
            {t("cookies.bannerBefore")}{" "}
            <strong>{t("cookies.necessaryWord")}</strong> {t("cookies.bannerMid")}{" "}
            <strong>PostHog</strong> {t("cookies.bannerAnd")}{" "}
            <strong>Vercel Speed Insights</strong> {t("cookies.bannerAfter")}{" "}
            <LocalizedLink to={{ pathname: "/politique-cookies", hash: "#parametrage-cookies" }}>{t("cookies.learnMore")}</LocalizedLink>
          </p>
          <div className="ms-cookie-banner-actions">
            <button type="button" className="ms-cookie-btn" onClick={() => persist({ analytics: false, performance: false })}>
              {t("cookies.rejectAll")}
            </button>
            <button type="button" className="ms-cookie-btn" onClick={() => persist({ analytics: true, performance: true })}>
              {t("cookies.acceptAll")}
            </button>
          </div>
          <button type="button" className="ms-cookie-link" onClick={() => { setPrefs(DEFAULT_COOKIE_PREFS); setManager(true); }}>
            {t("cookies.customize")}
          </button>
        </div>
      ) : null}

      {manager ? (
        <div
          className="ms-cookie-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && readConsent()) closeManager();
          }}
        >
          <div
            ref={dialogRef}
            className="ms-cookie-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <div className="ms-cookie-dialog-head">
              <h2 id={titleId}>{t("cookies.title")}</h2>
              <button type="button" className="ms-cookie-icon" data-cookie-close aria-label={t("cookies.close")} onClick={closeManager}>
                <X size={20} />
              </button>
            </div>

            <div className="ms-cookie-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={tab === "categories"}
                className={`ms-cookie-tab${tab === "categories" ? " is-active" : ""}`}
                onClick={() => setTab("categories")}
              >
                {t("cookies.tabCategories")}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "declaration"}
                className={`ms-cookie-tab${tab === "declaration" ? " is-active" : ""}`}
                onClick={() => setTab("declaration")}
              >
                {t("cookies.tabDeclaration")}
              </button>
            </div>

            <div className="ms-cookie-dialog-body">
              {tab === "categories" ? (
                <>
                  <p className="ms-cookie-lead">
                    {t("cookies.lead")}{" "}
                    <LocalizedLink to={{ pathname: "/politique-cookies", hash: "#parametrage-cookies" }}>{t("cookies.learnMore")}</LocalizedLink>
                  </p>
                  <CookieCategories prefs={prefs} onPrefsChange={setPrefs} />
                </>
              ) : (
                <ul className="ms-cookie-decl">
                  <li>
                    <strong>{t("cookies.necessaryTitle")}</strong>
                    <span>{t("cookies.declNecessary")}</span>
                  </li>
                  <li>
                    <strong>PostHog</strong>
                    <span>{t("cookies.declPosthog")}</span>
                  </li>
                  <li>
                    <strong>Vercel Speed Insights</strong>
                    <span>{t("cookies.declVercel")}</span>
                  </li>
                  <li>
                    <strong>{t("cookies.declMarketingTitle")}</strong>
                    <span>{t("cookies.declMarketing")}</span>
                  </li>
                </ul>
              )}
            </div>

            <CookiePreferenceActions prefs={prefs} onPersist={persist} />
          </div>
        </div>
      ) : null}
    </>
  );
}
