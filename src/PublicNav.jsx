import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./i18n/LanguageSwitcher.jsx";
import { LocalizedLink } from "./i18n/locale-routing.jsx";
import { stripLocalePrefix } from "./i18n/locale-path.js";
import { useAuthSession, usePublicCta } from "./lib/use-auth-session.js";
import "./theme/public.css";

export default function PublicNav() {
  const { t } = useTranslation("common");
  const { pathname } = useLocation();
  const pathBare = stripLocalePrefix(pathname);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  const { isLoggedIn } = useAuthSession();
  const cta = usePublicCta();
  const onQuiz = pathBare === "/app" || pathBare.startsWith("/app/");
  const onAuth = pathBare === "/connexion" || pathBare === "/inscription";
  const showStartCta = isLoggedIn || (!onQuiz && !onAuth);
  const showLogin = !isLoggedIn && !onAuth;

  const links = [
    [t("nav.how"), "/comment-ca-marche"],
    [t("nav.blog"), "/blog"],
    [t("nav.contact"), "/contact"],
  ];

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
      <nav className={`ms-header${scrolled || menuOpen ? " is-solid" : ""}`}>
        <div className="ms-header-inner">
          <LocalizedLink to="/" className="ms-brand" aria-label={t("nav.homeAria")}>
            <img
              src="/logo-myswym-banner-blanc.png"
              alt="mySWYM"
              height={26}
              width={178}
            />
          </LocalizedLink>

          {!isMobile && (
            <div className="ms-nav">
              {links.map(([label, href]) => {
                const pathOnly = typeof href === "string" ? href : href.pathname;
                const isHere = pathOnly !== "/" && pathBare === pathOnly;
                return (
                  <LocalizedLink key={label} to={href} aria-current={isHere ? "page" : undefined}>
                    {label}
                  </LocalizedLink>
                );
              })}
            </div>
          )}

          <div className="ms-header-actions">
            <LanguageSwitcher variant="nav" />
            {!isMobile && showLogin && (
              <Link to="/connexion" className="ms-link-quiet">
                {t("nav.login")}
              </Link>
            )}
            {!isMobile && showStartCta && (
              <Link to={cta.href} className="ms-btn">
                {t(cta.labelKey)}
              </Link>
            )}
            {isMobile && (
              <button
                type="button"
                className="ms-icon-btn"
                onClick={() => setMenuOpen((o) => !o)}
                aria-expanded={menuOpen}
                aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            )}
          </div>
        </div>
      </nav>

      {isMobile && (
        <div style={{ position: "fixed", top: "calc(3.5rem + env(safe-area-inset-top, 0px))", left: 0, right: 0, bottom: 0, zIndex: 199, pointerEvents: menuOpen ? "all" : "none" }}>
          <div
            className="ms-drawer-backdrop"
            onClick={() => setMenuOpen(false)}
            style={{ opacity: menuOpen ? 1 : 0, transition: "opacity 0.25s" }}
          />
          <div
            className="ms-drawer"
            style={{
              transform: menuOpen ? "translateY(0)" : "translateY(-100%)",
              visibility: menuOpen ? "visible" : "hidden",
              transition: menuOpen ? "transform 0.28s cubic-bezier(0.4,0,0.2,1), visibility 0s 0s" : "transform 0.28s cubic-bezier(0.4,0,0.2,1), visibility 0s 0.28s",
            }}
          >
            {links.map(([label, href]) => (
              <LocalizedLink key={label} to={href} className="ms-drawer-link" onClick={() => setMenuOpen(false)}>
                {label}
                <ChevronRight size={16} color="#9bb0c8" />
              </LocalizedLink>
            ))}
            <div style={{ padding: "20px 24px 0", display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
              {showStartCta && (
                <Link to={cta.href} className="ms-drawer-cta" onClick={() => setMenuOpen(false)}>
                  {t(cta.labelKey)}
                </Link>
              )}
              {showLogin && (
                <Link to="/connexion" className="ms-drawer-ghost" onClick={() => setMenuOpen(false)}>
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
