'use strict';
const { test, expect } = require('@playwright/test');

test.describe('Hardcoded ToDo items are visible in the list', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('has at least two ToDo items', async ({ page }) => {
    expect(await page.locator('li').count()).toBeGreaterThanOrEqual(2);
  });
  test('each item contains a checkbox and task text', async ({ page }) => {
    const items = page.locator('li');
    for (let i = 0; i < await items.count(); i++) {
      const item = items.nth(i);
      await expect(item.locator('input[type="checkbox"]')).toBeVisible();
      expect((await item.textContent()).trim().length).toBeGreaterThan(0);
    }
  });
});

test.describe('At least one item is shown in a completed state', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('at least one checkbox is checked', async ({ page }) => {
    expect(await page.locator('input[type="checkbox"]:checked').count()).toBeGreaterThanOrEqual(1);
  });
  test('completed item has the "completed" CSS class', async ({ page }) => {
    await expect(page.locator('li.completed')).toHaveCount(1);
  });
  test('completed item label has line-through text-decoration', async ({ page }) => {
    const decoration = await page.locator('li.completed label')
      .evaluate(el => getComputedStyle(el).textDecoration);
    expect(decoration).toContain('line-through');
  });
  test('completed item label appears greyed out', async ({ page }) => {
    const color = await page.locator('li.completed label')
      .evaluate(el => getComputedStyle(el).color);
    expect(color).toBe('rgb(170, 170, 170)'); // #aaa
  });
});

test.describe('Page content is fully present without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('heading "To-Do List" is present', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('To-Do List');
  });
  test('new ToDo form is present', async ({ page }) => {
    await expect(page.locator('form')).toBeVisible();
  });
  test('hardcoded ToDo items are present', async ({ page }) => {
    expect(await page.locator('li').count()).toBeGreaterThanOrEqual(2);
  });
});
