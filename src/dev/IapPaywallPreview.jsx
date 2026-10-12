import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { applyTheme } from "../theme/palette.js";
import SoftMistSheet from "../sheets/SoftMistSheet.jsx";
import IosIapPaywall from "../sheets/IosIapPaywall.jsx";

function Preview() {
  const [period, setPeriod] = useState("annual");
  const [intro, setIntro] = useState(true);
  return (
    <SoftMistSheet
      open
      fullscreenMobile
      ariaLabel="Abonnement Premium"
      className="ms-iap-paywall-overlay"
      bodyClassName="ms-soft-sheet-body--tall"
    >
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button type="button" onClick={() => setIntro(true)}>Essai dispo</button>
        <button type="button" onClick={() => setIntro(false)}>Essai déjà utilisé</button>
      </div>
      <IosIapPaywall
        period={period}
        onPeriodChange={setPeriod}
        monthlyPrice="8,99€"
        annualPrice="59,99€"
        trialEligible={intro}
        pinRestore={!intro}
        subtitle={intro ? undefined : "L'essai gratuit a déjà été utilisé avec cet identifiant Apple. Ton abonnement démarre aujourd'hui, résiliable à tout moment."}
      />
    </SoftMistSheet>
  );
}

export function mountIapPaywallPreview() {
  applyTheme();
  document.documentElement.classList.add("myswym-ios");
  document.documentElement.classList.remove("myswym-boot-public");
  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <BrowserRouter>
        <Preview />
      </BrowserRouter>
    </StrictMode>,
  );
}
