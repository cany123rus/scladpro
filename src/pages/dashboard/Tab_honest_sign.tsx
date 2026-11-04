// Вынесено из Dashboard.tsx автоматически (ленивая загрузка раздела). Данные приходят пропсами из Dashboard.
/* eslint-disable */
import { ShieldCheck, Download, Trash2, Printer, Link, RotateCcw, Upload, Send, CheckCircle2, Lock } from 'lucide-react';
import { Select } from '../../components/ui/Select';
import { hsCategoryKey } from '../../utils/chzCategoryUse';
import { ensureBwip, lazyLibs } from '../dashboardLazyLibs';
import { restoreDataMatrixGs } from '../../utils/honestSign';

export function Tab_honest_sign(props: any) {
  const { codesToPrint, fetchPrintFiles, getFileIcon, getHSGenderLabel, handleDeleteHonestSign, handleDeleteHonestSignHistory, handleDeletePrintFile, handleDownloadHonestSign, handleDownloadHonestSignHistory, handleDownloadHonestSignSupply, handlePrintFile, handlePrintFileUpload, handlePrintHonestSignHistory, handleToggleHsCategoryUse, honestSignCategoryStats, honestSignCodes, honestSignPrintedHistory, honestSignSupplierId, honestSignTab, honestSignUploadHistory, hsDisabledKeys, isPrintingCodes, loadingHonestSign, openHsDelete, printBotDiagnostics, printBotDiagnosticsOpen, printFileInputRef, printFiles, printSupplierId, runPrintBotDiagnostics, setHonestSignSupplierId, setHonestSignTab, setPrintBotDiagnosticsOpen, setPrintSupplierId, setShowHsFileLinker, setShowReturnCodesModal, suppliers } = props;
  return (
<div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <ShieldCheck className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900">ЧЗ / Печать</h1>
                </div>
                <p className="text-slate-500">Управление маркировкой и печать документов</p>
              </div>

              <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
                <button
                  onClick={() => setHonestSignTab('codes')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${honestSignTab === 'codes' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  База кодов
                </button>
                <button
                  onClick={() => setHonestSignTab('base')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${honestSignTab === 'base' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  База
                </button>
                <button
                  onClick={() => setHonestSignTab('printed')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${honestSignTab === 'printed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Напечатанные
                </button>
                <button
                  onClick={() => setHonestSignTab('print')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${honestSignTab === 'print' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Печать документов
                </button>
              </div>

              {honestSignTab === 'codes' && (
                <>
                  <div className="oc-card p-6 mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Выберите поставщика</label>
                    <Select
                      value={honestSignSupplierId}
                      onChange={(e) => setHonestSignSupplierId(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">-- Выберите поставщика --</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                  </div>

                  {!honestSignSupplierId ? (
                    <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-100 border-dashed">
                      <ShieldCheck className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                      <p>Выберите поставщика для просмотра базы</p>
                    </div>
                  ) : loadingHonestSign ? (
                    <div className="text-center py-12 text-slate-400">Загрузка...</div>
                  ) : honestSignCodes.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-100 border-dashed">
                      <ShieldCheck className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-1">База пуста</h3>
                      <p>Сканируйте товары в поставках, чтобы наполнить базу</p>
                    </div>
                  ) : (
                    <div className="oc-card overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <span className="font-medium text-slate-700">Отсканировано поставок: {honestSignCodes.length}</span>
                        <button
                          onClick={handleDownloadHonestSign}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center text-sm font-medium"
                        >
                          <Download className="h-4 w-4 mr-2" /> Скачать Excel
                        </button>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {honestSignCodes.map((item) => (
                          <div key={item.id} className="p-4 hover:bg-slate-50 flex justify-between items-center gap-4">
                            <div>
                              <div className="font-medium text-slate-900">{item.name}</div>
                              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500 font-mono">
                                <span>Кодов: {item.code_count}</span>
                                <span className="font-sans text-slate-600">Пол: <span className="font-medium text-slate-800">{item.gender_label || '-'}</span></span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-xs text-slate-400">
                                {new Date(item.created_at).toLocaleDateString()}
                              </div>
                              <button
                                onClick={() => handleDownloadHonestSignSupply(item)}
                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center text-xs font-medium"
                                title="Скачать Excel этой поставки"
                              >
                                <Download className="h-3.5 w-3.5 mr-1.5" /> Excel
                              </button>
                              <button
                                onClick={() => handleDeleteHonestSign(item.id)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded"
                                title="Удалить коды"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {honestSignTab === 'printed' && (
                <div className="oc-card p-6 mb-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">История напечатанных кодов</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Выберите поставщика</label>
                            <Select
                              value={honestSignSupplierId}
                              onChange={(e) => setHonestSignSupplierId(e.target.value)}
                              className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                              <option value="">-- Выберите поставщика --</option>
                              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </Select>
                        </div>
                    </div>

                    {honestSignPrintedHistory.length > 0 ? (
                        <div>
                            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="p-3 font-medium text-slate-500">Дата печати</th>
                                            <th className="p-3 font-medium text-slate-500">Файл</th>
                                            <th className="p-3 font-medium text-slate-500">Категория</th>
                                            <th className="p-3 font-medium text-slate-500">Пол</th>
                                            <th className="p-3 font-medium text-slate-500 text-right">Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {honestSignPrintedHistory.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="p-3">{new Date(item.created_at).toLocaleString('ru-RU')}</td>
                                                <td className="p-3">{item.file_name}</td>
                                                <td className="p-3">{item.category || '-'}</td>
                                                <td className="p-3">{getHSGenderLabel(item.gender)}</td>
                                                <td className="p-3 text-right flex gap-2 justify-end">
                                                    <button
                                                        onClick={() => handleDownloadHonestSignHistory(item.file_name, item.created_at)}
                                                        className="text-green-600 hover:text-green-800 font-medium p-1 hover:bg-green-50 rounded"
                                                        title="Скачать Excel"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-100 border-dashed">
                            <Printer className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                            <p>Нет напечатанных кодов</p>
                        </div>
                    )}
                </div>
              )}


              {honestSignTab === 'base' && (
                <div className="oc-card p-6 mb-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Загрузка базы кодов</h2>

                    <p className="mb-4 text-sm text-slate-600">
                      Выберите поставщика, откройте привязку, загрузите файлы с кодами (можно сразу все) и привяжите каждый файл к товару.
                    </p>

                    <div className="mb-6 grid grid-cols-1 items-end gap-4 md:grid-cols-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Выберите поставщика</label>
                            <Select
                              value={honestSignSupplierId}
                              onChange={(e) => setHonestSignSupplierId(e.target.value)}
                              className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                              <option value="">-- Выберите поставщика --</option>
                              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </Select>
                        </div>
                        <div className="md:col-span-2">
                            <button
                              type="button"
                              onClick={() => setShowHsFileLinker(true)}
                              disabled={!honestSignSupplierId}
                              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white shadow-lg shadow-indigo-200 transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none md:w-auto"
                            >
                              <Link className="h-5 w-5" />
                              Привязать файлы к товарам
                            </button>
                        </div>
                    </div>

                    {honestSignCategoryStats.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">Инфографика по ЧЗ в категориях</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                          {honestSignCategoryStats.map((s) => {
                            const used = !hsDisabledKeys.has(hsCategoryKey(s.category));
                            return (
                              <div
                                key={s.category}
                                className={`border rounded-lg p-3 transition-colors ${used ? 'bg-slate-50 border-slate-200' : 'bg-slate-100 border-slate-300'}`}
                              >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className={`font-medium ${used ? 'text-slate-900' : 'text-slate-500'}`}>{s.category}</div>
                                  <label
                                    className="flex shrink-0 cursor-pointer select-none items-center gap-1.5 text-xs font-medium text-slate-700"
                                    title="Снята — коды категории остаются в базе, но не подбираются, не печатаются и не считаются остатком"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={used}
                                      onChange={(e) => handleToggleHsCategoryUse(s.category, e.target.checked)}
                                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    Использовать
                                  </label>
                                </div>
                                <div className={`text-xs space-y-1 ${used ? 'text-slate-600' : 'text-slate-400'}`}>
                                  <div>Всего: <span className="font-semibold text-slate-900">{s.total}</span></div>
                                  <div>В базе: <span className="font-semibold text-indigo-700">{s.inBase}</span></div>
                                  <div>Напечатано: <span className="font-semibold text-green-700">{s.printed}</span></div>
                                  <div>Отсканировано: <span className="font-semibold text-orange-700">{s.scanned}</span></div>
                                </div>
                                {!used && (
                                  <div className="mt-2 rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">
                                    Не используется: коды не подбираются и не печатаются
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => openHsDelete(s.category)}
                                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Удалить коды…
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap justify-end gap-2 mb-4">
                        <button
                            onClick={() => openHsDelete(null)}
                            disabled={!honestSignSupplierId}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                            <Trash2 className="w-4 h-4" />
                            Удалить коды…
                        </button>
                        <button
                            onClick={() => setShowReturnCodesModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Вернуть в базу
                        </button>
                    </div>

                    {honestSignUploadHistory.length > 0 && (
                        <div>
                            <h3 className="text-md font-bold text-slate-900 mb-3">История загрузок</h3>
                            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="p-3 font-medium text-slate-500">Дата</th>
                                            <th className="p-3 font-medium text-slate-500">Файл</th>
                                            <th className="p-3 font-medium text-slate-500">Категория</th>
                                            <th className="p-3 font-medium text-slate-500">Пол</th>
                                            <th className="p-3 font-medium text-slate-500 text-right">Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {honestSignUploadHistory.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="p-3">{new Date(item.created_at).toLocaleString('ru-RU')}</td>
                                                <td className="p-3">{item.file_name}</td>
                                                <td className="p-3">{item.category || '-'}</td>
                                                <td className="p-3">
                                                  {getHSGenderLabel(item.gender)}
                                                  {/* Партия без размера подходит любому — это видно сразу. */}
                                                  {item.size ? (
                                                    <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{item.size}</span>
                                                  ) : (
                                                    <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-700">без размера</span>
                                                  )}
                                                </td>
                                                <td className="p-3 text-right flex gap-2 justify-end">
                                                    <button
                                                        onClick={() => handlePrintHonestSignHistory(item.file_name, item.created_at)}
                                                        className="text-indigo-600 hover:text-indigo-800 font-medium p-1 hover:bg-indigo-50 rounded"
                                                        title="Печать кодов"
                                                    >
                                                        <Printer className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownloadHonestSignHistory(item.file_name, item.created_at)}
                                                        className="text-green-600 hover:text-green-800 font-medium p-1 hover:bg-green-50 rounded"
                                                        title="Скачать Excel"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteHonestSignHistory(item.file_name, item.created_at)}
                                                        className="text-red-600 hover:text-red-800 font-medium p-1 hover:bg-red-50 rounded"
                                                        title="Удалить"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {honestSignPrintedHistory.length > 0 && (
                      <div className="mt-8">
                        <h3 className="text-md font-bold text-slate-900 mb-3">История напечатанных кодов</h3>
                        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                              <tr>
                                <th className="p-3 font-medium text-slate-500">Дата печати</th>
                                <th className="p-3 font-medium text-slate-500">Файл</th>
                                <th className="p-3 font-medium text-slate-500">Категория</th>
                                <th className="p-3 font-medium text-slate-500">Пол</th>
                                <th className="p-3 font-medium text-slate-500 text-right">Действия</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {honestSignPrintedHistory.map((item, idx) => (
                                <tr key={`printed-${idx}`} className="hover:bg-slate-50">
                                  <td className="p-3">{new Date(item.created_at).toLocaleString('ru-RU')}</td>
                                  <td className="p-3">{item.file_name}</td>
                                  <td className="p-3">{item.category || '-'}</td>
                                  <td className="p-3">{getHSGenderLabel(item.gender)}</td>
                                  <td className="p-3 text-right">
                                    <button
                                      onClick={() => handleDownloadHonestSignHistory(item.file_name, item.created_at)}
                                      className="text-green-600 hover:text-green-800 font-medium p-1 hover:bg-green-50 rounded"
                                      title="Скачать"
                                    >
                                      <Download className="h-4 w-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Print Area for Honest Sign */}
                    {isPrintingCodes && (
                        <div className={`print-only ${isPrintingCodes ? 'fixed left-[-9999px] top-0' : 'hidden'}`}>
                            {codesToPrint.map((code, idx) => (
                                <div key={idx} className="sticker bg-white flex flex-col items-center justify-center p-2 box-border overflow-hidden" style={{ width: '58mm', height: '40mm' }}>
                                    <canvas
                                        id={`hs-barcode-${idx}`}
                                        className="max-w-full max-h-[30mm]"
                                        ref={(canvas) => {
                                            if (canvas) {
                                                ensureBwip().then(() => { if (!lazyLibs.bwipjs) return;
                                                try {
                                                    lazyLibs.bwipjs.toCanvas(canvas, {
                                                        bcid: 'datamatrix',
                                                        text: restoreDataMatrixGs(code),
                                                        binarytext: true,
                                                        parsefnc: false,
                                                        scale: 2,
                                                        height: 20,
                                                        includetext: false,
                                                        textxalign: 'center',
                                                    });
                                                } catch (e) {
                                                    console.error(e);
                                                }
                                                });
                                            }
                                        }}
                                    />
                                    <div className="text-[8px] mt-1 text-center break-all leading-tight overflow-hidden h-[8px]">
                                        {code}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
              )}

              {honestSignTab === 'print' && (
                <>
                  <div className="flex flex-col gap-4 mb-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-bold text-slate-900">Файлы для печати</h2>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Select
                        value={printSupplierId}
                        onChange={(e) => setPrintSupplierId(e.target.value)}
                        className="flex-1 p-2 bg-white border border-slate-200 rounded-lg outline-none"
                      >
                        <option value="">-- Выберите поставщика --</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </Select>
                      <button
                        onClick={() => printFileInputRef.current?.click()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
                      >
                        <Upload className="h-4 w-4 mr-2" /> Загрузить
                      </button>
                      <button
                        onClick={fetchPrintFiles}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
                      >
                        <Send className="h-4 w-4 mr-2" /> Telegram
                      </button>
                      <button
                        onClick={runPrintBotDiagnostics}
                        className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 flex items-center"
                      >
                        Диагностика бота
                      </button>
                      <input
                        type="file"
                        ref={printFileInputRef}
                        onChange={handlePrintFileUpload}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.xlsx"
                        multiple
                      />
                    </div>
                  </div>

                  {printBotDiagnosticsOpen && (
                    <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold text-slate-900">Диагностика Telegram-бота</div>
                        <button onClick={() => setPrintBotDiagnosticsOpen(false)} className="text-xs text-slate-500 hover:text-slate-700">Закрыть</button>
                      </div>
                      <pre className="text-[11px] text-slate-700 whitespace-pre-wrap max-h-56 overflow-y-auto">{printBotDiagnostics}</pre>
                    </div>
                  )}

                  {printFiles.filter(f => !printSupplierId || f.supplier_id === printSupplierId).length === 0 ? (
                    <div className="text-center py-20 text-slate-400 bg-white rounded-xl border border-slate-100 border-dashed">
                      <Printer className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                      <p>Нет файлов для печати</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {printFiles.filter(f => !printSupplierId || f.supplier_id === printSupplierId).map(file => (
                        <div key={file.id} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-50 rounded-lg">
                              {getFileIcon(file.type)}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">{file.name}</div>
                              {file.printed_at && (
                                <div className="text-xs text-green-600 flex items-center mt-1">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Распечатано: {file.printed_at}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {file.printed_at ? (
                              <Lock className="h-5 w-5 text-slate-400 mr-2" />
                            ) : (
                              <button
                                onClick={() => handlePrintFile(file.id)}
                                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                title="Печать"
                              >
                                <Printer className="h-5 w-5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeletePrintFile(file.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="Удалить"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
  );
}
