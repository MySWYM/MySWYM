import { useState } from "react";
import { ANC_TRACK_ID } from "../lib/swim-school/anc-track.js";
import { getSchoolCourse } from "../lib/swim-school/catalog.js";
import { currentTrackStepId, isSchoolCourseUnlocked } from "../lib/swim-school/progress.js";
import SchoolListScreen from "./SchoolListScreen.jsx";
import SchoolExerciseScreen from "./SchoolExerciseScreen.jsx";
import "./school.css";

/**
 * École : liste (Accueil) → page exercice type GOWOD (soft mist).
 * Multi-cours via courseId / trackId.
 */
export default function SchoolScreen({
  profile,
  user,
  courseId = "crawl",
  onBack,
  onOpenMenu,
  onProgress,
  onSchoolUpgrade = null,
  hasSessionAccess = false,
  onUpgrade,
}) {
  const course = getSchoolCourse(courseId) || getSchoolCourse("crawl");
  const trackId = course?.trackId || ANC_TRACK_ID;
  const unlocked = isSchoolCourseUnlocked(course?.id || "crawl", profile);
  const [stepId, setStepId] = useState(null);

  if (!unlocked) {
    return (
      <SchoolListScreen
        profile={profile}
        user={user}
        trackId={trackId}
        courseLocked
        onBack={onBack}
        onOpenMenu={onOpenMenu}
        onOpenStep={null}
      />
    );
  }

  if (stepId) {
    return (
      <SchoolExerciseScreen
        trackId={trackId}
        stepId={stepId}
        profile={profile}
        user={user}
        onBack={() => setStepId(null)}
        onOpenMenu={onOpenMenu}
        onProgress={onProgress}
        onChangeStep={setStepId}
        onSchoolUpgrade={onSchoolUpgrade}
        hasSessionAccess={hasSessionAccess}
        onUpgrade={onUpgrade}
      />
    );
  }

  return (
    <SchoolListScreen
      profile={profile}
      user={user}
      trackId={trackId}
      onBack={onBack}
      onOpenMenu={onOpenMenu}
      onOpenStep={(id) => setStepId(id || currentTrackStepId(profile?.schoolProgress, trackId))}
    />
  );
}
