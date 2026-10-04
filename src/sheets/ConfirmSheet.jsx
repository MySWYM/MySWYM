import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { G } from "../theme/palette.js";
import SheetCardShell from "./SheetCardShell.jsx";

export default function ConfirmSheet({
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = true,
  icon: Icon = Trash2,
  onConfirm,
  onCancel,
  zIndex = null,
}) {
  const { t } = useTranslation("app");
  const resolvedConfirm = confirmLabel ?? (destructive ? t("sheet.delete") : t("sheet.confirm"));
  const resolvedCancel = cancelLabel === undefined ? t("sheet.cancel") : cancelLabel;

  return (
    <SheetCardShell
      onClose={onCancel}
      swipeEntirePanel
      overlayProps={{
        role: "dialog",
        "aria-modal": true,
        "aria-labelledby": "confirm-sheet-title",
        onClick: (e) => e.target === e.currentTarget && onCancel(),
        ...(zIndex != null ? { style: { zIndex } } : {}),
      }}
    >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: destructive ? G.coralLight : G.blueLight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <Icon size={22} color={destructive ? G.coral : G.blue} />
        </div>
        <h3
          id="confirm-sheet-title"
          style={{
            fontFamily: "Geist, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: G.ink,
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          {title}
        </h3>
        <p style={{ color: G.grey, fontSize: 14, textAlign: "center", lineHeight: 1.55, marginBottom: 24 }}>
          {message}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 12,
              border: "none",
              background: destructive ? G.coral : G.blue,
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              minHeight: 48,
            }}
          >
            {resolvedConfirm}
          </button>
          {resolvedCancel ? (
            <button
              type="button"
              onClick={onCancel}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 12,
                border: `1px solid ${G.greyLight}`,
                background: G.surface,
                color: G.ink,
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                minHeight: 48,
              }}
            >
              {resolvedCancel}
            </button>
          ) : null}
        </div>
    </SheetCardShell>
  );
}
