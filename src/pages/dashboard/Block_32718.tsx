// Вынесено из Dashboard.tsx автоматически (ленивая загрузка раздела). Данные приходят пропсами из Dashboard.
/* eslint-disable */
import { X } from 'lucide-react';
import { QtyField } from '../../components/ui/QtyField';
import { Select } from '../../components/ui/Select';

export function Block_32718(props: any) {
  const { editBoxLogModal, hasAssemblyButtonAccess, setEditBoxLogModal, submitEditBoxLog, suppliers } = props;
  return (
<div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm backdrop-blur-sm flex items-center justify-center z-[60]" onClick={() => setEditBoxLogModal(prev => ({ ...prev, isOpen: false }))}>
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-slate-900">Редактировать запись коробок</h3>
                  <button onClick={() => setEditBoxLogModal(prev => ({ ...prev, isOpen: false }))} className="text-slate-400 hover:text-slate-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Дата</label>
                    <input
                      type="date"
                      value={editBoxLogModal.date}
                      onChange={e => setEditBoxLogModal(prev => ({ ...prev, date: e.target.value }))}
                      className="oc-select"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Количество коробок</label>
                    <QtyField
                     
                      min="1"
                      value={editBoxLogModal.quantity}
                      onChange={e => setEditBoxLogModal(prev => ({ ...prev, quantity: e.target.value }))}
                      className="oc-select"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Количество товара</label>
                    <QtyField
                     
                      min="0"
                      value={editBoxLogModal.items_quantity}
                      onChange={e => setEditBoxLogModal(prev => ({ ...prev, items_quantity: e.target.value }))}
                      className="oc-select"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Стоимость доставки (₽)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editBoxLogModal.delivery_price}
                      onChange={e => setEditBoxLogModal(prev => ({ ...prev, delivery_price: e.target.value }))}
                      className="oc-select"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Цена за коробку (₽)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editBoxLogModal.price_per_box}
                      onChange={e => setEditBoxLogModal(prev => ({ ...prev, price_per_box: e.target.value }))}
                      className="oc-select"
                      disabled={editBoxLogModal.type === 'FBS'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Поставщик</label>
                    <Select
                      value={editBoxLogModal.supplier_id}
                      onChange={e => setEditBoxLogModal(prev => ({ ...prev, supplier_id: e.target.value }))}
                      className="oc-select"
                    >
                      <option value="">Не выбран</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setEditBoxLogModal(prev => ({ ...prev, isOpen: false }))}
                    className="px-4 py-2 border rounded-lg hover:bg-slate-50"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={() => { if (!hasAssemblyButtonAccess('cw_box_log_edit_submit')) return; submitEditBoxLog(); }}
                    disabled={!hasAssemblyButtonAccess('cw_box_log_edit_submit')}
                    className={`px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 ${!hasAssemblyButtonAccess('cw_box_log_edit_submit') ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Сохранить
                  </button>
                </div>
              </div>
            </div>
  );
}
