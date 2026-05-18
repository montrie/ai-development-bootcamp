import type { Todo } from '../services/api';
import '../styles/SharingPanel.css';
import SortModeSelector from './SortModeSelector';

type Props = {
  todos: Todo[];
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  recipientUsername: string;
  onRecipientChange: (v: string) => void;
  onShare: () => void;
  sortMode: string;
  sortModeUpdating: boolean;
  onSortChange: (mode: string) => void;
};

export default function SharingPanel({
  todos,
  selectedIds,
  onToggleSelect,
  recipientUsername,
  onRecipientChange,
  onShare,
  sortMode,
  sortModeUpdating,
  onSortChange,
}: Props) {
  const isDisabled = selectedIds.size === 0 || recipientUsername.trim() === '';

  return (
    <div id="sharing-panel">
      <SortModeSelector value={sortMode} disabled={sortModeUpdating} onChange={onSortChange} />
      <div className="sharing-controls">
        <input
          type="text"
          className="sharing-recipient-input"
          value={recipientUsername}
          onChange={(e) => onRecipientChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !isDisabled) onShare(); }}
          placeholder="Recipient username"
        />
        <button className="share-submit-button" disabled={isDisabled} onClick={onShare}>
          Share selected todos
        </button>
      </div>
      <ul className="sharing-todo-list">
        {todos.map((todo) => {
          const isOwn = !todo.sharedBy;
          const isSelected = selectedIds.has(todo.id);
          return (
            <li
              key={todo.id}
              className={`todo-item${isOwn ? ' selectable' : ''}${isSelected ? ' selected' : ''}`}
              onClick={isOwn ? () => onToggleSelect(todo.id) : undefined}
            >
              <div className="sharing-item-content">
                <span className="sharing-item-text">{todo.text}</span>
                {todo.sharedBy && (
                  <span className="sharing-shared-by">Shared by {todo.sharedBy}</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
