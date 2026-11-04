// Вынесено из Dashboard.tsx автоматически (ленивая загрузка раздела). Данные приходят пропсами из Dashboard.
/* eslint-disable */
import { Map as MapIcon, ShieldCheck } from 'lucide-react';
import { WbLayoutHandle } from '../dashboardComponents';

export function Tab_map(props: any) {
  const { PREVIEW_BASE_H, PREVIEW_BASE_W, PREVIEW_SCALE_X, PREVIEW_SCALE_Y, handleSaveWbLayoutEditor, handleTestPrintWbLayout, mmToPreviewX, mmToPreviewY, ptToPreviewPx, setWbLayoutEditor, setWbLayoutTemplate, startWbBlockDrag, wbLayoutEditor, wbLayoutPdfPreviews, wbLayoutTemplate, wbPreviewScale, wbPreviewWrapRef } = props;
  return (
<div className="max-w-6xl mx-auto">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
                  <MapIcon className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 leading-tight">Конструктор этикеток</h1>
                  <p className="text-slate-500 mt-0.5">Настройка макетов и печать этикеток внутри системы</p>
                </div>
              </div>

              {/* Вкладки шаблонов: показываем один зараз — удобнее */}
              <div className="mb-5 flex flex-wrap gap-2">
                {([
                  { key: 'withChz', label: 'С ЧЗ' },
                  { key: 'withoutChz', label: 'Без ЧЗ' },
                  { key: 'fboBoxes', label: 'Короба FBO' },
                  { key: 'nameSequence', label: 'Номер + имя' },
                  { key: 'chzTail', label: 'ЧЗ + конец стикера' },
                  { key: 'fbsCombo', label: 'Стикер + ЧЗ' },
                ] as const).map(({ key, label }) => (
                  <button
                    key={`maptab-${key}`}
                    onClick={() => setWbLayoutTemplate(key)}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all active:scale-[0.97] ${wbLayoutTemplate === key ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-5 md:p-6 space-y-4">
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 space-y-3">
                    <div className="font-bold text-slate-900">Настройки макета</div>
                    <div className="text-xs text-slate-500">Двигай ползунки и блоки в превью. Настройки сразу влияют на печать в «Товары WB».</div>

                    <div className="grid grid-cols-1 gap-3">
                      <div className={`p-3 bg-white rounded-xl border border-slate-200 shadow-sm ${wbLayoutTemplate === 'withChz' ? '' : 'hidden'}`}>
                        <div className="text-xs font-bold mb-2 text-slate-700">С ЧЗ (QR + штрихкод)</div>
                        <label className="mt-2 block text-[11px] font-medium text-slate-500">Размер QR/DataMatrix: {wbLayoutEditor.withChz.dmSize.toFixed(1)} мм</label>
                        <input type="range" min={18} max={25} step={0.1} value={wbLayoutEditor.withChz.dmSize} onChange={(e) => setWbLayoutEditor(prev => ({ ...prev, withChz: { ...prev.withChz, dmSize: Number(e.target.value) } }))} className="w-full accent-indigo-600 cursor-pointer" />
                        <label className="mt-2 block text-[11px] font-medium text-slate-500">Размер заголовка: {wbLayoutEditor.withChz.titleFont.toFixed(1)}</label>
                        <input type="range" min={7} max={10} step={0.1} value={wbLayoutEditor.withChz.titleFont} onChange={(e) => setWbLayoutEditor(prev => ({ ...prev, withChz: { ...prev.withChz, titleFont: Number(e.target.value) } }))} className="w-full accent-indigo-600 cursor-pointer" />
                        <label className="mt-2 block text-[11px] font-medium text-slate-500">Отступ после названия: {wbLayoutEditor.withChz.titleGap.toFixed(1)} мм</label>
                        <input type="range" min={0} max={3} step={0.1} value={wbLayoutEditor.withChz.titleGap} onChange={(e) => setWbLayoutEditor(prev => ({ ...prev, withChz: { ...prev.withChz, titleGap: Number(e.target.value) } }))} className="w-full accent-indigo-600 cursor-pointer" />
                        <label className="mt-2 block text-[11px] font-medium text-slate-500">Отступ строк данных: {wbLayoutEditor.withChz.dataGap.toFixed(2)} мм</label>
                        <input type="range" min={1.6} max={4} step={0.05} value={wbLayoutEditor.withChz.dataGap} onChange={(e) => setWbLayoutEditor(prev => ({ ...prev, withChz: { ...prev.withChz, dataGap: Number(e.target.value) } }))} className="w-full accent-indigo-600 cursor-pointer" />
                        <label className="mt-2 block text-[11px] font-medium text-slate-500">Размер текста: {wbLayoutEditor.withChz.textFont.toFixed(1)}</label>
                        <input type="range" min={6} max={8} step={0.1} value={wbLayoutEditor.withChz.textFont} onChange={(e) => setWbLayoutEditor(prev => ({ ...prev, withChz: { ...prev.withChz, textFont: Number(e.target.value) } }))} className="w-full accent-indigo-600 cursor-pointer" />
                        <label className="mt-2 block text-[11px] font-medium text-slate-500">Штрихкод ширина: {wbLayoutEditor.withChz.barcodeW.toFixed(1)} мм</label>
                        <input type="range" min={24} max={34} step={0.1} value={wbLayoutEditor.withChz.barcodeW} onChange={(e) => setWbLayoutEditor(prev => ({ ...prev, withChz: { ...prev.withChz, barcodeW: Number(e.target.value) } }))} className="w-full accent-indigo-600 cursor-pointer" />
                        <label className="mt-2 block text-[11px] font-medium text-slate-500">Штрихкод высота: {wbLayoutEditor.withChz.barcodeH.toFixed(1)} мм</label>
                        <input type="range" min={5.5} max={10} step={0.1} value={wbLayoutEditor.withChz.barcodeH} onChange={(e) => setWbLayoutEditor(prev => ({ ...prev, withChz: { ...prev.withChz, barcodeH: Number(e.target.value) } }))} className="w-full accent-indigo-600 cursor-pointer" />
                        <label className="mt-2 block text-[11px] font-medium text-slate-500">Цифры штрихкода Y: {wbLayoutEditor.withChz.barcodeTextY.toFixed(2)}</label>
                        <input type="range" min={35} max={39.5} step={0.05} value={wbLayoutEditor.withChz.barcodeTextY} onChange={(e) => setWbLayoutEditor(prev => ({ ...prev, withChz: { ...prev.withChz, barcodeTextY: Number(e.target.value), barcodeTextYpx: mmToPreviewY(Number(e.target.value)) } }))} className="w-full accent-indigo-600 cursor-pointer" />
                      </div>

                      <div className={`p-3 bg-white rounded-xl border border-slate-200 shadow-sm ${wbLayoutTemplate === 'withoutChz' ? '' : 'hidden'}`}>
                        <div className="text-xs font-bold mb-2 text-slate-700">Без ЧЗ (только штрихкод)</div>
                        <label className="mt-2 block text-[11px] font-medium text-slate-500">Штрихкод ширина: {wbLayoutEditor.withoutChz.barcodeW.toFixed(1)} мм</label>
                        <input type="range" min={46} max={56} step={0.1} value={wbLayoutEditor.withoutChz.barcodeW} onChange={(e) => setWbLayoutEditor(prev => ({ ...prev, withoutChz: { ...prev.withoutChz, barcodeW: Number(e.target.value) } }))} className="w-full accent-indigo-600 cursor-pointer" />
                        <label className="mt-2 block text-[11px] font-medium text-slate-500">Штрихкод высота: {wbLayoutEditor.withoutChz.barcodeH.toFixed(1)} мм</label>
                        <input type="range" min={7} max={12} step={0.1} value={wbLayoutEditor.withoutChz.barcodeH} onChange={(e) => setWbLayoutEditor(prev => ({ ...prev, withoutChz: { ...prev.withoutChz, barcodeH: Number(e.target.value) } }))} className="w-full accent-indigo-600 cursor-pointer" />
                        <label className="mt-2 block text-[11px] font-medium text-slate-500">Цифры штрихкода Y: {wbLayoutEditor.withoutChz.barcodeTextY.toFixed(2)}</label>
                        <input type="range" min={13} max={16.5} step={0.05} value={wbLayoutEditor.withoutChz.barcodeTextY} onChange={(e) => setWbLayoutEditor(prev => ({ ...prev, withoutChz: { ...prev.withoutChz, barcodeTextY: Number(e.target.value), barcodeTextYpx: mmToPreviewY(Number(e.target.value)) } }))} className="w-full accent-indigo-600 cursor-pointer" />
                        <label className="mt-2 block text-[11px] font-medium text-slate-500">Размер заголовка: {wbLayoutEditor.withoutChz.titleFont.toFixed(1)}</label>
                        <input type="range" min={7.5} max={10} step={0.1} value={wbLayoutEditor.withoutChz.titleFont} onChange={(e) => setWbLayoutEditor(prev => ({ ...prev, withoutChz: { ...prev.withoutChz, titleFont: Number(e.target.value) } }))} className="w-full accent-indigo-600 cursor-pointer" />
                        <label className="mt-2 block text-[11px] font-medium text-slate-500">Отступ после названия: {wbLayoutEditor.withoutChz.titleGap.toFixed(1)} мм</label>
                        <input type="range" min={0} max={3} step={0.1} value={wbLayoutEditor.withoutChz.titleGap} onChange={(e) => setWbLayoutEditor(prev => ({ ...prev, withoutChz: { ...prev.withoutChz, titleGap: Number(e.target.value) } }))} className="w-full accent-indigo-600 cursor-pointer" />
                        <label className="mt-2 block text-[11px] font-medium text-slate-500">Отступ строк данных: {wbLayoutEditor.withoutChz.dataGap.toFixed(2)} мм</label>
                        <input type="range" min={1.8} max={4.5} step={0.05} value={wbLayoutEditor.withoutChz.dataGap} onChange={(e) => setWbLayoutEditor(prev => ({ ...prev, withoutChz: { ...prev.withoutChz, dataGap: Number(e.target.value) } }))} className="w-full accent-indigo-600 cursor-pointer" />
                        <label className="mt-2 block text-[11px] font-medium text-slate-500">Размер текста: {wbLayoutEditor.withoutChz.textFont.toFixed(1)}</label>
                        <input type="range" min={7} max={9.5} step={0.1} value={wbLayoutEditor.withoutChz.textFont} onChange={(e) => setWbLayoutEditor(prev => ({ ...prev, withoutChz: { ...prev.withoutChz, textFont: Number(e.target.value) } }))} className="w-full accent-indigo-600 cursor-pointer" />
                      </div>

                      <div className={`p-3 bg-white rounded-xl border border-slate-200 shadow-sm ${wbLayoutTemplate === 'fboBoxes' ? '' : 'hidden'}`}>
                        <div className="text-xs font-bold mb-2 text-slate-700">Короба FBO</div>
                        <label className="mt-2 block text-[11px] font-medium text-slate-500">Штрихкод ширина: {wbLayoutEditor.fboBoxes.barcodeW.toFixed(1)} мм</label>
                        <input type="range" min={40} max={54} step={0.1} value={wbLayoutEditor.fboBoxes.barcodeW} onChange={(e) => setWbLayoutEditor(prev => ({ ...prev, fboBoxes: { ...prev.fboBoxes, barcodeW: Number(e.target.value) } }))} className="w-full accent-indigo-600 cursor-pointer" />
                        <label className="mt-2 block text-[11px] font-medium text-slate-500">Штрихкод высота: {wbLayoutEditor.fboBoxes.barcodeH.toFixed(1)} мм</label>
                        <input type="range" min={9} max={16} step={0.1} value={wbLayoutEditor.fboBoxes.barcodeH} onChange={(e) => setWbLayoutEditor(prev => ({ ...prev, fboBoxes: { ...prev.fboBoxes, barcodeH: Number(e.target.value) } }))} className="w-full accent-indigo-600 cursor-pointer" />
                        <label className="mt-2 block text-[11px] font-medium text-slate-500">Размер номера: {wbLayoutEditor.fboBoxes.numberFont.toFixed(1)}</label>
                        <input type="range" min={8} max={14} step={0.1} value={wbLayoutEditor.fboBoxes.numberFont} onChange={(e) => setWbLayoutEditor(prev => ({ ...prev, fboBoxes: { ...prev.fboBoxes, numberFont: Number(e.target.value) } }))} className="w-full accent-indigo-600 cursor-pointer" />
                        <label className="mt-2 block text-[11px] font-medium text-slate-500">Размер кода: {wbLayoutEditor.fboBoxes.codeFont.toFixed(1)}</label>
                        <input type="range" min={7} max={12} step={0.1} value={wbLayoutEditor.fboBoxes.codeFont} onChange={(e) => setWbLayoutEditor(prev => ({ ...prev, fboBoxes: { ...prev.fboBoxes, codeFont: Number(e.target.value) } }))} className="w-full accent-indigo-600 cursor-pointer" />
                      </div>

                      <div className={`p-3 bg-white rounded-xl border border-slate-200 shadow-sm ${wbLayoutTemplate === 'nameSequence' ? '' : 'hidden'}`}>
                        <div className="text-xs font-bold mb-2 text-slate-700">Номер + имя</div>
                        <label className="mt-2 block text-[11px] font-medium text-slate-500">Размер номера: {wbLayoutEditor.nameSequence.numberFont.toFixed(1)}</label>
                        <input type="range" min={18} max={34} step={0.1} value={wbLayoutEditor.nameSequence.numberFont} onChange={(e) => setWbLayoutEditor(prev => ({ ...prev, nameSequence: { ...prev.nameSequence, numberFont: Number(e.target.value) } }))} className="w-full accent-indigo-600 cursor-pointer" />
                        <label className="mt-2 block text-[11px] font-medium text-slate-500">Размер имени: {wbLayoutEditor.nameSequence.nameFont.toFixed(1)}</label>
                        <input type="range" min={8} max={16} step={0.1} value={wbLayoutEditor.nameSequence.nameFont} onChange={(e) => setWbLayoutEditor(prev => ({ ...prev, nameSequence: { ...prev.nameSequence, nameFont: Number(e.target.value) } }))} className="w-full accent-indigo-600 cursor-pointer" />
                        <div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                          Макет для быстрой печати последовательности: сверху номер, снизу имя пользователя.
                        </div>
                      </div>

                      {/* Макеты ФБС: печатаются из «Управление ФБС» кнопкой
                          «Стикеры» с галочкой «с ЧЗ». Перетаскивания блоков тут
                          нет — под ползунками настоящий PDF, по нему и видно. */}
                      <div className={`p-3 bg-white rounded-xl border border-slate-200 shadow-sm ${wbLayoutTemplate === 'chzTail' ? '' : 'hidden'}`}>
                        <div className="text-xs font-bold mb-2 text-slate-700">ШК + ЧЗ + конец стикера</div>
                        {([
                          { key: 'dmSize', label: 'Размер марки (ЧЗ)', min: 20, max: 26, step: 0.1, unit: ' мм' },
                          { key: 'tailFont', label: 'Конец номера, размер', min: 10, max: 28, step: 0.5, unit: '' },
                          { key: 'headFont', label: 'Начало номера, размер', min: 4, max: 12, step: 0.1, unit: '' },
                          { key: 'headGap', label: 'Начало номера, подъём над концом', min: 3, max: 14, step: 0.1, unit: ' мм' },
                          { key: 'titleFont', label: 'Размер названия', min: 4.5, max: 9, step: 0.1, unit: '' },
                          { key: 'textFont', label: 'Размер текста', min: 4, max: 8, step: 0.1, unit: '' },
                          { key: 'dataGap', label: 'Отступ строк данных', min: 1.8, max: 4.5, step: 0.05, unit: ' мм' },
                          { key: 'barcodeW', label: 'Штрихкод ширина', min: 18, max: 30, step: 0.1, unit: ' мм' },
                          { key: 'barcodeH', label: 'Штрихкод высота', min: 4, max: 10, step: 0.1, unit: ' мм' },
                        ] as const).map(({ key, label, min, max, step, unit }) => (
                          <div key={`chzTail-${key}`}>
                            <label className="mt-2 block text-[11px] font-medium text-slate-500">{label}: {Number((wbLayoutEditor.chzTail as any)[key]).toFixed(1)}{unit}</label>
                            <input
                              type="range" min={min} max={max} step={step}
                              value={(wbLayoutEditor.chzTail as any)[key]}
                              onChange={(e) => setWbLayoutEditor((prev: any) => ({ ...prev, chzTail: { ...prev.chzTail, [key]: Number(e.target.value) } }))}
                              className="w-full accent-indigo-600 cursor-pointer"
                            />
                          </div>
                        ))}
                        <div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                          Справа — номер стикера целиком, как на этикетке WB: начало мелко, конец крупно.
                          Это подпись для глаз сборщика; второго машиночитаемого кода тут нет — сканеру он не
                          нужен, а место отнял бы у марки.
                        </div>
                      </div>

                      <div className={`p-3 bg-white rounded-xl border border-slate-200 shadow-sm ${wbLayoutTemplate === 'fbsCombo' ? '' : 'hidden'}`}>
                        <div className="text-xs font-bold mb-2 text-slate-700">Стикер задания + ЧЗ на одной этикетке</div>
                        {([
                          { key: 'symbolSize', label: 'Сторона обоих кодов', min: 18, max: 30, step: 0.1, unit: ' мм' },
                          { key: 'codeTextFont', label: 'Код марки текстом, размер', min: 2.6, max: 5, step: 0.1, unit: '' },
                          { key: 'partBFont', label: 'Номер задания, конец (крупно)', min: 8, max: 18, step: 0.5, unit: '' },
                          { key: 'partAFont', label: 'Номер задания, начало (мелко)', min: 4, max: 9, step: 0.1, unit: '' },
                          { key: 'partGap', label: 'Начало номера, подъём над концом', min: 3, max: 14, step: 0.1, unit: ' мм' },
                          { key: 'sideQrSize', label: 'QR по бокам номера, сторона (0 — убрать)', min: 0, max: 12, step: 0.1, unit: ' мм' },
                          { key: 'sideQrGap', label: 'QR по бокам, отступ от центра номера', min: 3, max: 18, step: 0.1, unit: ' мм' },
                          { key: 'sideQrDy', label: 'QR по бокам, сдвиг по высоте', min: -12, max: 4, step: 0.1, unit: ' мм' },
                        ] as const).map(({ key, label, min, max, step, unit }) => (
                          <div key={`fbsCombo-${key}`}>
                            <label className="mt-2 block text-[11px] font-medium text-slate-500">{label}: {Number((wbLayoutEditor.fbsCombo as any)[key]).toFixed(1)}{unit}</label>
                            <input
                              type="range" min={min} max={max} step={step}
                              value={(wbLayoutEditor.fbsCombo as any)[key]}
                              onChange={(e) => setWbLayoutEditor((prev: any) => ({ ...prev, fbsCombo: { ...prev.fbsCombo, [key]: Number(e.target.value) } }))}
                              className="w-full accent-indigo-600 cursor-pointer"
                            />
                          </div>
                        ))}
                        <div className="mt-3 rounded-lg border border-dashed border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
                          Макет проверен на приёмке WB 14.09.2026 — этикетки приняты.
                          На этикетке марка ЧЗ и QR задания; полос штрихкода, товарного ШК, артикула и размера нет —
                          QR несёт то же значение, что стикер WB. У марки 72×72 модуля: меньше 22 мм сторону не
                          уменьшайте — модуль уходит к границе допустимого по ГИС МТ. Маленькие QR по бокам номера —
                          копии большого; меньше 6 мм сканер может не взять.
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                      <button onClick={handleSaveWbLayoutEditor} className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">Сохранить макеты WB для печати</button>
                      <button onClick={() => handleTestPrintWbLayout('withChz')} className="w-full py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium">Пробная печать (с ЧЗ)</button>
                      <button onClick={() => handleTestPrintWbLayout('withoutChz')} className="w-full py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 text-sm font-medium">Пробная печать (без ЧЗ)</button>
                      <button onClick={() => handleTestPrintWbLayout('fboBoxes')} className="w-full py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium">Пробная печать (Короба FBO)</button>
                      <button onClick={() => handleTestPrintWbLayout('nameSequence')} className="w-full py-2 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 text-sm font-medium">Пробная печать (Номер + имя)</button>
                      <button onClick={() => handleTestPrintWbLayout('chzTail')} className="w-full py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium">Пробная печать (ЧЗ + конец стикера)</button>
                      <button onClick={() => handleTestPrintWbLayout('fbsCombo')} className="w-full py-2 bg-sky-700 text-white rounded-lg hover:bg-sky-800 text-sm font-medium">Пробная печать (Стикер + ЧЗ)</button>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-5 md:p-6">
                  <h3 className="font-bold text-slate-900 mb-1">Предпросмотр 58×40 (XPrinter 420B)</h3>
                  <p className="text-xs text-slate-500 mb-3">В реальном времени: двигаешь ползунки слева, и сразу меняются размеры блоков во всех макетах.</p>

                  <div ref={wbPreviewWrapRef} className="w-full overflow-hidden" style={{ height: PREVIEW_BASE_H * wbPreviewScale }}>
                  <div className="origin-top-left" style={{ width: PREVIEW_BASE_W, height: PREVIEW_BASE_H, transform: `scale(${wbPreviewScale})` }}>
                  <div className="space-y-4">
                    <div className={wbLayoutTemplate === 'withChz' ? '' : 'hidden'}>
                      {/* Подложка — настоящий PDF, рамки блоков лежат поверх него.
                          Так «где двигаю» и «как напечатается» — это одна картинка,
                          а не две похожие: раньше предпросмотр рисовался своим
                          кодом, системным шрифтом и от верхнего края текста,
                          тогда как печать ставит текст по базовой линии. */}
                      <div
                        className="wb-preview-frame mx-auto rounded-2xl max-w-full bg-white relative overflow-hidden ring-1 ring-slate-200 shadow-[0_14px_40px_-16px_rgba(15,23,42,0.35)]"
                        style={{ width: PREVIEW_BASE_W, height: PREVIEW_BASE_H }}
                      >
                        {wbLayoutPdfPreviews.withChz ? (
                          <iframe
                            title="wb-layout-underlay"
                            src={`${wbLayoutPdfPreviews.withChz}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                            className="pointer-events-none absolute inset-0 h-full w-full border-0"
                          />
                        ) : (
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-slate-400">
                            Готовлю предпросмотр печати…
                          </div>
                        )}
                        <span className="pointer-events-none absolute right-2 bottom-2 rounded-full bg-slate-900/70 px-2 py-0.5 text-[10px] font-medium text-white">58 × 40 мм</span>
                        {/* Рамки — только рамки: содержимое видно на подложке. */}
                        <WbLayoutHandle
                          title="ЧЗ"
                          tone="indigo"
                          onMouseDown={(e) => startWbBlockDrag(e, 'withChz', 'dmXpx', 'dmYpx', wbLayoutEditor.withChz.dmXpx, wbLayoutEditor.withChz.dmYpx)}
                          style={{
                            left: `${wbLayoutEditor.withChz.dmXpx}px`,
                            top: `${wbLayoutEditor.withChz.dmYpx}px`,
                            width: `${wbLayoutEditor.withChz.dmSize * PREVIEW_SCALE_X}px`,
                            height: `${wbLayoutEditor.withChz.dmSize * PREVIEW_SCALE_Y}px`,
                          }}
                        />

                        {/* Текст печатается по базовой линии, поэтому рамка
                            начинается на строку выше точки привязки — иначе она
                            стояла бы ниже настоящего текста. */}
                        <WbLayoutHandle
                          title="Текст"
                          tone="emerald"
                          onMouseDown={(e) => startWbBlockDrag(e, 'withChz', 'textXpx', 'textYpx', wbLayoutEditor.withChz.textXpx, wbLayoutEditor.withChz.textYpx)}
                          style={{
                            left: `${wbLayoutEditor.withChz.textXpx}px`,
                            top: `${wbLayoutEditor.withChz.textYpx - ptToPreviewPx(wbLayoutEditor.withChz.titleFont)}px`,
                            width: `${mmToPreviewX(28.8)}px`,
                            height: `${mmToPreviewY(4.0 + wbLayoutEditor.withChz.titleGap + wbLayoutEditor.withChz.dataGap * 4) + ptToPreviewPx(wbLayoutEditor.withChz.textFont)}px`,
                          }}
                        />

                        <WbLayoutHandle
                          title="Код цифрами"
                          tone="amber"
                          onMouseDown={(e) => startWbBlockDrag(e, 'withChz', 'dmTextXpx', 'dmTextYpx', wbLayoutEditor.withChz.dmTextXpx, wbLayoutEditor.withChz.dmTextYpx)}
                          style={{
                            left: `${wbLayoutEditor.withChz.dmTextXpx}px`,
                            top: `${wbLayoutEditor.withChz.dmTextYpx - ptToPreviewPx(3.6)}px`,
                            width: `${Math.max(mmToPreviewX(16), wbLayoutEditor.withChz.dmSize * PREVIEW_SCALE_X)}px`,
                            height: `${ptToPreviewPx(3.6) * 2.4}px`,
                          }}
                        />

                        <WbLayoutHandle
                          title="Штрихкод"
                          tone="fuchsia"
                          onMouseDown={(e) => startWbBlockDrag(e, 'withChz', 'barcodeXpx', 'barcodeYpx', wbLayoutEditor.withChz.barcodeXpx, wbLayoutEditor.withChz.barcodeYpx)}
                          style={{
                            left: `${wbLayoutEditor.withChz.barcodeXpx}px`,
                            top: `${wbLayoutEditor.withChz.barcodeYpx}px`,
                            width: `${wbLayoutEditor.withChz.barcodeW * PREVIEW_SCALE_X}px`,
                            height: `${wbLayoutEditor.withChz.barcodeH * PREVIEW_SCALE_Y}px`,
                          }}
                        />

                        {/* Цифры под штрихкодом печать не опускает выше самого
                            штрихкода: берётся большее из «под ним» и заданной
                            высоты. Повторяем то же правило, иначе рамка и печать
                            расходятся, как только цифры тянут вверх. */}
                        <WbLayoutHandle
                          title="Цифры ШК"
                          tone="cyan"
                          onMouseDown={(e) => startWbBlockDrag(e, 'withChz', 'barcodeXpx', 'barcodeTextYpx', wbLayoutEditor.withChz.barcodeXpx, wbLayoutEditor.withChz.barcodeTextYpx)}
                          style={{
                            left: `${wbLayoutEditor.withChz.barcodeXpx}px`,
                            top: `${Math.max(
                              wbLayoutEditor.withChz.barcodeYpx + wbLayoutEditor.withChz.barcodeH * PREVIEW_SCALE_Y + mmToPreviewY(1.2),
                              wbLayoutEditor.withChz.barcodeTextYpx,
                            ) - ptToPreviewPx(10.4)}px`,
                            width: `${wbLayoutEditor.withChz.barcodeW * PREVIEW_SCALE_X}px`,
                            height: `${ptToPreviewPx(10.4) * 1.25}px`,
                          }}
                        />
                      </div>
                    </div>

                    <div className={wbLayoutTemplate === 'withoutChz' ? '' : 'hidden'}>
                      <div className="wb-preview-frame mx-auto rounded-2xl max-w-full bg-white relative overflow-hidden ring-1 ring-slate-200 shadow-[0_14px_40px_-16px_rgba(15,23,42,0.35)]" style={{ width: PREVIEW_BASE_W, height: PREVIEW_BASE_H }}>
                        {wbLayoutPdfPreviews.withoutChz ? (
                          <iframe title="wb-layout-underlay-withoutChz" src={`${wbLayoutPdfPreviews.withoutChz}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`} className="pointer-events-none absolute inset-0 h-full w-full border-0" />
                        ) : null}
                        <WbLayoutHandle
                          title="Штрихкод"
                          tone="fuchsia"
                          onMouseDown={(e) => startWbBlockDrag(e, 'withoutChz', 'barcodeXpx', 'barcodeYpx', wbLayoutEditor.withoutChz.barcodeXpx, wbLayoutEditor.withoutChz.barcodeYpx)}
                          style={{
                            left: `${wbLayoutEditor.withoutChz.barcodeXpx}px`,
                            top: `${wbLayoutEditor.withoutChz.barcodeYpx}px`,
                            width: `${wbLayoutEditor.withoutChz.barcodeW * PREVIEW_SCALE_X}px`,
                            height: `${wbLayoutEditor.withoutChz.barcodeH * PREVIEW_SCALE_Y}px`,
                          }}
                        />

                        <WbLayoutHandle
                          title="Цифры ШК"
                          tone="cyan"
                          onMouseDown={(e) => startWbBlockDrag(e, 'withoutChz', 'barcodeXpx', 'barcodeTextYpx', wbLayoutEditor.withoutChz.barcodeXpx, wbLayoutEditor.withoutChz.barcodeTextYpx)}
                          style={{
                            left: `${wbLayoutEditor.withoutChz.barcodeXpx}px`,
                            top: `${Math.max(
                              wbLayoutEditor.withoutChz.barcodeYpx + wbLayoutEditor.withoutChz.barcodeH * PREVIEW_SCALE_Y + mmToPreviewY(1.2),
                              wbLayoutEditor.withoutChz.barcodeTextYpx,
                            ) - ptToPreviewPx(10.6)}px`,
                            width: `${wbLayoutEditor.withoutChz.barcodeW * PREVIEW_SCALE_X}px`,
                            height: `${ptToPreviewPx(10.6) * 1.25}px`,
                          }}
                        />

                        <WbLayoutHandle
                          title="Текст"
                          tone="emerald"
                          onMouseDown={(e) => startWbBlockDrag(e, 'withoutChz', 'textXpx', 'textYpx', wbLayoutEditor.withoutChz.textXpx, wbLayoutEditor.withoutChz.textYpx)}
                          style={{
                            left: `${wbLayoutEditor.withoutChz.textXpx}px`,
                            top: `${wbLayoutEditor.withoutChz.textYpx - ptToPreviewPx(wbLayoutEditor.withoutChz.titleFont)}px`,
                            width: `${mmToPreviewX(Math.max(24, 56 - (wbLayoutEditor.withoutChz.textXpx / PREVIEW_SCALE_X)))}px`,
                            height: `${mmToPreviewY(4.5 + wbLayoutEditor.withoutChz.titleGap + wbLayoutEditor.withoutChz.dataGap * 4) + ptToPreviewPx(wbLayoutEditor.withoutChz.textFont)}px`,
                          }}
                        />
                      </div>
                    </div>

                    <div className={wbLayoutTemplate === 'fboBoxes' ? '' : 'hidden'}>
                      <div className="wb-preview-frame mx-auto rounded-2xl max-w-full bg-white relative overflow-hidden ring-1 ring-slate-200 shadow-[0_14px_40px_-16px_rgba(15,23,42,0.35)]" style={{ width: PREVIEW_BASE_W, height: PREVIEW_BASE_H }}>
                        {wbLayoutPdfPreviews.fboBoxes ? (
                          <iframe title="wb-layout-underlay-fboBoxes" src={`${wbLayoutPdfPreviews.fboBoxes}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`} className="pointer-events-none absolute inset-0 h-full w-full border-0" />
                        ) : null}
                        <WbLayoutHandle title="Номер" tone="cyan" onMouseDown={(e) => startWbBlockDrag(e, 'fboBoxes', 'numberXpx', 'numberYpx', wbLayoutEditor.fboBoxes.numberXpx, wbLayoutEditor.fboBoxes.numberYpx)} style={{ left: `${wbLayoutEditor.fboBoxes.numberXpx - mmToPreviewX(6)}px`, top: `${wbLayoutEditor.fboBoxes.numberYpx - ptToPreviewPx(wbLayoutEditor.fboBoxes.numberFont)}px`, width: `${mmToPreviewX(12)}px`, height: `${ptToPreviewPx(wbLayoutEditor.fboBoxes.numberFont) * 1.25}px` }} />
                        <WbLayoutHandle title="Поставщик" tone="emerald" onMouseDown={(e) => startWbBlockDrag(e, 'fboBoxes', 'supplierXpx', 'supplierYpx', wbLayoutEditor.fboBoxes.supplierXpx, wbLayoutEditor.fboBoxes.supplierYpx)} style={{ left: `${wbLayoutEditor.fboBoxes.supplierXpx - mmToPreviewX(12)}px`, top: `${wbLayoutEditor.fboBoxes.supplierYpx - ptToPreviewPx(wbLayoutEditor.fboBoxes.supplierFont)}px`, width: `${mmToPreviewX(24)}px`, height: `${ptToPreviewPx(wbLayoutEditor.fboBoxes.supplierFont) * 1.25}px` }} />
                        <WbLayoutHandle title="Штрихкод" tone="fuchsia" onMouseDown={(e) => startWbBlockDrag(e, 'fboBoxes', 'barcodeXpx', 'barcodeYpx', wbLayoutEditor.fboBoxes.barcodeXpx, wbLayoutEditor.fboBoxes.barcodeYpx)} style={{ left: `${wbLayoutEditor.fboBoxes.barcodeXpx}px`, top: `${wbLayoutEditor.fboBoxes.barcodeYpx}px`, width: `${wbLayoutEditor.fboBoxes.barcodeW * PREVIEW_SCALE_X}px`, height: `${wbLayoutEditor.fboBoxes.barcodeH * PREVIEW_SCALE_Y}px` }} />
                        <WbLayoutHandle title="Код короба" tone="amber" onMouseDown={(e) => startWbBlockDrag(e, 'fboBoxes', 'codeXpx', 'codeYpx', wbLayoutEditor.fboBoxes.codeXpx, wbLayoutEditor.fboBoxes.codeYpx)} style={{ left: `${wbLayoutEditor.fboBoxes.codeXpx - mmToPreviewX(14)}px`, top: `${wbLayoutEditor.fboBoxes.codeYpx - ptToPreviewPx(wbLayoutEditor.fboBoxes.codeFont)}px`, width: `${mmToPreviewX(28)}px`, height: `${ptToPreviewPx(wbLayoutEditor.fboBoxes.codeFont) * 1.25}px` }} />
                        <WbLayoutHandle title="Подпись" tone="indigo" onMouseDown={(e) => startWbBlockDrag(e, 'fboBoxes', 'footerXpx', 'footerYpx', wbLayoutEditor.fboBoxes.footerXpx, wbLayoutEditor.fboBoxes.footerYpx)} style={{ left: `${wbLayoutEditor.fboBoxes.footerXpx - mmToPreviewX(10)}px`, top: `${wbLayoutEditor.fboBoxes.footerYpx - ptToPreviewPx(wbLayoutEditor.fboBoxes.footerFont)}px`, width: `${mmToPreviewX(20)}px`, height: `${ptToPreviewPx(wbLayoutEditor.fboBoxes.footerFont) * 1.25}px` }} />
                      </div>
                    </div>

                    <div className={wbLayoutTemplate === 'nameSequence' ? '' : 'hidden'}>
                      <div className="wb-preview-frame mx-auto rounded-2xl max-w-full bg-white relative overflow-hidden ring-1 ring-slate-200 shadow-[0_14px_40px_-16px_rgba(15,23,42,0.35)]" style={{ width: PREVIEW_BASE_W, height: PREVIEW_BASE_H }}>
                        {wbLayoutPdfPreviews.nameSequence ? (
                          <iframe title="wb-layout-underlay-nameSequence" src={`${wbLayoutPdfPreviews.nameSequence}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`} className="pointer-events-none absolute inset-0 h-full w-full border-0" />
                        ) : null}
                        <WbLayoutHandle title="Номер" tone="cyan" onMouseDown={(e) => startWbBlockDrag(e, 'nameSequence', 'numberXpx', 'numberYpx', wbLayoutEditor.nameSequence.numberXpx, wbLayoutEditor.nameSequence.numberYpx)} style={{ left: `${wbLayoutEditor.nameSequence.numberXpx - mmToPreviewX(8)}px`, top: `${wbLayoutEditor.nameSequence.numberYpx - ptToPreviewPx(wbLayoutEditor.nameSequence.numberFont)}px`, width: `${mmToPreviewX(16)}px`, height: `${ptToPreviewPx(wbLayoutEditor.nameSequence.numberFont) * 1.25}px` }} />
                        <WbLayoutHandle title="Имя" tone="emerald" onMouseDown={(e) => startWbBlockDrag(e, 'nameSequence', 'nameXpx', 'nameYpx', wbLayoutEditor.nameSequence.nameXpx, wbLayoutEditor.nameSequence.nameYpx)} style={{ left: `${wbLayoutEditor.nameSequence.nameXpx - mmToPreviewX(16)}px`, top: `${wbLayoutEditor.nameSequence.nameYpx - ptToPreviewPx(wbLayoutEditor.nameSequence.nameFont)}px`, width: `${mmToPreviewX(32)}px`, height: `${ptToPreviewPx(wbLayoutEditor.nameSequence.nameFont) * 1.25}px` }} />
                      </div>
                    </div>

                    {/* Макеты ФБС: под блоками настоящий PDF, блоки двигаются
                        мышью — как и у остальных макетов. */}
                    <div className={wbLayoutTemplate === 'chzTail' ? '' : 'hidden'}>
                      <div className="wb-preview-frame mx-auto rounded-2xl max-w-full bg-white relative overflow-hidden ring-1 ring-slate-200 shadow-[0_14px_40px_-16px_rgba(15,23,42,0.35)]" style={{ width: PREVIEW_BASE_W, height: PREVIEW_BASE_H }}>
                        {wbLayoutPdfPreviews.chzTail ? (
                          <iframe title="wb-layout-underlay-chzTail" src={`${wbLayoutPdfPreviews.chzTail}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`} className="pointer-events-none absolute inset-0 h-full w-full border-0" />
                        ) : null}
                        <WbLayoutHandle
                          title="Марка ЧЗ" tone="indigo"
                          onMouseDown={(e) => startWbBlockDrag(e, 'chzTail', 'dmXpx', 'dmYpx', wbLayoutEditor.chzTail.dmXpx, wbLayoutEditor.chzTail.dmYpx)}
                          style={{ left: `${wbLayoutEditor.chzTail.dmXpx}px`, top: `${wbLayoutEditor.chzTail.dmYpx}px`, width: `${mmToPreviewX(wbLayoutEditor.chzTail.dmSize)}px`, height: `${mmToPreviewY(wbLayoutEditor.chzTail.dmSize)}px` }}
                        />
                        <WbLayoutHandle
                          title="Код марки текстом" tone="slate"
                          onMouseDown={(e) => startWbBlockDrag(e, 'chzTail', 'dmXpx', 'dmTextYpx', wbLayoutEditor.chzTail.dmXpx, wbLayoutEditor.chzTail.dmTextYpx)}
                          style={{ left: `${wbLayoutEditor.chzTail.dmXpx}px`, top: `${wbLayoutEditor.chzTail.dmTextYpx - ptToPreviewPx(3.6)}px`, width: `${mmToPreviewX(wbLayoutEditor.chzTail.dmSize)}px`, height: `${ptToPreviewPx(3.6) * 3.4}px` }}
                        />
                        {/* Номер стикера — один блок на обе строки: двигать их
                            порознь незачем, а разъехавшись, они читаются как
                            два разных числа. Расстояние между ними — ползунком.
                            Цифры выровнены по правому краю, поэтому рамку
                            тянем влево от точки привязки. */}
                        <WbLayoutHandle
                          title="Номер стикера" tone="cyan"
                          onMouseDown={(e) => startWbBlockDrag(e, 'chzTail', 'tailXpx', 'tailYpx', wbLayoutEditor.chzTail.tailXpx, wbLayoutEditor.chzTail.tailYpx)}
                          style={{
                            left: `${wbLayoutEditor.chzTail.tailXpx - mmToPreviewX(18)}px`,
                            top: `${wbLayoutEditor.chzTail.tailYpx - mmToPreviewY(wbLayoutEditor.chzTail.headGap) - ptToPreviewPx(wbLayoutEditor.chzTail.headFont)}px`,
                            width: `${mmToPreviewX(18)}px`,
                            height: `${mmToPreviewY(wbLayoutEditor.chzTail.headGap) + ptToPreviewPx(wbLayoutEditor.chzTail.headFont) + ptToPreviewPx(wbLayoutEditor.chzTail.tailFont) * 0.3}px`,
                          }}
                        />
                        <WbLayoutHandle
                          title="Название" tone="emerald"
                          onMouseDown={(e) => startWbBlockDrag(e, 'chzTail', 'textXpx', 'titleYpx', wbLayoutEditor.chzTail.textXpx, wbLayoutEditor.chzTail.titleYpx)}
                          style={{ left: `${wbLayoutEditor.chzTail.textXpx}px`, top: `${wbLayoutEditor.chzTail.titleYpx - ptToPreviewPx(wbLayoutEditor.chzTail.titleFont)}px`, width: `${mmToPreviewX(29)}px`, height: `${ptToPreviewPx(wbLayoutEditor.chzTail.titleFont) * 2.4}px` }}
                        />
                        <WbLayoutHandle
                          title="Артикул и размер" tone="amber"
                          onMouseDown={(e) => startWbBlockDrag(e, 'chzTail', 'textXpx', 'dataYpx', wbLayoutEditor.chzTail.textXpx, wbLayoutEditor.chzTail.dataYpx)}
                          style={{ left: `${wbLayoutEditor.chzTail.textXpx}px`, top: `${wbLayoutEditor.chzTail.dataYpx - ptToPreviewPx(wbLayoutEditor.chzTail.textFont)}px`, width: `${mmToPreviewX(29)}px`, height: `${mmToPreviewY(wbLayoutEditor.chzTail.dataGap * 2)}px` }}
                        />
                        <WbLayoutHandle
                          title="Штрихкод товара" tone="violet"
                          onMouseDown={(e) => startWbBlockDrag(e, 'chzTail', 'barcodeXpx', 'barcodeYpx', wbLayoutEditor.chzTail.barcodeXpx, wbLayoutEditor.chzTail.barcodeYpx)}
                          style={{ left: `${wbLayoutEditor.chzTail.barcodeXpx}px`, top: `${wbLayoutEditor.chzTail.barcodeYpx}px`, width: `${mmToPreviewX(wbLayoutEditor.chzTail.barcodeW)}px`, height: `${mmToPreviewY(wbLayoutEditor.chzTail.barcodeH)}px` }}
                        />
                        <WbLayoutHandle
                          title="Цифры штрихкода" tone="rose"
                          onMouseDown={(e) => startWbBlockDrag(e, 'chzTail', 'barcodeXpx', 'barcodeTextYpx', wbLayoutEditor.chzTail.barcodeXpx, wbLayoutEditor.chzTail.barcodeTextYpx)}
                          style={{ left: `${wbLayoutEditor.chzTail.barcodeXpx}px`, top: `${wbLayoutEditor.chzTail.barcodeTextYpx - ptToPreviewPx(10.4)}px`, width: `${mmToPreviewX(wbLayoutEditor.chzTail.barcodeW)}px`, height: `${ptToPreviewPx(10.4) * 1.25}px` }}
                        />
                      </div>
                    </div>

                    <div className={wbLayoutTemplate === 'fbsCombo' ? '' : 'hidden'}>
                      <div className="wb-preview-frame mx-auto rounded-2xl max-w-full bg-white relative overflow-hidden ring-1 ring-slate-200 shadow-[0_14px_40px_-16px_rgba(15,23,42,0.35)]" style={{ width: PREVIEW_BASE_W, height: PREVIEW_BASE_H }}>
                        {wbLayoutPdfPreviews.fbsCombo ? (
                          <iframe title="wb-layout-underlay-fbsCombo" src={`${wbLayoutPdfPreviews.fbsCombo}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`} className="pointer-events-none absolute inset-0 h-full w-full border-0" />
                        ) : null}
                        <WbLayoutHandle
                          title="Марка ЧЗ" tone="indigo"
                          onMouseDown={(e) => startWbBlockDrag(e, 'fbsCombo', 'dmXpx', 'dmYpx', wbLayoutEditor.fbsCombo.dmXpx, wbLayoutEditor.fbsCombo.dmYpx)}
                          style={{ left: `${wbLayoutEditor.fbsCombo.dmXpx}px`, top: `${wbLayoutEditor.fbsCombo.dmYpx}px`, width: `${mmToPreviewX(wbLayoutEditor.fbsCombo.symbolSize)}px`, height: `${mmToPreviewY(wbLayoutEditor.fbsCombo.symbolSize)}px` }}
                        />
                        <WbLayoutHandle
                          title="QR задания" tone="cyan"
                          onMouseDown={(e) => startWbBlockDrag(e, 'fbsCombo', 'qrXpx', 'qrYpx', wbLayoutEditor.fbsCombo.qrXpx, wbLayoutEditor.fbsCombo.qrYpx)}
                          style={{ left: `${wbLayoutEditor.fbsCombo.qrXpx}px`, top: `${wbLayoutEditor.fbsCombo.qrYpx}px`, width: `${mmToPreviewX(wbLayoutEditor.fbsCombo.symbolSize)}px`, height: `${mmToPreviewY(wbLayoutEditor.fbsCombo.symbolSize)}px` }}
                        />
                        {/* Номер задания — одним блоком, обе строки вместе. */}
                        <WbLayoutHandle
                          title="Номер задания" tone="emerald"
                          onMouseDown={(e) => startWbBlockDrag(e, 'fbsCombo', 'partBXpx', 'partBYpx', wbLayoutEditor.fbsCombo.partBXpx, wbLayoutEditor.fbsCombo.partBYpx)}
                          style={{
                            left: `${wbLayoutEditor.fbsCombo.partBXpx}px`,
                            top: `${wbLayoutEditor.fbsCombo.partBYpx - mmToPreviewY(wbLayoutEditor.fbsCombo.partGap) - ptToPreviewPx(wbLayoutEditor.fbsCombo.partAFont)}px`,
                            width: `${mmToPreviewX(16)}px`,
                            height: `${mmToPreviewY(wbLayoutEditor.fbsCombo.partGap) + ptToPreviewPx(wbLayoutEditor.fbsCombo.partAFont) + ptToPreviewPx(wbLayoutEditor.fbsCombo.partBFont) * 0.3}px`,
                          }}
                        />
                        {Number(wbLayoutEditor.fbsCombo.sideQrSize || 0) > 0 && (['left', 'right'] as const).map((sideKey) => {
                          const f = wbLayoutEditor.fbsCombo;
                          const size = Number(f.sideQrSize || 0);
                          const leftPx = f.partBXpx + mmToPreviewX(sideKey === 'left' ? -Number(f.sideQrGap || 0) - size : Number(f.sideQrGap || 0));
                          const topPx = f.partBYpx + mmToPreviewY(Number(f.sideQrDy || 0) - size / 2);
                          return (
                            <WbLayoutHandle
                              key={`fbsCombo-side-${sideKey}`}
                              title={sideKey === 'left' ? 'QR слева от номера' : 'QR справа от номера'} tone="cyan"
                              onMouseDown={(e) => startWbBlockDrag(e, 'fbsCombo', 'partBXpx', 'partBYpx', f.partBXpx, f.partBYpx)}
                              style={{ left: `${leftPx}px`, top: `${topPx}px`, width: `${mmToPreviewX(size)}px`, height: `${mmToPreviewY(size)}px` }}
                            />
                          );
                        })}
                        <WbLayoutHandle
                          title="Код марки текстом" tone="rose"
                          onMouseDown={(e) => startWbBlockDrag(e, 'fbsCombo', 'codeTextXpx', 'codeTextYpx', wbLayoutEditor.fbsCombo.codeTextXpx, wbLayoutEditor.fbsCombo.codeTextYpx)}
                          style={{ left: `${wbLayoutEditor.fbsCombo.codeTextXpx}px`, top: `${wbLayoutEditor.fbsCombo.codeTextYpx - ptToPreviewPx(wbLayoutEditor.fbsCombo.codeTextFont)}px`, width: `${mmToPreviewX(wbLayoutEditor.fbsCombo.symbolSize)}px`, height: `${ptToPreviewPx(wbLayoutEditor.fbsCombo.codeTextFont) * 4}px` }}
                        />
                      </div>
                    </div>
                  </div>
                  </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm p-5 md:p-6">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900">Точный PDF-предпросмотр (1-в-1 с печатью)</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">Это реальный результат печати из того же движка. Обновляется автоматически при изменении ползунков и блоков слева.</p>
                <div className="mt-4">
                  {([
                    { key: 'withChz', label: 'С ЧЗ (QR + штрихкод)' },
                    { key: 'withoutChz', label: 'Без ЧЗ (только штрихкод)' },
                    { key: 'fboBoxes', label: 'Короба FBO' },
                    { key: 'nameSequence', label: 'Номер + имя' },
                    { key: 'chzTail', label: 'ЧЗ + конец стикера' },
                    { key: 'fbsCombo', label: 'Стикер + ЧЗ' },
                  ] as const).filter(({ key }) => key === wbLayoutTemplate).map(({ key }) => (
                    <div key={`pdfprev-${key}`}>
                      <div className="mx-auto w-[464px] max-w-full aspect-[58/40] rounded-2xl ring-1 ring-slate-200 shadow-md bg-white overflow-hidden">
                        {wbLayoutPdfPreviews[key] ? (
                          <iframe
                            title={`pdf-${key}`}
                            src={`${wbLayoutPdfPreviews[key]}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                            className="w-full h-full border-0"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-slate-400">Готовлю PDF…</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
  );
}
