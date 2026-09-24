import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { applyTheme } from "../theme/palette.js";
import SoftMistSheet from "../sheets/SoftMistSheet.jsx";
import IosIapPaywall from "../sheets/IosIapPaywall.jsx";

function Preview() {
  const [period, setPeriod] = useState("annual");
  return (
    <SoftMistSheet
      open
      fullscreenMobile
      ariaLabel="Abonnement Premium"
      className="ms-iap-paywall-overlay"
      bodyClassName="ms-soft-sheet-body--tall"
    >
      <IosIapPaywall
        period={period}
        onPeriodChange={setPeriod}
        monthlyPrice="6,99€"
        annualPrice="59,99€"
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
