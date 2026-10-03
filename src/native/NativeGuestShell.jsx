import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import BrandLogo from "../BrandLogo.jsx";
import { AppTabShell } from "../app-shell/index.js";
import { clearNativeQuizStarted } from "../lib/native-welcome.js";

/**
 * Chrome visiteur iOS.
 * `funnel` : DA welcome (bleu, verre), sans mist de l’app connectée.
 */
export default function NativeGuestShell({
  children,
  showLogin = false,
  showHeader = true,
  showBrand = true,
  funnel = false,
  onClose = null,
}) {
  const { t } = useTranslation("common");
  const { pathname } = useLocation();
  const onAuth = pathname === "/connexion" || pathname === "/inscription";

  const header = showHeader ? (
    <header
      className="ms-app-topbar is-immersive native-funnel-topbar"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "transparent",
        paddingTop: "var(--safe-top)",
      }}
    >
      <div
        className="app-shell"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          paddingTop: 12,
          paddingBottom: 12,
          minHeight: 56,
        }}
      >
        <div style={{ lineHeight: 0, minWidth: 44 }}>
          {typeof onClose === "function" ? (
            <button
              type="button"
              className="ms-glass-icon-btn native-auth-close"
              onClick={onClose}
              aria-label={t("close")}
            >
              <X size={22} strokeWidth={2.25} aria-hidden />
            </button>
          ) : showBrand ? (
            <BrandLogo variant={funnel ? "mark" : "wordmark"} onDark={funnel} height={funnel ? 26 : 22} alt="MySWYM" />
          ) : (
            <span style={{ width: 44 }} />
          )}
        </div>
        {showLogin && !onAuth ? (
          <Link
            to="/connexion"
            className="ms-glass-icon-btn native-guest-chip"
          >
            {t("nav.login")}
          </Link>
        ) : (
          <span style={{ width: 44 }} />
        )}
      </div>
    </header>
  ) : null;

  if (funnel) {
    return (
      <div className="native-funnel-shell">
        {header}
        {children}
      </div>
    );
  }

  return (
    <AppTabShell style={{ minHeight: "100dvh" }}>
      {header}
      {children}
    </AppTabShell>
  );
}

/** Questionnaire visiteur iOS : croix → welcome, chip connexion, sans wordmark. */
export function NativeOnboardingFrame({ children }) {
  return (
    <div className="myswym-native-guest is-funnel">
      <NativeGuestShell
        funnel
        showLogin
        showBrand={false}
        onClose={() => clearNativeQuizStarted()}
      >
        <div className="app-shell native-onboarding-shell">
          {children}
        </div>
      </NativeGuestShell>
    </div>
  );
}
