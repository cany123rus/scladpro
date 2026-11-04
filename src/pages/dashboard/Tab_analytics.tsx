// Вынесено из Dashboard.tsx автоматически (ленивая загрузка раздела). Данные приходят пропсами из Dashboard.
/* eslint-disable */
import { BarChart2, Upload, Trash2 } from 'lucide-react';
import { Select } from '../../components/ui/Select';
import { ExcelUploader } from '../dashboardComponents';
import { supabase } from '../../lib/supabase';
import { confirmDialog } from '../../components/ConfirmDialog';
import React from 'react';
import { IMPORT_CATEGORIES, IMPORT_COUNTRIES, wbBaseLogistics, CalcSection, CalcField, CalcInput, CalcRow, buildReconciledSizeRows, SalesMap } from '../Dashboard';
import { compareSizes } from '../../utils/sizeOrder';

export function Tab_analytics(props: any) {
  const { ANY_SUPPLIER_ID, MAX_UPLOAD_ROWS, TURBO_MODE_ROWS, adsAnalyticsFileName, adsApiCampSort, adsApiData, adsApiError, adsApiFrom, adsApiKwData, adsApiKwFilter, adsApiKwFor, adsApiKwLoading, adsApiKwNote, adsApiKwSort, adsApiLastSync, adsApiLoading, adsApiPreset, adsApiSupplierId, adsApiSyncing, adsApiTo, adsByNm, adsByNmSorted, adsKpi, adsKwArw, adsKwSearch, adsKwSortBtn, adsKwView, adsNmArw, adsNmSortBtn, adsViz, analyticsSubTab, buildDayRangeReport, calcAdsPctOsno, calcAdsPctUsn, calcAssembly, calcCargoPerKg, calcCommissionPct, calcDeliveryToWb, calcFastWithdraw, calcFastWithdrawPct, calcHideObnal, calcItems, calcNoVatRefund, calcPickerOpen, calcSaveModal, calcSavedProducts, calcSettingsSaving, calcTargetMargin, calcUsnCashExpense, calcUsnRate, cbrDate, cbrLoading, cbrRates, compareReportId, compareSummary, createUploadedReportShareLink, deleteUploadedHistoryItem, deleteUploadedHistoryMany, deleteUploadedRawHistoryItem, deleteUploadedRawHistoryMany, deleteUploadedShareLink, disableUploadedShareLink, downloadUploadedRawSourceFile, downloadWbApiReport, enrichUploadedPhotosByApi, exportUploadedReportAnalyticsExcel, geoView, getCurrentUploadedTaxRate, getUploadedAvgProfitAfterTax, getUploadedCostValue, getUploadedHeadlineProfitNet, getUploadedPhoto, getUploadedPhotoCandidates, getUploadedProfitAfterTax, getUploadedRowProfitAfterTaxes, getUploadedTaxValue, handleAdsExcelUpload, handleUploadCostFile, importWbApiReport, isUploadedColVisible, loadAdsApiData, loadAdsApiKeywords, loadCalcSavedProducts, loadCbrRates, loadCompareSummary, loadUploadedReportHistory, loadWbApiReports, logProductFilter, makeCalcItem, manualWeekModal, mskTodayYmd, openUploadedCostEditor, openUploadedHistoryItem, openUploadedHistoryMonth, openUploadedHistorySelected, openUploadedRawHistoryItem, openUploadedRawHistoryMonth, persistCalcSavedProducts, processUploadedWbReport, rawRecomputeBusy, rawSel, recomputeAllRawHistory, recomputeProfitsBusy, recomputeRawHistoryItem, recomputeUploadedProfits, renderedUploadedAnalyticsRows, reportNetProfit, saveCalcSettings, saveUploadedRawReportHistory, saveUploadedReportHistory, scanWbApiWeeks, setAdsApiCampSort, setAdsApiFrom, setAdsApiKwFilter, setAdsApiKwFor, setAdsApiKwSort, setAdsApiSupplierId, setAdsApiTo, setAdsKwSearch, setAnalyticsSubTab, setCalcAdsPctOsno, setCalcAdsPctUsn, setCalcAssembly, setCalcCargoPerKg, setCalcCommissionPct, setCalcDeliveryToWb, setCalcFastWithdraw, setCalcFastWithdrawPct, setCalcHideObnal, setCalcItems, setCalcNoVatRefund, setCalcPickerOpen, setCalcSaveModal, setCalcSavedProducts, setCalcTargetMargin, setCalcUsnCashExpense, setCalcUsnRate, setGeoView, setLogProductFilter, setManualWeekModal, setRawRecomputeBusy, setRawSel, setSummaryExpanded, setSummaryProdSort, setSummaryProfitFilter, setSummarySizeSort, setUploadedAcquiringVat, setUploadedCheckDuplicates, setUploadedExpandedNames, setUploadedExtraCosts, setUploadedFilterMetricSearch, setUploadedFilterNameSearch, setUploadedFilterOpen, setUploadedHistoryCollapsedMonths, setUploadedHistoryPickerOpen, setUploadedHistoryRange, setUploadedHistorySelectedIds, setUploadedHistoryYear, setUploadedPhotoPreview, setUploadedRawHistoryCollapsedMonths, setUploadedRawHistoryPickerOpen, setUploadedRawHistoryYear, setUploadedReportSummary, setUploadedSearch, setUploadedSelectedNameCodes, setUploadedSelectedNames, setUploadedSelectedSupplierId, setUploadedShareHistoryOpen, setUploadedSizeDetailsOpen, setUploadedSizeSortByRow, setUploadedSortDir, setUploadedSortKey, setUploadedTaxRateOverride, setUploadedTurboMode, setUploadedVatCostIncluded, setUploadedVatMode, setUploadedVatSalesIncluded, setUploadedViewTab, setUploadedVisibleCols, setWbApiCollapsed, setWbApiPickerOpen, setWbApiYear, setWbBase1L, setWbBuyoutPct, setWbExtraL, setWbLocalIndex, setWbStorageCoef, setWbStorageDays, setWbStorageTariff, setWbTariffsOpen, setWbTiers, setWbWarehouseCoef, showToast, sortedFilteredUploadedAnalytics, summaryExpanded, summaryProdSort, summaryProfitFilter, summarySizeSort, suppliers, syncAdsApiNow, uploadBatchRef, uploadedAcquiringVat, uploadedAnalyticsSuppliers, uploadedCheckDuplicates, uploadedExpandedNames, uploadedExtraCosts, uploadedFailedPhotoUrlsRef, uploadedFilterMetricSearch, uploadedFilterNameSearch, uploadedFilterOpen, uploadedHistory, uploadedHistoryCollapsedMonths, uploadedHistoryGrouped, uploadedHistoryLoading, uploadedHistoryMonthNames, uploadedHistoryPickerOpen, uploadedHistoryRange, uploadedHistorySelectedCount, uploadedHistorySelectedIds, uploadedHistoryYear, uploadedHistoryYears, uploadedNameGroups, uploadedPhotoLoading, uploadedRawHistoryCollapsedMonths, uploadedRawHistoryGrouped, uploadedRawHistoryPickerOpen, uploadedRawHistoryYear, uploadedRawHistoryYears, uploadedReportAnalytics, uploadedReportGeo, uploadedReportSummary, uploadedSavingCosts, uploadedSearch, uploadedSelectedNameCodes, uploadedSelectedNames, uploadedSelectedSupplierId, uploadedShareHiddenKeys, uploadedShareHistoryOpen, uploadedShareLinks, uploadedShareLinksLoading, uploadedShareLoading, uploadedSizeDetailsOpen, uploadedSizeSortByRow, uploadedSortKey, uploadedSummaryForView, uploadedTableRowsHidden, uploadedVatCostIncluded, uploadedVatMode, uploadedVatSalesIncluded, uploadedViewTab, validateUploadedReportSupplier, visibleUploadedAnalyticsSuppliers, wbApiBusy, wbApiCollapsed, wbApiPickerOpen, wbApiReports, wbApiYear, wbBase1L, wbBuyoutPct, wbExtraL, wbLocalIndex, wbStorageCoef, wbStorageDays, wbStorageTariff, wbTariffsOpen, wbTiers, wbWarehouseCoef, wbWeeksOfMonth, weatherRegions } = props;
  return (
<div className="w-full max-w-none mx-auto">
              <div className="mb-6">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 sm:p-7 shadow-lg shadow-indigo-200/50">
                  <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                  <div className="absolute -right-2 bottom-0 opacity-20"><BarChart2 className="h-28 w-28 text-white" /></div>
                  <div className="relative flex items-center gap-3">
                    <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm"><BarChart2 className="h-7 w-7 text-white" /></div>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-white">Аналитика</h1>
                      <p className="text-indigo-100 text-sm mt-0.5">Отчёты Wildberries и эффективность рекламы</p>
                    </div>
                  </div>
                  <div className="relative mt-5 inline-flex rounded-2xl bg-white/15 p-1 backdrop-blur-sm">
                    <button
                      type="button"
                      onClick={() => setAnalyticsSubTab('reports')}
                      className={`px-4 sm:px-5 py-2 text-sm font-semibold rounded-xl transition-all ${analyticsSubTab === 'reports' ? 'bg-white text-indigo-700 shadow-sm' : 'text-white/90 hover:bg-white/10'}`}
                    >
                      Аналитика отчётов
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnalyticsSubTab('ads')}
                      className={`px-4 sm:px-5 py-2 text-sm font-semibold rounded-xl transition-all ${analyticsSubTab === 'ads' ? 'bg-white text-indigo-700 shadow-sm' : 'text-white/90 hover:bg-white/10'}`}
                    >
                      Аналитика рекламы
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnalyticsSubTab('ads_api')}
                      className={`px-4 sm:px-5 py-2 text-sm font-semibold rounded-xl transition-all ${analyticsSubTab === 'ads_api' ? 'bg-white text-indigo-700 shadow-sm' : 'text-white/90 hover:bg-white/10'}`}
                    >
                      Реклама API
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnalyticsSubTab('calculator')}
                      className={`px-4 sm:px-5 py-2 text-sm font-semibold rounded-xl transition-all ${analyticsSubTab === 'calculator' ? 'bg-white text-indigo-700 shadow-sm' : 'text-white/90 hover:bg-white/10'}`}
                    >
                      Калькулятор товара
                    </button>
                  </div>
                </div>
              </div>

              {analyticsSubTab === 'ads' && (
                <div className="w-full mb-4 space-y-4">
                  <div className="bg-white rounded-xl border border-slate-100 p-6">
                    <h2 className="text-lg font-semibold text-slate-900">Аналитика рекламы</h2>
                    <p className="text-sm text-slate-500 mt-1">Загрузите Excel-файл рекламы - будут показаны все 4 листа.</p>

                    <div className="mt-4 flex items-center gap-3 flex-wrap">
                      <label className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 cursor-pointer">
                        <Upload className="h-4 w-4" /> Загрузить Excel рекламы
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          className="hidden"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (f) await handleAdsExcelUpload(f);
                            e.currentTarget.value = '';
                          }}
                        />
                      </label>
                      {adsAnalyticsFileName && <div className="text-xs text-slate-500">Файл: {adsAnalyticsFileName}</div>}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-4">

                    <div>
                      <div className="text-sm font-semibold text-slate-900 mb-3">Ключевые показатели</div>
                      {(() => {
                        const money = (v: number) => Math.round(v).toLocaleString('ru-RU') + ' ₽';
                        const TARGET_DRR = 15;
                        const drrColor = adsKpi.drr === 0 ? 'text-slate-900' : adsKpi.drr <= TARGET_DRR ? 'text-emerald-600' : adsKpi.drr <= TARGET_DRR * 1.5 ? 'text-amber-600' : 'text-rose-600';
                        const cards = [
                          { label: 'Расход', value: money(adsKpi.spend), grad: 'from-rose-500 to-orange-500', hint: 'бюджет на рекламу' },
                          { label: 'Выручка с рекламы', value: money(adsKpi.revenue), grad: 'from-emerald-500 to-teal-500', hint: 'заказов на сумму' },
                          { label: 'ДРР', value: adsKpi.drr.toFixed(2) + '%', grad: 'from-violet-500 to-fuchsia-500', hint: 'доля рекламы в выручке', cls: drrColor },
                          { label: 'ROMI', value: adsKpi.romi.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) + '%', grad: 'from-indigo-500 to-blue-500', hint: 'возврат на вложения' },
                        ];
                        const mini = [
                          { label: 'Показы', value: adsKpi.shows.toLocaleString('ru-RU') },
                          { label: 'Клики', value: adsKpi.clicks.toLocaleString('ru-RU') },
                          { label: 'CTR', value: adsKpi.ctr.toFixed(2) + '%' },
                          { label: 'CPC', value: adsKpi.cpc.toFixed(2) + ' ₽' },
                          { label: 'CPM', value: (adsKpi.shows > 0 ? adsKpi.spend / adsKpi.shows * 1000 : 0).toFixed(0) + ' ₽' },
                          { label: 'Корзины', value: adsViz.funnel.carts.toLocaleString('ru-RU') },
                          { label: 'CR (клик→корзина)', value: (adsKpi.clicks > 0 ? adsViz.funnel.carts / adsKpi.clicks * 100 : 0).toFixed(1) + '%' },
                          { label: 'CPO', value: adsKpi.cpo.toFixed(0) + ' ₽' },
                        ];
                        return (
                          <>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                              {cards.map((c) => (
                                <div key={c.label} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${c.grad}`} />
                                  <div className="text-xs font-medium text-slate-500">{c.label}</div>
                                  <div className={`mt-1.5 text-2xl font-extrabold ${c.cls || 'text-slate-900'}`}>{c.value}</div>
                                  <div className="text-[11px] text-slate-400 mt-0.5">{c.hint}</div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                              {mini.map((m) => (
                                <div key={m.label} className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                                  <div className="text-[10px] uppercase tracking-wide text-slate-400">{m.label}</div>
                                  <div className="text-sm font-bold text-slate-800 mt-0.5">{m.value}</div>
                                </div>
                              ))}
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* ── Диаграммы ───────────────────────────────────── */}
                    {adsViz.daily.length > 0 && (() => {
                      const maxSpend = Math.max(1, ...adsViz.daily.map((d) => d.spend));
                      const maxClicks = Math.max(1, ...adsViz.daily.map((d) => d.clicks));
                      return (
                        <div className="rounded-2xl border border-slate-200 p-4">
                          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                            <h4 className="font-bold text-slate-800 text-sm">Динамика по дням</h4>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="inline-flex items-center gap-1.5 text-slate-500"><span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" /> расход</span>
                              <span className="inline-flex items-center gap-1.5 text-slate-500"><span className="h-2.5 w-3 rounded-sm bg-emerald-400" /> клики</span>
                            </div>
                          </div>
                          <div className="flex items-end gap-[3px] h-48 overflow-x-auto">
                            {adsViz.daily.map((d) => {
                              const sh = Math.round((d.spend / maxSpend) * 150);
                              const ch = Math.round((d.clicks / maxClicks) * 150);
                              const cpc = d.clicks ? d.spend / d.clicks : 0;
                              return (
                                <div key={d.date} className="flex-1 min-w-[16px] flex flex-col items-center gap-1" title={`${new Date(d.date + 'T12:00:00').toLocaleDateString('ru-RU')}\nРасход: ${Math.round(d.spend).toLocaleString('ru-RU')} ₽\nКлики: ${d.clicks}\nCPC: ${cpc.toFixed(2)} ₽`}>
                                  <div className="w-full flex items-end justify-center gap-[2px] h-[150px]">
                                    <div className="w-1/2 bg-indigo-500 rounded-t-sm" style={{ height: `${sh}px` }} />
                                    <div className="w-1/2 bg-emerald-400 rounded-t-sm" style={{ height: `${ch}px` }} />
                                  </div>
                                  <span className="text-[8px] text-slate-400">{d.date.slice(8, 10)}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Воронка */}
                      <div className="rounded-2xl border border-slate-200 p-4">
                        <h4 className="font-bold text-slate-800 text-sm mb-3">Воронка</h4>
                        {(() => {
                          const f = adsViz.funnel;
                          const steps = [
                            { label: 'Показы', value: f.shows, color: 'bg-indigo-500' },
                            { label: 'Клики', value: f.clicks, color: 'bg-blue-500', conv: f.shows ? f.clicks / f.shows * 100 : 0 },
                            { label: 'В корзину', value: f.carts, color: 'bg-violet-500', conv: f.clicks ? f.carts / f.clicks * 100 : 0 },
                            { label: 'Заказы', value: f.orders, color: 'bg-emerald-500', conv: f.carts ? f.orders / f.carts * 100 : 0 },
                          ].filter((s) => s.value > 0 || s.label !== 'Заказы');
                          const max = Math.max(1, f.shows);
                          return (
                            <div className="space-y-2">
                              {steps.map((s) => (
                                <div key={s.label}>
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-600 font-medium">{s.label}</span>
                                    <span className="text-slate-500">{s.value.toLocaleString('ru-RU')}{s.conv != null ? <span className="text-slate-400"> · {s.conv.toFixed(1)}%</span> : null}</span>
                                  </div>
                                  <div className="h-6 rounded-lg bg-slate-100 overflow-hidden">
                                    <div className={`h-full ${s.color} rounded-lg`} style={{ width: `${Math.max(2, (s.value / max) * 100)}%` }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Топ ключевых фраз по затратам */}
                      <div className="rounded-2xl border border-slate-200 p-4">
                        <h4 className="font-bold text-slate-800 text-sm mb-3">Топ-10 ключевых фраз по расходу</h4>
                        {adsViz.keywords.length === 0 ? (
                          <div className="text-xs text-slate-400 py-6 text-center">Нет листа с ключевыми фразами</div>
                        ) : (() => {
                          const top = adsViz.keywords.slice(0, 10);
                          const max = Math.max(1, ...top.map((k) => k.spend));
                          return (
                            <div className="space-y-2">
                              {top.map((k) => (
                                <div key={k.phrase} title={`${k.phrase}\nРасход: ${Math.round(k.spend).toLocaleString('ru-RU')} ₽ (${(k.spend / (adsViz.kwSpendTotal || 1) * 100).toFixed(1)}%)\nКлики: ${k.clicks} · CPC: ${k.cpc.toFixed(2)} ₽`}>
                                  <div className="flex justify-between text-xs mb-0.5 gap-2">
                                    <span className="text-slate-700 truncate">{k.phrase}</span>
                                    <span className="text-slate-500 shrink-0">{Math.round(k.spend).toLocaleString('ru-RU')} ₽ · CPC {k.cpc.toFixed(1)}</span>
                                  </div>
                                  <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" style={{ width: `${Math.max(3, (k.spend / max) * 100)}%` }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {adsViz.keywords.length > 0 && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Донат распределения бюджета */}
                        <div className="rounded-2xl border border-slate-200 p-4">
                          <h4 className="font-bold text-slate-800 text-sm mb-3">Распределение бюджета по фразам</h4>
                          {(() => {
                            const palette = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#94a3b8'];
                            const total = adsViz.donut.reduce((s, d) => s + d.value, 0) || 1;
                            let acc = 0;
                            const R = 52, C = 2 * Math.PI * R;
                            return (
                              <div className="flex items-center gap-4 flex-wrap">
                                <svg width="130" height="130" viewBox="0 0 130 130" className="shrink-0">
                                  <g transform="translate(65,65) rotate(-90)">
                                    <circle r={R} fill="none" stroke="#f1f5f9" strokeWidth="16" />
                                    {adsViz.donut.map((d, i) => {
                                      const frac = d.value / total;
                                      const dash = `${frac * C} ${C}`;
                                      const off = -acc * C; acc += frac;
                                      return <circle key={i} r={R} fill="none" stroke={palette[i % palette.length]} strokeWidth="16" strokeDasharray={dash} strokeDashoffset={off} />;
                                    })}
                                  </g>
                                </svg>
                                <div className="flex-1 min-w-[160px] space-y-1">
                                  {adsViz.donut.map((d, i) => (
                                    <div key={i} className="flex items-center justify-between gap-2 text-xs">
                                      <span className="flex items-center gap-1.5 min-w-0"><span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: palette[i % palette.length] }} /><span className="truncate text-slate-600">{d.label}</span></span>
                                      <span className="text-slate-500 shrink-0">{(d.value / total * 100).toFixed(1)}%</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Минус-фразы / неэффективные */}
                        <div className="rounded-2xl border border-slate-200 p-4">
                          <h4 className="font-bold text-slate-800 text-sm mb-1">Слабые фразы</h4>
                          <p className="text-[11px] text-slate-400 mb-3">Средний CPC: {adsViz.avgCpc.toFixed(2)} ₽. Кандидаты на минус-фразы / снижение ставки.</p>
                          {adsViz.wasted.length === 0 && adsViz.expensive.length === 0 ? (
                            <div className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg p-3">Слива бюджета и аномально дорогих фраз не найдено 👍</div>
                          ) : (
                            <div className="space-y-3">
                              {adsViz.wasted.length > 0 && (
                                <div>
                                  <div className="text-xs font-semibold text-rose-600 mb-1">Слив: расход без кликов ({Math.round(adsViz.wastedSum).toLocaleString('ru-RU')} ₽)</div>
                                  <div className="space-y-1 max-h-32 overflow-auto pr-1">
                                    {adsViz.wasted.slice(0, 8).map((k) => (
                                      <div key={k.phrase} className="flex justify-between text-xs gap-2"><span className="truncate text-slate-600">{k.phrase}</span><span className="text-rose-600 shrink-0">{Math.round(k.spend).toLocaleString('ru-RU')} ₽</span></div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {adsViz.expensive.length > 0 && (
                                <div>
                                  <div className="text-xs font-semibold text-amber-600 mb-1">Дорогой CPC (выше среднего в 1.3×)</div>
                                  <div className="space-y-1 max-h-32 overflow-auto pr-1">
                                    {adsViz.expensive.slice(0, 8).map((k) => (
                                      <div key={k.phrase} className="flex justify-between text-xs gap-2"><span className="truncate text-slate-600">{k.phrase}</span><span className="text-amber-600 shrink-0">CPC {k.cpc.toFixed(1)} ₽ · {k.clicks} кл.</span></div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* CPC по дням */}
                    {adsViz.daily.length > 0 && (() => {
                      const series = adsViz.daily.map((d) => ({ date: d.date, cpc: d.clicks ? d.spend / d.clicks : 0 }));
                      const maxCpc = Math.max(0.01, ...series.map((s) => s.cpc));
                      return (
                        <div className="rounded-2xl border border-slate-200 p-4">
                          <h4 className="font-bold text-slate-800 text-sm mb-3">CPC по дням <span className="text-[11px] font-normal text-slate-400">(стоимость клика)</span></h4>
                          <div className="flex items-end gap-[3px] h-32 overflow-x-auto">
                            {series.map((s) => (
                              <div key={s.date} className="flex-1 min-w-[14px] flex flex-col items-center gap-1" title={`${new Date(s.date + 'T12:00:00').toLocaleDateString('ru-RU')}\nCPC: ${s.cpc.toFixed(2)} ₽`}>
                                <div className="w-full flex flex-col justify-end h-[100px]">
                                  <div className="w-full bg-gradient-to-t from-amber-500 to-orange-400 rounded-t-sm" style={{ height: `${Math.round((s.cpc / maxCpc) * 100)}px` }} />
                                </div>
                                <span className="text-[8px] text-slate-400">{s.date.slice(8, 10)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    </div>

                  <div className="bg-white rounded-xl border border-slate-100 p-4">
                    <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                      <h3 className="text-base font-semibold text-slate-900">Аналитика по номенклатурам</h3>
                      <div className="text-xs text-slate-500">Номенклатур: {adsByNm.length}</div>
                    </div>
                    <div className="overflow-auto max-h-[42vh] border border-slate-100 rounded-lg mb-4">
                      <table className="min-w-full text-xs">
                        <thead className="bg-slate-50 sticky top-0 z-10">
                          <tr className="select-none">
                            <th className="px-2 py-2 text-left cursor-pointer hover:text-indigo-600" onClick={adsNmSortBtn('nm')}>Номенклатура{adsNmArw('nm')}</th>
                            <th className="px-2 py-2 text-left cursor-pointer hover:text-indigo-600" onClick={adsNmSortBtn('spend')}>Расход{adsNmArw('spend')}</th>
                            <th className="px-2 py-2 text-left cursor-pointer hover:text-indigo-600" onClick={adsNmSortBtn('revenue')}>Выручка{adsNmArw('revenue')}</th>
                            <th className="px-2 py-2 text-left cursor-pointer hover:text-indigo-600" onClick={adsNmSortBtn('clicks')}>Клики{adsNmArw('clicks')}</th>
                            <th className="px-2 py-2 text-left cursor-pointer hover:text-indigo-600" onClick={adsNmSortBtn('shows')}>Показы{adsNmArw('shows')}</th>
                            <th className="px-2 py-2 text-left cursor-pointer hover:text-indigo-600" onClick={adsNmSortBtn('ctr')}>CTR %{adsNmArw('ctr')}</th>
                            <th className="px-2 py-2 text-left cursor-pointer hover:text-indigo-600" onClick={adsNmSortBtn('cpc')}>CPC{adsNmArw('cpc')}</th>
                            <th className="px-2 py-2 text-left cursor-pointer hover:text-indigo-600" onClick={adsNmSortBtn('drr')}>ДРР %{adsNmArw('drr')}</th>
                            <th className="px-2 py-2 text-left cursor-pointer hover:text-indigo-600" onClick={adsNmSortBtn('romi')}>ROMI %{adsNmArw('romi')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adsByNmSorted.map((x: any) => (
                            <tr key={x.nm} className="border-t border-slate-100">
                              <td className="px-2 py-1.5 font-semibold">{x.nm}</td>
                              <td className="px-2 py-1.5">{x.spend.toLocaleString('ru-RU')}</td>
                              <td className="px-2 py-1.5">{x.revenue.toLocaleString('ru-RU')}</td>
                              <td className="px-2 py-1.5">{x.clicks.toLocaleString('ru-RU')}</td>
                              <td className="px-2 py-1.5">{x.shows.toLocaleString('ru-RU')}</td>
                              <td className="px-2 py-1.5">{x.ctr.toLocaleString('ru-RU',{maximumFractionDigits:2})}</td>
                              <td className="px-2 py-1.5">{x.cpc.toLocaleString('ru-RU',{maximumFractionDigits:2})}</td>
                              <td className="px-2 py-1.5">{x.drr.toLocaleString('ru-RU',{maximumFractionDigits:2})}</td>
                              <td className="px-2 py-1.5">{x.romi.toLocaleString('ru-RU',{maximumFractionDigits:2})}</td>
                            </tr>
                          ))}
                          {adsByNm.length === 0 && (
                            <tr><td colSpan={9} className="px-3 py-4 text-center text-slate-500">Не найдена колонка номенклатуры в файле рекламы</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Все поисковые фразы, на которые тратится бюджет */}
                    {adsViz.keywords.length > 0 && (
                      <>
                        <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
                          <h3 className="text-base font-semibold text-slate-900">Все поисковые фразы ({adsViz.keywords.length.toLocaleString('ru-RU')})</h3>
                          <input
                            value={adsKwSearch}
                            onChange={(e) => setAdsKwSearch(e.target.value)}
                            placeholder="Поиск фразы…"
                            className="w-full md:w-[300px] px-3 py-2 text-xs border border-slate-300 rounded-lg"
                          />
                        </div>
                        <div className="overflow-auto max-h-[60vh] border border-slate-100 rounded-lg">
                          <table className="min-w-full text-xs">
                            <thead className="bg-slate-50 sticky top-0 z-10">
                              <tr className="select-none">
                                <th className="px-2 py-2 text-left cursor-pointer hover:text-indigo-600" onClick={adsKwSortBtn('phrase')}>Поисковая фраза{adsKwArw('phrase')}</th>
                                <th className="px-2 py-2 text-right cursor-pointer hover:text-indigo-600" onClick={adsKwSortBtn('clicks')}>Клики{adsKwArw('clicks')}</th>
                                <th className="px-2 py-2 text-right cursor-pointer hover:text-indigo-600" onClick={adsKwSortBtn('spend')}>Расход ₽{adsKwArw('spend')}</th>
                                <th className="px-2 py-2 text-right cursor-pointer hover:text-indigo-600" onClick={adsKwSortBtn('cpc')}>CPC ₽{adsKwArw('cpc')}</th>
                                <th className="px-2 py-2 text-right">Доля бюджета</th>
                              </tr>
                            </thead>
                            <tbody>
                              {adsKwView.slice(0, 500).map((k: any) => (
                                <tr key={k.phrase} className="border-t border-slate-100 hover:bg-slate-50">
                                  <td className="px-2 py-1.5 text-slate-700 max-w-[420px] truncate" title={k.phrase}>{k.phrase}</td>
                                  <td className="px-2 py-1.5 text-right">{k.clicks.toLocaleString('ru-RU')}</td>
                                  <td className="px-2 py-1.5 text-right font-semibold text-slate-800">{Math.round(k.spend).toLocaleString('ru-RU')}</td>
                                  <td className="px-2 py-1.5 text-right">{k.cpc.toFixed(2)}</td>
                                  <td className="px-2 py-1.5 text-right text-slate-500">{(k.spend / (adsViz.kwSpendTotal || 1) * 100).toFixed(2)}%</td>
                                </tr>
                              ))}
                              {adsKwView.length === 0 && (
                                <tr><td colSpan={5} className="px-3 py-4 text-center text-slate-500">Ничего не найдено</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                        {adsKwView.length > 500 && <div className="text-[11px] text-slate-400 mt-1">Показаны первые 500 из {adsKwView.length.toLocaleString('ru-RU')}. Уточните поиск или отсортируйте.</div>}
                      </>
                    )}

                  </div>
                </div>
              )}

              {analyticsSubTab === 'ads_api' && (
                <div className="w-full mb-4 space-y-4">
                  <div className="bg-white rounded-xl border border-slate-100 p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">Реклама через WB API</h2>
                        <p className="text-sm text-slate-500 mt-1">Данные собираются в фоне каждые 30 мин и хранятся 90 дней. Раздел читает их из базы мгновенно — заказы, выручка и ДРР по дням.</p>
                        {adsApiLastSync && <p className="text-[11px] text-slate-400 mt-1">Последняя синхронизация: {adsApiLastSync}</p>}
                      </div>
                      <button onClick={syncAdsApiNow} disabled={adsApiSyncing || !adsApiSupplierId} className="px-4 py-2 text-sm font-semibold rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 shadow-sm disabled:opacity-50">
                        {adsApiSyncing ? 'Синхронизация…' : '↻ Синхронизировать с WB'}
                      </button>
                    </div>
                    <div className="mt-4 flex flex-wrap items-end gap-3">
                      <div className="min-w-[240px]">
                        <label className="block text-xs text-slate-500 mb-1">Поставщик (с WB API токеном)</label>
                        <Select value={adsApiSupplierId} onChange={(e) => setAdsApiSupplierId(e.target.value)} className="w-full md:w-[360px] px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white">
                          <option value="">- Выберите поставщика -</option>
                          {(suppliers || []).filter((s: any) => s.wb_adv_api_token || s.wb_api_token).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </Select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Период с</label>
                        <input type="date" value={adsApiFrom} onChange={(e) => setAdsApiFrom(e.target.value)} className="px-2 py-2 text-xs border border-slate-300 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">по</label>
                        <input type="date" value={adsApiTo} onChange={(e) => setAdsApiTo(e.target.value)} className="px-2 py-2 text-xs border border-slate-300 rounded-lg" />
                      </div>
                      <button onClick={() => loadAdsApiData()} disabled={adsApiLoading || !adsApiSupplierId} className="px-4 py-2 text-sm font-semibold rounded-xl border border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-sm disabled:opacity-50">
                        {adsApiLoading ? 'Загрузка…' : 'Показать'}
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {([['today','Сегодня'],['yesterday','Вчера'],['7','7 дней'],['30','30 дней']] as const).map(([k, l]) => (
                        <button key={k} type="button" onClick={() => adsApiPreset(k)} disabled={adsApiLoading || !adsApiSupplierId} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50">{l}</button>
                      ))}
                    </div>
                    {adsApiError && <div className="mt-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2">{adsApiError}</div>}
                    {adsApiSyncing && <div className="mt-2 text-[11px] text-slate-400">Тянем данные из WB (первая синхронизация может занять до минуты)…</div>}
                  </div>

                  {adsApiData && (() => {
                    const t = adsApiData.totals; const money = (v: number) => Math.round(v).toLocaleString('ru-RU') + ' ₽';
                    const ctr = t.views ? t.clicks / t.views * 100 : 0;
                    const cpc = t.clicks ? t.sum / t.clicks : 0;
                    const cpo = t.orders ? t.sum / t.orders : 0;
                    const cr = t.clicks ? t.orders / t.clicks * 100 : 0;
                    const drr = t.revenue ? t.sum / t.revenue * 100 : 0;
                    const romi = t.sum ? (t.revenue - t.sum) / t.sum * 100 : 0;
                    const drrColor = drr === 0 ? 'text-slate-900' : drr <= 15 ? 'text-emerald-600' : drr <= 22.5 ? 'text-amber-600' : 'text-rose-600';
                    const cards = [
                      { label: 'Расход', value: money(t.sum), grad: 'from-rose-500 to-orange-500' },
                      { label: 'Выручка с рекламы', value: money(t.revenue), grad: 'from-emerald-500 to-teal-500' },
                      { label: 'ДРР', value: drr.toFixed(2) + '%', grad: 'from-violet-500 to-fuchsia-500', cls: drrColor },
                      { label: 'ROMI', value: romi.toFixed(0) + '%', grad: 'from-indigo-500 to-blue-500' },
                    ];
                    const mini = [
                      { label: 'Показы', value: t.views.toLocaleString('ru-RU') },
                      { label: 'Клики', value: t.clicks.toLocaleString('ru-RU') },
                      { label: 'CTR', value: ctr.toFixed(2) + '%' },
                      { label: 'CPC', value: cpc.toFixed(2) + ' ₽' },
                      { label: 'В корзину', value: t.atbs.toLocaleString('ru-RU') },
                      { label: 'Заказы', value: t.orders.toLocaleString('ru-RU') },
                      { label: 'CR (клик→заказ)', value: cr.toFixed(2) + '%' },
                      { label: 'CPO', value: cpo.toFixed(0) + ' ₽' },
                    ];
                    return (
                      <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-4">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                          {cards.map((c) => (
                            <div key={c.label} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${c.grad}`} />
                              <div className="text-xs font-medium text-slate-500">{c.label}</div>
                              <div className={`mt-1.5 text-2xl font-extrabold ${c.cls || 'text-slate-900'}`}>{c.value}</div>
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                          {mini.map((m) => (
                            <div key={m.label} className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                              <div className="text-[10px] uppercase tracking-wide text-slate-400">{m.label}</div>
                              <div className="text-sm font-bold text-slate-800 mt-0.5">{m.value}</div>
                            </div>
                          ))}
                        </div>

                        {/* Расход + выручка по дням */}
                        {adsApiData.daily.length > 0 && (() => {
                          const maxSpend = Math.max(1, ...adsApiData.daily.map((d: any) => d.spend));
                          const maxRev = Math.max(1, ...adsApiData.daily.map((d: any) => d.revenue));
                          return (
                            <div className="rounded-2xl border border-slate-200 p-4">
                              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                                <h4 className="font-bold text-slate-800 text-sm">Расход и выручка по дням</h4>
                                <div className="flex items-center gap-3 text-xs">
                                  <span className="inline-flex items-center gap-1.5 text-slate-500"><span className="h-2.5 w-2.5 rounded-sm bg-rose-500" /> расход</span>
                                  <span className="inline-flex items-center gap-1.5 text-slate-500"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> выручка</span>
                                </div>
                              </div>
                              <div className="flex items-end gap-[3px] h-48 overflow-x-auto">
                                {adsApiData.daily.map((d: any) => {
                                  const drrD = d.revenue ? d.spend / d.revenue * 100 : 0;
                                  return (
                                    <div key={d.date} className="flex-1 min-w-[16px] flex flex-col items-center gap-1" title={`${new Date(d.date + 'T12:00:00').toLocaleDateString('ru-RU')}\nРасход: ${Math.round(d.spend).toLocaleString('ru-RU')} ₽\nВыручка: ${Math.round(d.revenue).toLocaleString('ru-RU')} ₽\nЗаказы: ${d.orders}\nДРР: ${drrD.toFixed(1)}%`}>
                                      <div className="w-full flex items-end justify-center gap-[2px] h-[150px]">
                                        <div className="w-1/2 bg-rose-500 rounded-t-sm" style={{ height: `${Math.round(d.spend / maxSpend * 150)}px` }} />
                                        <div className="w-1/2 bg-emerald-500 rounded-t-sm" style={{ height: `${Math.round(d.revenue / maxRev * 150)}px` }} />
                                      </div>
                                      <span className="text-[8px] text-slate-400">{d.date.slice(8, 10)}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}

                        {/* ДРР по дням */}
                        {adsApiData.daily.length > 0 && (() => {
                          const series = adsApiData.daily.map((d: any) => ({ date: d.date, drr: d.revenue ? d.spend / d.revenue * 100 : 0 }));
                          const maxDrr = Math.max(1, ...series.map((s: any) => s.drr));
                          return (
                            <div className="rounded-2xl border border-slate-200 p-4">
                              <h4 className="font-bold text-slate-800 text-sm mb-3">ДРР по дням <span className="text-[11px] font-normal text-slate-400">(ниже — лучше; цель ≤15%)</span></h4>
                              <div className="flex items-end gap-[3px] h-32 overflow-x-auto">
                                {series.map((s: any) => (
                                  <div key={s.date} className="flex-1 min-w-[14px] flex flex-col items-center gap-1" title={`${new Date(s.date + 'T12:00:00').toLocaleDateString('ru-RU')}\nДРР: ${s.drr.toFixed(1)}%`}>
                                    <div className="w-full flex flex-col justify-end h-[100px]">
                                      <div className={`w-full rounded-t-sm ${s.drr <= 15 ? 'bg-emerald-500' : s.drr <= 22.5 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ height: `${Math.round(s.drr / maxDrr * 100)}px` }} />
                                    </div>
                                    <span className="text-[8px] text-slate-400">{s.date.slice(8, 10)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Таблица по кампаниям */}
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm mb-2">По кампаниям ({adsApiData.count})</h4>
                          <div className="overflow-auto max-h-[50vh] border border-slate-100 rounded-lg">
                            <table className="min-w-full text-xs">
                              <thead className="bg-slate-50 sticky top-0 z-10">
                                <tr className="select-none">
                                  {[['name','Кампания'],['sum','Расход'],['revenue','Зак. на сумму'],['views','Показы'],['clicks','Клики'],['atbs','Корзины'],['orders','Заказы']].map(([f,l]) => (
                                    <th key={f} className={`px-2 py-2 cursor-pointer hover:text-indigo-600 ${f === 'name' ? 'text-left' : 'text-right'}`} onClick={() => setAdsApiCampSort((p) => ({ field: f, dir: p.field === f && p.dir === 'desc' ? 'asc' : 'desc' }))}>{l}{adsApiCampSort.field === f ? (adsApiCampSort.dir === 'asc' ? ' ▲' : ' ▼') : ''}</th>
                                  ))}
                                  <th className="px-2 py-2 text-right">CTR %</th>
                                  <th className="px-2 py-2 text-right">CPC ₽</th>
                                  <th className="px-2 py-2 text-right">CPM ₽</th>
                                  <th className="px-2 py-2 text-right">CR %</th>
                                  <th className="px-2 py-2 text-right">CPS ₽</th>
                                  <th className="px-2 py-2 text-right">ДРР %</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                                  <td className="px-2 py-1.5">Итого</td>
                                  <td className="px-2 py-1.5 text-right">{Math.round(t.sum).toLocaleString('ru-RU')}</td>
                                  <td className="px-2 py-1.5 text-right">{Math.round(t.revenue).toLocaleString('ru-RU')}</td>
                                  <td className="px-2 py-1.5 text-right">{t.views.toLocaleString('ru-RU')}</td>
                                  <td className="px-2 py-1.5 text-right">{t.clicks.toLocaleString('ru-RU')}</td>
                                  <td className="px-2 py-1.5 text-right">{t.atbs.toLocaleString('ru-RU')}</td>
                                  <td className="px-2 py-1.5 text-right">{t.orders.toLocaleString('ru-RU')}</td>
                                  <td className="px-2 py-1.5 text-right">{ctr.toFixed(2)}</td>
                                  <td className="px-2 py-1.5 text-right">{cpc.toFixed(2)}</td>
                                  <td className="px-2 py-1.5 text-right">{(t.views ? t.sum / t.views * 1000 : 0).toFixed(0)}</td>
                                  <td className="px-2 py-1.5 text-right">{cr.toFixed(2)}</td>
                                  <td className="px-2 py-1.5 text-right">{cpo.toFixed(0)}</td>
                                  <td className="px-2 py-1.5 text-right">{drr.toFixed(1)}</td>
                                </tr>
                                {[...adsApiData.campaigns].sort((a: any, b: any) => { const f = adsApiCampSort.field; const mul = adsApiCampSort.dir === 'asc' ? 1 : -1; return f === 'name' ? String(a.name).localeCompare(String(b.name), 'ru') * mul : ((a[f] || 0) - (b[f] || 0)) * mul; }).map((c: any) => (
                                  <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                                    <td className="px-2 py-1.5 max-w-[300px]">
                                      <div className="flex items-center gap-1.5">
                                        <span className="truncate max-w-[230px]" title={c.name}>{c.name}</span>
                                        <button onClick={() => loadAdsApiKeywords(Number(c.id), c.name)} title="Ключи / кластеры по кампании" className="shrink-0 px-1.5 py-0.5 text-[10px] font-semibold rounded border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100">🔑 Ключи</button>
                                      </div>
                                    </td>
                                    <td className="px-2 py-1.5 text-right">{Math.round(c.sum).toLocaleString('ru-RU')}</td>
                                    <td className="px-2 py-1.5 text-right">{Math.round(c.revenue).toLocaleString('ru-RU')}</td>
                                    <td className="px-2 py-1.5 text-right">{c.views.toLocaleString('ru-RU')}</td>
                                    <td className="px-2 py-1.5 text-right">{c.clicks.toLocaleString('ru-RU')}</td>
                                    <td className="px-2 py-1.5 text-right">{c.atbs.toLocaleString('ru-RU')}</td>
                                    <td className="px-2 py-1.5 text-right">{c.orders.toLocaleString('ru-RU')}</td>
                                    <td className="px-2 py-1.5 text-right">{(c.views ? c.clicks / c.views * 100 : 0).toFixed(2)}</td>
                                    <td className="px-2 py-1.5 text-right">{(c.clicks ? c.sum / c.clicks : 0).toFixed(2)}</td>
                                    <td className="px-2 py-1.5 text-right">{(c.views ? c.sum / c.views * 1000 : 0).toFixed(0)}</td>
                                    <td className="px-2 py-1.5 text-right">{(c.clicks ? c.orders / c.clicks * 100 : 0).toFixed(2)}</td>
                                    <td className="px-2 py-1.5 text-right">{(c.orders ? c.sum / c.orders : 0).toFixed(0)}</td>
                                    <td className={`px-2 py-1.5 text-right font-medium ${(() => { const d = c.revenue ? c.sum / c.revenue * 100 : 0; return d === 0 ? 'text-slate-400' : d <= 15 ? 'text-emerald-600' : d <= 22.5 ? 'text-amber-600' : 'text-rose-600'; })()}`}>{(c.revenue ? c.sum / c.revenue * 100 : 0).toFixed(1)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {adsApiKwFor && (() => {
                    const all = adsApiKwData || [];
                    // классификация фраз
                    const totalSum = all.reduce((s, k) => s + (k.sum || 0), 0);
                    const avgCpc = (() => { const c = all.filter((k) => k.clicks > 0); return c.length ? c.reduce((s, k) => s + k.cpc, 0) / c.length : 0; })();
                    const classify = (k: any): 'good' | 'bad' | 'mid' => {
                      if (k.orders > 0 && k.ctr >= 4 && (!avgCpc || k.cpc <= avgCpc)) return 'good';
                      if (k.sum >= Math.max(50, totalSum * 0.03) && k.orders === 0) return 'bad';
                      if (k.clicks >= 15 && k.ctr < 2) return 'bad';
                      return 'mid';
                    };
                    const enriched = all.map((k) => ({ ...k, cls: classify(k) }));
                    const view = enriched.filter((k) => adsApiKwFilter === 'all' ? true : k.cls === adsApiKwFilter);
                    const sorted = [...view].sort((a, b) => { const f = adsApiKwSort.field; const mul = adsApiKwSort.dir === 'asc' ? 1 : -1; return f === 'keyword' ? String(a.keyword).localeCompare(String(b.keyword), 'ru') * mul : ((a[f] || 0) - (b[f] || 0)) * mul; });
                    const bad = enriched.filter((k) => k.cls === 'bad');
                    const good = enriched.filter((k) => k.cls === 'good');
                    const wastedSum = bad.reduce((s, k) => s + (k.sum || 0), 0);
                    const num = (v: number, d = 0) => (v || 0).toLocaleString('ru-RU', { minimumFractionDigits: d, maximumFractionDigits: d });
                    const cols: Array<[string, string]> = [['keyword', 'Фраза / кластер'], ['views', 'Показы'], ['clicks', 'Клики'], ['ctr', 'CTR %'], ['cpc', 'CPC ₽'], ['sum', 'Расход ₽'], ['orders', 'Заказы'], ['cr', 'CR %']];
                    return (
                      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4" onClick={() => setAdsApiKwFor(null)}>
                        <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-5xl max-h-[92vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
                          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-xs text-slate-400">Ключи и кластеры кампании</div>
                              <div className="font-bold text-slate-800 truncate" title={adsApiKwFor.name}>{adsApiKwFor.name}</div>
                            </div>
                            <button onClick={() => setAdsApiKwFor(null)} className="shrink-0 w-9 h-9 rounded-full hover:bg-slate-100 text-slate-500 text-lg">✕</button>
                          </div>
                          <div className="p-5 overflow-auto">
                            {adsApiKwLoading ? (
                              <div className="py-12 text-center text-slate-500 text-sm">Загружаю данные из WB…</div>
                            ) : (!adsApiKwData || adsApiKwData.length === 0) ? (
                              <div className="py-10 text-center text-slate-500 text-sm whitespace-pre-line">{adsApiKwNote || 'Нет данных.'}</div>
                            ) : (
                              <>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                                  <div className="rounded-xl bg-slate-50 p-3"><div className="text-[11px] text-slate-500">Всего фраз</div><div className="text-lg font-bold text-slate-800">{enriched.length}</div></div>
                                  <div className="rounded-xl bg-emerald-50 p-3"><div className="text-[11px] text-emerald-700">Хорошие</div><div className="text-lg font-bold text-emerald-700">{good.length}</div></div>
                                  <div className="rounded-xl bg-rose-50 p-3"><div className="text-[11px] text-rose-700">Плохие</div><div className="text-lg font-bold text-rose-700">{bad.length}</div></div>
                                  <div className="rounded-xl bg-amber-50 p-3"><div className="text-[11px] text-amber-700">Слив на плохих</div><div className="text-lg font-bold text-amber-700">{num(wastedSum)} ₽</div></div>
                                </div>

                                {(bad.length > 0 || good.length > 0) && (
                                  <div className="mb-4 rounded-xl border border-slate-200 p-3 text-xs space-y-2">
                                    <div className="font-bold text-slate-700">Рекомендации</div>
                                    {bad.length > 0 && <div className="text-rose-700">❌ Минусовать ({bad.length}): тратят деньги без заказов / низкий CTR. Топ: {bad.slice().sort((a, b) => b.sum - a.sum).slice(0, 6).map((k) => `«${k.keyword}»`).join(', ')}{bad.length > 6 ? '…' : ''}</div>}
                                    {good.length > 0 && <div className="text-emerald-700">✅ Поднять ставку ({good.length}): дают заказы при хорошем CTR и низком CPC. Топ: {good.slice().sort((a, b) => b.orders - a.orders).slice(0, 6).map((k) => `«${k.keyword}»`).join(', ')}{good.length > 6 ? '…' : ''}</div>}
                                  </div>
                                )}

                                <div className="flex items-center gap-2 mb-2">
                                  {(['all', 'good', 'bad'] as const).map((f) => (
                                    <button key={f} onClick={() => setAdsApiKwFilter(f)} className={`px-3 py-1 text-xs font-semibold rounded-lg border ${adsApiKwFilter === f ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{f === 'all' ? 'Все' : f === 'good' ? 'Хорошие' : 'Плохие'}</button>
                                  ))}
                                  <span className="text-[11px] text-slate-400 ml-auto">{sorted.length} строк</span>
                                </div>

                                <div className="overflow-auto max-h-[50vh] border border-slate-100 rounded-lg">
                                  <table className="min-w-full text-xs">
                                    <thead className="bg-slate-50 sticky top-0 z-10">
                                      <tr className="select-none">
                                        {cols.map(([f, l]) => (
                                          <th key={f} className={`px-2 py-2 cursor-pointer hover:text-indigo-600 ${f === 'keyword' ? 'text-left' : 'text-right'}`} onClick={() => setAdsApiKwSort((p) => ({ field: f, dir: p.field === f && p.dir === 'desc' ? 'asc' : 'desc' }))}>{l}{adsApiKwSort.field === f ? (adsApiKwSort.dir === 'asc' ? ' ▲' : ' ▼') : ''}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {sorted.map((k, i) => (
                                        <tr key={i} className={`border-t border-slate-100 ${k.cls === 'good' ? 'bg-emerald-50/40' : k.cls === 'bad' ? 'bg-rose-50/40' : ''}`}>
                                          <td className="px-2 py-1.5 max-w-[280px] truncate" title={k.keyword}>{k.cls === 'good' ? '✅ ' : k.cls === 'bad' ? '❌ ' : ''}{k.keyword}</td>
                                          <td className="px-2 py-1.5 text-right">{num(k.views)}</td>
                                          <td className="px-2 py-1.5 text-right">{num(k.clicks)}</td>
                                          <td className="px-2 py-1.5 text-right">{num(k.ctr, 2)}</td>
                                          <td className="px-2 py-1.5 text-right">{num(k.cpc, 2)}</td>
                                          <td className="px-2 py-1.5 text-right">{num(k.sum)}</td>
                                          <td className="px-2 py-1.5 text-right">{num(k.orders)}</td>
                                          <td className="px-2 py-1.5 text-right">{num(k.cr, 2)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {analyticsSubTab === 'calculator' && (() => {
                const num = (v: any) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
                const cPct = num(calcCommissionPct);
                const aPctOsno = num(calcAdsPctOsno);
                const aPctUsn = num(calcAdsPctUsn);
                const usnRate = num(calcUsnRate);
                const VAT = 0.22;
                const ex = (a: number) => (a * VAT) / (1 + VAT);
                const vS = (a: number) => uploadedVatSalesIncluded ? ex(a) : a * VAT;
                const eurRate = num(cbrRates.EUR);
                const money = (v: number) => v.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
                const pctOf = (v: number, base: number) => base > 0 ? `${(v / base * 100).toFixed(1)}%` : '—';
                const B = Math.max(0.01, num(wbBuyoutPct) / 100);

                const upd = (id: string, patch: any) => setCalcItems((prev) => prev.map((x) => x.id === id ? { ...x, ...patch } : x));
                const addPricePoint = (it: any) => upd(it.id, { pricePoints: [...(Array.isArray(it.pricePoints) ? it.pricePoints : []), { price: Math.round(num(it.price) * 1.15), qty: Math.max(1, Math.round(num(it.qty) || 1)), turnoverDays: Math.max(1, Math.round(num(it.turnoverDays) || 30)) }] });
                const updPricePoint = (it: any, i: number, patch: any) => upd(it.id, { pricePoints: (it.pricePoints || []).map((pp: any, k: number) => k === i ? { ...pp, ...patch } : pp) });
                const delPricePoint = (it: any, i: number) => upd(it.id, { pricePoints: (it.pricePoints || []).filter((_: any, k: number) => k !== i) });
                const addImportVariant = (it: any) => upd(it.id, { importVariants: [...(Array.isArray(it.importVariants) ? it.importVariants : []), { purchase: num(it.purchase), currency: it.currency, country: it.country, deliveryToBorder: num(it.deliveryToBorder), turnoverDays: Math.max(1, Math.round(num(it.turnoverDays) || 30)) }] });
                const updImportVariant = (it: any, i: number, patch: any) => upd(it.id, { importVariants: (it.importVariants || []).map((v: any, k: number) => k === i ? { ...v, ...patch } : v) });
                const delImportVariant = (it: any, i: number) => upd(it.id, { importVariants: (it.importVariants || []).filter((_: any, k: number) => k !== i) });
                const applyCategory = (id: string, key: string) => {
                  const c = IMPORT_CATEGORIES.find((x) => x.key === key);
                  if (!c) return;
                  upd(id, { category: key, dutyType: c.type, dutyPct: c.pct, dutySpec: c.spec, dutyUnit: c.unit, vatPct: c.vat });
                };
                // Снимок условий продажи/логистики, чтобы они сохранялись вместе с товаром.
                const currentCalcSettings = () => ({
                  commissionPct: calcCommissionPct, adsOsno: calcAdsPctOsno, adsUsn: calcAdsPctUsn,
                  assembly: calcAssembly, deliveryToWb: calcDeliveryToWb, cargoPerKg: calcCargoPerKg,
                  usnRate: calcUsnRate, targetMargin: calcTargetMargin, noVatRefund: calcNoVatRefund, usnCashExpense: calcUsnCashExpense,
                  fastWithdraw: calcFastWithdraw, fastWithdrawPct: calcFastWithdrawPct,
                  buyoutPct: wbBuyoutPct, warehouseCoef: wbWarehouseCoef, localIndex: wbLocalIndex,
                  base1L: wbBase1L, extraL: wbExtraL, tiers: wbTiers,
                  storageTariff: wbStorageTariff, storageCoef: wbStorageCoef, storageDays: wbStorageDays,
                });
                const applyCalcSettingsObj = (s: any) => {
                  if (!s || typeof s !== 'object') return;
                  const n = (v: any, d: number) => Number.isFinite(Number(v)) ? Number(v) : d;
                  setCalcCommissionPct(n(s.commissionPct, calcCommissionPct));
                  setCalcAdsPctOsno(n(s.adsOsno, calcAdsPctOsno));
                  setCalcAdsPctUsn(n(s.adsUsn, calcAdsPctUsn));
                  setCalcAssembly(n(s.assembly, calcAssembly));
                  setCalcDeliveryToWb(n(s.deliveryToWb, calcDeliveryToWb));
                  setCalcCargoPerKg(n(s.cargoPerKg, calcCargoPerKg));
                  setCalcUsnRate(n(s.usnRate, calcUsnRate));
                  setCalcTargetMargin(n(s.targetMargin, calcTargetMargin));
                  if (typeof s.noVatRefund === 'boolean') setCalcNoVatRefund(s.noVatRefund);
                  if (typeof s.usnCashExpense === 'boolean') setCalcUsnCashExpense(s.usnCashExpense);
                  if (typeof s.fastWithdraw === 'boolean') setCalcFastWithdraw(s.fastWithdraw);
                  setCalcFastWithdrawPct(n(s.fastWithdrawPct, calcFastWithdrawPct));
                  setWbBuyoutPct(n(s.buyoutPct, wbBuyoutPct));
                  setWbWarehouseCoef(n(s.warehouseCoef, wbWarehouseCoef));
                  setWbLocalIndex(n(s.localIndex, wbLocalIndex));
                  setWbBase1L(n(s.base1L, wbBase1L));
                  setWbExtraL(n(s.extraL, wbExtraL));
                  setWbStorageTariff(n(s.storageTariff, wbStorageTariff));
                  setWbStorageCoef(n(s.storageCoef, wbStorageCoef));
                  setWbStorageDays(n(s.storageDays, wbStorageDays));
                  if (Array.isArray(s.tiers) && s.tiers.length === 5) setWbTiers(s.tiers.map((x: any) => n(x, 0)));
                };
                const saveProduct = async (it: any, nameOverride?: string) => {
                  const nm = String(nameOverride ?? it.name ?? '').trim();
                  if (!nm) { showToast('Введите название товара', 'error'); return; }
                  const { id, ...rest } = it;
                  const entry = { ...rest, name: nm, savedAt: new Date().toISOString(), settings: currentCalcSettings() };
                  const next = [...calcSavedProducts.filter((x) => String(x?.name || '').trim() !== nm), entry];
                  try {
                    setCalcSavedProducts(next);
                    await persistCalcSavedProducts(next);
                    if (id) upd(id, { name: nm });
                    showToast(`Товар «${nm}» сохранён`, 'success');
                  } catch (e: any) { console.error('saveProduct error', e); showToast('Не удалось сохранить товар', 'error'); }
                };
                const applySaved = (s: any) => {
                  const { settings, ...item } = s || {};
                  setCalcItems((prev) => [...prev, { ...item, id: `${Date.now()}-${Math.round(Math.random() * 1e6)}` }]);
                  if (settings) applyCalcSettingsObj(settings);
                  setCalcPickerOpen(false);
                  showToast(settings ? `Загружен «${s?.name || 'товар'}» с условиями` : `Добавлен «${s?.name || 'товар'}»`, 'success');
                };
                const deleteSaved = async (nm: string) => {
                  const next = calcSavedProducts.filter((x) => String(x?.name || '').trim() !== nm);
                  try { setCalcSavedProducts(next); await persistCalcSavedProducts(next); } catch (e) { console.error(e); }
                };

                const computeItem = (it: any) => {
                  // Источник считается отдельно для каждого режима:
                  // ОСНО — официальный ввоз ('import') или закупка в РФ ('ru');
                  // УСН — карго ('cargo') или закупка в РФ ('ru').
                  const osnoSrc = it.osnoSource || (it.source === 'ru' ? 'ru' : 'import');
                  const usnSrc = it.usnSource || (it.source === 'ru' ? 'ru' : 'cargo');
                  const isRuOsno = osnoSrc === 'ru';
                  const isRuUsn = usnSrc === 'ru';
                  let rate = 1, customs = 0, dutyAdv = 0, dutySpecRub = 0, duty = 0;
                  let dutyByWeight = false, importVat = 0, costOsno = 0, costUsn = 0, cargo = 0;

                  // Валютная закупка нужна и для официального ввоза (ОСНО), и для карго (УСН).
                  rate = num(it.rateManual) > 0 ? num(it.rateManual) : num(cbrRates[it.currency] || (it.currency === 'RUB' ? 1 : 0));
                  const purchaseForeign = num(it.purchase) * rate;

                  // ОСНО
                  if (isRuOsno) {
                    const gross = num(it.costRu);
                    const vr = num(it.vatPct) / 100;
                    importVat = vr > 0 ? gross * vr / (1 + vr) : 0;
                    costOsno = gross - importVat;
                  } else {
                    customs = purchaseForeign + num(it.deliveryToBorder);
                    const countryMult = IMPORT_COUNTRIES.find((c) => c.key === it.country)?.mult ?? 1;
                    dutyAdv = customs * num(it.dutyPct) / 100;
                    const specQty = it.dutyUnit === 'kg' ? num(it.weightKg) : 1;
                    dutySpecRub = num(it.dutySpec) * eurRate * specQty;
                    const dutyBase = it.dutyType === 'adv' ? dutyAdv : it.dutyType === 'spec' ? dutySpecRub : Math.max(dutyAdv, dutySpecRub);
                    duty = dutyBase * countryMult;
                    dutyByWeight = it.dutyType === 'comb' && dutySpecRub > dutyAdv;
                    importVat = (customs + duty) * num(it.vatPct) / 100;
                    costOsno = customs + duty;
                  }
                  // УСН
                  if (isRuUsn) {
                    costUsn = num(it.costRuUsn);
                  } else {
                    cargo = num(it.weightKg) * num(calcCargoPerKg);
                    costUsn = purchaseForeign + cargo;
                  }
                  // «Закупка» для строки в колонке ОСНО.
                  const purchaseRub = isRuOsno ? num(it.costRu) : purchaseForeign;
                  // Ввозной НДС не идёт сразу к вычету, а входит в себестоимость и возвращается отдельной строкой.
                  const costOsnoFull = costOsno + importVat;

                  const liters = Math.max(0, num(it.len) * num(it.wid) * num(it.hei) / 1000);
                  const baseLog = wbBaseLogistics(liters, wbTiers, num(wbBase1L), num(wbExtraL));
                  const fwd = baseLog * (num(wbWarehouseCoef) / 100) * num(wbLocalIndex);
                  const back = baseLog;
                  const logistics = fwd / B + back * (1 - B) / B;
                  const storage = num(wbStorageTariff) * liters * (num(wbStorageCoef) / 100) * num(wbStorageDays);

                  const p = num(it.price);
                  const cash = num(calcAssembly) + num(calcDeliveryToWb);
                  const fastPct = calcFastWithdraw ? Math.max(0, num(calcFastWithdrawPct)) : 0;
                  const usnCashExpense = calcUsnCashExpense ? cash : 0;

                  // Всё, что зависит от цены, — функцией, чтобы прогонять несколько ценовых сценариев.
                  const atPrice = (pr: number) => {
                    const commission = pr * cPct / 100;
                    const adsO = pr * aPctOsno / 100;
                    const adsU = pr * aPctUsn / 100;
                    const payoutO = pr - commission - adsO;                 // сумма к перечислению (до быстрого вывода)
                    const fastWithdrawO = payoutO * fastPct / 100;
                    const feesO = commission + adsO + fastWithdrawO;        // на ОСНО ни логистики, ни хранения
                    const feesU = commission + logistics + adsU + storage;
                    const fromO = pr - feesO;
                    const fromU = pr - feesU;
                    const vatOut = vS(pr);
                    const vatInServices = ex(feesO);
                    const vatToPayRaw = vatOut - importVat - vatInServices;
                    const vatToPay = calcNoVatRefund ? Math.max(0, vatToPayRaw) : vatToPayRaw;
                    const vatRefundCut = calcNoVatRefund && vatToPayRaw < 0 ? -vatToPayRaw : 0;
                    const beforeO = fromO - costOsno - vatToPay;
                    const taxO = Math.max(0, beforeO) * 0.25;
                    const osno = beforeO - taxO - cash;
                    // УСН «Доходы−Расходы»: база = доход(цена) − расходы (комиссия/логистика/реклама/хранение
                    // сидят в fromU) − себестоимость − (опц.) сборка/отвоз.
                    const usnTaxBase = fromU - costUsn - usnCashExpense;
                    const taxU = usnRate === 0.06 ? pr * 0.06 : Math.max(0, usnTaxBase) * usnRate;
                    const usn = fromU - costUsn - taxU - cash;
                    return { p: pr, commission, adsO, adsU, fastWithdrawO, feesO, feesU, fromO, fromU, vatOut, vatInServices, vatToPay, vatToPayRaw, vatRefundCut, beforeO, taxO, osno, taxU, usn };
                  };
                  const prim = atPrice(p);
                  const { commission, adsO, adsU, fastWithdrawO, feesO, feesU, fromO, fromU, vatOut, vatInServices, vatToPay, vatToPayRaw, vatRefundCut, beforeO, taxO, osno, taxU, usn } = prim;

                  // Ценовые сценарии: основная цена + доп. точки {цена, кол-во} — сравнение «оборот vs дороже».
                  const qty = Math.max(1, Math.round(num(it.qty) || 1));
                  const primTurn = Math.max(1, Math.round(num(it.turnoverDays) || 30));
                  const extraPts = (Array.isArray(it.pricePoints) ? it.pricePoints : []).map((pp: any) => ({ price: num(pp.price), qty: Math.max(1, Math.round(num(pp.qty) || 1)), turnoverDays: Math.max(1, Math.round(num(pp.turnoverDays) || 30)) }));
                  const scenPts = [{ price: p, qty, turnoverDays: primTurn }, ...extraPts];
                  // Годовой цикл: за turnoverDays распродаётся партия → 365/turnoverDays оборотов в год.
                  const scen = scenPts.map((pt) => ({ price: pt.price, qty: pt.qty, turnoverDays: pt.turnoverDays, cyclesYear: 365 / pt.turnoverDays, a: atPrice(pt.price) }));
                  const sumS = (f: (s: any) => number) => scen.reduce((acc, s) => acc + f(s), 0);
                  const totalQty = sumS((s) => s.qty);
                  const profOAll = sumS((s) => s.a.osno * s.qty);
                  const profUAll = sumS((s) => s.a.usn * s.qty);
                  const annualO = sumS((s) => s.a.osno * s.qty * s.cyclesYear);
                  const annualU = sumS((s) => s.a.usn * s.qty * s.cyclesYear);

                  // Обнал (ОСНО, на партию): бумажный счёт даёт вычет входного НДС, минус комиссия конторы.
                  const obnalSum = Math.max(0, num(it.obnalSum));
                  const obnalPct = Math.max(0, num(it.obnalPct));
                  const obnalWithdrawPct = Math.max(0, num(it.obnalWithdrawPct));
                  const obnalVat = ex(obnalSum);              // НДС в счёте (22/122) — к вычету, уменьшает НДС партии
                  const obnalFee = obnalSum * obnalPct / 100;  // комиссия за обнал
                  const obnalCash = obnalSum - obnalFee;       // получено наличными
                  const obnalWithdrawSave = obnalCash * obnalWithdrawPct / 100; // экономия vs легальный вывод (дивиденды НДФЛ)
                  const obnalNet = obnalVat - obnalFee + obnalWithdrawSave;     // выгода: НДС − комиссия + экономия на выводе
                  const batch = {
                    qty: totalQty,
                    rev: sumS((s) => s.price * s.qty),
                    costO: costOsnoFull * totalQty, costU: costUsn * totalQty,
                    investO: (costOsnoFull + cash) * totalQty,   // реальные деньги вперёд — с НДС (вычет придёт позже)
                    investU: (costUsn + cash) * totalQty,
                    profO: profOAll, profU: profUAll,
                    taxO: sumS((s) => s.a.taxO * s.qty), taxU: sumS((s) => s.a.taxU * s.qty),
                    vat: importVat * totalQty, duty: duty * totalQty, log: logistics * totalQty,
                    annualO, annualU,
                    scenarios: scen.map((s) => ({ price: s.price, qty: s.qty, turnoverDays: s.turnoverDays, osno: s.a.osno, usn: s.a.usn, annualO: s.a.osno * s.qty * s.cyclesYear, annualU: s.a.usn * s.qty * s.cyclesYear })),
                    obnalSum, obnalPct, obnalVat, obnalFee, obnalCash, obnalWithdrawSave, obnalNet,
                    profOObnal: profOAll + obnalNet,
                  };

                  return { isRuOsno, isRuUsn, rate, purchaseRub, customs, duty, dutyAdv, dutySpecRub, dutyByWeight, importVat, cargo, costOsno, costOsnoFull, costUsn,
                    liters, baseLog, fwd, back, logistics, storage, cash, p, commission, adsO, adsU, fastWithdrawO, feesO, feesU, fromO, fromU,
                    vatOut, vatInServices, vatToPay, vatToPayRaw, vatRefundCut, beforeO, taxO, osno, taxU, usn, qty, batch };
                };

                // Цена, при которой прибыль = m·цена (m — доля). m=0 → безубыток; m>0 → идеальная цена под наценку.
                const priceForMargin = (it: any, pick: (r: any) => number, m: number) => {
                  const c = computeItem(it);
                  let lo = 0;
                  let hi = Math.max(c.costOsno, c.costUsn, 100) * 60 + 20000;
                  const at = (p: number) => pick(computeItem({ ...it, price: p })) - m * p;
                  if (at(hi) < 0) return null;              // при такой марже цена недостижима (издержки съедают всё)
                  for (let i = 0; i < 60; i += 1) { const mid = (lo + hi) / 2; if (at(mid) >= 0) hi = mid; else lo = mid; }
                  return hi;
                };
                const targetM = Math.min(0.95, Math.max(0, num(calcTargetMargin) / 100));
                const rows = calcItems.map((it) => ({
                  it, r: computeItem(it),
                  beO: priceForMargin(it, (x) => x.osno, 0), beU: priceForMargin(it, (x) => x.usn, 0),
                  idO: priceForMargin(it, (x) => x.osno, targetM), idU: priceForMargin(it, (x) => x.usn, targetM),
                }));
                const tot = rows.reduce((a, x) => ({
                  qty: a.qty + x.r.batch.qty,
                  rev: a.rev + x.r.batch.rev, osno: a.osno + x.r.batch.profO, usn: a.usn + x.r.batch.profU,
                  cost: a.cost + x.r.batch.costO, duty: a.duty + x.r.batch.duty, vat: a.vat + x.r.batch.vat, log: a.log + x.r.batch.log,
                  investO: a.investO + x.r.batch.investO, investU: a.investU + x.r.batch.investU,
                  obnal: a.obnal + x.r.batch.obnalNet, osnoObnal: a.osnoObnal + x.r.batch.profOObnal, obnalCash: a.obnalCash + x.r.batch.obnalCash,
                }), { qty: 0, rev: 0, osno: 0, usn: 0, cost: 0, duty: 0, vat: 0, log: 0, investO: 0, investU: 0, obnal: 0, osnoObnal: 0, obnalCash: 0 });

                const Sec = CalcSection;
                const saveBtn = (
                  <button type="button" onClick={saveCalcSettings} disabled={calcSettingsSaving} className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                    {calcSettingsSaving ? 'Сохранение…' : 'Сохранить условия'}
                  </button>
                );

                return (
                  <div className="w-full space-y-4 pb-4">
                    {/* Шапка */}
                    <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 text-white shadow-lg">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-lg font-extrabold leading-tight">Калькулятор юнит-экономики</div>
                          <div className="text-xs text-white/70">ОСНО — официальный ввоз с НДС · УСН — карго и логистика WB</div>
                        </div>
                        <div className="flex items-center gap-2 text-xs bg-white/15 rounded-xl px-3 py-2 backdrop-blur-sm">
                          <span className="text-white/70">ЦБ{cbrDate ? ` ${cbrDate}` : ''}</span>
                          <span className="font-bold tabular-nums">
                            {cbrRates.USD ? `$${cbrRates.USD.toFixed(2)}` : '—'} · {cbrRates.CNY ? `¥${cbrRates.CNY.toFixed(2)}` : '—'} · {cbrRates.EUR ? `€${cbrRates.EUR.toFixed(2)}` : '—'} · {cbrRates.KGS ? `${cbrRates.KGS.toFixed(3)} сом` : '—'}
                          </span>
                          <button type="button" onClick={() => loadCbrRates()} disabled={cbrLoading} className="ml-1 px-2 py-1 rounded-lg bg-white/20 hover:bg-white/30 font-semibold disabled:opacity-50">
                            {cbrLoading ? '…' : 'Обновить'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Настройки — одна карточка, две логические половины */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
                        <div className="font-bold text-slate-900">Общие условия</div>
                        {saveBtn}
                      </div>
                      <div className="grid grid-cols-1 xl:grid-cols-2 divide-y xl:divide-y-0 xl:divide-x divide-slate-200">
                        <div className="p-5">
                          <Sec title="Продажа — оба режима" color="bg-emerald-500">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              <CalcField label="Комиссия WB" value={calcCommissionPct} onChange={setCalcCommissionPct} suffix="%" />
                              <CalcField label="Реклама ОСНО" value={calcAdsPctOsno} onChange={setCalcAdsPctOsno} suffix="%" />
                              <CalcField label="Реклама УСН" value={calcAdsPctUsn} onChange={setCalcAdsPctUsn} suffix="%" />
                              <CalcField label="Сборка (нал.)" value={calcAssembly} onChange={setCalcAssembly} suffix="₽" />
                              <CalcField label="Отвоз до WB (нал.)" value={calcDeliveryToWb} onChange={setCalcDeliveryToWb} suffix="₽" />
                              <CalcField label="Целевая маржа" value={calcTargetMargin} onChange={setCalcTargetMargin} suffix="%" step="1" />
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Ставка УСН</label>
                                <Select value={usnRate} onChange={(e) => setCalcUsnRate(Number(e.target.value))} className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm">
                                  <option value={0.06}>6% «Доходы»</option>
                                  <option value={0.15}>15% «Д − Р»</option>
                                </Select>
                              </div>
                            </div>
                            <label className="mt-3 flex items-start gap-2 cursor-pointer select-none">
                              <input type="checkbox" checked={calcNoVatRefund} onChange={(e) => { const v = e.target.checked; setCalcNoVatRefund(v); try { localStorage.setItem('calc_no_vat_refund_v1', v ? '1' : '0'); } catch {} }} className="w-4 h-4 accent-indigo-600 mt-0.5" />
                              <span className="text-xs text-slate-600">
                                Не учитывать возмещение НДС
                                <span className="block text-[11px] text-slate-400">Консервативный безубыток — без расчёта на возврат из бюджета</span>
                              </span>
                            </label>
                            <label className="mt-2 flex items-start gap-2 cursor-pointer select-none">
                              <input type="checkbox" checked={calcHideObnal} onChange={(e) => { const v = e.target.checked; setCalcHideObnal(v); try { localStorage.setItem('calc_hide_obnal_v1', v ? '1' : '0'); } catch {} }} className="w-4 h-4 accent-indigo-600 mt-0.5" />
                              <span className="text-xs text-slate-600">
                                Скрыть обнал из расчёта
                                <span className="block text-[11px] text-slate-400">Прячет блок обнала и убирает его из итогов</span>
                              </span>
                            </label>
                            <label className="mt-2 flex items-start gap-2 cursor-pointer select-none">
                              <input type="checkbox" checked={calcUsnCashExpense} onChange={(e) => { const v = e.target.checked; setCalcUsnCashExpense(v); try { localStorage.setItem('calc_usn_cash_expense_v1', v ? '1' : '0'); } catch {} }} className="w-4 h-4 accent-indigo-600 mt-0.5" />
                              <span className="text-xs text-slate-600">
                                Сборку и отвоз — в расходы УСН
                                <span className="block text-[11px] text-slate-400">Уменьшают базу УСН «Доходы−Расходы» (нужны документы)</span>
                              </span>
                            </label>
                            <div className="mt-2 flex items-start gap-2">
                              <input type="checkbox" checked={calcFastWithdraw} onChange={(e) => { const v = e.target.checked; setCalcFastWithdraw(v); try { localStorage.setItem('calc_fast_withdraw_v1', v ? '1' : '0'); } catch {} }} className="w-4 h-4 accent-indigo-600 mt-0.5 cursor-pointer" />
                              <div className="text-xs text-slate-600">
                                <div className="flex items-center gap-2">
                                  <span>Быстрый вывод WB · ОСНО</span>
                                  <CalcInput value={calcFastWithdrawPct} onChange={setCalcFastWithdrawPct} step="0.5" className="w-14 px-2 py-1 border border-slate-300 rounded-md text-xs" />
                                  <span className="text-slate-400">%</span>
                                </div>
                                <span className="block text-[11px] text-slate-400">WB забирает % с суммы к перечислению за ускоренную выплату</span>
                              </div>
                            </div>
                          </Sec>
                        </div>

                        <div className="p-5">
                          <Sec
                            title="Логистика, хранение и карго — УСН"
                            color="bg-indigo-500"
                            right={<button type="button" onClick={() => setWbTariffsOpen((v) => !v)} className="text-xs font-semibold text-indigo-600 hover:underline">{wbTariffsOpen ? 'Скрыть тарифы' : 'Тарифы WB'}</button>}
                          >
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              <CalcField label="Выкуп" value={wbBuyoutPct} onChange={setWbBuyoutPct} suffix="%" />
                              <CalcField label="Коэф. склада" value={wbWarehouseCoef} onChange={setWbWarehouseCoef} suffix="%" />
                              <CalcField label="Индекс локал." value={wbLocalIndex} onChange={setWbLocalIndex} />
                              <CalcField label="Дни хранения" value={wbStorageDays} onChange={setWbStorageDays} suffix="дн" />
                              <CalcField label="Коэф. хранения" value={wbStorageCoef} onChange={setWbStorageCoef} suffix="%" />
                              <CalcField label="Карго" value={calcCargoPerKg} onChange={setCalcCargoPerKg} suffix="₽/кг" />
                            </div>
                            <div className="mt-2 text-[11px] text-slate-500">Карго — серый ввоз для УСН: платишь за вес, пошлины и вычета НДС нет. На ОСНО вместо него официальный ввоз (блок в карточке товара).</div>
                            {wbTariffsOpen && (
                              <div className="mt-3 pt-3 border-t border-slate-200">
                                <div className="text-[11px] text-slate-500 mb-2">Тарифы с 15.09.2025. До 1 л — плата за товар целиком, от 1 л — база + доп. литры дробно. Обратная логистика с 20.03.2026 — без коэффициентов.</div>
                                <div className="grid grid-cols-5 gap-2 mb-2">
                                  {['≤0.2 л', '≤0.4 л', '≤0.6 л', '≤0.8 л', '≤1.0 л'].map((lbl, i) => (
                                    <CalcField key={lbl} label={lbl} value={wbTiers[i]} onChange={(v: number) => setWbTiers((prev) => prev.map((x, j) => j === i ? v : x))} suffix="₽" />
                                  ))}
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <CalcField label="База от 1 л" value={wbBase1L} onChange={setWbBase1L} suffix="₽" />
                                  <CalcField label="Доп. литр" value={wbExtraL} onChange={setWbExtraL} suffix="₽" />
                                  <CalcField label="Хранение ₽/л/день" value={wbStorageTariff} onChange={setWbStorageTariff} suffix="₽" />
                                </div>
                              </div>
                            )}
                          </Sec>
                        </div>
                      </div>
                    </div>

                    {/* Пустой экран — выбор: новый товар или сохранённый */}
                    {calcItems.length === 0 && (
                      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                        <div className="text-4xl mb-2">🧮</div>
                        <div className="text-lg font-extrabold text-slate-800 mb-1">Начните расчёт товара</div>
                        <div className="text-sm text-slate-500 mb-5">Создайте новый товар или откройте сохранённый</div>
                        <div className="flex flex-wrap justify-center gap-3">
                          <button type="button" onClick={() => setCalcItems([makeCalcItem(1)])} className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-sm">+ Новый товар</button>
                          {calcSavedProducts.length > 0 && (
                            <button type="button" onClick={() => { loadCalcSavedProducts(); setCalcPickerOpen(true); }} className="px-6 py-3 rounded-xl border-2 border-emerald-300 text-emerald-700 font-bold hover:bg-emerald-50">Все сохранённые ({calcSavedProducts.length})</button>
                          )}
                        </div>
                        {calcSavedProducts.length > 0 && (
                          <div className="mt-6 pt-5 border-t border-slate-100">
                            <div className="text-xs font-semibold text-slate-500 mb-2">Быстрый выбор</div>
                            <div className="flex flex-wrap justify-center gap-2">
                              {calcSavedProducts.slice(0, 12).map((s: any, i: number) => (
                                <button key={i} type="button" onClick={() => applySaved(s)} className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 transition-colors">
                                  {s?.name || 'Товар'}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Позиции */}
                    {rows.map(({ it, r, beO, beU, idO, idU }, idx) => {
                      const cat = IMPORT_CATEGORIES.find((c) => c.key === it.category);
                      const country = IMPORT_COUNTRIES.find((c) => c.key === it.country);
                      const win = r.osno >= r.usn;
                      const osnoSrc = it.osnoSource || (it.source === 'ru' ? 'ru' : 'import');
                      const usnSrc = it.usnSource || (it.source === 'ru' ? 'ru' : 'cargo');
                      const needForeign = osnoSrc === 'import' || usnSrc === 'cargo';
                      // Все методы сразу — чтобы видеть разницу без переключения.
                      const countryLabel = (k: string) => IMPORT_COUNTRIES.find((c) => c.key === k)?.label || k;
                      // ОСНО: официальный ввоз (текущий + все варианты) и закупка в РФ.
                      const importOpts = [
                        { key: 'import', label: 'Текущий', purchase: it.purchase, currency: it.currency, country: it.country, delivery: it.deliveryToBorder, turn: it.turnoverDays },
                        ...((it.importVariants || []).map((v: any, i: number) => ({ key: `imp${i}`, label: `#${i + 2}`, purchase: v.purchase, currency: v.currency, country: v.country, delivery: v.deliveryToBorder, turn: v.turnoverDays }))),
                      ];
                      const ruTurn = it.ruTurnoverDays ?? 30;
                      const osnoCmp = importOpts.map((o) => {
                        const b = computeItem({ ...it, osnoSource: 'import', purchase: o.purchase, currency: o.currency, country: o.country, deliveryToBorder: o.delivery, turnoverDays: o.turn ?? it.turnoverDays }).batch;
                        return {
                          label: 'Офиц. ввоз',
                          sub: `${o.currency} · ${countryLabel(o.country)} · ${o.turn ?? 30} дн`,
                          prof: b.profO, annual: b.annualO,
                          active: osnoSrc === 'import' && o.key === 'import',
                          onClick: () => upd(it.id, { osnoSource: 'import', purchase: o.purchase, currency: o.currency, country: o.country, deliveryToBorder: o.delivery, turnoverDays: o.turn ?? it.turnoverDays }),
                        };
                      });
                      const osnoRuB = computeItem({ ...it, osnoSource: 'ru', turnoverDays: ruTurn }).batch;
                      osnoCmp.push({ label: 'Закупка в РФ', sub: `${ruTurn} дн`, prof: osnoRuB.profO, annual: osnoRuB.annualO, active: osnoSrc === 'ru', onClick: () => upd(it.id, { osnoSource: 'ru', turnoverDays: ruTurn }) });
                      const usnCargoB = computeItem({ ...it, usnSource: 'cargo' }).batch;
                      const usnRuB = computeItem({ ...it, usnSource: 'ru', turnoverDays: ruTurn }).batch;
                      const usnCmp = [
                        { label: 'Карго', sub: `${needForeign ? it.currency + ' · ' : ''}${it.turnoverDays ?? 30} дн`, prof: usnCargoB.profU, annual: usnCargoB.annualU, active: usnSrc === 'cargo', onClick: () => upd(it.id, { usnSource: 'cargo' }) },
                        { label: 'Закупка в РФ', sub: `${ruTurn} дн`, prof: usnRuB.profU, annual: usnRuB.annualU, active: usnSrc === 'ru', onClick: () => upd(it.id, { usnSource: 'ru', turnoverDays: ruTurn }) },
                      ];
                      return (
                        <div key={it.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                          <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                            <span className="w-6 h-6 rounded-lg bg-slate-800 text-white text-xs font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                            <input value={it.name} onChange={(e) => upd(it.id, { name: e.target.value })} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-semibold min-w-[160px] bg-white" />
                            <span className="text-xs px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-500 tabular-nums">{r.liters.toFixed(2)} л</span>
                            <button type="button" onClick={() => setCalcSaveModal({ open: true, itemId: it.id, name: String(it.name || '') })} className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100">Сохранить</button>
                            <div className="ml-auto flex items-center gap-2">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${win ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>{win ? 'ОСНО' : 'УСН'} +{money(Math.abs(r.osno - r.usn))} ₽</span>
                              {calcItems.length > 1 && <button type="button" onClick={() => setCalcItems((prev) => prev.filter((x) => x.id !== it.id))} className="w-7 h-7 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 text-sm">×</button>}
                            </div>
                          </div>

                          <div className="p-4 space-y-4">
                            {/* Общие параметры товара */}
                            <Sec title="Товар" color="bg-sky-500">
                              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-8 gap-3">
                                <CalcField label="Цена продажи" value={it.price} onChange={(v: number) => upd(it.id, { price: v })} suffix="₽" />
                                <CalcField label="Партия" value={it.qty ?? 1} onChange={(v: number) => upd(it.id, { qty: v })} suffix="шт" step="1" />
                                <CalcField label="Оборот" value={it.turnoverDays ?? 30} onChange={(v: number) => upd(it.id, { turnoverDays: v })} suffix="дн" step="1" />
                                <CalcField label="Длина, см" value={it.len} onChange={(v: number) => upd(it.id, { len: v })} />
                                <CalcField label="Ширина, см" value={it.wid} onChange={(v: number) => upd(it.id, { wid: v })} />
                                <CalcField label="Высота, см" value={it.hei} onChange={(v: number) => upd(it.id, { hei: v })} />
                                <CalcField label="Вес, кг" value={it.weightKg} onChange={(v: number) => upd(it.id, { weightKg: v })} />
                                <div className="flex flex-col justify-end pb-2 text-[11px] text-slate-500">
                                  <span>Объём <b className="text-slate-700">{r.liters.toFixed(3)} л</b></span>
                                  <span>Тариф WB <b className="text-slate-700">{money(r.baseLog)} ₽</b></span>
                                </div>
                              </div>
                              {/* Доп. ценовые сценарии — сравнить «оборачивать дешевле» vs «продавать дороже» */}
                              {(it.pricePoints || []).map((pp: any, i: number) => (
                                <div key={i} className="mt-2 flex flex-wrap items-end gap-3 rounded-lg bg-sky-50/60 border border-sky-100 px-3 py-2">
                                  <span className="text-[11px] font-semibold text-sky-700 pb-2">Цена {i + 2}</span>
                                  <CalcField label="Цена продажи" value={pp.price} onChange={(v: number) => updPricePoint(it, i, { price: v })} suffix="₽" />
                                  <CalcField label="Партия" value={pp.qty} onChange={(v: number) => updPricePoint(it, i, { qty: v })} suffix="шт" step="1" />
                                  <CalcField label="Оборот" value={pp.turnoverDays ?? 30} onChange={(v: number) => updPricePoint(it, i, { turnoverDays: v })} suffix="дн" step="1" />
                                  <button type="button" onClick={() => delPricePoint(it, i)} className="mb-2 w-7 h-7 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 text-sm">×</button>
                                </div>
                              ))}
                              <button type="button" onClick={() => addPricePoint(it)} className="mt-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-sky-300 text-sky-700 hover:bg-sky-50">+ ещё цена</button>
                            </Sec>

                            {(() => {
                              const setOsno = (v: string) => upd(it.id, { osnoSource: v });
                              const setUsn = (v: string) => upd(it.id, { usnSource: v });
                              return (
                              <Sec title="Себестоимость" color="bg-amber-500">
                                {/* Источник считается отдельно для каждого режима */}
                                <div className="flex flex-wrap items-center gap-4 mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-emerald-700">ОСНО</span>
                                    <div className="inline-flex rounded-lg border border-slate-300 overflow-hidden text-xs bg-white">
                                      <button type="button" onClick={() => setOsno('import')} className={`px-3 py-1.5 font-medium ${osnoSrc === 'import' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Офиц. ввоз</button>
                                      <button type="button" onClick={() => setOsno('ru')} className={`px-3 py-1.5 font-medium ${osnoSrc === 'ru' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Закупка в РФ</button>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-indigo-700">УСН</span>
                                    <div className="inline-flex rounded-lg border border-slate-300 overflow-hidden text-xs bg-white">
                                      <button type="button" onClick={() => setUsn('cargo')} className={`px-3 py-1.5 font-medium ${usnSrc === 'cargo' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Карго</button>
                                      <button type="button" onClick={() => setUsn('ru')} className={`px-3 py-1.5 font-medium ${usnSrc === 'ru' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Закупка в РФ</button>
                                    </div>
                                  </div>
                                </div>

                                {/* Валютная закупка — нужна для офиц. ввоза (ОСНО) и/или карго (УСН) */}
                                {needForeign && (
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">Закупка за ед. <span className="text-slate-400">(валюта)</span></label>
                                      <div className="flex items-center gap-1">
                                        <CalcInput value={it.purchase} onChange={(v: number) => upd(it.id, { purchase: v })} className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm" />
                                        <Select value={it.currency} onChange={(e) => upd(it.id, { currency: e.target.value })} className="px-1 py-2 border border-slate-300 rounded-lg text-xs">
                                          {['CNY', 'USD', 'EUR', 'RUB', 'TRY', 'KGS'].map((c) => <option key={c} value={c}>{c}</option>)}
                                        </Select>
                                      </div>
                                    </div>
                                    <CalcField label="Курс (0 = ЦБ)" value={it.rateManual} onChange={(v: number) => upd(it.id, { rateManual: v })} />
                                    {usnSrc === 'cargo' && <div className="flex flex-col justify-end pb-2 text-[11px] text-slate-500 md:col-span-2">Карго УСН = закупка + вес × {calcCargoPerKg} ₽/кг (без пошлины и НДС)</div>}
                                  </div>
                                )}

                                {/* ОСНО — официальный ввоз: страна, категория, пошлина, ввозной НДС */}
                                {osnoSrc === 'import' && (<>
                                  <div className="text-[11px] font-semibold text-emerald-700 mb-1">ОСНО · официальный ввоз</div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">Страна</label>
                                      <Select value={it.country} onChange={(e) => upd(it.id, { country: e.target.value })} className="w-full px-2 py-2 border border-slate-300 rounded-lg text-xs">
                                        {IMPORT_COUNTRIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                                      </Select>
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-medium text-slate-600 mb-1">Категория</label>
                                      <Select value={it.category} onChange={(e) => applyCategory(it.id, e.target.value)} className="w-full px-2 py-2 border border-slate-300 rounded-lg text-xs">
                                        {IMPORT_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                                      </Select>
                                    </div>
                                    <CalcField label="Доставка до РФ" value={it.deliveryToBorder} onChange={(v: number) => upd(it.id, { deliveryToBorder: v })} suffix="₽" />
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3">
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">Тип пошлины</label>
                                      <Select value={it.dutyType} onChange={(e) => upd(it.id, { dutyType: e.target.value })} className="w-full px-2 py-2 border border-slate-300 rounded-lg text-xs">
                                        <option value="adv">Адвалорная (%)</option>
                                        <option value="spec">Специфическая (€)</option>
                                        <option value="comb">Комбинированная</option>
                                      </Select>
                                    </div>
                                    <CalcField label="Ставка" value={it.dutyPct} onChange={(v: number) => upd(it.id, { dutyPct: v })} suffix="%" />
                                    <CalcField label="Ставка" value={it.dutySpec} onChange={(v: number) => upd(it.id, { dutySpec: v })} suffix="€" />
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">За единицу</label>
                                      <Select value={it.dutyUnit} onChange={(e) => upd(it.id, { dutyUnit: e.target.value })} className="w-full px-2 py-2 border border-slate-300 rounded-lg text-xs">
                                        <option value="kg">€ / кг</option>
                                        <option value="pair">€ / шт</option>
                                      </Select>
                                    </div>
                                    <CalcField label="НДС ввозной" value={it.vatPct} onChange={(v: number) => upd(it.id, { vatPct: v })} suffix="%" />
                                  </div>
                                  {(cat?.note || country?.note) && (
                                    <div className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                      {cat?.note ? <>{cat.note}. </> : null}{country?.note}
                                    </div>
                                  )}

                                  {/* Варианты ввоза — сравнить разные поставки одного товара */}
                                  <div className="mt-3 pt-3 border-t border-amber-200">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-[11px] font-semibold text-emerald-700">Варианты ввоза — сравнить поставки</span>
                                      <button type="button" onClick={() => addImportVariant(it)} className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50">+ вариант ввоза</button>
                                    </div>
                                    {(it.importVariants || []).map((v: any, i: number) => (
                                      <div key={i} className="mb-2 flex flex-wrap items-end gap-2 rounded-lg bg-white border border-slate-200 px-2 py-2">
                                        <span className="text-[11px] font-semibold text-slate-500 pb-2">#{i + 2}</span>
                                        <div>
                                          <label className="block text-xs font-medium text-slate-600 mb-1">Закупка за ед.</label>
                                          <div className="flex items-center gap-1">
                                            <CalcInput value={v.purchase} onChange={(x: number) => updImportVariant(it, i, { purchase: x })} className="w-24 px-2 py-2 border border-slate-300 rounded-lg text-sm" />
                                            <Select value={v.currency} onChange={(e) => updImportVariant(it, i, { currency: e.target.value })} className="px-1 py-2 border border-slate-300 rounded-lg text-xs">
                                              {['CNY', 'USD', 'EUR', 'RUB', 'TRY', 'KGS'].map((c) => <option key={c} value={c}>{c}</option>)}
                                            </Select>
                                          </div>
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-slate-600 mb-1">Страна</label>
                                          <Select value={v.country} onChange={(e) => updImportVariant(it, i, { country: e.target.value })} className="px-2 py-2 border border-slate-300 rounded-lg text-xs">
                                            {IMPORT_COUNTRIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                                          </Select>
                                        </div>
                                        <CalcField label="Доставка до РФ" value={v.deliveryToBorder} onChange={(x: number) => updImportVariant(it, i, { deliveryToBorder: x })} suffix="₽" />
                                        <CalcField label="Оборот" value={v.turnoverDays ?? 30} onChange={(x: number) => updImportVariant(it, i, { turnoverDays: x })} suffix="дн" step="1" />
                                        <button type="button" onClick={() => delImportVariant(it, i)} className="mb-2 w-7 h-7 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 text-sm">×</button>
                                      </div>
                                    ))}
                                    {(() => {
                                      const variants = [{ label: 'Текущий', ov: null as any }, ...(it.importVariants || []).map((v: any, i: number) => ({ label: `#${i + 2}`, ov: v }))];
                                      if (variants.length < 2) return null;
                                      const rows = variants.map((vr) => {
                                        const merged = vr.ov ? { ...it, osnoSource: 'import', purchase: vr.ov.purchase, currency: vr.ov.currency, country: vr.ov.country, deliveryToBorder: vr.ov.deliveryToBorder, turnoverDays: vr.ov.turnoverDays } : { ...it, osnoSource: 'import' };
                                        const rr = computeItem(merged);
                                        const ctry = vr.ov ? vr.ov.country : it.country;
                                        const turn = vr.ov ? (vr.ov.turnoverDays ?? 30) : (it.turnoverDays ?? 30);
                                        return { label: vr.label, cost: rr.costOsnoFull, prof: rr.batch.profO, annual: rr.batch.annualO, turn, country: IMPORT_COUNTRIES.find((c) => c.key === ctry)?.label || ctry };
                                      });
                                      const best = rows.reduce((a, b) => (b.prof > a.prof ? b : a), rows[0]);
                                      return (
                                        <div className="mt-1 overflow-x-auto">
                                          <table className="w-full text-xs tabular-nums">
                                            <thead>
                                              <tr className="text-slate-400 text-[10px] uppercase">
                                                <th className="text-left font-medium py-0.5">Вариант</th>
                                                <th className="text-left font-medium">Страна</th>
                                                <th className="text-right font-medium">Себест/ед</th>
                                                <th className="text-right font-medium text-emerald-600">Прибыль партии</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {rows.map((row, i) => (
                                                <tr key={i} className="border-t border-slate-100">
                                                  <td className="text-left py-1 text-slate-600 font-medium">{row.label}{best.label === row.label && rows.length > 1 && <span className="ml-1 text-[9px] font-bold text-emerald-600 bg-emerald-100 rounded px-1">лучший</span>}</td>
                                                  <td className="text-left text-slate-500">{row.country}</td>
                                                  <td className="text-right text-slate-700">{money(row.cost)} ₽</td>
                                                  <td className={`text-right font-semibold ${row.prof < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{money(row.prof)} ₽</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </>)}

                                {/* ОСНО — закупка в РФ: себестоимость с НДС */}
                                {osnoSrc === 'ru' && (<>
                                  <div className="text-[11px] font-semibold text-emerald-700 mb-1 mt-1">ОСНО · закупка в РФ</div>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    <CalcField label="Себестоимость ОСНО (с НДС)" value={it.costRu} onChange={(v: number) => upd(it.id, { costRu: v })} suffix="₽" />
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">НДС в закупке</label>
                                      <Select value={it.vatPct} onChange={(e) => upd(it.id, { vatPct: Number(e.target.value) })} className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm">
                                        <option value={22}>22% — обычный поставщик</option>
                                        <option value={10}>10% — льготный товар</option>
                                        <option value={0}>0% — поставщик без НДС</option>
                                      </Select>
                                    </div>
                                    <CalcField label="Оборот закупки РФ" value={it.ruTurnoverDays ?? 30} onChange={(v: number) => upd(it.id, { ruTurnoverDays: v })} suffix="дн" step="1" />
                                  </div>
                                </>)}

                                {/* УСН — закупка в РФ: своя себестоимость */}
                                {usnSrc === 'ru' && (
                                  <div className="mt-3">
                                    <div className="text-[11px] font-semibold text-indigo-700 mb-1">УСН · закупка в РФ</div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                      <CalcField label="Себестоимость УСН (с НДС)" value={it.costRuUsn} onChange={(v: number) => upd(it.id, { costRuUsn: v })} suffix="₽" />
                                      {osnoSrc !== 'ru' && <CalcField label="Оборот закупки РФ" value={it.ruTurnoverDays ?? 30} onChange={(v: number) => upd(it.id, { ruTurnoverDays: v })} suffix="дн" step="1" />}
                                    </div>
                                  </div>
                                )}
                              </Sec>
                              );
                            })()}

                            {/* Результат — две самодостаточные колонки */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/30 p-4">
                                <div className="text-xs font-bold uppercase tracking-wide text-emerald-700 mb-2">ОСНО · {r.isRuOsno ? 'закупка в РФ' : 'официальный ввоз'} · НДС 22% + 25%</div>
                                {!r.isRuOsno && <><CalcRow label="Закупка" value={r.purchaseRub} base={r.p} />
                                <CalcRow label="Доставка до РФ" value={r.customs - r.purchaseRub} base={r.p} />
                                {Math.abs(r.duty) > 0.005 && <CalcRow label={`Пошлина${r.dutyByWeight ? ' (по весу)' : ''}`} value={r.duty} base={r.p} />}
                                {r.importVat > 0.005 && <CalcRow label="Ввозной НДС" value={r.importVat} base={r.p} hint="в себестоимости" />}</>}
                                {r.isRuOsno && <CalcRow label="Закупка с НДС" value={r.purchaseRub} base={r.p} />}
                                <CalcRow label="Себестоимость с НДС" value={r.costOsnoFull} base={r.p} strong tone="border-emerald-200 text-slate-800" />
                                <div className="h-2" />
                                <CalcRow label="Цена продажи" value={r.p} base={r.p} />
                                <CalcRow label="Комиссия WB" value={-r.commission} base={r.p} />
                                <CalcRow label="Реклама" value={-r.adsO} base={r.p} />
                                {r.fastWithdrawO > 0.005 && <CalcRow label="Быстрый вывод" value={-r.fastWithdrawO} base={r.p} hint={`${calcFastWithdrawPct}% с к перечислению`} />}
                                <div className="flex justify-between py-0.5 text-slate-400 text-xs"><span>Логистика и хранение</span><span className="italic">не применяются</span></div>
                                <CalcRow label="Пришло от WB" value={r.fromO} base={r.p} />
                                <CalcRow label="Себестоимость с НДС" value={-r.costOsnoFull} base={r.p} />
                                <CalcRow label="Заработок (наценка)" value={r.fromO - r.costOsno} base={r.p} hint="пришло − себестоимость" tone="bg-emerald-100/70 rounded-lg px-2 -mx-1 my-1 text-emerald-900 font-bold" />
                                {(r.importVat > 0.005 || r.vatInServices > 0.005) && <CalcRow label="НДС к вычету" value={r.importVat + r.vatInServices} base={r.p} hint={`${r.isRuOsno ? 'входной' : 'ввозной'} ${money(r.importVat)} + услуги ${money(r.vatInServices)}`} />}
                                <CalcRow label="НДС к уплате" value={-(r.vatToPay + r.vatInServices)} base={r.p} hint={`с продажи ${money(r.vatOut)} за вычетом входного`} />
                                {r.vatRefundCut > 0 && <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 my-1">Возмещение {money(r.vatRefundCut)} ₽ не учтено</div>}
                                <CalcRow label="Налог 25%" value={-r.taxO} base={r.p} />
                                {r.cash > 0 && <CalcRow label="Сборка и отвоз" value={-r.cash} base={r.p} hint="нал." />}
                                <CalcRow label="Прибыль" value={r.osno} base={r.p} strong tone={`border-emerald-300 ${r.osno < 0 ? 'text-rose-600' : 'text-emerald-700'}`} />
                                <div className="text-[11px] text-slate-500 mt-1">ROI {pctOf(r.osno, r.costOsnoFull)} · безубыток <b className="text-slate-700">{beO == null ? '—' : `${money(Math.ceil(beO))} ₽`}</b></div>
                                <div className="text-[11px] mt-1 flex items-center justify-between gap-2 rounded-lg bg-emerald-50 border border-emerald-100 px-2 py-1">
                                  <span className="text-emerald-700">Идеальная цена <span className="text-emerald-500">·{calcTargetMargin}% маржи</span></span>
                                  <b className="text-emerald-800 tabular-nums">{idO == null ? '—' : `${money(Math.ceil(idO))} ₽`}</b>
                                </div>
                              </div>

                              <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/30 p-4">
                                <div className="text-xs font-bold uppercase tracking-wide text-indigo-700 mb-2">УСН {usnRate === 0.06 ? '6%' : '15%'} · {r.isRuUsn ? 'закупка в РФ' : 'карго'} · без НДС</div>
                                {!r.isRuUsn && <><CalcRow label="Закупка" value={r.costUsn - r.cargo} base={r.p} />
                                <CalcRow label="Карго" value={r.cargo} base={r.p} hint={`${it.weightKg} кг × ${calcCargoPerKg} ₽`} /></>}
                                {r.isRuUsn && <CalcRow label="Закупка с НДС" value={r.costUsn} base={r.p} />}
                                <CalcRow label="Себестоимость" value={r.costUsn} base={r.p} strong tone="border-indigo-200 text-slate-800" />
                                <div className="h-2" />
                                <CalcRow label="Цена продажи" value={r.p} base={r.p} />
                                <CalcRow label="Комиссия WB" value={-r.commission} base={r.p} />
                                <CalcRow label="Реклама" value={-r.adsU} base={r.p} />
                                <CalcRow label="Логистика WB" value={-r.logistics} base={r.p} hint={`выкуп ${(B * 100).toFixed(0)}%`} />
                                <CalcRow label="Хранение" value={-r.storage} base={r.p} hint={`${wbStorageDays} дн`} />
                                <CalcRow label="Пришло от WB" value={r.fromU} base={r.p} />
                                <CalcRow label="Себестоимость" value={-r.costUsn} base={r.p} />
                                <CalcRow label="Заработок (наценка)" value={r.fromU - r.costUsn} base={r.p} hint="пришло − себестоимость" tone="bg-indigo-100/70 rounded-lg px-2 -mx-1 my-1 text-indigo-900 font-bold" />
                                <CalcRow label="Налог" value={-r.taxU} base={r.p} />
                                {r.cash > 0 && <CalcRow label="Сборка и отвоз" value={-r.cash} base={r.p} hint="нал." />}
                                <CalcRow label="Прибыль" value={r.usn} base={r.p} strong tone={`border-indigo-300 ${r.usn < 0 ? 'text-rose-600' : 'text-indigo-700'}`} />
                                <div className="text-[11px] text-slate-500 mt-1">ROI {pctOf(r.usn, r.costUsn)} · безубыток <b className="text-slate-700">{beU == null ? '—' : `${money(Math.ceil(beU))} ₽`}</b></div>
                                <div className="text-[11px] mt-1 flex items-center justify-between gap-2 rounded-lg bg-indigo-50 border border-indigo-100 px-2 py-1">
                                  <span className="text-indigo-700">Идеальная цена <span className="text-indigo-400">·{calcTargetMargin}% маржи</span></span>
                                  <b className="text-indigo-800 tabular-nums">{idU == null ? '—' : `${money(Math.ceil(idU))} ₽`}</b>
                                </div>
                                <div className="text-[11px] text-slate-400 mt-1">Логистика: {money(r.fwd)} прямая / {(B * 100).toFixed(0)}% + {money(r.back)} возврат</div>
                              </div>
                            </div>

                            {/* Сравнение методов — оба варианта сразу */}
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                              <div className="text-xs font-bold text-slate-700 mb-2">Сравнение методов · прибыль партии</div>
                              <div className="grid grid-cols-2 gap-3">
                                {([
                                  { title: 'ОСНО', tc: 'text-emerald-700', dot: 'bg-emerald-500', rows: osnoCmp },
                                  { title: 'УСН', tc: 'text-indigo-700', dot: 'bg-indigo-500', rows: usnCmp },
                                ]).map((g) => {
                                  const profs = g.rows.map((x) => x.prof);
                                  const maxP = Math.max(...profs);
                                  const minP = Math.min(...profs);
                                  return (
                                    <div key={g.title}>
                                      <div className={`text-[11px] font-bold ${g.tc} mb-1`}>{g.title}</div>
                                      <div className="space-y-1">
                                        {g.rows.map((row, ri) => {
                                          const isBest = row.prof === maxP && maxP - minP > 0.5;
                                          return (
                                            <button key={ri} type="button" onClick={row.onClick}
                                              className={`w-full flex flex-col gap-0.5 text-xs rounded-lg px-2 py-1.5 border transition-colors ${row.active ? 'bg-white border-slate-300 shadow-sm' : 'border-transparent hover:bg-white/60'}`}>
                                              <span className="flex items-center justify-between gap-2">
                                                <span className="flex items-center gap-1.5 min-w-0">
                                                  <span className={`w-2 h-2 rounded-full shrink-0 ${row.active ? g.dot : 'bg-slate-300'}`} />
                                                  <span className="text-slate-700 font-medium truncate">{row.label}</span>
                                                  {isBest && <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 rounded px-1 shrink-0">выгоднее</span>}
                                                </span>
                                                <span className={`shrink-0 font-bold tabular-nums text-right ${row.prof < 0 ? 'text-rose-600' : 'text-slate-800'}`}>{money(row.prof)} ₽</span>
                                              </span>
                                              {row.sub ? <span className="text-[10px] text-slate-400 text-left pl-3.5">{row.sub}</span> : null}
                                            </button>
                                          );
                                        })}
                                      </div>
                                      <div className="text-[10px] text-slate-400 mt-1">разница {money(maxP - minP)} ₽</div>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-2">Клик по методу — выбрать его для детального расчёта в колонках выше.</div>
                            </div>

                            {/* Итоги партии */}
                            <div className="rounded-xl border border-slate-200 bg-white p-3">
                              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                                <div className="text-xs font-bold text-slate-700">Партия {r.batch.qty} шт</div>
                                <div className="text-xs text-slate-500">Выручка <b className="text-slate-900 tabular-nums">{money(r.batch.rev)} ₽</b></div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                {([
                                  { key: 'osno', title: 'ОСНО', bc: 'border-emerald-200 bg-emerald-50/40', tc: 'text-emerald-700', invest: r.batch.investO, prof: r.batch.profO, annual: r.batch.annualO, pc: r.batch.profO < 0 ? 'text-rose-600' : 'text-emerald-700' },
                                  { key: 'usn', title: 'УСН', bc: 'border-indigo-200 bg-indigo-50/40', tc: 'text-indigo-700', invest: r.batch.investU, prof: r.batch.profU, annual: r.batch.annualU, pc: r.batch.profU < 0 ? 'text-rose-600' : 'text-indigo-700' },
                                ]).map((g) => (
                                  <div key={g.key} className={`rounded-lg border ${g.bc} p-2.5`}>
                                    <div className={`text-[11px] font-bold ${g.tc} mb-1.5`}>{g.title}</div>
                                    <div className="space-y-1 text-xs">
                                      <div className="flex justify-between"><span className="text-slate-500">Вложения</span><span className="font-semibold tabular-nums text-slate-800">{money(g.invest)} ₽</span></div>
                                      <div className="flex justify-between"><span className="text-slate-500">Прибыль</span><span className={`font-extrabold tabular-nums ${g.pc}`}>{money(g.prof)} ₽</span></div>
                                      <div className="flex justify-between"><span className="text-slate-400">Маржа</span><span className="tabular-nums text-slate-500">{pctOf(g.prof, r.batch.rev)}</span></div>
                                      <div className="flex justify-between"><span className="text-slate-400">ROI</span><span className="tabular-nums text-slate-500">{pctOf(g.prof, g.invest)}</span></div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {r.batch.scenarios && r.batch.scenarios.length > 1 && (
                                <div className="mt-3 pt-2 border-t border-slate-200">
                                  <div className="text-[11px] font-semibold text-slate-600 mb-1">По ценам · оборот vs дороже</div>
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-xs tabular-nums">
                                      <thead>
                                        <tr className="text-slate-400 text-[10px] uppercase">
                                          <th className="text-left font-medium py-0.5">Цена × кол-во</th>
                                          <th className="text-right font-medium">Срок</th>
                                          <th className="text-right font-medium">Выручка</th>
                                          <th className="text-right font-medium text-emerald-600">Прибыль ОСНО</th>
                                          <th className="text-right font-medium text-indigo-600">Прибыль УСН</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {r.batch.scenarios.map((s: any, i: number) => (
                                          <tr key={i} className="border-t border-slate-100">
                                            <td className="text-left py-1 text-slate-600">{money(s.price)} ₽ × {s.qty}</td>
                                            <td className="text-right text-slate-500">{s.turnoverDays} дн</td>
                                            <td className="text-right text-slate-700">{money(s.price * s.qty)} ₽</td>
                                            <td className={`text-right font-semibold ${s.osno < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{money(s.osno * s.qty)} ₽</td>
                                            <td className={`text-right font-semibold ${s.usn < 0 ? 'text-rose-600' : 'text-indigo-700'}`}>{money(s.usn * s.qty)} ₽</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                              <div className="mt-2 text-[10px] text-slate-400 leading-snug">Вложения — деньги на закупку и завоз всей партии до первой продажи (ОСНО: товар + пошлина + ввозной НДС + сборка; УСН: товар + карго + сборка). Маржа — % прибыли от выручки, ROI — от вложений.</div>
                            </div>

                            {/* Обнал — только ОСНО, на партию */}
                            {!calcHideObnal && <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-xs font-bold text-amber-800">Обнал · ОСНО, на партию</div>
                                <div className="text-[10px] text-amber-600">бумажный НДС к вычету</div>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-2">
                                <CalcField label="Сумма счёта (с НДС)" value={it.obnalSum ?? 0} onChange={(v: number) => upd(it.id, { obnalSum: v })} suffix="₽" />
                                <CalcField label="Комиссия конторы" value={it.obnalPct ?? 0} onChange={(v: number) => upd(it.id, { obnalPct: v })} suffix="%" step="0.5" />
                                <CalcField label="Легальный вывод стоил бы" value={it.obnalWithdrawPct ?? 0} onChange={(v: number) => upd(it.id, { obnalWithdrawPct: v })} suffix="%" step="1" />
                              </div>
                              {r.batch.obnalSum > 0 ? (
                                <div className="space-y-1 text-xs">
                                  <div className="flex justify-between"><span className="text-slate-500">НДС к вычету (−НДС партии)</span><span className="font-semibold tabular-nums text-emerald-700">+{money(r.batch.obnalVat)} ₽</span></div>
                                  <div className="flex justify-between"><span className="text-slate-500">Комиссия обнала</span><span className="font-semibold tabular-nums text-rose-600">−{money(r.batch.obnalFee)} ₽</span></div>
                                  <div className="flex justify-between"><span className="text-slate-400">Получено наличными</span><span className="tabular-nums text-slate-500">{money(r.batch.obnalCash)} ₽</span></div>
                                  {r.batch.obnalWithdrawSave > 0.005 && <div className="flex justify-between"><span className="text-slate-500">Экономия на выводе с ООО</span><span className="font-semibold tabular-nums text-emerald-700">+{money(r.batch.obnalWithdrawSave)} ₽</span></div>}
                                  <div className="flex justify-between border-t border-amber-200 pt-1 mt-1"><span className="font-semibold text-slate-700">Выгода обнала</span><span className={`font-extrabold tabular-nums ${r.batch.obnalNet < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{r.batch.obnalNet >= 0 ? '+' : ''}{money(r.batch.obnalNet)} ₽</span></div>
                                  <div className="flex justify-between"><span className="font-bold text-emerald-800">Прибыль ОСНО с обналом</span><span className={`font-extrabold tabular-nums ${r.batch.profOObnal < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{money(r.batch.profOObnal)} ₽</span></div>
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-400 leading-snug">Заведи сумму «бумажного» счёта — контора вернёт её наличными за вычетом комиссии, а НДС (22/122) уйдёт в вычет и уменьшит НДС партии. Наличные ещё и выгодны тем, что легальный вывод с ООО (дивиденды НДФЛ) стоил бы дороже. Выгода = сэкономленный НДС − комиссия + экономия на выводе.</div>
                              )}
                            </div>}
                          </div>
                        </div>
                      );
                    })}

                    {calcItems.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button type="button" onClick={() => setCalcItems((prev) => [...prev, makeCalcItem(prev.length + 1)])} className="py-3.5 rounded-2xl border-2 border-dashed border-indigo-300 text-indigo-600 font-bold hover:bg-indigo-50 hover:border-indigo-400 transition-colors">
                          + Добавить товар
                        </button>
                        <button type="button" onClick={() => { loadCalcSavedProducts(); setCalcPickerOpen(true); }} className="py-3.5 rounded-2xl border-2 border-dashed border-emerald-300 text-emerald-700 font-bold hover:bg-emerald-50 hover:border-emerald-400 transition-colors">
                          Выбрать сохранённый {calcSavedProducts.length > 0 ? `(${calcSavedProducts.length})` : ''}
                        </button>
                      </div>
                    )}

                    {calcSaveModal.open && (() => {
                      const target = calcItems.find((x) => x.id === calcSaveModal.itemId);
                      const nm = calcSaveModal.name.trim();
                      const exists = calcSavedProducts.some((x) => String(x?.name || '').trim() === nm);
                      const doSave = async () => { if (!target || !nm) return; await saveProduct(target, nm); setCalcSaveModal({ open: false, itemId: null, name: '' }); };
                      return (
                        <div className="fixed inset-0 z-[130] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setCalcSaveModal({ open: false, itemId: null, name: '' })}>
                          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-5" onClick={(e) => e.stopPropagation()}>
                            <div className="text-base font-bold text-slate-900 mb-1">Сохранить товар</div>
                            <div className="text-xs text-slate-500 mb-4">Сохранятся все параметры карточки: закупка, пошлина, габариты и цена.</div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Название товара</label>
                            <input autoFocus value={calcSaveModal.name} onChange={(e) => setCalcSaveModal((p) => ({ ...p, name: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter' && nm) doSave(); }} placeholder="Например: Худи оверсайз, хлопок" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-2" />
                            {exists && <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5 mb-2">Товар с таким названием уже есть — он будет перезаписан.</div>}
                            <div className="flex justify-end gap-2 mt-3">
                              <button type="button" onClick={() => setCalcSaveModal({ open: false, itemId: null, name: '' })} className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-sm">Отмена</button>
                              <button type="button" disabled={!nm} onClick={doSave} className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-semibold disabled:opacity-50">Сохранить</button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {calcPickerOpen && (
                      <div className="fixed inset-0 z-[130] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setCalcPickerOpen(false)}>
                        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-base font-bold text-slate-900">Сохранённые товары</div>
                            <button type="button" onClick={() => setCalcPickerOpen(false)} className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 hover:bg-slate-50">Закрыть</button>
                          </div>
                          {calcSavedProducts.length === 0 ? (
                            <div className="text-sm text-slate-500 py-8 text-center">Пока пусто. Заполни карточку товара и нажми «Сохранить» в её шапке.</div>
                          ) : (
                            <div className="overflow-auto space-y-2 pr-1">
                              {calcSavedProducts.map((s: any, i: number) => (
                                <div key={`${s?.name}-${i}`} className="flex items-center gap-3 border border-slate-200 rounded-xl px-3 py-2 hover:border-emerald-300 hover:bg-emerald-50/40">
                                  <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-slate-900 truncate">{s?.name || 'Без названия'}</div>
                                    <div className="text-[11px] text-slate-500">
                                      {s?.source === 'ru' ? `Закупка в РФ · ${Number(s?.costRu || 0).toLocaleString('ru-RU')} ₽` : `Импорт · ${Number(s?.purchase || 0)} ${s?.currency || ''}`}
                                      {' · '}цена {Number(s?.price || 0).toLocaleString('ru-RU')} ₽
                                      {' · '}{Number(s?.len || 0)}×{Number(s?.wid || 0)}×{Number(s?.hei || 0)} см
                                    </div>
                                  </div>
                                  <button type="button" onClick={() => applySaved(s)} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shrink-0">Добавить</button>
                                  <button type="button" onClick={() => deleteSaved(String(s?.name || '').trim())} className="w-7 h-7 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 text-sm shrink-0">×</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Итог */}
                    {calcItems.length > 0 && (
                    <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-xl">
                      <div className="font-bold mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-5 rounded-full bg-emerald-400" />
                        Итого по {rows.length} {rows.length === 1 ? 'позиции' : 'позициям'} · {tot.qty} шт
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                        {[
                          { l: 'Выручка', v: tot.rev, c: 'text-white' },
                          { l: 'Вложения ОСНО', v: tot.investO, c: 'text-amber-200' },
                          { l: 'Вложения УСН', v: tot.investU, c: 'text-amber-200' },
                          { l: 'Себестоимость ОСНО', v: tot.cost, c: 'text-white' },
                          ...(Math.abs(tot.duty) > 0.005 ? [{ l: 'Пошлина', v: tot.duty, c: 'text-amber-300' }] : []),
                          { l: 'Логистика УСН', v: tot.log, c: 'text-sky-300' },
                          { l: 'Прибыль ОСНО', v: tot.osno, c: tot.osno < 0 ? 'text-rose-400' : 'text-emerald-400' },
                          { l: 'Прибыль УСН', v: tot.usn, c: tot.usn < 0 ? 'text-rose-400' : 'text-indigo-300' },
                        ].map((x) => (
                          <div key={x.l}>
                            <div className="text-slate-400 text-[11px] uppercase tracking-wide">{x.l}</div>
                            <div className={`font-extrabold text-lg tabular-nums ${x.c}`}>{money(x.v)} ₽</div>
                            <div className="text-[11px] text-slate-500 tabular-nums">{tot.rev > 0 ? `${(x.v / tot.rev * 100).toFixed(1)}% от продаж` : ''}</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-3 border-t border-white/10 text-sm">
                        {tot.osno >= tot.usn
                          ? <>Выгоднее <b className="text-emerald-400">ОСНО с НДС</b>: +{money(tot.osno - tot.usn)} ₽ — вычет НДС {money(tot.vat)} ₽</>
                          : <>Выгоднее <b className="text-indigo-300">УСН {usnRate === 0.06 ? '6%' : '15%'}</b>: +{money(tot.usn - tot.osno)} ₽</>}
                        <div className="text-xs text-slate-400 mt-1">
                          ROI партии: ОСНО {pctOf(tot.osno, tot.investO)} · УСН {pctOf(tot.usn, tot.investU)}
                        </div>
                        {!calcHideObnal && (Math.abs(tot.obnal) > 0.005 || tot.obnalCash > 0.005) && (
                          <div className="mt-2 pt-2 border-t border-amber-400/20 flex flex-wrap gap-x-5 gap-y-1 text-xs">
                            <span className="text-amber-300">Прибыль ОСНО с обналом: <b>{money(tot.osnoObnal)} ₽</b></span>
                            <span className="text-amber-300/80">выгода {tot.obnal >= 0 ? '+' : ''}{money(tot.obnal)} ₽</span>
                            <span className="text-emerald-300">наличными на руки: <b>{money(tot.obnalCash)} ₽</b></span>
                          </div>
                        )}
                      </div>
                    </div>
                    )}

                    <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3 leading-relaxed">
                      <b>Ставки — ориентир, не основание для контракта.</b> Пошлина зависит от полного 10-значного кода ТН ВЭД: внутри группы разброс 0–17.5%. Комбинированная = максимум из «%» и «€/кг», на дешёвом товаре обычно выигрывает вес. НДС 22% с 01.01.2026; 10% — только перечень ПП 908. Китай без преференций с 12.10.2021.
                      <br />
                      <b>Логистика WB:</b> тарифы с 15.09.2025, обратная логистика без коэффициентов с 20.03.2026. Коэффициент склада смотрите в ЛК (Поставки → Тарифы → Тарифы складов). Выкуп берите от доставленных заказов.
                      <br />
                      <b>Карго</b> — ввоз без таможенного оформления: пошлины нет, но и НДС к вычету нет, а расходы подтвердить нечем. Поэтому он применяется только к УСН.
                    </div>
                  </div>
                );
              })()}

              <div className={analyticsSubTab === 'reports' ? 'w-full' : 'hidden'}>
                <div className="bg-white rounded-xl border border-slate-100 p-4 w-full">
                  <div className="flex flex-wrap items-end justify-start gap-3 mb-3">
                    <div className="min-w-[260px]">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Поставщик для загружаемого отчёта</label>
                      <Select
                        value={uploadedSelectedSupplierId}
                        onChange={(e) => {
                          const v = e.target.value;
                          setUploadedSelectedSupplierId(v);
                          // «Любой поставщик» — это ОСНО с НДС 22%: включаем режим «с НДС»,
                          // чтобы прибыль в отчёте/сводном совпадала со списком и месяцем.
                          if (v === ANY_SUPPLIER_ID) { setUploadedVatMode(true); try { localStorage.setItem('uploaded_vat_mode_v1', '1'); } catch {} }
                        }}
                        className="w-full md:w-[420px] px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="">- Выберите поставщика -</option>
                        <option value={ANY_SUPPLIER_ID}>Любой поставщик (без фото)</option>
                        {visibleUploadedAnalyticsSuppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </Select>
                      {(uploadedAnalyticsSuppliers || []).length === 0 && (
                        <div className="mt-2 text-xs text-amber-600">Поставщики не загрузились. Нажмите «Отчёты» или обновите страницу.</div>
                      )}
                    </div>
                    <button
                      onClick={() => setUploadedHistoryPickerOpen(true)}
                      disabled={!uploadedSelectedSupplierId}
                      className="px-4 py-2 text-sm font-semibold rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-50"
                    >
                      Отчёты
                    </button>
                    <button
                      onClick={() => setUploadedRawHistoryPickerOpen(true)}
                      className="px-4 py-2 text-sm font-semibold rounded-xl border border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-sm"
                    >
                      История отчётов WB
                    </button>
                    <button
                      onClick={() => { setWbApiPickerOpen(true); if (uploadedSelectedSupplierId && uploadedSelectedSupplierId !== ANY_SUPPLIER_ID) loadWbApiReports(uploadedSelectedSupplierId); }}
                      disabled={!uploadedSelectedSupplierId || uploadedSelectedSupplierId === ANY_SUPPLIER_ID}
                      className="px-4 py-2 text-sm font-semibold rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Еженедельные отчёты о реализации напрямую из WB — посмотреть и скачать без ручного захода в кабинет"
                    >
                      Отчёты API
                    </button>
                    <label
                      className={`px-4 py-2 text-sm font-semibold rounded-xl border shadow-sm ${(uploadedReportAnalytics || []).length > 0 && !uploadedSavingCosts ? 'border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 cursor-pointer' : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'}`}
                      title="Загрузить себестоимость из Excel (столбцы: артикул поставщика + цена). Матч по «Артикул поставщика», для товаров без ключа кабинета."
                    >
                      {uploadedSavingCosts ? 'Загрузка…' : 'Себестоимость (файл)'}
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        disabled={(uploadedReportAnalytics || []).length === 0 || uploadedSavingCosts}
                        onChange={async (e) => { const f = e.target.files?.[0]; if (f) await handleUploadCostFile(f); if (e.target) e.target.value = ''; }}
                      />
                    </label>
                    <label
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-600 cursor-pointer hover:bg-slate-50 shadow-sm select-none"
                      title="Если выключено — отчёт всегда сохраняется новой записью, без вопроса «Отчёт уже есть» и без обновления существующего."
                    >
                      <input
                        type="checkbox"
                        checked={uploadedCheckDuplicates}
                        onChange={(e) => {
                          const v = e.target.checked;
                          setUploadedCheckDuplicates(v);
                          try { localStorage.setItem('uploaded_check_duplicates_v1', v ? '1' : '0'); } catch {}
                        }}
                        className="w-4 h-4 accent-indigo-600"
                      />
                      Проверять дубли
                    </label>
                  </div>

                  <ExcelUploader
                    disabled={!uploadedSelectedSupplierId}
                    maxFileBytes={60 * 1024 * 1024}
                    onBatchStart={(count) => {
                      // Пачка (несколько файлов) → тихий режим без вопросов.
                      uploadBatchRef.current = { active: count > 1, loaded: 0, skipped: 0, noPeriod: 0, failed: 0 };
                    }}
                    onBatchDone={() => {
                      const b = uploadBatchRef.current;
                      if (b.active) {
                        const parts = [`загружено ${b.loaded}`];
                        if (b.skipped) parts.push(`дублей пропущено ${b.skipped}`);
                        if (b.noPeriod) parts.push(`без даты ${b.noPeriod}`);
                        if (b.failed) parts.push(`ошибок ${b.failed}`);
                        showToast(`Пачка отчётов: ${parts.join(', ')}`, b.failed ? 'warning' : 'success');
                        loadUploadedReportHistory(uploadedSelectedSupplierId);
                      }
                      uploadBatchRef.current = { active: false, loaded: 0, skipped: 0, noPeriod: 0, failed: 0 };
                    }}
                    onUpload={async (data, fileName, sourceFile) => {
                      const batch = uploadBatchRef.current.active;
                      if (!uploadedSelectedSupplierId) {
                        if (batch) { uploadBatchRef.current.failed += 1; return; }
                        showToast('Сначала выберите поставщика', 'error');
                        return;
                      }
                      const rows = Array.isArray(data) ? data : [];
                      if (rows.length > MAX_UPLOAD_ROWS) {
                        if (batch) { uploadBatchRef.current.failed += 1; return; }
                        showToast(`Файл слишком большой: ${rows.length.toLocaleString('ru-RU')} строк. Лимит: ${MAX_UPLOAD_ROWS.toLocaleString('ru-RU')}`, 'error');
                        return;
                      }
                      const turbo = rows.length >= TURBO_MODE_ROWS;
                      setUploadedTurboMode(turbo);
                      if (turbo && !batch) {
                        showToast(`Включён турбо-режим (${rows.length.toLocaleString('ru-RU')} строк)`, 'info');
                      }
                      // «Любой поставщик» — без привязки: пропускаем проверку принадлежности.
                      if (uploadedSelectedSupplierId !== ANY_SUPPLIER_ID) {
                        const belongs = await validateUploadedReportSupplier(rows, uploadedSelectedSupplierId);
                        if (!belongs) {
                          if (batch) { uploadBatchRef.current.failed += 1; return; }
                          showToast('Отчет не принадлежит данному поставщику', 'error');
                          return;
                        }
                      }
                      const result = processUploadedWbReport(rows, { turbo });
                      // Проверка дубля: по номеру отчёта, иначе по периоду. Если отчёт
                      // уже есть — он уже открыт (распарсен выше), не дублируем; спрашиваем,
                      // обновить ли существующую запись.
                      const sm: any = result?.summary || {};
                      // Номер отчёта: из колонки, иначе вытаскиваем из имени файла
                      // (самая длинная цифровая группа ≥6 знаков) и сохраняем в БД.
                      if (!String(sm?.report_number || '').trim()) {
                        // Номер из имени файла. Формат WB: «...отчет №53756320260607_537563 - 1»
                        // → берём цифры сразу после «№» (id+дата, уникальны за день).
                        const fname = String(fileName || '');
                        const afterNo = fname.match(/№\s*(\d{6,})/);
                        let fromName = afterNo ? afterNo[1] : '';
                        if (!fromName) {
                          // запасной вариант: убираем даты дд.мм.гггг, берём первую группу 6–14 цифр
                          const cleaned = fname.replace(/\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4}/g, ' ');
                          fromName = (cleaned.match(/\d{6,14}/g) || [])[0] || '';
                        }
                        if (fromName) sm.report_number = fromName;
                      }
                      // Период строго по «Дата продажи». Если столбца/дат нет — ручной выбор недели.
                      if (!sm?.period_start) {
                        if (batch) { uploadBatchRef.current.noPeriod += 1; return; }  // в пачке пропускаем файлы без даты
                        showToast('В отчёте нет столбца «Дата продажи» — выберите неделю вручную', 'info');
                        const d = new Date(); const dow = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dow - 7);
                        const guess = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                        setManualWeekModal({ open: true, weekStart: guess, pending: { fileName: fileName || 'uploaded_report.xlsx', rows, summary: sm, analytics: Array.isArray(result?.analytics) ? result.analytics : [], sourceFile } });
                        return;
                      }
                      const dnum = String(sm?.report_number || '').trim();
                      const norm = (v: any) => v ? String(new Date(v).toISOString()).slice(0, 10) : '';
                      const dps = norm(sm?.period_start), dpe = norm(sm?.period_end);
                      let alreadyExists = false;
                      if (uploadedCheckDuplicates) try {
                        let exQuery = supabase
                          .from('analytics_upload_history')
                          .select('id, summary_json');
                        exQuery = uploadedSelectedSupplierId === ANY_SUPPLIER_ID
                          ? exQuery.is('supplier_id', null)
                          : exQuery.eq('supplier_id', uploadedSelectedSupplierId);
                        const { data: ex } = await exQuery
                          .order('created_at', { ascending: false })
                          .limit(400);
                        // Дедуп ТОЛЬКО по номеру отчёта: за один период бывает несколько разных
                        // отчётов (маленький и большой) — они должны сохраняться оба, а не затирать
                        // друг друга. По периоду сверяем лишь если номера нет ни у нового, ни у старого.
                        alreadyExists = (ex || []).some((x: any) => {
                          const rn = String(x?.summary_json?.report_number || '').trim();
                          if (dnum) return rn === dnum;
                          if (rn) return false;
                          const xps = norm(x?.summary_json?.period_start), xpe = norm(x?.summary_json?.period_end);
                          return !!dps && !!dpe && xps === dps && xpe === dpe;
                        });
                      } catch (_) {}

                      if (alreadyExists) {
                        if (batch) { uploadBatchRef.current.skipped += 1; return; }  // в пачке дубли пропускаем без вопроса
                        const doUpdate = await confirmDialog({ title: 'Отчёт уже есть', message: 'Такой отчёт уже есть в истории. Обновить его данными из этого файла?', tone: 'primary', confirmText: 'Обновить', cancelText: 'Не обновлять' });
                        if (!doUpdate) {
                          showToast('Отчёт открыт. В истории он уже есть — повторно не сохраняем.', 'info');
                          return;
                        }
                      }

                      if (result?.summary) {
                        await saveUploadedRawReportHistory(rows, fileName || 'uploaded_report.xlsx', result.summary, sourceFile);
                      }
                      if (result?.summary && Array.isArray(result?.analytics) && result.analytics.length > 0) {
                        await saveUploadedReportHistory(fileName || 'uploaded_report.xlsx', result.summary, result.analytics);
                      }
                      if (batch) { uploadBatchRef.current.loaded += 1; return; }
                      if (alreadyExists) showToast('Отчёт обновлён в истории.', 'success');
                    }}
                  />
                </div>
              </div>


              {manualWeekModal.open && (
                <div className="fixed inset-0 z-[130] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setManualWeekModal({ open: false, weekStart: mskTodayYmd(), pending: null })}>
                  <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-5" onClick={(e) => e.stopPropagation()}>
                    <div className="text-base font-bold text-slate-900 mb-1">Выберите неделю отчёта</div>
                    <div className="text-xs text-slate-500 mb-4">В отчёте нет столбца «Дата продажи». Укажите начало недели (понедельник) — период будет неделя (пн–вс).</div>
                    {(() => {
                      const ws = manualWeekModal.weekStart;
                      const we = (() => { const d = new Date(`${ws}T00:00:00`); if (Number.isNaN(d.getTime())) return ''; d.setDate(d.getDate() + 6); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
                      return (
                        <>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Начало недели</label>
                          <input type="date" value={ws} onChange={(e) => setManualWeekModal((p) => ({ ...p, weekStart: e.target.value }))} className="oc-input mb-2" />
                          <div className="text-xs text-slate-500 mb-4">Период: <b>{ws ? new Date(`${ws}T00:00:00`).toLocaleDateString('ru-RU') : '—'}</b> — <b>{we ? new Date(`${we}T00:00:00`).toLocaleDateString('ru-RU') : '—'}</b></div>
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setManualWeekModal({ open: false, weekStart: mskTodayYmd(), pending: null })} className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-sm">Отмена</button>
                            <button
                              disabled={!ws || !we}
                              onClick={async () => {
                                const p = manualWeekModal.pending; if (!p || !ws || !we) return;
                                const sm = { ...(p.summary || {}), period_start: ws, period_end: we };
                                setUploadedReportSummary((prev: any) => prev ? { ...prev, period_start: ws, period_end: we } : prev);
                                try {
                                  await saveUploadedRawReportHistory(p.rows, p.fileName, sm, p.sourceFile || undefined);
                                  if (Array.isArray(p.analytics) && p.analytics.length > 0) await saveUploadedReportHistory(p.fileName, sm, p.analytics);
                                  showToast(`Неделя задана, отчёт сохранён в историю`, 'success');
                                  loadUploadedReportHistory(uploadedSelectedSupplierId);
                                } catch (err: any) { showToast('Ошибка сохранения: ' + (err?.message || 'неизвестно'), 'error'); }
                                setManualWeekModal({ open: false, weekStart: mskTodayYmd(), pending: null });
                              }}
                              className="px-4 py-2 rounded-lg btn-primary text-sm disabled:opacity-50"
                            >Применить</button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {uploadedShareHistoryOpen && (
                <div className="fixed inset-0 z-[122] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-base font-semibold text-slate-900">История ссылок (30 дней)</div>
                      <button type="button" onClick={() => setUploadedShareHistoryOpen(false)} className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-sm">Закрыть</button>
                    </div>
                    <div className="max-h-[62vh] overflow-auto space-y-2 pr-1">
                      {uploadedShareLinksLoading && <div className="text-xs text-slate-500">Загрузка...</div>}
                      {!uploadedShareLinksLoading && uploadedShareLinks.map((x: any) => {
                        const hideById = uploadedShareHiddenKeys[`id:${String(x?.id || '')}`];
                        const hideByToken = uploadedShareHiddenKeys[`token:${String(x?.token || '')}`];
                        if (hideById || hideByToken) return null;

                        const link = `${window.location.origin}/shared/${x.token}`;
                        const expired = x?.expires_at ? new Date(x.expires_at).getTime() < Date.now() : false;
                        return (
                          <div key={x.id} className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                            <div className="min-w-0">
                              <div className="text-xs font-medium text-slate-800 truncate">{x?.payload_json?.title || 'Ссылка на аналитику'}</div>
                              <div className="text-[11px] text-slate-500 truncate">{link}</div>
                              <div className="text-[11px] text-slate-500">Создано: {new Date(x.created_at).toLocaleString('ru-RU')} {x?.expires_at ? `• До: ${new Date(x.expires_at).toLocaleString('ru-RU')}` : ''}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(link); showToast('Ссылка скопирована', 'success'); } catch {} }} className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-sm">Копировать</button>
                              <button type="button" disabled={expired} onClick={() => disableUploadedShareLink(String(x.id), String(x.token || ''))} className="px-3 py-1.5 text-xs rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 shadow-sm disabled:opacity-50">Отключить</button>
                              <button type="button" onClick={() => deleteUploadedShareLink(String(x.id), String(x.token || ''))} className="px-3 py-1.5 text-xs rounded-xl border border-red-300 bg-white text-red-700 hover:bg-red-50 shadow-sm">Удалить</button>
                            </div>
                          </div>
                        );
                      })}
                      {!uploadedShareLinksLoading && uploadedShareLinks.length === 0 && (
                        <div className="text-xs text-slate-500">Ссылок пока нет</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {uploadedRawHistoryPickerOpen && (
                <div className="fixed inset-0 z-[121] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-3 gap-2">
                      <div className="text-base font-semibold text-slate-900">История отчётов WB</div>
                      <div className="flex items-center gap-2">
                        {rawRecomputeBusy && <span className="text-[11px] text-indigo-600 font-medium animate-pulse">{rawRecomputeBusy}</span>}
                        <button type="button" disabled={!!rawRecomputeBusy} onClick={recomputeAllRawHistory} className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 shadow-sm disabled:opacity-50" title="Заново пересчитать все отчёты из сохранённых исходников и применить новые показатели">Пересчитать все</button>
                        {Object.values(rawSel).filter(Boolean).length > 0 && (
                          <button type="button" onClick={() => deleteUploadedRawHistoryMany(Object.keys(rawSel).filter((k) => rawSel[k]))} className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 shadow-sm">Удалить выбранные ({Object.values(rawSel).filter(Boolean).length})</button>
                        )}
                        <button type="button" onClick={() => { setUploadedRawHistoryPickerOpen(false); setRawSel({}); }} className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-sm">Закрыть</button>
                      </div>
                    </div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      {uploadedRawHistoryYears.map((y) => (
                        <button
                          key={y}
                          type="button"
                          onClick={() => setUploadedRawHistoryYear(y)}
                          className={`px-2 py-1 text-xs rounded-lg border ${uploadedRawHistoryYear === y ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 hover:bg-slate-50'}`}
                        >
                          {y}
                        </button>
                      ))}
                    </div>
                    <div className="max-h-[60vh] overflow-auto space-y-3 pr-1">
                      {uploadedRawHistoryGrouped.map(([month, items]) => (
                        <div key={month} className="border border-slate-200 rounded-xl p-2 bg-slate-50">
                          <div className="flex items-center justify-between mb-2 gap-2">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                              <button
                                type="button"
                                onClick={() => setUploadedRawHistoryCollapsedMonths((prev) => ({ ...prev, [month]: !prev[month] }))}
                                className="px-2 py-0.5 text-[11px] rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
                              >
                                {uploadedRawHistoryCollapsedMonths[month] ? 'Показать' : 'Скрыть'}
                              </button>
                              <span>{uploadedHistoryMonthNames[month]}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => openUploadedRawHistoryMonth(items as any[])}
                              className="px-3 py-1.5 text-xs font-medium rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-sm"
                            >
                              Отчёт за месяц
                            </button>
                          </div>
                          {!uploadedRawHistoryCollapsedMonths[month] && (
                          <div className="space-y-2">
                            {items.map((h: any) => (
                              <div key={h.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2 gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <input type="checkbox" checked={!!rawSel[String(h.id)]} onChange={(e) => setRawSel((prev) => ({ ...prev, [String(h.id)]: e.target.checked }))} className="w-4 h-4 shrink-0" />
                                  <div className="min-w-0">
                                    <div className="text-xs font-medium text-slate-800 truncate">{h.file_name || 'Без имени'}</div>
                                    <div className="text-[11px] text-slate-500">{new Date(h.created_at).toLocaleString('ru-RU')}</div>
                                    {h?.summary_json?.report_number && (
                                      <div className="text-[11px] text-indigo-600">Отчёт № {h.summary_json.report_number}</div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button onClick={() => openUploadedRawHistoryItem(h)} className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-sm">Открыть</button>
                                  <button disabled={!!rawRecomputeBusy} onClick={async () => { setRawRecomputeBusy('Пересчёт…'); try { const ok = await recomputeRawHistoryItem(h); if (ok) showToast('Отчёт пересчитан с новыми показателями', 'success'); } finally { setRawRecomputeBusy(null); } }} className="px-3 py-1.5 text-xs font-medium rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 shadow-sm disabled:opacity-50" title="Пересчитать этот отчёт из исходника и обновить в «Отчётах»">Пересчитать</button>
                                  <button onClick={() => downloadUploadedRawSourceFile(h)} className="px-3 py-1.5 text-xs font-medium rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-sm">Исходный файл</button>
                                  <button onClick={() => deleteUploadedRawHistoryItem(String(h.id), h.file_name)} className="p-2 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 shadow-sm" title="Удалить"><Trash2 className="h-4 w-4" /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                          )}
                        </div>
                      ))}
                      {uploadedRawHistoryGrouped.length === 0 && (
                        <div className="text-xs text-slate-500">История WB-отчётов пуста для выбранного продавца/года</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {wbApiPickerOpen && (
                <div className="fixed inset-0 z-[122] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-3 gap-2">
                      <div>
                        <div className="text-base font-semibold text-slate-900">Отчёты API (еженедельные)</div>
                        <div className="text-[11px] text-slate-500">Отчёты о реализации напрямую из Wildberries — те же файлы, что вы качали вручную</div>
                      </div>
                      <button type="button" onClick={() => setWbApiPickerOpen(false)} className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-sm">Закрыть</button>
                    </div>

                    {(() => {
                      const MN = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
                      const now = new Date();
                      const curY = now.getFullYear(), curM = now.getMonth();
                      const years = Array.from(new Set<number>([2024, 2025, curY, ...(wbApiReports || []).map((r: any) => { const d = new Date(r?.date_from || r?.created_at || ''); return Number.isNaN(d.getTime()) ? null : d.getFullYear(); }).filter((x): x is number => x != null)])).sort((a, b) => b - a);
                      const year = wbApiYear ?? curY;
                      const maxM = year === curY ? curM : 11;
                      const months: number[] = [];
                      for (let m = maxM; m >= 0; m -= 1) months.push(m);
                      const byMonth = (m: number) => (wbApiReports || []).filter((h: any) => { const d = new Date(h?.date_from || ''); return !Number.isNaN(d.getTime()) && d.getFullYear() === year && d.getMonth() === m; }).sort((x: any, y: any) => String(y?.date_from || '').localeCompare(String(x?.date_from || '')));
                      return (
                        <>
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            {years.map((y) => (
                              <button key={y} type="button" onClick={() => setWbApiYear(y)} className={`px-2.5 py-1 text-xs rounded-lg border ${year === y ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 hover:bg-slate-50'}`}>{y}</button>
                            ))}
                            {wbApiBusy && <span className="text-[11px] text-emerald-600 font-medium animate-pulse">{wbApiBusy}</span>}
                            <span className="ml-auto text-[11px] text-slate-500">Сохранено: {wbApiReports.length}</span>
                          </div>

                          <div className="max-h-[62vh] overflow-auto space-y-3 pr-1">
                            {months.map((m) => {
                              const k = `${year}-${m}`;
                              const collapsed = !!wbApiCollapsed[k];
                              const items = byMonth(m);
                              const weeks = wbWeeksOfMonth(year, m);
                              return (
                                <div key={k} className="border border-slate-200 rounded-xl bg-slate-50">
                                  <div className="flex items-center justify-between px-3 py-2 gap-2">
                                    <button type="button" onClick={() => setWbApiCollapsed((p) => ({ ...p, [k]: !p[k] }))} className="flex items-center gap-2 text-sm font-semibold text-slate-800 min-w-0">
                                      <span>{MN[m]} {year}</span>
                                      <span className="text-slate-400 font-normal">· {items.length} отч.</span>
                                    </button>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {weeks.length > 0 && (
                                        <button type="button" disabled={!!wbApiBusy} onClick={() => scanWbApiWeeks(weeks)} className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 shadow-sm disabled:opacity-50" title="Запросить недельные отчёты этого месяца из WB">Проверить</button>
                                      )}
                                      <button type="button" onClick={() => setWbApiCollapsed((p) => ({ ...p, [k]: !p[k] }))} className="px-2 py-0.5 text-[11px] rounded-lg border border-slate-200 bg-white hover:bg-slate-50">{collapsed ? 'Показать' : 'Скрыть'}</button>
                                    </div>
                                  </div>
                                  {!collapsed && (
                                    <div className="px-2 pb-2 space-y-2">
                                      {items.length === 0 ? (
                                        <div className="text-[11px] text-slate-400 px-2 py-2">Нет загруженных отчётов. Нажмите «Проверить».</div>
                                      ) : items.map((h: any) => {
                                        const ps = h?.date_from ? new Date(h.date_from).toLocaleDateString('ru-RU') : '—';
                                        const pe = h?.date_to ? new Date(h.date_to).toLocaleDateString('ru-RU') : '—';
                                        const ld = h?.updated_at || h?.created_at;
                                        const ldStr = ld ? new Date(ld).toLocaleString('ru-RU') : '—';
                                        return (
                                          <div key={h.id || h.realizationreport_id} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2 gap-2">
                                            <div className="min-w-0">
                                              <div className="text-xs font-semibold text-slate-800 truncate">Период {ps} — {pe}</div>
                                              <div className="text-[11px] text-slate-500">№ {h.realizationreport_id} · строк {Number(h.rows_count || 0).toLocaleString('ru-RU')}</div>
                                              <div className="text-[11px] text-slate-400">загружен {ldStr}</div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                              <button disabled={!!wbApiBusy} onClick={() => downloadWbApiReport(h)} className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 shadow-sm disabled:opacity-50" title="Скачать xlsx (тот же формат, что в кабинете WB)">Скачать</button>
                                              <button disabled={!!wbApiBusy} onClick={() => importWbApiReport(h)} className="px-3 py-1.5 text-xs font-medium rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-sm disabled:opacity-50" title="Сразу разобрать и сохранить в «Отчёты» без скачивания файла">Загрузить в систему</button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {uploadedHistoryPickerOpen && (
                <div className="fixed inset-0 z-[120] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-3 gap-2">
                      <div className="text-base font-semibold text-slate-900">Отчёты</div>
                      <div className="flex items-center gap-2">
                        {recomputeProfitsBusy && <span className="text-[11px] text-indigo-600 font-medium animate-pulse">{recomputeProfitsBusy}</span>}
                        <button type="button" disabled={!!recomputeProfitsBusy} onClick={recomputeUploadedProfits} className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 shadow-sm disabled:opacity-50" title="Пересчитать чистую прибыль (НДС 22%) по текущей себестоимости и сохранить">Пересчитать прибыль</button>
                        <button type="button" onClick={() => setUploadedHistoryPickerOpen(false)} className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-sm">Закрыть</button>
                      </div>
                    </div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      {uploadedHistoryYears.map((y) => (
                        <button
                          key={y}
                          type="button"
                          onClick={() => setUploadedHistoryYear(y)}
                          className={`px-2 py-1 text-xs rounded-lg border ${uploadedHistoryYear === y ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 hover:bg-slate-50'}`}
                        >
                          {y}
                        </button>
                      ))}
                    </div>

                    {/* Диапазон дат — выбрать недельные отчёты, попадающие в период */}
                    {(() => {
                      const norm = (v: any) => v ? String(new Date(v).toISOString()).slice(0, 10) : '';
                      const day = uploadedHistoryRange.from;                        // выбранный день
                      // Отчёты, чья неделя покрывает выбранный день.
                      const covering = (uploadedHistory || []).filter((h: any) => {
                        const ps = norm(h?.summary_json?.period_start), pe = norm(h?.summary_json?.period_end);
                        if (!ps || !pe || !day) return false;
                        return ps <= day && pe >= day;
                      });
                      return (
                        <>
                        <div className="mb-1 flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Выбрать день</label>
                            <input type="date" value={day} onChange={(e) => setUploadedHistoryRange({ from: e.target.value, to: e.target.value })} className="px-2 py-1.5 text-sm border border-slate-300 rounded-lg" />
                          </div>
                          <button type="button" disabled={!day || covering.length === 0} onClick={() => { buildDayRangeReport(covering as any[], day, day); setUploadedHistoryPickerOpen(false); }} className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50" title="Точный отчёт за этот день (пересчёт из исходника отчёта)">Отчёт за день</button>
                          {day && covering.length === 0 && <span className="text-[11px] text-amber-600">Нет отчёта, покрывающего этот день</span>}
                          {day && <button type="button" onClick={() => setUploadedHistoryRange({ from: '', to: '' })} className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700">Сброс</button>}
                        </div>
                        <div className="w-full text-[10px] text-slate-400 mb-3">Отчёт за день собирается из исходного файла отчёта (только продажи за этот день). Работает для отчётов, загруженных с сохранённым исходником; складские/недельные удержания без даты в дневной срез не попадают.</div>
                        </>
                      );
                    })()}

                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const allIds = (uploadedHistoryGrouped || []).flatMap(([, items]) => (items as any[]).map((h: any) => String(h.id)));
                          const allSelected = allIds.length > 0 && allIds.every((id) => !!uploadedHistorySelectedIds[id]);
                          if (allSelected) {
                            setUploadedHistorySelectedIds((prev) => {
                              const next = { ...prev };
                              allIds.forEach((id) => { delete next[id]; });
                              return next;
                            });
                          } else {
                            setUploadedHistorySelectedIds((prev) => {
                              const next: Record<string, boolean> = { ...prev };
                              allIds.forEach((id) => { next[id] = true; });
                              return next;
                            });
                          }
                        }}
                        className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-sm"
                      >
                        {(() => {
                          const allIds = (uploadedHistoryGrouped || []).flatMap(([, items]) => (items as any[]).map((h: any) => String(h.id)));
                          const allSelected = allIds.length > 0 && allIds.every((id) => !!uploadedHistorySelectedIds[id]);
                          return allSelected ? 'Сбросить все' : 'Выбрать все';
                        })()}
                      </button>
                      <div className="ml-auto text-xs text-slate-600">Выбрано: {uploadedHistorySelectedCount}</div>
                      {uploadedHistorySelectedCount > 0 && (
                        <button type="button" onClick={() => deleteUploadedHistoryMany(Object.keys(uploadedHistorySelectedIds).filter((k) => uploadedHistorySelectedIds[k]))} className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 shadow-sm">Удалить выбранные</button>
                      )}
                      <button type="button" onClick={openUploadedHistorySelected} className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm">Отчёт по выбранным периодам</button>
                    </div>

                    <div className="max-h-[60vh] overflow-auto space-y-3 pr-1">
                      {uploadedHistoryGrouped.map(([month, items]) => (
                        <div key={month} className="border border-slate-200 rounded-xl p-2 bg-slate-50">
                          <div className="flex items-center justify-between mb-2 gap-2">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-800"><input type="checkbox" checked={(items as any[]).length > 0 && (items as any[]).every((h: any) => uploadedHistorySelectedIds[String(h.id)])} onChange={(e) => { const ch = e.target.checked; setUploadedHistorySelectedIds((prev) => { const next = { ...prev }; (items as any[]).forEach((h: any) => { next[String(h.id)] = ch; }); return next; }); }} />{uploadedHistoryMonthNames[month]}
                              {(() => {
                                const vals = (items as any[]).map((h: any) => reportNetProfit(h)).filter((v: any) => v != null) as number[];
                                if (!vals.length) return null;
                                const total = vals.reduce((s: number, v: number) => s + v, 0);
                                const partial = vals.length < (items as any[]).length;
                                return <span className={`ml-1 text-xs font-bold ${total < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>· {Math.round(total).toLocaleString('ru-RU')} ₽{partial ? '*' : ''}</span>;
                              })()}
                            </label>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setUploadedHistoryCollapsedMonths((prev) => ({ ...prev, [month]: !prev[month] }))}
                                className="px-2 py-0.5 text-[11px] rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
                              >
                                {uploadedHistoryCollapsedMonths[month] ? 'Показать' : 'Скрыть'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  openUploadedHistoryMonth(items as any[]);
                                  setUploadedHistoryPickerOpen(false);
                                }}
                                className="px-3 py-1.5 text-xs font-medium rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-sm"
                              >
                                Отчёт за месяц
                              </button>
                            </div>
                          </div>
                          {!uploadedHistoryCollapsedMonths[month] && (
                          <div className="space-y-2">
                            {items.map((h: any) => (
                              <div key={h.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2 gap-2">
                                <label className="flex items-center gap-2 mr-1">
                                  <input type="checkbox" checked={!!uploadedHistorySelectedIds[String(h.id)]} onChange={(e) => setUploadedHistorySelectedIds((prev) => ({ ...prev, [String(h.id)]: e.target.checked }))} />
                                </label>
                                <div className="min-w-0">
                                  <div className="text-xs font-medium text-slate-800 truncate">{h.file_name || 'Без имени'}</div>
                                  <div className="text-[11px] text-slate-500">{new Date(h.created_at).toLocaleString('ru-RU')}</div>
                                  {h?.summary_json?.report_number && (
                                    <div className="text-[11px] text-indigo-600">Отчёт № {h.summary_json.report_number}</div>
                                  )}
                                  {(() => {
                                    const prof = reportNetProfit(h);
                                    if (prof == null) return null;
                                    const isAny = h?.supplier_id == null;
                                    const fmt = (v: number) => Math.round(v).toLocaleString('ru-RU');
                                    return (
                                      <div className="text-[11px] mt-0.5">
                                        <span className={`font-semibold ${prof < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>Чистая прибыль {fmt(prof)} ₽</span>
                                        {isAny && <span className="text-slate-400"> · НДС 22%</span>}
                                      </div>
                                    );
                                  })()}
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      openUploadedHistoryItem(h);
                                      setUploadedHistoryPickerOpen(false);
                                    }}
                                    className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-sm"
                                  >Открыть</button>
                                  <button onClick={() => deleteUploadedHistoryItem(h.id, h.file_name)} className="p-2 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 shadow-sm" title="Удалить"><Trash2 className="h-4 w-4" /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                          )}
                        </div>
                      ))}

                      {!uploadedHistoryLoading && uploadedHistoryGrouped.length === 0 && (
                        <div className="text-xs text-slate-500">История пуста для выбранного продавца/года</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {uploadedReportSummary && (
                <div id="uploaded-analytics-pdf-capture" className="mt-6 bg-white rounded-xl border border-slate-100 p-5">
                  <div className="flex flex-wrap items-center justify-between mb-2 gap-3">
                    <h2 className="text-lg font-semibold text-slate-900">Аналитика по загруженному отчёту</h2>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setUploadedViewTab('summary')}
                        className={`px-3 py-1.5 text-xs rounded-xl shadow-sm ${uploadedViewTab === 'summary' ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                      >
                        Сводка
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadedViewTab('table')}
                        className={`px-3 py-1.5 text-xs rounded-xl shadow-sm ${uploadedViewTab === 'table' ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                      >
                        Таблица
                      </button>
                      <button
                        onClick={exportUploadedReportAnalyticsExcel}
                        className="px-3 py-1.5 text-xs rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                      >
                        Скачать Excel
                      </button>
                      <button
                        onClick={createUploadedReportShareLink}
                        disabled={uploadedShareLoading}
                        className="px-3 py-1.5 text-xs rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm disabled:opacity-60"
                      >
                        {uploadedShareLoading ? 'Создаю ссылку…' : 'Сохранить отчёт ссылкой'}
                      </button>
                      <button
                        onClick={() => setUploadedShareHistoryOpen(true)}
                        className="px-3 py-1.5 text-xs rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 shadow-sm"
                      >
                        История ссылок
                      </button>
                    </div>
                  </div>
                  {(uploadedReportSummary?.period_start || uploadedReportSummary?.period_end) && (
                    <div className="mb-3 text-xs text-slate-600">
                      Период отчёта: {uploadedReportSummary?.period_start ? new Date(uploadedReportSummary.period_start).toLocaleDateString('ru-RU') : '-'}
                      {' - '}
                      {uploadedReportSummary?.period_end ? new Date(uploadedReportSummary.period_end).toLocaleDateString('ru-RU') : '-'}
                    </div>
                  )}
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={uploadedSearch}
                      onChange={(e) => setUploadedSearch(e.target.value)}
                      placeholder="Поиск по коду/названию товара"
                      className="w-full md:w-96 px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setUploadedFilterOpen((v) => !v)}
                      className="px-3 py-2 text-sm rounded-lg border border-slate-300 hover:bg-slate-50"
                    >
                      Фильтр
                    </button>
                    <button
                      type="button"
                      onClick={() => enrichUploadedPhotosByApi()}
                      disabled={uploadedPhotoLoading}
                      className="px-3 py-2 text-sm rounded-lg border border-indigo-300 text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
                    >
                      {uploadedPhotoLoading ? 'Обновляю фото...' : 'Обновить фото'}
                    </button>
                    <button
                      type="button"
                      onClick={openUploadedCostEditor}
                      className="px-3 py-2 text-sm rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    >
                      Редактировать себестоимость
                    </button>
                  </div>


                  {uploadedFilterOpen && (
                    <div className="mb-4 border border-slate-200 rounded-xl p-3 bg-slate-50">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium text-slate-700">Колонки таблицы</div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setUploadedVisibleCols({
                                  sales_net: true,
                                  returns_gross: true,
                                  logistics_sum: true,
                                  payout_net: true,
                                  fine_sum: true,
                                  storage_sum: true,
                                  withhold_sum: true,
                                  to_pay_total: true,
                                  sold_qty: true,
                                  return_qty: true,
                                  acquiring_sum: true,
                                  acquiring_percent: true,
                                })}
                                className="px-2 py-1 text-xs rounded border border-slate-300 hover:bg-slate-50"
                              >
                                Выбрать все
                              </button>
                              <button
                                type="button"
                                onClick={() => setUploadedVisibleCols({
                                  sales_net: false,
                                  returns_gross: false,
                                  logistics_sum: false,
                                  payout_net: false,
                                  fine_sum: false,
                                  storage_sum: false,
                                  withhold_sum: false,
                                  to_pay_total: false,
                                  sold_qty: false,
                                  return_qty: false,
                                  acquiring_sum: false,
                                  acquiring_percent: false,
                                })}
                                className="px-2 py-1 text-xs rounded border border-slate-300 hover:bg-slate-50"
                              >
                                Снять все
                              </button>
                            </div>
                          </div>
                          <input
                            type="text"
                            value={uploadedFilterMetricSearch}
                            onChange={(e) => setUploadedFilterMetricSearch(e.target.value)}
                            placeholder="Поиск по инфографике/показателям"
                            className="oc-input mb-2"
                          />
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {[
                              ['sales_net', 'Продажи'],
                              ['returns_gross', 'Возвраты'],
                              ['logistics_sum', 'Логистика'],
                              ['payout_net', 'К перечислению'],
                              ['fine_sum', 'Штрафы'],
                              ['storage_sum', 'Хранение'],
                              ['withhold_sum', 'Удержания'],
                              ['to_pay_total', 'Итого к оплате'],
                              ['sold_qty', 'Кол-во проданных'],
                              ['return_qty', 'Кол-во возвратов'],
                              ['acquiring_sum', 'Эквайринг/Комиссии'],
                              ['acquiring_percent', 'Размер комиссии, %'],
                            ]
                              .filter(([, label]) => {
                                const q = uploadedFilterMetricSearch.trim().toLowerCase();
                                return !q || String(label).toLowerCase().includes(q);
                              })
                              .map(([key, label]) => (
                              <label key={String(key)} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isUploadedColVisible(String(key))}
                                  onChange={(e) => setUploadedVisibleCols((prev) => ({ ...prev, [String(key)]: e.target.checked }))}
                                />
                                <span>{label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium text-slate-700">Товары</div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const names: Record<string, boolean> = {};
                                  const codes: Record<string, boolean> = {};
                                  (uploadedNameGroups || []).forEach(([name, list]) => {
                                    names[name] = true;
                                    (list || []).forEach((code) => { codes[`${name}|${code}`] = true; });
                                  });
                                  setUploadedSelectedNames(names);
                                  setUploadedSelectedNameCodes(codes);
                                }}
                                className="px-2 py-1 text-xs rounded border border-slate-300 hover:bg-slate-50"
                              >
                                Выбрать все
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const names: Record<string, boolean> = {};
                                  const codes: Record<string, boolean> = {};
                                  (uploadedNameGroups || []).forEach(([name, list]) => {
                                    names[name] = false;
                                    (list || []).forEach((code) => { codes[`${name}|${code}`] = false; });
                                  });
                                  setUploadedSelectedNames(names);
                                  setUploadedSelectedNameCodes(codes);
                                }}
                                className="px-2 py-1 text-xs rounded border border-slate-300 hover:bg-slate-50"
                              >
                                Снять все
                              </button>
                            </div>
                          </div>
                          <input
                            type="text"
                            value={uploadedFilterNameSearch}
                            onChange={(e) => setUploadedFilterNameSearch(e.target.value)}
                            placeholder="Поиск по названию товара / номенклатуре"
                            className="oc-input mb-2"
                          />
                          <div className="max-h-56 overflow-auto space-y-2 pr-1">
                            {uploadedNameGroups
                              .filter(([name, codes]) => {
                                const q = uploadedFilterNameSearch.trim().toLowerCase();
                                if (!q) return true;
                                if (String(name).toLowerCase().includes(q)) return true;
                                return (codes || []).some((c: any) => String(c || '').toLowerCase().includes(q));
                              })
                              .map(([name, codes]) => {
                              const nameChecked = uploadedSelectedNames[name] !== false;
                              const expanded = !!uploadedExpandedNames[name];
                              return (
                                <div key={name} className="bg-white border border-slate-200 rounded-lg p-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <label className="flex items-center gap-2 min-w-0">
                                      <input
                                        type="checkbox"
                                        checked={nameChecked}
                                        onChange={(e) => {
                                          const checked = e.target.checked;
                                          setUploadedSelectedNames((prev) => ({ ...prev, [name]: checked }));
                                          setUploadedSelectedNameCodes((prev) => {
                                            const next = { ...prev };
                                            (codes || []).forEach((c) => { next[`${name}|${c}`] = checked; });
                                            return next;
                                          });
                                        }}
                                      />
                                      <span className="text-xs truncate">{name}</span>
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => setUploadedExpandedNames((prev) => ({ ...prev, [name]: !prev[name] }))}
                                      className="text-[11px] px-2 py-0.5 rounded border border-slate-300 hover:bg-slate-50"
                                    >
                                      {expanded ? 'Скрыть' : 'Номенклатуры'}
                                    </button>
                                  </div>
                                  {expanded && (
                                    <div className="mt-2 pl-6 space-y-1">
                                      {(codes || []).map((code) => {
                                        const ck = `${name}|${code}`;
                                        const codeChecked = uploadedSelectedNameCodes[ck] !== false;
                                        return (
                                          <label key={ck} className="flex items-center gap-2 text-xs">
                                            <input
                                              type="checkbox"
                                              checked={codeChecked}
                                              onChange={(e) => setUploadedSelectedNameCodes((prev) => ({ ...prev, [ck]: e.target.checked }))}
                                            />
                                            <span>{code}</span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}


                  {uploadedViewTab === 'history' && (
                  <div className="mb-4 bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-slate-700">История загрузок</div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setUploadedViewTab('table')} className="px-2 py-1 text-xs rounded-lg border border-slate-300 hover:bg-slate-50">К таблице</button>
                        <div className="text-xs text-slate-500">{uploadedHistoryLoading ? 'Загрузка...' : `${uploadedHistory.length} шт`}</div>
                      </div>
                    </div>
                    <div className="max-h-36 overflow-auto space-y-2">
                      {uploadedHistory.map((h) => (
                        <div key={h.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2 gap-2">
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-slate-800 truncate">{h.file_name || 'Без имени'}</div>
                            <div className="text-[11px] text-slate-500">{new Date(h.created_at).toLocaleString('ru-RU')}</div>
                            {h?.summary_json?.report_number && (
                              <div className="text-[11px] text-indigo-600">Отчёт № {h.summary_json.report_number}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => openUploadedHistoryItem(h)} className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-sm">Открыть</button>
                            <button onClick={() => deleteUploadedHistoryItem(h.id, h.file_name)} className="p-2 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 shadow-sm" title="Удалить"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                      ))}
                      {!uploadedHistoryLoading && uploadedHistory.length === 0 && (
                        <div className="text-xs text-slate-500">История пуста для выбранного продавца</div>
                      )}
                    </div>
                  </div>
                  )}

                  {uploadedViewTab === 'summary' && (
                  <>

                  {(() => {
                    const s = uploadedSummaryForView; if (!s) return null;
                    const rub = (v: number) => Math.round(Number(v || 0)).toLocaleString('ru-RU') + ' ₽';
                    const pct = (v: number) => (Number(v || 0)).toFixed(1) + '%';
                    // Служебная строка WB (арт. 0/пусто) — общие удержания без привязки к товару.
                    const isSvc = (code: any) => { const c = String(code || '').trim(); return c === '' || c === '0'; };
                    const svcLabel = 'Удержания WB';
                    const sales = Number(s.sales_net || 0);
                    const geo = uploadedReportGeo;
                    // Кол-во дней в периоде отчёта (для скорости продаж ед/день).
                    const _ps = s.period_start ? new Date(s.period_start) : null;
                    const _pe = s.period_end ? new Date(s.period_end) : null;
                    const periodDays = (_ps && _pe && !isNaN(_ps.getTime()) && !isNaN(_pe.getTime()))
                      ? Math.max(1, Math.round((_pe.getTime() - _ps.getTime()) / 86400000) + 1)
                      : 1;
                    // прибыль по товару — из ОТФИЛЬТРОВАННЫХ строк (фильтр применяется ко всем карточкам/инфографике)
                    const prodsAll = (sortedFilteredUploadedAnalytics || []).map((x: any) => {
                      const sold = Number(x.sold_qty || 0);
                      const cost = Number(getUploadedCostValue(x) || 0);
                      // Налог по ТЕКУЩЕМУ режиму (УСН 1/6/15% или ОСНО: НДС + 25% с прибыли),
                      // как в строках размеров — иначе прибыль товара/ИТОГО ≠ сумма по размерам.
                      const profit = getUploadedRowProfitAfterTaxes(
                        Number(x.to_pay_total || 0),
                        Number(x.sales_net || 0),
                        cost * sold,
                        Number(x.wb_commission_vat || 0),
                        Number(x.logistics_sum || 0),
                        Number(x.withhold_sum || 0) + Number(x.storage_sum || 0),
                      );
                      const sNet = Number(x.sales_net || 0);
                      const salesGross = Number(x.sales_gross || 0);
                      const retSum = Number(x.returns_gross || 0);
                      const costSum = cost * sold;
                      return { code: x.code, name: x.name, vendorCode: x.vendor_code || '', ordered: Number(x.ordered_qty || 0), orderedSum: Number(x.ordered_retail_sum || 0), sales: sNet, profit, sold, cost, costSum, ret: Number(x.return_qty || 0), retSum, salesGross, logistics: Number(x.logistics_sum || 0), logisticsFwd: Number(x.logistics_forward || 0), logisticsLogi: Number(x.logistics_logi || 0), logisticsRet: Number(x.logistics_return || 0), payoutNet: Number(x.payout_net || 0), toPay: Number(x.to_pay_total || 0), storage: Number(x.storage_sum || 0), withhold: Number(x.withhold_sum || 0), fine: Number(x.fine_sum || 0), acquiring: Number(x.acquiring_sum || 0), commissionVat: Number(x.wb_commission_vat || 0), logKinds: (x.log_kinds || {}), tax: Number(x.tax_sum || 0), sizes: buildReconciledSizeRows(x), sizesStr: x.size_breakdown || '', margin: sNet > 0 ? profit / sNet * 100 : 0, roi: costSum > 0 ? profit / costSum * 100 : 0, perDay: sold / periodDays, retPct: sold > 0 ? Number(x.return_qty || 0) / sold * 100 : 0, share: sales > 0 ? sNet / sales * 100 : 0, abc: 'C', abcOrd: 3 };
                    });
                    // Фильтр прибыльности (+/−) применяется ко ВСЕЙ сводке: товары, инфографика и дашборд.
                    const profitFilterActive = summaryProfitFilter !== 'all';
                    const prods = profitFilterActive
                      ? prodsAll.filter((p: any) => summaryProfitFilter === 'pos' ? Number(p.profit) >= 0 : Number(p.profit) < 0)
                      : prodsAll;
                    // Эффективная сводка: при активном фильтре пересчитываем суммы из отфильтрованных товаров.
                    const sumP = (k: string) => prods.reduce((a: number, p: any) => a + Number(p[k] || 0), 0);
                    // Хранение и реклама WB часто НЕ привязаны к товару (сидят в «Удержаниях», арт. 0).
                    // При фильтре +/− распределяем ОБЩИЕ хранение/рекламу пропорционально доле выручки
                    // отфильтрованных товаров (а не теряем в «+» и не сваливаем целиком в «−»).
                    const allSalesAbs = prodsAll.reduce((a: number, p: any) => a + Math.abs(Number(p.sales || 0)), 0);
                    const filtSalesAbs = prods.reduce((a: number, p: any) => a + Math.abs(Number(p.sales || 0)), 0);
                    const allocShare = (profitFilterActive && allSalesAbs > 0) ? filtSalesAbs / allSalesAbs : 1;
                    const storageAlloc = Number(s.storage_sum || 0) * allocShare;
                    const withholdAlloc = Number(s.withhold_sum || 0) * allocShare;
                    const sx: any = profitFilterActive ? {
                      ...s,
                      sales_net: sumP('sales'), returns_gross: sumP('retSum'), logistics_sum: sumP('logistics'),
                      payout_net: sumP('payoutNet'), to_pay_total: sumP('toPay'), fine_sum: sumP('fine'),
                      storage_sum: storageAlloc, withhold_sum: withholdAlloc, acquiring_sum: sumP('acquiring'),
                      wb_commission_vat: sumP('commissionVat'),
                      sold_qty: sumP('sold'), return_qty: sumP('ret'), return_legs_qty: sumP('ret'),
                      ordered_qty: sumP('ordered'), ordered_retail_sum: sumP('orderedSum'), tax_sum: sumP('tax'),
                    } : s;
                    const salesX = Number(sx.sales_net || 0);
                    const totalSoldAll = prods.reduce((a: number, p: any) => a + Number(p.sold || 0), 0);
                    // ABC-анализ по доле в выручке: A до 80% накопл., B до 95%, остальное C.
                    const abcSalesTotal = prods.reduce((a: number, p: any) => a + Math.max(0, Number(p.sales || 0)), 0);
                    { let cum = 0; [...prods].sort((a: any, b: any) => b.sales - a.sales).forEach((p: any) => { cum += Math.max(0, Number(p.sales || 0)); const c = abcSalesTotal > 0 ? cum / abcSalesTotal * 100 : 100; p.abc = c <= 80 ? 'A' : c <= 95 ? 'B' : 'C'; p.abcOrd = p.abc === 'A' ? 1 : p.abc === 'B' ? 2 : 3; }); }
                    const abcGroups = ['A', 'B', 'C'].map((g) => { const items = prods.filter((p: any) => p.abc === g); const gsales = items.reduce((a: number, p: any) => a + Number(p.sales || 0), 0); const gprofit = items.reduce((a: number, p: any) => a + Number(p.profit || 0), 0); return { g, count: items.length, sales: gsales, profit: gprofit, shareSales: abcSalesTotal > 0 ? gsales / abcSalesTotal * 100 : 0 }; });
                    // Неликвид — товары без продаж за период.
                    const deadStock = prods.filter((p: any) => Number(p.sold || 0) <= 0);
                    const byProfitDesc = [...prods].sort((a, b) => b.profit - a.profit);
                    const top = byProfitDesc;
                    const loss = byProfitDesc.filter((p) => p.profit < 0).reverse();
                    // Только дни с продажами/выкупами (без пустых/служебных дат).
                    const days = (geo?.dailyTotals || []).filter((d: any) => Number(d?.sales_net || 0) > 0 || Number(d?.sold_qty || 0) > 0);
                    const maxDaySales = Math.max(1, ...days.map((d: any) => d.sales_net));
                    const maxDayBuyout = Math.max(1, ...days.map((d: any) => d.sold_qty));
                    const bestDay = days.length ? [...days].sort((a: any, b: any) => b.sales_net - a.sales_net)[0] : null;
                    const worstDay = days.length ? [...days].filter((d: any) => d.sales_net > 0).sort((a: any, b: any) => a.sales_net - b.sales_net)[0] : null;
                    const bestBuyDay = days.length ? [...days].sort((a: any, b: any) => b.sold_qty - a.sold_qty)[0] : null;
                    const wh = (geo?.byWarehouse || []);
                    const offices = (geo?.byOffice || []);
                    // WB-фото по nmID
                    const hostFor = (vol: number) => { const t = [143,287,431,719,1007,1061,1115,1169,1313,1601,1655,1919,2045,2189,2405,2621,2837,3053,3269,3485,3701,3917,4133,4349,4565,4877,5189,5501,5813,6125,6437,6749,7061,7373,7685,7997,8309,8621,9244,9620,10380,11132,11900,12650,13400,14150,14900]; let i = 0; while (i < t.length && vol > t[i]) i++; return `basket-${String(i + 1).padStart(2, '0')}.wbbasket.ru`; };
                    const wbPhotoBase = (nm: any) => { const n = Number(nm); if (!n) return ''; const vol = Math.floor(n / 100000), part = Math.floor(n / 1000); return `https://${hostFor(vol)}/vol${vol}/part${part}/${n}/images/c246x328/1`; };
                    const wbPhoto = (nm: any) => { const b = wbPhotoBase(nm); return b ? `${b}.webp` : ''; };
                    const wbPhotoBig = (nm: any) => { const n = Number(nm); if (!n) return ''; const vol = Math.floor(n / 100000), part = Math.floor(n / 1000); return `https://${hostFor(vol)}/vol${vol}/part${part}/${n}/images/big/1.webp`; };
                    const hasArticle = (p: any) => /^\d{4,}$/.test(String(p?.code || '').trim());
                    const rubK = (v: number) => Math.abs(v) >= 1000 ? Math.round(v / 1000).toLocaleString('ru-RU') + 'к ₽' : Math.round(v) + ' ₽';
                    // структура расходов (включая себестоимость проданного)
                    const costSumTotal = prods.reduce((a: number, p: any) => a + Number(p.costSum || 0), 0);
                    const costParts = [
                      { label: 'Себестоимость', v: costSumTotal, c: 'bg-orange-500' },
                      { label: 'Комиссия WB', v: Math.max(0, salesX - Number(sx.payout_net || 0)), c: 'bg-violet-500' },
                      { label: 'Логистика', v: Number(sx.logistics_sum || 0), c: 'bg-blue-500' },
                      { label: 'Хранение', v: Number(sx.storage_sum || 0), c: 'bg-cyan-500' },
                      { label: 'Штрафы', v: Number(sx.fine_sum || 0), c: 'bg-rose-500' },
                      { label: 'Реклама WB', v: Number(sx.withhold_sum || 0), c: 'bg-fuchsia-500' },
                      { label: 'Эквайринг/комиссии', v: Number(sx.acquiring_sum || 0), c: 'bg-amber-500' },
                      { label: 'Налог', v: Number(getUploadedTaxValue(sx) || 0), c: 'bg-slate-500' },
                    ].filter((p) => p.v > 0);
                    const costTotal = costParts.reduce((a, p) => a + p.v, 0);
                    // Детализация логистики по всем видам (из «Виды логистики…») по всем товарам отчёта.
                    const logKindsDetail = (() => {
                      const m = new Map<string, { sum: number; qty: number }>();
                      (prods || []).forEach((p: any) => {
                        const lk = p?.logKinds || p?.log_kinds || {};
                        Object.entries(lk).forEach(([k, v]: any) => {
                          const key = String(k || 'Прочее').trim() || 'Прочее';
                          const cur = m.get(key) || { sum: 0, qty: 0 };
                          cur.sum += Number(v?.sum || 0); cur.qty += Number(v?.qty || 0);
                          m.set(key, cur);
                        });
                      });
                      const arr = [...m.entries()].map(([kind, v]) => ({ kind, sum: v.sum, qty: v.qty }));
                      const total = arr.reduce((a, x) => a + x.sum, 0);
                      arr.forEach((x: any) => { x.pct = total !== 0 ? (x.sum / total) * 100 : 0; });
                      return { arr: arr.sort((a, b) => Math.abs(b.sum) - Math.abs(a.sum)), total };
                    })();
                    // Логистика по каждому товару (фото, артикул, виды логистики + метрики аномалий).
                    const logTotalAll = (prods || []).reduce((a: number, p: any) => a + Math.abs(Number(p.logistics || 0)), 0);
                    const logByProductAll = (prods || [])
                      .map((p: any) => {
                        const kinds = Object.entries(p?.logKinds || {})
                          .map(([k, v]: any) => ({ kind: String(k || 'Прочее').trim() || 'Прочее', sum: Number(v?.sum || 0), qty: Number(v?.qty || 0) }))
                          .filter((x: any) => Math.abs(x.sum) > 0.001 || x.qty > 0)
                          .sort((a: any, b: any) => Math.abs(b.sum) - Math.abs(a.sum));
                        const sumQty = (m: string) => kinds.filter((k: any) => k.kind.toLowerCase().includes(m)).reduce((a: number, k: any) => a + k.qty, 0);
                        const logistics = Number(p.logistics || 0);
                        const salesP = Number(p.sales || 0);
                        const cancelQty = sumQty('отмен');                 // заказал, но не выкупил
                        const orderQty = sumQty('к клиенту при продаже');   // доставлено клиенту (заказы)
                        const returnQty = sumQty('от клиента при возврате');
                        const logShare = salesP > 0 ? Math.abs(logistics) / salesP * 100 : (Math.abs(logistics) > 0 ? 9999 : 0);
                        return { code: p.code, name: p.name, logistics, sales: salesP, kinds, cancelQty, orderQty, returnQty, logShare };
                      })
                      .filter((p: any) => Math.abs(p.logistics) > 0.001 || p.kinds.length);
                    const logByProduct = (() => {
                      let arr = [...logByProductAll];
                      if (logProductFilter === 'anom') arr = arr.filter((p: any) => p.logShare >= 25).sort((a: any, b: any) => b.logShare - a.logShare);
                      else if (logProductFilter === 'cancel') arr = arr.filter((p: any) => p.cancelQty > 0).sort((a: any, b: any) => b.cancelQty - a.cancelQty);
                      else if (logProductFilter === 'order') arr = arr.filter((p: any) => p.orderQty > 0).sort((a: any, b: any) => b.orderQty - a.orderQty);
                      else arr = arr.sort((a: any, b: any) => Math.abs(b.logistics) - Math.abs(a.logistics));
                      return arr;
                    })();
                    // Прибыль отфильтрованных = их прибыль БЕЗ собственного хранения/рекламы
                    // + распределённые пропорционально общие хранение и реклама.
                    const profitNet = profitFilterActive
                      ? (sumP('profit') + sumP('storage') + sumP('withhold') - storageAlloc - withholdAlloc - Number(uploadedExtraCosts || 0))
                      : Number(getUploadedHeadlineProfitNet(s) || 0);
                    // Сравнение с выбранным периодом: дельта в % (для бейджей ▲/▼ на карточках).
                    const cmp = compareSummary;
                    const cmpDeltaOf = (cur: number, key: string): number | undefined => { if (!cmp) return undefined; const prev = Number(cmp[key] || 0); if (!prev) return undefined; return (cur - prev) / Math.abs(prev) * 100; };
                    const cmpProfit = cmp ? Number(getUploadedHeadlineProfitNet(cmp) || 0) : 0;
                    const cmpProfitDelta = (cmp && cmpProfit) ? (profitNet - cmpProfit) / Math.abs(cmpProfit) * 100 : undefined;
                    const retPctTotal = (Number(sx.sold_qty || 0) + Number(sx.return_qty || 0)) > 0 ? Number(sx.return_qty || 0) / (Number(sx.sold_qty || 0) + Number(sx.return_qty || 0)) * 100 : 0;
                    const logPct = salesX > 0 ? Number(sx.logistics_sum || 0) / salesX * 100 : 0;
                    const buyoutPct = (Number(sx.sold_qty || 0) + Number(sx.return_qty || 0)) > 0 ? Number(sx.sold_qty || 0) / (Number(sx.sold_qty || 0) + Number(sx.return_qty || 0)) * 100 : 0;
                    const Bars = ({ rows, val, color, fmt, photo }: any) => {
                      const max = Math.max(1, ...rows.map((r: any) => Math.abs(val(r))));
                      return (
                        <div className="space-y-1.5 max-h-80 overflow-auto pr-1">
                          {rows.length === 0 ? <div className="text-xs text-slate-400 py-4 text-center">Нет данных</div> : rows.map((r: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              {photo && (r.code ? <img src={wbPhoto(r.code)} data-fb="0" onError={(e: any) => { const el = e.currentTarget; if (el.dataset.fb === '0') { el.dataset.fb = '1'; el.src = wbPhotoBase(r.code) + '.jpg'; } else { el.style.visibility = 'hidden'; } }} onClick={() => setUploadedPhotoPreview({ src: wbPhotoBig(r.code), title: `${r.code} ${r.name || ''}` })} className="w-14 h-[72px] rounded-lg object-cover bg-slate-100 shrink-0 cursor-zoom-in" loading="lazy" /> : <div className="w-14 h-[72px] rounded-lg bg-slate-100 shrink-0" />)}
                              <div className="w-40 text-slate-600 leading-tight line-clamp-2 break-words" title={r.name || r.key}>{photo ? (r.code ? <a href={`https://www.wildberries.ru/catalog/${r.code}/detail.aspx`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-medium">{r.code}</a> : '—') : (r.name || r.key)}</div>
                              <div className="flex-1 h-4 bg-slate-100 rounded overflow-hidden"><div className={color(r)} style={{ width: `${Math.max(2, Math.abs(val(r)) / max * 100)}%`, height: '100%' }} /></div>
                              <div className="w-48 shrink-0 text-right text-[11px] leading-tight font-medium text-slate-700 whitespace-nowrap">{fmt(r)}</div>
                            </div>
                          ))}
                        </div>
                      );
                    };
                    const Card = ({ title, children }: any) => (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <h4 className="font-bold text-slate-800 text-sm mb-3">{title}</h4>
                        {children}
                      </div>
                    );

                    const tHeat = (t: number | undefined) => t == null ? 'text-slate-300' : t <= 5 ? 'text-sky-600' : t >= 22 ? 'text-rose-600' : t >= 14 ? 'text-amber-600' : 'text-emerald-600';
                    // График по дням: одна-две сглаженные кривые (каждая в своём масштабе) + выровненная таблица.
                    const DayTrend = ({ title, getVal, fmt, color, gradId, label, getVal2, fmt2, color2, gradId2, label2, maxLabels: maxLabelsProp, extraRows = [] as Array<{ label: string; cell: (d: any) => React.ReactNode }> }: any) => {
                      if (!days.length) return <Card title={title}><div className="text-xs text-slate-400 py-8 text-center">Нет дат в отчёте</div></Card>;
                      const n = days.length, VW = 1000, VH = 150, padT = 18, padB = 8;
                      const has2 = typeof getVal2 === 'function';
                      const xs = (i: number) => n <= 1 ? VW / 2 : ((i + 0.5) / n) * VW;
                      // Каждая серия масштабируется по своему максимуму, чтобы обе формы были видны.
                      const buildLine = (gv: (d: any) => number) => {
                        const maxV = Math.max(1, ...days.map((d: any) => Number(gv(d) || 0)));
                        const ys = (v: number) => padT + (1 - Math.max(0, v) / maxV) * (VH - padT - padB);
                        const pts = days.map((d: any, i: number) => [xs(i), ys(Number(gv(d) || 0))]);
                        let line = '';
                        pts.forEach((p: number[], i: number) => { if (i === 0) line = `M ${p[0].toFixed(1)},${p[1].toFixed(1)}`; else { const pr = pts[i - 1]; const cx = (pr[0] + p[0]) / 2; line += ` C ${cx.toFixed(1)},${pr[1].toFixed(1)} ${cx.toFixed(1)},${p[1].toFixed(1)} ${p[0].toFixed(1)},${p[1].toFixed(1)}`; } });
                        const area = pts.length ? `${line} L ${pts[pts.length - 1][0].toFixed(1)},${VH} L ${pts[0][0].toFixed(1)},${VH} Z` : '';
                        return { ys, line, area };
                      };
                      const s1 = buildLine(getVal);
                      const s2 = has2 ? buildLine(getVal2) : null;
                      const cell = 'flex-1 text-center whitespace-nowrap';
                      // Прорежывание под длинные периоды (30/60/90/180 дней): кривая рисуется по ВСЕМ дням,
                      // а точки-подписи и таблица (шт/дата/t°) показываются только на ~13 опорных днях,
                      // иначе подписи накладываются, а колонки таблицы становятся нечитаемо узкими.
                      const maxLabels = Math.max(3, Number(maxLabelsProp) || 13);
                      const step = Math.max(1, Math.ceil(n / maxLabels));
                      const sampled = days.map((d: any, i: number) => ({ d, i })).filter(({ i }: any) => i % step === 0 || i === n - 1);
                      const dmShort = (k: any) => { const dt = new Date(k); return `${String(dt.getDate()).padStart(2, '0')}.${String(dt.getMonth() + 1).padStart(2, '0')}`; };
                      return (
                        <Card title={title}>
                          {(label || label2) && (
                            <div className="flex items-center gap-4 mb-2 text-[11px] font-medium">
                              {label && <span className="flex items-center gap-1.5 text-slate-600"><span className="inline-block w-3 h-1.5 rounded-full" style={{ background: color }} />{label}</span>}
                              {has2 && label2 && <span className="flex items-center gap-1.5 text-slate-600"><span className="inline-block w-3 h-1.5 rounded-full" style={{ background: color2 }} />{label2}</span>}
                            </div>
                          )}
                          <div className="flex">
                            <div className="w-24 shrink-0" />
                            <div className="flex-1 relative">
                              <svg viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none" className="w-full" style={{ height: 240 }}>
                                <defs>
                                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.35" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient>
                                  {has2 && <linearGradient id={gradId2} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color2} stopOpacity="0.18" /><stop offset="100%" stopColor={color2} stopOpacity="0" /></linearGradient>}
                                </defs>
                                {s1.area && <path d={s1.area} fill={`url(#${gradId})`} />}
                                {s2 && s2.line && <path d={s2.line} fill="none" stroke={color2} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="5 4" opacity={0.9} />}
                                {s1.line && <path d={s1.line} fill="none" stroke={color} strokeWidth={2.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />}
                              </svg>
                              {sampled.map(({ d, i }: any) => {
                                const leftPct = (n <= 1 ? 0.5 : (i + 0.5) / n) * 100;
                                const topPct = (s1.ys(Number(getVal(d) || 0)) / VH) * 100;
                                return (
                                  <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${leftPct}%`, top: `${topPct}%` }} title={`${new Date(d.key).toLocaleDateString('ru-RU')}: ${fmt(Number(getVal(d) || 0))}${has2 ? ` · ${fmt2(Number(getVal2(d) || 0))}` : ''}`}>
                                    <div className="h-2.5 w-2.5 rounded-full bg-white" style={{ boxShadow: `0 0 0 2px ${color}` }} />
                                    <div className="absolute left-1/2 -translate-x-1/2 -top-4 text-[10px] font-semibold whitespace-nowrap" style={{ color }}>{fmt(Number(getVal(d) || 0))}</div>
                                  </div>
                                );
                              })}
                              {has2 && sampled.map(({ d, i }: any) => {
                                const leftPct = (n <= 1 ? 0.5 : (i + 0.5) / n) * 100;
                                const topPct = (s2!.ys(Number(getVal2(d) || 0)) / VH) * 100;
                                return (
                                  <div key={`b${i}`} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${leftPct}%`, top: `${topPct}%` }} title={`${new Date(d.key).toLocaleDateString('ru-RU')}: ${fmt2(Number(getVal2(d) || 0))}`}>
                                    <div className="h-2 w-2 rounded-full bg-white" style={{ boxShadow: `0 0 0 2px ${color2}` }} />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <div className="mt-3 space-y-1 text-[11px]">
                            {extraRows.map((er: any, ri: number) => (
                              <div key={ri} className="flex items-center gap-1">
                                <div className="w-24 shrink-0 text-slate-400">{er.label}</div>
                                <div className="flex-1 flex gap-1">{sampled.map(({ d, i }: any) => <div key={i} className={`${cell} font-medium text-slate-700`}>{er.cell(d)}</div>)}</div>
                              </div>
                            ))}
                            <div className="flex items-center gap-1">
                              <div className="w-24 shrink-0 text-slate-400">Дата</div>
                              <div className="flex-1 flex gap-1">{sampled.map(({ d, i }: any) => <div key={i} className={`${cell} text-slate-500`}>{dmShort(d.key)}</div>)}</div>
                            </div>
                            {weatherRegions.map((rg) => (
                              <div key={rg.name} className="flex items-center gap-1">
                                <div className="w-24 shrink-0 text-slate-500 truncate" title={`${rg.name} · ${rg.share.toFixed(0)}% продаж`}>🌡 {rg.name}</div>
                                <div className="flex-1 flex gap-1">{sampled.map(({ d, i }: any) => { const t = rg.temps[String(d.key || '').slice(0, 10)]; return <div key={i} className={`${cell} font-bold ${tHeat(t)}`} title={`${rg.name}, ${new Date(d.key).toLocaleDateString('ru-RU')}: ${t != null ? `${t > 0 ? '+' : ''}${t}°C` : 'нет данных'}`}>{t == null ? '—' : `${t > 0 ? '+' : ''}${t}°`}</div>; })}</div>
                              </div>
                            ))}
                          </div>
                          {step > 1 && <div className="mt-2 text-[10px] text-slate-400 text-right">Кривая — по всем {n} дн. Подписи и таблица прорежены: каждый {step}-й день. Наведи на точку для точного значения.</div>}
                        </Card>
                      );
                    };

                    // Дневные ряды для спарклайнов (последние дни периода).
                    const salesDays = days.map((d: any) => Number(d.sales_net || 0));
                    const soldDays = days.map((d: any) => Number(d.sold_qty || 0));
                    const deltaOf = (arr: number[]): number | null => {
                      if (!arr || arr.length < 2) return null;
                      const a = arr[arr.length - 1], b = arr[arr.length - 2];
                      if (!b) return null;
                      return (a - b) / Math.abs(b) * 100;
                    };

                    // Спарклайн: плавная линия + градиентная заливка, оживает при наведении.
                    const Spark = ({ data, color, id }: { data: number[]; color: string; id: string }) => {
                      if (!data || data.length < 2) return null;
                      const W = 120, H = 34;
                      const max = Math.max(...data), min = Math.min(...data);
                      const range = max - min || 1;
                      const pts = data.map((v, i) => {
                        const x = (i / (data.length - 1)) * W;
                        const y = H - 4 - ((v - min) / range) * (H - 8);
                        return [x, y];
                      });
                      const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
                      const area = `${line} L${W},${H} L0,${H} Z`;
                      const last = pts[pts.length - 1];
                      return (
                        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-9" data-no-invert>
                          <defs>
                            <linearGradient id={`sp-${id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={color} stopOpacity="0.35" />
                              <stop offset="100%" stopColor={color} stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path d={area} fill={`url(#sp-${id})`} className="opacity-60 group-hover:opacity-100 transition-opacity" />
                          <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-all group-hover:[stroke-width:2.5]" />
                          <circle cx={last[0]} cy={last[1]} r="2.5" fill={color} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </svg>
                      );
                    };

                    // Тёмная KPI-карточка как на дашбордах: число, %-бейдж, спарклайн, hover-анимация.
                    const StatCard = ({ label, value, sub, series, delta, color = '#34d399', accent, right, signOf }: any) => {
                      // Если задан signOf — красим карточку по знаку: минус → красная, плюс → зелёная.
                      const signed = typeof signOf === 'number' && Number.isFinite(signOf);
                      const neg = signed && signOf < 0;
                      const ring = !signed ? 'ring-white/10' : neg ? 'ring-rose-500/40' : 'ring-emerald-500/40';
                      const bg = !signed ? 'bg-slate-900' : neg ? 'bg-gradient-to-br from-rose-950/80 to-slate-900' : 'bg-gradient-to-br from-emerald-950/80 to-slate-900';
                      const valColor = !signed ? 'text-white' : neg ? 'text-rose-300' : 'text-emerald-300';
                      const glow = signed ? (neg ? '#fb7185' : '#34d399') : color;
                      return (
                      <div className={`group relative overflow-hidden rounded-2xl ${bg} p-3.5 ring-1 ${ring} shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30`} data-no-invert>
                        <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `radial-gradient(120px 80px at 80% 0%, ${glow}22, transparent 70%)` }} />
                        <div className="relative flex items-start justify-between gap-2">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</div>
                          {right ? right : (delta != null && (
                            <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${delta >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>{delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(0)}%</span>
                          ))}
                        </div>
                        <div className={`relative mt-1 text-2xl font-extrabold ${valColor} tabular-nums leading-tight`}>{value}</div>
                        {sub && <div className="relative text-[10px] text-slate-500 mt-0.5">{sub}</div>}
                        {series && series.length > 1 && <div className="relative mt-1.5"><Spark data={series} color={glow} id={label} /></div>}
                      </div>
                      );
                    };
                    const payoutHero = Number(sx.payout_net || 0);
                    const payoutPct = salesX > 0 ? Math.round(payoutHero / salesX * 100) : 0;
                    const avgCheck = Number(sx.sold_qty || 0) > 0 ? salesX / Number(sx.sold_qty || 0) : 0;
                    const orderedQty = Number(sx.ordered_qty || 0);
                    const soldQty = Number(sx.sold_qty || 0);
                    const retQtyHero = Number(sx.return_legs_qty || sx.return_qty || 0);
                    const buyoutRate = orderedQty > 0 ? soldQty / orderedQty * 100 : 0;
                    const retRate = orderedQty > 0 ? retQtyHero / orderedQty * 100 : 0;
                    const returnsSumHero = Number(sx.returns_gross || 0);
                    const soldSumHero = salesX;                         // выкуплено = чистые продажи
                    const orderedSumHero = Number(sx.ordered_retail_sum || 0) || (salesX + returnsSumHero);  // заказано = Σ «Цена розничная» по заказам
                    const taxValHero = Number(getUploadedTaxValue(sx) || 0);
                    const commissionWB = salesX - payoutHero;           // комиссия WB = продажи − к перечислению
                    // Прибыль/расходы считаем ЯВНО от summary-полей (не от построчной прибыли,
                    // которая при фильтре +/− плывёт из-за рекламы на «артикуле 0»). База — К перечислению.
                    //  «Твои расходы»  = себестоимость + реклама + налог + хранение + доп.
                    //  «Удержал WB»    = (Продажи − К перечислению)=комиссия + логистика + штрафы.
                    //  «Чистая прибыль»= К перечислению − логистика − штрафы − Твои расходы.
                    //  Тождество: Продажи − УдержалWB − ТвоиРасходы = Чистая прибыль.
                    //  Эквайринг НЕ вычитаем: в родной формуле to_pay_total (см. ~15556) его нет —
                    //  он уже учтён в комиссии, иначе прибыль задваивалась бы (поле даёт ~4% — нереально).
                    const wbOtherFees = Number(sx.logistics_sum || 0) + Number(sx.fine_sum || 0);
                    // Режим «с НДС» (ОСНО): НДС выходной с продаж, входной с себестоимости (к вычету),
                    // к уплате = разница; УСН-налог заменяется налогом на прибыль 25%.
                    const VAT_RATE = 0.22;
                    const PROFIT_TAX_RATE = 0.25;
                    // Услуги WB всегда приходят с НДС внутри — из них НДС только ВЫДЕЛЯЕМ.
                    const vatExtract = (amt: number) => (amt * VAT_RATE) / (1 + VAT_RATE);
                    // Товар/продажи — по переключателю «в сумме» / «сверху».
                    const vatOfSales = (amt: number) => uploadedVatSalesIncluded ? vatExtract(amt) : amt * VAT_RATE;
                    const vatOfCost = (amt: number) => uploadedVatCostIncluded ? vatExtract(amt) : amt * VAT_RATE;
                    const baseCosts = costSumTotal + Number(sx.withhold_sum || 0) + Number(sx.storage_sum || 0) + Number(uploadedExtraCosts || 0);
                    const vatOut = uploadedVatMode ? vatOfSales(salesX) : 0;
                    const vatInGoods = uploadedVatMode ? vatOfCost(costSumTotal) : 0;
                    // Входной НДС с услуг WB: комиссия, логистика, реклама, хранение.
                    // Штрафы НДС не облагаются, эквайринг — финуслуга (без НДС) — не берём.
                    // НДС комиссии — из колонки «НДС с Вознаграждения Вайлдберриз» (точно).
                    // Если колонки в отчёте нет (старые записи) — выделяем из разрыва Продажи−Кперечислению.
                    const commissionVatExact = Number(sx.wb_commission_vat || 0);
                    const commissionVat = Math.abs(commissionVatExact) > 0.005 ? commissionVatExact : vatExtract(commissionWB);
                    // Эквайринг с 2026 облагается НДС 22% — по галочке берём его НДС к вычету.
                    const acquiringVatIn = (uploadedVatMode && uploadedAcquiringVat) ? vatExtract(Number(sx.acquiring_sum || 0)) : 0;
                    const vatInServices = uploadedVatMode
                      ? commissionVat + vatExtract(Number(sx.logistics_sum || 0))
                        + vatExtract(Number(sx.withhold_sum || 0)) + vatExtract(Number(sx.storage_sum || 0)) + acquiringVatIn
                      : 0;
                    const vatIn = vatInGoods + vatInServices;
                    const vatToPay = vatOut - vatIn;                       // < 0 — к возмещению
                    const profitBeforeTax = payoutHero - wbOtherFees - baseCosts - (uploadedVatMode ? vatToPay : 0);
                    const profitTax = uploadedVatMode ? Math.max(0, profitBeforeTax) * PROFIT_TAX_RATE : 0;
                    const yourCosts = uploadedVatMode
                      ? baseCosts + vatToPay + profitTax
                      : baseCosts + taxValHero;
                    // Без обрезки в 0: если К перечислению > Продаж (компенсации/корректировки),
                    // комиссия отрицательная — показываем как есть, иначе ломается тождество
                    // Продажи − УдержалWB − ТвоиРасходы = Прибыль.
                    const wbHeld = (salesX - payoutHero) + wbOtherFees;
                    const profitFromPayout = payoutHero - wbOtherFees - yourCosts;
                    const R = 52, C = 2 * Math.PI * R, dash = C * Math.min(1, Math.max(0, payoutPct / 100));
                    return (
                      <div className="space-y-4 mb-2">
                        {/* Hero: тёмные KPI-карточки со спарклайнами и hover-анимацией */}
                        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-4 sm:p-5 shadow-lg" data-no-invert>
                          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                            <StatCard label="Продажи" value={rub(salesX)} sub={profitFilterActive ? 'фильтр активен' : 'за период'} series={profitFilterActive ? undefined : salesDays} delta={cmpDeltaOf(salesX, 'sales_net')} color="#34d399" />
                            <StatCard label="К перечислению" value={rub(payoutHero)} sub={`${payoutPct}% от продаж`} delta={cmpDeltaOf(payoutHero, 'payout_net')} color="#2dd4bf" />
                            <StatCard label="Выкуплено" value={`${soldQty.toLocaleString('ru-RU')} шт`} sub={rub(soldSumHero)} series={profitFilterActive ? undefined : soldDays} delta={cmpDeltaOf(soldQty, 'sold_qty')} color="#38bdf8" />
                            <StatCard label="Заказано" value={`${orderedQty.toLocaleString('ru-RU')} шт`} sub={rub(orderedSumHero)} color="#818cf8" />
                            <StatCard label="Возвраты" value={`${retQtyHero.toLocaleString('ru-RU')} шт`} sub={rub(returnsSumHero)} color="#fb7185" />
                            <StatCard label="Комиссия WB" value={rub(commissionWB)} sub={salesX > 0 ? `${pct(commissionWB / salesX * 100)} от продаж` : '—'} color="#22d3ee" />
                            {uploadedVatMode ? (
                              <StatCard label="Налог на прибыль" value={rub(profitTax)} sub="25% · ОСНО" color="#94a3b8" />
                            ) : (
                              <StatCard label="Налог" value={rub(taxValHero)} sub="ставка" color="#94a3b8" right={<button type="button" onClick={() => setUploadedTaxRateOverride((prev) => prev === 0.01 ? 0.06 : prev === 0.06 ? 0.15 : 0.01)} className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-indigo-300 hover:bg-white/20">{Math.round(getCurrentUploadedTaxRate() * 100)}%</button>} />
                            )}
                            <StatCard label="Себестоимость" value={rub(costSumTotal)} sub={salesX > 0 ? `${pct(costSumTotal / salesX * 100)} от продаж` : '—'} color="#fb923c" />
                            <StatCard label="Средний чек" value={`${avgCheck.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} ₽`} color="#a78bfa" />
                            <StatCard label="Логистика" value={rub(Number(sx.logistics_sum || 0))} sub={salesX > 0 ? `${pct(Number(sx.logistics_sum || 0) / salesX * 100)} от продаж` : '—'} color="#60a5fa" />
                            <StatCard label="Реклама WB" value={rub(Number(sx.withhold_sum || 0))} sub={salesX > 0 ? `${pct(Number(sx.withhold_sum || 0) / salesX * 100)} от продаж` : '—'} color="#e879f9" />
                            <StatCard label="Хранение" value={rub(Number(sx.storage_sum || 0))} sub={salesX > 0 ? `${pct(Number(sx.storage_sum || 0) / salesX * 100)} от продаж` : '—'} color="#22d3ee" />
                            {uploadedVatMode && (
                              <>
                                <StatCard label="НДС выходной" value={rub(vatOut)} sub={`с продаж · ${uploadedVatSalesIncluded ? '×22/122' : '×22%'}`} color="#f472b6" />
                                <StatCard label="НДС входной" value={rub(vatIn)} sub={`товар ${rubK(vatInGoods)} + услуги WB ${rubK(vatInServices)}`} color="#c084fc" />
                                <StatCard label="НДС к уплате" value={rub(vatToPay)} sub={vatToPay < 0 ? 'к возмещению' : 'выходной − входной'} signOf={-vatToPay} />
                              </>
                            )}
                            <StatCard label="Чистая прибыль" value={rub(profitFromPayout)} sub={salesX > 0 ? `маржа ${pct(profitFromPayout / salesX * 100)}` : '—'} signOf={profitFromPayout} />
                            <StatCard label="Рентабельность (ROI)" value={costSumTotal > 0 ? pct(profitFromPayout / costSumTotal * 100) : '—'} sub="прибыль / себест." signOf={profitFromPayout} />
                            <StatCard label="Твои расходы" value={rub(yourCosts)} sub={`${uploadedVatMode ? 'себест+реклама+НДС+налог' : 'себест+реклама+налог'}${salesX > 0 ? ` · ${pct(yourCosts / salesX * 100)}` : ''}`} color="#fbbf24" />
                            <StatCard label="Удержал WB" value={rub(wbHeld)} sub={salesX > 0 ? `комиссия+логистика · ${pct(wbHeld / salesX * 100)}` : 'комиссия+логистика'} color="#f59e0b" />
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm border-t border-white/10 pt-3">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400">Доп. траты:</span>
                              <input type="number" min="0" step="0.01" value={uploadedExtraCosts} onChange={(e) => setUploadedExtraCosts(Number(e.target.value || 0))} className="w-36 px-2 py-1 text-sm rounded-lg bg-white/10 border border-white/15 text-white placeholder-slate-500" />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer select-none" title="ОСНО: НДС 22% входной (в себестоимости) и выходной (с продаж), налог на прибыль 25% вместо УСН.">
                              <input
                                type="checkbox"
                                checked={uploadedVatMode}
                                onChange={(e) => {
                                  const v = e.target.checked;
                                  setUploadedVatMode(v);
                                  try { localStorage.setItem('uploaded_vat_mode_v1', v ? '1' : '0'); } catch {}
                                }}
                                className="w-4 h-4 accent-indigo-500"
                              />
                              <span className="text-slate-400">Считать НДС (22%)</span>
                            </label>
                            {uploadedVatMode && (
                              <>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-400 text-xs">Продажи:</span>
                                  <Select
                                    value={uploadedVatSalesIncluded ? 'in' : 'on'}
                                    onChange={(e) => {
                                      const v = e.target.value === 'in';
                                      setUploadedVatSalesIncluded(v);
                                      try { localStorage.setItem('uploaded_vat_sales_included_v1', v ? '1' : '0'); } catch {}
                                    }}
                                    className="px-2 py-1 text-xs rounded-lg bg-white/10 border border-white/15 text-white"
                                    title="Как считать НДС с продаж"
                                  >
                                    <option value="on" className="text-slate-800">×22% сверху</option>
                                    <option value="in" className="text-slate-800">×22/122 (НДС в сумме)</option>
                                  </Select>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-400 text-xs">Себестоимость:</span>
                                  <Select
                                    value={uploadedVatCostIncluded ? 'in' : 'on'}
                                    onChange={(e) => {
                                      const v = e.target.value === 'in';
                                      setUploadedVatCostIncluded(v);
                                      try { localStorage.setItem('uploaded_vat_cost_included_v1', v ? '1' : '0'); } catch {}
                                    }}
                                    className="px-2 py-1 text-xs rounded-lg bg-white/10 border border-white/15 text-white"
                                    title="Как считать НДС в себестоимости"
                                  >
                                    <option value="in" className="text-slate-800">×22/122 (НДС в сумме)</option>
                                    <option value="on" className="text-slate-800">×22% сверху</option>
                                  </Select>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer select-none" title="С 01.01.2026 эквайринг облагается НДС 22%. Берём его входной НДС к вычету (сам эквайринг уже в комиссии — повторно не вычитаем).">
                                  <input
                                    type="checkbox"
                                    checked={uploadedAcquiringVat}
                                    onChange={(e) => { const v = e.target.checked; setUploadedAcquiringVat(v); try { localStorage.setItem('uploaded_acquiring_vat_v1', v ? '1' : '0'); } catch {} }}
                                    className="w-4 h-4 accent-indigo-500"
                                  />
                                  <span className="text-slate-400 text-xs">НДС с эквайринга к вычету</span>
                                </label>
                              </>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400">Сравнить с:</span>
                              <Select value={compareReportId} onChange={(e) => loadCompareSummary(e.target.value)} className="px-2 py-1 text-xs rounded-lg bg-white/10 border border-white/15 text-white max-w-[230px]">
                                <option value="" className="text-slate-800">— не сравнивать —</option>
                                {[...(uploadedHistory || [])].reverse().map((h: any) => {
                                  const ps = h?.summary_json?.period_start ? new Date(h.summary_json.period_start).toLocaleDateString('ru-RU') : '';
                                  const pe = h?.summary_json?.period_end ? new Date(h.summary_json.period_end).toLocaleDateString('ru-RU') : '';
                                  return <option key={h.id} value={h.id} className="text-slate-800">{ps}–{pe}{h?.summary_json?.report_number ? ` · №${h.summary_json.report_number}` : ''}</option>;
                                })}
                              </Select>
                              {compareSummary && <span className="text-[11px] text-indigo-300">▲/▼ к выбранному периоду</span>}
                            </div>
                            <div className="flex items-center gap-1.5 sm:ml-auto">
                              <span className="text-slate-400 text-xs mr-1">Фильтр товаров:</span>
                              <button type="button" onClick={() => setSummaryProfitFilter((f) => f === 'pos' ? 'all' : 'pos')} title="Только прибыльные" className={`flex h-8 w-8 items-center justify-center rounded-lg text-lg font-bold transition-colors ${summaryProfitFilter === 'pos' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-emerald-300 hover:bg-white/20'}`}>+</button>
                              <button type="button" onClick={() => setSummaryProfitFilter((f) => f === 'neg' ? 'all' : 'neg')} title="Только минусовые" className={`flex h-8 w-8 items-center justify-center rounded-lg text-lg font-bold transition-colors ${summaryProfitFilter === 'neg' ? 'bg-rose-500 text-white' : 'bg-white/10 text-rose-300 hover:bg-white/20'}`}>−</button>
                              {summaryProfitFilter !== 'all' && (
                                <button type="button" onClick={() => setSummaryProfitFilter('all')} className="ml-1 px-2 py-1 text-xs rounded-lg bg-white/10 text-slate-300 hover:bg-white/20">Сбросить</button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Крупная таблица товаров с фото и сортировкой */}
                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden w-full">
                          <div className="px-4 py-3 border-b border-slate-100 font-bold text-slate-800 text-sm">Товары ({prods.length})</div>
                          <div className="overflow-auto max-h-[70vh]">
                            <table className="w-full min-w-[1100px] text-xs">
                              <thead className="bg-slate-50 sticky top-0 z-10">
                                <tr className="select-none">
                                  {([['photo', 'Фото'], ['code', 'Артикул'], ['ordered', 'Заказано'], ['sold', 'Продано'], ['perDay', 'Ед/день'], ['sales', 'Продажи'], ['margin', 'Маржа %'], ['roi', 'Рентаб. %'], ['profit', 'Прибыль'], ['ppu', 'Приб/шт'], ['retPct', 'Возврат % / общ.'], ['share', 'Доля %'], ['abcOrd', 'ABC']] as [string, string][]).map(([f, l]) => (
                                    <th key={f} style={f === 'photo' ? { width: 176 } : f === 'code' ? { width: 240 } : undefined} className={`px-2.5 py-2 whitespace-nowrap ${f === 'photo' ? '' : 'cursor-pointer hover:text-indigo-600'} ${['code', 'photo'].includes(f) ? 'text-left' : f === 'abcOrd' ? 'text-center' : 'text-right'}`} onClick={() => f !== 'photo' && setSummaryProdSort((p) => ({ field: f, dir: p.field === f && p.dir === 'desc' ? 'asc' : 'desc' }))}>{l}{summaryProdSort.field === f ? (summaryProdSort.dir === 'asc' ? ' ▲' : ' ▼') : ''}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {[...prods].map((p) => ({ ...p, ppu: p.sold > 0 ? p.profit / p.sold : 0 })).filter((p: any) => summaryProfitFilter === 'all' ? true : summaryProfitFilter === 'pos' ? Number(p.profit) >= 0 : Number(p.profit) < 0).sort((a: any, b: any) => { const f = summaryProdSort.field; const m = summaryProdSort.dir === 'asc' ? 1 : -1; return ((a[f] || 0) - (b[f] || 0)) * m; }).map((p: any, i: number) => {
                                  const exp = !!summaryExpanded[String(p.code)];
                                  return (
                                  <React.Fragment key={i}>
                                  <tr className={`border-t border-slate-100 hover:bg-slate-50 ${p.profit < 0 ? 'bg-rose-50/40' : ''}`}>
                                    <td className="px-2.5 py-1.5">{(p.code && !isSvc(p.code)) ? <img src={wbPhoto(p.code)} data-fb="0" onError={(e: any) => { const el = e.currentTarget; if (el.dataset.fb === '0') { el.dataset.fb = '1'; el.src = wbPhotoBase(p.code) + '.jpg'; } else { el.style.visibility = 'hidden'; } }} onClick={() => setUploadedPhotoPreview({ src: wbPhotoBig(p.code), title: `${p.code} ${p.name || ''}` })} className="w-40 h-48 rounded-lg object-cover bg-slate-100 cursor-zoom-in" loading="lazy" /> : <div className="w-40 h-48 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 text-center px-1">{isSvc(p.code) ? svcLabel : ''}</div>}</td>
                                    <td className="px-2.5 py-1.5 text-left font-medium whitespace-nowrap">{isSvc(p.code) ? <span className="text-slate-700 font-semibold">{svcLabel}</span> : <a href={`https://www.wildberries.ru/catalog/${p.code}/detail.aspx`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{p.code}</a>}{(p.sizes && p.sizes.length > 0) && <button onClick={() => setSummaryExpanded((prev) => ({ ...prev, [String(p.code)]: !prev[String(p.code)] }))} className="ml-2 text-[10px] px-1.5 py-0.5 rounded border border-slate-200 text-slate-500 hover:bg-slate-100">{exp ? '▲ размеры' : '▾ размеры'}</button>}{p.vendorCode ? <div className="text-[11px] text-slate-400 font-normal mt-0.5" title="Артикул продавца">{p.vendorCode}</div> : null}</td>
                                    <td className="px-2.5 py-1.5 text-right whitespace-nowrap"><div className="font-medium text-slate-700">{Number(p.ordered).toLocaleString('ru-RU')} шт</div><div className="text-[11px] text-slate-400">{rub(p.orderedSum)}</div></td>
                                    <td className="px-2.5 py-1.5 text-right">{Number(p.sold).toLocaleString('ru-RU')}</td>
                                    <td className="px-2.5 py-1.5 text-right text-slate-600">{p.perDay.toLocaleString('ru-RU', { maximumFractionDigits: 1 })}</td>
                                    <td className="px-2.5 py-1.5 text-right">{rub(p.sales)}</td>
                                    <td className={`px-2.5 py-1.5 text-right font-medium ${p.margin < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{pct(p.margin)}</td>
                                    <td className={`px-2.5 py-1.5 text-right font-medium ${p.roi < 0 ? 'text-rose-600' : 'text-teal-600'}`}>{p.costSum > 0 ? pct(p.roi) : '—'}</td>
                                    <td className={`px-2.5 py-1.5 text-right font-bold ${p.profit < 0 ? 'text-rose-600' : 'text-slate-800'}`}>{rub(p.profit)}</td>
                                    <td className="px-2.5 py-1.5 text-right">{rub(p.ppu)}</td>
                                    <td className={`px-2.5 py-1.5 text-right ${p.retPct > 20 ? 'text-rose-600 font-medium' : 'text-slate-600'}`}>{pct(p.retPct)} <span className="text-slate-400" title="Доля возвратов этого товара во всех продажах (шт)">/ {pct(totalSoldAll > 0 ? p.ret / totalSoldAll * 100 : 0)}</span></td>
                                    <td className="px-2.5 py-1.5 text-right text-violet-700">{pct(p.share)}</td>
                                    <td className="px-2.5 py-1.5 text-center"><span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${p.abc === 'A' ? 'bg-emerald-100 text-emerald-700' : p.abc === 'B' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>{p.abc}</span></td>
                                  </tr>
                                  {exp && p.sizes && p.sizes.length > 0 && (
                                    <tr className="bg-slate-50/70">
                                      <td colSpan={13} className="px-3 py-3">
                                        <div className="overflow-auto rounded-lg border border-slate-200 bg-white">
                                          {(() => {
                                            // Логистика берётся точно из строк с размером (без распределения).
                                            const lkNorm = (v: any) => (v && typeof v === 'object') ? { sum: Number(v.sum || 0), qty: Number(v.qty || 0) } : { sum: Number(v || 0), qty: 0 };
                                            const lkEntries = Object.entries(p.logKinds || {}).map(([k, v]: any) => [k, lkNorm(v)] as [string, { sum: number; qty: number }]).filter(([, v]) => Math.abs(v.sum) > 0.001).sort((a, b) => Math.abs(b[1].sum) - Math.abs(a[1].sum));
                                            const lkTotal = lkEntries.reduce((s: number, [, v]) => s + v.sum, 0);
                                            const lkQtyTotal = lkEntries.reduce((s: number, [, v]) => s + v.qty, 0);
                                            return (
                                          <>
                                          <table className="min-w-full text-[11px]">
                                            <thead className="bg-slate-100 text-slate-500">
                                              <tr>
                                                {([['size', 'Размер'], ['sales_net', 'Продажи'], ['returns_gross', 'Возвраты ₽'], ['logistics_sum', 'Логистика'], ['payout_net', 'К перечисл.'], ['to_pay_total', 'Итого к оплате'], ['__cost', 'Себест.'], ['__ppu', 'Прибыль/шт'], ['__profit', 'Заработок'], ['sold_qty', 'Продано шт'], ['return_qty', 'Возвр. шт']] as [string, string][]).map(([key, h], hi) => {
                                                  const sortable = key !== '__cost';
                                                  const cur = summarySizeSort[String(p.code)];
                                                  return (
                                                    <th key={hi} onClick={() => { if (!sortable) return; setSummarySizeSort((prev) => { const c = prev[String(p.code)]; const dir = c && c.key === key && c.dir === 'desc' ? 'asc' : 'desc'; return { ...prev, [String(p.code)]: { key, dir } }; }); }} className={`px-2 py-1.5 whitespace-nowrap ${sortable ? 'cursor-pointer hover:text-indigo-600 select-none' : ''} ${hi === 0 ? 'text-left' : 'text-right'}`}>{h}{cur && cur.key === key ? (cur.dir === 'asc' ? ' ▲' : ' ▼') : ''}</th>
                                                  );
                                                })}
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {(() => {
                                                // ИТОГО по товару — над разбивкой по размерам.
                                                const tProfit = Number(p.profit || 0);
                                                const tPpu = Number(p.sold || 0) > 0 ? tProfit / Number(p.sold) : 0;
                                                return (
                                                  <tr className="border-b-2 border-indigo-200 bg-indigo-50 font-semibold">
                                                    <td className="px-2 py-1.5 text-left text-indigo-800">ИТОГО</td>
                                                    <td className="px-2 py-1.5 text-right">{rub(p.sales)}</td>
                                                    <td className="px-2 py-1.5 text-right text-rose-600">{rub(p.retSum)}</td>
                                                    <td className="px-2 py-1.5 text-right">{rub(p.logistics)}</td>
                                                    <td className="px-2 py-1.5 text-right">{rub(p.payoutNet)}</td>
                                                    <td className="px-2 py-1.5 text-right text-indigo-700">{rub(p.toPay)}</td>
                                                    <td className="px-2 py-1.5 text-right text-slate-500">{rub(p.costSum)}</td>
                                                    <td className={`px-2 py-1.5 text-right ${tPpu < 0 ? 'text-rose-600' : 'text-slate-700'}`}>{rub(tPpu)}</td>
                                                    <td className={`px-2 py-1.5 text-right ${tProfit < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{rub(tProfit)}</td>
                                                    <td className="px-2 py-1.5 text-right">{Number(p.sold || 0).toLocaleString('ru-RU')}</td>
                                                    <td className="px-2 py-1.5 text-right">{Number(p.ret || 0).toLocaleString('ru-RU')}</td>
                                                  </tr>
                                                );
                                              })()}
                                              {(() => {
                                                // Применяем сортировку детализации размеров.
                                                const cost = Number(p.cost || 0);
                                                const metric = (z: any, key: string) => {
                                                  const zs = Number(z.sold_qty ?? z.sold ?? 0);
                                                  const tp = Number(z.to_pay_total ?? 0);
                                                  const pr = getUploadedRowProfitAfterTaxes(tp, Number(z.sales_net || 0), cost * zs, Number(z.wb_commission_vat || 0), Number(z.logistics_sum || 0), Number(z.withhold_sum || 0) + Number(z.storage_sum || 0));
                                                  if (key === '__profit') return pr;
                                                  if (key === '__ppu') return zs > 0 ? pr / zs : 0;
                                                  if (key === 'size') return null;
                                                  return Number(z[key] || 0);
                                                };
                                                const srt = summarySizeSort[String(p.code)];
                                                let arr = [...p.sizes];
                                                if (srt) {
                                                  const m = srt.dir === 'asc' ? 1 : -1;
                                                  if (srt.key === 'size') arr.sort((a: any, b: any) => compareSizes(String(a?.size || ''), String(b?.size || '')) * m);
                                                  else arr.sort((a: any, b: any) => ((Number(metric(a, srt.key)) - Number(metric(b, srt.key))) * m));
                                                }
                                                return arr;
                                              })().map((z: any, zi: number) => {
                                                const zsold = Number(z.sold_qty ?? z.sold ?? 0);          // валовое продано — сходится с «Продано»
                                                const ztopay = Number(z.to_pay_total ?? 0);
                                                const zlog = Number(z.logistics_sum ?? 0);
                                                // Налог по текущему режиму (УСН или ОСНО+НДС) — как в строке товара.
                                                const zprofit = getUploadedRowProfitAfterTaxes(
                                                  ztopay,
                                                  Number(z.sales_net || 0),
                                                  Number(p.cost || 0) * zsold,
                                                  Number(z.wb_commission_vat || 0),
                                                  Number(z.logistics_sum || 0),
                                                  Number(z.withhold_sum || 0) + Number(z.storage_sum || 0),
                                                );
                                                const zppu = zsold > 0 ? zprofit / zsold : 0;
                                                return (
                                                  <tr key={zi} className="border-t border-slate-100">
                                                    <td className="px-2 py-1.5 text-left font-medium text-slate-700">{z.size}</td>
                                                    <td className="px-2 py-1.5 text-right">{rub(z.sales_net ?? 0)}</td>
                                                    <td className="px-2 py-1.5 text-right text-rose-500">{rub(z.returns_gross ?? 0)}</td>
                                                    <td className="px-2 py-1.5 text-right">{rub(zlog)}</td>
                                                    <td className="px-2 py-1.5 text-right">{rub(z.payout_net ?? 0)}</td>
                                                    <td className="px-2 py-1.5 text-right text-indigo-600">{rub(ztopay)}</td>
                                                    <td className="px-2 py-1.5 text-right text-slate-400">{rub((Number(p.cost) || 0) * zsold)}</td>
                                                    <td className={`px-2 py-1.5 text-right ${zppu < 0 ? 'text-rose-600' : 'text-slate-700'}`}>{rub(zppu)}</td>
                                                    <td className={`px-2 py-1.5 text-right font-semibold ${zprofit < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{rub(zprofit)}</td>
                                                    <td className="px-2 py-1.5 text-right">{zsold.toLocaleString('ru-RU')}</td>
                                                    <td className="px-2 py-1.5 text-right">{Number(z.return_qty ?? z.ret ?? 0).toLocaleString('ru-RU')}</td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                          {lkEntries.length > 0 && (
                                            <div className="px-3 py-3 border-t border-slate-200 bg-slate-50/60">
                                              <div className="text-[11px] font-semibold text-slate-600 mb-2">Логистика по видам · {rub(lkTotal)} · {lkQtyTotal.toLocaleString('ru-RU')} шт</div>
                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                                {lkEntries.map(([k, v], i: number) => (
                                                  <div key={i} className="flex items-center justify-between gap-2 text-[11px] bg-white rounded-md border border-slate-200 px-2.5 py-1.5">
                                                    <span className="text-slate-600 truncate" title={k}>{k}</span>
                                                    <span className="font-medium text-slate-800 whitespace-nowrap">{rub(v.sum)} · {v.qty.toLocaleString('ru-RU')} шт{lkTotal !== 0 ? ` · ${pct(v.sum / lkTotal * 100)}` : ''}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                          </>
                                            );
                                          })()}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                  </React.Fragment>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Динамика по дням — крупно, во всю ширину */}
                        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4 mb-4">
                          <DayTrend title="Заказы по дням" color="#6366f1" gradId="trendSales" maxLabels={8} getVal={(d: any) => Number(d.ordered_retail_sum || 0) || Number(d.sales_net || 0)} fmt={(v: number) => rubK(v)} extraRows={[{ label: 'Сумма, ₽', cell: (d: any) => rub(Number(d.ordered_retail_sum || 0) || Number(d.sales_net || 0)) }, { label: 'Кол-во', cell: (d: any) => `${(Number(d.ordered_qty || 0) || Number(d.sold_qty || 0)).toLocaleString('ru-RU')} шт` }]} />
                          <DayTrend title="Выкупы по дням" color="#10b981" gradId="trendBuy" maxLabels={8} getVal={(d: any) => d.sold_qty} fmt={(v: number) => `${Number(v || 0).toLocaleString('ru-RU')} шт`} extraRows={[{ label: 'Кол-во', cell: (d: any) => `${Number(d.sold_qty || 0).toLocaleString('ru-RU')} шт` }, { label: 'Сумма, ₽', cell: (d: any) => rub(Number(d.sales_net || 0)) }]} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 auto-rows-fr">
                          {/* Структура расходов — % считается от продаж */}
                          <Card title="Структура расходов (% от продаж)">
                            <div className="flex h-5 w-full overflow-hidden rounded-full bg-slate-100 mb-4">
                              {costParts.map((p) => costTotal > 0 && <div key={p.label} className={p.c} style={{ width: `${p.v / costTotal * 100}%` }} title={`${p.label}: ${rub(p.v)}`} />)}
                            </div>
                            <div className="space-y-2.5">
                              {costParts.map((p) => { const sp = sales > 0 ? p.v / sales * 100 : 0; return (
                                <div key={p.label}>
                                  <div className="flex items-center justify-between text-xs mb-1"><span className="flex items-center gap-1.5 text-slate-600"><span className={`w-2.5 h-2.5 rounded-sm ${p.c}`} />{p.label}</span><span className="font-medium text-slate-800">{rub(p.v)} · {pct(sp)}</span></div>
                                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className={`${p.c} h-full rounded-full`} style={{ width: `${Math.min(100, sp)}%` }} /></div>
                                </div>
                              ); })}
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                              <div className="rounded-xl bg-slate-50 p-3"><div className="text-[11px] text-slate-500">Все расходы</div><div className="font-extrabold text-slate-800">{rub(Math.max(0, sales - profitFromPayout))}</div><div className="text-[11px] text-slate-400">{sales > 0 ? pct(Math.max(0, sales - profitFromPayout) / sales * 100) : '—'} от продаж</div></div>
                              <div className="rounded-xl bg-emerald-50 p-3"><div className="text-[11px] text-emerald-600">Чистая прибыль</div><div className="font-extrabold text-emerald-700">{rub(profitFromPayout)}</div><div className="text-[11px] text-emerald-500/70">маржа {sales > 0 ? pct(profitFromPayout / sales * 100) : '—'}</div></div>
                            </div>
                          </Card>

                          {/* Детализация логистики по видам (по всем товарам отчёта) */}
                          <Card title="Логистика по видам">
                            {logKindsDetail.arr.length === 0 ? (
                              <div className="text-xs text-slate-400 py-6 text-center">Нет данных по логистике</div>
                            ) : (
                              <>
                                <div className="space-y-2 max-h-80 overflow-auto pr-1">
                                  {logKindsDetail.arr.map((r: any, i: number) => (
                                    <div key={i}>
                                      <div className="flex items-center justify-between gap-2 text-xs mb-1">
                                        <span className="text-slate-600 truncate" title={r.kind}>{r.kind}</span>
                                        <span className="font-semibold text-slate-800 whitespace-nowrap">{rub(r.sum)}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(100, Math.abs(r.pct))}%` }} /></div>
                                        <span className="w-32 shrink-0 text-right text-[11px] text-slate-400 whitespace-nowrap">{r.qty.toLocaleString('ru-RU')} шт · {pct(r.pct)}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                                  <span className="text-slate-600">Вся логистика</span>
                                  <span className="text-slate-800">{rub(logKindsDetail.total)} · 100%</span>
                                </div>
                              </>
                            )}
                          </Card>

                          {/* ABC-анализ по доле в выручке */}
                          <Card title="ABC-анализ (по доле в выручке)">
                            <div className="flex h-5 w-full overflow-hidden rounded-full bg-slate-100 mb-4">
                              {abcGroups.map((a) => a.shareSales > 0 && <div key={a.g} className={a.g === 'A' ? 'bg-emerald-500' : a.g === 'B' ? 'bg-amber-500' : 'bg-slate-400'} style={{ width: `${a.shareSales}%` }} title={`${a.g}: ${pct(a.shareSales)}`} />)}
                            </div>
                            <div className="space-y-2">
                              {abcGroups.map((a) => (
                                <div key={a.g} className="flex items-center justify-between gap-2 text-xs rounded-xl border border-slate-100 px-3 py-2">
                                  <span className="flex items-center gap-2"><span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-white ${a.g === 'A' ? 'bg-emerald-500' : a.g === 'B' ? 'bg-amber-500' : 'bg-slate-400'}`}>{a.g}</span><span className="text-slate-600">{a.count} тов.</span></span>
                                  <span className="text-right"><span className="font-bold text-slate-800">{rub(a.sales)}</span> <span className="text-slate-400">· {pct(a.shareSales)}</span><div className={`text-[11px] ${a.profit < 0 ? 'text-rose-500' : 'text-emerald-600/80'}`}>приб. {rub(a.profit)}</div></span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 text-[11px] text-slate-400">A — ключевые (до 80% выручки), B — средние (до 95%), C — хвост.</div>
                          </Card>

                          {/* Неликвид — нет продаж за период */}
                          <Card title={`Неликвид · нет продаж (${deadStock.length})`}>
                            {deadStock.length === 0 ? (
                              <div className="text-xs text-slate-400 py-6 text-center">Все товары с продажами 👍</div>
                            ) : (
                              <div className="space-y-1.5 max-h-80 overflow-auto pr-1">
                                {deadStock.map((p: any, i: number) => (
                                  <div key={i} className="flex items-center gap-2 text-xs rounded-lg border border-slate-100 px-2 py-1.5">
                                    {(p.code && !isSvc(p.code)) ? <img src={wbPhoto(p.code)} data-fb="0" onError={(e: any) => { const el = e.currentTarget; if (el.dataset.fb === '0') { el.dataset.fb = '1'; el.src = wbPhotoBase(p.code) + '.jpg'; } else { el.style.visibility = 'hidden'; } }} onClick={() => setUploadedPhotoPreview({ src: wbPhotoBig(p.code), title: `${p.code} ${p.name || ''}` })} className="w-10 h-12 rounded object-cover bg-slate-100 shrink-0 cursor-zoom-in" loading="lazy" /> : <div className="w-10 h-12 rounded bg-slate-100 shrink-0" />}
                                    <div className="min-w-0 flex-1">
                                      <div className="font-medium text-slate-700">{isSvc(p.code) ? svcLabel : <a href={`https://www.wildberries.ru/catalog/${p.code}/detail.aspx`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{p.code}</a>}</div>
                                      <div className="text-slate-400 truncate" title={p.name}>{p.name || ''}</div>
                                    </div>
                                    <div className="text-right text-slate-400 whitespace-nowrap">зак. {Number(p.ordered).toLocaleString('ru-RU')}{p.ret > 0 ? <div className="text-rose-500">возвр. {Number(p.ret).toLocaleString('ru-RU')}</div> : null}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </Card>

                          {/* Логистика по товарам */}
                          <Card title="Логистика по товарам">
                            <Bars photo rows={[...prods].filter((p: any) => Math.abs(p.logistics) > 0).sort((a: any, b: any) => Math.abs(b.logistics) - Math.abs(a.logistics)).slice(0, 15)} val={(r: any) => Math.abs(r.logistics)} color={() => 'bg-blue-500'} fmt={(r: any) => `${rub(r.logistics)}${r.sales > 0 ? ` · ${pct(Math.abs(r.logistics) / r.sales * 100)}` : ''}`} />
                          </Card>

                          {/* Топ-5 товаров по прибыли (только с артикулами) */}
                          <Card title="Топ-5 товаров по прибыли">
                            <Bars photo rows={top.filter(hasArticle).slice(0, 5)} val={(r: any) => r.profit} color={() => 'bg-emerald-500'} fmt={(r: any) => rub(r.profit)} />
                          </Card>

                          {/* Антитоп-5 товаров (только с артикулами) */}
                          <Card title="Антитоп-5 (минимальная прибыль)">
                            <Bars photo rows={[...byProfitDesc].filter(hasArticle).slice(-5).reverse()} val={(r: any) => Math.abs(r.profit)} color={(r: any) => r.profit < 0 ? 'bg-rose-500' : 'bg-amber-400'} fmt={(r: any) => rub(r.profit)} />
                          </Card>

                        </div>

                        {/* Гео-блок: склады и города продаж — карта/список */}
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-slate-800 text-sm">География продаж</h4>
                          <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden text-xs">
                            <button onClick={() => setGeoView('map')} className={`px-3 py-1.5 font-medium ${geoView === 'map' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Карта</button>
                            <button onClick={() => setGeoView('list')} className={`px-3 py-1.5 font-medium ${geoView === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Список</button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
                          <Card title="Склады продаж">
                            {wh.length === 0
                              ? <div className="h-48 flex items-center justify-center text-center text-slate-400 text-xs px-4">Нет данных о складе отгрузки.<br />WB API (отчёт о реализации) не передаёт колонку «Склад» — она есть только в файле из кабинета.</div>
                              : geoView === 'map'
                              ? <React.Suspense fallback={<div className="h-48 flex items-center justify-center text-slate-400 text-xs">Карта…</div>}><SalesMap rows={[...wh].sort((a, b) => b.sales_net - a.sales_net)} accent="#60a5fa" /></React.Suspense>
                              : <Bars rows={[...wh].sort((a, b) => b.sales_net - a.sales_net)} val={(r: any) => r.sales_net} color={() => 'bg-blue-500'} fmt={(r: any) => `${Number(r.sold_qty).toLocaleString('ru-RU')} шт · ${rub(r.sales_net)} · ${pct(r.share_pct)}`} />}
                          </Card>
                          <Card title={`Города продаж (${offices.length})`}>
                            {geoView === 'map'
                              ? <React.Suspense fallback={<div className="h-48 flex items-center justify-center text-slate-400 text-xs">Карта…</div>}><SalesMap rows={offices} accent="#22d3ee" /></React.Suspense>
                              : <Bars rows={offices} val={(r: any) => r.share_pct} color={() => 'bg-cyan-500'} fmt={(r: any) => `${Number(r.sold_qty).toLocaleString('ru-RU')} шт · ${rub(r.sales_net)} · ${pct(r.share_pct)}`} />}
                          </Card>
                        </div>

                        {/* Логистика по каждому товару: фото, артикул, полная детализация видов логистики */}
                        <div className="mt-4">
                          <Card title={`Логистика по товарам (${logByProduct.length})`}>
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {([
                                ['all', 'Все'],
                                ['anom', 'Аномальная логистика'],
                                ['cancel', 'Много отмен'],
                                ['order', 'Много заказов'],
                              ] as Array<[any, string]>).map(([k, lbl]) => (
                                <button key={k} type="button" onClick={() => setLogProductFilter(k)} className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border shadow-sm ${logProductFilter === k ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{lbl}</button>
                              ))}
                            </div>
                            {logProductFilter !== 'all' && (
                              <div className="text-[11px] text-slate-400 mb-2">
                                {logProductFilter === 'anom' && 'Товары, где логистика ≥ 25% выручки — съедает прибыль.'}
                                {logProductFilter === 'cancel' && 'Товары с отменами (заказал, но не выкупил) — лишняя логистика без продажи.'}
                                {logProductFilter === 'order' && 'Товары с наибольшим числом доставок к клиенту.'}
                              </div>
                            )}
                            {logByProduct.length === 0 ? (
                              <div className="text-xs text-slate-400 py-6 text-center">Нет данных по этому фильтру</div>
                            ) : (
                              <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
                                {logByProduct.map((p: any, i: number) => (
                                  <div key={i} className="flex gap-3 border border-slate-100 rounded-xl p-2">
                                    {(p.code && !isSvc(p.code))
                                      ? <img src={wbPhoto(p.code)} data-fb="0" onError={(e: any) => { const el = e.currentTarget; if (el.dataset.fb === '0') { el.dataset.fb = '1'; el.src = wbPhotoBase(p.code) + '.jpg'; } else { el.style.visibility = 'hidden'; } }} onClick={() => setUploadedPhotoPreview({ src: wbPhotoBig(p.code), title: `${p.code} ${p.name || ''}` })} className="w-16 h-20 rounded-lg object-cover bg-slate-100 shrink-0 cursor-zoom-in" loading="lazy" />
                                      : <div className="w-16 h-20 rounded-lg bg-slate-100 shrink-0" />}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-2">
                                        {isSvc(p.code)
                                          ? <span className="text-slate-700 font-semibold text-sm">{svcLabel}</span>
                                          : <a href={`https://www.wildberries.ru/catalog/${p.code}/detail.aspx`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-semibold text-sm">{p.code}</a>}
                                        <span className="font-bold text-slate-800 text-sm whitespace-nowrap">{rub(p.logistics)}{p.sales > 0 ? <span className="ml-1 text-[11px] font-normal text-slate-400">({pct(p.logShare)} выручки)</span> : null}</span>
                                      </div>
                                      <div className="text-[11px] text-slate-500 truncate mb-1" title={p.name}>{p.name}</div>
                                      <div className="flex flex-wrap gap-1">
                                        {p.kinds.length === 0 ? <span className="text-[11px] text-slate-400">—</span> : p.kinds.map((k: any, ki: number) => (
                                          <span key={ki} className="inline-flex items-center gap-1 text-[10.5px] bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5" title={k.kind}>
                                            <span className="text-slate-500 max-w-[180px] truncate">{k.kind}</span>
                                            <span className="font-semibold text-slate-700">{rub(k.sum)}</span>
                                            <span className="text-slate-400">· {k.qty.toLocaleString('ru-RU')} шт</span>
                                            <span className="text-blue-500">· {p.logistics !== 0 ? pct(k.sum / p.logistics * 100) : '—'} тов</span>
                                            <span className="text-fuchsia-500">· {logTotalAll !== 0 ? pct(k.sum / logTotalAll * 100) : '—'} общ</span>
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </Card>
                        </div>

                      </div>
                    );
                  })()}
                  </>
                  )}

                  {uploadedViewTab === 'table' && (
                  <>
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                    <div className="bg-slate-50 rounded-lg p-2 min-w-[150px] shrink-0"><div className="text-xs text-slate-500">Номенклатур</div><div className="font-bold">{uploadedSummaryForView.items}</div></div>
                    <div className="bg-slate-50 rounded-lg p-2 min-w-[150px] shrink-0"><div className="text-xs text-slate-500">Продажи</div><div className="font-bold">{Number(uploadedSummaryForView.sales_net || 0).toLocaleString('ru-RU')}</div></div>
                    {uploadedVatMode ? (
                      <div className="bg-slate-50 rounded-lg p-2 min-w-[170px] shrink-0"><div className="flex items-center justify-between gap-2"><div className="text-xs text-slate-500">НДС к уплате</div><span className="text-[11px] px-2 py-0.5 rounded-full border border-indigo-200 text-indigo-700 bg-white">22%</span></div><div className="font-bold">{(() => { const VAT = 0.22; const ex = (a: number) => (a * VAT) / (1 + VAT); const vS = (a: number) => uploadedVatSalesIncluded ? ex(a) : a * VAT; const vC = (a: number) => uploadedVatCostIncluded ? ex(a) : a * VAT; const s = uploadedSummaryForView; const inServ = Number(s?.wb_commission_vat || 0) + ex(Number(s?.logistics_sum || 0) + Number(s?.withhold_sum || 0) + Number(s?.storage_sum || 0)); return (vS(Number(s?.sales_net || 0)) - vC(Number(s?.cost_total || 0)) - inServ).toLocaleString('ru-RU', { maximumFractionDigits: 2 }); })()}</div></div>
                    ) : (
                      <div className="bg-slate-50 rounded-lg p-2 min-w-[170px] shrink-0"><div className="flex items-center justify-between gap-2"><div className="text-xs text-slate-500">Налоги</div><button type="button" onClick={() => setUploadedTaxRateOverride((prev) => prev === 0.01 ? 0.06 : prev === 0.06 ? 0.15 : 0.01)} className="text-[11px] px-2 py-0.5 rounded-full border border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50">{Math.round(getCurrentUploadedTaxRate() * 100)}%</button></div><div className="font-bold">{Number(getUploadedTaxValue(uploadedSummaryForView)).toLocaleString('ru-RU', { maximumFractionDigits: 2 })}</div></div>
                    )}
                    <div className="bg-slate-50 rounded-lg p-2 min-w-[150px] shrink-0"><div className="text-xs text-slate-500">Возвраты</div><div className="font-bold">{Number(uploadedSummaryForView.returns_gross || 0).toLocaleString('ru-RU')}</div></div>
                    <div className="bg-slate-50 rounded-lg p-2 min-w-[150px] shrink-0"><div className="text-xs text-slate-500">Логистика</div><div className="font-bold">{Number(uploadedSummaryForView.logistics_sum || 0).toLocaleString('ru-RU')}</div></div>
                    <div className="bg-slate-50 rounded-lg p-2 min-w-[150px] shrink-0"><div className="text-xs text-slate-500">К перечислению</div><div className="font-bold">{Number(uploadedSummaryForView.payout_net || 0).toLocaleString('ru-RU')}</div></div>
                    <div className="bg-slate-50 rounded-lg p-2 min-w-[150px] shrink-0"><div className="text-xs text-slate-500">Итого к оплате (WB)</div><div className="font-bold">{Number(uploadedSummaryForView.to_pay_total || 0).toLocaleString('ru-RU')}</div></div>
                    <div className="bg-slate-50 rounded-lg p-2 min-w-[180px] shrink-0">
                      <div className="text-xs text-slate-500">Доп траты</div>
                      <input type="number" min="0" step="0.01" value={uploadedExtraCosts} onChange={(e) => setUploadedExtraCosts(Number(e.target.value || 0))} className="mt-1 w-full px-2 py-1 text-sm border border-slate-300 rounded" />
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2 min-w-[150px] shrink-0"><div className="text-xs text-slate-500">Заработок</div><div className="font-bold">{Number(getUploadedHeadlineProfitNet(uploadedSummaryForView)).toLocaleString('ru-RU', { maximumFractionDigits: 2 })}</div></div>
                    <div className="bg-slate-50 rounded-lg p-2 min-w-[150px] shrink-0"><div className="text-xs text-slate-500">Штрафы</div><div className="font-bold">{Number(uploadedSummaryForView.fine_sum || 0).toLocaleString('ru-RU')}</div></div>
                    <div className="bg-slate-50 rounded-lg p-2 min-w-[150px] shrink-0"><div className="text-xs text-slate-500">Хранение</div><div className="font-bold">{Number(uploadedSummaryForView.storage_sum || 0).toLocaleString('ru-RU')}</div></div>
                    <div className="bg-slate-50 rounded-lg p-2 min-w-[150px] shrink-0"><div className="text-xs text-slate-500">Реклама WB</div><div className="font-bold">{Number(uploadedSummaryForView.withhold_sum || 0).toLocaleString('ru-RU')}</div></div>
                    <div className="bg-slate-50 rounded-lg p-2 min-w-[150px] shrink-0"><div className="text-xs text-slate-500">Кол-во проданных</div><div className="font-bold">{Number(uploadedSummaryForView.sold_qty || 0).toLocaleString('ru-RU')}</div></div>
                    <div className="bg-slate-50 rounded-lg p-2 min-w-[150px] shrink-0"><div className="text-xs text-slate-500">Кол-во возвратов</div><div className="font-bold">{Number(uploadedSummaryForView.return_qty || 0).toLocaleString('ru-RU')}</div></div>
                    <div className="bg-slate-50 rounded-lg p-2 min-w-[150px] shrink-0"><div className="text-xs text-slate-500">Эквайринг/Комиссии</div><div className="font-bold">{Number(uploadedSummaryForView.acquiring_sum || 0).toLocaleString('ru-RU')}</div></div>
                    <div className="bg-slate-50 rounded-lg p-2 min-w-[150px] shrink-0"><div className="text-xs text-slate-500">Комиссия эквайринга, %</div><div className="font-bold">{Number(uploadedSummaryForView.acquiring_percent || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 })}</div></div>
                  </div>
                  {uploadedTableRowsHidden > 0 && (
                    <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                      Показаны первые {renderedUploadedAnalyticsRows.length.toLocaleString('ru-RU')} строк из {sortedFilteredUploadedAnalytics.length.toLocaleString('ru-RU')}. Для полного списка используйте поиск/фильтры или скачайте Excel.
                    </div>
                  )}
                  <div className="overflow-auto max-h-[84vh] border border-slate-100 rounded-lg">
                    <table className="min-w-full text-sm border-separate border-spacing-0">
                      <thead className="bg-white/95 backdrop-blur sticky top-0 z-50 text-left text-slate-600 shadow-sm">
                        <tr>
                          <th className="px-3 py-2 sticky top-0 left-0 bg-slate-50 z-[70] w-[140px] min-w-[140px] max-w-[140px] border-r border-slate-200 shadow-[2px_0_0_rgba(229,231,235,0.9)]">Фото</th>
                          <th className="px-3 py-2 sticky top-0 left-[140px] bg-slate-50 z-[70] w-[160px] min-w-[160px] max-w-[160px] border-r border-slate-200 shadow-[2px_0_0_rgba(229,231,235,0.9)]"><button type="button" onClick={() => { setUploadedSortKey('code'); setUploadedSortDir((d) => uploadedSortKey === 'code' ? (d === 'asc' ? 'desc' : 'asc') : 'asc'); }} className="px-2 py-1 text-xs rounded-full bg-blue-600 text-white hover:bg-blue-700">Код номенклатуры</button></th>
                          <th className="px-3 py-2 sticky top-0 left-[300px] bg-slate-50 z-[70] w-[320px] min-w-[320px] max-w-[320px] border-r border-slate-200 shadow-[2px_0_0_rgba(229,231,235,0.9)]"><button type="button" onClick={() => { setUploadedSortKey('name'); setUploadedSortDir((d) => uploadedSortKey === 'name' ? (d === 'asc' ? 'desc' : 'asc') : 'asc'); }} className="px-2 py-1 text-xs rounded-full bg-blue-600 text-white hover:bg-blue-700">Название</button></th>
                          <th className={`px-3 py-2 sticky top-0 bg-slate-50 z-50 ${isUploadedColVisible('sales_net') ? '' : 'hidden'}`}><button type="button" onClick={() => { setUploadedSortKey('sales_net'); setUploadedSortDir((d) => uploadedSortKey === 'sales_net' ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); }} className="px-2 py-1 text-xs rounded-full bg-blue-600 text-white hover:bg-blue-700">Продажи</button></th>
                          <th className={`px-3 py-2 sticky top-0 bg-slate-50 z-50 ${isUploadedColVisible('returns_gross') ? '' : 'hidden'}`}><button type="button" onClick={() => { setUploadedSortKey('returns_gross'); setUploadedSortDir((d) => uploadedSortKey === 'returns_gross' ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); }} className="px-2 py-1 text-xs rounded-full bg-blue-600 text-white hover:bg-blue-700">Возвраты</button></th>
                          <th className={`px-3 py-2 sticky top-0 bg-slate-50 z-50 ${isUploadedColVisible('logistics_sum') ? '' : 'hidden'}`}><button type="button" onClick={() => { setUploadedSortKey('logistics_sum'); setUploadedSortDir((d) => uploadedSortKey === 'logistics_sum' ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); }} className="px-2 py-1 text-xs rounded-full bg-blue-600 text-white hover:bg-blue-700">Логистика</button></th>
                          <th className={`px-3 py-2 sticky top-0 bg-slate-50 z-50 ${isUploadedColVisible('payout_net') ? '' : 'hidden'}`}><button type="button" onClick={() => { setUploadedSortKey('payout_net'); setUploadedSortDir((d) => uploadedSortKey === 'payout_net' ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); }} className="px-3 py-1 text-xs whitespace-nowrap rounded-full bg-blue-600 text-white hover:bg-blue-700">К перечислению</button></th>
                          <th className={`px-3 py-2 sticky top-0 bg-slate-50 z-50 ${isUploadedColVisible('fine_sum') ? '' : 'hidden'}`}><button type="button" onClick={() => { setUploadedSortKey('fine_sum'); setUploadedSortDir((d) => uploadedSortKey === 'fine_sum' ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); }} className="px-2 py-1 text-xs rounded-full bg-blue-600 text-white hover:bg-blue-700">Штрафы</button></th>
                          <th className={`px-3 py-2 sticky top-0 bg-slate-50 z-50 ${isUploadedColVisible('storage_sum') ? '' : 'hidden'}`}><button type="button" onClick={() => { setUploadedSortKey('storage_sum'); setUploadedSortDir((d) => uploadedSortKey === 'storage_sum' ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); }} className="px-2 py-1 text-xs rounded-full bg-blue-600 text-white hover:bg-blue-700">Хранение</button></th>
                          <th className={`px-3 py-2 sticky top-0 bg-slate-50 z-50 ${isUploadedColVisible('withhold_sum') ? '' : 'hidden'}`}><button type="button" onClick={() => { setUploadedSortKey('withhold_sum'); setUploadedSortDir((d) => uploadedSortKey === 'withhold_sum' ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); }} className="px-2 py-1 text-xs rounded-full bg-blue-600 text-white hover:bg-blue-700">Удержания</button></th>
                          <th className={`px-3 py-2 sticky top-0 bg-slate-50 z-50 ${isUploadedColVisible('to_pay_total') ? '' : 'hidden'}`}><button type="button" onClick={() => { setUploadedSortKey('to_pay_total'); setUploadedSortDir((d) => uploadedSortKey === 'to_pay_total' ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); }} className="px-3 py-1 text-xs whitespace-nowrap rounded-full bg-blue-600 text-white hover:bg-blue-700" title="Итого к оплате (WB)">Итого к оплате</button></th>
                          <th className="px-3 py-2 sticky top-0 bg-slate-50 z-50"><button type="button" onClick={() => { setUploadedSortKey('cost'); setUploadedSortDir((d) => uploadedSortKey === 'cost' ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); }} className="px-2 py-1 text-xs rounded-full bg-blue-600 text-white hover:bg-blue-700">Себестоимость</button></th>
                          <th className="px-3 py-2 sticky top-0 bg-slate-50 z-50"><button type="button" onClick={() => { setUploadedSortKey('avg_profit'); setUploadedSortDir((d) => uploadedSortKey === 'avg_profit' ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); }} className="px-2 py-1 text-xs rounded-full bg-blue-600 text-white hover:bg-blue-700">Средний заработок с ед.</button></th>
                          <th className="px-3 py-2 sticky top-0 bg-slate-50 z-50"><button type="button" onClick={() => { setUploadedSortKey('profit_total'); setUploadedSortDir((d) => uploadedSortKey === 'profit_total' ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); }} className="px-2 py-1 text-xs rounded-full bg-blue-600 text-white hover:bg-blue-700">Заработок</button></th>
                          <th className={`px-3 py-2 sticky top-0 bg-slate-50 z-50 ${isUploadedColVisible('sold_qty') ? '' : 'hidden'}`}><button type="button" onClick={() => { setUploadedSortKey('sold_qty'); setUploadedSortDir((d) => uploadedSortKey === 'sold_qty' ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); }} className="px-2 py-1 text-xs rounded-full bg-blue-600 text-white hover:bg-blue-700">Кол-во проданных</button></th>
                          <th className={`px-3 py-2 sticky top-0 bg-slate-50 z-50 ${isUploadedColVisible('return_qty') ? '' : 'hidden'}`}><button type="button" onClick={() => { setUploadedSortKey('return_qty'); setUploadedSortDir((d) => uploadedSortKey === 'return_qty' ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); }} className="px-2 py-1 text-xs rounded-full bg-blue-600 text-white hover:bg-blue-700">Кол-во возвратов</button></th>
                          <th className={`px-3 py-2 sticky top-0 bg-slate-50 z-50 ${isUploadedColVisible('acquiring_sum') ? '' : 'hidden'}`}><button type="button" onClick={() => { setUploadedSortKey('acquiring_sum'); setUploadedSortDir((d) => uploadedSortKey === 'acquiring_sum' ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); }} className="px-2 py-1 text-xs rounded-full bg-blue-600 text-white hover:bg-blue-700">Эквайринг/Комиссии</button></th>
                          <th className={`px-3 py-2 sticky top-0 bg-slate-50 z-50 ${isUploadedColVisible('acquiring_percent') ? '' : 'hidden'}`}><button type="button" onClick={() => { setUploadedSortKey('acquiring_percent'); setUploadedSortDir((d) => uploadedSortKey === 'acquiring_percent' ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); }} className="px-2 py-1 text-xs rounded-full bg-blue-600 text-white hover:bg-blue-700">Размер комиссии, %</button></th>
                        </tr>
                      </thead>
                      <tbody>
                        {renderedUploadedAnalyticsRows.map((row, idx) => {
                          const rowKey = `${row.code || ''}|${row.name || ''}`;
                          const rowOpen = !!uploadedSizeDetailsOpen[rowKey];
                          let reconciledSizeRows = buildReconciledSizeRows(row);

                          const visibleSizeRowsBase = reconciledSizeRows.filter((sz: any) => {
                            const sizeName = String(sz?.size || '').trim();
                            const allZero =
                              Number(sz?.sales_net || 0) === 0 &&
                              Number(sz?.returns_gross || 0) === 0 &&
                              Number(sz?.logistics_sum || 0) === 0 &&
                              Number(sz?.payout_net || 0) === 0 &&
                              Number(sz?.fine_sum || 0) === 0 &&
                              Number(sz?.storage_sum || 0) === 0 &&
                              Number(sz?.withhold_sum || 0) === 0 &&
                              Number(sz?.to_pay_total || 0) === 0 &&
                              Number(sz?.sold_net_qty || 0) === 0 &&
                              Number(sz?.return_qty || 0) === 0 &&
                              Number(sz?.acquiring_sum || 0) === 0;
                            if (allZero) return false;
                            if (!sizeName) return false;
                            return true;
                          });

                          const sizeSort = uploadedSizeSortByRow[rowKey] || { key: 'size', dir: 'asc' as const };
                          const visibleSizeRows = [...visibleSizeRowsBase].sort((a: any, b: any) => {
                            const key = sizeSort.key;
                            if (key === 'size') {
                              const cmp = String(a?.size || '').localeCompare(String(b?.size || ''), 'ru', { numeric: true });
                              return sizeSort.dir === 'asc' ? cmp : -cmp;
                            }

                            const metric = (x: any) => {
                              if (key === 'avg_profit' || key === 'profit_total') {
                                const sold = Number(x?.sold_qty ?? 0);
                                const profitTotal = sold > 0
                                  ? getUploadedRowProfitAfterTaxes(Number(x?.to_pay_total || 0), Number(x?.sales_net || 0), getUploadedCostValue(row) * sold, Number(x?.wb_commission_vat || 0), Number(x?.logistics_sum || 0), Number(x?.withhold_sum || 0) + Number(x?.storage_sum || 0))
                                  : 0;
                                if (key === 'profit_total') return profitTotal;
                                return sold > 0 ? profitTotal / sold : 0;
                              }
                              return Number(x?.[key] || 0);
                            };

                            const av = metric(a);
                            const bv = metric(b);
                            if (av === bv) return 0;
                            return sizeSort.dir === 'asc' ? av - bv : bv - av;
                          });
                          return (
                          <>
                          <tr key={`${row.code}-${idx}`} className="border-t border-slate-100 hover:bg-slate-50/80 group">
                            <td className="px-3 py-2 sticky left-0 bg-white group-hover:bg-white z-30 w-[140px] min-w-[140px] max-w-[140px] border-r border-slate-200 shadow-[2px_0_0_rgba(229,231,235,0.9)]">
                              {getUploadedPhoto(row.code) ? (
                                <img
                                  src={getUploadedPhoto(row.code)}
                                  alt={row.name || 'товар'}
                                  crossOrigin="anonymous"
                                  referrerPolicy="no-referrer"
                                  className="w-32 h-40 object-contain rounded border border-slate-200 bg-white p-1 cursor-zoom-in"
                                  onClick={(e) => {
                                    const src = (e.currentTarget as HTMLImageElement).src;
                                    if (src) setUploadedPhotoPreview({ src, title: row.name || row.code || 'Фото товара' });
                                  }}
                                  onLoad={(e) => {
                                    const el = e.currentTarget as HTMLImageElement;
                                    if ((el.naturalWidth || 0) < 120 || (el.naturalHeight || 0) < 120) {
                                      if (el.src) uploadedFailedPhotoUrlsRef.current.add(el.src);
                                      const list = getUploadedPhotoCandidates(row.code);
                                      const idx = Number(el.dataset.idx || '0');
                                      const next = idx + 1;
                                      if (next < list.length) {
                                        el.dataset.idx = String(next);
                                        el.src = list[next];
                                      }
                                    }
                                  }}
                                  onError={(e) => {
                                    const el = e.currentTarget as HTMLImageElement;
                                    if (el.src) uploadedFailedPhotoUrlsRef.current.add(el.src);
                                    const list = getUploadedPhotoCandidates(row.code);
                                    const idx = Number(el.dataset.idx || '0');
                                    const next = idx + 1;
                                    if (next < list.length) {
                                      el.dataset.idx = String(next);
                                      el.src = list[next];
                                    }
                                  }}
                                />
                              ) : (
                                <div className="w-32 h-40 rounded border border-slate-200 bg-slate-100 text-slate-400 text-xs flex items-center justify-center">N/A</div>
                              )}
                            </td>
                            <td className="px-3 py-2 sticky left-[140px] bg-white group-hover:bg-white z-30 w-[160px] min-w-[160px] max-w-[160px] border-r border-slate-200 shadow-[2px_0_0_rgba(229,231,235,0.9)]">{row.code ? <a href={`https://www.wildberries.ru/catalog/${encodeURIComponent(String(row.code))}/detail.aspx`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{row.code}</a> : '-'}{row.vendor_code ? <div className="text-[11px] text-slate-400 font-normal mt-0.5" title="Артикул поставщика">{row.vendor_code}</div> : null}</td>
                            <td className="px-3 py-2 sticky left-[300px] bg-white group-hover:bg-white z-30 w-[320px] min-w-[320px] max-w-[320px] border-r border-slate-200 shadow-[2px_0_0_rgba(229,231,235,0.9)] align-top">
                              <div className="whitespace-normal break-words leading-5" title={row.name || ''}>{row.name || '-'}</div>
                              <div className="mt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUploadedSizeDetailsOpen((prev) => {
                                      const nextOpen = !prev[rowKey];
                                      if (nextOpen) {
                                        setUploadedSizeSortByRow((s) => ({ ...s, [rowKey]: { key: 'size', dir: 'asc' } }));
                                      }
                                      return { ...prev, [rowKey]: nextOpen };
                                    });
                                  }}
                                  className="px-2.5 py-1 text-xs font-medium rounded-md border border-indigo-400 text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                                >
                                  {rowOpen ? '▾ Скрыть размеры' : '▸ Детализация размеров'}
                                </button>
                              </div>
                                                          </td>
                            <td className={`px-3 py-2 ${isUploadedColVisible('sales_net') ? '' : 'hidden'}`}>{Number(row.sales_net || 0).toLocaleString('ru-RU')}</td>
                            <td className={`px-3 py-2 ${isUploadedColVisible('returns_gross') ? '' : 'hidden'}`}>{Number(row.returns_gross || 0).toLocaleString('ru-RU')}</td>
                            <td className={`px-3 py-2 ${isUploadedColVisible('logistics_sum') ? '' : 'hidden'}`}>{Number(row.logistics_sum || 0).toLocaleString('ru-RU')}</td>
                            <td className={`px-3 py-2 ${isUploadedColVisible('payout_net') ? '' : 'hidden'}`}>{Number(row.payout_net || 0).toLocaleString('ru-RU')}</td>
                            <td className={`px-3 py-2 ${isUploadedColVisible('fine_sum') ? '' : 'hidden'}`}>{Number(row.fine_sum || 0).toLocaleString('ru-RU')}</td>
                            <td className={`px-3 py-2 ${isUploadedColVisible('storage_sum') ? '' : 'hidden'}`}>{Number(row.storage_sum || 0).toLocaleString('ru-RU')}</td>
                            <td className={`px-3 py-2 ${isUploadedColVisible('withhold_sum') ? '' : 'hidden'}`}>{Number(row.withhold_sum || 0).toLocaleString('ru-RU')}</td>
                            <td className={`px-3 py-2 font-medium ${isUploadedColVisible('to_pay_total') ? '' : 'hidden'} ${Number(row.to_pay_total || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{Number(row.to_pay_total || 0).toLocaleString('ru-RU')}</td>
                            <td className="px-3 py-2">{getUploadedCostValue(row).toLocaleString('ru-RU', { maximumFractionDigits: 2 })}</td>
                            <td className="px-3 py-2">{getUploadedAvgProfitAfterTax(row).toLocaleString('ru-RU', { maximumFractionDigits: 2 })}</td>
                            <td className={`px-3 py-2 font-medium ${(getUploadedProfitAfterTax(row) >= 0) ? 'text-emerald-600' : 'text-red-600'}`}>{getUploadedProfitAfterTax(row).toLocaleString('ru-RU', { maximumFractionDigits: 2 })}</td>
                            <td className={`px-3 py-2 ${isUploadedColVisible('sold_qty') ? '' : 'hidden'}`}>{Number(row.sold_qty || 0).toLocaleString('ru-RU')}</td>
                            <td className={`px-3 py-2 ${isUploadedColVisible('return_qty') ? '' : 'hidden'}`}>{Number(row.return_qty || 0).toLocaleString('ru-RU')}</td>
                            <td className={`px-3 py-2 ${isUploadedColVisible('acquiring_sum') ? '' : 'hidden'}`}>{Number(row.acquiring_sum || 0).toLocaleString('ru-RU')}</td>
                            <td className={`px-3 py-2 ${isUploadedColVisible('acquiring_percent') ? '' : 'hidden'}`}>{Number(row.acquiring_percent || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 })}</td>
                          </tr>

                          {rowOpen && (
                            visibleSizeRows.length > 0 ? (
                              <>
                                <tr className="border-t border-slate-100 bg-indigo-50/70">
                                  <td className="px-3 py-2 sticky left-0 bg-indigo-50 z-20 w-[140px] min-w-[140px] max-w-[140px] border-r border-slate-200" />
                                  <td className="px-3 py-2 sticky left-[140px] bg-indigo-50 z-20 w-[160px] min-w-[160px] max-w-[160px] border-r border-slate-200" />
                                  <td className="px-3 py-2 sticky left-[300px] bg-indigo-50 z-20 w-[320px] min-w-[320px] max-w-[320px] border-r border-slate-200 text-xs font-semibold text-indigo-800">
                                    Размер
                                  </td>
                                  <td className={`px-3 py-2 text-xs ${isUploadedColVisible('sales_net') ? '' : 'hidden'}`}>
                                    <button type="button" onClick={() => setUploadedSizeSortByRow((prev) => {
                                      const cur = prev[rowKey] || { key: 'size', dir: 'asc' as const };
                                      const dir = cur.key === 'sales_net' ? (cur.dir === 'asc' ? 'desc' : 'asc') : 'desc';
                                      return { ...prev, [rowKey]: { key: 'sales_net', dir } };
                                    })} className="px-2 py-1 rounded-md border border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-100 text-xs">Продажи{uploadedSizeSortByRow[rowKey]?.key === 'sales_net' ? (uploadedSizeSortByRow[rowKey]?.dir === 'asc' ? ' ↑' : ' ↓') : ''}</button>
                                  </td>
                                  <td className={`px-3 py-2 text-xs ${isUploadedColVisible('returns_gross') ? '' : 'hidden'}`}>
                                    <button type="button" onClick={() => setUploadedSizeSortByRow((prev) => {
                                      const cur = prev[rowKey] || { key: 'size', dir: 'asc' as const };
                                      const dir = cur.key === 'returns_gross' ? (cur.dir === 'asc' ? 'desc' : 'asc') : 'desc';
                                      return { ...prev, [rowKey]: { key: 'returns_gross', dir } };
                                    })} className="px-2 py-1 rounded-md border border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-100 text-xs">Возвраты{uploadedSizeSortByRow[rowKey]?.key === 'returns_gross' ? (uploadedSizeSortByRow[rowKey]?.dir === 'asc' ? ' ↑' : ' ↓') : ''}</button>
                                  </td>
                                  <td className={`px-3 py-2 text-xs ${isUploadedColVisible('logistics_sum') ? '' : 'hidden'}`}>
                                    <button type="button" onClick={() => setUploadedSizeSortByRow((prev) => {
                                      const cur = prev[rowKey] || { key: 'size', dir: 'asc' as const };
                                      const dir = cur.key === 'logistics_sum' ? (cur.dir === 'asc' ? 'desc' : 'asc') : 'desc';
                                      return { ...prev, [rowKey]: { key: 'logistics_sum', dir } };
                                    })} className="px-2 py-1 rounded-md border border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-100 text-xs">Логистика{uploadedSizeSortByRow[rowKey]?.key === 'logistics_sum' ? (uploadedSizeSortByRow[rowKey]?.dir === 'asc' ? ' ↑' : ' ↓') : ''}</button>
                                  </td>
                                  <td className={`px-3 py-2 text-xs ${isUploadedColVisible('payout_net') ? '' : 'hidden'}`}>
                                    <button type="button" onClick={() => setUploadedSizeSortByRow((prev) => {
                                      const cur = prev[rowKey] || { key: 'size', dir: 'asc' as const };
                                      const dir = cur.key === 'payout_net' ? (cur.dir === 'asc' ? 'desc' : 'asc') : 'desc';
                                      return { ...prev, [rowKey]: { key: 'payout_net', dir } };
                                    })} className="px-2 py-1 rounded-md border border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-100 text-xs">К перечисл.{uploadedSizeSortByRow[rowKey]?.key === 'payout_net' ? (uploadedSizeSortByRow[rowKey]?.dir === 'asc' ? ' ↑' : ' ↓') : ''}</button>
                                  </td>
                                  <td className={`px-3 py-2 text-xs ${isUploadedColVisible('fine_sum') ? '' : 'hidden'}`} />
                                  <td className={`px-3 py-2 text-xs ${isUploadedColVisible('storage_sum') ? '' : 'hidden'}`} />
                                  <td className={`px-3 py-2 text-xs ${isUploadedColVisible('withhold_sum') ? '' : 'hidden'}`} />
                                  <td className={`px-3 py-2 text-xs ${isUploadedColVisible('to_pay_total') ? '' : 'hidden'}`}>
                                    <button type="button" onClick={() => setUploadedSizeSortByRow((prev) => {
                                      const cur = prev[rowKey] || { key: 'size', dir: 'asc' as const };
                                      const dir = cur.key === 'to_pay_total' ? (cur.dir === 'asc' ? 'desc' : 'asc') : 'desc';
                                      return { ...prev, [rowKey]: { key: 'to_pay_total', dir } };
                                    })} className="px-2 py-1 rounded-md border border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-100 text-xs">Итого{uploadedSizeSortByRow[rowKey]?.key === 'to_pay_total' ? (uploadedSizeSortByRow[rowKey]?.dir === 'asc' ? ' ↑' : ' ↓') : ''}</button>
                                  </td>
                                  <td className="px-3 py-2 text-xs" />
                                  <td className="px-3 py-2 text-xs">
                                    <button type="button" onClick={() => setUploadedSizeSortByRow((prev) => {
                                      const cur = prev[rowKey] || { key: 'size', dir: 'asc' as const };
                                      const dir = cur.key === 'avg_profit' ? (cur.dir === 'asc' ? 'desc' : 'asc') : 'desc';
                                      return { ...prev, [rowKey]: { key: 'avg_profit', dir } };
                                    })} className="px-2 py-1 rounded-md border border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-100 text-xs">Ср. заработок{uploadedSizeSortByRow[rowKey]?.key === 'avg_profit' ? (uploadedSizeSortByRow[rowKey]?.dir === 'asc' ? ' ↑' : ' ↓') : ''}</button>
                                  </td>
                                  <td className="px-3 py-2 text-xs">
                                    <button type="button" onClick={() => setUploadedSizeSortByRow((prev) => {
                                      const cur = prev[rowKey] || { key: 'size', dir: 'asc' as const };
                                      const dir = cur.key === 'profit_total' ? (cur.dir === 'asc' ? 'desc' : 'asc') : 'desc';
                                      return { ...prev, [rowKey]: { key: 'profit_total', dir } };
                                    })} className="px-2 py-1 rounded-md border border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-100 text-xs">Заработок{uploadedSizeSortByRow[rowKey]?.key === 'profit_total' ? (uploadedSizeSortByRow[rowKey]?.dir === 'asc' ? ' ↑' : ' ↓') : ''}</button>
                                  </td>
                                  <td className={`px-3 py-2 text-xs ${isUploadedColVisible('sold_qty') ? '' : 'hidden'}`}>
                                    <button type="button" onClick={() => setUploadedSizeSortByRow((prev) => {
                                      const cur = prev[rowKey] || { key: 'size', dir: 'asc' as const };
                                      const dir = cur.key === 'sold_qty' ? (cur.dir === 'asc' ? 'desc' : 'asc') : 'desc';
                                      return { ...prev, [rowKey]: { key: 'sold_qty', dir } };
                                    })} className="px-2 py-1 rounded-md border border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-100 text-xs">Проданные{uploadedSizeSortByRow[rowKey]?.key === 'sold_qty' ? (uploadedSizeSortByRow[rowKey]?.dir === 'asc' ? ' ↑' : ' ↓') : ''}</button>
                                  </td>
                                  <td className={`px-3 py-2 text-xs ${isUploadedColVisible('return_qty') ? '' : 'hidden'}`} />
                                  <td className={`px-3 py-2 text-xs ${isUploadedColVisible('acquiring_sum') ? '' : 'hidden'}`} />
                                  <td className={`px-3 py-2 text-xs ${isUploadedColVisible('acquiring_percent') ? '' : 'hidden'}`} />
                                </tr>
                                {visibleSizeRows.map((sz: any, sidx: number) => {
                                  const soldForCalc = Number(sz?.sold_qty ?? 0);
                                  const profitTotalSize = soldForCalc > 0 ? getUploadedRowProfitAfterTaxes(
                                    Number(sz?.to_pay_total || 0),
                                    Number(sz?.sales_net || 0),
                                    getUploadedCostValue(row) * soldForCalc,
                                    Number(sz?.wb_commission_vat || 0),
                                    Number(sz?.logistics_sum || 0),
                                    Number(sz?.withhold_sum || 0) + Number(sz?.storage_sum || 0),
                                  ) : 0;
                                  const avgProfitSize = soldForCalc > 0 ? profitTotalSize / soldForCalc : 0;
                                  return (
                                    <tr key={`size-${row.code}-${idx}-${sidx}`} className="border-t border-slate-100 bg-slate-50/70">
                                      <td className="px-3 py-2 sticky left-0 bg-slate-50 z-20 w-[140px] min-w-[140px] max-w-[140px] border-r border-slate-200" />
                                      <td className="px-3 py-2 sticky left-[140px] bg-slate-50 z-20 w-[160px] min-w-[160px] max-w-[160px] border-r border-slate-200" />
                                      <td className="px-3 py-2 sticky left-[300px] bg-slate-50 z-20 w-[320px] min-w-[320px] max-w-[320px] border-r border-slate-200 text-xs font-semibold text-slate-700">Размер: {String(sz?.size || 'Без размера')}</td>
                                      <td className={`px-3 py-2 text-xs ${isUploadedColVisible('sales_net') ? '' : 'hidden'}`}>{Number(sz?.sales_net || 0).toLocaleString('ru-RU')}</td>
                                      <td className={`px-3 py-2 text-xs ${isUploadedColVisible('returns_gross') ? '' : 'hidden'}`}>{Number(sz?.returns_gross || 0).toLocaleString('ru-RU')}</td>
                                      <td className={`px-3 py-2 text-xs ${isUploadedColVisible('logistics_sum') ? '' : 'hidden'}`}>{Number(sz?.logistics_sum || 0).toLocaleString('ru-RU')}</td>
                                      <td className={`px-3 py-2 text-xs ${isUploadedColVisible('payout_net') ? '' : 'hidden'}`}>{Number(sz?.payout_net || 0).toLocaleString('ru-RU')}</td>
                                      <td className={`px-3 py-2 text-xs ${isUploadedColVisible('fine_sum') ? '' : 'hidden'}`}>{Number(sz?.fine_sum || 0).toLocaleString('ru-RU')}</td>
                                      <td className={`px-3 py-2 text-xs ${isUploadedColVisible('storage_sum') ? '' : 'hidden'}`}>{Number(sz?.storage_sum || 0).toLocaleString('ru-RU')}</td>
                                      <td className={`px-3 py-2 text-xs ${isUploadedColVisible('withhold_sum') ? '' : 'hidden'}`}>{Number(sz?.withhold_sum || 0).toLocaleString('ru-RU')}</td>
                                      <td className={`px-3 py-2 text-xs font-medium ${isUploadedColVisible('to_pay_total') ? '' : 'hidden'} ${Number(sz?.to_pay_total || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{Number(sz?.to_pay_total || 0).toLocaleString('ru-RU')}</td>
                                      <td className="px-3 py-2 text-xs text-slate-500">{getUploadedCostValue(row).toLocaleString('ru-RU', { maximumFractionDigits: 2 })}</td>
                                      <td className="px-3 py-2 text-xs">{Number(avgProfitSize || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 })}</td>
                                      <td className="px-3 py-2 text-xs font-medium">{Number(profitTotalSize || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 })}</td>
                                      <td className={`px-3 py-2 text-xs ${isUploadedColVisible('sold_qty') ? '' : 'hidden'}`}>{Number(sz?.sold_qty ?? (Number(sz?.sold_net_qty || 0) + Number(sz?.return_qty || 0))).toLocaleString('ru-RU')}</td>
                                      <td className={`px-3 py-2 text-xs ${isUploadedColVisible('return_qty') ? '' : 'hidden'}`}>{Number(sz?.return_qty || 0).toLocaleString('ru-RU')}</td>
                                      <td className={`px-3 py-2 text-xs ${isUploadedColVisible('acquiring_sum') ? '' : 'hidden'}`}>{Number(sz?.acquiring_sum || 0).toLocaleString('ru-RU')}</td>
                                      <td className={`px-3 py-2 text-xs ${isUploadedColVisible('acquiring_percent') ? '' : 'hidden'}`}>{Number(sz?.acquiring_percent || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 })}</td>
                                    </tr>
                                  );
                                })}
                              </>
                            ) : (
                              <tr key={`size-empty-${row.code}-${idx}`} className="border-t border-slate-100 bg-slate-50/70">
                                <td className="px-3 py-2 sticky left-0 bg-slate-50 z-20 w-[140px] min-w-[140px] max-w-[140px] border-r border-slate-200" />
                                <td className="px-3 py-2 sticky left-[140px] bg-slate-50 z-20 w-[160px] min-w-[160px] max-w-[160px] border-r border-slate-200" />
                                <td className="px-3 py-2 sticky left-[300px] bg-slate-50 z-20 w-[320px] min-w-[320px] max-w-[320px] border-r border-slate-200 text-xs text-slate-500">Нет данных в столбце «Размер»</td>
                                <td colSpan={20} className="px-3 py-2 text-xs text-slate-400">-</td>
                              </tr>
                            )
                          )}
                          </>
                        );
                        })}
                      </tbody>
                    </table>
                  </div>
                  </>
                  )}
                </div>
              )}
            </div>
  );
}
