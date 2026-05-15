import type { APIRequestContext, Page } from '@playwright/test';

declare const process: { env: Record<string, string | undefined> };
export const ADMIN_USERNAME = process.env['ADMIN_USERNAME'] ?? 'admin';
export const ADMIN_PASSWORD = process.env['ADMIN_PASSWORD'] ?? 'changeme';
export const TEST_USERNAME = 'testuser';
export const TEST_PASSWORD = 'testpass123';

export const enterTodoText = (page: Page, text: string) =>
  page.fill('#todo-input', text);

// react-datepicker is configured with dateFormat="yyyy-MM-dd"; ISO strings are used directly
export const isoToPickerFormat = (isoDate: string): string => isoDate;

export const fillDueDateInput = async (page: Page, isoDate: string) => {
  await page.fill('#due-date-input', isoDate);
  await page.keyboard.press('Escape');
};

export const fillEditDueDateInput = async (page: Page, isoDate: string) => {
  await page.fill('.edit-due-date-input', isoDate);
  await page.keyboard.press('Escape');
};

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
  token?: string,
  dueDate?: string
): Promise<number> {
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const data: Record<string, string> = { text };
  if (dueDate !== undefined) data['dueDate'] = dueDate;
  const response = await request.post('/api/todos', { data, headers });
  const todo = await response.json();
  return todo.id as number;
}

export async function completeTodoViaApi(
  request: APIRequestContext,
  id: number,
  token?: string
): Promise<void> {
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
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
): Promise<string> {
  const token = await loginViaApi(request, username, password);
  await page.goto('/');
  await page.evaluate((t: string) => localStorage.setItem('auth_token', t), token);
  await page.reload();
  return token;
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
  const params = new URLSearchParams(filter ?? {});
  const query = params.toString();
  const response = await request.get(`/api/admin/audit-logs${query ? `?${query}` : ''}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
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

export async function updateSortModeViaApi(
  request: APIRequestContext,
  token: string,
  sortMode: string
): Promise<import('@playwright/test').APIResponse> {
  return request.patch('/api/users/me/sort-mode', {
    data: { sortMode },
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function reorderTodosViaApi(
  request: APIRequestContext,
  token: string,
  orderedIds: number[]
): Promise<import('@playwright/test').APIResponse> {
  return request.patch('/api/todos/reorder', {
    data: { order: orderedIds },
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getUserProfileViaApi(
  request: APIRequestContext,
  token: string
): Promise<{ sortMode: string }> {
  const response = await request.get('/api/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json() as Promise<{ sortMode: string }>;
}
