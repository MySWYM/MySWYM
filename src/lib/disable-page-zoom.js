/**
 * Interdit le zoom page (pinch, double-tap, Ctrl+molette, raccourcis).
 * Complète le viewport + le WKWebView iOS.
 */
const VIEWPORT =
  "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, shrink-to-fit=no";

function lockViewportMeta() {
  let meta = document.querySelector('meta[name="viewport"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "viewport");
    document.head.appendChild(meta);
  }
  if (meta.getAttribute("content") !== VIEWPORT) {
    meta.setAttribute("content", VIEWPORT);
  }
}

export function installDisablePageZoom() {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  if (window.__myswymZoomLockInstalled) return;
  window.__myswymZoomLockInstalled = true;

  lockViewportMeta();

  const block = (e) => {
    e.preventDefault();
  };

  document.addEventListener("gesturestart", block, { capture: true, passive: false });
  document.addEventListener("gesturechange", block, { capture: true, passive: false });
  document.addEventListener("gestureend", block, { capture: true, passive: false });

  document.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches && e.touches.length > 1) e.preventDefault();
    },
    { capture: true, passive: false },
  );

  document.addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    },
    { capture: true, passive: false },
  );

  document.addEventListener(
    "keydown",
    (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key;
      if (k === "+" || k === "-" || k === "=" || k === "_" || k === "0") {
        e.preventDefault();
      }
    },
    { capture: true },
  );
}
