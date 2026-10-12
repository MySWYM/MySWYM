import assert from "node:assert/strict";
import { shouldCancelStripeTrial } from "./cancel-stripe-trial.ts";

Deno.test("essai Stripe avec customer : à annuler", () => {
  assert.equal(shouldCancelStripeTrial({
    access_status: "trial",
    billing_provider: "stripe",
    stripe_customer_id: "cus_1",
  } as never), true);
});

Deno.test("abo Stripe payé : ne pas toucher", () => {
  assert.equal(shouldCancelStripeTrial({
    access_status: "active",
    billing_provider: "stripe",
    stripe_customer_id: "cus_1",
  } as never), false);
});

Deno.test("essai Apple : ne pas annuler Stripe", () => {
  assert.equal(shouldCancelStripeTrial({
    access_status: "trial",
    billing_provider: "apple",
    stripe_customer_id: "cus_1",
  } as never), false);
});
