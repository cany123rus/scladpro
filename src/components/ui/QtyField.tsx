import { QtyStepper, QTY_MAX } from './QtyStepper';

/**
 * Поле количества с кнопками «−» и «+» вместо <input type="number">.
 *
 * Принимает то же, что числовое поле: value (строка или число), onChange(e) с
 * e.target.value, min, max, placeholder, disabled. Остальные свойства старого
 * поля (className, step, type и т. п.) игнорируются: вид у всех один. Нужно, чтобы
 * во всех формах количество вводилось одинаково и без маленьких стрелок.
 */
export function QtyField({
  value, onChange, min = 1, max = QTY_MAX, placeholder, disabled = false, label = 'Количество',
}: {
  value?: string | number | null;
  onChange?: (e: { target: { value: string }; currentTarget: { value: string } }) => void;
  min?: number | string;
  max?: number | string;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  [ignored: string]: unknown;
}) {
  const lo = Number(min) || 0;
  const hi = Number(max) || QTY_MAX;
  const raw = value == null ? '' : String(value);
  const num = Number(raw);
  const current = Number.isFinite(num) ? num : 0;
  const emit = (n: number) => {
    const v = String(Math.max(lo, Math.min(hi, Math.floor(n))));
    onChange?.({ target: { value: v }, currentTarget: { value: v } });
  };
  return (
    <div className={`${disabled ? 'pointer-events-none opacity-50' : ''} w-full max-w-[16rem]`}>
      <QtyStepper
        fill
        active
        blank={raw === ''}
        value={current}
        min={lo}
        max={hi}
        label={label}
        placeholder={placeholder || String(lo)}
        onSet={emit}
        onStep={(d) => emit(current + d)}
      />
    </div>
  );
}
