import path from "path";
import { fileURLToPath } from "url";
import { test, expect } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_URL = process.env.APP_URL || "http://localhost:5173";

test.describe("theme visibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${APP_URL}/login`);
    // use dev credentials
    await page.fill('input[placeholder="you@company.com"]', "dev@example.com");
    await page.fill('input[placeholder="Enter your password"]', "password");
    await page.click('button:has-text("Login")');
    await page.waitForURL("**/dashboard");
  });

  const checkPages = async (page) => {
    // subscription
    await page.goto(`${APP_URL}/subscription`);
    await expect(page.locator('h1:has-text("Subscription")')).toBeVisible();
    await expect(page.locator("text=Current plan")).toBeVisible();

    // job search
    await page.goto(`${APP_URL}/job-search`);
    await expect(page.locator('h1:has-text("Job Search")')).toBeVisible();
    await expect(page.locator('input[placeholder^="Keywords"]')).toBeVisible();
    await expect(page.locator('input[placeholder^="Role"]')).toBeVisible();
  };

  test("light then dark theme pages render elements visibly", async ({
    page,
  }) => {
    // ensure starting theme is light: click toggle until it shows 'Dark'
    const toggle = page.locator('button[aria-label="toggle-theme"]');
    // If toggle shows 'Light' label, it means current theme is dark; click to go light
    const label = await toggle.textContent();
    if (label && label.includes("Light")) {
      await toggle.click();
      await page.waitForTimeout(200);
    }

    // check in light theme
    await checkPages(page);

    // switch to dark theme
    await toggle.click();
    await page.waitForTimeout(200);

    // check in dark theme
    await checkPages(page);
  });
});
