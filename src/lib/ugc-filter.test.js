import assert from "node:assert/strict";
import { findObjectionable } from "./ugc-filter.js";

assert.equal(findObjectionable("Je prépare un 2,5 km"), null);
assert.equal(findObjectionable("J’habite Nantes"), null);
assert.ok(findObjectionable("quel connard"));
assert.equal(findObjectionable(""), null);

console.log("ugc-filter.test.js OK");
