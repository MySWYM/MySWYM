import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const DISMISS_PX = 110;
const DISMISS_VELOCITY = 0.65; // px/ms

/**
 * Bottom sheet soft mist partagé (tips séance, éducatifs, popups app).
 * `fullscreenMobile` : quasi plein écran sous 640px (prep séance).
 * Swipe down sur le header (handle) pour fermer quand `onClose` est fourni.
 */
export default function SoftMistSheet({
  open = true,
  title,
  eyebrow = null,
  subtitle = null,
  onClose,
  children,
  ariaLabel = null,
  className = "",
  bodyClassName = "",
  lockScroll = true,
  zIndex = null,
  dismissOnOverlay = true,
  swipeToDismiss = true,
  fullscreenMobile = false,
  footer = null,
}) {
  /** Ignore le click/mouseup qui a ouvert le sheet (évite fermeture immédiate). */
  const ignoreDismissUntil = useRef(0);
  const dragRef = useRef({
    active: false,
    startY: 0,
    startT: 0,
    dy: 0,
    pointerId: null,
  });
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);

  const canSwipe = Boolean(swipeToDismiss && onClose);

  useEffect(() => {
    if (!open) return undefined;
    ignoreDismissUntil.current = Date.now() + 350;
    setDragY(0);
    setDragging(false);
    dragRef.current.active = false;
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open || !lockScroll) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open, lockScroll]);

  useEffect(() => {
    if (!open || !onClose) return undefined;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      onClose();
    };
    // capture : le sheet du dessus mange Escape avant le parent (prep / historique).
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  if (!open) return null;

  const overlayClass = [
    "sheet-overlay",
    "ms-soft-overlay",
    fullscreenMobile ? "ms-soft-overlay--fullscreen" : "",
    zIndex != null ? "ms-soft-overlay--stacked" : "",
    className,
  ].filter(Boolean).join(" ");

  const panelClass = [
    "sheet-panel",
    "scale-in",
    "ms-soft-sheet",
    fullscreenMobile ? "ms-soft-sheet--fullscreen" : "",
    dragging ? "is-dragging" : "",
  ].filter(Boolean).join(" ");

  const tryDismiss = (e) => {
    if (!dismissOnOverlay || !onClose) return;
    if (e.target !== e.currentTarget) return;
    if (Date.now() < ignoreDismissUntil.current) return;
    onClose();
  };

  const endDrag = (clientY) => {
    const d = dragRef.current;
    if (!d.active) return;
    const dy = Math.max(0, (clientY ?? d.startY + d.dy) - d.startY);
    const elapsed = Math.max(1, Date.now() - d.startT);
    const velocity = dy / elapsed;
    d.active = false;
    d.pointerId = null;
    setDragging(false);
    if (dy >= DISMISS_PX || (dy > 48 && velocity >= DISMISS_VELOCITY)) {
      setDragY(0);
      onClose?.();
      return;
    }
    setDragY(0);
  };

  const onHeadPointerDown = (e) => {
    if (!canSwipe) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (e.target instanceof Element && e.target.closest("button, a, input, textarea, select")) return;
    dragRef.current = {
      active: true,
      startY: e.clientY,
      startT: Date.now(),
      dy: 0,
      pointerId: e.pointerId,
    };
    setDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onHeadPointerMove = (e) => {
    const d = dragRef.current;
    if (!d.active || d.pointerId !== e.pointerId) return;
    const dy = Math.max(0, e.clientY - d.startY);
    d.dy = dy;
    setDragY(dy);
  };

  const onHeadPointerUp = (e) => {
    const d = dragRef.current;
    if (!d.active || (d.pointerId != null && d.pointerId !== e.pointerId)) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    endDrag(e.clientY);
  };

  const overlayOpacity = dragging
    ? Math.max(0.25, 1 - dragY / 280)
    : 1;

  return createPortal(
    <div
      className={overlayClass}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || title || "Dialogue"}
      style={{
        ...(zIndex != null ? { zIndex } : {}),
        ...(dragging ? { opacity: overlayOpacity, transition: "none" } : {}),
      }}
      onMouseDown={tryDismiss}
      onClick={tryDismiss}
    >
      <div
        className={panelClass}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: dragging ? "none" : "transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)",
          animation: dragging ? "none" : undefined,
          willChange: dragging || dragY > 0 ? "transform" : undefined,
        }}
      >
        <div
          className="ms-soft-sheet-head"
          onPointerDown={onHeadPointerDown}
          onPointerMove={onHeadPointerMove}
          onPointerUp={onHeadPointerUp}
          onPointerCancel={onHeadPointerUp}
          style={canSwipe ? {
            touchAction: "none",
            cursor: dragging ? "grabbing" : "grab",
            userSelect: "none",
            WebkitUserSelect: "none",
          } : undefined}
        >
          <div className="ms-sheet-handle" aria-hidden />
          <div className="ms-soft-sheet-head-row">
            <div style={{ minWidth: 0, flex: 1 }}>
              {eyebrow ? <div className="ms-soft-sheet-eyebrow">{eyebrow}</div> : null}
              {title ? <h3 className="ms-soft-sheet-title">{title}</h3> : null}
              {subtitle ? <p className="ms-soft-sheet-subtitle">{subtitle}</p> : null}
            </div>
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="ms-soft-sheet-close"
              >
                <X size={18} color="currentColor" />
              </button>
            ) : null}
          </div>
        </div>
        <div className={`ms-soft-sheet-body ${bodyClassName}`.trim()}>
          {children}
        </div>
        {footer ? <div className="ms-soft-sheet-footer">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
