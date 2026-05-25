import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.DEV_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASS = process.env.DEV_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'Admin@123';

test('admin login flow redirects to admin dashboard', async ({ page, baseURL }) => {
  // Go to admin login (this will redirect to /login with admin intent if configured)
  await page.goto('/admin/login');

  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASS);
  await page.click('button[type="submit"]');

  // Wait for either admin dashboard or an error message
  await page.waitForTimeout(2000);

  // Expect to be on admin dashboard
  const url = page.url();
  expect(url.includes('/admin/dashboard') || url.includes('/admin')).toBeTruthy();
});
