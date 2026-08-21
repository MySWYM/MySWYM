import { Link } from "react-router-dom";
import { LocalizedLink } from "./i18n/locale-routing.jsx";
import PublicNav from "./PublicNav.jsx";
import Footer from "./Footer.jsx";
import Breadcrumb from "./marketing/Breadcrumb.jsx";
import { usePageSeo } from "./lib/seo.js";
import { useTranslation } from "react-i18next";
import { BRAND, FONT, FONT_DISPLAY } from "./theme/brand.js";
import "./theme/public.css";

export default function MerciPage() {
  const { t } = useTranslation("common");
  usePageSeo({
    title: t("pages.thanksMetaTitle"),
    description: t("pages.thanksMetaDesc"),
    path: "/merci",
    noIndex: true,
  });

  return (
    <div className="ms-root" style={{ minHeight: "100vh", background: BRAND.bg, fontFamily: FONT, color: BRAND.ink }}>
      <PublicNav />
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "120px 20px 64px", textAlign: "center" }}>
        <div style={{ textAlign: "left" }}>
          <Breadcrumb items={[{ label: t("footer.home"), href: "/" }, { label: t("pages.thanksTitle") }]} onDark />
        </div>
        <h1 style={{
          fontFamily: FONT_DISPLAY, fontSize: "clamp(36px,5vw,52px)", fontWeight: 800,
          textTransform: "none", margin: "0 0 16px", letterSpacing: "-0.03em",
        }}>
          {t("pages.thanksTitle")}
        </h1>
        <p style={{ fontSize: 17, lineHeight: 1.65, color: BRAND.inkLight, margin: "0 0 28px" }}>
          {t("pages.thanksBody")}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
          <LocalizedLink to="/" style={{
            display: "inline-flex", minHeight: 48, alignItems: "center", padding: "0 22px",
            borderRadius: 14, background: BRAND.primary, color: BRAND.accentText, fontWeight: 700, textDecoration: "none",
          }}>
            {t("pages.thanksHome")}
          </LocalizedLink>
          <Link to="/app" style={{
            display: "inline-flex", minHeight: 48, alignItems: "center", padding: "0 22px",
            borderRadius: 14, border: `1.5px solid ${BRAND.outlineVar}`, color: BRAND.ink, fontWeight: 700, textDecoration: "none",
          }}>
            {t("pages.startTrial")}
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
