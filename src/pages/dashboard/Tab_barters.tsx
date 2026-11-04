// Вынесено из Dashboard.tsx автоматически (ленивая загрузка раздела). Данные приходят пропсами из Dashboard.
/* eslint-disable */
import { Megaphone, Database, ChevronDown, ChevronLeft, ChevronRight, Plus, Trash2, X, Package, Clock, CheckCircle2, AlertCircle, ChevronUp } from 'lucide-react';
import { Select } from '../../components/ui/Select';
import { getExternalAdsSummary, getExternalAdsStatusClassName, getExternalAdsStatusLabel, getBarterRatingClassName, BARTER_RATING_OPTIONS, parseExternalBloggerLink, normalizeExternalAdsStatus } from '../dashboardHelpers';
import { supabase } from '../../lib/supabase';
import { QtyField } from '../../components/ui/QtyField';

export function Tab_barters(props: any) {
  const { addSelectedBarterProducts, applyBarterRowsEdit, barterCardSaveState, barterCatalogLoading, barterCheckedProductIds, barterCollapsedCards, barterCreateAdCount, barterCreateBarterCount, barterCreateMergedCard, barterDuplicateModal, barterFilteredProducts, barterMergeMode, barterMergeSelectedIds, barterModalOpen, barterMoneyBalance, barterMoneyFilter, barterMoneyForm, barterMoneyLoading, barterMoneySaving, barterMonth, barterMonthCollapsed, barterMonthPickerOpen, barterMonthYear, barterPhotoLoading, barterPhotoMap, barterPreviewGallery, barterPreviewTouchStartRef, barterProductSearch, barterRows, barterSaving, barterSection, barterSelectedSupplier, barterSelectedSupplierId, barterSupplierId, barterTopSupplierId, closeBarterAddModal, closeBarterPreviewGallery, currentEmployee, deleteBarterRow, detectBarterCardsTable, externalAdsBase, externalAdsBaseEditingId, externalAdsBaseForm, externalAdsBaseHasActiveFilters, externalAdsBaseModalOpen, externalAdsBasePlatformFilter, externalAdsBaseSaving, externalAdsBaseSearch, externalAdsBaseSort, externalAdsBaseSupplierFilter, externalAdsBaseSupplierOptions, externalAdsHistoryFilters, fetchBarterRowsFromTable, filteredBarterMoneyHistory, filteredExternalAdsBase, getBarterExtraStateFromRows, getBarterRowPlanCount, handleAddBarterMoneyOperation, handleDeleteBarterMoneyOperation, importBloggersFromBarterLinks, logAction, mapBarterRowToDbCard, mergeSelectedBarterCards, monthNamesRu, monthRows, monthStats, normalizeBarterPhotoUrl, normalizeBarterRow, openBarterPreviewGallery, refreshBarterPhotos, refreshBarterPhotosInCards, saveExternalAdsBase, setAdGlobalExtra, setBarterCheckedProductIds, setBarterCollapsedCards, setBarterCreateAdCount, setBarterCreateBarterCount, setBarterCreateMergedCard, setBarterDuplicateModal, setBarterGlobalExtra, setBarterMergeMode, setBarterMergeSelectedIds, setBarterModalOpen, setBarterMoneyFilter, setBarterMoneyForm, setBarterMonth, setBarterMonthPickerOpen, setBarterMonthYear, setBarterPreviewGallery, setBarterProductSearch, setBarterRows, setBarterSection, setBarterSupplierId, setBarterTopSupplierId, setExternalAdsBaseEditingId, setExternalAdsBaseForm, setExternalAdsBaseModalOpen, setExternalAdsBasePlatformFilter, setExternalAdsBaseSearch, setExternalAdsBaseSort, setExternalAdsBaseSupplierFilter, setExternalAdsHistoryFilters, showNextBarterPreviewImage, showPreviousBarterPreviewImage, showToast, suppliers } = props;
  return (
<div className="max-w-6xl mx-auto">
              <div className="oc-card p-5 md:p-6 mb-4">
                <h2 className="text-2xl font-bold text-slate-900">Бартеры / Внешняя реклама</h2>
                <p className="text-slate-600 mt-1">Внутри раздела теперь есть отдельные подразделы с собственными кнопками перехода.</p>
                <div className="mt-4 sm:sticky sm:top-2 z-20 rounded-2xl border border-slate-200 bg-slate-50/95 backdrop-blur p-1.5 inline-flex flex-col sm:flex-row gap-1.5 w-full sm:w-auto shadow-sm">
                  <button
                    type="button"
                    onClick={() => setBarterSection('barters_main')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition text-left sm:text-center ${barterSection === 'barters_main' ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-700 hover:bg-white/70'}`}
                  >
                    <div className="font-semibold inline-flex items-center gap-2"><Megaphone className="h-4 w-4 shrink-0" />Бартеры / Внешняя реклама</div>
                    <div className={`text-[11px] mt-0.5 ${barterSection === 'barters_main' ? 'text-indigo-500' : 'text-slate-500'}`}>Товары, бартеры, реклама, планы</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBarterSection('external_ads_base')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition text-left sm:text-center ${barterSection === 'external_ads_base' ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-700 hover:bg-white/70'}`}
                  >
                    <div className="font-semibold inline-flex items-center gap-2"><Database className="h-4 w-4 shrink-0" />База Внешней рекламы</div>
                    <div className={`text-[11px] mt-0.5 ${barterSection === 'external_ads_base' ? 'text-indigo-500' : 'text-slate-500'}`}>Блогеры, ссылки, статусы, контакты</div>
                  </button>
                </div>
                {barterSection === 'barters_main' && <>
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-base font-bold text-slate-900">Бартеры / Внешняя реклама</div>
                  <div className="text-xs text-slate-500 mt-1">Основной подраздел для товаров, бартерных размещений, внешней рекламы и месячной аналитики.</div>
                </div>
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_220px] gap-2">
                    <Select value={barterTopSupplierId} onChange={(e) => {
                      setBarterTopSupplierId(e.target.value);
                      setBarterMonthPickerOpen(false);
                    }} className="oc-select w-full min-w-0">
                      <option value="">Сначала выберите поставщика</option>
                      {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          if (!barterTopSupplierId) return;
                          setBarterMonthPickerOpen((v) => !v);
                        }}
                        disabled={!barterTopSupplierId}
                        className="oc-input w-full text-left flex items-center justify-between disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <span className="truncate">{monthNamesRu[Math.max(0, Math.min(11, Number((barterMonth.split('-')[1] || '1')) - 1))]} {barterMonthYear}</span>
                        <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
                      </button>
                      {barterMonthPickerOpen && (
                        <div className="absolute left-0 right-0 md:left-auto md:right-0 z-40 mt-2 w-full md:w-[280px] rounded-2xl border border-slate-200 bg-white shadow-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <button type="button" onClick={() => setBarterMonthYear((y) => y - 1)} className="p-1 rounded hover:bg-slate-100"><ChevronLeft className="h-4 w-4" /></button>
                            <div className="text-sm font-semibold text-slate-800">{barterMonthYear}</div>
                            <button type="button" onClick={() => setBarterMonthYear((y) => y + 1)} className="p-1 rounded hover:bg-slate-100"><ChevronRight className="h-4 w-4" /></button>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                            {monthNamesRu.map((m, idx) => {
                              const mm = String(idx + 1).padStart(2, '0');
                              const value = `${barterMonthYear}-${mm}`;
                              const active = value === barterMonth;
                              return (
                                <button
                                  key={`m-${m}-${idx}`}
                                  type="button"
                                  onClick={() => { setBarterMonth(value); setBarterMonthPickerOpen(false); }}
                                  className={`px-2 py-2 rounded-lg text-xs font-medium transition ${active ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
                                >
                                  {m}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                    <button onClick={() => { setBarterSupplierId(barterTopSupplierId || barterSupplierId); setBarterCreateMergedCard(false); setBarterModalOpen(true); }} className="btn-primary w-full justify-center" disabled={!barterTopSupplierId}><Plus className="h-4 w-4 mr-2" />Добавить товар</button>
                    <button
                      onClick={() => {
                        if (!barterMergeMode) {
                          setBarterMergeMode(true);
                          setBarterMergeSelectedIds([]);
                          return;
                        }
                        mergeSelectedBarterCards();
                      }}
                      disabled={!barterTopSupplierId || (!(monthRows || []).length) || (barterMergeMode && barterMergeSelectedIds.length < 2)}
                      className="btn-ghost w-full justify-center disabled:opacity-60"
                    >
                      {barterMergeMode ? `Объединить выбранные (${barterMergeSelectedIds.length})` : 'Объединить карточки'}
                    </button>
                    <button
                      onClick={() => setBarterDuplicateModal({ open: true, targetMonth: barterMonth })}
                      className="btn-ghost w-full justify-center disabled:opacity-60"
                      disabled={!barterTopSupplierId || !(monthRows || []).length}
                    >
                      Дублировать карточки
                    </button>
                  </div>
                  <div className="text-xs text-slate-500">Все изменения в этом разделе сохраняются автоматически.{barterSaving ? ' Идёт сохранение...' : ''}</div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Дополнительные действия</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
                      {barterMergeMode && (
                        <button
                          onClick={() => {
                            setBarterMergeMode(false);
                            setBarterMergeSelectedIds([]);
                          }}
                          className="btn-ghost w-full justify-center"
                        >
                          Отмена объединения
                        </button>
                      )}
                      <button onClick={refreshBarterPhotosInCards} disabled={!barterTopSupplierId || !(monthRows || []).length || barterPhotoLoading} className="btn-ghost w-full justify-center disabled:opacity-60">{barterPhotoLoading ? 'Обновляю фото...' : 'Обновить фото (карточки)'}</button>
                      <button
                        onClick={() => {
                          const allCollapsed = (monthRows || []).every((r: any) => !!barterCollapsedCards[r.id]);
                          const next: Record<string, boolean> = { ...(barterCollapsedCards || {}) };
                          (monthRows || []).forEach((r: any) => { next[r.id] = !allCollapsed; });
                          setBarterCollapsedCards(next);
                        }}
                        className="btn-ghost w-full justify-center"
                      >
                        {((monthRows || []).every((r: any) => !!barterCollapsedCards[r.id])) ? 'Развернуть все карточки' : 'Свернуть все карточки'}
                      </button>
                      <button onClick={importBloggersFromBarterLinks} disabled={!barterTopSupplierId || externalAdsBaseSaving} className="btn-ghost w-full justify-center disabled:opacity-60">{externalAdsBaseSaving ? 'Добавляю в БД...' : 'Добавить поставщиков в БД'}</button>
                    </div>

                    {currentEmployee?.role === 'admin' && (
                      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Массовые действия</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
                          <button
                            onClick={() => {
                              setBarterGlobalExtra((v) => v + 1);
                              const nextRows = (barterRows || []).map((r: any) => {
                                if (barterTopSupplierId && String(r?.supplier_id || '') !== String(barterTopSupplierId)) return r;
                                return {
                                  ...r,
                                  barter_links: [...(r?.barter_links || []), ''],
                                  barter_dates: [...(r?.barter_dates || []), ''],
                                  barter_prices: [...(r?.barter_prices || []), ''],
                                  barter_views: [...(r?.barter_views || []), ''],
                                  barter_ratings: [...(r?.barter_ratings || []), ''],
                                  barter_published: [...(r?.barter_published || []), false],
                                };
                              });
                              const changedIds = nextRows.filter((r: any) => String(r?.supplier_id || '') === String(barterTopSupplierId)).map((r: any) => String(r?.id || '')).filter(Boolean);
                              applyBarterRowsEdit(nextRows, barterTopSupplierId, changedIds);
                            }}
                            className="btn-ghost w-full justify-center disabled:opacity-60"
                            disabled={!barterTopSupplierId}
                          >+ Бартер всем</button>
                          <button
                            onClick={() => {
                              setBarterGlobalExtra((v) => Math.max(0, v - 1));
                              const nextRows = (barterRows || []).map((r: any) => {
                                if (barterTopSupplierId && String(r?.supplier_id || '') !== String(barterTopSupplierId)) return r;
                                const base = 5;
                                const currentExtra = Math.max(0, (r?.barter_links?.length || base) - base);
                                if (currentExtra <= 0) return r;
                                return {
                                  ...r,
                                  barter_links: (r?.barter_links || []).slice(0, -1),
                                  barter_dates: (r?.barter_dates || []).slice(0, -1),
                                  barter_prices: (r?.barter_prices || []).slice(0, -1),
                                  barter_views: (r?.barter_views || []).slice(0, -1),
                                  barter_ratings: (r?.barter_ratings || []).slice(0, -1),
                                  barter_published: (r?.barter_published || []).slice(0, -1),
                                };
                              });
                              const changedIds = nextRows.filter((r: any) => String(r?.supplier_id || '') === String(barterTopSupplierId)).map((r: any) => String(r?.id || '')).filter(Boolean);
                              applyBarterRowsEdit(nextRows, barterTopSupplierId, changedIds);
                            }}
                            className="btn-ghost w-full justify-center disabled:opacity-60"
                            disabled={!barterTopSupplierId}
                          >- Бартер всем</button>
                          <button
                            onClick={() => {
                              setAdGlobalExtra((v) => v + 1);
                              const nextRows = (barterRows || []).map((r: any) => {
                                if (barterTopSupplierId && String(r?.supplier_id || '') !== String(barterTopSupplierId)) return r;
                                return {
                                  ...r,
                                  ad_links: [...(r?.ad_links || []), ''],
                                  ad_dates: [...(r?.ad_dates || []), ''],
                                  ad_prices: [...(r?.ad_prices || []), ''],
                                  ad_views: [...(r?.ad_views || []), ''],
                                  ad_ratings: [...(r?.ad_ratings || []), ''],
                                  ad_published: [...(r?.ad_published || []), false],
                                };
                              });
                              const changedIds = nextRows.filter((r: any) => String(r?.supplier_id || '') === String(barterTopSupplierId)).map((r: any) => String(r?.id || '')).filter(Boolean);
                              applyBarterRowsEdit(nextRows, barterTopSupplierId, changedIds);
                            }}
                            className="btn-ghost w-full justify-center disabled:opacity-60"
                            disabled={!barterTopSupplierId}
                          >+ Реклама всем</button>
                          <button
                            onClick={() => {
                              setAdGlobalExtra((v) => Math.max(0, v - 1));
                              const nextRows = (barterRows || []).map((r: any) => {
                                if (barterTopSupplierId && String(r?.supplier_id || '') !== String(barterTopSupplierId)) return r;
                                const base = 2;
                                const currentExtra = Math.max(0, (r?.ad_links?.length || base) - base);
                                if (currentExtra <= 0) return r;
                                return {
                                  ...r,
                                  ad_links: (r?.ad_links || []).slice(0, -1),
                                  ad_dates: (r?.ad_dates || []).slice(0, -1),
                                  ad_prices: (r?.ad_prices || []).slice(0, -1),
                                  ad_views: (r?.ad_views || []).slice(0, -1),
                                  ad_ratings: (r?.ad_ratings || []).slice(0, -1),
                                  ad_published: (r?.ad_published || []).slice(0, -1),
                                };
                              });
                              const changedIds = nextRows.filter((r: any) => String(r?.supplier_id || '') === String(barterTopSupplierId)).map((r: any) => String(r?.id || '')).filter(Boolean);
                              applyBarterRowsEdit(nextRows, barterTopSupplierId, changedIds);
                            }}
                            className="btn-ghost w-full justify-center disabled:opacity-60"
                            disabled={!barterTopSupplierId}
                          >- Реклама всем</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div></>}
                {barterSection === 'external_ads_base' && <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                    <div>
                      <div className="text-base font-bold text-slate-900">База Внешней рекламы</div>
                      <div className="text-xs text-slate-500 mt-1">Отдельный подраздел для блогеров, ссылок на соцсети, подписчиков и комментариев</div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="text-sm text-slate-600">Всего записей: <span className="font-semibold text-slate-900">{externalAdsBaseHasActiveFilters ? `${filteredExternalAdsBase.length} из ${externalAdsBase.length}` : externalAdsBase.length}</span></div>
                      <button
                        onClick={() => {
                          setExternalAdsBaseEditingId(null);
                          setExternalAdsBaseForm({ nickname: '', socialLinks: [{ url: '', followers: '', platform: '' }], overallRating: '', comment: '', status: 'new' });
                          setExternalAdsBaseModalOpen(true);
                        }}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                      >
                        <Plus className="h-4 w-4" /> Создать запись
                      </button>
                    </div>
                  </div>
                  <div className="mb-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[minmax(0,1.3fr)_220px_220px_220px] gap-2">
                    <input
                      value={externalAdsBaseSearch}
                      onChange={(e) => setExternalAdsBaseSearch(e.target.value)}
                      placeholder="Поиск по нику, ссылке, подписчикам, статусу или комментарию"
                      className="oc-input"
                    />
                    <Select value={externalAdsBaseSupplierFilter} onChange={(e) => setExternalAdsBaseSupplierFilter(e.target.value)} className="oc-select">
                      <option value="all">Все поставщики</option>
                      {externalAdsBaseSupplierOptions.map((supplier) => (
                        <option key={`external-ads-supplier-filter-${supplier.id}`} value={supplier.id}>{supplier.name}</option>
                      ))}
                    </Select>
                    <Select value={externalAdsBasePlatformFilter} onChange={(e) => setExternalAdsBasePlatformFilter(e.target.value)} className="oc-select">
                      <option value="all">Все сети</option>
                      <option value="Instagram">Instagram</option>
                      <option value="TikTok">TikTok</option>
                      <option value="Telegram">Telegram</option>
                      <option value="YouTube">YouTube</option>
                      <option value="VK">VK</option>
                      <option value="OK">OK</option>
                      <option value="other">Другие сети</option>
                    </Select>
                    <Select value={externalAdsBaseSort} onChange={(e) => setExternalAdsBaseSort(e.target.value as any)} className="oc-select">
                      <option value="date_desc">Сначала новые</option>
                      <option value="date_asc">Сначала старые</option>
                      <option value="nickname_asc">По нику</option>
                      <option value="followers_desc">По подписчикам</option>
                    </Select>
                  </div>
                  {filteredExternalAdsBase.length === 0 ? (
                    <div className="text-sm text-slate-500">{externalAdsBase.length === 0 ? 'Пока пусто. Нажми «Создать запись», чтобы добавить первую запись.' : externalAdsBaseHasActiveFilters ? 'Фильтр ничего не нашёл.' : 'Поиск ничего не нашёл.'}</div>
                  ) : (
                    <div className="space-y-3">
                      {filteredExternalAdsBase.map((item) => {
                        const summary = getExternalAdsSummary(item.history || []);
                        const historyFilters = externalAdsHistoryFilters[String(item.id)] || { kind: 'all' as const, supplierId: '' };
                        const historySupplierOptions = Array.from(new Map((item.history || [])
                          .filter((history) => String(history?.supplier_id || '').trim())
                          .map((history) => [String(history.supplier_id), String(history.supplier_name || 'Поставщик')]))).map(([id, name]) => ({ id, name }));
                        const filteredHistory = [...(item.history || [])]
                          .filter((history) => historyFilters.kind === 'all' ? true : history.kind === historyFilters.kind)
                          .filter((history) => historyFilters.supplierId ? String(history.supplier_id || '') === String(historyFilters.supplierId) : true)
                          .sort((a, b) => String(b.date || b.createdAt || '').localeCompare(String(a.date || a.createdAt || '')));
                        return (
                        <div key={`ext-ads-base-${item.id}`} className="rounded-xl border border-slate-200 bg-white p-3">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-slate-900 break-words">{item.nickname || 'Без ника'}</div>
                              <div className="text-xs text-slate-500 mt-1">Добавлено: {item.createdAt ? new Date(item.createdAt).toLocaleString('ru-RU') : '-'}</div>
                            </div>
                            <div className="flex items-center gap-2 self-start">
                              <button
                                type="button"
                                onClick={() => {
                                  setExternalAdsBaseEditingId(String(item.id));
                                  setExternalAdsBaseForm({
                                    nickname: String(item.nickname || ''),
                                    socialLinks: Array.isArray(item.socialLinks) && item.socialLinks.length ? item.socialLinks.map((s) => ({ url: String(s.url || ''), followers: String(s.followers || ''), platform: String(s.platform || '') })) : [{ url: '', followers: '', platform: '' }],
                                    overallRating: String(item.overallRating || ''),
                                    comment: String(item.comment || ''),
                                    status: String(item.status || 'new'),
                                  });
                                  setExternalAdsBaseModalOpen(true);
                                }}
                                className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                              >
                                Редактировать
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  const next = (externalAdsBase || []).filter((x) => String(x.id) !== String(item.id));
                                  const ok = await saveExternalAdsBase(next as any);
                                  if (ok) showToast('Запись удалена', 'success');
                                }}
                                className="px-3 py-1.5 text-xs rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50"
                              >
                                Удалить
                              </button>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getExternalAdsStatusClassName(item.status)}`}>
                              {getExternalAdsStatusLabel(item.status)}
                            </span>
                            {item.overallRating ? (
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getBarterRatingClassName(item.overallRating).replace('oc-select ', '')}`}>
                                Рейтинг блогера: {item.overallRating}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                Рейтинг блогера не задан
                              </span>
                            )}
                          </div>
                          <div className="mt-3 grid grid-cols-2 xl:grid-cols-4 gap-2">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                              <div className="text-[11px] uppercase tracking-wide text-slate-500">Всего бартеров</div>
                              <div className="mt-1 text-lg font-bold text-slate-900">{summary.barterCount}</div>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                              <div className="text-[11px] uppercase tracking-wide text-slate-500">Всего реклам</div>
                              <div className="mt-1 text-lg font-bold text-slate-900">{summary.adCount}</div>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                              <div className="text-[11px] uppercase tracking-wide text-slate-500">Средняя оценка</div>
                              <div className="mt-1 text-sm font-bold text-slate-900">
                                {summary.averageScore > 0 ? `${summary.averageLabel} (${summary.averageScore.toFixed(1)})` : 'Нет оценок'}
                              </div>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                              <div className="text-[11px] uppercase tracking-wide text-slate-500">Общая сумма</div>
                              <div className="mt-1 text-lg font-bold text-slate-900">{summary.totalCost.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₽</div>
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-1 xl:grid-cols-[1.4fr_1fr_1fr] gap-3">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Аналитика по поставщикам</div>
                              <div className="mt-2 text-sm text-slate-700">Всего интеграций: <span className="font-semibold text-slate-900">{summary.totalIntegrations}</span></div>
                              <div className="mt-2 space-y-2">
                                {summary.supplierStats.length === 0 ? (
                                  <div className="text-sm text-slate-500">Пока нет истории по поставщикам</div>
                                ) : summary.supplierStats.map((supplier) => (
                                  <div key={`supplier-analytics-${item.id}-${supplier.supplierId || supplier.supplierName}`} className="flex items-center justify-between gap-3 text-sm">
                                    <div className="min-w-0">
                                      <div className="font-medium text-slate-900 truncate">{supplier.supplierName || 'Поставщик'}</div>
                                      <div className="text-xs text-slate-500">Интеграций: {supplier.count}</div>
                                    </div>
                                    <div className="text-right font-semibold text-slate-900 whitespace-nowrap">{supplier.totalCost.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₽</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Распределение оценок</div>
                              <div className="mt-2 space-y-2">
                                {Object.keys(summary.ratingCounts).length === 0 ? (
                                  <div className="text-sm text-slate-500">Оценок пока нет</div>
                                ) : BARTER_RATING_OPTIONS.filter((rating) => rating).map((rating) => (
                                  <div key={`rating-breakdown-${item.id}-${rating}`} className="flex items-center justify-between gap-3 text-sm">
                                    <span className="text-slate-700">{rating}</span>
                                    <span className="font-semibold text-slate-900">{summary.ratingCounts[rating] || 0}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Лучший / худший результат</div>
                              <div className="mt-2 space-y-3 text-sm">
                                <div>
                                  <div className="text-xs text-slate-500">Лучший</div>
                                  {summary.bestResult ? (
                                    <div>
                                      <div className="font-medium text-slate-900 break-words">{summary.bestResult.product_name || 'Товар без названия'}</div>
                                      <div className="text-slate-600">{summary.bestResult.rating} • {summary.bestResult.supplier_name || '-'}</div>
                                    </div>
                                  ) : <div className="text-slate-500">Нет данных</div>}
                                </div>
                                <div>
                                  <div className="text-xs text-slate-500">Худший</div>
                                  {summary.worstResult ? (
                                    <div>
                                      <div className="font-medium text-slate-900 break-words">{summary.worstResult.product_name || 'Товар без названия'}</div>
                                      <div className="text-slate-600">{summary.worstResult.rating} • {summary.worstResult.supplier_name || '-'}</div>
                                    </div>
                                  ) : <div className="text-slate-500">Нет данных</div>}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 space-y-2">
                            {(item.socialLinks || []).map((social, idx) => {
                              const platformLabel = String(social.platform || parseExternalBloggerLink(String(social.url || ''))?.platform || `Соцсеть ${idx + 1}`);
                              return (
                                <div key={`ext-ads-social-${item.id}-${idx}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="text-xs text-slate-500">{platformLabel}</div>
                                      <div className="text-sm text-slate-800 break-all">{social.url || '-'}</div>
                                      <div className="text-xs text-slate-600 mt-1">Подписчики: <span className="font-medium text-slate-900">{social.followers || '-'}</span></div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {String(social.url || '').trim() ? (
                                        <>
                                          <a href={String(social.url)} target="_blank" rel="noopener noreferrer" className="px-2 py-1 text-xs rounded border border-slate-300 text-slate-700 hover:bg-white">Открыть</a>
                                          <button
                                            type="button"
                                            onClick={async () => {
                                              try {
                                                await navigator.clipboard.writeText(String(social.url || ''));
                                                showToast('Ссылка скопирована', 'success');
                                              } catch {
                                                showToast('Не удалось скопировать ссылку', 'error');
                                              }
                                            }}
                                            className="px-2 py-1 text-xs rounded border border-slate-300 text-slate-700 hover:bg-white"
                                          >
                                            Копировать
                                          </button>
                                        </>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {(item.history || []).length > 0 && (
                            <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/60 p-3">
                              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                                <div className="text-sm font-semibold text-slate-900">История бартеров / рекламы</div>
                                <div className="grid grid-cols-1 sm:grid-cols-[160px_220px] gap-2">
                                  <Select
                                    value={historyFilters.kind}
                                    onChange={(e) => setExternalAdsHistoryFilters((prev) => ({
                                      ...prev,
                                      [String(item.id)]: {
                                        kind: e.target.value as 'all' | 'barter' | 'ad',
                                        supplierId: prev[String(item.id)]?.supplierId || '',
                                      },
                                    }))}
                                    className="oc-select"
                                  >
                                    <option value="all">Все активности</option>
                                    <option value="barter">Только бартеры</option>
                                    <option value="ad">Только реклама</option>
                                  </Select>
                                  <Select
                                    value={historyFilters.supplierId}
                                    onChange={(e) => setExternalAdsHistoryFilters((prev) => ({
                                      ...prev,
                                      [String(item.id)]: {
                                        kind: prev[String(item.id)]?.kind || 'all',
                                        supplierId: e.target.value,
                                      },
                                    }))}
                                    className="oc-select"
                                  >
                                    <option value="">Все поставщики</option>
                                    {historySupplierOptions.map((supplier) => (
                                      <option key={`history-supplier-${item.id}-${supplier.id}`} value={supplier.id}>{supplier.name}</option>
                                    ))}
                                  </Select>
                                </div>
                              </div>
                              <div className="mt-2 space-y-2 max-h-72 overflow-y-auto pr-1">
                                {filteredHistory.length === 0 ? (
                                  <div className="rounded-lg border border-dashed border-indigo-200 bg-white/80 px-3 py-4 text-sm text-slate-500">
                                    По текущим фильтрам история не найдена.
                                  </div>
                                ) : filteredHistory.map((history, idx) => (
                                    <div key={`ext-ads-history-${item.id}-${history.id || idx}`} className="rounded-lg border border-indigo-100 bg-white px-3 py-2">
                                      <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${history.kind === 'ad' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>
                                          {history.kind === 'ad' ? 'Реклама' : 'Бартер'}
                                        </span>
                                        {history.rating ? (
                                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">Оценка: {history.rating}</span>
                                        ) : null}
                                        {history.platform ? (
                                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-100 text-indigo-700">{history.platform}</span>
                                        ) : null}
                                      </div>
                                      <div className="text-sm font-medium text-slate-900 break-words">{history.product_name || 'Товар без названия'}</div>
                                      <div className="mt-1 text-xs text-slate-600 break-words">
                                        Поставщик: <span className="font-medium text-slate-900">{history.supplier_name || '-'}</span>
                                        {' • '}Месяц: <span className="font-medium text-slate-900">{history.month || '-'}</span>
                                        {' • '}Дата: <span className="font-medium text-slate-900">{history.date || '-'}</span>
                                      </div>
                                      <div className="mt-1 text-xs text-slate-600 break-words">
                                        Цена: <span className="font-medium text-slate-900">{history.price || '-'}</span>
                                        {' • '}Просмотры: <span className="font-medium text-slate-900">{history.views || '-'}</span>
                                      </div>
                                      {history.url ? (
                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                          <a href={String(history.url)} target="_blank" rel="noopener noreferrer" className="px-2 py-1 text-xs rounded border border-slate-300 text-slate-700 hover:bg-white">Открыть ссылку</a>
                                          <button
                                            type="button"
                                            onClick={async () => {
                                              try {
                                                await navigator.clipboard.writeText(String(history.url || ''));
                                                showToast('Ссылка скопирована', 'success');
                                              } catch {
                                                showToast('Не удалось скопировать ссылку', 'error');
                                              }
                                            }}
                                            className="px-2 py-1 text-xs rounded border border-slate-300 text-slate-700 hover:bg-white"
                                          >
                                            Копировать
                                          </button>
                                        </div>
                                      ) : null}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                          <div className="mt-3 text-sm text-slate-700 whitespace-pre-wrap break-words">{item.comment || 'Комментарий не указан'}</div>
                        </div>
                      );})}
                    </div>
                  )}
                </div>}

                {barterSection === 'barters_main' && (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div>
                        <div className="text-base font-bold text-slate-900">Баланс поставщика</div>
                        <div className="text-xs text-slate-500 mt-1">Отдельный денежный баланс для бартеров и внешней рекламы по каждому поставщику.</div>
                      </div>
                      <div className="rounded-xl bg-white px-4 py-3 border border-emerald-100 min-w-[220px]">
                        <div className="text-xs uppercase tracking-wide text-emerald-700">Текущий баланс</div>
                        <div className="mt-2 text-2xl font-extrabold text-emerald-700">
                          {barterSelectedSupplierId
                            ? `${barterMoneyBalance.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₽`
                            : '0 ₽'}
                        </div>
                        <div className="mt-1 text-xs text-slate-500 truncate">
                          {barterSelectedSupplierId ? (barterSelectedSupplier?.name || 'Поставщик') : 'Выберите поставщика выше'}
                        </div>
                      </div>
                    </div>

                    {!barterSelectedSupplierId ? (
                      <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white/80 p-4 text-sm text-slate-500">
                        Сначала выберите поставщика сверху, после этого здесь появится его личный баланс, пополнения и списания.
                      </div>
                    ) : (
                      <>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[180px_minmax(0,1fr)_160px_160px] gap-2">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Сумма"
                            value={barterMoneyForm.amount}
                            onChange={(e) => setBarterMoneyForm(prev => ({ ...prev, amount: e.target.value }))}
                            className="oc-select"
                          />
                          <input
                            type="text"
                            placeholder="Комментарий (необязательно)"
                            value={barterMoneyForm.comment}
                            onChange={(e) => setBarterMoneyForm(prev => ({ ...prev, comment: e.target.value }))}
                            className="oc-select"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddBarterMoneyOperation('add')}
                            disabled={barterMoneySaving}
                            className="w-full py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60"
                          >
                            Пополнить
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddBarterMoneyOperation('writeoff')}
                            disabled={barterMoneySaving}
                            className="w-full py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-60"
                          >
                            Списать
                          </button>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setBarterMoneyFilter('all')}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${barterMoneyFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                          >
                            Все
                          </button>
                          <button
                            type="button"
                            onClick={() => setBarterMoneyFilter('add')}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${barterMoneyFilter === 'add' ? 'bg-emerald-600 text-white' : 'bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}
                          >
                            Пополнения
                          </button>
                          <button
                            type="button"
                            onClick={() => setBarterMoneyFilter('writeoff')}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${barterMoneyFilter === 'writeoff' ? 'bg-rose-600 text-white' : 'bg-white border border-rose-200 text-rose-700 hover:bg-rose-50'}`}
                          >
                            Списания
                          </button>
                        </div>

                        <div className="mt-3 max-h-56 overflow-y-auto border rounded-lg bg-white">
                          {barterMoneyLoading ? (
                            <div className="p-3 text-sm text-slate-500">Загрузка операций...</div>
                          ) : filteredBarterMoneyHistory.length === 0 ? (
                            <div className="p-3 text-sm text-slate-500">Пока нет операций по этому поставщику.</div>
                          ) : (
                            <div className="divide-y">
                              {filteredBarterMoneyHistory.map((row) => (
                                <div key={`barter-money-${row.id}`} className="p-3 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="font-medium text-slate-900 break-words">{row.comment || 'Без комментария'}</div>
                                    <div className="text-xs text-slate-500 mt-1">{row.created_at ? new Date(row.created_at).toLocaleString('ru-RU') : '-'}</div>
                                  </div>
                                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                                    <div className={`font-bold ${Number(row.amount) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                      {Number(row.amount) >= 0 ? '+' : ''}{Number(row.amount || 0).toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₽
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteBarterMoneyOperation(row)}
                                      className="inline-flex items-center justify-center rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                                      title="Удалить"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {barterSection === 'barters_main' && !!barterTopSupplierId && <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
                    <div className="text-xs uppercase tracking-wide text-slate-500">Карточки</div>
                    <div className="mt-2 text-3xl font-bold text-slate-900 leading-none">{monthStats.cards}</div>
                    <div className="mt-2 text-xs text-slate-500">за выбранный месяц</div>
                  </div>

                  <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="text-xs uppercase tracking-wide text-emerald-700">Общий план</div>
                      <div className="text-xs font-semibold text-emerald-800">{monthStats.planPercent}%</div>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-emerald-100 overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${Math.max(0, Math.min(100, monthStats.planPercent))}%` }} />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-lg bg-white/80 border border-emerald-100 p-2">Бартеры <span className="font-semibold">{monthStats.barterDone}/{monthStats.barterTotal}</span></div>
                      <div className="rounded-lg bg-white/80 border border-emerald-100 p-2">Реклама <span className="font-semibold">{monthStats.adDone}/{monthStats.adTotal}</span></div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm">
                    <div className="text-xs uppercase tracking-wide text-blue-700">Цена бартеров</div>
                    <div className="mt-2 text-2xl font-bold text-blue-900 leading-none">{monthStats.barterCost.toFixed(2)} ₽</div>
                  </div>

                  <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm">
                    <div className="text-xs uppercase tracking-wide text-purple-700">Цена рекламы</div>
                    <div className="mt-2 text-2xl font-bold text-purple-900 leading-none">{monthStats.adCost.toFixed(2)} ₽</div>
                  </div>
                </div>}
              </div>

              {barterDuplicateModal.open && (
                <div className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setBarterDuplicateModal({ open: false, targetMonth: barterMonth })}>
                  <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
                    <div className="text-lg font-bold mb-4">Дублировать карточки</div>
                    <div className="space-y-3">
                      <input type="month" value={barterDuplicateModal.targetMonth} onChange={(e) => setBarterDuplicateModal(prev => ({ ...prev, targetMonth: e.target.value }))} className="oc-input" />
                      <button
                        onClick={async () => {
                          if (!barterTopSupplierId || !barterDuplicateModal.targetMonth) return;
                          const sourceRows = (monthRows || []).filter((r: any) => String(r?.supplier_id || '') === String(barterTopSupplierId));
                          const filteredExisting = (barterRows || []).filter((r: any) => !(String(r?.supplier_id || '') === String(barterTopSupplierId) && String(r?.month || '') === String(barterDuplicateModal.targetMonth)));
                          const duplicated = sourceRows.map((r: any) => normalizeBarterRow({ ...r, id: `${r.id}-dup-${barterDuplicateModal.targetMonth}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, month: barterDuplicateModal.targetMonth }));
                          const hasTableStorage = await detectBarterCardsTable();
                          if (!hasTableStorage) throw new Error('Таблица barter_cards недоступна');
                          if (duplicated.length) {
                            const { error: insertError } = await supabase.from('barter_cards').upsert(duplicated.map((row: any) => mapBarterRowToDbCard(row)), { onConflict: 'id' });
                            if (insertError) throw insertError;
                          }
                          const refreshedRows = await fetchBarterRowsFromTable();
                          const nextExtra = getBarterExtraStateFromRows(refreshedRows);
                          setBarterGlobalExtra(nextExtra.barterExtra);
                          setAdGlobalExtra(nextExtra.adExtra);
                          setBarterRows(refreshedRows as any);
                          setBarterMonth(barterDuplicateModal.targetMonth);
                          logAction('Бартер: дублирование карточек', `${suppliers.find((s:any)=>String(s.id)===barterTopSupplierId)?.name || barterTopSupplierId} · в месяц ${barterDuplicateModal.targetMonth} · карточек: ${duplicated.length}`, currentEmployee?.id);
                          setBarterDuplicateModal({ open: false, targetMonth: barterDuplicateModal.targetMonth });
                          showToast('Карточки продублированы', 'success');
                        }}
                        className="w-full btn-primary py-3"
                      >
                        Дублировать в месяц
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {externalAdsBaseModalOpen && (
                <div className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-sm flex items-end md:items-center justify-center p-2 md:p-4" onClick={() => setExternalAdsBaseModalOpen(false)}>
                  <div className="w-full max-w-2xl bg-white rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                    <div className="sticky top-0 z-10 bg-white border-b px-4 pt-2 pb-3 md:px-6 md:pt-5 md:pb-4">
                      <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-slate-300 md:hidden" />
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-lg font-bold text-slate-900">База Внешней рекламы</div>
                          <div className="text-xs text-slate-500 mt-1">Создание карточки блогера / внешней рекламы</div>
                        </div>
                        <button onClick={() => setExternalAdsBaseModalOpen(false)} className="p-2 rounded-lg hover:bg-slate-100">
                          <X className="h-5 w-5 text-slate-500" />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Ник блогера</label>
                        <input
                          value={externalAdsBaseForm.nickname}
                          onChange={(e) => setExternalAdsBaseForm((prev) => ({ ...prev, nickname: e.target.value }))}
                          placeholder="Например: @bloger_name"
                          className="oc-input"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <label className="block text-sm font-medium text-slate-700">Соцсети блогера</label>
                          <button
                            type="button"
                            onClick={() => setExternalAdsBaseForm((prev) => ({ ...prev, socialLinks: [...(prev.socialLinks || []), { url: '', followers: '', platform: '' }] }))}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                          >
                            <Plus className="h-3.5 w-3.5" /> Добавить соцсеть
                          </button>
                        </div>
                        <div className="space-y-3">
                          {(externalAdsBaseForm.socialLinks || []).map((social, idx) => (
                            <div key={`ext-ads-form-social-${idx}`} className="rounded-xl border border-slate-200 p-3 space-y-3 bg-slate-50">
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-sm font-medium text-slate-800">Соцсеть {idx + 1}</div>
                                {(externalAdsBaseForm.socialLinks || []).length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => setExternalAdsBaseForm((prev) => ({ ...prev, socialLinks: prev.socialLinks.filter((_, i) => i !== idx) }))}
                                    className="px-2 py-1 text-xs rounded border border-rose-300 text-rose-700 hover:bg-rose-50"
                                  >
                                    Удалить
                                  </button>
                                )}
                              </div>
                              <input
                                value={social.url}
                                onChange={(e) => setExternalAdsBaseForm((prev) => ({ ...prev, socialLinks: prev.socialLinks.map((x, i) => i === idx ? { ...x, url: e.target.value } : x) }))}
                                placeholder="Ссылка на соцсеть"
                                className="oc-input"
                              />
                              <input
                                value={social.followers}
                                onChange={(e) => setExternalAdsBaseForm((prev) => ({ ...prev, socialLinks: prev.socialLinks.map((x, i) => i === idx ? { ...x, followers: e.target.value } : x) }))}
                                placeholder="Количество подписчиков"
                                className="oc-input"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Статус</label>
                          <Select
                            value={externalAdsBaseForm.status}
                            onChange={(e) => setExternalAdsBaseForm((prev) => ({ ...prev, status: e.target.value }))}
                            className="oc-select"
                          >
                            <option value="new">Новый</option>
                            <option value="contacted">Написали</option>
                            <option value="in_progress">В работе</option>
                            <option value="barter_published">Вышел бартер</option>
                            <option value="ad_published">Вышла реклама</option>
                            <option value="waiting_stats">Ждём статистику</option>
                            <option value="completed">Завершено</option>
                            <option value="rejected">Отказ</option>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Общий рейтинг блогера</label>
                          <Select
                            value={externalAdsBaseForm.overallRating}
                            onChange={(e) => setExternalAdsBaseForm((prev) => ({ ...prev, overallRating: e.target.value }))}
                            className={getBarterRatingClassName(externalAdsBaseForm.overallRating)}
                          >
                            <option value="">Не задан</option>
                            {BARTER_RATING_OPTIONS.filter((option) => option).map((option) => (
                              <option key={`overall-rating-${option}`} value={option}>{option}</option>
                            ))}
                          </Select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Комментарий</label>
                        <textarea
                          value={externalAdsBaseForm.comment}
                          onChange={(e) => setExternalAdsBaseForm((prev) => ({ ...prev, comment: e.target.value }))}
                          placeholder="Комментарий"
                          rows={4}
                          className="oc-input min-h-[120px]"
                        />
                      </div>
                    </div>
                    <div className="border-t px-4 py-3 md:px-6 bg-white flex flex-col-reverse md:flex-row gap-2 md:justify-end">
                      <button onClick={() => { setExternalAdsBaseModalOpen(false); setExternalAdsBaseEditingId(null); }} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">Отмена</button>
                      <button
                        onClick={async () => {
                          const nickname = String(externalAdsBaseForm.nickname || '').trim();
                          const socialLinks = (externalAdsBaseForm.socialLinks || [])
                            .map((x) => ({
                              url: String(x.url || '').trim(),
                              followers: String(x.followers || '').trim(),
                              platform: String(x.platform || parseExternalBloggerLink(String(x.url || ''))?.platform || ''),
                            }))
                            .filter((x) => x.url || x.followers);
                          const comment = String(externalAdsBaseForm.comment || '').trim();
                          const status = normalizeExternalAdsStatus(String(externalAdsBaseForm.status || 'new').trim() || 'new');
                          const overallRating = String(externalAdsBaseForm.overallRating || '').trim();
                          if (!nickname) {
                            showToast('Введите ник блогера', 'error');
                            return;
                          }
                          if (!socialLinks.length) {
                            showToast('Добавьте хотя бы одну соцсеть', 'error');
                            return;
                          }
                          const next = externalAdsBaseEditingId
                            ? (externalAdsBase || []).map((item) => String(item.id) === String(externalAdsBaseEditingId) ? { ...item, nickname, socialLinks, overallRating, comment, status } : item)
                            : [{ id: `ext-ads-${Date.now()}`, nickname, socialLinks, history: [], overallRating, comment, status, createdAt: new Date().toISOString() }, ...(externalAdsBase || [])];
                          const ok = await saveExternalAdsBase(next as any);
                          if (!ok) return;
                          setExternalAdsBaseModalOpen(false);
                          setExternalAdsBaseEditingId(null);
                          setExternalAdsBaseForm({ nickname: '', socialLinks: [{ url: '', followers: '', platform: '' }], overallRating: '', comment: '', status: 'new' });
                          showToast(externalAdsBaseEditingId ? 'Запись обновлена' : 'Запись добавлена в Базу Внешней рекламы', 'success');
                        }}
                        disabled={externalAdsBaseSaving}
                        className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {externalAdsBaseSaving ? 'Сохранение...' : (externalAdsBaseEditingId ? 'Сохранить изменения' : 'Создать')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {barterSection === 'barters_main' && (
              <div className="oc-card p-4">
                {!barterTopSupplierId ? (
                  <div className="text-sm text-slate-500">Выберите поставщика вверху, чтобы загрузить данные.</div>
                ) : barterMonthCollapsed ? (
                  <div className="text-sm text-slate-500">Месяц свернут</div>
                ) : monthRows.length === 0 ? (
                  <div className="text-sm text-slate-500">По выбранному поставщику за этот месяц данных нет.</div>
                ) : (
                  <div className="space-y-4">
                    {barterMergeMode && (
                      <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-700">
                        Отметь чекбоксами нужные карточки, потом нажми «Объединить выбранные».
                      </div>
                    )}
                    {monthRows.map((row, idx) => {
                      const cardCollapsed = !!barterCollapsedCards[row.id];
                      const rowBarterDone = (row.barter_published || []).filter(Boolean).length;
                      const rowAdsDone = (row.ad_published || []).filter(Boolean).length;
                      const rowCost = [...(row.barter_prices || []), ...(row.ad_prices || [])].reduce((s, v) => s + (parseFloat(String(v || '0')) || 0), 0);
                      const rowPhotoList = Array.from(new Set([
                        ...(Array.isArray(row?.product_photos) ? row.product_photos : []),
                        ...(Array.isArray(row?.product_ids) ? row.product_ids.map((id: any) => barterPhotoMap[String(id)] || '') : []),
                        row?.product_photo || barterPhotoMap[String(row?.product_id || '')] || '',
                      ].map((photo: any) => normalizeBarterPhotoUrl(photo)).filter(Boolean)));
                      return (
                        <div key={row.id} className={`border rounded-2xl p-3 sm:p-4 bg-white ${barterMergeMode && barterMergeSelectedIds.includes(String(row.id)) ? 'border-indigo-400 ring-2 ring-indigo-100' : ''}`}>
                          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-3 mb-2">
                            <div className="flex items-start gap-3 min-w-0">
                              {barterMergeMode && (
                                <label className="mt-1 flex items-center justify-center shrink-0">
                                  <input
                                    type="checkbox"
                                    checked={barterMergeSelectedIds.includes(String(row.id))}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setBarterMergeSelectedIds((prev) => checked ? Array.from(new Set([...(prev || []), String(row.id)])) : (prev || []).filter((id) => String(id) !== String(row.id)));
                                    }}
                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                </label>
                              )}
                              <div className="w-28 sm:w-[168px] shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const images = rowPhotoList.length
                                      ? rowPhotoList
                                      : [row.product_photo || barterPhotoMap[row.product_id] || ''].filter(Boolean);
                                    openBarterPreviewGallery(images, 0);
                                  }}
                                  className="w-28 h-28 sm:w-[168px] sm:h-[168px] rounded-xl overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center hover:opacity-90 transition-opacity"
                                  title="Открыть фото"
                                >
                                  {rowPhotoList[0] ? (
                                    <img src={rowPhotoList[0]} alt={row.product_name} className="w-full h-full object-cover" />
                                  ) : (
                                    <Package className="h-7 w-7 text-slate-400" />
                                  )}
                                </button>
                                {rowPhotoList.length > 1 ? (
                                  <div className="grid grid-cols-4 gap-1 mt-2">
                                    {rowPhotoList.map((src, photoIdx) => (
                                      <button
                                        key={`${row.id}-photo-${photoIdx}`}
                                        type="button"
                                        onClick={() => openBarterPreviewGallery(rowPhotoList, photoIdx)}
                                        className="aspect-square rounded-md overflow-hidden border border-slate-200 bg-slate-50 hover:opacity-90"
                                        title={`Открыть фото ${photoIdx + 1}`}
                                      >
                                        <img src={src} alt={`${row.product_name} ${photoIdx + 1}`} className="w-full h-full object-cover" />
                                      </button>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                              <div className="min-w-0 flex-1">
                                <a
                                  href={`https://www.wildberries.ru/catalog/${encodeURIComponent(String(row.product_id || ''))}/detail.aspx`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm sm:text-base font-semibold text-indigo-700 hover:text-indigo-900 hover:underline break-words inline-block"
                                  title="Открыть товар на Wildberries"
                                >
                                  {row.product_name}
                                </a>
                                <div className="text-xs text-slate-500">Поставщик: {row.supplier_name}</div>
                                {Number(row?.product_variants_count || 1) > 1 ? (
                                  <div className="text-xs text-slate-500 mt-0.5">Объединено вариантов: {row.product_variants_count}</div>
                                ) : null}
                                <div className="text-xs text-slate-600 mt-1">Инфографика: Бартеры {rowBarterDone}/{getBarterRowPlanCount(row, 'barter')} • Реклама {rowAdsDone}/{getBarterRowPlanCount(row, 'ad')} • Затраты {rowCost.toFixed(2)} ₽</div>
                                {barterCardSaveState[String(row.id)] === 'saving' ? <div className="mt-1 inline-flex items-center gap-1 text-xs text-amber-600"><Clock className="h-3.5 w-3.5" />Сохраняется...</div> : null}
                                {barterCardSaveState[String(row.id)] === 'saved' ? <div className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />Сохранено</div> : null}
                                {barterCardSaveState[String(row.id)] === 'error' ? <div className="mt-1 inline-flex items-center gap-1 text-xs text-rose-600"><AlertCircle className="h-3.5 w-3.5" />Ошибка сохранения</div> : null}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:flex xl:flex-wrap gap-2 xl:shrink-0">
                              <button onClick={() => {
                                const nextRows = (barterRows || []).map((x: any) => x.id === row.id ? { ...x, barter_links: [...(x.barter_links || []), ''], barter_dates: [...(x.barter_dates || []), ''], barter_prices: [...(x.barter_prices || []), ''], barter_views: [...(x.barter_views || []), ''], barter_ratings: [...(x.barter_ratings || []), ''], barter_published: [...(x.barter_published || []), false] } : x);
                                applyBarterRowsEdit(nextRows, row.supplier_id, [String(row.id)]);
                              }} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50" title="Добавить бартер в карточку">
                                <Plus className="h-4 w-4" />
                                <span>Бартер</span>
                              </button>
                              <button onClick={() => {
                                const nextRows = (barterRows || []).map((x: any) => x.id === row.id ? { ...x, ad_links: [...(x.ad_links || []), ''], ad_dates: [...(x.ad_dates || []), ''], ad_prices: [...(x.ad_prices || []), ''], ad_views: [...(x.ad_views || []), ''], ad_ratings: [...(x.ad_ratings || []), ''], ad_published: [...(x.ad_published || []), false] } : x);
                                applyBarterRowsEdit(nextRows, row.supplier_id, [String(row.id)]);
                              }} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-violet-200 px-3 py-2 text-xs font-medium text-violet-700 hover:bg-violet-50" title="Добавить рекламу в карточку">
                                <Plus className="h-4 w-4" />
                                <span>Реклама</span>
                              </button>
                              <button onClick={() => setBarterCollapsedCards((prev) => ({ ...(prev || {}), [row.id]: !prev[row.id] }))} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100" title={cardCollapsed ? 'Развернуть' : 'Свернуть'}>
                                {cardCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                                <span>{cardCollapsed ? 'Развернуть' : 'Свернуть'}</span>
                              </button>
                              <button onClick={() => deleteBarterRow(row)} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50" title="Удалить">
                                <Trash2 className="h-4 w-4" />
                                <span>Удалить</span>
                              </button>
                            </div>
                          </div>

                          {!cardCollapsed && (
                            <>
                              <div className="space-y-2 mb-3">
                                {(row.barter_links || []).map((_: any, i: number) => (
                                  <div key={`barter-${row.id}-${i}`} className="grid grid-cols-1 xl:grid-cols-[84px_1fr_150px_120px_120px_170px_118px_36px] gap-2 items-center rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 xl:border-0 xl:bg-transparent xl:p-0">
                                    <span className="text-xs text-slate-500">Бартер {i + 1}</span>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                      <input
                                        value={row.barter_links[i] || ''}
                                        onChange={(e) => {
                                          const nextRows = (barterRows || []).map((x) => x.id === row.id ? { ...x, barter_links: x.barter_links.map((v, vi) => vi === i ? e.target.value : v) } : x);
                                          applyBarterRowsEdit(nextRows, row.supplier_id, [String(row.id)]);
                                        }}
                                        placeholder="https://..."
                                        className="oc-input"
                                      />
                                      {String(row.barter_links[i] || '').trim() ? (
                                        <a href={String(row.barter_links[i])} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-lg border border-indigo-200 px-3 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 whitespace-nowrap">Открыть</a>
                                      ) : null}
                                    </div>
                                    <input
                                      type="date"
                                      value={row.barter_dates?.[i] || ''}
                                      onChange={(e) => {
                                        const nextRows = (barterRows || []).map((x) => x.id === row.id ? { ...x, barter_dates: (x.barter_dates || ['', '', '', '', '']).map((v, vi) => vi === i ? e.target.value : v) } : x);
                                        applyBarterRowsEdit(nextRows, row.supplier_id, [String(row.id)]);
                                      }}
                                      className="oc-input"
                                    />
                                    <input
                                      type="number"
                                      value={row.barter_prices?.[i] || ''}
                                      onChange={(e) => {
                                        const nextRows = (barterRows || []).map((x) => x.id === row.id ? { ...x, barter_prices: (x.barter_prices || []).map((v, vi) => vi === i ? e.target.value : v) } : x);
                                        applyBarterRowsEdit(nextRows, row.supplier_id, [String(row.id)]);
                                      }}
                                      placeholder="Цена"
                                      className="oc-input"
                                    />
                                    <input
                                      type="number"
                                      value={row.barter_views?.[i] || ''}
                                      onChange={(e) => {
                                        const nextRows = (barterRows || []).map((x) => x.id === row.id ? { ...x, barter_views: (x.barter_views || []).map((v, vi) => vi === i ? e.target.value : v) } : x);
                                        applyBarterRowsEdit(nextRows, row.supplier_id, [String(row.id)]);
                                      }}
                                      placeholder="Просмотры"
                                      className="oc-input"
                                    />
                                    <Select
                                      value={row.barter_ratings?.[i] || ''}
                                      onChange={(e) => {
                                        const nextRows = (barterRows || []).map((x) => x.id === row.id ? { ...x, barter_ratings: (x.barter_ratings || []).map((v, vi) => vi === i ? e.target.value : v) } : x);
                                        applyBarterRowsEdit(nextRows, row.supplier_id, [String(row.id)]);
                                      }}
                                      className={getBarterRatingClassName(row.barter_ratings?.[i] || '')}
                                    >
                                      <option value="">Оценка</option>
                                      {BARTER_RATING_OPTIONS.filter(Boolean).map((option) => (
                                        <option key={`barter-rating-${row.id}-${i}-${option}`} value={option}>{option}</option>
                                      ))}
                                    </Select>
                                    <label className={`inline-flex items-center justify-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-medium ${row.barter_published?.[i] ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600'}`}>
                                      <input
                                        type="checkbox"
                                        checked={Boolean(row.barter_published?.[i])}
                                        onChange={(e) => {
                                          const nextRows = (barterRows || []).map((x) => x.id === row.id ? { ...x, barter_published: Array.from({ length: Math.max((x.barter_links || []).length, (x.barter_published || []).length) }, (_, vi) => vi === i ? e.target.checked : Boolean(x.barter_published?.[vi])) } : x);
                                          applyBarterRowsEdit(nextRows, row.supplier_id, [String(row.id)]);
                                        }}
                                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                      />
                                      <span>Вышел</span>
                                    </label>
                                    {i >= 5 ? (
                                      <button
                                        type="button"
                                        title="Удалить строку бартера"
                                        onClick={() => {
                                          const nextRows = (barterRows || []).map((x: any) => {
                                            if (x.id !== row.id) return x;
                                            const bl = [...(x.barter_links || [])]; bl.splice(i, 1);
                                            const bd = [...(x.barter_dates || [])]; bd.splice(i, 1);
                                            const bp = [...(x.barter_prices || [])]; bp.splice(i, 1);
                                            const bv = [...(x.barter_views || [])]; bv.splice(i, 1);
                                            const br = [...(x.barter_ratings || [])]; br.splice(i, 1);
                                            const bpub = [...(x.barter_published || [])]; bpub.splice(i, 1);
                                            return { ...x, barter_links: bl, barter_dates: bd, barter_prices: bp, barter_views: bv, barter_ratings: br, barter_published: bpub };
                                          });
                                          applyBarterRowsEdit(nextRows, row.supplier_id, [String(row.id)]);
                                        }}
                                        className="p-1.5 rounded-md text-rose-600 hover:bg-rose-50"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    ) : <span />}
                                  </div>
                                ))}
                              </div>

                              <div className="space-y-2 mb-1">
                                {(row.ad_links || []).map((_: any, i: number) => (
                                  <div key={`ad-${row.id}-${i}`} className="grid grid-cols-1 xl:grid-cols-[84px_1fr_150px_120px_120px_170px_118px_36px] gap-2 items-center rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 xl:border-0 xl:bg-transparent xl:p-0">
                                    <span className="text-xs text-slate-500">Реклама {i + 1}</span>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                      <input
                                        value={row.ad_links[i] || ''}
                                        onChange={(e) => {
                                          const nextRows = (barterRows || []).map((x) => x.id === row.id ? { ...x, ad_links: x.ad_links.map((v, vi) => vi === i ? e.target.value : v) } : x);
                                          applyBarterRowsEdit(nextRows, row.supplier_id, [String(row.id)]);
                                        }}
                                        placeholder="https://..."
                                        className="oc-input"
                                      />
                                      {String(row.ad_links[i] || '').trim() ? (
                                        <a href={String(row.ad_links[i])} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-lg border border-indigo-200 px-3 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 whitespace-nowrap">Открыть</a>
                                      ) : null}
                                    </div>
                                    <input
                                      type="date"
                                      value={row.ad_dates?.[i] || ''}
                                      onChange={(e) => {
                                        const nextRows = (barterRows || []).map((x) => x.id === row.id ? { ...x, ad_dates: (x.ad_dates || []).map((v, vi) => vi === i ? e.target.value : v) } : x);
                                        applyBarterRowsEdit(nextRows, row.supplier_id, [String(row.id)]);
                                      }}
                                      className="oc-input"
                                    />
                                    <input
                                      type="number"
                                      value={row.ad_prices?.[i] || ''}
                                      onChange={(e) => {
                                        const nextRows = (barterRows || []).map((x) => x.id === row.id ? { ...x, ad_prices: (x.ad_prices || []).map((v, vi) => vi === i ? e.target.value : v) } : x);
                                        applyBarterRowsEdit(nextRows, row.supplier_id, [String(row.id)]);
                                      }}
                                      placeholder="Цена"
                                      className="oc-input"
                                    />
                                    <input
                                      type="number"
                                      value={row.ad_views?.[i] || ''}
                                      onChange={(e) => {
                                        const nextRows = (barterRows || []).map((x) => x.id === row.id ? { ...x, ad_views: (x.ad_views || []).map((v, vi) => vi === i ? e.target.value : v) } : x);
                                        applyBarterRowsEdit(nextRows, row.supplier_id, [String(row.id)]);
                                      }}
                                      placeholder="Просмотры"
                                      className="oc-input"
                                    />
                                    <Select
                                      value={row.ad_ratings?.[i] || ''}
                                      onChange={(e) => {
                                        const nextRows = (barterRows || []).map((x) => x.id === row.id ? { ...x, ad_ratings: (x.ad_ratings || []).map((v, vi) => vi === i ? e.target.value : v) } : x);
                                        applyBarterRowsEdit(nextRows, row.supplier_id, [String(row.id)]);
                                      }}
                                      className={getBarterRatingClassName(row.ad_ratings?.[i] || '')}
                                    >
                                      <option value="">Оценка</option>
                                      {BARTER_RATING_OPTIONS.filter(Boolean).map((option) => (
                                        <option key={`ad-rating-${row.id}-${i}-${option}`} value={option}>{option}</option>
                                      ))}
                                    </Select>
                                    <label className={`inline-flex items-center justify-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-medium ${row.ad_published?.[i] ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600'}`}>
                                      <input
                                        type="checkbox"
                                        checked={Boolean(row.ad_published?.[i])}
                                        onChange={(e) => {
                                          const nextRows = (barterRows || []).map((x) => x.id === row.id ? { ...x, ad_published: Array.from({ length: Math.max((x.ad_links || []).length, (x.ad_published || []).length) }, (_, vi) => vi === i ? e.target.checked : Boolean(x.ad_published?.[vi])) } : x);
                                          applyBarterRowsEdit(nextRows, row.supplier_id, [String(row.id)]);
                                        }}
                                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                      />
                                      <span>Вышел</span>
                                    </label>
                                    {i >= 2 ? (
                                      <button
                                        type="button"
                                        title="Удалить строку рекламы"
                                        onClick={() => {
                                          const nextRows = (barterRows || []).map((x: any) => {
                                            if (x.id !== row.id) return x;
                                            const al = [...(x.ad_links || [])]; al.splice(i, 1);
                                            const ad = [...(x.ad_dates || [])]; ad.splice(i, 1);
                                            const ap = [...(x.ad_prices || [])]; ap.splice(i, 1);
                                            const av = [...(x.ad_views || [])]; av.splice(i, 1);
                                            const ar = [...(x.ad_ratings || [])]; ar.splice(i, 1);
                                            const apub = [...(x.ad_published || [])]; apub.splice(i, 1);
                                            return { ...x, ad_links: al, ad_dates: ad, ad_prices: ap, ad_views: av, ad_ratings: ar, ad_published: apub };
                                          });
                                          applyBarterRowsEdit(nextRows, row.supplier_id, [String(row.id)]);
                                        }}
                                        className="p-1.5 rounded-md text-rose-600 hover:bg-rose-50"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    ) : <span />}
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              )}

              {barterPreviewGallery && (
                <div className={`fixed inset-0 z-[85] bg-black/85 flex items-center justify-center p-3 sm:p-4 transition-opacity duration-200 ease-out ${barterPreviewGallery.closing ? 'opacity-0' : 'opacity-100'}`} onClick={() => closeBarterPreviewGallery()}>
                  <div className={`relative w-full max-w-6xl transition-all duration-200 ease-out ${barterPreviewGallery.closing ? (barterPreviewGallery.closeMode === 'down' ? 'translate-y-12 scale-[0.97] opacity-0' : 'scale-[0.985] opacity-0') : 'translate-y-0 scale-100 opacity-100'}`} onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => closeBarterPreviewGallery()}
                      className="absolute right-0 top-0 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/50 backdrop-blur-sm text-white hover:bg-black/70"
                      title="Закрыть"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    <div className="flex items-center justify-center gap-2 sm:gap-4">
                      {barterPreviewGallery.images.length > 1 && (
                        <button
                          type="button"
                          onClick={showPreviousBarterPreviewImage}
                          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
                          title="Предыдущее фото"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                      )}
                      <div
                        className="flex-1 flex flex-col items-center"
                        onTouchStart={(e) => {
                          const touch = e.changedTouches?.[0];
                          barterPreviewTouchStartRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
                        }}
                        onTouchEnd={(e) => {
                          const start = barterPreviewTouchStartRef.current;
                          const touch = e.changedTouches?.[0];
                          barterPreviewTouchStartRef.current = null;
                          if (!start || !touch) return;
                          const deltaX = touch.clientX - start.x;
                          const deltaY = touch.clientY - start.y;
                          if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY > 70) {
                            closeBarterPreviewGallery('down');
                            return;
                          }
                          if (barterPreviewGallery.images.length < 2 || Math.abs(deltaX) < 40) return;
                          if (deltaX < 0) showNextBarterPreviewImage();
                          else showPreviousBarterPreviewImage();
                        }}
                      >
                        <img
                          src={barterPreviewGallery.images[barterPreviewGallery.index]}
                          alt={`preview-${barterPreviewGallery.index + 1}`}
                          className="max-w-[92vw] max-h-[78vh] rounded-xl shadow-2xl object-contain select-none"
                        />
                        {barterPreviewGallery.images.length > 1 && (
                          <>
                            <div className="mt-3 text-sm text-white/90">{barterPreviewGallery.index + 1} / {barterPreviewGallery.images.length}</div>
                            <div className="mt-3 flex max-w-full gap-2 overflow-x-auto pb-1">
                              {barterPreviewGallery.images.map((src, idx) => (
                                <button
                                  key={`barter-preview-thumb-${idx}`}
                                  type="button"
                                  onClick={() => setBarterPreviewGallery((prev) => prev ? ({ ...prev, index: idx, closing: false, closeMode: 'fade' }) : prev)}
                                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${idx === barterPreviewGallery.index ? 'border-white' : 'border-white/30'}`}
                                  title={`Открыть фото ${idx + 1}`}
                                >
                                  <img src={src} alt={`thumb-${idx + 1}`} className="h-full w-full object-cover" />
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                      {barterPreviewGallery.images.length > 1 && (
                        <button
                          type="button"
                          onClick={showNextBarterPreviewImage}
                          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
                          title="Следующее фото"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {barterModalOpen && (
                <div className="fixed inset-0 z-[80] flex items-stretch sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-3" onClick={() => closeBarterAddModal()}>
                  <div className="w-full max-w-3xl h-[100dvh] sm:h-auto sm:max-h-[92dvh] flex flex-col bg-white rounded-none sm:rounded-2xl shadow-xl p-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-3 shrink-0">
                      <div className="text-base font-semibold text-slate-900">Добавить товар</div>
                      <button className="text-slate-500 hover:text-slate-700" onClick={() => closeBarterAddModal()}><X className="h-4 w-4" /></button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3 shrink-0">
                      <Select value={barterSupplierId} onChange={(e) => setBarterSupplierId(e.target.value)} className="oc-select">
                        <option value="">Выберите поставщика</option>
                        {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </Select>
                      <input value={barterProductSearch} onChange={(e) => setBarterProductSearch(e.target.value)} placeholder="Поиск: название / номенклатура / артикул / артикул поставщика" className="oc-input" />
                      <button type="button" onClick={refreshBarterPhotos} disabled={barterPhotoLoading || !barterSupplierId} className="btn-ghost disabled:opacity-60">
                        {barterPhotoLoading ? 'Обновляю фото...' : 'Обновить фото'}
                      </button>
                    </div>
                    <div className="mb-3 grid grid-cols-2 gap-2 items-end shrink-0">
                      <div className="flex flex-col">
                        <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase tracking-wide leading-tight min-h-[28px] flex items-end">Бартеров создать</label>
                        <QtyField min="0" value={barterCreateBarterCount} onChange={(e) => setBarterCreateBarterCount(e.target.value)} className="oc-input w-full" placeholder="0" />
                      </div>
                      <div className="flex flex-col">
                        <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase tracking-wide leading-tight min-h-[28px] flex items-end">Реклам создать</label>
                        <QtyField min="0" value={barterCreateAdCount} onChange={(e) => setBarterCreateAdCount(e.target.value)} className="oc-input w-full" placeholder="0" />
                      </div>
                    </div>
                    <label className="mb-3 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 shrink-0">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={barterCreateMergedCard}
                        onChange={(e) => setBarterCreateMergedCard(e.target.checked)}
                      />
                      <span>
                        <span className="block font-medium text-slate-900">Объединить карточки</span>
                        <span className="block text-xs text-slate-500 mt-0.5">Если выбрать несколько товаров, сразу создастся одна объединённая карточка.</span>
                      </span>
                    </label>
                    <div className="flex-1 min-h-0 overflow-y-auto border rounded-xl p-2 space-y-1">
                      {barterCatalogLoading ? (
                        <div className="text-sm text-slate-500 p-3">Загрузка товаров...</div>
                      ) : barterFilteredProducts.length === 0 ? (
                        <div className="text-sm text-slate-500 p-3">Товары не найдены по выбранному поставщику.</div>
                      ) : barterFilteredProducts.map((p: any) => {
                        const checked = barterCheckedProductIds.includes(String(p.id));
                        const photo = barterPhotoMap[String(p.id)] || p?.photoUrl || p?.image || p?.image_url || p?.photos?.[0]?.big || p?.photos?.[0]?.tm || '';
                        const nm = String(p?.nmID || p?.nmId || p?.wb_sku || '-');
                        const article = String(p?.vendorCode || p?.article || p?.wb_sku || '-');
                        const supplierArticle = String(p?.supplierArticle || p?.supplier_article || p?.name || '-');
                        const title = String(p?.title || p?.name || 'Без названия');
                        return (
                          <label key={`barter-p-${p.id}`} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg text-sm">
                            <input type="checkbox" className="mt-1" checked={checked} onChange={(e) => setBarterCheckedProductIds((prev) => e.target.checked ? [...prev, String(p.id)] : prev.filter((x) => x !== String(p.id)))} />
                            <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                              {photo ? <img src={photo} alt={title} className="w-full h-full object-cover" /> : <Package className="h-4 w-4 text-slate-400" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-slate-900 truncate">{title}</div>
                              <div className="text-xs text-slate-600 mt-0.5">Номенклатура: <span className="font-medium">{nm}</span></div>
                              <div className="text-xs text-slate-600">Артикул: <span className="font-medium">{article}</span></div>
                              <div className="text-xs text-slate-600">Артикул поставщика: <span className="font-medium">{supplierArticle}</span></div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    <div className="mt-3 flex justify-end gap-2 shrink-0">
                      <button className="btn-ghost" onClick={() => closeBarterAddModal()}>Отмена</button>
                      <button className="btn-primary" onClick={addSelectedBarterProducts} disabled={!barterCheckedProductIds.length || !barterSupplierId}>{barterCreateMergedCard ? 'Создать объединённую карточку' : 'Добавить выбранные'}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
  );
}
