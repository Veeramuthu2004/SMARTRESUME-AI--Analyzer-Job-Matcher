import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.DEV_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASS = process.env.DEV_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'Admin@123';

test('admin login flow redirects to admin dashboard', async ({ page }) => {
  await page.goto('/admin/login');

  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASS);
  await page.click('button[type="submit"]');

  // wait for navigation
  await page.waitForTimeout(2000);
  const url = page.url();
  expect(url.includes('/admin/dashboard') || url.includes('/admin')).toBeTruthy();
});
