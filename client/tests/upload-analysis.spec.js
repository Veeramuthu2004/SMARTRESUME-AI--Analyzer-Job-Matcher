import path from "path";
import { fileURLToPath } from "url";
import { test, expect } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_URL = process.env.APP_URL || "http://localhost:5173";

test("upload resume and analyze retains company", async ({ page }) => {
  await page.goto(`${APP_URL}/login`);
  await page.fill('input[placeholder="you@company.com"]', "dev@example.com");
  await page.fill('input[placeholder="Enter your password"]', "password");
  await page.click('button:has-text("Login")');
  await page.waitForURL("**/dashboard");

  await page.goto(`${APP_URL}/upload`);

  // attach test resume
  const filePath = path.resolve(__dirname, "..", "test-resume.txt");
  await page.setInputFiles("input[type=file]", filePath);

  await page.fill(
    'input[placeholder^="Target role"]',
    "Senior Frontend Engineer",
  );
  await page.fill(
    'textarea[placeholder^="Paste the job description"]',
    "Company: Acme Corporation\nWe are seeking a Senior Frontend Engineer.",
  );

  await page.click('button:has-text("Analyze Resume")');

  // wait for navigation to analysis page
  await page.waitForURL("**/analysis**");
  const content = await page.textContent("body");
  expect(content).toContain("Acme Corporation");
});
