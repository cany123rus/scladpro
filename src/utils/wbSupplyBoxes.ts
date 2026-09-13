/**
 * Грузоместа поставок FBS на ПВЗ — через edge-функцию wb-supply-boxes.
 *
 * Прямо из браузера не выходит: WB отдаёт CORS только на POST, а список —
 * GET, удаление — DELETE.
 *
 * Проверено 13.09.2026 на ИП Власенко: в поставке WB-GI-277185831 создано
 * грузоместо WB-MP-55093371, получен стикер ($WBMP:1:537563:55093371, PNG
 * 580×400), грузоместо удалено — поставка вернулась к пустому списку.
 */
import { supabase } from '../lib/supabase';

export interface TrbxSticker {
  id: string;
  /** Содержимое QR, вида $WBMP:1:537563:55093371. */
  barcode: string;
  /** PNG 580×400 в base64. */
  file: string;
}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('wb-supply-boxes', { body });

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

export const listSupplyBoxes = async (supplierId: string, supplyId: string) =>
  (await call<{ ids: string[] }>({ action: 'list', supplierId, supplyId })).ids || [];

export const createSupplyBoxes = async (supplierId: string, supplyId: string, amount: number) =>
  (await call<{ ids: string[] }>({ action: 'create', supplierId, supplyId, amount })).ids || [];

export const fetchSupplyBoxStickers = async (supplierId: string, supplyId: string, trbxIds: string[]) =>
  (await call<{ stickers: TrbxSticker[] }>({ action: 'stickers', supplierId, supplyId, trbxIds })).stickers || [];

export const deleteSupplyBoxes = async (supplierId: string, supplyId: string, trbxIds: string[]) => {
  await call<{ deleted: number }>({ action: 'delete', supplierId, supplyId, trbxIds });
};

/**
 * Сколько грузомест WB разрешит: не больше половины заданий поставки.
 * На 10 заданий — 5, на 1 задание — ни одного.
 */
export const maxBoxesForOrders = (ordersCount: number) => Math.max(0, Math.floor(Number(ordersCount || 0) / 2));
