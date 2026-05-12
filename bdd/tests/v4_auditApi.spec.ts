import { test, expect } from '@playwright/test';
import {
  registerViaApi,
  loginViaApi,
  resetUsers,
  getAuditLogsViaApi,
  clearAuditLogsViaApi,
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
} from './helpers';

// Feature: Audit Log API (F-36–F-37)

let adminToken: string;

test.beforeEach(async ({ request }) => {
  await resetUsers(request);
  adminToken = await loginViaApi(request, ADMIN_USERNAME, ADMIN_PASSWORD);
  await clearAuditLogsViaApi(request, adminToken);
});

// F-36: GET /api/admin/audit-logs

test('Admin can retrieve all audit log entries via the API', async ({ request }) => {
  await loginViaApi(request, ADMIN_USERNAME, ADMIN_PASSWORD);

  const logs = await getAuditLogsViaApi(request, adminToken);

  expect(Array.isArray(logs)).toBe(true);
  for (let i = 1; i < logs.length; i++) {
    expect(new Date(logs[i - 1].timestamp).getTime()).toBeGreaterThanOrEqual(
      new Date(logs[i].timestamp).getTime()
    );
  }
});

test('Admin can filter audit log entries by action type via the API', async ({ request }) => {
  await registerViaApi(request, 'alice', 'secret123');
  await loginViaApi(request, 'alice', 'secret123');

  const logs = await getAuditLogsViaApi(request, adminToken, { actionType: 'USER_LOGIN' });

  expect(logs.length).toBeGreaterThan(0);
  for (const entry of logs) {
    expect(entry.actionType).toBe('USER_LOGIN');
  }
});

test('Admin can filter audit log entries by username via the API', async ({ request }) => {
  await registerViaApi(request, 'alice', 'secret123');
  await registerViaApi(request, 'bob', 'secret123');

  const logs = await getAuditLogsViaApi(request, adminToken, { username: 'alice' });

  expect(logs.length).toBeGreaterThan(0);
  for (const entry of logs) {
    expect(entry.actorUsername).toBe('alice');
  }
});

test('Admin can filter audit log entries by date range via the API', async ({ request }) => {
  await loginViaApi(request, ADMIN_USERNAME, ADMIN_PASSWORD);

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

  const logs = await getAuditLogsViaApi(request, adminToken, { startDate, endDate });

  expect(Array.isArray(logs)).toBe(true);
  for (const entry of logs) {
    const ts = new Date(entry.timestamp).getTime();
    expect(ts).toBeGreaterThanOrEqual(new Date(startDate).getTime());
    expect(ts).toBeLessThanOrEqual(new Date(endDate).getTime());
  }
});

test('Regular user cannot retrieve audit log entries via the API', async ({ request }) => {
  const aliceToken = await registerViaApi(request, 'alice', 'secret123');

  const response = await request.get('/api/admin/audit-logs', {
    headers: { Authorization: `Bearer ${aliceToken}` },
  });

  expect(response.status()).toBe(403);
});

// F-37: DELETE /api/admin/audit-logs

test('Admin can delete all audit log entries via the API', async ({ request }) => {
  await loginViaApi(request, ADMIN_USERNAME, ADMIN_PASSWORD);

  const deleteResponse = await request.delete('/api/admin/audit-logs', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  expect(deleteResponse.status()).toBe(204);

  const logs = await getAuditLogsViaApi(request, adminToken);
  expect(logs).toHaveLength(0);
});

test('Regular user cannot delete audit log entries via the API', async ({ request }) => {
  const aliceToken = await registerViaApi(request, 'alice', 'secret123');

  const response = await request.delete('/api/admin/audit-logs', {
    headers: { Authorization: `Bearer ${aliceToken}` },
  });

  expect(response.status()).toBe(403);
});
