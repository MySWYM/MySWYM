import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase.js";
import {
  Waves, Activity, Award, Target, ChevronRight, Check, X, Minus,
  ArrowRight, Star, Zap, TrendingUp, Calendar, Timer,
  ChevronDown, Shield, RotateCcw, Menu,
} from "lucide-react";

// ── Design tokens — thème clair (Kiprun-inspired) ─────────────────────────
const C = {
  bg:         "#FFFFFF",
  bgSoft:     "#F0F5FF",
  bgCard:     "#F9FAFB",
  ink:        "#0A1628",
  inkLight:   "#374151",
  blue:       "#0057FF",
  blueLight:  "#EEF4FF",
  blueMid:    "#3B82F6",
  white:      "#FFFFFF",
  grey:       "#6B7280",
  greyMid:    "#9CA3AF",
  greyLight:  "#E5E7EB",
  greyXLight: "#F9FAFB",
  border:     "rgba(0,0,0,0.08)",
  borderMid:  "rgba(0,0,0,0.14)",
  shadow:     "0 2px 12px rgba(0,0,0,0.07)",
  shadowMd:   "0 8px 32px rgba(0,0,0,0.10)",
  shadowLg:   "0 20px 60px rgba(0,0,0,0.12)",
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

// ── Label section ──────────────────────────────────────────────────────────
function SectionLabel({ text }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: C.blueLight, borderRadius: 100,
      padding: "5px 14px", marginBottom: 16,
    }}>
      <span style={{ color: C.blue, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em" }}>{text}</span>
    </div>
  );
}

// ── Nav ────────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  ["Comment ça marche", "#how"],
  ["Objectifs",         "#goals"],
  ["Blog",              "/blog"],
  ["Tarifs",            "#pricing"],
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

  // Close drawer when user starts scrolling
  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener("scroll", close, { passive: true });
    return () => window.removeEventListener("scroll", close);
  }, [menuOpen]);

  // Lock body scroll when drawer is open on mobile
  useEffect(() => {
    document.body.style.overflow = (isMobile && menuOpen) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobile, menuOpen]);

  const navBg = (scrolled || menuOpen)
    ? "rgba(255,255,255,0.97)"
    : "rgba(255,255,255,0.0)";

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        background: navBg,
        backdropFilter: (scrolled || menuOpen) ? "blur(16px)" : "none",
        borderBottom: (scrolled || menuOpen) ? `1px solid ${C.border}` : "none",
        boxShadow: scrolled ? "0 1px 16px rgba(0,0,0,0.06)" : "none",
        transition: "background 0.3s, box-shadow 0.3s",
      }}>
        <div style={{
          maxWidth: 1120, margin: "0 auto",
          padding: "0 20px", height: 60,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* Logo */}
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: C.blue, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Waves size={18} color={C.white} />
            </div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: C.ink, letterSpacing: "-0.5px" }}>MySWYM</span>
          </a>

          {/* Desktop links */}
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
              {NAV_LINKS.map(([l, h]) => (
                <a key={h} href={h}
                  style={{ color: C.grey, fontSize: 14, fontWeight: 500, textDecoration: "none", transition: "color 0.2s" }}
                  onMouseEnter={e => e.target.style.color = C.ink}
                  onMouseLeave={e => e.target.style.color = C.grey}
                >{l}</a>
              ))}
            </div>
          )}

          {/* Right-side actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {!isMobile && (
              <a href="/app" style={{ color: C.grey, fontSize: 14, fontWeight: 500, textDecoration: "none", padding: "8px 12px" }}>Connexion</a>
            )}
            <a href="/app" style={{
              background: C.blue, color: C.white,
              fontSize: isMobile ? 13 : 14, fontWeight: 600,
              padding: isMobile ? "9px 16px" : "9px 20px",
              borderRadius: 10, textDecoration: "none",
              boxShadow: "0 4px 14px rgba(0,87,255,0.3)",
            }}>Commencer</a>

            {/* Hamburger — mobile only */}
            {isMobile && (
              <button
                onClick={() => setMenuOpen(o => !o)}
                aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "8px 4px", marginLeft: 4,
                  color: C.ink,
                }}
              >
                {menuOpen ? <X size={22} color={C.ink} /> : <Menu size={22} color={C.ink} />}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Mobile drawer ──────────────────────────────────────────────── */}
      {isMobile && (
        <div style={{
          position: "fixed", top: 60, left: 0, right: 0, bottom: 0,
          zIndex: 199,
          pointerEvents: menuOpen ? "all" : "none",
        }}>
          {/* Backdrop */}
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: "absolute", inset: 0,
              background: "rgba(10,22,40,0.32)",
              opacity: menuOpen ? 1 : 0,
              transition: "opacity 0.25s",
            }}
          />

          {/* Panel */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            background: C.white,
            borderBottom: `1px solid ${C.border}`,
            boxShadow: menuOpen ? "0 12px 40px rgba(0,0,0,0.14)" : "none",
            padding: "8px 0 24px",
            transform: menuOpen ? "translateY(0)" : "translateY(-100%)",
            visibility: menuOpen ? "visible" : "hidden",
            transition: menuOpen
              ? "transform 0.28s cubic-bezier(0.4,0,0.2,1), visibility 0s 0s"
              : "transform 0.28s cubic-bezier(0.4,0,0.2,1), visibility 0s 0.28s",
          }}>
            {NAV_LINKS.map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "16px 24px",
                  color: C.ink, fontSize: 16, fontWeight: 600,
                  textDecoration: "none",
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                {label}
                <ChevronRight size={16} color={C.greyMid} />
              </a>
            ))}
            {/* Connexion + CTA */}
            <div style={{ padding: "20px 24px 0", display: "flex", flexDirection: "column", gap: 10 }}>
              <a href="/app" onClick={() => setMenuOpen(false)} style={{
                display: "block", textAlign: "center",
                padding: "13px", borderRadius: 12,
                border: `1.5px solid ${C.greyLight}`,
                color: C.ink, fontSize: 15, fontWeight: 600,
                textDecoration: "none", background: C.bgCard,
              }}>Connexion</a>
              <a href="/app" onClick={() => setMenuOpen(false)} style={{
                display: "block", textAlign: "center",
                padding: "13px", borderRadius: 12,
                background: C.blue, color: C.white,
                fontSize: 15, fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 6px 20px rgba(0,87,255,0.30)",
              }}>Créer mon plan gratuitement</a>
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
      background: C.bg,
      padding: isMobile ? "100px 20px 60px" : "120px 24px 80px",
      overflow: "hidden", position: "relative",
    }}>
      {/* Subtle water wave pattern en background */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 120,
        background: "linear-gradient(to bottom, transparent, #EEF4FF)",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 480px", gap: isMobile ? 48 : 64, alignItems: "center", position: "relative" }}>
        {/* Left */}
        <div style={{ textAlign: isMobile ? "center" : "left" }}>
          {/* Badge disciplines */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: C.blueLight, borderRadius: 100,
            padding: "5px 14px", marginBottom: 24,
          }}>
            <Waves size={12} color={C.blue} />
            <span style={{ color: C.blue, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em" }}>NATATION · TRIATHLON · BNSSA · EAU LIBRE</span>
          </div>

          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800,
            fontSize: "clamp(38px, 6vw, 72px)",
            color: C.ink, lineHeight: 1.08,
            letterSpacing: isMobile ? "-0.5px" : "-2px",
            margin: "0 0 20px",
          }}>
            Nage.<br />
            <span style={{ color: C.blue }}>On s'occupe<br />du reste.</span>
          </h1>

          <p style={{ color: C.grey, fontSize: "clamp(16px, 2vw, 18px)", lineHeight: 1.65, marginBottom: 36, maxWidth: isMobile ? "100%" : 480 }}>
            Ton programme d'entraînement structuré semaine par semaine —
            adapté à ton niveau, ton objectif et ta dispo. Comme un vrai coach.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: isMobile ? "center" : "flex-start", flexWrap: "wrap", marginBottom: 20 }}>
            <a href="/app" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: C.blue, color: C.white, fontWeight: 700,
              fontSize: isMobile ? 15 : 16,
              padding: isMobile ? "13px 22px" : "14px 28px",
              borderRadius: 14, textDecoration: "none",
              boxShadow: "0 8px 24px rgba(0,87,255,0.30)",
              transition: "transform 0.2s, box-shadow 0.2s",
              maxWidth: "100%", boxSizing: "border-box",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,87,255,0.38)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,87,255,0.30)"; }}
            >
              Créer mon plan gratuitement <ArrowRight size={16} />
            </a>
          </div>
          <p style={{ color: C.greyMid, fontSize: 13 }}>Gratuit · Aucune carte bancaire · 2 minutes</p>
        </div>

        {/* Right — App mockup (thème clair comme l'app réelle) */}
        <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
          <div style={{
            width: isMobile ? "min(300px, calc(100vw - 48px))" : "clamp(280px, 38vw, 320px)",
            background: "#F0F4F8", borderRadius: 44,
            border: "6px solid rgba(0,0,0,0.08)",
            padding: 12,
            boxShadow: "0 40px 100px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.05)",
          }}>
            <div style={{ background: C.white, borderRadius: 32, overflow: "hidden" }}>
              {/* Status bar */}
              <div style={{ background: "#0A1628", padding: "14px 20px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>9:41</span>
                <div style={{ width: 70, height: 8, background: "rgba(255,255,255,0.15)", borderRadius: 5 }} />
              </div>
              {/* Header zone */}
              <div style={{ background: "#0A1628", padding: "8px 20px 20px" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginBottom: 4, letterSpacing: "0.08em" }}>SEMAINE 4 · BASE</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: C.white }}>Ton programme</div>
                <div style={{ marginTop: 12, height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
                  <div style={{ width: "55%", height: "100%", background: "#0057FF", borderRadius: 2 }} />
                </div>
              </div>
              {/* Session cards */}
              <div style={{ background: "#F0F4F8", padding: "14px 14px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { type: "ENDURANCE", title: "Nage à ton rythme", dist: "1 200m", color: "#0057FF", done: true },
                  { type: "VITESSE", title: "Accélérations fun", dist: "900m", color: "#E65100", done: false },
                  { type: "TECHNIQUE", title: "Glisse & respiration", dist: "800m", color: "#0097A7", done: false },
                ].map((s, i) => (
                  <div key={i} style={{
                    background: s.done ? "#EEF4FF" : C.white,
                    border: `1px solid ${s.done ? "rgba(0,87,255,0.15)" : "rgba(0,0,0,0.07)"}`,
                    borderRadius: 14, padding: "11px 13px",
                    display: "flex", alignItems: "center", gap: 10,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                  }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: `${s.color}14`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {s.done
                        ? <Check size={15} color={s.color} />
                        : <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 9, color: s.color, fontWeight: 700, letterSpacing: "0.07em", marginBottom: 2 }}>{s.type}</div>
                      <div style={{ fontSize: 13, color: C.ink, fontWeight: 600, lineHeight: 1.2 }}>{s.title}</div>
                    </div>
                    <div style={{ fontSize: 12, color: C.grey, fontWeight: 600 }}>{s.dist}</div>
                  </div>
                ))}
                {/* Bottom bar nav preview */}
                <div style={{ display: "flex", justifyContent: "space-around", paddingTop: 8, borderTop: `1px solid ${C.greyLight}`, marginTop: 2 }}>
                  {["Accueil", "Programme", "Profil"].map((t, i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, background: i === 0 ? "#EEF4FF" : "transparent" }} />
                      <span style={{ fontSize: 9, color: i === 0 ? C.blue : C.greyMid, fontWeight: i === 0 ? 700 : 400 }}>{t}</span>
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
    { value: 1200, suffix: "+", label: "Nageurs accompagnés" },
    { value: 4,    suffix: "",  label: "Disciplines couvertes" },
    { value: 100,  suffix: "%", label: "Structuré comme un coach" },
  ];
  return (
    <section style={{ background: C.bgSoft, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: "52px 24px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
        {stats.map((s, i) => (
          <FadeIn key={i} delay={i * 0.1} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, color: C.blue, letterSpacing: "-1px" }}>
              <AnimCounter to={s.value} suffix={s.suffix} />
            </div>
            <div style={{ color: C.grey, fontSize: 14, marginTop: 4 }}>{s.label}</div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

// ── How it works ───────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { n: "01", icon: Target, title: "Ton niveau en 2 questions", desc: "\"Est-ce que tu peux nager 20 min sans pause ?\" — on identifie ton niveau en quelques secondes. Pas de jargon, pas de chrono obligatoire." },
    { n: "02", icon: Calendar, title: "Ton plan prêt en 30 secondes", desc: "Ton programme est construit automatiquement, semaine par semaine. Adapté à ta fréquence (1×, 2×, 3× par semaine) et à ton objectif." },
    { n: "03", icon: Waves, title: "Tu sais exactement quoi faire", desc: "Chaque séance est détaillée : quoi nager, combien de temps reprendre son souffle, et une idée sur quoi se concentrer." },
    { n: "04", icon: TrendingUp, title: "Tu vois que tu progresses", desc: "Séances cochées, distance parcourue, régularité — tu visualises tes progrès et tu restes motivé même les semaines difficiles." },
  ];
  return (
    <section id="how" style={{ background: C.bg, padding: "clamp(60px,8vw,100px) 20px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 56 }}>
          <SectionLabel text="COMMENT ÇA MARCHE" />
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: C.ink, margin: 0, letterSpacing: "-1px" }}>
            Ton plan personnalisé<br />en 4 étapes
          </h2>
        </FadeIn>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
          {steps.map((s, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div style={{
                background: C.white, border: `1px solid ${C.border}`,
                borderRadius: 20, padding: 28, height: "100%", boxSizing: "border-box",
                boxShadow: C.shadow,
                transition: "box-shadow 0.3s, transform 0.3s",
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = C.shadowMd; e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = C.shadow; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                  <div style={{ width: 44, height: 44, background: C.blueLight, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <s.icon size={20} color={C.blue} />
                  </div>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 800, color: C.blue, opacity: 0.5, letterSpacing: "0.04em" }}>{s.n}</span>
                </div>
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 800, color: C.ink, margin: "0 0 10px" }}>{s.title}</h3>
                <p style={{ color: C.grey, fontSize: 14, lineHeight: 1.65 }}>{s.desc}</p>
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
    {
      day: "🌊 Débutant",
      type: "ENDURANCE",
      color: "#00B4D8",
      title: "Nage à ton rythme",
      total: "900m",
      warmup: "200m tranquille — crawl ou dos, comme tu veux",
      main: "5× (2 longueurs nage + 30 sec de repos) — sans te presser",
      cool: "200m très calme pour récupérer",
      tip: "L'objectif : finir sans être épuisé. Si tu dois allonger la pause, c'est normal.",
    },
    {
      day: "Lundi",
      type: "ENDURANCE",
      color: "#0057FF",
      title: "Fond en séries",
      total: "2 200m",
      warmup: "400m échauffement tranquille",
      main: "5×300m crawl allure confortable — 30 sec de repos entre chaque",
      cool: "400m retour au calme mixte",
      tip: "Respiration toutes les 3 bras. Pense à bien glisser après chaque coulée.",
    },
    {
      day: "Mercredi",
      type: "SEUIL",
      color: "#E65100",
      title: "Un peu plus vite",
      total: "2 000m",
      warmup: "300m échauffement + 4×50m accélérations progressives",
      main: "8×100m crawl — effort soutenu mais régulier · 20 sec de repos",
      cool: "300m nage libre tranquille",
      tip: "Garde le même rythme du 1er au 8e. Si tu accélères au dernier, c'est que tu partais trop lentement.",
    },
    {
      day: "Vendredi",
      type: "TECHNIQUE",
      color: "#0097A7",
      title: "Glisse & technique",
      total: "1 800m",
      warmup: "200m libre + 4×25m avec palmes",
      main: "6×50m en pensant aux bras — 6×50m en pensant à la glisse",
      cool: "200m nage dos décontraction",
      tip: "Sur chaque longueur, choisis UN truc à améliorer. Pas tout à la fois.",
    },
  ];

  const s = sessions[activeDay];

  return (
    <section style={{ background: C.bgSoft, padding: "clamp(60px,8vw,100px) 20px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 52 }}>
          <SectionLabel text="EXEMPLES DE SÉANCES" />
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: C.ink, margin: "0 0 14px", letterSpacing: "-1px" }}>
            Que tu démarres ou que tu<br />vises la performance
          </h2>
          <p style={{ color: C.grey, fontSize: 16, maxWidth: 480, margin: "0 auto" }}>
            Tu sais exactement quoi faire avant même d'entrer dans l'eau — du débutant au sportif confirmé.
          </p>
        </FadeIn>

        <FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "180px 1fr", gap: 16, alignItems: "start" }}>
            {/* Day selector */}
            <div style={{ display: "flex", flexDirection: isMobile ? "row" : "column", gap: 8 }}>
              {sessions.map((sess, i) => (
                <button key={i} onClick={() => setActiveDay(i)} style={{
                  flex: isMobile ? 1 : "none",
                  padding: isMobile ? "10px 6px" : "14px 18px",
                  borderRadius: 14,
                  border: `1.5px solid ${activeDay === i ? sess.color : C.border}`,
                  background: activeDay === i ? `${sess.color}0D` : C.white,
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.15s",
                  boxShadow: activeDay === i ? `0 4px 14px ${sess.color}20` : C.shadow,
                  overflow: "hidden",
                  minWidth: 0,
                }}>
                  <div style={{
                    fontSize: isMobile ? 11 : 14, fontWeight: 800,
                    color: activeDay === i ? C.ink : C.grey,
                    fontFamily: "'Syne', sans-serif",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>{sess.day}</div>
                  {!isMobile && <div style={{ fontSize: 11, color: activeDay === i ? sess.color : C.greyMid, fontWeight: 600, marginTop: 2 }}>{sess.type}</div>}
                </button>
              ))}
            </div>

            {/* Session detail */}
            <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 20, padding: isMobile ? 20 : 28, boxShadow: C.shadow }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
                <div style={{ background: `${s.color}10`, borderRadius: 12, padding: "7px 14px" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: s.color, letterSpacing: "0.07em" }}>{s.type}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: C.ink }}>{s.title}</div>
                </div>
                <div style={{ background: C.bgSoft, borderRadius: 10, padding: "6px 12px" }}>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 800, color: C.ink }}>{s.total}</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {[
                  { label: "ÉCHAUFFEMENT", content: s.warmup, color: "#34C759" },
                  { label: "CORPS DE SÉANCE", content: s.main, color: s.color },
                  { label: "RETOUR AU CALME", content: s.cool, color: C.greyMid },
                ].map((block, i) => (
                  <div key={i} style={{ background: C.bgCard, borderLeft: `3px solid ${block.color}`, borderRadius: "0 12px 12px 0", padding: "12px 16px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: block.color, letterSpacing: "0.08em", marginBottom: 4 }}>{block.label}</div>
                    <div style={{ fontSize: 14, color: C.inkLight, lineHeight: 1.5 }}>{block.content}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: C.blueLight, borderRadius: 12, padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <Zap size={14} color={C.blue} style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 13, color: C.inkLight, lineHeight: 1.6 }}>{s.tip}</span>
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
    { icon: Waves,    color: "#00B4D8", bg: "rgba(0,180,216,0.08)",   border: "rgba(0,180,216,0.15)",  title: "Je débute",   sub: "Reprendre · Apprendre · Progresser",  desc: "Tu t'arrêtes après quelques longueurs ou tu reprends après un arrêt ? C'est parfait — le plan commence là où tu en es." },
    { icon: Activity, color: "#FF5722", bg: "rgba(255,87,34,0.08)",   border: "rgba(255,87,34,0.15)",  title: "Triathlon",   sub: "Sprint · Olympique · Half · Ironman", desc: "Plans structurés pour gérer l'effort en compétition — fond, intensité et gestion du rythme." },
    { icon: Award,    color: "#F59E0B", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.15)", title: "Diplômes",    sub: "BNSSA · BPJEPS · Pompiers",             desc: "Apnée, remorquage, parcours spécifiques — prépare-toi exactement pour le jour J." },
    { icon: RotateCcw,color: "#00C48C", bg: "rgba(0,196,140,0.08)",   border: "rgba(0,196,140,0.15)",  title: "Progresser",  sub: "Nager plus · Plus vite · Mieux",        desc: "Tu nages régulièrement et tu veux franchir un cap ? Plan structuré sans deadline de compétition." },
    { icon: Target,   color: "#7C3AED", bg: "rgba(124,58,237,0.08)",  border: "rgba(124,58,237,0.15)", title: "Bien-être",   sub: "Remise en forme · Perte de poids",      desc: "Séances douces et progressives, à ton rythme. Nager pour se sentir bien, sans pression de chrono." },
  ];
  return (
    <section id="goals" style={{ background: C.bg, padding: "clamp(60px,8vw,100px) 20px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 52 }}>
          <SectionLabel text="POUR TOUT LE MONDE" />
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: C.ink, margin: 0, letterSpacing: "-1px" }}>
            Reprendre la nage,<br />progresser ou compétir
          </h2>
        </FadeIn>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {goals.map((g, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <a href="/app" style={{ textDecoration: "none", display: "block", height: "100%" }}>
                <div style={{
                  background: C.white, border: `1.5px solid ${g.border}`,
                  borderRadius: 20, padding: "24px 22px", height: "100%", boxSizing: "border-box",
                  boxShadow: C.shadow,
                  transition: "box-shadow 0.25s, transform 0.25s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 12px 40px ${g.color}18`; e.currentTarget.style.transform = "translateY(-4px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = C.shadow; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <div style={{ width: 46, height: 46, background: g.bg, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                    <g.icon size={22} color={g.color} />
                  </div>
                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 800, color: C.ink, margin: "0 0 4px" }}>{g.title}</h3>
                  <div style={{ fontSize: 11, color: g.color, fontWeight: 700, marginBottom: 10, letterSpacing: "0.03em" }}>{g.sub}</div>
                  <p style={{ color: C.grey, fontSize: 13, lineHeight: 1.65, margin: 0 }}>{g.desc}</p>
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
    { week: "Semaine 1", title: "Tu reprends confiance", desc: "Les premières séances sont courtes, faites pour que tu sortes de l'eau avec envie de revenir. Pas de chrono, pas de pression." },
    { week: "Semaine 4", title: "Tu vois la différence", desc: "Les longueurs coulent. Tu tiens plus longtemps, tu récupères plus vite. La confiance dans l'eau monte." },
    { week: "Semaine 8", title: "Tu franchis un cap", desc: "Les séances deviennent plus intenses — naturellement. Ton corps s'est adapté et est prêt pour aller plus loin." },
    { week: "Semaine 12+", title: "Tu arrives prêt", desc: "Que ce soit la compétition, le diplôme ou juste l'objectif perso — tu as fait le travail. Il ne reste qu'à profiter." },
  ];
  return (
    <section style={{ background: C.bgSoft, padding: "clamp(60px,8vw,100px) 20px" }}>
      <div style={{ maxWidth: 840, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 56 }}>
          <SectionLabel text="TA PROGRESSION" />
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: C.ink, margin: 0, letterSpacing: "-1px" }}>
            De "je m'essouffle"<br />à "je me sens bien dans l'eau"
          </h2>
        </FadeIn>

        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: isMobile ? 13 : 24, top: 0, bottom: 0, width: 2, background: `linear-gradient(to bottom, ${C.blue}, transparent)` }} />
          {milestones.map((m, i) => (
            <FadeIn key={i} delay={i * 0.15}>
              <div style={{ display: "flex", gap: isMobile ? 16 : 32, marginBottom: i < milestones.length - 1 ? (isMobile ? 28 : 40) : 0 }}>
                <div style={{ flexShrink: 0, width: isMobile ? 28 : 50, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: "50%", background: C.blue,
                    border: `3px solid ${C.bgSoft}`, boxShadow: `0 0 0 3px rgba(0,87,255,0.2)`,
                    marginTop: 6,
                  }} />
                </div>
                <div style={{ flex: 1, background: C.white, border: `1px solid ${C.border}`, borderRadius: 18, padding: 22, boxShadow: C.shadow }}>
                  <div style={{ fontSize: 12, color: C.blue, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 6 }}>{m.week}</div>
                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 800, color: C.ink, margin: "0 0 8px" }}>{m.title}</h3>
                  <p style={{ color: C.grey, fontSize: 14, lineHeight: 1.65, margin: 0 }}>{m.desc}</p>
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
  const reviews = [
    { name: "Thomas R.", tag: "Triathlon Olympique", stars: 5, text: "J'ai préparé mon premier triathlon olympique avec MySWYM. Les séances sont vraiment structurées — je n'aurais pas su construire ça seul. J'ai nagé bien mieux que prévu le jour J." },
    { name: "Camille D.", tag: "BNSSA réussi", stars: 5, text: "Les séances BNSSA sont exactement ce qu'il faut : apnée, remorquage, simulation du parcours. J'ai réussi du premier coup." },
    { name: "Antoine M.", tag: "Niveau intermédiaire", stars: 5, text: "Simple, efficace. J'ouvre l'app le matin, je sais exactement quoi faire dans l'eau. Plus besoin de réfléchir — juste nager." },
    { name: "Sarah L.", tag: "Triathlon Half", stars: 5, text: "La progression est bien pensée. Les phases s'enchaînent logiquement. À 8 semaines de mon Half, je me sens vraiment prête sur la nage." },
    { name: "Marc B.", tag: "Bien-être", stars: 5, text: "Je suis revenu à la natation après 5 ans d'arrêt. Le niveau débutant est parfait — progressif, pas décourageant." },
    { name: "Julie T.", tag: "Eau libre 10 km", stars: 5, text: "Les séances eau libre sont différentes des plans classiques. Les reps longues, les cues sur la respiration bilatérale — ça colle vraiment à la spécificité de l'eau vive." },
  ];
  return (
    <section style={{ background: C.bg, padding: "clamp(60px,8vw,100px) 20px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 52 }}>
          <SectionLabel text="ILS NAGENT AVEC MYSWYM" />
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: C.ink, margin: 0, letterSpacing: "-1px" }}>
            Ce qu'ils en disent
          </h2>
        </FadeIn>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {reviews.map((r, i) => (
            <FadeIn key={i} delay={(i % 3) * 0.08}>
              <div style={{
                background: C.white, border: `1px solid ${C.border}`, borderRadius: 20, padding: 24,
                boxShadow: C.shadow,
                transition: "box-shadow 0.25s",
              }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = C.shadowMd}
                onMouseLeave={e => e.currentTarget.style.boxShadow = C.shadow}
              >
                <div style={{ display: "flex", gap: 2, marginBottom: 14 }}>
                  {Array(r.stars).fill(0).map((_, j) => <Star key={j} size={14} fill="#F59E0B" color="#F59E0B" />)}
                </div>
                <p style={{ color: C.inkLight, fontSize: 14, lineHeight: 1.7, margin: "0 0 18px", fontStyle: "italic" }}>"{r.text}"</p>
                <div>
                  <div style={{ color: C.ink, fontWeight: 700, fontSize: 14 }}>{r.name}</div>
                  <div style={{ color: C.blue, fontSize: 12, fontWeight: 600, marginTop: 2 }}>{r.tag}</div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
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
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(26px, 4vw, 44px)", fontWeight: 800, color: C.ink, margin: 0, letterSpacing: "-1px" }}>
            La différence que tu<br />ressentiras dans l'eau
          </h2>
        </FadeIn>

        <FadeIn>
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 20, overflow: "hidden", boxShadow: C.shadow, minWidth: isMobile ? 300 : "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: gridCols, borderBottom: `1px solid ${C.border}` }}>
              <div style={{ padding: isMobile ? "14px" : "18px 24px" }} />
              {cols.map((c, i) => (
                <div key={i} style={{
                  padding: isMobile ? "14px 8px" : "18px 12px", textAlign: "center",
                  background: !c.dim ? C.blueLight : "transparent",
                  borderLeft: `1px solid ${C.border}`,
                  borderBottom: !c.dim ? `2px solid ${C.blue}` : "none",
                }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: isMobile ? 12 : 14, fontWeight: 800, color: c.dim ? C.grey : C.ink }}>{c.label}</div>
                  <div style={{ fontSize: 10, color: c.dim ? C.greyMid : C.blue, marginTop: 2 }}>{c.sub}</div>
                </div>
              ))}
            </div>
            {rows.map((r, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: gridCols,
                borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : "none",
                background: i % 2 === 0 ? "transparent" : C.bgCard,
              }}>
                <div style={{ padding: isMobile ? "12px 14px" : "14px 24px", fontSize: isMobile ? 12 : 14, color: C.inkLight, display: "flex", alignItems: "center", lineHeight: 1.4 }}>{r.label}</div>
                {cols.map((c, j) => (
                  <div key={j} style={{
                    display: "flex", alignItems: "center", justifyContent: "center", padding: "12px 0",
                    background: !c.dim ? "rgba(0,87,255,0.04)" : "transparent",
                    borderLeft: `1px solid ${C.border}`,
                  }}>
                    <Cell val={r[c.key]} />
                  </div>
                ))}
              </div>
            ))}
          </div>
          </div>{/* /overflowX wrapper */}
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
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, color: C.ink, margin: "0 0 18px", letterSpacing: "-1px" }}>
            Tes allures cibles,<br />calculées à la seconde
          </h2>
          <p style={{ color: C.grey, fontSize: 15, lineHeight: 1.7, marginBottom: 20 }}>
            Tu entres ton meilleur 100m crawl. On calcule automatiquement tes 3 zones d'intensité — chaque séance affiche l'allure exacte à viser.
          </p>
          <p style={{ color: C.grey, fontSize: 15, lineHeight: 1.7, marginBottom: 8 }}>
            Plus de "nage à allure confortable" vague. Tu sais exactement si tu es en endurance ou à ton seuil.
          </p>
          <p style={{ color: C.greyMid, fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
            🏆 Cette fonctionnalité est disponible pour le niveau <strong style={{ color: C.ink }}>Performance</strong>. Les autres niveaux ont des plans tout aussi structurés — sans avoir besoin de chrono.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["Endurance", "Effort soutenu", "Vitesse", "Sprint"].map((t, i) => (
              <span key={i} style={{ background: C.blueLight, color: C.blue, fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 100 }}>{t}</span>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={0.12}>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 24, padding: 28, boxShadow: C.shadowMd }}>
            <p style={{ fontSize: 11, color: C.grey, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Mon meilleur 100m crawl</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {examples.map(ex => (
                <button key={ex} onClick={() => { setTime(ex); setSecs(toSecs(ex)); }} style={{
                  padding: "8px 14px", borderRadius: 10,
                  border: `1.5px solid ${time === ex ? C.blue : C.border}`,
                  background: time === ex ? C.blueLight : C.bgCard,
                  color: time === ex ? C.blue : C.grey,
                  fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700,
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
                  <div key={i} style={{ background: C.bgCard, borderRadius: 14, padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{z.label}</span>
                        <span style={{ fontSize: 11, color: C.grey, marginLeft: 6 }}>{z.zone}</span>
                      </div>
                      <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: z.color }}>{pStr}/100m</span>
                    </div>
                    <div style={{ height: 3, background: C.greyLight, borderRadius: 2 }}>
                      <div style={{ width: `${barW}%`, height: "100%", background: z.color, borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 11, color: C.grey, marginTop: 5 }}>{z.desc}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ background: C.blueLight, borderRadius: 14, padding: "13px 16px" }}>
              <div style={{ fontSize: 10, color: C.blue, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 5 }}>APERÇU DANS TES SÉANCES</div>
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
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
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
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: C.ink, margin: "0 0 12px", letterSpacing: "-1px" }}>
            Commence gratuitement.<br />Passe premium quand tu veux.
          </h2>
          <p style={{ color: C.grey, fontSize: 16 }}>Annule à tout moment.</p>
        </FadeIn>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, alignItems: "start", paddingTop: 16 }}>
          {/* Free */}
          <FadeIn delay={0}>
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 24, padding: 32, boxShadow: C.shadow }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: C.ink, marginBottom: 4 }}>Gratuit</div>
              <div style={{ fontSize: 38, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: C.ink, margin: "14px 0 4px" }}>0€</div>
              <div style={{ color: C.grey, fontSize: 13, marginBottom: 24 }}>Pour toujours</div>
              <a href="/app" style={{
                display: "block", textAlign: "center",
                border: `1.5px solid ${C.greyLight}`, color: C.ink,
                background: C.bgCard,
                fontWeight: 600, fontSize: 15, padding: "13px", borderRadius: 12, textDecoration: "none",
                marginBottom: 24,
              }}
                onMouseEnter={e => { e.currentTarget.style.background = C.greyLight; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.bgCard; }}
              >Commencer gratuitement</a>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {freeFeatures.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <Check size={15} color={C.greyMid} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ color: C.grey, fontSize: 14 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Premium annual — highlighted */}
          <FadeIn delay={0.1}>
            <div style={{
              background: C.ink,
              borderRadius: 24, padding: 28, position: "relative",
              boxShadow: "0 20px 60px rgba(10,22,40,0.18)",
            }}>
              {/* Badge top */}
              <div style={{
                position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
                background: C.blue, color: C.white, fontSize: 11, fontWeight: 700,
                padding: "4px 16px", borderRadius: 100, letterSpacing: "0.06em", whiteSpace: "nowrap",
              }}>⚡ MEILLEURE OFFRE</div>

              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: C.white }}>Premium Annuel</div>
                <div style={{
                  background: "#22C55E", color: C.white,
                  fontSize: 12, fontWeight: 800, padding: "4px 10px", borderRadius: 8,
                  letterSpacing: "0.04em",
                }}>−33%</div>
              </div>

              {/* Prix barré → prix remisé */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{
                  fontSize: 18, color: "rgba(255,255,255,0.3)",
                  textDecoration: "line-through", fontWeight: 600,
                }}>4,99€</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>/mois</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 44, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: C.white, lineHeight: 1 }}>3,33€</span>
                <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, marginBottom: 6 }}>/mois</span>
              </div>

              {/* Facturé annuellement */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "rgba(255,255,255,0.07)", borderRadius: 8, padding: "6px 12px",
                marginBottom: 20,
              }}>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Facturé</span>
                <span style={{ color: C.white, fontSize: 13, fontWeight: 700 }}>40€/an</span>
                <span style={{ color: "#22C55E", fontSize: 12, fontWeight: 700 }}>· 1 mois offert</span>
              </div>

              <button onClick={() => handlePremium(PRICE_ANNUAL)} style={{
                display: "block", width: "100%", textAlign: "center",
                background: C.blue, color: C.white, fontWeight: 700, fontSize: 16,
                padding: "15px", borderRadius: 12, border: "none", cursor: "pointer",
                marginBottom: 20, boxShadow: "0 6px 20px rgba(0,87,255,0.40)",
                letterSpacing: "0.02em",
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >Démarrer — 40€/an</button>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {premiumFeatures.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <Check size={15} color={C.blue} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Premium monthly */}
          <FadeIn delay={0.2}>
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 24, padding: 32, boxShadow: C.shadow }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: C.ink, marginBottom: 4 }}>Premium</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, margin: "14px 0 4px" }}>
                <span style={{ fontSize: 38, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: C.ink }}>4,99€</span>
                <span style={{ color: C.grey, fontSize: 14, marginBottom: 8 }}>/mois</span>
              </div>
              <div style={{ color: C.grey, fontSize: 13, marginBottom: 24 }}>Sans engagement</div>
              <button onClick={() => handlePremium(PRICE_MONTHLY)} style={{
                display: "block", width: "100%", textAlign: "center",
                background: C.bgCard, border: `1.5px solid ${C.greyLight}`,
                color: C.ink, fontWeight: 600, fontSize: 15,
                padding: "13px", borderRadius: 12, cursor: "pointer",
                marginBottom: 24,
              }}
                onMouseEnter={e => e.currentTarget.style.background = C.greyLight}
                onMouseLeave={e => e.currentTarget.style.background = C.bgCard}
              >Choisir le mensuel</button>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {premiumFeatures.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <Check size={15} color={C.greyMid} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ color: C.grey, fontSize: 14 }}>{f}</span>
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
    { q: "Je suis débutant total, MySWYM est fait pour moi ?", a: "Oui. Le niveau \"débutant\" est conçu pour les gens qui reprennent après des années d'arrêt. Les premières séances travaillent la position dans l'eau avant tout. On progresse à ton rythme." },
    { q: "Je ne connais pas mon temps au 100m — est-ce un problème ?", a: "Pas du tout. Le temps au 100m est optionnel. Si tu le passes, l'app calcule des allures précises. Sinon, elle utilise des allures adaptées à ton niveau déclaré. Le plan reste 100% utilisable." },
    { q: "Qu'est-ce qui est inclus dans la version gratuite ?", a: "Le premier mois de ton plan complet (4 semaines), avec le détail de chaque séance. C'est suffisant pour voir si l'approche te correspond. Aucune carte bancaire requise." },
    { q: "Puis-je changer d'objectif en cours de plan ?", a: "Oui. Dans l'onglet Profil, tu peux redémarrer l'onboarding pour définir un nouvel objectif et régénérer un plan complet. Avec Premium, tu peux même avoir plusieurs plans actifs en parallèle." },
    { q: "Les séances fonctionnent en bassin 25m et 50m ?", a: "Oui. Lors de l'onboarding tu choisis la longueur de ton bassin. Toutes les distances, séries et temps de départ sont automatiquement calculés pour s'adapter." },
    { q: "L'abonnement est sans engagement ?", a: "Oui. Tu peux annuler à tout moment depuis ton espace client. Si tu annules, tu gardes l'accès Premium jusqu'à la fin de la période payée." },
  ];

  return (
    <section style={{ background: C.bg, padding: "clamp(60px,8vw,100px) 20px" }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 48 }}>
          <SectionLabel text="FAQ" />
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: C.ink, margin: 0, letterSpacing: "-1px" }}>
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
                  border: `1px solid ${isOpen ? C.blue + "30" : C.border}`,
                  borderRadius: 16, overflow: "hidden",
                  boxShadow: isOpen ? C.shadow : "none",
                  transition: "all 0.2s",
                }}>
                  <button onClick={() => setOpen(isOpen ? null : i)} style={{
                    width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "18px 22px", background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: 16,
                  }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: isOpen ? C.ink : C.inkLight, flex: 1, lineHeight: 1.4 }}>{item.q}</span>
                    <div style={{
                      flexShrink: 0, width: 28, height: 28, borderRadius: "50%",
                      background: isOpen ? C.blue : C.bgCard,
                      border: `1px solid ${isOpen ? C.blue : C.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.25s, background 0.2s",
                    }}>
                      <ChevronDown size={15} color={isOpen ? C.white : C.grey} />
                    </div>
                  </button>
                  {isOpen && (
                    <div style={{ padding: "0 22px 20px", fontSize: 14, color: C.grey, lineHeight: 1.75 }}>
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
          <div style={{ width: 60, height: 60, background: "rgba(255,255,255,0.08)", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <Waves size={28} color={C.white} />
          </div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(30px, 5vw, 50px)", fontWeight: 800, color: C.white, margin: "0 0 16px", letterSpacing: "-1.2px" }}>
            Ton coach dans ta poche.<br />Gratuit pour commencer.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 17, lineHeight: 1.6, marginBottom: 32 }}>
            Tu nages, on structure tout le reste. Lance ton programme en 2 minutes.
          </p>
          <a href="/app" style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: C.blue, color: C.white, fontWeight: 700, fontSize: 17,
            padding: "16px 36px", borderRadius: 16, textDecoration: "none",
            boxShadow: "0 10px 32px rgba(0,87,255,0.4)",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,87,255,0.5)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 10px 32px rgba(0,87,255,0.4)"; }}
          >
            Créer mon plan maintenant <ArrowRight size={18} />
          </a>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, marginTop: 12 }}>Gratuit · 2 minutes · Sans carte bancaire</p>
        </FadeIn>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────
function Footer() {
  const isMobile = useIsMobile();
  return (
    <footer style={{ background: C.ink, borderTop: "1px solid rgba(255,255,255,0.07)", padding: isMobile ? "32px 20px" : "36px 24px" }}>
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
          <div style={{ width: 28, height: 28, background: C.blue, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Waves size={15} color={C.white} />
          </div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: C.white }}>MySWYM</span>
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
          {[["L'application", "/app"], ["Blog", "/blog"], ["Tarifs", "#pricing"], ["Contact", "mailto:contact@myswym.app"]].map(([l, h]) => (
            <a key={l} href={h} style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => e.target.style.color = C.white}
              onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.4)"}
            >{l}</a>
          ))}
        </div>
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>© 2025 MySWYM. Tous droits réservés.</div>
      </div>
    </footer>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function Landing() {
  useEffect(() => {
    document.title = "MySWYM — Ton coach natation personnalisé";
    document.body.style.background = "#FFFFFF";
  }, []);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      <Nav />
      <Hero />
      <HowItWorks />
      <WeekExample />
      <Goals />
      <PaceFeature />
      <ProgressTimeline />
      <Comparison />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}
