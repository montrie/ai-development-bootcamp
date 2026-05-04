import { test, expect } from '@playwright/test';
import { resetState, enterTodoText, clickAddButton } from './helpers';

test.beforeEach(async ({ page, request }) => {
  await resetState(request);
  await page.goto('/');
});

// Feature: Add a ToDo Item

test('User can type a task description into the todo input', async ({ page }) => {
  await enterTodoText(page, 'Buy milk');
  await expect(page.locator('#todo-input')).toHaveValue('Buy milk');
});

test('Clicking Add creates a new todo item in the list', async ({ page }) => {
  await enterTodoText(page, 'Buy milk');
  await clickAddButton(page);
  await expect(page.getByText('Buy milk')).toBeVisible();
});

test('Pressing Enter in the input adds a new todo item', async ({ page }) => {
  await enterTodoText(page, 'Buy milk');
  await page.press('#todo-input', 'Enter');
  await expect(page.getByText('Buy milk')).toBeVisible();
});

test('New todo items are appended to the bottom of the list', async ({ page }) => {
  await enterTodoText(page, 'Buy milk');
  await clickAddButton(page);
  await enterTodoText(page, 'Call dentist');
  await clickAddButton(page);
  const items = page.locator('.todo-item');
  await expect(items.nth(0)).toContainText('Buy milk');
  await expect(items.nth(1)).toContainText('Call dentist');
});

test('The input is cleared after adding a todo item', async ({ page }) => {
  await enterTodoText(page, 'Buy milk');
  await clickAddButton(page);
  await expect(page.locator('#todo-input')).toHaveValue('');
});

test('An item cannot be added when the input is empty', async ({ page }) => {
  await clickAddButton(page);
  await expect(page.locator('.todo-item')).toHaveCount(0);
});

test('An item cannot be added when the input contains only whitespace', async ({ page }) => {
  await enterTodoText(page, '   ');
  await clickAddButton(page);
  await expect(page.locator('.todo-item')).toHaveCount(0);
});
