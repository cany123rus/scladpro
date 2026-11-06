// Вынесено из Dashboard.tsx автоматически (ленивая загрузка раздела). Данные приходят пропсами из Dashboard.
/* eslint-disable */
import { ReportsSection } from '../dashboardComponents';
import { FileText, TrendingUp, X, Package, Wallet, FileSpreadsheet, Box, BarChart2 } from 'lucide-react';

export function Tab_reports(props: any) {
  const { assemblyDaily, loadReportsDayDetail, loadReportsSummary, loadingReports, reportsBySupAllTime, reportsBySupplier, reportsDayArw, reportsDayDetail, reportsDayFull, reportsDayLoading, reportsDayRows, reportsDaySortBtn, reportsSummary, reportsSummaryLoading, reportsSummaryRange, setReportsBySupAllTime, setReportsDayDetail, setReportsDayFull, setReportsSummaryRange, ymdLocalDate } = props;
  return (
<ReportsSection>
            <div className="max-w-7xl mx-auto">
              <div className="mb-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 p-6 shadow-xl border border-white/10 flex items-center gap-4">
                <div className="bg-white/10 ring-1 ring-white/20 p-3 rounded-2xl backdrop-blur">
                  <FileText className="h-7 w-7 text-indigo-200" />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-white tracking-tight">Отчеты</h1>
                  <p className="text-indigo-200/80 mt-0.5 text-sm">Статистика, выплаты и сводка по поставщикам</p>
                </div>
              </div>

              {/* ===== Сводная статистика за период ===== */}
              {(() => {
                const s = reportsSummary;
                const money = (v: number) => `${Math.round(Number(v || 0)).toLocaleString('ru-RU')} ₽`;
                const togetherQty = s ? s.temp + s.staff : 0;
                const costs = s ? [
                  { label: 'ЗП временные', value: s.zpTemp, color: 'bg-emerald-500', text: 'text-emerald-700' },
                  { label: 'ЗП сотрудники', value: s.zpStaff, color: 'bg-indigo-500', text: 'text-indigo-700' },
                  { label: 'Доставки', value: s.delivery, color: 'bg-blue-500', text: 'text-blue-700' },
                  { label: 'Закуп упаковки/прочее', value: s.packaging, color: 'bg-amber-500', text: 'text-amber-700' },
                ] : [];
                const costTotal = costs.reduce((a, c) => a + c.value, 0);
                const avgAssembly = togetherQty > 0 ? (s!.zpTemp + s!.zpStaff) / togetherQty : 0;
                const avgFull = togetherQty > 0 ? costTotal / togetherQty : 0;
                return (
                <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-violet-50 rounded-xl"><TrendingUp className="h-5 w-5 text-violet-600" /></div>
                      <h3 className="text-lg font-bold text-slate-900">Сводная статистика за период</h3>
                    </div>
                    <div className="flex flex-wrap items-end gap-2">
                      {([['7 дней', 7], ['30 дней', 30], ['90 дней', 90]] as [string, number][]).map(([lbl, days]) => {
                        const end = new Date(); const st = new Date(); st.setDate(st.getDate() - (days - 1));
                        const sStr = ymdLocalDate(st); const eStr = ymdLocalDate(end);
                        const active = reportsSummaryRange.start === sStr && reportsSummaryRange.end === eStr;
                        return (
                          <button key={lbl} onClick={() => { setReportsSummaryRange({ start: sStr, end: eStr }); loadReportsSummary(sStr, eStr); }} className={`h-11 px-3 rounded-xl text-sm font-semibold border transition-colors ${active ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{lbl}</button>
                        );
                      })}
                      {(() => {
                        const allStart = '2020-01-01';
                        const eStr = ymdLocalDate(new Date());
                        const active = reportsSummaryRange.start === allStart;
                        return (
                          <button onClick={() => { setReportsSummaryRange({ start: allStart, end: eStr }); loadReportsSummary(allStart, eStr); setReportsBySupAllTime(true); }} className={`h-11 px-3 rounded-xl text-sm font-semibold border transition-colors ${active ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>За всё время</button>
                        );
                      })()}
                      <div><label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">С</label><input type="date" value={reportsSummaryRange.start} onChange={(e) => setReportsSummaryRange((p) => ({ ...p, start: e.target.value }))} className="oc-input" /></div>
                      <div><label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">По</label><input type="date" value={reportsSummaryRange.end} onChange={(e) => setReportsSummaryRange((p) => ({ ...p, end: e.target.value }))} className="oc-input" /></div>
                      <button onClick={() => loadReportsSummary(reportsSummaryRange.start, reportsSummaryRange.end)} disabled={reportsSummaryLoading} className="h-11 px-4 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 disabled:opacity-50">{reportsSummaryLoading ? '…' : 'Обновить'}</button>
                    </div>
                  </div>

                  {!s ? (
                    <div className="py-8 text-center text-slate-400">{reportsSummaryLoading ? 'Загрузка…' : 'Нет данных'}</div>
                  ) : (
                  <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Cost structure */}
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-slate-800 text-sm">Структура затрат</h4>
                        <span className="text-sm font-extrabold text-slate-900">{money(costTotal)}</span>
                      </div>
                      <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 mb-3">
                        {costs.map((c) => costTotal > 0 && c.value > 0 && (
                          <div key={c.label} className={c.color} style={{ width: `${(c.value / costTotal) * 100}%` }} title={`${c.label}: ${money(c.value)}`} />
                        ))}
                      </div>
                      <div className="space-y-1.5">
                        {costs.map((c) => (
                          <div key={c.label} className="flex items-center justify-between text-sm">
                            <span className="inline-flex items-center gap-2 text-slate-600"><span className={`h-2.5 w-2.5 rounded-sm ${c.color}`} />{c.label}</span>
                            <span className={`font-semibold ${c.text}`}>{money(c.value)} <span className="text-[11px] text-slate-400">{costTotal > 0 ? `${Math.round((c.value / costTotal) * 100)}%` : ''}</span></span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-slate-50 p-2.5"><div className="text-[11px] text-slate-500">Ср. цена сборки</div><div className="text-base font-bold text-slate-900">{avgAssembly.toFixed(2)} ₽/шт</div><div className="text-[10px] text-slate-400">ЗП ÷ собрано, без доставки</div></div>
                        <div className="rounded-xl bg-slate-50 p-2.5"><div className="text-[11px] text-slate-500">Ср. цена (полная)</div><div className="text-base font-bold text-slate-900">{avgFull.toFixed(2)} ₽/шт</div><div className="text-[10px] text-slate-400">ЗП+доставка+закуп ÷ собрано</div></div>
                      </div>
                    </div>

                    {/* Daily assembly chart for the period */}
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-slate-800 text-sm">Собрано по дням</h4>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-[11px] text-slate-400">нажми на день</span>
                          <span className="inline-flex items-center gap-1.5 text-slate-500"><span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" /> сотр.</span>
                          <span className="inline-flex items-center gap-1.5 text-slate-500"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> врем.</span>
                        </div>
                      </div>
                      <div className="flex items-end gap-[2px] h-44 overflow-x-auto">
                        {s.daily.map(([dk, v]) => {
                          const total = v.temp + v.staff;
                          const h = Math.round((total / s.maxDay) * 150);
                          const staffH = total > 0 ? Math.round((v.staff / total) * h) : 0;
                          const tempH = h - staffH;
                          const selected = reportsDayDetail?.date === dk;
                          return (
                            <button type="button" key={`rs-${dk}`} onClick={() => loadReportsDayDetail(dk)} className={`flex-1 min-w-[10px] flex flex-col items-center gap-1 rounded-md px-0.5 transition-colors ${selected ? 'bg-indigo-100' : 'hover:bg-indigo-50'}`} title={`${new Date(dk + 'T12:00:00').toLocaleDateString('ru-RU')}: всего ${total} (сотр ${v.staff}, врем ${v.temp}) — нажми для детализации`}>
                              <div className="w-full flex flex-col justify-end h-[150px]">
                                {total > 0 && (<>
                                  <div className="w-full bg-emerald-500 rounded-t-sm" style={{ height: `${tempH}px` }} />
                                  <div className="w-full bg-indigo-500" style={{ height: `${staffH}px` }} />
                                </>)}
                              </div>
                              <span className={`text-[8px] ${selected ? 'text-indigo-700 font-bold' : 'text-slate-400'}`}>{dk.slice(8, 10)}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Day detail */}
                  {reportsDayDetail && (
                    <div className="mt-5 rounded-2xl border border-indigo-200 bg-white overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                        <h4 className="font-bold text-slate-900 text-sm">Детализация за {new Date(reportsDayDetail.date + 'T12:00:00').toLocaleDateString('ru-RU')}</h4>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-500">Всего: <b className="text-slate-900">{reportsDayDetail.total.toLocaleString('ru-RU')}</b></span>
                          <button onClick={() => setReportsDayDetail(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="h-4 w-4 text-slate-500" /></button>
                        </div>
                      </div>
                      {reportsDayLoading ? (
                        <div className="px-4 py-6 text-center text-slate-400 text-sm">Загрузка…</div>
                      ) : reportsDayDetail.rows.length === 0 ? (
                        <div className="px-4 py-6 text-center text-slate-400 text-sm">В этот день сборки не было</div>
                      ) : (
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                            <tr><th className="px-4 py-2">Сотрудник</th><th className="px-4 py-2">Категория</th><th className="px-4 py-2">Тип работы</th><th className="px-4 py-2 text-right">Количество</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {reportsDayDetail.rows.map((r, i) => (
                              <tr key={`rdd-${i}`} className="hover:bg-slate-50">
                                <td className="px-4 py-2 font-medium text-slate-800">{r.who}</td>
                                <td className="px-4 py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${r.kind === 'Временный' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>{r.kind}</span></td>
                                <td className="px-4 py-2 text-slate-600">{r.type}</td>
                                <td className="px-4 py-2 text-right font-bold text-slate-900">{r.qty.toLocaleString('ru-RU')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                  </>
                  )}
                </div>
                );
              })()}

              {loadingReports ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[0,1,2].map((i) => (
                      <div key={i} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse">
                        <div className="h-10 w-10 rounded-2xl bg-slate-100 mb-4" />
                        <div className="h-8 w-32 bg-slate-100 rounded mb-2" />
                        <div className="h-3 w-40 bg-slate-100 rounded" />
                      </div>
                    ))}
                  </div>
                  <div className="h-40 rounded-3xl border border-slate-200 bg-white shadow-sm animate-pulse" />
                </div>
              ) : (
                <div className="space-y-6">
                  {(() => {
                    const s = reportsSummary;
                    const qty = s ? s.temp + s.staff : 0;
                    const zp = s ? s.zpTemp + s.zpStaff : 0;
                    const cost = s ? zp + s.delivery + s.packaging : 0;
                    const avgFull = qty > 0 ? cost / qty : 0;
                    const money = (v: number) => `${Math.round(Number(v || 0)).toLocaleString('ru-RU')} ₽`;
                    const periodNote = `${reportsSummaryRange.start} — ${reportsSummaryRange.end}`;
                    return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Собрано всего */}
                    <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5">
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-slate-500">Собрано товаров</span>
                        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl shadow-sm"><Package className="h-5 w-5 text-white" /></div>
                      </div>
                      <div className="text-3xl font-extrabold text-slate-900">{Number(qty).toLocaleString('ru-RU')} <span className="text-base font-semibold text-slate-400">шт</span></div>
                      <p className="text-xs text-slate-400 mt-1">{periodNote} · ФБО/ФБС + сотрудники</p>
                    </div>

                    {/* Затраты всего */}
                    <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5">
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-slate-500">Затраты всего</span>
                        <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl shadow-sm"><Wallet className="h-5 w-5 text-white" /></div>
                      </div>
                      <div className="text-3xl font-extrabold text-slate-900">{money(cost)}</div>
                      <p className="text-xs text-slate-400 mt-1">ЗП {money(zp)} · доставка {money(s?.delivery || 0)} · закуп {money(s?.packaging || 0)}</p>
                    </div>

                    {/* Средняя цена сборки (полная) */}
                    <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5">
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-fuchsia-500 to-purple-500" />
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-slate-500">Ср. цена сборки (полная)</span>
                        <div className="p-2.5 bg-gradient-to-br from-fuchsia-500 to-purple-500 rounded-2xl shadow-sm"><FileSpreadsheet className="h-5 w-5 text-white" /></div>
                      </div>
                      <div className="text-3xl font-extrabold text-slate-900">{avgFull.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽<span className="text-base font-semibold text-slate-400">/шт</span></div>
                      <p className="text-xs text-slate-400 mt-1">(ЗП+доставка+закуп) ÷ собрано · за период</p>
                    </div>
                  </div>
                    );
                  })()}

                  {/* Assembly infographic cards (за период) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
                      <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-slate-500">Собрано — временные</span><div className="p-2 bg-amber-50 rounded-xl"><Box className="h-5 w-5 text-amber-600" /></div></div>
                      <div className="text-3xl font-extrabold text-amber-600">{(reportsSummary?.temp || 0).toLocaleString('ru-RU')}</div>
                      <p className="text-xs text-slate-400 mt-1">ФБО/ФБС · за период</p>
                    </div>
                    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
                      <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-slate-500">Собрано — сотрудники</span><div className="p-2 bg-indigo-50 rounded-xl"><Box className="h-5 w-5 text-indigo-600" /></div></div>
                      <div className="text-3xl font-extrabold text-indigo-600">{(reportsSummary?.staff || 0).toLocaleString('ru-RU')}</div>
                      <p className="text-xs text-slate-400 mt-1">кроме повременных/ПИК · за период</p>
                    </div>
                    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                      <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-slate-500">Ср. цена сборки</span><div className="p-2 bg-emerald-50 rounded-xl"><Box className="h-5 w-5 text-emerald-600" /></div></div>
                      <div className="text-3xl font-extrabold text-emerald-600">{(() => { const q = (reportsSummary?.temp || 0) + (reportsSummary?.staff || 0); const zp = (reportsSummary?.zpTemp || 0) + (reportsSummary?.zpStaff || 0); return (q > 0 ? zp / q : 0).toFixed(2); })()} ₽<span className="text-base font-semibold text-slate-400">/шт</span></div>
                      <p className="text-xs text-slate-400 mt-1">ЗП временные + сотрудники ÷ собрано · за период</p>
                    </div>
                  </div>

                  {/* Assembly daily chart */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-amber-50 rounded-xl"><Box className="h-5 w-5 text-amber-600" /></div>
                        <h3 className="text-lg font-bold text-slate-900">Собрано по дням (30 дней)</h3>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-[11px] text-slate-400">нажми на день</span>
                        <span className="inline-flex items-center gap-1.5 text-slate-500"><span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" /> Сотрудники: <b className="text-slate-700">{assemblyDaily.totalStaff.toLocaleString('ru-RU')}</b></span>
                        <span className="inline-flex items-center gap-1.5 text-slate-500"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Временные: <b className="text-slate-700">{assemblyDaily.totalTemp.toLocaleString('ru-RU')}</b></span>
                      </div>
                    </div>
                    <div className="flex items-end gap-[3px] h-56 pt-4 overflow-x-auto">
                      {assemblyDaily.list.map(([dk, v]) => {
                        const total = v.temp + v.staff;
                        const h = Math.round((total / assemblyDaily.maxDay) * 190);
                        const staffH = total > 0 ? Math.round((v.staff / total) * h) : 0;
                        const tempH = h - staffH;
                        const people = Object.entries(v.people).sort((a, b) => b[1] - a[1]);
                        const dLabel = new Date(dk + 'T12:00:00').toLocaleDateString('ru-RU');
                        const title = `${dLabel}\nВсего: ${total} (сотрудники ${v.staff}, временные ${v.temp})` + (people.length ? '\n\nКто собрал:\n' + people.map(([n, q]) => `• ${n}: ${q}`).join('\n') : '\nНет сборки');
                        const selected = reportsDayDetail?.date === dk;
                        return (
                          <button type="button" key={`asm-${dk}`} onClick={() => loadReportsDayDetail(dk)} className={`flex-1 min-w-[14px] flex flex-col items-center gap-1 rounded-md px-0.5 transition-colors ${selected ? 'bg-indigo-100' : 'hover:bg-indigo-50/70'}`} title={title + '\n\n(нажми для детализации)'}>
                            <div className="w-full flex flex-col justify-end h-[190px]">
                              {total > 0 && (<>
                                <div className="w-full bg-emerald-500 rounded-t-sm transition-all hover:brightness-95" style={{ height: `${tempH}px` }} />
                                <div className="w-full bg-indigo-500 transition-all hover:brightness-110" style={{ height: `${staffH}px` }} />
                              </>)}
                            </div>
                            <span className={`text-[9px] ${selected ? 'text-indigo-700 font-bold' : 'text-slate-400'}`}>{dk.slice(8, 10)}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Day detail (click on a bar above) */}
                    {reportsDayDetail && (
                      <div className="mt-5 rounded-2xl border border-indigo-200 bg-white overflow-hidden">
                        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
                          <h4 className="font-bold text-slate-900 text-sm">Детализация за {new Date(reportsDayDetail.date + 'T12:00:00').toLocaleDateString('ru-RU')}</h4>
                          <div className="flex items-center gap-3">
                            <label className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                              <input type="checkbox" checked={reportsDayFull} onChange={(e) => setReportsDayFull(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                              Полная детализация
                            </label>
                            <span className="text-sm text-slate-500">Всего: <b className="text-slate-900">{reportsDayDetail.total.toLocaleString('ru-RU')}</b></span>
                            <button onClick={() => setReportsDayDetail(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="h-4 w-4 text-slate-500" /></button>
                          </div>
                        </div>
                        {reportsDayLoading ? (
                          <div className="px-4 py-6 text-center text-slate-400 text-sm">Загрузка…</div>
                        ) : reportsDayDetail.rows.length === 0 ? (
                          <div className="px-4 py-6 text-center text-slate-400 text-sm">В этот день сборки не было</div>
                        ) : (
                          <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase select-none">
                              <tr>
                                <th className="px-4 py-2 cursor-pointer hover:text-slate-700" onClick={reportsDaySortBtn('who')}>Сотрудник{reportsDayArw('who')}</th>
                                <th className="px-4 py-2">Категория</th>
                                {reportsDayFull && <th className="px-4 py-2">Поставщик</th>}
                                <th className="px-4 py-2 cursor-pointer hover:text-slate-700" onClick={reportsDaySortBtn('type')}>Тип работы{reportsDayArw('type')}</th>
                                {reportsDayFull && <th className="px-4 py-2 text-right cursor-pointer hover:text-slate-700" onClick={reportsDaySortBtn('hours')}>Часы{reportsDayArw('hours')}</th>}
                                <th className="px-4 py-2 text-right cursor-pointer hover:text-slate-700" onClick={reportsDaySortBtn('qty')}>Количество{reportsDayArw('qty')}</th>
                                {reportsDayFull && <th className="px-4 py-2 text-right cursor-pointer hover:text-slate-700" onClick={reportsDaySortBtn('earnings')}>Заработок{reportsDayArw('earnings')}</th>}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {reportsDayRows.map((r, i) => (
                                <tr key={`rdd2-${i}`} className="hover:bg-slate-50">
                                  <td className="px-4 py-2 font-medium text-slate-800">{r.who}</td>
                                  <td className="px-4 py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${r.kind === 'Временный' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>{r.kind}</span></td>
                                  {reportsDayFull && <td className="px-4 py-2 text-slate-600">{r.supplier}</td>}
                                  <td className="px-4 py-2 text-slate-600">{r.type}</td>
                                  {reportsDayFull && <td className="px-4 py-2 text-right text-slate-600">{r.hours ? `${r.hours} ч.` : '—'}</td>}
                                  <td className="px-4 py-2 text-right font-bold text-slate-900">{r.qty.toLocaleString('ru-RU')}</td>
                                  {reportsDayFull && <td className="px-4 py-2 text-right font-semibold text-green-600">{r.earnings ? `${r.earnings.toLocaleString('ru-RU')} ₽` : '—'}</td>}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Сводная статистика по поставщикам (за всё время) */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <div className="p-2 bg-violet-50 rounded-xl"><BarChart2 className="h-5 w-5 text-violet-600" /></div>
                      <h3 className="text-lg font-bold text-slate-900">Сводная статистика по поставщикам</h3>
                      <span className="text-xs text-slate-400">{reportsBySupAllTime ? 'за всё время' : `${reportsSummaryRange.start} — ${reportsSummaryRange.end}`}</span>
                      <div className="ml-auto inline-flex rounded-xl border border-slate-200 overflow-hidden">
                        <button onClick={() => setReportsBySupAllTime(false)} className={`px-3 py-1.5 text-xs font-semibold transition-colors ${!reportsBySupAllTime ? 'bg-violet-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>За период</button>
                        <button onClick={() => setReportsBySupAllTime(true)} className={`px-3 py-1.5 text-xs font-semibold transition-colors ${reportsBySupAllTime ? 'bg-violet-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>За всё время</button>
                      </div>
                    </div>
                    {reportsBySupplier.rows.length === 0 ? (
                      <div className="py-8 text-center text-slate-400">Нет данных</div>
                    ) : (() => {
                      const money = (v: number) => `${Math.round(Number(v || 0)).toLocaleString('ru-RU')} ₽`;
                      const maxQty = Math.max(1, ...reportsBySupplier.rows.map((r) => r.qty));
                      const t = reportsBySupplier.totals;
                      return (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[760px]">
                          <thead>
                            <tr className="bg-slate-50 border-y border-slate-100 text-xs uppercase text-slate-500">
                              <th className="px-4 py-2.5 font-semibold">Поставщик</th>
                              <th className="px-4 py-2.5 font-semibold">Собрано</th>
                              <th className="px-4 py-2.5 font-semibold text-right">ЗП врем.</th>
                              <th className="px-4 py-2.5 font-semibold text-right">ЗП сотр.</th>
                              <th className="px-4 py-2.5 font-semibold text-right">Доставка</th>
                              <th className="px-4 py-2.5 font-semibold text-right">Закуп</th>
                              <th className="px-4 py-2.5 font-semibold text-right">Ср.цена/шт</th>
                              <th className="px-4 py-2.5 font-semibold text-right">Итого</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {reportsBySupplier.rows.map((r) => (
                              <tr key={`rbs-${r.supplierId}`} className="hover:bg-slate-50">
                                <td className="px-4 py-2.5 font-medium text-slate-800 max-w-[200px] truncate" title={r.name}>{r.name}</td>
                                <td className="px-4 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 w-14">{r.qty.toLocaleString('ru-RU')}</span>
                                    <span className="h-2 rounded-full bg-indigo-400" style={{ width: `${Math.max(4, (r.qty / maxQty) * 90)}px` }} />
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 text-right text-emerald-700">{money(r.zpTemp)}</td>
                                <td className="px-4 py-2.5 text-right text-indigo-700">{money(r.zpStaff)}</td>
                                <td className="px-4 py-2.5 text-right text-blue-700">{money(r.delivery)}</td>
                                <td className="px-4 py-2.5 text-right text-amber-700">{money(r.packaging)}</td>
                                <td className="px-4 py-2.5 text-right font-semibold text-fuchsia-700">{r.avgFull.toFixed(2)} ₽</td>
                                <td className="px-4 py-2.5 text-right font-bold text-slate-900">{money(r.cost)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                              <td className="px-4 py-2.5">Итого</td>
                              <td className="px-4 py-2.5">{t.qty.toLocaleString('ru-RU')}</td>
                              <td className="px-4 py-2.5 text-right">{money(t.zpTemp)}</td>
                              <td className="px-4 py-2.5 text-right">{money(t.zpStaff)}</td>
                              <td className="px-4 py-2.5 text-right">{money(t.delivery)}</td>
                              <td className="px-4 py-2.5 text-right">{money(t.packaging)}</td>
                              <td className="px-4 py-2.5 text-right">{t.qty > 0 ? (t.cost / t.qty).toFixed(2) : '0'} ₽</td>
                              <td className="px-4 py-2.5 text-right">{money(t.cost)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                      );
                    })()}
                  </div>

                </div>
              )}
            </div>
            </ReportsSection>
  );
}
