import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Copy,
  Database,
  Download,
  Loader2,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { getWBImageUrls } from '../utils/wbImages';
import { downloadWorkbook } from '../utils/excelExport';
import {
  fetchFbsCodeDuplicates,
  fetchFbsOrderCodeSupplies,
  fetchFbsOrderCodes,
  saveFbsOrderWbData,
  type FbsCodeDuplicate,
  type FbsOrderCodeRow,
  type FbsOrderCodeSort,
} from '../utils/fbsOrderCodes';

/**
 * База заказов ФБС: какой ЧЗ уехал с каким заказом.
 *
 * Список строится из нашей таблицы, а не из WB: она полная (сканы с апреля),
 * отвечает мгновенно и работает, даже когда WB лежит. Из API догружается то,
 * чего у нас быть не может — статус заказа, дата и цена; результат сохраняется,
 * чтобы второй раз за тем же не ходить.
 */

const PAGE_SIZE = 100;

const SUPPLIER_STATUS_TITLES: Record<string, string> = {
  new: 'Новое',
  confirm: 'На сборке',
  complete: 'В доставке',
  cancel: 'Отменено продавцом',
  deliver: 'В доставке',
  receive: 'У клиента',
  reject: 'Отказ',
};

const WB_STATUS_TITLES: Record<string, string> = {
  waiting: 'Ожидает',
  sorted: 'Отсортировано',
  sold: 'Продано',
  canceled: 'Отменено',
  canceled_by_client: 'Отмена клиентом',
  declined_by_client: 'Отказ клиента',
  defect: 'Брак',
  ready_for_pickup: 'Готово к выдаче',
};

const fmtDate = (value?: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ru-RU');
};

const fmtDateTime = (value?: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const ymd = (date: Date) => date.toISOString().slice(0, 10);

export const FbsOrdersDatabase = ({
  supplierId,
  supplierName,
  wbFetch,
}: {
  supplierId: string;
  supplierName?: string;
  /** Запрос в WB с токеном выбранного кабинета — берём готовый из WBSupplyManager. */
  wbFetch: (url: string, options?: RequestInit) => Promise<any>;
}) => {
  const [rows, setRows] = useState<FbsOrderCodeRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [supplyId, setSupplyId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState<FbsOrderCodeSort>('scanned_desc');
  const [onlySuspicious, setOnlySuspicious] = useState(false);

  const [supplies, setSupplies] = useState<string[]>([]);
  const [duplicates, setDuplicates] = useState<FbsCodeDuplicate[] | null>(null);
  const [duplicatesOpen, setDuplicatesOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');

  // Гонка ответов: пока грузилась страница 3, человек уже нажал «дальше».
  // Показываем только последний запрошенный ответ.
  const requestIdRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(0);
  }, [search, supplyId, dateFrom, dateTo, sort, onlySuspicious, supplierId]);

  const load = useCallback(async () => {
    if (!supplierId) {
      setRows([]);
      setTotal(0);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFbsOrderCodes({
        supplierId,
        search,
        supplyId,
        dateFrom,
        dateTo,
        sort,
        onlySuspicious,
        page,
        pageSize: PAGE_SIZE,
      });
      if (requestId !== requestIdRef.current) return;
      setRows(res.rows);
      setTotal(res.total);
    } catch (e: any) {
      if (requestId !== requestIdRef.current) return;
      setError(e?.message || 'Не удалось загрузить базу заказов');
      setRows([]);
      setTotal(0);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [supplierId, search, supplyId, dateFrom, dateTo, sort, onlySuspicious, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    setSupplies([]);
    setDuplicates(null);
    if (!supplierId) return undefined;

    fetchFbsOrderCodeSupplies(supplierId)
      .then((list) => {
        if (!cancelled) setSupplies(list);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [supplierId]);

  const visibleRows = rows;

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 1500);
    } catch {
      setNotice({ type: 'error', text: 'Браузер не дал скопировать код' });
    }
  };

  /**
   * Статусы заказов из WB.
   *
   * Просим только те заказы, что сейчас на экране: /api/v3/orders/status берёт
   * до 1000 идентификаторов за раз, и гонять всю базу в десять тысяч строк ради
   * одной таблицы незачем — человек смотрит страницу.
   */
  const syncStatusesFromWb = async () => {
    if (!supplierId || !rows.length) return;
    setSyncing(true);
    setNotice(null);
    try {
      const ids = rows
        .map((r) => Number(String(r.orderId || '').trim()))
        .filter((id) => Number.isFinite(id) && id > 0)
        .slice(0, 1000);

      if (!ids.length) throw new Error('На странице нет заказов с числовым номером');

      const res = await wbFetch('https://marketplace-api.wildberries.ru/api/v3/orders/status', {
        method: 'POST',
        body: JSON.stringify({ orders: ids }),
      });

      const list: any[] = Array.isArray(res?.orders) ? res.orders : [];
      if (!list.length) throw new Error('WB вернул пустой ответ по статусам');

      const patches = list.map((o) => ({
        orderId: String(o?.id ?? ''),
        wbStatus: String(o?.wbStatus || ''),
        supplierStatus: String(o?.supplierStatus || ''),
      }));

      const saved = await saveFbsOrderWbData(supplierId, patches);
      await load();
      setNotice({ type: 'success', text: `Статусы обновлены: ${saved} из ${ids.length} заказов страницы.` });
    } catch (e: any) {
      setNotice({ type: 'error', text: e?.message || 'Не удалось получить статусы из WB' });
    } finally {
      setSyncing(false);
    }
  };

  /**
   * Дата и цена заказа. Их нельзя спросить по номеру — WB отдаёт только список
   * за период, поэтому идём страницами от выбранной даты и раскладываем
   * пришедшее по нашим строкам. Всё, чего нет в базе, просто игнорируется.
   */
  const syncOrderDetailsFromWb = async () => {
    if (!supplierId) return;
    setSyncing(true);
    setNotice(null);
    try {
      const from = dateFrom
        ? new Date(`${dateFrom}T00:00:00`)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const startTs = Math.floor(from.getTime() / 1000);

      const patches: Array<{ orderId: string; orderCreatedAt: string | null; price: number | null }> = [];
      let next = 0;

      // Больше двадцати страниц не берём: это уже 20 000 заказов, а дальше
      // человеку проще сузить период, чем ждать полторы минуты.
      for (let pageIndex = 0; pageIndex < 20; pageIndex++) {
        const data = await wbFetch(
          `https://marketplace-api.wildberries.ru/api/v3/orders?limit=1000&next=${next}&dateFrom=${startTs}`,
        );
        const list: any[] = Array.isArray(data?.orders) ? data.orders : [];
        list.forEach((o) => {
          const id = String(o?.id ?? '').trim();
          if (!id) return;
          const price = Number(o?.convertedPrice ?? o?.price ?? 0);
          patches.push({
            orderId: id,
            orderCreatedAt: o?.createdAt ? String(o.createdAt) : null,
            price: Number.isFinite(price) && price > 0 ? price / 100 : null,
          });
        });

        next = Number(data?.next || 0);
        if (!next || list.length === 0) break;
      }

      if (!patches.length) throw new Error('WB не вернул заказов за этот период');

      const saved = await saveFbsOrderWbData(supplierId, patches);
      await load();
      setNotice({
        type: 'success',
        text: `WB отдал ${patches.length} заказов с ${fmtDate(from.toISOString())}. Обновлено строк базы: ${saved}.`,
      });
    } catch (e: any) {
      setNotice({ type: 'error', text: e?.message || 'Не удалось получить заказы из WB' });
    } finally {
      setSyncing(false);
    }
  };

  const checkDuplicates = async () => {
    if (!supplierId) return;
    try {
      const list = await fetchFbsCodeDuplicates(supplierId);
      setDuplicates(list);
      setDuplicatesOpen(true);
    } catch (e: any) {
      setNotice({ type: 'error', text: e?.message || 'Не удалось проверить дубли' });
    }
  };

  /**
   * Выгружаем весь отбор, а не одну страницу: файл нужен как раз тогда, когда
   * данные уходят наружу — в претензию или в сверку с Честным Знаком.
   */
  const exportToExcel = async () => {
    if (!supplierId) return;
    setExporting(true);
    setNotice(null);
    try {
      const all: FbsOrderCodeRow[] = [];
      for (let pageIndex = 0; pageIndex < 60; pageIndex++) {
        const res = await fetchFbsOrderCodes({
          supplierId,
          search,
          supplyId,
          dateFrom,
          dateTo,
          sort,
          onlySuspicious,
          page: pageIndex,
          pageSize: 500,
        });
        all.push(...res.rows);
        if (all.length >= res.total || res.rows.length === 0) break;
      }

      const data = all.map((r) => ({
        'Дата скана': fmtDateTime(r.scannedAt),
        'Заказ': r.orderId,
        'Дата заказа': fmtDate(r.orderCreatedAt),
        'Поставка': r.supplyId,
        'Артикул': r.article,
        'Товар': r.title,
        'Размер': r.size,
        'Стикер': r.stickerDigits,
        'Честный знак': r.chzCode,
        'Похоже на ЧЗ': r.looksLikeChz ? 'да' : 'нет',
        'Цена, ₽': r.price ?? '',
        'Статус продавца': SUPPLIER_STATUS_TITLES[r.supplierStatus] || r.supplierStatus,
        'Статус WB': WB_STATUS_TITLES[r.wbStatus] || r.wbStatus,
        'Кто сканировал': r.scannedBy,
      }));

      if (!data.length) throw new Error('Под этот отбор строк нет');

      await downloadWorkbook(`База_заказов_ФБС_${ymd(new Date())}.xlsx`, [
        { name: 'Заказы', rows: data, widths: [18, 14, 12, 18, 28, 32, 10, 14, 60, 12, 12, 18, 18, 18] },
      ]);
      setNotice({ type: 'success', text: `Выгружено строк: ${data.length}.` });
    } catch (e: any) {
      setNotice({ type: 'error', text: e?.message || 'Не удалось выгрузить файл' });
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setSupplyId('');
    setDateFrom('');
    setDateTo('');
    setOnlySuspicious(false);
    setSort('scanned_desc');
  };

  const hasFilters = Boolean(search || supplyId || dateFrom || dateTo || onlySuspicious);

  if (!supplierId) {
    return (
      <div className="oc-card p-8 text-center text-slate-500">
        Выберите кабинет — база заказов ведётся отдельно по каждому.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="bg-indigo-100 p-2 rounded-lg">
          <Database className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">База заказов</h2>
          <p className="text-sm text-slate-500">
            Какой честный знак уехал с каким заказом{supplierName ? ` • ${supplierName}` : ''}
          </p>
        </div>
        <div className="ml-auto text-sm text-slate-500">
          {loading ? 'Считаем…' : `Записей: ${total.toLocaleString('ru-RU')}`}
        </div>
      </div>

      {/* Фильтры */}
      <div className="oc-card p-3 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 min-w-[240px] flex-1">
          <span className="text-xs text-slate-500">Поиск</span>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="номер заказа, артикул, код ЧЗ, стикер"
              className="oc-input pl-9 w-full"
            />
          </div>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Поставка</span>
          <select value={supplyId} onChange={(e) => setSupplyId(e.target.value)} className="oc-select min-w-[180px]">
            <option value="">все поставки</option>
            {supplies.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Скан с</span>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="oc-input" />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">по</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="oc-input" />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Сортировка</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as FbsOrderCodeSort)} className="oc-select">
            <option value="scanned_desc">сначала новые сканы</option>
            <option value="scanned_asc">сначала старые сканы</option>
            <option value="order_desc">по номеру заказа</option>
            <option value="article_asc">по артикулу</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-600 pb-2">
          <input
            type="checkbox"
            checked={onlySuspicious}
            onChange={(e) => setOnlySuspicious(e.target.checked)}
            className="w-4 h-4"
          />
          только подозрительные коды
        </label>

        {hasFilters && (
          <button onClick={resetFilters} className="btn-ghost flex items-center gap-1 text-sm">
            <X className="w-4 h-4" /> сбросить
          </button>
        )}
      </div>

      {/* Действия */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={syncStatusesFromWb}
          disabled={syncing || loading || !rows.length}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
          title="Спросить у WB статусы заказов, показанных на этой странице"
        >
          {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Статусы из WB (страница)
        </button>

        <button
          onClick={syncOrderDetailsFromWb}
          disabled={syncing}
          className="px-3 py-2 text-sm rounded border border-indigo-300 text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
          title="Подтянуть дату и цену заказов за период (от даты в фильтре, иначе за 30 дней)"
        >
          Даты и цены из WB
        </button>

        <button
          onClick={checkDuplicates}
          className="px-3 py-2 text-sm rounded border border-amber-300 text-amber-700 hover:bg-amber-50 flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4" /> Проверить дубли ЧЗ
        </button>

        <button
          onClick={exportToExcel}
          disabled={exporting}
          className="px-3 py-2 text-sm rounded border border-emerald-300 text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 disabled:opacity-50"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Выгрузить в Excel
        </button>
      </div>

      {notice && (
        <div
          className={`px-4 py-3 rounded border text-sm ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {notice.text}
        </div>
      )}

      {error && <div className="px-4 py-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>}

      {duplicatesOpen && duplicates && (
        <div className="oc-card p-4 border-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="font-semibold text-slate-900">
              {duplicates.length === 0
                ? 'Дублей нет: каждый код стоит на одном заказе'
                : `Один код на нескольких заказах: ${duplicates.length}`}
            </h3>
            <button onClick={() => setDuplicatesOpen(false)} className="ml-auto text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          {duplicates.length > 0 && (
            <div className="mt-3 space-y-2 max-h-64 overflow-auto">
              {duplicates.map((d) => (
                <div key={d.chzCode} className="text-sm flex flex-wrap items-center gap-2">
                  <code className="font-mono text-xs bg-slate-100 px-2 py-1 rounded break-all">
                    {d.chzCode.length > 40 ? `${d.chzCode.slice(0, 40)}…` : d.chzCode}
                  </code>
                  <span className="text-slate-500">на {d.count} заказах:</span>
                  <button
                    onClick={() => {
                      setSearchInput(d.chzCode);
                      setDuplicatesOpen(false);
                    }}
                    className="text-indigo-600 hover:underline"
                  >
                    {d.orderIds.join(', ')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Таблица */}
      <div className="oc-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium w-16">Фото</th>
                <th className="px-3 py-2 font-medium">Заказ</th>
                <th className="px-3 py-2 font-medium">Товар</th>
                <th className="px-3 py-2 font-medium">Честный знак</th>
                <th className="px-3 py-2 font-medium">Поставка</th>
                <th className="px-3 py-2 font-medium">Скан</th>
                <th className="px-3 py-2 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin inline" /> Загружаем…
                  </td>
                </tr>
              )}

              {!loading && visibleRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-slate-400">
                    {hasFilters ? 'Под этот отбор ничего нет' : 'В базе пока пусто'}
                  </td>
                </tr>
              )}

              {!loading &&
                visibleRows.map((row) => {
                  const suspicious = !row.looksLikeChz;
                  return (
                    <tr key={row.id} className="border-t border-slate-100 align-top hover:bg-slate-50">
                      <td className="px-3 py-2">
                        {row.nmId ? (
                          <img
                            src={getWBImageUrls(row.nmId)[0]}
                            alt=""
                            loading="lazy"
                            className="w-12 h-16 object-contain rounded border border-slate-200 bg-white"
                            onError={(e) => {
                              // У WB несколько вариантов адреса — идём по списку,
                              // пока не найдётся живой, и только потом сдаёмся.
                              const img = e.currentTarget;
                              const urls = getWBImageUrls(Number(row.nmId));
                              const idx = urls.indexOf(img.src);
                              if (idx >= 0 && idx < urls.length - 1) img.src = urls[idx + 1];
                              else img.style.visibility = 'hidden';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-16 rounded border border-dashed border-slate-200" />
                        )}
                      </td>

                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="font-medium text-slate-900">{row.orderId}</div>
                        <div className="text-xs text-slate-500">заказ {fmtDate(row.orderCreatedAt)}</div>
                        {row.price !== null && (
                          <div className="text-xs text-slate-500">{row.price.toLocaleString('ru-RU')} ₽</div>
                        )}
                      </td>

                      <td className="px-3 py-2 max-w-xs">
                        <div className="text-slate-900 line-clamp-2">{row.title || '—'}</div>
                        <div className="text-xs text-slate-500 break-all">{row.article || '—'}</div>
                        {row.size && <div className="text-xs text-slate-500">размер {row.size}</div>}
                      </td>

                      <td className="px-3 py-2 max-w-sm">
                        <div className="flex items-start gap-2">
                          <code
                            className={`font-mono text-[11px] break-all ${suspicious ? 'text-amber-700' : 'text-slate-700'}`}
                            title={row.chzCode}
                          >
                            {row.chzCode.length > 44 ? `${row.chzCode.slice(0, 44)}…` : row.chzCode}
                          </code>
                          <button
                            onClick={() => copyCode(row.chzCode)}
                            title="Скопировать код целиком"
                            className="shrink-0 text-slate-400 hover:text-indigo-600"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {copiedCode === row.chzCode && <div className="text-[11px] text-emerald-600">скопировано</div>}
                        {suspicious && (
                          <div className="text-[11px] text-amber-700 mt-0.5">
                            не похоже на ЧЗ — вероятно, считали стикер
                          </div>
                        )}
                        {row.stickerDigits && (
                          <div className="text-[11px] text-slate-400 mt-0.5">стикер {row.stickerDigits}</div>
                        )}
                      </td>

                      <td className="px-3 py-2 whitespace-nowrap text-slate-600">{row.supplyId || '—'}</td>

                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-slate-700">{fmtDateTime(row.scannedAt)}</div>
                        <div className="text-xs text-slate-500">{row.scannedBy || '—'}</div>
                      </td>

                      <td className="px-3 py-2 whitespace-nowrap">
                        {row.supplierStatus || row.wbStatus ? (
                          <>
                            <div className="text-slate-700">
                              {SUPPLIER_STATUS_TITLES[row.supplierStatus] || row.supplierStatus || '—'}
                            </div>
                            <div className="text-xs text-slate-500">
                              {WB_STATUS_TITLES[row.wbStatus] || row.wbStatus || ''}
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">не спрашивали</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between gap-3 px-3 py-2 border-t border-slate-100 text-sm">
            <span className="text-slate-500">
              Страница {page + 1} из {pages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
                className="px-3 py-1.5 rounded border border-slate-200 disabled:opacity-40"
              >
                Назад
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
                disabled={page >= pages - 1 || loading}
                className="px-3 py-1.5 rounded border border-slate-200 disabled:opacity-40"
              >
                Дальше
              </button>
            </div>
          </div>
        )}
      </div>

      {onlySuspicious && (
        <div className="text-xs text-slate-500">
          Показаны только строки, где в поле ЧЗ лежит не марка: короткий код или считанный стикер. Отбор идёт по всей
          базе кабинета, а не по открытой странице.
        </div>
      )}
    </div>
  );
};

export default FbsOrdersDatabase;
