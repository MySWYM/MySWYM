import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { stripLocalePrefix } from "../i18n/locale-path.js";
import { useAuthSession, usePublicCta } from "../lib/use-auth-session.js";

/** CTA mobile collé en bas — option B (en plus du bouton header). */
export default function StickyCta({ href }) {
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

  useEffect(() => {
    const apply = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  if (!mobile || !showStartCta) return null;

  return (
    <>
      <div className="ms-sticky-cta-spacer" aria-hidden />
      <div className="ms-sticky-cta">
        <Link to={dest} className="ms-sticky-cta-btn">
          {t(href ? "nav.cta" : cta.labelKey)}
        </Link>
      </div>
    </>
  );
}
