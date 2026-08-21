import { useEffect } from "react";
import { Link } from "react-router-dom";
import { LocalizedLink } from "./i18n/locale-routing.jsx";
import { useTranslation } from "react-i18next";
import { ArrowRight, Target, Calendar, Gauge, Clock, UserPlus, Waves, SlidersHorizontal } from "lucide-react";
import PublicNav from "./PublicNav.jsx";
import Footer from "./Footer.jsx";
import Breadcrumb from "./marketing/Breadcrumb.jsx";
import StickyCta from "./marketing/StickyCta.jsx";
import { usePageSeo, breadcrumbJsonLd } from "./lib/seo.js";
import { usePublicCta } from "./lib/use-auth-session.js";
import { BRAND, FONT, FONT_DISPLAY } from "./theme/brand.js";
import "./theme/public.css";

const C = { ...BRAND };

const STEP_ICONS = [Target, Calendar, Gauge, Clock];
const NEXT_ICONS = [UserPlus, Waves, SlidersHorizontal];

export default function HowItWorksPage() {
  const { t } = useTranslation("landing");
  const { t: tc } = useTranslation("common");
  const cta = usePublicCta();
  const crumbs = [
    { label: tc("footer.home"), href: "/" },
    { label: tc("nav.how") },
  ];

  usePageSeo({
    title: t("meta.howTitle"),
    description: t("meta.howDescription"),
    path: "/comment-ca-marche",
    jsonLd: breadcrumbJsonLd(crumbs.map((c, i) => (i < crumbs.length - 1 ? c : { label: c.label }))),
  });

  useEffect(() => {
    document.body.style.background = C.bg;
    window.scrollTo(0, 0);
  }, []);

  const steps = [1, 2, 3, 4].map((n) => ({
    n,
    Icon: STEP_ICONS[n - 1],
    title: t(`how.s${n}Title`),
    desc: t(`how.s${n}Desc`),
  }));
  const next = [1, 2, 3].map((n) => ({
    Icon: NEXT_ICONS[n - 1],
    title: t(`howPage.n${n}Title`),
    desc: t(`howPage.n${n}Desc`),
  }));

  return (
    <div className="ms-root" style={{ minHeight: "100vh", background: C.bg, fontFamily: FONT, color: C.ink }}>
      <PublicNav />
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "96px 20px 64px" }}>
        <Breadcrumb items={crumbs} onDark />
        <p style={{ color: C.primary, fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", margin: "0 0 12px" }}>
          {t("how.label")}
        </p>
        <h1 style={{
          fontFamily: FONT_DISPLAY, fontSize: "clamp(34px,5vw,52px)", fontWeight: 800,
          color: C.ink, margin: "0 0 12px", lineHeight: 1.05, letterSpacing: "-0.03em",
        }}>
          {t("how.title")}
        </h1>
        <p style={{ color: C.inkLight, fontSize: 17, lineHeight: 1.65, margin: "0 0 36px", maxWidth: 560 }}>
          {t("how.subtitle")}
        </p>

        <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 14 }}>
          {steps.map((s) => (
            <li key={s.n} style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 18,
              padding: "20px 22px", display: "flex", gap: 16, alignItems: "flex-start",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                background: C.primaryFix, color: C.primary,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <s.Icon size={20} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", color: C.primary, marginBottom: 4 }}>
                  {String(s.n).padStart(2, "0")}
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: C.ink, margin: "0 0 6px" }}>{s.title}</h2>
                <p style={{ margin: 0, color: C.inkLight, fontSize: 15, lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        <section style={{ marginTop: 48 }}>
          <p style={{ color: C.primary, fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", margin: "0 0 12px" }}>
            {t("howPage.nextLabel")}
          </p>
          <h2 style={{
            fontFamily: FONT_DISPLAY, fontSize: "clamp(26px,4vw,36px)", fontWeight: 800,
            color: C.ink, margin: "0 0 20px", letterSpacing: "-0.03em",
          }}>
            {t("howPage.nextTitle")}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {next.map((s) => (
              <div key={s.title} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: C.bgSoft,
                  display: "flex", alignItems: "center", justifyContent: "center", color: C.primary,
                }}>
                  <s.Icon size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: C.ink, margin: "0 0 4px" }}>{s.title}</h3>
                  <p style={{ margin: 0, color: C.inkLight, fontSize: 14, lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div style={{ marginTop: 40, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <Link to={cta.href} style={{
            display: "inline-flex", alignItems: "center", gap: 8, minHeight: 48,
            padding: "0 22px", borderRadius: 14, background: C.primary, color: C.accentText,
            fontWeight: 700, textDecoration: "none",
          }}>
            {t("howPage.cta")} <ArrowRight size={16} />
          </Link>
          <LocalizedLink to="/tarifs" style={{ color: C.primaryDeep, fontWeight: 700, textDecoration: "none", minHeight: 44, display: "inline-flex", alignItems: "center" }}>
            {t("howPage.toPricing")}
          </LocalizedLink>
        </div>
      </main>
      <Footer />
      <StickyCta />
    </div>
  );
}
