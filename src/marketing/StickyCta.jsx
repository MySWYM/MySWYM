import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BRAND, FONT } from "../theme/brand.js";
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
      <div aria-hidden style={{ height: 76 }} />
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 180,
          padding: "12px max(1.5rem, env(safe-area-inset-right)) max(14px, env(safe-area-inset-bottom)) max(1.5rem, env(safe-area-inset-left))",
          background: "rgba(0, 5, 20, 0.92)",
          backdropFilter: "blur(12px)",
          borderTop: `1px solid ${BRAND.border}`,
          boxShadow: "0 -8px 28px rgba(0,0,0,0.35)",
        }}
      >
        <Link
          to={dest}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 48,
            borderRadius: 14,
            background: BRAND.primary,
            color: BRAND.accentText,
            fontWeight: 700,
            fontSize: 15,
            fontFamily: FONT,
            textDecoration: "none",
          }}
        >
          {t(href ? "nav.cta" : cta.labelKey)}
        </Link>
      </div>
    </>
  );
}
