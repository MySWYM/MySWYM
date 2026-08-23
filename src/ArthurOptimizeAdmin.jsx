/**
 * Dashboard Optimization Loop F3 — qualité, CTA, insights.
 * Pas d’activation des envois automatiques.
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
  strong: "#1f7a4c",
  weak: "#c45c26",
  ok: "#c9a227",
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

export default function ArthurOptimizeAdmin() {
  const { secret, headers: adminHeaders } = useArthurAdmin();
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    ensureFonts();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const headers = await adminHeaders();
      const res = await fetch(`/api/admin/arthur-optimize?days=${days}`, { headers });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setData(json);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [days, adminHeaders]);

  useEffect(() => {
    load();
  }, [secret]); // eslint-disable-line react-hooks/exhaustive-deps

  const analyzeBatch = async () => {
    setLoading(true);
    setError("");
    try {
      const headers = await adminHeaders();
      const res = await fetch("/api/admin/arthur-optimize", {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "analyze_batch", limit: 40, days }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.error || `HTTP ${res.status}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analyse échouée");
      setLoading(false);
    }
  };

  const q = data?.quality;
  const funnel = data?.funnel_proxy;
  const conv = data?.conversations;

  return (
    <div
      style={{
        minHeight: "100vh",
        fontFamily: FONT,
        color: C.ink,
        background: `radial-gradient(900px 480px at 100% 0%, #dce8f6 0%, transparent 50%),
          linear-gradient(180deg, ${C.surface}, #fff 40%)`,
      }}
    >
      <header style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px 8px" }}>
        <p
          style={{
            margin: 0,
            fontFamily: FONT_DISPLAY,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
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
            color: C.deep,
          }}
        >
          Qualité
        </h1>
        <p style={{ color: C.muted, maxWidth: 580, marginTop: 8 }}>
          Est-ce qu’Arthur répond bien, et est-ce qu’il propose de s’inscrire au
          bon moment.
        </p>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "12px 24px 48px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              style={{ padding: 8, borderRadius: 6 }}
            >
              <option value={7}>7 j</option>
              <option value={30}>30 j</option>
              <option value={90}>90 j</option>
            </select>
            <button type="button" disabled={loading} onClick={load} style={btn(C.primary)}>
              Rafraîchir
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={analyzeBatch}
              style={btn(C.deep)}
            >
              Analyser conversations
            </button>
            <span
              style={{
                alignSelf: "center",
                fontSize: 13,
                color: data?.auto_sends_enabled ? C.weak : C.strong,
                fontWeight: 600,
              }}
            >
              auto_sends = {data?.auto_sends_enabled ? "ON (F2 gate)" : "OFF"}
            </span>
          </div>

        {error ? (
          <p style={{ background: "#fde8e4", color: "#8a2b1a", padding: 12, borderRadius: 8 }}>
            {error}
          </p>
        ) : null}

        {data ? (
          <>
            <section style={{ marginBottom: 24 }}>
              <h2 style={h2}>Funnel proxy DM → Premium</h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                  gap: 10,
                }}
              >
                {[
                  ["DM", funnel?.dm],
                  ["Signups", funnel?.signup],
                  ["Premium", funnel?.premium],
                  ["DM→Signup", pct(funnel?.dm_to_signup)],
                  ["DM→Premium", pct(funnel?.dm_to_premium)],
                ].map(([label, v]) => (
                  <div key={label} style={card}>
                    <div style={{ fontSize: 12, color: C.muted }}>{label}</div>
                    <div style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 800 }}>
                      {v ?? "—"}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ marginBottom: 24 }}>
              <h2 style={h2}>Qualité des réponses</h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                  gap: 10,
                }}
              >
                {[
                  ["Scorées", q?.responses_scored],
                  ["Score moy.", q?.avg_score],
                  ["Strong", q?.band?.strong],
                  ["OK", q?.band?.ok],
                  ["Weak", q?.band?.weak],
                  ["CTA rate", pct(q?.cta_rate)],
                ].map(([label, v]) => (
                  <div key={label} style={card}>
                    <div style={{ fontSize: 12, color: C.muted }}>{label}</div>
                    <div style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 800 }}>
                      {v ?? "—"}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ marginBottom: 24 }}>
              <h2 style={h2}>CTA Instagram</h2>
              <p style={{ color: C.muted, fontSize: 14 }}>
                Envoyés : {data.cta?.sent ?? 0} · Signup attribués :{" "}
                {data.cta?.attributed_signup ?? 0} · Premium attribués :{" "}
                {data.cta?.attributed_premium ?? 0}
              </p>
              <ul style={{ color: C.muted, fontSize: 14 }}>
                {Object.entries(data.cta?.by_type || {}).map(([k, v]) => (
                  <li key={k}>
                    {k}: {v}
                  </li>
                ))}
              </ul>
              <p style={{ fontSize: 13, color: C.muted }}>
                Knowledge active : {data.knowledge?.active_snippets ?? 0} snippets
              </p>
            </section>

            <section style={{ marginBottom: 24 }}>
              <h2 style={h2}>Insights conversations</h2>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                {Object.entries(conv?.drop_risk || {}).map(([k, v]) => (
                  <div key={k} style={{ ...card, minWidth: 100 }}>
                    <div style={{ fontSize: 12, color: C.muted }}>drop {k}</div>
                    <div style={{ fontWeight: 800, fontSize: 22 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <h3 style={{ fontSize: 14, margin: "0 0 8px" }}>Top findings</h3>
                  <ul style={{ margin: 0, paddingLeft: 18, color: C.muted, fontSize: 13 }}>
                    {(conv?.top_findings || []).map((f) => (
                      <li key={f.finding}>
                        {f.finding}: {f.count}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 style={{ fontSize: 14, margin: "0 0 8px" }}>Top recommandations</h3>
                  <ul style={{ margin: 0, paddingLeft: 18, color: C.muted, fontSize: 13 }}>
                    {(conv?.top_recommendations || []).map((r) => (
                      <li key={r.recommendation}>
                        {r.recommendation}: {r.count}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 style={h2}>Réponses récentes scorées</h2>
              <div style={{ overflowX: "auto", border: `1px solid ${C.line}`, borderRadius: 10 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: C.deep, color: "#fff", textAlign: "left" }}>
                      {["Score", "Band", "Intent", "CTA", "Canal"].map((h) => (
                        <th key={h} style={{ padding: "10px 12px" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(q?.recent || []).map((r, i) => (
                      <tr
                        key={i}
                        style={{
                          background: i % 2 ? C.surface : "#fff",
                          borderTop: `1px solid ${C.line}`,
                        }}
                      >
                        <td style={td}>{r.score}</td>
                        <td
                          style={{
                            ...td,
                            color:
                              r.band === "strong"
                                ? C.strong
                                : r.band === "weak"
                                  ? C.weak
                                  : C.ok,
                            fontWeight: 700,
                          }}
                        >
                          {r.band}
                        </td>
                        <td style={td}>{r.intent || "—"}</td>
                        <td style={td}>{r.cta ? r.cta_type || "yes" : "—"}</td>
                        <td style={td}>{r.channel || "—"}</td>
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

const btn = (bg) => ({
  background: bg,
  color: "#fff",
  border: 0,
  borderRadius: 8,
  padding: "8px 14px",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: FONT,
});

const h2 = {
  fontFamily: FONT_DISPLAY,
  fontSize: 22,
  fontWeight: 700,
  color: C.deep,
  margin: "0 0 12px",
};

const card = {
  background: "#fff",
  border: `1px solid ${C.line}`,
  borderRadius: 10,
  padding: 12,
};

const td = { padding: "8px 12px" };
