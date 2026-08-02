import { useTranslation } from "react-i18next";
import { setAppLanguage } from "./index.js";

/**
 * Compact FR | EN language toggle.
 * @param {'nav' | 'settings' | 'footer'} variant
 */
export default function LanguageSwitcher({ variant = "nav" }) {
  const { t, i18n } = useTranslation("common");
  const lng = i18n.language?.startsWith("en") ? "en" : "fr";

  const isSettings = variant === "settings";
  const isFooter = variant === "footer";

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
      ? (isFooter ? "rgba(142,179,255,0.35)" : "#8eb3ff")
      : "transparent",
    color: active
      ? (isFooter ? "#fff" : "#154388")
      : (isFooter ? "rgba(255,255,255,0.45)" : "#5d5e61"),
    transition: "background 0.15s, color 0.15s",
    WebkitTapHighlightColor: "transparent",
  });

  return (
    <div
      role="group"
      aria-label={t("lang.label")}
      style={wrap}
    >
      <button
        type="button"
        aria-pressed={lng === "fr"}
        aria-label={t("lang.switchToFr")}
        onClick={() => setAppLanguage("fr")}
        style={btn(lng === "fr")}
      >
        {t("lang.fr")}
      </button>
      <button
        type="button"
        aria-pressed={lng === "en"}
        aria-label={t("lang.switchToEn")}
        onClick={() => setAppLanguage("en")}
        style={btn(lng === "en")}
      >
        {t("lang.en")}
      </button>
    </div>
  );
}
