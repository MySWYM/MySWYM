import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";

// ── FONTS ──────────────────────────────────────────────────────────────────
const FontLoader = () => {
  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap";
    document.head.appendChild(l);
  }, []);
  return null;
};

// ── STYLES ─────────────────────────────────────────────────────────────────
const G = {
  bg: "#F5F2ED",
  ink: "#0A0A0A",
  blue: "#0057FF",
  blueLight: "#E8EFFE",
  water: "#00B4D8",
  accent: "#FF5733",
  grey: "#8A8A8A",
  greyLight: "#EFEFEF",
  white: "#FFFFFF",
};

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${G.bg}; font-family: 'DM Sans', sans-serif; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
  @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
  @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
  @keyframes swim { 0%{transform:translateX(-8px)} 50%{transform:translateX(8px)} 100%{transform:translateX(-8px)} }
  .fade-up { animation: fadeUp 0.5s ease both; }
  .fade-up-1 { animation: fadeUp 0.5s ease 0.1s both; }
  .fade-up-2 { animation: fadeUp 0.5s ease 0.2s both; }
  .fade-up-3 { animation: fadeUp 0.5s ease 0.3s both; }
  .swimmer { animation: swim 2s ease-in-out infinite; display:inline-block; }
  input[type=date]::-webkit-calendar-picker-indicator { opacity: 0.4; cursor: pointer; }
  select { appearance: none; -webkit-appearance: none; }
  ::-webkit-scrollbar { width: 0; }
`;

// ── GOALS ──────────────────────────────────────────────────────────────────
const GOALS = [
  { id: "triathlon_sprint", label: "Triathlon Sprint", dist: "750m", icon: "🏁" },
  { id: "triathlon_olympic", label: "Triathlon Olympique", dist: "1500m", icon: "🏅" },
  { id: "open_water_5k", label: "Eau libre 5km", icon: "🌊", dist: "5km" },
  { id: "open_water_10k", label: "Eau libre 10km", icon: "🌊", dist: "10km" },
  { id: "competition_50m", label: "Compétition piscine", dist: "50-200m", icon: "🏊" },
  { id: "fitness", label: "Forme & bien-être", dist: "sans objectif", icon: "💪" },
];

const LEVELS = [
  { id: "beginner", label: "Débutant", desc: "Je nage depuis moins d'1 an" },
  { id: "intermediate", label: "Intermédiaire", desc: "Je nage régulièrement depuis 1-3 ans" },
  { id: "advanced", label: "Confirmé", desc: "Je fais des compétitions ou je nage depuis 3+ ans" },
];

const FREQUENCIES = [
  { id: 1, label: "1x / semaine", desc: "Je suis occupé·e" },
  { id: 2, label: "2x / semaine", desc: "Mon rythme idéal" },
  { id: 3, label: "3x / semaine", desc: "Je suis motivé·e" },
  { id: 4, label: "4x et plus", desc: "Je suis sérieux·se" },
];

const POOLS = [
  { id: 25, label: "25m" },
  { id: 50, label: "50m" },
];

// ── UTILS ──────────────────────────────────────────────────────────────────
const weeksUntil = (dateStr) => {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.max(1, Math.ceil(diff / (7 * 86400000)));
};

const formatDuration = (mins) => {
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h${mins % 60 ? (mins % 60).toString().padStart(2, "0") : ""}`;
};

// ── BUTTON ─────────────────────────────────────────────────────────────────
const Btn = ({ children, onClick, variant = "primary", disabled, style: s }) => {
  const base = {
    display: "block", width: "100%", padding: "16px 24px", borderRadius: 14,
    fontSize: 16, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
    cursor: disabled ? "not-allowed" : "pointer", border: "none",
    transition: "all 0.2s", opacity: disabled ? 0.4 : 1, ...s
  };
  const styles = {
    primary: { background: G.ink, color: G.white },
    secondary: { background: G.greyLight, color: G.ink },
    blue: { background: G.blue, color: G.white, boxShadow: "0 8px 24px rgba(0,87,255,0.25)" },
  };
  return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...styles[variant] }}>{children}</button>;
};

// ── PROGRESS BAR ───────────────────────────────────────────────────────────
const Progress = ({ step, total }) => (
  <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} style={{
        flex: 1, height: 4, borderRadius: 2,
        background: i < step ? G.ink : G.greyLight,
        transition: "background 0.3s"
      }} />
    ))}
  </div>
);

// ── ONBOARDING STEPS ───────────────────────────────────────────────────────
const Step1_Goal = ({ value, onChange, onNext }) => (
  <div className="fade-up">
    <p style={{ fontSize: 13, fontWeight: 500, color: G.grey, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Étape 1 sur 4</p>
    <h2 style={{ fontSize: 30, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: G.ink, marginBottom: 8, lineHeight: 1.1 }}>Quel est ton<br />objectif ?</h2>
    <p style={{ color: G.grey, fontSize: 15, marginBottom: 28 }}>On va construire ton plan autour de ça.</p>
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
      {GOALS.map(g => (
        <button key={g.id} onClick={() => onChange(g.id)} style={{
          display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
          borderRadius: 14, border: `2px solid ${value === g.id ? G.ink : G.greyLight}`,
          background: value === g.id ? G.ink : G.white,
          cursor: "pointer", transition: "all 0.2s", textAlign: "left"
        }}>
          <span style={{ fontSize: 24 }}>{g.icon}</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: value === g.id ? G.white : G.ink }}>{g.label}</div>
            <div style={{ fontSize: 12, color: value === g.id ? "rgba(255,255,255,0.6)" : G.grey }}>{g.dist}</div>
          </div>
          {value === g.id && <span style={{ marginLeft: "auto", color: G.white, fontSize: 18 }}>✓</span>}
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
      <p style={{ fontSize: 13, fontWeight: 500, color: G.grey, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Étape 2 sur 4</p>
      <h2 style={{ fontSize: 30, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: G.ink, marginBottom: 8, lineHeight: 1.1 }}>Quelle est la<br />date de l'événement ?</h2>
      <p style={{ color: G.grey, fontSize: 15, marginBottom: 28 }}>On adapte le plan à ton calendrier.</p>
      <div style={{ background: G.white, borderRadius: 16, padding: 20, marginBottom: 16, border: `1px solid ${G.greyLight}` }}>
        <label style={{ fontSize: 12, color: G.grey, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Date de l'événement</label>
        <input type="date" value={value} onChange={e => onChange(e.target.value)}
          min={new Date().toISOString().split("T")[0]}
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
    <p style={{ fontSize: 13, fontWeight: 500, color: G.grey, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Étape 3 sur 4</p>
    <h2 style={{ fontSize: 30, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: G.ink, marginBottom: 8, lineHeight: 1.1 }}>Ton niveau<br />de natation ?</h2>
    <p style={{ color: G.grey, fontSize: 15, marginBottom: 24 }}>Sois honnête — le plan sera meilleur !</p>
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
      {LEVELS.map(l => (
        <button key={l.id} onClick={() => onChange(l.id)} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px", borderRadius: 14, border: `2px solid ${value === l.id ? G.ink : G.greyLight}`,
          background: value === l.id ? G.ink : G.white, cursor: "pointer", transition: "all 0.2s"
        }}>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: value === l.id ? G.white : G.ink }}>{l.label}</div>
            <div style={{ fontSize: 12, color: value === l.id ? "rgba(255,255,255,0.6)" : G.grey }}>{l.desc}</div>
          </div>
          {value === l.id && <span style={{ color: G.white, fontSize: 18 }}>✓</span>}
        </button>
      ))}
    </div>
    <div style={{ marginBottom: 28 }}>
      <p style={{ fontSize: 13, fontWeight: 500, color: G.grey, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Ton bassin habituel</p>
      <div style={{ display: "flex", gap: 10 }}>
        {POOLS.map(p => (
          <button key={p.id} onClick={() => onPoolChange(p.id)} style={{
            flex: 1, padding: "14px", borderRadius: 12, border: `2px solid ${pool === p.id ? G.ink : G.greyLight}`,
            background: pool === p.id ? G.ink : G.white, color: pool === p.id ? G.white : G.ink,
            fontSize: 16, fontWeight: 700, cursor: "pointer", transition: "all 0.2s"
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
    <p style={{ fontSize: 13, fontWeight: 500, color: G.grey, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Étape 4 sur 4</p>
    <h2 style={{ fontSize: 30, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: G.ink, marginBottom: 8, lineHeight: 1.1 }}>Combien de séances<br />par semaine ?</h2>
    <p style={{ color: G.grey, fontSize: 15, marginBottom: 28 }}>On s'adapte à ta vie, pas l'inverse.</p>
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
      {FREQUENCIES.map(f => (
        <button key={f.id} onClick={() => onChange(f.id)} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 18px", borderRadius: 14, border: `2px solid ${value === f.id ? G.blue : G.greyLight}`,
          background: value === f.id ? G.blue : G.white, cursor: "pointer", transition: "all 0.2s"
        }}>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: value === f.id ? G.white : G.ink }}>{f.label}</div>
            <div style={{ fontSize: 12, color: value === f.id ? "rgba(255,255,255,0.7)" : G.grey }}>{f.desc}</div>
          </div>
          {value === f.id && <span style={{ color: G.white, fontSize: 20 }}>✓</span>}
        </button>
      ))}
    </div>
    <Btn variant="blue" onClick={onNext} disabled={!value}>Générer mon plan 🚀</Btn>
    <button onClick={onBack} style={{ width: "100%", marginTop: 10, padding: "12px", background: "none", border: "none", color: G.grey, cursor: "pointer", fontSize: 14 }}>← Retour</button>
  </div>
);

// ── LOADING ────────────────────────────────────────────────────────────────
const Loading = () => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 24 }}>
    <div style={{ fontSize: 56 }}><span className="swimmer">🏊</span></div>
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

// ── PLAN VIEW ──────────────────────────────────────────────────────────────
const SessionCard = ({ session, weekIndex, sessionIndex, onComplete }) => {
  const done = session.completed;
  return (
    <div style={{
      background: done ? G.greyLight : G.white, borderRadius: 14, padding: 16,
      border: `1px solid ${done ? G.greyLight : "#E8E8E8"}`,
      opacity: done ? 0.7 : 1, transition: "all 0.3s"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: G.blue, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>{session.type}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: done ? G.grey : G.ink }}>{session.title}</div>
        </div>
        <button onClick={() => onComplete(weekIndex, sessionIndex)} style={{
          width: 32, height: 32, borderRadius: "50%", border: `2px solid ${done ? G.grey : G.ink}`,
          background: done ? G.grey : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
        }}>
          {done && <span style={{ color: G.white, fontSize: 14 }}>✓</span>}
        </button>
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: session.details ? 12 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 14 }}>📏</span>
          <span style={{ fontSize: 13, color: G.grey }}>{session.distance}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 14 }}>⏱</span>
          <span style={{ fontSize: 13, color: G.grey }}>{formatDuration(session.duration)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 14 }}>🔥</span>
          <span style={{ fontSize: 13, color: G.grey }}>{session.intensity}</span>
        </div>
      </div>
      {session.details && (
        <div style={{ background: G.bg, borderRadius: 10, padding: "10px 12px" }}>
          {session.details.map((d, i) => (
            <div key={i} style={{ fontSize: 13, color: G.grey, lineHeight: 1.6 }}>• {d}</div>
          ))}
        </div>
      )}
    </div>
  );
};

const WeekCard = ({ week, weekIndex, onComplete, isCurrentWeek }) => {
  const [open, setOpen] = useState(isCurrentWeek);
  const done = week.sessions.filter(s => s.completed).length;
  const total = week.sessions.length;

  return (
    <div style={{ background: G.white, borderRadius: 18, overflow: "hidden", border: isCurrentWeek ? `2px solid ${G.blue}` : `1px solid #E8E8E8`, marginBottom: 12 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", padding: "16px 18px", background: "none", border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            {isCurrentWeek && <span style={{ fontSize: 10, fontWeight: 700, color: G.white, background: G.blue, padding: "2px 8px", borderRadius: 20, letterSpacing: 1 }}>CETTE SEMAINE</span>}
            <span style={{ fontSize: 15, fontWeight: 700, color: G.ink }}>Semaine {week.number}</span>
          </div>
          <div style={{ fontSize: 12, color: G.grey }}>{week.focus} · {done}/{total} séances</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: G.greyLight, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <svg width="36" height="36" style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}>
              <circle cx="18" cy="18" r="14" fill="none" stroke={G.greyLight} strokeWidth="3" />
              <circle cx="18" cy="18" r="14" fill="none" stroke={G.blue} strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 14}`}
                strokeDashoffset={`${2 * Math.PI * 14 * (1 - done / total)}`} />
            </svg>
            <span style={{ fontSize: 11, fontWeight: 700, color: G.ink, position: "relative", zIndex: 1 }}>{done}/{total}</span>
          </div>
          <span style={{ color: G.grey, fontSize: 18 }}>{open ? "▲" : "▼"}</span>
        </div>
      </button>
      {open && (
        <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
          {week.sessions.map((s, i) => (
            <SessionCard key={i} session={s} weekIndex={weekIndex} sessionIndex={i} onComplete={onComplete} />
          ))}
          {week.tip && (
            <div style={{ background: "#FFF8E7", borderRadius: 10, padding: "10px 14px", display: "flex", gap: 8 }}>
              <span style={{ fontSize: 16 }}>💡</span>
              <span style={{ fontSize: 13, color: "#8B6914" }}>{week.tip}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const PlanView = ({ plan, profile, onReset, onComplete }) => {
  const goal = GOALS.find(g => g.id === profile.goal);
  const weeks = weeksUntil(profile.eventDate);
  const totalSessions = plan.weeks.reduce((a, w) => a + w.sessions.length, 0);
  const doneSessions = plan.weeks.reduce((a, w) => a + w.sessions.filter(s => s.completed).length, 0);
  const currentWeek = plan.weeks.findIndex(w => !w.sessions.every(s => s.completed));

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background: G.ink, padding: "48px 24px 32px", marginBottom: 24 }}>
        <div className="fade-up" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Ton plan personnalisé</div>
        <h1 className="fade-up-1" style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: G.white, marginBottom: 4, lineHeight: 1.1 }}>{goal?.label}</h1>
        <p className="fade-up-2" style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginBottom: 24 }}>{weeks} semaines · {profile.sessionsPerWeek}x/semaine · {LEVELS.find(l => l.id === profile.level)?.label}</p>
        <div className="fade-up-3" style={{ display: "flex", gap: 16 }}>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: G.white }}>{doneSessions}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 1, textTransform: "uppercase" }}>Séances faites</div>
          </div>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: G.white }}>{totalSessions - doneSessions}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 1, textTransform: "uppercase" }}>Restantes</div>
          </div>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: G.blue }}>{Math.round(doneSessions / totalSessions * 100)}%</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 1, textTransform: "uppercase" }}>Progression</div>
          </div>
        </div>
      </div>

      {/* Weeks */}
      <div style={{ padding: "0 16px" }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: G.ink, marginBottom: 16 }}>Programme semaine par semaine</h2>
        {plan.weeks.map((week, i) => (
          <WeekCard key={i} week={week} weekIndex={i} onComplete={onComplete} isCurrentWeek={i === currentWeek} />
        ))}
        <button onClick={onReset} style={{
          width: "100%", marginTop: 16, padding: "14px", background: "none",
          border: `1px solid ${G.greyLight}`, borderRadius: 12, color: G.grey,
          cursor: "pointer", fontSize: 14
        }}>🔄 Recommencer l'onboarding</button>
      </div>
    </div>
  );
};

// ── LOCAL PLAN GENERATOR ───────────────────────────────────────────────────
const BASE_DISTANCES = {
  beginner:     { endurance: 1200, seuil: 1000, vitesse: 800,  technique: 1000, récupération: 800  },
  intermediate: { endurance: 2000, seuil: 1800, vitesse: 1500, technique: 1600, récupération: 1200 },
  advanced:     { endurance: 3000, seuil: 2500, vitesse: 2000, technique: 2200, récupération: 1500 },
};

const SESSION_TEMPLATES = {
  endurance: (dist, pool) => ({
    type: "ENDURANCE", title: "Endurance fondamentale", intensity: "Faible",
    details: [
      `Échauffement: 200m crawl lent`,
      `Série principale: ${Math.round(dist * 0.6 / 100) * 100}m en continu ou fractionné 4x${Math.round(dist * 0.15 / 50) * 50}m`,
      `Éducatifs: 4x${pool}m (pull-buoy ou planche)`,
      `Retour au calme: 200m dos lent`,
    ]
  }),
  seuil: (dist, pool) => ({
    type: "SEUIL", title: "Travail au seuil", intensity: "Modérée",
    details: [
      `Échauffement: 400m progressif`,
      `Série seuil: 6x${Math.round(dist * 0.1 / 50) * 50}m récup 20sec`,
      `Série complémentaire: 4x${pool}m sprint`,
      `Retour au calme: 200m crawl lent`,
    ]
  }),
  vitesse: (dist, pool) => ({
    type: "VITESSE", title: "Vitesse & puissance", intensity: "Élevée",
    details: [
      `Échauffement: 300m varié (crawl/dos/brasse)`,
      `Sprints: 8x${pool}m départ toutes les 2 min`,
      `Série lactique: 4x${Math.round(dist * 0.08 / 50) * 50}m effort max`,
      `Retour au calme: 300m très lent`,
    ]
  }),
  technique: (dist, pool) => ({
    type: "TECHNIQUE", title: "Technique & qualité", intensity: "Faible",
    details: [
      `Échauffement: 200m en se concentrant sur le coulé`,
      `Éducatifs: 10x${pool}m (catch-up, fingertip drag, zipper)`,
      `Nage complète: ${Math.round(dist * 0.5 / 100) * 100}m en comptant ses cycles`,
      `Retour au calme: 200m dos`,
    ]
  }),
  récupération: (dist, pool) => ({
    type: "RÉCUPÉRATION", title: "Récupération active", intensity: "Très faible",
    details: [
      `Nage libre et détendue: ${dist}m`,
      `Aucune contrainte de temps ou d'allure`,
      `Mixer les nages selon ton envie`,
      `Se concentrer sur la respiration et la détente`,
    ]
  }),
};

const WEEK_PATTERNS = {
  1: ["endurance"],
  2: ["endurance", "technique"],
  3: ["endurance", "seuil", "technique"],
  4: ["endurance", "seuil", "vitesse", "récupération"],
};

const PHASE_PLANS = [
  { focus: "Mise en jambes", progression: 1.0, tipKey: "debut" },
  { focus: "Construction aérobie", progression: 1.1, tipKey: "aerobie" },
  { focus: "Développement endurance", progression: 1.2, tipKey: "endurance" },
  { focus: "Travail au seuil", progression: 1.25, tipKey: "seuil" },
  { focus: "Intensité & vitesse", progression: 1.3, tipKey: "vitesse" },
  { focus: "Volume maximum", progression: 1.35, tipKey: "volume" },
  { focus: "Affûtage", progression: 1.1, tipKey: "affutage" },
  { focus: "Semaine de compétition", progression: 0.7, tipKey: "competition" },
];

const TIPS = {
  debut: "Commence doucement, l'objectif est de reprendre tes marques dans l'eau. La régularité prime sur l'intensité.",
  aerobie: "Concentre-toi sur ta technique de respiration. Un bon rythme respiratoire améliore ton endurance de 20%.",
  endurance: "Essaie de nager sans t'arrêter pendant les séries longues. Si tu dois t'arrêter, c'est que tu vas trop vite.",
  seuil: "Le travail au seuil doit être inconfortable mais supportable. Tu dois pouvoir dire quelques mots mais pas tenir une conversation.",
  vitesse: "Pour les sprints, repose-toi complètement entre chaque répétition. La qualité prime sur la quantité.",
  volume: "C'est ta semaine de charge maximale. Mange bien, dors bien, c'est là que tu progresses le plus.",
  affutage: "Réduis le volume mais garde l'intensité. Ton corps se repose tout en restant en forme.",
  competition: "Dernière ligne droite ! Nage léger, visualise ta course et fais confiance à ton entraînement.",
};

const generatePlan = async (profile) => {
  await new Promise(r => setTimeout(r, 1800)); // simulation délai réaliste

  const level = profile.level;
  const freq = profile.sessionsPerWeek;
  const pool = profile.pool;
  const totalWeeks = Math.min(weeksUntil(profile.eventDate), 8);
  const baseDist = BASE_DISTANCES[level];
  const pattern = WEEK_PATTERNS[Math.min(freq, 4)];

  const weeks = Array.from({ length: totalWeeks }, (_, wi) => {
    const phaseIndex = Math.min(wi, PHASE_PLANS.length - 1);
    const phase = PHASE_PLANS[phaseIndex];
    const progression = phase.progression;

    const sessions = pattern.map((type, si) => {
      const distBase = Math.round(baseDist[type] * progression / 50) * 50;
      const template = SESSION_TEMPLATES[type](distBase, pool);
      const duration = Math.round(distBase / 40); // ~40m/min
      return {
        ...template,
        distance: `${distBase}m`,
        duration: Math.max(30, Math.min(90, duration)),
        completed: false,
      };
    });

    return {
      number: wi + 1,
      focus: phase.focus,
      tip: TIPS[phase.tipKey],
      sessions,
    };
  });

  return { weeks };
};

// ── AUTH SCREEN ───────────────────────────────────────────────────────────
const AuthScreen = ({ onAuth }) => {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuth(data.user);
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user && !data.user.identities?.length) {
          setError("Un compte existe déjà avec cet email.");
        } else {
          setSuccess("Compte créé ! Vérifie ton email pour confirmer, puis connecte-toi.");
          setMode("login");
        }
      }
    } catch (e) {
      setError(e.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${G.greyLight}`,
    fontSize: 15, fontFamily: "'DM Sans', sans-serif", background: G.white, color: G.ink,
    outline: "none", transition: "border 0.2s",
  };

  return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "0 20px", paddingTop: 72, paddingBottom: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 48 }}>
        <div style={{ width: 36, height: 36, background: G.ink, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 18 }}>&#x1F3CA;</span>
        </div>
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: G.ink }}>AquaPlan</span>
      </div>

      <div className="fade-up">
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 30, fontWeight: 800, color: G.ink, marginBottom: 8, lineHeight: 1.1 }}>
          {mode === "login" ? "Bon retour !" : "Crée ton compte"}
        </h2>
        <p style={{ color: G.grey, fontSize: 15, marginBottom: 32 }}>
          {mode === "login" ? "Connecte-toi pour accéder à ton plan." : "Rejoins AquaPlan gratuitement."}
        </p>

        {error && (
          <div style={{ background: "#FFE8E8", borderRadius: 10, padding: "10px 14px", marginBottom: 16, color: "#CC0000", fontSize: 13 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: "#E8F5E9", borderRadius: 10, padding: "10px 14px", marginBottom: 16, color: "#2E7D32", fontSize: 13 }}>
            {success}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
          <input
            type="email" placeholder="Ton email" value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            style={inputStyle}
          />
          <input
            type="password" placeholder="Mot de passe" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            style={inputStyle}
          />
        </div>

        <Btn onClick={handleSubmit} disabled={loading || !email || !password}>
          {loading ? "..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
        </Btn>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: G.grey }}>
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

// APP
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [screen, setScreen] = useState("onboarding");
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({ goal: "", eventDate: "", level: "", pool: 50, sessionsPerWeek: null });
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);

  // Vérification de la session au démarrage
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) loadUserData(u.id);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (!u) {
        setScreen("onboarding");
        setStep(1);
        setProfile({ goal: "", eventDate: "", level: "", pool: 50, sessionsPerWeek: null });
        setPlan(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId) => {
    try {
      const savedProfile = localStorage.getItem(`aquaplan_profile_${userId}`);
      const savedPlan = localStorage.getItem(`aquaplan_plan_${userId}`);
      if (savedProfile && savedPlan) {
        setProfile(JSON.parse(savedProfile));
        setPlan(JSON.parse(savedPlan));
        setScreen("plan");
      }
    } catch (e) {}
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // Sauvegarde automatique à chaque changement du plan
  useEffect(() => {
    if (plan && profile.goal && user) {
      try {
        localStorage.setItem(`aquaplan_profile_${user.id}`, JSON.stringify(profile));
        localStorage.setItem(`aquaplan_plan_${user.id}`, JSON.stringify(plan));
      } catch (e) {}
    }
  }, [plan, profile, user]);

  const update = (key, val) => setProfile(p => ({ ...p, [key]: val }));

  const handleGenerate = async () => {
    setScreen("loading");
    setError(null);
    try {
      const p = await generatePlan(profile);
      setPlan(p);
      setScreen("plan");
    } catch (e) {
      setError("Impossible de generer le plan. Reessaie !");
      setScreen("onboarding");
      setStep(4);
    }
  };

  const handleComplete = (weekIndex, sessionIndex) => {
    setPlan(prev => {
      const next = { ...prev, weeks: prev.weeks.map((w, wi) => wi !== weekIndex ? w : {
        ...w, sessions: w.sessions.map((s, si) => si !== sessionIndex ? s : { ...s, completed: !s.completed })
      })};
      return next;
    });
  };

  const handleReset = () => {
    if (user) {
      localStorage.removeItem(`aquaplan_profile_${user.id}`);
      localStorage.removeItem(`aquaplan_plan_${user.id}`);
    }
    setScreen("onboarding");
    setStep(1);
    setProfile({ goal: "", eventDate: "", level: "", pool: 50, sessionsPerWeek: null });
    setPlan(null);
  };

  if (authLoading) {
    return (
      <>
        <style>{css}</style>
        <FontLoader />
        <div style={{ minHeight: "100vh", background: G.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 40 }}><span className="swimmer">🏊</span></span>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <style>{css}</style>
        <FontLoader />
        <div style={{ minHeight: "100vh", background: G.bg }}>
          <AuthScreen onAuth={setUser} />
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>
      <FontLoader />
      <div style={{ minHeight: "100vh", background: G.bg }}>
        {screen === "plan" ? (
          <div>
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 16px 0" }}>
              <button onClick={handleSignOut} style={{ background: "none", border: `1px solid ${G.greyLight}`, borderRadius: 8, padding: "6px 14px", fontSize: 13, color: G.grey, cursor: "pointer" }}>
                Déconnexion
              </button>
            </div>
            <PlanView plan={plan} profile={profile} onReset={handleReset} onComplete={handleComplete} />
          </div>
        ) : (
          <div style={{ maxWidth: 440, margin: "0 auto", padding: "0 20px" }}>
            {screen === "loading" ? (
              <Loading />
            ) : (
              <div style={{ paddingTop: 56, paddingBottom: 40 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 36, height: 36, background: G.ink, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 18 }}>&#x1F3CA;</span>
                    </div>
                    <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: G.ink }}>AquaPlan</span>
                  </div>
                  <button onClick={handleSignOut} style={{ background: "none", border: `1px solid ${G.greyLight}`, borderRadius: 8, padding: "6px 14px", fontSize: 13, color: G.grey, cursor: "pointer" }}>
                    Déconnexion
                  </button>
                </div>

                <Progress step={step} total={4} />

                {error && (
                  <div style={{ background: "#FFE8E8", borderRadius: 10, padding: "10px 14px", marginBottom: 16, color: "#CC0000", fontSize: 13 }}>
                    {error}
                  </div>
                )}

                {step === 1 && <Step1_Goal value={profile.goal} onChange={v => update("goal", v)} onNext={() => setStep(2)} />}
                {step === 2 && <Step2_Date value={profile.eventDate} onChange={v => update("eventDate", v)} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
                {step === 3 && <Step3_Level value={profile.level} onChange={v => update("level", v)} pool={profile.pool} onPoolChange={v => update("pool", v)} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
                {step === 4 && <Step4_Frequency value={profile.sessionsPerWeek} onChange={v => update("sessionsPerWeek", v)} onNext={handleGenerate} onBack={() => setStep(3)} />}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
