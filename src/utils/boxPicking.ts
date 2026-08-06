/**
 * Раскладка листа подбора по коробкам.
 *
 * Задача: WB прислал задания на отгрузку, товар лежит в коробках на складе, и
 * сборщику надо сказать, из какой коробки что брать. Один и тот же товар лежит
 * в разных коробках — у Власенко в среднем в десяти, у отдельных позиций в
 * пятидесяти семи, — поэтому «в какой коробке» это не одно число, а выбор.
 *
 * Выбираем так, чтобы вскрыть как можно меньше коробок: каждая вскрытая
 * коробка — это подойти, снять с паллеты, распечатать, потом закрыть и
 * вернуть. Разница между «открыть 6 коробок» и «открыть 40» — это разница
 * между получасом и сменой.
 *
 * Точного решения тут не существует (это задача о покрытии множества, она
 * NP-трудная), поэтому берём жадный алгоритм: раз за разом вскрываем ту
 * коробку, которая закрывает больше всего оставшейся потребности. Для складских
 * объёмов такой ответ отличается от идеального на единицы коробок, а считается
 * мгновенно и объясняется вслух одной фразой.
 */

/** Что лежит в коробке: штук каждого баркода. */
export interface BoxContent {
  /** Номер или название коробки — как его видит кладовщик. */
  box: string;
  /** Откуда коробка: поставка, паллета, стеллаж. Только для подписи. */
  place?: string;
  items: Array<{ barcode: string; qty: number }>;
}

/** Строка листа подбора: сколько штук этого товара нужно собрать. */
export interface PickingLine {
  barcode: string;
  qty: number;
  /** Название и артикул — чтобы вернуть их в ответе, не ища заново. */
  name?: string;
  article?: string;
}

export interface PickFromBox {
  box: string;
  place?: string;
  qty: number;
}

export interface PickingAssignment {
  barcode: string;
  name?: string;
  article?: string;
  /** Сколько просили. */
  need: number;
  /** Из каких коробок брать и сколько. */
  from: PickFromBox[];
  /**
   * Сколько собрать не из чего.
   *
   * Не молчим и не подставляем ноль: недостача означает, что товар физически
   * не найден, и узнать об этом лучше при печати листа, а не у ворот склада.
   */
  missing: number;
}

export interface PickingPlan {
  lines: PickingAssignment[];
  /** Коробки в порядке вскрытия — по нему и собирают. */
  boxes: Array<{ box: string; place?: string; units: number; lines: number }>;
  totalNeed: number;
  totalPicked: number;
  totalMissing: number;
}

const key = (s: string) => String(s ?? '').trim();

/**
 * Свести список коробок к остаткам: баркод → сколько штук и где.
 *
 * Одна коробка может встретиться в исходных данных несколько раз (сканы шли
 * порциями), поэтому складываем, а не перезаписываем.
 */
export function foldBoxes(boxes: readonly BoxContent[]): Map<string, Map<string, number>> {
  const out = new Map<string, Map<string, number>>();

  for (const b of boxes) {
    const name = key(b.box);
    if (!name) continue;
    const inner = out.get(name) ?? new Map<string, number>();
    for (const it of b.items) {
      const code = key(it.barcode);
      const qty = Number(it.qty) || 0;
      if (!code || qty <= 0) continue;
      inner.set(code, (inner.get(code) ?? 0) + qty);
    }
    out.set(name, inner);
  }

  return out;
}

/**
 * Разложить лист подбора по коробкам.
 *
 * @param boxes что лежит в коробках
 * @param lines что нужно собрать
 */
export function planPicking(
  boxes: readonly BoxContent[],
  lines: readonly PickingLine[],
): PickingPlan {
  const stock = foldBoxes(boxes);
  const place = new Map<string, string | undefined>();
  for (const b of boxes) if (!place.has(key(b.box))) place.set(key(b.box), b.place);

  // Потребность по баркодам: несколько заданий на один товар складываются.
  const need = new Map<string, number>();
  for (const l of lines) {
    const code = key(l.barcode);
    const qty = Number(l.qty) || 0;
    if (!code || qty <= 0) continue;
    need.set(code, (need.get(code) ?? 0) + qty);
  }

  const taken = new Map<string, PickFromBox[]>();
  const order: Array<{ box: string; place?: string; units: number; lines: number }> = [];

  /*
   * Пока есть что собирать — вскрываем следующую коробку.
   *
   * Каждый раз считаем, сколько ОСТАВШЕЙСЯ потребности закроет каждая ещё не
   * вскрытая коробка, и берём лучшую. Именно пересчёт на каждом шаге и делает
   * алгоритм жадным: после вскрытия первой коробки вторая оценивается уже по
   * тому, что осталось, а не по исходному листу.
   */
  const opened = new Set<string>();

  while ([...need.values()].some((v) => v > 0)) {
    let best: { box: string; covers: number; leftover: number } | null = null;

    for (const [box, content] of stock) {
      if (opened.has(box)) continue;

      let covers = 0;
      let leftover = 0;
      for (const [code, have] of content) {
        const want = need.get(code) ?? 0;
        const use = Math.min(have, want);
        covers += use;
        leftover += have - use;
      }
      if (covers === 0) continue;

      /*
       * При равном покрытии берём коробку, в которой меньше останется лишнего.
       * Так реже вскрывается полная коробка ради двух штук — её содержимое
       * потом не надо перекладывать обратно.
       */
      if (!best || covers > best.covers || (covers === best.covers && leftover < best.leftover)) {
        best = { box, covers, leftover };
      }
    }

    // Ничего больше не закрывается: остаток потребности — недостача.
    if (!best) break;

    opened.add(best.box);
    const content = stock.get(best.box)!;
    let units = 0;
    let touched = 0;

    for (const [code, have] of content) {
      const want = need.get(code) ?? 0;
      if (want <= 0) continue;
      const use = Math.min(have, want);
      need.set(code, want - use);
      content.set(code, have - use);
      units += use;
      touched += 1;
      taken.set(code, [...(taken.get(code) ?? []), { box: best.box, place: place.get(best.box), qty: use }]);
    }

    order.push({ box: best.box, place: place.get(best.box), units, lines: touched });
  }

  /*
   * Ответ собираем по исходным строкам листа, а не по свёрнутым баркодам:
   * сборщик читает лист в том порядке, в каком он напечатан.
   *
   * Когда один баркод встречается в листе дважды, коробки делим между
   * строками по порядку — иначе обе строки показали бы полное количество.
   */
  const rest = new Map<string, PickFromBox[]>();
  for (const [code, from] of taken) rest.set(code, from.map((f) => ({ ...f })));

  const out: PickingAssignment[] = lines.map((l) => {
    const code = key(l.barcode);
    const want = Number(l.qty) || 0;
    const from: PickFromBox[] = [];
    let left = want;

    const pool = rest.get(code) ?? [];
    while (left > 0 && pool.length > 0) {
      const head = pool[0]!;
      const use = Math.min(head.qty, left);
      from.push({ box: head.box, place: head.place, qty: use });
      head.qty -= use;
      left -= use;
      if (head.qty === 0) pool.shift();
    }

    return {
      barcode: code,
      name: l.name,
      article: l.article,
      need: want,
      from,
      missing: left,
    };
  });

  const totalNeed = out.reduce((a, l) => a + l.need, 0);
  const totalMissing = out.reduce((a, l) => a + l.missing, 0);

  return {
    lines: out,
    boxes: order,
    totalNeed,
    totalPicked: totalNeed - totalMissing,
    totalMissing,
  };
}

/**
 * Остатки для загрузки на WB: баркод и количество.
 *
 * Ровно тот формат, который принимает загрузка остатков ФБС: два столбца,
 * «Баркод» и «Количество». Складываем по всем коробкам — WB не интересует,
 * в какой из них товар лежит.
 */
export function stockFromBoxes(boxes: readonly BoxContent[]): Array<{ barcode: string; qty: number }> {
  const total = new Map<string, number>();
  for (const [, content] of foldBoxes(boxes)) {
    for (const [code, qty] of content) total.set(code, (total.get(code) ?? 0) + qty);
  }
  return [...total]
    .filter(([, qty]) => qty > 0)
    .map(([barcode, qty]) => ({ barcode, qty }))
    .sort((a, b) => a.barcode.localeCompare(b.barcode));
}
