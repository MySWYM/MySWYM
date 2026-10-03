import { useTranslation } from "react-i18next";
import { G } from "../theme/palette.js";
import SheetCardShell from "./SheetCardShell.jsx";

export default function CancelSurveySheet({ onChoose, onSkip }) {
  const { t } = useTranslation("app");
  const reasons = [
    { id: "price", label: t("cancel.price") },
    { id: "pause", label: t("cancel.pause") },
    { id: "hard", label: t("cancel.hard") },
    { id: "other", label: t("cancel.other") },
  ];
  return (
    <SheetCardShell
      onClose={onSkip}
      overlayProps={{
        onClick: (e) => e.target === e.currentTarget && onSkip(),
      }}
    >
        <h3
          style={{
            fontFamily: "Geist, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: 28,
            fontWeight: 700,
            textTransform: "none",
            letterSpacing: "-0.02em",
            color: G.ink,
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          {t("cancel.title")}
        </h3>
        <p style={{ color: G.grey, fontSize: 14, textAlign: "center", marginBottom: 20, lineHeight: 1.55 }}>
          {t("cancel.lead")}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {reasons.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onChoose(r.id)}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 12,
                border: `1.5px solid ${G.greyLight}`,
                background: G.surface,
                color: G.ink,
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                textAlign: "left",
                minHeight: 48,
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onSkip}
          style={{
            width: "100%",
            padding: 12,
            border: "none",
            background: "none",
            color: G.grey,
            fontSize: 13,
            cursor: "pointer",
            minHeight: 44,
          }}
        >
          {t("cancel.stripe")}
        </button>
    </SheetCardShell>
  );
}
