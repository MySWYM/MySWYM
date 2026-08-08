/**
 * Cache client des templates `session_templates` (Supabase).
 * Fallback JS si table vide / erreur réseau — generatePlan reste synchrone.
 */
import { scaleSessionLinesToVolume } from "./sports-engine/arthur-scale.js";
import { ARTHUR_GOLD_TEST_FIXTURES } from "./sports-engine/arthur-gold-fixtures.js";

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
 * Injecte des templates Arthur Gold de test (runtime tests).
 * Ne contourne pas la sélection : remplit le même cache que Supabase.
 * @param {object[]} [templates]
 */
export function loadArthurGoldTestFixtures(templates = ARTHUR_GOLD_TEST_FIXTURES) {
  cache = Array.isArray(templates) ? templates.map((t) => ({ ...t })) : [];
  loadState = cache.length ? "ready" : "idle";
  loadPromise = null;
  return cache;
}

/** Remet le cache à vide (après tests). */
export function resetSessionTemplatesCache() {
  cache = [];
  loadState = "idle";
  loadPromise = null;
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
  const rawDetails = Array.isArray(t.details) ? t.details : [];
  // Même découpe que l'UI : lignes Arthur « A · B · C » → header + sous-séries
  const details = expandArthurDetailsForUi(rawDetails);
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

/** Découpe lignes compactes Arthur pour affichage (mirroir App.jsx). */
function expandArthurDetailsForUi(details = []) {
  const setRe = /^(?:\d+\s*[x×]\s*\d+\s*m|\d+\s*m)\b/i;
  const meters = (part) => {
    let m = String(part).match(/(\d+)\s*[x×]\s*(\d+)\s*m/i);
    if (m) return parseInt(m[1], 10) * parseInt(m[2], 10);
    m = String(part).match(/(\d+)\s*m\b/i);
    return m ? parseInt(m[1], 10) : 0;
  };
  const out = [];
  for (const raw of details) {
    const full = String(raw ?? "");
    const text = full.trim();
    if (!text) continue;
    if (/^[·]/.test(text) || (/^\s/.test(full) && !/^[-–—]/.test(text))) {
      out.push(full.startsWith("  ") ? full : `  ${text}`);
      continue;
    }
    const emParts = text.replace(/^[-–—]\s*/, "").split(/\s*[—–]\s*/).map((s) => s.trim()).filter(Boolean);
    const swimMain = emParts[0] || text.replace(/^[-–—]\s*/, "");
    const cues = emParts.slice(1);
    const parts = swimMain.split(/\s*·\s*/).map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2 && parts.every((p) => setRe.test(p))) {
      const total = parts.reduce((a, p) => a + meters(p), 0);
      const cueStr = cues.join(" — ");
      out.push(total > 0 ? `-${total}m${cueStr ? ` — ${cueStr}` : ""} :` : `-Série :`);
      parts.forEach((p) => out.push(`  · ${p}`));
    } else {
      out.push(text);
    }
  }
  return out;
}

/**
 * Rotation / match pattern Arthur gold.
 * @param {string} objectif — eau_libre | mixte
 * @param {number} archeIdx
 * @param {object} [opts] — { volumeTarget, phase, family, equipment, scaleVolume }
 * @returns {object|null}
 */
export function pickArthurBankSession(objectif, archeIdx, opts = {}) {
  let list = getArthurGoldTemplates(objectif);
  if (!list.length) return null;

  // Filtre phase si tags présents
  if (opts.phase && list.some((t) => Array.isArray(t.phases) && t.phases.length)) {
    const phased = list.filter(
      (t) => !t.phases?.length || t.phases.includes(opts.phase) || t.phases.includes(mapPhaseAlias(opts.phase)),
    );
    if (phased.length) list = phased;
  }

  // Filtre famille / role
  if (opts.family) {
    const fam = list.filter((t) => {
      const role = String(t.role || "").toLowerCase();
      const tags = (t.focus_tags || []).join(" ").toLowerCase();
      if (opts.family === "seuil") return role.includes("seuil") || tags.includes("seuil") || /Z3/i.test(t.intensity || "");
      if (opts.family === "vitesse") return role.includes("vitesse") || tags.includes("vitesse") || /Z4/i.test(t.intensity || "");
      if (opts.family === "technique") return role.includes("technique") || tags.includes("technique");
      if (opts.family === "recuperation") return role.includes("recup") || tags.includes("recup");
      return true;
    });
    if (fam.length) list = fam;
  }

  // Filtre matériel
  if (Array.isArray(opts.equipment)) {
    const fitted = list.filter((t) => templateFitsEquipment(t, opts.equipment));
    if (fitted.length) list = fitted;
  }

  const idx = ((archeIdx % list.length) + list.length) % list.length;
  const t = list[idx];
  let session = templateToMySwymSession(t);

  // Scale volume vers cible (periodization parity)
  if (opts.scaleVolume && opts.volumeTarget > 0 && t.base_distance_m > 0) {
    session = scaleSessionToVolume(session, t.base_distance_m, opts.volumeTarget);
  }

  session.engineWhy = `pattern=${t.slug} · famille=${opts.family || t.role || "—"}`;
  return session;
}

function mapPhaseAlias(phase) {
  if (phase === "foncier") return "base";
  if (phase === "developpement") return "development";
  if (phase === "specifique") return "peak";
  if (phase === "affutage") return "taper";
  return phase;
}

function templateFitsEquipment(t, equipment) {
  const details = Array.isArray(t.details) ? t.details : [];
  const text = details.join(" ");
  const needs = [];
  if (/palmes?/i.test(text)) needs.push("palmes");
  if (/tuba/i.test(text)) needs.push("tuba");
  if (/pull/i.test(text)) needs.push("pull");
  if (/plaquette/i.test(text)) needs.push("plaquettes");
  if (/planche/i.test(text)) needs.push("planche");
  if (equipment.length === 0) return needs.length === 0;
  return needs.every((n) => equipment.includes(n));
}

/** Scale distances dans les lignes (reps ou distance) — pas seulement le total annoncé. */
function scaleSessionToVolume(session, baseDist, targetDist) {
  return scaleSessionLinesToVolume(session, baseDist, targetDist);
}

