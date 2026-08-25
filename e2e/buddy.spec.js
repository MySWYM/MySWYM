import { test, expect } from "@playwright/test";

/**
 * Buddy — parcours auth optionnel.
 * Sans E2E_EMAIL / E2E_PASSWORD : skip (pas de compte en CI publique).
 *
 * Exemple :
 *   E2E_EMAIL=… E2E_PASSWORD=… BASE_URL=https://staging.myswym.app npm run test:e2e -- e2e/buddy.spec.js
 */

const email = process.env.E2E_EMAIL || "";
const password = process.env.E2E_PASSWORD || "";
const hasCreds = Boolean(email && password);

test.describe("Buddy (auth)", () => {
  test.skip(!hasCreds, "Définir E2E_EMAIL et E2E_PASSWORD pour ce smoke");

  test("connexion → app → onglet Binômes ou profil", async ({ page }) => {
    await page.goto("/connexion");
    await page.locator('input[type="email"]').first().fill(email);
    await page.locator('input[type="password"]').first().fill(password);
    await page.getByRole("button", { name: /Se connecter|Log in/i }).click();

    await expect(page).toHaveURL(/\/app/, { timeout: 30_000 });
    await expect(page.locator("body")).toBeVisible();

    // Bottom nav Binômes (après ≥1 séance) OU menu / profil comme filet
    const buddiesNav = page.getByRole("button", { name: /Binômes/i });
    if (await buddiesNav.isVisible().catch(() => false)) {
      await buddiesNav.click();
      await expect(
        page.getByText(/binôme|eau libre|téléphone|Premium|abonn/i).first(),
      ).toBeVisible({ timeout: 15_000 });
      return;
    }

    // Compte sans séance validée : l’onglet peut être masqué — au moins l’app a booté
    await expect(
      page.getByText(/Accueil|Programme|Profil|Home|Plan|séance/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  });
});
