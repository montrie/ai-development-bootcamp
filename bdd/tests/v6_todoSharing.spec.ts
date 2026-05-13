import { test, expect } from '@playwright/test';
import {
  resetState,
  resetUsers,
  registerViaApi,
  navigateAsUser,
  loginViaApi,
  TEST_USERNAME,
  TEST_PASSWORD,
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
  createTodoViaApi,
  getAuditLogsViaApi,
  clearAuditLogsViaApi,
  shareTodoViaApi,
} from './helpers';

let token: string;

test.beforeEach(async ({ page, request }) => {
  await resetState(request);
  await resetUsers(request);
  token = await registerViaApi(request, TEST_USERNAME, TEST_PASSWORD);
  await navigateAsUser(page, request, TEST_USERNAME, TEST_PASSWORD);
});

// Scenario: Activating and deactivating sharing mode via the navbar
test('Activating and deactivating sharing mode via the navbar', async ({ page }) => {
  await expect(page.locator('#share-todos-button')).toBeVisible();

  await page.locator('#share-todos-button').click();
  await expect(page.locator('#sharing-panel')).toBeVisible();
  await expect(page.locator('#share-todos-button')).toHaveText('Back');

  await page.locator('#share-todos-button').click();
  await expect(page.locator('#sharing-panel')).not.toBeVisible();
  await expect(page.locator('#share-todos-button')).toHaveText('Share Todos');
});

// Scenario: Sharing panel shows current todos and own todos become selectable
test('Sharing panel shows current todos and own todos become selectable', async ({
  page,
  request,
}) => {
  await createTodoViaApi(request, 'Buy milk', token);
  await page.reload();

  await page.locator('#share-todos-button').click();

  const sharingPanel = page.locator('#sharing-panel');
  await expect(sharingPanel.locator('.todo-item').filter({ hasText: 'Buy milk' })).toBeVisible();
  await expect(
    sharingPanel.locator('.todo-item').filter({ hasText: 'Buy milk' }).locator('.share-checkbox')
  ).toBeVisible();
  await expect(sharingPanel.locator('.sharing-recipient-input')).toBeVisible();

  await sharingPanel
    .locator('.todo-item')
    .filter({ hasText: 'Buy milk' })
    .locator('.share-checkbox')
    .click();
  await expect(
    sharingPanel.locator('.todo-item.selected').filter({ hasText: 'Buy milk' })
  ).toBeVisible();
});

// Scenario: Share selected todos button is disabled until both a todo and a username are provided
test('Share selected todos button is disabled until both a todo and a username are provided', async ({
  page,
  request,
}) => {
  await createTodoViaApi(request, 'Buy milk', token);
  await page.reload();

  await page.locator('#share-todos-button').click();
  const sharingPanel = page.locator('#sharing-panel');

  await expect(page.locator('.share-submit-button')).toBeDisabled();

  await sharingPanel
    .locator('.todo-item')
    .filter({ hasText: 'Buy milk' })
    .locator('.share-checkbox')
    .click();
  await expect(page.locator('.share-submit-button')).toBeDisabled();

  await sharingPanel
    .locator('.todo-item')
    .filter({ hasText: 'Buy milk' })
    .locator('.share-checkbox')
    .click();
  await sharingPanel.locator('.sharing-recipient-input').fill('alice');
  await expect(page.locator('.share-submit-button')).toBeDisabled();
});

// Scenario: Successfully sharing selected todos clears selection and username and shows a success toast
test('Successfully sharing selected todos clears selection and username and shows a success toast', async ({
  page,
  request,
}) => {
  await createTodoViaApi(request, 'Buy milk', token);
  await registerViaApi(request, 'alice', 'alicepass123');
  await page.reload();

  await page.locator('#share-todos-button').click();
  const sharingPanel = page.locator('#sharing-panel');

  await sharingPanel
    .locator('.todo-item')
    .filter({ hasText: 'Buy milk' })
    .locator('.share-checkbox')
    .click();
  await sharingPanel.locator('.sharing-recipient-input').fill('alice');
  await page.locator('.share-submit-button').click();

  await expect(page.locator('.toast.success')).toBeVisible({ timeout: 5000 });
  await expect(
    sharingPanel.locator('.todo-item.selected').filter({ hasText: 'Buy milk' })
  ).not.toBeVisible();
  await expect(sharingPanel.locator('.sharing-recipient-input')).toHaveValue('');
});

// Scenario: Sharing with an unknown recipient shows an error toast and preserves state
test('Sharing with an unknown recipient shows an error toast and preserves state', async ({
  page,
  request,
}) => {
  await createTodoViaApi(request, 'Buy milk', token);
  await page.reload();

  await page.locator('#share-todos-button').click();
  const sharingPanel = page.locator('#sharing-panel');

  await sharingPanel
    .locator('.todo-item')
    .filter({ hasText: 'Buy milk' })
    .locator('.share-checkbox')
    .click();
  await sharingPanel.locator('.sharing-recipient-input').fill('unknownuser');
  await page.locator('.share-submit-button').click();

  await expect(page.locator('.toast.error')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.toast.error')).toContainText('user does not exist');
  await expect(
    sharingPanel.locator('.todo-item.selected').filter({ hasText: 'Buy milk' })
  ).toBeVisible();
  await expect(sharingPanel.locator('.sharing-recipient-input')).toHaveValue('unknownuser');
});

// Scenario: Sharing with yourself or an admin shows a cannot-share error
test('Sharing with yourself or an admin shows a cannot-share error', async ({ page, request }) => {
  await createTodoViaApi(request, 'Buy milk', token);
  await page.reload();

  await page.locator('#share-todos-button').click();
  const sharingPanel = page.locator('#sharing-panel');

  await sharingPanel
    .locator('.todo-item')
    .filter({ hasText: 'Buy milk' })
    .locator('.share-checkbox')
    .click();
  await sharingPanel.locator('.sharing-recipient-input').fill(TEST_USERNAME);
  await page.locator('.share-submit-button').click();

  await expect(page.locator('.toast.error')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.toast.error')).toContainText('cannot share with user');

  await sharingPanel.locator('.sharing-recipient-input').fill(ADMIN_USERNAME);
  await page.locator('.share-submit-button').click();

  await expect(page.locator('.toast.error')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.toast.error')).toContainText('cannot share with user');
});

// Scenario: Sharing a todo that is already shared with the same recipient shows a duplicate error
test('Sharing a todo that is already shared with the same recipient shows a duplicate error', async ({
  page,
  request,
}) => {
  const todoId = await createTodoViaApi(request, 'Buy milk', token);
  await registerViaApi(request, 'alice', 'alicepass123');
  await shareTodoViaApi(request, todoId, 'alice', token);
  await page.reload();

  await page.locator('#share-todos-button').click();
  const sharingPanel = page.locator('#sharing-panel');

  await sharingPanel
    .locator('.todo-item')
    .filter({ hasText: 'Buy milk' })
    .locator('.share-checkbox')
    .click();
  await sharingPanel.locator('.sharing-recipient-input').fill('alice');
  await page.locator('.share-submit-button').click();

  await expect(page.locator('.toast.error')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.toast.error')).toContainText('already shared with user');
  await expect(
    sharingPanel.locator('.todo-item.selected').filter({ hasText: 'Buy milk' })
  ).toBeVisible();
  await expect(sharingPanel.locator('.sharing-recipient-input')).toHaveValue('alice');
});

// Scenario: Todos shared with me appear in sharing mode but are not selectable
test('Todos shared with me appear in sharing mode but are not selectable', async ({
  page,
  request,
}) => {
  const bobToken = await registerViaApi(request, 'bob', 'bobpass123');
  const todoId = await createTodoViaApi(request, 'Team standup', bobToken);
  await shareTodoViaApi(request, todoId, TEST_USERNAME, bobToken);
  await page.reload();

  await page.locator('#share-todos-button').click();
  const sharingPanel = page.locator('#sharing-panel');

  await expect(sharingPanel.locator('.todo-item').filter({ hasText: 'Team standup' })).toBeVisible();
  await expect(
    sharingPanel.locator('.todo-item').filter({ hasText: 'Team standup' }).locator('.share-checkbox')
  ).not.toBeVisible();
});

// Scenario: A todo shared with me appears in the main list with a shared-by label
test('A todo shared with me appears in the main list with a shared-by label', async ({
  page,
  request,
}) => {
  const bobToken = await registerViaApi(request, 'bob', 'bobpass123');
  const todoId = await createTodoViaApi(request, 'Team standup', bobToken);
  await shareTodoViaApi(request, todoId, TEST_USERNAME, bobToken);
  await page.reload();

  await expect(page.locator('.todo-item').filter({ hasText: 'Team standup' })).toBeVisible();
  await expect(
    page.locator('.todo-item').filter({ hasText: 'Team standup' }).locator('.shared-by-label')
  ).toHaveText('Shared by bob');
});

// Scenario: A recipient can complete, edit, and delete a shared todo
test('A recipient can complete, edit, and delete a shared todo', async ({ page, request }) => {
  const bobToken = await registerViaApi(request, 'bob', 'bobpass123');
  const todoId = await createTodoViaApi(request, 'Team standup', bobToken);
  await shareTodoViaApi(request, todoId, TEST_USERNAME, bobToken);
  await page.reload();

  const standupItem = page.locator('.todo-item').filter({ hasText: 'Team standup' });

  await standupItem.getByRole('checkbox').click();
  await expect(standupItem.getByRole('checkbox')).toBeChecked();

  await standupItem.locator('.edit-button').click();
  await page.locator('.edit-input').fill('Weekly standup');
  await page.locator('.save-button').click();

  await expect(page.locator('.todo-item').filter({ hasText: 'Weekly standup' })).toBeVisible();

  await page.locator('.todo-item').filter({ hasText: 'Weekly standup' }).locator('.delete-button').click();
  await expect(page.locator('.todo-item').filter({ hasText: 'Weekly standup' })).not.toBeVisible();
});

// Scenario: A successful share is recorded in the audit log for each shared todo
test('A successful share is recorded in the audit log for each shared todo', async ({
  page,
  request,
}) => {
  const todoId = await createTodoViaApi(request, 'Buy milk', token);
  await registerViaApi(request, 'alice', 'alicepass123');
  const adminToken = await loginViaApi(request, ADMIN_USERNAME, ADMIN_PASSWORD);
  await clearAuditLogsViaApi(request, adminToken);
  await page.reload();

  await page.locator('#share-todos-button').click();
  const sharingPanel = page.locator('#sharing-panel');

  await sharingPanel
    .locator('.todo-item')
    .filter({ hasText: 'Buy milk' })
    .locator('.share-checkbox')
    .click();
  await sharingPanel.locator('.sharing-recipient-input').fill('alice');
  await page.locator('.share-submit-button').click();

  await expect(page.locator('.toast.success')).toBeVisible({ timeout: 5000 });

  const logs = await getAuditLogsViaApi(request, adminToken);
  const sharedEntry = logs.find(
    (l) => l.actionType === 'TODO_SHARED' && l.resourceId === todoId && l.outcome === 'SUCCESS'
  );
  expect(sharedEntry).toBeDefined();
});
