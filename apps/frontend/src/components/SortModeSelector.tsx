import '../styles/SortModeSelector.css';

type Props = {
  value: string;
  disabled: boolean;
  onChange: (sortMode: string) => void;
};

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'CREATED_ASC', label: 'Date created (oldest first)' },
  { value: 'CREATED_DESC', label: 'Date created (newest first)' },
  // EARLIEST_FIRST = ascending due dates = earlier/sooner deadlines appear first
  { value: 'DUE_DATE_EARLIEST_FIRST', label: 'Due date (earliest first)' },
  // LATEST_FIRST = descending due dates = later/furthest deadlines appear first
  { value: 'DUE_DATE_LATEST_FIRST', label: 'Due date (latest first)' },
  { value: 'ALPHA_ASC', label: 'Alphabetical (A–Z)' },
  { value: 'ALPHA_DESC', label: 'Alphabetical (Z–A)' },
  { value: 'CUSTOM', label: 'Custom order' },
];

export default function SortModeSelector({ value, disabled, onChange }: Props) {
  return (
    <div className="sort-mode-wrapper">
      <label htmlFor="sort-mode-select" className="sort-mode-label">Sort by</label>
      <select
        id="sort-mode-select"
        data-testid="sort-mode-select"
        className="sort-mode-select"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
