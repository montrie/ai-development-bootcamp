import type { APIRequestContext, Page } from '@playwright/test';

export const enterTodoText = (page: Page, text: string) =>
  page.fill('#todo-input', text);

export const clickAddButton = (page: Page) => page.click('#add-button');

export const getDeleteButton = (page: Page, text: string) =>
  page.getByRole('button', { name: new RegExp(`delete ${text}`, 'i') });

export async function resetState(request: APIRequestContext): Promise<void> {
  const adminToken = await loginViaApi(request, 'admin', 'changeme');
  await request.delete('/api/todos', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
}

export async function createTodoViaApi(
  request: APIRequestContext,
  text: string,
  token?: string
): Promise<number> {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await request.post('/api/todos', {
    data: { text },
    headers,
  });
  const todo = await response.json();
  return todo.id as number;
}

export async function completeTodoViaApi(
  request: APIRequestContext,
  id: number,
  token?: string
): Promise<void> {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  await request.patch(`/api/todos/${id}`, { data: { done: true }, headers });
}

export async function registerViaApi(
  request: APIRequestContext,
  username: string,
  password: string
): Promise<string> {
  const response = await request.post('/api/auth/register', {
    data: { username, password },
  });
  const body = await response.json();
  return body.token as string;
}

export async function loginViaApi(
  request: APIRequestContext,
  username: string,
  password: string
): Promise<string> {
  const response = await request.post('/api/auth/login', {
    data: { username, password },
  });
  const body = await response.json();
  return body.token as string;
}

export async function resetUsers(request: APIRequestContext): Promise<void> {
  const adminToken = await loginViaApi(request, 'admin', 'changeme');
  const response = await request.get('/api/admin/users', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const users: Array<{ id: number; username: string }> = await response.json();
  for (const user of users) {
    if (user.username !== 'admin') {
      await request.delete(`/api/admin/users/${user.id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    }
  }
}

export async function navigateAsUser(
  page: Page,
  request: APIRequestContext,
  username: string,
  password: string
): Promise<void> {
  const token = await loginViaApi(request, username, password);
  await page.goto('/');
  await page.evaluate((t) => localStorage.setItem('auth_token', t), token);
  await page.reload();
}
