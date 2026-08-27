/**
 * Carte exercice compacte (pas de tiroir / dépliable).
 */
import { useState } from "react";
import { createPortal } from "react-dom";
import { Info, X } from "lucide-react";

const ALLURE_TIPS = {
  souple: {
    title: "Souple",
    body:
      "Allure lente et relâchée, pour récupérer. Tu ne forces pas — tu te détends avant de reprendre l’effort.",
  },
  progressif: {
    title: "Progressif",
    body:
      "Tu accélères au fil de la distance : départ facile, fin plus soutenue.",
  },
};

function MetaPill({ children, tone = "neutral", G }) {
  const bg = tone === "blue" ? G.blueLight : G.greyXLight;
  const color = tone === "blue" ? G.blue : G.inkLight;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      fontSize: 12, fontWeight: 700, padding: "5px 10px", borderRadius: 10,
      background: bg, color, whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

function AllureTipSheet({ tipKey, onClose, colors: G }) {
  const tip = ALLURE_TIPS[tipKey];
  if (!tip) return null;
  return createPortal(
    <div
      className="sheet-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={tip.title}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        className="sheet-panel scale-in"
        style={{
          background: G.surface,
          borderRadius: "24px 24px 0 0",
          padding: "20px 20px max(28px, env(safe-area-inset-bottom))",
        }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 2, background: G.greyLight, margin: "0 auto 16px" }} />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
              Allure
            </div>
            <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: G.ink, lineHeight: 1.15 }}>
              {tip.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            style={{
              width: 44, height: 44, borderRadius: 12, border: `1px solid ${G.greyLight}`,
              background: G.greyXLight, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}
          >
            <X size={18} color={G.ink} />
          </button>
        </div>
        <p style={{ margin: 0, fontSize: 15, color: G.inkLight, lineHeight: 1.5, fontWeight: 600 }}>
          {tip.body}
        </p>
      </div>
    </div>,
    document.body,
  );
}

function AllureInfoChip({ label, onClick, G, tone = "mint" }) {
  const bg = tone === "mint" ? (G.mintLight || G.greyXLight) : (G.blueLight || G.greyXLight);
  const color = tone === "mint" ? (G.mint || G.inkLight) : (G.blue || G.inkLight);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Qu’est-ce que ${label.toLowerCase()} ?`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        border: `1px solid ${G.greyLight}`,
        background: bg,
        color,
        fontSize: 11,
        fontWeight: 800,
        padding: "4px 9px",
        borderRadius: 999,
        cursor: "pointer",
        letterSpacing: "0.02em",
        textTransform: "uppercase",
        minHeight: 28,
      }}
    >
      {label}
      <Info size={12} strokeWidth={2.5} />
    </button>
  );
}

export default function WorkoutExerciseCard({
  exercise,
  colors: G,
  accent,
  onOpenDrill,
  compact = false,
  nested = false,
}) {
  const [tipKey, setTipKey] = useState(null);
  if (!exercise) return null;

  const volume = exercise.volumeLabel || (exercise.meters ? `${exercise.meters} m` : null);
  const stroke = exercise.strokeLabel;
  const primaryCue = exercise.cue;
  const showSouple =
    exercise.section !== "warm"
    && exercise.kind !== "warm"
    && (exercise.effortLabel === "souple" || exercise.kind === "cool");
  const showProgressif = /\bprogressif\b/i.test(
    `${primaryCue || ""} ${exercise.main || ""} ${exercise.raw || ""}`,
  );

  return (
    <div
      style={{
        background: nested ? "transparent" : G.surface,
        borderRadius: nested ? 12 : 16,
        border: nested ? "none" : `1px solid ${G.greyLight}`,
        overflow: "hidden",
        padding: compact ? "14px 14px" : "16px 16px",
        minHeight: 56,
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: 9, flexShrink: 0, marginTop: 2,
        background: accent?.bg || G.blueLight, color: accent?.color || G.blue,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 800,
      }}>
        {exercise.index}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: compact ? 17 : 18,
          fontWeight: 800,
          color: G.ink,
          lineHeight: 1.2,
          letterSpacing: "-0.01em",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 8,
        }}>
          <span>
            {volume || exercise.main}
            {stroke ? (
              <span style={{ color: accent?.color || G.blue, fontWeight: 800 }}>
                {" · "}{stroke}
              </span>
            ) : null}
          </span>
          {showSouple ? (
            <AllureInfoChip label="Souple" onClick={() => setTipKey("souple")} G={G} tone="mint" />
          ) : null}
          {showProgressif ? (
            <AllureInfoChip label="Progressif" onClick={() => setTipKey("progressif")} G={G} tone="blue" />
          ) : null}
        </div>

        {primaryCue && volume && (
          <div style={{ fontSize: 13, color: G.inkLight, marginTop: 4, lineHeight: 1.35, fontWeight: 600 }}>
            {primaryCue.charAt(0).toUpperCase() + primaryCue.slice(1)}
          </div>
        )}
        {!volume && exercise.main && primaryCue && (
          <div style={{ fontSize: 13, color: G.inkLight, marginTop: 4, lineHeight: 1.35 }}>
            {primaryCue.charAt(0).toUpperCase() + primaryCue.slice(1)}
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {exercise.restLabel && <MetaPill G={G} tone="blue">{exercise.restLabel}</MetaPill>}
          {exercise.kind === "warm" && <MetaPill G={G}>Facile</MetaPill>}
          {exercise.educatif && (
            <button
              type="button"
              onClick={() => onOpenDrill?.(exercise.educatif)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                border: "none", background: G.blueLight, color: G.blue,
                fontSize: 12, fontWeight: 700, padding: "5px 10px", borderRadius: 10,
                cursor: "pointer", minHeight: 32,
              }}
            >
              <Info size={12} /> Voir l’éducatif
            </button>
          )}
        </div>
      </div>

      {tipKey ? <AllureTipSheet tipKey={tipKey} onClose={() => setTipKey(null)} colors={G} /> : null}
    </div>
  );
}
