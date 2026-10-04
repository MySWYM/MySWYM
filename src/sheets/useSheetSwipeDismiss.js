import { useCallback, useRef, useState } from "react";

const DISMISS_PX = 110;
const DISMISS_VELOCITY = 0.65; // px/ms

/**
 * Swipe down sur le header / handle pour fermer un bottom sheet.
 * À brancher sur la zone head (pas le body scrollable).
 */
export function useSheetSwipeDismiss(onClose, { enabled = true } = {}) {
  const canSwipe = Boolean(enabled && onClose);
  const dragRef = useRef({
    active: false,
    startY: 0,
    startT: 0,
    dy: 0,
    pointerId: null,
  });
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);

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
    // iOS / WebView : empêche le scroll parent de manger le geste.
    if (dy > 2) {
      try { e.preventDefault(); } catch { /* ignore */ }
    }
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

  const resetDrag = useCallback(() => {
    dragRef.current.active = false;
    dragRef.current.pointerId = null;
    setDragY(0);
    setDragging(false);
  }, []);

  const headProps = canSwipe
    ? {
        onPointerDown: onHeadPointerDown,
        onPointerMove: onHeadPointerMove,
        onPointerUp: onHeadPointerUp,
        onPointerCancel: onHeadPointerUp,
        style: {
          touchAction: "none",
          cursor: dragging ? "grabbing" : "grab",
          userSelect: "none",
          WebkitUserSelect: "none",
        },
      }
    : {};

  const panelStyle = {
    transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
    transition: dragging ? "none" : "transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)",
    animation: dragging ? "none" : undefined,
    willChange: dragging || dragY > 0 ? "transform" : undefined,
  };

  const overlayOpacity = dragging ? Math.max(0.25, 1 - dragY / 280) : 1;
  const overlayStyle = dragging
    ? { opacity: overlayOpacity, transition: "none" }
    : {};

  return {
    canSwipe,
    dragging,
    dragY,
    headProps,
    panelStyle,
    overlayStyle,
    panelClassExtra: dragging ? "is-dragging" : "",
    resetDrag,
  };
}
