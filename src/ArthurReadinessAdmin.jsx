/**
 * Dashboard Production Readiness Arthur AI (Phase G).
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase.js";

const FONT = "'Lexend', sans-serif";
const FONT_DISPLAY = "'Barlow Condensed', sans-serif";
const C = {
  ink: "#191c1e",
  muted: "#5a6570",
  line: "#d8dee6",
  surface: "#f4f7fb",
  deep: "#0c1a2e",
  primary: "#154388",
  ok: "#1f7a4c",
  warn: "#c45c26",
};

const SECRET_KEY = "myswym_arthur_admin_secret";

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

async function adminHeaders(secret) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (secret) headers["x-myswym-arthur-admin"] = secret;
  else {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess?.session?.access_token;
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export default function ArthurReadinessAdmin() {
  const [secret, setSecret] = useState(() => {
    try {
      return sessionStorage.getItem(SECRET_KEY) || "";
    } catch {
      return "";
    }
  });
  const [secretDraft, setSecretDraft] = useState("");
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
      const headers = await adminHeaders(secret);
      const res = await fetch("/api/admin/arthur-readiness", { headers });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setData(json);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [secret]);

  useEffect(() => {
    if (secret) load();
  }, [secret]); // eslint-disable-line react-hooks/exhaustive-deps

  const release = async (conversationId) => {
    setLoading(true);
    try {
      const headers = await adminHeaders(secret);
      const res = await fetch("/api/admin/arthur-readiness", {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "release_takeover", conversationId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.error || `HTTP ${res.status}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Release échoué");
      setLoading(false);
    }
  };

  const flags = data?.flags || {};
  const cost = data?.cost?.status;
  const checks = data?.checks || [];

  return (
    <div
      style={{
        minHeight: "100vh",
        fontFamily: FONT,
        color: C.ink,
        background: `radial-gradient(900px 500px at 0% 0%, #d9e6f5 0%, transparent 55%),
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
          MySWYM · Arthur AI · Phase G
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
          Production Readiness
        </h1>
        <p style={{ color: C.muted, maxWidth: 560, marginTop: 8 }}>
          Coûts, rate limits, offline, human takeover, feature flags — préparation au
          scaling. Envois automatiques : non activés sans validation.
        </p>
        <p style={{ marginTop: 8, display: "flex", gap: 14, flexWrap: "wrap" }}>
          <a href="/admin/arthur-growth" style={{ color: C.primary }}>
            Growth
          </a>
          <a href="/admin/arthur-followups" style={{ color: C.primary }}>
            Conversion
          </a>
          <a href="/admin/arthur-optimize" style={{ color: C.primary }}>
            Optimize
          </a>
          <a href="/admin/arthur-shadow" style={{ color: C.primary }}>
            Shadow
          </a>
        </p>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "12px 24px 48px" }}>
        {!secret && !data ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const s = secretDraft.trim();
              if (!s) return;
              try {
                sessionStorage.setItem(SECRET_KEY, s);
              } catch {
                /* ignore */
              }
              setSecret(s);
            }}
            style={{
              padding: 24,
              border: `1px solid ${C.line}`,
              borderRadius: 12,
              background: "#fff",
              maxWidth: 420,
            }}
          >
            <label style={{ fontWeight: 600 }}>Secret admin</label>
            <input
              type="password"
              value={secretDraft}
              onChange={(e) => setSecretDraft(e.target.value)}
              style={{
                display: "block",
                width: "100%",
                margin: "8px 0 12px",
                padding: 10,
                borderRadius: 8,
                border: `1px solid ${C.line}`,
                boxSizing: "border-box",
              }}
            />
            <button type="submit" style={btn(C.primary)}>
              Ouvrir
            </button>
          </form>
        ) : null}

        {secret || data ? (
          <button
            type="button"
            disabled={loading}
            onClick={load}
            style={{ ...btn(C.primary), marginBottom: 16 }}
          >
            {loading ? "…" : "Rafraîchir"}
          </button>
        ) : null}

        {error ? (
          <p style={{ background: "#fde8e4", color: "#8a2b1a", padding: 12, borderRadius: 8 }}>
            {error}
          </p>
        ) : null}

        {data ? (
          <>
            <section style={{ marginBottom: 24 }}>
              <h2 style={h2}>Scale readiness</h2>
              <div
                style={{
                  display: "inline-block",
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: `2px solid ${data.ready_for_scale ? C.ok : C.warn}`,
                  fontWeight: 800,
                  background: "#fff",
                }}
              >
                ready_for_scale = {String(!!data.ready_for_scale)}
              </div>
              <p style={{ color: C.muted, fontSize: 13, marginTop: 8 }}>
                followups_send_mode = {data.followups_send_mode} (doit rester blocked
                jusqu’à validation)
              </p>
            </section>

            <section style={{ marginBottom: 24 }}>
              <h2 style={h2}>Checks</h2>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {checks.map((c) => (
                  <li
                    key={c.id}
                    style={{
                      color: c.ok ? C.ok : C.warn,
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    {c.ok ? "✓" : "✗"} {c.id} — {c.detail}
                  </li>
                ))}
              </ul>
            </section>

            <section style={{ marginBottom: 24 }}>
              <h2 style={h2}>Feature flags</h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: 8,
                }}
              >
                {Object.entries(flags).map(([k, v]) => (
                  <div key={k} style={card}>
                    <div style={{ fontSize: 11, color: C.muted }}>{k}</div>
                    <div
                      style={{
                        fontWeight: 800,
                        color: v ? C.ok : C.warn,
                      }}
                    >
                      {String(v)}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ marginBottom: 24 }}>
              <h2 style={h2}>Coûts</h2>
              <p style={{ color: C.muted, fontSize: 14 }}>
                Budget jour ${data.cost_budget?.dayUsd} · mois ${data.cost_budget?.monthUsd} ·
                soft {data.cost_budget?.softRatio}
              </p>
              <p style={{ fontWeight: 700 }}>
                Status : {cost?.level} — day ${cost?.dayCost} / month ${cost?.monthCost}
              </p>
              <div style={{ overflowX: "auto", marginTop: 8 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: C.deep, color: "#fff", textAlign: "left" }}>
                      {["Jour", "Req", "Cost", "Offline", "RateLtd", "Takeover"].map((h) => (
                        <th key={h} style={{ padding: "8px 10px" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(data.cost?.daily || []).map((d, i) => (
                      <tr
                        key={d.day || i}
                        style={{
                          background: i % 2 ? C.surface : "#fff",
                          borderTop: `1px solid ${C.line}`,
                        }}
                      >
                        <td style={td}>{d.day}</td>
                        <td style={td}>{d.requests}</td>
                        <td style={td}>{d.cost_usd}</td>
                        <td style={td}>{d.offline_count}</td>
                        <td style={td}>{d.rate_limited_count}</td>
                        <td style={td}>{d.takeover_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section style={{ marginBottom: 24 }}>
              <h2 style={h2}>Rate limits</h2>
              <p style={{ color: C.muted }}>
                {data.rate_limits?.perHour}/h · {data.rate_limits?.perDay}/jour
              </p>
            </section>

            <section style={{ marginBottom: 24 }}>
              <h2 style={h2}>
                Human takeovers actifs ({data.active_takeover_count ?? 0})
              </h2>
              <div style={{ overflowX: "auto", border: `1px solid ${C.line}`, borderRadius: 10 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: C.primary, color: "#fff", textAlign: "left" }}>
                      {["Conversation", "Raison", "Par", "Depuis", ""].map((h) => (
                        <th key={h || "a"} style={{ padding: "8px 10px" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(data.active_takeovers || []).map((t, i) => (
                      <tr
                        key={t.id || i}
                        style={{
                          background: i % 2 ? C.surface : "#fff",
                          borderTop: `1px solid ${C.line}`,
                        }}
                      >
                        <td style={td}>
                          <code style={{ fontSize: 11 }}>
                            {String(t.conversation_id || "").slice(0, 8)}…
                          </code>
                        </td>
                        <td style={td}>{t.reason}</td>
                        <td style={td}>{t.requested_by}</td>
                        <td style={td}>
                          {t.created_at
                            ? new Date(t.created_at).toLocaleString("fr-FR")
                            : "—"}
                        </td>
                        <td style={td}>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => release(t.conversation_id)}
                            style={{ ...btn(C.ok), padding: "4px 8px", fontSize: 12 }}
                          >
                            Release
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(data.active_takeovers || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ ...td, color: C.muted }}>
                          Aucun takeover actif
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 style={h2}>Checklist scaling</h2>
              <ul style={{ color: C.muted, fontSize: 14 }}>
                {(data.scaling_checklist || []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
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

const td = { padding: "8px 10px" };
