import { test, expect } from '@playwright/test';
import { resetUsers, loginViaApi } from './helpers';

// Feature: Admin Account Seeding on Startup (F-24)

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'changeme';

test.beforeEach(async ({ request }) => {
  await resetUsers(request);
});

test('Admin can log in after first startup with no existing admin', async ({ page, request }) => {
  const token = await loginViaApi(request, ADMIN_USERNAME, ADMIN_PASSWORD);
  expect(token).toBeTruthy();

  await page.goto('/');
  await page.fill('#username-input', ADMIN_USERNAME);
  await page.fill('#password-input', ADMIN_PASSWORD);
  await page.click('#login-button');
  await expect(page.locator('.user-management-panel')).toBeVisible();
});

test('A second startup does not create a duplicate admin when one already exists', async ({ page, request }) => {
  const token = await loginViaApi(request, ADMIN_USERNAME, ADMIN_PASSWORD);
  expect(token).toBeTruthy();

  await page.goto('/');
  await page.fill('#username-input', ADMIN_USERNAME);
  await page.fill('#password-input', ADMIN_PASSWORD);
  await page.click('#login-button');
  await expect(page.locator('.user-management-panel')).toBeVisible();

  const adminToken = await loginViaApi(request, ADMIN_USERNAME, ADMIN_PASSWORD);
  const response = await request.get('/api/admin/users', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const users: Array<{ id: number; username: string; role: string }> = await response.json();
  const adminUsers = users.filter((u) => u.role === 'ADMIN');
  expect(adminUsers).toHaveLength(1);
});
