import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { resetCookieConsent } from "./CookieBanner.jsx";
import BrandLogo from "./BrandLogo.jsx";
import LanguageSwitcher from "./i18n/LanguageSwitcher.jsx";

const FONT = "'Lexend', sans-serif";

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
  const { t } = useTranslation("common");
  const isMobile = useIsMobile();
  const year = new Date().getFullYear();

  const explorerLinks = [
    [t("footer.home"), "/accueil"],
    [t("footer.why"), "/accueil#pourquoi"],
    [t("footer.how"), "/comment-ca-marche"],
    [t("footer.pricing"), "/accueil#pricing"],
    [t("footer.faq"), "/accueil#faq"],
    [t("footer.blog"), "/blog"],
    [t("footer.contact"), "/contact"],
  ];

  const legalLinks = [
    [t("footer.legalMentions"), "/mentions-legales"],
    [t("footer.privacy"), "/politique-confidentialite"],
    [t("footer.cookies"), "/politique-cookies"],
    [t("footer.cgu"), "/cgu"],
    [t("footer.cgv"), "/cgv"],
  ];

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
        <div style={{ display: "flex", flexDirection: "column", alignItems: isMobile ? "center" : "flex-start", gap: 8, maxWidth: 260 }}>
          <BrandLogo height={52} onDark />
          <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: 13, lineHeight: 1.5, fontFamily: FONT }}>
            {t("footer.tagline")}
          </p>
          <a
            href="https://www.instagram.com/myswym.app/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, textDecoration: "none", fontFamily: FONT }}
          >
            Instagram
          </a>
        </div>
        <div style={{ display: "flex", gap: isMobile ? 18 : 30, flexWrap: "wrap", justifyContent: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: isMobile ? "center" : "flex-start", gap: 8 }}>
            <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: FONT }}>
              {t("footer.explore")}
            </span>
            {explorerLinks.map(([l, h]) => (
              <a
                key={h}
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
              {t("footer.legal")}
            </span>
            {legalLinks.map(([l, h]) => (
              <a
                key={h}
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
        <div style={{ display: "flex", flexDirection: "column", alignItems: isMobile ? "center" : "flex-end", gap: 10 }}>
          <LanguageSwitcher variant="footer" />
          <button
            type="button"
            onClick={() => resetCookieConsent()}
            style={{
              background: "none", border: "none", padding: 0, cursor: "pointer",
              color: "rgba(255,255,255,0.4)", fontSize: 13, fontFamily: FONT, textDecoration: "underline",
            }}
          >
            {t("footer.manageCookies")}
          </button>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, fontFamily: FONT }}>
            {t("footer.rights", { year })}
          </div>
        </div>
      </div>
    </footer>
  );
}
