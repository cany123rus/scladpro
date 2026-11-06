// Вынесено из Dashboard.tsx автоматически (ленивая загрузка раздела). Данные приходят пропсами из Dashboard.
/* eslint-disable */
import { X, Download, FileSpreadsheet, Truck } from 'lucide-react';
import { Select } from '../../components/ui/Select';

export function Block_34966(props: any) {
  const { deliveryCourierOptions, deliveryInfographics, deliveryReportForm, deliveryReportGrouped, handleDownloadDeliveryReportExcel, handleDownloadDeliveryReportPdf, setDeliveryReportForm, setShowDeliveryReportModal, suppliers } = props;
  return (
<div className="fixed inset-0 z-[94] bg-slate-900/50 backdrop-blur-sm flex items-end md:items-center justify-center p-2 md:p-4" onClick={() => setShowDeliveryReportModal(false)}>
              <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl w-[98vw] max-w-6xl max-h-[92svh] 2xl:h-[82vh] flex flex-col overflow-y-auto 2xl:overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 z-10 bg-white border-b px-4 py-4 md:px-6">
                  <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-slate-300 md:hidden" />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg md:text-2xl font-bold text-slate-900">Отчет по доставкам</h2>
                      <p className="text-xs md:text-sm text-slate-500 mt-1">Период, поставщик, доставщик, оплата и PDF по текущей выборке.</p>
                    </div>
                    <button onClick={() => setShowDeliveryReportModal(false)} className="p-2 rounded-lg hover:bg-slate-100" aria-label="Закрыть отчет по доставкам">
                      <X className="h-5 w-5 text-slate-500" />
                    </button>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 md:p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Поставщик</span>
                        <Select
                          value={deliveryReportForm.supplier_id}
                          onChange={(e) => setDeliveryReportForm(prev => ({ ...prev, supplier_id: e.target.value }))}
                          className="oc-input h-11 rounded-xl bg-white text-sm"
                        >
                          <option value="all">Все поставщики</option>
                          {deliveryInfographics.supplierRows.map((row) => (
                            <option key={'delivery-report-supplier-' + row.supplierId} value={row.supplierId}>{row.supplierName}</option>
                          ))}
                        </Select>
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Доставщик</span>
                        <Select
                          value={deliveryReportForm.courier}
                          onChange={(e) => setDeliveryReportForm(prev => ({ ...prev, courier: e.target.value }))}
                          className="oc-input h-11 rounded-xl bg-white text-sm"
                        >
                          <option value="all">Все доставщики</option>
                          {deliveryCourierOptions.map((name) => (
                            <option key={'delivery-report-courier-' + name} value={name}>{name}</option>
                          ))}
                        </Select>
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Кто оплатил</span>
                        <Select
                          value={deliveryReportForm.paid_by_supplier_id}
                          onChange={(e) => setDeliveryReportForm(prev => ({ ...prev, paid_by_supplier_id: e.target.value }))}
                          className="oc-input h-11 rounded-xl bg-white text-sm"
                        >
                          <option value="all">Все оплаты</option>
                          {suppliers.map((supplier) => (
                            <option key={'delivery-report-paid-by-' + supplier.id} value={String(supplier.id)}>{supplier.name}</option>
                          ))}
                        </Select>
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Статус оплаты</span>
                        <Select
                          value={deliveryReportForm.paid_status}
                          onChange={(e) => setDeliveryReportForm(prev => ({ ...prev, paid_status: e.target.value }))}
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
                          value={deliveryReportForm.start_date}
                          onChange={(e) => setDeliveryReportForm(prev => ({ ...prev, start_date: e.target.value }))}
                          className="oc-input h-11 rounded-xl bg-white text-sm"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Дата по</span>
                        <input
                          type="date"
                          value={deliveryReportForm.end_date}
                          onChange={(e) => setDeliveryReportForm(prev => ({ ...prev, end_date: e.target.value }))}
                          className="oc-input h-11 rounded-xl bg-white text-sm"
                        />
                      </label>
                      <div className="flex items-end gap-2">
                        <button
                          type="button"
                          onClick={handleDownloadDeliveryReportPdf}
                          className="h-11 flex-1 px-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 inline-flex items-center justify-center gap-2 whitespace-nowrap shadow-sm"
                        >
                          <Download className="h-4 w-4" />
                          PDF
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadDeliveryReportExcel}
                          className="h-11 flex-1 px-4 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 inline-flex items-center justify-center gap-2 whitespace-nowrap shadow-sm"
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                          Excel
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                      <div className="text-[11px] text-slate-500">Доставок</div>
                      <div className="text-lg font-bold text-slate-900">{deliveryReportGrouped.totalDeliveries}</div>
                    </div>
                    <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 shadow-sm">
                      <div className="text-[11px] text-orange-700">Коробок</div>
                      <div className="text-lg font-bold text-orange-800">{Math.floor(deliveryReportGrouped.totalBoxes).toLocaleString('ru-RU')}</div>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 shadow-sm">
	                      <div className="text-[11px] text-emerald-700">Заработано</div>
                      <div className="text-lg font-bold text-emerald-800">{deliveryReportGrouped.totalPaid.toFixed(2)} ₽</div>
                    </div>
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 shadow-sm">
                      <div className="text-[11px] text-rose-700">Не оплачено</div>
                      <div className="text-lg font-bold text-rose-800">{deliveryReportGrouped.totalUnpaid.toFixed(2)} ₽</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 md:p-6 space-y-4 2xl:flex-1 2xl:overflow-y-auto custom-scrollbar">
                  {deliveryReportGrouped.groups.length === 0 ? (
                    <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center text-slate-400">
                      <Truck className="h-12 w-12 mb-3 text-orange-200" />
                      <div className="font-medium">За выбранный период доставок нет</div>
                    </div>
                  ) : deliveryReportGrouped.groups.map((group) => {
                    const deliveriesCount = new Set(group.rows.map((row: any) => row.deliveryId)).size;
                    return (
                      <div key={'delivery-report-group-' + group.supplierId} className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
                        <div className="bg-slate-50 px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div>
                            <div className="font-bold text-slate-900">{group.supplierName}</div>
                            <div className="text-xs text-slate-500">Доставок: {deliveriesCount} • Коробок: {Math.floor(group.boxes).toLocaleString('ru-RU')}</div>
                          </div>
                          <div className="text-sm font-semibold text-slate-700">
                            Оплачено: <span className="text-emerald-700">{group.paid.toFixed(2)} ₽</span>
                            <span className="mx-2 text-slate-300">/</span>
                            Не оплачено: <span className="text-rose-700">{group.unpaid.toFixed(2)} ₽</span>
                          </div>
                        </div>

                        <div className="md:hidden divide-y divide-slate-100">
                          {group.rows.map((row: any, rowIndex: number) => (
                            <div key={'delivery-report-mobile-' + row.deliveryId + '-' + rowIndex} className="p-3 text-sm">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="font-medium text-slate-900">{row.courier || 'Доставщик'}</div>
                                  <div className="text-xs text-slate-500">{row?.date ? new Date(String(row.date) + 'T12:00:00').toLocaleDateString('ru-RU') : '—'} • {Math.floor(Number(row.boxes || 0)).toLocaleString('ru-RU')} кор.</div>
                                </div>
                                <div className="font-bold text-orange-700 whitespace-nowrap">{Number(row.amount || 0).toFixed(2)} ₽</div>
                              </div>
                              <div className="mt-1 text-xs text-slate-500">Статус: {row.is_paid ? 'Оплачено' : 'Не оплачено'} • Кто оплатил: {row.paidByText || '—'}</div>
                            </div>
                          ))}
                        </div>

                        <table className="hidden md:table w-full text-left text-sm">
                          <thead className="bg-white border-b border-slate-100">
                            <tr>
                              <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Дата</th>
                              <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Доставщик</th>
                              <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Коробки</th>
                              <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Сумма поставщика</th>
                              <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Сумма доставки</th>
                              <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Статус</th>
                              <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Кто оплатил</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {group.rows.map((row: any, rowIndex: number) => (
                              <tr key={'delivery-report-row-' + row.deliveryId + '-' + rowIndex} className="hover:bg-slate-50">
                                <td className="px-4 py-2 whitespace-nowrap">{row?.date ? new Date(String(row.date) + 'T12:00:00').toLocaleDateString('ru-RU') : '—'}</td>
                                <td className="px-4 py-2 font-medium text-slate-900">{row.courier || 'Доставщик'}</td>
                                <td className="px-4 py-2">{Math.floor(Number(row.boxes || 0)).toLocaleString('ru-RU')}</td>
                                <td className="px-4 py-2 font-semibold text-orange-700">{Number(row.amount || 0).toFixed(2)} ₽</td>
                                <td className="px-4 py-2 text-slate-600">{Number(row.totalDeliveryAmount || 0).toFixed(2)} ₽</td>
                                <td className={'px-4 py-2 font-semibold ' + (row.is_paid ? 'text-emerald-700' : 'text-rose-700')}>{row.is_paid ? 'Оплачено' : 'Не оплачено'}</td>
                                <td className="px-4 py-2 text-slate-600 max-w-[260px] truncate" title={row.paidByText || ''}>{row.paidByText || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
  );
}
