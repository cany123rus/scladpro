import { supabase } from '../lib/supabase';
import { normalizeHsCategoryName } from './chzLabel';

/**
 * Привязка марок ЧЗ к конкретным товарам.
 *
 * Бывает, что одна партия марок («костюм чёрный») годится не всей категории, а
 * нескольким карточкам — например, разным размерам одного и того же костюма.
 * Список карточек лежит у марок в колонке nm_ids; пустая колонка — марка
 * подходит любой карточке категории, как раньше.
 */

const str = (v: unknown) => String(v ?? '').trim();
const fold = (v: unknown) => str(v).toLowerCase().replace(/ё/g, 'е');

// ─── Поддерживает ли база колонку nm_ids ────────────────────────────────────
// Сайт может выйти раньше миграции: без проверки подбор кодов ломался бы на
// запросе несуществующей колонки. Отрицательный ответ кэшируем, сетевую
// ошибку — нет (иначе один обрыв связи выключил бы привязки до перезагрузки).
let nmIdsSupport: boolean | null = null;

export const hsNmIdsSupported = async (): Promise<boolean> => {
  if (nmIdsSupport !== null) return nmIdsSupport;
  const { error } = await supabase.from('unified_honest_sign_codes').select('nm_ids').limit(1);
  if (!error) {
    nmIdsSupport = true;
  } else if (error.code === '42703' || /nm_ids/i.test(error.message || '')) {
    nmIdsSupport = false;
  } else {
    return false;
  }
  return nmIdsSupport;
};

/** Колонки кодов для подбора: nm_ids — только если база уже умеет. */
export const hsPoolColumns = async (): Promise<string> =>
  (await hsNmIdsSupported()) ? 'code, category, gender, size, nm_ids' : 'code, category, gender, size';

/** nm_ids из строки базы → список чисел (или undefined, если привязки нет). */
export const parseNmIds = (raw: unknown): number[] | undefined => {
  if (!Array.isArray(raw)) return undefined;
  const ids = raw.map((v) => Number(v)).filter((n) => Number.isFinite(n) && n > 0);
  return ids.length > 0 ? ids : undefined;
};

// ─── Товары категории ───────────────────────────────────────────────────────

export type HsLinkProduct = {
  nmId: number;
  vendorCode: string;
  title: string;
  brand: string;
  subject: string;
  color: string;
  sizes: string[];
  photo: string;
  /** Всё, что ищем подстрокой, в нижнем регистре. */
  hay: string;
};

const SIZE_ORDER = ['xxs', 'xs', 's', 'm', 'l', 'xl', '2xl', 'xxl', '3xl', 'xxxl', '4xl', '5xl'];
const sizeRank = (size: string) => {
  const key = fold(size);
  const letter = SIZE_ORDER.indexOf(key);
  if (letter >= 0) return letter;
  const n = parseFloat(key);
  return Number.isFinite(n) ? 100 + n : 1000;
};

const colorOf = (characteristics: unknown): string => {
  if (!Array.isArray(characteristics)) return '';
  const row = characteristics.find((c: any) => /^(основной )?цвет$/i.test(str(c?.name)))
    ?? characteristics.find((c: any) => /цвет/i.test(str(c?.name)));
  const value = row?.value;
  return str(Array.isArray(value) ? value.join(', ') : value);
};

const productsCache = new Map<string, { at: number; items: HsLinkProduct[] }>();
const CACHE_TTL_MS = 5 * 60_000;

/**
 * Карточки одной категории из кэша карточек WB.
 *
 * Сначала легко (только предмет) находим карточки нужной категории, потом
 * дочитываем сведения порциями: у кабинета их тысячи, а нужна десятая часть.
 * Объединённые категории (куртки / бомберы / дублёнки и др.) собираются из
 * нескольких предметов — сравниваем по общему ключу normalizeHsCategoryName.
 */
export const loadHsCategoryProducts = async (supplierId: string, category: string): Promise<HsLinkProduct[]> => {
  const key = normalizeHsCategoryName(category);
  if (!supplierId || !key) return [];
  const cacheKey = `${supplierId}|${key}`;
  const cached = productsCache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.items;

  const ids: number[] = [];
  for (let from = 0; from < 100_000; from += 1000) {
    const { data, error } = await supabase
      .from('wb_products_cache')
      .select('nm_id, subject:product_json->>subjectName')
      .eq('supplier_id', supplierId)
      .order('nm_id')
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    (data || []).forEach((row: any) => {
      if (normalizeHsCategoryName(str(row?.subject)) === key) ids.push(Number(row.nm_id));
    });
    if (!data || data.length < 1000) break;
  }

  const items: HsLinkProduct[] = [];
  for (let i = 0; i < ids.length; i += 150) {
    const { data, error } = await supabase
      .from('wb_products_cache')
      .select(
        'nm_id, vendorCode:product_json->>vendorCode, title:product_json->>title, brand:product_json->>brand, '
        + 'subject:product_json->>subjectName, p1:product_json->photos->0->>c246x328, p2:product_json->photos->0->>tm, '
        + 'sizes:product_json->sizes, characteristics:product_json->characteristics',
      )
      .eq('supplier_id', supplierId)
      .in('nm_id', ids.slice(i, i + 150));
    if (error) throw new Error(error.message);
    (data || []).forEach((row: any) => {
      const rawSizes: string[] = (Array.isArray(row?.sizes) ? row.sizes : [])
        .map((s: any) => str(s?.techSize) || str(s?.wbSize))
        .filter((s: string) => s && s !== '0');
      const sizes: string[] = Array.from(new Set<string>(rawSizes)).sort((a, b) => sizeRank(a) - sizeRank(b));
      const product: HsLinkProduct = {
        nmId: Number(row.nm_id),
        vendorCode: str(row?.vendorCode),
        title: str(row?.title),
        brand: str(row?.brand),
        subject: str(row?.subject),
        color: colorOf(row?.characteristics),
        sizes,
        photo: str(row?.p1) || str(row?.p2),
        hay: '',
      };
      product.hay = fold([product.vendorCode, product.nmId, product.title, product.brand, product.color, ...sizes].join(' '));
      items.push(product);
    });
  }

  items.sort((a, b) => a.vendorCode.localeCompare(b.vendorCode, 'ru', { numeric: true }) || a.nmId - b.nmId);
  productsCache.set(cacheKey, { at: Date.now(), items });
  return items;
};

// ─── Файлы с кодами: привязка к товарам ─────────────────────────────────────

/** Одна загрузка кодов: файл, категория, пол, размер и то, к каким товарам привязана. */
export type HsFileGroup = {
  key: string;
  fileName: string;
  firstAt: string;
  lastAt: string;
  category: string | null;
  gender: string | null;
  size: string | null;
  nmIds: number[];
  codes: number;
};

/** Функции hs_file_groups в базе ещё нет — нужна миграция 20261105_hs_file_groups.sql. */
export const HS_FILE_GROUPS_MISSING = 'HS_FILE_GROUPS_MISSING';

export const loadHsFileGroups = async (supplierId: string): Promise<HsFileGroup[]> => {
  const { data, error } = await supabase.rpc('hs_file_groups', { p_supplier: supplierId });
  if (error) {
    const missing = error.code === 'PGRST202' || error.code === '42883' || error.code === '42703'
      || /hs_file_groups|nm_ids|schema cache/i.test(error.message || '');
    throw new Error(missing ? HS_FILE_GROUPS_MISSING : error.message);
  }
  return (data || []).map((r: any): HsFileGroup => {
    const nmIds = parseNmIds(r?.nm_ids) || [];
    const fileName = str(r?.file_name);
    const category = r?.category == null ? null : str(r.category);
    const gender = r?.gender == null ? null : str(r.gender);
    const size = r?.size == null ? null : str(r.size);
    return {
      key: [fileName, r?.first_at, category, gender, size, nmIds.join(',')].join('|'),
      fileName,
      firstAt: str(r?.first_at),
      lastAt: str(r?.last_at),
      category,
      gender,
      size,
      nmIds,
      codes: Number(r?.codes || 0),
    };
  });
};

/** Файл загружен «без привязки»: категории у него ещё нет. */
export const hsFileHasNoCategory = (g: Pick<HsFileGroup, 'category'>): boolean => {
  const c = fold(g.category || '');
  return !c || c === 'без категории';
};

/**
 * Основы слов категории для поиска в названии файла: у файла без категории о ней
 * говорит только имя («Костюм_чёрный_48.csv»). «Костюмы / Костюмы спортивные» → «костюм»,
 * «Кальсоны» → «кальсон»: берём первое слово каждой части и отрезаем окончание.
 */
export const categoryNameStems = (category: string): string[] => {
  const stems = new Set<string>();
  fold(category).split('/').forEach((part) => {
    const word = part.trim().split(/[^а-яa-z0-9]+/).find((w) => w.length >= 4);
    if (word) stems.add(word.length > 5 ? word.slice(0, word.length - 2) : word.slice(0, Math.max(3, word.length - 1)));
  });
  return Array.from(stems);
};

/** Строки именно этой загрузки — по тем же признакам, по которым она сгруппирована. */
const fileGroupFilter = (q: any, supplierId: string, g: HsFileGroup) => {
  let query = q
    .eq('supplier_id', supplierId)
    .eq('file_name', g.fileName)
    .gte('created_at', g.firstAt)
    .lte('created_at', g.lastAt);
  query = g.category === null ? query.is('category', null) : query.eq('category', g.category);
  query = g.gender === null ? query.is('gender', null) : query.eq('gender', g.gender);
  query = g.size === null ? query.is('size', null) : query.eq('size', g.size);
  query = g.nmIds.length === 0 ? query.is('nm_ids', null) : query.eq('nm_ids', `{${g.nmIds.join(',')}}`);
  return query;
};

/**
 * Привязать файл к товару: весь артикул (size = null — подойдёт любому размеру)
 * или артикул с конкретным размером. Возвращает, сколько кодов обновлено.
 */
export const linkHsFile = async (
  supplierId: string,
  group: HsFileGroup,
  nmId: number,
  size: string | null,
  /** Категория товара: проставляется файлу, у которого категории ещё нет (загружен «без привязки»). */
  category?: string | null,
): Promise<number> => {
  const patch: Record<string, unknown> = { nm_ids: [nmId], size: size || null };
  if (category && hsFileHasNoCategory(group)) patch.category = category;
  const { data, error } = await fileGroupFilter(
    supabase.from('unified_honest_sign_codes').update(patch),
    supplierId,
    group,
  ).select('id');
  if (error) throw new Error(error.message);
  return (data || []).length;
};

/** Снять привязку: коды снова подходят любому товару своей категории. Размер остаётся как был. */
export const unlinkHsFile = async (supplierId: string, group: HsFileGroup): Promise<number> => {
  const { data, error } = await fileGroupFilter(
    supabase.from('unified_honest_sign_codes').update({ nm_ids: null }),
    supplierId,
    group,
  ).select('id');
  if (error) throw new Error(error.message);
  return (data || []).length;
};
