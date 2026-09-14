/**
 * Cache identité par compte (pas de fuite via clés globales).
 * Usage : node src/lib/identity-cache.test.js
 */
import assert from "node:assert/strict";
import {
  readCachedFirstName,
  writeCachedFirstName,
  resolveDisplayFirstName,
  clearIdentityLocalCache,
} from "./identity-cache.js";
import {
  readCachedAvatar,
  writeCachedAvatar,
  resolveAvatarUrl,
} from "./avatar-url.js";

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: (k) => { store.delete(k); },
};

store.set("myswym_firstname", "Arthur");
store.set("myswym_avatar", "https://example.com/arthur.jpg");
assert.equal(readCachedFirstName("u-new"), "", "prénom : pas de fallback global");
assert.equal(readCachedAvatar("u-new"), null, "photo : pas de fallback global");
assert.equal(
  resolveAvatarUrl({ id: "u-new", user_metadata: {} }),
  null,
  "avatar metadata vide : pas la photo d’un autre compte",
);
assert.equal(
  resolveDisplayFirstName({ id: "u-new", email: "test@example.com", user_metadata: {} }),
  "test",
  "sans cache : email du compte, pas Arthur",
);

writeCachedFirstName("u-new", "Mina");
writeCachedAvatar("u-new", "https://example.com/mina.jpg");
assert.equal(store.get("myswym_firstname"), "Arthur", "écriture : ne pas écraser le global legacy");
assert.equal(store.get("myswym_avatar"), "https://example.com/arthur.jpg", "écriture avatar : pas de global");
assert.equal(readCachedFirstName("u-new"), "Mina");
assert.equal(readCachedAvatar("u-new"), "https://example.com/mina.jpg");

clearIdentityLocalCache("u-new");
assert.equal(readCachedFirstName("u-new"), "");
assert.equal(readCachedAvatar("u-new"), null);
assert.equal(store.get("myswym_firstname"), undefined, "logout : global prénom vidé");
assert.equal(store.get("myswym_avatar"), undefined, "logout : global photo vidé");

console.log("identity-cache.test.js ok");
