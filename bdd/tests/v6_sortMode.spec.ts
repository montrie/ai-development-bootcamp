import { test, expect } from '@playwright/test';
import {
  resetState,
  resetUsers,
  registerViaApi,
  navigateAsUser,
  TEST_USERNAME,
  TEST_PASSWORD,
  createTodoViaApi,
  updateSortModeViaApi,
  reorderTodosViaApi,
  getUserProfileViaApi,
} from './helpers';

let token: string;

test.beforeEach(async ({ page, request }) => {
  await resetState(request);
  await resetUsers(request);
  token = await registerViaApi(request, TEST_USERNAME, TEST_PASSWORD);
  token = await navigateAsUser(page, request, TEST_USERNAME, TEST_PASSWORD);
});

// Scenario: Todos are returned in ascending creation order when sort mode is CREATED_ASC
test('Todos are returned in ascending creation order when sort mode is CREATED_ASC', async ({
  request,
}) => {
  await updateSortModeViaApi(request, token, 'CREATED_ASC');
  await createTodoViaApi(request, 'Alpha', token);
  await createTodoViaApi(request, 'Beta', token);
  await createTodoViaApi(request, 'Gamma', token);

  const response = await request.get('/api/todos', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const todos: Array<{ text: string }> = await response.json();
  expect(todos.map((t) => t.text)).toEqual(['Alpha', 'Beta', 'Gamma']);
});

// Scenario: Todos are returned in descending creation order when sort mode is CREATED_DESC
test('Todos are returned in descending creation order when sort mode is CREATED_DESC', async ({
  request,
}) => {
  await updateSortModeViaApi(request, token, 'CREATED_DESC');
  await createTodoViaApi(request, 'Alpha', token);
  await createTodoViaApi(request, 'Beta', token);
  await createTodoViaApi(request, 'Gamma', token);

  const response = await request.get('/api/todos', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const todos: Array<{ text: string }> = await response.json();
  expect(todos.map((t) => t.text)).toEqual(['Gamma', 'Beta', 'Alpha']);
});

// Scenario: Todos are returned sorted by due date ascending when sort mode is DUE_DATE_EARLIEST_FIRST
test('Todos are returned sorted by due date ascending when sort mode is DUE_DATE_EARLIEST_FIRST', async ({
  request,
}) => {
  await updateSortModeViaApi(request, token, 'DUE_DATE_EARLIEST_FIRST');
  await createTodoViaApi(request, 'Later task', token, '2027-12-01');
  await createTodoViaApi(request, 'Earlier task', token, '2027-01-15');

  const response = await request.get('/api/todos', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const todos: Array<{ text: string }> = await response.json();
  const texts = todos.map((t) => t.text);
  expect(texts.indexOf('Earlier task')).toBeLessThan(texts.indexOf('Later task'));
});

// Scenario: Todos are returned sorted by due date descending when sort mode is DUE_DATE_LATEST_FIRST
test('Todos are returned sorted by due date descending when sort mode is DUE_DATE_LATEST_FIRST', async ({
  request,
}) => {
  await updateSortModeViaApi(request, token, 'DUE_DATE_LATEST_FIRST');
  await createTodoViaApi(request, 'Later task', token, '2027-12-01');
  await createTodoViaApi(request, 'Earlier task', token, '2027-01-15');

  const response = await request.get('/api/todos', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const todos: Array<{ text: string }> = await response.json();
  const texts = todos.map((t) => t.text);
  expect(texts.indexOf('Later task')).toBeLessThan(texts.indexOf('Earlier task'));
});

// Scenario: Todos are returned sorted alphabetically ascending when sort mode is ALPHA_ASC
test('Todos are returned sorted alphabetically ascending when sort mode is ALPHA_ASC', async ({
  request,
}) => {
  await updateSortModeViaApi(request, token, 'ALPHA_ASC');
  await createTodoViaApi(request, 'Zebra', token);
  await createTodoViaApi(request, 'Apple', token);
  await createTodoViaApi(request, 'Mango', token);

  const response = await request.get('/api/todos', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const todos: Array<{ text: string }> = await response.json();
  expect(todos.map((t) => t.text)).toEqual(['Apple', 'Mango', 'Zebra']);
});

// Scenario: Todos are returned sorted alphabetically descending when sort mode is ALPHA_DESC
test('Todos are returned sorted alphabetically descending when sort mode is ALPHA_DESC', async ({
  request,
}) => {
  await updateSortModeViaApi(request, token, 'ALPHA_DESC');
  await createTodoViaApi(request, 'Zebra', token);
  await createTodoViaApi(request, 'Apple', token);
  await createTodoViaApi(request, 'Mango', token);

  const response = await request.get('/api/todos', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const todos: Array<{ text: string }> = await response.json();
  expect(todos.map((t) => t.text)).toEqual(['Zebra', 'Mango', 'Apple']);
});

// Scenario: Todos are returned in custom order when sort mode is CUSTOM
test('Todos are returned in custom order when sort mode is CUSTOM', async ({ request }) => {
  const firstId = await createTodoViaApi(request, 'First', token);
  const secondId = await createTodoViaApi(request, 'Second', token);
  const thirdId = await createTodoViaApi(request, 'Third', token);

  await reorderTodosViaApi(request, token, [thirdId, firstId, secondId]);

  const response = await request.get('/api/todos', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const todos: Array<{ text: string }> = await response.json();
  expect(todos.map((t) => t.text)).toEqual(['Third', 'First', 'Second']);
});

// Scenario: Updating sort mode with a valid value succeeds
// Gherkin has two Then steps: status 200 AND response body is empty
test('Updating sort mode with a valid value succeeds', async ({ request }) => {
  const response = await updateSortModeViaApi(request, token, 'ALPHA_ASC');
  expect(response.status()).toBe(200);
  expect(await response.text()).toBe('');
});

// Scenario: Updating sort mode with an invalid value returns 400
test('Updating sort mode with an invalid value returns 400', async ({ request }) => {
  const response = await updateSortModeViaApi(request, token, 'INVALID_MODE');
  expect(response.status()).toBe(400);
});

// Scenario: Updating sort mode without authentication returns 401
test('Updating sort mode without authentication returns 401', async ({ request }) => {
  const response = await request.patch('/api/users/me/sort-mode', {
    data: { sortMode: 'ALPHA_ASC' },
  });
  expect(response.status()).toBe(401);
});

// Scenario: Reordering todos sets sort mode to CUSTOM and saves the order
test('Reordering todos sets sort mode to CUSTOM and saves the order', async ({ request }) => {
  const alphaId = await createTodoViaApi(request, 'Alpha', token);
  const betaId = await createTodoViaApi(request, 'Beta', token);
  const gammaId = await createTodoViaApi(request, 'Gamma', token);

  const reorderResponse = await reorderTodosViaApi(request, token, [gammaId, alphaId, betaId]);
  expect(reorderResponse.status()).toBe(200);

  const profile = await getUserProfileViaApi(request, token);
  expect(profile.sortMode).toBe('CUSTOM');

  const listResponse = await request.get('/api/todos', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const todos: Array<{ text: string }> = await listResponse.json();
  expect(todos.map((t) => t.text)).toEqual(['Gamma', 'Alpha', 'Beta']);
});

// Scenario: Reordering todos with an ID belonging to another user returns 403
test('Reordering todos with an ID belonging to another user returns 403', async ({ request }) => {
  const otherToken = await registerViaApi(request, 'otheruser', 'otherpass123');
  const foreignId = await createTodoViaApi(request, 'Foreign todo', otherToken);
  const myId = await createTodoViaApi(request, 'My todo', token);

  const response = await reorderTodosViaApi(request, token, [myId, foreignId]);
  expect(response.status()).toBe(403);
});

// Scenario: Reordering todos with a non-existent ID returns 403
test('Reordering todos with a non-existent ID returns 403', async ({ request }) => {
  const myId = await createTodoViaApi(request, 'My todo', token);

  const response = await reorderTodosViaApi(request, token, [myId, 999999999]);
  expect(response.status()).toBe(403);
});

// Scenario: Reordering todos without authentication returns 401
test('Reordering todos without authentication returns 401', async ({ request }) => {
  const response = await request.patch('/api/todos/reorder', {
    data: { order: [1, 2, 3] },
  });
  expect(response.status()).toBe(401);
});

// Scenario: Creating a new todo in CUSTOM sort mode appends it to the custom order
test('Creating a new todo in CUSTOM sort mode appends it to the custom order', async ({
  request,
}) => {
  const alphaId = await createTodoViaApi(request, 'Alpha', token);
  const betaId = await createTodoViaApi(request, 'Beta', token);
  await reorderTodosViaApi(request, token, [alphaId, betaId]);

  await createTodoViaApi(request, 'Gamma', token);

  const response = await request.get('/api/todos', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const todos: Array<{ text: string }> = await response.json();
  expect(todos.map((t) => t.text)).toEqual(['Alpha', 'Beta', 'Gamma']);
});

// Scenario: Deleting a todo in CUSTOM sort mode removes it from the custom order
test('Deleting a todo in CUSTOM sort mode removes it from the custom order', async ({
  request,
}) => {
  const alphaId = await createTodoViaApi(request, 'Alpha', token);
  const betaId = await createTodoViaApi(request, 'Beta', token);
  const gammaId = await createTodoViaApi(request, 'Gamma', token);
  await reorderTodosViaApi(request, token, [alphaId, betaId, gammaId]);

  await request.delete(`/api/todos/${betaId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const response = await request.get('/api/todos', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const todos: Array<{ text: string }> = await response.json();
  expect(todos.map((t) => t.text)).toEqual(['Alpha', 'Gamma']);
});

// Scenario: Sort mode selector shows the active sort mode on page load
test('Sort mode selector shows the active sort mode on page load', async ({ page, request }) => {
  await updateSortModeViaApi(request, token, 'DUE_DATE_EARLIEST_FIRST');
  await page.reload();

  await expect(page.locator('[data-testid="sort-mode-select"]')).toContainText(
    'Due date (earliest first)'
  );
});

// Scenario: Selecting a different sort mode calls the API and re-fetches the list
test('Selecting a different sort mode calls the API and re-fetches the list', async ({
  page,
  request,
}) => {
  await updateSortModeViaApi(request, token, 'CREATED_ASC');
  await createTodoViaApi(request, 'Zebra', token);
  await createTodoViaApi(request, 'Apple', token);
  await page.reload();

  await page.locator('[data-testid="sort-mode-select"]').selectOption('ALPHA_ASC');

  const todoItems = page.locator('.todo-item');
  await expect(todoItems.first()).toContainText('Apple');
  await expect(todoItems.nth(1)).toContainText('Zebra');
  await expect(page.locator('[data-testid="sort-mode-select"]')).toContainText('Alphabetical (A–Z)');
});

// Scenario: Sort mode selector is disabled while the sort mode update request is in flight
test('Sort mode selector is disabled while the sort mode update request is in flight', async ({
  page,
}) => {
  await page.route('**/api/users/me/sort-mode', async (route) => {
    await new Promise<void>((resolve) => setTimeout(resolve, 500));
    await route.continue();
  });

  const selectLocator = page.locator('[data-testid="sort-mode-select"]');
  const selectPromise = selectLocator.selectOption('ALPHA_ASC');

  await expect(selectLocator).toBeDisabled();

  await selectPromise;
});
