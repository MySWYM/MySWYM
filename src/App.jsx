import { useState, useEffect } from "react";

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

// ── AI PLAN GENERATOR ──────────────────────────────────────────────────────
const generatePlan = async (profile) => {
  const goal = GOALS.find(g => g.id === profile.goal);
  const level = LEVELS.find(l => l.id === profile.level);
  const weeks = weeksUntil(profile.eventDate);

  const prompt = `Tu es un coach de natation expert. Génère un plan d'entraînement de natation en JSON.

Profil nageur:
- Objectif: ${goal?.label} (${goal?.dist})
- Niveau: ${level?.label}
- Semaines disponibles: ${weeks}
- Séances par semaine: ${profile.sessionsPerWeek}
- Bassin: ${profile.pool}m

Génère exactement ${Math.min(weeks, 8)} semaines de plan. Réponds UNIQUEMENT avec ce JSON, sans texte avant ou après:

{
  "weeks": [
    {
      "number": 1,
      "focus": "Endurance de base",
      "tip": "Conseil pratique pour cette semaine",
      "sessions": [
        {
          "type": "ENDURANCE",
          "title": "Titre court de la séance",
          "distance": "1200m",
          "duration": 45,
          "intensity": "Faible",
          "completed": false,
          "details": ["Échauffement: 200m crawl lent", "Série principale: 4x200m", "Retour au calme: 200m dos"]
        }
      ]
    }
  ]
}

Types de séances possibles: ENDURANCE, VITESSE, TECHNIQUE, RÉCUPÉRATION, SEUIL
Intensités: Faible, Modérée, Élevée
Adapte les distances au niveau ${level?.label} et à l'objectif ${goal?.label}.
Chaque semaine doit avoir exactement ${profile.sessionsPerWeek} séances.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await response.json();
  const text = data.content?.[0]?.text || "";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
};

// ── APP ────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("onboarding"); // onboarding | loading | plan
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({ goal: "", eventDate: "", level: "", pool: 50, sessionsPerWeek: null });
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);

  const update = (key, val) => setProfile(p => ({ ...p, [key]: val }));

  const handleGenerate = async () => {
    setScreen("loading");
    setError(null);
    try {
      const p = await generatePlan(profile);
      setPlan(p);
      setScreen("plan");
    } catch (e) {
      setError("Impossible de générer le plan. Réessaie !");
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
    setScreen("onboarding");
    setStep(1);
    setProfile({ goal: "", eventDate: "", level: "", pool: 50, sessionsPerWeek: null });
    setPlan(null);
  };

  return (
    <>
      <style>{css}</style>
      <FontLoader />
      <div style={{ minHeight: "100vh", background: G.bg }}>
        {screen === "plan" ? (
          <PlanView plan={plan} profile={profile} onReset={handleReset} onComplete={handleComplete} />
        ) : (
          <div style={{ maxWidth: 440, margin: "0 auto", padding: "0 20px" }}>
            {screen === "loading" ? (
              <Loading />
            ) : (
              <div style={{ paddingTop: 56, paddingBottom: 40 }}>
                {/* Logo */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 40 }}>
                  <div style={{ width: 36, height: 36, background: G.ink, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 18 }}>🏊</span>
                  </div>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: G.ink }}>AquaPlan</span>
                </div>

                <Progress step={step} total={4} />

                {error && (
                  <div style={{ background: "#FFE8E8", borderRadius: 10, padding: "10px 14px", marginBottom: 16, color: "#CC0000", fontSize: 13 }}>
                    ⚠️ {error}
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
