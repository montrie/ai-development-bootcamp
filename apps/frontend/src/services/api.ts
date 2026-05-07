import { getToken, clearToken } from './auth';

const BASE = '/api/todos';
const AUTH_BASE = '/api/auth';
const ADMIN_BASE = '/api/admin';

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function loginUser(username: string, password: string): Promise<string> {
  const res = await fetch(`${AUTH_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error('Invalid credentials');
  const data = await res.json();
  return data.token;
}

export async function registerUser(username: string, password: string): Promise<string> {
  const res = await fetch(`${AUTH_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error('Registration failed');
  const data = await res.json();
  return data.token;
}

export type Todo = {
  id: number;
  text: string;
  done: boolean;
};

export async function fetchTodos(): Promise<Todo[]> {
  const res = await fetch(BASE, { headers: authHeaders() });
  if (res.status === 401) { clearToken(); window.location.reload(); throw new Error('Unauthorized'); }
  if (!res.ok) throw new Error('Failed to fetch todos');
  return res.json();
}

export async function createTodo(text: string): Promise<Todo> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ text }),
  });
  if (res.status === 401) { clearToken(); window.location.reload(); throw new Error('Unauthorized'); }
  if (!res.ok) throw new Error('Failed to create todo');
  return res.json();
}

export async function updateTodo(id: number, done: boolean): Promise<Todo> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ done }),
  });
  if (res.status === 401) { clearToken(); window.location.reload(); throw new Error('Unauthorized'); }
  if (!res.ok) throw new Error('Failed to update todo');
  return res.json();
}

export async function deleteTodo(id: number): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE', headers: authHeaders() });
  if (res.status === 401) { clearToken(); window.location.reload(); throw new Error('Unauthorized'); }
  if (!res.ok) throw new Error('Failed to delete todo');
}

export type User = {
  id: number;
  username: string;
  role: string;
};

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch(`${ADMIN_BASE}/users`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function deleteUser(id: number): Promise<void> {
  const res = await fetch(`${ADMIN_BASE}/users/${id}`, { method: 'DELETE', headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to delete user');
}

export async function resetUserPassword(id: number, newPassword: string): Promise<void> {
  const res = await fetch(`${ADMIN_BASE}/users/${id}/password`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ newPassword }),
  });
  if (!res.ok) throw new Error('Failed to reset password');
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const res = await fetch('/api/users/self/password', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (res.status === 401) { clearToken(); window.location.reload(); throw new Error('Unauthorized'); }
  if (!res.ok) throw new Error('Current password is incorrect');
}
