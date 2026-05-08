import { test, expect } from '@playwright/test';
import { resetUsers, registerViaApi, loginViaApi, navigateAsUser } from './helpers';

// Feature: User Authentication (F-18, F-19, F-20, F-23)

test.beforeEach(async ({ page, request }) => {
  await resetUsers(request);
  await page.goto('/');
});

test('Unauthenticated user sees the login page', async ({ page }) => {
  await expect(page.locator('#login-button')).toBeVisible();
});

test('User can register with a new username and password', async ({ page }) => {
  await page.click('#register-tab');
  await page.fill('#reg-username-input', 'alice');
  await page.fill('#reg-password-input', 'secret123');
  await page.click('#register-button');
  await expect(page.locator('#todo-input')).toBeVisible();
});

test('Registration fails when the username is already taken', async ({ page, request }) => {
  await registerViaApi(request, 'alice', 'secret123');
  await page.reload();
  await page.click('#register-tab');
  await page.fill('#reg-username-input', 'alice');
  await page.fill('#reg-password-input', 'secret123');
  await page.click('#register-button');
  await expect(page.locator('.auth-error')).toBeVisible();
});

test('Registered user can log in with correct credentials', async ({ page, request }) => {
  await registerViaApi(request, 'alice', 'secret123');
  await page.reload();
  await page.fill('#username-input', 'alice');
  await page.fill('#password-input', 'secret123');
  await page.click('#login-button');
  await expect(page.locator('#todo-input')).toBeVisible();
});

test('Login fails with wrong password', async ({ page, request }) => {
  await registerViaApi(request, 'alice', 'secret123');
  await page.reload();
  await page.fill('#username-input', 'alice');
  await page.fill('#password-input', 'wrongpass');
  await page.click('#login-button');
  await expect(page.locator('.auth-error')).toBeVisible();
});

test('Logged-in user can log out and is returned to the login page', async ({ page, request }) => {
  await registerViaApi(request, 'alice', 'secret123');
  await navigateAsUser(page, request, 'alice', 'secret123');
  await page.click('#logout-button');
  await expect(page.locator('#login-button')).toBeVisible();
});
