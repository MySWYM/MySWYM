import { useCallback, useEffect, useState } from "react";
import { useArthurAdmin } from "./ArthurAdminShell.jsx";

function dash(v) {
  if (v == null || v === "") return "—";
  if (typeof v === "number" && Number.isNaN(v)) return "—";
  return v;
}

function pct(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `${Math.round(Number(n) * 100)} %`;
}

function hoursLabel(h) {
  if (h == null || Number.isNaN(Number(h))) return "—";
  const x = Number(h);
  if (x < 1) return `${Math.round(x * 60)} min`;
  if (x < 48) return `${Math.round(x)} h`;
  return `${Math.round(x / 24)} j`;
}

async function getJson(url, headers) {
  const res = await fetch(url, { headers, cache: "no-store" });
  const type = res.headers.get("content-type") || "";
  if (!type.includes("application/json")) return { missing: true };
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.ok === false) {
    return { missing: true, error: json.error || `HTTP ${res.status}` };
  }
  return json;
}

function Card({ label, value, hint }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #d8dee6",
        borderRadius: 14,
        padding: 16,
        minHeight: 108,
      }}
    >
      <div style={{ fontSize: 14, color: "#5a6a7a", lineHeight: 1.35 }}>{label}</div>
      <div
        style={{
          fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif",
          fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
          fontWeight: 800,
          color: "#0c1a2e",
          lineHeight: 1.15,
          marginTop: 6,
        }}
      >
        {dash(value)}
      </div>
      {hint ? (
        <div style={{ fontSize: 13, color: "#7a8a9a", marginTop: 6, lineHeight: 1.4 }}>{hint}</div>
      ) : null}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 18, fontWeight: 750, color: "#0c1a2e", margin: "0 0 12px" }}>
        {title}
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
        }}
      >
        {children}
      </div>
    </section>
  );
}

export default function ArthurNageursAdmin() {
  const { headers } = useArthurAdmin();
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const h = await headers();
      const json = await getJson(`/api/admin/arthur-readiness?nageurs=1&days=${days}`, h);
      if (json.missing) {
        setData(null);
        setOffline(true);
      } else {
        setData(json);
        setOffline(false);
      }
    } catch {
      setData(null);
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, [days, headers]);

  useEffect(() => {
    load();
  }, [load]);

  const a = data?.activation || {};
  const u = data?.usage || {};
  const e = data?.engine || {};
  const m = data?.money || {};
  const notes = data?.notes || [];
  const hardTypes = e.hard_by_type || [];
  const reasons = m.cancel_reasons || [];

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
          Les nageurs
        </h1>
        <label style={{ fontSize: 14, color: "#5a6a7a" }}>
          Période{" "}
          <select
            value={days}
            onChange={(ev) => setDays(Number(ev.target.value))}
            style={{ marginLeft: 6, padding: "10px 12px", minHeight: 44, borderRadius: 8, fontSize: 16 }}
          >
            <option value={7}>7 jours</option>
            <option value={30}>30 jours</option>
            <option value={90}>90 jours</option>
          </select>
        </label>
        <button
          type="button"
          disabled={loading}
          onClick={load}
          style={{
            minHeight: 44,
            padding: "10px 16px",
            border: 0,
            borderRadius: 10,
            background: "#154388",
            color: "#fff",
            fontWeight: 700,
            cursor: loading ? "wait" : "pointer",
            fontSize: 15,
          }}
        >
          {loading ? "Chargement…" : "Actualiser"}
        </button>
      </div>
      <p style={{ color: "#5a6a7a", margin: "0 0 24px", fontSize: 16, lineHeight: 1.5 }}>
        Est-ce qu’ils nagent vraiment ? Pas Instagram : le produit. 1re séance, habitude, trop dur /
        trop facile, et ceux qui paient sans jamais aller à l’eau.
      </p>

      {offline ? (
        <p
          style={{
            background: "#fff6e8",
            color: "#7a4a12",
            padding: 14,
            borderRadius: 10,
            marginBottom: 20,
            lineHeight: 1.5,
          }}
        >
          Les chiffres se remplissent sur staging / prod. En local, la page s’ouvre mais reste à zéro.
        </p>
      ) : null}

      {notes.length ? (
        <p
          style={{
            background: "#f4f7fb",
            color: "#5a6a7a",
            padding: 14,
            borderRadius: 10,
            marginBottom: 20,
            lineHeight: 1.5,
            fontSize: 14,
          }}
        >
          {notes.join(" ")}
        </p>
      ) : null}

      <Section title="Arrivent-ils jusqu’à l’eau ?">
        <Card label="Inscriptions" value={a.signups} hint="Comptes créés sur la période." />
        <Card label="Plan créé" value={a.plans} hint="Ils ont un programme." />
        <Card
          label="1re séance faite"
          value={a.first_session}
          hint="Le vrai démarrage. Si c’est bas, l’app perd les gens avant l’eau."
        />
        <Card
          label="2e séance faite"
          value={a.second_session}
          hint="Là ça commence à coller."
        />
        <Card label="Inscription → plan" value={pct(a.signup_to_plan)} />
        <Card label="Plan → 1re séance" value={pct(a.plan_to_first)} />
        <Card label="1re → 2e séance" value={pct(a.first_to_second)} />
        <Card
          label="Délai avant la 1re"
          value={hoursLabel(a.median_hours_to_first)}
          hint="Médiane. Plus c’est long, plus ils oublient."
        />
      </Section>

      <Section title="Est-ce qu’ils reviennent ?">
        <Card
          label="Nageurs cette semaine"
          value={u.swimmers_7d}
          hint="Au moins une séance (ou un retour) sur 7 jours."
        />
        <Card
          label="Nageurs sur la période"
          value={u.swimmers_period}
        />
        <Card label="Séances prévues" value={u.sessions_planned} />
        <Card label="Séances faites" value={u.sessions_done} />
        <Card label="Séances sautées" value={u.sessions_skipped} />
        <Card
          label="Taux de séances faites"
          value={pct(u.completion_rate)}
          hint="Fait / prévu. C’est le cœur du produit."
        />
      </Section>

      <Section title="Le moteur est-il juste ?">
        <Card label="Retours reçus" value={e.feedbacks} hint="Après une séance." />
        <Card
          label="Trop dur"
          value={e.too_hard}
          hint={pct(e.too_hard_rate)}
        />
        <Card label="Trop facile" value={e.too_easy} hint={pct(e.too_easy_rate)} />
        <Card label="Bien calibré" value={e.ok} />
        <Card
          label="Douleur signalée"
          value={e.pain}
          hint="À regarder tout de suite si ça monte."
        />
      </Section>

      {hardTypes.length ? (
        <Section title="Séances trop dures (types)">
          {hardTypes.map((row) => (
            <Card key={row.type} label={row.type} value={row.count} />
          ))}
        </Section>
      ) : null}

      <Section title="Argent qui tient">
        <Card label="En essai (maintenant)" value={m.trial} />
        <Card label="Payants (maintenant)" value={m.active} />
        <Card label="Annulés" value={m.canceled} />
        <Card label="Expirés" value={m.expired} />
        <Card label="Paniers ouverts" value={m.checkouts} hint="Sur la période." />
        <Card label="Essais commencés" value={m.trials_started} />
        <Card label="Paiements" value={m.payments} />
        <Card
          label="Payent (ou essai) sans séance"
          value={m.paying_or_trial_no_session}
          hint="Ils paient mais n’ont jamais nagé. Alarme produit."
        />
      </Section>

      {reasons.length ? (
        <Section title="Pourquoi ils partent">
          {reasons.map((row) => (
            <Card key={row.reason} label={row.reason} value={row.count} />
          ))}
        </Section>
      ) : null}
    </main>
  );
}
