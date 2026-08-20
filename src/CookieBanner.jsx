import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { COOKIE_CONSENT_KEY } from "./lib/cookie-consent.js";
import { BRAND, FONT } from "./theme/brand.js";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sync = () => {
      try {
        setVisible(!localStorage.getItem(COOKIE_CONSENT_KEY));
      } catch {
        setVisible(true);
      }
    };
    sync();
    window.addEventListener("myswym:cookie-consent-reset", sync);
    return () => window.removeEventListener("myswym:cookie-consent-reset", sync);
  }, []);

  const saveChoice = (choice) => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, choice);
    } catch { /* ignore */ }
    try {
      window.dispatchEvent(new CustomEvent("myswym:cookie-consent-changed", { detail: { choice } }));
    } catch { /* ignore */ }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Consentement cookies"
      style={{
        position: "fixed",
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: 999,
        background: BRAND.card,
        border: `1px solid ${BRAND.border}`,
        borderRadius: 16,
        padding: "14px 14px",
        boxShadow: BRAND.shadowMd,
        fontFamily: FONT,
        maxWidth: 560,
        margin: "0 auto",
      }}
    >
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: BRAND.inkLight }}>
        Nous utilisons des cookies et un stockage local <strong style={{ color: BRAND.ink }}>nécessaires</strong> au fonctionnement
        (session, sécurité, préférences). Avec ton accord, nous mesurons aussi l’usage produit via{" "}
        <strong style={{ color: BRAND.ink }}>PostHog</strong> et les performances via <strong style={{ color: BRAND.ink }}>Vercel Speed Insights</strong>
        {" "}(événements sans contenu de séance ni notes personnelles).{" "}
        <Link to="/politique-cookies" style={{ color: BRAND.primaryDeep, fontWeight: 700, textDecoration: "none" }}>
          En savoir plus
        </Link>
      </p>
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => saveChoice("refused")}
          style={{
            background: "none",
            border: `1px solid ${BRAND.outlineVar}`,
            borderRadius: 10,
            padding: "8px 12px",
            fontSize: 12,
            color: BRAND.inkLight,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Continuer sans cookies non essentiels
        </button>
        <button
          type="button"
          onClick={() => saveChoice("accepted")}
          style={{
            background: BRAND.primary,
            border: "none",
            borderRadius: 10,
            padding: "8px 12px",
            fontSize: 12,
            color: BRAND.accentText,
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Accepter
        </button>
      </div>
    </div>
  );
}
