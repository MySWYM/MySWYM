import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { IosSubscriptionPanel } from "../profile/IosSettings.jsx";
import { applyTheme } from "../theme/palette.js";
import i18n from "../i18n/index.js";
import "../profile/ios-profile.css";

function Preview() {
  const [stopped, setStopped] = useState(false);
  const [note, setNote] = useState("");
  const access = {
    status: "trial",
    trialEndsAt: new Date(Date.now() + 5 * 86400000).toISOString(),
    cancelAtPeriodEnd: stopped,
    billingProvider: "stripe",
  };

  return (
    <div style={{ minHeight: "100dvh", background: "#EAF2FA" }}>
      <IosSubscriptionPanel
        onBack={() => {}}
        canManageSubscription={false}
        isPremium
        applePaid={false}
        nativeIos={false}
        access={access}
        onStopTrial={() => setNote("Dans l’app, ce bouton ouvre Stripe. Sur iPhone, il ouvre Réglages, Apple ID, Abonnements.")}
      />
      <div
        style={{
          position: "fixed",
          left: 16,
          right: 16,
          bottom: 24,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          alignItems: "center",
        }}
      >
        {note ? (
          <p style={{ margin: 0, fontSize: 13, color: "#4A5D72", textAlign: "center" }}>{note}</p>
        ) : null}
        <button
          type="button"
          onClick={() => { setStopped((v) => !v); setNote(""); }}
          style={{
            border: "none",
            background: "rgba(255,255,255,0.9)",
            borderRadius: 999,
            padding: "10px 16px",
            font: "inherit",
            fontSize: 13,
            fontWeight: 650,
            color: "#0F1B2D",
            cursor: "pointer",
          }}
        >
          {stopped ? "Revoir l’essai en cours" : "Voir après arrêt"}
        </button>
      </div>
    </div>
  );
}

export async function mountTrialStopPreview() {
  applyTheme();
  document.documentElement.lang = "fr";
  document.documentElement.classList.add("myswym-ios");
  document.documentElement.classList.remove("myswym-boot-public");
  if (!i18n.isInitialized) {
    await new Promise((resolve) => { i18n.on("initialized", resolve); });
  }
  await i18n.changeLanguage("fr");
  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <Preview />
    </StrictMode>,
  );
}
