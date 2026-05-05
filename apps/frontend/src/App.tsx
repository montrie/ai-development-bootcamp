import { useEffect, useState } from 'react';
import { fetchTodos, createTodo, updateTodo, deleteTodo, type Todo } from './services/api';
import { getToken, setToken, clearToken } from './services/auth';
import AddTodoForm from './components/AddTodoForm';
import AuthPage from './components/AuthPage';
import TodoList from './components/TodoList';
import './styles/App.css';

export default function App() {
  const [token, setTokenState] = useState<string | null>(getToken());
  const [todos, setTodos] = useState<Todo[]>([]);
  const [error, setError] = useState<string | null>(null);

  // [token] dependency re-triggers the fetch after login, not just on first mount
  useEffect(() => {
    if (!token) return;
    fetchTodos()
      .then(setTodos)
      .catch(() => setError('Could not reach the server. Changes will not be saved.'));
  }, [token]);

  function handleAuth(tok: string) {
    setToken(tok);
    setTokenState(tok);
  }

  function handleLogout() {
    clearToken();
    setTokenState(null);
    setTodos([]);
  }

  if (!token) {
    return <AuthPage onAuth={handleAuth} />;
  }

  async function handleAdd(text: string) {
    const created = await createTodo(text);
    setTodos((prev) => [...prev, created]);
  }

  async function handleToggle(id: number, done: boolean) {
    const updated = await updateTodo(id, done);
    setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }

  async function handleDelete(id: number) {
    await deleteTodo(id);
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="app">
      <div className="app-header">
        <h1>To-Do List</h1>
        <button onClick={handleLogout}>Log out</button>
      </div>
      {error && <p className="error-notice">{error}</p>}
      <AddTodoForm onAdd={handleAdd} />
      <TodoList todos={todos} onToggle={handleToggle} onDelete={handleDelete} />
    </div>
  );
}
