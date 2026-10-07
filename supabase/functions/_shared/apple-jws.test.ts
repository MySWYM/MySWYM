/**
 * Run: deno test --allow-net supabase/functions/_shared/apple-jws.test.ts
 */
import { SignJWT } from "npm:jose@5";
import {
  BasicConstraintsExtension,
  Extension,
  X509CertificateGenerator,
} from "npm:@peculiar/x509@1.12.3";
import { verifyAppleJws } from "./apple-jws.ts";

const WWDR_OID = "1.2.840.113635.100.6.2.1";
const LEAF_OID = "1.2.840.113635.100.6.11.1";
const NOT_BEFORE = new Date("2020-01-01T00:00:00Z");
const NOT_AFTER = new Date("2035-01-01T00:00:00Z");
const SIGNED_DATE = Date.parse("2024-06-01T00:00:00Z");
const NULL_ASN1 = new Uint8Array([0x05, 0x00]);

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function derToB64(raw: ArrayBuffer) {
  const bytes = new Uint8Array(raw);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

async function sha256Hex(raw: ArrayBuffer) {
  const hash = await crypto.subtle.digest("SHA-256", raw);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function ecKeys() {
  return crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
}

async function makeChain(withLeafOid: boolean) {
  const rootKeys = await ecKeys();
  const interKeys = await ecKeys();
  const leafKeys = await ecKeys();
  const alg = { name: "ECDSA", hash: "SHA-256" } as const;
  const root = await X509CertificateGenerator.createSelfSigned({
    serialNumber: "01",
    name: "CN=Test Apple Root",
    notBefore: NOT_BEFORE,
    notAfter: NOT_AFTER,
    keys: rootKeys,
    signingAlgorithm: alg,
    extensions: [new BasicConstraintsExtension(true, 1, true)],
  });
  const intermediate = await X509CertificateGenerator.create({
    serialNumber: "02",
    subject: "CN=Test Apple WWDR",
    issuer: root.subject,
    notBefore: NOT_BEFORE,
    notAfter: NOT_AFTER,
    publicKey: interKeys.publicKey,
    signingKey: rootKeys.privateKey,
    signingAlgorithm: alg,
    extensions: [
      new BasicConstraintsExtension(true, 0, true),
      new Extension(WWDR_OID, false, NULL_ASN1),
    ],
  });
  const leafExtensions: Extension[] = [new BasicConstraintsExtension(false, undefined, true)];
  if (withLeafOid) leafExtensions.push(new Extension(LEAF_OID, false, NULL_ASN1));
  const leaf = await X509CertificateGenerator.create({
    serialNumber: "03",
    subject: "CN=Test StoreKit Leaf",
    issuer: intermediate.subject,
    notBefore: NOT_BEFORE,
    notAfter: NOT_AFTER,
    publicKey: leafKeys.publicKey,
    signingKey: interKeys.privateKey,
    signingAlgorithm: alg,
    extensions: leafExtensions,
  });
  const trusted = new Set([await sha256Hex(root.rawData)]);
  return { leaf, intermediate, root, leafKeys, trusted };
}

async function signJws(
  x5c: string[],
  privateKey: CryptoKey,
) {
  return await new SignJWT({
    bundleId: "app.myswym.ios",
    productId: "app.myswym.ios.premium.monthly",
    signedDate: SIGNED_DATE,
  })
    .setProtectedHeader({ alg: "ES256", x5c })
    .sign(privateKey);
}

async function expectThrow(run: () => Promise<unknown>, pattern: RegExp, msg: string) {
  try {
    await run();
  } catch (err) {
    const text = err instanceof Error ? err.message : String(err);
    assert(pattern.test(text), `${msg} (reçu: ${text})`);
    console.log("  ✓", msg);
    return;
  }
  throw new Error(msg);
}

const full = await makeChain(true);
const x5c3 = [derToB64(full.leaf.rawData), derToB64(full.intermediate.rawData), derToB64(full.root.rawData)];
const valid = await verifyAppleJws(await signJws(x5c3, full.leafKeys.privateKey), full.trusted);
assert(valid.productId === "app.myswym.ios.premium.monthly", "chaîne valide acceptée");
console.log("  ✓", "chaîne valide acceptée");

const short = await signJws(x5c3.slice(0, 2), full.leafKeys.privateKey);
await expectThrow(
  () => verifyAppleJws(short, full.trusted),
  /incomplète/,
  "chaîne de 2 certs refusée",
);

await expectThrow(
  async () => verifyAppleJws(await signJws(x5c3, full.leafKeys.privateKey)),
  /Racine Apple inattendue/,
  "racine hors empreintes Apple refusée",
);

const bare = await makeChain(false);
const x5cBare = [derToB64(bare.leaf.rawData), derToB64(bare.intermediate.rawData), derToB64(bare.root.rawData)];
await expectThrow(
  async () => verifyAppleJws(await signJws(x5cBare, bare.leafKeys.privateKey), bare.trusted),
  /Feuille Apple inattendue/,
  "feuille sans l'OID StoreKit refusée",
);

console.log("apple-jws.test.ts OK");
