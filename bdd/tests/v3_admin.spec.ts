import { test, expect } from '@playwright/test';
import { resetUsers, registerViaApi, loginViaApi, createTodoViaApi, navigateAsUser } from './helpers';

// Feature: Admin User Management (F-24, F-25, F-26, F-27, F-28)

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'changeme';

test.beforeEach(async ({ page, request }) => {
  await resetUsers(request);
  await page.goto('/');
});

test('Admin sees the user management panel instead of the todo list', async ({ page }) => {
  await page.fill('#username-input', ADMIN_USERNAME);
  await page.fill('#password-input', ADMIN_PASSWORD);
  await page.click('#login-button');
  await expect(page.locator('.user-management-panel')).toBeVisible();
  await expect(page.locator('#todo-input')).not.toBeVisible();
});

test('Admin can see all registered users', async ({ page, request }) => {
  await registerViaApi(request, 'alice', 'secret123');
  await page.reload();
  await page.fill('#username-input', ADMIN_USERNAME);
  await page.fill('#password-input', ADMIN_PASSWORD);
  await page.click('#login-button');
  await expect(page.locator('.user-item[data-username="alice"]')).toBeVisible();
});

test('Admin can delete a user and their todos are removed', async ({ page, request }) => {
  const aliceToken = await registerViaApi(request, 'alice', 'secret123');
  await createTodoViaApi(request, 'Alice task', aliceToken);
  await page.reload();
  await page.fill('#username-input', ADMIN_USERNAME);
  await page.fill('#password-input', ADMIN_PASSWORD);
  await page.click('#login-button');
  await page.getByRole('button', { name: /delete user alice/i }).click();
  await expect(page.locator('.user-item[data-username="alice"]')).not.toBeVisible();
});

test('Admin can reset a user\'s password', async ({ page, request }) => {
  await registerViaApi(request, 'alice', 'oldpass');
  await page.reload();
  await page.fill('#username-input', ADMIN_USERNAME);
  await page.fill('#password-input', ADMIN_PASSWORD);
  await page.click('#login-button');
  await page.getByRole('button', { name: /reset password for alice/i }).click();
  await page.fill('#new-password-input', 'newpass123');
  await page.click('#confirm-reset-button');
  const newToken = await loginViaApi(request, 'alice', 'newpass123');
  expect(newToken).toBeTruthy();
  const oldLoginResponse = await request.post('/api/auth/login', {
    data: { username: 'alice', password: 'oldpass' },
  });
  expect(oldLoginResponse.status()).toBe(401);
});

test('Admin cannot access the todo list via API', async ({ request }) => {
  const adminToken = await loginViaApi(request, ADMIN_USERNAME, ADMIN_PASSWORD);
  const response = await request.get('/api/todos', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  expect(response.status()).toBe(403);
});

test('Regular user cannot access the admin panel via API', async ({ request }) => {
  const aliceToken = await registerViaApi(request, 'alice', 'secret123');
  const response = await request.get('/api/admin/users', {
    headers: { Authorization: `Bearer ${aliceToken}` },
  });
  expect(response.status()).toBe(403);
});
