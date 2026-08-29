import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";
import { FONT_DISPLAY } from "./theme/brand.js";
import { G } from "./theme/palette.js";
import CoachCard from "./CoachCard.jsx";
import { isSessionResolved } from "./lib/plan-progress-merge.js";
import { getTabUi } from "./tab-ui-registry.js";
import { findGoalById } from "./lib/onboarding-catalog.jsx";

// ── PLAN TAB ──────────────────────────────────────────────────────────────
export default function PlanTab({
  plan, profile, isPremium, onComplete, onAdvanceLoop, onShare, onEditFeedback, onReset, onUpgrade,
  plans, activePlanId, onSwitchPlan, onAddPlan, onDeletePlan, onRegenerateLoop, onUpdateProgram,
  user, onOpenMenu, onTabChange,
  addingPlan = false, onboardingProps = null, onCancelAddPlan = null,
}) {
  const {
    AppTopBar,
    OnboardingWizard,
    ProgressionLoopView,
    PlanSelector,
    PremiumBanner,
    ResetConfirmButton,
    UpdateProgramCard,
    WeekCard,
    GOALS,
    CATEGORIES,
  } = getTabUi();

  const [stravaBestPace, setStravaBestPace] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    supabase
      .from("strava_activities")
      .select("pace")
      .eq("user_id", user.id)
      .in("activity_type", ["Swim", "OpenWaterSwim"])
      .gt("pace", 0)
      .order("pace", { ascending: true })
      .limit(1)
      .then(({ data }) => {
        if (!cancelled) setStravaBestPace(data?.[0]?.pace ?? null);
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  // Compte connecté sans plan (ou ajout d’un plan) → questionnaire dans le shell app
  if ((!plan || addingPlan) && onboardingProps) {
    return (
      <div style={{ paddingBottom: "calc(var(--bottom-nav-h) + var(--safe-bottom) + var(--nav-lift) + 24px)", minHeight: "100dvh" }}>
        <AppTopBar
          user={user}
          onOpenMenu={onOpenMenu}
          onAvatarClick={onTabChange ? () => onTabChange("profile") : undefined}
          plan={null}
          onTabChange={onTabChange}
          onUpgrade={onUpgrade}
        />
        <div className="app-shell" style={{ paddingTop: 16, paddingBottom: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: G.ink, lineHeight: 1.15, margin: 0 }}>
              {addingPlan ? "Remplacer mon programme" : "Crée ton programme"}
            </h1>
            <p style={{ fontSize: 14, color: G.grey, marginTop: 6, lineHeight: 1.45 }}>
              Réponds au questionnaire, Accueil, Profil et Binômes restent accessibles.
            </p>
          </div>
          <OnboardingWizard
            {...onboardingProps}
            onCancel={addingPlan && plans?.length > 0 ? onCancelAddPlan : null}
          />
        </div>
      </div>
    );
  }

  if (!plan?.weeks) {
    return (
      <div style={{ paddingBottom: "calc(var(--bottom-nav-h) + var(--safe-bottom) + var(--nav-lift) + 24px)", minHeight: "100dvh" }}>
        <AppTopBar user={user} onOpenMenu={onOpenMenu} onAvatarClick={onTabChange ? () => onTabChange("profile") : undefined} plan={null} onTabChange={onTabChange} onUpgrade={onUpgrade} />
        <div className="app-shell" style={{ paddingTop: 32 }}>
          <p style={{ color: G.grey, fontSize: 14 }}>Aucun programme pour le moment.</p>
        </div>
      </div>
    );
  }

  if (plan?.isSessionLoop) {
    return (
      <ProgressionLoopView
        plan={plan}
        profile={profile}
        plans={plans}
        activePlanId={activePlanId}
        isPremium={isPremium}
        onComplete={(a, b, c) => {
          // WeekCard → (weekIndex, sessionIndex, status) ; legacy boucle → (status)
          if (typeof a === "string" && b === undefined) onComplete(0, 0, a);
          else onComplete(a ?? 0, b ?? 0, c);
        }}
        onAdvanceLoop={onAdvanceLoop}
        onSwitchPlan={onSwitchPlan}
        onAddPlan={onAddPlan}
        onDeletePlan={onDeletePlan}
        onRegenerate={onRegenerateLoop}
        onUpgrade={onUpgrade}
        onReset={onReset}
        onShare={onShare}
        onEditFeedback={onEditFeedback}
        user={user}
        onOpenMenu={onOpenMenu}
        onTabChange={onTabChange}
      />
    );
  }

  const currentWeekIndex = plan.weeks.findIndex(w => !w.sessions.every(isSessionResolved));
  const currentWeek = currentWeekIndex >= 0 ? plan.weeks[currentWeekIndex] : null;

  const planLabel = findGoalById(profile.goal, GOALS)?.label
                 || CATEGORIES.find(c => c.id === profile.category)?.label
                 || "Mon plan";
  return (
    <div style={{ paddingBottom: "calc(var(--bottom-nav-h) + var(--safe-bottom) + var(--nav-lift) + 24px)", minHeight: "100dvh" }}>
      <AppTopBar
        user={user}
        onOpenMenu={onOpenMenu}
        onAvatarClick={onTabChange ? () => onTabChange("profile") : undefined}
        plan={plan}
        onTabChange={onTabChange}
        onUpgrade={onUpgrade}
      />

      {/* ── Sous-header programme ── */}
      <div style={{
        background: G.bg,
        borderBottom: `1px solid rgba(142,179,255,0.10)`,
      }}>
        <div className="app-shell" style={{ paddingTop: 14, paddingBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", color: G.ink, lineHeight: 1, margin: 0 }}>{planLabel}</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 12, fontWeight: 600, color: G.inkLight,
              background: G.greyXLight, padding: "4px 9px", borderRadius: 8,
            }}>
              Sem. {currentWeekIndex >= 0 ? currentWeekIndex + 1 : plan.weeks.length}/{plan.weeks.length}
            </span>
            {currentWeekIndex >= 0 && currentWeek?.focus && (
              <span style={{ fontSize: 12, color: G.blue, fontWeight: 600 }}>{currentWeek.focus}</span>
            )}
          </div>
        </div>
        {/* Plan switcher */}
        <div className="app-shell" style={{ paddingBottom: 12 }}>
          <PlanSelector
            plans={plans}
            activePlanId={activePlanId}
            onAddPlan={onAddPlan}
          />
        </div>
      </div>

      <div className="app-shell" style={{ paddingTop: 16 }}>

        {!isPremium && (
          <PremiumBanner
            onUpgrade={onUpgrade}
            weeks={plan?.totalRealWeeks || plan?.weeks?.length || 0}
          />
        )}

        {isPremium && (
          <CoachCard
            plan={plan}
            profile={profile}
            currentWeekIndex={currentWeekIndex >= 0 ? currentWeekIndex : 0}
          />
        )}

        {!isPremium && <ResetConfirmButton onReset={onReset} variant="card" />}

        <UpdateProgramCard
          profile={profile}
          isPremium={isPremium}
          onUpgrade={onUpgrade}
          onSave={onUpdateProgram}
          stravaBestPace={stravaBestPace}
        />

        {(() => {
          const indexed = plan.weeks.map((week, i) => ({ week, i }));
          // Semaine courante en tête, puis futures, puis passées (repliées)
          const ordered = currentWeekIndex < 0
            ? indexed
            : [
                ...indexed.filter(({ i }) => i === currentWeekIndex),
                ...indexed.filter(({ i }) => i > currentWeekIndex),
                ...indexed.filter(({ i }) => i < currentWeekIndex),
              ];
          const pastStart = currentWeekIndex < 0
            ? -1
            : ordered.findIndex(({ i }) => i < currentWeekIndex);

          return ordered.map(({ week, i }, ord) => (
            <div key={i}>
              {pastStart >= 0 && ord === pastStart && (
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: G.grey,
                    margin: "8px 0 10px",
                  }}
                >
                  Semaines passées
                </div>
              )}
              <WeekCard
                week={week}
                weekIndex={i}
                onComplete={onComplete}
                onShare={onShare}
                onEditFeedback={onEditFeedback}
                isCurrentWeek={i === currentWeekIndex}
                isPremium={isPremium}
                onUpgrade={onUpgrade}
                analyticsCtx={{ planId: activePlanId, profile }}
              />
            </div>
          ));
        })()}

        {isPremium && <ResetConfirmButton onReset={onReset} variant="subtle" />}
      </div>
    </div>
  );
}
