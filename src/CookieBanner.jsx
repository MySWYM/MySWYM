import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "myswym_cookie_consent_v1";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      setVisible(!saved);
    } catch {
      setVisible(true);
    }
  }, []);

  const saveChoice = (choice) => {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // Ignore storage failures and just hide banner.
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
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
    }}>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "#434751" }}>
        Nous utilisons des cookies necessaires au fonctionnement du site et, avec votre accord,
        des cookies de mesure d'audience.{" "}
        <Link to="/politique-cookies" style={{ color: "#154388", fontWeight: 700, textDecoration: "none" }}>
          En savoir plus
        </Link>
      </p>
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <button
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
          Refuser
        </button>
        <button
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
          Tout accepter
        </button>
      </div>
    </div>
  );
}
