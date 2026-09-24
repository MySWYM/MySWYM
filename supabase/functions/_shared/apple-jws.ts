/**
 * Vérifie les JWS StoreKit 2 / App Store Server Notifications (x5c).
 * Deno n’implémente pas node:crypto X509Certificate.verify : @peculiar/x509.
 *
 * L’empreinte « G3 » historique du repo était celle d’Apple Inc Root, pas
 * Apple Root CA - G3. StoreKit 2 pose G3 en bout de chaîne.
 */
import { compactVerify, decodeProtectedHeader, importX509 } from "npm:jose@5";
import { X509Certificate } from "npm:@peculiar/x509@1.12.3";
import { decodeJwsPayload } from "./apple-jws-decode.ts";

export { decodeJwsPayload };

/** SHA-256 DER : Apple Inc Root Certificate. */
export const APPLE_INC_ROOT_SHA256 =
  "b0b1730ecbc7ff4505142c49f1295e6eda6bcaed7e2c68c5be91b5a11001f024";
/** SHA-256 DER : Apple Root CA - G2. */
export const APPLE_ROOT_CA_G2_SHA256 =
  "c2b9b042dd57830e7d117dac55ac8ae19407d38e41d88f3215bc3a890444a050";
/** SHA-256 DER : Apple Root CA - G3. */
export const APPLE_ROOT_CA_G3_SHA256 =
  "63343abfb89a6a03ebb57e9b3f5fa7be7c4f5c756f3017b3a8c488c3653e9179";

const TRUSTED_ROOT_SHA256 = new Set([
  APPLE_INC_ROOT_SHA256,
  APPLE_ROOT_CA_G2_SHA256,
  APPLE_ROOT_CA_G3_SHA256,
]);

/** Racines officielles apple.com/certificateauthority, si x5c s’arrête à l’intermédiaire. */
const TRUSTED_ROOT_X5C = [
  "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",
];

function derFromX5c(b64: string) {
  const bin = atob(String(b64).replace(/\s/g, ""));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function pemFromX5c(b64: string) {
  const body = String(b64).replace(/\s/g, "");
  const lines = body.match(/.{1,64}/g) ?? [body];
  return `-----BEGIN CERTIFICATE-----\n${lines.join("\n")}\n-----END CERTIFICATE-----\n`;
}

async function sha256Hex(bytes: BufferSource) {
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function isTrustedRootDer(der: Uint8Array) {
  return TRUSTED_ROOT_SHA256.has(await sha256Hex(der));
}

async function chainLinksToTrustedRoot(certs: X509Certificate[]) {
  const last = certs[certs.length - 1];
  const lastDer = new Uint8Array(last.rawData);
  if (await isTrustedRootDer(lastDer)) return true;
  for (const rootB64 of TRUSTED_ROOT_X5C) {
    const root = new X509Certificate(derFromX5c(rootB64));
    const ok = await last.verify({
      publicKey: root.publicKey,
      signatureOnly: true,
    });
    if (ok) return true;
  }
  return false;
}

export async function verifyAppleJws(jws: string): Promise<Record<string, unknown>> {
  const header = decodeProtectedHeader(jws);
  const x5c = header.x5c;
  if (!Array.isArray(x5c) || x5c.length < 2) {
    throw new Error("Chaîne de certificats Apple incomplète");
  }
  const ders = x5c.map((part) => derFromX5c(String(part)));
  const certs = ders.map((der) => new X509Certificate(der));
  for (let i = 0; i < certs.length - 1; i++) {
    const ok = await certs[i].verify({
      publicKey: certs[i + 1].publicKey,
      signatureOnly: true,
    });
    if (!ok) throw new Error("Chaîne de certificats Apple invalide");
  }
  const lastIsTrusted = await isTrustedRootDer(ders[ders.length - 1]);
  const anyTrusted = (await Promise.all(ders.map((der) => isTrustedRootDer(der)))).some(Boolean);
  if (!lastIsTrusted && !anyTrusted && !(await chainLinksToTrustedRoot(certs))) {
    throw new Error("Racine Apple inattendue");
  }
  const key = await importX509(pemFromX5c(String(x5c[0])), "ES256");
  const { payload } = await compactVerify(jws, key);
  return JSON.parse(new TextDecoder().decode(payload)) as Record<string, unknown>;
}
