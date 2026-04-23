'use strict';
const { test, expect } = require('@playwright/test');

test.describe('Each todo item has a checkbox', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('#todo-input', 'Buy milk');
    await page.click('#add-button');
  });

  test('"Buy milk" has a checkbox', async ({ page }) => {
    await expect(page.locator('.todo-item input[type="checkbox"]')).toBeVisible();
  });
});

test.describe('Clicking the checkbox marks the item as completed', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('#todo-input', 'Buy milk');
    await page.click('#add-button');
  });

  test('"Buy milk" is marked as completed after checking the checkbox', async ({ page }) => {
    await page.locator('.todo-item input[type="checkbox"]').check();
    await expect(page.locator('.todo-item.completed')).toHaveCount(1);
  });
});

test.describe('A completed item is visually greyed out with strikethrough text', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('#todo-input', 'Buy milk');
    await page.click('#add-button');
  });

  test('completed item label has line-through text decoration', async ({ page }) => {
    await page.locator('.todo-item input[type="checkbox"]').check();
    const decoration = await page.locator('.todo-item.completed label')
      .evaluate(el => getComputedStyle(el).textDecoration);
    expect(decoration).toContain('line-through');
  });

  test('completed item label appears greyed out', async ({ page }) => {
    await page.locator('.todo-item input[type="checkbox"]').check();
    const color = await page.locator('.todo-item.completed label')
      .evaluate(el => getComputedStyle(el).color);
    expect(color).toBe('rgb(170, 170, 170)');
  });
});

test.describe('A completed item can be toggled back to not done', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('#todo-input', 'Buy milk');
    await page.click('#add-button');
  });

  test('"Buy milk" is not marked as completed after toggling twice', async ({ page }) => {
    const checkbox = page.locator('.todo-item input[type="checkbox"]');
    await checkbox.click();
    await checkbox.click();
    await expect(page.locator('.todo-item.completed')).toHaveCount(0);
  });
});
