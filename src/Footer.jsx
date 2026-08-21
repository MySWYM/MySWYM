import { useEffect, useState } from "react";
import { LocalizedLink } from "./i18n/locale-routing.jsx";
import { useTranslation } from "react-i18next";
import { resetCookieConsent } from "./lib/cookie-consent.js";
import BrandLogo from "./BrandLogo.jsx";
import LanguageSwitcher from "./i18n/LanguageSwitcher.jsx";

const FONT = "'Lexend', sans-serif";
const MUTED = "rgba(255,255,255,0.4)";

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

function Col({ title, links, center }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: center ? "center" : "flex-start", gap: 4 }}>
      <span style={{
        color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em",
        textTransform: "uppercase", fontFamily: FONT, marginBottom: 6,
      }}>
        {title}
      </span>
      {links.map(([label, href]) => (
        <LocalizedLink
          key={href}
          to={href}
          style={{
            color: MUTED, fontSize: 13, textDecoration: "none", fontFamily: FONT,
            minHeight: 36, display: "inline-flex", alignItems: "center",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#ffffff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = MUTED; }}
        >
          {label}
        </LocalizedLink>
      ))}
    </div>
  );
}

/** Footer marketing — afficher sur toutes les pages publiques et l'app. */
export default function Footer({ aboveBottomNav = false }) {
  const { t } = useTranslation("common");
  const isMobile = useIsMobile();
  const year = new Date().getFullYear();

  const productLinks = [
    [t("footer.home"), "/"],
    [t("footer.how"), "/comment-ca-marche"],
    [t("footer.pricing"), "/tarifs"],
    [t("footer.blog"), "/blog"],
  ];
  const helpLinks = [
    [t("footer.faq"), "/faq"],
    [t("footer.contact"), "/contact"],
  ];
  const accountLinks = [
    [t("nav.login"), "/connexion"],
    [t("nav.cta"), "/app"],
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
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "minmax(180px, 1.1fr) repeat(4, minmax(0, 1fr))",
          gap: isMobile ? 28 : 24,
          alignItems: "start",
          textAlign: isMobile ? "center" : "left",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: isMobile ? "center" : "flex-start", gap: 8 }}>
          <BrandLogo height={52} onDark />
          <p style={{ margin: 0, color: MUTED, fontSize: 13, lineHeight: 1.5, fontFamily: FONT, maxWidth: 260 }}>
            {t("footer.tagline")}
          </p>
          <a
            href="https://www.instagram.com/myswym.app/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, textDecoration: "none", fontFamily: FONT, minHeight: 36, display: "inline-flex", alignItems: "center" }}
          >
            Instagram
          </a>
        </div>

        <Col title={t("footer.product")} links={productLinks} center={isMobile} />
        <Col title={t("footer.help")} links={helpLinks} center={isMobile} />
        <Col title={t("footer.account")} links={accountLinks} center={isMobile} />
        <Col title={t("footer.legal")} links={legalLinks} center={isMobile} />
      </div>

      <div style={{
        maxWidth: 1080, margin: "24px auto 0", paddingTop: 20,
        borderTop: "1px solid rgba(255,255,255,0.08)",
        display: "flex", flexDirection: isMobile ? "column" : "row",
        alignItems: "center", justifyContent: isMobile ? "center" : "space-between",
        gap: 12,
      }}>
        <LanguageSwitcher variant="footer" />
        <button
          type="button"
          onClick={() => resetCookieConsent()}
          style={{
            background: "none", border: "none", padding: 0, cursor: "pointer",
            color: MUTED, fontSize: 13, fontFamily: FONT, textDecoration: "underline", minHeight: 36,
          }}
        >
          {t("footer.manageCookies")}
        </button>
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, fontFamily: FONT }}>
          {t("footer.rights", { year })}
        </div>
      </div>
    </footer>
  );
}
