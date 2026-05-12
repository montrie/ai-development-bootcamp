import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/AddTodoForm.css';

function toLocalIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

type Props = {
  onAdd: (text: string, dueDate: string | null) => void;
};

export default function AddTodoForm({ onAdd }: Props) {
  const [value, setValue] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [invalid, setInvalid] = useState(false);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed) {
      setInvalid(true);
      return;
    }
    const dueDateIso = dueDate ? toLocalIso(dueDate) : null;
    onAdd(trimmed, dueDateIso);
    setValue('');
    setDueDate(null);
    setInvalid(false);
  }

  return (
    <div className="add-todo-form">
      <input
        id="todo-input"
        className="todo-input"
        type="text"
        value={value}
        aria-label="Todo input"
        aria-invalid={invalid ? 'true' : undefined} // undefined omits the attribute; false would keep it and some screen readers announce it
        placeholder="What needs to be done?"
        onChange={(e) => {
          setValue(e.target.value);
          if (invalid) setInvalid(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
      />
      <DatePicker
        id="due-date-input"
        className="due-date-picker"
        wrapperClassName="due-date-picker-wrapper"
        portalId="datepicker-portal"
        selected={dueDate}
        onChange={(date) => setDueDate(date)}
        placeholderText="Due date (optional)"
        dateFormat="yyyy-MM-dd"
      />
      <button id="add-button" onClick={submit}>
        Add
      </button>
    </div>
  );
}
