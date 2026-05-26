let chromiumModule;
try {
  chromiumModule = require("playwright");
} catch (e) {
  // fallback to workspace-local installation under client/node_modules
  chromiumModule = require("../client/node_modules/playwright");
}
const { chromium } = chromiumModule;
(async () => {
  const ADMIN_EMAIL =
    process.env.DEV_ADMIN_EMAIL ||
    process.env.ADMIN_EMAIL ||
    "admin@example.com";
  const ADMIN_PASS =
    process.env.DEV_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || "Admin@123";
  const BASE = process.env.APP_URL || "http://localhost:5173";

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    console.log("Navigating to", BASE + "/admin/login");
    await page.goto(BASE + "/admin/login", { waitUntil: "networkidle" });
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    const url = page.url();
    console.log("Final URL:", url);
    if (url.includes("/admin") || url.includes("/admin/dashboard")) {
      console.log(
        "Admin login flow appears to have succeeded (redirected to admin).",
      );
      process.exit(0);
    } else {
      console.log("Admin login did not redirect to admin dashboard.");
      process.exit(2);
    }
  } catch (e) {
    console.error("E2E script failed:", e.message || e);
    process.exit(3);
  } finally {
    await browser.close();
  }
})();
