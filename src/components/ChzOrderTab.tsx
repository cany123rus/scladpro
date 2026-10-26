import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft, ChevronRight, FileSpreadsheet, FileText, ListChecks, Package, RefreshCw, Trash2, X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { FacetSelect, fold } from './ui/FacetSelect';
import { QtyStepper, QTY_MAX } from './ui/QtyStepper';
import { SearchField } from './ui/SearchField';
import { compareSizes } from '../utils/sizeOrder';
import { downloadAoaWorkbook } from '../utils/excelExport';
import { ensurePdfLibs, lazyLibs } from '../pages/dashboardLazyLibs';
import { drawKpiChips, drawReportHeader, INDIGO, reportFooter, reportTableStyles } from '../pages/pdfReportKit';

/**
 * Заказ Честного знака.
 *
 * Здесь собирают список товаров, под которые нужно заказать коды маркировки:
 * отмечают артикул и размер, ставят количество и выгружают таблицу в Excel
 * или PDF. Раздел ничего не заказывает и не шлёт в Честный знак — это только
 * подготовка заявки (первая версия).
 *
 * Данные — карточки из wb_products_cache. Берём только нужные поля карточки
 * (путями JSON), а не весь product_json: у кабинета их тысячи, а целая карточка
 * тянет характеристики и описание, которые тут не нужны. Кабинеты грузим по
 * одному и держим в памяти: повторный заход в раздел не ходит в сеть.
 */

type SupplierLite = { id: string; name: string };

type SizeRow = { size: string; barcode: string; barcodes: string[] };

type Product = {
  id: string;
  supplierId: string;
  nmId: number;
  vendorCode: string;
  title: string;
  brand: string;
  subject: string;
  photo: string;
  sizes: SizeRow[];
  /** Всё, что ищем подстрокой, одной строкой в нижнем регистре. */
  hay: string;
};

type SelItem = {
  qty: number;
  supplierId: string;
  nmId: number;
  vendorCode: string;
  title: string;
  brand: string;
  subject: string;
  barcode: string;
};

/** Выбор: товар → размер → позиция заявки. Неизменяемый, чтобы карточки не перерисовывались зря. */
type Selection = Record<string, Record<string, SelItem>>;

const PAGE_SIZE = 40;
const CACHE_TTL_MS = 10 * 60 * 1000;
const SELECTION_KEY = 'chz_order_selection_v1';
const SUPPLIER_KEY = 'chz_order_supplier_v1';

/** Карточки кабинетов в памяти вкладки: id кабинета → товары и время загрузки. */
const productsCache = new Map<string, { at: number; items: Product[] }>();

const sizeLabel = (size: string) => (!size || size === '0' ? 'Без размера' : size);

const str = (v: unknown) => String(v ?? '').trim();

async function fetchSupplierProducts(supplierId: string): Promise<Product[]> {
  const PAGE = 1000;
  const items: Product[] = [];
  for (let from = 0; from < 100_000; from += PAGE) {
    const { data, error } = await supabase
      .from('wb_products_cache')
      .select(
        'nm_id, vendorCode:product_json->>vendorCode, title:product_json->>title, brand:product_json->>brand, '
        + 'subject:product_json->>subjectName, p1:product_json->photos->0->>c246x328, p2:product_json->photos->0->>tm, '
        + 'sizes:product_json->sizes',
      )
      .eq('supplier_id', supplierId)
      .order('nm_id')
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as any[];
    for (const row of rows) {
      const nmId = Number(row?.nm_id);
      if (!nmId) continue;
      const sizes: SizeRow[] = [];
      for (const s of Array.isArray(row?.sizes) ? row.sizes : []) {
        const barcodes = (Array.isArray(s?.skus) ? s.skus : []).map(str).filter(Boolean);
        sizes.push({ size: str(s?.techSize) || str(s?.wbSize), barcode: barcodes[0] || '', barcodes });
      }
      sizes.sort((a, b) => compareSizes(a.size, b.size));
      const vendorCode = str(row?.vendorCode);
      const title = str(row?.title);
      const brand = str(row?.brand);
      const subject = str(row?.subject);
      items.push({
        id: `${supplierId}:${nmId}`,
        supplierId,
        nmId,
        vendorCode,
        title,
        brand,
        subject,
        photo: str(row?.p1) || str(row?.p2),
        sizes,
        hay: [vendorCode, nmId, title, brand, subject, ...sizes.flatMap((s) => s.barcodes)].join(' ').toLowerCase().replace(/ё/g, 'е'),
      });
    }
    if (rows.length < PAGE) break;
  }
  return items;
}

function readSelection(): Selection {
  try {
    const raw = localStorage.getItem(SELECTION_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

const selectionCount = (sel: Selection) => {
  let positions = 0;
  let qty = 0;
  for (const bySize of Object.values(sel)) {
    for (const item of Object.values(bySize)) {
      positions += 1;
      qty += item.qty;
    }
  }
  return { positions, qty };
};

const NO_CATEGORY = 'Без категории';
const NO_BRAND = 'Без бренда';

/** Один товар со своими размерами. Перерисовывается, только если изменился он сам или его выбор. */
const ProductCard = memo(function ProductCard({
  product, supplierName, sel, onToggleSize, onQty, onStep, onToggleAll,
}: {
  product: Product;
  supplierName: string;
  sel: Record<string, SelItem> | undefined;
  onToggleSize: (p: Product, size: SizeRow, on: boolean) => void;
  onQty: (p: Product, size: SizeRow, qty: number) => void;
  onStep: (p: Product, size: SizeRow, delta: number) => void;
  onToggleAll: (p: Product, on: boolean) => void;
}) {
  const chosen = sel ? Object.keys(sel).length : 0;
  const allOn = product.sizes.length > 0 && chosen === product.sizes.length;
  return (
    <div className="oc-card p-2.5 flex flex-col md:flex-row gap-2.5 md:gap-3">
      <div className="flex gap-2.5 md:w-[40%] min-w-0">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 shrink-0 accent-indigo-600"
          checked={allOn}
          ref={(el) => { if (el) el.indeterminate = chosen > 0 && !allOn; }}
          onChange={(e) => onToggleAll(product, e.target.checked)}
          aria-label={`Выбрать все размеры ${product.vendorCode}`}
        />
        {product.photo ? (
          <img src={product.photo} alt="" loading="lazy" decoding="async" className="h-28 w-[5.25rem] shrink-0 rounded-xl object-cover bg-slate-100" />
        ) : (
          <div className="h-28 w-[5.25rem] shrink-0 rounded-xl bg-slate-100 flex items-center justify-center text-slate-300"><Package className="w-7 h-7" /></div>
        )}
        <div className="min-w-0">
          <div className="text-lg font-bold leading-tight text-slate-900 truncate" title={product.vendorCode}>{product.vendorCode || '—'}</div>
          {product.subject && (
            <div className="mt-0.5 inline-block max-w-full truncate rounded-full bg-indigo-50 px-2.5 py-0.5 text-sm font-semibold text-indigo-700" title={product.subject}>{product.subject}</div>
          )}
          <div className="mt-1 text-xs text-slate-500 line-clamp-2" title={product.title}>{product.title || 'Без названия'}</div>
          <div className="mt-1 flex flex-wrap gap-1 text-[11px]">
            {product.brand && <span className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5">{product.brand}</span>}
            <span className="rounded-full bg-slate-100 text-slate-500 px-2 py-0.5">WB {product.nmId}</span>
            {supplierName && <span className="rounded-full bg-violet-50 text-violet-700 px-2 py-0.5">{supplierName}</span>}
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        {product.sizes.length === 0 ? (
          <div className="text-sm text-slate-400">В карточке нет размеров</div>
        ) : (
          <div className="grid gap-1 sm:grid-cols-2 xl:grid-cols-3">
            {product.sizes.map((s) => {
              const item = sel?.[s.size];
              return (
                <div
                  key={s.size}
                  className={`flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-lg border px-2 py-1 ${item ? 'border-indigo-300 bg-indigo-50/60' : 'border-slate-200 bg-white'}`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 shrink-0 accent-indigo-600"
                    checked={Boolean(item)}
                    onChange={(e) => onToggleSize(product, s, e.target.checked)}
                    aria-label={`Размер ${sizeLabel(s.size)}`}
                  />
                  <div className="min-w-[3.25rem] flex-1">
                    <div className="text-sm font-semibold text-slate-800 leading-tight">{sizeLabel(s.size)}</div>
                    <div className="text-[9px] leading-tight text-slate-400 truncate" title={s.barcode}>{s.barcode || 'нет баркода'}</div>
                  </div>
                  <QtyStepper
                    size="sm"
                    value={item ? item.qty : 0}
                    active={Boolean(item)}
                    label={`${product.vendorCode} ${sizeLabel(s.size)}`}
                    onSet={(q) => onQty(product, s, q)}
                    onStep={(d) => onStep(product, s, d)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

export function ChzOrderTab({
  suppliers,
  showToast,
}: {
  suppliers: SupplierLite[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}) {
  const [supplierId, setSupplierId] = useState<string>(() => {
    try { return localStorage.getItem(SUPPLIER_KEY) || ''; } catch { return ''; }
  });
  const [products, setProducts] = useState<Record<string, Product[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [onlySelected, setOnlySelected] = useState(false);
  const [page, setPage] = useState(0);
  const [selection, setSelection] = useState<Selection>(() => readSelection());
  const [exporting, setExporting] = useState<'' | 'xlsx' | 'pdf'>('');

  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  const supplierList = useMemo(
    () => [...suppliers].sort((a, b) => a.name.localeCompare(b.name, 'ru')),
    [suppliers],
  );
  const supplierName = useMemo(() => {
    const map: Record<string, string> = {};
    suppliers.forEach((s) => { map[s.id] = s.name; });
    return map;
  }, [suppliers]);

  // Кабинет по умолчанию — запомненный, иначе первый: «все сразу» тяжёлый выбор, его делают осознанно.
  useEffect(() => {
    if (supplierId === 'all') return;
    if (supplierId && suppliers.some((s) => s.id === supplierId)) return;
    if (supplierList.length) setSupplierId(supplierList[0].id);
  }, [supplierId, suppliers, supplierList]);

  useEffect(() => {
    try { if (supplierId) localStorage.setItem(SUPPLIER_KEY, supplierId); } catch { /* без хранилища работаем так же */ }
  }, [supplierId]);

  const activeIds = useMemo(
    () => (supplierId === 'all' ? supplierList.map((s) => s.id) : supplierId ? [supplierId] : []),
    [supplierId, supplierList],
  );

  const load = useCallback(async (id: string, force = false) => {
    const cached = productsCache.get(id);
    if (!force && cached && Date.now() - cached.at < CACHE_TTL_MS) {
      setProducts((prev) => (prev[id] === cached.items ? prev : { ...prev, [id]: cached.items }));
      return;
    }
    setLoading((prev) => ({ ...prev, [id]: true }));
    setErrors((prev) => { const { [id]: _drop, ...rest } = prev; return rest; });
    try {
      const items = await fetchSupplierProducts(id);
      productsCache.set(id, { at: Date.now(), items });
      setProducts((prev) => ({ ...prev, [id]: items }));
    } catch (e: any) {
      setErrors((prev) => ({ ...prev, [id]: String(e?.message || e || 'Не удалось загрузить товары') }));
    } finally {
      setLoading((prev) => ({ ...prev, [id]: false }));
    }
  }, []);

  useEffect(() => {
    activeIds.forEach((id) => { if (!products[id] && !loading[id]) void load(id); });
    // products/loading намеренно вне зависимостей: иначе загрузка запускала бы сама себя.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIds, load]);

  // Выбор живёт в браузере: сборщик заявки не должен терять её при обновлении страницы.
  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(SELECTION_KEY, JSON.stringify(selection)); } catch { /* ничего страшного */ }
    }, 400);
    return () => clearTimeout(t);
  }, [selection]);

  const base = useMemo(() => activeIds.flatMap((id) => products[id] || []), [activeIds, products]);

  // Сменили кабинет — выбранные категории и бренды из другого списка не должны молча прятать товары.
  useEffect(() => { setCategories([]); setBrands([]); setPage(0); }, [supplierId]);

  /*
   * Поиск.
   *
   * Через пробел — «и»: каждое слово должно встретиться в артикуле, баркоде,
   * коде WB, названии, бренде или категории (регистр и «ё» не важны). Если в
   * строке есть перенос, запятая или точка с запятой — это список: ищем точное
   * совпадение любого значения с артикулом, баркодом или кодом WB, а не
   * найденные показываем отдельно. Так можно вставить столбец артикулов или
   * баркодов из таблицы целиком.
   */
  const searched = useMemo(() => {
    const raw = deferredQuery.trim().toLowerCase();
    const isBulk = /[\n,;]/.test(raw);
    let list = base;
    if (onlySelected) list = list.filter((p) => selection[p.id] && Object.keys(selection[p.id]).length > 0);

    let missing: string[] = [];
    if (raw) {
      if (isBulk) {
        const tokens = Array.from(new Set(raw.split(/[\s,;]+/).filter(Boolean)));
        const hit = new Set<string>();
        const wanted = new Set(tokens);
        list = list.filter((p) => {
          let ok = false;
          const keys = [p.vendorCode.toLowerCase(), String(p.nmId), ...p.sizes.flatMap((s) => s.barcodes)];
          for (const k of keys) {
            if (wanted.has(k)) { hit.add(k); ok = true; }
          }
          return ok;
        });
        missing = tokens.filter((t) => !hit.has(t));
      } else {
        const words = fold(raw).split(/\s+/).filter(Boolean);
        list = list.filter((p) => words.every((w) => p.hay.includes(w)));
      }
    }
    return { list, notFound: missing, bulk: isBulk };
  }, [base, deferredQuery, onlySelected, selection]);

  const { notFound, bulk } = searched;

  const filtered = useMemo(() => {
    const catSet = categories.length ? new Set(categories) : null;
    const brandSet = brands.length ? new Set(brands) : null;
    const list = searched.list.filter((p) =>
      (!catSet || catSet.has(p.subject || NO_CATEGORY)) && (!brandSet || brandSet.has(p.brand || NO_BRAND)));
    return list.sort((a, b) => a.vendorCode.localeCompare(b.vendorCode, 'ru', { numeric: true }));
  }, [searched, categories, brands]);

  /*
   * Счётчики в списках категорий и брендов — «сколько товаров останется».
   * Категории считаются с учётом поиска и выбранных брендов, бренды — с учётом
   * поиска и выбранных категорий; свой собственный выбор в счётчик не входит,
   * иначе отметив одну категорию, остальные показали бы нули и их нельзя было бы
   * добавить. Полный список имён берём из всей базы кабинета, чтобы пункты не
   * пропадали, а лишь серели.
   */
  const categoryOptions = useMemo(() => {
    const brandSet = brands.length ? new Set(brands) : null;
    const counts = new Map<string, number>();
    base.forEach((p) => { const c = p.subject || NO_CATEGORY; if (!counts.has(c)) counts.set(c, 0); });
    searched.list.forEach((p) => {
      if (brandSet && !brandSet.has(p.brand || NO_BRAND)) return;
      const c = p.subject || NO_CATEGORY;
      counts.set(c, (counts.get(c) || 0) + 1);
    });
    return Array.from(counts, ([name, count]) => ({ name, count }));
  }, [base, searched, brands]);

  const brandOptions = useMemo(() => {
    const catSet = categories.length ? new Set(categories) : null;
    const counts = new Map<string, number>();
    base.forEach((p) => { const b = p.brand || NO_BRAND; if (!counts.has(b)) counts.set(b, 0); });
    searched.list.forEach((p) => {
      if (catSet && !catSet.has(p.subject || NO_CATEGORY)) return;
      const b = p.brand || NO_BRAND;
      counts.set(b, (counts.get(b) || 0) + 1);
    });
    return Array.from(counts, ([name, count]) => ({ name, count }));
  }, [base, searched, categories]);

  useEffect(() => { setPage(0); }, [deferredQuery, categories, brands, onlySelected, supplierId]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = useMemo(() => filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE), [filtered, safePage]);
  const sizesFound = useMemo(() => filtered.reduce((s, p) => s + p.sizes.length, 0), [filtered]);

  const totals = useMemo(() => selectionCount(selection), [selection]);

  const toItem = (p: Product, s: SizeRow, qty: number): SelItem => ({
    qty, supplierId: p.supplierId, nmId: p.nmId, vendorCode: p.vendorCode, title: p.title,
    brand: p.brand, subject: p.subject, barcode: s.barcode,
  });

  const onToggleSize = useCallback((p: Product, s: SizeRow, on: boolean) => {
    setSelection((prev) => {
      const cur = { ...(prev[p.id] || {}) };
      if (on) cur[s.size] = toItem(p, s, cur[s.size]?.qty || 1);
      else delete cur[s.size];
      const next = { ...prev };
      if (Object.keys(cur).length) next[p.id] = cur; else delete next[p.id];
      return next;
    });
  }, []);

  const clampQty = (n: number) => (Number.isFinite(n) ? Math.max(1, Math.min(QTY_MAX, Math.floor(n))) : 1);

  /** Количество задают прямо с невыбранной строки: размер при этом отмечается сам. */
  const onQty = useCallback((p: Product, s: SizeRow, qty: number) => {
    setSelection((prev) => {
      const value = clampQty(qty);
      const cur = prev[p.id]?.[s.size];
      if (cur?.qty === value) return prev;
      return { ...prev, [p.id]: { ...(prev[p.id] || {}), [s.size]: cur ? { ...cur, qty: value } : toItem(p, s, value) } };
    });
  }, []);

  const onStep = useCallback((p: Product, s: SizeRow, delta: number) => {
    setSelection((prev) => {
      const cur = prev[p.id]?.[s.size];
      if (!cur) {
        // «+» на невыбранной строке отмечает её с количеством 1, «−» ничего не делает.
        if (delta <= 0) return prev;
        return { ...prev, [p.id]: { ...(prev[p.id] || {}), [s.size]: toItem(p, s, 1) } };
      }
      const value = clampQty(cur.qty + delta);
      if (value === cur.qty) return prev;
      return { ...prev, [p.id]: { ...prev[p.id], [s.size]: { ...cur, qty: value } } };
    });
  }, []);

  const onToggleAll = useCallback((p: Product, on: boolean) => {
    setSelection((prev) => {
      const next = { ...prev };
      if (!on) { delete next[p.id]; return next; }
      const cur = { ...(prev[p.id] || {}) };
      p.sizes.forEach((s) => { cur[s.size] = toItem(p, s, cur[s.size]?.qty || 1); });
      next[p.id] = cur;
      return next;
    });
  }, []);

  /** Выбрать все размеры на всех найденных товарах — для пакетной заявки по категории или списку. */
  const selectAllFound = () => {
    if (filtered.length > 2000 && !window.confirm(`Отметить все размеры у ${filtered.length} товаров?`)) return;
    setSelection((prev) => {
      const next = { ...prev };
      filtered.forEach((p) => {
        if (!p.sizes.length) return;
        const cur = { ...(prev[p.id] || {}) };
        p.sizes.forEach((s) => { cur[s.size] = toItem(p, s, cur[s.size]?.qty || 1); });
        next[p.id] = cur;
      });
      return next;
    });
  };

  const clearSelection = () => {
    if (!totals.positions) return;
    if (!window.confirm(`Снять отметки со всех ${totals.positions} позиций?`)) return;
    setSelection({});
    setOnlySelected(false);
  };

  const exportRows = (): Array<SelItem & { size: string }> => {
    const rows: Array<SelItem & { size: string }> = [];
    for (const bySize of Object.values(selection)) {
      for (const [size, item] of Object.entries(bySize)) rows.push({ ...item, size });
    }
    return rows.sort((a, b) =>
      (supplierName[a.supplierId] || '').localeCompare(supplierName[b.supplierId] || '', 'ru')
      || (a.subject || '').localeCompare(b.subject || '', 'ru')
      || a.vendorCode.localeCompare(b.vendorCode, 'ru', { numeric: true })
      || compareSizes(a.size, b.size));
  };

  const stamp = () => new Date().toISOString().slice(0, 10);

  const exportExcel = async () => {
    const rows = exportRows();
    if (!rows.length) { showToastRef.current('Отметьте хотя бы один размер', 'info'); return; }
    setExporting('xlsx');
    try {
      const body: Array<Array<string | number>> = [
        ['№', 'Поставщик', 'Категория', 'Артикул', 'Размер', 'Баркод', 'Код WB', 'Бренд', 'Название', 'Кол-во'],
        ...rows.map((r, i) => [
          i + 1, supplierName[r.supplierId] || '', r.subject, r.vendorCode, sizeLabel(r.size), r.barcode,
          r.nmId, r.brand, r.title, r.qty,
        ]),
        ['', '', '', '', '', '', '', '', 'Итого', rows.reduce((s, r) => s + r.qty, 0)],
      ];
      await downloadAoaWorkbook(`Заказ_ЧЗ_${stamp()}.xlsx`, 'Заказ ЧЗ', body);
      showToastRef.current(`Excel: ${rows.length} позиций`, 'success');
    } catch (e: any) {
      showToastRef.current('Не удалось собрать Excel: ' + (e?.message || 'ошибка'), 'error');
    } finally {
      setExporting('');
    }
  };

  const exportPdf = async () => {
    const rows = exportRows();
    if (!rows.length) { showToastRef.current('Отметьте хотя бы один размер', 'info'); return; }
    setExporting('pdf');
    try {
      await ensurePdfLibs();
      const { jsPDF: JsPDF, autoTable } = lazyLibs;
      const doc = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      try {
        // Кириллицу встроенные шрифты jsPDF не рисуют — берём Roboto, как в остальных отчётах.
        const res = await fetch('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf');
        const bytes = new Uint8Array(await res.arrayBuffer());
        let binary = '';
        for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
        doc.addFileToVFS('Roboto-Regular.ttf', btoa(binary));
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
        doc.setFont('Roboto', 'normal');
      } catch {
        // Без сети остаётся латиница и цифры: артикулы и баркоды читаются.
      }
      const totalQty = rows.reduce((s, r) => s + r.qty, 0);
      const suppliersUsed = Array.from(new Set(rows.map((r) => supplierName[r.supplierId] || '—')));
      let y = drawReportHeader(doc, {
        title: 'Заказ Честного знака',
        subtitle: suppliersUsed.join(' · '),
        rightLines: [new Date().toLocaleDateString('ru-RU')],
        accent: INDIGO,
      });
      y = drawKpiChips(doc, y, [
        { label: 'Позиций', value: String(rows.length), rgb: INDIGO },
        { label: 'Всего кодов', value: totalQty.toLocaleString('ru-RU'), rgb: [16, 185, 129] },
      ]);
      const footer = reportFooter(doc);
      autoTable(doc, {
        ...reportTableStyles(INDIGO),
        startY: y + 2,
        head: [['№', 'Поставщик', 'Категория', 'Артикул', 'Размер', 'Баркод', 'Кол-во']],
        body: rows.map((r, i) => [
          i + 1, supplierName[r.supplierId] || '', r.subject, r.vendorCode, sizeLabel(r.size), r.barcode, r.qty,
        ]),
        foot: [['', '', '', '', '', 'Итого', totalQty]],
        columnStyles: { 0: { cellWidth: 10 }, 6: { halign: 'right', cellWidth: 20 } },
        didDrawPage: footer,
      });
      doc.save(`Заказ_ЧЗ_${stamp()}.pdf`);
      showToastRef.current(`PDF: ${rows.length} позиций`, 'success');
    } catch (e: any) {
      showToastRef.current('Не удалось собрать PDF: ' + (e?.message || 'ошибка'), 'error');
    } finally {
      setExporting('');
    }
  };

  const anyLoading = activeIds.some((id) => loading[id]);
  const errorEntries = activeIds.filter((id) => errors[id]);

  return (
    <div className="mx-auto w-full max-w-[1500px] px-2 md:px-4 pb-4">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm">
          <ListChecks className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 leading-tight">Заказ Честного знака</h2>
          <p className="text-xs text-slate-500">Отметьте размеры, поставьте количество и выгрузите заявку в Excel или PDF</p>
        </div>
      </div>

      {/* relative z-40: у oc-card размытие фона, каждая карточка товара — свой слой и перекрыла бы выпадающие списки */}
      <div className="oc-card relative z-40 p-3 md:p-4 mb-3 space-y-3">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Артикул, баркод, код WB, название, бренд — или вставьте список через запятую / с новой строки"
        />

        <div className="flex flex-wrap items-center gap-2">
          <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="oc-select" aria-label="Поставщик">
            {supplierList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            {supplierList.length > 1 && <option value="all">Все поставщики</option>}
          </select>

          <FacetSelect label="Категории" options={categoryOptions} selected={categories} onChange={setCategories} />
          <FacetSelect label="Бренды" options={brandOptions} selected={brands} onChange={setBrands} />

          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <input type="checkbox" className="accent-indigo-600" checked={onlySelected} onChange={(e) => setOnlySelected(e.target.checked)} />
            Только выбранные
          </label>

          <button
            type="button"
            onClick={() => activeIds.forEach((id) => { void load(id, true); })}
            className="btn-ghost ml-auto"
            disabled={anyLoading}
            title="Перечитать карточки из базы"
          >
            <RefreshCw className={`w-4 h-4 ${anyLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {(categories.length > 0 || brands.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((c) => (
              <button key={`c:${c}`} type="button" onClick={() => setCategories((prev) => prev.filter((x) => x !== c))} className="flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700 hover:bg-indigo-100">
                {c} <X className="w-3 h-3" />
              </button>
            ))}
            {brands.map((b) => (
              <button key={`b:${b}`} type="button" onClick={() => setBrands((prev) => prev.filter((x) => x !== b))} className="flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs text-violet-700 hover:bg-violet-100">
                {b} <X className="w-3 h-3" />
              </button>
            ))}
            <button type="button" onClick={() => { setCategories([]); setBrands([]); }} className="ml-1 text-xs text-slate-500 hover:text-slate-800">Сбросить фильтры</button>
          </div>
        )}
      </div>

      {errorEntries.map((id) => (
        <div key={id} className="mb-3 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span className="flex-1">Не загрузились товары «{supplierName[id] || id}»: {errors[id]}</span>
          <button type="button" className="btn-ghost" onClick={() => { void load(id, true); }}>Повторить</button>
        </div>
      ))}

      {bulk && notFound.length > 0 && (
        <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div className="font-semibold mb-1">Не найдено: {notFound.length}</div>
          <div className="break-all text-xs">{notFound.slice(0, 60).join(', ')}{notFound.length > 60 ? ' …' : ''}</div>
        </div>
      )}

      <div className="mb-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <span>
          {anyLoading && base.length === 0 ? 'Загружаю товары…' : `Товаров: ${filtered.length.toLocaleString('ru-RU')} · размеров: ${sizesFound.toLocaleString('ru-RU')}`}
        </span>
        {filtered.length > 0 && (
          <button type="button" onClick={selectAllFound} className="text-indigo-600 hover:text-indigo-800 font-medium">
            Отметить все найденные
          </button>
        )}
      </div>

      {anyLoading && base.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="oc-card p-10 text-center text-slate-400">
          {base.length === 0 ? 'В выбранном кабинете нет карточек. Обновите базу в разделе «Товары WB».' : 'Ничего не найдено по этим условиям'}
        </div>
      ) : (
        <div className="space-y-2">
          {pageItems.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              supplierName={supplierId === 'all' ? supplierName[p.supplierId] || '' : ''}
              sel={selection[p.id]}
              onToggleSize={onToggleSize}
              onQty={onQty}
              onStep={onStep}
              onToggleAll={onToggleAll}
            />
          ))}
        </div>
      )}

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button type="button" className="btn-ghost" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm text-slate-600">Стр. {safePage + 1} из {pageCount}</span>
          <button type="button" className="btn-ghost" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}

      <div className="sticky bottom-2 z-30 mt-4 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur px-3 py-3 shadow-lg">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm">
            <span className="font-semibold text-slate-900">{totals.positions}</span> <span className="text-slate-500">поз.</span>
            <span className="mx-2 text-slate-300">·</span>
            <span className="font-semibold text-slate-900">{totals.qty.toLocaleString('ru-RU')}</span> <span className="text-slate-500">кодов</span>
          </div>
          <button type="button" className="btn-ghost" onClick={() => setOnlySelected((v) => !v)} disabled={!totals.positions}>
            {onlySelected ? 'Показать все' : 'Показать выбранные'}
          </button>
          <button type="button" className="btn-ghost text-rose-600" onClick={clearSelection} disabled={!totals.positions}>
            <Trash2 className="w-4 h-4" /> Очистить
          </button>
          <div className="ml-auto flex gap-2">
            <button type="button" className="btn-primary flex items-center gap-2" onClick={exportExcel} disabled={!totals.positions || Boolean(exporting)}>
              <FileSpreadsheet className="w-4 h-4" /> {exporting === 'xlsx' ? 'Собираю…' : 'Excel'}
            </button>
            <button type="button" className="btn-primary flex items-center gap-2" onClick={exportPdf} disabled={!totals.positions || Boolean(exporting)}>
              <FileText className="w-4 h-4" /> {exporting === 'pdf' ? 'Собираю…' : 'PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
