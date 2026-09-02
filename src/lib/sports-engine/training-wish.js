/**
 * Demande libre onboarding, parsing déterministe (pas de LLM).
 * Soft preference pour le composeur / rôles ; stockage exploitable plus tard.
 */

const STROKE_PATTERNS = [
  { id: "crawl", re: /\bcrawl\b|\bnl\b|nage\s*libre/i },
  { id: "dos", re: /\bdos\b|backstroke/i },
  { id: "brasse", re: /\bbrasse\b|breaststroke/i },
  { id: "papillon", re: /\bpapillon\b|\bfly\b/i },
  { id: "4n", re: /\b4\s*nages?\b|quatre\s*nages|m[eé]dley|\bim\b/i },
];

const EQUIPMENT_PATTERNS = [
  { id: "palmes", re: /\bpalmes?\b|fins?\b/i },
  { id: "tuba", re: /\btuba\b|snorkel/i },
  { id: "pull", re: /\bpull(?:-|\s*)?buoy\b|\bpull\b/i },
  { id: "plaquettes_doigts", re: /finger\s*paddles?|plaquettes?\s*doigts|palettes?\s*digitales/i },
  { id: "plaquettes", re: /\bplaquettes?\b|\bpaddles?\b/i },
  { id: "planche", re: /\bplanche\b|kickboard/i },
  { id: "elastique", re: /\b[eé]lastique\b|ankle\s*band/i },
];

const INTENT_PATTERNS = [
  { id: "seuil", re: /\bseuil\b|threshold|css|allure\s*course|race\s*pace/i },
  { id: "vitesse", re: /\bvitesse\b|sprint|rapide|explos/i },
  { id: "endurance", re: /\bendurance\b|foncier|a[eé]robie|volume|longue?\s*distance/i },
  { id: "technique", re: /\btechnique\b|[eé]ducatif|drill|geste|virages?|coul[eé]es?|rattrap[eé]|roulis|godilles?/i },
  { id: "recuperation", re: /\br[eé]cup(?:[eé]ration)?\b|souple|facile|recovery/i },
  { id: "jambes", re: /\bjambes?\b|battements?|kick/i },
];

const TECH_PATTERNS = [
  { id: "virages", re: /\bvirages?\b|culbute|flip\s*turn/i },
  { id: "rattrape", re: /\brattrap[eé]\b|catch[- ]?up/i },
  { id: "roulis", re: /\broulis\b|rotation/i },
  { id: "coulée", re: /\bcoul[eé]es?\b|underwater|ondulation/i },
  { id: "jambes", re: /\bjambes?\b|battements?/i },
  { id: "respiration", re: /\brespiration\b|biphas|inspir/i },
];

const TAG_PATTERNS = [
  { id: "100m", re: /\b100\s*m\b|\bcent\s*m[eè]tres?\b/i },
  { id: "200m", re: /\b200\s*m\b/i },
  { id: "400m", re: /\b400\s*m\b/i },
  { id: "triathlon", re: /\btriathlon\b|ironman|half[- ]iron/i },
  { id: "eau_libre", re: /\beau\s*libre\b|open\s*water|oc[eé]an|lac\b/i },
  { id: "apnee", re: /\bapn[eé]e\b|hypoxie/i },
];

function matchIds(text, patterns) {
  const out = [];
  for (const p of patterns) {
    if (p.re.test(text)) out.push(p.id);
  }
  return out;
}

/**
 * Parse une demande libre → structure exploitable.
 * @returns {{ version: number, raw: string, tags: string[], strokes: string[], equipment: string[], intents: string[], techFocus: string[], createdAt: string|null }}
 */
export function parseTrainingWish(raw, { createdAt = null } = {}) {
  const text = String(raw || "").trim();
  const empty = {
    version: 1,
    raw: text,
    tags: [],
    strokes: [],
    equipment: [],
    intents: [],
    techFocus: [],
    createdAt,
  };
  if (!text) return empty;

  const strokes = matchIds(text, STROKE_PATTERNS);
  const equipment = matchIds(text, EQUIPMENT_PATTERNS).filter((id, _, list) => {
    if (id === "plaquettes" && list.includes("plaquettes_doigts")) return false;
    return true;
  });
  const intents = matchIds(text, INTENT_PATTERNS);
  const techFocus = matchIds(text, TECH_PATTERNS);
  const extraTags = matchIds(text, TAG_PATTERNS);

  const tags = [...new Set([...intents, ...strokes, ...equipment, ...techFocus, ...extraTags])];

  return {
    version: 1,
    raw: text.slice(0, 2000),
    tags,
    strokes,
    equipment,
    intents,
    techFocus,
    createdAt: createdAt || new Date().toISOString(),
  };
}

/**
 * Hints soft pour composeur / rôles, jamais hard override.
 */
export function trainingWishToHints(metaOrRaw, { equipmentOwned = null } = {}) {
  const meta =
    metaOrRaw && typeof metaOrRaw === "object" && !Array.isArray(metaOrRaw)
      ? metaOrRaw
      : parseTrainingWish(metaOrRaw);

  if (!meta?.raw && !(meta?.tags || []).length) {
    return {
      ready: false,
      preferStroke: null,
      preferFourN: false,
      preferEquipment: [],
      preferIntents: [],
      preferTech: [],
      tags: [],
    };
  }

  const owned = Array.isArray(equipmentOwned) ? equipmentOwned : null;
  let preferEquipment = Array.isArray(meta.equipment) ? [...meta.equipment] : [];
  if (owned) {
    preferEquipment = preferEquipment.filter((e) => owned.includes(e));
  }

  let preferStroke = null;
  if (meta.strokes?.includes("crawl")) preferStroke = "crawl";
  else if (meta.strokes?.includes("dos")) preferStroke = "dos";
  else if (meta.strokes?.includes("brasse")) preferStroke = "brasse";
  else if (meta.strokes?.includes("papillon")) preferStroke = "papillon";

  const preferFourN = !!meta.strokes?.includes("4n");

  return {
    ready: true,
    preferStroke,
    preferFourN,
    preferEquipment,
    preferIntents: meta.intents || [],
    preferTech: meta.techFocus || [],
    tags: meta.tags || [],
    raw: meta.raw || "",
  };
}

/**
 * Biais léger des rôles semaine (intensité / famille) selon wish.
 */
export function biasRolesForTrainingWish(roles, hints) {
  if (!hints?.ready || !Array.isArray(roles)) return roles;
  return roles.map((role, idx) => {
    if (!role) return role;
    let next = { ...role };
    const intents = hints.preferIntents || [];

    if (intents.includes("recuperation") && idx === roles.length - 1) {
      next.sessionIntent = next.sessionIntent || "recuperation";
      next.intensityTarget = "Z1";
    }
    if (intents.includes("seuil") && (role.qualitySession || idx === 1)) {
      next.sessionIntent = next.sessionIntent === "recuperation" ? next.sessionIntent : "seuil";
      if (next.intensityTarget === "Z1" || next.intensityTarget === "Z2") next.intensityTarget = "Z3";
    }
    if (intents.includes("vitesse") && role.qualitySession) {
      next.sessionIntent = "vitesse";
    }
    if (intents.includes("technique") && !role.qualitySession) {
      next.sessionIntent = next.sessionIntent || "technique_endurance";
      next.family = next.family || "technique";
    }
    if (hints.preferFourN && !role.qualitySession) {
      next.strokeFocus = "4n";
      next.sessionSpecificity = next.sessionSpecificity || "stroke_focus";
    }
    return next;
  });
}

/**
 * Applique un soft stroke bias sur un brief (si compatible).
 */
export function applyWishStrokeToBrief(brief, hints) {
  if (!hints?.ready || !brief) return brief;
  const level = brief.level || "";
  if (hints.preferFourN && level !== "decouverte") {
    return { ...brief, strokeFocus: "4n" };
  }
  if (hints.preferStroke === "crawl") {
    return { ...brief, strokeFocus: "crawl" };
  }
  if (hints.preferStroke === "dos" || hints.preferStroke === "brasse") {
    // Mixte avec dominante demandée, le composeur lit strokeFocus crawl/mixte/4n
    return { ...brief, strokeFocus: "mixte", preferredStroke: hints.preferStroke };
  }
  return brief;
}
