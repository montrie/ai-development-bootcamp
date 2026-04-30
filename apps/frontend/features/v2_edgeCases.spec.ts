import { test, expect, type Page } from '@playwright/test';
import { resetState, enterTodoText, clickAddButton } from './helpers';

const expectValidationCue = (page: Page) =>
  expect(page.locator('#todo-input')).toHaveAttribute('aria-invalid', 'true');

test.beforeEach(async ({ page, request }) => {
  await resetState(request);
  await page.goto('/');
});

// Feature: Behaviour Edge Cases

test('Submitting an empty input shows a validation cue', async ({ page }) => {
  await clickAddButton(page);
  await expectValidationCue(page);
});

test('Submitting whitespace-only input is treated as empty', async ({ page }) => {
  await enterTodoText(page, '   ');
  await clickAddButton(page);
  await expectValidationCue(page);
  await expect(page.locator('.todo-item')).toHaveCount(0);
});

test('An empty list on load shows a placeholder message', async ({ page }) => {
  await expect(page.getByText('No tasks yet — add one above!')).toBeVisible();
});

test('Very long task text wraps within the item row without breaking the layout', async ({ page }) => {
  const longText =
    'This is an extremely long task description that goes on and on and should definitely wrap to the next line within the item row and not break the overall page layout in any way';
  await enterTodoText(page, longText);
  await clickAddButton(page);
  await expect(page.getByText(longText)).toBeVisible();
  const itemBox = await page.locator('.todo-item').boundingBox();
  const pageWidth = await page.evaluate(() => document.body.offsetWidth);
  expect(itemBox!.width).toBeLessThanOrEqual(pageWidth);
});
