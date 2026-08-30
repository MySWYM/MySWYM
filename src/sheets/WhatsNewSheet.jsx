import { Sparkles } from "lucide-react";
import { FONT, FONT_DISPLAY } from "../theme/brand.js";
import { G } from "../theme/palette.js";

/** Bump la clé pour une future campagne « nouveautés ». */
export const WHATS_NEW_STORAGE_KEY = "myswym_whats_new_v2026_08_30";

export function hasSeenWhatsNew() {
  try {
    return localStorage.getItem(WHATS_NEW_STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

export function markWhatsNewSeen() {
  try {
    localStorage.setItem(WHATS_NEW_STORAGE_KEY, "1");
  } catch { /* ignore */ }
}

/** Keep themes in sync with api/_lib/emails/reactivation.tsx (campagne session-gen). */
const BULLETS = [
  {
    title: "Catalogue coach enrichi",
    body: "Éducatifs, allures et +1000 séances : triathlon, eau libre et Nager, adaptés à ton niveau.",
  },
  {
    title: "Semaine jusqu’à ton objectif",
    body: "Sur l’accueil : planning S-n jusqu’au jour J, semaines allégées et de test calées sur ta date.",
  },
  {
    title: "Tes validées restent",
    body: "En continuant, le reste de la semaine se met à jour. Les séances déjà validées sont gardées.",
  },
];

/**
 * Pop one-shot « Nouveautés ».
 * Continuer peut rafraîchir la semaine boucle (séances non validées → Sheet).
 */
export default function WhatsNewSheet({ onContinue, loading = false }) {
  return (
    <div
      className="sheet-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="whats-new-title"
      onClick={(e) => {
        if (loading) return;
        if (e.target === e.currentTarget) onContinue?.();
      }}
    >
      <div className="sheet-panel ms-sheet-card scale-in">
        <div className="ms-sheet-handle" />
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: G.blueLight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <Sparkles size={22} color={G.blue} aria-hidden />
        </div>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: G.grey,
            textAlign: "center",
            margin: "0 0 6px",
          }}
        >
          Mise à jour
        </p>
        <h3
          id="whats-new-title"
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: G.ink,
            textAlign: "center",
            margin: "0 0 8px",
          }}
        >
          Tes séances ont changé
        </h3>
        <p
          style={{
            color: G.grey,
            fontSize: 14,
            textAlign: "center",
            lineHeight: 1.55,
            margin: "0 0 18px",
          }}
        >
          On a repris le générateur de séances. En continuant, ta semaine se met à jour
          avec le nouveau catalogue.
        </p>
        <ul
          style={{
            listStyle: "none",
            margin: "0 0 22px",
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {BULLETS.map((b) => (
            <li
              key={b.title}
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                background: G.greyXLight,
                border: `1px solid ${G.greyLight}`,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: G.ink,
                  marginBottom: 4,
                  fontFamily: FONT,
                }}
              >
                {b.title}
              </div>
              <div style={{ fontSize: 13, color: G.grey, lineHeight: 1.45 }}>{b.body}</div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => onContinue?.()}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: 12,
            border: "none",
            background: G.blue,
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            cursor: loading ? "wait" : "pointer",
            minHeight: 48,
            fontFamily: FONT,
            opacity: loading ? 0.75 : 1,
          }}
        >
          {loading ? "Mise à jour…" : "Continuer"}
        </button>
      </div>
    </div>
  );
}
