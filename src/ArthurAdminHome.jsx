import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useArthurAdmin } from "./ArthurAdminShell.jsx";
import { DonutChart, FunnelChart } from "./admin/AdminCharts.jsx";
import { adminGetJson } from "./lib/arthur-admin-auth.js";

function dash(v) {
  if (v == null || v === "") return "-";
  if (typeof v === "number" && Number.isNaN(v)) return "-";
  return v;
}

function pct(n) {
  if (n == null || Number.isNaN(Number(n))) return "-";
  const x = Number(n);
  const ratio = x > 1 ? x / 100 : x;
  return `${Math.round(ratio * 100)} %`;
}


function Card({ label, value, hint, to }) {
  const inner = (
    <>
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
    </>
  );
  const box = {
    background: "#fff",
    border: "1px solid #d8dee6",
    borderRadius: 14,
    padding: 16,
    minHeight: 108,
    textDecoration: "none",
    color: "inherit",
    display: "block",
  };
  return to ? (
    <Link to={to} style={box}>
      {inner}
    </Link>
  ) : (
    <div style={box}>{inner}</div>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 28 }}>
      {title ? (
      <h2
        style={{
          fontSize: 18,
          fontWeight: 750,
          color: "#0c1a2e",
          margin: "0 0 12px",
        }}
      >
        {title}
      </h2>
      ) : null}
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

export default function ArthurAdminHome() {
  const { headers } = useArthurAdmin();
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [growth, setGrowth] = useState(null);
  const [shadow, setShadow] = useState(null);
  const [followups, setFollowups] = useState(null);
  const [quality, setQuality] = useState(null);
  const [health, setHealth] = useState(null);
  const [nageurs, setNageurs] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const h = await headers();
      const q = `days=${days}`;
      const [g, s, f, o, r, n] = await Promise.all([
        adminGetJson(`/api/admin/arthur-growth?${q}`, h),
        adminGetJson(`/api/admin/arthur-shadow?status=pending&${q}`, h),
        adminGetJson(`/api/admin/arthur-followups?${q}`, h),
        adminGetJson(`/api/admin/arthur-optimize?${q}`, h),
        adminGetJson("/api/admin/arthur-readiness", h),
        adminGetJson(`/api/admin/arthur-readiness?nageurs=1&${q}`, h),
      ]);
      setGrowth(g.missing ? null : g);
      setShadow(s.missing ? null : s);
      setFollowups(f.missing ? null : f);
      setQuality(o.missing ? null : o);
      setHealth(r.missing ? null : r);
      setNageurs(n.missing ? null : n);
      const rows = [g, s, f, o, r, n];
      setOffline(rows.every((x) => x.offline));
      const denied = rows.find((x) => x.auth);
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

  const funnel = growth?.funnel || {};
  const scores = growth?.score_distribution || {};
  const report = shadow?.report || {};
  const counts = followups?.counts || {};
  const q = quality?.quality || {};
  const band = q.band || {};
  const checks = health?.checks || [];
  const okChecks = checks.filter((c) => c.ok).length;
  const takeovers =
    health?.active_takeover_count ?? (health?.active_takeovers || []).length;
  const waiting = report.pending ?? 0;
  const reels = growth?.by_reel || [];
  const bestReel = reels[0];
  const act = nageurs?.activation || {};
  const usageNageurs = nageurs?.usage || {};
  const eng = nageurs?.engine || {};
  const mon = nageurs?.money || {};

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
          Vue d’ensemble
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
        Tous les compteurs au même endroit. Clique une carte pour voir le détail.
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
          Les APIs ne répondent pas. Relance <code>npm run dev</code> pour
          proxyfier vers staging, ou vérifie DEV_API_ORIGIN.
        </p>
      ) : null}
      {error ? (
        <p
          style={{
            background: "#fde8e4",
            color: "#8a2b1a",
            padding: 14,
            borderRadius: 10,
            marginBottom: 20,
            lineHeight: 1.5,
          }}
        >
          {error}
        </p>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div
          style={{
            background: "#fff",
            border: "1px solid #d8dee6",
            borderRadius: 16,
            padding: 18,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 750, margin: "0 0 8px", color: "#0c1a2e" }}>
            À faire aujourd’hui
          </h2>
          <p style={{ margin: "0 0 14px", color: "#5a6a7a", fontSize: 14, lineHeight: 1.45 }}>
            Réponses Instagram à valider, et relances prêtes. Rien ne part tout seul.
          </p>
          <Section title="">
            <Card
              to="/admin/instagram"
              label="Réponses à valider"
              value={waiting}
              hint="Arthur a préparé un texte."
            />
            <Card
              to="/admin/instagram"
              label="Relances prêtes"
              value={counts.approved ?? counts.planned}
              hint="À envoyer quand tu es OK."
            />
            <Card
              to="/admin/instagram"
              label="Messages reçus"
              value={funnel.dm}
              hint="Personnes qui ont écrit."
            />
          </Section>
        </div>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 750, margin: "0 0 8px", color: "#0c1a2e" }}>
            Instagram → abonnés
          </h2>
          <p style={{ margin: "0 0 14px", color: "#5a6a7a", fontSize: 14, lineHeight: 1.45 }}>
            {funnel.dm
              ? `${pct(funnel.signup / funnel.dm)} des messages deviennent un compte.`
              : "L’entonnoir se remplit dès les premiers messages."}
          </p>
          <div style={{ display: "grid", gap: 12 }}>
            <FunnelChart
              steps={[
                { label: "Messages", value: funnel.dm ?? 0 },
                { label: "Comptes", value: funnel.signup ?? 0 },
                { label: "Payants", value: funnel.premium ?? 0 },
              ]}
              caption={
                bestReel
                  ? `Meilleure vidéo : ${bestReel.reel_id || "une vidéo"}.`
                  : "Les vidéos apparaîtront ici."
              }
            />
            <DonutChart
              title="Qui est chaud"
              slices={[
                { label: "Chaud", value: scores.hot ?? 0 },
                { label: "Tiède", value: scores.warm ?? 0 },
                { label: "Froid", value: scores.cold ?? 0 },
              ]}
            />
          </div>
        </div>
      </div>

      <Section title="Les nageurs">
        <Card
          to="/admin/arthur-nageurs"
          label="1re séance faite"
          value={act.first_session}
          hint="Ils sont vraiment allés à l’eau."
        />
        <Card
          to="/admin/arthur-nageurs"
          label="Nageurs cette semaine"
          value={usageNageurs.swimmers_7d}
          hint="Au moins une séance sur 7 jours."
        />
        <Card
          to="/admin/arthur-nageurs"
          label="Trop dur"
          value={eng.too_hard}
          hint="Retours « trop difficile »."
        />
        <Card
          to="/admin/arthur-nageurs"
          label="Payent sans séance"
          value={mon.paying_or_trial_no_session}
          hint="Essai ou payant, jamais nagé."
        />
        <Card
          to="/admin/arthur-nageurs"
          label="Plan → 1re séance"
          value={pct(nageurs?.dropoff?.plan_to_first)}
          hint="Où le produit perd les gens."
        />
        <Card
          to="/admin/arthur-nageurs"
          label="Essai → payant J7"
          value={pct(nageurs?.money?.d7?.rate)}
          hint="Parmi les essais de plus de 7 jours."
        />
      </Section>

      <Section title="Arthur aide ?">
        <Card
          to="/admin/instagram"
          label="Note moyenne"
          value={dash(q.avg_score)}
          hint="Qualité des réponses, sur 100."
        />
        <Card
          to="/admin/instagram"
          label="Très bonnes"
          value={band.strong ?? 0}
        />
        <Card
          to="/admin/instagram"
          label="À revoir"
          value={band.weak ?? 0}
        />
        <Card
          to="/admin/instagram"
          label="Propose de s’inscrire"
          value={pct(q.cta_rate)}
        />
        <Card
          to="/admin/coulisses"
          label="Contrôles OK"
          value={checks.length ? `${okChecks}/${checks.length}` : "-"}
        />
        <Card
          to="/admin/coulisses"
          label="Conversations reprises"
          value={takeovers}
          hint="Tu as pris la main à la place d’Arthur."
        />
      </Section>

      <p style={{ color: "#5a6a7a", fontSize: 14, margin: "8px 0 0" }}>
        Branchements Instagram, Ollama et Telegram :{" "}
        <Link to="/admin/coulisses" style={{ color: "#154388", fontWeight: 700 }}>
          Coulisses
        </Link>
        .
      </p>
    </main>
  );
}
