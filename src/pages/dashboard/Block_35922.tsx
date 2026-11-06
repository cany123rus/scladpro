// Вынесено из Dashboard.tsx автоматически (ленивая загрузка раздела). Данные приходят пропсами из Dashboard.
/* eslint-disable */
import { Select } from '../../components/ui/Select';
import { supabase } from '../../lib/supabase';

export function Block_35922(props: any) {
  const { getTempWorkerPaidAmount, getTempWorkerRemainingAmount, savePaymentReport, setTempWorkerLogs, setTempWorkerPaymentModal, setTempWorkerPaymentsMap, showToast, suppliers, tempWorkerLogs, tempWorkerPaymentModal, tempWorkerPaymentsMap } = props;
  return (
<div className="fixed inset-0 z-[80] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setTempWorkerPaymentModal({ open: false, logId: '', mode: 'pay', supplierId: '', amount: '', error: '' })}>
              <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between gap-3 mb-4"><div className="text-lg font-bold">{tempWorkerPaymentModal.mode === 'extra' ? 'Доплата' : tempWorkerPaymentModal.mode === 'edit' ? 'Редактировать оплату' : 'Оплата записи'}</div><button onClick={() => setTempWorkerPaymentModal({ open: false, logId: '', mode: 'pay', supplierId: '', amount: '', error: '' })} className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50">Закрыть</button></div>
                <div className="space-y-3">
                  {(() => {
                    const log = (tempWorkerLogs || []).find((x: any) => String(x.id) === String(tempWorkerPaymentModal.logId));
                    const earnings = Number(log?.earnings || 0);
                    const paid = getTempWorkerPaidAmount(log);
                    const remaining = getTempWorkerRemainingAmount(log);
                    return (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm space-y-1">
                        <div>Заработок: <b>{earnings.toFixed(2)} ₽</b></div>
                        {paid > 0 && <div>Уже оплачено: <b>{paid.toFixed(2)} ₽</b></div>}
                        <div>Остаток: <b>{remaining.toFixed(2)} ₽</b></div>
                        <div>Оплачено сейчас: <b>{paid.toFixed(2)} ₽</b></div>
                      </div>
                    );
                  })()}
                  {!!tempWorkerPaymentModal.error && <div className="rounded-lg border border-rose-200 bg-rose-50 text-rose-700 px-3 py-2 text-sm">{tempWorkerPaymentModal.error}</div>}
                  <Select value={tempWorkerPaymentModal.supplierId} onChange={(e) => setTempWorkerPaymentModal(prev => ({ ...prev, supplierId: e.target.value, error: '' }))} className="oc-input">
                    <option value="">Выберите поставщика</option>
                    {suppliers.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                  </Select>
                  <input value={tempWorkerPaymentModal.amount} onChange={(e) => setTempWorkerPaymentModal(prev => ({ ...prev, amount: e.target.value, error: '' }))} type="number" step="0.01" placeholder="Сумма оплаты" className="oc-input" />
                  <button
                    onClick={async () => {
                      const log = (tempWorkerLogs || []).find((x: any) => String(x.id) === String(tempWorkerPaymentModal.logId));
                      const amount = Number(tempWorkerPaymentModal.amount || 0);
                      const alreadyPaid = getTempWorkerPaidAmount(log);
                      const currentStored = ((tempWorkerPaymentsMap[String(log?.id)] || [])[0]?.amount) ? Number((tempWorkerPaymentsMap[String(log?.id)] || [])[0].amount) : 0;
                      const paidExcludingCurrent = tempWorkerPaymentModal.mode === 'edit' ? Math.max(0, alreadyPaid - currentStored) : alreadyPaid;
                      const remaining = Math.max(0, Number(log?.earnings || 0) - paidExcludingCurrent);
                      if (!log || !tempWorkerPaymentModal.supplierId || !Number.isFinite(amount) || amount <= 0 || amount > remaining) {
                        setTempWorkerPaymentModal(prev => ({ ...prev, error: `Введите корректную сумму (доступно ${remaining.toFixed(2)} ₽)` }));
                        return;
                      }
                      const nextMap = { ...(tempWorkerPaymentsMap || {}) } as Record<string, any[]>;
                      const key = String(log.id);
                      if (tempWorkerPaymentModal.mode === 'edit') {
                        nextMap[key] = [{ amount, supplier_id: String(tempWorkerPaymentModal.supplierId), created_at: new Date().toISOString() }];
                      } else {
                        const prev = Array.isArray(nextMap[key]) ? nextMap[key] : [];
                        nextMap[key] = [...prev, { amount, supplier_id: String(tempWorkerPaymentModal.supplierId), created_at: new Date().toISOString() }];
                      }
                      setTempWorkerPaymentsMap(nextMap);
                      await supabase.from('app_settings').upsert([{ key: 'temp_worker_payments_v1', value: JSON.stringify(nextMap) }], { onConflict: 'key' });
                      const totalPaid = nextMap[key].reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
                      const nextPaid = totalPaid >= Number(log.earnings || 0);
                      setTempWorkerLogs(prevLogs => prevLogs.map((x: any) => String(x.id) === key ? { ...x, is_paid: nextPaid, paid_by_supplier_id: String(tempWorkerPaymentModal.supplierId) } : x));
                      // Отчёт об оплате (кроме режима «правка» — он не новая оплата, а корректировка).
                      if (tempWorkerPaymentModal.mode !== 'edit') {
                        const payer = suppliers.find((s: any) => String(s.id) === String(tempWorkerPaymentModal.supplierId));
                        const workerName = String(log.worker_name || log.worker || 'сотрудник');
                        await savePaymentReport({
                          kind: 'temp',
                          title: `Оплата временному: ${workerName}`,
                          amount,
                          payload: {
                            paid_by: payer?.name || '',
                            employee_name: workerName,
                            count: 1,
                            items: [{ worker: workerName, comment: String(log.work_comment || log.comment || ''), date: log.date || null, amount }],
                          },
                        });
                      }
                      setTempWorkerPaymentModal({ open: false, logId: '', mode: 'pay', supplierId: '', amount: '', error: '' });
                      showToast('Оплата сохранена', 'success');
                    }}
                    className="w-full btn-primary py-3"
                  >
                    Сохранить оплату
                  </button>
                </div>
              </div>
            </div>
  );
}
