/**
 * Sheet iOS : changer l’objectif (famille → cible → date).
 * Pas le questionnaire complet. Enregistrer confirme côté parent.
 */
import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import SoftMistSheet from "../sheets/SoftMistSheet.jsx";
import { CATEGORIES, SUB_GOALS } from "../lib/onboarding-catalog.jsx";
import {
  familyIdFromProfile,
  familyNeedsSub,
  familyNeedsDate,
  buildGoalPatch,
  todayIsoDate,
} from "../lib/profile-goal.js";

const LIVE_FAMILIES = CATEGORIES.filter((c) => !c.comingSoon);

function stepTitle(step) {
  if (step === "sub") return "Quelle distance ?";
  if (step === "date") return "Date de l’épreuve";
  return "Ton objectif";
}

function stepSubtitle(step) {
  if (step === "family") return "On adapte tes prochaines séances. Tes semaines déjà nagées restent.";
  if (step === "sub") return "Choisis le format visé.";
  return "Le jour de la course, si tu le connais.";
}

export default function IosGoalPickerSheet({ open, profile, onClose, onCommit }) {
  const [step, setStep] = useState("family");
  const [category, setCategory] = useState("progression");
  const [goal, setGoal] = useState("progression");
  const [eventDate, setEventDate] = useState("");

  useEffect(() => {
    if (!open) return;
    const family = familyIdFromProfile(profile);
    const live = family === "diplome" ? "progression" : family;
    setCategory(live);
    setGoal(live === "progression" ? "progression" : String(profile?.goal || ""));
    setEventDate(String(profile?.eventDate || "").slice(0, 10));
    setStep("family");
  }, [open, profile]);

  const subs = SUB_GOALS[category] || [];
  const canSaveFamily = category === "progression";
  const canSaveSub = familyNeedsSub(category) && !!goal && subs.some((s) => s.id === goal);
  const canSaveDate = familyNeedsDate(category) && /^\d{4}-\d{2}-\d{2}$/.test(eventDate);

  const commit = () => {
    const patch = buildGoalPatch({ category, goal, eventDate });
    if (familyNeedsSub(category) && !patch.goal) return;
    if (familyNeedsDate(category) && !patch.eventDate) return;
    onCommit?.(patch);
  };

  const pickFamily = (id) => {
    setCategory(id);
    if (id === "progression") {
      setGoal("progression");
      setEventDate("");
      return;
    }
    const nextSubs = SUB_GOALS[id] || [];
    const keep = nextSubs.some((s) => s.id === goal) ? goal : "";
    setGoal(keep);
    setStep("sub");
  };

  const pickSub = (id) => {
    setGoal(id);
    if (familyNeedsDate(category)) {
      setStep("date");
      return;
    }
  };

  const back = () => {
    if (step === "date") {
      setStep(familyNeedsSub(category) ? "sub" : "family");
      return;
    }
    if (step === "sub") setStep("family");
  };

  const footer = (() => {
    if (step === "family" && canSaveFamily) {
      return (
        <button type="button" className="ms-pill-cta" style={{ width: "100%" }} onClick={commit}>
          Enregistrer
        </button>
      );
    }
    if (step === "sub" && canSaveSub && familyNeedsDate(category)) {
      return (
        <button type="button" className="ms-pill-cta" style={{ width: "100%" }} onClick={() => setStep("date")}>
          Continuer
        </button>
      );
    }
    if (step === "sub" && canSaveSub && !familyNeedsDate(category)) {
      return (
        <button type="button" className="ms-pill-cta" style={{ width: "100%" }} onClick={commit}>
          Enregistrer
        </button>
      );
    }
    if (step === "date") {
      return (
        <button
          type="button"
          className="ms-pill-cta"
          style={{ width: "100%" }}
          disabled={!canSaveDate}
          onClick={commit}
        >
          Enregistrer
        </button>
      );
    }
    return null;
  })();

  return (
    <SoftMistSheet
      open={open}
      title={stepTitle(step)}
      subtitle={stepSubtitle(step)}
      onClose={onClose}
      fullscreenMobile
      footer={footer}
    >
      {step !== "family" ? (
        <button type="button" className="ios-goal-back" onClick={back}>
          <ChevronLeft size={18} strokeWidth={2.2} />
          Retour
        </button>
      ) : null}

      {step === "family" ? (
        <div className="ios-goal-options">
          {LIVE_FAMILIES.map((c) => {
            const active = category === c.id;
            return (
              <button
                key={c.id}
                type="button"
                className={`ios-goal-option${active ? " is-active" : ""}`}
                onClick={() => pickFamily(c.id)}
              >
                <span className="ios-goal-option-title">{c.label}</span>
                <span className="ios-goal-option-desc">{c.desc}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {step === "sub" ? (
        <div className="ios-goal-options">
          {subs.map((s) => {
            const active = goal === s.id;
            return (
              <button
                key={s.id}
                type="button"
                className={`ios-goal-option${active ? " is-active" : ""}`}
                onClick={() => pickSub(s.id)}
              >
                <span className="ios-goal-option-title">{s.label}</span>
                {s.dist ? <span className="ios-goal-option-desc">{s.dist}</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {step === "date" ? (
        <label className="ios-person-field">
          <span>Date</span>
          <input
            type="date"
            min={todayIsoDate()}
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
        </label>
      ) : null}
    </SoftMistSheet>
  );
}
