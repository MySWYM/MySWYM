import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/lp-accordion.jsx";
import { LpButton } from "./ui/lp-button.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/lp-tabs.jsx";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LocalizedLink } from "./i18n/locale-routing.jsx";
import { usePublicCta } from "./lib/use-auth-session.js";
import {
  ArrowRight,
  Target,
  Sparkles,
  Repeat,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Gauge,
} from "lucide-react";
import { track } from "./lib/analytics.js";
import Footer from "./Footer.jsx";
import PublicNav from "./PublicNav.jsx";
import LandingReviews from "./marketing/LandingReviews.jsx";
import StickyCta from "./marketing/StickyCta.jsx";
import { usePublishedReviews } from "./marketing/usePublishedReviews.js";
import { usePageSeo, organizationJsonLd, softwareApplicationJsonLd } from "./lib/seo.js";
import "./landing/landing.css";

const OBJECTIVE_TABS = [
  { id: "progression", labelKey: "tabProgression", tagKey: "tagLevel", cards: ["p1", "p2", "p3", "p4"], media: "/nagerprogresser-objectif-landing.webp", width: 1672, height: 941 },
  {
    id: "triathlon",
    labelKey: "tabTriathlon",
    tagKey: "tagEvent",
    cards: ["t1", "t2", "t3", "t4", "t5"],
    media: "/Triathlon-objectif-landing.webp",
    width: 1672,
    height: 941,
  },
  { id: "openwater", labelKey: "tabOpenwater", tagKey: "tagDistance", cards: ["w1", "w2", "w3", "w4", "w5", "w6"], media: "/Eaulibre-objectif-landing.webp", width: 1536, height: 1024 },
  { id: "diploma", labelKey: "tabDiploma", tagKey: "tagDiploma", cards: ["d1", "d2", "d3"], media: "/Sauveteur-objectif-landing.webp", width: 1536, height: 1024 },
];

const INCLUDE_ITEMS = [
  { n: 1, Icon: Target },
  { n: 3, Icon: Gauge },
  { n: 4, Icon: Repeat },
  { n: 6, Icon: Sparkles },
];

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function SessionCard({ compact = false }) {
  const { t } = useTranslation("landing");
  const blocks = [
    { label: t("session.warmLabel"), content: t("session.warmContent") },
    { label: t("session.mainLabel"), content: t("session.mainContent") },
    { label: t("session.coolLabel"), content: t("session.coolContent") },
  ];
  const shown = compact ? blocks.slice(0, 2) : blocks;
  return (
    <div className={`lp-session${compact ? " is-compact" : ""}`}>
      <div className="lp-session-head">
        <span className="lp-card-kicker">{t("session.type")}</span>
        <h3>{t("session.heading")}</h3>
        <p>{t("session.meta")}</p>
      </div>
      {shown.map((b) => (
        <div key={b.label} className="lp-session-block">
          <strong>{b.label}</strong>
          <p>{b.content}</p>
        </div>
      ))}
      {compact ? (
        <a href="#seance" className="lp-session-more">
          {t("hero.seeSession")}
          <ArrowRight size={14} />
        </a>
      ) : (
        <p className="lp-session-tip">{t("session.tip")}</p>
      )}
    </div>
  );
}

function Hero() {
  const { t } = useTranslation("landing");
  const cta = usePublicCta();
  return (
    <section className="lp-hero">
      <div className="lp-hero-bg" aria-hidden>
        <img
          src="/hero-pool.webp"
          alt=""
          className="lp-hero-img"
          width={1024}
          height={1024}
          fetchPriority="high"
        />
      </div>
      <div className="lp-wrap lp-hero-inner">
        <div className="lp-hero-copy">
          <h1 className="lp-h1 lp-display">{t("hero.title")}</h1>
          <p className="lp-lead">{t("hero.subtitle")}</p>
          <div className="lp-cta-row">
            <LpButton asChild size="lg">
              <Link to={cta.href}>
                {t("hero.cta")}
                <ArrowRight size={16} />
              </Link>
            </LpButton>
            <a href="#seance" className="lp-see-link">
              {t("hero.seeSession")}
              <ArrowRight size={14} />
            </a>
          </div>
          <p className="lp-hero-note">{t("hero.freeNote")}</p>
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
        <aside className="lp-hero-session" aria-label={t("session.label")}>
          <SessionCard compact />
        </aside>
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
    el.scrollBy({ left: dir * step, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  return (
    <section className="lp-section">
      <Tabs value={tabId} onValueChange={setTabId}>
        <div className="lp-wrap">
          <div className="lp-intro">
            <h2 className="lp-h2 lp-display">{t("objectives.title")}</h2>
            <p className="lp-lead lp-lead-tight">{t("objectives.subtitle")}</p>
          </div>
          <TabsList className="lp-obj-tabs" aria-label={t("objectives.tabsAria")}>
            {OBJECTIVE_TABS.map((item) => (
              <TabsTrigger
                key={item.id}
                value={item.id}
                id={`lp-obj-tab-${item.id}`}
                className="lp-obj-tab"
              >
                {t(`objectives.${item.labelKey}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {OBJECTIVE_TABS.map((item) => (
          <TabsContent
            key={item.id}
            value={item.id}
            className={`lp-obj-stage${item.media ? " has-media" : ""}`}
            data-obj={item.id}
          >
            {item.media ? (
              <div className="lp-obj-media" aria-hidden>
                <img src={item.media} alt="" width={item.width} height={item.height} />
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
                  ref={item.id === tabId ? scrollerRef : undefined}
                >
                  {item.cards.map((key) => (
                    <Link key={key} to={cta.href} className="lp-obj-card">
                      <p className="lp-card-kicker">{t(`objectives.${item.tagKey}`)}</p>
                      <h3 className="lp-obj-card-title">{t(`objectives.${key}Title`)}</h3>
                      <p className="lp-obj-card-meta">{t(`objectives.${key}Meta`)}</p>
                      <p className="lp-obj-card-desc">{t(`objectives.${key}Desc`)}</p>
                      <span className="lp-obj-card-cta">
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
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}

function WhyMyswym() {
  const { t } = useTranslation("landing");
  const blocks = [1, 2, 3].map((n) => ({
    title: t(`why.b${n}Title`),
    stat: t(`why.b${n}Stat`),
    desc: t(`why.b${n}Desc`),
  }));
  return (
    <section id="pourquoi" className="lp-band">
      <div className="lp-wrap lp-section">
        <p className="lp-kicker">{t("why.label")}</p>
        <h2 className="lp-h2 lp-display">{t("why.title")}</h2>
        <p className="lp-lead lp-lead-tight">{t("why.subtitle")}</p>
        <div className="lp-why-grid">
          {blocks.map((b) => (
            <div key={b.title} className="lp-card">
              <h3 className="lp-feature-title lp-feature-title-flush">{b.title}</h3>
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
  return (
    <section id="seance" className="lp-band">
      <div className="lp-wrap lp-section">
        <p className="lp-kicker">{t("session.label")}</p>
        <h2 className="lp-h2 lp-display">{t("session.title")}</h2>
        <p className="lp-lead lp-lead-tight">{t("session.subtitle")}</p>
        <SessionCard />
      </div>
    </section>
  );
}

function CoachSection() {
  const { t } = useTranslation("landing");
  const cta = usePublicCta();
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
          <div className="lp-coach-actions">
            <LpButton asChild className="lp-coach-cta">
              <Link to={cta.href}>
                {t("coach.cta")}
                <ArrowRight size={14} />
              </Link>
            </LpButton>
            <a
              href={t("coach.igHref")}
              className="lp-see-link lp-coach-ig"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("coach.igCta")}
              <ArrowRight size={14} />
            </a>
          </div>
        </div>
        <div className="lp-coach-media">
          <img
            src="/coach.webp"
            alt="Arthur Noël, coach MySWYM"
            width={756}
            height={756}
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
  const items = INCLUDE_ITEMS.map(({ n, Icon }) => ({
    Icon,
    title: t(`includes.i${n}Title`),
    desc: t(`includes.i${n}Desc`),
  }));
  return (
    <section className="lp-band">
      <div className="lp-wrap lp-section">
        <p className="lp-kicker">{t("includes.label")}</p>
        <h2 className="lp-h2 lp-display">{t("includes.title")}</h2>
        <p className="lp-lead lp-lead-tight">{t("includes.subtitle")}</p>
        <div className="lp-grid-2 lp-includes-grid">
          {items.map((item) => (
            <div key={item.title} className="lp-card">
              <item.Icon size={24} color="var(--lp-primary)" strokeWidth={1.8} />
              <h3 className="lp-feature-title">{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const { t } = useTranslation("landing");
  const items = [1, 2, 3, 4, 5].map((n) => ({ id: `faq-${n}`, q: t(`faq.q${n}`), a: t(`faq.a${n}`) }));
  return (
    <section id="faq" className="lp-section">
      <div className="lp-wrap lp-faq-wrap">
        <p className="lp-kicker lp-center">{t("faq.label")}</p>
        <h2 className="lp-h2 lp-display lp-faq-title">{t("faq.title")}</h2>
        <Accordion type="single" collapsible className="lp-faq-list">
          {items.map((item) => (
            <AccordionItem key={item.id} value={item.id} className="lp-faq-item">
              <AccordionTrigger>
                <span>{item.q}</span>
                <ChevronDown size={16} color="var(--lp-primary)" aria-hidden />
              </AccordionTrigger>
              <AccordionContent>{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
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
    <section className="lp-section lp-final">
      <div className="lp-wrap">
        <div className="lp-cta-box">
          <h2 className="lp-h2 lp-display">{t("finalCta.title")}</h2>
          <p className="lp-lead lp-lead-center">{t("finalCta.subtitle")}</p>
          <LpButton asChild size="lg" className="lp-cta-box-btn">
            <Link to={cta.href}>
              {t("finalCta.cta")}
              <ArrowRight size={16} />
            </Link>
          </LpButton>
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  const { t, i18n } = useTranslation("landing");
  const { pathname } = useLocation();
  const { reviews } = usePublishedReviews();

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
        document.getElementById(hash)?.scrollIntoView({
          behavior: prefersReducedMotion() ? "auto" : "smooth",
          block: "start",
        });
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
        <LandingReviews />
        <FAQ />
        <FinalCta />
      </main>
      <Footer />
      <StickyCta />
    </div>
  );
}
