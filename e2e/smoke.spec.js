import { test, expect } from "@playwright/test";

/**
 * 5 smokes anti-régression — pas besoin de compte.
 * Contre staging : BASE_URL=https://staging.myswym.app npm run test:e2e
 */

test.describe("MySWYM smoke", () => {
  test("1. landing charge", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    // Brand / hero signal (EN ou FR selon locale)
    await expect(page.getByText(/MySWYM|natation|swim/i).first()).toBeVisible({ timeout: 20_000 });
  });

  test("2. /connexion affiche l’auth", async ({ page }) => {
    await page.goto("/connexion");
    await expect(page).toHaveURL(/\/connexion/);
    // Champs login typiques
    const email = page.locator('input[type="email"], input[name="email"], input[autocomplete="email"]').first();
    await expect(email).toBeVisible({ timeout: 20_000 });
  });

  test("3. /app boot sans écran blanc", async ({ page }) => {
    await page.goto("/app");
    await expect(page.locator("body")).toBeVisible();
    // Loading, onboarding ou shell app — pas une page vide 30s
    await expect(
      page.getByText(/Chargement|MySWYM|Objectif|Commencer|séance|Programme|Connexion|Inscription/i).first(),
    ).toBeVisible({ timeout: 25_000 });
  });

  test("4. page marketing tarifs / pricing", async ({ page }) => {
    await page.goto("/fr/tarifs");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/tarif|prix|Premium|essai|€|abonnement/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test("5. 404 lisible", async ({ page }) => {
    await page.goto("/fr/cette-page-nexiste-pas-myswym-smoke");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/404|introuvable|not found|page/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
