import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { G } from "../theme/palette.js";
import Btn from "../ui/Btn.jsx";
import CheckoutLegalGates, { checkoutGatesReady, checkoutGatesError } from "../CheckoutLegalGates.jsx";
import { buildPlanReadyInsights } from "../lib/coach-insights.js";
import { sessionCardModel } from "../lib/plan-reveal.js";
import SessionHeroCard from "../SessionHeroCard.jsx";
import { canonicalizeGoal } from "../lib/sports-engine/race-event.js";

/** Labels objectifs (sous-ensemble affiché dans le sheet post-génération). */
const GOAL_LABELS = {
  progression: "Nager & Progresser",
  triathlon_xs: "Triathlon XS",
  triathlon_sprint: "Triathlon Sprint",
  triathlon_olympic: "Triathlon Olympique",
  triathlon_half: "Triathlon Half",
  triathlon_ironman: "Triathlon Full",
  open_water_short: "Eau libre courte",
  open_water_mid: "Eau libre moyenne",
  open_water_long: "Eau libre longue",
  bnssa: "BNSSA",
};

export default function PlanReadySheet({ plan, profile, onContinue, onDismiss, loading }) {
  const goalLabel = GOAL_LABELS[canonicalizeGoal(profile?.goal)] || profile?.goal || "Objectif";
  const weeks = plan?.totalRealWeeks || plan?.weeks?.length || 0;
  const freq = profile?.sessionsPerWeek || 0;
  const firstSession = plan?.weeks?.[0]?.sessions?.[0];
  const preview = firstSession ? sessionCardModel(firstSession) : null;
  const isLoop = !!plan?.isSessionLoop || !!plan?.isProgression;
  const insights = buildPlanReadyInsights(plan, profile);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptWithdrawal, setAcceptWithdrawal] = useState(false);
  const [err, setErr] = useState(null);
  const legalReady = checkoutGatesReady(acceptTerms, acceptWithdrawal);

  useEffect(() => {
    if (legalReady) setErr(null);
  }, [legalReady]);

  const handleAcceptTerms = (checked) => {
    setAcceptTerms(checked);
    setErr(null);
  };

  const handleAcceptWithdrawal = (checked) => {
    setAcceptWithdrawal(checked);
    setErr(null);
  };

  const handleContinue = () => {
    const gateError = checkoutGatesError(acceptTerms, acceptWithdrawal);
    if (gateError) {
      setErr(gateError);
      return;
    }
    setErr(null);
    onContinue?.();
  };

  return (
    <div className="sheet-overlay" onClick={(e) => e.target === e.currentTarget && onDismiss?.()}>
      <div className="sheet-panel ms-sheet-card scale-in">
        <div className="ms-sheet-handle" />
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: G.blue,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
            }}
          >
            <Check size={24} color={G.white} />
          </div>
          <h3
            style={{
              fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif",
              fontSize: 28,
              fontWeight: 700,
              textTransform: "none",
              letterSpacing: "-0.03em",
              color: G.ink,
              marginBottom: 8,
            }}
          >
            {weeks > 4 && !isLoop ? `Ton plan ${weeks} semaines est prêt` : "Ton coach a préparé ton plan"}
          </h3>
          <p style={{ color: G.grey, fontSize: 14, lineHeight: 1.55, margin: 0 }}>
            Débloque les séances et l’adaptation coach, 7 jours offerts sans carte à l’inscription. Ensuite tes séances se mettent en pause.
          </p>
        </div>

        <div
          style={{
            border: `1px solid ${G.greyLight}`,
            borderRadius: 16,
            padding: "12px 14px",
            marginBottom: 14,
            background: G.blueLight,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: G.ink, marginBottom: 8 }}>{goalLabel}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 12, color: G.grey }}>
            {!isLoop && weeks > 0 && (
              <span style={{ background: G.surface, borderRadius: 8, padding: "6px 10px" }}>{weeks} semaines</span>
            )}
            {freq > 0 && (
              <span style={{ background: G.surface, borderRadius: 8, padding: "6px 10px" }}>{freq}× / semaine</span>
            )}
            {profile?.level && (
              <span style={{ background: G.surface, borderRadius: 8, padding: "6px 10px" }}>{profile.level}</span>
            )}
            {profile?.pool && (
              <span style={{ background: G.surface, borderRadius: 8, padding: "6px 10px" }}>{profile.pool} m</span>
            )}
          </div>
        </div>

        {preview && (
          <div style={{ marginBottom: 14 }}>
            <SessionHeroCard preview={preview} kicker="Aperçu 1ʳᵉ séance" className="is-compact" />
          </div>
        )}

        {insights.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: G.grey,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Ce que ton coach a déjà calibré
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    background: G.surface,
                    border: `1px solid ${G.greyLight}`,
                    borderRadius: 12,
                    padding: "10px 12px",
                  }}
                >
                  <Check size={14} color={G.blue} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 13, color: G.ink, lineHeight: 1.4, fontWeight: 600 }}>{insight.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <CheckoutLegalGates
          acceptTerms={acceptTerms}
          onAcceptTerms={handleAcceptTerms}
          acceptWithdrawal={acceptWithdrawal}
          onAcceptWithdrawal={handleAcceptWithdrawal}
          ink={G.ink}
          muted={G.inkLight}
          linkColor={G.blueMid}
          idPrefix="plan-ready-legal"
        />

        {err && (
          <div
            style={{
              background: G.coralLight,
              borderRadius: 10,
              padding: "10px 14px",
              marginBottom: 12,
              color: G.coral,
              fontSize: 13,
            }}
          >
            {err}
          </div>
        )}
        <Btn variant="blue" onClick={handleContinue} disabled={loading}>
          {loading ? "Redirection…" : "S’abonner : débloquer mon coach"}
        </Btn>
        <button
          type="button"
          onClick={onDismiss}
          style={{
            width: "100%",
            marginTop: 10,
            padding: "12px",
            background: "none",
            border: "none",
            color: G.grey,
            cursor: "pointer",
            fontSize: 13,
            minHeight: 44,
          }}
        >
          Voir l’aperçu sans activer
        </button>
      </div>
    </div>
  );
}
