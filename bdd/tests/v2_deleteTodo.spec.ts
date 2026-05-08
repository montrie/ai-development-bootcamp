import { test, expect } from '@playwright/test';
import { resetUsers, registerViaApi, navigateAsUser, createTodoViaApi, enterTodoText, clickAddButton, getDeleteButton, TEST_USERNAME, TEST_PASSWORD } from './helpers';

let userToken: string;

test.beforeEach(async ({ page, request }) => {
  await resetUsers(request);
  userToken = await registerViaApi(request, TEST_USERNAME, TEST_PASSWORD);
  await createTodoViaApi(request, 'Buy milk', userToken);
  await navigateAsUser(page, request, TEST_USERNAME, TEST_PASSWORD);
});

// Feature: Delete a ToDo Item

test('Each todo item has a delete button', async ({ page }) => {
  await expect(getDeleteButton(page, 'Buy milk')).toBeVisible();
});

test('Clicking the delete button removes the item from the list', async ({ page }) => {
  await getDeleteButton(page, 'Buy milk').click();
  await expect(page.getByText('Buy milk')).not.toBeVisible();
});

test('Deleted item does not reappear after adding a new item', async ({ page }) => {
  await getDeleteButton(page, 'Buy milk').click();
  await enterTodoText(page, 'Call dentist');
  await clickAddButton(page);
  await expect(page.getByText('Call dentist')).toBeVisible();
  await expect(page.getByText('Buy milk')).not.toBeVisible();
});

test('Deleting the last item shows the empty placeholder', async ({ page }) => {
  await getDeleteButton(page, 'Buy milk').click();
  await expect(page.getByText('No tasks yet — add one above!')).toBeVisible();
});
