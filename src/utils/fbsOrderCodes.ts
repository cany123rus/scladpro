/**
 * База ЧЗ по заказам ФБС (таблица `fbs_order_codes`).
 *
 * Рабочее состояние окна сканирования по-прежнему живёт JSON-снапшотом в
 * app_settings — там оно и должно быть: карта поставки читается и пишется
 * целиком. Но как база данных снапшот не работает: чтобы найти один код, нужно
 * скачать все 4 МБ и распарсить их в браузере, а истории по заказу нет вовсе.
 *
 * Поэтому на каждый принятый скан здесь пишется отдельная строка. Это не дубль
 * ради надёжности, а второе представление с другой задачей: снапшот — для
 * сборщика у стола, таблица — для поиска и разбора претензий.
 */
import { supabase } from '../lib/supabase';

export interface FbsOrderCodeRow {
  id: string;
  supplierId: string;
  supplyId: string;
  orderId: string;
  chzCode: string;
  stickerDigits: string;
  stickerText: string;
  nmId: number | null;
  article: string;
  size: string;
  title: string;
  scannedAt: string;
  scannedBy: string;
  orderCreatedAt: string | null;
  price: number | null;
  wbStatus: string;
  supplierStatus: string;
  wbSyncedAt: string | null;
  /** Считает сама база: длина 20+ и не код стикера. */
  looksLikeChz: boolean;
}

const mapRow = (r: any): FbsOrderCodeRow => ({
  id: String(r?.id || ''),
  supplierId: String(r?.supplier_id || ''),
  supplyId: String(r?.supply_id || ''),
  orderId: String(r?.order_id || ''),
  chzCode: String(r?.chz_code || ''),
  stickerDigits: String(r?.sticker_digits || ''),
  stickerText: String(r?.sticker_text || ''),
  nmId: r?.nm_id === null || r?.nm_id === undefined ? null : Number(r.nm_id),
  article: String(r?.article || ''),
  size: String(r?.size || ''),
  title: String(r?.title || ''),
  scannedAt: String(r?.scanned_at || ''),
  scannedBy: String(r?.scanned_by || ''),
  orderCreatedAt: r?.order_created_at ? String(r.order_created_at) : null,
  price: r?.price === null || r?.price === undefined ? null : Number(r.price),
  wbStatus: String(r?.wb_status || ''),
  supplierStatus: String(r?.supplier_status || ''),
  wbSyncedAt: r?.wb_synced_at ? String(r.wb_synced_at) : null,
  looksLikeChz: r?.looks_like_chz !== false,
});

/** Имя сотрудника за столом — чтобы в базе было видно, кто сканировал. */
export const currentEmployeeName = (): string => {
  try {
    const raw = localStorage.getItem('current_employee');
    if (!raw) return '';
    const parsed = JSON.parse(raw);
    return String(parsed?.full_name || parsed?.login || '').trim().slice(0, 120);
  } catch {
    return '';
  }
};

export interface FbsOrderCodeInput {
  supplierId: string;
  supplyId: string;
  orderId: string;
  chzCode: string;
  stickerDigits?: string;
  stickerText?: string;
  nmId?: number | null;
  article?: string;
  size?: string;
  title?: string;
  scannedAt?: string;
}

/**
 * Записать принятый ЧЗ в базу.
 *
 * Пишем одну строку, а не всю карту поставки: на быстром сканере запись идёт
 * после каждого товара, и триста строк на скан превратили бы сохранение в
 * тормоз. Конфликт по (кабинет, заказ) — это пересканирование: код заменяем.
 */
export async function upsertFbsOrderCode(input: FbsOrderCodeInput): Promise<void> {
  const supplierId = String(input.supplierId || '').trim();
  const orderId = String(input.orderId || '').trim();
  const chzCode = String(input.chzCode || '').trim();
  if (!supplierId || !orderId || !chzCode) return;

  const { error } = await supabase.from('fbs_order_codes').upsert(
    [
      {
        supplier_id: supplierId,
        supply_id: String(input.supplyId || '').trim(),
        order_id: orderId,
        chz_code: chzCode,
        sticker_digits: String(input.stickerDigits || ''),
        sticker_text: String(input.stickerText || ''),
        nm_id: Number.isFinite(Number(input.nmId)) && Number(input.nmId) > 0 ? Number(input.nmId) : null,
        article: String(input.article || ''),
        size: String(input.size || ''),
        title: String(input.title || ''),
        scanned_at: input.scannedAt || new Date().toISOString(),
        scanned_by: currentEmployeeName(),
        updated_at: new Date().toISOString(),
      },
    ],
    { onConflict: 'supplier_id,order_id' },
  );

  if (error) throw new Error(`Не записали ЧЗ в базу заказов: ${error.message}`);
}

/**
 * Сканы поставки из базы — на случай, если снапшот отстал.
 *
 * Снапшот в app_settings пишется не после каждого товара, а пачкой: на
 * поставке в четыре сотни заданий он весит полтораста килобайт, и гонять его
 * целиком на каждый скан значило бы держать сборщика в ожидании сети. Цена
 * отложенной записи — потерянный хвост, если вкладку закрыли или свет моргнул.
 *
 * Строки же пишутся сразу, по одной. Поэтому при открытии окна снапшот
 * дополняется ими: всё, что не успело в него попасть, возвращается на место.
 */
export async function fetchFbsSupplyScans(
  supplierId: string,
  supplyId: string,
): Promise<Array<Pick<FbsOrderCodeRow, 'orderId' | 'chzCode' | 'stickerDigits' | 'stickerText' | 'article' | 'size' | 'title' | 'scannedAt'>>> {
  const sid = String(supplierId || '').trim();
  const supply = String(supplyId || '').trim();
  if (!sid || !supply) return [];

  const out: any[] = [];
  // Постраничный обход: PostgREST отдаёт максимум тысячу строк за раз, а в
  // крупной поставке заданий больше.
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('fbs_order_codes')
      .select('order_id, chz_code, sticker_digits, sticker_text, article, size, title, scanned_at')
      .eq('supplier_id', sid)
      .eq('supply_id', supply)
      .order('scanned_at', { ascending: true })
      .range(from, from + 999);
    if (error) throw new Error(`Не прочитали сканы поставки из базы: ${error.message}`);
    out.push(...(data || []));
    if (!data || data.length < 1000) break;
  }

  return out.map((r: any) => ({
    orderId: String(r?.order_id || ''),
    chzCode: String(r?.chz_code || ''),
    stickerDigits: String(r?.sticker_digits || ''),
    stickerText: String(r?.sticker_text || ''),
    article: String(r?.article || ''),
    size: String(r?.size || ''),
    title: String(r?.title || ''),
    scannedAt: String(r?.scanned_at || ''),
  }));
}

/** Сброс ЧЗ у заказа убирает строку и из базы — иначе база врёт про заказ. */
export async function deleteFbsOrderCode(supplierId: string, orderId: string): Promise<void> {
  const sid = String(supplierId || '').trim();
  const oid = String(orderId || '').trim();
  if (!sid || !oid) return;

  const { error } = await supabase.from('fbs_order_codes').delete().eq('supplier_id', sid).eq('order_id', oid);
  if (error) throw new Error(`Не удалили ЧЗ из базы заказов: ${error.message}`);
}

/**
 * Где этот код уже стоял.
 *
 * Нужно, чтобы отказ «ЧЗ уже отсканирован» перестал быть тупиком: сборщику
 * говорим заказ, поставку и дату — по ним видно, брак это, возврат или пересорт.
 */
export async function findFbsOrderByCode(
  supplierId: string,
  chzCode: string,
): Promise<{ orderId: string; supplyId: string; scannedAt: string; article: string } | null> {
  const sid = String(supplierId || '').trim();
  const code = String(chzCode || '').trim();
  if (!sid || !code) return null;

  const { data, error } = await supabase
    .from('fbs_order_codes')
    .select('order_id, supply_id, scanned_at, article')
    .eq('supplier_id', sid)
    .eq('chz_code', code)
    .order('scanned_at', { ascending: false })
    .limit(1);
  if (error || !data?.length) return null;

  const row = data[0] as any;
  return {
    orderId: String(row.order_id || ''),
    supplyId: String(row.supply_id || ''),
    scannedAt: String(row.scanned_at || ''),
    article: String(row.article || ''),
  };
}

export type FbsScanRejectReason =
  | 'sticker_instead_of_chz'
  | 'not_a_chz'
  | 'duplicate_in_supply'
  | 'already_in_supplier_base'
  | 'sticker_not_found'
  | 'supply_not_ready'
  | 'save_failed'
  /** Не отказ, а его отмена человеком: код записан повторно осознанно. */
  | 'override_duplicate'
  /** Тоже не отказ: скан пришёл в русской раскладке и был переведён обратно. */
  | 'layout_fixed';

/**
 * Записать отказ сканера.
 *
 * Пишем «мимо» основного потока и молча глотаем ошибку: журнал полезен, но
 * ронять из-за него сканирование нельзя — сборщик стоит с товаром в руках.
 */
export async function logFbsScanReject(input: {
  supplierId?: string;
  supplyId?: string;
  orderId?: string;
  rawValue?: string;
  reason: FbsScanRejectReason;
  detail?: string;
}): Promise<void> {
  try {
    await supabase.from('fbs_scan_rejects').insert({
      supplier_id: String(input.supplierId || '').trim() || null,
      supply_id: String(input.supplyId || ''),
      order_id: String(input.orderId || ''),
      raw_value: String(input.rawValue || '').slice(0, 300),
      reason: input.reason,
      detail: String(input.detail || '').slice(0, 500),
      employee: currentEmployeeName(),
    });
  } catch {
    // журнал не должен мешать работе за столом
  }
}

export interface FbsScanReject {
  id: string;
  supplyId: string;
  orderId: string;
  rawValue: string;
  reason: FbsScanRejectReason | string;
  detail: string;
  employee: string;
  createdAt: string;
}

export const REJECT_TITLES: Record<string, string> = {
  sticker_instead_of_chz: 'Вместо ЧЗ поднесли стикер',
  not_a_chz: 'Это не честный знак',
  duplicate_in_supply: 'Дубль внутри поставки',
  already_in_supplier_base: 'Код уже был отсканирован раньше',
  sticker_not_found: 'Стикер не найден в поставке',
  supply_not_ready: 'Поставка загружена не полностью',
  save_failed: 'Ошибка записи',
  override_duplicate: 'Записан повторно вручную',
  layout_fixed: 'Русская раскладка (код исправлен)',
  code_of_other_cabinet: 'Марка числится за другим кабинетом',
};

export async function fetchFbsScanRejects(supplierId: string, days = 7): Promise<FbsScanReject[]> {
  const sid = String(supplierId || '').trim();
  if (!sid) return [];

  const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
  const { data, error } = await supabase
    .from('fbs_scan_rejects')
    .select('id, supply_id, order_id, raw_value, reason, detail, employee, created_at')
    .eq('supplier_id', sid)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(300);
  if (error) throw new Error(`Не удалось прочитать журнал отказов: ${error.message}`);

  return (data || []).map((r: any) => ({
    id: String(r.id),
    supplyId: String(r.supply_id || ''),
    orderId: String(r.order_id || ''),
    rawValue: String(r.raw_value || ''),
    reason: String(r.reason || ''),
    detail: String(r.detail || ''),
    employee: String(r.employee || ''),
    createdAt: String(r.created_at || ''),
  }));
}

export type FbsOrderCodeSort = 'scanned_desc' | 'scanned_asc' | 'order_desc' | 'article_asc';

export interface FbsOrderCodeQuery {
  supplierId: string;
  search?: string;
  supplyId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  /** Показать только строки, где в поле ЧЗ лежит явно не марка. */
  onlySuspicious?: boolean;
  sort?: FbsOrderCodeSort;
  page?: number;
  pageSize?: number;
}

/*
 * В PostgREST условие `or` передаётся строкой, где запятая разделяет условия, а
 * скобки группируют. Поэтому из запроса пользователя их вырезаем: иначе поиск
 * «12345,6» превратится в сломанный фильтр и вернёт ошибку вместо строк.
 */
const sanitizeSearch = (value: string) => String(value || '').replace(/[,()*\\]/g, ' ').trim();

export async function fetchFbsOrderCodes(
  params: FbsOrderCodeQuery,
): Promise<{ rows: FbsOrderCodeRow[]; total: number }> {
  const supplierId = String(params.supplierId || '').trim();
  if (!supplierId) return { rows: [], total: 0 };

  const pageSize = Math.min(500, Math.max(10, Number(params.pageSize) || 100));
  const page = Math.max(0, Number(params.page) || 0);

  let query = supabase
    .from('fbs_order_codes')
    .select('*', { count: 'exact' })
    .eq('supplier_id', supplierId);

  const search = sanitizeSearch(params.search || '');
  if (search) {
    const like = `%${search}%`;
    query = query.or(
      [
        `order_id.ilike.${like}`,
        `chz_code.ilike.${like}`,
        `article.ilike.${like}`,
        `title.ilike.${like}`,
        `sticker_digits.ilike.${like}`,
        `supply_id.ilike.${like}`,
      ].join(','),
    );
  }

  if (params.supplyId) query = query.eq('supply_id', params.supplyId);
  if (params.status) query = query.eq('supplier_status', params.status);
  // Отбор по всей базе, а не по открытой странице: иначе «показать проблемные»
  // нашло бы семь строк из ста и создало впечатление, что остальное в порядке.
  if (params.onlySuspicious) query = query.eq('looks_like_chz', false);
  if (params.dateFrom) query = query.gte('scanned_at', `${params.dateFrom}T00:00:00.000Z`);
  if (params.dateTo) query = query.lte('scanned_at', `${params.dateTo}T23:59:59.999Z`);

  switch (params.sort) {
    case 'scanned_asc':
      query = query.order('scanned_at', { ascending: true });
      break;
    case 'order_desc':
      query = query.order('order_id', { ascending: false });
      break;
    case 'article_asc':
      query = query.order('article', { ascending: true }).order('scanned_at', { ascending: false });
      break;
    default:
      query = query.order('scanned_at', { ascending: false });
  }

  const from = page * pageSize;
  const { data, error, count } = await query.range(from, from + pageSize - 1);
  if (error) throw new Error(`Не удалось прочитать базу заказов: ${error.message}`);

  return { rows: (data || []).map(mapRow), total: Number(count || 0) };
}

/** Список поставок кабинета для выпадающего фильтра. */
export async function fetchFbsOrderCodeSupplies(supplierId: string): Promise<string[]> {
  const sid = String(supplierId || '').trim();
  if (!sid) return [];

  const { data, error } = await supabase
    .from('fbs_order_codes')
    .select('supply_id')
    .eq('supplier_id', sid)
    .order('scanned_at', { ascending: false })
    .limit(5000);
  if (error) throw new Error(`Не удалось получить список поставок: ${error.message}`);

  const seen = new Set<string>();
  const out: string[] = [];
  (data || []).forEach((r: any) => {
    const id = String(r?.supply_id || '').trim();
    if (!id || seen.has(id)) return;
    seen.add(id);
    out.push(id);
  });
  return out;
}

export interface FbsCodeDuplicate {
  chzCode: string;
  count: number;
  orderIds: string[];
}

/**
 * Один и тот же код на двух заказах — это пересорт: на две вещи уехала одна
 * марка. Считаем на сервере: тянуть десять тысяч кодов в браузер ради группировки
 * незачем.
 */
export async function fetchFbsCodeDuplicates(supplierId: string): Promise<FbsCodeDuplicate[]> {
  const sid = String(supplierId || '').trim();
  if (!sid) return [];

  const { data, error } = await supabase.rpc('fbs_order_code_duplicates', { p_supplier: sid });
  if (error) throw new Error(`Не удалось проверить дубли: ${error.message}`);

  return (data || []).map((r: any) => ({
    chzCode: String(r?.chz_code || ''),
    count: Number(r?.cnt || 0),
    orderIds: Array.isArray(r?.order_ids) ? r.order_ids.map((v: any) => String(v)) : [],
  }));
}

export interface FbsOrderWbPatch {
  orderId: string;
  orderCreatedAt?: string | null;
  price?: number | null;
  wbStatus?: string;
  supplierStatus?: string;
}

/** Сохранить то, что вернул WB, чтобы статусы были видны и без запроса к API. */
export async function saveFbsOrderWbData(supplierId: string, patches: FbsOrderWbPatch[]): Promise<number> {
  const sid = String(supplierId || '').trim();
  if (!sid || !patches.length) return 0;

  const now = new Date().toISOString();
  let saved = 0;

  // Пачками: PostgREST не любит запросы на тысячи строк одним куском.
  for (let i = 0; i < patches.length; i += 200) {
    const part = patches.slice(i, i + 200);
    await Promise.all(
      part.map(async (patch) => {
        const payload: Record<string, unknown> = { wb_synced_at: now, updated_at: now };
        if (patch.orderCreatedAt !== undefined) payload.order_created_at = patch.orderCreatedAt;
        if (patch.price !== undefined) payload.price = patch.price;
        if (patch.wbStatus !== undefined) payload.wb_status = patch.wbStatus;
        if (patch.supplierStatus !== undefined) payload.supplier_status = patch.supplierStatus;

        const { error } = await supabase
          .from('fbs_order_codes')
          .update(payload)
          .eq('supplier_id', sid)
          .eq('order_id', String(patch.orderId));
        if (!error) saved += 1;
      }),
    );
  }

  return saved;
}
