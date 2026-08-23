import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useArthurAdmin } from "./ArthurAdminShell.jsx";

function dash(v) {
  if (v == null || v === "") return "—";
  if (typeof v === "number" && Number.isNaN(v)) return "—";
  return v;
}

function pct(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  const x = Number(n);
  const ratio = x > 1 ? x / 100 : x;
  return `${Math.round(ratio * 100)} %`;
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const h = await headers();
      const q = `days=${days}`;
      const [g, s, f, o, r, n] = await Promise.all([
        getJson(`/api/admin/arthur-growth?${q}`, h),
        getJson(`/api/admin/arthur-shadow?status=pending&${q}`, h),
        getJson(`/api/admin/arthur-followups?${q}`, h),
        getJson(`/api/admin/arthur-optimize?${q}`, h),
        getJson("/api/admin/arthur-readiness", h),
        getJson(`/api/admin/arthur-readiness?nageurs=1&${q}`, h),
      ]);
      setGrowth(g.missing ? null : g);
      setShadow(s.missing ? null : s);
      setFollowups(f.missing ? null : f);
      setQuality(o.missing ? null : o);
      setHealth(r.missing ? null : r);
      setNageurs(n.missing ? null : n);
      setOffline([g, s, f, o, r, n].every((x) => x.missing));
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
  const scores = growth?.score_distribution || growth?.score_distribution || {};
  const report = shadow?.report || {};
  const counts = followups?.counts || {};
  const outcomes = followups?.outcomes || {};
  const rates = followups?.rates || {};
  const q = quality?.quality || {};
  const band = q.band || {};
  const conv = quality?.conversations || {};
  const drop = conv.drop_risk || conv.drop_risk || {};
  const cta = quality?.cta || {};
  const checks = health?.checks || [];
  const okChecks = checks.filter((c) => c.ok).length;
  const takeovers = health?.active_takeover_count ?? health?.active_takeover_count ?? (health?.active_takeovers || []).length;
  const events = (shadow?.recent_events || shadow?.recent_events || []).length;
  const waiting = report.pending ?? 0;
  const reels = growth?.by_reel || growth?.by_reel || [];
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
          Les chiffres se remplissent quand l’admin est en ligne (staging). En local, les pages
          s’ouvrent mais restent à zéro.
        </p>
      ) : null}

      <Section title="À regarder en premier">
        <Card
          to="/admin/arthur-shadow"
          label="Messages à valider"
          value={waiting}
          hint="Arthur a préparé une réponse. À toi de dire oui ou non."
        />
        <Card
          to="/admin/arthur-growth"
          label="Messages Instagram reçus"
          value={funnel.dm}
          hint="Personnes qui ont écrit."
        />
        <Card
          to="/admin/arthur-growth"
          label="Comptes créés"
          value={funnel.signup}
          hint="Ils se sont inscrits sur MySWYM."
        />
        <Card
          to="/admin/arthur-growth"
          label="Abonnés payants"
          value={funnel.premium}
          hint="Ils paient l’abonnement."
        />
      </Section>

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

      <Section title="Du message à l’abonnement">
        <Card label="Personnes intéressées" value={funnel.leads} hint="On a leur contact." />
        <Card
          label="Vraiment intéressées"
          value={funnel.qualified}
          hint="Elles ont un vrai projet nage."
        />
        <Card
          label="Message → inscription"
          value={pct(funnel.dm ? funnel.signup / funnel.dm : null)}
        />
        <Card
          label="Inscription → payant"
          value={pct(funnel.signup ? funnel.premium / funnel.signup : null)}
        />
        <Card
          label="Message → payant"
          value={pct(funnel.dm ? funnel.premium / funnel.dm : null)}
        />
        <Card label="Vidéos suivies" value={reels.length} hint="Combien de Reels ont amené du monde." />
      </Section>

      <Section title="Qui a envie de nager">
        <Card label="Très motivé" value={scores.hot} hint="Chaud : à relancer vite." />
        <Card label="Un peu intéressé" value={scores.warm} />
        <Card label="Pas trop chaud" value={scores.cold} />
        <Card
          label="Meilleure vidéo"
          value={bestReel ? dash(bestReel.premium ?? bestReel.signup ?? bestReel.dm) : "—"}
          hint={bestReel ? `Payants / inscrits depuis ${bestReel.reel_id || "une vidéo"}` : "Pas encore de vidéo."}
        />
      </Section>

      <Section title="Boîte de réception Instagram">
        <Card to="/admin/arthur-shadow" label="En attente" value={waiting} />
        <Card to="/admin/arthur-shadow" label="Déjà validés" value={report.approved} />
        <Card to="/admin/arthur-shadow" label="Ignorés" value={report.rejected} />
        <Card label="Propositions au total" value={report.total} />
        <Card label="Activité Instagram" value={events} hint="Événements récents (webhooks, DM…)." />
        <Card
          label="Envoi auto des réponses"
          value={shadow?.live_send ? "Oui" : "Non"}
          hint="Doit rester Non tant que tu valides à la main."
        />
      </Section>

      <Section title="Relances">
        <Card to="/admin/arthur-followups" label="Prévues" value={counts.planned} />
        <Card to="/admin/arthur-followups" label="OK pour envoyer" value={counts.approved} />
        <Card to="/admin/arthur-followups" label="Déjà envoyées" value={counts.sent} />
        <Card label="Annulées / bloquées" value={(counts.cancelled || 0) + (counts.suppressed || 0)} />
        <Card label="Ont répondu" value={pct(rates.reply_rate)} hint={`${dash(outcomes.replied)} réponses`} />
        <Card label="Se sont inscrits après" value={pct(rates.signup_rate)} />
        <Card label="Sont devenus payants" value={pct(rates.premium_rate)} />
        <Card
          label="Relances auto"
          value={
            followups?.send_gate === "live" || followups?.send_gate === "live"
              ? "Oui"
              : followups?.send_gate === "mock" || followups?.send_gate === "mock"
                ? "Essai"
                : "Non"
          }
          hint="Non = rien ne part tout seul."
        />
      </Section>

      <Section title="Qualité des réponses d’Arthur">
        <Card
          to="/admin/arthur-optimize"
          label="Réponses notées"
          value={q.responses_scored ?? q.responses_scored}
        />
        <Card
          to="/admin/arthur-optimize"
          label="Note moyenne"
          value={q.avg_score ?? q.avg_score ?? "—"}
          hint="Sur 100."
        />
        <Card label="Très bonnes" value={band.strong} />
        <Card label="Correctes" value={band.ok} />
        <Card label="À améliorer" value={band.weak} />
        <Card label="Avec un appel à s’inscrire" value={pct(q.cta_rate)} />
        <Card label="Appels envoyés" value={cta.sent} />
        <Card label="Conversations analysées" value={conv.analyzed} />
        <Card label="Risque d’abandon élevé" value={drop.high} />
        <Card label="Fiches coaching" value={quality?.knowledge?.active_snippets} />
      </Section>

      <Section title="Santé du système">
        <Card
          to="/admin/arthur-readiness"
          label="Prêt à grandir"
          value={health?.ready_for_scale || health?.ready_for_scale ? "Oui" : "Pas encore"}
        />
        <Card
          label="Contrôles OK"
          value={checks.length ? `${okChecks} / ${checks.length}` : "—"}
        />
        <Card
          label="Conversations reprises à la main"
          value={takeovers}
          hint="Tu as pris la main à la place d’Arthur."
        />
        <Card
          label="Dépense du jour"
          value={
            health?.cost?.status?.dayUsd != null
              ? `${health.cost.status.dayUsd} $`
              : health?.cost?.dayCost != null
                ? `${health.cost.dayCost} $`
                : "—"
          }
        />
        <Card
          label="Instagram en mode test"
          value={shadow?.shadow_mode || health?.instagram_shadow ? "Oui" : "Non"}
          hint="Oui = Arthur propose, il n’envoie pas."
        />
        <Card
          label="Arthur allumé"
          value={health?.flags?.enabled === false ? "Non" : "Oui"}
        />
      </Section>
    </main>
  );
}
