import React from 'react';

type Props = {
  warehouseFill: any;
  setWarehouseFill: (updater: any) => void;
  warehouseEditTarget: any;
  setWarehouseEditTarget: (value: any) => void;
  allWarehouseRacks: string[];
  selectedRackShelves: string[];
  handleFillRack: () => void;
  warehouseFileInputRef: React.RefObject<HTMLInputElement | null>;
  handleDownloadWarehouseTemplate: () => void;
  warehouseSearch: any;
  setWarehouseSearch: (updater: any) => void;
  warehouseSearchOptions: { articles: string[]; sizes: string[]; colors: string[] };
  handleWarehouseFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  warehouseSearchResults: any[];
  warehouseShareEmployeeId: string;
  setWarehouseShareEmployeeId: (value: string) => void;
  warehouseShareEmployees: Array<{ id: string; full_name: string; telegram_chat_id?: string }>;
  handleDownloadWarehouseSearchPdf: () => void;
  handleSendWarehouseSearchToTelegram: () => void;
  warehousePdfGenerating: boolean;
  warehouseRows: any[];
  setSelectedWarehouseRack: (value: any) => void;
  warehouseAssignments: Record<string, Array<{ article: string; size: string; color: string; supplier?: string }>>;
  suppliers: Array<{ id: string; name: string }>;
  rackSupplierMap: Record<string, string>;
  applyRackSupplier: (rackNames: string[], supplierId: string) => void;
  selectedWarehouseRack: any;
  handleEditShelfItem: (shelf: string, idx: number) => void;
  handleDeleteShelfItem: (shelf: string, idx: number) => void;
};

export const WarehouseTab = (props: Props) => {
  const {
    warehouseFill,
    setWarehouseFill,
    warehouseEditTarget,
    setWarehouseEditTarget,
    allWarehouseRacks,
    selectedRackShelves,
    handleFillRack,
    warehouseFileInputRef,
    handleDownloadWarehouseTemplate,
    warehouseSearch,
    setWarehouseSearch,
    warehouseSearchOptions,
    handleWarehouseFileUpload,
    warehouseSearchResults,
    warehouseShareEmployeeId,
    setWarehouseShareEmployeeId,
    warehouseShareEmployees,
    handleDownloadWarehouseSearchPdf,
    handleSendWarehouseSearchToTelegram,
    warehousePdfGenerating,
    warehouseRows,
    setSelectedWarehouseRack,
    warehouseAssignments,
    suppliers,
    rackSupplierMap,
    applyRackSupplier,
    selectedWarehouseRack,
    handleEditShelfItem,
    handleDeleteShelfItem,
  } = props;

  const [rackFillMode, setRackFillMode] = React.useState(false);
  const [bulkSupplierId, setBulkSupplierId] = React.useState('');
  const [selectedRacksBulk, setSelectedRacksBulk] = React.useState<string[]>([]);
  const [pendingArticle, setPendingArticle] = React.useState('');
  const [pendingSize, setPendingSize] = React.useState('');
  const [pendingColor, setPendingColor] = React.useState('');

  const splitMulti = React.useCallback((value: string) =>
    String(value || '')
      .split(/[\n,;]+/)
      .map((v) => v.trim())
      .filter(Boolean), []);

  const addToSearch = (key: 'article' | 'size' | 'color', value: string) => {
    const val = String(value || '').trim();
    if (!val) return;
    setWarehouseSearch((prev: any) => {
      const current = splitMulti(prev[key]);
      if (current.includes(val)) return prev;
      return { ...prev, [key]: [...current, val].join(', ') };
    });
  };

  const removeFromSearch = (key: 'article' | 'size' | 'color', value: string) => {
    setWarehouseSearch((prev: any) => {
      const next = splitMulti(prev[key]).filter((v) => v !== value);
      return { ...prev, [key]: next.join(', ') };
    });
  };

  const clearSearch = () => setWarehouseSearch((prev: any) => ({ ...prev, article: '', size: '', color: '' }));

  const addPendingToSearch = () => {
    if (pendingArticle) addToSearch('article', pendingArticle);
    if (pendingSize) addToSearch('size', pendingSize);
    if (pendingColor) addToSearch('color', pendingColor);

    setPendingArticle('');
    setPendingSize('');
    setPendingColor('');
  };

  const supplierColorMap = React.useMemo(() => {
    const palette = ['from-indigo-600 to-blue-700', 'from-emerald-600 to-teal-700', 'from-fuchsia-600 to-purple-700', 'from-amber-500 to-orange-600', 'from-cyan-600 to-sky-700', 'from-rose-600 to-pink-700'];
    const map: Record<string, string> = {};
    suppliers.forEach((s, idx) => {
      map[s.id] = palette[idx % palette.length];
    });
    return map;
  }, [suppliers]);

  const selectedArticles = React.useMemo(() => {
    const fromSearch = splitMulti(warehouseSearch.article);
    const merged = pendingArticle && !fromSearch.includes(pendingArticle) ? [...fromSearch, pendingArticle] : fromSearch;
    return [...merged].sort((a, b) => a.localeCompare(b, 'ru', { numeric: true }));
  }, [splitMulti, warehouseSearch.article, pendingArticle]);
  const selectedSizes = React.useMemo(() => {
    const fromSearch = splitMulti(warehouseSearch.size);
    const merged = pendingSize && !fromSearch.includes(pendingSize) ? [...fromSearch, pendingSize] : fromSearch;
    return [...merged].sort((a, b) => a.localeCompare(b, 'ru', { numeric: true }));
  }, [splitMulti, warehouseSearch.size, pendingSize]);

  const articleScope = React.useMemo(() => {
    // While user is selecting a new article, show dependent options strictly for that selected value.
    if (pendingArticle) return [pendingArticle];
    return selectedArticles;
  }, [pendingArticle, selectedArticles]);

  const dependentSizeOptions = React.useMemo(() => {
    if (articleScope.length === 0) return [] as string[];
    const all = Object.values(warehouseAssignments || {}).flat() as any[];
    const set = new Set<string>();
    all.forEach((it: any) => {
      const article = String(it?.article || '').trim();
      const size = String(it?.size || '').trim();
      if (articleScope.includes(article) && size) set.add(size);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'));
  }, [warehouseAssignments, articleScope]);

  const dependentColorOptions = React.useMemo(() => {
    if (articleScope.length === 0) return [] as string[];
    const all = Object.values(warehouseAssignments || {}).flat() as any[];
    const set = new Set<string>();
    all.forEach((it: any) => {
      const article = String(it?.article || '').trim();
      const size = String(it?.size || '').trim();
      const color = String(it?.color || '').trim();
      const articleOk = articleScope.includes(article);
      const sizeOk = selectedSizes.length === 0 || selectedSizes.includes(size);
      if (articleOk && sizeOk && color) set.add(color);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'));
  }, [warehouseAssignments, articleScope, selectedSizes]);

  const currentSearchByArticle = React.useMemo(() => {
    const grouped: Array<{ article: string; sizes: string[]; colors: string[] }> = [];
    const map = new Map<string, { sizes: Set<string>; colors: Set<string> }>();

    (warehouseSearchResults || []).forEach((row: any) => {
      const article = String(row?.article || '').trim();
      if (!article) return;
      if (!map.has(article)) map.set(article, { sizes: new Set(), colors: new Set() });
      const entry = map.get(article)!;
      const size = String(row?.size || '').trim();
      const color = String(row?.color || '').trim();
      if (size) entry.sizes.add(size);
      if (color) entry.colors.add(color);
    });

    Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0], 'ru', { numeric: true }))
      .forEach(([article, info]) => {
        grouped.push({
          article,
          sizes: Array.from(info.sizes).sort((a, b) => a.localeCompare(b, 'ru', { numeric: true })),
          colors: Array.from(info.colors).sort((a, b) => a.localeCompare(b, 'ru')),
        });
      });

    return grouped;
  }, [warehouseSearchResults]);

  const warehouseTotals = React.useMemo(() => {
    const racks = warehouseRows.flatMap((row: any) => row.racks || []);
    const totalRacks = racks.length;

    const totalShelves = racks.reduce((sum: number, rack: any) => sum + ((rack.shelves || []).length), 0);
    const filledShelves = racks.reduce((sum: number, rack: any) => {
      const shelves = rack.shelves || [];
      return sum + shelves.filter((s: string) => (warehouseAssignments[s]?.length || 0) > 0).length;
    }, 0);

    const freeShelves = Math.max(totalShelves - filledShelves, 0);
    const filledRacks = racks.filter((rack: any) => {
      const shelves = rack.shelves || [];
      return shelves.some((s: string) => (warehouseAssignments[s]?.length || 0) > 0);
    }).length;
    const freeRacks = Math.max(totalRacks - filledRacks, 0);

    const shelvesPercent = totalShelves > 0 ? Math.round((filledShelves / totalShelves) * 100) : 0;
    const racksPercent = totalRacks > 0 ? Math.round((filledRacks / totalRacks) * 100) : 0;

    return {
      totalRacks,
      filledRacks,
      freeRacks,
      totalShelves,
      filledShelves,
      freeShelves,
      shelvesPercent,
      racksPercent,
    };
  }, [warehouseRows, warehouseAssignments]);

  const supplierInfographics = React.useMemo(() => {
    const racks = warehouseRows.flatMap((row: any) => row.racks || []);

    return suppliers.map((supplier) => {
      const supplierRacks = racks.filter((rack: any) => rackSupplierMap[rack.rackName] === supplier.id);
      const totalRacks = supplierRacks.length;
      const totalShelves = supplierRacks.reduce((sum: number, rack: any) => sum + (rack.shelves?.length || 0), 0);
      const filledShelves = supplierRacks.reduce((sum: number, rack: any) => {
        const shelves = rack.shelves || [];
        return sum + shelves.filter((s: string) => (warehouseAssignments[s]?.length || 0) > 0).length;
      }, 0);
      const filledRacks = supplierRacks.filter((rack: any) => {
        const shelves = rack.shelves || [];
        return shelves.some((s: string) => (warehouseAssignments[s]?.length || 0) > 0);
      }).length;

      const shelvesPercent = totalShelves > 0 ? Math.round((filledShelves / totalShelves) * 100) : 0;
      const racksPercent = totalRacks > 0 ? Math.round((filledRacks / totalRacks) * 100) : 0;

      return {
        id: supplier.id,
        name: supplier.name,
        totalRacks,
        filledRacks,
        freeRacks: Math.max(totalRacks - filledRacks, 0),
        totalShelves,
        filledShelves,
        freeShelves: Math.max(totalShelves - filledShelves, 0),
        shelvesPercent,
        racksPercent,
      };
    }).filter((x) => x.totalRacks > 0);
  }, [suppliers, rackSupplierMap, warehouseRows, warehouseAssignments]);

  return (
    <div className="max-w-full mx-auto px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Склад</h1>
        <p className="text-gray-500 mt-1">Интерактивная карта. Нажми на стеллаж, чтобы открыть его полки.</p>
      </div>

      <div className="mb-5 bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base md:text-lg font-semibold text-slate-900">Загруженность склада</h2>
          <span className="text-xs md:text-sm text-slate-500">Свободно стеллажей: <span className="font-bold text-emerald-700">{warehouseTotals.freeRacks}</span> из {warehouseTotals.totalRacks}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-600">Полки заполнены</span>
              <span className="font-semibold text-slate-900">{warehouseTotals.filledShelves}/{warehouseTotals.totalShelves} ({warehouseTotals.shelvesPercent}%)</span>
            </div>
            <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-600 to-blue-600" style={{ width: `${warehouseTotals.shelvesPercent}%` }} />
            </div>
            <div className="text-xs text-slate-500 mt-2">Свободных полок: <span className="font-semibold text-emerald-700">{warehouseTotals.freeShelves}</span></div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-600">Стеллажи заняты</span>
              <span className="font-semibold text-slate-900">{warehouseTotals.filledRacks}/{warehouseTotals.totalRacks} ({warehouseTotals.racksPercent}%)</span>
            </div>
            <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600" style={{ width: `${warehouseTotals.racksPercent}%` }} />
            </div>
            <div className="text-xs text-slate-500 mt-2">Свободных стеллажей: <span className="font-semibold text-emerald-700">{warehouseTotals.freeRacks}</span></div>
          </div>
        </div>
      </div>

      {supplierInfographics.length > 0 && (
        <div className="mb-5 bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm">
          <h2 className="text-base md:text-lg font-semibold text-slate-900 mb-3">Загруженность по поставщикам</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {supplierInfographics.map((s) => (
              <div key={`supplier-inf-${s.id}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="font-semibold text-slate-900 mb-2 truncate">{s.name}</div>

                <div className="text-xs text-slate-600 mb-1">Полки: {s.filledShelves}/{s.totalShelves} ({s.shelvesPercent}%)</div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-gradient-to-r from-indigo-600 to-blue-600" style={{ width: `${s.shelvesPercent}%` }} />
                </div>

                <div className="text-xs text-slate-600 mb-1">Стеллажи: {s.filledRacks}/{s.totalRacks} ({s.racksPercent}%)</div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600" style={{ width: `${s.racksPercent}%` }} />
                </div>

                <div className="text-[11px] text-slate-500">Свободно: стеллажей {s.freeRacks}, полок {s.freeShelves}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-6 shadow-sm mb-5">
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Заполнить: Стеллаж</label>
            <select value={warehouseFill.rack} onChange={(e) => { setWarehouseEditTarget(null); setWarehouseFill((p: any) => ({ ...p, rack: e.target.value, shelf: '' })); }} className="px-3 py-2 border border-gray-300 rounded-lg w-full">
              <option value="">Выберите стеллаж</option>
              {allWarehouseRacks.map((rack) => <option key={rack} value={rack}>{rack}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Заполнить: Полка</label>
            <select value={warehouseFill.shelf} onChange={(e) => { setWarehouseEditTarget(null); setWarehouseFill((p: any) => ({ ...p, shelf: e.target.value })); }} className="px-3 py-2 border border-gray-300 rounded-lg w-full">
              <option value="">Выберите полку</option>
              {selectedRackShelves.map((shelf) => <option key={shelf} value={shelf}>{shelf}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Заполнить: Артикул</label>
            <input value={warehouseFill.article} onChange={(e) => setWarehouseFill((p: any) => ({ ...p, article: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg w-full" placeholder="Артикул" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Заполнить: Размер</label>
            <input value={warehouseFill.size} onChange={(e) => setWarehouseFill((p: any) => ({ ...p, size: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg w-full" placeholder="Размер" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Заполнить: Цвет</label>
            <input value={warehouseFill.color} onChange={(e) => setWarehouseFill((p: any) => ({ ...p, color: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg w-full" placeholder="Цвет" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Заполнить: Поставщик</label>
            <select value={warehouseFill.supplier || ''} onChange={(e) => setWarehouseFill((p: any) => ({ ...p, supplier: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg w-full">
              <option value="">Выберите поставщика</option>
              {suppliers.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>

          <button onClick={handleFillRack} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">{warehouseEditTarget ? 'Сохранить изменения' : 'Заполнить полку'}</button>
          {warehouseEditTarget && (
            <button onClick={() => setWarehouseEditTarget(null)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Отмена редактирования</button>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-2 items-center">
          <button onClick={() => warehouseFileInputRef.current?.click()} className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">Выбрать файл</button>
          <button onClick={handleDownloadWarehouseTemplate} className="px-4 py-2 rounded-lg border border-indigo-300 text-indigo-700 hover:bg-indigo-50">Скачать шаблон</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-3 gap-3 items-end mt-3 pt-3 border-t border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Поиск: Артикул</label>
            <div className="flex gap-2">
              <select value={pendingArticle} onChange={(e) => { setPendingArticle(e.target.value); setPendingSize(''); setPendingColor(''); }} className="px-3 py-2 border border-gray-300 rounded-lg w-full">
                <option value="">Выберите артикул</option>
                {warehouseSearchOptions.articles.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Поиск: Размер</label>
            <div className="flex gap-2 mb-2">
              <select value={pendingSize} onChange={(e) => setPendingSize(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg w-full" disabled={selectedArticles.length === 0}>
                <option value="">{selectedArticles.length === 0 ? 'Сначала выберите артикул' : 'Выберите размер'}</option>
                {dependentSizeOptions.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            {selectedArticles.length > 0 && dependentSizeOptions.length > 0 && (
              <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto rounded-lg border border-emerald-100 bg-emerald-50 p-2">
                {dependentSizeOptions.map((v) => {
                  const checked = splitMulti(warehouseSearch.size).includes(v);
                  return (
                    <label key={`size-check-${v}`} className="inline-flex items-center gap-1 text-xs text-emerald-800 bg-white border border-emerald-200 rounded-full px-2 py-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (!pendingArticle) return;
                          if (!splitMulti(warehouseSearch.article).includes(pendingArticle)) addToSearch('article', pendingArticle);
                          e.target.checked ? addToSearch('size', v) : removeFromSearch('size', v);
                        }}
                      />
                      {v}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Поиск: Цвет</label>
            <div className="flex gap-2 mb-2">
              <select value={pendingColor} onChange={(e) => setPendingColor(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg w-full" disabled={selectedArticles.length === 0}>
                <option value="">{selectedArticles.length === 0 ? 'Сначала выберите артикул' : 'Выберите цвет'}</option>
                {dependentColorOptions.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            {selectedArticles.length > 0 && dependentColorOptions.length > 0 && (
              <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto rounded-lg border border-amber-100 bg-amber-50 p-2">
                {dependentColorOptions.map((v) => {
                  const checked = splitMulti(warehouseSearch.color).includes(v);
                  return (
                    <label key={`color-check-${v}`} className="inline-flex items-center gap-1 text-xs text-amber-800 bg-white border border-amber-200 rounded-full px-2 py-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (!pendingArticle) return;
                          if (!splitMulti(warehouseSearch.article).includes(pendingArticle)) addToSearch('article', pendingArticle);
                          e.target.checked ? addToSearch('color', v) : removeFromSearch('color', v);
                        }}
                      />
                      {v}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="mt-3">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <button onClick={addPendingToSearch} className="px-3 py-1.5 rounded-lg border border-indigo-300 text-indigo-700 hover:bg-indigo-50 text-sm">Добавить в поиск</button>
            <button onClick={clearSearch} className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm">Очистить поиск</button>
          </div>

          <div className="text-xs text-gray-500 mb-2">Текущий поиск (размер и цвет напротив артикула):</div>

          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-2 space-y-2">
            {currentSearchByArticle.length > 0 ? (
              currentSearchByArticle.map((row) => (
                <div key={`row-${row.article}`} className="bg-white border border-indigo-100 rounded-lg p-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-xs font-semibold text-indigo-700 min-w-[120px]">Арт: {row.article}</div>
                    <button onClick={() => removeFromSearch('article', row.article)} className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200">Удалить</button>
                  </div>
                  <div className="mt-1 text-xs text-gray-700">
                    <span className="font-medium text-emerald-700">Размеры:</span> {row.sizes.length ? row.sizes.join(', ') : '—'}
                  </div>
                  <div className="mt-0.5 text-xs text-gray-700">
                    <span className="font-medium text-amber-700">Цвета:</span> {row.colors.length ? row.colors.join(', ') : '—'}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-[11px] text-indigo-500">—</div>
            )}

            <div className="pt-1 border-t border-indigo-100 flex flex-wrap gap-1">
              {splitMulti(warehouseSearch.size).sort((a, b) => a.localeCompare(b, 'ru', { numeric: true })).map((v) => (
                <button key={`s-${v}`} onClick={() => removeFromSearch('size', v)} className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200">Размер: {v} ×</button>
              ))}
              {splitMulti(warehouseSearch.color).sort((a, b) => a.localeCompare(b, 'ru', { numeric: true })).map((v) => (
                <button key={`c-${v}`} onClick={() => removeFromSearch('color', v)} className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200">Цвет: {v} ×</button>
              ))}
            </div>
          </div>
        </div>

        <input ref={warehouseFileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleWarehouseFileUpload} />

        <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200">
          <div className="text-sm font-medium text-slate-700 mb-2">Найденные позиции (стеллаж + полка):</div>
          {warehouseSearchResults.length > 0 && (
            <div className="mb-3 grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
              <button onClick={handleDownloadWarehouseSearchPdf} disabled={warehousePdfGenerating} className="px-3 py-2 rounded-lg border border-indigo-300 text-indigo-700 hover:bg-indigo-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {warehousePdfGenerating ? 'Подготовка Excel...' : 'Скачать позиции (Excel)'}
              </button>
              <select
                value={warehouseShareEmployeeId}
                onChange={(e) => setWarehouseShareEmployeeId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg w-full text-sm"
              >
                <option value="">{warehouseShareEmployees.length ? 'Выберите сотрудника для Telegram' : 'Сотрудники не загружены'}</option>
                {warehouseShareEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{String(emp.full_name || '').trim() || `Сотрудник ${emp.id}`}{emp.telegram_chat_id ? '' : ' (без TG)'}</option>
                ))}
              </select>
              <button onClick={handleSendWarehouseSearchToTelegram} disabled={warehousePdfGenerating} className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {warehousePdfGenerating ? 'Подготовка файла...' : 'Отправить в Telegram'}
              </button>
            </div>
          )}
          {warehouseSearchResults.length > 0 ? (
            <div className="space-y-2">
              {warehouseSearchResults.length > 200 && (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
                  Показаны первые 200 из {warehouseSearchResults.length} найденных позиций для ускорения интерфейса.
                </div>
              )}
              {warehouseSearchResults.slice(0, 200).map((row, idx) => (
                <button
                  key={`${row.shelf}-${idx}`}
                  onClick={() => {
                    const line = warehouseRows.find((r) => r.racks.some((x: any) => x.rackName === row.rack));
                    const rackObj = line?.racks.find((x: any) => x.rackName === row.rack);
                    if (line && rackObj) setSelectedWarehouseRack({ rowTitle: line.rowTitle, rackName: rackObj.rackName, shelves: rackObj.shelves });
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 text-sm hover:bg-emerald-100"
                >
                  <div className="font-semibold">Стеллаж: {row.rack} • Полка: {row.shelf}</div>
                  <div className="text-xs mt-0.5">Арт: {row.article || '—'} • Размер: {row.size || '—'} • Цвет: {row.color || '—'} • Поставщик: {row.supplier || '—'}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">Ничего не найдено (или фильтр не выбран).</div>
          )}
        </div>
      </div>

      <div className="mb-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap gap-2 items-end">
          <button onClick={() => { setRackFillMode((v) => !v); setSelectedRacksBulk([]); }} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
            {rackFillMode ? 'Отменить выбор стеллажей' : 'Заполнить стеллажи'}
          </button>
          {rackFillMode && (
            <>
              <select value={bulkSupplierId} onChange={(e) => setBulkSupplierId(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg min-w-[240px]">
                <option value="">Выберите поставщика для стеллажей</option>
                {suppliers.map((s) => <option key={`bulk-${s.id}`} value={s.id}>{s.name}</option>)}
              </select>
              <button
                onClick={() => {
                  if (!bulkSupplierId || selectedRacksBulk.length === 0) return;
                  applyRackSupplier(selectedRacksBulk, bulkSupplierId);
                  setSelectedRacksBulk([]);
                }}
                disabled={!bulkSupplierId || selectedRacksBulk.length === 0}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Применить к выбранным ({selectedRacksBulk.length})
              </button>
            </>
          )}
        </div>
        {rackFillMode && <div className="text-xs text-slate-500 mt-2">Режим выбора включён: кликай по стеллажам на карте для выбора. Цвет стеллажа показывает поставщика.</div>}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-6 shadow-sm" style={{ backgroundImage: 'linear-gradient(to right, rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.12) 1px, transparent 1px)', backgroundSize: '28px 28px' }}>
        <div className="space-y-4">
          {warehouseRows.map((row) => (
            <div key={row.rowLetter} className="bg-white/80 backdrop-blur rounded-xl border border-gray-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm md:text-base font-semibold text-gray-900">{row.rowTitle}</h2>
                <span className="text-xs text-gray-500">{row.racks.length} стеллажей</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {row.racks.map((rack: any) => {
                  const filledCount = rack.shelves.filter((s: string) => (warehouseAssignments[s]?.length || 0) > 0).length;
                  const fillPercent = rack.shelves.length > 0 ? Math.round((filledCount / rack.shelves.length) * 100) : 0;
                  const mappedSupplierId = rackSupplierMap[rack.rackName] || '';
                  const supplier = suppliers.find((s) => s.id === mappedSupplierId);
                  const supplierGradient = supplierColorMap[mappedSupplierId] || 'from-indigo-600 to-blue-700';
                  const selected = selectedRacksBulk.includes(rack.rackName);
                  return (
                    <button
                      key={rack.rackName}
                      onClick={() => {
                        if (rackFillMode) {
                          setSelectedRacksBulk((prev) => prev.includes(rack.rackName) ? prev.filter((x) => x !== rack.rackName) : [...prev, rack.rackName]);
                          return;
                        }
                        setSelectedWarehouseRack({ rowTitle: row.rowTitle, rackName: rack.rackName, shelves: rack.shelves });
                      }}
                      className={`px-3 py-2.5 min-w-[108px] rounded-xl border text-left shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all bg-gradient-to-br ${supplierGradient} ${selected ? 'ring-2 ring-amber-300 border-amber-200' : 'border-white/20'}`}
                    >
                      <div className="text-white font-semibold leading-tight">{rack.rackName}</div>
                      <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-medium text-white/95">
                        <span>Заполнено</span>
                        <span className="font-bold">{filledCount}/{rack.shelves.length}</span>
                        <span className="text-white/80">({fillPercent}%)</span>
                      </div>
                      <div className="mt-1 text-[10px] text-white/90 truncate">{supplier ? supplier.name : 'Поставщик не выбран'}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedWarehouseRack && (
        <div className="mt-5 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-gray-500">{selectedWarehouseRack.rowTitle}</div>
              <div className="text-lg font-semibold text-gray-900">Стеллаж {selectedWarehouseRack.rackName}</div>
            </div>
            <button onClick={() => setSelectedWarehouseRack(null)} className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">Закрыть</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {selectedWarehouseRack.shelves.map((shelf: string) => {
              const items = warehouseAssignments[shelf] || [];
              return (
                <div key={shelf} className={`px-3 py-2 rounded-lg border text-sm ${items.length > 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-indigo-200 bg-indigo-50 text-indigo-800'}`}>
                  <div className="font-semibold">{shelf}</div>
                  {items.length > 0 ? (
                    <div className="text-xs mt-1 space-y-2">
                      {items.map((data, idx) => (
                        <div key={`${shelf}-${idx}`} className="rounded border border-emerald-200 bg-white p-2">
                          <div>Арт: {data.article || '—'}</div>
                          <div>Размер: {data.size || '—'}</div>
                          <div>Цвет: {data.color || '—'}</div>
                          <div>Поставщик: {data.supplier || '—'}</div>
                          <div className="pt-1 flex gap-2">
                            <button onClick={() => handleEditShelfItem(shelf, idx)} className="px-2 py-0.5 rounded border border-blue-300 text-blue-700 hover:bg-blue-50">Редактировать</button>
                            <button onClick={() => handleDeleteShelfItem(shelf, idx)} className="px-2 py-0.5 rounded border border-rose-300 text-rose-700 hover:bg-rose-50">Удалить</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs mt-1 opacity-70">Пусто</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
