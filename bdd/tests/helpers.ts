import type { APIRequestContext, Page } from '@playwright/test';

declare const process: { env: Record<string, string | undefined> };
export const ADMIN_USERNAME = process.env['ADMIN_USERNAME'] ?? 'admin';
export const ADMIN_PASSWORD = process.env['ADMIN_PASSWORD'] ?? 'changeme';
export const TEST_USERNAME = 'testuser';
export const TEST_PASSWORD = 'testpass123';

export const enterTodoText = (page: Page, text: string) =>
  page.fill('#todo-input', text);

export const clickAddButton = (page: Page) => page.click('#add-button');

export const getDeleteButton = (page: Page, text: string) =>
  page.getByRole('button', { name: new RegExp(`delete ${text}`, 'i') });

export async function resetState(request: APIRequestContext): Promise<void> {
  const adminToken = await loginViaApi(request, ADMIN_USERNAME, ADMIN_PASSWORD);
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
  const adminToken = await loginViaApi(request, ADMIN_USERNAME, ADMIN_PASSWORD);
  const response = await request.get('/api/admin/users', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const users: Array<{ id: number; username: string }> = await response.json();
  for (const user of users) {
    if (user.username !== ADMIN_USERNAME) {
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
  await page.evaluate((t: string) => localStorage.setItem('auth_token', t), token);
  await page.reload();
}

export type AuditLog = {
  id: number;
  timestamp: string;
  actionType: string;
  actorUsername: string;
  outcome: string;
  resourceId: number | null;
};

export async function getAuditLogsViaApi(
  request: APIRequestContext,
  adminToken: string,
  filter?: Record<string, string>
): Promise<AuditLog[]> {
  const response = await request.post('/api/admin/audit-logs/search', {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: filter ?? {},
  });
  return response.json() as Promise<AuditLog[]>;
}

export async function clearAuditLogsViaApi(
  request: APIRequestContext,
  adminToken: string
): Promise<void> {
  await request.delete('/api/admin/audit-logs', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
}
