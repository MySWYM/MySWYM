import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const html = path.join(dir, "index.html");
const ids = ["01-seance", "02-detail", "03-semaine", "04-materiel"];

const browser = await chromium.launch({
  executablePath: `${process.env.HOME}/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell`,
});
const page = await browser.newPage({
  viewport: { width: 1320, height: 2868 },
  deviceScaleFactor: 1,
});
await page.goto(`file://${html}`);
await page.evaluate(() => document.fonts.ready);

for (const id of ids) {
  const file = path.join(dir, "out", `${id}.png`);
  await page.locator(`[data-shot="${id}"]`).screenshot({ path: file });
  console.log(file);
}

await browser.close();
