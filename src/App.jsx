import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";
import {
  Waves, Flame, Star, Calendar, BarChart2, Award, Home,
  Ruler, Clock, Zap, Check, Lock, Trophy, Target,
  ChevronDown, ChevronUp, LogOut, Activity, User,
  Droplets, TrendingUp, Timer, RotateCcw, ArrowRight, Gauge, Settings, Shield,
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
  body { background: ${G.bg}; font-family: 'DM Sans', sans-serif; overscroll-behavior: none; }
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
  button:active { transform: scale(0.97); }
`;

// ── DATA ──────────────────────────────────────────────────────────────────
const GOALS = [
  { id: "triathlon_sprint",  label: "Triathlon Sprint",       dist: "750 m nage",                   icon: <Activity size={20} />, wellness: false },
  { id: "triathlon_olympic", label: "Triathlon Olympique",    dist: "1 500 m nage",                 icon: <Activity size={20} />, wellness: false },
  { id: "triathlon_ironman", label: "Triathlon Ironman",      dist: "3 800 m nage",                 icon: <Activity size={20} />, wellness: false },
  { id: "open_water_5k",     label: "Eau libre 5 km",         dist: "5 km",                         icon: <Waves size={20} />,    wellness: false },
  { id: "open_water_10k",    label: "Eau libre 10 km",        dist: "10 km",                        icon: <Waves size={20} />,    wellness: false },
  { id: "bnssa",             label: "Prépa BNSSA",            dist: "100 m & 250 m sauvetage",      icon: <Shield size={20} />,   wellness: false },
  { id: "bpjeps_aan",        label: "Prépa BPJEPS AAN",       dist: "400 m NL < 7'40\"",            icon: <Award size={20} />,    wellness: false },
  { id: "competition_maitre",label: "Compétition Maître",     dist: "50–1 500 m",                   icon: <Trophy size={20} />,   wellness: false },
  { id: "reprendre",         label: "Reprendre la natation",  dist: "6 semaines · en douceur",      icon: <RotateCcw size={20} />, wellness: true },
  { id: "perte_de_poids",    label: "Perte de poids",         dist: "Durée selon ton objectif",     icon: <Target size={20} />,   wellness: true  },
];

const isWellnessGoal = (goalId) => GOALS.find(g => g.id === goalId)?.wellness === true;

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

const ProfileTab = ({ plan, user, isPremium, onSignOut, onPortal, onUpgrade, onRefreshStatus }) => {
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
      <div style={{ background: "linear-gradient(140deg, #0D1117 0%, #001966 100%)", padding: "52px 20px 28px" }}>
        <div className="fade-up" style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", letterSpacing: 1, marginBottom: 4 }}>Ton espace</div>
        <h1 className="fade-up-1" style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: G.white, marginBottom: 4 }}>Profil</h1>
        <p className="fade-up-2" style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>{(stats.totalMeters / 1000).toFixed(1)} km nagés · {earned.length} badge{earned.length !== 1 ? "s" : ""}</p>
      </div>

      <div style={{ padding: "20px 16px 0" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <StatPill icon={Waves}  value={`${(stats.totalMeters / 1000).toFixed(1)} km`} label="Total nagés"        color={G.blue}  bg={G.blueLight}  />
          <StatPill icon={Flame}  value={stats.streak}                                   label="Meilleure série"    color={G.coral} bg={G.coralLight} />
          <StatPill icon={Check}  value={stats.totalSessions}                            label="Séances faites"     color={G.mint}  bg={G.mintLight}  />
          <StatPill icon={Star}   value={stats.perfectWeeks}                             label="Semaines parfaites" color={G.gold}  bg={G.goldLight}  />
        </div>

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
const Step1_Goal = ({ value, onChange, onNext }) => (
  <div className="fade-up">
    <p style={{ fontSize: 12, fontWeight: 600, color: G.grey, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Étape 1 sur 4</p>
    <h2 style={{ fontSize: 30, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: G.ink, marginBottom: 6, lineHeight: 1.1 }}>Quel est ton<br />objectif ?</h2>
    <p style={{ color: G.grey, fontSize: 15, marginBottom: 28 }}>On va construire ton plan autour de ça.</p>
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
      {GOALS.map(g => (
        <button key={g.id} onClick={() => onChange(g.id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14, border: `2px solid ${value === g.id ? G.ink : G.greyLight}`, background: value === g.id ? G.ink : G.white, cursor: "pointer", transition: "all 0.2s", textAlign: "left" }}>
          <span style={{ color: value === g.id ? G.white : G.grey, flexShrink: 0 }}>{g.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: value === g.id ? G.white : G.ink }}>{g.label}</div>
            <div style={{ fontSize: 12, color: value === g.id ? "rgba(255,255,255,0.5)" : G.grey }}>{g.dist}</div>
          </div>
          {value === g.id && <Check size={16} color={G.white} />}
        </button>
      ))}
    </div>
    <Btn onClick={onNext} disabled={!value}>Continuer</Btn>
  </div>
);

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
  const minDate = (() => { const d = new Date(); d.setDate(d.getDate() + 42); return d.toISOString().split("T")[0]; })();
  return (
    <div className="fade-up">
      <p style={{ fontSize: 12, fontWeight: 600, color: G.grey, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Étape 2 sur 4</p>
      <h2 style={{ fontSize: 30, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: G.ink, marginBottom: 6, lineHeight: 1.1 }}>Date de<br />l'événement ?</h2>
      <p style={{ color: G.grey, fontSize: 15, marginBottom: 28 }}>Un bon plan demande au minimum 6 semaines.</p>
      <div style={{ background: G.white, borderRadius: 16, padding: 20, marginBottom: 14, border: `1px solid ${G.greyLight}` }}>
        <label style={{ fontSize: 11, color: G.grey, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Date</label>
        <input type="date" value={value} onChange={e => onChange(e.target.value)} min={minDate}
          style={{ width: "100%", border: "none", fontSize: 22, fontFamily: "'Syne', sans-serif", fontWeight: 700, color: G.ink, background: "transparent", outline: "none" }} />
      </div>
      {weeks && (
        <div style={{ background: "linear-gradient(135deg, #001966 0%, #0057FF 100%)", borderRadius: 12, padding: "14px 16px", marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Calendar size={18} color={G.white} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: G.white }}>{weeks} semaines de préparation</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>Programme complet · Premium</div>
            </div>
          </div>
          <Zap size={18} color={G.gold} />
        </div>
      )}
      <Btn onClick={onNext} disabled={!value}>Continuer</Btn>
      <button onClick={onBack} style={{ width: "100%", marginTop: 10, padding: "12px", background: "none", border: "none", color: G.grey, cursor: "pointer", fontSize: 14 }}>← Retour</button>
    </div>
  );
};

const Step3_Level = ({ value, onChange, pool, onPoolChange, onNext, onBack }) => (
  <div className="fade-up">
    <p style={{ fontSize: 12, fontWeight: 600, color: G.grey, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Étape 3 sur 4</p>
    <h2 style={{ fontSize: 30, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: G.ink, marginBottom: 6, lineHeight: 1.1 }}>Ton niveau<br />de natation ?</h2>
    <p style={{ color: G.grey, fontSize: 15, marginBottom: 24 }}>Sois honnête — le plan sera meilleur.</p>
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
      {LEVELS.map(l => (
        <button key={l.id} onClick={() => onChange(l.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: 14, border: `2px solid ${value === l.id ? G.ink : G.greyLight}`, background: value === l.id ? G.ink : G.white, cursor: "pointer", transition: "all 0.2s" }}>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: value === l.id ? G.white : G.ink }}>{l.label}</div>
            <div style={{ fontSize: 12, color: value === l.id ? "rgba(255,255,255,0.55)" : G.grey }}>{l.desc}</div>
          </div>
          {value === l.id && <Check size={16} color={G.white} />}
        </button>
      ))}
    </div>
    <div style={{ marginBottom: 28 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: G.grey, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Ton bassin habituel</p>
      <div style={{ display: "flex", gap: 10 }}>
        {POOLS.map(p => (
          <button key={p.id} onClick={() => onPoolChange(p.id)} style={{ flex: 1, padding: "14px", borderRadius: 12, border: `2px solid ${pool === p.id ? G.ink : G.greyLight}`, background: pool === p.id ? G.ink : G.white, color: pool === p.id ? G.white : G.ink, fontSize: 16, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>{p.label}</button>
        ))}
      </div>
    </div>
    <Btn onClick={onNext} disabled={!value}>Continuer</Btn>
    <button onClick={onBack} style={{ width: "100%", marginTop: 10, padding: "12px", background: "none", border: "none", color: G.grey, cursor: "pointer", fontSize: 14 }}>← Retour</button>
  </div>
);

const Step4_Frequency = ({ value, onChange, onNext, onBack }) => (
  <div className="fade-up">
    <p style={{ fontSize: 12, fontWeight: 600, color: G.grey, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Étape 4 sur 4</p>
    <h2 style={{ fontSize: 30, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: G.ink, marginBottom: 6, lineHeight: 1.1 }}>Séances<br />par semaine ?</h2>
    <p style={{ color: G.grey, fontSize: 15, marginBottom: 28 }}>On s'adapte à ta vie, pas l'inverse.</p>
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
      {FREQUENCIES.map(f => (
        <button key={f.id} onClick={() => onChange(f.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderRadius: 14, border: `2px solid ${value === f.id ? G.blue : G.greyLight}`, background: value === f.id ? G.blue : G.white, cursor: "pointer", transition: "all 0.2s" }}>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: value === f.id ? G.white : G.ink }}>{f.label}</div>
            <div style={{ fontSize: 12, color: value === f.id ? "rgba(255,255,255,0.65)" : G.grey }}>{f.desc}</div>
          </div>
          {value === f.id && <Check size={16} color={G.white} />}
        </button>
      ))}
    </div>
    <Btn variant="blue" onClick={onNext} disabled={!value}>Générer mon plan</Btn>
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
const FREE_WEEKS_LIMIT = 5;

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
  const saving = isAnnual ? "Économise 33%" : null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="scale-in" style={{ background: G.white, borderRadius: "24px 24px 0 0", padding: "28px 20px", paddingBottom: "max(28px, env(safe-area-inset-bottom))", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: G.greyLight, margin: "0 auto 24px" }} />
        <div style={{ background: "linear-gradient(135deg, #0D1117 0%, #001966 100%)", borderRadius: 20, padding: "24px 20px", marginBottom: 20, textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <Zap size={28} color={G.gold} />
          </div>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: G.white, marginBottom: 8 }}>MySWYM Premium</h3>
          {weeksBlocked
            ? <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>Tu as accès aux <span style={{ color: G.water, fontWeight: 600 }}>{FREE_WEEKS_LIMIT} premières semaines gratuites</span>.<br />Passe premium pour débloquer la suite.</p>
            : <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>Entraîne-toi sans limites</p>}
        </div>

        {/* Toggle mensuel / annuel */}
        <div style={{ display: "flex", background: G.greyXLight, borderRadius: 12, padding: 4, marginBottom: 16, gap: 4 }}>
          {["monthly", "annual"].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: period === p ? G.white : "transparent", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13, color: period === p ? G.ink : G.grey, cursor: "pointer", boxShadow: period === p ? "0 1px 4px rgba(0,0,0,0.1)" : "none", transition: "all 0.18s", position: "relative" }}>
              {p === "monthly" ? "Mensuel" : "Annuel"}
              {p === "annual" && <span style={{ position: "absolute", top: -8, right: 8, background: G.blue, color: G.white, fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 20 }}>-33%</span>}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {PREMIUM_FEATURES.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: G.greyXLight, borderRadius: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: G.blueLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><f.Icon size={16} color={G.blue} /></div>
              <div><div style={{ fontSize: 13, fontWeight: 600, color: G.ink }}>{f.label}</div><div style={{ fontSize: 11, color: G.grey }}>{f.desc}</div></div>
            </div>
          ))}
        </div>

        <div style={{ background: G.blueLight, borderRadius: 14, padding: "14px 16px", marginBottom: 16, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: G.blue, marginBottom: 2 }}>{monthlyPrice} <span style={{ fontSize: 15, fontWeight: 500 }}>/ mois</span></div>
          <div style={{ fontSize: 12, color: G.blue }}>{isAnnual ? `Facturé ${totalLabel} · Annulable à tout moment` : "Annulable à tout moment"}</div>
          {saving && <div style={{ marginTop: 6, display: "inline-block", background: G.blue, color: G.white, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{saving} vs mensuel</div>}
        </div>

        {err && <div style={{ background: "#FFE8E8", borderRadius: 10, padding: "10px 14px", marginBottom: 12, color: "#CC0000", fontSize: 13 }}>{err}</div>}
        <Btn variant="blue" onClick={handleCheckout} disabled={loading}>{loading ? "Redirection…" : `Démarrer — ${totalLabel}`}</Btn>
        <button onClick={onClose} style={{ width: "100%", marginTop: 10, padding: "12px", background: "none", border: "none", color: G.grey, cursor: "pointer", fontSize: 13 }}>Continuer en gratuit</button>
      </div>
    </div>
  );
};

const PremiumTeaser = ({ onUpgrade }) => (
  <div style={{ margin: "6px 0 10px", borderRadius: 18, overflow: "hidden", border: `1.5px solid ${G.blue}20` }}>
    <div style={{ background: "linear-gradient(135deg, #0D1117 0%, #001966 100%)", padding: "22px 20px", textAlign: "center" }}>
      <Waves size={28} color="rgba(255,255,255,0.25)" style={{ marginBottom: 10 }} />
      <div style={{ fontSize: 20, fontWeight: 800, color: G.white, fontFamily: "'Syne', sans-serif", marginBottom: 6 }}>Tu veux continuer ?</div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 18, lineHeight: 1.5 }}>La suite de ton programme est prête.<br />Passe premium pour tout débloquer.</div>
      <button onClick={onUpgrade} style={{ background: G.white, border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 700, color: G.blue, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
        <Zap size={15} color={G.blue} /> Passer premium
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
    <div style={{ background: done ? G.greyXLight : G.white, borderRadius: 16, padding: "16px", border: `1px solid ${done ? G.greyLight : "#E8E8E8"}`, opacity: done ? 0.75 : 1, transition: "all 0.3s", boxShadow: done ? "none" : "0 2px 8px rgba(0,0,0,0.04)" }}>
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
const PlanTab = ({ plan, profile, isPremium, onComplete, onShare, onReset, onUpgrade }) => {
  const visibleWeeks = isPremium ? plan.weeks : plan.weeks.slice(0, FREE_WEEKS_LIMIT);
  const currentWeek = visibleWeeks.findIndex(w => !w.sessions.every(s => s.completed));
  const isLocked = !isPremium && plan.totalRealWeeks > FREE_WEEKS_LIMIT;
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
        <button onClick={onReset} style={{ width: "100%", marginTop: 8, padding: "14px", background: "none", border: `1px solid ${G.greyLight}`, borderRadius: 12, color: G.grey, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <RotateCcw size={14} color={G.greyMid} /> Recommencer l'onboarding
        </button>
      </div>
    </div>
  );
};

// ── DASHBOARD ──────────────────────────────────────────────────────────────
const Dashboard = ({ plan, profile, onTabChange, onComplete, onShare, onSignOut }) => {
  const goal = GOALS.find(g => g.id === profile.goal);
  const stats = computeStats(plan);
  const currentWeekIndex = plan.weeks.findIndex(w => !w.sessions.every(s => s.completed));
  const currentWeek = currentWeekIndex >= 0 ? plan.weeks[currentWeekIndex] : null;
  const nextSession = currentWeek?.sessions.find(s => !s.completed);
  const nextSessionIndex = currentWeek?.sessions.findIndex(s => !s.completed);
  const weekDone = currentWeek?.sessions.filter(s => s.completed).length ?? 0;
  const weekTotal = currentWeek?.sessions.length ?? 0;
  const daysToEvent = profile.eventDate ? Math.max(0, Math.ceil((new Date(profile.eventDate) - new Date()) / 86400000)) : null;
  const tm = nextSession ? (TYPE_META[nextSession.type] || TYPE_META.ENDURANCE) : null;

  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ background: "linear-gradient(140deg, #0D1117 0%, #001966 100%)", padding: "52px 20px 28px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(0,87,255,0.10)" }} />
        <div style={{ position: "absolute", top: 20, right: 60, width: 110, height: 110, borderRadius: "50%", background: "rgba(0,180,216,0.07)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, position: "relative" }}>
          <div>
            <div className="fade-up" style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", letterSpacing: 1, marginBottom: 4 }}>Programme en cours</div>
            <h1 className="fade-up-1" style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: G.white, lineHeight: 1.1 }}>{goal?.label}</h1>
            {daysToEvent !== null && <p className="fade-up-2" style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 2 }}>J−{daysToEvent}</p>}
          </div>
          <button onClick={onSignOut} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 10, padding: "8px 12px", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <LogOut size={14} color="rgba(255,255,255,0.5)" />
          </button>
        </div>
        <div className="fade-up-3" style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
          <Ring value={weekTotal > 0 ? weekDone / weekTotal : 1} size={72} stroke={7} color={G.water} label={`${weekDone}/${weekTotal}`} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>CETTE SEMAINE</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: G.white }}>{currentWeek?.focus ?? "Plan terminé"}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: G.white }}>{(stats.totalMeters / 1000).toFixed(1)}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: 0.5 }}>KM NAGÉS</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 16px 0" }}>
        {!nextSession && stats.totalSessions > 0 && stats.totalSessions >= stats.planTotal && (
          <div className="fade-up" style={{ background: `linear-gradient(135deg, ${G.gold} 0%, #FF8C00 100%)`, borderRadius: 20, padding: 24, textAlign: "center", marginBottom: 20 }}>
            <Trophy size={48} color={G.white} style={{ margin: "0 auto 12px" }} />
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: G.white, marginBottom: 6 }}>Plan terminé !</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>Programme complété à 100 %. Bravo !</p>
          </div>
        )}

        {nextSession && tm && (
          <div className="fade-up">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 800, color: G.ink }}>Prochaine séance</h2>
              <button onClick={() => onTabChange("plan")} style={{ background: "none", border: "none", fontSize: 13, color: G.blue, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                Tout voir <ArrowRight size={12} color={G.blue} />
              </button>
            </div>
            <div style={{ background: G.white, borderRadius: 18, padding: 20, border: `1px solid ${G.greyLight}`, boxShadow: "0 4px 16px rgba(0,0,0,0.06)", marginBottom: 20 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: tm.bg, borderRadius: 20, padding: "4px 12px", marginBottom: 12 }}>
                <tm.Icon size={10} color={tm.color} />
                <span style={{ fontSize: 10, fontWeight: 700, color: tm.color, letterSpacing: 1, textTransform: "uppercase" }}>{nextSession.type}</span>
              </div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: G.ink, marginBottom: 14 }}>{nextSession.title}</div>
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                {[{ Icon: Ruler, val: nextSession.distance }, { Icon: Timer, val: formatDuration(nextSession.duration) }, { Icon: Gauge, val: nextSession.intensity }].map(({ Icon: I, val }, i) => (
                  <div key={i} style={{ flex: 1, background: G.greyXLight, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                    <I size={16} color={G.grey} style={{ margin: "0 auto 4px" }} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: G.ink }}>{val}</div>
                  </div>
                ))}
              </div>
              <Btn variant="blue" onClick={() => onComplete(currentWeekIndex, nextSessionIndex)}>Marquer comme faite</Btn>
            </div>
          </div>
        )}

        <div className="fade-up-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <StatPill icon={Flame} value={stats.streak} label="Série max" color={G.coral} bg={G.coralLight} />
          <StatPill icon={Star}  value={stats.perfectWeeks} label="Semaines parfaites" color={G.gold} bg={G.goldLight} />
        </div>

        <div className="fade-up-2" style={{ background: G.white, borderRadius: 18, padding: 18, border: `1px solid ${G.greyLight}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: G.ink }}>Progression globale</span>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: G.blue }}>
              {stats.planTotal > 0 ? Math.round(stats.totalSessions / stats.planTotal * 100) : 0}%
            </span>
          </div>
          <div style={{ height: 8, background: G.greyLight, borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 4, width: `${stats.planTotal > 0 ? stats.totalSessions / stats.planTotal * 100 : 0}%`, background: `linear-gradient(90deg, ${G.blue} 0%, ${G.water} 100%)`, transition: "width 0.8s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <span style={{ fontSize: 12, color: G.grey }}>{stats.totalSessions} séances faites</span>
            <span style={{ fontSize: 12, color: G.grey }}>{stats.planTotal - stats.totalSessions} restantes</span>
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
      <div style={{ background: "linear-gradient(140deg, #0D1117 0%, #001966 100%)", padding: "52px 20px 28px" }}>
        <div className="fade-up" style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", letterSpacing: 1, marginBottom: 4 }}>Tes performances</div>
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
      <div style={{ background: "linear-gradient(140deg, #0D1117 0%, #001966 100%)", padding: "52px 20px 28px" }}>
        <div className="fade-up" style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", letterSpacing: 1, marginBottom: 4 }}>Tes récompenses</div>
        <h1 className="fade-up-1" style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: G.white, marginBottom: 4 }}>Badges</h1>
        <p className="fade-up-2" style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>{earned.length}/{BADGE_DEFS.length} débloqués</p>
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

// pace100[lvl][zone] = secondes aux 100m (beginner/intermediate/advanced × easy/threshold/sprint)
const PACE = {
  easy:      [170, 130, 105],
  threshold: [155, 112,  90],
  sprint:    [140,  95,  75],
};
// Departure interval: swim time + rest, rounded up to 5s
const di = (meters, lvl, zone = 'easy') => {
  const rest  = zone === 'sprint' ? 90 : zone === 'threshold' ? 15 : 20;
  const secs  = Math.ceil((meters * PACE[zone][lvl] / 100 + rest) / 5) * 5;
  return `${Math.floor(secs / 60)}'${(secs % 60).toString().padStart(2, '0')}`;
};
// Round to nearest pool-length multiple, min 1 length
const snap = (d, P) => Math.max(P, Math.round(d / P) * P);

const SESSION_TEMPLATES = {

  // ── ENDURANCE ────────────────────────────────────────────────────────────
  endurance: (dist, pool, level = "intermediate", weekIdx = 0) => {
    const isBeg = level === "beginner", isAdv = level === "advanced";
    const P = pool, lvl = isBeg ? 0 : isAdv ? 2 : 1, v = weekIdx % 3;

    const WARM = 300, COOL = 200, avail = dist - WARM - COOL;

    const repM = isBeg ? 2*P : Math.min(isAdv ? 4*P : 3*P, 300);
    const nM   = Math.max(2, Math.min(12, Math.floor(avail * 0.7 / repM)));
    const nS   = Math.min(8, Math.max(2, Math.round(Math.max(0, avail - nM*repM) / (2*P))));
    const repS = 2*P;

    const pyMax = isBeg ? 2*P : Math.min(isAdv ? 3*P : 2*P, 300);
    const pyUp = [], pyDn = [];
    for (let d = P; d <= pyMax; d += P) { pyUp.push(d); if (d < pyMax) pyDn.unshift(d); }
    const pyAll = [...pyUp, ...pyDn];
    const pyFill = Math.min(8, Math.max(2, Math.round(Math.max(0, avail - pyAll.reduce((a,b)=>a+b,0)) / (2*P))));

    return {
      type: "ENDURANCE",
      ...[
        {
          title: isBeg ? "Séries fondamentales" : "Fond en séries",
          intensity: "Z1/Z2 — allure conversation",
          details: [
            `Échauffement : 200m NL progressif + 100m battements de jambes`,
            `${nM}×${repM}m NL — D${di(repM,lvl,'easy')} — rythme régulier, respiration tous les 3 temps`,
            `${nS}×${repS}m pull-buoy — R20" — bras seuls, coude haut`,
            `Retour au calme : 200m dos lent`,
          ],
        },
        {
          title: "Pyramide aérobie",
          intensity: "Z1/Z2 — régulier de bout en bout",
          details: [
            `Échauffement : 200m NL + 100m battements de jambes`,
            `Pyramide : ${pyAll.join('–')}m NL — R15" entre paliers — allure régulière`,
            `${pyFill}×${repS}m pull-buoy — R20"`,
            `Retour au calme : 200m dos lent`,
          ],
        },
        {
          title: "Séries progressives",
          intensity: "Z1→Z2 — 2–3s de mieux à chaque rep",
          details: [
            `Échauffement : 200m NL + 100m battements de jambes`,
            `${nM}×${repM}m NL — D${di(repM,lvl,'easy')} — chaque rep légèrement plus rapide`,
            `${nS}×${repS}m battements de jambes planche — R20"`,
            `Retour au calme : 200m dos lent`,
          ],
        },
      ][v],
    };
  },

  // ── SEUIL ────────────────────────────────────────────────────────────────
  seuil: (dist, pool, level = "intermediate", weekIdx = 0) => {
    const isBeg = level === "beginner", isAdv = level === "advanced";
    const P = pool, lvl = isBeg ? 0 : isAdv ? 2 : 1, v = weekIdx % 3;

    const WARM = 300, COOL = 200, avail = dist - WARM - COOL;

    const cssRep = isBeg ? 2*P : Math.min(isAdv ? 4*P : 3*P, 200);
    const nCSS   = Math.max(4, Math.min(10, Math.floor(avail * 0.65 / cssRep)));
    const nFin   = Math.min(8, Math.max(2, Math.round(Math.max(0, avail - nCSS*cssRep) / (2*P))));

    const pyStep = isBeg ? P : Math.min(2*P, 100);
    const pyMax  = pyStep * (isBeg ? 3 : 4);
    const pyUp = [], pyDn = [];
    for (let d = pyStep; d <= pyMax; d += pyStep) { pyUp.push(d); if (d < pyMax) pyDn.unshift(d); }
    const pyAll  = [...pyUp, ...pyDn];
    const pyFill = Math.min(8, Math.max(2, Math.round(Math.max(0, avail - pyAll.reduce((a,b)=>a+b,0)) / (2*P))));

    const tRep    = isBeg ? 2*P : Math.min(isAdv ? 4*P : 3*P, 200);
    const nT      = Math.max(3, Math.min(8, Math.floor(avail * 0.6 / tRep)));
    const nSprint = Math.min(8, Math.max(2, Math.round(Math.max(0, avail - nT*tRep) / (2*P))));

    return {
      type: "SEUIL",
      ...[
        {
          title: isBeg ? "Intervalles réguliers" : "CSS — allure critique",
          intensity: "Z3 — effort soutenu et constant",
          details: [
            `Échauffement : 200m NL progressif + 100m battements de jambes`,
            `${nCSS}×${cssRep}m NL — D${di(cssRep,lvl,'threshold')} — allure 1 500 m, régularité absolue`,
            `${nFin}×${2*P}m battements de jambes — R20"`,
            `Retour au calme : 200m dos lent`,
          ],
        },
        {
          title: "Pyramide seuil",
          intensity: "Z3/Z4 — intensité croissante puis décroissante",
          details: [
            `Échauffement : 200m NL + 100m battements de jambes`,
            `Pyramide seuil : ${pyAll.join('–')}m NL — R20" entre paliers — allure seuil`,
            `${pyFill}×${2*P}m NL — R15" — allure récup`,
            `Retour au calme : 200m dos lent`,
          ],
        },
        {
          title: "Blocs T-pace",
          intensity: "Z4 — inconfortable et régulier",
          details: [
            `Échauffement : 200m NL + 100m battements de jambes`,
            `${nT}×${tRep}m NL — D${di(tRep,lvl,'threshold')} — allure course 400 m`,
            `${nSprint}×${2*P}m NL — R20" — sprint à 90 %, effort court`,
            `Retour au calme : 200m dos lent`,
          ],
        },
      ][v],
    };
  },

  // ── VITESSE ──────────────────────────────────────────────────────────────
  vitesse: (dist, pool, level = "intermediate", weekIdx = 0) => {
    const isBeg = level === "beginner", isAdv = level === "advanced";
    const P = pool, lvl = isBeg ? 0 : isAdv ? 2 : 1, v = weekIdx % 4;

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
            `Échauffement : 200m NL progressif + 100m battements de jambes`,
            `6×12m coulées — torpille gainée, flèche max en apnée`,
            `${nSpr}×${P}m SPRINT MAX — ${recSpr} — qualité absolue`,
            `${nSec}×${2*P}m pull-buoy — R20" — récup active`,
            `Retour au calme : 200m dos lent`,
          ],
        },
        {
          title: "Puissance palettes",
          intensity: "Z5 — puissance de bras",
          details: [
            `Échauffement : 200m NL + 100m battements de jambes`,
            `${nPal}×${palRep}m palettes + pull-buoy — R20" — coude haut, pression max`,
            `${nSp2}×${P}m SPRINT mains nues — ${recSpr} — reproduis la prise d'eau`,
            `${nKick}×${2*P}m battements de jambes — R20" — fouet des chevilles`,
            `Retour au calme : 200m dos lent`,
          ],
        },
        {
          title: "Accélérations construites",
          intensity: "Z4→Z5 — montée en puissance",
          details: [
            `Échauffement : 200m NL progressif + 100m battements de jambes`,
            `4×12m coulées — corps aligné, flèche max après poussée`,
            `${nBuild}×${buildRep}m NL — D${di(buildRep,lvl,'threshold')} — 1re moitié Z2, finir à 95 %`,
            `${nKick2}×${2*P}m battements de jambes — R20" — fouet des chevilles`,
            `Retour au calme : 200m dos lent`,
          ],
        },
        {
          title: "Départs plongée & explosivité",
          intensity: "Z5/Z6 — explosivité maximale, récup complète",
          details: [
            `Échauffement : 200m NL progressif + 100m battements de jambes + 4×${P}m accélérations`,
            `6×10m départ plongée — R2' — bloc → torpille gainée → 3 premières brasses à fond, stop`,
            `${nDive}×${P}m SPRINT à bloc — R2' — départ plongée complet, effort total sur chaque longueur`,
            `${nRec}×${2*P}m pull-buoy — R20" — récup active`,
            `Retour au calme : 200m dos lent`,
          ],
        },
      ][v],
    };
  },

  // ── TECHNIQUE ────────────────────────────────────────────────────────────
  technique: (dist, pool, level = "intermediate", weekIdx = 0) => {
    const isBeg = level === "beginner", isAdv = level === "advanced";
    const P = pool, lvl = isBeg ? 0 : isAdv ? 2 : 1, v = weekIdx % 4;

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
              `${nPerBlock}×${repR}m battements planche — R10" — corps horizontal, talons à la surface`,
              `${nPerBlock}×${repR}m pull-buoy — R10" — bras seuls, sens l'appui des épaules`,
              `${nInteg}×${repR}m NL complet — R10" — coordonne jambes et bras`,
              `Retour au calme :${repR}m dos lent`,
            ],
          },
          {
            title: "Fist drill — sentir l'eau",
            intensity: "Facile — ressentir l'avant-bras",
            details: [
              `Échauffement : ${repR}m NL lent + ${repR}m dos lent`,
              `${nPerBlock}×${repR}m fist drill — R10" — poings fermés, l'avant-bras accroche l'eau`,
              `${nPerBlock}×${repR}m mains ouvertes — R10" — ressens le grip retrouvé`,
              `${nInteg}×${repR}m NL complet — R10" — garde la sensation de prise profonde`,
              `Retour au calme :${repR}m dos lent`,
            ],
          },
          {
            title: "Respiration bilatérale",
            intensity: "Facile — coordination respiratoire",
            details: [
              `Échauffement : ${repR}m NL lent + ${repR}m battements planche`,
              `${nPerBlock}×${repR}m NL resp. 3 temps — R10" — inspire droite, puis gauche`,
              `${nPerBlock}×${repR}m brasse lente — R10" — expire sous l'eau, glisse 2s`,
              `${nInteg}×${repR}m NL — R10" — respiration 3 temps en continu`,
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
              `${nInteg}×${repR}m NL — R10" — focus glisse après chaque virage`,
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
            `${nPerBlock}×${repR}m catch-up drill — R10" — bras tendu devant, attend la main adverse`,
            `${nPerBlock}×${repR}m DPS comptage — R10" — vise ${cycleTarget} cycles/longueur`,
            `${nInteg}×${repR}m NL — D${di(repR,lvl,'easy')} — réduis d'1 cycle/longueur vs ta normale`,
            `Retour au calme :${repR}m dos lent`,
          ],
        },
        {
          title: "Fist drill & prise d'eau",
          intensity: "Faible — qualité de la prise",
          details: [
            `Échauffement : ${repR}m NL + ${repR}m battements planche`,
            `${nPerBlock}×${repR}m fist drill — R10" — poings fermés, accroche avec l'avant-bras`,
            `${nPerBlock}×${repR}m finger drag — R10" — doigts sur l'eau au retour, coude haut`,
            `${nInteg}×${repR}m NL — D${di(repR,lvl,'easy')} — prise profonde, tirage sous l'axe`,
            `Retour au calme :${repR}m dos lent`,
          ],
        },
        {
          title: "6-kick drill & rotation",
          intensity: "Faible — alignement et rotation",
          details: [
            `Échauffement : ${repR}m NL + ${repR}m battements planche`,
            `${nPerBlock}×${repR}m 6-kick drill — R10" — 6 battements sur le côté, rotation consciente`,
            `${nPerBlock}×${repR}m rotation exagérée — R10" — épaule entre en premier, sur-exagère`,
            `${nInteg}×${repR}m NL — D${di(repR,lvl,'easy')} — vise ${cycleTarget} cycles/longueur`,
            `Retour au calme :${repR}m dos lent`,
          ],
        },
        {
          title: "Virages & coulées",
          intensity: "Faible — travail des virages",
          details: [
            `Échauffement : ${repR}m NL + ${repR}m battements planche`,
            `${nPerBlock}×${repR}m coulées — R10" — flèche max gainée avant le 1er bras`,
            `${nPerBlock}×${repR}m flip turns — R15" — focus culbute, poussée et flèche`,
            `${nInteg}×${repR}m NL — D${di(repR,lvl,'easy')} — chaque virage = relance d'élan`,
            `Retour au calme :${repR}m dos lent`,
          ],
        },
      ][v],
    };
  },

  // ── BNSSA ────────────────────────────────────────────────────────────────
  bnssa: (dist, pool, level = "intermediate", weekIdx = 0) => {
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
  récupération: (dist, pool, level = "intermediate", weekIdx = 0) => {
    const isBeg = level === "beginner";
    const P = pool, v = weekIdx % 2;
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
              `${nA}×${repR}m NL libre — R10" — brasse, dos ou crawl : si tu souffles c'est trop vite`,
              `${nB}×${repR}m dos crawlé — R10" — bras tendus, regard au plafond`,
              `${nC}×${repR}m brasse très lente — R10" — expire sous l'eau, glisse 2s`,
              `Fin : flotte 2 min en étoile sur le dos`,
            ],
          },
          {
            title: "Dos & respiration",
            intensity: "Très facile",
            details: [
              `${nA}×${repR}m dos crawlé — R10" — jambes molles, pense à flotter`,
              `${nB}×${repR}m brasse lente — R10" — expire longuement sous l'eau`,
              `${nC}×${repR}m NL lent — R10" — 1 long. resp 2 temps / 1 long. resp 3 temps`,
              `Fin : flotte 2 min en étoile sur le dos`,
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
            `${nD}×${repR}m brasse — R10" — expire complètement, glisse 3s`,
          ],
        },
        {
          title: "Sculling & relâchement",
          intensity: "Z1 — ressentir l'eau",
          details: [
            `${nA}×${P}m sculling — R10" — mains en 'figure 8', sens la portance`,
            `${nB}×${repR}m dos lent — R10" — jambes molles, récupère mentalement`,
            `${nC}×${repR}m NL lent — R10" — méditation active, compte les longueurs`,
            `${nD}×${repR}m brasse ultra-lente — R10" — glisse 3s entre cycles`,
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
  const wellness = isWellnessGoal(goal);

  let rawWeeks;
  if (wellness) {
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
  const phaseList = wellness ? buildWellnessPhases(totalWeeks) : buildPlanPhases(totalWeeks);
  const patterns = wellness ? WELLNESS_PATTERNS : goal === "bnssa" ? BNSSA_PATTERNS : PHASE_PATTERNS;
  const f = Math.min(freq, 4);
  const weeks = phaseList.map((phase, wi) => {
    const types = patterns[phase.phase]?.[f] || patterns.base[f] || ["endurance"];
    return {
      number: wi + 1, focus: phase.focus, tip: TIPS[phase.tipKey], feedback: null,
      sessions: types.map((type, si) => {
        const distBase = Math.round(baseDist[type] * phase.progression / 50) * 50;
        return { ...SESSION_TEMPLATES[type](distBase, pool, level, wi * 10 + si), distance: `${distBase}m`, duration: Math.max(30, Math.min(120, Math.round(distBase / 38))), completed: false };
      }),
    };
  });
  return { weeks, totalRealWeeks: rawWeeks, isPremium };
};

// ── APP ───────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [screen, setScreen] = useState("onboarding");
  const [activeTab, setActiveTab] = useState("home");
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({ goal: "", eventDate: "", level: "", pool: 50, sessionsPerWeek: null, weightCurrent: "", weightGoal: "" });
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);
  const [feedbackWeek, setFeedbackWeek] = useState(null);
  const [shareSession, setShareSession] = useState(null);
  const [newBadgeId, setNewBadgeId] = useState(null);
  const [toast, setToast] = useState(null);
  const prevBadgesRef = useRef([]);

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

  // Régénère le plan quand le premium est débloqué et que le plan était limité
  useEffect(() => {
    if (isPremium && plan && profile.goal && plan.totalRealWeeks > plan.weeks.length) {
      setScreen("loading");
      generatePlan(profile, true).then(newPlan => {
        setPlan(newPlan);
        setScreen("app");
        setActiveTab("home");
      });
    }
  }, [isPremium, plan?.weeks?.length]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setIsPremium(checkIsPremium(u));
      if (u) { loadUserData(u.id, checkIsPremium(u)).finally(() => setAuthLoading(false)); }
      else { setScreen("onboarding"); setStep(1); setProfile({ goal: "", eventDate: "", level: "", pool: 50, sessionsPerWeek: null, weightCurrent: "", weightGoal: "" }); setPlan(null); setAuthLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId, userIsPremium = false) => {
    const enforceFreeLimit = (p) => {
      if (userIsPremium || !p?.weeks) return p;
      return { ...p, weeks: p.weeks.slice(0, FREE_WEEKS_LIMIT) };
    };
    try {
      const { data, error } = await supabase.from("user_plans").select("profile, plan").eq("user_id", userId).single();
      if (data && !error && data.profile && data.plan) {
        setProfile(data.profile); setPlan(enforceFreeLimit(data.plan)); setScreen("app"); return;
      }
    } catch {}
    try {
      const sp = localStorage.getItem(`myswym_profile_${userId}`);
      const spl = localStorage.getItem(`myswym_plan_${userId}`);
      if (sp && spl) { setProfile(JSON.parse(sp)); setPlan(enforceFreeLimit(JSON.parse(spl))); setScreen("app"); }
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
    if (plan && profile.goal && user) {
      try {
        localStorage.setItem(`myswym_profile_${user.id}`, JSON.stringify(profile));
        localStorage.setItem(`myswym_plan_${user.id}`, JSON.stringify(plan));
      } catch {}
      supabase.from("user_plans").upsert({ user_id: user.id, profile, plan, updated_at: new Date().toISOString() }, { onConflict: "user_id" }).then(() => {});
    }
  }, [plan, profile, user]);


  useEffect(() => {
    if (!plan) return;
    const stats = computeStats(plan);
    const current = checkBadges(stats);
    const prev = prevBadgesRef.current;
    const newOnes = current.filter(b => !prev.includes(b));
    if (newOnes.length > 0 && prev.length > 0) { setNewBadgeId(newOnes[0]); setTimeout(() => setNewBadgeId(null), 3200); }
    prevBadgesRef.current = current;
  }, [plan]);

  const update = (key, val) => setProfile(p => ({ ...p, [key]: val }));

  const handleGenerate = async () => {
    setScreen("loading"); setError(null);
    try {
      const p = await generatePlan(profile, isPremium);
      setPlan(p); setScreen("app"); setActiveTab("home");
      if (!isPremium && p.totalRealWeeks > FREE_WEEKS_LIMIT) setTimeout(() => setShowUpgrade(true), 1200);
    } catch {
      setError("Impossible de générer le plan. Réessaie !");
      setScreen("onboarding"); setStep(isWellnessGoal(profile.goal) ? 3 : 4);
    }
  };

  const handleComplete = (weekIndex, sessionIndex) => {
    setPlan(prev => {
      const next = { ...prev, weeks: prev.weeks.map((w, wi) => wi !== weekIndex ? w : { ...w, sessions: w.sessions.map((s, si) => si !== sessionIndex ? s : { ...s, completed: !s.completed }) }) };
      const updatedWeek = next.weeks[weekIndex];
      if (updatedWeek.sessions.every(s => s.completed) && !updatedWeek.feedback) setTimeout(() => setFeedbackWeek(weekIndex), 700);
      return next;
    });
  };

  const handleFeedback = (rating) => {
    if (feedbackWeek === null) return;
    setPlan(prev => adjustPlan(prev, feedbackWeek, rating));
    setFeedbackWeek(null);
  };

  const handleReset = () => {
    if (user) { localStorage.removeItem(`myswym_profile_${user.id}`); localStorage.removeItem(`myswym_plan_${user.id}`); supabase.from("user_plans").delete().eq("user_id", user.id).then(() => {}); }
    setScreen("onboarding"); setStep(1);
    setProfile({ goal: "", eventDate: "", level: "", pool: 50, sessionsPerWeek: null, weightCurrent: "", weightGoal: "" });
    setPlan(null); prevBadgesRef.current = [];
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

  const goal = GOALS.find(g => g.id === profile.goal);
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
                {isPremium && (
                  <button onClick={handlePortal} style={{ background: "none", border: `1px solid ${G.blue}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, color: G.blue, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    <Zap size={12} color={G.blue} /> Abonnement
                  </button>
                )}
                <button onClick={handleSignOut} style={{ background: "none", border: `1px solid ${G.greyLight}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, color: G.grey, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  <LogOut size={12} color={G.grey} /> Déco.
                </button>
              </div>
            </div>
            {(() => {
              const wellness = isWellnessGoal(profile.goal);
              const hasWeight = profile.goal === "perte_de_poids";
              const totalSteps = wellness ? (hasWeight ? 4 : 3) : 4;
              const stepMap = wellness
                ? hasWeight
                  ? { 1: "goal", 2: "weight", 3: "level", 4: "freq" }
                  : { 1: "goal", 2: "level", 3: "freq" }
                : { 1: "goal", 2: "date", 3: "level", 4: "freq" };
              const current = stepMap[step];
              return (
                <>
                  <Progress step={step} total={totalSteps} />
                  {error && <div style={{ background: "#FFE8E8", borderRadius: 10, padding: "10px 14px", marginBottom: 16, color: "#CC0000", fontSize: 13 }}>{error}</div>}
                  {current === "goal" && <Step1_Goal value={profile.goal} onChange={v => { update("goal", v); }} onNext={() => setStep(2)} />}
                  {current === "weight" && <StepWeight weightCurrent={profile.weightCurrent} weightGoal={profile.weightGoal} onChangeCurrent={v => update("weightCurrent", v)} onChangeGoal={v => update("weightGoal", v)} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
                  {current === "date" && <Step2_Date value={profile.eventDate} onChange={v => update("eventDate", v)} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
                  {current === "level" && <Step3_Level value={profile.level} onChange={v => update("level", v)} pool={profile.pool} onPoolChange={v => update("pool", v)} onNext={() => setStep(step + 1)} onBack={() => setStep(step - 1)} />}
                  {current === "freq" && <Step4_Frequency value={profile.sessionsPerWeek} onChange={v => update("sessionsPerWeek", v)} onNext={handleGenerate} onBack={() => setStep(step - 1)} />}
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
        {activeTab === "home"    && <Dashboard   plan={plan} profile={profile} onTabChange={setActiveTab} onComplete={handleComplete} onShare={s => setShareSession(s)} onSignOut={handleSignOut} />}
        {activeTab === "plan"    && <PlanTab    plan={plan} profile={profile} isPremium={isPremium} onComplete={handleComplete} onShare={s => setShareSession(s)} onReset={handleReset} onUpgrade={() => setShowUpgrade(true)} />}
        {activeTab === "profile" && <ProfileTab plan={plan} user={user} isPremium={isPremium} onSignOut={handleSignOut} onPortal={handlePortal} onUpgrade={() => setShowUpgrade(true)} onRefreshStatus={handleRefreshStatus} />}

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
