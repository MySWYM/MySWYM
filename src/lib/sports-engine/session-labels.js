/**
 * Libellés séance affichés au nageur.
 * N'altère pas la charge, les zones internes, ni le calcul d'allure :
 * uniquement le texte généré / restitué.
 */

const GENERIC_THEME_RE =
  /^(respiration|technique|roulis|appuis|éducatifs?|educatifs?|nage appliqu[ée]e|rotation(?: du corps)?|roulis\s*\/\s*rotation du corps)$/i;

const EDUC_OR_SWIM_RE =
  /rattrap|flèche|fleche|grand chien|petit chien|battement|godille|3T|5T|7T|un bras|planche|expir|côté habituel|cote habituel|glisse|coulée|coulee|doigts|crawl|dos|brasse|papillon|ondulation|souple|facile|tuba|palmes|bilatéral|à bloc|relâché|apnée|apnee/i;

const INTENSITY_WORD_RE = /^(Z[1-4]|facile|très facile|confortable|soutenu|rapide)$/i;

/**
 * @param {string} [focusKey]
 * @returns {string}
 */
export function explicitEducatifLabel(focusKey) {
  switch (String(focusKey || "").toLowerCase()) {
    case "technique_respiration":
    case "respiration":
      return "crawl en expirant continûment dans l'eau";
    case "technique_roulis":
    case "roulis":
      return "battements sur le côté";
    case "technique_catchup":
    case "rattrape":
    case "rattrapé":
      return "crawl rattrapé";
    case "technique_jambes":
    case "jambes":
      return "battements crawl";
    case "technique_chiens":
    case "technique_grand_chien":
    case "chiens":
    case "chien":
      return "grand chien";
    case "technique_fleche":
    case "flèche":
    case "fleche":
      return "flèche";
    case "technique_virages":
    case "virages":
      return "coulée après virage";
    case "technique_croisement":
    case "croisement":
      return "crawl, entrée de main dans l'axe";
    default:
      return "";
  }
}

export function fallbackNamedSwimLabel() {
  return "crawl facile, respiration sur le côté habituel";
}

function zoneWord(raw) {
  const z = String(raw || "");
  if (/Z1|très\s*facile/i.test(z)) return "facile";
  if (/Z2|confortable/i.test(z)) return "confortable";
  if (/Z3|soutenu/i.test(z)) return "soutenu";
  if (/Z4|rapide/i.test(z)) return "rapide";
  if (/facile/i.test(z)) return "facile";
  return "confortable";
}

function formatPaceSide(token) {
  const m = String(token || "").match(/(\d+):(\d{2})/);
  if (!m) return String(token || "").replace(/^0+/, "") || token;
  const min = parseInt(m[1], 10);
  const sec = parseInt(m[2], 10);
  if (min <= 0) return `${sec} s`;
  const secTxt = String(sec).padStart(2, "0");
  return `${min} min ${secTxt} s`;
}

function humanPaceRange(word, lo, hi) {
  const a = formatPaceSide(lo);
  const b = formatPaceSide(hi);
  const bothSec = / s$/.test(a) && / s$/.test(b);
  if (bothSec) {
    return `${word} entre ${a.replace(/ s$/, "")} et ${b}`;
  }
  return `${word} entre ${a} et ${b}`;
}

function stripIntensityParensAndCodes(text) {
  let out = String(text || "");

  // Jargon débutant : (facile @1:42-1:48) → « facile, entre … » (sans @)
  out = out.replace(
    /\(\s*(facile|très facile|confortable|soutenu|rapide)(?:\s*—\s*souple)?\s*@\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\s*\)/gi,
    (_, word, lo, hi) => humanPaceRange(zoneWord(word), lo, hi),
  );

  // Codes bruts : (facile @2), @2, @3 — pas les allures Premium (Z2 @1:42-1:48)
  out = out.replace(/\(\s*(facile|très facile|confortable|soutenu|rapide|Z[1-4])\s*@[1-5]\s*\)/gi, "");
  out = out.replace(/(^|[\s,;:(—–-])@([1-5])(?!\d|:)/g, "$1");
  out = out.replace(/\(\s*facile\s*@[^)]*\)/gi, "");
  out = out.replace(/\(\s*facile\s*\)/gi, "");

  return out;
}

/** Découverte / wording simplifié : zones → français, allures sans `@`. */
export function humanizeBeginnerZoneTags(text) {
  let out = String(text || "");
  out = out.replace(
    /\(\s*Z1\s*@\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\s*\)/gi,
    (_, lo, hi) => humanPaceRange("facile", lo, hi),
  );
  out = out.replace(
    /\(\s*Z2\s*@\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\s*\)/gi,
    (_, lo, hi) => humanPaceRange("confortable", lo, hi),
  );
  out = out.replace(
    /\(\s*Z3\s*@\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\s*\)/gi,
    (_, lo, hi) => humanPaceRange("soutenu", lo, hi),
  );
  out = out.replace(
    /\(\s*Z4\s*@\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\s*\)/gi,
    (_, lo, hi) => humanPaceRange("rapide", lo, hi),
  );
  out = out.replace(/\(Z1 souple\)/gi, "(facile)");
  out = out.replace(/\(Z1\)/g, "(facile)");
  out = out.replace(/\(Z2\)/g, "");
  out = out.replace(/\(Z3\)/g, "");
  out = out.replace(/\(Z4\)/g, "");
  return out;
}

/**
 * Règle Arthur D9 — texte affiché nageur : jamais `souple` ni `Z1`.
 * Remplacements concrets selon le contexte ; ne change pas volumes ni sélection de blocs.
 */
export function humanizeArthurDisplayTerms(text) {
  let out = String(text || "");
  if (!out) return out;

  out = out.replace(/\bZ1\s*\/\s*Z2\b/gi, "facile / confortable");
  out = out.replace(/\bZ1\s*-\s*Z2\b/gi, "facile - confortable");
  out = out.replace(/\(Z1\s*souple\)/gi, "(facile)");
  out = out.replace(/\(Z1\)/gi, "(facile)");

  out = out.replace(/—\s*Z1\b/gi, (match, offset, full) => {
    const head = String(full).slice(Math.max(0, offset - 100), offset).toLowerCase();
    if (/échauff|mise en route|d[ée]part/i.test(head)) return "— mise en route";
    if (/récup|rac|au choix|lent|retour|très facile/i.test(head)) return "— retour au calme";
    const lineStart = String(full).slice(0, offset);
    if (/^[\s\-–—]*\d+\s*m\b/i.test(lineStart.trim()) && !/[×x]\s*\d/i.test(lineStart)) {
      return "— retour au calme";
    }
    return "— facile";
  });
  out = out.replace(/\bZ1\b/g, "facile");

  out = out.replace(/\bcrawl\s+souple\b/gi, "crawl facile");
  out = out.replace(/\bdos\s+souple\b/gi, "dos facile");
  out = out.replace(/\bbrasse\s+souple\b/gi, "brasse facile");
  out = out.replace(/\bmixte\s+crawl\/dos\s+souple\b/gi, "mixte crawl/dos facile");
  out = out.replace(/\bcrawl\s*\/\s*dos\s+souple\b/gi, "crawl / dos facile");
  out = out.replace(/\bdos\s*\/\s*crawl\s+souple\b/gi, "dos / crawl facile");
  out = out.replace(/\bbattements?\s+souples?\b/gi, "battements sans forcer");
  out = out.replace(/\bjambes?\s+souples?\b/gi, "jambes sans forcer");
  out = out.replace(/\bmouvements?\s+souples?\b/gi, "mouvements sans forcer");
  out = out.replace(/\btrès\s+souple\b/gi, "très facile");
  out = out.replace(/—\s*souple\b/gi, "— sans forcer");
  out = out.replace(/\bsouple\s*—/gi, "facile —");
  out = out.replace(/\bsouple\b/gi, "facile");

  // Pas de sighting / économie affichés (triathlon / eau libre).
  out = out.replace(/\s*[—,-]\s*sighting\s*\+\s*allure régulière/gi, "");
  out = out.replace(/\s*[—,-]\s*économie d['’]énergie(?:\s*[—-]\s*allure (?:régulière|tenable))?/gi, "");
  out = out.replace(/\s*[—,-]\s*focus économie\b/gi, "");
  out = out.replace(/\béconomie d['’]énergie\b/gi, "");
  out = out.replace(/\béconomie de nage\b/gi, "qualité de nage");
  out = out.replace(/\bsighting\s+tous les \d+(?:\s*[–\-]\s*\d+)?\s*bras\b/gi, "");
  out = out.replace(/\bsighting\s+toutes les \d+\s*coups\b/gi, "");
  out = out.replace(/\bvisée\s+toutes les \d+\s*coups(?:\s*\(\s*sighting\s*\))?/gi, "");
  out = out.replace(/\bsighting\s+(?:régulier|immédiat|fréquent)\b/gi, "");
  out = out.replace(/\balternance\s+sighting\s*\/\s*technique\b/gi, "allure régulière");
  out = out.replace(/\bcrawl\s+sighting\b/gi, "crawl");
  out = out.replace(/\borientation\s*\/\s*sighting\b/gi, "aérobie régulier");
  out = out.replace(/\bsighting\b/gi, "");
  out = out.replace(/\s{2,}/g, " ");
  out = out.replace(/\s+—\s+—/g, " —");
  out = out.replace(/\s+—\s*$/g, "");

  return out;
}

function humanizeEquipmentPhrase(text) {
  let out = String(text || "");
  out = out.replace(/\bpalmes\s*\+\s*tuba(?:\s+frontal)?\b/gi, "palmes et tuba frontal");
  out = out.replace(
    /\b(crawl|dos|brasse|nage|mixte|au choix)\s+(?=palmes|tuba|planche|pull)/gi,
    "$1 avec ",
  );
  out = out.replace(/\bavec\s+avec\s+/gi, "avec ");
  return out;
}

function formatDistanceTokens(text) {
  let out = String(text || "");
  out = out.replace(/(\d+)\s*[x×]\s*(\d+)\s*m\b/gi, "$1 × $2 m");
  out = out.replace(/(\d+)\s*m\b/gi, "$1 m");
  return out;
}

function tidySpaces(text) {
  return String(text || "")
    .replace(/\s*—\s*—\s*/g, " — ")
    .replace(/(\d+)min\b/gi, "$1 min")
    .replace(/(\d+)\s*min(\d+)\s*s/gi, "$1 min $2 s")
    .replace(/(min)\s+(confortable|soutenu|facile|rapide)\b/gi, "$1, $2")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,;])/g, "$1")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s+$/g, "")
    .replace(/^\s+/g, "")
    .trim();
}

function coreAfterVolume(text) {
  let t = String(text || "")
    .replace(/^[\s\-–—]+/, "")
    .replace(/\s*[:.]\s*$/, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s*—\s*.*$/, "")
    .replace(/\bavec\s+(?:palmes|tuba|planche|pull|plaquette).*$/i, "")
    .replace(/\bpalmes\b.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  t = t.replace(/^\d+\s*[x×]\s*\d+\s*m?\s*/i, "").trim();
  t = t.replace(/^\d+\s*m\s+/i, "").trim();
  t = t.replace(/^:\s*/, "").trim();
  return t;
}

/** Titre = volume + thème générique uniquement (ex. `600 m respiration`). */
export function isVagueVolumeThemeTitle(text) {
  const core = coreAfterVolume(text);
  if (!core) return false;
  if (!/(\d+\s*[x×]\s*\d+|\d+\s*m\b)/i.test(String(text))) return false;
  return GENERIC_THEME_RE.test(core);
}

export function hasEducatifOrConcreteSwim(text) {
  const t = String(text || "");
  if (!t.trim()) return false;
  if (isVagueVolumeThemeTitle(t)) return false;
  return EDUC_OR_SWIM_RE.test(t);
}

/** `@2` / `@3` / `facile @` en codes d'intensité — pas `@mm:ss` d'allure. */
export function containsForbiddenIntensityCode(text) {
  const t = String(text || "");
  if (/facile\s@/i.test(t)) return true;
  if (/(^|[^\d:])@2(?!\d|:)/.test(t)) return true;
  if (/(^|[^\d:])@3(?!\d|:)/.test(t)) return true;
  return false;
}

export function parseVolumeFromTitle(text) {
  const t = String(text || "");
  const nx = t.match(/(\d+)\s*[x×]\s*(\d+)\s*m/i);
  if (nx) return Number(nx[1]) * Number(nx[2]);
  const xm = t.match(/(\d+)\s*m\b/i);
  return xm ? Number(xm[1]) : 0;
}

function themeKeyFromTitle(text) {
  const core = coreAfterVolume(text);
  if (/respir/i.test(core)) return "respiration";
  if (/roulis|rotation/i.test(core)) return "roulis";
  if (/appuis?/i.test(core)) return "appuis";
  if (/rattrap/i.test(core)) return "rattrape";
  if (/jambes|battement/i.test(core)) return "jambes";
  if (/technique/i.test(core)) return "";
  return core;
}

export function fallbackNamedSwimLine(source) {
  const t = String(source ?? "");
  const nx = t.match(/(\d+)\s*[x×]\s*(\d+)/i);
  if (nx) {
    return `-${nx[1]} × ${nx[2]}m ${fallbackNamedSwimLabel()}`;
  }
  const vol = typeof source === "number" ? source : parseVolumeFromTitle(t);
  const unit = 50;
  const reps = Math.max(2, Math.round((vol || 200) / unit));
  return `-${reps} × ${unit}m ${fallbackNamedSwimLabel()}`;
}

export function explicitTechSetLine({ reps, unit, focusKey, theme } = {}) {
  const n = Math.max(2, Number(reps) || 4);
  const u = Number(unit) || 50;
  const educatif = explicitEducatifLabel(focusKey) || explicitEducatifLabel(theme);
  if (!educatif) {
    return `-${n} × ${u}m ${fallbackNamedSwimLabel()}`;
  }
  return `-${n} × ${u}m : ${educatif} + crawl facile`;
}

function rewriteVagueLine(text) {
  const dash = /^\s*-/.test(text) ? "-" : "-";
  const nx = String(text).match(/(\d+)\s*[x×]\s*(\d+)/i);
  const educatif = explicitEducatifLabel(themeKeyFromTitle(text));
  if (nx) {
    if (educatif) return `${dash}${nx[1]} × ${nx[2]}m : ${educatif} + crawl facile`;
    return `${dash}${nx[1]} × ${nx[2]}m ${fallbackNamedSwimLabel()}`;
  }
  if (educatif) {
    const vol = parseVolumeFromTitle(text) || 200;
    const unit = 50;
    const reps = Math.max(2, Math.round(vol / unit));
    return `${dash}${reps} × ${unit}m : ${educatif} + crawl facile`;
  }
  return fallbackNamedSwimLine(text);
}

function splitIndentAndBullet(text) {
  const raw = String(text ?? "");
  const indent = raw.match(/^\s*/)?.[0] || "";
  const trimmed = raw.trim();
  const bullet = trimmed.match(/^[-–—]\s*/)?.[0] ? "-" : "";
  const body = bullet ? trimmed.replace(/^[-–—]\s*/, "") : trimmed;
  return { indent, bullet, body };
}

/**
 * Nettoyage volume-safe (pas de 25 m parasitant le total).
 */
export function sanitizeSessionDetailLine(text) {
  if (text == null || text === "") return text;
  const { indent, bullet, body } = splitIndentAndBullet(text);
  let out = stripIntensityParensAndCodes(body);
  out = humanizeEquipmentPhrase(out);
  out = formatDistanceTokens(out);
  out = humanizeArthurDisplayTerms(out);
  out = tidySpaces(out);
  let line = `${indent}${bullet}${out}`;

  if (isVagueVolumeThemeTitle(line)) {
    const rewritten = rewriteVagueLine(line);
    if (rewritten !== line) return sanitizeSessionDetailLine(rewritten);
  }
  return line;
}

/**
 * Affichage nageur : sanitizer + splits 50 m lisibles (`25 m A + 25 m B`).
 * À n'utiliser que pour l'UI / tests de rendu — pas pour le calcul de volume.
 */
export function prettifySessionDetailLine(text) {
  let out = sanitizeSessionDetailLine(text);
  out = out.replace(
    /(\d+)\s*[×x]\s*(50|100)\s*m\s*:\s*([^—\n]+)/gi,
    (full, n, unit, rest) => {
      if (/\d+\s*m\b/i.test(rest)) return full;
      const parts = rest.split(/\s*\+\s*/).map((p) => p.trim()).filter(Boolean);
      if (parts.length !== 2) return full;
      if (String(unit) === "50") return `${n} × 50 m : 25 m ${parts[0]} + 25 m ${parts[1]}`;
      return `${n} × 100 m : 25 m ${parts[0]} + 75 m ${parts[1]}`;
    },
  );
  return tidySpaces(out);
}

export function rewriteVagueTechniqueDetails(details = []) {
  const out = [];
  const lines = details.map((d) => String(d ?? ""));
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    if (!isVagueVolumeThemeTitle(raw)) {
      out.push(raw);
      continue;
    }
    const next = lines[i + 1];
    if (next && hasEducatifOrConcreteSwim(next) && !isVagueVolumeThemeTitle(next)) {
      continue;
    }
    out.push(rewriteVagueLine(raw));
  }
  return out;
}

export function sanitizeSessionDetails(details = [], { display = false } = {}) {
  const rewritten = rewriteVagueTechniqueDetails(details);
  const fn = display ? prettifySessionDetailLine : sanitizeSessionDetailLine;
  return rewritten.map((line) => fn(line));
}

export function assertDisplayLabelsClean(details = []) {
  const shown = sanitizeSessionDetails(details, { display: true });
  const bad = [];
  for (const line of shown) {
    if (containsForbiddenIntensityCode(line)) bad.push(`intensity:${line}`);
    if (isVagueVolumeThemeTitle(line)) bad.push(`vague:${line}`);
    if (/\bsouple\b/i.test(line)) bad.push(`souple:${line}`);
    if (/\bZ1\b/.test(line)) bad.push(`Z1:${line}`);
  }
  const techish = shown.filter(
    (l) =>
      /^\s*-?\s*\d/.test(l) &&
      /technique|respir|roulis|appuis|rattrap|flèche|chien|battement|éducatif|educatif/i.test(l),
  );
  for (const line of techish) {
    if (!hasEducatifOrConcreteSwim(line)) bad.push(`empty-tech:${line}`);
  }
  return { ok: bad.length === 0, bad, lines: shown };
}

/** Cue nage appliquée : jamais un thème vide. */
export function concreteApplyCue(applyCue, swimLabel = "crawl") {
  const cue = String(applyCue || "").trim();
  const swim = String(swimLabel || "crawl").replace(/\s+facile$/i, "") || "crawl";
  if (!cue || GENERIC_THEME_RE.test(cue) || /^nage appliquée$/i.test(cue) || /^applique\b/i.test(cue)) {
    return `${swim} facile, respiration sur le côté habituel`;
  }
  return cue;
}

export function concreteTechLabel(label, focusKey) {
  const raw = String(label || "").trim();
  if (!raw || GENERIC_THEME_RE.test(raw) || INTENSITY_WORD_RE.test(raw)) {
    return explicitEducatifLabel(focusKey) || fallbackNamedSwimLabel();
  }
  if (isVagueVolumeThemeTitle(`50m ${raw}`)) {
    return explicitEducatifLabel(focusKey) || explicitEducatifLabel(raw) || fallbackNamedSwimLabel();
  }
  return raw;
}
