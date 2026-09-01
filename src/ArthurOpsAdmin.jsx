import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useArthurAdmin } from "./ArthurAdminShell.jsx";
import { Banner, Card, PageHead, Section } from "./admin/AdminUi.jsx";
import { adminGetJson, adminPostJson } from "./lib/arthur-admin-auth.js";

export default function ArthurOpsAdmin() {
  const { headers, days, setDays } = useArthurAdmin();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [offline, setOffline] = useState(false);
  const [data, setData] = useState(null);
  const [nageurs, setNageurs] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const h = await headers();
      const [json, n] = await Promise.all([
        adminGetJson("/api/admin/arthur-readiness?ops=1", h),
        adminGetJson(`/api/admin/arthur-readiness?nageurs=1&days=${days}`, h),
      ]);
      if (json.missing) {
        setData(null);
        setOffline(Boolean(json.offline));
        if (json.auth || json.error) setError(json.error || "Accès refusé");
      } else {
        setData(json);
        setOffline(false);
      }
      setNageurs(n.missing ? null : n);
    } catch {
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, [days, headers]);

  useEffect(() => {
    load();
  }, [load]);

  const moderate = async (reviewId, status) => {
    setLoading(true);
    try {
      const h = await headers();
      const json = await adminPostJson("/api/admin/arthur-readiness", h, {
        action: "moderate_review",
        reviewId,
        status,
      });
      if (!json.ok) throw new Error(json.error || "Modération impossible");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Modération impossible");
      setLoading(false);
    }
  };

  const support = data?.support_open || [];
  const reviews = data?.reviews_pending || [];
  const trials = data?.trials_ending || [];
  const cats = nageurs?.engine?.feedback_categories || [];
  const reasons = nageurs?.money?.cancel_reasons || [];

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px 72px" }}>
      <PageHead title="Feedbacks" days={days} setDays={setDays} loading={loading} onReload={load} />
      <p style={{ color: "#5a6a7a", margin: "0 0 24px", fontSize: 16, lineHeight: 1.5 }}>
        Support ouvert, avis landing, essais qui se terminent. Les retours trop dur / trop facile
        sont aussi sur Générateur.
      </p>
      {offline ? <Banner>APIs inaccessibles. Relance le serveur local (proxy staging).</Banner> : null}
      {error ? <Banner tone="error">{error}</Banner> : null}

      <Section title="Maintenant">
        <Card label="Support ouvert" value={support.length} />
        <Card label="Avis en attente" value={reviews.length} />
        <Card label="Essais 48 h" value={trials.length} />
        <Card label="Résil fin de période" value={data?.cancel_at_period_end} />
      </Section>

      <Section title="Retours séances (période)">
        {cats.length ? (
          cats.map((row) => <Card key={row.type} label={row.type} value={row.count} />)
        ) : (
          <Card label="Aucun retour sur la période" value="-" />
        )}
      </Section>
      <Section title="Raisons d’annulation">
        {reasons.length ? (
          reasons.map((row) => <Card key={row.reason} label={row.reason} value={row.count} />)
        ) : (
          <Card label="Pas de cancel_survey" value="-" />
        )}
      </Section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 750, color: "#0c1a2e", margin: "0 0 12px" }}>
          Conversations ouvertes
        </h2>
        {support.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {support.map((c) => (
              <article
                key={c.id}
                style={{
                  background: "#fff",
                  border: "1px solid #d8dee6",
                  borderRadius: 14,
                  padding: 14,
                }}
              >
                <div style={{ fontSize: 13, color: "#7a8a9a", marginBottom: 6 }}>
                  #{c.short_code} · {c.updated_at ? new Date(c.updated_at).toLocaleString("fr-FR") : ""}
                </div>
                <p style={{ margin: "0 0 8px", whiteSpace: "pre-wrap" }}>{c.last_body || "(vide)"}</p>
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/admin/arthur-nageurs?q=${encodeURIComponent(c.user_id)}`)
                  }
                  style={{
                    background: "#154388",
                    color: "#fff",
                    border: 0,
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Fiche nageur
                </button>
              </article>
            ))}
          </div>
        ) : (
          <p style={{ color: "#7a8a9a" }}>Aucune conversation ouverte.</p>
        )}
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 750, color: "#0c1a2e", margin: "0 0 12px" }}>
          Avis landing
        </h2>
        {reviews.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reviews.map((r) => (
              <article
                key={r.id}
                style={{
                  background: "#fff",
                  border: "1px solid #d8dee6",
                  borderRadius: 14,
                  padding: 14,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                  {r.author_name} · {r.rating}/5
                </div>
                <p style={{ margin: "0 0 10px", whiteSpace: "pre-wrap" }}>{r.body}</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => moderate(r.id, "published")}
                    style={{
                      background: "#1f7a4c",
                      color: "#fff",
                      border: 0,
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Publier
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => moderate(r.id, "rejected")}
                    style={{
                      background: "#c45c26",
                      color: "#fff",
                      border: 0,
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Refuser
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p style={{ color: "#7a8a9a" }}>Aucun avis en attente.</p>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: 18, fontWeight: 750, color: "#0c1a2e", margin: "0 0 12px" }}>
          Essais qui se terminent
        </h2>
        {trials.length ? (
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {trials.map((t) => (
              <li key={t.user_id} style={{ marginBottom: 8 }}>
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/admin/arthur-nageurs?q=${encodeURIComponent(t.user_id)}`)
                  }
                  style={{
                    background: "transparent",
                    border: 0,
                    color: "#154388",
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {t.user_id.slice(0, 8)}…
                </button>
                <span style={{ color: "#7a8a9a", fontSize: 14, marginLeft: 8 }}>
                  {t.trial_ends_at ? new Date(t.trial_ends_at).toLocaleString("fr-FR") : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: "#7a8a9a" }}>Aucun essai dans les 48 h.</p>
        )}
      </section>
    </main>
  );
}
