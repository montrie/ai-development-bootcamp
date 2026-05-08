import { test, expect, type Route } from '@playwright/test';
import { resetUsers, registerViaApi, navigateAsUser, createTodoViaApi, completeTodoViaApi, TEST_USERNAME, TEST_PASSWORD } from './helpers';

let userToken: string;

test.beforeEach(async ({ page, request }) => {
  await resetUsers(request);
  userToken = await registerViaApi(request, TEST_USERNAME, TEST_PASSWORD);
  await navigateAsUser(page, request, TEST_USERNAME, TEST_PASSWORD);
});

// Feature: Database Persistence

test('An added todo item persists after page reload', async ({ page, request }) => {
  await createTodoViaApi(request, 'Buy milk', userToken);
  await page.goto('/');
  await expect(page.getByText('Buy milk')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Buy milk')).toBeVisible();
});

test('The completed state of a todo item persists after page reload', async ({ page, request }) => {
  const id = await createTodoViaApi(request, 'Buy milk', userToken);
  await completeTodoViaApi(request, id, userToken);
  await page.goto('/');
  await page.reload();
  await expect(page.getByRole('checkbox')).toBeChecked();
});

test('A deleted todo item does not reappear after page reload', async ({ page, request }) => {
  await createTodoViaApi(request, 'Buy milk', userToken);
  await page.goto('/');
  await page.getByRole('button', { name: /delete buy milk/i }).click();
  await page.reload();
  await expect(page.getByText('Buy milk')).not.toBeVisible();
});

test('An empty list on load shows the placeholder when no items are stored', async ({ page }) => {
  await page.goto('/');
  await page.reload();
  await expect(page.getByText('No tasks yet — add one above!')).toBeVisible();
});

test('A notice is shown when the API is unreachable', async ({ page }) => {
  await page.goto('/');
  await page.route('/api/**', (route: Route) => route.abort());
  await page.reload();
  await expect(page.getByText(/could not reach the server/i)).toBeVisible();
});
