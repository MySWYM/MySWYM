import SoftMistSheet from "./SoftMistSheet.jsx";
import { X } from "lucide-react";
import { G } from "../theme/palette.js";
import WorkoutPrepView from "../workout/WorkoutPrepView.jsx";
import { isSessionResolved } from "../lib/plan-progress-merge.js";
import { playUiSound } from "../lib/ui-sounds.js";
import "../home/ios-home-deck.css";

/**
 * Préparation / détail séance en sheet soft mist (pas de déplié inline).
 */
export default function SessionPrepSheet({
  open,
  session,
  colors = G,
  accent,
  isPremium = true,
  profile = null,
  planId = null,
  whyLine = null,
  showStart = true,
  startLabel = null,
  sheetTitle = null,
  sheetSub = null,
  onClose,
  onUpgrade,
  onStart,
  onMark = null,
  exportBar = null,
}) {
  if (!open || !session) return null;
  const canMark = typeof onMark === "function" && !isSessionResolved(session);
  const compact = Boolean(sheetTitle);

  const mark = (status) => {
    playUiSound(status === "done" ? "tap" : "soft");
    if (!isPremium) {
      onUpgrade?.("session_locked");
      return;
    }
    onMark(status);
  };

  return (
    <SoftMistSheet
      open={open}
      eyebrow={compact ? null : (showStart ? "Préparation" : "Séance")}
      title={compact ? sheetTitle : (showStart ? "Vérifie ta séance avant d’aller nager" : "Détail de la séance")}
      subtitle={compact ? (sheetSub || null) : null}
      onClose={onClose}
      ariaLabel={compact ? sheetTitle : (showStart ? "Préparation de la séance" : "Détail de la séance")}
      fullscreenMobile
      bodyClassName="ms-soft-sheet-body--tall"
      zIndex={400}
      footer={canMark ? (
        <div className="ios-session-mark">
          <button
            type="button"
            className="ios-session-mark-skip"
            aria-label="Pas nagée"
            onClick={() => mark("not_done")}
          >
            <X size={22} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            className="ms-pill-cta"
            onClick={() => mark("done")}
          >
            Valider
          </button>
        </div>
      ) : null}
    >
      <WorkoutPrepView
        session={session}
        colors={colors}
        accent={accent}
        isPremium={isPremium}
        showStart={showStart}
        startLabel={startLabel}
        profile={profile}
        planId={planId}
        whyLine={whyLine}
        onUpgrade={onUpgrade}
        onStart={onStart}
        embedded={compact}
      />
      {exportBar}
    </SoftMistSheet>
  );
}
