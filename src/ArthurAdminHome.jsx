import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useArthurAdmin } from "./ArthurAdminShell.jsx";
import { FunnelChart, LineChart } from "./admin/AdminCharts.jsx";
import { Banner, Card, PageHead, Section } from "./admin/AdminUi.jsx";
import { adminGetJson } from "./lib/arthur-admin-auth.js";
import { deltaLabel, pct } from "./admin/admin-format.js";

export default function ArthurAdminHome() {
  const { headers, days, setDays } = useArthurAdmin();
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState("");
  const [nageurs, setNageurs] = useState(null);
  const [ops, setOps] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const h = await headers();
      const q = `days=${days}`;
      const [n, o] = await Promise.all([
        adminGetJson(`/api/admin/arthur-readiness?nageurs=1&${q}`, h),
        adminGetJson("/api/admin/arthur-readiness?ops=1", h),
      ]);
      setNageurs(n.missing ? null : n);
      setOps(o.missing ? null : o);
      setOffline(Boolean(n.offline && o.offline));
      const denied = [n, o].find((x) => x.auth);
      if (denied) setError(denied.error || "Accès refusé");
    } catch {
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, [days, headers]);

  useEffect(() => {
    load();
  }, [load]);

  const a = nageurs?.activation || {};
  const u = nageurs?.usage || {};
  const m = nageurs?.money || {};
  const cmp = nageurs?.compare || {};
  const funnel = (nageurs?.funnel || []).filter((s) => s.available);
  const missing = (nageurs?.funnel || []).filter((s) => !s.available);
  const daily = nageurs?.daily || [];
  const trialsEnding = ops?.trials_ending || [];
  const supportOpen = ops?.support_open || [];

  const conversion = m.d7?.rate;
  const alerts = [];
  if (m.paying_or_trial_no_session > 0) {
    alerts.push(`${m.paying_or_trial_no_session} essai ou payant sans séance.`);
  }
  if (trialsEnding.length) {
    alerts.push(`${trialsEnding.length} essai(s) se terminent dans 48 h.`);
  }
  if (supportOpen.length) {
    alerts.push(`${supportOpen.length} conversation(s) support ouvertes.`);
  }
  if (nageurs?.engine?.too_hard_rate != null && nageurs.engine.too_hard_rate >= 0.35) {
    alerts.push("Hausse des retours trop durs. Voir Générateur.");
  }

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px 72px" }}>
      <PageHead title="Cockpit" days={days} setDays={setDays} loading={loading} onReload={load} />
      <p style={{ color: "#5a6a7a", margin: "0 0 24px", fontSize: 16, lineHeight: 1.5 }}>
        Est-ce que MySWYM va mieux ? Usage réel, conversion, alertes produit. Instagram est dans son onglet.
      </p>
      {offline ? <Banner>Les APIs ne répondent pas. Relance le serveur local.</Banner> : null}
      {error ? <Banner tone="error">{error}</Banner> : null}

      {(nageurs?.insights || []).length ? (
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 750, color: "#0c1a2e", margin: "0 0 12px" }}>
            Insights
          </h2>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {nageurs.insights.slice(0, 5).map((text) => (
              <li
                key={text}
                style={{
                  background: "#fff",
                  border: "1px solid #d8dee6",
                  borderRadius: 14,
                  padding: "14px 16px",
                  marginBottom: 8,
                  fontSize: 15,
                  color: "#0c1a2e",
                  lineHeight: 1.45,
                }}
              >
                {text}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Section title="À faire aujourd’hui">
        {alerts.length ? (
          alerts.slice(0, 5).map((text) => (
            <Card key={text} label="Alerte produit" value="Voir" hint={text} to="/admin/feedbacks" />
          ))
        ) : (
          <Card label="Rien d’urgent" value="OK" hint="Pas d’alerte produit sur cette période." />
        )}
        <Card
          to="/admin/feedbacks"
          label="Support ouvert"
          value={ops ? supportOpen.length : "-"}
        />
        <Card
          to="/admin/business"
          label="Essais 48 h"
          value={ops ? trialsEnding.length : "-"}
        />
      </Section>

      <Section title="Maintenant">
        <Card
          to="/admin/activite"
          label="Nageurs actifs"
          value={u.swimmers_period}
          hint={deltaLabel(u.swimmers_period, cmp.swimmers_period)}
        />
        <Card
          to="/admin/arthur-nageurs"
          label="Nouveaux comptes"
          value={a.signups}
          hint={deltaLabel(a.signups, cmp.signups)}
        />
        <Card
          to="/admin/activite"
          label="Séances générées"
          value={u.sessions_planned}
          hint={deltaLabel(u.sessions_planned, cmp.sessions_planned)}
        />
        <Card
          to="/admin/activite"
          label="Séances terminées"
          value={u.sessions_done}
          hint={deltaLabel(u.sessions_done, cmp.sessions_done)}
        />
        <Card
          label="Terminées / actif"
          value={
            u.swimmers_period
              ? Math.round((Number(u.sessions_done || 0) / u.swimmers_period) * 10) / 10
              : "-"
          }
        />
        <Card to="/admin/business" label="Trials actifs" value={m.trial} />
        <Card to="/admin/business" label="Payants" value={m.active} />
        <Card
          to="/admin/business"
          label="Essai → payant J7"
          value={pct(conversion)}
          hint={m.d7 ? `${m.d7.converted} / ${m.d7.eligible}` : ""}
        />
        <Card
          label="MRR"
          value="Données insuffisantes"
          hint="Pas de Stripe live sur Vercel. Ne pas afficher un revenu approximatif."
        />
      </Section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <FunnelChart
          steps={funnel.map((s) => ({ label: s.label, value: s.value ?? 0 }))}
          caption={
            missing.length
              ? `Pas encore mesuré : ${missing.map((s) => s.label.toLowerCase()).join(", ")}.`
              : ""
          }
        />
        <LineChart
          title="Inscriptions par jour"
          points={daily.map((d) => ({ label: d.day, value: d.signups }))}
          caption="Événement signup_completed."
        />
      </div>

      <p style={{ color: "#5a6a7a", fontSize: 14, margin: 0 }}>
        Instagram :{" "}
        <Link to="/admin/instagram" style={{ color: "#154388", fontWeight: 700 }}>
          onglet dédié
        </Link>
        . Détail nageurs, générateur et business dans la nav.
      </p>
    </main>
  );
}
