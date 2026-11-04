// Вынесено из Dashboard.tsx автоматически (ленивая загрузка раздела). Данные приходят пропсами из Dashboard.
/* eslint-disable */
import { X } from 'lucide-react';

export function Block_35164(props: any) {
  const { deliveryPersonNewName, deliveryPersons, saveDeliveryPersons, setDeliveryForm, setDeliveryPersonNewName, setShowDeliveryPersonModal, showToast } = props;
  return (
<div className="fixed inset-0 z-[92] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowDeliveryPersonModal(false)}>
              <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-950">Добавить доставщика</h3>
                    <div className="mt-1 text-sm text-slate-500">Новый доставщик сразу появится в выборе для доставки.</div>
                  </div>
                  <button onClick={() => setShowDeliveryPersonModal(false)} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Закрыть добавление доставщика">
                    <X className="h-5 w-5 text-slate-500" />
                  </button>
                </div>

                <form
                  className="mt-4 space-y-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const name = String(deliveryPersonNewName || '').trim();
                    if (!name) return;
                    await saveDeliveryPersons([...(deliveryPersons || []), name]);
                    setDeliveryForm(prev => ({ ...prev, courier: name }));
                    setDeliveryPersonNewName('');
                    setShowDeliveryPersonModal(false);
                    showToast('Доставщик добавлен', 'success');
                  }}
                >
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Имя доставщика</span>
                    <input
                      value={deliveryPersonNewName}
                      onChange={(e) => setDeliveryPersonNewName(e.target.value)}
                      autoFocus
                      placeholder="Например: Иван"
                      className="oc-input h-11 rounded-xl bg-white text-sm"
                    />
                  </label>

                  {deliveryPersons.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Сохраненные доставщики</div>
                      <div className="flex flex-wrap gap-2">
                        {deliveryPersons.map((name) => (
                          <button
                            key={'delivery-person-chip-' + name}
                            type="button"
                            onClick={() => setDeliveryPersonNewName(name)}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowDeliveryPersonModal(false)}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
                    >
                      Сохранить
                    </button>
                  </div>
                </form>
              </div>
            </div>
  );
}
