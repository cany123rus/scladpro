// Вынесено из Dashboard.tsx автоматически (ленивая загрузка раздела). Данные приходят пропсами из Dashboard.
/* eslint-disable */
import { Truck, Wallet, FileText, X, Plus, Trash2, Pencil } from 'lucide-react';
import { Select } from '../../components/ui/Select';
import { QtyField } from '../../components/ui/QtyField';

export function Block_34234(props: any) {
  const { deliveryDateEnd, deliveryDateStart, deliveryForm, deliveryHistory, deliveryInfographics, deliveryInfographicsFiltered, deliveryPersons, deliverySupplierFilter, deliverySupplyTypes, filteredDeliveryHistory, formatDeliveryUnits, handleAddDelivery, handleDeleteDelivery, handleToggleDeliveryPaid, loadDeliveryData, openDeliveryEditModal, setDeliveryDateEnd, setDeliveryDateStart, setDeliveryForm, setDeliveryPayModal, setDeliveryQuickPayCourierFilter, setDeliveryQuickPayPayerSupplierId, setDeliveryQuickPaySelectedIds, setDeliverySupplierFilter, setShowDeliveryModal, setShowDeliveryPersonModal, setShowDeliveryQuickPayModal, setShowDeliveryReportModal, setShowDeliverySupplyTypeModal, suppliers } = props;
  return (
<div className="fixed inset-0 z-[76] bg-slate-950/60 backdrop-blur-sm flex items-end md:items-center justify-center p-2 md:p-4" onClick={() => setShowDeliveryModal(false)}>
              <div className="bg-slate-50 rounded-t-3xl md:rounded-3xl shadow-2xl w-[98vw] max-w-6xl h-[88vh] flex flex-col overflow-hidden border border-white/70" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200 px-4 py-4 md:px-6">
                  <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-slate-300 md:hidden" />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-orange-700 mb-2">
                        <Truck className="h-3.5 w-3.5" /> Логистика
                      </div>
                      <h2 className="text-lg md:text-2xl font-bold text-slate-950">История доставок</h2>
                      <p className="text-xs md:text-sm text-slate-500 mt-1">Доставщик, коробки по поставщикам, стоимость и статус оплаты.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          setShowDeliveryQuickPayModal(true);
                          setDeliveryQuickPayCourierFilter('all');
                          setDeliveryQuickPayPayerSupplierId('');
                          setDeliveryQuickPaySelectedIds([]);
                          if (!deliveryHistory.length) await loadDeliveryData();
                        }}
                        className="h-10 rounded-2xl border border-emerald-600 bg-emerald-600 px-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 inline-flex items-center justify-center gap-2"
                      >
                        <Wallet className="h-4 w-4" />
                        <span className="hidden sm:inline">Быстрая оплата</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeliveryReportModal(true)}
                        className="h-10 rounded-2xl border border-sky-600 bg-sky-600 px-3 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 inline-flex items-center justify-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        <span className="hidden sm:inline">Отчет</span>
                      </button>
                      <button onClick={() => setShowDeliveryModal(false)} className="p-2 rounded-lg hover:bg-slate-100" aria-label="Закрыть доставки">
                        <X className="h-5 w-5 text-slate-500" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-[11px] text-slate-500">Коробок всего</div>
                      <div className="text-xl font-black text-slate-900">{Math.floor(deliveryInfographics.totalBoxes).toLocaleString('ru-RU')}</div>
                    </div>
                    <div className="rounded-2xl border border-orange-200 bg-orange-50 p-3">
                      <div className="text-[11px] text-orange-700">Затраты на доставку</div>
                      <div className="text-xl font-black text-orange-800">{deliveryInfographics.totalAmount.toFixed(2)} ₽</div>
                    </div>
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3">
                      <div className="text-[11px] text-rose-700">Не оплаченных</div>
                      <div className="text-xl font-black text-rose-800">{deliveryInfographics.unpaidCount}</div>
                    </div>
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                      <div className="text-[11px] text-amber-700">Сумма к оплате</div>
                      <div className="text-xl font-black text-amber-800">{deliveryInfographics.unpaidAmount.toFixed(2)} ₽</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 md:p-6 2xl:flex-1 2xl:overflow-y-auto custom-scrollbar space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <div className="text-sm font-bold text-slate-900">Новая доставка</div>
                        <div className="text-xs text-slate-500">Сначала создаем доставку, потом отдельно проставляем оплату.</div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowDeliveryPersonModal(true)}
                          className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center justify-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Добавить доставщика
                        </button>
                        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          Коробок в форме: {deliveryForm.rows.reduce((sum, row) => sum + Number(row.boxes || 0), 0).toLocaleString('ru-RU')}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Доставщик</span>
                        <Select
                          value={deliveryForm.courier}
                          onChange={(e) => setDeliveryForm(prev => ({ ...prev, courier: e.target.value }))}
                          className="oc-input h-11 rounded-xl bg-white text-sm"
                        >
                          <option value="">Выберите доставщика</option>
                          {deliveryPersons.map((name) => (
                            <option key={'delivery-person-' + name} value={name}>{name}</option>
                          ))}
                        </Select>
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Тип поставки</span>
                        <div className="flex gap-2">
                          <Select
                            value={deliveryForm.supply_type}
                            onChange={(e) => setDeliveryForm(prev => ({ ...prev, supply_type: e.target.value }))}
                            className="oc-input h-11 rounded-xl bg-white text-sm flex-1 min-w-0"
                          >
                            <option value="">Не указан</option>
                            {deliverySupplyTypes.map((t) => (
                              <option key={'delivery-supply-type-' + t} value={t}>{t}</option>
                            ))}
                          </Select>
                          <button
                            type="button"
                            onClick={() => setShowDeliverySupplyTypeModal(true)}
                            className="h-11 w-11 shrink-0 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-600 inline-flex items-center justify-center hover:bg-indigo-100"
                            title="Управление типами поставки"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Дата</span>
                        <input
                          type="date"
                          value={deliveryForm.date}
                          onChange={(e) => setDeliveryForm(prev => ({ ...prev, date: e.target.value }))}
                          className="oc-input h-11 rounded-xl bg-white text-sm"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Сумма</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={deliveryForm.amount}
                          onChange={(e) => {
                            let v = e.target.value.replace(/[^\d.,]/g, '').replace(',', '.');
                            const parts = v.split('.');
                            if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('');
                            setDeliveryForm(prev => ({ ...prev, amount: v }));
                          }}
                          placeholder="0"
                          className="oc-input h-11 rounded-xl bg-white text-sm"
                        />
                      </label>
                    </div>

                    <div className="mt-4 space-y-2">
                      {deliveryForm.rows.map((row, index) => (
                        <div key={'delivery-form-row-' + index} className="grid grid-cols-2 md:grid-cols-[1fr_120px_120px_44px] gap-2">
                          <Select
                            value={row.supplier_id}
                            onChange={(e) => setDeliveryForm(prev => ({
                              ...prev,
                              rows: prev.rows.map((item, itemIndex) => itemIndex === index ? { ...item, supplier_id: e.target.value } : item),
                            }))}
                            className="oc-input h-11 rounded-xl bg-white text-sm col-span-2 md:col-span-1"
                          >
                            <option value="">Поставщик</option>
                            {suppliers.map((supplier) => (
                              <option key={'delivery-row-supplier-' + index + '-' + supplier.id} value={String(supplier.id)}>{supplier.name}</option>
                            ))}
                          </Select>
                          <QtyField
                           
                            min="0"
                            step="1"
                            value={row.boxes}
                            onChange={(e) => setDeliveryForm(prev => ({
                              ...prev,
                              rows: prev.rows.map((item, itemIndex) => itemIndex === index ? { ...item, boxes: e.target.value } : item),
                            }))}
                            placeholder="Коробки"
                            className="oc-input h-11 rounded-xl bg-white text-sm"
                          />
                          <QtyField
                           
                            min="0"
                            step="1"
                            value={row.pallets}
                            onChange={(e) => setDeliveryForm(prev => ({
                              ...prev,
                              rows: prev.rows.map((item, itemIndex) => itemIndex === index ? { ...item, pallets: e.target.value } : item),
                            }))}
                            placeholder="Паллеты"
                            className="oc-input h-11 rounded-xl bg-white text-sm"
                          />
                          <button
                            type="button"
                            disabled={deliveryForm.rows.length === 1}
                            onClick={() => setDeliveryForm(prev => ({ ...prev, rows: prev.rows.filter((_, itemIndex) => itemIndex !== index) }))}
                            className={'h-11 rounded-xl border border-rose-200 bg-white text-rose-600 inline-flex items-center justify-center col-span-2 md:col-span-1 ' + (deliveryForm.rows.length === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-rose-50')}
                            title="Удалить поле"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryForm(prev => ({ ...prev, rows: [...prev.rows, { supplier_id: '', boxes: '', pallets: '' }] }))}
                        className="h-10 rounded-xl border border-orange-200 bg-orange-50 px-4 text-sm font-semibold text-orange-700 hover:bg-orange-100 inline-flex items-center justify-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        + Добавить поставщика к доставке
                      </button>
                      <button
                        type="button"
                        onClick={handleAddDelivery}
                        className="h-10 rounded-xl bg-orange-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 inline-flex items-center justify-center gap-2"
                      >
                        <Truck className="h-4 w-4" />
                        Создать доставку
                      </button>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                      <div className="text-sm font-bold text-slate-900">Фильтр и поставщики с доставками</div>
                      <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                        <div><label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Дата с</label><input type="date" value={deliveryDateStart} onChange={(e) => setDeliveryDateStart(e.target.value)} className="oc-input h-11 rounded-xl bg-white text-sm" /></div>
                        <div><label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Дата по</label><input type="date" value={deliveryDateEnd} onChange={(e) => setDeliveryDateEnd(e.target.value)} className="oc-input h-11 rounded-xl bg-white text-sm" /></div>
                        {(deliveryDateStart || deliveryDateEnd) && (
                          <button type="button" onClick={() => { setDeliveryDateStart(''); setDeliveryDateEnd(''); }} className="h-11 px-3 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Сброс</button>
                        )}
                        <div><label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Поставщик</label>
                          <Select value={deliverySupplierFilter} onChange={(e) => setDeliverySupplierFilter(e.target.value)} className="oc-input h-11 rounded-xl bg-white text-sm sm:max-w-xs">
                            <option value="all">Все поставщики</option>
                            {deliveryInfographicsFiltered.supplierRows.map((row) => (
                              <option key={'delivery-filter-' + row.supplierId} value={row.supplierId}>{row.supplierName}</option>
                            ))}
                          </Select>
                        </div>
                      </div>
                    </div>

                    {deliveryInfographicsFiltered.supplierRows.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">Нет доставок за выбранный период.</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                        {deliveryInfographicsFiltered.supplierRows.map((row) => (
                          <div key={'delivery-supplier-card-' + row.supplierId} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                            <div className="font-semibold text-slate-900 truncate" title={row.supplierName}>{row.supplierName}</div>
                            <div className="mt-2 grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                              <div>
                                <div className="text-slate-500">Коробок</div>
                                <div className="font-bold text-slate-900">{Math.floor(row.boxes).toLocaleString('ru-RU')}</div>
                              </div>
                              <div>
                                <div className="text-slate-500">Паллет</div>
                                <div className="font-bold text-slate-900">{Math.floor(row.pallets).toLocaleString('ru-RU')}</div>
                              </div>
                              <div>
                                <div className="text-slate-500">Доставок</div>
                                <div className="font-bold text-slate-900">{row.deliveries}</div>
                              </div>
                              <div>
                                <div className="text-slate-500">Сумма</div>
                                <div className="font-bold text-orange-700">{row.amount.toFixed(2)} ₽</div>
                              </div>
                              <div>
                                <div className="text-slate-500">Долг</div>
                                <div className="font-bold text-rose-700">{row.unpaidAmount.toFixed(2)} ₽</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {filteredDeliveryHistory.length === 0 ? (
                      <div className="min-h-[220px] rounded-3xl border border-dashed border-slate-200 bg-white flex flex-col items-center justify-center text-center text-slate-400">
                        <Truck className="h-12 w-12 mb-3 text-orange-200" />
                        <div className="font-medium">История доставок пуста</div>
                      </div>
                    ) : filteredDeliveryHistory.map((delivery: any) => {
                      const rows = Array.isArray(delivery?.rows) ? delivery.rows : [];
                      const totalBoxes = rows.reduce((sum: number, row: any) => sum + Number(row?.boxes || 0), 0);
                      const totalPallets = rows.reduce((sum: number, row: any) => sum + Number(row?.pallets || 0), 0);
                      const paidBySupplier = suppliers.find((s: any) => String(s.id) === String(delivery?.paid_by_supplier_id));
                      return (
                        <div key={'delivery-history-' + delivery.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="font-bold text-slate-950">{delivery.courier || 'Доставщик'}</div>
                                {delivery.supply_type && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                                    <Truck className="h-3 w-3" /> {delivery.supply_type}
                                  </span>
                                )}
                                <span className={'rounded-full px-2.5 py-1 text-[11px] font-semibold ' + (delivery.is_paid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700')}>
                                  {delivery.is_paid ? 'Оплачено' : 'Не оплачено'}
                                </span>
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                {delivery?.date ? new Date(String(delivery.date) + 'T12:00:00').toLocaleDateString('ru-RU') : '—'} • {formatDeliveryUnits(totalBoxes, totalPallets)}
                              </div>
                              {delivery.is_paid && (
                                <div className="mt-1 text-xs text-emerald-700">
                                  Кто оплатил: {paidBySupplier?.name || 'Поставщик'}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col md:items-end gap-2">
                              <div className="text-2xl font-black text-orange-700">{Number(delivery.amount || 0).toFixed(2)} ₽</div>
                              <div className="flex flex-wrap justify-start md:justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => openDeliveryEditModal(delivery)}
                                  className="h-9 rounded-xl border border-sky-200 bg-sky-50 px-3 text-xs font-semibold text-sky-700 hover:bg-sky-100 inline-flex items-center gap-1.5"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  Редактировать
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDelivery(String(delivery.id))}
                                  className="h-9 rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-100 inline-flex items-center gap-1.5"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Удалить
                                </button>
                              </div>
                              {delivery.is_paid ? (
                                <button
                                  type="button"
                                  onClick={() => handleToggleDeliveryPaid(String(delivery.id), false)}
                                  className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                  Снять оплату
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setDeliveryPayModal({ open: true, deliveryId: String(delivery.id), payerSupplierId: '' })}
                                  className="h-9 rounded-xl bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700"
                                >
                                  Оплатить
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {rows.map((row: any, rowIndex: number) => {
                              const supplier = suppliers.find((s: any) => String(s.id) === String(row?.supplier_id));
                              const unitsText = formatDeliveryUnits(Number(row?.boxes || 0), Number(row?.pallets || 0));
                              return (
                                <span key={'delivery-history-row-' + delivery.id + '-' + rowIndex} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
                                  {supplier?.name || 'Поставщик'}: <b>{unitsText}</b>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
  );
}
