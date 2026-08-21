import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { setAppLanguage } from "./index.js";
import { isAppPath, stripLocalePrefix, withLocalePrefix } from "./locale-path.js";

/**
 * Compact FR | EN language toggle.
 * Sur le site marketing : change l’URL (`/pricing` ↔ `/fr/tarifs`).
 * Dans l’app : change seulement la langue (pas de `/fr` sur `/app`).
 * @param {'nav' | 'settings' | 'footer'} variant
 */
export default function LanguageSwitcher({ variant = "nav", onDark = false }) {
  const { t, i18n } = useTranslation("common");
  const location = useLocation();
  const lng = i18n.language?.startsWith("en") ? "en" : "fr";
  const marketing = !isAppPath(location.pathname);
  const bare = stripLocalePrefix(location.pathname);

  const isSettings = variant === "settings";
  const isFooter = variant === "footer" || onDark;

  const wrap = {
    display: "inline-flex",
    alignItems: "center",
    gap: 2,
    padding: 3,
    borderRadius: 999,
    background: isFooter ? "rgba(255,255,255,0.08)" : isSettings ? "transparent" : "rgba(53,93,163,0.08)",
    border: isSettings ? "1.5px solid #c3c6d2" : isFooter ? "1px solid rgba(255,255,255,0.12)" : "none",
    fontFamily: "'Lexend', sans-serif",
  };

  const btn = (active) => ({
    border: "none",
    cursor: "pointer",
    fontFamily: "'Lexend', sans-serif",
    fontWeight: 700,
    fontSize: isSettings ? 13 : 12,
    letterSpacing: "0.04em",
    padding: isSettings ? "8px 14px" : "6px 10px",
    borderRadius: 999,
    minHeight: isSettings ? 36 : 28,
    minWidth: isSettings ? 44 : 36,
    background: active
      ? (isFooter ? "#006bfd" : "#006bfd")
      : "transparent",
    color: active
      ? (isFooter ? "#fff" : "#ffffff")
      : (isFooter ? "rgba(255,255,255,0.45)" : "#5d6b7d"),
    transition: "background 0.15s, color 0.15s",
    WebkitTapHighlightColor: "transparent",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  });

  const target = (next) => ({
    pathname: withLocalePrefix(bare, next),
    search: location.search,
    hash: location.hash,
  });

  const control = (next, label, aria) => {
    const active = lng === next;
    const style = btn(active);
    if (marketing) {
      return (
        <Link
          to={target(next)}
          aria-pressed={active}
          aria-label={aria}
          onClick={() => setAppLanguage(next)}
          style={style}
        >
          {label}
        </Link>
      );
    }
    return (
      <button
        type="button"
        aria-pressed={active}
        aria-label={aria}
        onClick={() => setAppLanguage(next)}
        style={style}
      >
        {label}
      </button>
    );
  };

  return (
    <div
      role="group"
      aria-label={t("lang.label")}
      style={wrap}
    >
      {control("fr", t("lang.fr"), t("lang.switchToFr"))}
      {control("en", t("lang.en"), t("lang.switchToEn"))}
    </div>
  );
}
