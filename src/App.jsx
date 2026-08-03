import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "./supabase.js";
import { loadSessionTemplates } from "./lib/session-templates-store.js";
import { buildCoachPlanWeeks, shouldUseCoachGenerator, buildCompetitionSessions, competitionSessionCount, COMPETITION_TIP } from "./lib/swim-plan-bridge.js";
import {
  blankTaste,
  normalizeTaste,
  applySessionFeedbackToTaste,
  applyWeekFeedbackToTaste,
  mergeTasteProfiles,
} from "./lib/user-taste.js";
import {
  appZoneMultForT100,
  calcDistanceProjection,
  maxPaceGainFromT100,
  projectedPaceAtWeek,
} from "./lib/swim-pace.js";

const AUTH_PATHS = { "/connexion": "password", "/inscription": "register" };
const isAuthPath = (pathname) => pathname in AUTH_PATHS;

const REF_STORAGE_KEY = "myswym_ref";
const captureReferralFromUrl = () => {
  try {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref?.trim()) localStorage.setItem(REF_STORAGE_KEY, ref.trim().toUpperCase());
  } catch { /* ignore */ }
};
const getStoredReferralCode = () => {
  try { return (localStorage.getItem(REF_STORAGE_KEY) || "").toUpperCase(); } catch { return ""; }
};
const resolveReferralCode = (user) => {
  const fromMeta = String(user?.user_metadata?.referred_by || "").toUpperCase();
  return fromMeta || getStoredReferralCode() || undefined;
};
import PublicNav from "./PublicNav.jsx";
import Footer from "./Footer.jsx";
import SupportBubble from "./SupportBubble.jsx";
import BrandLogo from "./BrandLogo.jsx";
import LanguageSwitcher from "./i18n/LanguageSwitcher.jsx";
import { useTranslation } from "react-i18next";
import {
  Waves, Flame, Star, Calendar, BarChart2, Award, Home,
  Ruler, Clock, Zap, Check, Lock, Trophy, Target,
  ChevronDown, ChevronUp, LogOut, Activity, User,
  Droplets, TrendingUp, Timer, RotateCcw, ArrowRight, Gauge, Settings, Shield, Plus, BookOpen, X, Copy, CheckCheck,
  Sun, Moon, Camera, Trash2,
} from "lucide-react";

// ── FONTS ─────────────────────────────────────────────────────────────────
const FontLoader = () => {
  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Lexend:wght@300;400;500;600;700;800;900&display=swap";
    document.head.appendChild(l);
  }, []);
  return null;
};

// ── DESIGN SYSTEM ─────────────────────────────────────────────────────────
const THEME_STORAGE_PREFIX = "myswym_theme_";
const THEME_LAST_KEY = "myswym_theme_last";
const THEME_LEGACY_KEY = "myswym_theme"; // ancien stockage global (migré)

const G_LIGHT = {
  bg: "#f8f9fc",
  surface: "#FFFFFF",
  ink: "#191c1e",
  inkLight: "#434751",
  inverse: "#FFFFFF",
  blue: "#355da3",
  blueLight: "#d8e2ff",
  blueMid: "#8eb3ff",
  blueDeep: "#154388",
  water: "#00B4D8",
  waterLight: "#E0F7FA",
  coral: "#FF4757",
  coralLight: "#FFE8EA",
  mint: "#00C48C",
  mintLight: "#E6FFF6",
  gold: "#F59E0B",
  goldLight: "#FEF3C7",
  purple: "#7C3AED",
  purpleLight: "#EDE9FE",
  grey: "#737782",
  greyMid: "#9CA3AF",
  greyLight: "#e1e2e5",
  greyXLight: "#f2f3f6",
  white: "#FFFFFF",
  glass: "rgba(255,255,255,0.95)",
  navGlass: "rgba(255,255,255,0.94)",
};

const G_DARK = {
  bg: "#0c0e12",
  surface: "#161a22",
  ink: "#f0f2f5",
  inkLight: "#c5c9d2",
  inverse: "#0c0e12",
  blue: "#7aa2ef",
  blueLight: "#1a2744",
  blueMid: "#8eb3ff",
  blueDeep: "#a8c5ff",
  water: "#22c3e0",
  waterLight: "#0c2a32",
  coral: "#FF6B78",
  coralLight: "#3a151a",
  mint: "#2dd4a0",
  mintLight: "#0c2a20",
  gold: "#FBBF24",
  goldLight: "#3a2a0a",
  purple: "#a78bfa",
  purpleLight: "#241a3d",
  grey: "#9aa0ad",
  greyMid: "#6b7280",
  greyLight: "#2a303c",
  greyXLight: "#1c212b",
  white: "#FFFFFF",
  glass: "rgba(12,14,18,0.92)",
  navGlass: "rgba(22,26,34,0.94)",
};

/** Palette active — mutée par applyTheme pour que les styles inline suivent le thème. */
const G = { ...G_LIGHT };

const normalizeTheme = (value) => (value === "dark" ? "dark" : "light");

const themeStorageKey = (userId) => `${THEME_STORAGE_PREFIX}${userId || "anon"}`;

const getStoredTheme = (userId = null) => {
  try {
    const scoped = localStorage.getItem(themeStorageKey(userId));
    if (scoped === "dark" || scoped === "light") return scoped;
    // Migration : ancien thème global → utile surtout pour l'anon / 1re connexion
    const legacy = localStorage.getItem(THEME_LEGACY_KEY);
    if (legacy === "dark" || legacy === "light") return legacy;
  } catch { /* ignore */ }
  return "light";
};

const resolveThemeForUser = (user) => {
  const fromMeta = user?.user_metadata?.theme;
  if (fromMeta === "dark" || fromMeta === "light") return fromMeta;
  try {
    const scoped = localStorage.getItem(themeStorageKey(user?.id || null));
    if (scoped === "dark" || scoped === "light") return scoped;
    // Nouveau compte / pas encore de préférence : hériter du thème anon / dernier utilisé
    if (user?.id) {
      const inherited = [
        localStorage.getItem(themeStorageKey(null)),
        localStorage.getItem(THEME_LAST_KEY),
        localStorage.getItem(THEME_LEGACY_KEY),
      ].find((v) => v === "dark" || v === "light");
      if (inherited) return inherited;
    }
  } catch { /* ignore */ }
  return getStoredTheme(user?.id || null);
};

const applyTheme = (theme, { userId = null, persist = true } = {}) => {
  const t = normalizeTheme(theme);
  const next = t === "dark" ? G_DARK : G_LIGHT;
  Object.assign(G, next);
  const root = document.documentElement;
  root.setAttribute("data-theme", t);
  root.style.colorScheme = t;
  root.style.setProperty("--myswym-bg", next.bg);
  root.style.setProperty("--myswym-surface", next.surface);
  root.style.setProperty("--myswym-ink", next.ink);
  root.style.setProperty("--myswym-blue", next.blue);
  root.style.setProperty("--myswym-grey-light", next.greyLight);
  root.style.setProperty("--myswym-nav-bg", next.navGlass);
  root.style.setProperty("--myswym-nav-border", next.greyLight);
  root.style.setProperty("--myswym-glass", next.glass);
  if (persist) {
    try {
      localStorage.setItem(themeStorageKey(userId), t);
      localStorage.setItem(THEME_LAST_KEY, t);
      localStorage.removeItem(THEME_LEGACY_KEY);
    } catch { /* ignore */ }
  }
  return t;
};

const persistThemeToAccount = (theme, user) => {
  const t = applyTheme(theme, { userId: user?.id || null, persist: true });
  if (user?.id) {
    supabase.auth.updateUser({ data: { theme: t } }).catch(() => {});
  }
  return t;
};

// Dernier thème affiché (évite un flash) — remplacé dès que le compte est connu
applyTheme((() => {
  try {
    return normalizeTheme(localStorage.getItem(THEME_LAST_KEY) || localStorage.getItem(THEME_LEGACY_KEY));
  } catch {
    return "light";
  }
})(), { persist: false });

// Pastels figés (lisibles sur fond clair et sombre) — ne pas lier à G mutable
const TYPE_META = {
  ENDURANCE:    { bg: G_LIGHT.blueLight,   color: G_LIGHT.blue,    Icon: Waves,    tooltip: "Nage à allure confortable — tu pourrais parler. C'est la base de toute progression." },
  SEUIL:        { bg: "#FFF3E0",           color: "#E65100",       Icon: Activity, tooltip: "Effort soutenu mais contrôlé — tu travailles à la limite de ton confort. Améliore ton endurance." },
  VITESSE:      { bg: G_LIGHT.coralLight,  color: G_LIGHT.coral,   Icon: Zap,      tooltip: "Sprints courts et intenses — récup complète entre chaque. Développe ta puissance." },
  TECHNIQUE:    { bg: G_LIGHT.waterLight,  color: "#0097A7",       Icon: Target,   tooltip: "On travaille la façon de nager — position, bras, jambes. Moins d'effort, plus d'efficacité." },
  RÉCUPÉRATION: { bg: G_LIGHT.mintLight,   color: "#00897B",       Icon: Droplets, tooltip: "Séance très légère pour récupérer. Bouge sans te fatiguer — c'est là que le corps progresse." },
};

const css = `
  :root {
    --myswym-bg: ${G_LIGHT.bg};
    --myswym-surface: ${G_LIGHT.surface};
    --myswym-ink: ${G_LIGHT.ink};
    --myswym-blue: ${G_LIGHT.blue};
    --myswym-grey-light: ${G_LIGHT.greyLight};
    --myswym-nav-bg: ${G_LIGHT.navGlass};
    --myswym-nav-border: ${G_LIGHT.greyLight};
    --myswym-glass: ${G_LIGHT.glass};
    --bottom-nav-h: 64px;
    --safe-bottom: env(safe-area-inset-bottom, 0px);
    --safe-top: env(safe-area-inset-top, 0px);
    --app-pad-x: 16px;
    --app-max: 100%;
    --sheet-max: 100%;
    --nav-lift: 0px;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { -webkit-text-size-adjust: 100%; }
  body {
    background: var(--myswym-bg);
    color: var(--myswym-ink);
    font-family: 'Lexend', sans-serif;
    overscroll-behavior: none;
    letter-spacing: 0.01em;
    -webkit-font-smoothing: antialiased;
    min-height: 100dvh;
    transition: background-color 0.25s ease, color 0.2s ease;
  }
  #root { min-height: 100dvh; }
  h1, h2, h3 { font-family: 'Barlow Condensed', sans-serif; letter-spacing: 0; text-transform: uppercase; font-weight: 800; }
  h4 { letter-spacing: -0.01em; }
  .syne { font-family: 'Barlow Condensed', sans-serif; letter-spacing: 0; font-weight: 800; text-transform: uppercase; }
  @keyframes fadeUp   { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
  @keyframes scaleIn  { from { opacity:0; transform:scale(0.9) } to { opacity:1; transform:scale(1) } }
  @keyframes pulse    { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
  @keyframes swim     { 0%{transform:translateX(-8px)} 50%{transform:translateX(8px)} 100%{transform:translateX(-8px)} }
  @keyframes badgePop { 0%{opacity:0;transform:scale(0) rotate(-15deg)} 70%{transform:scale(1.15) rotate(3deg)} 100%{opacity:1;transform:scale(1) rotate(0)} }
  @keyframes toastIn  { from{opacity:0;transform:translateY(20px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }
  .fade-up   { animation: fadeUp  0.45s ease both; }
  .fade-up-1 { animation: fadeUp  0.45s ease 0.08s both; }
  .fade-up-2 { animation: fadeUp  0.45s ease 0.16s both; }
  .fade-up-3 { animation: fadeUp  0.45s ease 0.24s both; }
  .scale-in  { animation: scaleIn 0.35s cubic-bezier(.175,.885,.32,1.275) both; }
  .swimmer   { animation: swim 2s ease-in-out infinite; display:inline-block; }
  .badge-pop { animation: badgePop 0.55s cubic-bezier(.175,.885,.32,1.275) both; }
  .toast-in  { animation: toastIn 0.4s cubic-bezier(.175,.885,.32,1.275) both; }
  input[type=date]::-webkit-calendar-picker-indicator { opacity: 0.4; cursor: pointer; }
  ::-webkit-scrollbar { width: 0; height: 0; }
  button { -webkit-tap-highlight-color: transparent; }
  button:active { transform: scale(0.97); transition: transform 0.1s; }
  input, textarea { -webkit-appearance: none; font-size: 16px; }

  /* Mobile-first app column — inchangé sur téléphone */
  .app-shell {
    width: 100%;
    max-width: var(--app-max);
    margin-left: auto;
    margin-right: auto;
    padding-left: var(--app-pad-x);
    padding-right: var(--app-pad-x);
  }
  .app-shell--flush {
    padding-left: 0;
    padding-right: 0;
  }
  .app-shell--flush > .app-shell-inner {
    padding-left: var(--app-pad-x);
    padding-right: var(--app-pad-x);
  }
  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background: var(--myswym-nav-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid var(--myswym-nav-border);
    padding-bottom: var(--safe-bottom);
  }
  .bottom-nav-inner {
    width: 100%;
    max-width: var(--app-max);
    margin: 0 auto;
    display: flex;
  }
  .app-toast {
    position: fixed;
    z-index: 300;
    left: max(16px, calc((100vw - var(--app-max)) / 2 + 16px));
    right: max(16px, calc((100vw - var(--app-max)) / 2 + 16px));
    bottom: calc(var(--bottom-nav-h) + var(--safe-bottom) + var(--nav-lift) + 16px);
  }
  .support-fab {
    position: fixed;
    z-index: 150;
    right: max(16px, calc((100vw - var(--app-max)) / 2 + 16px));
    bottom: calc(var(--bottom-nav-h) + var(--safe-bottom) + var(--nav-lift) + 16px);
  }
  .support-fab--bare {
    bottom: calc(16px + var(--safe-bottom));
  }
  .sheet-overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    background: rgba(0,0,0,0.55);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }
  .sheet-panel {
    width: 100%;
    max-width: var(--sheet-max);
    margin-left: auto;
    margin-right: auto;
  }
  .h-scroll {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding-bottom: 12px;
    padding-left: var(--app-pad-x);
    padding-right: var(--app-pad-x);
  }
  .h-scroll::-webkit-scrollbar { display: none; }
  .myswym-app {
    min-height: 100dvh;
    background: var(--myswym-bg);
  }
  .sticky-app-bar {
    position: sticky;
    top: 0;
    z-index: 40;
  }

  /* Tablette : même UX téléphone, colonne centrée + nav flottante */
  @media (min-width: 640px) {
    :root {
      --app-pad-x: 24px;
      --app-max: 480px;
      --sheet-max: 440px;
      --bottom-nav-h: 68px;
      --nav-lift: 14px;
    }
    body {
      background:
        radial-gradient(ellipse 80% 50% at 50% -10%, rgba(142,179,255,0.22), transparent 55%),
        radial-gradient(ellipse 60% 40% at 80% 100%, rgba(142,179,255,0.10), transparent 50%),
        var(--myswym-bg);
      background-attachment: fixed;
    }
    html[data-theme="dark"] body {
      background:
        radial-gradient(ellipse 80% 50% at 50% -10%, rgba(122,162,239,0.12), transparent 55%),
        radial-gradient(ellipse 60% 40% at 80% 100%, rgba(122,162,239,0.06), transparent 50%),
        var(--myswym-bg);
      background-attachment: fixed;
    }
    .sheet-overlay {
      justify-content: center;
      align-items: center;
      padding: 24px;
    }
    .sheet-panel {
      border-radius: 24px !important;
      max-height: min(88vh, 720px);
      overflow-y: auto;
      box-shadow: 0 24px 64px rgba(25,28,30,0.22);
    }
    .bottom-nav {
      left: 50%;
      right: auto;
      width: min(var(--app-max), calc(100vw - 32px));
      transform: translateX(-50%);
      bottom: var(--nav-lift);
      border-radius: 22px;
      border: 1px solid rgba(142,179,255,0.18);
      border-top: 1px solid rgba(142,179,255,0.18);
      box-shadow: 0 12px 40px rgba(53,93,163,0.18);
      padding-bottom: 0;
      overflow: hidden;
    }
    html[data-theme="dark"] .bottom-nav {
      border-color: rgba(142,179,255,0.12);
      box-shadow: 0 12px 40px rgba(0,0,0,0.45);
    }
    .myswym-app {
      background: transparent;
    }
  }

  @media (min-width: 768px) {
    :root {
      --app-max: 520px;
      --sheet-max: 460px;
      --app-pad-x: 26px;
    }
  }

  @media (min-width: 900px) {
    :root {
      --app-pad-x: 28px;
      --app-max: 560px;
      --sheet-max: 480px;
      --nav-lift: 18px;
    }
  }

  @media (min-width: 1200px) {
    :root {
      --app-max: 600px;
      --app-pad-x: 32px;
      --sheet-max: 500px;
    }
  }

  /* Souris / trackpad uniquement — ne change pas le feeling tactile */
  @media (hover: hover) and (pointer: fine) {
    button:active { transform: none; }
    .bottom-nav button:hover { opacity: 0.88; }
    .app-shell button:hover { filter: brightness(0.98); }
  }

  @media (prefers-reduced-motion: reduce) {
    .fade-up, .fade-up-1, .fade-up-2, .fade-up-3, .scale-in, .swimmer, .badge-pop, .toast-in {
      animation: none !important;
    }
  }
`;

/** Conteneur app mobile-first → colonne centrée sur tablette/PC */
const AppShell = ({ children, flush = false, style = {} }) => (
  <div className={flush ? "app-shell app-shell--flush" : "app-shell"} style={style}>
    {flush ? <div className="app-shell-inner">{children}</div> : children}
  </div>
);
// ── DATA ──────────────────────────────────────────────────────────────────
const GOALS = [
  { id: "triathlon_xs",      label: "Triathlon XS",           dist: "300–400 m nage",               icon: <Activity size={20} />, wellness: false },
  { id: "triathlon_sprint",  label: "Triathlon S · Sprint",   dist: "750 m nage",                   icon: <Activity size={20} />, wellness: false },
  { id: "triathlon_olympic", label: "Triathlon M · Olympique", dist: "1 500 m nage",                 icon: <Activity size={20} />, wellness: false },
  { id: "triathlon_half",    label: "Triathlon L · Half-Ironman", dist: "1 900 m nage",              icon: <Activity size={20} />, wellness: false },
  { id: "triathlon_ironman", label: "Triathlon XXL · Ironman", dist: "3 800 m nage",                 icon: <Activity size={20} />, wellness: false },
  { id: "open_water_500",   label: "Eau libre 500 m",        dist: "500 m",                        icon: <Waves size={20} />,    wellness: false },
  { id: "open_water_1k",     label: "Eau libre 1 km",         dist: "1 km",                         icon: <Waves size={20} />,    wellness: false },
  { id: "open_water_2_5k",   label: "Eau libre 2,5 km",       dist: "2,5 km",                       icon: <Waves size={20} />,    wellness: false },
  { id: "open_water_5k",     label: "Eau libre 5 km",         dist: "5 km",                         icon: <Waves size={20} />,    wellness: false },
  { id: "open_water_10k",    label: "Eau libre 10 km",        dist: "10 km",                        icon: <Waves size={20} />,    wellness: false },
  { id: "open_water_25k",    label: "Eau libre 25 km",        dist: "25 km",                        icon: <Waves size={20} />,    wellness: false },
  { id: "bnssa",             label: "Prépa BNSSA",            dist: "100 m & 250 m sauvetage",      icon: <Shield size={20} />,   wellness: false },
  { id: "bpjeps_aan",        label: "Prépa BPJEPS AAN",       dist: "400 m NL < 7'40\" · 100 m 4 nages < 1'50\"", icon: <Award size={20} />, wellness: false },
  { id: "caepmns",           label: "Prépa CAEPMNS",          dist: "300 m palmes · parcours sauvetage", icon: <Shield size={20} />, wellness: false },
  { id: "tests_pompiers",    label: "Tests Pompiers",         dist: "400 m NL + 50 m sauvetage",    icon: <Shield size={20} />,   wellness: false },
  { id: "competition_maitre",label: "Compétition Maître",     dist: "50–1 500 m",                   icon: <Trophy size={20} />,   wellness: false },
  { id: "reprendre",         label: "Reprendre la natation",  dist: "6 semaines · en douceur",      icon: <RotateCcw size={20} />, wellness: true },
  { id: "perte_de_poids",    label: "Activité physique",       dist: "Durée selon ton objectif",     icon: <Target size={20} />,   wellness: true  },
];

// Catégories onboarding (step 1)
const CATEGORIES = [
  { id: "progression", label: "Nager & Progresser",  Icon: TrendingUp,  desc: "Tous niveaux · Progresser à ton rythme" },
  { id: "triathlon",   label: "Triathlon",            Icon: Activity,    desc: "XS · S · M · L · XXL" },
  { id: "eau_libre",   label: "Eau libre",            Icon: Waves,       desc: "500 m · 1 km · 2,5 km · 5 km · 10 km · 25 km" },
  { id: "diplome",     label: "Prépa diplôme",        Icon: Award,       desc: "BNSSA · BPJEPS · CAEPMNS" },
];

// Sous-objectifs par catégorie
const SUB_GOALS = {
  triathlon: [
    { id: "triathlon_xs",      label: "XS",                dist: "300–400 m · 8–10 km vélo · 2–2,5 km CAP · 10,3–12,9 km" },
    { id: "triathlon_sprint",  label: "S · Sprint",        dist: "750 m · 20 km vélo · 5 km CAP · 25,7 km" },
    { id: "triathlon_olympic", label: "M · Olympique",     dist: "1,5 km · 40 km vélo · 10 km CAP · 51,5 km" },
    { id: "triathlon_half",    label: "L · Half-Ironman",  dist: "1,9 km · 90 km vélo · 21,1 km CAP · 113 km" },
    { id: "triathlon_ironman", label: "XXL · Ironman",     dist: "3,8 km · 180 km vélo · 42,195 km CAP · 226 km" },
  ],
  eau_libre: [
    { id: "open_water_500",  label: "500 m",  dist: "Eau vive" },
    { id: "open_water_1k",   label: "1 km",   dist: "Eau vive" },
    { id: "open_water_2_5k", label: "2,5 km", dist: "Eau vive" },
    { id: "open_water_5k",   label: "5 km",   dist: "Eau vive" },
    { id: "open_water_10k",  label: "10 km",  dist: "Eau vive" },
    { id: "open_water_25k",  label: "25 km",  dist: "Eau vive" },
  ],
  diplome: [
    { id: "bnssa",      label: "BNSSA",      dist: "100 m & 250 m sauvetage" },
    { id: "bpjeps_aan", label: "BPJEPS AAN", dist: "400 m NL < 7'40\" · 100 m 4 nages < 1'50\"" },
    { id: "caepmns",    label: "CAEPMNS",    dist: "300 m palmes · parcours sauvetage" },
  ],
};

const isWellnessGoal = (goalId) => GOALS.find(g => g.id === goalId)?.wellness === true;
const isProgressionGoal = (goalId) => goalId === "progression" || goalId?.startsWith("prog_");

// 4 niveaux mesurables — auto-évaluation physique + logique
const LEVELS = [
  {
    id: "découverte",
    label: "Découverte",
    desc: "Je m'arrête après quelques longueurs",
    detail: "Moins de 4 longueurs sans pause, ou je reprends après un arrêt",
    color: "#00B4D8",
    bg: "#E0F7FA",
    dot: 1,
  },
  {
    id: "régulier",
    label: "Régulier",
    desc: "Je tiens 400m sans m'arrêter",
    detail: "Je peux enchaîner sans forcer, mais je ne travaille pas encore mes allures",
    color: "#00C48C",
    bg: "#E6FFF6",
    dot: 2,
  },
  {
    id: "sportif",
    label: "Sportif",
    desc: "Je tiens 1500m sans m'arrêter, et je nage plusieurs fois par semaine",
    detail: "Technique solide, je m'entraîne avec régularité et je veux structurer ma progression",
    color: "#0057FF",
    bg: "#EEF3FF",
    dot: 3,
  },
  {
    id: "performance",
    label: "Performance",
    desc: "J'ai déjà fait des courses ou des compétitions",
    detail: "Je connais mes chronos, je veux un plan taillé pour la compétition",
    color: "#7C3AED",
    bg: "#EDE9FE",
    dot: 4,
  },
];

// Rétro-compat anciens IDs → index 0-3
const getLvlIndex = (level) => ({
  découverte: 0, beginner: 1, régulier: 1,
  intermediate: 2, sportif: 2,
  advanced: 3, performance: 3,
}[level] ?? 1);

const FREQUENCIES = [
  { id: 1, label: "1×/semaine",  desc: "Je suis occupé·e" },
  { id: 2, label: "2×/semaine",  desc: "Mon rythme idéal" },
  { id: 3, label: "3×/semaine",  desc: "Je suis motivé·e" },
  { id: 4, label: "4×/semaine",  desc: "Je suis sérieux·se" },
  { id: 5, label: "5×/semaine",  desc: "Mode compétition" },
];

const POOLS = [{ id: 25, label: "25 m" }, { id: 50, label: "50 m" }];

const BADGE_DEFS = [
  { id: "first_session", label: "Premier plongeon",   desc: "1re séance complétée",                icon: Droplets, color: G.water },
  { id: "km1",           label: "1 km nagé",          desc: "1 000 m au compteur",                  icon: Ruler,    color: G.blue },
  { id: "km5",           label: "5 km nagé",          desc: "5 000 m parcourus",                    icon: Waves,    color: G.blueDeep },
  { id: "km10",          label: "10 km nagé",         desc: "10 000 m — niveau avancé",             icon: Waves,    color: G.purple },
  { id: "streak3",       label: "Série de 3",         desc: "3 séances consécutives",               icon: Flame,    color: G.coral },
  { id: "streak5",       label: "Série de 5",         desc: "5 séances consécutives",               icon: Flame,    color: "#FF3D00" },
  { id: "week_perfect",  label: "Semaine parfaite",   desc: "Toutes les séances d'une semaine",     icon: Star,     color: G.gold },
  { id: "speed_demon",   label: "Flash aquatique",    desc: "1re séance de vitesse complétée",      icon: Zap,      color: G.coral },
  { id: "technique_pro", label: "Maître technicien",  desc: "3 séances de technique complétées",    icon: Target,   color: G.mint },
  { id: "halfway",       label: "À mi-chemin",        desc: "50 % du plan complété",                icon: TrendingUp, color: G.blueMid },
  { id: "finisher",      label: "Finisher",           desc: "Plan d'entraînement 100 % bouclé",     icon: Trophy,   color: G.gold },
];

// ── UTILS ─────────────────────────────────────────────────────────────────

// Premium = app_metadata uniquement (écrit par service role / Stripe).
// user_metadata est falsifiable par le client → jamais utilisé pour l'accès.
const checkIsPremium = (user) => {
  const meta = user?.app_metadata;
  if (meta?.subscription !== "premium") return false;
  if (meta?.subscription_end != null) {
    const endMs = Number(meta.subscription_end) * 1000;
    if (!Number.isFinite(endMs)) return false; // date invalide → refuser l'accès
    return endMs > Date.now();
  }
  return true; // legacy : premium actif sans date de fin (sync Stripe la renseignera)
};

const syncSubscriptionFromStripe = async () => {
  const { data: refreshData } = await supabase.auth.refreshSession();
  const session = refreshData?.session;
  if (!session) return null;
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-subscription`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({}),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Synchronisation échouée");
  const { data } = await supabase.auth.refreshSession();
  return data?.user ?? null;
};

const weeksUntil = (dateStr) => {
  if (!dateStr) return null;
  return Math.max(1, Math.ceil((new Date(dateStr) - new Date()) / (7 * 86400000)));
};

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const WEEKDAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const eventMinDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 42);
  d.setHours(0, 0, 0, 0);
  return d;
};

const toISODate = (y, m, d) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const parseISODate = (iso) => {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setHours(0, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateFR = (iso) => {
  const date = parseISODate(iso);
  if (!date) return "";
  return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
};

const formatDuration = (mins) => {
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h${mins % 60 ? (mins % 60).toString().padStart(2, "0") : ""}`;
};

const isSessionResolved = (s) => s.completed || !!s.skipped;
const SKIP_LABELS = { missed: "Oubliée", not_done: "Pas faite" };
const INSTAGRAM_MYSWYM = "https://www.instagram.com/myswym.app/";

/** Enlève le préfixe coach `-` / `·` pour l'affichage. */
const stripDetailPrefix = (raw) => String(raw || "").trim().replace(/^[-–—·]\s*/, "");

/**
 * Classe une ligne de détail :
 * - header : total de bloc (« 400m éducatif + jambes »)
 * - sub : série du bloc (« 4x50m … »)
 * - work : série autonome
 */
const classifyDetailLine = (raw) => {
  const full = String(raw || "");
  const trimmed = full.trim();
  if (!trimmed) return "empty";
  const body = stripDetailPrefix(trimmed);
  // Sous-série : préfixe · ou ligne indentée (sans tiret de bloc)
  const isSubPrefix = /^[·]/.test(trimmed) || (/^\s/.test(full) && !/^[-–—]/.test(trimmed));
  if (isSubPrefix) return "sub";
  const isNx = /^\d+\s*[x×]\s*\d+/i.test(body) || /^\d+\s*[x×]\s*\(/i.test(body);
  // Titre de bloc : « 400m éducatif… » (pas une série NxXm)
  if (/^\d+\s*m\b/i.test(body) && !isNx) return "header";
  return "work";
};

/** Regroupe header + sous-séries en blocs logiques (1 numéro = 1 bloc coach). */
const groupSessionDetails = (details = []) => {
  const groups = [];
  let i = 0;
  while (i < details.length) {
    const raw = details[i];
    const kind = classifyDetailLine(raw);
    if (kind === "empty") { i += 1; continue; }
    if (kind === "header") {
      const children = [];
      i += 1;
      while (i < details.length && classifyDetailLine(details[i]) === "sub") {
        children.push(details[i]);
        i += 1;
      }
      groups.push({ type: "block", header: raw, children });
      continue;
    }
    if (kind === "sub") {
      groups.push({ type: "work", lines: [raw] });
      i += 1;
      continue;
    }
    const lines = [raw];
    i += 1;
    while (i < details.length && classifyDetailLine(details[i]) === "work") {
      lines.push(details[i]);
      i += 1;
    }
    groups.push({ type: "work", lines });
  }
  return groups;
};

/** Texte plat d'une séance — WhatsApp / description Strava */
const formatSessionPlainText = (session) => {
  const lines = [
    `${session.title || "Séance"} — ${session.distance || ""}${session.duration ? ` — ${formatDuration(session.duration)}` : ""}`.trim(),
  ];
  if (session.intensity) lines.push(String(session.intensity));
  lines.push("");
  (session.details || []).forEach((d) => {
    const kind = classifyDetailLine(d);
    const t = stripDetailPrefix(d).replace(/\s*:\s*$/, "");
    if (!t) return;
    if (kind === "sub") lines.push(`  ${t}`);
    else lines.push(t);
  });
  lines.push("", "— MySWYM");
  return lines.join("\n");
};

// Garde une semaine existante dès qu'il y a du progrès, un feedback ou une satisfaction
const shouldPreserveWeek = (week) => {
  if (!week) return false;
  if (week.feedback || week.satisfaction) return true;
  return week.sessions?.some(isSessionResolved) ?? false;
};

const mergePreservingProgress = (oldWeeks, newWeeks) =>
  newWeeks.map((week, i) => (shouldPreserveWeek(oldWeeks[i]) ? oldWeeks[i] : week));

// Empreinte profil pour détecter les doublons cross-device (même objectif recréé avec un autre id)
const planFingerprint = (entry) => {
  const p = entry?.profile ?? {};
  return [p.category, p.goal, p.eventDate, p.level, p.pool, p.sessionsPerWeek].join("|");
};

const planProgressScore = (entry) => {
  if (!entry?.plan?.weeks) return 0;
  return entry.plan.weeks.reduce((n, w) => n + (w.sessions?.filter(isSessionResolved).length ?? 0), 0);
};

const dedupePlans = (plans) => {
  if (!plans?.length) return plans;
  const groups = new Map();
  for (const entry of plans) {
    const fp = planFingerprint(entry);
    if (!groups.has(fp)) groups.set(fp, []);
    groups.get(fp).push(entry);
  }
  const out = [];
  for (const group of groups.values()) {
    if (group.length === 1) { out.push(group[0]); continue; }
    // Plusieurs ids pour le même objectif : garde ceux avec progression, sinon le premier
    const withProgress = group.filter(e => planProgressScore(e) > 0);
    if (withProgress.length >= 2) out.push(...withProgress);
    else if (withProgress.length === 1) out.push(withProgress[0]);
    else out.push(group[0]);
  }
  return out;
};

// Fusion local + remote : union des plans non tombstonés.
// Suppression intentionnelle = présent dans deletedIds uniquement.
// Pour un même id des deux côtés : garde la version avec le plus de progression.
// À progression égale : garder le côté le plus récent (base) — sinon un changement
// de fréquence 2×→3× (même nb de séances validées) est écrasé par l'ancien plan au refresh.
// Si les timestamps sont égaux : préférer la fréquence / le volume planifié du côté base
// déjà choisi ; ne prendre `other` que s'il a strictement plus de séances validées.
const mergePlanLists = (localPlans, remotePlans, localActive, remoteActive, localUpdatedAt = 0, remoteUpdatedAt = 0, currentActive = null, deletedIds = null) => {
  const localIsNewer = (localUpdatedAt || 0) >= (remoteUpdatedAt || 0);
  const base = localIsNewer ? (localPlans || []) : (remotePlans || []);
  const other = localIsNewer ? (remotePlans || []) : (localPlans || []);
  const byId = new Map();
  for (const e of base) {
    if (deletedIds?.has(e.id)) continue;
    byId.set(e.id, e);
  }
  for (const e of other) {
    if (deletedIds?.has(e.id)) continue;
    const existing = byId.get(e.id);
    if (!existing) {
      // Plan créé sur l'autre appareil (ex. hors-ligne) — pas une suppression
      byId.set(e.id, e);
      continue;
    }
    if (planProgressScore(e) > planProgressScore(existing)) byId.set(e.id, e);
  }
  const merged = dedupePlans([...byId.values()]);
  let active = currentActive;
  if (!active || !merged.some(e => e.id === active)) {
    if (localActive && merged.some(e => e.id === localActive)) active = localActive;
    else if (remoteActive && merged.some(e => e.id === remoteActive)) active = remoteActive;
    else active = merged[0]?.id ?? null;
  }
  const updatedAt = new Date(Math.max(localUpdatedAt || 0, remoteUpdatedAt || 0) || Date.now()).toISOString();
  return { plans: merged, active, updatedAt };
};

const computeStats = (plan) => {
  if (!plan?.weeks) return { totalSessions: 0, totalMeters: 0, streak: 0, perfectWeeks: 0, speedSessions: 0, techniqueSessions: 0, planTotal: 0, weeklyData: [] };
  let totalSessions = 0, totalMeters = 0, currentStreak = 0, maxStreak = 0, perfectWeeks = 0, speedSessions = 0, techniqueSessions = 0;
  const planTotal = plan.weeks.reduce((a, w) => a + w.sessions.length, 0);
  const weeklyData = plan.weeks.map(w => ({
    label: `S${w.number}`,
    done: w.sessions.filter(s => s.completed).reduce((a, s) => a + (parseInt(s.distance) || 0), 0),
    total: w.sessions.reduce((a, s) => a + (parseInt(s.distance) || 0), 0),
  }));
  plan.weeks.forEach(week => {
    if (week.sessions.length > 0 && week.sessions.every(s => s.completed && !s.skipped)) perfectWeeks++;
    week.sessions.forEach(s => {
      if (s.completed) {
        totalSessions++; totalMeters += parseInt(s.distance) || 0; currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
        if (s.type === "VITESSE") speedSessions++;
        if (s.type === "TECHNIQUE") techniqueSessions++;
      } else { currentStreak = 0; }
    });
  });
  return { totalSessions, totalMeters, streak: maxStreak, perfectWeeks, speedSessions, techniqueSessions, planTotal, weeklyData };
};

const checkBadges = (stats) => {
  const e = [];
  if (stats.totalSessions >= 1)  e.push("first_session");
  if (stats.totalMeters >= 1000)  e.push("km1");
  if (stats.totalMeters >= 5000)  e.push("km5");
  if (stats.totalMeters >= 10000) e.push("km10");
  if (stats.streak >= 3) e.push("streak3");
  if (stats.streak >= 5) e.push("streak5");
  if (stats.perfectWeeks >= 1) e.push("week_perfect");
  if (stats.speedSessions >= 1) e.push("speed_demon");
  if (stats.techniqueSessions >= 3) e.push("technique_pro");
  if (stats.planTotal > 0 && stats.totalSessions >= stats.planTotal / 2) e.push("halfway");
  if (stats.planTotal > 0 && stats.totalSessions >= stats.planTotal) e.push("finisher");
  return e;
};

// Feedback hebdo : multiplicateur cumulé plafonné (évite ×1.12^n sans borne vs règle +10 %/sem.)
const VOLUME_ADJ_MIN = 0.7;
const VOLUME_ADJ_MAX = 1.3;
const VOLUME_ADJ_EASY = 1.12;
const VOLUME_ADJ_HARD = 0.88;
/** Micro-nudge sessionnel (entre deux bilans hebdo) — plus doux pour éviter le double-effet. */
const VOLUME_ADJ_SESSION_EASY = 1.03;
const VOLUME_ADJ_SESSION_HARD = 0.97;
const clampVolumeAdj = (v) => Math.min(VOLUME_ADJ_MAX, Math.max(VOLUME_ADJ_MIN, v));

const SESSION_FEEDBACK_TAGS = [
  "trop long",
  "trop court",
  "incompréhensible",
  "éducatifs top",
  "trop intensif",
  "j'ai adoré",
];

/** Scale les distances dans une ligne de détail (N×Xm, pyramides, Xm) sans double-comptage. */
const scaleDetailLineMeters = (line, ratio) => {
  if (!ratio || ratio === 1) return line;
  const snap = (m) => Math.max(25, Math.round(Number(m) * ratio / 25) * 25);
  const held = [];
  let out = String(line).replace(/(\d+)\s*([×x])\s*(\d+)\s*m/g, (_, n, x, dist) => {
    const tok = `\0${held.length}\0`;
    held.push(`${n}${x}${snap(dist)}m`);
    return tok;
  });
  out = out.replace(/(\d+(?:\s*[–\-]\s*\d+)+)\s*m/g, (_, seq) => {
    const tok = `\0${held.length}\0`;
    const scaled = seq.split(/([–\-])/).map((p) => (/[–\-]/.test(p) ? p : String(snap(parseInt(p, 10))))).join("");
    held.push(`${scaled}m`);
    return tok;
  });
  out = out.replace(/\b(\d+)\s*m\b/g, (_, d) => `${snap(d)}m`);
  return out.replace(/\0(\d+)\0/g, (_, idx) => held[Number(idx)]);
};

/** Patch volume séance : distance + duration + details (total = somme des blocs). */
const scaleSessionVolume = (s, factor) => {
  if (!factor || factor === 1) return s;
  const oldD = parseInt(s.distance, 10) || 0;
  const details = (s.details || []).map((line) => scaleDetailLineMeters(line, factor));
  const sum = calcSessionDistance(details);
  const dist = sum > 0 ? sum : Math.round(oldD * factor / 50) * 50;
  const durBase = s.duration || Math.max(40, Math.round((dist || oldD) / 35));
  const duration = Math.max(20, Math.round(durBase * (oldD > 0 ? dist / oldD : factor) / 5) * 5);
  return { ...s, details, distance: `${dist}m`, duration };
};

const phaseListForAdjust = (profile, plan) => {
  const rawWeeks = plan.totalRealWeeks || plan.weeks.length;
  const n = plan.weeks.length;
  const goal = profile.goal;
  const full = isProgressionGoal(goal)
    ? buildProgressionPhases().slice(0, rawWeeks)
    : isWellnessGoal(goal)
      ? buildWellnessPhases(rawWeeks)
      : buildPlanPhases(rawWeeks);
  return full.slice(0, n);
};

/**
 * Applique le feedback easy/ok/hard aux semaines futures.
 * - volumeAdj cumulé plafonné [0.70, 1.30]
 * - Coach : régénère les semaines futures vierges (details cohérents)
 * - Legacy / échec regen : scale distance+duration+details
 * Ne touche jamais une semaine déjà commencée (completed/skipped/feedback).
 */
const adjustPlan = (plan, weekIndex, rating, profile = null, premium = true, { sessionNudge = false } = {}) => {
  const step = sessionNudge
    ? (rating === "easy" ? VOLUME_ADJ_SESSION_EASY : rating === "hard" ? VOLUME_ADJ_SESSION_HARD : 1)
    : (rating === "easy" ? VOLUME_ADJ_EASY : rating === "hard" ? VOLUME_ADJ_HARD : 1);
  const prevAdj = plan.volumeAdj ?? 1;
  const nextAdj = step === 1 ? prevAdj : clampVolumeAdj(prevAdj * step);
  const applyFactor = prevAdj > 0 ? nextAdj / prevAdj : 1;

  const weeksWithFeedback = plan.weeks.map((w, i) =>
    (i === weekIndex && !sessionNudge ? { ...w, feedback: rating } : w),
  );

  let nextWeeks = weeksWithFeedback;

  if (applyFactor !== 1 && profile && shouldUseCoachGenerator(profile.goal)) {
    try {
      const phaseList = phaseListForAdjust(profile, plan);
      const fresh = buildCoachPlanWeeks(
        { ...profile, volumeAdj: nextAdj, taste: plan.taste || profile.taste },
        phaseList,
        premium,
        TIPS,
        FREE_FREQ_LIMIT,
      );
      nextWeeks = weeksWithFeedback.map((w, i) => {
        if (i <= weekIndex || shouldPreserveWeek(w)) return w;
        return fresh[i] ?? w;
      });
    } catch {
      nextWeeks = weeksWithFeedback.map((w, i) => {
        if (i <= weekIndex || shouldPreserveWeek(w)) return w;
        return { ...w, sessions: w.sessions.map((s) => scaleSessionVolume(s, applyFactor)) };
      });
    }
  } else if (applyFactor !== 1) {
    nextWeeks = weeksWithFeedback.map((w, i) => {
      if (i <= weekIndex || shouldPreserveWeek(w)) return w;
      return { ...w, sessions: w.sessions.map((s) => scaleSessionVolume(s, applyFactor)) };
    });
  }

  return { ...plan, volumeAdj: nextAdj, weeks: nextWeeks };
};

// ── SHARE CARD (Canvas) ────────────────────────────────────────────────────
function crr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const createShareCanvas = (session, goalLabel) => {
  const W = 1080, H = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0D1117"); bg.addColorStop(1, "#001966");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = 0.07; ctx.strokeStyle = "#0057FF"; ctx.lineWidth = 3;
  [130, 220, 310, 400].forEach(r => { ctx.beginPath(); ctx.arc(980, 160, r, 0, Math.PI * 2); ctx.stroke(); });
  ctx.restore();
  ctx.fillStyle = "rgba(255,255,255,0.88)"; ctx.font = "bold 34px sans-serif"; ctx.fillText("MySWYM", 80, 126);
  ctx.fillStyle = "#00C48C"; crr(ctx, 80, 196, 300, 58, 29); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.font = "bold 24px sans-serif"; ctx.fillText("Séance terminée", 108, 234);
  const tc = { ENDURANCE: "#4080FF", SEUIL: "#FF6D00", VITESSE: "#FF4757", TECHNIQUE: "#00B4D8", RÉCUPÉRATION: "#00C48C" };
  ctx.fillStyle = tc[session.type] || "#4080FF"; ctx.font = "500 28px sans-serif"; ctx.fillText(session.type, 80, 340);
  ctx.fillStyle = "#FFFFFF"; ctx.font = "bold 68px sans-serif";
  const words = session.title.split(" "); let line = "", y = 430;
  words.forEach((word) => {
    const test = line + word + " ";
    if (ctx.measureText(test).width > 920 && line) { ctx.fillText(line.trim(), 80, y); line = word + " "; y += 84; }
    else { line = test; }
  });
  ctx.fillText(line.trim(), 80, y);
  [{ label: "Distance", value: session.distance }, { label: "Durée", value: formatDuration(session.duration) }, { label: "Intensité", value: session.intensity }].forEach((s, i) => {
    const x = 80 + i * 310;
    ctx.fillStyle = "rgba(255,255,255,0.07)"; crr(ctx, x, 640, 290, 134, 20); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.45)"; ctx.font = "400 22px sans-serif"; ctx.fillText(s.label, x + 20, 678);
    ctx.fillStyle = "#FFFFFF"; ctx.font = "bold 40px sans-serif"; ctx.fillText(s.value, x + 20, 734);
  });
  if (goalLabel) { ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.font = "400 26px sans-serif"; ctx.fillText(`Objectif : ${goalLabel}`, 80, 854); }
  ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.font = "400 22px sans-serif"; ctx.fillText("myswym.app", 80, 1016);
  return canvas;
};

// ── PRIMITIVES ────────────────────────────────────────────────────────────
const Btn = ({ children, onClick, variant = "primary", disabled, style: s }) => {
  const base = { display: "block", width: "100%", padding: "16px 24px", borderRadius: 14, fontSize: 16, fontWeight: 600, fontFamily: "'Lexend', sans-serif", cursor: disabled ? "not-allowed" : "pointer", border: "none", transition: "all 0.18s", opacity: disabled ? 0.4 : 1, ...s };
  const styles = { primary: { background: G.ink, color: G.inverse }, secondary: { background: G.greyLight, color: G.ink }, blue: { background: G.blue, color: G.white, boxShadow: "0 8px 24px rgba(0,87,255,0.28)" }, ghost: { background: "transparent", color: G.grey, border: `1px solid ${G.greyLight}` } };
  return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...styles[variant] }}>{children}</button>;
};

const Progress = ({ step, total }) => (
  <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < step ? G.ink : G.greyLight, transition: "background 0.3s" }} />
    ))}
  </div>
);

const Ring = ({ value, size = 64, stroke = 6, color = G.water, bg = "rgba(255,255,255,0.12)", label }) => {
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - Math.min(1, value))}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s ease" }} />
      </svg>
      {label && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: size * 0.2, fontWeight: 700, color: G.white }}>{label}</span></div>}
    </div>
  );
};

const StatPill = ({ icon: Icon, value, label, color, bg }) => (
  <div style={{ background: G.surface, borderRadius: 22, padding: "18px 14px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, boxShadow: "0 4px 20px rgba(142,179,255,0.10)", border: `1px solid rgba(142,179,255,0.10)` }}>
    <div style={{ width: 40, height: 40, borderRadius: 12, background: bg || G.blueLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Icon size={20} color={color || G.blue} />
    </div>
    <span style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Lexend', sans-serif", letterSpacing: "-0.02em", color: color || G.blue, lineHeight: 1 }}>{value}</span>
    <span style={{ fontSize: 10, color: G.grey, letterSpacing: "0.06em", textTransform: "uppercase", textAlign: "center" }}>{label}</span>
  </div>
);

// ── PACE ZONES CARD ─────────────────────────────────────────────────────
/** Labels UI — les mults réels viennent de appZoneMultForT100(T100). */
const ZONE_DEFS = [
  {
    zone: "Zone 1–2",
    label: "Facile — Longue durée",
    key: "easy",
    color: "#34C759",
    bg: "#34C75914",
    desc: "Tu pourrais parler pendant que tu nages. C'est l'allure de base — confortable, régulière. C'est là que tu construis ton moteur.",
    tip: "La majorité de tes séances",
  },
  {
    zone: "Zone 3–4",
    label: "Allure seuil",
    key: "threshold",
    color: "#FF9F0A",
    bg: "#FF9F0A14",
    desc: "Effort soutenu — tu peux tenir cette allure sur 10–20 min mais pas indéfiniment. C'est ton allure de compétition sur distances moyennes.",
    tip: "Améliore ton endurance rapidement",
  },
  {
    zone: "Zone 5–6",
    label: "Sprint",
    key: "sprint",
    color: "#FF3B30",
    bg: "#FF3B3014",
    desc: "Effort maximal sur de courtes distances (25–50m). Tu dois récupérer complètement entre chaque sprint. Développe ta puissance.",
    tip: "Explosivité et vitesse",
  },
];

// ── PROJECTION DISTANCE (loi de puissance, T100 seul) ───────────────────
function calcProjection(pace100) {
  return calcDistanceProjection(pace100);
}

function fmtTime(totalSecs) {
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = Math.round(totalSecs % 60);
  if (h > 0) return `${h}h${String(m).padStart(2,'0')}'${String(s).padStart(2,'0')}"`;
  return `${m}'${String(s).padStart(2,'0')}"`;
}

function getCurrentWeekNumber(plan) {
  if (!plan?.weeks?.length) return 1;
  const idx = plan.weeks.findIndex(w => !w.sessions.every(isSessionResolved));
  if (idx < 0) return plan.weeks[plan.weeks.length - 1]?.number || plan.weeks.length;
  return plan.weeks[idx]?.number || idx + 1;
}

function appendPaceHistory(profile, { pace100, week, source = "manual" }) {
  if (!pace100) return profile;
  const hist = Array.isArray(profile.paceHistory) ? [...profile.paceHistory] : [];
  const entry = {
    week: week || 1,
    pace100,
    at: new Date().toISOString(),
    source,
  };
  const last = hist[hist.length - 1];
  if (last && last.pace100 === entry.pace100 && last.week === entry.week) {
    return profile;
  }
  hist.push(entry);
  return { ...profile, paceHistory: hist };
}

const PaceEvolutionCard = ({ plan, profile, isPremium, onUpgrade }) => {
  const pace100 = profile?.pace100 ?? null;
  const totalWeeks = plan?.weeks?.length || 0;
  const currentWeek = getCurrentWeekNumber(plan);
  // Rendements décroissants : gain plafonné selon le T100 de départ
  const maxGain = maxPaceGainFromT100(pace100);
  const history = Array.isArray(profile?.paceHistory) ? profile.paceHistory : [];

  // Découverte : pas de T100 (souvent incapables d'enchaîner 100 m)
  if (profile?.level === "découverte" || profile?.level === "beginner") return null;

  if (!isPremium) {
    return (
      <div style={{ background: G.surface, borderRadius: 18, padding: "18px 16px", marginBottom: 16, border: `1px solid ${G.greyLight}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", opacity: 0.85 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Lock size={14} color={G.greyMid} />
          <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 16, fontWeight: 700, color: G.ink, margin: 0 }}>Évolution des temps</h3>
        </div>
        <p style={{ fontSize: 13, color: G.grey, marginBottom: 14, lineHeight: 1.45 }}>
          Courbe de progression de tes chronos sur les semaines d’entraînement — réservé aux membres Premium.
        </p>
        <button type="button" onClick={onUpgrade} style={{ width: "100%", padding: "11px", borderRadius: 12, border: "none", background: G.blueLight, color: G.blue, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Zap size={14} color={G.blue} /> Passer en Premium
        </button>
      </div>
    );
  }

  if (!pace100 || totalWeeks < 2) {
    return (
      <div style={{ background: G.surface, borderRadius: 18, padding: "18px 16px", marginBottom: 16, border: `1px solid ${G.greyLight}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: G.blueLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TrendingUp size={16} color={G.blue} />
          </div>
          <div>
            <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 16, fontWeight: 700, color: G.ink, margin: 0 }}>Évolution des temps</h3>
            <p style={{ fontSize: 12, color: G.grey, margin: 0 }}>Projection sur ton plan</p>
          </div>
        </div>
        <p style={{ fontSize: 13, color: G.grey, lineHeight: 1.45, margin: 0 }}>
          {!pace100
            ? "Renseigne ton temps 100 m (T100) ci-dessous pour voir la courbe de progression possible."
            : "Ton plan est trop court pour afficher une courbe."}
        </p>
      </div>
    );
  }

  const firstHist = history.find(h => h.pace100);
  const startPace = firstHist?.pace100 || pace100;
  const startWeek = firstHist?.week || 1;
  const basePace = pace100;

  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);
  const projected = weeks.map(w => {
    const rel = Math.max(0, w - startWeek);
    const span = Math.max(1, totalWeeks - startWeek + 1);
    return projectedPaceAtWeek(startPace, rel, span, maxGain);
  });

  const actualByWeek = new Map();
  history.forEach(h => {
    if (!h.pace100 || !h.week) return;
    const prev = actualByWeek.get(h.week);
    if (prev == null || h.pace100 < prev) actualByWeek.set(h.week, h.pace100);
  });
  if (!actualByWeek.has(currentWeek)) {
    actualByWeek.set(currentWeek, basePace);
  }

  const allVals = [...projected, ...actualByWeek.values()];
  const tMin = Math.min(...allVals) * 0.98;
  const tMax = Math.max(...allVals) * 1.02;
  const SVG_W = 280, SVG_H = 110, PAD_L = 4, PAD_R = 4, PAD_T = 8, PAD_B = 4;
  const xOf = (w) => PAD_L + ((w - 1) / Math.max(1, totalWeeks - 1)) * (SVG_W - PAD_L - PAD_R);
  const yOf = (t) => PAD_T + (1 - (t - tMin) / (tMax - tMin || 1)) * (SVG_H - PAD_T - PAD_B);
  const projPts = weeks.map(w => `${xOf(w).toFixed(1)},${yOf(projected[w - 1]).toFixed(1)}`).join(" ");
  const endPace = projected[projected.length - 1];
  const gainSec = Math.max(0, Math.round(startPace - endPace));
  const gainPct = startPace > 0 ? Math.round((gainSec / startPace) * 1000) / 10 : 0;

  return (
    <div style={{ background: G.surface, borderRadius: 18, padding: "18px 16px", marginBottom: 16, border: `1px solid ${G.greyLight}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: G.blueLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <TrendingUp size={16} color={G.blue} />
        </div>
        <div>
          <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 16, fontWeight: 700, color: G.ink, margin: 0 }}>Évolution des temps</h3>
          <p style={{ fontSize: 12, color: G.grey, margin: 0 }}>T100 — projection sur {totalWeeks} semaines</p>
        </div>
      </div>

      <div style={{ background: G.greyXLight, borderRadius: 12, padding: "12px 10px 8px", marginBottom: 14 }}>
        <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ display: "block" }} aria-label="Courbe d'évolution du T100">
          <defs>
            <linearGradient id="evolGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={G.blue} stopOpacity="0.20" />
              <stop offset="100%" stopColor={G.blue} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((f, i) => (
            <line key={i} x1={SVG_W * f} y1={0} x2={SVG_W * f} y2={SVG_H} stroke={G.greyLight} strokeWidth="1" strokeDasharray="3,3" />
          ))}
          <polygon points={`${xOf(1).toFixed(1)},${SVG_H} ${projPts} ${xOf(totalWeeks).toFixed(1)},${SVG_H}`} fill="url(#evolGrad)" />
          <polyline points={projPts} fill="none" stroke={G.blue} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1={xOf(currentWeek)} y1={0} x2={xOf(currentWeek)} y2={SVG_H} stroke={G.mint} strokeWidth="1.5" strokeDasharray="4,3" />
          {[...actualByWeek.entries()].map(([w, t]) => (
            <circle key={w} cx={xOf(w)} cy={yOf(t)} r="4.5" fill={G.mint} stroke={G.white} strokeWidth="2" />
          ))}
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ fontSize: 10, color: G.greyMid, fontWeight: 600 }}>S1</span>
          <span style={{ fontSize: 10, color: G.mint, fontWeight: 700 }}>S{currentWeek} · aujourd’hui</span>
          <span style={{ fontSize: 10, color: G.greyMid, fontWeight: 600 }}>S{totalWeeks}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
        {[
          { label: "Départ", value: fmtTime(Math.round(startPace)), color: G.ink },
          { label: "Actuel", value: fmtTime(Math.round(basePace)), color: G.blue },
          { label: "Objectif fin", value: fmtTime(Math.round(endPace)), color: G.mint },
        ].map((c, i) => (
          <div key={i} style={{ background: G.greyXLight, borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: G.grey, fontWeight: 600, marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontFamily: "'Lexend', sans-serif", fontSize: 15, fontWeight: 800, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 11, color: G.greyMid, margin: 0, lineHeight: 1.5 }}>
        Projection indicative (~{gainPct}% / −{gainSec}s sur 100 m). Plus ton T100 est déjà rapide, plus le gain estimé est faible (rendements décroissants). Mets à jour ton T100 après les semaines test.
      </p>
    </div>
  );
};

const PaceProjectionCard = ({ pace100 }) => {
  if (!pace100) return null;
  const proj = calcProjection(pace100);
  if (!proj) return null;

  const TARGETS = [
    { dist: 400,  label: "400 m",   color: "#0057FF" },
    { dist: 1000, label: "1 000 m", color: G.blue },
    { dist: 1500, label: "1 500 m", color: "#00C48C" },
    { dist: 3000, label: "3 000 m", color: "#FF9F0A" },
  ];

  const SVG_W = 280, SVG_H = 90;
  const distMin = 100, distMax = 3200;
  const allPredicted = [100, 400, 1000, 1500, 3000].map(d => proj.predict(d));
  const tMin = Math.min(...allPredicted);
  const tMax = Math.max(...allPredicted);
  const xOf = (d) => ((d - distMin) / (distMax - distMin)) * SVG_W;
  const yOf = (t) => SVG_H - ((t - tMin) / (tMax - tMin + 1)) * (SVG_H - 8) - 4;
  const pts = Array.from({ length: 40 }, (_, i) => {
    const d = distMin + (i / 39) * (distMax - distMin);
    return `${xOf(d).toFixed(1)},${yOf(proj.predict(d)).toFixed(1)}`;
  }).join(" ");

  return (
    <div style={{ background: G.surface, borderRadius: 18, padding: "20px 16px", marginBottom: 16, border: `1px solid ${G.greyLight}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: G.blueLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <TrendingUp size={16} color={G.blue} />
        </div>
        <div>
          <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 16, fontWeight: 700, color: G.ink, margin: 0 }}>
            Projection de performance
          </h3>
          <p style={{ fontSize: 12, color: G.grey, margin: 0 }}>
            Estimation basée sur ton T100 — loi de puissance
          </p>
        </div>
      </div>

      <div style={{ background: G.greyXLight, borderRadius: 12, padding: "12px 12px 8px", marginBottom: 16, overflow: "hidden" }}>
        <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ display: "block" }}>
          {[0.25, 0.5, 0.75].map((f, i) => (
            <line key={i} x1={SVG_W * f} y1={0} x2={SVG_W * f} y2={SVG_H} stroke={G.greyLight} strokeWidth="1" strokeDasharray="3,3" />
          ))}
          <defs>
            <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={G.blue} stopOpacity="0.18"/>
              <stop offset="100%" stopColor={G.blue} stopOpacity="0.02"/>
            </linearGradient>
          </defs>
          <polygon points={`0,${SVG_H} ${pts} ${SVG_W},${SVG_H}`} fill="url(#projGrad)" />
          <polyline points={pts} fill="none" stroke={G.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {TARGETS.map(t => (
            <circle key={t.dist} cx={xOf(t.dist)} cy={yOf(proj.predict(t.dist))} r="4" fill={t.color} />
          ))}
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          {["100m", "1 km", "2 km", "3 km"].map((l, i) => (
            <span key={i} style={{ fontSize: 9, color: G.greyMid, fontWeight: 600 }}>{l}</span>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {TARGETS.map(t => {
          const raw = proj.predict(t.dist);
          const pace = raw / (t.dist / 100);
          const paceStr = `${Math.floor(pace/60)}'${String(Math.round(pace%60)).padStart(2,'0')}"/100m`;
          return (
            <div key={t.dist} style={{ background: `${t.color}0D`, borderRadius: 12, padding: "12px 14px", border: `1px solid ${t.color}22` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: t.color, marginBottom: 4, letterSpacing: "0.04em" }}>{t.label}</div>
              <div style={{ fontFamily: "'Lexend', sans-serif", fontSize: 20, fontWeight: 800, color: G.ink, lineHeight: 1 }}>
                {fmtTime(Math.round(raw))}
              </div>
              <div style={{ fontSize: 10, color: G.grey, marginTop: 4 }}>{paceStr}</div>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 11, color: G.greyMid, marginTop: 12, lineHeight: 1.5 }}>
        Projection indicative à partir de ton seul test de référence : le 100 m (T100).
      </p>
    </div>
  );
};

const PaceZonesCard = ({ pace100, onSave }) => {
  const [val100, setVal100] = useState(pace100 || null);
  const [saved,  setSaved]  = useState(false);
  const zoneMult = appZoneMultForT100(val100);

  const handleSave = () => {
    if (!val100) return;
    onSave(val100);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const fmtZone = (s) => `${Math.floor(s/60)}'${String(Math.round(s%60)).padStart(2,'0')}"/100m`;
  const hasChange = val100 !== pace100;

  return (
    <div style={{ background: G.surface, borderRadius: 18, padding: "20px 16px", marginBottom: 16, border: `1px solid ${G.greyLight}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: G.blueLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Gauge size={16} color={G.blue} />
        </div>
        <div>
          <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 16, fontWeight: 700, color: G.ink, margin: 0 }}>Zones d'intensité</h3>
          <p style={{ fontSize: 12, color: G.grey, margin: 0 }}>Basées sur ton T100 (départ dans l&apos;eau)</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        <PaceInput label="100 m crawl (T100)" hint="ex : 1:45" placeholder="1:45"
          value={val100} onChange={setVal100} maxLen={3} minSec={45} maxSec={5*60} />
      </div>

      <button onClick={handleSave} disabled={!val100 || !hasChange} style={{
        width: "100%", padding: "13px", borderRadius: 12, border: "none",
        cursor: (val100 && hasChange) ? "pointer" : "not-allowed",
        background: saved ? G.mint : (val100 && hasChange) ? G.blue : G.greyLight,
        color: G.white, fontWeight: 700, fontSize: 14, transition: "background 0.2s",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 16,
      }}>
        {saved ? <><Check size={14} /> Enregistré</> : "Enregistrer"}
      </button>

      {val100 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {ZONE_DEFS.map((z, i) => {
            const ps = Math.round(val100 * zoneMult[z.key]);
            return (
              <div key={i} style={{ background: z.bg, border: `1px solid ${z.color}28`, borderRadius: 12, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 700, fontSize: 13, color: G.ink }}>{z.label}</div>
                  <div style={{ fontSize: 11, color: G.grey, marginTop: 2 }}>{z.desc}</div>
                </div>
                <div style={{ fontFamily: "'Lexend', sans-serif", fontSize: 15, fontWeight: 800, color: z.color, flexShrink: 0, marginLeft: 12 }}>
                  {fmtZone(ps)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pace100 && !hasChange && (
        <p style={{ fontSize: 12, color: G.mint, textAlign: "center", marginTop: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
          <Check size={12} /> Zones actives dans ton plan
        </p>
      )}
    </div>
  );
};

const UpdateProgramCard = ({ profile, isPremium, onUpgrade, onSave, stravaBestPace }) => {
  const [freq,    setFreq]    = useState(profile?.sessionsPerWeek ?? 2);
  const [pace100, setPace100] = useState(profile?.pace100 ?? null);
  const [paceRaw, setPaceRaw] = useState(profile?.pace100 ? secToDisplay(profile.pace100) : "");
  const [changed, setChanged] = useState(false);
  const isDecouverteLevel = profile?.level === "découverte" || profile?.level === "beginner";

  // Resync si le profil parent change (ex. après régénération / reload)
  useEffect(() => {
    setFreq(profile?.sessionsPerWeek ?? 2);
    setPace100(profile?.pace100 ?? null);
    setPaceRaw(profile?.pace100 ? secToDisplay(profile.pace100) : "");
    setChanged(false);
  }, [profile?.sessionsPerWeek, profile?.pace100]);

  const freqChanged = freq    !== (profile?.sessionsPerWeek ?? 2);
  const paceChanged = !isDecouverteLevel && pace100 !== (profile?.pace100 ?? null);
  const hasChange   = freqChanged || paceChanged || changed;

  // Quand Strava remonte une meilleure allure, on l'affiche si aucune saisie manuelle
  const stravaIsUsed = stravaBestPace && pace100 === stravaBestPace;
  const stravaIsBetter = stravaBestPace && (!pace100 || stravaBestPace < pace100);

  const applyStravaPace = () => {
    setPace100(stravaBestPace);
    setPaceRaw(secToDisplay(stravaBestPace));
    setChanged(true);
  };

  const handlePaceInput = (input) => {
    const digits = input.replace(/\D/g, "").slice(0, 3);
    setPaceRaw(fmtDigits(input, 3));
    if (digits.length < 3) { setPace100(null); return; }
    const { val } = parsePaceInput(input, 9 * 60);
    if (val && val >= 30) { setPace100(val); setChanged(true); }
    else setPace100(null);
  };

  if (!isPremium) {
    return (
      <div style={{ background: G.surface, borderRadius: 18, padding: "18px 16px", marginBottom: 16, border: `1px solid ${G.greyLight}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Lock size={14} color={G.greyMid} />
          <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: "0.04em", color: G.ink, margin: 0 }}>Modifier mon programme</h3>
        </div>
        <p style={{ fontSize: 13, color: G.grey, marginBottom: 16 }}>Adapte le nombre de séances{isDecouverteLevel ? "" : " et ton allure"} — réservé aux membres Premium.</p>

        {/* Aperçu grisé — clic → popup Premium */}
        <button
          type="button"
          onClick={onUpgrade}
          style={{
            display: "block", width: "100%", textAlign: "left", cursor: "pointer",
            border: "none", background: "transparent", padding: 0, WebkitTapHighlightColor: "transparent",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: G.greyMid, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Séances par semaine</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18, opacity: 0.45, pointerEvents: "none" }}>
            {FREQUENCIES.map(f => {
              const active = (profile?.sessionsPerWeek ?? 2) === f.id;
              return (
                <span key={f.id} style={{
                  padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                  border: `1.5px solid ${active ? G.blue : G.greyLight}`,
                  background: active ? G.blueLight : G.greyXLight,
                  color: active ? G.blue : G.inkLight,
                }}>
                  {f.label}
                </span>
              );
            })}
          </div>

          {!isDecouverteLevel && (
            <>
          <div style={{ fontSize: 12, fontWeight: 700, color: G.greyMid, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
            Temps 100 m (T100)
          </div>
          <div style={{
            position: "relative", marginBottom: 6,
            borderRadius: 12, border: `1.5px dashed ${G.greyLight}`,
            background: G.greyXLight, opacity: 0.75,
          }}>
            <div style={{
              width: "100%", padding: "12px 48px 12px 14px",
              fontSize: 16, fontWeight: 700, color: G.greyMid,
              fontFamily: "'Lexend', sans-serif", boxSizing: "border-box",
            }}>
              {paceRaw || "ex: 2:10"}
            </div>
            <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: G.greyMid, display: "flex", alignItems: "center", gap: 6 }}>
              <Lock size={14} color={G.greyMid} />
              /100m
            </span>
          </div>
          <div style={{ fontSize: 11, color: G.greyMid, marginBottom: 16 }}>
            Départ dans l&apos;eau (pas de plongeon) — adapte les allures de tes séances
          </div>
            </>
          )}
        </button>

        <button type="button" onClick={onUpgrade} style={{ width: "100%", padding: "11px", borderRadius: 12, border: "none", background: G.blueLight, color: G.blue, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 44 }}>
          <Zap size={14} color={G.blue} /> Passer en Premium
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: G.surface, borderRadius: 18, padding: "18px 16px", marginBottom: 16, border: `1px solid ${G.greyLight}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: "0.04em", color: G.ink, marginBottom: 4 }}>Modifier mon programme</h3>
      <p style={{ fontSize: 13, color: G.grey, marginBottom: 16 }}>Tes semaines déjà entamées et tes séances validées sont conservées. La nouvelle fréquence s&apos;applique aux semaines pas encore commencées.</p>

      {/* Fréquence */}
      <div style={{ fontSize: 12, fontWeight: 700, color: G.grey, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Séances par semaine</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {FREQUENCIES.map(f => {
          const active = freq === f.id;
          return (
            <button key={f.id} onClick={() => { setFreq(f.id); setChanged(true); }} style={{
              padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600,
              border: `1.5px solid ${active ? G.blue : G.greyLight}`,
              background: active ? G.blueLight : G.greyXLight,
              color: active ? G.blue : G.inkLight,
            }}>
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Allure 100m — pas en Découverte (souvent incapables d'enchaîner 100 m) */}
      {!isDecouverteLevel && (
        <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: G.grey, textTransform: "uppercase", letterSpacing: "0.07em" }}>
          Temps 100 m (T100)
        </div>
        {stravaBestPace && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, background: "#FC4C02", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Activity size={10} color="#fff" />
            </div>
            <span style={{ fontSize: 11, color: G.grey }}>Strava : <strong style={{ color: G.ink }}>{secToDisplay(stravaBestPace)}</strong></span>
            {stravaIsBetter && (
              <button onClick={applyStravaPace} style={{
                padding: "2px 8px", borderRadius: 6, border: "none",
                background: "#FC4C02", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer",
              }}>Utiliser</button>
            )}
            {stravaIsUsed && (
              <span style={{ fontSize: 11, color: "#FC4C02", fontWeight: 600 }}>utilisé</span>
            )}
          </div>
        )}
      </div>
      <div style={{ position: "relative", marginBottom: 6 }}>
        <input
          type="text" inputMode="numeric"
          placeholder={stravaBestPace ? secToDisplay(stravaBestPace) : "ex: 2:10"}
          value={paceRaw}
          onChange={e => handlePaceInput(e.target.value)}
          style={{
            width: "100%", padding: "12px 48px 12px 14px", borderRadius: 12,
            border: `1.5px solid ${pace100 ? G.blue : G.greyLight}`,
            fontSize: 16, fontWeight: 700, color: G.ink,
            fontFamily: "'Lexend', sans-serif", background: G.surface,
            outline: "none", boxSizing: "border-box",
          }}
        />
        <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: G.grey, pointerEvents: "none" }}>/100m</span>
      </div>
      <div style={{ fontSize: 11, color: pace100 ? G.blue : G.greyMid, marginBottom: 16, display: "flex", alignItems: "center", gap: 4 }}>
        {pace100
          ? <><Gauge size={11} color={G.blue} /> Départ dans l&apos;eau — les allures seront recalculées sur ce T100</>
          : "Optionnel — test 100 m départ dans l'eau (pas de plongeon)"}
      </div>
        </>
      )}

      {hasChange && (
        <button onClick={() => { onSave(freq, isDecouverteLevel ? null : pace100); setChanged(false); }} style={{
          width: "100%", padding: "13px", borderRadius: 12, background: G.blue, border: "none",
          color: G.white, fontSize: 14, fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <RotateCcw size={14} color={G.white} /> Régénérer mon plan ({freq}×/sem)
        </button>
      )}
    </div>
  );
};

// ── STRAVA ────────────────────────────────────────────────────────────────────

const STRAVA_ACTIVITY_META = {
  Swim:          { label: "Nage piscine", color: G.blue,   bg: G.blueLight,   Icon: Waves    },
  OpenWaterSwim: { label: "Eau libre",    color: G.water,  bg: G.waterLight,  Icon: Waves    },
  Triathlon:     { label: "Triathlon",    color: G.purple, bg: G.purpleLight, Icon: Activity },
  Run:           { label: "Course",       color: G.coral,  bg: G.coralLight,  Icon: Activity },
  Ride:          { label: "Vélo",         color: G.mint,   bg: G.mintLight,   Icon: Activity },
};

const fmtDist = (m) => {
  if (!m) return "—";
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
};
const fmtDur = (s) => {
  if (!s) return "—";
  const h = Math.floor(s / 3600);
  const mn = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${mn}min` : `${mn} min`;
};
const fmtPace = (sec) => {
  if (!sec) return null;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}/100m`;
};

const StravaSection = ({ user, onPaceUpdate, currentPace100, plan, onValidateSession, onBestPace }) => {
  const [connected,     setConnected]     = useState(null); // null = chargement
  const [athlete,       setAthlete]       = useState(null);
  const [activities,    setActivities]    = useState([]);
  const [syncing,       setSyncing]       = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [msg,           setMsg]           = useState(null);

  // client_id est public (pas un secret) — fallback hardcodé si l'env n'est pas chargé
  const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID || "233278";

  useEffect(() => {
    if (!user) return;
    checkConnection();
  }, [user?.id]);

  async function checkConnection() {
    try {
      const { data, error } = await supabase
        .from("strava_tokens")
        .select("athlete_data")
        .eq("user_id", user.id)
        .maybeSingle();
      // erreur (table absente, RLS…) → afficher quand même le bouton "Connecter"
      if (error) { setConnected(false); return; }
      setConnected(!!data);
      if (data?.athlete_data) setAthlete(data.athlete_data);
      if (data) await loadActivities();
    } catch {
      setConnected(false);
    }
  }

  const loadActivities = async () => {
    const { data } = await supabase
      .from("strava_activities")
      .select("strava_activity_id, activity_type, title, distance, duration, pace, activity_date")
      .eq("user_id", user.id)
      .in("activity_type", ["Swim", "OpenWaterSwim"])
      .order("activity_date", { ascending: false })
      .limit(10);
    setActivities(data ?? []);
  };

  const connect = () => {
    const redirectUri = encodeURIComponent(window.location.origin + "/app");
    window.location.href =
      `https://www.strava.com/oauth/authorize?client_id=${clientId}` +
      `&response_type=code&redirect_uri=${redirectUri}` +
      `&approval_prompt=auto&scope=activity%3Aread_all&state=strava_connect`;
  };

  const sync = async () => {
    setSyncing(true); setMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/strava-sync`,
        {
          method: "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${session.access_token}`,
            "apikey":        import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ per_page: 50 }),
        }
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setMsg({ type: "ok", text: `${json.synced} activité(s) synchronisée(s)` });
      await loadActivities();
    } catch (e) {
      setMsg({ type: "err", text: e.message });
    } finally {
      setSyncing(false);
    }
  };

  const disconnect = async () => {
    if (!window.confirm("Déconnecter Strava et supprimer les activités synchronisées ?")) return;
    setDisconnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/strava-disconnect`,
        {
          method: "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${session.access_token}`,
            "apikey":        import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        }
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setConnected(false); setAthlete(null); setActivities([]); setMsg(null);
    } catch (e) {
      setMsg({ type: "err", text: e.message });
    } finally {
      setDisconnecting(false);
    }
  };

  // km natation cette semaine (lundi → dimanche)
  const weeklySwimM = activities
    .filter(a => {
      if (!["Swim", "OpenWaterSwim"].includes(a.activity_type)) return false;
      const now    = new Date();
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      monday.setHours(0, 0, 0, 0);
      return new Date(a.activity_date + "T12:00:00") >= monday;
    })
    .reduce((sum, a) => sum + (Number(a.distance) || 0), 0);

  // ── Meilleur 100m depuis Strava ─────────────────────────────────────────
  const swimPaces = activities.filter(a => ["Swim","OpenWaterSwim"].includes(a.activity_type) && a.pace > 0).map(a => a.pace);
  const bestPace  = swimPaces.length > 0 ? Math.min(...swimPaces) : null;
  // "meilleur" = plus rapide = valeur en secondes plus basse
  const hasBetterPace = bestPace && (!currentPace100 || bestPace < currentPace100);

  // Remonte bestPace vers le parent dès que les activités changent
  useEffect(() => { onBestPace?.(bestPace); }, [bestPace, onBestPace]);

  // ── Activité natation d'aujourd'hui ─────────────────────────────────────
  const todayStr  = new Date().toISOString().slice(0, 10);
  const todaySwim = connected ? activities.find(
    a => ["Swim","OpenWaterSwim"].includes(a.activity_type) && a.activity_date === todayStr
  ) : null;

  // ── Première séance non validée du plan courant ──────────────────────────
  const currentSessionRef = (() => {
    if (!plan?.weeks) return null;
    const wi = plan.weeks.findIndex(w => !w.sessions.every(isSessionResolved));
    if (wi === -1) return null;
    const si = plan.weeks[wi].sessions.findIndex(s => !isSessionResolved(s));
    if (si === -1) return null;
    return { weekIndex: wi, sessionIndex: si, session: plan.weeks[wi].sessions[si] };
  })();

  const canValidate = todaySwim && currentSessionRef && !isSessionResolved(currentSessionRef.session);

  // Pendant le chargement on affiche le bouton "Connecter" (état optimiste)
  // il sera remplacé par l'état réel dès que checkConnection() répond

  return (
    <div style={{ background: G.surface, borderRadius: 20, padding: "18px 16px", marginBottom: 16, border: `1px solid ${G.greyLight}`, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>

      {/* ── En-tête ──────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: connected ? "#FC4C02" : G.greyLight,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Activity size={18} color={connected ? "#fff" : G.greyMid} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: G.ink, lineHeight: 1.2 }}>Strava</div>
            <div style={{ fontSize: 12, color: G.grey }}>
              {connected && athlete?.firstname
                ? `${athlete.firstname}${athlete.lastname ? " " + athlete.lastname : ""}`
                : connected ? "Connecté" : "Non connecté"}
            </div>
          </div>
        </div>
        {connected && (
          <button
            onClick={sync}
            disabled={syncing}
            style={{ padding: "7px 14px", borderRadius: 10, border: `1.5px solid ${G.blue}`, background: G.blueLight, color: G.blue, fontSize: 13, fontWeight: 600, cursor: syncing ? "not-allowed" : "pointer", opacity: syncing ? 0.5 : 1, fontFamily: "'DM Sans', sans-serif" }}
          >
            {syncing ? "Sync…" : "Synchroniser"}
          </button>
        )}
      </div>

      {/* ── Message retour ───────────────────────────────────────── */}
      {msg && (
        <div style={{ background: msg.type === "ok" ? G.mintLight : "#FFE8E8", borderRadius: 10, padding: "9px 13px", marginBottom: 12, color: msg.type === "ok" ? "#00897B" : "#CC0000", fontSize: 13 }}>
          {msg.text}
        </div>
      )}

      {/* ── Non connecté ─────────────────────────────────────────── */}
      {!connected ? (
        <button
          onClick={connect}
          style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: "#FC4C02", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "'DM Sans', sans-serif" }}
        >
          <Activity size={16} color="#fff" /> Connecter Strava
        </button>
      ) : (
        <>
          {/* Volume hebdo natation */}
          {weeklySwimM > 0 && (
            <div style={{ background: G.blueLight, borderRadius: 12, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
              <Waves size={16} color={G.blue} />
              <span style={{ fontSize: 13, fontWeight: 600, color: G.blue }}>
                {(weeklySwimM / 1000).toFixed(1)} km nagés cette semaine
              </span>
            </div>
          )}

          {/* ── Valider séance depuis Strava ─────────────────────── */}
          {canValidate && (
            <div style={{ background: "linear-gradient(135deg,#EEF3FF,#E0F7FA)", borderRadius: 14, padding: "12px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: G.blue, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Waves size={18} color="#fff" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: G.ink }}>Tu as nagé {fmtDist(todaySwim.distance)} aujourd'hui !</div>
                <div style={{ fontSize: 11, color: G.grey }}>Valide ta séance du programme ?</div>
              </div>
              <button
                onClick={() => { onValidateSession(currentSessionRef.weekIndex, currentSessionRef.sessionIndex); setMsg({ type: "ok", text: "Séance validée depuis Strava" }); }}
                style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: G.blue, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}
              >
                Valider
              </button>
            </div>
          )}

          {/* ── Meilleur temps 100m depuis Strava ────────────────── */}
          {bestPace && (
            <div style={{ background: hasBetterPace ? G.goldLight : G.greyXLight, borderRadius: 14, padding: "12px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: hasBetterPace ? G.gold : G.greyLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Trophy size={18} color={hasBetterPace ? "#fff" : G.greyMid} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: G.ink }}>
                  Meilleur 100m Strava : {fmtPace(bestPace)}
                  {hasBetterPace && " — record"}
                </div>
                <div style={{ fontSize: 11, color: G.grey }}>
                  {hasBetterPace
                    ? `Plus rapide que ta référence (${fmtPace(currentPace100)})`
                    : `Identique à ta référence actuelle`}
                </div>
              </div>
              {hasBetterPace && onPaceUpdate && (
                <button
                  onClick={() => { onPaceUpdate(bestPace); setMsg({ type: "ok", text: `Référence mise à jour : ${fmtPace(bestPace)}` }); }}
                  style={{ padding: "8px 12px", borderRadius: 10, border: "none", background: G.gold, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}
                >
                  Utiliser
                </button>
              )}
            </div>
          )}

          {/* Liste des activités */}
          {activities.length === 0 ? (
            <div style={{ fontSize: 13, color: G.grey, textAlign: "center", padding: "16px 0" }}>
              Aucune activité — clique sur "Synchroniser".
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", marginBottom: 12 }}>
              {activities.map((a, i) => {
                const meta = STRAVA_ACTIVITY_META[a.activity_type] ?? { label: a.activity_type ?? "Activité", color: G.grey, bg: G.greyXLight, Icon: Activity };
                const { Icon: AIcon, color, bg, label } = meta;
                return (
                  <div
                    key={a.strava_activity_id}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < activities.length - 1 ? `1px solid ${G.greyLight}` : "none" }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <AIcon size={16} color={color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: G.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {a.title || label}
                      </div>
                      <div style={{ fontSize: 11, color: G.grey }}>
                        {a.activity_date ? new Date(a.activity_date + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) + " · " : ""}{label}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: G.ink }}>{fmtDist(a.distance)}</div>
                      <div style={{ fontSize: 11, color: G.grey }}>{fmtDur(a.duration)}</div>
                      {a.pace && <div style={{ fontSize: 11, color }}>{fmtPace(a.pace)}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Déconnexion */}
          <button
            onClick={disconnect}
            disabled={disconnecting}
            style={{ width: "100%", padding: "10px", borderRadius: 10, border: `1px solid ${G.greyLight}`, background: "none", color: G.grey, fontSize: 12, fontWeight: 500, cursor: disconnecting ? "not-allowed" : "pointer", opacity: disconnecting ? 0.5 : 1, fontFamily: "'DM Sans', sans-serif" }}
          >
            {disconnecting ? "Déconnexion…" : "Déconnecter Strava"}
          </button>
        </>
      )}
    </div>
  );
};

const ProfileTab = ({ plan, profile, user, isPremium, onSignOut, onPortal, onUpgrade, onRefreshStatus, onPaceUpdate, onUpdateProgram, onValidateSession, onUserUpdate, theme = "light", onToggleTheme }) => {
  const { t: ts } = useTranslation("settings");
  const [password,      setPassword]      = useState("");
  const [saving,        setSaving]        = useState(false);
  const [msg,           setMsg]           = useState(null);
  const [stravaBestPace, setStravaBestPace] = useState(null);

  const avatarStorageKey = user?.id ? `myswym_avatar_${user.id}` : "myswym_avatar";
  const nameStorageKey = user?.id ? `myswym_firstname_${user.id}` : "myswym_firstname";

  // Avatar + firstName — Supabase user_metadata en priorité, localStorage en fallback
  const [avatarUrl, setAvatarUrl] = useState(() => {
    try {
      return user?.user_metadata?.avatar_url
        || (user?.id ? localStorage.getItem(`myswym_avatar_${user.id}`) : null)
        || localStorage.getItem("myswym_avatar")
        || null;
    } catch { return null; }
  });
  const [firstName, setFirstName] = useState(() => {
    try {
      return user?.user_metadata?.firstname
        || (user?.id ? localStorage.getItem(`myswym_firstname_${user.id}`) : null)
        || localStorage.getItem("myswym_firstname")
        || "";
    } catch { return ""; }
  });
  const [editingName, setEditingName] = useState(false);
  const [nameInput,   setNameInput]   = useState(firstName);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const fileInputRef = useRef(null);

  // Resync depuis user_metadata quand l'objet user arrive ou change
  useEffect(() => {
    if (user?.user_metadata?.firstname) setFirstName(user.user_metadata.firstname);
    else if (user?.id) {
      try {
        const cached = localStorage.getItem(`myswym_firstname_${user.id}`) || localStorage.getItem("myswym_firstname");
        if (cached) setFirstName(cached);
      } catch {}
    }
    if (user?.user_metadata?.avatar_url) setAvatarUrl(user.user_metadata.avatar_url);
    else if (user?.id) {
      try {
        const cached = localStorage.getItem(`myswym_avatar_${user.id}`) || localStorage.getItem("myswym_avatar");
        if (cached) setAvatarUrl(cached);
        else setAvatarUrl(null);
      } catch { setAvatarUrl(null); }
    }
  }, [user?.id, user?.user_metadata?.firstname, user?.user_metadata?.avatar_url]);

  const stats  = computeStats(plan);
  const earned = checkBadges(stats);

  const inp = { width: "100%", padding: "13px 14px", borderRadius: 12, border: `1.5px solid ${G.greyLight}`, fontSize: 15, fontFamily: "'Lexend', sans-serif", background: G.surface, color: G.ink, outline: "none", boxSizing: "border-box" };

  const save = async () => {
    if (!password) return;
    setSaving(true); setMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMsg({ type: "ok", text: "Mot de passe mis à jour" });
      setPassword("");
    } catch (e) { setMsg({ type: "err", text: e.message }); }
    finally { setSaving(false); }
  };

  const saveName = () => {
    const v = nameInput.trim();
    if (v) {
      try {
        localStorage.setItem(nameStorageKey, v);
        localStorage.setItem("myswym_firstname", v);
      } catch {}
      setFirstName(v);
      // Sync cross-device via user_metadata
      supabase.auth.updateUser({ data: { firstname: v } })
        .then(({ data }) => { if (data?.user && onUserUpdate) onUserUpdate(data.user); })
        .catch(() => {});
    }
    setEditingName(false);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    // Reset input pour permettre de re-sélectionner le même fichier
    e.target.value = "";
    setAvatarMenuOpen(false);

    const previousUrl = avatarUrl;
    setAvatarBusy(true);

    // Aperçu immédiat local
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarUrl(ev.target.result);
    reader.readAsDataURL(file);

    // Upload vers Supabase Storage → URL publique persistante cross-device
    try {
      const mime = file.type || "image/jpeg";
      const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
      const path = `${user.id}/avatar.${ext}`;

      // Upsert exige une policy SELECT (RETURNING). Fallback remove+insert si besoin.
      let uploadErr = (await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: mime, cacheControl: "3600" })).error;
      if (uploadErr) {
        await supabase.storage.from("avatars").remove([path]).catch(() => {});
        uploadErr = (await supabase.storage
          .from("avatars")
          .upload(path, file, { upsert: false, contentType: mime, cacheControl: "3600" })).error;
      }
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      // Cache-busting pour forcer le rechargement de l'image
      const urlWithTs = `${publicUrl}?t=${Date.now()}`;
      setAvatarUrl(urlWithTs);
      try {
        localStorage.setItem(avatarStorageKey, urlWithTs);
        localStorage.setItem("myswym_avatar", urlWithTs);
      } catch {}
      // Sync cross-device via user_metadata + état parent (home header)
      const { data: updated, error: metaErr } = await supabase.auth.updateUser({ data: { avatar_url: urlWithTs } });
      if (metaErr) throw metaErr;
      if (updated?.user && onUserUpdate) onUserUpdate(updated.user);
    } catch (err) {
      setAvatarUrl(previousUrl || null);
      setMsg({ type: "err", text: err?.message || "Impossible d'enregistrer la photo de profil" });
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!user || avatarBusy) return;
    setAvatarBusy(true);
    setAvatarMenuOpen(false);
    const previousUrl = avatarUrl;
    setAvatarUrl(null);
    try {
      try {
        localStorage.removeItem(avatarStorageKey);
        localStorage.removeItem("myswym_avatar");
      } catch {}
      // Supprime les variantes éventuelles (jpg/png/webp)
      const paths = ["jpg", "png", "webp"].map((ext) => `${user.id}/avatar.${ext}`);
      await supabase.storage.from("avatars").remove(paths);
      const { data: updated, error: metaErr } = await supabase.auth.updateUser({ data: { avatar_url: "" } });
      if (metaErr) throw metaErr;
      if (updated?.user && onUserUpdate) onUserUpdate(updated.user);
    } catch (err) {
      setAvatarUrl(previousUrl || null);
      setMsg({ type: "err", text: err?.message || "Impossible de supprimer la photo" });
    } finally {
      setAvatarBusy(false);
    }
  };

  const displayName = firstName || user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Nageur";
  const initials = displayName.slice(0, 2).toUpperCase();
  const levelLabel = LEVELS.find(l => l.id === profile?.level)?.label || profile?.level || "Nageur";

  // Badge gradient by index
  const badgeGradients = [
    `linear-gradient(135deg,${G.blueMid},${G.blue})`,
    "linear-gradient(135deg,#FBBF24,#F59E0B)",
    "linear-gradient(135deg,#a78bfa,#7C3AED)",
    "linear-gradient(135deg,#34d399,#00C48C)",
    "linear-gradient(135deg,#fb923c,#FF4757)",
    "linear-gradient(135deg,#60a5fa,#3b82f6)",
  ];

  return (
    <div style={{ minHeight: "100dvh", background: "transparent", paddingBottom: "calc(var(--bottom-nav-h) + var(--safe-bottom) + var(--nav-lift) + 24px)" }}>
      <AppShell>
      {/* ── Profile Header ─────────────────────────────────────── */}
      <div style={{ padding: "48px 0 24px", textAlign: "center" }}>
        {/* Avatar — menu Ajouter / Modifier / Supprimer */}
        <div style={{ position: "relative", display: "inline-block", marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => {
              if (avatarBusy) return;
              if (!avatarUrl) {
                fileInputRef.current?.click();
                return;
              }
              setAvatarMenuOpen(true);
            }}
            aria-label={avatarUrl ? "Gérer la photo de profil" : "Ajouter une photo de profil"}
            style={{ border: "none", background: "none", cursor: avatarBusy ? "wait" : "pointer", padding: 0, display: "block", minWidth: 44, minHeight: 44, opacity: avatarBusy ? 0.7 : 1 }}
          >
            <div style={{
              width: 90, height: 90, borderRadius: "50%",
              background: avatarUrl ? "transparent" : `linear-gradient(135deg, ${G.blueMid} 0%, ${G.blue} 100%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 32px rgba(142,179,255,0.35)",
              border: "3px solid #fff", overflow: "hidden",
            }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>{initials}</span>
              }
            </div>
            <div style={{
              position: "absolute", bottom: 2, right: 2,
              width: 26, height: 26, borderRadius: "50%",
              background: G.blue, border: "2.5px solid #fff",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Camera size={12} color="#fff" />
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
        </div>

        {avatarMenuOpen && createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Photo de profil"
            onClick={() => setAvatarMenuOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 400,
              background: "rgba(15, 23, 42, 0.45)",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
              padding: "16px 16px calc(16px + env(safe-area-inset-bottom, 0px))",
              boxSizing: "border-box",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 420, background: G.surface, borderRadius: 20,
                border: `1px solid ${G.greyLight}`, overflow: "hidden",
                boxShadow: "0 16px 40px rgba(0,0,0,0.18)",
              }}
            >
              <div style={{ padding: "16px 18px 10px", textAlign: "left" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: G.ink }}>Photo de profil</div>
                <div style={{ fontSize: 13, color: G.grey, marginTop: 2 }}>Choisis une action</div>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 18px", background: "none", border: "none", borderTop: `1px solid ${G.greyLight}`,
                  cursor: "pointer", textAlign: "left", minHeight: 52,
                }}
              >
                <Camera size={18} color={G.blue} />
                <span style={{ fontSize: 15, fontWeight: 600, color: G.ink }}>
                  {avatarUrl ? "Modifier la photo" : "Ajouter une photo"}
                </span>
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleAvatarRemove}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 12,
                    padding: "14px 18px", background: "none", border: "none", borderTop: `1px solid ${G.greyLight}`,
                    cursor: "pointer", textAlign: "left", minHeight: 52,
                  }}
                >
                  <Trash2 size={18} color={G.coral} />
                  <span style={{ fontSize: 15, fontWeight: 600, color: G.coral }}>Supprimer la photo</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setAvatarMenuOpen(false)}
                style={{
                  width: "100%", padding: "14px 18px", background: G.greyXLight, border: "none",
                  borderTop: `1px solid ${G.greyLight}`, cursor: "pointer",
                  fontSize: 15, fontWeight: 700, color: G.grey, minHeight: 52,
                }}
              >
                Annuler
              </button>
            </div>
          </div>,
          document.body
        )}

        {/* Name — tappable pour éditer */}
        {editingName ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 8 }}>
            <input
              autoFocus
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveName()}
              placeholder="Ton prénom"
              style={{ fontSize: 20, fontWeight: 700, color: G.ink, border: "none", borderBottom: `2px solid ${G.blue}`, outline: "none", background: "transparent", textAlign: "center", width: 160 }}
            />
            <button type="button" onClick={saveName} style={{ background: G.blue, border: "none", borderRadius: 8, padding: "8px 12px", color: G.white, fontSize: 12, fontWeight: 700, cursor: "pointer", minHeight: 44 }}>OK</button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => { setNameInput(displayName); setEditingName(true); }}
            style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 4, padding: 8, minHeight: 44 }}
          >
            <span style={{ fontSize: 22, fontWeight: 800, color: G.ink, letterSpacing: "-0.02em" }}>{displayName}</span>
            <div style={{ width: 20, height: 20, borderRadius: 6, background: G.blueLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Settings size={11} color={G.blue} />
            </div>
          </button>
        )}
        <div style={{ fontSize: 12, fontWeight: 700, color: G.grey, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
          {levelLabel}
        </div>
        <div style={{ fontSize: 11, color: G.greyMid }}>{user?.email}</div>
      </div>

      <div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { Icon: Waves, value: `${(stats.totalMeters / 1000).toFixed(1)} km`, label: "Nagés", color: G.blue, bg: G.blueLight },
            { Icon: Check, value: stats.totalSessions, label: "Séances", color: G.mint, bg: G.mintLight },
          ].map(({ Icon, value, label, color, bg }, i) => (
            <div key={i} style={{ background: G.surface, borderRadius: 20, padding: "16px 14px", border: `1px solid ${G.greyLight}`, boxShadow: "0 2px 12px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={20} color={color} />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: G.ink, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 11, color: G.grey, marginTop: 2 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Évolution des temps (Premium) ── */}
        <PaceEvolutionCard plan={plan} profile={profile} isPremium={isPremium} onUpgrade={onUpgrade} />

        {/* ── Modifier le programme ── */}
        <UpdateProgramCard profile={profile} isPremium={isPremium} onUpgrade={onUpgrade} onSave={onUpdateProgram} stravaBestPace={stravaBestPace} />

        {/* ── Langue ── */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12, marginTop: 8 }}>{ts("language.section")}</div>
          <div style={{
            background: G.surface, borderRadius: 16, padding: "14px 16px",
            border: `1px solid ${G.greyLight}`, marginBottom: 10,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: G.ink, marginBottom: 2 }}>
                {ts("language.title")}
              </div>
              <div style={{ fontSize: 12, color: G.grey, lineHeight: 1.35 }}>
                {ts("language.hint")}
              </div>
            </div>
            <LanguageSwitcher variant="settings" />
          </div>
        </div>

        {/* ── Apparence ── */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12, marginTop: 8 }}>{ts("appearance.section")}</div>
          <div style={{
            background: G.surface, borderRadius: 16, padding: "14px 16px",
            border: `1px solid ${G.greyLight}`, marginBottom: 10,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: G.ink, marginBottom: 2 }}>
                {theme === "dark" ? ts("appearance.dark") : ts("appearance.light")}
              </div>
              <div style={{ fontSize: 12, color: G.grey, lineHeight: 1.35 }}>
                {theme === "dark" ? ts("appearance.darkHint") : ts("appearance.lightHint")}
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={theme === "dark"}
              aria-label={theme === "dark" ? ts("appearance.switchToLight") : ts("appearance.switchToDark")}
              onClick={onToggleTheme}
              style={{
                flexShrink: 0, width: 64, height: 36, borderRadius: 999,
                border: "none", cursor: "pointer", padding: 3,
                background: theme === "dark" ? "#1e293b" : "#fde68a",
                position: "relative",
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.12)",
                transition: "background 0.25s ease",
                WebkitTapHighlightColor: "transparent",
                minWidth: 64, minHeight: 36,
              }}
            >
              <span style={{
                position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
                opacity: theme === "dark" ? 0.35 : 1, transition: "opacity 0.2s",
                display: "flex",
              }}>
                <Sun size={14} color={theme === "dark" ? "#94a3b8" : "#b45309"} strokeWidth={2.4} />
              </span>
              <span style={{
                position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                opacity: theme === "dark" ? 1 : 0.35, transition: "opacity 0.2s",
                display: "flex",
              }}>
                <Moon size={14} color={theme === "dark" ? "#e2e8f0" : "#94a3b8"} strokeWidth={2.4} />
              </span>
              <span style={{
                position: "absolute", top: 3,
                left: theme === "dark" ? 31 : 3,
                width: 30, height: 30, borderRadius: "50%",
                background: G.white,
                boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                transition: "left 0.25s cubic-bezier(.4,.0,.2,1)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {theme === "dark"
                  ? <Moon size={15} color="#334155" strokeWidth={2.4} />
                  : <Sun size={15} color="#d97706" strokeWidth={2.4} />
                }
              </span>
            </button>
          </div>
        </div>

        {/* ── 4. Compte ── */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12, marginTop: 8 }}>{ts("account.section")}</div>

          {/* Premium / abonnement — premier car le plus important */}
          <div style={{ marginBottom: 10 }}>
            {isPremium ? (
              <button onClick={onPortal} style={{ width: "100%", padding: "15px", borderRadius: 14, border: `1.5px solid ${G.blue}`, background: G.blueLight, color: G.blue, fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 54 }}>
                <Zap size={17} color={G.blue} /> Gérer mon abonnement
              </button>
            ) : (
              <button onClick={onUpgrade} style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", background: `linear-gradient(135deg, ${G.blue}, ${G.blueDeep})`, color: G.white, fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 54, boxShadow: "0 6px 20px rgba(53,93,163,0.30)" }}>
                <Zap size={17} color={G.gold} /> Passer en Premium
              </button>
            )}
            {onRefreshStatus && (
              <button onClick={onRefreshStatus} style={{ width: "100%", marginTop: 8, padding: "10px", borderRadius: 12, border: `1px solid ${G.greyLight}`, background: G.greyXLight, color: G.grey, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                Actualiser le statut (déjà payé ?)
              </button>
            )}
            {isPremium && <ReferralShareCard />}
          </div>

          {/* Email + mdp groupés */}
          <div style={{ background: G.surface, borderRadius: 16, overflow: "hidden", border: `1px solid ${G.greyLight}`, marginBottom: 10 }}>
            <div style={{ padding: "13px 16px", borderBottom: `1px solid ${G.greyXLight}` }}>
              <div style={{ fontSize: 11, color: G.grey }}>Email</div>
              <div style={{ fontSize: 14, color: G.ink, fontWeight: 500 }}>{user?.email}</div>
            </div>
            <div style={{ padding: "13px 16px" }}>
              <input style={{ ...inp, marginBottom: 8 }} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Nouveau mot de passe" onKeyDown={e => e.key === "Enter" && save()} />
              {msg && <div style={{ background: msg.type === "ok" ? G.mintLight : "#FFE8E8", borderRadius: 8, padding: "7px 12px", marginBottom: 8, color: msg.type === "ok" ? "#00897B" : "#CC0000", fontSize: 12 }}>{msg.text}</div>}
              <Btn onClick={save} disabled={saving || !password} variant="blue">{saving ? "Enregistrement…" : "Changer le mot de passe"}</Btn>
            </div>
          </div>

          {/* Strava inline */}
          <StravaSection user={user} plan={plan} currentPace100={profile?.pace100} onPaceUpdate={onPaceUpdate} onValidateSession={onValidateSession} onBestPace={setStravaBestPace} />

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24, marginTop: 10 }}>
            <button onClick={onSignOut} style={{ width: "100%", padding: "14px", borderRadius: 14, border: `1.5px solid ${G.greyLight}`, background: "none", color: G.grey, fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 50 }}>
              <LogOut size={16} color={G.grey} /> Se déconnecter
            </button>
          </div>
        </div>
      </div>
      </AppShell>
    </div>
  );
};

const BottomNav = ({ active, onChange, newBadge }) => {
  const tabs = [
    { id: "home",    Icon: Home,      label: "Accueil" },
    { id: "plan",    Icon: Calendar,  label: "Programme" },
    { id: "profile", Icon: User,      label: "Profil" },
  ];
  return (
    <div className="bottom-nav">
      <nav className="bottom-nav-inner" style={{ minHeight: "var(--bottom-nav-h)", padding: "6px 0 8px" }} aria-label="Navigation principale">
        {tabs.map(t => {
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              aria-current={isActive ? "page" : undefined}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 4, background: "none", border: "none", cursor: "pointer",
                minHeight: 48, padding: "6px 4px", position: "relative",
              }}
            >
              <t.Icon size={22} color={isActive ? G.blue : G.greyMid} strokeWidth={isActive ? 2.5 : 1.8} style={{ transition: "all 0.2s" }} />
              <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 500, color: isActive ? G.blue : G.grey }}>{t.label}</span>
              {t.id === "profile" && newBadge && <div style={{ position: "absolute", top: 6, right: "calc(50% - 18px)", width: 8, height: 8, borderRadius: "50%", background: G.coral }} />}
              {isActive && <div style={{ position: "absolute", bottom: 2, width: 28, height: 3, borderRadius: 2, background: G.blue }} />}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

// ── AUTH SCREEN ───────────────────────────────────────────────────────────

const ResetPasswordScreen = ({ onDone, showBrandHeader = true }) => {
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const handle = async () => {
    if (password.length < 6) { setError("Le mot de passe doit faire au moins 6 caractères."); return; }
    if (password !== confirm)  { setError("Les deux mots de passe ne correspondent pas."); return; }
    setError(null); setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      onDone();
    } catch (e) { setError(e.message || "Une erreur est survenue."); }
    finally { setLoading(false); }
  };

  const inp = { width: "100%", padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${G.greyLight}`, fontSize: 15, fontFamily: "'Lexend', sans-serif", background: G.surface, color: G.ink, outline: "none" };

  return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "0 20px", paddingTop: showBrandHeader ? 64 : 96, paddingBottom: 40 }}>
      {showBrandHeader && (
        <div style={{ display: "flex", alignItems: "center", marginBottom: 44 }}>
          <BrandLogo variant="wordmark" height={22} />
        </div>
      )}
      <div className="fade-up">
        <h2 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 32, fontWeight: 800, letterSpacing: "0.02em", color: G.ink, marginBottom: 8, lineHeight: 1.1 }}>Nouveau mot de passe</h2>
        <p style={{ color: G.grey, fontSize: 15, marginBottom: 28 }}>Choisis un nouveau mot de passe pour ton compte.</p>
        {error && <div style={{ background: "#FFE8E8", borderRadius: 10, padding: "10px 14px", marginBottom: 14, color: "#CC0000", fontSize: 13 }}>{error}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          <input type="password" placeholder="Nouveau mot de passe" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()} style={inp} />
          <input type="password" placeholder="Confirmer le mot de passe" value={confirm} onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()} style={inp} />
        </div>
        <Btn onClick={handle} disabled={loading || !password || !confirm} variant="blue">
          {loading ? "…" : "Enregistrer le mot de passe"}
        </Btn>
      </div>
    </div>
  );
};

const AuthScreen = ({ onAuth, onBack, onNavigateMode, initialMode = "password", showBrandHeader = true }) => {
  // mode :
  //   "password" — login classique avec mot de passe
  //   "register" — création de compte avec mot de passe
  //   "reset"    — réinitialisation du mot de passe
  const [mode, setMode] = useState(initialMode);
  useEffect(() => { setMode(initialMode); }, [initialMode]);
  useEffect(() => { captureReferralFromUrl(); }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);    // pour les autres flows (reset, register confirm)
  const referralCode = getStoredReferralCode();

  const switchMode = (m) => {
    if (m === "register" || m === "password") onNavigateMode?.(m);
    setMode(m);
    setError(null);
    setSuccess(null);
  };

  const handle = async () => {
    setError(null); setSuccess(null); setLoading(true);
    try {
      if (mode === "password") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuth(data.user);
      } else if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/app`,
            data: referralCode ? { referred_by: referralCode } : undefined,
          },
        });
        if (error) throw error;
        if (data.user && !data.user.identities?.length) throw new Error("Un compte existe déjà avec cet email.");
        setSuccess(referralCode
          ? "Compte créé ! Parrainage enregistré — vérifie ton email, puis connecte-toi."
          : "Compte créé ! Vérifie ton email pour confirmer, puis connecte-toi.");
        switchMode("password");
      } else if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/app`,
        });
        if (error) throw error;
        setSuccess("Email envoyé ! Vérifie ta boîte mail pour réinitialiser ton mot de passe.");
      }
    } catch (e) { setError(e.message || "Une erreur est survenue."); }
    finally { setLoading(false); }
  };

  const inp = { width: "100%", padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${G.greyLight}`, fontSize: 15, fontFamily: "'Lexend', sans-serif", background: G.surface, color: G.ink, outline: "none" };

  const titleMap = {
    password: "Connexion",
    register: "Créer un compte",
    reset:    "Mot de passe oublié",
  };
  const subtitleMap = {
    password: "Connecte-toi avec ton mot de passe.",
    register: referralCode
      ? `Code parrain ${referralCode} — −20% sur ta 1ère facture Premium.`
      : "Choisis un mot de passe pour ton compte.",
    reset:    "Entre ton email, on t'envoie un lien de réinitialisation.",
  };
  const ctaMap = {
    password: "Se connecter",
    register: "Créer mon compte",
    reset:    "Envoyer le lien",
  };

  return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "0 20px", paddingTop: showBrandHeader ? 64 : 96, paddingBottom: 40 }}>
      {(showBrandHeader || onBack) && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 44 }}>
          {showBrandHeader ? (
            <div style={{ display: "flex", alignItems: "center" }}>
              <BrandLogo variant="wordmark" height={24} />
            </div>
          ) : <div />}
          {onBack && (
            <button onClick={onBack} style={{ background: "none", border: `1px solid ${G.greyLight}`, borderRadius: 8, padding: "6px 12px", fontSize: 13, color: G.grey, cursor: "pointer" }}>
              ← Retour
            </button>
          )}
        </div>
      )}
      <div className="fade-up">
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 44, fontWeight: 800, letterSpacing: "0", textTransform: "uppercase", color: G.ink, marginBottom: 8, lineHeight: 1.0 }}>
          {titleMap[mode]}
        </h2>
        <p style={{ color: G.grey, fontSize: 15, marginBottom: 28, lineHeight: 1.5 }}>
          {subtitleMap[mode]}
        </p>

        {error   && <div style={{ background: "#FFE8E8", borderRadius: 10, padding: "10px 14px", marginBottom: 14, color: "#CC0000", fontSize: 13 }}>{error}</div>}
        {success && <div style={{ background: G.mintLight, borderRadius: 10, padding: "10px 14px", marginBottom: 14, color: "#00897B", fontSize: 13 }}>{success}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: mode === "password" ? 8 : 16 }}>
          <input type="email" placeholder="Ton email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()} style={inp} />
          {(mode === "password" || mode === "register") && (
            <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()} style={inp} />
          )}
        </div>

        {/* Lien mot de passe oublié — visible uniquement en mode password */}
        {mode === "password" && (
          <div style={{ textAlign: "right", marginBottom: 16 }}>
            <button onClick={() => switchMode("reset")} style={{ background: "none", border: "none", color: G.grey, fontSize: 13, cursor: "pointer", padding: 0 }}>
              Mot de passe oublié ?
            </button>
          </div>
        )}

        <Btn onClick={handle} disabled={loading || !email || ((mode === "password" || mode === "register") && !password)} variant="blue">
          {loading ? "…" : ctaMap[mode]}
        </Btn>

        {/* Toggles secondaires */}
        <div style={{ marginTop: 18, textAlign: "center", fontSize: 14, color: G.grey }}>
          {mode === "password" && (
            <>
              <button onClick={() => switchMode("register")} style={{ background: "none", border: "none", color: G.ink, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
                Créer un compte
              </button>
            </>
          )}
          {mode === "register" && (
            <button onClick={() => switchMode("password")} style={{ background: "none", border: "none", color: G.ink, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
              ← J'ai déjà un compte
            </button>
          )}
          {mode === "reset" && (
            <button onClick={() => switchMode("password")} style={{ background: "none", border: "none", color: G.ink, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
              ← Retour à la connexion
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── ONBOARDING ────────────────────────────────────────────────────────────
// ── STEP 1 : CATÉGORIE ────────────────────────────────────────────────────
const Step1_Category = ({ onSelect }) => (
  <div className="fade-up">
    <h2 style={{ fontSize: 28, fontWeight: 800, color: G.ink, marginBottom: 24, lineHeight: 1.1 }}>Ton objectif</h2>
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {CATEGORIES.map(cat => (
        <button key={cat.id} onClick={() => onSelect(cat.id)}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderRadius: 14, border: `1px solid ${G.greyLight}`, background: G.surface, cursor: "pointer", textAlign: "left" }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: G.ink }}>{cat.label}</span>
          <ArrowRight size={16} color={G.greyMid} />
        </button>
      ))}
    </div>
  </div>
);

// ── STEP 2 : SOUS-OBJECTIF ────────────────────────────────────────────────
const Step2_SubGoal = ({ category, onSelect, onBack }) => {
  const subs = SUB_GOALS[category] || [];
  const titles = { triathlon: "Quelle distance ?", eau_libre: "Ton objectif ?", diplome: "Quel diplôme ?" };
  return (
    <div className="fade-up">
      <h2 style={{ fontSize: 28, fontWeight: 800, color: G.ink, marginBottom: 24, lineHeight: 1.1 }}>{titles[category] || "Précise ton objectif"}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {subs.map(s => (
          <button key={s.id} onClick={() => onSelect(s.id)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderRadius: 14, border: `1px solid ${G.greyLight}`, background: G.surface, cursor: "pointer", textAlign: "left", gap: 12 }}>
            <span style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: G.ink }}>{s.label}</span>
              {s.dist && <span style={{ fontSize: 12, fontWeight: 500, color: G.grey, lineHeight: 1.35 }}>{s.dist}</span>}
            </span>
            <ChevronDown size={16} color={G.greyMid} style={{ transform: "rotate(-90deg)", flexShrink: 0 }} />
          </button>
        ))}
      </div>
      <button onClick={onBack} style={{ width: "100%", padding: "12px", background: "none", border: "none", color: G.grey, cursor: "pointer", fontSize: 14 }}>Retour</button>
    </div>
  );
};

const StepWeight = ({ weightCurrent, weightGoal, onChangeCurrent, onChangeGoal, onNext, onBack }) => {
  const loss = Math.max(0, (parseFloat(weightCurrent) || 0) - (parseFloat(weightGoal) || 0));
  const weeks = loss > 0 ? Math.min(16, Math.max(4, Math.ceil(loss * 2))) : null;
  const inp = { width: "100%", padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${G.greyLight}`, fontSize: 18, fontFamily: "'Lexend', sans-serif", fontWeight: 700, color: G.ink, background: G.surface, outline: "none", textAlign: "center" };
  return (
    <div className="fade-up">
      <p style={{ fontSize: 12, fontWeight: 600, color: G.grey, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Étape 2 sur 4</p>
      <h2 style={{ fontSize: 30, fontFamily: "'Lexend', sans-serif", fontWeight: 700, letterSpacing: "0.03em", color: G.ink, marginBottom: 6, lineHeight: 1.1 }}>Ton objectif<br />poids ?</h2>
      <p style={{ color: G.grey, fontSize: 15, marginBottom: 24 }}>On va calculer la durée de ton plan.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
        <div style={{ background: G.surface, borderRadius: 14, padding: "16px 20px", border: `1px solid ${G.greyLight}` }}>
          <label style={{ fontSize: 11, color: G.grey, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Poids actuel (kg)</label>
          <input type="number" inputMode="decimal" value={weightCurrent} onChange={e => onChangeCurrent(e.target.value)} placeholder="ex : 75" style={inp} />
        </div>
        <div style={{ background: G.surface, borderRadius: 14, padding: "16px 20px", border: `1px solid ${G.greyLight}` }}>
          <label style={{ fontSize: 11, color: G.grey, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Objectif (kg)</label>
          <input type="number" inputMode="decimal" value={weightGoal} onChange={e => onChangeGoal(e.target.value)} placeholder="ex : 72" style={inp} />
        </div>
      </div>
      {weeks && (
        <div style={{ background: G.blueLight, borderRadius: 12, padding: "12px 16px", marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
          <Target size={18} color={G.blue} />
          <span style={{ fontSize: 14, color: G.blue, fontWeight: 500 }}>Plan de <strong>{weeks} semaines</strong> généré pour −{loss.toFixed(1)} kg</span>
        </div>
      )}
      <Btn onClick={onNext} disabled={!weightCurrent || !weightGoal || parseFloat(weightCurrent) <= parseFloat(weightGoal)}>Continuer</Btn>
      <button onClick={onBack} style={{ width: "100%", marginTop: 10, padding: "12px", background: "none", border: "none", color: G.grey, cursor: "pointer", fontSize: 14 }}>← Retour</button>
    </div>
  );
};

const dateSelectStyle = {
  flex: 1,
  minWidth: 0,
  padding: "12px 14px",
  borderRadius: 12,
  border: `1.5px solid ${G.greyLight}`,
  background: G.greyXLight,
  fontSize: 15,
  fontWeight: 600,
  fontFamily: "'Lexend', sans-serif",
  color: G.ink,
  cursor: "pointer",
  outline: "none",
  appearance: "none",
  WebkitAppearance: "none",
};

const Step2_Date = ({ value, onChange, onNext, onBack }) => {
  const minD = eventMinDate();
  const maxYear = minD.getFullYear() + 2;
  const selected = parseISODate(value);
  const initialView = selected && selected >= minD ? selected : minD;

  const [viewYear, setViewYear] = useState(initialView.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialView.getMonth());
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!value) return;
    const d = parseISODate(value);
    if (d) {
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  const weeks = weeksUntil(value);
  const years = [];
  for (let y = minD.getFullYear(); y <= maxYear; y++) years.push(y);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDow = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const calendarCells = [];
  for (let i = 0; i < firstDow; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const pickDate = (day) => {
    const date = new Date(viewYear, viewMonth, day);
    date.setHours(0, 0, 0, 0);
    if (date < minD) {
      setErr("Minimum 6 semaines à partir d'aujourd'hui");
      onChange("");
      return;
    }
    setErr("");
    onChange(toISODate(viewYear, viewMonth + 1, day));
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const canPrevMonth = viewYear > minD.getFullYear() || (viewYear === minD.getFullYear() && viewMonth > minD.getMonth());
  const maxMonth = new Date(maxYear, 11, 31);
  const canNextMonth = viewYear < maxYear || (viewYear === maxYear && viewMonth < 11);

  const dayOptions = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(viewYear, viewMonth, d);
    date.setHours(0, 0, 0, 0);
    if (date >= minD && date <= maxMonth) dayOptions.push(d);
  }

  const selectedDay = selected && selected.getFullYear() === viewYear && selected.getMonth() === viewMonth
    ? selected.getDate()
    : "";

  const isDaySelected = (day) =>
    !!selected &&
    selected.getFullYear() === viewYear &&
    selected.getMonth() === viewMonth &&
    selected.getDate() === day;

  return (
    <div className="fade-up">
      <p style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>Étape 5 sur 5</p>
      <h2 style={{ fontSize: 38, fontFamily: "'Lexend', sans-serif", fontWeight: 800, letterSpacing: "0.02em", color: G.ink, marginBottom: 10, lineHeight: 1.0 }}>Date de<br />l'événement ?</h2>
      <p style={{ color: G.grey, fontSize: 16, marginBottom: 36 }}>Minimum 6 semaines pour un bon plan.</p>
      <div style={{ background: G.surface, borderRadius: 16, padding: "20px", marginBottom: 12, border: `1.5px solid ${err ? "#FF4757" : weeks ? G.blue : G.greyLight}`, transition: "border-color 0.2s" }}>
        <label style={{ fontSize: 11, color: G.grey, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 12 }}>Date de l'événement</label>

        {value && !err && (
          <div style={{ fontSize: 15, fontWeight: 600, color: G.blue, marginBottom: 14, textTransform: "capitalize" }}>
            {formatDateFR(value)}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <select
            value={viewMonth}
            onChange={e => setViewMonth(Number(e.target.value))}
            style={dateSelectStyle}
            aria-label="Mois"
          >
            {MONTHS_FR.map((name, i) => {
              const monthStart = new Date(viewYear, i, 1);
              const monthEnd = new Date(viewYear, i + 1, 0);
              monthEnd.setHours(23, 59, 59, 999);
              if (monthEnd < minD || monthStart > maxMonth) return null;
              return <option key={name} value={i}>{name}</option>;
            })}
          </select>
          <select
            value={viewYear}
            onChange={e => setViewYear(Number(e.target.value))}
            style={{ ...dateSelectStyle, flex: "0 0 96px" }}
            aria-label="Année"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <button
            type="button"
            onClick={prevMonth}
            disabled={!canPrevMonth}
            aria-label="Mois précédent"
            style={{ width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${G.greyLight}`, background: G.surface, color: G.ink, cursor: canPrevMonth ? "pointer" : "not-allowed", opacity: canPrevMonth ? 1 : 0.35, fontSize: 18, lineHeight: 1 }}
          >‹</button>
          <span style={{ fontSize: 14, fontWeight: 700, color: G.inkLight }}>{MONTHS_FR[viewMonth]} {viewYear}</span>
          <button
            type="button"
            onClick={nextMonth}
            disabled={!canNextMonth}
            aria-label="Mois suivant"
            style={{ width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${G.greyLight}`, background: G.surface, color: G.ink, cursor: canNextMonth ? "pointer" : "not-allowed", opacity: canNextMonth ? 1 : 0.35, fontSize: 18, lineHeight: 1 }}
          >›</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 14 }}>
          {WEEKDAYS_FR.map(w => (
            <div key={w} style={{ fontSize: 11, fontWeight: 700, color: G.grey, textAlign: "center", padding: "4px 0" }}>{w}</div>
          ))}
          {calendarCells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />;
            const disabled = new Date(viewYear, viewMonth, day) < minD;
            const isSel = isDaySelected(day);
            const today = (() => {
              const t = new Date(); t.setHours(0, 0, 0, 0);
              const d = new Date(viewYear, viewMonth, day);
              return d.getTime() === t.getTime();
            })();
            return (
              <button
                key={`d-${day}-${i}`}
                type="button"
                disabled={disabled}
                onClick={() => pickDate(day)}
                aria-label={`${day} ${MONTHS_FR[viewMonth]} ${viewYear}`}
                aria-pressed={isSel}
                style={{
                  aspectRatio: "1",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: isSel ? 700 : 500,
                  fontFamily: "'Lexend', sans-serif",
                  cursor: disabled ? "not-allowed" : "pointer",
                  background: isSel ? G.blue : today ? G.blueLight : "transparent",
                  color: isSel ? G.white : disabled ? G.greyMid : G.ink,
                  opacity: disabled ? 0.35 : 1,
                }}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: G.grey, flexShrink: 0 }}>Jour</span>
          <select
            value={selectedDay}
            onChange={e => { const d = Number(e.target.value); if (d) pickDate(d); }}
            style={{ ...dateSelectStyle, flex: 1 }}
            aria-label="Jour"
          >
            <option value="">Choisir un jour…</option>
            {dayOptions.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>
      {err && <div style={{ fontSize: 13, color: "#FF4757", marginBottom: 12, paddingLeft: 4 }}>{err}</div>}
      {weeks && !err && (
        <div style={{ background: G.ink, borderRadius: 14, padding: "16px 20px", marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: G.white }}>{weeks} semaines</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>de préparation · Programme complet</div>
          </div>
          <Calendar size={20} color="rgba(255,255,255,0.3)" />
        </div>
      )}
      <Btn onClick={onNext} disabled={!value}>Générer mon plan</Btn>
      <button onClick={onBack} style={{ width: "100%", marginTop: 10, padding: "14px", background: "none", border: "none", color: G.grey, cursor: "pointer", fontSize: 14 }}>← Retour</button>
    </div>
  );
};


const Step3_Level = ({ value, onChange, pool, onPoolChange, onNext, onBack, total = 6, disabledLevels = [] }) => (
  <div className="fade-up">
    <h2 style={{ fontSize: 28, fontWeight: 800, color: G.ink, marginBottom: 20, lineHeight: 1.1 }}>Ton niveau</h2>
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
      {LEVELS.map(l => {
        const isActive = value === l.id;
        const isDisabled = disabledLevels.includes(l.id);
        return (
          <button key={l.id}
            onClick={() => !isDisabled && onChange(l.id)}
            disabled={isDisabled}
            style={{
              padding: "14px 16px", borderRadius: 14,
              border: `2px solid ${isDisabled ? G.greyLight : isActive ? l.color : G.greyLight}`,
              background: isDisabled ? G.greyXLight : isActive ? l.bg : G.surface,
              cursor: isDisabled ? "default" : "pointer", textAlign: "left", opacity: isDisabled ? 0.55 : 1,
            }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: isDisabled ? G.grey : isActive ? l.color : G.ink }}>{l.label}</div>
            {!isDisabled && <div style={{ fontSize: 13, color: G.grey, marginTop: 2 }}>{l.desc}</div>}
          </button>
        );
      })}
    </div>
    <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
      {POOLS.map(p => (
        <button key={p.id} onClick={() => onPoolChange(p.id)} style={{ flex: 1, padding: "14px", borderRadius: 12, border: `2px solid ${pool === p.id ? G.ink : G.greyLight}`, background: pool === p.id ? G.ink : G.surface, color: pool === p.id ? G.inverse : G.ink, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>{p.label}</button>
      ))}
    </div>
    <Btn onClick={onNext} disabled={!value}>Continuer</Btn>
    <button onClick={onBack} style={{ width: "100%", marginTop: 10, padding: "12px", background: "none", border: "none", color: G.grey, cursor: "pointer", fontSize: 14 }}>Retour</button>
  </div>
);

// ── STEP 4 : TEMPS AU 100m (T100) — Premium ─────────────────────────────
// Helper partagé : parse "m:ss" ou "mm:ss" en secondes
function parsePaceInput(raw, maxSecs = 9 * 60) {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length < 3) return { val: null, err: "" };
  // "155" → 1:55 ; "1045" → 10:45
  let mins, secs;
  if (digits.length <= 3) { mins = parseInt(digits[0]); secs = parseInt(digits.slice(1)); }
  else { mins = parseInt(digits.slice(0, 2)); secs = parseInt(digits.slice(2)); }
  if (secs >= 60) return { val: null, err: "Les secondes doivent être entre 00 et 59" };
  const total = mins * 60 + secs;
  if (total < 30) return { val: null, err: "Trop rapide — minimum 30 secondes" };
  if (total > maxSecs) return { val: null, err: `Maximum ${Math.floor(maxSecs/60)} minutes` };
  return { val: total, err: "" };
}
function fmtDigits(raw, maxLen = 3) {
  const digits = raw.replace(/\D/g, "").slice(0, maxLen);
  if (digits.length <= 2) return digits;
  const split = maxLen === 4 ? 2 : 1;
  return digits.slice(0, split) + ":" + digits.slice(split);
}
function secToDisplay(secs) {
  if (!secs) return "";
  return `${Math.floor(secs/60)}:${Math.round(secs%60).toString().padStart(2,'0')}`;
}

// Composant input pace réutilisable
function PaceInput({ label, hint, placeholder, value, onChange, maxLen = 3, minSec = 30, maxSec = 9 * 60 }) {
  const [raw, setRaw] = useState(value ? secToDisplay(value) : "");
  const [err, setErr] = useState("");

  const handle = (input) => {
    const digits = input.replace(/\D/g, "").slice(0, maxLen);
    const formatted = fmtDigits(input, maxLen);
    setRaw(formatted);
    if (digits.length < (maxLen === 4 ? 3 : 3)) { onChange(null); setErr(""); return; }
    const { val, err: e } = parsePaceInput(input, maxSec);
    if (val && val < minSec) { setErr(`Minimum ${Math.floor(minSec/60)}:${String(minSec%60).padStart(2,'0')}`); onChange(null); return; }
    setErr(e);
    onChange(val);
  };

  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: G.ink }}>{label}</span>
        <span style={{ fontSize: 12, color: G.grey }}>{hint}</span>
      </div>
      <input
        type="text" inputMode="numeric"
        placeholder={placeholder}
        value={raw}
        onChange={e => handle(e.target.value)}
        style={{
          width: "100%", boxSizing: "border-box",
          padding: "16px 14px", fontSize: 24,
          fontFamily: "'Lexend', sans-serif", fontWeight: 700,
          textAlign: "center", letterSpacing: "0.06em",
          border: `2px solid ${err ? "#FF3B30" : value ? G.blue : G.greyLight}`,
          borderRadius: 14, outline: "none", background: G.surface, color: G.ink,
          transition: "border-color 0.2s",
        }}
      />
      {err && <p style={{ color: "#FF3B30", fontSize: 12, marginTop: 4 }}>{err}</p>}
    </div>
  );
}

const Step_Pace = ({ value, onChange, onNext, onSkip, onBack, total = 6 }) => {
  const zoneMult = appZoneMultForT100(value);
  const ZONES = [
    { label: "Endurance",  key: "easy",      color: "#34C759" },
    { label: "Seuil",      key: "threshold", color: "#FF9F0A" },
    { label: "Sprint",     key: "sprint",    color: "#FF3B30" },
  ];

  const fmtZone = (secs) => `${Math.floor(secs/60)}'${String(Math.round(secs%60)).padStart(2,'0')}"/100m`;

  return (
    <div className="fade-up">
      <p style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Étape 4 sur {total}</p>
      <h2 style={{ fontSize: 30, fontFamily: "'Lexend', sans-serif", fontWeight: 800, color: G.ink, marginBottom: 8, lineHeight: 1.1 }}>
        Ton temps sur 100 m
      </h2>
      <p style={{ color: G.grey, fontSize: 15, marginBottom: 12, lineHeight: 1.5 }}>
        Un seul test de référence (T100) suffit. On en déduit tes zones d&apos;intensité pour chaque séance.
      </p>

      <div style={{
        background: G.blueLight, borderRadius: 14, padding: "12px 14px", marginBottom: 18,
        border: `1px solid ${G.blueMid}55`,
      }}>
        <p style={{ fontSize: 13, color: G.blueDeep, lineHeight: 1.5, margin: 0, fontWeight: 600 }}>
          Comment faire le test : nage 100 m crawl à fond en départ dans l&apos;eau (pas de plongeon depuis le plot). Chronomètre dès la poussée au mur.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        <PaceInput
          label="100 m crawl (T100)"
          hint="ex : 1:45"
          placeholder="1:45"
          value={value}
          onChange={onChange}
          maxLen={3}
          minSec={45}
          maxSec={5 * 60}
        />
      </div>

      {value && (
        <div style={{ background: G.greyXLight, borderRadius: 14, padding: "14px 16px", marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>
            Tes zones d&apos;intensité
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ZONES.map((z, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: z.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: G.ink, flex: 1 }}>{z.label}</span>
                <span style={{ fontFamily: "'Lexend', sans-serif", fontSize: 14, fontWeight: 700, color: z.color }}>
                  {fmtZone(Math.round(value * zoneMult[z.key]))}
                </span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: G.greyMid, marginTop: 10, marginBottom: 0, lineHeight: 1.4 }}>
            Plus ton T100 est rapide, plus les allures de zone sont un peu plus tolérantes (moins dures).
          </p>
        </div>
      )}

      <Btn variant="blue" onClick={onNext} disabled={!value}>Utiliser ce temps</Btn>
      <button onClick={onSkip} style={{ width: "100%", marginTop: 10, padding: "12px", background: "none", border: `1px solid ${G.greyLight}`, borderRadius: 12, color: G.grey, cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
        Je ne connais pas mon temps
      </button>
      <button onClick={onBack} style={{ width: "100%", marginTop: 8, padding: "12px", background: "none", border: "none", color: G.grey, cursor: "pointer", fontSize: 14 }}>
        Retour
      </button>
    </div>
  );
};

const Step4_Frequency = ({ value, onChange, onNext, onBack, isLast = false, total = 6, isPremium, onUpgrade }) => (
  <div className="fade-up">
    <h2 style={{ fontSize: 28, fontWeight: 800, color: G.ink, marginBottom: 8, lineHeight: 1.1 }}>Séances par semaine</h2>
    <p style={{ fontSize: 14, color: G.grey, marginBottom: 20, lineHeight: 1.45 }}>
      Gratuit jusqu’à {FREE_FREQ_LIMIT}×. Au-delà, Premium débloque la charge complète.
    </p>
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
      {FREQUENCIES.map(f => {
        const locked = !isPremium && f.id > FREE_FREQ_LIMIT;
        const isActive = value === f.id;
        return (
          <button key={f.id} onClick={() => locked ? onUpgrade?.() : onChange(f.id)} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "18px 20px", borderRadius: 16,
            border: `2px solid ${isActive ? G.blue : locked ? G.greyLight : G.greyLight}`,
            background: isActive ? G.blue : locked ? G.greyXLight : G.surface,
            cursor: "pointer", transition: "all 0.2s",
            boxShadow: isActive ? "0 4px 16px rgba(0,87,255,0.2)" : "0 2px 8px rgba(0,0,0,0.04)",
            opacity: locked ? 0.8 : 1,
          }}>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: isActive ? G.white : locked ? G.greyMid : G.ink }}>{f.label}</div>
            </div>
            {isActive && !locked && <Check size={16} color={G.white} />}
            {locked && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, background: G.gold + "22", borderRadius: 100, padding: "4px 10px" }}>
                <Lock size={11} color={G.gold} />
                <span style={{ fontSize: 11, fontWeight: 700, color: G.gold }}>Premium</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
    <Btn variant="blue" onClick={onNext} disabled={!value}>{isLast ? "Générer mon plan" : "Continuer"}</Btn>
    <button onClick={onBack} style={{ width: "100%", marginTop: 10, padding: "12px", background: "none", border: "none", color: G.grey, cursor: "pointer", fontSize: 14 }}>← Retour</button>
  </div>
);

// ── LOADING ───────────────────────────────────────────────────────────────
const Loading = () => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 16, background: G.bg }}>
    <Waves size={40} color={G.blue} />
    <p style={{ color: G.grey, fontSize: 15 }}>Génération du plan…</p>
  </div>
);

// ── SHARE MODAL ───────────────────────────────────────────────────────────
const ShareModal = ({ session, goalLabel, onClose }) => {
  const tm = TYPE_META[session.type] || TYPE_META.ENDURANCE;
  const handleDownload = () => {
    const canvas = createShareCanvas(session, goalLabel);
    const link = document.createElement("a");
    link.download = "myswym-seance.png"; link.href = canvas.toDataURL("image/png"); link.click();
  };
  const handleShare = async () => {
    if (!navigator.share) { handleDownload(); return; }
    const canvas = createShareCanvas(session, goalLabel);
    canvas.toBlob(async (blob) => {
      try { await navigator.share({ files: [new File([blob], "myswym-seance.png", { type: "image/png" })], title: "Ma séance MySWYM" }); }
      catch { handleDownload(); }
    });
  };
  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet-panel scale-in" style={{ background: G.surface, borderRadius: "24px 24px 0 0", padding: "28px 20px", paddingBottom: "max(28px, env(safe-area-inset-bottom))" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: G.greyLight, margin: "0 auto 24px" }} />
        <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: "0.04em", color: G.ink, marginBottom: 20, textAlign: "center" }}>Partage ta séance</h3>
        <div style={{ background: `linear-gradient(135deg, ${G.blue} 0%, ${G.blueDeep} 100%)`, borderRadius: 20, padding: 24, marginBottom: 20, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(142,179,255,0.15)" }} />
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: G.mint, borderRadius: 20, padding: "5px 14px", marginBottom: 16 }}>
            <Check size={12} color={G.white} /><span style={{ fontSize: 12, fontWeight: 700, color: G.white }}>Séance terminée</span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: tm.color, letterSpacing: 1.5, marginBottom: 6, textTransform: "uppercase" }}>{session.type}</div>
          <div style={{ fontFamily: "'Lexend', sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: "0.03em", color: G.white, marginBottom: 16 }}>{session.title}</div>
          <div style={{ display: "flex", gap: 12 }}>
            {[{ v: session.distance, l: "Distance" }, { v: formatDuration(session.duration), l: "Durée" }, { v: session.intensity, l: "Intensité" }].map((s, i) => (
              <div key={i} style={{ flex: 1, background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>{s.l}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: G.white }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={handleDownload} variant="secondary" style={{ flex: 1 }}>Télécharger</Btn>
          <Btn onClick={handleShare}   variant="blue"      style={{ flex: 1 }}>Partager</Btn>
        </div>
        <button onClick={onClose} style={{ width: "100%", marginTop: 10, padding: "12px", background: "none", border: "none", color: G.grey, cursor: "pointer", fontSize: 13 }}>Fermer</button>
      </div>
    </div>
  );
};

// ── FEEDBACK MODAL — smiley system ────────────────────────────────────────
// SVG faces — Apple-style minimal, no emoji
const FaceGood = ({ size = 56, color = "#00C48C" }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
    <circle cx="28" cy="28" r="26" stroke={color} strokeWidth="2.5" fill="none"/>
    <circle cx="20" cy="23" r="2.5" fill={color}/>
    <circle cx="36" cy="23" r="2.5" fill={color}/>
    <path d="M18 33 Q28 43 38 33" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
  </svg>
);
const FaceMid = ({ size = 56, color = "#FF9F0A" }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
    <circle cx="28" cy="28" r="26" stroke={color} strokeWidth="2.5" fill="none"/>
    <circle cx="20" cy="23" r="2.5" fill={color}/>
    <circle cx="36" cy="23" r="2.5" fill={color}/>
    <path d="M19 36 H37" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);
const FaceTired = ({ size = 56, color = "#FF3B30" }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
    <circle cx="28" cy="28" r="26" stroke={color} strokeWidth="2.5" fill="none"/>
    <circle cx="20" cy="23" r="2.5" fill={color}/>
    <circle cx="36" cy="23" r="2.5" fill={color}/>
    <path d="M18 39 Q28 29 38 39" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
  </svg>
);

const SMILEY_OPTS = [
  { id: "easy", Face: FaceGood,  label: "En forme",         sub: "Séances faciles à tenir",     color: "#00C48C", bg: "#E6FFF6" },
  { id: "ok",   Face: FaceMid,   label: "Correct",          sub: "Effort modéré — bon rythme",  color: "#FF9F0A", bg: "#FFF8EE" },
  { id: "hard", Face: FaceTired, label: "Difficile",        sub: "Fatigue ou surcharge",        color: "#FF3B30", bg: "#FFF0EF" },
];

const SESSION_SMILEY_OPTS = [
  { id: "easy", Face: FaceGood,  label: "Trop facile", color: "#00C48C", bg: "#E6FFF6" },
  { id: "ok",   Face: FaceMid,   label: "Juste bien",  color: "#FF9F0A", bg: "#FFF8EE" },
  { id: "hard", Face: FaceTired, label: "Trop dur",    color: "#FF3B30", bg: "#FFF0EF" },
];

const FeedbackModal = ({ weekNumber, onSubmit, onSkip, isPremium }) => {
  const [selected, setSelected] = useState(null);

  const confirm = (id) => {
    setSelected(id);
    // Légère vibration tactile si disponible
    if (navigator.vibrate) navigator.vibrate(40);
    // Soumettre après une courte animation
    setTimeout(() => onSubmit({ rating: id, motivation: id, pain: "none", comment: null }), 320);
  };

  return (
    <div className="sheet-overlay">
      <div className="sheet-panel scale-in" style={{ background: G.surface, borderRadius: "28px 28px 0 0", padding: "24px 20px", paddingBottom: "max(32px, env(safe-area-inset-bottom))" }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: G.greyLight, margin: "0 auto 24px" }} />

        <p style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: 2, textTransform: "uppercase", textAlign: "center", marginBottom: 8 }}>
          Semaine {weekNumber} terminée
        </p>
        <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 24, fontWeight: 800, color: G.ink, textAlign: "center", marginBottom: 6 }}>
          Comment tu t'es senti·e ?
        </h3>
        <p style={{ color: G.grey, fontSize: 14, textAlign: "center", marginBottom: isPremium ? 28 : 12, lineHeight: 1.5 }}>
          {isPremium
            ? "Ta réponse ajuste le volume des prochaines séances."
            : "On enregistre ton ressenti pour suivre ta progression."}
        </p>
        {!isPremium && (
          <p style={{ color: G.gold, fontSize: 12, fontWeight: 600, textAlign: "center", marginBottom: 28, background: G.goldLight, borderRadius: 10, padding: "8px 12px", lineHeight: 1.45 }}>
            Premium : ajustement automatique si c'était trop facile ou trop dur.
          </p>
        )}

        {/* 3 smiley cards */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {SMILEY_OPTS.map(o => {
            const isActive = selected === o.id;
            return (
              <button key={o.id} onClick={() => confirm(o.id)} style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                padding: "18px 8px", borderRadius: 20,
                border: `2px solid ${isActive ? o.color : G.greyLight}`,
                background: isActive ? o.bg : G.surface,
                cursor: "pointer", transition: "all 0.18s",
                transform: isActive ? "scale(1.04)" : "scale(1)",
              }}>
                <o.Face size={52} color={o.color} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: isActive ? o.color : G.ink, marginBottom: 2 }}>{o.label}</div>
                  <div style={{ fontSize: 11, color: G.grey, lineHeight: 1.3 }}>{o.sub}</div>
                </div>
              </button>
            );
          })}
        </div>

        <button onClick={onSkip} style={{ width: "100%", padding: "11px", background: "none", border: "none", color: G.greyMid, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
          Passer
        </button>
      </div>
    </div>
  );
};

const SessionFeedbackSheet = ({ sessionTitle, initial, onSubmit, onSkip, isPremium }) => {
  const [rating, setRating] = useState(initial?.rating ?? null);
  const [tags, setTags] = useState(() => Array.isArray(initial?.tags) ? [...initial.tags] : []);
  const [comment, setComment] = useState(initial?.comment ?? "");

  const toggleTag = (tag) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const save = () => {
    if (!rating) return;
    if (navigator.vibrate) navigator.vibrate(40);
    onSubmit({
      rating,
      tags,
      comment: comment.trim() || null,
    });
  };

  return (
    <div className="sheet-overlay">
      <div className="sheet-panel scale-in" style={{ background: G.surface, borderRadius: "28px 28px 0 0", padding: "24px 20px", paddingBottom: "max(32px, env(safe-area-inset-bottom))", maxHeight: "90dvh", overflowY: "auto" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: G.greyLight, margin: "0 auto 24px" }} />

        <p style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: 2, textTransform: "uppercase", textAlign: "center", marginBottom: 8 }}>
          Retour séance
        </p>
        <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 22, fontWeight: 800, color: G.ink, textAlign: "center", marginBottom: 6 }}>
          Comment c'était ?
        </h3>
        {sessionTitle && (
          <p style={{ color: G.grey, fontSize: 13, textAlign: "center", marginBottom: 8, lineHeight: 1.4 }}>
            {sessionTitle}
          </p>
        )}
        <p style={{ color: G.grey, fontSize: 13, textAlign: "center", marginBottom: isPremium ? 20 : 10, lineHeight: 1.45 }}>
          {isPremium
            ? "Ton ressenti affine le volume des prochaines séances."
            : "Ton avis nous aide à améliorer les séances."}
        </p>
        {!isPremium && (
          <p style={{ color: G.gold, fontSize: 12, fontWeight: 600, textAlign: "center", marginBottom: 20, background: G.goldLight, borderRadius: 10, padding: "8px 12px", lineHeight: 1.45 }}>
            Premium : micro-ajustement auto si trop facile ou trop dur.
          </p>
        )}

        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          {SESSION_SMILEY_OPTS.map(o => {
            const isActive = rating === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => setRating(o.id)}
                style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  padding: "14px 6px", borderRadius: 18,
                  border: `2px solid ${isActive ? o.color : G.greyLight}`,
                  background: isActive ? o.bg : G.surface,
                  cursor: "pointer", transition: "all 0.18s",
                  transform: isActive ? "scale(1.03)" : "scale(1)",
                }}
              >
                <o.Face size={44} color={o.color} />
                <div style={{ fontSize: 13, fontWeight: 700, color: isActive ? o.color : G.ink }}>{o.label}</div>
              </button>
            );
          })}
        </div>

        <p style={{ fontSize: 12, fontWeight: 700, color: G.inkLight, marginBottom: 10 }}>
          Qu'est-ce qui cloche (ou pas) ?
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {SESSION_FEEDBACK_TAGS.map(tag => {
            const on = tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                style={{
                  padding: "8px 12px", borderRadius: 100, cursor: "pointer",
                  border: `1.5px solid ${on ? G.blue : G.greyLight}`,
                  background: on ? G.blueLight : G.surface,
                  color: on ? G.blue : G.grey, fontSize: 12, fontWeight: 600,
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>

        <input
          type="text"
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Un commentaire ? (optionnel)"
          maxLength={280}
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "12px 14px", borderRadius: 12, marginBottom: 16,
            border: `1.5px solid ${G.greyLight}`, background: G.greyXLight,
            fontSize: 14, color: G.ink, fontFamily: "inherit", outline: "none",
          }}
        />

        <button
          type="button"
          onClick={save}
          disabled={!rating}
          style={{
            width: "100%", padding: "14px", borderRadius: 14, border: "none",
            background: rating ? G.blue : G.greyLight,
            color: rating ? G.white : G.greyMid,
            fontSize: 15, fontWeight: 700, cursor: rating ? "pointer" : "not-allowed",
            marginBottom: 8,
          }}
        >
          Enregistrer
        </button>
        <button type="button" onClick={onSkip} style={{ width: "100%", padding: "11px", background: "none", border: "none", color: G.greyMid, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
          Passer
        </button>
      </div>
    </div>
  );
};

// ── BADGE TOAST ───────────────────────────────────────────────────────────
const BadgeToast = ({ badgeId }) => {
  const b = BADGE_DEFS.find(d => d.id === badgeId);
  if (!b) return null;
  return (
    <div className="toast-in" style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 300, background: G.ink, borderRadius: 20, padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.25)", whiteSpace: "nowrap" }}>
      <div className="badge-pop" style={{ width: 40, height: 40, borderRadius: "50%", background: b.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <b.icon size={18} color={G.white} />
      </div>
      <div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Badge débloqué</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: G.white }}>{b.label}</div>
      </div>
    </div>
  );
};

// ── FREEMIUM ──────────────────────────────────────────────────────────────
const FREE_WEEKS_LIMIT = 4;
const FREE_FREQ_LIMIT = 3;
const SOFT_PAYWALL_STORAGE_KEY = "myswym_soft_paywall_v1";
const PLAN_VERSION = 33; // v33 = blocs technique lisibles (1 n° = 1 bloc)
// true : overwrite TOUS les plans au chargement. Remettre false après le bump.
const FORCE_PLAN_REGEN = true;

const FREE_TIER_LINES = [
  "4 premières semaines du plan",
  "Jusqu'à 3 séances par semaine",
  "Tous les objectifs (triathlon, BNSSA, eau libre…)",
  "Retours hebdo sans ajustement auto",
  "Intervalles en récupération (R…)",
];

const countCompletedSessions = (p) =>
  (p?.weeks || []).reduce((n, w) => n + (w.sessions || []).filter((s) => s.completed).length, 0);

const PREMIUM_TIER_LINES = [
  "Plan complet jusqu'à ton événement",
  "Jusqu'à 5 séances par semaine",
  "Allures cibles par zone (à la seconde)",
  "Courbe d'évolution des temps (profil)",
  "Copier la séance (WhatsApp / Strava)",
  "Vidéos techniques Instagram",
  "Départs avec allure cible (D…)",
  "Plusieurs projets · modifier fréquence et allure",
];

const PlanTierComparison = ({ compact = false }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: compact ? 8 : 10, marginBottom: compact ? 0 : 20 }}>
    <div style={{ border: `1px solid ${G.greyLight}`, borderRadius: 14, padding: compact ? "10px 8px" : "12px 10px", background: G.surface }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: G.grey, letterSpacing: "0.08em", marginBottom: 8 }}>GRATUIT</div>
      {FREE_TIER_LINES.map((line, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: i < FREE_TIER_LINES.length - 1 ? 6 : 0 }}>
          <Check size={11} color={G.greyMid} style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: compact ? 10 : 11, color: G.grey, lineHeight: 1.4 }}>{line}</span>
        </div>
      ))}
    </div>
    <div style={{ border: `2px solid ${G.blue}`, borderRadius: 14, padding: compact ? "10px 8px" : "12px 10px", background: G.blueLight }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: G.blue, letterSpacing: "0.08em", marginBottom: 8 }}>PREMIUM</div>
      {PREMIUM_TIER_LINES.map((line, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: i < PREMIUM_TIER_LINES.length - 1 ? 6 : 0 }}>
          <Check size={11} color={G.blue} style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: compact ? 10 : 11, color: G.ink, fontWeight: 600, lineHeight: 1.4 }}>{line}</span>
        </div>
      ))}
    </div>
  </div>
);

const SubscriptionStatusCard = ({ isPremium, plan, onUpgrade, onRefreshStatus }) => {
  if (isPremium) {
    return (
      <div style={{ background: G.ink, borderRadius: 16, padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Zap size={18} color={G.gold} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: G.white }}>Premium actif</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>Plan complet · départs D… · multi-projets</div>
        </div>
      </div>
    );
  }
  const totalWeeks = plan?.totalRealWeeks ?? plan?.weeks?.length ?? FREE_WEEKS_LIMIT;
  const shownWeeks = Math.min(FREE_WEEKS_LIMIT, plan?.weeks?.length ?? FREE_WEEKS_LIMIT);
  return (
    <div style={{ background: G.surface, borderRadius: 16, padding: "16px", marginBottom: 16, border: `1px solid ${G.greyLight}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Ton abonnement</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: G.ink }}>Gratuit</div>
          <div style={{ fontSize: 12, color: G.grey, marginTop: 4 }}>
            {shownWeeks} semaine{shownWeeks > 1 ? "s" : ""} accessibles
            {totalWeeks > shownWeeks ? ` sur ${totalWeeks} prévues` : ""}
          </div>
        </div>
        <button onClick={onUpgrade} style={{ padding: "9px 14px", borderRadius: 10, border: "none", background: G.blue, color: G.white, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
          Voir Premium
        </button>
      </div>
      <PlanTierComparison compact />
      {onRefreshStatus && (
        <button onClick={onRefreshStatus} style={{ width: "100%", marginTop: 12, padding: "10px", borderRadius: 10, border: `1px solid ${G.greyLight}`, background: G.greyXLight, color: G.grey, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Actualiser le statut (déjà payé ?)
        </button>
      )}
    </div>
  );
};

const PRICE_MONTHLY  = "price_1TPjyPAS4mfgF2Twx3Zh4zrJ";
const PRICE_ANNUAL   = "price_1TudyVAS4mfgF2TwHiSo3Vrg";
const PRICE_BIENNIAL = "price_1Tue7cAS4mfgF2TwP53wZ7qn";

const ReferralShareCard = () => {
  const [code, setCode] = useState(null);
  const [shareUrl, setShareUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: refreshData } = await supabase.auth.refreshSession();
        const session = refreshData?.session;
        if (!session) throw new Error("Non connecté");
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ensure-referral-code`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: "{}",
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Erreur parrainage");
        if (!cancelled) {
          setCode(json.code);
          setShareUrl(json.shareUrl);
        }
      } catch (e) {
        if (!cancelled) setErr(e.message || "Impossible de charger le lien");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const copy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <div style={{
      marginTop: 10, padding: 14, borderRadius: 14,
      border: `1px solid ${G.greyLight}`, background: G.surface,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: G.ink, marginBottom: 4 }}>Parraine un nageur</div>
      <div style={{ fontSize: 12, color: G.grey, lineHeight: 1.45, marginBottom: 10 }}>
        Ton ami bénéficie de −20% sur sa 1ère facture. Tu reçois 4,99€ de crédit quand il s’abonne.
      </div>
      {loading && <div style={{ fontSize: 12, color: G.greyMid }}>Chargement du lien…</div>}
      {err && <div style={{ fontSize: 12, color: "#CC0000" }}>{err}</div>}
      {code && shareUrl && (
        <>
          <div style={{
            fontFamily: "monospace", fontSize: 18, fontWeight: 700, letterSpacing: "0.12em",
            color: G.blue, marginBottom: 8,
          }}>{code}</div>
          <button
            type="button"
            onClick={copy}
            style={{
              width: "100%", padding: "11px 12px", borderRadius: 12, border: `1.5px solid ${G.blue}`,
              background: G.blueLight, color: G.blue, fontWeight: 700, fontSize: 13, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {copied ? <><CheckCheck size={15} /> Lien copié</> : <><Copy size={15} /> Copier le lien d’invitation</>}
          </button>
        </>
      )}
    </div>
  );
};

const UpgradeModal = ({ onClose, weeksBlocked, softContext = null }) => {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [period, setPeriod] = useState(weeksBlocked ? "biennial" : softContext ? "annual" : "annual");
  const [user, setUser] = useState(null);

  useEffect(() => {
    captureReferralFromUrl();
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null));
  }, []);

  const hasReferral = Boolean(resolveReferralCode(user));

  const callFunction = async (fnName, body) => {
    const { data: refreshData } = await supabase.auth.refreshSession();
    const session = refreshData?.session;
    if (!session) throw new Error("Connecte-toi d'abord.");
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${fnName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}`, "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  const handleCheckout = async () => {
    setLoading(true); setErr(null);
    try {
      const priceId = period === "biennial" ? PRICE_BIENNIAL
        : period === "annual" ? PRICE_ANNUAL
        : PRICE_MONTHLY;
      const referralCode = resolveReferralCode(user);
      const json = await callFunction("create-checkout", {
        origin: window.location.origin,
        priceId,
        ...(referralCode ? { referralCode } : {}),
      });
      if (json.url) { window.location.href = json.url; return; }
      throw new Error(json.error || "Lien de paiement introuvable");
    } catch (e) { setErr(e.message || "Erreur."); setLoading(false); }
  };

  const isAnnual = period === "annual";
  const isBiennial = period === "biennial";
  const ctaLabel = isBiennial
    ? "Démarrer — 29,99€ / 2 ans"
    : isAnnual
      ? "Démarrer — 29,99€/an"
      : hasReferral
        ? "Démarrer — −20% parrainage"
        : "Démarrer — 4,99€/mois";

  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet-panel scale-in" style={{ background: G.surface, borderRadius: "24px 24px 0 0", padding: "28px 20px", paddingBottom: "max(28px, env(safe-area-inset-bottom))", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: G.greyLight, margin: "0 auto 24px" }} />
        <div style={{ textAlign: "center", marginBottom: 24, paddingTop: 8 }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: G.ink, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Zap size={26} color={G.white} />
          </div>
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 34, fontWeight: 800, letterSpacing: "0", textTransform: "uppercase", color: G.ink, marginBottom: 8 }}>
            {softContext === "after_first_session" ? "Belle première séance" : "MySWYM Premium"}
          </h3>
          {softContext === "after_first_session"
            ? <p style={{ color: G.grey, fontSize: 14, lineHeight: 1.6 }}>Tu as déjà le rythme. Premium garde ce momentum jusqu’au jour J — sans coupure à la semaine 5.<br /><span style={{ color: G.greyMid, fontSize: 13 }}>Tu peux continuer en gratuit, sans pression.</span></p>
            : weeksBlocked
            ? <p style={{ color: G.grey, fontSize: 14, lineHeight: 1.6 }}>Ton mois gratuit est terminé.<br /><strong style={{ color: G.ink }}>Offre spéciale : Premium 2 ans à −50%.</strong></p>
            : <p style={{ color: G.grey, fontSize: 14 }}>Entraîne-toi sans limites.</p>}
        </div>

        {/* Offre 2 ans — mise en avant (promo unlock après 4 semaines) */}
        <button onClick={() => setPeriod("biennial")} style={{
          width: "100%", padding: "16px 14px", borderRadius: 16, cursor: "pointer", textAlign: "left",
          border: `2px solid ${isBiennial ? G.blue : G.greyLight}`,
          background: isBiennial ? G.ink : G.surface,
          marginBottom: 10, position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: 10, right: 10,
            background: "#22C55E", color: G.white,
            fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 6,
          }}>{weeksBlocked ? "OFFRE FIN D’ESSAI" : "−50% · 2 ANS"}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: isBiennial ? "rgba(255,255,255,0.55)" : G.grey, marginBottom: 4, letterSpacing: "0.04em" }}>ENGAGEMENT 24 MOIS</div>
          <div style={{ fontSize: 12, color: isBiennial ? "rgba(255,255,255,0.3)" : G.greyMid, textDecoration: "line-through", marginBottom: 2 }}>59,98€</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 800, color: isBiennial ? G.inverse : G.ink }}>29,99€</div>
            <div style={{ fontSize: 12, color: isBiennial ? "rgba(255,255,255,0.5)" : G.greyMid }}>/ 2 ans</div>
          </div>
          <div style={{ fontSize: 11, color: isBiennial ? "rgba(255,255,255,0.45)" : G.greyMid, marginTop: 6 }}>
            Soit ~1,25€/mois · non résiliable avant la fin de période
          </div>
        </button>

        {/* Cards mensuel / annuel */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {/* Mensuel */}
          <button onClick={() => setPeriod("monthly")} style={{
            flex: 1, padding: "14px 12px", borderRadius: 16, cursor: "pointer", textAlign: "left",
            border: `2px solid ${period === "monthly" ? G.blue : G.greyLight}`,
            background: period === "monthly" ? G.blueLight : G.surface,
            transition: "all 0.18s", position: "relative", overflow: "hidden",
          }}>
            {hasReferral && (
              <div style={{
                position: "absolute", top: 8, right: 8,
                background: "#22C55E", color: G.white,
                fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 6,
              }}>−20%</div>
            )}
            <div style={{ fontSize: 11, fontWeight: 700, color: period === "monthly" ? G.blue : G.grey, marginBottom: 6, letterSpacing: "0.04em" }}>MENSUEL</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 800, color: period === "monthly" ? G.ink : G.grey }}>4,99€</div>
            <div style={{ fontSize: 11, color: G.greyMid, marginTop: 2 }}>/ mois</div>
          </button>

          {/* Annuel */}
          <button onClick={() => setPeriod("annual")} style={{
            flex: 1, padding: "14px 12px", borderRadius: 16, cursor: "pointer", textAlign: "left",
            border: `2px solid ${period === "annual" ? G.blue : G.greyLight}`,
            background: period === "annual" ? G.blueLight : G.surface,
            transition: "all 0.18s", position: "relative", overflow: "hidden",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: period === "annual" ? G.blue : G.grey, marginBottom: 4, letterSpacing: "0.04em" }}>ANNUEL</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 800, color: period === "annual" ? G.ink : G.grey }}>29,99€</div>
            <div style={{ fontSize: 11, color: G.greyMid, marginTop: 2 }}>/ an · ~2,50€/mois</div>
          </button>
        </div>

        {isBiennial && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#92400E", lineHeight: 1.4, textAlign: "center" }}>
              Engagement 24 mois · 29,99€ facturés une fois · accès jusqu’à la fin de période
            </span>
          </div>
        )}

        {isAnnual && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#15803D" }}>6 mois offerts vs mensuel plein tarif</span>
          </div>
        )}

        {hasReferral && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#15803D" }}>Parrainage actif — −20% auto au paiement</span>
          </div>
        )}

        {!hasReferral && (
          <p style={{ fontSize: 12, color: G.greyMid, textAlign: "center", marginBottom: 16, lineHeight: 1.4 }}>
            Un ami t’a parrainé ? −20% auto au paiement.
          </p>
        )}

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>
            Débloqué avec Premium
          </div>
          {PREMIUM_TIER_LINES.map((line, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: i < PREMIUM_TIER_LINES.length - 1 ? 8 : 0 }}>
              <Check size={14} color={G.blue} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 13, color: G.ink, lineHeight: 1.4 }}>{line}</span>
            </div>
          ))}
        </div>

        {err && <div style={{ background: "#FFE8E8", borderRadius: 10, padding: "10px 14px", marginBottom: 12, color: "#CC0000", fontSize: 13 }}>{err}</div>}
        <Btn variant="blue" onClick={handleCheckout} disabled={loading}>
          {loading ? "Redirection…" : ctaLabel}
        </Btn>
        <button onClick={onClose} style={{ width: "100%", marginTop: 10, padding: "12px", background: "none", border: "none", color: G.grey, cursor: "pointer", fontSize: 13 }}>
          {softContext === "after_first_session" ? "Continuer en gratuit — 4 semaines" : "Continuer en gratuit"}
        </button>
      </div>
    </div>
  );
};

const PremiumTeaser = ({ onUpgrade }) => (
  <div style={{ margin: "8px 0 12px", borderRadius: 20, overflow: "hidden", border: `1px solid ${G.greyLight}` }}>
    <div style={{ background: G.ink, padding: "24px 22px", display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Lock size={20} color="rgba(255,255,255,0.6)" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: G.white, marginBottom: 2 }}>La suite t'attend</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>Débloque ton programme complet</div>
      </div>
      <button onClick={onUpgrade} style={{ background: G.surface, border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 700, color: G.ink, cursor: "pointer", flexShrink: 0 }}>
        Voir
      </button>
    </div>
  </div>
);

const PremiumBanner = ({ weeksTotal, weeksShown, onUpgrade }) => (
  <div style={{ margin: "0 0 16px", background: "linear-gradient(135deg, #355da3 0%, #8eb3ff 100%)", borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
    <Lock size={24} color={G.white} />
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: G.white }}>+{weeksTotal - weeksShown} semaines bloquées</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Plan complet · départs D… · ajustement auto</div>
    </div>
    <button onClick={onUpgrade} style={{ background: G.surface, border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, color: G.blue, cursor: "pointer", flexShrink: 0 }}>Voir</button>
  </div>
);

const LockedWeeksPreview = ({ weeks, totalBlocked, daysToEvent, onUpgrade }) => {
  if (!weeks?.length) return null;
  const extra = Math.max(0, totalBlocked - weeks.length);
  return (
    <div style={{ position: "relative", marginBottom: 16, borderRadius: 20, overflow: "hidden" }}>
      <div style={{ filter: "blur(5px)", pointerEvents: "none", userSelect: "none", opacity: 0.5 }}>
        {weeks.map((week, j) => (
          <WeekCard key={j} week={week} weekIndex={FREE_WEEKS_LIMIT + j} onComplete={() => {}} onShare={() => {}} isCurrentWeek={false} />
        ))}
      </div>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        background: "rgba(248,249,252,0.72)", padding: "24px 20px", textAlign: "center",
      }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: G.surface, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, boxShadow: "0 4px 16px rgba(53,93,163,0.12)" }}>
          <Lock size={22} color={G.blue} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: G.ink, marginBottom: 6 }}>
          {totalBlocked} semaine{totalBlocked > 1 ? "s" : ""} pour arriver prêt
        </div>
        <p style={{ fontSize: 13, color: G.grey, lineHeight: 1.5, marginBottom: 4, maxWidth: 280 }}>
          {weeks[0]?.focus ? `Sem. ${weeks[0].number} : ${weeks[0].focus}` : "La suite de ton programme t'attend"}
          {weeks[1]?.focus ? ` · Sem. ${weeks[1].number} : ${weeks[1].focus}` : ""}
        </p>
        {daysToEvent !== null && (
          <p style={{ fontSize: 12, color: G.blue, fontWeight: 600, marginBottom: 14 }}>J−{daysToEvent} avant ton objectif</p>
        )}
        {extra > 0 && (
          <p style={{ fontSize: 11, color: G.greyMid, marginBottom: 14 }}>+ {extra} autre{extra > 1 ? "s" : ""} semaine{extra > 1 ? "s" : ""} ensuite</p>
        )}
        <button onClick={onUpgrade} style={{ padding: "11px 22px", borderRadius: 12, border: "none", background: G.blue, color: G.white, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 20px rgba(53,93,163,0.28)" }}>
          Débloquer avec Premium
        </button>
      </div>
    </div>
  );
};

// ── SESSION DETAIL PARSER ──────────────────────────────────────────────────
// Transforme "4×50m crawl — R20" — respiration 3 temps" en blocs propres
// (plus de · / — en chaîne dans l'UI).
const REST_CHUNK_RE = /^(R\d+["']?|repos\s+\d+\s*(?:s|sec|min)?|D(?:toutes les )?\d+['′]\d+"|D\d+")$/i;
const DEPART_INLINE_RE = /D(?:toutes les )?(\d+['′]\d+"|\d+")/g;

const parseIntensity = (raw) => {
  if (!raw) return { zone: null, cue: null };
  const parts = String(raw).split(/\s*[—–]\s*/).map(s => s.trim()).filter(Boolean);
  if (parts.length === 0) return { zone: null, cue: null };
  const zone = parts[0];
  const cue = parts.slice(1).join(". ") || null;
  return { zone, cue };
};

const parseSessionDetail = (raw) => {
  const text = stripDetailPrefix(raw);
  if (!text) return null;

  let kind = "work";
  let label = null;
  let body = text;

  if (/^échauffement\s*:/i.test(text)) {
    kind = "warm";
    label = "Échauffement";
    body = text.replace(/^échauffement\s*:\s*/i, "");
  } else if (/^retour(\s+au\s+calme)?\s*:/i.test(text)) {
    kind = "cool";
    label = "Retour au calme";
    body = text.replace(/^retour(\s+au\s+calme)?\s*:\s*/i, "");
  }

  // Enlève le « : » final d'un titre de bloc (« 400m éducatif + jambes : »)
  body = body.replace(/\s*:\s*$/, "");

  const chunks = body.split(/\s*[—–]\s*/).map(s => s.trim()).filter(Boolean);
  let main = chunks[0] || body;
  const restParts = [];
  const cues = [];

  for (let i = 1; i < chunks.length; i++) {
    const c = chunks[i];
    if (REST_CHUNK_RE.test(c)) restParts.push(c.replace(/^Dtoutes les /i, "D"));
    else cues.push(c.replace(/\s*·\s*/g, " · ").replace(/\s+/g, " ").trim());
  }

  // Rest parfois collé dans le main ("… crawl R20"" ou "… — repos 15s")
  if (!restParts.length) {
    const embedded = main.match(/\s+(R\d+["']?|repos\s+\d+\s*(?:s|sec|min)?|D(?:toutes les )?\d+['′]\d+"|D\d+")\s*$/i);
    if (embedded) {
      restParts.push(embedded[1].replace(/^Dtoutes les /i, "D"));
      main = main.slice(0, embedded.index).trim();
    }
  }

  // Séries progressives "1 lent · 2 ↗ · 3 ↗ · 4 rapide" → chips
  let steps = null;
  const stepSource = main.includes(":") ? main.slice(main.indexOf(":") + 1).trim() : main;
  const stepSplit = stepSource.split(/\s*·\s*/).map(s => s.trim()).filter(Boolean);
  if (stepSplit.length >= 3 && stepSplit.every(s => /^\d/.test(s) && s.length <= 22)) {
    steps = stepSplit;
    main = main.includes(":") ? main.slice(0, main.indexOf(":")).trim() : null;
  }

  return {
    kind,
    label,
    main,
    steps,
    rest: restParts[0] || null,
    cues,
  };
};

const RestPill = ({ value }) => {
  if (!value) return null;
  const isDepart = /^D/i.test(value);
  const pill = (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      background: isDepart ? G.blueLight : G.greyXLight,
      color: isDepart ? G.blue : G.inkLight,
      fontSize: 11, fontWeight: 700, padding: "3px 8px",
      borderRadius: 8, whiteSpace: "nowrap", flexShrink: 0,
      letterSpacing: "0.01em",
    }}>
      {isDepart && <Clock size={10} color={G.blue} />}
      {value}
    </span>
  );
  if (!isDepart) return pill;
  return (
    <a href="/blog/depart-interval-natation" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
      {pill}
    </a>
  );
};

const RichText = ({ text }) => {
  if (!text) return null;
  const parts = [];
  let last = 0;
  let match;
  DEPART_INLINE_RE.lastIndex = 0;
  while ((match = DEPART_INLINE_RE.exec(text)) !== null) {
    if (match.index > last) parts.push({ type: "text", val: text.slice(last, match.index) });
    parts.push({ type: "depart", val: `D${match[1]}` });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ type: "text", val: text.slice(last) });
  if (!parts.length) return <span>{text}</span>;
  return (
    <>
      {parts.map((p, i) =>
        p.type === "text" ? <span key={i}>{p.val}</span> : <RestPill key={i} value={p.val} />
      )}
    </>
  );
};

const SessionBlock = ({ detail, index, workIndex, accent, children = null }) => {
  const parsed = parseSessionDetail(detail);
  if (!parsed) return null;
  const isSection = parsed.kind === "warm" || parsed.kind === "cool";
  const childLines = Array.isArray(children) ? children : [];

  if (isSection) {
    return (
      <div style={{
        padding: "12px 14px",
        background: parsed.kind === "warm" ? "rgba(0,180,216,0.06)" : "rgba(0,196,140,0.06)",
        borderRadius: 12,
        border: `1px solid ${parsed.kind === "warm" ? "rgba(0,180,216,0.12)" : "rgba(0,196,140,0.12)"}`,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase",
          color: parsed.kind === "warm" ? "#0097A7" : "#00897B", marginBottom: 6,
        }}>
          {parsed.label}
        </div>
        {parsed.main && (
          <div style={{ fontSize: 14, fontWeight: 600, color: G.ink, lineHeight: 1.35 }}>
            <RichText text={parsed.main} />
          </div>
        )}
        {parsed.cues.map((c, i) => (
          <div key={i} style={{ fontSize: 12, color: G.grey, lineHeight: 1.45, marginTop: 4 }}>
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", gap: 12, padding: "12px 4px",
      borderTop: index > 0 ? `1px solid ${G.greyLight}` : "none",
    }}>
      <div style={{
        width: 26, height: 26, borderRadius: 8, flexShrink: 0,
        background: accent.bg, color: accent.color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 800, marginTop: 1,
      }}>
        {workIndex}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {parsed.main && (
              <div style={{ fontSize: 14, fontWeight: 700, color: G.ink, lineHeight: 1.35 }}>
                <RichText text={parsed.main} />
              </div>
            )}
            {parsed.steps && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: parsed.main ? 8 : 0 }}>
                {parsed.steps.map((s, i) => (
                  <span key={i} style={{
                    fontSize: 11, fontWeight: 600, color: G.inkLight,
                    background: G.greyXLight, padding: "4px 8px", borderRadius: 8,
                  }}>{s}</span>
                ))}
              </div>
            )}
            {/* Sous-séries du même bloc (ex. éducatif + jambes) — pas de tiret/point ni de n° */}
            {childLines.length > 0 && (
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                {childLines.map((child, ci) => {
                  const cp = parseSessionDetail(child);
                  if (!cp?.main) return null;
                  return (
                    <div key={ci} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: G.inkLight, lineHeight: 1.4, flex: 1 }}>
                        <RichText text={cp.main} />
                      </div>
                      <RestPill value={cp.rest} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {childLines.length === 0 && <RestPill value={parsed.rest} />}
        </div>
        {parsed.cues.map((c, i) => (
          <div key={i} style={{ fontSize: 12, color: G.grey, lineHeight: 1.45, marginTop: 5 }}>
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── SESSION CARD ──────────────────────────────────────────────────────────
const SessionCard = ({ session, weekIndex, sessionIndex, onComplete, onShare, onEditFeedback, defaultExpanded = false, isPremium = false, onUpgrade }) => {
  const done = session.completed;
  const skipped = session.skipped;
  const resolved = isSessionResolved(session);
  const tm = TYPE_META[session.type] || TYPE_META.ENDURANCE;
  const [showTooltip, setShowTooltip] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);
  const intensity = parseIntensity(session.intensity);
  const details = session.details || [];
  const detailGroups = groupSessionDetails(details);
  const blockCount = detailGroups.reduce((n, g) => {
    if (g.type === "block") return n + 1;
    if (g.type === "work") return n + g.lines.length;
    return n;
  }, 0);

  useEffect(() => {
    if (!showMenu) return;
    const close = () => setShowMenu(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [showMenu]);

  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    if (resolved) {
      onComplete(weekIndex, sessionIndex, "reset");
      setShowMenu(false);
    } else {
      setShowMenu(v => !v);
    }
  };

  const handleCopy = async (e) => {
    e.stopPropagation();
    if (!isPremium) {
      onUpgrade?.();
      return;
    }
    const text = formatSessionPlainText(session);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const checkboxColor = done ? G.mint : skipped === "missed" ? G.gold : skipped === "not_done" ? G.greyMid : G.greyLight;

  return (
    <div style={{
      background: resolved ? G.greyXLight : G.surface,
      borderRadius: 24,
      border: `1px solid ${resolved ? G.greyLight : "rgba(53,93,163,0.10)"}`,
      opacity: resolved ? 0.78 : 1,
      transition: "opacity 0.25s, box-shadow 0.25s",
      boxShadow: resolved ? "none" : "0 2px 12px rgba(142,179,255,0.10), 0 8px 32px rgba(53,93,163,0.06)",
      overflow: "hidden",
      position: "relative",
    }}>
      {!resolved && (
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
          background: tm.color, borderRadius: "3px 0 0 3px",
        }} />
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "16px 16px 14px 18px" }}>
        <button
          onClick={() => setShowTooltip(v => !v)}
          aria-label={`Type ${session.type}`}
          style={{
            width: 44, height: 44, borderRadius: 14, flexShrink: 0,
            background: resolved ? G.greyLight : tm.bg,
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
          }}
        >
          <tm.Icon size={18} color={resolved ? G.greyMid : tm.color} />
          {showTooltip && tm.tooltip && (
            <div
              onClick={e => { e.stopPropagation(); setShowTooltip(false); }}
              style={{
                position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 50,
                background: G.ink, color: G.inverse, fontSize: 12, lineHeight: 1.5,
                padding: "10px 14px", borderRadius: 12, width: 230,
                boxShadow: "0 8px 28px rgba(0,0,0,0.22)", cursor: "pointer",
                textAlign: "left", fontWeight: 400,
              }}
            >
              {tm.tooltip}
            </div>
          )}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: resolved ? G.greyMid : tm.color, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 3 }}>{session.type}</div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: resolved ? G.grey : G.ink, lineHeight: 1.2, letterSpacing: "-0.01em" }}>{session.title}</div>
              {skipped && (
                <span style={{ display: "inline-block", marginTop: 5, fontSize: 10, fontWeight: 700, color: skipped === "missed" ? G.gold : G.grey, background: skipped === "missed" ? G.goldLight : G.greyXLight, padding: "2px 8px", borderRadius: 100 }}>
                  {SKIP_LABELS[skipped]}
                </span>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0, position: "relative" }}>
              <button
                type="button"
                onClick={handleCheckboxClick}
                aria-label={resolved ? "Réinitialiser la séance" : "Marquer la séance"}
                style={{
                  width: 44, height: 44, borderRadius: "50%",
                  border: `2px solid ${checkboxColor}`,
                  background: resolved ? checkboxColor : "transparent",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s",
                  flexShrink: 0,
                }}
              >
                {done && <Check size={16} color={G.white} />}
                {skipped === "missed" && <RotateCcw size={15} color={G.white} />}
                {skipped === "not_done" && <X size={15} color={G.white} />}
              </button>
              {showMenu && (
                <div
                  onClick={e => e.stopPropagation()}
                  style={{
                    position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 60,
                    background: G.surface, borderRadius: 14, padding: 6,
                    boxShadow: "0 12px 40px rgba(0,0,0,0.14)", border: `1px solid ${G.greyLight}`,
                    minWidth: 172,
                  }}
                >
                  {[
                    { id: "done", label: "Séance faite", icon: Check, color: G.mint },
                    { id: "missed", label: "Oubliée", icon: RotateCcw, color: G.gold },
                    { id: "not_done", label: "Pas faite", icon: X, color: G.grey },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => { onComplete(weekIndex, sessionIndex, opt.id); setShowMenu(false); }}
                      style={{
                        width: "100%", padding: "10px 10px", borderRadius: 10, border: "none",
                        background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                        fontSize: 13, fontWeight: 600, color: G.ink, textAlign: "left",
                      }}
                    >
                      <span style={{ width: 24, height: 24, borderRadius: 8, background: `${opt.color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <opt.icon size={12} color={opt.color} />
                      </span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Meta chips — clean, no middle dots */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: resolved ? G.greyMid : tm.color,
              background: resolved ? G.greyLight : tm.bg, padding: "4px 9px", borderRadius: 8,
            }}>{session.distance}</span>
            <span style={{
              fontSize: 11, fontWeight: 600, color: G.grey, background: G.greyXLight,
              padding: "4px 9px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 4,
            }}>
              <Timer size={11} color={G.greyMid} />
              {formatDuration(session.duration)}
            </span>
            {intensity.zone && (
              <span style={{
                fontSize: 11, fontWeight: 700, color: G.inkLight, background: G.surface,
                border: `1px solid ${G.greyLight}`, padding: "4px 9px", borderRadius: 8,
              }}>{intensity.zone}</span>
            )}
          </div>
          {intensity.cue && !expanded && (
            <p style={{ fontSize: 12, color: G.grey, marginTop: 8, lineHeight: 1.4, marginBottom: 0 }}>
              {intensity.cue.charAt(0).toUpperCase() + intensity.cue.slice(1)}
            </p>
          )}
          {done && onEditFeedback && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEditFeedback(weekIndex, sessionIndex); }}
              style={{
                marginTop: 10, padding: 0, border: "none", background: "none",
                color: G.blue, fontSize: 12, fontWeight: 600, cursor: "pointer",
                textAlign: "left",
              }}
            >
              {session.feedback ? "Modifier mon retour" : "Donner mon avis"}
            </button>
          )}
        </div>
      </div>

      {/* Workout blocks */}
      {blockCount > 0 && (
        <>
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            style={{
              width: "100%", padding: "14px 16px", minHeight: 48,
              background: expanded ? "#fafbfc" : "transparent",
              border: "none", borderTop: `1px solid ${G.greyLight}`,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
              color: G.inkLight, fontSize: 13, fontWeight: 600,
            }}
          >
            <span>{expanded ? "Masquer le détail" : `${blockCount} bloc${blockCount > 1 ? "s" : ""}`}</span>
            {expanded ? <ChevronUp size={14} color={G.greyMid} /> : <ChevronDown size={14} color={G.greyMid} />}
          </button>
          {expanded && (
            <div style={{ background: "#fafbfc", padding: "8px 12px 14px" }}>
              {intensity.cue && (
                <p style={{ fontSize: 12, color: G.grey, lineHeight: 1.45, margin: "0 4px 12px" }}>
                  {intensity.cue.charAt(0).toUpperCase() + intensity.cue.slice(1)}
                </p>
              )}
              {(() => {
                const nodes = [];
                let workCounterLocal = 0;
                detailGroups.forEach((g, gi) => {
                  if (g.type === "block") {
                    workCounterLocal += 1;
                    nodes.push(
                      <div key={`b-${gi}`} style={{
                        background: G.surface, borderRadius: 14, padding: "4px 12px",
                        border: `1px solid ${G.greyLight}`,
                      }}>
                        <SessionBlock
                          detail={g.header}
                          index={0}
                          workIndex={workCounterLocal}
                          accent={{ bg: tm.bg, color: tm.color }}
                          children={g.children}
                        />
                      </div>
                    );
                    return;
                  }
                  // works : une carte par série (ou regroupées déjà)
                  const group = [];
                  g.lines.forEach((raw, li) => {
                    const parsed = parseSessionDetail(raw);
                    if (!parsed) return;
                    if (parsed.kind !== "work") {
                      nodes.push(
                        <SessionBlock key={`s-${gi}-${li}`} detail={raw} index={0} workIndex={0} accent={{ bg: tm.bg, color: tm.color }} />
                      );
                      return;
                    }
                    workCounterLocal += 1;
                    group.push({ raw, workIndex: workCounterLocal, key: `${gi}-${li}` });
                  });
                  if (group.length) {
                    nodes.push(
                      <div key={`g-${gi}`} style={{
                        background: G.surface, borderRadius: 14, padding: "4px 12px",
                        border: `1px solid ${G.greyLight}`,
                      }}>
                        {group.map((item, ii) => (
                          <SessionBlock
                            key={item.key}
                            detail={item.raw}
                            index={ii}
                            workIndex={item.workIndex}
                            accent={{ bg: tm.bg, color: tm.color }}
                          />
                        ))}
                      </div>
                    );
                  }
                });
                return <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{nodes}</div>;
              })()}
              <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={handleCopy}
                  title={isPremium ? "Copier la séance" : "Passe Premium pour copier la séance"}
                  aria-label={isPremium ? "Copier la séance" : "Passe Premium pour copier la séance"}
                  style={{
                    flex: 1, minWidth: 140, padding: "10px 12px", borderRadius: 12,
                    background: copied ? G.mint : isPremium ? G.surface : G.greyXLight,
                    border: `1px solid ${copied ? G.mint : G.greyLight}`,
                    fontSize: 12, fontWeight: 600,
                    color: copied ? G.white : isPremium ? G.inkLight : G.grey,
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  {copied
                    ? <><CheckCheck size={13} color="#fff" /> Copié</>
                    : isPremium
                      ? <><Copy size={13} color={G.grey} /> Copier la séance</>
                      : <><Lock size={13} color={G.grey} /> Copier la séance</>}
                </button>
                {done && onShare && (
                  <button onClick={() => onShare(session)} style={{
                    flex: 1, minWidth: 140, padding: "10px 12px", borderRadius: 12,
                    background: G.surface, border: `1px solid ${G.greyLight}`,
                    fontSize: 12, fontWeight: 600, color: G.grey, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}>
                    <Activity size={12} color={G.grey} /> Partager
                  </button>
                )}
              </div>
              {isPremium && (
                <p style={{ fontSize: 11, color: G.greyMid, margin: "8px 4px 0", lineHeight: 1.4 }}>
                  Colle le texte dans WhatsApp ou la description Strava.
                </p>
              )}
              {isPremium ? (
                <p style={{ fontSize: 12, color: G.grey, lineHeight: 1.5, margin: "12px 4px 0" }}>
                  Un terme ou un éducatif pas clair ?{" "}
                  <a
                    href={INSTAGRAM_MYSWYM}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: G.blue, fontWeight: 600, textDecoration: "none" }}
                  >
                    Vidéos sur Instagram
                  </a>
                  {" "}— Premium.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => onUpgrade?.()}
                  title="Passe Premium pour accéder aux vidéos techniques"
                  aria-label="Passe Premium pour accéder aux vidéos techniques"
                  style={{
                    display: "flex", width: "100%", marginTop: 12, padding: "10px 12px",
                    borderRadius: 12, border: `1px solid ${G.greyLight}`, background: G.greyXLight,
                    fontSize: 12, fontWeight: 600, color: G.grey, cursor: "pointer",
                    alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  <Lock size={13} color={G.grey} />
                  Vidéo technique
                </button>
              )}
              <p style={{ fontSize: 12, color: G.grey, lineHeight: 1.5, margin: "8px 4px 0" }}>
                Vocabulaire ?{" "}
                <a
                  href="/blog/glossaire-natation"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: G.blue, fontWeight: 600, textDecoration: "none" }}
                >
                  Glossaire natation
                </a>
                .
              </p>
            </div>
          )}
        </>
      )}
      {blockCount === 0 && (
        <div style={{ padding: "0 14px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            type="button"
            onClick={handleCopy}
            title={isPremium ? "Copier la séance" : "Passe Premium pour copier la séance"}
            aria-label={isPremium ? "Copier la séance" : "Passe Premium pour copier la séance"}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 12, background: G.greyXLight, border: `1px solid ${G.greyLight}`, fontSize: 12, fontWeight: 600, color: G.grey, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            {copied
              ? <><CheckCheck size={12} /> Copié</>
              : isPremium
                ? <><Copy size={12} /> Copier la séance</>
                : <><Lock size={12} /> Copier la séance</>}
          </button>
          {done && onShare && (
            <button onClick={() => onShare(session)} style={{ width: "100%", padding: "10px 12px", borderRadius: 12, background: G.greyXLight, border: `1px solid ${G.greyLight}`, fontSize: 12, fontWeight: 600, color: G.grey, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Activity size={12} color={G.grey} /> Partager cette séance
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ── WEEK CARD ──────────────────────────────────────────────────────────────
const WeekCard = ({ week, weekIndex, onComplete, onShare, onEditFeedback, isCurrentWeek, isPremium = false, onUpgrade }) => {
  const [open, setOpen] = useState(isCurrentWeek);
  const done = week.sessions.filter(isSessionResolved).length;
  const total = week.sessions.length;
  const allDone = done === total && total > 0;
  const allActuallyDone = total > 0 && week.sessions.every(s => s.completed && !s.skipped);
  const totalDist = week.sessions.reduce((acc, s) => acc + (parseInt(s.distance) || 0), 0);
  const distLabel = totalDist >= 1000 ? `${(totalDist / 1000).toFixed(1)} km` : `${totalDist} m`;
  const progress = total > 0 ? done / total : 0;

  return (
    <div style={{
      background: G.surface,
      borderRadius: 20,
      overflow: "hidden",
      border: isCurrentWeek
        ? `1.5px solid ${G.blue}`
        : allDone ? `1px solid ${allActuallyDone ? G.mint : G.gold}35` : `1px solid ${G.greyLight}`,
      marginBottom: 12,
      boxShadow: isCurrentWeek
        ? "0 8px 28px rgba(53,93,163,0.12)"
        : "0 1px 3px rgba(25,28,30,0.03), 0 6px 16px rgba(53,93,163,0.04)",
    }}>
      {isCurrentWeek && (
        <div style={{ height: 3, background: `linear-gradient(90deg, ${G.blue}, ${G.blueMid})` }} />
      )}
      {allDone && !isCurrentWeek && (
        <div style={{ height: 3, background: allActuallyDone ? G.mint : G.gold }} />
      )}

      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", padding: "16px", background: "none", border: "none", cursor: "pointer" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ textAlign: "left", flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 17, fontWeight: 800, color: G.ink, letterSpacing: "-0.02em" }}>Semaine {week.number}</span>
              {isCurrentWeek && (
                <span style={{ fontSize: 10, fontWeight: 800, color: G.white, background: G.blue, padding: "3px 8px", borderRadius: 6, letterSpacing: "0.04em" }}>EN COURS</span>
              )}
              {allDone && !isCurrentWeek && (
                <span style={{
                  fontSize: 10, fontWeight: 800,
                  color: allActuallyDone ? G.mint : G.gold,
                  background: allActuallyDone ? G.mintLight : G.goldLight,
                  padding: "3px 8px", borderRadius: 6, letterSpacing: "0.04em",
                }}>
                  {allActuallyDone ? "TERMINÉE" : "PASSÉE"}
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: G.grey, lineHeight: 1.4, margin: "0 0 10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {week.focus}
            </p>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              {totalDist > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: isCurrentWeek ? G.blue : G.inkLight,
                  background: isCurrentWeek ? G.blueLight : G.greyXLight,
                  padding: "3px 9px", borderRadius: 8,
                }}>
                  {distLabel}
                </span>
              )}
              <span style={{
                fontSize: 11, fontWeight: 600, color: G.grey,
                background: G.greyXLight, padding: "3px 9px", borderRadius: 8,
              }}>
                {total} séance{total > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                fontSize: 15, fontWeight: 800,
                color: allDone ? (allActuallyDone ? G.mint : G.gold) : G.blue,
                fontVariantNumeric: "tabular-nums",
              }}>{done}/{total}</span>
              <div style={{ color: G.greyMid }}>
                {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>
            {/* Mini progress bar */}
            <div style={{ width: 48, height: 4, borderRadius: 4, background: G.greyLight, overflow: "hidden" }}>
              <div style={{
                width: `${Math.round(progress * 100)}%`, height: "100%", borderRadius: 4,
                background: allDone ? (allActuallyDone ? G.mint : G.gold) : G.blue,
                transition: "width 0.35s ease",
              }} />
            </div>
          </div>
        </div>
      </button>

      {open && (
        <div style={{ padding: "0 12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
          {week.sessions.map((s, i) => (
            <SessionCard
              key={i}
              session={s}
              weekIndex={weekIndex}
              sessionIndex={i}
              onComplete={onComplete}
              onShare={onShare}
              onEditFeedback={onEditFeedback}
              isPremium={isPremium}
              onUpgrade={onUpgrade}
              defaultExpanded={isCurrentWeek && i === week.sessions.findIndex(x => !isSessionResolved(x))}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ── RESET / CHANGER D'OBJECTIF ────────────────────────────────────────────
/** Free : carte douce au-dessus du plan. Premium : lien discret en bas. */
const ResetConfirmButton = ({ onReset, variant = "subtle" }) => {
  const [confirm, setConfirm] = useState(false);
  const isCard = variant === "card";

  if (confirm) {
    return (
      <div style={{
        marginBottom: isCard ? 16 : 0,
        marginTop: isCard ? 0 : 8,
        background: isCard ? G.surface : G.coralLight,
        border: `1px solid ${isCard ? G.greyLight : G.coral}`,
        borderRadius: isCard ? 18 : 12,
        padding: isCard ? "16px 16px 14px" : "16px 18px",
        boxShadow: isCard ? "0 2px 8px rgba(0,0,0,0.04)" : "none",
      }}>
        <p style={{
          fontSize: 14, fontWeight: 700, marginBottom: 4,
          color: isCard ? G.ink : G.coral,
        }}>
          Remplacer ton plan actuel ?
        </p>
        <p style={{ fontSize: 13, color: G.inkLight, lineHeight: 1.5, marginBottom: 14 }}>
          Tu repartiras du questionnaire pour créer un nouveau plan. La progression de celui-ci ne sera pas conservée.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => setConfirm(false)}
            style={{
              flex: 1, padding: "11px", background: G.surface,
              border: `1.5px solid ${G.greyLight}`, borderRadius: 10,
              fontSize: 13, color: G.grey, cursor: "pointer", fontWeight: 600, minHeight: 44,
            }}
          >
            Garder mon plan
          </button>
          <button
            type="button"
            onClick={onReset}
            style={{
              flex: 1, padding: "11px", background: G.blue, border: "none", borderRadius: 10,
              fontSize: 13, color: G.white, cursor: "pointer", fontWeight: 700, minHeight: 44,
            }}
          >
            Nouveau plan
          </button>
        </div>
      </div>
    );
  }

  if (isCard) {
    return (
      <div style={{
        marginBottom: 16,
        background: G.surface,
        border: `1px solid ${G.greyLight}`,
        borderRadius: 18,
        padding: "16px 16px 14px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: G.blueLight, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <RotateCcw size={16} color={G.blue} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: G.ink, margin: "0 0 4px" }}>
              Pas le bon objectif ?
            </p>
            <p style={{ fontSize: 13, color: G.grey, lineHeight: 1.45, margin: "0 0 12px" }}>
              Tu peux refaire le questionnaire en 2 minutes et générer un plan plus adapté.
            </p>
            <button
              type="button"
              onClick={() => setConfirm(true)}
              style={{
                width: "100%", padding: "11px 14px", borderRadius: 10, cursor: "pointer",
                background: G.blueLight, border: `1.5px solid ${G.blue}33`,
                color: G.blue, fontSize: 13, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 44,
              }}
            >
              Changer d&apos;objectif
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirm(true)}
      style={{
        width: "100%", marginTop: 8, padding: "14px", background: "none",
        border: `1px solid ${G.greyLight}`, borderRadius: 12, color: G.grey, cursor: "pointer",
        fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 44,
      }}
    >
      <RotateCcw size={14} color={G.greyMid} /> Changer d&apos;objectif
    </button>
  );
};

// ── COACH CARD ────────────────────────────────────────────────────────────
const COACH = {
  name: "Arthur N.",
  photo: "/coach.JPG",
  initials: "AN",
};

const COACH_MESSAGES = {
  // ── Découverte — messages simples, encourageants, zéro jargon ──
  découverte_base: [
    "L'important c'est d'y aller. Pas besoin de nager vite — nage régulièrement. Ton corps s'adapte plus vite que tu ne le crois.",
    "Chaque longueur compte. Si tu as nagé aujourd'hui, tu as déjà réussi ta séance. Le reste viendra tout seul.",
    "Commencer c'est la partie la plus difficile — tu l'as déjà faite. Continue à ton rythme, sans te comparer à personne.",
  ],
  découverte_development: [
    "Tu progresses ! Tu tiens plus longtemps dans l'eau qu'au début — même si tu ne t'en rends pas compte. C'est ça, la progression.",
    "Tes séances sont un peu plus longues maintenant. Pas de panique si tu dois t'arrêter : reprends, souffle, et continue.",
  ],
  découverte_peak: [
    "Tu nages bien. Cette semaine on ajoute un peu d'intensité — juste pour voir jusqu'où tu peux aller. Pas d'obligation.",
    "Tu es plus à l'aise dans l'eau qu'il y a quelques semaines. Profite de chaque séance, c'est là que tout se passe.",
  ],
  // ── Niveaux confirmés ──
  base: [
    "Ce mois est fondamental : on construit ta base aérobie. Travaille à basse intensité, respire, prends tes marques. La vitesse viendra plus tard.",
    "La base, c'est le moteur. Chaque séance d'endurance que tu fais aujourd'hui, tu l'encaisseras comme un avantage dans 2 mois. Sois patient.",
  ],
  development: [
    "On monte en charge. Les séances au seuil vont piquer — c'est normal. Reste dans les zones, ne cherche pas à tout donner d'un coup.",
    "Ce mois développe ton endurance spécifique. Les efforts sont plus longs, l'intensité monte. Tu dois sortir fatigué mais pas détruit.",
  ],
  peak: [
    "On est en phase de pointe. Les séances de vitesse sont courtes mais intenses. Récupère bien entre les efforts — c'est là que la progression s'installe.",
    "Ce mois tu touches à ta meilleure forme. Chaque séance compte. Dors bien, mange bien, et fais confiance au travail déjà accompli.",
  ],
  taper: [
    "On allège. C'est le moment où beaucoup veulent en faire plus — fais l'inverse. La fraîcheur au départ vaut plus que 3 séances de plus.",
  ],
  competition: [
    "Semaine de compétition — reste frais, séances courtes. Ne t'inquiète pas : si tu as suivi le plan, le travail est fait.",
  ],
  test: [
    "Semaine chrono : note ton T100 (100 m, départ dans l'eau). Pas de forçage — un chrono propre pour mesurer si tu progresses vraiment.",
    "Compare avec le test précédent. Même 2–3 secondes de mieux, c'est une vraie évolution. Note-les quelque part.",
  ],
  wellness: [
    "On reprend doucement. L'objectif ce mois : créer l'habitude. Deux séances régulières valent mieux qu'une séance intense suivie d'une semaine sans.",
    "Le corps s'adapte progressivement. Tu vas peut-être te sentir limité — c'est une bonne chose. On construit sur du solide.",
  ],
  default: [
    "Entraîne-toi intelligemment. La régularité bat toujours l'intensité ponctuelle. Une séance de plus par semaine sur 3 mois, ça change tout.",
  ],
};

const CoachCard = ({ plan, profile, currentWeekIndex }) => {
  const week = plan.weeks[Math.max(0, currentWeekIndex)];
  const isDecouverte = profile?.level === "découverte";

  const resolveCoachPhase = () => {
    if (!week) return "default";
    const f = (week.focus || "").toLowerCase();
    if (week.isTest || f.includes("test") || f.includes("contrôle")) return "test";
    if (week.isBilan || f.includes("bilan")) return "taper";
    if (f.includes("compét")) return "competition";
    if (f.includes("affût")) return "taper";
    if (f.includes("vitesse") || f.includes("intensité") || f.includes("volume maximum")) return "peak";
    if (f.includes("seuil") || f.includes("développement")) return "development";
    if (f.includes("mise en") || f.includes("construction") || f.includes("jambes") || f.includes("aérobie")) return "base";
    if (plan.isProgression) {
      if (currentWeekIndex < 3) return "base";
      if (currentWeekIndex === 3) return "test";
      if (currentWeekIndex < 7) return "development";
      if (currentWeekIndex === 7) return "test";
      if (currentWeekIndex < 11) return "peak";
      return "taper";
    }
    return "base";
  };
  const phase = resolveCoachPhase();

  // Découverte level gets its own set of simple, jargon-free messages
  const phaseKey = isDecouverte
    ? (`découverte_${phase}` in COACH_MESSAGES ? `découverte_${phase}` : "découverte_base")
    : phase;
  const msgs = COACH_MESSAGES[phaseKey] || COACH_MESSAGES.default;
  // Change de message chaque mois civil pour que ça évolue même sans progresser
  const msgIndex = new Date().getMonth() % msgs.length;
  const message = msgs[msgIndex];

  return (
    <div style={{
      background: `linear-gradient(135deg, ${G.blue} 0%, ${G.blueDeep} 100%)`,
      borderRadius: 22,
      padding: "20px",
      marginBottom: 20,
      boxShadow: "0 8px 28px rgba(53,93,163,0.28)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Decorative circle */}
      <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -30, right: 30, width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 16 }}>
        {COACH.photo ? (
          <img src={COACH.photo} alt={COACH.name} style={{ width: 50, height: 50, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `2.5px solid rgba(255,255,255,0.4)` }} />
        ) : (
          <div style={{ width: 50, height: 50, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: G.white, fontSize: 16, fontWeight: 800 }}>{COACH.initials}</span>
          </div>
        )}
        <div>
          <div style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Message de ton coach</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: G.white, letterSpacing: "-0.01em", lineHeight: 1.1 }}>{COACH.name}</div>
        </div>
      </div>

      {/* Message bubble */}
      <div style={{ background: "rgba(255,255,255,0.13)", borderRadius: 14, padding: "14px 16px", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
        <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.92)", lineHeight: 1.65, margin: 0 }}>{message}</p>
      </div>
    </div>
  );
};

// ── PLAN TAB ──────────────────────────────────────────────────────────────
const PlanTab = ({ plan, profile, isPremium, onComplete, onShare, onEditFeedback, onReset, onUpgrade, plans, activePlanId, onSwitchPlan, onAddPlan, onDeletePlan }) => {
  // Premium : plan complet débloqué
  // Free    : les 4 premières semaines visibles tout de suite ; le reste = Premium
  const unlocked = isPremium
    ? plan.weeks.length
    : Math.min(FREE_WEEKS_LIMIT, plan.weeks.length);

  const currentWeekIndex = plan.weeks.findIndex(w => !w.sessions.every(isSessionResolved));
  const currentWeek = currentWeekIndex >= 0 ? plan.weeks[currentWeekIndex] : null;

  const planLabel = GOALS.find(g => g.id === profile.goal)?.label
                 || CATEGORIES.find(c => c.id === profile.category)?.label
                 || "Mon plan";
  const blockedWeeks = !isPremium && plan.totalRealWeeks > FREE_WEEKS_LIMIT
    ? plan.totalRealWeeks - FREE_WEEKS_LIMIT
    : 0;

  return (
    <div style={{ paddingBottom: "calc(var(--bottom-nav-h) + var(--safe-bottom) + var(--nav-lift) + 24px)", minHeight: "100dvh" }}>
      {/* ── Header sticky ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 30,
        background: "rgba(248,249,252,0.96)", backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: `1px solid rgba(142,179,255,0.10)`,
        paddingTop: "var(--safe-top)",
      }}>
        <div className="app-shell" style={{ paddingTop: 14, paddingBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: G.ink, lineHeight: 1, margin: 0 }}>{planLabel}</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 12, fontWeight: 600, color: G.inkLight,
              background: G.greyXLight, padding: "4px 9px", borderRadius: 8,
            }}>
              Sem. {currentWeekIndex >= 0 ? currentWeekIndex + 1 : plan.weeks.length}/{isPremium ? plan.weeks.length : Math.min(plan.weeks.length, plan.totalRealWeeks ?? plan.weeks.length)}
            </span>
            {currentWeekIndex >= 0 && currentWeek?.focus && (
              <span style={{ fontSize: 12, color: G.blue, fontWeight: 600 }}>{currentWeek.focus}</span>
            )}
          </div>
        </div>
        {/* Plan switcher */}
        {plans && plans.length > 0 && (
          <div className="h-scroll" style={{ paddingBottom: 12 }}>
            {plans.map(entry => {
              const isActive = entry.id === activePlanId;
              const lbl = GOALS.find(g => g.id === entry.profile.goal)?.label
                       || CATEGORIES.find(c => c.id === entry.profile.category)?.label
                       || "Plan";
              const days = entry.profile.eventDate
                ? Math.max(0, Math.ceil((new Date(entry.profile.eventDate) - new Date()) / 86400000))
                : null;
              return (
                <div key={entry.id} style={{
                  flexShrink: 0, display: "flex", alignItems: "center", borderRadius: 100,
                  border: `1.5px solid ${isActive ? G.blue : G.greyLight}`,
                  background: isActive ? G.blueLight : G.surface,
                  transition: "all 0.15s", overflow: "hidden",
                }}>
                  <button onClick={() => onSwitchPlan(entry.id)} style={{
                    padding: "8px 12px 8px 14px", cursor: "pointer",
                    background: "none", border: "none",
                    color: isActive ? G.blue : G.grey,
                    fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
                    minHeight: 44,
                  }}>
                    {lbl}{days !== null ? ` · J−${days}` : ""}
                  </button>
                  {plans.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onDeletePlan(entry.id); }}
                      aria-label="Supprimer ce plan"
                      style={{
                      padding: "8px 12px 8px 4px", cursor: "pointer",
                      background: "none", border: "none",
                      color: isActive ? G.blue : G.greyMid,
                      fontSize: 16, lineHeight: 1, display: "flex", alignItems: "center", minHeight: 44,
                    }}>×</button>
                  )}
                </div>
              );
            })}
            <button onClick={onAddPlan} style={{
              flexShrink: 0, padding: "8px 14px", borderRadius: 100, cursor: "pointer",
              border: `1.5px dashed ${isPremium ? G.greyLight : G.gold + "66"}`,
              background: isPremium ? "transparent" : G.goldLight,
              color: isPremium ? G.greyMid : G.gold, fontSize: 13, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", minHeight: 44,
            }}>
              {isPremium ? <Plus size={13} /> : <Lock size={12} />}
              {isPremium ? "Ajouter" : "Premium"}
            </button>
          </div>
        )}
      </div>

      <div className="app-shell" style={{ paddingTop: 16 }}>

        {/* Free : changer d'objectif bien visible au-dessus du plan */}
        {!isPremium && <ResetConfirmButton onReset={onReset} variant="card" />}

        {/* Semaines débloquées */}
        {plan.weeks.slice(0, unlocked).map((week, i) => (
          <div key={i}>
            <WeekCard week={week} weekIndex={i} onComplete={onComplete} onShare={onShare} onEditFeedback={onEditFeedback} isCurrentWeek={i === currentWeekIndex} isPremium={isPremium} onUpgrade={onUpgrade} />
          </div>
        ))}

        {/* Free : paywall au-delà des 4 premières semaines */}
        {!isPremium && blockedWeeks > 0 && (
          <PremiumBanner weeksTotal={plan.totalRealWeeks} weeksShown={FREE_WEEKS_LIMIT} onUpgrade={onUpgrade} />
        )}

        {/* Premium : lien discret en bas (ils peuvent aussi ajouter un plan) */}
        {isPremium && <ResetConfirmButton onReset={onReset} variant="subtle" />}
      </div>
    </div>
  );
};

/** Badges sur l’accueil : colorés si débloqués, grisés sinon. */
const HomeBadgesSection = ({ plan }) => {
  const stats = computeStats(plan);
  const earned = checkBadges(stats);
  const earnedSet = new Set(earned);
  return (
    <div style={{
      background: G.surface, borderRadius: 20, padding: "18px",
      boxShadow: "0 1px 3px rgba(25,28,30,0.03), 0 8px 20px rgba(53,93,163,0.05)",
      border: `1px solid ${G.greyLight}`,
      marginBottom: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Award size={16} color={G.blue} />
          <div style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: "0.06em", textTransform: "uppercase" }}>Badges</div>
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color: G.blue, fontVariantNumeric: "tabular-nums" }}>
          {earned.length}/{BADGE_DEFS.length}
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px 8px" }}>
        {BADGE_DEFS.map(b => {
          const unlocked = earnedSet.has(b.id);
          return (
            <div
              key={b.id}
              title={unlocked ? b.desc : `À débloquer — ${b.desc}`}
              style={{ textAlign: "center", minWidth: 0 }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                margin: "0 auto 6px",
                background: unlocked ? `${b.color}20` : G.greyXLight,
                border: unlocked ? `1.5px solid ${b.color}40` : `1.5px solid ${G.greyLight}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative",
                boxShadow: unlocked ? `0 4px 12px ${b.color}22` : "none",
                filter: unlocked ? "none" : "grayscale(1)",
                opacity: unlocked ? 1 : 0.45,
              }}>
                <b.icon size={20} color={unlocked ? b.color : G.greyMid} />
                {!unlocked && (
                  <div style={{
                    position: "absolute", bottom: -2, right: -2,
                    width: 16, height: 16, borderRadius: "50%",
                    background: G.surface, border: `1px solid ${G.greyLight}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Lock size={9} color={G.greyMid} />
                  </div>
                )}
              </div>
              <div style={{
                fontSize: 10, fontWeight: unlocked ? 700 : 600,
                color: unlocked ? G.ink : G.greyMid,
                lineHeight: 1.25,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}>
                {b.label}
              </div>
            </div>
          );
        })}
      </div>
      {earned.length < BADGE_DEFS.length && (
        <p style={{ fontSize: 11, color: G.greyMid, margin: "12px 0 0", lineHeight: 1.4 }}>
          Complète des séances pour débloquer les badges grisés.
        </p>
      )}
    </div>
  );
};

// ── DASHBOARD ──────────────────────────────────────────────────────────────
const Dashboard = ({ plan, profile, onTabChange, onSignOut, user }) => {
  const stats = computeStats(plan);
  const currentWeekIndex = plan.weeks.findIndex(w => !w.sessions.every(isSessionResolved));
  const currentWeek = currentWeekIndex >= 0 ? plan.weeks[currentWeekIndex] : null;
  const nextSession = currentWeek?.sessions.find(s => !isSessionResolved(s));

  // Weekly progress
  const weekPlanned  = currentWeek?.sessions.reduce((a, s) => a + (parseInt(s.distance) || 0), 0) ?? 0;
  const weekDone     = currentWeek?.sessions.filter(s => s.completed).reduce((a, s) => a + (parseInt(s.distance) || 0), 0) ?? 0;
  const weekSessions = currentWeek?.sessions.filter(isSessionResolved).length ?? 0;
  const weekTotal    = currentWeek?.sessions.length ?? 0;

  // Avatar / name
  const avatarUrl = user?.user_metadata?.avatar_url
    || (() => {
      try {
        if (user?.id) {
          return localStorage.getItem(`myswym_avatar_${user.id}`) || localStorage.getItem("myswym_avatar");
        }
        return localStorage.getItem("myswym_avatar");
      } catch { return null; }
    })();
  const firstName = user?.user_metadata?.firstname
    || (() => {
      try {
        if (user?.id) {
          return localStorage.getItem(`myswym_firstname_${user.id}`) || localStorage.getItem("myswym_firstname");
        }
        return localStorage.getItem("myswym_firstname");
      } catch { return null; }
    })()
    || user?.user_metadata?.full_name?.split(" ")[0]
    || user?.email?.split("@")[0]
    || "Nageur";
  const initials = firstName.slice(0, 2).toUpperCase();

  const planFinished = stats.totalSessions >= stats.planTotal && stats.planTotal > 0;

  return (
    <div style={{ paddingBottom: "calc(var(--bottom-nav-h) + var(--safe-bottom) + var(--nav-lift) + 32px)", background: "transparent", minHeight: "100dvh" }}>

      {/* ── Top App Bar ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        background: G.glass, backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: `1px solid ${G.greyLight}`,
        boxShadow: "0 1px 16px rgba(142,179,255,0.08)",
        paddingTop: "var(--safe-top)",
      }}>
        <div className="app-shell" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, paddingBottom: 10, minHeight: 56 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button type="button" onClick={() => onTabChange("profile")} style={{ border: "none", background: "none", cursor: "pointer", padding: 0, minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", WebkitTapHighlightColor: "transparent" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", background: G.blueLight, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${G.blueMid}`, flexShrink: 0 }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 12, fontWeight: 800, color: G.blue }}>{initials}</span>
                }
              </div>
            </button>
            <BrandLogo variant="wordmark" height={22} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <a
              href="/accueil"
              style={{
                textDecoration: "none",
                border: `1px solid ${G.greyLight}`,
                color: G.grey,
                fontSize: 12,
                fontWeight: 700,
                borderRadius: 8,
                padding: "10px 12px",
                lineHeight: 1,
                background: G.surface,
                minHeight: 44,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Accueil
            </a>
            <button type="button" onClick={() => onTabChange("profile")} style={{ background: "none", border: "none", cursor: "pointer", padding: 10, minWidth: 44, minHeight: 44, WebkitTapHighlightColor: "transparent" }}>
              <Settings size={20} color={G.grey} />
            </button>
          </div>
        </div>
      </header>

      <div className="app-shell" style={{ paddingTop: 16 }}>

        {/* ── Greeting ── */}
        {(() => {
          const h = new Date().getHours();
          const greeting = h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir";
          return (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: G.grey, marginBottom: 2 }}>{greeting},</p>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: G.ink, lineHeight: 1.1 }}>{firstName}</h1>
            </div>
          );
        })()}

        {/* ── Plan finished banner ── */}
        {planFinished && (
          <div className="fade-up scale-in" style={{ background: G.surface, borderRadius: 24, padding: "20px 16px", textAlign: "center", marginBottom: 16, border: `1px solid rgba(142,179,255,0.15)`, boxShadow: "0 4px 20px rgba(142,179,255,0.10)" }}>
            {plan.isProgression
              ? <><TrendingUp size={36} color={G.blue} style={{ margin: "0 auto 8px" }} /><h2 style={{ fontSize: 20, fontWeight: 800, color: G.ink, marginBottom: 6 }}>Cycle terminé</h2><p style={{ color: G.grey, fontSize: 13, marginBottom: 14 }}>Tu as nagé <strong style={{ color: G.ink }}>{(stats.totalMeters / 1000).toFixed(1)} km</strong> en {plan.weeks.length} semaines.</p><Btn variant="blue" onClick={onSignOut}>Nouveau cycle</Btn></>
              : <><Trophy size={36} color={G.gold} style={{ margin: "0 auto 8px" }} /><h2 style={{ fontSize: 20, fontWeight: 800, color: G.ink, marginBottom: 4 }}>Plan terminé</h2><p style={{ color: G.grey, fontSize: 13 }}>Programme complété à 100 %.</p></>
            }
          </div>
        )}

        {/* ── Prochaine séance — card principale ── */}
        {nextSession ? (
          <button onClick={() => onTabChange("plan")} style={{
            width: "100%", textAlign: "left", cursor: "pointer",
            background: G.surface, borderRadius: 20, padding: "18px", marginBottom: 12,
            border: `1px solid ${G.greyLight}`,
            boxShadow: "0 1px 3px rgba(25,28,30,0.04), 0 10px 28px rgba(53,93,163,0.07)",
            display: "block",
          }}>
            {(() => {
              const tm = TYPE_META[nextSession.type] || TYPE_META.ENDURANCE;
              const intensity = parseIntensity(nextSession.intensity);
              return (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: "0.06em", textTransform: "uppercase" }}>Prochaine séance</span>
                    <span style={{
                      fontSize: 10, fontWeight: 800, color: tm.color, background: tm.bg,
                      padding: "4px 9px", borderRadius: 8, letterSpacing: "0.04em",
                    }}>{nextSession.type}</span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: G.ink, marginBottom: 10, letterSpacing: "-0.02em", lineHeight: 1.2 }}>{nextSession.title}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: intensity.cue ? 10 : 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: G.blue, background: G.blueLight, padding: "5px 10px", borderRadius: 8 }}>{nextSession.distance}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: G.grey, background: G.greyXLight, padding: "5px 10px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Timer size={12} color={G.greyMid} />
                      {formatDuration(nextSession.duration)}
                    </span>
                    {intensity.zone && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: G.inkLight, border: `1px solid ${G.greyLight}`, padding: "5px 10px", borderRadius: 8 }}>{intensity.zone}</span>
                    )}
                  </div>
                  {intensity.cue && (
                    <p style={{ fontSize: 13, color: G.grey, lineHeight: 1.4, margin: 0 }}>{intensity.cue.charAt(0).toUpperCase() + intensity.cue.slice(1)}</p>
                  )}
                  <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 6, color: G.blue, fontSize: 13, fontWeight: 700 }}>
                    Voir le plan <ArrowRight size={14} color={G.blue} />
                  </div>
                </>
              );
            })()}
          </button>
        ) : !planFinished && (
          <div style={{ background: G.surface, borderRadius: 20, padding: "20px 18px", marginBottom: 12, textAlign: "center", border: `1px solid ${G.greyLight}` }}>
            <Trophy size={28} color={G.gold} style={{ margin: "0 auto 8px" }} />
            <p style={{ color: G.grey, fontSize: 14, fontWeight: 600 }}>Toutes les séances sont terminées !</p>
          </div>
        )}

        {/* ── Semaine en cours ── */}
        <div style={{
          background: G.surface, borderRadius: 20, padding: "18px",
          boxShadow: "0 1px 3px rgba(25,28,30,0.03), 0 8px 20px rgba(53,93,163,0.05)",
          border: `1px solid ${G.greyLight}`,
          marginBottom: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: "0.06em", textTransform: "uppercase" }}>Cette semaine</div>
            <span style={{ fontSize: 13, fontWeight: 800, color: G.blue, fontVariantNumeric: "tabular-nums" }}>{weekSessions}/{weekTotal}</span>
          </div>
          <div style={{ height: 6, borderRadius: 6, background: G.greyLight, overflow: "hidden", marginBottom: 12 }}>
            <div style={{
              width: `${weekTotal > 0 ? Math.round((weekSessions / weekTotal) * 100) : 0}%`,
              height: "100%", borderRadius: 6, background: G.blue, transition: "width 0.4s ease",
            }} />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: G.inkLight, background: G.greyXLight, padding: "5px 10px", borderRadius: 8 }}>
              {weekSessions} / {weekTotal} séances
            </span>
            {weekPlanned > 0 && (
              <span style={{ fontSize: 12, fontWeight: 600, color: G.inkLight, background: G.greyXLight, padding: "5px 10px", borderRadius: 8 }}>
                {weekDone > 0 ? weekDone.toLocaleString("fr") : "0"} / {weekPlanned >= 1000 ? `${(weekPlanned / 1000).toFixed(1)} km` : `${weekPlanned} m`}
              </span>
            )}
          </div>
        </div>

        {/* ── Badges (débloqués + grisés) ── */}
        <HomeBadgesSection plan={plan} />
      </div>
    </div>
  );
};

// ── BADGES TAB ─────────────────────────────────────────────────────────────
const BadgesTab = ({ plan }) => {
  const stats = computeStats(plan);
  const earned = checkBadges(stats);
  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ background: G.blue, padding: "52px 20px 28px" }}>
        <div className="fade-up" style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", letterSpacing: 2, marginBottom: 5, fontWeight: 700, textTransform: "uppercase" }}>Tes récompenses</div>
        <h1 className="fade-up-1" style={{ fontFamily: "'Lexend', sans-serif", fontSize: 28, fontWeight: 700, letterSpacing: "0.03em", color: G.white, marginBottom: 4 }}>Badges</h1>
        <p className="fade-up-2" style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>{earned.length}/{BADGE_DEFS.length} débloqués</p>
        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          {BADGE_DEFS.map(b => (
            <div key={b.id} style={{ width: 32, height: 32, borderRadius: "50%", background: earned.includes(b.id) ? b.color : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", filter: earned.includes(b.id) ? "none" : "opacity(0.35)" }}>
              {earned.includes(b.id) && <b.icon size={16} color={G.white} />}
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: "20px 16px 0" }}>
        {earned.length > 0 && (
          <>
            <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: "0.04em", color: G.ink, marginBottom: 12 }}>Débloqués</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
              {BADGE_DEFS.filter(b => earned.includes(b.id)).map(b => (
                <div key={b.id} className="scale-in" style={{ background: G.surface, borderRadius: 16, padding: 16, textAlign: "center", border: `2px solid ${b.color}20`, boxShadow: `0 4px 16px ${b.color}18` }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: `${b.color}18`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                    <b.icon size={24} color={b.color} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: G.ink, marginBottom: 3 }}>{b.label}</div>
                  <div style={{ fontSize: 11, color: G.grey, lineHeight: 1.4 }}>{b.desc}</div>
                </div>
              ))}
            </div>
          </>
        )}
        {BADGE_DEFS.filter(b => !earned.includes(b.id)).length > 0 && (
          <>
            <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: "0.04em", color: G.ink, marginBottom: 12 }}>À débloquer</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {BADGE_DEFS.filter(b => !earned.includes(b.id)).map(b => (
                <div key={b.id} style={{ background: G.greyXLight, borderRadius: 16, padding: 16, textAlign: "center", border: `1px solid ${G.greyLight}` }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: G.greyLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                    <Lock size={20} color={G.greyMid} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: G.greyMid, marginBottom: 3 }}>{b.label}</div>
                  <div style={{ fontSize: 11, color: G.greyMid, lineHeight: 1.4 }}>{b.desc}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── PLAN GENERATOR ─────────────────────────────────────────────────────────
const BASE_DISTANCES = {
  // Niveau 0 — Découverte : séances courtes, fun, sans pression
  découverte:   { endurance: 700,  seuil: 550,  vitesse: 450,  technique: 600,  récupération: 500,  bnssa: 700  },
  // Niveau 1 — Régulier (= ancien Débutant)
  beginner:     { endurance: 1200, seuil: 900,  vitesse: 700,  technique: 1000, récupération: 700,  bnssa: 1000 },
  régulier:     { endurance: 1200, seuil: 900,  vitesse: 700,  technique: 1000, récupération: 700,  bnssa: 1000 },
  // Niveau 2 — Sportif (= ancien Intermédiaire)
  intermediate: { endurance: 2000, seuil: 1800, vitesse: 1400, technique: 1600, récupération: 1200, bnssa: 1500 },
  sportif:      { endurance: 2000, seuil: 1800, vitesse: 1400, technique: 1600, récupération: 1200, bnssa: 1500 },
  // Niveau 3 — Performance (= ancien Confirmé)
  advanced:     { endurance: 3200, seuil: 2600, vitesse: 2000, technique: 2400, récupération: 1600, bnssa: 2000 },
  performance:  { endurance: 3200, seuil: 2600, vitesse: 2000, technique: 2400, récupération: 1600, bnssa: 2000 },
};
// Alias bnssa pour tests_pompiers / CAEPMNS (même type de séance sauvetage)
Object.keys(BASE_DISTANCES).forEach(k => {
  BASE_DISTANCES[k].tests_pompiers = BASE_DISTANCES[k].bnssa;
  BASE_DISTANCES[k].caepmns = BASE_DISTANCES[k].bnssa;
});

// pace100[lvl][zone] = secondes aux 100m (0=découverte 1=régulier 2=sportif 3=performance)
const PACE = {
  easy:      [220, 170, 130, 105],
  threshold: [200, 155, 112,  90],
  sprint:    [180, 140,  95,  75],
};

// ── Paces personnalisées ─────────────────────────────────────────────────
// Set par generatePlan quand profile.pace100 (T100) est renseigné.
// null = fallback sur le tableau PACE par niveau.
let _pace100 = null;
let _isPremium = false;

// Facteurs de zone : recalculés via appZoneMultForT100(_pace100) — plus tolérants si T100 rapide
let _zoneMult = { easy: 1.35, threshold: 1.08, sprint: 0.95 };

// Formate des secondes en m'ss"
const fmtS = s => `${Math.floor(s/60)}'${Math.round(s%60).toString().padStart(2,'0')}"`;

// Departure interval: swim time + rest, rounded up to 5s
// Quand _pace100 est set, affiche aussi l'allure cible /100m
const di = (meters, lvl, zone = 'easy') => {
  const rest = zone === 'sprint' ? 90 : zone === 'threshold' ? 15 : 20;
  let secsPer100;
  if (_pace100 !== null) {
    secsPer100 = _pace100 * (_zoneMult[zone] ?? 1.35);
  } else {
    secsPer100 = PACE[zone][lvl];
  }
  const totalSecs = Math.ceil((meters * secsPer100 / 100 + rest) / 5) * 5;
  if (_pace100 !== null) {
    return `${fmtS(totalSecs)} · allure cible ${fmtS(Math.round(secsPer100))}/100m`;
  }
  return `${fmtS(totalSecs)}`;
};

// Récupération simple pour les plans gratuits (pas de départ)
const REST_SECS = { sprint: 90, threshold: 30, easy: 20 };
const ri = (zone = 'easy') => fmtS(REST_SECS[zone] ?? 20);

// dep() = D départ (premium) ou R récup (gratuit)
const dep = (meters, lvl, zone = 'easy') =>
  _isPremium ? `D${di(meters, lvl, zone)}` : `R${ri(zone)}`;
// Round to nearest pool-length multiple, min 1 length
const snap = (d, P) => Math.max(P, Math.round(d / P) * P);

// Calcule la vraie distance totale d'une séance en lisant ses détails
const calcSessionDistance = (details = []) => {
  let total = 0;
  for (let i = 0; i < details.length; i++) {
    const line = details[i];
    // Titre de bloc (« 400m éducatif ») : la distance est dans les sous-séries — ne pas compter 2×
    if (classifyDetailLine(line) === "header") {
      const hasSubs = i + 1 < details.length && classifyDetailLine(details[i + 1]) === "sub";
      if (hasSubs) continue;
    }
    let rest = line;
    // 1. N×Xm (ex : "8×50m", "4×25m")
    rest = rest.replace(/(\d+)\s*[×x]\s*(\d+)\s*m/g, (_, n, x) => {
      total += parseInt(n) * parseInt(x); return '';
    });
    // 2. Pyramide "25–50–75–100–75–50–25m"
    rest = rest.replace(/(\d+(?:\s*[–\-]\s*\d+)+)\s*m/g, (_, seq) => {
      seq.split(/[–\-]/).forEach(v => { const n = parseInt(v.trim()); if (!isNaN(n)) total += n; });
      return '';
    });
    // 3. Xm simples restants (ex : "200m", "100m")
    rest.replace(/\b(\d+)\s*m\b/g, (_, x) => { total += parseInt(x); });
  }
  return total;
};

// Eau libre & triathlon : priorité crawl/dos — pas les blocs perf « 4 nages » lourds en brasse
const isOpenWaterGoal = (g) => g?.startsWith("open_water") || g?.startsWith("eau_libre");
const isTriathlonGoal = (g) => g?.startsWith("triathlon");
const shouldUsePoolIMBlock = (g) => !isOpenWaterGoal(g) && !isTriathlonGoal(g);

// Banque confirmé (ex-OW_BASE_SESSIONS) : src/lib/swim-session-generator.js — branchée via swim-plan-bridge.


const SESSION_TEMPLATES = {

  // ── ENDURANCE ────────────────────────────────────────────────────────────
  // 5 variants — rotation formula spreads across weeks without exact repeats
  endurance: (dist, pool, level = "intermediate", weekIdx = 0, goal = "") => {
    const isDecouverte = level === "découverte";
    const isBeg = level === "beginner" || level === "régulier" || isDecouverte;
    const isAdv = level === "advanced" || level === "performance";
    const P = pool, lvl = getLvlIndex(level);
    const v = (Math.floor(weekIdx / 10) * 3 + (weekIdx % 10)) % 5;

    // ── DÉCOUVERTE : séances courtes, simples, distributeur d'idées ──────
    if (isDecouverte) {
      const nLaps = Math.max(2, Math.round(dist / (2 * P)));
      const vd = (Math.floor(weekIdx / 8) * 3 + (weekIdx % 8)) % 5;
      return {
        type: "ENDURANCE",
        ...[
          {
            title: "Nage à ton rythme",
            intensity: "Très facile — tu dois pouvoir parler",
            details: [
              `${Math.max(2, nLaps - 1)}× ${2*P}m crawl — repose ${P <= 25 ? "30\"" : "40\""} entre chaque — nage sans te presser, comme une promenade`,
              `${Math.max(1, Math.round(nLaps * 0.3))}× ${2*P}m dos — repose 30" — regarde le plafond, flotte`,
              `Fin : 1 longueur très lente, sens l'eau autour de toi`,
            ],
          },
          {
            title: "Crawl & dos en alternance",
            intensity: "Très facile — change de nage pour varier",
            details: [
              `Répète ${Math.max(3, Math.round(dist / (4 * P)))} fois : ${2*P}m crawl + ${2*P}m dos — repose 30" après chaque paire`,
              `Bonus si tu te sens bien : ${P}m crawl à allure plus vive — juste pour voir`,
              `Fin : ${P}m dos très lent, bras tendus`,
            ],
          },
          {
            title: "Tiens 10 minutes",
            intensity: "Modéré — essaie sans t'arrêter",
            details: [
              `Objectif : nager 10 minutes sans pause — choisis ton allure toi-même`,
              `Si tu dois t'arrêter : repose 20" et repars — c'est normal au début`,
              `${Math.max(1, Math.round(nLaps * 0.25))}× ${2*P}m dos — récupération douce à la fin`,
            ],
          },
          {
            title: "Longueurs progressives",
            intensity: "Facile → modéré — tu accélères au fil des longueurs",
            details: [
              `${Math.max(2, Math.round(nLaps * 0.5))}× ${2*P}m crawl lent — repose 30" — mise en jambes`,
              `${Math.max(2, Math.round(nLaps * 0.3))}× ${2*P}m crawl un peu plus vite — repose 25"`,
              `${Math.max(1, Math.round(nLaps * 0.2))}× ${2*P}m crawl à ton meilleur rythme — repose 30"`,
              `Fin : ${P}m dos tranquille`,
            ],
          },
          {
            title: "Nage libre & exploration",
            intensity: "Facile — fais ce que tu veux, navigue",
            details: [
              `${Math.max(2, Math.round(nLaps * 0.4))}× ${2*P}m crawl — repose 30" — concentre-toi sur ta respiration`,
              `${Math.max(2, Math.round(nLaps * 0.3))}× ${P}m dos — repose 20" — ferme les yeux une longueur si tu oses`,
              `${Math.max(1, Math.round(nLaps * 0.2))}× ${2*P}m nage de ton choix (crawl, dos, brasse) — repose 30"`,
              `Fin : flotte 1 minute sur le dos, bras en croix`,
            ],
          },
        ][vd],
      };
    }

    // ── RÉGULIER : 8 variants clairs, progressifs, sans jargon ─────────────
    if (isBeg) {
      const nLaps = Math.max(3, Math.round(dist / (2 * P)));
      const rest  = P <= 25 ? "25\"" : "30\"";
      const nA = Math.max(3, Math.round(nLaps * 0.65));
      const nB = Math.max(2, Math.round(nLaps * 0.25));
      const nC = Math.max(2, Math.round(nLaps * 0.5));
      const nD = Math.max(2, Math.round(nLaps * 0.5));
      const vb = (Math.floor(weekIdx / 10) * 3 + (weekIdx % 10)) % 8;
      return {
        type: "ENDURANCE",
        ...[
          {
            title: "Bâtis ton fond",
            intensity: "Allure confortable — tu pourrais parler",
            details: [
              `Échauffement : ${2*P}m crawl très lent + ${P}m dos`,
              `${nA}× ${2*P}m crawl — repose ${rest} — allure constante, ni trop lent ni essoufflé`,
              `${nB}× ${2*P}m dos — repose ${rest} — récupération active`,
              `Fin : ${P}m crawl très lent`,
            ],
          },
          {
            title: "La pyramide",
            intensity: "Allure confortable — monte les distances puis redescends",
            details: [
              `Échauffement : ${2*P}m crawl tranquille`,
              `${P}m · ${2*P}m · ${3*P}m · ${2*P}m · ${P}m crawl — ${rest} entre chaque — même sensation du début à la fin`,
              `${nB}× ${2*P}m dos — récup douce`,
              `Fin : ${P}m à ton rythme`,
            ],
          },
          {
            title: "Crawl & dos en alternance",
            intensity: "Facile — change de nage, récup naturelle",
            details: [
              `Échauffement : ${2*P}m crawl lent`,
              `Répète ${Math.max(4, Math.round(nLaps * 0.4))} fois : ${2*P}m crawl + ${2*P}m dos — repose ${rest} après chaque paire`,
              `Fin : ${P}m de ton choix, très lent`,
            ],
          },
          {
            title: "Arrive plus fort",
            intensity: "Facile → modéré — la 2e longueur toujours plus vite",
            details: [
              `Échauffement : ${2*P}m crawl lent + ${P}m dos`,
              `${nA}× ${2*P}m crawl — repose ${rest} — 1re longueur calme, 2e longueur un cran plus vite : arrive plus fort que tu n'es parti`,
              `${Math.max(1, Math.round(nLaps * 0.15))}× ${2*P}m dos lent — récup`,
              `Fin : ${P}m crawl très lent`,
            ],
          },
          {
            title: "Longues séquences",
            intensity: "Modéré — tiens la distance entière",
            details: [
              `Échauffement : ${2*P}m crawl tranquille`,
              `${Math.max(2, Math.round(nLaps * 0.5))}× ${4*P}m crawl — repose 40" — gère ton rythme, ne parte pas trop vite`,
              `${nB}× ${2*P}m dos — ${rest} — récup active`,
              `Fin : ${P}m très lent`,
            ],
          },
          {
            title: "3 blocs qui montent",
            intensity: "Progressif — chaque bloc est un cran au-dessus",
            details: [
              `Échauffement : ${2*P}m crawl lent`,
              `Bloc 1 : ${Math.max(2, Math.round(nLaps * 0.22))}× ${2*P}m crawl tranquille — repose ${rest}`,
              `Bloc 2 : ${Math.max(2, Math.round(nLaps * 0.22))}× ${2*P}m crawl allure normale — repose ${rest}`,
              `Bloc 3 : ${Math.max(2, Math.round(nLaps * 0.22))}× ${2*P}m crawl vif sans être à fond — repose 35"`,
              `Fin : ${P}m dos très lent`,
            ],
          },
          {
            title: "20 minutes non-stop",
            intensity: "Modéré — objectif : tenir sans s'arrêter",
            details: [
              `Échauffement : ${2*P}m crawl + ${P}m dos`,
              `Nage ${nC}× ${2*P}m sans pause — allure que tu peux tenir de bout en bout — si tu dois t'arrêter : 15" max et repars`,
              `${Math.max(1, Math.round(nLaps * 0.15))}× ${2*P}m dos — récup douce`,
              `Fin : ${P}m à fleur d'eau, très lent`,
            ],
          },
          {
            title: "3 nages en circuit",
            intensity: "Facile — crawl, dos, brasse en rotation",
            details: [
              `Répète ${Math.max(3, Math.round(nLaps * 0.32))} fois : ${2*P}m crawl + ${2*P}m dos + ${2*P}m brasse — repose 30" après chaque trio`,
              `${Math.max(1, Math.round(nLaps * 0.08))}× ${2*P}m crawl confort — récup finale`,
              `Fin : ${P}m de ton choix`,
            ],
          },
        ][vb],
      };
    }

    // ── PERFORMANCE / EXPERT : endurance + 4 nages (piscine polyvalente uniquement) ──
    if (isAdv && shouldUsePoolIMBlock(goal)) {
      const vp = (Math.floor(weekIdx / 10) * 3 + (weekIdx % 10)) % 5;
      const WARM = 500, COOL = 200, avail = dist - WARM - COOL;
      const echu = `200m crawl + 100m dos + 100m brasse + 4×25m papillon — 20" récup`;
      const repL  = Math.min(8*P, 400);
      const repM2 = Math.min(6*P, 300);
      const repS  = Math.min(4*P, 200);
      const nL    = Math.max(3, Math.min(8,  Math.floor(avail * 0.72 / repL)));
      const nM2   = Math.max(4, Math.min(10, Math.floor(avail * 0.72 / repM2)));
      const nS2   = Math.max(6, Math.min(14, Math.floor(avail * 0.72 / repS)));
      const nActif = Math.max(2, Math.min(6, Math.round(avail * 0.18 / (2*P))));
      const imRep = 4*P;
      const nIM   = Math.max(3, Math.min(6,  Math.floor(avail * 0.65 / imRep)));
      return {
        type: "ENDURANCE",
        ...[
          {
            title: "Fond en séries",
            intensity: "Allure confortable — tiens sur la durée",
            details: [
              `Échauffement : ${echu}`,
              `${nL}×${repL}m crawl — ${dep(repL, lvl, 'easy')} — allure régulière, respiration 3 temps`,
              `${nActif}×${2*P}m dos + brasse alternance — 15" récup — récupération active`,
              `Retour calme : 200m dos lent`,
            ],
          },
          {
            title: "Pyramide aérobie",
            intensity: "Régulier de bout en bout",
            details: [
              `Échauffement : ${echu}`,
              `${2*P}–${4*P}–${6*P}–${4*P}–${2*P}m crawl — 15" récup entre paliers — même effort à la montée et à la descente`,
              `${nActif}×${2*P}m pull buoy — 15" récup — bras seuls, relâche les jambes`,
              `Retour calme : 200m dos`,
            ],
          },
          {
            title: "Négatifs splits",
            intensity: "2e moitié plus vite que la 1re",
            details: [
              `Échauffement : ${echu}`,
              `${nM2}×${repM2}m crawl — ${dep(repM2, lvl, 'easy')} — 1re moitié retiens-toi, 2e moitié accélère`,
              `${nActif}×${2*P}m dos — 15" récup — récupération active, rotation consciente`,
              `Retour calme : 200m dos`,
            ],
          },
          {
            title: "Longue distance",
            intensity: "Z2 — reps longues, gestion mentale",
            details: [
              `Échauffement : ${echu}`,
              `${nL}×${repL}m crawl — ${dep(repL, lvl, 'easy')} — allure maîtrisée sur la totalité, sans relâche en fin de rep`,
              `${nActif}×${2*P}m 4 nages — 15" récup — dos puis brasse en alternance`,
              `Retour calme : 200m dos lent`,
            ],
          },
          {
            title: "Alternée 4 nages",
            intensity: "Polyvalence — endurance toutes nages",
            details: [
              `Échauffement : ${echu}`,
              `${nIM}×${imRep}m en rotation : dos · brasse · crawl — 15" récup — 1 nage par rep, 1 tour complet = 3 reps`,
              `${nActif}×${imRep}m 4 nages (${P}m papillon + ${P}m dos + ${P}m brasse + ${P}m crawl) — 30" récup`,
              `Retour calme : 200m dos lent`,
            ],
          },
        ][vp],
      };
    }

    const isDiplome   = goal === "bnssa" || goal === "bpjeps_aan" || goal === "tests_pompiers" || goal === "caepmns";
    const isBNSSA     = goal === "bnssa" || goal === "tests_pompiers" || goal === "caepmns";
    const isTriathlon = isTriathlonGoal(goal);
    const isOpenWater = isOpenWaterGoal(goal);

    const vp  = (Math.floor(weekIdx / 10) * 3 + (weekIdx % 10)) % 5;
    const r3  = Math.min(12*P, 300);
    const r2  = Math.min(8*P,  200);
    const r1  = Math.min(4*P,  100);
    const nR3   = Math.max(3, Math.min(7,  Math.round(dist * 0.55 / r3)));
    const nR2   = Math.max(4, Math.min(10, Math.round(dist * 0.55 / r2)));
    const nFill = Math.max(2, Math.min(8,  Math.round(dist * 0.18 / r1)));
    const rLong = Math.min(16*P, 400);
    const nLong = Math.max(2, Math.min(5,  Math.round(dist * 0.55 / rLong)));

    // ── DIPLÔME — séances orientées examen ──────────────────────────────
    if (isDiplome) {
      const n400 = Math.max(2, Math.min(5, Math.round(dist * 0.55 / 400)));
      const n100 = Math.max(4, Math.min(10, Math.round(dist * 0.50 / 100)));
      const nFdDip = Math.max(2, Math.min(6, Math.round((dist - 300) * 0.20 / (2*P))));
      return {
        type: "ENDURANCE",
        ...[
          {
            title: isBNSSA ? "Endurance + simulation sauvetage" : "Blocs 400m — gestion d'allure",
            intensity: isBNSSA ? "Régulier + explosif court" : "Endurance — vise l'allure exam (≈1'55\"/100m)",
            details: isBNSSA ? [
              `Échauffement : 200m crawl + 100m dos`,
              `${n100}×100m crawl — R30" — allure régulière`,
              `${Math.max(4, Math.round(n100 * 0.4))}×${2*P}m palmes + tuba — R20"`,
              `Apnée : 6×15m — R1'30" — immersion complète`,
              `Simulation : 25m vite → sortie eau → récup 1' — ×3`,
              `Retour calme : 100m dos lent`,
            ] : [
              `Échauffement : 200m crawl + 100m dos + 50m jambes`,
              `${n400}×400m NL — R1'30" — vise le même temps à chaque rep, gère depuis le 1er mètre (objectif < 7'40")`,
              `${nFdDip}×${2*P}m dos — R15" — récup active`,
              `Retour calme : 100m dos lent`,
            ],
          },
          {
            title: isBNSSA ? "100m répétés — objectif exam" : "Montée en distance vers 400m",
            intensity: isBNSSA ? "Efforts soutenus sur 100m" : "Accumulation progressive",
            details: isBNSSA ? [
              `Échauffement : 200m crawl + 100m dos`,
              `${n100}×100m NL — R30" — allure stable, chaque rep identique`,
              `1 simulation chrono : 100m NL à fond — objectif < 1'35"`,
              `Retour calme : 100m dos lent`,
            ] : [
              `Échauffement : 200m crawl + 100m dos`,
              `200m NL R30" → 300m NL R40" → 400m NL R1'30" — même allure par 100m à chaque palier`,
              `${nFdDip}×${2*P}m dos — R15"`,
              `Retour calme : 100m dos lent`,
            ],
          },
          {
            title: isBNSSA ? "Continuité + enchaînement sauvetage" : "3×400m NL — régularité",
            intensity: isBNSSA ? "Endurance + simulation complète" : "Même allure ×3 — note tes temps",
            details: isBNSSA ? [
              `Échauffement : 200m crawl + 100m battements`,
              `4×50m NL — R15" — allure régulière`,
              `Enchaînement : 25m rapide → sortie → marche 10m → rentrée → 25m rapide — ×4 — R1'`,
              `200m dos ou brasse continu — récup active`,
              `Retour calme : 100m dos lent`,
            ] : [
              `Échauffement : 200m crawl + 100m dos`,
              `3×400m NL — R2' — note ton temps à chaque rep, vise la régularité`,
              `${nFdDip}×${2*P}m dos — R15"`,
              `Retour calme : 100m dos lent`,
            ],
          },
          {
            title: isBNSSA ? "Volume & résistance" : "Long fractionné",
            intensity: isBNSSA ? "Endurance continue" : "Distance longue — gestion mentale",
            details: isBNSSA ? [
              `Échauffement : 200m crawl + 100m dos`,
              `${n100}×100m NL — R25" — maintiens le rythme jusqu'à la dernière rep`,
              `50m NL vite + 50m lent — ×${Math.max(2, Math.round(dist * 0.15 / 100))} — contraste d'allure`,
              `Retour calme : 100m dos lent`,
            ] : [
              `Échauffement : 200m crawl + 100m dos`,
              `${nLong}×${rLong}m NL — R1' — reps longues, gère ton allure sur la totalité`,
              `${nFdDip}×${2*P}m dos — R15"`,
              `Retour calme : 100m dos lent`,
            ],
          },
          {
            title: isBNSSA ? "Négatifs + test vitesse" : "Négatifs splits 400m",
            intensity: isBNSSA ? "Gestion d'effort + explosivité" : "2e moitié plus rapide",
            details: isBNSSA ? [
              `Échauffement : 200m crawl + 100m dos`,
              `${n100}×100m NL — R30" — 1re moitié gérée, 2e moitié accélère`,
              `1×100m NL chrono — effort max — note le temps`,
              `Retour calme : 100m dos lent`,
            ] : [
              `Échauffement : 200m crawl + 100m dos`,
              `${n400}×400m NL — R1'30" — 1re moitié tranquille, 2e moitié accélère : arrive plus fort que tu n'es parti`,
              `${nFdDip}×${2*P}m dos — R15"`,
              `Retour calme : 100m dos lent`,
            ],
          },
        ][vp],
      };
    }

    // ── NAGER & PROGRESSER / TRIATHLON / EAU LIBRE ──────────────────────
    const goalCue = isTriathlon
      ? " — régularité course, imagine la bouée"
      : isOpenWater
        ? " — respiration bilatérale, compte tes cycles"
        : "";
    const vpG = (Math.floor(weekIdx / 10) * 3 + (weekIdx % 10)) % 8;
    const nR3b = Math.max(2, Math.min(6, Math.round(dist * 0.50 / r3)));
    const nR2b = Math.max(3, Math.min(8, Math.round(dist * 0.50 / r2)));

    return {
      type: "ENDURANCE",
      ...[
        {
          title: "Fond en séries",
          intensity: "Endurance — allure conversation",
          details: [
            `Échauffement : 200m crawl progressif + 100m battements de jambes`,
            `${nR3}×${r3}m crawl — R20" — allure régulière${goalCue}`,
            `${nFill}×${r1}m dos — R15" — récup active`,
            `Retour calme : 200m dos lent`,
          ],
        },
        {
          title: "Pyramide aérobie",
          intensity: "Endurance — régulier à la montée et à la descente",
          details: [
            `Échauffement : 100m crawl + 100m dos + 4×25m accélérations`,
            `${r1}m – ${r2}m – ${r3}m – ${r2}m – ${r1}m crawl — R15" entre paliers — même effort à chaque palier`,
            `${nFill}×${r1}m dos — R15" — récup active`,
            `Retour calme : 200m dos lent`,
          ],
        },
        {
          title: "Arrive plus fort",
          intensity: "Endurance — 2e moitié toujours plus rapide",
          details: [
            `Échauffement : 200m crawl + 100m battements`,
            `${nR2}×${r2}m crawl — R20" — 1re moitié gérée, 2e moitié accélère${goalCue}`,
            `${nFill}×${r1}m battements mains en flèche — R20" — fouet des chevilles`,
            `Retour calme : 200m dos lent`,
          ],
        },
        {
          title: isOpenWater ? "Séance eau libre — test combinaison" : "Reps longues",
          intensity: isOpenWater ? "Découverte OW — flottaison, navigation, sighting" : "Endurance — gestion sur la distance",
          details: isOpenWater ? [
            `À faire en eau libre (lac, rivière calme, mer protégée)`,
            `10' d'adaptation : nage lente avec la combi — ressens la flottaison`,
            `3×5' de nage continue — récup 2' — sighting toutes les 6–8 bras`,
            `Effort : allure conversation, objectif orientation`,
            `Récup : retour au départ en crawl ou dos très lent`,
          ] : [
            `Échauffement : 200m crawl + 100m dos + 4×${P}m accélérations`,
            `${nLong}×${rLong}m crawl — R15" — allure maîtrisée sur la totalité${isTriathlon ? " — maintiens ton allure de compétition" : ""}`,
            `${nFill}×${r1}m dos — R15" — récup active`,
            `Retour calme : 200m dos lent`,
          ],
        },
        {
          title: isOpenWater ? "Séance eau libre — endurance" : "Crawl & dos alternés",
          intensity: isOpenWater ? "Endurance OW — tenir l'allure sans repères" : "Endurance — polyvalence, récup naturelle",
          details: isOpenWater ? [
            `À faire en eau libre`,
            `Échauffement : 10' de nage lente, teste tes repères visuels`,
            `20–30' de nage continue — sighting toutes les 8 bras, gère ton allure de A à Z`,
            `Si combi : teste les transitions (enlever la combi en 2')`,
            `Récup : 5' de crawl ou dos très lent`,
          ] : [
            `Échauffement : 200m crawl + 100m jambes`,
            `${nR2}×${r2}m crawl — R20" — régulier${goalCue}`,
            `${Math.max(2, Math.round(nR2 * 0.7))}×${r2}m dos — R20" — épaule sort en premier, rotation du bassin`,
            `Retour calme : 150m crawl très lent`,
          ],
        },
        {
          title: "3 blocs progressifs",
          intensity: "Endurance — chaque bloc un cran au-dessus",
          details: [
            `Échauffement : 200m crawl + 100m dos`,
            `Bloc 1 : ${nR3b}×${r3}m crawl — R25" — allure confortable${goalCue}`,
            `Bloc 2 : ${nR2b}×${r2}m crawl — R20" — allure normale, un cran au-dessus`,
            `Bloc 3 : ${Math.max(2, Math.round(nR2b * 0.7))}×${r2}m crawl — R15" — soutenu, tiens jusqu'au bout`,
            `Retour calme : 200m dos lent`,
          ],
        },
        {
          title: isTriathlon ? "Simulation sortie de l'eau" : "Longue distance — gestion mentale",
          intensity: isTriathlon ? "Race-sim — gère l'allure de A à Z" : "Endurance — mental, tiens la distance",
          details: isTriathlon ? [
            `Échauffement : 200m crawl progressif + 100m dos`,
            `${nLong}×${rLong}m crawl — R20" — nage comme si c'était ta compétition : départ maîtrisé, milieu constant, fin plus forte`,
            `${nFill}×${r1}m dos — R15" — récup`,
            `Retour calme : 200m dos lent`,
          ] : [
            `Échauffement : 200m crawl + 100m dos`,
            `${Math.max(2, Math.round(dist * 0.60 / Math.min(20*P, 500)))}×${Math.min(20*P, 500)}m crawl — R30" — reps très longues, gestion mentale sur la totalité`,
            `${nFill}×${r1}m dos — R15" — récup active`,
            `Retour calme : 200m dos lent`,
          ],
        },
        isOpenWater ? {
          title: "Prépa eau libre — crawl en bassin",
          intensity: "Endurance OW — sighting et allure tenue",
          details: [
            `Échauffement : 300m crawl progressif + 4×${P}m sighting (tête hors de l'eau tous les 6 bras)`,
            `${nR3b}×${r3}m crawl — R20" — sighting tous les 8 bras, allure tenue${goalCue}`,
            `${Math.max(2, Math.round(nR2b * 0.7))}×${r2}m crawl — R20" — respiration bilatérale, même allure`,
            `${nFill}×${r1}m dos — R15" — récup active`,
            `Retour calme : 200m crawl très lent`,
          ],
        } : {
          title: "Endurance 3 nages",
          intensity: "Endurance — polyvalence crawl, dos, brasse",
          details: [
            `Échauffement : 200m crawl + 100m dos`,
            `${nR3b}×${r3}m crawl — R20" — allure régulière`,
            `${Math.max(2, Math.round(nR2b * 0.6))}×${r2}m dos — R20" — nage active, épaule qui sort`,
            `${Math.max(2, Math.round(nR2b * 0.5))}×${r2}m brasse — R20" — coulée longue après chaque traction`,
            `Retour calme : 100m dos lent`,
          ],
        },
      ][vpG],
    };
  },

  // ── SEUIL ────────────────────────────────────────────────────────────────
  // 5 variants : CSS, pyramide, blocs T-pace, séries descendantes, over-distance
  seuil: (dist, pool, level = "intermediate", weekIdx = 0, goal = "") => {
    const isDecouverte = level === "découverte";
    const isBeg = level === "beginner" || level === "régulier" || isDecouverte;
    const isAdv = level === "advanced" || level === "performance";
    const P = pool, lvl = getLvlIndex(level);
    const v = (Math.floor(weekIdx / 10) * 3 + (weekIdx % 10)) % 5;

    // ── DÉCOUVERTE : pas de "seuil" au sens technique, juste "un peu plus vite" ──
    if (isDecouverte) {
      const nLaps = Math.max(2, Math.round(dist / (2 * P)));
      const vd = (Math.floor(weekIdx / 8) * 3 + (weekIdx % 8)) % 3;
      return {
        type: "ENDURANCE",
        ...[
          {
            title: "Un peu plus vite aujourd'hui",
            intensity: "Facile/Modéré — légèrement plus vite que d'habitude",
            details: [
              `${Math.max(2, Math.round(nLaps * 0.4))}× ${2*P}m crawl à ton rythme — repose 30"`,
              `${Math.max(2, Math.round(nLaps * 0.4))}× ${2*P}m crawl un cran plus vite — repose 30" — tu dois sentir l'effort sans souffrir`,
              `Fin : ${P}m dos lent pour récupérer`,
            ],
          },
          {
            title: "Accélération progressive",
            intensity: "Facile → Modéré — monte en puissance",
            details: [
              `${Math.max(2, Math.round(nLaps * 0.35))}× ${2*P}m crawl lent — repose 25"`,
              `${Math.max(2, Math.round(nLaps * 0.35))}× ${2*P}m crawl rythme normal — repose 25"`,
              `${Math.max(1, Math.round(nLaps * 0.2))}× ${2*P}m crawl à fond (courtes) — repose 40"`,
              `Fin : ${P}m dos`,
            ],
          },
          {
            title: "Intervalles simples",
            intensity: "Modéré — effort, repos, effort",
            details: [
              `${Math.max(3, Math.round(nLaps * 0.5))}× ${2*P}m crawl — repose 40" — nage à une allure qui "pique" légèrement`,
              `${Math.max(2, Math.round(nLaps * 0.3))}× ${P}m dos — repose 20" — récupération active`,
              `Fin : ${P}m crawl lent`,
            ],
          },
        ][vd],
      };
    }

    // ── RÉGULIER : seuil simplifié, 8 variants progressifs ──────────────────
    if (isBeg) {
      const nLaps = Math.max(3, Math.round(dist / (2 * P)));
      const nS  = Math.max(3, Math.round(nLaps * 0.65));
      const nSp = Math.max(5, Math.round(nLaps * 0.70));
      const nT  = Math.max(2, Math.round(nLaps * 0.55));
      const vb  = (Math.floor(weekIdx / 10) * 3 + (weekIdx % 10)) % 8;
      return {
        type: "SEUIL",
        ...[
          {
            title: "Un cran au-dessus",
            intensity: "Modéré — effort qui pousse sans être à fond",
            details: [
              `Échauffement : ${2*P}m crawl lent + ${P}m dos`,
              `${nS}× ${2*P}m crawl — repose 30" — allure soutenue, tu dois sentir l'effort sans souffrir`,
              `${Math.max(1, Math.round(nLaps * 0.2))}× ${2*P}m dos — récup douce`,
              `Fin : ${P}m crawl très lent`,
            ],
          },
          {
            title: "Montée en puissance",
            intensity: "Progressif — chaque bloc plus fort que le précédent",
            details: [
              `${Math.max(2, Math.round(nLaps * 0.28))}× ${2*P}m crawl lent — repose 20"`,
              `${Math.max(2, Math.round(nLaps * 0.28))}× ${2*P}m crawl rythme normal — repose 25"`,
              `${Math.max(2, Math.round(nLaps * 0.25))}× ${2*P}m crawl soutenu — repose 35"`,
              `Fin : ${P}m très lent`,
            ],
          },
          {
            title: "Effort/récup alternés",
            intensity: "Modéré — sandwichs effort + récup",
            details: [
              `Échauffement : ${2*P}m crawl`,
              `Répète ${Math.max(3, Math.round(nLaps * 0.5))} fois : ${2*P}m crawl soutenu + ${P}m dos lent`,
              `${Math.max(1, Math.round(nLaps * 0.2))}× ${2*P}m crawl confort — récup finale`,
              `Fin : ${P}m dos`,
            ],
          },
          {
            title: "Longueurs rapides",
            intensity: "Vif — chaque longueur à 80% de ton max",
            details: [
              `Échauffement : ${2*P}m crawl tranquille`,
              `${nSp}× ${P}m crawl — repose 30" — pousse à chaque longueur, récup complète entre`,
              `${Math.max(2, Math.round(nLaps * 0.2))}× ${2*P}m dos — récup`,
              `Fin : ${P}m lent`,
            ],
          },
          {
            title: "Tempo continu",
            intensity: "Soutenu — même allure du début à la fin",
            details: [
              `Échauffement : ${2*P}m crawl lent`,
              `${nT}× ${3*P}m crawl à allure soutenue — repose 40" — garde le même rythme du 1er au dernier`,
              `${Math.max(1, Math.round(nLaps * 0.2))}× ${2*P}m dos — récup active`,
              `Fin : ${P}m crawl très lent`,
            ],
          },
          {
            title: "Pyramide soutenue",
            intensity: "Modéré — distances courtes à soutenu, longues à normal",
            details: [
              `Échauffement : ${2*P}m crawl`,
              `${P}m soutenu R25" · ${2*P}m normal R30" · ${3*P}m normal R35" · ${2*P}m soutenu R30" · ${P}m à fond R45"`,
              `${Math.max(1, Math.round(nLaps * 0.15))}× ${2*P}m dos — récup douce`,
              `Fin : ${P}m lent`,
            ],
          },
          {
            title: "Séries qui descendent",
            intensity: "Vif — chaque série un peu plus rapide",
            details: [
              `Échauffement : ${2*P}m crawl lent + ${P}m dos`,
              `${nS}× ${2*P}m crawl — repose 30" — vise 2" de mieux à chaque rep : 1re conservatrice, dernière à fond`,
              `${Math.max(1, Math.round(nLaps * 0.2))}× ${2*P}m dos — récup`,
              `Fin : ${P}m crawl très lent`,
            ],
          },
          {
            title: "Séances 100m — objectif constant",
            intensity: "Modéré/soutenu — même effort sur chaque 100m",
            details: [
              `Échauffement : ${2*P}m crawl + ${P}m dos`,
              `${Math.max(5, Math.round(nLaps * 0.65))}× ${2*P}m crawl — repose 25" — allure soutenue identique à chaque rep, note si tu tiens`,
              `${Math.max(1, Math.round(nLaps * 0.18))}× ${2*P}m dos — récup`,
              `Fin : ${P}m crawl lent`,
            ],
          },
        ][vb],
      };
    }

    // ── PERFORMANCE / EXPERT : seuil + 4 nages (piscine polyvalente uniquement) ──
    if (isAdv && shouldUsePoolIMBlock(goal)) {
      const vp = (Math.floor(weekIdx / 10) * 3 + (weekIdx % 10)) % 5;
      const WARM = 500, COOL = 200, avail = dist - WARM - COOL;
      const echu = `200m crawl + 100m dos + 100m brasse + 4×25m papillon — 20" récup`;
      const cssRep = Math.min(4*P, 200);
      const nCSS   = Math.max(6, Math.min(14, Math.floor(avail * 0.65 / cssRep)));
      const nFin   = Math.max(2, Math.min(6, Math.round(Math.max(0, avail - nCSS*cssRep) / (2*P))));
      const nBloc  = Math.max(3, Math.min(5,  Math.floor(avail * 0.60 / (4*cssRep))));
      const nSprSeuil = Math.max(4, Math.min(8, Math.round(avail * 0.30 / cssRep)));
      const nRecupIM  = Math.max(2, Math.min(4, Math.round(avail * 0.20 / (2*P))));
      const overRep   = Math.min(8*P, 400);
      const nOver     = Math.max(3, Math.min(6, Math.floor(avail * 0.65 / overRep)));
      return {
        type: "SEUIL",
        ...[
          {
            title: "CSS — allure critique",
            intensity: "Seuil — effort soutenu et constant",
            details: [
              `Échauffement : ${echu}`,
              `${nCSS}×${cssRep}m crawl — ${dep(cssRep, lvl, 'threshold')} — allure 1500m, régularité absolue`,
              `${nFin}×${2*P}m 4 nages — 15" récup — dos puis brasse en alternance`,
              `Retour calme : 200m dos lent`,
            ],
          },
          {
            title: "Pyramide seuil",
            intensity: "Intensité croissante puis décroissante",
            details: [
              `Échauffement : ${echu}`,
              `${2*P}–${4*P}–${6*P}–${4*P}–${2*P}m crawl — 20" récup entre paliers — allure seuil à chaque palier`,
              `${nRecupIM}×${4*P}m 4 nages (${P}m par nage) — 25" récup — récupération active`,
              `Retour calme : 200m dos lent`,
            ],
          },
          {
            title: "Blocs compétition",
            intensity: "Z4 — allure race, séries courtes",
            details: [
              `Échauffement : ${echu}`,
              `${nBloc}×(4×${cssRep}m crawl — 10" intra) — 1' entre blocs — allure compétition, régularité absolue`,
              `${nSprSeuil}×${P}m sprint — 45" récup — terminer par des sprints pour activer les fibres rapides`,
              `Retour calme : 200m dos lent`,
            ],
          },
          {
            title: "Séries descendantes",
            intensity: "Patient au départ, explosif à l'arrivée",
            details: [
              `Échauffement : ${echu}`,
              `${nCSS}×${cssRep}m crawl — ${dep(cssRep, lvl, 'threshold')} — vise −1 à 2s de mieux à chaque rep`,
              `${nFin}×${2*P}m dos — 15" récup — récup active entre les blocs`,
              `Retour calme : 200m dos lent`,
            ],
          },
          {
            title: "Over-distance seuil",
            intensity: "Légèrement sous le seuil — travaille la résistance",
            details: [
              `Échauffement : ${echu}`,
              `${nOver}×${overRep}m crawl — ${dep(overRep, lvl, 'threshold')} — distance supérieure à tes reps CSS, allure légèrement conservatrice`,
              `${nRecupIM}×${4*P}m 4 nages (${P}m par nage) — 25" récup — polyvalence active`,
              `Retour calme : 200m dos lent`,
            ],
          },
        ][vp],
      };
    }

    const isDiplomeS   = goal === "bnssa" || goal === "bpjeps_aan" || goal === "tests_pompiers" || goal === "caepmns";
    const isBNSSAS     = goal === "bnssa" || goal === "tests_pompiers" || goal === "caepmns";
    const isTriathlon  = isTriathlonGoal(goal);
    const isOpenWater  = isOpenWaterGoal(goal);

    const vp  = (Math.floor(weekIdx / 10) * 3 + (weekIdx % 10)) % 5;
    const r2S = Math.min(8*P,  200);
    const r3S = Math.min(12*P, 300);
    const nR2S   = Math.max(4, Math.min(10, Math.round(dist * 0.60 / r2S)));
    const nR3S   = Math.max(3, Math.min(8,  Math.round(dist * 0.60 / r3S)));
    const nFillS = Math.max(2, Math.min(8,  Math.round(dist * 0.15 / (2*P))));

    // ── DIPLÔME — séances orientées examen ──────────────────────────────
    if (isDiplomeS) {
      const n400S = Math.max(2, Math.min(5, Math.round(dist * 0.60 / 400)));
      const n100S = Math.max(4, Math.min(10, Math.round(dist * 0.55 / 100)));
      const n4N   = Math.max(3, Math.round(dist * 0.55 / (4*P)));
      return {
        type: "SEUIL",
        ...[
          {
            title: isBNSSAS ? "Effort soutenu — allure 100m exam" : "Séries 400m — allure exam",
            intensity: isBNSSAS ? "Soutenu — objectif < 1'35\" sur 100m" : "Soutenu — vise < 7'40\" sur 400m",
            details: isBNSSAS ? [
              `Échauffement : 200m crawl + 100m dos + 4×25m accélérations`,
              `${n100S}×100m NL — R30" — allure soutenue, objectif exam < 1'35" à chaque rep`,
              `${nFillS}×${2*P}m dos — R15" — récup active`,
              `Retour calme : 200m dos lent`,
            ] : [
              `Échauffement : 200m crawl + 100m dos + 4×25m accélérations`,
              `${n400S}×400m NL — R1'30" — allure cible exam : ≈ 1'55"/100m, régularité absolue`,
              `${nFillS}×${2*P}m dos — R15" — récup active`,
              `Retour calme : 200m dos lent`,
            ],
          },
          {
            title: isBNSSAS ? "Pyramide 50→100→50m" : "Pyramide 100→200→300→200→100m",
            intensity: "Effort soutenu à chaque palier",
            details: isBNSSAS ? [
              `Échauffement : 200m crawl + 100m dos`,
              `50m NL R20" — 100m NL R30" — 50m NL R20" — ×${Math.max(2, Math.round((dist - 300) / 200))} — même effort par palier`,
              `${nFillS}×${2*P}m dos — R15"`,
              `Retour calme : 200m dos lent`,
            ] : [
              `Échauffement : 200m crawl + 100m dos`,
              `100m – 200m – 300m – 200m – 100m NL — R20" entre paliers — allure soutenue à chaque palier`,
              `${nFillS}×${2*P}m dos — R15"`,
              `Retour calme : 200m dos lent`,
            ],
          },
          {
            title: isBNSSAS ? "Blocs intenses — récup active" : "Blocs à allure soutenue",
            intensity: "Effort net — inconfortable mais contrôlé",
            details: isBNSSAS ? [
              `Échauffement : 200m crawl + 100m dos + 4×25m sprints`,
              `${n100S}×100m NL — R25" — effort soutenu, maintiens sur toutes les reps`,
              `${nFillS}×${2*P}m dos — R20" — récup active`,
              `Retour calme : 200m dos lent`,
            ] : [
              `Échauffement : 200m crawl + 100m dos + 4×25m accélérations`,
              `${nR2S}×${r2S}m NL — R20" — allure soutenue, effort maintenu sur toutes les reps`,
              `${nFillS}×${2*P}m dos — R20" — récup active`,
              `Retour calme : 200m dos lent`,
            ],
          },
          {
            title: isBNSSAS ? "Séries descendantes — 100m" : "Séries descendantes",
            intensity: "Patient au départ, plus fort à la fin",
            details: isBNSSAS ? [
              `Échauffement : 200m crawl + 100m dos + 4×25m accélérations`,
              `${n100S}×100m NL — R25" — vise 2" de mieux à chaque rep : 1re conservatrice, dernière à fond`,
              `${nFillS}×${2*P}m dos — R15"`,
              `Retour calme : 200m dos lent`,
            ] : [
              `Échauffement : 200m crawl + 100m dos + 4×25m accélérations`,
              `${nR2S}×${r2S}m NL — R20" — vise 2" de mieux à chaque rep : 1re conservatrice, dernière à fond`,
              `${nFillS}×${2*P}m dos — R15"`,
              `Retour calme : 200m dos lent`,
            ],
          },
          {
            title: isBNSSAS ? "4 nages soutenu" : "Blocs 4 nages — seuil polyvalent",
            intensity: "Effort soutenu toutes nages",
            details: [
              `Échauffement : 200m crawl + 100m dos`,
              `${n4N}×${4*P}m 4 nages (${P}m par nage) — R30" — allure soutenue à chaque nage`,
              `${nFillS}×${2*P}m dos — R15"`,
              `Retour calme : 200m dos lent`,
            ],
          },
        ][vp],
      };
    }

    // ── NAGER & PROGRESSER / TRIATHLON / EAU LIBRE ──────────────────────
    const goalCueS = isTriathlon
      ? " — allure nage triathlon, régularité absolue"
      : isOpenWater
        ? " — respiration bilatérale, même effort de bout en bout"
        : "";
    const vpGS = (Math.floor(weekIdx / 10) * 3 + (weekIdx % 10)) % 8;
    const nR2Sb = Math.max(3, Math.min(8, Math.round(dist * 0.55 / r2S)));
    const nR3Sb = Math.max(2, Math.min(6, Math.round(dist * 0.55 / r3S)));
    const r1S   = Math.min(4*P, 100);

    return {
      type: "SEUIL",
      ...[
        {
          title: "Séries à allure soutenue",
          intensity: "Effort soutenu — inconfortable mais contrôlé",
          details: [
            `Échauffement : 200m crawl + 100m dos + 4×25m accélérations`,
            `${nR2S}×${r2S}m crawl — R20" — allure soutenue, chaque rep identique${goalCueS}`,
            `${nFillS}×${2*P}m dos — R15" — récup active`,
            `Retour calme : 200m dos lent`,
          ],
        },
        {
          title: "Pyramide seuil",
          intensity: "Effort croissant puis décroissant",
          details: [
            `Échauffement : 200m crawl + 100m dos`,
            `${r1S}m – ${r2S}m – ${r3S}m – ${r2S}m – ${r1S}m crawl — R20" entre paliers — soutenu à chaque palier`,
            `${nFillS}×${2*P}m dos — R15" — récup active`,
            `Retour calme : 200m dos lent`,
          ],
        },
        {
          title: "Tiens sur la distance",
          intensity: "Endurance soutenue — même rythme de bout en bout",
          details: [
            `Échauffement : 200m crawl + 100m dos + 4×25m accélérations`,
            `${nR3S}×${r3S}m crawl — R20" — allure soutenue, identique du 1er au dernier${goalCueS}`,
            `${nFillS}×${2*P}m dos — R20" — récup active`,
            `Retour calme : 200m dos lent`,
          ],
        },
        {
          title: "Séries descendantes",
          intensity: "Patient au départ — plus fort rep après rep",
          details: [
            `Échauffement : 200m crawl + 100m dos + 4×25m accélérations`,
            `${nR2S}×${r2S}m crawl — R20" — vise 2" de mieux à chaque rep : 1re conservatrice, dernière à fond`,
            `${nFillS}×${2*P}m dos — R15" — récup active`,
            `Retour calme : 200m dos lent`,
          ],
        },
        {
          title: isOpenWater ? "Blocs eau libre — effort continu" : "Récup courte — corps qui enchaîne",
          intensity: "Endurance soutenue — récup courte",
          details: [
            `Échauffement : 200m crawl + 100m dos`,
            isOpenWater
              ? `${nR3S}×${r3S}m NL — R15" — soutenu de bout en bout, respiration bilatérale régulière`
              : `${nR3S}×${r3S}m crawl — R15" — effort soutenu, récup courte : ton corps s'adapte à enchaîner`,
            `${nFillS}×${2*P}m dos — R20"`,
            `Retour calme : 200m dos lent`,
          ],
        },
        {
          title: "3 blocs — chaque bloc plus fort",
          intensity: "Progressif — soutenu qui monte",
          details: [
            `Échauffement : 200m crawl + 100m dos`,
            `Bloc 1 : ${nR3Sb}×${r3S}m crawl — R25" — allure confortable soutenue`,
            `Bloc 2 : ${nR2Sb}×${r2S}m crawl — R20" — monte d'un cran`,
            `Bloc 3 : ${Math.max(2, Math.round(nR2Sb * 0.7))}×${r2S}m crawl — R15" — soutenu, tiens jusqu'au bout`,
            `Retour calme : 200m dos lent`,
          ],
        },
        {
          title: isTriathlon ? "Simulation allure triathlon" : "Tempo 3×5 minutes",
          intensity: isTriathlon ? "Race-sim — reproduis l'effort de compétition" : "Soutenu continu — 3 blocs de 5 min",
          details: isTriathlon ? [
            `Échauffement : 200m crawl + 100m dos + 4×25m accélérations`,
            `3×(${Math.max(2, Math.round(dist * 0.18 / r3S))}×${r3S}m crawl — R15") — 1'30" entre blocs — allure race, régularité absolue`,
            `${nFillS}×${2*P}m dos — R15"`,
            `Retour calme : 200m dos lent`,
          ] : [
            `Échauffement : 200m crawl + 100m dos`,
            `3 blocs de 5' de nage continue à allure soutenue — récup 1'30" entre blocs — même allure sur les 3`,
            `${nFillS}×${2*P}m dos — R20"`,
            `Retour calme : 200m dos lent`,
          ],
        },
        isOpenWater ? {
          title: "Seuil crawl — allure tenue",
          intensity: "Soutenu — prépa eau libre en bassin",
          details: [
            `Échauffement : 200m crawl + 100m dos + 4×${P}m accélérations`,
            `${nR2S}×${r2S}m crawl — ${dep(r2S, lvl, 'threshold')} — allure tenue, sighting tous les 8 bras`,
            `${nFillS}×${2*P}m dos — R20"`,
            `Retour calme : 200m dos lent`,
          ],
        } : {
          title: "Seuil 4 nages — polyvalence",
          intensity: "Soutenu toutes nages — crawl, dos, brasse en rotation",
          details: [
            `Échauffement : 200m crawl + 100m dos`,
            `${Math.max(3, Math.round(dist * 0.55 / (4*P)))}×${4*P}m IM (${P}m crawl + ${P}m dos + ${P}m brasse + ${P}m crawl) — R30" — soutenu à chaque nage`,
            `${nFillS}×${2*P}m dos — R20"`,
            `Retour calme : 200m dos lent`,
          ],
        },
      ][vpGS],
    };
  },

  // ── VITESSE ──────────────────────────────────────────────────────────────
  // 5 variants par niveau
  vitesse: (dist, pool, level = "intermediate", weekIdx = 0, goal = "") => {
    const isDecouverte = level === "découverte";
    const isBeg = level === "beginner" || level === "régulier" || isDecouverte;
    const isAdv = level === "advanced" || level === "performance";
    const P = pool, lvl = getLvlIndex(level);
    const v = (Math.floor(weekIdx / 10) * 3 + (weekIdx % 10)) % 5;

    // ── DÉCOUVERTE : "sprints ludiques", courtes longueurs fun ───────────
    if (isDecouverte) {
      const nLaps = Math.max(2, Math.round(dist / (2 * P)));
      const vd = weekIdx % 3;
      return {
        type: "VITESSE",
        ...[
          {
            title: "Course contre toi-même",
            intensity: "Fun — sprint sur une longueur, récup complète",
            details: [
              `${Math.max(2, Math.round(nLaps * 0.35))}× ${2*P}m crawl lent — repose 20" — mise en jambes`,
              `${Math.max(4, Math.round(nLaps * 0.4))}× ${P}m sprint (une longueur à fond) — repose 45" — qualité, pas quantité`,
              `Fin : ${2*P}m dos calme`,
            ],
          },
          {
            title: "Accélérations fun",
            intensity: "Modéré → rapide — décollage sur chaque longueur",
            details: [
              `${Math.max(2, Math.round(nLaps * 0.3))}× ${2*P}m crawl tranquille — repose 25"`,
              `${Math.max(4, Math.round(nLaps * 0.5))}× ${2*P}m : 1re longueur normale + 2e longueur à fond — repose 40"`,
              `Fin : ${P}m dos pour souffler`,
            ],
          },
          {
            title: "Départ aux murs",
            intensity: "Fun — explosivité au départ de chaque longueur",
            details: [
              `${Math.max(2, Math.round(nLaps * 0.3))}× ${2*P}m crawl pour te chauffer`,
              `${Math.max(4, Math.round(nLaps * 0.45))}× ${P}m : pousse fort du mur + nage à fond — repose 40" — visualise que tu dépasses quelqu'un`,
              `${Math.max(2, Math.round(nLaps * 0.2))}× ${2*P}m dos calme — récupération`,
            ],
          },
        ][vd],
      };
    }

    // ── RÉGULIER : 8 variants de vitesse, fun et accessibles ───────────────
    if (isBeg) {
      const nLaps = Math.max(4, Math.round(dist / (2 * P)));
      const nSpr  = Math.max(4, Math.round(nLaps * 0.45));
      const nAcc  = Math.max(4, Math.round(nLaps * 0.50));
      const vb    = (Math.floor(weekIdx / 10) * 3 + (weekIdx % 10)) % 8;
      return {
        type: "VITESSE",
        ...[
          {
            title: "Accélérations fun",
            intensity: "Modéré → rapide — décollage sur la 2e longueur",
            details: [
              `${Math.max(2, Math.round(nLaps * 0.25))}× ${2*P}m crawl tranquille — mise en jambes`,
              `${nAcc}× ${2*P}m : 1re longueur normale + 2e longueur à fond — repose 40" — sens la différence`,
              `Fin : ${Math.max(2, Math.round(nLaps * 0.2))}× ${2*P}m dos calme`,
            ],
          },
          {
            title: "Course contre toi-même",
            intensity: "Fun — sprint une longueur, récup complète",
            details: [
              `${Math.max(2, Math.round(nLaps * 0.3))}× ${2*P}m crawl lent — mise en jambes`,
              `${nSpr}× ${P}m sprint à fond — repose 45" — qualité, pas quantité`,
              `Fin : ${Math.max(2, Math.round(nLaps * 0.2))}× ${2*P}m dos calme`,
            ],
          },
          {
            title: "Départ aux murs",
            intensity: "Fun — explosivité sur chaque départ",
            details: [
              `${Math.max(2, Math.round(nLaps * 0.28))}× ${2*P}m crawl tranquille`,
              `${nSpr}× ${P}m : pousse fort du mur + nage à fond — repose 40" — visualise que tu dépasses quelqu'un`,
              `${Math.max(2, Math.round(nLaps * 0.2))}× ${2*P}m dos calme`,
            ],
          },
          {
            title: "Sprints crawl & dos",
            intensity: "Varié — aller vite dans les deux nages",
            details: [
              `${Math.max(2, Math.round(nLaps * 0.25))}× ${2*P}m crawl tranquille`,
              `${Math.max(3, Math.round(nLaps * 0.32))}× ${P}m crawl sprint — repose 40"`,
              `${Math.max(3, Math.round(nLaps * 0.32))}× ${P}m dos sprint — repose 40" — bras larges, propulsion max`,
              `Fin : ${P}m crawl lent`,
            ],
          },
          {
            title: "Jeu de rythme",
            intensity: "Ludique — alterne lent et rapide",
            details: [
              `${Math.max(2, Math.round(nLaps * 0.25))}× ${2*P}m crawl doux`,
              `${Math.max(4, Math.round(nLaps * 0.52))}× ${2*P}m : 1re moitié lente + 2e moitié sprint — repose 35"`,
              `Fin : ${Math.max(2, Math.round(nLaps * 0.15))}× ${2*P}m dos calme`,
            ],
          },
          {
            title: "Pyramide de vitesse",
            intensity: "Progressif — plus c'est court, plus c'est vite",
            details: [
              `${Math.max(2, Math.round(nLaps * 0.25))}× ${2*P}m crawl tranquille`,
              `${Math.max(2, Math.round(nLaps * 0.25))}× ${2*P}m crawl vif — repose 35"`,
              `${Math.max(3, Math.round(nLaps * 0.30))}× ${P}m crawl sprint — repose 40"`,
              `Fin : ${Math.max(2, Math.round(nLaps * 0.18))}× ${2*P}m dos calme`,
            ],
          },
          {
            title: "Ton chrono perso",
            intensity: "Compétition avec toi-même — note et bats ton record",
            details: [
              `${Math.max(2, Math.round(nLaps * 0.3))}× ${2*P}m crawl pour te chauffer`,
              `${Math.max(3, Math.round(nLaps * 0.4))}× ${2*P}m crawl à fond — repose 1' — chronomètre chaque rep, essaie de faire mieux que la précédente`,
              `Fin : ${Math.max(2, Math.round(nLaps * 0.15))}× ${2*P}m dos très lent`,
            ],
          },
          {
            title: "Sprint-récup-sprint",
            intensity: "Explosif — effort max, récup dos, rebelote",
            details: [
              `${Math.max(2, Math.round(nLaps * 0.25))}× ${2*P}m crawl tranquille`,
              `Répète ${Math.max(4, Math.round(nLaps * 0.4))} fois : ${P}m sprint à fond + ${P}m dos lent — repose 20" après chaque paire`,
              `Fin : ${P}m crawl très lent`,
            ],
          },
        ][vb],
      };
    }

    // ── PERFORMANCE / EXPERT : vitesse + 4 nages (piscine polyvalente uniquement) ──
    if (isAdv && shouldUsePoolIMBlock(goal)) {
      const vp = (Math.floor(weekIdx / 10) * 3 + (weekIdx % 10)) % 5;
      const WARM = 500, COOL = 200, avail = dist - WARM - COOL;
      const echu = `200m crawl + 100m dos + 100m brasse + 4×25m papillon — 20" récup`;
      const nSpr   = Math.max(6, Math.min(12, Math.round(avail * 0.55 / P)));
      const nIM4   = Math.max(4, Math.min(10, Math.floor(avail * 0.50 / (2*P))));
      const nSpr4  = Math.max(4, Math.min(8,  Math.round(avail * 0.30 / P)));
      const nPap   = Math.max(4, Math.min(8,  Math.round(avail * 0.25 / P)));
      const nBuild = Math.max(4, Math.min(10, Math.floor(avail * 0.55 / (2*P))));
      const nRecup = Math.max(2, Math.min(6,  Math.round(avail * 0.20 / (2*P))));
      return {
        type: "VITESSE",
        ...[
          {
            title: "Sprints maximaux",
            intensity: "Sprint total — récup complète",
            details: [
              `Échauffement : ${echu}`,
              `${nSpr}×${P}m sprint crawl — R1' — qualité absolue, chaque longueur comme si c'était la seule`,
              `${nRecup}×${2*P}m dos + brasse alternance — 20" récup — récupération active`,
              `Retour calme : 200m dos lent`,
            ],
          },
          {
            title: "Vitesse 4 nages",
            intensity: "Explosivité — toutes nages en rotation",
            details: [
              `Échauffement : ${echu}`,
              `${nIM4}×${2*P}m en rotation dos · brasse · crawl — 40" récup — 1 nage par rep, sprint à chaque`,
              `${nPap}×${P}m papillon — R2' — ondulation hanches, récup complète, qualité absolue`,
              `Retour calme : 200m dos lent`,
            ],
          },
          {
            title: "Puissance 4 nages",
            intensity: "Puissance — palettes + sprint mains nues",
            details: [
              `Échauffement : ${echu}`,
              `${nIM4}×${2*P}m palettes + pull buoy — 20" récup — coude haut, pression max sur les paumes`,
              `${nSpr4}×${P}m sprint mains nues — R1' — reproduis la prise d'eau des palettes, engage l'avant-bras`,
              `Retour calme : 200m dos lent`,
            ],
          },
          {
            title: "Accélérations construites",
            intensity: "Montée en puissance progressive",
            details: [
              `Échauffement : ${echu}`,
              `${nBuild}×${2*P}m crawl — ${dep(2*P, lvl, 'threshold')} — 1re moitié Z2, 2e moitié accélère à 95%`,
              `${nSpr4}×${P}m sprint 4 nages rotation — R1' — 1 nage par sprint, rotation complète`,
              `Retour calme : 200m dos lent`,
            ],
          },
          {
            title: "Départs & explosivité",
            intensity: "Z5/Z6 — explosivité maximale",
            details: [
              `Échauffement : ${echu}`,
              `${nPap}×${P}m papillon — R2' — ondulation pure, 3 coups de bras max, stop si la forme se dégrade`,
              `${nSpr}×${P}m sprint crawl départ mur — R1' — pousse fort, torpille gainée, 3 premiers bras à fond`,
              `Retour calme : 200m dos lent`,
            ],
          },
        ][vp],
      };
    }

    const isDiplomeV   = goal === "bnssa" || goal === "bpjeps_aan" || goal === "tests_pompiers" || goal === "caepmns";
    const isBNSSAV     = goal === "bnssa" || goal === "tests_pompiers" || goal === "caepmns";
    const isTriathlonV = isTriathlonGoal(goal);
    const isOpenWaterV = isOpenWaterGoal(goal);

    const WARMV = 300, COOLV = 200, availV = dist - WARMV - COOLV;
    const nSprV = Math.max(6, Math.min(10, Math.round(availV * 0.5 / P)));
    const nSecV = Math.max(2, Math.min(8,  Math.round(Math.max(0, availV - nSprV*P) / (2*P))));
    const nBldV = Math.max(4, Math.min(10, Math.floor(availV * 0.6 / (2*P))));
    const nKckV = Math.max(2, Math.min(8,  Math.round(Math.max(0, availV - nBldV*(2*P)) / (2*P))));
    const n4NV  = Math.max(4, Math.round(availV * 0.45 / (4*P)));

    // ── DIPLÔME — séances orientées examen ──────────────────────────────
    if (isDiplomeV) {
      const n50V  = Math.max(6, Math.min(14, Math.round(availV * 0.5 / P)));
      const n100V = Math.max(4, Math.min(10, Math.round(availV * 0.5 / (2*P))));
      return {
        type: "VITESSE",
        ...[
          {
            title: isBNSSAV ? "Sprints 50m — construis ta vitesse" : "Accélérations — vitesse sur 100m",
            intensity: isBNSSAV ? "Sprint — qualité sur chaque longueur" : "Allure rapide — vise < 1'55\"/100m",
            details: isBNSSAV ? [
              `Échauffement : 200m crawl + 100m dos + 4×25m sprints`,
              `${n50V}×${P}m sprint crawl — R1' — effort max à chaque longueur, récup complète`,
              `${nSecV}×${2*P}m dos — R20" — récup active`,
              `Retour calme : 200m dos lent`,
            ] : [
              `Échauffement : 200m crawl + 100m dos + 4×25m accélérations`,
              `${n100V}×${2*P}m NL soutenu — R1' — effort fort sur chaque rep, récup complète`,
              `${nSecV}×${2*P}m dos — R20" — récup active`,
              `Retour calme : 200m dos lent`,
            ],
          },
          {
            title: isBNSSAV ? "Accélérations progressives" : "Montée en vitesse",
            intensity: "Arrive plus vite que tu n'es parti",
            details: isBNSSAV ? [
              `Échauffement : 200m crawl + 100m dos + 4×25m accélérations`,
              `${n50V}×${P}m crawl — R45" — 1re moitié modérée, 2e moitié à fond`,
              `${nSecV}×${2*P}m dos — R20"`,
              `Retour calme : 200m dos lent`,
            ] : [
              `Échauffement : 200m crawl + 100m dos + 4×25m accélérations`,
              `${nBldV}×${2*P}m NL — R45" — 1re moitié soutenue, 2e moitié à fond`,
              `${nKckV}×${2*P}m dos — R20" — récup active`,
              `Retour calme : 200m dos lent`,
            ],
          },
          {
            title: isBNSSAV ? "Départs eau + sprint" : "Vitesse 4 nages",
            intensity: isBNSSAV ? "Explosivité départ" : "Sprint toutes nages",
            details: isBNSSAV ? [
              `Échauffement : 200m crawl + 100m dos + 4×25m sprints`,
              `Départs eau : pousse le mur, torpille 3m, sprint ${P}m — R1'30" — ×${n50V} — qualité de départ`,
              `${nSecV}×${2*P}m dos — R20"`,
              `Retour calme : 200m dos lent`,
            ] : [
              `Échauffement : 200m crawl + 100m dos + 50m jambes`,
              `${n4NV}×${4*P}m 4 nages (${P}m par nage) — R30" — vite à chaque nage, récup complète`,
              `${nSprV}×${P}m sprint crawl — R1' — qualité absolue`,
              `Retour calme : 200m dos lent`,
            ],
          },
          {
            title: isBNSSAV ? "100m chrono — test exam" : "Blocs vitesse — effort total",
            intensity: isBNSSAV ? "Effort maximal — chrono" : "Sprint répété — récup complète",
            details: isBNSSAV ? [
              `Échauffement : 200m crawl + 100m dos + 4×25m accélérations`,
              `${n100V}×100m NL — R1' — effort max, note chaque chrono, objectif < 1'35"`,
              `Retour calme : 200m dos lent`,
            ] : [
              `Échauffement : 200m crawl + 100m dos + 4×25m accélérations`,
              `${nSprV}×${P}m sprint — R1' — effort total à chaque longueur, récup complète`,
              `${nSecV}×${2*P}m dos — R20" — récup active`,
              `Retour calme : 200m dos lent`,
            ],
          },
          {
            title: isBNSSAV ? "Sprints + 4 nages" : "Explosivité & relâche",
            intensity: "Vitesse et polyvalence",
            details: isBNSSAV ? [
              `Échauffement : 200m crawl + 100m dos + 4×25m sprints`,
              `${n50V}×${P}m sprint crawl — R1' — qualité, pas quantité`,
              `${Math.max(2, Math.round(availV * 0.25 / (4*P)))}×${4*P}m 4 nages — R30" — transition rapide entre nages`,
              `Retour calme : 200m dos lent`,
            ] : [
              `Échauffement : 200m crawl + 100m dos + 4×25m accélérations`,
              `${nSprV}×${P}m sprint crawl — R1' — pousse fort le mur, 1ers bras à fond`,
              `${nSecV}×${2*P}m NL lent — R20" — récup totale entre les sprints`,
              `Retour calme : 200m dos lent`,
            ],
          },
        ][v],
      };
    }

    // ── NAGER & PROGRESSER / TRIATHLON / EAU LIBRE ──────────────────────
    const goalCueV = isTriathlonV
      ? " — simule ton départ de compétition, bras à fond dès la 1re foulée"
      : isOpenWaterV
        ? " — explosivité de départ, enclenche tes bras rapidement"
        : "";
    const vG = (Math.floor(weekIdx / 10) * 3 + (weekIdx % 10)) % 8;

    return {
      type: "VITESSE",
      ...[
        {
          title: "Sprints — récup complète",
          intensity: "Sprint — qualité absolue",
          details: [
            `Échauffement : 200m crawl + 100m dos + 4×25m accélérations`,
            `${nSprV}×${P}m sprint crawl — R1' — effort total à chaque longueur${goalCueV}`,
            `${nSecV}×${2*P}m dos — R20" — récup active`,
            `Retour calme : 200m dos lent`,
          ],
        },
        {
          title: "Accélérations progressives",
          intensity: "Montée en puissance sur chaque rep",
          details: [
            `Échauffement : 200m crawl + 100m dos + 4×25m accélérations`,
            `${nBldV}×${2*P}m crawl — R45" — 1re moitié soutenue, 2e moitié à fond`,
            `${nKckV}×${2*P}m dos — R20" — récup active`,
            `Retour calme : 200m dos lent`,
          ],
        },
        {
          title: isTriathlonV ? "Sprints sortie eau — transition" : "Vitesse + récup dos",
          intensity: isTriathlonV ? "Explosivité transition" : "Sprint + récupération active",
          details: [
            `Échauffement : 200m crawl + 100m dos + 4×25m sprints`,
            isTriathlonV
              ? `${nSprV}×${P}m sprint crawl — R1' — simule ta sortie eau : bras à fond sans hésiter au départ`
              : `${nSprV}×${P}m sprint crawl — R1' — qualité absolue`,
            `${nSecV}×${2*P}m dos — R20" — récup active en nageant`,
            `Retour calme : 200m dos lent`,
          ],
        },
        {
          title: "Vitesse 4 nages",
          intensity: "Explosivité — toutes nages en rotation",
          details: [
            `Échauffement : 200m crawl + 100m dos + 50m jambes`,
            `${n4NV}×${4*P}m 4 nages (${P}m par nage) — R30" — sprint à chaque nage`,
            `${nSprV}×${P}m sprint crawl — R1' — qualité totale`,
            `Retour calme : 200m dos lent`,
          ],
        },
        {
          title: isOpenWaterV ? "Départs — eau libre" : "Départs & explosivité",
          intensity: "Explosivité maximale",
          details: [
            `Échauffement : 200m crawl + 100m dos + 4×25m accélérations`,
            isOpenWaterV
              ? `${nSprV}×${P}m sprint NL — R1'30" — pousse fort le mur, enchaîne les premiers bras sans hésitation`
              : `${nSprV}×${P}m sprint crawl départ mur — R1' — pousse fort, torpille gainée, 1ers bras à fond`,
            `${nSecV}×${2*P}m dos — R20" — récup active`,
            `Retour calme : 200m dos lent`,
          ],
        },
        {
          title: "Séries descendantes",
          intensity: "Chaque rep plus rapide — progressif jusqu'au max",
          details: [
            `Échauffement : 200m crawl + 100m dos + 4×25m accélérations`,
            `${nSprV}×${P}m crawl — R1' — vise 1" de mieux à chaque rep : 1re à ~80%, dernière à fond`,
            `${nSecV}×${2*P}m dos — R20" — récup active`,
            `Retour calme : 200m dos lent`,
          ],
        },
        {
          title: isTriathlonV ? "Simulation départ triathlon" : "Sprint-dos-sprint",
          intensity: isTriathlonV ? "Race-sim — explosivité de compétition" : "Explosif — récup dos entre sprints",
          details: isTriathlonV ? [
            `Échauffement : 200m crawl + 100m dos + 4×25m accélérations`,
            `3×(${Math.max(2, Math.round(availV * 0.15 / P))}×${P}m sprint — R1') — 2' entre blocs — simule tes 3 départs de compétition`,
            `${nSecV}×${2*P}m dos — R20"`,
            `Retour calme : 200m dos lent`,
          ] : [
            `Échauffement : 200m crawl + 100m dos + 4×25m accélérations`,
            `Répète ${Math.max(4, Math.round(availV * 0.45 / (3*P)))} fois : ${P}m sprint crawl R45" + ${P}m dos lent + ${P}m sprint crawl R45"`,
            `${nSecV}×${2*P}m dos — R20" — récup`,
            `Retour calme : 200m dos lent`,
          ],
        },
        {
          title: "Vitesse & puissance bras",
          intensity: "Puissance — palettes puis mains nues",
          details: [
            `Échauffement : 200m crawl + 100m dos + 4×25m sprints`,
            `${Math.max(3, Math.round(availV * 0.40 / (2*P)))}×${2*P}m palettes + pull buoy — R25" — coude haut, pression max, sens la portance`,
            `${nSprV}×${P}m sprint mains nues — R1' — reproduis la prise des palettes, engage l'avant-bras`,
            `Retour calme : 200m dos lent`,
          ],
        },
      ][vG],
    };
  },

  // ── TECHNIQUE ────────────────────────────────────────────────────────────
  // Découverte : 5 variants simples | Beginner : 5 variants | Inter/Adv : 5 variants
  technique: (dist, pool, level = "intermediate", weekIdx = 0, goal = "") => {
    const isDecouverte = level === "découverte";
    const isBeg = level === "beginner" || level === "régulier" || isDecouverte;
    const isAdv = level === "advanced" || level === "performance";
    const P = pool, lvl = getLvlIndex(level);

    // ── DÉCOUVERTE : observations simples, pas de drill complexe ─────────
    if (isDecouverte) {
      const nLaps = Math.max(2, Math.round(dist / (2 * P)));
      const vd = (Math.floor(weekIdx / 6) * 3 + (weekIdx % 6)) % 5;
      return {
        type: "TECHNIQUE",
        ...[
          {
            title: "Compte tes bras",
            intensity: "Très facile — observe ta nage",
            details: [
              `${Math.max(2, Math.round(nLaps * 0.4))}× ${2*P}m crawl — repose 20" — compte le nombre de bras par longueur`,
              `Note ton chiffre. Essaie maintenant de faire 2 bras de moins par longueur en allant aussi vite`,
              `${Math.max(2, Math.round(nLaps * 0.35))}× ${2*P}m en visant ce nouveau chiffre — repose 25"`,
              `Fin : ${P}m dos lent`,
            ],
          },
          {
            title: "Jambes à fond",
            intensity: "Facile — travail des jambes mains en flèche",
            details: [
              `${Math.max(2, Math.round(nLaps * 0.35))}× ${2*P}m crawl pour te chauffer — repose 20"`,
              `${Math.max(3, Math.round(nLaps * 0.45))}× ${2*P}m jambes seules mains en flèche — repose 25" — bras tendus autour des oreilles, pieds pointés, fouet des chevilles`,
              `${Math.max(1, Math.round(nLaps * 0.2))}× ${2*P}m crawl complet — sens si tes jambes te poussent mieux`,
              `Fin : ${P}m dos`,
            ],
          },
          {
            title: "La coulée magique",
            intensity: "Facile — profite de chaque poussée de mur",
            details: [
              `${Math.max(2, Math.round(nLaps * 0.3))}× ${2*P}m crawl — repose 20"`,
              `${Math.max(3, Math.round(nLaps * 0.45))}× ${2*P}m : pousse fort du mur + glisse 3 secondes avant de nager — repose 25"`,
              `Tu vas sentir que tu avances plus vite quand tu te laisses glisser`,
              `Fin : ${P}m dos`,
            ],
          },
          {
            title: "Respire mieux",
            intensity: "Facile — coordination bras/respiration",
            details: [
              `${Math.max(2, Math.round(nLaps * 0.35))}× ${2*P}m crawl — essaie d'expirer sous l'eau (bulles), inspirer au virage`,
              `Repose 25" entre chaque — c'est normal si c'est nouveau, ça demande de la pratique`,
              `${Math.max(2, Math.round(nLaps * 0.35))}× ${2*P}m dos — repose 20" — tu peux respirer librement, profites-en`,
              `Fin : ${P}m de ton choix`,
            ],
          },
          {
            title: "Nage sur le dos",
            intensity: "Très facile — exploration du dos crawlé",
            details: [
              `${Math.max(2, Math.round(nLaps * 0.35))}× ${2*P}m crawl lent — repose 20"`,
              `${Math.max(3, Math.round(nLaps * 0.45))}× ${2*P}m dos crawlé — repose 25" — regard au plafond, une épaule sort de l'eau à chaque bras`,
              `${Math.max(1, Math.round(nLaps * 0.2))}× ${2*P}m dos plat (bras le long du corps, jambes) — flottaison pure`,
              `Fin : ${P}m crawl tranquille`,
            ],
          },
        ][vd],
      };
    }

    const repR = 2*P;
    const WARM = 2*repR, COOL = repR, avail = dist - WARM - COOL;
    const nPerBlock = Math.max(3, Math.min(8, Math.round(avail / (4*repR))));
    const nInteg    = Math.min(8, Math.max(2, Math.round(Math.max(0, avail - 3*nPerBlock*repR) / repR)));
    const rot = (n) => (Math.floor(weekIdx / 10) * 3 + (weekIdx % 10)) % n;

    // ── DÉBUTANT (7 variants — ~90% éducatif) ────────────────────────────
    if (isBeg) {
      const v = rot(7);
      return {
        type: "TECHNIQUE",
        ...[
          {
            title: "Un bras — allongement et prise d'eau",
            intensity: "Facile — isolation d'un bras, allongement maximal",
            details: [
              `Échauffement : ${repR}m NL très lent + ${repR}m dos lent`,
              `${nPerBlock}×${repR}m un bras gauche — R15" — bras droit tendu devant, tire uniquement le gauche jusqu'à la cuisse puis reviens en avant, 6 battements entre chaque traction`,
              `${nPerBlock}×${repR}m un bras droit — R15" — même exercice côté droit`,
              `${nInteg}×${repR}m NL complet — R10" — retrouve l'allongement à chaque entrée de main, attends que le bras avant soit bien tendu`,
              `Retour au calme : ${repR}m dos très lent`,
            ],
          },
          {
            title: "Flèche jambes — tuba frontal",
            intensity: "Facile — battements en position flèche",
            details: [
              `Échauffement : ${repR}m NL très lent + ${repR}m dos lent`,
              `${nPerBlock}×${repR}m tuba frontal + bras en flèche — R15" — jambes seules, corps à plat, talons à la surface, expire régulièrement dans le tuba`,
              `${nPerBlock}×${repR}m tuba frontal + flèche + palmes — R15" — ajoute les palmes, ressens la propulsion des jambes`,
              `${nInteg}×${repR}m NL complet — R10" — garde le rythme de jambes actif, corps à plat`,
              `Retour au calme : ${repR}m dos très lent`,
            ],
          },
          {
            title: "Grand chien — tuba frontal",
            intensity: "Facile — coordination des bras sans contrainte respiratoire",
            details: [
              `Échauffement : ${repR}m NL très lent + ${repR}m dos lent`,
              `${nPerBlock}×${repR}m grand chien + tuba frontal — R15" — un bras tendu devant, l'autre tire lentement jusqu'à la cuisse, échange complet avant de repartir`,
              `${nPerBlock}×${repR}m grand chien + tuba frontal — R15" — focus : sens l'eau sous la paume à la prise, tire sous l'axe du corps`,
              `${nInteg}×${repR}m NL sans tuba — R10" — reproduis la lenteur et la précision du grand chien`,
              `Retour au calme : ${repR}m dos très lent`,
            ],
          },
          {
            title: "Palmes & tuba frontal — battements et position",
            intensity: "Facile — battements, corps à plat",
            details: [
              `Échauffement : ${repR}m NL très lent + ${repR}m dos lent`,
              `${nPerBlock}×${repR}m palmes + tuba frontal — R15" — talons à la surface, fouet des chevilles, expire sous l'eau à chaque virage`,
              `${nPerBlock}×${repR}m palmes seules (sans tuba) — R15" — maintiens le rythme de jambes, coordonne avec les bras`,
              `${nInteg}×${repR}m NL complet sans matériel — R10" — garde la sensation des jambes actives, vise la fluidité`,
              `Retour au calme : ${repR}m dos très lent`,
            ],
          },
          {
            title: "Fist drill — sentir l'eau",
            intensity: "Facile — ressentir l'avant-bras",
            details: [
              `Échauffement : ${repR}m NL lent + ${repR}m tuba frontal + flèche`,
              `${nPerBlock}×${repR}m fist drill — R10" — poings fermés, l'avant-bras accroche l'eau`,
              `${nPerBlock}×${repR}m mains ouvertes — R10" — ressens le grip retrouvé, note la différence`,
              `${nInteg}×${repR}m NL complet — R10" — garde la sensation de prise profonde et précoce`,
              `Retour au calme : ${repR}m dos lent`,
            ],
          },
          {
            title: "Respiration bilatérale",
            intensity: "Facile — coordination respiratoire",
            details: [
              `Échauffement : ${repR}m NL lent + ${repR}m tuba frontal + flèche`,
              `${nPerBlock}×${repR}m NL resp. 3 temps — R10" — inspire à droite sur 3 longueurs, à gauche sur 3 longueurs`,
              `${nPerBlock}×${repR}m dos crawlé lent — R10" — bras tendu, rotation douce, expire en surface`,
              `${nInteg}×${repR}m NL — R10" — alterne 3 temps et 2 temps, sens la différence d'équilibre`,
              `Retour au calme : ${repR}m dos lent`,
            ],
          },
          {
            title: "6-kick switch — équilibre & rotation",
            intensity: "Facile — équilibre latéral",
            details: [
              `Échauffement : ${repR}m NL lent + ${repR}m tuba frontal + flèche`,
              `${nPerBlock}×${repR}m 6-kick drill — R15" — 6 battements sur le flanc, tête dans l'axe, équilibre sans forcer`,
              `${nPerBlock}×${repR}m switch drill — R15" — rotation complète à chaque coup de bras, 1 battement de cheville`,
              `${nInteg}×${repR}m NL — R10" — imagine que tu roules sur un axe, pas que tu te tords`,
              `Retour au calme : ${repR}m dos lent`,
            ],
          },
        ][v],
      };
    }

    // ── INTERMÉDIAIRE (+ perf eau libre / triathlon : crawl, pas blocs 4 nages brasse) ──
    if (!isAdv || !shouldUsePoolIMBlock(goal)) {
      const v = rot(7);
      return {
        type: "TECHNIQUE",
        ...[
          {
            title: "Flèche jambes — tuba frontal",
            intensity: "Faible — battements en position flèche",
            details: [
              `Échauffement : ${repR}m NL + ${repR}m palmes + tuba frontal`,
              `${nPerBlock}×${repR}m tuba frontal + bras en flèche — R15" — jambes seules, corps à plat, talons à la surface, 5m de glisse depuis le mur avant de battre`,
              `${nPerBlock}×${repR}m tuba frontal + palmes + flèche — R15" — ajoute les palmes, maintiens corps gainé, ressens la propulsion`,
              `${nInteg}×${repR}m NL — ${dep(repR,lvl,'easy')} — garde le rythme de jambes actif hérité des longueurs en flèche`,
              `Retour au calme : ${repR}m dos lent`,
            ],
          },
          {
            title: "Grand chien — tuba frontal",
            intensity: "Faible — coordination et prise d'eau",
            details: [
              `Échauffement : ${repR}m NL + ${repR}m palmes + tuba frontal`,
              `${nPerBlock}×${repR}m grand chien + tuba frontal — R10" — un bras tendu devant, tire lentement jusqu'à la cuisse, échange complet`,
              `${nPerBlock}×${repR}m grand chien + tuba — R10" — focus coude haut à la prise, sens l'eau sur la paume et l'avant-bras`,
              `${nInteg}×${repR}m NL — ${dep(repR,lvl,'easy')} — reproduis le rythme lent et précis du grand chien`,
              `Retour au calme : ${repR}m dos lent`,
            ],
          },
          {
            title: "Hypoxie 3-5-7-9",
            intensity: "Modéré — contrôle respiratoire progressif",
            details: [
              `Échauffement : ${repR}m NL + ${repR}m palmes + tuba frontal`,
              `${nPerBlock}×${repR}m hypoxie 3 — R15" — 1 respiration toutes les 3 tractions (confortable, pose les bases)`,
              `${nPerBlock}×${repR}m hypoxie 5 — R20" — 1 respiration toutes les 5 tractions (modéré)`,
              `${Math.max(2, nPerBlock - 1)}×${repR}m hypoxie 7 — R25" — 1 respiration toutes les 7 tractions (difficile — arrête si inconfort)`,
              `Retour au calme : ${repR}m NL respiration normale + ${repR}m dos lent`,
            ],
          },
          {
            title: "Catch-up drill & DPS",
            intensity: "Faible — distance par cycle (DPS)",
            details: [
              `Échauffement : ${repR}m NL + ${repR}m palmes + tuba frontal`,
              `${nPerBlock}×${repR}m catch-up drill — R10" — bras tendu devant, attend la main adverse avant de repartir`,
              `${nPerBlock}×${repR}m DPS comptage — R10" — vise 18–22 cycles/longueur`,
              `${nInteg}×${repR}m NL — ${dep(repR,lvl,'easy')} — réduis d'1 cycle/longueur vs ta normale, même vitesse`,
              `Retour au calme : ${repR}m dos lent`,
            ],
          },
          {
            title: "Fist drill & prise d'eau",
            intensity: "Faible — qualité de la prise",
            details: [
              `Échauffement : ${repR}m NL + ${repR}m palmes + tuba frontal`,
              `${nPerBlock}×${repR}m fist drill — R10" — poings fermés, accroche avec l'avant-bras, coude haut`,
              `${nPerBlock}×${repR}m palmes + tuba frontal — R15" — coude haut à la sortie de l'eau, sens la propulsion des jambes`,
              `${nInteg}×${repR}m NL — ${dep(repR,lvl,'easy')} — prise précoce et profonde, tire sous l'axe du corps`,
              `Retour au calme : ${repR}m dos lent`,
            ],
          },
          {
            title: "6-kick drill & rotation",
            intensity: "Faible — alignement et rotation",
            details: [
              `Échauffement : ${repR}m NL + ${repR}m palmes + tuba frontal`,
              `${nPerBlock}×${repR}m 6-kick drill — R10" — 6 battements sur le côté, nez au fond, rotation consciente`,
              `${nPerBlock}×${repR}m rotation exagérée — R10" — épaule passe au-dessus de l'eau, 2s de glisse`,
              `${nInteg}×${repR}m NL — ${dep(repR,lvl,'easy')} — vise 18–22 cycles/longueur, même temps`,
              `Retour au calme : ${repR}m dos lent`,
            ],
          },
          {
            title: "Virages & coulées",
            intensity: "Faible — travail des virages",
            details: [
              `Échauffement : ${repR}m NL + ${repR}m palmes + tuba frontal`,
              `${nPerBlock}×${repR}m coulées — R10" — flèche max gainée, 5m en apnée avant le 1er bras`,
              `${nPerBlock}×${repR}m flip turns — R15" — culbute à 1m du mur, poussée + flèche`,
              `${nInteg}×${repR}m NL — ${dep(repR,lvl,'easy')} — chaque virage = relance d'élan, zéro perte de vitesse`,
              `Retour au calme : ${repR}m dos lent`,
            ],
          },
        ][v],
      };
    }

    // ── PERF eau libre / triathlon : technique crawl & sighting ───────────
    if (isAdv && !shouldUsePoolIMBlock(goal)) {
      const v = rot(6);
      return {
        type: "TECHNIQUE",
        ...[
          {
            title: "Technique crawl — prise & rotation",
            intensity: "Faible — qualité de nage OW",
            details: [
              `Échauffement : ${repR}m crawl + ${repR}m dos`,
              `${nPerBlock}×${repR}m catch-up drill — R10" — allongement, attente la main adverse`,
              `${nPerBlock}×${repR}m sighting tous les 6 bras — R15" — tête stable, vise un repère au fond`,
              `${nInteg}×${repR}m crawl — ${dep(repR,lvl,'easy')} — intègre sighting + allongement`,
              `Retour calme : ${repR}m dos lent`,
            ],
          },
          {
            title: "Sighting & respiration",
            intensity: "Faible — prépa navigation eau libre",
            details: [
              `Échauffement : ${repR}m crawl progressif`,
              `${nPerBlock}×${repR}m crawl respiration bilatérale — R10" — 3 bras / 5 bras en alternance`,
              `${nPerBlock}×${repR}m crawl sighting — R15" — lève la tête sans casser l'allure`,
              `${nInteg}×${repR}m crawl — ${dep(repR,lvl,'easy')} — même effort, technique propre`,
              `Retour calme : ${repR}m dos lent`,
            ],
          },
          {
            title: "Allonge & DPS",
            intensity: "Faible — économie de nage",
            details: [
              `Échauffement : ${repR}m crawl + ${repR}m palmes`,
              `${nPerBlock}×${repR}m DPS comptage — R10" — vise moins de cycles à même allure`,
              `${nPerBlock}×${repR}m fist drill — R10" — avant-bras, coude haut`,
              `${nInteg}×${repR}m crawl — ${dep(repR,lvl,'easy')} — glisse entre les cycles`,
              `Retour calme : ${repR}m dos lent`,
            ],
          },
          {
            title: "Enchaînement 4 nages léger",
            intensity: "Modéré — 1 tour IM, volume brasse minimal",
            details: [
              `Échauffement : ${repR}m crawl + ${repR}m dos`,
              `${Math.max(2, Math.round(nPerBlock * 0.5))}×${4*P}m 4 nages (${P}m pap · ${P}m dos · ${P}m crawl · ${P}m crawl) — R30" — fluidité`,
              `${nPerBlock}×${repR}m crawl — ${dep(repR,lvl,'easy')} — repose sur le crawl`,
              `Retour calme : ${repR}m dos lent`,
            ],
          },
          {
            title: "Virages & coulées",
            intensity: "Faible — relance sans perdre l'allure",
            details: [
              `Échauffement : ${repR}m crawl + ${repR}m palmes`,
              `${nPerBlock}×${repR}m coulées — R10" — flèche gainée depuis le mur`,
              `${nPerBlock}×${repR}m crawl virages — R15" — enchaîne sans t'arrêter au milieu`,
              `${nInteg}×${repR}m crawl — ${dep(repR,lvl,'easy')} — allure régulière`,
              `Retour calme : ${repR}m dos lent`,
            ],
          },
          {
            title: "Tempo & cycles crawl",
            intensity: "Modéré — efficacité",
            details: [
              `Échauffement : ${repR}m crawl + ${repR}m dos`,
              `${nPerBlock}×${repR}m crawl — R10" — compte tes cycles par longueur`,
              `${nPerBlock}×${repR}m crawl — ${dep(repR,lvl,'easy')} — même cycles, un peu plus vite`,
              `${nInteg}×${repR}m crawl sighting — ${dep(repR,lvl,'easy')} — intègre la tête haute`,
              `Retour calme : ${repR}m dos lent`,
            ],
          },
        ][v],
      };
    }

    // ── EXPERT / PERFORMANCE piscine : technique 4 nages (6 variants) ─────
    const v = rot(6);
    return {
      type: "TECHNIQUE",
      ...[
        {
          title: "Technique dos",
          intensity: "Faible — sortie du bras, rotation épaule",
          details: [
            `Échauffement : ${repR}m crawl + ${repR}m brasse lente`,
            `${nPerBlock}×${repR}m dos — R10" — épaule sort de l'eau à chaque bras, regard au plafond`,
            `${nPerBlock}×${repR}m dos palmes — R10" — fouet des chevilles, corps gainé, rotation de bassin`,
            `${nInteg}×${repR}m dos — ${dep(repR,lvl,'easy')} — amplitude complète, pas de coude qui rentre à l'entrée`,
            `Retour calme : ${repR}m crawl lent`,
          ],
        },
        {
          title: "Technique brasse",
          intensity: "Faible — traction coude haut, coulée longue",
          details: [
            `Échauffement : ${repR}m crawl + ${repR}m dos lent`,
            `${nPerBlock}×${repR}m brasse — R15" — bras tirent, jambes poussent — jamais en même temps`,
            `${nPerBlock}×${repR}m brasse coulée longue — R15" — prolonge la glisse 2 secondes avant le prochain cycle`,
            `${nInteg}×${repR}m brasse — ${dep(repR,lvl,'easy')} — amplitude + coulée, économise l'énergie`,
            `Retour calme : ${repR}m crawl lent`,
          ],
        },
        {
          title: "Technique papillon",
          intensity: "Faible — ondulation hanches, pas épaules",
          details: [
            `Échauffement : ${repR}m crawl + ${repR}m dos + 4×${P}m ondulations jambes`,
            `${nPerBlock}×${P}m papillon — R30" — ondulation vient des hanches, les épaules suivent`,
            `${nPerBlock}×${P}m papillon — R30" — 2 battements de jambes par cycle, sens la propulsion`,
            `${nInteg}×${repR}m crawl — ${dep(repR,lvl,'easy')} — intégration après le travail papillon`,
            `Retour calme : ${repR}m dos lent`,
          ],
        },
        {
          title: "Séance 4 nages par bloc",
          intensity: "Modéré — un bloc par nage",
          details: [
            `Échauffement : ${repR}m crawl`,
            `${nPerBlock}×${repR}m dos — R10" — rotation épaule, fouet chevilles`,
            `${nPerBlock}×${repR}m brasse — R15" — bras + jambes séparés, coulée`,
            `${nPerBlock}×${P}m papillon — R30" — ondulation hanches`,
            `${nInteg}×${repR}m crawl — ${dep(repR,lvl,'easy')} — intégration finale`,
            `Retour calme : ${repR}m dos lent`,
          ],
        },
        {
          title: "Enchaînement 4 nages complet",
          intensity: "Modéré — fluidité entre les nages",
          details: [
            `Échauffement : ${repR}m crawl + ${repR}m dos`,
            `${nPerBlock}×${4*P}m 4 nages (${P}m par nage) — R25" — papillon · dos · brasse · crawl, fluidité à chaque transition`,
            `${nPerBlock}×${repR}m crawl — ${dep(repR,lvl,'easy')} — repose sur le crawl après les 4 nages`,
            `Retour calme : ${repR}m dos lent`,
          ],
        },
        {
          title: "Tempo & cycles crawl",
          intensity: "Modéré — plus vite sans plus de cycles",
          details: [
            `Échauffement : ${repR}m crawl + ${repR}m 4 nages (${P}m par nage)`,
            `${nPerBlock}×${repR}m crawl — R10" — compte tes cycles par longueur`,
            `${nPerBlock}×${repR}m crawl — ${dep(repR,lvl,'easy')} — accélère le rythme de bras en gardant le même nombre de cycles`,
            `${nInteg}×${repR}m crawl — ${dep(repR,lvl,'easy')} — objectif : 2s plus rapide, même nombre de cycles`,
            `Retour calme : ${repR}m dos lent`,
          ],
        },
      ][v],
    };
  },

  // ── BNSSA ────────────────────────────────────────────────────────────────
  bnssa: (dist, pool, level = "intermediate", weekIdx = 0, goal = "") => {
    const P = pool, v = weekIdx % 5;
    const nApnee  = Math.max(4, Math.min(12, Math.round(dist * 0.18 / 15)));
    const nRem    = Math.max(3, Math.min(8,  Math.round(dist * 0.15 / P)));
    const nPalmes = Math.max(4, Math.min(10, Math.round(dist * 0.30 / (2*P))));
    const nNL     = Math.max(3, Math.min(8,  Math.round(dist * 0.22 / (2*P))));
    const nTuba   = Math.max(4, Math.min(8,  Math.round(dist * 0.20 / (2*P))));

    return {
      type: "BNSSA",
      ...[
        {
          title: "Simulation parcours 100m",
          intensity: "Apnée & remorquage — qualité de parcours",
          details: [
            `Échauffement : 200m NL progressif + 100m battements`,
            `Apnée dynamique : ${nApnee}×15m immersion complète — R2' — tracé fond, sans appui`,
            `Simulation 100m : 25m NL → 15m apnée → virage → 15m apnée → 25m remorquage — R3'`,
            `Remorquage : ${nRem}×${P}m — R1'30" — position dorsale, visage hors de l'eau`,
            `Retour au calme : 200m dos lent`,
          ],
        },
        {
          title: "Prépa 250m palmes & plongée",
          intensity: "Endurance équipée + apnée",
          details: [
            `Échauffement : 200m NL + 100m battements`,
            `${nPalmes}×${2*P}m palmes + masque + tuba — R20" — touche le mur à chaque virage`,
            `Plongée canard : 6× plongée → fond → saisie mannequin → remontée — R2'`,
            `Remorquage : ${nRem}×${P}m position dorsale — R1'30"`,
            `Retour au calme : 200m dos lent`,
          ],
        },
        {
          title: "Endurance & apnée sous fatigue",
          intensity: "Tenir les apnées après l'effort",
          details: [
            `Échauffement : 200m NL progressif + 100m battements`,
            `${nNL}×${2*P}m NL — R20" — endurance de base`,
            `Apnée dynamique : ${nApnee}×15m — R2' — immersion complète sans appui`,
            `${nRem}×${P}m remorquage — R1'30" — position dorsale`,
            `Retour au calme : 200m dos lent`,
          ],
        },
        {
          title: "Palmes + tuba — volume équipé",
          intensity: "Endurance masque/tuba + apnées courtes",
          details: [
            `Échauffement : 200m NL + 100m palmes souples`,
            `${nTuba}×${2*P}m palmes + masque + tuba — R15" — respiration tuba régulière, virages propres`,
            `Apnée : ${nApnee}×15m — R1'30" — après fatigue équipée`,
            `${nRem}×${P}m remorquage dorsale — R1'`,
            `Retour au calme : 200m dos sans matériel`,
          ],
        },
        {
          title: "Enchaînement exam — palmes → apnée → remorquage",
          intensity: "Simulation complète sous fatigue",
          details: [
            `Échauffement : 200m NL + 100m battements`,
            `${Math.max(3, Math.round(nPalmes * 0.6))}×${2*P}m palmes + tuba — R20"`,
            `Bloc exam : 50m palmes → 15m apnée → ${P}m remorquage — ×${Math.max(3, Math.min(6, nRem))} — R2'30"`,
            `Apnée isolée : ${Math.max(4, Math.round(nApnee * 0.7))}×15m — R2'`,
            `Retour au calme : 200m dos lent`,
          ],
        },
      ][v],
    };
  },

  // ── RÉCUPÉRATION ─────────────────────────────────────────────────────────
  // 3 variants per level — rotation via improved weekIdx formula
  récupération: (dist, pool, level = "intermediate", weekIdx = 0, goal = "") => {
    const isBeg = level === "beginner" || level === "régulier" || level === "découverte";
    const P = pool;
    const v = (Math.floor(weekIdx / 10) * 3 + (weekIdx % 10)) % 3;
    const repR = 2*P;
    const nA = Math.max(2, Math.round(dist * 0.30 / repR));
    const nB = Math.max(2, Math.round(dist * 0.30 / repR));
    const nC = Math.max(2, Math.round(dist * 0.25 / repR));
    const nD = Math.min(6, Math.max(2, Math.round(Math.max(0, dist - (nA+nB+nC)*repR) / repR)));

    if (isBeg) {
      return {
        type: "RÉCUPÉRATION",
        ...[
          {
            title: "Nage libre douce",
            intensity: "Très facile — récupère",
            details: [
              `${nA}×${repR}m NL lent — R10" — si tu souffles c'est trop vite, réduis l'allure`,
              `${nB}×${repR}m dos crawlé — R10" — bras tendus, regard au plafond, flotte`,
              `${nC}×${repR}m alternance 25 crawl / 25 dos — R10" — change de nage à chaque longueur`,
              `Fin : flotte 2 min en étoile sur le dos`,
            ],
          },
          {
            title: "Dos & respiration",
            intensity: "Très facile",
            details: [
              `${nA}×${repR}m dos crawlé — R10" — jambes molles, pense à flotter`,
              `${nB}×${repR}m godilles avant — R10" — mains en figure 8, sens la portance de l'eau`,
              `${nC}×${repR}m NL lent — R10" — 1 long. resp 2 temps / 1 long. resp 3 temps`,
              `Fin : flotte 2 min en étoile sur le dos`,
            ],
          },
          {
            title: "Déconnexion totale",
            intensity: "Très facile — sans chrono, sans pression",
            details: [
              `${nA}×${repR}m NL — sans chrono — nage à l'intuition, arrête si besoin`,
              `${nB}×${repR}m dos crawlé — sans chrono — pense à autre chose, déconnecte complètement`,
              nC > 0 ? `${nC}×${repR}m battements dos bras le long — jambes molles, flottaison totale` : `2 min de flottaison sur le dos — bras en croix, expire profondément`,
              `Fin : étirements passifs 3 min au bord du bassin`,
            ],
          },
        ][v],
      };
    }

    // ── PERFORMANCE / EXPERT : récup active + 4 nages (piscine polyvalente) ──
    if (!isBeg && (level === "performance" || level === "advanced") && shouldUsePoolIMBlock(goal)) {
      const vp = (Math.floor(weekIdx / 10) * 3 + (weekIdx % 10)) % 3;
      return {
        type: "RÉCUPÉRATION",
        ...[
          {
            title: "Récupération 4 nages",
            intensity: "Très facile — maintien du mouvement",
            details: [
              `${nA}×${repR}m dos — 15" récup — jambes molles, rotation douce`,
              `${nB}×${repR}m brasse — 15" récup — coulée longue, jamais de précipitation`,
              `${nC}×${repR}m crawl très lent — 10" récup — expire sous l'eau, relâche les épaules`,
              `Fin : 100m dos bras le long — flottaison pure`,
            ],
          },
          {
            title: "Nage croisée douce",
            intensity: "Très facile — polyvalence en récup",
            details: [
              `${nA}×${repR}m en rotation dos · brasse · crawl — 15" récup — 1 nage par longueur, sans effort`,
              `${nB}×${repR}m crawl lent — 10" récup — pense à la technique, pas à la vitesse`,
              `${nC}×${repR}m dos — 10" récup — regard au plafond, décompresse`,
              `Fin : flotte 2 min sur le dos, bras en croix`,
            ],
          },
          {
            title: "Descente douce",
            intensity: "Très facile — sans montre",
            details: [
              `${nA}×${repR}m crawl — sans pression — allure intuitive, arrête si besoin`,
              `${nB}×${repR}m dos — 10" récup — pense à autre chose, déconnecte`,
              `${nC}×${repR}m brasse coulée — 15" récup — 1 cycle · coulée · 1 cycle, le plus lent possible`,
              `Fin : étirements passifs 3 min au bord du bassin`,
            ],
          },
        ][vp],
      };
    }

    return {
      type: "RÉCUPÉRATION",
      ...[
        {
          title: "Récupération active",
          intensity: "Z1 — très facile",
          details: [
            `${nA}×${repR}m nage croisée — R10" — change de nage à chaque longueur`,
            `${nB}×${repR}m dos crawlé — R10" — épaule sort en premier, scan corporel`,
            `${nC}×${repR}m NL lent — R10" — coulée max après chaque virage`,
            `${nD}×${repR}m battements mains en flèche — R10" — jambes libres, expire dans l'eau`,
          ],
        },
        {
          title: "Godilles & relâchement",
          intensity: "Z1 — ressentir l'eau",
          details: [
            `${nA}×${P}m godilles — R10" — mains en 'figure 8', sens la portance`,
            `${nB}×${repR}m dos lent — R10" — jambes molles, récupère mentalement`,
            `${nC}×${repR}m NL lent — R10" — méditation active, compte les longueurs`,
            `${nD}×${repR}m alternance 25 dos / 25 crawl — R10" — nage croisée, jambes souples`,
          ],
        },
        {
          title: "Descente douce",
          intensity: "Z1 — allure intuitive, pas de montre",
          details: [
            `${nA}×${repR}m NL — sans pression — Z1 confort, pense à ta posture`,
            `${nB}×${repR}m dos crawlé — R10" — focus rotation du bassin, relâche les épaules`,
            nC > 0 ? `${nC}×${P}m godilles dos — R10" — mains au niveau des hanches, sens la portance` : `${repR}m NL très lent libre`,
            `Fin : 200m NL très lent — aucune contrainte de temps`,
          ],
        },
      ][v],
    };
  },
};

const TIPS = {
  debut:       "Priorité à la régularité sur l'intensité. Concentre-toi sur la position du corps dans l'eau — plus tu es horizontal, moins tu freines.",
  aerobie:     "Travaille la respiration bilatérale (3 temps). Un appui symétrique des deux côtés améliore la rotation et l'efficacité de nage.",
  endurance:   "Si tu dois t'arrêter, c'est que tu vas trop vite. Ralentis jusqu'à trouver une allure où tu pourrais tenir une conversation courte.",
  seuil:       "Le seuil doit être inconfortable mais régulier. Utilise un chrono — la constance des temps de passage est le seul indicateur qui compte.",
  vitesse:     "Récupération complète entre chaque sprint. Sans ça, tu travailles l'endurance, pas la vitesse. Qualité absolue > quantité.",
  volume:      "Semaine de charge maximale. Mange +15 % de glucides, vise 8 h de sommeil — c'est pendant la récupération que le corps s'adapte.",
  affutage:    "Réduis le volume de 40 % mais maintiens 2–3 accélérations par séance pour garder la réactivité musculaire.",
  competition: "Dernière semaine avant l'événement : 1–2 séances courtes, volume bas, rappels de vitesse (12,5 m max). Ne t'inquiète pas : si tu as suivi le plan, le travail est fait.",
  test:        "Semaine chrono : note ton T100 (100 m, départ dans l'eau). Compare avec le test précédent — c'est la seule façon de voir si tu évolues vraiment.",
};

// Ratios par niveau — découverte : fun + endurance légère, pas de seuil/vitesse au début
const PHASE_PATTERNS = {
  // Découverte — endurance légère + technique simple + récupération douce
  découverte: {
    base:        { 1: ["endurance"], 2: ["endurance","récupération"], 3: ["endurance","technique","récupération"], 4: ["endurance","endurance","technique","récupération"], 5: ["endurance","endurance","technique","récupération","endurance"] },
    development: { 1: ["endurance"], 2: ["endurance","technique"],    3: ["endurance","endurance","technique"],    4: ["endurance","seuil","technique","récupération"],   5: ["endurance","seuil","technique","récupération","endurance"] },
    peak:        { 1: ["endurance"], 2: ["endurance","vitesse"],      3: ["endurance","vitesse","technique"],      4: ["endurance","vitesse","technique","récupération"],  5: ["endurance","vitesse","technique","récupération","endurance"] },
    taper:       { 1: ["récupération"], 2: ["endurance","récupération"], 3: ["endurance","récupération","récupération"], 4: ["endurance","technique","récupération","récupération"], 5: ["endurance","technique","récupération","récupération","endurance"] },
    competition: { 1: ["récupération"], 2: ["récupération"], 3: ["récupération"], 4: ["récupération","récupération"], 5: ["récupération","récupération"] },
    test:        { 1: ["seuil"], 2: ["endurance","seuil"], 3: ["endurance","seuil","récupération"], 4: ["endurance","seuil","technique","récupération"], 5: ["endurance","seuil","technique","récupération","endurance"] },
  },
  // Régulier = alias de beginner
  régulier: {
    base:        { 1: ["technique"], 2: ["technique","endurance"], 3: ["technique","technique","endurance"], 4: ["endurance","technique","technique","récupération"], 5: ["endurance","technique","technique","récupération","endurance"] },
    development: { 1: ["seuil"],    2: ["technique","endurance"], 3: ["technique","seuil","endurance"],     4: ["technique","seuil","endurance","technique"],        5: ["technique","seuil","endurance","technique","récupération"] },
    peak:        { 1: ["seuil"],    2: ["technique","seuil"],     3: ["technique","seuil","vitesse"],       4: ["technique","seuil","vitesse","endurance"],          5: ["technique","seuil","vitesse","endurance","récupération"] },
    taper:       { 1: ["endurance"], 2: ["technique","récupération"], 3: ["technique","endurance","récupération"], 4: ["technique","endurance","récupération","récupération"], 5: ["technique","endurance","récupération","récupération","endurance"] },
    competition: { 1: ["récupération"], 2: ["récupération"], 3: ["récupération"], 4: ["récupération","récupération"], 5: ["récupération","récupération"] },
    test:        { 1: ["seuil"], 2: ["endurance","seuil"], 3: ["technique","seuil","récupération"], 4: ["technique","seuil","endurance","récupération"], 5: ["technique","seuil","endurance","récupération","endurance"] },
  },
  // Sportif = alias de intermediate
  sportif: {
    base:        { 1: ["technique"], 2: ["technique","endurance"], 3: ["technique","technique","endurance"], 4: ["endurance","technique","technique","récupération"], 5: ["endurance","technique","technique","récupération","endurance"] },
    development: { 1: ["seuil"],    2: ["technique","seuil"],     3: ["technique","seuil","endurance"],     4: ["technique","seuil","endurance","technique"],        5: ["technique","seuil","endurance","technique","récupération"] },
    peak:        { 1: ["seuil"],    2: ["technique","seuil"],     3: ["technique","seuil","vitesse"],       4: ["technique","seuil","vitesse","endurance"],          5: ["technique","seuil","vitesse","endurance","récupération"] },
    taper:       { 1: ["endurance"], 2: ["technique","récupération"], 3: ["technique","endurance","récupération"], 4: ["technique","endurance","récupération","récupération"], 5: ["technique","endurance","récupération","récupération","endurance"] },
    competition: { 1: ["récupération"], 2: ["récupération"], 3: ["récupération"], 4: ["récupération","récupération"], 5: ["récupération","récupération"] },
    test:        { 1: ["seuil"], 2: ["endurance","seuil"], 3: ["technique","seuil","récupération"], 4: ["technique","seuil","endurance","récupération"], 5: ["technique","seuil","endurance","récupération","endurance"] },
  },
  // Performance = alias de advanced
  performance: {
    base:        { 1: ["endurance"], 2: ["endurance","technique"], 3: ["endurance","endurance","technique"], 4: ["endurance","endurance","technique","récupération"], 5: ["endurance","endurance","technique","récupération","endurance"] },
    development: { 1: ["seuil"],     2: ["endurance","seuil"],     3: ["endurance","seuil","technique"],     4: ["endurance","seuil","vitesse","technique"],          5: ["endurance","seuil","vitesse","technique","endurance"] },
    peak:        { 1: ["seuil"],     2: ["seuil","vitesse"],        3: ["endurance","seuil","vitesse"],       4: ["endurance","seuil","vitesse","seuil"],              5: ["endurance","seuil","vitesse","seuil","récupération"] },
    taper:       { 1: ["endurance"], 2: ["endurance","récupération"], 3: ["endurance","technique","récupération"], 4: ["endurance","technique","récupération","récupération"], 5: ["endurance","technique","récupération","récupération","endurance"] },
    competition: { 1: ["récupération"], 2: ["récupération"], 3: ["récupération"], 4: ["récupération","récupération"], 5: ["récupération","récupération"] },
    test:        { 1: ["seuil"], 2: ["seuil","endurance"], 3: ["seuil","vitesse","récupération"], 4: ["endurance","seuil","vitesse","récupération"], 5: ["endurance","seuil","vitesse","récupération","endurance"] },
  },
  beginner: {
    base:        { 1: ["technique"], 2: ["technique","technique"], 3: ["technique","technique","endurance"], 4: ["technique","technique","technique","endurance"], 5: ["technique","technique","technique","endurance","récupération"] },
    development: { 1: ["technique"], 2: ["technique","endurance"], 3: ["technique","technique","endurance"], 4: ["technique","technique","endurance","récupération"], 5: ["technique","technique","technique","endurance","récupération"] },
    peak:        { 1: ["technique"], 2: ["technique","endurance"], 3: ["technique","endurance","technique"], 4: ["technique","technique","endurance","récupération"], 5: ["technique","technique","endurance","technique","récupération"] },
    taper:       { 1: ["technique"], 2: ["technique","récupération"], 3: ["technique","technique","récupération"], 4: ["technique","technique","récupération","récupération"], 5: ["technique","technique","récupération","récupération","endurance"] },
    competition: { 1: ["récupération"], 2: ["récupération"], 3: ["récupération"], 4: ["récupération","récupération"], 5: ["récupération","récupération"] },
    test:        { 1: ["seuil"], 2: ["endurance","seuil"], 3: ["technique","seuil","récupération"], 4: ["technique","seuil","endurance","récupération"], 5: ["technique","seuil","endurance","récupération","technique"] },
  },
  intermediate: {
    base:        { 1: ["technique"], 2: ["technique","endurance"], 3: ["technique","technique","endurance"], 4: ["endurance","technique","technique","récupération"], 5: ["endurance","technique","technique","récupération","endurance"] },
    development: { 1: ["seuil"],    2: ["technique","seuil"],     3: ["technique","seuil","endurance"],     4: ["technique","seuil","endurance","technique"],        5: ["technique","seuil","endurance","technique","récupération"] },
    peak:        { 1: ["seuil"],    2: ["technique","seuil"],     3: ["technique","seuil","vitesse"],       4: ["technique","seuil","vitesse","endurance"],          5: ["technique","seuil","vitesse","endurance","récupération"] },
    taper:       { 1: ["endurance"], 2: ["technique","récupération"], 3: ["technique","endurance","récupération"], 4: ["technique","endurance","récupération","récupération"], 5: ["technique","endurance","récupération","récupération","endurance"] },
    competition: { 1: ["récupération"], 2: ["récupération"], 3: ["récupération"], 4: ["récupération","récupération"], 5: ["récupération","récupération"] },
    test:        { 1: ["seuil"], 2: ["endurance","seuil"], 3: ["technique","seuil","récupération"], 4: ["technique","seuil","endurance","récupération"], 5: ["technique","seuil","endurance","récupération","endurance"] },
  },
  advanced: {
    base:        { 1: ["endurance"], 2: ["endurance","technique"], 3: ["endurance","endurance","technique"], 4: ["endurance","endurance","technique","récupération"], 5: ["endurance","endurance","technique","récupération","endurance"] },
    development: { 1: ["seuil"],     2: ["endurance","seuil"],     3: ["endurance","seuil","technique"],     4: ["endurance","seuil","vitesse","technique"],          5: ["endurance","seuil","vitesse","technique","endurance"] },
    peak:        { 1: ["seuil"],     2: ["seuil","vitesse"],        3: ["endurance","seuil","vitesse"],       4: ["endurance","seuil","vitesse","seuil"],              5: ["endurance","seuil","vitesse","seuil","récupération"] },
    taper:       { 1: ["endurance"], 2: ["endurance","récupération"], 3: ["endurance","technique","récupération"], 4: ["endurance","technique","récupération","récupération"], 5: ["endurance","technique","récupération","récupération","endurance"] },
    competition: { 1: ["récupération"], 2: ["récupération"], 3: ["récupération"], 4: ["récupération","récupération"], 5: ["récupération","récupération"] },
    test:        { 1: ["seuil"], 2: ["seuil","endurance"], 3: ["seuil","vitesse","récupération"], 4: ["endurance","seuil","vitesse","récupération"], 5: ["endurance","seuil","vitesse","récupération","endurance"] },
  },
};

// Eau libre 5k/10k — patterns crawl (legacy ; contenu confirmé = banque dans swim-session-generator)
const OPEN_WATER_PATTERNS = {
  régulier: PHASE_PATTERNS.régulier,
  beginner: PHASE_PATTERNS.régulier,
  sportif: PHASE_PATTERNS.sportif,
  intermediate: PHASE_PATTERNS.sportif,
  performance: PHASE_PATTERNS.performance,
  advanced: PHASE_PATTERNS.performance,
  découverte: PHASE_PATTERNS.régulier,
};

const BNSSA_PATTERNS = {
  base:        { 1: ["bnssa"],     2: ["endurance", "bnssa"],  3: ["bnssa", "endurance", "bnssa"],           4: ["endurance", "bnssa", "bnssa", "récupération"],              5: ["endurance", "bnssa", "bnssa", "récupération", "endurance"] },
  development: { 1: ["bnssa"],     2: ["bnssa", "bnssa"],       3: ["endurance", "bnssa", "bnssa"],           4: ["endurance", "bnssa", "bnssa", "bnssa"],                      5: ["endurance", "seuil", "bnssa", "bnssa", "récupération"] },
  peak:        { 1: ["bnssa"],     2: ["bnssa", "bnssa"],       3: ["bnssa", "bnssa", "bnssa"],               4: ["endurance", "bnssa", "bnssa", "bnssa"],                      5: ["endurance", "seuil", "bnssa", "bnssa", "récupération"] },
  taper:       { 1: ["bnssa"],     2: ["endurance", "bnssa"],  3: ["endurance", "bnssa", "récupération"],    4: ["endurance", "bnssa", "récupération", "récupération"],       5: ["endurance", "bnssa", "récupération", "récupération", "endurance"] },
  competition: { 1: ["récupération"], 2: ["récupération"], 3: ["récupération"], 4: ["récupération","récupération"], 5: ["récupération","récupération"] },
  test:        { 1: ["bnssa"], 2: ["bnssa", "endurance"], 3: ["bnssa", "endurance", "récupération"], 4: ["bnssa", "bnssa", "endurance", "récupération"], 5: ["bnssa", "bnssa", "endurance", "récupération", "bnssa"] },
};

const WELLNESS_PATTERNS = {
  beginner: {
    base:        { 1: ["technique"], 2: ["technique","récupération"], 3: ["technique","technique","récupération"], 4: ["technique","technique","technique","récupération"], 5: ["technique","technique","technique","récupération","endurance"] },
    development: { 1: ["technique"], 2: ["technique","endurance"],    3: ["technique","technique","endurance"],    4: ["technique","technique","endurance","récupération"],  5: ["technique","technique","endurance","récupération","technique"] },
    test:        { 1: ["endurance"], 2: ["technique","endurance"], 3: ["technique","endurance","récupération"], 4: ["technique","endurance","récupération","technique"], 5: ["technique","endurance","récupération","technique","endurance"] },
  },
  intermediate: {
    base:        { 1: ["technique"], 2: ["endurance","technique"],    3: ["technique","endurance","récupération"], 4: ["endurance","technique","technique","récupération"], 5: ["endurance","technique","technique","récupération","endurance"] },
    development: { 1: ["endurance"], 2: ["technique","endurance"],    3: ["technique","endurance","endurance"],    4: ["technique","endurance","endurance","récupération"],  5: ["technique","endurance","endurance","récupération","endurance"] },
    test:        { 1: ["seuil"], 2: ["endurance","seuil"], 3: ["technique","seuil","récupération"], 4: ["technique","seuil","endurance","récupération"], 5: ["technique","seuil","endurance","récupération","endurance"] },
  },
  advanced: {
    base:        { 1: ["endurance"], 2: ["endurance","récupération"], 3: ["endurance","technique","récupération"], 4: ["endurance","endurance","technique","récupération"], 5: ["endurance","endurance","technique","récupération","endurance"] },
    development: { 1: ["endurance"], 2: ["endurance","technique"],    3: ["endurance","endurance","technique"],    4: ["endurance","endurance","technique","récupération"],  5: ["endurance","endurance","technique","récupération","endurance"] },
    test:        { 1: ["seuil"], 2: ["seuil","endurance"], 3: ["seuil","endurance","récupération"], 4: ["endurance","seuil","technique","récupération"], 5: ["endurance","seuil","technique","récupération","endurance"] },
  },
};

const PROGRESSION_PATTERNS = {
  beginner: {
    base:        { 1: ["technique"],    2: ["technique","endurance"],        3: ["technique","technique","récupération"],              4: ["technique","technique","endurance","récupération"],             5: ["technique","technique","endurance","récupération","technique"] },
    development: { 1: ["technique"],    2: ["technique","endurance"],        3: ["technique","endurance","technique"],                 4: ["technique","endurance","technique","récupération"],             5: ["technique","technique","endurance","récupération","endurance"] },
    peak:        { 1: ["technique"],    2: ["technique","seuil"],            3: ["technique","seuil","endurance"],                    4: ["technique","seuil","endurance","récupération"],                 5: ["technique","seuil","endurance","récupération","technique"] },
    bilan:       { 1: ["récupération"], 2: ["récupération","technique"],     3: ["récupération","technique","endurance"],             4: ["récupération","technique","technique","endurance"],             5: ["récupération","technique","technique","endurance","endurance"] },
    test:        { 1: ["seuil"], 2: ["endurance","seuil"], 3: ["technique","seuil","récupération"], 4: ["technique","seuil","endurance","récupération"], 5: ["technique","seuil","endurance","récupération","technique"] },
  },
  intermediate: {
    base:        { 1: ["technique"],    2: ["technique","endurance"],        3: ["technique","endurance","récupération"],              4: ["endurance","technique","endurance","récupération"],             5: ["endurance","technique","endurance","récupération","endurance"] },
    development: { 1: ["seuil"],        2: ["technique","seuil"],            3: ["technique","seuil","endurance"],                    4: ["technique","seuil","endurance","récupération"],                 5: ["technique","seuil","endurance","technique","récupération"] },
    peak:        { 1: ["vitesse"],      2: ["technique","vitesse"],          3: ["vitesse","seuil","endurance"],                      4: ["technique","vitesse","seuil","récupération"],                   5: ["technique","vitesse","seuil","endurance","récupération"] },
    bilan:       { 1: ["récupération"], 2: ["récupération","technique"],     3: ["récupération","technique","endurance"],             4: ["récupération","technique","endurance","technique"],             5: ["récupération","technique","endurance","technique","endurance"] },
    test:        { 1: ["seuil"], 2: ["endurance","seuil"], 3: ["technique","seuil","récupération"], 4: ["technique","seuil","endurance","récupération"], 5: ["technique","seuil","endurance","récupération","endurance"] },
  },
  advanced: {
    base:        { 1: ["endurance"],    2: ["endurance","technique"],        3: ["endurance","technique","récupération"],              4: ["endurance","endurance","technique","récupération"],             5: ["endurance","endurance","technique","récupération","endurance"] },
    development: { 1: ["endurance"],    2: ["seuil","endurance"],            3: ["seuil","endurance","technique"],                    4: ["seuil","endurance","technique","récupération"],                 5: ["seuil","endurance","technique","récupération","endurance"] },
    peak:        { 1: ["vitesse"],      2: ["vitesse","seuil"],              3: ["vitesse","seuil","endurance"],                      4: ["vitesse","seuil","endurance","récupération"],                   5: ["vitesse","seuil","endurance","récupération","vitesse"] },
    bilan:       { 1: ["récupération"], 2: ["récupération","technique"],     3: ["récupération","technique","endurance"],             4: ["récupération","technique","endurance","technique"],             5: ["récupération","technique","endurance","technique","endurance"] },
    test:        { 1: ["seuil"], 2: ["seuil","endurance"], 3: ["seuil","vitesse","récupération"], 4: ["endurance","seuil","vitesse","récupération"], 5: ["endurance","seuil","vitesse","récupération","endurance"] },
  },
};

const buildProgressionPhases = () => {
  // 12 semaines : base → test → développement → test → peak → bilan (affûtage léger)
  const phases = [];
  for (let i = 0; i < 3; i++) {
    const t = i / 2;
    phases.push({ phase: "base", focus: t < 0.5 ? "Mise en place" : "Construction du volume", progression: 1.0 + t * 0.18, tipKey: t < 0.5 ? "debut" : "aerobie", isBilan: false, isTest: false });
  }
  phases.push({ phase: "test", focus: "Test de progression", progression: 1.05, tipKey: "test", isBilan: false, isTest: true });
  for (let i = 0; i < 3; i++) {
    const t = i / 2;
    phases.push({ phase: "development", focus: t < 0.5 ? "Développement" : "Travail au seuil", progression: 1.20 + t * 0.18, tipKey: "seuil", isBilan: false, isTest: false });
  }
  phases.push({ phase: "test", focus: "Contrôle allure", progression: 1.25, tipKey: "test", isBilan: false, isTest: true });
  for (let i = 0; i < 3; i++) {
    const t = i / 2;
    phases.push({ phase: "peak", focus: t < 0.5 ? "Intensité max" : "Volume maximum", progression: 1.40 + t * 0.12, tipKey: "vitesse", isBilan: false, isTest: false });
  }
  phases.push({ phase: "bilan", focus: "Bilan & récupération", progression: 1.0, tipKey: "affutage", isBilan: true, isTest: false });
  return phases;
};

const buildWellnessPhases = (totalWeeks) => {
  const phases = [];
  const testAt = totalWeeks >= 6 ? Math.floor(totalWeeks / 2) : -1;
  for (let i = 0; i < totalWeeks; i++) {
    if (i === testAt) {
      phases.push({
        phase: "test",
        focus: "Test de progression",
        progression: 1.1,
        tipKey: "test",
        isTest: true,
      });
      continue;
    }
    const t = totalWeeks > 1 ? i / (totalWeeks - 1) : 0;
    const isBase = t < 0.5;
    phases.push({
      phase: isBase ? "base" : "development",
      focus: t < 0.25 ? "Mise en mouvement" : t < 0.5 ? "Construction" : t < 0.75 ? "Progression" : "Consolidation",
      progression: 1.0 + t * 0.35,
      tipKey: t < 0.4 ? "debut" : "endurance",
      isTest: false,
    });
  }
  return phases;
};

const buildPlanPhases = (totalWeeks) => {
  if (totalWeeks === 1) return [{ phase: "competition", focus: "Semaine de compétition", progression: 0.60, tipKey: "competition" }];
  if (totalWeeks === 2) return [{ phase: "base", focus: "Mise en jambes", progression: 1.00, tipKey: "debut" }, { phase: "competition", focus: "Semaine de compétition", progression: 0.60, tipKey: "competition" }];
  if (totalWeeks === 3) return [
    { phase: "base", focus: "Mise en jambes", progression: 1.00, tipKey: "debut" },
    { phase: "development", focus: "Développement", progression: 1.20, tipKey: "endurance" },
    { phase: "competition", focus: "Semaine de compétition", progression: 0.60, tipKey: "competition" },
  ];
  if (totalWeeks === 4) return [
    { phase: "base", focus: "Mise en jambes", progression: 1.00, tipKey: "debut" },
    { phase: "development", focus: "Développement", progression: 1.20, tipKey: "endurance" },
    { phase: "test", focus: "Test de progression", progression: 1.10, tipKey: "test", isTest: true },
    { phase: "competition", focus: "Semaine de compétition", progression: 0.60, tipKey: "competition" },
  ];

  // Affûtage : 2 semaines si plan long (≥10), sinon 1 dès 6 semaines
  const compWeeks = 1;
  const taperWeeks = totalWeeks >= 10 ? 2 : totalWeeks >= 6 ? 1 : 0;
  // Tests : 2 si ≥10 sem, 1 si ≥5
  const testSlots = totalWeeks >= 10 ? 2 : totalWeeks >= 5 ? 1 : 0;
  const remaining = totalWeeks - compWeeks - taperWeeks - testSlots;
  const peakCount = Math.max(1, Math.round(remaining * 0.20));
  const devCount = Math.max(1, Math.round(remaining * 0.38));
  const baseCount = Math.max(1, remaining - peakCount - devCount);
  const phases = [];

  for (let i = 0; i < baseCount; i++) {
    const t = baseCount > 1 ? i / (baseCount - 1) : 0;
    phases.push({ phase: "base", focus: t < 0.45 ? "Mise en jambes" : "Construction aérobie", progression: 1.0 + t * 0.28, tipKey: t < 0.45 ? "debut" : "aerobie", isTest: false });
  }
  if (testSlots >= 1) {
    phases.push({ phase: "test", focus: "Test de progression", progression: 1.10, tipKey: "test", isTest: true });
  }
  for (let i = 0; i < devCount; i++) {
    const t = devCount > 1 ? i / (devCount - 1) : 0;
    phases.push({ phase: "development", focus: t < 0.5 ? "Développement endurance" : "Travail au seuil", progression: 1.28 + t * 0.22, tipKey: t < 0.5 ? "endurance" : "seuil", isTest: false });
  }
  if (testSlots >= 2) {
    phases.push({ phase: "test", focus: "Contrôle allure", progression: 1.30, tipKey: "test", isTest: true });
  }
  for (let i = 0; i < peakCount; i++) {
    const t = peakCount > 1 ? i / (peakCount - 1) : 0;
    phases.push({ phase: "peak", focus: t < 0.5 ? "Intensité & vitesse" : "Volume maximum", progression: 1.50 + t * 0.10, tipKey: t < 0.5 ? "vitesse" : "volume", isTest: false });
  }
  if (taperWeeks === 2) {
    phases.push({ phase: "taper", focus: "Affûtage — volume ↓", progression: 1.10, tipKey: "affutage", isTest: false });
    phases.push({ phase: "taper", focus: "Affûtage final", progression: 0.90, tipKey: "affutage", isTest: false });
  } else if (taperWeeks === 1) {
    phases.push({ phase: "taper", focus: "Affûtage", progression: 1.05, tipKey: "affutage", isTest: false });
  }
  phases.push({ phase: "competition", focus: "Semaine de compétition", progression: 0.60, tipKey: "competition", isTest: false });
  return phases;
};

const FREE_MAX_WEEKS = FREE_WEEKS_LIMIT;

const computePlanTotalWeeks = (profile, referenceTime = Date.now()) => {
  const { goal } = profile;
  const wellness = isWellnessGoal(goal);
  const progression = isProgressionGoal(goal);

  if (progression) return 12;

  if (wellness) {
    if (goal === "perte_de_poids") {
      const loss = Math.max(0, (parseFloat(profile.weightCurrent) || 0) - (parseFloat(profile.weightGoal) || 0));
      return loss > 0 ? Math.min(16, Math.max(4, Math.ceil(loss * 2))) : 8;
    }
    if (goal === "reprendre") return 6;
    return 8;
  }

  const eventDate = profile.eventDate ? new Date(profile.eventDate) : null;
  if (!eventDate || Number.isNaN(eventDate.getTime())) return 8;
  const refDate = new Date(referenceTime);
  return Math.min(52, Math.max(1, Math.ceil((eventDate - refDate) / (7 * 86400000))) || 8);
};

const generatePlan = async (profile, isPremium = false, referenceTime = Date.now(), { skipDelay = false } = {}) => {
  const templatesP = loadSessionTemplates(supabase);
  if (!skipDelay) await new Promise(r => setTimeout(r, 1800));
  await templatesP;
  const { level, sessionsPerWeek: freq, pool, goal } = profile;

  // Active les paces personnalisées pour toute la génération du plan
  _pace100 = profile.pace100 && profile.pace100 > 0 ? profile.pace100 : null;
  _zoneMult = appZoneMultForT100(_pace100);
  _isPremium = !!isPremium;
  const wellness = isWellnessGoal(goal);
  const progression = isProgressionGoal(goal);
  const rawWeeks = computePlanTotalWeeks(profile, referenceTime);

  const baseDist = BASE_DISTANCES[level] || BASE_DISTANCES.régulier;
  const progressionPhaseList = progression ? buildProgressionPhases() : null;
  const phaseList = progression ? progressionPhaseList.slice(0, rawWeeks) : wellness ? buildWellnessPhases(rawWeeks) : buildPlanPhases(rawWeeks);
  // Résolution du levelKey pour les patterns : priorité aux nouveaux niveaux, fallback anciens
  const levelKey = (PHASE_PATTERNS[level] ? level : (level === "advanced" ? "performance" : level === "beginner" ? "régulier" : level === "intermediate" ? "sportif" : "régulier"));
  // PROGRESSION_PATTERNS et WELLNESS_PATTERNS sont indexés par "beginner"/"intermediate"/"advanced"
  const progLvlKey = getLvlIndex(level) >= 3 ? "advanced" : getLvlIndex(level) >= 2 ? "intermediate" : "beginner";
  const patterns = progression ? (PROGRESSION_PATTERNS[progLvlKey] || PROGRESSION_PATTERNS.intermediate)
                 : wellness   ? (WELLNESS_PATTERNS[progLvlKey] || WELLNESS_PATTERNS.intermediate)
                 : (goal === "bnssa" || goal === "tests_pompiers" || goal === "caepmns") ? BNSSA_PATTERNS
                 : isOpenWaterGoal(goal) ? (OPEN_WATER_PATTERNS[levelKey] || OPEN_WATER_PATTERNS.sportif)
                 : (PHASE_PATTERNS[levelKey] || PHASE_PATTERNS.régulier);
  const f = Math.min(isPremium ? freq : Math.min(freq ?? FREE_FREQ_LIMIT, FREE_FREQ_LIMIT), 5);
  const buildWeeks = (phases) => phases.map((phase, wi) => {
    // Semaine compétition : 1 séance (≤3×/sem) ou 2 (>3), volume ultra-bas
    if (phase.phase === "competition") {
      const n = competitionSessionCount(f);
      const isBeg = level === "découverte" || level === "beginner";
      return {
        number: wi + 1,
        focus: phase.focus,
        tip: COMPETITION_TIP,
        feedback: null,
        isBilan: phase.isBilan ?? false,
        isTest: phase.isTest ?? false,
        sessions: buildCompetitionSessions(pool, n, wi + 1, phase.focus, isBeg),
      };
    }
    const types = patterns[phase.phase]?.[f] || patterns.base[f] || ["endurance"];
    return {
      number: wi + 1, focus: phase.focus, tip: TIPS[phase.tipKey], feedback: null, isBilan: phase.isBilan ?? false, isTest: phase.isTest ?? false,
      sessions: types.map((type, si) => {
        const distBase = Math.round(baseDist[type] * phase.progression / 50) * 50;
        let sessionData = SESSION_TEMPLATES[type](distBase, pool, level, wi * 10 + si, goal);
        const realDist = calcSessionDistance(sessionData.details);
        const deficit = distBase - realDist;
        const fillRep = deficit >= 2000 ? 400 : deficit >= 800 ? 200 : pool * 2;
        const nFill = deficit >= fillRep ? Math.round(deficit / fillRep) : 0;
        let details = sessionData.details;
        if (nFill > 0) {
          const last = details[details.length - 1];
          const hasCooldown = last && (last.toLowerCase().includes('calme') || last.toLowerCase().includes('retour'));
          const fillLine = `${nFill}×${fillRep}m NL — R20" — allure régulière, respiration toutes les 3 tractions`;
          details = hasCooldown
            ? [...details.slice(0, -1), fillLine, last]
            : [...details, fillLine];
        }
        const dist = calcSessionDistance(details);
        return { ...sessionData, details, distance: `${dist}m`, duration: Math.max(30, Math.min(120, Math.round(dist / 38))), completed: false, skipped: null };
      }),
    };
  });
  const allWeeks = shouldUseCoachGenerator(goal)
    ? buildCoachPlanWeeks(profile, phaseList, isPremium, TIPS, FREE_FREQ_LIMIT)
    : buildWeeks(phaseList);
  const weeks = isPremium ? allWeeks : allWeeks.slice(0, FREE_MAX_WEEKS);
  const previewWeeks = isPremium || rawWeeks <= FREE_MAX_WEEKS ? [] : allWeeks.slice(FREE_MAX_WEEKS, FREE_MAX_WEEKS + 3);
  return { weeks, previewWeeks, totalRealWeeks: rawWeeks, isPremium, isProgression: progression, startDate: Date.now(), version: PLAN_VERSION };
};

// ── APP ───────────────────────────────────────────────────────────────────
const BLANK_PROFILE = { category: "", goal: "", eventDate: "", level: "", pool: 50, sessionsPerWeek: null, weightCurrent: "", weightGoal: "", pace100: null };

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeSoftContext, setUpgradeSoftContext] = useState(null);
  const [softPaywallPending, setSoftPaywallPending] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      return normalizeTheme(localStorage.getItem(THEME_LAST_KEY) || getStoredTheme());
    } catch {
      return "light";
    }
  });
  const forceAuthRef = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();
  const locationRef = useRef(location);
  locationRef.current = location;
  const authOpenedFromUrlRef = useRef(false);
  // Hydratation initiale : si un plan anonyme existe en local, on saute l'onboarding et on l'affiche directement.
  const [screen, setScreen] = useState(() => {
    if (isAuthPath(window.location.pathname)) return "auth";
    try {
      const raw = localStorage.getItem("myswym_anon_plans");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return "app";
      }
    } catch {}
    return "onboarding";
  });
  const [activeTab, setActiveTab] = useState("home");
  const [step, setStep] = useState(1);
  // Onboarding draft profile (reset à chaque nouveau plan)
  const [profile, setProfile] = useState(BLANK_PROFILE);
  // Multi-plan — hydratés depuis localStorage anonyme si présent (utilisateur pas encore connecté)
  const [plans, setPlans] = useState(() => {
    try {
      const raw = localStorage.getItem("myswym_anon_plans");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  const [activePlanId, setActivePlanId] = useState(() => {
    try {
      const raw = localStorage.getItem("myswym_anon_plans");
      const active = localStorage.getItem("myswym_anon_active");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return active || parsed[0].id;
        }
      }
    } catch {}
    return null;
  });
  const [addingPlan, setAddingPlan] = useState(false);
  const [error, setError] = useState(null);
  const [feedbackWeek, setFeedbackWeek] = useState(null);
  const [sessionFeedbackTarget, setSessionFeedbackTarget] = useState(null);
  /** Goûts compte (EMA retours) — miroir aussi sur plan.taste pour offline / régénération */
  const [tasteProfile, setTasteProfile] = useState(() => {
    try {
      const anon = localStorage.getItem("myswym_anon_taste");
      if (anon) return normalizeTaste(JSON.parse(anon));
    } catch {}
    return blankTaste();
  });
  const [shareSession, setShareSession] = useState(null);
  const [newBadgeId, setNewBadgeId] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (msg, duration = 5000) => { setToast(msg); setTimeout(() => setToast(null), duration); };
  const prevBadgesRef = useRef([]);
  const plansHydratedRef = useRef(false);
  const deletedPlanIdsRef = useRef(new Set());
  /** Incrémente à chaque tentative de save — empêche un upsert obsolète d'écraser un 3× tout juste régénéré. */
  const plansSaveGenRef = useRef(0);

  // Valeurs dérivées du plan actif
  const activePlanEntry = plans.find(e => e.id === activePlanId) ?? null;
  const plan            = activePlanEntry?.plan    ?? null;
  const activeProfile   = activePlanEntry?.profile ?? BLANK_PROFILE;

  // Back button → landing page
  useEffect(() => {
    const handlePop = () => {
      const p = window.location.pathname;
      if (!p.startsWith("/app") && !isAuthPath(p)) {
        window.location.replace("/");
      }
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  // Routes auth : /connexion, /inscription (+ anciens liens ?auth=…)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const legacyAuth = params.get("auth");
    if (legacyAuth === "login") {
      navigate("/connexion", { replace: true });
      return;
    }
    if (legacyAuth === "register") {
      navigate("/inscription", { replace: true });
      return;
    }
    if (isAuthPath(location.pathname)) {
      authOpenedFromUrlRef.current = true;
      forceAuthRef.current = true;
      setScreen("auth");
    }
  }, [location.pathname, location.search, navigate]);

  const openAuth = (mode = "password") => {
    forceAuthRef.current = true;
    navigate(mode === "register" ? "/inscription" : "/connexion");
  };

  const openUpgrade = (softContext = null) => {
    setUpgradeSoftContext(softContext);
    setShowUpgrade(true);
  };
  const closeUpgrade = () => {
    setShowUpgrade(false);
    setUpgradeSoftContext(null);
  };

  // Soft paywall après la 1ʳᵉ séance : attendre la fermeture des sheets feedback.
  useEffect(() => {
    if (!softPaywallPending || isPremium || showUpgrade) return;
    if (sessionFeedbackTarget !== null || feedbackWeek !== null) return;
    let cancelled = false;
    const t = setTimeout(() => {
      if (cancelled) return;
      try {
        if (localStorage.getItem(SOFT_PAYWALL_STORAGE_KEY)) {
          setSoftPaywallPending(false);
          return;
        }
        localStorage.setItem(SOFT_PAYWALL_STORAGE_KEY, "1");
      } catch { /* ignore */ }
      setSoftPaywallPending(false);
      openUpgrade("after_first_session");
    }, 1100);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [softPaywallPending, isPremium, showUpgrade, sessionFeedbackTarget, feedbackWeek]);

  const handleAuthNavigateMode = (mode) => {
    navigate(mode === "register" ? "/inscription" : "/connexion", { replace: true });
  };

  const handleAuthBack = () => {
    forceAuthRef.current = false;
    authOpenedFromUrlRef.current = false;
    setScreen(plans.length > 0 ? "app" : "onboarding");
    navigate(plans.length > 0 ? "/" : "/accueil", { replace: true });
  };

  const handleAuthSuccess = (u) => {
    setUser(u);
    forceAuthRef.current = false;
    authOpenedFromUrlRef.current = false;
    navigate("/", { replace: true });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    if (!payment) return;
    window.history.replaceState({}, "", window.location.pathname);

    const applyUser = (u) => {
      if (!u) return;
      setUser(u);
      const premium = checkIsPremium(u);
      setIsPremium(premium);
      if (premium) closeUpgrade();
    };

    const syncAndApply = () => syncSubscriptionFromStripe()
      .then(u => applyUser(u))
      .catch(() => supabase.auth.refreshSession().then(({ data }) => applyUser(data?.user)));

    if (payment === "success" || payment === "portal") {
      syncAndApply();
      if (payment === "success") {
        showToast("Activation en cours… Si ça tarde, clique sur « Actualiser le statut » dans Profil.", 8000);
      }
      const retry = (ms) => setTimeout(syncAndApply, ms);
      const t1 = retry(2000);
      const t2 = retry(5000);
      const t3 = retry(10000);
      const t4 = retry(20000);
      const t5 = retry(30000);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
    }

    supabase.auth.refreshSession().then(({ data }) => applyUser(data?.user));
  }, []);

  // ── Strava OAuth callback ────────────────────────────────────────────────
  // Strava redirige vers {origin}?code=...&state=strava_connect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code   = params.get("code");
    const state  = params.get("state");
    if (state !== "strava_connect" || !code) return;

    // Nettoie l'URL immédiatement
    window.history.replaceState({}, "", window.location.pathname);

    const handle = async () => {
      // Attend que la session soit prête (l'utilisateur était déjà connecté avant le redirect)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { showToast("Erreur Strava : session expirée, reconnecte-toi.", 8000); return; }

      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/strava-callback`,
          {
            method: "POST",
            headers: {
              "Content-Type":  "application/json",
              "Authorization": `Bearer ${session.access_token}`,
              "apikey":        import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ code }),
          }
        );
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        showToast(`Strava connecté${json.athlete ? ` — Bonjour ${json.athlete}` : ""} · Synchronisation en cours…`, 6000);
        setActiveTab("profile");
      } catch (e) {
        showToast(`Erreur Strava : ${e.message}`, 8000);
        setActiveTab("profile");
      }
    };

    // Petit délai pour laisser onAuthStateChange s'initialiser si nécessaire
    const t = setTimeout(handle, 400);
    return () => clearTimeout(t);
  }, []);

  // Régénère le plan actif quand le premium est débloqué et que le plan était tronqué
  useEffect(() => {
    if (!isPremium || !activePlanEntry) return;
    const { plan: ap, profile: aprof } = activePlanEntry;
    if (!aprof?.goal || !ap?.weeks) return;
    const originalStartDate = ap.startDate ?? activePlanEntry.startDate ?? Date.now();
    const expectedWeeks = computePlanTotalWeeks(aprof, originalStartDate);
    const storedWeeks = ap.totalRealWeeks ?? 0;
    const needsLegacyRepair = ap.weeks.length <= FREE_WEEKS_LIMIT && expectedWeeks > ap.weeks.length;
    const needsMoreWeeks = Math.max(storedWeeks, expectedWeeks) > ap.weeks.length;
    const needsMetadataRepair = storedWeeks > 0 && storedWeeks < expectedWeeks;
    if (!needsLegacyRepair && !needsMoreWeeks && !needsMetadataRepair) return;
    setScreen("loading");
    const taste = ap.taste || tasteProfile;
    generatePlan({ ...aprof, taste }, true, originalStartDate).then(newPlan => {
      const mergedWeeks = mergePreservingProgress(ap.weeks ?? [], newPlan.weeks);
      const planWithDate = {
        ...newPlan,
        taste,
        weeks: mergedWeeks,
        previewWeeks: [],
        ...(originalStartDate ? { startDate: originalStartDate } : {}),
      };
      setPlans(prev => prev.map(e => e.id === activePlanId ? { ...e, plan: planWithDate } : e));
      setScreen("app"); setActiveTab("home");
    });
  }, [isPremium, activePlanEntry, activePlanId, tasteProfile]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        // Lien de réinitialisation cliqué → afficher l'écran de nouveau mot de passe
        setUser(session?.user ?? null);
        setIsRecovery(true);
        setAuthLoading(false);
        return;
      }
      const u = session?.user ?? null;
      setUser(u);
      setIsPremium(checkIsPremium(u));
      if (u) {
        forceAuthRef.current = false;
        loadUserData(u.id, checkIsPremium(u)).finally(() => setAuthLoading(false));
        // Resync Stripe → app_metadata à chaque session (ferme les falsifications user_metadata)
        if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
          syncSubscriptionFromStripe()
            .then((synced) => {
              if (!synced) return;
              setUser(synced);
              const premium = checkIsPremium(synced);
              setIsPremium(premium);
              if (premium !== checkIsPremium(u)) loadUserData(synced.id, premium);
            })
            .catch(() => {});
        }
      } else if (forceAuthRef.current || isAuthPath(locationRef.current.pathname)) {
        setScreen("auth");
        setAuthLoading(false);
      } else {
        plansHydratedRef.current = false;
        setScreen("onboarding"); setStep(1); setProfile(BLANK_PROFILE); setPlans([]); setActivePlanId(null); setTasteProfile(blankTaste()); setAuthLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Banque séances Supabase (lecture publique) — avant / pendant generatePlan
  useEffect(() => {
    loadSessionTemplates(supabase);
  }, []);

  async function loadUserData(userId, userIsPremium = false) {
    const enforce = (p) => (!userIsPremium && p?.weeks) ? { ...p, weeks: p.weeks.slice(0, FREE_WEEKS_LIMIT) } : p;

    // Goûts compte (Supabase) — fallback localStorage + migration anon
    let loadedTaste = blankTaste();
    let anonTaste = blankTaste();
    try {
      const anonRaw = localStorage.getItem("myswym_anon_taste");
      if (anonRaw) anonTaste = normalizeTaste(JSON.parse(anonRaw));
    } catch {}
    try {
      const { data: tasteRow } = await supabase
        .from("user_taste_profile")
        .select("scores")
        .eq("user_id", userId)
        .maybeSingle();
      if (tasteRow?.scores) loadedTaste = normalizeTaste(tasteRow.scores);
      else {
        const raw = localStorage.getItem(`myswym_taste_${userId}`);
        if (raw) loadedTaste = normalizeTaste(JSON.parse(raw));
      }
    } catch {
      try {
        const raw = localStorage.getItem(`myswym_taste_${userId}`);
        if (raw) loadedTaste = normalizeTaste(JSON.parse(raw));
      } catch {}
    }
    loadedTaste = mergeTasteProfiles(loadedTaste, anonTaste);
    setTasteProfile(loadedTaste);
    if (loadedTaste.sampleCount > 0) {
      try { localStorage.setItem(`myswym_taste_${userId}`, JSON.stringify(loadedTaste)); } catch {}
      supabase.from("user_taste_profile").upsert({
        user_id: userId,
        scores: loadedTaste,
        updated_at: new Date().toISOString(),
      }).then(() => {
        try { localStorage.removeItem("myswym_anon_taste"); } catch {}
      });
    }

    // Lit le plan anonyme à migrer (créé par l'utilisateur avant qu'il ne se connecte)
    let anonPlans = [];
    let anonActive = null;
    try {
      const anonRaw = localStorage.getItem("myswym_anon_plans");
      if (anonRaw) {
        const parsed = JSON.parse(anonRaw);
        if (Array.isArray(parsed) && parsed.length > 0) anonPlans = parsed;
      }
      anonActive = localStorage.getItem("myswym_anon_active");
    } catch {}

    // Merge le plan anon avec les plans existants (dédupliqué par empreinte profil)
    // puis nettoie la clé anonyme une fois la migration faite.
    const finalize = (existing, existingActive) => {
      let merged = dedupePlans(existing || []);
      let active = existingActive || null;
      if (anonPlans.length > 0) {
        const fps = new Set(merged.map(planFingerprint));
        const toAdd = anonPlans.filter(e => !fps.has(planFingerprint(e)));
        merged = dedupePlans([...merged, ...toAdd]);
        if (!active && anonActive) active = anonActive;
        if (!active && merged.length > 0) active = merged[0].id;
        if (active && !merged.some(e => e.id === active)) active = merged[0]?.id ?? null;
        try {
          localStorage.removeItem("myswym_anon_plans");
          localStorage.removeItem("myswym_anon_active");
        } catch {}
      }
      if (merged.length > 0) {
        setPlans(merged);
        setActivePlanId(active || merged[0].id);
        setScreen("app");
        plansHydratedRef.current = true;
        return true;
      }
      return false;
    };

    const enforceAll = (arr) => (arr || []).map(e => ({ ...e, plan: enforce(e.plan) }));
    const cachePlans = (arr, activeId, updatedAt) => {
      try {
        const ts = updatedAt || new Date().toISOString();
        localStorage.setItem(`myswym_plans_${userId}`, JSON.stringify(arr));
        localStorage.setItem(`myswym_active_${userId}`, activeId || arr[0].id);
        localStorage.setItem(`myswym_plans_updated_${userId}`, ts);
      } catch {}
    };

    // 1. localStorage (cache hors-ligne)
    let localPlans = null, localActive = null, localUpdatedAt = 0;
    try {
      const raw = localStorage.getItem(`myswym_plans_${userId}`);
      localActive = localStorage.getItem(`myswym_active_${userId}`);
      const ts = localStorage.getItem(`myswym_plans_updated_${userId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) localPlans = parsed;
      }
      if (ts) localUpdatedAt = new Date(ts).getTime() || 0;
    } catch {}

    // 2. Supabase — source de vérité cross-device (comparée au cache local)
    let remotePlans = null, remoteActive = null, remoteUpdatedAt = 0, remoteUpdatedIso = null;
    try {
      const { data, error } = await supabase.from("user_plans")
        .select("profile, plan, plans_json, active_plan_id, updated_at")
        .eq("user_id", userId).single();
      if (data && !error) {
        remoteUpdatedIso = data.updated_at || null;
        if (data.updated_at) remoteUpdatedAt = new Date(data.updated_at).getTime() || 0;
        if (Array.isArray(data.plans_json) && data.plans_json.length > 0) {
          remotePlans = data.plans_json;
          remoteActive = data.active_plan_id;
        } else if (data.profile && data.plan) {
          const id = `plan_${Date.now()}`;
          remotePlans = [{ id, profile: data.profile, plan: data.plan }];
          remoteActive = id;
        }
      }
    } catch {}

    let chosenPlans = null, chosenActive = null, chosenUpdatedIso = null;
    if (localPlans || remotePlans) {
      const merged = mergePlanLists(localPlans, remotePlans, localActive, remoteActive, localUpdatedAt, remoteUpdatedAt);
      chosenPlans = merged.plans;
      chosenActive = merged.active;
      chosenUpdatedIso = merged.updatedAt;
    }

    if (chosenPlans?.length) {
      const enforced = enforceAll(chosenPlans);
      cachePlans(enforced, chosenActive, chosenUpdatedIso);
      if (finalize(enforced, chosenActive)) return;
    }

    // 3. Ancien localStorage mono-plan (migration)
    try {
      const sp  = localStorage.getItem(`myswym_profile_${userId}`);
      const spl = localStorage.getItem(`myswym_plan_${userId}`);
      if (sp && spl) {
        const id = `plan_${Date.now()}`;
        const entry = { id, profile: JSON.parse(sp), plan: enforce(JSON.parse(spl)) };
        if (finalize([entry], id)) return;
      }
    } catch {}

    // 4. Aucun plan existant — si on a un plan anonyme, on le promeut comme plan principal
    // Sinon, on bascule sur l'onboarding pour qu'il puisse créer son premier plan.
    if (!finalize([], null)) {
      plansHydratedRef.current = true;
      setScreen("onboarding");
      setStep(1);
    }
  }

  // Vérifie le statut abonnement automatiquement (retour sur l'app + toutes les 5 min)
  useEffect(() => {
    if (!user) return;
    const check = async () => {
      try {
        const u = await syncSubscriptionFromStripe();
        if (u) {
          setUser(u);
          setIsPremium(checkIsPremium(u));
        }
      } catch {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setUser(data.user);
          setIsPremium(checkIsPremium(data.user));
        }
      }
    };
    const onVisible = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", onVisible);
    const interval = setInterval(check, 5 * 60 * 1000);
    return () => { document.removeEventListener("visibilitychange", onVisible); clearInterval(interval); };
  }, [user?.id]);

  // Persistance anonyme : tant qu'il n'y a pas d'utilisateur, on sauvegarde les plans localement
  // pour qu'ils survivent au refresh. Au login, ils sont migrés vers la clé user (cf. loadUserData).
  useEffect(() => {
    if (user) return;
    try {
      if (plans.length > 0) {
        localStorage.setItem("myswym_anon_plans", JSON.stringify(plans));
        if (activePlanId) localStorage.setItem("myswym_anon_active", activePlanId);
      } else {
        localStorage.removeItem("myswym_anon_plans");
        localStorage.removeItem("myswym_anon_active");
      }
    } catch {}
  }, [plans, activePlanId, user]);

  useEffect(() => {
    if (!user || plans.length === 0 || !plansHydratedRef.current) return;
    const saveGen = ++plansSaveGenRef.current;
    const save = async () => {
      const now = new Date().toISOString();
      let toSave = plans;
      let activeToSave = activePlanId;
      try {
        const { data } = await supabase.from("user_plans")
          .select("plans_json, active_plan_id, updated_at")
          .eq("user_id", user.id).single();
        // Un save plus récent a démarré (ex. passage 2×→3×) → abandonner celui-ci
        if (saveGen !== plansSaveGenRef.current) return;
        if (Array.isArray(data?.plans_json) && data.plans_json.length > 0) {
          const remoteTime = data.updated_at ? new Date(data.updated_at).getTime() : 0;
          const localTs = localStorage.getItem(`myswym_plans_updated_${user.id}`);
          const localTime = localTs ? new Date(localTs).getTime() : 0;
          // Si le cache local est plus récent (ex. freq 2×→3× juste écrite), ne pas
          // re-fusionner avec un remote périmé — ça peut réécrire l'ancien plan.
          if (localTime > remoteTime) {
            toSave = plans;
            activeToSave = activePlanId;
          } else {
            const { plans: merged, active } = mergePlanLists(
              plans, data.plans_json, activePlanId, data.active_plan_id, localTime, remoteTime, activePlanId, deletedPlanIdsRef.current
            );
            const missingOnDevice = merged.some(m => !plans.find(p => p.id === m.id));
            if (missingOnDevice) {
              if (saveGen !== plansSaveGenRef.current) return;
              setPlans(merged);
              setActivePlanId(active);
              return;
            }
            toSave = merged;
            activeToSave = active;
          }
        }
      } catch {}
      if (saveGen !== plansSaveGenRef.current) return;
      try {
        localStorage.setItem(`myswym_plans_${user.id}`, JSON.stringify(toSave));
        localStorage.setItem(`myswym_active_${user.id}`, activeToSave);
        localStorage.setItem(`myswym_plans_updated_${user.id}`, now);
      } catch {}
      const activeEntry = toSave.find(e => e.id === activeToSave) ?? toSave[0];
      // Dernière barrière avant l'écriture remote (évite qu'un upsert 2× parte après un 3×)
      if (saveGen !== plansSaveGenRef.current) return;
      const { error } = await supabase.from("user_plans").upsert({
        user_id:        user.id,
        plans_json:     toSave,
        active_plan_id: activeToSave,
        profile:        activeEntry?.profile ?? null,
        plan:           activeEntry?.plan    ?? null,
        updated_at:     now,
      }, { onConflict: "user_id" });
      // Si un save plus récent a démarré pendant l'upsert, une écriture stale a pu
      // atterrir : on re-pousse immédiatement le cache local (source de vérité UI).
      if (saveGen !== plansSaveGenRef.current) {
        try {
          const raw = localStorage.getItem(`myswym_plans_${user.id}`);
          const activeId = localStorage.getItem(`myswym_active_${user.id}`);
          const ts = localStorage.getItem(`myswym_plans_updated_${user.id}`) || new Date().toISOString();
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const entry = parsed.find(e => e.id === activeId) ?? parsed[0];
              await supabase.from("user_plans").upsert({
                user_id:        user.id,
                plans_json:     parsed,
                active_plan_id: activeId || parsed[0].id,
                profile:        entry?.profile ?? null,
                plan:           entry?.plan ?? null,
                updated_at:     ts,
              }, { onConflict: "user_id" });
            }
          }
        } catch {}
        return;
      }
      if (error) return;
      // Les suppressions sont bien persistées : on peut oublier les tombstones
      for (const id of [...deletedPlanIdsRef.current]) {
        if (!toSave.some(e => e.id === id)) deletedPlanIdsRef.current.delete(id);
      }
    };
    save();
  }, [plans, activePlanId, user]);

  // Re-sync au retour sur l'app : fusionne cache local + Supabase (ne jamais écraser un plan d'un autre appareil)
  useEffect(() => {
    if (!user) return;
    const syncFromRemote = async () => {
      try {
        let localPlans = [];
        const localRaw = localStorage.getItem(`myswym_plans_${user.id}`);
        const localActive = localStorage.getItem(`myswym_active_${user.id}`);
        const localTs = localStorage.getItem(`myswym_plans_updated_${user.id}`);
        const localTime = localTs ? new Date(localTs).getTime() : 0;
        if (localRaw) {
          const parsed = JSON.parse(localRaw);
          if (Array.isArray(parsed)) localPlans = parsed;
        }

        const { data, error } = await supabase.from("user_plans")
          .select("plans_json, active_plan_id, updated_at")
          .eq("user_id", user.id).single();
        if (error) return;
        const remotePlans = Array.isArray(data?.plans_json) ? data.plans_json : [];
        const remoteTime = data?.updated_at ? new Date(data.updated_at).getTime() : 0;
        if (!localPlans.length && !remotePlans.length) return;

        const enforce = (p) => (!isPremium && p?.weeks) ? { ...p, weeks: p.weeks.slice(0, FREE_WEEKS_LIMIT) } : p;
        const { plans: merged, active, updatedAt } = mergePlanLists(
          localPlans, remotePlans, localActive, data?.active_plan_id, localTime, remoteTime, activePlanId, deletedPlanIdsRef.current
        );
        const enforced = merged.map(e => ({ ...e, plan: enforce(e.plan) }));

        const mergedIds = enforced.map(e => e.id).sort().join(",");
        const currentIds = plans.map(e => e.id).sort().join(",");
        const mergedProgress = enforced.reduce((s, e) => s + planProgressScore(e), 0);
        const currentProgress = plans.reduce((s, e) => s + planProgressScore(e), 0);
        // Ne pas écraser un changement de fréquence local (2×→3×) si la progression est égale
        const localFreq = plans.find(e => e.id === activePlanId)?.profile?.sessionsPerWeek;
        const mergedFreq = enforced.find(e => e.id === active)?.profile?.sessionsPerWeek;
        if (
          mergedIds === currentIds
          && enforced.length === plans.length
          && mergedProgress <= currentProgress
          && (mergedProgress < currentProgress || localFreq === mergedFreq || localTime >= remoteTime)
        ) return;

        setPlans(enforced);
        setActivePlanId(active);
        localStorage.setItem(`myswym_plans_${user.id}`, JSON.stringify(enforced));
        localStorage.setItem(`myswym_active_${user.id}`, active);
        localStorage.setItem(`myswym_plans_updated_${user.id}`, updatedAt);
      } catch {}
    };
    const onVisible = () => { if (document.visibilityState === "visible") syncFromRemote(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [user?.id, isPremium, plans, activePlanId]);


  // Migration : plans version < PLAN_VERSION — régénère le contenu, merge avec progression.
  // FORCE_PLAN_REGEN = true uniquement pour un bump volontaire ; sinon mergePreservingProgress.
  // v31 : force full overwrite tous plans (re-trigger après v30).
  useEffect(() => {
    if (plans.length === 0 || screen !== "app") return;
    const needsUpdate = plans.filter(e => e.plan && (e.plan.version ?? 0) < PLAN_VERSION);
    if (needsUpdate.length === 0) return;

    let cancelled = false;
    Promise.all(needsUpdate.map(async entry => {
      const p = entry.plan;
      const originalStartDate = p.startDate ?? entry.startDate ?? null;
      const premium = !!(entry.plan?.isPremium || isPremium);
      const taste = p.taste || tasteProfile;
      const generated = await generatePlan(
        { ...entry.profile, taste },
        premium,
        originalStartDate || Date.now(),
        { skipDelay: true },
      );
      const weeks = FORCE_PLAN_REGEN
        ? generated.weeks
        : mergePreservingProgress(p.weeks ?? [], generated.weeks);
      return {
        id: entry.id,
        updated: {
          ...generated,
          taste,
          weeks,
          startDate: originalStartDate || generated.startDate,
          version: PLAN_VERSION,
        },
      };
    })).then(results => {
      if (cancelled) return;
      setPlans(prev => prev.map(e => {
        const r = results.find(x => x.id === e.id);
        return r ? { ...e, plan: r.updated, startDate: r.updated.startDate ?? e.startDate } : e;
      }));
    });
    return () => { cancelled = true; };
  }, [user?.id, screen, isPremium, plans.length]);

  useEffect(() => {
    if (!plan) return;
    const stats   = computeStats(plan);
    const current = checkBadges(stats);
    const prev    = prevBadgesRef.current;
    const newOnes = current.filter(b => !prev.includes(b));
    if (newOnes.length > 0 && prev.length > 0) { setNewBadgeId(newOnes[0]); setTimeout(() => setNewBadgeId(null), 3200); }
    prevBadgesRef.current = current;
  }, [activePlanId, plan]);

  const update = (key, val) => setProfile(p => ({ ...p, [key]: val }));

  const handleGenerate = async () => {
    setScreen("loading"); setError(null);
    try {
      let genProfile = !isPremium && profile.sessionsPerWeek > FREE_FREQ_LIMIT
        ? { ...profile, sessionsPerWeek: FREE_FREQ_LIMIT, taste: tasteProfile }
        : { ...profile, taste: tasteProfile };
      // Découverte : jamais de T100 (souvent incapables d'enchaîner 100 m)
      if (genProfile.level === "découverte" || genProfile.level === "beginner") {
        genProfile = { ...genProfile, pace100: null };
      }
      const p  = await generatePlan(genProfile, isPremium);
      const id = `plan_${Date.now()}`;
      let entryProfile = { ...genProfile };
      delete entryProfile.taste; // goûts = compte (plan.taste + user_taste_profile), pas le profil onboarding
      if (entryProfile.pace100) {
        entryProfile = appendPaceHistory(entryProfile, {
          pace100: entryProfile.pace100,
          week: 1,
          source: "onboarding",
        });
      }
      const entry = { id, profile: entryProfile, plan: { ...p, taste: tasteProfile }, startDate: Date.now() };
      if (addingPlan) {
        setPlans(prev => [...prev, entry]);
        setAddingPlan(false);
      } else {
        setPlans([entry]);
      }
      setActivePlanId(id);
      setScreen("app"); setActiveTab("home");
      // Pas de paywall auto ici : valeur d’abord, soft paywall après la 1ʳᵉ séance.
    } catch {
      setError("Impossible de générer le plan. Réessaie !");
      setScreen("onboarding"); setStep(5);
    }
  };

  const handleComplete = (weekIndex, sessionIndex, status) => {
    const resolvedStatus = status || "done";
    if (resolvedStatus === "done" && !isPremium) {
      const active = plans.find((e) => e.id === activePlanId);
      const prevDone = countCompletedSessions(active?.plan);
      const alreadyDone = active?.plan?.weeks?.[weekIndex]?.sessions?.[sessionIndex]?.completed;
      if (!alreadyDone && prevDone === 0) {
        try {
          if (!localStorage.getItem(SOFT_PAYWALL_STORAGE_KEY)) setSoftPaywallPending(true);
        } catch {
          setSoftPaywallPending(true);
        }
      }
    }
    setPlans(prev => prev.map(entry => {
      if (entry.id !== activePlanId) return entry;
      const newPlan = {
        ...entry.plan,
        weeks: entry.plan.weeks.map((w, wi) => wi !== weekIndex ? w : {
          ...w, sessions: w.sessions.map((s, si) => {
            if (si !== sessionIndex) return s;
            if (resolvedStatus === "reset") return { ...s, completed: false, skipped: null, feedback: null };
            if (resolvedStatus === "done") return { ...s, completed: true, skipped: null };
            if (resolvedStatus === "missed") return { ...s, completed: false, skipped: "missed" };
            if (resolvedStatus === "not_done") return { ...s, completed: false, skipped: "not_done" };
            return { ...s, completed: true, skipped: null };
          }),
        }),
      };
      const updatedWeek = newPlan.weeks[weekIndex];
      // Semaine complète hors "done" → bilan hebdo tout de suite.
      // Pour "done", on attend la fermeture du sheet séance.
      if (
        resolvedStatus !== "done"
        && resolvedStatus !== "reset"
        && updatedWeek.sessions.every(isSessionResolved)
        && !updatedWeek.feedback
      ) {
        setTimeout(() => setFeedbackWeek(weekIndex), 700);
      }
      return { ...entry, plan: newPlan };
    }));
    if (resolvedStatus === "done") {
      setSessionFeedbackTarget({ weekIndex, sessionIndex, promptWeekAfter: true });
    }
  };

  const maybePromptWeekFeedback = (weekIndex) => {
    setTimeout(() => {
      setPlans(prev => {
        const entry = prev.find(e => e.id === activePlanId);
        const week = entry?.plan?.weeks?.[weekIndex];
        if (week?.sessions?.every(isSessionResolved) && !week.feedback) {
          setFeedbackWeek(weekIndex);
        }
        return prev;
      });
    }, 700);
  };

  const closeSessionFeedbackSheet = () => {
    const target = sessionFeedbackTarget;
    setSessionFeedbackTarget(null);
    if (target?.promptWeekAfter) maybePromptWeekFeedback(target.weekIndex);
  };

  const persistTaste = (nextTaste, userId = user?.id) => {
    const normalized = normalizeTaste(nextTaste);
    setTasteProfile(normalized);
    if (userId) {
      try { localStorage.setItem(`myswym_taste_${userId}`, JSON.stringify(normalized)); } catch {}
      supabase.from("user_taste_profile").upsert({
        user_id: userId,
        scores: normalized,
        updated_at: new Date().toISOString(),
      }).then(() => {});
    } else {
      try { localStorage.setItem("myswym_anon_taste", JSON.stringify(normalized)); } catch {}
    }
    return normalized;
  };

  const handleSessionFeedback = ({ rating, tags, comment }) => {
    if (!sessionFeedbackTarget) return;
    const { weekIndex, sessionIndex, promptWeekAfter } = sessionFeedbackTarget;
    const prevSession = plan?.weeks?.[weekIndex]?.sessions?.[sessionIndex];
    const isFirstFeedback = !prevSession?.feedback;
    const shouldNudge = isPremium && isFirstFeedback && (rating === "easy" || rating === "hard");

    const nextTaste = applySessionFeedbackToTaste(tasteProfile, {
      rating,
      tags,
      comment,
      sessionType: prevSession?.type ?? null,
    });
    persistTaste(nextTaste);

    // Régénère aussi si tags goûts (trop long / éducatifs…) même sans easy/hard — Premium only, semaines futures
    const tasteDriven =
      isPremium &&
      Array.isArray(tags) &&
      tags.some((t) => ["trop long", "trop court", "trop intensif", "éducatifs top", "incompréhensible"].includes(t));

    setPlans(prev => prev.map(e => {
      if (e.id !== activePlanId) return e;

      let base = { ...e.plan, taste: nextTaste };
      if (shouldNudge) {
        base = adjustPlan(
          { ...e.plan, taste: nextTaste },
          weekIndex,
          rating,
          { ...e.profile, taste: nextTaste },
          isPremium,
          { sessionNudge: true },
        );
        base = { ...base, taste: nextTaste };
      } else if (tasteDriven && shouldUseCoachGenerator(e.profile?.goal)) {
        // Applique goûts sans toucher volumeAdj (rating ok / tags seuls)
        try {
          const phaseList = phaseListForAdjust(e.profile, e.plan);
          const fresh = buildCoachPlanWeeks(
            { ...e.profile, volumeAdj: e.plan.volumeAdj ?? 1, taste: nextTaste },
            phaseList,
            isPremium,
            TIPS,
            FREE_FREQ_LIMIT,
          );
          base = {
            ...e.plan,
            taste: nextTaste,
            weeks: e.plan.weeks.map((w, i) => {
              if (i <= weekIndex || shouldPreserveWeek(w)) return w;
              return fresh[i] ?? w;
            }),
          };
        } catch {
          base = { ...e.plan, taste: nextTaste };
        }
      }

      const feedback = {
        rating,
        tags: Array.isArray(tags) ? tags : [],
        comment: comment || null,
        at: new Date().toISOString(),
      };

      return {
        ...e,
        plan: {
          ...base,
          taste: nextTaste,
          weeks: base.weeks.map((w, wi) => wi !== weekIndex ? w : {
            ...w,
            sessions: w.sessions.map((s, si) => si !== sessionIndex ? s : { ...s, feedback }),
          }),
        },
      };
    }));

    if (user) {
      const week = plan?.weeks?.[weekIndex];
      const session = week?.sessions?.[sessionIndex];
      supabase.from("session_feedback").insert({
        user_id: user.id,
        plan_id: activePlanId,
        week_number: week?.number ?? weekIndex + 1,
        session_index: sessionIndex,
        session_type: session?.type ?? null,
        session_title: session?.title ?? null,
        rating,
        tags: Array.isArray(tags) ? tags : [],
        comment: comment || null,
        created_at: new Date().toISOString(),
      }).then(() => {});
    }

    if (!isPremium && (rating === "easy" || rating === "hard" || tasteDriven)) {
      showToast("Retour enregistré. Premium affine volume et style des prochaines séances.", 5500);
    } else if (shouldNudge || tasteDriven) {
      showToast("Prochaines séances adaptées à tes goûts.", 4000);
    }

    setSessionFeedbackTarget(null);
    if (promptWeekAfter) maybePromptWeekFeedback(weekIndex);
  };

  const handleEditSessionFeedback = (weekIndex, sessionIndex) => {
    setSessionFeedbackTarget({ weekIndex, sessionIndex, promptWeekAfter: false });
  };

  const handleFeedback = ({ rating, motivation, pain, comment }) => {
    if (feedbackWeek === null) return;
    const nextTaste = applyWeekFeedbackToTaste(tasteProfile, { rating, comment });
    persistTaste(nextTaste);
    setPlans(prev => prev.map(e => {
      if (e.id !== activePlanId) return e;
      const base = isPremium
        ? adjustPlan(
            { ...e.plan, taste: nextTaste },
            feedbackWeek,
            rating,
            { ...e.profile, taste: nextTaste },
            isPremium,
          )
        : { ...e.plan, taste: nextTaste };
      const withSatisfaction = {
        ...base,
        taste: nextTaste,
        weeks: base.weeks.map((w, i) => i !== feedbackWeek ? w : {
          ...w,
          feedback: rating,
          satisfaction: { motivation, pain, comment, at: new Date().toISOString() },
        }),
      };
      return { ...e, plan: withSatisfaction };
    }));
    if (user) {
      supabase.from("week_feedback").insert({
        user_id: user.id,
        plan_id: activePlanId,
        week_number: plan?.weeks[feedbackWeek]?.number ?? feedbackWeek + 1,
        rating,
        motivation,
        pain,
        comment: comment || null,
        created_at: new Date().toISOString(),
      }).then(() => {});
    }
    if (!isPremium) {
      showToast("Retour enregistré. Premium ajuste volume et style des prochaines séances.", 5500);
    }
    setFeedbackWeek(null);
  };

  const handlePaceUpdate = (newPace100) => {
    setPlans(prev => prev.map(e => {
      if (e.id !== activePlanId) return e;
      const week = getCurrentWeekNumber(e.plan);
      const next = {
        ...e.profile,
        pace100: newPace100,
      };
      // Ne plus stocker / utiliser pace400
      delete next.pace400;
      return {
        ...e,
        profile: appendPaceHistory(next, {
          pace100: newPace100,
          week,
          source: "manual",
        }),
      };
    }));
  };

  const handleUpdateProgram = (newFreq, newPace100 = undefined) => {
    if (!activePlanEntry) return;
    const oldWeeks = activePlanEntry.plan?.weeks ?? [];
    const week = getCurrentWeekNumber(activePlanEntry.plan);
    let newProfile = {
      ...activePlanEntry.profile,
      sessionsPerWeek: newFreq,
      ...(newPace100 !== undefined ? { pace100: newPace100 } : {}),
    };
    delete newProfile.pace400;
    if (newPace100 !== undefined) {
      newProfile = appendPaceHistory(newProfile, {
        pace100: newPace100,
        week,
        source: "program",
      });
    }
    // Annule dès le clic les saves 2× en vol pendant la régénération (~1.8s).
    plansSaveGenRef.current += 1;
    setScreen("loading");
    const taste = activePlanEntry.plan?.taste || tasteProfile;
    const planIdToUpdate = activePlanId;
    generatePlan({ ...newProfile, taste }, isPremium).then(async (newPlan) => {
      const originalStartDate = activePlanEntry.plan?.startDate ?? activePlanEntry.startDate ?? null;
      // Semaines entamées (séance validée / skip / feedback) → conservées telles quelles.
      // Semaines non entamées → nouvelle fréquence (séances ajoutées / retirées).
      const mergedWeeks = mergePreservingProgress(oldWeeks, newPlan.weeks);
      const planWithDate = { ...newPlan, taste, weeks: mergedWeeks, ...(originalStartDate ? { startDate: originalStartDate } : {}) };
      const now = new Date().toISOString();
      // Invalide tout save en cours (évite qu'un upsert 2× arrive après le cache 3×).
      plansSaveGenRef.current += 1;

      setPlans(prev => {
        const nextPlans = prev.map(e => e.id !== planIdToUpdate ? e : { ...e, profile: newProfile, plan: planWithDate });
        if (user) {
          try {
            localStorage.setItem(`myswym_plans_${user.id}`, JSON.stringify(nextPlans));
            localStorage.setItem(`myswym_active_${user.id}`, planIdToUpdate);
            localStorage.setItem(`myswym_plans_updated_${user.id}`, now);
          } catch {}
        }
        return nextPlans;
      });

      // Persistance remote immédiate à partir du cache (source de vérité post-changement)
      if (user) {
        plansSaveGenRef.current += 1;
        try {
          const raw = localStorage.getItem(`myswym_plans_${user.id}`);
          const parsed = raw ? JSON.parse(raw) : null;
          if (Array.isArray(parsed) && parsed.length > 0) {
            const activeEntry = parsed.find(e => e.id === planIdToUpdate) ?? parsed[0];
            await supabase.from("user_plans").upsert({
              user_id:        user.id,
              plans_json:     parsed,
              active_plan_id: planIdToUpdate,
              profile:        activeEntry?.profile ?? null,
              plan:           activeEntry?.plan ?? null,
              updated_at:     now,
            }, { onConflict: "user_id" });
          }
        } catch {}
      }
      setScreen("app"); setActiveTab("plan");
    });
  };

  const handleAddPlan = () => {
    if (!isPremium) { openUpgrade(); return; }
    setAddingPlan(true);
    setProfile(BLANK_PROFILE);
    setStep(1);
    setScreen("onboarding");
  };

  const handleSwitchPlan = (id) => {
    setActivePlanId(id);
    setActiveTab("home");
  };

  const handleDeletePlan = (id) => {
    if (plans.length <= 1) return; // bouton caché si 1 seul plan, mais sécurité
    if (!window.confirm("Supprimer ce plan ? Cette action est définitive.")) return;
    const remaining = plans.filter(e => e.id !== id);
    const nextActive = activePlanId === id ? remaining[0].id : activePlanId;
    deletedPlanIdsRef.current.add(id);
    setPlans(remaining);
    if (activePlanId === id) setActivePlanId(nextActive);
    // Persiste immédiatement pour que la fusion ne ressuscite pas le plan
    if (user) {
      const now = new Date().toISOString();
      try {
        localStorage.setItem(`myswym_plans_${user.id}`, JSON.stringify(remaining));
        localStorage.setItem(`myswym_active_${user.id}`, nextActive);
        localStorage.setItem(`myswym_plans_updated_${user.id}`, now);
      } catch {}
    }
  };

  const handleReset = () => {
    if (plans.length > 1) {
      // Supprime uniquement le plan actif, garde les autres
      const removedId = activePlanId;
      const remaining = plans.filter(e => e.id !== activePlanId);
      if (removedId) deletedPlanIdsRef.current.add(removedId);
      setPlans(remaining);
      setActivePlanId(remaining[0].id);
      if (user) {
        const now = new Date().toISOString();
        try {
          localStorage.setItem(`myswym_plans_${user.id}`, JSON.stringify(remaining));
          localStorage.setItem(`myswym_active_${user.id}`, remaining[0].id);
          localStorage.setItem(`myswym_plans_updated_${user.id}`, now);
        } catch {}
      }
    } else {
      // Dernier plan — reset complet
      if (user) {
        localStorage.removeItem(`myswym_plans_${user.id}`);
        localStorage.removeItem(`myswym_active_${user.id}`);
        localStorage.removeItem(`myswym_plans_updated_${user.id}`);
        localStorage.removeItem(`myswym_profile_${user.id}`);
        localStorage.removeItem(`myswym_plan_${user.id}`);
        supabase.from("user_plans").delete().eq("user_id", user.id).then(() => {});
      }
      setPlans([]); setActivePlanId(null);
      setScreen("onboarding"); setStep(1);
      setProfile(BLANK_PROFILE); prevBadgesRef.current = [];
    }
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); };

  // Thème propre à chaque compte (user_metadata + localStorage scopé par userId)
  useEffect(() => {
    const t = resolveThemeForUser(user);
    applyTheme(t, { userId: user?.id || null, persist: true });
    setTheme(t);
    // Première fois sur ce compte : enregistrer le thème dans le profil (sync multi-appareils)
    const meta = user?.user_metadata?.theme;
    if (user?.id && meta !== "dark" && meta !== "light") {
      supabase.auth.updateUser({ data: { theme: t } }).catch(() => {});
    }
  }, [user?.id, user?.user_metadata?.theme]);

  const handleToggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    persistThemeToAccount(next, user);
    setTheme(next);
  };

  const handleRefreshStatus = async () => {
    showToast("Synchronisation avec Stripe…");
    try {
      const u = await syncSubscriptionFromStripe();
      if (u) {
        setUser(u);
        const premium = checkIsPremium(u);
        setIsPremium(premium);
        showToast(premium ? "Premium activé ✓" : "Statut gratuit confirmé", 5000);
        if (premium) closeUpgrade();
      }
    } catch {
      showToast("Impossible de synchroniser. Réessaie ou contacte support@myswym.app", 8000);
    }
  };

  const handlePortal = async () => {
    showToast("Redirection vers Stripe…");
    try {
      const { data: refreshData } = await supabase.auth.refreshSession();
      const session = refreshData?.session;
      if (!session) { showToast("Reconnecte-toi pour gérer ton abonnement."); return; }

      // Le serveur résout le customer via app_metadata ou email — pas de gate client
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}`, "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({ origin: window.location.origin }),
      });
      const json = await res.json();
      if (json.url) { window.location.href = json.url; return; }
      showToast(json.error || "Impossible d'ouvrir le portail Stripe.");
    } catch (e) {
      showToast("Erreur réseau. Réessaie.");
    }
  };

  const goal  = GOALS.find(g => g.id === activeProfile.goal);
  const stats = plan ? computeStats(plan) : null;

  if (authLoading) return (
    <>
      <style>{css}</style><FontLoader />
      <div style={{ minHeight: "100vh", background: G.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="swimmer"><Waves size={48} color={G.blue} /></div>
      </div>
    </>
  );

  if (isRecovery) return (
    <>
      <style>{css}</style><FontLoader />
      <PublicNav />
      <div style={{ minHeight: "100vh", background: G.bg }}>
        <ResetPasswordScreen showBrandHeader={false} onDone={() => {
          setIsRecovery(false);
          // Recharge les données utilisateur après reset
          supabase.auth.getUser().then(({ data }) => {
            const u = data?.user;
            if (u) { setUser(u); setIsPremium(checkIsPremium(u)); loadUserData(u.id, checkIsPremium(u)); }
          });
        }} />
      </div>
      <Footer />
    </>
  );

  // L'AuthScreen ne s'affiche plus que si l'utilisateur le demande explicitement
  // (clic sur "Se connecter" / "Sauvegarde ton plan"). L'onboarding et la dashboard sont
  // accessibles sans compte ; le plan est persisté localement via la clé "myswym_anon_*".
  if (screen === "auth") return (
    <>
      <style>{css}</style><FontLoader />
      <PublicNav />
      <div style={{ minHeight: "100vh", background: G.bg }}>
        <AuthScreen
          onAuth={handleAuthSuccess}
          initialMode={AUTH_PATHS[location.pathname] || "password"}
          onNavigateMode={handleAuthNavigateMode}
          showBrandHeader={false}
          onBack={handleAuthBack}
        />
      </div>
      <Footer />
    </>
  );

  if (screen === "loading") return <><style>{css}</style><FontLoader /><Loading /></>;

  if (screen === "onboarding") return (
    <>
      <style>{css}</style><FontLoader />
      <PublicNav />
      <div style={{ minHeight: "100vh", background: G.bg, paddingTop: 64 }}>
        <div style={{ maxWidth: 440, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ paddingTop: 84, paddingBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 40 }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <BrandLogo variant="wordmark" height={22} />
              </div>
            </div>
            {(() => {
              // Flux :
              //   progression : 1 → 3 (niveau) → [4 pace?] → 5 (fréq) — pas de date
              //   triathlon/eau_libre : 1 → 2 (sous-obj) → 3 (niveau) → [4 pace?] → 5 (fréq) → 6 (date)
              //   diplome : 1 → 2 (BNSSA/BPJEPS) → 5 (fréq) → 6 (date) — pas de niveau
              const isProgression = profile.category === "progression";
              const isDiplome = profile.category === "diplome";
              const noDate = isProgression;
              // Découverte : pas de T100 — souvent incapables d'enchaîner 100 m
              const isDecouverteLevel = profile.level === "découverte" || profile.level === "beginner";
              const hasPaceStep = isPremium && !isDiplome && !isDecouverteLevel;
              // Découverte disponible sur tous les programmes (triathlon, eau libre, etc.)
              const disabledLevels = [];
              // Calcul total steps
              const baseSteps = noDate ? 3 : isDiplome ? 4 : 4;
              const totalSteps = baseSteps + (hasPaceStep ? 1 : 0);
              // Après step 3 (niveau) → pace ou fréquence
              const stepAfter3 = hasPaceStep ? 4 : 5;
              // Retour depuis fréquence → pace ou niveau ou sous-obj
              const stepBefore5 = isDiplome ? 2 : hasPaceStep ? 4 : 3;
              return (
                <>
                  {step > 1 && <Progress step={step - 1} total={totalSteps} />}
                  {error && <div style={{ background: "#FFE8E8", borderRadius: 10, padding: "10px 14px", marginBottom: 16, color: "#CC0000", fontSize: 13 }}>{error}</div>}

                  {step === 1 && (
                    <Step1_Category onSelect={cat => {
                      if (cat === "progression") {
                        // Pas de sous-objectif — on va directement au niveau
                        setProfile(p => ({ ...p, category: cat, goal: "progression" }));
                        setStep(3);
                      } else {
                        setProfile(p => ({ ...p, category: cat, goal: "" }));
                        setStep(2);
                      }
                    }} />
                  )}

                  {step === 2 && !isProgression && (
                    <Step2_SubGoal
                      category={profile.category}
                      onSelect={goalId => {
                        update("goal", goalId);
                        // Diplôme saute le step niveau — niveau par défaut = sportif
                        if (isDiplome) { update("level", "sportif"); setStep(5); }
                        else setStep(3);
                      }}
                      onBack={() => setStep(1)} />
                  )}

                  {step === 3 && !isDiplome && (
                    <Step3_Level
                      value={profile.level} onChange={v => update("level", v)}
                      pool={profile.pool} onPoolChange={v => update("pool", v)}
                      total={totalSteps}
                      disabledLevels={disabledLevels}
                      onNext={() => {
                        const lvl = profile.level;
                        if (lvl === "découverte" || lvl === "beginner") update("pace100", null);
                        setStep(stepAfter3);
                      }}
                      onBack={() => isProgression ? setStep(1) : setStep(2)} />
                  )}

                  {step === 4 && hasPaceStep && (
                    <Step_Pace
                      value={profile.pace100}
                      onChange={v => update("pace100", v)}
                      total={totalSteps}
                      onNext={() => setStep(5)}
                      onSkip={() => { update("pace100", null); setStep(5); }}
                      onBack={() => setStep(3)} />
                  )}

                  {step === 5 && (
                    <Step4_Frequency value={profile.sessionsPerWeek} onChange={v => update("sessionsPerWeek", v)} total={totalSteps} onNext={noDate ? handleGenerate : () => setStep(6)} onBack={() => setStep(stepBefore5)} isLast={noDate} isPremium={isPremium} onUpgrade={() => openUpgrade()} />
                  )}

                  {step === 6 && !noDate && (
                    <Step2_Date value={profile.eventDate} onChange={v => update("eventDate", v)} onNext={handleGenerate} onBack={() => setStep(5)} />
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );

  return (
    <>
      <style>{css}</style><FontLoader />
      <div className="myswym-app">
        {/* Bandeau persistant pour les utilisateurs anonymes : nudge vers la création de compte
            sans bloquer l'usage de l'app. Le plan est déjà sauvegardé localement. */}
        {!user && plans.length > 0 && (
          <div className="app-shell" style={{ position: "sticky", top: 0, zIndex: 50, maxWidth: "100%", background: G.blue, color: G.white, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "100%", maxWidth: "var(--app-max)", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, fontSize: 13, fontWeight: 600 }}>
            <span style={{ flex: 1, lineHeight: 1.3 }}>
              Sauvegarde ton plan pour le retrouver sur tous tes appareils
            </span>
            <button onClick={() => { authOpenedFromUrlRef.current = false; openAuth("register"); }} style={{ background: G.white, color: G.blue, border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
              Créer mon compte
            </button>
            </div>
          </div>
        )}
        {activeTab === "home"    && <Dashboard   plan={plan} profile={activeProfile} plans={plans} activePlanId={activePlanId} onSwitchPlan={handleSwitchPlan} onTabChange={setActiveTab} onComplete={handleComplete} onShare={s => setShareSession(s)} onSignOut={handleSignOut} user={user} />}
        {activeTab === "plan"    && <PlanTab     plan={plan} profile={activeProfile} isPremium={isPremium} onComplete={handleComplete} onShare={s => setShareSession(s)} onEditFeedback={handleEditSessionFeedback} onReset={handleReset} onUpgrade={() => openUpgrade()} startDate={activePlanEntry?.startDate} plans={plans} activePlanId={activePlanId} onSwitchPlan={handleSwitchPlan} onAddPlan={handleAddPlan} onDeletePlan={handleDeletePlan} />}
        {activeTab === "profile" && <ProfileTab  plan={plan} profile={activeProfile} user={user} isPremium={isPremium} onSignOut={handleSignOut} onPortal={handlePortal} onUpgrade={() => openUpgrade()} onRefreshStatus={handleRefreshStatus} onPaceUpdate={handlePaceUpdate} onUpdateProgram={handleUpdateProgram} onValidateSession={handleComplete} onUserUpdate={setUser} theme={theme} onToggleTheme={handleToggleTheme} />}

        <Footer aboveBottomNav />
        <SupportBubble aboveBottomNav />
        <BottomNav active={activeTab} onChange={setActiveTab} newBadge={newBadgeId !== null} />

        {sessionFeedbackTarget !== null && (() => {
          const s = plan?.weeks?.[sessionFeedbackTarget.weekIndex]?.sessions?.[sessionFeedbackTarget.sessionIndex];
          return (
            <SessionFeedbackSheet
              key={`${sessionFeedbackTarget.weekIndex}-${sessionFeedbackTarget.sessionIndex}-${s?.feedback?.at || "new"}`}
              sessionTitle={s?.title}
              initial={s?.feedback || null}
              onSubmit={handleSessionFeedback}
              onSkip={closeSessionFeedbackSheet}
              isPremium={isPremium}
            />
          );
        })()}
        {feedbackWeek !== null && sessionFeedbackTarget === null && <FeedbackModal weekNumber={plan.weeks[feedbackWeek]?.number} onSubmit={handleFeedback} onSkip={() => setFeedbackWeek(null)} isPremium={isPremium} />}
        {shareSession && <ShareModal session={shareSession} goalLabel={goal?.label} onClose={() => setShareSession(null)} />}
        {newBadgeId && <BadgeToast badgeId={newBadgeId} />}
        {toast && (
          <div className="toast-in app-toast" style={{ background: G.ink, color: G.inverse, borderRadius: 14, padding: "14px 16px", fontSize: 14, lineHeight: 1.5, boxShadow: "0 8px 32px rgba(0,0,0,0.28)" }}>
            {toast}
          </div>
        )}
        {showUpgrade && <UpgradeModal onClose={closeUpgrade} softContext={upgradeSoftContext} weeksBlocked={upgradeSoftContext ? null : (plan?.totalRealWeeks > FREE_WEEKS_LIMIT ? plan.totalRealWeeks : null)} />}
      </div>
    </>
  );
}
