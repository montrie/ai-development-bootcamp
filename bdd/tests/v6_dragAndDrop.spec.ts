import { test, expect } from '@playwright/test';
import {
  resetState,
  resetUsers,
  registerViaApi,
  navigateAsUser,
  TEST_USERNAME,
  TEST_PASSWORD,
  createTodoViaApi,
} from './helpers';

test.beforeEach(async ({ page, request }) => {
  await resetState(request);
  await resetUsers(request);
  const token = await registerViaApi(request, TEST_USERNAME, TEST_PASSWORD);
  const authedToken = await navigateAsUser(page, request, TEST_USERNAME, TEST_PASSWORD);

  await createTodoViaApi(request, 'Alpha', authedToken);
  await createTodoViaApi(request, 'Beta', authedToken);
  await createTodoViaApi(request, 'Gamma', authedToken);
  await page.reload();
});

// Scenario: Each todo item shows a drag handle in normal viewing mode
test('Each todo item shows a drag handle in normal viewing mode', async ({ page }) => {
  const todoItems = page.locator('.todo-item');
  await expect(todoItems).toHaveCount(3);
  for (const item of await todoItems.all()) {
    await expect(item.locator('[data-testid="drag-handle"]')).toBeVisible();
  }
});

// Scenario: Drag handles are hidden when any todo item is in inline edit mode
test('Drag handles are hidden when any todo item is in inline edit mode', async ({ page }) => {
  const betaItem = page.locator('.todo-item').filter({ hasText: 'Beta' });
  await betaItem.getByRole('button', { name: /edit/i }).click();

  const allDragHandles = page.locator('[data-testid="drag-handle"]');
  await expect(allDragHandles).toHaveCount(0);
});

// Scenario: Drag is disabled when any todo item is in inline edit mode
test('Drag is disabled when any todo item is in inline edit mode', async ({ page }) => {
  const betaItem = page.locator('.todo-item').filter({ hasText: 'Beta' });
  await betaItem.getByRole('button', { name: /edit/i }).click();

  const dragHandles = page.locator('[data-testid="drag-handle"]');
  await expect(dragHandles).toHaveCount(0);

  const alphaItem = page.locator('.todo-item').filter({ hasText: 'Alpha' });
  await expect(alphaItem).not.toHaveAttribute('draggable', 'true');
});

// Scenario: Dragging a todo to a new position reorders the list optimistically
test('Dragging a todo to a new position reorders the list optimistically', async ({ page }) => {
  const gammaHandle = page
    .locator('.todo-item')
    .filter({ hasText: 'Gamma' })
    .locator('[data-testid="drag-handle"]');
  const alphaItem = page.locator('.todo-item').filter({ hasText: 'Alpha' });

  await gammaHandle.dragTo(alphaItem);

  const todoItems = page.locator('.todo-item');
  await expect(todoItems.nth(0)).toContainText('Gamma');
  await expect(todoItems.nth(1)).toContainText('Alpha');
  await expect(todoItems.nth(2)).toContainText('Beta');
});

// Scenario: After a successful drag, the reorder is sent to the API
test('After a successful drag, the reorder is sent to the API', async ({ page }) => {
  let capturedOrder: number[] | null = null;

  await page.route('**/api/todos/reorder', async (route) => {
    const body = route.request().postDataJSON() as { order: number[] };
    capturedOrder = body.order;
    await route.continue();
  });

  const gammaHandle = page
    .locator('.todo-item')
    .filter({ hasText: 'Gamma' })
    .locator('[data-testid="drag-handle"]');
  const alphaItem = page.locator('.todo-item').filter({ hasText: 'Alpha' });

  await gammaHandle.dragTo(alphaItem);

  await page.waitForResponse('**/api/todos/reorder');

  expect(capturedOrder).not.toBeNull();
  expect(capturedOrder).toHaveLength(3);

  const todoItems = page.locator('.todo-item');
  const firstText = await todoItems.nth(0).textContent();
  const secondText = await todoItems.nth(1).textContent();
  const thirdText = await todoItems.nth(2).textContent();
  expect(firstText).toContain('Gamma');
  expect(secondText).toContain('Alpha');
  expect(thirdText).toContain('Beta');
});

// Scenario: After a successful drag, the sort mode selector shows "Custom order"
test('After a successful drag, the sort mode selector shows "Custom order"', async ({ page }) => {
  await page.route('**/api/todos/reorder', (route) => route.fulfill({ status: 200, body: '' }));

  const betaHandle = page
    .locator('.todo-item')
    .filter({ hasText: 'Beta' })
    .locator('[data-testid="drag-handle"]');
  const gammaItem = page.locator('.todo-item').filter({ hasText: 'Gamma' });

  await betaHandle.dragTo(gammaItem);

  await expect(page.locator('[data-testid="sort-mode-select"]')).toContainText('Custom order');
});

// Scenario: After a failed drag reorder, the list reverts to its pre-drag order
test('After a failed drag reorder, the list reverts to its pre-drag order', async ({ page }) => {
  await page.route('**/api/todos/reorder', (route) =>
    route.fulfill({ status: 500, body: 'Internal Server Error' })
  );

  const gammaHandle = page
    .locator('.todo-item')
    .filter({ hasText: 'Gamma' })
    .locator('[data-testid="drag-handle"]');
  const alphaItem = page.locator('.todo-item').filter({ hasText: 'Alpha' });

  await gammaHandle.dragTo(alphaItem);

  await page.waitForResponse('**/api/todos/reorder');

  const todoItems = page.locator('.todo-item');
  await expect(todoItems.nth(0)).toContainText('Alpha');
  await expect(todoItems.nth(1)).toContainText('Beta');
  await expect(todoItems.nth(2)).toContainText('Gamma');
});

// Scenario: After a failed drag reorder, an error message is shown
test('After a failed drag reorder, an error message is shown', async ({ page }) => {
  await page.route('**/api/todos/reorder', (route) =>
    route.fulfill({ status: 500, body: 'Internal Server Error' })
  );

  const gammaHandle = page
    .locator('.todo-item')
    .filter({ hasText: 'Gamma' })
    .locator('[data-testid="drag-handle"]');
  const alphaItem = page.locator('.todo-item').filter({ hasText: 'Alpha' });

  await gammaHandle.dragTo(alphaItem);

  await page.waitForResponse('**/api/todos/reorder');

  await expect(page.locator('.error-message')).toBeVisible();
});
