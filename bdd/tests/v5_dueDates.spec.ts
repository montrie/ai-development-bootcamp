import { test, expect } from '@playwright/test';
import {
  resetState,
  resetUsers,
  registerViaApi,
  navigateAsUser,
  TEST_USERNAME,
  TEST_PASSWORD,
  createTodoWithDueDateViaApi,
  enterTodoText,
  clickAddButton,
  fillDueDateInput,
} from './helpers';

let token: string;

test.beforeEach(async ({ page, request }) => {
  await resetState(request);
  await resetUsers(request);
  await registerViaApi(request, TEST_USERNAME, TEST_PASSWORD);
  token = await navigateAsUser(page, request, TEST_USERNAME, TEST_PASSWORD);
});

// Scenario: A todo item can be created with a due date
// Also covers: Due date in a different year is displayed with the year (2027 != current year)
test('A todo item can be created with a due date', async ({ page }) => {
  await enterTodoText(page, 'Submit report');
  await fillDueDateInput(page, '2027-06-15');
  await clickAddButton(page);

  await expect(page.locator('.todo-item').filter({ hasText: 'Submit report' })).toBeVisible();
  await expect(
    page.locator('.todo-item').filter({ hasText: 'Submit report' }).locator('.due-date-label')
  ).toHaveText('Due 15 Jun 2027');
});

// Scenario: Due date in the current year is displayed without the year
test('Due date in the current year is displayed without the year', async ({ page }) => {
  const year = new Date().getFullYear();

  await enterTodoText(page, 'Call dentist');
  await fillDueDateInput(page, `${year}-12-15`);
  await clickAddButton(page);

  const dueDateLabel = page
    .locator('.todo-item')
    .filter({ hasText: 'Call dentist' })
    .locator('.due-date-label');
  await expect(dueDateLabel).toBeVisible();
  await expect(dueDateLabel).not.toContainText(String(year));
});

// Scenario: An overdue incomplete item shows the due date label in red
test('An overdue incomplete item shows the due date label in red', async ({ page, request }) => {
  await createTodoWithDueDateViaApi(request, 'Pay taxes', '2000-01-01', token);
  await page.reload();

  const dueDateLabel = page
    .locator('.todo-item')
    .filter({ hasText: 'Pay taxes' })
    .locator('.due-date-label');
  await expect(dueDateLabel).toHaveClass(/overdue/);
});

// Scenario: A completed item does not show the overdue indicator even when past due
test('A completed item does not show the overdue indicator even when past due', async ({
  page,
  request,
}) => {
  await createTodoWithDueDateViaApi(request, 'Pay taxes', '2000-01-01', token);
  await page.reload();

  const todoItem = page.locator('.todo-item').filter({ hasText: 'Pay taxes' });
  await todoItem.getByRole('checkbox').click();
  await expect(todoItem.getByRole('checkbox')).toBeChecked();

  await expect(todoItem.locator('.due-date-label')).not.toHaveClass(/overdue/);
});

// Scenario: A todo with a future due date does not show the overdue indicator
test('A todo with a future due date does not show the overdue indicator', async ({ page }) => {
  await enterTodoText(page, 'Plan holiday');
  await fillDueDateInput(page, '2099-12-31');
  await clickAddButton(page);

  const dueDateLabel = page
    .locator('.todo-item')
    .filter({ hasText: 'Plan holiday' })
    .locator('.due-date-label');
  await expect(dueDateLabel).not.toHaveClass(/overdue/);
});

// Scenario: Due date is persisted and visible after a page reload
test('Due date is persisted and visible after a page reload', async ({ page }) => {
  await enterTodoText(page, 'File taxes');
  await fillDueDateInput(page, '2027-04-30');
  await clickAddButton(page);
  await page.reload();

  const dueDateLabel = page
    .locator('.todo-item')
    .filter({ hasText: 'File taxes' })
    .locator('.due-date-label');
  await expect(dueDateLabel).toHaveText('Due 30 Apr 2027');
});
