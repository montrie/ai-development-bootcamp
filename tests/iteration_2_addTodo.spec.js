'use strict';
const { test, expect } = require('@playwright/test');

test.describe('User can type a task description into the todo input', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('todo input contains typed text', async ({ page }) => {
    await page.fill('#todo-input', 'Buy milk');
    await expect(page.locator('#todo-input')).toHaveValue('Buy milk');
  });
});

test.describe('Clicking Add creates a new todo item in the list', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('new todo item appears with correct text', async ({ page }) => {
    await page.fill('#todo-input', 'Buy milk');
    await page.click('#add-button');
    await expect(page.locator('.todo-item label')).toHaveText('Buy milk');
  });
});

test.describe('Pressing Enter in the input adds a new todo item', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('pressing Enter adds a todo item', async ({ page }) => {
    await page.fill('#todo-input', 'Buy milk');
    await page.press('#todo-input', 'Enter');
    await expect(page.locator('.todo-item label')).toHaveText('Buy milk');
  });
});

test.describe('New todo items are appended to the bottom of the list', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('"Buy milk" appears before "Call dentist"', async ({ page }) => {
    await page.fill('#todo-input', 'Buy milk');
    await page.click('#add-button');
    await page.fill('#todo-input', 'Call dentist');
    await page.click('#add-button');
    const labels = page.locator('.todo-item label');
    await expect(labels.nth(0)).toHaveText('Buy milk');
    await expect(labels.nth(1)).toHaveText('Call dentist');
  });
});

test.describe('Input is cleared after adding a todo item', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('todo input is empty after adding', async ({ page }) => {
    await page.fill('#todo-input', 'Buy milk');
    await page.click('#add-button');
    await expect(page.locator('#todo-input')).toHaveValue('');
  });
});

test.describe('An item cannot be added when the input is empty', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('no todo item is added when input is empty', async ({ page }) => {
    await page.click('#add-button');
    await expect(page.locator('.todo-item')).toHaveCount(0);
  });
});

test.describe('An item cannot be added when the input contains only whitespace', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('no todo item is added when input is whitespace only', async ({ page }) => {
    await page.fill('#todo-input', '   ');
    await page.click('#add-button');
    await expect(page.locator('.todo-item')).toHaveCount(0);
  });
});
