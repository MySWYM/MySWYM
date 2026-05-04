import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";
import {
  Waves, Flame, Star, Calendar, BarChart2, Award, Home,
  Ruler, Clock, Zap, Check, Lock, Trophy, Target,
  ChevronDown, ChevronUp, LogOut, Activity, User,
  Droplets, TrendingUp, Timer, RotateCcw, ArrowRight, Gauge, Settings, Shield, Plus, BookOpen,
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
const G = {
  bg: "#f8f9fc",
  ink: "#191c1e",
  inkLight: "#434751",
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
};

const TYPE_META = {
  ENDURANCE:    { bg: G.blueLight,   color: G.blue,    Icon: Waves,    tooltip: "Nage à allure confortable — tu pourrais parler. C'est la base de toute progression." },
  SEUIL:        { bg: "#FFF3E0",     color: "#E65100", Icon: Activity, tooltip: "Effort soutenu mais contrôlé — tu travailles à la limite de ton confort. Améliore ton endurance." },
  VITESSE:      { bg: G.coralLight,  color: G.coral,   Icon: Zap,      tooltip: "Sprints courts et intenses — récup complète entre chaque. Développe ta puissance." },
  TECHNIQUE:    { bg: G.waterLight,  color: "#0097A7", Icon: Target,   tooltip: "On travaille la façon de nager — position, bras, jambes. Moins d'effort, plus d'efficacité." },
  RÉCUPÉRATION: { bg: G.mintLight,   color: "#00897B", Icon: Droplets, tooltip: "Séance très légère pour récupérer. Bouge sans te fatiguer — c'est là que le corps progresse." },
};

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${G.bg}; font-family: 'Lexend', sans-serif; overscroll-behavior: none; letter-spacing: 0.01em; -webkit-font-smoothing: antialiased; }
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
  ::-webkit-scrollbar { width: 0; }
  button:active { transform: scale(0.97); transition: transform 0.1s; }
  input, textarea { -webkit-appearance: none; }
`;

// ── DATA ──────────────────────────────────────────────────────────────────
const GOALS = [
  { id: "triathlon_sprint",  label: "Triathlon Sprint",       dist: "750 m nage",                   icon: <Activity size={20} />, wellness: false },
  { id: "triathlon_olympic", label: "Triathlon Olympique",    dist: "1 500 m nage",                 icon: <Activity size={20} />, wellness: false },
  { id: "triathlon_half",    label: "Triathlon Half",         dist: "1 900 m nage",                 icon: <Activity size={20} />, wellness: false },
  { id: "triathlon_ironman", label: "Triathlon Ironman",      dist: "3 800 m nage",                 icon: <Activity size={20} />, wellness: false },
  { id: "open_water_5k",     label: "Eau libre 5 km",         dist: "5 km",                         icon: <Waves size={20} />,    wellness: false },
  { id: "open_water_10k",    label: "Eau libre 10 km",        dist: "10 km",                        icon: <Waves size={20} />,    wellness: false },
  { id: "bnssa",             label: "Prépa BNSSA",            dist: "100 m & 250 m sauvetage",      icon: <Shield size={20} />,   wellness: false },
  { id: "bpjeps_aan",        label: "Prépa BPJEPS AAN",       dist: "400 m NL < 7'40\"",            icon: <Award size={20} />,    wellness: false },
  { id: "tests_pompiers",    label: "Tests Pompiers",         dist: "400 m NL + 50 m sauvetage",    icon: <Shield size={20} />,   wellness: false },
  { id: "competition_maitre",label: "Compétition Maître",     dist: "50–1 500 m",                   icon: <Trophy size={20} />,   wellness: false },
  { id: "reprendre",         label: "Reprendre la natation",  dist: "6 semaines · en douceur",      icon: <RotateCcw size={20} />, wellness: true },
  { id: "perte_de_poids",    label: "Activité physique",       dist: "Durée selon ton objectif",     icon: <Target size={20} />,   wellness: true  },
];

// Catégories onboarding (step 1)
const CATEGORIES = [
  { id: "progression", label: "Nager & Progresser",  Icon: TrendingUp,  desc: "Tous niveaux · Progresser à ton rythme" },
  { id: "triathlon",   label: "Triathlon",            Icon: Activity,    desc: "Sprint · Olympique · Half · Ironman" },
  { id: "eau_libre",   label: "Eau libre",            Icon: Waves,       desc: "5 km · 10 km en eau vive" },
  { id: "diplome",     label: "Prépa diplôme",        Icon: Award,       desc: "BNSSA · BPJEPS" },
];

// Sous-objectifs par catégorie
const SUB_GOALS = {
  triathlon: [
    { id: "triathlon_sprint",  label: "Sprint",    dist: "750 m" },
    { id: "triathlon_olympic", label: "Olympique", dist: "1 500 m" },
    { id: "triathlon_half",    label: "Half",      dist: "1 900 m" },
    { id: "triathlon_ironman", label: "Ironman",   dist: "3 800 m" },
  ],
  eau_libre: [
    { id: "open_water_5k",  label: "5 km",  dist: "Eau vive" },
    { id: "open_water_10k", label: "10 km", dist: "Eau vive" },
  ],
  diplome: [
    { id: "bnssa",      label: "BNSSA",      dist: "100 m & 250 m sauvetage" },
    { id: "bpjeps_aan", label: "BPJEPS AAN", dist: "400 m NL < 7'40\"" },
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
    desc: "Je nage 20–30 min sans m'arrêter",
    detail: "Je tiens mon rythme, mais je ne cherche pas encore la perf",
    color: "#00C48C",
    bg: "#E6FFF6",
    dot: 2,
  },
  {
    id: "sportif",
    label: "Sportif",
    desc: "Je nage régulièrement et je progresse",
    detail: "J'enchaîne les longueurs, je veux une structure pour aller plus loin",
    color: "#0057FF",
    bg: "#EEF3FF",
    dot: 3,
  },
  {
    id: "performance",
    label: "Performance",
    desc: "J'ai déjà des courses à mon actif",
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

// Vérifie si un user a un accès premium valide (subscription active + non expirée)
const checkIsPremium = (user) => {
  const meta = user?.user_metadata;
  if (meta?.subscription !== "premium") return false;
  // Si subscription_end existe, vérifier qu'elle n'est pas dépassée
  if (meta?.subscription_end != null) {
    return meta.subscription_end * 1000 > Date.now();
  }
  return true; // pas de date de fin = premium sans limite (legacy)
};

const weeksUntil = (dateStr) => {
  if (!dateStr) return null;
  return Math.max(1, Math.ceil((new Date(dateStr) - new Date()) / (7 * 86400000)));
};

const formatDuration = (mins) => {
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h${mins % 60 ? (mins % 60).toString().padStart(2, "0") : ""}`;
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
    if (week.sessions.length > 0 && week.sessions.every(s => s.completed)) perfectWeeks++;
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

const adjustPlan = (plan, weekIndex, rating) => {
  const factor = rating === "easy" ? 1.12 : rating === "hard" ? 0.88 : 1.0;
  return {
    ...plan,
    weeks: plan.weeks.map((w, i) => {
      if (i === weekIndex) return { ...w, feedback: rating };
      if (i < weekIndex) return w;
      return { ...w, sessions: w.sessions.map(s => ({ ...s, distance: `${Math.round(parseInt(s.distance) * factor / 50) * 50}m` })) };
    }),
  };
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
  words.forEach((word, i) => {
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
  ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.font = "400 22px sans-serif"; ctx.fillText("myswym.vercel.app", 80, 1016);
  return canvas;
};

// ── PRIMITIVES ────────────────────────────────────────────────────────────
const Btn = ({ children, onClick, variant = "primary", disabled, style: s }) => {
  const base = { display: "block", width: "100%", padding: "16px 24px", borderRadius: 14, fontSize: 16, fontWeight: 600, fontFamily: "'Lexend', sans-serif", cursor: disabled ? "not-allowed" : "pointer", border: "none", transition: "all 0.18s", opacity: disabled ? 0.4 : 1, ...s };
  const styles = { primary: { background: G.ink, color: G.white }, secondary: { background: G.greyLight, color: G.ink }, blue: { background: G.blue, color: G.white, boxShadow: "0 8px 24px rgba(0,87,255,0.28)" }, ghost: { background: "transparent", color: G.grey, border: `1px solid ${G.greyLight}` } };
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

const StatPill = ({ icon: IconComp, value, label, color, bg }) => (
  <div style={{ background: G.white, borderRadius: 22, padding: "18px 14px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, boxShadow: "0 4px 20px rgba(142,179,255,0.10)", border: `1px solid rgba(142,179,255,0.10)` }}>
    <div style={{ width: 40, height: 40, borderRadius: 12, background: bg || G.blueLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <IconComp size={20} color={color || G.blue} />
    </div>
    <span style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Lexend', sans-serif", letterSpacing: "-0.02em", color: color || G.blue, lineHeight: 1 }}>{value}</span>
    <span style={{ fontSize: 10, color: G.grey, letterSpacing: "0.06em", textTransform: "uppercase", textAlign: "center" }}>{label}</span>
  </div>
);

// ── PACE ZONES CARD ─────────────────────────────────────────────────────
const ZONE_DEFS = [
  {
    zone: "Zone 1–2",
    label: "Facile — Longue durée",
    mult: 1.35,
    color: "#34C759",
    bg: "#34C75914",
    desc: "Tu pourrais parler pendant que tu nages. C'est l'allure de base — confortable, régulière. C'est là que tu construis ton moteur.",
    tip: "La majorité de tes séances",
  },
  {
    zone: "Zone 3–4",
    label: "Allure seuil",
    mult: 1.08,
    color: "#FF9F0A",
    bg: "#FF9F0A14",
    desc: "Effort soutenu — tu peux tenir cette allure sur 10–20 min mais pas indéfiniment. C'est ton allure de compétition sur 400–1500m.",
    tip: "Améliore ton endurance rapidement",
  },
  {
    zone: "Zone 5–6",
    label: "Sprint",
    mult: 0.95,
    color: "#FF3B30",
    bg: "#FF3B3014",
    desc: "Effort maximal sur de courtes distances (25–50m). Tu dois récupérer complètement entre chaque sprint. Développe ta puissance.",
    tip: "Explosivité et vitesse",
  },
];

function fmtPaceDisplay(secs) {
  return `${Math.floor(secs / 60)}:${Math.round(secs % 60).toString().padStart(2, "0")}`;
}

// ── PROJECTION CURVE (Performance only) ──────────────────────────────────
// Loi de puissance natation : T(d) = a * d^e
// Si 100m ET 400m connus : e = ln(T400/T100) / ln(4) — sinon e = 1.06 (valeur typique)
function calcProjection(pace100, pace400 = null) {
  if (!pace100) return null;
  const e = pace400
    ? Math.log(pace400 / pace100) / Math.log(400 / 100)
    : 1.065; // valeur standard pour nageurs entraînés
  // Clamp exponent in realistic range
  const exp = Math.min(Math.max(e, 1.02), 1.14);
  const a   = pace100 / Math.pow(100, exp);
  const predict = (d) => a * Math.pow(d, exp);
  return { exp, predict };
}

function fmtTime(totalSecs) {
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = Math.round(totalSecs % 60);
  if (h > 0) return `${h}h${String(m).padStart(2,'0')}'${String(s).padStart(2,'0')}"`;
  return `${m}'${String(s).padStart(2,'0')}"`;
}

const PaceProjectionCard = ({ pace100, pace400 }) => {
  if (!pace100) return null;
  const proj = calcProjection(pace100, pace400);
  if (!proj) return null;

  const TARGETS = [
    { dist: 400,  label: "400 m",   color: "#0057FF" },
    { dist: 1000, label: "1 000 m", color: "#7C3AED" },
    { dist: 1500, label: "1 500 m", color: "#00C48C" },
    { dist: 3000, label: "3 000 m", color: "#FF9F0A" },
  ];

  // Courbe SVG : de 100m à 3000m
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
    <div style={{ background: G.white, borderRadius: 18, padding: "20px 16px", marginBottom: 16, border: `1px solid ${G.greyLight}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <TrendingUp size={16} color="#7C3AED" />
        </div>
        <div>
          <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 16, fontWeight: 700, color: G.ink, margin: 0 }}>
            Projection de performance
          </h3>
          <p style={{ fontSize: 12, color: G.grey, margin: 0 }}>
            Estimation basée sur tes temps — loi de puissance
          </p>
        </div>
      </div>

      {/* Mini courbe SVG */}
      <div style={{ background: G.greyXLight, borderRadius: 12, padding: "12px 12px 8px", marginBottom: 16, overflow: "hidden" }}>
        <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ display: "block" }}>
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((f, i) => (
            <line key={i} x1={SVG_W * f} y1={0} x2={SVG_W * f} y2={SVG_H} stroke={G.greyLight} strokeWidth="1" strokeDasharray="3,3" />
          ))}
          {/* Gradient fill */}
          <defs>
            <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.18"/>
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.02"/>
            </linearGradient>
          </defs>
          <polygon points={`0,${SVG_H} ${pts} ${SVG_W},${SVG_H}`} fill="url(#projGrad)" />
          <polyline points={pts} fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {/* Dots at key distances */}
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

      {/* Predicted times */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {TARGETS.map(t => {
          const raw = proj.predict(t.dist);
          const pace = raw / (t.dist / 100);
          const paceStr = `${Math.floor(pace/60)}'${String(Math.round(pace%60)).padStart(2,'0')}"/100m`;
          // If the user has the actual time for this distance, show it
          const actual = t.dist === 100 ? pace100 : t.dist === 400 ? pace400 : null;
          return (
            <div key={t.dist} style={{ background: `${t.color}0D`, borderRadius: 12, padding: "12px 14px", border: `1px solid ${t.color}22` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: t.color, marginBottom: 4, letterSpacing: "0.04em" }}>{t.label}</div>
              <div style={{ fontFamily: "'Lexend', sans-serif", fontSize: 20, fontWeight: 800, color: G.ink, lineHeight: 1 }}>
                {actual ? fmtTime(actual) : fmtTime(Math.round(raw))}
                {actual && <span style={{ fontSize: 10, color: G.mint, marginLeft: 4, fontWeight: 600 }}>réel</span>}
              </div>
              <div style={{ fontSize: 10, color: G.grey, marginTop: 4 }}>{paceStr}</div>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 11, color: G.greyMid, marginTop: 12, lineHeight: 1.5 }}>
        Projection indicative — s'affine avec le temps quand tu ajoutes tes 400 m.
      </p>
    </div>
  );
};

const PaceZonesCard = ({ pace100, pace400, onSave }) => {
  const [val100, setVal100] = useState(pace100 || null);
  const [val400, setVal400] = useState(pace400 || null);
  const [saved,  setSaved]  = useState(false);

  const handleSave = () => {
    if (!val100) return;
    onSave(val100, val400);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const fmtZone = (s) => `${Math.floor(s/60)}'${String(Math.round(s%60)).padStart(2,'0')}"/100m`;
  const hasChange = val100 !== pace100 || val400 !== (pace400 || null);

  return (
    <div style={{ background: G.white, borderRadius: 18, padding: "20px 16px", marginBottom: 16, border: `1px solid ${G.greyLight}` }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: G.blueLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Gauge size={16} color={G.blue} />
        </div>
        <div>
          <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 16, fontWeight: 700, color: G.ink, margin: 0 }}>Zones d'intensité</h3>
          <p style={{ fontSize: 12, color: G.grey, margin: 0 }}>Basées sur tes temps personnels</p>
        </div>
      </div>

      {/* Inputs */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        <PaceInput label="100 m crawl" hint="ex : 1:45" placeholder="1:45"
          value={val100} onChange={setVal100} maxLen={3} minSec={45} maxSec={5*60} />
        <PaceInput label="400 m crawl" hint="optionnel" placeholder="8:00"
          value={val400} onChange={setVal400} maxLen={4} minSec={3*60} maxSec={20*60} />
      </div>

      {/* Save button */}
      <button onClick={handleSave} disabled={!val100 || !hasChange} style={{
        width: "100%", padding: "13px", borderRadius: 12, border: "none",
        cursor: (val100 && hasChange) ? "pointer" : "not-allowed",
        background: saved ? G.mint : (val100 && hasChange) ? G.blue : G.greyLight,
        color: G.white, fontWeight: 700, fontSize: 14, transition: "background 0.2s",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 16,
      }}>
        {saved ? <><Check size={14} /> Enregistré</> : "Enregistrer"}
      </button>

      {/* Zone cards */}
      {val100 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {ZONE_DEFS.map((z, i) => {
            const ps = Math.round(val100 * z.mult);
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

const UpdateProgramCard = ({ profile, isPremium, onUpgrade, onSave }) => {
  const [freq, setFreq] = useState(profile?.sessionsPerWeek ?? 2);
  const [changed, setChanged] = useState(false);

  if (!isPremium) {
    return (
      <div style={{ background: G.white, borderRadius: 18, padding: "18px 16px", marginBottom: 16, border: `1px solid ${G.greyLight}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", opacity: 0.85 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Lock size={14} color={G.greyMid} />
          <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: "0.04em", color: G.ink, margin: 0 }}>Modifier mon programme</h3>
        </div>
        <p style={{ fontSize: 13, color: G.grey, marginBottom: 14 }}>Adapte le nombre de séances à ton emploi du temps — réservé aux membres Premium.</p>
        <button onClick={onUpgrade} style={{ width: "100%", padding: "11px", borderRadius: 12, border: "none", background: G.blueLight, color: G.blue, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Zap size={14} color={G.blue} /> Passer en Premium
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: G.white, borderRadius: 18, padding: "18px 16px", marginBottom: 16, border: `1px solid ${G.greyLight}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: "0.04em", color: G.ink, marginBottom: 4 }}>Modifier mon programme</h3>
      <p style={{ fontSize: 13, color: G.grey, marginBottom: 16 }}>Change le nombre de séances — tes semaines déjà validées sont conservées.</p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
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

      {changed && (
        <button onClick={() => { onSave(freq); setChanged(false); }} style={{
          width: "100%", padding: "12px", borderRadius: 12, background: G.blue, border: "none",
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

const StravaSection = ({ user, onPaceUpdate, currentPace100, plan, onValidateSession }) => {
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

  const checkConnection = async () => {
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
  };

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

  // ── Activité natation d'aujourd'hui ─────────────────────────────────────
  const todayStr  = new Date().toISOString().slice(0, 10);
  const todaySwim = connected ? activities.find(
    a => ["Swim","OpenWaterSwim"].includes(a.activity_type) && a.activity_date === todayStr
  ) : null;

  // ── Première séance non validée du plan courant ──────────────────────────
  const currentSessionRef = (() => {
    if (!plan?.weeks) return null;
    const wi = plan.weeks.findIndex(w => !w.sessions.every(s => s.completed));
    if (wi === -1) return null;
    const si = plan.weeks[wi].sessions.findIndex(s => !s.completed);
    if (si === -1) return null;
    return { weekIndex: wi, sessionIndex: si, session: plan.weeks[wi].sessions[si] };
  })();

  const canValidate = todaySwim && currentSessionRef && !currentSessionRef.session.completed;

  // Pendant le chargement on affiche le bouton "Connecter" (état optimiste)
  // il sera remplacé par l'état réel dès que checkConnection() répond

  return (
    <div style={{ background: G.white, borderRadius: 20, padding: "18px 16px", marginBottom: 16, border: `1px solid ${G.greyLight}`, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>

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
                onClick={() => { onValidateSession(currentSessionRef.weekIndex, currentSessionRef.sessionIndex); setMsg({ type: "ok", text: "Séance validée depuis Strava ✓" }); }}
                style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: G.blue, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}
              >
                Valider ✓
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
                  {hasBetterPace && " 🔥"}
                </div>
                <div style={{ fontSize: 11, color: G.grey }}>
                  {hasBetterPace
                    ? `Plus rapide que ta référence (${fmtPace(currentPace100)})`
                    : `Identique à ta référence actuelle`}
                </div>
              </div>
              {hasBetterPace && onPaceUpdate && (
                <button
                  onClick={() => { onPaceUpdate(bestPace); setMsg({ type: "ok", text: `Référence mise à jour : ${fmtPace(bestPace)} ✓` }); }}
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

const ProfileTab = ({ plan, profile, user, isPremium, onSignOut, onPortal, onUpgrade, onRefreshStatus, onPaceUpdate, onUpdateProgram, onValidateSession }) => {
  const [password, setPassword] = useState("");
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState(null);

  // Avatar + firstName — Supabase user_metadata en priorité, localStorage en fallback
  const [avatarUrl, setAvatarUrl] = useState(() => {
    try { return user?.user_metadata?.avatar_url || localStorage.getItem("myswym_avatar") || null; } catch { return null; }
  });
  const [firstName, setFirstName] = useState(() => {
    try { return user?.user_metadata?.firstname || localStorage.getItem("myswym_firstname") || ""; } catch { return ""; }
  });
  const [editingName, setEditingName] = useState(false);
  const [nameInput,   setNameInput]   = useState(firstName);
  const fileInputRef = useRef(null);

  // Resync depuis user_metadata quand l'objet user arrive ou change
  useEffect(() => {
    if (user?.user_metadata?.firstname) setFirstName(user.user_metadata.firstname);
    if (user?.user_metadata?.avatar_url) setAvatarUrl(user.user_metadata.avatar_url);
  }, [user?.id, user?.user_metadata?.firstname, user?.user_metadata?.avatar_url]);

  const stats  = computeStats(plan);
  const earned = checkBadges(stats);

  const inp = { width: "100%", padding: "13px 14px", borderRadius: 12, border: `1.5px solid ${G.greyLight}`, fontSize: 15, fontFamily: "'Lexend', sans-serif", background: G.white, color: G.ink, outline: "none", boxSizing: "border-box" };

  const save = async () => {
    if (!password) return;
    setSaving(true); setMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMsg({ type: "ok", text: "Mot de passe mis à jour ✓" });
      setPassword("");
    } catch (e) { setMsg({ type: "err", text: e.message }); }
    finally { setSaving(false); }
  };

  const saveName = () => {
    const v = nameInput.trim();
    if (v) {
      localStorage.setItem("myswym_firstname", v);
      setFirstName(v);
      // Sync cross-device via user_metadata
      supabase.auth.updateUser({ data: { firstname: v } }).catch(() => {});
    }
    setEditingName(false);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Aperçu immédiat local
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarUrl(ev.target.result);
    reader.readAsDataURL(file);

    // Upload vers Supabase Storage → URL publique persistante cross-device
    try {
      const ext  = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      // Cache-busting pour forcer le rechargement de l'image
      const urlWithTs = `${publicUrl}?t=${Date.now()}`;
      setAvatarUrl(urlWithTs);
      try { localStorage.setItem("myswym_avatar", urlWithTs); } catch {}
      // Sync cross-device via user_metadata
      await supabase.auth.updateUser({ data: { avatar_url: urlWithTs } });
    } catch {
      // Fallback silencieux : l'aperçu local reste affiché
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
    <div style={{ minHeight: "100vh", background: G.bg, paddingBottom: 100 }}>

      {/* ── Profile Header ─────────────────────────────────────── */}
      <div style={{ padding: "56px 20px 24px", textAlign: "center" }}>
        {/* Avatar — tappable pour changer la photo */}
        <div style={{ position: "relative", display: "inline-block", marginBottom: 16 }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ border: "none", background: "none", cursor: "pointer", padding: 0, display: "block" }}
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
            {/* Camera badge */}
            <div style={{
              position: "absolute", bottom: 2, right: 2,
              width: 26, height: 26, borderRadius: "50%",
              background: G.blue, border: "2.5px solid #fff",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <User size={12} color="#fff" />
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
        </div>

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
            <button onClick={saveName} style={{ background: G.blue, border: "none", borderRadius: 8, padding: "4px 10px", color: G.white, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>OK</button>
          </div>
        ) : (
          <button
            onClick={() => { setNameInput(displayName); setEditingName(true); }}
            style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 4, padding: 0 }}
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

      <div style={{ padding: "0 16px" }}>

        {/* ── 1. Stats ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { Icon: Waves,   value: `${(stats.totalMeters / 1000).toFixed(1)} km`, label: "Nagés",            color: G.blue,  bg: G.blueLight  },
            { Icon: Check,   value: stats.totalSessions,                             label: "Séances",          color: G.mint,  bg: G.mintLight  },
            { Icon: Flame,   value: stats.streak,                                    label: "Série actuelle",   color: G.coral, bg: G.coralLight },
            { Icon: Star,    value: stats.perfectWeeks,                              label: "Sem. parfaites",   color: G.gold,  bg: G.goldLight  },
          ].map(({ Icon, value, label, color, bg }, i) => (
            <div key={i} style={{ background: G.white, borderRadius: 20, padding: "16px 14px", border: `1px solid ${G.greyLight}`, boxShadow: "0 2px 12px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: 12 }}>
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

        {/* ── 2. Badges (compact strip) ── */}
        {earned.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
              Badges — {earned.length}/{BADGE_DEFS.length} débloqués
            </div>
            <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, marginLeft: -16, paddingLeft: 16, marginRight: -16, paddingRight: 16 }}>
              {BADGE_DEFS.filter(b => earned.includes(b.id)).map((b, i) => (
                <div key={b.id} style={{ flexShrink: 0, width: 56, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: badgeGradients[i % badgeGradients.length], display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 3px 10px ${b.color}33` }}>
                    <b.icon size={20} color="#fff" />
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 600, color: G.ink, textAlign: "center", lineHeight: 1.2, textTransform: "uppercase" }}>{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 3. Modifier le programme ── */}
        <UpdateProgramCard profile={profile} isPremium={isPremium} onUpgrade={onUpgrade} onSave={onUpdateProgram} />

        {/* ── 4. Compte ── */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12, marginTop: 8 }}>Compte</div>

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
          </div>

          {/* Email + mdp groupés */}
          <div style={{ background: G.white, borderRadius: 16, overflow: "hidden", border: `1px solid ${G.greyLight}`, marginBottom: 10 }}>
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
          <StravaSection user={user} plan={plan} currentPace100={profile?.pace100} onPaceUpdate={onPaceUpdate} onValidateSession={onValidateSession} />

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24, marginTop: 10 }}>
            <button onClick={onSignOut} style={{ width: "100%", padding: "14px", borderRadius: 14, border: `1.5px solid ${G.greyLight}`, background: "none", color: G.grey, fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 50 }}>
              <LogOut size={16} color={G.grey} /> Se déconnecter
            </button>
          </div>
        </div>
      </div>
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
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)", borderTop: `1px solid ${G.greyLight}`, display: "flex", padding: "10px 0 max(10px, env(safe-area-inset-bottom))" }}>
      {tabs.map(t => {
        const isActive = active === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: "2px 0", position: "relative" }}>
            <t.Icon size={22} color={isActive ? G.blue : G.greyMid} strokeWidth={isActive ? 2.5 : 1.8} style={{ transition: "all 0.2s" }} />
            <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400, color: isActive ? G.blue : G.grey }}>{t.label}</span>
            {t.id === "profile" && newBadge && <div style={{ position: "absolute", top: 0, right: "calc(50% - 18px)", width: 8, height: 8, borderRadius: "50%", background: G.coral }} />}
            {isActive && <div style={{ position: "absolute", bottom: -10, width: 24, height: 3, borderRadius: 2, background: G.blue }} />}
          </button>
        );
      })}
    </div>
  );
};

// ── AUTH SCREEN ───────────────────────────────────────────────────────────

const ResetPasswordScreen = ({ onDone }) => {
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

  const inp = { width: "100%", padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${G.greyLight}`, fontSize: 15, fontFamily: "'Lexend', sans-serif", background: G.white, color: G.ink, outline: "none" };

  return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "0 20px", paddingTop: 64, paddingBottom: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 44 }}>
        <div style={{ width: 40, height: 40, background: G.ink, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Waves size={20} color={G.white} />
        </div>
        <span style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 800, fontSize: 20, color: G.ink }}>MySWYM</span>
      </div>
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

const AuthScreen = ({ onAuth }) => {
  const [mode, setMode] = useState("login"); // "login" | "register" | "reset"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const switchMode = (m) => { setMode(m); setError(null); setSuccess(null); };

  const handle = async () => {
    setError(null); setSuccess(null); setLoading(true);
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuth(data.user);
      } else if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user && !data.user.identities?.length) throw new Error("Un compte existe déjà avec cet email.");
        setSuccess("Compte créé ! Vérifie ton email, puis connecte-toi.");
        switchMode("login");
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

  const inp = { width: "100%", padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${G.greyLight}`, fontSize: 15, fontFamily: "'Lexend', sans-serif", background: G.white, color: G.ink, outline: "none" };

  return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "0 20px", paddingTop: 64, paddingBottom: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 44 }}>
        <div style={{ width: 40, height: 40, background: G.ink, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Waves size={20} color={G.white} />
        </div>
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 24, color: G.ink, letterSpacing: "0.06em", textTransform: "uppercase" }}>MySWYM</span>
      </div>
      <div className="fade-up">
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 44, fontWeight: 800, letterSpacing: "0", textTransform: "uppercase", color: G.ink, marginBottom: 8, lineHeight: 1.0 }}>
          {mode === "reset" ? "Mot de passe oublié" : "Bienvenue"}
        </h2>
        <p style={{ color: G.grey, fontSize: 15, marginBottom: 28 }}>
          {mode === "login"    ? "Connecte-toi pour accéder à ton plan."
         : mode === "register" ? "Crée ton compte gratuitement."
         :                       "Entre ton email, on t'envoie un lien de réinitialisation."}
        </p>

        {error   && <div style={{ background: "#FFE8E8", borderRadius: 10, padding: "10px 14px", marginBottom: 14, color: "#CC0000", fontSize: 13 }}>{error}</div>}
        {success && <div style={{ background: G.mintLight, borderRadius: 10, padding: "10px 14px", marginBottom: 14, color: "#00897B", fontSize: 13 }}>{success}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: mode === "login" ? 8 : 16 }}>
          <input type="email" placeholder="Ton email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()} style={inp} />
          {mode !== "reset" && (
            <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()} style={inp} />
          )}
        </div>

        {/* Lien mot de passe oublié — visible uniquement en mode login */}
        {mode === "login" && (
          <div style={{ textAlign: "right", marginBottom: 16 }}>
            <button onClick={() => switchMode("reset")} style={{ background: "none", border: "none", color: G.grey, fontSize: 13, cursor: "pointer", padding: 0 }}>
              Mot de passe oublié ?
            </button>
          </div>
        )}

        <Btn onClick={handle} disabled={loading || !email || (mode !== "reset" && !password)} variant="blue">
          {loading ? "…" : mode === "login" ? "Se connecter" : mode === "register" ? "Créer mon compte" : "Envoyer le lien"}
        </Btn>

        <p style={{ textAlign: "center", marginTop: 18, fontSize: 14, color: G.grey }}>
          {mode === "reset" ? (
            <button onClick={() => switchMode("login")} style={{ background: "none", border: "none", color: G.ink, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
              ← Retour à la connexion
            </button>
          ) : (
            <>
              {mode === "login" ? "Pas encore de compte ? " : "Déjà un compte ? "}
              <button onClick={() => switchMode(mode === "login" ? "register" : "login")} style={{ background: "none", border: "none", color: G.ink, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
                {mode === "login" ? "S'inscrire" : "Se connecter"}
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

// ── ONBOARDING ────────────────────────────────────────────────────────────
// ── STEP 1 : CATÉGORIE ────────────────────────────────────────────────────
const Step1_Category = ({ onSelect }) => (
  <div className="fade-up">
    <p style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>Étape 1 sur 5</p>
    <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 48, fontWeight: 800, letterSpacing: "0", textTransform: "uppercase", color: G.ink, marginBottom: 10, lineHeight: 1.0 }}>Pourquoi<br />tu nages ?</h2>
    <p style={{ color: G.grey, fontSize: 16, marginBottom: 36, lineHeight: 1.5 }}>Ton plan sera entièrement construit autour de ton objectif.</p>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {CATEGORIES.map(cat => (
        <button key={cat.id} onClick={() => onSelect(cat.id)}
          style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", borderRadius: 16, border: `1px solid ${G.greyLight}`, background: G.white, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: G.greyXLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <cat.Icon size={20} color={G.ink} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: G.ink, marginBottom: 2 }}>{cat.label}</div>
            <div style={{ fontSize: 13, color: G.grey }}>{cat.desc}</div>
          </div>
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
      <p style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>Étape 2 sur 5</p>
      <h2 style={{ fontSize: 38, fontFamily: "'Lexend', sans-serif", fontWeight: 800, letterSpacing: "0.02em", color: G.ink, marginBottom: 10, lineHeight: 1.0 }}>{titles[category] || "Précise ton objectif"}</h2>
      <p style={{ color: G.grey, fontSize: 16, marginBottom: 36 }}>On calibre le volume de tes séances.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {subs.map(s => (
          <button key={s.id} onClick={() => onSelect(s.id)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 22px", borderRadius: 16, border: `1px solid ${G.greyLight}`, background: G.white, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: G.ink }}>{s.label}</div>
              <div style={{ fontSize: 13, color: G.grey, marginTop: 2 }}>{s.dist}</div>
            </div>
            <ChevronDown size={16} color={G.greyMid} style={{ transform: "rotate(-90deg)" }} />
          </button>
        ))}
      </div>
      <button onClick={onBack} style={{ width: "100%", padding: "14px", background: "none", border: "none", color: G.grey, cursor: "pointer", fontSize: 14 }}>← Retour</button>
    </div>
  );
};

const StepWeight = ({ weightCurrent, weightGoal, onChangeCurrent, onChangeGoal, onNext, onBack }) => {
  const loss = Math.max(0, (parseFloat(weightCurrent) || 0) - (parseFloat(weightGoal) || 0));
  const weeks = loss > 0 ? Math.min(16, Math.max(4, Math.ceil(loss * 2))) : null;
  const inp = { width: "100%", padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${G.greyLight}`, fontSize: 18, fontFamily: "'Lexend', sans-serif", fontWeight: 700, color: G.ink, background: G.white, outline: "none", textAlign: "center" };
  return (
    <div className="fade-up">
      <p style={{ fontSize: 12, fontWeight: 600, color: G.grey, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Étape 2 sur 4</p>
      <h2 style={{ fontSize: 30, fontFamily: "'Lexend', sans-serif", fontWeight: 700, letterSpacing: "0.03em", color: G.ink, marginBottom: 6, lineHeight: 1.1 }}>Ton objectif<br />poids ?</h2>
      <p style={{ color: G.grey, fontSize: 15, marginBottom: 24 }}>On va calculer la durée de ton plan.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
        <div style={{ background: G.white, borderRadius: 14, padding: "16px 20px", border: `1px solid ${G.greyLight}` }}>
          <label style={{ fontSize: 11, color: G.grey, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Poids actuel (kg)</label>
          <input type="number" inputMode="decimal" value={weightCurrent} onChange={e => onChangeCurrent(e.target.value)} placeholder="ex : 75" style={inp} />
        </div>
        <div style={{ background: G.white, borderRadius: 14, padding: "16px 20px", border: `1px solid ${G.greyLight}` }}>
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

const Step2_Date = ({ value, onChange, onNext, onBack }) => {
  const weeks = weeksUntil(value);

  // Affichage jj/mm/aaaa — stockage ISO yyyy-mm-dd
  const toDisplay = (iso) => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };
  const [display, setDisplay] = useState(toDisplay(value));
  const [err, setErr] = useState("");

  const handleChange = (raw) => {
    // Garde uniquement les chiffres
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    // Auto-insère les "/"
    let formatted = digits;
    if (digits.length > 2) formatted = digits.slice(0, 2) + "/" + digits.slice(2);
    if (digits.length > 4) formatted = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
    setDisplay(formatted);
    setErr("");

    if (digits.length === 8) {
      const dd = digits.slice(0, 2), mm = digits.slice(2, 4), yyyy = digits.slice(4);
      const iso = `${yyyy}-${mm}-${dd}`;
      const date = new Date(iso);
      const minDate = new Date(); minDate.setDate(minDate.getDate() + 42);
      if (isNaN(date.getTime())) { setErr("Date invalide"); onChange(""); return; }
      if (date < minDate) { setErr("Minimum 6 semaines à partir d'aujourd'hui"); onChange(""); return; }
      onChange(iso);
    } else {
      onChange("");
    }
  };

  return (
    <div className="fade-up">
      <p style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>Étape 5 sur 5</p>
      <h2 style={{ fontSize: 38, fontFamily: "'Lexend', sans-serif", fontWeight: 800, letterSpacing: "0.02em", color: G.ink, marginBottom: 10, lineHeight: 1.0 }}>Date de<br />l'événement ?</h2>
      <p style={{ color: G.grey, fontSize: 16, marginBottom: 36 }}>Minimum 6 semaines pour un bon plan.</p>
      <div style={{ background: G.white, borderRadius: 16, padding: "20px", marginBottom: 12, border: `1.5px solid ${err ? "#FF4757" : weeks ? G.blue : G.greyLight}`, transition: "border-color 0.2s" }}>
        <label style={{ fontSize: 11, color: G.grey, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 10 }}>Date de l'événement</label>
        <input
          type="text"
          inputMode="numeric"
          placeholder="jj/mm/aaaa"
          value={display}
          onChange={e => handleChange(e.target.value)}
          style={{ width: "100%", border: "none", fontSize: 28, fontFamily: "'Lexend', sans-serif", fontWeight: 700, letterSpacing: "0.03em", color: G.ink, background: "transparent", outline: "none", letterSpacing: 2 }}
        />
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
      <Btn onClick={onNext} disabled={!value}>Générer mon plan 🚀</Btn>
      <button onClick={onBack} style={{ width: "100%", marginTop: 10, padding: "14px", background: "none", border: "none", color: G.grey, cursor: "pointer", fontSize: 14 }}>← Retour</button>
    </div>
  );
};

const Step3_Level = ({ value, onChange, pool, onPoolChange, onNext, onBack, total = 6, disabledLevels = [] }) => (
  <div className="fade-up">
    <p style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Étape 3 sur {total}</p>
    <h2 style={{ fontSize: 32, fontFamily: "'Lexend', sans-serif", fontWeight: 800, letterSpacing: "0.02em", color: G.ink, marginBottom: 8, lineHeight: 1.05 }}>Tu es<br />où dans l'eau ?</h2>
    <p style={{ color: G.grey, fontSize: 15, marginBottom: 24 }}>Choisis ce qui te correspond le mieux — ton plan sera construit en conséquence.</p>

    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
      {LEVELS.map(l => {
        const isActive = value === l.id;
        const isDisabled = disabledLevels.includes(l.id);
        return (
          <button key={l.id}
            onClick={() => !isDisabled && onChange(l.id)}
            disabled={isDisabled}
            style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "16px 18px", borderRadius: 16,
              border: `2px solid ${isDisabled ? G.greyLight : isActive ? l.color : G.greyLight}`,
              background: isDisabled ? G.greyXLight : isActive ? l.bg : G.white,
              cursor: isDisabled ? "default" : "pointer", transition: "all 0.2s",
              boxShadow: isActive ? `0 4px 16px ${l.color}22` : "0 2px 8px rgba(0,0,0,0.04)",
              textAlign: "left", opacity: isDisabled ? 0.55 : 1,
            }}>
            {/* Level dots — Apple-style simple indicator */}
            <div style={{ display: "flex", gap: 3, flexShrink: 0, alignSelf: "center" }}>
              {[1,2,3,4].map(n => (
                <div key={n} style={{ width: 7, height: 7, borderRadius: "50%", background: n <= l.dot ? (isDisabled ? G.greyMid : l.color) : G.greyLight, transition: "background 0.2s" }} />
              ))}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: isDisabled ? G.grey : isActive ? l.color : G.ink, marginBottom: 2 }}>{l.label}</div>
              {isDisabled
                ? <div style={{ fontSize: 12, color: G.grey, fontStyle: "italic" }}>Passe d'abord par Nager &amp; progresser</div>
                : <>
                    <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? l.color : G.inkLight }}>{l.desc}</div>
                    <div style={{ fontSize: 11, color: G.grey, marginTop: 2, lineHeight: 1.4 }}>{l.detail}</div>
                  </>
              }
            </div>
            {isActive && !isDisabled && (
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: l.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Check size={13} color={G.white} />
              </div>
            )}
          </button>
        );
      })}
    </div>

    <div style={{ marginBottom: 28 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Ton bassin habituel</p>
      <div style={{ display: "flex", gap: 12 }}>
        {POOLS.map(p => (
          <button key={p.id} onClick={() => onPoolChange(p.id)} style={{ flex: 1, padding: "16px", borderRadius: 14, border: `2px solid ${pool === p.id ? G.ink : G.greyLight}`, background: pool === p.id ? G.ink : G.white, color: pool === p.id ? G.white : G.ink, fontSize: 17, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>{p.label}</button>
        ))}
      </div>
    </div>
    <Btn onClick={onNext} disabled={!value}>Continuer</Btn>
    <button onClick={onBack} style={{ width: "100%", marginTop: 10, padding: "12px", background: "none", border: "none", color: G.grey, cursor: "pointer", fontSize: 14 }}>← Retour</button>
  </div>
);

// ── STEP 4 : TEMPS AU 100m ET 400m (Performance uniquement) ──────────────
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
          borderRadius: 14, outline: "none", background: G.white, color: G.ink,
          transition: "border-color 0.2s",
        }}
      />
      {err && <p style={{ color: "#FF3B30", fontSize: 12, marginTop: 4 }}>{err}</p>}
    </div>
  );
}

const Step_Pace = ({ value, value400, onChange, onChange400, onNext, onSkip, onBack, total = 6 }) => {
  const ZONES = [
    { label: "Endurance",  mult: 1.35, color: "#34C759" },
    { label: "Seuil",      mult: 1.08, color: "#FF9F0A" },
    { label: "Sprint",     mult: 0.95, color: "#FF3B30" },
  ];

  const fmtZone = (secs) => `${Math.floor(secs/60)}'${String(Math.round(secs%60)).padStart(2,'0')}"/100m`;

  return (
    <div className="fade-up">
      <p style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Étape 4 sur {total}</p>
      <h2 style={{ fontSize: 30, fontFamily: "'Lexend', sans-serif", fontWeight: 800, color: G.ink, marginBottom: 8, lineHeight: 1.1 }}>
        Tes références<br />personnelles
      </h2>
      <p style={{ color: G.grey, fontSize: 15, marginBottom: 20, lineHeight: 1.5 }}>
        Ces temps calibrent ton plan à la seconde. Renseigne au moins le 100 m.
      </p>

      {/* Inputs */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        <PaceInput
          label="100 m crawl"
          hint="ex : 1:45"
          placeholder="1:45"
          value={value}
          onChange={onChange}
          maxLen={3}
          minSec={45}
          maxSec={5 * 60}
        />
        <PaceInput
          label="400 m crawl"
          hint="optionnel — ex : 8:00"
          placeholder="8:00"
          value={value400}
          onChange={onChange400}
          maxLen={4}
          minSec={3 * 60}
          maxSec={20 * 60}
        />
      </div>

      {/* Zone preview */}
      {value && (
        <div style={{ background: G.greyXLight, borderRadius: 14, padding: "14px 16px", marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>
            Tes zones d'intensité
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ZONES.map((z, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: z.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: G.ink, flex: 1 }}>{z.label}</span>
                <span style={{ fontFamily: "'Lexend', sans-serif", fontSize: 14, fontWeight: 700, color: z.color }}>
                  {fmtZone(Math.round(value * z.mult))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Btn variant="blue" onClick={onNext} disabled={!value}>Utiliser ces temps</Btn>
      <button onClick={onSkip} style={{ width: "100%", marginTop: 10, padding: "12px", background: "none", border: `1px solid ${G.greyLight}`, borderRadius: 12, color: G.grey, cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
        Je ne connais pas mes temps
      </button>
      <button onClick={onBack} style={{ width: "100%", marginTop: 8, padding: "12px", background: "none", border: "none", color: G.grey, cursor: "pointer", fontSize: 14 }}>
        Retour
      </button>
    </div>
  );
};

const Step4_Frequency = ({ value, onChange, onNext, onBack, isLast = false, total = 6, isPremium = false, onUpgrade }) => (
  <div className="fade-up">
    <p style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Étape 5 sur {total}</p>
    <h2 style={{ fontSize: 34, fontFamily: "'Lexend', sans-serif", fontWeight: 800, letterSpacing: "0.02em", color: G.ink, marginBottom: 8, lineHeight: 1.05 }}>Séances<br />par semaine ?</h2>
    <p style={{ color: G.grey, fontSize: 15, marginBottom: 32 }}>On s'adapte à ta vie, pas l'inverse.</p>
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
      {FREQUENCIES.map(f => {
        const locked = !isPremium && f.id >= 3;
        const isActive = value === f.id;
        return (
          <button key={f.id} onClick={() => locked ? onUpgrade?.() : onChange(f.id)} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "18px 20px", borderRadius: 16,
            border: `2px solid ${isActive ? G.blue : locked ? G.greyLight : G.greyLight}`,
            background: isActive ? G.blue : locked ? G.greyXLight : G.white,
            cursor: "pointer", transition: "all 0.2s",
            boxShadow: isActive ? "0 4px 16px rgba(0,87,255,0.2)" : "0 2px 8px rgba(0,0,0,0.04)",
            opacity: locked ? 0.8 : 1,
          }}>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: isActive ? G.white : locked ? G.greyMid : G.ink }}>{f.label}</div>
              <div style={{ fontSize: 13, color: isActive ? "rgba(255,255,255,0.65)" : locked ? G.greyMid : G.grey }}>{f.desc}</div>
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
    <Btn variant="blue" onClick={onNext} disabled={!value}>{isLast ? "Générer mon plan 🚀" : "Continuer"}</Btn>
    <button onClick={onBack} style={{ width: "100%", marginTop: 10, padding: "12px", background: "none", border: "none", color: G.grey, cursor: "pointer", fontSize: 14 }}>← Retour</button>
  </div>
);

// ── LOADING ───────────────────────────────────────────────────────────────
const Loading = () => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 24, background: G.bg }}>
    <div style={{ fontSize: 60 }}><span className="swimmer"><Waves size={52} color={G.blue} /></span></div>
    <div style={{ textAlign: "center" }}>
      <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: "0.03em", color: G.ink, marginBottom: 8 }}>On prépare ton plan…</h3>
      <p style={{ color: G.grey, fontSize: 14 }}>Calcul des phases d'entraînement<br />et génération des séances</p>
    </div>
    <div style={{ display: "flex", gap: 8 }}>
      {[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: G.blue, animation: `pulse 1.2s ease ${i * 0.2}s infinite` }} />)}
    </div>
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
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="scale-in" style={{ background: G.white, borderRadius: "24px 24px 0 0", padding: "28px 20px", paddingBottom: "max(28px, env(safe-area-inset-bottom))" }}>
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

const FeedbackModal = ({ weekNumber, onSubmit, onSkip }) => {
  const [selected, setSelected] = useState(null);

  const confirm = (id) => {
    setSelected(id);
    // Légère vibration tactile si disponible
    if (navigator.vibrate) navigator.vibrate(40);
    // Soumettre après une courte animation
    setTimeout(() => onSubmit({ rating: id, motivation: id, pain: "none", comment: null }), 320);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}>
      <div className="scale-in" style={{ background: G.white, borderRadius: "28px 28px 0 0", padding: "24px 20px", paddingBottom: "max(32px, env(safe-area-inset-bottom))" }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: G.greyLight, margin: "0 auto 24px" }} />

        <p style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: 2, textTransform: "uppercase", textAlign: "center", marginBottom: 8 }}>
          Semaine {weekNumber} terminée
        </p>
        <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 24, fontWeight: 800, color: G.ink, textAlign: "center", marginBottom: 6 }}>
          Comment tu t'es senti·e ?
        </h3>
        <p style={{ color: G.grey, fontSize: 14, textAlign: "center", marginBottom: 28, lineHeight: 1.5 }}>
          Ta réponse ajuste les prochaines séances.
        </p>

        {/* 3 smiley cards */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {SMILEY_OPTS.map(o => {
            const isActive = selected === o.id;
            return (
              <button key={o.id} onClick={() => confirm(o.id)} style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                padding: "18px 8px", borderRadius: 20,
                border: `2px solid ${isActive ? o.color : G.greyLight}`,
                background: isActive ? o.bg : G.white,
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
const PLAN_VERSION = 9; // Incrémenter à chaque changement de structure du plan

const PREMIUM_FEATURES = [
  { Icon: Plus,       label: "Plusieurs projets",     desc: "Triathlon + eau libre + BNSSA en parallèle" },
  { Icon: Calendar,   label: "Plans illimités",       desc: "Jusqu'à 52 semaines selon ton événement" },
  { Icon: TrendingUp, label: "Plan adaptatif",        desc: "Ajuste automatiquement selon tes retours" },
  { Icon: BarChart2,  label: "Stats avancées",        desc: "Graphiques détaillés et historique complet" },
  { Icon: Activity,   label: "Partage de séances",    desc: "Cartes visuelles pour Instagram & Strava" },
  { Icon: Award,      label: "Tous les badges",       desc: "Collection complète débloquée" },
];

const PRICE_MONTHLY = "price_1TP5yOAVxucD4jHaRYk2cbHC";
const PRICE_ANNUAL  = "price_1TPKQfAVxucD4jHaUDssY5cs";

const UpgradeModal = ({ onClose, weeksBlocked }) => {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [period, setPeriod] = useState("annual");

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
      const priceId = period === "annual" ? PRICE_ANNUAL : PRICE_MONTHLY;
      const json = await callFunction("create-checkout", { origin: window.location.origin, priceId });
      if (json.url) { window.location.href = json.url; return; }
      throw new Error(json.error || "Lien de paiement introuvable");
    } catch (e) { setErr(e.message || "Erreur."); setLoading(false); }
  };

  const isAnnual = period === "annual";
  const monthlyPrice = isAnnual ? "3,33 €" : "4,99 €";
  const totalLabel = isAnnual ? "39,99 € / an" : "4,99 € / mois";
  const saving = isAnnual ? "1 mois offert" : null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="scale-in" style={{ background: G.white, borderRadius: "24px 24px 0 0", padding: "28px 20px", paddingBottom: "max(28px, env(safe-area-inset-bottom))", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: G.greyLight, margin: "0 auto 24px" }} />
        <div style={{ textAlign: "center", marginBottom: 24, paddingTop: 8 }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: G.ink, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Zap size={26} color={G.white} />
          </div>
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 34, fontWeight: 800, letterSpacing: "0", textTransform: "uppercase", color: G.ink, marginBottom: 8 }}>MySWYM Premium</h3>
          {weeksBlocked
            ? <p style={{ color: G.grey, fontSize: 14, lineHeight: 1.6 }}>Accès gratuit limité au <strong style={{ color: G.ink }}>premier mois</strong>.<br />Débloque ton programme complet.</p>
            : <p style={{ color: G.grey, fontSize: 14 }}>Entraîne-toi sans limites.</p>}
        </div>

        {/* Cards mensuel / annuel */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {/* Mensuel */}
          <button onClick={() => setPeriod("monthly")} style={{
            flex: 1, padding: "14px 12px", borderRadius: 16, cursor: "pointer", textAlign: "left",
            border: `2px solid ${period === "monthly" ? G.blue : G.greyLight}`,
            background: period === "monthly" ? G.blueLight : G.white,
            transition: "all 0.18s",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: period === "monthly" ? G.blue : G.grey, marginBottom: 6, letterSpacing: "0.04em" }}>MENSUEL</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 800, color: period === "monthly" ? G.ink : G.grey }}>4,99€</div>
            <div style={{ fontSize: 11, color: G.greyMid, marginTop: 2 }}>/ mois</div>
          </button>

          {/* Annuel — mis en avant */}
          <button onClick={() => setPeriod("annual")} style={{
            flex: 1, padding: "14px 12px", borderRadius: 16, cursor: "pointer", textAlign: "left",
            border: `2px solid ${period === "annual" ? G.blue : G.greyLight}`,
            background: period === "annual" ? G.ink : G.white,
            transition: "all 0.18s", position: "relative", overflow: "hidden",
          }}>
            {/* Badge -33% */}
            <div style={{
              position: "absolute", top: 8, right: 8,
              background: "#22C55E", color: G.white,
              fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 6,
            }}>−33%</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: period === "annual" ? "rgba(255,255,255,0.55)" : G.grey, marginBottom: 4, letterSpacing: "0.04em" }}>ANNUEL</div>
            {/* Prix barré */}
            <div style={{ fontSize: 12, color: period === "annual" ? "rgba(255,255,255,0.3)" : G.greyMid, textDecoration: "line-through", marginBottom: 2 }}>4,99€/mois</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 800, color: period === "annual" ? G.white : G.ink }}>3,33€</div>
            <div style={{ fontSize: 11, color: period === "annual" ? "rgba(255,255,255,0.45)" : G.greyMid, marginTop: 2 }}>/ mois · 40€/an</div>
          </button>
        </div>

        {/* 1 mois offert pill — visible only on annual */}
        {isAnnual && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
            <span style={{ fontSize: 16 }}>🎁</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#15803D" }}>1 mois offert par rapport au mensuel</span>
          </div>
        )}

        {/* Features */}
        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 20 }}>
          {PREMIUM_FEATURES.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: G.greyXLight, borderRadius: 12 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: G.blueLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><f.Icon size={14} color={G.blue} /></div>
              <div><div style={{ fontSize: 13, fontWeight: 600, color: G.ink }}>{f.label}</div><div style={{ fontSize: 11, color: G.grey }}>{f.desc}</div></div>
            </div>
          ))}
        </div>

        {err && <div style={{ background: "#FFE8E8", borderRadius: 10, padding: "10px 14px", marginBottom: 12, color: "#CC0000", fontSize: 13 }}>{err}</div>}
        <Btn variant="blue" onClick={handleCheckout} disabled={loading}>
          {loading ? "Redirection…" : isAnnual ? "Démarrer — 40€/an" : "Démarrer — 4,99€/mois"}
        </Btn>
        <button onClick={onClose} style={{ width: "100%", marginTop: 10, padding: "12px", background: "none", border: "none", color: G.grey, cursor: "pointer", fontSize: 13 }}>Continuer en gratuit</button>
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
      <button onClick={onUpgrade} style={{ background: G.white, border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 700, color: G.ink, cursor: "pointer", flexShrink: 0 }}>
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
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Plan complet jusqu'à ton événement avec Premium</div>
    </div>
    <button onClick={onUpgrade} style={{ background: G.white, border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, color: G.blue, cursor: "pointer", flexShrink: 0 }}>Voir</button>
  </div>
);

// ── SESSION CARD ──────────────────────────────────────────────────────────
const SessionCard = ({ session, weekIndex, sessionIndex, onComplete, onShare }) => {
  const done = session.completed;
  const tm = TYPE_META[session.type] || TYPE_META.ENDURANCE;
  const [showTooltip, setShowTooltip] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // First detail line shown as inline description
  const firstDetail = session.details?.[0] || null;
  const hasMoreDetails = session.details?.length > 1;

  return (
    <div style={{
      background: done ? G.greyXLight : G.white,
      borderRadius: 16,
      border: `1px solid ${done ? G.greyLight : "rgba(142,179,255,0.13)"}`,
      opacity: done ? 0.72 : 1,
      transition: "all 0.3s",
      boxShadow: done ? "none" : "0 2px 12px rgba(142,179,255,0.10)",
      overflow: "hidden",
      position: "relative",
    }}>
      {/* Left accent bar */}
      {!done && (
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
          background: tm.color, borderRadius: "3px 0 0 3px",
        }} />
      )}

      {/* Main row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 14px 14px 18px" }}>
        {/* Icon circle */}
        <button
          onClick={() => setShowTooltip(v => !v)}
          style={{
            width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
            background: done ? G.greyLight : tm.bg,
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative", marginTop: 1,
          }}
        >
          <tm.Icon size={20} color={done ? G.greyMid : tm.color} />
          {showTooltip && tm.tooltip && (
            <div
              onClick={e => { e.stopPropagation(); setShowTooltip(false); }}
              style={{
                position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 50,
                background: G.ink, color: G.white, fontSize: 12, lineHeight: 1.5,
                padding: "10px 14px", borderRadius: 12, width: 230,
                boxShadow: "0 4px 20px rgba(0,0,0,0.22)", cursor: "pointer",
                textAlign: "left", fontWeight: 400,
              }}
            >
              {tm.tooltip}
            </div>
          )}
        </button>

        {/* Title + meta + description */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: done ? G.greyMid : tm.color, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>{session.type}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: done ? G.grey : G.ink, lineHeight: 1.3 }}>{session.title}</div>
            </div>
            {/* Right: distance pill + checkbox */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
              <button
                onClick={() => onComplete(weekIndex, sessionIndex)}
                style={{
                  width: 30, height: 30, borderRadius: "50%",
                  border: `2px solid ${done ? G.mint : G.greyLight}`,
                  background: done ? G.mint : "transparent",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s",
                }}
              >
                {done && <Check size={12} color={G.white} />}
              </button>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: done ? G.greyMid : tm.color,
                background: done ? G.greyLight : tm.bg,
                padding: "3px 10px", borderRadius: 100,
                whiteSpace: "nowrap",
              }}>{session.distance}</span>
            </div>
          </div>

          {/* Inline meta: time + intensity */}
          <div style={{ display: "flex", gap: 10, marginTop: 6, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Timer size={11} color={G.greyMid} />
              <span style={{ fontSize: 11, color: G.grey }}>{formatDuration(session.duration)}</span>
            </div>
            <span style={{ fontSize: 11, color: done ? G.greyMid : G.grey }}>·</span>
            <span style={{ fontSize: 11, color: done ? G.greyMid : G.inkLight, fontWeight: 500 }}>{session.intensity}</span>
          </div>

          {/* First detail line shown inline */}
          {firstDetail && (
            <div style={{ marginTop: 8, fontSize: 12, color: G.grey, lineHeight: 1.55 }}>
              <DetailLine text={firstDetail} />
            </div>
          )}
        </div>
      </div>

      {/* More details accordion */}
      {hasMoreDetails && (
        <>
          <button
            onClick={() => setExpanded(v => !v)}
            style={{
              width: "100%", padding: "7px 16px",
              background: expanded ? G.greyXLight : "transparent",
              border: "none", borderTop: `1px solid ${G.greyLight}`,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
              color: G.greyMid, fontSize: 11, fontWeight: 600,
            }}
          >
            <span>{expanded ? "Réduire" : `Voir tous les exercices (${session.details.length})`}</span>
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {expanded && (
            <div style={{ background: G.greyXLight, padding: "10px 16px 12px" }}>
              {session.details.slice(1).map((d, i) => (
                <div key={i} style={{ fontSize: 12, color: G.inkLight, lineHeight: 1.9 }}>· <DetailLine text={d} /></div>
              ))}
              {done && onShare && (
                <button onClick={() => onShare(session)} style={{ marginTop: 10, padding: "7px 12px", borderRadius: 10, background: G.white, border: `1px solid ${G.greyLight}`, fontSize: 11, color: G.grey, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                  <Activity size={11} color={G.grey} /> Partager cette séance
                </button>
              )}
            </div>
          )}
        </>
      )}
      {!hasMoreDetails && done && onShare && (
        <div style={{ padding: "0 16px 12px" }}>
          <button onClick={() => onShare(session)} style={{ padding: "7px 12px", borderRadius: 10, background: G.greyXLight, border: `1px solid ${G.greyLight}`, fontSize: 11, color: G.grey, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
            <Activity size={11} color={G.grey} /> Partager cette séance
          </button>
        </div>
      )}
    </div>
  );
};

// ── WEEK CARD ──────────────────────────────────────────────────────────────
const WeekCard = ({ week, weekIndex, onComplete, onShare, isCurrentWeek }) => {
  const [open, setOpen] = useState(isCurrentWeek);
  const done = week.sessions.filter(s => s.completed).length;
  const total = week.sessions.length;
  const allDone = done === total && total > 0;
  const totalDist = week.sessions.reduce((acc, s) => acc + (parseInt(s.distance) || 0), 0);
  const doneDist  = week.sessions.filter(s => s.completed).reduce((acc, s) => acc + (parseInt(s.distance) || 0), 0);
  const distLabel = totalDist >= 1000 ? `${(totalDist/1000).toFixed(1)} km` : `${totalDist} m`;

  return (
    <div style={{
      background: G.white,
      borderRadius: 20,
      overflow: "hidden",
      border: isCurrentWeek
        ? `2px solid ${G.blue}`
        : allDone ? `1px solid ${G.mint}40` : `1px solid rgba(142,179,255,0.13)`,
      marginBottom: 12,
      boxShadow: isCurrentWeek
        ? "0 6px 24px rgba(53,93,163,0.16)"
        : allDone ? "0 2px 10px rgba(0,196,140,0.08)" : "0 2px 10px rgba(142,179,255,0.07)",
    }}>
      {/* Top gradient bar */}
      {isCurrentWeek && (
        <div style={{ height: 4, background: `linear-gradient(90deg, ${G.blue}, ${G.blueMid})` }} />
      )}
      {allDone && !isCurrentWeek && (
        <div style={{ height: 4, background: `linear-gradient(90deg, ${G.mint}, #34d399)` }} />
      )}

      {/* Header button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", padding: "15px 16px", background: "none", border: "none", cursor: "pointer" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Left: title + badges */}
          <div style={{ textAlign: "left", flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: G.ink, letterSpacing: "-0.01em" }}>Semaine {week.number}</span>
              {isCurrentWeek && (
                <span style={{ fontSize: 9, fontWeight: 800, color: G.white, background: G.blue, padding: "3px 9px", borderRadius: 100, letterSpacing: "0.06em" }}>EN COURS</span>
              )}
              {allDone && !isCurrentWeek && (
                <span style={{ fontSize: 9, fontWeight: 800, color: G.mint, background: G.mintLight, padding: "3px 9px", borderRadius: 100, letterSpacing: "0.06em" }}>✓ TERMINÉE</span>
              )}
            </div>
            {/* Metric chips row */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: G.grey, lineHeight: 1.3 }}>{week.focus}</span>
              {totalDist > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, color: isCurrentWeek ? G.blue : G.greyMid, background: isCurrentWeek ? G.blueLight : G.greyXLight, padding: "2px 8px", borderRadius: 100 }}>
                  {distLabel}
                </span>
              )}
              <span style={{ fontSize: 11, fontWeight: 600, color: G.greyMid }}>· {total} séance{total > 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Right: ring + counter + chevron */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, marginLeft: 12 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: allDone ? G.mint : G.blue, letterSpacing: "-0.02em", lineHeight: 1 }}>{done}/{total}</div>
              <div style={{ fontSize: 9, color: G.greyMid, letterSpacing: "0.04em", textTransform: "uppercase", marginTop: 2 }}>séances</div>
            </div>
            <Ring value={total > 0 ? done / total : 0} size={36} stroke={4} color={allDone ? G.mint : G.blue} bg={G.greyLight} label="" />
            <div style={{ color: G.greyMid }}>
              {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>
        </div>
      </button>

      {/* Sessions list */}
      {open && (
        <div style={{ padding: "0 12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
          {week.sessions.map((s, i) => (
            <SessionCard key={i} session={s} weekIndex={weekIndex} sessionIndex={i} onComplete={onComplete} onShare={onShare} />
          ))}
          {week.tip && (
            <div style={{ background: G.goldLight, borderRadius: 14, padding: "11px 14px", display: "flex", gap: 10, alignItems: "flex-start", marginTop: 2 }}>
              <Star size={14} color={G.gold} style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 12, color: "#92400E", lineHeight: 1.55 }}>{week.tip}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── DETAIL LINE — rend les départs en badges tappables ──────────────────────
// Capture "D1'45"" (nouveau) ET "Dtoutes les 1'45"" (ancien format stocké)
const DEPART_RE = /D(?:toutes les )?(\d+['′]\d+"|\d+")/g;

const DetailLine = ({ text }) => {
  const parts = [];
  let last = 0;
  let match;
  DEPART_RE.lastIndex = 0;
  while ((match = DEPART_RE.exec(text)) !== null) {
    if (match.index > last) parts.push({ type: "text", val: text.slice(last, match.index) });
    parts.push({ type: "depart", val: `D${match[1]}` });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ type: "text", val: text.slice(last) });

  return (
    <>
      {parts.map((p, i) =>
        p.type === "text" ? (
          <span key={i}>{p.val}</span>
        ) : (
          <a
            key={i}
            href="/blog/depart-interval-natation"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 3,
              background: G.blueLight, color: G.blue,
              fontSize: 11, fontWeight: 700, padding: "1px 7px",
              borderRadius: 6, textDecoration: "none",
              borderBottom: `1.5px solid ${G.blue}22`,
              verticalAlign: "middle", margin: "0 1px",
            }}
          >
            <Clock size={10} color={G.blue} />
            {p.val}
          </a>
        )
      )}
    </>
  );
};

// ── RESET CONFIRM BUTTON ──────────────────────────────────────────────────
const ResetConfirmButton = ({ onReset }) => {
  const [confirm, setConfirm] = useState(false);
  if (confirm) return (
    <div style={{ marginTop: 8, background: G.coralLight, border: `1px solid ${G.coral}`, borderRadius: 12, padding: "16px 18px" }}>
      <p style={{ fontSize: 13, color: G.coral, fontWeight: 600, marginBottom: 4 }}>⚠️ Effacer ce plan ?</p>
      <p style={{ fontSize: 12, color: G.inkLight, lineHeight: 1.5, marginBottom: 14 }}>
        Toute ta progression sera perdue et tu devras recommencer le questionnaire depuis le début.
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setConfirm(false)} style={{ flex: 1, padding: "10px", background: G.white, border: `1px solid ${G.greyLight}`, borderRadius: 8, fontSize: 13, color: G.grey, cursor: "pointer", fontWeight: 500 }}>
          Annuler
        </button>
        <button onClick={onReset} style={{ flex: 1, padding: "10px", background: G.coral, border: "none", borderRadius: 8, fontSize: 13, color: G.white, cursor: "pointer", fontWeight: 600 }}>
          Oui, effacer
        </button>
      </div>
    </div>
  );
  return (
    <button onClick={() => setConfirm(true)} style={{ width: "100%", marginTop: 8, padding: "14px", background: "none", border: `1px solid ${G.greyLight}`, borderRadius: 12, color: G.grey, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
      <RotateCcw size={14} color={G.greyMid} /> Recommencer l'onboarding
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
    "Semaine de compétition. Reste calme, fais confiance à ton travail. La préparation est terminée — il ne reste plus qu'à exécuter.",
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

  const phase = week
    ? (plan.isProgression ? (currentWeekIndex < 4 ? "base" : currentWeekIndex < 8 ? "development" : "peak")
       : (week.isBilan ? "taper" : ["base","development","peak","taper","competition"].includes(
           plan.weeks[currentWeekIndex]?.focus?.toLowerCase().includes("compét") ? "competition"
           : plan.weeks[currentWeekIndex]?.focus?.toLowerCase().includes("affût") ? "taper"
           : plan.weeks[currentWeekIndex]?.focus?.toLowerCase().includes("vitesse") ? "peak"
           : plan.weeks[currentWeekIndex]?.focus?.toLowerCase().includes("seuil") ? "development"
           : "base"
         ) ? (
           plan.weeks[currentWeekIndex]?.focus?.toLowerCase().includes("compét") ? "competition"
           : plan.weeks[currentWeekIndex]?.focus?.toLowerCase().includes("affût") ? "taper"
           : plan.weeks[currentWeekIndex]?.focus?.toLowerCase().includes("vitesse") ? "peak"
           : plan.weeks[currentWeekIndex]?.focus?.toLowerCase().includes("seuil") ? "development"
           : "base"
         ) : "base"))
    : "default";

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
const PlanTab = ({ plan, profile, isPremium, onComplete, onShare, onReset, onUpgrade, startDate: startDateProp, plans, activePlanId, onSwitchPlan, onAddPlan, onDeletePlan }) => {
  const startDate = plan.startDate ?? startDateProp ?? null;
  const completedWeeks = plan.weeks.filter(w => w.sessions.every(s => s.completed)).length;
  const daysElapsed = startDate ? Math.floor((Date.now() - startDate) / (24 * 60 * 60 * 1000)) : null;
  const weeksElapsed = daysElapsed !== null ? Math.floor(daysElapsed / 7) : null;

  // Premium : +4 semaines par mois (tranche de 4)
  // Free    : +1 semaine par semaine, limité à FREE_WEEKS_LIMIT
  const unlocked = isPremium
    ? (weeksElapsed !== null
        ? Math.min(plan.weeks.length, (Math.floor(weeksElapsed / 4) + 1) * 4)
        : Math.min(plan.weeks.length, (Math.floor(completedWeeks / 4) + 1) * 4))
    : (weeksElapsed !== null
        ? Math.min(FREE_WEEKS_LIMIT, weeksElapsed + 1)
        : Math.min(FREE_WEEKS_LIMIT, completedWeeks + 1));

  // Jours avant le prochain déblocage
  const daysToNext = daysElapsed !== null
    ? (isPremium ? 28 - (daysElapsed % 28) : 7 - (daysElapsed % 7))
    : null;

  const currentWeekIndex = plan.weeks.findIndex(w => !w.sessions.every(s => s.completed));
  const currentWeek = currentWeekIndex >= 0 ? plan.weeks[currentWeekIndex] : null;

  const planLabel = GOALS.find(g => g.id === profile.goal)?.label
                 || CATEGORIES.find(c => c.id === profile.category)?.label
                 || "Mon plan";

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* ── Header sticky ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 30,
        background: "rgba(248,249,252,0.96)", backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: `1px solid rgba(142,179,255,0.10)`,
        paddingTop: "env(safe-area-inset-top)",
      }}>
        <div style={{ padding: "14px 16px 12px" }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: G.ink, marginBottom: 2, lineHeight: 1 }}>{planLabel}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: G.grey }}>Sem. {currentWeekIndex >= 0 ? currentWeekIndex + 1 : plan.weeks.length} / {plan.weeks.length}</span>
            {currentWeekIndex >= 0 && currentWeek?.focus && (
              <>
                <span style={{ width: 3, height: 3, borderRadius: "50%", background: G.greyMid, display: "inline-block" }} />
                <span style={{ fontSize: 12, color: G.blue, fontWeight: 600 }}>{currentWeek.focus}</span>
              </>
            )}
          </div>
        </div>
        {/* Plan switcher */}
        {plans && plans.length > 0 && (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 12, paddingLeft: 16, paddingRight: 16 }}>
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
                  background: isActive ? G.blueLight : G.white,
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
                    <button onClick={() => onDeletePlan(entry.id)} style={{
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
              border: `1.5px dashed ${G.greyLight}`, background: "transparent",
              color: G.greyMid, fontSize: 13, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", minHeight: 44,
            }}>
              <Plus size={13} /> Ajouter
            </button>
          </div>
        )}
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        <CoachCard plan={plan} profile={profile} currentWeekIndex={currentWeekIndex} />

        {/* Hero bento stats card */}
        {(() => {
          const totalDist = plan.weeks.reduce((acc, w) => acc + w.sessions.reduce((a, s) => a + (parseInt(s.distance) || 0), 0), 0);
          const completedDist = plan.weeks.reduce((acc, w) => acc + w.sessions.filter(s => s.completed).reduce((a, s) => a + (parseInt(s.distance) || 0), 0), 0);
          const totalMins = plan.weeks.reduce((acc, w) => acc + w.sessions.reduce((a, s) => a + (parseInt(s.duration) || 0), 0), 0);
          const daysToEvent = profile.eventDate
            ? Math.max(0, Math.ceil((new Date(profile.eventDate) - new Date()) / 86400000))
            : null;
          const progressPct = Math.round(completedDist / (totalDist || 1) * 100);
          const distLabel = totalDist >= 1000 ? `${(totalDist/1000).toFixed(1)} km` : `${totalDist} m`;
          const timeLabel = totalMins >= 60 ? `${Math.floor(totalMins/60)}h${totalMins%60 ? (totalMins%60)+'min' : ''}` : `${totalMins} min`;
          // Mini weekly bar chart data
          const bars = plan.weeks.map(w => ({
            total: w.sessions.reduce((a, s) => a + (parseInt(s.distance) || 0), 0),
            done:  w.sessions.filter(s => s.completed).reduce((a, s) => a + (parseInt(s.distance) || 0), 0),
          }));
          const maxBar = Math.max(...bars.map(b => b.total), 1);

          return (
            <div style={{ marginBottom: 22 }}>
              {/* Title row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: G.ink }}>Vue d'ensemble</h2>
                <span style={{ fontSize: 12, color: G.grey, fontWeight: 600 }}>{unlocked}/{plan.weeks.length} sem. débloquées</span>
              </div>

              {/* Bento grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {/* Big distance card — col span 2 if no chart, else left half */}
                <div style={{
                  background: `linear-gradient(135deg, ${G.blue} 0%, ${G.blueDeep} 100%)`,
                  borderRadius: 18, padding: "18px 16px",
                  boxShadow: "0 6px 20px rgba(53,93,163,0.22)",
                  display: "flex", flexDirection: "column", justifyContent: "space-between",
                }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Distance totale</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: G.white, letterSpacing: "-0.03em", lineHeight: 1 }}>{distLabel}</div>
                  {/* Progress bar */}
                  <div style={{ marginTop: 12 }}>
                    <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${progressPct}%`, background: G.blueMid, borderRadius: 2, transition: "width 0.8s ease" }} />
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 5 }}>{progressPct}% accompli</div>
                  </div>
                </div>

                {/* Mini bar chart card */}
                <div style={{
                  background: G.white, borderRadius: 18, padding: "14px 12px",
                  border: `1px solid rgba(142,179,255,0.13)`,
                  boxShadow: "0 2px 12px rgba(142,179,255,0.09)",
                  display: "flex", flexDirection: "column",
                }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: G.greyMid, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Par semaine</div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 3, flex: 1, minHeight: 44 }}>
                    {bars.map((b, i) => (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, height: "100%" }}>
                        <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                          <div style={{ width: "100%", borderRadius: "3px 3px 0 0", overflow: "hidden", background: G.greyXLight, height: `${Math.max(8, (b.total / maxBar) * 48)}px` }}>
                            <div style={{ width: "100%", height: `${b.total > 0 ? (b.done / b.total) * 100 : 0}%`, background: G.blue, borderRadius: "3px 3px 0 0" }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Time card */}
                <div style={{
                  background: G.white, borderRadius: 18, padding: "16px 14px",
                  border: `1px solid rgba(142,179,255,0.13)`,
                  boxShadow: "0 2px 12px rgba(142,179,255,0.09)",
                }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: G.purpleLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                    <Clock size={16} color={G.purple} />
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: G.ink, letterSpacing: "-0.02em", lineHeight: 1 }}>{timeLabel}</div>
                  <div style={{ fontSize: 10, color: G.grey, marginTop: 4 }}>Durée totale</div>
                </div>

                {/* Event countdown or sessions/week */}
                <div style={{
                  background: G.white, borderRadius: 18, padding: "16px 14px",
                  border: `1px solid rgba(142,179,255,0.13)`,
                  boxShadow: "0 2px 12px rgba(142,179,255,0.09)",
                }}>
                  {daysToEvent !== null ? (
                    <>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: G.mintLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                        <Target size={16} color={G.mint} />
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: G.ink, letterSpacing: "-0.02em", lineHeight: 1 }}>J−{daysToEvent}</div>
                      <div style={{ fontSize: 10, color: G.grey, marginTop: 4 }}>Avant l'event</div>
                    </>
                  ) : (
                    <>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: G.coralLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                        <Zap size={16} color={G.coral} />
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: G.ink, letterSpacing: "-0.02em", lineHeight: 1 }}>{profile.sessionsPerWeek}×/sem</div>
                      <div style={{ fontSize: 10, color: G.grey, marginTop: 4 }}>{plan.weeks.length} semaines</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Semaines débloquées */}
        {plan.weeks.slice(0, unlocked).map((week, i) => (
          <div key={i}>
            <WeekCard week={week} weekIndex={i} onComplete={onComplete} onShare={onShare} isCurrentWeek={i === currentWeekIndex} />
            {!isPremium && i === 0 && plan.totalRealWeeks > 1 && <PremiumTeaser onUpgrade={onUpgrade} />}
          </div>
        ))}

        {/* Free : paywall après FREE_WEEKS_LIMIT */}
        {!isPremium && plan.totalRealWeeks > FREE_WEEKS_LIMIT && unlocked >= FREE_WEEKS_LIMIT && (
          <PremiumBanner weeksTotal={plan.totalRealWeeks} weeksShown={FREE_WEEKS_LIMIT} onUpgrade={onUpgrade} />
        )}

        {/* Prochain lot flouté (aperçu) */}
        {(isPremium || unlocked < FREE_WEEKS_LIMIT) && unlocked < plan.weeks.length && (() => {
          const nextBatch = plan.weeks.slice(unlocked, isPremium ? unlocked + 4 : unlocked + 1);
          return (
            <div style={{ position: "relative", marginBottom: 10, borderRadius: 16, overflow: "hidden" }}>
              <div style={{ filter: "blur(6px)", pointerEvents: "none", userSelect: "none", opacity: 0.55 }}>
                {nextBatch.map((week, j) => (
                  <WeekCard key={j} week={week} weekIndex={unlocked + j} onComplete={() => {}} onShare={() => {}} isCurrentWeek={false} />
                ))}
              </div>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(240,244,248,0.5)", borderRadius: 16 }}>
                <div style={{ background: G.white, borderRadius: 12, padding: "12px 20px", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 2px 16px rgba(0,0,0,0.10)" }}>
                  <Lock size={14} color={G.blue} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: G.ink }}>
                    {daysToNext
                      ? `${isPremium ? "4 semaines" : "Semaine suivante"} dans ${daysToNext} jour${daysToNext > 1 ? "s" : ""}`
                      : isPremium ? "Complète le mois en cours" : "Complète la semaine en cours"}
                  </span>
                </div>
              </div>
            </div>
          );
        })()}

        <ResetConfirmButton onReset={onReset} />
      </div>
    </div>
  );
};

// ── DASHBOARD ──────────────────────────────────────────────────────────────
const Dashboard = ({ plan, profile, plans = [], activePlanId, onSwitchPlan, onTabChange, onComplete, onShare, onSignOut, user }) => {
  const goal = GOALS.find(g => g.id === profile.goal) || CATEGORIES.find(c => c.id === profile.category);
  const stats = computeStats(plan);
  const currentWeekIndex = plan.weeks.findIndex(w => !w.sessions.every(s => s.completed));
  const currentWeek = currentWeekIndex >= 0 ? plan.weeks[currentWeekIndex] : null;
  const nextSession = currentWeek?.sessions.find(s => !s.completed);
  const daysToEvent = profile.eventDate ? Math.max(0, Math.ceil((new Date(profile.eventDate) - new Date()) / 86400000)) : null;
  const tm = nextSession ? (TYPE_META[nextSession.type] || TYPE_META.ENDURANCE) : null;

  // Weekly progress
  const weekPlanned  = currentWeek?.sessions.reduce((a, s) => a + (parseInt(s.distance) || 0), 0) ?? 0;
  const weekDone     = currentWeek?.sessions.filter(s => s.completed).reduce((a, s) => a + (parseInt(s.distance) || 0), 0) ?? 0;
  const weekPct      = weekPlanned > 0 ? Math.min(100, Math.round(weekDone / weekPlanned * 100)) : 0;
  const weekSessions = currentWeek?.sessions.filter(s => s.completed).length ?? 0;
  const weekTotal    = currentWeek?.sessions.length ?? 0;

  // Recent completed sessions (last 3)
  const allSessions = plan.weeks.flatMap((w, wi) =>
    w.sessions.map((s, si) => ({ ...s, weekIndex: wi, sessionIndex: si, weekNum: w.number }))
  );
  const recentDone = allSessions.filter(s => s.completed).slice(-3).reverse();

  // Avatar / name — user_metadata en priorité (cross-device), localStorage en fallback
  const avatarUrl = user?.user_metadata?.avatar_url
    || (() => { try { return localStorage.getItem("myswym_avatar"); } catch { return null; } })();
  const firstName = user?.user_metadata?.firstname
    || (() => { try { return localStorage.getItem("myswym_firstname"); } catch { return null; } })()
    || user?.user_metadata?.full_name?.split(" ")[0]
    || user?.email?.split("@")[0]
    || "Nageur";
  const initials = firstName.slice(0, 2).toUpperCase();

  // Ring dimensions — compact for mobile
  const RS = 72, RSK = 7, Rr = (RS - RSK) / 2, Rcirc = 2 * Math.PI * Rr;
  const Roffset = Rcirc * (1 - weekPct / 100);

  const planFinished = stats.totalSessions >= stats.planTotal && stats.planTotal > 0;

  return (
    <div style={{ paddingBottom: "max(140px, calc(100px + env(safe-area-inset-bottom)))", background: G.bg, minHeight: "100dvh" }}>

      {/* ── Top App Bar ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: `1px solid rgba(142,179,255,0.10)`,
        boxShadow: "0 1px 16px rgba(142,179,255,0.08)",
        paddingTop: "env(safe-area-inset-top)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", minHeight: 56 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => onTabChange("profile")} style={{ border: "none", background: "none", cursor: "pointer", padding: 0, WebkitTapHighlightColor: "transparent" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", background: G.blueLight, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${G.blueMid}`, flexShrink: 0 }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 12, fontWeight: 800, color: G.blue }}>{initials}</span>
                }
              </div>
            </button>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 900, color: G.blueMid, letterSpacing: "0.06em", textTransform: "uppercase" }}>MySWYM</span>
          </div>
          <button onClick={onSignOut} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, margin: -4, WebkitTapHighlightColor: "transparent" }}>
            <Settings size={20} color={G.grey} />
          </button>
        </div>
      </header>

      <div style={{ padding: "16px 16px 0" }}>

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
          <div className="fade-up scale-in" style={{ background: G.white, borderRadius: 24, padding: "20px 16px", textAlign: "center", marginBottom: 16, border: `1px solid rgba(142,179,255,0.15)`, boxShadow: "0 4px 20px rgba(142,179,255,0.10)" }}>
            {plan.isProgression
              ? <><TrendingUp size={36} color={G.blue} style={{ margin: "0 auto 8px" }} /><h2 style={{ fontSize: 20, fontWeight: 800, color: G.ink, marginBottom: 6 }}>Cycle terminé</h2><p style={{ color: G.grey, fontSize: 13, marginBottom: 14 }}>Tu as nagé <strong style={{ color: G.ink }}>{(stats.totalMeters / 1000).toFixed(1)} km</strong> en {plan.weeks.length} semaines.</p><Btn variant="blue" onClick={onSignOut}>Nouveau cycle</Btn></>
              : <><Trophy size={36} color={G.gold} style={{ margin: "0 auto 8px" }} /><h2 style={{ fontSize: 20, fontWeight: 800, color: G.ink, marginBottom: 4 }}>Plan terminé</h2><p style={{ color: G.grey, fontSize: 13 }}>Programme complété à 100 %.</p></>
            }
          </div>
        )}

        {/* ── Prochaine séance — card principale ── */}
        {nextSession && tm ? (
          <button onClick={() => onTabChange("plan")} style={{
            width: "100%", textAlign: "left", cursor: "pointer",
            background: `linear-gradient(135deg, ${G.blue} 0%, ${G.blueDeep} 100%)`,
            borderRadius: 24, padding: "20px 18px", marginBottom: 12,
            border: "none", boxShadow: "0 10px 32px rgba(53,93,163,0.32)",
            WebkitTapHighlightColor: "transparent", display: "block",
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
              Sem. {currentWeekIndex + 1} · {currentWeek?.focus || "À faire"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <tm.Icon size={22} color={G.white} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: G.white, lineHeight: 1.2, marginBottom: 3 }}>{nextSession.title}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.65)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{nextSession.type}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>·</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: G.blueMid }}>{nextSession.distance}</span>
                </div>
              </div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 100, padding: "10px 18px", display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Waves size={14} color={G.white} />
              <span style={{ fontSize: 13, fontWeight: 700, color: G.white }}>C'est ma séance du jour</span>
              <ArrowRight size={14} color="rgba(255,255,255,0.6)" />
            </div>
          </button>
        ) : !planFinished && (
          <div style={{ background: G.white, borderRadius: 24, padding: "20px 18px", marginBottom: 12, textAlign: "center", border: "1px solid rgba(142,179,255,0.10)" }}>
            <Trophy size={28} color={G.gold} style={{ margin: "0 auto 8px" }} />
            <p style={{ color: G.grey, fontSize: 14, fontWeight: 600 }}>Toutes les séances sont terminées !</p>
          </div>
        )}

        {/* ── Semaine en cours ── */}
        <div style={{
          background: G.white, borderRadius: 24, padding: "18px",
          boxShadow: "0 4px 20px rgba(142,179,255,0.08)",
          border: "1px solid rgba(142,179,255,0.08)",
          marginBottom: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: G.grey, letterSpacing: "0.06em", textTransform: "uppercase" }}>Cette semaine</span>
            {daysToEvent !== null && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: G.blueLight, borderRadius: 100, padding: "3px 10px" }}>
                <Target size={10} color={G.blue} />
                <span style={{ fontSize: 10, fontWeight: 700, color: G.blue }}>J−{daysToEvent}</span>
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Ring */}
            <div style={{ position: "relative", width: RS, height: RS, flexShrink: 0 }}>
              <svg width={RS} height={RS} style={{ transform: "rotate(-90deg)" }}>
                <circle cx={RS/2} cy={RS/2} r={Rr} fill="transparent" stroke={G.greyLight} strokeWidth={RSK} />
                <circle cx={RS/2} cy={RS/2} r={Rr} fill="transparent" stroke={G.blue}
                  strokeWidth={RSK} strokeLinecap="round"
                  strokeDasharray={Rcirc} strokeDashoffset={Roffset}
                  style={{ transition: "stroke-dashoffset 1s ease" }}
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: G.blue, lineHeight: 1 }}>{weekPct}%</span>
              </div>
            </div>
            {/* Numbers */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: G.blue, letterSpacing: "-0.03em", lineHeight: 1 }}>
                  {weekDone > 0 ? weekDone.toLocaleString("fr") : "0"}
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, color: G.blueMid }}>m</span>
                <span style={{ fontSize: 12, color: G.greyMid, marginLeft: 4 }}>/ {weekPlanned >= 1000 ? `${(weekPlanned/1000).toFixed(1)} km` : `${weekPlanned} m`}</span>
              </div>
              <p style={{ fontSize: 13, color: G.grey }}>{weekSessions} / {weekTotal} séances{currentWeek?.focus ? ` · ${currentWeek.focus}` : ""}</p>
            </div>
            {/* Streak */}
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <div style={{ width: 44, height: 44, background: "#FFF3E0", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 4px" }}>
                <Flame size={20} color="#E65100" />
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: G.ink, lineHeight: 1 }}>{stats.streak}</div>
              <div style={{ fontSize: 10, color: G.grey }}>série</div>
            </div>
          </div>
        </div>

        {/* ── Dernières séances ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: G.ink }}>Dernières séances</h2>
          <button onClick={() => onTabChange("plan")} style={{ background: "none", border: "none", fontSize: 12, color: G.blue, cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 3, padding: "8px 0", WebkitTapHighlightColor: "transparent", minHeight: 44 }}>
            Tout voir <ArrowRight size={12} color={G.blue} />
          </button>
        </div>

        {recentDone.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {recentDone.map((s, i) => {
              const stm = TYPE_META[s.type] || TYPE_META.ENDURANCE;
              return (
                <div key={i} style={{
                  background: G.white, borderRadius: 18, padding: "14px 16px",
                  boxShadow: "0 2px 10px rgba(142,179,255,0.07)",
                  border: "1px solid rgba(142,179,255,0.08)",
                  display: "flex", alignItems: "center", gap: 14,
                }}>
                  <div style={{ width: 44, height: 44, borderRadius: 13, background: stm.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <stm.Icon size={20} color={stm.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: G.ink, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 11, color: G.grey }}>Sem. {s.weekNum}</span>
                      <div style={{ width: 3, height: 3, borderRadius: "50%", background: G.greyLight }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: stm.color }}>{s.distance}</span>
                    </div>
                  </div>
                  <Check size={18} color={G.mint} style={{ flexShrink: 0 }} />
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ background: G.white, borderRadius: 18, padding: "28px 16px", textAlign: "center", border: "1px solid rgba(142,179,255,0.10)", marginBottom: 16 }}>
            <Waves size={28} color={G.blueMid} style={{ margin: "0 auto 10px" }} />
            <p style={{ color: G.grey, fontSize: 14 }}>Aucune séance terminée — commence maintenant !</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ── STATS TAB ──────────────────────────────────────────────────────────────
const StatsTab = ({ plan }) => {
  const stats = computeStats(plan);
  const maxMeters = Math.max(...stats.weeklyData.map(w => w.total), 1);
  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ background: G.blue, padding: "52px 20px 28px" }}>
        <div className="fade-up" style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", letterSpacing: 2, marginBottom: 5, fontWeight: 700, textTransform: "uppercase" }}>Tes performances</div>
        <h1 className="fade-up-1" style={{ fontFamily: "'Lexend', sans-serif", fontSize: 28, fontWeight: 700, letterSpacing: "0.03em", color: G.white }}>Statistiques</h1>
      </div>
      <div style={{ padding: "20px 16px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <StatPill icon={Waves}       value={`${(stats.totalMeters / 1000).toFixed(1)} km`} label="Total nagés"         color={G.blue}  bg={G.blueLight} />
          <StatPill icon={Flame}       value={stats.streak}                                   label="Meilleure série"     color={G.coral} bg={G.coralLight} />
          <StatPill icon={Check}       value={stats.totalSessions}                            label="Séances faites"      color={G.mint}  bg={G.mintLight} />
          <StatPill icon={Star}        value={stats.perfectWeeks}                             label="Semaines parfaites"  color={G.gold}  bg={G.goldLight} />
        </div>
        <div style={{ background: G.white, borderRadius: 18, padding: "18px 16px", marginBottom: 16, border: `1px solid ${G.greyLight}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: "0.04em", color: G.ink, marginBottom: 16 }}>Volume par semaine</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100 }}>
            {stats.weeklyData.map((w, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%" }}>
                <div style={{ flex: 1, width: "100%", position: "relative" }}>
                  <div style={{ width: "100%", height: `${(w.total / maxMeters) * 100}%`, background: G.greyLight, borderRadius: "4px 4px 0 0", position: "absolute", bottom: 0 }} />
                  <div style={{ width: "100%", height: `${(w.done / maxMeters) * 100}%`, background: w.done === w.total && w.total > 0 ? G.mint : `linear-gradient(180deg, ${G.water} 0%, ${G.blue} 100%)`, borderRadius: "4px 4px 0 0", position: "absolute", bottom: 0, transition: "height 0.8s ease" }} />
                </div>
                <span style={{ fontSize: 10, color: G.grey }}>{w.label}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
            {[{ color: G.blue, label: "Réalisé" }, { color: G.greyLight, label: "Prévu" }].map((l, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                <span style={{ fontSize: 11, color: G.grey }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: G.white, borderRadius: 18, padding: "18px 16px", border: `1px solid ${G.greyLight}` }}>
          <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: "0.04em", color: G.ink, marginBottom: 14 }}>Répartition des types</h3>
          {Object.entries(TYPE_META).map(([type, tm]) => {
            const count = plan.weeks.flatMap(w => w.sessions).filter(s => s.type === type && s.completed).length;
            const total = plan.weeks.flatMap(w => w.sessions).filter(s => s.type === type).length;
            if (total === 0) return null;
            return (
              <div key={type} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <tm.Icon size={12} color={tm.color} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: G.ink }}>{type.charAt(0) + type.slice(1).toLowerCase()}</span>
                  </div>
                  <span style={{ fontSize: 12, color: G.grey }}>{count}/{total}</span>
                </div>
                <div style={{ height: 6, background: G.greyLight, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${total > 0 ? count / total * 100 : 0}%`, background: tm.color, borderRadius: 3, transition: "width 0.6s ease" }} />
                </div>
              </div>
            );
          })}
        </div>
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
                <div key={b.id} className="scale-in" style={{ background: G.white, borderRadius: 16, padding: 16, textAlign: "center", border: `2px solid ${b.color}20`, boxShadow: `0 4px 16px ${b.color}18` }}>
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
// Alias bnssa pour tests_pompiers (même type de séance)
Object.keys(BASE_DISTANCES).forEach(k => { BASE_DISTANCES[k].tests_pompiers = BASE_DISTANCES[k].bnssa; });

// pace100[lvl][zone] = secondes aux 100m (0=découverte 1=régulier 2=sportif 3=performance)
const PACE = {
  easy:      [220, 170, 130, 105],
  threshold: [200, 155, 112,  90],
  sprint:    [180, 140,  95,  75],
};

// ── Paces personnalisées ─────────────────────────────────────────────────
// Set par generatePlan quand profile.pace100 est renseigné.
// null = fallback sur le tableau PACE par niveau.
let _pace100 = null;
let _isPremium = false;

// Facteurs de zone basés sur le meilleur 100m personnel
const ZONE_MULT = { easy: 1.35, threshold: 1.08, sprint: 0.95 };

// Formate des secondes en m'ss"
const fmtS = s => `${Math.floor(s/60)}'${Math.round(s%60).toString().padStart(2,'0')}"`;

// Departure interval: swim time + rest, rounded up to 5s
// Quand _pace100 est set, affiche aussi l'allure cible /100m
const di = (meters, lvl, zone = 'easy') => {
  const rest = zone === 'sprint' ? 90 : zone === 'threshold' ? 15 : 20;
  let secsPer100;
  if (_pace100 !== null) {
    secsPer100 = _pace100 * (ZONE_MULT[zone] ?? 1.35);
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
  for (const line of details) {
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

    // ── PERFORMANCE / EXPERT : endurance + 4 nages ───────────────────────
    if (isAdv) {
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

    const isDiplome   = goal === "bnssa" || goal === "bpjeps_aan";
    const isBNSSA     = goal === "bnssa";
    const isTriathlon = goal.startsWith("triathlon");
    const isOpenWater = goal.startsWith("open_water") || goal.startsWith("eau_libre");

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
              `${n100}×100m crawl — R30" — allure régulière, respiration contrôlée`,
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
          title: isOpenWater ? "🌊 Séance eau libre — test combinaison" : "Reps longues",
          intensity: isOpenWater ? "Découverte OW — flottaison, navigation, sighting" : "Endurance — gestion sur la distance",
          details: isOpenWater ? [
            `📍 À faire en eau libre (lac, rivière calme, mer protégée)`,
            `10' d'adaptation : nage lente avec la combi — ressens la flottaison`,
            `3×5' de nage continue — récup 2' — sighting toutes les 6–8 bras`,
            `Effort : allure conversation, objectif orientation`,
            `Récup : retour au départ en brasse ou dos lent`,
          ] : [
            `Échauffement : 200m crawl + 100m dos + 4×${P}m accélérations`,
            `${nLong}×${rLong}m crawl — R15" — allure maîtrisée sur la totalité${isTriathlon ? " — maintiens ton allure de compétition" : ""}`,
            `${nFill}×${r1}m dos — R15" — récup active`,
            `Retour calme : 200m dos lent`,
          ],
        },
        {
          title: isOpenWater ? "🌊 Séance eau libre — endurance" : "Crawl & dos alternés",
          intensity: isOpenWater ? "Endurance OW — tenir l'allure sans repères" : "Endurance — polyvalence, récup naturelle",
          details: isOpenWater ? [
            `📍 À faire en eau libre`,
            `Échauffement : 10' de nage lente, teste tes repères visuels`,
            `20–30' de nage continue — sighting toutes les 8 bras, gère ton allure de A à Z`,
            `Si combi : teste les transitions (enlever la combi en 2')`,
            `Récup : 5' de brasse ou dos très lent`,
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
        {
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

    // ── PERFORMANCE / EXPERT : seuil + 4 nages ───────────────────────────
    if (isAdv) {
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

    const isDiplomeS   = goal === "bnssa" || goal === "bpjeps_aan";
    const isBNSSAS     = goal === "bnssa";
    const isTriathlon  = goal.startsWith("triathlon");
    const isOpenWater  = goal.startsWith("open_water") || goal.startsWith("eau_libre");

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
        {
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

    // ── PERFORMANCE / EXPERT : vitesse + 4 nages ─────────────────────────
    if (isAdv) {
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

    const isDiplomeV   = goal === "bnssa" || goal === "bpjeps_aan";
    const isBNSSAV     = goal === "bnssa";
    const isTriathlonV = goal.startsWith("triathlon");
    const isOpenWaterV = goal.startsWith("open_water") || goal.startsWith("eau_libre");

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

    // ── INTERMÉDIAIRE (7 variants — ~70% éducatif) ───────────────────────
    if (!isAdv) {
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

    // ── EXPERT / PERFORMANCE : technique 4 nages (6 variants) ───────────
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
    const P = pool, v = weekIdx % 3;
    const nApnee  = Math.max(4, Math.min(10, Math.round(dist * 0.15 / 15)));
    const nRem    = Math.max(3, Math.min(6,  Math.round(dist * 0.15 / P)));
    const nPalmes = Math.max(4, Math.min(8,  Math.round(dist * 0.25 / (2*P))));
    const nNL     = Math.max(3, Math.min(8,  Math.round(dist * 0.25 / (2*P))));

    return {
      type: "BNSSA",
      ...[
        {
          title: "Simulation parcours 100m",
          intensity: "Apnée & remorquage — qualité de parcours",
          details: [
            `Échauffement : 200m NL progressif + 100m battements de jambes`,
            `Apnée dynamique : ${nApnee}×15m immersion complète — R2' — tracé fond, sans appui, sans pied`,
            `Simulation 100m : 25m NL → 15m apnée → virage mur → 15m apnée → virage mur → 25m remorquage — R3' — reproduis le parcours`,
            `Remorquage : ${nRem}×${P}m — R1'30" — position dorsale, visage hors de l'eau, bras sous les aisselles`,
            `Retour au calme : 200m dos lent`,
          ],
        },
        {
          title: "Prépa 250m palmes & plongée",
          intensity: "Endurance équipée + apnée profonde",
          details: [
            `Échauffement : 200m NL + 100m battements de jambes`,
            `${nPalmes}×${2*P}m palmes + masque + tuba — R20" — touche le mur à chaque virage`,
            `Plongée canard : 6× plongée → fond 2–3m → saisie mannequin → remontée — R2' — contrôle la remontée, voies aériennes dégagées`,
            `Remorquage : ${nRem}×${P}m position dorsale — R1'30" — visage mannequin au-dessus de l'eau`,
            `Retour au calme : 200m dos lent`,
          ],
        },
        {
          title: "Endurance & apnée sous fatigue",
          intensity: "Tenir les apnées après l'effort",
          details: [
            `Échauffement : 200m NL progressif + 100m battements de jambes`,
            `${nNL}×${2*P}m NL — R20" — endurance de base pour tenir le rythme du 100m et du 250m`,
            `Apnée dynamique : ${nApnee}×15m — R2' — immersion complète sans appui, reproduis les sections du parcours`,
            `${nRem}×${P}m remorquage — R1'30" — position dorsale, traction régulière`,
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
              `${nB}×${repR}m sculling avant — R10" — mains en figure 8, sens la portance de l'eau`,
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

    // ── PERFORMANCE / EXPERT : récup active + 4 nages ─────────────────────
    if (!isBeg && (level === "performance" || level === "advanced")) {
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
          title: "Sculling & relâchement",
          intensity: "Z1 — ressentir l'eau",
          details: [
            `${nA}×${P}m sculling — R10" — mains en 'figure 8', sens la portance`,
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
            nC > 0 ? `${nC}×${P}m sculling dos — R10" — mains au niveau des hanches, sens la portance` : `${repR}m NL très lent libre`,
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
  competition: "Dernière semaine : nage légère, visualise chaque virage et chaque poussée. Ton entraînement est fait — fais confiance au travail accompli.",
};

// Ratios par niveau — découverte : fun + endurance légère, pas de seuil/vitesse au début
const PHASE_PATTERNS = {
  // Découverte — endurance légère + technique simple + récupération douce
  découverte: {
    base:        { 1: ["endurance"], 2: ["endurance","récupération"], 3: ["endurance","technique","récupération"], 4: ["endurance","endurance","technique","récupération"], 5: ["endurance","endurance","technique","récupération","endurance"] },
    development: { 1: ["endurance"], 2: ["endurance","technique"],    3: ["endurance","endurance","technique"],    4: ["endurance","seuil","technique","récupération"],   5: ["endurance","seuil","technique","récupération","endurance"] },
    peak:        { 1: ["endurance"], 2: ["endurance","vitesse"],      3: ["endurance","vitesse","technique"],      4: ["endurance","vitesse","technique","récupération"],  5: ["endurance","vitesse","technique","récupération","endurance"] },
    taper:       { 1: ["récupération"], 2: ["endurance","récupération"], 3: ["endurance","récupération","récupération"], 4: ["endurance","technique","récupération","récupération"], 5: ["endurance","technique","récupération","récupération","endurance"] },
    competition: { 1: ["récupération"], 2: ["récupération","récupération"], 3: ["endurance","récupération","récupération"], 4: ["endurance","récupération","récupération","récupération"], 5: ["endurance","récupération","récupération","récupération","récupération"] },
  },
  // Régulier = alias de beginner
  régulier: {
    base:        { 1: ["technique"], 2: ["technique","endurance"], 3: ["technique","technique","endurance"], 4: ["endurance","technique","technique","récupération"], 5: ["endurance","technique","technique","récupération","endurance"] },
    development: { 1: ["seuil"],    2: ["technique","endurance"], 3: ["technique","seuil","endurance"],     4: ["technique","seuil","endurance","technique"],        5: ["technique","seuil","endurance","technique","récupération"] },
    peak:        { 1: ["seuil"],    2: ["technique","seuil"],     3: ["technique","seuil","vitesse"],       4: ["technique","seuil","vitesse","endurance"],          5: ["technique","seuil","vitesse","endurance","récupération"] },
    taper:       { 1: ["endurance"], 2: ["technique","récupération"], 3: ["technique","endurance","récupération"], 4: ["technique","endurance","récupération","récupération"], 5: ["technique","endurance","récupération","récupération","endurance"] },
    competition: { 1: ["récupération"], 2: ["récupération","récupération"], 3: ["technique","récupération","récupération"], 4: ["technique","récupération","récupération","récupération"], 5: ["technique","récupération","récupération","récupération","récupération"] },
  },
  // Sportif = alias de intermediate
  sportif: {
    base:        { 1: ["technique"], 2: ["technique","endurance"], 3: ["technique","technique","endurance"], 4: ["endurance","technique","technique","récupération"], 5: ["endurance","technique","technique","récupération","endurance"] },
    development: { 1: ["seuil"],    2: ["technique","seuil"],     3: ["technique","seuil","endurance"],     4: ["technique","seuil","endurance","technique"],        5: ["technique","seuil","endurance","technique","récupération"] },
    peak:        { 1: ["seuil"],    2: ["technique","seuil"],     3: ["technique","seuil","vitesse"],       4: ["technique","seuil","vitesse","endurance"],          5: ["technique","seuil","vitesse","endurance","récupération"] },
    taper:       { 1: ["endurance"], 2: ["technique","récupération"], 3: ["technique","endurance","récupération"], 4: ["technique","endurance","récupération","récupération"], 5: ["technique","endurance","récupération","récupération","endurance"] },
    competition: { 1: ["récupération"], 2: ["récupération","récupération"], 3: ["technique","récupération","récupération"], 4: ["technique","récupération","récupération","récupération"], 5: ["technique","récupération","récupération","récupération","récupération"] },
  },
  // Performance = alias de advanced
  performance: {
    base:        { 1: ["endurance"], 2: ["endurance","technique"], 3: ["endurance","endurance","technique"], 4: ["endurance","endurance","technique","récupération"], 5: ["endurance","endurance","technique","récupération","endurance"] },
    development: { 1: ["seuil"],     2: ["endurance","seuil"],     3: ["endurance","seuil","technique"],     4: ["endurance","seuil","vitesse","technique"],          5: ["endurance","seuil","vitesse","technique","endurance"] },
    peak:        { 1: ["seuil"],     2: ["seuil","vitesse"],        3: ["endurance","seuil","vitesse"],       4: ["endurance","seuil","vitesse","seuil"],              5: ["endurance","seuil","vitesse","seuil","récupération"] },
    taper:       { 1: ["endurance"], 2: ["endurance","récupération"], 3: ["endurance","technique","récupération"], 4: ["endurance","technique","récupération","récupération"], 5: ["endurance","technique","récupération","récupération","endurance"] },
    competition: { 1: ["récupération"], 2: ["récupération","récupération"], 3: ["endurance","récupération","récupération"], 4: ["endurance","récupération","récupération","récupération"], 5: ["endurance","récupération","récupération","récupération","récupération"] },
  },
  beginner: {
    base:        { 1: ["technique"], 2: ["technique","technique"], 3: ["technique","technique","endurance"], 4: ["technique","technique","technique","endurance"], 5: ["technique","technique","technique","endurance","récupération"] },
    development: { 1: ["technique"], 2: ["technique","endurance"], 3: ["technique","technique","endurance"], 4: ["technique","technique","endurance","récupération"], 5: ["technique","technique","technique","endurance","récupération"] },
    peak:        { 1: ["technique"], 2: ["technique","endurance"], 3: ["technique","endurance","technique"], 4: ["technique","technique","endurance","récupération"], 5: ["technique","technique","endurance","technique","récupération"] },
    taper:       { 1: ["technique"], 2: ["technique","récupération"], 3: ["technique","technique","récupération"], 4: ["technique","technique","récupération","récupération"], 5: ["technique","technique","récupération","récupération","endurance"] },
    competition: { 1: ["récupération"], 2: ["technique","récupération"], 3: ["technique","récupération","récupération"], 4: ["technique","récupération","récupération","récupération"], 5: ["technique","récupération","récupération","récupération","récupération"] },
  },
  intermediate: {
    base:        { 1: ["technique"], 2: ["technique","endurance"], 3: ["technique","technique","endurance"], 4: ["endurance","technique","technique","récupération"], 5: ["endurance","technique","technique","récupération","endurance"] },
    development: { 1: ["seuil"],    2: ["technique","seuil"],     3: ["technique","seuil","endurance"],     4: ["technique","seuil","endurance","technique"],        5: ["technique","seuil","endurance","technique","récupération"] },
    peak:        { 1: ["seuil"],    2: ["technique","seuil"],     3: ["technique","seuil","vitesse"],       4: ["technique","seuil","vitesse","endurance"],          5: ["technique","seuil","vitesse","endurance","récupération"] },
    taper:       { 1: ["endurance"], 2: ["technique","récupération"], 3: ["technique","endurance","récupération"], 4: ["technique","endurance","récupération","récupération"], 5: ["technique","endurance","récupération","récupération","endurance"] },
    competition: { 1: ["récupération"], 2: ["récupération","récupération"], 3: ["technique","récupération","récupération"], 4: ["technique","récupération","récupération","récupération"], 5: ["technique","récupération","récupération","récupération","récupération"] },
  },
  advanced: {
    base:        { 1: ["endurance"], 2: ["endurance","technique"], 3: ["endurance","endurance","technique"], 4: ["endurance","endurance","technique","récupération"], 5: ["endurance","endurance","technique","récupération","endurance"] },
    development: { 1: ["seuil"],     2: ["endurance","seuil"],     3: ["endurance","seuil","technique"],     4: ["endurance","seuil","vitesse","technique"],          5: ["endurance","seuil","vitesse","technique","endurance"] },
    peak:        { 1: ["seuil"],     2: ["seuil","vitesse"],        3: ["endurance","seuil","vitesse"],       4: ["endurance","seuil","vitesse","seuil"],              5: ["endurance","seuil","vitesse","seuil","récupération"] },
    taper:       { 1: ["endurance"], 2: ["endurance","récupération"], 3: ["endurance","technique","récupération"], 4: ["endurance","technique","récupération","récupération"], 5: ["endurance","technique","récupération","récupération","endurance"] },
    competition: { 1: ["récupération"], 2: ["récupération","récupération"], 3: ["endurance","récupération","récupération"], 4: ["endurance","récupération","récupération","récupération"], 5: ["endurance","récupération","récupération","récupération","récupération"] },
  },
};

const BNSSA_PATTERNS = {
  base:        { 1: ["endurance"], 2: ["endurance", "bnssa"],  3: ["endurance", "bnssa", "récupération"],  4: ["endurance", "endurance", "bnssa", "récupération"],         5: ["endurance", "endurance", "bnssa", "récupération", "endurance"] },
  development: { 1: ["bnssa"],     2: ["endurance", "bnssa"],  3: ["endurance", "bnssa", "bnssa"],         4: ["endurance", "seuil", "bnssa", "bnssa"],                     5: ["endurance", "seuil", "bnssa", "bnssa", "récupération"] },
  peak:        { 1: ["bnssa"],     2: ["bnssa", "bnssa"],       3: ["endurance", "bnssa", "bnssa"],         4: ["endurance", "seuil", "bnssa", "bnssa"],                     5: ["endurance", "seuil", "bnssa", "bnssa", "récupération"] },
  taper:       { 1: ["endurance"], 2: ["endurance", "bnssa"],  3: ["endurance", "bnssa", "récupération"],  4: ["endurance", "bnssa", "récupération", "récupération"],       5: ["endurance", "bnssa", "récupération", "récupération", "endurance"] },
  competition: { 1: ["récupération"], 2: ["récupération", "récupération"], 3: ["endurance", "récupération", "récupération"], 4: ["endurance", "récupération", "récupération", "récupération"], 5: ["endurance", "récupération", "récupération", "récupération", "récupération"] },
};

const WELLNESS_PATTERNS = {
  beginner: {
    base:        { 1: ["technique"], 2: ["technique","récupération"], 3: ["technique","technique","récupération"], 4: ["technique","technique","technique","récupération"], 5: ["technique","technique","technique","récupération","endurance"] },
    development: { 1: ["technique"], 2: ["technique","endurance"],    3: ["technique","technique","endurance"],    4: ["technique","technique","endurance","récupération"],  5: ["technique","technique","endurance","récupération","technique"] },
  },
  intermediate: {
    base:        { 1: ["technique"], 2: ["endurance","technique"],    3: ["technique","endurance","récupération"], 4: ["endurance","technique","technique","récupération"], 5: ["endurance","technique","technique","récupération","endurance"] },
    development: { 1: ["endurance"], 2: ["technique","endurance"],    3: ["technique","endurance","endurance"],    4: ["technique","endurance","endurance","récupération"],  5: ["technique","endurance","endurance","récupération","endurance"] },
  },
  advanced: {
    base:        { 1: ["endurance"], 2: ["endurance","récupération"], 3: ["endurance","technique","récupération"], 4: ["endurance","endurance","technique","récupération"], 5: ["endurance","endurance","technique","récupération","endurance"] },
    development: { 1: ["endurance"], 2: ["endurance","technique"],    3: ["endurance","endurance","technique"],    4: ["endurance","endurance","technique","récupération"],  5: ["endurance","endurance","technique","récupération","endurance"] },
  },
};

const PROGRESSION_PATTERNS = {
  beginner: {
    base:        { 1: ["technique"],    2: ["technique","endurance"],        3: ["technique","technique","récupération"],              4: ["technique","technique","endurance","récupération"],             5: ["technique","technique","endurance","récupération","technique"] },
    development: { 1: ["technique"],    2: ["technique","endurance"],        3: ["technique","endurance","technique"],                 4: ["technique","endurance","technique","récupération"],             5: ["technique","technique","endurance","récupération","endurance"] },
    peak:        { 1: ["technique"],    2: ["technique","seuil"],            3: ["technique","seuil","endurance"],                    4: ["technique","seuil","endurance","récupération"],                 5: ["technique","seuil","endurance","récupération","technique"] },
    bilan:       { 1: ["récupération"], 2: ["récupération","technique"],     3: ["récupération","technique","endurance"],             4: ["récupération","technique","technique","endurance"],             5: ["récupération","technique","technique","endurance","endurance"] },
  },
  intermediate: {
    base:        { 1: ["technique"],    2: ["technique","endurance"],        3: ["technique","endurance","récupération"],              4: ["endurance","technique","endurance","récupération"],             5: ["endurance","technique","endurance","récupération","endurance"] },
    development: { 1: ["seuil"],        2: ["technique","seuil"],            3: ["technique","seuil","endurance"],                    4: ["technique","seuil","endurance","récupération"],                 5: ["technique","seuil","endurance","technique","récupération"] },
    peak:        { 1: ["vitesse"],      2: ["technique","vitesse"],          3: ["vitesse","seuil","endurance"],                      4: ["technique","vitesse","seuil","récupération"],                   5: ["technique","vitesse","seuil","endurance","récupération"] },
    bilan:       { 1: ["récupération"], 2: ["récupération","technique"],     3: ["récupération","technique","endurance"],             4: ["récupération","technique","endurance","technique"],             5: ["récupération","technique","endurance","technique","endurance"] },
  },
  advanced: {
    base:        { 1: ["endurance"],    2: ["endurance","technique"],        3: ["endurance","technique","récupération"],              4: ["endurance","endurance","technique","récupération"],             5: ["endurance","endurance","technique","récupération","endurance"] },
    development: { 1: ["endurance"],    2: ["seuil","endurance"],            3: ["seuil","endurance","technique"],                    4: ["seuil","endurance","technique","récupération"],                 5: ["seuil","endurance","technique","récupération","endurance"] },
    peak:        { 1: ["vitesse"],      2: ["vitesse","seuil"],              3: ["vitesse","seuil","endurance"],                      4: ["vitesse","seuil","endurance","récupération"],                   5: ["vitesse","seuil","endurance","récupération","vitesse"] },
    bilan:       { 1: ["récupération"], 2: ["récupération","technique"],     3: ["récupération","technique","endurance"],             4: ["récupération","technique","endurance","technique"],             5: ["récupération","technique","endurance","technique","endurance"] },
  },
};

const buildProgressionPhases = () => {
  const phases = [];
  for (let i = 0; i < 4; i++) { const t = i / 3; phases.push({ phase: "base",        focus: t < 0.5 ? "Mise en place" : "Construction du volume", progression: 1.0 + t * 0.20, tipKey: t < 0.5 ? "debut" : "aerobie",    isBilan: false }); }
  for (let i = 0; i < 4; i++) { const t = i / 3; phases.push({ phase: "development", focus: t < 0.5 ? "Développement" : "Travail au seuil",       progression: 1.20 + t * 0.20, tipKey: "seuil",                            isBilan: false }); }
  for (let i = 0; i < 3; i++) { const t = i / 2; phases.push({ phase: "peak",        focus: t < 0.5 ? "Intensité max" : "Volume maximum",          progression: 1.40 + t * 0.15, tipKey: "vitesse",                          isBilan: false }); }
  phases.push({ phase: "bilan", focus: "Bilan & récupération", progression: 1.0, tipKey: "affutage", isBilan: true });
  return phases;
};

const buildWellnessPhases = (totalWeeks) => {
  const phases = [];
  for (let i = 0; i < totalWeeks; i++) {
    const t = totalWeeks > 1 ? i / (totalWeeks - 1) : 0;
    const isBase = t < 0.5;
    phases.push({
      phase: isBase ? "base" : "development",
      focus: t < 0.25 ? "Mise en mouvement" : t < 0.5 ? "Construction" : t < 0.75 ? "Progression" : "Consolidation",
      progression: 1.0 + t * 0.35,
      tipKey: t < 0.4 ? "debut" : "endurance",
    });
  }
  return phases;
};

const buildPlanPhases = (totalWeeks) => {
  if (totalWeeks === 1) return [{ phase: "competition", focus: "Semaine de compétition", progression: 0.60, tipKey: "competition" }];
  if (totalWeeks === 2) return [{ phase: "base", focus: "Mise en jambes", progression: 1.00, tipKey: "debut" }, { phase: "competition", focus: "Semaine de compétition", progression: 0.60, tipKey: "competition" }];
  if (totalWeeks === 3) return [{ phase: "base", focus: "Mise en jambes", progression: 1.00, tipKey: "debut" }, { phase: "development", focus: "Développement", progression: 1.20, tipKey: "endurance" }, { phase: "competition", focus: "Semaine de compétition", progression: 0.60, tipKey: "competition" }];

  const compWeeks = 1, taperWeeks = totalWeeks >= 6 ? 1 : 0, remaining = totalWeeks - compWeeks - taperWeeks;
  const peakCount = Math.max(1, Math.round(remaining * 0.20)), devCount = Math.max(1, Math.round(remaining * 0.38)), baseCount = remaining - peakCount - devCount;
  const phases = [];
  for (let i = 0; i < baseCount; i++) { const t = baseCount > 1 ? i / (baseCount - 1) : 0; phases.push({ phase: "base", focus: t < 0.45 ? "Mise en jambes" : "Construction aérobie", progression: 1.0 + t * 0.28, tipKey: t < 0.45 ? "debut" : "aerobie" }); }
  for (let i = 0; i < devCount; i++) { const t = devCount > 1 ? i / (devCount - 1) : 0; phases.push({ phase: "development", focus: t < 0.5 ? "Développement endurance" : "Travail au seuil", progression: 1.28 + t * 0.22, tipKey: t < 0.5 ? "endurance" : "seuil" }); }
  for (let i = 0; i < peakCount; i++) { const t = peakCount > 1 ? i / (peakCount - 1) : 0; phases.push({ phase: "peak", focus: t < 0.5 ? "Intensité & vitesse" : "Volume maximum", progression: 1.50 + t * 0.10, tipKey: t < 0.5 ? "vitesse" : "volume" }); }
  if (taperWeeks > 0) phases.push({ phase: "taper", focus: "Affûtage", progression: 1.15, tipKey: "affutage" });
  phases.push({ phase: "competition", focus: "Semaine de compétition", progression: 0.60, tipKey: "competition" });
  return phases;
};

const FREE_MAX_WEEKS = FREE_WEEKS_LIMIT;

const generatePlan = async (profile, isPremium = false) => {
  await new Promise(r => setTimeout(r, 1800));
  const { level, sessionsPerWeek: freq, pool, goal } = profile;

  // Active les paces personnalisées pour toute la génération du plan
  _pace100 = profile.pace100 && profile.pace100 > 0 ? profile.pace100 : null;
  _isPremium = !!isPremium;
  const wellness = isWellnessGoal(goal);
  const progression = isProgressionGoal(goal);

  let rawWeeks;
  if (progression) {
    rawWeeks = 12;
  } else if (wellness) {
    if (goal === "perte_de_poids") {
      const loss = Math.max(0, (parseFloat(profile.weightCurrent) || 0) - (parseFloat(profile.weightGoal) || 0));
      rawWeeks = loss > 0 ? Math.min(16, Math.max(4, Math.ceil(loss * 2))) : 8;
    } else if (goal === "reprendre") {
      rawWeeks = 6;
    } else {
      rawWeeks = 8;
    }
  } else {
    rawWeeks = Math.min(52, weeksUntil(profile.eventDate) || 8);
  }

  const totalWeeks = isPremium ? rawWeeks : Math.min(rawWeeks, FREE_MAX_WEEKS);
  const baseDist = BASE_DISTANCES[level] || BASE_DISTANCES.régulier;
  const progressionPhaseList = progression ? buildProgressionPhases() : null;
  const phaseList = progression ? progressionPhaseList.slice(0, totalWeeks) : wellness ? buildWellnessPhases(totalWeeks) : buildPlanPhases(totalWeeks);
  // Résolution du levelKey pour les patterns : priorité aux nouveaux niveaux, fallback anciens
  const levelKey = (PHASE_PATTERNS[level] ? level : (level === "advanced" ? "performance" : level === "beginner" ? "régulier" : level === "intermediate" ? "sportif" : "régulier"));
  // PROGRESSION_PATTERNS et WELLNESS_PATTERNS sont indexés par "beginner"/"intermediate"/"advanced"
  const progLvlKey = getLvlIndex(level) >= 3 ? "advanced" : getLvlIndex(level) >= 2 ? "intermediate" : "beginner";
  const patterns = progression ? (PROGRESSION_PATTERNS[progLvlKey] || PROGRESSION_PATTERNS.intermediate)
                 : wellness   ? (WELLNESS_PATTERNS[progLvlKey] || WELLNESS_PATTERNS.intermediate)
                 : (goal === "bnssa" || goal === "tests_pompiers") ? BNSSA_PATTERNS
                 : (PHASE_PATTERNS[levelKey] || PHASE_PATTERNS.régulier);
  const f = Math.min(freq, 5);
  const weeks = phaseList.map((phase, wi) => {
    const types = patterns[phase.phase]?.[f] || patterns.base[f] || ["endurance"];
    return {
      number: wi + 1, focus: phase.focus, tip: TIPS[phase.tipKey], feedback: null, isBilan: phase.isBilan ?? false,
      sessions: types.map((type, si) => {
        const distBase = Math.round(baseDist[type] * phase.progression / 50) * 50;
        const sessionData = SESSION_TEMPLATES[type](distBase, pool, level, wi * 10 + si, goal);
        const realDist = calcSessionDistance(sessionData.details);

        // Si le contenu généré est trop loin de la cible, on ajoute un bloc de volume explicite
        const deficit = distBase - realDist;
        // Taille des reps selon le déficit : petites distances → 100m, moyennes → 200m, grandes → 400m
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
        return { ...sessionData, details, distance: `${dist}m`, duration: Math.max(30, Math.min(120, Math.round(dist / 38))), completed: false };
      }),
    };
  });
  return { weeks, totalRealWeeks: rawWeeks, isPremium, isProgression: progression, startDate: Date.now(), version: PLAN_VERSION };
};

// ── APP ───────────────────────────────────────────────────────────────────
const BLANK_PROFILE = { category: "", goal: "", eventDate: "", level: "", pool: 50, sessionsPerWeek: null, weightCurrent: "", weightGoal: "", pace100: null, pace400: null };

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [screen, setScreen] = useState("onboarding");
  const [activeTab, setActiveTab] = useState("home");
  const [step, setStep] = useState(1);
  // Onboarding draft profile (reset à chaque nouveau plan)
  const [profile, setProfile] = useState(BLANK_PROFILE);
  // Multi-plan
  const [plans, setPlans] = useState([]);
  const [activePlanId, setActivePlanId] = useState(null);
  const [addingPlan, setAddingPlan] = useState(false);
  const [error, setError] = useState(null);
  const [feedbackWeek, setFeedbackWeek] = useState(null);
  const [shareSession, setShareSession] = useState(null);
  const [newBadgeId, setNewBadgeId] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (msg, duration = 5000) => { setToast(msg); setTimeout(() => setToast(null), duration); };
  const prevBadgesRef = useRef([]);

  // Valeurs dérivées du plan actif
  const activePlanEntry = plans.find(e => e.id === activePlanId) ?? null;
  const plan            = activePlanEntry?.plan    ?? null;
  const activeProfile   = activePlanEntry?.profile ?? BLANK_PROFILE;

  // Back button → landing page
  useEffect(() => {
    const handlePop = () => {
      if (!window.location.pathname.startsWith("/app")) {
        window.location.replace("/");
      }
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

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
      if (premium) setShowUpgrade(false);
    };

    // Refresh immédiat
    supabase.auth.refreshSession().then(({ data }) => applyUser(data?.user));

    if (payment === "success") {
      showToast("Activation en cours… Si ça tarde, clique sur « Actualiser le statut » dans Profil.", 8000);
    }

    // Retry jusqu'à 30s pour laisser le webhook Stripe arriver
    const retry = (ms) => setTimeout(() => supabase.auth.refreshSession().then(({ data }) => applyUser(data?.user)), ms);
    const t1 = retry(2000);
    const t2 = retry(5000);
    const t3 = retry(10000);
    const t4 = retry(20000);
    const t5 = retry(30000);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
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
        showToast(`Strava connecté${json.athlete ? ` — Bonjour ${json.athlete} 👋` : ""} · Synchronisation en cours…`, 6000);
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
    if (ap && aprof.goal && ap.totalRealWeeks > ap.weeks.length) {
      setScreen("loading");
      generatePlan(aprof, true).then(newPlan => {
        // Préserve le startDate original pour que le calendrier parte de la vraie date de début
        const originalStartDate = ap.startDate ?? activePlanEntry.startDate ?? null;
        const planWithDate = originalStartDate ? { ...newPlan, startDate: originalStartDate } : newPlan;
        setPlans(prev => prev.map(e => e.id === activePlanId ? { ...e, plan: planWithDate } : e));
        setScreen("app"); setActiveTab("home");
      });
    }
  }, [isPremium]);

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
      if (u) { loadUserData(u.id, checkIsPremium(u)).finally(() => setAuthLoading(false)); }
      else { setScreen("onboarding"); setStep(1); setProfile(BLANK_PROFILE); setPlans([]); setActivePlanId(null); setAuthLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId, userIsPremium = false) => {
    const enforce = (p) => (!userIsPremium && p?.weeks) ? { ...p, weeks: p.weeks.slice(0, FREE_WEEKS_LIMIT) } : p;

    // 1. Nouveau format multi-plans (localStorage)
    try {
      const raw = localStorage.getItem(`myswym_plans_${userId}`);
      const activeId = localStorage.getItem(`myswym_active_${userId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const enforced = parsed.map(e => ({ ...e, plan: enforce(e.plan) }));
          setPlans(enforced);
          setActivePlanId(activeId || enforced[0].id);
          setScreen("app"); return;
        }
      }
    } catch {}

    // 2. Supabase multi-plans (source de vérité cross-device)
    try {
      const { data, error } = await supabase.from("user_plans")
        .select("profile, plan, plans_json, active_plan_id")
        .eq("user_id", userId).single();
      if (data && !error) {
        // 2a. Nouveau format multi-plans
        if (Array.isArray(data.plans_json) && data.plans_json.length > 0) {
          const enforced = data.plans_json.map(e => ({ ...e, plan: enforce(e.plan) }));
          // Hydrate aussi le localStorage pour accès hors-ligne
          try {
            localStorage.setItem(`myswym_plans_${userId}`, JSON.stringify(enforced));
            localStorage.setItem(`myswym_active_${userId}`, data.active_plan_id || enforced[0].id);
          } catch {}
          setPlans(enforced);
          setActivePlanId(data.active_plan_id || enforced[0].id);
          setScreen("app"); return;
        }
        // 2b. Ancien format mono-plan (compat)
        if (data.profile && data.plan) {
          const id = `plan_${Date.now()}`;
          const entry = { id, profile: data.profile, plan: enforce(data.plan) };
          setPlans([entry]); setActivePlanId(id); setScreen("app"); return;
        }
      }
    } catch {}

    // 3. Ancien localStorage mono-plan (migration)
    try {
      const sp  = localStorage.getItem(`myswym_profile_${userId}`);
      const spl = localStorage.getItem(`myswym_plan_${userId}`);
      if (sp && spl) {
        const id = `plan_${Date.now()}`;
        const entry = { id, profile: JSON.parse(sp), plan: enforce(JSON.parse(spl)) };
        setPlans([entry]); setActivePlanId(id); setScreen("app");
      }
    } catch {}
  };

  // Vérifie le statut abonnement automatiquement (retour sur l'app + toutes les 5 min)
  useEffect(() => {
    if (!user) return;
    const check = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        const premium = checkIsPremium(data.user);
        setUser(data.user);
        setIsPremium(premium);
      }
    };
    const onVisible = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", onVisible);
    const interval = setInterval(check, 5 * 60 * 1000);
    return () => { document.removeEventListener("visibilitychange", onVisible); clearInterval(interval); };
  }, [user?.id]);

  useEffect(() => {
    if (!user || plans.length === 0) return;
    try {
      localStorage.setItem(`myswym_plans_${user.id}`, JSON.stringify(plans));
      localStorage.setItem(`myswym_active_${user.id}`, activePlanId);
    } catch {}
    // Supabase : sauvegarde TOUS les plans pour sync cross-device
    supabase.from("user_plans").upsert({
      user_id:        user.id,
      plans_json:     plans,
      active_plan_id: activePlanId,
      // Compat ancien format mono-plan
      profile:        activePlanEntry?.profile ?? null,
      plan:           activePlanEntry?.plan    ?? null,
      updated_at:     new Date().toISOString(),
    }, { onConflict: "user_id" }).then(() => {});
  }, [plans, activePlanId, user]);


  // Migration silencieuse : régénère les plans dont la version est obsolète
  useEffect(() => {
    if (!user || plans.length === 0 || screen !== "app") return;
    const outdated = plans.filter(e => (e.plan?.version ?? 0) < PLAN_VERSION);
    if (outdated.length === 0) return;
    Promise.all(
      outdated.map(entry =>
        generatePlan(entry.profile, isPremium).then(newPlan => {
          const oldWeeks = entry.plan?.weeks ?? [];
          const originalStartDate = entry.plan?.startDate ?? entry.startDate ?? null;
          const mergedWeeks = newPlan.weeks.map((week, i) => {
            const oldWeek = oldWeeks[i];
            if (!oldWeek) return week;
            const allDone = oldWeek.sessions.length > 0 && oldWeek.sessions.every(s => s.completed);
            return allDone ? oldWeek : week;
          });
          return { id: entry.id, updated: { ...newPlan, weeks: mergedWeeks, ...(originalStartDate ? { startDate: originalStartDate } : {}) } };
        })
      )
    ).then(results => {
      setPlans(prev => prev.map(e => {
        const r = results.find(x => x.id === e.id);
        return r ? { ...e, plan: r.updated } : e;
      }));
    });
  }, [user?.id, screen]);

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
      const p  = await generatePlan(profile, isPremium);
      const id = `plan_${Date.now()}`;
      const entry = { id, profile: { ...profile }, plan: p, startDate: Date.now() };
      if (addingPlan) {
        setPlans(prev => [...prev, entry]);
        setAddingPlan(false);
      } else {
        setPlans([entry]);
      }
      setActivePlanId(id);
      setScreen("app"); setActiveTab("home");
      if (!isPremium && p.totalRealWeeks > FREE_WEEKS_LIMIT) setTimeout(() => setShowUpgrade(true), 1200);
    } catch {
      setError("Impossible de générer le plan. Réessaie !");
      setScreen("onboarding"); setStep(5);
    }
  };

  const handleComplete = (weekIndex, sessionIndex) => {
    setPlans(prev => prev.map(entry => {
      if (entry.id !== activePlanId) return entry;
      const newPlan = {
        ...entry.plan,
        weeks: entry.plan.weeks.map((w, wi) => wi !== weekIndex ? w : {
          ...w, sessions: w.sessions.map((s, si) => si !== sessionIndex ? s : { ...s, completed: !s.completed }),
        }),
      };
      const updatedWeek = newPlan.weeks[weekIndex];
      if (updatedWeek.sessions.every(s => s.completed) && !updatedWeek.feedback) setTimeout(() => setFeedbackWeek(weekIndex), 700);
      return { ...entry, plan: newPlan };
    }));
  };

  const handleFeedback = ({ rating, motivation, pain, comment }) => {
    if (feedbackWeek === null) return;
    setPlans(prev => prev.map(e => {
      if (e.id !== activePlanId) return e;
      const adjusted = adjustPlan(e.plan, feedbackWeek, rating);
      const withSatisfaction = {
        ...adjusted,
        weeks: adjusted.weeks.map((w, i) => i !== feedbackWeek ? w : {
          ...w,
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
    setFeedbackWeek(null);
  };

  const handlePaceUpdate = (newPace100, newPace400 = undefined) => {
    setPlans(prev => prev.map(e => e.id !== activePlanId ? e : {
      ...e, profile: {
        ...e.profile,
        pace100: newPace100,
        ...(newPace400 !== undefined ? { pace400: newPace400 } : {}),
      }
    }));
  };

  const handleUpdateProgram = (newFreq) => {
    if (!activePlanEntry) return;
    const oldWeeks = activePlanEntry.plan?.weeks ?? [];
    const newProfile = { ...activePlanEntry.profile, sessionsPerWeek: newFreq };
    setScreen("loading");
    generatePlan(newProfile, isPremium).then(newPlan => {
      const originalStartDate = activePlanEntry.plan?.startDate ?? activePlanEntry.startDate ?? null;
      // Semaines entièrement validées → on garde l'ancienne semaine telle quelle
      // (même nombre de séances, même contenu, même historique)
      // Semaines non validées → on prend la nouvelle semaine générée avec la nouvelle fréquence
      const mergedWeeks = newPlan.weeks.map((week, i) => {
        const oldWeek = oldWeeks[i];
        if (!oldWeek) return week;
        const allDone = oldWeek.sessions.length > 0 && oldWeek.sessions.every(s => s.completed);
        if (!allDone) return week;
        return oldWeek; // Semaine validée : on ne touche à rien
      });
      const planWithDate = { ...newPlan, weeks: mergedWeeks, ...(originalStartDate ? { startDate: originalStartDate } : {}) };
      setPlans(prev => prev.map(e => e.id !== activePlanId ? e : { ...e, profile: newProfile, plan: planWithDate }));
      setScreen("app"); setActiveTab("plan");
    });
  };

  const handleAddPlan = () => {
    if (!isPremium) { setShowUpgrade(true); return; }
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
    const remaining = plans.filter(e => e.id !== id);
    setPlans(remaining);
    if (activePlanId === id) setActivePlanId(remaining[0].id);
  };

  const handleReset = () => {
    if (plans.length > 1) {
      // Supprime uniquement le plan actif, garde les autres
      const remaining = plans.filter(e => e.id !== activePlanId);
      setPlans(remaining);
      setActivePlanId(remaining[0].id);
    } else {
      // Dernier plan — reset complet
      if (user) {
        localStorage.removeItem(`myswym_plans_${user.id}`);
        localStorage.removeItem(`myswym_active_${user.id}`);
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

  const handleRefreshStatus = async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      setUser(data.user);
      setIsPremium(checkIsPremium(data.user));
    }
  };

  const handlePortal = async () => {
    showToast("Redirection vers Stripe…");
    try {
      const { data: refreshData } = await supabase.auth.refreshSession();
      const session = refreshData?.session;
      if (!session) { showToast("Reconnecte-toi pour gérer ton abonnement."); return; }

      // Vérifie si stripe_customer_id est présent
      const { data: userData } = await supabase.auth.getUser();
      const customerId = userData?.user?.user_metadata?.stripe_customer_id;
      if (!customerId) {
        showToast("Abonnement introuvable. Contacte support@myswym.app");
        return;
      }

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
      <div style={{ minHeight: "100vh", background: G.bg }}>
        <ResetPasswordScreen onDone={() => {
          setIsRecovery(false);
          // Recharge les données utilisateur après reset
          supabase.auth.getUser().then(({ data }) => {
            const u = data?.user;
            if (u) { setUser(u); setIsPremium(checkIsPremium(u)); loadUserData(u.id, checkIsPremium(u)); }
          });
        }} />
      </div>
    </>
  );

  if (!user) return (
    <>
      <style>{css}</style><FontLoader />
      <div style={{ minHeight: "100vh", background: G.bg }}><AuthScreen onAuth={setUser} /></div>
    </>
  );

  if (screen === "loading") return <><style>{css}</style><FontLoader /><Loading /></>;

  if (screen === "onboarding") return (
    <>
      <style>{css}</style><FontLoader />
      <div style={{ minHeight: "100vh", background: G.bg }}>
        <div style={{ maxWidth: 440, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ paddingTop: 56, paddingBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 38, height: 38, background: G.ink, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center" }}><Waves size={18} color={G.white} /></div>
                <span style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 800, fontSize: 19, color: G.ink }}>MySWYM</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {addingPlan && (
                  <button onClick={() => { setAddingPlan(false); setProfile(BLANK_PROFILE); setScreen("app"); }} style={{ background: "none", border: `1px solid ${G.greyLight}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, color: G.grey, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    ← Mes plans
                  </button>
                )}
                {!addingPlan && isPremium && (
                  <button onClick={handlePortal} style={{ background: "none", border: `1px solid ${G.blue}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, color: G.blue, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    <Zap size={12} color={G.blue} /> Abonnement
                  </button>
                )}
                {!addingPlan && (
                  <button onClick={handleSignOut} style={{ background: "none", border: `1px solid ${G.greyLight}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, color: G.grey, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    <LogOut size={12} color={G.grey} /> Déco.
                  </button>
                )}
              </div>
            </div>
            {(() => {
              // Flux :
              //   progression : 1 → 3 (niveau) → [4 pace?] → 5 (fréq) — pas de date
              //   triathlon/eau_libre : 1 → 2 (sous-obj) → 3 (niveau, découverte grisé) → [4 pace?] → 5 (fréq) → 6 (date)
              //   diplome : 1 → 2 (BNSSA/BPJEPS) → 5 (fréq) → 6 (date) — pas de niveau
              const isProgression = profile.category === "progression";
              const isDiplome = profile.category === "diplome";
              const noDate = isProgression;
              const hasPaceStep = !isDiplome && (profile.level === "performance" || profile.level === "advanced");
              // Niveaux grisés pour triathlon et eau_libre
              const disabledLevels = (profile.category === "triathlon" || profile.category === "eau_libre") ? ["découverte"] : [];
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
                      onNext={() => setStep(stepAfter3)}
                      onBack={() => isProgression ? setStep(1) : setStep(2)} />
                  )}

                  {step === 4 && hasPaceStep && (
                    <Step_Pace
                      value={profile.pace100}
                      value400={profile.pace400}
                      onChange={v => update("pace100", v)}
                      onChange400={v => update("pace400", v)}
                      total={totalSteps}
                      onNext={() => setStep(5)}
                      onSkip={() => { update("pace100", null); update("pace400", null); setStep(5); }}
                      onBack={() => setStep(3)} />
                  )}

                  {step === 5 && (
                    <Step4_Frequency value={profile.sessionsPerWeek} onChange={v => update("sessionsPerWeek", v)} total={totalSteps} onNext={noDate ? handleGenerate : () => setStep(6)} onBack={() => setStep(stepBefore5)} isLast={noDate} isPremium={isPremium} onUpgrade={() => setShowUpgrade(true)} />
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
    </>
  );

  return (
    <>
      <style>{css}</style><FontLoader />
      <div style={{ minHeight: "100vh", background: G.bg }}>
        {activeTab === "home"    && <Dashboard   plan={plan} profile={activeProfile} plans={plans} activePlanId={activePlanId} onSwitchPlan={handleSwitchPlan} onTabChange={setActiveTab} onComplete={handleComplete} onShare={s => setShareSession(s)} onSignOut={handleSignOut} user={user} />}
        {activeTab === "plan"    && <PlanTab     plan={plan} profile={activeProfile} isPremium={isPremium} onComplete={handleComplete} onShare={s => setShareSession(s)} onReset={handleReset} onUpgrade={() => setShowUpgrade(true)} startDate={activePlanEntry?.startDate} plans={plans} activePlanId={activePlanId} onSwitchPlan={handleSwitchPlan} onAddPlan={handleAddPlan} onDeletePlan={handleDeletePlan} />}
        {activeTab === "profile" && <ProfileTab  plan={plan} profile={activeProfile} user={user} isPremium={isPremium} onSignOut={handleSignOut} onPortal={handlePortal} onUpgrade={() => setShowUpgrade(true)} onRefreshStatus={handleRefreshStatus} onPaceUpdate={handlePaceUpdate} onUpdateProgram={handleUpdateProgram} onValidateSession={handleComplete} />}

        <BottomNav active={activeTab} onChange={setActiveTab} newBadge={newBadgeId !== null} />

        {feedbackWeek !== null && <FeedbackModal weekNumber={plan.weeks[feedbackWeek]?.number} onSubmit={handleFeedback} onSkip={() => setFeedbackWeek(null)} />}
        {shareSession && <ShareModal session={shareSession} goalLabel={goal?.label} onClose={() => setShareSession(null)} />}
        {newBadgeId && <BadgeToast badgeId={newBadgeId} />}
        {toast && (
          <div className="toast-in" style={{ position: "fixed", bottom: 90, left: 16, right: 16, zIndex: 300, background: G.ink, color: G.white, borderRadius: 14, padding: "14px 16px", fontSize: 14, lineHeight: 1.5, boxShadow: "0 8px 32px rgba(0,0,0,0.28)" }}>
            {toast}
          </div>
        )}
        {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} weeksBlocked={plan?.totalRealWeeks > FREE_WEEKS_LIMIT ? plan.totalRealWeeks : null} />}
      </div>
    </>
  );
}
