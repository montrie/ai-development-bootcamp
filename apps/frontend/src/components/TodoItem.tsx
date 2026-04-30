import type { Todo } from '../api';

type Props = {
  todo: Todo;
  onToggle: (id: number, done: boolean) => void;
  onDelete: (id: number) => void;
};

export default function TodoItem({ todo, onToggle, onDelete }: Props) {
  return (
    <li className="todo-item">
      <input
        type="checkbox"
        checked={todo.done}
        aria-label={`Mark ${todo.text} as ${todo.done ? 'incomplete' : 'complete'}`}
        onChange={() => onToggle(todo.id, !todo.done)}
      />
      <span className={todo.done ? 'completed' : undefined}>{todo.text}</span>
      <button aria-label={`Delete ${todo.text}`} onClick={() => onDelete(todo.id)}>
        Delete
      </button>
    </li>
  );
}
