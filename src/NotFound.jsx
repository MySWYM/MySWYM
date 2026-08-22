import { ArrowRight } from "lucide-react";
import { LocalizedLink } from "./i18n/locale-routing.jsx";
import PublicNav from "./PublicNav.jsx";
import Footer from "./Footer.jsx";
import { usePageSeo } from "./lib/seo.js";
import { useTranslation } from "react-i18next";
import { usePublicCta } from "./lib/use-auth-session.js";
import "./theme/public.css";

export default function NotFoundPage() {
  const { t } = useTranslation("common");
  const cta = usePublicCta();
  usePageSeo({
    title: t("pages.notFoundMetaTitle"),
    description: t("pages.notFoundMetaDesc"),
    path: "/404",
    noIndex: true,
  });

  return (
    <div className="ms-root">
      <PublicNav />
      <main className="ms-404">
        <div className="ms-404-card">
          <img
            className="ms-404-otter"
            src="/loutre-404.webp"
            alt={t("pages.notFoundAlt")}
            width={1312}
            height={1199}
          />
          <p className="ms-pricing-kicker">404</p>
          <h1 className="ms-404-h1">{t("pages.notFoundTitle")}</h1>
          <p className="ms-404-lead">{t("pages.notFoundBody")}</p>
          <div className="ms-pricing-cta-row ms-404-cta">
            <LocalizedLink to="/" className="ms-btn">
              {t("pages.notFoundHome")}
            </LocalizedLink>
            <LocalizedLink to={cta.href} className="ms-btn ms-btn-ghost">
              {t("pages.notFoundCta")} <ArrowRight size={15} aria-hidden />
            </LocalizedLink>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
