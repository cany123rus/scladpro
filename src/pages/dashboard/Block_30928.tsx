// Вынесено из Dashboard.tsx автоматически (ленивая загрузка раздела). Данные приходят пропсами из Dashboard.
/* eslint-disable */
import { X, ChevronRight, Trash2 } from 'lucide-react';

export function Block_30928(props: any) {
  const { fetchBoxesList, fetchSupplyStats, handleDeleteReception, handleOpenReception, historyReceptions, historySupplier, historySupplies, historyType, receptionMetaMap, setCurrentSupply, setShowSupplierHistory, setSupplyStep, switchTab } = props;
  return (
<div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowSupplierHistory(false)}>
              <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">История {historyType === 'supplies' ? 'поставок' : 'приемок'}</h2>
                    <p className="text-slate-500">{historySupplier.name}</p>
                  </div>
                  <button onClick={() => setShowSupplierHistory(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                    <X className="h-6 w-6 text-slate-500" />
                  </button>
                </div>

                <div className="space-y-3">
                  {historyType === 'supplies' ? (
                    historySupplies.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">Нет поставок</div>
                    ) : (
                      historySupplies.map(supply => (
                        <div
                          key={supply.id}
                          onClick={() => {
                            setCurrentSupply(supply);
                            fetchBoxesList(supply.id);
                            fetchSupplyStats(supply.id);
                            setSupplyStep('SUPPLY');
                            switchTab('supplies');
                            setShowSupplierHistory(false);
                          }}
                          className={`bg-white p-4 rounded-xl border flex justify-between items-center cursor-pointer hover:shadow-md transition-shadow ${supply.status === 'closed' ? 'border-green-200 bg-green-50' : 'border-slate-100'}`}
                        >
                          <div>
                            <div className="font-bold text-slate-900">{supply.name}</div>
                            <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                              <span className="bg-white px-2 py-0.5 rounded text-xs font-medium text-slate-600 border border-slate-200">
                                {supply.total_items || 0} шт.
                              </span>
                              {supply.status === 'closed' ? (
                                <span className="text-green-600 font-medium">Отгружена {new Date(supply.updated_at || supply.created_at).toLocaleDateString()}</span>
                              ) : (
                                <span>{new Date(supply.created_at).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-slate-400" />
                        </div>
                      ))
                    )
                  ) : (
                    historyReceptions.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">Нет приемок</div>
                    ) : (
                      historyReceptions.map(reception => (
                        <div
                          key={reception.id}
                          onClick={() => {
                            handleOpenReception(reception);
                            switchTab('reception');
                            setShowSupplierHistory(false);
                          }}
                          className={`bg-white p-4 rounded-xl border flex justify-between items-center cursor-pointer hover:shadow-md transition-shadow ${reception.status === 'closed' ? 'border-green-200 bg-green-50' : 'border-slate-100'}`}
                        >
                          <div>
                            <div className="font-bold text-slate-900">Приемка от {new Date(reception.created_at).toLocaleDateString()}</div>
                            <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                              <span className="bg-white px-2 py-0.5 rounded text-xs font-medium text-slate-600 border border-slate-200">
                                {receptionMetaMap[String(reception.id)]?.count ?? reception.photos?.length ?? 0} фото
                              </span>
                              {reception.status === 'closed' ? (
                                <span className="text-green-600 font-medium">Завершена {new Date(reception.updated_at || reception.created_at).toLocaleDateString()}</span>
                              ) : (
                                <span className="text-blue-600 font-medium">Активна</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteReception(reception.id);
                                }}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Удалить приемку"
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>
                            <ChevronRight className="h-5 w-5 text-slate-400" />
                          </div>
                        </div>
                      ))
                    )
                  )}
                </div>
              </div>
            </div>
  );
}
