import { useState, useEffect } from "react";
import {
  Award, Lock, Flame, Waves, Trophy, TrendingUp,
} from "lucide-react";
import { FONT, FONT_DISPLAY } from "./theme/brand.js";
import { G } from "./theme/palette.js";
import CoachCard from "./CoachCard.jsx";
import ProfileNudgeCard from "./ProfileNudgeCard.jsx";
import SessionHeroCard from "./SessionHeroCard.jsx";
import EventWeekPlanCard from "./EventWeekPlanCard.jsx";
import PoolMode from "./workout/PoolMode.jsx";
import Btn from "./ui/Btn.jsx";
import WeekStatRing from "./ui/WeekStatRing.jsx";
import AllureUnlockSheet from "./sheets/AllureUnlockSheet.jsx";
import SessionPrepSheet from "./sheets/SessionPrepSheet.jsx";
import TrialCountdownBanner from "./ui/TrialCountdownBanner.jsx";
import { track, sessionAnalyticsProps } from "./lib/analytics.js";
import {
  getSessionRemindersEnabled,
  shouldShowSessionReminderBanner,
  sessionReminderCopy,
} from "./lib/session-reminder.js";
import { findNextSession, sessionCardModel, sessionWhyLine } from "./lib/plan-reveal.js";
import {
  dismissProfileNudge,
  isProfileNudgeDismissed,
  shouldShowProfileNudge,
} from "./lib/profile-nudge.js";
import {
  hasSeenAllureUnlockTip,
  shouldShowAllureUnlockTip,
} from "./lib/allure-unlock-tip.js";
import { isSessionResolved } from "./lib/plan-progress-merge.js";
import { ACCESS_STATUS } from "./lib/access.js";
import { BADGE_DEFS, computeStats, checkBadges } from "./lib/plan-stats.js";
import { getTabUi } from "./tab-ui-registry.js";

/** Badges sur l’accueil / profil : colorés si débloqués, grisés sinon. */
export function HomeBadgesSection({ plan }) {
  const stats = computeStats(plan);
  const earned = checkBadges(stats);
  const earnedSet = new Set(earned);
  return (
    <div style={{
      background: G.surface, borderRadius: 20, padding: "18px",
      boxShadow: "0 1px 3px rgba(25,28,30,0.03), 0 8px 20px rgba(53,93,163,0.05)",
      border: `1px solid ${G.greyLight}`,
      marginBottom: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Award size={16} color={G.blue} />
          <div style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: "0.06em", textTransform: "uppercase" }}>Badges</div>
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color: G.blue, fontVariantNumeric: "tabular-nums" }}>
          {earned.length}/{BADGE_DEFS.length}
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px 8px" }}>
        {BADGE_DEFS.map(b => {
          const unlocked = earnedSet.has(b.id);
          return (
            <div
              key={b.id}
              title={unlocked ? b.desc : `À débloquer, ${b.desc}`}
              style={{ textAlign: "center", minWidth: 0 }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                margin: "0 auto 6px",
                background: unlocked ? `${b.color}20` : G.greyXLight,
                border: unlocked ? `1.5px solid ${b.color}40` : `1.5px solid ${G.greyLight}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative",
                boxShadow: unlocked ? `0 4px 12px ${b.color}22` : "none",
                filter: unlocked ? "none" : "grayscale(1)",
                opacity: unlocked ? 1 : 0.45,
              }}>
                <b.icon size={20} color={unlocked ? b.color : G.greyMid} />
                {!unlocked && (
                  <div style={{
                    position: "absolute", bottom: -2, right: -2,
                    width: 16, height: 16, borderRadius: "50%",
                    background: G.surface, border: `1px solid ${G.greyLight}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Lock size={9} color={G.greyMid} />
                  </div>
                )}
              </div>
              <div style={{
                fontSize: 12, fontWeight: unlocked ? 700 : 600,
                color: unlocked ? G.ink : G.greyMid,
                lineHeight: 1.25,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}>
                {b.label}
              </div>
            </div>
          );
        })}
      </div>
      {earned.length === 0 ? (
        <p style={{ fontSize: 13, color: G.grey, margin: "12px 0 0", lineHeight: 1.5 }}>
          Valide ta première séance pour débloquer ton premier badge.
        </p>
      ) : earned.length < BADGE_DEFS.length ? (
        <p style={{ fontSize: 12, color: G.grey, margin: "12px 0 0", lineHeight: 1.45 }}>
          Complète des séances pour débloquer les badges grisés.
        </p>
      ) : null}
    </div>
  );
}

// ── DASHBOARD ──────────────────────────────────────────────────────────────
/** Après 2+ séances validées : coach, allure, Strava et badges. */
function HomeSecondaryStack({
  plan, profile, user, isPremium, onUpgrade, onPaceUpdate, onValidateSession,
}) {
  const { MonAllureCard, StravaSection } = getTabUi();
  const coachWeek = plan?.weeks?.length
    ? Math.max(0, plan.weeks.findIndex((w) => !(w.sessions || []).every(isSessionResolved)))
    : 0;

  return (
    <>
      {isPremium && plan?.weeks?.length > 0 && (
        <CoachCard plan={plan} profile={profile} currentWeekIndex={coachWeek} />
      )}
      {plan && (
        <MonAllureCard
          profile={profile}
          pace100={profile?.pace100}
          isPremium={isPremium}
          onSave={onPaceUpdate}
          onUpgrade={onUpgrade}
        />
      )}
      <StravaSection
        user={user}
        plan={plan}
        profile={profile}
        currentPace100={profile?.pace100}
        onPaceUpdate={onPaceUpdate}
        onValidateSession={onValidateSession}
        showProgramActions={false}
        isPremium={isPremium}
        onUpgrade={onUpgrade}
      />
      {plan && <HomeBadgesSection plan={plan} />}
    </>
  );
}
export default function Dashboard({
  plan, profile, onTabChange, onSignOut, user,
  isPremium = false, onComplete, onRegenerateLoop, onUpgrade, onReset, onShare, onEditFeedback, onPaceUpdate, onValidateSession, onOpenMenu,
  activePlanId = null,
  accessState = null,
}) {
  const {
    AppTopBar,
    WeekProjectionCard,
    PremiumTeaser,
    getTypeMeta,
  } = getTabUi();
  const stats = computeStats(plan);
  const isLoop = !!plan?.isSessionLoop;
  const [poolOpen, setPoolOpen] = useState(false);
  const [homePrepOpen, setHomePrepOpen] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(() => isProfileNudgeDismissed(user?.id));
  const [allureTipDismissed, setAllureTipDismissed] = useState(() => hasSeenAllureUnlockTip(user?.id));
  const next = findNextSession(plan);
  const preview = next?.session ? sessionCardModel(next.session) : null;
  const hasSwum = stats.totalSessions > 0;
  const showHomeExtras = stats.totalSessions >= 2;
  const trialBannerActive =
    accessState?.status === ACCESS_STATUS.TRIAL && (Number(accessState.trialDaysLeft) || 0) > 0;
  const showProfileNudge = !!plan && shouldShowProfileNudge(profile, { dismissed: nudgeDismissed, hasSwum });
  const showAllureTip = shouldShowAllureUnlockTip(profile, {
    dismissed: allureTipDismissed,
    hasSwum,
    hasPlan: !!plan,
  });
  const currentWeekIdx = (plan?.weeks || []).findIndex((w) => !(w.sessions || []).every(isSessionResolved));
  const weekMetersRow = !isLoop && stats.weeklyData?.length
    ? stats.weeklyData[currentWeekIdx >= 0 ? currentWeekIdx : 0]
    : null;

  useEffect(() => {
    setAllureTipDismissed(hasSeenAllureUnlockTip(user?.id));
  }, [user?.id]);

  useEffect(() => {
    if (!showAllureTip) return;
    track("allure_unlock_tip_viewed", {
      isPremium: !!isPremium,
      hasPace: !!profile?.pace100,
    }, { onceKey: `allure_unlock_tip:${user?.id || "anon"}` });
  }, [showAllureTip, isPremium, profile?.pace100, user?.id]);

  const firstName = user?.user_metadata?.firstname
    || (() => {
      try {
        if (user?.id) {
          return localStorage.getItem(`myswym_firstname_${user.id}`) || localStorage.getItem("myswym_firstname");
        }
        return localStorage.getItem("myswym_firstname");
      } catch { return null; }
    })()
    || user?.user_metadata?.full_name?.split(" ")[0]
    || user?.email?.split("@")[0]
    || "Nageur";

  const planFinished = !isLoop && stats.totalSessions >= stats.planTotal && stats.planTotal > 0;
  const tm = getTypeMeta(next?.session?.type);

  const startToday = () => {
    if (!next?.session || next.resolved) {
      onTabChange?.("plan");
      return;
    }
    if (!isPremium) {
      onUpgrade?.("session_locked");
      return;
    }
    const props = sessionAnalyticsProps(profile, next.session, {
      planWeek: (plan?.weeks?.[next.weekIndex]?.number) ?? next.weekIndex + 1,
      sessionIndex: next.sessionIndex,
    });
    track("session_started", {
      level: props.level,
      objective: props.objective,
      planWeek: props.planWeek,
      sessionIndex: props.sessionIndex,
      volume: props.volume,
    }, { onceKey: `session_started:${activePlanId || "plan"}:${next.weekIndex}:${next.sessionIndex}` });
    setHomePrepOpen(true);
  };

  return (
    <div style={{ paddingBottom: "calc(var(--bottom-nav-h) + var(--safe-bottom) + var(--nav-lift) + 32px)", background: "transparent", minHeight: "100dvh" }}>

      <AppTopBar
        user={user}
        onOpenMenu={onOpenMenu}
        onAvatarClick={() => onTabChange("profile")}
        plan={plan}
        onTabChange={onTabChange}
        onUpgrade={onUpgrade}
      />

      <div className="app-shell" style={{ paddingTop: 16 }}>

        <div className="ms-home-greet">
          <div>
            <p>{(() => {
              const h = new Date().getHours();
              return h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir";
            })()},</p>
            <h1>{plan ? "Prêt à nager ?" : firstName}</h1>
          </div>
          {plan && (stats.streak > 0 || hasSwum) && (
            <span className="ms-home-streak" title={stats.streak > 0 ? `Série de ${stats.streak}` : "Distance totale"}>
              {stats.streak > 0 ? (
                <><Flame size={14} color={G.gold} aria-hidden />{stats.streak}</>
              ) : (
                <><Waves size={14} color={G.blue} aria-hidden />{(stats.totalMeters / 1000).toFixed(1)} km</>
              )}
            </span>
          )}
        </div>

        <TrialCountdownBanner accessState={accessState} onUpgrade={onUpgrade} />

        {!trialBannerActive && plan && !next?.resolved && shouldShowSessionReminderBanner({
          enabled: getSessionRemindersEnabled(user?.id),
          hasPlan: true,
          nextResolved: false,
        }) && (
          <div className="ms-habit-banner" role="status">
            <strong>{sessionReminderCopy({ sessionTitle: next?.session?.title, streak: stats.streak }).title}</strong>
            {", "}
            {sessionReminderCopy({ sessionTitle: next?.session?.title, streak: stats.streak }).body}
          </div>
        )}
        {!trialBannerActive && plan && !next?.resolved && !shouldShowSessionReminderBanner({
          enabled: getSessionRemindersEnabled(user?.id),
          hasPlan: true,
          nextResolved: false,
        }) && (
          <div className="ms-habit-banner" role="status">
            {stats.streak > 0
              ? <>Série de <strong>{stats.streak}</strong>, nage aujourd’hui pour la garder.</>
              : hasSwum
                ? <>Reviens nager, une séance suffit pour relancer ta série.</>
                : <>Ta première séance t’attend, coche-la après le bassin.</>}
          </div>
        )}
        {!trialBannerActive && plan && next?.resolved && stats.streak > 0 && (
          <div className="ms-habit-banner is-done" role="status">
            Séance du jour validée · série de <strong>{stats.streak}</strong>, reviens demain.
          </div>
        )}

        {showProfileNudge && !trialBannerActive && (
          <ProfileNudgeCard
            onOpenProfile={() => onTabChange?.("profile")}
            onDismiss={() => {
              dismissProfileNudge(user?.id);
              setNudgeDismissed(true);
            }}
          />
        )}

        {!plan && (
          <div style={{
            background: G.surface, borderRadius: 20, padding: "22px 18px", marginBottom: 16,
            border: `1px solid ${G.greyLight}`,
            boxShadow: "0 1px 3px rgba(25,28,30,0.03), 0 8px 20px rgba(53,93,163,0.05)",
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: FONT_DISPLAY, color: G.ink, margin: "0 0 8px" }}>
              Pas encore de programme
            </h2>
            <p style={{ fontSize: 14, color: G.grey, lineHeight: 1.45, margin: "0 0 16px" }}>
              Crée ton plan personnalisé dans l’onglet Programme.
            </p>
            <button
              type="button"
              onClick={() => onTabChange?.("plan")}
              style={{
                width: "100%", padding: "14px 16px", borderRadius: 12, border: "none",
                background: G.blue, color: G.white, fontSize: 15, fontWeight: 600, cursor: "pointer", minHeight: 48,
                fontFamily: FONT,
              }}
            >
              Créer mon programme
            </button>
          </div>
        )}

        {preview && (
          <div style={{ marginBottom: 16 }}>
            <SessionHeroCard
              preview={{
                ...preview,
                title: next.resolved ? "Séance faite" : "Séance à venir",
              }}
              hideKicker
            >
              <button
                type="button"
                className="ms-plan-reveal-btn"
                onClick={startToday}
                style={{ fontFamily: FONT }}
              >
                {next.resolved
                  ? "Voir le programme"
                  : (isPremium ? "Préparer la séance" : "S’abonner pour nager")}
              </button>
            </SessionHeroCard>
          </div>
        )}

        {!isLoop && planFinished && (
          <div className="fade-up scale-in" style={{ background: G.surface, borderRadius: 24, padding: "20px 16px", textAlign: "center", marginBottom: 16, border: `1px solid rgba(142,179,255,0.15)`, boxShadow: "0 4px 20px rgba(142,179,255,0.10)" }}>
            {plan.isProgression
              ? <><TrendingUp size={36} color={G.blue} style={{ margin: "0 auto 8px" }} /><h2 style={{ fontSize: 20, fontWeight: 700, color: G.ink, marginBottom: 6 }}>Cycle terminé</h2><p style={{ color: G.grey, fontSize: 13, marginBottom: 14 }}>Tu as nagé <strong style={{ color: G.ink }}>{(stats.totalMeters / 1000).toFixed(1)} km</strong> en {plan.weeks.length} semaines.</p><Btn variant="blue" onClick={onSignOut}>Nouveau cycle</Btn></>
              : <><Trophy size={36} color={G.gold} style={{ margin: "0 auto 8px" }} /><h2 style={{ fontSize: 20, fontWeight: 700, color: G.ink, marginBottom: 4 }}>Programme complété</h2><p style={{ color: G.grey, fontSize: 13 }}>Ton plan est terminé, mais ton dashboard reste vivant.</p></>
            }
          </div>
        )}

        {!isPremium && plan?.weeks?.length > 0 && (
          <PremiumTeaser onUpgrade={onUpgrade} />
        )}

        {/* Secondaire, sous le fold « nager aujourd’hui » */}
        {(plan || hasSwum) && (
          <div style={{ marginTop: 8, paddingTop: 4 }}>
            {plan && (
              <EventWeekPlanCard
                plan={plan}
                profile={profile}
                onOpenProfile={() => onTabChange?.("profile")}
              />
            )}

            {plan && (
              <WeekProjectionCard
                plan={plan}
                profile={profile}
                onOpenPlan={() => onTabChange?.("plan")}
              />
            )}

            {hasSwum && weekMetersRow && !plan && (
              <div style={{
                display: "flex", alignItems: "center", gap: 16,
                background: G.surface, border: `1px solid ${G.greyLight}`,
                borderRadius: 16, padding: "14px 16px", marginBottom: 16,
              }}>
                <WeekStatRing value={weekMetersRow.done} max={weekMetersRow.total} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: G.grey }}>
                    {weekMetersRow.label}
                  </div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700, color: G.ink, letterSpacing: "-0.03em", marginTop: 2 }}>
                    {weekMetersRow.done}
                    <span style={{ fontSize: 13, fontWeight: 500, color: G.grey, fontFamily: FONT }}> / {weekMetersRow.total} m</span>
                  </div>
                </div>
              </div>
            )}

            {showHomeExtras && (
              <HomeSecondaryStack
                plan={plan}
                profile={profile}
                user={user}
                isPremium={isPremium}
                onUpgrade={onUpgrade}
                onPaceUpdate={onPaceUpdate}
                onValidateSession={onValidateSession}
              />
            )}
            {hasSwum && !showHomeExtras && isPremium && plan?.weeks?.length > 0 && (
              <CoachCard
                plan={plan}
                profile={profile}
                currentWeekIndex={Math.max(0, plan.weeks.findIndex((w) => !(w.sessions || []).every(isSessionResolved)))}
              />
            )}
          </div>
        )}

        <SessionPrepSheet
          open={homePrepOpen && !!next?.session && !next.resolved}
          session={next?.session}
          colors={G}
          accent={{ bg: tm.bg, color: tm.color }}
          isPremium={isPremium}
          profile={profile}
          planId={activePlanId}
          whyLine={next?.session ? sessionWhyLine(next.session, profile) : null}
          onClose={() => setHomePrepOpen(false)}
          onStart={() => setPoolOpen(true)}
          onUpgrade={onUpgrade}
          onTooHard={
            isPremium
              ? () => {
                  setHomePrepOpen(false);
                  onEditFeedback?.(next.weekIndex, next.sessionIndex);
                }
              : () => {
                  setHomePrepOpen(false);
                  onUpgrade?.("feedback_adjust");
                }
          }
        />

        {poolOpen && next?.session && (
          <PoolMode
            session={next.session}
            sessionKey={`${activePlanId || "plan"}:${next.weekIndex}:${next.sessionIndex}`}
            colors={G}
            accent={{ bg: tm.bg, color: tm.color }}
            onClose={() => setPoolOpen(false)}
            onFinish={() => {
              setPoolOpen(false);
              setHomePrepOpen(false);
              onComplete?.(next.weekIndex, next.sessionIndex, "done");
            }}
            onTooHard={
              isPremium
                ? () => {
                    setPoolOpen(false);
                    onEditFeedback?.(next.weekIndex, next.sessionIndex);
                  }
                : () => {
                    setPoolOpen(false);
                    onUpgrade?.("feedback_adjust");
                  }
            }
          />
        )}

        {showAllureTip && (
          <AllureUnlockSheet
            userId={user?.id}
            isPremium={isPremium}
            initialPace100={profile?.pace100 || null}
            onSave={onPaceUpdate}
            onUpgrade={onUpgrade}
            onDismiss={() => setAllureTipDismissed(true)}
          />
        )}
      </div>
    </div>
  );
}

