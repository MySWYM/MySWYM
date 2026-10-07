/**
 * Pastille rouge sur l’icône iOS (AppBadge plugin natif).
 * No-op hors iPhone natif.
 */
import { registerPlugin } from "@capacitor/core";
import { isNativeIos } from "./native-platform.js";

/** Instance unique (registerPlugin deux fois = avertissement Capacitor). */
export const AppBadge = registerPlugin("AppBadge");

export async function setAppIconBadge(count = 1) {
  if (!isNativeIos()) return { count: 0 };
  const n = Math.max(0, Math.floor(Number(count) || 0));
  try {
    return await AppBadge.set({ count: n });
  } catch {
    return { count: 0 };
  }
}

/** Efface la pastille et les notifs affichées dans le Centre de notifications. */
export async function clearAppIconBadge() {
  if (!isNativeIos()) return { count: 0 };
  try {
    return await AppBadge.clear();
  } catch {
    try {
      return await AppBadge.set({ count: 0 });
    } catch {
      return { count: 0 };
    }
  }
}
