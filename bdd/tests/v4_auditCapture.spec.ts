import { test, expect } from '@playwright/test';
import {
  registerViaApi,
  loginViaApi,
  resetUsers,
  createTodoViaApi,
  completeTodoViaApi,
  getAuditLogsViaApi,
  clearAuditLogsViaApi,
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
} from './helpers';

// Feature: Audit Log Capture (F-31–F-35)

let adminToken: string;

test.beforeEach(async ({ request }) => {
  await resetUsers(request);
  adminToken = await loginViaApi(request, ADMIN_USERNAME, ADMIN_PASSWORD);
  await clearAuditLogsViaApi(request, adminToken);
});

// F-31: Todo mutations

test('Creating a todo produces an audit log entry', async ({ request }) => {
  const aliceToken = await registerViaApi(request, 'alice', 'secret123');

  await createTodoViaApi(request, 'Buy groceries', aliceToken);

  const logs = await getAuditLogsViaApi(request, adminToken);
  const entry = logs.find(l => l.actionType === 'TODO_CREATED' && l.actorUsername === 'alice');
  expect(entry).toBeDefined();
  expect(entry!.outcome).toBe('SUCCESS');
  expect(entry!.resourceId).not.toBeNull();
});

test('Toggling a todo produces an audit log entry', async ({ request }) => {
  const aliceToken = await registerViaApi(request, 'alice', 'secret123');
  const todoId = await createTodoViaApi(request, 'Buy groceries', aliceToken);

  await completeTodoViaApi(request, todoId, aliceToken);

  const logs = await getAuditLogsViaApi(request, adminToken);
  const entry = logs.find(l => l.actionType === 'TODO_UPDATED' && l.actorUsername === 'alice');
  expect(entry).toBeDefined();
  expect(entry!.outcome).toBe('SUCCESS');
  expect(entry!.resourceId).toBe(todoId);
});

test('Deleting a todo produces an audit log entry', async ({ request }) => {
  const aliceToken = await registerViaApi(request, 'alice', 'secret123');
  const todoId = await createTodoViaApi(request, 'Buy groceries', aliceToken);

  await request.delete(`/api/todos/${todoId}`, {
    headers: { Authorization: `Bearer ${aliceToken}` },
  });

  const logs = await getAuditLogsViaApi(request, adminToken);
  const entry = logs.find(l => l.actionType === 'TODO_DELETED' && l.actorUsername === 'alice');
  expect(entry).toBeDefined();
  expect(entry!.outcome).toBe('SUCCESS');
  expect(entry!.resourceId).toBe(todoId);
});

// F-32: User registration

test('Registering a new user produces an audit log entry', async ({ request }) => {
  await registerViaApi(request, 'alice', 'secret123');

  const logs = await getAuditLogsViaApi(request, adminToken);
  const entry = logs.find(l => l.actionType === 'USER_REGISTERED' && l.actorUsername === 'alice');
  expect(entry).toBeDefined();
  expect(entry!.outcome).toBe('SUCCESS');
});

// F-33: Login attempts

test('A successful login produces an audit log entry with SUCCESS', async ({ request }) => {
  await registerViaApi(request, 'alice', 'secret123');

  await loginViaApi(request, 'alice', 'secret123');

  const logs = await getAuditLogsViaApi(request, adminToken);
  const entry = logs.find(l => l.actionType === 'USER_LOGIN' && l.actorUsername === 'alice');
  expect(entry).toBeDefined();
  expect(entry!.outcome).toBe('SUCCESS');
});

test('A failed login attempt produces an audit log entry with FAILURE', async ({ request }) => {
  await registerViaApi(request, 'alice', 'secret123');

  await request.post('/api/auth/login', {
    data: { username: 'alice', password: 'wrongpass' },
  });

  const logs = await getAuditLogsViaApi(request, adminToken);
  const entry = logs.find(l => l.actionType === 'USER_LOGIN' && l.actorUsername === 'alice');
  expect(entry).toBeDefined();
  expect(entry!.outcome).toBe('FAILURE');
});

// F-34: Admin user-management actions

test('Admin deleting a user produces an audit log entry', async ({ request }) => {
  await registerViaApi(request, 'alice', 'secret123');

  const usersResponse = await request.get('/api/admin/users', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const users: Array<{ id: number; username: string }> = await usersResponse.json();
  const alice = users.find(u => u.username === 'alice');
  expect(alice).toBeDefined();

  await request.delete(`/api/admin/users/${alice!.id}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  const logs = await getAuditLogsViaApi(request, adminToken);
  const entry = logs.find(l => l.actionType === 'ADMIN_DELETE_USER');
  expect(entry).toBeDefined();
  expect(entry!.outcome).toBe('SUCCESS');
  expect(entry!.resourceId).toBe(alice!.id);
});

test('Admin attempting to delete a non-existent user records a FAILURE audit entry', async ({ request }) => {
  await request.delete('/api/admin/users/99999', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  const logs = await getAuditLogsViaApi(request, adminToken);
  const entry = logs.find(l => l.actionType === 'ADMIN_DELETE_USER' && l.outcome === 'FAILURE');
  expect(entry).toBeDefined();
});

test("Admin resetting a user's password produces an audit log entry", async ({ request }) => {
  await registerViaApi(request, 'alice', 'oldpass');

  const usersResponse = await request.get('/api/admin/users', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const users: Array<{ id: number; username: string }> = await usersResponse.json();
  const alice = users.find(u => u.username === 'alice');
  expect(alice).toBeDefined();

  await request.patch(`/api/admin/users/${alice!.id}/password`, {
    data: { newPassword: 'newpass123' },
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  const logs = await getAuditLogsViaApi(request, adminToken);
  const entry = logs.find(l => l.actionType === 'ADMIN_RESET_PASSWORD');
  expect(entry).toBeDefined();
  expect(entry!.outcome).toBe('SUCCESS');
  expect(entry!.resourceId).toBe(alice!.id);
});

// F-35: Access-denied events

test('A request without a JWT token to a protected endpoint produces an UNAUTHENTICATED log', async ({ request }) => {
  await request.get('/api/todos');

  const logs = await getAuditLogsViaApi(request, adminToken);
  const entry = logs.find(l => l.actionType === 'UNAUTHENTICATED' && l.actorUsername === 'anonymous');
  expect(entry).toBeDefined();
  expect(entry!.outcome).toBe('FAILURE');
});

test('A regular user accessing an admin endpoint produces an ACCESS_DENIED log with their username', async ({ request }) => {
  const aliceToken = await registerViaApi(request, 'alice', 'secret123');

  await request.get('/api/admin/users', {
    headers: { Authorization: `Bearer ${aliceToken}` },
  });

  const logs = await getAuditLogsViaApi(request, adminToken);
  const entry = logs.find(l => l.actionType === 'ACCESS_DENIED' && l.actorUsername === 'alice');
  expect(entry).toBeDefined();
  expect(entry!.outcome).toBe('FAILURE');
});
