/**
 * Remonte en haut de page (SPA mobile), onglets / écrans / retour détail.
 * Prefer `documentElement` + `body` (iOS Safari) + conteneur `.myswym-app-main`
 * (bandeau essai : overflow interne).
 */
export function getAppScrollY() {
  if (typeof window === "undefined") return 0;
  const main = document.querySelector(".myswym-app-main");
  const mainY = main && typeof main.scrollTop === "number" ? main.scrollTop : 0;
  return window.scrollY
    || document.documentElement?.scrollTop
    || document.body?.scrollTop
    || mainY
    || 0;
}

function resetScrollNodes() {
  window.scrollTo(0, 0);
  const de = document.documentElement;
  const body = document.body;
  if (de) de.scrollTop = 0;
  if (body) body.scrollTop = 0;
  const main = document.querySelector(".myswym-app-main");
  if (main) main.scrollTop = 0;
}

export function scrollAppToTop() {
  if (typeof window === "undefined") return;
  try {
    resetScrollNodes();
    // iOS : 2e passe après paint (contenu remplacé / bandeau essai).
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => {
        try {
          resetScrollNodes();
        } catch { /* ignore */ }
      });
    }
  } catch {
    /* ignore */
  }
}
