import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Menu, X, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./i18n/LanguageSwitcher.jsx";
import "./theme/public.css";

export default function PublicNav() {
  const { t } = useTranslation("common");
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);

  const links = [
    [t("nav.why"), "/accueil#pourquoi"],
    [t("nav.how"), "/comment-ca-marche"],
    [t("nav.pricing"), "/tarifs"],
    [t("nav.faq"), "/accueil#faq"],
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
          <a href="/accueil" className="ms-brand" aria-label={t("nav.homeAria")}>
            <img
              src="/logo-myswym-banner-blanc.png"
              alt="mySWYM"
              height={26}
              width={178}
            />
          </a>

          {!isMobile && (
            <div className="ms-nav">
              {links.map(([label, href]) => {
                const pathOnly = href.split("#")[0];
                const isHere = pathOnly !== "/accueil" && pathOnly === pathname;
                return (
                  <a key={href} href={href} aria-current={isHere ? "page" : undefined}>
                    {label}
                  </a>
                );
              })}
            </div>
          )}

          <div className="ms-header-actions">
            {!isMobile && <LanguageSwitcher variant="nav" onDark />}
            {!isMobile && (
              <a href="/connexion" className="ms-link-quiet">
                {t("nav.login")}
              </a>
            )}
            {!isMobile && (
              <a href="/inscription" className="ms-btn">
                {t("nav.cta")}
              </a>
            )}
            {isMobile && (
              <button
                type="button"
                className="ms-icon-btn"
                onClick={() => setMenuOpen((o) => !o)}
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
              <a key={href} href={href} className="ms-drawer-link" onClick={() => setMenuOpen(false)}>
                {label}
                <ChevronRight size={16} color="#9bb0c8" />
              </a>
            ))}
            <div style={{ padding: "20px 24px 0", display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
              <LanguageSwitcher variant="nav" onDark />
              <a href="/inscription" className="ms-drawer-cta" onClick={() => setMenuOpen(false)}>
                {t("nav.cta")}
              </a>
              <a href="/connexion" className="ms-drawer-ghost" onClick={() => setMenuOpen(false)}>
                {t("nav.login")}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
