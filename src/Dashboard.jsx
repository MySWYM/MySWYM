import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Award, Flame, Trophy, TrendingUp, Lock, Users, ChevronRight,
} from "lucide-react";
import { FONT } from "./theme/brand.js";
import { G } from "./theme/palette.js";
import SessionHeroCard from "./SessionHeroCard.jsx";
import Btn from "./ui/Btn.jsx";
import AllureUnlockSheet from "./sheets/AllureUnlockSheet.jsx";
import TrialCountdownBanner from "./ui/TrialCountdownBanner.jsx";
import SessionPrepSheet from "./sheets/SessionPrepSheet.jsx";
import IosHomeSessionDeck from "./home/IosHomeSessionDeck.jsx";
import CoachCard from "./CoachCard.jsx";
import { track } from "./lib/analytics.js";
import { resolveDisplayFirstName } from "./lib/identity-cache.js";
import { findNextSession, sessionCardModel } from "./lib/plan-reveal.js";
import {
  hasSeenAllureUnlockTip,
  shouldShowAllureUnlockTip,
} from "./lib/allure-unlock-tip.js";
import { isSessionResolved } from "./lib/plan-progress-merge.js";
import { canAccessSessions, resolveTrialCountdown } from "./lib/access.js";
import { BADGE_DEFS, computeStats, checkBadges } from "./lib/plan-stats.js";
import { playUiSound } from "./lib/ui-sounds.js";
import { getTabUi } from "./tab-ui-registry.js";
import { isIosSimpleNav } from "./lib/ios-simple-nav.js";
import { currentWeekSessionCards, sessionTypeAccent } from "./lib/home-week-sessions.js";
import SessionExportBar from "./ui/SessionExportBar.jsx";
import { PRICING } from "./lib/pricing.js";
import { isNativeIos } from "./lib/native-platform.js";

export function HomeBadgesSection({ plan }) {
  const { t } = useTranslation("app");
  const stats = computeStats(plan);
  const earnedIds = new Set(checkBadges(stats));
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {BADGE_DEFS.map((b) => {
          const ok = earnedIds.has(b.id);
          return (
            <div
              key={b.id}
              className="ms-glass-card"
              style={{
                padding: "12px 8px",
                textAlign: "center",
                opacity: ok ? 1 : 0.45,
              }}
            >
              <Award size={18} color={ok ? G.gold : G.greyMid} style={{ margin: "0 auto 6px" }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: G.ink, lineHeight: 1.25 }}>{t(`badge.${b.id}.label`)}</div>
            </div>
          );
        })}
      </div>
      {earnedIds.size === 0 ? (
        <p style={{ fontSize: 12, color: G.grey, margin: "12px 0 0", lineHeight: 1.45 }}>
          {t("home.badgesEmpty")}
        </p>
      ) : null}
    </div>
  );
}

/** Accueil minimal : greeting + 1 bandeau max + séance + CTA. */
export default function Dashboard({
  plan, profile, onTabChange, onSignOut, user,
  isPremium = false, onRegenerateLoop, onUpgrade, onReset, onShare, onEditFeedback, onPaceUpdate, onValidateSession, onOpenMenu,
  activePlanId = null,
  accessState = null,
  onGoBuddies = null,
}) {
  const { t } = useTranslation("app");
  const {
    AppTopBar,
  } = getTabUi();
  const stats = computeStats(plan);
  const isLoop = !!plan?.isSessionLoop;
  const iosNav = isIosSimpleNav();
  const weekCards = useMemo(() => currentWeekSessionCards(plan), [plan]);
  const [openCard, setOpenCard] = useState(null);
  const [allureTipDismissed, setAllureTipDismissed] = useState(() => hasSeenAllureUnlockTip(user?.id));
  const next = findNextSession(plan);
  const preview = next?.session ? sessionCardModel(next.session) : null;
  const hasSwum = stats.totalSessions > 0;
  /** Essai 7j ou abo : séances ouvertes. Après essai (trial_used) : gel. */
  const hasSessionAccess = canAccessSessions(accessState, isPremium);
  const trialCountdown = resolveTrialCountdown(accessState, { hasSessionAccess });
  const trialBannerActive = Boolean(trialCountdown);
  const showAllureTip = shouldShowAllureUnlockTip(profile, {
    dismissed: allureTipDismissed,
    hasSwum,
    hasPlan: !!plan,
  });

  useEffect(() => {
    setAllureTipDismissed(hasSeenAllureUnlockTip(user?.id));
  }, [user?.id]);

  useEffect(() => {
    if (!showAllureTip) return;
    track("allure_unlock_tip_viewed", {
      isPremium: !!hasSessionAccess,
      hasPace: !!profile?.pace100,
    }, { onceKey: `allure_unlock_tip:${user?.id || "anon"}` });
  }, [showAllureTip, hasSessionAccess, profile?.pace100, user?.id]);

  const firstName = resolveDisplayFirstName(user);
  const hour = new Date().getHours();
  const hello = hour < 12 ? t("home.morning") : hour < 18 ? t("home.afternoon") : t("home.evening");
  const greetTitle = !hasSessionAccess && plan
    ? t("home.trialDone")
    : !plan
      ? t("home.create")
      : iosNav
        ? `${hello}, ${firstName}`
        : t("home.ready");

  const planFinished = !isLoop && stats.totalSessions >= stats.planTotal && stats.planTotal > 0;
  const coachWeek = plan?.weeks?.length
    ? Math.max(0, plan.weeks.findIndex((w) => !(w.sessions || []).every(isSessionResolved)))
    : 0;

  return (
    <div
      className="ms-home-immersive"
      style={{
        minHeight: "100dvh",
        paddingBottom: "calc(var(--bottom-nav-h) + var(--safe-bottom) + var(--nav-lift) + 32px)",
      }}
    >
      <div className="ms-home-immersive-bg ms-home-immersive-bg--mist" aria-hidden>
        <img src="/hero-pool.webp" alt="" width={1024} height={1024} decoding="async" />
        <div className="ms-home-immersive-scrim" />
      </div>

      <AppTopBar
        user={user}
        onOpenMenu={onOpenMenu}
        onAvatarClick={() => onTabChange("profile")}
        plan={plan}
        onTabChange={onTabChange}
        onUpgrade={onUpgrade}
        immersive
      />

      <div className="app-shell" style={{ paddingTop: 8 }}>

        <div className="ms-home-greet">
          <div>
            {iosNav && plan && hasSessionAccess ? null : (
              <p>{hello}, {firstName}</p>
            )}
            <h1>{greetTitle}</h1>
            {trialBannerActive && iosNav ? (
              <div className="ms-home-trial-chip-wrap">
                <TrialCountdownBanner
                  accessState={accessState}
                  hasSessionAccess={hasSessionAccess}
                  onUpgrade={onUpgrade}
                  compact
                />
              </div>
            ) : null}
          </div>
          {!iosNav && plan && hasSessionAccess && stats.streak > 0 && (
            <span className="ms-home-streak" title={t("home.streakTitle", { count: stats.streak })}>
              <Flame size={14} color="#D4A017" aria-hidden />
              {stats.streak}
            </span>
          )}
        </div>

        {/* iOS : la pastille compacte suffit ; la grande carte d’offre ne revient
            qu’en fin d’essai (≤ 2 j). La séance reste la 1ʳᵉ chose visible. */}
        {trialBannerActive && (!iosNav || Number(accessState?.trialDaysLeft ?? 99) <= 2) ? (
          <TrialCountdownBanner
            accessState={accessState}
            hasSessionAccess={hasSessionAccess}
            onUpgrade={onUpgrade}
          />
        ) : trialBannerActive ? null : !iosNav && hasSessionAccess && plan && next?.resolved ? (
          <div className="ms-habit-banner is-done" role="status">
            {t("home.validated")}
          </div>
        ) : null}

        {!plan && (
          <div className="ms-glass-card" style={{ padding: "22px 18px", marginBottom: 16 }}>
            <h2 className="ms-type-section" style={{ marginBottom: 8 }}>
              {t("home.planWaits")}
            </h2>
            <p style={{ fontSize: 14, color: G.grey, lineHeight: 1.45, margin: "0 0 18px" }}>
              {t("home.fewQuestions")}
            </p>
            <button
              type="button"
              className="ms-pill-cta"
              onClick={() => {
                playUiSound("tap");
                onTabChange?.("plan");
              }}
              style={{ fontFamily: FONT }}
            >
              {t("home.start")}
            </button>
          </div>
        )}

        {plan && !hasSessionAccess ? (
          <>
            <div className="ios-home-premium-unlock" role="region" aria-label={t("home.unlockTitle")}>
              <p className="ios-home-premium-unlock-kicker">{t("home.trialDone")}</p>
              <h2 className="ios-home-premium-unlock-title">{t("home.unlockTitle")}</h2>
              <p className="ios-home-premium-unlock-body">{t("home.unlockBody")}</p>
              <p className="ios-home-premium-unlock-perks">{t("home.unlockPerks")}</p>
              <button
                type="button"
                className="ms-pill-cta"
                onClick={() => {
                  playUiSound("tap");
                  onUpgrade?.("trial_expired");
                }}
                style={{ fontFamily: FONT }}
              >
                {isNativeIos()
                  ? t("home.unlockCta")
                  : t("home.unlockCtaPrice", { price: PRICING.monthlyCommit.label })}
              </button>
            </div>
            {weekCards.length ? (
              <IosHomeSessionDeck
                cards={weekCards}
                locked
                onOpen={() => onUpgrade?.("trial_expired")}
              />
            ) : (
              <div className="ms-glass-card" style={{ padding: "18px 16px", marginBottom: 16 }} role="status">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Lock size={18} color={G.blue} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: G.ink }}>{t("home.paused")}</span>
                </div>
              </div>
            )}
            {typeof onGoBuddies === "function" && iosNav ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                <button
                  type="button"
                  className="ms-profile-account-row"
                  onClick={() => {
                    playUiSound("soft");
                    onUpgrade?.("buddies");
                  }}
                >
                  <span className="ms-profile-settings-icon" style={{ background: "rgba(31, 174, 134, 0.12)" }}>
                    <Users size={18} color={G.mint} />
                  </span>
                  <span className="ms-profile-settings-label" style={{ flex: 1 }}>{t("home.buddies")}</span>
                  <Lock size={16} color={G.greyMid} />
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <>
        {iosNav ? (
          <>
            <IosHomeSessionDeck cards={weekCards} onOpen={setOpenCard} />
            {plan && hasSessionAccess ? (
              <CoachCard plan={plan} profile={profile} currentWeekIndex={coachWeek} spaced />
            ) : null}
            {typeof onGoBuddies === "function" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                <button
                  type="button"
                  className="ms-profile-account-row"
                  onClick={() => {
                    playUiSound("soft");
                    onGoBuddies();
                  }}
                >
                  <span className="ms-profile-settings-icon" style={{ background: "rgba(31, 174, 134, 0.12)" }}>
                    <Users size={18} color={G.mint} />
                  </span>
                  <span className="ms-profile-settings-label" style={{ flex: 1 }}>{t("home.buddies")}</span>
                  <ChevronRight size={18} color={G.greyMid} />
                </button>
              </div>
            ) : null}
          </>
        ) : preview ? (
          <div style={{ marginBottom: 12 }}>
            <SessionHeroCard
              className="is-glass"
              kicker={t("home.todayKicker")}
              preview={{
                ...preview,
                title: next.resolved ? t("home.sessionDone") : (preview.title || t("home.sessionToday")),
              }}
            >
              <button
                type="button"
                className="ms-pill-cta"
                onClick={() => {
                  playUiSound("soft");
                  onTabChange?.("plan");
                }}
                style={{ fontFamily: FONT }}
              >
                Voir le programme
              </button>
            </SessionHeroCard>
          </div>
        ) : null}

        {plan && hasSessionAccess && !iosNav && (
          <CoachCard
            plan={plan}
            profile={profile}
            currentWeekIndex={coachWeek}
          />
        )}
          </>
        )}

        {!iosNav && !isLoop && hasSessionAccess && planFinished && (
          <div className="ms-glass-card" style={{ borderRadius: 24, padding: "20px 16px", textAlign: "center", marginBottom: 16 }}>
            {plan.isProgression
              ? <><TrendingUp size={36} color={G.blue} style={{ margin: "0 auto 8px" }} /><h2 style={{ fontSize: 20, fontWeight: 700, color: G.ink, marginBottom: 6 }}>Cycle terminé</h2><p style={{ color: G.grey, fontSize: 13, marginBottom: 14 }}>Tu as nagé <strong style={{ color: G.ink }}>{(stats.totalMeters / 1000).toFixed(1)} km</strong> en {plan.weeks.length} semaines.</p><Btn variant="blue" onClick={onSignOut}>Nouveau cycle</Btn></>
              : <><Trophy size={36} color={G.gold} style={{ margin: "0 auto 8px" }} /><h2 style={{ fontSize: 20, fontWeight: 700, color: G.ink, marginBottom: 4 }}>{t("home.planDone")}</h2><p style={{ color: G.grey, fontSize: 13 }}>{t("home.planDoneBody")}</p></>
            }
          </div>
        )}

        {hasSessionAccess && showAllureTip && (
          <AllureUnlockSheet
            userId={user?.id}
            isPremium={hasSessionAccess}
            initialPace100={profile?.pace100 || null}
            onSave={onPaceUpdate}
            onUpgrade={onUpgrade}
            onDismiss={() => setAllureTipDismissed(true)}
          />
        )}

        {openCard && hasSessionAccess ? (
          <SessionPrepSheet
            open
            session={openCard.session}
            colors={G}
            accent={sessionTypeAccent(openCard.type, G)}
            isPremium={hasSessionAccess}
            profile={profile}
            planId={activePlanId}
            showStart={!openCard.resolved}
            sheetTitle={openCard.title}
            sheetSub={openCard.line || null}
            onClose={() => setOpenCard(null)}
            onUpgrade={() => onUpgrade?.("session_locked")}
            onMark={openCard.resolved ? null : (status) => {
              onValidateSession?.(openCard.weekIndex, openCard.sessionIndex, status);
              setOpenCard(null);
            }}
            exportBar={(
              <div style={{ marginTop: 14 }}>
                <SessionExportBar
                  session={openCard.session}
                  isPremium={hasSessionAccess}
                  onUpgrade={onUpgrade}
                  onShare={onShare}
                />
              </div>
            )}
          />
        ) : null}
      </div>
    </div>
  );
}
