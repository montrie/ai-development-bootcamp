import type { APIRequestContext, Page } from '@playwright/test';

export const enterTodoText = (page: Page, text: string) =>
  page.fill('#todo-input', text);

export const clickAddButton = (page: Page) => page.click('#add-button');

export const getDeleteButton = (page: Page, text: string) =>
  page.getByRole('button', { name: new RegExp(`delete ${text}`, 'i') });

export async function resetState(request: APIRequestContext): Promise<void> {
  await request.delete('/api/todos');
}

export async function createTodoViaApi(
  request: APIRequestContext,
  text: string
): Promise<number> {
  const response = await request.post('/api/todos', { data: { text } });
  const todo = await response.json();
  return todo.id as number;
}

export async function completeTodoViaApi(
  request: APIRequestContext,
  id: number
): Promise<void> {
  await request.patch(`/api/todos/${id}`, { data: { done: true } });
}
