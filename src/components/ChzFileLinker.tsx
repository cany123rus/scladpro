import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, FileText, Link2, Link2Off, Loader2, Package, Send, Upload, X } from 'lucide-react';
import { SearchField } from './ui/SearchField';
import { FacetSelect, type FacetOption } from './ui/FacetSelect';
import { normalizeHsCategoryName } from '../utils/chzLabel';
import {
  HS_FILE_GROUPS_MISSING,
  categoryNameStems,
  hsFileHasNoCategory,
  linkHsFile,
  loadHsCategoryProducts,
  loadHsFileGroups,
  unlinkHsFile,
  type HsFileGroup,
  type HsLinkProduct,
} from '../utils/chzProductLinks';

/**
 * Загрузка файлов с кодами ЧЗ и привязка каждого к товару.
 *
 * Порядок работы: загружаем файлы поставщика прямо здесь (сразу пачкой), затем
 * выбираем категории и товар слева и привязываем к нему файл справа — ко всему
 * артикулу или к артикулу с размером. Показываются только файлы, которые ещё ждут
 * привязки, и те, с которыми работаем в этом окне: всё, что уже разнесено по базе,
 * остаётся как есть и не мешает.
 */

export type FileUploadSummary = { files: number; codes: number; failed: string[] };

const CATEGORIES_KEY = 'hs_linker_categories_v1';
const PRODUCT_PAGE = 50;
const fold = (v: string) => v.toLowerCase().replace(/ё/g, 'е');
const genderLabel = (g: string | null) => (g === 'male' ? 'Муж' : g === 'female' ? 'Жен' : 'Любой пол');
/** Устойчивый номер загрузки: ключ группы меняется при привязке, а имя и время вставки — нет. */
const sidOf = (g: HsFileGroup) => `${g.fileName}|${g.firstAt}`;

type Scope = 'article' | 'size';
type Sort = 'name' | 'new';

const ProductRow = memo(function ProductRow({
  product, active, filesCount, showSubject, onPick,
}: {
  product: HsLinkProduct;
  active: boolean;
  filesCount: number;
  showSubject: boolean;
  onPick: (p: HsLinkProduct) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(product)}
      aria-pressed={active}
      className={`flex w-full gap-3 rounded-xl border p-2.5 text-left transition-all ${
        active ? 'border-indigo-400 bg-indigo-50 shadow-sm ring-1 ring-indigo-300' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      {product.photo ? (
        <img src={product.photo} alt="" loading="lazy" decoding="async" className="h-16 w-12 shrink-0 rounded-lg bg-slate-100 object-cover" />
      ) : (
        <span className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-300"><Package className="h-5 w-5" /></span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-slate-900">{product.vendorCode || `Арт. ${product.nmId}`}</span>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
              filesCount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}
            title={filesCount > 0 ? 'Файлов с кодами привязано к этому артикулу' : 'К артикулу пока не привязано ни одного файла'}
          >
            {filesCount > 0 ? `файлов: ${filesCount}` : 'нет кодов'}
          </span>
        </span>
        <span className="block truncate text-xs text-slate-500">{showSubject && product.subject ? `${product.subject} · ` : ''}{product.title}</span>
        <span className="mt-1 flex flex-wrap items-center gap-1">
          {product.color && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">{product.color}</span>}
          {product.sizes.slice(0, 7).map((s) => (
            <span key={s} className="rounded bg-white px-1.5 py-0.5 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200">{s}</span>
          ))}
          {product.sizes.length > 7 && <span className="text-[11px] text-slate-400">+{product.sizes.length - 7}</span>}
        </span>
      </span>
    </button>
  );
});

export default function ChzFileLinker({
  supplierId, supplierName, categories, onUploadFiles, onImportTelegram, onClose, onChanged,
}: {
  supplierId: string;
  supplierName?: string;
  /** Категории поставщика для выбора слева. */
  categories: string[];
  /** Загрузить выбранные файлы с кодами поставщику (без категории, пола и размера). */
  onUploadFiles: (files: File[]) => Promise<FileUploadSummary>;
  /** Взять последний файл из Telegram поставщика (если настроено). */
  onImportTelegram?: () => Promise<FileUploadSummary | null>;
  onClose: () => void;
  /** Что-то загрузили, привязали или отвязали — раздел обновляет сводки. */
  onChanged?: () => void;
}) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CATEGORIES_KEY) || '[]');
      return Array.isArray(saved) ? saved.filter((c: unknown) => typeof c === 'string' && categories.includes(c)) : [];
    } catch {
      return [];
    }
  });
  const [products, setProducts] = useState<HsLinkProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState('');
  const [groups, setGroups] = useState<HsFileGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupsError, setGroupsError] = useState('');
  const [needsMigration, setNeedsMigration] = useState(false);
  /** Загрузки, с которыми работаем в этом окне: после привязки они остаются на виду (с зелёной отметкой). */
  const [sessionSids, setSessionSids] = useState<Set<string>>(() => new Set());

  const [query, setQuery] = useState('');
  const [codesFilter, setCodesFilter] = useState<'all' | 'with' | 'without'>('all');
  const [limit, setLimit] = useState(PRODUCT_PAGE);
  const [product, setProduct] = useState<HsLinkProduct | null>(null);

  const [scope, setScope] = useState<Scope>('article');
  const [size, setSize] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [fileQuery, setFileQuery] = useState('');
  const [sort, setSort] = useState<Sort>('name');
  const [busyKey, setBusyKey] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const groupsRef = useRef<HsFileGroup[]>([]);
  groupsRef.current = groups;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const reloadGroups = useCallback(async (): Promise<HsFileGroup[]> => {
    setGroupsError('');
    try {
      const list = await loadHsFileGroups(supplierId);
      setGroups(list);
      setNeedsMigration(false);
      return list;
    } catch (e: any) {
      if (e?.message === HS_FILE_GROUPS_MISSING) setNeedsMigration(true);
      else setGroupsError(String(e?.message || e));
      setGroups([]);
      return [];
    } finally {
      setGroupsLoading(false);
    }
  }, [supplierId]);

  useEffect(() => { void reloadGroups(); }, [reloadGroups]);

  // Товары — всех выбранных категорий сразу.
  const categoriesKey = selectedCategories.join('\u0001');
  useEffect(() => {
    setProduct(null);
    setProducts([]);
    setProductsError('');
    try { localStorage.setItem(CATEGORIES_KEY, JSON.stringify(selectedCategories)); } catch { /* приватный режим */ }
    if (selectedCategories.length === 0) return;
    let cancelled = false;
    setProductsLoading(true);
    Promise.all(selectedCategories.map((c) => loadHsCategoryProducts(supplierId, c)))
      .then((lists) => {
        if (cancelled) return;
        const byNm = new Map<number, HsLinkProduct>();
        lists.flat().forEach((p) => byNm.set(p.nmId, p));
        setProducts(Array.from(byNm.values()).sort((a, b) => a.vendorCode.localeCompare(b.vendorCode, 'ru', { numeric: true }) || a.nmId - b.nmId));
      })
      .catch((e) => { if (!cancelled) setProductsError(String(e?.message || e)); })
      .finally(() => { if (!cancelled) setProductsLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierId, categoriesKey]);

  // Ждут привязки: категории и товаров у файла ещё нет. Плюс всё, с чем работали в этом окне.
  const workingGroups = useMemo(
    () => groups.filter((g) => (hsFileHasNoCategory(g) && g.nmIds.length === 0) || sessionSids.has(sidOf(g))),
    [groups, sessionSids],
  );

  // Файл относится к категории, если она записана у кодов или (у файла без категории) названа в имени.
  const stemsByCategory = useMemo(() => new Map(categories.map((c) => [c, categoryNameStems(c)])), [categories]);
  const matchesCategory = useCallback((g: HsFileGroup, category: string) => {
    if (hsFileHasNoCategory(g)) {
      const name = fold(g.fileName);
      return (stemsByCategory.get(category) || categoryNameStems(category)).some((stem) => name.includes(stem));
    }
    return normalizeHsCategoryName(g.category || '') === normalizeHsCategoryName(category);
  }, [stemsByCategory]);

  const categoryOptions = useMemo<FacetOption[]>(
    () => categories.map((c) => ({ name: c, count: workingGroups.filter((g) => matchesCategory(g, c)).length })),
    [categories, workingGroups, matchesCategory],
  );

  // Сколько файлов привязано к каждому артикулу — видно в списке слева.
  const filesByNm = useMemo(() => {
    const map = new Map<number, number>();
    groups.forEach((g) => g.nmIds.forEach((id) => map.set(id, (map.get(id) || 0) + 1)));
    return map;
  }, [groups]);

  const productByNm = useMemo(() => new Map(products.map((p) => [p.nmId, p])), [products]);

  const filteredProducts = useMemo(() => {
    const words = fold(query.trim()).split(/\s+/).filter(Boolean);
    return products.filter((p) => {
      const n = filesByNm.get(p.nmId) || 0;
      if (codesFilter === 'with' && n === 0) return false;
      if (codesFilter === 'without' && n > 0) return false;
      return words.every((w) => p.hay.includes(w));
    });
  }, [products, query, codesFilter, filesByNm]);

  useEffect(() => { setLimit(PRODUCT_PAGE); }, [query, codesFilter, categoriesKey]);

  const pickProduct = useCallback((p: HsLinkProduct) => {
    setProduct(p);
    setScope('article');
    setSize('');
    setNotice(null);
  }, []);

  const filterByCategory = !showAllCategories && selectedCategories.length > 0;
  const visibleFiles = useMemo(() => {
    const words = fold(fileQuery.trim()).split(/\s+/).filter(Boolean);
    const list = workingGroups.filter((g) => {
      if (filterByCategory && !selectedCategories.some((c) => matchesCategory(g, c))) return false;
      return words.every((w) => fold(g.fileName).includes(w));
    });
    return list.sort((a, b) => (sort === 'name'
      ? a.fileName.localeCompare(b.fileName, 'ru', { numeric: true, sensitivity: 'base' }) || b.firstAt.localeCompare(a.firstAt)
      : b.firstAt.localeCompare(a.firstAt)));
  }, [workingGroups, filterByCategory, selectedCategories, fileQuery, sort, matchesCategory]);

  const hiddenByCategory = filterByCategory
    ? workingGroups.filter((g) => !selectedCategories.some((c) => matchesCategory(g, c))).length
    : 0;

  const sizeNeeded = scope === 'size';
  const canLink = Boolean(product) && (!sizeNeeded || Boolean(size));
  const scopeText = !product ? '' : sizeNeeded
    ? (size ? `только размеру ${size}` : 'выберите размер')
    : 'любому размеру артикула';

  const patchGroup = (key: string, patch: Partial<HsFileGroup>) => {
    setGroups((prev) => prev.map((g) => {
      if (g.key !== key) return g;
      const next = { ...g, ...patch };
      return { ...next, key: [next.fileName, next.firstAt, next.category, next.gender, next.size, next.nmIds.join(',')].join('|') };
    }));
  };

  // Категория для файла: та из выбранных, которой принадлежит товар (в том же написании, что и в базе кодов).
  const categoryOfProduct = (p: HsLinkProduct) =>
    selectedCategories.find((c) => normalizeHsCategoryName(c) === normalizeHsCategoryName(p.subject)) || p.subject || null;

  const link = async (g: HsFileGroup) => {
    if (!product || !canLink || busyKey) return;
    setBusyKey(g.key);
    setNotice(null);
    try {
      const nextSize = sizeNeeded ? size : null;
      const category = categoryOfProduct(product);
      const updated = await linkHsFile(supplierId, g, product.nmId, nextSize, category);
      if (updated === 0) throw new Error('файл уже изменён — обновляю список');
      setSessionSids((prev) => new Set(prev).add(sidOf(g)));
      patchGroup(g.key, { nmIds: [product.nmId], size: nextSize, ...(hsFileHasNoCategory(g) && category ? { category } : {}) });
      setNotice({ tone: 'ok', text: `«${g.fileName}» → ${product.vendorCode || product.nmId}, ${sizeNeeded ? `размер ${size}` : 'все размеры'} (${updated} шт)` });
      onChanged?.();
    } catch (e: any) {
      setNotice({ tone: 'err', text: `Не удалось привязать: ${e?.message || 'ошибка'}` });
      void reloadGroups();
    } finally {
      setBusyKey('');
    }
  };

  const unlink = async (g: HsFileGroup) => {
    if (busyKey) return;
    setBusyKey(g.key);
    setNotice(null);
    try {
      const updated = await unlinkHsFile(supplierId, g);
      if (updated === 0) throw new Error('файл уже изменён — обновляю список');
      patchGroup(g.key, { nmIds: [] });
      setNotice({ tone: 'ok', text: `Привязка файла «${g.fileName}» снята` });
      onChanged?.();
    } catch (e: any) {
      setNotice({ tone: 'err', text: `Не удалось снять привязку: ${e?.message || 'ошибка'}` });
      void reloadGroups();
    } finally {
      setBusyKey('');
    }
  };

  // Загрузка: после неё подтягиваем список и оставляем на виду всё, что появилось.
  const afterUpload = async (summary: FileUploadSummary | null) => {
    const before = new Set(groupsRef.current.map(sidOf));
    const list = await reloadGroups();
    const fresh = list.filter((g) => !before.has(sidOf(g)));
    if (fresh.length > 0) setSessionSids((prev) => new Set([...prev, ...fresh.map(sidOf)]));
    if (summary) {
      const failedText = summary.failed.length ? ` Не загружены (пусто, дубли или ошибка): ${summary.failed.join(', ')}.` : '';
      setNotice({
        tone: summary.files > 0 ? 'ok' : 'err',
        text: summary.files > 0 ? `Загружено файлов: ${summary.files}, кодов: ${summary.codes}.${failedText}` : `Ничего не загружено.${failedText}`,
      });
      if (summary.files > 0) onChanged?.();
    }
  };

  const upload = async (files: File[]) => {
    if (files.length === 0 || uploading) return;
    setUploading(true);
    setNotice(null);
    try {
      await afterUpload(await onUploadFiles(files));
    } catch (e: any) {
      setNotice({ tone: 'err', text: `Не удалось загрузить: ${e?.message || 'ошибка'}` });
    } finally {
      setUploading(false);
    }
  };

  const importTelegram = async () => {
    if (!onImportTelegram || uploading) return;
    setUploading(true);
    setNotice(null);
    try {
      await afterUpload(await onImportTelegram());
    } catch (e: any) {
      setNotice({ tone: 'err', text: `Не удалось взять файл из Telegram: ${e?.message || 'ошибка'}` });
    } finally {
      setUploading(false);
    }
  };

  const linkedLabel = (g: HsFileGroup) => {
    const names = g.nmIds.map((id) => productByNm.get(id)?.vendorCode || String(id));
    const who = names.length > 2 ? `${names.slice(0, 2).join(', ')} +${names.length - 2}` : names.join(', ');
    return `${who} · ${g.size ? `размер ${g.size}` : 'все размеры'}`;
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-2 backdrop-blur-sm md:p-4" onClick={onClose}>
      <div
        className="flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Привязка файлов с кодами к товарам"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 md:px-5 md:py-4">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900 md:text-xl">Привязка файлов с кодами к товарам</h3>
            <p className="mt-0.5 truncate text-sm text-slate-500">
              {supplierName ? `${supplierName} · ` : ''}загрузите файлы, выберите товар и привяжите к нему файл
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600" aria-label="Закрыть">
            <X className="h-5 w-5" />
          </button>
        </div>

        {needsMigration ? (
          <div className="m-5 rounded-xl bg-amber-50 px-4 py-4 text-sm text-amber-900">
            <b>Нужна миграция базы.</b> Выполните в Supabase → SQL Editor файл <code className="rounded bg-amber-100 px-1">supabase/migrations/20261105_hs_file_groups.sql</code> (он только добавляет колонку и функцию, данные не меняет) и откройте окно снова.
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto md:grid-cols-2 md:overflow-hidden">
            {/* Товары */}
            <section className="flex min-h-0 flex-col border-b border-slate-100 md:border-b-0 md:border-r">
              <div className="shrink-0 space-y-2 bg-slate-50/60 px-4 py-3 md:px-5">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">1. Товар</div>
                <div className="flex flex-wrap items-center gap-2">
                  <FacetSelect label="Категории" options={categoryOptions} selected={selectedCategories} onChange={setSelectedCategories} />
                  {selectedCategories.length > 0 && (
                    <span className="text-xs text-slate-500">выбрано: {selectedCategories.length}</span>
                  )}
                </div>
                {selectedCategories.length > 0 && (
                  <>
                    <SearchField value={query} onChange={setQuery} placeholder="Артикул, название, цвет, размер" />
                    <div className="flex flex-wrap gap-1.5">
                      {([['all', 'Все'], ['without', 'Без кодов'], ['with', 'С кодами']] as const).map(([id, label]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setCodesFilter(id)}
                          className={`!min-h-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                            codesFilter === id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="min-h-[12rem] flex-1 space-y-2 overflow-y-auto px-4 py-3 md:px-5">
                {selectedCategories.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-500">Выберите одну или несколько категорий, чтобы увидеть их товары.</p>
                ) : productsLoading ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Загружаю товары…</div>
                ) : productsError ? (
                  <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">Не удалось загрузить товары: {productsError}</div>
                ) : filteredProducts.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-500">{products.length === 0 ? 'В базе товаров нет карточек выбранных категорий.' : 'Ничего не найдено.'}</p>
                ) : (
                  <>
                    {filteredProducts.slice(0, limit).map((p) => (
                      <ProductRow
                        key={p.nmId}
                        product={p}
                        active={product?.nmId === p.nmId}
                        filesCount={filesByNm.get(p.nmId) || 0}
                        showSubject={selectedCategories.length > 1}
                        onPick={pickProduct}
                      />
                    ))}
                    {filteredProducts.length > limit && (
                      <button type="button" onClick={() => setLimit((n) => n + PRODUCT_PAGE)} className="w-full rounded-xl bg-slate-100 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200">
                        Показать ещё {Math.min(PRODUCT_PAGE, filteredProducts.length - limit)}
                      </button>
                    )}
                  </>
                )}
              </div>
            </section>

            {/* Файлы */}
            <section
              className={`flex min-h-0 flex-col transition-colors ${dragging ? 'bg-indigo-50/60' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={(e) => { if (e.currentTarget === e.target) setDragging(false); }}
              onDrop={(e) => { e.preventDefault(); setDragging(false); void upload(Array.from(e.dataTransfer.files)); }}
            >
              <div className="shrink-0 space-y-2 bg-slate-50/60 px-4 py-3 md:px-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">2. Файл с кодами</div>
                  <div className="flex items-center gap-1.5">
                    {onImportTelegram && (
                      <button
                        type="button"
                        onClick={importTelegram}
                        disabled={uploading}
                        title="Взять последний файл из Telegram поставщика"
                        className="inline-flex !min-h-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-100 disabled:opacity-40"
                      >
                        <Send className="h-3.5 w-3.5" /> Из Telegram
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="inline-flex !min-h-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      {uploading ? 'Загружаю…' : 'Загрузить файлы'}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".csv,.txt,.xlsx,.xls"
                      className="hidden"
                      onChange={(e) => { const files = Array.from(e.target.files || []); e.target.value = ''; void upload(files); }}
                    />
                  </div>
                </div>
                {product ? (
                  <>
                    <div className="rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-slate-200">
                      <span className="font-semibold text-slate-900">{product.vendorCode || product.nmId}</span>
                      <span className="text-slate-500"> · {product.color || 'цвет не указан'}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setScope('article')}
                        className={`!min-h-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${scope === 'article' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'}`}
                      >
                        Весь артикул
                      </button>
                      <button
                        type="button"
                        onClick={() => setScope('size')}
                        disabled={product.sizes.length === 0}
                        className={`!min-h-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-40 ${scope === 'size' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'}`}
                      >
                        Артикул + размер
                      </button>
                      {scope === 'size' && product.sizes.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSize(s)}
                          className={`!min-h-0 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${size === s ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500">Файл подойдёт: <b className="text-slate-700">{scopeText}</b></p>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">Выберите товар слева, затем нажмите «Привязать» у нужного файла.</p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <SearchField value={fileQuery} onChange={setFileQuery} placeholder="Название файла" className="min-w-[10rem] flex-1" />
                  <button
                    type="button"
                    onClick={() => setSort((s) => (s === 'name' ? 'new' : 'name'))}
                    className="!min-h-0 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-100"
                    title="Порядок файлов в списке"
                  >
                    {sort === 'name' ? 'По названию' : 'Сначала новые'}
                  </button>
                </div>
                {selectedCategories.length > 0 && (
                  <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={showAllCategories}
                      onChange={(e) => setShowAllCategories(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                    />
                    Показать все файлы{!showAllCategories && hiddenByCategory > 0 ? ` (скрыто других категорий: ${hiddenByCategory})` : ''}
                  </label>
                )}
              </div>

              {notice && (
                <div className={`mx-4 mt-3 rounded-lg px-3 py-2 text-xs md:mx-5 ${notice.tone === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'}`} role="status">
                  {notice.text}
                </div>
              )}

              <div className="min-h-[12rem] flex-1 space-y-2 overflow-y-auto px-4 py-3 md:px-5">
                {groupsLoading ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Загружаю файлы…</div>
                ) : groupsError ? (
                  <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">Не удалось загрузить файлы: {groupsError}</div>
                ) : workingGroups.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className={`flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-12 text-center transition-colors ${
                      dragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <Upload className="h-8 w-8 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-700">Загрузите файлы с кодами</span>
                    <span className="text-xs text-slate-500">Нажмите или перетащите сюда сразу несколько файлов (CSV, Excel, TXT)</span>
                  </button>
                ) : visibleFiles.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-500">Файлов выбранных категорий нет — отметьте «Показать все файлы».</p>
                ) : (
                  visibleFiles.map((g) => {
                    const linked = g.nmIds.length > 0;
                    const toThis = Boolean(product) && g.nmIds.includes(product!.nmId);
                    const busy = busyKey === g.key;
                    return (
                      <div
                        key={g.key}
                        className={`rounded-xl border p-3 transition-colors ${
                          toThis ? 'border-emerald-300 bg-emerald-50' : linked ? 'border-slate-200 bg-slate-50' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          <div className="min-w-0 flex-1">
                            <div className="break-all text-sm font-semibold text-slate-900">{g.fileName}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px]">
                              {hsFileHasNoCategory(g)
                                ? <span className="rounded bg-sky-50 px-1.5 py-0.5 text-sky-700">ждёт привязки</span>
                                : <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">{g.category}</span>}
                              {g.gender && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">{genderLabel(g.gender)}</span>}
                              {g.size && <span className="rounded bg-white px-1.5 py-0.5 font-medium text-slate-700 ring-1 ring-slate-200">размер {g.size}</span>}
                              <span className="rounded bg-indigo-50 px-1.5 py-0.5 font-medium tabular-nums text-indigo-700">{g.codes} шт</span>
                              <span className="text-slate-400">{new Date(g.firstAt).toLocaleDateString('ru-RU')}</span>
                            </div>
                            {linked && (
                              <div className={`mt-1.5 flex items-center gap-1 text-xs ${toThis ? 'font-medium text-emerald-700' : 'text-slate-600'}`}>
                                <CheckCircle2 className="h-3.5 w-3.5" /> Привязан: {linkedLabel(g)}
                              </div>
                            )}
                          </div>
                          <div className="flex shrink-0 flex-col gap-1.5">
                            {!toThis && (
                              <button
                                type="button"
                                onClick={() => link(g)}
                                disabled={!canLink || Boolean(busyKey)}
                                title={!product ? 'Сначала выберите товар слева' : sizeNeeded && !size ? 'Выберите размер' : linked ? 'Перепривязать к выбранному товару' : 'Привязать к выбранному товару'}
                                className="inline-flex !min-h-0 items-center justify-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
                              >
                                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
                                {linked ? 'Перепривязать' : 'Привязать'}
                              </button>
                            )}
                            {linked && (
                              <button
                                type="button"
                                onClick={() => unlink(g)}
                                disabled={Boolean(busyKey)}
                                className="inline-flex !min-h-0 items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-100 disabled:opacity-40"
                              >
                                <Link2Off className="h-3.5 w-3.5" /> Отвязать
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        )}

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 md:px-5">
          <span className="text-xs text-slate-500">Привязка применяется сразу. Привязанные коды печатаются только на свой товар. Файлы, уже разнесённые по базе, здесь не показываются.</span>
          <button onClick={onClose} className="shrink-0 whitespace-nowrap rounded-xl bg-slate-100 px-5 py-2.5 font-medium text-slate-700 transition-colors hover:bg-slate-200">Готово</button>
        </div>
      </div>
    </div>
  );
}
