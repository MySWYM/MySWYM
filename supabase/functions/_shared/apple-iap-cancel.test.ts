import assert from "node:assert/strict";
import { preservedAppleCancelAtPeriodEnd } from "./apple-iap.ts";

const ENDS_MS = Date.parse("2026-10-19T10:00:00.000Z");
const ENDS_ISO = new Date(ENDS_MS).toISOString();

const current = {
  user_id: "u1",
  access_status: "trial" as const,
  trial_started_at: "2026-10-12T10:00:00.000Z",
  trial_ends_at: ENDS_ISO,
  trial_used: true,
  subscription_started_at: "2026-10-12T10:00:00.000Z",
  subscription_ends_at: ENDS_ISO,
  cancel_at_period_end: true,
  stripe_customer_id: null,
  billing_provider: "apple" as const,
  apple_original_transaction_id: "orig-1",
  apple_product_id: "app.myswym.ios.premium.monthly",
  apple_environment: "Sandbox",
};

Deno.test("même période déjà arrêtée : on garde l'arrêt", () => {
  assert.equal(preservedAppleCancelAtPeriodEnd(current, {
    originalTransactionId: "orig-1",
    expiresDate: ENDS_MS,
  }), true);
});

Deno.test("nouvelle période : le renouvellement a eu lieu", () => {
  assert.equal(preservedAppleCancelAtPeriodEnd(current, {
    originalTransactionId: "orig-1",
    expiresDate: ENDS_MS + 7 * 86400000,
  }), false);
});

Deno.test("autre transaction : on ne reprend pas l'arrêt", () => {
  assert.equal(preservedAppleCancelAtPeriodEnd(current, {
    originalTransactionId: "orig-2",
    expiresDate: ENDS_MS,
  }), false);
});

Deno.test("ligne vide : pas d'arrêt à conserver", () => {
  assert.equal(preservedAppleCancelAtPeriodEnd(null, {
    originalTransactionId: "orig-1",
    expiresDate: ENDS_MS,
  }), false);
});
