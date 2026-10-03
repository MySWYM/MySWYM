/**
 * Empêche enregistrement / copie des médias (appui long iOS, drag, menu contextuel).
 */

function isMediaTarget(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      "img, picture, svg, video, canvas, source, [data-protect-media], .ms-app-immersive-bg",
    ),
  );
}

export function installProtectMediaAssets() {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  if (window.__myswymMediaProtectInstalled) return;
  window.__myswymMediaProtectInstalled = true;

  const block = (e) => {
    const native = document.documentElement.classList.contains("myswym-ios")
      || document.documentElement.classList.contains("myswym-native");
    if (native || isMediaTarget(e.target)) {
      e.preventDefault();
    }
  };

  document.addEventListener("contextmenu", block, { capture: true });
  document.addEventListener(
    "dragstart",
    (e) => {
      if (isMediaTarget(e.target)) e.preventDefault();
    },
    { capture: true },
  );

  // iOS : certains menus partent d’un touch long même sans contextmenu.
  document.addEventListener(
    "touchstart",
    (e) => {
      if (!isMediaTarget(e.target)) return;
      const el = e.target instanceof Element ? e.target.closest("img, video, canvas, svg") : null;
      if (el instanceof HTMLElement) {
        el.style.webkitTouchCallout = "none";
        el.setAttribute("draggable", "false");
      }
    },
    { capture: true, passive: true },
  );
}
