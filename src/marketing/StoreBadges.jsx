import { useTranslation } from "react-i18next";
import { APP_STORE_URL, shouldShowWebStoreUi } from "../lib/store-links.js";
import "./store-badges.css";


function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
      <path d="M16.7 12.6c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.8-3.1.8-.7 0-1.7-.7-2.8-.7-1.4 0-2.8.8-3.5 2.1-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.6 2.2 2.7 2.1 1.1 0 1.5-.7 2.8-.7s1.6.7 2.8.7c1.2 0 1.9-1 2.6-2 .8-1.2 1.1-2.3 1.2-2.4-.1 0-2.1-.8-2.1-3.2zM14.8 6.4c.6-.7 1-1.7.9-2.7-1 .1-2.1.6-2.8 1.4-.6.7-1.1 1.7-.9 2.7 1 0 2.1-.6 2.8-1.4z" />
    </svg>
  );
}

function PlayMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
      <path d="M4.5 3.4v17.2c0 .7.8 1.1 1.4.7l14-8.6c.6-.4.6-1.3 0-1.7l-14-8.3c-.6-.4-1.4 0-1.4.7z" />
    </svg>
  );
}

/**
 * Badge App Store (lien live) + Android grisé « bientôt ».
 * Invisible dans Capacitor.
 */
export default function StoreBadges({ className = "" }) {
  const { t } = useTranslation("common");
  if (!shouldShowWebStoreUi()) return null;

  return (
    <div className={`ms-store-badges${className ? ` ${className}` : ""}`}>
      <a
        className="ms-footer-store ms-footer-store--active"
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("store.appStoreAria")}
      >
        <span className="ms-footer-store-icon">
          <AppleMark />
        </span>
        <span className="ms-footer-store-copy">
          <span className="ms-footer-store-soon">{t("store.availableOn")}</span>
          <span className="ms-footer-store-name">{t("footer.appStore")}</span>
        </span>
      </a>
      <div
        className="ms-footer-store ms-footer-store--disabled"
        role="link"
        aria-disabled="true"
        aria-label={t("store.androidSoonAria")}
      >
        <span className="ms-footer-store-icon">
          <PlayMark />
        </span>
        <span className="ms-footer-store-copy">
          <span className="ms-footer-store-soon">{t("store.androidSoon")}</span>
          <span className="ms-footer-store-name">{t("footer.googlePlay")}</span>
        </span>
      </div>
    </div>
  );
}
