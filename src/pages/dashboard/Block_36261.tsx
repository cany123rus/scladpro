// Вынесено из Dashboard.tsx автоматически (ленивая загрузка раздела). Данные приходят пропсами из Dashboard.
/* eslint-disable */
import { X } from 'lucide-react';
import { Select } from '../../components/ui/Select';
import { QtyField } from '../../components/ui/QtyField';

export function Block_36261(props: any) {
  const { handleUpdateTempWorkerLog, hasAssemblyButtonAccess, setShowTempWorkerEditModal, setTempWorkerEditForm, suppliers, tempEditEarnings, tempWorkerCommentTemplates, tempWorkerEditForm, tempWorkersList } = props;
  return (
<div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm backdrop-blur-sm flex items-center justify-center z-[70] transition-opacity" onClick={() => setShowTempWorkerEditModal(false)}>
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-900">Редактировать смену</h2>
                    <button onClick={() => setShowTempWorkerEditModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleUpdateTempWorkerLog} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Поставщик</label>
                        <Select
                          value={tempWorkerEditForm.supplier_id}
                          onChange={e => setTempWorkerEditForm({...tempWorkerEditForm, supplier_id: e.target.value})}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        >
                          <option value="">Выберите поставщика...</option>
                          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Дата работы</label>
                        <input
                          type="date"
                          value={tempWorkerEditForm.date}
                          onChange={e => setTempWorkerEditForm({...tempWorkerEditForm, date: e.target.value})}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Сотрудник</label>
                      <Select
                        value={tempWorkerEditForm.worker_name}
                        onChange={e => setTempWorkerEditForm({...tempWorkerEditForm, worker_name: e.target.value})}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      >
                        <option value="">Сотрудник…</option>
                        {tempWorkersList.map((n) => <option key={`twe-n-${n}`} value={n}>{n}</option>)}
                        {tempWorkerEditForm.worker_name && !tempWorkersList.includes(tempWorkerEditForm.worker_name) && (
                          <option value={tempWorkerEditForm.worker_name}>{tempWorkerEditForm.worker_name}</option>
                        )}
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Тип работы</label>
                      <Select
                        value={tempWorkerEditForm.work_comment}
                        onChange={e => setTempWorkerEditForm({...tempWorkerEditForm, work_comment: e.target.value})}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Выберите тип работы…</option>
                        {tempWorkerCommentTemplates.map((t, i) => (<option key={`twe-tpl-${i}`} value={t}>{t}</option>))}
                        {tempWorkerEditForm.work_comment && !tempWorkerCommentTemplates.includes(tempWorkerEditForm.work_comment) && (
                          <option value={tempWorkerEditForm.work_comment}>{tempWorkerEditForm.work_comment}</option>
                        )}
                      </Select>
                    </div>
                    <div>
                      <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer">
                        <input type="checkbox" checked={tempWorkerEditForm.isTime} onChange={e => setTempWorkerEditForm({...tempWorkerEditForm, isTime: e.target.checked})} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                        Время (почасовая)
                      </label>
                    </div>
                    <div className="grid grid-cols-3 gap-3 items-end">
                      {tempWorkerEditForm.isTime ? (
                        <>
                          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Часы</label><input type="number" step="0.5" min="0" value={tempWorkerEditForm.hours} onChange={e => setTempWorkerEditForm({...tempWorkerEditForm, hours: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0" /></div>
                          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Цена за час ₽</label><input type="number" min="0" value={tempWorkerEditForm.price} onChange={e => setTempWorkerEditForm({...tempWorkerEditForm, price: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0" /></div>
                        </>
                      ) : (
                        <>
                          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Количество</label><QtyField min="0" value={tempWorkerEditForm.quantity} onChange={e => setTempWorkerEditForm({...tempWorkerEditForm, quantity: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0" /></div>
                          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Цена сборки ₽</label><input type="number" min="0" value={tempWorkerEditForm.price} onChange={e => setTempWorkerEditForm({...tempWorkerEditForm, price: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0" /></div>
                        </>
                      )}
                      <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Заработок</label><div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-center">{tempEditEarnings(tempWorkerEditForm).toLocaleString('ru-RU')} ₽</div></div>
                    </div>
                    <div className="flex justify-end gap-3 mt-8">
                      <button type="button" onClick={() => setShowTempWorkerEditModal(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">Отмена</button>
                      <button type="submit" disabled={!hasAssemblyButtonAccess('temp_shift_edit')} className={`px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium shadow-lg shadow-indigo-200 transition-all ${!hasAssemblyButtonAccess('temp_shift_edit') ? 'opacity-50 cursor-not-allowed' : ''}`}>Сохранить</button>
                    </div>
                </form>
              </div>
            </div>
  );
}
