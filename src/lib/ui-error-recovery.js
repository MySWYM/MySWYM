import { LEGAL_ENTITY } from "./legal-entity.js";

/** Code court pour le nageur / le support (ex. E-a3f2). */
export function makeUiErrorCode(message) {
  const s = String(message || "unknown");
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `E-${(h >>> 0).toString(16).slice(-4).padStart(4, "0")}`;
}

export function isNavigatorOffline() {
  try {
    return typeof navigator !== "undefined" && navigator.onLine === false;
  } catch {
    return false;
  }
}

/**
 * @param {{ code: string, message?: string, path?: string, appVersion?: string }} opts
 */
export function buildSupportMailto({ code, message = "", path = "", appVersion = "" }) {
  const email = LEGAL_ENTITY.supportEmail || "support@myswym.app";
  const subject = `MySWYM bug ${code}`;
  const lines = [
    `Code: ${code}`,
    path ? `Page: ${path}` : null,
    appVersion ? `Version: ${appVersion}` : null,
    message ? `Message: ${String(message).slice(0, 200)}` : null,
    "",
    "Décris ce que tu faisais :",
    "",
  ].filter((line) => line != null);
  const qs = new URLSearchParams({
    subject,
    body: lines.join("\n"),
  });
  return `mailto:${email}?${qs.toString()}`;
}

/**
 * Copy + actions selon offline / session.
 * @param {{ offline: boolean, hasUser: boolean, isAnonymous: boolean, errorCode: string }} ctx
 */
export function buildErrorStatusCopy(ctx) {
  const { offline, hasUser, isAnonymous, errorCode } = ctx;
  const showHome = hasUser || isAnonymous;
  const showLogin = !hasUser;
  const showRegister = !hasUser && !isAnonymous;

  if (offline) {
    return {
      title: "Pas de réseau",
      body: "Vérifie ta connexion, puis reviens à l’accueil. Ton plan reste sur cet appareil.",
      primaryLabel: showHome ? "Retour à l’accueil" : "Se connecter",
      primaryAction: showHome ? "home" : "login",
      note: null,
      showHome,
      showLogin,
      showRegister,
      meta: `Code ${errorCode}`,
    };
  }

  return {
    title: "L’écran a planté",
    body: "Reviens à l’accueil pour continuer. Si ça revient, envoie le code au support.",
    primaryLabel: showHome ? "Retour à l’accueil" : "Se connecter",
    primaryAction: showHome ? "home" : "login",
    note: isAnonymous || hasUser ? "Ton plan reste enregistré sur cet appareil." : null,
    showHome,
    showLogin,
    showRegister,
    meta: `Code ${errorCode}`,
  };
}
