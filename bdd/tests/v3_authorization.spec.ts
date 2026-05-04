import { test, expect } from '@playwright/test';
import { resetUsers, registerViaApi, loginViaApi, createTodoViaApi, navigateAsUser } from './helpers';

// Feature: Authorization and Per-User Todo Isolation (F-21, F-22)

test.beforeEach(async ({ request }) => {
  await resetUsers(request);
});

test('Unauthenticated request to the todo API is rejected', async ({ request }) => {
  const response = await request.get('/api/todos');
  expect(response.status()).toBe(401);
});

test('Todos are scoped to the logged-in user', async ({ page, request }) => {
  const aliceToken = await registerViaApi(request, 'alice', 'secret123');
  await createTodoViaApi(request, 'Alice task', aliceToken);
  await registerViaApi(request, 'bob', 'secret456');
  await navigateAsUser(page, request, 'bob', 'secret456');
  await expect(page.getByText('Alice task')).not.toBeVisible();
});

test('User cannot delete another user\'s todo', async ({ request }) => {
  const aliceToken = await registerViaApi(request, 'alice', 'secret123');
  const bobToken = await registerViaApi(request, 'bob', 'secret456');
  const todoId = await createTodoViaApi(request, 'Alice task', aliceToken);
  const response = await request.delete(`/api/todos/${todoId}`, {
    headers: { Authorization: `Bearer ${bobToken}` },
  });
  expect(response.status()).toBe(403);
});

test('Accessing a non-existent todo returns 403', async ({ request }) => {
  const aliceToken = await registerViaApi(request, 'alice', 'secret123');
  const response = await request.patch('/api/todos/999999', {
    data: { done: true },
    headers: { Authorization: `Bearer ${aliceToken}` },
  });
  expect(response.status()).toBe(403);
});

test('Todos created after login are visible only to the creating user', async ({ page, request }) => {
  const aliceToken = await registerViaApi(request, 'alice', 'secret123');
  await registerViaApi(request, 'bob', 'secret456');
  await navigateAsUser(page, request, 'alice', 'secret123');
  await page.fill('#todo-input', 'Only mine');
  await page.click('#add-button');
  await expect(page.getByText('Only mine')).toBeVisible();
  await navigateAsUser(page, request, 'bob', 'secret456');
  await expect(page.getByText('Only mine')).not.toBeVisible();
});
