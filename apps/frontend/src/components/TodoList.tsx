import type { Todo } from '../services/api';
import '../styles/TodoList.css';
import TodoItem from './TodoItem';

type Props = {
  todos: Todo[];
  onToggle: (id: number, done: boolean) => void;
  onDelete: (id: number) => void;
  editingId: number | null;
  onEditStart: (id: number) => void;
  onEditCancel: () => void;
  onEdit: (id: number, patch: { text: string; dueDate: string | null }) => void;
  onDragStart?: (index: number) => void;
  onDragOver?: (e: React.DragEvent, index: number) => void;
  onDrop?: (index: number) => void;
  onDragEnd?: () => void;
};

export default function TodoList({
  todos,
  onToggle,
  onDelete,
  editingId,
  onEditStart,
  onEditCancel,
  onEdit,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: Props) {
  // Drag is disabled for all items when any item is in edit mode
  const draggingEnabled = editingId === null && onDragStart !== undefined;

  if (todos.length === 0) {
    return <p className="empty-placeholder">No tasks yet — add one above!</p>;
  }
  return (
    <ul className="todo-list">
      {todos.map((todo, index) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
          isEditing={editingId === todo.id}
          onEditStart={onEditStart}
          onEditCancel={onEditCancel}
          onEdit={onEdit}
          draggable={draggingEnabled}
          onDragStart={draggingEnabled ? () => onDragStart(index) : undefined}
          onDragOver={draggingEnabled ? (e) => onDragOver!(e, index) : undefined}
          onDrop={draggingEnabled ? () => onDrop!(index) : undefined}
          onDragEnd={draggingEnabled ? onDragEnd : undefined}
        />
      ))}
    </ul>
  );
}
