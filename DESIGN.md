---
name: MySWYM Soft Mist
description: App natation personnalisée, DA soft mist (ciel → blanc, glass CSS). App d’abord ; landing alignée.
colors:
  mist-top: "#7EB8F5"
  mist-mid: "#C5DFFB"
  mist-bot: "#F4F8FC"
  ink: "#0F1B2D"
  ink-soft: "#4A5D72"
  primary: "#006BFD"
  primary-soft: "#E8F2FF"
  primary-mid: "#3D8FFF"
  primary-deep: "#0052CC"
  surface: "#FFFFFF"
  glass: "rgba(255, 255, 255, 0.88)"
  glass-soft: "rgba(255, 255, 255, 0.72)"
  coral: "#E85A68"
  coral-soft: "#FDE8EA"
  mint: "#1FAE86"
  mint-soft: "#D8F5EC"
  water: "#1AA8C2"
  gold: "#D4A017"
  grey-mid: "#6B7C8F"
  line: "rgba(15, 27, 45, 0.06)"
  on-primary: "#FFFFFF"
typography:
  sans:
    fontFamily: "Geist, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
  page:
    fontFamily: "{typography.sans.fontFamily}"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  section:
    fontFamily: "{typography.sans.fontFamily}"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  display:
    fontFamily: "{typography.sans.fontFamily}"
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  body:
    fontFamily: "{typography.sans.fontFamily}"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "{typography.sans.fontFamily}"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "normal"
  caption:
    fontFamily: "{typography.sans.fontFamily}"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "normal"
rounded:
  sm: "10px"
  md: "14px"
  lg: "18px"
  card: "28px"
  sheet: "24px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  section: "28px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
    height: "54px"
    padding: "0 24px"
    typography: "{typography.label}"
  button-secondary:
    backgroundColor: "{colors.glass-soft}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "0 16px"
  card-glass:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "16px"
  sheet:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
    padding: "20px"
  dock:
    backgroundColor: "{colors.glass-soft}"
    height: "64px"
    rounded: "{rounded.pill}"
---

# MySWYM Soft Mist

## Overview

**MySWYM** est une app de plans de natation personnalisés (FR d’abord). La DA produit s’appelle **soft mist** : mix OPEN tennis (liquid glass CSS) × Miracle soft UI (ciel bleu → blanc, cartes blanches, air).

### Priorité des surfaces

1. **App loguée** (source de vérité visuelle) : Accueil, Programme, Analyse, Historique, Profil, sheets, prep séance, mode bassin.
2. **Landing / pages marketing** : même famille soft mist + Geist, un peu plus vitrine ; corriger quand ça dérive, sans inventer une 2ᵉ identité.

### Navigation app

- Dock : **Accueil · Programme · Analyse · Historique** (pas de Profil dans le dock).
- **Profil** : avatar top-right → écran plein.
- **Binômes** : menu hamburger uniquement.
- Sheets soft mist pour tips, prep, partage, feedback.

### Sources code (ne pas inventer d’autres tokens)

- App CSS : `src/theme/app-immersive.css` (`--ms-*`)
- Palette runtime : `src/theme/palette.js` (`G_SOFT`)
- Landing : `src/landing/landing.css` (`.lp-root`, `--lp-*`)
- Brand marketing : `src/theme/brand.js`
- Logos : `public/brand/` (+ kit A–F dans `public/`)
- Skill courte : `.cursor/skills/myswym-app-glass/SKILL.md`

### Hors scope produit nageur

- Admin Arthur / cockpit : peut rester sombre (legacy `G_DARK`).
- Ancien mockup Stitch dark `stitch_tableau_de_bord_myswym/**/DESIGN.md` : **obsolète**, ne pas réutiliser.

## Colors

| Rôle | Token | Hex / valeur |
| --- | --- | --- |
| Fond mist haut | `mist-top` | `#7EB8F5` |
| Fond mist milieu | `mist-mid` | `#C5DFFB` |
| Fond mist bas / page | `mist-bot` | `#F4F8FC` |
| Titres | `ink` | `#0F1B2D` |
| Corps / labels | `ink-soft` | `#4A5D72` |
| CTA / liens | `primary` | `#006BFD` |
| Fond pastille bleue | `primary-soft` | `#E8F2FF` |
| Surface carte | `surface` | `#FFFFFF` |
| Glass élevée | `glass` | `rgba(255,255,255,0.88)` |
| Phase échauffement | `primary` | bleu |
| Phase corps | `coral` | `#E85A68` |
| Phase retour | `mint` | `#1FAE86` |
| Succès | `mint` | `#1FAE86` |
| Alerte douce | `coral` | `#E85A68` |

Fond app typique : dégradé vertical mist (`mist-top` → `mist-bot`) ou équivalent radial soft en haut. Pas de mode sombre pour l’UI nageur.

## Typography

Une seule sans pour l’**app** et la **landing** : **Geist** (+ system).

| Classe / usage | Taille | Poids | Couleur |
| --- | --- | --- | --- |
| `ms-type-page` | 28px (`1.75rem`) | 700 | ink |
| `ms-type-section` | 18px | 600 | ink |
| `ms-type-display` | 40px | 700 | ink (chiffres) |
| `ms-type-body` | 15px | 400 | ink-soft |
| `ms-type-label` | 13px | 500 | ink-soft |
| `ms-type-caption` | 12px | 500 | ink-soft |

- Sentence case ; poids 500–700.
- Pas de Space Grotesk dans l’app loguée.
- Landing : `--lp-display` = même famille Geist (pas de 2ᵉ display agressif).
- Copy FR : pas de tiret cadratin `—` ni demi-cadratin `–` (virgule, ` : `, ` · `, ou ` - ` ASCII pour les séances).

## Layout

- Mobile-first ; colonne app centrée ; safe areas respectées.
- Dock flottant bas (~64px) + safe-bottom.
- Accueil : une composition (prochaine séance + un CTA principal), pas un dashboard chips.
- Programme : semaine courante lisible ; passé replié.
- Prep séance : sheet soft mist (fullscreen mobile si besoin).
- Touch targets ≥ **44px**.
- Impression fiche séance : compacte, vise **1 page A4**, fond blanc, pas de cartes lourdes.

## Elevation & Depth

- Glass CSS : `backdrop-filter` blur ~24px, saturate ~1.25.
- Ombres bleutées douces (`rgba(50, 110, 180, …)`), jamais multi-couches néon.
- Cartes blanches / glass sur mist ; bordure blanche ou `line` très légère.
- **Interdit** : WebGL, glow violet, abyss dark nageur.

## Shapes

- Cartes : `28px` (`--ms-card-radius`).
- Sheets : ~`24px` en haut.
- CTA principal : pill `999px`, hauteur `54px`.
- Boutons secondaires / rows : `14–18px`.
- Pastilles allure : pill petite, fond `primary-soft`.

## Components

### CTA primaire (`.ms-pill-cta`)

Bleu `#006BFD`, texte blanc, pill, hauteur 54px. Un seul CTA principal par viewport quand c’est possible.

### Bouton secondaire (`.ms-workout-secondary`)

Fond glass clair, bordure soft, ink-soft, min-height 44px (ex. Imprimer la fiche).

### Soft mist sheet (`.ms-soft-sheet`)

Handle, titre + fermeture, body scrollable. Tips / share au-dessus de la prep (`z-index` élevé, ≥ 560 si stack).

### Carte séance / phases

Phases colorées : warm = bleu, main = corail, cool = mint. Point + label sentence case.

### Dock

4 onglets icône + label ; état actif primary ; glass.

### Brand

- Wordmark bleu sur fond clair ; picto bleu en top bar.
- Kit : `public/brand/*.webp` et PNG A–F (voir `public/brand/README.md`).

### Landing (corrections ponctuelles)

- Même palette mist + primary.
- Hero sobre : marque / une promesse / CTA / mockup dominant.
- Éviter cards inutiles dans le hero ; contrastes lisibles (`ink` / `ink-soft`).

## Do's and Don'ts

### Do

- Partir de **ce** `DESIGN.md` + tokens `--ms-*` / `G_SOFT` pour toute modif UI app.
- Garder l’air, le blanc, le bleu logo, une hiérarchie typo claire.
- Aligner la landing sur soft mist quand on la touche.
- Respecter la typo FR (pas de `—`).
- Préserver les plans utilisateur (pas de régénération silencieuse de semaines).

### Don't

- Réintroduire la DA dark « Hydro Dynamic » / Stitch tableau sombre pour l’app nageur.
- Purple gradients, cream + serif terracotta, layout journal.
- Space Grotesk ou titres display agressifs dans l’app.
- Empiler chips / stats / promos sur l’Accueil.
- WebGL liquid glass.
- Labels UPPERCASE + tracking large.
- Inventer une 2ᵉ palette pour la landing hors soft mist.
