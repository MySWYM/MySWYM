import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./i18n/LanguageSwitcher.jsx";
import { LocalizedLink } from "./i18n/locale-routing.jsx";
import { stripLocalePrefix } from "./i18n/locale-path.js";
import { useAuthSession } from "./lib/use-auth-session.js";
import { useStoreAwareCta } from "./lib/use-store-cta.js";
import { supabase } from "./supabase.js";
import { reset as resetAnalytics } from "./lib/analytics.js";
import { Dialog, DialogContent, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger } from "./ui/lp-dialog.jsx";
import BrandLogo from "./BrandLogo.jsx";
import { isNativeApp } from "./lib/native-platform.js";
import "./theme/public.css";

function NavCtaLink({ cta, className, onClick, children }) {
  if (cta.primary.external) {
    return (
      <a
        href={cta.primary.href}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
      >
        {children}
      </a>
    );
  }
  return (
    <Link to={cta.primary.href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

export default function PublicNav() {
  const { t } = useTranslation("common");
  const { pathname } = useLocation();
  const pathBare = stripLocalePrefix(pathname);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  const { isLoggedIn } = useAuthSession();
  const cta = useStoreAwareCta();
  const onQuiz = pathBare === "/app" || pathBare.startsWith("/app/");
  const onAuth = pathBare === "/connexion" || pathBare === "/inscription";
  const showStartCta = isLoggedIn || (!onQuiz && !onAuth);
  const showLogin = !isLoggedIn && !onAuth;
  const showLogout = isLoggedIn && !onAuth;

  const handleLogout = async () => {
    setMenuOpen(false);
    resetAnalytics();
    await supabase.auth.signOut();
  };

  const links = [
    [t("nav.how"), "/comment-ca-marche"],
    [t("nav.pricing"), "/tarifs"],
    [t("nav.blog"), "/blog"],
    [t("nav.contact"), "/contact"],
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMenuOpen(false);
    };
    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  if (isNativeApp()) return null;

  return (
    <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
      <nav className={`ms-header${scrolled || menuOpen ? " is-solid" : ""}`}>
        <div className="ms-header-inner">
          <LocalizedLink to="/" className="ms-brand" aria-label={t("nav.homeAria")}>
            <BrandLogo variant="wordmark" height={26} alt="MySWYM" />
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
            {!isMobile && showLogout && (
              <button type="button" className="ms-link-quiet" onClick={handleLogout}>
                {t("nav.logout")}
              </button>
            )}
            {!isMobile && showStartCta && (
              <NavCtaLink cta={cta} className="ms-btn">
                {t(cta.primary.labelKey)}
              </NavCtaLink>
            )}
            {!isMobile && showStartCta && cta.storePrimary && cta.browser ? (
              <Link to={cta.browser.href} className="ms-link-quiet">
                {t(cta.browser.labelKey)}
              </Link>
            ) : null}
            {isMobile && (
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="ms-icon-btn"
                  aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
                >
                  {menuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
              </DialogTrigger>
            )}
          </div>
        </div>
      </nav>

      {isMobile ? (
        <DialogPortal>
          <DialogOverlay className="ms-drawer-backdrop" />
          <DialogContent className="ms-drawer" aria-describedby={undefined}>
            <DialogTitle className="ms-sr-only">{t("nav.openMenu")}</DialogTitle>
            {links.map(([label, href]) => (
              <LocalizedLink key={label} to={href} className="ms-drawer-link" onClick={() => setMenuOpen(false)}>
                {label}
                <ChevronRight size={16} color="#6b7c8f" />
              </LocalizedLink>
            ))}
            <div className="ms-drawer-actions">
              {showStartCta && (
                <NavCtaLink
                  cta={cta}
                  className="ms-drawer-cta"
                  onClick={() => setMenuOpen(false)}
                >
                  {t(cta.primary.labelKey)}
                </NavCtaLink>
              )}
              {showStartCta && cta.storePrimary && cta.browser ? (
                <Link
                  to={cta.browser.href}
                  className="ms-drawer-ghost"
                  onClick={() => setMenuOpen(false)}
                >
                  {t(cta.browser.labelKey)}
                </Link>
              ) : null}
              {showLogin && (
                <Link to="/connexion" className="ms-drawer-ghost" onClick={() => setMenuOpen(false)}>
                  {t("nav.login")}
                </Link>
              )}
              {showLogout && (
                <button type="button" className="ms-drawer-ghost" onClick={handleLogout}>
                  {t("nav.logout")}
                </button>
              )}
            </div>
          </DialogContent>
        </DialogPortal>
      ) : null}
    </Dialog>
  );
}
