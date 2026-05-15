import { test, expect } from '@playwright/test';
import {
  resetState,
  resetUsers,
  registerViaApi,
  navigateAsUser,
  TEST_USERNAME,
  TEST_PASSWORD,
  createTodoViaApi,
  fillEditDueDateInput,
  isoToPickerFormat,
} from './helpers';

let token: string;

test.beforeEach(async ({ page, request }) => {
  await resetState(request);
  await resetUsers(request);
  const registerToken = await registerViaApi(request, TEST_USERNAME, TEST_PASSWORD);
  await createTodoViaApi(request, 'Buy milk', registerToken);
  token = await navigateAsUser(page, request, TEST_USERNAME, TEST_PASSWORD);
});

// Scenario: Every todo item has an Edit button
test('Every todo item has an Edit button', async ({ page }) => {
  await expect(
    page.locator('.todo-item').filter({ hasText: 'Buy milk' }).getByRole('button', { name: /edit/i })
  ).toBeVisible();
});

// Scenario: Completed todo items also have an Edit button
test('Completed todo items also have an Edit button', async ({ page }) => {
  const todoItem = page.locator('.todo-item').filter({ hasText: 'Buy milk' });
  await todoItem.getByRole('checkbox').click();
  await expect(todoItem.getByRole('checkbox')).toBeChecked();
  await expect(todoItem.getByRole('button', { name: /edit/i })).toBeVisible();
});

// Scenario: Clicking Edit enters inline edit mode with the text pre-populated
test('Clicking Edit enters inline edit mode with the text pre-populated', async ({ page }) => {
  const todoItem = page.locator('.todo-item').filter({ hasText: 'Buy milk' });
  await todoItem.getByRole('button', { name: /edit/i }).click();

  const editInput = page.locator('.edit-input');
  await expect(editInput).toBeVisible();
  await expect(editInput).toHaveValue('Buy milk');
});

// Scenario: Clicking Edit pre-populates the date picker with the existing due date
test('Clicking Edit pre-populates the date picker with the existing due date', async ({
  page,
  request,
}) => {
  await createTodoViaApi(request, 'Submit report', token, '2027-06-15');
  await page.reload();

  const todoItem = page.locator('.todo-item').filter({ hasText: 'Submit report' });
  await todoItem.getByRole('button', { name: /edit/i }).click();

  await expect(page.locator('.edit-due-date-input')).toHaveValue(isoToPickerFormat('2027-06-15'));
});

// Scenario: Saving with updated text changes the item in the list
test('Saving with updated text changes the item in the list', async ({ page }) => {
  const todoItem = page.locator('.todo-item').filter({ hasText: 'Buy milk' });
  await todoItem.getByRole('button', { name: /edit/i }).click();
  await page.locator('.edit-input').fill('Buy oat milk');
  await page.getByRole('button', { name: /save/i }).click();

  await expect(page.locator('.todo-item').filter({ hasText: 'Buy oat milk' })).toBeVisible();
  await expect(page.locator('.todo-item').filter({ hasText: 'Buy milk' })).not.toBeVisible();
});

// Scenario: Pressing Enter while editing saves the changes
test('Pressing Enter while editing saves the changes', async ({ page }) => {
  const todoItem = page.locator('.todo-item').filter({ hasText: 'Buy milk' });
  await todoItem.getByRole('button', { name: /edit/i }).click();
  await page.locator('.edit-input').fill('Buy oat milk');
  await page.locator('.edit-input').press('Enter');

  await expect(page.locator('.todo-item').filter({ hasText: 'Buy oat milk' })).toBeVisible();
  await expect(page.locator('.todo-item').filter({ hasText: 'Buy milk' })).not.toBeVisible();
});

// Scenario: Saving updates the due date on the item
test('Saving updates the due date on the item', async ({ page }) => {
  const todoItem = page.locator('.todo-item').filter({ hasText: 'Buy milk' });
  await todoItem.getByRole('button', { name: /edit/i }).click();
  await fillEditDueDateInput(page, '2027-08-20');
  await page.getByRole('button', { name: /save/i }).click();

  await expect(todoItem.locator('.due-date-label')).toHaveText('Due 20 Aug 2027');
});

// Scenario: Saving clears the due date when the date is removed
test('Saving clears the due date when the date is removed', async ({ page, request }) => {
  await createTodoViaApi(request, 'Submit report', token, '2027-06-15');
  await page.reload();

  const todoItem = page.locator('.todo-item').filter({ hasText: 'Submit report' });
  await todoItem.getByRole('button', { name: /edit/i }).click();
  await page.locator('.edit-due-date-input').fill('');
  await page.getByRole('button', { name: /save/i }).click();

  await expect(todoItem.locator('.due-date-label')).not.toBeVisible();
});

// Scenario: Clicking Cancel discards text changes
test('Clicking Cancel discards text changes', async ({ page }) => {
  const todoItem = page.locator('.todo-item').filter({ hasText: 'Buy milk' });
  await todoItem.getByRole('button', { name: /edit/i }).click();
  await page.locator('.edit-input').fill('Buy oat milk');
  await page.getByRole('button', { name: /cancel/i }).click();

  await expect(page.locator('.todo-item').filter({ hasText: 'Buy milk' })).toBeVisible();
  await expect(page.locator('.todo-item').filter({ hasText: 'Buy oat milk' })).not.toBeVisible();
});

// Scenario: Pressing Escape while editing discards changes
test('Pressing Escape while editing discards changes', async ({ page }) => {
  const todoItem = page.locator('.todo-item').filter({ hasText: 'Buy milk' });
  await todoItem.getByRole('button', { name: /edit/i }).click();
  await page.locator('.edit-input').fill('Buy oat milk');
  await page.locator('.edit-input').press('Escape');

  await expect(page.locator('.todo-item').filter({ hasText: 'Buy milk' })).toBeVisible();
  await expect(page.locator('.todo-item').filter({ hasText: 'Buy oat milk' })).not.toBeVisible();
});

// Scenario: Cannot save an edit when the text is empty
test('Cannot save an edit when the text is empty', async ({ page }) => {
  const todoItem = page.locator('.todo-item').filter({ hasText: 'Buy milk' });
  await todoItem.getByRole('button', { name: /edit/i }).click();
  await page.locator('.edit-input').fill('');
  await page.getByRole('button', { name: /save/i }).click();

  await expect(page.locator('.edit-input')).toHaveClass(/invalid/);
  await expect(page.locator('.edit-input')).toBeVisible();
});

// Scenario: Cannot save an edit when the text is whitespace only
test('Cannot save an edit when the text is whitespace only', async ({ page }) => {
  const todoItem = page.locator('.todo-item').filter({ hasText: 'Buy milk' });
  await todoItem.getByRole('button', { name: /edit/i }).click();
  await page.locator('.edit-input').fill('   ');
  await page.getByRole('button', { name: /save/i }).click();

  await expect(page.locator('.edit-input')).toHaveClass(/invalid/);
});

// Scenario: Opening a second item's editor silently closes the first
// Also covers: Only one item is in edit mode at a time
test("Opening a second item's editor silently closes the first", async ({ page, request }) => {
  await createTodoViaApi(request, 'Call dentist', token);
  await page.reload();

  const milkItem = page.locator('.todo-item').filter({ hasText: 'Buy milk' });
  const dentistItem = page.locator('.todo-item').filter({ hasText: 'Call dentist' });

  await milkItem.getByRole('button', { name: /edit/i }).click();
  await dentistItem.getByRole('button', { name: /edit/i }).click();

  // milk is back in normal mode: its edit input is gone and its Edit button is restored;
  // dentist is the sole item in edit mode
  await expect(milkItem.locator('.edit-input')).not.toBeVisible();
  await expect(milkItem.getByRole('button', { name: /edit/i })).toBeVisible();
  await expect(page.locator('.edit-input')).toBeVisible();
  await expect(page.locator('.edit-input')).toHaveCount(1);
});
