import { Lock } from "lucide-react";
import { G } from "../theme/palette.js";
import { FONT_DISPLAY } from "../theme/brand.js";
import { PRICING_SUMMARY_FR } from "../lib/pricing.js";
import Btn from "../ui/Btn.jsx";
import SessionHeroCard from "../SessionHeroCard.jsx";

export default function TrialExpiredFreeze({ onSubscribe, onSignOut, preview = null }) {
  const heroPreview = preview
    ? {
        title: preview.title || "Séance",
        type: preview.type || "En pause",
        distanceLabel: preview.distance ? `${preview.distance} m` : null,
        durationLabel: preview.duration ? `${preview.duration} min` : null,
        blocks: preview.blocks || [],
      }
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="freeze-title"
      className="ms-screen-enter"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 400,
        background: G.bg,
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
            width: 64,
            height: 64,
            borderRadius: 20,
            background: G.blue,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <Lock size={28} color={G.gold} />
        </div>
        <h1
          id="freeze-title"
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 32,
            fontWeight: 700,
            textTransform: "none",
            letterSpacing: "-0.03em",
            color: G.ink,
            margin: "0 0 12px",
            lineHeight: 1.05,
          }}
        >
          Ton essai est terminé
        </h1>
        <p style={{ fontSize: 15, color: G.grey, lineHeight: 1.55, margin: "0 0 20px" }}>
          Le coach est en pause. Abonne-toi pour reprendre tes séances, {PRICING_SUMMARY_FR}.
        </p>

        {heroPreview && (
          <div
            aria-hidden
            style={{
              textAlign: "left",
              marginBottom: 22,
              filter: "blur(5px)",
              opacity: 0.55,
              pointerEvents: "none",
              userSelect: "none",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "1.25rem",
                zIndex: 1,
                background: "linear-gradient(180deg, transparent 30%, rgba(0,5,20,0.65) 100%)",
              }}
            />
            <SessionHeroCard preview={heroPreview} kicker="Aperçu, en pause" className="is-compact" />
          </div>
        )}

        <Btn variant="blue" onClick={onSubscribe} style={{ width: "100%", minHeight: 52 }}>
          Reprendre avec Premium
        </Btn>
        <button
          type="button"
          onClick={onSignOut}
          style={{
            width: "100%",
            marginTop: 12,
            padding: 14,
            border: "none",
            background: "none",
            color: G.grey,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            minHeight: 44,
          }}
        >
          Se déconnecter
        </button>
        <p style={{ fontSize: 12, color: G.greyMid, marginTop: 16, lineHeight: 1.45 }}>
          Besoin d’aide ?{" "}
          <a href="mailto:support@myswym.app" style={{ color: G.blueMid, fontWeight: 700, textDecoration: "none" }}>
            support@myswym.app
          </a>
        </p>
      </div>
    </div>
  );
}
