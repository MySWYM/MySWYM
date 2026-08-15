/**
 * Bottom sheet éducatif — contenu MySWYM uniquement.
 * Pas d’espace vide si aucune vidéo.
 */
import { createPortal } from "react-dom";
import { X, Play } from "lucide-react";

export default function DrillInfoSheet({ educatif, onClose, colors: G }) {
  if (!educatif) return null;

  const hasVideo = !!(educatif.videoUrl && String(educatif.videoUrl).trim());
  const hasThumb = !!(educatif.thumbUrl && String(educatif.thumbUrl).trim());

  return createPortal(
    <div
      className="sheet-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={educatif.name}
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
              Éducatif
            </div>
            <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: G.ink, lineHeight: 1.15 }}>
              {educatif.name}
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

        {hasVideo && (
          <a
            href={educatif.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: 12, marginBottom: 16,
              padding: 12, borderRadius: 14, background: G.blueLight, textDecoration: "none",
              minHeight: 56,
            }}
          >
            {hasThumb ? (
              <img src={educatif.thumbUrl} alt="" style={{ width: 64, height: 44, borderRadius: 10, objectFit: "cover" }} />
            ) : (
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: G.blue,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Play size={18} color="#fff" fill="#fff" />
              </div>
            )}
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: G.blueDeep }}>Voir la vidéo</div>
              <div style={{ fontSize: 12, color: G.blue, marginTop: 2 }}>Arthur Natation · MySWYM</div>
            </div>
          </a>
        )}

        <p style={{ margin: "0 0 14px", fontSize: 15, color: G.inkLight, lineHeight: 1.5 }}>
          {educatif.shortDescription}
        </p>

        {(educatif.level || educatif.equipment) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {educatif.level ? (
              <div style={{ fontSize: 12, color: G.inkLight, lineHeight: 1.4 }}>
                <span style={{ fontWeight: 800, color: G.grey, letterSpacing: "0.04em", textTransform: "uppercase" }}>Niveau · </span>
                {educatif.level}
              </div>
            ) : null}
            {educatif.equipment ? (
              <div style={{ fontSize: 12, color: G.inkLight, lineHeight: 1.4 }}>
                <span style={{ fontWeight: 800, color: G.grey, letterSpacing: "0.04em", textTransform: "uppercase" }}>Matériel · </span>
                {educatif.equipment}
              </div>
            ) : null}
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: G.grey, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
            Objectif
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: G.ink, lineHeight: 1.4 }}>{educatif.objective}</div>
        </div>

        <div style={{
          background: G.greyXLight, borderRadius: 14, padding: "14px 16px", marginBottom: 14,
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: G.grey, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
            Consigne
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: G.ink, lineHeight: 1.4 }}>{educatif.cue}</div>
        </div>

        {Array.isArray(educatif.mistakes) && educatif.mistakes.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: G.grey, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
              À éviter
            </div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {educatif.mistakes.map((m) => (
                <li key={m} style={{ fontSize: 13, color: G.inkLight, lineHeight: 1.45, marginBottom: 4 }}>{m}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
