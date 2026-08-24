import { useEffect } from "react";
import { Check } from "lucide-react";
import { FONT } from "./theme/brand.js";

export default function SessionCompleteView({ meters = 0, streak = 1, first = false, onContinue }) {
  useEffect(() => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate?.(12); } catch { /* ignore */ }
    }
  }, []);

  const metersLabel = Number(meters) > 0
    ? `+${Number(meters).toLocaleString("fr-FR")} m`
    : "Séance terminée";

  return (
    <div className="ms-celeb" role="dialog" aria-modal="true" aria-labelledby="ms-celeb-title">
      <div className="ms-celeb-card">
        <div className="ms-celeb-check" aria-hidden>
          <Check size={28} color="#fff" strokeWidth={2.5} />
        </div>
        <h2 id="ms-celeb-title" className="ms-celeb-title">
          {first ? "Première séance validée" : "Séance validée"}
        </h2>
        <p className="ms-celeb-sub">
          {metersLabel}
          {streak > 1 ? ` · série de ${streak}` : first ? " · reviens demain" : ""}
        </p>
        <div className="ms-celeb-bar" aria-hidden />
        <button type="button" className="ms-plan-reveal-btn" onClick={onContinue} style={{ fontFamily: FONT }}>
          Continuer
        </button>
      </div>
    </div>
  );
}
