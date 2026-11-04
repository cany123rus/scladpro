// Вынесено из Dashboard.tsx автоматически (ленивая загрузка раздела). Данные приходят пропсами из Dashboard.
/* eslint-disable */
import { FileSpreadsheet, X, Download, Send } from 'lucide-react';
import { Select } from '../../components/ui/Select';

export function Block_35296(props: any) {
  const { boxStock, generalAssembly, generalBoxStock, generalDeliveryRows, generalFullAvg, generalPackaging, generalReportCwRows, generalReportForm, generalReportPersonOptions, generalReportTotals, generalTempWorkerRows, handleDownloadGeneralReportExcel, handleDownloadGeneralReportPdf, sendingGeneralTelegram, setGeneralReportForm, setShowGeneralReportModal, setTelegramRecipientModalOpen, suppliers, tempTypeQty } = props;
  return (
<div className="fixed inset-0 z-[76] bg-slate-900/50 backdrop-blur-sm flex items-end md:items-center justify-center p-2 md:p-4" onClick={() => setShowGeneralReportModal(false)}>
              <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl w-[98vw] max-w-6xl max-h-[92svh] 2xl:h-[82vh] flex flex-col overflow-y-auto 2xl:overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 z-10 bg-white border-b px-4 py-4 md:px-6">
                  <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-slate-300 md:hidden" />
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-sm md:flex">
                        <FileSpreadsheet className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-lg md:text-2xl font-bold text-slate-900">Общий отчет</h2>
                        <p className="text-xs md:text-sm text-slate-500 mt-1">Временные сотрудники, доставки и выполненная работа в одном отчете.</p>
                      </div>
                    </div>
                    <button onClick={() => setShowGeneralReportModal(false)} className="p-2 rounded-lg hover:bg-slate-100" aria-label="Закрыть общий отчет">
                      <X className="h-5 w-5 text-slate-500" />
                    </button>
                  </div>
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 md:p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Поставщик</span>
                        <Select value={generalReportForm.supplier_id} onChange={(e) => setGeneralReportForm(prev => ({ ...prev, supplier_id: e.target.value }))} className="oc-input h-11 rounded-xl bg-white text-sm">
                          <option value="all">Все поставщики</option>
                          {suppliers.map((s) => <option key={`general-report-s-${s.id}`} value={String(s.id)}>{s.name}</option>)}
                        </Select>
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Исполнитель / доставщик</span>
                        <Select value={generalReportForm.person_name} onChange={(e) => setGeneralReportForm(prev => ({ ...prev, person_name: e.target.value }))} className="oc-input h-11 rounded-xl bg-white text-sm">
                          <option value="all">Все исполнители</option>
                          {generalReportPersonOptions.map((name) => <option key={`general-report-person-${name}`} value={name}>{name}</option>)}
                        </Select>
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Кто оплатил</span>
                        <Select value={generalReportForm.paid_by_supplier_id} onChange={(e) => setGeneralReportForm(prev => ({ ...prev, paid_by_supplier_id: e.target.value }))} className="oc-input h-11 rounded-xl bg-white text-sm">
                          <option value="all">Все оплаты</option>
                          {suppliers.map((s) => <option key={`general-report-paid-by-${s.id}`} value={String(s.id)}>{s.name}</option>)}
                        </Select>
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Статус оплаты</span>
                        <Select value={generalReportForm.paid_status} onChange={(e) => setGeneralReportForm(prev => ({ ...prev, paid_status: e.target.value }))} className="oc-input h-11 rounded-xl bg-white text-sm">
                          <option value="all">Все статусы</option>
                          <option value="paid">Оплачено</option>
                          <option value="unpaid">Не оплачено</option>
                        </Select>
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Дата с</span>
                        <input type="date" value={generalReportForm.start_date} onChange={(e) => setGeneralReportForm(prev => ({ ...prev, start_date: e.target.value }))} className="oc-input h-11 rounded-xl bg-white text-sm" />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Дата по</span>
                        <input type="date" value={generalReportForm.end_date} onChange={(e) => setGeneralReportForm(prev => ({ ...prev, end_date: e.target.value }))} className="oc-input h-11 rounded-xl bg-white text-sm" />
                      </label>
                      <div className="flex items-end gap-2">
                        <button type="button" onClick={handleDownloadGeneralReportPdf} className="h-11 flex-1 px-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 inline-flex items-center justify-center gap-2 whitespace-nowrap shadow-sm">
                          <Download className="h-4 w-4" /> PDF
                        </button>
                        <button type="button" onClick={handleDownloadGeneralReportExcel} className="h-11 flex-1 px-4 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 inline-flex items-center justify-center gap-2 whitespace-nowrap shadow-sm">
                          <FileSpreadsheet className="h-4 w-4" /> Excel
                        </button>
                        <button type="button" onClick={() => setTelegramRecipientModalOpen(true)} disabled={sendingGeneralTelegram} title="Отправить отчёт в Telegram" className={`h-11 w-11 shrink-0 rounded-xl inline-flex items-center justify-center shadow-sm text-white ${sendingGeneralTelegram ? 'bg-sky-300 cursor-not-allowed' : 'bg-sky-500 hover:bg-sky-600'}`}>
                          <Send className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 md:grid-cols-6 gap-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                      <div className="text-[11px] text-slate-500">Временные</div>
                      <div className="text-lg font-bold text-slate-900">{generalTempWorkerRows.length}</div>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 shadow-sm">
	                      <div className="text-[11px] text-emerald-700">ЗП временные</div>
                      <div className="text-lg font-bold text-emerald-800">{generalReportTotals.tempEarned.toFixed(2)} ₽</div>
                    </div>
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 shadow-sm">
                      <div className="text-[11px] text-blue-700">Доставки</div>
                      <div className="text-lg font-bold text-blue-800">{generalReportTotals.deliveryAmount.toFixed(2)} ₽</div>
                    </div>
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 shadow-sm">
	                      <div className="text-[11px] text-indigo-700">Постоянные сотрудники</div>
                      <div className="text-lg font-bold text-indigo-800">{generalReportTotals.cwAmount.toFixed(2)} ₽</div>
                    </div>
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 shadow-sm">
                      <div className="text-[11px] text-rose-700">Не оплачено</div>
                      <div className="text-lg font-bold text-rose-800">{(generalReportTotals.tempRemaining + generalReportTotals.deliveryUnpaid).toFixed(2)} ₽</div>
                    </div>
                    <div className="rounded-xl border border-slate-300 bg-slate-900 p-3 shadow-sm">
                      <div className="text-[11px] text-slate-200">Общий итог</div>
                      <div className="text-lg font-bold text-white">{generalReportTotals.totalAmount.toFixed(2)} ₽</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 md:p-6 space-y-4 2xl:flex-1 2xl:overflow-y-auto custom-scrollbar">
                  {/* Assembly infographic */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 shadow-sm">
                      <div className="text-[11px] text-amber-700">Собрано — временные</div>
                      <div className="text-lg font-bold text-amber-800">{generalAssembly.totalTemp.toLocaleString('ru-RU')}</div>
                    </div>
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 shadow-sm">
                      <div className="text-[11px] text-indigo-700">Собрано — сотрудники</div>
                      <div className="text-lg font-bold text-indigo-800">{generalAssembly.totalStaff.toLocaleString('ru-RU')}</div>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 shadow-sm">
                      <div className="text-[11px] text-emerald-700">Собрано — вместе</div>
                      <div className="text-lg font-bold text-emerald-800">{(generalAssembly.totalTemp + generalAssembly.totalStaff).toLocaleString('ru-RU')}</div>
                    </div>
                  </div>

                  {/* Средняя цена сборки */}
                  <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-slate-900 text-sm">Средняя цена сборки</h4>
                      <div className="text-right">
                        <div className="text-[11px] text-violet-600">За период (все поставщики)</div>
                        <div className="text-xl font-extrabold text-violet-800">{generalAssembly.avgPrice.toFixed(2)} ₽<span className="text-xs font-medium text-violet-500"> / шт.</span></div>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 mb-3">Заработок (временные + сотрудники) ÷ собранное кол-во. Доставка не учитывается. Сумма заработка: <b className="text-slate-700">{generalAssembly.totalEarn.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽</b> · кол-во: <b className="text-slate-700">{(generalAssembly.totalTemp + generalAssembly.totalStaff).toLocaleString('ru-RU')}</b></div>
                    {generalAssembly.bySupplier.filter((s) => s.total > 0).length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {generalAssembly.bySupplier.filter((s) => s.total > 0).map((s) => (
                          <div key={`asm-avg-${s.supplierId}`} className="flex items-center justify-between rounded-lg bg-white/70 border border-violet-100 px-3 py-1.5 text-sm">
                            <span className="text-slate-700 truncate" title={s.name}>{s.name}</span>
                            <span className="shrink-0 ml-2 font-semibold text-violet-800">{s.avgPrice.toFixed(2)} ₽<span className="text-[11px] font-normal text-slate-400"> ({s.total.toLocaleString('ru-RU')} шт.)</span></span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Затраты: ЗП временные + ЗП сотрудники + доставка + упаковка */}
                  {(() => {
                    const zpTemp = Number(generalReportTotals.tempEarned || 0);
                    const zpStaff = Number(generalReportTotals.cwAmount || 0);
                    const delivery = Number(generalReportTotals.deliveryAmount || 0);
                    const packaging = generalPackaging.total;
                    const sum = zpTemp + zpStaff + delivery + packaging;
                    const money = (v: number) => `${v.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽`;
                    return (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-slate-900 text-sm">Общие затраты за период</h4>
                          <div className="text-lg font-extrabold text-slate-900">{money(sum)}</div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3"><div className="text-[11px] text-emerald-700">ЗП временные</div><div className="text-base font-bold text-emerald-800">{money(zpTemp)}</div></div>
                          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3"><div className="text-[11px] text-indigo-700">ЗП сотрудники</div><div className="text-base font-bold text-indigo-800">{money(zpStaff)}</div></div>
                          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3"><div className="text-[11px] text-blue-700">Доставка</div><div className="text-base font-bold text-blue-800">{money(delivery)}</div></div>
                          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3"><div className="text-[11px] text-amber-700">Упаковка + прочее</div><div className="text-base font-bold text-amber-800">{money(packaging)}</div></div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Средняя цена сборки (полная, с учётом всех затрат) */}
                  <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-slate-900 text-sm">Средняя цена сборки (полная)</h4>
                      <div className="text-right">
                        <div className="text-[11px] text-rose-600">За период (все поставщики)</div>
                        <div className="text-xl font-extrabold text-rose-800">{generalFullAvg.avg.toFixed(2)} ₽<span className="text-xs font-medium text-rose-500"> / шт.</span></div>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 mb-3">(ЗП временные + ЗП сотрудники + доставка + закуп) ÷ собранное кол-во. Затраты: <b className="text-slate-700">{generalFullAvg.totalCost.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽</b> · кол-во: <b className="text-slate-700">{generalFullAvg.totalQty.toLocaleString('ru-RU')}</b></div>
                    {generalFullAvg.bySupplier.filter((s) => s.qty > 0).length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {generalFullAvg.bySupplier.filter((s) => s.qty > 0).map((s) => (
                          <div key={`full-avg-${s.name}`} className="flex items-center justify-between rounded-lg bg-white/70 border border-rose-100 px-3 py-1.5 text-sm">
                            <span className="text-slate-700 truncate" title={s.name}>{s.name}</span>
                            <span className="shrink-0 ml-2 font-semibold text-rose-800">{s.avg.toFixed(2)} ₽<span className="text-[11px] font-normal text-slate-400"> ({s.qty.toLocaleString('ru-RU')} шт · {s.cost.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽)</span></span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Закуп упаковки инфографика */}
                  <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-slate-900 text-sm">Закуп упаковки и прочее</h4>
                      <div className="text-right">
                        <div className="text-[11px] text-amber-600">Всего за период</div>
                        <div className="text-xl font-extrabold text-amber-800">{generalPackaging.total.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="rounded-xl border border-amber-100 bg-white/70 p-3"><div className="text-[11px] text-slate-500">Упаковка</div><div className="text-base font-bold text-amber-800">{generalPackaging.totalPack.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽</div></div>
                      <div className="rounded-xl border border-amber-100 bg-white/70 p-3"><div className="text-[11px] text-slate-500">Прочее</div><div className="text-base font-bold text-amber-800">{generalPackaging.totalOther.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽</div></div>
                    </div>
                    {generalPackaging.bySupplier.filter((s) => s.total > 0).length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {generalPackaging.bySupplier.filter((s) => s.total > 0).map((s) => (
                          <div key={`pkg-sup-${s.supplierId}`} className="flex items-center justify-between rounded-lg bg-white/70 border border-amber-100 px-3 py-1.5 text-sm">
                            <span className="text-slate-700 truncate" title={s.name}>{s.name}</span>
                            <span className="shrink-0 ml-2 font-semibold text-amber-800">{s.total.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽<span className="text-[11px] font-normal text-slate-400"> (уп {s.pack.toLocaleString('ru-RU')} · пр {s.other.toLocaleString('ru-RU')})</span></span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Коробки на складе (остаток — за всё время) */}
                  <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-slate-900 text-sm">Коробки на складе</h4>
                      <div className="text-right">
                        <div className="text-[11px] text-indigo-600">Остаток (за всё время)</div>
                        <div className={`text-xl font-extrabold ${boxStock.remaining < 0 ? 'text-rose-600' : 'text-indigo-800'}`}>{boxStock.remaining.toLocaleString('ru-RU')} шт.</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="rounded-xl border border-indigo-100 bg-white/70 p-3"><div className="text-[11px] text-slate-500">Закуплено всего</div><div className="text-base font-bold text-indigo-800">{boxStock.added.toLocaleString('ru-RU')}</div></div>
                      <div className="rounded-xl border border-indigo-100 bg-white/70 p-3"><div className="text-[11px] text-slate-500">Израсходовано всего</div><div className="text-base font-bold text-indigo-800">{boxStock.used.toLocaleString('ru-RU')}</div></div>
                      <div className="rounded-xl border border-indigo-100 bg-white/70 p-3"><div className="text-[11px] text-slate-500">Остаток</div><div className={`text-base font-bold ${boxStock.remaining < 0 ? 'text-rose-600' : 'text-indigo-800'}`}>{boxStock.remaining.toLocaleString('ru-RU')}</div></div>
                    </div>
                    {generalBoxStock.bySupplier.length > 0 && (
                      <div>
                        <div className="text-[11px] font-semibold text-slate-500 mb-1.5">Израсходовано коробок по поставщикам (за период{generalReportForm.supplier_id !== 'all' ? ', по фильтру' : ''})</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {generalBoxStock.bySupplier.map((s) => (
                            <div key={`box-sup-${s.supplierId}`} className="flex items-center justify-between rounded-lg bg-white/70 border border-indigo-100 px-3 py-1.5 text-sm">
                              <span className="text-slate-700 truncate" title={s.name}>{s.name}</span>
                              <span className="shrink-0 ml-2 font-semibold text-indigo-800">{s.used.toLocaleString('ru-RU')} шт.</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-slate-900 text-sm">Собрано по дням</h4>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="inline-flex items-center gap-1.5 text-slate-500"><span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" /> Сотрудники</span>
                        <span className="inline-flex items-center gap-1.5 text-slate-500"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Временные</span>
                      </div>
                    </div>
                    <div className="flex items-end gap-[3px] h-40 overflow-x-auto">
                      {generalAssembly.list.map(([dk, v]) => {
                        const total = v.temp + v.staff;
                        const h = Math.round((total / generalAssembly.maxDay) * 130);
                        const staffH = total > 0 ? Math.round((v.staff / total) * h) : 0;
                        const tempH = h - staffH;
                        const people = Object.entries(v.people).sort((a, b) => b[1] - a[1]);
                        const dLabel = new Date(dk + 'T12:00:00').toLocaleDateString('ru-RU');
                        const title = `${dLabel}\nВсего: ${total} (сотрудники ${v.staff}, временные ${v.temp})` + (people.length ? '\n\n' + people.map(([n, q]) => `• ${n}: ${q}`).join('\n') : '');
                        return (
                          <div key={`gr-asm-${dk}`} className="flex-1 min-w-[12px] flex flex-col items-center gap-1 rounded hover:bg-indigo-50/70 cursor-default" title={title}>
                            <div className="w-full flex flex-col justify-end h-[130px]">
                              {total > 0 && (<>
                                <div className="w-full bg-emerald-500 rounded-t-sm" style={{ height: `${tempH}px` }} />
                                <div className="w-full bg-indigo-500" style={{ height: `${staffH}px` }} />
                              </>)}
                            </div>
                            <span className="text-[8px] text-slate-400">{dk.slice(8, 10)}</span>
                          </div>
                        );
                      })}
                    </div>
                    {/* Supplier breakdown under chart */}
                    {generalAssembly.bySupplier.length > 0 && (
                      <div className="mt-4 border-t border-slate-100 pt-3">
                        <div className="text-xs font-semibold text-slate-500 mb-2">Собрано по поставщикам</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {generalAssembly.bySupplier.map((s) => (
                            <div key={`asm-sup-${s.supplierId}`} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-sm">
                              <span className="text-slate-700 truncate">{s.name}</span>
                              <span className="font-semibold text-slate-900 shrink-0 ml-2">{s.total.toLocaleString('ru-RU')} <span className="text-[11px] text-slate-400">(с {s.staff} · в {s.temp})</span></span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
                    <div className="bg-slate-50 px-4 py-3 font-bold text-slate-900">Отчет по временным сотрудникам</div>
                    {generalTempWorkerRows.length === 0 ? (
                      <div className="p-4 text-sm text-slate-500">Нет данных</div>
                    ) : (
                      <table className="w-full text-left text-sm">
                        <thead className="bg-white border-b border-slate-100">
                          <tr>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Дата</th>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Сотрудник</th>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Поставщик</th>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Тип/Кол-во</th>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Часы</th>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Заработано</th>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Кто оплатил</th>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Не оплачено</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {generalTempWorkerRows.slice(0, 80).map((row: any) => (
                            <tr key={`general-temp-${row.id}`}>
                              <td className="px-4 py-2 whitespace-nowrap">{row?.date ? new Date(String(row.date) + 'T12:00:00').toLocaleDateString('ru-RU') : '—'}</td>
                              <td className="px-4 py-2 font-medium">{row.worker_name || row.worker || 'Без имени'}</td>
                              <td className="px-4 py-2">{row.supplierName || '-'}</td>
                              <td className="px-4 py-2 max-w-[320px] truncate">{tempTypeQty(row)}</td>
                              <td className="px-4 py-2">{Number(row.hours || 0).toFixed(2)}</td>
                              <td className="px-4 py-2 text-emerald-700 font-semibold">{Number(row.earnings || 0).toFixed(2)} ₽</td>
                              <td className="px-4 py-2 text-slate-600 max-w-[260px] truncate" title={row.paidByText || ''}>{row.paidByText || '—'}</td>
                              <td className="px-4 py-2 text-rose-700">{Number(row.remainingAmount || 0).toFixed(2)} ₽</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
                    <div className="bg-slate-50 px-4 py-3 font-bold text-slate-900">Отчет по доставке</div>
                    {generalDeliveryRows.length === 0 ? (
                      <div className="p-4 text-sm text-slate-500">Нет данных</div>
                    ) : (
                      <table className="w-full text-left text-sm">
                        <thead className="bg-white border-b border-slate-100">
                          <tr>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Дата</th>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Доставщик</th>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Поставщик</th>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Коробки</th>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Сумма</th>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Статус</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {generalDeliveryRows.slice(0, 80).map((row: any, idx: number) => (
                            <tr key={`general-delivery-${row.deliveryId}-${idx}`}>
                              <td className="px-4 py-2 whitespace-nowrap">{row?.date ? new Date(String(row.date) + 'T12:00:00').toLocaleDateString('ru-RU') : '—'}</td>
                              <td className="px-4 py-2 font-medium">{row.courier || '-'}</td>
                              <td className="px-4 py-2">{row.supplierName || '-'}</td>
                              <td className="px-4 py-2">{Number(row.boxes || 0)}</td>
                              <td className="px-4 py-2 font-semibold">{Number(row.amount || 0).toFixed(2)} ₽</td>
                              <td className={`px-4 py-2 font-semibold ${row.is_paid ? 'text-emerald-700' : 'text-rose-700'}`}>{row.is_paid ? 'Оплачено' : 'Не оплачено'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
                    <div className="bg-slate-50 px-4 py-3 font-bold text-slate-900">Отчет по выполненной работе</div>
                    {generalReportCwRows.length === 0 ? (
                      <div className="p-4 text-sm text-slate-500">Нет данных</div>
                    ) : (
                      <table className="w-full text-left text-sm">
                        <thead className="bg-white border-b border-slate-100">
                          <tr>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Дата</th>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Сотрудник</th>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Поставщик</th>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Вид работы</th>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Кол-во</th>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Сумма</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {generalReportCwRows.slice(0, 80).map((row: any, idx: number) => (
                            <tr key={`general-cw-${idx}`}>
                              <td className="px-4 py-2 whitespace-nowrap">{row?.date ? new Date(String(row.date) + 'T12:00:00').toLocaleDateString('ru-RU') : '—'}</td>
                              <td className="px-4 py-2 font-medium">{row.employee_name || '-'}</td>
                              <td className="px-4 py-2">{row.supplier_name || '-'}</td>
                              <td className="px-4 py-2">{row.work_name || '-'}</td>
                              <td className="px-4 py-2">{Number(row.quantity || 0)}</td>
                              <td className="px-4 py-2 text-indigo-700 font-semibold">{Number(row.total || 0).toFixed(2)} ₽</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>
  );
}
