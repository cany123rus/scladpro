import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

/**
 * Добавление сборочного листа в запись календаря.
 *
 * Сотрудник выбирает поставщика и день листа, видит категории с количеством
 * товаров и ставит галочку «собрано». Галочки превращаются в строки формы
 * (поставщик + тип работы = категория + количество); сохраняет их уже штатная
 * кнопка формы, поэтому отчёты и зарплата считаются как раньше. Цену на
 * категорию администратор проставляет отдельно во вкладке «Расценки».
 */

const PICK_KEY = 'fbs_search_pickings_v1';

interface PickTask { task: string; barcode: string; name: string; article: string }
interface PickingList { id: string; name: string; fileName: string; uploadedAt: string; tasks: PickTask[] }

/** pick — откуда строка: по нему после сохранения записи учитываем, сколько листа уже записано. */
export interface PickingFormRow { supplier_id: string; work_rate_id: string; quantity: string; pick: { key: string; category: string } }

const REC_KEY = 'cw_picking_recorded_v1'; // старый учёт без привязки к записям (остаётся как есть)
const LINKS_KEY = 'cw_picking_links_v1';
type Recorded = Record<string, Record<string, number>>;
interface PickLink { log: string; key: string; cat: string; qty: number }

async function readJson(key: string): Promise<any> {
  const { data } = await supabase.from('app_settings').select('value').eq('key', key).maybeSingle();
  const raw = (data as any)?.value;
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return null; }
}

/**
 * Записанное из листов считаем ПО ЖИВЫМ ЗАПИСЯМ календаря, а не счётчиком.
 * Каждая запись помнит, из какого листа и категории она пришла. Удалили запись
 * (или уменьшили количество) — штуки сами возвращаются в лист; вернули запись
 * кнопкой «отменить» — снова считаются записанными.
 */
async function loadRecorded(supplierId: string): Promise<Recorded> {
  const rec: Recorded = {};
  const add = (k: string, c: string, n: number) => { rec[k] = rec[k] || {}; rec[k][c] = (rec[k][c] || 0) + n; };

  const legacy = await readJson(REC_KEY);
  if (legacy && typeof legacy === 'object') {
    for (const [k, cats] of Object.entries<any>(legacy)) {
      if (!k.startsWith(`${supplierId}:`)) continue;
      for (const [c, n] of Object.entries<any>(cats || {})) add(k, c, Number(n) || 0);
    }
  }

  const links: PickLink[] = (await readJson(LINKS_KEY)) || [];
  const mine = links.filter((l) => l.key.startsWith(`${supplierId}:`));
  if (!mine.length) return rec;
  const ids = [...new Set(mine.map((l) => l.log))];
  const alive = new Map<string, number>();
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await supabase.from('work_logs').select('id, quantity').in('id', ids.slice(i, i + 200)).is('deleted_at', null);
    for (const r of (data ?? []) as any[]) alive.set(String(r.id), Number(r.quantity) || 0);
  }
  // Если запись потом уменьшили, отдаём ей не больше её текущего количества.
  const left = new Map(alive);
  for (const l of mine) {
    const cap = left.get(l.log);
    if (cap == null) continue;
    const take = Math.min(l.qty, cap);
    left.set(l.log, cap - take);
    if (take > 0) add(l.key, l.cat, take);
  }
  return rec;
}

/** Запоминает, какие записи календаря пришли из каких листов. Вызывать после сохранения записи. */
export async function commitPickingLinks(links: PickLink[]) {
  const fresh = links.filter((l) => l.log && l.qty > 0);
  if (!fresh.length) return;
  const all: PickLink[] = (await readJson(LINKS_KEY)) || [];
  await supabase.from('app_settings').upsert([{ key: LINKS_KEY, value: JSON.stringify([...all, ...fresh]) }], { onConflict: 'key' });
}

const norm = (v: unknown) => String(v ?? '').trim();
const ymd = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-CA', { timeZone: 'Europe/Moscow' });
};
const capitalize = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export function PickingSheetPicker(props: {
  suppliers: Array<{ id: string; name: string }>;
  workRates: Array<{ id: string; name: string; price?: number }>;
  initialDate: string;
  initialSupplierId?: string;
  /** Уже добавленное в форму, но ещё не сохранённое: вычитаем из остатка. */
  pending: Array<{ key: string; category: string; quantity: number }>;
  onClose: () => void;
  onAdd: (rows: PickingFormRow[]) => void;
  onRateCreated: (rate: { id: string; name: string; price: number }) => void;
  showToast: (m: string, t?: 'success' | 'error' | 'info') => void;
}) {
  const { suppliers, workRates, initialDate, initialSupplierId, pending, onClose, onAdd, onRateCreated, showToast } = props;

  const [supplierId, setSupplierId] = useState(initialSupplierId || '');
  const [day, setDay] = useState(initialDate);
  const [onlyDay, setOnlyDay] = useState(false);
  const [lists, setLists] = useState<PickingList[]>([]);
  const [loading, setLoading] = useState(false);
  const [listId, setListId] = useState('');
  // Категория по баркоду — из карточек WB (предмет), запасной путь — первое слово названия.
  const [subjectByBarcode, setSubjectByBarcode] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [qty, setQty] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [recorded, setRecorded] = useState<Recorded>({});

  useEffect(() => {
    setListId(''); setChecked({}); setQty({}); setLists([]);
    if (!supplierId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const { data, error } = await supabase.from('app_settings').select('value').eq('key', `${PICK_KEY}:${supplierId}`).maybeSingle();
        if (error) throw error;
        const raw = (data as any)?.value;
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const arr: PickingList[] = Array.isArray(parsed) ? parsed : [];
        const rec = await loadRecorded(supplierId);

        // Предметы WB по баркодам этого поставщика.
        const map: Record<string, string> = {};
        const PAGE = 1000;
        for (let from = 0; from < 30_000; from += PAGE) {
          const { data: rows, error: e2 } = await supabase
            .from('wb_products_cache')
            .select('nm_id, subject:product_json->>subjectName, sizes:product_json->sizes')
            .eq('supplier_id', supplierId)
            .order('nm_id')
            .range(from, from + PAGE - 1);
          if (e2) break;
          for (const r of (rows ?? []) as any[]) {
            const subject = norm(r?.subject);
            if (!subject) continue;
            for (const s of r?.sizes ?? []) for (const sku of s?.skus ?? []) map[norm(sku)] = subject;
          }
          if ((rows ?? []).length < PAGE) break;
        }
        if (cancelled) return;
        setLists(arr);
        setRecorded(rec);
        setSubjectByBarcode(map);
      } catch (e: any) {
        if (!cancelled) showToast(`Не удалось загрузить листы: ${e?.message || e}`, 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierId]);

  const visibleLists = useMemo(
    () => lists.filter((l) => !onlyDay || ymd(l.uploadedAt) === day).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)),
    [lists, day, onlyDay],
  );

  const list = visibleLists.find((l) => l.id === listId) || null;

  const categories = useMemo(() => {
    if (!list) return [] as Array<{ name: string; count: number; total: number }>;
    const m = new Map<string, number>();
    for (const t of list.tasks) {
      const cat = capitalize(subjectByBarcode[norm(t.barcode)] || norm(t.name).split(/\s+/)[0] || 'Без категории');
      m.set(cat, (m.get(cat) || 0) + 1);
    }
    const key = `${supplierId}:${list.id}`;
    return [...m.entries()]
      .map(([name, total]) => {
        const used = (recorded[key]?.[name] || 0) + pending.filter((p) => p.key === key && p.category === name).reduce((a, p) => a + p.quantity, 0);
        return { name, total, count: Math.max(0, total - used) };
      })
      .sort((a, b) => (b.count > 0 ? 1 : 0) - (a.count > 0 ? 1 : 0) || b.total - a.total);
  }, [list, subjectByBarcode, recorded, pending, supplierId]);
  const open = categories.filter((c) => c.count > 0);

  const toggle = (name: string, count: number, on: boolean) => {
    setChecked((p) => ({ ...p, [name]: on }));
    if (on) setQty((p) => ({ ...p, [name]: p[name] ?? String(count) }));
  };
  const allOn = open.length > 0 && open.every((c) => checked[c.name]);
  const toggleAll = () => {
    const on = !allOn;
    setChecked(Object.fromEntries(open.map((c) => [c.name, on])));
    if (on) setQty((p) => ({ ...Object.fromEntries(open.map((c) => [c.name, String(c.count)])), ...p }));
  };

  const picked = open.filter((c) => checked[c.name]).map((c) => ({
    ...c,
    take: Math.max(0, Math.min(c.count, parseInt(qty[c.name] ?? String(c.count), 10) || 0)),
  })).filter((c) => c.take > 0);
  const total = picked.reduce((s, c) => s + c.take, 0);

  async function add() {
    if (!supplierId || !list || picked.length === 0) return;
    setSaving(true);
    try {
      const rows: PickingFormRow[] = [];
      const known = [...workRates];
      for (const c of picked) {
        // Расценка = категория. Нет такой — заводим с ценой 0, администратор проставит цену.
        let rate = known.find((r) => norm(r.name).toLowerCase() === c.name.toLowerCase());
        if (!rate) {
          const { data, error } = await supabase.from('work_rates').insert([{ name: c.name, price: 0 }]).select('id, name, price').single();
          if (error || !data) throw error || new Error('не создалась расценка «' + c.name + '»');
          rate = data as any;
          known.push(rate!);
          onRateCreated(data as any);
        }
        rows.push({ supplier_id: supplierId, work_rate_id: String(rate!.id), quantity: String(c.take), pick: { key: `${supplierId}:${list!.id}`, category: c.name } });
      }
      onAdd(rows);
      showToast(`Добавлено строк: ${rows.length} (${total} шт). Нажмите «Сохранить».`, 'success');
      onClose();
    } catch (e: any) {
      showToast(`Не удалось добавить: ${e?.message || e}`, 'error');
    } finally {
      setSaving(false);
    }
  }

  const listLeft = (l: PickingList) => {
    const key = `${supplierId}:${l.id}`;
    const used = Object.values(recorded[key] || {}).reduce((a, b) => a + b, 0) + pending.filter((p) => p.key === key).reduce((a, p) => a + p.quantity, 0);
    return Math.max(0, l.tasks.length - used);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-900/50 sm:p-4" onClick={onClose}>
      <div
        className="flex h-[94dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:max-w-xl sm:rounded-3xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-center gap-2 text-base font-bold text-slate-900"><ClipboardList className="h-5 w-5 text-indigo-600" /> Добавить лист</div>
          <button onClick={onClose} className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-slate-100 active:bg-slate-200" aria-label="Закрыть"><X className="h-5 w-5" /></button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="oc-select min-h-[48px] text-base">
              <option value="">Поставщик…</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input type="date" value={day} onChange={(e) => { setDay(e.target.value); setListId(''); }} disabled={!onlyDay} className="oc-select min-h-[48px] text-base disabled:opacity-40" />
          </div>
          <label className="flex min-h-[44px] items-center gap-3 text-sm text-slate-600">
            <input type="checkbox" className="h-5 w-5" checked={onlyDay} onChange={(e) => { setOnlyDay(e.target.checked); setListId(''); }} /> Только листы, загруженные в выбранный день
          </label>

          {!supplierId ? (
            <div className="py-6 text-center text-sm text-slate-400">Выберите поставщика</div>
          ) : loading ? (
            <div className="py-6 text-center text-sm text-slate-400">Загружаем листы…</div>
          ) : visibleLists.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-400">{lists.length === 0 ? 'У этого поставщика нет листов подбора' : 'Листов за этот день нет — снимите галочку выше'}</div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-500">Лист</div>
              {visibleLists.map((l) => {
                const left = listLeft(l);
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => { setListId(l.id); setChecked({}); setQty({}); }}
                    className={`flex min-h-[56px] w-full items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 text-left text-sm transition-colors active:scale-[0.99] ${l.id === listId ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'} ${left === 0 ? 'opacity-60' : ''}`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-slate-800">{l.name || l.fileName}</span>
                      <span className="block text-xs text-slate-500">{ymd(l.uploadedAt).split('-').reverse().join('.')} · всего {l.tasks.length} шт</span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${left === 0 ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'}`}>
                      {left === 0 ? 'всё записано' : `осталось ${left}`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {list && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-slate-500">Категории — отметьте собранное</div>
                {open.length > 0 && <button type="button" onClick={toggleAll} className="min-h-[44px] px-2 text-sm font-semibold text-indigo-600 active:opacity-60">{allOn ? 'Снять все' : 'Всё собрано'}</button>}
              </div>
              {categories.map((c) => {
                const done = c.count === 0;
                const on = !!checked[c.name] && !done;
                return (
                  <div key={c.name} className={`rounded-2xl border px-4 py-3 ${done ? 'border-slate-100 bg-slate-50 opacity-60' : on ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200'}`}>
                    <label className="flex min-h-[32px] items-center gap-3">
                      <input type="checkbox" className="h-6 w-6 shrink-0 accent-emerald-600" disabled={done} checked={on} onChange={(e) => toggle(c.name, c.count, e.target.checked)} />
                      <span className="min-w-0 flex-1 truncate text-base font-medium text-slate-800">{c.name}</span>
                      <span className="shrink-0 text-sm tabular-nums text-slate-500">
                        {done ? 'записано' : c.count === c.total ? `${c.count} шт` : `${c.count} из ${c.total}`}
                      </span>
                    </label>
                    {on && (
                      <div className="mt-2 flex items-center justify-end gap-2 text-sm text-slate-600">
                        <span>Собрано сейчас:</span>
                        <input
                          type="number" inputMode="numeric" pattern="[0-9]*" min={1} max={c.count} value={qty[c.name] ?? String(c.count)}
                          onChange={(e) => setQty((p) => ({ ...p, [c.name]: e.target.value }))}
                          className="h-11 w-24 rounded-xl border border-slate-300 px-3 text-right text-base"
                        />
                        <span>из {c.count}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 bg-white px-4 py-3 sm:px-5 sm:py-4">
          <div className="text-sm text-slate-600">Собрано: <b className="text-base text-slate-900">{total}</b> шт</div>
          <button
            onClick={() => void add()}
            disabled={saving || picked.length === 0}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-emerald-600 px-5 text-base font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Check className="h-5 w-5" /> Добавить
          </button>
        </div>
      </div>
    </div>
  );
}
