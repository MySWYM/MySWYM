import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";
import {
  Waves, Flame, Star, Calendar, BarChart2, Award, Home,
  Ruler, Clock, Zap, Check, Lock, Trophy, Target,
  ChevronDown, ChevronUp, LogOut, Activity, User,
  Droplets, TrendingUp, Timer, RotateCcw, ArrowRight, Gauge, Settings, Shield, Plus,
} from "lucide-react";

// ── FONTS ─────────────────────────────────────────────────────────────────
const FontLoader = () => {
  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap";
    document.head.appendChild(l);
  }, []);
  return null;
};

// ── DESIGN SYSTEM ─────────────────────────────────────────────────────────
const G = {
  bg: "#F0F4F8",
  ink: "#0D1117",
  inkLight: "#374151",
  blue: "#0057FF",
  blueLight: "#EEF3FF",
  blueMid: "#4080FF",
  blueDeep: "#003ACC",
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
  grey: "#6B7280",
  greyMid: "#9CA3AF",
  greyLight: "#E5E7EB",
  greyXLight: "#F9FAFB",
  white: "#FFFFFF",
};

const TYPE_META = {
  ENDURANCE:    { bg: G.blueLight,   color: G.blue,    Icon: Waves },
  SEUIL:        { bg: "#FFF3E0",     color: "#E65100", Icon: Activity },
  VITESSE:      { bg: G.coralLight,  color: G.coral,   Icon: Zap },
  TECHNIQUE:    { bg: G.waterLight,  color: "#0097A7", Icon: Target },
  RÉCUPÉRATION: { bg: G.mintLight,   color: "#00897B", Icon: Droplets },
};

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${G.bg}; font-family: 'DM Sans', sans-serif; overscroll-behavior: none; letter-spacing: 0.015em; }
  h1, h2, h3, h4 { letter-spacing: 0.01em; }
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
  { id: "perte_de_poids",    label: "Perte de poids",         dist: "Durée selon ton objectif",     icon: <Target size={20} />,   wellness: true  },
];

// Catégories onboarding (step 1)
const CATEGORIES = [
  { id: "triathlon",   label: "Triathlon",          Icon: Activity,    desc: "Sprint · Olympique · Half · Ironman" },
  { id: "eau_libre",   label: "Eau libre",           Icon: Waves,       desc: "5 km · 10 km en eau vive" },
  { id: "progression", label: "Nager & Progresser",  Icon: TrendingUp,  desc: "Sans deadline · Progresser à ton rythme" },
  { id: "poids",       label: "Perte de poids",      Icon: Target,      desc: "Plan adapté à ton objectif" },
  { id: "diplome",     label: "Prépa diplôme",       Icon: Award,       desc: "BNSSA · BPJEPS · Pompiers" },
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
    { id: "bnssa",          label: "BNSSA",          dist: "100 m & 250 m sauvetage" },
    { id: "bpjeps_aan",     label: "BPJEPS AAN",     dist: "400 m NL < 7'40\"" },
    { id: "tests_pompiers", label: "Tests Pompiers", dist: "400 m + 50 m sauvetage" },
  ],
  progression: [
    { id: "prog_endurance", label: "Nager plus loin",      dist: "Endurance & volume" },
    { id: "prog_vitesse",   label: "Nager plus vite",      dist: "CSS & seuil" },
    { id: "prog_technique", label: "Maîtriser ma technique", dist: "Drills & efficacité" },
  ],
};

const isWellnessGoal = (goalId) => GOALS.find(g => g.id === goalId)?.wellness === true;
const isProgressionGoal = (goalId) => goalId?.startsWith("prog_");

const LEVELS = [
  { id: "beginner",     label: "Débutant",      desc: "Je nage depuis moins d'1 an" },
  { id: "intermediate", label: "Intermédiaire", desc: "Je nage régulièrement depuis 1–3 ans" },
  { id: "advanced",     label: "Confirmé",      desc: "Compétitions ou plus de 3 ans de pratique" },
];

const FREQUENCIES = [
  { id: 1, label: "1×/semaine",  desc: "Je suis occupé·e" },
  { id: 2, label: "2×/semaine",  desc: "Mon rythme idéal" },
  { id: 3, label: "3×/semaine",  desc: "Je suis motivé·e" },
  { id: 4, label: "4× et plus",  desc: "Je suis sérieux·se" },
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
  const base = { display: "block", width: "100%", padding: "16px 24px", borderRadius: 14, fontSize: 16, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: disabled ? "not-allowed" : "pointer", border: "none", transition: "all 0.18s", opacity: disabled ? 0.4 : 1, ...s };
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
  <div style={{ flex: 1, background: bg || G.greyXLight, borderRadius: 16, padding: "16px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
    <IconComp size={20} color={color || G.ink} />
    <span style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: color || G.ink, lineHeight: 1 }}>{value}</span>
    <span style={{ fontSize: 11, color: G.grey, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</span>
  </div>
);

// ── PACE ZONES CARD ─────────────────────────────────────────────────────
const ZONE_DEFS = [
  {
    zone: "Z1 / Z2",
    label: "Facile — Endurance",
    mult: 1.35,
    color: "#34C759",
    bg: "#34C75914",
    desc: "Récupération active, construction aérobie. Tu peux tenir une conversation. C'est la majorité de ton volume.",
    tip: "Base de tout bon nageur",
  },
  {
    zone: "Z3 / Z4",
    label: "Seuil — CSS",
    mult: 1.08,
    color: "#FF9F0A",
    bg: "#FF9F0A14",
    desc: "CSS = Vitesse Critique de Nage. L'allure que tu peux tenir en compétition sur 400–1500 m. Améliore ton VO2max et repousse le seuil lactique.",
    tip: "Coeur du travail de qualité",
  },
  {
    zone: "Z5 / Z6",
    label: "Sprint — Anaérobie",
    mult: 0.95,
    color: "#FF3B30",
    bg: "#FF3B3014",
    desc: "Effort maximal, courtes répétitions. Développe la puissance et la vitesse de pointe. Séries de 25–50 m avec longues récupérations.",
    tip: "Explosivité & vitesse pure",
  },
];

function fmtPaceDisplay(secs) {
  return `${Math.floor(secs / 60)}:${Math.round(secs % 60).toString().padStart(2, "0")}`;
}

const PaceZonesCard = ({ pace100, onSave }) => {
  const [display, setDisplay] = useState(pace100 ? fmtPaceDisplay(pace100) : "");
  const [val, setVal]         = useState(pace100 || null);
  const [err, setErr]         = useState("");
  const [saved, setSaved]     = useState(false);

  const handleChange = (raw) => {
    const digits = raw.replace(/\D/g, "").slice(0, 3);
    let fmt = digits;
    if (digits.length >= 2) fmt = digits[0] + ":" + digits.slice(1);
    setDisplay(fmt);
    setErr(""); setSaved(false);
    if (digits.length === 3) {
      const mins = parseInt(digits[0]);
      const secs = parseInt(digits.slice(1));
      if (secs >= 60) { setErr("Les secondes doivent être entre 00 et 59"); setVal(null); return; }
      const total = mins * 60 + secs;
      if (total < 45)  { setErr("Trop rapide — minimum 45 secondes"); setVal(null); return; }
      if (total > 300) { setErr("Maximum 5 minutes (300 s)"); setVal(null); return; }
      setVal(total);
    } else { setVal(null); }
  };

  const handleSave = () => {
    if (!val) return;
    onSave(val);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ background: G.white, borderRadius: 18, padding: "20px 16px", marginBottom: 16, border: `1px solid ${G.greyLight}` }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: G.blueLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Gauge size={16} color={G.blue} />
        </div>
        <div>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: G.ink, margin: 0 }}>Tes zones d'intensité</h3>
          <p style={{ fontSize: 12, color: G.grey, margin: 0 }}>Basées sur ton meilleur 100 m NL</p>
        </div>
      </div>

      {/* Explication CSS */}
      <div style={{ background: G.blueLight, borderRadius: 12, padding: "11px 14px", marginBottom: 16, marginTop: 10 }}>
        <p style={{ fontSize: 13, color: G.blue, lineHeight: 1.55, margin: 0 }}>
          <strong>C'est quoi la CSS ?</strong> La Vitesse Critique de Nage est l'allure seuil entre effort soutenable et effort difficile. Tous tes intervals de départ sont calculés à partir de ton 100 m personnel.
        </p>
      </div>

      {/* Input 100m */}
      <label style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: 1.5, textTransform: "uppercase", display: "block", marginBottom: 8 }}>
        Ton meilleur 100 m NL
      </label>
      <div style={{ display: "flex", gap: 8, marginBottom: err ? 8 : 16 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <input
            type="text"
            inputMode="numeric"
            placeholder="1:45"
            value={display}
            onChange={e => handleChange(e.target.value)}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "13px 14px 13px 48px",
              fontSize: 22, fontFamily: "'Syne', sans-serif", fontWeight: 800,
              letterSpacing: 1.5, textAlign: "center",
              border: `2px solid ${err ? "#FF3B30" : val ? G.blue : G.greyLight}`,
              borderRadius: 12, outline: "none", background: G.white, color: G.ink,
            }}
          />
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: G.grey, fontWeight: 600, pointerEvents: "none" }}>m:ss</span>
        </div>
        <button
          onClick={handleSave}
          disabled={!val}
          style={{
            padding: "13px 18px", borderRadius: 12, border: "none", cursor: val ? "pointer" : "not-allowed",
            background: saved ? G.mint : val ? G.blue : G.greyLight,
            color: G.white, fontWeight: 700, fontSize: 14, transition: "background 0.2s",
            display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
          }}
        >
          {saved ? <><Check size={14} /> Sauvé</> : "Enregistrer"}
        </button>
      </div>
      {err && <p style={{ color: "#FF3B30", fontSize: 13, marginBottom: 12 }}>{err}</p>}

      {/* Zone cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {ZONE_DEFS.map((z, i) => {
          const paceStr = val
            ? (() => { const ps = Math.round(val * z.mult); return `${Math.floor(ps/60)}'${(ps%60).toString().padStart(2,"0")}"` + "/100m"; })()
            : null;
          return (
            <div key={i} style={{ background: z.bg, border: `1px solid ${z.color}30`, borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div>
                  <span style={{ background: `${z.color}22`, color: z.color, fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 100, letterSpacing: 1 }}>{z.zone}</span>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: G.ink, marginTop: 5 }}>{z.label}</div>
                  <div style={{ fontSize: 11, color: G.grey, fontStyle: "italic", marginTop: 1 }}>{z.tip}</div>
                </div>
                {paceStr && (
                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: z.color }}>{paceStr}</div>
                  </div>
                )}
                {!paceStr && (
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: z.color, opacity: 0.5, marginLeft: 12 }}>— —</div>
                )}
              </div>
              <p style={{ fontSize: 12, color: G.grey, lineHeight: 1.55, margin: 0 }}>{z.desc}</p>
            </div>
          );
        })}
      </div>

      {val && val !== pace100 && (
        <p style={{ fontSize: 12, color: G.grey, textAlign: "center", marginTop: 14 }}>
          Enregistre ton temps — il sera utilisé à ta prochaine génération de plan.
        </p>
      )}
      {pace100 && val === pace100 && (
        <p style={{ fontSize: 12, color: G.mint, textAlign: "center", marginTop: 14, fontWeight: 600 }}>
          ✓ Zones personnalisées actives dans ton plan
        </p>
      )}
    </div>
  );
};

const ProfileTab = ({ plan, profile, user, isPremium, onSignOut, onPortal, onUpgrade, onRefreshStatus, onPaceUpdate }) => {
  const [password, setPassword] = useState("");
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState(null);

  const stats  = computeStats(plan);
  const earned = checkBadges(stats);
  const maxMeters = Math.max(...stats.weeklyData.map(w => w.total), 1);

  const inp = { width: "100%", padding: "13px 14px", borderRadius: 12, border: `1.5px solid ${G.greyLight}`, fontSize: 15, fontFamily: "'DM Sans', sans-serif", background: G.white, color: G.ink, outline: "none", boxSizing: "border-box" };

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

  return (
    <div style={{ minHeight: "100vh", background: G.bg, paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ background: G.blue, padding: "52px 20px 28px" }}>
        <div className="fade-up" style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", letterSpacing: 2, marginBottom: 5, fontWeight: 700, textTransform: "uppercase" }}>Ton espace</div>
        <h1 className="fade-up-1" style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: G.white, marginBottom: 4 }}>Profil</h1>
        <p className="fade-up-2" style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>{(stats.totalMeters / 1000).toFixed(1)} km nagés · {earned.length} badge{earned.length !== 1 ? "s" : ""}</p>
      </div>

      <div style={{ padding: "20px 16px 0" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <StatPill icon={Waves}  value={`${(stats.totalMeters / 1000).toFixed(1)} km`} label="Total nagés"        color={G.blue}  bg={G.blueLight}  />
          <StatPill icon={Flame}  value={stats.streak}                                   label="Meilleure série"    color={G.coral} bg={G.coralLight} />
          <StatPill icon={Check}  value={stats.totalSessions}                            label="Séances faites"     color={G.mint}  bg={G.mintLight}  />
          <StatPill icon={Star}   value={stats.perfectWeeks}                             label="Semaines parfaites" color={G.gold}  bg={G.goldLight}  />
        </div>

        {/* Pace zones */}
        <PaceZonesCard pace100={profile?.pace100} onSave={onPaceUpdate} />

        {/* Weekly bar chart */}
        <div style={{ background: G.white, borderRadius: 18, padding: "18px 16px", marginBottom: 16, border: `1px solid ${G.greyLight}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: G.ink, marginBottom: 16 }}>Volume par semaine</h3>
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

        {/* Session type breakdown */}
        <div style={{ background: G.white, borderRadius: 18, padding: "18px 16px", marginBottom: 16, border: `1px solid ${G.greyLight}` }}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: G.ink, marginBottom: 14 }}>Répartition des types</h3>
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

        {/* Badges */}
        <div style={{ background: G.white, borderRadius: 18, padding: "18px 16px", marginBottom: 16, border: `1px solid ${G.greyLight}` }}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: G.ink, marginBottom: 4 }}>Badges</h3>
          <p style={{ fontSize: 12, color: G.grey, marginBottom: 14 }}>{earned.length}/{BADGE_DEFS.length} débloqués</p>
          {earned.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: earned.length < BADGE_DEFS.length ? 16 : 0 }}>
              {BADGE_DEFS.filter(b => earned.includes(b.id)).map(b => (
                <div key={b.id} className="scale-in" style={{ background: G.white, borderRadius: 14, padding: 14, textAlign: "center", border: `2px solid ${b.color}20`, boxShadow: `0 4px 16px ${b.color}18` }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${b.color}18`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
                    <b.icon size={20} color={b.color} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: G.ink, marginBottom: 2 }}>{b.label}</div>
                  <div style={{ fontSize: 10, color: G.grey, lineHeight: 1.4 }}>{b.desc}</div>
                </div>
              ))}
            </div>
          )}
          {BADGE_DEFS.filter(b => !earned.includes(b.id)).length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {BADGE_DEFS.filter(b => !earned.includes(b.id)).map(b => (
                <div key={b.id} style={{ background: G.greyXLight, borderRadius: 14, padding: 14, textAlign: "center", border: `1px solid ${G.greyLight}` }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: G.greyLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
                    <Lock size={18} color={G.greyMid} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: G.greyMid, marginBottom: 2 }}>{b.label}</div>
                  <div style={{ fontSize: 10, color: G.greyMid, lineHeight: 1.4 }}>{b.desc}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Compte */}
        <div style={{ background: G.white, borderRadius: 16, padding: "18px 16px", marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: G.grey, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Email</div>
          <div style={{ fontSize: 15, color: G.ink, padding: "13px 14px", background: G.greyXLight, borderRadius: 12 }}>{user?.email}</div>
        </div>

        <div style={{ background: G.white, borderRadius: 16, padding: "18px 16px", marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: G.grey, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Nouveau mot de passe</div>
          <input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Nouveau mot de passe" onKeyDown={e => e.key === "Enter" && save()} />
        </div>

        {msg && <div style={{ background: msg.type === "ok" ? G.mintLight : "#FFE8E8", borderRadius: 10, padding: "10px 14px", marginBottom: 12, color: msg.type === "ok" ? "#00897B" : "#CC0000", fontSize: 13 }}>{msg.text}</div>}
        <Btn onClick={save} disabled={saving || !password} variant="blue">{saving ? "Enregistrement…" : "Changer le mot de passe"}</Btn>

        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {isPremium
            ? <>
                <button onClick={onPortal} style={{ width: "100%", padding: "14px", borderRadius: 12, border: `1.5px solid ${G.blue}`, background: G.blueLight, color: G.blue, fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Zap size={16} color={G.blue} /> Gérer mon abonnement
                </button>
                <button onClick={onRefreshStatus} style={{ width: "100%", padding: "10px", borderRadius: 12, border: `1px solid ${G.greyLight}`, background: "none", color: G.grey, fontWeight: 500, fontSize: 13, cursor: "pointer" }}>
                  Actualiser le statut
                </button>
              </>
            : <>
                <button onClick={onUpgrade} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #0D1117, #001966)", color: G.white, fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Zap size={16} color={G.gold} /> Passer en premium
                </button>
                <button onClick={onRefreshStatus} style={{ width: "100%", padding: "10px", borderRadius: 12, border: `1px solid ${G.greyLight}`, background: "none", color: G.grey, fontWeight: 500, fontSize: 13, cursor: "pointer" }}>
                  Actualiser le statut
                </button>
              </>
          }
          <button onClick={onSignOut} style={{ width: "100%", padding: "14px", borderRadius: 12, border: `1.5px solid ${G.greyLight}`, background: "none", color: G.grey, fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <LogOut size={16} color={G.grey} /> Se déconnecter
          </button>
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

const AuthScreen = ({ onAuth }) => {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handle = async () => {
    setError(null); setSuccess(null); setLoading(true);
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuth(data.user);
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user && !data.user.identities?.length) throw new Error("Un compte existe déjà avec cet email.");
        setSuccess("Compte créé ! Vérifie ton email, puis connecte-toi.");
        setMode("login");
      }
    } catch (e) { setError(e.message || "Une erreur est survenue."); }
    finally { setLoading(false); }
  };

  const inp = { width: "100%", padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${G.greyLight}`, fontSize: 15, fontFamily: "'DM Sans', sans-serif", background: G.white, color: G.ink, outline: "none" };

  return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "0 20px", paddingTop: 64, paddingBottom: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 44 }}>
        <div style={{ width: 40, height: 40, background: G.ink, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Waves size={20} color={G.white} />
        </div>
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: G.ink }}>MySWYM</span>
      </div>
      <div className="fade-up">
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, color: G.ink, marginBottom: 8, lineHeight: 1.1 }}>Bienvenue</h2>
        <p style={{ color: G.grey, fontSize: 15, marginBottom: 28 }}>
          {mode === "login" ? "Connecte-toi pour accéder à ton plan." : "Crée ton compte gratuitement."}
        </p>
        {error   && <div style={{ background: "#FFE8E8", borderRadius: 10, padding: "10px 14px", marginBottom: 14, color: "#CC0000", fontSize: 13 }}>{error}</div>}
        {success && <div style={{ background: G.mintLight, borderRadius: 10, padding: "10px 14px", marginBottom: 14, color: "#00897B", fontSize: 13 }}>{success}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          <input type="email"    placeholder="Ton email"    value={email}    onChange={e => setEmail(e.target.value)}    onKeyDown={e => e.key === "Enter" && handle()} style={inp} />
          <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()} style={inp} />
        </div>
        <Btn onClick={handle} disabled={loading || !email || !password} variant="blue">
          {loading ? "…" : mode === "login" ? "Se connecter" : "Créer mon compte"}
        </Btn>
        <p style={{ textAlign: "center", marginTop: 18, fontSize: 14, color: G.grey }}>
          {mode === "login" ? "Pas encore de compte ? " : "Déjà un compte ? "}
          <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); setSuccess(null); }} style={{ background: "none", border: "none", color: G.ink, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
            {mode === "login" ? "S'inscrire" : "Se connecter"}
          </button>
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
    <h2 style={{ fontSize: 38, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: G.ink, marginBottom: 10, lineHeight: 1.0 }}>Pourquoi<br />tu nages ?</h2>
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
  const titles = { triathlon: "Quelle distance ?", eau_libre: "Ton objectif ?", diplome: "Quel diplôme ?", progression: "Ton axe principal ?" };
  return (
    <div className="fade-up">
      <p style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>Étape 2 sur 5</p>
      <h2 style={{ fontSize: 38, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: G.ink, marginBottom: 10, lineHeight: 1.0 }}>{titles[category] || "Précise ton objectif"}</h2>
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
  const inp = { width: "100%", padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${G.greyLight}`, fontSize: 18, fontFamily: "'Syne', sans-serif", fontWeight: 700, color: G.ink, background: G.white, outline: "none", textAlign: "center" };
  return (
    <div className="fade-up">
      <p style={{ fontSize: 12, fontWeight: 600, color: G.grey, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Étape 2 sur 4</p>
      <h2 style={{ fontSize: 30, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: G.ink, marginBottom: 6, lineHeight: 1.1 }}>Ton objectif<br />poids ?</h2>
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
      <h2 style={{ fontSize: 38, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: G.ink, marginBottom: 10, lineHeight: 1.0 }}>Date de<br />l'événement ?</h2>
      <p style={{ color: G.grey, fontSize: 16, marginBottom: 36 }}>Minimum 6 semaines pour un bon plan.</p>
      <div style={{ background: G.white, borderRadius: 16, padding: "20px", marginBottom: 12, border: `1.5px solid ${err ? "#FF4757" : weeks ? G.blue : G.greyLight}`, transition: "border-color 0.2s" }}>
        <label style={{ fontSize: 11, color: G.grey, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 10 }}>Date de l'événement</label>
        <input
          type="text"
          inputMode="numeric"
          placeholder="jj/mm/aaaa"
          value={display}
          onChange={e => handleChange(e.target.value)}
          style={{ width: "100%", border: "none", fontSize: 28, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: G.ink, background: "transparent", outline: "none", letterSpacing: 2 }}
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

const Step3_Level = ({ value, onChange, pool, onPoolChange, onNext, onBack, total = 6 }) => (
  <div className="fade-up">
    <p style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Étape 3 sur {total}</p>
    <h2 style={{ fontSize: 34, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: G.ink, marginBottom: 8, lineHeight: 1.05 }}>Ton niveau<br />en natation ?</h2>
    <p style={{ color: G.grey, fontSize: 15, marginBottom: 32 }}>Sois honnête — le plan sera meilleur.</p>
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
      {LEVELS.map(l => (
        <button key={l.id} onClick={() => onChange(l.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderRadius: 16, border: `2px solid ${value === l.id ? G.ink : G.greyLight}`, background: value === l.id ? G.ink : G.white, cursor: "pointer", transition: "all 0.2s", boxShadow: value === l.id ? "0 4px 16px rgba(0,0,0,0.14)" : "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: value === l.id ? G.white : G.ink }}>{l.label}</div>
            <div style={{ fontSize: 13, color: value === l.id ? "rgba(255,255,255,0.55)" : G.grey }}>{l.desc}</div>
          </div>
          {value === l.id && <Check size={16} color={G.white} />}
        </button>
      ))}
    </div>
    <div style={{ marginBottom: 32 }}>
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

// ── STEP 4 : TEMPS AU 100m ────────────────────────────────────────────────
const Step_Pace = ({ value, onChange, onNext, onSkip, onBack, total = 6 }) => {
  const [display, setDisplay] = useState(value ? fmtPace100(value) : "");
  const [err, setErr] = useState("");

  // Formate secondes → "m:ss" pour l'affichage
  function fmtPace100(secs) {
    return `${Math.floor(secs/60)}:${Math.round(secs%60).toString().padStart(2,'0')}`;
  }

  const handleChange = (raw) => {
    const digits = raw.replace(/\D/g, "").slice(0, 3);
    let formatted = digits;
    if (digits.length >= 2) formatted = digits[0] + ":" + digits.slice(1);
    setDisplay(formatted);
    setErr("");
    if (digits.length === 3) {
      const mins = parseInt(digits[0]);
      const secs = parseInt(digits.slice(1));
      if (secs >= 60) { setErr("Les secondes doivent être entre 00 et 59"); onChange(null); return; }
      const total = mins * 60 + secs;
      if (total < 45)  { setErr("Même les champions mettent plus de 45 secondes !"); onChange(null); return; }
      if (total > 300) { setErr("5 minutes max — si tu nages plus lentement, utilise l'option ci-dessous"); onChange(null); return; }
      onChange(total);
    } else {
      onChange(null);
    }
  };

  const zones = value ? [
    { label: "Facile (Z1/Z2)",   mult: 1.35, color: "#34C759" },
    { label: "Seuil (Z3/Z4)",    mult: 1.08, color: "#FF9F0A" },
    { label: "Sprint (Z5/Z6)",   mult: 0.95, color: "#FF3B30" },
  ] : null;

  return (
    <div className="fade-up">
      <p style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Étape 4 sur {total}</p>
      <h2 style={{ fontSize: 34, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: G.ink, marginBottom: 8, lineHeight: 1.05 }}>Ton meilleur<br />100m ?</h2>
      <p style={{ color: G.grey, fontSize: 15, marginBottom: 16 }}>On calcule tes zones d'intensité — chaque séance affiche tes intervalles de départ personnalisés.</p>

      {/* CSS mini explainer */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
        {[
          { color: "#34C759", label: "Z1–Z2 Facile",   hint: "Récupération & endurance de base" },
          { color: "#FF9F0A", label: "Z3–Z4 CSS/Seuil", hint: "Ta vitesse critique — effort contrôlé" },
          { color: "#FF3B30", label: "Z5–Z6 Sprint",    hint: "Effort maximal, répétitions courtes" },
        ].map((z, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: G.greyXLight, borderRadius: 10, padding: "9px 12px" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: z.color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: G.ink }}>{z.label}</span>
            <span style={{ fontSize: 12, color: G.grey, marginLeft: "auto" }}>{z.hint}</span>
          </div>
        ))}
      </div>

      <div style={{ position: "relative", marginBottom: err ? 8 : 20 }}>
        <input
          type="text"
          inputMode="numeric"
          placeholder="1:45"
          value={display}
          onChange={e => handleChange(e.target.value)}
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "18px 20px 18px 56px",
            fontSize: 28, fontFamily: "'Syne', sans-serif", fontWeight: 800,
            letterSpacing: 2, textAlign: "center",
            border: `2px solid ${err ? "#FF3B30" : value ? G.blue : G.greyLight}`,
            borderRadius: 16, outline: "none", background: G.white, color: G.ink,
          }}
        />
        <span style={{ position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: G.grey, fontWeight: 600, pointerEvents: "none" }}>m:ss</span>
      </div>
      {err && <p style={{ color: "#FF3B30", fontSize: 13, marginBottom: 16 }}>{err}</p>}

      {/* Zones preview */}
      {zones && (
        <div style={{ background: G.greyXLight, borderRadius: 14, padding: 16, marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Tes zones calculées</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {zones.map((z, i) => {
              const ps = Math.round(value * z.mult);
              const pStr = `${Math.floor(ps/60)}'${(ps%60).toString().padStart(2,'0')}"`;
              return (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: z.color }} />
                    <span style={{ fontSize: 14, color: G.ink, fontWeight: 500 }}>{z.label}</span>
                  </div>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 800, color: z.color }}>
                    {pStr}/100m
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Btn variant="blue" onClick={onNext} disabled={!value}>Utiliser ce temps</Btn>
      <button onClick={onSkip} style={{ width: "100%", marginTop: 10, padding: "12px", background: "none", border: `1px solid ${G.greyLight}`, borderRadius: 12, color: G.grey, cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
        Je ne connais pas mon temps →
      </button>
      <button onClick={onBack} style={{ width: "100%", marginTop: 8, padding: "12px", background: "none", border: "none", color: G.grey, cursor: "pointer", fontSize: 14 }}>← Retour</button>
    </div>
  );
};

const Step4_Frequency = ({ value, onChange, onNext, onBack, isLast = false, total = 6, isPremium = false, onUpgrade }) => (
  <div className="fade-up">
    <p style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Étape 5 sur {total}</p>
    <h2 style={{ fontSize: 34, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: G.ink, marginBottom: 8, lineHeight: 1.05 }}>Séances<br />par semaine ?</h2>
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
      <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: G.ink, marginBottom: 8 }}>On prépare ton plan…</h3>
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
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: G.ink, marginBottom: 20, textAlign: "center" }}>Partage ta séance</h3>
        <div style={{ background: `linear-gradient(135deg, ${G.ink} 0%, #001966 100%)`, borderRadius: 20, padding: 24, marginBottom: 20, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(0,87,255,0.12)" }} />
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: G.mint, borderRadius: 20, padding: "5px 14px", marginBottom: 16 }}>
            <Check size={12} color={G.white} /><span style={{ fontSize: 12, fontWeight: 700, color: G.white }}>Séance terminée</span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: tm.color, letterSpacing: 1.5, marginBottom: 6, textTransform: "uppercase" }}>{session.type}</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: G.white, marginBottom: 16 }}>{session.title}</div>
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

// ── FEEDBACK MODAL ────────────────────────────────────────────────────────
const FeedbackModal = ({ weekNumber, onRate, onSkip }) => {
  const opts = [
    { id: "easy", label: "Trop facile", sub: "On augmente le volume",  color: G.mint,  bg: G.mintLight },
    { id: "ok",   label: "Parfait",     sub: "On maintient l'allure",   color: G.blue,  bg: G.blueLight },
    { id: "hard", label: "Trop dur",    sub: "On réduit un peu",         color: G.coral, bg: G.coralLight },
  ];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
      <div className="scale-in" style={{ background: G.white, borderRadius: "24px 24px 0 0", padding: "28px 20px", paddingBottom: "max(28px, env(safe-area-inset-bottom))" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: G.greyLight, margin: "0 auto 24px" }} />
        <p style={{ fontSize: 12, fontWeight: 600, color: G.grey, letterSpacing: 1.5, textTransform: "uppercase", textAlign: "center", marginBottom: 8 }}>Semaine {weekNumber} terminée</p>
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: G.ink, marginBottom: 6, textAlign: "center" }}>Comment tu t'es senti·e ?</h3>
        <p style={{ color: G.grey, fontSize: 14, textAlign: "center", marginBottom: 24 }}>On adapte les prochaines semaines à ta réponse.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          {opts.map(o => (
            <button key={o.id} onClick={() => onRate(o.id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 16, border: `1.5px solid ${o.bg}`, background: o.bg, cursor: "pointer", textAlign: "left" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: G.ink }}>{o.label}</div>
                <div style={{ fontSize: 12, color: G.grey }}>{o.sub}</div>
              </div>
              <ArrowRight size={16} color={o.color} />
            </button>
          ))}
        </div>
        <button onClick={onSkip} style={{ width: "100%", padding: "12px", background: "none", border: "none", color: G.greyMid, cursor: "pointer", fontSize: 13 }}>Passer</button>
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

const PREMIUM_FEATURES = [
  { Icon: Calendar,   label: "Plans illimités",      desc: "Jusqu'à 52 semaines selon ton événement" },
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
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: G.ink, marginBottom: 8 }}>MySWYM Premium</h3>
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
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: period === "monthly" ? G.ink : G.grey }}>4,99€</div>
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
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: period === "annual" ? G.white : G.ink }}>3,33€</div>
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
  <div style={{ margin: "0 0 16px", background: "linear-gradient(135deg, #001966 0%, #0057FF 100%)", borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
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
  return (
    <div style={{ background: done ? G.greyXLight : G.white, borderRadius: 16, padding: "16px", border: `1px solid ${done ? G.greyLight : "#E8E8E8"}`, borderLeft: `3px solid ${done ? G.greyLight : tm.color}`, opacity: done ? 0.72 : 1, transition: "all 0.3s", boxShadow: done ? "none" : "0 2px 8px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: done ? G.greyLight : tm.bg, borderRadius: 20, padding: "3px 10px", marginBottom: 6 }}>
            <tm.Icon size={10} color={done ? G.greyMid : tm.color} />
            <span style={{ fontSize: 10, fontWeight: 700, color: done ? G.grey : tm.color, letterSpacing: 1, textTransform: "uppercase" }}>{session.type}</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: done ? G.grey : G.ink, lineHeight: 1.2 }}>{session.title}</div>
        </div>
        <button onClick={() => onComplete(weekIndex, sessionIndex)} style={{ width: 34, height: 34, borderRadius: "50%", border: `2px solid ${done ? G.mint : G.greyLight}`, background: done ? G.mint : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 10, transition: "all 0.2s" }}>
          {done && <Check size={14} color={G.white} />}
        </button>
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {[
          { Icon: Ruler, val: session.distance },
          { Icon: Timer, val: formatDuration(session.duration) },
          { Icon: Gauge, val: session.intensity },
        ].map(({ Icon: I, val }, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <I size={12} color={G.greyMid} />
            <span style={{ fontSize: 12, color: G.grey }}>{val}</span>
          </div>
        ))}
      </div>
      {session.details && (
        <div style={{ background: G.bg, borderRadius: 10, padding: "10px 12px", marginTop: 12 }}>
          {session.details.map((d, i) => (
            <div key={i} style={{ fontSize: 12, color: G.grey, lineHeight: 1.7 }}>· {d}</div>
          ))}
        </div>
      )}
      {done && onShare && (
        <button onClick={() => onShare(session)} style={{ marginTop: 12, padding: "8px 14px", borderRadius: 10, background: G.greyXLight, border: `1px solid ${G.greyLight}`, fontSize: 12, color: G.grey, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <Activity size={12} color={G.grey} /> Partager cette séance
        </button>
      )}
    </div>
  );
};

// ── WEEK CARD ──────────────────────────────────────────────────────────────
const WeekCard = ({ week, weekIndex, onComplete, onShare, isCurrentWeek }) => {
  const [open, setOpen] = useState(isCurrentWeek);
  const done = week.sessions.filter(s => s.completed).length;
  const total = week.sessions.length;
  const allDone = done === total;
  return (
    <div style={{ background: G.white, borderRadius: 18, overflow: "hidden", border: isCurrentWeek ? `2px solid ${G.blue}` : `1px solid ${G.greyLight}`, marginBottom: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", padding: "16px 18px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            {isCurrentWeek && <span style={{ fontSize: 10, fontWeight: 700, color: G.white, background: G.blue, padding: "2px 8px", borderRadius: 20 }}>EN COURS</span>}
            {allDone && !isCurrentWeek && <span style={{ fontSize: 10, fontWeight: 700, color: G.mint, background: G.mintLight, padding: "2px 8px", borderRadius: 20 }}>TERMINÉE</span>}
            <span style={{ fontSize: 15, fontWeight: 700, color: G.ink }}>Semaine {week.number}</span>
          </div>
          <div style={{ fontSize: 12, color: G.grey }}>{week.focus} · {done}/{total} séances</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Ring value={done / total} size={38} stroke={4} color={allDone ? G.mint : G.blue} bg={G.greyLight} label={`${done}/${total}`} />
          {open ? <ChevronUp size={16} color={G.greyMid} /> : <ChevronDown size={16} color={G.greyMid} />}
        </div>
      </button>
      {open && (
        <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
          {week.sessions.map((s, i) => (
            <SessionCard key={i} session={s} weekIndex={weekIndex} sessionIndex={i} onComplete={onComplete} onShare={onShare} />
          ))}
          {week.tip && (
            <div style={{ background: G.goldLight, borderRadius: 10, padding: "10px 14px", display: "flex", gap: 8, alignItems: "flex-start" }}>
              <Star size={14} color={G.gold} style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 12, color: "#92400E", lineHeight: 1.5 }}>{week.tip}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── PLAN TAB ──────────────────────────────────────────────────────────────
const PlanTab = ({ plan, profile, isPremium, onComplete, onShare, onReset, onUpgrade, startDate }) => {
  // Semaines débloquées par le calendrier : 1 semaine toutes les 7 jours depuis le début du plan
  const calendarUnlocked = startDate
    ? Math.min(plan.weeks.length, Math.floor((Date.now() - startDate) / (7 * 24 * 60 * 60 * 1000)) + 1)
    : plan.weeks.length; // plans existants sans startDate → on ne punit pas

  const maxVisible = isPremium
    ? calendarUnlocked                           // Premium : calendrier uniquement
    : Math.min(FREE_WEEKS_LIMIT, calendarUnlocked); // Free : calendrier + limite gratuit

  const visibleWeeks = plan.weeks.slice(0, maxVisible);
  const currentWeek = visibleWeeks.findIndex(w => !w.sessions.every(s => s.completed));
  const isFreeLocked = !isPremium && plan.totalRealWeeks > FREE_WEEKS_LIMIT;
  const isCalLocked  = maxVisible < plan.weeks.length;
  const isLocked = isFreeLocked;
  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ padding: "20px 16px 0" }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: G.ink, marginBottom: 4 }}>Programme</h2>
        <p style={{ fontSize: 13, color: G.grey, marginBottom: 20 }}>
          {visibleWeeks.length} semaines · {profile.sessionsPerWeek}×/semaine
          {isLocked && <span style={{ color: G.coral, fontWeight: 600 }}> · {plan.totalRealWeeks - FREE_WEEKS_LIMIT} sem. bloquées</span>}
        </p>
        {visibleWeeks.map((week, i) => (
          <div key={i}>
            <WeekCard week={week} weekIndex={i} onComplete={onComplete} onShare={onShare} isCurrentWeek={i === currentWeek} />
            {!isPremium && i === 0 && plan.totalRealWeeks > 1 && <PremiumTeaser onUpgrade={onUpgrade} />}
          </div>
        ))}
        {isLocked && <PremiumBanner weeksTotal={plan.totalRealWeeks} weeksShown={FREE_WEEKS_LIMIT} onUpgrade={onUpgrade} />}
        {!isLocked && isCalLocked && (
          <div style={{ background: G.greyXLight, border: `1px solid ${G.greyLight}`, borderRadius: 16, padding: "18px 20px", textAlign: "center", marginTop: 8 }}>
            <Lock size={18} color={G.greyMid} style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 14, color: G.grey, lineHeight: 1.55 }}>
              La semaine {maxVisible + 1} se débloque dans{" "}
              <strong style={{ color: G.ink }}>
                {7 - Math.floor(((Date.now() - (startDate ?? Date.now())) / (24 * 60 * 60 * 1000)) % 7)} jours
              </strong>
            </p>
          </div>
        )}
        <button onClick={onReset} style={{ width: "100%", marginTop: 8, padding: "14px", background: "none", border: `1px solid ${G.greyLight}`, borderRadius: 12, color: G.grey, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <RotateCcw size={14} color={G.greyMid} /> Recommencer l'onboarding
        </button>
      </div>
    </div>
  );
};

// ── DASHBOARD ──────────────────────────────────────────────────────────────
const Dashboard = ({ plan, profile, plans = [], activePlanId, onSwitchPlan, onAddPlan, onDeletePlan, onTabChange, onComplete, onShare, onSignOut }) => {
  const goal = GOALS.find(g => g.id === profile.goal);
  const stats = computeStats(plan);
  const currentWeekIndex = plan.weeks.findIndex(w => !w.sessions.every(s => s.completed));
  const currentWeek = currentWeekIndex >= 0 ? plan.weeks[currentWeekIndex] : null;
  const nextSession = currentWeek?.sessions.find(s => !s.completed);
  const nextSessionIndex = currentWeek?.sessions.findIndex(s => !s.completed);
  const weekDone = currentWeek?.sessions.filter(s => s.completed).length ?? 0;
  const weekTotal = currentWeek?.sessions.length ?? 0;
  const daysToEvent = profile.eventDate ? Math.max(0, Math.ceil((new Date(profile.eventDate) - new Date()) / 86400000)) : null;
  const pct = stats.planTotal > 0 ? Math.round(stats.totalSessions / stats.planTotal * 100) : 0;
  const tm = nextSession ? (TYPE_META[nextSession.type] || TYPE_META.ENDURANCE) : null;

  return (
    <div style={{ paddingBottom: 100, background: G.bg, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: G.blue, padding: "56px 20px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <div className="fade-up" style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 5, fontWeight: 700 }}>Programme actif</div>
            <h1 className="fade-up-1" style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: G.white, lineHeight: 1.05 }}>{goal?.label}</h1>
            {daysToEvent !== null && (
              <p className="fade-up-2" style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 5 }}>J−{daysToEvent} · Semaine {(currentWeekIndex >= 0 ? currentWeekIndex + 1 : plan.weeks.length)}/{plan.weeks.length}</p>
            )}
          </div>
          <button onClick={onSignOut} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 10, padding: "8px 10px", cursor: "pointer" }}>
            <LogOut size={15} color="rgba(255,255,255,0.7)" />
          </button>
        </div>
        {/* Progress bar */}
        <div className="fade-up-3">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", letterSpacing: 0.3 }}>{stats.totalSessions} séances · {(stats.totalMeters / 1000).toFixed(1)} km</span>
            <span style={{ fontSize: 14, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: G.white }}>{pct}%</span>
          </div>
          <div style={{ height: 5, background: "rgba(255,255,255,0.18)", borderRadius: 3 }}>
            <div style={{ height: "100%", borderRadius: 3, width: `${pct}%`, background: G.white, transition: "width 1s ease" }} />
          </div>
        </div>

        {/* Plan switcher */}
        {plans.length > 0 && (
          <div style={{ marginTop: 16, display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 2 }}>
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
                  flexShrink: 0, display: "flex", alignItems: "center",
                  borderRadius: 100,
                  border: `1.5px solid ${isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)"}`,
                  background: isActive ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.08)",
                  transition: "all 0.15s", overflow: "hidden",
                }}>
                  <button onClick={() => onSwitchPlan(entry.id)} style={{
                    padding: "7px 10px 7px 13px", cursor: "pointer",
                    background: "none", border: "none",
                    color: isActive ? G.white : "rgba(255,255,255,0.6)",
                    fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
                  }}>
                    {lbl}{days !== null ? ` · J−${days}` : " · 12 sem"}
                  </button>
                  {plans.length > 1 && (
                    <button
                      onClick={() => onDeletePlan(entry.id)}
                      style={{
                        padding: "7px 10px 7px 2px", cursor: "pointer",
                        background: "none", border: "none",
                        color: isActive ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)",
                        fontSize: 14, lineHeight: 1, display: "flex", alignItems: "center",
                      }}
                    >×</button>
                  )}
                </div>
              );
            })}
            <button onClick={onAddPlan} style={{
              flexShrink: 0, padding: "7px 13px", borderRadius: 100, cursor: "pointer",
              border: "1.5px dashed rgba(255,255,255,0.3)", background: "transparent",
              color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
            }}>
              <Plus size={11} /> Ajouter
            </button>
          </div>
        )}
      </div>

      <div style={{ padding: "24px 16px 0" }}>
        {/* Cycle terminé (progression) */}
        {!nextSession && stats.totalSessions > 0 && stats.totalSessions >= stats.planTotal && plan.isProgression && (
          <div className="fade-up scale-in" style={{ background: G.white, borderRadius: 20, padding: 28, textAlign: "center", marginBottom: 20, border: `1px solid ${G.greyLight}` }}>
            <TrendingUp size={40} color={G.blue} style={{ margin: "0 auto 12px" }} />
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: G.ink, marginBottom: 6 }}>Cycle terminé 🎉</h2>
            <p style={{ color: G.grey, fontSize: 14, marginBottom: 8 }}>Tu as nagé <strong style={{ color: G.ink }}>{(stats.totalMeters / 1000).toFixed(1)} km</strong> en 12 semaines.</p>
            <p style={{ color: G.grey, fontSize: 13, marginBottom: 20 }}>Prêt·e pour le prochain cycle ? Ton niveau a évolué — un nouveau plan s'adaptera à ta progression.</p>
            <Btn variant="blue" onClick={onSignOut}>Nouveau cycle</Btn>
          </div>
        )}

        {/* Plan terminé (autres catégories) */}
        {!nextSession && stats.totalSessions > 0 && stats.totalSessions >= stats.planTotal && !plan.isProgression && (
          <div className="fade-up scale-in" style={{ background: G.white, borderRadius: 20, padding: 28, textAlign: "center", marginBottom: 20, border: `1px solid ${G.greyLight}` }}>
            <Trophy size={40} color={G.gold} style={{ margin: "0 auto 12px" }} />
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: G.ink, marginBottom: 6 }}>Plan terminé</h2>
            <p style={{ color: G.grey, fontSize: 14 }}>Programme complété à 100 %.</p>
          </div>
        )}

        {/* Prochaine séance */}
        {nextSession && tm && (
          <div className="fade-up" style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: G.ink }}>Prochaine séance</h2>
              <button onClick={() => onTabChange("plan")} style={{ background: "none", border: "none", fontSize: 13, color: G.blue, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                Voir tout <ArrowRight size={13} color={G.blue} />
              </button>
            </div>
            <div style={{ background: G.white, borderRadius: 20, overflow: "hidden", border: `1px solid ${G.greyLight}`, boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
              {/* Type badge strip */}
              <div style={{ background: tm.color, padding: "10px 20px", display: "flex", alignItems: "center", gap: 8 }}>
                <tm.Icon size={13} color="rgba(255,255,255,0.9)" />
                <span style={{ fontSize: 11, fontWeight: 700, color: G.white, letterSpacing: 1.5, textTransform: "uppercase" }}>{nextSession.type}</span>
              </div>
              <div style={{ padding: "18px 20px 20px" }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: G.ink, marginBottom: 16, lineHeight: 1.2 }}>{nextSession.title}</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                  {[{ Icon: Ruler, val: nextSession.distance, label: "Distance" }, { Icon: Timer, val: formatDuration(nextSession.duration), label: "Durée" }].map(({ Icon: I, val, label }, i) => (
                    <div key={i} style={{ flex: 1, background: G.greyXLight, borderRadius: 12, padding: "12px 14px" }}>
                      <div style={{ fontSize: 11, color: G.grey, marginBottom: 4, letterSpacing: 0.5 }}>{label}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: G.ink }}>{val}</div>
                    </div>
                  ))}
                </div>
                <Btn variant="blue" onClick={() => onComplete(currentWeekIndex, nextSessionIndex)}>Séance terminée</Btn>
              </div>
            </div>
          </div>
        )}

        {/* Stats condensées */}
        <div className="fade-up-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          <div style={{ background: G.white, borderRadius: 16, padding: "16px 18px", border: `1px solid ${G.greyLight}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 10, color: G.blue, letterSpacing: 1, marginBottom: 8, fontWeight: 700, textTransform: "uppercase" }}>Cette semaine</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, color: G.ink, lineHeight: 1 }}>{weekDone}<span style={{ fontSize: 16, fontWeight: 500, color: G.grey }}>/{weekTotal}</span></div>
            <div style={{ fontSize: 12, color: G.grey, marginTop: 5 }}>{currentWeek?.focus ?? "—"}</div>
          </div>
          <div style={{ background: G.white, borderRadius: 16, padding: "16px 18px", border: `1px solid ${G.greyLight}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 10, color: G.blue, letterSpacing: 1, marginBottom: 8, fontWeight: 700, textTransform: "uppercase" }}>Série</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, color: G.ink, lineHeight: 1 }}>{stats.streak}</div>
            <div style={{ fontSize: 12, color: G.grey, marginTop: 5 }}>séances consécutives</div>
          </div>
        </div>
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
        <h1 className="fade-up-1" style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: G.white }}>Statistiques</h1>
      </div>
      <div style={{ padding: "20px 16px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <StatPill icon={Waves}       value={`${(stats.totalMeters / 1000).toFixed(1)} km`} label="Total nagés"         color={G.blue}  bg={G.blueLight} />
          <StatPill icon={Flame}       value={stats.streak}                                   label="Meilleure série"     color={G.coral} bg={G.coralLight} />
          <StatPill icon={Check}       value={stats.totalSessions}                            label="Séances faites"      color={G.mint}  bg={G.mintLight} />
          <StatPill icon={Star}        value={stats.perfectWeeks}                             label="Semaines parfaites"  color={G.gold}  bg={G.goldLight} />
        </div>
        <div style={{ background: G.white, borderRadius: 18, padding: "18px 16px", marginBottom: 16, border: `1px solid ${G.greyLight}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: G.ink, marginBottom: 16 }}>Volume par semaine</h3>
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
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: G.ink, marginBottom: 14 }}>Répartition des types</h3>
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
        <h1 className="fade-up-1" style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: G.white, marginBottom: 4 }}>Badges</h1>
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
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: G.ink, marginBottom: 12 }}>Débloqués</h3>
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
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: G.ink, marginBottom: 12 }}>À débloquer</h3>
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
  beginner:     { endurance: 1200, seuil: 900,  vitesse: 700,  technique: 1000, récupération: 700,  bnssa: 1000 },
  intermediate: { endurance: 2000, seuil: 1800, vitesse: 1400, technique: 1600, récupération: 1200, bnssa: 1500 },
  advanced:     { endurance: 3200, seuil: 2600, vitesse: 2000, technique: 2400, récupération: 1600, bnssa: 2000 },
};
// Alias bnssa pour tests_pompiers (même type de séance)
Object.keys(BASE_DISTANCES).forEach(k => { BASE_DISTANCES[k].tests_pompiers = BASE_DISTANCES[k].bnssa; });

// pace100[lvl][zone] = secondes aux 100m (beginner/intermediate/advanced × easy/threshold/sprint)
const PACE = {
  easy:      [170, 130, 105],
  threshold: [155, 112,  90],
  sprint:    [140,  95,  75],
};

// ── Paces personnalisées ─────────────────────────────────────────────────
// Set par generatePlan quand profile.pace100 est renseigné.
// null = fallback sur le tableau PACE par niveau.
let _pace100 = null;

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
    return `${fmtS(totalSecs)} ≈ ${fmtS(Math.round(secsPer100))}/100m`;
  }
  return fmtS(totalSecs);
};
// Round to nearest pool-length multiple, min 1 length
const snap = (d, P) => Math.max(P, Math.round(d / P) * P);

const SESSION_TEMPLATES = {

  // ── ENDURANCE ────────────────────────────────────────────────────────────
  // 5 variants — rotation formula spreads across weeks without exact repeats
  endurance: (dist, pool, level = "intermediate", weekIdx = 0, goal = "") => {
    const isBeg = level === "beginner", isAdv = level === "advanced";
    const P = pool, lvl = isBeg ? 0 : isAdv ? 2 : 1;
    const v = (Math.floor(weekIdx / 10) * 3 + (weekIdx % 10)) % 5;

    const isTriathlon = goal.startsWith("triathlon");
    const isOpenWater = goal.startsWith("open_water") || goal.startsWith("eau_libre");

    const WARM = 300, COOL = 200, avail = dist - WARM - COOL;

    // v0 — Fond en séries
    const repM = isBeg ? 2*P : Math.min(isAdv ? 4*P : 3*P, 300);
    const nM   = Math.max(2, Math.min(12, Math.floor(avail * 0.70 / repM)));
    const nS   = Math.min(8, Math.max(2, Math.round(Math.max(0, avail - nM*repM) / (2*P))));

    // v1 — Pyramide aérobie
    const pyMax = isBeg ? 2*P : Math.min(isAdv ? 4*P : 3*P, 300);
    const pyUp = [], pyDn = [];
    for (let d = P; d <= pyMax; d += P) { pyUp.push(d); if (d < pyMax) pyDn.unshift(d); }
    const pyAll  = [...pyUp, ...pyDn];
    const pyFill = Math.min(8, Math.max(2, Math.round(Math.max(0, avail - pyAll.reduce((a,b)=>a+b,0)) / (2*P))));

    // v2 — Négatifs splits
    const repNS = isBeg ? 2*P : Math.min(isAdv ? 4*P : 3*P, 400);
    const nNS   = Math.max(2, Math.min(10, Math.floor(avail * 0.70 / repNS)));
    const nNSF  = Math.min(6, Math.max(2, Math.round(Math.max(0, avail - nNS*repNS) / (2*P))));

    // v3 — Long fractionné (broken swim concept)
    const repL = isBeg ? 4*P : Math.min(isAdv ? 8*P : 6*P, 600);
    const nL   = Math.max(2, Math.min(6, Math.floor(avail * 0.70 / repL)));
    const nLF  = Math.min(6, Math.max(2, Math.round(Math.max(0, avail - nL*repL) / (2*P))));

    // v4 — Nage alternée crawl/dos
    const repA = isBeg ? 2*P : Math.min(isAdv ? 3*P : 2*P, 200);
    const nA4  = Math.max(2, Math.min(8, Math.floor(avail * 0.45 / repA)));
    const nB4  = Math.max(2, Math.min(8, Math.floor(avail * 0.35 / repA)));
    const nAF  = Math.min(4, Math.max(0, Math.round(Math.max(0, avail - (nA4+nB4)*repA) / (2*P))));

    const triathlonCue = isTriathlon ? " — imagine la bouée, maintiens ton allure de compétition" : "";
    const owCue = isOpenWater ? " — expire tous les 3 temps, pense à la régularité sans les murs" : "";

    return {
      type: "ENDURANCE",
      ...[
        {
          title: isBeg ? "Séries fondamentales" : "Fond en séries",
          intensity: "Z1/Z2 — allure conversation",
          details: [
            `Échauffement : 200m NL progressif + 100m battements de jambes`,
            `${nM}×${repM}m NL — D${di(repM,lvl,'easy')} — allure régulière, respiration toutes les 3 tractions${triathlonCue}${owCue}`,
            `${nS}×${2*P}m pull-buoy — R20" — bras seuls, coude haut, tire sous l'axe du corps`,
            `Retour au calme : 200m dos lent`,
          ],
        },
        {
          title: "Pyramide aérobie",
          intensity: "Z1/Z2 — régulier de bout en bout",
          details: [
            `Échauffement : 100m NL + 100m dos + 4×25m accélérations progressives`,
            `Pyramide : ${pyAll.join('–')}m NL — R15" entre paliers — même effort à la montée et à la descente, pas de relâche`,
            `${pyFill}×${2*P}m pull-buoy — R20" — récup active, relâche les épaules`,
            `Retour au calme : 200m dos lent`,
          ],
        },
        {
          title: "Négatifs splits",
          intensity: "Z1→Z2 — 2e moitié plus rapide que la 1re",
          details: [
            `Échauffement : 200m NL + 50m fist drill + 50m NL + 50m battements`,
            `${nNS}×${repNS}m NL — D${di(repNS,lvl,'easy')} — 1re moitié en Z1 (retiens-toi), 2e moitié accélère en Z2 : arrive plus fort que tu n'as commencé`,
            `${nNSF}×${2*P}m battements planche — R20" — expire sous l'eau à chaque poussée de mur`,
            `Retour au calme : 200m dos lent`,
          ],
        },
        {
          title: isOpenWater ? "Long continu eau libre" : "Long fractionné",
          intensity: "Z2 — reps longues, gestion mentale",
          details: [
            `Échauffement : 150m NL progressif + 100m dos + 4×${P}m accélérations`,
            isOpenWater
              ? `${nL}×${repL}m NL — R10" — sans mur, imagine nager en lac : gère l'allure sur la totalité de la distance, régularité absolue`
              : `${nL}×${repL}m NL — R10" — reps longues à allure maîtrisée : chaque coulée après le mur te fait gagner 0.5s`,
            `${nLF}×${2*P}m pull-buoy — R20" — relâche les jambes, concentre-toi sur la traction`,
            `Retour au calme : 200m dos lent`,
          ],
        },
        {
          title: "Nage alternée — crawl & dos",
          intensity: "Z1/Z2 — récupération active entre les blocs",
          details: [
            `Échauffement : 200m NL progressif + 100m battements de jambes`,
            `${nA4}×${repA}m NL — D${di(repA,lvl,'easy')} — Z2 régulier, contrôle la respiration`,
            `${nB4}×${repA}m dos crawlé — R15" — nage active, épaule sort en premier, rotation du bassin`,
            nAF > 0 ? `${nAF}×${2*P}m battements planche — R20" — récup active, fouet des chevilles` : `100m NL très lent — récup libre`,
            `Retour au calme : 150m NL très lent`,
          ],
        },
      ][v],
    };
  },

  // ── SEUIL ────────────────────────────────────────────────────────────────
  // 5 variants : CSS, pyramide, blocs T-pace, séries descendantes, over-distance
  seuil: (dist, pool, level = "intermediate", weekIdx = 0, goal = "") => {
    const isBeg = level === "beginner", isAdv = level === "advanced";
    const P = pool, lvl = isBeg ? 0 : isAdv ? 2 : 1;
    const v = (Math.floor(weekIdx / 10) * 3 + (weekIdx % 10)) % 5;

    const isTriathlon = goal.startsWith("triathlon");

    const WARM = 300, COOL = 200, avail = dist - WARM - COOL;

    // v0 — CSS
    const cssRep = isBeg ? 2*P : Math.min(isAdv ? 4*P : 3*P, 200);
    const nCSS   = Math.max(4, Math.min(10, Math.floor(avail * 0.65 / cssRep)));
    const nFin   = Math.min(8, Math.max(2, Math.round(Math.max(0, avail - nCSS*cssRep) / (2*P))));

    // v1 — Pyramide seuil
    const pyStep = isBeg ? P : Math.min(2*P, 100);
    const pyMax  = pyStep * (isBeg ? 3 : isAdv ? 5 : 4);
    const pyUp = [], pyDn = [];
    for (let d = pyStep; d <= pyMax; d += pyStep) { pyUp.push(d); if (d < pyMax) pyDn.unshift(d); }
    const pyAll  = [...pyUp, ...pyDn];
    const pyFill = Math.min(8, Math.max(2, Math.round(Math.max(0, avail - pyAll.reduce((a,b)=>a+b,0)) / (2*P))));

    // v2 — Blocs T-pace
    const tRep    = isBeg ? 2*P : Math.min(isAdv ? 4*P : 3*P, 200);
    const nT      = Math.max(3, Math.min(8, Math.floor(avail * 0.60 / tRep)));
    const nSprint = Math.min(8, Math.max(2, Math.round(Math.max(0, avail - nT*tRep) / (2*P))));

    // v3 — Séries descendantes
    const dRep = isBeg ? 2*P : Math.min(isAdv ? 3*P : 2*P, 200);
    const nD   = Math.max(4, Math.min(8, Math.floor(avail * 0.65 / dRep)));
    const nDF  = Math.min(6, Math.max(2, Math.round(Math.max(0, avail - nD*dRep) / (2*P))));

    // v4 — Over-distance / tempo prolongé
    const overRep = isBeg ? 3*P : Math.min(isAdv ? 6*P : 4*P, 400);
    const nOver   = Math.max(2, Math.min(5, Math.floor(avail * 0.65 / overRep)));
    const nOverF  = Math.min(6, Math.max(2, Math.round(Math.max(0, avail - nOver*overRep) / (2*P))));

    const cssLabel = isTriathlon
      ? "allure nage triathlon cible — reproduis l'effort de la compétition, régularité absolue"
      : "allure 1 500m — régularité absolue, mêmes temps de passage";

    return {
      type: "SEUIL",
      ...[
        {
          title: isBeg ? "Intervalles réguliers" : "CSS — allure critique",
          intensity: "Z3 — effort soutenu et constant",
          details: [
            `Échauffement : 200m NL progressif + 4×25m accélérations + 50m battements`,
            `${nCSS}×${cssRep}m NL — D${di(cssRep,lvl,'threshold')} — ${cssLabel}`,
            `${nFin}×${2*P}m battements de jambes — R20" — fouet des chevilles, corps aligné`,
            `Retour au calme : 200m dos lent`,
          ],
        },
        {
          title: "Pyramide seuil",
          intensity: "Z3/Z4 — intensité croissante puis décroissante",
          details: [
            `Échauffement : 200m NL + 100m battements de jambes`,
            `Pyramide : ${pyAll.join('–')}m NL — R20" entre paliers — allure seuil à chaque palier, pas de relâche en haut`,
            `${pyFill}×${2*P}m NL — R15" — allure récup active`,
            `Retour au calme : 200m dos lent`,
          ],
        },
        {
          title: "Blocs T-pace",
          intensity: "Z4 — inconfortable et régulier",
          details: [
            `Échauffement : 200m NL + 100m battements de jambes`,
            `${nT}×${tRep}m NL — D${di(tRep,lvl,'threshold')} — allure course 400m, l'effort doit être inconfortable mais régulier`,
            `${nSprint}×${2*P}m NL — R20" — sprint à 90 % pour activer les fibres rapides`,
            `Retour au calme : 200m dos lent`,
          ],
        },
        {
          title: "Séries descendantes",
          intensity: "Z3→Z4 — patient au départ, explosif à l'arrivée",
          details: [
            `Échauffement : 200m NL progressif + 4×25m accélérations + 50m battements`,
            `${nD}×${dRep}m NL — D${di(dRep,lvl,'threshold')} — vise −2s de mieux à chaque rep : rep 1 conservatrice, rep ${nD} à bloc`,
            `${nDF}×${2*P}m pull-buoy — R20" — bras seuls, récup active`,
            `Retour au calme : 200m dos lent`,
          ],
        },
        {
          title: isBeg ? "Tempo prolongé" : "Over-distance — seuil sur la durée",
          intensity: "Z3 — légèrement sous le seuil, travaille la marge",
          details: [
            `Échauffement : 100m NL + 100m dos + 4×25m accélérations`,
            isBeg
              ? `${nOver}×${overRep}m NL — D${di(overRep,lvl,'threshold')} — reps plus longues qu'à l'habitude, reste à l'aise de bout en bout`
              : `${nOver}×${overRep}m NL — D${di(overRep,lvl,'threshold')} — distance supérieure à tes reps CSS habituelles, allure légèrement conservatrice : construis ta résistance`,
            `${nOverF}×${2*P}m dos crawlé — R15" — récup en nage active, scan corporel`,
            `Retour au calme : 200m dos lent`,
          ],
        },
      ][v],
    };
  },

  // ── VITESSE ──────────────────────────────────────────────────────────────
  // 4 variants avec warm-ups variés et cues améliorés
  vitesse: (dist, pool, level = "intermediate", weekIdx = 0, goal = "") => {
    const isBeg = level === "beginner", isAdv = level === "advanced";
    const P = pool, lvl = isBeg ? 0 : isAdv ? 2 : 1;
    const v = (Math.floor(weekIdx / 10) * 3 + (weekIdx % 10)) % 4;

    const WARM = 300, COOL = 200, avail = dist - WARM - COOL;

    const nSpr   = Math.max(6, Math.min(10, Math.round(avail * 0.5 / P)));
    const nSec   = Math.min(8, Math.max(2, Math.round(Math.max(0, avail - nSpr*P) / (2*P))));
    const recSpr = isBeg ? "R1'30\"" : isAdv ? "R45\"" : "R1'00\"";
    const nDive  = Math.max(6, Math.min(10, Math.round(avail * 0.5 / P)));
    const nRec   = Math.min(6, Math.max(2, Math.round(Math.max(0, avail - nDive*P) / (2*P))));

    const palRep = 2*P;
    const nPal   = Math.max(4, Math.min(10, Math.floor(avail * 0.5 / palRep)));
    const nSp2   = Math.max(4, Math.min(8, Math.round((avail - nPal*palRep) * 0.6 / P)));
    const nKick  = Math.min(8, Math.max(2, Math.round(Math.max(0, avail - nPal*palRep - nSp2*P) / (2*P))));

    const buildRep = 2*P;
    const nBuild   = Math.max(4, Math.min(10, Math.floor(avail * 0.6 / buildRep)));
    const nKick2   = Math.min(8, Math.max(2, Math.round(Math.max(0, avail - nBuild*buildRep) / (2*P))));

    return {
      type: "VITESSE",
      ...[
        {
          title: "Sprints maximaux",
          intensity: "Z5 — sprint total, récup complète",
          details: [
            `Échauffement : 200m NL progressif + 4×25m accélérations progressives + 50m battements`,
            `6×12m coulées — torpille gainée, flèche maximale en apnée, stop dès que tu ralentis`,
            `${nSpr}×${P}m SPRINT MAX — ${recSpr} — qualité absolue, chaque longueur comme si c'était la seule`,
            `${nSec}×${2*P}m pull-buoy — R20" — récup active, relâche tout`,
            `Retour au calme : 200m dos lent`,
          ],
        },
        {
          title: "Puissance palettes",
          intensity: "Z5 — puissance de bras",
          details: [
            `Échauffement : 200m NL + 100m battements de jambes`,
            `${nPal}×${palRep}m palettes + pull-buoy — R20" — coude haut, pression max sur les paumes, sens la portance`,
            `${nSp2}×${P}m SPRINT mains nues — ${recSpr} — reproduis la prise d'eau des palettes, engage l'avant-bras`,
            `${nKick}×${2*P}m battements planche — R20" — fouet des chevilles, engage les quadriceps`,
            `Retour au calme : 200m dos lent`,
          ],
        },
        {
          title: "Accélérations construites",
          intensity: "Z4→Z5 — montée en puissance progressive",
          details: [
            `Échauffement : 200m NL progressif + 4×12m coulées gainées`,
            `${nBuild}×${buildRep}m NL — D${di(buildRep,lvl,'threshold')} — 1re moitié Z2 économique, 2e moitié accélère à 95 % : arrive plus vite que tu n'es parti`,
            `${nKick2}×${2*P}m battements planche — R20" — fouet des chevilles, corps à plat`,
            `Retour au calme : 200m dos lent`,
          ],
        },
        {
          title: "Départs plongée & explosivité",
          intensity: "Z5/Z6 — explosivité maximale, récup complète",
          details: [
            `Échauffement : 200m NL progressif + 100m battements + 4×${P}m accélérations`,
            `6×10m départ plongée — R2' — bloc → torpille gainée → 3 premiers cycles NL à fond, stop`,
            `${nDive}×${P}m SPRINT à bloc — R2' — départ plongée complet, effort total, récup complète entre chaque`,
            `${nRec}×${2*P}m pull-buoy — R20" — récup active`,
            `Retour au calme : 200m dos lent`,
          ],
        },
      ][v],
    };
  },

  // ── TECHNIQUE ────────────────────────────────────────────────────────────
  // Beginner : 5 variants | Inter/Adv : 5 variants
  technique: (dist, pool, level = "intermediate", weekIdx = 0, goal = "") => {
    const isBeg = level === "beginner", isAdv = level === "advanced";
    const P = pool, lvl = isBeg ? 0 : isAdv ? 2 : 1;
    const v = (Math.floor(weekIdx / 10) * 3 + (weekIdx % 10)) % 5;

    const repR = 2*P;
    const WARM = 2*repR, COOL = repR, avail = dist - WARM - COOL;

    const nPerBlock = Math.max(3, Math.min(8, Math.round(avail / (4*repR))));
    const nInteg    = Math.min(8, Math.max(2, Math.round(Math.max(0, avail - 3*nPerBlock*repR) / repR)));

    if (isBeg) {
      return {
        type: "TECHNIQUE",
        ...[
          {
            title: "Planche & pull-buoy",
            intensity: "Facile — qualité du mouvement",
            details: [
              `Échauffement : ${repR}m NL lent + ${repR}m dos lent`,
              `${nPerBlock}×${repR}m battements planche — R10" — corps horizontal, talons à la surface, expire sous l'eau`,
              `${nPerBlock}×${repR}m pull-buoy — R10" — bras seuls, sens la pression des paumes sur l'eau`,
              `${nInteg}×${repR}m NL complet — R10" — coordonne jambes et bras, vise la fluidité`,
              `Retour au calme :${repR}m dos lent`,
            ],
          },
          {
            title: "Fist drill — sentir l'eau",
            intensity: "Facile — ressentir l'avant-bras",
            details: [
              `Échauffement : ${repR}m NL lent + ${repR}m dos lent`,
              `${nPerBlock}×${repR}m fist drill — R10" — poings fermés, l'avant-bras accroche l'eau`,
              `${nPerBlock}×${repR}m mains ouvertes — R10" — ressens le grip retrouvé, note la différence`,
              `${nInteg}×${repR}m NL complet — R10" — garde la sensation de prise profonde et précoce`,
              `Retour au calme :${repR}m dos lent`,
            ],
          },
          {
            title: "Respiration bilatérale",
            intensity: "Facile — coordination respiratoire",
            details: [
              `Échauffement : ${repR}m NL lent + ${repR}m battements planche`,
              `${nPerBlock}×${repR}m NL resp. 3 temps — R10" — inspire à droite sur 3 longueurs, à gauche sur 3 longueurs`,
              `${nPerBlock}×${repR}m dos crawlé lent — R10" — bras tendu, rotation douce, expire en surface`,
              `${nInteg}×${repR}m NL — R10" — alterne 3 temps et 2 temps, sens la différence d'équilibre`,
              `Retour au calme :${repR}m dos lent`,
            ],
          },
          {
            title: "Dos & position du corps",
            intensity: "Facile — position du corps",
            details: [
              `Échauffement : ${repR}m NL lent + ${repR}m battements planche`,
              `${nPerBlock}×${repR}m dos crawlé — R10" — regard au plafond, épaule sort en premier`,
              `${nPerBlock}×${repR}m battements dos — R10" — bras le long du corps, hanches en surface`,
              `${nInteg}×${repR}m NL — R10" — focus coulée longue après chaque virage`,
              `Retour au calme :${repR}m dos lent`,
            ],
          },
          {
            title: "6-kick switch — équilibre & rotation",
            intensity: "Facile — équilibre latéral",
            details: [
              `Échauffement : ${repR}m NL lent + ${repR}m dos lent`,
              `${nPerBlock}×${repR}m 6-kick drill — R15" — 6 battements sur le flanc, tête dans l'axe, équilibre sans forcer`,
              `${nPerBlock}×${repR}m switch drill — R15" — rotation complète à chaque coup de bras, 1 battement de cheville`,
              `${nInteg}×${repR}m NL — R10" — imagine que tu roules sur un axe, pas que tu te tords`,
              `Retour au calme :${repR}m dos lent`,
            ],
          },
        ][v],
      };
    }

    const cycleTarget = isAdv ? "15–18" : "18–22";

    return {
      type: "TECHNIQUE",
      ...[
        {
          title: "Catch-up drill & DPS",
          intensity: "Faible — distance par cycle (DPS)",
          details: [
            `Échauffement : ${repR}m NL + ${repR}m battements planche`,
            `${nPerBlock}×${repR}m catch-up drill — R10" — bras tendu devant, attend la main adverse avant de repartir`,
            `${nPerBlock}×${repR}m DPS comptage — R10" — vise ${cycleTarget} cycles/longueur`,
            `${nInteg}×${repR}m NL — D${di(repR,lvl,'easy')} — réduis d'1 cycle/longueur vs ta normale, même vitesse`,
            `Retour au calme :${repR}m dos lent`,
          ],
        },
        {
          title: "Fist drill & prise d'eau",
          intensity: "Faible — qualité de la prise",
          details: [
            `Échauffement : ${repR}m NL + ${repR}m battements planche`,
            `${nPerBlock}×${repR}m fist drill — R10" — poings fermés, accroche avec l'avant-bras, coude haut`,
            `${nPerBlock}×${repR}m finger drag — R10" — doigts effleurent la surface au retour, coude haut`,
            `${nInteg}×${repR}m NL — D${di(repR,lvl,'easy')} — prise précoce et profonde, tire sous l'axe du corps`,
            `Retour au calme :${repR}m dos lent`,
          ],
        },
        {
          title: "6-kick drill & rotation",
          intensity: "Faible — alignement et rotation",
          details: [
            `Échauffement : ${repR}m NL + ${repR}m battements planche`,
            `${nPerBlock}×${repR}m 6-kick drill — R10" — 6 battements sur le côté, nez au fond, rotation consciente`,
            `${nPerBlock}×${repR}m rotation exagérée — R10" — épaule passe au-dessus de l'eau, 2s de glisse`,
            `${nInteg}×${repR}m NL — D${di(repR,lvl,'easy')} — vise ${cycleTarget} cycles/longueur, même temps`,
            `Retour au calme :${repR}m dos lent`,
          ],
        },
        {
          title: "Virages & coulées",
          intensity: "Faible — travail des virages",
          details: [
            `Échauffement : ${repR}m NL + ${repR}m battements planche`,
            `${nPerBlock}×${repR}m coulées — R10" — flèche max gainée, 5m en apnée avant le 1er bras`,
            `${nPerBlock}×${repR}m flip turns — R15" — culbute à 1m du mur, poussée + flèche`,
            `${nInteg}×${repR}m NL — D${di(repR,lvl,'easy')} — chaque virage = relance d'élan, zéro perte de vitesse`,
            `Retour au calme :${repR}m dos lent`,
          ],
        },
        {
          title: "Tempo & SPL — vitesse sans forcer",
          intensity: "Faible/Modéré — plus vite sans plus de cycles",
          details: [
            `Échauffement : ${repR}m NL + 4×${P}m accélérations progressives + ${repR}m battements`,
            `${nPerBlock}×${repR}m NL — R10" — compte tes cycles/longueur, note ton SPL de base`,
            `${nPerBlock}×${repR}m NL — D${di(repR,lvl,'easy')} — accélère le rythme de bras en gardant le même SPL`,
            `${nInteg}×${repR}m NL — D${di(repR,lvl,'easy')} — objectif : 2s plus rapide que ta normale avec le même nombre de cycles`,
            `Retour au calme :${repR}m dos lent`,
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
    const isBeg = level === "beginner";
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
            `${nD}×${repR}m battements planche — R10" — jambes libres, expire dans l'eau`,
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

const PHASE_PATTERNS = {
  base:        { 1: ["endurance"], 2: ["endurance", "technique"], 3: ["endurance", "endurance", "technique"], 4: ["endurance", "endurance", "technique", "récupération"] },
  development: { 1: ["seuil"],     2: ["endurance", "seuil"],     3: ["endurance", "seuil", "technique"],     4: ["endurance", "seuil", "vitesse", "technique"] },
  peak:        { 1: ["seuil"],     2: ["seuil", "vitesse"],        3: ["endurance", "seuil", "vitesse"],       4: ["endurance", "seuil", "vitesse", "seuil"] },
  taper:       { 1: ["endurance"], 2: ["endurance", "récupération"], 3: ["endurance", "technique", "récupération"], 4: ["endurance", "technique", "récupération", "récupération"] },
  competition: { 1: ["récupération"], 2: ["récupération", "récupération"], 3: ["endurance", "récupération", "récupération"], 4: ["endurance", "récupération", "récupération", "récupération"] },
};

const BNSSA_PATTERNS = {
  base:        { 1: ["endurance"], 2: ["endurance", "bnssa"],  3: ["endurance", "bnssa", "récupération"],  4: ["endurance", "endurance", "bnssa", "récupération"] },
  development: { 1: ["bnssa"],     2: ["endurance", "bnssa"],  3: ["endurance", "bnssa", "bnssa"],         4: ["endurance", "seuil", "bnssa", "bnssa"] },
  peak:        { 1: ["bnssa"],     2: ["bnssa", "bnssa"],       3: ["endurance", "bnssa", "bnssa"],         4: ["endurance", "seuil", "bnssa", "bnssa"] },
  taper:       { 1: ["endurance"], 2: ["endurance", "bnssa"],  3: ["endurance", "bnssa", "récupération"],  4: ["endurance", "bnssa", "récupération", "récupération"] },
  competition: { 1: ["récupération"], 2: ["récupération", "récupération"], 3: ["endurance", "récupération", "récupération"], 4: ["endurance", "récupération", "récupération", "récupération"] },
};

const WELLNESS_PATTERNS = {
  base:        { 1: ["endurance"], 2: ["endurance", "récupération"], 3: ["endurance", "technique", "récupération"], 4: ["endurance", "endurance", "technique", "récupération"] },
  development: { 1: ["endurance"], 2: ["endurance", "technique"],    3: ["endurance", "endurance", "technique"],    4: ["endurance", "endurance", "technique", "récupération"] },
};

const PROGRESSION_PATTERNS = {
  base:        { 1: ["endurance"],              2: ["endurance", "technique"],                       3: ["endurance", "technique", "récupération"],            4: ["endurance", "endurance", "technique", "récupération"] },
  development: { 1: ["endurance"],              2: ["seuil", "endurance"],                           3: ["seuil", "endurance", "technique"],                    4: ["seuil", "endurance", "technique", "récupération"] },
  peak:        { 1: ["vitesse"],                2: ["vitesse", "seuil"],                             3: ["vitesse", "seuil", "endurance"],                      4: ["vitesse", "seuil", "endurance", "récupération"] },
  bilan:       { 1: ["récupération"],           2: ["récupération", "technique"],                    3: ["récupération", "technique", "endurance"],             4: ["récupération", "technique", "endurance", "technique"] },
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
  const baseDist = BASE_DISTANCES[level] || BASE_DISTANCES.beginner;
  const progressionPhaseList = progression ? buildProgressionPhases() : null;
  const phaseList = progression ? progressionPhaseList.slice(0, totalWeeks) : wellness ? buildWellnessPhases(totalWeeks) : buildPlanPhases(totalWeeks);
  const patterns = progression ? PROGRESSION_PATTERNS : wellness ? WELLNESS_PATTERNS : (goal === "bnssa" || goal === "tests_pompiers") ? BNSSA_PATTERNS : PHASE_PATTERNS;
  const f = Math.min(freq, 4);
  const weeks = phaseList.map((phase, wi) => {
    const types = patterns[phase.phase]?.[f] || patterns.base[f] || ["endurance"];
    return {
      number: wi + 1, focus: phase.focus, tip: TIPS[phase.tipKey], feedback: null, isBilan: phase.isBilan ?? false,
      sessions: types.map((type, si) => {
        const distBase = Math.round(baseDist[type] * phase.progression / 50) * 50;
        return { ...SESSION_TEMPLATES[type](distBase, pool, level, wi * 10 + si, goal), distance: `${distBase}m`, duration: Math.max(30, Math.min(120, Math.round(distBase / 38))), completed: false };
      }),
    };
  });
  return { weeks, totalRealWeeks: rawWeeks, isPremium, isProgression: progression };
};

// ── APP ───────────────────────────────────────────────────────────────────
const BLANK_PROFILE = { category: "", goal: "", eventDate: "", level: "", pool: 50, sessionsPerWeek: null, weightCurrent: "", weightGoal: "", pace100: null };

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
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
      setToast("Activation en cours… Si ça tarde, clique sur « Actualiser le statut » dans Profil.");
      setTimeout(() => setToast(null), 8000);
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

  // Régénère le plan actif quand le premium est débloqué et que le plan était tronqué
  useEffect(() => {
    if (!isPremium || !activePlanEntry) return;
    const { plan: ap, profile: aprof } = activePlanEntry;
    if (ap && aprof.goal && ap.totalRealWeeks > ap.weeks.length) {
      setScreen("loading");
      generatePlan(aprof, true).then(newPlan => {
        setPlans(prev => prev.map(e => e.id === activePlanId ? { ...e, plan: newPlan } : e));
        setScreen("app"); setActiveTab("home");
      });
    }
  }, [isPremium]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
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

    // 2. Supabase (ancien format mono-plan)
    try {
      const { data, error } = await supabase.from("user_plans").select("profile, plan").eq("user_id", userId).single();
      if (data && !error && data.profile && data.plan) {
        const id = `plan_${Date.now()}`;
        const entry = { id, profile: data.profile, plan: enforce(data.plan) };
        setPlans([entry]); setActivePlanId(id); setScreen("app"); return;
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
    // Supabase: sauvegarde le plan actif (compat)
    if (activePlanEntry) {
      supabase.from("user_plans").upsert({
        user_id: user.id, profile: activePlanEntry.profile, plan: activePlanEntry.plan,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" }).then(() => {});
    }
  }, [plans, activePlanId, user]);


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

  const handleFeedback = (rating) => {
    if (feedbackWeek === null) return;
    setPlans(prev => prev.map(e => e.id !== activePlanId ? e : { ...e, plan: adjustPlan(e.plan, feedbackWeek, rating) }));
    setFeedbackWeek(null);
  };

  const handlePaceUpdate = (newPace100) => {
    setPlans(prev => prev.map(e => e.id !== activePlanId ? e : { ...e, profile: { ...e.profile, pace100: newPace100 } }));
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
    try {
      const { data: refreshData } = await supabase.auth.refreshSession();
      const session = refreshData?.session;
      if (!session) return;
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}`, "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({ origin: window.location.origin }),
      });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
    } catch {}
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
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 19, color: G.ink }}>MySWYM</span>
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
              // Nouvelle logique : category → sub-goal → level → freq → date (sauf poids)
              // step 1 = catégorie, 2 = sous-objectif/poids, 3 = niveau+bassin
              // step 4 = temps 100m, 5 = fréquence, 6 = date (sauf poids)
              const isPoids = profile.category === "poids";
              const noDate = isPoids || isProgressionGoal(profile.goal);
              const totalSteps = noDate ? 5 : 6;
              return (
                <>
                  {step > 1 && <Progress step={step - 1} total={totalSteps} />}
                  {error && <div style={{ background: "#FFE8E8", borderRadius: 10, padding: "10px 14px", marginBottom: 16, color: "#CC0000", fontSize: 13 }}>{error}</div>}

                  {step === 1 && (
                    <Step1_Category onSelect={cat => {
                      const goal = cat === "poids" ? "perte_de_poids" : "";
                      setProfile(p => ({ ...p, category: cat, goal }));
                      setStep(2);
                    }} />
                  )}

                  {step === 2 && profile.category === "poids" && (
                    <StepWeight
                      weightCurrent={profile.weightCurrent} weightGoal={profile.weightGoal}
                      onChangeCurrent={v => update("weightCurrent", v)} onChangeGoal={v => update("weightGoal", v)}
                      onNext={() => setStep(3)} onBack={() => setStep(1)} />
                  )}

                  {step === 2 && profile.category !== "poids" && (
                    <Step2_SubGoal
                      category={profile.category}
                      onSelect={goalId => { update("goal", goalId); setStep(3); }}
                      onBack={() => setStep(1)} />
                  )}

                  {step === 3 && (
                    <Step3_Level value={profile.level} onChange={v => update("level", v)} pool={profile.pool} onPoolChange={v => update("pool", v)} total={totalSteps} onNext={() => setStep(4)} onBack={() => setStep(2)} />
                  )}

                  {step === 4 && (
                    <Step_Pace
                      value={profile.pace100}
                      onChange={v => update("pace100", v)}
                      total={totalSteps}
                      onNext={() => setStep(5)}
                      onSkip={() => { update("pace100", null); setStep(5); }}
                      onBack={() => setStep(3)} />
                  )}

                  {step === 5 && (
                    <Step4_Frequency value={profile.sessionsPerWeek} onChange={v => update("sessionsPerWeek", v)} total={totalSteps} onNext={noDate ? handleGenerate : () => setStep(6)} onBack={() => setStep(4)} isLast={noDate} isPremium={isPremium} onUpgrade={() => setShowUpgrade(true)} />
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
        {activeTab === "home"    && <Dashboard   plan={plan} profile={activeProfile} plans={plans} activePlanId={activePlanId} onSwitchPlan={handleSwitchPlan} onAddPlan={handleAddPlan} onDeletePlan={handleDeletePlan} onTabChange={setActiveTab} onComplete={handleComplete} onShare={s => setShareSession(s)} onSignOut={handleSignOut} />}
        {activeTab === "plan"    && <PlanTab     plan={plan} profile={activeProfile} isPremium={isPremium} onComplete={handleComplete} onShare={s => setShareSession(s)} onReset={handleReset} onUpgrade={() => setShowUpgrade(true)} startDate={activePlanEntry?.startDate} />}
        {activeTab === "profile" && <ProfileTab  plan={plan} profile={activeProfile} user={user} isPremium={isPremium} onSignOut={handleSignOut} onPortal={handlePortal} onUpgrade={() => setShowUpgrade(true)} onRefreshStatus={handleRefreshStatus} onPaceUpdate={handlePaceUpdate} />}

        <BottomNav active={activeTab} onChange={setActiveTab} newBadge={newBadgeId !== null} />

        {feedbackWeek !== null && <FeedbackModal weekNumber={plan.weeks[feedbackWeek]?.number} onRate={handleFeedback} onSkip={() => setFeedbackWeek(null)} />}
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
