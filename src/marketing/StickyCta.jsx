import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { stripLocalePrefix } from "../i18n/locale-path.js";
import { useAuthSession, usePublicCta } from "../lib/use-auth-session.js";

/** CTA mobile flottant, plan web (pas de store). */
export default function StickyCta({ href, revealOnScroll = false }) {
  const { t } = useTranslation("common");
  const { pathname } = useLocation();
  const pathBare = stripLocalePrefix(pathname);
  const { isLoggedIn } = useAuthSession();
  const cta = usePublicCta();
  const dest = href || cta.href;
  const onQuiz = pathBare === "/app" || pathBare.startsWith("/app/");
  const onAuth = pathBare === "/connexion" || pathBare === "/inscription";
  const showStartCta = isLoggedIn || (!onQuiz && !onAuth);
  const [mobile, setMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768,
  );
  const [revealed, setRevealed] = useState(!revealOnScroll);

  useEffect(() => {
    const apply = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  useEffect(() => {
    if (!revealOnScroll || !mobile) {
      setRevealed(!revealOnScroll || !mobile);
      return undefined;
    }
    const onScroll = () => setRevealed(window.scrollY > 200);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [revealOnScroll, mobile]);

  if (!mobile || !showStartCta || !revealed) return null;

  const copy = isLoggedIn
    ? { kicker: t("stickyBar.kickerApp"), title: t("stickyBar.titleApp"), cta: t("stickyBar.ctaApp") }
    : { kicker: t("stickyBar.kicker"), title: t("stickyBar.title"), cta: t("stickyBar.cta") };

  return (
    <>
      <div className="ms-sticky-cta-spacer" aria-hidden />
      <Link to={dest} className="ms-sticky-cta">
        <span className="ms-sticky-cta-copy">
          <span className="ms-sticky-cta-kicker">{copy.kicker}</span>
          <span className="ms-sticky-cta-title">{copy.title}</span>
        </span>
        <span className="ms-sticky-cta-btn">{href ? t("nav.cta") : copy.cta}</span>
      </Link>
    </>
  );
}
