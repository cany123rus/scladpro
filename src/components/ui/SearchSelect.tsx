import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search } from 'lucide-react';
import { fold } from './FacetSelect';

export type SearchSelectOption = { value: string; label: string; hint?: string };

/**
 * Выбор одного значения из списка, с поиском.
 *
 * Замена обычному <select>, когда пунктов много (поставщики, сотрудники,
 * категории): в обычном списке такое не найти, здесь пишете часть названия.
 * Значение и onChange — те же строки, что у <select>, поэтому подмена в разделе
 * не трогает остальной код. emptyLabel — пункт «Все …» с пустым значением.
 * Закрывается кликом снаружи и Esc; Enter в поиске выбирает первый найденный.
 *
 * Список рисуется поверх страницы (портал в body, position: fixed), а не внутри
 * блока: в окнах и таблицах с прокруткой обычный выпадающий блок обрезался бы
 * краем контейнера. Снизу не помещается — открывается вверх.
 */
export function SearchSelect({
  value, onChange, options, emptyLabel, placeholder = 'Выберите', className = '', disabled = false, ariaLabel,
}: {
  value: string;
  onChange: (next: string) => void;
  options: SearchSelectOption[];
  emptyLabel?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number } | null>(null);

  useEffect(() => {
    if (!open) { setQ(''); return; }
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    // Страница прокрутилась или окно изменилось — список остался бы висеть на старом месте.
    const onMove = (e: Event) => { if (e.target instanceof Node && popRef.current?.contains(e.target)) return; setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    inputRef.current?.focus();
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !rootRef.current) return;
    const r = rootRef.current.getBoundingClientRect();
    const need = 340;
    const width = Math.max(r.width, 240);
    const left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8));
    if (window.innerHeight - r.bottom < need && r.top > window.innerHeight - r.bottom) {
      setPos({ left, width, bottom: window.innerHeight - r.top + 4 });
    } else {
      setPos({ left, width, top: r.bottom + 4 });
    }
  }, [open]);

  const current = options.find((o) => o.value === value);
  const shown = useMemo(() => {
    const needle = fold(q);
    return needle ? options.filter((o) => fold(`${o.label} ${o.hint || ''}`).includes(needle)) : options;
  }, [options, q]);

  const pick = (next: string) => { onChange(next); setOpen(false); };

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={ariaLabel}
        className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 hover:border-indigo-300 disabled:opacity-50"
      >
        <span className={`flex-1 truncate ${current || (!value && emptyLabel) ? '' : 'text-slate-400'}`}>
          {current ? current.label : !value && emptyLabel ? emptyLabel : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && pos && createPortal(
        <div
          ref={popRef}
          className="oc-popover fixed !z-[70] p-2"
          style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom }}
        >
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && shown[0]) { e.preventDefault(); pick(shown[0].value); } }}
              placeholder="Найти…"
              className="oc-input w-full !pl-8"
            />
          </div>
          <div className="max-h-72 overflow-auto">
            {emptyLabel && !q && (
              <button type="button" onClick={() => pick('')} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-50">
                <span className="flex-1 truncate text-slate-500">{emptyLabel}</span>
                {!value && <Check className="h-4 w-4 text-indigo-600" />}
              </button>
            )}
            {shown.map((o) => (
              <button type="button" key={o.value} onClick={() => pick(o.value)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-50">
                <span className="flex-1 truncate" title={o.label}>{o.label}</span>
                {o.hint && <span className="text-xs text-slate-400">{o.hint}</span>}
                {o.value === value && <Check className="h-4 w-4 shrink-0 text-indigo-600" />}
              </button>
            ))}
            {shown.length === 0 && <div className="px-2 py-4 text-center text-sm text-slate-400">Ничего не найдено</div>}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
