import { useEffect, useState } from "react";
import { Check, Zap } from "lucide-react";
import { G } from "../theme/palette.js";
import Btn from "../ui/Btn.jsx";
import CheckoutLegalGates, { checkoutGatesReady, checkoutGatesError } from "../CheckoutLegalGates.jsx";
import { supabase } from "../supabase.js";
import { PRICING, PRICING_SUMMARY_FR, priceIdForPlan } from "../lib/pricing.js";
import { getUpgradeCopy } from "../lib/coach-insights.js";
import { trackEvent } from "../lib/analytics.js";
import { captureReferralFromUrl, resolveReferralCode } from "../lib/referral.js";

const PREMIUM_TIER_LINES = [
  `Essai 7 jours sans carte, puis ${PRICING_SUMMARY_FR}`,
  "Séances complètes + allures à la seconde (T100)",
  "Adaptation coach après feedback séance / semaine",
  "Plan jusqu’à ton événement · jusqu’à 5× / semaine",
  "Projection d’allures · plans complets · vidéos technique",
];

export default function UpgradeModal ({ onClose, weeksBlocked, softContext = null, trialEligible = true, planWeeks = 0, canDismiss = true }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [period, setPeriod] = useState("monthly_flex");
  const [user, setUser] = useState(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptWithdrawal, setAcceptWithdrawal] = useState(false);
  const legalReady = checkoutGatesReady(acceptTerms, acceptWithdrawal);

  useEffect(() => {
    captureReferralFromUrl();
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null));
  }, []);

  useEffect(() => {
    if (legalReady) setErr(null);
  }, [legalReady]);

  const hasReferral = Boolean(resolveReferralCode(user));
  const showTrialOffer = false;
  const isAnnual = period === "annual";
  const isCommit = period === "monthly_commit";
  const selectedPriceId = priceIdForPlan(period);
  const trialEnded = softContext === "trial_expired" || !!weeksBlocked;
  const resolvedContext = trialEnded && softContext !== "trial_expired" ? "trial_expired" : softContext;
  const copy = getUpgradeCopy(resolvedContext, {
    weeks: planWeeks || 0,
    trialEligible,
  });
  const headline = copy.headline;
  const subtitle = copy.subtitle;

  const handleAcceptTerms = (checked) => {
    setAcceptTerms(checked);
    setErr(null);
  };

  const handleAcceptWithdrawal = (checked) => {
    setAcceptWithdrawal(checked);
    setErr(null);
  };

  const callFunction = async (fnName, body) => {
    const { data: refreshData } = await supabase.auth.refreshSession();
    const session = refreshData?.session;
    if (!session) throw new Error("Connecte-toi d'abord.");
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${fnName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}`, "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  const handleCheckout = async () => {
    if (loading) return;
    const gateError = checkoutGatesError(acceptTerms, acceptWithdrawal);
    if (gateError) {
      setErr(gateError);
      return;
    }
    setLoading(true); setErr(null);
    try {
      const priceId = selectedPriceId;
      const referralCode = resolveReferralCode(user);
      trackEvent("checkout_started", {
        source: "upgrade_modal",
        price_id: priceId,
        soft_context: softContext || null,
      }, { essential: true });
      const json = await callFunction("create-checkout", {
        origin: window.location.origin,
        priceId,
        ...(referralCode ? { referralCode } : {}),
      });
      if (json.url) { window.location.href = json.url; return; }
      if (json.alreadySubscribed) {
        setErr(json.error || "Tu as déjà un abonnement en cours.");
        setLoading(false);
        return;
      }
      throw new Error(json.error || "Lien de paiement introuvable");
    } catch (e) { setErr(e.message || "Erreur."); setLoading(false); }
  };

  const ctaLabel = isAnnual
    ? `Démarrer : ${PRICING.annual.label}/an`
    : isCommit
      ? `Démarrer : ${PRICING.monthlyCommit.label}/mois · 12 mois`
      : showTrialOffer
        ? `Essai 7 jours, puis ${PRICING.monthlyFlex.label}/mois`
        : hasReferral
          ? "Démarrer : −20% parrainage"
          : `Démarrer : ${PRICING.monthlyFlex.label}/mois`;

  return (
    <div className="sheet-overlay" onClick={e => canDismiss && e.target === e.currentTarget && onClose()}>
      <div className="sheet-panel ms-sheet-card scale-in">
        <div className="ms-sheet-handle" />
        <div style={{ textAlign: "center", marginBottom: 22, paddingTop: 4 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: G.blue, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <Zap size={24} color={G.white} />
          </div>
          <h3 style={{ fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif", fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", textTransform: "none", color: G.ink, marginBottom: 8 }}>
            {headline}
          </h3>
          <p style={{ color: G.grey, fontSize: 14, lineHeight: 1.6 }}>{subtitle}</p>
          <p style={{ color: G.greyMid, fontSize: 12, marginTop: 10, lineHeight: 1.45 }}>
            {PRICING_SUMMARY_FR} · résiliation via le portail Stripe
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          <button type="button" onClick={() => setPeriod("monthly_flex")} style={{
            width: "100%", padding: "12px 14px", borderRadius: 12, cursor: "pointer", textAlign: "left",
            border: `1.5px solid ${period === "monthly_flex" ? G.blue : G.greyLight}`,
            background: period === "monthly_flex" ? G.blueLight : G.surface,
            position: "relative",
            minHeight: 56,
          }}>
            {hasReferral && period === "monthly_flex" && (
              <div style={{
                position: "absolute", top: 8, right: 8,
                background: G.mint, color: G.white,
                fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 6,
              }}>−20%</div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: period === "monthly_flex" ? G.blue : G.grey, letterSpacing: "0.04em" }}>MENSUEL</div>
                <div style={{ fontSize: 12, color: G.greyMid, marginTop: 2 }}>{PRICING.monthlyFlex.commitmentFr}</div>
              </div>
              <div style={{ fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif", fontSize: 22, fontWeight: 800, color: G.ink }}>
                {PRICING.monthlyFlex.label}<span style={{ fontSize: 13, fontWeight: 600, color: G.grey }}> /mois</span>
              </div>
            </div>
          </button>

          <button type="button" onClick={() => setPeriod("monthly_commit")} style={{
            width: "100%", padding: "12px 14px", borderRadius: 12, cursor: "pointer", textAlign: "left",
            border: `1.5px solid ${period === "monthly_commit" ? G.blue : G.greyLight}`,
            background: period === "monthly_commit" ? G.blueLight : G.surface,
            minHeight: 56,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: period === "monthly_commit" ? G.blue : G.grey, letterSpacing: "0.04em" }}>MENSUEL 12 MOIS</div>
                <div style={{ fontSize: 12, color: G.greyMid, marginTop: 2 }}>{PRICING.monthlyCommit.commitmentFr}</div>
              </div>
              <div style={{ fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif", fontSize: 22, fontWeight: 800, color: G.ink }}>
                {PRICING.monthlyCommit.label}<span style={{ fontSize: 13, fontWeight: 600, color: G.grey }}> /mois</span>
              </div>
            </div>
          </button>

          <button type="button" onClick={() => setPeriod("annual")} style={{
            width: "100%", padding: "12px 14px", borderRadius: 12, cursor: "pointer", textAlign: "left",
            border: `1.5px solid ${period === "annual" ? G.blue : G.greyLight}`,
            background: period === "annual" ? G.blueLight : G.surface,
            minHeight: 56,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: period === "annual" ? G.blue : G.grey, letterSpacing: "0.04em" }}>ANNUEL</div>
                <div style={{ fontSize: 12, color: G.greyMid, marginTop: 2 }}>{PRICING.annual.commitmentFr}</div>
              </div>
              <div style={{ fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif", fontSize: 22, fontWeight: 800, color: G.ink }}>
                {PRICING.annual.label}<span style={{ fontSize: 13, fontWeight: 600, color: G.grey }}> /an</span>
              </div>
            </div>
          </button>
        </div>

        {showTrialOffer && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: G.blueLight, border: `1px solid ${G.greyLight}`, borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: G.blue, lineHeight: 1.4, textAlign: "center" }}>
              7 jours offerts sans carte à l’inscription · ensuite tes séances se mettent en pause
            </span>
          </div>
        )}

        {isCommit && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: G.goldLight, border: `1px solid ${G.greyLight}`, borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: G.gold, lineHeight: 1.45, textAlign: "center" }}>
              {PRICING.monthlyCommit.label}/mois pendant 12 mois · pas de remboursement ni de fin anticipée avant la fin (hors cas légaux)
            </span>
          </div>
        )}

        {isAnnual && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: G.goldLight, border: `1px solid ${G.greyLight}`, borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: G.gold, lineHeight: 1.45, textAlign: "center" }}>
              {PRICING.annual.label} facturés une fois · pas de remboursement au prorata hors cas légaux
            </span>
          </div>
        )}

        {hasReferral && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: G.mintLight, border: `1px solid ${G.greyLight}`, borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: G.mint }}>Parrainage actif : −20% auto au paiement</span>
          </div>
        )}

        {!hasReferral && (
          <p style={{ fontSize: 12, color: G.greyMid, textAlign: "center", marginBottom: 16, lineHeight: 1.4 }}>
            Un ami t’a parrainé ? −20% auto au paiement.
          </p>
        )}

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>
            Inclus avec Premium
          </div>
          {PREMIUM_TIER_LINES.map((line, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: i < PREMIUM_TIER_LINES.length - 1 ? 8 : 0 }}>
              <Check size={14} color={G.blue} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 13, color: G.ink, lineHeight: 1.4 }}>{line}</span>
            </div>
          ))}
        </div>

        <CheckoutLegalGates
          acceptTerms={acceptTerms}
          onAcceptTerms={handleAcceptTerms}
          acceptWithdrawal={acceptWithdrawal}
          onAcceptWithdrawal={handleAcceptWithdrawal}
          ink={G.ink}
          muted={G.inkLight}
          linkColor={G.blueMid}
          idPrefix="upgrade-modal-legal"
        />

        {err && <div style={{ background: G.coralLight, borderRadius: 10, padding: "10px 14px", marginBottom: 12, color: G.coral, fontSize: 13 }}>{err}</div>}
        <Btn variant="blue" onClick={handleCheckout} disabled={loading}>
          {loading ? "Redirection…" : ctaLabel}
        </Btn>
        {canDismiss && (
          <button type="button" onClick={onClose} style={{ width: "100%", marginTop: 10, padding: "12px", background: "none", border: "none", color: G.grey, cursor: "pointer", fontSize: 13 }}>
            Retour
          </button>
        )}
      </div>
    </div>
  );
}
