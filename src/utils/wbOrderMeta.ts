/**
 * Марки Честного знака на сборочных заданиях FBS — прямо в WB.
 *
 * Раньше отсканированные марки уходили в WB файлом: скачали Excel из окна
 * «Скан ЧЗ», загрузили в кабинете. Теперь марка уходит на задание сразу после
 * скана — без файла и без человека между сканером и WB.
 *
 * Обмен идёт через edge-функцию wb-order-sgtin, а не прямо из браузера: WB
 * отдаёт CORS-заголовки только на POST, а привязка марки — PUT, снятие —
 * DELETE. Браузер режет их до отправки.
 *
 * Ограничение WB, вокруг которого всё построено: привязать или снять марку
 * можно только пока задание на сборке (статус `confirm`). После закрытия
 * поставки WB отвечает 409, и остаётся только файл.
 *
 * Проверено на кабинете ИП Власенко 13.09.2026 на задании 5731486176: марка
 * привязалась (204), у WB легла символ в символ — 85 знаков с двумя GS, —
 * ушла на проверку (`pending`), снялась (204), задание вернулось в `optional`.
 */
import { supabase } from '../lib/supabase';
import { normalizeDataMatrixText, restoreDataMatrixGs } from './honestSign';

/** Результат проверки марки у WB, как его показывать человеку. */
export type SgtinVerdict = 'ok' | 'wait' | 'bad' | 'none';

export interface WbSgtinState {
  /** Марка, которая стоит на задании у WB (с GS). Пусто — марки нет. */
  value: string;
  /** Статус проверки WB: sgtinIntroduced, pending, sgtinNotFound… */
  decision: string;
}

export interface WbSgtinResult {
  orderId: string;
  ok: boolean;
  status: number;
  code?: string;
  message?: string;
}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('wb-order-sgtin', { body });

  if (error) {
    // Настоящая причина лежит в теле ответа — supabase-js её прячет.
    let detail = error.message || 'Функция вернула ошибку';
    const response = (error as any)?.context;
    if (response && typeof response.json === 'function') {
      try {
        const parsed = await response.json();
        if (parsed?.error) detail = String(parsed.error);
      } catch {
        // тело не JSON — оставляем как есть
      }
    }
    throw new Error(detail);
  }

  if ((data as any)?.error) throw new Error(String((data as any).error));
  return data as T;
}

/** Марка без GS-разделителей — чтобы сравнивать нашу запись с тем, что у WB. */
export const sameChzCode = (a: string, b: string): boolean => {
  const left = normalizeDataMatrixText(String(a || ''));
  const right = normalizeDataMatrixText(String(b || ''));
  return Boolean(left) && left === right;
};

/**
 * Закрепляет марки за заданиями. Прежняя марка на задании заменяется.
 *
 * GS-разделители восстанавливаем здесь той же функцией, что и для Excel: без
 * них WB ставит `sgtinNoGS` и не пускает поставку в доставку.
 */
export async function sendOrderSgtins(
  supplierId: string,
  items: ReadonlyArray<{ orderId: string; code: string }>,
): Promise<WbSgtinResult[]> {
  const prepared = items
    .map((item) => ({
      orderId: String(item.orderId || '').trim(),
      code: restoreDataMatrixGs(normalizeDataMatrixText(String(item.code || ''))),
    }))
    .filter((item) => item.orderId && item.code);
  if (!prepared.length) return [];

  const out: WbSgtinResult[] = [];
  // Функция держит интервалы WB сама; пачки по 200 — чтобы не упереться во
  // время жизни одного вызова.
  for (let i = 0; i < prepared.length; i += 200) {
    const res = await call<{ results: WbSgtinResult[] }>({
      action: 'put',
      supplierId,
      items: prepared.slice(i, i + 200),
    });
    out.push(...(res.results || []));
  }
  return out;
}

/** Снимает марки с заданий — когда их сбросили у нас. */
export async function removeOrderSgtins(
  supplierId: string,
  orderIds: ReadonlyArray<string>,
): Promise<WbSgtinResult[]> {
  const ids = orderIds.map((id) => String(id || '').trim()).filter(Boolean);
  if (!ids.length) return [];
  const res = await call<{ results: WbSgtinResult[] }>({ action: 'delete', supplierId, orderIds: ids });
  return res.results || [];
}

/**
 * Что стоит на заданиях у WB. В ответе только задания, у которых марка ЧЗ
 * вообще предусмотрена: остальным поставить её нельзя.
 */
export async function fetchOrdersSgtin(
  supplierId: string,
  orderIds: ReadonlyArray<string>,
): Promise<Record<string, WbSgtinState>> {
  const ids = Array.from(new Set(orderIds.map((id) => String(id || '').trim()).filter(Boolean)));
  if (!ids.length) return {};
  const res = await call<{ orders: Record<string, WbSgtinState> }>({ action: 'get', supplierId, orderIds: ids });
  return res.orders || {};
}

/** Статус проверки WB — словами, как его поймёт сборщик. */
export function describeSgtinDecision(decision: string): { verdict: SgtinVerdict; text: string } {
  switch (decision) {
    case 'sgtinIntroduced':
      return { verdict: 'ok', text: 'WB: марка проверена' };
    case 'sgtinSoldB2B':
      return { verdict: 'ok', text: 'WB: проверена (продана B2B, допущена повторно)' };
    case 'filled':
      return { verdict: 'ok', text: 'WB: марка закреплена' };
    case 'deadlineExceeded':
      return { verdict: 'wait', text: 'WB: проверка затянулась, поставку закрыть можно' };
    case 'pending':
      return { verdict: 'wait', text: 'WB: проверяет марку' };
    case 'required':
      return { verdict: 'none', text: 'WB: марка обязательна, не отправлена' };
    case 'optional':
    case '':
      return { verdict: 'none', text: 'WB: марки нет' };
    case 'sgtinInvalidFormat':
    case 'sgtinInvalidPattern':
      return { verdict: 'bad', text: 'WB: неверный формат марки' };
    case 'sgtinNoGS':
      return { verdict: 'bad', text: 'WB: в марке нет GS-разделителей' };
    case 'sgtinHasInvalidSymbols':
    case 'sgtinHasNonLatinSymbols':
      return { verdict: 'bad', text: 'WB: в марке лишние символы (раскладка?)' };
    case 'sgtinNotFound':
      return { verdict: 'bad', text: 'WB: марка не найдена в Честном знаке' };
    case 'sgtinEmitted':
      return { verdict: 'bad', text: 'WB: марка только эмитирована, не нанесена' };
    case 'sgtinApplied':
      return { verdict: 'bad', text: 'WB: марка не введена в оборот' };
    case 'sgtinAppliedNotPaid':
      return { verdict: 'bad', text: 'WB: марка не оплачена' };
    case 'sgtinWrittenOff':
      return { verdict: 'bad', text: 'WB: марка списана' };
    case 'sgtinWithdrawn':
    case 'sgtinRetired':
      return { verdict: 'bad', text: 'WB: марка выбыла из оборота (уже продана?)' };
    case 'sgtinDisaggregated':
    case 'sgtinDisaggregation':
      return { verdict: 'bad', text: 'WB: упаковка расформирована' };
    default:
      return { verdict: 'wait', text: `WB: ${decision}` };
  }
}
