import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { stripLocalePrefix } from "../i18n/locale-path.js";
import { useAuthSession } from "../lib/use-auth-session.js";
import { useStoreAwareCta } from "../lib/use-store-cta.js";
import { isNativeApp } from "../lib/native-platform.js";
import "./store-badges.css";

/** CTA mobile flottant. iOS Safari : App Store ; sinon webapp. */
export default function StickyCta({ href, revealOnScroll = false }) {
  const { t } = useTranslation("common");
  const { pathname } = useLocation();
  const pathBare = stripLocalePrefix(pathname);
  const { isLoggedIn } = useAuthSession();
  const storeCta = useStoreAwareCta();
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

  if (isNativeApp()) return null;
  if (!mobile || !showStartCta || !revealed) return null;

  const forcedWeb = Boolean(href);
  const useStore = !forcedWeb && storeCta.storePrimary;
  const dest = href || storeCta.primary.href;
  const btnLabel = forcedWeb
    ? t("nav.cta")
    : useStore
      ? t(storeCta.primary.labelKey)
      : isLoggedIn
        ? t("stickyBar.ctaApp")
        : t("stickyBar.cta");

  const copy = useStore
    ? {
        kicker: t("store.stickyKicker"),
        title: isLoggedIn ? t("store.stickyTitleApp") : t("store.stickyTitle"),
      }
    : isLoggedIn
      ? { kicker: t("stickyBar.kickerApp"), title: t("stickyBar.titleApp") }
      : { kicker: t("stickyBar.kicker"), title: t("stickyBar.title") };

  const primaryEl = useStore ? (
    <a
      href={dest}
      className="ms-sticky-cta"
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("store.appStoreAria")}
    >
      <span className="ms-sticky-cta-copy">
        <span className="ms-sticky-cta-kicker">{copy.kicker}</span>
        <span className="ms-sticky-cta-title">{copy.title}</span>
      </span>
      <span className="ms-sticky-cta-btn">{btnLabel}</span>
    </a>
  ) : (
    <Link to={dest} className="ms-sticky-cta">
      <span className="ms-sticky-cta-copy">
        <span className="ms-sticky-cta-kicker">{copy.kicker}</span>
        <span className="ms-sticky-cta-title">{copy.title}</span>
      </span>
      <span className="ms-sticky-cta-btn">{btnLabel}</span>
    </Link>
  );

  return (
    <>
      <div className="ms-sticky-cta-spacer" aria-hidden />
      {primaryEl}
      {useStore && storeCta.browser ? (
        <p className="ms-sticky-cta-browser">
          <Link to={storeCta.browser.href}>{t(storeCta.browser.labelKey)}</Link>
        </p>
      ) : null}
    </>
  );
}
