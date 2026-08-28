/**
 * Carte exercice compacte (pas de tiroir / dépliable).
 * Allures Sheet : pastilles ⓘ + Enchaînement (multi-allures) ; Lent ≠ Souple.
 * Départ à la montre : pastille D2' + tip horloge de bassin (4 aiguilles).
 */
import { useState } from "react";
import { createPortal } from "react-dom";
import { Info, X } from "lucide-react";
import { formatDepartHuman, formatRestHuman } from "../lib/workout-display.js";

const ALLURE_TIPS = {
  souple: {
    title: "Souple",
    label: "Souple",
    tone: "mint",
    body:
      "Allure de récupération : lente et relâchée. Tu ne forces pas — tu te détends. À ne pas confondre avec « lent » (allure lente contrôlée, pas une récup).",
  },
  lent: {
    title: "Lent",
    label: "Lent",
    tone: "neutral",
    body:
      "Allure lente et contrôlée : tu nages volontairment moins vite pour la technique ou la qualité. Ce n’est pas du souple (récup).",
  },
  moyen: {
    title: "Moyen",
    label: "Moyen",
    tone: "neutral",
    body:
      "Allure régulière, tenable sur toute la série. Ni trop facile, ni à fond — tu gardes le même rythme.",
  },
  progressif: {
    title: "Progressif",
    label: "Progressif",
    tone: "blue",
    body:
      "Tu accélères au fil de la distance : départ facile, fin plus soutenue.",
  },
  vite: {
    title: "Vite",
    label: "Vite",
    tone: "coral",
    body:
      "Allure plus soutenue, qualité d’effort. Tu nages plus vite qu’en rythme moyen, sans forcer jusqu’à l’échec.",
  },
  abloc: {
    title: "À bloc",
    label: "À bloc",
    tone: "coral",
    body:
      "Sprint court : tu donnes le maximum sur la distance indiquée, puis tu récupères bien.",
  },
  sprint: {
    title: "Sprint",
    label: "Sprint",
    tone: "coral",
    body:
      "Effort court et explosif. Tu donnes le maximum sur la distance, puis tu récupères bien avant la suivante.",
  },
  enchainement: {
    title: "Enchaînement",
    label: "Enchaînement",
    tone: "blue",
    body:
      "Plusieurs allures dans la même série, dans l’ordre indiqué sous la ligne. Lent = nage lente contrôlée ; souple = récupération — ce n’est pas la même chose.",
  },
};

/** Ordre d’affichage des pastilles allure. */
const ALLURE_CHIP_ORDER = [
  "enchainement",
  "souple",
  "lent",
  "moyen",
  "progressif",
  "vite",
  "abloc",
  "sprint",
];

function detectAllureTips(exercise) {
  // Multi-allures dans une série → une seule pastille
  if (exercise?.allureEnchainement?.steps?.length >= 2) {
    return ["enchainement"];
  }

  const blob = `${exercise?.cue || ""} ${exercise?.main || ""} ${exercise?.raw || ""}`.toLowerCase();
  const found = new Set();

  const showSouplePill =
    exercise?.section !== "warm"
    && exercise?.kind !== "warm"
    && (exercise?.effortLabel === "souple" || exercise?.kind === "cool");
  if (showSouplePill || /\bsouple\b/.test(blob)) found.add("souple");

  // Lent ≠ souple
  if (/\blent\b/.test(blob)) found.add("lent");
  if (/\bmoyen\b/.test(blob) || /allure\s+r[eé]guli[eè]re/.test(blob)) found.add("moyen");
  if (/\bprogressif\b/.test(blob)) found.add("progressif");
  if (/\b(vite|rapide)\b/.test(blob)) found.add("vite");
  if (/\b(à\s*bloc|a\s*bloc)\b/.test(blob)) found.add("abloc");
  if (exercise?.sprint || /\bsprints?\b/.test(blob)) found.add("sprint");

  return ALLURE_CHIP_ORDER.filter((k) => found.has(k));
}

function MetaPill({ children, tone = "neutral", G }) {
  const bg = tone === "blue" ? G.blueLight : G.greyXLight;
  const color = tone === "blue" ? G.blue : G.inkLight;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      fontSize: 12, fontWeight: 700, padding: "5px 10px", borderRadius: 10,
      background: bg, color, whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

/** Horloge de bassin type 4 aiguilles (Colorado Timing). */
function PaceClock({ seconds = 120, size = 160 }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;
  const handR = r * 0.78;
  const colors = ["#e11d48", "#eab308", "#22c55e", "#3b82f6"];
  // 4 aiguilles aux quarts d’heure (0 / 15 / 30 / 45 s)
  const hands = [0, 15, 30, 45].map((sec, i) => {
    const deg = (sec / 60) * 360;
    const rad = ((deg - 90) * Math.PI) / 180;
    return {
      color: colors[i],
      x2: cx + handR * Math.cos(rad),
      y2: cy + handR * Math.sin(rad),
    };
  });
  const laps = Math.max(1, Math.round(seconds / 60));
  const remSec = seconds % 60;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={cx} cy={cy} r={r} fill="#0a162c" stroke="#1e3a5f" strokeWidth={3} />
        {Array.from({ length: 60 }, (_, i) => {
          const deg = (i / 60) * 360;
          const rad = ((deg - 90) * Math.PI) / 180;
          const major = i % 5 === 0;
          const inner = r - (major ? 10 : 5);
          const outer = r - 2;
          return (
            <line
              key={i}
              x1={cx + inner * Math.cos(rad)}
              y1={cy + inner * Math.sin(rad)}
              x2={cx + outer * Math.cos(rad)}
              y2={cy + outer * Math.sin(rad)}
              stroke={major ? "#e2e8f0" : "#64748b"}
              strokeWidth={major ? 2 : 1}
            />
          );
        })}
        {[0, 15, 30, 45].map((sec) => {
          const deg = (sec / 60) * 360;
          const rad = ((deg - 90) * Math.PI) / 180;
          const tx = cx + (r - 22) * Math.cos(rad);
          const ty = cy + (r - 22) * Math.sin(rad);
          const label = sec === 0 ? "60" : String(sec);
          return (
            <text
              key={`n${sec}`}
              x={tx}
              y={ty}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#94a3b8"
              fontSize={11}
              fontWeight={700}
            >
              {label}
            </text>
          );
        })}
        {hands.map((h, i) => (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={h.x2}
            y2={h.y2}
            stroke={h.color}
            strokeWidth={3}
            strokeLinecap="round"
          />
        ))}
        <circle cx={cx} cy={cy} r={5} fill="#f8fafc" />
      </svg>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textAlign: "center", lineHeight: 1.35 }}>
        {laps > 1
          ? `${laps} tours d’aiguille (= ${formatDepartHuman(seconds)})`
          : remSec
            ? `Un tour + ${remSec} s sur l’horloge`
            : "Un tour d’aiguille (= 1 minute)"}
      </div>
    </div>
  );
}

function TipSheetShell({ eyebrow, title, onClose, colors: G, children }) {
  return createPortal(
    <div
      className="sheet-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        className="sheet-panel scale-in"
        style={{
          background: G.surface,
          borderRadius: "24px 24px 0 0",
          padding: "20px 20px max(28px, env(safe-area-inset-bottom))",
          maxHeight: "85dvh",
          overflowY: "auto",
        }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 2, background: G.greyLight, margin: "0 auto 16px" }} />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: G.grey, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
              {eyebrow}
            </div>
            <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: G.ink, lineHeight: 1.15 }}>
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            style={{
              width: 44, height: 44, borderRadius: 12, border: `1px solid ${G.greyLight}`,
              background: G.greyXLight, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}
          >
            <X size={18} color={G.ink} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

function AllureTipSheet({ tipKey, onClose, colors: G, enchainement }) {
  const tip = ALLURE_TIPS[tipKey];
  if (!tip) return null;
  let body = tip.body;
  if (tipKey === "enchainement" && enchainement?.cue) {
    body = `Sur cette série, enchaîne dans l’ordre : ${enchainement.cue}. Lent = nage lente contrôlée ; souple = récupération — ce n’est pas la même chose.`;
  }
  return (
    <TipSheetShell eyebrow="Allure" title={tip.title} onClose={onClose} colors={G}>
      <p style={{ margin: 0, fontSize: 15, color: G.inkLight, lineHeight: 1.5, fontWeight: 600 }}>
        {body}
      </p>
    </TipSheetShell>
  );
}

function DepartTipSheet({ label, seconds, onClose, colors: G }) {
  const human = formatDepartHuman(seconds);
  return (
    <TipSheetShell eyebrow="Départ à la montre" title={label || "D…"} onClose={onClose} colors={G}>
      <p style={{ margin: "0 0 16px", fontSize: 15, color: G.inkLight, lineHeight: 1.5, fontWeight: 600 }}>
        Tu repars toutes les {human}. Regarde l’horloge de bassin : tu pars quand une aiguille est sur un repère, et tu repars quand elle revient au même endroit
        {seconds > 60 ? ` (après ${Math.round(seconds / 60)} tours)` : ""}.
      </p>
      <div style={{
        background: G.greyXLight,
        borderRadius: 16,
        padding: "16px 12px",
        marginBottom: 14,
      }}>
        <PaceClock seconds={seconds || 60} />
      </div>
      <p style={{ margin: 0, fontSize: 13, color: G.grey, lineHeight: 1.45, fontWeight: 600 }}>
        Plus tu nages vite, plus tu récupères avant le prochain départ. Les 4 aiguilles colorées servent aux différentes lignes du bassin.
      </p>
    </TipSheetShell>
  );
}

function RestTipSheet({ label, seconds, onClose, colors: G }) {
  const human = formatRestHuman(seconds);
  return (
    <TipSheetShell eyebrow="Récupération" title={label || "R…"} onClose={onClose} colors={G}>
      <p style={{ margin: "0 0 12px", fontSize: 15, color: G.inkLight, lineHeight: 1.5, fontWeight: 600 }}>
        Tu t’arrêtes {human} entre les reps (ou à la fin de la série). Le chrono de pause commence quand tu arrives au mur.
      </p>
      <p style={{ margin: 0, fontSize: 13, color: G.grey, lineHeight: 1.45, fontWeight: 600 }}>
        Ce n’est pas un départ à la montre (D…) : avec R, tu repartis après ta pause, pas à un intervalle fixe sur l’horloge.
      </p>
    </TipSheetShell>
  );
}

function chipToneStyles(tone, G) {
  let bg = G.greyXLight;
  let color = G.inkLight;
  if (tone === "mint") {
    bg = G.mintLight || G.greyXLight;
    color = G.mint || G.inkLight;
  } else if (tone === "blue") {
    bg = G.blueLight || G.greyXLight;
    color = G.blue || G.inkLight;
  } else if (tone === "coral") {
    bg = G.coralLight || G.blueLight || G.greyXLight;
    color = G.coral || G.blue || G.inkLight;
  }
  return { bg, color };
}

function AllureInfoChip({ tipKey, label, tone = "neutral", onClick, G, ariaName }) {
  const tip = tipKey ? ALLURE_TIPS[tipKey] : null;
  const resolvedLabel = label || tip?.label;
  if (!resolvedLabel) return null;
  const { bg, color } = chipToneStyles(tip?.tone || tone, G);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Qu’est-ce que ${ariaName || resolvedLabel.toLowerCase()} ?`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        border: `1px solid ${G.greyLight}`,
        background: bg,
        color,
        fontSize: 11,
        fontWeight: 800,
        padding: "4px 9px",
        borderRadius: 999,
        cursor: "pointer",
        letterSpacing: "0.02em",
        textTransform: tipKey ? "uppercase" : "none",
        minHeight: 28,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {resolvedLabel}
      <Info size={12} strokeWidth={2.5} />
    </button>
  );
}

export default function WorkoutExerciseCard({
  exercise,
  colors: G,
  accent,
  onOpenDrill,
  compact = false,
  nested = false,
}) {
  const [tipKey, setTipKey] = useState(null);
  const [departOpen, setDepartOpen] = useState(false);
  const [restOpen, setRestOpen] = useState(false);
  if (!exercise) return null;

  const volume = exercise.volumeLabel || (exercise.meters ? `${exercise.meters} m` : null);
  const stroke = exercise.strokeLabel;
  const drills =
    Array.isArray(exercise.educatifs) && exercise.educatifs.length
      ? exercise.educatifs
      : exercise.educatif
        ? [exercise.educatif]
        : [];
  const multiDrills = drills.length > 1;
  const primaryCue = multiDrills ? "4 éducatifs (1 / nage)" : exercise.cue;
  const allureChips = detectAllureTips(exercise);
  const departLabel = exercise.departLabel || null;
  const departSeconds = exercise.departSeconds || 60;
  const restChip = exercise.restChip || null;
  const restSeconds = exercise.restSeconds || 30;

  return (
    <div
      style={{
        background: nested ? "transparent" : G.surface,
        borderRadius: nested ? 12 : 16,
        border: nested ? "none" : `1px solid ${G.greyLight}`,
        overflow: "hidden",
        padding: compact ? "14px 14px" : "16px 16px",
        minHeight: 56,
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: 9, flexShrink: 0, marginTop: 2,
        background: accent?.bg || G.blueLight, color: accent?.color || G.blue,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 800,
      }}>
        {exercise.index}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: compact ? 17 : 18,
          fontWeight: 800,
          color: G.ink,
          lineHeight: 1.2,
          letterSpacing: "-0.01em",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 8,
        }}>
          <span>
            {volume || exercise.main}
            {stroke ? (
              <span style={{ color: accent?.color || G.blue, fontWeight: 800 }}>
                {" · "}{stroke}
              </span>
            ) : null}
          </span>
          {allureChips.map((key) => (
            <AllureInfoChip key={key} tipKey={key} onClick={() => setTipKey(key)} G={G} />
          ))}
          {restChip ? (
            <AllureInfoChip
              tipKey={null}
              label={restChip}
              tone="blue"
              ariaName={`récupération ${restChip}`}
              onClick={() => setRestOpen(true)}
              G={G}
            />
          ) : null}
          {departLabel ? (
            <AllureInfoChip
              tipKey={null}
              label={departLabel}
              tone="blue"
              ariaName={`départ ${departLabel}`}
              onClick={() => setDepartOpen(true)}
              G={G}
            />
          ) : null}
        </div>

        {primaryCue && volume && (
          <div style={{ fontSize: 13, color: G.inkLight, marginTop: 4, lineHeight: 1.35, fontWeight: 600 }}>
            {primaryCue.charAt(0).toUpperCase() + primaryCue.slice(1)}
          </div>
        )}
        {!volume && exercise.main && primaryCue && (
          <div style={{ fontSize: 13, color: G.inkLight, marginTop: 4, lineHeight: 1.35 }}>
            {primaryCue.charAt(0).toUpperCase() + primaryCue.slice(1)}
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {exercise.restLabel && !restChip && <MetaPill G={G} tone="blue">{exercise.restLabel}</MetaPill>}
          {exercise.kind === "warm" && <MetaPill G={G}>Facile</MetaPill>}
          {drills.length > 0 && (
            <button
              type="button"
              onClick={() => onOpenDrill?.(multiDrills ? drills : drills[0])}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                border: "none", background: G.blueLight, color: G.blue,
                fontSize: 12, fontWeight: 700, padding: "5px 10px", borderRadius: 10,
                cursor: "pointer", minHeight: 32,
              }}
            >
              <Info size={12} />{" "}
              {multiDrills ? "Voir les éducatifs" : "Voir l’éducatif"}
            </button>
          )}
        </div>
      </div>

      {tipKey ? (
        <AllureTipSheet
          tipKey={tipKey}
          onClose={() => setTipKey(null)}
          colors={G}
          enchainement={exercise.allureEnchainement}
        />
      ) : null}
      {restOpen && restChip ? (
        <RestTipSheet
          label={restChip}
          seconds={restSeconds}
          onClose={() => setRestOpen(false)}
          colors={G}
        />
      ) : null}
      {departOpen ? (
        <DepartTipSheet
          label={departLabel}
          seconds={departSeconds}
          onClose={() => setDepartOpen(false)}
          colors={G}
        />
      ) : null}
    </div>
  );
}
