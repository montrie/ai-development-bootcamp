import { useState, useEffect } from 'react';

export function MockDatePicker({
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
  const [displayValue, setDisplayValue] = useState('');

  // Sync external selected → display when parent resets or pre-populates
  useEffect(() => {
    if (selected && !isNaN(selected.getTime())) {
      setDisplayValue(selected.toISOString().split('T')[0]);
    } else {
      setDisplayValue('');
    }
  }, [selected]);

  return (
    <input
      id={id}
      className={className}
      placeholder={placeholderText}
      value={displayValue}
      onChange={(e) => {
        const val = e.target.value;
        setDisplayValue(val);
        if (!val) {
          onChange(null);
          return;
        }
        // Only propagate a complete YYYY-MM-DD date to avoid mid-type feedback
        if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
          const date = new Date(val + 'T12:00:00');
          if (!isNaN(date.getTime())) onChange(date);
        }
      }}
    />
  );
}
