// Вынесено из Dashboard.tsx автоматически (ленивая загрузка раздела). Данные приходят пропсами из Dashboard.
/* eslint-disable */
import { Select } from '../../components/ui/Select';

export function Block_29178(props: any) {
  const { closeUploadedCostEditor, getUploadedCostValue, getUploadedPhoto, saveUploadedCostsFromEditor, setUploadedCostByKey, setUploadedCostEditorFilter, setUploadedCostEditorLockedKeys, setUploadedCostEditorSearch, setUploadedCostEditorValues, setUploadedPersistedCostByCode, uploadedCostEditorFilter, uploadedCostEditorItems, uploadedCostEditorSearch, uploadedCostEditorValues, uploadedReportAnalytics, uploadedSavingCosts } = props;
  return (
<div className="fixed inset-0 z-[135] bg-slate-900/55 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { void closeUploadedCostEditor(); }}>
              <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3">
                  <div className="font-semibold text-slate-900">Редактор себестоимости <span className="text-xs font-normal text-slate-400">(закрытие = сохранение)</span></div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <input
                      type="text"
                      value={uploadedCostEditorSearch}
                      onChange={(e) => setUploadedCostEditorSearch(e.target.value)}
                      placeholder="Поиск по коду/названию"
                      className="w-64 px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                    <Select
                      value={uploadedCostEditorFilter}
                      onChange={(e) => {
                        const nextFilter = e.target.value as any;
                        setUploadedCostEditorFilter(nextFilter);
                        if (nextFilter === 'without_price') {
                          const locked = (uploadedReportAnalytics || [])
                            .filter((r: any) => getUploadedCostValue(r) <= 0)
                            .map((r: any) => `${String(r?.code || '').trim()}|${String(r?.name || '').trim()}`);
                          setUploadedCostEditorLockedKeys(locked);
                        } else {
                          setUploadedCostEditorLockedKeys(null);
                        }
                      }}
                      className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    >
                      <option value="all">Все товары</option>
                      <option value="with_price">С ценой</option>
                      <option value="without_price">Без цены</option>
                    </Select>
                    <button type="button" onClick={saveUploadedCostsFromEditor} disabled={uploadedSavingCosts} className="px-3 py-2 text-sm rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 disabled:opacity-60">
                      {uploadedSavingCosts ? 'Сохраняю...' : 'Сохранить'}
                    </button>
                    <button type="button" onClick={() => { void closeUploadedCostEditor(); }} className="px-3 py-2 text-sm rounded-lg border border-slate-300 hover:bg-slate-50">Закрыть</button>
                  </div>
                </div>
                <div className="p-4 overflow-auto max-h-[78vh]">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {uploadedCostEditorItems.map((r: any) => {
                      const code = String(r?.code || '').trim();
                      const editorKey = `${code}|${String(r?.name || '').trim()}`;
                      return (
                        <div key={code} className="border border-slate-200 rounded-xl p-3 bg-white">
                          <div className="flex gap-3">
                            {getUploadedPhoto(code) ? (
                              <img src={getUploadedPhoto(code)} alt={r?.name || code} className="w-20 h-24 object-contain rounded border border-slate-200 bg-white p-1" />
                            ) : (
                              <div className="w-20 h-24 rounded border border-slate-200 bg-slate-100 text-slate-400 text-xs flex items-center justify-center">N/A</div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-xs text-slate-500">{code}</div>
                              {r?.vendor_code ? <div className="text-[11px] text-slate-400" title="Артикул поставщика">{r.vendor_code}</div> : null}
                              <div className="text-sm text-slate-900 leading-5 break-words">{r?.name || '-'}</div>
                              <div className="mt-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={uploadedCostEditorValues[editorKey] ?? ''}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    const num = Number(String(value || '').replace(',', '.'));
                                    const bareCode = String(editorKey).split('|')[0].trim();
                                    setUploadedCostEditorValues((prev) => ({ ...prev, [editorKey]: value }));
                                    setUploadedCostByKey((prev) => ({ ...prev, [editorKey]: value, ...(bareCode ? { [bareCode]: value } : {}) }));
                                    if (Number.isFinite(num) && num >= 0) {
                                      setUploadedPersistedCostByCode((prev) => ({ ...prev, [editorKey]: num, ...(bareCode ? { [bareCode]: num } : {}) }));
                                    }
                                  }}
                                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                                  placeholder="Себестоимость"
                                />
                              </div>
                            </div>
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
