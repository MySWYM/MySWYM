import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { G } from "../theme/palette.js";
import { AppTabShell, AppTopBar } from "../app-shell/index.js";
import HistoriqueTab from "../HistoriqueTab.jsx";
import IosPremiumBar from "../ui/IosPremiumBar.jsx";
import { computeStats } from "../lib/plan-stats.js";
import { formatKm } from "../lib/swimmer-period-stats.js";
import { buildWeekDayStrip } from "../lib/week-day-strip.js";
import { ScoreRing } from "./ScoreRing.jsx";
import { CountUp } from "./CountUp.jsx";
import IosBadgesPanel from "./IosBadgesPanel.jsx";
import { resolveAvatarUrl } from "../lib/avatar.js";
import { resolveDisplayFullName } from "../lib/identity-cache.js";
import { formatMemberSince } from "../lib/member-since.js";
import { iosShowPremiumBar } from "../lib/ios-simple-nav.js";
import { fetchWeeklyRank } from "../lib/weekly-rank-api.js";
import { rankCenterLabel, rankRingRatio } from "../lib/weekly-rank.js";
import { nextLadderBadge } from "../lib/badge-progress.js";
import { getTabUi } from "../tab-ui-registry.js";
import { playUiSound } from "../lib/ui-sounds.js";
import { PRICING } from "../lib/pricing.js";
import "./analyse-motion.css";

const EASE = [0.22, 1, 0.36, 1];

function displayFullName(user) {
  return resolveDisplayFullName(user);
}

function formatMul(n) {
  const x = Number(n);
  if (!Number.isFinite(x) || x <= 0) return "×0";
  return `×${x.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}`;
}

function paceLabel(secs) {
  if (!secs || !Number.isFinite(Number(secs))) return "-";
  const n = Math.round(Number(secs));
  const m = Math.floor(n / 60);
  const s = n % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function DrillBar({ title, onBack }) {
  return (
    <header className="ms-profile-subpanel-toolbar" style={{ position: "sticky", top: 0, zIndex: 50 }}>
      <button
        type="button"
        className="ms-glass-icon-btn"
        aria-label="Retour"
        onClick={() => {
          playUiSound("soft");
          onBack();
        }}
      >
        <ChevronLeft size={22} color={G.ink} strokeWidth={2.25} />
      </button>
      <h1>{title}</h1>
      <div style={{ width: 44 }} aria-hidden />
    </header>
  );
}

function MetricRow({ label, value, onClick, progress = null, leading = null }) {
  const inner = (
    <>
      {leading}
      <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
          <span className="ios-analyse-row-label">{label}</span>
          <span className="ios-analyse-row-value">{value}</span>
          {onClick ? <ChevronRight size={18} color={G.greyMid} /> : null}
        </span>
        {progress != null ? (
          <span className="ios-analyse-badge-track" aria-hidden>
            <motion.span
              className="ios-analyse-badge-fill"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: Math.min(1, Math.max(0, progress)) }}
              transition={{ duration: 0.9, delay: 0.22, ease: EASE }}
            />
          </span>
        ) : null}
      </span>
    </>
  );
  if (onClick) {
    return (
      <button type="button" className="ms-profile-account-row ios-analyse-row" onClick={onClick}>
        {inner}
      </button>
    );
  }
  return <div className="ms-profile-account-row ios-analyse-row">{inner}</div>;
}

function FadeIn({ index, reduced, children, className = "" }) {
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, delay: index * 0.05, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Tableau de bord iOS : identité, essai or, 2 métriques, strip, liste. */
export default function IosAnalyseHome({
  plan,
  profile,
  user,
  isPremium = false,
  onOpenMenu,
  onTabChange,
  onUpgrade,
  onPaceUpdate,
  onShare = null,
  activePlanId = null,
  accessState = null,
}) {
  const { MonAllureCard } = getTabUi();
  const reduced = useReducedMotion();
  const [panel, setPanel] = useState(null);
  const [rank, setRank] = useState(undefined);
  const stats = useMemo(() => computeStats(plan), [plan]);
  const weekDayStrip = useMemo(
    () => (plan ? buildWeekDayStrip(plan, profile) : null),
    [plan, profile],
  );
  const weekSessionStats = useMemo(() => {
    if (!weekDayStrip?.length) return { done: 0, planned: 0 };
    return {
      done: weekDayStrip.filter((d) => d.done).length,
      planned: weekDayStrip.filter((d) => d.scheduled).length,
    };
  }, [weekDayStrip]);
  const nextBadge = useMemo(() => nextLadderBadge(stats), [stats]);
  const currentStreak = stats.currentStreak || 0;
  const avatarUrl = resolveAvatarUrl(user);
  const name = displayFullName(user);
  const initials = name.slice(0, 2).toUpperCase();
  const memberLine = formatMemberSince(user?.created_at);
  const showGold = iosShowPremiumBar(accessState);
  const rankHasScore = Boolean(rank?.hasScore);
  const rankCenter =
    rank === undefined
      ? "…"
      : rankCenterLabel(rank?.topPercent, rankHasScore);
  const openPanel = (id) => {
    playUiSound("soft");
    setPanel(id);
  };

  useEffect(() => {
    let cancelled = false;
    fetchWeeklyRank()
      .then((row) => {
        if (!cancelled) setRank(row || null);
      })
      .catch(() => {
        if (!cancelled) setRank(null);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (panel === "history") {
    return (
      <AppTabShell className="ios-analyse-home" style={shellPad}>
        <DrillBar title="Historique" onBack={() => setPanel(null)} />
        <div className="app-shell" style={{ paddingTop: 8 }}>
          <HistoriqueTab
            embedded
            plan={plan}
            profile={profile}
            user={user}
            isPremium={isPremium}
            activePlanId={activePlanId}
            onTabChange={onTabChange}
            onUpgrade={onUpgrade}
            onShare={onShare}
          />
        </div>
      </AppTabShell>
    );
  }

  if (panel === "badges") {
    return (
      <AppTabShell className="ios-analyse-home" style={shellPad}>
        <DrillBar title="Badges" onBack={() => setPanel(null)} />
        <div className="app-shell" style={{ paddingTop: 8 }}>
          <IosBadgesPanel stats={stats} user={user} />
        </div>
      </AppTabShell>
    );
  }

  if (panel === "rank") {
    return (
      <AppTabShell className="ios-analyse-home" style={shellPad}>
        <DrillBar title="Rang" onBack={() => setPanel(null)} />
        <div className="app-shell" style={{ paddingTop: 8 }}>
          {!rank ? (
            <div className="ms-glass-card" style={{ padding: 16 }}>
              <p style={{ margin: 0, fontSize: 14, color: G.grey, lineHeight: 1.45 }}>
                {rank === undefined ? "Calcul du rang…" : "Rang indisponible."}
              </p>
            </div>
          ) : !rankHasScore ? (
            <div className="ms-glass-card" style={{ padding: 16 }}>
              <p style={{ margin: 0, fontSize: 14, color: G.grey, lineHeight: 1.45 }}>
                Nage une séance pour entrer.
              </p>
            </div>
          ) : (
            <div className="ios-analyse-list">
              <MetricRow
                label="Séances"
                value={`${rank.sessions} (${formatMul(rank.sessionCoef)})`}
              />
              <MetricRow
                label="Distance"
                value={formatKm(rank.meters)}
              />
              <MetricRow
                label="Allure"
                value={`${paceLabel(rank.pace100)} (${formatMul(rank.paceBonus)})`}
                onClick={() => openPanel("pace")}
              />
            </div>
          )}
        </div>
      </AppTabShell>
    );
  }

  if (panel === "pace") {
    return (
      <AppTabShell className="ios-analyse-home" style={shellPad}>
        <DrillBar title="Allure" onBack={() => setPanel(null)} />
        <div className="app-shell" style={{ paddingTop: 8 }}>
          <MonAllureCard
            profile={profile}
            pace100={profile?.pace100}
            pace50={profile?.pace50}
            pace400={profile?.pace400}
            isPremium={isPremium}
            onSave={onPaceUpdate}
            onUpgrade={onUpgrade}
          />
        </div>
      </AppTabShell>
    );
  }

  let step = 0;
  const nextStep = () => step++;

  return (
    <AppTabShell className="ios-analyse-home is-fit" style={shellPadFit}>
      <AppTopBar
        user={user}
        onOpenMenu={onOpenMenu}
        onAvatarClick={onTabChange ? () => onTabChange("profile") : undefined}
        plan={plan}
        onTabChange={onTabChange}
        onUpgrade={onUpgrade}
        immersive
      />

      <div className="app-shell" style={{ paddingTop: 2 }}>
        <FadeIn index={nextStep()} reduced={reduced}>
          <h1 className="ms-type-page">Tableau de bord</h1>
        </FadeIn>

        <FadeIn index={nextStep()} reduced={reduced}>
          <button
            type="button"
            className="ios-analyse-id"
            onClick={() => {
              playUiSound("soft");
              onTabChange?.("profile");
            }}
          >
            <span className="ios-analyse-avatar">
              {avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{initials}</span>}
            </span>
            <span className="ios-analyse-id-copy">
              <span className="ios-analyse-id-name">{name}</span>
              <span className="ios-analyse-id-since">{memberLine}</span>
            </span>
            <ChevronRight size={18} color={G.greyMid} />
          </button>
        </FadeIn>

        {showGold ? (
          <FadeIn index={nextStep()} reduced={reduced}>
            <div style={{ margin: "0 0 10px" }}>
              <IosPremiumBar onUpgrade={onUpgrade} source="analyse_trial" />
            </div>
          </FadeIn>
        ) : null}

        {!isPremium ? (
          <FadeIn index={nextStep()} reduced={reduced}>
            <div className="ms-glass-card" style={{ padding: "14px 14px", marginBottom: 10 }}>
              <p style={{ margin: 0, fontSize: 14, color: G.grey, lineHeight: 1.45 }}>
                Ton essai est terminé. Abonne-toi pour retrouver tes séances, tes analyses et le mot du coach.
              </p>
            </div>
          </FadeIn>
        ) : !plan ? (
          <FadeIn index={nextStep()} reduced={reduced}>
            <div className="ms-glass-card" style={{ padding: "14px 14px", marginBottom: 10 }}>
              <p style={{ margin: "0 0 12px", fontSize: 14, color: G.grey, lineHeight: 1.45 }}>
                Crée ton programme pour voir tes volumes et ta semaine.
              </p>
              <button
                type="button"
                className="ms-pill-cta"
                onClick={() => {
                  playUiSound("tap");
                  onTabChange?.("plan");
                }}
              >
                Créer mon programme
              </button>
            </div>
          </FadeIn>
        ) : (
          <>
            <FadeIn index={nextStep()} reduced={reduced} className="ios-analyse-grid">
              <div className="ms-glass-card ios-analyse-metric">
                <div className="ms-type-label">Séances</div>
                <div className="ms-type-display" style={{ fontSize: 24, marginTop: 4 }}>
                  <CountUp value={weekSessionStats.done} duration={0.9} delay={0.12} />
                  {weekSessionStats.planned > 0 ? (
                    <span style={{ fontSize: 14, fontWeight: 600, color: G.grey }}>
                      /{weekSessionStats.planned}
                    </span>
                  ) : null}
                </div>
                <div className="ms-type-caption" style={{ marginTop: 4 }}>cette semaine</div>
              </div>
              <button
                type="button"
                className="ms-glass-card ios-analyse-metric ios-analyse-metric-ring ios-analyse-rank"
                onClick={() => openPanel("rank")}
              >
                <div className="ms-type-label">Rang</div>
                <ScoreRing
                  ratio={rankHasScore ? rankRingRatio(rank.topPercent) : 0}
                  size={84}
                  stroke={7}
                  sublabel=""
                  center={rankCenter}
                />
              </button>
            </FadeIn>

            {weekDayStrip?.length ? (
              <FadeIn index={nextStep()} reduced={reduced}>
                <div
                  className="ios-analyse-week"
                  role="list"
                  aria-label="Cette semaine"
                >
                  {weekDayStrip.map((day, i) => (
                    <motion.div
                      key={day.key}
                      role="listitem"
                      className={[
                        "ios-analyse-week-day",
                        day.isToday ? "is-today" : "",
                        day.done ? "is-done" : "",
                        day.scheduled ? "is-scheduled" : "",
                      ].filter(Boolean).join(" ")}
                      initial={reduced ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: reduced ? 0 : 0.28,
                        delay: reduced ? 0 : 0.2 + i * 0.04,
                        ease: EASE,
                      }}
                    >
                      <span className="ios-analyse-week-label">{day.label}</span>
                      <span className="ios-analyse-week-num">{day.dateNum}</span>
                      <span
                        className={`ios-analyse-week-dot${day.done ? " is-on" : ""}${day.scheduled && !day.done ? " is-planned" : ""}`}
                        aria-hidden
                      />
                    </motion.div>
                  ))}
                </div>
              </FadeIn>
            ) : null}

            <FadeIn index={nextStep()} reduced={reduced} className="ios-analyse-list">
              <MetricRow
                label="Série"
                value={currentStreak > 0 ? (
                  <span className="ios-analyse-streak-val">
                    <Flame size={14} color="#D4A017" aria-hidden />
                    <CountUp value={currentStreak} duration={0.75} delay={0.18} />
                  </span>
                ) : "à lancer"}
              />
              <MetricRow
                label="Distance totale"
                value={(
                  <CountUp
                    value={stats.totalMeters || 0}
                    duration={1}
                    delay={0.2}
                    format={(n) => formatKm(n)}
                  />
                )}
              />
              <MetricRow
                label="Allure T100"
                value={paceLabel(profile?.pace100)}
                onClick={() => openPanel("pace")}
              />
              <MetricRow
                label="Badges"
                value={nextBadge?.homeValue || "voir"}
                progress={nextBadge?.ratio ?? null}
                onClick={() => openPanel("badges")}
              />
              <MetricRow
                label="Historique"
                value="voir"
                onClick={() => openPanel("history")}
              />
            </FadeIn>
          </>
        )}

        {!isPremium ? (
          <p className="ms-type-caption" style={{ textAlign: "center", marginTop: 8 }}>
            Dès {PRICING.monthlyCommit.label}/mois
          </p>
        ) : null}
      </div>
    </AppTabShell>
  );
}

const shellPad = {
  paddingBottom: "calc(var(--bottom-nav-h) + var(--safe-bottom) + var(--nav-lift) + 24px)",
  minHeight: "100dvh",
};

const shellPadFit = {
  paddingBottom: "calc(var(--bottom-nav-h) + var(--safe-bottom) + var(--nav-lift) + 12px)",
  height: "100dvh",
  overflow: "hidden",
};
