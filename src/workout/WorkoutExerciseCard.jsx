/**
 * Carte exercice compacte (pas de tiroir / dépliable).
 */
import { Info } from "lucide-react";

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

export default function WorkoutExerciseCard({
  exercise,
  colors: G,
  accent,
  onOpenDrill,
  compact = false,
  nested = false,
}) {
  if (!exercise) return null;

  const volume = exercise.volumeLabel || (exercise.meters ? `${exercise.meters} m` : null);
  const stroke = exercise.strokeLabel;
  const primaryCue = exercise.cue;

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
        }}>
          {volume || exercise.main}
          {stroke ? (
            <span style={{ color: accent?.color || G.blue, fontWeight: 800 }}>
              {" · "}{stroke}
            </span>
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
          {exercise.kind === "cool" && <MetaPill G={G}>Souple</MetaPill>}
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
    </div>
  );
}
