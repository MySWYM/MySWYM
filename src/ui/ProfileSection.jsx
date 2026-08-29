import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FONT_DISPLAY } from "../theme/brand.js";
import { G } from "../theme/palette.js";

/**
 * Section collapsible pour Profil — une intention, un titre, touch ≥ 44px.
 */
export default function ProfileSection({
  id,
  title,
  summary,
  defaultOpen = false,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      style={{
        background: G.surface,
        borderRadius: 20,
        border: `1px solid ${G.greyLight}`,
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        marginBottom: 16,
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        id={id ? `${id}-trigger` : undefined}
        aria-expanded={open}
        aria-controls={id ? `${id}-panel` : undefined}
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "16px 16px",
          minHeight: 52,
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, fontFamily: FONT_DISPLAY, color: G.ink }}>
            {title}
          </div>
            {!open && summary && (
            <div style={{ fontSize: 13, color: G.grey, marginTop: 4, lineHeight: 1.35 }}>
              {summary}
            </div>
          )}
        </div>
        <ChevronDown
          size={18}
          color={G.grey}
          style={{
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.18s ease",
          }}
        />
      </button>
      {open && (
        <div
          id={id ? `${id}-panel` : undefined}
          role="region"
          aria-labelledby={id ? `${id}-trigger` : undefined}
          style={{ padding: "0 16px 18px" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
