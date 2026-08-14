/**
 * Vue séance live — design mobile validé (carte blocs + pyramide + charge + CTA).
 */
import { useMemo } from "react";
import { Waves, Target, Zap, Activity, Droplets, Timer, Lock, Play } from "lucide-react";
import PyramidBlockViz, { parsePyramidLine } from "./PyramidBlockViz.jsx";
import { finalizeCoachSession } from "./lib/sports-engine/coach-restitution.js";
import { lineSwimMeters } from "./lib/sports-engine/session-coherence.js";

const G = {
  ink: "#172b4d",
  inkSoft: "#4f6284",
  line: "#e7edf6",
  blue: "#355da3",
  blueSoft: "#eef4ff",
  blueTint: "#f6f9ff",
  surface: "#ffffff",
  grey: "#5a6f82",
  greyMid: "#8a96ab",
  greyLight: "#e8eef5",
  greyXLight: "#f4f7fb",
  mint: "#00c48c",
};

function stripPrefix(raw) {
  return String(raw || "").replace(/^[\s\-–—·→]+/, "").trim();
}

function parseMeters(text) {
  return lineSwimMeters(text);
}

function guessKind(text) {
  const t = String(text || "").toLowerCase();
  if (/échauff|mise en route|départ|souple/.test(t)) return "warm";
  if (/retour|calme|récup|rac\b/.test(t)) return "cool";
  if (/technique|éducatif|bras|rattrap|godille|chien|flèche/.test(t)) return "tech";
  if (/jambe|battement|planche|kick/.test(t)) return "kick";
  if (/pyramide|seuil|vma|vitesse|sprint|soutenu/.test(t)) return "quality";
  return "work";
}

function Icon({ kind }) {
  const props = { size: 15, color: "#fff" };
  if (kind === "warm") return <Waves {...props} />;
  if (kind === "tech") return <Target {...props} />;
  if (kind === "kick") return <Activity {...props} />;
  if (kind === "quality") return <Zap {...props} />;
  if (kind === "cool") return <Droplets {...props} />;
  return <Waves {...props} />;
}

function restFrom(text) {
  const m = String(text || "").match(/(?:repos|R)\s*(\d+)\s*s?/i);
  return m ? `repos ${m[1]}s` : null;
}

function titleFrom(text) {
  const t = stripPrefix(text);
  const before = t.split(/\s*[—–]\s*/)[0] || t;
  return before.replace(/\s*:\s*.*$/, "").trim();
}

function subtitleFrom(text, kind) {
  const chunks = stripPrefix(text).split(/\s*[—–]\s*/).map((s) => s.trim()).filter(Boolean);
  const cue = chunks.slice(1).find((c) => !/^(repos|R)\s*\d/i.test(c));
  if (cue) return cue.charAt(0).toUpperCase() + cue.slice(1);
  if (kind === "warm") return "Échauffement";
  if (kind === "cool") return "Retour au calme";
  if (kind === "tech") return "Technique";
  if (kind === "kick") return "Jambes";
  if (kind === "quality") return "Bloc principal";
  return "Nage appliquée";
}

function estimateZones(rows, totalMeters) {
  const zones = { Z1: 0, Z2: 0, Z3: 0, Z4: 0 };
  for (const row of rows) {
    const m = row.meters || 0;
    const t = `${row.title} ${row.subtitle}`.toLowerCase();
    if (row.kind === "warm" || row.kind === "cool" || /facile|souple|récup/.test(t)) zones.Z1 += m;
    else if (/vitesse|sprint|z4|vma/.test(t)) zones.Z4 += m;
    else if (/seuil|soutenu|z3|pyramide/.test(t)) zones.Z3 += m;
    else zones.Z2 += m;
  }
  const sum = zones.Z1 + zones.Z2 + zones.Z3 + zones.Z4 || totalMeters || 1;
  const pct = (v) => Math.round((v / sum) * 100);
  return [
    { label: "Z1", value: pct(zones.Z1), color: "#3ba7db" },
    { label: "Z2", value: pct(zones.Z2), color: "#31c48d" },
    { label: "Z3", value: pct(zones.Z3), color: "#8d9efc" },
    { label: "Z4", value: pct(zones.Z4), color: "#ffbe55" },
  ];
}

function formatDuration(mins) {
  const n = Number(mins) || 0;
  if (n < 60) return `${n} min`;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return m ? `${h}h ${String(m).padStart(2, "0")}` : `${h}h`;
}

function parseDistanceMeters(distance) {
  const n = parseInt(String(distance || "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

/**
 * @param {{
 *  session: object,
 *  isPremium?: boolean,
 *  onStart?: () => void,
 *  onUpgrade?: () => void,
 *  ctaLabel?: string,
 *  badge?: string,
 *  subtitle?: string,
 * }} props
 */
export default function SessionLiveView({
  session,
  isPremium = true,
  onStart,
  onUpgrade,
  ctaLabel,
  badge = "Séance du jour",
  subtitle = null,
  showCta = true,
}) {
  const coherentSession = useMemo(
    () =>
      finalizeCoachSession(session || { details: [] }, {
        pool: session?.pool === 50 ? 50 : 25,
      }),
    [session],
  );
  const details = Array.isArray(coherentSession?.details) ? coherentSession.details : [];
  // Contenu déjà passé par toCoachDetailLines côté App ; ici on filtre encore les headlines
  const cleanDetails = details.filter((d) => {
    const t = String(d || "").trim();
    return t && !/^→/.test(t) && !/^Aujourd/i.test(t);
  });
  const totalMeters = parseDistanceMeters(coherentSession?.distance);

  const rows = useMemo(() => {
    const out = [];
    for (const raw of cleanDetails) {
      const text = stripPrefix(raw);
      if (!text || text.startsWith("Aujourd") || text.startsWith("→")) continue;
      const pyramid = parsePyramidLine(raw);
      const kind = pyramid ? "quality" : guessKind(text);
      out.push({
        raw,
        kind,
        title: pyramid ? `${pyramid.volume}m pyramide ${pyramid.label}` : titleFrom(text),
        subtitle: pyramid ? "Bloc principal" : subtitleFrom(text, kind),
        meta: restFrom(text) || ((kind === "warm" || kind === "cool") && parseMeters(text) ? `${parseMeters(text)} m` : null),
        meters: pyramid?.volume || parseMeters(text),
        pyramid,
      });
    }
    return out;
  }, [cleanDetails]);

  const zones = useMemo(() => estimateZones(rows, totalMeters), [rows, totalMeters]);
  const locked = !isPremium;
  const startLabel = ctaLabel || (locked ? "Activer l’essai pour nager" : "Démarrer la séance");

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 800, color: G.ink, letterSpacing: 0, textTransform: "uppercase", lineHeight: 1 }}>
            Aujourd&apos;hui
          </div>
          <div style={{ fontSize: 12, color: G.inkSoft, marginTop: 4, fontWeight: 600 }}>
            {subtitle || session?.title || "Séance du jour"}
          </div>
        </div>
        <div
          style={{
            padding: "7px 10px",
            borderRadius: 999,
            background: G.surface,
            border: `1px solid ${G.line}`,
            fontSize: 10,
            fontWeight: 800,
            color: G.blue,
            whiteSpace: "nowrap",
          }}
        >
          {badge}
        </div>
      </div>

      <div
        style={{
          background: G.surface,
          borderRadius: 24,
          border: `1px solid ${G.line}`,
          overflow: "hidden",
          boxShadow: "0 10px 28px rgba(26,45,86,0.06)",
          padding: "14px 14px 12px",
          filter: locked ? "grayscale(0.35)" : "none",
          opacity: locked ? 0.92 : 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, color: G.inkSoft, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase" }}>
              {session?.type || "Séance"} · bassin
            </div>
            <div style={{ fontSize: 12, color: G.inkSoft, marginTop: 3, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <Timer size={12} color={G.greyMid} />
              {formatDuration(session?.duration)}
              {session?.intensity ? ` · ${String(session.intensity).split("—")[0].trim()}` : ""}
            </div>
          </div>
          <div
            style={{
              minWidth: 72,
              textAlign: "center",
              borderRadius: 16,
              background: G.blueTint,
              border: `1px solid ${G.line}`,
              padding: "8px 10px",
            }}
          >
            <div style={{ fontSize: 11, color: G.inkSoft, fontWeight: 700 }}>Volume</div>
            <div style={{ fontSize: 18, color: G.blue, fontWeight: 900, lineHeight: 1.1 }}>
              {totalMeters || "—"}
            </div>
            <div style={{ fontSize: 10, color: G.inkSoft, fontWeight: 700 }}>m</div>
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          {rows.map((row, idx) => (
            <div
              key={`${row.title}-${idx}`}
              style={{
                display: "grid",
                gridTemplateColumns: "34px 1fr auto",
                gap: 10,
                alignItems: "start",
                padding: "9px 0",
                borderTop: `1px solid ${G.line}`,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: "linear-gradient(180deg, #4d6eb6 0%, #355da3 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 12px rgba(53,93,163,0.16)",
                }}
              >
                <Icon kind={row.kind} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: G.ink, lineHeight: 1.25 }}>
                  {locked && idx > 1 ? "••••••" : row.title}
                </div>
                <div style={{ fontSize: 11, color: G.inkSoft, marginTop: 2, lineHeight: 1.35 }}>
                  {locked && idx > 1 ? "Contenu Premium" : row.subtitle}
                </div>
                {!locked && row.pyramid && (
                  <>
                    <PyramidBlockViz
                      steps={row.pyramid.steps}
                      peak={row.pyramid.peak}
                      volume={row.pyramid.volume}
                      rest={row.pyramid.rest}
                      label={row.pyramid.label}
                      accent={G.blue}
                    />
                  </>
                )}
              </div>
              {row.meta && (
                <div
                  style={{
                    fontSize: 10,
                    color: G.inkSoft,
                    fontWeight: 700,
                    background: G.blueSoft,
                    borderRadius: 999,
                    padding: "4px 7px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.meta}
                </div>
              )}
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 12,
            borderRadius: 18,
            background: "linear-gradient(135deg, #2c57a4 0%, #4178d9 100%)",
            color: "#fff",
            padding: "14px 14px 12px",
            boxShadow: "0 12px 24px rgba(53,93,163,0.22)",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 12, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 10, opacity: 0.78, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Charge séance
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1, marginTop: 4 }}>
                {totalMeters || rows.reduce((a, r) => a + (r.meters || 0), 0)} m
              </div>
              <div style={{ fontSize: 11, opacity: 0.82, marginTop: 4 }}>
                {formatDuration(session?.duration)} · répartition zones
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {zones.map((row) => (
                <div key={row.label} style={{ display: "grid", gridTemplateColumns: "24px 1fr 28px", gap: 6, alignItems: "center" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, opacity: 0.94 }}>{row.label}</div>
                  <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.18)", overflow: "hidden" }}>
                    <div style={{ width: `${row.value}%`, height: "100%", borderRadius: 999, background: row.color }} />
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 800, textAlign: "right", opacity: 0.9 }}>{row.value}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showCta && (
        <button
          type="button"
          onClick={() => {
            if (locked) onUpgrade?.();
            else onStart?.();
          }}
          style={{
            width: "100%",
            marginTop: 12,
            border: "none",
            borderRadius: 16,
            background: "linear-gradient(135deg, #2b59a8 0%, #3a79df 100%)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 900,
            padding: "14px 16px",
            boxShadow: "0 12px 26px rgba(53,93,163,0.24)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {locked ? <Lock size={15} color="#fff" /> : <Play size={15} color="#fff" fill="#fff" />}
          {startLabel}
        </button>
      )}
    </div>
  );
}
