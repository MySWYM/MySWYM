/**
 * Apple Santé (HealthKit) via plugin Capacitor local.
 */
import { registerPlugin } from "@capacitor/core";
import { isNativeIos } from "./native-platform.js";

const AppleHealth = registerPlugin("AppleHealth");

export async function appleHealthAvailable() {
  if (!isNativeIos()) return false;
  try {
    const result = await AppleHealth.status();
    return result?.available === true;
  } catch {
    return false;
  }
}

/** Feuille d’autorisation iOS. Le succès = l’utilisateur a validé le dialogue. */
export async function requestAppleHealth() {
  if (!isNativeIos()) {
    throw new Error("Apple Santé est disponible sur iPhone.");
  }
  const result = await AppleHealth.requestAuthorization();
  if (result?.ok !== true) {
    throw new Error("Autorisation Apple Santé refusée.");
  }
  return true;
}

/** Séances natation + dernière FC réellement lues dans Santé. */
export async function readAppleHealthSummary() {
  if (!isNativeIos()) {
    return { swimCount: 0, latestHeartRate: null, latestWorkoutAt: null };
  }
  const result = await AppleHealth.fetchSummary();
  const bpm = Number(result?.latestHeartRate);
  return {
    swimCount: Number(result?.swimCount) || 0,
    latestHeartRate: Number.isFinite(bpm) && bpm > 0 ? bpm : null,
    latestWorkoutAt: result?.latestWorkoutAt || null,
  };
}
