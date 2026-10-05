/**
 * Vérifie les JWS StoreKit 2 / App Store Server Notifications (x5c).
 * Deno n'implémente pas node:crypto X509Certificate.verify : @peculiar/x509.
 *
 * L'empreinte « G3 » historique du repo était celle d'Apple Inc Root, pas
 * Apple Root CA - G3. StoreKit 2 pose G3 en bout de chaîne (feuille,
 * intermédiaire, racine). Une racine Apple ailleurs dans la chaîne ne suffit pas.
 */
import { compactVerify, decodeProtectedHeader, importX509 } from "npm:jose@5";
import { BasicConstraintsExtension, X509Certificate } from "npm:@peculiar/x509@1.12.3";
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

/** Intermédiaire Apple WWDR (App Store). */
const APPLE_WWDR_INTERMEDIATE_OID = "1.2.840.113635.100.6.2.1";
/** Feuille StoreKit / reçus App Store. */
const APPLE_STOREKIT_LEAF_OID = "1.2.840.113635.100.6.11.1";

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

function hasOid(cert: X509Certificate, oid: string) {
  return cert.extensions.some((ext) => ext.type === oid);
}

function assertValidAt(cert: X509Certificate, at: Date) {
  const t = at.getTime();
  if (cert.notBefore.getTime() > t || cert.notAfter.getTime() < t) {
    throw new Error("Certificat Apple hors validité");
  }
}

/**
 * `trustedRootSha256` ne sert qu'aux tests (racine générée).
 * En prod, seul le set des empreintes Apple est utilisé.
 */
export async function verifyAppleJws(
  jws: string,
  trustedRootSha256: ReadonlySet<string> = TRUSTED_ROOT_SHA256,
): Promise<Record<string, unknown>> {
  const header = decodeProtectedHeader(jws);
  const x5c = header.x5c;
  if (!Array.isArray(x5c) || x5c.length !== 3) {
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
  const rootIsTrusted = trustedRootSha256.has(await sha256Hex(ders[2]));
  if (!rootIsTrusted) throw new Error("Racine Apple inattendue");

  const intermediate = certs[1];
  const ca = intermediate.getExtension(BasicConstraintsExtension);
  if (!ca?.ca || !hasOid(intermediate, APPLE_WWDR_INTERMEDIATE_OID)) {
    throw new Error("Intermédiaire Apple inattendu");
  }
  if (!hasOid(certs[0], APPLE_STOREKIT_LEAF_OID)) {
    throw new Error("Feuille Apple inattendue");
  }

  const key = await importX509(pemFromX5c(String(x5c[0])), "ES256");
  const { payload } = await compactVerify(jws, key);
  const body = JSON.parse(new TextDecoder().decode(payload)) as Record<string, unknown>;
  const signedMs = body.signedDate;
  if (typeof signedMs !== "number" || !Number.isFinite(signedMs)) {
    throw new Error("signedDate Apple manquante");
  }
  const at = new Date(signedMs);
  for (const cert of certs) assertValidAt(cert, at);
  return body;
}
