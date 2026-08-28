/**
 * Vue synthèse / préparation d’une séance (pas le mode bassin).
 * 3 blocs phase : Échauffement · Corps · Retour au calme.
 */
import { useEffect, useMemo, useState } from "react";
import { Play, Lock, Check, Copy } from "lucide-react";
import { buildWorkoutView } from "../lib/workout-display.js";
import { formatLoopSessionTitle } from "../lib/swim-plan-bridge.js";
import { buildSessionProvenance } from "../lib/session-provenance.js";
import { setSupportSessionRef } from "../lib/support-context.js";
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

function phaseTone(sectionId, G) {
  if (sectionId === "warm") {
    return {
      accent: "#3d8fff",
      border: "rgba(61, 143, 255, 0.28)",
      headerBg: "rgba(61, 143, 255, 0.10)",
    };
  }
  if (sectionId === "cool") {
    return {
      accent: "#5eead4",
      border: "rgba(94, 234, 212, 0.22)",
      headerBg: "rgba(94, 234, 212, 0.08)",
    };
  }
  return {
    accent: "#f87171",
    border: "rgba(248, 113, 113, 0.28)",
    headerBg: "rgba(248, 113, 113, 0.10)",
  };
}

export default function WorkoutPrepView({
  session,
  colors: G,
  accent,
  isPremium = true,
  showStart = true,
  startLabel = null,
  onStart,
  onUpgrade,
  onTooHard,
  whyLine = null,
  lockedPreview = false,
  embedded = false,
  /** Si number : force le titre « Séance n°X » (index = validations, 0 → n°1). */
  loopCursor = null,
  /** Contexte support : permet de retrouver l'onglet / la ligne Sheet. */
  profile = null,
  planId = null,
  showProvenance = true,
}) {
  const view = useMemo(() => buildWorkoutView(session), [session]);
  const [drill, setDrill] = useState(null);
  const [refCopied, setRefCopied] = useState(false);
  const locked = !isPremium || lockedPreview;
  const cta = startLabel || (locked ? "Activer l’essai pour nager" : "Commencer la séance");

  const provenance = useMemo(
    () => buildSessionProvenance(session, { loopOrdinal: loopCursor, profile, planId }),
    [session, loopCursor, profile, planId],
  );

  useEffect(() => {
    if (!showProvenance || !provenance?.supportLine) return;
    setSupportSessionRef(provenance.supportLine);
  }, [showProvenance, provenance?.supportLine]);

  const copyRef = async () => {
    if (!provenance?.supportLine) return;
    try {
      await navigator.clipboard.writeText(provenance.supportLine);
      setRefCopied(true);
      setTimeout(() => setRefCopied(false), 2000);
    } catch {
      /* clipboard indisponible (http, permissions) — la réf reste lisible à l'écran */
    }
  };

  const { header, sections } = view;
  const displayTitle = loopCursor != null
    ? formatLoopSessionTitle(loopCursor)
    : header.title;
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
            fontFamily: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
            fontSize: 26,
            fontWeight: 700,
            color: G.ink,
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
          }}>
            {displayTitle}
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
          {session?.sheetWeekRole?.banner ? (
            <div
              style={{
                marginTop: 12,
                padding: "12px 14px",
                borderRadius: 14,
                background: session.sheetWeekRole.isRaceWeek
                  ? "rgba(248, 113, 113, 0.12)"
                  : session.sheetWeekRole.phase === "test"
                    ? "rgba(251, 191, 36, 0.14)"
                    : "rgba(61, 143, 255, 0.10)",
                border: `1px solid ${
                  session.sheetWeekRole.isRaceWeek
                    ? "rgba(248, 113, 113, 0.28)"
                    : session.sheetWeekRole.phase === "test"
                      ? "rgba(251, 191, 36, 0.35)"
                      : "rgba(61, 143, 255, 0.22)"
                }`,
                fontSize: 13,
                fontWeight: 600,
                color: G.inkLight,
                lineHeight: 1.45,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: G.ink, marginBottom: 4 }}>
                {session.sheetWeekRole.label}
              </div>
              {session.sheetWeekRole.banner}
            </div>
          ) : null}
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

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {sections.map((section) => {
          const tone = phaseTone(section.id, G);
          return (
            <section
              key={section.id}
              aria-label={section.label}
              style={{
                borderRadius: 18,
                border: `1px solid ${tone.border}`,
                background: G.surface,
                overflow: "hidden",
              }}
            >
              <header style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 12,
                padding: embedded ? "12px 14px" : "14px 16px",
                background: tone.headerBg,
                borderBottom: `1px solid ${tone.border}`,
              }}>
                <div style={{
                  fontFamily: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  color: tone.accent,
                }}>
                  {section.label}
                </div>
                {section.metersLabel && (
                  <div style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: G.inkLight,
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    {section.metersLabel}
                  </div>
                )}
              </header>
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: 0,
                padding: embedded ? "6px 8px 10px" : "8px 10px 12px",
              }}>
                {section.exercises.map((ex, i) => (
                  <div
                    key={ex.id}
                    style={{
                      filter: locked && section.id === "main" && i > 1 ? "blur(3px)" : "none",
                      opacity: locked && section.id === "main" && i > 1 ? 0.75 : 1,
                      marginTop: i === 0 ? 0 : 8,
                    }}
                  >
                    <WorkoutExerciseCard
                      exercise={locked && section.id === "main" && i > 1
                        ? { ...ex, main: "••••••", cue: "Premium", volumeLabel: "•••", strokeLabel: null, educatif: null, educatifs: null, children: [], cues: [] }
                        : ex}
                      colors={G}
                      accent={{ bg: tone.headerBg, color: tone.accent }}
                      onOpenDrill={setDrill}
                      compact={embedded}
                      nested
                    />
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {showProvenance && provenance && (
        <button
          type="button"
          onClick={copyRef}
          title={provenance.shortLabel}
          aria-label={`Copier la référence séance ${provenance.refCode} pour le support`}
          style={{
            marginTop: 12,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 10px",
            minHeight: 32,
            borderRadius: 999,
            border: `1px solid ${G.greyLight}`,
            background: "transparent",
            color: G.greyMid,
            fontSize: 11,
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
            cursor: "pointer",
          }}
        >
          {refCopied
            ? <Check size={12} color={G.mint} strokeWidth={3} />
            : <Copy size={12} color={G.greyMid} />}
          {refCopied ? "Réf. copiée" : `Réf. ${provenance.refCode}`}
        </button>
      )}

      {whyLine && (
        <p style={{
          margin: "14px 0",
          padding: "10px 12px",
          borderRadius: 12,
          background: G.blueLight,
          border: `1px solid ${G.greyLight}`,
          fontSize: 13,
          lineHeight: 1.45,
          color: G.ink,
          fontWeight: 600,
        }}>
          {whyLine}
        </p>
      )}

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

      {onTooHard && !locked && (
        <button
          type="button"
          onClick={onTooHard}
          style={{
            width: "100%",
            marginTop: 10,
            minHeight: 44,
            border: `1.5px solid ${G.greyLight}`,
            borderRadius: 12,
            background: "transparent",
            color: G.grey,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Trop dure pour moi — alléger la suite
        </button>
      )}

      {drill && (
        <DrillInfoSheet
          educatif={Array.isArray(drill) ? undefined : drill}
          educatifs={Array.isArray(drill) ? drill : undefined}
          onClose={() => setDrill(null)}
          colors={G}
        />
      )}
    </div>
  );
}
