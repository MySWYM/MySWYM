import assert from "node:assert/strict";
import {
  buildErrorStatusCopy,
  buildSupportMailto,
  makeUiErrorCode,
} from "./ui-error-recovery.js";

const a = makeUiErrorCode("Cannot read properties of null");
const b = makeUiErrorCode("Cannot read properties of null");
const c = makeUiErrorCode("other");
assert.match(a, /^E-[0-9a-f]{4}$/);
assert.equal(a, b, "stable hash");
assert.notEqual(a, c, "different messages differ");

const mail = buildSupportMailto({
  code: "E-abcd",
  message: "boom",
  path: "/app",
  appVersion: "1.2.3",
});
assert.ok(mail.startsWith("mailto:support@myswym.app?"));
assert.ok(mail.includes("E-abcd"));
assert.ok(mail.includes("%2Fapp") || mail.includes("/app"));

const offline = buildErrorStatusCopy({
  offline: true,
  hasUser: true,
  isAnonymous: false,
  errorCode: "E-abcd",
});
assert.equal(offline.title, "Pas de réseau");
assert.equal(offline.primaryLabel, "Retour à l’accueil");
assert.equal(offline.primaryAction, "home");
assert.equal(offline.showRegister, false);

const anon = buildErrorStatusCopy({
  offline: false,
  hasUser: true,
  isAnonymous: true,
  errorCode: "E-abcd",
});
assert.equal(anon.title, "L’écran a planté");
assert.equal(anon.primaryLabel, "Retour à l’accueil");
assert.ok(anon.note);
assert.equal(anon.showRegister, false, "anonymous: no create-account CTA");

const guest = buildErrorStatusCopy({
  offline: false,
  hasUser: false,
  isAnonymous: false,
  errorCode: "E-abcd",
});
assert.equal(guest.primaryLabel, "Se connecter");
assert.equal(guest.showLogin, true);
assert.equal(guest.showRegister, true);

console.log("ui-error-recovery.test.js: ok");
