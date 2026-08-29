/**
 * Bottom sheet éducatif, contenu MySWYM uniquement.
 * 1 fiche, ou liste (4 nages = 1 / nage) sans encombrer la carte.
 */
import { createPortal } from "react-dom";
import { X, Play } from "lucide-react";

const STROKE_LABELS = ["Papillon", "Dos", "Brasse", "Crawl"];

function SingleDrillBody({ educatif, G }) {
  const hasVideo = !!(educatif.videoUrl && String(educatif.videoUrl).trim());
  const hasThumb = !!(educatif.thumbUrl && String(educatif.thumbUrl).trim());

  return (
    <>
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

      {educatif.equipment ? (
        <div style={{ fontSize: 12, color: G.inkLight, lineHeight: 1.4, marginBottom: 14 }}>
          <span style={{ fontWeight: 800, color: G.grey, letterSpacing: "0.04em", textTransform: "uppercase" }}>Matériel optionnel · </span>
          {educatif.equipment}
        </div>
      ) : null}

      {educatif.objective ? (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: G.grey, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
            Objectif
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: G.ink, lineHeight: 1.4 }}>{educatif.objective}</div>
        </div>
      ) : null}

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
    </>
  );
}

function MultiDrillBody({ educatifs, G }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {educatifs.map((edu, i) => {
        const stroke = STROKE_LABELS[i] || null;
        return (
          <div
            key={edu.id || edu.name || i}
            style={{
              background: G.greyXLight,
              borderRadius: 14,
              padding: "14px 16px",
            }}
          >
            {stroke ? (
              <div style={{
                fontSize: 11, fontWeight: 800, color: G.blue,
                letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4,
              }}>
                {stroke}
              </div>
            ) : null}
            <div style={{ fontSize: 17, fontWeight: 800, color: G.ink, lineHeight: 1.2, marginBottom: 8 }}>
              {edu.name}
            </div>
            {edu.cue ? (
              <div style={{ fontSize: 14, fontWeight: 600, color: G.inkLight, lineHeight: 1.4 }}>
                {edu.cue}
              </div>
            ) : edu.objective ? (
              <div style={{ fontSize: 14, fontWeight: 600, color: G.inkLight, lineHeight: 1.4 }}>
                {edu.objective}
              </div>
            ) : null}
            {edu.equipment ? (
              <div style={{ fontSize: 12, color: G.grey, marginTop: 8, lineHeight: 1.35 }}>
                Matériel optionnel · {edu.equipment}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default function DrillInfoSheet({ educatif, educatifs, onClose, colors: G }) {
  const list =
    Array.isArray(educatifs) && educatifs.length
      ? educatifs
      : Array.isArray(educatif)
        ? educatif
        : educatif
          ? [educatif]
          : [];
  if (!list.length) return null;

  const multi = list.length > 1;
  const title = multi ? "4 éducatifs" : list[0].name;
  const eyebrow = multi ? "1 par nage · pap → crawl" : "Éducatif";

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

        {multi ? (
          <MultiDrillBody educatifs={list} G={G} />
        ) : (
          <SingleDrillBody educatif={list[0]} G={G} />
        )}
      </div>
    </div>,
    document.body,
  );
}
