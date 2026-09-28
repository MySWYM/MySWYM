/** Extrait l’id connexion depuis le retour RPC Supabase. */
export function buddyConnectionId(data) {
  if (!data) return "";
  if (typeof data === "string") return data;
  if (Array.isArray(data)) return buddyConnectionId(data[0]);
  return String(data.id || "").trim();
}
