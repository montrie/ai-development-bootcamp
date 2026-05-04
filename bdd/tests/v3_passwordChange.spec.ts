import { test, expect } from '@playwright/test';
import { resetUsers, registerViaApi, loginViaApi, navigateAsUser } from './helpers';

// Feature: User Password Change (F-29)

test.beforeEach(async ({ page, request }) => {
  await resetUsers(request);
  await registerViaApi(request, 'alice', 'secret123');
  await navigateAsUser(page, request, 'alice', 'secret123');
});

test('User can change their password successfully', async ({ page, request }) => {
  await page.click('#change-password-link');
  await page.fill('#current-password-input', 'secret123');
  await page.fill('#new-password-input', 'newpass456');
  await page.fill('#confirm-password-input', 'newpass456');
  await page.click('#change-password-button');
  await expect(page.locator('.password-change-status')).toContainText(/success/i);
  const newToken = await loginViaApi(request, 'alice', 'newpass456');
  expect(newToken).toBeTruthy();
});

test('Password change fails with wrong current password', async ({ page }) => {
  await page.click('#change-password-link');
  await page.fill('#current-password-input', 'wrongpass');
  await page.fill('#new-password-input', 'newpass456');
  await page.fill('#confirm-password-input', 'newpass456');
  await page.click('#change-password-button');
  await expect(page.locator('.password-change-status')).toContainText(/error|incorrect/i);
});

test('Password change fails when new passwords do not match', async ({ page }) => {
  await page.click('#change-password-link');
  await page.fill('#current-password-input', 'secret123');
  await page.fill('#new-password-input', 'newpass456');
  await page.fill('#confirm-password-input', 'different789');
  await page.click('#change-password-button');
  await expect(page.locator('.password-change-status')).toContainText(/error|match/i);
});
