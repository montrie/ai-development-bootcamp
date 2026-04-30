import { useEffect, useState } from 'react';
import { fetchTodos, createTodo, updateTodo, deleteTodo, type Todo } from './api';
import AddTodoForm from './components/AddTodoForm';
import TodoList from './components/TodoList';
import './App.css';

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTodos()
      .then(setTodos)
      .catch(() => setError('Could not reach the server. Changes will not be saved.'));
  }, []);

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
      <h1>To-Do List</h1>
      {error && <p className="error-notice">{error}</p>}
      <AddTodoForm onAdd={handleAdd} />
      <TodoList todos={todos} onToggle={handleToggle} onDelete={handleDelete} />
    </div>
  );
}
