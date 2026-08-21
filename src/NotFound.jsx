import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PublicNav from "./PublicNav.jsx";
import Footer from "./Footer.jsx";
import { LocalizedLink } from "./i18n/locale-routing.jsx";
import { usePageSeo } from "./lib/seo.js";

const FONT = "'Lexend', sans-serif";
const FONT_DISPLAY = "'Barlow Condensed', sans-serif";

export default function NotFoundPage() {
  const { pathname } = useLocation();
  const { t } = useTranslation("common");
  usePageSeo({
    title: t("pages.notFoundMetaTitle"),
    description: t("pages.notFoundMetaDesc"),
    path: pathname || "/",
    noIndex: true,
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fc", fontFamily: FONT, color: "#191c1e" }}>
      <PublicNav />
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "120px 20px 64px", textAlign: "center" }}>
        <p style={{ color: "#355da3", fontWeight: 800, letterSpacing: "0.08em", margin: "0 0 12px" }}>404</p>
        <h1 style={{
          fontFamily: FONT_DISPLAY, fontSize: "clamp(36px,5vw,52px)", fontWeight: 800,
          textTransform: "uppercase", margin: "0 0 16px",
        }}>
          {t("pages.notFoundTitle")}
        </h1>
        <p style={{ fontSize: 17, lineHeight: 1.65, color: "#5d5e61", margin: "0 0 28px" }}>
          {t("pages.notFoundBody")}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
          <LocalizedLink to="/" style={{
            display: "inline-flex", minHeight: 48, alignItems: "center", padding: "0 22px",
            borderRadius: 14, background: "#8eb3ff", color: "#154388", fontWeight: 700, textDecoration: "none",
          }}>
            {t("footer.home")}
          </LocalizedLink>
          <Link to="/app" style={{
            display: "inline-flex", minHeight: 48, alignItems: "center", padding: "0 22px",
            borderRadius: 14, border: "1.5px solid #c3c6d2", color: "#191c1e", fontWeight: 700, textDecoration: "none",
          }}>
            {t("pages.startTrial")}
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
