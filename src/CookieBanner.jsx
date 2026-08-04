import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { COOKIE_CONSENT_KEY } from "./lib/cookie-consent.js";

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
        background: "#ffffff",
        border: "1px solid rgba(53,93,163,0.12)",
        borderRadius: 16,
        padding: "14px 14px",
        boxShadow: "0 12px 36px rgba(25,28,30,0.14)",
        fontFamily: "'Lexend', sans-serif",
        maxWidth: 560,
        margin: "0 auto",
      }}
    >
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "#434751" }}>
        Nous utilisons des cookies et un stockage local <strong>nécessaires</strong> au fonctionnement
        (session, sécurité, préférences). Aucune mesure d’audience tierce n’est active aujourd’hui.{" "}
        <Link to="/politique-cookies" style={{ color: "#154388", fontWeight: 700, textDecoration: "none" }}>
          En savoir plus
        </Link>
      </p>
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => saveChoice("refused")}
          style={{
            background: "none",
            border: "1px solid #c3c6d2",
            borderRadius: 10,
            padding: "8px 12px",
            fontSize: 12,
            color: "#5d5e61",
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
            background: "#8eb3ff",
            border: "none",
            borderRadius: 10,
            padding: "8px 12px",
            fontSize: 12,
            color: "#154388",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          OK
        </button>
      </div>
    </div>
  );
}
