import assert from "node:assert/strict";
import { appleTxOwnerDecision } from "./apple-tx-link.ts";

Deno.test("lié à un anonyme : transfert", () => {
  assert.equal(appleTxOwnerDecision({
    currentUserId: "real",
    linkedUserId: "anon",
    linkedUserIsAnonymous: true,
  }), "transfer");
});

Deno.test("lié à un vrai compte : 409", () => {
  assert.equal(appleTxOwnerDecision({
    currentUserId: "real",
    linkedUserId: "other",
    linkedUserIsAnonymous: false,
  }), "conflict");
});

Deno.test("même compte : ok", () => {
  assert.equal(appleTxOwnerDecision({
    currentUserId: "real",
    linkedUserId: "real",
    linkedUserIsAnonymous: false,
  }), "ok");
});
