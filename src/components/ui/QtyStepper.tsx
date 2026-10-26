import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';

export const QTY_MAX = 1_000_000;

/**
 * Количество: крупные «−» и «+», поле с цифрами, удержание кнопки.
 *
 * Стандартное числовое поле браузера — крошечные стрелки, в которые на складе
 * не попасть пальцем. Здесь кнопки по 36 px; при удержании число бежит само, а
 * через пару секунд — десятками. В поле: стрелки ↑/↓ меняют на 1 (с Shift — на
 * 10), Enter заканчивает ввод, фокус выделяет число целиком. Пока набираете,
 * поле можно очистить — пустое значение не превращается в 1 на лету.
 */
export const QtyStepper = memo(function QtyStepper({
  value, active, label, onSet, onStep, size = 'md', min = 1, max = QTY_MAX, fill = false, blank = false, placeholder = '0',
}: {
  value: number;
  active: boolean;
  label: string;
  onSet: (qty: number) => void;
  onStep: (delta: number) => void;
  /** sm — компактный для плотных списков; !min-h-0 снимает общий минимум высоты кнопок для касаний. */
  size?: 'md' | 'sm';
  /** Наименьшее значение: 1 для количества, 0 для «может быть нулём». */
  min?: number;
  max?: number;
  /** Растянуть поле на всю ширину — для форм, где число стоит в колонке. */
  fill?: boolean;
  /** Пока значение не задано, поле пустое, а не «0». */
  blank?: boolean;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepRef = useRef(onStep);
  stepRef.current = onStep;

  const stop = useCallback(() => {
    if (delayRef.current) clearTimeout(delayRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    delayRef.current = null;
    tickRef.current = null;
  }, []);
  useEffect(() => stop, [stop]);

  const hold = (dir: 1 | -1) => {
    stop();
    setDraft(null);
    stepRef.current(dir);
    delayRef.current = setTimeout(() => {
      let ticks = 0;
      tickRef.current = setInterval(() => {
        ticks += 1;
        stepRef.current(dir * (ticks > 20 ? 10 : 1));
      }, 90);
    }, 420);
  };

  const sm = size === 'sm';
  const btn = `flex ${sm ? 'h-7 w-7 !min-h-0 !p-0' : 'h-9 w-9'} shrink-0 select-none touch-none items-center justify-center rounded-lg border text-slate-700 transition-colors `
    + 'border-slate-300 bg-white hover:bg-slate-100 active:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-white';
  const icon = sm ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div className={`flex items-center ${sm ? 'gap-0.5' : 'gap-1'} ${fill ? 'w-full' : ''}`}>
      <button
        type="button"
        className={btn}
        disabled={!active || value <= min}
        aria-label={`Меньше: ${label}`}
        onPointerDown={(e) => { e.preventDefault(); hold(-1); }}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stepRef.current(-1); } }}
      >
        <Minus className={icon} />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={draft ?? (active && !blank ? String(value) : '')}
        placeholder={placeholder}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, '').slice(0, 7);
          setDraft(v);
          const n = Number(v);
          if (v !== '' && n >= min) onSet(Math.min(max, n));
        }}
        onBlur={() => setDraft(null)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.currentTarget.blur(); return; }
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            setDraft(null);
            stepRef.current((e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 10 : 1));
          }
        }}
        className={`${sm ? 'h-7 !min-h-0 !px-1 !py-0 text-xs' : 'h-9 text-sm'} ${fill ? 'min-w-0 flex-1' : sm ? 'w-11' : 'w-14'} rounded-lg border text-center font-semibold tabular-nums outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 ${active ? 'border-indigo-300 bg-white text-slate-900' : 'border-slate-200 bg-slate-50 text-slate-400'}`}
        aria-label={`Количество: ${label}`}
      />
      <button
        type="button"
        className={btn}
        disabled={value >= max}
        aria-label={`Больше: ${label}`}
        onPointerDown={(e) => { e.preventDefault(); hold(1); }}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stepRef.current(1); } }}
      >
        <Plus className={icon} />
      </button>
    </div>
  );
});
