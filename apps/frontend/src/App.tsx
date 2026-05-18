import { useEffect, useRef, useState } from 'react';
import { fetchTodos, createTodo, updateTodo, deleteTodo, unshareTodo, editTodo, shareTodos, fetchUserProfile, updateSortMode, reorderTodos, type Todo } from './services/api';
import { getToken, setToken, clearToken, getRole } from './services/auth';
import AddTodoForm from './components/AddTodoForm';
import AdminPanel from './components/AdminPanel';
import AuthPage from './components/AuthPage';
import ChangePasswordForm from './components/ChangePasswordForm';
import Navbar from './components/Navbar';
import SharingPanel from './components/SharingPanel';
import SortModeSelector from './components/SortModeSelector';
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
  const [sortMode, setSortMode] = useState<string>('CREATED_ASC');
  const [sortModeUpdating, setSortModeUpdating] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);
  // Tracks the index of the item being dragged within the current render order
  const dragIndexRef = useRef<number | null>(null);
  // Mirrors the todos state so drag handlers always read the latest order
  const todosRef = useRef<typeof todos>([]);

  const role = token ? getRole() : null;

  // Keep todosRef in sync with todos on every render so drag handlers read the latest order
  todosRef.current = todos;

  // [token] dependency re-triggers the fetch after login, not just on first mount
  // Skip fetching todos for admin users — they use the admin panel instead
  useEffect(() => {
    if (!token || role === 'ADMIN') return;
    Promise.resolve(fetchUserProfile())
      .then((profile) => { if (profile?.sortMode) setSortMode(profile.sortMode); })
      .catch(() => {});
    fetchTodos()
      .then(setTodos)
      .catch(() => setError('Could not reach the server. Changes will not be saved.'));
  }, [token, role]);

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

  async function handleSortModeChange(newMode: string) {
    setSortModeUpdating(true);
    try {
      await updateSortMode(newMode);
      setSortMode(newMode);
      const refreshed = await fetchTodos();
      setTodos(refreshed);
    } finally {
      setSortModeUpdating(false);
    }
  }

  function handleDragStart(index: number) {
    // Record which item is being dragged so handleDragOver can compute the swap
    dragIndexRef.current = index;
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    // Required by the HTML5 drag API to allow the drop event to fire on this element
    e.preventDefault();
    const fromIndex = dragIndexRef.current;
    if (fromIndex === null || fromIndex === index) return;
    // Optimistically reorder the list in real time as the user drags
    const next = [...todosRef.current];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(index, 0, moved);
    todosRef.current = next;
    setTodos(next);
    dragIndexRef.current = index;
  }

  function handleDrop() {
    // The optimistic reorder already happened incrementally in handleDragOver;
    // the final persist is done in handleDragEnd once the drag completes.
  }

  async function handleDragEnd() {
    // Snapshot the current display order from the ref (always up-to-date during drag)
    const orderedIds = todosRef.current.map((t) => t.id);
    dragIndexRef.current = null;
    try {
      await reorderTodos(orderedIds);
      // After a successful reorder the backend switches the user's sort mode to CUSTOM
      setSortMode('CUSTOM');
    } catch {
      // Revert the optimistic reorder and show an error using the .error-message class
      // (distinct from .error-notice which is for the initial server connection failure)
      setDragError('Could not save the new order.');
      const reverted = await fetchTodos().catch(() => null);
      if (reverted) setTodos(reverted);
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
        {dragError && <p className="error-message">{dragError}</p>}
        {showChangePassword && <ChangePasswordForm />}
        {sharingMode ? (
          <SharingPanel
            todos={todos}
            selectedIds={selectedShareIds}
            onToggleSelect={handleToggleSelect}
            recipientUsername={shareRecipient}
            onRecipientChange={setShareRecipient}
            onShare={handleShare}
            sortMode={sortMode}
            sortModeUpdating={sortModeUpdating}
            onSortChange={handleSortModeChange}
          />
        ) : (
          <>
            <SortModeSelector
              value={sortMode}
              disabled={sortModeUpdating}
              onChange={handleSortModeChange}
            />
            <AddTodoForm onAdd={handleAdd} />
            <TodoList
              todos={todos}
              onToggle={handleToggle}
              onDelete={handleDelete}
              editingId={editingId}
              onEditStart={handleEditStart}
              onEditCancel={handleEditCancel}
              onEdit={handleEdit}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
            />
          </>
        )}
      </div>
    </>
  );
}
