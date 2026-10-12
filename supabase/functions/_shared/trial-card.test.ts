import assert from "node:assert/strict";
import { trialCardReuseDecision } from "./trial-card.ts";

Deno.test("carte inconnue : nouvel essai", () => {
  assert.equal(trialCardReuseDecision(null, "user-a"), "new");
});

Deno.test("même compte : on ne bloque pas", () => {
  assert.equal(trialCardReuseDecision("user-a", "user-a"), "same");
});

Deno.test("autre compte : essai déjà pris", () => {
  assert.equal(trialCardReuseDecision("user-a", "user-b"), "reuse");
});
