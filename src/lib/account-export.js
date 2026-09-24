/**
 * Export RGPD côté client : identité + profil nageur déjà sur l’appareil.
 * Pas les semaines de plan (trop volumineux, régénérables).
 */
export function hasEmailPasswordProvider(user) {
  const ids = Array.isArray(user?.identities) ? user.identities : [];
  if (ids.length) return ids.some((i) => i?.provider === "email");
  const p = String(user?.app_metadata?.provider || "");
  return p === "email" || p === "";
}

export function buildAccountExportPayload({ user, profile } = {}, now = new Date()) {
  const injuries = Array.isArray(profile?.injuries)
    ? profile.injuries.map((i) => ({
      zone: i?.zone || null,
      severity: i?.severity || null,
    }))
    : [];
  return {
    exportedAt: now.toISOString(),
    email: user?.email || null,
    firstname: user?.user_metadata?.firstname || null,
    lastname: user?.user_metadata?.lastname || null,
    country: profile?.country || user?.user_metadata?.country || null,
    gender: profile?.gender || null,
    birthDay: profile?.birthDay ?? null,
    birthMonth: profile?.birthMonth ?? null,
    birthYear: profile?.birthYear ?? null,
    weightKg: profile?.weightKg ?? null,
    heightCm: profile?.heightCm ?? null,
    level: profile?.level || null,
    pool: profile?.pool ?? null,
    sessionsPerWeek: profile?.sessionsPerWeek ?? null,
    equipment: Array.isArray(profile?.equipment) ? profile.equipment : [],
    swimStyle: profile?.swimStyle || null,
    preferredStroke: profile?.preferredStroke || null,
    goal: profile?.goal || null,
    category: profile?.category || null,
    eventDate: profile?.eventDate || null,
    newsletter: user?.user_metadata?.newsletter_opt_in === true,
    injuryStatus: profile?.injuryStatus || null,
    injuries,
    injuryConsent: profile?.injuryConsent === true || profile?.healthConsent === true,
    heartRateConsent: profile?.heartRateConsent === true || profile?.healthConsent === true,
    healthConsent: profile?.healthConsent === true
      || profile?.injuryConsent === true
      || profile?.heartRateConsent === true,
  };
}

export function accountExportFilename(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `myswym-donnees-${y}${m}${d}.json`;
}

export async function downloadAccountExport(payload, opts = {}) {
  const filename = opts.filename || accountExportFilename();
  const text = `${JSON.stringify(payload || {}, null, 2)}\n`;
  if (typeof window === "undefined" || typeof document === "undefined") {
    return { ok: true, filename, shared: false, downloaded: false };
  }
  const blob = new Blob([text], { type: "application/json" });
  let shared = false;
  try {
    const nativeFile = new File([blob], filename, { type: "application/json" });
    const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || "");
    if (mobile && navigator.canShare?.({ files: [nativeFile] })) {
      await navigator.share({
        files: [nativeFile],
        title: "Données MySWYM",
      });
      shared = true;
      return { ok: true, filename, shared, downloaded: false };
    }
  } catch (e) {
    if (e?.name === "AbortError") return { ok: true, filename, shared: false, downloaded: false, aborted: true };
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => {
    try { URL.revokeObjectURL(url); } catch { /* ignore */ }
  }, 2000);
  return { ok: true, filename, shared, downloaded: true };
}
