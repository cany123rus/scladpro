// Вынесено из Dashboard.tsx автоматически (ленивая загрузка раздела). Данные приходят пропсами из Dashboard.
/* eslint-disable */
import { Select } from '../../components/ui/Select';
import { Plus, Trash2, Pencil, ChevronRight, ArrowLeft, Save, Camera } from 'lucide-react';
import { QtyField } from '../../components/ui/QtyField';

export function Tab_reception(props: any) {
  const { currentReception, fileInputRefReception, handleCreateReception, handleDeleteReception, handleFinishReception, handleOpenReception, handleReceptionPhoto, handleSaveReception, mskTodayYmd, receptionDate, receptionMetaMap, receptionMetaRefreshing, receptionPhotoUploading, receptionPhotos, receptionStep, receptionSupplierId, receptionsList, refreshVisibleReceptionMeta, sendCurrentReceptionToTelegram, sendingReception, setCurrentReception, setReceptionDate, setReceptionPhotos, setReceptionStep, setReceptionSupplierId, setSendingReception, showToast, suppliers } = props;
  return (
<div className="max-w-2xl mx-auto">
              <h1 className="text-2xl font-bold mb-6">Приемка товара</h1>

              {receptionStep === 'LIST' ? (
                <>
                  <div className="oc-card p-6 mb-6">
                    <h2 className="text-lg font-bold mb-4">Новая приемка</h2>
                    <div className="flex gap-2">
                      <Select
                        value={receptionSupplierId}
                        onChange={(e) => setReceptionSupplierId(e.target.value)}
                        className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                      >
                        <option value="">-- Выберите поставщика --</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </Select>
                      <button
                        onClick={handleCreateReception}
                        className="p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        <Plus className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-lg font-bold">История приемок</h2>
                      <button
                        onClick={refreshVisibleReceptionMeta}
                        disabled={receptionMetaRefreshing || receptionsList.length === 0}
                        className={`px-3 py-1.5 text-sm rounded-lg border ${receptionMetaRefreshing || receptionsList.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'}`}
                      >
                        {receptionMetaRefreshing ? 'Обновляем количество...' : 'Обновить количество'}
                      </button>
                    </div>
                    {receptionsList.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 bg-white rounded-xl border border-slate-100">
                        История пуста
                      </div>
                    ) : (
                      receptionsList.map(reception => (
                        <div
                          key={reception.id}
                          onClick={() => handleOpenReception(reception)}
                          className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
                        >
                          <div className="w-full sm:w-auto">
                            <div className="font-bold text-slate-900">{reception.supplier?.name || 'Неизвестный поставщик'}</div>
                            <div className="text-sm text-slate-500">
                              {new Date(reception.created_at).toLocaleString('ru-RU')} • {typeof (reception as any).items_quantity === 'number' ? `${(reception as any).items_quantity} шт.` : (typeof receptionMetaMap[String(reception.id)]?.quantity === 'number' ? `${receptionMetaMap[String(reception.id)]?.quantity} шт.` : '- шт.')}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                            <span className={`text-xs px-2 py-1 rounded font-medium ${reception.status === 'closed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {reception.status === 'closed' ? 'Закрыта' : 'Активна'}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteReception(reception.id);
                              }}
                              className="p-1 text-slate-400 hover:text-red-600 rounded"
                              title="Удалить"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenReception(reception);
                              }}
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                              title="Редактировать"
                            >
                              <Pencil className="h-5 w-5" />
                            </button>
                            <ChevronRight className="h-5 w-5 text-slate-400" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <div className="flex items-center">
                      <button onClick={() => { setReceptionStep('LIST'); setCurrentReception(null); setReceptionDate(mskTodayYmd()); }} className="mr-4 text-slate-400 hover:text-slate-600"><ArrowLeft className="h-6 w-6" /></button>
                      <div>
                        <h2 className="text-xl font-bold">Приемка товара</h2>
                        <p className="text-sm text-slate-500 mb-2">
                          {currentReception?.supplier?.name} • {new Date(currentReception?.created_at).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-slate-500">Дата приемки</label>
                          <input
                            type="date"
                            value={receptionDate}
                            onChange={(e) => setReceptionDate(e.target.value)}
                            className="px-2 py-1 text-sm border border-slate-200 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleSaveReception}
                      disabled={receptionPhotoUploading > 0}
                      className="self-start sm:self-auto px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center disabled:opacity-50"
                    >
                      <Save className="h-4 w-4 mr-2" /> Сохранить
                    </button>
                  </div>

                  <div className="oc-card p-6 mb-6">
                    <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                      <div>
                        <div className="text-sm text-slate-500">Итого товара</div>
                        <div className="text-2xl font-bold text-indigo-600">
                          {receptionPhotos.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0)} шт
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${currentReception?.status === 'closed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {currentReception?.status === 'closed' ? 'Закрыта' : 'В работе'}
                      </div>
                    </div>

                    <div className="space-y-4 mb-6">
                      {receptionPhotos.map((photo, idx) => (
                        <div key={photo.id} className="flex gap-4 items-start border border-slate-100 p-4 rounded-lg">
                          <img src={photo.url} alt="Preview" className="w-24 h-24 object-cover rounded-lg bg-slate-100" />
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Кол-во товара</label>
                            <QtyField
                             
                              value={photo.quantity}
                              onChange={(e) => {
                                const newPhotos = [...receptionPhotos];
                                newPhotos[idx].quantity = e.target.value;
                                setReceptionPhotos(newPhotos);
                              }}
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                              placeholder="0"
                            />
                            <button
                              onClick={() => setReceptionPhotos(prev => prev.filter((_, i) => i !== idx))}
                              className="mt-2 text-red-500 text-sm flex items-center hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-1" /> Удалить
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3">
                        <button
                          onClick={() => fileInputRefReception.current?.click()}
                          className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium flex items-center justify-center"
                        >
                          <Camera className="h-5 w-5 mr-2" /> {receptionPhotoUploading > 0 ? `Загружаю фото (${receptionPhotoUploading})…` : 'Добавить фото'}
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              setSendingReception(true);
                              await sendCurrentReceptionToTelegram();
                              showToast('Отправлено в Telegram', 'success');
                            } catch (e: any) {
                              showToast('Ошибка отправки: ' + (e?.message || 'неизвестно'), 'error');
                            } finally {
                              setSendingReception(false);
                            }
                          }}
                          disabled={sendingReception || receptionPhotoUploading > 0}
                          className="flex-1 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium flex items-center justify-center disabled:opacity-50"
                        >
                          {sendingReception ? 'Отправка...' : 'Отправить в ТГ'}
                        </button>
                        <button
                          onClick={handleFinishReception}
                          disabled={sendingReception || receptionPhotoUploading > 0}
                          className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center justify-center disabled:opacity-50"
                        >
                          {sendingReception ? 'Отправка...' : 'Закончить приемку'}
                        </button>
                      </div>
                    <input
                      type="file"
                      ref={fileInputRefReception}
                      onChange={handleReceptionPhoto}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                  </div>
                </>
              )}
            </div>
  );
}
