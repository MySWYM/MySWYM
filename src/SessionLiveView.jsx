/**
 * Vue séance (Accueil / prototype) — synthèse + entrée mode bassin.
 */
import { useState } from "react";
import WorkoutPrepView from "./workout/WorkoutPrepView.jsx";
import PoolMode from "./workout/PoolMode.jsx";

const G = {
  bg: "var(--myswym-bg, #000514)",
  surface: "var(--myswym-surface, #06101f)",
  ink: "var(--myswym-ink, #f4f8fa)",
  inkLight: "var(--myswym-ink-light, #9bb0c8)",
  blue: "var(--myswym-blue, #006bfd)",
  blueLight: "var(--myswym-blue-light, #0a162c)",
  grey: "var(--myswym-grey, #9bb0c8)",
  greyMid: "var(--myswym-grey-mid, #6b7c90)",
  greyLight: "var(--myswym-grey-light, rgba(0, 107, 253, 0.22))",
  greyXLight: "var(--myswym-grey-xlight, #0a162c)",
  white: "#FFFFFF",
};

/**
 * @param {{
 *  session: object,
 *  isPremium?: boolean,
 *  onStart?: () => void,
 *  onUpgrade?: () => void,
 *  ctaLabel?: string,
 *  badge?: string,
 *  subtitle?: string,
 *  showCta?: boolean,
 *  sessionKey?: string,
 *  onFinishPool?: () => void,
 * }} props
 */
export default function SessionLiveView({
  session,
  isPremium = true,
  onStart,
  onUpgrade,
  ctaLabel,
  badge = "Séance du jour",
  subtitle = null,
  showCta = true,
  sessionKey = "live",
  onFinishPool,
}) {
  const [poolOpen, setPoolOpen] = useState(false);
  const accent = { bg: "var(--myswym-blue-light, #0a162c)", color: "var(--myswym-blue, #006bfd)" };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontFamily: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
            fontSize: 26,
            fontWeight: 700,
            color: G.ink,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
          }}>
            Aujourd&apos;hui
          </div>
          <div style={{ fontSize: 12, color: G.inkLight, marginTop: 4, fontWeight: 600 }}>
            {subtitle || session?.title || "Séance du jour"}
          </div>
        </div>
        <div style={{
          padding: "7px 10px",
          borderRadius: 999,
          background: G.surface,
          border: `1px solid ${G.greyLight}`,
          fontSize: 10,
          fontWeight: 800,
          color: G.blue,
          whiteSpace: "nowrap",
        }}>
          {badge}
        </div>
      </div>

      <WorkoutPrepView
        session={session}
        colors={G}
        accent={accent}
        isPremium={isPremium}
        showStart={showCta}
        showProvenance={false}
        startLabel={ctaLabel || (isPremium ? "Commencer la séance" : "S’abonner pour nager")}
        onUpgrade={onUpgrade}
        onStart={() => {
          if (!isPremium) {
            onUpgrade?.();
            return;
          }
          onStart?.();
          setPoolOpen(true);
        }}
      />

      {poolOpen && (
        <PoolMode
          session={session}
          sessionKey={sessionKey}
          colors={G}
          accent={accent}
          onClose={() => setPoolOpen(false)}
          onFinish={() => {
            setPoolOpen(false);
            onFinishPool?.();
          }}
        />
      )}
    </div>
  );
}
