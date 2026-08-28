#!/usr/bin/env python3
"""Génère le lexique Sheet ↔ app MySWYM (Excel pour Arthur).

Usage : python3 docs/coach-ligne/build_lexique_sheet.py
Sortie : docs/coach-ligne/lexique-sheet-myswym.xlsx
"""

from __future__ import annotations

from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

OUT = Path(__file__).with_name("lexique-sheet-myswym.xlsx")

NAVY, BLUE = "0A162C", "006BFD"
LINE = "D5DEE8"
thin = Border(
    left=Side(style="thin", color=LINE),
    right=Side(style="thin", color=LINE),
    top=Side(style="thin", color=LINE),
    bottom=Side(style="thin", color=LINE),
)
fill_navy = PatternFill("solid", fgColor=NAVY)
fill_blue = PatternFill("solid", fgColor=BLUE)
fill_soft = PatternFill("solid", fgColor="E8F1FF")
fill_alt = PatternFill("solid", fgColor="F7FAFC")
fill_warn = PatternFill("solid", fgColor="FFF3E0")
font_title = Font(name="Calibri", size=16, bold=True, color="FFFFFF")
font_h = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
font_body = Font(name="Calibri", size=11, color=NAVY)
font_bold = Font(name="Calibri", size=11, bold=True, color=NAVY)
wrap = Alignment(wrap_text=True, vertical="top")


def style_header(ws, row, cols):
    for c in range(1, cols + 1):
        cell = ws.cell(row, c)
        cell.fill = fill_blue
        cell.font = font_h
        cell.border = thin
        cell.alignment = wrap


def style_body(ws, start, end, cols):
    for r in range(start, end + 1):
        for c in range(1, cols + 1):
            cell = ws.cell(r, c)
            cell.font = font_body
            cell.border = thin
            cell.alignment = wrap
            if r % 2 == 0:
                cell.fill = fill_alt


def autosize(ws, widths):
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w


def add_title(ws, title, cols):
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=cols)
    cell = ws.cell(1, 1, title)
    cell.fill = fill_navy
    cell.font = font_title
    cell.alignment = Alignment(vertical="center", horizontal="left")
    ws.row_dimensions[1].height = 28


def sheet_tokens(wb):
    ws = wb.create_sheet("1 · Tokens", 0)
    add_title(ws, "MySWYM — Tokens Google Sheet (l’app remplace)", 5)
    headers = ["Token", "Zone", "Sens simple", "Qui / règle", "Exemple de ligne"]
    for i, h in enumerate(headers, 1):
        ws.cell(2, i, h)
    style_header(ws, 2, 5)

    rows = [
        ("{D:facile}", "Z1", "Départ perso rythme très aisé", "Int/avancé + Premium + T100. Débutant → repos 30 s", "8 × 100 m crawl, {D:facile}"),
        ("{D:endurance}", "Z2", "Départ perso rythme tenable longtemps", "Idem", "8 × 100 m crawl, {D:endurance}"),
        ("{D:seuil}", "Z3", "Départ perso allure soutenue / course", "Idem", "8 × 100 m crawl, {D:seuil}"),
        ("{D:VO2}", "Z4", "Départ perso séries dures (récup incomplète)", "Idem — nage vite, repos assez court", "8 × 50 m crawl, {D:VO2}"),
        ("{D:sprint}", "Max", "Départ perso explosif (récup quasi complète)", "Idem — nage max, repos long → D souvent plus large que VO2", "8 × 25 m crawl, {D:sprint}"),
        ("{@:facile}", "Z1", "Plage de temps @mm:ss–mm:ss", "Même règles que D", "8 × 100 m crawl, {@:facile}"),
        ("{@:endurance}", "Z2", "Plage allure endurance", "Idem", "8 × 100 m, {D:endurance} {@:endurance}"),
        ("{@:seuil}", "Z3", "Plage allure seuil", "Idem", "6 × 100 m, {D:seuil} {@:seuil}"),
        ("{@:VO2}", "Z4", "Plage allure VO2", "Idem", "8 × 50 m, {D:VO2} {@:VO2}"),
        ("{@:sprint}", "Max", "Plage allure sprint", "Idem", "8 × 25 m, {D:sprint} {@:sprint}"),
        ("{éducatif}", "—", "1 éducatif tiré (niveau + nage)", "Tous niveaux Sheet soft", "4 × 50 m {éducatif}, repos 15 s"),
        ("{éducatif_pap}", "—", "1 éducatif papillon", "Lignes 4 nages", "… {éducatif_pap} …"),
        ("{éducatif_dos}", "—", "1 éducatif dos", "Idem", "… {éducatif_dos} …"),
        ("{éducatif_brasse}", "—", "1 éducatif brasse", "Idem", "… {éducatif_brasse} …"),
        ("{éducatif_crawl}", "—", "1 éducatif crawl", "Idem", "… {éducatif_crawl} …"),
        ("{matériel}", "—", "Matos optionnel (fiche ∩ inventaire)", "Si rien → token retiré. Pas pull+palmes même ligne", "4 × 50 m {éducatif} {matériel}"),
    ]
    for i, row in enumerate(rows, 3):
        for c, v in enumerate(row, 1):
            ws.cell(i, c, v)
    style_body(ws, 3, 2 + len(rows), 5)

    r = 3 + len(rows) + 1
    ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=5)
    note = ws.cell(
        r,
        1,
        "ALIAS acceptés : souple/lent/z1→facile · moyen/z2→endurance · vite/rapide/course/triathlon/z3→seuil · z4/vo2max→VO2 · max/abloc→sprint. "
        "Sur onglets débutant (01, 04) : ne pas mettre {D:} / {@:} (inutile).",
    )
    note.fill = fill_warn
    note.font = font_bold
    note.alignment = wrap
    ws.row_dimensions[r].height = 45
    autosize(ws, [18, 8, 42, 38, 48])


def sheet_filieres(wb):
    ws = wb.create_sheet("2 · Filières", 1)
    add_title(ws, "Filières — à quoi ça sert (simple)", 6)
    headers = ["Token", "Zone", "Sensation", "Ça travaille quoi ?", "Pour qui / quand", "Récup entre reps"]
    for i, h in enumerate(headers, 1):
        ws.cell(2, i, h)
    style_header(ws, 2, 6)
    rows = [
        ("facile", "Z1", "Tu peux parler, technique clean", "Base, récup active, volume sans casse", "Tous ; échauff / RAC / jours légers ; débutants surtout", "Large"),
        ("endurance", "Z2", "Rythme stable longtemps", "Moteur aérobie (tri XS/Sprint, fond)", "Inter+ ; cœur du volume", "Moyenne"),
        ("seuil", "Z3", "Dur mais tenable en série", "Allure course / économie à rythme élevé", "Inter+ qui prépare une distance", "Serrée / moyenne"),
        ("VO2", "Z4", "Dans le rouge, tu finis la rep", "Remonter le plafond (puissance aérobie max)", "Confirmés ; 1 bloc qualité souvent", "Incomplète (repars fatigué)"),
        ("sprint", "Max", "Court, explosif, max", "Vitesse, départ, coup de rein", "Doses courtes ; utile tri (départ massif)", "Quasi complète"),
    ]
    for i, row in enumerate(rows, 3):
        for c, v in enumerate(row, 1):
            ws.cell(i, c, v)
    style_body(ws, 3, 7, 6)
    ws.cell(9, 1, "VO2 ≠ sprint : VO2 = douloureux et répété ; sprint = maximal et bien récupéré.")
    ws.merge_cells("A9:F9")
    ws.cell(9, 1).fill = fill_soft
    ws.cell(9, 1).font = font_bold
    ws.cell(9, 1).alignment = wrap
    autosize(ws, [12, 8, 32, 40, 40, 28])


def sheet_mots(wb):
    ws = wb.create_sheet("3 · Mots libres", 2)
    add_title(ws, "Mots sans accolades — l’app les lit tels quels", 3)
    headers = ["Mot dans la ligne", "Effet UI", "Note"]
    for i, h in enumerate(headers, 1):
        ws.cell(2, i, h)
    style_header(ws, 2, 3)
    rows = [
        ("souple", "Pastille Souple", "Récup — ≠ lent"),
        ("lent", "Pastille Lent", "Lent contrôlé (technique), pas récup"),
        ("moyen", "Pastille Moyen", "Rythme régulier (mot libre, pas token D)"),
        ("progressif", "Pastille Progressif", "Accélère sur la distance"),
        ("vite / rapide", "Pastille Vite", ""),
        ("à bloc / sprint", "Pastilles dédiées", "Mot libre ; pour D perso utilise {D:sprint}"),
        ("2+ allures", "Pastille Enchaînement", "Ex. lent progressif · souple moyen vite · (1 lent, 1 moyen…)"),
        ("repos 30 s / R30\"", "Pastille R", "Pause fixe"),
        ("départ 1 min / D2'", "Pastille D fixe", "Ne pas mélanger avec {D:…} sur la même ligne"),
    ]
    for i, row in enumerate(rows, 3):
        for c, v in enumerate(row, 1):
            ws.cell(i, c, v)
    style_body(ws, 3, 11, 3)
    autosize(ws, [28, 28, 55])


def sheet_rediger(wb):
    ws = wb.create_sheet("4 · Rédiger une séance", 3)
    add_title(ws, "Comment écrire pour que l’app comprenne", 2)
    headers = ["Règle", "Détail"]
    for i, h in enumerate(headers, 1):
        ws.cell(2, i, h)
    style_header(ws, 2, 2)
    rows = [
        ("1 ligne = 1 exercice", "Un retour à la ligne = une carte dans l’app."),
        ("Structure", "Colonnes : échauffement · bloc · rac (retour au calme). total_m = somme."),
        ("Ordre d’une ligne", "[volume] [nage] [allure(s)] [, récup ou {D:}] [, {@:}] [, éducatif/matos]"),
        ("Exemple simple", "8 × 100 m crawl moyen, repos 30 s"),
        ("Exemple avec pace", "8 × 100 m crawl, {D:endurance} {@:endurance}"),
        ("Exemple VO2", "8 × 50 m crawl, {D:VO2} {@:VO2}"),
        ("Exemple sprint", "8 × 25 m crawl sprint, {D:sprint}"),
        ("Éducatif", "4 × 50 m {éducatif} {matériel}, repos 15 s"),
        ("4 nages + éducatifs", "Écrire « 4 nages » + « éducatif(s) » → 1 éducatif / nage (pap→dos→brasse→crawl)."),
        ("Débutant", "Pas de {D:} / {@:} — mots souple/moyen + repos … s"),
        ("Orthographe tokens", "Exactement {D:endurance} — pas d’espace bizarre ; VO2 OK en majuscules."),
        ("À éviter", "Deux D sur la même ligne (D2' fixe + {D:seuil}) ; allure course pour débutants."),
    ]
    for i, row in enumerate(rows, 3):
        for c, v in enumerate(row, 1):
            ws.cell(i, c, v)
            if c == 1:
                ws.cell(i, c).font = font_bold
    style_body(ws, 3, 14, 2)
    autosize(ws, [28, 85])


def sheet_familles(wb):
    ws = wb.create_sheet("5 · Familles onglets", 4)
    add_title(ws, "Quel onglet pour quel nageur (soft-branch)", 3)
    headers = ["Onglet Sheet", "Profil", "Pace {D:}/{@:}"]
    for i, h in enumerate(headers, 1):
        ws.cell(2, i, h)
    style_header(ws, 2, 3)
    rows = [
        ("01 Nager deb crawl", "Débutant · Nager", "Non (débutant)"),
        ("02 Nager crawl", "Inter crawl · Nager", "Oui si Premium + T100"),
        ("03 Nager 4 nages", "Inter 4n / Avancé · Nager", "Oui si Premium + T100"),
        ("04 XS-Sprint deb crawl", "Débutant · XS/Sprint", "Non (débutant)"),
        ("05 XS-Sprint crawl", "Inter crawl · XS/Sprint", "Oui si Premium + T100"),
        ("06 XS-Sprint 4 nages", "Inter 4n / Avancé · XS/Sprint", "Oui si Premium + T100"),
        ("07 Oly-Half-Full crawl", "Inter crawl · Oly/Half/Full", "Oui si Premium + T100"),
        ("08 Oly-Half-Full 4 nages", "Inter 4n / Avancé · Oly/Half/Full", "Oui si Premium + T100"),
        ("09 OW courte deb crawl", "Débutant · OW courte", "Non (débutant)"),
        ("10 OW courte crawl", "Inter crawl · OW courte", "Oui si Premium + T100"),
        ("11 OW courte 4 nages", "Inter 4n / Avancé · OW courte", "Oui si Premium + T100"),
        ("12 OW moy-long crawl", "Inter crawl · OW moy/long", "Oui si Premium + T100"),
        ("13 OW moy-long 4 nages", "Inter 4n / Avancé · OW moy/long", "Oui si Premium + T100"),
    ]
    for i, row in enumerate(rows, 3):
        for c, v in enumerate(row, 1):
            ws.cell(i, c, v)
    last = 2 + len(rows)
    style_body(ws, 3, last, 3)
    autosize(ws, [28, 36, 32])


def sheet_calcul(wb):
    ws = wb.create_sheet("6 · Calcul D (indicatif)", 5)
    add_title(ws, "Comment l’app calcule D (marges = code pace-placeholders.js)", 4)
    headers = ["Intent", "Idée nage vs T100", "Marge repos ajoutée", "Exemple T100=1:30 · ×100 m"]
    for i, h in enumerate(headers, 1):
        ws.cell(2, i, h)
    style_header(ws, 2, 4)
    rows = [
        ("facile", "zone easy (Z1)", "+25 s", "≈ D2'25\" – D2'30\""),
        ("endurance", "milieu easy / seuil", "+15 s", "≈ D2' – D2'10\""),
        ("seuil", "zone threshold", "+12 s", "≈ D1'50\" – D2'"),
        ("VO2", "proche / un cran sous sprint", "+15 s (incomplète)", "≈ D1'40\" – D1'50\""),
        ("sprint", "plus vite que VO2 (max court)", "+28 s (complète)", "≈ D1'50\" – D2'05\" (repos long)"),
    ]
    for i, row in enumerate(rows, 3):
        for c, v in enumerate(row, 1):
            ws.cell(i, c, v)
    style_body(ws, 3, 7, 4)
    ws.merge_cells("A9:D9")
    ws.cell(
        9,
        1,
        "Formule : D = arrondi 5 s ( T100 × mult × (distance_rep/100) + marge ). "
        "Distance lue sur la ligne (8 × 50 m → 50). Débutant / sans T100 / non Premium → {D:} devient « repos 30 s » ; {@:} retiré.",
    )
    ws.cell(9, 1).fill = fill_warn
    ws.cell(9, 1).font = font_bold
    ws.cell(9, 1).alignment = wrap
    ws.row_dimensions[9].height = 50
    autosize(ws, [14, 32, 28, 36])


def sheet_notes(wb):
    """Onglet Notes — pièges + règles coach à avoir sous les yeux en rédigeant."""
    ws = wb.create_sheet("7 · Notes", 6)
    add_title(ws, "Notes coach — pièges, colonnes Sheet, calendrier vers J", 3)
    headers = ["Sujet", "Règle", "Détail"]
    for i, h in enumerate(headers, 1):
        ws.cell(2, i, h)
    style_header(ws, 2, 3)

    rows = [
        (
            "Colonne Notes (onglet Éducatifs)",
            "Libre — pour toi, pas un filtre app",
            "L’app lit Nom, Nage, niveaux oui/non, utilité, comment, Matériel optionnel, Garder. "
            "La colonne Notes du Sheet éducatifs n’oriente pas le tirage : c’est ton mémo coach.",
        ),
        (
            "Garder = oui",
            "Seul filtre « actif »",
            "Un éducatif avec Garder ≠ oui n’entre jamais dans le tirage.",
        ),
        (
            "Matériel optionnel",
            "et/ou = alternatives",
            "Ne gate pas le choix de l’éducatif. Remplit {matériel} seulement si ∩ inventaire nageur. "
            "Jamais pull-buoy + palmes sur la même ligne d’exercice.",
        ),
        (
            "Débutant",
            "Jamais {D:} / {@:}",
            "Sur 01 / 04 / 09 : mots souple / moyen + repos … s. Sinon l’app force repos 30 s.",
        ),
        (
            "Inter / Avancé + pace",
            "Premium + T100",
            "Sans T100 ou hors Premium → même fallback (repos / token retiré).",
        ),
        (
            "D fixe vs {D:}",
            "Ne pas mélanger",
            "Une ligne avec D2' (horloge bassin) + {D:seuil} = conflit. Un seul type de départ.",
        ),
        (
            "4 nages + éducatifs",
            "1 éducatif / nage",
            "Écrire « 4 nages » + « éducatif(s) » → pap → dos → brasse → crawl. Distances Sheet inchangées.",
        ),
        (
            "Anti-doublon éducatif",
            "Pas 2× d’affilée",
            "Dernier éducatif exclu en dur ; variété sur ~5 derniers si le pool le permet.",
        ),
        (
            "Calendrier vers J (tri / OW)",
            "S-6 allégée · S-7 test",
            "Depuis J : S0 course (max 2 séances) · S-1 allégée · S-2→S-5 travail · "
            "S-6 allégée cycle · S-7 test · puis 6 travail entre chaque couple. "
            "Pas de test/allégée cycle avant S-6. Début de plan : 2 sem. travail avant le 1er couple.",
        ),
        (
            "Planning app",
            "Pastille = progression",
            "« Cette semaine » avance avec les semaines validées (Semaine 2 → S-n−1), pas seulement le calendrier civil.",
        ),
        (
            "Soft-branch 01–13",
            "Pas de fallback composeur",
            "Familles soft = Sheet obligatoire. Diplômes restent composeur (pas d’onglet Sheet).",
        ),
        (
            "Réf. séance",
            "UI n° ≠ ligne Sheet",
            "Pastille Réf. 01-42 = onglet + ligne n. « Séance n°6 » = compteur nageur (validations).",
        ),
        (
            "Orthographe tokens",
            "Exact",
            "{D:endurance} {D:VO2} — pas d’espace ; alias (moyen, vite…) OK mais préfère le canonique.",
        ),
        (
            "Regen Excel",
            "python3 docs/coach-ligne/build_lexique_sheet.py",
            "Régénère lexique-sheet-myswym.xlsx. Coller / partager hors repo si tu travailles surtout sur Google Sheet.",
        ),
    ]
    for i, row in enumerate(rows, 3):
        for c, v in enumerate(row, 1):
            ws.cell(i, c, v)
            if c == 1:
                ws.cell(i, c).font = font_bold
    last = 2 + len(rows)
    style_body(ws, 3, last, 3)
    for r in range(3, last + 1):
        ws.row_dimensions[r].height = 48
    autosize(ws, [28, 28, 78])


def main():
    wb = Workbook()
    # remove default
    default = wb.active
    wb.remove(default)
    sheet_tokens(wb)
    sheet_filieres(wb)
    sheet_mots(wb)
    sheet_rediger(wb)
    sheet_familles(wb)
    sheet_calcul(wb)
    sheet_notes(wb)
    wb.save(OUT)
    print(f"OK → {OUT}")


if __name__ == "__main__":
    main()
