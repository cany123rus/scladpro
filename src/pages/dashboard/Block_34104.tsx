// Вынесено из Dashboard.tsx автоматически (ленивая загрузка раздела). Данные приходят пропсами из Dashboard.
/* eslint-disable */
import { Wallet, X, Truck } from 'lucide-react';
import { SearchSelect } from '../../components/ui/SearchSelect';
import { Select } from '../../components/ui/Select';

export function Block_34104(props: any) {
  const { deliveryCourierOptions, deliveryPayerSuppliers, deliveryQuickPayCourierFilter, deliveryQuickPayPayerSupplierId, deliveryQuickPayRows, deliveryQuickPaySaving, deliveryQuickPaySelectedIds, deliveryQuickPaySelectedRows, deliveryQuickPaySelectedTotal, formatDeliveryUnits, handleConfirmDeliveryQuickPay, setDeliveryQuickPayCourierFilter, setDeliveryQuickPayPayerSupplierId, setDeliveryQuickPaySelectedIds, setShowDeliveryQuickPayModal, sumDeliveryUnits, suppliers } = props;
  return (
<div className="fixed inset-0 z-[77] bg-slate-950/60 backdrop-blur-sm flex items-end md:items-center justify-center p-2 md:p-4" onClick={() => setShowDeliveryQuickPayModal(false)}>
              <div className="bg-slate-50 rounded-t-3xl md:rounded-3xl shadow-2xl w-[98vw] max-w-5xl max-h-[92svh] 2xl:h-[82vh] flex flex-col overflow-y-auto 2xl:overflow-hidden border border-white/70" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200 px-4 py-4 md:px-6">
                  <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-slate-300 md:hidden" />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 mb-2">
                        <Wallet className="h-3.5 w-3.5" /> Массовая оплата доставок
                      </div>
                      <h2 className="text-lg md:text-2xl font-bold text-slate-950">Быстрая оплата</h2>
                      <p className="text-xs md:text-sm text-slate-500 mt-1">Выберите поставщика-плательщика и неоплаченные доставки. После подтверждения они будут отмечены оплаченными.</p>
                    </div>
                    <button onClick={() => setShowDeliveryQuickPayModal(false)} className="p-2 rounded-lg hover:bg-slate-100" aria-label="Закрыть быструю оплату доставок">
                      <X className="h-5 w-5 text-slate-500" />
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
                    <SearchSelect
                      value={deliveryQuickPayCourierFilter}
                      onChange={(v) => {
                        setDeliveryQuickPayCourierFilter(v);
                        setDeliveryQuickPaySelectedIds([]);
                      }}
                      options={[{ value: 'all', label: 'Все доставщики' }, ...deliveryCourierOptions.map((name) => ({ value: name, label: name }))]}
                      ariaLabel="Доставщик"
                    />
                    <Select
                      value={deliveryQuickPayPayerSupplierId}
                      onChange={(e) => setDeliveryQuickPayPayerSupplierId(e.target.value)}
                      className="oc-input h-11 rounded-xl bg-white text-sm"
                    >
                      <option value="">Кто оплатит доставку</option>
                      {deliveryPayerSuppliers.map((s: any) => (
                        <option key={`quick-pay-delivery-payer-${s.id}`} value={String(s.id)}>{s.name}</option>
                      ))}
                    </Select>
                    <button
                      type="button"
                      onClick={() => {
                        const visibleIds = deliveryQuickPayRows.map((delivery: any) => String(delivery.id));
                        const allSelected = visibleIds.length > 0 && visibleIds.every((id) => deliveryQuickPaySelectedIds.includes(id));
                        setDeliveryQuickPaySelectedIds(allSelected ? [] : visibleIds);
                      }}
                      className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      {deliveryQuickPayRows.length > 0 && deliveryQuickPayRows.every((delivery: any) => deliveryQuickPaySelectedIds.includes(String(delivery.id))) ? 'Снять выбор' : 'Выбрать все'}
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-[11px] text-slate-500">К оплате</div>
                      <div className="text-lg font-bold text-slate-900">{deliveryQuickPayRows.length}</div>
                    </div>
                    <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-3">
                      <div className="text-[11px] text-indigo-700">Выбрано</div>
                      <div className="text-lg font-bold text-indigo-800">{deliveryQuickPaySelectedRows.length}</div>
                    </div>
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                      <div className="text-[11px] text-emerald-700">Сумма</div>
                      <div className="text-lg font-bold text-emerald-800">{deliveryQuickPaySelectedTotal.toFixed(2)} ₽</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 md:p-6 2xl:flex-1 2xl:overflow-y-auto custom-scrollbar">
                  {deliveryQuickPayRows.length === 0 ? (
                    <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center text-slate-400">
                      <Truck className="h-12 w-12 mb-3 text-emerald-200" />
                      <div className="font-medium">Нет неоплаченных доставок</div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {deliveryQuickPayRows.map((delivery: any) => {
                        const id = String(delivery?.id || '');
                        const selected = deliveryQuickPaySelectedIds.includes(id);
                        const rows = Array.isArray(delivery?.rows) ? delivery.rows : [];
                        return (
                          <label key={`quick-pay-delivery-row-${id}`} className={`block rounded-2xl border p-3 cursor-pointer transition-all ${selected ? 'border-emerald-400 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={(e) => {
                                  setDeliveryQuickPaySelectedIds(prev => e.target.checked ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id));
                                }}
                                className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                                  <div className="font-semibold text-slate-900 truncate">{delivery?.courier || 'Доставщик'}</div>
                                  <div className="font-bold text-emerald-700">{Number(delivery?.amount || 0).toFixed(2)} ₽</div>
                                </div>
                                <div className="mt-1 text-xs text-slate-500">
                                  {delivery?.date ? new Date(String(delivery.date) + 'T12:00:00').toLocaleDateString('ru-RU') : '—'} • {formatDeliveryUnits(sumDeliveryUnits(rows, 'boxes'), sumDeliveryUnits(rows, 'pallets'))}
                                </div>
                                <div className="mt-1 text-xs text-slate-500 truncate">
                                  {rows.map((row: any) => suppliers.find((s: any) => String(s.id) === String(row?.supplier_id))?.name || 'Поставщик').join(', ') || 'Без поставщиков'}
                                </div>
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
                    Выбрано доставок: <b>{deliveryQuickPaySelectedRows.length}</b> • сумма: <b className="text-emerald-700">{deliveryQuickPaySelectedTotal.toFixed(2)} ₽</b>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowDeliveryQuickPayModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50">Отмена</button>
                    <button
                      type="button"
                      onClick={handleConfirmDeliveryQuickPay}
                      disabled={deliveryQuickPaySaving || deliveryQuickPaySelectedRows.length === 0}
                      className={`px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 ${deliveryQuickPaySaving || deliveryQuickPaySelectedRows.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {deliveryQuickPaySaving ? 'Оплачиваю...' : 'Оплатить выбранные'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
  );
}
