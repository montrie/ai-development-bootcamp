import { test, expect } from '@playwright/test';

async function addTodo(page, text) {
  await page.fill('#todo-input', text);
  await page.click('#add-button');
}

test.describe('Each todo item has a delete button', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('delete button is visible for each todo item', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    await expect(page.locator('.todo-item .todo-delete-btn')).toHaveCount(1);
  });
});

test.describe('Clicking the delete button removes the item from the list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await addTodo(page, 'Buy milk');
  });

  test('item is no longer visible after deletion', async ({ page }) => {
    await page.locator('.todo-item .todo-delete-btn').first().click();
    await expect(page.locator('.todo-item label')).not.toContainText('Buy milk');
  });
});

test.describe('Deleted item does not reappear after adding a new item', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await addTodo(page, 'Buy milk');
  });

  test('deleted item stays gone when a new item is added', async ({ page }) => {
    await page.locator('.todo-item .todo-delete-btn').first().click();
    await addTodo(page, 'Call dentist');
    await expect(page.locator('.todo-item label')).not.toContainText('Buy milk');
    await expect(page.locator('.todo-item label')).toContainText('Call dentist');
  });
});

test.describe('Deleting the last item shows the empty placeholder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await addTodo(page, 'Buy milk');
  });

  test('placeholder message is shown when the last item is deleted', async ({ page }) => {
    await page.locator('.todo-item .todo-delete-btn').first().click();
    await expect(page.locator('.todo-placeholder')).toBeVisible();
  });
});
