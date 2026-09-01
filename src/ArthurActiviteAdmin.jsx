import { useCallback, useEffect, useState } from "react";
import { useArthurAdmin } from "./ArthurAdminShell.jsx";
import { LineChart } from "./admin/AdminCharts.jsx";
import { Banner, Card, PageHead, Section } from "./admin/AdminUi.jsx";
import { adminGetJson } from "./lib/arthur-admin-auth.js";
import { pct } from "./admin/admin-format.js";

export default function ArthurActiviteAdmin() {
  const { headers, days, setDays } = useArthurAdmin();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const h = await headers();
      const json = await adminGetJson(`/api/admin/arthur-readiness?nageurs=1&days=${days}`, h);
      setOffline(Boolean(json.offline));
      setData(json.missing ? null : json);
    } catch {
      setOffline(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [days, headers]);

  useEffect(() => {
    load();
  }, [load]);

  const u = data?.usage || {};
  const weekly = u.weekly || {};
  const daily = data?.daily || [];

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px 72px" }}>
      <PageHead title="Activité" days={days} setDays={setDays} loading={loading} onReload={load} />
      <p style={{ color: "#5a6a7a", margin: "0 0 24px", fontSize: 16, lineHeight: 1.5 }}>
        Est-ce qu’ils nagent vraiment ? Séances générées et terminées, pas les logins.
      </p>
      {offline ? <Banner>APIs inaccessibles.</Banner> : null}

      <Section title="Usage">
        <Card label="Actifs D1" value={u.swimmers_1d} />
        <Card label="Actifs D7" value={u.swimmers_7d} />
        <Card label="Actifs D30" value={u.swimmers_30d} />
        <Card label="Actifs sur la période" value={u.swimmers_period} />
        <Card label="Séances générées" value={u.sessions_planned} />
        <Card label="Séances terminées" value={u.sessions_done} />
        <Card label="Sautées" value={u.sessions_skipped} />
        <Card label="Taux de complétion" value={pct(u.completion_rate)} />
        <Card
          label="Ouvertes / commencées"
          value="Données insuffisantes"
          hint="Événements workout_opened et workout_started pas encore émis."
        />
        <Card
          label="Régénérées"
          value="Données insuffisantes"
          hint="Événement workout_regenerated manquant."
        />
      </Section>

      <Section title="Cette semaine">
        <Card label="Nageurs avec un plan" value={weekly.users} />
        <Card label="0 séance" value={weekly.zero} />
        <Card label="1 séance" value={weekly.one} />
        <Card label="2 séances" value={weekly.two} />
        <Card label="3 ou plus" value={weekly.three_plus} />
      </Section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        <LineChart
          title="Séances terminées par jour"
          points={daily.map((d) => ({ label: d.day, value: d.sessions_done }))}
          caption="planned_sessions.status = completed."
        />
        <LineChart
          title="Trials démarrés par jour"
          points={daily.map((d) => ({ label: d.day, value: d.trials }))}
        />
      </div>
      {Array.isArray(data?.cohorts) && data.cohorts.length ? (
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 750, color: "#0c1a2e", margin: "0 0 8px" }}>
            Cohortes de rétention
          </h2>
          <p style={{ color: "#5a6a7a", margin: "0 0 12px", fontSize: 14, lineHeight: 1.45 }}>
            Inscriptions groupées par semaine. Une case = % ayant terminé une séance cette semaine-là (S0 = semaine d’inscription).
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr>
                  {["Cohorte", "N", "S0", "S1", "S2", "S3", "S4"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 10px", color: "#5a6a7a", fontWeight: 600 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.cohorts.map((row) => (
                  <tr key={row.cohort}>
                    <td style={{ padding: "8px 10px" }}>{row.cohort}</td>
                    <td style={{ padding: "8px 10px" }}>{row.size}</td>
                    {(row.rates || []).map((rate, i) => (
                      <td key={i} style={{ padding: "8px 10px" }}>
                        {rate == null ? "-" : pct(rate)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <p style={{ color: "#7a8a9a", fontSize: 13, marginTop: 16, lineHeight: 1.45 }}>
          Cohortes : pas assez d’inscriptions datées + séances terminées sur la fenêtre chargée.
        </p>
      )}
    </main>
  );
}
