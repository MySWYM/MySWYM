import { supabase } from "../supabase.js";
import { requirePaidBuddies } from "./buddy-access.js";
import { sortBuddiesForViewer } from "./buddy-match-rank.js";
import { humanizeBuddyOtpError } from "./buddy-otp-messages.js";

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
  { id: "régulier", label: "Débutant" },
  { id: "sportif", label: "Intermédiaire" },
  { id: "performance", label: "Avancé" },
  { id: "découverte", label: "Découverte" },
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

export const BUDDY_RADIUS_OPTIONS = [5, 10, 15, 25, 40, 60, 999];

export function formatRadiusLabel(value) {
  const radius = Number(value);
  if (radius >= 999) return "Aucune limite";
  return `${radius || 15} km`;
}

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

/** Colonnes lisibles par le propriétaire uniquement (RLS). */
const BUDDY_OWN_SELECT = [
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
  "consent_whatsapp",
  "phone_share_ready",
  "phone_verified",
  "avatar_url",
  "updated_at",
].join(", ");

/** Annuaire public : jamais de numéro. */
const BUDDY_PUBLIC_FIELDS = [
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
  "is_discoverable",
  "avatar_url",
  "updated_at",
];

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
  const goal = typeof profile?.goal === "string" ? profile.goal : "";
  if (goal.startsWith("open_water")) return "eau_libre";
  if (goal.startsWith("triathlon")) return "triathlon";
  return "mixte";
}

function asBuddyRows(data) {
  return Array.isArray(data) ? data : [];
}

export function defaultBuddyForm(user, trainingProfile) {
  const metaName = user?.user_metadata?.firstname;
  const fullName = user?.user_metadata?.full_name;
  const emailName = typeof user?.email === "string" ? user.email.split("@")[0] : "";
  const displayName = (
    (typeof metaName === "string" && metaName.trim())
    || (typeof fullName === "string" && fullName.trim().split(" ")[0])
    || emailName
    || "Nageur"
  );

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
    /** Consentement de principe à partager le n° après match mutuel (≠ publication publique). */
    phone_share_ready: false,
    phone_verified: false,
    phone_ownership_ack: false,
    avatar_url: user?.user_metadata?.avatar_url || "",
  };
}

export async function fetchOwnBuddyProfile(userId) {
  if (!userId) return { data: null, error: null };
  const { data, error } = await supabase
    .from("buddy_profiles")
    .select(BUDDY_OWN_SELECT)
    .eq("user_id", userId)
    .maybeSingle();
  return { data, error };
}

/**
 * Annuaire public (sans numéro affiché) — RPC security definer.
 * Visibilité = publié + ville + numéro prêt (phone_share_ready + whatsapp).
 * Fallback : mêmes filtres si la RPC n'est pas encore déployée.
 */
export async function fetchDiscoverableBuddies({
  city,
  level,
  goalCategory,
  excludeUserId,
  viewerProfile = null,
} = {}) {
  const gate = await requirePaidBuddies();
  if (!gate.ok) return { data: [], error: gate.error };

  const { data, error } = await supabase.rpc("get_buddy_directory", {
    p_city: city?.trim() || null,
    p_level: level || null,
    p_goal: goalCategory || null,
    p_limit: 50,
  });

  if (!error) {
    const rows = asBuddyRows(data).map(stripPhoneFromBuddy);
    const filtered = excludeUserId
      ? rows.filter((r) => r.user_id !== excludeUserId)
      : rows;
    return { data: sortBuddiesForViewer(filtered, viewerProfile || {}), error: null };
  }

  // Fallback legacy — colonnes publiques uniquement ; filtre numéro sans le sélectionner
  let q = supabase
    .from("buddy_profiles")
    .select(BUDDY_PUBLIC_FIELDS.join(", "))
    .eq("is_discoverable", true)
    .eq("phone_share_ready", true)
    .not("whatsapp_e164", "is", null)
    .neq("city", "")
    .order("updated_at", { ascending: false })
    .limit(50);

  if (excludeUserId) q = q.neq("user_id", excludeUserId);
  if (city?.trim()) q = q.ilike("city", `%${city.trim()}%`);
  if (level) q = q.eq("level", level);
  if (goalCategory) q = q.eq("goal_category", goalCategory);

  const fallback = await q;
  return {
    data: sortBuddiesForViewer(asBuddyRows(fallback.data).map(stripPhoneFromBuddy), viewerProfile || {}),
    error: fallback.error,
  };
}

function stripPhoneFromBuddy(row) {
  if (!row || typeof row !== "object") return row;
  const { whatsapp_e164: _w, consent_whatsapp: _c, phone_share_ready: _p, ...safe } = row;
  return safe;
}

export async function upsertBuddyProfile(userId, form) {
  const gate = await requirePaidBuddies();
  if (!gate.ok) return { data: null, error: gate.error };

  const whatsapp = normalizeWhatsAppE164(form.whatsapp_e164);
  const discoverable = !!form.is_discoverable;
  const phoneShareReady = !!form.phone_share_ready;

  if (discoverable && !form.city?.trim()) {
    return { data: null, error: { message: "Indique ta ville ou zone de sortie." } };
  }

  // Publier = apparaître dans l’annuaire → ville + numéro prêt + consentement.
  // Le numéro n’est jamais affiché dans l’annuaire ; uniquement révélé après match mutuel.
  if (discoverable) {
    if (!phoneShareReady) {
      return {
        data: null,
        error: { message: "Pour publier ton profil, enregistre un numéro et accepte le consentement de partage." },
      };
    }
    if (!whatsapp) {
      return { data: null, error: { message: "Numéro invalide (ex. 06 12 34 56 78)." } };
    }
    if (!form.phone_ownership_ack && !form.phone_verified) {
      return {
        data: null,
        error: { message: "Confirme que ce numéro t’appartient avant de publier ton profil." },
      };
    }
  } else if (phoneShareReady) {
    if (!whatsapp) {
      return { data: null, error: { message: "Numéro invalide (ex. 06 12 34 56 78)." } };
    }
    if (!form.phone_ownership_ack && !form.phone_verified) {
      return {
        data: null,
        error: { message: "Confirme que ce numéro t’appartient avant de l’enregistrer pour le partage." },
      };
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
    // Privé : jamais exposé via annuaire / RLS publique
    whatsapp_e164: phoneShareReady ? whatsapp : null,
    is_discoverable: discoverable,
    // Legacy column + nouvelle : consentement de principe (≠ publication)
    consent_whatsapp: phoneShareReady,
    phone_share_ready: phoneShareReady,
    avatar_url: form.avatar_url || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("buddy_profiles")
    .upsert(row, { onConflict: "user_id" })
    .select(BUDDY_OWN_SELECT)
    .single();

  return { data, error };
}

export async function disableBuddyProfile(userId) {
  const { data, error } = await supabase
    .from("buddy_profiles")
    .update({
      is_discoverable: false,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select(BUDDY_OWN_SELECT)
    .maybeSingle();
  return { data, error };
}

/** Masque le numéro partout et retire de l’annuaire (plus de gate téléphone). */
export async function clearBuddyPhone(userId) {
  const { data, error } = await supabase
    .from("buddy_profiles")
    .update({
      whatsapp_e164: null,
      consent_whatsapp: false,
      phone_share_ready: false,
      phone_verified: false,
      is_discoverable: false,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select(BUDDY_OWN_SELECT)
    .maybeSingle();
  return { data, error };
}

async function callBuddyPhoneOtp(body) {
  try {
    const { data: refreshData } = await supabase.auth.refreshSession();
    const session = refreshData?.session;
    if (!session) return { data: null, error: { message: "Connecte-toi d’abord." } };
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/buddy-phone-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        data: null,
        error: { message: humanizeBuddyOtpError(json.error || `Erreur HTTP ${res.status}`) },
      };
    }
    return { data: json, error: null };
  } catch (err) {
    const raw = err?.name === "TimeoutError" || err?.name === "AbortError"
      ? "Délai dépassé"
      : (err?.message || "network");
    return { data: null, error: { message: humanizeBuddyOtpError(raw) } };
  }
}

/** Envoie un code (SMS si Twilio, sinon e-mail compte). */
export async function sendBuddyPhoneOtp(phoneRaw) {
  const phone = normalizeWhatsAppE164(phoneRaw);
  if (!phone) return { data: null, error: { message: "Numéro invalide (ex. 06 12 34 56 78)." } };
  return callBuddyPhoneOtp({ action: "send", phone });
}

/** Confirme le code → phone_verified. */
export async function confirmBuddyPhoneOtp(phoneRaw, code) {
  const phone = normalizeWhatsAppE164(phoneRaw);
  if (!phone) return { data: null, error: { message: "Numéro invalide." } };
  return callBuddyPhoneOtp({ action: "confirm", phone, code });
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
