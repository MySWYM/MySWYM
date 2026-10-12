import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import useEmblaCarousel from "embla-carousel-react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import SoftMistSheet from "../sheets/SoftMistSheet.jsx";
import { ANC_TRACK_ID } from "../lib/swim-school/anc-track.js";
import { nextTrackStepId, prevTrackStepId } from "../lib/swim-school/catalog.js";
import { chapterForStepId, stepNumberFromId } from "../lib/swim-school/chapters.js";
import { SCHOOL_GLOSSARY } from "../lib/swim-school/glossary.js";
import { schoolGearForStep } from "../lib/swim-school/motion-scenes.js";
import { applySchoolResult, schoolStepView } from "../lib/swim-school/progress.js";
import { playUiSound } from "../lib/ui-sounds.js";
import { getTabUi } from "../tab-ui-registry.js";
import SchoolMotion from "./SchoolMotion.jsx";
import SchoolRichText from "./SchoolRichText.jsx";

const EQUIP_IMG = {
  palmes: "/equip-palmes.webp",
  tuba: "/equip-tuba.webp",
};

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function SchoolExerciseScreen({
  trackId = ANC_TRACK_ID,
  stepId,
  profile,
  user,
  onBack,
  onOpenMenu,
  onProgress,
  onChangeStep,
  hasSessionAccess = false,
  onUpgrade,
}) {
  const { t } = useTranslation("app");
  const { AppTopBar } = getTabUi();
  const progress = profile?.schoolProgress;
  const view = useMemo(() => schoolStepView(progress, trackId, stepId), [progress, trackId, stepId]);
  const [termKey, setTermKey] = useState(null);
  /** @type {[{ n: number, title: string, nextId: string | null } | null, Function]} */
  const [congrats, setCongrats] = useState(null);
  const gear = useMemo(() => schoolGearForStep(stepId), [stepId]);
  const chapter = chapterForStepId(stepId, trackId);
  const stepNo = stepNumberFromId(stepId, trackId);
  const prevId = prevTrackStepId(trackId, stepId);
  const nextId = nextTrackStepId(trackId, stepId);
  const term = termKey ? SCHOOL_GLOSSARY[termKey] : null;
  const nextUnlocked = nextId && schoolStepView(progress, trackId, nextId)?.unlocked;

  const cards = useMemo(() => {
    if (!view) return [];
    /** @type {{ key: string, titleKey: string, body: string }[]} */
    const list = [
      { key: "objectif", titleKey: "school.objectif", body: view.objectif },
      { key: "cue", titleKey: "school.consigne", body: view.cue },
      { key: "reussi", titleKey: "school.reussiSi", body: view.bonSi },
    ];
    if (view.avoid) {
      list.push({ key: "avoid", titleKey: "school.avoid", body: view.avoid });
    }
    return list;
  }, [view]);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    duration: prefersReducedMotion() ? 0 : 22,
    align: "start",
  });
  const [cardIndex, setCardIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCardIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return undefined;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect, stepId]);

  useEffect(() => {
    emblaApi?.scrollTo(0, true);
    setCardIndex(0);
  }, [emblaApi, stepId]);

  const openTerm = (key) => {
    playUiSound("soft");
    setTermKey(key);
  };

  const finishCongrats = () => {
    const nextStep = congrats?.nextId || null;
    setCongrats(null);
    playUiSound("soft");
    if (nextStep) onChangeStep?.(nextStep);
    else onBack?.();
  };

  const goAfterDone = () => {
    playUiSound("soft");
    if (nextUnlocked) onChangeStep?.(nextId);
    else onBack?.();
  };

  const validate = () => {
    if (!hasSessionAccess) {
      onUpgrade?.("trial_required");
      return;
    }
    if (!view?.unlocked || view.done || congrats) return;
    playUiSound("tap");
    const next = applySchoolResult(progress, trackId, stepId, "yes");
    onProgress?.(next);
    const after = schoolStepView(next, trackId, stepId);
    if (!after?.done) return;
    setCongrats({
      n: stepNo,
      title: view.title,
      nextId: after.nextId || null,
    });
  };

  if (!view) return null;

  return (
    <div className="ms-school ms-school-ex">
      <AppTopBar
        user={user}
        onOpenMenu={onOpenMenu}
        onBack={onBack}
        onAvatarClick={onBack}
      />
      <div className="app-shell ms-school-body ms-school-ex-body">
        <div className="ms-school-ex-nav ms-school-glass-block">
          <button
            type="button"
            className="ms-school-nav-arrow"
            disabled={!prevId}
            aria-label={t("school.prev")}
            onClick={() => prevId && onChangeStep?.(prevId)}
          >
            <ChevronLeft size={22} strokeWidth={2.25} />
          </button>
          <div className="ms-school-nav-center">
            {chapter ? <p className="ms-school-nav-chapter">{t(chapter.titleKey)}</p> : null}
            <p className="ms-school-nav-step">
              {t("school.stepHeading", { n: stepNo })}
            </p>
          </div>
          <button
            type="button"
            className="ms-school-nav-arrow"
            disabled={!nextUnlocked}
            aria-label={t("school.next")}
            onClick={() => {
              if (nextUnlocked) onChangeStep?.(nextId);
            }}
          >
            <ChevronRight size={22} strokeWidth={2.25} />
          </button>
        </div>

        <section className="ms-school-glass-block ms-school-ex-hero">
          <SchoolMotion stepId={stepId} showCaption={false} />

          <h1 className="ms-school-ex-title">
            <SchoolRichText text={view.title} onTerm={openTerm} />
          </h1>

          {view.dosage ? (
            <p className="ms-school-dosage ms-school-ex-dosage">{view.dosage}</p>
          ) : null}

          {gear.length ? (
            <div className="ms-school-ex-gear-row">
              <span className="ms-school-gear-opt-lead">{t("school.gear.optional")}</span>
              {gear.map((g) => (
                <div key={g.id} className="ms-school-gear-chip" title={t(g.hintKey)}>
                  <img
                    className="ms-school-gear-img"
                    src={EQUIP_IMG[g.id] || EQUIP_IMG.palmes}
                    alt=""
                    width={28}
                    height={28}
                    decoding="async"
                  />
                  <span className="ms-school-gear-label">{t(g.labelKey)}</span>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        {!view.unlocked ? (
          <p className="ms-type-body ms-school-glass-block ms-school-ex-locked">{t("school.locked")}</p>
        ) : (
          <section
            className="ms-school-glass-block ms-school-ex-details"
            aria-label={t("school.detailCarousel")}
          >
            <div
              className="ms-school-carousel"
              role="region"
              aria-roledescription="carousel"
              aria-label={t("school.detailCarousel")}
            >
              <div className="ms-school-carousel-viewport" ref={emblaRef}>
                <div className="ms-school-carousel-track">
                  {cards.map((card) => (
                    <article key={card.key} className="ms-school-carousel-slide ms-school-glass-inner">
                      <h2 className="ms-school-carousel-h">{t(card.titleKey)}</h2>
                      <p className="ms-type-body">
                        <SchoolRichText text={card.body} onTerm={openTerm} />
                      </p>
                    </article>
                  ))}
                </div>
              </div>
              <div className="ms-school-carousel-dots">
                {cards.map((card, i) => (
                  <button
                    key={card.key}
                    type="button"
                    className={`ms-school-carousel-dot${i === cardIndex ? " is-active" : ""}`}
                    aria-label={t(card.titleKey)}
                    aria-current={i === cardIndex ? "true" : undefined}
                    onClick={() => emblaApi?.scrollTo(i)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {view.unlocked && !view.done && !congrats ? (
        <div className="ms-school-validate-bar">
          <button
            type="button"
            className="ms-school-validate-btn"
            onClick={validate}
          >
            <span className="ms-school-validate-ico" aria-hidden>
              <Check size={28} strokeWidth={2.75} />
            </span>
            <span className="ms-school-validate-label">{t("school.validate")}</span>
          </button>
        </div>
      ) : null}

      {view.unlocked && view.done && !congrats ? (
        <div className="ms-school-validate-bar">
          <button
            type="button"
            className="ms-school-validated-btn"
            onClick={goAfterDone}
          >
            <span className="ms-school-validated-ico" aria-hidden>
              <Check size={22} strokeWidth={2.75} />
            </span>
            <span>{t("school.stepDone")}</span>
          </button>
        </div>
      ) : null}

      {congrats ? (
        <SoftMistSheet
          eyebrow={t("school.stepDone")}
          title={t("school.congratsTitle")}
          icon={
            <span className="ms-school-congrats-ico" aria-hidden>
              <Check size={28} strokeWidth={2.75} />
            </span>
          }
          onClose={finishCongrats}
          lockScroll={false}
          zIndex={570}
        >
          <p className="ms-tip-lead">
            {t("school.congratsBody", { n: congrats.n, title: congrats.title })}
          </p>
          <button
            type="button"
            className="ms-school-congrats-cta"
            onClick={finishCongrats}
          >
            {t("school.congratsContinue")}
          </button>
        </SoftMistSheet>
      ) : null}

      {term && !congrats ? (
        <SoftMistSheet
          eyebrow={t("school.termEyebrow")}
          title={term.title}
          onClose={() => setTermKey(null)}
          lockScroll={false}
          zIndex={560}
        >
          <p className="ms-tip-lead" style={{ margin: 0 }}>
            {term.body}
          </p>
        </SoftMistSheet>
      ) : null}
    </div>
  );
}
