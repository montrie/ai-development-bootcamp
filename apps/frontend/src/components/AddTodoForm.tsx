import { useState } from 'react';

type Props = {
  onAdd: (text: string) => void;
};

export default function AddTodoForm({ onAdd }: Props) {
  const [value, setValue] = useState('');
  const [invalid, setInvalid] = useState(false);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed) {
      setInvalid(true);
      return;
    }
    onAdd(trimmed);
    setValue('');
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
        aria-invalid={invalid ? 'true' : undefined}
        placeholder="What needs to be done?"
        onChange={(e) => {
          setValue(e.target.value);
          if (invalid) setInvalid(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
      />
      <button id="add-button" onClick={submit}>
        Add
      </button>
    </div>
  );
}
