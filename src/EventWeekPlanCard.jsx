import { Calendar } from "lucide-react";
import { FONT, FONT_DISPLAY } from "./theme/brand.js";
import { G } from "./theme/palette.js";
import { buildEventWeekTimeline } from "./lib/natation-sheet/sheet-week-role.js";

function phaseTone(week) {
  if (week.isRaceWeek) {
    return {
      bg: "rgba(248, 113, 113, 0.12)",
      border: "rgba(248, 113, 113, 0.32)",
      dot: "#f87171",
    };
  }
  if (week.phase === "test") {
    return {
      bg: "rgba(251, 191, 36, 0.12)",
      border: "rgba(251, 191, 36, 0.35)",
      dot: G.gold,
    };
  }
  if (week.phase === "deload") {
    return {
      bg: "rgba(45, 212, 160, 0.10)",
      border: "rgba(45, 212, 160, 0.28)",
      dot: G.mint,
    };
  }
  return {
    bg: "rgba(61, 143, 255, 0.10)",
    border: "rgba(61, 143, 255, 0.22)",
    dot: G.blueMid,
  };
}

/** Planning S-n sur l’accueil : tous les objectifs boucle sauf Nager & Progresser. */
export function shouldShowEventWeekPlan(profile, plan) {
  if (!plan?.isSessionLoop || !profile) return false;
  const goal = String(profile.goal || "").toLowerCase();
  const cat = String(profile.category || "").toLowerCase();
  if (
    cat === "progression"
    || goal === "progression"
    || goal === "nager"
    || goal.startsWith("prog_")
  ) {
    return false;
  }
  return true;
}

export default function EventWeekPlanCard({ plan, profile, onOpenProfile }) {
  if (!shouldShowEventWeekPlan(profile, plan)) return null;

  const spw = Math.max(1, Math.min(5, Number(profile.sessionsPerWeek) || 3));
  const weekIndex = Math.floor((Array.isArray(plan?.history) ? plan.history.length : 0) / spw);
  const planStart =
    plan?.startDate != null
      ? new Date(plan.startDate)
      : profile.planStartedAt || profile.createdAt || null;

  const timeline = buildEventWeekTimeline({
    eventDate: profile.eventDate || null,
    planStart,
    weekIndex,
  });

  if (!timeline.weeks.length) return null;

  const title =
    timeline.mode === "to_race"
      ? "Jusqu’à la course"
      : timeline.mode === "after_race"
        ? "Après la course"
        : "Cycle d’entraînement";

  // Sous-titre calé sur la pastille « cette semaine » (progression plan), pas seulement le calendrier
  const currentS =
    timeline.mode === "to_race" && timeline.current?.sIndex != null
      ? timeline.current.sIndex
      : timeline.weeksBeforeRace;
  const sub =
    timeline.mode === "to_race" && currentS != null
      ? currentS === 0
        ? "Semaine de course"
        : `${currentS} semaine${currentS > 1 ? "s" : ""} avant J`
      : timeline.mode === "cycle" && !profile.eventDate
        ? "Ajoute ta date de course pour caler S0"
        : null;

  return (
    <div
      style={{
        background: G.surface,
        borderRadius: 18,
        padding: "16px",
        marginBottom: 16,
        border: `1px solid ${G.greyLight}`,
        boxShadow: "0 1px 3px rgba(25,28,30,0.03), 0 6px 16px rgba(53,93,163,0.04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <Calendar size={14} color={G.blue} aria-hidden />
            <div style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Planning
            </div>
          </div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700, color: G.ink, letterSpacing: "-0.02em" }}>
            {title}
          </div>
          {sub && (
            <div style={{ fontSize: 12, fontWeight: 600, color: G.inkLight, marginTop: 3 }}>
              {sub}
            </div>
          )}
        </div>
        {timeline.current && (
          <div
            style={{
              flexShrink: 0,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: G.ink,
              background: phaseTone(timeline.current).bg,
              border: `1px solid ${phaseTone(timeline.current).border}`,
              padding: "6px 9px",
              borderRadius: 10,
            }}
          >
            {timeline.current.shortLabel}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 4,
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "thin",
        }}
        role="list"
        aria-label="Semaines du planning"
      >
        {timeline.weeks.map((w) => {
          const tone = phaseTone(w);
          return (
            <div
              key={w.key}
              role="listitem"
              style={{
                flex: "0 0 auto",
                minWidth: 72,
                padding: "10px 11px",
                borderRadius: 12,
                background: w.isCurrent ? tone.bg : G.greyXLight,
                border: w.isCurrent ? `1.5px solid ${tone.border}` : `1px solid ${G.greyLight}`,
                opacity: w.isCurrent ? 1 : 0.85,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 99,
                    background: tone.dot,
                    flexShrink: 0,
                  }}
                  aria-hidden
                />
                <span style={{ fontSize: 11, fontWeight: 800, color: G.ink, fontVariantNumeric: "tabular-nums" }}>
                  {w.sLabel}
                </span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: w.isCurrent ? G.ink : G.inkLight }}>
                {w.shortLabel}
              </div>
              {w.isCurrent && (
                <div style={{ fontSize: 10, fontWeight: 700, color: G.blue, marginTop: 4, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Cette semaine
                </div>
              )}
            </div>
          );
        })}
      </div>

      {timeline.truncated && (
        <p style={{ margin: "10px 0 0", fontSize: 12, color: G.grey, lineHeight: 1.4 }}>
          Puis construction jusqu’à S-6, allégée S-1, course en S0.
        </p>
      )}

      {!profile.eventDate && onOpenProfile && (
        <button
          type="button"
          onClick={onOpenProfile}
          style={{
            width: "100%",
            marginTop: 12,
            padding: "10px",
            borderRadius: 12,
            border: "none",
            background: G.blueLight,
            color: G.blue,
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            fontFamily: FONT,
          }}
        >
          Renseigner la date de course
        </button>
      )}
    </div>
  );
}
