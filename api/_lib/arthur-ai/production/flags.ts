/**
 * Feature flags Arthur AI (Phase G) — env only, defaults sûrs.
 * Les envois auto restent OFF sauf validation explicite (ARTHUR_FOLLOWUPS_SEND).
 */

function envFlag(name: string, defaultOn: boolean): boolean {
  const raw = (process.env[name] || "").trim().toLowerCase();
  if (!raw) return defaultOn;
  if (["0", "false", "off", "no"].includes(raw)) return false;
  if (["1", "true", "on", "yes"].includes(raw)) return true;
  return defaultOn;
}

export interface ArthurFeatureFlags {
  enabled: boolean;
  web: boolean;
  instagram: boolean;
  tools_write: boolean;
  optimization: boolean;
  offline_force: boolean;
  human_takeover_all: boolean;
  /** Shadow Instagram (défaut on) — pas d’envoi auto DM. */
  shadow_instagram: boolean;
  /** Toujours false sauf ARTHUR_FOLLOWUPS_SEND=1 (validation explicite). */
  followups_send: boolean;
  /** Live IG send — défaut off ; exige aussi shadow=off. */
  instagram_live_send: boolean;
}

export function getArthurFeatureFlags(): ArthurFeatureFlags {
  const enabled = envFlag("ARTHUR_FLAG_ENABLED", true);
  const shadow_instagram = envFlag("ARTHUR_FLAG_SHADOW_INSTAGRAM", true);
  return {
    enabled,
    web: enabled && envFlag("ARTHUR_FLAG_WEB", true),
    instagram: enabled && envFlag("ARTHUR_FLAG_INSTAGRAM", true),
    tools_write: enabled && envFlag("ARTHUR_FLAG_TOOLS_WRITE", true),
    optimization: enabled && envFlag("ARTHUR_FLAG_OPTIMIZATION", true),
    offline_force: envFlag("ARTHUR_FLAG_OFFLINE", false),
    human_takeover_all: envFlag("ARTHUR_FLAG_HUMAN_TAKEOVER_ALL", false),
    shadow_instagram,
    followups_send: process.env.ARTHUR_FOLLOWUPS_SEND === "1",
    instagram_live_send: process.env.ARTHUR_INSTAGRAM_LIVE_SEND === "1",
  };
}

export function assertChannelEnabled(
  channel: "web" | "instagram",
  flags = getArthurFeatureFlags(),
): { ok: true } | { ok: false; reason: string } {
  if (!flags.enabled) {
    return { ok: false, reason: "arthur_disabled" };
  }
  if (channel === "web" && !flags.web) {
    return { ok: false, reason: "web_disabled" };
  }
  if (channel === "instagram" && !flags.instagram) {
    return { ok: false, reason: "instagram_disabled" };
  }
  return { ok: true };
}
