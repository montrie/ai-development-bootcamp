import { test, expect, type Page } from '@playwright/test';
import {
  registerViaApi,
  loginViaApi,
  resetUsers,
  getAuditLogsViaApi,
  clearAuditLogsViaApi,
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
} from './helpers';

// Feature: Audit Log UI (F-38–F-40)

let adminToken: string;

async function loginAsAdmin(page: Page): Promise<void> {
  await page.fill('#username-input', ADMIN_USERNAME);
  await page.fill('#password-input', ADMIN_PASSWORD);
  await page.click('#login-button');
}

async function navigateToAuditLogs(page: Page): Promise<void> {
  await page.getByRole('button', { name: /audit logs/i }).click();
}

test.beforeEach(async ({ page, request }) => {
  await resetUsers(request);
  adminToken = await loginViaApi(request, ADMIN_USERNAME, ADMIN_PASSWORD);
  await clearAuditLogsViaApi(request, adminToken);
  await page.goto('/');
});

// F-38: Audit Logs page table

test('Admin can navigate to the Audit Logs page and see entries in a table', async ({ page, request }) => {
  await registerViaApi(request, 'alice', 'secret123');
  await loginAsAdmin(page);

  await navigateToAuditLogs(page);

  await expect(page.locator('#audit-log-table')).toBeVisible();
  await expect(page.locator('#audit-log-table').getByText('USER_REGISTERED')).toBeVisible();
});

// F-39: Filter controls

test('Admin can filter audit log entries by action type in the UI', async ({ page, request }) => {
  await registerViaApi(request, 'alice', 'secret123');
  await loginViaApi(request, 'alice', 'secret123');
  await loginAsAdmin(page);
  await navigateToAuditLogs(page);

  await page.selectOption('#audit-action-type', 'USER_LOGIN');
  await page.click('#apply-audit-filters-button');

  const rows = page.locator('#audit-log-table tbody tr');
  await expect(rows).not.toHaveCount(0);
  await expect(rows.filter({ hasNotText: 'USER_LOGIN' })).toHaveCount(0);
});

test('Admin can filter audit log entries by username in the UI', async ({ page, request }) => {
  await registerViaApi(request, 'alice', 'secret123');
  await registerViaApi(request, 'bob', 'secret123');
  await loginAsAdmin(page);
  await navigateToAuditLogs(page);

  await page.fill('#audit-username', 'alice');
  await page.click('#apply-audit-filters-button');

  const rows = page.locator('#audit-log-table tbody tr');
  await expect(rows).not.toHaveCount(0);
  await expect(rows.filter({ hasNotText: 'alice' })).toHaveCount(0);
});

test('Admin can filter audit log entries by date range in the UI', async ({ page, request }) => {
  await loginViaApi(request, ADMIN_USERNAME, ADMIN_PASSWORD);
  await loginAsAdmin(page);
  await navigateToAuditLogs(page);

  const today = new Date().toISOString().split('T')[0];
  await page.fill('#audit-start-date', today);
  await page.fill('#audit-end-date', today);
  await page.click('#apply-audit-filters-button');

  const rows = page.locator('#audit-log-table tbody tr');
  await expect(rows).not.toHaveCount(0);
  await expect(rows.filter({ hasNotText: today })).toHaveCount(0);
});

// F-40: Clear All Logs button

test('Admin can clear all audit log entries using the Clear All Logs button', async ({ page, request }) => {
  await loginViaApi(request, ADMIN_USERNAME, ADMIN_PASSWORD);
  await loginAsAdmin(page);
  await navigateToAuditLogs(page);

  page.on('dialog', dialog => dialog.accept());
  await page.click('#clear-audit-logs-button');

  await expect(page.locator('#audit-log-table tbody tr')).toHaveCount(0);
});
