/**
 * Allègement egress user_plans : meta d'abord, blob JSON seulement si remote plus récent.
 * Pas d'import Supabase ici (tests Node).
 */

/** Debounce autosave, évite un upsert JSON à chaque micro-changement / HMR. */
export const PLANS_AUTOSAVE_DEBOUNCE_MS = 3000;

/** Ignore un remote « plus récent » de quelques ms (horloge client vs serveur après upsert). */
export const REMOTE_NEWER_EPSILON_MS = 3000;

/** Min. entre deux sync visibility (meta + éventuel blob). */
export const PLAN_VISIBILITY_SYNC_MIN_MS = 60_000;

export const USER_PLANS_META_SELECT = "updated_at, active_plan_id";
export const USER_PLANS_BLOB_SELECT = "plans_json, active_plan_id, plan_history, updated_at";

export function storedPlansUpdatedAtMs(userId) {
  try {
    const ts = localStorage.getItem(`myswym_plans_updated_${userId}`);
    if (!ts) return 0;
    return new Date(ts).getTime() || 0;
  } catch {
    return 0;
  }
}

/** Empreinte stable pour skip upsert si rien n’a changé (évite bump updated_at + re-download). */
export function plansPersistFingerprint(plans, activePlanId, history = []) {
  try {
    return JSON.stringify({
      a: activePlanId || null,
      h: Array.isArray(history) ? history.map((x) => x?.id).filter(Boolean) : [],
      p: plans || [],
    });
  } catch {
    return `err_${Date.now()}`;
  }
}

export function readLastPlansPersistFingerprint(userId) {
  try {
    return localStorage.getItem(`myswym_plans_fp_${userId}`) || "";
  } catch {
    return "";
  }
}

export function writeLastPlansPersistFingerprint(userId, fp) {
  try {
    if (!fp) localStorage.removeItem(`myswym_plans_fp_${userId}`);
    else localStorage.setItem(`myswym_plans_fp_${userId}`, fp);
  } catch { /* ignore */ }
}

/** Télécharger le JSON seulement s'il n'y a pas de cache, ou si le remote est nettement plus récent. */
export function shouldFetchRemotePlanBlob(storedLocalMs, remoteMs, epsilonMs = REMOTE_NEWER_EPSILON_MS) {
  if (!storedLocalMs) return true;
  return (Number(remoteMs) || 0) > storedLocalMs + (Number(epsilonMs) || 0);
}

export function parseUserPlansBlob(data) {
  if (!data) {
    return { plans: [], active: null, history: [], updatedAt: 0, updatedIso: null };
  }
  const plans = Array.isArray(data.plans_json) ? data.plans_json : [];
  const history = Array.isArray(data.plan_history) ? data.plan_history : [];
  const updatedIso = data.updated_at || null;
  return {
    plans,
    active: data.active_plan_id || null,
    history,
    updatedAt: updatedIso ? new Date(updatedIso).getTime() || 0 : 0,
    updatedIso,
  };
}

/** Upsert sans doublon `plan` / `profile` (legacy, gros JSON). Null = libère la ligne. */
export function userPlansUpsertRow({ userId, plans, activePlanId, history, updatedAt }) {
  return {
    user_id: userId,
    plans_json: plans,
    active_plan_id: activePlanId,
    plan_history: history,
    profile: null,
    plan: null,
    updated_at: updatedAt,
  };
}

export function fetchUserPlansMeta(client, userId) {
  return client
    .from("user_plans")
    .select(USER_PLANS_META_SELECT)
    .eq("user_id", userId)
    .maybeSingle();
}

export function fetchUserPlansBlob(client, userId) {
  return client
    .from("user_plans")
    .select(USER_PLANS_BLOB_SELECT)
    .eq("user_id", userId)
    .maybeSingle();
}

export function fetchUserPlansLegacy(client, userId) {
  return client
    .from("user_plans")
    .select("profile, plan")
    .eq("user_id", userId)
    .maybeSingle();
}

/**
 * Meta d'abord (octets). Blob JSON seulement si le remote est plus récent que le cache local.
 * @returns {{ skipped: boolean, fetchedBlob: boolean, remoteTime: number, data?: object|null, error?: object|null, activePlanId?: string|null }}
 */
export async function loadRemotePlansIfNewer(client, userId, localUpdatedAtMs) {
  const { data: meta, error: metaError } = await fetchUserPlansMeta(client, userId);
  if (metaError) return { skipped: false, fetchedBlob: false, remoteTime: 0, error: metaError };
  const remoteTime = meta?.updated_at ? new Date(meta.updated_at).getTime() : 0;
  if (!shouldFetchRemotePlanBlob(localUpdatedAtMs, remoteTime)) {
    return {
      skipped: true,
      fetchedBlob: false,
      remoteTime,
      activePlanId: meta?.active_plan_id || null,
      error: null,
    };
  }
  const { data, error } = await fetchUserPlansBlob(client, userId);
  return {
    skipped: false,
    fetchedBlob: true,
    remoteTime: data?.updated_at ? new Date(data.updated_at).getTime() : remoteTime,
    data,
    error,
  };
}
