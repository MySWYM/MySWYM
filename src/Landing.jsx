import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import {
  ArrowRight,
  Target,
  Sparkles,
  Waves,
  CalendarRange,
  SlidersHorizontal,
  Repeat,
  Check,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { supabase } from "./supabase.js";
import { track, trackEvent } from "./lib/analytics.js";
import Footer from "./Footer.jsx";
import LanguageSwitcher from "./i18n/LanguageSwitcher.jsx";
import CheckoutLegalGates, { checkoutGatesReady, checkoutGatesError } from "./CheckoutLegalGates.jsx";
import LandingReviews from "./marketing/LandingReviews.jsx";
import { usePublishedReviews } from "./marketing/usePublishedReviews.js";
import { usePageSeo, organizationJsonLd, softwareApplicationJsonLd } from "./lib/seo.js";
import "./landing/landing.css";

const CTA_HREF = "/inscription";
const PRICE_MONTHLY = "price_1TPjyPAS4mfgF2Twx3Zh4zrJ";
const PRICE_ANNUAL = "price_1TudyVAS4mfgF2TwHiSo3Vrg";
const PRICE_MONTHLY_LABEL = "4,99€";
const PRICE_ANNUAL_LABEL = "39,99€";

const OBJECTIVES = [
  { id: "fitness", key: "o1" },
  { id: "endurance", key: "o2" },
  { id: "speed", key: "o3" },
  { id: "technique", key: "o4" },
  { id: "competition", key: "o5" },
  { id: "openwater", key: "o6" },
];

function Header() {
  const { t } = useTranslation("common");
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const links = [
    [t("nav.why"), "/accueil#pourquoi"],
    [t("nav.how"), "/comment-ca-marche"],
    [t("nav.pricing"), "/tarifs"],
    [t("nav.faq"), "/accueil#faq"],
  ];

  return (
    <header className="lp-header">
      <div className="lp-wrap lp-header-inner">
        <a href="/accueil" className="lp-brand" aria-label={t("nav.homeAria")}>
          <img
            src="/logo-myswym-banner-blanc.png"
            alt="mySWYM"
            height={24}
            width={164}
          />
        </a>
        <nav className="lp-nav" aria-label={t("nav.homeAria")}>
          {links.map(([label, href]) => {
            const pathOnly = href.split("#")[0];
            const isHere = pathOnly !== "/accueil" && pathOnly === pathname;
            return (
              <a key={href} href={href} aria-current={isHere ? "page" : undefined}>{label}</a>
            );
          })}
        </nav>
        <div className="lp-header-actions">
          <span className="lp-header-desktop">
            <LanguageSwitcher variant="nav" onDark />
          </span>
          <a href="/connexion" className="lp-link-quiet">{t("nav.login")}</a>
          <a href={CTA_HREF} className="lp-btn lp-btn-header">{t("nav.ctaShort")}</a>
          <button
            type="button"
            className="lp-menu-btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="lp-drawer">
          <div className="lp-drawer-backdrop" onClick={() => setMenuOpen(false)} />
          <div className="lp-drawer-panel">
            {links.map(([label, href]) => (
              <a key={href} href={href} className="lp-drawer-link" onClick={() => setMenuOpen(false)}>
                {label}
                <ChevronRight size={16} color="var(--lp-muted)" />
              </a>
            ))}
            <div className="lp-drawer-actions">
              <LanguageSwitcher variant="nav" onDark />
              <a href={CTA_HREF} className="lp-btn" onClick={() => setMenuOpen(false)}>{t("nav.cta")}</a>
              <a href="/connexion" className="lp-btn lp-btn-secondary" onClick={() => setMenuOpen(false)}>{t("nav.login")}</a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function Hero() {
  const { t } = useTranslation("landing");
  return (
    <section className="lp-hero">
      <div className="lp-hero-bg" aria-hidden />
      <div className="lp-wrap lp-hero-inner">
        <div className="lp-hero-copy">
          <span className="lp-badge">
            <Sparkles size={14} />
            {t("hero.badge")}
          </span>
          <h1 className="lp-h1 lp-display">{t("hero.title")}</h1>
          <p className="lp-lead">{t("hero.subtitle")}</p>
          <div className="lp-cta-row">
            <a href={CTA_HREF} className="lp-btn lp-btn-lg">
              {t("hero.cta")}
              <ArrowRight size={16} />
            </a>
            <a href="/tarifs" className="lp-btn lp-btn-lg lp-btn-secondary">
              <Target size={16} />
              {t("hero.ctaSecondary")}
            </a>
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
  return (
    <section id="pourquoi" className="lp-section">
      <div className="lp-wrap">
        <div style={{ maxWidth: 42 * 16 }}>
          <h2 className="lp-h2 lp-display">{t("objectives.title")}</h2>
          <p className="lp-lead" style={{ marginTop: 12 }}>{t("objectives.subtitle")}</p>
        </div>
        <div className="lp-grid-3">
          {OBJECTIVES.map((o) => (
            <a key={o.id} href={CTA_HREF} className="lp-card">
              <div className="lp-card-title">
                {t(`objectives.${o.key}Label`)}
                <ArrowRight size={16} color="var(--lp-muted)" />
              </div>
              <p className="lp-card-kicker">{t(`objectives.${o.key}Short`)}</p>
              <p>{t(`objectives.${o.key}Desc`)}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const { t } = useTranslation("landing");
  const steps = [
    { icon: SlidersHorizontal, title: t("how.s1Title"), text: t("how.s1Desc") },
    { icon: Sparkles, title: t("how.s2Title"), text: t("how.s2Desc") },
    { icon: Repeat, title: t("how.s3Title"), text: t("how.s3Desc") },
  ];
  return (
    <section id="how" className="lp-band">
      <div className="lp-wrap lp-section">
        <h2 className="lp-h2 lp-display">{t("how.title")}</h2>
        <div className="lp-steps">
          {steps.map((s, i) => (
            <div key={s.title} className="lp-step">
              <span className="lp-step-n">0{i + 1}</span>
              <s.icon size={28} color="var(--lp-primary)" strokeWidth={1.8} style={{ marginTop: 12 }} />
              <h3>{s.title}</h3>
              <p>{s.text}</p>
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

function Pricing() {
  const { t } = useTranslation("landing");
  const [billing, setBilling] = useState("annual");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptWithdrawal, setAcceptWithdrawal] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handlePremium = async (priceId) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      try {
        const ref = new URLSearchParams(window.location.search).get("ref");
        if (ref?.trim()) localStorage.setItem("myswym_ref", ref.trim().toUpperCase());
      } catch { /* ignore */ }
      trackEvent("signup_started", { source: "landing_pricing" }, { essential: true });
      track("signup_started", { source: "landing_pricing" }, { onceKey: "signup_started:landing_pricing" });
      window.location.href = "/inscription";
      return;
    }
    if (!checkoutGatesReady(acceptTerms, acceptWithdrawal)) {
      alert(checkoutGatesError(acceptTerms, acceptWithdrawal) || "Coche les cases CGV et rétractation avant de continuer.");
      document.getElementById("landing-checkout-legal-gates")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    try {
      trackEvent("checkout_started", { source: "landing_pricing", price_id: priceId }, { essential: true });
      let referralCode;
      try {
        referralCode = (session.user?.user_metadata?.referred_by
          || localStorage.getItem("myswym_ref")
          || "").toUpperCase() || undefined;
      } catch { referralCode = undefined; }
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ priceId, ...(referralCode ? { referralCode } : {}) }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      alert(data.error || t("pricing.checkoutError"));
    } catch {
      alert(t("pricing.checkoutError"));
    }
  };

  const isAnnual = billing === "annual";
  const priceId = isAnnual ? PRICE_ANNUAL : PRICE_MONTHLY;
  const displayPrice = isAnnual ? "3,33€" : PRICE_MONTHLY_LABEL;
  const freeFeatures = [t("pricing.freeF1"), t("pricing.freeF2"), t("pricing.freeF3"), t("pricing.freeF4")];
  const premiumFeatures = [t("pricing.premF1"), t("pricing.premF2"), t("pricing.premF3"), t("pricing.premF4"), t("pricing.premF5")];

  return (
    <section id="pricing" className="lp-section">
      <div className="lp-wrap" style={{ maxWidth: 880 }}>
        <div style={{ textAlign: "center" }}>
          <h2 className="lp-h2 lp-display">{t("pricing.titleLine1")}<br />{t("pricing.titleLine2")}</h2>
          <p className="lp-lead" style={{ marginLeft: "auto", marginRight: "auto" }}>{t("pricing.subtitle")}</p>
          <div className="lp-price-toggle" role="group">
            <button type="button" aria-pressed={isAnnual} onClick={() => setBilling("annual")}>{t("pricing.billingAnnual")}</button>
            <button type="button" aria-pressed={!isAnnual} onClick={() => setBilling("monthly")}>{t("pricing.billingMonthly")}</button>
          </div>
          {isAnnual && (
            <p style={{ marginTop: 12, color: "var(--lp-primary)", fontWeight: 700, fontSize: 13 }}>{t("pricing.saveUpTo")}</p>
          )}
        </div>

        <div className="lp-pricing-grid">
          <div className="lp-card" style={{ display: "flex", flexDirection: "column" }}>
            <div className="lp-display" style={{ fontSize: 22, fontWeight: 700 }}>{t("pricing.freeTitle")}</div>
            <div className="lp-display lp-price-display" style={{ margin: "12px 0 4px" }}>{t("pricing.freePrice")}</div>
            <p className="lp-muted" style={{ fontSize: 13, marginBottom: 22 }}>{t("pricing.freeMeta")}</p>
            <a href={CTA_HREF} className="lp-btn lp-btn-secondary" style={{ width: "100%", marginBottom: 22 }}>{t("pricing.freeCta")}</a>
            <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: "auto" }}>
              {freeFeatures.map((f) => (
                <div key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <Check size={15} color="var(--lp-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ color: "var(--lp-muted)", fontSize: 14 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lp-card" style={{ display: "flex", flexDirection: "column", position: "relative", borderColor: "color-mix(in srgb, var(--lp-primary) 45%, transparent)" }}>
            <div style={{
              position: "absolute", top: -12, right: 20,
              background: "var(--lp-primary)", color: "var(--lp-primary-fg)",
              fontSize: 11, fontWeight: 700, padding: "4px 14px", borderRadius: 100,
            }}>{t("pricing.recommended")}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div className="lp-display" style={{ fontSize: 22, fontWeight: 700 }}>{t("pricing.subTitle")}</div>
              {isAnnual && (
                <span style={{ background: "#22C55E", color: "#fff", fontSize: 12, fontWeight: 800, padding: "4px 10px", borderRadius: 8 }}>{t("pricing.saveBadge")}</span>
              )}
            </div>
            {isAnnual && (
              <p className="lp-muted" style={{ fontSize: 13, marginTop: 8, textDecoration: "line-through" }}>{PRICE_MONTHLY_LABEL} {t("pricing.perMonth")}</p>
            )}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, margin: "8px 0 4px" }}>
              <span className="lp-display lp-price-display">{displayPrice}</span>
              <span className="lp-muted" style={{ fontSize: 14, marginBottom: 6 }}>{t("pricing.perMonth")}</span>
            </div>
            <p className="lp-muted" style={{ fontSize: 13, marginBottom: 22 }}>
              {isAnnual ? t("pricing.billedAnnual", { price: PRICE_ANNUAL_LABEL }) : t("pricing.billedMonthly")}
            </p>

            {isLoggedIn && (
              <div id="landing-checkout-legal-gates" style={{ marginBottom: 16, padding: 12, borderRadius: 14, background: "rgba(255,255,255,0.95)" }}>
                <CheckoutLegalGates
                  acceptTerms={acceptTerms}
                  onAcceptTerms={setAcceptTerms}
                  acceptWithdrawal={acceptWithdrawal}
                  onAcceptWithdrawal={setAcceptWithdrawal}
                  ink="#191c1e"
                />
              </div>
            )}

            <button type="button" className="lp-btn" style={{ width: "100%", marginBottom: 22 }} onClick={() => handlePremium(priceId)}>
              {t("pricing.unlockCta")}
            </button>
            <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: "auto" }}>
              {premiumFeatures.map((f) => (
                <div key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <Check size={15} color="var(--lp-primary)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 14 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="lp-muted" style={{ textAlign: "center", marginTop: 16, fontSize: 12 }}>{t("pricing.compareNote")}</p>
        <p className="lp-muted" style={{ textAlign: "center", marginTop: 8, fontSize: 13 }}>
          {t("pricing.moreLink")}{" "}
          <a href="/tarifs" style={{ color: "var(--lp-primary)", fontWeight: 600 }}>{t("pricing.moreLinkLabel")}</a>.
        </p>
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
      </div>
    </section>
  );
}

function FinalCta() {
  const { t } = useTranslation("landing");
  return (
    <section className="lp-section" style={{ paddingTop: 0 }}>
      <div className="lp-wrap">
        <div className="lp-cta-box">
          <h2 className="lp-h2 lp-display">{t("finalCta.title")}</h2>
          <p className="lp-lead" style={{ marginLeft: "auto", marginRight: "auto" }}>{t("finalCta.subtitle")}</p>
          <a href={CTA_HREF} className="lp-btn lp-btn-lg" style={{ marginTop: 24, width: "100%", maxWidth: 360 }}>
            {t("finalCta.cta")}
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}

function StickyCta() {
  const { t } = useTranslation("common");
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  useEffect(() => {
    const apply = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);
  if (!mobile) return null;
  return (
    <>
      <div className="lp-sticky-spacer" aria-hidden />
      <div className="lp-sticky">
        <a href={CTA_HREF} className="lp-btn" style={{ width: "100%", minHeight: 48 }}>{t("nav.cta")}</a>
      </div>
    </>
  );
}

export default function Landing() {
  const { t, i18n } = useTranslation("landing");
  const { pathname } = useLocation();
  const reviews = usePublishedReviews();
  const isHow = pathname === "/comment-ca-marche";

  usePageSeo({
    title: isHow ? t("meta.howTitle") : t("meta.title"),
    description: isHow ? t("meta.howDescription") : t("meta.description"),
    path: isHow ? "/comment-ca-marche" : "/accueil",
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
      const path = window.location.pathname;
      const hash = window.location.hash?.replace("#", "");
      const sectionId = hash || (path === "/comment-ca-marche" ? "how" : null);
      if (!sectionId) return;
      requestAnimationFrame(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    };
    scrollToTarget();
    window.addEventListener("hashchange", scrollToTarget);
    return () => {
      window.removeEventListener("hashchange", scrollToTarget);
      document.body.style.background = prevBg;
      document.documentElement.style.colorScheme = prevScheme;
    };
  }, [t, i18n.language]);

  return (
    <div className="lp-root">
      <Header />
      <main>
        <Hero />
        <Objectives />
        <HowItWorks />
        <Features />
        <Pricing />
        <LandingReviews />
        <FAQ />
        <FinalCta />
      </main>
      <Footer />
      <StickyCta />
    </div>
  );
}
