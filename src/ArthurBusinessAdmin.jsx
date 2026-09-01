import { useCallback, useEffect, useState } from "react";
import { useArthurAdmin } from "./ArthurAdminShell.jsx";
import { Banner, Card, PageHead, Section } from "./admin/AdminUi.jsx";
import { adminGetJson } from "./lib/arthur-admin-auth.js";
import { pct } from "./admin/admin-format.js";

export default function ArthurBusinessAdmin() {
  const { headers, days, setDays } = useArthurAdmin();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [ops, setOps] = useState(null);
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const h = await headers();
      const [n, o] = await Promise.all([
        adminGetJson(`/api/admin/arthur-readiness?nageurs=1&days=${days}`, h),
        adminGetJson("/api/admin/arthur-readiness?ops=1", h),
      ]);
      setData(n.missing ? null : n);
      setOps(o.missing ? null : o);
      setOffline(Boolean(n.offline && o.offline));
    } catch {
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, [days, headers]);

  useEffect(() => {
    load();
  }, [load]);

  const m = data?.money || {};
  const d7 = m.d7 || {};
  const d30 = m.d30_churn || {};
  const byGoal = data?.slices?.by_objective || [];

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px 72px" }}>
      <PageHead title="Business" days={days} setDays={setDays} loading={loading} onReload={load} />
      <p style={{ color: "#5a6a7a", margin: "0 0 24px", fontSize: 16, lineHeight: 1.5 }}>
        Accès réels (user_access_state.access_status). MRR Stripe live : pas calculable ici.
      </p>
      {offline ? <Banner>APIs inaccessibles.</Banner> : null}

      <Section title="Accès (instantané)">
        <Card label="Trials actifs" value={m.trial} />
        <Card label="Payants" value={m.active} />
        <Card label="Annulés" value={m.canceled} />
        <Card label="Expirés" value={m.expired} />
        <Card label="Résil fin de période" value={ops?.cancel_at_period_end} />
        <Card label="Essais 48 h" value={ops?.trials_ending?.length} />
      </Section>

      <Section title="Sur la période">
        <Card label="Trials démarrés" value={m.trials_started} />
        <Card label="Paiements (events)" value={m.payments} />
        <Card label="Paniers" value={m.checkouts} />
        <Card label="Essai → payant J7" value={pct(d7.rate)} hint={`${d7.converted || 0} / ${d7.eligible || 0}`} />
        <Card label="Churn 30 j" value={pct(d30.rate)} hint={`${d30.churned || 0} / ${d30.eligible || 0}`} />
        <Card
          label="Payent sans séance"
          value={m.paying_or_trial_no_session}
          hint="Alarme produit."
        />
        <Card
          label="Mensuel / annuel"
          value="Données insuffisantes"
          hint="price_id pas toujours dans conversion_events. Pas de MRR estimé affiché comme vrai."
        />
      </Section>

      <Section title="Objectif × activité (période)">
        {byGoal.length ? (
          byGoal.map((row) => (
            <Card
              key={row.type}
              label={row.type}
              value={row.nageurs}
              hint={`${Math.round((row.pct_actifs || 0) * 100)} % actifs · ${row.seances_moy ?? "-"} séances / nageur`}
            />
          ))
        ) : (
          <Card label="Pas encore de profils" value="-" />
        )}
      </Section>
      <Section title="Objectif × conversion (paiements sur la période)">
        {(data?.money?.by_objective || []).length ? (
          data.money.by_objective.map((row) => (
            <Card
              key={row.type}
              label={row.type}
              value={row.payants}
              hint={`${row.nageurs} nageurs · conversion ${pct(row.conversion)}`}
            />
          ))
        ) : (
          <Card label="Pas encore de profils" value="-" />
        )}
      </Section>
    </main>
  );
}
