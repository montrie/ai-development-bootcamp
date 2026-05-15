import { useEffect, useState } from 'react';
import { fetchTodos, createTodo, updateTodo, deleteTodo, unshareTodo, editTodo, shareTodos, type Todo } from './services/api';
import { getToken, setToken, clearToken, getRole } from './services/auth';
import AddTodoForm from './components/AddTodoForm';
import AdminPanel from './components/AdminPanel';
import AuthPage from './components/AuthPage';
import ChangePasswordForm from './components/ChangePasswordForm';
import Navbar from './components/Navbar';
import SharingPanel from './components/SharingPanel';
import TodoList from './components/TodoList';
import './styles/App.css';

export default function App() {
  const [token, setTokenState] = useState<string | null>(getToken());
  const [todos, setTodos] = useState<Todo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [sharingMode, setSharingMode] = useState(false);
  const [selectedShareIds, setSelectedShareIds] = useState<Set<number>>(new Set());
  const [shareRecipient, setShareRecipient] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const role = token ? getRole() : null;

  // [token] dependency re-triggers the fetch after login, not just on first mount
  // Skip fetching todos for admin users — they use the admin panel instead
  useEffect(() => {
    if (!token || role === 'ADMIN') return;
    fetchTodos()
      .then(setTodos)
      .catch(() => setError('Could not reach the server. Changes will not be saved.'));
  }, [token]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

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

  if (role === 'ADMIN') {
    return <AdminPanel onLogout={handleLogout} />;
  }

  async function handleAdd(text: string, dueDate: string | null) {
    const created = await createTodo(text, dueDate);
    setTodos((prev) => [...prev, created]);
  }

  async function handleToggle(id: number, done: boolean) {
    const updated = await updateTodo(id, done);
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...updated, sharedBy: t.sharedBy } : t)));
  }

  async function handleDelete(id: number) {
    const todo = todos.find((t) => t.id === id);
    await (todo?.sharedBy ? unshareTodo(id) : deleteTodo(id));
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  function handleEditStart(id: number) {
    setEditingId(id);
  }

  function handleEditCancel() {
    setEditingId(null);
  }

  async function handleEdit(id: number, patch: { text: string; dueDate: string | null }) {
    const updated = await editTodo(id, patch);
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...updated, sharedBy: t.sharedBy } : t)));
    setEditingId(null);
  }

  function handleShareToggle() {
    setSharingMode((prev) => {
      if (prev) {
        setSelectedShareIds(new Set());
        setShareRecipient('');
      }
      return !prev;
    });
  }

  function handleToggleSelect(id: number) {
    setSelectedShareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleShare() {
    try {
      await shareTodos([...selectedShareIds], shareRecipient);
      setSelectedShareIds(new Set());
      setShareRecipient('');
      setToast({ message: 'Todos shared successfully', type: 'success' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Share failed';
      setToast({ message, type: 'error' });
    }
  }

  return (
    <>
      <Navbar
        title="To-Do List"
        onChangePassword={() => setShowChangePassword((p) => !p)}
        onLogout={handleLogout}
        sharingMode={sharingMode}
        onShareToggle={handleShareToggle}
      />
      <div className="app">
        {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
        {error && <p className="error-notice">{error}</p>}
        {showChangePassword && <ChangePasswordForm />}
        {sharingMode ? (
          <SharingPanel
            todos={todos}
            selectedIds={selectedShareIds}
            onToggleSelect={handleToggleSelect}
            recipientUsername={shareRecipient}
            onRecipientChange={setShareRecipient}
            onShare={handleShare}
          />
        ) : (
          <>
            <AddTodoForm onAdd={handleAdd} />
            <TodoList
              todos={todos}
              onToggle={handleToggle}
              onDelete={handleDelete}
              editingId={editingId}
              onEditStart={handleEditStart}
              onEditCancel={handleEditCancel}
              onEdit={handleEdit}
            />
          </>
        )}
      </div>
    </>
  );
}
