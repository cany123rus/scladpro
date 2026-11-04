// Вынесено из Dashboard.tsx автоматически (ленивая загрузка раздела). Данные приходят пропсами из Dashboard.
/* eslint-disable */
import { X, Plus, Trash2 } from 'lucide-react';
import { Select } from '../../components/ui/Select';
import { QtyField } from '../../components/ui/QtyField';

export function Block_34811(props: any) {
  const { closeDeliveryEditModal, deliveryCourierOptions, deliveryEditModal, deliverySupplyTypes, handleUpdateDelivery, setDeliveryEditModal, setShowDeliverySupplyTypeModal, suppliers } = props;
  return (
<div className="fixed inset-0 z-[93] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeDeliveryEditModal}>
              <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-950">Редактировать доставку</h3>
                    <div className="mt-1 text-sm text-slate-500">Измените доставщика, сумму и строки поставщиков.</div>
                  </div>
                  <button onClick={closeDeliveryEditModal} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Закрыть редактирование доставки">
                    <X className="h-5 w-5 text-slate-500" />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Дата</span>
                    <input
                      type="date"
                      value={deliveryEditModal.date}
                      onChange={(e) => setDeliveryEditModal(prev => ({ ...prev, date: e.target.value }))}
                      className="oc-input h-11 rounded-xl bg-white text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Доставщик</span>
                    <Select
                      value={deliveryEditModal.courier}
                      onChange={(e) => setDeliveryEditModal(prev => ({ ...prev, courier: e.target.value }))}
                      className="oc-input h-11 rounded-xl bg-white text-sm"
                    >
                      <option value="">Выберите доставщика</option>
                      {deliveryCourierOptions.map((name) => (
                        <option key={'delivery-edit-person-' + name} value={name}>{name}</option>
                      ))}
                    </Select>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Тип поставки</span>
                    <div className="flex gap-2">
                      <Select
                        value={deliveryEditModal.supply_type}
                        onChange={(e) => setDeliveryEditModal(prev => ({ ...prev, supply_type: e.target.value }))}
                        className="oc-input h-11 rounded-xl bg-white text-sm flex-1"
                      >
                        <option value="">Не указан</option>
                        {deliverySupplyTypes.map((t) => (
                          <option key={'delivery-edit-supply-type-' + t} value={t}>{t}</option>
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
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Сумма</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={deliveryEditModal.amount}
                      onChange={(e) => setDeliveryEditModal(prev => ({ ...prev, amount: e.target.value }))}
                      className="oc-input h-11 rounded-xl bg-white text-sm"
                    />
                  </label>
                </div>

                <div className="mt-4 space-y-2">
                  {deliveryEditModal.rows.map((row, index) => (
                    <div key={'delivery-edit-row-' + index} className="grid grid-cols-2 md:grid-cols-[1fr_120px_120px_44px] gap-2">
                      <Select
                        value={row.supplier_id}
                        onChange={(e) => setDeliveryEditModal(prev => ({
                          ...prev,
                          rows: prev.rows.map((item, itemIndex) => itemIndex === index ? { ...item, supplier_id: e.target.value } : item),
                        }))}
                        className="oc-input h-11 rounded-xl bg-white text-sm col-span-2 md:col-span-1"
                      >
                        <option value="">Поставщик</option>
                        {suppliers.map((supplier) => (
                          <option key={'delivery-edit-supplier-' + index + '-' + supplier.id} value={String(supplier.id)}>{supplier.name}</option>
                        ))}
                      </Select>
                      <QtyField
                       
                        min="0"
                        step="1"
                        value={row.boxes}
                        onChange={(e) => setDeliveryEditModal(prev => ({
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
                        onChange={(e) => setDeliveryEditModal(prev => ({
                          ...prev,
                          rows: prev.rows.map((item, itemIndex) => itemIndex === index ? { ...item, pallets: e.target.value } : item),
                        }))}
                        placeholder="Паллеты"
                        className="oc-input h-11 rounded-xl bg-white text-sm"
                      />
                      <button
                        type="button"
                        disabled={deliveryEditModal.rows.length === 1}
                        onClick={() => setDeliveryEditModal(prev => ({ ...prev, rows: prev.rows.filter((_, itemIndex) => itemIndex !== index) }))}
                        className={'h-11 rounded-xl border border-rose-200 bg-white text-rose-600 inline-flex items-center justify-center col-span-2 md:col-span-1 ' + (deliveryEditModal.rows.length === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-rose-50')}
                        title="Удалить поле"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryEditModal(prev => ({ ...prev, rows: [...prev.rows, { supplier_id: '', boxes: '', pallets: '' }] }))}
                    className="h-10 rounded-xl border border-orange-200 bg-orange-50 px-4 text-sm font-semibold text-orange-700 hover:bg-orange-100 inline-flex items-center justify-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    + Добавить поставщика к доставке
                  </button>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={closeDeliveryEditModal}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      onClick={handleUpdateDelivery}
                      className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
                    >
                      Сохранить
                    </button>
                  </div>
                </div>
              </div>
            </div>
  );
}
