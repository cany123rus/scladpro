// Вынесено из Dashboard.tsx автоматически (ленивая загрузка раздела). Данные приходят пропсами из Dashboard.
/* eslint-disable */
import { X, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Select } from '../../components/ui/Select';

export function Block_35685(props: any) {
  const { handleDownloadTempWorkerReportExcel, handleDownloadTempWorkerReportPdf, setShowTempWorkerReportModal, setTempWorkerReportForm, suppliers, tempTypeQty, tempWorkerReportForm, tempWorkerReportGrouped, tempWorkerReportWorkerOptions } = props;
  return (
<div className="fixed inset-0 z-[75] bg-slate-900/50 backdrop-blur-sm flex items-end md:items-center justify-center p-2 md:p-4" onClick={() => setShowTempWorkerReportModal(false)}>
              <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl w-[98vw] max-w-6xl max-h-[92svh] 2xl:h-[82vh] flex flex-col overflow-y-auto 2xl:overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 z-10 bg-white border-b px-4 py-4 md:px-6">
                  <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-slate-300 md:hidden" />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg md:text-2xl font-bold text-slate-900">Отчет о временном сотруднике</h2>
                      <p className="text-xs md:text-sm text-slate-500 mt-1">Выберите период и поставщика — отчет покажет список работ по выбранному поставщику или по всем.</p>
                    </div>
                    <button onClick={() => setShowTempWorkerReportModal(false)} className="p-2 rounded-lg hover:bg-slate-100" aria-label="Закрыть отчет">
                      <X className="h-5 w-5 text-slate-500" />
                    </button>
                  </div>
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 md:p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Поставщик работ</span>
                        <Select
                          value={tempWorkerReportForm.supplier_id}
                          onChange={(e) => setTempWorkerReportForm(prev => ({ ...prev, supplier_id: e.target.value }))}
                          className="oc-input h-11 rounded-xl bg-white text-sm"
                        >
                          <option value="all">Все поставщики</option>
                          {suppliers.map((s) => (
                            <option key={`temp-report-s-${s.id}`} value={String(s.id)}>{s.name}</option>
                          ))}
                        </Select>
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Временный сотрудник</span>
                        <Select
                          value={tempWorkerReportForm.worker_name}
                          onChange={(e) => setTempWorkerReportForm(prev => ({ ...prev, worker_name: e.target.value }))}
                          className="oc-input h-11 rounded-xl bg-white text-sm"
                        >
                          <option value="all">Все временные сотрудники</option>
                          {tempWorkerReportWorkerOptions.map((name) => (
                            <option key={`temp-report-worker-${name}`} value={name}>{name}</option>
                          ))}
                        </Select>
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Кто оплатил</span>
                        <Select
                          value={tempWorkerReportForm.paid_by_supplier_id}
                          onChange={(e) => setTempWorkerReportForm(prev => ({ ...prev, paid_by_supplier_id: e.target.value }))}
                          className="oc-input h-11 rounded-xl bg-white text-sm"
                        >
                          <option value="all">Все оплаты</option>
                          {suppliers.map((s) => (
                            <option key={`temp-report-paid-by-${s.id}`} value={String(s.id)}>{s.name}</option>
                          ))}
                        </Select>
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Статус оплаты</span>
                        <Select
                          value={tempWorkerReportForm.paid_status}
                          onChange={(e) => setTempWorkerReportForm(prev => ({ ...prev, paid_status: e.target.value }))}
                          className="oc-input h-11 rounded-xl bg-white text-sm"
                        >
                          <option value="all">Все статусы</option>
                          <option value="paid">Оплачено</option>
                          <option value="unpaid">Не оплачено</option>
                        </Select>
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Дата с</span>
                        <input
                          type="date"
                          value={tempWorkerReportForm.start_date}
                          onChange={(e) => setTempWorkerReportForm(prev => ({ ...prev, start_date: e.target.value }))}
                          className="oc-input h-11 rounded-xl bg-white text-sm"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Дата по</span>
                        <input
                          type="date"
                          value={tempWorkerReportForm.end_date}
                          onChange={(e) => setTempWorkerReportForm(prev => ({ ...prev, end_date: e.target.value }))}
                          className="oc-input h-11 rounded-xl bg-white text-sm"
                        />
                      </label>
                      <div className="flex items-end gap-2">
                        <button
                          type="button"
                          onClick={handleDownloadTempWorkerReportPdf}
                          className="h-11 flex-1 px-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 inline-flex items-center justify-center gap-2 whitespace-nowrap shadow-sm"
                        >
                          <Download className="h-4 w-4" />
                          PDF
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadTempWorkerReportExcel}
                          className="h-11 flex-1 px-4 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 inline-flex items-center justify-center gap-2 whitespace-nowrap shadow-sm"
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                          Excel
                        </button>
                      </div>
                    </div>

                    {tempWorkerReportWorkerOptions.length > 0 && (
                      <div className="mt-4 border-t border-slate-200 pt-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Быстрый выбор сотрудника</div>
                          {tempWorkerReportForm.worker_name !== 'all' && (
                            <button
                              type="button"
                              onClick={() => setTempWorkerReportForm(prev => ({ ...prev, worker_name: 'all' }))}
                              className="text-xs font-medium text-slate-500 hover:text-slate-900"
                            >
                              Сбросить
                            </button>
                          )}
                        </div>
                        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:flex-wrap md:overflow-visible">
                          <button
                            type="button"
                            onClick={() => setTempWorkerReportForm(prev => ({ ...prev, worker_name: 'all' }))}
                            className={`shrink-0 rounded-full border px-3 py-2 text-sm font-medium transition-all ${tempWorkerReportForm.worker_name === 'all' ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'}`}
                          >
                            Все
                          </button>
                          {tempWorkerReportWorkerOptions.map((name) => {
                            const selected = tempWorkerReportForm.worker_name === name;
                            return (
                              <button
                                key={`temp-report-worker-chip-${name}`}
                                type="button"
                                onClick={() => setTempWorkerReportForm(prev => ({ ...prev, worker_name: name }))}
                                className={`shrink-0 rounded-full border px-3 py-2 text-sm font-medium transition-all ${selected ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700'}`}
                              >
                                {name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                      <div className="text-[11px] text-slate-500">Работ</div>
                      <div className="text-lg font-bold text-slate-900">{tempWorkerReportGrouped.totalRows}</div>
                    </div>
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 shadow-sm">
                      <div className="text-[11px] text-blue-700">Часы</div>
                      <div className="text-lg font-bold text-blue-800">{tempWorkerReportGrouped.totalHours.toFixed(2)}</div>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 shadow-sm">
	                      <div className="text-[11px] text-emerald-700">ЗП</div>
                      <div className="text-lg font-bold text-emerald-800">{tempWorkerReportGrouped.totalEarnings.toFixed(2)} ₽</div>
                    </div>
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 shadow-sm">
                      <div className="text-[11px] text-rose-700">Не оплачено</div>
                      <div className="text-lg font-bold text-rose-800">{tempWorkerReportGrouped.totalRemaining.toFixed(2)} ₽</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 md:p-6 space-y-4 2xl:flex-1 2xl:overflow-y-auto custom-scrollbar">
                  {tempWorkerReportGrouped.groups.length === 0 ? (
                    <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center text-slate-400">
                      <FileText className="h-12 w-12 mb-3 text-slate-300" />
                      <div className="font-medium">За выбранный период работ нет</div>
                    </div>
                  ) : tempWorkerReportGrouped.groups.map((group) => (
                    <div key={`temp-report-group-${group.supplierId}`} className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
                      <div className="bg-slate-50 px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-900">{group.supplierName}</div>
                          <div className="text-xs text-slate-500">Работ: {group.rows.length} • Часы: {group.hours.toFixed(2)}</div>
                        </div>
                        <div className="text-sm font-semibold text-slate-700">
                          Заработано: <span className="text-emerald-700">{group.earnings.toFixed(2)} ₽</span>
                          <span className="mx-2 text-slate-300">/</span>
                          Не оплачено: <span className="text-rose-700">{group.remaining.toFixed(2)} ₽</span>
                        </div>
                      </div>

                      <div className="md:hidden divide-y divide-slate-100">
                        {group.rows.map((row: any) => (
                          <div key={`temp-report-mobile-${row.id}`} className="p-3 text-sm">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-medium text-slate-900">{row.worker_name || row.worker || 'Без имени'}</div>
                                <div className="text-xs text-slate-500">{row?.date ? new Date(`${row.date}T12:00:00`).toLocaleDateString('ru-RU') : '—'} • {Number(row.hours || 0).toFixed(2)} ч.</div>
                              </div>
                              <div className="font-bold text-emerald-700 whitespace-nowrap">{Number(row.earnings || 0).toFixed(2)} ₽</div>
                            </div>
                            <div className="mt-1 text-xs text-slate-600 font-medium">{tempTypeQty(row)}</div>
                            <div className="mt-1 text-xs text-slate-500">Факт оплаты: {Number(row.paidAmount || 0).toFixed(2)} ₽ • Не оплачено: {Number(row.remainingAmount || 0).toFixed(2)} ₽</div>
                            <div className="mt-1 text-xs text-slate-500">Кто оплатил: {row.paidByText || '—'}</div>
                          </div>
                        ))}
                      </div>

                      <table className="hidden md:table w-full text-left text-sm">
                        <thead className="bg-white border-b border-slate-100">
                          <tr>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Дата</th>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Сотрудник</th>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Тип/Кол-во</th>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Часы</th>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Заработано</th>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Факт оплаты</th>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Кто оплатил</th>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Не оплачено</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {group.rows.map((row: any) => (
                            <tr key={`temp-report-row-${row.id}`} className="hover:bg-slate-50">
                              <td className="px-4 py-2 whitespace-nowrap">{row?.date ? new Date(`${row.date}T12:00:00`).toLocaleDateString('ru-RU') : '—'}</td>
                              <td className="px-4 py-2 font-medium text-slate-900">{row.worker_name || row.worker || 'Без имени'}</td>
                              <td className="px-4 py-2 text-slate-600 max-w-[360px] truncate" title={row.work_comment || row.comment || ''}>{tempTypeQty(row)}</td>
                              <td className="px-4 py-2">{Number(row.hours || 0).toFixed(2)}</td>
                              <td className="px-4 py-2 font-semibold text-emerald-700">{Number(row.earnings || 0).toFixed(2)} ₽</td>
                              <td className="px-4 py-2 text-violet-700">{Number(row.paidAmount || 0).toFixed(2)} ₽</td>
                              <td className="px-4 py-2 text-slate-600 max-w-[260px] truncate" title={row.paidByText || ''}>{row.paidByText || '—'}</td>
                              <td className="px-4 py-2 text-rose-700">{Number(row.remainingAmount || 0).toFixed(2)} ₽</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </div>
            </div>
  );
}
