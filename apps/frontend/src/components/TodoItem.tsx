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
    <li className="todo-item">
      <input
        type="checkbox"
        checked={todo.done}
        aria-label={`Mark ${todo.text} as ${todo.done ? 'incomplete' : 'complete'}`}
        onChange={() => onToggle(todo.id, !todo.done)}
      />
      <span className={todo.done ? 'completed' : undefined}>{todo.text}</span>
      {todo.dueDate && (
        <span className={dueDateClass}>{formatDueDate(todo.dueDate)}</span>
      )}
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
