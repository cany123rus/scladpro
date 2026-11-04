// Вынесено из Dashboard.tsx автоматически (ленивая загрузка раздела). Данные приходят пропсами из Dashboard.
/* eslint-disable */
import { X } from 'lucide-react';

export function Block_32929(props: any) {
  const { closeHsDelete, handleDeleteHsCodes, hsDelete, setHsDelete } = props;
  return (
<div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={closeHsDelete}>
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold text-slate-900">Удалить коды</h3>
                  <button onClick={closeHsDelete} disabled={hsDelete.busy} className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <p className="text-slate-600 mb-4 text-sm leading-relaxed">
                  {hsDelete.category
                    ? <>Категория: <b>{hsDelete.category}</b>.</>
                    : <>Все категории выбранного поставщика.</>}{' '}
                  Перед удалением на устройство скачается файл с копией — по нему коды можно загрузить обратно.
                </p>

                <div className="space-y-2 mb-4">
                  {([
                    { id: 'free', title: 'Только свободные', hint: 'Не напечатанные и не отсканированные — то, что лежит в базе и ещё не пошло в дело.', n: hsDelete.counts?.free },
                    { id: 'all', title: 'Все коды', hint: 'Включая напечатанные и отсканированные. Из истории печати и сканов они пропадут.', n: hsDelete.counts?.all },
                  ] as const).map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                        hsDelete.scope === opt.id ? 'border-red-300 bg-red-50' : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="hs-delete-scope"
                        checked={hsDelete.scope === opt.id}
                        disabled={hsDelete.busy}
                        onChange={() => setHsDelete((prev) => ({ ...prev, scope: opt.id, confirmText: '' }))}
                        className="mt-1"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-900">
                          {opt.title}
                          <span className="ml-2 tabular-nums text-slate-500">
                            {hsDelete.counting ? 'считаю…' : opt.n === undefined ? '' : `${opt.n} шт`}
                          </span>
                        </span>
                        <span className="block text-xs text-slate-500">{opt.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>

                {(() => {
                  const total = hsDelete.counts ? (hsDelete.scope === 'free' ? hsDelete.counts.free : hsDelete.counts.all) : 0;
                  const confirmed = hsDelete.confirmText.trim().toUpperCase() === 'УДАЛИТЬ';
                  return (
                    <>
                      {total > 0 && (
                        <div className="mb-4">
                          <label className="block text-sm text-slate-700 mb-1">
                            Будет удалено <b>{total}</b> кодов. Чтобы подтвердить, напишите <b>УДАЛИТЬ</b>:
                          </label>
                          <input
                            value={hsDelete.confirmText}
                            onChange={(e) => setHsDelete((prev) => ({ ...prev, confirmText: e.target.value }))}
                            disabled={hsDelete.busy}
                            autoComplete="off"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:ring-2 focus:ring-red-400"
                            placeholder="УДАЛИТЬ"
                          />
                        </div>
                      )}
                      {hsDelete.counts && total === 0 && (
                        <p className="mb-4 text-sm text-slate-500">По этому выбору кодов нет — удалять нечего.</p>
                      )}
                      {hsDelete.progress && <p className="mb-3 text-sm text-slate-600">{hsDelete.progress}</p>}
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={closeHsDelete}
                          disabled={hsDelete.busy}
                          className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors disabled:opacity-40"
                        >
                          Отмена
                        </button>
                        <button
                          onClick={handleDeleteHsCodes}
                          disabled={hsDelete.busy || hsDelete.counting || total <= 0 || !confirmed}
                          className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium shadow-lg shadow-red-200 transition-all disabled:opacity-40 disabled:shadow-none"
                        >
                          {hsDelete.busy ? 'Удаляю…' : 'Удалить'}
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
  );
}
