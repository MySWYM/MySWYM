import { useTranslation } from "react-i18next";
import { Check, ChevronRight, Lock } from "lucide-react";
import { ANC_TRACK_ID } from "../lib/swim-school/anc-track.js";
import { getSchoolCourseByTrack, getTrackSteps } from "../lib/swim-school/catalog.js";
import { chaptersForTrack, stepNumberFromId } from "../lib/swim-school/chapters.js";
import {
  currentTrackStepId,
  isAncCrawlUnlocked,
  schoolStepView,
  trackDoneCount,
} from "../lib/swim-school/progress.js";
import { playUiSound } from "../lib/ui-sounds.js";
import { getTabUi } from "../tab-ui-registry.js";

export default function SchoolListScreen({
  profile,
  user,
  trackId = ANC_TRACK_ID,
  courseLocked = false,
  onBack,
  onOpenMenu,
  onOpenStep,
}) {
  const { t } = useTranslation("app");
  const { AppTopBar } = getTabUi();
  const progress = profile?.schoolProgress;
  const course = getSchoolCourseByTrack(trackId);
  const steps = getTrackSteps(trackId);
  const chapters = chaptersForTrack(trackId);
  const done = trackDoneCount(progress, trackId);
  const unlockedPlan = trackId === ANC_TRACK_ID && isAncCrawlUnlocked(progress);
  const currentId = currentTrackStepId(progress, trackId);
  const titleKey = course?.titleKey || "school.crawl";

  return (
    <div className="ms-school">
      <AppTopBar
        user={user}
        onOpenMenu={onOpenMenu}
        onBack={onBack}
        onAvatarClick={onBack}
      />
      <div className="app-shell ms-school-body">
        <div className="ms-school-top">
          <div>
            <p className="ms-type-label ms-school-kicker">{t("school.title")}</p>
            <h1 className="ms-type-page ms-school-title">{t(titleKey)}</h1>
          </div>
          <p className="ms-school-count">{t("school.progress", { done, total: steps.length })}</p>
        </div>

        <p className="ms-type-body ms-school-lead">{t("school.listLead")}</p>

        {courseLocked ? (
          <div className="ms-glass-card ms-school-ready" role="status">
            {t(course?.lockedBodyKey || "school.courseLockedBody")}
          </div>
        ) : null}

        {unlockedPlan ? (
          <div className="ms-glass-card ms-school-ready" role="status">
            {t("school.planReady")}
          </div>
        ) : null}

        {!courseLocked ? (
          <div className="ms-school-list">
            {chapters.map((ch) => (
              <section key={ch.id} className="ms-school-list-chapter">
                <h2 className="ms-school-list-chapter-title">{t(ch.titleKey)}</h2>
                <ul className="ms-school-list-rows">
                  {ch.stepIds.map((id) => {
                    const step = steps.find((s) => s.id === id);
                    const v = schoolStepView(progress, trackId, id);
                    const n = stepNumberFromId(id, trackId);
                    const isCurrent = id === currentId && !v?.done;
                    const cls = [
                      "ms-school-list-row",
                      v?.done ? "is-done" : "",
                      isCurrent ? "is-current" : "",
                      !v?.unlocked ? "is-locked" : "",
                    ]
                      .filter(Boolean)
                      .join(" ");
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          className={cls}
                          disabled={!v?.unlocked}
                          onClick={() => {
                            if (!v?.unlocked) return;
                            playUiSound("soft");
                            onOpenStep?.(id);
                          }}
                        >
                          <span className="ms-school-list-num" aria-hidden>
                            {v?.done ? <Check size={16} strokeWidth={2.5} /> : n}
                          </span>
                          <span className="ms-school-list-copy">
                            <span className="ms-school-list-title">{step?.title}</span>
                            {isCurrent ? (
                              <span className="ms-school-list-meta">{t("school.currentStep")}</span>
                            ) : !v?.unlocked ? (
                              <span className="ms-school-list-meta">{t("school.locked")}</span>
                            ) : v?.done ? (
                              <span className="ms-school-list-meta">{t("school.stepDone")}</span>
                            ) : null}
                          </span>
                          <span className="ms-school-list-trail" aria-hidden>
                            {!v?.unlocked ? (
                              <Lock size={16} strokeWidth={2.25} />
                            ) : (
                              <ChevronRight size={18} strokeWidth={2.25} />
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
