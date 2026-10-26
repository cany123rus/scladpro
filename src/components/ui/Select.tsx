import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { SearchSelect, type SearchSelectOption } from './SearchSelect';

/** Текст из содержимого <option>: строки, числа и вложенные массивы. */
const textOf = (node: ReactNode): string => {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement(node)) return textOf((node.props as { children?: ReactNode }).children);
  return '';
};

/** Собираем пункты из дочерних <option>, в том числе из фрагментов и массивов. */
const collect = (children: ReactNode, out: SearchSelectOption[]) => {
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === Fragment) {
      collect((child.props as { children?: ReactNode }).children, out);
      return;
    }
    if (child.type === 'option') {
      const p = child.props as { value?: string | number; disabled?: boolean; children?: ReactNode };
      const label = textOf(p.children);
      out.push({ value: p.value !== undefined ? String(p.value) : label, label, disabled: Boolean(p.disabled) });
    }
  });
};

export type SelectChangeEvent = { target: { value: string }; currentTarget: { value: string } };

/**
 * Замена <select> «один в один»: те же value, onChange(e) с e.target.value,
 * className, disabled, required, title и те же дочерние <option>. Внутри — выбор
 * из списка с поиском (когда пунктов много), стрелками и Enter, который не
 * обрезается краем окна. Нужна, чтобы во всём приложении списки выглядели и
 * работали одинаково, а код разделов не пришлось переписывать.
 */
export function Select({
  value, onChange, className, disabled, required, title, children, id, ...rest
}: {
  value?: string | number | null;
  onChange?: (e: SelectChangeEvent & any) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  title?: string;
  id?: string;
  children?: ReactNode;
  'aria-label'?: string;
}) {
  const all: SearchSelectOption[] = [];
  collect(children, all);

  const current = value == null ? '' : String(value);
  // Пункт с пустым значением («Выберите…», «Все») — это подпись пустого выбора, а не обычный пункт.
  const empty = all.find((o) => o.value === '');
  const options = all.filter((o) => o.value !== '');

  // У настоящего <select> без подходящего значения виден первый пункт — показываем так же.
  const known = current === '' || options.some((o) => o.value === current);
  const fallback = !known && !empty && options[0] ? options[0].label : undefined;

  return (
    <SearchSelect
      value={known ? current : empty ? '' : (options[0]?.value ?? '')}
      onChange={(next) => onChange?.({ target: { value: next }, currentTarget: { value: next } })}
      options={options}
      emptyLabel={empty ? (empty.label || '—') : undefined}
      placeholder={fallback ?? (empty ? '' : 'Выберите')}
      buttonClassName={className}
      disabled={disabled}
      required={required}
      title={title}
      ariaLabel={rest['aria-label'] ?? id}
    />
  );
}
