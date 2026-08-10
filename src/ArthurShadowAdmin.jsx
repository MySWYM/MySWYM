/**
 * Dashboard Shadow Mode H1 — validation humaine, zéro envoi auto.
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
  hot: "#c45c26",
  warm: "#c9a227",
  cold: "#6b7c8f",
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

function bandColor(band) {
  if (band === "hot") return C.hot;
  if (band === "warm") return C.warm;
  return C.cold;
}

export default function ArthurShadowAdmin() {
  const [secret, setSecret] = useState(() => {
    try {
      return sessionStorage.getItem(SECRET_KEY) || "";
    } catch {
      return "";
    }
  });
  const [secretDraft, setSecretDraft] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const [lastRefresh, setLastRefresh] = useState("");

  useEffect(() => {
    ensureFonts();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const headers = await adminHeaders(secret);
      const res = await fetch(
        `/api/admin/arthur-shadow?status=${encodeURIComponent(statusFilter)}&days=30&_=${Date.now()}`,
        { headers, cache: "no-store" },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setData(json);
      setLastRefresh(
        json.fetched_at
          ? new Date(json.fetched_at).toLocaleTimeString("fr-FR")
          : new Date().toLocaleTimeString("fr-FR"),
      );
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [secret, statusFilter]);

  useEffect(() => {
    if (secret) load();
  }, [secret, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const review = async (proposalId, action, extra = {}) => {
    setLoading(true);
    setError("");
    try {
      const headers = await adminHeaders(secret);
      const res = await fetch("/api/admin/arthur-shadow", {
        method: "POST",
        headers,
        body: JSON.stringify({ action, proposalId, ...extra }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setEditId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action échouée");
      setLoading(false);
    }
  };

  const report = data?.report;

  return (
    <div
      style={{
        minHeight: "100vh",
        fontFamily: FONT,
        color: C.ink,
        background: `radial-gradient(900px 480px at 50% 0%, #d6e4f5 0%, transparent 55%),
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
          MySWYM · Arthur AI · H1
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
          Shadow Mode
        </h1>
        <p style={{ color: C.muted, maxWidth: 580, marginTop: 8 }}>
          Arthur analyse les DM Instagram, propose une réponse + classification lead /
          action — sans aucun envoi automatique. Valide ici. Envois live et
          followups restent bloqués.
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
          <a href="/admin/arthur-readiness" style={{ color: C.primary }}>
            Readiness
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
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: 8, borderRadius: 6 }}
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="edited_approved">Edited</option>
              <option value="rejected">Rejected</option>
              <option value="all">All</option>
            </select>
            <button type="button" disabled={loading} onClick={load} style={btn(C.primary)}>
              {loading ? "Chargement…" : "Rafraîchir"}
            </button>
            <span style={{ alignSelf: "center", fontSize: 13, fontWeight: 700, color: C.ok }}>
              shadow={String(data?.shadow_mode)} · live_send={String(data?.live_send)} ·
              followups={String(data?.followups_send)}
              {lastRefresh ? ` · ${lastRefresh}` : ""}
            </span>
          </div>
        ) : null}

        {error ? (
          <p style={{ background: "#fde8e4", color: "#8a2b1a", padding: 12, borderRadius: 8 }}>
            {error}
          </p>
        ) : null}

        {data && (data.recent_events || []).length === 0 ? (
          <p
            style={{
              background: "#fff6e8",
              color: "#7a4a12",
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 14,
            }}
          >
            Aucun événement Instagram en base. Si tu viens d’envoyer un DM et que
            rien n’apparaît après refresh, le webhook Meta n’a pas encore été
            accepté (souvent signature). En Shadow H1 le soft-verify est actif
            après ce deploy — renvoie un DM puis rafraîchis.
          </p>
        ) : null}
        {report ? (
          <section style={{ marginBottom: 24 }}>
            <h2 style={h2}>File d’attente</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
                gap: 10,
              }}
            >
              {[
                ["Total", report.total],
                ["Pending", report.pending],
                ["Approuvés", report.approved],
                ["Rejetés", report.rejected],
                ["Envoyés", report.sent_count],
              ].map(([label, v]) => (
                <div key={label} style={card}>
                  <div style={{ fontSize: 12, color: C.muted }}>{label}</div>
                  <div
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontSize: 28,
                      fontWeight: 800,
                      color: label === "Envoyés" && v > 0 ? C.warn : C.deep,
                    }}
                  >
                    {v ?? 0}
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 13, color: C.muted, marginTop: 8 }}>
              « Envoyés » doit rester 0 en H1. Approve ≠ send.
            </p>
          </section>
        ) : null}

        {data ? (
          <section style={{ marginBottom: 24 }}>
            <h2 style={h2}>Événements Instagram récents</h2>
            {(data.recent_events || []).length === 0 ? (
              <p style={{ color: C.muted, fontSize: 14 }}>
                Aucun événement en base pour l’instant. Après un DM Meta valide, tu
                verras ici <code>instagram_webhook_received</code> puis{" "}
                <code>shadow_proposal_created</code>.
              </p>
            ) : (
              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {(data.recent_events || []).map((ev) => (
                  <li
                    key={ev.id}
                    style={{
                      background: "#fff",
                      border: `1px solid ${C.line}`,
                      borderRadius: 8,
                      padding: "10px 12px",
                      fontSize: 13,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 10,
                    }}
                  >
                    <strong>{ev.event_type}</strong>
                    <span style={{ color: C.muted, marginLeft: "auto" }}>
                      {ev.created_at
                        ? new Date(ev.created_at).toLocaleString("fr-FR")
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}

        {data ? (
          <section>
            <h2 style={h2}>Propositions</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {(data.proposals || []).map((p) => (
                <article
                  key={p.id}
                  style={{
                    background: "#fff",
                    border: `1px solid ${C.line}`,
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      marginBottom: 10,
                      fontSize: 13,
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>{p.status}</span>
                    <span style={{ color: C.muted }}>{p.recommended_action}</span>
                    <span style={{ color: bandColor(p.lead_band_snapshot) }}>
                      score {p.lead_score_snapshot ?? "—"} {p.lead_band_snapshot || ""}
                    </span>
                    <span style={{ color: C.muted }}>{p.intent}</span>
                    <span style={{ color: C.muted }}>{p.lead_temperature}</span>
                    <span style={{ color: C.muted, marginLeft: "auto" }}>
                      {p.created_at
                        ? new Date(p.created_at).toLocaleString("fr-FR")
                        : ""}
                    </span>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>Inbound</div>
                    <div style={{ whiteSpace: "pre-wrap" }}>{p.inbound_message}</div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>
                      Proposition Arthur
                    </div>
                    {editId === p.id ? (
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={4}
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: 10,
                          borderRadius: 8,
                          border: `1px solid ${C.line}`,
                          fontFamily: FONT,
                        }}
                      />
                    ) : p.recommended_action === "ignore" ||
                      (!(p.final_message || p.proposed_message || "").trim() &&
                        p.suggested_action === "no_reply") ? (
                      <div style={{ color: C.muted, fontStyle: "italic" }}>
                        Aucune réponse (ignore / no_reply) — rien à approuver ni
                        envoyer.
                      </div>
                    ) : (
                      <div style={{ whiteSpace: "pre-wrap" }}>
                        {p.final_message || p.proposed_message}
                      </div>
                    )}
                  </div>
                  {p.status === "pending" ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {p.recommended_action === "ignore" ||
                      (!(p.proposed_message || "").trim() &&
                        p.suggested_action === "no_reply") ? null : (
                        <>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => review(p.id, "approve")}
                            style={btn(C.ok)}
                          >
                            Approve (sans send)
                          </button>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => {
                              setEditId(p.id);
                              setEditText(p.proposed_message || "");
                            }}
                            style={btn(C.primary)}
                          >
                            Éditer
                          </button>
                          {editId === p.id ? (
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() =>
                                review(p.id, "edit_approve", {
                                  finalMessage: editText,
                                })
                              }
                              style={btn(C.deep)}
                            >
                              Sauver + approve
                            </button>
                          ) : null}
                        </>
                      )}
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => review(p.id, "reject", { notes: "rejected_ui" })}
                        style={btn(C.warn)}
                      >
                        {p.recommended_action === "ignore" ? "Archiver" : "Reject"}
                      </button>
                    </div>
                  ) : null}
                  <p style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>
                    send_blocked: {p.send_blocked_reason || "shadow_mode_h1"} · sent_at:{" "}
                    {p.sent_at || "null"}
                  </p>
                </article>
              ))}
              {(data.proposals || []).length === 0 ? (
                <p style={{ color: C.muted }}>Aucune proposition sur ce filtre.</p>
              ) : null}
            </div>
          </section>
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
