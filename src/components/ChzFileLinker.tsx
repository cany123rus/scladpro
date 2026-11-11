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
/** Товар в таблице ЧЗ: файл + цвет + артикул без номера размера («дубленка_жен_3» → «дубленка_жен»). */
const famKeyOf = (g: HsFileGroup) => [g.fileName, fold(g.color || ''), fold(g.article || '').replace(/[_\-\s]*\d+$/, '')].join('|');

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
  // Показывать уже привязанные группы (обычно скрыты): чтобы проверить, отвязать или перепривязать.
  const [showLinked, setShowLinked] = useState(false);
  // Галочки у привязанных групп в панели «Уже привязано»: отвязываем только отмеченные.
  const [unlinkSel, setUnlinkSel] = useState<Set<string>>(() => new Set());
  // «Подходящие уже привязанные»: группы, привязанные к другим товарам, но подходящие выбранному — к ним можно добавить ещё товар.
  const [showSuitable, setShowSuitable] = useState(false);
  // Уже привязанные группы можно брать и не по размеру (нужного размера в файлах нет).
  const [anySize, setAnySize] = useState(false);
  const [addSel, setAddSel] = useState<Set<string>>(() => new Set());
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
  // Привязанные размеры того же товара остаются в карточке (зелёными), пока в нём есть хоть один свободный:
  // иначе кажется, что размер пропал.
  const workingGroups = useMemo(() => {
    const pendingFamilies = new Set(groups.filter((g) => hsGroupFromTable(g) && g.nmIds.length === 0).map(famKeyOf));
    return groups.filter((g) => ((hsFileHasNoCategory(g) || hsGroupFromTable(g))
      && (g.nmIds.length === 0 || (hsGroupFromTable(g) && (showLinked || pendingFamilies.has(famKeyOf(g))))))
      || sessionSids.has(sidOf(g)));
  }, [groups, sessionSids, showLinked]);

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

  // Привязка к товару другой категории (файл «куртка», товар «костюм») по умолчанию запрещена:
  // чужая марка уедет с товаром молча. Галочка разрешает, но каждый раз спрашивает подтверждение.
  const [allowMismatch, setAllowMismatch] = useState(false);
  const categoryFits = useCallback((g: HsFileGroup, p: HsLinkProduct): boolean => {
    if (hsFileHasNoCategory(g) || !p.subject) return true;
    return matchesCategory(g, p.subject);
  }, [matchesCategory]);

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
      if (!hsGroupFromTable(g)) return;
      const article = fold(g.article || '');
      // Товары только той же категории: «куртка» подсказывает куртки, бомберы и дублёнки, но не костюмы.
      const sameCategory = (p: HsLinkProduct) => allowMismatch || categoryFits(g, p);
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
  }, [workingGroups, products, categoryFits, allowMismatch]);

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
  type LinkPlan = { items: Array<[HsFileGroup, HsLinkProduct[]]>; note?: string; /** Добавить товары к уже привязанным, а не заменить их. */ append?: boolean; /** Ключи групп, у которых снимаем размер: коды станут подходить любому размеру товара. */ dropSize?: Set<string> };
  // Окно «что к чему привяжется»: любая привязка сначала показывает его и ждёт подтверждения.
  const [plan, setPlan] = useState<LinkPlan | null>(null);
  // В окне подтверждения: заменить прежние привязки группы вместо того, чтобы дописать новый товар.
  const [planReplace, setPlanReplace] = useState(false);

  const mismatchOf = (items: LinkPlan['items']): string[] => {
    const bad = new Set<string>();
    items.forEach(([g, ts]) => ts.forEach((p) => {
      if (!categoryFits(g, p)) bad.add(`файл «${g.category}${g.color ? ` · ${g.color}` : ''}» → товар ${p.vendorCode || p.nmId} (${p.subject})`);
    }));
    return Array.from(bad);
  };

  /** Показать окно подтверждения. Товары чужой категории — только при включённой галочке. */
  const askPlan = (items: LinkPlan['items'], note?: string, append?: boolean, dropSize?: Set<string>) => {
    if (items.length === 0 || busyKey) return;
    const bad = mismatchOf(items);
    if (bad.length > 0 && !allowMismatch) {
      setNotice({ tone: 'err', text: `Категория не подходит: ${bad.slice(0, 3).join('; ')}${bad.length > 3 ? ` и ещё ${bad.length - 3}` : ''}. Чтобы всё равно привязать, включите «Разрешить неподходящие категории».` });
      return;
    }
    setNotice(null);
    setPlanReplace(false);
    setPlan({ items, note, append, dropSize });
  };

  /** Привязать одну группу к товарам (через окно подтверждения). */
  const linkTo = (g: HsFileGroup, targets: HsLinkProduct[]) => {
    if (targets.length === 0) {
      setNotice({ tone: 'err', text: 'Нет товара для привязки: выберите товар слева. Если на нём отмечены размеры, отметьте нужный размер или снимите отметки.' });
      return;
    }
    askPlan([[g, targets]]);
  };

  /** Подтверждено: выполняем привязку по плану. */
  const runPlan = async () => {
    if (!plan || busyKey) return;
    const { items, note, append, dropSize } = plan;
    setPlan(null);
    let done = 0;
    for (const [g, targets] of items) {
      // Группа уже привязана к другим товарам — по умолчанию они сохраняются, новый товар дописывается.
      const keepOld = Boolean(append) || (!planReplace && g.nmIds.length > 0);
      if (await doLink(g, targets, items.length > 1, keepOld, Boolean(dropSize?.has(g.key)))) done += 1;
    }
    if (items.length > 1) {
      setNotice({ tone: done === items.length ? 'ok' : 'err', text: `Привязано: ${done} из ${items.length}.${note ? ` ${note}` : ''}` });
    }
    // Выбор не переносим на следующий файл: иначе следующая привязка молча уйдёт на те же товары.
    if (done > 0) { setPicked([]); setSizeSel({}); }
  };

  const doLink = async (g: HsFileGroup, targets: HsLinkProduct[], silent = false, append = false, dropSize = false): Promise<boolean> => {
    if (targets.length === 0 || busyKey) return false;
    setBusyKey(g.key);
    if (!silent) setNotice(null);
    try {
      const fromTable = hsGroupFromTable(g);
      const nextSize = dropSize ? null : (fromTable ? g.size : (sizeNeeded ? size : null));
      const category = categoryOfProduct(targets[0]);
      // «Добавить»: прежние товары группы остаются, к ним дописываются новые.
      const nmIds = append ? Array.from(new Set([...g.nmIds, ...targets.map((t) => t.nmId)])) : targets.map((t) => t.nmId);
      const updated = await linkHsFile(supplierId, g, nmIds, nextSize, category);
      if (updated === 0) throw new Error('файл уже изменён — обновляю список');
      setSessionSids((prev) => new Set(prev).add(sidOf(g)));
      patchGroup(g.key, {
        nmIds,
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

  const link = (g: HsFileGroup) => {
    if (!hsGroupFromTable(g) && sizeNeeded && !size) {
      setNotice({ tone: 'err', text: 'Выберите размер справа («Артикул + размер») или переключите на «Весь артикул».' });
      return;
    }
    linkTo(g, picked);
  };

  // Группы, где подсказка однозначна: артикул совпал или подошёл ровно один товар.
  const confidentGroups = useMemo(
    () => visibleFiles.filter((g) => {
      const s = suggestions.get(g.key);
      return g.nmIds.length === 0 && Boolean(s) && (s!.exact || s!.products.length === 1);
    }),
    [visibleFiles, suggestions],
  );

  const linkConfident = () => {
    if (busyKey || confidentGroups.length === 0) return;
    const items = confidentGroups.flatMap((g): LinkPlan['items'] => {
      const sg = suggestions.get(g.key);
      return sg ? [[g, sg.products]] : [];
    });
    askPlan(items);
  };

  // Группы из таблицы ЧЗ собираем по товару: «Куртка · Чёрный» — одна карточка, внутри неё размеры.
  const families = useMemo(() => {
    const map = new Map<string, { key: string; fileName: string; category: string; color: string; gender: string | null; groups: HsFileGroup[] }>();
    visibleFiles.filter(hsGroupFromTable).forEach((g) => {
      const key = famKeyOf(g);
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
    map.forEach((fam) => {
      fam.groups.sort((a, b) => rank(a.size) - rank(b.size));
      // Название категории — из свободной группы: у уже привязанных оно могло замениться категорией товара.
      const open = fam.groups.find((g) => g.nmIds.length === 0 && g.category);
      if (open?.category) fam.category = open.category;
    });
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
   * Товары для привязки группы вручную. Сначала те из выбранных, у которых есть этот размер.
   * Если ни у одного нет (размеры карточки записаны иначе, например числами), привязка всё равно возможна:
   * берём выбранные товары без отметок размера, а окно подтверждения покажет, что размера в карточке нет.
   * Товар с отмеченными размерами, среди которых этого нет, исключён намеренно.
   */
  const targetsForPicked = (g: HsFileGroup): HsLinkProduct[] => {
    const fit = picked.filter((p) => fitsProduct(p, g.size));
    if (fit.length > 0) return fit;
    return picked.filter((p) => !(sizeSel[p.nmId]?.length));
  };

  /**
   * Привязка по размерам: каждый размер получает только те из выбранных (или подсказанных) товаров,
   * у которых этот размер есть. Размер, которому ничего не подошло, остаётся без привязки.
   */
  const linkFamilyBySize = (groups: HsFileGroup[], source: 'picked' | 'hints') => {
    if (busyKey) return;
    setNotice(null);
    const skipped: string[] = [];
    const items: LinkPlan['items'] = [];
    for (const g of groups) {
      const pool = source === 'picked' ? picked : (suggestions.get(g.key)?.products || []);
      const targets = source === 'picked' ? targetsForPicked(g) : pool.filter((p) => hasSize(p, g.size));
      if (targets.length === 0) { skipped.push(g.size || '—'); continue; }
      items.push([g, targets]);
    }
    if (items.length === 0) {
      const marked = picked.filter((p) => sizeSel[p.nmId]?.length);
      setNotice({
        tone: 'err',
        text: source === 'picked' && marked.length > 0
          ? `На выбранных товарах отмечены размеры (${marked.map((p) => `${p.vendorCode || p.nmId}: ${sizeSel[p.nmId].join(', ')}`).join('; ')}), а для размера ${skipped.join(', ') || 'группы'} отметки нет. Отметьте нужный размер на товаре или снимите отметки.`
          : `Не нашлось подходящего товара${skipped.length ? ` для размера ${skipped.join(', ')}` : ''}.`,
      });
      return;
    }
    askPlan(items, skipped.length ? `Без привязки останутся размеры: ${skipped.join(', ')}.` : undefined);
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

  // Файлы, уже привязанные к выбранным товарам: видно, что к ним привязано, и можно отвязать.
  const linkedToPicked = useMemo(
    () => (picked.length === 0 ? [] : groups.filter((g) => g.nmIds.some((id) => pickedNmIds.has(id)))),
    [groups, picked.length, pickedNmIds],
  );

  const colorMatches = (g: HsFileGroup, p: HsLinkProduct) => {
    const gc = fold(g.color || '');
    const pc = fold(p.color);
    return !gc || !pc || pc === gc || pc.includes(gc) || gc.includes(pc);
  };

  // Уже привязанные к другим товарам группы, подходящие выбранным: та же категория, цвет и размер.
  const suitableLinked = useMemo(() => {
    if (!showSuitable || picked.length === 0) return [];
    // Цвет — мягкий признак: в карточке он бывает указан неверно («белый», а по факту чёрный).
    // Такие группы не прячем, а ставим ниже и помечаем.
    return groups.filter((g) => g.nmIds.length > 0
      && !picked.every((p) => g.nmIds.includes(p.nmId))
      && picked.some((p) => categoryFits(g, p) && (anySize || fitsProduct(p, g.size))))
      .sort((a, b) => Number(picked.some((p) => colorMatches(b, p))) - Number(picked.some((p) => colorMatches(a, p))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSuitable, anySize, groups, picked, sizeSel, categoryFits]);

  const toggleAddSel = (key: string) => setAddSel((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  /** Дописать выбранные товары к уже привязанным группам (через окно подтверждения). */
  const addToLinked = (groupsToAdd: HsFileGroup[]) => {
    const items: LinkPlan['items'] = [];
    const dropSize = new Set<string>();
    groupsToAdd.forEach((g) => {
      const targets = picked.filter((p) => categoryFits(g, p) && (anySize || fitsProduct(p, g.size)) && !g.nmIds.includes(p.nmId));
      if (targets.length > 0) {
        items.push([g, targets]);
        // Размер группы не совпал с размером товара — снимаем размер: коды подойдут любому размеру товара.
        if (anySize && g.size && targets.some((p) => !fitsProduct(p, g.size))) dropSize.add(g.key);
      }
    });
    if (items.length === 0) { setNotice({ tone: 'err', text: 'Нечего добавлять: выбранные товары уже привязаны или не подходят.' }); return; }
    setAddSel(new Set());
    askPlan(items, undefined, true, dropSize.size > 0 ? dropSize : undefined);
  };

  /** Отвязать группу от выбранных товаров. Привязки к другим товарам остаются; если других нет — файл снова ждёт привязки. */
  const unlinkFromPicked = async (g: HsFileGroup, silent = false): Promise<boolean> => {
    if (busyKey) return false;
    setBusyKey(g.key);
    if (!silent) setNotice(null);
    try {
      const remaining = g.nmIds.filter((id) => !pickedNmIds.has(id));
      const updated = remaining.length === 0
        ? await unlinkHsFile(supplierId, g)
        : await linkHsFile(supplierId, g, remaining, g.size);
      if (updated === 0) throw new Error('файл уже изменён — обновляю список');
      setSessionSids((prev) => new Set(prev).add(sidOf(g)));
      patchGroup(g.key, { nmIds: remaining });
      if (!silent) {
        setNotice({ tone: 'ok', text: remaining.length === 0 ? `Файл отвязан и снова ждёт привязки (${updated} шт)` : `Отвязано от выбранных, остальные привязки сохранены (${updated} шт)` });
      }
      onChanged?.();
      return true;
    } catch (e: any) {
      setNotice({ tone: 'err', text: `Не удалось отвязать: ${e?.message || 'ошибка'}` });
      void reloadGroups();
      return false;
    } finally {
      setBusyKey('');
    }
  };

  const unlinkChecked = async () => {
    const todo = linkedToPicked.filter((g) => unlinkSel.has(g.key));
    if (busyKey || todo.length === 0) return;
    if (!window.confirm(`Отвязать отмеченные группы (${todo.length}) от выбранных товаров? Файлы снова появятся в списке для привязки.`)) return;
    let done = 0;
    for (const g of [...todo]) {
      if (await unlinkFromPicked(g, true)) done += 1;
    }
    setUnlinkSel(new Set());
    setNotice({ tone: done === todo.length ? 'ok' : 'err', text: `Отвязано групп: ${done} из ${todo.length}. Файлы снова ждут привязки.` });
  };

  const toggleUnlinkSel = (key: string) => setUnlinkSel((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

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
                    <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-slate-600" title="Показать группы, уже привязанные к другим товарам, но подходящие выбранному: к ним можно добавить ещё один товар">
                      <input
                        type="checkbox"
                        checked={showSuitable}
                        onChange={(e) => setShowSuitable(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                      />
                      Показать уже привязанные, подходящие к выбранному (привязать и к нему)
                    </label>
                    {showSuitable && (
                      <div className="rounded-xl bg-white p-2.5 ring-1 ring-slate-200">
                        <label className="mb-2 flex cursor-pointer select-none items-center gap-2 text-xs text-slate-600" title="Если нужного размера в файлах нет, можно взять уже привязанные коды другого размера">
                          <input type="checkbox" checked={anySize} onChange={(e) => setAnySize(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-amber-600" />
                          Использовать не по размеру (показать уже привязанные любых размеров)
                        </label>
                        {suitableLinked.length === 0 ? (
                          <p className="text-xs text-slate-500">Подходящих групп, привязанных к другим товарам, нет.</p>
                        ) : (
                          <>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <label className="flex cursor-pointer select-none items-center gap-2 text-xs font-semibold text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={suitableLinked.every((g) => addSel.has(g.key))}
                                  onChange={(e) => setAddSel(e.target.checked ? new Set(suitableLinked.map((g) => g.key)) : new Set())}
                                  className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                                  aria-label="Отметить все подходящие группы"
                                />
                                Подходят: {suitableLinked.length} гр., {suitableLinked.reduce((n, g) => n + g.codes, 0)} шт
                              </label>
                              <button
                                type="button"
                                onClick={() => addToLinked(suitableLinked.filter((g) => addSel.has(g.key)))}
                                disabled={Boolean(busyKey) || !suitableLinked.some((g) => addSel.has(g.key))}
                                className="inline-flex !min-h-0 items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
                              >
                                <Link2 className="h-3 w-3" /> Добавить к выбранным товарам ({suitableLinked.filter((g) => addSel.has(g.key)).length})
                              </button>
                            </div>
                            <div className="mt-1.5 max-h-52 space-y-1 overflow-y-auto">
                              {suitableLinked.map((g) => (
                                <div key={g.key} className={`flex items-center gap-2 rounded-lg px-2 py-1 text-xs ${addSel.has(g.key) ? 'bg-indigo-50' : 'bg-slate-50'}`}>
                                  <input
                                    type="checkbox"
                                    checked={addSel.has(g.key)}
                                    onChange={() => toggleAddSel(g.key)}
                                    className="h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600"
                                    aria-label="Отметить для добавления"
                                  />
                                  <span className="min-w-0 flex-1">
                                    <span className="block break-all font-medium text-slate-800">файл «{g.fileName}»</span>
                                    <span className="block text-[11px] text-slate-600">
                                      {[
                                        g.article ? `арт. ${g.article}` : null,
                                        g.color ? g.color : null,
                                        g.size ? `размер ${g.size}` : null,
                                        g.gender ? genderLabel(g.gender) : null,
                                        g.category ? `категория: ${g.category}` : null,
                                      ].filter(Boolean).join(' · ')}
                                    </span>
                                    <span className="block text-[11px] text-emerald-700">уже привязан: {linkedLabel(g)}</span>
                                    {!picked.some((p) => colorMatches(g, p)) && (
                                      <span className="block text-[11px] text-amber-700">цвет файла «{g.color}» не совпадает с цветом в карточке: {picked.map((p) => p.color || '—').join(', ')}</span>
                                    )}
                                  </span>
                                  <span className="shrink-0 tabular-nums text-indigo-700">{g.codes} шт</span>
                                  <button
                                    type="button"
                                    onClick={() => addToLinked([g])}
                                    disabled={Boolean(busyKey)}
                                    className="inline-flex !min-h-0 shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-indigo-700 ring-1 ring-indigo-200 hover:bg-white disabled:opacity-40"
                                  >
                                    <Link2 className="h-3 w-3" /> Добавить
                                  </button>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    {linkedToPicked.length > 0 && (
                      <div className="rounded-xl bg-white p-2.5 ring-1 ring-slate-200">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="flex cursor-pointer select-none items-center gap-2 text-xs font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={linkedToPicked.length > 0 && linkedToPicked.every((g) => unlinkSel.has(g.key))}
                              onChange={(e) => setUnlinkSel(e.target.checked ? new Set(linkedToPicked.map((g) => g.key)) : new Set())}
                              className="h-4 w-4 rounded border-slate-300 text-rose-600"
                              aria-label="Отметить все привязанные группы"
                            />
                            Уже привязано к выбранным: {linkedToPicked.length} гр., {linkedToPicked.reduce((n, g) => n + g.codes, 0)} шт
                          </label>
                          <button
                            type="button"
                            onClick={() => void unlinkChecked()}
                            disabled={Boolean(busyKey) || !linkedToPicked.some((g) => unlinkSel.has(g.key))}
                            className="inline-flex !min-h-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-rose-700 ring-1 ring-rose-200 transition-colors hover:bg-rose-50 disabled:opacity-40"
                          >
                            <Link2Off className="h-3 w-3" /> Отвязать выбранные ({linkedToPicked.filter((g) => unlinkSel.has(g.key)).length})
                          </button>
                        </div>
                        <div className="mt-1.5 max-h-52 space-y-1 overflow-y-auto">
                          {linkedToPicked.map((g) => (
                            <div key={g.key} className={`flex items-center gap-2 rounded-lg px-2 py-1 text-xs ${unlinkSel.has(g.key) ? 'bg-rose-50' : 'bg-slate-50'}`}>
                              <input
                                type="checkbox"
                                checked={unlinkSel.has(g.key)}
                                onChange={() => toggleUnlinkSel(g.key)}
                                className="h-4 w-4 shrink-0 rounded border-slate-300 text-rose-600"
                                aria-label="Отметить для отвязки"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block break-all font-medium text-slate-800">файл «{g.fileName}»</span>
                                <span className="block text-[11px] text-slate-600">
                                  {[
                                    g.article ? `арт. ${g.article}` : null,
                                    g.color ? g.color : null,
                                    g.size ? `размер ${g.size}` : null,
                                    g.gender ? genderLabel(g.gender) : null,
                                    g.category ? `категория: ${g.category}` : null,
                                  ].filter(Boolean).join(' · ')}
                                </span>
                                <span className="block text-[11px] text-emerald-700">→ {linkedLabel(g)}</span>
                              </span>
                              <span className="shrink-0 tabular-nums text-indigo-700">{g.codes} шт</span>
                              <button
                                type="button"
                                onClick={() => void unlinkFromPicked(g)}
                                disabled={Boolean(busyKey)}
                                className="inline-flex !min-h-0 shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-white disabled:opacity-40"
                              >
                                <Link2Off className="h-3 w-3" /> Отвязать
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
                <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-slate-600" title="Показать группы, которые уже привязаны к товарам, чтобы проверить их, отвязать или привязать заново">
                  <input
                    type="checkbox"
                    checked={showLinked}
                    onChange={(e) => setShowLinked(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                  />
                  Показать уже привязанные (проверить, отвязать, привязать заново)
                </label>
                <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-slate-600" title="Подсказки и привязка будут показывать товары любых категорий; перед привязкой — вопрос">
                  <input
                    type="checkbox"
                    checked={allowMismatch}
                    onChange={(e) => setAllowMismatch(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-amber-600"
                  />
                  Разрешить неподходящие категории (с подтверждением)
                </label>
                {confidentGroups.length > 0 && (
                  <button
                    type="button"
                    onClick={() => linkConfident()}
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
                    const pickedFit = open.filter((g) => targetsForPicked(g).length > 0).length;
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
                              onClick={() => linkFamilyBySize(open, 'picked')}
                              disabled={picked.length === 0 || Boolean(busyKey)}
                              title={picked.length === 0 ? 'Выберите товары слева' : 'Каждый размер получит те из выбранных товаров, где такой размер есть'}
                              className="inline-flex !min-h-0 items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
                            >
                              <Link2 className="h-3.5 w-3.5" /> Привязать по размерам к выбранным{picked.length > 0 ? ` (${picked.length})` : ''}
                            </button>
                            <button
                              type="button"
                              onClick={() => linkFamilyBySize(open, 'hints')}
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
                            const fits = targetsForPicked(g);
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
                                    <button type="button" onClick={() => linkTo(g, hint.products.filter((p) => hasSize(p, g.size)).length > 0 ? hint.products.filter((p) => hasSize(p, g.size)) : hint.products)} disabled={Boolean(busyKey)} className="inline-flex !min-h-0 items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-emerald-700 disabled:opacity-40">
                                      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />} К подходящим
                                    </button>
                                  )}
                                  {!linked && (
                                    <button type="button" onClick={() => linkTo(g, fits)} disabled={picked.length === 0 || Boolean(busyKey)} title={picked.length === 0 ? 'Выберите товары слева' : 'Привязать к выбранным товарам (откроется окно проверки)'} className="inline-flex !min-h-0 items-center gap-1 rounded-md bg-indigo-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-indigo-700 disabled:opacity-40">
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
                          // Выбраны размеры вручную — действуем именно на них (в том числе перепривязываем); иначе — только на свободные.
                          const actionGroups = chosen.length > 0 ? chosen : scopeOpen;
                          const pickedFitScope = actionGroups.filter((g) => targetsForPicked(g).length > 0).length;
                          const hintFitScope = actionGroups.filter((g) => (suggestions.get(g.key)?.products || []).length > 0).length;
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
                                actionGroups.forEach((g) => (suggestions.get(g.key)?.products || []).forEach((p) => seen.set(p.nmId, p)));
                                const list = Array.from(seen.values());
                                if (list.length === 0) return null;
                                return (
                                  <div className="mt-2 rounded-lg bg-slate-50 p-2">
                                    <SuggestList title="Подходят по категории и цвету" products={list} pickedNmIds={pickedNmIds} onPick={pickProduct} />
                                  </div>
                                );
                              })()}
                              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                {actionGroups.length > 0 && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => linkFamilyBySize(actionGroups, 'picked')}
                                      disabled={picked.length === 0 || Boolean(busyKey)}
                                      title={picked.length === 0 ? 'Выберите товары слева' : 'Каждый размер получит те из выбранных товаров, где такой размер есть'}
                                      className="inline-flex !min-h-0 items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
                                    >
                                      <Link2 className="h-3.5 w-3.5" /> К выбранным товарам{picked.length > 0 ? ` (${picked.length})` : ''}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => linkFamilyBySize(actionGroups, 'hints')}
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
                                onClick={() => linkTo(g, hint.products)}
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
                                onClick={() => link(g)}
                                disabled={picked.length === 0 || Boolean(busyKey)}
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
          <span className="text-xs text-slate-500">Привязка применяется после подтверждения. Привязанные коды печатаются только на свой товар. Файлы, уже разнесённые по базе, здесь не показываются.</span>
          <button onClick={onClose} className="shrink-0 whitespace-nowrap rounded-xl bg-slate-100 px-5 py-2.5 font-medium text-slate-700 transition-colors hover:bg-slate-200">Готово</button>
        </div>
      </div>

      {plan && (() => {
        const bad = mismatchOf(plan.items);
        const totalCodes = plan.items.reduce((n, [g]) => n + g.codes, 0);
        const productIds = new Set<number>();
        plan.items.forEach(([, ts]) => ts.forEach((p) => productIds.add(p.nmId)));
        return (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 p-3" onClick={(e) => { e.stopPropagation(); setPlan(null); }}>
            <div
              className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Подтверждение привязки"
            >
              <div className="shrink-0 border-b border-slate-100 px-5 py-4">
                <h4 className="text-lg font-bold text-slate-900">Проверьте, что к чему привяжется</h4>
                <p className="mt-0.5 text-sm text-slate-500">
                  Групп: {plan.items.length} · кодов: {totalCodes} · товаров: {productIds.size}
                </p>
              </div>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-3">
                {bad.length > 0 && (
                  <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
                    <b>Категории не совпадают.</b> Марка чужой категории уедет с товаром: проверьте красные строки.
                  </div>
                )}
                {!plan.append && plan.items.some(([g]) => g.nmIds.length > 0) && (
                  <label className="flex cursor-pointer select-none items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={planReplace}
                      onChange={(e) => setPlanReplace(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-rose-600"
                    />
                    <span>
                      <b>Заменить прежние привязки.</b> Сейчас часть групп уже привязана к другим товарам: по умолчанию они сохраняются, а выбранные товары добавляются. Поставьте галочку, чтобы отвязать их от прежних товаров.
                    </span>
                  </label>
                )}
                {plan.items.map(([g, targets]) => {
                  const fromTable = hsGroupFromTable(g);
                  const adding = Boolean(plan.append) || (!planReplace && g.nmIds.length > 0);
                  const dropped = Boolean(plan.dropSize?.has(g.key));
                  const sizeText = dropped ? 'любой (размер снимается)' : fromTable ? (g.size || 'любой размер') : (sizeNeeded ? (size || '—') : 'все размеры');
                  const rowBad = targets.some((p) => !categoryFits(g, p));
                  return (
                    <div key={g.key} className={`rounded-lg border p-2.5 ${rowBad ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'}`}>
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="text-sm font-semibold text-slate-900">
                          {fromTable ? `${g.category} · ${g.color || 'цвет не указан'}` : g.fileName}
                        </span>
                        <span className="rounded bg-white px-1.5 py-0.5 text-xs font-bold text-slate-900 ring-1 ring-slate-300">размер {sizeText}</span>
                        <span className="text-xs font-medium tabular-nums text-indigo-700">{g.codes} шт</span>
                      </div>
                      {g.nmIds.length > 0 && (
                        <div className={`mt-1 text-[11px] ${adding ? 'text-slate-500' : 'text-rose-700'}`}>
                          Уже привязан: {linkedLabel(g)} — {adding ? 'сохранится, добавятся новые:' : 'будет заменён на:'}
                        </div>
                      )}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1 text-xs">
                        <span className="text-slate-500">{adding && g.nmIds.length > 0 ? '+' : '→'}</span>
                        {targets.map((p) => {
                          const fits = categoryFits(g, p);
                          return (
                            <span
                              key={p.nmId}
                              className={`rounded px-1.5 py-0.5 font-medium ring-1 ${!fits ? 'bg-rose-100 text-rose-800 ring-rose-300' : (hasSize(p, g.size) && colorMatches(g, p)) ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : 'bg-amber-50 text-amber-800 ring-amber-300'}`}
                              title={p.title}
                            >
                              {p.vendorCode || p.nmId} · {sizeText}{fits ? '' : ` · ${p.subject}`}{dropped || hasSize(p, g.size) ? '' : ' · размера нет в карточке'}{colorMatches(g, p) ? '' : ` · цвет в карточке: ${p.color}`}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {plan.note && <p className="text-xs text-slate-500">{plan.note}</p>}
              </div>
              <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 px-5 py-3">
                <button type="button" onClick={() => setPlan(null)} className="rounded-xl bg-slate-100 px-5 py-2.5 font-medium text-slate-700 transition-colors hover:bg-slate-200">Отмена</button>
                <button
                  type="button"
                  onClick={() => void runPlan()}
                  className={`rounded-xl px-5 py-2.5 font-medium text-white transition-colors ${bad.length > 0 ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                  {bad.length > 0 ? 'Всё равно привязать' : 'Привязать'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
