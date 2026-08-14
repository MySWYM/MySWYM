/**
 * Vue synthèse / préparation d’une séance (pas le mode bassin).
 */
import { useMemo, useState } from "react";
import { Play, Lock } from "lucide-react";
import { buildWorkoutView } from "../lib/workout-display.js";
import WorkoutExerciseCard from "./WorkoutExerciseCard.jsx";
import DrillInfoSheet from "./DrillInfoSheet.jsx";

const EQUIPMENT_LABELS = {
  planche: "Planche",
  pull: "Pull-buoy",
  palmes: "Palmes",
  tuba: "Tuba",
  plaquettes: "Plaquettes",
  elastique: "Élastique",
};

export default function WorkoutPrepView({
  session,
  colors: G,
  accent,
  isPremium = true,
  showStart = true,
  startLabel = null,
  onStart,
  onUpgrade,
  lockedPreview = false,
  embedded = false,
}) {
  const view = useMemo(() => buildWorkoutView(session), [session]);
  const [drill, setDrill] = useState(null);
  const locked = !isPremium || lockedPreview;
  const cta = startLabel || (locked ? "Activer l’essai pour nager" : "Commencer la séance");

  const { header, sections } = view;
  const metaBits = [
    header.distanceLabel,
    header.durationLabel,
    header.intensityZone,
  ].filter(Boolean);

  const equipmentLabel = (header.equipment || [])
    .map((id) => EQUIPMENT_LABELS[id] || id)
    .join(" · ");

  return (
    <div>
      {!embedded && (
        <div style={{ marginBottom: 18 }}>
          <h2 style={{
            margin: 0,
            fontSize: 26,
            fontWeight: 800,
            color: G.ink,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
          }}>
            {header.title}
          </h2>
          {metaBits.length > 0 && (
            <div style={{
              marginTop: 8,
              fontSize: 15,
              fontWeight: 700,
              color: G.inkLight,
              lineHeight: 1.35,
            }}>
              {metaBits.join(" · ")}
            </div>
          )}
          {(equipmentLabel || header.intensityCue) && (
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
              {equipmentLabel && (
                <div style={{ fontSize: 13, color: G.grey, fontWeight: 600 }}>
                  Matériel · {equipmentLabel}
                </div>
              )}
              {header.intensityCue && (
                <div style={{ fontSize: 13, color: G.grey, fontWeight: 600 }}>
                  Objectif · {header.intensityCue.charAt(0).toUpperCase() + header.intensityCue.slice(1)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {embedded && (equipmentLabel || header.intensityCue) && (
        <div style={{ marginBottom: 14, display: "flex", flexDirection: "column", gap: 4 }}>
          {equipmentLabel && (
            <div style={{ fontSize: 13, color: G.grey, fontWeight: 600 }}>
              Matériel · {equipmentLabel}
            </div>
          )}
          {header.intensityCue && (
            <div style={{ fontSize: 13, color: G.grey, fontWeight: 600 }}>
              Objectif · {header.intensityCue.charAt(0).toUpperCase() + header.intensityCue.slice(1)}
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {sections.map((section) => (
          <div key={section.id}>
            <div style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: section.id === "warm" ? "#0097A7" : section.id === "cool" ? "#00897B" : G.grey,
              marginBottom: 10,
            }}>
              {section.label}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {section.exercises.map((ex, i) => (
                <div key={ex.id} style={{ filter: locked && i > 1 ? "blur(3px)" : "none", opacity: locked && i > 1 ? 0.75 : 1 }}>
                  <WorkoutExerciseCard
                    exercise={locked && i > 1 ? { ...ex, main: "••••••", cue: "Premium", volumeLabel: "•••", strokeLabel: null, educatif: null, children: [], cues: [] } : ex}
                    colors={G}
                    accent={accent}
                    onOpenDrill={setDrill}
                    compact={embedded}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showStart && (
        <button
          type="button"
          onClick={() => {
            if (locked) onUpgrade?.();
            else onStart?.();
          }}
          style={{
            width: "100%",
            marginTop: 20,
            minHeight: 56,
            border: "none",
            borderRadius: 16,
            background: G.blue,
            color: "#fff",
            fontSize: 16,
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            boxShadow: "0 10px 24px rgba(53,93,163,0.22)",
          }}
        >
          {locked ? <Lock size={18} color="#fff" /> : <Play size={18} color="#fff" fill="#fff" />}
          {cta}
        </button>
      )}

      {drill && <DrillInfoSheet educatif={drill} onClose={() => setDrill(null)} colors={G} />}
    </div>
  );
}
