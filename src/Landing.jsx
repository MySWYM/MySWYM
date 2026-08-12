import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "./supabase.js";
import { track, trackEvent } from "./lib/analytics.js";
import {
  Waves, Target, Calendar, Gauge, Clock, ArrowRight, Check, ChevronDown,
  Zap, Shield, Layers, Timer, Dumbbell,
} from "lucide-react";
import PublicNav from "./PublicNav.jsx";
import Footer from "./Footer.jsx";
import BrandLogo from "./BrandLogo.jsx";
import CheckoutLegalGates, { checkoutGatesReady } from "./CheckoutLegalGates.jsx";

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
  accent:      "#8eb3ff",
  accentText:  "#154388",
  secondary:   "#5d5e61",
  outline:     "#737782",
  outlineVar:  "#c3c6d2",
  surfHigh:    "#e7e8eb",
  white:       "#ffffff",
  night:       "#0c1a2e",
  border:      "rgba(53,93,163,0.08)",
  borderMid:   "rgba(53,93,163,0.14)",
  shadow:      "0 2px 12px rgba(142,179,255,0.10)",
  shadowMd:    "0 8px 32px rgba(142,179,255,0.18)",
  shadowLg:    "0 20px 60px rgba(142,179,255,0.22)",
};

const FONT = "'Lexend', sans-serif";
const FONT_DISPLAY = "'Barlow Condensed', sans-serif";
const CTA_HREF = "/inscription";

// Doit matcher create-checkout ALLOWED_PRICE_IDS / App.jsx / Tarifs.jsx
const PRICE_MONTHLY = "price_1TPjyPAS4mfgF2Twx3Zh4zrJ";
const PRICE_ANNUAL = "price_1TudyVAS4mfgF2TwHiSo3Vrg";
const PRICE_MONTHLY_LABEL = "4,99€";
const PRICE_ANNUAL_LABEL = "39,99€";

function FontLoader() {
  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Lexend:wght@300;400;500;600;700;800;900&display=swap";
    document.head.appendChild(l);
  }, []);
  return null;
}

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

function useIsMobile(bp = 768) {
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

function SectionLabel({ text, dark = false }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: dark ? "rgba(142,179,255,0.15)" : C.primaryFix,
      borderRadius: 100, padding: "5px 14px", marginBottom: 16,
    }}>
      <span style={{
        color: dark ? C.accent : C.primary,
        fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", fontFamily: FONT,
      }}>{text}</span>
    </div>
  );
}

function PrimaryCta({ href = CTA_HREF, children, style = {}, onClick }) {
  const Tag = onClick ? "button" : "a";
  const props = onClick
    ? { type: "button", onClick }
    : { href };
  return (
    <Tag
      {...props}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        background: C.accent, color: C.accentText, fontWeight: 700,
        fontSize: 16, fontFamily: FONT,
        padding: "15px 28px", borderRadius: 16, textDecoration: "none",
        border: "none", cursor: "pointer",
        boxShadow: "0 8px 28px rgba(142,179,255,0.40)",
        transition: "transform 0.2s, box-shadow 0.2s",
        minHeight: 48,
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 12px 36px rgba(142,179,255,0.50)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "0 8px 28px rgba(142,179,255,0.40)";
      }}
    >
      {children}
    </Tag>
  );
}

// ── iPhone-style mockup shell ──────────────────────────────────────────────
function PhoneFrame({ children, width = 260, darkStatus = true, style = {} }) {
  const height = Math.round(width * 2.05);
  const bezel = Math.max(9, Math.round(width * 0.038));
  const radius = Math.round(width * 0.18);
  const screenRadius = Math.round(radius * 0.72);
  const islandW = Math.round(width * 0.32);
  const islandH = Math.round(width * 0.085);

  return (
    <div
      aria-hidden
      style={{
        width, height, flexShrink: 0, position: "relative",
        ...style,
      }}
    >
      {/* Boutons latéraux */}
      <div style={{
        position: "absolute", left: -2.5, top: height * 0.18,
        width: 3, height: height * 0.035, borderRadius: 2,
        background: "linear-gradient(90deg, #2a2d32, #1a1c1f)",
        boxShadow: "inset 0 0 1px rgba(255,255,255,0.15)",
      }} />
      <div style={{
        position: "absolute", left: -2.5, top: height * 0.26,
        width: 3, height: height * 0.07, borderRadius: 2,
        background: "linear-gradient(90deg, #2a2d32, #1a1c1f)",
      }} />
      <div style={{
        position: "absolute", left: -2.5, top: height * 0.35,
        width: 3, height: height * 0.07, borderRadius: 2,
        background: "linear-gradient(90deg, #2a2d32, #1a1c1f)",
      }} />
      <div style={{
        position: "absolute", right: -2.5, top: height * 0.28,
        width: 3, height: height * 0.1, borderRadius: 2,
        background: "linear-gradient(270deg, #2a2d32, #1a1c1f)",
      }} />

      {/* Châssis */}
      <div style={{
        position: "absolute", inset: 0,
        borderRadius: radius,
        background: "linear-gradient(145deg, #3a3d42 0%, #1c1e22 40%, #0e0f11 100%)",
        boxShadow: `
          0 0 0 1px rgba(255,255,255,0.08),
          0 24px 48px rgba(0,0,0,0.35),
          0 8px 16px rgba(53,93,163,0.18),
          inset 0 1px 1px rgba(255,255,255,0.12)
        `,
        padding: bezel,
      }}>
        {/* Écran */}
        <div style={{
          position: "relative", width: "100%", height: "100%",
          borderRadius: screenRadius, overflow: "hidden",
          background: darkStatus ? C.ink : C.white,
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.35)",
        }}>
          {/* Status bar + Dynamic Island */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, zIndex: 5,
            height: Math.round(width * 0.14),
            padding: `0 ${Math.round(width * 0.07)}px`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            pointerEvents: "none",
          }}>
            <span style={{
              fontSize: Math.round(width * 0.048), fontWeight: 600,
              color: darkStatus ? "#fff" : C.ink, fontFamily: FONT,
              letterSpacing: "-0.02em", minWidth: 36,
            }}>9:41</span>

            <div style={{
              position: "absolute", left: "50%", top: Math.round(width * 0.035),
              transform: "translateX(-50%)",
              width: islandW, height: islandH,
              background: "#000", borderRadius: islandH,
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
            }}>
              {/* Caméra */}
              <div style={{
                position: "absolute", right: islandH * 0.35, top: "50%",
                transform: "translateY(-50%)",
                width: islandH * 0.38, height: islandH * 0.38,
                borderRadius: "50%",
                background: "radial-gradient(circle at 35% 35%, #1a3a5c 0%, #0a1628 60%, #000 100%)",
              }} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 36, justifyContent: "flex-end" }}>
              {/* Signal */}
              <svg width={Math.round(width * 0.055)} height={Math.round(width * 0.04)} viewBox="0 0 17 12" fill={darkStatus ? "#fff" : C.ink}>
                <rect x="0" y="8" width="3" height="4" rx="0.6" />
                <rect x="4.5" y="5.5" width="3" height="6.5" rx="0.6" />
                <rect x="9" y="3" width="3" height="9" rx="0.6" />
                <rect x="13.5" y="0" width="3" height="12" rx="0.6" opacity="0.35" />
              </svg>
              {/* Wifi */}
              <svg width={Math.round(width * 0.055)} height={Math.round(width * 0.04)} viewBox="0 0 16 12" fill={darkStatus ? "#fff" : C.ink}>
                <path d="M8 9.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
                <path d="M4.2 7.2a5.4 5.4 0 017.6 0l-1.1 1.1a3.8 3.8 0 00-5.4 0L4.2 7.2z" opacity="0.7" />
                <path d="M1.5 4.5a9 9 0 0113 0l-1.1 1.1a7.4 7.4 0 00-10.8 0L1.5 4.5z" opacity="0.4" />
              </svg>
              {/* Batterie */}
              <div style={{
                width: Math.round(width * 0.08), height: Math.round(width * 0.038),
                border: `1.2px solid ${darkStatus ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.4)"}`,
                borderRadius: 3, padding: 1, position: "relative",
              }}>
                <div style={{
                  width: "75%", height: "100%", borderRadius: 1.5,
                  background: darkStatus ? "#fff" : C.ink,
                }} />
                <div style={{
                  position: "absolute", right: -3, top: "50%", transform: "translateY(-50%)",
                  width: 2, height: Math.round(width * 0.018), borderRadius: 1,
                  background: darkStatus ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.35)",
                }} />
              </div>
            </div>
          </div>

          {/* Contenu app */}
          <div style={{
            position: "absolute", inset: 0,
            paddingTop: Math.round(width * 0.14),
            paddingBottom: Math.round(width * 0.08),
            display: "flex", flexDirection: "column",
            overflow: "hidden",
          }}>
            {children}
          </div>

          {/* Home indicator */}
          <div style={{
            position: "absolute", bottom: Math.round(width * 0.025), left: "50%",
            transform: "translateX(-50%)", zIndex: 5,
            width: Math.round(width * 0.36), height: 4, borderRadius: 2,
            background: darkStatus ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.28)",
          }} />
        </div>
      </div>
    </div>
  );
}

function OnboardingMockup({ width = 240, step = 0 }) {
  const { t } = useTranslation("landing");
  const goals = [t("mock.goalTri"), t("mock.goalOw"), t("mock.goalTech"), t("mock.goalDiploma")];
  const weekdays = t("mock.weekdays", { returnObjects: true });
  const levels = [
    { label: t("mock.beginner"), vol: "1 200 – 2 000 m" },
    { label: t("mock.intermediate"), vol: "2 000 – 3 500 m" },
    { label: t("mock.advanced"), vol: "3 000 – 5 000 m" },
  ];
  const screens = [
    {
      stepLabel: t("mock.stepOf", { n: 1 }),
      title: t("mock.goalTitle"),
      body: (
        <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 7, background: C.bg, flex: 1 }}>
          {goals.map((label, i) => (
            <div key={label} style={{
              background: i === 0 ? C.primaryFix : C.white,
              border: `1.5px solid ${i === 0 ? C.accent : C.border}`,
              borderRadius: 12, padding: "11px 12px",
              fontFamily: FONT, fontSize: 12, fontWeight: 600,
              color: i === 0 ? C.primaryDeep : C.inkLight,
            }}>{label}</div>
          ))}
        </div>
      ),
    },
    {
      stepLabel: t("mock.stepOf", { n: 2 }),
      title: t("mock.dateTitle"),
      body: (
        <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10, background: C.bg, flex: 1 }}>
          <div style={{
            background: C.white, borderRadius: 14, border: `1.5px solid ${C.border}`,
            padding: "12px 14px", textAlign: "center",
          }}>
            <div style={{ fontSize: 10, color: C.outline, fontWeight: 700, letterSpacing: "0.06em", fontFamily: FONT, marginBottom: 4 }}>{t("mock.event")}</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: Math.round(width * 0.1), fontWeight: 800, color: C.ink, textTransform: "uppercase" }}>{t("mock.eventDate")}</div>
            <div style={{ marginTop: 6, fontSize: 12, color: C.primary, fontWeight: 600, fontFamily: FONT }}>{t("mock.inWeeks")}</div>
          </div>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4,
            background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: 10,
          }}>
            {(Array.isArray(weekdays) ? weekdays : ["L","M","M","J","V","S","D"]).map((d, i) => (
              <div key={`${d}${i}`} style={{ fontSize: 9, textAlign: "center", color: C.outline, fontFamily: FONT, fontWeight: 600 }}>{d}</div>
            ))}
            {Array.from({ length: 28 }, (_, i) => {
              const day = i + 1;
              const selected = day === 15;
              return (
                <div key={day} style={{
                  aspectRatio: "1", borderRadius: 8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontFamily: FONT, fontWeight: selected ? 700 : 500,
                  background: selected ? C.accent : "transparent",
                  color: selected ? C.accentText : C.inkLight,
                }}>{day}</div>
              );
            })}
          </div>
        </div>
      ),
    },
    {
      stepLabel: t("mock.stepOf", { n: 3 }),
      title: t("mock.levelTitle"),
      body: (
        <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8, background: C.bg, flex: 1 }}>
          {levels.map((row, i) => (
            <div key={row.label} style={{
              background: i === 1 ? C.primaryFix : C.white,
              border: `1.5px solid ${i === 1 ? C.accent : C.border}`,
              borderRadius: 14, padding: "12px 14px",
            }}>
              <div style={{
                fontFamily: FONT, fontSize: 13, fontWeight: 700,
                color: i === 1 ? C.primaryDeep : C.ink, marginBottom: 2,
              }}>{row.label}</div>
              <div style={{
                fontSize: 11, fontFamily: FONT,
                color: i === 1 ? C.primary : C.outline, fontWeight: 600,
              }}>{row.vol} {t("mock.perSession")}</div>
            </div>
          ))}
        </div>
      ),
    },
    {
      stepLabel: t("mock.stepOf", { n: 4 }),
      title: t("mock.freqTitle"),
      body: (
        <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10, background: C.bg, flex: 1 }}>
          <div style={{ fontSize: 11, color: C.secondary, fontFamily: FONT, textAlign: "center" }}>
            {t("mock.freqAsk")}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {[1, 2, 3, 4].map((n) => (
              <div key={n} style={{
                background: n === 3 ? C.primaryFix : C.white,
                border: `1.5px solid ${n === 3 ? C.accent : C.border}`,
                borderRadius: 14, padding: "16px 10px", textAlign: "center",
              }}>
                <div style={{
                  fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 800,
                  color: n === 3 ? C.primaryDeep : C.ink, lineHeight: 1,
                }}>{n}</div>
                <div style={{
                  fontSize: 10, marginTop: 4, fontFamily: FONT, fontWeight: 600,
                  color: n === 3 ? C.primary : C.outline,
                }}>{n === 1 ? t("mock.sessionOne") : t("mock.sessionMany")}</div>
              </div>
            ))}
          </div>
          <div style={{
            background: C.white, borderRadius: 12, border: `1px solid ${C.border}`,
            padding: "10px 12px", fontSize: 11, color: C.inkLight, fontFamily: FONT, lineHeight: 1.4,
          }}>
            {t("mock.freqHint")}
          </div>
        </div>
      ),
    },
  ];

  const screen = screens[Math.min(Math.max(step, 0), screens.length - 1)];

  return (
    <PhoneFrame width={width} darkStatus>
      <div style={{ background: C.ink, padding: "10px 14px 12px", flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", letterSpacing: "0.08em", fontFamily: FONT, marginBottom: 4 }}>{screen.stepLabel}</div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: Math.round(width * 0.09), fontWeight: 800, color: C.white, textTransform: "uppercase", lineHeight: 1.05 }}>{screen.title}</div>
      </div>
      {screen.body}
    </PhoneFrame>
  );
}

function SessionMockup({ width = 260 }) {
  const { t } = useTranslation("landing");
  return (
    <PhoneFrame width={width} darkStatus>
      <div style={{ background: C.ink, padding: "10px 14px 12px", flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", letterSpacing: "0.08em", fontFamily: FONT, marginBottom: 3 }}>{t("mock.weekSession")}</div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: Math.round(width * 0.09), fontWeight: 800, color: C.white, textTransform: "uppercase", lineHeight: 1 }}>{t("mock.endurance")}</div>
        <div style={{ marginTop: 5, fontSize: 12, color: C.accent, fontWeight: 600, fontFamily: FONT }}>{t("mock.sessionMeta")}</div>
      </div>
      <div style={{ background: C.bg, padding: "10px 10px 8px", display: "flex", flexDirection: "column", gap: 7, flex: 1, overflow: "hidden" }}>
        {[
          { label: t("mock.warm"), text: t("mock.warmText") },
          { label: t("mock.main"), text: t("mock.mainText") },
          { label: t("mock.cool"), text: t("mock.coolText") },
        ].map((b) => (
          <div key={b.label} style={{ background: C.white, borderRadius: 11, padding: "9px 11px", border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.primary, letterSpacing: "0.06em", marginBottom: 2, fontFamily: FONT }}>{b.label.toUpperCase()}</div>
            <div style={{ fontSize: 11, color: C.inkLight, lineHeight: 1.35, fontFamily: FONT }}>{b.text}</div>
          </div>
        ))}
        <div style={{ fontSize: 10, color: C.secondary, fontFamily: FONT, lineHeight: 1.4, padding: "2px 2px 0" }}>
          {t("mock.coachTip")}
        </div>
      </div>
    </PhoneFrame>
  );
}

// ── 1. Hero ────────────────────────────────────────────────────────────────
function Hero() {
  const { t } = useTranslation("landing");
  const isMobile = useIsMobile();
  return (
    <section style={{
      position: "relative",
      minHeight: "100svh",
      display: "flex",
      alignItems: "center",
      overflow: "hidden",
      padding: isMobile ? "88px 20px 48px" : "96px 24px 64px",
      // TODO: remplacer par un vrai visuel piscine/eau libre (WebP) quand l'asset sera prêt
      background: `
        linear-gradient(180deg, rgba(12,26,46,0.72) 0%, rgba(21,67,136,0.55) 45%, rgba(12,26,46,0.78) 100%),
        radial-gradient(ellipse 80% 60% at 20% 30%, rgba(142,179,255,0.35), transparent 55%),
        radial-gradient(ellipse 70% 50% at 90% 70%, rgba(0,151,167,0.25), transparent 50%),
        linear-gradient(160deg, #0a3d62 0%, #154388 40%, #0c1a2e 100%)
      `,
    }}>
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.18,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%238eb3ff' d='M0,160L48,170.7C96,181,192,203,288,197.3C384,192,480,160,576,154.7C672,149,768,171,864,186.7C960,203,1056,213,1152,197.3C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat", backgroundPosition: "bottom", backgroundSize: "cover",
      }} />

      <div style={{
        maxWidth: 1120, margin: "0 auto", width: "100%",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1.05fr 0.95fr",
        gap: isMobile ? 40 : 48,
        alignItems: "center",
        position: "relative",
        zIndex: 1,
      }}>
        <div style={{ textAlign: isMobile ? "center" : "left" }}>
          <div style={{ margin: "0 0 18px", display: "flex", justifyContent: isMobile ? "center" : "flex-start" }}>
            <BrandLogo variant="wordmark" height={isMobile ? 28 : 36} onDark />
          </div>

          <h1 style={{
            fontFamily: FONT_DISPLAY, fontWeight: 800,
            fontSize: "clamp(36px, 5.5vw, 60px)",
            color: C.white, lineHeight: 0.98,
            margin: "0 0 18px", textTransform: "uppercase",
          }}>
            {t("hero.titleLine1")}<br />
            <span style={{ color: C.accent }}>{t("hero.titleAccent")}</span>
          </h1>

          <p style={{
            color: "rgba(255,255,255,0.72)", fontSize: isMobile ? 15 : 17,
            lineHeight: 1.65, marginBottom: 28, maxWidth: 460,
            fontFamily: FONT,
            marginLeft: isMobile ? "auto" : 0, marginRight: isMobile ? "auto" : 0,
          }}>
            {t("hero.subtitle")}
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: isMobile ? "center" : "flex-start", flexWrap: "wrap", marginBottom: 12 }}>
            <PrimaryCta>
              {t("hero.cta")} <ArrowRight size={16} />
            </PrimaryCta>
          </div>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, fontFamily: FONT, marginBottom: 28 }}>
            {t("hero.freeNote")}
          </p>

          {/* Preuve produit — mécanique type palmarès mymoto, faits MySWYM */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: isMobile ? 8 : 16,
            maxWidth: isMobile ? "100%" : 420,
            margin: isMobile ? "0 auto" : 0,
            borderTop: "1px solid rgba(255,255,255,0.12)",
            paddingTop: 20,
          }}>
            {[
              { v: t("hero.proof1Value"), l: t("hero.proof1Label") },
              { v: t("hero.proof2Value"), l: t("hero.proof2Label") },
              { v: t("hero.proof3Value"), l: t("hero.proof3Label") },
            ].map((p) => (
              <div key={p.l} style={{ textAlign: isMobile ? "center" : "left" }}>
                <div style={{
                  fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: isMobile ? 22 : 26,
                  color: C.accent, lineHeight: 1, textTransform: "uppercase",
                }}>{p.v}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: FONT, marginTop: 4, lineHeight: 1.3 }}>{p.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          display: "flex", justifyContent: "center", alignItems: "flex-end",
          gap: isMobile ? 0 : 16, position: "relative",
          minHeight: isMobile ? 380 : 520,
          transform: isMobile ? "none" : "translateY(8px)",
        }}>
          <div style={{
            transform: isMobile
              ? "rotate(-8deg) translateX(18px) scale(0.92)"
              : "rotate(-7deg) translateY(28px)",
            transformOrigin: "bottom center",
            zIndex: 1,
          }}>
            <OnboardingMockup width={isMobile ? 168 : 230} />
          </div>
          <div style={{
            transform: isMobile
              ? "rotate(6deg) translateX(-18px) scale(0.98)"
              : "rotate(5deg) translateY(0)",
            transformOrigin: "bottom center",
            zIndex: 2,
          }}>
            <SessionMockup width={isMobile ? 180 : 250} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 2. Pourquoi MySWYM ─────────────────────────────────────────────────────
function WhyMyswym() {
  const { t } = useTranslation("landing");
  const isMobile = useIsMobile();
  const benefits = [
    {
      icon: Layers,
      title: t("why.b1Title"),
      stat: t("why.b1Stat"),
      desc: t("why.b1Desc"),
    },
    {
      icon: Dumbbell,
      title: t("why.b2Title"),
      stat: t("why.b2Stat"),
      desc: t("why.b2Desc"),
    },
    {
      icon: Timer,
      title: t("why.b3Title"),
      stat: t("why.b3Stat"),
      desc: t("why.b3Desc"),
    },
    {
      icon: Zap,
      title: t("why.b4Title"),
      stat: t("why.b4Stat"),
      desc: t("why.b4Desc"),
    },
  ];

  return (
    <section id="pourquoi" style={{ background: C.bg, padding: "clamp(56px,8vw,96px) 20px" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 40 }}>
          <SectionLabel text={t("why.label")} />
          <h2 style={{
            fontFamily: FONT_DISPLAY, fontSize: "clamp(32px, 4.5vw, 48px)",
            fontWeight: 800, color: C.ink, margin: "0 0 12px", textTransform: "uppercase",
          }}>
            {t("why.title")}
          </h2>
          <p style={{ color: C.inkLight, fontSize: 16, maxWidth: 440, margin: "0 auto", fontFamily: FONT, lineHeight: 1.6 }}>
            {t("why.subtitle")}
          </p>
        </FadeIn>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
          gap: 14,
        }}>
          {benefits.map((b, i) => (
            <FadeIn key={b.title} delay={i * 0.08}>
              <div style={{
                background: C.white, border: `1px solid ${C.border}`,
                borderRadius: 24, overflow: "hidden", height: "100%",
                boxShadow: C.shadow, display: "flex", flexDirection: "column",
              }}>
                <div style={{
                  height: isMobile ? 120 : 140,
                  background: `linear-gradient(135deg, ${C.primaryDeep} 0%, ${C.primary} 50%, ${C.accent} 100%)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative",
                }}>
                  <b.icon size={36} color="rgba(255,255,255,0.9)" strokeWidth={1.5} />
                  <span style={{
                    position: "absolute", bottom: 10, right: 12,
                    fontSize: 10, color: "rgba(255,255,255,0.5)", fontFamily: FONT, fontWeight: 600,
                  }}>
                    {t("why.uiPreview")}
                  </span>
                </div>
                <div style={{ padding: "20px 22px 22px" }}>
                  <h3 style={{ fontFamily: FONT, fontSize: 17, fontWeight: 700, color: C.ink, margin: "0 0 6px" }}>{b.title}</h3>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.primary, margin: "0 0 8px", fontFamily: FONT }}>{b.stat}</p>
                  <p style={{ color: C.inkLight, fontSize: 14, lineHeight: 1.55, margin: 0, fontFamily: FONT }}>{b.desc}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── 3. Comment ça marche ───────────────────────────────────────────────────
function HowItWorks() {
  const { t } = useTranslation("landing");
  const isMobile = useIsMobile();
  const [active, setActive] = useState(0);

  const steps = [
    {
      n: "01",
      icon: Target,
      title: t("how.s1Title"),
      desc: t("how.s1Desc"),
    },
    {
      n: "02",
      icon: Calendar,
      title: t("how.s2Title"),
      desc: t("how.s2Desc"),
    },
    {
      n: "03",
      icon: Gauge,
      title: t("how.s3Title"),
      desc: t("how.s3Desc"),
    },
    {
      n: "04",
      icon: Clock,
      title: t("how.s4Title"),
      desc: t("how.s4Desc"),
    },
  ];

  const step = steps[active];

  return (
    <section id="how" style={{ background: C.bgSoft, padding: "clamp(56px,8vw,96px) 20px" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 40 }}>
          <SectionLabel text={t("how.label")} />
          <h2 style={{
            fontFamily: FONT_DISPLAY, fontSize: "clamp(32px, 4.5vw, 48px)",
            fontWeight: 800, color: C.ink, margin: "0 0 12px", textTransform: "uppercase",
          }}>
            {t("how.title")}
          </h2>
          <p style={{ color: C.inkLight, fontSize: 16, maxWidth: 420, margin: "0 auto", fontFamily: FONT, lineHeight: 1.6 }}>
            {t("how.subtitle")}
          </p>
        </FadeIn>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: isMobile ? 24 : 48,
          alignItems: "center",
        }}>
          {isMobile && (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
              <div style={{ position: "relative" }} key={active}>
                <OnboardingMockup width={200} step={active} />
                <div style={{
                  position: "absolute", bottom: -14, left: "50%", transform: "translateX(-50%)",
                  background: C.ink, color: C.white, fontSize: 12, fontWeight: 600,
                  padding: "8px 14px", borderRadius: 100, fontFamily: FONT, whiteSpace: "nowrap",
                  boxShadow: C.shadowMd, display: "flex", alignItems: "center", gap: 6, zIndex: 3,
                }}>
                  <step.icon size={12} />
                  {step.title}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {steps.map((s, i) => {
              const isActive = active === i;
              return (
                <button
                  key={s.n}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-pressed={isActive}
                  style={{
                    textAlign: "left", cursor: "pointer",
                    background: isActive ? C.white : "transparent",
                    border: `1.5px solid ${isActive ? C.accent : C.border}`,
                    borderRadius: 18, padding: isMobile ? "14px 16px" : "16px 18px",
                    boxShadow: isActive ? C.shadow : "none",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                      background: isActive ? C.primaryFix : C.bgCard,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 16,
                      color: isActive ? C.primary : C.outline,
                    }}>{s.n}</div>
                    <div>
                      <h3 style={{ fontFamily: FONT, fontSize: 16, fontWeight: 700, color: C.ink, margin: "0 0 4px" }}>{s.title}</h3>
                      {isActive && (
                        <p style={{ color: C.inkLight, fontSize: 13, lineHeight: 1.6, margin: 0, fontFamily: FONT }}>{s.desc}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {!isMobile && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ position: "relative" }} key={active}>
                <OnboardingMockup width={240} step={active} />
                <div style={{
                  position: "absolute", bottom: -14, left: "50%", transform: "translateX(-50%)",
                  background: C.ink, color: C.white, fontSize: 12, fontWeight: 600,
                  padding: "8px 14px", borderRadius: 100, fontFamily: FONT, whiteSpace: "nowrap",
                  boxShadow: C.shadowMd, display: "flex", alignItems: "center", gap: 6, zIndex: 3,
                }}>
                  <step.icon size={12} />
                  {step.title}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── 4. Aperçu d'une séance ─────────────────────────────────────────────────
function SessionPreview() {
  const { t } = useTranslation("landing");
  const isMobile = useIsMobile();
  const blocks = [
    { label: t("session.warmLabel"), color: "#34C759", content: t("session.warmContent") },
    { label: t("session.mainLabel"), color: C.primary, content: t("session.mainContent") },
    { label: t("session.coolLabel"), color: C.outline, content: t("session.coolContent") },
  ];

  return (
    <section id="seance" style={{ background: C.bg, padding: "clamp(56px,8vw,96px) 20px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 40 }}>
          <SectionLabel text={t("session.label")} />
          <h2 style={{
            fontFamily: FONT_DISPLAY, fontSize: "clamp(32px, 4.5vw, 48px)",
            fontWeight: 800, color: C.ink, margin: "0 0 12px", textTransform: "uppercase",
          }}>
            {t("session.title")}
          </h2>
          <p style={{ color: C.inkLight, fontSize: 16, maxWidth: 460, margin: "0 auto", fontFamily: FONT, lineHeight: 1.6 }}>
            {t("session.subtitle")}
          </p>
        </FadeIn>

        <FadeIn>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "280px 1fr",
            gap: 24, alignItems: "center",
          }}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <SessionMockup width={isMobile ? 210 : 250} />
            </div>

            <div style={{
              background: C.white, border: `1.5px solid ${C.border}`,
              borderRadius: 24, padding: isMobile ? 20 : 28, boxShadow: C.shadow,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
                <div style={{ background: C.primaryFix, borderRadius: 12, padding: "6px 12px" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.primary, fontFamily: FONT }}>{t("session.type")}</span>
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <div style={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: C.ink }}>{t("session.heading")}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.secondary, fontFamily: FONT }}>{t("session.meta")}</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {blocks.map((block) => (
                  <div key={block.label} style={{
                    background: C.bgCard, borderLeft: `3px solid ${block.color}`,
                    borderRadius: "0 14px 14px 0", padding: "14px 16px",
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: block.color, letterSpacing: "0.04em", marginBottom: 4, fontFamily: FONT }}>{block.label}</div>
                    <div style={{ fontSize: 15, color: C.inkLight, lineHeight: 1.55, fontFamily: FONT }}>{block.content}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: C.primaryFix, borderRadius: 14, padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <Zap size={14} color={C.primary} style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 13, color: C.inkLight, lineHeight: 1.6, fontFamily: FONT }}>
                  {t("session.tip")}
                </span>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ── Coach / manifeste (inspiration mymoto : voix perso + preuve sociale réelle) ─
function CoachSection() {
  const { t } = useTranslation("landing");
  const isMobile = useIsMobile();

  return (
    <section id="coach" style={{ background: C.night, padding: "clamp(56px,8vw,96px) 20px" }}>
      <div style={{
        maxWidth: 960, margin: "0 auto",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1.1fr 0.9fr",
        gap: isMobile ? 32 : 48,
        alignItems: "center",
      }}>
        <FadeIn>
          <SectionLabel text={t("coach.label")} dark />
          <p style={{
            color: C.accent, fontSize: 13, fontWeight: 700, fontFamily: FONT,
            letterSpacing: "0.04em", margin: "0 0 12px",
          }}>{t("coach.eyebrow")}</p>
          <h2 style={{
            fontFamily: FONT_DISPLAY, fontSize: "clamp(32px, 4.5vw, 48px)",
            fontWeight: 800, color: C.white, margin: "0 0 16px", textTransform: "uppercase", lineHeight: 1.02,
          }}>
            {t("coach.titleLine1")}<br />{t("coach.titleLine2")}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, lineHeight: 1.65, margin: "0 0 20px", fontFamily: FONT }}>
            {t("coach.body")}
          </p>
          <a
            href={t("coach.igHref")}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: C.accent, color: C.accentText, fontWeight: 700,
              fontSize: 15, fontFamily: FONT, padding: "13px 22px",
              borderRadius: 14, textDecoration: "none", minHeight: 48,
            }}
          >
            {t("coach.igCta")} <ArrowRight size={16} />
          </a>
        </FadeIn>

        <FadeIn delay={0.1}>
          <blockquote style={{
            margin: 0,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderLeft: `4px solid ${C.accent}`,
            borderRadius: 20, padding: isMobile ? "24px 20px" : "32px 28px",
          }}>
            <p style={{
              fontFamily: FONT_DISPLAY, fontSize: "clamp(22px, 3vw, 28px)",
              fontWeight: 700, color: C.white, lineHeight: 1.25,
              margin: 0, textTransform: "uppercase",
            }}>
              “{t("coach.quote")}”
            </p>
          </blockquote>
        </FadeIn>
      </div>
    </section>
  );
}

// ── Inclus (grille type offres mymoto) ──────────────────────────────────────
function Includes() {
  const { t } = useTranslation("landing");
  const isMobile = useIsMobile();
  const items = [
    { title: t("includes.i1Title"), desc: t("includes.i1Desc"), badge: "trial" },
    { title: t("includes.i2Title"), desc: t("includes.i2Desc"), badge: "trial" },
    { title: t("includes.i3Title"), desc: t("includes.i3Desc"), badge: "trial" },
    { title: t("includes.i4Title"), desc: t("includes.i4Desc"), badge: "prem" },
    { title: t("includes.i5Title"), desc: t("includes.i5Desc"), badge: "prem" },
    { title: t("includes.i6Title"), desc: t("includes.i6Desc"), badge: "prem" },
  ];

  return (
    <section id="inclus" style={{ background: C.bg, padding: "clamp(56px,8vw,96px) 20px" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 40 }}>
          <SectionLabel text={t("includes.label")} />
          <h2 style={{
            fontFamily: FONT_DISPLAY, fontSize: "clamp(32px, 4.5vw, 48px)",
            fontWeight: 800, color: C.ink, margin: "0 0 12px", textTransform: "uppercase",
          }}>
            {t("includes.title")}
          </h2>
          <p style={{ color: C.inkLight, fontSize: 16, maxWidth: 480, margin: "0 auto", fontFamily: FONT, lineHeight: 1.6 }}>
            {t("includes.subtitle")}
          </p>
        </FadeIn>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: 12,
        }}>
          {items.map((item, i) => (
            <FadeIn key={item.title} delay={i * 0.05}>
              <div style={{
                background: C.white, border: `1px solid ${C.border}`,
                borderRadius: 20, padding: "22px 20px", height: "100%",
                boxShadow: C.shadow, boxSizing: "border-box",
              }}>
                <div style={{
                  display: "inline-flex", marginBottom: 12,
                  background: item.badge === "prem" ? C.primaryFix : C.bgCard,
                  color: item.badge === "prem" ? C.primary : C.secondary,
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                  padding: "4px 10px", borderRadius: 100, fontFamily: FONT,
                }}>
                  {item.badge === "prem" ? t("includes.badgePrem") : t("includes.badgeTrial")}
                </div>
                <h3 style={{ fontFamily: FONT, fontSize: 16, fontWeight: 700, color: C.ink, margin: "0 0 8px" }}>{item.title}</h3>
                <p style={{ color: C.inkLight, fontSize: 14, lineHeight: 1.55, margin: 0, fontFamily: FONT }}>{item.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn style={{ textAlign: "center", marginTop: 32 }}>
          <PrimaryCta>
            {t("hero.cta")} <ArrowRight size={16} />
          </PrimaryCta>
        </FadeIn>
      </div>
    </section>
  );
}

// ── 5. Confiance / crédibilité ─────────────────────────────────────────────
function Trust() {
  const { t } = useTranslation("landing");
  const isMobile = useIsMobile();
  const points = [
    {
      icon: Shield,
      title: t("trust.p1Title"),
      desc: t("trust.p1Desc"),
    },
    {
      icon: Layers,
      title: t("trust.p2Title"),
      desc: t("trust.p2Desc"),
    },
    {
      icon: Waves,
      title: t("trust.p3Title"),
      desc: t("trust.p3Desc"),
    },
  ];

  return (
    <section id="confiance" style={{ background: C.night, padding: "clamp(56px,8vw,96px) 20px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 40 }}>
          <SectionLabel text={t("trust.label")} dark />
          <h2 style={{
            fontFamily: FONT_DISPLAY, fontSize: "clamp(32px, 4.5vw, 48px)",
            fontWeight: 800, color: C.white, margin: "0 0 12px", textTransform: "uppercase",
          }}>
            {t("trust.titleLine1")}<br />{t("trust.titleLine2")}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 16, maxWidth: 480, margin: "0 auto", fontFamily: FONT, lineHeight: 1.6 }}>
            {t("trust.subtitle")}
          </p>
        </FadeIn>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: 14,
        }}>
          {points.map((p, i) => (
            <FadeIn key={p.title} delay={i * 0.08}>
              <div style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 20, padding: "22px 20px", height: "100%",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14, marginBottom: 14,
                  background: "rgba(142,179,255,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <p.icon size={20} color={C.accent} />
                </div>
                <h3 style={{ fontFamily: FONT, fontSize: 16, fontWeight: 700, color: C.white, margin: "0 0 8px" }}>{p.title}</h3>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 1.6, margin: 0, fontFamily: FONT }}>{p.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── 6. Tarif / Freemium (toggle annuel/mensuel façon mymoto) ────────────────
function Pricing() {
  const { t } = useTranslation("landing");
  const isMobile = useIsMobile();
  const [billing, setBilling] = useState("annual"); // annual | monthly
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
      alert("Coche les cases CGV et rétractation avant de continuer.");
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

  const freeFeatures = [
    t("pricing.freeF1"),
    t("pricing.freeF2"),
    t("pricing.freeF3"),
    t("pricing.freeF4"),
  ];
  const premiumFeatures = [
    t("pricing.premF1"),
    t("pricing.premF2"),
    t("pricing.premF3"),
    t("pricing.premF4"),
    t("pricing.premF5"),
  ];

  const isAnnual = billing === "annual";
  const priceId = isAnnual ? PRICE_ANNUAL : PRICE_MONTHLY;
  const displayPrice = isAnnual ? "3,33€" : PRICE_MONTHLY_LABEL;

  return (
    <section id="pricing" style={{ background: C.bgSoft, padding: "clamp(56px,8vw,96px) 20px" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 28 }}>
          <SectionLabel text={t("pricing.label")} />
          <h2 style={{
            fontFamily: FONT_DISPLAY, fontSize: "clamp(32px, 4.5vw, 48px)",
            fontWeight: 800, color: C.ink, margin: "0 0 12px", textTransform: "uppercase",
          }}>
            {t("pricing.titleLine1")}<br />{t("pricing.titleLine2")}
          </h2>
          <p style={{ color: C.secondary, fontSize: 16, fontFamily: FONT, marginBottom: 20 }}>
            {t("pricing.subtitle")}
          </p>

          <div style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            background: C.white, border: `1.5px solid ${C.border}`,
            borderRadius: 100, padding: 4, boxShadow: C.shadow,
          }}>
            {[
              { id: "annual", label: t("pricing.billingAnnual") },
              { id: "monthly", label: t("pricing.billingMonthly") },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setBilling(opt.id)}
                style={{
                  border: "none", cursor: "pointer", fontFamily: FONT,
                  fontWeight: 700, fontSize: 13, padding: "10px 18px",
                  borderRadius: 100, minHeight: 40,
                  background: billing === opt.id ? C.ink : "transparent",
                  color: billing === opt.id ? C.white : C.secondary,
                  transition: "all 0.2s",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {isAnnual && (
            <p style={{ color: C.primary, fontSize: 13, fontWeight: 700, fontFamily: FONT, marginTop: 12 }}>
              {t("pricing.saveUpTo")}
            </p>
          )}
        </FadeIn>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 16, alignItems: "stretch",
        }}>
          <FadeIn>
            <div style={{
              background: C.white, border: `1px solid ${C.border}`,
              borderRadius: 28, padding: isMobile ? 24 : 32, boxShadow: C.shadow,
              height: "100%", display: "flex", flexDirection: "column",
            }}>
              <div style={{ fontFamily: FONT, fontSize: 22, fontWeight: 800, color: C.ink, marginBottom: 4 }}>{t("pricing.freeTitle")}</div>
              <div style={{ fontSize: 40, fontFamily: FONT, fontWeight: 800, color: C.ink, margin: "12px 0 4px" }}>{t("pricing.freePrice")}</div>
              <div style={{ color: C.secondary, fontSize: 13, marginBottom: 22, fontFamily: FONT }}>
                {t("pricing.freeMeta")}
              </div>
              <a href={CTA_HREF} style={{
                display: "block", textAlign: "center",
                border: `1.5px solid ${C.outlineVar}`, color: C.ink,
                background: C.bgCard, fontWeight: 600, fontSize: 15,
                padding: "13px", borderRadius: 16, textDecoration: "none",
                marginBottom: 22, fontFamily: FONT, minHeight: 48, boxSizing: "border-box",
              }}>
                {t("pricing.freeCta")}
              </a>
              <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: "auto" }}>
                {freeFeatures.map((f) => (
                  <div key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <Check size={15} color={C.outline} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ color: C.secondary, fontSize: 14, fontFamily: FONT }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div style={{
              background: C.ink, borderRadius: 28, padding: isMobile ? 24 : 32,
              boxShadow: "0 20px 60px rgba(25,28,30,0.18)",
              height: "100%", display: "flex", flexDirection: "column", position: "relative",
            }}>
              <div style={{
                position: "absolute", top: -12, right: 24,
                background: C.accent, color: C.accentText, fontSize: 11, fontWeight: 700,
                padding: "4px 14px", borderRadius: 100, letterSpacing: "0.05em", fontFamily: FONT,
              }}>{t("pricing.recommended")}</div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, gap: 8 }}>
                <div style={{ fontFamily: FONT, fontSize: 22, fontWeight: 800, color: C.white }}>{t("pricing.subTitle")}</div>
                {isAnnual && (
                  <div style={{ background: "#22C55E", color: C.white, fontSize: 12, fontWeight: 800, padding: "4px 10px", borderRadius: 8, fontFamily: FONT }}>
                    {t("pricing.saveBadge")}
                  </div>
                )}
              </div>

              {isAnnual && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 16, color: "rgba(255,255,255,0.3)", textDecoration: "line-through", fontFamily: FONT }}>{PRICE_MONTHLY_LABEL}</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: FONT }}>{t("pricing.perMonth")}</span>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, margin: "8px 0 4px" }}>
                <span style={{ fontSize: 40, fontFamily: FONT, fontWeight: 800, color: C.white, lineHeight: 1 }}>{displayPrice}</span>
                <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, marginBottom: 6, fontFamily: FONT }}>{t("pricing.perMonth")}</span>
              </div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 22, fontFamily: FONT }}>
                {isAnnual
                  ? t("pricing.billedAnnual", { price: PRICE_ANNUAL_LABEL })
                  : t("pricing.billedMonthly")}
              </div>

              {isLoggedIn && (
                <div
                  id="landing-checkout-legal-gates"
                  style={{
                    marginBottom: 16,
                    padding: 12,
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.95)",
                  }}
                >
                  <CheckoutLegalGates
                    acceptTerms={acceptTerms}
                    onAcceptTerms={setAcceptTerms}
                    acceptWithdrawal={acceptWithdrawal}
                    onAcceptWithdrawal={setAcceptWithdrawal}
                    ink={C.ink}
                  />
                </div>
              )}

              <PrimaryCta
                onClick={() => handlePremium(priceId)}
                style={{ width: "100%", marginBottom: 22, boxSizing: "border-box" }}
              >
                {t("pricing.unlockCta")}
              </PrimaryCta>

              <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: "auto" }}>
                {premiumFeatures.map((f) => (
                  <div key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <Check size={15} color={C.accent} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontFamily: FONT }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>

        <p style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: C.outline, fontFamily: FONT }}>
          {t("pricing.compareNote")}
        </p>
        <p style={{ textAlign: "center", marginTop: 8, fontSize: 13, color: C.outline, fontFamily: FONT }}>
          {t("pricing.moreLink")}{" "}
          <a href="/tarifs" style={{ color: C.primary, fontWeight: 600 }}>{t("pricing.moreLinkLabel")}</a>.
        </p>
      </div>
    </section>
  );
}

// ── 7. Avis utilisateurs ───────────────────────────────────────────────────
// TODO: à activer une fois les premiers avis disponibles (App Store, Play Store, ou bêta).
// Ne jamais inventer de fausses notes ni de faux témoignages.
// Pattern attendu : notes + cartes (nom, date, étoiles, citation courte).

// ── 8. FAQ ─────────────────────────────────────────────────────────────────
function FAQ() {
  const { t } = useTranslation("landing");
  const [open, setOpen] = useState(null);
  const items = [
    { q: t("faq.q1"), a: t("faq.a1") },
    { q: t("faq.q2"), a: t("faq.a2") },
    { q: t("faq.q3"), a: t("faq.a3") },
    { q: t("faq.q4"), a: t("faq.a4") },
  ];

  return (
    <section id="faq" style={{ background: C.bg, padding: "clamp(56px,8vw,96px) 20px" }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 40 }}>
          <SectionLabel text={t("faq.label")} />
          <h2 style={{
            fontFamily: FONT_DISPLAY, fontSize: "clamp(32px, 4.5vw, 48px)",
            fontWeight: 800, color: C.ink, margin: 0, textTransform: "uppercase",
          }}>
            {t("faq.title")}
          </h2>
        </FadeIn>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <FadeIn key={item.q} delay={i * 0.04}>
                <div style={{
                  background: isOpen ? C.bgSoft : C.white,
                  border: `1px solid ${isOpen ? `${C.accent}60` : C.border}`,
                  borderRadius: 18, overflow: "hidden",
                  boxShadow: isOpen ? C.shadow : "none",
                  transition: "all 0.2s",
                }}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    style={{
                      width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "18px 22px", background: "none", border: "none", cursor: "pointer",
                      textAlign: "left", gap: 16, minHeight: 56,
                    }}
                  >
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

// ── 9. CTA final ───────────────────────────────────────────────────────────
function FinalCTA() {
  const { t } = useTranslation("landing");
  return (
    <section style={{ background: C.night, padding: "clamp(56px,8vw,96px) 20px", textAlign: "center" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <FadeIn>
          <div style={{ margin: "0 0 16px", display: "flex", justifyContent: "center" }}>
            <BrandLogo variant="wordmark" height={28} onDark />
          </div>
          <h2 style={{
            fontFamily: FONT_DISPLAY, fontSize: "clamp(34px, 5vw, 52px)",
            fontWeight: 800, color: C.white, margin: "0 0 16px", textTransform: "uppercase",
          }}>
            {t("finalCta.titleLine1")}<br />{t("finalCta.titleLine2")}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 16, lineHeight: 1.65, marginBottom: 28, fontFamily: FONT }}>
            {t("finalCta.subtitle")}
          </p>
          <PrimaryCta>
            {t("finalCta.cta")} <ArrowRight size={18} />
          </PrimaryCta>
          <p style={{
            color: "rgba(255,255,255,0.35)", fontSize: 13, fontFamily: FONT,
            marginTop: 20, fontStyle: "italic",
          }}>
            {t("finalCta.signoff")}
          </p>
        </FadeIn>
      </div>
    </section>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function Landing() {
  const { t, i18n } = useTranslation("landing");

  useEffect(() => {
    track("landing_viewed", { source: "accueil" }, { onceKey: "landing_viewed" });
  }, []);

  useEffect(() => {
    document.title = t("meta.title");
    document.body.style.background = C.bg;
    document.body.style.fontFamily = FONT;

    const scrollToTarget = () => {
      const path = window.location.pathname;
      const hash = window.location.hash?.replace("#", "");
      const sectionId = hash
        || (path === "/comment-ca-marche" ? "how"
          : path === "/objectifs" ? "pourquoi"
          : path === "/conformite" ? "seance"
          : null);
      if (!sectionId) return;
      requestAnimationFrame(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    };

    scrollToTarget();
    window.addEventListener("hashchange", scrollToTarget);
    return () => window.removeEventListener("hashchange", scrollToTarget);
  }, [t, i18n.language]);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: FONT }}>
      <FontLoader />
      <PublicNav />
      <Hero />
      <WhyMyswym />
      <HowItWorks />
      <SessionPreview />
      <CoachSection />
      <Includes />
      <Trust />
      <Pricing />
      {/* Reviews : section commentée — activer dès les premiers avis réels */}
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}
