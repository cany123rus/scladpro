import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, Upload, Trash2, Package, Download, RefreshCw, ClipboardList, ScanLine, RotateCcw, FileDown, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { planPicking } from '../utils/boxPicking';
import { compareSizes } from '../utils/sizeOrder';
import { loadPhotoDataUrls } from '../utils/productPhotos';
import { buildStickersPdf, fetchStickers, type StickerImage } from '../utils/stickers';
import { ensureExcel, ensurePdfLibs, lazyLibs } from '../pages/dashboardLazyLibs';
import {
  encodeGsForExcel,
  normalizeDataMatrixText,
  restoreDataMatrixGs,
  stickerKey,
} from '../utils/honestSign';

/**
 * Поиск ФБС — где лежит товар из загруженной сюда поставки.
 *
 * Раздел намеренно НЕ смотрит в общий склад и в поставки FBO. Кладовщик грузит
 * сюда файл конкретной отсканированной поставки и ищет товар только по ней:
 * на складе одна и та же позиция лежит в десятке коробок разных поставок, и
 * ответ «коробка 43» из чужой поставки хуже, чем отсутствие ответа.
 *
 * Формат файла — тот, что отдаёт терминал сбора: «Штрих-код», «Кол-во»,
 * «Адрес» (адрес и есть коробка). Названия в нём пустые, поэтому подтягиваем
 * их из products по баркоду.
 */

/** Ключ хранения. Как и паллеты FBO, лежим снимком в app_settings. */
const STORE_KEY = 'fbs_search_supplies_v1';
const PICK_KEY = 'fbs_search_pickings_v1';
const SCAN_KEY = 'fbs_search_scans_v1';

/** Отсканированный ЧЗ: ключ — лист подбора и номер задания. */
interface ScanRecord {
  pickingId: string;
  task: string;
  sticker: string;
  code: string;
  at: string;
  by: string;
}

interface ScanRow {
  barcode: string;
  qty: number;
  box: string;
}

interface ScanSupply {
  id: string;
  name: string;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
  rows: ScanRow[];
}

/** Строка листа подбора WB: одно задание — одна единица товара. */
interface PickTask {
  task: string;
  barcode: string;
  name: string;
  size: string;
  color: string;
  article: string;
  sticker: string;
}

interface PickingList {
  id: string;
  name: string;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
  tasks: PickTask[];
}

interface ProductInfo {
  name: string;
  size: string;
  color: string;
  wbSku: string;
  /** Кабинет, которому принадлежит товар: по нему берём токен для стикеров. */
  supplierId: string;
}

/** Номенклатура WB (nmID) по баркоду — из кэша карточек. */
type NomenclatureMap = Record<string, number>;

const norm = (v: unknown) => String(v ?? '').trim();

/**
 * Сортировка коробок по возрастанию.
 *
 * Адреса вида WB_1553573331 отличаются только хвостом, и обычная строковая
 * сортировка ставит …9 после …10. Сравниваем по числу в конце, а при равенстве
 * — по строке, чтобы порядок не прыгал.
 */
const boxNumber = (box: string) => {
  const m = String(box).match(/(\d+)\s*$/);
  return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER;
};
const byBoxAsc = (a: string, b: string) => boxNumber(a) - boxNumber(b) || a.localeCompare(b, 'ru');

/**
 * Колонки терминала бывают в разном написании — ищем по смыслу.
 * Если файл поменяется, лучше увидеть «не нашли столбец», чем нули.
 */
const COLS = {
  barcode: ['штрих-код', 'штрихкод', 'штрих код', 'баркод', 'barcode'],
  qty: ['кол-во', 'количество', 'колво', 'qty'],
  box: ['адрес', 'коробка', 'короб', 'ячейка', 'место', 'ящик'],
};

/**
 * Столбцы, которые похожи на нужные, но ими не являются.
 *
 * «Коробок» — это счётчик коробок, а не адрес, и по подстроке «короб» он
 * подхватывался как адрес: у товара из семи коробок «адресом» становилась
 * семёрка. В листе подбора потом оказывалось, что в «коробке 1» лежит всё
 * подряд — потому что единица там означала «лежит в одной коробке».
 */
const NOT_A_BOX = ['коробок', 'коробки, шт', 'кол-во коробок', 'boxes'];

function pickColumn(headers: string[], variants: string[], exclude: string[] = []): string | null {
  const lower = headers.map((h) => h.toLowerCase().replace(/\s+/g, ' ').trim());
  const banned = (h: string) => exclude.some((e) => h.includes(e));

  for (const v of variants) {
    const i = lower.findIndex((h) => h === v && !banned(h));
    if (i >= 0) return headers[i]!;
  }
  for (const v of variants) {
    const i = lower.findIndex((h) => h.includes(v) && !banned(h));
    if (i >= 0) return headers[i]!;
  }
  return null;
}

/**
 * Похоже ли это на настоящие адреса коробок.
 *
 * Адрес с терминала выглядит как WB_1553573331 — буквы, подчёркивание, длинное
 * число. Если во всём столбце стоят короткие числа, это счётчик, а не адрес, и
 * лучше отказаться от загрузки, чем разложить лист по выдуманным коробкам.
 */
function looksLikeBoxCodes(values: readonly string[]): boolean {
  const seen = values.filter(Boolean);
  if (seen.length === 0) return false;
  return seen.some((v) => /[^\d]/.test(v) || v.length >= 6);
}

/**
 * Шапка листа подбора WB стоит не в первой строке: сверху дата, номер листа и
 * количество товаров. Ищем строку, где есть «№ задания» и «Баркод», — по ней и
 * читаем остальное. Привязываться к номеру строки нельзя: WB меняет верхушку.
 */
function findWbHeader(matrix: unknown[][]): { row: number; col: Record<string, number> } | null {
  for (let i = 0; i < Math.min(matrix.length, 20); i += 1) {
    const cells = (matrix[i] ?? []).map((c) => norm(c).toLowerCase());
    const has = (t: string) => cells.findIndex((c) => c.includes(t));
    const task = has('задани');
    const barcode = has('баркод');
    if (task < 0 || barcode < 0) continue;
    return {
      row: i,
      col: {
        task,
        barcode,
        name: has('наименован'),
        size: has('размер'),
        color: has('цвет'),
        article: has('артикул'),
        sticker: has('стикер'),
      },
    };
  }
  return null;
}

export function FbsSearch({
  currentEmployee,
  showToast,
}: {
  currentEmployee: any;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}) {
  const [supplies, setSupplies] = useState<ScanSupply[]>([]);
  const [pickings, setPickings] = useState<PickingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string | 'all'>('all');
  const [activePick, setActivePick] = useState<string | null>(null);
  const [mode, setMode] = useState<'stock' | 'picking'>('stock');
  const [products, setProducts] = useState<Record<string, ProductInfo>>({});
  const [nomenclature, setNomenclature] = useState<NomenclatureMap>({});
  const [photoByBarcode, setPhotoByBarcode] = useState<Record<string, string>>({});
  const [ownerByBarcode, setOwnerByBarcode] = useState<Record<string, string>>({});
  /*
   * Два входа вместо одного.
   *
   * Раньше тип файла определялся сам, и это работало, но кладовщик не видел,
   * что именно он грузит. Кнопки называют вещи своими именами; распознавание
   * осталось — оно ловит, если файл положили не в ту кнопку.
   */
  const stockRef = useRef<HTMLInputElement>(null);
  const pickRef = useRef<HTMLInputElement>(null);

  /*
   * Скан ЧЗ в два шага, как в разделе поставок FBS: сначала стикер — он
   * находит задание, потом код Честного знака. Наоборот нельзя: по ЧЗ не
   * понять, к какому именно заданию он относится, когда в листе десять
   * одинаковых товаров.
   */
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [scanOn, setScanOn] = useState(false);
  const [scanStep, setScanStep] = useState<'sticker' | 'code'>('sticker');
  const [pendingTask, setPendingTask] = useState<PickTask | null>(null);
  const [scanValue, setScanValue] = useState('');
  const [scanNote, setScanNote] = useState<{ kind: 'ok' | 'err' | 'info'; text: string } | null>(null);
  const scanRef = useRef<HTMLInputElement>(null);

  const readKey = async <T,>(key: string): Promise<T[]> => {
    const { data, error } = await supabase.from('app_settings').select('value').eq('key', key).maybeSingle();
    if (error) throw error;
    const raw = (data as any)?.value;
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p, sc] = await Promise.all([
        readKey<ScanSupply>(STORE_KEY),
        readKey<PickingList>(PICK_KEY),
        readKey<ScanRecord>(SCAN_KEY),
      ]);
      setSupplies(s);
      setPickings(p);
      setScans(sc);
      setActivePick((cur) => cur ?? p[0]?.id ?? null);
      // Загружен только лист подбора — открываем сразу его, а не пустой поиск.
      if (p.length > 0 && s.length === 0) setMode('picking');
    } catch (e: any) {
      showToast(`Не удалось загрузить: ${e?.message || e}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { void load(); }, [load]);

  const save = useCallback(async (next: ScanSupply[]) => {
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: STORE_KEY, value: next }, { onConflict: 'key' });
    if (error) throw new Error(error.message);
    setSupplies(next);
  }, []);

  const savePickings = useCallback(async (next: PickingList[]) => {
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: PICK_KEY, value: next }, { onConflict: 'key' });
    if (error) throw new Error(error.message);
    setPickings(next);
  }, []);

  /*
   * Названия товаров подтягиваем один раз на все загруженные поставки: в файле
   * терминала колонка «Наименование» пустая, а искать по названию удобнее, чем
   * по тринадцати цифрам.
   */
  useEffect(() => {
    /*
     * Баркоды берём и со складских сканов, и из листов подбора.
     *
     * Сначала брал только со сканов — и «Скачать стикеры» падало с «не понял,
     * какому кабинету принадлежат товары»: кабинет определяется по товару
     * листа, а товары листа в поиск не попадали вовсе.
     */
    const codes = [...new Set([
      ...supplies.flatMap((s) => s.rows.map((r) => r.barcode)),
      ...pickings.flatMap((p) => p.tasks.map((t) => t.barcode)),
    ])].filter(Boolean);
    const missing = codes.filter((c) => !products[c]);
    if (missing.length === 0) return;

    let cancelled = false;
    (async () => {
      const found: Record<string, ProductInfo> = {};
      for (let i = 0; i < missing.length; i += 200) {
        const { data } = await supabase
          .from('products')
          .select('barcode, name, size, color, wb_sku, supplier_id')
          // Удалённые товары не берём: у них может стоять чужой кабинет,
          // а по кабинету мы потом запрашиваем стикеры.
          .is('deleted_at', null)
          .in('barcode', missing.slice(i, i + 200));
        for (const p of (data ?? []) as any[]) {
          found[norm(p.barcode)] = {
            name: norm(p.name),
            size: norm(p.size),
            color: norm(p.color),
            wbSku: norm(p.wb_sku),
            supplierId: norm(p.supplier_id),
          };
        }
      }
      if (!cancelled && Object.keys(found).length > 0) {
        setProducts((prev) => ({ ...prev, ...found }));
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplies, pickings]);

  /*
   * Номенклатура (nmID) лежит только в кэше карточек WB, и связь с баркодом —
   * внутри product_json.sizes[].skus[]. Отфильтровать это запросом нельзя,
   * поэтому тянем кэш один раз и строим карту на клиенте — и только когда
   * открыт лист подбора, ради которого номенклатура и нужна.
   */
  useEffect(() => {
    if (mode !== 'picking' || pickings.length === 0) return;
    if (Object.keys(nomenclature).length > 0) return;

    let cancelled = false;
    (async () => {
      /*
       * Страницами по тысяче.
       *
       * PostgREST режет ответ на 1000 строк независимо от .limit() — молча.
       * Из-за этого в кэш попадала половина карточек (1000 из 2111), и у
       * половины товаров номенклатура оказывалась пустой. Читаем через
       * .range(), пока страница приходит полной.
       */
      const PAGE = 1000;
      const map: NomenclatureMap = {};
      const photos: Record<string, string> = {};
      // Кабинет по баркоду — запасной путь для стикеров, если товара нет в products.
      const owners: Record<string, string> = {};

      for (let from = 0; from < 50_000; from += PAGE) {
        const { data, error } = await supabase
          .from('wb_products_cache')
          .select('nm_id, supplier_id, product_json')
          .range(from, from + PAGE - 1);
        if (error || cancelled) return;

        const rows = (data ?? []) as any[];
        for (const row of rows) {
          const nmId = Number(row?.nm_id);
          if (!nmId) continue;
          const photo = row?.product_json?.photos?.[0];
          const url = norm(photo?.big || photo?.c516x688 || photo?.c246x328 || photo?.tm || photo?.small);
          const owner = norm(row?.supplier_id);
          for (const size of row?.product_json?.sizes ?? []) {
            for (const sku of size?.skus ?? []) {
              const code = norm(sku);
              if (!code) continue;
              map[code] = nmId;
              if (url) photos[code] = url;
              if (owner) owners[code] = owner;
            }
          }
        }

        if (rows.length < PAGE) break;
      }

      if (!cancelled) {
        setNomenclature(map);
        setPhotoByBarcode(photos);
        setOwnerByBarcode(owners);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, pickings.length]);

  /**
   * @param expected какую кнопку нажали. Тип файла всё равно определяем по
   *   содержимому — кнопка лишь говорит, чего ждали, чтобы предупредить, если
   *   склад положили в лист подбора и наоборот.
   */
  async function handleFiles(files: FileList | null, expected: 'stock' | 'picking') {
    const list = [...(files ?? [])].filter((f) => /\.xlsx?$/i.test(f.name));
    if (list.length === 0) return;

    setBusy(true);
    try {
      // Тяжёлая библиотека грузится только когда действительно грузят файл.
      const XLSX = await import('xlsx');
      const added: ScanSupply[] = [];
      const addedPicks: PickingList[] = [];

      for (const file of list) {
        const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
        const sheetName = wb.SheetNames[0];
        const sheet = sheetName ? wb.Sheets[sheetName] : null;
        if (!sheet) {
          showToast(`${file.name}: в файле нет листов`, 'error');
          continue;
        }

        const base = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name.replace(/\.xlsx?$/i, ''),
          fileName: file.name,
          uploadedAt: new Date().toISOString(),
          uploadedBy: norm(currentEmployee?.full_name) || 'Сотрудник',
        };

        /*
         * Тип файла определяем по содержимому, а не по имени: сотруднику не
         * нужно помнить, в какую кнопку класть какой файл. Лист подбора WB
         * узнаётся по строке с «№ задания» и «Баркод», файл терминала — по
         * «Штрих-код» и «Кол-во».
         */
        const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
        const wbHead = findWbHeader(matrix);

        if (wbHead) {
          if (expected === 'stock') {
            showToast(`${file.name} — это лист подбора, беру его как лист подбора`, 'info');
          }
          const tasks: PickTask[] = [];
          for (const row of matrix.slice(wbHead.row + 1)) {
            const at = (i: number) => (i >= 0 ? norm((row ?? [])[i]) : '');
            const barcode = at(wbHead.col.barcode);
            const task = at(wbHead.col.task);
            if (!barcode || !task) continue;
            tasks.push({
              task,
              barcode,
              name: at(wbHead.col.name),
              size: at(wbHead.col.size),
              color: at(wbHead.col.color),
              article: at(wbHead.col.article),
              sticker: at(wbHead.col.sticker),
            });
          }

          if (tasks.length === 0) {
            showToast(`${file.name}: лист подбора без заданий`, 'error');
            continue;
          }
          addedPicks.push({ ...base, tasks });
          continue;
        }

        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
        const headers = Object.keys(json[0] ?? {});
        const cBarcode = pickColumn(headers, COLS.barcode);
        const cQty = pickColumn(headers, COLS.qty);
        const cBox = pickColumn(headers, COLS.box, NOT_A_BOX);

        if (!cBarcode || !cQty) {
          showToast(`${file.name}: не похоже ни на данные склада, ни на лист подбора WB`, 'error');
          continue;
        }

        /*
         * Отказываемся, если «адреса» на адреса не похожи.
         *
         * Так в раздел попал мой же файл «итого по артикулам»: столбец
         * «Коробок» подхватился как адрес, и лист разложился по коробкам
         * 1…7, которых не существует. Молча принять такой файл хуже, чем
         * не принять вовсе.
         */
        if (cBox && !looksLikeBoxCodes(json.map((r) => norm(r[cBox])))) {
          showToast(
            `${file.name}: в столбце «${cBox}» не адреса коробок, а числа. Нужен файл терминала со столбцом «Адрес»`,
            'error',
          );
          continue;
        }
        if (!cBox) {
          showToast(`${file.name}: нет столбца с адресом коробки — искать будет негде`, 'error');
          continue;
        }
        if (expected === 'picking') {
          showToast(`${file.name} — это данные склада, беру их как склад`, 'info');
        }

        const rows: ScanRow[] = [];
        for (const r of json) {
          const barcode = norm(r[cBarcode]);
          const qty = Number(r[cQty]) || 0;
          if (!barcode || qty <= 0) continue;
          rows.push({ barcode, qty, box: cBox ? norm(r[cBox]) : '' });
        }

        if (rows.length === 0) {
          showToast(`${file.name}: не нашёл ни одной строки с товаром`, 'error');
          continue;
        }

        added.push({ ...base, rows });
      }

      if (added.length > 0) {
        await save([...added, ...supplies]);
        const units = added.reduce((a, s) => a + s.rows.reduce((x, r) => x + r.qty, 0), 0);
        showToast(`Поставок загружено: ${added.length}, штук: ${units}`, 'success');
      }
      if (addedPicks.length > 0) {
        const next = [...addedPicks, ...pickings];
        await savePickings(next);
        setActivePick(addedPicks[0]!.id);
        setMode('picking');
        const tasks = addedPicks.reduce((a, p) => a + p.tasks.length, 0);
        showToast(`Листов подбора: ${addedPicks.length}, заданий: ${tasks}`, 'success');
      }
    } catch (e: any) {
      showToast(`Не получилось прочитать файл: ${e?.message || e}`, 'error');
    } finally {
      setBusy(false);
      if (stockRef.current) stockRef.current.value = '';
      if (pickRef.current) pickRef.current.value = '';
    }
  }

  const saveScans = useCallback(async (next: ScanRecord[]) => {
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: SCAN_KEY, value: next }, { onConflict: 'key' });
    if (error) throw new Error(error.message);
    setScans(next);
  }, []);

  /** Сканы активного листа: задание → запись. */
  const scanByTask = useMemo(() => {
    const map = new Map<string, ScanRecord>();
    for (const s of scans) if (s.pickingId === activePick) map.set(s.task, s);
    return map;
  }, [scans, activePick]);

  /**
   * Обработка одного «выстрела» сканера.
   *
   * Сканер шлёт строку и Enter, поэтому вся логика висит на отправке формы:
   * никаких кнопок в процессе — руки заняты товаром.
   */
  async function handleScan(raw: string) {
    const value = raw.trim();
    if (!value) return;

    const list = pickings.find((p) => p.id === activePick);
    if (!list) {
      setScanNote({ kind: 'err', text: 'Сначала выберите лист подбора' });
      return;
    }

    if (scanStep === 'sticker') {
      const key = stickerKey(value);
      const found = list.tasks.find((t) => stickerKey(t.sticker) === key)
        // Часть сканеров отдаёт номер задания, а не стикер — принимаем и его.
        ?? list.tasks.find((t) => t.task === value);

      if (!found) {
        setScanNote({ kind: 'err', text: `Стикер ${value} в этом листе не найден` });
        setScanValue('');
        return;
      }

      const already = scanByTask.get(found.task);
      if (already) {
        setScanNote({
          kind: 'err',
          text: `Задание ${found.task} уже отсканировано (${new Date(already.at).toLocaleTimeString('ru-RU')}). Сбросьте, если нужно переснять.`,
        });
        setScanValue('');
        return;
      }

      setPendingTask(found);
      setScanStep('code');
      setScanValue('');
      setScanNote({ kind: 'info', text: `Задание ${found.task}: ${found.name || found.barcode}. Теперь сканируйте ЧЗ.` });
      return;
    }

    if (!pendingTask) {
      setScanStep('sticker');
      return;
    }

    const code = normalizeDataMatrixText(value);
    if (!code) {
      setScanNote({ kind: 'err', text: 'Пустой код ЧЗ' });
      return;
    }

    /*
     * Один и тот же ЧЗ на двух заданиях — это отгрузка одного кода дважды.
     * WB такой файл примет, а маркировка потом не сойдётся, поэтому ловим
     * здесь: по всем листам подбора этого раздела, а не только по текущему.
     */
    const dup = scans.find((s) => s.code === code);
    if (dup) {
      const where = pickings.find((p) => p.id === dup.pickingId)?.name ?? 'другой лист';
      setScanNote({ kind: 'err', text: `Этот ЧЗ уже отсканирован: задание ${dup.task}, ${where}. Скан отменён.` });
      setScanValue('');
      return;
    }

    try {
      await saveScans([
        ...scans,
        {
          pickingId: list.id,
          task: pendingTask.task,
          sticker: pendingTask.sticker,
          code,
          at: new Date().toISOString(),
          by: norm(currentEmployee?.full_name) || 'Сотрудник',
        },
      ]);
      setScanNote({ kind: 'ok', text: `ЧЗ принят для задания ${pendingTask.task}` });
    } catch (e: any) {
      setScanNote({ kind: 'err', text: `Не сохранилось: ${e?.message || e}` });
      return;
    } finally {
      setScanValue('');
    }

    setPendingTask(null);
    setScanStep('sticker');
  }

  async function resetScan(task: string) {
    try {
      await saveScans(scans.filter((s) => !(s.pickingId === activePick && s.task === task)));
      setScanNote({ kind: 'info', text: `Задание ${task} сброшено, можно сканировать заново` });
    } catch (e: any) {
      showToast(`Не удалось сбросить: ${e?.message || e}`, 'error');
    }
  }

  /**
   * Скан-файл для WB: № задания, стикер, КИЗ.
   *
   * Пишем через ExcelJS и с восстановленными GS-разделителями — как в разделе
   * поставок FBS. Библиотека xlsx для этого не годится: символ 29 в XML
   * недопустим, и файл уходит в WB без разделителей.
   */
  async function exportScanFile() {
    const list = pickings.find((p) => p.id === activePick);
    if (!list) return;

    const rows = list.tasks
      .map((t) => ({ task: t, scan: scanByTask.get(t.task) }))
      .filter((r) => r.scan);

    if (rows.length === 0) {
      showToast('Пока нечего выгружать: ни одного ЧЗ не отсканировано', 'error');
      return;
    }

    setBusy(true);
    try {
      await ensureExcel();
      const book = new lazyLibs.ExcelJS.Workbook();
      const ws = book.addWorksheet('Scan');
      ws.addRow(['№ задания', 'Стикер', 'КИЗ']);
      for (const r of rows) {
        ws.addRow([r.task.task, r.task.sticker, encodeGsForExcel(restoreDataMatrixGs(r.scan!.code))]);
      }
      ws.columns = [{ width: 16 }, { width: 18 }, { width: 90 }];

      const buffer = await book.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `scan-file-${list.name}.xlsx`;
      a.click();
      URL.revokeObjectURL(a.href);
      showToast(`Скан-файл: ${rows.length} строк`, 'success');
    } catch (e: any) {
      showToast(`Не удалось собрать файл: ${e?.message || e}`, 'error');
    } finally {
      setBusy(false);
    }
  }

  /**
   * Лист подбора в PDF — с ним ходят по складу.
   *
   * Строки идут по коробкам от старших номеров к младшим, а не в порядке
   * файла WB: сборщик обходит стеллаж один раз, а не мечется между коробками.
   * Шрифт Roboto подгружаем так же, как остальные отчёты приложения, —
   * встроенные шрифты jsPDF кириллицу не умеют.
   */
  async function exportPickingPdf() {
    const list = pickings.find((p) => p.id === activePick);
    if (!list || !picking) return;

    setBusy(true);
    try {
      // Через общий ленивый загрузчик: свой import() положил бы jsPDF во второй чанк.
      await ensurePdfLibs();
      const { jsPDF: JsPDF, autoTable } = lazyLibs;

      const doc = new JsPDF({ orientation: 'landscape' });
      try {
        const res = await fetch('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf');
        const buf = await res.arrayBuffer();
        let binary = '';
        const bytes = new Uint8Array(buf);
        for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
        doc.addFileToVFS('Roboto-Regular.ttf', btoa(binary));
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
        doc.setFont('Roboto', 'normal');
      } catch {
        // Без сети останемся на встроенном шрифте: латиница и цифры читаются.
      }

      /*
       * Порядок обхода: коробка → артикул → размер.
       *
       * Внутри коробки все штуки одного артикула должны идти подряд, а размеры
       * — по возрастанию: сборщик берёт пачку одинаковых, а не ищет один и тот
       * же товар в трёх местах листа. Ненайденные позиции уходят в конец.
       */
      const rows = [...picking.rows].sort((a, b) => {
        const boxA = a.plan.from[0]?.box ?? '';
        const boxB = b.plan.from[0]?.box ?? '';
        if (boxA !== boxB) {
          if (!boxA) return 1;
          if (!boxB) return -1;
          return byBoxAsc(boxA, boxB);
        }

        const artA = a.task.article || a.task.name || '';
        const artB = b.task.article || b.task.name || '';
        if (artA !== artB) return artA.localeCompare(artB, 'ru');

        return compareSizes(a.task.size, b.task.size);
      });

      // Фото — по одному на артикул, поэтому качаем уникальные и переиспользуем.
      const photoUrls = [...new Set(rows.map((r) => photoByBarcode[r.task.barcode]).filter(Boolean))];
      const photoData = photoUrls.length > 0 ? await loadPhotoDataUrls(photoUrls) : new Map<string, string>();

      const body = rows.map((r) => [
        // При нескольких поставках подписываем, из какой коробка: коды адресов
        // у разных поставок совпадают, и без подписи их не различить.
        r.plan.from
          .map((f) => (scope.length > 1 && f.place ? `${f.box} (${f.place})` : f.box))
          .join(', ') || 'нет в поставке',
        photoData.get(photoByBarcode[r.task.barcode] ?? '') ?? '',
        String(nomenclature[r.task.barcode] ?? ''),
        r.task.name || '',
        r.task.size || '',
        r.task.color || '',
        r.task.article || '',
        r.task.barcode,
        r.task.task,
        r.task.sticker || '',
        scanByTask.get(r.task.task) ? 'да' : '',
      ]);

      doc.setFontSize(14);
      doc.text(`Лист подбора — ${list.name}`, 14, 14);
      doc.setFontSize(9);
      doc.text(
        `Дата: ${new Date().toLocaleDateString('ru-RU')} · заданий ${picking.plan.totalNeed}`
          + ` · нашлось ${picking.plan.totalPicked}`
          + (picking.plan.totalMissing ? ` · нет в поставке ${picking.plan.totalMissing}` : '')
          + ` · коробок ${picking.boxesAsc.length}`,
        14,
        20,
      );
      doc.text(
        `Склад: ${activeId === 'all' ? 'все загруженные поставки' : (supplies.find((s) => s.id === activeId)?.name ?? '')}`,
        14,
        25,
      );

      (autoTable as any)(doc, {
        startY: 30,
        head: [['Коробка', 'Фото', 'Номенкл.', 'Наименование', 'Размер', 'Цвет', 'Артикул', 'Баркод', '№ задания', 'Стикер', 'ЧЗ']],
        body,
        /*
         * Roboto во ВСЕХ колонках.
         *
         * Раньше цифровые поля печатались встроенным helvetica «для ровности»,
         * и любой не-латинский символ в них превращался в кашу — так побился
         * текст у бейсболки. Кириллицы во встроенных шрифтах jsPDF нет вовсе.
         */
        styles: { fontSize: 8, cellPadding: 1.6, valign: 'middle', font: 'Roboto' },
        headStyles: { font: 'Roboto', fontStyle: 'normal', fillColor: [79, 70, 229] },
        bodyStyles: { font: 'Roboto', fontStyle: 'normal' },
        rowPageBreak: 'avoid',
        columnStyles: {
          0: { cellWidth: 30, fontStyle: 'bold' },
          1: { cellWidth: 22, minCellHeight: 28 },
          2: { cellWidth: 20 },
          3: { cellWidth: 62 },
          4: { cellWidth: 16, halign: 'center' },
          5: { cellWidth: 18, halign: 'center' },
          6: { cellWidth: 28 },
          7: { cellWidth: 25 },
          8: { cellWidth: 22 },
          9: { cellWidth: 22 },
          10: { cellWidth: 10, halign: 'center' },
        },
        didParseCell: (data: any) => {
          // В ячейке фото лежит data-URL: как текст его печатать нельзя.
          if (data.column.index === 1 && data.section === 'body') data.cell.text = [];
          if (data.section === 'body' && data.column.index === 0 && String(data.cell.raw) === 'нет в поставке') {
            data.cell.styles.textColor = [190, 30, 60];
          }
        },
        didDrawCell: (data: any) => {
          if (data.column.index !== 1 || data.cell.section !== 'body') return;
          const img = data.cell.raw;
          if (!img) return;
          try {
            doc.addImage(img, 'JPEG', data.cell.x + 1.5, data.cell.y + 1.5, 19, 25);
          } catch {
            // Одна не вставшая картинка не должна ронять весь лист.
          }
        },
      });

      doc.save(`Лист подбора ${list.name}.pdf`);
      showToast('PDF готов', 'success');
    } catch (e: any) {
      showToast(`Не удалось собрать PDF: ${e?.message || e}`, 'error');
    } finally {
      setBusy(false);
    }
  }

  /**
   * Стикеры заданий — одним PDF, в порядке листа подбора.
   *
   * Порядок здесь и есть смысл кнопки: стопка стикеров должна лежать так же,
   * как собран лист, иначе сборщик берёт товар из одной коробки, а клеит
   * стикер от другой. Поэтому идём по тем же отсортированным строкам, что
   * уходят в PDF листа, а не по порядку из файла WB.
   */
  async function exportStickers() {
    if (!picking) return;

    const ordered = picking.rows
      .map((r) => ({ id: Number(r.task.task), task: r.task }))
      .filter((r) => Number.isFinite(r.id) && r.id > 0);

    if (ordered.length === 0) {
      showToast('В листе нет номеров заданий', 'error');
      return;
    }

    /*
     * Кабинет определяем по товарам листа: раздел не привязан к поставщику, а
     * токен нужен именно его. Если в листе товары разных кабинетов — честно
     * говорим об этом, потому что одним токеном их стикеры не получить.
     */
    const ownerOf = (barcode: string) => products[barcode]?.supplierId || ownerByBarcode[barcode] || '';
    const supplierIds = [...new Set(picking.list.tasks.map((t) => ownerOf(t.barcode)).filter(Boolean))];

    if (supplierIds.length === 0) {
      const unknown = picking.list.tasks.filter((t) => !ownerOf(t.barcode)).length;
      showToast(
        `Не нашёл кабинет ни для одного товара (${unknown} шт). Баркодов нет ни в товарах, ни в кэше карточек WB`,
        'error',
      );
      return;
    }
    if (supplierIds.length > 1) {
      showToast(`В листе товары ${supplierIds.length} кабинетов — стикеры одним файлом не собрать`, 'error');
      return;
    }

    setBusy(true);
    try {
      const { data: supplier, error } = await supabase
        .from('suppliers')
        .select('name, wb_api_token')
        .eq('id', supplierIds[0])
        .maybeSingle();
      if (error) throw new Error(error.message);

      const token = norm((supplier as any)?.wb_api_token);
      if (!token) throw new Error(`У кабинета «${norm((supplier as any)?.name) || '—'}» нет токена WB`);

      showToast(`Запрашиваем ${ordered.length} стикеров у WB…`, 'info');
      const byId = await fetchStickers(token, ordered.map((o) => o.id));

      const found = ordered.map((o) => byId.get(o.id)).filter(Boolean) as StickerImage[];
      if (found.length === 0) throw new Error('WB не вернул ни одного стикера');

      // ensurePdfLibs ничего не возвращает: библиотеки берутся из lazyLibs после await.
      await ensurePdfLibs();
      const pdf = await buildStickersPdf(lazyLibs.jsPDF, found);
      pdf.save(`Стикеры — ${picking.list.name}.pdf`);

      const missing = ordered.length - found.length;
      showToast(
        missing > 0
          ? `Стикеров ${found.length} из ${ordered.length}, не нашлось ${missing}`
          : `Стикеров: ${found.length}, порядок как в листе подбора`,
        missing > 0 ? 'info' : 'success',
      );
    } catch (e: any) {
      showToast(`Стикеры не скачались: ${e?.message || e}`, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function removePicking(id: string) {
    setBusy(true);
    try {
      const next = pickings.filter((p) => p.id !== id);
      await savePickings(next);
      // Сканы уходят вместе с листом: иначе они живут вечно и мешают дедупу.
      const keptScans = scans.filter((s) => s.pickingId !== id);
      if (keptScans.length !== scans.length) await saveScans(keptScans);
      if (activePick === id) setActivePick(next[0]?.id ?? null);
      showToast('Лист подбора убран', 'success');
    } catch (e: any) {
      showToast(`Не удалось убрать: ${e?.message || e}`, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function removeSupply(id: string) {
    setBusy(true);
    try {
      await save(supplies.filter((s) => s.id !== id));
      if (activeId === id) setActiveId('all');
      showToast('Поставка убрана', 'success');
    } catch (e: any) {
      showToast(`Не удалось убрать: ${e?.message || e}`, 'error');
    } finally {
      setBusy(false);
    }
  }

  /** Поставки, по которым ищем: одна выбранная или все загруженные. */
  const scope = useMemo(
    () => (activeId === 'all' ? supplies : supplies.filter((s) => s.id === activeId)),
    [supplies, activeId],
  );

  /** Свод: баркод → сколько всего и по каким коробкам. */
  const index = useMemo(() => {
    const map = new Map<string, { total: number; boxes: Map<string, number>; supplies: Set<string> }>();
    for (const s of scope) {
      for (const r of s.rows) {
        const cur = map.get(r.barcode) ?? { total: 0, boxes: new Map<string, number>(), supplies: new Set<string>() };
        cur.total += r.qty;
        const box = r.box || '—';
        cur.boxes.set(box, (cur.boxes.get(box) ?? 0) + r.qty);
        cur.supplies.add(s.name);
        map.set(r.barcode, cur);
      }
    }
    return map;
  }, [scope]);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    const all = [...index].map(([barcode, v]) => ({
      barcode,
      total: v.total,
      // Коробки — по убыванию номера: так их и обходят на складе.
      boxes: [...v.boxes].sort((a, b) => byBoxAsc(a[0], b[0])),
      supplies: [...v.supplies],
      info: products[barcode],
    }));

    const filtered = !term
      ? all
      : all.filter((x) =>
          x.barcode.toLowerCase().includes(term)
          || (x.info?.name ?? '').toLowerCase().includes(term)
          || (x.info?.wbSku ?? '').toLowerCase().includes(term)
          || (x.info?.size ?? '').toLowerCase().includes(term)
          || x.boxes.some(([box]) => box.toLowerCase().includes(term)),
        );

    return filtered.sort((a, b) => b.total - a.total);
  }, [index, query, products]);

  /**
   * Раскладка листа подбора по коробкам загруженной поставки.
   *
   * Считает planPicking: вскрываем как можно меньше коробок. Одно задание —
   * одна штука, поэтому строк столько же, сколько заданий, и порядок сохраняем
   * — сборщик идёт по листу сверху вниз.
   */
  const picking = useMemo(() => {
    const list = pickings.find((p) => p.id === activePick);
    if (!list) return null;

    /*
     * Коробка опознаётся парой «поставка + адрес», а не одним адресом.
     *
     * Раньше ключом был только адрес, и при выборе «Все поставки» коробки с
     * одинаковым кодом из разных поставок сливались в одну: в такой склейке
     * оказывались баркоды, которых в реальной коробке нет. Поставку тащим в
     * place — planPicking носит её до самого ответа.
     */
    const content = new Map<string, { supply: string; box: string; items: Map<string, number> }>();
    for (const s of scope) {
      for (const r of s.rows) {
        const box = r.box || '—';
        const key = `${s.id}|${box}`;
        const cur = content.get(key) ?? { supply: s.name, box, items: new Map<string, number>() };
        cur.items.set(r.barcode, (cur.items.get(r.barcode) ?? 0) + r.qty);
        content.set(key, cur);
      }
    }

    const rawPlan = planPicking(
      [...content].map(([key, v]) => ({
        box: key,
        place: v.supply,
        items: [...v.items].map(([barcode, qty]) => ({ barcode, qty })),
      })),
      list.tasks.map((t) => ({ barcode: t.barcode, qty: 1, name: t.name, article: t.article })),
    );

    /*
     * Ключи обратно в человеческие адреса: сборщику нужен код с наклейки, а не
     * «идентификатор поставки + адрес». Поставка остаётся в place и попадает в
     * подпись, когда загружено больше одной.
     */
    const label = (key: string) => content.get(key)?.box ?? key;
    const plan = {
      ...rawPlan,
      lines: rawPlan.lines.map((l) => ({ ...l, from: l.from.map((f) => ({ ...f, box: label(f.box) })) })),
      boxes: rawPlan.boxes.map((b) => ({ ...b, box: label(b.box) })),
    };

    /*
     * На экране тот же порядок, что и в PDF: коробка → артикул → размер.
     * Иначе сборщик, сверяясь с листом, каждый раз ищет строку заново.
     */
    const rows = list.tasks
      .map((t, i) => ({ task: t, plan: plan.lines[i]! }))
      .sort((a, b) => {
        const boxA = a.plan.from[0]?.box ?? '';
        const boxB = b.plan.from[0]?.box ?? '';
        if (boxA !== boxB) {
          if (!boxA) return 1;
          if (!boxB) return -1;
          return byBoxAsc(boxA, boxB);
        }
        const artA = a.task.article || a.task.name || '';
        const artB = b.task.article || b.task.name || '';
        if (artA !== artB) return artA.localeCompare(artB, 'ru');
        return compareSizes(a.task.size, b.task.size);
      });
    // Коробки к вскрытию — по убыванию номера, в том же порядке их и обходят.
    const boxesAsc = [...plan.boxes].sort((a, b) => byBoxAsc(a.box, b.box));
    return { list, plan, rows, boxesAsc };
  }, [pickings, activePick, scope]);

  const totals = useMemo(() => {
    const units = [...index.values()].reduce((a, v) => a + v.total, 0);
    const boxes = new Set<string>();
    for (const s of scope) for (const r of s.rows) if (r.box) boxes.add(`${s.id}|${r.box}`);
    return { articles: index.size, units, boxes: boxes.size };
  }, [index, scope]);

  /** Выгрузка итогов по артикулам — то же, что видно на экране. */
  async function exportSummary(mode: 'full' | 'stock') {
    setBusy(true);
    try {
      const XLSX = await import('xlsx');
      const rows = results.map((r) =>
        mode === 'stock'
          ? { 'Баркод': r.barcode, 'Количество': r.total }
          : {
              'Штрих-код': r.barcode,
              'Кол-во': r.total,
              // Заголовки нарочно не похожи на «Адрес»: этот файл не должен
              // приниматься за скан терминала, если его загрузят обратно.
              'Коробок, шт': r.boxes.length,
              'Где лежит': r.boxes.map(([b, q]) => `${b} ×${q}`).join(', '),
              'Наименование': r.info?.name ?? '',
              'Размер': r.info?.size ?? '',
              'Цвет': r.info?.color ?? '',
              'Артикул WB': r.info?.wbSku ?? '',
            },
      );
      const sheet = XLSX.utils.json_to_sheet(rows);
      sheet['!cols'] = mode === 'stock'
        ? [{ wch: 16 }, { wch: 12 }]
        : [{ wch: 16 }, { wch: 8 }, { wch: 9 }, { wch: 40 }, { wch: 50 }, { wch: 10 }, { wch: 14 }, { wch: 12 }];
      const book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(book, sheet, mode === 'stock' ? 'Остатки' : 'Итого по артикулам');
      const name = activeId === 'all' ? 'все поставки' : (supplies.find((s) => s.id === activeId)?.name ?? 'поставка');
      XLSX.writeFile(book, mode === 'stock' ? `Остатки ФБС — ${name}.xlsx` : `Итого по артикулам — ${name}.xlsx`);
      showToast('Файл сформирован', 'success');
    } catch (e: any) {
      showToast(`Не удалось выгрузить: ${e?.message || e}`, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-full mx-auto px-4 pb-10">
      <div className="oc-card p-5 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[220px]">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Поиск ФБС</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Ищет только по поставкам, загруженным сюда. Общий склад и поставки FBO не участвуют.
            </p>
          </div>

          <input
            ref={stockRef}
            type="file"
            accept=".xlsx,.xls"
            multiple
            className="hidden"
            onChange={(e) => void handleFiles(e.target.files, 'stock')}
          />
          <input
            ref={pickRef}
            type="file"
            accept=".xlsx,.xls"
            multiple
            className="hidden"
            onChange={(e) => void handleFiles(e.target.files, 'picking')}
          />
          <button type="button" className="btn-ghost" onClick={() => void load()} disabled={busy || loading}>
            <RefreshCw className="w-4 h-4" /> Обновить
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => stockRef.current?.click()}
            disabled={busy}
            title="Файл терминала: что и в какой коробке лежит на складе"
          >
            <Package className="w-4 h-4" /> {busy ? 'Читаем…' : 'Данные со склада'}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => pickRef.current?.click()}
            disabled={busy}
            title="Файл WB со сборочными заданиями"
          >
            <ClipboardList className="w-4 h-4" /> Лист подбора
          </button>
        </div>
      </div>

      {loading ? (
        <div className="oc-card p-8 text-center text-slate-500">Загружаем…</div>
      ) : supplies.length === 0 && pickings.length === 0 ? (
        <div className="oc-card p-10 text-center">
          <Package className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <div className="font-medium text-slate-700 dark:text-slate-200">Пока пусто</div>
          <p className="text-sm text-slate-500 mt-1">
            «Данные со склада» — файл терминала со столбцами «Штрих-код», «Кол-во», «Адрес»
            (адрес и есть коробка).
            <br />
            «Лист подбора» — файл WB со сборочными заданиями.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={() => setActiveId('all')}
              className={`px-3 py-1.5 rounded-xl text-sm transition-colors ${
                activeId === 'all'
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Все поставки ({supplies.length})
            </button>
            {supplies.map((s) => (
              <div key={s.id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => setActiveId(s.id)}
                  title={`${s.fileName} · загрузил ${s.uploadedBy} · ${new Date(s.uploadedAt).toLocaleString('ru-RU')}`}
                  className={`px-3 py-1.5 rounded-l-xl text-sm transition-colors ${
                    activeId === s.id
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {s.name}
                  <span className="opacity-70 ml-1.5">{s.rows.reduce((a, r) => a + r.qty, 0)} шт</span>
                </button>
                <button
                  type="button"
                  onClick={() => void removeSupply(s.id)}
                  disabled={busy}
                  title="Убрать поставку из поиска"
                  className="px-2 py-1.5 rounded-r-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Переключатель появляется, только когда есть что показывать. */}
          {pickings.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => setMode('stock')}
                className={`px-3 py-1.5 rounded-xl text-sm transition-colors ${
                  mode === 'stock' ? 'bg-slate-900 text-white font-medium dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                }`}
              >
                <Package className="w-4 h-4 inline mr-1.5 -mt-0.5" /> Что в поставке
              </button>
              <button
                type="button"
                onClick={() => setMode('picking')}
                className={`px-3 py-1.5 rounded-xl text-sm transition-colors ${
                  mode === 'picking' ? 'bg-slate-900 text-white font-medium dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                }`}
              >
                <ClipboardList className="w-4 h-4 inline mr-1.5 -mt-0.5" /> Лист подбора
              </button>

              {mode === 'picking' ? (
                <div className="flex flex-wrap gap-1.5 ml-2">
                  {pickings.map((p) => (
                    <div key={p.id} className="flex items-center">
                      <button
                        type="button"
                        onClick={() => setActivePick(p.id)}
                        title={`${p.fileName} · загрузил ${p.uploadedBy} · ${new Date(p.uploadedAt).toLocaleString('ru-RU')}`}
                        className={`px-2.5 py-1 rounded-l-lg text-xs transition-colors ${
                          activePick === p.id ? 'bg-indigo-600 text-white font-medium' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                        }`}
                      >
                        {p.name} <span className="opacity-70">{p.tasks.length}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void removePicking(p.id)}
                        disabled={busy}
                        title="Убрать лист подбора"
                        className="px-1.5 py-1 rounded-r-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {mode === 'picking' && picking ? (
            <>
              <div className="oc-card p-4 mb-4 text-sm">
                <div className="flex flex-wrap gap-x-5 gap-y-1">
                  <span>
                    заданий <b className="text-slate-800 dark:text-slate-100">{picking.plan.totalNeed}</b>
                  </span>
                  <span>
                    нашлось <b className="text-emerald-600">{picking.plan.totalPicked}</b>
                  </span>
                  {picking.plan.totalMissing > 0 ? (
                    <span>
                      нет в поставке <b className="text-rose-600">{picking.plan.totalMissing}</b>
                    </span>
                  ) : null}
                  <span>
                    вскрыть коробок <b className="text-slate-800 dark:text-slate-100">{picking.plan.boxes.length}</b>
                    {picking.plan.boxes.length > 0 ? (
                      <span className="text-slate-500"> — {picking.boxesAsc.map((b) => b.box).join(', ')}</span>
                    ) : null}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5">
                  Коробки подобраны так, чтобы вскрыть их как можно меньше. Ищем только по{' '}
                  {activeId === 'all' ? 'всем загруженным поставкам' : 'выбранной поставке'}.
                </p>

                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-sm">
                    ЧЗ отсканировано{' '}
                    <b className={scanByTask.size === picking.list.tasks.length ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-100'}>
                      {scanByTask.size}
                    </b>
                    <span className="text-slate-500"> из {picking.list.tasks.length}</span>
                  </span>
                  <button
                    type="button"
                    className={scanOn ? 'btn-danger' : 'btn-primary'}
                    onClick={() => {
                      const next = !scanOn;
                      setScanOn(next);
                      setScanStep('sticker');
                      setPendingTask(null);
                      setScanValue('');
                      setScanNote(next ? { kind: 'info', text: 'Сканируйте стикер задания' } : null);
                      if (next) setTimeout(() => scanRef.current?.focus(), 50);
                    }}
                  >
                    <ScanLine className="w-4 h-4" /> {scanOn ? 'Закончить скан' : 'Скан ЧЗ'}
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => void exportPickingPdf()} disabled={busy}>
                    <FileDown className="w-4 h-4" /> Скачать PDF
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => void exportStickers()}
                    disabled={busy}
                    title="Стикеры заданий одним PDF, в том же порядке, что и лист подбора"
                  >
                    <Tag className="w-4 h-4" /> Скачать стикеры
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => void exportScanFile()} disabled={busy || scanByTask.size === 0}>
                    <Download className="w-4 h-4" /> Скан-файл для WB
                  </button>
                </div>

                {scanOn ? (
                  <div className="mt-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3">
                    <div className="text-sm font-semibold mb-1.5">
                      {scanStep === 'sticker' ? 'Шаг 1. Сканируйте стикер' : `Шаг 2. Сканируйте ЧЗ — задание ${pendingTask?.task}`}
                    </div>
                    <form
                      onSubmit={(e) => { e.preventDefault(); void handleScan(scanValue); }}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <input
                        ref={scanRef}
                        className="oc-input flex-1 min-w-[260px] font-mono"
                        value={scanValue}
                        onChange={(e) => setScanValue(e.target.value)}
                        placeholder={scanStep === 'sticker' ? 'Стикер или № задания' : 'Код Честного знака'}
                        autoFocus
                      />
                      <button type="submit" className="btn-primary">
                        {scanStep === 'sticker' ? 'Найти задание' : 'Сохранить ЧЗ'}
                      </button>
                      {scanStep === 'code' ? (
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => {
                            setPendingTask(null);
                            setScanStep('sticker');
                            setScanValue('');
                            setScanNote({ kind: 'info', text: 'Отменено, сканируйте стикер' });
                          }}
                        >
                          <RotateCcw className="w-4 h-4" /> Отмена
                        </button>
                      ) : null}
                    </form>
                    {scanNote ? (
                      <div
                        className={`mt-2 text-sm ${
                          scanNote.kind === 'ok' ? 'text-emerald-600' : scanNote.kind === 'err' ? 'text-rose-600' : 'text-slate-500'
                        }`}
                      >
                        {scanNote.text}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="oc-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500">
                      <tr>
                        <th className="p-3 text-left font-medium w-24">Фото</th>
                        <th className="p-3 text-left font-medium w-28">№ задания</th>
                        <th className="p-3 text-left font-medium">Товар</th>
                        <th className="p-3 text-left font-medium w-28">Номенклатура</th>
                        <th className="p-3 text-left font-medium w-32">Стикер</th>
                        <th className="p-3 text-left font-medium w-40">Коробка</th>
                        <th className="p-3 text-left font-medium w-44">ЧЗ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {picking.rows.map(({ task, plan }, i) => (
                        <tr key={`${task.task}-${i}`} className="border-t border-slate-100 dark:border-slate-800">
                          <td className="p-2">
                            {photoByBarcode[task.barcode] ? (
                              <a
                                href={nomenclature[task.barcode]
                                  ? `https://www.wildberries.ru/catalog/${nomenclature[task.barcode]}/detail.aspx`
                                  : photoByBarcode[task.barcode]}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <img
                                  src={photoByBarcode[task.barcode]}
                                  alt=""
                                  loading="lazy"
                                  className="h-24 w-[72px] rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                                />
                              </a>
                            ) : (
                              <div className="h-24 w-[72px] rounded-lg bg-slate-100 dark:bg-slate-800" />
                            )}
                          </td>
                          <td className="p-3 font-mono text-xs">{task.task}</td>
                          <td className="p-3">
                            <div className="font-medium text-slate-800 dark:text-slate-100">{task.name || '—'}</div>
                            <div className="text-xs text-slate-500 mt-0.5 font-mono">
                              {task.barcode}
                              {task.size ? ` · ${task.size}` : ''}
                              {task.color ? ` · ${task.color}` : ''}
                              {task.article ? ` · ${task.article}` : ''}
                            </div>
                          </td>
                          <td className="p-3 font-mono text-xs">
                            {nomenclature[task.barcode] ? (
                              <a
                                href={`https://www.wildberries.ru/catalog/${nomenclature[task.barcode]}/detail.aspx`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-600 hover:underline"
                              >
                                {nomenclature[task.barcode]}
                              </a>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-xs text-slate-500">{task.sticker || '—'}</td>
                          <td className="p-3">
                            {plan.from.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {plan.from.map((f, k) => (
                                  <span
                                    key={`${f.box}-${k}`}
                                    className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold"
                                  >
                                    {f.box}
                                    {scope.length > 1 && f.place ? (
                                      <span className="ml-1 font-normal opacity-70">· {f.place}</span>
                                    ) : null}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs">
                                нет в поставке
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            {(() => {
                              const scan = scanByTask.get(task.task);
                              if (!scan) return <span className="text-xs text-slate-400">не отсканирован</span>;
                              return (
                                <div className="flex items-center gap-2">
                                  <span
                                    className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-mono"
                                    title={scan.code}
                                  >
                                    …{scan.code.slice(-8)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => void resetScan(task.task)}
                                    title={`Сбросить ЧЗ · ${scan.by}, ${new Date(scan.at).toLocaleString('ru-RU')}`}
                                    className="text-slate-400 hover:text-rose-600"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : mode === 'picking' ? (
            <div className="oc-card p-10 text-center text-slate-500">
              Выберите лист подбора или загрузите файл WB
            </div>
          ) : (
          <>
          <div className="oc-card p-4 mb-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="oc-input pl-9 w-full"
                  placeholder="Баркод, название, размер, артикул WB или номер коробки"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="text-sm text-slate-500">
                артикулов <span className="font-semibold text-slate-700 dark:text-slate-200">{totals.articles}</span>
                {' · '}штук <span className="font-semibold text-slate-700 dark:text-slate-200">{totals.units}</span>
                {' · '}коробок <span className="font-semibold text-slate-700 dark:text-slate-200">{totals.boxes}</span>
              </div>
              <button type="button" className="btn-ghost" onClick={() => void exportSummary('full')} disabled={busy}>
                <Download className="w-4 h-4" /> Итоги по артикулам
              </button>
              <button type="button" className="btn-ghost" onClick={() => void exportSummary('stock')} disabled={busy}>
                <Download className="w-4 h-4" /> Остатки для ФБС
              </button>
            </div>
          </div>

          <div className="oc-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500">
                  <tr>
                    <th className="p-3 text-left font-medium">Товар</th>
                    <th className="p-3 text-right font-medium w-20">Всего</th>
                    <th className="p-3 text-left font-medium">Коробки</th>
                  </tr>
                </thead>
                <tbody>
                  {results.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-slate-500">
                        {query ? 'Ничего не нашлось в загруженных поставках' : 'Пусто'}
                      </td>
                    </tr>
                  ) : (
                    results.slice(0, 300).map((r) => (
                      <tr key={r.barcode} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="p-3">
                          <div className="font-medium text-slate-800 dark:text-slate-100">
                            {r.info?.name || 'Название не найдено'}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 font-mono">
                            {r.barcode}
                            {r.info?.size ? ` · ${r.info.size}` : ''}
                            {r.info?.color ? ` · ${r.info.color}` : ''}
                            {activeId === 'all' && r.supplies.length > 0 ? ` · ${r.supplies.join(', ')}` : ''}
                          </div>
                        </td>
                        <td className="p-3 text-right font-semibold tabular-nums">{r.total}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1.5">
                            {r.boxes.map(([box, qty]) => (
                              <span
                                key={box}
                                className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs"
                              >
                                {box} <span className="opacity-70">×{qty}</span>
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {results.length > 300 ? (
              <div className="p-3 text-center text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800">
                Показаны первые 300 из {results.length} — уточните поиск
              </div>
            ) : null}
          </div>
          </>
          )}
        </>
      )}
    </div>
  );
}

export default FbsSearch;
