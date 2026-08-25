const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const SLOT_ORDER = ["morning", "midday", "afternoon", "evening"];

function normalizeList(value, allowed) {
  const raw = Array.isArray(value) ? value : [];
  const set = new Set(raw.filter((id) => allowed.includes(id)));
  return allowed.filter((id) => set.has(id));
}

function normalizeAvailabilityDays(value) {
  return normalizeList(value, DAY_ORDER);
}

function normalizeAvailabilitySlots(value) {
  return normalizeList(value, SLOT_ORDER);
}

/**
 * Score de pertinence pour trier l’annuaire (ville / niveau / objectif / dispo).
 */
export function buddyMatchScore(buddy, viewer = {}) {
  if (!buddy) return 0;
  let score = 0;
  const vCity = String(viewer.city || "").trim().toLowerCase();
  const bCity = String(buddy.city || "").trim().toLowerCase();
  if (vCity && bCity) {
    if (bCity === vCity) score += 40;
    else if (bCity.includes(vCity) || vCity.includes(bCity)) score += 25;
  }
  if (viewer.level && buddy.level && String(viewer.level) === String(buddy.level)) score += 20;
  if (viewer.goal_category && buddy.goal_category && viewer.goal_category === buddy.goal_category) {
    score += 15;
  }
  const vDays = new Set(normalizeAvailabilityDays(viewer.availability_days));
  const bDays = normalizeAvailabilityDays(buddy.availability_days);
  if (vDays.size && bDays.some((d) => vDays.has(d))) score += 12;
  const vSlots = new Set(normalizeAvailabilitySlots(viewer.availability_slots));
  const bSlots = normalizeAvailabilitySlots(buddy.availability_slots);
  if (vSlots.size && bSlots.some((s) => vSlots.has(s))) score += 8;
  if (buddy.updated_at) {
    const age = Date.now() - new Date(buddy.updated_at).getTime();
    if (Number.isFinite(age) && age < 7 * 86400000) score += 5;
  }
  return score;
}

export function sortBuddiesForViewer(rows, viewer = {}) {
  const list = Array.isArray(rows) ? [...rows] : [];
  list.sort((a, b) => {
    const d = buddyMatchScore(b, viewer) - buddyMatchScore(a, viewer);
    if (d !== 0) return d;
    const ta = new Date(a?.updated_at || 0).getTime();
    const tb = new Date(b?.updated_at || 0).getTime();
    return tb - ta;
  });
  return list;
}
