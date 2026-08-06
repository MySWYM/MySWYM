import { supabase } from "../supabase.js";

export const BUDDY_GOAL_CATEGORIES = [
  { id: "eau_libre", label: "Eau libre" },
  { id: "triathlon", label: "Triathlon" },
  { id: "progression", label: "Nager & progresser" },
  { id: "mixte", label: "Mixte" },
];

export const BUDDY_OUTING_TYPES = [
  { id: "open_water", label: "Sortie eau libre" },
  { id: "training", label: "Entraînement piscine" },
  { id: "safety", label: "Accompagnement sécurité" },
  { id: "discovery", label: "Découverte eau libre" },
];

const ALLOWED_OUTING_IDS = new Set(BUDDY_OUTING_TYPES.map((o) => o.id));

/** Normalise un ou plusieurs types de sortie vers un tableau unique non vide. */
export function normalizeOutingTypes(value, fallback = ["open_water"]) {
  const raw = Array.isArray(value) ? value : (value ? [value] : []);
  const unique = [...new Set(raw.filter((id) => ALLOWED_OUTING_IDS.has(id)))];
  return unique.length ? unique : [...fallback];
}

export function toggleOutingType(selected, id) {
  const current = normalizeOutingTypes(selected, []);
  if (current.includes(id)) {
    const next = current.filter((x) => x !== id);
    return next.length ? next : current; // au moins 1
  }
  return normalizeOutingTypes([...current, id]);
}

export const BUDDY_LEVELS = [
  { id: "découverte", label: "Découverte" },
  { id: "régulier", label: "Régulier" },
  { id: "sportif", label: "Sportif" },
  { id: "performance", label: "Performance" },
];

/** Jours de la semaine (ordre calendaire FR, lundi → dimanche). */
export const BUDDY_DAYS = [
  { id: "mon", short: "Lun", label: "Lundi" },
  { id: "tue", short: "Mar", label: "Mardi" },
  { id: "wed", short: "Mer", label: "Mercredi" },
  { id: "thu", short: "Jeu", label: "Jeudi" },
  { id: "fri", short: "Ven", label: "Vendredi" },
  { id: "sat", short: "Sam", label: "Samedi" },
  { id: "sun", short: "Dim", label: "Dimanche" },
];

/** Créneaux larges type journée. */
export const BUDDY_TIME_SLOTS = [
  { id: "morning", label: "Matin", hint: "6h–12h" },
  { id: "midday", label: "Midi", hint: "12h–14h" },
  { id: "afternoon", label: "Après-midi", hint: "14h–18h" },
  { id: "evening", label: "Soir", hint: "18h–22h" },
];

export const BUDDY_RADIUS_OPTIONS = [5, 10, 15, 25, 40, 60, 100];

const ALLOWED_DAY_IDS = new Set(BUDDY_DAYS.map((d) => d.id));
const ALLOWED_SLOT_IDS = new Set(BUDDY_TIME_SLOTS.map((s) => s.id));

export function normalizeIdList(value, allowed) {
  const raw = Array.isArray(value) ? value : [];
  return [...new Set(raw.filter((id) => allowed.has(id)))];
}

export function normalizeAvailabilityDays(value) {
  const order = BUDDY_DAYS.map((d) => d.id);
  const set = new Set(normalizeIdList(value, ALLOWED_DAY_IDS));
  return order.filter((id) => set.has(id));
}

export function normalizeAvailabilitySlots(value) {
  const order = BUDDY_TIME_SLOTS.map((s) => s.id);
  const set = new Set(normalizeIdList(value, ALLOWED_SLOT_IDS));
  return order.filter((id) => set.has(id));
}

export function toggleIdInList(selected, id, allowed) {
  const current = normalizeIdList(selected, allowed);
  if (current.includes(id)) return current.filter((x) => x !== id);
  return [...current, id];
}

export function toggleAvailabilityDay(selected, id) {
  return normalizeAvailabilityDays(toggleIdInList(selected, id, ALLOWED_DAY_IDS));
}

export function toggleAvailabilitySlot(selected, id) {
  return normalizeAvailabilitySlots(toggleIdInList(selected, id, ALLOWED_SLOT_IDS));
}

/** Libellé lisible : "Lun, Mer · Matin, Soir" */
export function formatAvailabilityLabel(days, slots) {
  const dayPart = normalizeAvailabilityDays(days)
    .map((id) => BUDDY_DAYS.find((d) => d.id === id)?.short)
    .filter(Boolean)
    .join(", ");
  const slotPart = normalizeAvailabilitySlots(slots)
    .map((id) => BUDDY_TIME_SLOTS.find((s) => s.id === id)?.label)
    .filter(Boolean)
    .join(", ");
  if (dayPart && slotPart) return `${dayPart} · ${slotPart}`;
  return dayPart || slotPart || "";
}

const BUDDY_SELECT = [
  "user_id",
  "display_name",
  "city",
  "radius_km",
  "level",
  "goal_category",
  "outing_types",
  "availability_days",
  "availability_slots",
  "availability",
  "bio",
  "whatsapp_e164",
  "is_discoverable",
  "avatar_url",
  "updated_at",
].join(", ");

/** Normalise un numéro FR/international en chiffres E.164 pour wa.me (sans +). */
export function normalizeWhatsAppE164(raw) {
  if (!raw) return null;
  let digits = String(raw).replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("0") && digits.length === 10) {
    digits = `33${digits.slice(1)}`;
  }
  if (digits.length === 9 && (digits.startsWith("6") || digits.startsWith("7"))) {
    digits = `33${digits}`;
  }
  if (digits.length < 10 || digits.length > 15) return null;
  return digits;
}

export function formatWhatsAppDisplay(e164) {
  if (!e164) return "";
  const d = e164.replace(/\D/g, "");
  if (d.startsWith("33") && d.length === 11) {
    return `+33 ${d.slice(2, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)} ${d.slice(9, 11)}`;
  }
  return `+${d}`;
}

export function buildWhatsAppLink(e164, { senderName, buddyName, city, outingLabel } = {}) {
  const digits = normalizeWhatsAppE164(e164);
  if (!digits) return null;

  const spot = city ? ` · ${city}` : "";
  const type = outingLabel ? ` (${outingLabel})` : "";
  const text = [
    `Salut ${buddyName || ""} !`.trim(),
    `Je t'ai trouvé sur MySWYM${type}${spot}.`,
    `${senderName ? `${senderName} — ` : ""}Je cherche un binôme pour une sortie — ça te dit ?`,
  ].join(" ");

  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function goalCategoryFromProfile(profile) {
  const cat = profile?.category;
  if (cat === "eau_libre" || cat === "triathlon" || cat === "progression") return cat;
  if (profile?.goal?.startsWith("open_water")) return "eau_libre";
  if (profile?.goal?.startsWith("triathlon")) return "triathlon";
  return "mixte";
}

export function defaultBuddyForm(user, trainingProfile) {
  const displayName =
    user?.user_metadata?.firstname
    || user?.user_metadata?.full_name?.split(" ")[0]
    || user?.email?.split("@")[0]
    || "Nageur";

  return {
    display_name: displayName,
    city: "",
    radius_km: 15,
    level: trainingProfile?.level || "régulier",
    goal_category: goalCategoryFromProfile(trainingProfile),
    outing_types: trainingProfile?.category === "eau_libre" ? ["open_water"] : ["training"],
    availability_days: [],
    availability_slots: [],
    bio: "",
    whatsapp_e164: "",
    is_discoverable: false,
    consent_whatsapp: false,
    avatar_url: user?.user_metadata?.avatar_url || "",
  };
}

export async function fetchOwnBuddyProfile(userId) {
  if (!userId) return { data: null, error: null };
  const { data, error } = await supabase
    .from("buddy_profiles")
    .select(BUDDY_SELECT)
    .eq("user_id", userId)
    .maybeSingle();
  return { data, error };
}

export async function fetchDiscoverableBuddies({ city, level, goalCategory, excludeUserId } = {}) {
  let q = supabase
    .from("buddy_profiles")
    .select(BUDDY_SELECT)
    .eq("is_discoverable", true)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (excludeUserId) q = q.neq("user_id", excludeUserId);
  if (city?.trim()) q = q.ilike("city", `%${city.trim()}%`);
  if (level) q = q.eq("level", level);
  if (goalCategory) q = q.eq("goal_category", goalCategory);

  const { data, error } = await q;
  return { data: data ?? [], error };
}

export async function upsertBuddyProfile(userId, form) {
  const whatsapp = form.is_discoverable ? normalizeWhatsAppE164(form.whatsapp_e164) : null;

  if (form.is_discoverable) {
    if (!form.consent_whatsapp) {
      return { data: null, error: { message: "Accepte la visibilité de ton numéro pour être visible." } };
    }
    if (!whatsapp) {
      return { data: null, error: { message: "Numéro WhatsApp invalide (ex. 06 12 34 56 78)." } };
    }
    if (!form.city?.trim()) {
      return { data: null, error: { message: "Indique ta ville ou zone de sortie." } };
    }
  }

  const availabilityDays = normalizeAvailabilityDays(form.availability_days);
  const availabilitySlots = normalizeAvailabilitySlots(form.availability_slots);
  const availabilityLabel = formatAvailabilityLabel(availabilityDays, availabilitySlots);
  const radius = Number(form.radius_km);
  const radiusKm = BUDDY_RADIUS_OPTIONS.includes(radius) ? radius : 15;

  const row = {
    user_id: userId,
    display_name: (form.display_name || "Nageur").trim().slice(0, 80),
    city: (form.city || "").trim().slice(0, 120),
    radius_km: radiusKm,
    level: form.level || null,
    goal_category: form.goal_category || "eau_libre",
    outing_types: normalizeOutingTypes(form.outing_types),
    availability_days: availabilityDays,
    availability_slots: availabilitySlots,
    availability: availabilityLabel || null,
    bio: (form.bio || "").trim().slice(0, 400) || null,
    whatsapp_e164: whatsapp,
    is_discoverable: !!form.is_discoverable,
    consent_whatsapp: !!form.consent_whatsapp,
    avatar_url: form.avatar_url || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("buddy_profiles")
    .upsert(row, { onConflict: "user_id" })
    .select(BUDDY_SELECT)
    .single();

  return { data, error };
}

export async function disableBuddyProfile(userId) {
  const { data, error } = await supabase
    .from("buddy_profiles")
    .update({
      is_discoverable: false,
      whatsapp_e164: null,
      consent_whatsapp: false,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select(BUDDY_SELECT)
    .maybeSingle();
  return { data, error };
}

export function labelForGoalCategory(id) {
  return BUDDY_GOAL_CATEGORIES.find((g) => g.id === id)?.label || id;
}

export function labelForOutingType(id) {
  return BUDDY_OUTING_TYPES.find((o) => o.id === id)?.label || id;
}

export function labelsForOutingTypes(value) {
  return normalizeOutingTypes(value).map(labelForOutingType);
}

export function labelForLevel(id) {
  return BUDDY_LEVELS.find((l) => l.id === id)?.label || id;
}
