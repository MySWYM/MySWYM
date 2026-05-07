import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase.js";
import {
  Waves, Activity, Award, Target, ChevronRight, Check, X, Minus,
  ArrowRight, Star, Zap, TrendingUp, Calendar, Timer,
  ChevronDown, RotateCcw, Menu,
} from "lucide-react";
import PublicNav from "./PublicNav.jsx";

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
    const fn = () => setMobile(window.innerWidth < bp);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
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
              <a href="/?auth=login" style={{ color: C.secondary, fontSize: 14, fontWeight: 500, textDecoration: "none", padding: "8px 12px", fontFamily: FONT }}>Se connecter</a>
            )}
            <a href="/" style={{
              background: C.accent, color: C.accentText,
              fontSize: isMobile ? 13 : 14, fontWeight: 700,
              padding: isMobile ? "9px 16px" : "10px 22px",
              borderRadius: 100, textDecoration: "none",
              fontFamily: FONT,
              boxShadow: "0 4px 16px rgba(142,179,255,0.35)",
            }}>Creer mon compte</a>

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
              <a href="/?auth=login" onClick={() => setMenuOpen(false)} style={{
                display: "block", textAlign: "center", padding: "13px", borderRadius: 16,
                border: `1.5px solid ${C.outlineVar}`, color: C.ink, fontSize: 15, fontWeight: 600,
                textDecoration: "none", background: C.bgCard, fontFamily: FONT,
              }}>Se connecter</a>
              <a href="/" onClick={() => setMenuOpen(false)} style={{
                display: "block", textAlign: "center", padding: "13px", borderRadius: 16,
                background: C.accent, color: C.accentText, fontSize: 15, fontWeight: 700,
                textDecoration: "none", boxShadow: "0 6px 20px rgba(142,179,255,0.35)", fontFamily: FONT,
              }}>Creer mon compte</a>
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
      background: `radial-gradient(circle at top left, ${C.bg} 0%, #eef2ff 100%)`,
      padding: isMobile ? "100px 20px 64px" : "120px 24px 80px",
      overflow: "hidden", position: "relative",
    }}>
      {/* Decorative blob */}
      <div style={{
        position: "absolute", top: -80, right: -80, width: 480, height: 480,
        background: `radial-gradient(circle, rgba(142,179,255,0.18) 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 480px", gap: isMobile ? 48 : 64, alignItems: "center", position: "relative" }}>
        {/* Left */}
        <div style={{ textAlign: isMobile ? "center" : "left" }}>
          {/* Social proof badge */}
          <div style={{ display: "flex", gap: 8, justifyContent: isMobile ? "center" : "flex-start", marginBottom: 20, flexWrap: "wrap" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: C.primaryFix, borderRadius: 100,
              padding: "5px 14px",
            }}>
              <Waves size={12} color={C.primary} />
              <span style={{ color: C.primary, fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", fontFamily: FONT }}>NATATION · TRIATHLON · BNSSA · EAU LIBRE</span>
            </div>
          </div>

          <h1 style={{
            fontFamily: FONT_DISPLAY, fontWeight: 800,
            fontSize: "clamp(42px, 6.5vw, 78px)",
            color: C.ink, lineHeight: 1.0,
            letterSpacing: "-0.01em",
            margin: "0 0 20px",
            textTransform: "uppercase",
          }}>
            Nage.<br />
            <span style={{ color: C.accent }}>On s'occupe<br />du reste.</span>
          </h1>

          <p style={{ color: C.inkLight, fontSize: "clamp(15px, 2vw, 17px)", lineHeight: 1.7, marginBottom: 36, maxWidth: isMobile ? "100%" : 480, fontFamily: FONT }}>
            Ton programme d'entraînement structuré semaine par semaine —
            adapté à ton niveau, ton objectif et ta dispo. Comme un vrai coach.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: isMobile ? "center" : "flex-start", flexWrap: "wrap", marginBottom: 20 }}>
            <a href="/" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: C.accent, color: C.accentText, fontWeight: 700,
              fontSize: isMobile ? 15 : 16, fontFamily: FONT,
              padding: isMobile ? "14px 22px" : "15px 30px",
              borderRadius: 100, textDecoration: "none",
              boxShadow: "0 8px 28px rgba(142,179,255,0.40)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(142,179,255,0.50)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(142,179,255,0.40)"; }}
            >
              Créer mon plan gratuitement <ArrowRight size={16} />
            </a>
          </div>
          <p style={{ color: C.outline, fontSize: 13, fontFamily: FONT }}>Gratuit · Aucune carte bancaire · 2 minutes</p>
        </div>

        {/* Right — App mockup */}
        <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
          <div style={{
            width: isMobile ? "min(300px, calc(100vw - 48px))" : "clamp(280px, 38vw, 320px)",
            background: C.ink, borderRadius: 44,
            border: "6px solid rgba(0,0,0,0.08)",
            padding: 12,
            boxShadow: `0 40px 100px rgba(142,179,255,0.20), 0 0 0 1px rgba(0,0,0,0.05)`,
          }}>
            <div style={{ background: C.white, borderRadius: 32, overflow: "hidden" }}>
              {/* Status bar */}
              <div style={{ background: "#0A1628", padding: "14px 20px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: 600, fontFamily: FONT }}>9:41</span>
                <div style={{ width: 70, height: 8, background: "rgba(255,255,255,0.15)", borderRadius: 5 }} />
              </div>
              {/* Header */}
              <div style={{ background: "#0A1628", padding: "8px 20px 20px" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginBottom: 4, letterSpacing: "0.08em", fontFamily: FONT }}>SEMAINE 4 · BASE</div>
                <div style={{ fontFamily: FONT, fontSize: 20, fontWeight: 800, color: C.white }}>Ton programme</div>
                <div style={{ marginTop: 12, height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
                  <div style={{ width: "55%", height: "100%", background: C.accent, borderRadius: 2 }} />
                </div>
              </div>
              {/* Session cards */}
              <div style={{ background: C.bg, padding: "14px 14px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { type: "ENDURANCE", title: "Nage à ton rythme", dist: "1 200m", color: C.primary, done: true },
                  { type: "VITESSE",   title: "Accélérations fun",  dist: "900m",  color: "#E65100",  done: false },
                  { type: "TECHNIQUE", title: "Glisse & respiration",dist: "800m", color: "#0097A7",  done: false },
                ].map((s, i) => (
                  <div key={i} style={{
                    background: s.done ? C.primaryFix : C.white,
                    border: `1px solid ${s.done ? "rgba(53,93,163,0.15)" : C.border}`,
                    borderRadius: 16, padding: "11px 13px",
                    display: "flex", alignItems: "center", gap: 10,
                    boxShadow: C.shadow,
                  }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: `${s.color}14`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {s.done ? <Check size={15} color={s.color} /> : <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 9, color: s.color, fontWeight: 700, letterSpacing: "0.07em", marginBottom: 2, fontFamily: FONT }}>{s.type}</div>
                      <div style={{ fontSize: 13, color: C.ink, fontWeight: 600, lineHeight: 1.2, fontFamily: FONT }}>{s.title}</div>
                    </div>
                    <div style={{ fontSize: 12, color: C.secondary, fontWeight: 600, fontFamily: FONT }}>{s.dist}</div>
                  </div>
                ))}
                {/* Bottom nav preview */}
                <div style={{ display: "flex", justifyContent: "space-around", paddingTop: 8, borderTop: `1px solid ${C.outlineVar}`, marginTop: 2 }}>
                  {["Accueil", "Programme", "Profil"].map((t, i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, background: i === 0 ? C.primaryFix : "transparent" }} />
                      <span style={{ fontSize: 9, color: i === 0 ? C.primary : C.outline, fontWeight: i === 0 ? 700 : 400, fontFamily: FONT }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Stats ──────────────────────────────────────────────────────────────────
function Stats() {
  const stats = [
    { value: 4,    suffix: "",  label: "Disciplines couvertes" },
    { value: 100,  suffix: "%", label: "Structuré comme un coach" },
  ];
  return (
    <section style={{ background: C.accent, padding: "52px 24px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }}>
        {stats.map((s, i) => (
          <FadeIn key={i} delay={i * 0.1} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: FONT, fontSize: "clamp(30px, 5vw, 48px)", fontWeight: 800, color: C.primaryDeep, letterSpacing: "-1px" }}>
              <AnimCounter to={s.value} suffix={s.suffix} />
            </div>
            <div style={{ color: C.accentText, fontSize: 13, marginTop: 4, fontFamily: FONT, fontWeight: 500 }}>{s.label}</div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

// ── How it works ───────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { n: "01", icon: Target,    title: "Ton niveau en 2 questions",    desc: "\"Est-ce que tu peux nager 20 min sans pause ?\" — on identifie ton niveau en quelques secondes. Pas de jargon, pas de chrono obligatoire." },
    { n: "02", icon: Calendar,  title: "Ton plan prêt en 30 secondes", desc: "Ton programme est construit automatiquement, semaine par semaine. Adapté à ta fréquence (1×, 2×, 3× par semaine) et à ton objectif." },
    { n: "03", icon: Waves,     title: "Tu sais exactement quoi faire",desc: "Chaque séance est détaillée : quoi nager, combien de temps reprendre son souffle, et une idée sur quoi se concentrer." },
    { n: "04", icon: TrendingUp,title: "Tu vois que tu progresses",    desc: "Séances cochées, distance parcourue, régularité — tu visualises tes progrès et tu restes motivé même les semaines difficiles." },
  ];
  return (
    <section id="how" style={{ background: C.bg, padding: "clamp(60px,8vw,100px) 20px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 56 }}>
          <SectionLabel text="COMMENT ÇA MARCHE" />
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(32px, 4.5vw, 52px)", fontWeight: 800, color: C.ink, margin: 0, letterSpacing: "0", textTransform: "uppercase" }}>
            Ton plan personnalisé<br />en 4 étapes
          </h2>
        </FadeIn>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
          {steps.map((s, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div style={{
                background: C.white, border: `1px solid ${C.border}`,
                borderRadius: 24, padding: 28, height: "100%", boxSizing: "border-box",
                boxShadow: C.shadow, transition: "box-shadow 0.3s, transform 0.3s",
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = C.shadowMd; e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = C.shadow; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                  <div style={{ width: 44, height: 44, background: C.primaryFix, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <s.icon size={20} color={C.primary} />
                  </div>
                  <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 800, color: C.accent, letterSpacing: "0.04em" }}>{s.n}</span>
                </div>
                <h3 style={{ fontFamily: FONT, fontSize: 17, fontWeight: 700, color: C.ink, margin: "0 0 10px" }}>{s.title}</h3>
                <p style={{ color: C.inkLight, fontSize: 14, lineHeight: 1.65, fontFamily: FONT }}>{s.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Week Example ──────────────────────────────────────────────────────────
function WeekExample() {
  const isMobile = useIsMobile();
  const [activeDay, setActiveDay] = useState(0);

  const sessions = [
    { day: "Debutant", type: "ENDURANCE", color: "#8eb3ff", title: "Nage a ton rythme",    total: "900m",   warmup: "200m tranquille — crawl ou dos, comme tu veux", main: "5× (2 longueurs nage + 30 sec de repos) — sans te presser", cool: "200m tres calme pour recuperer", tip: "L'objectif : finir sans etre epuise. Si tu dois allonger la pause, c'est normal." },
    { day: "Lundi",       type: "ENDURANCE", color: C.primary,  title: "Fond en séries",        total: "2 200m", warmup: "400m échauffement tranquille", main: "5×300m crawl allure confortable — 30 sec de repos entre chaque", cool: "400m retour au calme mixte", tip: "Respiration toutes les 3 bras. Pense à bien glisser après chaque coulée." },
    { day: "Mercredi",    type: "SEUIL",     color: "#E65100",  title: "Un peu plus vite",      total: "2 000m", warmup: "300m échauffement + 4×50m accélérations progressives", main: "8×100m crawl — effort soutenu mais régulier · 20 sec de repos", cool: "300m nage libre tranquille", tip: "Garde le même rythme du 1er au 8e. Si tu accélères au dernier, c'est que tu partais trop lentement." },
    { day: "Vendredi",    type: "TECHNIQUE", color: "#0097A7",  title: "Glisse & technique",    total: "1 800m", warmup: "200m libre + 4×25m avec palmes", main: "6×50m en pensant aux bras — 6×50m en pensant à la glisse", cool: "200m nage dos décontraction", tip: "Sur chaque longueur, choisis UN truc à améliorer. Pas tout à la fois." },
  ];

  const s = sessions[activeDay];

  return (
    <section id="conformite" style={{ background: C.bgSoft, padding: "clamp(60px,8vw,100px) 20px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 52 }}>
          <SectionLabel text="EXEMPLES DE SÉANCES" />
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(32px, 4.5vw, 52px)", fontWeight: 800, color: C.ink, margin: "0 0 14px", letterSpacing: "0", textTransform: "uppercase" }}>
            Que tu démarres ou que tu<br />vises la performance
          </h2>
          <p style={{ color: C.inkLight, fontSize: 16, maxWidth: 480, margin: "0 auto", fontFamily: FONT }}>
            Tu sais exactement quoi faire avant même d'entrer dans l'eau — du débutant au sportif confirmé.
          </p>
        </FadeIn>

        <FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "180px 1fr", gap: 16, alignItems: "start" }}>
            <div style={{ display: "flex", flexDirection: isMobile ? "row" : "column", gap: 8 }}>
              {sessions.map((sess, i) => (
                <button key={i} onClick={() => setActiveDay(i)} style={{
                  flex: isMobile ? 1 : "none",
                  padding: isMobile ? "10px 6px" : "14px 18px",
                  borderRadius: 18,
                  border: `1.5px solid ${activeDay === i ? sess.color : C.border}`,
                  background: activeDay === i ? `${sess.color}14` : C.white,
                  cursor: "pointer", textAlign: "center", transition: "all 0.15s",
                  boxShadow: activeDay === i ? `0 4px 16px ${sess.color}22` : C.shadow,
                  overflow: "hidden", minWidth: 0,
                }}>
                  <div style={{ fontSize: isMobile ? 11 : 14, fontWeight: 700, color: activeDay === i ? C.ink : C.secondary, fontFamily: FONT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sess.day}</div>
                  {!isMobile && <div style={{ fontSize: 11, color: activeDay === i ? sess.color : C.outline, fontWeight: 600, marginTop: 2, fontFamily: FONT }}>{sess.type}</div>}
                </button>
              ))}
            </div>

            <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 24, padding: isMobile ? 20 : 28, boxShadow: C.shadow }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
                <div style={{ background: `${s.color}14`, borderRadius: 12, padding: "7px 14px" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: s.color, letterSpacing: "0.07em", fontFamily: FONT }}>{s.type}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: C.ink }}>{s.title}</div>
                </div>
                <div style={{ background: C.bgSoft, borderRadius: 10, padding: "6px 12px" }}>
                  <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: C.ink }}>{s.total}</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {[
                  { label: "ÉCHAUFFEMENT",    content: s.warmup, color: "#34C759" },
                  { label: "CORPS DE SÉANCE", content: s.main,   color: s.color },
                  { label: "RETOUR AU CALME", content: s.cool,   color: C.outline },
                ].map((block, i) => (
                  <div key={i} style={{ background: C.bgCard, borderLeft: `3px solid ${block.color}`, borderRadius: "0 14px 14px 0", padding: "12px 16px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: block.color, letterSpacing: "0.08em", marginBottom: 4, fontFamily: FONT }}>{block.label}</div>
                    <div style={{ fontSize: 14, color: C.inkLight, lineHeight: 1.55, fontFamily: FONT }}>{block.content}</div>
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

// ── Goals ──────────────────────────────────────────────────────────────────
function Goals() {
  const goals = [
    { icon: Waves,     color: "#8eb3ff", bg: "rgba(142,179,255,0.12)", border: "rgba(142,179,255,0.2)",  title: "Je débute",  sub: "Reprendre · Apprendre · Progresser",  desc: "Tu t'arrêtes après quelques longueurs ou tu reprends après un arrêt ? C'est parfait — le plan commence là où tu en es." },
    { icon: Activity,  color: "#E65100", bg: "rgba(230,81,0,0.08)",    border: "rgba(230,81,0,0.15)",    title: "Triathlon",  sub: "Sprint · Olympique · Half · Ironman",  desc: "Plans structurés pour gérer l'effort en compétition — fond, intensité et gestion du rythme." },
    { icon: Award,     color: "#F59E0B", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.15)",  title: "Diplômes",   sub: "BNSSA · BPJEPS · Pompiers",            desc: "Apnée, remorquage, parcours spécifiques — prépare-toi exactement pour le jour J." },
    { icon: RotateCcw, color: "#00C48C", bg: "rgba(0,196,140,0.08)",   border: "rgba(0,196,140,0.15)",   title: "Progresser", sub: "Nager plus · Plus vite · Mieux",       desc: "Tu nages régulièrement et tu veux franchir un cap ? Plan structuré sans deadline de compétition." },
    { icon: Target,    color: "#7C3AED", bg: "rgba(124,58,237,0.08)",  border: "rgba(124,58,237,0.15)",  title: "Bien-être",  sub: "Remise en forme · Perte de poids",     desc: "Séances douces et progressives, à ton rythme. Nager pour se sentir bien, sans pression de chrono." },
  ];
  return (
    <section id="goals" style={{ background: C.bg, padding: "clamp(60px,8vw,100px) 20px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 52 }}>
          <SectionLabel text="POUR TOUT LE MONDE" />
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(32px, 4.5vw, 52px)", fontWeight: 800, color: C.ink, margin: 0, letterSpacing: "0", textTransform: "uppercase" }}>
            Reprendre la nage,<br />progresser ou compétir
          </h2>
        </FadeIn>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {goals.map((g, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <a href="/" style={{ textDecoration: "none", display: "block", height: "100%" }}>
                <div style={{
                  background: C.white, border: `1.5px solid ${g.border}`,
                  borderRadius: 24, padding: "24px 22px", height: "100%", boxSizing: "border-box",
                  boxShadow: C.shadow, transition: "box-shadow 0.25s, transform 0.25s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 12px 40px ${g.color}22`; e.currentTarget.style.transform = "translateY(-4px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = C.shadow; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <div style={{ width: 46, height: 46, background: g.bg, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                    <g.icon size={22} color={g.color} />
                  </div>
                  <h3 style={{ fontFamily: FONT, fontSize: 17, fontWeight: 700, color: C.ink, margin: "0 0 4px" }}>{g.title}</h3>
                  <div style={{ fontSize: 11, color: g.color, fontWeight: 700, marginBottom: 10, letterSpacing: "0.03em", fontFamily: FONT }}>{g.sub}</div>
                  <p style={{ color: C.inkLight, fontSize: 13, lineHeight: 1.65, margin: 0, fontFamily: FONT }}>{g.desc}</p>
                </div>
              </a>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Progress timeline ──────────────────────────────────────────────────────
function ProgressTimeline() {
  const isMobile = useIsMobile();
  const milestones = [
    { week: "Semaine 1",  title: "Tu reprends confiance",  desc: "Les premières séances sont courtes, faites pour que tu sortes de l'eau avec envie de revenir. Pas de chrono, pas de pression." },
    { week: "Semaine 4",  title: "Tu vois la différence",  desc: "Les longueurs coulent. Tu tiens plus longtemps, tu récupères plus vite. La confiance dans l'eau monte." },
    { week: "Semaine 8",  title: "Tu franchis un cap",     desc: "Les séances deviennent plus intenses — naturellement. Ton corps s'est adapté et est prêt pour aller plus loin." },
    { week: "Semaine 12+",title: "Tu arrives prêt",        desc: "Que ce soit la compétition, le diplôme ou juste l'objectif perso — tu as fait le travail. Il ne reste qu'à profiter." },
  ];
  return (
    <section style={{ background: C.bgSoft, padding: "clamp(60px,8vw,100px) 20px" }}>
      <div style={{ maxWidth: 840, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 56 }}>
          <SectionLabel text="TA PROGRESSION" />
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(32px, 4.5vw, 52px)", fontWeight: 800, color: C.ink, margin: 0, letterSpacing: "0", textTransform: "uppercase" }}>
            De "je m'essouffle"<br />à "je me sens bien dans l'eau"
          </h2>
        </FadeIn>

        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: isMobile ? 13 : 24, top: 0, bottom: 0, width: 2, background: `linear-gradient(to bottom, ${C.accent}, transparent)` }} />
          {milestones.map((m, i) => (
            <FadeIn key={i} delay={i * 0.15}>
              <div style={{ display: "flex", gap: isMobile ? 16 : 32, marginBottom: i < milestones.length - 1 ? (isMobile ? 28 : 40) : 0 }}>
                <div style={{ flexShrink: 0, width: isMobile ? 28 : 50, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", background: C.accent, border: `3px solid ${C.bgSoft}`, boxShadow: `0 0 0 3px rgba(142,179,255,0.25)`, marginTop: 6 }} />
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
    { label: "Adapté à ton niveau exact",          alone: false, generic: false,     myswym: true },
    { label: "Objectif sportif spécifique",        alone: false, generic: false,     myswym: true },
    { label: "Allures cibles personnalisées",      alone: false, generic: false,     myswym: true },
    { label: "Séances variées (5 formats/type)",   alone: false, generic: "partial", myswym: true },
    { label: "Progression en phases",             alone: false, generic: "partial", myswym: true },
    { label: "Éducatifs techniques intégrés",      alone: false, generic: false,     myswym: true },
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
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(32px, 4.5vw, 52px)", fontWeight: 800, color: C.ink, margin: 0, letterSpacing: "0", textTransform: "uppercase" }}>
            La différence que tu<br />ressentiras dans l'eau
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
    { label: "Facile",  zone: "Z1/Z2", mult: 1.35, color: "#00C48C", desc: "Endurance & récupération" },
    { label: "Seuil",   zone: "Z3/Z4", mult: 1.08, color: "#F59E0B", desc: "Effort soutenu · allure seuil" },
    { label: "Sprint",  zone: "Z5/Z6", mult: 0.95, color: "#FF3B30", desc: "Vitesse maximale" },
  ];
  const examples = ["0:55", "1:20", "1:45", "2:10", "2:45"];
  const toSecs = (str) => { const [m, s] = str.split(":").map(Number); return m * 60 + (s || 0); };
  const fmtSecs = (s) => `${Math.floor(s/60)}'${Math.round(s%60).toString().padStart(2,"0")}"`;

  return (
    <section style={{ background: C.bg, padding: "clamp(60px,8vw,100px) 20px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 48, alignItems: "center" }}>
        <FadeIn>
          <SectionLabel text="NIVEAU PERFORMANCE" />
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(32px, 4.5vw, 48px)", fontWeight: 800, color: C.ink, margin: "0 0 18px", letterSpacing: "0", textTransform: "uppercase" }}>
            Tes allures cibles,<br />calculées à la seconde
          </h2>
          <p style={{ color: C.inkLight, fontSize: 15, lineHeight: 1.7, marginBottom: 20, fontFamily: FONT }}>
            Tu entres ton meilleur 100m crawl. On calcule automatiquement tes 3 zones d'intensité — chaque séance affiche l'allure exacte à viser.
          </p>
          <p style={{ color: C.inkLight, fontSize: 15, lineHeight: 1.7, marginBottom: 8, fontFamily: FONT }}>
            Plus de "nage à allure confortable" vague. Tu sais exactement si tu es en endurance ou à ton seuil.
          </p>
          <p style={{ color: C.outline, fontSize: 13, lineHeight: 1.6, marginBottom: 24, fontFamily: FONT }}>
            Cette fonctionnalite est disponible pour le niveau <strong style={{ color: C.ink }}>Performance</strong>. Les autres niveaux ont des plans tout aussi structures — sans avoir besoin de chrono.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["Endurance", "Effort soutenu", "Vitesse", "Sprint"].map((t, i) => (
              <span key={i} style={{ background: C.primaryFix, color: C.primary, fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 100, fontFamily: FONT }}>{t}</span>
            ))}
          </div>
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
              <div style={{ fontSize: 10, color: C.primary, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 5, fontFamily: FONT }}>APERÇU DANS TES SÉANCES</div>
              <div style={{ fontSize: 12, color: C.inkLight, lineHeight: 1.7, fontFamily: "monospace", wordBreak: "break-all" }}>
                {`8×200m crawl — repos ${fmtSecs(Math.round(Math.ceil((200 * secs * 1.08 / 100 + 15) / 5) * 5))} ≈ ${fmtSecs(Math.round(secs * 1.08))}/100m`}
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
    if (!session) { window.location.href = "/app"; return; }
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}`, "apikey": SUPABASE_ANON_KEY },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch { window.location.href = "/app"; }
  };

  const PRICE_MONTHLY = "price_1TPjyPAS4mfgF2Twx3Zh4zrJ";
  const PRICE_ANNUAL  = "price_1TPjyeAS4mfgF2TwmSjSiidD";

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
    "Toutes les variantes de séances",
    "Progression avancée (seuil, vitesse)",
    "Séances spécialisées BNSSA / eau libre",
    "Accès à vie aux mises à jour",
  ];

  return (
    <section id="pricing" style={{ background: C.bgSoft, padding: "clamp(60px,8vw,100px) 20px" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 52 }}>
          <SectionLabel text="TARIFS" />
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(32px, 4.5vw, 52px)", fontWeight: 800, color: C.ink, margin: "0 0 12px", letterSpacing: "0", textTransform: "uppercase" }}>
            Commence gratuitement.<br />Passe premium quand tu veux.
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
                <div style={{ background: "#22C55E", color: C.white, fontSize: 12, fontWeight: 800, padding: "4px 10px", borderRadius: 8, letterSpacing: "0.04em", fontFamily: FONT }}>−33%</div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 18, color: "rgba(255,255,255,0.3)", textDecoration: "line-through", fontWeight: 600, fontFamily: FONT }}>4,99€</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontFamily: FONT }}>/mois</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 44, fontFamily: FONT, fontWeight: 800, color: C.white, lineHeight: 1 }}>3,33€</span>
                <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, marginBottom: 6, fontFamily: FONT }}>/mois</span>
              </div>

              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.07)", borderRadius: 10, padding: "6px 12px", marginBottom: 20 }}>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: FONT }}>Facturé</span>
                <span style={{ color: C.white, fontSize: 13, fontWeight: 700, fontFamily: FONT }}>40€/an</span>
                <span style={{ color: "#22C55E", fontSize: 12, fontWeight: 700, fontFamily: FONT }}>· 1 mois offert</span>
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
              >Démarrer — 40€/an</button>
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
    { q: "Je suis débutant total, MySWYM est fait pour moi ?",              a: "Oui. Le niveau \"débutant\" est conçu pour les gens qui reprennent après des années d'arrêt. Les premières séances travaillent la position dans l'eau avant tout. On progresse à ton rythme." },
    { q: "Je ne connais pas mon temps au 100m — est-ce un problème ?",      a: "Pas du tout. Le temps au 100m est optionnel. Si tu le passes, l'app calcule des allures précises. Sinon, elle utilise des allures adaptées à ton niveau déclaré. Le plan reste 100% utilisable." },
    { q: "Qu'est-ce qui est inclus dans la version gratuite ?",             a: "Le premier mois de ton plan complet (4 semaines), avec le détail de chaque séance. C'est suffisant pour voir si l'approche te correspond. Aucune carte bancaire requise." },
    { q: "Puis-je changer d'objectif en cours de plan ?",                   a: "Oui. Dans l'onglet Profil, tu peux redémarrer l'onboarding pour définir un nouvel objectif et régénérer un plan complet. Avec Premium, tu peux même avoir plusieurs plans actifs en parallèle." },
    { q: "Les séances fonctionnent en bassin 25m et 50m ?",                 a: "Oui. Lors de l'onboarding tu choisis la longueur de ton bassin. Toutes les distances, séries et temps de départ sont automatiquement calculés pour s'adapter." },
    { q: "L'abonnement est sans engagement ?",                              a: "Oui. Tu peux annuler à tout moment depuis ton espace client. Si tu annules, tu gardes l'accès Premium jusqu'à la fin de la période payée." },
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
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <FadeIn>
          <div style={{ width: 60, height: 60, background: C.accent + "18", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <Waves size={28} color={C.accent} />
          </div>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(36px, 5.5vw, 58px)", fontWeight: 800, color: C.white, margin: "0 0 16px", letterSpacing: "0", textTransform: "uppercase" }}>
            Ton coach dans ta poche.<br />Gratuit pour commencer.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 17, lineHeight: 1.6, marginBottom: 32, fontFamily: FONT }}>
            Tu nages, on structure tout le reste. Lance ton programme en 2 minutes.
          </p>
          <a href="/" style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: C.accent, color: C.accentText, fontWeight: 700, fontSize: 17,
            padding: "16px 36px", borderRadius: 100, textDecoration: "none",
            boxShadow: "0 10px 32px rgba(142,179,255,0.35)", fontFamily: FONT,
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(142,179,255,0.45)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 10px 32px rgba(142,179,255,0.35)"; }}
          >
            Créer mon plan maintenant <ArrowRight size={18} />
          </a>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, marginTop: 12, fontFamily: FONT }}>Gratuit · 2 minutes · Sans carte bancaire</p>
        </FadeIn>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────
function Footer() {
  const isMobile = useIsMobile();
  return (
    <footer id="contact" style={{ background: C.ink, borderTop: "1px solid rgba(255,255,255,0.06)", padding: isMobile ? "32px 20px" : "36px 24px" }}>
      <div style={{
        maxWidth: 1080, margin: "0 auto",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        flexWrap: "wrap",
        justifyContent: isMobile ? "center" : "space-between",
        alignItems: "center",
        gap: isMobile ? 20 : 16,
        textAlign: isMobile ? "center" : "left",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 16, color: C.white, letterSpacing: "0.06em", textTransform: "uppercase" }}>MySwym</span>
        </div>
        <div style={{ display: "flex", gap: isMobile ? 18 : 30, flexWrap: "wrap", justifyContent: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: isMobile ? "center" : "flex-start", gap: 8 }}>
            <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: FONT }}>
              Explorer
            </span>
            {[["Comment ca marche", "/comment-ca-marche"], ["Objectifs", "/objectifs"], ["Tarifs", "/tarifs"], ["Blog", "/blog"], ["Contact", "/contact"]].map(([l, h]) => (
              <a key={l} href={h} style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textDecoration: "none", transition: "color 0.2s", fontFamily: FONT }}
                onMouseEnter={e => e.target.style.color = C.white}
                onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.4)"}
              >{l}</a>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: isMobile ? "center" : "flex-start", gap: 8 }}>
            <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: FONT }}>
              Legal
            </span>
            {[["Mentions legales", "/mentions-legales"], ["Politique de confidentialite", "/politique-confidentialite"], ["Politique de cookies", "/politique-cookies"], ["CGU", "/cgu"], ["CGV", "/cgv"]].map(([l, h]) => (
              <a key={l} href={h} style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textDecoration: "none", transition: "color 0.2s", fontFamily: FONT }}
                onMouseEnter={e => e.target.style.color = C.white}
                onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.4)"}
              >{l}</a>
            ))}
          </div>
        </div>
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, fontFamily: FONT }}>© 2025 MySWYM. Tous droits réservés.</div>
      </div>
    </footer>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function Landing() {
  useEffect(() => {
    document.title = "MySWYM — Ton coach natation personnalisé";
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

      <HowItWorks />
      <WeekExample />
      <Goals />
      <PaceFeature />
      <ProgressTimeline />
      <Testimonials />
      <Comparison />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}
