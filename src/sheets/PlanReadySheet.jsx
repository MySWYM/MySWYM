import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { G } from "../theme/palette.js";
import Btn from "../ui/Btn.jsx";
import CheckoutLegalGates, { checkoutGatesReady, checkoutGatesError } from "../CheckoutLegalGates.jsx";
import { buildPlanReadyInsights } from "../lib/coach-insights.js";

/** Labels objectifs (sous-ensemble affiché dans le sheet post-génération). */
const GOAL_LABELS = {
  progression: "Nager & Progresser",
  triathlon_sprint: "Triathlon Sprint",
  triathlon_olympic: "Triathlon Olympique",
  triathlon_half: "Half Ironman",
  triathlon_ironman: "Ironman",
  open_water_5k: "Eau libre 5 km",
  open_water_10k: "Eau libre 10 km",
  bnssa: "BNSSA",
};

export default function PlanReadySheet ({ plan, profile, onContinue, onDismiss, loading }) {
  const goalLabel = GOAL_LABELS[profile?.goal] || profile?.goal || "Objectif";
  const weeks = plan?.totalRealWeeks || plan?.weeks?.length || 0;
  const freq = profile?.sessionsPerWeek || 0;
  const firstSession = plan?.weeks?.[0]?.sessions?.[0];
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
      <div className="sheet-panel scale-in" style={{ background: G.surface, borderRadius: "24px 24px 0 0", padding: "28px 20px", paddingBottom: "max(28px, env(safe-area-inset-bottom))", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: G.greyLight, margin: "0 auto 24px" }} />
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: G.blue, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Check size={26} color={G.white} />
          </div>
          <h3 style={{ fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif", fontSize: 34, fontWeight: 800, textTransform: "none", letterSpacing: "-0.03em", color: G.ink, marginBottom: 8 }}>
            {weeks > 4 && !isLoop ? `Ton plan ${weeks} semaines est prêt` : "Ton coach a préparé ton plan"}
          </h3>
          <p style={{ color: G.grey, fontSize: 14, lineHeight: 1.55, margin: 0 }}>
            Débloque les séances et l’adaptation coach — 7 jours offerts sans carte à l’inscription. Ensuite tes séances se mettent en pause.
          </p>
        </div>

        <div style={{ background: G.blueLight, border: `1px solid ${G.greyLight}`, borderRadius: 16, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: G.ink, marginBottom: 8 }}>{goalLabel}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 12, color: G.grey }}>
            {!isLoop && weeks > 0 && <span style={{ background: G.surface, borderRadius: 8, padding: "6px 10px" }}>{weeks} semaines</span>}
            {freq > 0 && <span style={{ background: G.surface, borderRadius: 8, padding: "6px 10px" }}>{freq}× / semaine</span>}
            {profile?.level && <span style={{ background: G.surface, borderRadius: 8, padding: "6px 10px" }}>{profile.level}</span>}
            {profile?.pool && <span style={{ background: G.surface, borderRadius: 8, padding: "6px 10px" }}>{profile.pool} m</span>}
          </div>
          {firstSession?.title && (
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${G.greyLight}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Aperçu 1ʳᵉ séance</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: G.ink }}>{firstSession.title}</div>
              {firstSession.distance != null && (
                <div style={{ fontSize: 12, color: G.greyMid, marginTop: 4 }}>{firstSession.distance} m</div>
              )}
            </div>
          )}
        </div>

        {insights.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
              Ce que ton coach a déjà calibré
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    background: G.surface, border: `1px solid ${G.greyLight}`,
                    borderRadius: 12, padding: "10px 12px",
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

        {err && <div style={{ background: G.coralLight, borderRadius: 10, padding: "10px 14px", marginBottom: 12, color: G.coral, fontSize: 13 }}>{err}</div>}
        <Btn variant="blue" onClick={handleContinue} disabled={loading}>
          {loading ? "Redirection…" : "S’abonner — débloquer mon coach"}
        </Btn>
        <button type="button" onClick={onDismiss} style={{ width: "100%", marginTop: 10, padding: "12px", background: "none", border: "none", color: G.grey, cursor: "pointer", fontSize: 13 }}>
          Voir l’aperçu sans activer
        </button>
      </div>
    </div>
  );
}
