/**
 * Preview mobile — reproduction du design séance mobile.
 * Route : /prototype/session-pyramid
 */
import PyramidBlockViz, { parsePyramidLine } from "./PyramidBlockViz.jsx";

const G = {
  bg: "#eef3fb",
  card: "#ffffff",
  ink: "#172b4d",
  inkSoft: "#4f6284",
  line: "#e7edf6",
  blue: "#355da3",
  blueSoft: "#eef4ff",
  blueTint: "#f6f9ff",
  aqua: "#61c7de",
  green: "#24b36b",
  yellow: "#f2b63d",
};

const SESSION = {
  title: "Aujourd'hui",
  distance: 2000,
  duration: "55 min",
  calories: "820 kcal",
  intensity: "Z2",
  items: [
    { n: 1, icon: "warm", title: "500m", subtitle: "Mise en route • Nage facile", meta: "10 min" },
    { n: 2, icon: "tech", title: "4 · 50m", subtitle: "Technique bras alterné", meta: "rest 30s" },
    { n: 3, icon: "kick", title: "3 · 50m", subtitle: "Battements + planche", meta: "rest 20s" },
    {
      n: 4,
      icon: "alert",
      title: "1750 m pyramide crawl",
      subtitle: "Version corrigée dans l'UI",
      meta: "repos 20s",
      detail:
        "-900m pyramide crawl : 100 → 200 → 300 → 200 → 100 (sommet 300) — repos 20s",
      after: "8 × 100m hors pyramide",
    },
    { n: 5, icon: "cool", title: "250m", subtitle: "Retour au calme", meta: "< 6 min" },
  ],
  zoneRows: [
    { label: "Z1", value: 58, color: "#3ba7db" },
    { label: "Z2", value: 26, color: "#31c48d" },
    { label: "Z3", value: 12, color: "#8d9efc" },
    { label: "Z4", value: 4, color: "#ffbe55" },
  ],
};

function Icon({ kind, color = G.blue }) {
  const common = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round" };
  if (kind === "warm") {
    return (
      <svg {...common}><path d="M3 12c2.5 0 2.5-4 5-4s2.5 4 5 4 2.5-4 5-4 2.5 4 5 4" /><path d="M3 17c2.5 0 2.5-4 5-4s2.5 4 5 4 2.5-4 5-4 2.5 4 5 4" /></svg>
    );
  }
  if (kind === "tech") {
    return (
      <svg {...common}><path d="M4 19 12 5l8 14" /><path d="M9 14h6" /><path d="M10.5 11h3" /></svg>
    );
  }
  if (kind === "kick") {
    return (
      <svg {...common}><path d="M4 15c3-4 5-6 8-6 2.5 0 4.5 1.5 8 5" /><path d="M8 18c3-3 5-4 8-4" /></svg>
    );
  }
  if (kind === "alert") {
    return (
      <svg {...common}><path d="M12 3 3 20h18L12 3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
    );
  }
  return (
    <svg {...common}><path d="M4 12c2.5 0 2.5 4 5 4s2.5-4 5-4 2.5 4 5 4 2.5-4 5-4" /></svg>
  );
}

function TopBarButton({ children }) {
  return (
    <button
      type="button"
      style={{
        width: 30,
        height: 30,
        borderRadius: 10,
        border: "1px solid rgba(53,93,163,0.10)",
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: G.blue,
        boxShadow: "0 4px 12px rgba(27,54,107,0.05)",
      }}
    >
      {children}
    </button>
  );
}

function SessionRow({ item, children }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "34px 1fr auto",
        gap: 10,
        alignItems: "start",
        padding: "9px 0",
        borderTop: `1px solid ${G.line}`,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: "linear-gradient(180deg, #4d6eb6 0%, #355da3 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 6px 12px rgba(53,93,163,0.16)",
        }}
      >
        <Icon kind={item.icon} color="#fff" />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: G.ink, lineHeight: 1.25 }}>{item.title}</div>
        <div style={{ fontSize: 11, color: G.inkSoft, marginTop: 2, lineHeight: 1.35 }}>{item.subtitle}</div>
        {children}
      </div>
      <div
        style={{
          fontSize: 10,
          color: G.inkSoft,
          fontWeight: 700,
          background: G.blueSoft,
          borderRadius: 999,
          padding: "4px 7px",
          whiteSpace: "nowrap",
        }}
      >
        {item.meta}
      </div>
    </div>
  );
}

function StatBars() {
  return (
    <div
      style={{
        marginTop: 12,
        borderRadius: 18,
        background: "linear-gradient(135deg, #2c57a4 0%, #4178d9 100%)",
        color: "#fff",
        padding: "14px 14px 12px",
        boxShadow: "0 12px 24px rgba(53,93,163,0.22)",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 10, opacity: 0.78, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Charge séance
          </div>
          <div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1, marginTop: 4 }}>{SESSION.distance} m</div>
          <div style={{ fontSize: 11, opacity: 0.82, marginTop: 4 }}>
            {SESSION.duration} · {SESSION.intensity} majoritaire
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {SESSION.zoneRows.map((row) => (
            <div key={row.label} style={{ display: "grid", gridTemplateColumns: "24px 1fr 28px", gap: 6, alignItems: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 800, opacity: 0.94 }}>{row.label}</div>
              <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.18)", overflow: "hidden" }}>
                <div style={{ width: `${row.value}%`, height: "100%", borderRadius: 999, background: row.color }} />
              </div>
              <div style={{ fontSize: 10, fontWeight: 800, textAlign: "right", opacity: 0.9 }}>{row.value}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BottomNav() {
  const items = [
    ["Accueil", true],
    ["Calendrier", false],
    ["Suivi", false],
    ["Profil", false],
  ];
  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        marginTop: 14,
        paddingTop: 10,
        background: "linear-gradient(180deg, rgba(238,243,251,0) 0%, rgba(238,243,251,0.96) 26%, rgba(238,243,251,1) 100%)",
      }}
    >
      <button
        type="button"
        style={{
          width: "100%",
          border: "none",
          borderRadius: 16,
          background: "linear-gradient(135deg, #2b59a8 0%, #3a79df 100%)",
          color: "#fff",
          fontSize: 14,
          fontWeight: 900,
          padding: "14px 16px",
          boxShadow: "0 12px 26px rgba(53,93,163,0.24)",
        }}
      >
        Démarrer la séance
      </button>

      <div
        style={{
          marginTop: 10,
          background: "#fff",
          borderRadius: 18,
          border: `1px solid ${G.line}`,
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          padding: "8px 4px 10px",
          boxShadow: "0 8px 20px rgba(18,43,90,0.05)",
        }}
      >
        {items.map(([label, active]) => (
          <div key={label} style={{ textAlign: "center", color: active ? G.blue : "#7a8cab", fontSize: 10, fontWeight: active ? 800 : 700 }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 7,
                margin: "0 auto 5px",
                background: active ? G.blueSoft : "#f4f7fb",
                border: `1px solid ${active ? "rgba(53,93,163,0.18)" : "#eef2f7"}`,
              }}
            />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SessionPyramidPreview() {
  const pyramidLine = SESSION.items.find((item) => item.detail)?.detail;
  const pyr = parsePyramidLine(pyramidLine);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${G.bg} 0%, #f4f7fc 100%)`,
        display: "flex",
        justifyContent: "center",
        padding: "10px 10px 28px",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <TopBarButton>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </TopBarButton>
          <div style={{ fontSize: 15, fontWeight: 900, color: G.blue, letterSpacing: "-0.02em" }}>myswym</div>
          <TopBarButton>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1.2" />
              <circle cx="19" cy="12" r="1.2" />
              <circle cx="5" cy="12" r="1.2" />
            </svg>
          </TopBarButton>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: G.ink }}>{SESSION.title}</div>
            <div style={{ fontSize: 11, color: G.inkSoft, marginTop: 2 }}>Séance du jour · Ironman perf</div>
          </div>
          <div
            style={{
              padding: "7px 10px",
              borderRadius: 999,
              background: "#fff",
              border: `1px solid ${G.line}`,
              fontSize: 10,
              fontWeight: 800,
              color: G.blue,
            }}
          >
            Économie crawl
          </div>
        </div>

        <div
          style={{
            background: G.card,
            borderRadius: 24,
            border: `1px solid ${G.line}`,
            overflow: "hidden",
            boxShadow: "0 10px 28px rgba(26,45,86,0.06)",
            padding: "14px 14px 12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: G.inkSoft, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase" }}>
                Aujourd'hui · Bassin 50 m
              </div>
              <div style={{ fontSize: 12, color: G.inkSoft, marginTop: 3 }}>
                1h 12 · {SESSION.calories} · allure économique
              </div>
            </div>
            <div
              style={{
                minWidth: 72,
                textAlign: "center",
                borderRadius: 16,
                background: G.blueTint,
                border: `1px solid ${G.line}`,
                padding: "8px 10px",
              }}
            >
              <div style={{ fontSize: 11, color: G.inkSoft, fontWeight: 700 }}>Volume</div>
              <div style={{ fontSize: 18, color: G.blue, fontWeight: 900, lineHeight: 1.1 }}>2000</div>
              <div style={{ fontSize: 10, color: G.inkSoft, fontWeight: 700 }}>m</div>
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            {SESSION.items.map((item) => (
              <SessionRow key={item.n} item={item}>
                {item.detail && pyr && (
                  <>
                    <PyramidBlockViz
                      steps={pyr.steps}
                      peak={pyr.peak}
                      volume={pyr.volume}
                      rest={pyr.rest}
                      label={pyr.label}
                      accent={G.blue}
                    />
                    <div
                      style={{
                        marginTop: 7,
                        fontSize: 10,
                        color: G.inkSoft,
                        fontWeight: 700,
                        padding: "7px 9px",
                        borderRadius: 10,
                        background: "#f7faff",
                        border: `1px solid ${G.line}`,
                        display: "inline-block",
                      }}
                    >
                      + {item.after}
                    </div>
                  </>
                )}
              </SessionRow>
            ))}
          </div>

          <StatBars />
        </div>

        <BottomNav />
      </div>
    </div>
  );
}
