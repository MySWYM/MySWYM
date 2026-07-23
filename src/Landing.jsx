import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase.js";
import {
  Waves, Activity, Award, Target, ChevronRight, Check, X, Minus,
  ArrowRight, Star, Zap, TrendingUp, Calendar, Timer, Play,
  ChevronDown, RotateCcw, Menu,
} from "lucide-react";
import PublicNav from "./PublicNav.jsx";
import Footer from "./Footer.jsx";

// ── Design tokens — MySwym "Fluid Athleticism" ─────────────────────────────
const C = {
  bg:          "#f8f9fc",
  bgSoft:      "#edeef1",
  bgCard:      "#f2f3f6",
  ink:         "#191c1e",
  inkLight:    "#434751",
  primary:     "#355da3",
  primaryDeep: "#154388",
  primaryFix:  "#d8e2ff",
  accent:      "#8eb3ff",   // primary-container — CTA bg
  accentText:  "#154388",   // on-primary-container
  secondary:   "#5d5e61",
  secContainer:"#e2e2e5",
  outline:     "#737782",
  outlineVar:  "#c3c6d2",
  surfHigh:    "#e7e8eb",
  white:       "#ffffff",
  border:      "rgba(53,93,163,0.08)",
  borderMid:   "rgba(53,93,163,0.14)",
  shadow:      "0 2px 12px rgba(142,179,255,0.10)",
  shadowMd:    "0 8px 32px rgba(142,179,255,0.18)",
  shadowLg:    "0 20px 60px rgba(142,179,255,0.22)",
};

const FONT = "'Lexend', sans-serif";
const FONT_DISPLAY = "'Barlow Condensed', sans-serif";

// ── Font loader ────────────────────────────────────────────────────────────
const FontLoader = () => {
  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Lexend:wght@300;400;500;600;700;800;900&display=swap";
    document.head.appendChild(l);
  }, []);
  return null;
};

// ── Scroll animation ───────────────────────────────────────────────────────
function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function FadeIn({ children, delay = 0, style = {} }) {
  const [ref, visible] = useInView();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(24px)",
      transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Animated counter ───────────────────────────────────────────────────────
function AnimCounter({ to, suffix = "", duration = 1400 }) {
  const [val, setVal] = useState(0);
  const [ref, visible] = useInView();
  useEffect(() => {
    if (!visible) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [visible, to, duration]);
  return <span ref={ref}>{val.toLocaleString("fr-FR")}{suffix}</span>;
}

// ── Mobile detection ──────────────────────────────────────────────────────
function useIsMobile(bp = 640) {
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < bp);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp - 1}px)`);
    const apply = () => setMobile(mq.matches || window.innerWidth < bp);
    apply();
    mq.addEventListener?.("change", apply);
    window.addEventListener("resize", apply);
    return () => {
      mq.removeEventListener?.("change", apply);
      window.removeEventListener("resize", apply);
    };
  }, [bp]);
  return mobile;
}

// ── Section label ──────────────────────────────────────────────────────────
function SectionLabel({ text }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: C.primaryFix, borderRadius: 100,
      padding: "5px 14px", marginBottom: 16,
    }}>
      <span style={{ color: C.primary, fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", fontFamily: FONT }}>{text}</span>
    </div>
  );
}

// ── Nav ────────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  ["Comment ca marche", "/comment-ca-marche"],
  ["Conformite",        "/conformite"],
  ["Tarifs",            "/tarifs"],
  ["Blog",              "/blog"],
  ["Contact",           "/contact"],
];

function Nav() {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener("scroll", close, { passive: true });
    return () => window.removeEventListener("scroll", close);
  }, [menuOpen]);

  useEffect(() => {
    document.body.style.overflow = (isMobile && menuOpen) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobile, menuOpen]);

  const navBg = (scrolled || menuOpen)
    ? "rgba(255,255,255,0.95)"
    : "rgba(255,255,255,0.0)";

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        background: navBg,
        backdropFilter: (scrolled || menuOpen) ? "blur(16px)" : "none",
        borderBottom: (scrolled || menuOpen) ? `1px solid ${C.border}` : "none",
        boxShadow: scrolled ? "0 1px 20px rgba(142,179,255,0.12)" : "none",
        transition: "background 0.3s, box-shadow 0.3s",
      }}>
        <div style={{
          maxWidth: 1120, margin: "0 auto",
          padding: "0 20px", height: 64,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* Logo */}
          <a href="/accueil" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 18, color: C.accent, letterSpacing: "0.08em", textTransform: "uppercase" }}>MySwym</span>
          </a>

          {/* Desktop links */}
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
              {NAV_LINKS.map(([l, h]) => (
                <a key={h} href={h}
                  style={{ color: C.secondary, fontSize: 14, fontWeight: 500, textDecoration: "none", fontFamily: FONT, transition: "color 0.2s" }}
                  onMouseEnter={e => e.target.style.color = C.ink}
                  onMouseLeave={e => e.target.style.color = C.secondary}
                >{l}</a>
              ))}
            </div>
          )}

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {!isMobile && (
              <a href="/connexion" style={{ color: C.secondary, fontSize: 14, fontWeight: 500, textDecoration: "none", padding: "8px 12px", fontFamily: FONT }}>Se connecter</a>
            )}
            <a href="/inscription" style={{
              background: C.accent, color: C.accentText,
              fontSize: isMobile ? 13 : 14, fontWeight: 700,
              padding: isMobile ? "9px 16px" : "10px 22px",
              borderRadius: 100, textDecoration: "none",
              fontFamily: FONT,
              boxShadow: "0 4px 16px rgba(142,179,255,0.35)",
            }}>Créer mon compte</a>

            {isMobile && (
              <button
                onClick={() => setMenuOpen(o => !o)}
                aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 4px", marginLeft: 4, color: C.ink }}
              >
                {menuOpen ? <X size={22} color={C.ink} /> : <Menu size={22} color={C.ink} />}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {isMobile && (
        <div style={{ position: "fixed", top: 64, left: 0, right: 0, bottom: 0, zIndex: 199, pointerEvents: menuOpen ? "all" : "none" }}>
          <div onClick={() => setMenuOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(25,28,30,0.28)", opacity: menuOpen ? 1 : 0, transition: "opacity 0.25s" }} />
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            background: C.white, borderBottom: `1px solid ${C.border}`,
            boxShadow: menuOpen ? C.shadowMd : "none",
            padding: "8px 0 24px",
            transform: menuOpen ? "translateY(0)" : "translateY(-100%)",
            visibility: menuOpen ? "visible" : "hidden",
            transition: menuOpen
              ? "transform 0.28s cubic-bezier(0.4,0,0.2,1), visibility 0s 0s"
              : "transform 0.28s cubic-bezier(0.4,0,0.2,1), visibility 0s 0.28s",
          }}>
            {NAV_LINKS.map(([label, href]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 24px", color: C.ink, fontSize: 16, fontWeight: 600,
                textDecoration: "none", borderBottom: `1px solid ${C.border}`, fontFamily: FONT,
              }}>
                {label}
                <ChevronRight size={16} color={C.outline} />
              </a>
            ))}
            <div style={{ padding: "20px 24px 0", display: "flex", flexDirection: "column", gap: 10 }}>
              <a href="/connexion" onClick={() => setMenuOpen(false)} style={{
                display: "block", textAlign: "center", padding: "13px", borderRadius: 16,
                border: `1.5px solid ${C.outlineVar}`, color: C.ink, fontSize: 15, fontWeight: 600,
                textDecoration: "none", background: C.bgCard, fontFamily: FONT,
              }}>Se connecter</a>
              <a href="/inscription" onClick={() => setMenuOpen(false)} style={{
                display: "block", textAlign: "center", padding: "13px", borderRadius: 16,
                background: C.accent, color: C.accentText, fontSize: 15, fontWeight: 700,
                textDecoration: "none", boxShadow: "0 6px 20px rgba(142,179,255,0.35)", fontFamily: FONT,
              }}>Créer mon compte</a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Hero ───────────────────────────────────────────────────────────────────
function Hero() {
  const isMobile = useIsMobile();
  return (
    <section style={{
      background: `radial-gradient(ellipse 90% 70% at 10% -10%, rgba(142,179,255,0.28), transparent 55%), radial-gradient(ellipse 60% 50% at 100% 20%, rgba(216,226,255,0.5), transparent 45%), ${C.bg}`,
      padding: isMobile ? "96px 20px 56px" : "112px 24px 72px",
      overflow: "hidden", position: "relative",
    }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.05fr 0.95fr", gap: isMobile ? 40 : 56, alignItems: "center", position: "relative" }}>
        <div style={{ textAlign: isMobile ? "center" : "left" }}>
          <p style={{
            fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: isMobile ? 18 : 20,
            color: C.accent, letterSpacing: "0.1em", textTransform: "uppercase",
            margin: "0 0 16px",
          }}>
            MySWYM
          </p>

          <h1 style={{
            fontFamily: FONT_DISPLAY, fontWeight: 800,
            fontSize: "clamp(40px, 6vw, 68px)",
            color: C.ink, lineHeight: 0.98,
            letterSpacing: "0",
            margin: "0 0 18px",
            textTransform: "uppercase",
          }}>
            Tu nages déjà.<br />
            <span style={{ color: C.primary }}>On structure<br />le reste.</span>
          </h1>

          <p style={{ color: C.inkLight, fontSize: isMobile ? 16 : 17, lineHeight: 1.65, marginBottom: 28, maxWidth: isMobile ? "100%" : 440, fontFamily: FONT, marginLeft: isMobile ? "auto" : 0, marginRight: isMobile ? "auto" : 0 }}>
            Ton plan de séances, clair et prêt — adapté à ton objectif. Pas une école de natation : un générateur d’entraînement pour ceux qui savent déjà nager.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: isMobile ? "center" : "flex-start", flexWrap: "wrap", marginBottom: 14 }}>
            <a href="/" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: C.accent, color: C.accentText, fontWeight: 700,
              fontSize: isMobile ? 15 : 16, fontFamily: FONT,
              padding: isMobile ? "14px 22px" : "15px 28px",
              borderRadius: 16, textDecoration: "none",
              boxShadow: "0 8px 28px rgba(142,179,255,0.40)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(142,179,255,0.50)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(142,179,255,0.40)"; }}
            >
              Créer mon plan — gratuit <ArrowRight size={16} />
            </a>
          </div>
          <p style={{ color: C.outline, fontSize: 13, fontFamily: FONT }}>4 semaines offertes · Sans carte · 2 minutes</p>
        </div>

        {/* Phone — séance lisible, zéro jargon */}
        <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
          <div style={{
            width: isMobile ? "min(300px, calc(100vw - 48px))" : "clamp(280px, 34vw, 310px)",
            background: C.ink, borderRadius: 40,
            border: "5px solid rgba(0,0,0,0.06)",
            padding: 10,
            boxShadow: `0 36px 80px rgba(53,93,163,0.22)`,
          }}>
            <div style={{ background: C.white, borderRadius: 30, overflow: "hidden" }}>
              <div style={{ background: C.ink, padding: "16px 18px 18px" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginBottom: 4, letterSpacing: "0.08em", fontFamily: FONT }}>AUJOURD’HUI · SÉANCE 1</div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 800, color: C.white, textTransform: "uppercase", letterSpacing: "0.02em" }}>Nage à ton rythme</div>
                <div style={{ marginTop: 8, fontSize: 13, color: C.accent, fontWeight: 600, fontFamily: FONT }}>900 m · ~35 min</div>
              </div>
              <div style={{ background: C.bg, padding: "14px 14px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "Échauffement", text: "200 m tranquille — crawl ou dos, comme tu veux" },
                  { label: "Corps", text: "5× (2 longueurs + 30 s de repos) — sans te presser" },
                  { label: "Retour calme", text: "200 m très lent pour récupérer" },
                ].map((b, i) => (
                  <div key={i} style={{ background: C.white, borderRadius: 14, padding: "11px 13px", border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.primary, letterSpacing: "0.06em", marginBottom: 4, fontFamily: FONT }}>{b.label.toUpperCase()}</div>
                    <div style={{ fontSize: 13, color: C.inkLight, lineHeight: 1.45, fontFamily: FONT }}>{b.text}</div>
                  </div>
                ))}
                <div style={{ fontSize: 12, color: C.secondary, fontFamily: FONT, padding: "4px 2px 0", lineHeight: 1.45 }}>
                  Astuce : finis sans être épuisé. Allonger la pause, c’est normal.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── How it works — storytelling ────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      n: "01", icon: Target, title: "Tu dis où tu vas",
      desc: "Triathlon, technique, eau libre, diplôme… Tu choisis ton cap. Pas de questionnaire interminable — juste de quoi construire le bon plan.",
    },
    {
      n: "02", icon: Calendar, title: "Le plan apparaît",
      desc: "Semaine après semaine, séances prêtes. Adaptées à ta fréquence et à ton niveau. Comme si un coach avait préparé ton carnet d’entraînement.",
    },
    {
      n: "03", icon: Waves, title: "Tu nages. C’est clair.",
      desc: "Avant d’entrer dans l’eau, tu sais quoi faire : combien, à quelle intensité ressentie, et sur quoi te concentrer. Zéro improvisation.",
    },
  ];
  return (
    <section id="how" style={{ background: C.bg, padding: "clamp(60px,8vw,100px) 20px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 48 }}>
          <SectionLabel text="COMMENT ÇA MARCHE" />
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(32px, 4.5vw, 52px)", fontWeight: 800, color: C.ink, margin: "0 0 12px", letterSpacing: "0", textTransform: "uppercase" }}>
            Du cap au bassin,<br />sans friction
          </h2>
          <p style={{ color: C.inkLight, fontSize: 16, maxWidth: 440, margin: "0 auto", fontFamily: FONT, lineHeight: 1.6 }}>
            Pas un quiz froid. Une trajectoire : tu choisis, on structure, tu nages.
          </p>
        </FadeIn>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18 }}>
          {steps.map((s, i) => (
            <FadeIn key={i} delay={i * 0.12}>
              <div style={{
                background: C.white, border: `1px solid ${C.border}`,
                borderRadius: 28, padding: "28px 26px", height: "100%", boxSizing: "border-box",
                boxShadow: C.shadow, position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", top: -8, right: 12,
                  fontFamily: FONT_DISPLAY, fontSize: 72, fontWeight: 900,
                  color: C.primaryFix, lineHeight: 1, letterSpacing: "-0.04em", pointerEvents: "none",
                }}>{s.n}</div>
                <div style={{ width: 48, height: 48, background: C.primaryFix, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                  <s.icon size={22} color={C.primary} />
                </div>
                <h3 style={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: C.ink, margin: "0 0 10px" }}>{s.title}</h3>
                <p style={{ color: C.inkLight, fontSize: 14, lineHeight: 1.7, fontFamily: FONT, margin: 0 }}>{s.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Week Example — séances lisibles ────────────────────────────────────────
function WeekExample() {
  const isMobile = useIsMobile();
  const [activeDay, setActiveDay] = useState(0);

  const sessions = [
    {
      day: "Reprise", vibe: "Tranquille", color: "#355da3",
      title: "Nage à ton rythme", total: "900 m · ~35 min",
      warmup: "200 m tout doux — crawl ou dos, comme tu veux",
      main: "5 fois : 2 longueurs, puis 30 secondes de repos. Sans te presser.",
      cool: "200 m très calme pour récupérer",
      tip: "L’objectif : sortir de l’eau avec envie de revenir. Allonger la pause, c’est normal.",
    },
    {
      day: "Fond", vibe: "Endurance", color: "#0097A7",
      title: "Séries confortables", total: "2 000 m · ~50 min",
      warmup: "400 m échauffement tranquille",
      main: "5 × 300 m crawl à une allure où tu pourrais encore parler — 30 s entre chaque.",
      cool: "300 m retour au calme mixte",
      tip: "Respiration régulière. Pense à glisser après chaque coulée.",
    },
    {
      day: "Technique", vibe: "Sensation", color: "#154388",
      title: "Glisse & bras", total: "1 600 m · ~45 min",
      warmup: "200 m libre + quelques longueurs pour sentir l’eau",
      main: "6 × 50 m focus bras, puis 6 × 50 m focus glisse. Un seul point à la fois.",
      cool: "200 m dos décontracté",
      tip: "Sur chaque longueur, un seul truc à améliorer. Pas tout d’un coup.",
    },
    {
      day: "Effort", vibe: "Soutenu", color: "#E65100",
      title: "Un cran au-dessus", total: "1 800 m · ~45 min",
      warmup: "300 m + 4 × 50 m qui accélèrent progressivement",
      main: "8 × 100 m crawl — effort régulier, pas un sprint. 20 s de repos.",
      cool: "300 m nage libre tranquille",
      tip: "Même rythme du 1er au 8e. Si tu accélères à la fin, tu partais trop lentement.",
    },
  ];

  const s = sessions[activeDay];

  return (
    <section id="conformite" style={{ background: C.bgSoft, padding: "clamp(60px,8vw,100px) 20px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 48 }}>
          <SectionLabel text="APERÇU DE SÉANCE" />
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(32px, 4.5vw, 52px)", fontWeight: 800, color: C.ink, margin: "0 0 14px", letterSpacing: "0", textTransform: "uppercase" }}>
            Clair avant<br />d’entrer dans l’eau
          </h2>
          <p style={{ color: C.inkLight, fontSize: 16, maxWidth: 460, margin: "0 auto", fontFamily: FONT, lineHeight: 1.6 }}>
            Pas de jargon opaque. Tu lis, tu comprends, tu nages — du rythme tranquille à l’effort soutenu.
          </p>
        </FadeIn>

        <FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "160px 1fr", gap: 16, alignItems: "start" }}>
            <div style={{ display: "flex", flexDirection: isMobile ? "row" : "column", gap: 8 }}>
              {sessions.map((sess, i) => (
                <button key={i} type="button" onClick={() => setActiveDay(i)} style={{
                  flex: isMobile ? 1 : "none",
                  padding: isMobile ? "12px 6px" : "14px 16px",
                  borderRadius: 16,
                  border: `1.5px solid ${activeDay === i ? sess.color : C.border}`,
                  background: activeDay === i ? `${sess.color}12` : C.white,
                  cursor: "pointer", textAlign: isMobile ? "center" : "left", transition: "all 0.15s",
                  boxShadow: activeDay === i ? `0 4px 16px ${sess.color}18` : C.shadow,
                  minWidth: 0,
                }}>
                  <div style={{ fontSize: isMobile ? 12 : 14, fontWeight: 700, color: activeDay === i ? C.ink : C.secondary, fontFamily: FONT }}>{sess.day}</div>
                  {!isMobile && <div style={{ fontSize: 12, color: activeDay === i ? sess.color : C.outline, fontWeight: 600, marginTop: 2, fontFamily: FONT }}>{sess.vibe}</div>}
                </button>
              ))}
            </div>

            <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 24, padding: isMobile ? 20 : 28, boxShadow: C.shadow }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                <div style={{ background: `${s.color}14`, borderRadius: 12, padding: "6px 12px" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: s.color, fontFamily: FONT }}>{s.vibe}</span>
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <div style={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: C.ink }}>{s.title}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.secondary, fontFamily: FONT }}>{s.total}</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {[
                  { label: "Échauffement", content: s.warmup, color: "#34C759" },
                  { label: "Corps de séance", content: s.main, color: s.color },
                  { label: "Retour au calme", content: s.cool, color: C.outline },
                ].map((block, i) => (
                  <div key={i} style={{ background: C.bgCard, borderLeft: `3px solid ${block.color}`, borderRadius: "0 14px 14px 0", padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: block.color, letterSpacing: "0.04em", marginBottom: 4, fontFamily: FONT }}>{block.label}</div>
                    <div style={{ fontSize: 15, color: C.inkLight, lineHeight: 1.55, fontFamily: FONT }}>{block.content}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: C.primaryFix, borderRadius: 14, padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <Zap size={14} color={C.primary} style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 13, color: C.inkLight, lineHeight: 1.6, fontFamily: FONT }}>{s.tip}</span>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ── Goals — cards type Elevate ─────────────────────────────────────────────
function Goals() {
  const isMobile = useIsMobile();
  const goals = [
    {
      icon: RotateCcw, color: "#355da3", tint: "rgba(53,93,163,0.08)",
      title: "Technique & progression",
      sub: "Nager mieux, plus longtemps",
      desc: "Tu sais déjà nager. Tu veux un plan clair pour progresser sans improvisation.",
      href: "/",
    },
    {
      icon: Activity, color: "#E65100", tint: "rgba(230,81,0,0.08)",
      title: "Triathlon",
      sub: "XS → XXL",
      desc: "Volumes et intensités pensés pour la partie natation de ta course.",
      href: "/",
    },
    {
      icon: Waves, color: "#0097A7", tint: "rgba(0,151,167,0.08)",
      title: "Eau libre",
      sub: "Lac · Mer · Traversée",
      desc: "Endurance, orientation, gestion de l’effort hors lignes d’eau.",
      href: "/",
    },
    {
      icon: Award, color: "#B45309", tint: "rgba(180,83,9,0.08)",
      title: "Examens & diplômes",
      sub: "BNSSA · BPJEPS · CAEPMNS",
      desc: "Préparation ciblée pour le jour J — parcours, apnée, remorquage.",
      href: "/",
    },
  ];

  return (
    <section id="goals" style={{ background: C.bgSoft, padding: "clamp(56px,7vw,88px) 20px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 40 }}>
          <SectionLabel text="TON OBJECTIF" />
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(32px, 4.5vw, 52px)", fontWeight: 800, color: C.ink, margin: "0 0 12px", letterSpacing: "0", textTransform: "uppercase" }}>
            Choisis ton cap
          </h2>
          <p style={{ color: C.inkLight, fontSize: 16, maxWidth: 420, margin: "0 auto", fontFamily: FONT, lineHeight: 1.6 }}>
            Comme Elevate pour la course : tu te projettes d’abord. Le plan suit.
          </p>
        </FadeIn>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
          gap: 14,
        }}>
          {goals.map((g, i) => (
            <FadeIn key={i} delay={i * 0.07}>
              <a href={g.href} style={{ textDecoration: "none", display: "block", height: "100%" }}>
                <div
                  style={{
                    background: C.white,
                    border: `1.5px solid ${C.border}`,
                    borderRadius: 24,
                    padding: isMobile ? "22px 20px" : "26px 24px",
                    height: "100%",
                    boxSizing: "border-box",
                    boxShadow: C.shadow,
                    transition: "box-shadow 0.25s, transform 0.25s, border-color 0.25s",
                    display: "flex",
                    gap: 18,
                    alignItems: "flex-start",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = `0 14px 40px ${g.color}22`;
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.borderColor = `${g.color}40`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = C.shadow;
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = C.border;
                  }}
                >
                  <div style={{
                    width: 56, height: 56, flexShrink: 0,
                    background: g.tint, borderRadius: 18,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <g.icon size={26} color={g.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: C.ink, margin: "0 0 4px" }}>{g.title}</h3>
                    <div style={{ fontSize: 12, color: g.color, fontWeight: 700, marginBottom: 8, fontFamily: FONT }}>{g.sub}</div>
                    <p style={{ color: C.inkLight, fontSize: 14, lineHeight: 1.55, margin: 0, fontFamily: FONT }}>{g.desc}</p>
                  </div>
                  <ChevronRight size={18} color={C.outline} style={{ flexShrink: 0, marginTop: 6 }} />
                </div>
              </a>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Instagram bridge ───────────────────────────────────────────────────────
function InstagramBridge() {
  const isMobile = useIsMobile();
  const previews = [
    { title: "Respiration bilatérale", tag: "Crawl" },
    { title: "Coup de pied efficace", tag: "Éducatif" },
    { title: "Glisse & alignement", tag: "Sensation" },
    { title: "Virages & coulées", tag: "Bassin" },
  ];

  return (
    <section style={{ background: C.ink, padding: "clamp(56px,7vw,88px) 20px", overflow: "hidden" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1.1fr",
          gap: isMobile ? 36 : 48,
          alignItems: "center",
        }}>
          <FadeIn>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(142,179,255,0.15)", borderRadius: 100,
              padding: "5px 14px", marginBottom: 16,
            }}>
              <span style={{ color: C.accent, fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", fontFamily: FONT }}>INSTAGRAM × APP</span>
            </div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(32px, 4.5vw, 48px)", fontWeight: 800, color: C.white, margin: "0 0 14px", letterSpacing: "0", textTransform: "uppercase" }}>
              La technique sur IG.<br />Le plan dans l’app.
            </h2>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 16, lineHeight: 1.65, marginBottom: 24, fontFamily: FONT, maxWidth: 400 }}>
              Sur Instagram : sensations, éducatifs, tips. Dans MySWYM : ton programme structuré. Les deux se complètent — on ne remplace pas le coach, on prépare ta séance.
            </p>
            <a
              href="https://www.instagram.com/arthurnatation/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: C.accent, color: C.accentText, fontWeight: 700,
                fontSize: 15, fontFamily: FONT,
                padding: "13px 22px", borderRadius: 14, textDecoration: "none",
              }}
            >
              Voir @arthurnatation <ArrowRight size={16} />
            </a>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 12,
            }}>
              {previews.map((p, i) => (
                <a
                  key={i}
                  href="https://www.instagram.com/arthurnatation/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    textDecoration: "none",
                    aspectRatio: "4/5",
                    borderRadius: 20,
                    background: `linear-gradient(160deg, rgba(142,179,255,${0.22 + i * 0.06}) 0%, rgba(53,93,163,0.55) 55%, rgba(25,28,30,0.9) 100%)`,
                    border: "1px solid rgba(255,255,255,0.1)",
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    position: "relative",
                    overflow: "hidden",
                    transition: "transform 0.2s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                >
                  <div style={{
                    position: "absolute", top: "42%", left: "50%", transform: "translate(-50%, -50%)",
                    width: 44, height: 44, borderRadius: "50%",
                    background: "rgba(255,255,255,0.18)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    backdropFilter: "blur(6px)",
                  }}>
                    <Play size={18} color="#fff" fill="#fff" />
                  </div>
                  <div style={{ fontSize: 11, color: C.accent, fontWeight: 700, marginBottom: 4, fontFamily: FONT }}>{p.tag}</div>
                  <div style={{ fontSize: 14, color: C.white, fontWeight: 600, fontFamily: FONT, lineHeight: 1.3 }}>{p.title}</div>
                </a>
              ))}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

// ── Progress timeline ──────────────────────────────────────────────────────
function ProgressTimeline() {
  const isMobile = useIsMobile();
  const milestones = [
    { week: "Semaine 1",  title: "Tu reprends le fil",  desc: "Séances courtes, langage simple. Tu sors de l’eau en sachant exactement ce que tu as fait — et pourquoi." },
    { week: "Semaine 4",  title: "Le rythme s’installe",  desc: "Les longueurs coulent. Tu tiens plus longtemps, tu récupères mieux. La confiance monte." },
    { week: "Semaine 8",  title: "Tu montes d’un cran",     desc: "Les séances se densifient naturellement. Ton corps suit — le plan aussi." },
    { week: "Semaine 12+",title: "Tu arrives prêt",        desc: "Course, diplôme ou objectif perso : tu as fait le travail. Il reste à profiter." },
  ];
  return (
    <section style={{ background: C.bg, padding: "clamp(60px,8vw,100px) 20px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 48 }}>
          <SectionLabel text="TA PROGRESSION" />
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(32px, 4.5vw, 48px)", fontWeight: 800, color: C.ink, margin: 0, letterSpacing: "0", textTransform: "uppercase" }}>
            Un fil rouge,<br />semaine après semaine
          </h2>
        </FadeIn>

        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: isMobile ? 13 : 24, top: 0, bottom: 0, width: 2, background: `linear-gradient(to bottom, ${C.accent}, transparent)` }} />
          {milestones.map((m, i) => (
            <FadeIn key={i} delay={i * 0.15}>
              <div style={{ display: "flex", gap: isMobile ? 16 : 32, marginBottom: i < milestones.length - 1 ? (isMobile ? 28 : 40) : 0 }}>
                <div style={{ flexShrink: 0, width: isMobile ? 28 : 50, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", background: C.accent, border: `3px solid ${C.bg}`, boxShadow: `0 0 0 3px rgba(142,179,255,0.25)`, marginTop: 6 }} />
                </div>
                <div style={{ flex: 1, background: C.white, border: `1px solid ${C.border}`, borderRadius: 20, padding: 22, boxShadow: C.shadow }}>
                  <div style={{ fontSize: 12, color: C.primary, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 6, fontFamily: FONT }}>{m.week}</div>
                  <h3 style={{ fontFamily: FONT, fontSize: 17, fontWeight: 700, color: C.ink, margin: "0 0 8px" }}>{m.title}</h3>
                  <p style={{ color: C.inkLight, fontSize: 14, lineHeight: 1.65, margin: 0, fontFamily: FONT }}>{m.desc}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}


// ── Testimonials ───────────────────────────────────────────────────────────
function Testimonials() {
  return null;
}

// ── Comparison ─────────────────────────────────────────────────────────────
function Comparison() {
  const isMobile = useIsMobile();
  const rows = [
    { label: "Plan structuré semaine par semaine", alone: false, generic: "partial", myswym: true },
    { label: "Adapté à ton objectif",              alone: false, generic: false,     myswym: true },
    { label: "Séances lisibles, prêtes à nager",   alone: false, generic: "partial", myswym: true },
    { label: "Allures cibles (Premium)",           alone: false, generic: false,     myswym: true },
    { label: "Formats de séance variés",           alone: false, generic: "partial", myswym: true },
    { label: "Progression en phases",             alone: false, generic: "partial", myswym: true },
    { label: "Pont Instagram ↔ plan",              alone: false, generic: false,     myswym: true },
    { label: "Gratuit pour commencer",             alone: true,  generic: false,     myswym: true },
  ];
  const Cell = ({ val }) => {
    if (val === true)      return <Check  size={16} color="#00C48C" strokeWidth={2.5} />;
    if (val === false)     return <X      size={16} color="#FF3B30" strokeWidth={2.5} />;
    if (val === "partial") return <Minus  size={16} color="#F59E0B" strokeWidth={2.5} />;
  };
  const cols = isMobile
    ? [{ label: "Seul", sub: "sans plan", dim: true, key: "alone" }, { label: "MySWYM", sub: "coach perso", dim: false, key: "myswym" }]
    : [{ label: "Seul", sub: "sans plan", dim: true, key: "alone" }, { label: "Générique", sub: "plan standard", dim: true, key: "generic" }, { label: "MySWYM", sub: "coach perso", dim: false, key: "myswym" }];
  const colW = isMobile ? 80 : 110;
  const gridCols = `1fr repeat(${cols.length}, ${colW}px)`;

  return (
    <section style={{ background: C.bgSoft, padding: "clamp(60px,8vw,100px) 20px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 44 }}>
          <SectionLabel text="POURQUOI MYSWYM" />
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(32px, 4.5vw, 48px)", fontWeight: 800, color: C.ink, margin: 0, letterSpacing: "0", textTransform: "uppercase" }}>
            Un plan clair,<br />pas de l’improvisation
          </h2>
        </FadeIn>

        <FadeIn>
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 24, overflow: "hidden", boxShadow: C.shadow, minWidth: isMobile ? 300 : "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: gridCols, borderBottom: `1px solid ${C.border}` }}>
                <div style={{ padding: isMobile ? "14px" : "18px 24px" }} />
                {cols.map((c, i) => (
                  <div key={i} style={{
                    padding: isMobile ? "14px 8px" : "18px 12px", textAlign: "center",
                    background: !c.dim ? C.primaryFix : "transparent",
                    borderLeft: `1px solid ${C.border}`,
                    borderBottom: !c.dim ? `2px solid ${C.accent}` : "none",
                  }}>
                    <div style={{ fontFamily: FONT, fontSize: isMobile ? 12 : 14, fontWeight: 700, color: c.dim ? C.secondary : C.ink }}>{c.label}</div>
                    <div style={{ fontSize: 10, color: c.dim ? C.outline : C.primary, marginTop: 2, fontFamily: FONT }}>{c.sub}</div>
                  </div>
                ))}
              </div>
              {rows.map((r, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: gridCols,
                  borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : "none",
                  background: i % 2 === 0 ? "transparent" : C.bgCard,
                }}>
                  <div style={{ padding: isMobile ? "12px 14px" : "14px 24px", fontSize: isMobile ? 12 : 14, color: C.inkLight, display: "flex", alignItems: "center", lineHeight: 1.4, fontFamily: FONT }}>{r.label}</div>
                  {cols.map((c, j) => (
                    <div key={j} style={{
                      display: "flex", alignItems: "center", justifyContent: "center", padding: "12px 0",
                      background: !c.dim ? "rgba(142,179,255,0.06)" : "transparent",
                      borderLeft: `1px solid ${C.border}`,
                    }}>
                      <Cell val={r[c.key]} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ── Pace zones feature ─────────────────────────────────────────────────────
function PaceFeature() {
  const [time, setTime] = useState("1:45");
  const [secs, setSecs] = useState(105);
  const zones = [
    { label: "Facile",  zone: "Endurance", mult: 1.35, color: "#00C48C", desc: "Fond & récupération" },
    { label: "Soutenu", zone: "Seuil", mult: 1.08, color: "#F59E0B", desc: "Effort régulier" },
    { label: "Rapide",  zone: "Vitesse", mult: 0.95, color: "#FF3B30", desc: "Courtes accélérations" },
  ];
  const examples = ["0:55", "1:20", "1:45", "2:10", "2:45"];
  const toSecs = (str) => { const [m, s] = str.split(":").map(Number); return m * 60 + (s || 0); };
  const fmtSecs = (s) => `${Math.floor(s/60)}'${Math.round(s%60).toString().padStart(2,"0")}"`;

  return (
    <section style={{ background: C.bgSoft, padding: "clamp(60px,8vw,100px) 20px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 40, alignItems: "center" }}>
        <FadeIn>
          <SectionLabel text="OPTION PREMIUM" />
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: C.ink, margin: "0 0 16px", letterSpacing: "0", textTransform: "uppercase" }}>
            Les chronos,<br />si tu les veux
          </h2>
          <p style={{ color: C.inkLight, fontSize: 15, lineHeight: 1.7, marginBottom: 16, fontFamily: FONT }}>
            Le plan gratuit te dit quoi nager, clairement. Premium ajoute les allures cibles à la seconde — pour ceux qui aiment calibrer l’effort.
          </p>
          <p style={{ color: C.outline, fontSize: 13, lineHeight: 1.6, marginBottom: 8, fontFamily: FONT }}>
            Pas obligatoire. Pas intimidant. Juste là quand tu es prêt.
          </p>
        </FadeIn>

        <FadeIn delay={0.12}>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 28, padding: 28, boxShadow: C.shadowMd }}>
            <p style={{ fontSize: 11, color: C.secondary, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12, fontFamily: FONT }}>Mon meilleur 100m crawl</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {examples.map(ex => (
                <button key={ex} onClick={() => { setTime(ex); setSecs(toSecs(ex)); }} style={{
                  padding: "8px 14px", borderRadius: 12,
                  border: `1.5px solid ${time === ex ? C.accent : C.border}`,
                  background: time === ex ? C.primaryFix : C.bgCard,
                  color: time === ex ? C.primary : C.secondary,
                  fontFamily: FONT, fontSize: 14, fontWeight: 700,
                  cursor: "pointer", transition: "all 0.15s",
                }}>
                  {ex}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {zones.map((z, i) => {
                const pace = secs * z.mult;
                const pStr = fmtSecs(Math.round(pace));
                const barW = [80, 60, 45][i];
                return (
                  <div key={i} style={{ background: C.bgCard, borderRadius: 16, padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: FONT }}>{z.label}</span>
                        <span style={{ fontSize: 11, color: C.secondary, marginLeft: 6, fontFamily: FONT }}>{z.zone}</span>
                      </div>
                      <span style={{ fontFamily: FONT, fontSize: 16, fontWeight: 800, color: z.color }}>{pStr}/100m</span>
                    </div>
                    <div style={{ height: 3, background: C.outlineVar, borderRadius: 2 }}>
                      <div style={{ width: `${barW}%`, height: "100%", background: z.color, borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 11, color: C.secondary, marginTop: 5, fontFamily: FONT }}>{z.desc}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ background: C.primaryFix, borderRadius: 16, padding: "13px 16px" }}>
              <div style={{ fontSize: 10, color: C.primary, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 5, fontFamily: FONT }}>DANS UNE SÉANCE PREMIUM</div>
              <div style={{ fontSize: 13, color: C.inkLight, lineHeight: 1.6, fontFamily: FONT }}>
                {`8 × 200 m crawl — viser environ ${fmtSecs(Math.round(secs * 1.08))} / 100 m`}
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ── Pricing ────────────────────────────────────────────────────────────────
function Pricing() {
  const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const handlePremium = async (priceId) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      try {
        const ref = new URLSearchParams(window.location.search).get("ref");
        if (ref?.trim()) localStorage.setItem("myswym_ref", ref.trim().toUpperCase());
      } catch { /* ignore */ }
      window.location.href = "/inscription";
      return;
    }
    try {
      let referralCode;
      try {
        referralCode = (session.user?.user_metadata?.referred_by
          || localStorage.getItem("myswym_ref")
          || "").toUpperCase() || undefined;
      } catch { referralCode = undefined; }
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}`, "apikey": SUPABASE_ANON_KEY },
        body: JSON.stringify({ priceId, ...(referralCode ? { referralCode } : {}) }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      alert(data.error || "Impossible d'ouvrir le paiement. Réessaie.");
    } catch {
      alert("Impossible d'ouvrir le paiement. Réessaie.");
    }
  };

  // Doit matcher create-checkout ALLOWED_PRICE_IDS / App.jsx
  const PRICE_MONTHLY = "price_1TPjyPAS4mfgF2Twx3Zh4zrJ";
  const PRICE_ANNUAL  = "price_1TudyVAS4mfgF2TwHiSo3Vrg";

  const freeFeatures = [
    "Plan du premier mois (4 semaines)",
    "Tous les objectifs sportifs",
    "1 à 2 séances par semaine",
    "Séances détaillées avec cues",
  ];
  const premiumFeatures = [
    "Plusieurs projets en parallèle (triathlon + eau libre…)",
    "Plan complet jusqu'à 52 semaines",
    "Jusqu'à 4 séances par semaine",
    "Allures cibles par zone (à la seconde)",
    "Vidéos techniques Instagram",
    "Départs avec allure cible (D…)",
    "Progression avancée (seuil, vitesse)",
  ];

  return (
    <section id="pricing" style={{ background: C.bgSoft, padding: "clamp(60px,8vw,100px) 20px" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 52 }}>
          <SectionLabel text="TARIFS" />
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(32px, 4.5vw, 48px)", fontWeight: 800, color: C.ink, margin: "0 0 12px", letterSpacing: "0", textTransform: "uppercase" }}>
            4 semaines pour tester.<br />Premium quand tu veux.
          </h2>
          <p style={{ color: C.secondary, fontSize: 16, fontFamily: FONT }}>Annule à tout moment.</p>
        </FadeIn>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, alignItems: "start", paddingTop: 16 }}>
          {/* Free */}
          <FadeIn delay={0}>
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 28, padding: 32, boxShadow: C.shadow }}>
              <div style={{ fontFamily: FONT, fontSize: 22, fontWeight: 800, color: C.ink, marginBottom: 4 }}>Gratuit</div>
              <div style={{ fontSize: 38, fontFamily: FONT, fontWeight: 800, color: C.ink, margin: "14px 0 4px" }}>0€</div>
              <div style={{ color: C.secondary, fontSize: 13, marginBottom: 24, fontFamily: FONT }}>Pour toujours</div>
              <a href="/" style={{
                display: "block", textAlign: "center",
                border: `1.5px solid ${C.outlineVar}`, color: C.ink,
                background: C.bgCard, fontWeight: 600, fontSize: 15,
                padding: "13px", borderRadius: 16, textDecoration: "none",
                marginBottom: 24, fontFamily: FONT,
              }}
                onMouseEnter={e => { e.currentTarget.style.background = C.surfHigh; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.bgCard; }}
              >Commencer gratuitement</a>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {freeFeatures.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <Check size={15} color={C.outline} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ color: C.secondary, fontSize: 14, fontFamily: FONT }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Premium annual — highlighted */}
          <FadeIn delay={0.1}>
            <div style={{ background: C.ink, borderRadius: 28, padding: 28, position: "relative", boxShadow: "0 20px 60px rgba(25,28,30,0.18)" }}>
              <div style={{
                position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
                background: C.accent, color: C.accentText, fontSize: 11, fontWeight: 700,
                padding: "4px 16px", borderRadius: 100, letterSpacing: "0.06em", whiteSpace: "nowrap",
                fontFamily: FONT,
              }}>MEILLEURE OFFRE</div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ fontFamily: FONT, fontSize: 20, fontWeight: 800, color: C.white }}>Premium Annuel</div>
                <div style={{ background: "#22C55E", color: C.white, fontSize: 12, fontWeight: 800, padding: "4px 10px", borderRadius: 8, letterSpacing: "0.04em", fontFamily: FONT }}>−50%</div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 18, color: "rgba(255,255,255,0.3)", textDecoration: "line-through", fontWeight: 600, fontFamily: FONT }}>4,99€</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontFamily: FONT }}>/mois</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 44, fontFamily: FONT, fontWeight: 800, color: C.white, lineHeight: 1 }}>2,50€</span>
                <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, marginBottom: 6, fontFamily: FONT }}>/mois</span>
              </div>

              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.07)", borderRadius: 10, padding: "6px 12px", marginBottom: 20 }}>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: FONT }}>Facturé</span>
                <span style={{ color: C.white, fontSize: 13, fontWeight: 700, fontFamily: FONT }}>29,99€/an</span>
                <span style={{ color: "#22C55E", fontSize: 12, fontWeight: 700, fontFamily: FONT }}>· 6 mois offerts</span>
              </div>

              <button onClick={() => handlePremium(PRICE_ANNUAL)} style={{
                display: "block", width: "100%", textAlign: "center",
                background: C.accent, color: C.accentText, fontWeight: 700, fontSize: 16,
                padding: "15px", borderRadius: 16, border: "none", cursor: "pointer",
                marginBottom: 20, boxShadow: "0 6px 20px rgba(142,179,255,0.35)",
                letterSpacing: "0.02em", fontFamily: FONT,
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >Démarrer — 29,99€/an</button>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {premiumFeatures.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <Check size={15} color={C.accent} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontFamily: FONT }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Premium monthly */}
          <FadeIn delay={0.2}>
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 28, padding: 32, boxShadow: C.shadow }}>
              <div style={{ fontFamily: FONT, fontSize: 22, fontWeight: 800, color: C.ink, marginBottom: 4 }}>Premium</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, margin: "14px 0 4px" }}>
                <span style={{ fontSize: 38, fontFamily: FONT, fontWeight: 800, color: C.ink }}>4,99€</span>
                <span style={{ color: C.secondary, fontSize: 14, marginBottom: 8, fontFamily: FONT }}>/mois</span>
              </div>
              <div style={{ color: C.secondary, fontSize: 13, marginBottom: 24, fontFamily: FONT }}>Sans engagement</div>
              <button onClick={() => handlePremium(PRICE_MONTHLY)} style={{
                display: "block", width: "100%", textAlign: "center",
                background: C.bgCard, border: `1.5px solid ${C.outlineVar}`,
                color: C.ink, fontWeight: 600, fontSize: 15,
                padding: "13px", borderRadius: 16, cursor: "pointer",
                marginBottom: 24, fontFamily: FONT,
              }}
                onMouseEnter={e => e.currentTarget.style.background = C.surfHigh}
                onMouseLeave={e => e.currentTarget.style.background = C.bgCard}
              >Choisir le mensuel</button>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {premiumFeatures.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <Check size={15} color={C.outline} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ color: C.secondary, fontSize: 14, fontFamily: FONT }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

// ── FAQ ────────────────────────────────────────────────────────────────────
function FAQ() {
  const [open, setOpen] = useState(null);
  const items = [
    { q: "Je suis débutant total, MySWYM est fait pour moi ?",              a: "MySWYM est un générateur de séances pour gens qui savent déjà nager. Si tu reprends après une pause, le niveau débutant te donne un plan simple. Pour apprendre le geste de A à Z, le coaching en DM / Instagram reste plus adapté." },
    { q: "Je ne connais pas mon temps au 100m — est-ce un problème ?",      a: "Non. Le 100m sert uniquement à calibrer les allures cibles Premium. Sans lui, tu as quand même un plan structuré séance par séance. Tu pourras renseigner ton temps plus tard dans ton profil Premium." },
    { q: "Qu'est-ce qui est inclus dans la version gratuite ?",             a: "Le premier mois de ton plan complet (4 semaines), avec le détail de chaque séance. C'est suffisant pour voir si l'approche te correspond. Aucune carte bancaire requise." },
    { q: "Puis-je changer d'objectif en cours de plan ?",                   a: "Oui. Dans l'onglet Profil, tu peux redémarrer l'onboarding pour définir un nouvel objectif et régénérer un plan complet. Avec Premium, tu peux même avoir plusieurs plans actifs en parallèle." },
    { q: "Les séances fonctionnent en bassin 25m et 50m ?",                 a: "Oui. Tu choisis la longueur de ton bassin à l’onboarding. Distances et séries s’adaptent automatiquement." },
    { q: "L'abonnement est sans engagement ?",                              a: "Oui pour le mensuel. Tu peux annuler à tout moment depuis ton espace client et tu gardes l’accès jusqu’à la fin de la période payée. L’offre 2 ans est un engagement prépayé — clairement indiqué au checkout." },
  ];

  return (
    <section style={{ background: C.bg, padding: "clamp(60px,8vw,100px) 20px" }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 48 }}>
          <SectionLabel text="FAQ" />
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(32px, 4.5vw, 52px)", fontWeight: 800, color: C.ink, margin: 0, letterSpacing: "0", textTransform: "uppercase" }}>
            Questions fréquentes
          </h2>
        </FadeIn>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <FadeIn key={i} delay={i * 0.04}>
                <div style={{
                  background: isOpen ? C.bgSoft : C.white,
                  border: `1px solid ${isOpen ? C.accent + "60" : C.border}`,
                  borderRadius: 18, overflow: "hidden",
                  boxShadow: isOpen ? C.shadow : "none",
                  transition: "all 0.2s",
                }}>
                  <button onClick={() => setOpen(isOpen ? null : i)} style={{
                    width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "18px 22px", background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: 16,
                  }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: isOpen ? C.ink : C.inkLight, flex: 1, lineHeight: 1.4, fontFamily: FONT }}>{item.q}</span>
                    <div style={{
                      flexShrink: 0, width: 28, height: 28, borderRadius: "50%",
                      background: isOpen ? C.accent : C.bgCard,
                      border: `1px solid ${isOpen ? C.accent : C.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.25s, background 0.2s",
                    }}>
                      <ChevronDown size={15} color={isOpen ? C.accentText : C.secondary} />
                    </div>
                  </button>
                  {isOpen && (
                    <div style={{ padding: "0 22px 20px", fontSize: 14, color: C.inkLight, lineHeight: 1.75, fontFamily: FONT }}>
                      {item.a}
                    </div>
                  )}
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Final CTA ──────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section style={{ background: C.ink, padding: "clamp(60px,8vw,100px) 20px", textAlign: "center" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <FadeIn>
          <p style={{
            fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 16,
            color: C.accent, letterSpacing: "0.1em", textTransform: "uppercase",
            margin: "0 0 16px",
          }}>
            MySWYM
          </p>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(36px, 5.5vw, 54px)", fontWeight: 800, color: C.white, margin: "0 0 16px", letterSpacing: "0", textTransform: "uppercase" }}>
            Ton plan.<br />Clair. Prêt.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, lineHeight: 1.65, marginBottom: 28, fontFamily: FONT }}>
            Tu nages déjà. On structure le reste — 4 semaines offertes, sans carte.
          </p>
          <a href="/" style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: C.accent, color: C.accentText, fontWeight: 700, fontSize: 16,
            padding: "15px 32px", borderRadius: 16, textDecoration: "none",
            boxShadow: "0 10px 32px rgba(142,179,255,0.35)", fontFamily: FONT,
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(142,179,255,0.45)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 10px 32px rgba(142,179,255,0.35)"; }}
          >
            Créer mon plan — gratuit <ArrowRight size={18} />
          </a>
        </FadeIn>
      </div>
    </section>
  );
}


// ── Page ───────────────────────────────────────────────────────────────────
export default function Landing() {
  useEffect(() => {
    document.title = "MySWYM — Générateur de séances de natation";
    document.body.style.background = C.bg;
    document.body.style.fontFamily = FONT;

    const path = window.location.pathname;
    const sectionId = path === "/comment-ca-marche"
      ? "how"
      : path === "/objectifs"
        ? "goals"
      : path === "/conformite"
        ? "conformite"
        : null;
    if (sectionId) {
      requestAnimationFrame(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, []);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: FONT }}>
      <FontLoader />
      <PublicNav />
      <Hero />
      <Goals />
      <HowItWorks />
      <WeekExample />
      <InstagramBridge />
      <ProgressTimeline />
      <PaceFeature />
      <Comparison />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}
