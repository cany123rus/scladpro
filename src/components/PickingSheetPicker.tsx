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

export interface PickingFormRow { supplier_id: string; work_rate_id: string; quantity: string }

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
  onClose: () => void;
  onAdd: (rows: PickingFormRow[]) => void;
  onRateCreated: (rate: { id: string; name: string; price: number }) => void;
  showToast: (m: string, t?: 'success' | 'error' | 'info') => void;
}) {
  const { suppliers, workRates, initialDate, initialSupplierId, onClose, onAdd, onRateCreated, showToast } = props;

  const [supplierId, setSupplierId] = useState(initialSupplierId || '');
  const [day, setDay] = useState(initialDate);
  const [allDays, setAllDays] = useState(false);
  const [lists, setLists] = useState<PickingList[]>([]);
  const [loading, setLoading] = useState(false);
  const [listId, setListId] = useState('');
  // Категория по баркоду — из карточек WB (предмет), запасной путь — первое слово названия.
  const [subjectByBarcode, setSubjectByBarcode] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [qty, setQty] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

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
    () => lists.filter((l) => allDays || ymd(l.uploadedAt) === day).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)),
    [lists, day, allDays],
  );

  const list = visibleLists.find((l) => l.id === listId) || null;

  const categories = useMemo(() => {
    if (!list) return [] as Array<{ name: string; count: number }>;
    const m = new Map<string, number>();
    for (const t of list.tasks) {
      const cat = capitalize(subjectByBarcode[norm(t.barcode)] || norm(t.name).split(/\s+/)[0] || 'Без категории');
      m.set(cat, (m.get(cat) || 0) + 1);
    }
    return [...m.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [list, subjectByBarcode]);

  const toggle = (name: string, count: number, on: boolean) => {
    setChecked((p) => ({ ...p, [name]: on }));
    if (on) setQty((p) => ({ ...p, [name]: p[name] ?? String(count) }));
  };
  const allOn = categories.length > 0 && categories.every((c) => checked[c.name]);
  const toggleAll = () => {
    const on = !allOn;
    setChecked(Object.fromEntries(categories.map((c) => [c.name, on])));
    if (on) setQty((p) => ({ ...Object.fromEntries(categories.map((c) => [c.name, String(c.count)])), ...p }));
  };

  const picked = categories.filter((c) => checked[c.name]).map((c) => ({
    ...c,
    take: Math.max(0, Math.min(c.count, parseInt(qty[c.name] ?? String(c.count), 10) || 0)),
  })).filter((c) => c.take > 0);
  const total = picked.reduce((s, c) => s + c.take, 0);

  async function add() {
    if (!supplierId || picked.length === 0) return;
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
        rows.push({ supplier_id: supplierId, work_rate_id: String(rate!.id), quantity: String(c.take) });
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

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-900/50 p-0 sm:p-4" onClick={onClose}>
      <div className="w-full sm:max-w-xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
          <div className="flex items-center gap-2 font-bold text-slate-900"><ClipboardList className="h-5 w-5 text-indigo-600" /> Добавить лист</div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100" aria-label="Закрыть"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="oc-select">
              <option value="">Поставщик…</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input type="date" value={day} onChange={(e) => { setDay(e.target.value); setListId(''); }} disabled={allDays} className="oc-select disabled:opacity-50" />
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input type="checkbox" checked={allDays} onChange={(e) => { setAllDays(e.target.checked); setListId(''); }} /> Показать листы за все дни
          </label>

          {!supplierId ? (
            <div className="py-6 text-center text-sm text-slate-400">Выберите поставщика</div>
          ) : loading ? (
            <div className="py-6 text-center text-sm text-slate-400">Загружаем листы…</div>
          ) : visibleLists.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-400">Листов за этот день нет{lists.length > 0 ? ' — попробуйте «за все дни»' : ''}</div>
          ) : (
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-slate-500">Лист</div>
              {visibleLists.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => { setListId(l.id); setChecked({}); setQty({}); }}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${l.id === listId ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}
                >
                  <span className="min-w-0 truncate font-medium text-slate-800">{l.name || l.fileName}</span>
                  <span className="shrink-0 text-xs text-slate-500">{ymd(l.uploadedAt).split('-').reverse().join('.')} · {l.tasks.length} шт</span>
                </button>
              ))}
            </div>
          )}

          {list && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-slate-500">Категории — отметьте собранное</div>
                <button type="button" onClick={toggleAll} className="text-xs font-semibold text-indigo-600 hover:underline">{allOn ? 'Снять все' : 'Всё собрано'}</button>
              </div>
              {categories.map((c) => {
                const on = !!checked[c.name];
                return (
                  <div key={c.name} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${on ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200'}`}>
                    <input type="checkbox" className="h-5 w-5 shrink-0 accent-emerald-600" checked={on} onChange={(e) => toggle(c.name, c.count, e.target.checked)} />
                    <div className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{c.name}</div>
                    {on ? (
                      <div className="flex shrink-0 items-center gap-1 text-xs text-slate-500">
                        <input
                          type="number" min={1} max={c.count} value={qty[c.name] ?? String(c.count)}
                          onChange={(e) => setQty((p) => ({ ...p, [c.name]: e.target.value }))}
                          className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-right text-sm"
                        />
                        <span>из {c.count}</span>
                      </div>
                    ) : (
                      <div className="shrink-0 text-sm tabular-nums text-slate-500">{c.count} шт</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-slate-100 bg-white px-5 py-4">
          <div className="text-sm text-slate-600">Собрано: <b className="text-slate-900">{total}</b> шт</div>
          <button
            onClick={() => void add()}
            disabled={saving || picked.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Check className="h-4 w-4" /> Добавить в запись
          </button>
        </div>
      </div>
    </div>
  );
}
