import assert from "node:assert/strict";
import {
  hashHasRecoveryType,
  locationSignalsPasswordRecovery,
  searchHasPasswordResetFlag,
} from "./password-recovery-intent.js";

assert.equal(searchHasPasswordResetFlag("?reset=1"), true);
assert.equal(searchHasPasswordResetFlag("reset=1"), true);
assert.equal(searchHasPasswordResetFlag("?reset=0"), false);
assert.equal(searchHasPasswordResetFlag(""), false);

assert.equal(hashHasRecoveryType("#access_token=x&type=recovery&refresh_token=y"), true);
assert.equal(hashHasRecoveryType("#type=signup"), false);
assert.equal(hashHasRecoveryType(""), false);

assert.equal(
  locationSignalsPasswordRecovery({ search: "?foo=1", hash: "#type=recovery" }),
  true,
);
assert.equal(
  locationSignalsPasswordRecovery({ search: "?reset=1", hash: "" }),
  true,
);
assert.equal(
  locationSignalsPasswordRecovery({ search: "", hash: "#access_token=x" }),
  false,
);

console.log("password-recovery-intent.test.js: ok");
