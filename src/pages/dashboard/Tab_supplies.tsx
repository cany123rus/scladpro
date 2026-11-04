// Вынесено из Dashboard.tsx автоматически (ленивая загрузка раздела). Данные приходят пропсами из Dashboard.
/* eslint-disable */
import { UserCog, X, Truck, Database, CheckCircle2, RefreshCw, Box, ChevronRight, Printer, QrCode, ArrowLeft, FileSpreadsheet, Lock, LockOpen, Trash2, AlertCircle, Package, Plus, Upload, History, ShieldCheck, Undo2, Pencil, Clock, Search } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { SuppliesFBOSection } from '../dashboardComponents';
import { setWarehouseOfflineUrl } from '../../lib/warehouseOffline';
import { Select } from '../../components/ui/Select';
import { SearchSelect } from '../../components/ui/SearchSelect';
import { QtyField } from '../../components/ui/QtyField';

export function Tab_supplies(props: any) {
  const { activeScannerEmployee, boxInput, boxItems, boxesList, checkWarehouseOfflineServer, closeFboPalletProductPicker, createNextBoxInCurrentSupply, currentBox, currentEmployee, currentSupply, employees, fboBoxesExcelFile, fboBoxesGenerating, fboBoxesRangeFrom, fboBoxesRangeTo, fboBoxesSupplierId, fboBoxesTotalLabels, fboOfflineMode, fboPalletBrandFilter, fboPalletBrands, fboPalletCategories, fboPalletCategoryFilter, fboPalletHint, fboPalletHistoryOpen, fboPalletItemQtyEdit, fboPalletItems, fboPalletLoading, fboPalletModalOpen, fboPalletProductPicker, fboPalletProductSearch, fboPalletProductsLoading, fboPalletSelectedProducts, fboPalletSelectedSupplyId, fboPalletSelectedWarehouseId, fboPalletSessions, fboPalletSupplierId, fboPalletSupplies, fboPalletSupplyDate, fboPalletSupplyEdit, fboPalletSupplyName, fboPalletWarehouseEdit, fboPalletWarehouseName, fboPalletWarehouses, fboPallets, fetchBoxesList, fetchFboPalletData, fetchSupplyStats, filteredFboPalletProducts, finishCurrentBoxAndReturn, getWarehouseOfflineSuppliers, handleAddFboPallet, handleAddFboPalletSupply, handleAddFboPalletWarehouse, handleAddSelectedProductsToFboPallet, handleBoxScan, handleChangeFboPalletSupplier, handleCloseSupply, handleDeleteBox, handleDeleteFboPallet, handleDeleteFboPalletItem, handleDeleteFboPalletSupply, handleDeleteFboPalletWarehouse, handleDeleteOfflineHistorySession, handleDeleteSupply, handleDeleteSupplyItem, handleDownloadExcel, handleGenerateFboBoxesLabelsFromExcel, handleHonestSignScan, handleItemScan, handleOpenOfflineHistorySession, handlePrintNameSequenceLabels, handleSaveFboPalletItemQtyEdit, handleSaveFboPalletSupplyEdit, handleSaveFboPalletWarehouseEdit, handleSupplyScan, handleSyncSupplyBoxesFromExcel, handleToggleSupplyLock, handleToggleSupplyLockList, hasAssemblyButtonAccess, honestSignInputRef, itemInputRef, loadWarehouseOfflineSnapshot, modalScanInput, nameSequencePrintForm, nameSequencePrintLoading, offlineFboHistoryLoading, offlineFboHistorySessions, offlineFboSession, offlineFboUnsyncedStats, offlineFboUploadLoading, offlineFboValidation, offlineFboValidationLoading, openFboPalletCollector, openFboPalletItemQtyEdit, openFboPalletProductPicker, openFboPalletSupplyEdit, openFboPalletWarehouseEdit, openSupplyProductsModal, refreshSupplyProductsPhotos, refreshWarehouseOfflineBase, saveWarehouseOfflineSettings, scannedItem, selectFboPalletWarehouse, selectedSupplierId, setActiveScannerEmployee, setBoxInput, setCurrentBox, setCurrentSupply, setFboBoxesExcelFile, setFboBoxesRangeFrom, setFboBoxesRangeTo, setFboBoxesSupplierId, setFboOfflineMode, setFboPalletBrandFilter, setFboPalletCategoryFilter, setFboPalletHistoryOpen, setFboPalletItemQtyEdit, setFboPalletModalOpen, setFboPalletProductSearch, setFboPalletSelectedProductQty, setFboPalletSelectedSupplyId, setFboPalletSupplyDate, setFboPalletSupplyEdit, setFboPalletSupplyName, setFboPalletWarehouseEdit, setFboPalletWarehouseName, setModalScanInput, setNameSequencePrintForm, setScannedItem, setSelectedSupplierId, setShowGenerateBoxQR, setShowNameSequencePrintModal, setShowNewBoxQR, setShowOfflineFboHistory, setShowScannerBadgePicker, setShowSupplyProductsModal, setSupplyInput, setSupplyStep, setSupplySyncExcelFile, setSupplySyncOpen, setWarehouseOfflineUrlState, showGenerateBoxQR, showNameSequencePrintModal, showNewBoxQR, showOfflineFboHistory, showScannerBadgePicker, showSupplyProductsModal, showToast, suppliers, suppliesList, supplyInput, supplyProductsLoading, supplyProductsPhotoLoading, supplyProductsRows, supplyStats, supplyStep, supplySyncExcelFile, supplySyncLoading, supplySyncOpen, syncWarehouseOfflineScans, toggleFboPalletSelectedProduct, uploadOfflineFboSessionToDb, validateOfflineFboSession, warehouseOfflineBusy, warehouseOfflineEnabled, warehouseOfflineSnapshot, warehouseOfflineStatus, warehouseOfflineUrl } = props;
  return (
<>
              {/* Активный сборщик — учёт выработки по сканам. Видно админу/тем, у кого включено право кнопки. */}
              {hasAssemblyButtonAccess('supply_scanner_picker') && (
              <div className={`mx-auto max-w-6xl mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-4 py-2.5 text-sm ${activeScannerEmployee ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <UserCog className={`h-4 w-4 shrink-0 ${activeScannerEmployee ? 'text-emerald-600' : 'text-amber-600'}`} />
                  {activeScannerEmployee ? (
                    <span className="truncate"><span className="text-slate-500">Сканирует:</span> <b className="text-emerald-800">{activeScannerEmployee.name}</b></span>
                  ) : (
                    <span className="text-amber-800">Сборщик не выбран — отсканируйте бейдж (или скан пишется на залогиненного: {(currentEmployee as any)?.full_name || '—'})</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setShowScannerBadgePicker(true)} className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs">Сменить сборщика</button>
                  {activeScannerEmployee && <button onClick={() => { setActiveScannerEmployee(null); showToast('Сборщик сброшен', 'info'); }} className="px-2.5 py-1 rounded-lg border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 text-xs">Сбросить</button>}
                </div>
              </div>
              )}

              {showScannerBadgePicker && hasAssemblyButtonAccess('supply_scanner_picker') && (
                <div className="fixed inset-0 z-[9995] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setShowScannerBadgePicker(false)}>
                  <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                      <div>
                        <h3 className="font-bold text-slate-900">Выбор сборщика</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Нажмите на сотрудника или отсканируйте его бейдж. Учёт выработки — по сканам.</p>
                      </div>
                      <button onClick={() => setShowScannerBadgePicker(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
                    </div>
                    <div className="p-4 space-y-2">
                      {employees.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-sm">Нет сотрудников</div>
                      ) : employees.map((emp: any) => (
                        <div key={emp.id} className={`flex items-center gap-3 rounded-2xl border p-3 ${activeScannerEmployee?.id === String(emp.id) ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200'}`}>
                          <div className="shrink-0 rounded-lg bg-white p-1 ring-1 ring-slate-200" data-no-invert>
                            <QRCodeSVG value={`WRK:${emp.id}`} size={56} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-slate-800 truncate">{emp.full_name || 'Сотрудник'}</div>
                            <div className="text-[11px] text-slate-400">{emp.role || 'Сборщик'} · бейдж: WRK:{String(emp.id).slice(0, 8)}…</div>
                          </div>
                          <button onClick={() => { setActiveScannerEmployee({ id: String(emp.id), name: emp.full_name || 'Сотрудник' }); showToast(`Сканирует: ${emp.full_name || 'Сотрудник'}`, 'success'); setShowScannerBadgePicker(false); }} className="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700">Выбрать</button>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 pb-4 text-[11px] text-slate-400">QR можно распечатать как бейдж: сотрудник сканирует его в начале смены, и все его сборки засчитываются ему.</div>
                  </div>
                </div>
              )}

              {supplyStep === 'LIST' && (
                <SuppliesFBOSection>
                <div className="mx-auto max-w-6xl">
                  <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                      <Truck className="h-8 w-8 text-indigo-600" />
                    </div>
                      <div>
                        <h1 className="text-2xl font-bold text-slate-900">Приемка поставки</h1>
                        <p className="text-slate-500 mt-1">Отсканируйте штрихкод поставки или создайте ее локально без интернета</p>
                      </div>
                    </div>
                    {warehouseOfflineEnabled && (
                      <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                        <Database className="h-4 w-4" />
                        Offline-режим склада включен
                      </div>
                    )}
                  </div>

                  <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 p-4 xl:flex-row xl:items-end xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${warehouseOfflineEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                            <Database className="h-4 w-4" />
                          </div>
                          <div className="text-sm font-bold text-slate-900">Склад offline</div>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${warehouseOfflineEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${warehouseOfflineEnabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {warehouseOfflineEnabled ? 'Включен' : 'Выключен'}
                          </span>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${warehouseOfflineStatus?.ok ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'}`}>
                            {warehouseOfflineStatus?.ok ? 'Сервер доступен' : 'Сервер не проверен'}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
                          <input
                            type="text"
                            value={warehouseOfflineUrl}
                            onChange={(e) => {
                              setWarehouseOfflineUrlState(e.target.value);
                              setWarehouseOfflineUrl(e.target.value);
                            }}
                            onBlur={() => saveWarehouseOfflineSettings(warehouseOfflineEnabled, warehouseOfflineUrl)}
                            className="min-h-[48px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-base outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="http://IP-складского-ПК:8787"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const next = !warehouseOfflineEnabled;
                              saveWarehouseOfflineSettings(next);
                              if (next) loadWarehouseOfflineSnapshot(true).catch(() => undefined);
                            }}
                            className={`min-h-[48px] rounded-xl px-4 py-3 text-sm font-medium ${warehouseOfflineEnabled ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                          >
                            {warehouseOfflineEnabled ? 'Отключить' : 'Включить'}
                          </button>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          {warehouseOfflineStatus?.updatedAt ? 'База обновлена: ' + new Date(warehouseOfflineStatus.updatedAt).toLocaleString('ru-RU') : 'Offline-база ещё не обновлялась'} •
                          {' '}локальная очередь: {warehouseOfflineStatus?.pendingScans ?? 0} • синхронизировано: {warehouseOfflineStatus?.syncedScans ?? 0} • конфликты: {warehouseOfflineStatus?.conflicts ?? 0}
                        </div>
                        {warehouseOfflineSnapshot && (
                          <div className="mt-1 text-xs text-slate-500">
                            В локальной базе: поставщиков {getWarehouseOfflineSuppliers().length}, поставок {warehouseOfflineSnapshot.fboSupplies?.length || 0}, коробок {warehouseOfflineSnapshot.fboBoxes?.length || 0}, товаров WB {warehouseOfflineSnapshot.wbProducts?.length || 0}
                          </div>
                        )}
                        {warehouseOfflineStatus?.error && <div className="mt-2 text-xs text-rose-600">{warehouseOfflineStatus.error}</div>}
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                        <button
                          type="button"
                          onClick={() => checkWarehouseOfflineServer(true)}
                          disabled={warehouseOfflineBusy}
                          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-4 w-4" /> Проверить
                        </button>
                        <button
                          type="button"
                          onClick={() => loadWarehouseOfflineSnapshot(true)}
                          disabled={warehouseOfflineBusy || !warehouseOfflineEnabled}
                          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] disabled:opacity-50"
                        >
                          <Database className="h-4 w-4" /> Загрузить
                        </button>
                        <button
                          type="button"
                          onClick={refreshWarehouseOfflineBase}
                          disabled={warehouseOfflineBusy}
                          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-sm shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50"
                        >
                          <RefreshCw className={`h-4 w-4 ${warehouseOfflineBusy ? 'animate-spin' : ''}`} /> {warehouseOfflineBusy ? 'Работаю...' : 'Обновить offline-базу'}
                        </button>
                        <button
                          type="button"
                          onClick={() => syncWarehouseOfflineScans(false)}
                          disabled={warehouseOfflineBusy}
                          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50"
                        >
                          <RefreshCw className="h-4 w-4" /> Синхронизировать
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Standalone action banners: «Собрать паллеты» + «Маркировка Мешков/Коробок» */}
                  <div className="mb-6 grid gap-3 lg:grid-cols-2">
                  <button
                    type="button"
                    onClick={openFboPalletCollector}
                    className="group flex w-full items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-5 text-left text-white shadow-lg shadow-violet-600/25 transition-all hover:shadow-xl hover:shadow-violet-600/30 active:scale-[0.99]"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 transition-transform group-hover:scale-105">
                      <Box className="h-7 w-7" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-lg font-bold leading-tight">Собрать паллеты</div>
                      <div className="text-sm text-white/80">Открыть сборщик паллет: склады, поставки и товары</div>
                    </div>
                    <ChevronRight className="h-6 w-6 shrink-0 text-white/80 transition-transform group-hover:translate-x-1" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const supplierName = suppliers.find(s => String(s.id) === String(currentSupply?.supplier_id || ''))?.name || '';
                      setNameSequencePrintForm(prev => ({ name: supplierName || prev.name || '', quantity: prev.quantity || '1' }));
                      setShowNameSequencePrintModal(true);
                    }}
                    className="group flex w-full items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-fuchsia-600 to-pink-600 p-5 text-left text-white shadow-lg shadow-fuchsia-600/25 transition-all hover:shadow-xl hover:shadow-fuchsia-600/30 active:scale-[0.99]"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 transition-transform group-hover:scale-105">
                      <Printer className="h-7 w-7" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-lg font-bold leading-tight">Маркировка Мешков/Коробок</div>
                      <div className="text-sm text-white/80">Печать имени и порядкового номера</div>
                    </div>
                    <ChevronRight className="h-6 w-6 shrink-0 text-white/80 transition-transform group-hover:translate-x-1" />
                  </button>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]">
                  <div className="oc-card overflow-hidden p-0">
                    <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-5 py-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm">
                        <QrCode className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 leading-tight">Приёмка по ШК</div>
                        <div className="text-xs text-slate-500">Сканирование штрихкода поставки</div>
                      </div>
                    </div>
                    <div className="p-5 md:p-6">
                    <label className="mb-1 block text-xs font-medium text-slate-500">Поставщик для ШК поставки</label>
                    <Select
                      value={selectedSupplierId}
                      onChange={(e) => setSelectedSupplierId(e.target.value)}
                      className="oc-select mb-4 min-h-[48px]"
                    >
                      <option value="">Выберите поставщика для ШК поставки...</option>
                      {(warehouseOfflineEnabled ? getWarehouseOfflineSuppliers() : suppliers).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>

	                    <form onSubmit={handleSupplyScan} className="flex gap-2">
	                      <input
                        type="text"
                        value={supplyInput}
                        onChange={(e) => setSupplyInput(e.target.value)}
                        placeholder="Штрихкод поставки..."
                        className="min-h-[52px] flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-base outline-none focus:ring-2 focus:ring-indigo-500"
                        autoFocus
                      />
	                      <button type="submit" className="inline-flex min-h-[52px] min-w-[52px] items-center justify-center rounded-xl bg-indigo-600 p-3 text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-[0.97]">
	                        <ArrowLeft className="h-6 w-6 rotate-180" />
	                      </button>
	                    </form>
	                    </div>
	                  </div>

                  <div className="oc-card overflow-hidden p-0">
                    <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-cyan-50 px-5 py-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-sm">
                        <Box className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 leading-tight">Коробки (FBO)</div>
                        <div className="text-xs text-slate-500">Этикетки коробов 58×40 из Excel</div>
                      </div>
                    </div>
                    <div className="p-5">
                    <div className="mb-3 rounded-xl bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
                      Загрузите Excel с колонкой «ШК короба» (или первой колонкой с кодом), затем сгенерируйте этикетки 58×40 с нумерацией. Макет берётся из «Конструктор этикеток → Короба FBO».
                    </div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Поставщик</label>
                    <Select
                      value={fboBoxesSupplierId}
                      onChange={(e) => setFboBoxesSupplierId(e.target.value)}
                      className="oc-select mb-3 min-h-[48px]"
                    >
                      <option value="">Выберите поставщика для коробок FBO...</option>
                      {(warehouseOfflineEnabled ? getWarehouseOfflineSuppliers() : suppliers).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                    <label className="group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center transition-colors hover:border-sky-300 hover:bg-sky-50">
                      <FileSpreadsheet className="h-7 w-7 text-slate-400 group-hover:text-sky-500" />
                      <div className="text-sm font-medium text-slate-700">
                        {fboBoxesExcelFile ? fboBoxesExcelFile.name : 'Нажмите, чтобы выбрать Excel-файл'}
                      </div>
                      <div className="text-[11px] text-slate-400">.xlsx или .xls</div>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => setFboBoxesExcelFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>

                    {fboBoxesExcelFile && (
                      <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                        <div className="mb-2 flex items-center gap-2 text-xs text-slate-700">
                          <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 font-semibold text-sky-700">Найдено коробок: {fboBoxesTotalLabels}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                          <div>
                            <label className="block text-[11px] text-slate-600 mb-1">От</label>
                            <input
                              type="number"
                              min={1}
                              max={Math.max(1, fboBoxesTotalLabels)}
                              value={fboBoxesRangeFrom}
                              onChange={(e) => setFboBoxesRangeFrom(e.target.value)}
                              className="h-11 w-full rounded-xl border-slate-200 bg-slate-50 text-sm"
                              placeholder="1"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-600 mb-1">До</label>
                            <input
                              type="number"
                              min={1}
                              max={Math.max(1, fboBoxesTotalLabels)}
                              value={fboBoxesRangeTo}
                              onChange={(e) => setFboBoxesRangeTo(e.target.value)}
                              className="h-11 w-full rounded-xl border-slate-200 bg-slate-50 text-sm"
                              placeholder={fboBoxesTotalLabels ? String(fboBoxesTotalLabels) : ''}
                            />
                          </div>
                          <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                            К печати: <span className="font-bold">{(() => {
                              const total = fboBoxesTotalLabels || 0;
                              if (!total) return 0;
                              const from = Math.max(1, Math.min(total, parseInt(fboBoxesRangeFrom || '1', 10) || 1));
                              const to = Math.max(from, Math.min(total, parseInt(fboBoxesRangeTo || String(total), 10) || total));
                              return Math.max(0, to - from + 1);
                            })()}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleGenerateFboBoxesLabelsFromExcel}
                      disabled={!fboBoxesSupplierId || !fboBoxesExcelFile || fboBoxesGenerating}
                      className="btn-primary mt-4 w-full min-h-[48px]"
                    >
                      {fboBoxesGenerating ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Printer className="h-5 w-5" />}
                      {fboBoxesGenerating ? 'Готовлю…' : 'Печать ШК коробов'}
                    </button>
                    </div>
                  </div>
                  </div>


                  <div className="mt-6 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="font-medium text-slate-900">Поставки</h3>
                      {warehouseOfflineEnabled && (
                        <div className="text-xs font-medium text-slate-500">Показываются данные из локальной базы ПК</div>
                      )}
                    </div>
                    {!suppliesList.length && (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
                        Поставок пока нет. Выберите поставщика и отсканируйте или введите ШК поставки, чтобы создать ее локально.
                      </div>
                    )}
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {suppliesList
                      .slice()
                      .sort((a, b) => new Date(String(b?.created_at || '')).getTime() - new Date(String(a?.created_at || '')).getTime())
                      .map(supply => (
                      <div key={supply.id} className={`group relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${supply.status === 'closed' ? 'border-emerald-200' : 'border-slate-200 hover:border-indigo-200'}`}>
                        <span className={`absolute inset-y-0 left-0 w-1.5 ${supply.status === 'closed' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                        <div onClick={() => { setCurrentSupply(supply); fetchBoxesList(supply.id); fetchSupplyStats(supply.id); setSupplyStep('SUPPLY'); }} className="flex-1 w-full cursor-pointer pl-2">
                          <div className="flex items-start gap-3">
                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${supply.status === 'closed' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                              <Truck className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-bold text-slate-900">{supply.name}</div>
                              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 font-semibold text-slate-700">
                                  {supply.total_items || 0} шт.
                                </span>
                                {supply.status === 'closed' ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 font-semibold text-emerald-700">
                                    <CheckCircle2 className="h-3 w-3" /> Отгружена
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 font-semibold text-amber-700">
                                    В работе
                                  </span>
                                )}
                                <span className="text-slate-400">{new Date(supply.status === 'closed' ? (supply.updated_at || supply.created_at) : supply.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex w-full justify-end gap-2 pl-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleSupplyLockList(supply); }}
                            className={`rounded-xl border p-2 transition-colors ${supply.status === 'closed' ? 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50' : 'border-slate-200 bg-white text-slate-400 hover:border-indigo-200 hover:text-indigo-600'}`}
                            title={supply.status === 'closed' ? 'Разблокировать' : 'Заблокировать'}
                          >
                            {supply.status === 'closed' ? <Lock className="h-5 w-5" /> : <LockOpen className="h-5 w-5" />}
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteSupply(supply.id); }} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 transition-colors hover:border-rose-200 hover:text-rose-600" title="Удалить">
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    </div>
                  </div>
                </div>
                </SuppliesFBOSection>
              )}

              {supplyStep === 'SUPPLY' && currentSupply && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col 2xl:h-[calc(100vh-6rem)] 2xl:overflow-hidden">
                  <div className="p-4 border-b border-slate-200 bg-white z-10 flex flex-col gap-4 oc-filterbar">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <button onClick={() => setSupplyStep('LIST')} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-700 active:scale-[0.95]"><ArrowLeft className="h-5 w-5" /></button>
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${currentSupply.status === 'closed' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                          <Truck className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                          <h1 className="truncate text-2xl font-bold text-slate-900">Поставка {currentSupply.name}</h1>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">{supplyStats.boxes} коробок</span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">{supplyStats.items} товаров</span>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${currentSupply.status === 'closed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {currentSupply.status === 'closed' ? <Lock className="h-3 w-3" /> : <LockOpen className="h-3 w-3" />}
                              {currentSupply.status === 'closed' ? 'Закрыта' : 'Открыта'}
                            </span>
                            {offlineFboUnsyncedStats.sessions > 0 && (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Не синхронизировано: {offlineFboUnsyncedStats.sessions} сесс., {offlineFboUnsyncedStats.items} сканов
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 lg:items-end">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-sm">
                          <div className="flex flex-wrap gap-2">
                            <button onClick={openSupplyProductsModal} className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-sky-50 hover:text-sky-700">
                              <Package className="h-4 w-4 mr-2" /> Товар
                            </button>
                            <button onClick={handleDownloadExcel} className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700">
                              <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
                            </button>
                            <button onClick={() => setSupplySyncOpen(true)} className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-amber-700 shadow-sm hover:bg-amber-50">
                              <RefreshCw className="h-4 w-4 mr-2" /> Синхронизировать
                            </button>
                            <button onClick={handleToggleSupplyLock} className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm ${currentSupply.status === 'closed' ? 'bg-slate-700 text-white hover:bg-slate-800' : 'bg-white text-slate-700 hover:bg-slate-100'}`} title={currentSupply.status === 'closed' ? "Разблокировать" : "Заблокировать"}>
                              {currentSupply.status === 'closed' ? <Lock className="h-4 w-4 mr-2" /> : <LockOpen className="h-4 w-4 mr-2" />}
                              {currentSupply.status === 'closed' ? 'Разблокировать' : 'Заблокировать'}
                            </button>
                            {currentSupply.status !== 'closed' && (
                              <button onClick={handleCloseSupply} className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-rose-700">
                                <CheckCircle2 className="h-4 w-4 mr-2" /> <span className="whitespace-nowrap">Закрыть поставку</span>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => setShowGenerateBoxQR(true)} className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800">
                              <QrCode className="h-4 w-4 mr-2" /> <span className="whitespace-nowrap">QR генерация коробки</span>
                            </button>
                            <button onClick={() => setFboOfflineMode((prev) => !prev)} className={`relative inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm ${fboOfflineMode ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'}`}>
                              <Database className="h-4 w-4 mr-2" /> {fboOfflineMode ? 'Оффлайн включен' : 'Оффлайн режим'}
                              {offlineFboUnsyncedStats.sessions > 0 && (
                                <span className={`ml-2 inline-flex min-w-[1.5rem] justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${fboOfflineMode ? 'bg-white/20 text-white' : 'bg-white text-amber-700'}`}>
                                  {offlineFboUnsyncedStats.sessions}
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm font-bold text-slate-900">Склад offline</div>
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${warehouseOfflineEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                              {warehouseOfflineEnabled ? 'Включен' : 'Выключен'}
                            </span>
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${warehouseOfflineStatus?.ok ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'}`}>
                              {warehouseOfflineStatus?.ok ? 'Сервер доступен' : 'Сервер не проверен'}
                            </span>
                          </div>
                          <div className="mt-2 grid gap-2 md:grid-cols-[1fr_auto]">
                            <input
                              type="text"
                              value={warehouseOfflineUrl}
                              onChange={(e) => {
                                setWarehouseOfflineUrlState(e.target.value);
                                setWarehouseOfflineUrl(e.target.value);
                              }}
                              onBlur={() => saveWarehouseOfflineSettings(warehouseOfflineEnabled, warehouseOfflineUrl)}
                              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="http://IP-складского-ПК:8787"
                            />
                            <button
                              type="button"
                              onClick={() => saveWarehouseOfflineSettings(!warehouseOfflineEnabled)}
                              className={`rounded-xl px-4 py-2 text-sm font-medium ${warehouseOfflineEnabled ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                            >
                              {warehouseOfflineEnabled ? 'Отключить' : 'Включить'}
                            </button>
                          </div>
                          <div className="mt-2 text-xs text-slate-500">
                            {warehouseOfflineStatus?.updatedAt ? 'База обновлена: ' + new Date(warehouseOfflineStatus.updatedAt).toLocaleString('ru-RU') : 'Offline-база ещё не обновлялась'} •
                            {' '}локальная очередь: {warehouseOfflineStatus?.pendingScans ?? 0} • синхронизировано: {warehouseOfflineStatus?.syncedScans ?? 0} • конфликты: {warehouseOfflineStatus?.conflicts ?? 0}
                          </div>
                          {warehouseOfflineStatus?.error && <div className="mt-2 text-xs text-rose-600">{warehouseOfflineStatus.error}</div>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => checkWarehouseOfflineServer(true)}
                            disabled={warehouseOfflineBusy}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          >
                            Проверить
                          </button>
                          <button
                            type="button"
                            onClick={refreshWarehouseOfflineBase}
                            disabled={warehouseOfflineBusy}
                            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                          >
                            {warehouseOfflineBusy ? 'Работаю...' : 'Обновить offline-базу'}
                          </button>
                          <button
                            type="button"
                            onClick={() => syncWarehouseOfflineScans(false)}
                            disabled={warehouseOfflineBusy}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            Синхронизировать
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className={`bg-slate-50 rounded-xl border border-slate-200 p-1 ${currentSupply.status === 'closed' ? 'opacity-50 pointer-events-none' : ''}`}>
                      <form onSubmit={handleBoxScan} className="flex items-center bg-white rounded-lg p-1 shadow-sm">
                        <input
                          type="text"
                          value={boxInput}
                          onChange={(e) => setBoxInput(e.target.value)}
                          placeholder={currentSupply.status === 'closed' ? "Поставка закрыта" : "Штрихкод коробки..."}
                          className="flex-1 p-3 outline-none text-lg"
                          autoFocus
                          disabled={currentSupply.status === 'closed'}
                        />
                        <button type="submit" className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 m-1" disabled={currentSupply.status === 'closed'}>
                          <Plus className="h-6 w-6 text-slate-600" />
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="p-4 relative 2xl:flex-1 2xl:overflow-y-auto">
                    {fboOfflineMode && (
                      <div className="mb-6 overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-xl">
                        <div className="p-5 md:p-6">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <div className="text-[11px] uppercase tracking-[0.25em] text-slate-400">Offline FBO</div>
                              <h3 className="mt-2 text-2xl font-semibold">Локальная оффлайн-сессия на устройстве</h3>
                              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                                Сканы хранятся в IndexedDB, дубли ЧЗ внутри текущей сессии блокируются сразу, а в БД данные уходят только после проверки.
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">IndexedDB</div>
                              <div className="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-400/15 px-3 py-1 text-xs font-medium text-amber-200">Несинхронизировано: {offlineFboUnsyncedStats.sessions} сесс. / {offlineFboUnsyncedStats.items} сканов</div>
                            </div>
                          </div>

                          <div className="mt-5 flex flex-wrap gap-3">
                            <button
                              onClick={validateOfflineFboSession}
                              disabled={offlineFboValidationLoading || offlineFboUploadLoading}
                              className="inline-flex items-center justify-center rounded-2xl bg-sky-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" /> {offlineFboValidationLoading ? 'Проверка...' : 'Проверка'}
                            </button>
                            <button
                              onClick={uploadOfflineFboSessionToDb}
                              disabled={offlineFboUploadLoading || offlineFboValidationLoading}
                              className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Upload className="mr-2 h-4 w-4" /> {offlineFboUploadLoading ? 'Загрузка...' : 'Загрузить в БД'}
                            </button>
                            <button
                              onClick={() => setShowOfflineFboHistory(true)}
                              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15"
                            >
                              <History className="mr-2 h-4 w-4" /> История оффлайн
                            </button>
                          </div>

                          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                              <div className="text-xs text-slate-300">Коробки в текущей сессии</div>
                              <div className="mt-2 text-3xl font-semibold">{offlineFboSession?.boxes?.length || 0}</div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                              <div className="text-xs text-slate-300">Сканы ЧЗ</div>
                              <div className="mt-2 text-3xl font-semibold">{offlineFboSession?.items?.length || 0}</div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                              <div className="text-xs text-slate-300">Старт коробок</div>
                              <div className="mt-2 text-sm font-medium text-white">после {offlineFboSession?.base_box_number || 0}</div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                              <div className="text-xs text-slate-300">Последнее обновление</div>
                              <div className="mt-2 text-sm font-medium text-white">{offlineFboSession?.updated_at ? new Date(offlineFboSession.updated_at).toLocaleString() : 'Нет данных'}</div>
                            </div>
                            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 backdrop-blur">
                              <div className="text-xs text-emerald-200">Защита от дублей</div>
                              <div className="mt-2 text-sm font-medium text-white">Одинаковые ЧЗ в текущей оффлайн-сессии не добавляются повторно</div>
                            </div>
                          </div>

                          <div className="mt-5 grid gap-4 xl:grid-cols-2">
                            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <div className="text-sm font-semibold text-white">Коробки оффлайн-сессии</div>
                                  <div className="text-xs text-slate-300">Быстрый просмотр последних коробок</div>
                                </div>
                                <Box className="h-5 w-5 text-slate-300" />
                              </div>
                              <div className="mt-3 space-y-2">
                                {(offlineFboSession?.boxes || []).length === 0 ? (
                                  <div className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-sm text-slate-400">Пока нет локальных коробок</div>
                                ) : (
                                  (offlineFboSession?.boxes || []).slice(0, 6).map((box) => {
                                    const count = (offlineFboSession?.items || []).filter((item) => item.box_id === box.id).length;
                                    return (
                                      <div key={`offline-box-preview-${box.id}`} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/10 px-3 py-3">
                                        <div>
                                          <div className="font-medium text-white">Коробка {box.name}</div>
                                          <div className="text-xs text-slate-400">{new Date(box.created_at).toLocaleString()}</div>
                                        </div>
                                        <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">{count} сканов</div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <div className="text-sm font-semibold text-white">Последние оффлайн-сканы</div>
                                  <div className="text-xs text-slate-300">Что уже накоплено в текущей сессии</div>
                                </div>
                                <ShieldCheck className="h-5 w-5 text-slate-300" />
                              </div>
                              <div className="mt-3 space-y-2">
                                {(offlineFboSession?.items || []).length === 0 ? (
                                  <div className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-sm text-slate-400">Сканов ещё нет</div>
                                ) : (
                                  (offlineFboSession?.items || []).slice(0, 6).map((item) => {
                                    const boxName = (offlineFboSession?.boxes || []).find((box) => box.id === item.box_id)?.name || 'Без коробки';
                                    return (
                                      <div key={`offline-item-preview-${item.id}`} className="rounded-xl border border-white/10 bg-black/10 px-3 py-3">
                                        <div className="flex items-start justify-between gap-3">
                                          <div>
                                            <div className="font-medium text-white">{item.product?.name || 'Товар без названия'}</div>
                                            <div className="mt-1 text-xs text-slate-400">Коробка {boxName}</div>
                                          </div>
                                          <div className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-slate-200">{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>
                                        <div className="mt-2 break-all font-mono text-[11px] text-amber-200">{item.honest_sign_code}</div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {fboOfflineMode && offlineFboValidation && (
                      <div className={`mb-4 rounded-2xl border p-5 shadow-sm ${offlineFboValidation.ok ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${offlineFboValidation.ok ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                              {offlineFboValidation.ok ? 'Проверка пройдена' : 'Есть проблемы перед синхронизацией'}
                            </div>
                            <div className="mt-3 text-sm text-slate-700">{offlineFboValidation.message}</div>
                          </div>
                          <div className="text-xs text-slate-500">{new Date(offlineFboValidation.checkedAt).toLocaleString()}</div>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                          <div className="rounded-xl bg-white px-4 py-3"><div className="text-xs text-slate-500">Коробки</div><div className="mt-1 text-xl font-semibold text-slate-900">{offlineFboValidation.boxesCount}</div></div>
                          <div className="rounded-xl bg-white px-4 py-3"><div className="text-xs text-slate-500">Сканы</div><div className="mt-1 text-xl font-semibold text-slate-900">{offlineFboValidation.itemsCount}</div></div>
                          <div className="rounded-xl bg-white px-4 py-3"><div className="text-xs text-slate-500">Локальные дубли</div><div className="mt-1 text-xl font-semibold text-slate-900">{offlineFboValidation.duplicateLocal.length}</div></div>
                          <div className="rounded-xl bg-white px-4 py-3"><div className="text-xs text-slate-500">Конфликты с БД</div><div className="mt-1 text-xl font-semibold text-slate-900">{offlineFboValidation.duplicateDb.length}</div></div>
                          <div className="rounded-xl bg-white px-4 py-3"><div className="text-xs text-slate-500">Потерянные товары</div><div className="mt-1 text-xl font-semibold text-slate-900">{offlineFboValidation.missingProducts.length}</div></div>
                        </div>
                        <div className="mt-4 grid gap-3 xl:grid-cols-3">
                          <div className="rounded-xl bg-white px-4 py-4">
                            <div className="text-sm font-semibold text-slate-900 mb-2">Локальные дубли ЧЗ</div>
                            {offlineFboValidation.duplicateLocal.length ? offlineFboValidation.duplicateLocal.slice(0, 10).map((row) => (
                              <div key={`local-${row.code}`} className="mb-2 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{row.code}<div className="mt-1 text-xs text-rose-600">Коробки: {row.boxNames.join(', ')}</div></div>
                            )) : <div className="text-sm text-slate-400">Нет локальных дублей</div>}
                          </div>
                          <div className="rounded-xl bg-white px-4 py-4">
                            <div className="text-sm font-semibold text-slate-900 mb-2">Конфликты с БД</div>
                            {offlineFboValidation.duplicateDb.length ? offlineFboValidation.duplicateDb.slice(0, 10).map((row, index) => (
                              <div key={`db-${row.code}-${index}`} className="mb-2 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{row.code}<div className="mt-1 text-xs text-rose-600">Поставка {row.supplyName} , коробка {row.boxName}</div></div>
                            )) : <div className="text-sm text-slate-400">Конфликтов с базой нет</div>}
                          </div>
                          <div className="rounded-xl bg-white px-4 py-4">
                            <div className="text-sm font-semibold text-slate-900 mb-2">Товары вне базы</div>
                            {offlineFboValidation.missingProducts.length ? offlineFboValidation.missingProducts.slice(0, 10).map((row, index) => (
                              <div key={`missing-${row.label}-${index}`} className="mb-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-700">{row.label}<div className="mt-1 text-xs text-amber-600">Коробка {row.boxName}</div></div>
                            )) : <div className="text-sm text-slate-400">Все товары найдены в базе</div>}
                          </div>
                        </div>
                      </div>
                    )}
                    <h3 className="font-medium text-slate-900 mb-3">Коробки</h3>
                    <div className="space-y-3">
                      {boxesList.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 bg-white rounded-xl border border-slate-100">
                          Нет коробок. Отсканируйте штрихкод, чтобы создать первую.
                        </div>
                      ) : (
                        boxesList.map(box => (
                          <div key={box.id} onClick={() => { setCurrentBox(box); setSupplyStep('BOX'); }} className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:shadow-md transition-shadow group">
                            <div className="flex items-center w-full sm:w-auto">
                              <div className="bg-blue-50 p-2 rounded-lg mr-3">
                                <Box className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{box.name}</div>
                                <div className="text-xs text-slate-500">
                                  {new Date(box.created_at).toLocaleDateString()} • {box.total_items || 0} товаров
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                              <button
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteBox(box.id);
                                  }}
                                  className="p-2 text-slate-400 hover:text-red-600 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                  title="Удалить коробку"
                              >
                                  <Trash2 className="h-5 w-5" />
                              </button>
                              <ChevronRight className="h-5 w-5 text-slate-400" />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {showOfflineFboHistory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setShowOfflineFboHistory(false)}>
                  <div className="w-full max-w-5xl max-h-[85vh] overflow-hidden rounded-[28px] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    <div className="border-b border-slate-100 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-6 py-5 text-white">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="text-[11px] uppercase tracking-[0.25em] text-slate-400">Offline history</div>
                          <h3 className="mt-2 text-2xl font-semibold">История оффлайн-сессий</h3>
                          <p className="mt-2 text-sm text-slate-300">Все несинхронизированные данные, которые сейчас лежат на устройстве.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">Сессий: {offlineFboUnsyncedStats.sessions}</div>
                          <div className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-medium text-amber-200">Сканов: {offlineFboUnsyncedStats.items}</div>
                          <button onClick={() => setShowOfflineFboHistory(false)} className="rounded-full bg-white/10 p-2 text-white/80 hover:bg-white/20 hover:text-white">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="max-h-[calc(85vh-96px)] overflow-y-auto p-6 bg-slate-50">
                      {offlineFboHistoryLoading ? (
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">Загружаю оффлайн-сессии...</div>
                      ) : offlineFboHistorySessions.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">На устройстве пока нет оффлайн-сессий</div>
                      ) : (
                        <div className="grid gap-4 lg:grid-cols-2">
                          {offlineFboHistorySessions.map((session) => (
                            <div key={`offline-history-${session.supply_id}`} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-5 py-4 text-white">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="text-lg font-semibold">{session.supply_name || session.supply_id}</div>
                                    <div className="mt-1 text-xs text-slate-300">Обновлено: {session.updated_at ? new Date(session.updated_at).toLocaleString() : 'нет данных'}</div>
                                  </div>
                                  <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">{session.items?.length || 0} сканов</div>
                                </div>
                              </div>
                              <div className="p-5">
                                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                                  <div className="rounded-2xl bg-slate-50 px-3 py-3"><div className="text-[11px] text-slate-500">Коробки</div><div className="mt-1 text-lg font-semibold text-slate-900">{session.boxes?.length || 0}</div></div>
                                  <div className="rounded-2xl bg-slate-50 px-3 py-3"><div className="text-[11px] text-slate-500">Сканы</div><div className="mt-1 text-lg font-semibold text-slate-900">{session.items?.length || 0}</div></div>
                                  <div className="rounded-2xl bg-slate-50 px-3 py-3"><div className="text-[11px] text-slate-500">Старт коробок</div><div className="mt-1 text-sm font-semibold text-slate-900">после {session.base_box_number || 0}</div></div>
                                  <div className="rounded-2xl bg-slate-50 px-3 py-3"><div className="text-[11px] text-slate-500">Статус</div><div className="mt-1 text-sm font-semibold text-amber-600">Не синхронизировано</div></div>
                                </div>
                                <div className="mt-4 space-y-2">
                                  {(session.items || []).slice(0, 3).map((item) => {
                                    const boxName = (session.boxes || []).find((box) => box.id === item.box_id)?.name || 'Без коробки';
                                    return (
                                      <div key={`offline-history-item-${item.id}`} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
                                        <div className="text-sm font-medium text-slate-900">{item.product?.name || 'Товар без названия'}</div>
                                        <div className="mt-1 text-xs text-slate-500">Коробка {boxName}</div>
                                        <div className="mt-2 break-all font-mono text-[11px] text-slate-600">{item.honest_sign_code}</div>
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="mt-5 flex flex-wrap gap-2">
                                  <button onClick={() => handleOpenOfflineHistorySession(session)} className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                                    <ArrowLeft className="mr-2 h-4 w-4 rotate-180" /> Открыть сессию
                                  </button>
                                  <button onClick={() => handleDeleteOfflineHistorySession(session)} className="inline-flex items-center rounded-xl bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100">
                                    <Trash2 className="mr-2 h-4 w-4" /> Удалить с устройства
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {supplyStep === 'BOX' && currentBox && (
                <div className="max-w-2xl mx-auto">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <div className="flex items-center">
                      <button onClick={() => { finishCurrentBoxAndReturn().catch(() => undefined); }} className="mr-4 text-slate-400 hover:text-slate-600"><ArrowLeft className="h-6 w-6" /></button>
                      <div>
                        <h1 className="text-xl font-bold text-slate-900">Коробка {currentBox.name}</h1>
                        <p className="text-slate-500 text-sm">Сканируйте товары для добавления</p>
                        {fboOfflineMode && <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">Оффлайн • локально на устройстве через IndexedDB</div>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={finishCurrentBoxAndReturn} className="inline-flex items-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 hover:bg-slate-50">
                        <Undo2 className="mr-2 h-4 w-4" /> Завершить коробку
                      </button>
                      <button onClick={() => createNextBoxInCurrentSupply()} className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                        <Plus className="mr-2 h-4 w-4" /> Следующая коробка
                      </button>
                      <button onClick={() => setShowNewBoxQR(true)} className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                        <QrCode className="mr-2 h-4 w-4" /> QR новая коробка
                      </button>
                    </div>
                  </div>

                  <div className="mb-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <div className="text-xs text-slate-500">Текущая коробка</div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">{currentBox.name}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <div className="text-xs text-slate-500">Сканов в коробке</div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">{boxItems.length}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <div className="text-xs text-slate-500">Режим</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">{fboOfflineMode ? 'Оффлайн, можно работать без сети' : 'Онлайн, запись идёт в базу'}</div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-xl p-8 text-center mb-6 border border-blue-100">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <Box className="h-6 w-6 text-indigo-600" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">Сканируйте Товар</h2>
                    <p className="text-indigo-500 text-sm">Ожидание штрихкода (SKU)...</p>
                  </div>

                  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-1 mb-6 ${currentSupply.status === 'closed' ? 'opacity-50 pointer-events-none' : ''}`}>
                    <form onSubmit={handleItemScan} className="flex items-center">
                      <input
                        ref={itemInputRef}
                        type="text"
                        placeholder={currentSupply.status === 'closed' ? "Поставка закрыта" : "Сканируйте штрихкод товара..."}
                        className="flex-1 p-3 outline-none"
                        autoFocus
                        disabled={currentSupply.status === 'closed'}
                      />
                      <button type="submit" className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 m-1" disabled={currentSupply.status === 'closed'}>
                        <Plus className="h-5 w-5 text-slate-600" />
                      </button>
                    </form>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 font-medium text-sm text-slate-700">
                      Содержимое коробки
                    </div>
                    {boxItems.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-sm">
                        Коробка пуста. Сканируйте товары.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {boxItems.map(item => (
                          <div key={item.id} className="p-3 flex items-center justify-between gap-3">
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">
                                {(item.product as any)?.photo_url ? (
                                  <img src={(item.product as any).photo_url} alt={item.product?.name || 'Товар'} className="h-full w-full object-cover" />
                                ) : (
                                  <Package className="h-5 w-5 text-slate-300" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-slate-900 truncate">{item.product?.name || 'Unknown'}</div>
                                <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-slate-600">
                                  {(item.product as any)?.vendor_code && <span className="rounded bg-slate-100 px-2 py-0.5">Арт: {(item.product as any).vendor_code}</span>}
                                  {(item.product as any)?.model_number && <span className="rounded bg-slate-100 px-2 py-0.5">Модель: {(item.product as any).model_number}</span>}
                                  {item.product?.size && <span className="rounded bg-slate-100 px-2 py-0.5">Размер: {item.product.size}</span>}
                                  {item.product?.color && <span className="rounded bg-slate-100 px-2 py-0.5">Цвет: {item.product.color}</span>}
                                </div>
                                <div className="mt-1 text-xs text-slate-500 break-all">{item.honest_sign_code}</div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteSupplyItem(String(item.id || ''))}
                              className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                              title="Удалить скан"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {supplyStep === 'HONEST_SIGN' && scannedItem && (
                <div className="max-w-2xl mx-auto">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <div className="flex items-center">
                      <button onClick={() => { setSupplyStep('BOX'); setScannedItem(null); }} className="mr-4 text-slate-400 hover:text-slate-600"><ArrowLeft className="h-6 w-6" /></button>
                      <div>
                        <h1 className="text-xl font-bold text-slate-900">Коробка {currentBox?.name}</h1>
                        <p className="text-slate-500 text-sm">Сканируйте товары для добавления</p>
                        {fboOfflineMode && <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">Оффлайн • сканы хранятся на устройстве, запись в БД по кнопке</div>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={finishCurrentBoxAndReturn} className="inline-flex items-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 hover:bg-slate-50">
                        <Undo2 className="mr-2 h-4 w-4" /> Завершить коробку
                      </button>
                      <button onClick={() => createNextBoxInCurrentSupply()} className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                        <Plus className="mr-2 h-4 w-4" /> Следующая коробка
                      </button>
                    </div>
                  </div>

                  <div className="bg-yellow-50 rounded-xl p-4 sm:p-6 mb-6 border border-yellow-100">
                    <div className="flex flex-col sm:flex-row gap-4 text-left">
                      {scannedItem.photo_url ? (
                        <div className="w-full sm:w-80 rounded-xl border border-yellow-100 overflow-hidden shrink-0 shadow-sm">
                          <img src={scannedItem.photo_url} alt={scannedItem.name} className="block h-auto w-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-full sm:w-80 aspect-[3/4] rounded-xl border border-yellow-100 bg-white overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                          <Package className="h-10 w-10 text-yellow-300" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-yellow-700 border border-yellow-100">
                          <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Сканируйте Честный Знак
                        </div>
                        <h2 className="mt-3 text-xl font-bold text-slate-900 break-words">{scannedItem.name}</h2>
                        {fboPalletHint && (
	                          <div className="mt-3 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-violet-900">
	                            <div className="text-xs font-semibold uppercase tracking-wide text-violet-600">Куда ставить коробку</div>
	                            <div className="mt-1 text-lg font-bold">Склад: {fboPalletHint.warehouse_name || 'не указан'}</div>
	                            <div className="mt-1 text-lg font-bold">Поставка: {fboPalletHint.supply_name || 'не указана'}{fboPalletHint.supply_date ? ` (${new Date(`${fboPalletHint.supply_date}T12:00:00`).toLocaleDateString('ru-RU')})` : ''}</div>
	                            <div className="mt-1 text-2xl font-black">Паллета №{fboPalletHint.pallet_number}</div>
	                            <div className="mt-1 text-xs text-violet-700">Осталось по плану: {Math.max(0, Number(fboPalletHint.target_qty || 1) - Number(fboPalletHint.scanned_qty || 0))} из {fboPalletHint.target_qty || 1}.</div>
                          </div>
                        )}
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {scannedItem.vendor_code && (
                            <div className="rounded-lg bg-white px-3 py-2 border border-yellow-100">
                              <div className="text-[11px] text-slate-500">Артикул / номер WB</div>
                              <div className="text-sm font-semibold text-slate-900 break-all">{scannedItem.vendor_code}</div>
                            </div>
                          )}
                          {scannedItem.model_number && (
                            <div className="rounded-lg bg-white px-3 py-2 border border-yellow-100">
                              <div className="text-[11px] text-slate-500">Номер модели</div>
                              <div className="text-sm font-semibold text-slate-900 break-all">{scannedItem.model_number}</div>
                            </div>
                          )}
                          <div className="rounded-lg bg-white px-3 py-2 border border-yellow-100">
                            <div className="text-[11px] text-slate-500">Размер</div>
                            <div className="text-sm font-semibold text-slate-900">{scannedItem.size || '-'}</div>
                          </div>
                          <div className="rounded-lg bg-white px-3 py-2 border border-yellow-100">
                            <div className="text-[11px] text-slate-500">Цвет</div>
                            <div className="text-sm font-semibold text-slate-900">{scannedItem.color || '-'}</div>
                          </div>
                        </div>
                        <div className="mt-3 rounded-lg bg-white px-3 py-2 border border-yellow-100">
                          <div className="text-[11px] text-slate-500">ШК товара</div>
                          <div className="font-mono text-xs text-slate-700 break-all">{scannedItem.barcode || '-'}</div>
                        </div>
                        <p className="text-yellow-600 text-sm mt-3">Ожидание Data Matrix кода...</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-yellow-200 p-1 mb-6 ring-4 ring-yellow-50">
                    <form onSubmit={handleHonestSignScan} className="flex items-center">
                      <input
                        ref={honestSignInputRef}
                        type="text"
                        placeholder="Сканируйте Data Matrix..."
                        className="flex-1 p-3 outline-none"
                        autoFocus
                      />
                      <button type="submit" className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 m-1">
                        <Plus className="h-5 w-5 text-slate-600" />
                      </button>
                    </form>
                  </div>
                </div>
              )}


              {fboPalletModalOpen && (
                <div className="fixed inset-0 z-[72] flex items-end justify-center bg-slate-900/50 backdrop-blur-sm p-2 md:items-center md:p-4" onClick={() => setFboPalletModalOpen(false)}>
                  <div className="max-h-[94svh] w-full max-w-6xl overflow-y-auto rounded-t-3xl bg-slate-50 shadow-2xl md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
                    <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur md:px-6">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                            <Box className="h-4 w-4" /> FBO паллеты
                          </div>
                          <h3 className="mt-2 text-xl font-bold text-slate-900">Собрать паллеты</h3>
                          <p className="mt-1 text-sm text-slate-500">Добавьте товары поставщика в паллеты, чтобы при сканировании коробки видеть нужную паллету.</p>
                        </div>
	                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
	                          <button type="button" onClick={handleAddFboPallet} disabled={!fboPalletSupplierId || !fboPalletSelectedWarehouseId || !fboPalletSelectedSupplyId || fboPalletLoading} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50">Добавить паллету</button>
                          <button type="button" onClick={() => { setFboPalletHistoryOpen(true); fetchFboPalletData(fboPalletSupplierId); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">История паллет</button>
                          <button type="button" onClick={() => setFboPalletModalOpen(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Закрыть</button>
                        </div>
                      </div>
	                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                        <Select
                          value={fboPalletSupplierId}
                          onChange={(e) => handleChangeFboPalletSupplier(e.target.value)}
                          className="oc-select"
                        >
                          <option value="">Выберите поставщика...</option>
                          {suppliers.map((supplier) => <option key={'fbo-pallet-supplier-' + supplier.id} value={supplier.id}>{supplier.name}</option>)}
                        </Select>
                        <button type="button" onClick={() => fetchFboPalletData(fboPalletSupplierId)} disabled={!fboPalletSupplierId || fboPalletLoading} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                          {fboPalletLoading ? 'Загрузка...' : 'Обновить'}
	                        </button>
	                      </div>
	                      {fboPalletSupplierId && (
	                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
	                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Склад поставки</div>
	                          <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
	                            <input
	                              value={fboPalletWarehouseName}
	                              onChange={(e) => setFboPalletWarehouseName(e.target.value)}
	                              placeholder="Напишите название склада..."
	                              className="oc-input"
	                            />
	                            <button type="button" onClick={handleAddFboPalletWarehouse} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Добавить склад</button>
	                          </div>
	                          <div className="mt-3 flex flex-wrap gap-2">
	                            {fboPalletWarehouses.length === 0 ? (
	                              <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">Складов пока нет. Создайте склад поставки, чтобы внутри него собирать паллеты.</div>
	                            ) : fboPalletWarehouses.map((warehouse) => {
	                              const selected = String(fboPalletSelectedWarehouseId) === String(warehouse.id);
	                              return (
	                                <div
	                                  key={'fbo-pallet-warehouse-' + warehouse.id}
	                                  className={'inline-flex items-center gap-1 rounded-xl border text-sm font-semibold ' + (selected ? 'border-violet-600 bg-violet-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-violet-200 hover:bg-violet-50')}
	                                >
	                                  <button
	                                    type="button"
	                                    onClick={() => selectFboPalletWarehouse(warehouse.id)}
	                                    className="py-2 pl-4 pr-1"
	                                  >
	                                    {warehouse.name}
	                                  </button>
	                                  <button
	                                    type="button"
	                                    onClick={() => openFboPalletWarehouseEdit(warehouse)}
	                                    title="Переименовать склад"
	                                    className={'rounded-lg p-1 transition-colors ' + (selected ? 'text-white/80 hover:bg-white/20 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700')}
	                                  >
	                                    <Pencil className="h-4 w-4" />
	                                  </button>
	                                  <button
	                                    type="button"
	                                    onClick={() => handleDeleteFboPalletWarehouse(warehouse.id)}
	                                    title="Удалить склад"
	                                    className={'mr-1.5 rounded-lg p-1 transition-colors ' + (selected ? 'text-white/80 hover:bg-white/20 hover:text-white' : 'text-slate-400 hover:bg-rose-50 hover:text-rose-600')}
	                                  >
	                                    <Trash2 className="h-4 w-4" />
	                                  </button>
	                                </div>
	                              );
	                            })}
	                          </div>
	                        </div>
	                      )}
	                      {fboPalletSupplierId && fboPalletSelectedWarehouseId && (
	                        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
	                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Поставка</div>
	                          <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_auto_auto]">
	                            <input
	                              value={fboPalletSupplyName}
	                              onChange={(e) => setFboPalletSupplyName(e.target.value)}
	                              placeholder="Напишите название поставки..."
	                              className="oc-input"
	                            />
	                            <input
	                              type="date"
	                              value={fboPalletSupplyDate}
	                              onChange={(e) => setFboPalletSupplyDate(e.target.value)}
	                              title="Дата поставки (необязательно)"
	                              className="oc-input"
	                            />
	                            <button type="button" onClick={handleAddFboPalletSupply} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Добавить поставку</button>
	                          </div>
	                          <div className="mt-3 flex flex-wrap gap-2">
	                            {fboPalletSupplies.filter((supply) => String(supply.warehouse_id) === String(fboPalletSelectedWarehouseId)).length === 0 ? (
	                              <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">Поставок в этом складе пока нет. Создайте поставку, чтобы внутри неё собирать паллеты.</div>
	                            ) : fboPalletSupplies.filter((supply) => String(supply.warehouse_id) === String(fboPalletSelectedWarehouseId)).map((supply) => {
	                              const selected = String(fboPalletSelectedSupplyId) === String(supply.id);
	                              return (
	                                <div
	                                  key={'fbo-pallet-supply-' + supply.id}
	                                  className={'inline-flex items-center gap-1 rounded-xl border text-sm font-semibold ' + (selected ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50')}
	                                >
	                                  <button
	                                    type="button"
	                                    onClick={() => setFboPalletSelectedSupplyId(supply.id)}
	                                    className="py-2 pl-4 pr-1"
	                                  >
	                                    {supply.name}
	                                  </button>
	                                  <button
	                                    type="button"
	                                    onClick={() => openFboPalletSupplyEdit(supply)}
	                                    title="Редактировать поставку"
	                                    className={'rounded-lg p-1 transition-colors ' + (selected ? 'text-white/80 hover:bg-white/20 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700')}
	                                  >
	                                    <Pencil className="h-4 w-4" />
	                                  </button>
	                                  <button
	                                    type="button"
	                                    onClick={() => handleDeleteFboPalletSupply(supply.id)}
	                                    title="Удалить поставку"
	                                    className={'mr-1.5 rounded-lg p-1 transition-colors ' + (selected ? 'text-white/80 hover:bg-white/20 hover:text-white' : 'text-slate-400 hover:bg-rose-50 hover:text-rose-600')}
	                                  >
	                                    <Trash2 className="h-4 w-4" />
	                                  </button>
	                                </div>
	                              );
	                            })}
	                          </div>
	                        </div>
	                      )}
	                    </div>

                    <div className="p-4 md:p-6">
                      {!fboPalletSupplierId ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">Выберите поставщика, чтобы собрать паллеты.</div>
                      ) : (
                        <div className="space-y-4">
	                          {!fboPalletSelectedWarehouseId ? (
	                            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">Выберите или создайте склад поставки.</div>
	                          ) : !fboPalletSelectedSupplyId ? (
	                            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">Выберите или создайте поставку, чтобы собирать в ней паллеты.</div>
	                          ) : fboPallets.filter((p) => String(p.supply_id || '') === String(fboPalletSelectedSupplyId) && fboPalletSessions.some((s) => s.id === p.session_id && s.status === 'active')).length === 0 ? (
	                            <div className="rounded-2xl border border-dashed border-violet-200 bg-white p-8 text-center">
	                              <div className="text-slate-600">Паллет в этой поставке пока нет.</div>
	                              <button type="button" onClick={handleAddFboPallet} className="mt-4 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700">Добавить паллету</button>
	                            </div>
	                          ) : (
	                            <>
	                              {(() => {
	                                const sup = fboPalletSupplies.find((s) => String(s.id) === String(fboPalletSelectedSupplyId));
	                                const wh = fboPalletWarehouses.find((w) => String(w.id) === String(fboPalletSelectedWarehouseId));
	                                return (
	                                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
	                                    <div>
	                                      <div className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Поставка</div>
	                                      <div className="text-lg font-bold text-emerald-900">{sup?.name || '—'}{wh?.name ? ` · ${wh.name}` : ''}</div>
	                                    </div>
	                                    <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 text-sm font-semibold text-emerald-800 shadow-sm">
	                                      <Clock className="h-4 w-4 text-emerald-500" />
	                                      {sup?.date ? new Date(`${sup.date}T12:00:00`).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Дата не указана'}
	                                    </div>
	                                  </div>
	                                );
	                              })()}
	                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
	                              {fboPallets
	                                .filter((p) => String(p.supply_id || '') === String(fboPalletSelectedSupplyId) && fboPalletSessions.some((s) => s.id === p.session_id && s.status === 'active'))
                                .map((pallet) => {
                                  const items = fboPalletItems.filter((item) => String(item.pallet_id) === String(pallet.id));
                                  return (
                                    <div key={'fbo-pallet-' + pallet.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
	                                      <div className="flex items-start justify-between gap-3">
	                                        <div>
	                                          <div className="mb-2 flex flex-wrap gap-1">
	                                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{fboPalletWarehouses.find((warehouse) => String(warehouse.id) === String(pallet.warehouse_id || ''))?.name || 'Склад не указан'}</span>
	                                            <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">{fboPalletSupplies.find((supply) => String(supply.id) === String(pallet.supply_id || ''))?.name || 'Поставка не указана'}</span>
	                                          </div>
	                                          <div className="text-xs font-semibold uppercase tracking-wide text-violet-600">Паллета</div>
                                          <div className="mt-1 text-3xl font-black text-slate-900">№{pallet.pallet_number}</div>
	                                          <div className="mt-1 text-xs text-slate-500">Товаров: {items.reduce((sum, item) => sum + Math.max(1, Number(item.qty || 1)), 0)}</div>
                                        </div>
                                        <div className="flex gap-2">
	                                          <button type="button" onClick={() => openFboPalletProductPicker(pallet.id)} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">Добавить товары</button>
                                          <button type="button" onClick={() => handleDeleteFboPallet(pallet.id)} className="rounded-xl border border-rose-200 px-3 py-2 text-rose-600 hover:bg-rose-50" title="Удалить паллету"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                      </div>
                                      <div className="mt-4 space-y-2">
                                        {items.length === 0 ? (
                                          <div className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-400">В паллете пока нет товаров.</div>
                                        ) : items.map((item) => (
                                          <div key={'fbo-pallet-item-' + item.id} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-2">
                                            <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg border bg-white">
                                              {item.photo_url ? <img src={item.photo_url} alt={item.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Package className="h-5 w-5 text-slate-300" /></div>}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <div className="line-clamp-2 text-sm font-semibold text-slate-900">{item.title}</div>
                                              <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-slate-500">
                                                {item.vendor_code && <span className="rounded bg-white px-1.5 py-0.5">Арт: {item.vendor_code}</span>}
                                                {item.size && <span className="rounded bg-white px-1.5 py-0.5">Размер: {item.size}</span>}
	                                                {item.color && <span className="rounded bg-white px-1.5 py-0.5">Цвет: {item.color}</span>}
	                                                {item.barcode && <span className="rounded bg-white px-1.5 py-0.5">ШК: {item.barcode}</span>}
	                                                <span className="rounded bg-violet-100 px-1.5 py-0.5 font-semibold text-violet-700">Кол-во: {Math.max(1, Number(item.qty || 1))}</span>
	                                              </div>
                                            </div>
                                            <button type="button" onClick={() => openFboPalletItemQtyEdit(item)} className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700" title="Изменить количество"><Pencil className="mx-auto h-4 w-4" /></button>
                                            <button type="button" onClick={() => handleDeleteFboPalletItem(item.id)} className="h-10 w-10 shrink-0 rounded-lg border border-rose-100 text-rose-600 hover:bg-rose-50" title="Удалить товар"><Trash2 className="mx-auto h-4 w-4" /></button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

	              {fboPalletWarehouseEdit && (
	                <div className="fixed inset-0 z-[76] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={() => setFboPalletWarehouseEdit(null)}>
	                  <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5" onClick={(e) => e.stopPropagation()}>
	                    <div className="flex items-center gap-3 bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 text-white">
	                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20"><Box className="h-5 w-5" /></div>
	                      <div>
	                        <div className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Склад</div>
	                        <h3 className="text-lg font-bold leading-tight">Переименовать склад</h3>
	                      </div>
	                    </div>
	                    <div className="p-6">
	                      <label className="block text-sm font-semibold text-slate-700">Название склада</label>
	                      <input
	                        value={fboPalletWarehouseEdit.name}
	                        onChange={(e) => setFboPalletWarehouseEdit((prev) => prev ? { ...prev, name: e.target.value } : prev)}
	                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveFboPalletWarehouseEdit(); }}
	                        placeholder="Например: Коледино"
	                        className="oc-input mt-2 w-full"
	                        autoFocus
	                      />
	                      <div className="mt-6 flex justify-end gap-2">
	                        <button type="button" onClick={() => setFboPalletWarehouseEdit(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Отмена</button>
	                        <button type="button" onClick={handleSaveFboPalletWarehouseEdit} className="rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700">Сохранить</button>
	                      </div>
	                    </div>
	                  </div>
	                </div>
	              )}

	              {fboPalletSupplyEdit && (
	                <div className="fixed inset-0 z-[76] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={() => setFboPalletSupplyEdit(null)}>
	                  <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5" onClick={(e) => e.stopPropagation()}>
	                    <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white">
	                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20"><Package className="h-5 w-5" /></div>
	                      <div>
	                        <div className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Поставка</div>
	                        <h3 className="text-lg font-bold leading-tight">Редактировать поставку</h3>
	                      </div>
	                    </div>
	                    <div className="p-6">
	                      <label className="block text-sm font-semibold text-slate-700">Название поставки</label>
	                      <input
	                        value={fboPalletSupplyEdit.name}
	                        onChange={(e) => setFboPalletSupplyEdit((prev) => prev ? { ...prev, name: e.target.value } : prev)}
	                        placeholder="Название поставки"
	                        className="oc-input mt-2 w-full"
	                        autoFocus
	                      />
	                      <label className="mt-4 block text-sm font-semibold text-slate-700">Дата поставки <span className="font-normal text-slate-400">(необязательно)</span></label>
	                      <div className="mt-2 flex gap-2">
	                        <input
	                          type="date"
	                          value={fboPalletSupplyEdit.date}
	                          onChange={(e) => setFboPalletSupplyEdit((prev) => prev ? { ...prev, date: e.target.value } : prev)}
	                          className="oc-input w-full"
	                        />
	                        {fboPalletSupplyEdit.date && (
	                          <button type="button" onClick={() => setFboPalletSupplyEdit((prev) => prev ? { ...prev, date: '' } : prev)} className="shrink-0 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">Очистить</button>
	                        )}
	                      </div>
	                      <div className="mt-6 flex justify-end gap-2">
	                        <button type="button" onClick={() => setFboPalletSupplyEdit(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Отмена</button>
	                        <button type="button" onClick={handleSaveFboPalletSupplyEdit} className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">Сохранить</button>
	                      </div>
	                    </div>
	                  </div>
	                </div>
	              )}

	              {fboPalletItemQtyEdit && (
	                <div className="fixed inset-0 z-[76] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={() => setFboPalletItemQtyEdit(null)}>
	                  <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5" onClick={(e) => e.stopPropagation()}>
	                    <div className="flex items-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 text-white">
	                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20"><Box className="h-5 w-5" /></div>
	                      <div>
	                        <div className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Количество</div>
	                        <h3 className="text-lg font-bold leading-tight">Изменить количество</h3>
	                      </div>
	                    </div>
	                    <div className="p-6">
	                      <div className="line-clamp-2 text-sm font-medium text-slate-500">{fboPalletItemQtyEdit.title}</div>
	                      <div className="mt-4 flex items-center justify-center gap-3">
	                        <button type="button" onClick={() => setFboPalletItemQtyEdit((prev) => prev ? { ...prev, qty: String(Math.max(1, Math.floor(Number(prev.qty) || 1) - 1)) } : prev)} className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 text-xl font-bold text-slate-600 hover:bg-slate-50">−</button>
	                        <input
	                          type="number"
	                          min={1}
	                          value={fboPalletItemQtyEdit.qty}
	                          onChange={(e) => setFboPalletItemQtyEdit((prev) => prev ? { ...prev, qty: e.target.value } : prev)}
	                          onKeyDown={(e) => { if (e.key === 'Enter') handleSaveFboPalletItemQtyEdit(); }}
	                          className="h-12 w-24 rounded-2xl border border-slate-200 text-center text-2xl font-black text-slate-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
	                          autoFocus
	                        />
	                        <button type="button" onClick={() => setFboPalletItemQtyEdit((prev) => prev ? { ...prev, qty: String(Math.max(1, Math.floor(Number(prev.qty) || 1) + 1)) } : prev)} className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 text-xl font-bold text-slate-600 hover:bg-slate-50">+</button>
	                      </div>
	                      <div className="mt-6 flex justify-end gap-2">
	                        <button type="button" onClick={() => setFboPalletItemQtyEdit(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Отмена</button>
	                        <button type="button" onClick={handleSaveFboPalletItemQtyEdit} className="rounded-xl bg-amber-500 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-600">Сохранить</button>
	                      </div>
	                    </div>
	                  </div>
	                </div>
	              )}

	              {fboPalletProductPicker.open && (
	                <div className="fixed inset-0 z-[74] flex items-end justify-center bg-slate-900/50 backdrop-blur-sm p-2 md:items-center md:p-4" onClick={closeFboPalletProductPicker}>
	                  <div className="max-h-[94svh] w-full max-w-6xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
	                    <div className="sticky top-0 z-10 border-b bg-white/95 px-4 py-4 backdrop-blur">
	                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
	                        <div>
	                          <h3 className="text-xl font-bold text-slate-900">Добавить товары в паллету</h3>
	                          <div className="text-sm text-slate-500">Отметьте нужные товары и укажите количество для паллеты.</div>
	                        </div>
	                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
	                          <button type="button" onClick={handleAddSelectedProductsToFboPallet} disabled={Object.keys(fboPalletSelectedProducts).length === 0} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50">
	                            Добавить выбранные ({Object.keys(fboPalletSelectedProducts).length})
	                          </button>
	                          <button type="button" onClick={closeFboPalletProductPicker} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Закрыть</button>
	                        </div>
	                      </div>
                      <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-4">
                        <div className="relative md:col-span-2">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input value={fboPalletProductSearch} onChange={(e) => setFboPalletProductSearch(e.target.value)} placeholder="Поиск по названию, артикулу, ШК или WB..." className="oc-input pl-9" />
                        </div>
                        <SearchSelect value={fboPalletBrandFilter} onChange={setFboPalletBrandFilter} emptyLabel="Все бренды" options={fboPalletBrands.map((brand) => ({ value: brand, label: brand }))} ariaLabel="Бренд" />
                        <SearchSelect value={fboPalletCategoryFilter} onChange={setFboPalletCategoryFilter} emptyLabel="Все категории" options={fboPalletCategories.map((category) => ({ value: category, label: category }))} ariaLabel="Категория" />
                      </div>
                    </div>
                    <div className="p-4">
                      {fboPalletProductsLoading ? (
                        <div className="p-10 text-center text-slate-500">Загрузка товаров...</div>
                      ) : filteredFboPalletProducts.length === 0 ? (
                        <div className="p-10 text-center text-slate-500">Товары не найдены. Нажмите «Обновить» в «Товары WB».</div>
	                      ) : (
	                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
	                          {filteredFboPalletProducts.slice(0, 600).map((product) => {
	                            const selectedQty = fboPalletSelectedProducts[product.key] || 0;
	                            const selected = selectedQty > 0;
	                            return (
	                              <div key={'fbo-pallet-product-' + product.key} className={'flex min-h-[150px] gap-3 rounded-2xl border bg-white p-3 text-left transition-colors ' + (selected ? 'border-violet-400 bg-violet-50' : 'border-slate-200 hover:border-violet-300')}>
	                                <label className="flex shrink-0 items-start pt-1">
	                                  <input
	                                    type="checkbox"
	                                    checked={selected}
	                                    onChange={(e) => toggleFboPalletSelectedProduct(product.key, e.target.checked)}
	                                    className="h-5 w-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
	                                  />
	                                </label>
	                                <div className="h-24 w-16 shrink-0 overflow-hidden rounded-xl border bg-slate-50">
	                                  {product.photo_url ? <img src={product.photo_url} alt={product.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Package className="h-6 w-6 text-slate-300" /></div>}
	                                </div>
	                                <div className="min-w-0 flex-1">
	                                  <div className="line-clamp-2 text-sm font-semibold text-slate-900">{product.title}</div>
	                                  <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-slate-500">
	                                    {product.vendor_code && <span className="rounded bg-slate-100 px-1.5 py-0.5">Арт: {product.vendor_code}</span>}
	                                    {product.nm_id && <span className="rounded bg-slate-100 px-1.5 py-0.5">WB: {product.nm_id}</span>}
	                                    {product.size && <span className="rounded bg-slate-100 px-1.5 py-0.5">Размер: {product.size}</span>}
	                                    {product.color && <span className="rounded bg-slate-100 px-1.5 py-0.5">Цвет: {product.color}</span>}
	                                  </div>
	                                  <div className="mt-2 break-all font-mono text-[11px] text-slate-500">{product.barcode || '-'}</div>
	                                  <label className="mt-3 flex max-w-[150px] items-center gap-2 text-xs font-semibold text-slate-600">
	                                    Кол-во
	                                    <input
	                                      type="number"
	                                      min={1}
	                                      max={999}
	                                      value={selectedQty || 1}
	                                      disabled={!selected}
	                                      onChange={(e) => setFboPalletSelectedProductQty(product.key, Number(e.target.value))}
	                                      onFocus={() => toggleFboPalletSelectedProduct(product.key, true)}
	                                      className="h-10 w-20 rounded-lg border border-slate-200 bg-white px-2 text-sm font-semibold text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
	                                    />
	                                  </label>
	                                </div>
	                              </div>
	                            );
	                          })}
	                        </div>
	                      )}
                    </div>
                  </div>
                </div>
              )}

              {fboPalletHistoryOpen && (
                <div className="fixed inset-0 z-[73] flex items-end justify-center bg-slate-900/50 backdrop-blur-sm p-2 md:items-center md:p-4" onClick={() => setFboPalletHistoryOpen(false)}>
                  <div className="max-h-[94svh] w-full max-w-5xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
                    <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-white/95 px-4 py-4 backdrop-blur">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">История паллет</h3>
                        <div className="text-sm text-slate-500">Все активные сборки и паллеты выбранного поставщика.</div>
                      </div>
                      <button type="button" onClick={() => setFboPalletHistoryOpen(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Закрыть</button>
                    </div>
                    <div className="space-y-3 p-4">
                      {fboPalletSessions.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">История паллет пока пустая.</div>
                      ) : fboPalletSessions.map((session) => {
                        const sessionPallets = fboPallets.filter((p) => String(p.session_id) === String(session.id));
                        return (
                          <div key={'fbo-pallet-session-' + session.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="font-semibold text-slate-900">{new Date(session.created_at).toLocaleString('ru-RU')}</div>
                              <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">{session.status === 'active' ? 'Активная' : 'Закрытая'}</div>
                            </div>
                            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
	                              {sessionPallets.map((pallet) => {
	                                const items = fboPalletItems.filter((item) => String(item.pallet_id) === String(pallet.id));
	                                const warehouse = fboPalletWarehouses.find((row) => String(row.id) === String(pallet.warehouse_id || ''));
	                                const supply = fboPalletSupplies.find((row) => String(row.id) === String(pallet.supply_id || ''));
	                                return (
	                                  <div key={'fbo-pallet-history-' + pallet.id} className="rounded-xl border bg-white p-3">
	                                    <div className="mb-1 text-xs font-semibold text-slate-500">{warehouse?.name || 'Склад не указан'} • {supply?.name || 'Поставка не указана'}</div>
	                                    <div className="font-bold text-violet-800">Паллета №{pallet.pallet_number}</div>
                                    <div className="mt-1 text-xs text-slate-500">Товаров: {items.length}</div>
                                    <div className="mt-2 space-y-1">
                                      {items.slice(0, 6).map((item) => <div key={'fbo-pallet-history-item-' + item.id} className="truncate text-sm text-slate-700">{item.title}{item.size ? ' • ' + item.size : ''}</div>)}
                                      {items.length > 6 && <div className="text-xs text-slate-400">+ ещё {items.length - 6}</div>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* QR Modal */}
              {showSupplyProductsModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowSupplyProductsModal(false)}>
                  <div className="bg-white rounded-3xl ring-1 ring-black/5 shadow-2xl w-[95vw] max-w-5xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-sky-600 to-cyan-600 px-6 py-5 text-white">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/20"><Package className="h-5 w-5" /></div>
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-bold leading-tight">Товары в поставке</h3>
                          <div className="truncate text-sm text-white/80">{currentSupply?.name || ''}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={refreshSupplyProductsPhotos} disabled={supplyProductsPhotoLoading || supplyProductsLoading} className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/25 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${supplyProductsPhotoLoading ? 'animate-spin' : ''}`} />{supplyProductsPhotoLoading ? 'Обновляю...' : 'Обновить фото'}</button>
                        <button onClick={() => setShowSupplyProductsModal(false)} className="rounded-xl p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white"><X className="h-5 w-5" /></button>
                      </div>
                    </div>
                    <div className="p-4 overflow-auto">
                      {supplyProductsLoading ? (
                        <div className="text-slate-500">Загрузка...</div>
                      ) : !supplyProductsRows.length ? (
                        <div className="text-slate-500">Товары в поставке не найдены.</div>
                      ) : (
                        <div className="space-y-3">
                          {supplyProductsRows.map((row) => (
                            <div key={row.key} className="border rounded-xl p-3 flex gap-4 items-start">
                              <div className="w-48 h-48 rounded-lg border bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
                                {row.image ? <img src={row.image} alt={row.title} className="w-full h-full object-cover" /> : <div className="text-xs text-slate-400">Нет фото</div>}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-slate-900">{row.article}</div>
                                <div className="text-sm text-slate-700 break-words">{row.title}</div>
                                <div className="text-sm text-slate-500 mt-1">{row.sizesText}</div>
                                <div className="mt-2 space-y-1">
                                  {row.sizeBarcodeLines.map((line, index) => (
                                    <div key={`${row.key}-size-barcode-${index}`} className="text-xs text-slate-600 break-all bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5">
                                      {line}
                                    </div>
                                  ))}
                                </div>
                                <div className="text-sm font-medium text-sky-700 mt-2">Всего: {row.totalQty}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {supplySyncOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setSupplySyncOpen(false)}>
                  <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 text-white">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20"><RefreshCw className="h-5 w-5" /></div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-lg font-bold leading-tight">Синхронизировать коробки</h3>
                      </div>
                      <button onClick={() => setSupplySyncOpen(false)} className="rounded-xl p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white"><X className="h-5 w-5" /></button>
                    </div>
                    <div className="p-6">
                    <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-sm leading-relaxed text-amber-700">Загрузите Excel файл как в разделе «Коробки (FBO)». Номера коробок в текущей поставке будут заменены по порядку на реальные коды из файла.</p>
                    <label className="group mb-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center transition-colors hover:border-amber-300 hover:bg-amber-50">
                      <FileSpreadsheet className="h-7 w-7 text-slate-400 group-hover:text-amber-500" />
                      <span className="text-sm font-medium text-slate-700">{supplySyncExcelFile ? supplySyncExcelFile.name : 'Нажмите, чтобы выбрать Excel файл'}</span>
                      <span className="text-[11px] text-slate-400">.xlsx или .xls</span>
                      <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => setSupplySyncExcelFile(e.target.files?.[0] || null)} />
                    </label>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setSupplySyncOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Закрыть</button>
                      <button onClick={handleSyncSupplyBoxesFromExcel} disabled={!supplySyncExcelFile || supplySyncLoading} className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50">
                        {supplySyncLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}{supplySyncLoading ? 'Синхронизация...' : 'Синхронизировать'}
                      </button>
                    </div>
                    </div>
                  </div>
                </div>
              )}

              {showGenerateBoxQR && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowGenerateBoxQR(false)}>
                  <div className="overflow-hidden rounded-3xl bg-white text-center shadow-2xl ring-1 ring-black/5" onClick={e => e.stopPropagation()}>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      if (modalScanInput.trim() === 'ACTION:GENERATE_BOX' || modalScanInput.includes('GENERATE_BOX')) {
                        setShowGenerateBoxQR(false);
                        setModalScanInput('');
                        await createNextBoxInCurrentSupply();
                      }
                    }}>
                      <input
                        autoFocus
                        value={modalScanInput}
                        onChange={e => setModalScanInput(e.target.value)}
                        className="opacity-0 absolute top-0 left-0 h-0 w-0"
                        onBlur={e => setTimeout(() => e.target.focus(), 10)}
                      />
                    </form>
                    <div className="flex items-center gap-3 bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5 text-left text-white">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20"><QrCode className="h-5 w-5" /></div>
                      <h3 className="flex-1 text-lg font-bold leading-tight">QR генерация коробки</h3>
                      <button type="button" onClick={() => setShowGenerateBoxQR(false)} className="rounded-xl p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white"><X className="h-5 w-5" /></button>
                    </div>
                    <div className="p-8 pt-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 inline-block" id="generate-box-qr">
                      <QRCodeSVG value="ACTION:GENERATE_BOX" size={200} />
                    </div>
                    <p className="text-slate-500 mt-4 text-sm">Отсканируйте этот код, чтобы<br/>создать новую коробку по порядку в текущей поставке</p>
                    <div className="flex justify-center gap-3 mt-6">
                      <button onClick={() => {
                        const win = window.open();
                        if (win) {
                          const svg = document.getElementById('generate-box-qr')?.innerHTML;
                          win.document.write(`
                            <html>
                              <head>
                                <style>
                                  @page { size: 58mm 40mm; margin: 0; }
                                  body { width: 58mm; height: 40mm; margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: sans-serif; overflow: hidden; }
                                  .qr-container { width: 28mm; height: 28mm; display: flex; align-items: center; justify-content: center; }
                                  .qr-container svg { width: 100% !important; height: 100% !important; }
                                  .label { font-size: 10px; font-weight: bold; margin-top: 2px; text-align: center; white-space: nowrap; }
                                </style>
                              </head>
                              <body>
                                <div class="qr-container">${svg}</div>
                                <div class="label">QR генерация коробки</div>
                                <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
                              </body>
                            </html>
                          `);
                          win.document.close();
                        }
                      }} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.98]">
                        <Printer className="h-4 w-4" /> Печать
                      </button>
                      <button onClick={() => setShowGenerateBoxQR(false)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Закрыть</button>
                    </div>
                    </div>
                  </div>
                </div>
              )}

              {showNameSequencePrintModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => !nameSequencePrintLoading && setShowNameSequencePrintModal(false)}>
                  <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-3 bg-gradient-to-r from-fuchsia-600 to-pink-600 px-6 py-5 text-white">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/20"><Printer className="h-5 w-5" /></div>
                      <h3 className="flex-1 text-lg font-bold leading-tight">Печать этикеток 58×40</h3>
                      <button onClick={() => !nameSequencePrintLoading && setShowNameSequencePrintModal(false)} className="rounded-xl p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="p-6">
                    <p className="mb-4 rounded-xl bg-fuchsia-50 px-3 py-2 text-sm text-fuchsia-700">Сверху будет номер по порядку, внизу имя. Если введёшь 100, создастся 100 этикеток: 1, 2, 3 и так далее.</p>

                    <div className="space-y-4">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Имя</label>
                        <input
                          autoFocus
                          type="text"
                          value={nameSequencePrintForm.name}
                          onChange={(e) => setNameSequencePrintForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-200"
                          placeholder="Введите имя"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Количество</label>
                        <QtyField
                         
                          min={1}
                          max={500}
                          value={nameSequencePrintForm.quantity}
                          onChange={(e) => setNameSequencePrintForm(prev => ({ ...prev, quantity: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-200"
                          placeholder="1"
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                      <button onClick={() => setShowNameSequencePrintModal(false)} disabled={nameSequencePrintLoading} className="rounded-xl bg-slate-100 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50">Отмена</button>
                      <button onClick={handlePrintNameSequenceLabels} disabled={nameSequencePrintLoading} className="inline-flex items-center gap-1.5 rounded-xl bg-fuchsia-600 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-fuchsia-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
                        {nameSequencePrintLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}{nameSequencePrintLoading ? 'Генерация...' : 'Печать'}
                      </button>
                    </div>
                    </div>
                  </div>
                </div>
              )}

              {showNewBoxQR && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowNewBoxQR(false)}>
                  <div className="overflow-hidden rounded-3xl bg-white text-center shadow-2xl ring-1 ring-black/5" onClick={e => e.stopPropagation()}>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (modalScanInput.trim() === 'ACTION:NEW_BOX' || modalScanInput.includes('NEW_BOX')) {
                        setShowNewBoxQR(false);
                        setModalScanInput('');
                        finishCurrentBoxAndReturn();
                      }
                    }}>
                      <input
                        autoFocus
                        value={modalScanInput}
                        onChange={e => setModalScanInput(e.target.value)}
                        className="opacity-0 absolute top-0 left-0 h-0 w-0"
                        onBlur={e => setTimeout(() => e.target.focus(), 10)}
                      />
                    </form>
                    <div className="flex items-center gap-3 bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5 text-left text-white">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20"><QrCode className="h-5 w-5" /></div>
                      <h3 className="flex-1 text-lg font-bold leading-tight">QR для новой коробки</h3>
                      <button type="button" onClick={() => setShowNewBoxQR(false)} className="rounded-xl p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white"><X className="h-5 w-5" /></button>
                    </div>
                    <div className="p-8 pt-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 inline-block" id="new-box-qr">
                      <QRCodeSVG value="ACTION:NEW_BOX" size={200} />
                    </div>
                    <p className="text-slate-500 mt-4 text-sm">Отсканируйте этот код, чтобы<br/>завершить текущую коробку</p>
                    <div className="flex justify-center gap-3 mt-6">
                      <button onClick={() => {
                        const win = window.open();
                        if (win) {
                          const svg = document.getElementById('new-box-qr')?.innerHTML;
                          win.document.write(`
                            <html>
                              <head>
                                <style>
                                  @page { size: 58mm 40mm; margin: 0; }
                                  body {
                                    width: 58mm;
                                    height: 40mm;
                                    margin: 0;
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    justify-content: center;
                                    font-family: sans-serif;
                                    overflow: hidden;
                                  }
                                  .qr-container {
                                    width: 28mm;
                                    height: 28mm;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                  }
                                  .qr-container svg {
                                    width: 100% !important;
                                    height: 100% !important;
                                  }
                                  .label {
                                    font-size: 12px;
                                    font-weight: bold;
                                    margin-top: 2px;
                                    text-align: center;
                                    white-space: nowrap;
                                  }
                                </style>
                              </head>
                              <body>
                                <div class="qr-container">${svg}</div>
                                <div class="label">QR Новая коробка</div>
                                <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
                              </body>
                            </html>
                          `);
                          win.document.close();
                        }
                      }} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.98]">
                        <Printer className="h-4 w-4" /> Печать
                      </button>
                      <button onClick={() => setShowNewBoxQR(false)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Закрыть</button>
                    </div>
                    </div>
                  </div>
                </div>
              )}
            </>
  );
}
