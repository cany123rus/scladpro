// Вынесено из Dashboard.tsx автоматически (ленивая загрузка раздела). Данные приходят пропсами из Dashboard.
/* eslint-disable */
import { History, Plus, Wallet, FileText, Truck, X, Clock, Users, Pencil, Trash2 } from 'lucide-react';
import { WAREHOUSE_MONEY_OWNERS } from '../dashboardHelpers';
import { Select } from '../../components/ui/Select';

export function Block_33576(props: any) {
  const { employees, fetchTempWorkerLogs, filteredTempWorkerLogs, getTempWorkerPaidAmount, getTempWorkerPaymentsSummary, getTempWorkerRemainingAmount, handleDeleteTempWorkerLog, handleOpenEditTempWorkerLog, handleOpenEditTempWorkerPayment, handleToggleTempWorkerPaid, hasAssemblyButtonAccess, loadDeliveryData, makeTempLine, renderWarehouseMoneyCard, setShowDeliveryModal, setShowTempWorkerAddNameModal, setShowTempWorkerAddTemplateModal, setShowTempWorkerHistory, setShowTempWorkerModal, setShowTempWorkerQuickPayModal, setShowTempWorkerReportModal, setTempWorkerDateSort, setTempWorkerLines, setTempWorkerPaidFilter, setTempWorkerPaymentModal, setTempWorkerQuickPayPayerSupplierId, setTempWorkerQuickPaySelectedIds, setTempWorkerQuickPayWorkerFilter, setTempWorkerSupplierFilter, suppliers, tempTypeQty, tempUnpaidBySupplier, tempWorkerDateSort, tempWorkerLogs, tempWorkerMetaLoaded, tempWorkerPaidFilter, tempWorkerSupplierFilter } = props;
  return (
<div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-end md:items-center justify-center z-50 transition-opacity p-2 md:p-3 xl:p-4" onClick={() => setShowTempWorkerHistory(false)}>
              <div className="bg-slate-50 rounded-t-3xl md:rounded-3xl shadow-2xl w-[98vw] max-w-[1500px] max-h-[94svh] 2xl:h-[92svh] flex flex-col overflow-y-auto 2xl:overflow-hidden transform transition-all scale-100 border border-white/70" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200 px-4 pt-2 pb-3 md:px-5 md:pt-4 md:pb-4 xl:px-6">
                  <div className="mx-auto mb-1.5 h-1.5 w-12 rounded-full bg-slate-300 md:hidden" />
                  <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
                    <div className="pr-0 md:pr-4">
                      <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-700 mb-2">
                        <History className="h-3.5 w-3.5" /> Журнал выплат
                      </div>
                      <h2 className="text-base md:text-2xl font-bold text-slate-950 leading-tight">История временных сотрудников</h2>
                      <p className="text-[11px] md:text-sm text-slate-500 mt-0.5 md:mt-1 leading-tight">Смены, долги, оплаты и деньги на складе</p>
                    </div>
                    <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 2xl:flex 2xl:w-auto 2xl:flex-wrap 2xl:justify-end 2xl:gap-3">
                      <button
                          onClick={() => setShowTempWorkerAddNameModal(true)}
                          className="min-h-[44px] w-full 2xl:w-auto rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold leading-tight text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-md inline-flex items-center justify-center gap-2"
                      >
                          <Plus className="w-4 h-4 shrink-0" />
                          <span className="text-center">Добавить сотрудника</span>
                      </button>
                      <button
                          onClick={() => setShowTempWorkerAddTemplateModal(true)}
                          className="min-h-[44px] w-full 2xl:w-auto rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold leading-tight text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-md inline-flex items-center justify-center gap-2"
                      >
                          <Plus className="w-4 h-4 shrink-0" />
                          <span className="text-center">Тип работы</span>
                      </button>
                      <button
                          onClick={async () => {
                            setShowTempWorkerQuickPayModal(true);
                            setTempWorkerQuickPayWorkerFilter('all');
                            setTempWorkerQuickPayPayerSupplierId('');
                            setTempWorkerQuickPaySelectedIds([]);
                            if (!tempWorkerLogs.length) await fetchTempWorkerLogs();
                          }}
                          className="min-h-[44px] w-full 2xl:w-auto rounded-2xl border border-emerald-600 bg-emerald-600 px-3.5 py-2 text-sm font-semibold leading-tight text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md inline-flex items-center justify-center gap-2"
                      >
                          <Wallet className="w-4 h-4 shrink-0" />
                          <span className="text-center">Быстрая оплата</span>
                      </button>
                      <button
                          onClick={async () => {
                            setShowTempWorkerReportModal(true);
                            if (!tempWorkerLogs.length) await fetchTempWorkerLogs();
                          }}
                          className="min-h-[44px] w-full 2xl:w-auto rounded-2xl border border-sky-600 bg-sky-600 px-3.5 py-2 text-sm font-semibold leading-tight text-white shadow-sm transition-all hover:bg-sky-700 hover:shadow-md inline-flex items-center justify-center gap-2"
                      >
                          <FileText className="w-4 h-4 shrink-0" />
                          <span className="text-center">Отчет</span>
                      </button>
                      <button
                          onClick={async () => {
                            setShowDeliveryModal(true);
                            await loadDeliveryData();
                          }}
                          className="min-h-[44px] w-full 2xl:w-auto rounded-2xl border border-orange-500 bg-orange-500 px-3.5 py-2 text-sm font-semibold leading-tight text-white shadow-sm transition-all hover:bg-orange-600 hover:shadow-md inline-flex items-center justify-center gap-2"
                      >
                          <Truck className="w-4 h-4 shrink-0" />
                          <span className="text-center">Доставка</span>
                      </button>
                      <button
                          onClick={() => { setTempWorkerLines([makeTempLine()]); setShowTempWorkerModal(true); }}
                          disabled={!hasAssemblyButtonAccess('temp_shift_add')}
                          className={`min-h-[44px] w-full 2xl:w-auto rounded-2xl bg-indigo-600 px-3.5 py-2 text-sm font-semibold leading-tight text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md inline-flex items-center justify-center gap-2 ${!hasAssemblyButtonAccess('temp_shift_add') ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                          <Plus className="w-4 h-4 shrink-0" />
                          <span className="text-center">Добавить смену</span>
                      </button>
                      <button
                          onClick={() => setShowTempWorkerHistory(false)}
                          className="fixed right-4 top-4 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md hover:bg-slate-50 md:static md:h-auto md:w-auto md:rounded-lg md:border-0 md:bg-transparent md:shadow-none md:p-2"
                          aria-label="Закрыть окно истории"
                      >
                          <X className="h-6 w-6 text-slate-500" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="px-3 pt-3 md:px-6 md:pt-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="group relative overflow-hidden rounded-3xl border border-rose-100 bg-white p-4 shadow-sm ring-1 ring-rose-50">
                      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-rose-100 blur-2xl transition-transform group-hover:scale-125" />
                      <div className="relative flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-rose-500">Не оплачено всего</div>
                          {tempWorkerMetaLoaded ? (
                            <div className="mt-2 text-2xl font-black text-slate-950 md:text-3xl">{tempUnpaidBySupplier.total.toFixed(2)} ₽</div>
                          ) : (
                            <div className="mt-2 h-8 w-28 animate-pulse rounded-lg bg-rose-100 md:h-9" />
                          )}
                          <div className="mt-1 text-xs text-slate-500">Суммарный остаток по сменам</div>
                        </div>
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
                          <Wallet className="h-5 w-5" />
                        </div>
                      </div>
                    </div>

                    <div className="group relative overflow-hidden rounded-3xl border border-amber-100 bg-white p-4 shadow-sm ring-1 ring-amber-50">
                      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-100 blur-2xl transition-transform group-hover:scale-125" />
                      <div className="relative flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-amber-600">Не оплаченных смен</div>
                          {tempWorkerMetaLoaded ? (
                            <div className="mt-2 text-2xl font-black text-slate-950 md:text-3xl">{tempUnpaidBySupplier.shifts}</div>
                          ) : (
                            <div className="mt-2 h-8 w-16 animate-pulse rounded-lg bg-amber-100 md:h-9" />
                          )}
                          <div className="mt-1 text-xs text-slate-500">Записи, ожидающие оплаты</div>
                        </div>
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                          <Clock className="h-5 w-5" />
                        </div>
                      </div>
                    </div>

                    <div className="group relative overflow-hidden rounded-3xl border border-indigo-100 bg-white p-4 shadow-sm ring-1 ring-indigo-50">
                      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-indigo-100 blur-2xl transition-transform group-hover:scale-125" />
                      <div className="relative flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Поставщиков с долгом</div>
                          {tempWorkerMetaLoaded ? (
                            <div className="mt-2 text-2xl font-black text-slate-950 md:text-3xl">{tempUnpaidBySupplier.rows.length}</div>
                          ) : (
                            <div className="mt-2 h-8 w-12 animate-pulse rounded-lg bg-indigo-100 md:h-9" />
                          )}
                          <div className="mt-1 text-xs text-slate-500">Контрагенты с открытым остатком</div>
                        </div>
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                          <Users className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {tempWorkerMetaLoaded && tempUnpaidBySupplier.rows.length > 0 && (
                  <div className="md:hidden my-3 px-3 overflow-x-auto">
                    <div className="flex gap-2 min-w-max pb-1">
                      {tempUnpaidBySupplier.rows.map((r) => (
                        <div key={`temp-unpaid-mobile-${r.supplierId || 'none'}`} className="w-[220px] shrink-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                          <div className="text-sm font-medium text-slate-900 truncate" title={r.supplierName}>{r.supplierName}</div>
                          <div className="mt-1 text-xs text-slate-500">Смен: {r.shifts}</div>
                          <div className="mt-2 text-sm font-bold text-rose-700">{r.amount.toFixed(2)} ₽</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {tempWorkerMetaLoaded && tempUnpaidBySupplier.rows.length > 0 && (
                  <div className="mx-3 my-4 hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:mx-6 md:block">
                    <div className="text-sm font-semibold text-slate-800 mb-2">Не оплачено по поставщикам</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                      {tempUnpaidBySupplier.rows.map((r) => (
                        <div key={`temp-unpaid-${r.supplierId || 'none'}`} className="border rounded-lg p-2 bg-slate-50 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-slate-900 truncate" title={r.supplierName}>{r.supplierName}</div>
                            <div className="text-xs text-slate-500">Смен: {r.shifts}</div>
                          </div>
                          <div className="text-sm font-bold text-rose-700 whitespace-nowrap">{r.amount.toFixed(2)} ₽</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="px-3 md:px-6 pb-6 2xl:flex-1 2xl:overflow-y-auto custom-scrollbar">
                  {/* Деньги на складе */}
                  <div className="mb-5">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"><Wallet className="h-4 w-4" /></span>
                      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">Деньги на складе</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
                      {WAREHOUSE_MONEY_OWNERS.map(renderWarehouseMoneyCard)}
                    </div>
                  </div>

                  {/* Записи смен + фильтры */}
                  <div className="mb-3 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100"><History className="h-4 w-4" /></span>
                      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">Записи смен</h3>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">{filteredTempWorkerLogs.length}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:w-auto xl:max-w-2xl xl:flex-1">
                      <Select value={tempWorkerSupplierFilter} onChange={(e) => setTempWorkerSupplierFilter(e.target.value)} className="oc-input">
                        <option value="all">Все поставщики</option>
                        {suppliers.map((s) => (
                          <option key={`temp-filter-s-${s.id}`} value={String(s.id)}>{s.name}</option>
                        ))}
                      </Select>
                      <Select value={tempWorkerPaidFilter} onChange={(e) => setTempWorkerPaidFilter(e.target.value as 'all' | 'paid' | 'unpaid')} className="oc-input">
                        <option value="all">Все статусы оплаты</option>
                        <option value="paid">Оплачено</option>
                        <option value="unpaid">Не оплачено</option>
                      </Select>
                      <Select value={tempWorkerDateSort} onChange={(e) => setTempWorkerDateSort(e.target.value as 'desc' | 'asc')} className="oc-input">
                        <option value="desc">Сначала новые</option>
                        <option value="asc">Сначала старые</option>
                      </Select>
                    </div>
                  </div>
                    <div className="md:hidden space-y-2">
                      {filteredTempWorkerLogs.map((log) => {
                        const supplier = suppliers.find(s => s.id === log.supplier_id);
                        const creator = employees.find(e => e.id === log.created_by);
                        return (
                          <div key={`temp-mobile-${log.id}`} className="border rounded-xl p-3 bg-white shadow-sm">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">{supplier?.name || '-'}</div>
                                <div className="text-xs text-slate-500">{log?.date ? new Date(log.date).toLocaleDateString('ru-RU') : '-'}</div>
                              </div>
                              <div className="text-sm font-bold text-green-600">
                                {log.earnings} ₽
                                {getTempWorkerPaidAmount(log) > 0 && Number(log.earnings || 0) !== getTempWorkerPaidAmount(log) && (
                                  <span className="ml-1 text-[10px] text-emerald-700">/ оплачено {getTempWorkerPaidAmount(log).toFixed(2)} ₽</span>
                                )}
                              </div>
                            </div>
                            <div className="mt-2 text-sm text-slate-800">{log.worker_name || log.worker || '-'}</div>
                            <div className="text-xs text-slate-600 mt-1 font-medium">{tempTypeQty(log)}</div>
                            <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                              <span>{log.hours} ч.</span>
                              <span>{creator?.full_name || '-'}</span>
                            </div>
                            <div className="mt-3 flex items-center justify-between gap-2">
                              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={getTempWorkerRemainingAmount(log) <= 0}
                                  onChange={(e) => {
                                    const next = e.target.checked;
                                    if (next) setTempWorkerPaymentModal({ open: true, logId: String(log.id), mode: 'pay', supplierId: '', amount: '', error: '' });
                                    else handleToggleTempWorkerPaid(log.id, false, null);
                                  }}
                                  className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                                />
                                <span className={`text-xs font-medium ${getTempWorkerRemainingAmount(log) <= 0 ? 'text-green-700' : 'text-slate-500'}`}>{getTempWorkerRemainingAmount(log) <= 0 ? 'Оплачено' : 'Не оплачено'}</span>
                                {getTempWorkerPaidAmount(log) > 0 && (
                                  <span className="text-[10px] text-emerald-700">Оплачено: {getTempWorkerPaidAmount(log).toFixed(2)} ₽</span>
                                )}
                                {getTempWorkerPaymentsSummary(log).map((p) => (
                                  <span key={`temp-pay-mobile-${log.id}-${p.supplierId}`} className="text-[10px] text-slate-500">{p.supplierName}: {p.amount.toFixed(2)} ₽</span>
                                ))}
                              </label>
                              <div className="flex items-center gap-1 flex-wrap justify-end">
                                {getTempWorkerRemainingAmount(log) > 0 && getTempWorkerPaidAmount(log) > 0 && (
                                  <button
                                    onClick={() => setTempWorkerPaymentModal({ open: true, logId: String(log.id), mode: 'extra', supplierId: '', amount: '', error: '' })}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                                  >
                                    Доплата
                                  </button>
                                )}
                                {getTempWorkerPaidAmount(log) > 0 && (
                                  <button
                                    onClick={() => handleOpenEditTempWorkerPayment(log)}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-violet-700 hover:bg-violet-50 rounded-lg transition-colors"
                                  >
                                    Изм. оплату
                                  </button>
                                )}
                                <button
                                  onClick={() => handleOpenEditTempWorkerLog(log)}
                                  disabled={!hasAssemblyButtonAccess('temp_shift_edit')}
                                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors ${!hasAssemblyButtonAccess('temp_shift_edit') ? 'opacity-40 cursor-not-allowed' : ''}`}
                                >
                                  <Pencil className="h-3.5 w-3.5" /> Ред.
                                </button>
                                <button
                                  onClick={() => handleDeleteTempWorkerLog(log.id)}
                                  disabled={!hasAssemblyButtonAccess('temp_shift_delete')}
                                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors ${!hasAssemblyButtonAccess('temp_shift_delete') ? 'opacity-40 cursor-not-allowed' : ''}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Удалить
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {filteredTempWorkerLogs.length === 0 && (
                      <div className="md:hidden p-10 text-center text-slate-400">История пуста</div>
                    )}

                    <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <table className="min-w-[1060px] w-full text-left border-collapse text-sm">
                        <thead className="bg-slate-50 sticky top-0 z-10">
                            <tr>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Дата</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Поставщик</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Имя рабочего</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Тип/Кол-во</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Часы</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Заработок</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Оплата</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Создал</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTempWorkerLogs.map(log => {
                                const supplier = suppliers.find(s => s.id === log.supplier_id);
                                const creator = employees.find(e => e.id === log.created_by);
                                return (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 text-slate-900">{log?.date ? new Date(log.date).toLocaleDateString('ru-RU') : '-'}</td>
                                        <td className="p-4 text-slate-900 font-medium">{supplier?.name || '-'}</td>
                                        <td className="p-4 text-slate-900">{log.worker_name || log.worker || '-'}</td>
                                        <td className="p-4 text-slate-600 max-w-[260px] truncate font-medium" title={tempTypeQty(log)}>{tempTypeQty(log)}</td>
                                        <td className="p-4 text-slate-600">{log.hours} ч.</td>
                                        <td className="p-4 font-bold text-green-600">
                                          {log.earnings} ₽
                                          {getTempWorkerPaidAmount(log) > 0 && Number(log.earnings || 0) !== getTempWorkerPaidAmount(log) && (
                                            <span className="ml-2 text-xs text-emerald-700">оплачено {getTempWorkerPaidAmount(log).toFixed(2)} ₽</span>
                                          )}
                                        </td>
                                        <td className="p-4">
                                          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                              type="checkbox"
                                              checked={getTempWorkerRemainingAmount(log) <= 0}
                                              onChange={(e) => {
                                                const next = e.target.checked;
                                                if (next) setTempWorkerPaymentModal({ open: true, logId: String(log.id), mode: 'pay', supplierId: '', amount: '', error: '' });
                                                else handleToggleTempWorkerPaid(log.id, false, null);
                                              }}
                                              className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                                            />
                                            <div className="flex flex-col">
                                              <span className={`text-sm font-medium ${getTempWorkerRemainingAmount(log) <= 0 ? 'text-green-700' : 'text-slate-500'}`}>
                                                {getTempWorkerRemainingAmount(log) <= 0 ? 'Оплачено' : 'Не оплачено'}
                                              </span>
                                              {getTempWorkerPaidAmount(log) > 0 && (
                                                <span className="text-[10px] text-emerald-700">Оплачено: {getTempWorkerPaidAmount(log).toFixed(2)} ₽</span>
                                              )}
                                              {getTempWorkerPaidAmount(log) > 0 && (
                                                <button onClick={() => handleOpenEditTempWorkerPayment(log)} className="mt-1 text-[10px] text-violet-700 hover:text-violet-900 text-left">Редактировать оплату</button>
                                              )}
                                              {getTempWorkerPaymentsSummary(log).map((p) => (
                                                <span key={`temp-pay-table-${log.id}-${p.supplierId}`} className="text-[10px] text-slate-500">{p.supplierName}: {p.amount.toFixed(2)} ₽</span>
                                              ))}
                                            </div>
                                          </label>
                                        </td>
                                        <td className="p-4 text-slate-500 text-sm">{creator?.full_name || '-'}</td>
                                        <td className="p-4 text-right">
                                          <div className="inline-flex items-center gap-2">
                                            <button
                                              onClick={() => handleOpenEditTempWorkerLog(log)}
                                              disabled={!hasAssemblyButtonAccess('temp_shift_edit')}
                                              className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors ${!hasAssemblyButtonAccess('temp_shift_edit') ? 'opacity-40 cursor-not-allowed' : ''}`}
                                              title="Редактировать"
                                            >
                                              <Pencil className="h-4 w-4" />
                                              Ред.
                                            </button>
                                            <button
                                              onClick={() => handleDeleteTempWorkerLog(log.id)}
                                              disabled={!hasAssemblyButtonAccess('temp_shift_delete')}
                                              className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors ${!hasAssemblyButtonAccess('temp_shift_delete') ? 'opacity-40 cursor-not-allowed' : ''}`}
                                              title="Удалить"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                              Удалить
                                            </button>
                                          </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredTempWorkerLogs.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                            <Clock className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <p>История пуста</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    </div>
                </div>
              </div>
            </div>
  );
}
