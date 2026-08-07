/**
 * Порядок размеров для листа подбора.
 *
 * Обычная сортировка строк ставит «10» перед «2», а «M» между «L» и «S» —
 * сборщик по такому листу мечется. Нужен человеческий порядок: числовые
 * размеры по числу, буквенные по шкале, всё остальное в конец.
 */

/** Буквенная шкала. Синонимы одного размера дают один и тот же ранг. */
const LETTERS: Record<string, number> = {
  XXXS: 10, '3XS': 10,
  XXS: 20, '2XS': 20,
  XS: 30,
  S: 40,
  M: 50,
  L: 60,
  XL: 70,
  XXL: 80, '2XL': 80,
  XXXL: 90, '3XL': 90,
  XXXXL: 100, '4XL': 100,
  XXXXXL: 110, '5XL': 110,
  '6XL': 120,
  '7XL': 130,
};

/** Размеры «на всех» идут первыми: их обычно и берут пачкой. */
const ONE_SIZE = new Set(['ONESIZE', 'ONE SIZE', 'OS', 'БЕЗРАЗМЕРНЫЙ', 'СТАНДАРТНЫЙ', 'UNI', 'UNIVERSAL']);

const clean = (raw: string) => String(raw ?? '')
  .trim()
  .toUpperCase()
  .replace(/\s+/g, ' ')
  .replace(/[.,]/g, '');

/**
 * Ранг размера. Меньше — раньше.
 *
 * Диапазоны вида «42-44» сортируем по первому числу: это и есть начало
 * диапазона, по нему их и раскладывают.
 */
export function sizeRank(raw: string): number {
  const value = clean(raw);
  if (!value) return 1_000_000;
  if (ONE_SIZE.has(value)) return 0;

  const letter = LETTERS[value.replace(/\s/g, '')];
  if (letter !== undefined) return 1_000 + letter;

  const num = value.match(/\d+/);
  if (num) return 10_000 + Number(num[0]);

  // Незнакомое — в конец, но между собой по алфавиту (см. compareSizes).
  return 900_000;
}

/** Сравнение размеров для sort(). */
export function compareSizes(a: string, b: string): number {
  const ra = sizeRank(a);
  const rb = sizeRank(b);
  if (ra !== rb) return ra - rb;
  return clean(a).localeCompare(clean(b), 'ru');
}
