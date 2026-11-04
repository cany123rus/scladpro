// Вынесено из Dashboard.tsx автоматически (ленивая загрузка раздела). Данные приходят пропсами из Dashboard.
/* eslint-disable */
import { Wallet, X, ChevronUp, ChevronDown, ChevronRight, Calendar, Plus, Trash2, RefreshCw } from 'lucide-react';
import { Select } from '../../components/ui/Select';
import { WarehouseMoneyOwner, WAREHOUSE_MONEY_OWNERS, getEmpInitials } from '../dashboardHelpers';

export function Block_34605(props: any) {
  const { cwSalaryPeriods, getSupplierNameForOwner, handleConfirmSalaryPay, loadSalaryPayRows, salaryPayExpanded, salaryPayExpandedDates, salaryPayFines, salaryPayLoading, salaryPayOwner, salaryPayPeriodKey, salaryPayRows, salaryPaySaving, salaryPaySelectedIds, setSalaryPayExpanded, setSalaryPayExpandedDates, setSalaryPayFines, setSalaryPayOwner, setSalaryPayPeriodKey, setSalaryPaySelectedIds, setShowSalaryPayModal } = props;
  return (
<div className="fixed inset-0 z-[94] flex items-end md:items-center justify-center bg-slate-900/55 p-2 md:p-4 backdrop-blur-sm" onClick={() => setShowSalaryPayModal(false)}>
              <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl md:rounded-3xl bg-white shadow-2xl ring-1 ring-black/5" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20"><Wallet className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Сборка</div>
                    <h3 className="truncate text-lg font-bold leading-tight">Оплата ЗП сотрудникам</h3>
                  </div>
                  <button type="button" onClick={() => setShowSalaryPayModal(false)} className="rounded-xl p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white"><X className="h-5 w-5" /></button>
                </div>
                <div className="border-b border-slate-100 p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Период</span>
                      <Select
                        value={salaryPayPeriodKey}
                        onChange={async (e) => { setSalaryPayPeriodKey(e.target.value); setSalaryPaySelectedIds([]); setSalaryPayExpanded([]); setSalaryPayExpandedDates([]); await loadSalaryPayRows(e.target.value); }}
                        className="oc-input h-11 rounded-xl bg-white text-sm"
                      >
                        {cwSalaryPeriods.map((p) => (<option key={'salary-period-' + p.key} value={p.key}>{p.label}</option>))}
                      </Select>
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Оплата</span>
                      <Select
                        value={salaryPayOwner}
                        onChange={(e) => setSalaryPayOwner(e.target.value as WarehouseMoneyOwner)}
                        className="oc-input h-11 rounded-xl bg-white text-sm"
                      >
                        {WAREHOUSE_MONEY_OWNERS.map((o) => (<option key={'salary-owner-' + o.id} value={o.id}>{getSupplierNameForOwner(o.id)}</option>))}
                      </Select>
                    </label>
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-2">
                  {salaryPayLoading ? (
                    <div className="py-8 text-center text-sm text-slate-400">Загрузка…</div>
                  ) : salaryPayRows.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">Нет сотрудников с неоплаченной ЗП за этот период</div>
                  ) : salaryPayRows.map((r) => {
                    const checked = salaryPaySelectedIds.includes(r.employee_id);
                    const empExpanded = salaryPayExpanded.includes(r.employee_id);
                    const byDate = new Map<string, { date: string; lines: any[]; amount: number; qty: number }>();
                    (r.lines || []).forEach((l: any) => {
                      const d = String(l?.date || '');
                      if (!byDate.has(d)) byDate.set(d, { date: d, lines: [], amount: 0, qty: 0 });
                      const g = byDate.get(d)!;
                      g.lines.push(l);
                      g.amount += Number(l?.amount || 0);
                      g.qty += Number(l?.quantity || 0);
                    });
                    const dateGroups = Array.from(byDate.values()).sort((a, b) => String(a.date).localeCompare(String(b.date)));
                    return (
                      <div key={'salary-row-' + r.employee_id} className={`rounded-2xl border transition-all ${checked ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 bg-white hover:border-emerald-200'}`}>
                        <div className="flex items-center gap-3 p-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => setSalaryPaySelectedIds((prev) => e.target.checked ? [...prev, r.employee_id] : prev.filter((x) => x !== r.employee_id))}
                            className="h-5 w-5 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-xs font-bold text-white">{getEmpInitials(r.employee_name)}</div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-slate-900 truncate">{r.employee_name}</div>
                            <div className="text-xs text-slate-500">записей: {r.lines.length} • дней: {dateGroups.length}</div>
                          </div>
                          <div className="text-base font-black text-emerald-700">{r.amount.toLocaleString('ru-RU')} ₽</div>
                          <button
                            type="button"
                            onClick={() => setSalaryPayExpanded((prev) => prev.includes(r.employee_id) ? prev.filter((x) => x !== r.employee_id) : [...prev, r.employee_id])}
                            className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            {empExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            <span className="hidden sm:inline">{empExpanded ? 'Свернуть' : 'Развернуть'}</span>
                          </button>
                        </div>
                        {empExpanded && (
                          <div className="border-t border-slate-100 p-2 space-y-1.5">
                            {dateGroups.map((g) => {
                              const dateKey = r.employee_id + '__' + g.date;
                              const dateExpanded = salaryPayExpandedDates.includes(dateKey);
                              return (
                                <div key={'salary-date-' + dateKey} className="rounded-xl border border-slate-200 bg-slate-50/70">
                                  <button
                                    type="button"
                                    onClick={() => setSalaryPayExpandedDates((prev) => prev.includes(dateKey) ? prev.filter((x) => x !== dateKey) : [...prev, dateKey])}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left"
                                  >
                                    {dateExpanded ? <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" /> : <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />}
                                    <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                    <span className="text-sm font-medium text-slate-800">{g.date ? new Date(g.date + 'T12:00:00').toLocaleDateString('ru-RU') : 'Без даты'}</span>
                                    <span className="ml-auto text-xs text-slate-500">записей: {g.lines.length}</span>
                                    <span className="text-sm font-bold text-emerald-700">{Number(g.amount).toLocaleString('ru-RU')} ₽</span>
                                  </button>
                                  {dateExpanded && (
                                    <div className="border-t border-slate-200 px-3 py-2">
                                      <table className="w-full text-left text-xs">
                                        <thead>
                                          <tr className="text-slate-400">
                                            <th className="py-1 pr-2 font-medium">Работа</th>
                                            <th className="py-1 pr-2 font-medium text-right">Кол-во</th>
                                            <th className="py-1 font-medium text-right">Сумма</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                          {g.lines.map((l: any, li: number) => (
                                            <tr key={'salary-line-' + dateKey + '-' + li}>
                                              <td className="py-1.5 pr-2 text-slate-700">{l?.comment || l?.work || '—'}</td>
                                              <td className="py-1.5 pr-2 text-right text-slate-700">{Number(l?.quantity ?? 0).toLocaleString('ru-RU')}</td>
                                              <td className="py-1.5 text-right font-semibold text-slate-900">{Number(l?.amount || 0).toLocaleString('ru-RU')} ₽</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Штрафы / прочие удержания */}
                <div className="border-t border-slate-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-slate-700">Штрафы / прочее</div>
                    <button type="button" onClick={() => setSalaryPayFines((p) => [...p, { amount: '', comment: '' }])} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"><Plus className="h-3.5 w-3.5" /> Добавить</button>
                  </div>
                  {salaryPayFines.length === 0 ? (
                    <p className="text-xs text-slate-400">Необязательно. Сумма штрафов вычитается из общей суммы к выплате.</p>
                  ) : (
                    <div className="space-y-2">
                      {salaryPayFines.map((f, i) => (
                        <div key={`fine-${i}`} className="flex items-center gap-2">
                          <input type="number" min="0" value={f.amount} onChange={(e) => setSalaryPayFines((p) => p.map((x, idx) => idx === i ? { ...x, amount: e.target.value } : x))} placeholder="Сумма ₽" className="oc-input h-10 w-32" />
                          <input type="text" value={f.comment} onChange={(e) => setSalaryPayFines((p) => p.map((x, idx) => idx === i ? { ...x, comment: e.target.value } : x))} placeholder="Комментарий (за что)" className="oc-input h-10 flex-1" />
                          <button type="button" onClick={() => setSalaryPayFines((p) => p.filter((_, idx) => idx !== i))} className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {(() => {
                  const sel = salaryPayRows.filter((r) => salaryPaySelectedIds.includes(r.employee_id)).reduce((s, r) => s + r.amount, 0);
                  const fines = salaryPayFines.reduce((s, f) => s + (Number(f.amount) || 0), 0);
                  const net = Math.max(0, sel - fines);
                  return (
                <div className="flex items-center justify-between gap-2 border-t border-slate-100 p-4">
                  <div className="text-sm text-slate-600">Выбрано: <span className="font-bold text-slate-900">{salaryPaySelectedIds.length}</span> • Сумма: <span className="font-bold text-slate-700">{sel.toLocaleString('ru-RU')} ₽</span>{fines > 0 && <> − штраф <span className="font-bold text-rose-600">{fines.toLocaleString('ru-RU')} ₽</span> = <span className="font-bold text-emerald-700">{net.toLocaleString('ru-RU')} ₽</span></>}</div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowSalaryPayModal(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Отмена</button>
                    <button
                      type="button"
                      onClick={handleConfirmSalaryPay}
                      disabled={salaryPaySaving || salaryPaySelectedIds.length === 0}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                    >
                      {salaryPaySaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                      {salaryPaySaving ? 'Оплата…' : 'Оплатить и сформировать отчёт'}
                    </button>
                  </div>
                </div>
                ); })()}
              </div>
            </div>
  );
}
