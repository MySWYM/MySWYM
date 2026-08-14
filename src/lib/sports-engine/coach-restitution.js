/**
 * Restitution coach — transforme les détails générés en fiche séance nageable.
 * Ne touche PAS au volume/charge/taper : uniquement wording + décomposition affichage.
 */

const HEADLINE_RE = /^\s*(?:→\s*)?(?:Aujourd'?hui\s*:|La séance du jour|Le but de cette séance)/i;
const ENGINE_SECTION_RE =
  /^\s*(Préparation aérobie|Bloc vitesse|Consolidation aérobie|Touches allure course|Technique\s*[·•]|Étape\s*\d)\s*:?\s*$/i;
const MARKETING_FIN_RE = /on savoure|on souffle un bon coup|recherche de sensation/i;
const OPAQUE_PYRAMID_RE =
  /^[\s\-–—]*(\d+)\s*m\s+pyramide\b(?:[^:\n]*:\s*)?(\d+(?:\s*→\s*\d+)+)?(?:[^—\n]*)?(?:—\s*)?(.*)$/i;
const OPAQUE_PYRAMID_LEGACY_RE =
  /^[\s\-–—]*(\d+)\s*m\s+pyramide\b.*(?:montée|descente|sommet)/i;
const REPOS_VARIABLE_RE = /repos\s+variable/i;
const TECH_HEADER_RE = /^[\s\-–—]*Technique\s*[·•]/i;

/**
 * Extrait paliers d'une ligne pyramide type `100 → 200 → 300 → 200 → 100`.
 */
export function parsePyramidStepsFromLine(line) {
  const text = String(line || "");
  const arrow = text.match(/(\d+(?:\s*→\s*\d+)+)/);
  if (!arrow) return null;
  const steps = arrow[1]
    .split(/\s*→\s*/)
    .map((n) => parseInt(n, 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  return steps.length >= 3 ? steps : null;
}

function restFromLine(line, fallback = 20) {
  const m = String(line || "").match(/repos\s+(\d+)\s*s/i);
  if (m) return parseInt(m[1], 10);
  if (REPOS_VARIABLE_RE.test(line)) return fallback;
  return fallback;
}

function labelFromPyramidLine(line) {
  const m = String(line || "").match(/pyramide\s+([a-zàâäéèêëïîôùûüç\s/-]+?)(?:\s*:|\s*—|\s*\(|$)/i);
  return (m?.[1] || "crawl").trim() || "crawl";
}

/**
 * Décompose une pyramide opaque / semi-opaque en lignes nageables.
 */
export function expandPyramidDetailLine(line) {
  const text = String(line || "").trim();
  if (!/pyramide/i.test(text)) return null;

  const steps = parsePyramidStepsFromLine(text);
  const rest = restFromLine(text, 20);
  const label = labelFromPyramidLine(text);

  if (steps?.length) {
    return steps.map((d) => `-${d}m ${label} — repos ${rest}s`);
  }

  // Legacy opaque sans paliers : convertir en séries classiques nageables
  // (ne pas inventer une fausse pyramide 100→…→100 pour du volume arbitraire)
  if (OPAQUE_PYRAMID_LEGACY_RE.test(text) || /\d+\s*m\s+pyramide\b/i.test(text)) {
    const volMatch = text.match(/(\d+)\s*m/);
    const vol = volMatch ? parseInt(volMatch[1], 10) : 0;
    if (vol >= 100) {
      const unit = vol >= 1600 ? 200 : vol >= 800 ? 100 : 50;
      const reps = Math.max(2, Math.min(12, Math.floor(vol / unit)));
      const used = reps * unit;
      const lines = [`-${reps} × ${unit}m ${label} — repos ${rest}s`];
      const rem = vol - used;
      if (rem >= 50) {
        lines.push(`-${rem}m ${label} souple — repos ${rest}s`);
      }
      return lines;
    }
  }
  return null;
}

function cleanCueNoise(line) {
  let out = String(line || "");
  // Doublons d'allure / intensité marketing
  out = out.replace(/\s*—\s*applique en Z\d\b/gi, "");
  out = out.replace(/\s*—\s*applique\b[^—]*/gi, "");
  out = out.replace(/\s*—\s*nage tranquillement\b[^—]*/gi, "");
  out = out.replace(/\s*—\s*allure facile\b/gi, "");
  out = out.replace(/\s*—\s*du facile vers le soutenu\b/gi, "");
  out = out.replace(/\s*—\s*du long vers le court\b/gi, "");
  out = out.replace(/\s+progressif\b/gi, "");
  out = out.replace(/\s+descendant\b/gi, "");
  out = out.replace(REPOS_VARIABLE_RE, "repos 20s");
  out = out.replace(/\s*—\s*montée\s*\/\s*descente[^—]*/gi, "");
  out = out.replace(/\s{2,}/g, " ").replace(/\s+—\s+—/g, " — ").trim();
  return out;
}

function rewriteFinLine(line) {
  let out = String(line || "");
  if (MARKETING_FIN_RE.test(out)) {
    out = out.replace(/,?\s*on savoure la fin de séance/gi, " — souple");
    out = out.replace(/,?\s*on souffle un bon coup à l'arrivée/gi, " — souple");
    out = out.replace(/,?\s*recherche de sensation/gi, " — souple");
  }
  out = out.replace(/\(RAC\)/gi, "— Z1");
  out = out.replace(/\bRAC\b/gi, "souple");
  return out;
}

/**
 * Transforme details[] → fiche coach (ordre conservé, volume non inventé).
 * @returns {string[]}
 */
export function toCoachDetailLines(details = []) {
  const out = [];
  for (const raw of details) {
    const line = String(raw ?? "").trim();
    if (!line) continue;
    if (HEADLINE_RE.test(line)) continue;
    if (ENGINE_SECTION_RE.test(line)) continue;
    if (TECH_HEADER_RE.test(line) && /:\s*$/.test(line)) continue;

    const expanded = expandPyramidDetailLine(line);
    if (expanded) {
      out.push(...expanded);
      continue;
    }

    // Lignes indentées technique `· NxM` → lignes séance standard
    let next = line;
    if (/^\s*·\s*/.test(next)) {
      next = next.replace(/^\s*·\s*/, "-");
    }

    next = rewriteFinLine(next);
    next = cleanCueNoise(next);
    // Matos sur ligne nageable : `crawl · pull-buoy` → `crawl avec pull-buoy`
    next = next.replace(
      /\s*[·•]\s*(palmes(?:\s*\+\s*tuba(?:\s+frontal)?)?|tuba(?:\s+frontal)?|pull-buoy|pull\b|plaquettes?|planche|élastique)/gi,
      " avec $1",
    );

    // Drop empty remnants
    if (!next || next === "-" || /^-\s*$/.test(next)) continue;
    // Drop orphan labels without distance
    if (!/\d/.test(next) && !/souple|récup|facile/i.test(next)) continue;

    out.push(next);
  }
  return out;
}

/**
 * Applique la restitution coach sur une séance (details uniquement).
 */
export function finalizeCoachSession(session) {
  if (!session || !Array.isArray(session.details)) return session;
  const details = toCoachDetailLines(session.details);
  return {
    ...session,
    details,
  };
}

/**
 * Heuristique tests : ligne ambiguë / non nageable.
 */
export function findAmbiguousCoachLines(details = []) {
  const bad = [];
  for (const line of details) {
    const t = String(line);
    if (HEADLINE_RE.test(t)) bad.push(`headline:${t}`);
    if (/repos\s+variable/i.test(t)) bad.push(`repos_variable:${t}`);
    if (/\d+m\s+pyramide\b/i.test(t) && !/→/.test(t)) bad.push(`opaque_pyramid:${t}`);
    if (/on savoure|Aujourd'?hui\s*:/i.test(t)) bad.push(`marketing:${t}`);
    if (/Préparation aérobie|Bloc vitesse|Consolidation aérobie/i.test(t)) bad.push(`engine_section:${t}`);
  }
  return bad;
}
