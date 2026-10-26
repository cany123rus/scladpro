import { Search, X } from 'lucide-react';

/**
 * Поле поиска: лупа слева, крестик «очистить» справа.
 *
 * Один вид на весь сайт — раньше в каждом разделе была своя вёрстка поля.
 */
export function SearchField({
  value, onChange, placeholder, ariaLabel = 'Поиск', className = '', autoFocus = false,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="oc-input w-full !pl-9 !pr-9"
        aria-label={ariaLabel}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 !min-h-0 text-slate-400 hover:text-slate-700"
          aria-label="Очистить поиск"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
