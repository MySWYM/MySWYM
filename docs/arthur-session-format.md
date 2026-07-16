# Format séance Arthur (référence produit)

Source : `Thierry-MOUROT-OPENSWIM.xlsx` — Bibliothèque + Planning (client réel, 5 semaines).

## Structure d'une séance

Une séance = **4 blocs en lignes**, distance totale exacte, zones Z1–Z4, allures optionnelles.

```
-400m Cr/Dos par 100m (Z1)
-8x50 : · 25m grand chien · 25m normal (Z1)
-3x400m (Z2 @06:29-07:01)
-200m (Z1 souple)
```

Ou avec sous-bloc technique :

```
-400m Cr palmes (Z1 @07:05-07:41)
-600m respiration :
  · 12x50 D1' (Z2 @00:37-00:40) - (3T/5T/7T/9T par 50m)
-6x200m R20'' (Z3 @03:02-03:13)
-300m libre récup
```

Ordre fixe :

1. **Départ** (~350–400 m, Z1) — Cr/Dos, palmes, godilles, mixte
2. **Technique** — un focus (respiration, roulis, catch-up, grand chien, etc.)
3. **Corps** — physio Z2/Z3 (parfois Z4), avec `@mm:ss` si allure connue
4. **Fin / RAC** — souple, « le + lent possible », au choix

## Métadonnées (Excel)

| Champ | Exemple |
|-------|---------|
| Nom | `Construction du volume S4.1` |
| Distance | 1500–2500 m (ce client) |
| Zones | `Z1-Z2` ou `Z1-Z3` |
| Durée | ~60 min |
| Public / phase | Réathlétisation → Construction du volume |

## Semaine

- **3 séances** typiques (S×.1, S×.2, S×.3)
- Volume semaine suivi avec règle **+10 %** vs semaine précédente
- Semaine 1 = référence ; allégée possible après un pic

## Volumes observés (Thierry, 3×/sem)

| Sem. | Total | Phase |
|------|-------|-------|
| 1 | 4700 m | Réathlétisation |
| 2 | 5300 m | Réathlétisation |
| 3 | 5900 m | Réathlétisation |
| 4 | 6200 m | Construction du volume |
| 5 | 5700 m | Construction du volume |

## Allures (Calculateur)

Mêmes % que le générateur coaching :

- Z1 : 1.18–1.28 × ref
- Z2 : 1.08–1.17
- Z3 : 1.01–1.07
- Z4 : 0.92–1.00  
Base 400 m pour Z1–Z3 ; base 100 m pour Z4.

## Règle produit MySWYM

Les plans non-diplôme (hors BNSSA/BPJEPS) doivent afficher des séances **dans ce format**, pas des templates génériques MySWYM (pyramide, « ENDURANCE », jargon UI).

UI : titre + distance ; détail = lignes coach ci-dessus. Rien d’autre.
