/**
 * Vite 8 / Lightning CSS : dans les règles en `!important`, la minification garde
 * `-webkit-backdrop-filter` et SUPPRIME `backdrop-filter`. iOS (WebKit) ne voit rien,
 * mais Chrome / Android / Firefox perdent tout le flou « glass » (dock, sheets, cartes).
 * Ce plugin remet la propriété standard à côté de chaque version préfixée.
 */

const PREFIXED = /-webkit-backdrop-filter:([^;}]+)/g;

/** Ajoute `backdrop-filter:X` après chaque `-webkit-backdrop-filter:X` (doublon inoffensif). */
export function restoreBackdropFilter(css) {
  return String(css).replace(PREFIXED, (match, value, offset, whole) => {
    const after = whole.slice(offset + match.length, offset + match.length + 40);
    // Déjà suivi de la version standard : on ne touche pas.
    if (/^;\s*backdrop-filter:/.test(after)) return match;
    return `${match};backdrop-filter:${value}`;
  });
}

export function backdropFilterFixPlugin() {
  return {
    name: "myswym-backdrop-filter-fix",
    apply: "build",
    enforce: "post",
    generateBundle(_options, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type === "asset" && file.fileName.endsWith(".css")) {
          file.source = restoreBackdropFilter(
            typeof file.source === "string" ? file.source : new TextDecoder().decode(file.source),
          );
        }
      }
    },
  };
}
