import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { G } from "../theme/palette.js";
import { PRICING_SUMMARY_FR } from "../lib/pricing.js";
import { getAccessState } from "../lib/access.js";
import { isNativeApp } from "../lib/native-platform.js";
import { syncSubscriptionFromStripe } from "../lib/sync-subscription.js";
import { restoreAndSyncAppleIap } from "../lib/native-iap.js";
import { supabase } from "../supabase.js";
import Btn from "../ui/Btn.jsx";
import SoftMistSheet from "./SoftMistSheet.jsx";
import SessionHeroCard from "../SessionHeroCard.jsx";
import SupportBubble from "../SupportBubble.jsx";

const MUTED = "#4a5d72";

export default function TrialExpiredFreeze({ onSubscribe, onSignOut, preview = null }) {
  const native = isNativeApp();
  const [user, setUser] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncErr, setSyncErr] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null));
  }, []);

  // iOS / TF : récupère Premium Stripe (ou review) dès l’écran gelé, sans attendre un tap.
  useEffect(() => {
    if (!native) return undefined;
    let cancelled = false;
    (async () => {
      setSyncing(true);
      try {
        const u = await syncSubscriptionFromStripe();
        if (cancelled) return;
        setUser(u);
        if (u && getAccessState(u).hasPremiumAccess) {
          window.location.reload();
        }
      } catch {
        /* bouton Synchroniser reste dispo */
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();
    return () => { cancelled = true; };
  }, [native]);
  const heroPreview = preview
    ? {
        title: preview.title || "Séance",
        type: preview.type || "En pause",
        distanceLabel: preview.distance ? `${preview.distance} m` : null,
        durationLabel: preview.duration ? `${preview.duration} min` : null,
        blocks: preview.blocks || [],
      }
    : null;

  const handleNativeSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncErr("");
    try {
      const restored = await restoreAndSyncAppleIap();
      const u = restored && getAccessState(restored).hasPremiumAccess
        ? restored
        : await syncSubscriptionFromStripe();
      setUser(u);
      if (u && getAccessState(u).hasPremiumAccess) {
        window.location.reload();
        return;
      }
      setSyncErr("Pas d’abonnement actif sur ce compte.");
    } catch {
      setSyncErr("Impossible de synchroniser. Réessaie ou écris au support.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <>
    <SoftMistSheet
      open
      eyebrow="Essai terminé"
      title="Ton essai est terminé"
      subtitle={
        native
          ? "Le coach est en pause. Abonne-toi via l’App Store, ou synchronise si tu es déjà Premium sur le site."
          : `Le coach est en pause. Abonne-toi pour reprendre tes séances, ${PRICING_SUMMARY_FR}.`
      }
      onClose={undefined}
      dismissOnOverlay={false}
      zIndex={500}
      ariaLabel="Essai terminé"
      bodyClassName="ms-soft-sheet-body--tall"
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: G.blue,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 18px",
        }}
      >
        <Lock size={24} color={G.white} />
      </div>

      {heroPreview ? (
        <div
          aria-hidden
          style={{
            textAlign: "left",
            marginBottom: 22,
            filter: "blur(5px)",
            opacity: 0.55,
            pointerEvents: "none",
            userSelect: "none",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 28,
              zIndex: 1,
              background: "linear-gradient(180deg, transparent 30%, rgba(244, 248, 252, 0.85) 100%)",
            }}
          />
          <SessionHeroCard preview={heroPreview} kicker="Aperçu, en pause" className="is-compact" />
        </div>
      ) : null}

      {native ? (
        <>
          <Btn variant="blue" onClick={onSubscribe} style={{ width: "100%", minHeight: 52 }}>
            Reprendre avec Premium
          </Btn>
          <Btn variant="ghost" onClick={handleNativeSync} style={{ width: "100%", minHeight: 52, marginTop: 10 }} disabled={syncing}>
            {syncing ? "Synchronisation…" : "J’ai déjà Premium, restaurer"}
          </Btn>
        </>
      ) : (
        <Btn variant="blue" onClick={onSubscribe} style={{ width: "100%", minHeight: 52 }}>
          Reprendre avec Premium
        </Btn>
      )}
      {syncErr ? (
        <p style={{ fontSize: 13, color: G.coral, marginTop: 12, lineHeight: 1.45, textAlign: "center" }}>
          {syncErr}
        </p>
      ) : null}
      <button
        type="button"
        onClick={onSignOut}
        style={{
          width: "100%",
          marginTop: 12,
          padding: 14,
          border: "none",
          background: "none",
          color: MUTED,
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          minHeight: 44,
        }}
      >
        Se déconnecter
      </button>
      {native ? (
        <p style={{ fontSize: 12, color: MUTED, marginTop: 16, lineHeight: 1.45, textAlign: "center" }}>
          Besoin d’aide ? La loutre en bas à droite ouvre le support.
        </p>
      ) : (
        <p style={{ fontSize: 12, color: MUTED, marginTop: 16, lineHeight: 1.45, textAlign: "center" }}>
          Besoin d’aide ?{" "}
          <a href="mailto:support@myswym.app" style={{ color: G.blue, fontWeight: 700, textDecoration: "none" }}>
            support@myswym.app
          </a>
        </p>
      )}
    </SoftMistSheet>
    {native ? (
      <div className="trial-freeze-support">
        <SupportBubble aboveBottomNav={false} user={user} />
      </div>
    ) : null}
    </>
  );
}
