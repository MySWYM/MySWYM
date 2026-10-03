/**
 * CSV reconstruit depuis les lignes Supabase.
 * Le parseur existant (parse.js) relit ce texte : le tirage ne change pas de format.
 */

function csvEscape(value) {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function csvLine(cells) {
  return cells.map(csvEscape).join(",");
}

/**
 * @param {Array<{ n: number, phase?: string|null, bande?: string, total_m: number, echauffement?: string, bloc?: string, rac?: string }>} sessions
 * @param {{ hasPhase?: boolean }} [opts]
 */
export function sessionsToCsv(sessions, opts = {}) {
  const hasPhase = opts.hasPhase === true;
  const header = hasPhase
    ? ["n°", "phase", "bande", "total_m", "échauffement", "bloc de séance", "retour au calme"]
    : ["n°", "bande", "total_m", "échauffement", "bloc de séance", "retour au calme"];
  const lines = [csvLine(header)];
  for (const s of sessions) {
    const cells = hasPhase
      ? [s.n, s.phase || "", s.bande || "", s.total_m, s.echauffement || "", s.bloc || "", s.rac || ""]
      : [s.n, s.bande || "", s.total_m, s.echauffement || "", s.bloc || "", s.rac || ""];
    lines.push(csvLine(cells));
  }
  return `${lines.join("\n")}\n`;
}

/**
 * @param {Array<{ nom: string, nage?: string, debutant?: boolean, intermediaire?: boolean, avance?: boolean, utilite?: string, comment?: string, materielRaw?: string, materiel_raw?: string, garder?: boolean, notes?: string }>} rows
 */
export function educatifsToCsv(rows) {
  const header = [
    "nom",
    "nage",
    "débutant",
    "intermédiaire",
    "avancé",
    "à quoi ça sert",
    "comment",
    "matériel",
    "garder",
    "notes",
  ];
  const oui = (v) => (v ? "oui" : "non");
  const lines = [csvLine(header)];
  for (const row of rows) {
    const raw = row.materielRaw ?? row.materiel_raw ?? "";
    lines.push(
      csvLine([
        row.nom,
        row.nage || "crawl",
        oui(row.debutant),
        oui(row.intermediaire),
        oui(row.avance),
        row.utilite || "",
        row.comment || "",
        raw,
        oui(row.garder !== false),
        row.notes || "",
      ]),
    );
  }
  return `${lines.join("\n")}\n`;
}
