import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import SoftMistSheet from "./SoftMistSheet.jsx";
import ConfirmSheet from "./ConfirmSheet.jsx";
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
  const [confirmAbandon, setConfirmAbandon] = useState(false);

  useEffect(() => {
    if (!open) setConfirmAbandon(false);
  }, [open]);

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

  const requestAbandon = () => {
    playUiSound("soft");
    if (!isPremium) {
      onUpgrade?.("session_locked");
      return;
    }
    setConfirmAbandon(true);
  };

  return (
    <>
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
              aria-label="Abandonner la séance"
              onClick={requestAbandon}
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
      {confirmAbandon && createPortal(
        <ConfirmSheet
          title="Abandonner cette séance ?"
          message="Elle quitte ton plan et va dans l’Historique comme abandonnée. La suivante prend sa place. Pour juste fermer l’écran, utilise la croix en haut."
          confirmLabel="Oui, abandonner"
          cancelLabel="Non, garder la séance"
          destructive
          icon={X}
          zIndex={520}
          onConfirm={() => {
            setConfirmAbandon(false);
            mark("not_done");
          }}
          onCancel={() => {
            playUiSound("soft");
            setConfirmAbandon(false);
          }}
        />,
        document.body,
      )}
    </>
  );
}
