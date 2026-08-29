import { useState } from "react";
import { Waves } from "lucide-react";
import { FONT, FONT_DISPLAY } from "./theme/brand.js";

const TIP_KEY = "myswym_first_swim_tip_seen";

export function hasSeenFirstSwimTip() {
  try {
    return localStorage.getItem(TIP_KEY) === "1";
  } catch {
    return true;
  }
}

export function markFirstSwimTipSeen() {
  try {
    localStorage.setItem(TIP_KEY, "1");
  } catch { /* ignore */ }
}

/** Conseil court après le trophée de plan, avant l’accueil. */
export default function FirstSwimTip({ colors: G, sessionTitle, onContinue }) {
  const [leaving, setLeaving] = useState(false);

  const go = () => {
    if (leaving) return;
    setLeaving(true);
    markFirstSwimTipSeen();
    onContinue?.();
  };

  return (
    <div
      className="ms-screen-enter"
      style={{
        minHeight: "100dvh",
        background: G.bg,
        color: G.ink,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "28px 20px",
        paddingBottom: "max(28px, env(safe-area-inset-bottom))",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: G.blueLight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <Waves size={26} color={G.blue} />
        </div>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: G.grey,
            margin: "0 0 8px",
          }}
        >
          Avant de plonger
        </p>
        <h1
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            margin: "0 0 12px",
            lineHeight: 1.1,
          }}
        >
          Comment nager ta 1ʳᵉ séance
        </h1>
        <p style={{ fontSize: 15, color: G.grey, lineHeight: 1.55, margin: "0 0 20px" }}>
          {sessionTitle
            ? `« ${sessionTitle} » : suis l’échauffement, puis le corps de séance, sans forcer. Si c’est trop dur, note-le après, le coach s’adapte.`
            : "Suis l’échauffement, puis le corps de séance, sans forcer. Si c’est trop dur, note-le après, le coach s’adapte."}
        </p>
        <ul
          style={{
            textAlign: "left",
            margin: "0 0 24px",
            padding: "14px 16px",
            listStyle: "none",
            background: G.surface,
            border: `1px solid ${G.greyLight}`,
            borderRadius: 16,
            fontSize: 14,
            color: G.ink,
            lineHeight: 1.5,
          }}
        >
          <li style={{ marginBottom: 10 }}>· Lis les 3 blocs avant d’entrer dans l’eau</li>
          <li style={{ marginBottom: 10 }}>· Garde de la marge, mieux vaut finir propre</li>
          <li>· Coche la séance une fois sortie du bassin</li>
        </ul>
        <button
          type="button"
          className="ms-plan-reveal-btn"
          onClick={go}
          disabled={leaving}
          style={{ fontFamily: FONT }}
        >
          Voir ma séance
        </button>
      </div>
    </div>
  );
}
