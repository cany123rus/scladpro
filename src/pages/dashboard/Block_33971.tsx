// Вынесено из Dashboard.tsx автоматически (ленивая загрузка раздела). Данные приходят пропсами из Dashboard.
/* eslint-disable */
import { Wallet, X, CheckCircle2 } from 'lucide-react';
import { SearchSelect } from '../../components/ui/SearchSelect';
import { Select } from '../../components/ui/Select';

export function Block_33971(props: any) {
  const { deliveryPayerSuppliers, getTempWorkerRemainingAmount, handleConfirmTempWorkerQuickPay, setShowTempWorkerQuickPayModal, setTempWorkerQuickPayPayerSupplierId, setTempWorkerQuickPaySelectedIds, setTempWorkerQuickPayWorkerFilter, suppliers, tempTypeQty, tempWorkerQuickPayPayerSupplierId, tempWorkerQuickPayRows, tempWorkerQuickPaySaving, tempWorkerQuickPaySelectedIds, tempWorkerQuickPaySelectedRows, tempWorkerQuickPaySelectedTotal, tempWorkerQuickPayWorkerFilter, tempWorkerQuickPayWorkerOptions } = props;
  return (
<div className="fixed inset-0 z-[76] bg-slate-950/60 backdrop-blur-sm flex items-end md:items-center justify-center p-2 md:p-4" onClick={() => setShowTempWorkerQuickPayModal(false)}>
              <div className="bg-slate-50 rounded-t-3xl md:rounded-3xl shadow-2xl w-[98vw] max-w-5xl max-h-[92svh] 2xl:h-[82vh] flex flex-col overflow-y-auto 2xl:overflow-hidden border border-white/70" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200 px-4 py-4 md:px-6">
                  <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-slate-300 md:hidden" />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 mb-2">
                        <Wallet className="h-3.5 w-3.5" /> Массовая выплата
                      </div>
                      <h2 className="text-lg md:text-2xl font-bold text-slate-950">Быстрая оплата</h2>
                      <p className="text-xs md:text-sm text-slate-500 mt-1">Выберите поставщика-плательщика и неоплаченные смены. После подтверждения они будут полностью оплачены.</p>
                    </div>
                    <button onClick={() => setShowTempWorkerQuickPayModal(false)} className="p-2 rounded-lg hover:bg-slate-100" aria-label="Закрыть быструю оплату">
                      <X className="h-5 w-5 text-slate-500" />
                    </button>
                  </div>
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Фильтр по рабочему</span>
                      <SearchSelect
                        value={tempWorkerQuickPayWorkerFilter}
                        onChange={(v) => {
                          setTempWorkerQuickPayWorkerFilter(v);
                          setTempWorkerQuickPaySelectedIds([]);
                        }}
                        options={[{ value: 'all', label: 'Все сотрудники с неоплаченными сменами' }, ...tempWorkerQuickPayWorkerOptions.map((name) => ({ value: name, label: name }))]}
                        ariaLabel="Сотрудник"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Кто оплатит</span>
                      <Select
                        value={tempWorkerQuickPayPayerSupplierId}
                        onChange={(e) => setTempWorkerQuickPayPayerSupplierId(e.target.value)}
                        className="oc-input h-11 rounded-xl bg-white text-sm"
                      >
                        <option value="">Выберите поставщика</option>
                        {deliveryPayerSuppliers.map((s) => (
                          <option key={`quick-pay-payer-${s.id}`} value={String(s.id)}>{s.name}</option>
                        ))}
                      </Select>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const visibleIds = tempWorkerQuickPayRows.map((log: any) => String(log.id));
                        const allSelected = visibleIds.length > 0 && visibleIds.every((id) => tempWorkerQuickPaySelectedIds.includes(id));
                        setTempWorkerQuickPaySelectedIds(allSelected ? [] : visibleIds);
                      }}
                      className="h-11 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    >
                      {tempWorkerQuickPayRows.length > 0 && tempWorkerQuickPayRows.every((log: any) => tempWorkerQuickPaySelectedIds.includes(String(log.id))) ? 'Снять выбор' : 'Выбрать все'}
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-[11px] text-slate-500">Неоплаченных</div>
                      <div className="text-lg font-bold text-slate-900">{tempWorkerQuickPayRows.length}</div>
                    </div>
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
                      <div className="text-[11px] text-indigo-700">Выбрано</div>
                      <div className="text-lg font-bold text-indigo-800">{tempWorkerQuickPaySelectedRows.length}</div>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                      <div className="text-[11px] text-emerald-700">К оплате</div>
                      <div className="text-lg font-bold text-emerald-800">{tempWorkerQuickPaySelectedTotal.toFixed(2)} ₽</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 md:p-6 2xl:flex-1 2xl:overflow-y-auto custom-scrollbar">
                  {tempWorkerQuickPayRows.length === 0 ? (
                    <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center text-slate-400">
                      <CheckCircle2 className="h-12 w-12 mb-3 text-emerald-300" />
                      <div className="font-medium">Неоплаченных смен нет</div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tempWorkerQuickPayRows.map((log: any) => {
                        const id = String(log.id);
                        const selected = tempWorkerQuickPaySelectedIds.includes(id);
                        const supplier = suppliers.find((s: any) => String(s.id) === String(log.supplier_id));
                        const remaining = getTempWorkerRemainingAmount(log);
                        return (
                          <label key={`quick-pay-row-${id}`} className={`block rounded-2xl border p-3 cursor-pointer transition-all ${selected ? 'border-emerald-400 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={(e) => {
                                  setTempWorkerQuickPaySelectedIds(prev => e.target.checked ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id));
                                }}
                                className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                                  <div className="font-semibold text-slate-900">{log.worker_name || log.worker || 'Без имени'}</div>
                                  <div className="text-lg font-extrabold text-emerald-700 whitespace-nowrap">{remaining.toFixed(2)} ₽</div>
                                </div>
                                <div className="mt-1 text-sm text-slate-600">
                                  {log?.date ? new Date(`${log.date}T12:00:00`).toLocaleDateString('ru-RU') : '—'} • {supplier?.name || 'Без поставщика'} • {Number(log.hours || 0).toFixed(2)} ч.
                                </div>
                                <div className="mt-1 text-xs text-slate-500 font-medium">{tempTypeQty(log)}</div>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="border-t bg-white px-4 py-3 md:px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="text-sm text-slate-600">
                    Выбрано смен: <b>{tempWorkerQuickPaySelectedRows.length}</b> • сумма: <b className="text-emerald-700">{tempWorkerQuickPaySelectedTotal.toFixed(2)} ₽</b>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowTempWorkerQuickPayModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50">Отмена</button>
                    <button
                      type="button"
                      onClick={handleConfirmTempWorkerQuickPay}
                      disabled={tempWorkerQuickPaySaving || tempWorkerQuickPaySelectedRows.length === 0}
                      className={`px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 ${tempWorkerQuickPaySaving || tempWorkerQuickPaySelectedRows.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {tempWorkerQuickPaySaving ? 'Оплачиваю...' : 'Оплатить выбранные'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
  );
}
