function b64urlToB64(value: string) {
  const pad = "=".repeat((4 - (value.length % 4)) % 4);
  return value.replace(/-/g, "+").replace(/_/g, "/") + pad;
}

export function decodeJwsPayload(jws: string): Record<string, unknown> {
  const parts = String(jws || "").split(".");
  if (parts.length !== 3) throw new Error("JWS Apple invalide");
  const json = atob(b64urlToB64(parts[1]));
  const parsed = JSON.parse(json);
  if (!parsed || typeof parsed !== "object") throw new Error("Payload Apple invalide");
  return parsed as Record<string, unknown>;
}
