import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search } from 'lucide-react';
import { fold } from './FacetSelect';

export type SearchSelectOption = { value: string; label: string; hint?: string; disabled?: boolean };

/** Поиск в списке нужен, когда пунктов больше этого: в коротком он только занимает место. */
const SEARCH_FROM = 7;

/** Классы, которые относятся к размеру и месту блока в вёрстке, а не к виду кнопки. */
const LAYOUT_TOKEN = /^(?:-?m[trblxy]?-|w-|min-w-|max-w-|flex-\d|flex-1|flex-auto|flex-none|grow|shrink|basis-|col-span-|self-|order-|justify-self-|hidden$|md:hidden|sm:hidden|lg:hidden|(?:sm|md|lg|xl|2xl):(?:w-|min-w-|max-w-|flex-|col-span-|hidden|block))/;

/**
 * Выбор одного значения из списка, с поиском.
 *
 * Замена обычному <select>: поиск по части названия, стрелки и Enter на
 * клавиатуре, Esc и клик снаружи закрывают. Значение и onChange — те же строки,
 * что у <select>, поэтому подмена в разделе не трогает остальной код.
 * emptyLabel — пункт «Все …» с пустым значением.
 *
 * Список рисуется поверх страницы (портал в body, position: fixed), а не внутри
 * блока: в окнах и таблицах с прокруткой обычный выпадающий блок обрезался бы
 * краем контейнера. Снизу не помещается — открывается вверх.
 *
 * buttonClassName — вид кнопки, как у заменяемого <select>. Размерные классы
 * (ширина, отступы снаружи, flex) из него уходят на обёртку: у обычного <select>
 * они управляли местом в строке, и у кнопки внутри обёртки это бы не работало.
 */
export function SearchSelect({
  value, onChange, options, emptyLabel, placeholder = 'Выберите', className = '', buttonClassName, disabled = false,
  ariaLabel, title, required = false, searchable,
}: {
  value: string;
  onChange: (next: string) => void;
  options: SearchSelectOption[];
  emptyLabel?: string;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
  ariaLabel?: string;
  title?: string;
  required?: boolean;
  /** По умолчанию поиск включается, когда пунктов больше семи. */
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number } | null>(null);

  const showSearch = searchable ?? options.length + (emptyLabel ? 1 : 0) > SEARCH_FROM;

  useEffect(() => {
    if (!open) { setQ(''); setActive(0); return; }
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } };
    // Страница прокрутилась или окно изменилось — список остался бы висеть на старом месте.
    const onMove = (e: Event) => { if (e.target instanceof Node && popRef.current?.contains(e.target)) return; setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !rootRef.current) return;
    const r = rootRef.current.getBoundingClientRect();
    const need = 340;
    const width = Math.max(r.width, 224);
    const left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8));
    if (window.innerHeight - r.bottom < need && r.top > window.innerHeight - r.bottom) {
      setPos({ left, width, bottom: window.innerHeight - r.top + 4 });
    } else {
      setPos({ left, width, top: r.bottom + 4 });
    }
  }, [open]);

  // Пункты списка: «пустое» значение первым, дальше найденные по запросу.
  const items = useMemo(() => {
    const needle = fold(q);
    const list = needle ? options.filter((o) => fold(`${o.label} ${o.hint || ''}`).includes(needle)) : options;
    const head: SearchSelectOption[] = emptyLabel && !needle ? [{ value: '', label: emptyLabel }] : [];
    return [...head, ...list];
  }, [options, q, emptyLabel]);

  // Открыли — подсвечиваем текущее значение, чтобы стрелки шли от него.
  useEffect(() => {
    if (!open) return;
    const at = items.findIndex((o) => o.value === value && !o.disabled);
    setActive(at >= 0 ? at : Math.max(0, items.findIndex((o) => !o.disabled)));
  }, [open, q]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const pick = (next: string) => { onChange(next); setOpen(false); };

  const move = (dir: 1 | -1) => {
    if (!items.length) return;
    let i = active;
    for (let n = 0; n < items.length; n += 1) {
      i = (i + dir + items.length) % items.length;
      if (!items[i].disabled) { setActive(i); return; }
    }
  };

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const it = items[active];
      if (it && !it.disabled) pick(it.value);
    }
  };

  const current = options.find((o) => o.value === value);
  const shownLabel = current
    ? current.label
    : !value && emptyLabel
      ? emptyLabel
      : !value && !placeholder
        ? ''
        : placeholder;
  const muted = !current && !(emptyLabel && !value);

  // Вид кнопки: классы заменяемого <select>; размерные уходят на обёртку.
  const rawTokens = (buttonClassName || '').split(/\s+/).filter(Boolean);
  const wrapTokens = rawTokens.filter((t) => LAYOUT_TOKEN.test(t));
  const btnTokens = rawTokens.filter((t) => !LAYOUT_TOKEN.test(t));
  // oc-select / oc-input растягиваются на всю ширину стилем класса — как и заменяемый <select>.
  const hasWidth = wrapTokens.some((t) => /^(?:w-|flex-|grow|basis-|col-span-)/.test(t)) || btnTokens.some((t) => t === 'oc-select' || t === 'oc-input');
  const btnBase = buttonClassName
    ? `${btnTokens.some((t) => t === 'border' || /^border-[\dtrblxy]/.test(t)) ? '' : 'border '}${btnTokens.some((t) => /^border-(?:slate|gray|indigo|rose|emerald|amber|transparent|white|zinc|neutral|stone|sky|violet|blue|red|green|orange|yellow|teal|cyan|fuchsia|pink|purple|lime)/.test(t)) ? '' : 'border-slate-200 '}${btnTokens.some((t) => t.startsWith('bg-')) ? '' : 'bg-white '}${btnTokens.some((t) => /^rounded/.test(t)) ? '' : 'rounded-xl '}${btnTokens.some((t) => /^(?:p|px)-/.test(t)) ? '' : 'px-3 '}${btnTokens.some((t) => /^(?:p|py)-/.test(t) || /^h-/.test(t)) ? '' : 'py-2 '}${btnTokens.some((t) => /^text-(?:xs|sm|base|lg)/.test(t)) ? '' : 'text-sm '}${btnTokens.join(' ')}`
    : 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700';

  return (
    <div
      className={`relative ${hasWidth || /(?:^|\s)(?:w-|flex-|min-w-|grow)/.test(className) ? '' : 'inline-block align-middle'} ${wrapTokens.join(' ')} ${className}`}
      ref={rootRef}
    >
      <button
        type="button"
        disabled={disabled}
        title={title}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); setOpen(true); }
          else if (open && !showSearch) onListKey(e);
        }}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={`flex w-full items-center gap-2 text-left hover:border-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed ${btnBase}`}
      >
        <span className={`min-w-0 flex-1 truncate ${muted ? 'text-slate-400' : ''}`}>{shownLabel || ' '}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {required && (
        // Невидимое поле для встроенной проверки формы: без значения форма не отправится.
        <input tabIndex={-1} aria-hidden required value={value} onChange={() => undefined} className="pointer-events-none absolute bottom-0 left-0 h-px w-full opacity-0" />
      )}
      {open && pos && createPortal(
        <div
          ref={popRef}
          role="listbox"
          className="oc-popover fixed !z-[70] p-2"
          style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom }}
          onKeyDown={onListKey}
          tabIndex={-1}
        >
          {showSearch && (
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Найти…"
                className="oc-input w-full !pl-8"
              />
            </div>
          )}
          <div className="max-h-72 overflow-auto" ref={listRef}>
            {items.map((o, i) => (
              <button
                type="button"
                key={`${o.value}:${i}`}
                data-i={i}
                role="option"
                aria-selected={o.value === value}
                disabled={o.disabled}
                onMouseEnter={() => !o.disabled && setActive(i)}
                onClick={() => pick(o.value)}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm disabled:cursor-not-allowed disabled:opacity-40 ${i === active ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
              >
                <span className={`flex-1 truncate ${o.value === '' && emptyLabel ? 'text-slate-500' : ''}`} title={o.label}>{o.label}</span>
                {o.hint && <span className="text-xs text-slate-400">{o.hint}</span>}
                {o.value === value && <Check className="h-4 w-4 shrink-0 text-indigo-600" />}
              </button>
            ))}
            {items.length === 0 && <div className="px-2 py-4 text-center text-sm text-slate-400">Ничего не найдено</div>}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
