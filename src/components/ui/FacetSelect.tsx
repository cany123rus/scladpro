import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

/** Для сравнения «Дублёнки» и «дубленки» одинаково: регистр и ё не должны мешать поиску. */
export const fold = (v: string) => v.toLowerCase().replace(/ё/g, 'е').trim();

export type FacetOption = { name: string; count: number };

/**
 * Выпадающий список с поиском для категорий и брендов.
 *
 * Обычный <select> на сотню брендов не годится: не найти, не отметить несколько.
 * Здесь есть поиск по подстроке, галочки, счётчики «сколько товаров останется»
 * с учётом остальных фильтров и поиска, быстрые «выбрать найденные» и «сбросить».
 * Закрывается кликом снаружи и Esc; Enter в поиске отмечает первый найденный пункт.
 */
export function FacetSelect({
  label, options, selected, onChange,
}: {
  label: string;
  options: FacetOption[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [byName, setByName] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    inputRef.current?.focus();
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => { if (!open) setQ(''); }, [open]);

  const chosen = useMemo(() => new Set(selected), [selected]);
  const shown = useMemo(() => {
    const needle = fold(q);
    const list = needle ? options.filter((o) => fold(o.name).includes(needle)) : options.slice();
    return list.sort((a, b) => {
      const sa = chosen.has(a.name) ? 0 : 1;
      const sb = chosen.has(b.name) ? 0 : 1;
      if (sa !== sb) return sa - sb;
      // Пункты, где после остальных фильтров ничего не осталось, уходят вниз.
      const za = a.count === 0 ? 1 : 0;
      const zb = b.count === 0 ? 1 : 0;
      if (za !== zb) return za - zb;
      return byName ? a.name.localeCompare(b.name, 'ru') : b.count - a.count || a.name.localeCompare(b.name, 'ru');
    });
  }, [options, q, chosen, byName]);

  const toggle = (name: string) => onChange(chosen.has(name) ? selected.filter((x) => x !== name) : [...selected, name]);
  const addShown = () => onChange(Array.from(new Set([...selected, ...shown.filter((o) => o.count > 0).map((o) => o.name)])));

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${selected.length ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
        aria-expanded={open}
      >
        {label}
        {selected.length > 0 && <span className="rounded-full bg-indigo-600 px-1.5 text-[11px] font-semibold text-white">{selected.length}</span>}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="oc-popover absolute left-0 mt-1 w-[22rem] max-w-[92vw] p-2">
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && shown[0]) { e.preventDefault(); toggle(shown[0].name); } }}
              placeholder={`Найти: ${label.toLowerCase()}`}
              className="oc-input w-full !pl-8"
            />
          </div>
          <div className="mb-1 flex items-center justify-between px-1 text-[11px] text-slate-500">
            <span>{shown.length} из {options.length}</span>
            <button type="button" className="hover:text-slate-800" onClick={() => setByName((v) => !v)}>
              {byName ? 'по алфавиту' : 'по числу товаров'}
            </button>
          </div>
          <div className="max-h-72 overflow-auto">
            {shown.map((o) => {
              const on = chosen.has(o.name);
              return (
                <button
                  type="button"
                  key={o.name}
                  onClick={() => toggle(o.name)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-50 ${o.count === 0 && !on ? 'opacity-45' : ''}`}
                >
                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${on ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'}`}>
                    {on && <Check className="w-3 h-3" />}
                  </span>
                  <span className="flex-1 truncate" title={o.name}>{o.name}</span>
                  <span className="text-xs tabular-nums text-slate-400">{o.count}</span>
                </button>
              );
            })}
            {shown.length === 0 && <div className="px-2 py-4 text-center text-sm text-slate-400">Ничего не найдено</div>}
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
            <button type="button" className="text-xs text-slate-500 hover:text-slate-800 disabled:opacity-40" onClick={() => onChange([])} disabled={!selected.length}>Сбросить</button>
            <button type="button" className="text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-40" onClick={addShown} disabled={!shown.some((o) => o.count > 0)}>
              Выбрать найденные
            </button>
            <button type="button" className="text-xs font-semibold text-indigo-600" onClick={() => setOpen(false)}>Готово</button>
          </div>
        </div>
      )}
    </div>
  );
}
