import { useCallback, useEffect, useState } from "react";
import { useArthurAdmin } from "./ArthurAdminShell.jsx";
import { Banner, Card, PageHead, Section } from "./admin/AdminUi.jsx";
import { adminGetJson } from "./lib/arthur-admin-auth.js";
import { pct } from "./admin/admin-format.js";

export default function ArthurGenerateurAdmin() {
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
  const e = data?.engine || {};
  const hardLevels = e.hard_by_level || [];
  const hardGoals = e.hard_by_goal || [];

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px 72px" }}>
      <PageHead title="Générateur" days={days} setDays={setDays} loading={loading} onReload={load} />
      <p style={{ color: "#5a6a7a", margin: "0 0 24px", fontSize: 16, lineHeight: 1.5 }}>
        Les séances sont-elles adaptées ? On mesure ce qui existe déjà. Le reste est marqué insuffisant, pas inventé.
      </p>
      {offline ? <Banner>APIs inaccessibles.</Banner> : null}

      <Section title="Comportement (proxies)">
        <Card
          label="Taux d’acceptation"
          value="Données insuffisantes"
          hint="Il manque workout_started. Proxy futur : commencées / générées."
        />
        <Card
          label="Taux de complétion"
          value={pct(u.completion_rate)}
          hint="Terminées / générées (planned_sessions). Pas commencées."
        />
        <Card
          label="Régénération"
          value="Données insuffisantes"
          hint="Pas d’event workout_regenerated."
        />
        <Card label="Sautées" value={u.sessions_skipped} />
        <Card label="Trop dur" value={e.too_hard} hint={pct(e.too_hard_rate)} />
        <Card label="Trop facile" value={e.too_easy} hint={pct(e.too_easy_rate)} />
        <Card label="Bien calibré" value={e.ok} />
        <Card
          label="Erreurs générateur"
          value="Données insuffisantes"
          hint="Pas de log succès/erreur/durée de génération."
        />
      </Section>

      <Section title="Trop dur, par niveau">
        {hardLevels.length
          ? hardLevels.map((row) => <Card key={row.type} label={row.type} value={row.count} />)
          : <Card label="Aucun retour trop dur" value="-" />}
      </Section>
      <Section title="Trop dur, par objectif">
        {hardGoals.length
          ? hardGoals.map((row) => <Card key={row.type} label={row.type} value={row.count} />)
          : <Card label="Aucun retour trop dur" value="-" />}
      </Section>

      <Section title="Versions du générateur">
        {(e.by_version || []).length ? (
          e.by_version.map((row) => (
            <Card
              key={row.type}
              label={row.type}
              value={row.generated}
              hint={`${pct(row.completion)} terminées · ${row.skipped} sautées`}
            />
          ))
        ) : (
          <Card
            label="Pas encore de version"
            value="Données insuffisantes"
            hint="Les nouvelles séances seront tamponnées 1.9 à la persistance."
          />
        )}
      </Section>

      <Section title="Catégories de retours">
        {(e.feedback_categories || []).length ? (
          e.feedback_categories.map((row) => (
            <Card key={row.type} label={row.type} value={row.count} />
          ))
        ) : (
          <Card label="Aucun retour" value="-" />
        )}
      </Section>

      <p style={{ color: "#7a8a9a", fontSize: 13, lineHeight: 1.5 }}>
        Input (matériel, 4 nages, zones) : pas stocké par séance. Version tamponnée à la persistance
        (1.9). Anciennes séances : « inconnue » jusqu’à une nouvelle sauvegarde du plan.
      </p>
    </main>
  );
}
