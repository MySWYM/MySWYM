import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";

// ── FONTS ──────────────────────────────────────────────────────────────────
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
  gold: "#FFB800",
  goldLight: "#FFF8E1",
  purple: "#7C3AED",
  purpleLight: "#EDE9FE",
  grey: "#6B7280",
  greyMid: "#9CA3AF",
  greyLight: "#E5E7EB",
  greyXLight: "#F9FAFB",
  white: "#FFFFFF",
};

const TYPE_META = {
  ENDURANCE:    { bg: G.blueLight,   color: G.blue,   dot: G.blue },
  SEUIL:        { bg: "#FFF3E0",     color: "#E65100", dot: "#FF6D00" },
  VITESSE:      { bg: G.coralLight,  color: G.coral,  dot: G.coral },
  TECHNIQUE:    { bg: G.waterLight,  color: "#0097A7", dot: G.water },
  RÉCUPÉRATION: { bg: G.mintLight,   color: "#00897B", dot: G.mint },
};

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${G.bg}; font-family: 'DM Sans', sans-serif; overscroll-behavior: none; }
  @keyframes fadeUp   { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
  @keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
  @keyframes scaleIn  { from { opacity:0; transform:scale(0.9) } to { opacity:1; transform:scale(1) } }
  @keyframes slideUp  { from { transform:translateY(100%) } to { transform:translateY(0) } }
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
  select { appearance: none; -webkit-appearance: none; }
  ::-webkit-scrollbar { width: 0; }
  button:active { transform: scale(0.97); }
`;

// ── DATA ──────────────────────────────────────────────────────────────────
const GOALS = [
  { id: "triathlon_sprint",   label: "Triathlon Sprint",    dist: "750m",       icon: "🏁" },
  { id: "triathlon_olympic",  label: "Triathlon Olympique", dist: "1500m",      icon: "🏅" },
  { id: "open_water_5k",      label: "Eau libre 5km",       dist: "5km",        icon: "🌊" },
  { id: "open_water_10k",     label: "Eau libre 10km",      dist: "10km",       icon: "🌊" },
  { id: "competition_50m",    label: "Compétition piscine", dist: "50–200m",    icon: "🏊" },
  { id: "fitness",            label: "Forme & bien-être",   dist: "sans objectif", icon: "💪" },
];

const LEVELS = [
  { id: "beginner",     label: "Débutant",      desc: "Je nage depuis moins d'1 an" },
  { id: "intermediate", label: "Intermédiaire", desc: "Je nage régulièrement depuis 1–3 ans" },
  { id: "advanced",     label: "Confirmé",      desc: "Je fais des compétitions ou 3+ ans" },
];

const FREQUENCIES = [
  { id: 1, label: "1x / semaine", desc: "Je suis occupé·e" },
  { id: 2, label: "2x / semaine", desc: "Mon rythme idéal" },
  { id: 3, label: "3x / semaine", desc: "Je suis motivé·e" },
  { id: 4, label: "4x et plus",   desc: "Je suis sérieux·se" },
];

const POOLS = [{ id: 25, label: "25m" }, { id: 50, label: "50m" }];

const BADGE_DEFS = [
  { id: "first_session",  label: "Premier plongeon",     desc: "1ère séance complétée",            icon: "🏊", color: G.water },
  { id: "km1",            label: "1 km nagé",            desc: "1 000 mètres au compteur",          icon: "📏", color: G.blue },
  { id: "km5",            label: "5 km nagé",            desc: "5 000 mètres parcourus",            icon: "🌊", color: G.blueDeep },
  { id: "km10",           label: "10 km nagé",           desc: "10 000 mètres — respect !",         icon: "💧", color: G.purple },
  { id: "streak3",        label: "Série de 3",           desc: "3 séances consécutives",            icon: "🔥", color: G.coral },
  { id: "streak5",        label: "Série de 5",           desc: "5 séances consécutives",            icon: "🔥", color: "#FF3D00" },
  { id: "week_perfect",   label: "Semaine parfaite",     desc: "Toutes les séances d'une semaine",  icon: "⭐", color: G.gold },
  { id: "speed_demon",    label: "Flash aquatique",      desc: "1ère séance de vitesse complétée",  icon: "⚡", color: G.coral },
  { id: "technique_pro",  label: "Maître technicien",    desc: "3 séances technique complétées",    icon: "🎯", color: G.mint },
  { id: "halfway",        label: "À mi-chemin",          desc: "50% du plan complété",              icon: "🎖️",  color: G.blueMid },
  { id: "finisher",       label: "Finisher",             desc: "Plan d'entraînement 100% bouclé !",  icon: "🏆", color: G.gold },
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
      return {
        ...w,
        sessions: w.sessions.map(s => {
          const d = parseInt(s.distance);
          const nd = Math.round(d * factor / 50) * 50;
          return { ...s, distance: `${nd}m` };
        }),
      };
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

  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.font = "bold 34px sans-serif";
  ctx.fillText("🏊 AquaPlan", 80, 126);

  ctx.fillStyle = "#00C48C";
  crr(ctx, 80, 196, 300, 58, 29); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.font = "bold 24px sans-serif";
  ctx.fillText("✓  Séance terminée", 108, 234);

  const tc = { ENDURANCE: "#4080FF", SEUIL: "#FF6D00", VITESSE: "#FF4757", TECHNIQUE: "#00B4D8", RÉCUPÉRATION: "#00C48C" };
  ctx.fillStyle = tc[session.type] || "#4080FF";
  ctx.font = "500 28px sans-serif";
  ctx.fillText(session.type, 80, 340);

  ctx.fillStyle = "#FFFFFF"; ctx.font = "bold 68px sans-serif";
  const words = session.title.split(" ");
  let line = "", y = 430;
  words.forEach((word, i) => {
    const test = line + word + " ";
    if (ctx.measureText(test).width > 920 && line) { ctx.fillText(line.trim(), 80, y); line = word + " "; y += 84; }
    else { line = test; }
  });
  ctx.fillText(line.trim(), 80, y);

  const stats = [
    { label: "Distance", value: session.distance },
    { label: "Durée",    value: formatDuration(session.duration) },
    { label: "Intensité",value: session.intensity },
  ];
  stats.forEach((s, i) => {
    const x = 80 + i * 310;
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    crr(ctx, x, 640, 290, 134, 20); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.45)"; ctx.font = "400 22px sans-serif";
    ctx.fillText(s.label, x + 20, 678);
    ctx.fillStyle = "#FFFFFF"; ctx.font = "bold 40px sans-serif";
    ctx.fillText(s.value, x + 20, 734);
  });

  if (goalLabel) {
    ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.font = "400 26px sans-serif";
    ctx.fillText(`Objectif : ${goalLabel}`, 80, 854);
  }
  ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.font = "400 22px sans-serif";
  ctx.fillText("aquatrack-iota-lyart.vercel.app", 80, 1016);

  return canvas;
};

// ── PRIMITIVES ────────────────────────────────────────────────────────────
const Btn = ({ children, onClick, variant = "primary", disabled, style: s }) => {
  const base = {
    display: "block", width: "100%", padding: "16px 24px", borderRadius: 14,
    fontSize: 16, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
    cursor: disabled ? "not-allowed" : "pointer", border: "none",
    transition: "all 0.18s", opacity: disabled ? 0.4 : 1, ...s,
  };
  const styles = {
    primary: { background: G.ink, color: G.white },
    secondary: { background: G.greyLight, color: G.ink },
    blue: { background: G.blue, color: G.white, boxShadow: "0 8px 24px rgba(0,87,255,0.28)" },
    ghost: { background: "transparent", color: G.grey, border: `1px solid ${G.greyLight}` },
  };
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
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - Math.min(1, value))}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s ease" }} />
      </svg>
      {label && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: size * 0.2, fontWeight: 700, color: G.white }}>{label}</span>
        </div>
      )}
    </div>
  );
};

const StatPill = ({ icon, value, label, color, bg }) => (
  <div style={{ flex: 1, background: bg || G.greyXLight, borderRadius: 16, padding: "16px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
    <span style={{ fontSize: 22 }}>{icon}</span>
    <span style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: color || G.ink, lineHeight: 1 }}>{value}</span>
    <span style={{ fontSize: 11, color: G.grey, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</span>
  </div>
);

const BottomNav = ({ active, onChange, newBadge }) => {
  const tabs = [
    { id: "home",   icon: "🏠", label: "Accueil" },
    { id: "plan",   icon: "📅", label: "Programme" },
    { id: "stats",  icon: "📊", label: "Stats" },
    { id: "badges", icon: "🏅", label: "Badges" },
  ];
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
      background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)",
      borderTop: `1px solid ${G.greyLight}`,
      display: "flex", padding: "10px 0 max(10px, env(safe-area-inset-bottom))",
    }}>
      {tabs.map(t => {
        const isActive = active === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            background: "none", border: "none", cursor: "pointer", padding: "2px 0", position: "relative",
          }}>
            <span style={{ fontSize: 22, filter: isActive ? "none" : "grayscale(60%) opacity(0.6)", transition: "all 0.2s" }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400, color: isActive ? G.blue : G.grey, transition: "all 0.2s" }}>{t.label}</span>
            {t.id === "badges" && newBadge && (
              <div style={{ position: "absolute", top: 0, right: "calc(50% - 18px)", width: 8, height: 8, borderRadius: "50%", background: G.coral }} />
            )}
            {isActive && <div style={{ position: "absolute", bottom: -10, width: 24, height: 3, borderRadius: 2, background: G.blue }} />}
          </button>
        );
      })}
    </div>
  );
};

// ── AUTH SCREEN ───────────────────────────────────────────────────────────
const OAuthBtn = ({ icon, label, onClick }) => (
  <button onClick={onClick} style={{
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    width: "100%", padding: "13px 16px", borderRadius: 12,
    border: `1.5px solid ${G.greyLight}`, background: G.white,
    fontSize: 14, fontWeight: 600, color: G.ink, cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif", transition: "all 0.18s",
  }}>
    <span style={{ fontSize: 18 }}>{icon}</span>{label}
  </button>
);

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

  const handleOAuth = async (provider) => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) setError(error.message);
  };

  const inp = { width: "100%", padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${G.greyLight}`, fontSize: 15, fontFamily: "'DM Sans', sans-serif", background: G.white, color: G.ink, outline: "none" };

  return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "0 20px", paddingTop: 64, paddingBottom: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 44 }}>
        <div style={{ width: 40, height: 40, background: G.ink, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 20 }}>🏊</span>
        </div>
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: G.ink }}>AquaPlan</span>
      </div>
      <div className="fade-up">
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, color: G.ink, marginBottom: 8, lineHeight: 1.1 }}>
          {mode === "login" ? "Bon retour 👋" : "Crée ton compte"}
        </h2>
        <p style={{ color: G.grey, fontSize: 15, marginBottom: 28 }}>
          {mode === "login" ? "Connecte-toi pour accéder à ton plan." : "Rejoins AquaPlan gratuitement."}
        </p>

        {/* OAuth buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          <OAuthBtn icon="🌐" label="Continuer avec Google" onClick={() => handleOAuth("google")} />
          <div style={{ display: "flex", gap: 10 }}>
            <OAuthBtn icon="🍎" label="Apple"  onClick={() => handleOAuth("apple")} />
            <OAuthBtn icon="🏃" label="Strava" onClick={() => handleOAuth("strava")} />
          </div>
        </div>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: G.greyLight }} />
          <span style={{ fontSize: 12, color: G.greyMid }}>ou avec ton email</span>
          <div style={{ flex: 1, height: 1, background: G.greyLight }} />
        </div>

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
          <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); setSuccess(null); }}
            style={{ background: "none", border: "none", color: G.ink, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
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
        <button key={g.id} onClick={() => onChange(g.id)} style={{
          display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14,
          border: `2px solid ${value === g.id ? G.ink : G.greyLight}`, background: value === g.id ? G.ink : G.white,
          cursor: "pointer", transition: "all 0.2s", textAlign: "left",
        }}>
          <span style={{ fontSize: 26, flexShrink: 0 }}>{g.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: value === g.id ? G.white : G.ink }}>{g.label}</div>
            <div style={{ fontSize: 12, color: value === g.id ? "rgba(255,255,255,0.5)" : G.grey }}>{g.dist}</div>
          </div>
          {value === g.id && <span style={{ color: G.white, fontSize: 16 }}>✓</span>}
        </button>
      ))}
    </div>
    <Btn onClick={onNext} disabled={!value}>Continuer →</Btn>
  </div>
);

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
          <span style={{ fontSize: 20 }}>📅</span>
          <span style={{ fontSize: 14, color: G.blue, fontWeight: 500 }}>{weeks} semaines de préparation</span>
        </div>
      )}
      <Btn onClick={onNext} disabled={!value}>Continuer →</Btn>
      <button onClick={onBack} style={{ width: "100%", marginTop: 10, padding: "12px", background: "none", border: "none", color: G.grey, cursor: "pointer", fontSize: 14 }}>← Retour</button>
    </div>
  );
};

const Step3_Level = ({ value, onChange, pool, onPoolChange, onNext, onBack }) => (
  <div className="fade-up">
    <p style={{ fontSize: 12, fontWeight: 600, color: G.grey, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Étape 3 sur 4</p>
    <h2 style={{ fontSize: 30, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: G.ink, marginBottom: 6, lineHeight: 1.1 }}>Ton niveau<br />de natation ?</h2>
    <p style={{ color: G.grey, fontSize: 15, marginBottom: 24 }}>Sois honnête — le plan sera meilleur !</p>
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
      {LEVELS.map(l => (
        <button key={l.id} onClick={() => onChange(l.id)} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px",
          borderRadius: 14, border: `2px solid ${value === l.id ? G.ink : G.greyLight}`,
          background: value === l.id ? G.ink : G.white, cursor: "pointer", transition: "all 0.2s",
        }}>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: value === l.id ? G.white : G.ink }}>{l.label}</div>
            <div style={{ fontSize: 12, color: value === l.id ? "rgba(255,255,255,0.55)" : G.grey }}>{l.desc}</div>
          </div>
          {value === l.id && <span style={{ color: G.white, fontSize: 16 }}>✓</span>}
        </button>
      ))}
    </div>
    <div style={{ marginBottom: 28 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: G.grey, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Ton bassin habituel</p>
      <div style={{ display: "flex", gap: 10 }}>
        {POOLS.map(p => (
          <button key={p.id} onClick={() => onPoolChange(p.id)} style={{
            flex: 1, padding: "14px", borderRadius: 12, border: `2px solid ${pool === p.id ? G.ink : G.greyLight}`,
            background: pool === p.id ? G.ink : G.white, color: pool === p.id ? G.white : G.ink,
            fontSize: 16, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
          }}>{p.label}</button>
        ))}
      </div>
    </div>
    <Btn onClick={onNext} disabled={!value}>Continuer →</Btn>
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
        <button key={f.id} onClick={() => onChange(f.id)} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px",
          borderRadius: 14, border: `2px solid ${value === f.id ? G.blue : G.greyLight}`,
          background: value === f.id ? G.blue : G.white, cursor: "pointer", transition: "all 0.2s",
        }}>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: value === f.id ? G.white : G.ink }}>{f.label}</div>
            <div style={{ fontSize: 12, color: value === f.id ? "rgba(255,255,255,0.65)" : G.grey }}>{f.desc}</div>
          </div>
          {value === f.id && <span style={{ color: G.white, fontSize: 18 }}>✓</span>}
        </button>
      ))}
    </div>
    <Btn variant="blue" onClick={onNext} disabled={!value}>Générer mon plan 🚀</Btn>
    <button onClick={onBack} style={{ width: "100%", marginTop: 10, padding: "12px", background: "none", border: "none", color: G.grey, cursor: "pointer", fontSize: 14 }}>← Retour</button>
  </div>
);

// ── LOADING ───────────────────────────────────────────────────────────────
const Loading = () => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 24, background: G.bg }}>
    <div style={{ fontSize: 60 }}><span className="swimmer">🏊</span></div>
    <div style={{ textAlign: "center" }}>
      <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: G.ink, marginBottom: 8 }}>On prépare ton plan…</h3>
      <p style={{ color: G.grey, fontSize: 14 }}>L'IA analyse ton profil et construit<br />ton programme semaine par semaine</p>
    </div>
    <div style={{ display: "flex", gap: 8 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: G.blue, animation: `pulse 1.2s ease ${i * 0.2}s infinite` }} />
      ))}
    </div>
  </div>
);

// ── SHARE MODAL ───────────────────────────────────────────────────────────
const ShareModal = ({ session, goalLabel, onClose }) => {
  const tm = TYPE_META[session.type] || TYPE_META.ENDURANCE;

  const handleDownload = () => {
    const canvas = createShareCanvas(session, goalLabel);
    const link = document.createElement("a");
    link.download = "aquaplan-seance.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleShare = async () => {
    if (!navigator.share) { handleDownload(); return; }
    const canvas = createShareCanvas(session, goalLabel);
    canvas.toBlob(async (blob) => {
      try {
        await navigator.share({ files: [new File([blob], "aquaplan-seance.png", { type: "image/png" })], title: "Ma séance AquaPlan" });
      } catch { handleDownload(); }
    });
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="scale-in" style={{ background: G.white, borderRadius: "24px 24px 0 0", padding: "28px 20px", paddingBottom: "max(28px, env(safe-area-inset-bottom))" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: G.greyLight, margin: "0 auto 24px" }} />
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: G.ink, marginBottom: 20, textAlign: "center" }}>Partage ta séance 🎉</h3>

        {/* Card preview */}
        <div style={{
          background: `linear-gradient(135deg, ${G.ink} 0%, #001966 100%)`,
          borderRadius: 20, padding: 24, marginBottom: 20, position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(0,87,255,0.12)" }} />
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: G.mint, borderRadius: 20, padding: "5px 14px", marginBottom: 16 }}>
            <span style={{ fontSize: 13 }}>✓</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: G.white }}>Séance terminée</span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: tm.color, letterSpacing: 1.5, marginBottom: 6, textTransform: "uppercase" }}>{session.type}</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: G.white, marginBottom: 16 }}>{session.title}</div>
          <div style={{ display: "flex", gap: 12 }}>
            {[{ v: session.distance, l: "Distance" }, { v: formatDuration(session.duration), l: "Durée" }, { v: session.intensity, l: "Intensité" }].map((s, i) => (
              <div key={i} style={{ flex: 1, background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 10px" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>{s.l}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: G.white }}>{s.v}</div>
              </div>
            ))}
          </div>
          {goalLabel && <div style={{ marginTop: 14, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Objectif : {goalLabel}</div>}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={handleDownload} variant="secondary" style={{ flex: 1 }}>⬇ Télécharger</Btn>
          <Btn onClick={handleShare}   variant="blue"      style={{ flex: 1 }}>↑ Partager</Btn>
        </div>
        <button onClick={onClose} style={{ width: "100%", marginTop: 10, padding: "12px", background: "none", border: "none", color: G.grey, cursor: "pointer", fontSize: 14 }}>Fermer</button>
      </div>
    </div>
  );
};

// ── WEEKLY FEEDBACK MODAL ─────────────────────────────────────────────────
const FeedbackModal = ({ weekNumber, onRate, onSkip }) => {
  const opts = [
    { id: "easy", label: "Trop facile", sub: "On augmente le volume", icon: "😎", color: G.mint, bg: G.mintLight },
    { id: "ok",   label: "Parfait",     sub: "On maintient l'allure",  icon: "🎯", color: G.blue, bg: G.blueLight },
    { id: "hard", label: "Trop dur",    sub: "On réduit un peu",        icon: "😅", color: G.coral, bg: G.coralLight },
  ];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
      <div className="scale-in" style={{ background: G.white, borderRadius: "24px 24px 0 0", padding: "28px 20px", paddingBottom: "max(28px, env(safe-area-inset-bottom))" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: G.greyLight, margin: "0 auto 24px" }} />
        <p style={{ fontSize: 12, fontWeight: 600, color: G.grey, letterSpacing: 1.5, textTransform: "uppercase", textAlign: "center", marginBottom: 8 }}>Semaine {weekNumber} terminée ✓</p>
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: G.ink, marginBottom: 6, textAlign: "center" }}>Comment tu t'es<br />senti·e ?</h3>
        <p style={{ color: G.grey, fontSize: 14, textAlign: "center", marginBottom: 24 }}>On adapte les prochaines semaines à ta réponse.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          {opts.map(o => (
            <button key={o.id} onClick={() => onRate(o.id)} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 16,
              border: `1.5px solid ${o.bg}`, background: o.bg, cursor: "pointer", transition: "all 0.2s", textAlign: "left",
            }}>
              <span style={{ fontSize: 26 }}>{o.icon}</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: G.ink }}>{o.label}</div>
                <div style={{ fontSize: 12, color: G.grey }}>{o.sub}</div>
              </div>
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
    <div className="toast-in" style={{
      position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 300,
      background: G.ink, borderRadius: 20, padding: "12px 20px", display: "flex", alignItems: "center", gap: 12,
      boxShadow: "0 8px 32px rgba(0,0,0,0.25)", whiteSpace: "nowrap",
    }}>
      <div className="badge-pop" style={{ width: 40, height: 40, borderRadius: "50%", background: b.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{b.icon}</div>
      <div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", letterSpacing: 0.5 }}>Badge débloqué !</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: G.white }}>{b.label}</div>
      </div>
    </div>
  );
};

// ── SESSION CARD ──────────────────────────────────────────────────────────
const SessionCard = ({ session, weekIndex, sessionIndex, onComplete, onShare }) => {
  const done = session.completed;
  const tm = TYPE_META[session.type] || TYPE_META.ENDURANCE;
  return (
    <div style={{
      background: done ? G.greyXLight : G.white, borderRadius: 16, padding: "16px 16px 14px",
      border: `1px solid ${done ? G.greyLight : "#E8E8E8"}`, opacity: done ? 0.75 : 1,
      transition: "all 0.3s", boxShadow: done ? "none" : "0 2px 8px rgba(0,0,0,0.04)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5, background: done ? G.greyLight : tm.bg,
            borderRadius: 20, padding: "3px 10px", marginBottom: 6,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: done ? G.greyMid : tm.dot }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: done ? G.grey : tm.color, letterSpacing: 1, textTransform: "uppercase" }}>{session.type}</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: done ? G.grey : G.ink, lineHeight: 1.2 }}>{session.title}</div>
        </div>
        <button onClick={() => onComplete(weekIndex, sessionIndex)} style={{
          width: 34, height: 34, borderRadius: "50%", border: `2px solid ${done ? G.mint : G.greyLight}`,
          background: done ? G.mint : "transparent", cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", flexShrink: 0, marginLeft: 10, transition: "all 0.2s",
        }}>
          {done && <span style={{ color: G.white, fontSize: 14 }}>✓</span>}
        </button>
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {[["📏", session.distance], ["⏱", formatDuration(session.duration)], ["🔥", session.intensity]].map(([icon, val], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 13 }}>{icon}</span>
            <span style={{ fontSize: 12, color: G.grey }}>{val}</span>
          </div>
        ))}
      </div>
      {session.details && (
        <div style={{ background: G.bg, borderRadius: 10, padding: "10px 12px", marginTop: 12 }}>
          {session.details.map((d, i) => (
            <div key={i} style={{ fontSize: 12, color: G.grey, lineHeight: 1.7 }}>• {d}</div>
          ))}
        </div>
      )}
      {done && onShare && (
        <button onClick={() => onShare(session)} style={{
          marginTop: 12, padding: "8px 14px", borderRadius: 10, background: G.greyXLight,
          border: `1px solid ${G.greyLight}`, fontSize: 12, color: G.grey, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
        }}>
          <span>↑</span> Partager cette séance
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
    <div style={{
      background: G.white, borderRadius: 18, overflow: "hidden",
      border: isCurrentWeek ? `2px solid ${G.blue}` : `1px solid ${G.greyLight}`,
      marginBottom: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
    }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", padding: "16px 18px", background: "none", border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            {isCurrentWeek && <span style={{ fontSize: 10, fontWeight: 700, color: G.white, background: G.blue, padding: "2px 8px", borderRadius: 20, letterSpacing: 0.8 }}>CETTE SEMAINE</span>}
            {allDone && !isCurrentWeek && <span style={{ fontSize: 10, fontWeight: 700, color: G.mint, background: G.mintLight, padding: "2px 8px", borderRadius: 20 }}>✓ TERMINÉE</span>}
            <span style={{ fontSize: 15, fontWeight: 700, color: G.ink }}>Semaine {week.number}</span>
          </div>
          <div style={{ fontSize: 12, color: G.grey }}>{week.focus} · {done}/{total} séances</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Ring value={done / total} size={38} stroke={4} color={allDone ? G.mint : G.blue} bg={G.greyLight} label={`${done}/${total}`} />
          <span style={{ color: G.greyMid, fontSize: 16 }}>{open ? "▲" : "▼"}</span>
        </div>
      </button>
      {open && (
        <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
          {week.sessions.map((s, i) => (
            <SessionCard key={i} session={s} weekIndex={weekIndex} sessionIndex={i} onComplete={onComplete} onShare={onShare} />
          ))}
          {week.tip && (
            <div style={{ background: G.goldLight, borderRadius: 10, padding: "10px 14px", display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ fontSize: 16 }}>💡</span>
              <span style={{ fontSize: 12, color: "#8B6914", lineHeight: 1.5 }}>{week.tip}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── PLAN TAB ───────────────────────────────────────────────────────────────
const PlanTab = ({ plan, profile, onComplete, onShare, onReset, onUpgrade }) => {
  const currentWeek = plan.weeks.findIndex(w => !w.sessions.every(s => s.completed));
  const realWeeks = plan.totalRealWeeks;
  const shownWeeks = plan.weeks.length;
  const isLocked = !plan.isPremium && realWeeks > shownWeeks;

  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ padding: "20px 16px 0" }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: G.ink, marginBottom: 4 }}>Programme</h2>
        <p style={{ fontSize: 13, color: G.grey, marginBottom: 20 }}>
          {shownWeeks} semaines · {profile.sessionsPerWeek}x/semaine
          {isLocked && <span style={{ color: G.coral, fontWeight: 600 }}> · {realWeeks - shownWeeks} sem. bloquées 🔒</span>}
        </p>
        {plan.weeks.map((week, i) => (
          <WeekCard key={i} week={week} weekIndex={i} onComplete={onComplete} onShare={onShare} isCurrentWeek={i === currentWeek} />
        ))}
        {isLocked && <PremiumBanner weeksTotal={realWeeks} weeksShown={shownWeeks} onUpgrade={onUpgrade} />}
        <button onClick={onReset} style={{
          width: "100%", marginTop: 8, padding: "14px", background: "none",
          border: `1px solid ${G.greyLight}`, borderRadius: 12, color: G.grey, cursor: "pointer", fontSize: 13,
        }}>🔄 Recommencer l'onboarding</button>
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
      {/* Hero header */}
      <div style={{ background: "linear-gradient(140deg, #0D1117 0%, #001966 100%)", padding: "52px 20px 28px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(0,87,255,0.10)" }} />
        <div style={{ position: "absolute", top: 20, right: 60, width: 110, height: 110, borderRadius: "50%", background: "rgba(0,180,216,0.07)" }} />
        <div style={{ position: "absolute", bottom: -20, left: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(0,87,255,0.06)" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, position: "relative" }}>
          <div>
            <div className="fade-up" style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", letterSpacing: 1, marginBottom: 4 }}>Bonjour 👋</div>
            <h1 className="fade-up-1" style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: G.white, lineHeight: 1.1 }}>{goal?.label}</h1>
            {daysToEvent !== null && <p className="fade-up-2" style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 2 }}>J-{daysToEvent} avant l'événement</p>}
          </div>
          <button onClick={onSignOut} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 10, padding: "7px 13px", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 12, backdropFilter: "blur(8px)" }}>
            Déco.
          </button>
        </div>

        <div className="fade-up-3" style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
          <Ring value={weekTotal > 0 ? weekDone / weekTotal : 1} size={72} stroke={7} color={G.water} label={`${weekDone}/${weekTotal}`} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 2, letterSpacing: 0.5 }}>CETTE SEMAINE</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: G.white }}>{currentWeek?.focus ?? "Plan terminé !"}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: G.white, lineHeight: 1 }}>{(stats.totalMeters / 1000).toFixed(1)}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: 0.5 }}>KM NAGÉS</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 16px 0" }}>
        {/* Plan terminé */}
        {!nextSession && stats.totalSessions > 0 && stats.totalSessions >= stats.planTotal && (
          <div className="fade-up" style={{ background: `linear-gradient(135deg, ${G.gold} 0%, #FF8C00 100%)`, borderRadius: 20, padding: 24, textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 52, marginBottom: 10 }}>🏆</div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: G.white, marginBottom: 6 }}>Plan terminé !</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>Tu as bouclé l'intégralité de ton programme. Bravo !</p>
          </div>
        )}

        {/* Prochaine séance */}
        {nextSession && tm && (
          <div className="fade-up">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 800, color: G.ink }}>Prochaine séance</h2>
              <button onClick={() => onTabChange("plan")} style={{ background: "none", border: "none", fontSize: 13, color: G.blue, cursor: "pointer", fontWeight: 600 }}>Tout voir →</button>
            </div>
            <div style={{ background: G.white, borderRadius: 18, padding: 20, border: `1px solid ${G.greyLight}`, boxShadow: "0 4px 16px rgba(0,0,0,0.06)", marginBottom: 20 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: tm.bg, borderRadius: 20, padding: "4px 12px", marginBottom: 12 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: tm.dot }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: tm.color, letterSpacing: 1.2, textTransform: "uppercase" }}>{nextSession.type}</span>
              </div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: G.ink, marginBottom: 14 }}>{nextSession.title}</div>
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                {[["📏", nextSession.distance], ["⏱", formatDuration(nextSession.duration)], ["🔥", nextSession.intensity]].map(([icon, val], i) => (
                  <div key={i} style={{ flex: 1, background: G.greyXLight, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                    <div style={{ fontSize: 16, marginBottom: 2 }}>{icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: G.ink }}>{val}</div>
                  </div>
                ))}
              </div>
              <Btn variant="blue" onClick={() => onComplete(currentWeekIndex, nextSessionIndex)}>
                ✓ Marquer comme faite
              </Btn>
            </div>
          </div>
        )}

        {/* Quick stats */}
        <div className="fade-up-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <StatPill icon="🔥" value={stats.streak} label="Série max" color={G.coral} bg={G.coralLight} />
          <StatPill icon="⭐" value={stats.perfectWeeks} label="Semaines parfaites" color={G.gold} bg={G.goldLight} />
        </div>

        {/* Progression globale */}
        <div className="fade-up-2" style={{ background: G.white, borderRadius: 18, padding: 18, border: `1px solid ${G.greyLight}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: G.ink }}>Progression globale</span>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: G.blue }}>
              {stats.planTotal > 0 ? Math.round(stats.totalSessions / stats.planTotal * 100) : 0}%
            </span>
          </div>
          <div style={{ height: 8, background: G.greyLight, borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 4,
              width: `${stats.planTotal > 0 ? (stats.totalSessions / stats.planTotal * 100) : 0}%`,
              background: `linear-gradient(90deg, ${G.blue} 0%, ${G.water} 100%)`,
              transition: "width 0.8s ease",
            }} />
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
const StatsTab = ({ plan, profile }) => {
  const stats = computeStats(plan);
  const maxMeters = Math.max(...stats.weeklyData.map(w => w.total), 1);

  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ background: "linear-gradient(140deg, #0D1117 0%, #001966 100%)", padding: "52px 20px 28px" }}>
        <div className="fade-up" style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", letterSpacing: 1, marginBottom: 4 }}>Tes performances</div>
        <h1 className="fade-up-1" style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: G.white, marginBottom: 4 }}>Stats</h1>
        <p className="fade-up-2" style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Depuis le début du plan</p>
      </div>

      <div style={{ padding: "20px 16px 0" }}>
        {/* Top stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <StatPill icon="💧" value={`${(stats.totalMeters / 1000).toFixed(1)} km`} label="Total nagés" color={G.blue} bg={G.blueLight} />
          <StatPill icon="🔥" value={stats.streak} label="Meilleure série" color={G.coral} bg={G.coralLight} />
          <StatPill icon="✅" value={stats.totalSessions} label="Séances faites" color={G.mint} bg={G.mintLight} />
          <StatPill icon="⭐" value={stats.perfectWeeks} label="Semaines parfaites" color={G.gold} bg={G.goldLight} />
        </div>

        {/* Volume par semaine */}
        <div style={{ background: G.white, borderRadius: 18, padding: "18px 16px", marginBottom: 16, border: `1px solid ${G.greyLight}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: G.ink, marginBottom: 16 }}>Volume par semaine</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100 }}>
            {stats.weeklyData.map((w, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%" }}>
                <div style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", position: "relative" }}>
                  <div style={{ width: "100%", height: `${(w.total / maxMeters) * 100}%`, background: G.greyLight, borderRadius: "4px 4px 0 0", position: "absolute", bottom: 0 }} />
                  <div style={{
                    width: "100%", height: `${(w.done / maxMeters) * 100}%`,
                    background: w.done === w.total && w.total > 0 ? G.mint : `linear-gradient(180deg, ${G.water} 0%, ${G.blue} 100%)`,
                    borderRadius: "4px 4px 0 0", position: "absolute", bottom: 0,
                    transition: "height 0.8s ease",
                  }} />
                </div>
                <span style={{ fontSize: 10, color: G.grey }}>{w.label}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: G.blue }} />
              <span style={{ fontSize: 11, color: G.grey }}>Réalisé</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: G.greyLight }} />
              <span style={{ fontSize: 11, color: G.grey }}>Prévu</span>
            </div>
          </div>
        </div>

        {/* Répartition types */}
        <div style={{ background: G.white, borderRadius: 18, padding: "18px 16px", border: `1px solid ${G.greyLight}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: G.ink, marginBottom: 14 }}>Répartition des séances</h3>
          {Object.entries(TYPE_META).map(([type, tm]) => {
            const count = plan.weeks.flatMap(w => w.sessions).filter(s => s.type === type && s.completed).length;
            const total = plan.weeks.flatMap(w => w.sessions).filter(s => s.type === type).length;
            if (total === 0) return null;
            return (
              <div key={type} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: tm.dot }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: G.ink }}>{type.charAt(0) + type.slice(1).toLowerCase()}</span>
                  </div>
                  <span style={{ fontSize: 12, color: G.grey }}>{count}/{total}</span>
                </div>
                <div style={{ height: 6, background: G.greyLight, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${total > 0 ? (count / total * 100) : 0}%`, background: tm.dot, borderRadius: 3, transition: "width 0.6s ease" }} />
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
  const earnedCount = earned.length;

  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ background: "linear-gradient(140deg, #0D1117 0%, #001966 100%)", padding: "52px 20px 28px" }}>
        <div className="fade-up" style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", letterSpacing: 1, marginBottom: 4 }}>Tes récompenses</div>
        <h1 className="fade-up-1" style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: G.white, marginBottom: 4 }}>Badges</h1>
        <p className="fade-up-2" style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>{earnedCount}/{BADGE_DEFS.length} débloqués</p>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          {BADGE_DEFS.map((b, i) => (
            <div key={b.id} style={{
              width: 28, height: 28, borderRadius: "50%",
              background: earned.includes(b.id) ? b.color : "rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
              filter: earned.includes(b.id) ? "none" : "grayscale(1) opacity(0.3)",
              transition: "all 0.3s",
            }}>
              {earned.includes(b.id) ? b.icon : ""}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px 16px 0" }}>
        {earnedCount > 0 && (
          <>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: G.ink, marginBottom: 12 }}>Débloqués 🎉</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
              {BADGE_DEFS.filter(b => earned.includes(b.id)).map((b, i) => (
                <div key={b.id} className="scale-in" style={{
                  background: G.white, borderRadius: 16, padding: 16, textAlign: "center",
                  border: `2px solid ${b.color}20`, boxShadow: `0 4px 16px ${b.color}18`,
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: "50%", background: `${b.color}18`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 26, margin: "0 auto 10px",
                  }}>{b.icon}</div>
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
                <div key={b.id} style={{
                  background: G.greyXLight, borderRadius: 16, padding: 16, textAlign: "center",
                  border: `1px solid ${G.greyLight}`,
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: "50%", background: G.greyLight,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 26, margin: "0 auto 10px", filter: "grayscale(1) opacity(0.4)",
                  }}>🔒</div>
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
  endurance: (dist, pool) => ({
    type: "ENDURANCE", title: "Endurance fondamentale", intensity: "Faible",
    details: [
      `Échauffement: 200m crawl lent`,
      `Série principale: ${Math.round(dist * 0.6 / 100) * 100}m continu ou 4×${Math.round(dist * 0.15 / 50) * 50}m`,
      `Éducatifs: 6×${pool}m (pull-buoy, planche, poings fermés)`,
      `Retour au calme: 200m dos lent`,
    ],
  }),
  seuil: (dist, pool) => ({
    type: "SEUIL", title: "Travail au seuil", intensity: "Modérée",
    details: [
      `Échauffement: 400m progressif + 4×${pool}m accélérations`,
      `Série seuil: 6×${Math.round(dist * 0.1 / 50) * 50}m — récup 20s`,
      `Complément: 4×${pool}m sprint départ plongé`,
      `Retour au calme: 200m crawl très lent`,
    ],
  }),
  vitesse: (dist, pool) => ({
    type: "VITESSE", title: "Vitesse & puissance", intensity: "Élevée",
    details: [
      `Échauffement: 300m varié (crawl/dos/brasse)`,
      `Sprints: 10×${pool}m départ toutes les 2 min`,
      `Série lactique: 4×${Math.round(dist * 0.08 / 50) * 50}m à fond — récup complète`,
      `Retour au calme: 300m très lent + étirements`,
    ],
  }),
  technique: (dist, pool) => ({
    type: "TECHNIQUE", title: "Technique & qualité", intensity: "Faible",
    details: [
      `Échauffement: 200m en se concentrant sur le coulé`,
      `Éducatifs: 12×${pool}m (catch-up, fingertip drag, zipper, EVF)`,
      `Nage complète: ${Math.round(dist * 0.5 / 100) * 100}m en comptant cycles/longueur`,
      `Série paddles: 4×${Math.round(dist * 0.1 / 50) * 50}m + pull-buoy`,
    ],
  }),
  récupération: (dist, pool) => ({
    type: "RÉCUPÉRATION", title: "Récupération active", intensity: "Très faible",
    details: [
      `Nage libre et détendue: ${dist}m sans contrainte`,
      `Mixer les nages selon ton envie (dos, brasse, papillon si tu veux)`,
      `Éducatifs légers: 4×${pool}m au choix`,
      `Concentration sur la respiration et la détente musculaire`,
    ],
  }),
};

const TIPS = {
  debut:       "Commence doucement — l'objectif est de reprendre tes repères dans l'eau. La régularité prime sur l'intensité.",
  aerobie:     "Concentre-toi sur ta respiration. Un bon rythme ventilatoire améliore l'endurance de 20%.",
  endurance:   "Essaie de nager sans t'arrêter. Si tu t'arrêtes, c'est que tu vas trop vite — ralentis.",
  seuil:       "Le seuil doit être inconfortable mais supportable. Tu dois pouvoir dire quelques mots.",
  vitesse:     "Pour les sprints, repose-toi complètement entre chaque répétition. La qualité prime sur la quantité.",
  volume:      "Semaine de charge maximale. Mange bien, dors 8h — c'est là que tu progresses vraiment.",
  affutage:    "Réduis le volume mais garde l'intensité. Ton corps se repose tout en restant en forme.",
  competition: "Dernière ligne droite ! Nage léger, visualise ta course et fais confiance à ton entraînement.",
};

// Phase-aware session selection per frequency
const PHASE_PATTERNS = {
  base: {
    1: ["endurance"],
    2: ["endurance", "technique"],
    3: ["endurance", "endurance", "technique"],
    4: ["endurance", "endurance", "technique", "récupération"],
  },
  development: {
    1: ["seuil"],
    2: ["endurance", "seuil"],
    3: ["endurance", "seuil", "technique"],
    4: ["endurance", "seuil", "vitesse", "technique"],
  },
  peak: {
    1: ["seuil"],
    2: ["seuil", "vitesse"],
    3: ["endurance", "seuil", "vitesse"],
    4: ["endurance", "seuil", "vitesse", "seuil"],
  },
  taper: {
    1: ["endurance"],
    2: ["endurance", "récupération"],
    3: ["endurance", "technique", "récupération"],
    4: ["endurance", "technique", "récupération", "récupération"],
  },
  competition: {
    1: ["récupération"],
    2: ["récupération", "récupération"],
    3: ["endurance", "récupération", "récupération"],
    4: ["endurance", "récupération", "récupération", "récupération"],
  },
};

// Intelligent phase builder — no week cap, scales with any duration
const buildPlanPhases = (totalWeeks) => {
  if (totalWeeks === 1) return [{ phase: "competition", focus: "Semaine de compétition", progression: 0.60, tipKey: "competition" }];
  if (totalWeeks === 2) return [
    { phase: "base",        focus: "Mise en jambes",          progression: 1.00, tipKey: "debut" },
    { phase: "competition", focus: "Semaine de compétition",  progression: 0.60, tipKey: "competition" },
  ];
  if (totalWeeks === 3) return [
    { phase: "base",        focus: "Mise en jambes",          progression: 1.00, tipKey: "debut" },
    { phase: "development", focus: "Développement",           progression: 1.20, tipKey: "endurance" },
    { phase: "competition", focus: "Semaine de compétition",  progression: 0.60, tipKey: "competition" },
  ];

  // 4+ weeks: proportional phase distribution
  const compWeeks   = 1;
  const taperWeeks  = totalWeeks >= 6  ? 1 : 0;
  const remaining   = totalWeeks - compWeeks - taperWeeks;
  const peakCount   = Math.max(1, Math.round(remaining * 0.20));
  const devCount    = Math.max(1, Math.round(remaining * 0.38));
  const baseCount   = remaining - peakCount - devCount;

  const phases = [];

  for (let i = 0; i < baseCount; i++) {
    const t = baseCount > 1 ? i / (baseCount - 1) : 0;
    phases.push({
      phase: "base",
      focus: t < 0.45 ? "Mise en jambes" : "Construction aérobie",
      progression: 1.0 + t * 0.28,
      tipKey: t < 0.45 ? "debut" : "aerobie",
    });
  }
  for (let i = 0; i < devCount; i++) {
    const t = devCount > 1 ? i / (devCount - 1) : 0;
    phases.push({
      phase: "development",
      focus: t < 0.5 ? "Développement endurance" : "Travail au seuil",
      progression: 1.28 + t * 0.22,
      tipKey: t < 0.5 ? "endurance" : "seuil",
    });
  }
  for (let i = 0; i < peakCount; i++) {
    const t = peakCount > 1 ? i / (peakCount - 1) : 0;
    phases.push({
      phase: "peak",
      focus: t < 0.5 ? "Intensité & vitesse" : "Volume maximum",
      progression: 1.50 + t * 0.10,
      tipKey: t < 0.5 ? "vitesse" : "volume",
    });
  }
  if (taperWeeks > 0) {
    phases.push({ phase: "taper", focus: "Affûtage", progression: 1.15, tipKey: "affutage" });
  }
  phases.push({ phase: "competition", focus: "Semaine de compétition", progression: 0.60, tipKey: "competition" });

  return phases;
};

const FREE_MAX_WEEKS = 8;

const generatePlan = async (profile, isPremium = false) => {
  await new Promise(r => setTimeout(r, 1800));
  const { level, sessionsPerWeek: freq, pool } = profile;
  const rawWeeks  = Math.min(52, weeksUntil(profile.eventDate) || 8);
  const totalWeeks = isPremium ? rawWeeks : Math.min(rawWeeks, FREE_MAX_WEEKS);
  const baseDist  = BASE_DISTANCES[level];
  const phaseList = buildPlanPhases(totalWeeks);
  const f         = Math.min(freq, 4);

  const weeks = phaseList.map((phase, wi) => {
    const types = PHASE_PATTERNS[phase.phase]?.[f] || PHASE_PATTERNS.base[f] || ["endurance"];
    return {
      number: wi + 1,
      focus: phase.focus,
      tip: TIPS[phase.tipKey],
      feedback: null,
      sessions: types.map(type => {
        const distBase = Math.round(baseDist[type] * phase.progression / 50) * 50;
        return {
          ...SESSION_TEMPLATES[type](distBase, pool),
          distance: `${distBase}m`,
          duration: Math.max(30, Math.min(120, Math.round(distBase / 38))),
          completed: false,
        };
      }),
    };
  });
  return { weeks, totalRealWeeks: rawWeeks, isPremium };
};

// ── FREEMIUM ──────────────────────────────────────────────────────────────
const PREMIUM_FEATURES = [
  { icon: "📅", label: "Plans illimités",         desc: "Jusqu'à 52 semaines selon ton événement" },
  { icon: "🧠", label: "Plan adaptatif",           desc: "Ajuste automatiquement selon tes retours" },
  { icon: "📊", label: "Stats avancées",           desc: "Graphiques détaillés et historique complet" },
  { icon: "↑",  label: "Partage de séances",      desc: "Cartes visuelles pour Instagram & Strava" },
  { icon: "🏅", label: "Tous les badges",          desc: "Accès à la collection complète" },
];

const UpgradeModal = ({ onClose, weeksBlocked }) => (
  <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
    onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="scale-in" style={{ background: G.white, borderRadius: "24px 24px 0 0", padding: "28px 20px", paddingBottom: "max(28px, env(safe-area-inset-bottom))", maxHeight: "90vh", overflowY: "auto" }}>
      <div style={{ width: 40, height: 4, borderRadius: 2, background: G.greyLight, margin: "0 auto 24px" }} />

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0D1117 0%, #001966 100%)", borderRadius: 20, padding: "24px 20px", marginBottom: 24, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>⚡</div>
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: G.white, marginBottom: 6 }}>AquaPlan Premium</h3>
        {weeksBlocked && (
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
            Ton événement est dans {weeksBlocked} semaines —<br />
            <span style={{ color: G.water, fontWeight: 600 }}>débloquer {weeksBlocked - FREE_MAX_WEEKS} semaines supplémentaires</span>
          </p>
        )}
        {!weeksBlocked && <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>Entraîne-toi sans limites</p>}
      </div>

      {/* Features */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {PREMIUM_FEATURES.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", background: G.greyXLight, borderRadius: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: G.blueLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{f.icon}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: G.ink }}>{f.label}</div>
              <div style={{ fontSize: 12, color: G.grey }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ background: G.blueLight, borderRadius: 14, padding: "14px 16px", marginBottom: 16, textAlign: "center" }}>
        <div style={{ fontSize: 28, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: G.blue, marginBottom: 2 }}>4,99€ / mois</div>
        <div style={{ fontSize: 12, color: G.blue }}>Ou 39,99€ / an · Annulable à tout moment</div>
      </div>

      <Btn variant="blue" onClick={onClose}>Bientôt disponible — Être notifié</Btn>
      <button onClick={onClose} style={{ width: "100%", marginTop: 10, padding: "12px", background: "none", border: "none", color: G.grey, cursor: "pointer", fontSize: 13 }}>Continuer en gratuit</button>
    </div>
  </div>
);

const PremiumBanner = ({ weeksTotal, weeksShown, onUpgrade }) => (
  <div style={{ margin: "0 16px 16px", background: "linear-gradient(135deg, #001966 0%, #0057FF 100%)", borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
    <span style={{ fontSize: 28 }}>🔒</span>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: G.white }}>+{weeksTotal - weeksShown} semaines bloquées</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Plan complet jusqu'à ton événement avec Premium</div>
    </div>
    <button onClick={onUpgrade} style={{ background: G.white, border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, color: G.blue, cursor: "pointer", flexShrink: 0 }}>
      Voir
    </button>
  </div>
);

// ── APP ────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [screen, setScreen] = useState("onboarding");
  const [activeTab, setActiveTab] = useState("home");
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({ goal: "", eventDate: "", level: "", pool: 50, sessionsPerWeek: null });
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);
  const [feedbackWeek, setFeedbackWeek] = useState(null);
  const [shareSession, setShareSession] = useState(null);
  const [newBadgeId, setNewBadgeId] = useState(null);
  const prevBadgesRef = useRef([]);

  // Auth init
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) loadUserData(u.id);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setIsPremium(u?.user_metadata?.subscription === "premium");
      if (!u) { setScreen("onboarding"); setStep(1); setProfile({ goal: "", eventDate: "", level: "", pool: 50, sessionsPerWeek: null }); setPlan(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = (userId) => {
    try {
      const sp  = localStorage.getItem(`aquaplan_profile_${userId}`);
      const spl = localStorage.getItem(`aquaplan_plan_${userId}`);
      if (sp && spl) { setProfile(JSON.parse(sp)); setPlan(JSON.parse(spl)); setScreen("app"); }
    } catch {}
  };

  const handleUpgrade = () => setShowUpgrade(true);

  // Persist plan
  useEffect(() => {
    if (plan && profile.goal && user) {
      try {
        localStorage.setItem(`aquaplan_profile_${user.id}`, JSON.stringify(profile));
        localStorage.setItem(`aquaplan_plan_${user.id}`, JSON.stringify(plan));
      } catch {}
    }
  }, [plan, profile, user]);

  // Badge detection
  useEffect(() => {
    if (!plan) return;
    const stats = computeStats(plan);
    const current = checkBadges(stats);
    const prev = prevBadgesRef.current;
    const newOnes = current.filter(b => !prev.includes(b));
    if (newOnes.length > 0 && prev.length > 0) {
      setNewBadgeId(newOnes[0]);
      setTimeout(() => setNewBadgeId(null), 3200);
    }
    prevBadgesRef.current = current;
  }, [plan]);

  const update = (key, val) => setProfile(p => ({ ...p, [key]: val }));

  const handleGenerate = async () => {
    setScreen("loading"); setError(null);
    try {
      const p = await generatePlan(profile, isPremium);
      setPlan(p); setScreen("app"); setActiveTab("home");
    } catch {
      setError("Impossible de générer le plan. Réessaie !");
      setScreen("onboarding"); setStep(4);
    }
  };

  const handleComplete = (weekIndex, sessionIndex) => {
    setPlan(prev => {
      const next = {
        ...prev,
        weeks: prev.weeks.map((w, wi) => wi !== weekIndex ? w : {
          ...w,
          sessions: w.sessions.map((s, si) => si !== sessionIndex ? s : { ...s, completed: !s.completed }),
        }),
      };
      const updatedWeek = next.weeks[weekIndex];
      if (updatedWeek.sessions.every(s => s.completed) && !updatedWeek.feedback) {
        setTimeout(() => setFeedbackWeek(weekIndex), 700);
      }
      return next;
    });
  };

  const handleFeedback = (rating) => {
    if (feedbackWeek === null) return;
    setPlan(prev => adjustPlan(prev, feedbackWeek, rating));
    setFeedbackWeek(null);
  };

  const handleReset = () => {
    if (user) { localStorage.removeItem(`aquaplan_profile_${user.id}`); localStorage.removeItem(`aquaplan_plan_${user.id}`); }
    setScreen("onboarding"); setStep(1);
    setProfile({ goal: "", eventDate: "", level: "", pool: 50, sessionsPerWeek: null });
    setPlan(null); prevBadgesRef.current = [];
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); };

  const goal = GOALS.find(g => g.id === profile.goal);

  if (authLoading) return (
    <>
      <style>{css}</style><FontLoader />
      <div style={{ minHeight: "100vh", background: G.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 48 }}><span className="swimmer">🏊</span></span>
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
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 38, height: 38, background: G.ink, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 19 }}>🏊</span>
                </div>
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 19, color: G.ink }}>AquaPlan</span>
              </div>
              <button onClick={handleSignOut} style={{ background: "none", border: `1px solid ${G.greyLight}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, color: G.grey, cursor: "pointer" }}>Déco.</button>
            </div>
            <Progress step={step} total={4} />
            {error && <div style={{ background: "#FFE8E8", borderRadius: 10, padding: "10px 14px", marginBottom: 16, color: "#CC0000", fontSize: 13 }}>{error}</div>}
            {step === 1 && <Step1_Goal value={profile.goal} onChange={v => update("goal", v)} onNext={() => setStep(2)} />}
            {step === 2 && <Step2_Date value={profile.eventDate} onChange={v => update("eventDate", v)} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
            {step === 3 && <Step3_Level value={profile.level} onChange={v => update("level", v)} pool={profile.pool} onPoolChange={v => update("pool", v)} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
            {step === 4 && <Step4_Frequency value={profile.sessionsPerWeek} onChange={v => update("sessionsPerWeek", v)} onNext={handleGenerate} onBack={() => setStep(3)} />}
          </div>
        </div>
      </div>
    </>
  );

  // Main app with tabs
  const stats = computeStats(plan);
  const earnedBadges = checkBadges(stats);

  return (
    <>
      <style>{css}</style><FontLoader />
      <div style={{ minHeight: "100vh", background: G.bg }}>
        {activeTab === "home"   && <Dashboard plan={plan} profile={profile} onTabChange={setActiveTab} onComplete={handleComplete} onShare={s => setShareSession(s)} onSignOut={handleSignOut} />}
        {activeTab === "plan"   && <PlanTab   plan={plan} profile={profile} onComplete={handleComplete} onShare={s => setShareSession(s)} onReset={handleReset} onUpgrade={handleUpgrade} />}
        {activeTab === "stats"  && <StatsTab  plan={plan} profile={profile} />}
        {activeTab === "badges" && <BadgesTab plan={plan} />}

        <BottomNav active={activeTab} onChange={setActiveTab} newBadge={newBadgeId !== null} />

        {feedbackWeek !== null && (
          <FeedbackModal
            weekNumber={plan.weeks[feedbackWeek]?.number}
            onRate={handleFeedback}
            onSkip={() => setFeedbackWeek(null)}
          />
        )}

        {shareSession && (
          <ShareModal
            session={shareSession}
            goalLabel={goal?.label}
            onClose={() => setShareSession(null)}
          />
        )}

        {newBadgeId && <BadgeToast badgeId={newBadgeId} />}

        {showUpgrade && (
          <UpgradeModal
            onClose={() => setShowUpgrade(false)}
            weeksBlocked={plan?.totalRealWeeks > FREE_MAX_WEEKS ? plan.totalRealWeeks : null}
          />
        )}
      </div>
    </>
  );
}
