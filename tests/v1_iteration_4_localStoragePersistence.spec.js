import { test, expect } from '@playwright/test';

async function navigateWithCleanState(page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
}

async function disableLocalStorage(page) {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() { throw new DOMException('SecurityError'); },
      configurable: true,
    });
  });
}

test.describe('An added todo item persists after page reload', () => {
  test.beforeEach(async ({ page }) => { await navigateWithCleanState(page); });

  test('"Buy milk" is visible after page reload', async ({ page }) => {
    await page.fill('#todo-input', 'Buy milk');
    await page.click('#add-button');
    await page.reload();
    await expect(page.locator('.todo-item label')).toHaveText('Buy milk');
  });
});

test.describe('The completed state of a todo item persists after page reload', () => {
  test.beforeEach(async ({ page }) => { await navigateWithCleanState(page); });

  test('"Buy milk" is marked as completed after page reload', async ({ page }) => {
    await page.fill('#todo-input', 'Buy milk');
    await page.click('#add-button');
    await page.locator('.todo-item input[type="checkbox"]').check();
    await page.reload();
    await expect(page.locator('.todo-item.completed label')).toHaveText('Buy milk');
  });
});

test.describe('A deleted todo item does not reappear after page reload', () => {
  test.beforeEach(async ({ page }) => { await navigateWithCleanState(page); });

  test('"Buy milk" does not reappear after deletion and reload', async ({ page }) => {
    await page.fill('#todo-input', 'Buy milk');
    await page.click('#add-button');
    await page.locator('.todo-delete-btn').click();
    await page.reload();
    await expect(page.locator('.todo-item')).toHaveCount(0);
  });
});

test.describe('An empty list on load shows the placeholder when no items are stored', () => {
  test.beforeEach(async ({ page }) => { await navigateWithCleanState(page); });

  test('placeholder is visible after reloading with no stored items', async ({ page }) => {
    await page.reload();
    await expect(page.locator('.todo-placeholder')).toHaveText('No tasks yet — add one above!');
  });
});

test.describe('The app continues to work in-memory when localStorage is unavailable', () => {
  test.beforeEach(async ({ page }) => {
    await disableLocalStorage(page);
    await page.goto('/');
  });

  test('adding a todo still works in-memory', async ({ page }) => {
    await page.fill('#todo-input', 'Buy milk');
    await page.click('#add-button');
    await expect(page.locator('.todo-item label')).toHaveText('Buy milk');
  });
});

test.describe('A storage notice is shown when localStorage is unavailable', () => {
  test.beforeEach(async ({ page }) => {
    await disableLocalStorage(page);
    await page.goto('/');
  });

  test('storage unavailable notice is visible', async ({ page }) => {
    await expect(page.locator('#storage-notice')).toBeVisible();
  });
});
