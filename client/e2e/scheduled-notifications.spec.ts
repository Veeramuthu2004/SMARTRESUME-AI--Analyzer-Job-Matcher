import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.DEV_ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASS = process.env.DEV_ADMIN_PASSWORD || 'Admin@123';

test('schedule notification is delivered and appears in admin UI', async ({ page }) => {
  // login
  await page.goto('/login');
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASS);
  await page.click('button:has-text("Login")');
  await page.waitForURL('/admin/dashboard');

  // go to notifications
  await page.goto('/admin/notifications');
  await expect(page.locator('h1')).toHaveText(/Admin — Notifications/);

  // schedule a notification a few seconds in the future
  const due = new Date(Date.now() + 5000).toISOString().slice(0,16);
  await page.fill('input[type="datetime-local"]', due);
  await page.fill('input[placeholder="Notification title"]', 'E2E scheduled ' + Date.now());
  await page.fill('textarea[placeholder="Notification message"]', 'E2E message');
  await page.click('button:has-text("Schedule notification")');

  // confirm toast
  await expect(page.locator('text=Notification scheduled')).toBeVisible({ timeout: 5000 });

  // wait for scheduled delivery: should appear in list
  await page.waitForTimeout(7000);

  // check notification list contains the message
  await expect(page.locator('text=E2E message')).toBeVisible({ timeout: 5000 });
});
