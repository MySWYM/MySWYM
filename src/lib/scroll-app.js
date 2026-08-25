/**
 * Remonte en haut de page (SPA mobile) — onglets / écrans / retour détail.
 * Prefer `documentElement` + `body` (iOS Safari).
 */
export function scrollAppToTop() {
  if (typeof window === "undefined") return;
  try {
    window.scrollTo(0, 0);
    const de = document.documentElement;
    const body = document.body;
    if (de) de.scrollTop = 0;
    if (body) body.scrollTop = 0;
  } catch {
    /* ignore */
  }
}
