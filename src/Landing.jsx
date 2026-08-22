import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LocalizedLink } from "./i18n/locale-routing.jsx";
import { usePublicCta } from "./lib/use-auth-session.js";
import {
  ArrowRight,
  Target,
  Sparkles,
  Waves,
  CalendarRange,
  SlidersHorizontal,
  Repeat,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Clock,
  ShieldCheck,
  Cpu,
} from "lucide-react";
import { track } from "./lib/analytics.js";
import Footer from "./Footer.jsx";
import PublicNav from "./PublicNav.jsx";
import LandingReviews from "./marketing/LandingReviews.jsx";
import StickyCta from "./marketing/StickyCta.jsx";
import { usePublishedReviews } from "./marketing/usePublishedReviews.js";
import { usePageSeo, organizationJsonLd, softwareApplicationJsonLd } from "./lib/seo.js";
import { CASE_STUDIES } from "./content/case-studies.js";
import "./landing/landing.css";

const OBJECTIVE_TABS = [
  { id: "progression", labelKey: "tabProgression", tagKey: "tagLevel", cards: ["p1", "p2", "p3", "p4"], media: "/nagerprogresser-objectif-landing.png" },
  {
    id: "triathlon",
    labelKey: "tabTriathlon",
    tagKey: "tagEvent",
    cards: ["t1", "t2", "t3", "t4", "t5"],
    media: "/Triathlon-obectif-landingpage.png",
  },
  { id: "openwater", labelKey: "tabOpenwater", tagKey: "tagDistance", cards: ["w1", "w2", "w3", "w4", "w5", "w6"], media: "/Eaulibre-objectif-landing.png" },
  { id: "diploma", labelKey: "tabDiploma", tagKey: "tagDiploma", cards: ["d1", "d2", "d3"], media: "/Sauveteur-objectif-landing.png" },
];

const TRUST_ICONS = [Cpu, ShieldCheck, Waves];
const INCLUDE_ICONS = [Target, Gauge, CalendarRange, Clock, Repeat, Sparkles];

function Hero() {
  const { t } = useTranslation("landing");
  const cta = usePublicCta();
  return (
    <section className="lp-hero">
      <div className="lp-hero-bg" aria-hidden>
        <img src="/hero-pool.png" alt="" className="lp-hero-img" fetchPriority="high" />
      </div>
      <div className="lp-wrap lp-hero-inner">
        <div className="lp-hero-copy">
          <h1 className="lp-h1 lp-display">{t("hero.title")}</h1>
          <p className="lp-lead">{t("hero.subtitle")}</p>
          <div className="lp-cta-row">
            <Link to={cta.href} className="lp-btn lp-btn-lg">
              {t("hero.ctaSecondary")}
              <ArrowRight size={16} />
            </Link>
          </div>
          <dl className="lp-stats">
            {[
              [t("hero.proof1Value"), t("hero.proof1Label")],
              [t("hero.proof2Value"), t("hero.proof2Label")],
              [t("hero.proof3Value"), t("hero.proof3Label")],
            ].map(([n, l]) => (
              <div key={l}>
                <dt className="lp-display">{n}</dt>
                <dd>{l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function Objectives() {
  const { t } = useTranslation("landing");
  const cta = usePublicCta();
  const [tabId, setTabId] = useState("progression");
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const scrollerRef = useRef(null);
  const tab = OBJECTIVE_TABS.find((item) => item.id === tabId) || OBJECTIVE_TABS[0];

  const updateScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 12);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 12);
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return undefined;
    el.scrollTo({ left: 0 });
    const frame = requestAnimationFrame(updateScroll);
    el.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("resize", updateScroll);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", updateScroll);
      window.removeEventListener("resize", updateScroll);
    };
  }, [tabId]);

  const scrollByCard = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector(".lp-obj-card");
    const step = card ? card.getBoundingClientRect().width + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <section className="lp-section">
      <div className="lp-wrap">
        <div style={{ maxWidth: 42 * 16 }}>
          <h2 className="lp-h2 lp-display">{t("objectives.title")}</h2>
          <p className="lp-lead" style={{ marginTop: 12 }}>{t("objectives.subtitle")}</p>
        </div>
        <div className="lp-obj-tabs" role="tablist" aria-label={t("objectives.tabsAria")}>
          {OBJECTIVE_TABS.map((item) => {
            const selected = item.id === tab.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`lp-obj-tab-${item.id}`}
                aria-selected={selected}
                aria-controls="lp-obj-panel"
                className={`lp-obj-tab${selected ? " is-active" : ""}`}
                onClick={() => setTabId(item.id)}
              >
                {t(`objectives.${item.labelKey}`)}
              </button>
            );
          })}
        </div>
      </div>
      <div className={`lp-obj-stage${tab.media ? " has-media" : ""}`} data-obj={tab.id}>
        {tab.media ? (
          <div className="lp-obj-media" aria-hidden>
            <img src={tab.media} alt="" />
          </div>
        ) : null}
        <div className="lp-wrap lp-obj-stage-inner">
        <div className="lp-obj-scroller-wrap">
          <button
            type="button"
            className="lp-obj-nav lp-obj-nav-prev"
            aria-label={t("objectives.scrollPrev")}
            disabled={!canPrev}
            onClick={() => scrollByCard(-1)}
          >
            <ChevronLeft size={20} />
          </button>
          <div
            className="lp-obj-grid"
            role="tabpanel"
            id="lp-obj-panel"
            aria-labelledby={`lp-obj-tab-${tab.id}`}
            ref={scrollerRef}
          >
            {tab.cards.map((key) => (
              <Link key={key} to={cta.href} className="lp-obj-card">
                <p className="lp-card-kicker">{t(`objectives.${tab.tagKey}`)}</p>
                <h3 className="lp-obj-card-title">{t(`objectives.${key}Title`)}</h3>
                <p className="lp-obj-card-meta">{t(`objectives.${key}Meta`)}</p>
                <p className="lp-obj-card-desc">{t(`objectives.${key}Desc`)}</p>
                <span className="lp-btn lp-obj-card-cta">
                  {t("objectives.cta")}
                  <ArrowRight size={16} />
                </span>
              </Link>
            ))}
          </div>
          <button
            type="button"
            className="lp-obj-nav lp-obj-nav-next"
            aria-label={t("objectives.scrollNext")}
            disabled={!canNext}
            onClick={() => scrollByCard(1)}
          >
            <ChevronRight size={20} />
          </button>
        </div>
        </div>
      </div>
    </section>
  );
}

function WhyMyswym() {
  const { t } = useTranslation("landing");
  const blocks = [1, 2, 3, 4].map((n) => ({
    title: t(`why.b${n}Title`),
    stat: t(`why.b${n}Stat`),
    desc: t(`why.b${n}Desc`),
  }));
  return (
    <section id="pourquoi" className="lp-band">
      <div className="lp-wrap lp-section">
        <p className="lp-kicker">{t("why.label")}</p>
        <h2 className="lp-h2 lp-display">{t("why.title")}</h2>
        <p className="lp-lead" style={{ marginTop: 12 }}>{t("why.subtitle")}</p>
        <div className="lp-grid-2" style={{ marginTop: 28 }}>
          {blocks.map((b) => (
            <div key={b.title} className="lp-card">
              <h3 className="lp-feature-title" style={{ marginTop: 0 }}>{b.title}</h3>
              <p className="lp-card-kicker">{b.stat}</p>
              <p>{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SessionPreview() {
  const { t } = useTranslation("landing");
  const blocks = [
    { label: t("session.warmLabel"), content: t("session.warmContent") },
    { label: t("session.mainLabel"), content: t("session.mainContent") },
    { label: t("session.coolLabel"), content: t("session.coolContent") },
  ];
  return (
    <section id="seance" className="lp-band">
      <div className="lp-wrap lp-section">
        <p className="lp-kicker">{t("session.label")}</p>
        <h2 className="lp-h2 lp-display">{t("session.title")}</h2>
        <p className="lp-lead" style={{ marginTop: 12 }}>{t("session.subtitle")}</p>
        <div className="lp-session">
          <div className="lp-session-head">
            <span className="lp-card-kicker">{t("session.type")}</span>
            <h3>{t("session.heading")}</h3>
            <p>{t("session.meta")}</p>
          </div>
          {blocks.map((b) => (
            <div key={b.label} className="lp-session-block">
              <strong>{b.label}</strong>
              <p>{b.content}</p>
            </div>
          ))}
          <p className="lp-session-tip">{t("session.tip")}</p>
        </div>
      </div>
    </section>
  );
}

function CoachSection() {
  const { t } = useTranslation("landing");
  return (
    <section id="coach" className="lp-section lp-coach-section">
      <div className="lp-wrap lp-coach">
        <div className="lp-coach-copy">
          <p className="lp-kicker">{t("coach.label")}</p>
          <p className="lp-card-kicker lp-coach-eyebrow">{t("coach.eyebrow")}</p>
          <h2 className="lp-h2 lp-display lp-coach-title">
            {t("coach.titleLine1")}<br />{t("coach.titleLine2")}
          </h2>
          <p className="lp-lead lp-coach-body">{t("coach.body")}</p>
          <a
            href={t("coach.igHref")}
            className="lp-btn lp-coach-cta"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("coach.igCta")}
            <ArrowRight size={14} />
          </a>
        </div>
        <div className="lp-coach-media">
          <img
            src="/coach.JPG"
            alt="Arthur Noël, coach MySWYM"
            width={640}
            height={800}
            className="lp-coach-photo"
            loading="lazy"
          />
          <blockquote className="lp-quote">{t("coach.quote")}</blockquote>
        </div>
      </div>
    </section>
  );
}

function Includes() {
  const { t } = useTranslation("landing");
  const items = [1, 2, 3, 4, 5, 6].map((n) => ({
    icon: INCLUDE_ICONS[n - 1],
    title: t(`includes.i${n}Title`),
    desc: t(`includes.i${n}Desc`),
  }));
  return (
    <section className="lp-band">
      <div className="lp-wrap lp-section">
        <p className="lp-kicker">{t("includes.label")}</p>
        <h2 className="lp-h2 lp-display">{t("includes.title")}</h2>
        <p className="lp-lead" style={{ marginTop: 12 }}>{t("includes.subtitle")}</p>
        <div className="lp-grid-3">
          {items.map((item) => (
            <div key={item.title} className="lp-card">
              <item.icon size={24} color="var(--lp-primary)" strokeWidth={1.8} />
              <h3 className="lp-feature-title">{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const { t } = useTranslation("landing");
  const features = [
    { icon: Target, title: t("features.f1Title"), text: t("features.f1Desc") },
    { icon: SlidersHorizontal, title: t("features.f2Title"), text: t("features.f2Desc") },
    { icon: CalendarRange, title: t("features.f3Title"), text: t("features.f3Desc") },
    { icon: Waves, title: t("features.f4Title"), text: t("features.f4Desc") },
  ];
  return (
    <section className="lp-section">
      <div className="lp-wrap">
        <div className="lp-grid-2">
          {features.map((f) => (
            <div key={f.title} className="lp-card">
              <f.icon size={28} color="var(--lp-primary)" strokeWidth={1.8} />
              <h3 className="lp-feature-title">{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Trust() {
  const { t } = useTranslation("landing");
  const points = [1, 2, 3].map((n) => ({
    icon: TRUST_ICONS[n - 1],
    title: t(`trust.p${n}Title`),
    desc: t(`trust.p${n}Desc`),
  }));
  return (
    <section className="lp-section">
      <div className="lp-wrap">
        <p className="lp-kicker">{t("trust.label")}</p>
        <h2 className="lp-h2 lp-display">
          {t("trust.titleLine1")} {t("trust.titleLine2")}
        </h2>
        <p className="lp-lead" style={{ marginTop: 12 }}>{t("trust.subtitle")}</p>
        <div className="lp-grid-3">
          {points.map((p) => (
            <div key={p.title} className="lp-card">
              <p.icon size={24} color="var(--lp-primary)" strokeWidth={1.8} />
              <h3 className="lp-feature-title">{p.title}</h3>
              <p>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CaseStudies() {
  const { t } = useTranslation("landing");
  return (
    <section id="etudes-de-cas" className="lp-band">
      <div className="lp-wrap lp-section">
        <p className="lp-kicker">{t("cases.label")}</p>
        <h2 className="lp-h2 lp-display">{t("cases.title")}</h2>
        <p className="lp-lead" style={{ marginTop: 12 }}>{t("cases.subtitle")}</p>
        <div className="lp-grid-3">
          {CASE_STUDIES.map((item) => (
            <article key={item.id} className="lp-card lp-card-dashed">
              <p className="lp-card-kicker">{t("cases.coming")}</p>
              <h3 className="lp-feature-title">{item.title}</h3>
              <p>{item.summary}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const { t } = useTranslation("landing");
  const [open, setOpen] = useState(null);
  const items = [1, 2, 3, 4, 5].map((n) => ({ q: t(`faq.q${n}`), a: t(`faq.a${n}`) }));
  return (
    <section id="faq" className="lp-section">
      <div className="lp-wrap" style={{ maxWidth: 700 }}>
        <p className="lp-kicker" style={{ textAlign: "center" }}>{t("faq.label")}</p>
        <h2 className="lp-h2 lp-display" style={{ textAlign: "center", marginBottom: 24 }}>{t("faq.title")}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className="lp-faq-item">
                <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                  <span>{item.q}</span>
                  <ChevronDown size={16} color="var(--lp-primary)" style={{ transform: isOpen ? "rotate(180deg)" : "none", flexShrink: 0 }} />
                </button>
                {isOpen ? <div>{item.a}</div> : null}
              </div>
            );
          })}
        </div>
        <p className="lp-see">
          <LocalizedLink to="/faq" className="lp-see-link">
            {t("faq.seeAll")}
            <ArrowRight size={14} />
          </LocalizedLink>
        </p>
      </div>
    </section>
  );
}

function FinalCta() {
  const { t } = useTranslation("landing");
  const cta = usePublicCta();
  return (
    <section className="lp-section" style={{ paddingTop: 0 }}>
      <div className="lp-wrap">
        <div className="lp-cta-box">
          <h2 className="lp-h2 lp-display">{t("finalCta.title")}</h2>
          <p className="lp-lead" style={{ marginLeft: "auto", marginRight: "auto" }}>{t("finalCta.subtitle")}</p>
          <Link to={cta.href} className="lp-btn lp-btn-lg" style={{ marginTop: 24, width: "100%", maxWidth: 360 }}>
            {t("finalCta.cta")}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  const { t, i18n } = useTranslation("landing");
  const { pathname } = useLocation();
  const reviews = usePublishedReviews();

  usePageSeo({
    title: t("meta.title"),
    description: t("meta.description"),
    path: "/",
    jsonLd: [organizationJsonLd(), softwareApplicationJsonLd(reviews)],
  });

  useEffect(() => {
    track("landing_viewed", { source: "accueil" }, { onceKey: "landing_viewed" });
  }, []);

  useEffect(() => {
    const prevBg = document.body.style.background;
    const prevScheme = document.documentElement.style.colorScheme;
    document.body.style.background = "#000514";
    document.documentElement.style.colorScheme = "dark";

    const scrollToTarget = () => {
      const hash = window.location.hash?.replace("#", "");
      if (!hash) return;
      requestAnimationFrame(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    };
    scrollToTarget();
    window.addEventListener("hashchange", scrollToTarget);
    return () => {
      window.removeEventListener("hashchange", scrollToTarget);
      document.body.style.background = prevBg;
      document.documentElement.style.colorScheme = prevScheme;
    };
  }, [t, i18n.language, pathname]);

  return (
    <div className="lp-root">
      <PublicNav />
      <main>
        <Hero />
        <Objectives />
        <WhyMyswym />
        <SessionPreview />
        <CoachSection />
        <Includes />
        <Features />
        <Trust />
        <CaseStudies />
        <LandingReviews />
        <FAQ />
        <FinalCta />
      </main>
      <Footer />
      <StickyCta />
    </div>
  );
}
