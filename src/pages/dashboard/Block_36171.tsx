// Вынесено из Dashboard.tsx автоматически (ленивая загрузка раздела). Данные приходят пропсами из Dashboard.
/* eslint-disable */
import { X, Trash2, Plus } from 'lucide-react';
import { Select } from '../../components/ui/Select';
import { QtyField } from '../../components/ui/QtyField';

export function Block_36171(props: any) {
  const { handleAddTempWorkerLog, hasAssemblyButtonAccess, makeTempLine, setShowTempWorkerModal, setTempWorkerForm, setTempWorkerLines, suppliers, tempLineEarnings, tempWorkerCommentTemplates, tempWorkerForm, tempWorkerLines, tempWorkersList } = props;
  return (
<div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm backdrop-blur-sm flex items-center justify-center z-[60] p-3 transition-opacity" onClick={() => setShowTempWorkerModal(false)}>
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-3xl max-h-[92vh] overflow-y-auto transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-900">Добавить смену</h2>
                    <button onClick={() => setShowTempWorkerModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleAddTempWorkerLog} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Дата работы</label>
                        <input
                            type="date"
                            value={tempWorkerForm.date}
                            onChange={e => setTempWorkerForm({...tempWorkerForm, date: e.target.value})}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            required
                        />
                    </div>
                    <div className="space-y-3">
                      {tempWorkerLines.map((line, idx) => {
                        const upd = (patch: any) => setTempWorkerLines((prev) => prev.map((x, i) => i === idx ? { ...x, ...patch } : x));
                        const earn = tempLineEarnings(line);
                        return (
                          <div key={`tw-line-${idx}`} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-slate-500">Позиция {idx + 1}</span>
                              <div className="flex items-center gap-3">
                                <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 cursor-pointer">
                                  <input type="checkbox" checked={line.isTime} onChange={e => upd({ isTime: e.target.checked })} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                  Время (почасовая)
                                </label>
                                {tempWorkerLines.length > 1 && (
                                  <button type="button" onClick={() => setTempWorkerLines((prev) => prev.filter((_, i) => i !== idx))} className="text-rose-500 hover:bg-rose-50 rounded-lg p-1"><Trash2 className="h-4 w-4" /></button>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <Select value={line.supplier_id} onChange={e => upd({ supplier_id: e.target.value })} className="p-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="">Поставщик…</option>
                                {suppliers.map((s) => <option key={`twl-s-${idx}-${s.id}`} value={s.id}>{s.name}</option>)}
                              </Select>
                              <Select value={line.worker_name} onChange={e => upd({ worker_name: e.target.value })} className="p-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="">Сотрудник…</option>
                                {tempWorkersList.map((n) => <option key={`twl-n-${idx}-${n}`} value={n}>{n}</option>)}
                              </Select>
                              <Select value={line.work_comment} onChange={e => upd({ work_comment: e.target.value })} className="p-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="">Тип работы…</option>
                                {tempWorkerCommentTemplates.map((t, i) => <option key={`twl-tpl-${idx}-${i}`} value={t}>{t}</option>)}
                              </Select>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-2 items-end">
                              {line.isTime ? (
                                <>
                                  <div><label className="block text-[11px] text-slate-500 mb-1">Часы</label><input type="number" step="0.5" min="0" value={line.hours} onChange={e => upd({ hours: e.target.value })} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0" /></div>
                                  <div><label className="block text-[11px] text-slate-500 mb-1">Цена за час ₽</label><input type="number" min="0" value={line.price} onChange={e => upd({ price: e.target.value })} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0" /></div>
                                </>
                              ) : (
                                <>
                                  <div><label className="block text-[11px] text-slate-500 mb-1">Количество</label><QtyField min="0" value={line.quantity} onChange={e => upd({ quantity: e.target.value })} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0" /></div>
                                  <div><label className="block text-[11px] text-slate-500 mb-1">Цена сборки ₽</label><input type="number" min="0" value={line.price} onChange={e => upd({ price: e.target.value })} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0" /></div>
                                </>
                              )}
                              <div><label className="block text-[11px] text-slate-500 mb-1">Заработок</label><div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-sm text-center">{earn.toLocaleString('ru-RU')} ₽</div></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button type="button" onClick={() => setTempWorkerLines((prev) => [...prev, makeTempLine()])} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-sm font-medium">
                      <Plus className="h-4 w-4" /> Добавить
                    </button>

                    <div className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-white">
                      <span className="text-sm text-slate-300">Итого заработок ({tempWorkerLines.length} поз.)</span>
                      <span className="text-lg font-extrabold">{tempWorkerLines.reduce((s, l) => s + tempLineEarnings(l), 0).toLocaleString('ru-RU')} ₽</span>
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                        <button type="button" onClick={() => setShowTempWorkerModal(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">Отмена</button>
                        <button type="submit" disabled={!hasAssemblyButtonAccess('temp_shift_add')} className={`px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium shadow-lg shadow-indigo-200 transition-all ${!hasAssemblyButtonAccess('temp_shift_add') ? 'opacity-50 cursor-not-allowed' : ''}`}>Добавить</button>
                    </div>
                </form>
              </div>
            </div>
  );
}
