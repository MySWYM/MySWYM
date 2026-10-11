# ForSwim brand kit (S ondulé)

Sources + dérivés pour l’app, le site et les e-mails. Kit validé 11 oct. 2026.

| Runtime (chemins stables) | Source ForSwim | Notes |
| --- | --- | --- |
| `brand/wordmark-bleu-transparent.png` | wordmark bleu seul | **En-têtes** site / app (sans S) |
| `brand/wordmark-blanc-transparent.png` | wordmark blanc seul | En-têtes / boot sur fond sombre |
| `logo-myswym-on-light.png` | principal-horizontal-transparent | S + nom (e-mails / compat) |
| `logo-myswym-banner-blanc.png` | blanc-transparent | S + nom blanc (e-mails sombre) |
| `logo-full-on-light.png` | monochrome-noir-transparent | SEO JSON-LD |
| `logo-full.png` | blanc-transparent | Horizontal blanc |
| `logo-mark.png` | symbole-transparent | Carré paddé, fond transparent |
| `logo-mark-on-dark.png` | symbole-blanc-transparent | Carré paddé |
| `logo-icon-app.png` / favicons / AppIcon | composition | Fond plein `#006BFD`, S blanc ~59 %, sans alpha |
| `og-share.png` | composition 1200×630 | Fond `#006BFD` + logo blanc centré |
| `boot-mark-still.png` | symbole paddé | Carré |

Wordmarks seuls (usage futur, non branchés UI) :

- `wordmark-noir-transparent.png`
- `wordmark-bleu-transparent.png`
- `wordmark-blanc-transparent.png`

Copies sources sous `public/brand/` (`symbole-*`, `principal-*`, etc.).

Constantes code : `src/lib/brand.js` (`LOGO_*`). Composant : `src/BrandLogo.jsx`.

Archive kit F / anciens PNG : `assets/legacy-myswym/`.

ALT : `docs/forswim-assets-alt.md` (toujours **ForSwim**, jamais MySWYM dans `alt`).

Régénérer l’AppIcon iOS : `npm run cap:icon`.

## App Store

Icône 1024×1024 RGB sans alpha : `app-store-icon-1024.png` (même composition que l’AppIcon iOS).
