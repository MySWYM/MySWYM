import { useState, useEffect, useRef } from "react";

const POOL_LENGTHS = [25, 50];

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const formatPace = (seconds, meters) => {
  if (!meters || !seconds) return "--:--";
  const paceSeconds = (seconds / meters) * 100;
  return formatTime(Math.round(paceSeconds));
};

const INITIAL_SESSIONS = [
  { id: 1, date: "2026-04-20", distance: 2000, duration: 2520, laps: 40, pool: 50, style: "Crawl", calories: 380 },
  { id: 2, date: "2026-04-17", distance: 1500, duration: 2100, laps: 60, pool: 25, style: "Dos", calories: 290 },
  { id: 3, date: "2026-04-14", distance: 2500, duration: 3300, laps: 50, pool: 50, style: "Crawl", calories: 470 },
  { id: 4, date: "2026-04-10", distance: 1800, duration: 2520, laps: 72, pool: 25, style: "Brasse", calories: 340 },
  { id: 5, date: "2026-04-07", distance: 3000, duration: 3900, laps: 60, pool: 50, style: "Crawl", calories: 580 },
];

const STYLES = ["Crawl", "Dos", "Brasse", "Papillon", "4 nages"];

const WaveBackground = () => (
  <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", background: "linear-gradient(160deg, #020d1a 0%, #041e36 40%, #052d50 100%)" }}>
    <svg style={{ position: "absolute", bottom: 0, width: "200%", animation: "wave1 8s linear infinite" }} viewBox="0 0 1440 120" preserveAspectRatio="none" height="120">
      <path d="M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z" fill="rgba(0,140,255,0.06)" />
    </svg>
    <svg style={{ position: "absolute", bottom: 0, width: "200%", animation: "wave2 11s linear infinite reverse" }} viewBox="0 0 1440 120" preserveAspectRatio="none" height="100">
      <path d="M0,40 C360,80 720,10 1080,50 C1260,70 1350,30 1440,40 L1440,120 L0,120 Z" fill="rgba(0,180,255,0.04)" />
    </svg>
    <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 30%, rgba(0,120,255,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(0,200,255,0.06) 0%, transparent 50%)" }} />
    <style>{`
      @keyframes wave1 { from{transform:translateX(0)} to{transform:translateX(-50%)} }
      @keyframes wave2 { from{transform:translateX(0)} to{transform:translateX(-50%)} }
      @keyframes pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
      @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      @keyframes ripple { 0%{transform:scale(0.8);opacity:1} 100%{transform:scale(2.4);opacity:0} }
      @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
    `}</style>
  </div>
);

const StatCard = ({ label, value, unit, sub, color = "#00b4ff", delay = 0 }) => (
  <div style={{
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(0,180,255,0.15)",
    borderRadius: 16,
    padding: "20px 22px",
    backdropFilter: "blur(12px)",
    animation: `slideUp 0.5s ease ${delay}s both`,
    position: "relative",
    overflow: "hidden"
  }}>
    <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle at top right, ${color}18 0%, transparent 70%)` }} />
    <div style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: "rgba(180,220,255,0.5)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
      <span style={{ fontSize: 32, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: "#fff", lineHeight: 1 }}>{value}</span>
      {unit && <span style={{ fontSize: 14, color: color, fontFamily: "'Space Mono', monospace" }}>{unit}</span>}
    </div>
    {sub && <div style={{ fontSize: 11, color: "rgba(180,220,255,0.4)", marginTop: 6, fontFamily: "'Space Mono', monospace" }}>{sub}</div>}
  </div>
);

const NavItem = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} style={{
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    padding: "10px 20px", background: "none", border: "none", cursor: "pointer",
    color: active ? "#00b4ff" : "rgba(180,220,255,0.35)",
    transition: "color 0.2s",
    position: "relative"
  }}>
    {active && <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 30, height: 2, background: "#00b4ff", borderRadius: 2 }} />}
    <span style={{ fontSize: 20 }}>{icon}</span>
    <span style={{ fontSize: 9, fontFamily: "'Space Mono', monospace", letterSpacing: 1, textTransform: "uppercase" }}>{label}</span>
  </button>
);

// ── DASHBOARD ──────────────────────────────────────────────────────────────
const Dashboard = ({ sessions }) => {
  const totalDist = sessions.reduce((a, s) => a + s.distance, 0);
  const totalTime = sessions.reduce((a, s) => a + s.duration, 0);
  const totalCal = sessions.reduce((a, s) => a + s.calories, 0);
  const avgPace = formatPace(totalTime, totalDist);
  const lastSession = sessions[0];
  const weekSessions = sessions.filter(s => {
    const d = new Date(s.date);
    const now = new Date();
    return (now - d) / 86400000 <= 7;
  });

  const weekDays = ["L", "M", "M", "J", "V", "S", "D"];
  const barData = [1200, 0, 1800, 0, 2000, 0, 2500];
  const maxBar = Math.max(...barData);

  return (
    <div style={{ padding: "0 20px 100px" }}>
      {/* Header */}
      <div style={{ padding: "50px 0 28px", animation: "slideUp 0.4s ease both" }}>
        <div style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: "rgba(0,180,255,0.6)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 6 }}>Bonjour, Nageur 👋</div>
        <h1 style={{ fontSize: 34, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, color: "#fff", margin: 0, letterSpacing: -0.5 }}>Ton tableau de bord</h1>
      </div>

      {/* Ticker strip */}
      <div style={{ overflow: "hidden", background: "rgba(0,180,255,0.08)", border: "1px solid rgba(0,180,255,0.12)", borderRadius: 8, padding: "8px 0", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 40, animation: "ticker 20s linear infinite", whiteSpace: "nowrap" }}>
          {[...Array(2)].map((_, i) => (
            <div key={i} style={{ display: "flex", gap: 40 }}>
              {["🏊 Objectif semaine: 5km", "⚡ Meilleure allure: 1:42/100m", "🔥 Série: 3 séances", "💧 4 nageurs actifs près de toi"].map((t, j) => (
                <span key={j} style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: "rgba(0,200,255,0.7)", letterSpacing: 1 }}>{t}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <StatCard label="Distance totale" value={(totalDist / 1000).toFixed(1)} unit="km" sub={`${sessions.length} séances`} delay={0.05} />
        <StatCard label="Temps total" value={Math.round(totalTime / 3600 * 10) / 10} unit="h" sub={formatTime(totalTime)} color="#00e5ff" delay={0.1} />
        <StatCard label="Allure moy." value={avgPace} unit="/100m" sub="tous styles" color="#00ffb4" delay={0.15} />
        <StatCard label="Calories" value={totalCal} unit="kcal" sub="cette semaine" color="#ff6b35" delay={0.2} />
      </div>

      {/* Weekly chart */}
      <div style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,180,255,0.12)",
        borderRadius: 16, padding: "20px", marginBottom: 20, animation: "slideUp 0.5s ease 0.25s both"
      }}>
        <div style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: "rgba(180,220,255,0.5)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Cette semaine</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
          {barData.map((v, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: "100%", height: v ? `${(v / maxBar) * 68}px` : 4,
                background: v ? "linear-gradient(180deg, #00b4ff, #0050a0)" : "rgba(255,255,255,0.06)",
                borderRadius: "4px 4px 2px 2px",
                transition: "height 0.8s ease",
                boxShadow: v ? "0 0 12px rgba(0,180,255,0.3)" : "none"
              }} />
              <span style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color: "rgba(180,220,255,0.4)" }}>{weekDays[i]}</span>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, fontFamily: "'Space Mono', monospace", color: "rgba(0,180,255,0.6)" }}>
          {weekSessions.length} séance(s) · {weekSessions.reduce((a, s) => a + s.distance, 0) / 1000} km
        </div>
      </div>

      {/* Last session */}
      {lastSession && (
        <div style={{
          background: "linear-gradient(135deg, rgba(0,80,160,0.3), rgba(0,20,60,0.3))",
          border: "1px solid rgba(0,180,255,0.25)", borderRadius: 16, padding: 20,
          animation: "slideUp 0.5s ease 0.3s both"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: "rgba(180,220,255,0.5)", letterSpacing: 2, textTransform: "uppercase" }}>Dernière séance</div>
            <div style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color: "rgba(0,180,255,0.5)" }}>{lastSession.date}</div>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <div>
              <div style={{ fontSize: 28, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: "#fff" }}>{lastSession.distance}m</div>
              <div style={{ fontSize: 11, color: "rgba(180,220,255,0.4)", fontFamily: "'Space Mono', monospace" }}>{lastSession.style} · {lastSession.pool}m</div>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div style={{ fontSize: 20, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: "#00b4ff" }}>{formatPace(lastSession.duration, lastSession.distance)}</div>
              <div style={{ fontSize: 11, color: "rgba(180,220,255,0.4)", fontFamily: "'Space Mono', monospace" }}>/ 100m</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── CHRONO ─────────────────────────────────────────────────────────────────
const Chrono = ({ onSave }) => {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [laps, setLaps] = useState([]);
  const [pool, setPool] = useState(50);
  const [style, setStyle] = useState("Crawl");
  const [saved, setSaved] = useState(false);
  const interval = useRef(null);

  useEffect(() => {
    if (running) {
      interval.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(interval.current);
    }
    return () => clearInterval(interval.current);
  }, [running]);

  const totalDist = laps.length * pool;
  const currentLapTime = laps.length > 0 ? elapsed - laps.reduce((a, l) => a + l, 0) : elapsed;

  const addLap = () => {
    if (!running) return;
    setLaps(prev => [...prev, elapsed - prev.reduce((a, l) => a + l, 0)]);
  };

  const reset = () => {
    setRunning(false);
    setElapsed(0);
    setLaps([]);
    setSaved(false);
  };

  const handleSave = () => {
    if (totalDist === 0) return;
    onSave({ distance: totalDist, duration: elapsed, laps: laps.length, pool, style, calories: Math.round(totalDist * 0.19) });
    setSaved(true);
    reset();
  };

  const progress = (currentLapTime / (pool === 25 ? 45 : 80)) * 100;

  return (
    <div style={{ padding: "40px 20px 100px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: "rgba(0,180,255,0.6)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 6, alignSelf: "flex-start" }}>Enregistrement</div>
      <h2 style={{ fontSize: 28, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, color: "#fff", margin: "0 0 28px", alignSelf: "flex-start" }}>Nouvelle séance</h2>

      {/* Config */}
      <div style={{ display: "flex", gap: 10, marginBottom: 32, width: "100%" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, fontFamily: "'Space Mono', monospace", color: "rgba(180,220,255,0.4)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Bassin</div>
          <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(0,180,255,0.2)" }}>
            {POOL_LENGTHS.map(l => (
              <button key={l} onClick={() => setPool(l)} style={{
                flex: 1, padding: "10px 0", border: "none", cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700,
                background: pool === l ? "rgba(0,180,255,0.25)" : "rgba(255,255,255,0.03)",
                color: pool === l ? "#00b4ff" : "rgba(180,220,255,0.4)", transition: "all 0.2s"
              }}>{l}m</button>
            ))}
          </div>
        </div>
        <div style={{ flex: 2 }}>
          <div style={{ fontSize: 9, fontFamily: "'Space Mono', monospace", color: "rgba(180,220,255,0.4)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Nage</div>
          <select value={style} onChange={e => setStyle(e.target.value)} style={{
            width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(0,180,255,0.2)",
            background: "rgba(255,255,255,0.04)", color: "#fff", fontFamily: "'Space Mono', monospace", fontSize: 11, cursor: "pointer"
          }}>
            {STYLES.map(s => <option key={s} value={s} style={{ background: "#041e36" }}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Big timer */}
      <div style={{ position: "relative", marginBottom: 32 }}>
        <svg width={240} height={240} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={120} cy={120} r={108} fill="none" stroke="rgba(0,180,255,0.08)" strokeWidth={6} />
          <circle cx={120} cy={120} r={108} fill="none" stroke="#00b4ff" strokeWidth={6}
            strokeDasharray={`${2 * Math.PI * 108}`}
            strokeDashoffset={`${2 * Math.PI * 108 * (1 - Math.min(progress, 100) / 100)}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease", filter: "drop-shadow(0 0 8px rgba(0,180,255,0.6))" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 52, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: "#fff", lineHeight: 1, letterSpacing: -1 }}>{formatTime(elapsed)}</div>
          <div style={{ fontSize: 13, fontFamily: "'Space Mono', monospace", color: "rgba(0,180,255,0.6)", marginTop: 6 }}>{totalDist}m · {laps.length} lg</div>
          {laps.length > 0 && <div style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: "rgba(180,220,255,0.4)", marginTop: 4 }}>Allure: {formatPace(elapsed, totalDist)}/100m</div>}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
        <button onClick={addLap} disabled={!running} style={{
          width: 64, height: 64, borderRadius: "50%", border: "2px solid rgba(0,180,255,0.3)",
          background: "rgba(0,180,255,0.08)", color: running ? "#00b4ff" : "rgba(0,180,255,0.2)", fontSize: 22, cursor: running ? "pointer" : "default", transition: "all 0.2s"
        }}>🔄</button>
        <button onClick={() => setRunning(r => !r)} style={{
          width: 80, height: 80, borderRadius: "50%", border: "none",
          background: running ? "linear-gradient(135deg, #ff4757, #c0392b)" : "linear-gradient(135deg, #00b4ff, #0062cc)",
          color: "#fff", fontSize: 28, cursor: "pointer",
          boxShadow: running ? "0 0 30px rgba(255,71,87,0.4)" : "0 0 30px rgba(0,180,255,0.4)",
          transition: "all 0.3s"
        }}>{running ? "⏸" : "▶"}</button>
        <button onClick={reset} style={{
          width: 64, height: 64, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.04)", color: "rgba(180,220,255,0.4)", fontSize: 22, cursor: "pointer"
        }}>↺</button>
      </div>

      {/* Lap list */}
      {laps.length > 0 && (
        <div style={{ width: "100%", background: "rgba(255,255,255,0.03)", borderRadius: 14, padding: 16, marginBottom: 20, maxHeight: 160, overflowY: "auto" }}>
          {laps.map((t, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < laps.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
              <span style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: "rgba(180,220,255,0.5)" }}>Longueur {i + 1} · {pool}m</span>
              <span style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: "#00b4ff" }}>{formatTime(t)}</span>
            </div>
          ))}
        </div>
      )}

      {!running && elapsed > 0 && !saved && (
        <button onClick={handleSave} style={{
          width: "100%", padding: "16px", borderRadius: 14, border: "none",
          background: "linear-gradient(90deg, #00b4ff, #00e5ff)", color: "#020d1a",
          fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 18, cursor: "pointer",
          letterSpacing: 1, boxShadow: "0 8px 24px rgba(0,180,255,0.3)"
        }}>💾 ENREGISTRER LA SÉANCE</button>
      )}
    </div>
  );
};

// ── HISTORY ─────────────────────────────────────────────────────────────────
const History = ({ sessions }) => {
  const [filter, setFilter] = useState("Tous");
  const filtered = filter === "Tous" ? sessions : sessions.filter(s => s.style === filter);

  return (
    <div style={{ padding: "40px 20px 100px" }}>
      <div style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: "rgba(0,180,255,0.6)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 6 }}>Historique</div>
      <h2 style={{ fontSize: 28, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, color: "#fff", margin: "0 0 20px" }}>Mes séances</h2>

      {/* Filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
        {["Tous", ...STYLES].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "7px 14px", borderRadius: 20, border: "1px solid",
            borderColor: filter === f ? "#00b4ff" : "rgba(0,180,255,0.15)",
            background: filter === f ? "rgba(0,180,255,0.2)" : "transparent",
            color: filter === f ? "#00b4ff" : "rgba(180,220,255,0.4)",
            fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: 1, cursor: "pointer", whiteSpace: "nowrap"
          }}>{f}</button>
        ))}
      </div>

      {/* Session cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map((s, i) => (
          <div key={s.id} style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,180,255,0.12)",
            borderRadius: 14, padding: 16, animation: `slideUp 0.4s ease ${i * 0.05}s both`,
            display: "flex", gap: 16, alignItems: "center"
          }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(0,180,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
              {s.style === "Crawl" ? "🏊" : s.style === "Dos" ? "🤽" : s.style === "Brasse" ? "🏊‍♂️" : s.style === "Papillon" ? "🦋" : "🎯"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: "#fff", fontSize: 17 }}>{s.style} · {s.pool}m</span>
                <span style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color: "rgba(180,220,255,0.4)" }}>{s.date}</span>
              </div>
              <div style={{ display: "flex", gap: 14 }}>
                <span style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: "#00b4ff" }}>{s.distance}m</span>
                <span style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: "rgba(180,220,255,0.4)" }}>{formatTime(s.duration)}</span>
                <span style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: "rgba(0,255,180,0.6)" }}>{formatPace(s.duration, s.distance)}/100m</span>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "rgba(180,220,255,0.3)", fontFamily: "'Space Mono', monospace", fontSize: 12 }}>Aucune séance pour ce filtre</div>
        )}
      </div>
    </div>
  );
};

// ── PROGRESS ────────────────────────────────────────────────────────────────
const Progress = ({ sessions }) => {
  const best = sessions.reduce((b, s) => {
    const pace = s.duration / s.distance * 100;
    return (!b || pace < b.pace) ? { ...s, pace } : b;
  }, null);
  const styles = [...new Set(sessions.map(s => s.style))];
  const styleStats = styles.map(st => {
    const ss = sessions.filter(s => s.style === st);
    return { style: st, count: ss.length, dist: ss.reduce((a, s) => a + s.distance, 0), bestPace: Math.min(...ss.map(s => s.duration / s.distance * 100)) };
  });

  const achievements = [
    { icon: "🏅", label: "Premier kilomètre", done: true, desc: "Nage 1000m en une séance" },
    { icon: "⚡", label: "Speed Demon", done: sessions.some(s => (s.duration / s.distance * 100) < 100), desc: "Allure sous 1:40/100m" },
    { icon: "🔥", label: "Série de 3", done: true, desc: "3 séances en 7 jours" },
    { icon: "🌊", label: "Grand bain", done: sessions.some(s => s.distance >= 2500), desc: "Dépasser 2500m" },
    { icon: "🦋", label: "Papillon", done: sessions.some(s => s.style === "Papillon"), desc: "Nager en papillon" },
    { icon: "🏆", label: "Marathon nageur", done: false, desc: "Atteindre 50km au total" },
  ];

  return (
    <div style={{ padding: "40px 20px 100px" }}>
      <div style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: "rgba(0,180,255,0.6)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 6 }}>Progression</div>
      <h2 style={{ fontSize: 28, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, color: "#fff", margin: "0 0 24px" }}>Mes performances</h2>

      {best && (
        <div style={{
          background: "linear-gradient(135deg, rgba(0,100,200,0.3), rgba(0,50,120,0.3))",
          border: "1px solid rgba(0,180,255,0.3)", borderRadius: 16, padding: 20, marginBottom: 20
        }}>
          <div style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color: "rgba(0,180,255,0.6)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>🏆 Meilleure allure</div>
          <div style={{ fontSize: 40, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, color: "#fff" }}>{formatTime(Math.round(best.pace))}<span style={{ fontSize: 16, color: "#00b4ff", marginLeft: 4 }}>/100m</span></div>
          <div style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: "rgba(180,220,255,0.4)", marginTop: 4 }}>{best.style} · {best.distance}m · {best.date}</div>
        </div>
      )}

      {/* By style */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: "rgba(180,220,255,0.5)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Par nage</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {styleStats.map(st => (
            <div key={st.style} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,180,255,0.1)", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: "#fff", fontSize: 16 }}>{st.style}</span>
                <span style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color: "rgba(0,180,255,0.6)" }}>{st.count} séances</span>
              </div>
              <div style={{ display: "flex", gap: 20 }}>
                <div>
                  <div style={{ fontSize: 18, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: "#fff" }}>{(st.dist / 1000).toFixed(1)} km</div>
                  <div style={{ fontSize: 9, fontFamily: "'Space Mono', monospace", color: "rgba(180,220,255,0.4)", letterSpacing: 1, textTransform: "uppercase" }}>Distance</div>
                </div>
                <div>
                  <div style={{ fontSize: 18, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: "#00ffb4" }}>{formatTime(Math.round(st.bestPace))}</div>
                  <div style={{ fontSize: 9, fontFamily: "'Space Mono', monospace", color: "rgba(180,220,255,0.4)", letterSpacing: 1, textTransform: "uppercase" }}>Meilleure allure</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div>
        <div style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: "rgba(180,220,255,0.5)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Badges</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {achievements.map((a, i) => (
            <div key={i} style={{
              background: a.done ? "rgba(0,180,255,0.08)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${a.done ? "rgba(0,180,255,0.25)" : "rgba(255,255,255,0.06)"}`,
              borderRadius: 12, padding: 14, opacity: a.done ? 1 : 0.5
            }}>
              <div style={{ fontSize: 24, marginBottom: 6, filter: a.done ? "none" : "grayscale(1)" }}>{a.icon}</div>
              <div style={{ fontSize: 12, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: a.done ? "#fff" : "rgba(180,220,255,0.4)", marginBottom: 3 }}>{a.label}</div>
              <div style={{ fontSize: 9, fontFamily: "'Space Mono', monospace", color: "rgba(180,220,255,0.3)", lineHeight: 1.3 }}>{a.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── MAIN APP ─────────────────────────────────────────────────────────────────
export default function AquaTrack() {
  const [tab, setTab] = useState("home");
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = "https://fonts.googleapis.com";
    document.head.appendChild(link);
    const link2 = document.createElement("link");
    link2.rel = "stylesheet";
    link2.href = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700;800&family=Space+Mono:wght@400;700&display=swap";
    document.head.appendChild(link2);
  }, []);

  const saveSession = (data) => {
    const newSession = { id: Date.now(), date: new Date().toISOString().split("T")[0], ...data };
    setSessions(prev => [newSession, ...prev]);
    setTab("history");
  };

  return (
    <div style={{ minHeight: "100vh", position: "relative", maxWidth: 430, margin: "0 auto", fontFamily: "sans-serif" }}>
      <WaveBackground />
      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", overflowY: "auto" }}>
        {tab === "home" && <Dashboard sessions={sessions} />}
        {tab === "chrono" && <Chrono onSave={saveSession} />}
        {tab === "history" && <History sessions={sessions} />}
        {tab === "progress" && <Progress sessions={sessions} />}
      </div>

      {/* Bottom nav */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430,
        background: "rgba(2,13,26,0.85)", borderTop: "1px solid rgba(0,180,255,0.15)",
        backdropFilter: "blur(20px)", display: "flex", justifyContent: "space-around",
        padding: "4px 0 8px", zIndex: 100
      }}>
        <NavItem icon="🏠" label="Accueil" active={tab === "home"} onClick={() => setTab("home")} />
        <NavItem icon="⏱" label="Chrono" active={tab === "chrono"} onClick={() => setTab("chrono")} />
        <NavItem icon="📋" label="Séances" active={tab === "history"} onClick={() => setTab("history")} />
        <NavItem icon="📈" label="Progrès" active={tab === "progress"} onClick={() => setTab("progress")} />
      </div>
    </div>
  );
}
