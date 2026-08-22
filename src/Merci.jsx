import { ArrowRight } from "lucide-react";
import { LocalizedLink } from "./i18n/locale-routing.jsx";
import PublicNav from "./PublicNav.jsx";
import Footer from "./Footer.jsx";
import { usePageSeo } from "./lib/seo.js";
import { useTranslation } from "react-i18next";
import { usePublicCta } from "./lib/use-auth-session.js";
import "./theme/public.css";

export default function MerciPage() {
  const { t } = useTranslation("common");
  const cta = usePublicCta();
  usePageSeo({
    title: t("pages.thanksMetaTitle"),
    description: t("pages.thanksMetaDesc"),
    path: "/merci",
    noIndex: true,
  });

  return (
    <div className="ms-root">
      <PublicNav />
      <main className="ms-404">
        <div className="ms-404-card ms-merci-card">
          <img
            className="ms-404-otter ms-merci-otter"
            src="/loutre-merci.webp"
            alt={t("pages.thanksAlt")}
            width={1774}
            height={887}
          />
          <p className="ms-pricing-kicker">{t("pages.thanksKicker")}</p>
          <h1 className="ms-404-h1">{t("pages.thanksTitle")}</h1>
          <p className="ms-404-lead">{t("pages.thanksBody")}</p>
          <div className="ms-pricing-cta-row ms-404-cta">
            <LocalizedLink to="/" className="ms-btn">
              {t("pages.thanksHome")}
            </LocalizedLink>
            <LocalizedLink to={cta.href} className="ms-btn ms-btn-ghost">
              {t("pages.thanksCta")} <ArrowRight size={15} aria-hidden />
            </LocalizedLink>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
