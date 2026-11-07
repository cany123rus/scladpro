// Вынесено из Dashboard.tsx автоматически (ленивая загрузка раздела). Данные приходят пропсами из Dashboard.
/* eslint-disable */
import { Calendar, FileSpreadsheet, Wallet, Package, ShoppingCart, Send, FileText, Plus, History, RefreshCw, Pencil, Trash2, Save, X, ChevronLeft, ChevronRight, ArrowLeft, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getSafeId, normalizeRoleKey } from '../dashboardHelpers';
import { Select } from '../../components/ui/Select';
import { QtyField } from '../../components/ui/QtyField';
import { confirmDialog } from '../../components/ConfirmDialog';
import { SearchSelect } from '../../components/ui/SearchSelect';
import { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { PickingSheetPicker, commitPickingLinks } from '../../components/PickingSheetPicker';

export function Tab_completed(props: any) {
  const [pickSheetOpen, setPickSheetOpen] = useState(false);
  const { CW_TIME_RATE_KEY, adjustBoxStock, boxAdjustValue, boxStock, completedWorkStep, currentEmployee, cwForm, cwFormItems, cwPackagingRateForm, cwPackagingRates, cwPurchaseForm, cwPurchaseHistory, cwPurchaseHistorySupplierFilter, cwPurchaseOtherRows, cwPurchaseRows, cwRateBulkModal, cwRateForm, cwRateHistoryModal, cwReportDatePickerMonth, cwReportDatePickerOpen, cwReportExcludedDates, cwReportForm, cwReportModalOpen, cwReportPickingEnd, cwReportResult, cwSelectedDate, cwSelectedEmployee, cwSelectedPeriod, cwWorkLogs, cwWorkRateEmployeePrices, cwWorkRateHistory, cwWorkRateSnapshots, cwWorkRates, editingPackagingId, editingWorkLogId, employees, ensureCwTimeRateId, fetchCwPurchaseHistory, fetchTempWorkerLogs, getCwRateEmployeeConfig, getCwTimeRatePrice, getDatesInRange, getEffectiveWorkRatePrice, getWorkLogSnapshotPrice, handleDeleteWorkLog, handleDownloadCwReportExcel, handleDownloadCwReportPdf, handleSendEmployeeReport, hasAssemblyButtonAccess, inlineRateEdit, isCalendarEmployeeVisible, isEmployeeOnline, isTimeBasedWorkRate, loadBoxStock, loadCwWorkRateEmployeePrices, loadDeliveryData, loadEmployeeSchedule, loadTempWorkerMeta, logAssemblyChange, mskTodayYmd, openSalaryPayModal, packagingTypeTemplates, saveCwRateEmployeeConfig, setBoxAdjustValue, setCompletedWorkStep, setCwForm, setCwFormItems, setCwPackagingRateForm, setCwPackagingRates, setCwPurchaseEdit, setCwPurchaseForm, setCwPurchaseHistorySupplierFilter, setCwPurchaseOtherRows, setCwPurchaseRows, setCwRateBulkModal, setCwRateForm, setCwRateHistoryModal, setCwReportDatePickerMonth, setCwReportDatePickerOpen, setCwReportExcludedDates, setCwReportForm, setCwReportModalOpen, setCwReportPickingEnd, setCwReportResult, setCwScheduleEmployeeId, setCwScheduleInlineError, setCwScheduleModalOpen, setCwScheduleMonth, setCwSelectedDate, setCwSelectedEmployee, setCwSelectedPeriod, setCwWorkLogs, setCwWorkRateEmployeePrices, setCwWorkRateHistory, setCwWorkRateSnapshots, setCwWorkRates, setEditingPackagingId, setEditingWorkLogId, setInlineRateEdit, setPackagingNewTemplate, setShowGeneralReportModal, setShowPackagingTemplateModal, setShowPalletModal, setShowTempWorkerHistory, showToast, submitWorkRate, suppliers, telegramBotToken } = props;
  return (
<div className="max-w-6xl mx-auto px-3 sm:px-4">
              <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 rounded-2xl p-4 sm:p-6 mb-6 shadow-xl border border-white/10">
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Выполненная работа</h1>
                </div>
                <div className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:w-auto 2xl:grid-cols-8 gap-2 bg-white/10 p-1.5 rounded-xl border border-white/15 backdrop-blur-sm">
                  {hasAssemblyButtonAccess('cw_tab_calendar') && (
                  <button
                    onClick={() => setCompletedWorkStep('CALENDAR')}
                    className={`inline-flex min-h-[44px] min-w-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-center text-sm font-medium leading-tight transition-all active:scale-[0.97] ${completedWorkStep === 'CALENDAR' || completedWorkStep === 'FORM' ? 'bg-white text-slate-900 shadow-md' : 'text-indigo-100/90 hover:text-white hover:bg-white/10'}`}
                  >
                    <Calendar className="h-4 w-4 shrink-0" /> Календарь
                  </button>
                  )}
                  {hasAssemblyButtonAccess('cw_general_report_open') && (
                  <button
                    onClick={() => {
                      fetchTempWorkerLogs();
                      loadTempWorkerMeta();
                      loadDeliveryData();
                      setShowGeneralReportModal(true);
                    }}
                    className="inline-flex min-h-[44px] min-w-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-center text-sm font-medium leading-tight transition-all active:scale-[0.97] text-indigo-100/90 hover:text-white hover:bg-white/10"
                  >
                    <FileSpreadsheet className="h-4 w-4 shrink-0" /> Общий отчет
                  </button>
                  )}
                  {hasAssemblyButtonAccess('cw_tab_rates') && (
                  <button
                    onClick={() => setCompletedWorkStep('RATES')}
                    className={`inline-flex min-h-[44px] min-w-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-center text-sm font-medium leading-tight transition-all active:scale-[0.97] ${completedWorkStep === 'RATES' ? 'bg-white text-slate-900 shadow-md' : 'text-indigo-100/90 hover:text-white hover:bg-white/10'}`}
                  >
                    <Wallet className="h-4 w-4 shrink-0" /> Расценки
                  </button>
                  )}
                  {hasAssemblyButtonAccess('cw_tab_packaging') && (
                  <button
                    onClick={() => setCompletedWorkStep('PACKAGING')}
                    className={`inline-flex min-h-[44px] min-w-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-center text-sm font-medium leading-tight transition-all active:scale-[0.97] ${completedWorkStep === 'PACKAGING' ? 'bg-white text-slate-900 shadow-md' : 'text-indigo-100/90 hover:text-white hover:bg-white/10'}`}
                  >
                    <Package className="h-4 w-4 shrink-0" /> Упаковка
                  </button>
                  )}
                  {hasAssemblyButtonAccess('cw_tab_purchase') && (
                  <button
                    onClick={() => setCompletedWorkStep('PURCHASE')}
                    className={`inline-flex min-h-[44px] min-w-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-center text-sm font-medium leading-tight transition-all active:scale-[0.97] ${completedWorkStep === 'PURCHASE' ? 'bg-white text-slate-900 shadow-md' : 'text-indigo-100/90 hover:text-white hover:bg-white/10'}`}
                  >
                    <ShoppingCart className="h-4 w-4 shrink-0" /> Закуп
                  </button>
                  )}
                  {hasAssemblyButtonAccess('cw_send_report') && (
                  <button
                    onClick={handleSendEmployeeReport}
                    className="min-h-[44px] min-w-0 px-3 py-2 rounded-lg text-sm font-medium text-emerald-100 hover:text-white hover:bg-emerald-500/20 inline-flex items-center justify-center gap-1.5 leading-tight text-center transition-all active:scale-[0.97]"
                    title="Отправить отчет сотруднику в Telegram"
                  >
                    <Send className="h-4 w-4 shrink-0" />
                    <span className="leading-none">Отчет</span>
                  </button>
                  )}
                  {hasAssemblyButtonAccess('cw_report_open') && (
                  <button
                    onClick={() => {
                      setCwReportModalOpen(true);
                      setCwReportResult(null);
                    }}
                    className="inline-flex min-h-[44px] min-w-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium leading-tight text-indigo-100 hover:text-white hover:bg-white/10 transition-all active:scale-[0.97]"
                  >
                    <FileText className="h-4 w-4 shrink-0" /> Отчет
                  </button>
                  )}
                </div>
              </div>
            </div>

              {completedWorkStep === 'RATES' && (
                <>
                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 text-white">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15"><Wallet className="h-5 w-5" /></div>
                    <div>
                      <h3 className="font-bold text-lg leading-tight">Расценки на работы</h3>
                      <p className="text-xs text-indigo-100">Цена за единицу — общая или индивидуально по сотрудникам</p>
                    </div>
                  </div>
                  <div className="p-5">
                  <div className="mb-5 grid grid-cols-1 sm:grid-cols-[1fr_160px_auto] gap-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Название работы / товара</label>
                      <input type="text" placeholder="Напр. ФБО, Упаковка…" value={cwRateForm.name} onChange={e => setCwRateForm({...cwRateForm, name: e.target.value})} className="oc-input w-full" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Цена за шт. (₽)</label>
                      <input type="number" step="0.01" placeholder="0" value={cwRateForm.price} onChange={e => setCwRateForm({...cwRateForm, price: e.target.value})} className="oc-input w-full" />
                    </div>
                    <div className="flex items-end">
                    <button
                      onClick={() => submitWorkRate(undefined, undefined, null)}
                      disabled={!hasAssemblyButtonAccess('cw_rates_save')}
                      className={`h-11 px-5 rounded-xl font-semibold text-white shadow-sm inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 ${!hasAssemblyButtonAccess('cw_rates_save') ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Plus className="h-4 w-4" /> Добавить
                    </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {cwWorkRates.map(rate => {
                      const rateConfig = getCwRateEmployeeConfig(String(rate.id));
                      const activeEmployees = employees.filter((employee: any) => !employee?.deleted_at);
                      return (
                        <div key={rate.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow space-y-3">
                          <div className="flex justify-between items-start gap-3 flex-wrap">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold">{String(rate.name || '?').slice(0, 1).toUpperCase()}</div>
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-900 truncate">{rate.name}</div>
                                <div className="text-xs text-slate-500">{rateConfig.useSharedPrice ? 'Одна цена для всех' : 'Индивидуальные цены по сотрудникам'}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap justify-end">
                              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700 ring-1 ring-emerald-100">{rateConfig.useSharedPrice ? `${rate.price} ₽` : 'По сотрудникам'}</span>
                              <button
                                onClick={() => setCwRateHistoryModal({ open: true, rateId: String(rate.id), rateName: String(rate.name || '') })}
                                className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200"
                              >
                                <History className="h-3.5 w-3.5" /> История
                              </button>
                              <button
                                onClick={() => setCwRateBulkModal({ open: true, rateId: String(rate.id), rateName: String(rate.name || ''), oldPrice: String(rate.price || ''), price: String(rate.price || ''), start: mskTodayYmd(), end: mskTodayYmd() })}
                                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 text-xs px-2.5 py-1.5 rounded-lg border border-indigo-200"
                              >
                                <RefreshCw className="h-3.5 w-3.5" /> Обновить
                              </button>
                              <button
                                onClick={() => setInlineRateEdit(inlineRateEdit?.id === String(rate.id) ? null : { id: String(rate.id), name: String(rate.name || ''), price: String(rate.price ?? '') })}
                                className={`inline-flex items-center justify-center h-8 w-8 rounded-lg ${inlineRateEdit?.id === String(rate.id) ? 'bg-blue-100 text-blue-700' : 'text-blue-600 hover:bg-blue-50'}`}
                                title="Редактировать"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button onClick={async () => {
                                if (!hasAssemblyButtonAccess('cw_rates_delete')) return;
                                const before = { ...rate };
                                await supabase.from('work_rates').update({ deleted_at: new Date().toISOString() }).eq('id', rate.id);
                                await supabase.from('employee_work_rates').delete().eq('work_rate_id', rate.id);
                                const nextRateSettings = { ...(cwWorkRateEmployeePrices || {}) };
                                delete nextRateSettings[String(rate.id)];
                                setCwWorkRateEmployeePrices(nextRateSettings);
                                await logAssemblyChange('work_rates', 'delete', before, null);
                                const { data } = await supabase.from('work_rates').select('*').is('deleted_at', null);
                                setCwWorkRates(data || []);
                                await loadCwWorkRateEmployeePrices(data || []);
                              }} disabled={!hasAssemblyButtonAccess('cw_rates_delete')} className={`text-red-500 hover:text-red-700 ${!hasAssemblyButtonAccess('cw_rates_delete') ? 'opacity-40 cursor-not-allowed' : ''}`}><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </div>

                          {inlineRateEdit?.id === String(rate.id) && (
                            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3">
                              <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_auto_auto] gap-2 items-end">
                                <div>
                                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Название</label>
                                  <input type="text" value={inlineRateEdit.name} onChange={(e) => setInlineRateEdit((p) => p ? { ...p, name: e.target.value } : p)} className="oc-input w-full" />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Цена за шт. (₽)</label>
                                  <input type="number" step="0.01" value={inlineRateEdit.price} onChange={(e) => setInlineRateEdit((p) => p ? { ...p, price: e.target.value } : p)} className="oc-input w-full" />
                                </div>
                                <button type="button" disabled={!hasAssemblyButtonAccess('cw_rates_save')} onClick={async () => { await submitWorkRate(inlineRateEdit.name, inlineRateEdit.price, inlineRateEdit.id); setInlineRateEdit(null); showToast('Расценка обновлена', 'success'); }} className={`h-11 px-4 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 inline-flex items-center gap-2 ${!hasAssemblyButtonAccess('cw_rates_save') ? 'opacity-50 cursor-not-allowed' : ''}`}><Save className="h-4 w-4" /> Сохранить</button>
                                <button type="button" onClick={() => setInlineRateEdit(null)} className="h-11 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50">Отмена</button>
                              </div>
                            </div>
                          )}

                          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <input
                              type="checkbox"
                              checked={rateConfig.useSharedPrice}
                              onChange={async (e) => {
                                await saveCwRateEmployeeConfig(String(rate.id), {
                                  useSharedPrice: e.target.checked,
                                  employeePrices: { ...(rateConfig.employeePrices || {}) },
                                });
                                showToast(e.target.checked ? 'Включена одна цена для всех' : 'Включены цены по сотрудникам', 'success');
                              }}
                              className="h-4 w-4"
                            />
                            Одна цена для всех
                          </label>

                          {!rateConfig.useSharedPrice && (
                            <div className="border border-dashed border-slate-200 rounded-xl bg-white p-3 space-y-3">
                              {activeEmployees.length === 0 ? (
                                <div className="text-sm text-slate-500">Нет активных сотрудников для настройки индивидуальных цен.</div>
                              ) : (
                                <>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextEmployeePrices = { ...(rateConfig.employeePrices || {}) };
                                        activeEmployees.forEach((employee: any) => {
                                          const key = String(employee.id || '');
                                          if (!key) return;
                                          const currentValue = String(nextEmployeePrices[key] ?? '').trim();
                                          if (!currentValue) nextEmployeePrices[key] = String(rate.price ?? '');
                                        });
                                        setCwWorkRateEmployeePrices(prev => ({
                                          ...(prev || {}),
                                          [String(rate.id)]: {
                                            useSharedPrice: false,
                                            employeePrices: nextEmployeePrices,
                                          },
                                        }));
                                      }}
                                      className="px-3 py-2 rounded-lg border border-slate-200 text-sm hover:bg-slate-50"
                                    >
                                      Заполнить пустые общей ценой
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextEmployeePrices = { ...(rateConfig.employeePrices || {}) };
                                        activeEmployees.forEach((employee: any) => {
                                          const key = String(employee.id || '');
                                          if (!key) return;
                                          nextEmployeePrices[key] = String(rate.price ?? '');
                                        });
                                        setCwWorkRateEmployeePrices(prev => ({
                                          ...(prev || {}),
                                          [String(rate.id)]: {
                                            useSharedPrice: false,
                                            employeePrices: nextEmployeePrices,
                                          },
                                        }));
                                      }}
                                      className="px-3 py-2 rounded-lg border border-indigo-200 text-sm text-indigo-700 hover:bg-indigo-50"
                                    >
                                      Скопировать общую цену всем
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {activeEmployees.map((employee: any) => (
                                      <div key={`rate-employee-${rate.id}-${employee.id}`} className="rounded-lg border border-slate-200 p-3">
                                        <div className="text-sm font-medium text-slate-800 mb-2">{employee.full_name || employee.login || `#${employee.id}`}</div>
                                        <input
                                          type="number"
                                          step="0.01"
                                          placeholder={`По умолчанию: ${rate.price}`}
                                          value={String(rateConfig.employeePrices[String(employee.id)] ?? '')}
                                          onChange={(e) => {
                                            const value = e.target.value;
                                            setCwWorkRateEmployeePrices(prev => ({
                                              ...(prev || {}),
                                              [String(rate.id)]: {
                                                useSharedPrice: false,
                                                employeePrices: {
                                                  ...(((prev || {})[String(rate.id)] as any)?.employeePrices || {}),
                                                  [String(employee.id)]: value,
                                                },
                                              },
                                            }));
                                          }}
                                          className="oc-input"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </>
                              )}
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await saveCwRateEmployeeConfig(String(rate.id), {
                                      useSharedPrice: false,
                                      employeePrices: { ...(cwWorkRateEmployeePrices[String(rate.id)]?.employeePrices || {}) },
                                    });
                                    showToast('Цены сотрудников сохранены', 'success');
                                  }}
                                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                                >
                                  Сохранить цены сотрудников
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  </div>
                </div>

                {cwRateHistoryModal.open && (
                  <div className="fixed inset-0 z-[90] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setCwRateHistoryModal({ open: false, rateId: '', rateName: '' })}>
                    <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="text-lg font-bold">История расценки</div>
                          <div className="text-sm text-slate-500">{cwRateHistoryModal.rateName || '-'}</div>
                        </div>
                        <button onClick={() => setCwRateHistoryModal({ open: false, rateId: '', rateName: '' })} className="p-2 hover:bg-slate-100 rounded-lg"><X className="h-5 w-5" /></button>
                      </div>
                      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                        {(cwWorkRateHistory[cwRateHistoryModal.rateId] || []).length === 0 ? (
                          <div className="text-sm text-slate-500">История изменений пока пустая.</div>
                        ) : (
                          (cwWorkRateHistory[cwRateHistoryModal.rateId] || []).slice().reverse().map((row, idx) => (
                            <div key={`rate-h-${idx}`} className="border rounded-xl p-3 bg-slate-50 flex items-center justify-between gap-3">
                              <div>
                                <div className="text-sm text-slate-700">{new Date(row.changed_at).toLocaleString('ru-RU')}</div>
                                {row?.name ? <div className="text-xs text-slate-500">{row.name}</div> : null}
                              </div>
                              <div className="text-right">
                                {(row.old_price ?? null) !== null && (row.new_price ?? null) !== null && Number(row.old_price) !== Number(row.new_price) ? (
                                  <>
                                    <div className="text-xs text-slate-500">{Number(row.old_price || 0).toLocaleString('ru-RU')} ₽ → {Number(row.new_price || 0).toLocaleString('ru-RU')} ₽</div>
                                    <div className="font-bold text-indigo-700">Новая: {Number(row.new_price || row.price || 0).toLocaleString('ru-RU')} ₽</div>
                                  </>
                                ) : (
                                  <div className="font-bold text-indigo-700">{Number(row.new_price || row.price || 0).toLocaleString('ru-RU')} ₽</div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {cwRateBulkModal.open && (
                  <div className="fixed inset-0 z-[90] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setCwRateBulkModal({ open: false, rateId: '', rateName: '', oldPrice: '', price: '', start: mskTodayYmd(), end: mskTodayYmd() })}>
                    <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="text-lg font-bold">Обновить цену с даты</div>
                          <div className="text-sm text-slate-500">{cwRateBulkModal.rateName || '-'}</div>
                        </div>
                        <button onClick={() => setCwRateBulkModal({ open: false, rateId: '', rateName: '', oldPrice: '', price: '', start: mskTodayYmd(), end: mskTodayYmd() })} className="p-2 hover:bg-slate-100 rounded-lg"><X className="h-5 w-5" /></button>
                      </div>
                      <div className="space-y-3">
                        <div className="text-sm text-slate-500">Текущая цена: <span className="font-semibold text-slate-700">{cwRateBulkModal.oldPrice || '0'} ₽</span></div>
                        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                          Записи в календаре с выбранной даты будут пересчитаны на новую цену. Более ранние записи останутся по старой цене.
                        </div>
                        <input value={cwRateBulkModal.price} onChange={(e) => setCwRateBulkModal(prev => ({ ...prev, price: e.target.value }))} type="number" placeholder="Новая цена" className="oc-input" />
                        <div className="grid grid-cols-1 gap-3">
                          <input value={cwRateBulkModal.start} onChange={(e) => setCwRateBulkModal(prev => ({ ...prev, start: e.target.value }))} type="date" className="oc-input" />
                        </div>
                        <button
                          onClick={async () => {
                            const newPrice = Number(cwRateBulkModal.price || 0);
                            if (!cwRateBulkModal.rateId || newPrice <= 0 || !cwRateBulkModal.start) return;
                            const rateId = String(cwRateBulkModal.rateId);
                            const startStr = String(cwRateBulkModal.start);
                            const oldPrice = Number(cwRateBulkModal.oldPrice || 0);

                            const nextRateHistory = { ...(cwWorkRateHistory || {}) } as Record<string, Array<{ changed_at: string; price: number; old_price?: number | null; new_price?: number | null; name?: string }>>;
                            const currentHistory = Array.isArray(nextRateHistory[rateId]) ? nextRateHistory[rateId] : [];
                            nextRateHistory[rateId] = [...currentHistory, { changed_at: new Date().toISOString(), price: newPrice, old_price: oldPrice, new_price: newPrice, name: `${cwRateBulkModal.rateName} (с ${new Date(`${startStr}T00:00:00`).toLocaleDateString('ru-RU')})` }];
                            setCwWorkRateHistory(nextRateHistory);
                            await supabase.from('app_settings').upsert([{ key: 'cw_work_rate_history_v1', value: JSON.stringify(nextRateHistory) }], { onConflict: 'key' });

                            // Пересчёт календаря: записям с выбранной даты ставим новую цену
                            // (с учётом индивидуальной цены сотрудника), более ранние без снимка
                            // фиксируем по старой цене, чтобы смена базовой цены их не сдвинула.
                            const cfg = getCwRateEmployeeConfig(rateId);
                            const effFor = (empId: string) => {
                              if (cfg.useSharedPrice) return newPrice;
                              const ep = (cfg.employeePrices as any)[String(empId || '')];
                              if (ep === '' || ep === null || ep === undefined) return newPrice;
                              const n = Number(ep);
                              return Number.isFinite(n) ? n : newPrice;
                            };
                            const { data: rateLogs } = await supabase.from('work_logs')
                              .select('id, date, employee_id')
                              .eq('work_rate_id', rateId)
                              .is('deleted_at', null);
                            const nextSnapshots = { ...(cwWorkRateSnapshots || {}) } as Record<string, number>;
                            let recalced = 0;
                            (rateLogs || []).forEach((log: any) => {
                              const id = String(log?.id || '');
                              const dk = String(log?.date || '').slice(0, 10);
                              if (!id || !dk) return;
                              if (dk >= startStr) {
                                nextSnapshots[id] = effFor(String(log?.employee_id || ''));
                                recalced += 1;
                              } else if (!(id in nextSnapshots) && oldPrice > 0) {
                                nextSnapshots[id] = oldPrice;
                              }
                            });
                            setCwWorkRateSnapshots(nextSnapshots);
                            await supabase.from('app_settings').upsert([{ key: 'cw_work_rate_snapshots_v1', value: JSON.stringify(nextSnapshots) }], { onConflict: 'key' });

                            await supabase.from('work_rates').update({ price: newPrice }).eq('id', rateId);
                            const { data: refreshedRates } = await supabase.from('work_rates').select('*').is('deleted_at', null);
                            setCwWorkRates(refreshedRates || []);
                            await loadCwWorkRateEmployeePrices(refreshedRates || []);
                            if (cwSelectedEmployee?.id) {
                              const { data: refreshedLogs } = await supabase.from('work_logs').select('*').eq('employee_id', cwSelectedEmployee.id).is('deleted_at', null);
                              setCwWorkLogs(refreshedLogs || []);
                            }
                            setCwRateBulkModal({ open: false, rateId: '', rateName: '', oldPrice: '', price: '', start: mskTodayYmd(), end: mskTodayYmd() });
                            showToast(`Цена обновлена. Пересчитано записей: ${recalced}`, 'success');
                          }}
                          className="w-full btn-primary py-3"
                        >
                          Сохранить новую цену с этой даты
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                </>
              )}

              {completedWorkStep === 'PACKAGING' && (
                <div className="oc-card p-4 sm:p-6">
                  <h3 className="font-bold text-lg mb-4">Виды упаковки</h3>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
                    <input
                      type="text"
                      placeholder="Тип упаковки"
                      value={cwPackagingRateForm.name}
                      onChange={e => setCwPackagingRateForm({...cwPackagingRateForm, name: e.target.value})}
                      className="flex-1 p-2 border rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Цена (₽)"
                      step="0.1"
                      value={cwPackagingRateForm.price}
                      onChange={e => setCwPackagingRateForm({...cwPackagingRateForm, price: e.target.value})}
                      className="w-full sm:w-32 p-2 border rounded-lg"
                    />
                    <button
                      onClick={async () => {
                        if (!hasAssemblyButtonAccess('cw_packaging_save')) return;
                        if (!cwPackagingRateForm.name || !cwPackagingRateForm.price) return;

                        if (editingPackagingId) {
                            const before = cwPackagingRates.find((r: any) => String(r.id) === String(editingPackagingId));
                            await supabase.from('packaging_rates').update({ name: cwPackagingRateForm.name, price: parseFloat(cwPackagingRateForm.price) }).eq('id', editingPackagingId);
                            await logAssemblyChange('packaging_rates', 'update', before || null, { ...(before || {}), name: cwPackagingRateForm.name, price: parseFloat(cwPackagingRateForm.price) });
                            setEditingPackagingId(null);
                        } else {
                            const { data: createdPackaging } = await supabase.from('packaging_rates').insert([{ name: cwPackagingRateForm.name, price: parseFloat(cwPackagingRateForm.price) }]).select('*').maybeSingle();
                            await logAssemblyChange('packaging_rates', 'create', null, createdPackaging || { name: cwPackagingRateForm.name, price: parseFloat(cwPackagingRateForm.price) });
                        }

                        setCwPackagingRateForm({ name: '', price: '' });
                        // Refresh rates
                        const { data } = await supabase.from('packaging_rates').select('*');
                        setCwPackagingRates(data || []);
                      }}
                      disabled={!hasAssemblyButtonAccess('cw_packaging_save')}
                      className={`px-4 py-2 ${editingPackagingId ? 'btn-success' : 'btn-primary'} ${!hasAssemblyButtonAccess('cw_packaging_save') ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {editingPackagingId ? 'Сохранить' : 'Добавить'}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {cwPackagingRates.map(rate => (
                      <div key={rate.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="font-medium">{rate.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-green-600">{rate.price} ₽</span>
                          <button
                            onClick={() => {
                                setEditingPackagingId(rate.id);
                                setCwPackagingRateForm({ name: rate.name, price: rate.price.toString() });
                            }}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={async () => {
                            if (!hasAssemblyButtonAccess('cw_packaging_delete')) return;
                            const before = { ...rate };
                            await supabase.from('packaging_rates').update({ deleted_at: new Date().toISOString() }).eq('id', rate.id);
                            await logAssemblyChange('packaging_rates', 'delete', before, null);
                            const { data } = await supabase.from('packaging_rates').select('*').is('deleted_at', null);
                            setCwPackagingRates(data || []);
                          }} disabled={!hasAssemblyButtonAccess('cw_packaging_delete')} className={`text-red-500 hover:text-red-700 ${!hasAssemblyButtonAccess('cw_packaging_delete') ? 'opacity-40 cursor-not-allowed' : ''}`}><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}


              {completedWorkStep === 'PURCHASE' && (() => {
                const purchaseSupplierName = (id: any) => suppliers.find((s: any) => String(s.id) === String(id))?.name || '—';
                const rowCost = (log: any) => log?.kind === 'other'
                  ? Number(log?.price || 0)
                  : Number(log?.quantity || 0) * Number(log?.price || 0) + Number(log?.delivery || 0);
                const filteredPurchases = cwPurchaseHistory.filter((l) => cwPurchaseHistorySupplierFilter === 'all' || String(l.supplier_id || '') === cwPurchaseHistorySupplierFilter);
                const totalAll = filteredPurchases.reduce((s, r) => s + rowCost(r), 0);
                const totalPack = filteredPurchases.filter((r) => r.kind !== 'other').reduce((s, r) => s + rowCost(r), 0);
                const totalOther = filteredPurchases.filter((r) => r.kind === 'other').reduce((s, r) => s + rowCost(r), 0);
                const savePurchases = async () => {
                  if (!hasAssemblyButtonAccess('cw_purchase_add')) return;
                  if (!cwPurchaseForm.purchase_date) { showToast('Укажите дату покупки', 'error'); return; }
                  const sids = cwPurchaseForm.supplier_ids.filter(Boolean);
                  if (!sids.length) { showToast('Выберите хотя бы одного поставщика', 'error'); return; }
                  const N = sids.length;
                  const createdAt = new Date(`${cwPurchaseForm.purchase_date}T12:00:00`).toISOString();
                  // Full price kept per supplier (no division) — a record per selected supplier.
                  const packPayload = cwPurchaseRows
                    .filter(x => x.size && x.quantity && x.price)
                    .flatMap(x => sids.map(sid => ({ kind: 'packaging', supplier_id: sid, quantity: parseInt(x.quantity), size: x.size, price: parseFloat(x.price), delivery: parseFloat(x.delivery || '0'), created_at: createdAt })));
                  const otherPayload = cwPurchaseOtherRows
                    .filter(x => x.item_name.trim() && x.price)
                    .flatMap(x => sids.map(sid => ({ kind: 'other', supplier_id: sid, item_name: x.item_name.trim(), price: parseFloat(x.price), created_at: createdAt })));
                  const payload = [...packPayload, ...otherPayload];
                  if (!payload.length) { showToast('Заполните хотя бы одну запись', 'error'); return; }
                  const { error } = await supabase.from('packaging_purchase_log').insert(payload as any);
                  if (error) { showToast('Ошибка добавления: ' + (error.message || 'неизвестно'), 'error'); return; }
                  setCwPurchaseRows([{ id: getSafeId(), quantity: '', size: '', price: '', delivery: '' }]);
                  setCwPurchaseOtherRows([{ id: getSafeId(), item_name: '', price: '' }]);
                  setCwPurchaseForm({ purchase_date: mskTodayYmd(), supplier_ids: [] });
                  await fetchCwPurchaseHistory();
                  await loadBoxStock();
                  showToast(`Добавлено записей: ${payload.length}${N > 1 ? ` (по ${N} поставщикам)` : ''}`, 'success');
                };
                return (
                <div className="space-y-5">
                  {/* Form card */}
                  <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 text-white">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15"><ShoppingCart className="h-5 w-5" /></div>
                      <div>
                        <h3 className="font-bold text-lg leading-tight">Закуп</h3>
                        <p className="text-xs text-indigo-100">Упаковка и прочие траты по поставщикам</p>
                      </div>
                    </div>
                    <div className="p-5 space-y-5">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Дата покупки</label>
                        <input type="date" value={cwPurchaseForm.purchase_date} onChange={e => setCwPurchaseForm({ ...cwPurchaseForm, purchase_date: e.target.value })} className="oc-input w-full md:max-w-xs" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Поставщики (для разделения трат)</label>
                          {cwPurchaseForm.supplier_ids.length > 0 && <span className="text-[11px] text-indigo-600 font-medium">Выбрано: {cwPurchaseForm.supplier_ids.length}</span>}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/60 p-2">
                          {suppliers.map((s) => {
                            const checked = cwPurchaseForm.supplier_ids.includes(String(s.id));
                            return (
                              <label key={`pp-sup-${s.id}`} className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-sm cursor-pointer transition-colors ${checked ? 'border-indigo-300 bg-indigo-50 text-indigo-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
                                <input type="checkbox" checked={checked} onChange={(e) => setCwPurchaseForm(prev => ({ ...prev, supplier_ids: e.target.checked ? [...prev.supplier_ids, String(s.id)] : prev.supplier_ids.filter(x => x !== String(s.id)) }))} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                <span className="truncate">{s.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Packaging types */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-bold text-slate-800">Упаковка</h4>
                          <div className="flex items-center gap-3">
                            <button type="button" onClick={() => { setPackagingNewTemplate(''); setShowPackagingTemplateModal(true); }} className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-700">
                              <Plus className="h-4 w-4" /> Шаблон упаковки
                            </button>
                            <button type="button" onClick={() => setCwPurchaseRows(prev => [...prev, { id: getSafeId(), quantity: '', size: '', price: '', delivery: '' }])} className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                              <Plus className="h-4 w-4" /> Тип упаковки
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="hidden md:grid grid-cols-[1.4fr_1fr_1fr_1fr_auto] gap-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            <span>Тип упаковки</span><span>Количество</span><span>Цена за штуку</span><span>Доставка</span><span></span>
                          </div>
                          {cwPurchaseRows.map((r) => {
                            const tpl = packagingTypeTemplates.find((t) => t.name === r.size);
                            const rowTotal = (Number(r.quantity || 0) * Number(r.price || 0)) + Number(r.delivery || 0);
                            return (
                            <div key={r.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-2">
                              <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1.3fr_1fr_auto] gap-2">
                              <Select value={r.size} onChange={(e) => { const name = e.target.value; const t = packagingTypeTemplates.find((x) => x.name === name); setCwPurchaseRows(prev => prev.map(x => x.id === r.id ? { ...x, size: name, price: (t && !x.newPrice) ? String(t.price || '') : x.price } : x)); }} className="oc-input">
                                <option value="">Тип упаковки…</option>
                                {packagingTypeTemplates.map((t) => <option key={`pt-${r.id}-${t.name}`} value={t.name}>{t.name}{t.price ? ` — ${t.price} ₽` : ''}</option>)}
                                {r.size && !packagingTypeTemplates.some((t) => t.name === r.size) && <option value={r.size}>{r.size}</option>}
                              </Select>
                              <QtyField placeholder="Кол-во" value={r.quantity} onChange={(e) => setCwPurchaseRows(prev => prev.map(x => x.id === r.id ? { ...x, quantity: e.target.value } : x))} className="oc-input" />
                              <div>
                                <input type="number" step="0.01" placeholder="Цена за шт." value={r.price} disabled={Boolean(tpl) && !r.newPrice} onChange={(e) => setCwPurchaseRows(prev => prev.map(x => x.id === r.id ? { ...x, price: e.target.value } : x))} className={`oc-input ${tpl && !r.newPrice ? 'bg-slate-100 text-slate-500' : ''}`} />
                                {tpl && (
                                  <label className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
                                    <input type="checkbox" checked={Boolean(r.newPrice)} onChange={(e) => { const on = e.target.checked; setCwPurchaseRows(prev => prev.map(x => x.id === r.id ? { ...x, newPrice: on, price: on ? x.price : String(tpl.price || '') } : x)); }} className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600" />
                                    Новая цена
                                  </label>
                                )}
                              </div>
                              <input type="number" step="0.01" placeholder="Доставка" value={r.delivery} onChange={(e) => setCwPurchaseRows(prev => prev.map(x => x.id === r.id ? { ...x, delivery: e.target.value } : x))} className="oc-input" />
                              <button type="button" onClick={() => setCwPurchaseRows(prev => prev.length > 1 ? prev.filter(x => x.id !== r.id) : prev)} className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 text-slate-400 hover:text-rose-600 hover:border-rose-200" title="Удалить"><Trash2 className="h-4 w-4" /></button>
                              </div>
                              <div className="mt-1.5 text-right text-xs text-slate-500">Итого: <b className="text-slate-900">{rowTotal.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽</b> <span className="text-[10px] text-slate-400">(кол-во × цена/шт + доставка)</span></div>
                            </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Other purchases */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-bold text-slate-800">Закуп прочее</h4>
                          <button type="button" onClick={() => setCwPurchaseOtherRows(prev => [...prev, { id: getSafeId(), item_name: '', price: '' }])} className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                            <Plus className="h-4 w-4" /> Добавить
                          </button>
                        </div>
                        <div className="space-y-2">
                          {cwPurchaseOtherRows.map((r) => (
                            <div key={r.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-2">
                              <input type="text" placeholder="Товар" value={r.item_name} onChange={(e) => setCwPurchaseOtherRows(prev => prev.map(x => x.id === r.id ? { ...x, item_name: e.target.value } : x))} className="oc-input" />
                              <input type="number" step="0.01" placeholder="Стоимость" value={r.price} onChange={(e) => setCwPurchaseOtherRows(prev => prev.map(x => x.id === r.id ? { ...x, price: e.target.value } : x))} className="oc-input" />
                              <button type="button" onClick={() => setCwPurchaseOtherRows(prev => prev.length > 1 ? prev.filter(x => x.id !== r.id) : prev)} className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 text-slate-400 hover:text-rose-600 hover:border-rose-200" title="Удалить"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button onClick={savePurchases} disabled={!hasAssemblyButtonAccess('cw_purchase_add')} className={`w-full py-3 rounded-2xl bg-indigo-600 text-white font-semibold shadow-sm hover:bg-indigo-700 transition-colors ${!hasAssemblyButtonAccess('cw_purchase_add') ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        Сохранить закуп
                      </button>
                    </div>
                  </div>

                  {/* Box stock adjustment */}
                  <div className="rounded-3xl border border-indigo-200 bg-indigo-50/50 shadow-sm p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Корректировка остатка коробок</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Текущий остаток на складе: <b className={boxStock.remaining < 0 ? 'text-rose-600' : 'text-indigo-700'}>{boxStock.remaining.toLocaleString('ru-RU')} шт.</b> Введите фактический остаток — разница запишется в закуп.</p>
                      </div>
                      <div className="flex items-end gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Фактический остаток</label>
                          <input type="number" value={boxAdjustValue} onChange={(e) => setBoxAdjustValue(e.target.value)} className="oc-input w-36" placeholder="напр. 500" />
                        </div>
                        <button type="button" onClick={adjustBoxStock} className="h-11 px-4 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 whitespace-nowrap">Скорректировать</button>
                      </div>
                    </div>
                  </div>

                  {/* History card */}
                  <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="flex flex-col gap-3 px-5 py-4 border-b border-slate-100 md:flex-row md:items-center md:justify-between">
                      <h4 className="font-bold text-slate-900">История закупок</h4>
                      <Select value={cwPurchaseHistorySupplierFilter} onChange={(e) => setCwPurchaseHistorySupplierFilter(e.target.value)} className="oc-input md:max-w-xs">
                        <option value="all">Все поставщики</option>
                        {suppliers.map((s) => <option key={`pp-flt-${s.id}`} value={String(s.id)}>{s.name}</option>)}
                      </Select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4">
                      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-3"><div className="text-[11px] font-semibold uppercase text-indigo-500">Упаковка</div><div className="text-xl font-extrabold text-indigo-800">{totalPack.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽</div></div>
                      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3"><div className="text-[11px] font-semibold uppercase text-amber-600">Прочее</div><div className="text-xl font-extrabold text-amber-800">{totalOther.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽</div></div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-900 p-3"><div className="text-[11px] font-semibold uppercase text-slate-300">Итого</div><div className="text-xl font-extrabold text-white">{totalAll.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽</div></div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-y border-slate-100 text-xs uppercase text-slate-500">
                            <th className="px-4 py-2.5 font-semibold">Дата</th>
                            <th className="px-4 py-2.5 font-semibold">Поставщик</th>
                            <th className="px-4 py-2.5 font-semibold">Тип / Товар</th>
                            <th className="px-4 py-2.5 font-semibold text-right">Кол-во</th>
                            <th className="px-4 py-2.5 font-semibold text-right">Цена/шт</th>
                            <th className="px-4 py-2.5 font-semibold text-right">Доставка</th>
                            <th className="px-4 py-2.5 font-semibold text-right">Итого</th>
                            <th className="px-4 py-2.5 font-semibold text-right">Действия</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredPurchases.map(log => (
                            <tr key={log.id} className="hover:bg-slate-50">
                              <td className="px-4 py-2.5 text-slate-700">{new Date(log.created_at).toLocaleDateString('ru-RU')}</td>
                              <td className="px-4 py-2.5 text-slate-700">{purchaseSupplierName(log.supplier_id)}</td>
                              <td className="px-4 py-2.5"><span className={`mr-2 text-[10px] px-1.5 py-0.5 rounded-full ${log.kind === 'other' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>{log.kind === 'other' ? 'прочее' : 'упаковка'}</span>{log.kind === 'other' ? (log.item_name || '—') : (log.size || '—')}</td>
                              <td className="px-4 py-2.5 text-right font-medium">{log.kind === 'other' ? '—' : log.quantity}</td>
                              <td className="px-4 py-2.5 text-right">{log.kind === 'other' ? '—' : `${Number(log.price || 0).toLocaleString('ru-RU')} ₽`}</td>
                              <td className="px-4 py-2.5 text-right">{log.kind === 'other' ? '—' : `${Number(log.delivery || 0).toLocaleString('ru-RU')} ₽`}</td>
                              <td className="px-4 py-2.5 text-right font-bold text-slate-900">{rowCost(log).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽</td>
                              <td className="px-4 py-2.5 text-right">
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    onClick={() => setCwPurchaseEdit({ id: log.id, kind: log.kind || 'packaging', supplier_id: String(log.supplier_id || ''), size: log.size || '', quantity: String(log.quantity ?? ''), price: String(log.price ?? ''), delivery: String(log.delivery ?? ''), item_name: log.item_name || '', created_at_date: String(log.created_at || '').slice(0, 10) })}
                                    className="text-blue-500 hover:text-blue-700"
                                    title="Редактировать"
                                  ><Pencil className="h-4 w-4" /></button>
                                  <button
                                    onClick={async () => {
                                      if (!hasAssemblyButtonAccess('cw_purchase_delete')) return;
                                      if (!await confirmDialog('Удалить запись?')) return;
                                      const { error } = await supabase.from('packaging_purchase_log').update({ deleted_at: new Date().toISOString() }).eq('id', log.id);
                                      if (error) { showToast('Ошибка удаления: ' + (error.message || 'неизвестно'), 'error'); return; }
                                      await fetchCwPurchaseHistory(); await loadBoxStock();
                                    }}
                                    disabled={!hasAssemblyButtonAccess('cw_purchase_delete')}
                                    className={`text-red-500 hover:text-red-700 ${!hasAssemblyButtonAccess('cw_purchase_delete') ? 'opacity-40 cursor-not-allowed' : ''}`}
                                  ><Trash2 className="h-4 w-4" /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {filteredPurchases.length === 0 && (
                            <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">История пуста</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                );
              })()}

              {(completedWorkStep === 'CALENDAR' || completedWorkStep === 'FORM') && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-4 space-y-4">
                    {/* Employee Selector - Horizontal Scroll */}
                    <div className="bg-white/95 backdrop-blur p-4 rounded-2xl shadow-lg border border-slate-200 overflow-x-auto">
                      {employees.length === 0 ? (
                        <div className="text-center text-slate-500 py-2">Нет сотрудников</div>
                      ) : (
                        <div className="flex space-x-3 min-w-max">
                          {employees
                            .filter(e => String(e.role || '').toLowerCase() !== 'admin' && String(e.login || '').toLowerCase() !== 'admin')
                            .filter(e => isCalendarEmployeeVisible(e))
                            .filter(e => (!currentEmployee || currentEmployee.role !== 'Сборщик') || e.id === currentEmployee.id)
                            .map(e => (
                            <button
                              key={e.id}
                              onClick={() => setCwSelectedEmployee(e)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                                cwSelectedEmployee?.id === e.id
                                  ? 'bg-indigo-600 text-white shadow-md'
                                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <div className={`w-2 h-2 rounded-full ${isEmployeeOnline(e) ? 'bg-green-400' : 'bg-slate-300'}`} />
                              {e.full_name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {cwSelectedEmployee && (
                      <div className="grid grid-cols-1 gap-6">
                        <div className="bg-white/95 backdrop-blur p-6 rounded-2xl shadow-lg border border-slate-200">
                            {completedWorkStep === 'CALENDAR' ? (
                            <>
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
                                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 capitalize">
                                            {cwSelectedPeriod.toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}
                                        </h2>
                                        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                                            <button onClick={() => setCwSelectedPeriod(new Date(cwSelectedPeriod.setMonth(cwSelectedPeriod.getMonth() - 1)))} className="p-1 hover:bg-white rounded-md shadow-sm transition-all"><ChevronLeft className="h-4 w-4" /></button>
                                            <button onClick={() => setCwSelectedPeriod(new Date(cwSelectedPeriod.setMonth(cwSelectedPeriod.getMonth() + 1)))} className="p-1 hover:bg-white rounded-md shadow-sm transition-all"><ChevronRight className="h-4 w-4" /></button>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="month"
                                                value={cwSelectedPeriod.toISOString().slice(0, 7)}
                                                onChange={e => setCwSelectedPeriod(new Date(e.target.value))}
                                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                            />
                                            <button className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600">
                                                <Calendar className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 w-full md:w-auto text-sm">
                                        {(!currentEmployee || ['admin', 'Менеджер', 'Управляющий'].includes(currentEmployee.role)) && (
                                          <button
                                            onClick={() => setShowPalletModal(true)}
                                            className="bg-amber-50 px-3 py-2 rounded-lg border border-amber-100 text-amber-700 font-bold hover:bg-amber-100 transition-colors text-xs sm:text-sm"
                                          >
                                            Паллетирование
                                          </button>
                                        )}
                                        <button
                                            onClick={() => setShowTempWorkerHistory(true)}
                                            disabled={!hasAssemblyButtonAccess('cw_calendar_temp_workers')}
                                            className={`bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100 text-indigo-700 font-bold hover:bg-indigo-100 transition-colors text-xs sm:text-sm ${!hasAssemblyButtonAccess('cw_calendar_temp_workers') ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            Временные сотрудники
                                        </button>
                                        {hasAssemblyButtonAccess('cw_calendar_salary_pay') && (
                                          <button
                                            onClick={openSalaryPayModal}
                                            className="bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100 text-emerald-700 font-bold hover:bg-emerald-100 transition-colors text-xs sm:text-sm inline-flex items-center gap-1.5"
                                          >
                                            <Wallet className="h-4 w-4" /> Оплата
                                          </button>
                                        )}
                                        {(currentEmployee) && (
                                          <button
                                            onClick={async () => {
                                              const isAdmin = String(currentEmployee.role || '').toLowerCase() === 'admin';
                                              const targetId = isAdmin ? String(cwSelectedEmployee?.id || '') : String(currentEmployee.id || '');
                                              if (!targetId) { showToast('Выберите сотрудника', 'error'); return; }
                                              setCwScheduleEmployeeId(targetId);
                                              await loadEmployeeSchedule(targetId);
                                              setCwScheduleMonth(new Date());
                                              setCwScheduleInlineError('');
                                              setCwScheduleModalOpen(true);
                                            }}
                                            disabled={!hasAssemblyButtonAccess('cw_calendar_schedule_open')}
                                            className={`bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 text-blue-700 font-bold hover:bg-blue-100 transition-colors text-xs sm:text-sm ${!hasAssemblyButtonAccess('cw_calendar_schedule_open') ? 'opacity-50 cursor-not-allowed' : ''}`}
                                          >
                                            График
                                          </button>
                                        )}
                                        {(!currentEmployee || currentEmployee.role === 'admin') && (
                                        <div className="bg-green-50 px-3 py-2 rounded-lg border border-green-100 min-w-[150px]">
                                            {(() => {
                                              const isYuliaSelected = /юл|juli/i.test(String(cwSelectedEmployee?.full_name || cwSelectedEmployee?.login || ''));
                                              if (isYuliaSelected) {
                                                const amountAdmin = cwWorkLogs.filter(log => {
                                                  if (!log.date) return false;
                                                  const [y, m] = log.date.split('-').map(Number);
                                                  return m === cwSelectedPeriod.getMonth() + 1 && y === cwSelectedPeriod.getFullYear();
                                                }).reduce((sum, log) => {
                                                  const rate = cwWorkRates.find(r => r.id === log.work_rate_id);
                                                  const isAdminRate = /админ/i.test(String(rate?.name || ''));
                                                  if (!isAdminRate) return sum;
                                                  return sum + (Number(log.quantity || 0) * Number(getWorkLogSnapshotPrice(log) || 0));
                                                }, 0);
                                                return <><span className="text-slate-500 mr-2">Заработано (Админ):</span><span className="font-bold text-green-700 text-lg">{Math.floor(amountAdmin).toLocaleString('ru-RU')} ₽</span></>;
                                              }
                                              const amount = cwWorkLogs.filter(log => {
                                                if (!log.date) return false;
                                                const [y, m] = log.date.split('-').map(Number);
                                                return m === cwSelectedPeriod.getMonth() + 1 && y === cwSelectedPeriod.getFullYear();
                                              }).reduce((sum, log) => {
                                                const rate = cwWorkRates.find(r => r.id === log.work_rate_id);
                                                return sum + (Number(log.quantity || 0) * Number(getWorkLogSnapshotPrice(log) || 0));
                                              }, 0);
                                              return <><span className="text-slate-500 mr-2">Заработано:</span><span className="font-bold text-green-700 text-lg">{Math.floor(amount).toLocaleString('ru-RU')} ₽</span></>;
                                            })()}
                                        </div>
                                        )}
                                        <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 min-w-[120px]">
                                            <span className="text-slate-500 mr-2">Записей:</span>
                                            <span className="font-bold text-slate-900 text-lg">
                                            {cwWorkLogs.filter(log => {
                                                if (!log.date) return false;
                                                const [y, m] = log.date.split('-').map(Number);
                                                return m === cwSelectedPeriod.getMonth() + 1 && y === cwSelectedPeriod.getFullYear();
                                            }).length}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden sm:grid grid-cols-7 gap-2 mb-2 text-center text-xs font-medium text-slate-400">
                                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => <div key={d}>{d}</div>)}
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 sm:gap-3">
                                {(() => {
                                    const year = cwSelectedPeriod.getFullYear();
                                    const month = cwSelectedPeriod.getMonth();
                                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                                    const firstDay = new Date(year, month, 1).getDay() || 7; // 1 (Mon) - 7 (Sun)

                                    const days = [];
                                    for (let i = 1; i < firstDay; i++) days.push(<div key={`empty-${i}`} />);

                                    for (let d = 1; d <= daysInMonth; d++) {
                                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                    const dayLogs = cwWorkLogs.filter(l => l.date && l.date.startsWith(dateStr));
                                    const dayTotal = dayLogs.reduce((sum, log) => {
                                        const rate = cwWorkRates.find(r => r.id === log.work_rate_id);
                                        return sum + (Number(log.quantity || 0) * Number(getWorkLogSnapshotPrice(log) || 0));
                                    }, 0);
                                    const dayQtyUnits = dayLogs
                                      .filter((log) => !isTimeBasedWorkRate(log.work_rate_id))
                                      .reduce((sum, log) => sum + Number(log.quantity || 0), 0);
                                    const dayQtyMinutes = dayLogs
                                      .filter((log) => isTimeBasedWorkRate(log.work_rate_id))
                                      .reduce((sum, log) => sum + Number(log.quantity || 0), 0);
                                    const dayCountLabel = dayQtyMinutes > 0
                                      ? `${Math.floor(dayQtyMinutes / 60)}ч ${Math.floor(dayQtyMinutes % 60)}м${dayQtyUnits > 0 ? ` + ${Math.floor(dayQtyUnits)} шт` : ''}`
                                      : `${Math.floor(dayQtyUnits)} шт`;

                                    days.push(
                                        <div
                                        key={d}
                                        onClick={() => {
                                            setCwSelectedDate(new Date(year, month, d));
                                            setCompletedWorkStep('FORM');
                                        }}
                                        className={`min-h-[86px] sm:aspect-square border rounded-xl p-2 hover:border-indigo-500 cursor-pointer flex flex-col justify-between transition-all ${dayLogs.length > 0 ? 'bg-green-50 border-green-200' : 'border-slate-100'}`}
                                        >
                                        <span className="text-sm font-medium text-slate-700">{d}</span>
                                        {dayLogs.length > 0 && (
                                            <div className="text-right">
                                            {(!currentEmployee || currentEmployee.role === 'admin') && (
                                            <div className="text-xs font-bold text-green-700">
                                              {/юл|juli/i.test(String(cwSelectedEmployee?.full_name || cwSelectedEmployee?.login || ''))
                                                ? `${Math.floor(dayLogs.reduce((s, log) => {
                                                    const rate = cwWorkRates.find(r => r.id === log.work_rate_id);
                                                    const isAdminRate = /админ/i.test(String(rate?.name || ''));
                                                    return isAdminRate ? s + (Number(log.quantity || 0) * Number(getWorkLogSnapshotPrice(log) || 0)) : s;
                                                  }, 0)).toLocaleString('ru-RU')}₽`
                                                : `${Math.floor(dayTotal).toLocaleString('ru-RU')}₽`}
                                            </div>
                                            )}
                                            <div className="text-[10px] text-slate-500">{dayCountLabel}</div>
                                            </div>
                                        )}
                                        </div>
                                    );
                                    }
                                    return days;
                                })()}
                                </div>
                            </>
                            ) : (
                            <div className="bg-white/95 backdrop-blur p-6 rounded-2xl shadow-lg border border-slate-200">
                                <div className="flex items-center mb-6">
                                <button onClick={() => setCompletedWorkStep('CALENDAR')} className="mr-4 p-2 hover:bg-slate-100 rounded-full">
                                    <ArrowLeft className="h-5 w-5" />
                                </button>
                                <h3 className="text-xl font-bold">Запись за {cwSelectedDate?.toLocaleDateString()}</h3>
                                </div>

                                <div className="space-y-4 max-w-2xl">
                                  <div className="space-y-2">
                                    <div className="text-sm font-medium text-slate-700">Товары/операции</div>
                                    {cwFormItems.map((item, idx) => {
                                      const isTime = isTimeBasedWorkRate(item.work_rate_id);
                                      return (
                                        <div key={`cw-item-${idx}`} className="border rounded-xl p-3 bg-slate-50 space-y-2">
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <Select
                                              value={item.supplier_id}
                                              onChange={(e) => setCwFormItems(prev => prev.map((x, i) => i === idx ? { ...x, supplier_id: e.target.value } : x))}
                                              className="oc-select"
                                            >
                                              <option value="">Поставщик...</option>
                                              {suppliers.map(s => <option key={`cw-item-s-${s.id}`} value={s.id}>{s.name}</option>)}
                                            </Select>
                                            <Select
                                              value={item.work_rate_id}
                                              onChange={(e) => setCwFormItems(prev => prev.map((x, i) => i === idx ? { ...x, work_rate_id: e.target.value, quantity: isTimeBasedWorkRate(e.target.value) ? '' : x.quantity } : x))}
                                              className="oc-select"
                                            >
                                              <option value="">Выберите тип...</option>
                                              <option value={CW_TIME_RATE_KEY}>Время {(!currentEmployee || normalizeRoleKey(currentEmployee.role || currentEmployee.login) === 'admin') ? `(${getCwTimeRatePrice().toFixed(2)} ₽ / мин)` : ''}</option>
                                              {cwWorkRates
                                                .map(r => <option key={r.id} value={r.id}>{r.name} {(!currentEmployee || currentEmployee.role === 'admin') ? `(${r.price} ₽)` : ''}</option>)}
                                            </Select>
                                          </div>

                                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                            <Select
                                              value={item.packaging_used}
                                              onChange={(e) => setCwFormItems(prev => prev.map((x, i) => i === idx ? { ...x, packaging_used: e.target.value as '' | 'yes' | 'no', packaging: e.target.value === 'yes' ? x.packaging : '' } : x))}
                                              className="oc-select"
                                            >
                                              <option value="">Упаковка: выбрать...</option>
                                              <option value="no">Упаковка: нет</option>
                                              <option value="yes">Упаковка: да</option>
                                            </Select>
                                            {item.packaging_used === 'yes' ? (
                                              <Select
                                                value={item.packaging}
                                                onChange={(e) => setCwFormItems(prev => prev.map((x, i) => i === idx ? { ...x, packaging: e.target.value } : x))}
                                                className="oc-select"
                                              >
                                                <option value="">Выберите упаковку...</option>
                                                {cwPackagingRates.map(r => <option key={`cw-pack-${idx}-${r.id}`} value={r.name}>{r.name}</option>)}
                                              </Select>
                                            ) : (
                                              <div className="w-full p-2 border rounded-lg text-xs text-slate-500 flex items-center">Упаковка не нужна</div>
                                            )}
                                            {!isTime ? (
                                              <QtyField
                                               
                                                min="1"
                                                placeholder="Кол-во"
                                                value={item.quantity}
                                                onChange={(e) => setCwFormItems(prev => prev.map((x, i) => i === idx ? { ...x, quantity: e.target.value } : x))}
                                                className="oc-select"
                                              />
                                            ) : (
                                              <div className="grid grid-cols-2 gap-2 w-full">
                                                <input
                                                  type="number"
                                                  min="0"
                                                  placeholder="Часы"
                                                  value={item.time_hours}
                                                  onChange={(e) => setCwFormItems(prev => prev.map((x, i) => i === idx ? { ...x, time_hours: e.target.value } : x))}
                                                  className="oc-select"
                                                />
                                                <input
                                                  type="number"
                                                  min="0"
                                                  max="59"
                                                  placeholder="Минуты"
                                                  value={item.time_minutes}
                                                  onChange={(e) => setCwFormItems(prev => prev.map((x, i) => i === idx ? { ...x, time_minutes: e.target.value } : x))}
                                                  className="oc-select"
                                                />
                                              </div>
                                            )}
                                          </div>

                                          <div className="flex justify-end">
                                            <button
                                              type="button"
                                              onClick={() => setCwFormItems(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev)}
                                              className="flex h-11 w-11 items-center justify-center border border-red-200 text-red-600 rounded-xl hover:bg-red-50 active:bg-red-100"
                                              disabled={cwFormItems.length === 1}
                                              title="Удалить строку"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                    <button
                                      type="button"
                                      onClick={() => setCwFormItems(prev => [...prev, { supplier_id: '', work_rate_id: '', quantity: '', time_hours: '', time_minutes: '', packaging_used: '', packaging: '' }])}

                                      className="min-h-[48px] px-4 py-2 text-sm rounded-xl border border-indigo-300 text-indigo-700 hover:bg-indigo-50 active:bg-indigo-100"
                                    >
                                      + Добавить товар
                                    </button>
                                    {!editingWorkLogId && (
                                    <button
                                      type="button"
                                      onClick={() => setPickSheetOpen(true)}
                                      className="ml-2 inline-flex min-h-[48px] items-center gap-1.5 px-4 py-2 text-sm rounded-xl border border-emerald-300 bg-emerald-50/50 font-semibold text-emerald-700 hover:bg-emerald-50 active:bg-emerald-100"
                                    >
                                      <ClipboardList className="h-4 w-4" /> Добавить лист
                                    </button>
                                    )}
                                    {pickSheetOpen && cwSelectedDate && (
                                      <PickingSheetPicker
                                        suppliers={suppliers}
                                        workRates={cwWorkRates}
                                        initialDate={cwSelectedDate.toLocaleDateString('en-CA')}
                                        pending={cwFormItems.filter((x: any) => x.pick).map((x: any) => ({ key: x.pick.key, category: x.pick.category, quantity: Number(x.quantity || 0) }))}
                                        initialSupplierId={cwFormItems.find((x: any) => x.supplier_id)?.supplier_id || ''}
                                        onClose={() => setPickSheetOpen(false)}
                                        onRateCreated={(rate) => setCwWorkRates((prev: any[]) => [...prev, rate])}
                                        showToast={showToast}
                                        onAdd={(rows) => setCwFormItems((prev: any[]) => {
                                          const filled = prev.filter((x) => x.supplier_id || x.work_rate_id || x.quantity);
                                          return [...filled, ...rows.map((r) => ({ supplier_id: r.supplier_id, work_rate_id: r.work_rate_id, quantity: r.quantity, time_hours: '', time_minutes: '', packaging_used: 'no', packaging: '', pick: r.pick }))];
                                        })}
                                      />
                                    )}
                                  </div>

                                  <button
                                    onClick={async () => {
                                      if (!hasAssemblyButtonAccess('cw_form_save')) return;
                                      if (!cwSelectedEmployee || !cwSelectedDate) return;

                                      const dateStr = cwSelectedDate.toLocaleDateString('en-CA');

                                      if (editingWorkLogId) {
                                        const item = cwFormItems[0] || { supplier_id: '', work_rate_id: cwForm.work_rate_id, quantity: cwForm.quantity };
                                        if (!item.supplier_id) return showToast('Выберите поставщика для записи', 'error');
                                        if (!item.work_rate_id) return showToast('Выберите тип работы', 'error');
                                        if (!item.packaging_used) return showToast('Выберите использование упаковки', 'error');
                                        if (item.packaging_used === 'yes' && !item.packaging) return showToast('Выберите упаковку для записи', 'error');

                                        const isTimeRow = isTimeBasedWorkRate(item.work_rate_id);
                                        const hours = parseInt(item.time_hours || '0') || 0;
                                        const minutes = parseInt(item.time_minutes || '0') || 0;
                                        const totalMinutes = Math.max(0, hours * 60 + minutes);
                                        const qty = isTimeRow ? totalMinutes : parseInt(item.quantity || '0');
                                        if (isTimeRow && totalMinutes <= 0) return showToast('Укажите время (часы или минуты)', 'error');
                                        if (!isTimeRow && (!qty || qty <= 0)) return showToast('Укажите количество', 'error');

                                        const resolvedRateId = item.work_rate_id === CW_TIME_RATE_KEY ? await ensureCwTimeRateId() : item.work_rate_id;

                                        const before = cwWorkLogs.find((l: any) => String(l.id) === String(editingWorkLogId));
                                        const updatedPayload = {
                                          quantity: qty,
                                          work_rate_id: resolvedRateId,
                                          packaging: item.packaging_used === 'yes' ? item.packaging : '',
                                          packaging_used: item.packaging_used === 'yes',
                                          supplier_id: item.supplier_id || null,
                                        };
                                        await supabase.from('work_logs').update(updatedPayload).eq('id', editingWorkLogId);
                                        const nextSnapshots = { ...(cwWorkRateSnapshots || {}) } as Record<string, number>;
                                        nextSnapshots[String(editingWorkLogId)] = Number(getEffectiveWorkRatePrice(String(updatedPayload.work_rate_id || ''), String(cwSelectedEmployee?.id || before?.employee_id || '')) || 0);
                                        setCwWorkRateSnapshots(nextSnapshots);
                                        await supabase.from('app_settings').upsert([{ key: 'cw_work_rate_snapshots_v1', value: JSON.stringify(nextSnapshots) }], { onConflict: 'key' });
                                        await logAssemblyChange('work_logs', 'update', before || null, { ...(before || {}), ...updatedPayload, id: editingWorkLogId });
                                        setEditingWorkLogId(null);
                                        showToast('Запись обновлена', 'success');
                                      } else {
                                        const itemsToInsert: any[] = [];
                                        for (const x of cwFormItems) {
                                          if (!x.supplier_id || !x.work_rate_id || !x.packaging_used) continue;
                                          if (x.packaging_used === 'yes' && !x.packaging) continue;

                                          const isTimeRow = isTimeBasedWorkRate(x.work_rate_id);
                                          const hours = parseInt(x.time_hours || '0') || 0;
                                          const minutes = parseInt(x.time_minutes || '0') || 0;
                                          const totalMinutes = Math.max(0, hours * 60 + minutes);
                                          const qty = isTimeRow ? totalMinutes : parseInt(x.quantity || '0');
                                          if (!qty || qty <= 0) continue;

                                          const resolvedRateId = x.work_rate_id === CW_TIME_RATE_KEY ? await ensureCwTimeRateId() : x.work_rate_id;

                                          itemsToInsert.push({
                                            employee_id: cwSelectedEmployee.id,
                                            date: dateStr,
                                            quantity: qty,
                                            work_rate_id: resolvedRateId,
                                            packaging: x.packaging_used === 'yes' ? x.packaging : '',
                                            packaging_used: x.packaging_used === 'yes',
                                            supplier_id: x.supplier_id || null,
                                            _pick: x.pick || null,
                                          });
                                        }

                                        if (!itemsToInsert.length) return showToast('Добавьте хотя бы один корректный товар/операцию', 'error');
                                        const dates = Array.from(new Set(itemsToInsert.map((x: any) => x.date)));
                                        const { data: existingLogs } = await supabase.from('work_logs').select('*').eq('employee_id', cwSelectedEmployee.id).in('date', dates as any).is('deleted_at', null);
                                        const nextSnapshots = { ...(cwWorkRateSnapshots || {}) } as Record<string, number>;
                                        let createdCount = 0;
                                        let updatedCount = 0;
                                        const pickLinks: Array<{ log: string; key: string; cat: string; qty: number }> = [];
                                        for (const itemRaw of itemsToInsert) {
                                          const { _pick, ...item } = itemRaw;
                                          const existing = (existingLogs || []).find((row: any) =>
                                            String(row.employee_id) === String(item.employee_id) &&
                                            String(row.date) === String(item.date) &&
                                            String(row.work_rate_id) === String(item.work_rate_id) &&
                                            String(row.supplier_id || '') === String(item.supplier_id || '') &&
                                            Boolean(row.packaging_used) === Boolean(item.packaging_used) &&
                                            String(row.packaging || '') === String(item.packaging || '')
                                          );
                                          if (existing) {
                                            const newQty = Number(existing.quantity || 0) + Number(item.quantity || 0);
                                            await supabase.from('work_logs').update({ quantity: newQty }).eq('id', existing.id);
                                            if (!(String(existing.id) in nextSnapshots)) {
                                              nextSnapshots[String(existing.id)] = Number(getEffectiveWorkRatePrice(String(existing.work_rate_id || ''), String(existing.employee_id || item.employee_id || '')) || 0);
                                            }
                                            updatedCount += 1;
                                            if (_pick) pickLinks.push({ log: String(existing.id), key: _pick.key, cat: _pick.category, qty: Number(item.quantity || 0) });
                                            await logAssemblyChange('work_logs', 'update', existing, { ...existing, quantity: newQty });
                                          } else {
                                            const { data: created } = await supabase.from('work_logs').insert([item]).select('*').maybeSingle();
                                            if (created) {
                                              nextSnapshots[String(created.id)] = Number(getEffectiveWorkRatePrice(String(created.work_rate_id || ''), String(created.employee_id || '')) || 0);
                                              createdCount += 1;
                                              if (_pick) pickLinks.push({ log: String(created.id), key: _pick.key, cat: _pick.category, qty: Number(item.quantity || 0) });
                                              logAssemblyChange('work_logs', 'create', null, created);
                                            }
                                          }
                                        }
                                        setCwWorkRateSnapshots(nextSnapshots);
                                        await supabase.from('app_settings').upsert([{ key: 'cw_work_rate_snapshots_v1', value: JSON.stringify(nextSnapshots) }], { onConflict: 'key' });
                                        try { await commitPickingLinks(pickLinks); } catch {}
                                        showToast(`Создано: ${createdCount}, обновлено: ${updatedCount}`, 'success');
                                      }

                                      setCompletedWorkStep('CALENDAR');
                                      setCwForm({ quantity: '', work_rate_id: '', packaging: '', packaging_used: 'no', supplier_id: '' });
                                      setCwFormItems([{ supplier_id: '', work_rate_id: '', quantity: '', time_hours: '', time_minutes: '', packaging_used: '', packaging: '' }]);
                                      const { data } = await supabase.from('work_logs').select('*').eq('employee_id', cwSelectedEmployee.id);
                                      setCwWorkLogs(data || []);
                                    }}
                                    disabled={!hasAssemblyButtonAccess('cw_form_save')}
                                    className={`w-full min-h-[52px] py-3 text-base font-medium ${editingWorkLogId ? 'btn-primary' : 'btn-success'} ${!hasAssemblyButtonAccess('cw_form_save') ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  >
                                    {editingWorkLogId ? 'Обновить' : 'Сохранить'}
                                  </button>
                                </div>
                            </div>
                            )}

                            {/* Daily History */}
                            {completedWorkStep === 'FORM' && cwSelectedDate && (
                            <div className="mt-6 bg-white/95 backdrop-blur p-6 rounded-2xl shadow-lg border border-slate-200">
                                <h4 className="font-bold mb-4">История за {cwSelectedDate.toLocaleDateString()}</h4>
                                <div className="space-y-2">
                                {cwWorkLogs.filter(l => l.date === cwSelectedDate.toLocaleDateString('en-CA')).map(log => {
                                    const rate = cwWorkRates.find(r => r.id === log.work_rate_id);
                                    const supplier = suppliers.find(s => s.id === log.supplier_id);
                                    return (
                                    <div key={log.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg text-sm">
                                        <div>
                                        <span className="font-medium">{rate?.name}</span>
                                        {supplier && <span className="ml-2 text-slate-500">({supplier.name})</span>}
                                        <div className="text-slate-500">{isTimeBasedWorkRate(log.work_rate_id) ? `${Math.floor(Number(log.quantity || 0) / 60)}ч ${Number(log.quantity || 0) % 60}м` : `${log.quantity} шт`} • {log.packaging || 'без упаковки'}</div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {(!currentEmployee || currentEmployee.role === 'admin') && (
                                            <div className="font-bold text-green-600">
                                            {/юл|juli/i.test(String(cwSelectedEmployee?.full_name || cwSelectedEmployee?.login || ''))
                                              ? (/админ/i.test(String(rate?.name || ''))
                                                  ? `${Math.floor(Number(log.quantity || 0) * Number(getWorkLogSnapshotPrice(log) || 0)).toLocaleString('ru-RU')} ₽`
                                                  : '—')
                                              : `${(Number(log.quantity || 0) * Number(getWorkLogSnapshotPrice(log) || 0)).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽`}
                                            </div>
                                            )}
                                            <button
                                                onClick={() => {
                                                    if (!hasAssemblyButtonAccess('cw_form_edit')) return;
                                                    setCwForm({
                                                        quantity: log.quantity.toString(),
                                                        work_rate_id: log.work_rate_id,
                                                        packaging: log.packaging || '',
                                                        packaging_used: log.packaging_used ? 'yes' : 'no',
                                                        supplier_id: log.supplier_id || ''
                                                    });
                                                    setCwFormItems([{
                                                      supplier_id: log.supplier_id || '',
                                                      work_rate_id: isTimeBasedWorkRate(log.work_rate_id) ? CW_TIME_RATE_KEY : log.work_rate_id,
                                                      quantity: isTimeBasedWorkRate(log.work_rate_id) ? '' : String(log.quantity || ''),
                                                      time_hours: isTimeBasedWorkRate(log.work_rate_id) ? String(Math.floor(Number(log.quantity || 0) / 60)) : '',
                                                      time_minutes: isTimeBasedWorkRate(log.work_rate_id) ? String(Number(log.quantity || 0) % 60) : '',
                                                      packaging_used: log.packaging_used ? 'yes' : 'no',
                                                      packaging: log.packaging || ''
                                                    }]);
                                                    setEditingWorkLogId(log.id);
                                                }}
                                                disabled={!hasAssemblyButtonAccess('cw_form_edit')}
                                                className={`text-indigo-500 hover:text-indigo-700 p-1 hover:bg-indigo-50 rounded ${!hasAssemblyButtonAccess('cw_form_edit') ? 'opacity-40 cursor-not-allowed' : ''}`}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => { if (!hasAssemblyButtonAccess('cw_form_delete')) return; handleDeleteWorkLog(log.id); }} disabled={!hasAssemblyButtonAccess('cw_form_delete')} className={`text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded ${!hasAssemblyButtonAccess('cw_form_delete') ? 'opacity-40 cursor-not-allowed' : ''}`}>
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    );
                                })}
                                {cwWorkLogs.filter(l => l.date === cwSelectedDate.toLocaleDateString('en-CA')).length === 0 && (
                                    <div className="text-slate-500 text-center py-4">Нет записей</div>
                                )}
                                </div>
                            </div>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Report Modal */}
              {cwReportModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-4 px-2">
                  <div className={`bg-white p-4 md:p-6 rounded-2xl shadow-2xl w-full transition-all max-h-[94vh] overflow-auto ${cwReportResult ? 'max-w-6xl' : 'max-w-2xl'}`}>
                    <div className="-mx-4 md:-mx-6 -mt-4 md:-mt-6 mb-5 flex items-center gap-3 rounded-t-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 text-white">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20"><FileSpreadsheet className="h-5 w-5" /></div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Сборка</div>
                        <h3 className="truncate text-lg font-bold leading-tight">Отчет по выполненной работе</h3>
                      </div>
                      <button onClick={() => setCwReportModalOpen(false)} className="rounded-xl p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white"><X className="h-5 w-5" /></button>
                    </div>

                    <div className={`grid gap-4 mb-6 items-start ${cwReportResult ? 'grid-cols-1 xl:grid-cols-[1.3fr_0.85fr_0.85fr]' : 'grid-cols-1'}`}>
                      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3 gap-3">
                          <div>
                            <label className="block text-sm font-semibold text-slate-800 mb-1">Период отчёта</label>
                            <div className="text-xs text-slate-500">Выбери диапазон дат и при необходимости исключи отдельные дни</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCwReportDatePickerOpen(true);
                            setCwReportPickingEnd(false);
                            setCwReportDatePickerMonth(new Date(`${cwReportForm.start_date || mskTodayYmd()}T12:00:00`));
                          }}
                          className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-indigo-300 hover:bg-indigo-50 transition"
                        >
                          <div className="text-xs text-slate-500 mb-1">Период</div>
                          <div className="text-sm font-semibold text-slate-900">{new Date(`${cwReportForm.start_date}T12:00:00`).toLocaleDateString('ru-RU')} — {new Date(`${cwReportForm.end_date}T12:00:00`).toLocaleDateString('ru-RU')}</div>
                          <div className="text-xs text-slate-500 mt-1">Нажми, чтобы выбрать начало и конец периода в одном календаре</div>
                        </button>
                        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium text-slate-700">Исключить даты из периода</div>
                            <div className="text-xs text-slate-500">Нажми на день, чтобы исключить его из отчёта</div>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-56 overflow-y-auto">
                            {getDatesInRange(cwReportForm.start_date, cwReportForm.end_date).map((dateStr) => {
                              const excluded = cwReportExcludedDates.includes(dateStr);
                              return (
                                <button
                                  key={`cw-report-date-${dateStr}`}
                                  type="button"
                                  onClick={() => setCwReportExcludedDates((prev) => excluded ? prev.filter((x) => x !== dateStr) : [...prev, dateStr])}
                                  className={`rounded-xl border px-3 py-2 text-left transition-all ${excluded ? 'bg-rose-100 border-rose-300 text-rose-700 shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'}`}
                                >
                                  <div className="text-xs text-slate-500">{new Date(`${dateStr}T12:00:00`).toLocaleDateString('ru-RU', { month: 'short' })}</div>
                                  <div className="font-semibold text-sm">{new Date(`${dateStr}T12:00:00`).toLocaleDateString('ru-RU', { day: '2-digit' })}</div>
                                  <div className="text-[11px] mt-1">{excluded ? 'Исключено' : 'В отчёте'}</div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      {cwReportDatePickerOpen && (
                        <div className="fixed inset-0 z-[80] bg-slate-900/50 backdrop-blur-sm backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setCwReportDatePickerOpen(false)}>
                          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl p-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <div className="text-lg font-bold text-slate-900">Выбор периода</div>
                                <div className="text-xs text-slate-500">Сначала выбери дату начала, потом дату конца</div>
                              </div>
                              <button onClick={() => setCwReportDatePickerOpen(false)} className="p-2 rounded-lg hover:bg-slate-100"><X className="h-5 w-5" /></button>
                            </div>
                            <div className="flex items-center justify-between mb-3">
                              <button type="button" onClick={() => setCwReportDatePickerMonth(new Date(cwReportDatePickerMonth.getFullYear(), cwReportDatePickerMonth.getMonth() - 1, 1))} className="p-2 rounded-lg hover:bg-slate-100"><ChevronLeft className="h-4 w-4" /></button>
                              <div className="font-semibold capitalize">{cwReportDatePickerMonth.toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}</div>
                              <button type="button" onClick={() => setCwReportDatePickerMonth(new Date(cwReportDatePickerMonth.getFullYear(), cwReportDatePickerMonth.getMonth() + 1, 1))} className="p-2 rounded-lg hover:bg-slate-100"><ChevronRight className="h-4 w-4" /></button>
                            </div>
                            <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[10px] font-medium text-slate-400">{['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map((d) => <div key={`cw-r-${d}`}>{d}</div>)}</div>
                            <div className="grid grid-cols-7 gap-1">
                              {(() => {
                                const year = cwReportDatePickerMonth.getFullYear();
                                const month = cwReportDatePickerMonth.getMonth();
                                const daysInMonth = new Date(year, month + 1, 0).getDate();
                                const firstDay = new Date(year, month, 1).getDay() || 7;
                                const cells: any[] = [];
                                for (let i = 1; i < firstDay; i++) cells.push(<div key={`cw-r-empty-${i}`} />);
                                for (let d = 1; d <= daysInMonth; d++) {
                                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                  const start = cwReportForm.start_date;
                                  const end = cwReportForm.end_date;
                                  const inRange = start && end && dateStr >= start && dateStr <= end;
                                  const isStart = dateStr === start;
                                  const isEnd = dateStr === end;
                                  cells.push(
                                    <button key={`cw-r-day-${d}`} type="button" onClick={() => {
                                      if (!cwReportPickingEnd) {
                                        setCwReportForm(prev => ({ ...prev, start_date: dateStr, end_date: dateStr }));
                                        setCwReportPickingEnd(true);
                                        setCwReportExcludedDates([]);
                                      } else {
                                        const startDate = cwReportForm.start_date;
                                        if (!startDate || dateStr < startDate) setCwReportForm(prev => ({ ...prev, start_date: dateStr, end_date: startDate || dateStr }));
                                        else setCwReportForm(prev => ({ ...prev, end_date: dateStr }));
                                        setCwReportPickingEnd(false);
                                        setCwReportExcludedDates([]);
                                        setCwReportDatePickerOpen(false);
                                      }
                                    }} className={`min-h-[52px] rounded-xl border p-2 text-left ${isStart || isEnd ? 'bg-indigo-600 border-indigo-600 text-white' : inRange ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'bg-white border-slate-200 text-slate-800 hover:border-indigo-300'}`}>
                                      <div className="text-xs font-semibold">{d}</div>
                                      {isStart && <div className="text-[10px] mt-1">Старт</div>}
                                      {isEnd && !isStart && <div className="text-[10px] mt-1">Конец</div>}
                                    </button>
                                  );
                                }
                                return cells;
                              })()}
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <label className="block text-sm font-semibold text-slate-800 mb-2">Сотрудник</label>
                        <SearchSelect
                          value={cwReportForm.employee_id}
                          onChange={(id) => setCwReportForm({ ...cwReportForm, employee_id: id })}
                          emptyLabel="Выберите сотрудника..."
                          options={[
                            { value: '__ALL__', label: 'Все сотрудники' },
                            ...employees
                              .filter(e => String(e.role || '').toLowerCase() !== 'admin' && String(e.login || '').toLowerCase() !== 'admin')
                              .map(e => ({ value: String(e.id), label: String(e.full_name || '') })),
                          ]}
                          ariaLabel="Сотрудник"
                        />
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <label className="block text-sm font-semibold text-slate-800 mb-2">Поставщик</label>
                        <Select
                          value={cwReportForm.supplier_id}
                          onChange={e => setCwReportForm({...cwReportForm, supplier_id: e.target.value})}
                          className="w-full p-2 border rounded-lg text-sm"
                        >
                          <option value="">Выберите поставщика...</option>
                          <option value="__ALL__">По всем поставщикам</option>
                          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </Select>
                      </div>
                    </div>

                    {cwReportResult && (
                      <div className="mb-6 overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 text-slate-700 font-medium">
                            <tr>
                              <th className="p-3 rounded-tl-lg">Дата</th>
                              {cwReportForm.employee_id === '__ALL__' && <th className="p-3">Сотрудник</th>}
                              {cwReportForm.supplier_id === '__ALL__' && <th className="p-3">Поставщик</th>}
                              <th className="p-3">Вид работы</th>
                              <th className="p-3 text-right">Кол-во</th>
                              <th className="p-3 text-right">Цена</th>
                              <th className="p-3 rounded-tr-lg text-right">Сумма</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {cwReportResult.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-3">{new Date(item.date).toLocaleDateString('ru-RU')}</td>
                                {cwReportForm.employee_id === '__ALL__' && <td className="p-3">{item.employee_name || '-'}</td>}
                                {cwReportForm.supplier_id === '__ALL__' && <td className="p-3">{item.supplier_name || '-'}</td>}
                                <td className="p-3">{item.work_name}</td>
                                <td className="p-3 text-right">{item.quantity}</td>
                                <td className="p-3 text-right">{item.price} ₽</td>
                                <td className="p-3 text-right font-medium">{item.total} ₽</td>
                              </tr>
                            ))}
                            {cwReportResult.length === 0 && (
                              <tr>
                                <td colSpan={(cwReportForm.employee_id === '__ALL__' ? 1 : 0) + (cwReportForm.supplier_id === '__ALL__' ? 1 : 0) + 5} className="p-4 text-center text-slate-500">Нет данных за выбранный период</td>
                              </tr>
                            )}
                          </tbody>
                          <tfoot className="bg-slate-50 font-bold">
                            <tr>
                              <td colSpan={(cwReportForm.employee_id === '__ALL__' ? 1 : 0) + (cwReportForm.supplier_id === '__ALL__' ? 1 : 0) + 2} className="p-3 text-right">Итого:</td>
                              <td className="p-3 text-right text-slate-700">
                                {cwReportResult.reduce((sum, item) => sum + Number(item.quantity || 0), 0)}
                              </td>
                              <td className="p-3"></td>
                              <td className="p-3 text-right text-indigo-600">
                                {cwReportResult.reduce((sum, item) => sum + item.total, 0)} ₽
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setCwReportModalOpen(false);
                          setCwReportResult(null);
                        }}
                        className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                      >
                        Закрыть
                      </button>

                      <button
                        onClick={async () => {
                            if (!cwReportForm.employee_id || !cwReportForm.supplier_id) {
                              showToast('Заполните все поля', 'error');
                              return;
                            }

                            let query = supabase
                              .from('work_logs')
                              .select('id, date, quantity, work_rate_id, supplier_id, employee_id')
                              .is('deleted_at', null)
                              .gte('date', cwReportForm.start_date)
                              .lte('date', cwReportForm.end_date)
                              .order('date', { ascending: true });

                            if (cwReportForm.employee_id !== '__ALL__') {
                              query = query.eq('employee_id', cwReportForm.employee_id);
                            }

                            if (cwReportForm.supplier_id !== '__ALL__') {
                              query = query.eq('supplier_id', cwReportForm.supplier_id);
                            }

                            const { data: logs } = await query;
                            const filteredLogs = (logs || []).filter((log: any) => !cwReportExcludedDates.includes(String(log.date || '')));

                            const result = filteredLogs.map(log => {
                              const rate = cwWorkRates.find(r => r.id === log.work_rate_id);
                              const supplierName = suppliers.find(s => String(s.id) === String((log as any).supplier_id || ''))?.name || '-';
                              const employeeName = employees.find(e => String(e.id) === String((log as any).employee_id || ''))?.full_name || '-';
                              const price = Number(getWorkLogSnapshotPrice(log) || 0);
                              return {
                                date: log.date,
                                supplier_name: supplierName,
                                employee_name: employeeName,
                                work_name: rate?.name || 'Неизвестно',
                                quantity: Number(log.quantity || 0),
                                price,
                                total: Number(log.quantity || 0) * price
                              };
                            });

                            setCwReportResult(result);
                        }}
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        Сформировать
                      </button>

                      {cwReportResult && cwReportResult.length > 0 && (
                        <>
                        <button
                          onClick={handleDownloadCwReportPdf}
                          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" /> PDF
                        </button>
                        <button
                          onClick={handleDownloadCwReportExcel}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                        >
                          <FileSpreadsheet className="h-4 w-4" /> Excel
                        </button>
                        </>
                      )}

                      {cwReportResult && cwReportResult.length > 0 && (
                        <button
                          onClick={async () => {
                            const total = cwReportResult.reduce((sum, item) => sum + item.total, 0);
                            const supplier = suppliers.find(s => s.id === cwReportForm.supplier_id);
                            const employee = employees.find(e => e.id === cwReportForm.employee_id);
                            const supplierLabel = cwReportForm.supplier_id === '__ALL__' ? 'По всем поставщикам' : (supplier?.name || '-');

                            const message = `Отчет по сотруднику: ${employee?.full_name}\nПоставщик: ${supplierLabel}\nПериод: ${new Date(cwReportForm.start_date).toLocaleDateString('ru-RU')} - ${new Date(cwReportForm.end_date).toLocaleDateString('ru-RU')}\n\nИтого к оплате: ${total}₽`;

                            const botToken = String((telegramBotToken || '').trim());

                            if (cwReportForm.supplier_id === '__ALL__') {
                              showToast('Для «По всем поставщикам» отправка в Telegram недоступна', 'error');
                              return;
                            }

                            if (!botToken) {
                              showToast('Не задан Telegram Bot Token', 'error');
                              return;
                            }

                            if (supplier?.telegram_chat_id) {
                              try {
                                const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    chat_id: supplier.telegram_chat_id,
                                    text: message,
                                  }),
                                });

                                if (response.ok) {
                                  showToast('Отчет отправлен в Telegram', 'success');
                                } else {
                                  showToast('Ошибка отправки', 'error');
                                }
                              } catch (err) {
                                showToast('Ошибка отправки', 'error');
                              }
                            } else {
                                showToast('У поставщика не указан Telegram Chat ID', 'error');
                            }
                          }}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                        >
                          <Send className="h-4 w-4" /> Telegram
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
  );
}
