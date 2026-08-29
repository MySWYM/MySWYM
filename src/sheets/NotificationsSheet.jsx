import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Bell, ChevronRight, X } from "lucide-react";
import { G } from "../theme/palette.js";
import { FONT_DISPLAY } from "../theme/brand.js";
import {
  NOTIFICATION_KIND_META,
  formatNotificationDate,
} from "../lib/in-app-notifications.js";

/** Action produit associée au type de notif. */
export function notificationActionFor(item) {
  switch (item?.type) {
    case "billing":
    case "security":
    case "promo":
      return "upgrade";
    case "badge":
      return "profile";
    case "buddy":
      return "buddies";
    default:
      return null;
  }
}

/**
 * Centre de notifications — bottom sheet (remplace le dropdown desktop).
 */
export default function NotificationsSheet({
  open,
  items = [],
  onClose,
  onAction,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="sheet-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Notifications"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
      style={{ zIndex: 450 }}
    >
      <div
        className="sheet-panel scale-in"
        style={{
          background: G.surface,
          borderRadius: "24px 24px 0 0",
          maxHeight: "min(88dvh, 720px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: `1px solid ${G.greyLight}`,
          borderBottom: "none",
          boxShadow: "0 -12px 40px rgba(0, 0, 0, 0.35)",
        }}
      >
        <div
          style={{
            flexShrink: 0,
            padding: "12px 16px 14px",
            borderBottom: `1px solid ${G.greyLight}`,
          }}
        >
          <div className="ms-sheet-handle" style={{ marginBottom: 12 }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: FONT_DISPLAY, color: G.ink, letterSpacing: "-0.03em" }}>
                Notifications
              </div>
              <div style={{ fontSize: 13, color: G.grey, marginTop: 2 }}>
                {items.length
                  ? `${items.length} notification${items.length > 1 ? "s" : ""}`
                  : "Aucune notification pour l’instant"}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer les notifications"
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                border: `1px solid ${G.greyLight}`,
                background: G.greyXLight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <X size={18} color={G.ink} />
            </button>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            padding: "14px 16px max(24px, env(safe-area-inset-bottom))",
          }}
        >
          {items.length ? (
            <div style={{ display: "grid", gap: 10 }}>
              {items.map((item) => {
                const kindMeta = NOTIFICATION_KIND_META[item.type] || NOTIFICATION_KIND_META.update;
                const Icon = item.accentIcon || kindMeta.Icon;
                const bg = item.type === "badge" ? `${item.accentColor}22` : kindMeta.bg;
                const color = item.accentColor || kindMeta.color;
                const action = notificationActionFor(item);
                const interactive = Boolean(action && onAction);
                const Wrapper = interactive ? "button" : "div";
                return (
                  <Wrapper
                    key={item.id}
                    type={interactive ? "button" : undefined}
                    onClick={interactive ? () => onAction(item, action) : undefined}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      width: "100%",
                      background: G.greyXLight,
                      borderRadius: 16,
                      padding: "14px 14px",
                      border: `1px solid ${G.greyLight}`,
                      cursor: interactive ? "pointer" : "default",
                      textAlign: "left",
                      color: "inherit",
                      font: "inherit",
                      minHeight: 64,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: bg,
                        color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: G.ink, marginBottom: 4, lineHeight: 1.3 }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: 13, color: G.grey, lineHeight: 1.45 }}>{item.body}</div>
                      <div
                        style={{
                          fontSize: 12,
                          color: G.greyMid,
                          marginTop: 8,
                          letterSpacing: "0.04em",
                        }}
                      >
                        {formatNotificationDate(item.createdAt)}
                      </div>
                    </div>
                    {interactive && (
                      <ChevronRight size={18} color={G.greyMid} style={{ flexShrink: 0, marginTop: 10 }} />
                    )}
                  </Wrapper>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                background: G.greyXLight,
                borderRadius: 16,
                padding: "20px 16px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: G.blueLight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                }}
              >
                <Bell size={22} color={G.blue} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: G.ink, marginBottom: 6 }}>
                Rien pour le moment
              </div>
              <div style={{ fontSize: 13, color: G.grey, lineHeight: 1.45 }}>
                Ici tu verras les badges, alertes d’abonnement, binômes et mises à jour.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
