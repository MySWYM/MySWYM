/**
 * Cache client des templates `session_templates` (Supabase).
 * Fallback JS si table vide / erreur réseau — generatePlan reste synchrone.
 */

let cache = [];
let loadState = "idle"; // idle | loading | ready | error
let loadPromise = null;

export function getSessionTemplatesCache() {
  return cache;
}

export function sessionTemplatesReady() {
  return loadState === "ready" && cache.length > 0;
}

/**
 * Charge les templates actifs (une fois). Safe à appeler plusieurs fois.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 */
export function loadSessionTemplates(supabase) {
  if (!supabase) return Promise.resolve(cache);
  if (loadState === "ready") return Promise.resolve(cache);
  if (loadPromise) return loadPromise;

  loadState = "loading";
  loadPromise = supabase
    .from("session_templates")
    .select(
      "slug, title, type, intensity, details, blocks, base_distance_m, niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index, source, quality, sort_order, active",
    )
    .eq("active", true)
    .then(({ data, error }) => {
      if (error) {
        loadState = "error";
        loadPromise = null;
        console.warn("[session_templates]", error.message);
        return cache;
      }
      cache = Array.isArray(data) ? data : [];
      loadState = "ready";
      return cache;
    })
    .catch((err) => {
      loadState = "error";
      loadPromise = null;
      console.warn("[session_templates]", err?.message || err);
      return cache;
    });

  return loadPromise;
}

/** Templates gold Arthur (coaché), filtrés par objectif MySWYM. */
export function getArthurGoldTemplates(objectif) {
  const obj = objectif === "eau_libre" || objectif === "mixte" ? objectif : null;
  if (!obj || !cache.length) return [];
  return cache
    .filter(
      (t) =>
        t.quality === "gold" &&
        (t.source === "coach_approved" || t.source === "arthur_excel") &&
        Array.isArray(t.objectifs) &&
        t.objectifs.includes(obj) &&
        (String(t.slug || "").startsWith("arthur-") ||
          (obj === "eau_libre" && String(t.slug || "").includes("ow")) ||
          (obj === "mixte" && String(t.slug || "").includes("tri"))),
    )
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

export function templateToMySwymSession(t) {
  const details = Array.isArray(t.details) ? t.details : [];
  const dist = t.base_distance_m || 0;
  return {
    type: t.type || "ENDURANCE",
    title: t.title || "Séance",
    intensity: t.intensity || "",
    details,
    distance: dist ? `${dist}m` : undefined,
    duration: Math.max(40, Math.min(90, Math.round((dist || 1500) / 35))),
    completed: false,
    skipped: null,
    templateSlug: t.slug || undefined,
  };
}

/**
 * Rotation sur la banque Arthur gold pour un objectif.
 * @returns {object|null} séance MySWYM ou null → fallback JS
 */
export function pickArthurBankSession(objectif, archeIdx) {
  const list = getArthurGoldTemplates(objectif);
  if (!list.length) return null;
  const idx = ((archeIdx % list.length) + list.length) % list.length;
  return templateToMySwymSession(list[idx]);
}
