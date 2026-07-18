import { useEffect, useState } from "react";

const FONT = "'Lexend', sans-serif";

const EXPLORER_LINKS = [
  ["Comment ça marche", "/comment-ca-marche"],
  ["Objectifs", "/objectifs"],
  ["Tarifs", "/tarifs"],
  ["Blog", "/blog"],
  ["Contact", "/contact"],
];

const LEGAL_LINKS = [
  ["Mentions légales", "/mentions-legales"],
  ["Politique de confidentialité", "/politique-confidentialite"],
  ["Politique de cookies", "/politique-cookies"],
  ["CGU", "/cgu"],
  ["CGV", "/cgv"],
];

function useIsMobile(bp = 640) {
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < bp);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp - 1}px)`);
    const apply = () => setMobile(mq.matches || window.innerWidth < bp);
    apply();
    mq.addEventListener?.("change", apply);
    window.addEventListener("resize", apply);
    return () => {
      mq.removeEventListener?.("change", apply);
      window.removeEventListener("resize", apply);
    };
  }, [bp]);
  return mobile;
}

/** Footer marketing — afficher sur toutes les pages publiques et l'app. */
export default function Footer({ aboveBottomNav = false }) {
  const isMobile = useIsMobile();
  return (
    <footer
      id="contact"
      style={{
        background: "#191c1e",
        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
        padding: isMobile ? "32px 20px" : "36px 24px",
        marginBottom: aboveBottomNav
          ? "calc(var(--bottom-nav-h, 72px) + var(--safe-bottom, env(safe-area-inset-bottom, 0px)) + var(--nav-lift, 0px))"
          : undefined,
      }}
    >
      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          flexWrap: "wrap",
          justifyContent: isMobile ? "center" : "space-between",
          alignItems: "center",
          gap: isMobile ? 20 : 16,
          textAlign: isMobile ? "center" : "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 16, color: "#ffffff", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            MySwym
          </span>
        </div>
        <div style={{ display: "flex", gap: isMobile ? 18 : 30, flexWrap: "wrap", justifyContent: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: isMobile ? "center" : "flex-start", gap: 8 }}>
            <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: FONT }}>
              Explorer
            </span>
            {EXPLORER_LINKS.map(([l, h]) => (
              <a
                key={l}
                href={h}
                style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textDecoration: "none", transition: "color 0.2s", fontFamily: FONT }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#ffffff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
              >
                {l}
              </a>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: isMobile ? "center" : "flex-start", gap: 8 }}>
            <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: FONT }}>
              Légal
            </span>
            {LEGAL_LINKS.map(([l, h]) => (
              <a
                key={l}
                href={h}
                style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textDecoration: "none", transition: "color 0.2s", fontFamily: FONT }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#ffffff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
              >
                {l}
              </a>
            ))}
          </div>
        </div>
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, fontFamily: FONT }}>
          © 2025 MySWYM. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
