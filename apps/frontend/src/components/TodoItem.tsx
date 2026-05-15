import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import type { Todo } from '../services/api';
import { toLocalIso } from '../utils/date';

type Props = {
  todo: Todo;
  onToggle: (id: number, done: boolean) => void;
  onDelete: (id: number) => void;
  isEditing: boolean;
  onEditStart: (id: number) => void;
  onEditCancel: () => void;
  onEdit: (id: number, patch: { text: string; dueDate: string | null }) => void;
  // When false (e.g. while any item is in edit mode) drag is fully disabled on this item
  draggable?: boolean;
  // Records which todo index is being dragged so App can compute the new order
  onDragStart?: () => void;
  // Must call e.preventDefault() to satisfy the HTML5 drag API and allow a drop
  onDragOver?: (e: React.DragEvent) => void;
  // Commits the reorder; App calls reorderTodos here
  onDrop?: () => void;
  // Cleans up transient drag state regardless of whether the drop succeeded
  onDragEnd?: () => void;
};

function formatDueDate(dueDate: string): string {
  // Parse date as local to avoid timezone shifts
  const [year, month, day] = dueDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const currentYear = new Date().getFullYear();
  const options: Intl.DateTimeFormatOptions =
    date.getFullYear() === currentYear
      ? { day: 'numeric', month: 'short' }
      : { day: 'numeric', month: 'short', year: 'numeric' };
  return 'Due ' + date.toLocaleDateString('en-GB', options);
}

function isOverdue(dueDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = dueDate.split('-').map(Number);
  const due = new Date(year, month - 1, day);
  return due < today;
}

export default function TodoItem({
  todo,
  onToggle,
  onDelete,
  isEditing,
  onEditStart,
  onEditCancel,
  onEdit,
  draggable: isDraggable = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: Props) {
  const [editText, setEditText] = useState(todo.text);
  const [editDueDate, setEditDueDate] = useState<Date | null>(
    todo.dueDate ? (() => { const [y, m, d] = todo.dueDate!.split('-').map(Number); return new Date(y, m - 1, d); })() : null
  );
  const [editInvalid, setEditInvalid] = useState(false);

  // Reset local edit state whenever we enter edit mode
  function handleEditStart() {
    setEditText(todo.text);
    setEditDueDate(
      todo.dueDate
        ? (() => { const [y, m, d] = todo.dueDate!.split('-').map(Number); return new Date(y, m - 1, d); })()
        : null
    );
    setEditInvalid(false);
    onEditStart(todo.id);
  }

  function handleSave() {
    const trimmed = editText.trim();
    if (!trimmed) {
      setEditInvalid(true);
      return;
    }
    const dueDateIso = editDueDate ? toLocalIso(editDueDate) : null;
    onEdit(todo.id, { text: trimmed, dueDate: dueDateIso });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onEditCancel();
  }

  if (isEditing) {
    return (
      <li className="todo-item editing">
        <input
          className={`edit-input${editInvalid ? ' invalid' : ''}`}
          type="text"
          value={editText}
          onChange={(e) => {
            setEditText(e.target.value);
            if (editInvalid) setEditInvalid(false);
          }}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <DatePicker
          className="edit-due-date-input"
          wrapperClassName="edit-due-date-wrapper"
          portalId="datepicker-portal"
          selected={editDueDate}
          onChange={(date) => setEditDueDate(date)}
          placeholderText="Due date (optional)"
          dateFormat="yyyy-MM-dd"
        />
        <button className="btn-save" aria-label="Save" onClick={handleSave}>Save</button>
        <button className="btn-cancel" aria-label="Cancel" onClick={onEditCancel}>Cancel</button>
      </li>
    );
  }

  const overdue = !todo.done && todo.dueDate ? isOverdue(todo.dueDate) : false;
  const dueDateClass = `due-date-label${todo.done ? ' done' : overdue ? ' overdue' : ''}`;

  return (
    <li
      className="todo-item"
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      {isDraggable && (
        <span className="drag-handle" data-testid="drag-handle" aria-hidden="true">⠿</span>
      )}
      <input
        type="checkbox"
        checked={todo.done}
        aria-label={`Mark ${todo.text} as ${todo.done ? 'incomplete' : 'complete'}`}
        onChange={() => onToggle(todo.id, !todo.done)}
      />
      <div className="todo-content">
        <span className={todo.done ? 'completed' : undefined}>{todo.text}</span>
        {todo.dueDate && (
          <span className={dueDateClass}>{formatDueDate(todo.dueDate)}</span>
        )}
      </div>
      {todo.sharedBy && (
        <span className="shared-by-label">Shared by {todo.sharedBy}</span>
      )}
      <button className="btn-edit" aria-label="Edit" onClick={handleEditStart}>Edit</button>
      <button
        className="btn-delete"
        aria-label={`${todo.sharedBy ? 'Unshare' : 'Delete'} ${todo.text}`}
        onClick={() => onDelete(todo.id)}
      >
        {todo.sharedBy ? 'Unshare' : 'Delete'}
      </button>
    </li>
  );
}
