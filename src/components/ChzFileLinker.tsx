import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, FileText, Link2, Link2Off, Loader2, Package, Send, Upload, X } from 'lucide-react';
import { SearchField } from './ui/SearchField';
import { FacetSelect, type FacetOption } from './ui/FacetSelect';
import { normalizeHsCategoryName, normalizeHsSize } from '../utils/chzLabel';
import {
  HS_FILE_GROUPS_MISSING,
  categoryNameStems,
  hsFileHasNoCategory,
  hsGroupFromTable,
  hsGroupKey,
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
 * выбираем категории и товары слева и привязываем к ним файл справа — ко всему
 * артикулу или к артикулу с размером. Таблица из кабинета ЧЗ приходит уже разобранной:
 * в ней у каждого кода есть тип, цвет, размер и артикул, и файл с десятком дублёнок
 * раскладывается на группы «коричневая · S · 30 шт». Для групп сайт подсказывает подходящие
 * товары; выбрать можно и несколько — один код подойдёт всем выбранным карточкам. Показываются только файлы, которые ещё ждут
 * привязки, и те, с которыми работаем в этом окне: всё, что уже разнесено по базе,
 * остаётся как есть и не мешает.
 */

export type FileUploadSummary = { files: number; codes: number; failed: string[] };

const CATEGORIES_KEY = 'hs_linker_categories_v1';
const PRODUCT_PAGE = 50;
const EXPANDED_KEY = 'hs_linker_expanded_v1';
const SIZE_ORDER = ['xxs', 'xs', 's', 'm', 'l', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl'];
const fold = (v: string) => v.toLowerCase().replace(/ё/g, 'е');
const genderLabel = (g: string | null) => (g === 'male' ? 'Муж' : g === 'female' ? 'Жен' : 'Любой пол');
/** Устойчивый номер загрузки: ключ группы меняется при привязке, а имя и время вставки — нет. */
const sidOf = (g: HsFileGroup) => `${g.fileName}|${g.firstAt}`;

type Scope = 'article' | 'size';
type Sort = 'name' | 'new';

const ProductRow = memo(function ProductRow({
  product, active, filesCount, showSubject, onPick, selectedSizes, onToggleSize,
}: {
  product: HsLinkProduct;
  active: boolean;
  filesCount: number;
  showSubject: boolean;
  onPick: (p: HsLinkProduct) => void;
  /** Размеры, отмеченные на этом товаре: файлы привязываются только к ним. Пусто — ко всем размерам. */
  selectedSizes?: string[];
  onToggleSize: (p: HsLinkProduct, size: string) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onPick(product)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(product); } }}
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
          {product.sizes.map((s) => {
            const on = Boolean(selectedSizes?.some((x) => normalizeHsSize(x) === normalizeHsSize(s)));
            return (
              <button
                key={s}
                type="button"
                onClick={(e) => { e.stopPropagation(); onToggleSize(product, s); }}
                aria-pressed={on}
                title={on ? 'Файлы этого размера привязываются к товару — нажмите, чтобы убрать' : 'Привязывать к этому товару файлы размера ' + s}
                className={`!min-h-0 rounded px-1.5 py-0.5 text-[11px] font-medium ring-1 transition-colors ${
                  on ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white text-slate-700 ring-slate-200 hover:bg-indigo-50 hover:ring-indigo-300'
                }`}
              >
                {s}
              </button>
            );
          })}
        </span>
      </span>
    </div>
  );
});

const COLLAPSED_COUNT = 3;

/** Список подходящих товаров: сначала три, остальные — по кнопке «ещё N». Нажатие на товар выбирает его слева. */
function SuggestList({
  title, products, pickedNmIds, onPick,
}: {
  title: string;
  products: HsLinkProduct[];
  pickedNmIds: ReadonlySet<number>;
  onPick: (p: HsLinkProduct) => void;
}) {
  const [open, setOpen] = useState(false);
  const shown = open ? products : products.slice(0, COLLAPSED_COUNT);
  const rest = products.length - COLLAPSED_COUNT;
  return (
    <div>
      <div className="mb-1 text-[11px] text-slate-500">{title} ({products.length}):</div>
      <div className={`flex flex-wrap items-center gap-1 ${open ? 'max-h-40 overflow-y-auto' : ''}`}>
        {shown.map((p) => (
          <button
            key={p.nmId}
            type="button"
            onClick={() => onPick(p)}
            title={`Выбрать товар. Размеры: ${p.sizes.join(', ') || '—'}`}
            className={`!min-h-0 rounded px-1.5 py-0.5 text-[11px] font-medium ring-1 ${
              pickedNmIds.has(p.nmId) ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-amber-50 text-amber-800 ring-amber-200 hover:bg-amber-100'
            }`}
          >
            {p.vendorCode || p.nmId}
          </button>
        ))}
        {rest > 0 && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="!min-h-0 rounded px-1.5 py-0.5 text-[11px] font-medium text-indigo-600 underline hover:text-indigo-800"
          >
            {open ? 'свернуть' : `ещё ${rest}`}
          </button>
        )}
      </div>
    </div>
  );
}

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
  const [picked, setPicked] = useState<HsLinkProduct[]>([]);
  // Размеры, отмеченные на выбранных товарах: nmId → размеры. Нет записи — товар берёт файлы любого своего размера.
  const [sizeSel, setSizeSel] = useState<Record<number, string[]>>({});

  const [scope, setScope] = useState<Scope>('article');
  const [size, setSize] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [fileQuery, setFileQuery] = useState('');
  const [sort, setSort] = useState<Sort>('name');
  // Расширенный режим: у каждого размера своя строка с подсказками. По умолчанию — компактные кнопки размеров.
  const [expanded, setExpanded] = useState<boolean>(() => {
    try { return localStorage.getItem(EXPANDED_KEY) === '1'; } catch { return false; }
  });
  const toggleExpanded = (value: boolean) => {
    setExpanded(value);
    try { localStorage.setItem(EXPANDED_KEY, value ? '1' : '0'); } catch { /* приватный режим */ }
  };
  // Отмеченные кнопки размеров: по товару (семейству) — набор размеров.
  const [selSizes, setSelSizes] = useState<Record<string, string[]>>({});
  const toggleSize = (famKey: string, size: string) => setSelSizes((prev) => {
    const cur = new Set(prev[famKey] || []);
    if (cur.has(size)) cur.delete(size); else cur.add(size);
    return { ...prev, [famKey]: Array.from(cur) };
  });
  const [busyKey, setBusyKey] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const groupsRef = useRef<HsFileGroup[]>([]);
  groupsRef.current = groups;

  // Esc окно не закрывает: он закрывает выпадающий список категорий, и закрытие всего окна
  // вместе с ним стирало бы рабочий набор файлов. Закрывает крестик, «Готово» и клик по фону.

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
    setPicked([]);
    setSizeSel({});
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

  // Ждут привязки: у файла нет категории (загружен «без привязки») или это группа из таблицы ЧЗ — и товаров ещё нет.
  // Плюс всё, с чем работали в этом окне.
  const workingGroups = useMemo(
    () => groups.filter((g) => ((hsFileHasNoCategory(g) || hsGroupFromTable(g)) && g.nmIds.length === 0) || sessionSids.has(sidOf(g))),
    [groups, sessionSids],
  );

  // Файл относится к категории, если она записана у кодов или (у файла без категории) названа в имени.
  const stemsByCategory = useMemo(() => new Map(categories.map((c) => [c, categoryNameStems(c)])), [categories]);
  const matchesCategory = useCallback((g: HsFileGroup, category: string) => {
    if (hsFileHasNoCategory(g)) {
      const name = fold(g.fileName);
      return (stemsByCategory.get(category) || categoryNameStems(category)).some((stem) => name.includes(stem));
    }
    if (normalizeHsCategoryName(g.category || '') === normalizeHsCategoryName(category)) return true;
    // «Костюм» из таблицы ЧЗ и «Костюмы / Костюмы спортивные» из карточек — одна категория.
    if (hsGroupFromTable(g)) {
      const own = fold(g.category || '');
      return Boolean(own) && (stemsByCategory.get(category) || categoryNameStems(category)).some((stem) => own.includes(stem));
    }
    return false;
  }, [stemsByCategory]);

  // Категории, которые нужны группам из таблицы: выбираем их сами, чтобы сразу появились подсказки.
  const categoriesForGroups = useCallback((list: HsFileGroup[]): string[] => {
    const found = new Set<string>();
    list.filter((g) => hsGroupFromTable(g) && g.nmIds.length === 0).forEach((g) => {
      categories.forEach((c) => { if (matchesCategory(g, c)) found.add(c); });
    });
    return Array.from(found);
  }, [categories, matchesCategory]);

  const autoCategoriesDone = useRef(false);
  useEffect(() => {
    if (groupsLoading || autoCategoriesDone.current) return;
    autoCategoriesDone.current = true;
    const wanted = categoriesForGroups(groups);
    if (wanted.length > 0) setSelectedCategories((prev) => Array.from(new Set([...prev, ...wanted])));
  }, [groupsLoading, groups, categoriesForGroups]);

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

  // Товары выбираются галочкой: нажали — выбран, нажали ещё раз — снят.
  const pickProduct = useCallback((p: HsLinkProduct) => {
    setPicked((prev) => (prev.some((x) => x.nmId === p.nmId) ? prev.filter((x) => x.nmId !== p.nmId) : [...prev, p]));
    setSizeSel((prev) => {
      if (!(p.nmId in prev)) return prev;
      const next = { ...prev };
      delete next[p.nmId];
      return next;
    });
    setNotice(null);
  }, []);

  // Размер на карточке товара: первое нажатие выбирает товар вместе с этим размером, дальше размеры добавляются и снимаются.
  const toggleProductSize = useCallback((p: HsLinkProduct, size: string) => {
    setPicked((prev) => (prev.some((x) => x.nmId === p.nmId) ? prev : [...prev, p]));
    setSizeSel((prev) => {
      const cur = prev[p.nmId] || [];
      const has = cur.some((x) => normalizeHsSize(x) === normalizeHsSize(size));
      const list = has ? cur.filter((x) => normalizeHsSize(x) !== normalizeHsSize(size)) : [...cur, size];
      const next = { ...prev };
      if (list.length > 0) next[p.nmId] = list; else delete next[p.nmId];
      return next;
    });
    setNotice(null);
  }, []);

  const pickedNmIds = useMemo(() => new Set(picked.map((p) => p.nmId)), [picked]);
  const pickedSizes = useMemo(() => {
    const all = new Set<string>();
    picked.forEach((p) => p.sizes.forEach((s) => all.add(s)));
    return Array.from(all);
  }, [picked]);

  // Подсказки для группы из таблицы: артикул поставщика = артикул карточки, иначе тот же цвет и размер.
  const suggestions = useMemo(() => {
    const map = new Map<string, { products: HsLinkProduct[]; exact: boolean }>();
    workingGroups.forEach((g) => {
      if (!hsGroupFromTable(g) || g.nmIds.length > 0) return;
      const article = fold(g.article || '');
      // Товары только той же категории: «куртка» подсказывает куртки, бомберы и дублёнки, но не костюмы.
      const sameCategory = (p: HsLinkProduct) => !g.category || !p.subject || matchesCategory(g, p.subject);
      const byArticle = article ? products.filter((p) => fold(p.vendorCode) === article) : [];
      if (byArticle.length > 0) { map.set(g.key, { products: byArticle, exact: true }); return; }
      const color = fold(g.color || '');
      const size = normalizeHsSize(g.size || '');
      const matched = products.filter((p) => {
        if (!sameCategory(p)) return false;
        const pc = fold(p.color);
        const colorOk = !color || (pc && (pc === color || pc.includes(color) || color.includes(pc)));
        const sizeOk = !size || p.sizes.some((s) => normalizeHsSize(s) === size);
        return colorOk && sizeOk && Boolean(color || size);
      });
      if (matched.length > 0) map.set(g.key, { products: matched, exact: false });
    });
    return map;
  }, [workingGroups, products, matchesCategory]);

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
  const canLink = picked.length > 0 && (!sizeNeeded || (Boolean(size) && pickedSizes.includes(size)));
  const scopeText = picked.length === 0 ? '' : sizeNeeded
    ? (size ? `только размеру ${size}` : 'выберите размер')
    : 'любому размеру артикула';

  const patchGroup = (key: string, patch: Partial<HsFileGroup>) => {
    setGroups((prev) => prev.map((g) => {
      if (g.key !== key) return g;
      const next = { ...g, ...patch };
      return { ...next, key: hsGroupKey(next) };
    }));
  };

  // Категория для файла: та из выбранных, которой принадлежит товар (в том же написании, что и в базе кодов).
  const categoryOfProduct = (p: HsLinkProduct) =>
    selectedCategories.find((c) => normalizeHsCategoryName(c) === normalizeHsCategoryName(p.subject)) || p.subject || null;

  /** Привязать группу к товарам. Группа из таблицы ЧЗ сохраняет свой размер из файла, у остальных размер задаёт выбор справа. */
  const linkTo = async (g: HsFileGroup, targets: HsLinkProduct[], silent = false): Promise<boolean> => {
    if (targets.length === 0 || busyKey) return false;
    setBusyKey(g.key);
    if (!silent) setNotice(null);
    try {
      const fromTable = hsGroupFromTable(g);
      const nextSize = fromTable ? g.size : (sizeNeeded ? size : null);
      const category = categoryOfProduct(targets[0]);
      const updated = await linkHsFile(supplierId, g, targets.map((t) => t.nmId), nextSize, category);
      if (updated === 0) throw new Error('файл уже изменён — обновляю список');
      setSessionSids((prev) => new Set(prev).add(sidOf(g)));
      patchGroup(g.key, {
        nmIds: targets.map((t) => t.nmId),
        size: nextSize,
        ...((hsFileHasNoCategory(g) || fromTable) && category ? { category } : {}),
      });
      if (!silent) {
        const names = targets.map((t) => t.vendorCode || t.nmId).join(', ');
        setNotice({ tone: 'ok', text: `«${g.fileName}»${g.color ? ` · ${g.color}` : ''}${nextSize ? ` · ${nextSize}` : ''} → ${names} (${updated} шт)` });
      }
      onChanged?.();
      return true;
    } catch (e: any) {
      setNotice({ tone: 'err', text: `Не удалось привязать: ${e?.message || 'ошибка'}` });
      void reloadGroups();
      return false;
    } finally {
      setBusyKey('');
    }
  };

  const link = (g: HsFileGroup) => linkTo(g, picked);

  // Группы, где подсказка однозначна: артикул совпал или подошёл ровно один товар.
  const confidentGroups = useMemo(
    () => visibleFiles.filter((g) => {
      const s = suggestions.get(g.key);
      return Boolean(s) && (s!.exact || s!.products.length === 1);
    }),
    [visibleFiles, suggestions],
  );

  const linkConfident = async () => {
    if (busyKey || confidentGroups.length === 0) return;
    if (!window.confirm(`Привязать ${confidentGroups.length} групп к подходящим товарам (по артикулу или по цвету и размеру)?`)) return;
    let done = 0;
    for (const g of confidentGroups) {
      const s = suggestions.get(g.key);
      if (s && (await linkTo(g, s.products, true))) done += 1;
    }
    setNotice({ tone: done === confidentGroups.length ? 'ok' : 'err', text: `Привязано групп: ${done} из ${confidentGroups.length}` });
  };

  // Группы из таблицы ЧЗ собираем по товару: «Куртка · Чёрный» — одна карточка, внутри неё размеры.
  const families = useMemo(() => {
    const map = new Map<string, { key: string; fileName: string; category: string; color: string; gender: string | null; groups: HsFileGroup[] }>();
    visibleFiles.filter(hsGroupFromTable).forEach((g) => {
      const key = [g.fileName, fold(g.category || ''), fold(g.color || '')].join('|');
      const fam = map.get(key) || { key, fileName: g.fileName, category: g.category || '', color: g.color || '', gender: g.gender, groups: [] };
      fam.groups.push(g);
      map.set(key, fam);
    });
    const rank = (size: string | null) => {
      const n = normalizeHsSize(size || '');
      const i = SIZE_ORDER.indexOf(n);
      if (i >= 0) return i;
      const num = parseFloat(n);
      return Number.isFinite(num) ? 100 + num : 1000;
    };
    map.forEach((fam) => fam.groups.sort((a, b) => rank(a.size) - rank(b.size)));
    return Array.from(map.values());
  }, [visibleFiles]);
  const plainFiles = useMemo(() => visibleFiles.filter((g) => !hsGroupFromTable(g)), [visibleFiles]);

  /** Подходит ли карточка по размеру: в ней должен быть именно такой размер. */
  const hasSize = (p: HsLinkProduct, size: string | null) => !size || p.sizes.some((x) => normalizeHsSize(x) === normalizeHsSize(size));
  /** Выбранный товар берёт файл этого размера: размер есть в карточке и не исключён отметками на ней. */
  const fitsProduct = (p: HsLinkProduct, size: string | null) => {
    if (!hasSize(p, size)) return false;
    const marked = sizeSel[p.nmId];
    return !size || !marked || marked.length === 0 || marked.some((x) => normalizeHsSize(x) === normalizeHsSize(size));
  };

  /**
   * Привязка по размерам: каждый размер получает только те из выбранных (или подсказанных) товаров,
   * у которых этот размер есть. Размер, которому ничего не подошло, остаётся без привязки.
   */
  const linkFamilyBySize = async (groups: HsFileGroup[], source: 'picked' | 'hints') => {
    if (busyKey) return;
    setNotice(null);
    let done = 0;
    const skipped: string[] = [];
    const todo = groups.filter((g) => g.nmIds.length === 0);
    for (const g of todo) {
      const pool = source === 'picked' ? picked : (suggestions.get(g.key)?.products || []);
      const targets = pool.filter((p) => (source === 'picked' ? fitsProduct(p, g.size) : hasSize(p, g.size)));
      if (targets.length === 0) { skipped.push(g.size || '—'); continue; }
      if (await linkTo(g, targets, true)) done += 1;
    }
    setNotice({
      tone: done > 0 ? 'ok' : 'err',
      text: `Привязано размеров: ${done}.${skipped.length ? ` Не нашлось товара с размером: ${skipped.join(', ')}.` : ''}`,
    });
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
    const wanted = categoriesForGroups(fresh);
    if (wanted.length > 0) setSelectedCategories((prev) => Array.from(new Set([...prev, ...wanted])));
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
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">1. Товары <span className="font-normal normal-case text-slate-400">— можно выбрать несколько</span></div>
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
                        active={pickedNmIds.has(p.nmId)}
                        filesCount={filesByNm.get(p.nmId) || 0}
                        showSubject={selectedCategories.length > 1}
                        onPick={pickProduct}
                        selectedSizes={sizeSel[p.nmId]}
                        onToggleSize={toggleProductSize}
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
                {picked.length > 0 ? (
                  <>
                    <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-slate-200">
                      <span className="text-xs text-slate-500">Выбрано товаров: {picked.length}</span>
                      {picked.map((p) => (
                        <button
                          key={p.nmId}
                          type="button"
                          onClick={() => pickProduct(p)}
                          title="Убрать из выбора"
                          className="inline-flex !min-h-0 items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                        >
                          {p.vendorCode || p.nmId}{p.color ? ` · ${p.color}` : ''}{sizeSel[p.nmId]?.length ? ` · ${sizeSel[p.nmId].join(', ')}` : ' · все размеры'} <X className="h-3 w-3" />
                        </button>
                      ))}
                      <button type="button" onClick={() => { setPicked([]); setSizeSel({}); }} className="!min-h-0 text-xs text-slate-400 underline hover:text-slate-600">снять всё</button>
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
                        disabled={pickedSizes.length === 0}
                        className={`!min-h-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-40 ${scope === 'size' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'}`}
                      >
                        Артикул + размер
                      </button>
                      {scope === 'size' && pickedSizes.map((s) => (
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
                    <p className="text-xs text-slate-500">Обычный файл подойдёт: <b className="text-slate-700">{scopeText}</b>. У групп из таблицы ЧЗ размер берётся из самой таблицы.</p>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">Отметьте товары слева (можно несколько) и нажмите «Привязать» у нужного файла, либо возьмите подсказку прямо в группе.</p>
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
                <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={expanded}
                    onChange={(e) => toggleExpanded(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                  />
                  Расширенный режим (подсказки и кнопки у каждого размера)
                </label>
                {confidentGroups.length > 0 && (
                  <button
                    type="button"
                    onClick={() => void linkConfident()}
                    disabled={Boolean(busyKey)}
                    className="inline-flex !min-h-0 w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-40"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Привязать все с точной подсказкой ({confidentGroups.length})
                  </button>
                )}
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
                  <>
                  {families.map((fam) => {
                    const total = fam.groups.reduce((n, g) => n + g.codes, 0);
                    const open = fam.groups.filter((g) => g.nmIds.length === 0);
                    const pickedFit = open.filter((g) => picked.some((p) => fitsProduct(p, g.size))).length;
                    const hintFit = open.filter((g) => (suggestions.get(g.key)?.products || []).length > 0).length;
                    return (
                      <div key={fam.key} className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex items-start gap-2">
                          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-slate-900">
                              {fam.category} · <span className="capitalize">{fam.color || 'цвет не указан'}</span>
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px]">
                              {fam.gender && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">{genderLabel(fam.gender)}</span>}
                              <span className="rounded bg-indigo-50 px-1.5 py-0.5 font-medium tabular-nums text-indigo-700">{total} шт</span>
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">размеров: {fam.groups.length}</span>
                              <span className="break-all text-slate-400">файл «{fam.fileName}»</span>
                            </div>
                          </div>
                        </div>
                        {expanded ? (
                        <>
                        {open.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => void linkFamilyBySize(fam.groups, 'picked')}
                              disabled={picked.length === 0 || pickedFit === 0 || Boolean(busyKey)}
                              title={picked.length === 0 ? 'Выберите товары слева' : 'Каждый размер получит те из выбранных товаров, где такой размер есть'}
                              className="inline-flex !min-h-0 items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
                            >
                              <Link2 className="h-3.5 w-3.5" /> Привязать по размерам к выбранным{picked.length > 0 ? ` (${picked.length})` : ''}
                            </button>
                            <button
                              type="button"
                              onClick={() => void linkFamilyBySize(fam.groups, 'hints')}
                              disabled={hintFit === 0 || Boolean(busyKey)}
                              title="Каждый размер — к товарам того же цвета, где есть этот размер"
                              className="inline-flex !min-h-0 items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-40"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> По цвету и размеру ({hintFit})
                            </button>
                          </div>
                        )}
                        <div className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-100">
                          {fam.groups.map((g) => {
                            const linked = g.nmIds.length > 0;
                            const hint = suggestions.get(g.key);
                            const fits = picked.filter((p) => fitsProduct(p, g.size));
                            const busy = busyKey === g.key;
                            return (
                              <div key={g.key} className={`flex flex-wrap items-center gap-2 px-2.5 py-2 ${linked ? 'bg-emerald-50' : ''}`}>
                                <span className="w-12 shrink-0 text-sm font-bold text-slate-900">{g.size || '—'}</span>
                                <span className="shrink-0 rounded bg-indigo-50 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-indigo-700">{g.codes} шт</span>
                                <div className="order-last basis-full text-xs text-slate-600">
                                  {linked ? (
                                    <span className="inline-flex items-center gap-1 font-medium text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> {linkedLabel(g)}</span>
                                  ) : hint ? (
                                    <SuggestList title={hint.exact ? 'Совпал артикул' : 'Подходят'} products={hint.products} pickedNmIds={pickedNmIds} onPick={pickProduct} />
                                  ) : (
                                    <span className="text-slate-400">нет подходящих товаров</span>
                                  )}
                                </div>
                                <div className="flex shrink-0 gap-1.5">
                                  {!linked && hint && (
                                    <button type="button" onClick={() => void linkTo(g, hint.products.filter((p) => hasSize(p, g.size)).length > 0 ? hint.products.filter((p) => hasSize(p, g.size)) : hint.products)} disabled={Boolean(busyKey)} className="inline-flex !min-h-0 items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-emerald-700 disabled:opacity-40">
                                      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />} К подходящим
                                    </button>
                                  )}
                                  {!linked && (
                                    <button type="button" onClick={() => void linkTo(g, fits)} disabled={fits.length === 0 || Boolean(busyKey)} title={picked.length === 0 ? 'Выберите товары слева' : fits.length === 0 ? 'Среди выбранных нет товара с этим размером' : 'Привязать к выбранным с этим размером'} className="inline-flex !min-h-0 items-center gap-1 rounded-md bg-indigo-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-indigo-700 disabled:opacity-40">
                                      <Link2 className="h-3 w-3" /> {fits.length > 0 ? `К выбранным (${fits.length})` : 'К выбранным'}
                                    </button>
                                  )}
                                  {linked && (
                                    <button type="button" onClick={() => void unlink(g)} disabled={Boolean(busyKey)} className="inline-flex !min-h-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100 disabled:opacity-40">
                                      <Link2Off className="h-3 w-3" /> Отвязать
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        </>
                        ) : (
                        (() => {
                          const sel = new Set(selSizes[fam.key] || []);
                          const chosen = fam.groups.filter((g) => sel.has(g.size || ''));
                          const scope = chosen.length > 0 ? chosen : fam.groups;
                          const scopeOpen = scope.filter((g) => g.nmIds.length === 0);
                          const scopeLinked = scope.filter((g) => g.nmIds.length > 0);
                          const pickedFitScope = scopeOpen.filter((g) => picked.some((p) => fitsProduct(p, g.size))).length;
                          const hintFitScope = scopeOpen.filter((g) => (suggestions.get(g.key)?.products || []).length > 0).length;
                          const label = chosen.length > 0 ? `выбранные размеры (${chosen.length})` : 'все размеры';
                          return (
                            <>
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {fam.groups.map((g) => {
                                  const isLinked = g.nmIds.length > 0;
                                  const isSel = sel.has(g.size || '');
                                  return (
                                    <button
                                      key={g.key}
                                      type="button"
                                      onClick={() => toggleSize(fam.key, g.size || '')}
                                      aria-pressed={isSel}
                                      title={isLinked ? `Привязан: ${linkedLabel(g)}` : `${g.codes} шт без привязки`}
                                      className={`inline-flex !min-h-0 items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                                        isSel ? 'bg-indigo-600 text-white ring-1 ring-indigo-600'
                                          : isLinked ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300 hover:bg-emerald-200'
                                            : 'bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100'
                                      }`}
                                    >
                                      {g.size || '—'}
                                      <span className={`text-[10px] font-medium tabular-nums ${isSel ? 'text-indigo-100' : 'opacity-60'}`}>{g.codes}</span>
                                      {isLinked && <CheckCircle2 className="h-3 w-3" />}
                                    </button>
                                  );
                                })}
                                <button
                                  type="button"
                                  onClick={() => setSelSizes((prev) => ({ ...prev, [fam.key]: chosen.length === fam.groups.length ? [] : fam.groups.map((g) => g.size || '') }))}
                                  className="!min-h-0 rounded-md px-2 py-1 text-[11px] text-slate-500 underline hover:text-slate-700"
                                >
                                  {chosen.length === fam.groups.length ? 'снять выбор' : 'выбрать все'}
                                </button>
                              </div>
                              {(() => {
                                const seen = new Map<number, HsLinkProduct>();
                                scopeOpen.forEach((g) => (suggestions.get(g.key)?.products || []).forEach((p) => seen.set(p.nmId, p)));
                                const list = Array.from(seen.values());
                                if (list.length === 0) return null;
                                return (
                                  <div className="mt-2 rounded-lg bg-slate-50 p-2">
                                    <SuggestList title="Подходят по категории и цвету" products={list} pickedNmIds={pickedNmIds} onPick={pickProduct} />
                                  </div>
                                );
                              })()}
                              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                {scopeOpen.length > 0 && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => void linkFamilyBySize(scopeOpen, 'picked')}
                                      disabled={picked.length === 0 || pickedFitScope === 0 || Boolean(busyKey)}
                                      title={picked.length === 0 ? 'Выберите товары слева' : 'Каждый размер получит те из выбранных товаров, где такой размер есть'}
                                      className="inline-flex !min-h-0 items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
                                    >
                                      <Link2 className="h-3.5 w-3.5" /> К выбранным товарам{picked.length > 0 ? ` (${picked.length})` : ''}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void linkFamilyBySize(scopeOpen, 'hints')}
                                      disabled={hintFitScope === 0 || Boolean(busyKey)}
                                      title="Каждый размер — к товарам той же категории и цвета, где есть этот размер"
                                      className="inline-flex !min-h-0 items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-40"
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5" /> По цвету и размеру
                                    </button>
                                  </>
                                )}
                                {scopeLinked.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={async () => { for (const g of scopeLinked) await unlink(g); }}
                                    disabled={Boolean(busyKey)}
                                    className="inline-flex !min-h-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-100 disabled:opacity-40"
                                  >
                                    <Link2Off className="h-3.5 w-3.5" /> Отвязать
                                  </button>
                                )}
                                <span className="text-[11px] text-slate-400">действует на: {label}</span>
                              </div>
                            </>
                          );
                        })()
                        )}
                      </div>
                    );
                  })}
                  {plainFiles.map((g) => {
                    const linked = g.nmIds.length > 0;
                    const toThis = picked.length > 0 && picked.every((p) => g.nmIds.includes(p.nmId)) && g.nmIds.length === picked.length;
                    const fromTable = hsGroupFromTable(g);
                    const hint = suggestions.get(g.key);
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
                            {fromTable ? (
                              <div className="text-sm font-semibold text-slate-900">
                                {g.category} · <span className="capitalize">{g.color || 'цвет не указан'}</span>{g.size ? ` · ${g.size}` : ''}
                              </div>
                            ) : (
                              <div className="break-all text-sm font-semibold text-slate-900">{g.fileName}</div>
                            )}
                            {fromTable && (
                              <div className="mt-0.5 break-all text-[11px] text-slate-500">артикул поставщика {g.article} · файл «{g.fileName}»</div>
                            )}
                            <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px]">
                              {hsFileHasNoCategory(g)
                                ? <span className="rounded bg-sky-50 px-1.5 py-0.5 text-sky-700">ждёт привязки</span>
                                : !fromTable && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">{g.category}</span>}
                              {g.gender && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">{genderLabel(g.gender)}</span>}
                              {g.size && !fromTable && <span className="rounded bg-white px-1.5 py-0.5 font-medium text-slate-700 ring-1 ring-slate-200">размер {g.size}</span>}
                              <span className="rounded bg-indigo-50 px-1.5 py-0.5 font-medium tabular-nums text-indigo-700">{g.codes} шт</span>
                              <span className="text-slate-400">{new Date(g.firstAt).toLocaleDateString('ru-RU')}</span>
                            </div>
                            {!linked && hint && (
                              <div className="mt-1.5 text-xs text-slate-600">
                                <SuggestList title={hint.exact ? 'Артикул совпал' : 'Подходят по цвету и размеру'} products={hint.products} pickedNmIds={pickedNmIds} onPick={pickProduct} />
                              </div>
                            )}
                            {linked && (
                              <div className={`mt-1.5 flex items-center gap-1 text-xs ${toThis ? 'font-medium text-emerald-700' : 'text-slate-600'}`}>
                                <CheckCircle2 className="h-3.5 w-3.5" /> Привязан: {linkedLabel(g)}
                              </div>
                            )}
                          </div>
                          <div className="flex shrink-0 flex-col gap-1.5">
                            {!linked && hint && (
                              <button
                                type="button"
                                onClick={() => void linkTo(g, hint.products)}
                                disabled={Boolean(busyKey)}
                                title="Привязать к подсказанным товарам"
                                className="inline-flex !min-h-0 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-40"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> К подходящим
                              </button>
                            )}
                            {!toThis && (
                              <button
                                type="button"
                                onClick={() => void link(g)}
                                disabled={!(fromTable ? picked.length > 0 : canLink) || Boolean(busyKey)}
                                title={picked.length === 0 ? 'Сначала выберите товары слева' : sizeNeeded && !size && !fromTable ? 'Выберите размер' : linked ? 'Перепривязать к выбранным товарам' : 'Привязать к выбранным товарам'}
                                className="inline-flex !min-h-0 items-center justify-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
                              >
                                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
                                {linked ? 'Перепривязать' : picked.length > 1 ? `К выбранным (${picked.length})` : 'Привязать'}
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
                  })}
                  </>
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
