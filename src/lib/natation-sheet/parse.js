import {
  canResolveSheetPace,
  resolvePacePlaceholders,
} from "./pace-placeholders.js";
import { eventBandFromGoal } from "../sports-engine/race-event.js";

/**
 * Parse CSV Google Sheet cahier natation (séances + Éducatifs).
 * Source live = Sheet ; ce module est pur (pas de fetch).
 */

/** @typedef {{ nom: string, nage: string, debutant: boolean, intermediaire: boolean, avance: boolean, utilite: string, comment: string, materiel: string[], materielRaw: string, garder: boolean, notes: string }} EducatifRow */
/** materiel = alternatives pour {matériel} ; materielRaw = texte Sheet affiché tel quel */
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

/** Familles branchées soft, Nager + tout triathlon/OW du Sheet (01-13). Diplômes = hors Sheet. */
export const SHEET_SOFT_FAMILIES = Object.freeze([...SHEET_FAMILIES]);

/** Fenêtre anti-doublon : ne pas retraiter ces N dernières séances Sheet. */
export const SHEET_RECENT_EXCLUDE = 10;

/** Fenêtre anti-doublon éducatifs (onglet Éducatifs), plus courte : pool souvent petit. */
export const SHEET_RECENT_EDUCATIFS = 5;

/** Ordre IM pour les séances « 4 nages + éducatifs ». */
export const FOUR_NAGES_STROKES = Object.freeze(["papillon", "dos", "brasse", "crawl"]);

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
  const s = String(raw || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (!s || /^(aucun|none|no|rien|-)$/i.test(s)) return [];
  // « pull-buoy et/ou tubas », « palmes et/ou tubas ou pull-buoy… » = alternatives optionnelles
  const parts = s
    .split(/\s*(?:et\/ou|et\/ ou|\/|,|;|\bou\b|\|)\s*/i)
    .map((x) => x.trim())
    .filter(Boolean);
  const out = [];
  const seen = new Set();
  for (const part of parts) {
    const tok = normalizeMaterielToken(part);
    if (!tok || tok === "aucun" || seen.has(tok)) continue;
    seen.add(tok);
    out.push(tok);
  }
  return out;
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
    const matRaw = iMat >= 0 ? String(row[iMat] || "").trim() : "";
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
      materiel: splitMateriel(matRaw),
      materielRaw: matRaw,
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
  // Header row0 may glue title into first cell, detect columns by known names
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

export function normalizeEducatifKey(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/** Normalise la colonne Nage du Sheet → papillon|dos|brasse|crawl|toutes|autre. */
export function normalizeNageKey(raw) {
  const t = String(raw || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (!t) return "";
  if (/^(toutes|all|4n|4_nages|im)$/.test(t) || /4\s*nages/.test(t)) return "toutes";
  if (/pap|fly|butterfly/.test(t)) return "papillon";
  if (/dos|back/.test(t)) return "dos";
  if (/brasse|breast/.test(t)) return "brasse";
  if (/crawl|nl|free|nage\s*libre/.test(t)) return "crawl";
  return t;
}

/** Ligne Sheet : « 4 nages » + « éducatif(s) » → 1 éducatif par nage. */
export function lineHasFourNagesEducatifs(line) {
  const s = String(line || "");
  if (!/4\s*nages/i.test(s)) return false;
  return /[ée]ducatif/i.test(s);
}

export function sessionHasFourNagesEducatifs(session) {
  const blob = [session?.echauffement, session?.bloc, session?.rac].map((x) => String(x || "")).join("\n");
  return String(blob)
    .split("\n")
    .some((line) => lineHasFourNagesEducatifs(line));
}

/** Noms d’éducatifs déjà vus (historique + optionnel courant), plus récents d’abord. */
export function excludeEducatifNamesFromHistory(history, limit = SHEET_RECENT_EDUCATIFS) {
  const list = Array.isArray(history) ? history : [];
  const names = [];
  const seen = new Set();
  const push = (raw) => {
    const key = normalizeEducatifKey(raw);
    if (!key || seen.has(key) || names.length >= limit) return;
    seen.add(key);
    names.push(String(raw).trim());
  };
  for (let i = list.length - 1; i >= 0 && names.length < limit; i--) {
    const row = list[i];
    const multi =
      row?.sheetMeta?.educatifs ||
      row?.composerWhy?.educatifs ||
      (Array.isArray(row?.sheetEducatifs) ? row.sheetEducatifs.map((f) => f?.name) : null);
    if (Array.isArray(multi) && multi.length) {
      for (const n of multi) push(n);
      continue;
    }
    push(row?.sheetMeta?.educatif || row?.sheetEducatif?.name || row?.composerWhy?.educatif || null);
  }
  return names;
}

/**
 * @param {EducatifRow[]} educatifs
 * @param {{ levelBand: 'debutant'|'intermediaire'|'avance', nage?: string, excludeNames?: string[], hardExcludeNames?: string[] }} opts
 * @param {() => number} [rng]
 */
export function pickEducatif(educatifs, opts, rng = Math.random) {
  const band = opts.levelBand || "intermediaire";
  const nageWant = normalizeNageKey(opts.nage || "crawl");
  let pool = (educatifs || []).filter((e) => e.garder);
  pool = pool.filter((e) => {
    if (band === "debutant") return e.debutant;
    if (band === "avance") return e.avance;
    return e.intermediaire;
  });
  if (nageWant && nageWant !== "toutes") {
    const byNage = pool.filter((e) => {
      const parts = String(e.nage || "")
        .split(/[,/]+/)
        .map((x) => normalizeNageKey(x.trim()))
        .filter(Boolean);
      if (!parts.length) return true;
      return parts.includes(nageWant) || parts.includes("toutes");
    });
    if (byNage.length) pool = byNage;
  }
  // Matériel = optionnel sur la fiche : ne filtre JAMAIS le choix d’éducatif.
  // Le matos n’intervient que sur le placeholder {matériel} (voir pickMaterielForLine).

  const applyExclude = (names, { hard }) => {
    const exclude = new Set((names || []).map(normalizeEducatifKey).filter(Boolean));
    if (!exclude.size) return;
    const fresh = pool.filter((e) => !exclude.has(normalizeEducatifKey(e.nom)));
    if (fresh.length) pool = fresh;
    else if (!hard) {
      /* soft : recyclage si pool vide */
    }
  };

  applyExclude(opts.hardExcludeNames, { hard: true });
  applyExclude(opts.excludeNames, { hard: false });

  if (!pool.length) return null;
  const i = Math.floor(rng() * pool.length) % pool.length;
  return pool[i];
}

/**
 * 1 éducatif par nage (ordre IM). Noms distincts dans le quatuor si le pool le permet.
 * @returns {{ papillon: EducatifRow|null, dos: EducatifRow|null, brasse: EducatifRow|null, crawl: EducatifRow|null, list: EducatifRow[] }}
 */
export function pickFourNagesEducatifs(educatifs, opts, rng = Math.random) {
  const used = [];
  /** @type {Record<string, EducatifRow|null>} */
  const byStroke = {};
  for (const stroke of FOUR_NAGES_STROKES) {
    const pick = pickEducatif(
      educatifs,
      {
        ...opts,
        nage: stroke,
        hardExcludeNames: [...(opts.hardExcludeNames || []), ...used],
        excludeNames: [...(opts.excludeNames || []), ...used],
      },
      rng,
    );
    byStroke[stroke] = pick;
    if (pick?.nom) used.push(pick.nom);
  }
  const list = FOUR_NAGES_STROKES.map((s) => byStroke[s]).filter(Boolean);
  return { ...byStroke, list };
}

/** Libellé des 4 noms (distances inchangées, on ne touche qu’aux noms). */
export function formatFourNagesEducatifsLabel(byStroke) {
  return FOUR_NAGES_STROKES.map((stroke) => {
    const nom = byStroke?.[stroke]?.nom || "éducatif";
    const short =
      stroke === "papillon" ? "pap" : stroke === "brasse" ? "brasse" : stroke === "dos" ? "dos" : "crawl";
    return `${nom} (${short})`;
  }).join(" + ");
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
 * @param {{ educatifNom?: string, materielLabel?: string|null, fourNagesLabel?: string|null, fourNagesByStroke?: Record<string, {nom?: string}|null>|null }} fill
 */
export function fillPlaceholders(text, fill) {
  let out = String(text || "");
  const by = fill.fourNagesByStroke || null;
  if (by) {
    const aliases = {
      papillon: ["papillon", "pap", "butterfly"],
      dos: ["dos", "back"],
      brasse: ["brasse", "breast"],
      crawl: ["crawl", "nl", "free"],
    };
    for (const stroke of FOUR_NAGES_STROKES) {
      const nom = by[stroke]?.nom;
      if (!nom) continue;
      for (const a of aliases[stroke]) {
        out = out.replaceAll(`{éducatif_${a}}`, nom).replaceAll(`{educatif_${a}}`, nom);
      }
    }
  }
  if (fill.fourNagesLabel && lineHasFourNagesEducatifs(out)) {
    // Distances inchangées : on remplace seulement le trou / le mot « éducatif(s) »
    if (/\{éducatif\}|\{educatif\}/i.test(out)) {
      out = out.replaceAll("{éducatif}", fill.fourNagesLabel).replaceAll("{educatif}", fill.fourNagesLabel);
    } else {
      out = out.replace(/[ée]ducatifs?/gi, fill.fourNagesLabel);
    }
  } else if (fill.educatifNom) {
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
 * Matos optionnel pour une ligne `{matériel}` : tirage parmi la fiche ∩ inventaire nageur.
 * Jamais un matos non déclaré par l’utilisateur. Pull+palmes interdit sur la même ligne.
 * @param {EducatifRow} edu
 * @param {string[]|null|undefined} equipment
 * @param {string} line
 * @param {() => number} [rng]
 */
export function pickMaterielForLine(edu, equipment, line, rng = Math.random) {
  if (!Array.isArray(equipment) || !equipment.length) return null;
  const owned = equipment.map(normalizeMaterielToken).filter(Boolean);
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
 * @param {{ levelBand: string, nage?: string, equipment?: string[]|null, excludeNames?: string[], hardExcludeNames?: string[], pace100?: number|null, isPremium?: boolean }} opts
 * @param {() => number} [rng]
 */
export function materializeSession(session, educatifs, opts, rng = Math.random) {
  const blob = [session?.echauffement, session?.bloc, session?.rac].map((x) => String(x || "")).join("\n");
  const wantsFour =
    sessionHasFourNagesEducatifs(session) || /\{[ée]ducatif_(pap|dos|brasse|crawl)/i.test(blob);
  const four = wantsFour ? pickFourNagesEducatifs(educatifs, opts, rng) : null;
  const fourLabel = four ? formatFourNagesEducatifsLabel(four) : null;
  // Séance mono-nage (ou lignes hors « 4 nages éducatifs ») : 1 éducatif comme avant
  const edu =
    (!wantsFour && pickEducatif(educatifs, opts, rng)) ||
    four?.crawl ||
    four?.list?.[0] ||
    pickEducatif(educatifs, opts, rng);
  const educatifNom = edu?.nom || "éducatif";
  const allowPace = canResolveSheetPace(opts);
  const fillBlock = (block) => {
    const lines = String(block || "").split("\n");
    return lines
      .map((line) => {
        const isFourLine = lineHasFourNagesEducatifs(line);
        const hasStrokePh = /\{[ée]ducatif_(pap|dos|brasse|crawl)/i.test(line);
        let materielLabel = null;
        const matosSource = isFourLine || hasStrokePh ? four?.crawl || edu : edu;
        if (/\{matériel\}|\{materiel\}/i.test(line) && matosSource) {
          materielLabel = pickMaterielForLine(matosSource, opts.equipment, line, rng);
        }
        const filled = fillPlaceholders(line, {
          educatifNom: isFourLine ? undefined : educatifNom,
          fourNagesLabel: isFourLine ? fourLabel : null,
          fourNagesByStroke: isFourLine || hasStrokePh ? four : null,
          materielLabel,
        });
        return resolvePacePlaceholders(filled, {
          allowPace,
          pace100: opts.pace100,
        });
      })
      .join("\n");
  };
  return {
    ...session,
    educatif: edu,
    educatifs: four?.list?.length ? four.list : edu ? [edu] : [],
    educatifsByStroke: four || null,
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
  // Affichage = texte Sheet brut (ex. « palmes et/ou tubas ou pull-buoy et/ou tubas »)
  const equipmentRaw = String(row.materielRaw || "").trim();
  return {
    id: `sheet:${String(row.nom).trim().toLowerCase()}`,
    name: String(row.nom).trim(),
    shortDescription: String(row.utilite || "").trim(),
    objective: String(row.utilite || "").trim() || "Éducatif technique",
    cue: String(row.comment || "").trim() || String(row.utilite || "").trim(),
    level: levels.length ? levels.join(" · ") : null,
    equipment: equipmentRaw || null,
    mistakes: row.notes ? [String(row.notes).trim()].filter(Boolean) : [],
    ficheSource: "sheet",
    videoUrl: null,
    thumbUrl: null,
  };
}

/** Objectifs Triathlon XS / Sprint (onglets Sheet 04-06). */
export function isXsSprintGoal(goal) {
  const g = String(goal || "").toLowerCase();
  return g === "triathlon_xs" || g === "triathlon_sprint";
}

/** Objectifs Triathlon Oly / Half / Full (onglets Sheet 07-08). */
export function isOlyHalfFullGoal(goal) {
  const g = String(goal || "").toLowerCase();
  return g === "triathlon_olympic" || g === "triathlon_half" || g === "triathlon_ironman";
}

/** Objectifs eau libre (onglets Sheet 09-13). */
export function isOpenWaterGoal(goal) {
  const g = String(goal || "").toLowerCase();
  return g.startsWith("open_water") || g.startsWith("eau_libre");
}

/** Mappe profil MySWYM → id feuille Sheet.
 * Soft : Nager 01-03 + triathlon 04-08 + eau libre 09-13.
 * Diplômes / autres = null → composeur.
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

  /** Grille 3 onglets (deb / crawl / 4 nages). */
  const byLevel = (debId, crawlId, fourId) => {
    if (isDeb) return debId;
    if (four || isAv) return fourId;
    return crawlId;
  };

  /** Grille 2 onglets (pas de feuille débutant) : débutant → crawl. */
  const byLevelNoDeb = (crawlId, fourId) => {
    if (four || isAv) return fourId;
    return crawlId;
  };

  if (isXsSprintGoal(goal)) {
    return byLevel("04 XS-Sprint deb crawl", "05 XS-Sprint crawl", "06 XS-Sprint 4 nages");
  }

  if (isOlyHalfFullGoal(goal)) {
    return byLevelNoDeb("07 Oly-Half-Full crawl", "08 Oly-Half-Full 4 nages");
  }

  if (isOpenWaterGoal(goal)) {
    const band = eventBandFromGoal(goal);
    // Courte = short ; moyenne + longue = moy-long. Bande inconnue → courte (safe).
    if (band === "mid" || band === "long") {
      return byLevelNoDeb("12 OW moy-long crawl", "13 OW moy-long 4 nages");
    }
    return byLevel("09 OW courte deb crawl", "10 OW courte crawl", "11 OW courte 4 nages");
  }

  if (!isNager) return null;

  return byLevel("01 Nager deb crawl", "02 Nager crawl", "03 Nager 4 nages");
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
  // Legacy : préférer resolveSheetWeekRole (calendrier S0 / cycle).
  // Conservé pour compat tests / appels anciens, curseur 0/1 ≠ produit Arthur.
  const c = Math.max(0, Number(cursor) || 0);
  if (c === 0) return "test";
  if (c === 1) return "deload";
  return "construction";
}

export function isEventFamilyId(familyId) {
  const id = String(familyId || "");
  return /XS-Sprint|Oly-Half-Full|OW /i.test(id);
}
