# Méthodologie MySWYM — contenu des plans

**UI app : ne pas refondre.** On garde l’affichage séances / semaines tel quel.  
Ce qui évolue = **contenu** des séances + **programmation** (progression).

Deux sources, un seul moteur :

| Source | Rôle |
|--------|------|
| **Arthur (Excel OpenSwim)** | Comment s’écrit une séance (lignes, blocs, Z1–Z4, allures) |
| **COSD / Yann** | Comment on programme la saison (mésocycles, % filières, +10 %, évolution) |

---

## 1. Format séance (Arthur)

Ordre fixe, distances exactes :

1. **Départ** Z1 (~10–20 % du volume séance)  
2. **Technique** (focus rotatif)  
3. **Corps** — zone pilotée par la filière COSD de la séance  
4. **RAC** Z1  

Voir `arthur-session-format.md`.

---

## 2. Programmation (COSD — polarisé)

### Mésocycles (répétés / adaptés à la durée du plan)

| Mésocycle | Phase MySWYM | Volume | Intent |
|-----------|--------------|--------|--------|
| Reprise | début `base` | montée douce | 100 % aéro |
| Volume / Général | `base` tardif + `development` | max de la période | aéro dominant, un peu seuil/VO2 |
| Spécifique | `peak` | un peu moins | allure course, qualité |
| Affûtage | `taper` / `competition` | −35 à −50 % | quasi 100 % aéro + touches vitesse |

Semaine **transition / allégée** : toutes les ~4 semaines + avant compétition (−25 à −40 %).

### Répartition filières (cible hebdo, modèle polarisé)

Haute intensité cumulée **≤ ~13 %** du volume.

| Phase | Aéro (Z1–Z2) | Seuil (Z3) | VO2 / Vitesse (Z3–Z4) |
|-------|--------------|------------|------------------------|
| Reprise | 100 % | 0 | 0 |
| Base / Volume | ~88–95 % | ~2–5 % | ~2–5 % |
| Spécifique | ~90–96 % | ~2–3 % | ~2–6 % |
| Affûtage | ~98–100 % | 0 | ~0–1 % (touches) |

Dans l’app (2–5 séances/sem), on traduit ça en **rôles de séance** dans la semaine, pas en compteur mètre parfait type club 6×/j :

- 1 séance = 1 **corps** dominant (Aéro / Seuil / VO2 / Vitesse)  
- Départ + technique + RAC restent aéro → le % aéro réel reste élevé (polarisé)

### Règle +10 %

Comme Excel OpenSwim : semaine N ≤ semaine N−1 × 1,10 (sauf référence / allégée).

### Ratios repos (référence COSD — déjà dans le contenu des séries)

| Filière | Exemple |
|---------|---------|
| Aéro | R15–30″ selon distance |
| Seuil | ~1:0,4–0,5 |
| VO2 | ~1:1 |
| Vitesse | récup longue (1:3 à 1:6) |

---

## 3. Hors scope pour l’instant

BNSSA / BPJEPS / tests pompiers → ancien `SESSION_TEMPLATES` (examens spécifiques).

Dryland, checklist technique A/B/C, mental COSD → plus tard, sans toucher l’UI actuelle.

---

## 4. Fichiers code

- `src/lib/swim-session-generator.js` — blocs Arthur + allures Z  
- `src/lib/swim-plan-bridge.js` — mésocycles COSD + rôles polarisés + pont MySWYM  
- `generatePlan` dans `App.jsx` — appelle le pont (sauf diplôme)
