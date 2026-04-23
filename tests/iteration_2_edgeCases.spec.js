'use strict';
const { test, expect } = require('@playwright/test');

test.describe('Submitting an empty input shows a validation cue', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('todo input has the invalid class after empty submission', async ({ page }) => {
    await page.click('#add-button');
    await expect(page.locator('#todo-input')).toHaveClass(/invalid/);
  });
});

test.describe('Submitting whitespace-only input is treated as empty', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('shows validation cue and no todo items for whitespace input', async ({ page }) => {
    await page.fill('#todo-input', '   ');
    await page.click('#add-button');
    await expect(page.locator('#todo-input')).toHaveClass(/invalid/);
    await expect(page.locator('.todo-item')).toHaveCount(0);
  });
});

test.describe('An empty list on load shows a placeholder message', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('placeholder message is visible on load', async ({ page }) => {
    await expect(page.locator('.todo-placeholder')).toHaveText('No tasks yet — add one above!');
  });
});

test.describe('Very long task text wraps within the item row without breaking the layout', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('long task text does not cause horizontal overflow', async ({ page }) => {
    const longText = 'This is an extremely long task description that goes on and on and should definitely wrap to the next line within the item row and not break the overall page layout in any way';
    await page.fill('#todo-input', longText);
    await page.click('#add-button');
    await expect(page.locator('.todo-item label')).toHaveText(longText);
    const hasOverflow = await page.evaluate(() => {
      const list = document.querySelector('.todo-list');
      return list.scrollWidth > list.clientWidth;
    });
    expect(hasOverflow).toBe(false);
  });
});
