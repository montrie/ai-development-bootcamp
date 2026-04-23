'use strict';
const { test, expect } = require('@playwright/test');

test.describe('The page heading and form are visible on load', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('heading "To-Do List" is present', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('To-Do List');
  });
  test('new ToDo form is present', async ({ page }) => {
    await expect(page.locator('form')).toBeVisible();
  });
});

test.describe('An empty list shows a placeholder message', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('placeholder message is visible on fresh load', async ({ page }) => {
    await expect(page.locator('.todo-placeholder')).toHaveText('No tasks yet — add one above!');
  });
});
