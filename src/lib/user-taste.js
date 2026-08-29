/**
 * Profil de goûts client, apprentissage progressif à partir des retours
 * (rating + tags + commentaire), façon scores d'intérêt Meta/Instagram.
 *
 * Deterministe, pas de LLM. Les scores alimentent le générateur (volume,
 * intensité, éducatifs, clarté, types de séance) et sont persistés Supabase.
 */

export const TASTE_VERSION = 1;

const TYPE_KEYS = ["ENDURANCE", "SEUIL", "VITESSE", "TECHNIQUE", "RÉCUPÉRATION", "BNSSA"];

const TAG_DELTAS = {
  "trop long": { volume: -0.28 },
  "trop court": { volume: 0.28 },
  "trop intensif": { intensity: -0.32 },
  "éducatifs top": { educatif: 0.35, typeBoost: { TECHNIQUE: 0.22 } },
  "incompréhensible": { clarity: 0.4, educatif: -0.12 },
  "j'ai adoré": { enjoyment: 0.3 },
};

const POSITIVE_WORDS = [
  "adore", "adoré", "adorée", "aime", "aimé", "top", "génial", "super", "motiv",
  "cool", "fun", "plaisir", "parfait", "excellent", "kiff", "bien",
];
const NEGATIVE_WORDS = [
  "trop", "dur", "dure", "long", "longue", "galère", "chiant", "perdu", "perdue",
  "comprends", "incompréhensible", "intense", "fatigué", "fatigue", "ennui", "lourd",
];
const COLOR_WORDS = [
  "bleu", "bleue", "rose", "rouge", "vert", "verte", "noir", "noire", "blanc", "blanche",
  "orange", "violet", "violette", "jaune", "turquoise", "cyan", "corail", "marine",
];
const STYLE_WORDS = [
  "technique", "jambes", "vitesse", "endurance", "seuil", "palmes", "crawl", "dos",
  "brasse", "papillon", "éducatif", "éducatifs", "sprint", "récup", "récupération",
];

const clamp = (v, lo = -1, hi = 1) => Math.min(hi, Math.max(lo, v));
const clamp01 = (v) => clamp(v, 0, 1);

/** EMA : α plus élevé = réaction plus vive aux derniers retours. */
const ema = (prev, signal, alpha = 0.35) => prev * (1 - alpha) + signal * alpha;

export function blankTaste() {
  const types = {};
  for (const k of TYPE_KEYS) types[k] = 0;
  return {
    version: TASTE_VERSION,
    volume: 0,
    intensity: 0,
    educatif: 0,
    clarity: 0,
    enjoyment: 0,
    types,
    keywords: [],
    colors: [],
    styles: [],
    sampleCount: 0,
    updatedAt: null,
  };
}

export function normalizeTaste(raw) {
  const base = blankTaste();
  if (!raw || typeof raw !== "object") return base;
  const types = { ...base.types };
  if (raw.types && typeof raw.types === "object") {
    for (const k of TYPE_KEYS) {
      if (typeof raw.types[k] === "number") types[k] = clamp(raw.types[k]);
    }
  }
  return {
    version: TASTE_VERSION,
    volume: clamp(Number(raw.volume) || 0),
    intensity: clamp(Number(raw.intensity) || 0),
    educatif: clamp(Number(raw.educatif) || 0),
    clarity: clamp01(Number(raw.clarity) || 0),
    enjoyment: clamp01(Number(raw.enjoyment) || 0),
    types,
    keywords: Array.isArray(raw.keywords) ? raw.keywords.slice(0, 24) : [],
    colors: Array.isArray(raw.colors) ? raw.colors.slice(0, 12) : [],
    styles: Array.isArray(raw.styles) ? raw.styles.slice(0, 16) : [],
    sampleCount: Math.max(0, Number(raw.sampleCount) || 0),
    updatedAt: raw.updatedAt || null,
  };
}

function pushUnique(list, items, max) {
  const out = [...list];
  for (const item of items) {
    const t = String(item || "").toLowerCase().trim();
    if (!t || out.includes(t)) continue;
    out.unshift(t);
  }
  return out.slice(0, max);
}

function extractFromComment(comment) {
  if (!comment || typeof comment !== "string") {
    return { keywords: [], colors: [], styles: [], sentiment: 0 };
  }
  const lower = comment.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  const tokens = lower.split(/[^a-zàâäéèêëïîôùûüç0-9]+/i).filter(Boolean);
  const keywords = [];
  let sentiment = 0;
  for (const t of tokens) {
    const bare = t.normalize("NFD").replace(/\p{M}/gu, "");
    if (POSITIVE_WORDS.some((w) => bare.includes(w.normalize("NFD").replace(/\p{M}/gu, "")))) {
      sentiment += 0.15;
      keywords.push(t);
    }
    if (NEGATIVE_WORDS.some((w) => bare.includes(w.normalize("NFD").replace(/\p{M}/gu, "")))) {
      sentiment -= 0.12;
      keywords.push(t);
    }
  }
  const colors = COLOR_WORDS.filter((c) => lower.includes(c));
  const styles = STYLE_WORDS.filter((s) => lower.includes(s));
  return {
    keywords: keywords.slice(0, 8),
    colors,
    styles,
    sentiment: clamp(sentiment),
  };
}

/**
 * Intègre un retour séance dans le profil de goûts.
 * @param {object} prevTaste
 * @param {{ rating: string, tags?: string[], comment?: string|null, sessionType?: string|null }} feedback
 */
export function applySessionFeedbackToTaste(prevTaste, feedback) {
  const taste = normalizeTaste(prevTaste);
  const { rating, tags = [], comment = null, sessionType = null } = feedback || {};
  const alpha = taste.sampleCount < 3 ? 0.5 : 0.32;

  // Rating → volume / intensité
  if (rating === "easy") {
    taste.volume = ema(taste.volume, 0.55, alpha);
    taste.intensity = ema(taste.intensity, 0.4, alpha);
  } else if (rating === "hard") {
    taste.volume = ema(taste.volume, -0.55, alpha);
    taste.intensity = ema(taste.intensity, -0.65, alpha);
  } else if (rating === "ok") {
    taste.volume = ema(taste.volume, 0, alpha * 0.5);
    taste.intensity = ema(taste.intensity, 0, alpha * 0.5);
  }

  // Tags structurés
  for (const tag of tags) {
    const delta = TAG_DELTAS[tag];
    if (!delta) continue;
    if (delta.volume != null) taste.volume = clamp(ema(taste.volume, Math.sign(delta.volume), alpha) + delta.volume * 0.15);
    if (delta.intensity != null) taste.intensity = clamp(ema(taste.intensity, Math.sign(delta.intensity), alpha) + delta.intensity * 0.15);
    if (delta.educatif != null) taste.educatif = clamp(ema(taste.educatif, Math.sign(delta.educatif), alpha) + delta.educatif * 0.2);
    if (delta.clarity != null) taste.clarity = clamp01(ema(taste.clarity, 1, alpha) + delta.clarity * 0.1);
    if (delta.enjoyment != null) taste.enjoyment = clamp01(ema(taste.enjoyment, 1, alpha));
    if (delta.typeBoost) {
      for (const [k, v] of Object.entries(delta.typeBoost)) {
        if (taste.types[k] == null) continue;
        taste.types[k] = clamp(ema(taste.types[k], v > 0 ? 1 : -1, alpha));
      }
    }
  }

  // Affinité type de séance
  const typeKey = sessionType && TYPE_KEYS.includes(sessionType) ? sessionType : null;
  if (typeKey) {
    let signal = 0;
    if (rating === "easy") signal = 0.35;
    if (rating === "hard") signal = -0.45;
    if (rating === "ok") signal = 0.1;
    if (tags.includes("j'ai adoré")) signal += 0.5;
    if (tags.includes("trop intensif") && (typeKey === "SEUIL" || typeKey === "VITESSE")) signal -= 0.35;
    if (tags.includes("éducatifs top") && typeKey === "TECHNIQUE") signal += 0.4;
    taste.types[typeKey] = clamp(ema(taste.types[typeKey], clamp(signal), alpha));
  }

  // Commentaire libre → mots-clés, couleurs, styles, sentiment
  const extracted = extractFromComment(comment);
  taste.keywords = pushUnique(taste.keywords, extracted.keywords, 24);
  taste.colors = pushUnique(taste.colors, extracted.colors, 12);
  taste.styles = pushUnique(taste.styles, extracted.styles, 16);
  if (extracted.sentiment !== 0) {
    taste.enjoyment = clamp01(ema(taste.enjoyment, extracted.sentiment > 0 ? 1 : 0, alpha * 0.6));
    if (typeKey) {
      taste.types[typeKey] = clamp(ema(taste.types[typeKey], extracted.sentiment, alpha * 0.5));
    }
    // Styles cités positivement / négativement
    for (const s of extracted.styles) {
      if (s.includes("technique") || s.includes("éducatif")) {
        taste.educatif = clamp(ema(taste.educatif, extracted.sentiment > 0 ? 0.8 : -0.5, alpha * 0.4));
      }
      if (s.includes("vitesse") || s.includes("sprint") || s.includes("seuil")) {
        taste.intensity = clamp(ema(taste.intensity, extracted.sentiment > 0 ? 0.6 : -0.6, alpha * 0.4));
      }
      if (s.includes("jambes")) {
        taste.styles = pushUnique(taste.styles, ["jambes"], 16);
      }
    }
  }

  taste.sampleCount += 1;
  taste.updatedAt = new Date().toISOString();
  return normalizeTaste(taste);
}

/**
 * Retour hebdo (smiley), signal plus large, plus doux.
 * Commentaire libre enrichit keywords / colors / styles comme en séance.
 */
export function applyWeekFeedbackToTaste(prevTaste, { rating, comment = null } = {}) {
  const taste = normalizeTaste(prevTaste);
  const alpha = 0.22;
  if (rating === "easy") {
    taste.volume = ema(taste.volume, 0.7, alpha);
    taste.intensity = ema(taste.intensity, 0.5, alpha);
    taste.enjoyment = clamp01(ema(taste.enjoyment, 0.8, alpha));
  } else if (rating === "hard") {
    taste.volume = ema(taste.volume, -0.7, alpha);
    taste.intensity = ema(taste.intensity, -0.7, alpha);
  }
  const extracted = extractFromComment(comment);
  taste.keywords = pushUnique(taste.keywords, extracted.keywords, 24);
  taste.colors = pushUnique(taste.colors, extracted.colors, 12);
  taste.styles = pushUnique(taste.styles, extracted.styles, 16);
  if (extracted.sentiment !== 0) {
    taste.enjoyment = clamp01(ema(taste.enjoyment, extracted.sentiment > 0 ? 1 : 0, alpha * 0.5));
  }
  taste.sampleCount += 1;
  taste.updatedAt = new Date().toISOString();
  return normalizeTaste(taste);
}

/** Fusionne deux profils (ex. anon → compte) : garde le plus riche / récent. */
export function mergeTasteProfiles(a, b) {
  const ta = normalizeTaste(a);
  const tb = normalizeTaste(b);
  if (tb.sampleCount === 0) return ta;
  if (ta.sampleCount === 0) return tb;
  const aTime = ta.updatedAt ? Date.parse(ta.updatedAt) : 0;
  const bTime = tb.updatedAt ? Date.parse(tb.updatedAt) : 0;
  const primary = bTime >= aTime ? tb : ta;
  const secondary = bTime >= aTime ? ta : tb;
  return normalizeTaste({
    ...primary,
    keywords: pushUnique(primary.keywords, secondary.keywords, 24),
    colors: pushUnique(primary.colors, secondary.colors, 12),
    styles: pushUnique(primary.styles, secondary.styles, 16),
    sampleCount: Math.max(primary.sampleCount, secondary.sampleCount),
  });
}

/**
 * Convertit les goûts en leviers pour le générateur / bridge.
 * Bornes volontairement soft pour ne pas casser la périodisation COSD.
 */
export function tasteToGeneratorHints(tasteRaw) {
  const t = normalizeTaste(tasteRaw);
  if (t.sampleCount < 1) {
    return {
      volumeMul: 1,
      softenIntensity: false,
      pushIntensity: false,
      forceSimplify: false,
      educatifBias: 0,
      preferJambes: false,
      typeWeights: { ...t.types },
      colors: t.colors,
      styles: t.styles,
      ready: false,
    };
  }

  // Volume : ±8 % max via goûts (en plus de volumeAdj feedback)
  const volumeMul = clamp(1 + t.volume * 0.08, 0.92, 1.08);
  const softenIntensity = t.intensity < -0.35;
  const pushIntensity = t.intensity > 0.45 && t.enjoyment > 0.25;
  const forceSimplify = t.clarity >= 0.45;
  // Cap éducatif : MySWYM ≠ école, bias max soft
  const educatifBias = clamp(t.educatif * 0.55, -0.5, 0.45);
  const preferJambes = t.educatif < -0.25 || t.styles.includes("jambes");

  return {
    volumeMul,
    softenIntensity,
    pushIntensity,
    forceSimplify,
    educatifBias,
    preferJambes,
    typeWeights: { ...t.types },
    colors: t.colors,
    styles: t.styles,
    ready: true,
  };
}

/**
 * Adoucit / pousse les rôles COSD selon l'intensité perçue.
 */
export function biasRolesForTaste(roles, hints) {
  if (!hints?.ready || !Array.isArray(roles)) return roles;
  return roles.map((role) => {
    if (!role) return role;
    let { objectif, zone } = role;
    if (hints.softenIntensity) {
      if (zone === "Z4") zone = "Z3";
      else if (zone === "Z3") zone = "Z2";
      if (objectif === "vitesse") objectif = "endurance";
    } else if (hints.pushIntensity) {
      if (zone === "Z2" && objectif === "endurance") zone = "Z3";
    }
    // Affinité types : si VITESSE très négatif, éviter Z4
    const vit = hints.typeWeights?.VITESSE ?? 0;
    if (vit < -0.4 && zone === "Z4") zone = "Z3";
    const seu = hints.typeWeights?.SEUIL ?? 0;
    if (seu < -0.4 && zone === "Z3" && objectif !== "test") zone = "Z2";
    const tech = hints.typeWeights?.TECHNIQUE ?? 0;
    if (tech > 0.45 && hints.educatifBias > 0.2 && objectif === "endurance" && zone === "Z1") {
      objectif = "mixte";
    }
    return { ...role, objectif, zone };
  });
}

/**
 * Décalage du cycle de focus technique selon goûts éducatifs / jambes.
 */
export function pickFocusFromTaste(focusCycle, index, hints) {
  if (!hints?.ready || !Array.isArray(focusCycle) || focusCycle.length === 0) {
    return focusCycle[index % focusCycle.length];
  }
  const n = focusCycle.length;
  let idx = ((index % n) + n) % n;
  if (hints.preferJambes) {
    // Cherche le prochain slot jambes dans le cycle
    for (let k = 0; k < n; k++) {
      const cand = focusCycle[(idx + k) % n];
      if (String(cand).includes("jambes")) return cand;
    }
  }
  if (hints.educatifBias > 0.25) {
    // Légère préférence pour slots non-jambes (toujours rare chiens via cycle)
    for (let k = 0; k < n; k++) {
      const cand = focusCycle[(idx + k) % n];
      if (!String(cand).includes("jambes") && !String(cand).includes("chiens")) return cand;
    }
  }
  return focusCycle[idx];
}
