/**
 * Parse CSV Google Sheet cahier natation (séances + Éducatifs).
 * Source live = Sheet ; ce module est pur (pas de fetch).
 */

/** @typedef {{ nom: string, nage: string, debutant: boolean, intermediaire: boolean, avance: boolean, utilite: string, comment: string, materiel: string[], garder: boolean, notes: string }} EducatifRow */
/** @typedef {{ n: number, phase: string|null, bande: string, total_m: number, echauffement: string, bloc: string, rac: string }} SessionRow */

export const SHEET_FAMILIES = Object.freeze([
  "01 Nager deb crawl",
  "02 Nager crawl",
  "03 Nager 4 nages",
  "04 XS-Sprint deb crawl",
  "05 XS-Sprint crawl",
  "06 XS-Sprint 4 nages",
  "07 Oly-Half-Full crawl",
  "08 Oly-Half-Full 4 nages",
  "09 OW courte deb crawl",
  "10 OW courte crawl",
  "11 OW courte 4 nages",
  "12 OW moy-long crawl",
  "13 OW moy-long 4 nages",
]);

export const EDUCATIFS_SHEET = "Éducatifs";

/** Familles branchées soft — vague 1 = Nager seulement. Étendre ici à chaque vague. */
export const SHEET_SOFT_FAMILIES = Object.freeze([
  "01 Nager deb crawl",
  "02 Nager crawl",
  "03 Nager 4 nages",
]);

/** Fenêtre anti-doublon : ne pas retraiter ces N dernières séances Sheet. */
export const SHEET_RECENT_EXCLUDE = 10;

/** Fenêtre anti-doublon éducatifs (onglet Éducatifs) — plus courte : pool souvent petit. */
export const SHEET_RECENT_EDUCATIFS = 5;

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  const s = String(text || "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      continue;
    }
    if (c === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += c;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function yes(v) {
  return String(v || "")
    .trim()
    .toLowerCase()
    .startsWith("oui");
}

function splitMateriel(raw) {
  return String(raw || "")
    .split(/[,;/|]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map(normalizeMaterielToken);
}

/** @param {string} token */
export function normalizeMaterielToken(token) {
  const t = String(token || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (!t) return "";
  if (/^pull/.test(t) || t.includes("pull-buoy") || t.includes("pull buoy")) return "pull";
  if (/^palme/.test(t) || t === "fins") return "palmes";
  if (/^tuba/.test(t) || t.includes("snorkel")) return "tuba";
  if (/^planche/.test(t) || t.includes("kickboard")) return "planche";
  if (/^plaquette/.test(t) || t.includes("paddle")) return "plaquettes";
  if (/elastique|elastic/.test(t)) return "elastique";
  return t;
}

/**
 * @param {string} csvText
 * @returns {EducatifRow[]}
 */
export function parseEducatifsCsv(csvText) {
  const rows = parseCsv(csvText);
  if (!rows.length) return [];
  const header = rows[0].map((h) => String(h || "").trim().toLowerCase());
  const idx = (names) => {
    for (const n of names) {
      const i = header.findIndex((h) => h === n || h.includes(n));
      if (i >= 0) return i;
    }
    return -1;
  };
  const iNom = idx(["nom"]);
  const iNage = idx(["nage"]);
  const iDeb = idx(["débutant", "debutant"]);
  const iInt = idx(["intermédiaire"]);
  const iAv = idx(["avancé", "avance"]);
  const iUtil = idx(["à quoi", "a quoi"]);
  const iHow = idx(["comment"]);
  const iMat = idx(["matériel", "materiel"]);
  const iGard = idx(["garder"]);
  const iNotes = idx(["notes"]);
  if (iNom < 0) return [];

  /** @type {EducatifRow[]} */
  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const nom = String(row[iNom] || "").trim();
    if (!nom) continue;
    out.push({
      nom,
      nage: String(iNage >= 0 ? row[iNage] || "" : "")
        .trim()
        .toLowerCase() || "crawl",
      debutant: iDeb >= 0 ? yes(row[iDeb]) : false,
      intermediaire: iInt >= 0 ? yes(row[iInt]) : false,
      avance: iAv >= 0 ? yes(row[iAv]) : false,
      utilite: iUtil >= 0 ? String(row[iUtil] || "").trim() : "",
      comment: iHow >= 0 ? String(row[iHow] || "").trim() : "",
      materiel: iMat >= 0 ? splitMateriel(row[iMat]) : [],
      garder: iGard >= 0 ? yes(row[iGard]) : true,
      notes: iNotes >= 0 ? String(row[iNotes] || "").trim() : "",
    });
  }
  return out;
}

/**
 * @param {string} csvText
 * @param {{ hasPhase?: boolean }} [opts]
 * @returns {SessionRow[]}
 */
export function parseSessionsCsv(csvText, opts = {}) {
  const rows = parseCsv(csvText);
  if (rows.length < 2) return [];
  const header = rows[0].map((h) => String(h || "").trim().toLowerCase());
  // Header row0 may glue title into first cell — detect columns by known names
  const findCol = (names) => {
    for (const n of names) {
      const exact = header.findIndex((h) => h === n);
      if (exact >= 0) return exact;
    }
    for (const n of names) {
      // Évite le titre collé dans la 1ʳᵉ cellule (« … échauffement · … n° »)
      const i = header.findIndex((h) => h.length < 40 && (h.endsWith(n) || h.includes(n)));
      if (i >= 0) return i;
    }
    return -1;
  };
  const hasPhase = opts.hasPhase ?? header.some((h) => h === "phase");
  const cN = findCol(["n°", "nº", "no", "n "]) >= 0 ? findCol(["n°", "nº"]) : 0;
  // If first header is polluted, n° is still col 0 in data
  const cPhase = hasPhase ? findCol(["phase"]) : -1;
  const cBande = findCol(["bande"]);
  const cTotal = findCol(["total_m", "total"]);
  const cEch = findCol(["échauffement", "echauffement"]);
  const cBloc = findCol(["bloc de séance", "bloc"]);
  const cRac = findCol(["retour au calme", "retour"]);

  if (cTotal < 0 || cEch < 0 || cBloc < 0 || cRac < 0) return [];

  /** @type {SessionRow[]} */
  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const total = Number(String(row[cTotal] || "").replace(/\s/g, ""));
    if (!Number.isFinite(total) || total <= 0) continue;
    const nRaw = row[cN] ?? row[0];
    out.push({
      n: Number(nRaw) || r,
      phase: cPhase >= 0 ? String(row[cPhase] || "").trim().toLowerCase() || null : null,
      bande: cBande >= 0 ? String(row[cBande] || "").trim().toLowerCase() : "",
      total_m: total,
      echauffement: String(row[cEch] || "").trim(),
      bloc: String(row[cBloc] || "").trim(),
      rac: String(row[cRac] || "").trim(),
    });
  }
  return out;
}

/**
 * Tirage aléatoire dans la famille (pas de filtre volume).
 * @param {SessionRow[]} sessions
 * @param {{ phase?: string|null, excludeNs?: number[] }} opts
 * @param {() => number} [rng]
 * @returns {SessionRow|null}
 */
export function pickSession(sessions, opts = {}, rng = Math.random) {
  const list = Array.isArray(sessions) ? sessions : [];
  if (!list.length) return null;
  const phase = opts.phase ? String(opts.phase).toLowerCase() : null;

  let pool = list;
  if (phase) {
    const phased = list.filter((s) => s.phase === phase);
    if (phased.length) pool = phased;
  }

  const exclude = new Set(
    (opts.excludeNs || [])
      .map((n) => Number(n))
      .filter((n) => Number.isFinite(n)),
  );
  if (exclude.size) {
    const filtered = pool.filter((s) => !exclude.has(Number(s.n)));
    if (filtered.length) pool = filtered;
  }

  if (!pool.length) return null;
  const i = Math.floor(rng() * pool.length) % pool.length;
  return pool[i];
}

/** Ns Sheet à exclure à partir de l’historique plan (les plus récentes). */
export function excludeSheetNsFromHistory(history, limit = SHEET_RECENT_EXCLUDE) {
  const list = Array.isArray(history) ? history : [];
  const ns = [];
  for (let i = list.length - 1; i >= 0 && ns.length < limit; i--) {
    const n = list[i]?.sheetMeta?.n ?? list[i]?.composerWhy?.sessionN;
    const num = Number(n);
    if (Number.isFinite(num) && !ns.includes(num)) ns.push(num);
  }
  return ns;
}

function normalizeEducatifKey(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/** Noms d’éducatifs déjà vus (historique + optionnel courant) — plus récents d’abord. */
export function excludeEducatifNamesFromHistory(history, limit = SHEET_RECENT_EDUCATIFS) {
  const list = Array.isArray(history) ? history : [];
  const names = [];
  const seen = new Set();
  for (let i = list.length - 1; i >= 0 && names.length < limit; i--) {
    const raw =
      list[i]?.sheetMeta?.educatif ||
      list[i]?.sheetEducatif?.name ||
      list[i]?.composerWhy?.educatif ||
      null;
    const key = normalizeEducatifKey(raw);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    names.push(String(raw).trim());
  }
  return names;
}

/**
 * @param {EducatifRow[]} educatifs
 * @param {{ levelBand: 'debutant'|'intermediaire'|'avance', nage?: string, equipment?: string[]|null, excludeNames?: string[] }} opts
 * @param {() => number} [rng]
 */
export function pickEducatif(educatifs, opts, rng = Math.random) {
  const band = opts.levelBand || "intermediaire";
  const nageWant = String(opts.nage || "crawl").toLowerCase();
  let pool = (educatifs || []).filter((e) => e.garder);
  pool = pool.filter((e) => {
    if (band === "debutant") return e.debutant;
    if (band === "avance") return e.avance;
    return e.intermediaire;
  });
  if (nageWant && nageWant !== "4_nages" && nageWant !== "4n") {
    const byNage = pool.filter((e) => !e.nage || e.nage === nageWant || e.nage === "toutes");
    if (byNage.length) pool = byNage;
  }
  // Prefer drills whose optional matos is subset of owned (or empty matos)
  const owned = Array.isArray(opts.equipment) ? opts.equipment.map(normalizeMaterielToken) : null;
  if (owned) {
    const fit = pool.filter((e) => e.materiel.every((m) => owned.includes(m) || m === ""));
    if (fit.length) pool = fit;
    else {
      const soft = pool.filter((e) => !e.materiel.length);
      if (soft.length) pool = soft;
    }
  }
  const exclude = new Set(
    (opts.excludeNames || []).map(normalizeEducatifKey).filter(Boolean),
  );
  if (exclude.size) {
    const fresh = pool.filter((e) => !exclude.has(normalizeEducatifKey(e.nom)));
    // Si le pool est trop petit, on autorise le recyclage plutôt que bloquer.
    if (fresh.length) pool = fresh;
  }
  if (!pool.length) return null;
  const i = Math.floor(rng() * pool.length) % pool.length;
  return pool[i];
}

/**
 * Pull + palmes interdits sur la même ligne d'exercice (pas sur la séance entière).
 * @param {string} line
 * @param {string[]} adding
 */
export function lineAllowsMateriel(line, adding = []) {
  const blob = `${line} ${adding.join(" ")}`;
  const hasPull = /pull/i.test(blob);
  const hasPalmes = /palmes?/i.test(blob);
  return !(hasPull && hasPalmes);
}

/**
 * @param {string} text
 * @param {{ educatifNom: string, materielLabel?: string|null }} fill
 */
export function fillPlaceholders(text, fill) {
  let out = String(text || "");
  if (fill.educatifNom) {
    out = out.replaceAll("{éducatif}", fill.educatifNom).replaceAll("{educatif}", fill.educatifNom);
  }
  if (fill.materielLabel) {
    out = out.replaceAll("{matériel}", fill.materielLabel).replaceAll("{materiel}", fill.materielLabel);
  } else {
    // pas de matos → nage seule
    out = out
      .replaceAll(" {matériel}", "")
      .replaceAll(" {materiel}", "")
      .replaceAll("{matériel}", "")
      .replaceAll("{materiel}", "");
  }
  return out;
}

/**
 * Choisit un matos pour une ligne, compatible profil + pas pull+palmes sur la ligne.
 * @param {EducatifRow} edu
 * @param {string[]} | null equipment
 * @param {string} line
 * @param {() => number} [rng]
 */
export function pickMaterielForLine(edu, equipment, line, rng = Math.random) {
  if (!Array.isArray(equipment) || !equipment.length) return null;
  const owned = equipment.map(normalizeMaterielToken);
  const candidates = (edu?.materiel || []).filter((m) => owned.includes(m));
  const ok = candidates.filter((m) => lineAllowsMateriel(line, [m === "pull" ? "pull-buoy" : m]));
  if (!ok.length) return null;
  const pick = ok[Math.floor(rng() * ok.length) % ok.length];
  if (pick === "pull") return "pull-buoy";
  if (pick === "tuba") return "tuba";
  return pick;
}

/**
 * @param {SessionRow} session
 * @param {EducatifRow[]} educatifs
 * @param {{ levelBand: string, nage?: string, equipment?: string[]|null }} opts
 * @param {() => number} [rng]
 */
export function materializeSession(session, educatifs, opts, rng = Math.random) {
  const edu = pickEducatif(educatifs, opts, rng);
  const educatifNom = edu?.nom || "éducatif";
  const fillBlock = (block) => {
    const lines = String(block || "").split("\n");
    return lines
      .map((line) => {
        let materielLabel = null;
        if (/\{matériel\}|\{materiel\}/i.test(line) && edu) {
          materielLabel = pickMaterielForLine(edu, opts.equipment, line, rng);
        }
        return fillPlaceholders(line, { educatifNom, materielLabel });
      })
      .join("\n");
  };
  return {
    ...session,
    educatif: edu,
    echauffement: fillBlock(session.echauffement),
    bloc: fillBlock(session.bloc),
    rac: fillBlock(session.rac),
  };
}

/**
 * Mappe une ligne Sheet Éducatifs → forme UI (DrillInfoSheet).
 * Source de vérité = Sheet, pas les fiches .js Arthur.
 */
export function educatifRowToUiFiche(row) {
  if (!row?.nom) return null;
  const levels = [];
  if (row.debutant) levels.push("Débutant");
  if (row.intermediaire) levels.push("Intermédiaire");
  if (row.avance) levels.push("Avancé");
  const mat = Array.isArray(row.materiel)
    ? row.materiel.filter(Boolean).map((m) => {
        if (m === "pull") return "pull-buoy";
        if (m === "tuba") return "tuba";
        return m;
      })
    : [];
  return {
    id: `sheet:${String(row.nom).trim().toLowerCase()}`,
    name: String(row.nom).trim(),
    shortDescription: String(row.utilite || "").trim(),
    objective: String(row.utilite || "").trim() || "Éducatif technique",
    cue: String(row.comment || "").trim() || String(row.utilite || "").trim(),
    level: levels.length ? levels.join(" · ") : null,
    equipment: mat.length ? mat.join(", ") : null,
    mistakes: row.notes ? [String(row.notes).trim()].filter(Boolean) : [],
    ficheSource: "sheet",
    videoUrl: null,
    thumbUrl: null,
  };
}

/** Mappe profil MySWYM → id feuille Sheet.
 * Vague 1 soft (prudence) : familles Nager 01–03 seulement.
 * Triathlon / eau libre = vagues suivantes (retour null → composeur).
 */
export function sheetFamilyIdFromProfile(profile = {}) {
  const goal = String(profile.goal || "").toLowerCase();
  const level = String(profile.level || "").toLowerCase();
  const style = String(profile.swimStyle || profile.strokeFocus || "crawl").toLowerCase();
  const four =
    style.includes("4") ||
    style === "im" ||
    style === "4n";

  const isDeb =
    level === "régulier" ||
    level === "regulier" ||
    level === "beginner" ||
    level === "débutant" ||
    level === "debutant" ||
    level === "découverte" ||
    level === "decouverte";
  const isAv = level === "performance" || level === "avancé" || level === "avance" || level === "advanced";

  const isNager =
    !goal ||
    goal === "progression" ||
    goal === "nager" ||
    goal.startsWith("prog_");

  if (!isNager) return null;

  // Débutant = toujours crawl (règle produit), famille 01
  if (isDeb) return "01 Nager deb crawl";
  // Intermédiaire Oui 4 nages + Avancé → 03
  if (four || isAv) return "03 Nager 4 nages";
  // Intermédiaire crawl → 02
  return "02 Nager crawl";
}

export function levelBandFromProfile(profile = {}) {
  const level = String(profile.level || "").toLowerCase();
  if (
    level === "régulier" ||
    level === "regulier" ||
    level === "beginner" ||
    level === "débutant" ||
    level === "debutant" ||
    level === "découverte" ||
    level === "decouverte"
  ) {
    return "debutant";
  }
  if (level === "performance" || level === "avancé" || level === "avance" || level === "advanced") {
    return "avance";
  }
  return "intermediaire";
}

export function phaseFromLoopCursor(cursor, isEventFamily) {
  if (!isEventFamily) return null;
  const c = Math.max(0, Number(cursor) || 0);
  // Aligné catalogue : rares tests / deload — pour la boucle on reste en construction
  // sauf curseurs explicites (extensible plus tard)
  if (c === 0) return "test";
  if (c === 1) return "deload";
  return "construction";
}

export function isEventFamilyId(familyId) {
  const id = String(familyId || "");
  return /XS-Sprint|Oly-Half-Full|OW /i.test(id);
}
