/**
 * Photo de profil, Storage bucket `avatars` + user_metadata.avatar_url.
 * Source de vérité cross-device : URL publique Supabase (pas localStorage seul).
 */
import { supabase } from "../supabase.js";
import {
  clearCachedAvatar,
  withAvatarCacheBust,
  writeCachedAvatar,
} from "./avatar-url.js";

export {
  avatarCacheKey,
  clearCachedAvatar,
  normalizeAvatarUrl,
  readCachedAvatar,
  resolveAvatarUrl,
  withAvatarCacheBust,
  writeCachedAvatar,
} from "./avatar-url.js";

export const AVATAR_BUCKET = "avatars";

/**
 * Compresse / normalise en JPEG max ~720 px (évite échecs HEIC / fichiers lourds).
 */
export async function prepareAvatarBlob(file, { maxSide = 720, quality = 0.85 } = {}) {
  if (!file) throw new Error("Aucune image sélectionnée");
  const type = String(file.type || "");
  if (/heic|heif/i.test(type)) {
    throw new Error("Format non supporté. Choisis une photo JPG ou PNG.");
  }

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    if (file.size < 2_000_000 && /^image\/(jpeg|jpg|png|webp)$/i.test(type)) {
      return { blob: file, contentType: type || "image/jpeg" };
    }
    throw new Error("Impossible de lire cette image. Essaye un JPG ou PNG.");
  }

  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close?.();
    throw new Error("Impossible de préparer la photo");
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Compression de la photo échouée"))),
      "image/jpeg",
      quality,
    );
  });
  return { blob, contentType: "image/jpeg" };
}

function publicAvatarPath(userId) {
  return `${userId}/avatar.jpg`;
}

async function uploadAvatarObject(userId, blob, contentType) {
  const path = publicAvatarPath(userId);
  const legacy = ["png", "webp"].map((ext) => `${userId}/avatar.${ext}`);

  await supabase.storage.from(AVATAR_BUCKET).remove([path, ...legacy]).catch(() => {});

  let { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, blob, {
    upsert: true,
    contentType,
    cacheControl: "3600",
  });

  if (error) {
    await supabase.storage.from(AVATAR_BUCKET).remove([path]).catch(() => {});
    ({ error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, blob, {
      upsert: false,
      contentType,
      cacheControl: "3600",
    }));
  }
  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return publicUrl;
}

/** Best-effort : met à jour le profil binôme s’il existe. */
async function syncBuddyAvatar(userId, avatarUrl) {
  try {
    await supabase
      .from("buddy_profiles")
      .update({ avatar_url: avatarUrl || null })
      .eq("user_id", userId);
  } catch { /* table / RLS, ne bloque pas le profil app */ }
}

/**
 * Upload Storage + user_metadata.avatar_url + cache local.
 * @returns {{ publicUrl: string, user: object|null }}
 */
export async function uploadAndPersistAvatar(userId, file) {
  if (!userId) throw new Error("Connexion requise pour enregistrer la photo");

  const { blob, contentType } = await prepareAvatarBlob(file);
  const publicUrl = await uploadAvatarObject(userId, blob, contentType);
  const persistedUrl = withAvatarCacheBust(publicUrl);

  const { data: updated, error: metaErr } = await supabase.auth.updateUser({
    data: { avatar_url: persistedUrl },
  });
  if (metaErr) throw metaErr;

  writeCachedAvatar(userId, persistedUrl);
  await syncBuddyAvatar(userId, persistedUrl);

  const { data: fresh } = await supabase.auth.getUser();
  return { publicUrl: persistedUrl, user: fresh?.user || updated?.user || null };
}

export async function removeAndPersistAvatar(userId) {
  if (!userId) throw new Error("Connexion requise");

  const paths = ["jpg", "png", "webp"].map((ext) => `${userId}/avatar.${ext}`);
  await supabase.storage.from(AVATAR_BUCKET).remove(paths).catch(() => {});

  const { data: updated, error: metaErr } = await supabase.auth.updateUser({
    data: { avatar_url: "" },
  });
  if (metaErr) throw metaErr;

  clearCachedAvatar(userId);
  await syncBuddyAvatar(userId, null);

  const { data: fresh } = await supabase.auth.getUser();
  return { user: fresh?.user || updated?.user || null };
}

/**
 * Si metadata + cache vides côté appelant : récupère l’objet Storage et backfill metadata.
 */
export async function hydrateAvatarFromStorage(userId) {
  if (!userId) return null;

  const { data: files, error } = await supabase.storage.from(AVATAR_BUCKET).list(userId, { limit: 10 });
  if (error || !Array.isArray(files) || files.length === 0) return null;

  const preferred =
    files.find((f) => f?.name === "avatar.jpg")
    || files.find((f) => /^avatar\.(jpg|jpeg|png|webp)$/i.test(f?.name || ""))
    || null;
  if (!preferred?.name) return null;

  const path = `${userId}/${preferred.name}`;
  const { data: { publicUrl } } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  const persistedUrl = withAvatarCacheBust(publicUrl);

  writeCachedAvatar(userId, persistedUrl);
  const { data: updated } = await supabase.auth.updateUser({ data: { avatar_url: persistedUrl } });
  await syncBuddyAvatar(userId, persistedUrl);
  return { publicUrl: persistedUrl, user: updated?.user || null };
}
