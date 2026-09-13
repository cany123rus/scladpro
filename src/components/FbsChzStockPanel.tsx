import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, RefreshCw, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

/**
 * Честный знак поставщика: сколько осталось и на сколько хватит.
 *
 * Остаток — коды в базе ЧЗ, которые ещё не напечатаны и не отсканированы.
 * Расход — марки, отсканированные на заданиях ФБС за последние 30 дней;
 * категория и пол берутся из карточки товара. Срок — остаток, делённый на
 * средний расход в день: прикидка, а не обещание — продажи скачут.
 */

type ForecastRow = {
  category: string;
  gender: 'male' | 'female' | null;
  inBase: number;
  used: number;
  periodDays: number;
};

type Status = 'out' | 'critical' | 'low' | 'ok' | 'idle';

const PERIOD_DAYS = 30;

const GENDER_TITLES: Record<string, string> = {
  male: 'Мужской',
  female: 'Женский',
  none: 'Пол не указан',
};

const STATUS_STYLES: Record<Status, { chip: string; bar: string; label: string }> = {
  out: { chip: 'bg-rose-100 text-rose-700 ring-rose-200', bar: 'bg-rose-500', label: 'Закончился' },
  critical: { chip: 'bg-rose-100 text-rose-700 ring-rose-200', bar: 'bg-rose-500', label: 'Меньше недели' },
  low: { chip: 'bg-amber-100 text-amber-800 ring-amber-200', bar: 'bg-amber-500', label: 'Меньше 2 недель' },
  ok: { chip: 'bg-emerald-100 text-emerald-700 ring-emerald-200', bar: 'bg-emerald-500', label: 'Хватает' },
  idle: { chip: 'bg-slate-100 text-slate-600 ring-slate-200', bar: 'bg-slate-400', label: 'Нет расхода' },
};

const plural = (n: number, one: string, few: string, many: string) => {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
};

const forecast = (inBase: number, used: number, periodDays: number) => {
  const perDay = periodDays > 0 ? used / periodDays : 0;
  const daysLeft = perDay > 0 ? inBase / perDay : null;
  let status: Status;
  if (perDay <= 0) status = 'idle';
  else if (inBase <= 0) status = 'out';
  else if ((daysLeft ?? 0) < 7) status = 'critical';
  else if ((daysLeft ?? 0) < 14) status = 'low';
  else status = 'ok';
  const endDate = daysLeft !== null && inBase > 0
    ? new Date(Date.now() + daysLeft * 86_400_000)
    : null;
  return { perDay, daysLeft, status, endDate, needMonth: Math.ceil(perDay * PERIOD_DAYS) };
};

const fmtDate = (d: Date) => d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', timeZone: 'Europe/Moscow' });
const fmtNum = (n: number) => n.toLocaleString('ru-RU');
const fmtPerDay = (n: number) => (n >= 10 ? Math.round(n).toLocaleString('ru-RU') : n.toLocaleString('ru-RU', { maximumFractionDigits: 1 }));

function ForecastLine({ inBase, used, periodDays }: { inBase: number; used: number; periodDays: number }) {
  const f = forecast(inBase, used, periodDays);
  if (f.perDay <= 0) {
    return <span className="text-slate-500">расхода по ФБС за {PERIOD_DAYS} дней не было</span>;
  }
  if (inBase <= 0) {
    return (
      <span className="text-rose-600">
        закончился · расход ~{fmtPerDay(f.perDay)} в день, на месяц нужно ~{fmtNum(f.needMonth)}
      </span>
    );
  }
  const days = Math.floor(f.daysLeft || 0);
  return (
    <span className="text-slate-600">
      ~{fmtPerDay(f.perDay)} в день · хватит на{' '}
      <b className="text-slate-900">{fmtNum(days)} {plural(days, 'день', 'дня', 'дней')}</b>
      {f.endDate ? <> — до {fmtDate(f.endDate)}</> : null}
    </span>
  );
}

export default function FbsChzStockPanel({ supplierId, supplierName }: { supplierId?: string; supplierName?: string }) {
  const [rows, setRows] = useState<ForecastRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reloadTick, setReloadTick] = useState(0);
  const [open, setOpen] = useState<boolean>(() => {
    try { return localStorage.getItem('fbs_chz_stock_open_v1') !== '0'; } catch { return true; }
  });

  useEffect(() => {
    if (!supplierId) { setRows([]); return; }
    let cancelled = false;
    setLoading(true);
    setError('');
    supabase
      .rpc('hs_fbs_stock_forecast', { p_supplier: supplierId, p_days: PERIOD_DAYS })
      .then(({ data, error: rpcError }) => {
        if (cancelled) return;
        if (rpcError) {
          setError(rpcError.message || 'Не удалось загрузить остатки ЧЗ');
          setRows([]);
          return;
        }
        setRows((data || []).map((r: any) => ({
          category: String(r?.category || 'Без категории'),
          gender: r?.gender === 'male' || r?.gender === 'female' ? r.gender : null,
          inBase: Number(r?.in_base || 0),
          used: Number(r?.used || 0),
          periodDays: Number(r?.period_days || PERIOD_DAYS),
        })));
      })
      .then(() => { if (!cancelled) setLoading(false); }, () => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [supplierId, reloadTick]);

  const groups = useMemo(() => {
    const map = new Map<string, { category: string; inBase: number; used: number; periodDays: number; rows: ForecastRow[] }>();
    for (const row of rows) {
      const g = map.get(row.category) || { category: row.category, inBase: 0, used: 0, periodDays: row.periodDays, rows: [] };
      g.inBase += row.inBase;
      g.used += row.used;
      g.rows.push(row);
      map.set(row.category, g);
    }
    const order: Record<Status, number> = { out: 0, critical: 1, low: 2, ok: 3, idle: 4 };
    return Array.from(map.values()).sort((a, b) => {
      const sa = forecast(a.inBase, a.used, a.periodDays).status;
      const sb = forecast(b.inBase, b.used, b.periodDays).status;
      return order[sa] - order[sb] || b.used - a.used || a.category.localeCompare(b.category, 'ru');
    });
  }, [rows]);

  const totals = useMemo(() => {
    const inBase = groups.reduce((s, g) => s + g.inBase, 0);
    const used = groups.reduce((s, g) => s + g.used, 0);
    const periodDays = groups[0]?.periodDays || PERIOD_DAYS;
    const alarms = groups.filter((g) => ['out', 'critical'].includes(forecast(g.inBase, g.used, g.periodDays).status)).length;
    return { inBase, used, periodDays, alarms, f: forecast(inBase, used, periodDays) };
  }, [groups]);

  const toggle = () => {
    setOpen((v) => {
      try { localStorage.setItem('fbs_chz_stock_open_v1', v ? '0' : '1'); } catch { /* приватный режим */ }
      return !v;
    });
  };

  if (!supplierId) return null;

  return (
    <section className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-white">
        <button type="button" onClick={toggle} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="rounded-xl bg-white/15 p-2"><ShieldCheck className="h-5 w-5" /></span>
          <span className="min-w-0">
            <span className="block text-base font-bold leading-tight">Честный знак</span>
            <span className="block truncate text-xs text-white/80">
              {supplierName ? `${supplierName} · ` : ''}остаток в базе и расход по ФБС за {PERIOD_DAYS} дней
            </span>
          </span>
        </button>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-lg bg-white/15 px-2.5 py-1">
            В базе: <b className="tabular-nums">{fmtNum(totals.inBase)}</b>
          </span>
          <span className="rounded-lg bg-white/15 px-2.5 py-1">
            Расход: <b className="tabular-nums">~{fmtPerDay(totals.f.perDay)}</b>/день
          </span>
          {totals.alarms > 0 && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-rose-500 px-2.5 py-1 font-semibold">
              <AlertTriangle className="h-4 w-4" />
              {totals.alarms} {plural(totals.alarms, 'категория', 'категории', 'категорий')} на исходе
            </span>
          )}
          <button
            type="button"
            onClick={() => setReloadTick((t) => t + 1)}
            disabled={loading}
            title="Обновить остатки"
            className="rounded-lg p-1.5 hover:bg-white/20 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button type="button" onClick={toggle} title={open ? 'Свернуть' : 'Развернуть'} className="rounded-lg p-1.5 hover:bg-white/20">
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {open && (
        <div className="p-4">
          {error ? (
            <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
          ) : loading && !rows.length ? (
            <div className="text-sm text-slate-500">Считаю остатки…</div>
          ) : !groups.length ? (
            <div className="text-sm text-slate-500">
              В базе нет кодов этого поставщика и за {PERIOD_DAYS} дней не было сканов ЧЗ на ФБС.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {groups.map((g) => {
                const f = forecast(g.inBase, g.used, g.periodDays);
                const style = STATUS_STYLES[f.status];
                // Полоска — запас относительно месячной потребности.
                const fill = f.needMonth > 0 ? Math.min(100, Math.round((g.inBase / f.needMonth) * 100)) : g.inBase > 0 ? 100 : 0;
                return (
                  <div key={g.category} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-slate-900" title={g.category}>{g.category}</div>
                        <div className="mt-0.5 text-2xl font-extrabold tabular-nums text-slate-900">
                          {fmtNum(g.inBase)} <span className="text-sm font-medium text-slate-500">шт в базе</span>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${style.chip}`}>{style.label}</span>
                    </div>

                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100" title="Запас относительно расхода за месяц">
                      <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${fill}%` }} />
                    </div>

                    <div className="mt-2 text-xs"><ForecastLine inBase={g.inBase} used={g.used} periodDays={g.periodDays} /></div>

                    {g.rows.length > 1 || g.rows[0]?.gender ? (
                      <div className="mt-2 space-y-1 border-t border-slate-100 pt-2">
                        {g.rows.map((r) => (
                          <div key={`${g.category}-${r.gender || 'none'}`} className="flex flex-wrap items-baseline justify-between gap-x-2 text-xs">
                            <span className="font-medium text-slate-700">
                              {GENDER_TITLES[r.gender || 'none']}: <span className="tabular-nums">{fmtNum(r.inBase)}</span> шт
                            </span>
                            <ForecastLine inBase={r.inBase} used={r.used} periodDays={r.periodDays} />
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
          <p className="mt-3 text-[11px] text-slate-400">
            Срок — прикидка: остаток делим на средний расход за {Math.round(totals.periodDays)} {plural(Math.round(totals.periodDays), 'день', 'дня', 'дней')}.
            Категория и пол расхода — из карточек товаров WB. Коды без пола в базе подходят к любому полу своей категории.
          </p>
        </div>
      )}
    </section>
  );
}
