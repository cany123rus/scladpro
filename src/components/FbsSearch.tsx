import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, Upload, Trash2, Package, Download, RefreshCw, ClipboardList, ScanLine, RotateCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { planPicking } from '../utils/boxPicking';
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
}

const norm = (v: unknown) => String(v ?? '').trim();

/**
 * Колонки терминала бывают в разном написании — ищем по смыслу.
 * Если файл поменяется, лучше увидеть «не нашли столбец», чем нули.
 */
const COLS = {
  barcode: ['штрих-код', 'штрихкод', 'штрих код', 'баркод', 'barcode'],
  qty: ['кол-во', 'количество', 'колво', 'qty'],
  box: ['адрес', 'коробка', 'короб', 'ячейка', 'место'],
};

function pickColumn(headers: string[], variants: string[]): string | null {
  const lower = headers.map((h) => h.toLowerCase().replace(/\s+/g, ' ').trim());
  for (const v of variants) {
    const i = lower.findIndex((h) => h === v);
    if (i >= 0) return headers[i]!;
  }
  for (const v of variants) {
    const i = lower.findIndex((h) => h.includes(v));
    if (i >= 0) return headers[i]!;
  }
  return null;
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
  const fileRef = useRef<HTMLInputElement>(null);

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
    const codes = [...new Set(supplies.flatMap((s) => s.rows.map((r) => r.barcode)))];
    const missing = codes.filter((c) => !products[c]);
    if (missing.length === 0) return;

    let cancelled = false;
    (async () => {
      const found: Record<string, ProductInfo> = {};
      for (let i = 0; i < missing.length; i += 200) {
        const { data } = await supabase
          .from('products')
          .select('barcode, name, size, color, wb_sku')
          .in('barcode', missing.slice(i, i + 200));
        for (const p of (data ?? []) as any[]) {
          found[norm(p.barcode)] = {
            name: norm(p.name),
            size: norm(p.size),
            color: norm(p.color),
            wbSku: norm(p.wb_sku),
          };
        }
      }
      if (!cancelled && Object.keys(found).length > 0) {
        setProducts((prev) => ({ ...prev, ...found }));
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplies]);

  async function handleFiles(files: FileList | null) {
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
        const cBox = pickColumn(headers, COLS.box);

        if (!cBarcode || !cQty) {
          showToast(`${file.name}: не похоже ни на скан поставки, ни на лист подбора WB`, 'error');
          continue;
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
      if (fileRef.current) fileRef.current.value = '';
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
      const ExcelJS = (await import('exceljs')).default;
      const book = new ExcelJS.Workbook();
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
      boxes: [...v.boxes].sort((a, b) => b[1] - a[1]),
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

    const content = new Map<string, Map<string, number>>();
    for (const s of scope) {
      for (const r of s.rows) {
        const box = r.box || '—';
        const inner = content.get(box) ?? new Map<string, number>();
        inner.set(r.barcode, (inner.get(r.barcode) ?? 0) + r.qty);
        content.set(box, inner);
      }
    }

    const plan = planPicking(
      [...content].map(([box, items]) => ({
        box,
        items: [...items].map(([barcode, qty]) => ({ barcode, qty })),
      })),
      list.tasks.map((t) => ({ barcode: t.barcode, qty: 1, name: t.name, article: t.article })),
    );

    const rows = list.tasks.map((t, i) => ({ task: t, plan: plan.lines[i]! }));
    return { list, plan, rows };
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
              'Коробок': r.boxes.length,
              'Коробки': r.boxes.map(([b, q]) => `${b} ×${q}`).join(', '),
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
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            multiple
            className="hidden"
            onChange={(e) => void handleFiles(e.target.files)}
          />
          <button type="button" className="btn-ghost" onClick={() => void load()} disabled={busy || loading}>
            <RefreshCw className="w-4 h-4" /> Обновить
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            <Upload className="w-4 h-4" /> {busy ? 'Читаем…' : 'Загрузить поставку'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="oc-card p-8 text-center text-slate-500">Загружаем…</div>
      ) : supplies.length === 0 ? (
        <div className="oc-card p-10 text-center">
          <Package className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <div className="font-medium text-slate-700 dark:text-slate-200">Поставок пока нет</div>
          <p className="text-sm text-slate-500 mt-1">
            Загрузите файл терминала: столбцы «Штрих-код», «Кол-во» и «Адрес» — адрес и есть коробка.
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
                      <span className="text-slate-500"> — {picking.plan.boxes.map((b) => b.box).join(', ')}</span>
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
                        <th className="p-3 text-left font-medium w-28">№ задания</th>
                        <th className="p-3 text-left font-medium">Товар</th>
                        <th className="p-3 text-left font-medium w-32">Стикер</th>
                        <th className="p-3 text-left font-medium w-40">Коробка</th>
                        <th className="p-3 text-left font-medium w-44">ЧЗ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {picking.rows.map(({ task, plan }, i) => (
                        <tr key={`${task.task}-${i}`} className="border-t border-slate-100 dark:border-slate-800">
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
