import { useEffect } from "react";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FONT } from "./theme/brand.js";
import { intlLocaleFor } from "./i18n/languages.js";

export default function SessionCompleteView({ meters = 0, streak = 1, first = false, onContinue }) {
  const { t, i18n } = useTranslation("app");
  useEffect(() => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate?.(12); } catch { /* ignore */ }
    }
  }, []);

  const metersLabel = Number(meters) > 0
    ? `+${Number(meters).toLocaleString(intlLocaleFor(i18n.language))} m`
    : t("session.done");

  return (
    <div className="ms-celeb" role="dialog" aria-modal="true" aria-labelledby="ms-celeb-title">
      <div className="ms-celeb-card">
        <div className="ms-celeb-check" aria-hidden>
          <Check size={28} color="#fff" strokeWidth={2.5} />
        </div>
        <h2 id="ms-celeb-title" className="ms-celeb-title">
          {first ? t("session.firstDone") : t("session.validated")}
        </h2>
        <p className="ms-celeb-sub">
          {metersLabel}
          {streak > 1 ? ` · ${t("session.streak", { count: streak })}` : first ? ` · ${t("session.comeBack")}` : ""}
        </p>
        <div className="ms-celeb-bar" aria-hidden />
        <button type="button" className="ms-plan-reveal-btn" onClick={onContinue} style={{ fontFamily: FONT }}>
          {t("session.continue")}
        </button>
      </div>
    </div>
  );
}
