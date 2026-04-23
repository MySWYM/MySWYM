import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";
import {
  Waves, Flame, Star, Calendar, BarChart2, Award, Home,
  Ruler, Clock, Zap, Check, Lock, Trophy, Target,
  ChevronDown, ChevronUp, LogOut, Activity, User,
  Droplets, TrendingUp, Timer, RotateCcw, ArrowRight, Gauge, Settings,
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
  { id: "remise_en_forme",   label: "Remise en forme",       dist: "8 semaines · progressif",      icon: <Flame size={20} />,    wellness: true  },
  { id: "perte_de_poids",    label: "Perte de poids",         dist: "Durée selon ton objectif",     icon: <Target size={20} />,   wellness: true  },
  { id: "reprendre",         label: "Reprendre la natation",  dist: "6 semaines · en douceur",      icon: <RotateCcw size={20} />, wellness: true },
  { id: "triathlon_sprint",  label: "Triathlon Sprint",       dist: "750 m nage",                   icon: <Activity size={20} />, wellness: false },
  { id: "triathlon_olympic", label: "Triathlon Olympique",    dist: "1 500 m nage",                 icon: <Activity size={20} />, wellness: false },
  { id: "open_water_5k",     label: "Eau libre 5 km",         dist: "5 km",                         icon: <Waves size={20} />,    wellness: false },
  { id: "open_water_10k",    label: "Eau libre 10 km",        dist: "10 km",                        icon: <Waves size={20} />,    wellness: false },
  { id: "competition_50m",   label: "Compétition piscine",    dist: "50–200 m",                     icon: <Zap size={20} />,      wellness: false },
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
  ctx.fillStyle = "rgba(255,255,255,0.88)"; ctx.font = "bold 34px sans-serif"; ctx.fillText("AquaPlan", 80, 126);
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
  ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.font = "400 22px sans-serif"; ctx.fillText("aquatrack-iota-lyart.vercel.app", 80, 1016);
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

const ProfileTab = ({ user, isPremium, onSignOut, onPortal, onUpgrade }) => {
  const meta = user?.user_metadata || {};
  const [firstName, setFirstName] = useState(meta.first_name || "");
  const [lastName,  setLastName]  = useState(meta.last_name  || "");
  const [age,       setAge]       = useState(meta.age        || "");
  const [weight,    setWeight]    = useState(meta.weight     || "");
  const [email,     setEmail]     = useState(user?.email     || "");
  const [password,  setPassword]  = useState("");
  const [saving,    setSaving]    = useState(false);
  const [msg,       setMsg]       = useState(null);

  const inp = { width: "100%", padding: "13px 14px", borderRadius: 12, border: `1.5px solid ${G.greyLight}`, fontSize: 15, fontFamily: "'DM Sans', sans-serif", background: G.white, color: G.ink, outline: "none", boxSizing: "border-box" };
  const label = (txt) => <div style={{ fontSize: 11, fontWeight: 600, color: G.grey, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>{txt}</div>;

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      const updates = { user_metadata: { ...meta, first_name: firstName, last_name: lastName, age, weight } };
      if (email !== user?.email) updates.email = email;
      if (password) updates.password = password;
      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;
      setMsg({ type: "ok", text: "Profil mis à jour ✓" });
      setPassword("");
    } catch (e) { setMsg({ type: "err", text: e.message }); }
    finally { setSaving(false); }
  };

  const section = (title, children) => (
    <div style={{ background: G.white, borderRadius: 16, padding: "18px 16px", marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: G.grey, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: G.bg, paddingBottom: 100 }}>
      <div style={{ padding: "56px 20px 0" }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: G.ink, marginBottom: 24 }}>Mon profil</h2>

        {section("Identité",
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>{label("Prénom")}<input style={inp} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Prénom" /></div>
              <div style={{ flex: 1 }}>{label("Nom")}<input style={inp} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Nom" /></div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>{label("Âge")}<input style={inp} type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="Ans" /></div>
              <div style={{ flex: 1 }}>{label("Poids (kg)")}<input style={inp} type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="kg" /></div>
            </div>
          </div>
        )}

        {section("Compte",
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {label("Email")}<input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} />
            {label("Nouveau mot de passe")}<input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Laisser vide pour ne pas changer" />
          </div>
        )}

        {msg && <div style={{ background: msg.type === "ok" ? G.mintLight : "#FFE8E8", borderRadius: 10, padding: "10px 14px", marginBottom: 12, color: msg.type === "ok" ? "#00897B" : "#CC0000", fontSize: 13 }}>{msg.text}</div>}
        <Btn onClick={save} disabled={saving} variant="blue">{saving ? "Enregistrement…" : "Enregistrer les modifications"}</Btn>

        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {isPremium
            ? <button onClick={onPortal} style={{ width: "100%", padding: "14px", borderRadius: 12, border: `1.5px solid ${G.blue}`, background: G.blueLight, color: G.blue, fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Zap size={16} color={G.blue} /> Gérer mon abonnement
              </button>
            : <button onClick={onUpgrade} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #0D1117, #001966)", color: G.white, fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Zap size={16} color={G.gold} /> Passer en premium
              </button>
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
    { id: "stats",   Icon: BarChart2, label: "Stats" },
    { id: "badges",  Icon: Award,     label: "Badges" },
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
            {t.id === "badges" && newBadge && <div style={{ position: "absolute", top: 0, right: "calc(50% - 18px)", width: 8, height: 8, borderRadius: "50%", background: G.coral }} />}
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
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: G.ink }}>AquaPlan</span>
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
  return (
    <div className="fade-up">
      <p style={{ fontSize: 12, fontWeight: 600, color: G.grey, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Étape 2 sur 4</p>
      <h2 style={{ fontSize: 30, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: G.ink, marginBottom: 6, lineHeight: 1.1 }}>Date de<br />l'événement ?</h2>
      <p style={{ color: G.grey, fontSize: 15, marginBottom: 28 }}>On adapte le plan à ton calendrier.</p>
      <div style={{ background: G.white, borderRadius: 16, padding: 20, marginBottom: 14, border: `1px solid ${G.greyLight}` }}>
        <label style={{ fontSize: 11, color: G.grey, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Date</label>
        <input type="date" value={value} onChange={e => onChange(e.target.value)} min={new Date().toISOString().split("T")[0]}
          style={{ width: "100%", border: "none", fontSize: 22, fontFamily: "'Syne', sans-serif", fontWeight: 700, color: G.ink, background: "transparent", outline: "none" }} />
      </div>
      {weeks && (
        <div style={{ background: G.blueLight, borderRadius: 12, padding: "12px 16px", marginBottom: 28, display: "flex", alignItems: "center", gap: 10 }}>
          <Calendar size={18} color={G.blue} />
          <span style={{ fontSize: 14, color: G.blue, fontWeight: 500 }}>{weeks} semaines de préparation</span>
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
    link.download = "aquaplan-seance.png"; link.href = canvas.toDataURL("image/png"); link.click();
  };
  const handleShare = async () => {
    if (!navigator.share) { handleDownload(); return; }
    const canvas = createShareCanvas(session, goalLabel);
    canvas.toBlob(async (blob) => {
      try { await navigator.share({ files: [new File([blob], "aquaplan-seance.png", { type: "image/png" })], title: "Ma séance AquaPlan" }); }
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
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: G.white, marginBottom: 8 }}>AquaPlan Premium</h3>
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
const PlanTab = ({ plan, profile, onComplete, onShare, onReset, onUpgrade }) => {
  const currentWeek = plan.weeks.findIndex(w => !w.sessions.every(s => s.completed));
  const isLocked = !plan.isPremium && plan.totalRealWeeks > plan.weeks.length;
  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ padding: "20px 16px 0" }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: G.ink, marginBottom: 4 }}>Programme</h2>
        <p style={{ fontSize: 13, color: G.grey, marginBottom: 20 }}>
          {plan.weeks.length} semaines · {profile.sessionsPerWeek}×/semaine
          {isLocked && <span style={{ color: G.coral, fontWeight: 600 }}> · {plan.totalRealWeeks - plan.weeks.length} sem. bloquées</span>}
        </p>
        {plan.weeks.map((week, i) => (
          <WeekCard key={i} week={week} weekIndex={i} onComplete={onComplete} onShare={onShare} isCurrentWeek={i === currentWeek} />
        ))}
        {isLocked && <PremiumBanner weeksTotal={plan.totalRealWeeks} weeksShown={plan.weeks.length} onUpgrade={onUpgrade} />}
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
  beginner:     { endurance: 1200, seuil: 900,  vitesse: 700,  technique: 1000, récupération: 700  },
  intermediate: { endurance: 2000, seuil: 1800, vitesse: 1400, technique: 1600, récupération: 1200 },
  advanced:     { endurance: 3200, seuil: 2600, vitesse: 2000, technique: 2400, récupération: 1600 },
};

const SESSION_TEMPLATES = {
  endurance: (dist, pool, level = "intermediate") => {
    const warm  = Math.round(dist * 0.15 / 50) * 50 || 200;
    const drills = 4 * pool;
    const pull   = Math.round(dist * 0.12 / pool) * pool || pool * 2;
    const main   = Math.max(dist - warm - drills - pull - 200, 200);
    const isBeg  = level === "beginner";
    return {
      type: "ENDURANCE", title: isBeg ? "Nage en douceur" : "Endurance fondamentale", intensity: "Faible — Z1/Z2",
      details: isBeg ? [
        `Échauffement ${warm}m : nage de ton choix (crawl ou brasse) à ton rythme`,
        `Planche (kick) ${drills}m : 4×${pool}m avec planche, jambes seulement — talons qui sortent de l'eau`,
        `Nage libre ${main}m : crawl ou brasse, sans t'essouffler — si tu peines, ralentis`,
        `Dos ${pull}m : dos crawlé tranquille, bras qui sortent de l'eau alternativement`,
        `Retour calme 200m : brasse très lente`,
      ] : [
        `Échauffement ${warm}m : crawl lent, respiration 3 temps`,
        `Éducatifs ${drills}m : 4×${pool}m grand chien — bras tendu devant, rotation lente avant de tirer`,
        `Série principale ${main}m : nage continue à allure conversation — compte tes bras par longueur`,
        `Pull-buoy ${pull}m : bras seuls, coude haut, tirage jusqu'à la cuisse`,
        `Retour calme 200m : dos crawlé très lent`,
      ],
    };
  },

  seuil: (dist, pool, level = "intermediate") => {
    const warm   = Math.round(dist * 0.18 / 100) * 100 || 200;
    const activ  = 4 * pool;
    const repDist = Math.round(dist * 0.10 / 50) * 50 || 100;
    const reps   = Math.max(4, Math.round((dist * 0.55) / repDist));
    const cool   = 4 * pool;
    const isBeg  = level === "beginner";
    return {
      type: "SEUIL", title: isBeg ? "Effort continu" : "Travail au seuil", intensity: "Modérée — Z3/Z4",
      details: isBeg ? [
        `Échauffement ${warm}m : nage très facile pour chauffer les muscles`,
        `Activation ${activ}m : 4×${pool}m avec palmes — sens la poussée dans l'eau`,
        `Série ${reps}×${repDist}m : nage à bonne allure, récup 20s entre chaque — essaie de garder le même rythme`,
        `Récup ${cool}m : dos ou brasse très lente`,
        `Retour calme 200m : crawl lent`,
      ] : [
        `Échauffement ${warm}m : crawl progressif, 50m facile / 50m moyen / 50m soutenu`,
        `Activation ${activ}m : 4×${pool}m avec palmes, coude haut à l'entrée de main`,
        `Série principale ${reps}×${repDist}m : allure soutenue, récup 15s — régularité sur chaque répétition`,
        `Accélérations ${cool}m : 4×${pool}m sprint + virage rapide à chaque mur`,
        `Retour calme 200m : crawl lent`,
      ],
    };
  },

  vitesse: (dist, pool, level = "intermediate") => {
    const warm   = Math.round(dist * 0.14 / 50) * 50 || 150;
    const sprCnt = Math.max(4, Math.round(dist * 0.45 / pool));
    const powDist = Math.round(dist * 0.20 / pool) * pool || pool * 2;
    const cool   = Math.round(dist * 0.14 / 100) * 100 || 150;
    const isBeg  = level === "beginner";
    return {
      type: "VITESSE", title: isBeg ? "Accélérations" : "Vitesse & puissance", intensity: "Élevée — Z5",
      details: isBeg ? [
        `Échauffement ${warm}m : nage tranquille`,
        `Activation : 4×${pool}m avec palmes — sens la vitesse`,
        `Accélérations ${sprCnt}×${pool}m : nage vite sur une longueur, reprends ton souffle avant la suivante`,
        `Récup ${powDist}m : brasse ou dos très lent`,
        `Retour calme ${cool}m : nage très lente`,
      ] : [
        `Échauffement ${warm}m : crawl / dos / brasse, puis 4×${pool}m avec palmes rapide`,
        `Activation départs : 4 poussées de mur → 15m flèche en apnée, corps gainé`,
        `Sprints ${sprCnt}×${pool}m : 100% d'effort, départ toutes les 2 min — récup complète obligatoire`,
        `Puissance ${powDist}m : palmes + pull-buoy, pression forte dans la paume dès l'entrée`,
        `Retour calme ${cool}m : nage très lente, rotation épaules`,
      ],
    };
  },

  technique: (dist, pool, level = "intermediate") => {
    const drillA  = 4 * pool;
    const drillB  = 6 * pool;
    const drillC  = 6 * pool;
    const paddleDist = Math.round(dist * 0.30 / pool) * pool || pool * 4;
    const integDist  = Math.max(dist - drillA - drillB - drillC - paddleDist, pool * 2);
    const targetMin  = Math.max(12, Math.round(dist / pool / 2.0));
    const targetMax  = Math.max(14, Math.round(dist / pool / 1.6));
    const isBeg  = level === "beginner";
    return {
      type: "TECHNIQUE", title: isBeg ? "Séance plaisir" : "Séance technique", intensity: "Faible — qualité > quantité",
      details: isBeg ? [
        `Planche (kick) ${drillA}m : 4×${pool}m avec planche — jambes actives, corps droit`,
        `Bras seuls ${drillB}m : 6×${pool}m avec pull-buoy — concentre-toi sur la poussée`,
        `Petit chien ${drillC}m : 6×${pool}m — bras tendu devant, corps sur le côté, avant de tirer`,
        `Nage avec palmes ${paddleDist}m : palmes aux pieds, sens la vitesse et tiens-toi horizontal`,
        `Nage complète ${integDist}m : mets tout ensemble, reste relâché·e`,
      ] : [
        `Référence ${drillA}m : 4×${pool}m en comptant tes bras par longueur — note ton chiffre`,
        `Petit chien ${drillB}m : 6×${pool}m — bras devant, corps sur le côté, oreille dans l'eau, attends avant de tirer`,
        `Glisse sous l'eau ${drillC}m : 6×${pool}m — après le virage, glisse le plus loin possible avant le premier mouvement`,
        `Palmes + pull-buoy ${paddleDist}m : sens la pression de l'eau dans la paume, coude haut`,
        `Nage complète ${integDist}m : vise ${targetMin}–${targetMax} bras par longueur`,
      ],
    };
  },

  récupération: (dist, pool, level = "intermediate") => {
    const a = Math.round(dist * 0.35 / 50) * 50 || 150;
    const b = Math.round(dist * 0.35 / 50) * 50 || 150;
    const isBeg = level === "beginner";
    return {
      type: "RÉCUPÉRATION", title: "Récupération active", intensity: "Très faible — Z1",
      details: isBeg ? [
        `${a}m nage libre à ton rythme — brasse, dos ou crawl comme tu veux`,
        `4×${pool}m sur le dos : bras qui sortent, jambes légères`,
        `${b}m brasse très lente : inspire bien en sortant la tête, relâche tout`,
        `Fin : reste dans l'eau 2 min, étire les bras et les épaules`,
      ] : [
        `${a}m nage libre au choix (dos, brasse, crawl) — allure très facile`,
        `4×${pool}m respiration d'un seul côté : 2 longueurs côté droit, 2 longueurs côté gauche`,
        `${b}m crawl très lent : glisse après chaque virage, compte ta glisse`,
        `4×${pool}m dos crawlé : relâche les épaules, scan du corps`,
      ],
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
  const patterns = wellness ? WELLNESS_PATTERNS : PHASE_PATTERNS;
  const f = Math.min(freq, 4);
  const weeks = phaseList.map((phase, wi) => {
    const types = patterns[phase.phase]?.[f] || patterns.base[f] || ["endurance"];
    return {
      number: wi + 1, focus: phase.focus, tip: TIPS[phase.tipKey], feedback: null,
      sessions: types.map(type => {
        const distBase = Math.round(baseDist[type] * phase.progression / 50) * 50;
        return { ...SESSION_TEMPLATES[type](distBase, pool, level), distance: `${distBase}m`, duration: Math.max(30, Math.min(120, Math.round(distBase / 38))), completed: false };
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
  const prevBadgesRef = useRef([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      window.history.replaceState({}, "", window.location.pathname);
      supabase.auth.refreshSession().then(({ data }) => {
        if (data?.user?.user_metadata?.subscription === "premium") {
          setIsPremium(true);
          setShowUpgrade(false);
        }
      });
    }
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
      setIsPremium(u?.user_metadata?.subscription === "premium");
      if (u) { loadUserData(u.id).finally(() => setAuthLoading(false)); }
      else { setScreen("onboarding"); setStep(1); setProfile({ goal: "", eventDate: "", level: "", pool: 50, sessionsPerWeek: null, weightCurrent: "", weightGoal: "" }); setPlan(null); setAuthLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId) => {
    try {
      const { data, error } = await supabase.from("user_plans").select("profile, plan").eq("user_id", userId).single();
      if (data && !error && data.profile && data.plan) {
        setProfile(data.profile); setPlan(data.plan); setScreen("app"); return;
      }
    } catch {}
    try {
      const sp = localStorage.getItem(`aquaplan_profile_${userId}`);
      const spl = localStorage.getItem(`aquaplan_plan_${userId}`);
      if (sp && spl) { setProfile(JSON.parse(sp)); setPlan(JSON.parse(spl)); setScreen("app"); }
    } catch {}
  };

  useEffect(() => {
    if (plan && profile.goal && user) {
      try {
        localStorage.setItem(`aquaplan_profile_${user.id}`, JSON.stringify(profile));
        localStorage.setItem(`aquaplan_plan_${user.id}`, JSON.stringify(plan));
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
    if (user) { localStorage.removeItem(`aquaplan_profile_${user.id}`); localStorage.removeItem(`aquaplan_plan_${user.id}`); supabase.from("user_plans").delete().eq("user_id", user.id).then(() => {}); }
    setScreen("onboarding"); setStep(1);
    setProfile({ goal: "", eventDate: "", level: "", pool: 50, sessionsPerWeek: null, weightCurrent: "", weightGoal: "" });
    setPlan(null); prevBadgesRef.current = [];
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); };

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
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 19, color: G.ink }}>AquaPlan</span>
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
        {activeTab === "plan"    && <PlanTab    plan={plan} profile={profile} onComplete={handleComplete} onShare={s => setShareSession(s)} onReset={handleReset} onUpgrade={() => setShowUpgrade(true)} />}
        {activeTab === "stats"   && <StatsTab   plan={plan} />}
        {activeTab === "badges"  && <BadgesTab  plan={plan} />}
        {activeTab === "profile" && <ProfileTab user={user} isPremium={isPremium} onSignOut={handleSignOut} onPortal={handlePortal} onUpgrade={() => setShowUpgrade(true)} />}

        <BottomNav active={activeTab} onChange={setActiveTab} newBadge={newBadgeId !== null} />

        {feedbackWeek !== null && <FeedbackModal weekNumber={plan.weeks[feedbackWeek]?.number} onRate={handleFeedback} onSkip={() => setFeedbackWeek(null)} />}
        {shareSession && <ShareModal session={shareSession} goalLabel={goal?.label} onClose={() => setShareSession(null)} />}
        {newBadgeId && <BadgeToast badgeId={newBadgeId} />}
        {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} weeksBlocked={plan?.totalRealWeeks > FREE_WEEKS_LIMIT ? plan.totalRealWeeks : null} />}
      </div>
    </>
  );
}
