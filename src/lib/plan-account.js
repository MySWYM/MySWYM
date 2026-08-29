/**
 * Sync plans compte : merge local/remote, tombstones, persist Supabase.
 * Extrait de App.jsx (découpe progressive).
 */
import { supabase } from "../supabase.js";
import { planProgressScore } from "./plan-progress-merge.js";
import { enforceSingleActivePlan } from "./swimmer-profile.js";
import {
  storedPlansUpdatedAtMs,
  loadRemotePlansIfNewer,
  parseUserPlansBlob,
  userPlansUpsertRow,
  plansPersistFingerprint,
  readLastPlansPersistFingerprint,
  writeLastPlansPersistFingerprint,
} from "./plan-account-egress.js";

export {
  PLANS_AUTOSAVE_DEBOUNCE_MS,
  PLAN_VISIBILITY_SYNC_MIN_MS,
  REMOTE_NEWER_EPSILON_MS,
  USER_PLANS_META_SELECT,
  USER_PLANS_BLOB_SELECT,
  storedPlansUpdatedAtMs,
  shouldFetchRemotePlanBlob,
  parseUserPlansBlob,
  userPlansUpsertRow,
  plansPersistFingerprint,
  fetchUserPlansMeta,
  fetchUserPlansBlob,
  fetchUserPlansLegacy,
  loadRemotePlansIfNewer,
} from "./plan-account-egress.js";

export const planFingerprint = (entry) => {
  const p = entry?.profile ?? {};
  return [p.category, p.goal, p.eventDate, p.level, p.pool, p.sessionsPerWeek].join("|");
};

export const dedupePlans = (plans) => {
  if (!plans?.length) return plans;
  const groups = new Map();
  for (const entry of plans) {
    const fp = planFingerprint(entry);
    if (!groups.has(fp)) groups.set(fp, []);
    groups.get(fp).push(entry);
  }
  const out = [];
  for (const group of groups.values()) {
    if (group.length === 1) { out.push(group[0]); continue; }
    // Plusieurs ids pour le même objectif : garde ceux avec progression, sinon le premier
    const withProgress = group.filter(e => planProgressScore(e) > 0);
    if (withProgress.length >= 2) out.push(...withProgress);
    else if (withProgress.length === 1) out.push(withProgress[0]);
    else out.push(group[0]);
  }
  return out;
};

// Fusion local + remote : union des plans non tombstonés.
// Suppression intentionnelle = présent dans deletedIds uniquement.
// Pour un même id des deux côtés : garde la version avec le plus de progression.
// À progression égale : garder le côté le plus récent (base), sinon un changement
// de fréquence 2×→3× (même nb de séances validées) est écrasé par l'ancien plan au refresh.
// Si les timestamps sont égaux : préférer la fréquence / le volume planifié du côté base
// déjà choisi ; ne prendre `other` que s'il a strictement plus de séances validées.
export const planCreatedAt = (id) => {
  const m = String(id || "").match(/^plan_(\d+)$/);
  return m ? Number(m[1]) : 0;
};

// Fusion local + remote : union des plans non tombstonés.
// Suppression intentionnelle = présent dans deletedIds, OU id absent du côté
// le plus récent alors que le plan est plus vieux que ce snapshot.
// Pour un même id des deux côtés : garde la version avec le plus de progression.
export const mergePlanLists = (localPlans, remotePlans, localActive, remoteActive, localUpdatedAt = 0, remoteUpdatedAt = 0, currentActive = null, deletedIds = null) => {
  const localIsNewer = (localUpdatedAt || 0) >= (remoteUpdatedAt || 0);
  const base = localIsNewer ? (localPlans || []) : (remotePlans || []);
  const other = localIsNewer ? (remotePlans || []) : (localPlans || []);
  const newerTs = localIsNewer ? (localUpdatedAt || 0) : (remoteUpdatedAt || 0);
  const byId = new Map();
  for (const e of base) {
    if (deletedIds?.has(e.id)) continue;
    byId.set(e.id, e);
  }
  for (const e of other) {
    if (deletedIds?.has(e.id)) continue;
    const existing = byId.get(e.id);
    if (!existing) {
      const created = planCreatedAt(e.id);
      // Présent seulement sur le côté plus ancien + créé avant le snapshot récent
      // → suppression sur l'autre appareil (ne pas ressusciter).
      // Créé après le snapshot → création concurrente / hors-ligne à garder.
      if (created > 0 && newerTs > 0 && created <= newerTs) continue;
      byId.set(e.id, e);
      continue;
    }
    if (planProgressScore(e) > planProgressScore(existing)) byId.set(e.id, e);
  }
  const merged = dedupePlans([...byId.values()]);
  let active = currentActive;
  if (!active || !merged.some(e => e.id === active)) {
    if (localActive && merged.some(e => e.id === localActive)) active = localActive;
    else if (remoteActive && merged.some(e => e.id === remoteActive)) active = remoteActive;
    else active = merged[0]?.id ?? null;
  }
  const updatedAt = new Date(Math.max(localUpdatedAt || 0, remoteUpdatedAt || 0) || Date.now()).toISOString();
  return { plans: merged, active, updatedAt };
};

export const deletedPlansStorageKey = (userId) => `myswym_deleted_plans_${userId}`;

export const readDeletedPlanIds = (userId) => {
  try {
    const raw = localStorage.getItem(deletedPlansStorageKey(userId));
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};

export const writeDeletedPlanIds = (userId, ids) => {
  try {
    const list = [...(ids || [])];
    if (list.length === 0) localStorage.removeItem(deletedPlansStorageKey(userId));
    else localStorage.setItem(deletedPlansStorageKey(userId), JSON.stringify(list));
  } catch { /* ignore */ }
};

/** Persistance compte : union local∪remote (sauf tombstones), 1 plan actif max, puis upsert Supabase. */
export const persistAccountPlans = async (userId, localPlans, activePlanId, deletedIds = null, localHistory = []) => {
  const now = new Date().toISOString();
  const tombstones = deletedIds instanceof Set ? new Set(deletedIds) : readDeletedPlanIds(userId);
  let remotePlans = [];
  let remoteActive = null;
  let remoteHistory = [];
  let remoteTime = 0;
  const storedTime = storedPlansUpdatedAtMs(userId);
  try {
    const loaded = await loadRemotePlansIfNewer(supabase, userId, storedTime);
    if (!loaded.error && loaded.fetchedBlob && loaded.data) {
      const parsed = parseUserPlansBlob(loaded.data);
      remotePlans = parsed.plans;
      remoteActive = parsed.active;
      remoteHistory = parsed.history;
      remoteTime = parsed.updatedAt;
    }
  } catch { /* offline / network */ }

  const localTime = storedTime || Date.now();

  const { plans: mergedRaw, active: activeRaw } = mergePlanLists(
    localPlans || [],
    remotePlans,
    activePlanId,
    remoteActive,
    localTime,
    remoteTime,
    activePlanId,
    tombstones,
  );

  // Historique : union local ∪ remote (par id), sans doublon
  const histById = new Map();
  for (const h of [...(remoteHistory || []), ...(localHistory || [])]) {
    if (h?.id) histById.set(h.id, h);
  }
  const existingHistory = [...histById.values()];
  const enforced = enforceSingleActivePlan(mergedRaw, activeRaw, existingHistory);
  const merged = enforced.plans;
  const active = enforced.activeId;
  const history = enforced.history;

  const fp = plansPersistFingerprint(merged, active, history);
  if (fp && fp === readLastPlansPersistFingerprint(userId)) {
    // Rien n’a changé vs dernier upsert réussi, pas de re-écriture JSON (egress + bump updated_at).
    return { plans: merged, active, history, error: null, skipped: true };
  }

  try {
    localStorage.setItem(`myswym_plans_${userId}`, JSON.stringify(merged));
    if (active) localStorage.setItem(`myswym_active_${userId}`, active);
    else localStorage.removeItem(`myswym_active_${userId}`);
    localStorage.setItem(`myswym_plan_history_${userId}`, JSON.stringify(history));
    localStorage.setItem(`myswym_plans_updated_${userId}`, now);
  } catch { /* ignore */ }

  if (merged.length === 0) {
    const { error } = await supabase.from("user_plans").upsert(
      userPlansUpsertRow({
        userId,
        plans: [],
        activePlanId: null,
        history,
        updatedAt: now,
      }),
      { onConflict: "user_id" },
    );
    if (!error) {
      writeDeletedPlanIds(userId, new Set());
      writeLastPlansPersistFingerprint(userId, fp);
    }
    return { plans: [], active: null, history, error: error || null, skipped: false };
  }

  const { error } = await supabase.from("user_plans").upsert(
    userPlansUpsertRow({
      userId,
      plans: merged,
      activePlanId: active,
      history,
      updatedAt: now,
    }),
    { onConflict: "user_id" },
  );

  if (error) {
    if (import.meta.env.DEV) console.warn("[plans] upsert failed", error.message);
    writeDeletedPlanIds(userId, tombstones);
    return { plans: merged, active, history, error, skipped: false };
  }

  writeDeletedPlanIds(userId, new Set());
  writeLastPlansPersistFingerprint(userId, fp);
  return { plans: merged, active, history, error: null, skipped: false };
};
