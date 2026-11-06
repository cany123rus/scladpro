// Вынесено из Dashboard.tsx автоматически (ленивая загрузка раздела). Данные приходят пропсами из Dashboard.
/* eslint-disable */
import { X, Trash2, Pencil } from 'lucide-react';
import { Select } from '../../components/ui/Select';
import { QtyField } from '../../components/ui/QtyField';
import { supabase } from '../../lib/supabase';

export function Block_33025(props: any) {
  const { fetchPalletHistory, palletEditingId, palletHistory, palletRows, palletTotalAmount, setPalletEditingId, setPalletRows, setPalletTotalAmount, setShowPalletModal, showToast, suppliers } = props;
  return (
<div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm backdrop-blur-sm flex items-center justify-center z-50 transition-opacity p-2 md:p-4" onClick={() => setShowPalletModal(false)}>
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900">Паллетирование</h3>
                  <button onClick={() => setShowPalletModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <X className="h-5 w-5 text-slate-500" />
                  </button>
                </div>

                <div className="p-4 md:p-6 space-y-3">
                  {palletRows.map((row, idx) => {
                    const totalPallets = palletRows.reduce((sum, r) => sum + Number(r.pallets || 0), 0);
                    const totalAmount = Number(palletTotalAmount || 0);
                    const rowPallets = Number(row.pallets || 0);
                    const rowAmount = totalPallets > 0 ? (totalAmount / totalPallets) * rowPallets : 0;
                    return (
                      <div key={`pallet-row-${idx}`} className="grid grid-cols-1 md:grid-cols-[1fr_150px_170px_40px] gap-2 items-center">
                        <Select
                          value={row.supplier_id}
                          onChange={(e) => setPalletRows(prev => prev.map((r, i) => i === idx ? { ...r, supplier_id: e.target.value } : r))}
                          className="oc-select"
                        >
                          <option value="">Выберите поставщика</option>
                          {suppliers.map(s => <option key={`pallet-s-${s.id}`} value={s.id}>{s.name}</option>)}
                        </Select>
                        <QtyField
                         
                          placeholder="Паллет"
                          value={row.pallets}
                          onChange={(e) => setPalletRows(prev => prev.map((r, i) => i === idx ? { ...r, pallets: e.target.value } : r))}
                          className="oc-select"
                        />
                        <div className="text-sm font-semibold text-violet-700 px-2">{rowAmount.toFixed(2)} ₽</div>
                        <button
                          onClick={() => setPalletRows(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-100"
                          title="Удалить"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}

                  <div className="flex gap-2">
                    <button
                      onClick={() => setPalletRows(prev => [...prev, { supplier_id: '', pallets: '' }])}
                      className="px-3 py-2 text-sm rounded-lg border border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                    >
                      + Добавить поставщика
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-2 items-center pt-2 border-t">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Сумма за работу"
                      value={palletTotalAmount}
                      onChange={(e) => setPalletTotalAmount(e.target.value)}
                      className="oc-select"
                    />
                    <div className="text-sm text-slate-600">
                      Всего паллет: <b>{palletRows.reduce((sum, r) => sum + Number(r.pallets || 0), 0)}</b>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={async () => {
                        const totalAmount = Number(palletTotalAmount || 0);
                        const normalized = palletRows
                          .map(r => ({ ...r, palletsNum: Number(r.pallets || 0) }))
                          .filter(r => r.supplier_id && r.palletsNum > 0);
                        const totalPallets = normalized.reduce((sum, r) => sum + r.palletsNum, 0);
                        if (!normalized.length || totalPallets <= 0 || totalAmount <= 0) {
                          showToast('Заполните поставщиков, паллеты и сумму', 'error');
                          return;
                        }
                        const items = normalized.map(r => {
                          const supplier = suppliers.find(s => String(s.id) === String(r.supplier_id));
                          const amount = Number(((totalAmount / totalPallets) * r.palletsNum).toFixed(2));
                          return {
                            supplier_id: r.supplier_id,
                            supplier_name: supplier?.name || 'Поставщик',
                            pallets: r.palletsNum,
                            amount,
                          };
                        });

                        if (palletEditingId) {
                          const { error } = await supabase
                            .from('palleting_log')
                            .update({ total_amount: Number(totalAmount.toFixed(2)), total_pallets: totalPallets, items })
                            .eq('id', palletEditingId);
                          if (error) {
                            showToast('Ошибка обновления паллетирования: ' + (error.message || 'неизвестно'), 'error');
                            return;
                          }
                        } else {
                          const { error } = await supabase
                            .from('palleting_log')
                            .insert([{ total_amount: Number(totalAmount.toFixed(2)), total_pallets: totalPallets, items }]);
                          if (error) {
                            showToast('Ошибка добавления паллетирования: ' + (error.message || 'неизвестно'), 'error');
                            return;
                          }
                        }

                        setPalletRows([{ supplier_id: '', pallets: '' }]);
                        setPalletTotalAmount('');
                        setPalletEditingId(null);
                        await fetchPalletHistory();
                        showToast(palletEditingId ? 'Паллетирование обновлено' : 'Паллетирование добавлено', 'success');
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      {palletEditingId ? 'Сохранить изменения' : 'Сохранить'}
                    </button>
                  </div>

                  <div className="mt-3 border rounded-lg p-3 bg-violet-50/60">
                    <div className="font-semibold text-violet-900 mb-2">История паллетирования</div>
                    {palletHistory.length === 0 ? (
                      <div className="text-sm text-slate-500">Пока нет записей.</div>
                    ) : (
                      <div className="space-y-2 max-h-56 overflow-y-auto">
                        {palletHistory.slice(0, 20).map((h) => (
                          <div key={h.id} className="bg-white border rounded-lg p-2">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="text-xs text-slate-500">{new Date(h.created_at).toLocaleString('ru-RU')} • {h.total_pallets} паллет • {Number(h.total_amount).toFixed(2)} ₽</div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setPalletEditingId(h.id);
                                    setPalletTotalAmount(String(h.total_amount));
                                    setPalletRows(h.items.map(it => ({ supplier_id: it.supplier_id, pallets: String(it.pallets) })));
                                  }}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Редактировать"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={async () => {
                                    const { error } = await supabase.from('palleting_log').update({ deleted_at: new Date().toISOString() }).eq('id', h.id);
                                    if (error) {
                                      showToast('Ошибка удаления: ' + (error.message || 'неизвестно'), 'error');
                                      return;
                                    }
                                    await fetchPalletHistory();
                                  }}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                  title="Удалить"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            <div className="space-y-1">
                              {h.items.map((it, idx) => (
                                <div key={`${h.id}-${idx}`} className="text-sm flex justify-between">
                                  <span>{it.supplier_name} - {it.pallets} пал.</span>
                                  <span className="font-semibold text-violet-700">{Number(it.amount).toFixed(2)} ₽</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
  );
}
