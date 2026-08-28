/**
 * Client catalogue Google Sheet (cahier natation).
 * Fetch via /api/natation-sheet (Vite middleware local + route Vercel).
 * Cache court = tu ajoutes un éducatif → reload / prochain fetch le voit.
 */

import {
  EDUCATIFS_SHEET,
  SHEET_FAMILIES,
  SHEET_SOFT_FAMILIES,
  isEventFamilyId,
  levelBandFromProfile,
  materializeSession,
  parseEducatifsCsv,
  parseSessionsCsv,
  pickSession,
  sheetFamilyIdFromProfile,
  excludeSheetNsFromHistory,
  excludeEducatifNamesFromHistory,
  educatifRowToUiFiche,
  normalizeEducatifKey,
  SHEET_RECENT_EXCLUDE,
  SHEET_RECENT_EDUCATIFS,
} from "./parse.js";
import { resolveSheetWeekRole } from "./sheet-week-role.js";

const CACHE_TTL_MS = 30_000;

/** @type {{ at: number, educatifs: any[], sessionsByFamily: Record<string, any[]> } | null} */
let cache = null;
let inflight = null;

export function isNatationSheetCatalogueEnabled() {
  const raw = (() => {
    try {
      if (typeof import.meta !== "undefined" && import.meta.env) {
        return import.meta.env.VITE_NATATION_SHEET_CATALOGUE;
      }
    } catch {
      /* ignore */
    }
    return typeof process !== "undefined" ? process.env.VITE_NATATION_SHEET_CATALOGUE : undefined;
  })();
  if (raw === "0" || raw === "false") return false;
  if (raw === "1" || raw === "true") return true;
  // Vague 1 : ON dans le navigateur (staging/prod inclus). Kill-switch = VITE_…=0.
  // Node / tests : OFF (pas de fetch Google).
  return typeof window !== "undefined";
}

export function clearNatationSheetCache() {
  cache = null;
  inflight = null;
}

async function fetchSheetCsv(sheetName) {
  const q = new URLSearchParams({ sheet: sheetName });
  const res = await fetch(`/api/natation-sheet?${q}`);
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`natation-sheet ${sheetName}: ${res.status} ${err.slice(0, 120)}`);
  }
  const data = await res.json();
  return String(data.csv || "");
}

/**
 * Charge Éducatifs + familles demandées (défaut : vague soft courante).
 * @param {string[]} [familyIds]
 */
export async function loadNatationCatalogue(familyIds = [...SHEET_SOFT_FAMILIES]) {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) {
    const missing = familyIds.filter((id) => !cache.sessionsByFamily[id]);
    if (!missing.length) return cache;
  }
  if (inflight) return inflight;

  inflight = (async () => {
    const eduCsv = await fetchSheetCsv(EDUCATIFS_SHEET);
    const educatifs = parseEducatifsCsv(eduCsv);
    const sessionsByFamily = { ...(cache?.sessionsByFamily || {}) };
    for (const id of familyIds) {
      if (!SHEET_FAMILIES.includes(id)) continue;
      const csv = await fetchSheetCsv(id);
      sessionsByFamily[id] = parseSessionsCsv(csv, { hasPhase: isEventFamilyId(id) });
    }
    cache = { at: Date.now(), educatifs, sessionsByFamily };
    inflight = null;
    return cache;
  })().catch((err) => {
    inflight = null;
    throw err;
  });

  return inflight;
}

/**
 * Précharge en arrière-plan (appelé au boot app en local).
 * Soft = Nager 01–03 + triathlon 04–08 + eau libre 09–13.
 */
export function prefetchNatationCatalogue() {
  if (!isNatationSheetCatalogueEnabled()) return Promise.resolve(null);
  return loadNatationCatalogue([...SHEET_SOFT_FAMILIES]).catch((err) => {
    console.warn("[natation-sheet]", err?.message || err);
    return null;
  });
}

/**
 * Compose une séance depuis le Sheet si la famille est branchée.
 * Sync si cache chaud ; sinon null (le caller garde composeSession).
 *
 * @param {object} profile
 * @param {{ cursor?: number, rng?: () => number, history?: object[], excludeNs?: number[], excludeEducatifs?: string[], currentEducatif?: string|null }} opts
 */
export function tryComposeFromSheetCache(profile, opts = {}) {
  if (!isNatationSheetCatalogueEnabled() || !cache) return null;
  const familyId = sheetFamilyIdFromProfile(profile);
  if (!familyId) return null;
  const sessions = cache.sessionsByFamily[familyId];
  if (!sessions?.length) return null;

  const event = isEventFamilyId(familyId);
  const spw = Math.max(1, Math.min(5, Number(profile.sessionsPerWeek) || 3));
  const ordinal = Math.max(0, Number(opts.ordinalIndex) || 0);
  const weekIndexFromOrdinal = Math.floor(ordinal / spw);
  const weekRole = event
    ? resolveSheetWeekRole({
        eventDate: profile.eventDate || null,
        planStart: opts.planStart || profile.planStartedAt || profile.createdAt || null,
        weekIndex: opts.weekIndex != null ? opts.weekIndex : weekIndexFromOrdinal,
        now: opts.now,
      })
    : null;
  const phase = event ? weekRole.phase : null;
  const excludeNs = [
    ...excludeSheetNsFromHistory(opts.history, SHEET_RECENT_EXCLUDE),
    ...(opts.excludeNs || []),
  ];
  const picked = pickSession(
    sessions,
    { phase: event ? phase : null, excludeNs },
    opts.rng || Math.random,
  );
  if (!picked) return null;

  const levelBand = levelBandFromProfile(profile);
  const style = String(profile.swimStyle || "crawl").toLowerCase();
  const nage =
    levelBand === "debutant"
      ? "crawl"
      : style.includes("4") || style === "im"
        ? "4_nages"
        : style;
  const equipment = Array.isArray(profile.equipment) ? profile.equipment : profile.equipment === null ? null : [];
  const recentEducatifs = [
    ...excludeEducatifNamesFromHistory(opts.history, SHEET_RECENT_EDUCATIFS),
    ...(opts.excludeEducatifs || []),
  ];
  if (Array.isArray(opts.currentEducatifs) && opts.currentEducatifs.length) {
    for (const n of opts.currentEducatifs) {
      if (n) recentEducatifs.unshift(String(n));
    }
  } else if (opts.currentEducatif) {
    // Séance 4 nages : « A · B · C · D » → exclure chaque nom
    for (const part of String(opts.currentEducatif).split(/\s*·\s*/)) {
      if (part.trim()) recentEducatifs.unshift(part.trim());
    }
  }
  // Dédupe en gardant l’ordre (le plus récent = hard exclude)
  const seenEdu = new Set();
  const orderedEducatifs = [];
  for (const name of recentEducatifs) {
    const key = normalizeEducatifKey(name);
    if (!key || seenEdu.has(key)) continue;
    seenEdu.add(key);
    orderedEducatifs.push(String(name).trim());
  }
  const hardExcludeNames = orderedEducatifs.slice(0, 1);
  const excludeEducatifs = orderedEducatifs.slice(1);
  const pace100 = Number(profile.pace100) > 0 ? Number(profile.pace100) : null;
  const isPremium = opts.isPremium === true || profile.isPremium === true;
  const filled = materializeSession(
    picked,
    cache.educatifs,
    {
      levelBand,
      nage,
      equipment,
      excludeNames: excludeEducatifs,
      hardExcludeNames,
      pace100,
      isPremium,
    },
    opts.rng || Math.random,
  );

  const echLines = String(filled.echauffement || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const blocLines = String(filled.bloc || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const racLines = String(filled.rac || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Une ligne = un exercice ; `sets.block` pilote les 3 encadrés UI
  // (Échauffement · Corps de séance · Retour au calme).
  const details = [
    ...echLines.map((l) => `- ${l}`),
    ...blocLines.map((l) => `- ${l}`),
    ...racLines.map((l) => `- ${l}`),
  ];
  const sets = [
    ...echLines.map((l) => ({ block: "depart", label: l })),
    ...blocLines.map((l) => ({ block: "corps", label: l })),
    ...racLines.map((l) => ({ block: "fin", label: l })),
  ];

  const distance = filled.total_m;
  const eduList = Array.isArray(filled.educatifs) ? filled.educatifs : filled.educatif ? [filled.educatif] : [];
  const eduNames = eduList.map((e) => e?.nom).filter(Boolean);
  const sheetEducatifs = eduList.map(educatifRowToUiFiche).filter(Boolean);
  const sheetEducatif = sheetEducatifs[0] || null;
  const eduName = eduNames.length > 1 ? eduNames.join(" · ") : eduNames[0] || null;
  return {
    type: "ENDURANCE",
    title: `Séance · ${distance} m`,
    intensity:
      weekRole?.isRaceWeek
        ? "Semaine de course"
        : filled.phase === "test" || weekRole?.phase === "test"
          ? "Test"
          : filled.phase === "deload" || weekRole?.phase === "deload"
            ? "Charge légère"
            : "Endurance",
    details,
    sets,
    distance: `${distance}m`,
    duration: Math.max(35, Math.min(90, Math.round(distance / 35))),
    completed: false,
    skipped: null,
    trainingDistance: distance,
    volumeFromSets: distance,
    composedBy: "natation-sheet",
    /** Fiche(s) éducatif = onglet Sheet (pas arthur-educatif-fiches.js) */
    sheetEducatif,
    sheetEducatifs: sheetEducatifs.length ? sheetEducatifs : null,
    sheetWeekRole: weekRole,
    sheetMeta: {
      familyId,
      n: filled.n,
      phase: filled.phase || weekRole?.phase || null,
      weekRole: weekRole
        ? {
            phase: weekRole.phase,
            band: weekRole.band,
            label: weekRole.label,
            weeksBeforeRace: weekRole.weeksBeforeRace,
            maxSessions: weekRole.maxSessions,
            isRaceWeek: weekRole.isRaceWeek,
          }
        : null,
      bande: filled.bande,
      educatif: eduName,
      educatifs: eduNames.length ? eduNames : null,
      total_m: filled.total_m,
    },
    composerWhy: {
      source: "natation-sheet",
      familyId,
      sessionN: filled.n,
      educatif: eduName,
      educatifs: eduNames.length ? eduNames : null,
      excludeNs,
      excludeEducatifs,
      hardExcludeNames,
      weekRolePhase: weekRole?.phase || null,
    },
    engineWhy: weekRole
      ? `sheet=${familyId} · n°${filled.n} · ${filled.total_m}m · ${weekRole.phase}`
      : `sheet=${familyId} · n°${filled.n} · ${filled.total_m}m`,
  };
}

/**
 * Async : assure le cache puis compose.
 */
export async function composeFromNatationSheet(profile, opts = {}) {
  if (!isNatationSheetCatalogueEnabled()) return null;
  const familyId = sheetFamilyIdFromProfile(profile);
  if (!familyId) return null;
  await loadNatationCatalogue([familyId]);
  return tryComposeFromSheetCache(profile, opts);
}
