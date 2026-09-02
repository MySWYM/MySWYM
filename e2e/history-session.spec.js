import { test, expect } from "@playwright/test";

test("historique : relire une séance passée sans re-valider", async ({ page }) => {
  await page.goto("/e2e/history-session-preview.html");
  const dialog = page.getByRole("dialog", { name: /Séance passée/ });
  await expect(dialog).toBeVisible({ timeout: 20_000 });
  await expect(dialog.getByText("Séance n°1")).toBeVisible();
  await expect(dialog.getByText(/Échauffement|Corps|Retour/i).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Suivre au bassin" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copier", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Je l’ai faite|Je l'ai faite/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Terminée" })).toHaveCount(0);

  await page.getByRole("button", { name: "Suivre au bassin" }).click();
  await expect(page.getByRole("dialog", { name: "Mode bassin" })).toBeVisible();
  await page.getByRole("button", { name: "Quitter le mode bassin" }).click();
  await expect(page.getByRole("dialog", { name: "Mode bassin" })).toHaveCount(0);
  await expect(dialog).toBeVisible();
});
