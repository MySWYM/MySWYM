import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import BrandLogo from "./BrandLogo.jsx";
import LanguageSwitcher from "./i18n/LanguageSwitcher.jsx";
import { LocalizedLink } from "./i18n/locale-routing.jsx";
import { stripLocalePrefix } from "./i18n/locale-path.js";
import { useAuthSession, usePublicCta } from "./lib/use-auth-session.js";

const C = {
  ink: "#191c1e",
  white: "#ffffff",
  secondary: "#5d5e61",
  border: "rgba(53,93,163,0.08)",
  accent: "#8eb3ff",
  accentText: "#154388",
};

const FONT = "'Lexend', sans-serif";

const navLinkStyle = (active) => ({
  color: active ? C.ink : C.secondary,
  fontSize: 14,
  fontWeight: active ? 700 : 500,
  textDecoration: "none",
  fontFamily: FONT,
  display: "inline-flex",
  alignItems: "center",
  minHeight: 44,
});

export default function PublicNav() {
  const { t } = useTranslation("common");
  const { pathname } = useLocation();
  const pathBare = stripLocalePrefix(pathname);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);

  const links = [
    [t("nav.how"), "/comment-ca-marche"],
    [t("nav.pricing"), "/tarifs"],
    [t("nav.blog"), "/blog"],
  ];
  const { isLoggedIn } = useAuthSession();
  const cta = usePublicCta();
  const onQuiz = pathBare === "/app" || pathBare.startsWith("/app/");
  const onAuth = pathBare === "/connexion" || pathBare === "/inscription";
  const showStartCta = isLoggedIn || (!onQuiz && !onAuth);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = (isMobile && menuOpen) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobile, menuOpen]);

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        background: (scrolled || menuOpen) ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0)",
        backdropFilter: (scrolled || menuOpen) ? "blur(16px)" : "none",
        borderBottom: (scrolled || menuOpen) ? `1px solid ${C.border}` : "none",
        boxShadow: scrolled ? "0 1px 20px rgba(142,179,255,0.12)" : "none",
        transition: "background 0.3s, box-shadow 0.3s",
      }}>
        <div style={{
          maxWidth: 1120, margin: "0 auto",
          padding: "0 20px", height: 64,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <LocalizedLink to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", flexShrink: 0, minHeight: 44 }} aria-label={t("nav.homeAria")}>
            <BrandLogo variant="wordmark" height={22} />
          </LocalizedLink>

          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {links.map(([label, href]) => {
                const isHere = pathBare === href || (href !== "/" && pathBare.startsWith(`${href}/`));
                return (
                  <LocalizedLink key={href} to={href} aria-current={isHere ? "page" : undefined} style={navLinkStyle(isHere)}>
                    {label}
                  </LocalizedLink>
                );
              })}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, minWidth: 0 }}>
            {!isMobile && <LanguageSwitcher variant="nav" />}
            {!isMobile && !isLoggedIn && !onAuth && (
              <Link to="/connexion" style={{ ...navLinkStyle(pathname === "/connexion"), padding: "0 8px" }}>
                {t("nav.login")}
              </Link>
            )}
            {showStartCta && (
            <Link to={cta.href} style={{
              background: C.accent, color: C.accentText, fontSize: isMobile ? 13 : 14, fontWeight: 700,
              padding: isMobile ? "0 16px" : "0 22px", borderRadius: 100, textDecoration: "none",
              fontFamily: FONT, boxShadow: "0 4px 16px rgba(142,179,255,0.35)",
              whiteSpace: "nowrap", lineHeight: 1.2, flexShrink: 0,
              display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 44,
            }}>
              {isMobile ? t(cta.shortKey) : t(cta.labelKey)}
            </Link>
            )}
            {isMobile && (
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
                aria-expanded={menuOpen}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 44, height: 44, padding: 0, marginLeft: 4, color: C.ink, flexShrink: 0,
                }}
              >
                {menuOpen ? <X size={22} color={C.ink} /> : <Menu size={22} color={C.ink} />}
              </button>
            )}
          </div>
        </div>
      </nav>

      {isMobile && (
        <div style={{ position: "fixed", top: 64, left: 0, right: 0, bottom: 0, zIndex: 199, pointerEvents: menuOpen ? "all" : "none" }}>
          <div onClick={() => setMenuOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(25,28,30,0.28)", opacity: menuOpen ? 1 : 0, transition: "opacity 0.25s" }} />
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, background: C.white, borderBottom: `1px solid ${C.border}`,
            boxShadow: menuOpen ? "0 8px 32px rgba(142,179,255,0.18)" : "none", padding: "8px 0 24px",
            transform: menuOpen ? "translateY(0)" : "translateY(-100%)", visibility: menuOpen ? "visible" : "hidden",
            transition: menuOpen ? "transform 0.28s cubic-bezier(0.4,0,0.2,1), visibility 0s 0s" : "transform 0.28s cubic-bezier(0.4,0,0.2,1), visibility 0s 0.28s",
          }}>
            {links.map(([label, href]) => (
              <LocalizedLink
                key={href}
                to={href}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0 24px", minHeight: 48, color: C.ink, fontSize: 16, fontWeight: 600,
                  textDecoration: "none", borderBottom: `1px solid ${C.border}`, fontFamily: FONT,
                }}
              >
                {label}
                <ChevronRight size={16} color="#737782" />
              </LocalizedLink>
            ))}
            <div style={{ padding: "20px 24px 0", display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
              <LanguageSwitcher variant="nav" />
              {showStartCta && (
              <Link to={cta.href} onClick={() => setMenuOpen(false)} style={{
                display: "flex", alignItems: "center", justifyContent: "center", width: "100%", minHeight: 48,
                padding: "0 13px", borderRadius: 16, color: C.accentText, fontSize: 15, fontWeight: 700,
                textDecoration: "none", background: C.accent, fontFamily: FONT, boxSizing: "border-box",
                boxShadow: "0 4px 16px rgba(142,179,255,0.35)",
              }}>
                {t(cta.labelKey)}
              </Link>
              )}
              {!isLoggedIn && !onAuth && (
                <Link to="/connexion" onClick={() => setMenuOpen(false)} style={{
                  display: "flex", alignItems: "center", justifyContent: "center", width: "100%", minHeight: 48,
                  padding: "0 13px", borderRadius: 16, border: "1.5px solid #c3c6d2", color: C.ink, fontSize: 15,
                  fontWeight: 600, textDecoration: "none", background: "#f2f3f6", fontFamily: FONT, boxSizing: "border-box",
                }}>
                  {t("nav.login")}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
