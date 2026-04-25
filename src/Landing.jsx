import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Waves, Activity, Award, Target, ChevronRight, Check, X, Minus,
  ArrowRight, Play, Star, Zap, TrendingUp, Calendar, Users, Timer,
  ChevronDown, Shield,
} from "lucide-react";

// ── Supabase ───────────────────────────────────────────────────────────────
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ── Design tokens ──────────────────────────────────────────────────────────
const C = {
  ink:        "#0C1117",
  inkLight:   "#141C26",
  inkMid:     "#1E2A38",
  blue:       "#0A84FF",
  blueLight:  "#3399FF",
  white:      "#FFFFFF",
  offwhite:   "#F2F4F8",
  grey:       "#8A9BB0",
  greyLight:  "#C4CDD8",
  border:     "rgba(255,255,255,0.08)",
  borderMid:  "rgba(255,255,255,0.14)",
};

// ── Scroll animation hook ──────────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

// ── Animated counter ───────────────────────────────────────────────────────
function AnimCounter({ to, suffix = "", duration = 1600 }) {
  const [val, setVal] = useState(0);
  const [ref, visible] = useInView();
  useEffect(() => {
    if (!visible) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * to));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [visible, to, duration]);
  return <span ref={ref}>{val.toLocaleString("fr-FR")}{suffix}</span>;
}

// ── Fade-in wrapper ────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, style = {} }) {
  const [ref, visible] = useInView();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(28px)",
      transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Nav ────────────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? "rgba(12,17,23,0.92)" : "transparent",
      backdropFilter: scrolled ? "blur(16px)" : "none",
      borderBottom: scrolled ? `1px solid ${C.border}` : "none",
      transition: "background 0.3s, border-color 0.3s",
    }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, background: C.blue, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Waves size={18} color={C.white} />
          </div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: C.white, letterSpacing: "-0.5px" }}>MySWYM</span>
        </div>

        {/* Links */}
        <div style={{ display: "flex", alignItems: "center", gap: 32 }} className="nav-links">
          {[["Comment ça marche", "#how"], ["Objectifs", "#goals"], ["Tarifs", "#pricing"]].map(([l, h]) => (
            <a key={h} href={h} style={{ color: C.grey, fontSize: 14, fontWeight: 500, textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => e.target.style.color = C.white}
              onMouseLeave={e => e.target.style.color = C.grey}
            >{l}</a>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <a href="/app" style={{ color: C.greyLight, fontSize: 14, fontWeight: 500, textDecoration: "none", padding: "8px 14px" }}>Connexion</a>
          <a href="/app" style={{
            background: C.blue, color: C.white, fontSize: 14, fontWeight: 600,
            padding: "9px 18px", borderRadius: 10, textDecoration: "none",
            transition: "opacity 0.2s",
          }}
            onMouseEnter={e => e.target.style.opacity = "0.85"}
            onMouseLeave={e => e.target.style.opacity = "1"}
          >Commencer</a>
        </div>
      </div>
    </nav>
  );
}

// ── Hero ───────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section style={{
      minHeight: "100vh", background: C.ink, display: "flex", alignItems: "center",
      justifyContent: "center", textAlign: "center", padding: "120px 24px 80px",
      position: "relative", overflow: "hidden",
    }}>
      {/* Background glow */}
      <div style={{
        position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
        width: 800, height: 500, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(10,132,255,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: 760, position: "relative" }}>
        {/* Badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(10,132,255,0.12)", border: `1px solid rgba(10,132,255,0.3)`, borderRadius: 100, padding: "5px 14px", marginBottom: 32 }}>
          <Zap size={12} color={C.blue} />
          <span style={{ color: C.blue, fontSize: 12, fontWeight: 600, letterSpacing: "0.04em" }}>COACHING NATATION PERSONNALISÉ</span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(42px, 7vw, 80px)",
          color: C.white, lineHeight: 1.08, letterSpacing: "-2px", margin: "0 0 24px",
        }}>
          Nage plus vite.<br />
          <span style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.blueLight})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Avec un vrai plan.
          </span>
        </h1>

        {/* Subtitle */}
        <p style={{ color: C.grey, fontSize: "clamp(16px, 2.5vw, 19px)", lineHeight: 1.6, marginBottom: 40, maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
          MySWYM génère ton plan d'entraînement natation semaine par semaine —
          adapté à ton niveau, ton objectif et ta disponibilité.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
          <a href="/app" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: C.blue, color: C.white, fontWeight: 700, fontSize: 16,
            padding: "14px 28px", borderRadius: 14, textDecoration: "none",
            boxShadow: `0 8px 32px rgba(10,132,255,0.35)`,
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 12px 40px rgba(10,132,255,0.45)`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 8px 32px rgba(10,132,255,0.35)`; }}
          >
            Créer mon plan gratuitement <ArrowRight size={16} />
          </a>
        </div>
        <p style={{ color: C.grey, fontSize: 13 }}>Gratuit · Aucune carte bancaire · 2 minutes</p>

        {/* Phone mockup */}
        <div style={{ marginTop: 64, position: "relative", display: "inline-block" }}>
          <div style={{
            width: "clamp(280px, 40vw, 320px)", background: C.inkLight, borderRadius: 40,
            border: `1px solid ${C.border}`, padding: 16, boxShadow: "0 40px 120px rgba(0,0,0,0.6)",
            margin: "0 auto",
          }}>
            {/* Phone top */}
            <div style={{ background: C.inkMid, borderRadius: 28, padding: "20px 20px 0", overflow: "hidden" }}>
              {/* Status bar */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{ fontSize: 11, color: C.greyLight, fontWeight: 600 }}>9:41</span>
                <div style={{ width: 80, height: 10, background: C.ink, borderRadius: 6 }} />
              </div>
              {/* Header */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: C.grey, marginBottom: 4 }}>SEMAINE 4 · BASE</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: C.white }}>Ton programme</div>
              </div>
              {/* Progress bar */}
              <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, marginBottom: 20 }}>
                <div style={{ width: "60%", height: "100%", background: C.blue, borderRadius: 2 }} />
              </div>
              {/* Session cards */}
              {[
                { label: "ENDURANCE", title: "Fond en séries", dist: "2 000m", done: true },
                { label: "SEUIL", title: "CSS — allure critique", dist: "1 800m", done: false },
                { label: "TECHNIQUE", title: "Catch-up drill & DPS", dist: "1 600m", done: false },
              ].map((s, i) => (
                <div key={i} style={{
                  background: s.done ? "rgba(10,132,255,0.08)" : C.ink,
                  border: `1px solid ${s.done ? "rgba(10,132,255,0.2)" : C.border}`,
                  borderRadius: 14, padding: "12px 14px", marginBottom: 10,
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.done ? C.blue : C.grey, flexShrink: 0 }} />
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontSize: 9, color: s.done ? C.blue : C.grey, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 13, color: C.white, fontWeight: 600 }}>{s.title}</div>
                  </div>
                  <div style={{ fontSize: 12, color: C.grey }}>{s.dist}</div>
                </div>
              ))}
              <div style={{ height: 20 }} />
            </div>
          </div>
          {/* Glow under phone */}
          <div style={{ position: "absolute", bottom: -40, left: "50%", transform: "translateX(-50%)", width: 240, height: 40, background: "rgba(10,132,255,0.2)", filter: "blur(30px)", borderRadius: "50%" }} />
        </div>
      </div>
    </section>
  );
}

// ── Stats ──────────────────────────────────────────────────────────────────
function Stats() {
  const stats = [
    { value: 500, suffix: "+", label: "Plans lancés" },
    { value: 4,   suffix: "",  label: "Objectifs sportifs" },
    { value: 100, suffix: "%", label: "Personnalisé" },
  ];
  return (
    <section style={{ background: C.inkLight, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: "48px 24px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
        {stats.map((s, i) => (
          <FadeIn key={i} delay={i * 0.1} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, color: C.white, letterSpacing: "-1px" }}>
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
    { n: "01", icon: Target, title: "Ton profil en 2 min", desc: "Choisis ton objectif — triathlon, eau libre, diplôme ou bien-être — et précise ton niveau et ta fréquence de nage." },
    { n: "02", icon: Calendar, title: "Plan généré instantanément", desc: "L'algorithme structure ton programme semaine par semaine : phases de base, développement, pic de forme et affûtage." },
    { n: "03", icon: Waves, title: "Nage, coche, progresse", desc: "Chaque séance est détaillée — séries, temps de repos, cues techniques. Tu coches en sortant du bassin." },
    { n: "04", icon: TrendingUp, title: "Suis ta progression", desc: "Semaines complétées, distance totale, séances par type — visualise ton évolution et reste motivé jusqu'au bout." },
  ];
  return (
    <section id="how" style={{ background: C.ink, padding: "100px 24px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ fontSize: 12, color: C.blue, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 14 }}>COMMENT ÇA MARCHE</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: C.white, margin: 0, letterSpacing: "-1px" }}>
            De zéro à la compétition<br />en 4 étapes
          </h2>
        </FadeIn>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
          {steps.map((s, i) => (
            <FadeIn key={i} delay={i * 0.12}>
              <div style={{
                background: C.inkLight, border: `1px solid ${C.border}`,
                borderRadius: 20, padding: 28, height: "100%", boxSizing: "border-box",
                transition: "border-color 0.3s, transform 0.3s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(10,132,255,0.4)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                  <div style={{ width: 42, height: 42, background: "rgba(10,132,255,0.12)", border: `1px solid rgba(10,132,255,0.2)`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <s.icon size={20} color={C.blue} />
                  </div>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 800, color: "rgba(10,132,255,0.5)", letterSpacing: "0.04em" }}>{s.n}</span>
                </div>
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 800, color: C.white, margin: "0 0 10px" }}>{s.title}</h3>
                <p style={{ color: C.grey, fontSize: 14, lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Goals ──────────────────────────────────────────────────────────────────
function Goals() {
  const goals = [
    { icon: Activity, color: "#FF6B35", bg: "rgba(255,107,53,0.1)", border: "rgba(255,107,53,0.2)", title: "Triathlon", sub: "Sprint · Olympique · Half · Ironman", desc: "Plans axés CSS, séries longues et gestion d'effort — exactement comme en compétition." },
    { icon: Waves,    color: "#00C6FF", bg: "rgba(0,198,255,0.1)",  border: "rgba(0,198,255,0.2)",  title: "Eau libre",  sub: "5 km · 10 km", desc: "Endurance continue, respiration bilatérale, pas de murs — nage comme en lac." },
    { icon: Award,    color: "#FFD700", bg: "rgba(255,215,0,0.1)",  border: "rgba(255,215,0,0.2)",  title: "Diplômes", sub: "BNSSA · BPJEPS · Pompiers", desc: "Apnée, remorquage, parcours spécifiques — prépare-toi exactement pour le jour J." },
    { icon: Target,   color: "#7CFC00", bg: "rgba(124,252,0,0.1)",  border: "rgba(124,252,0,0.2)",  title: "Bien-être",  sub: "Remise en forme · Perte de poids", desc: "Séances douces et progressives adaptées à ton rythme, sans pression de performance." },
  ];
  return (
    <section id="goals" style={{ background: C.inkLight, padding: "100px 24px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ fontSize: 12, color: C.blue, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 14 }}>TES OBJECTIFS</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: C.white, margin: 0, letterSpacing: "-1px" }}>
            Un plan taillé pour<br />ton objectif précis
          </h2>
        </FadeIn>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 20 }}>
          {goals.map((g, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div style={{
                background: C.ink, border: `1px solid ${g.border}`,
                borderRadius: 20, padding: 28,
                transition: "transform 0.3s, box-shadow 0.3s",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 20px 60px rgba(0,0,0,0.3)`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ width: 48, height: 48, background: g.bg, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                  <g.icon size={24} color={g.color} />
                </div>
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: C.white, margin: "0 0 4px" }}>{g.title}</h3>
                <div style={{ fontSize: 12, color: g.color, fontWeight: 600, marginBottom: 12 }}>{g.sub}</div>
                <p style={{ color: C.grey, fontSize: 14, lineHeight: 1.65 }}>{g.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Progress timeline ──────────────────────────────────────────────────────
function ProgressTimeline() {
  const milestones = [
    { week: "Semaine 1", title: "Tu établis ta base", desc: "Premières séances fondamentales. Tu trouves ton allure, ton rythme de respiration. La régularité prime sur l'intensité." },
    { week: "Semaine 4", title: "Tu vois la différence", desc: "Les longueurs coulent. Ton rythme s'améliore, les pauses raccourcissent. La confiance en bassin monte." },
    { week: "Semaine 8", title: "Tu franchis un cap", desc: "L'intensité monte. Séances de seuil, travail de vitesse. Ton corps s'est adapté et réclame davantage." },
    { week: "Semaine 12+", title: "Tu arrives prêt", desc: "Affûtage en cours. Que ce soit la compétition, l'examen ou l'objectif perso — tu as fait le travail." },
  ];
  return (
    <section style={{ background: C.ink, padding: "100px 24px" }}>
      <div style={{ maxWidth: 840, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ fontSize: 12, color: C.blue, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 14 }}>TA PROGRESSION</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: C.white, margin: 0, letterSpacing: "-1px" }}>
            Semaine après semaine,<br />tu avances
          </h2>
        </FadeIn>

        <div style={{ position: "relative" }}>
          {/* Line */}
          <div style={{ position: "absolute", left: 24, top: 0, bottom: 0, width: 2, background: `linear-gradient(to bottom, ${C.blue}, transparent)` }} />

          {milestones.map((m, i) => (
            <FadeIn key={i} delay={i * 0.15}>
              <div style={{ display: "flex", gap: 32, marginBottom: i < milestones.length - 1 ? 48 : 0 }}>
                {/* Dot */}
                <div style={{ flexShrink: 0, width: 50, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: "50%", background: C.blue,
                    border: `3px solid ${C.ink}`, boxShadow: `0 0 0 3px rgba(10,132,255,0.3)`,
                    marginTop: 6,
                  }} />
                </div>
                {/* Content */}
                <div style={{ flex: 1, background: C.inkLight, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24, marginBottom: 0 }}>
                  <div style={{ fontSize: 12, color: C.blue, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 6 }}>{m.week}</div>
                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: C.white, margin: "0 0 8px" }}>{m.title}</h3>
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
    { name: "Camille D.", tag: "BNSSA réussi", stars: 5, text: "Les séances de BNSSA sont exactement ce qu'il faut : apnée, remorquage, simulation du parcours. J'ai réussi du premier coup. L'app m'a évité de chercher des infos partout." },
    { name: "Antoine M.", tag: "Niveau intermédiaire", stars: 5, text: "Simple, efficace. J'ouvre l'app le matin, je sais exactement quoi faire dans l'eau. Plus besoin de réfléchir — juste nager." },
    { name: "Sarah L.", tag: "Triathlon Half", stars: 5, text: "La progression est bien pensée. Les phases s'enchaînent logiquement. À 8 semaines de mon Half, je me sens vraiment prête sur la nage." },
    { name: "Marc B.", tag: "Bien-être", stars: 5, text: "Je suis revenu à la natation après 5 ans d'arrêt. Le niveau débutant est parfait — progressif, pas décourageant. Je reprends confiance semaine après semaine." },
    { name: "Julie T.", tag: "Eau libre 10 km", stars: 5, text: "Les séances eau libre sont différentes des plans classiques. Les reps longues, les cues sur la respiration bilatérale — ça colle vraiment à la spécificité de l'eau vive." },
  ];
  return (
    <section style={{ background: C.inkLight, padding: "100px 24px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ fontSize: 12, color: C.blue, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 14 }}>ILS NAGENT AVEC MYSWYM</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: C.white, margin: 0, letterSpacing: "-1px" }}>
            Ce qu'ils en disent
          </h2>
        </FadeIn>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          {reviews.map((r, i) => (
            <FadeIn key={i} delay={(i % 3) * 0.1}>
              <div style={{
                background: C.ink, border: `1px solid ${C.border}`, borderRadius: 20, padding: 24,
                transition: "border-color 0.3s",
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.borderMid}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
              >
                <div style={{ display: "flex", gap: 2, marginBottom: 14 }}>
                  {Array(r.stars).fill(0).map((_, j) => <Star key={j} size={14} fill="#FFD700" color="#FFD700" />)}
                </div>
                <p style={{ color: C.offwhite, fontSize: 14, lineHeight: 1.7, margin: "0 0 18px", fontStyle: "italic" }}>"{r.text}"</p>
                <div>
                  <div style={{ color: C.white, fontWeight: 700, fontSize: 14 }}>{r.name}</div>
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

// ── Pricing ────────────────────────────────────────────────────────────────
function Pricing() {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const handlePremium = async (priceId) => {
    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = "/app";
      return;
    }
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      window.location.href = "/app";
    }
  };

  const PRICE_MONTHLY = "price_1TPjyPAS4mfgF2Twx3Zh4zrJ";
  const PRICE_ANNUAL  = "price_1TPjyeAS4mfgF2TwmSjSiidD";

  const freeFeatures = [
    "Plan des 2 premières semaines",
    "Tous les objectifs sportifs",
    "1 à 2 séances par semaine",
    "Séances détaillées avec cues",
  ];
  const premiumFeatures = [
    "Plan complet jusqu'à 52 semaines",
    "Jusqu'à 4 séances par semaine",
    "Toutes les variantes de séances",
    "Progression avancée (seuil, vitesse)",
    "Séances spécialisées BNSSA / eau libre",
    "Accès à vie aux mises à jour",
  ];

  return (
    <section id="pricing" style={{ background: C.ink, padding: "100px 24px" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ fontSize: 12, color: C.blue, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 14 }}>TARIFS</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: C.white, margin: "0 0 16px", letterSpacing: "-1px" }}>
            Commence gratuitement.<br />Passe premium quand tu veux.
          </h2>
          <p style={{ color: C.grey, fontSize: 16 }}>Annule à tout moment.</p>
        </FadeIn>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, alignItems: "start" }}>
          {/* Free */}
          <FadeIn delay={0}>
            <div style={{ background: C.inkLight, border: `1px solid ${C.border}`, borderRadius: 24, padding: 32 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: C.white, marginBottom: 4 }}>Gratuit</div>
              <div style={{ fontSize: 38, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: C.white, margin: "16px 0 4px" }}>0€</div>
              <div style={{ color: C.grey, fontSize: 13, marginBottom: 28 }}>Pour toujours</div>
              <a href="/app" style={{
                display: "block", textAlign: "center", background: "transparent",
                border: `1px solid ${C.borderMid}`, color: C.white,
                fontWeight: 600, fontSize: 15, padding: "13px", borderRadius: 12, textDecoration: "none",
                marginBottom: 28, transition: "border-color 0.2s",
              }}
                onMouseEnter={e => e.target.style.borderColor = C.white}
                onMouseLeave={e => e.target.style.borderColor = C.borderMid}
              >Commencer gratuitement</a>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {freeFeatures.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <Check size={15} color={C.grey} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ color: C.grey, fontSize: 14 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Premium annual — highlighted */}
          <FadeIn delay={0.1}>
            <div style={{
              background: "linear-gradient(145deg, #0F1E32, #0C1117)",
              border: `1px solid rgba(10,132,255,0.5)`,
              borderRadius: 24, padding: 32, position: "relative",
              boxShadow: `0 0 60px rgba(10,132,255,0.12)`,
            }}>
              {/* Badge */}
              <div style={{
                position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
                background: C.blue, color: C.white, fontSize: 11, fontWeight: 700,
                padding: "4px 14px", borderRadius: 100, letterSpacing: "0.06em", whiteSpace: "nowrap",
              }}>MEILLEURE VALEUR</div>

              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: C.white, marginBottom: 4 }}>Premium</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, margin: "16px 0 4px" }}>
                <span style={{ fontSize: 38, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: C.white }}>3,33€</span>
                <span style={{ color: C.grey, fontSize: 14, marginBottom: 8 }}>/mois</span>
              </div>
              <div style={{ color: C.grey, fontSize: 13, marginBottom: 6 }}>40€/an — soit 2 mois offerts</div>
              <button onClick={() => handlePremium(PRICE_ANNUAL)} style={{
                display: "block", width: "100%", textAlign: "center",
                background: C.blue, color: C.white, fontWeight: 700, fontSize: 15,
                padding: "13px", borderRadius: 12, border: "none", cursor: "pointer",
                marginBottom: 28, boxShadow: `0 6px 24px rgba(10,132,255,0.3)`,
                transition: "opacity 0.2s",
              }}
                onMouseEnter={e => e.target.style.opacity = "0.85"}
                onMouseLeave={e => e.target.style.opacity = "1"}
              >Choisir l'annuel</button>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {premiumFeatures.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <Check size={15} color={C.blue} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ color: C.offwhite, fontSize: 14 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Premium monthly */}
          <FadeIn delay={0.2}>
            <div style={{ background: C.inkLight, border: `1px solid ${C.border}`, borderRadius: 24, padding: 32 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: C.white, marginBottom: 4 }}>Premium</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, margin: "16px 0 4px" }}>
                <span style={{ fontSize: 38, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: C.white }}>4,99€</span>
                <span style={{ color: C.grey, fontSize: 14, marginBottom: 8 }}>/mois</span>
              </div>
              <div style={{ color: C.grey, fontSize: 13, marginBottom: 28 }}>Sans engagement</div>
              <button onClick={() => handlePremium(PRICE_MONTHLY)} style={{
                display: "block", width: "100%", textAlign: "center",
                background: "transparent", border: `1px solid ${C.borderMid}`,
                color: C.white, fontWeight: 600, fontSize: 15,
                padding: "13px", borderRadius: 12, cursor: "pointer",
                marginBottom: 28, transition: "border-color 0.2s",
              }}
                onMouseEnter={e => e.target.style.borderColor = C.white}
                onMouseLeave={e => e.target.style.borderColor = C.borderMid}
              >Choisir le mensuel</button>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {premiumFeatures.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <Check size={15} color={C.grey} style={{ marginTop: 2, flexShrink: 0 }} />
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

// ── Final CTA ──────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section style={{ background: C.inkLight, borderTop: `1px solid ${C.border}`, padding: "100px 24px", textAlign: "center" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <FadeIn>
          <div style={{ width: 64, height: 64, background: "rgba(10,132,255,0.12)", border: `1px solid rgba(10,132,255,0.3)`, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px" }}>
            <Waves size={30} color={C.blue} />
          </div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(30px, 5vw, 50px)", fontWeight: 800, color: C.white, margin: "0 0 18px", letterSpacing: "-1.2px" }}>
            Prêt à nager avec un vrai plan ?
          </h2>
          <p style={{ color: C.grey, fontSize: 17, lineHeight: 1.6, marginBottom: 36 }}>
            Lance ton programme en 2 minutes. C'est gratuit, aucune carte bancaire requise.
          </p>
          <a href="/app" style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: C.blue, color: C.white, fontWeight: 700, fontSize: 17,
            padding: "16px 36px", borderRadius: 16, textDecoration: "none",
            boxShadow: `0 10px 40px rgba(10,132,255,0.35)`,
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 16px 50px rgba(10,132,255,0.45)`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 10px 40px rgba(10,132,255,0.35)`; }}
          >
            Créer mon plan maintenant <ArrowRight size={18} />
          </a>
        </FadeIn>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background: C.ink, borderTop: `1px solid ${C.border}`, padding: "40px 24px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, background: C.blue, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Waves size={15} color={C.white} />
          </div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: C.white }}>MySWYM</span>
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {[["L'application", "/app"], ["Tarifs", "#pricing"], ["Contact", "mailto:contact@myswym.app"]].map(([l, h]) => (
            <a key={l} href={h} style={{ color: C.grey, fontSize: 13, textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => e.target.style.color = C.white}
              onMouseLeave={e => e.target.style.color = C.grey}
            >{l}</a>
          ))}
        </div>
        <div style={{ color: C.grey, fontSize: 12 }}>© 2025 MySWYM. Tous droits réservés.</div>
      </div>
    </footer>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
// ── Comparison ────────────────────────────────────────────────────────────
function Comparison() {
  const rows = [
    { label: "Plan structuré semaine par semaine", alone: false, generic: "partial", myswym: true },
    { label: "Adapté à ton niveau exact",          alone: false, generic: false,     myswym: true },
    { label: "Objectif sportif spécifique",        alone: false, generic: false,     myswym: true },
    { label: "Allures cibles personnalisées",      alone: false, generic: false,     myswym: true },
    { label: "Séances variées (5 formats/type)",   alone: false, generic: "partial", myswym: true },
    { label: "Progression en phases (base→pic)",   alone: false, generic: "partial", myswym: true },
    { label: "Éducatifs techniques intégrés",      alone: false, generic: false,     myswym: true },
    { label: "Gratuit pour commencer",             alone: true,  generic: false,     myswym: true },
  ];

  const Cell = ({ val }) => {
    if (val === true)      return <Check  size={18} color="#34C759" strokeWidth={2.5} />;
    if (val === false)     return <X      size={18} color="#FF3B30" strokeWidth={2.5} />;
    if (val === "partial") return <Minus  size={18} color="#FF9F0A" strokeWidth={2.5} />;
  };

  const cols = [
    { label: "Seul",     sub: "sans plan",     dim: true  },
    { label: "Générique",sub: "plan standard", dim: true  },
    { label: "MySWYM",   sub: "coach perso",   dim: false },
  ];

  return (
    <section style={{ background: C.ink, padding: "100px 24px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 12, color: C.blue, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 14 }}>POURQUOI MYSWYM</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: C.white, margin: 0, letterSpacing: "-1px" }}>
            La différence que tu<br />ressentiras dans l'eau
          </h2>
        </FadeIn>

        <FadeIn>
          <div style={{ background: C.inkLight, border: `1px solid ${C.border}`, borderRadius: 24, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr repeat(3, 110px)", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ padding: "18px 24px" }} />
              {cols.map((c, i) => (
                <div key={i} style={{
                  padding: "18px 12px", textAlign: "center",
                  background: !c.dim ? "rgba(10,132,255,0.08)" : "transparent",
                  borderLeft: `1px solid ${C.border}`,
                  borderBottom: !c.dim ? `2px solid ${C.blue}` : "none",
                }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 800, color: c.dim ? C.grey : C.white }}>{c.label}</div>
                  <div style={{ fontSize: 11, color: c.dim ? "rgba(138,155,176,0.5)" : C.blue, marginTop: 2 }}>{c.sub}</div>
                </div>
              ))}
            </div>

            {/* Rows */}
            {rows.map((r, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "1fr repeat(3, 110px)",
                borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : "none",
                background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
              }}>
                <div style={{ padding: "14px 24px", fontSize: 14, color: C.greyLight, display: "flex", alignItems: "center" }}>{r.label}</div>
                {[r.alone, r.generic, r.myswym].map((val, j) => (
                  <div key={j} style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: j === 2 ? "rgba(10,132,255,0.04)" : "transparent",
                    borderLeft: `1px solid ${C.border}`,
                  }}>
                    <Cell val={val} />
                  </div>
                ))}
              </div>
            ))}
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
    { label: "Facile",  zone: "Z1/Z2", mult: 1.35, color: "#34C759", desc: "Endurance & récupération" },
    { label: "Seuil",   zone: "Z3/Z4", mult: 1.08, color: "#FF9F0A", desc: "Effort soutenu · CSS" },
    { label: "Sprint",  zone: "Z5/Z6", mult: 0.95, color: "#FF3B30", desc: "Vitesse maximale" },
  ];

  const examples = ["0:55", "1:20", "1:45", "2:10", "2:45"];

  const toSecs = (str) => {
    const [m, s] = str.split(":").map(Number);
    return m * 60 + (s || 0);
  };
  const fmtSecs = (s) => `${Math.floor(s/60)}'${Math.round(s%60).toString().padStart(2,"0")}"`;

  return (
    <section style={{ background: C.inkLight, padding: "100px 24px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 64, alignItems: "center" }}>
        {/* Left — texte */}
        <FadeIn>
          <div style={{ fontSize: 12, color: C.blue, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Timer size={14} color={C.blue} /> ZONES PERSONNALISÉES
          </div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, color: C.white, margin: "0 0 18px", letterSpacing: "-1px" }}>
            Tes allures cibles,<br />calculées à la seconde
          </h2>
          <p style={{ color: C.grey, fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
            Tu entres ton meilleur 100m NL. On calcule automatiquement tes 3 zones d'intensité — chaque séance affiche l'allure exacte à viser dans l'eau.
          </p>
          <p style={{ color: C.grey, fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
            Plus de "nage à allure confortable" vague. Tu sais exactement si tu es en Z2 ou au seuil.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["Endurance", "Seuil lactique", "VO2max", "Sprint"].map((t, i) => (
              <span key={i} style={{ background: "rgba(10,132,255,0.1)", border: `1px solid rgba(10,132,255,0.25)`, color: C.blue, fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 100 }}>{t}</span>
            ))}
          </div>
        </FadeIn>

        {/* Right — interactive card */}
        <FadeIn delay={0.15}>
          <div style={{ background: C.ink, border: `1px solid ${C.border}`, borderRadius: 24, padding: 28, boxShadow: "0 24px 80px rgba(0,0,0,0.4)" }}>
            {/* Time picker */}
            <p style={{ fontSize: 11, color: C.grey, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Mon meilleur 100m NL</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
              {examples.map(ex => (
                <button key={ex} onClick={() => { setTime(ex); setSecs(toSecs(ex)); }} style={{
                  padding: "8px 14px", borderRadius: 10, border: `1px solid ${time === ex ? C.blue : C.border}`,
                  background: time === ex ? "rgba(10,132,255,0.15)" : "transparent",
                  color: time === ex ? C.blue : C.grey, fontFamily: "'Syne', sans-serif",
                  fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                }}>
                  {ex}
                </button>
              ))}
            </div>

            {/* Zones */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {zones.map((z, i) => {
                const pace = secs * z.mult;
                const pStr = fmtSecs(Math.round(pace));
                const barW = [80, 60, 45][i];
                return (
                  <div key={i} style={{ background: C.inkLight, borderRadius: 14, padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.white }}>{z.label}</span>
                        <span style={{ fontSize: 11, color: C.grey, marginLeft: 6 }}>{z.zone}</span>
                      </div>
                      <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 800, color: z.color }}>{pStr}/100m</span>
                    </div>
                    <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                      <div style={{ width: `${barW}%`, height: "100%", background: z.color, borderRadius: 2, transition: "width 0.4s ease" }} />
                    </div>
                    <div style={{ fontSize: 11, color: C.grey, marginTop: 5 }}>{z.desc}</div>
                  </div>
                );
              })}
            </div>

            {/* Session detail preview */}
            <div style={{ background: C.inkLight, borderRadius: 14, padding: "14px 16px", border: `1px solid rgba(10,132,255,0.2)` }}>
              <div style={{ fontSize: 10, color: C.blue, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 6 }}>APERÇU DANS TES SÉANCES</div>
              <div style={{ fontSize: 12, color: C.greyLight, lineHeight: 1.7, fontFamily: "monospace" }}>
                {`8×200m NL — D${fmtSecs(Math.round(Math.ceil((200 * secs * 1.08 / 100 + 15) / 5) * 5))} ≈ ${fmtSecs(Math.round(secs * 1.08))}/100m`}
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ── FAQ ────────────────────────────────────────────────────────────────────
function FAQ() {
  const [open, setOpen] = useState(null);

  const items = [
    {
      q: "Je suis débutant total, MySWYM est fait pour moi ?",
      a: "Oui. Le niveau \"débutant\" est conçu pour les gens qui reprennent après des années d'arrêt — ou qui ne se souviennent plus de leur dernier crawl. Les premières séances travaillent la position dans l'eau avant tout. On progresse à ton rythme.",
    },
    {
      q: "Je ne connais pas mon temps au 100m — est-ce un problème ?",
      a: "Pas du tout. Le temps au 100m est optionnel. Si tu le passes, l'app calcule des allures précises. Sinon, elle utilise des allures adaptées à ton niveau déclaré (débutant, intermédiaire, avancé). Le plan reste 100% utilisable.",
    },
    {
      q: "Qu'est-ce qui est inclus dans la version gratuite ?",
      a: "Les 2 premières semaines de ton plan complet, avec le détail de chaque séance. C'est suffisant pour voir si l'approche te correspond avant de t'engager. Aucune carte bancaire requise pour commencer.",
    },
    {
      q: "Puis-je changer d'objectif en cours de plan ?",
      a: "Oui. Dans l'onglet Profil, un bouton \"Recommencer l'onboarding\" te permet de définir un nouvel objectif et de régénérer un plan complet. Ton historique de séances réalisées est conservé.",
    },
    {
      q: "Les séances fonctionnent en bassin 25m et 50m ?",
      a: "Oui. Lors de l'onboarding tu choisis la longueur de ton bassin. Toutes les distances, séries et temps de départ sont automatiquement calculés pour s'adapter à 25m ou 50m.",
    },
    {
      q: "L'abonnement est sans engagement ?",
      a: "Oui. Tu peux annuler à tout moment depuis ton espace client. Si tu annules, tu gardes l'accès Premium jusqu'à la fin de la période payée — pas de coupure immédiate.",
    },
  ];

  return (
    <section style={{ background: C.ink, padding: "100px 24px" }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 12, color: C.blue, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 14 }}>FAQ</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: C.white, margin: 0, letterSpacing: "-1px" }}>
            Questions fréquentes
          </h2>
        </FadeIn>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <FadeIn key={i} delay={i * 0.05}>
                <div style={{
                  background: isOpen ? C.inkLight : "transparent",
                  border: `1px solid ${isOpen ? C.borderMid : C.border}`,
                  borderRadius: 16, overflow: "hidden",
                  transition: "background 0.25s, border-color 0.25s",
                  marginBottom: 4,
                }}>
                  <button onClick={() => setOpen(isOpen ? null : i)} style={{
                    width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "18px 22px", background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: 16,
                  }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: isOpen ? C.white : C.greyLight, flex: 1, lineHeight: 1.4 }}>{item.q}</span>
                    <div style={{
                      flexShrink: 0, width: 28, height: 28, borderRadius: "50%",
                      background: isOpen ? C.blue : "rgba(255,255,255,0.06)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.25s, background 0.25s",
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

export default function Landing() {
  useEffect(() => {
    document.title = "MySWYM — Ton coach natation personnalisé";
  }, []);

  return (
    <div style={{ background: C.ink, minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      <Nav />
      <Hero />
      <Stats />
      <Comparison />
      <HowItWorks />
      <Goals />
      <PaceFeature />
      <ProgressTimeline />
      <Testimonials />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}
