/**
 * Carte exercice compacte (fermée) + détail dépliable.
 */
import { useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import PyramidBlockViz from "../PyramidBlockViz.jsx";

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
  defaultOpen = false,
  onOpenDrill,
  compact = false,
  nested = false,
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (!exercise) return null;

  const volume = exercise.volumeLabel || (exercise.meters ? `${exercise.meters} m` : null);
  const stroke = exercise.strokeLabel;
  const primaryCue = exercise.cue;
  const hasDetails =
    (exercise.cues && exercise.cues.length > 1) ||
    (exercise.children && exercise.children.length > 0) ||
    exercise.pyramid ||
    exercise.educatif ||
    (exercise.steps && exercise.steps.length > 0);

  return (
    <div
      style={{
        background: nested ? "transparent" : G.surface,
        borderRadius: nested ? 12 : 16,
        border: nested ? "none" : `1px solid ${G.greyLight}`,
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => hasDetails && setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          width: "100%",
          textAlign: "left",
          border: "none",
          background: "none",
          cursor: hasDetails ? "pointer" : "default",
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
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDrill?.(exercise.educatif);
                }}
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

        {hasDetails && (
          <div style={{ paddingTop: 4, color: G.greyMid, flexShrink: 0 }}>
            {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        )}
      </button>

      {open && hasDetails && (
        <div style={{ padding: "0 16px 16px 56px" }}>
          {exercise.pyramid && (
            <div style={{ marginBottom: 12 }}>
              <div style={{
                fontSize: 13, fontWeight: 700, color: G.ink, marginBottom: 8, lineHeight: 1.35,
              }}>
                {exercise.pyramid.steps.join(" → ")}
              </div>
              <PyramidBlockViz
                steps={exercise.pyramid.steps}
                peak={exercise.pyramid.peak}
                volume={exercise.pyramid.volume}
                rest={exercise.pyramid.rest}
                label={exercise.pyramid.label}
                accent={accent?.color || G.blue}
              />
            </div>
          )}

          {exercise.steps && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {exercise.steps.map((s) => (
                <span key={s} style={{
                  fontSize: 12, fontWeight: 600, color: G.inkLight,
                  background: G.greyXLight, padding: "5px 9px", borderRadius: 8,
                }}>{s}</span>
              ))}
            </div>
          )}

          {exercise.children?.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
              {exercise.children.map((c, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start",
                }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: G.inkLight, lineHeight: 1.35 }}>
                    {c.headline?.volume || c.main}
                    {c.headline?.stroke ? ` · ${c.headline.stroke}` : ""}
                    {c.headline?.rest ? ` — ${c.headline.rest}` : ""}
                  </div>
                  {c.restLabel && <MetaPill G={G} tone="blue">{c.restLabel}</MetaPill>}
                </div>
              ))}
            </div>
          )}

          {exercise.cues?.slice(exercise.cue ? 1 : 0).map((c, i) => (
            <div key={i} style={{ fontSize: 13, color: G.grey, lineHeight: 1.45, marginTop: 4 }}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
