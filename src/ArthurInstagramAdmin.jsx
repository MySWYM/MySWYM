/**
 * Instagram, file d’attente, conversion, qualité Arthur.
 * Réutilise les APIs existantes (pas de 13e fonction).
 */
import { useCallback, useEffect, useState } from "react";
import { useArthurAdmin } from "./ArthurAdminShell.jsx";
import { BarChart, DonutChart, FunnelChart } from "./admin/AdminCharts.jsx";
import { adminGetJson } from "./lib/arthur-admin-auth.js";

function dash(v) {
  if (v == null || v === "") return "-";
  return v;
}

function pct(n) {
  if (n == null || Number.isNaN(Number(n))) return "-";
  const x = Number(n);
  const ratio = x > 1 ? x / 100 : x;
  return `${Math.round(ratio * 100)} %`;
}

const card = {
  background: "#fff",
  border: "1px solid #d8dee6",
  borderRadius: 14,
  padding: 16,
};
const btn = (bg) => ({
  background: bg,
  color: "#fff",
  border: 0,
  borderRadius: 10,
  padding: "8px 14px",
  minHeight: 40,
  fontWeight: 700,
  cursor: "pointer",
  fontSize: 14,
});
const h2 = {
  fontSize: 20,
  fontWeight: 750,
  color: "#0c1a2e",
  margin: "0 0 8px",
};

export default function ArthurInstagramAdmin() {
  const { headers } = useArthurAdmin();
  const [days, setDays] = useState(30);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState("");
  const [shadow, setShadow] = useState(null);
  const [growth, setGrowth] = useState(null);
  const [followups, setFollowups] = useState(null);
  const [quality, setQuality] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const h = await headers();
      const q = `days=${days}`;
      const [s, g, f, o] = await Promise.all([
        adminGetJson(
          `/api/admin/arthur-shadow?status=${encodeURIComponent(statusFilter)}&${q}`,
          h,
        ),
        adminGetJson(`/api/admin/arthur-growth?${q}`, h),
        adminGetJson(`/api/admin/arthur-followups?${q}`, h),
        adminGetJson(`/api/admin/arthur-optimize?${q}`, h),
      ]);
      setShadow(s.missing ? null : s);
      setGrowth(g.missing ? null : g);
      setFollowups(f.missing ? null : f);
      setQuality(o.missing ? null : o);
      setOffline([s, g, f, o].every((x) => x.offline));
      const denied = [s, g, f, o].find((x) => x.auth || x.error);
      if (denied) setError(denied.error || "");
    } catch {
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, [days, statusFilter, headers]);

  useEffect(() => {
    load();
  }, [load]);

  const review = async (proposalId, action, extra = {}) => {
    setLoading(true);
    try {
      const h = await headers();
      const res = await fetch("/api/admin/arthur-shadow", {
        method: "POST",
        headers: h,
        body: JSON.stringify({ action, proposalId, ...extra }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.error || "Action échouée");
      setEditId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action échouée");
      setLoading(false);
    }
  };

  const followupAction = async (body) => {
    setLoading(true);
    try {
      const h = await headers();
      const res = await fetch("/api/admin/arthur-followups", {
        method: "POST",
        headers: h,
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.error || "Action échouée");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action échouée");
      setLoading(false);
    }
  };

  const funnel = growth?.funnel || {};
  const dm = funnel.dm ?? 0;
  const signup = funnel.signup ?? 0;
  const premium = funnel.premium ?? 0;
  const report = shadow?.report || {};
  const waiting = report.pending ?? 0;
  const counts = followups?.counts || {};
  const q = quality?.quality || {};
  const scores = growth?.score_distribution || {};
  const reels = (growth?.by_reel || []).map((r) => ({
    label: r.reel_id || r.campaign || "vidéo",
    value: r.signup || r.dm || 0,
  }));
  const proposals = shadow?.proposals || [];
  const recentFollowups = followups?.recent || [];
  const convLine =
    dm > 0
      ? `${pct(signup / dm)} des messages deviennent un compte.`
      : "Dès qu’il y a des messages, tu verras le taux ici.";

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px 72px" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <h1
          style={{
            fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif",
            fontSize: "clamp(1.7rem, 4vw, 2.3rem)",
            margin: 0,
            color: "#0c1a2e",
            flex: "1 1 220px",
          }}
        >
          Instagram
        </h1>
        <label style={{ fontSize: 14, color: "#5a6a7a" }}>
          Période{" "}
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            style={{ marginLeft: 6, padding: "10px 12px", minHeight: 44, borderRadius: 8, fontSize: 16 }}
          >
            <option value={7}>7 jours</option>
            <option value={30}>30 jours</option>
            <option value={90}>90 jours</option>
          </select>
        </label>
        <button type="button" disabled={loading} onClick={load} style={btn("#154388")}>
          {loading ? "Chargement…" : "Actualiser"}
        </button>
      </div>
      <p style={{ color: "#5a6a7a", margin: "0 0 24px", fontSize: 16, lineHeight: 1.5, maxWidth: 640 }}>
        Tu réponds encore sur Instagram. Ici tu vois la file, si ça convertit, et si
        Arthur t’aide. Plus tard : brouillons Ollama, réponses aussi dans Telegram.
      </p>

      {offline ? (
        <p style={{ background: "#fff6e8", color: "#7a4a12", padding: 14, borderRadius: 10, marginBottom: 20 }}>
          APIs inaccessibles. Relance le serveur local (proxy vers staging) ou
          vérifie la clé admin.
        </p>
      ) : null}
      {error ? (
        <p style={{ background: "#fde8e4", color: "#8a2b1a", padding: 14, borderRadius: 10, marginBottom: 20 }}>
          {error}
        </p>
      ) : null}

      <section style={{ marginBottom: 36 }}>
        <h2 style={h2}>À répondre</h2>
        <p style={{ color: "#5a6a7a", margin: "0 0 14px", fontSize: 15 }}>
          Arthur a préparé un texte. Tu valides, tu modifies, ou tu laisses tomber. Rien ne part tout seul.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div style={card}>
            <div style={{ fontSize: 13, color: "#5a6a7a" }}>En attente</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#0c1a2e" }}>{waiting}</div>
          </div>
          <div style={card}>
            <div style={{ fontSize: 13, color: "#5a6a7a" }}>Relances prêtes</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#0c1a2e" }}>
              {dash(counts.approved ?? counts.planned ?? 0)}
            </div>
          </div>
          <div style={card}>
            <div style={{ fontSize: 13, color: "#5a6a7a" }}>Relances déjà parties</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#0c1a2e" }}>
              {dash(counts.sent ?? 0)}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "10px 12px", minHeight: 44, borderRadius: 8, fontSize: 16 }}
          >
            <option value="pending">À valider</option>
            <option value="approved">Validés</option>
            <option value="edited_approved">Modifiés</option>
            <option value="rejected">Ignorés</option>
            <option value="all">Tous</option>
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(proposals || []).map((p) => (
            <article key={p.id} style={card}>
              <div style={{ fontSize: 13, color: "#5a6a7a", marginBottom: 8 }}>
                {p.created_at ? new Date(p.created_at).toLocaleString("fr-FR") : ""}
              </div>
              <div style={{ fontSize: 12, color: "#7a8a9a", marginBottom: 4 }}>Ils ont écrit</div>
              <div style={{ whiteSpace: "pre-wrap", marginBottom: 10 }}>
                {p.inbound_message || "-"}
              </div>
              <div style={{ fontSize: 12, color: "#7a8a9a", marginBottom: 4 }}>Proposition Arthur</div>
              {editId === p.id ? (
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={4}
                  style={{ width: "100%", boxSizing: "border-box", padding: 10, borderRadius: 8 }}
                />
              ) : (
                <div style={{ whiteSpace: "pre-wrap", marginBottom: 12 }}>
                  {p.final_message || p.proposed_message || "-"}
                </div>
              )}
              {p.status === "pending" ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <button type="button" disabled={loading} onClick={() => review(p.id, "approve")} style={btn("#1f7a4c")}>
                    Valider
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setEditId(p.id);
                      setEditText(p.proposed_message || "");
                    }}
                    style={btn("#154388")}
                  >
                    Modifier
                  </button>
                  {editId === p.id ? (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => review(p.id, "edit_approve", { finalMessage: editText })}
                      style={btn("#0c1a2e")}
                    >
                      Enregistrer et valider
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => review(p.id, "reject", { notes: "rejected_ui" })}
                    style={btn("#c45c26")}
                  >
                    Ignorer
                  </button>
                </div>
              ) : null}
            </article>
          ))}
          {(proposals || []).length === 0 ? (
            <p style={{ color: "#5a6a7a" }}>Rien dans ce filtre.</p>
          ) : null}
        </div>

        {recentFollowups.filter((r) => r.status === "planned" || r.status === "approved").length ? (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ fontSize: 16, margin: "0 0 10px" }}>Relances en file</h3>
              {recentFollowups
                .filter((r) => r.status === "planned" || r.status === "approved")
                .slice(0, 8)
                .map((r) => (
                  <div
                    key={r.id}
                    style={{
                      ...card,
                      marginBottom: 8,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <span style={{ flex: "1 1 180px" }}>
                      {r.template_key || "relance"} · {r.status === "planned" ? "à valider" : "prête"}
                    </span>
                    {r.status === "planned" ? (
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => followupAction({ action: "approve", followupId: r.id })}
                        style={btn("#154388")}
                      >
                        Valider
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => followupAction({ action: "cancel", followupId: r.id })}
                      style={btn("#5a6a7a")}
                    >
                      Annuler
                    </button>
                  </div>
                ))}
            </div>
          ) : null}
      </section>

      <section style={{ marginBottom: 36 }}>
        <h2 style={h2}>Ça convertit ?</h2>
        <p style={{ color: "#5a6a7a", margin: "0 0 14px", fontSize: 15 }}>{convLine}</p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 14,
          }}
        >
          <FunnelChart
            steps={[
              { label: "Messages reçus", value: dm },
              { label: "Comptes créés", value: signup },
              { label: "Payants", value: premium },
            ]}
            caption="Du premier message Instagram jusqu’à l’abonnement."
          />
          <BarChart
            title="Vidéos qui amènent des comptes"
            rows={reels}
            empty="Pas encore de vidéo attribuée."
          />
          <DonutChart
            title="Température des personnes"
            slices={[
              { label: "Chaud", value: scores.hot ?? 0 },
              { label: "Tiède", value: scores.warm ?? 0 },
              { label: "Froid", value: scores.cold ?? 0 },
            ]}
            caption="Qui relancer en premier."
          />
        </div>
      </section>

      <section>
        <h2 style={h2}>Arthur aide ?</h2>
        <p style={{ color: "#5a6a7a", margin: "0 0 14px", fontSize: 15 }}>
          Note sur 100, et s’il propose de s’inscrire au bon moment.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12,
          }}
        >
          <div style={card}>
            <div style={{ fontSize: 13, color: "#5a6a7a" }}>Note moyenne</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{dash(q.avg_score ?? "-")}</div>
          </div>
          <div style={{ ...card }}>
            <div style={{ fontSize: 13, color: "#5a6a7a" }}>Très bonnes</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{dash(q.band?.strong ?? 0)}</div>
          </div>
          <div style={card}>
            <div style={{ fontSize: 13, color: "#5a6a7a" }}>À revoir</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{dash(q.band?.weak ?? 0)}</div>
          </div>
          <div style={card}>
            <div style={{ fontSize: 13, color: "#5a6a7a" }}>Propose de s’inscrire</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{pct(q.cta_rate)}</div>
          </div>
        </div>
      </section>
    </main>
  );
}
