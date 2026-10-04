import assert from "node:assert/strict";
import {
  DEVICE_KEY_STORAGE,
  detectDeviceLabel,
  formatDeviceSeenAt,
  getOrCreateDeviceKey,
} from "./user-devices-meta.js";

{
  const store = {
    map: new Map(),
    getItem(k) { return this.map.has(k) ? this.map.get(k) : null; },
    setItem(k, v) { this.map.set(k, String(v)); },
  };
  const a = getOrCreateDeviceKey(store);
  const b = getOrCreateDeviceKey(store);
  assert.equal(a, b, "stable key");
  assert.ok(a.length >= 8, "key length");
  assert.equal(store.getItem(DEVICE_KEY_STORAGE), a, "persisted");
}

assert.equal(detectDeviceLabel({ platform: "ios" }), "iPhone");
assert.equal(detectDeviceLabel({ platform: "web", userAgent: "Mozilla/5.0 Chrome/120.0" }), "Chrome");
assert.equal(detectDeviceLabel({ platform: "web", userAgent: "Mozilla/5.0 Version/17 Safari/605.1.15" }), "Safari");

const now = 1_700_000_000_000;
assert.equal(formatDeviceSeenAt(new Date(now - 30_000).toISOString(), now), "now");
assert.equal(formatDeviceSeenAt(new Date(now - 5 * 60_000).toISOString(), now), "5m");
assert.equal(formatDeviceSeenAt(new Date(now - 3 * 3600_000).toISOString(), now), "3h");

console.log("user-devices.test.js: ok");
