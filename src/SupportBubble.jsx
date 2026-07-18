import { useState } from "react";
import { MessageCircle, X } from "lucide-react";

const IG_DM = "https://ig.me/m/arthurnatation";
const FONT = "'Lexend', sans-serif";

/**
 * Bulle support — coaching perso / question sur une séance.
 * Visible sur l'app (au-dessus de la bottom nav).
 */
export default function SupportBubble({ aboveBottomNav = false }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Support / coaching"
        onClick={() => setOpen(true)}
        className={aboveBottomNav ? "support-fab" : "support-fab support-fab--bare"}
        style={{
          width: 54,
          height: 54,
          borderRadius: "50%",
          border: "none",
          background: "#355da3",
          color: "#fff",
          boxShadow: "0 8px 28px rgba(53,93,163,0.35)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MessageCircle size={24} color="#fff" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="sheet-overlay"
          style={{
            zIndex: 250,
            padding: 16,
            paddingBottom: aboveBottomNav
              ? "calc(var(--bottom-nav-h, 72px) + var(--safe-bottom, env(safe-area-inset-bottom, 0px)) + 16px)"
              : "calc(16px + var(--safe-bottom, env(safe-area-inset-bottom, 0px)))",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
          onClick={() => setOpen(false)}
        >
          <div
            className="sheet-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 24,
              padding: "22px 20px 20px",
              boxShadow: "0 20px 60px rgba(53,93,163,0.22)",
              fontFamily: FONT,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#737782", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                  Support
                </div>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#191c1e", lineHeight: 1.2 }}>
                  Une question ?
                </h3>
              </div>
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setOpen(false)}
                style={{ background: "#f2f3f6", border: "none", borderRadius: 10, width: 44, height: 44, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={18} color="#434751" />
              </button>
            </div>

            <p style={{ fontSize: 15, color: "#434751", lineHeight: 1.55, margin: "0 0 18px" }}>
              Coaching perso en DM — ou tu as un souci sur une séance ? Explique-moi tout, je te réponds.
            </p>

            <a
              href={IG_DM}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                width: "100%",
                padding: "14px 16px",
                minHeight: 48,
                borderRadius: 14,
                background: "#355da3",
                color: "#fff",
                fontWeight: 700,
                fontSize: 15,
                textDecoration: "none",
              }}
            >
              <MessageCircle size={18} color="#fff" />
              Écrire sur Instagram
            </a>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                width: "100%",
                marginTop: 10,
                padding: "12px",
                minHeight: 44,
                background: "none",
                border: "none",
                color: "#737782",
                fontSize: 14,
                cursor: "pointer",
                fontFamily: FONT,
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}
