import { test, expect } from '@playwright/test';
import { resetUsers, registerViaApi, navigateAsUser, createTodoViaApi, TEST_USERNAME, TEST_PASSWORD } from './helpers';

let userToken: string;

test.beforeEach(async ({ page, request }) => {
  await resetUsers(request);
  userToken = await registerViaApi(request, TEST_USERNAME, TEST_PASSWORD);
  await createTodoViaApi(request, 'Buy milk', userToken);
  await navigateAsUser(page, request, TEST_USERNAME, TEST_PASSWORD);
});

// Feature: Complete a ToDo Item

test('Each todo item has a checkbox', async ({ page }) => {
  await expect(page.getByRole('checkbox')).toBeVisible();
});

test('Clicking the checkbox marks the item as completed', async ({ page }) => {
  await page.getByRole('checkbox').click();
  await expect(page.getByRole('checkbox')).toBeChecked();
});

test('A completed item is visually greyed out with strikethrough text', async ({ page }) => {
  await page.getByRole('checkbox').click();
  await expect(page.locator('.completed')).toContainText('Buy milk');
  await expect(page.locator('.completed')).toHaveCSS('text-decoration-line', 'line-through');
});

test('A completed item can be toggled back to not done', async ({ page }) => {
  await page.getByRole('checkbox').click();
  await expect(page.getByRole('checkbox')).toBeChecked();
  await page.getByRole('checkbox').click();
  await expect(page.getByRole('checkbox')).not.toBeChecked();
});
