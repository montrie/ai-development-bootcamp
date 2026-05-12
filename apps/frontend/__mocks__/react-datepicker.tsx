export default function MockDatePicker({
  id,
  onChange,
  selected,
  className,
  placeholderText,
}: {
  id?: string;
  onChange: (date: Date | null) => void;
  selected: Date | null;
  className?: string;
  placeholderText?: string;
}) {
  return (
    <input
      id={id}
      className={className}
      placeholder={placeholderText}
      value={selected ? selected.toISOString().split('T')[0] : ''}
      onChange={(e) => {
        const val = e.target.value;
        onChange(val ? new Date(val + 'T12:00:00') : null);
      }}
    />
  );
}
