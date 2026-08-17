import assert from "node:assert/strict";
import { checkoutGatesReady, checkoutGatesError } from "./checkout-legal.js";

assert.equal(checkoutGatesReady(true, true), true);
assert.equal(checkoutGatesReady(true, false), false);
assert.equal(checkoutGatesReady(false, true), false);
assert.equal(checkoutGatesReady(false, false), false);

assert.equal(checkoutGatesError(true, true), null);

assert.match(
  checkoutGatesError(false, false),
  /CGV\/CGU.*L221-28/,
);

assert.match(
  checkoutGatesError(false, true),
  /CGV.*CGU/,
);

assert.match(
  checkoutGatesError(true, false),
  /L221-28/,
);

console.log("checkout-legal.test.js OK");
