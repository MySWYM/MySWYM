/** Messages OTP Buddy lisibles (réseau / rate limit / code). */
export function humanizeBuddyOtpError(raw) {
  const m = String(raw || "").trim();
  if (!m) return "Erreur vérification. Réessaie.";
  if (/fetch|network|Failed to fetch|Load failed|NetworkError|offline/i.test(m)) {
    return "Réseau indisponible. Vérifie ta connexion et réessaie.";
  }
  if (/timeout|délai|AbortError|TimeoutError/i.test(m)) {
    return "Le serveur met trop de temps. Réessaie dans un instant.";
  }
  if (/429|rate|trop de|too many/i.test(m)) {
    return "Trop de tentatives. Attends une minute avant de renvoyer un code.";
  }
  if (/expir/i.test(m)) return "Code expiré. Renvoie un nouveau code.";
  if (/invalide|invalid|incorrect|wrong/i.test(m)) return "Code incorrect. Vérifie et réessaie.";
  return m.slice(0, 180);
}
