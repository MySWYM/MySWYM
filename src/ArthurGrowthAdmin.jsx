/**
 * Dashboard admin Arthur Growth Engine (F1).
 * Mesure Reel → DM → Lead → Signup → Premium. Pas de relances.
 */
import { useCallback, useEffect, useState } from "react";
import { useArthurAdmin } from "./ArthurAdminShell.jsx";

const FONT = "'Lexend', sans-serif";
const FONT_DISPLAY = "'Barlow Condensed', sans-serif";
const C = {
  ink: "#191c1e",
  muted: "#5a6570",
  line: "#d8dee6",
  surface: "#f4f7fb",
  deep: "#0c1a2e",
  primary: "#154388",
  hot: "#c45c26",
  warm: "#c9a227",
  cold: "#6b7c8f",
  ok: "#1f7a4c",
};

function ensureFonts() {
  if (typeof document === "undefined") return;
  if (document.getElementById("arthur-growth-fonts")) return;
  const l = document.createElement("link");
  l.id = "arthur-growth-fonts";
  l.rel = "stylesheet";
  l.href =
    "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Lexend:wght@400;500;600;700&display=swap";
  document.head.appendChild(l);
}

function pct(n) {
  if (n == null || Number.isNaN(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

function bandColor(band) {
  if (band === "hot") return C.hot;
  if (band === "warm") return C.warm;
  return C.cold;
}

export default function ArthurGrowthAdmin() {
  const { secret, headers: adminHeaders } = useArthurAdmin();
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    ensureFonts();
  }, []);

  const load = useCallback(
    async (opts = {}) => {
      setLoading(true);
      setError("");
      try {
        const headers = await adminHeaders();
        const params = new URLSearchParams({ days: String(opts.days ?? days) });
        if (opts.sync) params.set("sync", "1");

        const res = await fetch(`/api/admin/arthur-growth?${params}`, {
          headers,
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.ok) {
          throw new Error(json.error || `HTTP ${res.status}`);
        }
        setData(json);
      } catch (err) {
        setData(null);
        setError(err instanceof Error ? err.message : "Erreur chargement");
      } finally {
        setLoading(false);
      }
    },
    [days, adminHeaders],
  );

  useEffect(() => {
    load();
  }, [secret]); // eslint-disable-line react-hooks/exhaustive-deps

  const runSync = async () => {
    setLoading(true);
    setError("");
    try {
      const headers = await adminHeaders();
      const res = await fetch("/api/admin/arthur-growth", {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "sync" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.error || `HTTP ${res.status}`);
      await load({ sync: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync échouée");
      setLoading(false);
    }
  };

  const funnel = data?.funnel;
  const dist = data?.score_distribution;

  return (
    <div
      style={{
        minHeight: "100vh",
        fontFamily: FONT,
        color: C.ink,
        background: `radial-gradient(1200px 600px at 10% -10%, #d6e4f7 0%, transparent 55%),
          radial-gradient(900px 500px at 100% 0%, #e8eef6 0%, transparent 50%),
          linear-gradient(180deg, ${C.surface} 0%, #fff 40%)`,
      }}
    >
      <header
        style={{
          padding: "28px 24px 12px",
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: FONT_DISPLAY,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: C.primary,
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          MySWYM · Admin
        </p>
        <h1
          style={{
            margin: "6px 0 0",
            fontFamily: FONT_DISPLAY,
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: C.deep,
          }}
        >
          Chiffres
        </h1>
        <p style={{ margin: "8px 0 0", color: C.muted, maxWidth: 520 }}>
          Combien de messages, d’inscriptions et d’abonnés payants — et d’où ça vient
          (vidéos Instagram).
        </p>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "12px 24px 48px" }}>
        <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <label style={{ fontSize: 14, color: C.muted }}>
              Période{" "}
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                style={{ marginLeft: 6, padding: "6px 8px", borderRadius: 6 }}
              >
                <option value={7}>7 j</option>
                <option value={30}>30 j</option>
                <option value={90}>90 j</option>
              </select>
            </label>
            <button
              type="button"
              disabled={loading}
              onClick={() => load()}
              style={btnStyle}
            >
              {loading ? "Chargement…" : "Rafraîchir"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={runSync}
              style={{ ...btnStyle, background: C.deep }}
            >
              Sync signup / premium
            </button>
          </div>

        {error ? (
          <p
            style={{
              padding: 12,
              background: "#fde8e4",
              color: "#8a2b1a",
              borderRadius: 8,
            }}
          >
            {error}
          </p>
        ) : null}

        {funnel ? (
          <>
            <section style={{ marginBottom: 28 }}>
              <h2 style={h2Style}>Funnel</h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: 12,
                }}
              >
                {[
                  ["DM", funnel.dm],
                  ["Leads", funnel.leads],
                  ["Qualifiés", funnel.qualified],
                  ["Signups", funnel.signup],
                  ["Premium", funnel.premium],
                ].map(([label, value]) => (
                  <div key={label} style={statCard}>
                    <div style={{ fontSize: 13, color: C.muted }}>{label}</div>
                    <div
                      style={{
                        fontFamily: FONT_DISPLAY,
                        fontSize: 36,
                        fontWeight: 800,
                        color: C.deep,
                        lineHeight: 1.1,
                      }}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ marginTop: 12, fontSize: 14, color: C.muted }}>
                DM→Signup {pct(funnel.dm ? funnel.signup / funnel.dm : null)} ·
                Signup→Premium{" "}
                {pct(funnel.signup ? funnel.premium / funnel.signup : null)} ·
                DM→Premium {pct(funnel.dm ? funnel.premium / funnel.dm : null)}
              </p>
            </section>

            {dist ? (
              <section style={{ marginBottom: 28 }}>
                <h2 style={h2Style}>Scores</h2>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {[
                    ["hot", dist.hot],
                    ["warm", dist.warm],
                    ["cold", dist.cold],
                  ].map(([band, n]) => (
                    <div
                      key={band}
                      style={{
                        ...statCard,
                        borderLeft: `4px solid ${bandColor(band)}`,
                        minWidth: 120,
                      }}
                    >
                      <div style={{ textTransform: "uppercase", fontSize: 12, fontWeight: 700 }}>
                        {band}
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 700 }}>{n}</div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section style={{ marginBottom: 28 }}>
              <h2 style={h2Style}>Attribution par Reel / campagne</h2>
              <div style={{ overflowX: "auto", border: `1px solid ${C.line}`, borderRadius: 10 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: C.deep, color: "#fff", textAlign: "left" }}>
                      {[
                        "Reel",
                        "Campagne",
                        "Source",
                        "DM",
                        "Leads",
                        "Signup",
                        "Premium",
                        "DM→Prem",
                        "Score moy.",
                      ].map((h) => (
                        <th key={h} style={{ padding: "10px 12px", fontWeight: 600 }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(data.by_reel || []).map((row, i) => (
                      <tr
                        key={`${row.reel_id}-${row.campaign}-${i}`}
                        style={{
                          background: i % 2 ? C.surface : "#fff",
                          borderTop: `1px solid ${C.line}`,
                        }}
                      >
                        <td style={td}>{row.reel_id}</td>
                        <td style={td}>{row.campaign}</td>
                        <td style={td}>{row.source}</td>
                        <td style={td}>{row.dm}</td>
                        <td style={td}>{row.leads}</td>
                        <td style={td}>{row.signup}</td>
                        <td style={td}>{row.premium}</td>
                        <td style={td}>{pct(row.conversion_dm_to_premium)}</td>
                        <td style={td}>{row.avg_score ?? "—"}</td>
                      </tr>
                    ))}
                    {(data.by_reel || []).length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ ...td, color: C.muted }}>
                          Aucune donnée sur la période.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 style={h2Style}>Leads récents</h2>
              <div style={{ overflowX: "auto", border: `1px solid ${C.line}`, borderRadius: 10 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: C.primary, color: "#fff", textAlign: "left" }}>
                      {["Statut", "Score", "Intent", "Objectif", "Reel", "KW", "Créé"].map(
                        (h) => (
                          <th key={h} style={{ padding: "10px 12px" }}>
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {(data.recent_leads || []).map((l, i) => (
                      <tr
                        key={l.id || i}
                        style={{
                          background: i % 2 ? C.surface : "#fff",
                          borderTop: `1px solid ${C.line}`,
                        }}
                      >
                        <td style={td}>{l.status}</td>
                        <td style={td}>
                          <span style={{ color: bandColor(l.score_band), fontWeight: 700 }}>
                            {l.score ?? "—"}
                          </span>
                          {l.score_band ? ` ${l.score_band}` : ""}
                        </td>
                        <td style={td}>{l.intent || "—"}</td>
                        <td style={td}>{l.goal || "—"}</td>
                        <td style={td}>{l.reel_id || "—"}</td>
                        <td style={td}>{l.keyword || "—"}</td>
                        <td style={td}>
                          {l.created_at
                            ? new Date(l.created_at).toLocaleDateString("fr-FR")
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}

const btnStyle = {
  background: C.primary,
  color: "#fff",
  border: 0,
  borderRadius: 8,
  padding: "8px 14px",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: FONT,
};

const h2Style = {
  fontFamily: FONT_DISPLAY,
  fontSize: 22,
  fontWeight: 700,
  color: C.deep,
  margin: "0 0 12px",
};

const statCard = {
  padding: "14px 16px",
  background: "#fff",
  border: `1px solid ${C.line}`,
  borderRadius: 10,
};

const td = { padding: "9px 12px", verticalAlign: "top" };
