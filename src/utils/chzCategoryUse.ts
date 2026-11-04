import { supabase } from '../lib/supabase';
import { normalizeHsCategoryName } from './chzLabel';

/**
 * Какие категории ЧЗ «не используем».
 *
 * Галочка в «Инфографике по ЧЗ»: снята — коды категории остаются в базе, но не
 * подбираются под заказы, не идут в печать и не считаются остатком в панели ФБС.
 * Нужна, когда марки категории выбыли из оборота или временно не нужны, а
 * стирать их жалко. Хранится в app_settings одним объектом {поставщик: [категории]},
 * поэтому одинаково видна с любого устройства.
 */

const SETTINGS_KEY = 'hs_disabled_categories_v1';

/** Событие «галочки изменились»: панели и списки пересчитываются сразу. */
export const HS_CATEGORY_USE_EVENT = 'hs-category-use-changed';

type DisabledMap = Record<string, string[]>;

/** Ключ категории: тот же, по которому объединяются куртки / бомберы / дублёнки и другие. */
export const hsCategoryKey = (category: string | null | undefined): string =>
  normalizeHsCategoryName(String(category || '')) || 'без категории';

const parseMap = (raw: unknown): DisabledMap => {
  let value: unknown = raw;
  if (typeof raw === 'string') {
    try { value = JSON.parse(raw); } catch { return {}; }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const result: DisabledMap = {};
  Object.entries(value as Record<string, unknown>).forEach(([supplierId, list]) => {
    if (Array.isArray(list)) result[supplierId] = list.map((c) => String(c)).filter(Boolean);
  });
  return result;
};

const readMap = async (): Promise<DisabledMap> => {
  const { data, error } = await supabase.from('app_settings').select('value').eq('key', SETTINGS_KEY).maybeSingle();
  if (error) throw error;
  return parseMap(data?.value);
};

/**
 * Подбор вызывается на каждую печать — не ходим в базу чаще раза в 20 секунд.
 * После изменения галочки кэш сбрасывается сразу.
 */
const CACHE_MS = 20_000;
let cache: { at: number; map: DisabledMap } | null = null;

/** Выключенные категории поставщика (ключи, а не названия). Ошибка чтения = ничего не выключено. */
export const loadDisabledHsCategories = async (supplierId: string): Promise<Set<string>> => {
  if (!supplierId) return new Set();
  try {
    if (!cache || Date.now() - cache.at > CACHE_MS) {
      cache = { at: Date.now(), map: await readMap() };
    }
    return new Set(cache.map[supplierId] || []);
  } catch (e) {
    console.warn('Не удалось прочитать выключенные категории ЧЗ', e);
    return new Set();
  }
};

export const setHsCategoryEnabled = async (supplierId: string, category: string, enabled: boolean): Promise<void> => {
  if (!supplierId) return;
  const key = hsCategoryKey(category);
  // Читаем свежее значение, а не кэш: чужие изменения с другого устройства не затираем.
  const map = await readMap();
  const next = new Set(map[supplierId] || []);
  if (enabled) next.delete(key); else next.add(key);
  const updatedMap: DisabledMap = { ...map, [supplierId]: Array.from(next) };
  if (updatedMap[supplierId].length === 0) delete updatedMap[supplierId];
  const payload = JSON.stringify(updatedMap);

  const { data: updated, error } = await supabase.from('app_settings').update({ value: payload }).eq('key', SETTINGS_KEY).select('key');
  if (error) throw error;
  if (!updated || updated.length === 0) {
    const { error: insertError } = await supabase.from('app_settings').insert({ key: SETTINGS_KEY, value: payload });
    if (insertError) throw insertError;
  }
  cache = { at: Date.now(), map: updatedMap };
  try {
    window.dispatchEvent(new CustomEvent(HS_CATEGORY_USE_EVENT, { detail: { supplierId } }));
  } catch { /* старый браузер без CustomEvent — подхватится при следующем открытии */ }
};
