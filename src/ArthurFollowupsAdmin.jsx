/**
 * Admin Conversion Engine F2 — planifier / mesurer relances.
 * Envois Instagram gated (ARTHUR_FOLLOWUPS_SEND).
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
  warn: "#c45c26",
  ok: "#1f7a4c",
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

function pct(n) {
  if (n == null || Number.isNaN(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

async function adminHeaders(secret) {
  const headers = { Accept: "application/json", "Content-Type": "application/json" };
  if (secret) {
    headers["x-myswym-arthur-admin"] = secret;
  } else {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess?.session?.access_token;
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export default function ArthurFollowupsAdmin() {
  const [days, setDays] = useState(30);
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
  const [lastPlan, setLastPlan] = useState(null);

  useEffect(() => {
    ensureFonts();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const headers = await adminHeaders(secret);
      const res = await fetch(`/api/admin/arthur-followups?days=${days}`, { headers });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setData(json);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [days, secret]);

  useEffect(() => {
    if (secret) load();
  }, [secret]); // eslint-disable-line react-hooks/exhaustive-deps

  const postAction = async (body) => {
    setLoading(true);
    setError("");
    try {
      const headers = await adminHeaders(secret);
      const res = await fetch("/api/admin/arthur-followups", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.error || `HTTP ${res.status}`);
      if (body.action === "plan" || body.action === "plan_dry_run") {
        setLastPlan(json);
      }
      await load();
      return json;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action échouée");
      setLoading(false);
      return null;
    }
  };

  const saveSecret = (e) => {
    e.preventDefault();
    const s = secretDraft.trim();
    if (!s) return;
    try {
      sessionStorage.setItem(SECRET_KEY, s);
    } catch {
      /* ignore */
    }
    setSecret(s);
  };

  const gate = data?.send_gate || "—";
  const gateColor = gate === "blocked" ? C.warn : gate === "live" ? C.warn : C.ok;

  return (
    <div
      style={{
        minHeight: "100vh",
        fontFamily: FONT,
        color: C.ink,
        background: `radial-gradient(1000px 500px at 0% 0%, #e4edf8 0%, transparent 55%),
          linear-gradient(180deg, ${C.surface}, #fff 45%)`,
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
          MySWYM · Arthur AI · F2
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
          Conversion Engine
        </h1>
        <p style={{ color: C.muted, maxWidth: 560, marginTop: 8 }}>
          Relances intelligentes + tracking d’impact. Pas de spam. Envois Instagram
          réels désactivés tant que{" "}
          <code>ARTHUR_FOLLOWUPS_SEND</code> n’est pas validé.
        </p>
        <p style={{ marginTop: 8 }}>
          <a href="/admin/arthur-growth" style={{ color: C.primary }}>
            ← Growth (F1)
          </a>
          {" · "}
          <a href="/admin/arthur-optimize" style={{ color: C.primary }}>
            Optimize
          </a>
          <a href="/admin/arthur-readiness" style={{ color: C.primary }}>
            Readiness
          </a>
        </p>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "12px 24px 48px" }}>
        {!secret && !data ? (
          <form
            onSubmit={saveSecret}
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
            <button type="button" onClick={() => load()} style={{ ...btn(C.muted), marginLeft: 8 }}>
              Session JWT
            </button>
          </form>
        ) : null}

        {secret || data ? (
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
              onClick={() => postAction({ action: "plan_dry_run", limit: 50 })}
              style={btn(C.deep)}
            >
              Dry-run décisions
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => postAction({ action: "plan", limit: 50 })}
              style={btn(C.ok)}
            >
              Planifier (sans envoi)
            </button>
          </div>
        ) : null}

        {error ? (
          <p style={{ background: "#fde8e4", color: "#8a2b1a", padding: 12, borderRadius: 8 }}>
            {error}
          </p>
        ) : null}

        {data ? (
          <>
            <section style={{ marginBottom: 24 }}>
              <h2 style={h2}>Gate d’envoi</h2>
              <div
                style={{
                  display: "inline-block",
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "#fff",
                  border: `2px solid ${gateColor}`,
                  fontWeight: 700,
                }}
              >
                send_gate = {gate}
              </div>
              <p style={{ fontSize: 13, color: C.muted, marginTop: 8 }}>
                blocked = aucun envoi · mock = simulation · live = Graph API (après validation)
              </p>
            </section>

            <section style={{ marginBottom: 24 }}>
              <h2 style={h2}>Impact</h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                  gap: 10,
                }}
              >
                {[
                  ["Planifiées", data.counts?.planned],
                  ["Approuvées", data.counts?.approved],
                  ["Envoyées", data.counts?.sent],
                  ["Suppressions", data.counts?.suppressed],
                  ["Reply rate", pct(data.rates?.reply_rate)],
                  ["Signup rate", pct(data.rates?.signup_rate)],
                  ["Premium rate", pct(data.rates?.premium_rate)],
                ].map(([label, v]) => (
                  <div
                    key={label}
                    style={{
                      background: "#fff",
                      border: `1px solid ${C.line}`,
                      borderRadius: 10,
                      padding: 12,
                    }}
                  >
                    <div style={{ fontSize: 12, color: C.muted }}>{label}</div>
                    <div style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 800 }}>
                      {v ?? 0}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {lastPlan ? (
              <section style={{ marginBottom: 24 }}>
                <h2 style={h2}>Dernier scan</h2>
                <p style={{ color: C.muted }}>
                  scanned {lastPlan.scanned} · planned {lastPlan.planned} · suppressed{" "}
                  {lastPlan.suppressed}
                  {lastPlan.action === "plan_dry_run" ? " (dry-run)" : ""}
                </p>
              </section>
            ) : null}

            <section style={{ marginBottom: 24 }}>
              <h2 style={h2}>Raisons de suppression</h2>
              <ul style={{ margin: 0, paddingLeft: 18, color: C.muted }}>
                {Object.entries(data.suppress_reasons || {}).map(([k, v]) => (
                  <li key={k}>
                    {k}: {v}
                  </li>
                ))}
                {Object.keys(data.suppress_reasons || {}).length === 0 ? (
                  <li>Aucune sur la période</li>
                ) : null}
              </ul>
            </section>

            <section>
              <h2 style={h2}>Relances récentes</h2>
              <div style={{ overflowX: "auto", border: `1px solid ${C.line}`, borderRadius: 10 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: C.deep, color: "#fff", textAlign: "left" }}>
                      {["Statut", "Outcome", "Template", "Raison", "Mode", "Score", "Actions"].map(
                        (h) => (
                          <th key={h} style={{ padding: "10px 12px" }}>
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {(data.recent || []).map((r, i) => (
                      <tr
                        key={r.id || i}
                        style={{
                          background: i % 2 ? C.surface : "#fff",
                          borderTop: `1px solid ${C.line}`,
                        }}
                      >
                        <td style={td}>{r.status}</td>
                        <td style={td}>{r.outcome || "—"}</td>
                        <td style={td}>{r.template_key}</td>
                        <td style={td}>{r.decision_reason || r.suppress_reason || "—"}</td>
                        <td style={td}>{r.send_mode || "—"}</td>
                        <td style={td}>{r.score ?? "—"}</td>
                        <td style={td}>
                          {r.status === "planned" ? (
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() =>
                                postAction({ action: "approve", followupId: r.id })
                              }
                              style={{ ...btn(C.primary), padding: "4px 8px", fontSize: 12 }}
                            >
                              Approve
                            </button>
                          ) : null}
                          {r.status === "approved" ? (
                            <button
                              type="button"
                              disabled={loading || gate === "blocked"}
                              title={
                                gate === "blocked"
                                  ? "ARTHUR_FOLLOWUPS_SEND requis"
                                  : "Envoyer"
                              }
                              onClick={() => postAction({ action: "send", followupId: r.id })}
                              style={{
                                ...btn(gate === "blocked" ? C.muted : C.warn),
                                padding: "4px 8px",
                                fontSize: 12,
                              }}
                            >
                              Send
                            </button>
                          ) : null}
                          {["planned", "approved"].includes(r.status) ? (
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() =>
                                postAction({ action: "cancel", followupId: r.id })
                              }
                              style={{
                                ...btn(C.muted),
                                padding: "4px 8px",
                                fontSize: 12,
                                marginLeft: 4,
                              }}
                            >
                              Cancel
                            </button>
                          ) : null}
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

const td = { padding: "8px 12px", verticalAlign: "top" };
