import React, { useEffect, useState, useRef, useMemo, useCallback, useDeferredValue } from 'react';
// WB Products Component (Updated Layout v11 - Multi-supplier fetch, Enhanced UI)
import { Loader2, AlertCircle, Image as ImageIcon, ExternalLink, RefreshCw, Printer, Minus, Plus, Search, Filter, X, Package, Pencil, Database, CheckCircle2, Trash2 } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import bwipjs from 'bwip-js';
import { supabase } from '../lib/supabase';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { isWarehouseOfflineEnabled, warehouseOfflineClient } from '../lib/warehouseOffline';

interface WBCharacteristic {
  name?: string;
  Name?: string;
  value?: string | string[] | number;
  Value?: string | string[] | number;
  [key: string]: unknown;
}

interface WBProduct {
  nmID: number;
  vendorCode: string;
  title: string;
  description: string;
  photos: { big: string; c246x328: string; c516x688: string; square: string; tm: string }[];
  dimensions: { length: number; width: number; height: number };
  characteristics: WBCharacteristic[];
  sizes: { techSize: string; wbSize: string; price: number; skus: string[] }[];
  createdAt: string;
  updatedAt: string;
  brand?: string;
  subjectName?: string; // Category
  supplierId?: string; // Added for filtering
}

interface ProductVariant {
  id: string; // Composite key: nmID-techSize
  product: WBProduct;
  size: { techSize: string; wbSize: string; price: number; skus: string[] };
  barcode: string;
}

interface Supplier {
  id: string;
  name: string;
  wb_api_token?: string;
}

const Sticker = ({ variant, honestSignCode, supplierName }: { variant: ProductVariant; honestSignCode?: string; supplierName?: string }) => {
  const canvasRef = useRef<SVGSVGElement>(null);
  const dmCanvasRef = useRef<HTMLCanvasElement>(null);
  const { product, size, barcode } = variant;

  // Helper to get char value safely
  const getChar = (name: string) => {
    if (!product.characteristics) return '-';
    
    const charObj = product.characteristics.find((c) => 
      (c.name && c.name.toLowerCase() === name.toLowerCase()) || 
      (c.Name && c.Name.toLowerCase() === name.toLowerCase())
    );
    
    if (charObj) {
      const val = charObj.value ?? charObj.Value;
      return Array.isArray(val) ? val.join(', ') : String(val ?? '-');
    }

    const charKey = product.characteristics.find((c) => 
      Object.keys(c).some(k => k.toLowerCase() === name.toLowerCase())
    );
    
    if (charKey) {
      const key = Object.keys(charKey).find(k => k.toLowerCase() === name.toLowerCase());
      return key ? String(charKey[key] ?? '-') : '-';
    }

    return '-';
  };

  const color = getChar('Цвет');
  const composition = getChar('Состав');

  useEffect(() => {
    if (canvasRef.current && barcode) {
      try {
        const format = (barcode.length === 12 || barcode.length === 13) && /^\d+$/.test(barcode) ? "EAN13" : "CODE128";
        
        JsBarcode(canvasRef.current, barcode, {
          format: format,
          width: honestSignCode ? 1.5 : 2, // Thinner bars for small layout
          height: honestSignCode ? 20 : 30, // Shorter bars
          displayValue: false, 
          fontSize: 14,
          fontOptions: "bold",
          margin: 0,
          textMargin: 0,
          flat: true
        });
      } catch (e) {
        console.error("Invalid barcode", barcode, e);
      }
    }

    if (honestSignCode && dmCanvasRef.current) {
        try {
            let codeToEncode = honestSignCode.trim();
            
            // Automatic 21 injection
            if (codeToEncode.startsWith('01') && codeToEncode.length > 16) {
                const afterGtin = codeToEncode.substring(16);
                if (!afterGtin.startsWith('21')) {
                    codeToEncode = codeToEncode.substring(0, 16) + '21' + afterGtin;
                }
            }

            // Force literal DataMatrix to ensure full string is scanned
            // (GS1 scanners often truncate to GTIN if FNC1 is present)
            bwipjs.toCanvas(dmCanvasRef.current, {
                bcid: 'datamatrix',
                text: codeToEncode,
                scale: 3,
                includetext: false,
                padding: 2,
                backgroundcolor: 'ffffff',
            });
        } catch (e) {
            console.error(e);
        }
    }
  }, [barcode, honestSignCode]);

  if (honestSignCode) {
      return (
        <div className="sticker w-[58mm] h-[40mm] p-[1mm] flex flex-col bg-white text-black overflow-hidden box-border border-none relative leading-none">
            {/* 1. Product Barcode (Top, Full Width) */}
            <div className="w-full flex flex-col items-center justify-center mb-0.5 shrink-0">
                <div className="w-full h-[12mm] overflow-hidden flex justify-center items-end">
                    <svg ref={canvasRef} className="h-full w-full" style={{ maxWidth: '100%' }} />
                </div>
                <div className="text-[9px] font-bold -mt-2 bg-white px-2 z-10 leading-none">{barcode}</div>
            </div>
            
            {/* 2. Bottom Area: HS QR + Info */}
            <div className="flex w-full flex-1 min-h-0">
                {/* Left: HS QR */}
                <div className="flex flex-col items-center justify-start w-[22mm] shrink-0 pt-1">
                    <canvas ref={dmCanvasRef} className="w-[18mm] h-[18mm]" />
                    <div className="text-[4px] mt-0.5 text-center break-all leading-none w-full font-mono">
                        {honestSignCode}
                    </div>
                </div>
                
                {/* Right: Info */}
                <div className="flex flex-col flex-1 pl-2 pt-1 relative text-left">
                    {/* Product Name */}
                    <div className="text-[6px] font-bold leading-tight mb-1">
                        {product.title}
                    </div>

                    {/* Article WB (nmID) */}
                    <div className="text-[7px] font-bold mb-1">
                        Арт: {product.nmID}
                    </div>

                    {/* Supplier Name */}
                    {supplierName && (
                        <div className="text-[6px] font-bold mb-1 truncate text-slate-700">
                            {supplierName}
                        </div>
                    )}

                    {/* Color / Size */}
                    <div className="text-[7px] font-bold mt-auto mb-1">
                        {color} / {size.techSize}
                    </div>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="sticker w-[58mm] h-[40mm] p-[1mm] flex flex-col items-center justify-start bg-white text-black overflow-hidden box-border border-none relative text-center leading-none">
      
      {/* 1. Barcode (Top) */}
      <div className="w-full flex justify-center shrink-0 h-[12mm] overflow-hidden">
        <svg ref={canvasRef} className="w-full h-full" style={{ maxWidth: '100%' }} />
      </div>

      {/* 2. Barcode Number (Below Barcode) */}
      <div className="w-full text-center text-[10px] font-bold mb-0.5">
        {barcode}
      </div>

      {/* 3. Name */}
      <div className="w-full text-center text-[9px] font-bold line-clamp-2 overflow-hidden mb-0.5 px-1 h-[7mm]">
        {product.title}
      </div>

      {/* 4. Article WB or ID */}
      <div className="w-full text-center text-[10px] mb-0.5 shrink-0 font-bold">
        {product.nmID}
      </div>

      {/* Supplier Name */}
      {supplierName && (
        <div className="w-full text-center text-[8px] mb-0.5 shrink-0 font-bold truncate px-1 text-slate-700">
            {supplierName}
        </div>
      )}

      {/* 5. Color / Size */}
      <div className="w-full text-center text-[10px] font-bold shrink-0 mt-auto mb-1">
        {color} / {size.techSize}
      </div>

    </div>
  );
};

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState<boolean>(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false
  );
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(query);
    const handler = () => setMatches(mql.matches);
    handler();
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return matches;
};

// Cache Roboto font base64 across prints — re-fetching from the CDN on every
// print is the main "очень долго грузит" cause, especially on tablets/слабый сети.
const wbFontBase64Cache: Record<string, string> = {};

const WB_PRODUCTS_BROWSER_CACHE_KEY = 'wb_products_browser_cache_v1';
const WB_PRINT_CODES_CACHE_KEY = 'wb_print_codes_cache_v1';
const WB_PRINT_PENDING_SYNC_KEY = 'wb_print_pending_codes_sync_v1';
const WB_LOCAL_LABEL_EDITS_KEY = 'wb_local_label_edits_v1';
const WB_MODEL_NUMBERS_SETTINGS_KEY = 'wb_model_numbers_v1';

const WBProductsComponent = ({ suppliers = [] }: { suppliers?: Supplier[] }) => {
  const [products, setProducts] = useState<WBProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isPrinting, setIsPrinting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPreparingPrintCache, setIsPreparingPrintCache] = useState(false);
  const [isCheckingPrintCache, setIsCheckingPrintCache] = useState(false);
  const [printCachePreparedAt, setPrintCachePreparedAt] = useState<string | null>(null);
  const [printCacheStatus, setPrintCacheStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [localLabelEdits, setLocalLabelEdits] = useState<Record<string, { article: string; size: string; color: string; modelNumber?: string }>>({});
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [editDraft, setEditDraft] = useState({ article: '', size: '', color: '', modelNumber: '' });

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  useEffect(() => {
    const mergeModelNumbers = (base: Record<string, { article: string; size: string; color: string; modelNumber?: string }>, models: Record<string, string>) => {
      const next = { ...base };
      Object.entries(models).forEach(([nmID, modelNumber]) => {
        const clean = String(modelNumber || '').trim();
        if (!clean) return;
        const key = `model:${nmID}`;
        next[key] = {
          article: nmID,
          size: '',
          color: '',
          ...(next[key] || {}),
          modelNumber: clean,
        };
      });
      return next;
    };

    const extractLocalModelNumbers = (edits: Record<string, { article: string; size: string; color: string; modelNumber?: string }>) => {
      const models: Record<string, string> = {};
      Object.entries(edits).forEach(([key, value]) => {
        const modelNumber = String(value?.modelNumber || '').trim();
        if (!modelNumber) return;

        if (key.startsWith('model:')) {
          const nmID = key.replace(/^model:/, '').trim();
          if (nmID) models[nmID] = modelNumber;
          return;
        }

        // Backward compatibility: early versions stored modelNumber by variant key like "123456789-XL".
        const nmID = key.split('-')[0]?.trim();
        if (/^\d+$/.test(nmID)) models[nmID] = modelNumber;
      });
      return models;
    };

    const loadLabelEdits = async () => {
      let localEdits: Record<string, { article: string; size: string; color: string; modelNumber?: string }> = {};
      try {
        const raw = localStorage.getItem(WB_LOCAL_LABEL_EDITS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') localEdits = parsed;
        }
      } catch {}

      setLocalLabelEdits(localEdits);

      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', WB_MODEL_NUMBERS_SETTINGS_KEY)
          .maybeSingle();
        if (error) throw error;

        const parsed = data?.value ? JSON.parse(String(data.value)) : {};
        const dbModels = (parsed?.models && typeof parsed.models === 'object' ? parsed.models : parsed) as Record<string, string>;
        const localModels = extractLocalModelNumbers(localEdits);
        const mergedModels = { ...(dbModels || {}), ...localModels };

        if (Object.keys(mergedModels).length > 0) {
          setLocalLabelEdits(prev => mergeModelNumbers(prev, mergedModels));
        }

        const hasLocalModels = Object.keys(localModels).length > 0;
        const changed = hasLocalModels && JSON.stringify(dbModels || {}) !== JSON.stringify(mergedModels);
        if (changed) {
          await supabase
            .from('app_settings')
            .upsert([{ key: WB_MODEL_NUMBERS_SETTINGS_KEY, value: JSON.stringify({ models: mergedModels, updatedAt: new Date().toISOString() }) }], { onConflict: 'key' });
        }
      } catch (e) {
        console.warn('Failed to load/sync WB model numbers from DB', e);
      }
    };

    loadLabelEdits();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(WB_LOCAL_LABEL_EDITS_KEY, JSON.stringify(localLabelEdits));
    } catch {}
  }, [localLabelEdits]);

  const fetchWithRetry = async (url: string, init: RequestInit, maxRetries = 5): Promise<Response> => {
    let attempt = 0;
    let lastError: any = null;

    while (attempt <= maxRetries) {
      try {
        const response = await fetch(url, init);
        if (response.ok) return response;

        if (response.status === 429 || response.status >= 500) {
          const retryAfterHeader = response.headers.get('Retry-After');
          const retryAfterSeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) : NaN;
          const backoffMs = Number.isFinite(retryAfterSeconds)
            ? retryAfterSeconds * 1000
            : Math.min(10000, 800 * Math.pow(2, attempt)) + Math.floor(Math.random() * 300);

          attempt += 1;
          if (attempt > maxRetries) return response;
          await sleep(backoffMs);
          continue;
        }

        return response;
      } catch (e) {
        lastError = e;
        attempt += 1;
        if (attempt > maxRetries) throw e;
        await sleep(Math.min(8000, 700 * Math.pow(2, attempt)) + Math.floor(Math.random() * 250));
      }
    }

    throw lastError || new Error('fetchWithRetry failed');
  };

  const applyProductsState = (list: WBProduct[]) => {
    setProducts(list);
    const extractedBrands = Array.from(new Set(list.map((p: WBProduct) => p.brand || p.characteristics?.find((c: any) => c.name === 'Бренд')?.value).filter(Boolean))) as string[];
    const extractedCategories = Array.from(new Set(list.map((p: WBProduct) => p.subjectName).filter(Boolean))) as string[];
    setBrands(extractedBrands.sort());
    setCategories(extractedCategories.sort());

    const writeCache = (products: WBProduct[]) => localStorage.setItem(WB_PRODUCTS_BROWSER_CACHE_KEY, JSON.stringify({
      updatedAt: new Date().toISOString(),
      products,
    }));

    try {
      writeCache(list);
    } catch (e: any) {
      if (e?.name === 'QuotaExceededError') {
        try {
          const slim = list.slice(0, 800).map((p: WBProduct) => ({
            supplierId: p.supplierId,
            nmID: p.nmID,
            vendorCode: p.vendorCode,
            title: p.title,
            subjectName: p.subjectName,
            brand: p.brand,
            photos: Array.isArray((p as any).photos) ? (p as any).photos.slice(0, 1) : [],
            sizes: Array.isArray((p as any).sizes) ? (p as any).sizes.slice(0, 1) : [],
          })) as any;
          localStorage.removeItem(WB_PRODUCTS_BROWSER_CACHE_KEY);
          writeCache(slim as any);
          console.info('WB browser cache was trimmed due to storage quota');
        } catch (retryErr) {
          localStorage.removeItem(WB_PRODUCTS_BROWSER_CACHE_KEY);
          console.warn('WB products browser cache disabled: localStorage quota exceeded', retryErr);
        }
      } else {
        console.warn('Failed to write WB products browser cache', e);
      }
    }
  };

  const mergeProducts = (existing: WBProduct[], incoming: WBProduct[]) => {
    const map = new Map<string, WBProduct>();
    for (const p of existing) {
      map.set(`${p.supplierId || ''}-${p.nmID}`, p);
    }
    for (const p of incoming) {
      map.set(`${p.supplierId || ''}-${p.nmID}`, p);
    }
    return Array.from(map.values());
  };

  const loadProductsFromDb = async (supplierIds: string[]) => {
    if (!supplierIds.length) return [] as WBProduct[];

    const pageSize = 200;
    let from = 0;
    const rows: any[] = [];

    while (true) {
      const { data, error } = await supabase
        .from('wb_products_cache')
        .select('supplier_id, product_json')
        .in('supplier_id', supplierIds)
        .range(from, from + pageSize - 1);

      if (error) throw error;

      const chunk = data || [];
      rows.push(...chunk);

      if (chunk.length < pageSize) break;
      from += pageSize;
    }

    return rows
      .map((row: any) => ({ ...(row.product_json || {}), supplierId: row.supplier_id }))
      .filter((p: any) => p && p.nmID);
  };

  const loadProductsFromWarehouseOffline = async () => {
    try {
      if (!isWarehouseOfflineEnabled()) {
        setError('Склад offline выключен');
        return;
      }
      setLoading(true);
      setError(null);
      const snapshot = await warehouseOfflineClient.getSnapshot();
      const list = Array.isArray(snapshot?.wbProducts) ? snapshot.wbProducts as WBProduct[] : [];
      if (!list.length) {
        setError('В локальной offline-базе пока нет товаров. Обновите offline-базу в Поставки FBO.');
        applyProductsState([]);
        return;
      }
      applyProductsState(list);
      setPrintCacheStatus({ ok: true, message: 'Загружено из offline-базы: ' + list.length + ' товаров' });
    } catch (e: any) {
      setError('Не удалось загрузить товары из offline-базы: ' + (e?.message || 'неизвестно'));
    } finally {
      setLoading(false);
    }
  };

  const saveProductsToDb = async (items: WBProduct[]) => {
    const rows = items
      .filter((p) => p.supplierId && p.nmID)
      .map((p) => ({
        supplier_id: p.supplierId,
        nm_id: p.nmID,
        product_json: p,
        updated_at: new Date().toISOString(),
      }));

    if (!rows.length) return;

    const chunkSize = 200;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const { error } = await supabase
        .from('wb_products_cache')
        .upsert(chunk, { onConflict: 'supplier_id,nm_id' });

      if (error) throw error;
    }
  };

  const loadProductsFromBrowserCache = (supplierIds: string[]) => {
    try {
      const raw = localStorage.getItem(WB_PRODUCTS_BROWSER_CACHE_KEY);
      if (!raw) return [] as WBProduct[];
      const parsed = JSON.parse(raw);
      const list: WBProduct[] = Array.isArray(parsed?.products) ? parsed.products : [];
      if (!supplierIds.length) return list;
      const allowed = new Set(supplierIds);
      return list.filter((p) => p?.supplierId && allowed.has(String(p.supplierId)));
    } catch (e) {
      console.warn('Failed to read WB products browser cache', e);
      return [] as WBProduct[];
    }
  };

  type CachedCodesPayload = {
    preparedAt: string;
    bySupplier: Record<string, Array<{ code: string; category?: string | null }>>;
  };

  const loadPrintCodesCache = (): CachedCodesPayload | null => {
    try {
      const raw = localStorage.getItem(WB_PRINT_CODES_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      return parsed as CachedCodesPayload;
    } catch {
      return null;
    }
  };

  const savePrintCodesCache = (payload: CachedCodesPayload) => {
    try {
      localStorage.setItem(WB_PRINT_CODES_CACHE_KEY, JSON.stringify(payload));
    } catch (e: any) {
      if (e?.name === 'QuotaExceededError') {
        try {
          const compact: CachedCodesPayload = {
            preparedAt: payload.preparedAt,
            bySupplier: Object.fromEntries(
              Object.entries(payload.bySupplier || {}).map(([sid, arr]) => [sid, (arr || []).slice(0, 1500)])
            ),
          };
          localStorage.removeItem(WB_PRINT_CODES_CACHE_KEY);
          localStorage.setItem(WB_PRINT_CODES_CACHE_KEY, JSON.stringify(compact));
          console.info('WB print codes cache compacted due to storage quota');
        } catch {
          localStorage.removeItem(WB_PRINT_CODES_CACHE_KEY);
        }
      }
    }
    setPrintCachePreparedAt(payload.preparedAt);
  };

  const queuePendingPrintedCodes = (codes: string[]) => {
    if (!codes.length) return;
    try {
      const raw = localStorage.getItem(WB_PRINT_PENDING_SYNC_KEY);
      const prev: string[] = raw ? JSON.parse(raw) : [];
      const merged = Array.from(new Set([...(Array.isArray(prev) ? prev : []), ...codes]));
      localStorage.setItem(WB_PRINT_PENDING_SYNC_KEY, JSON.stringify(merged));
    } catch {}
  };

  const flushPendingPrintedCodes = async () => {
    try {
      const raw = localStorage.getItem(WB_PRINT_PENDING_SYNC_KEY);
      const pending: string[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(pending) || pending.length === 0) return;

      const { error } = await supabase
        .from('unified_honest_sign_codes')
        .update({ file_name: 'Напечатанные QR' })
        .in('code', pending);

      if (!error) localStorage.removeItem(WB_PRINT_PENDING_SYNC_KEY);
    } catch {}
  };

  const fetchCodesBySuppliers = async (supplierIds: string[]) => {
    const bySupplier: Record<string, Array<{ code: string; category?: string | null }>> = {};

    // Fetch all suppliers' codes concurrently instead of one-by-one.
    await Promise.all(supplierIds.map(async (supplierId) => {
      try {
        const { data: codes } = await supabase
          .from('unified_honest_sign_codes')
          .select('code, category')
          .eq('supplier_id', supplierId)
          .neq('file_name', 'Напечатанные QR')
          .order('created_at', { ascending: false })
          .limit(5000);

        bySupplier[supplierId] = (codes || []) as Array<{ code: string; category?: string | null }>;
      } catch {
        bySupplier[supplierId] = [];
      }
    }));

    return bySupplier;
  };

  const preparePrintCache = async () => {
    setIsPreparingPrintCache(true);
    setError(null);
    setPrintCacheStatus(null);
    try {
      const supplierIds = suppliers.filter(s => s.wb_api_token).map(s => s.id);
      if (!supplierIds.length) {
        setError('Нет поставщиков с WB токенами для подготовки кэша печати.');
        return;
      }

      const bySupplier = await fetchCodesBySuppliers(supplierIds);
      const preparedAt = new Date().toISOString();
      savePrintCodesCache({ preparedAt, bySupplier });
      await flushPendingPrintedCodes();
      setPrintCacheStatus({ ok: true, message: 'Кэш успешно подготовлен. Можно начинать печать.' });
    } catch (e: any) {
      setError(e?.message || 'Не удалось подготовить кэш печати.');
      setPrintCacheStatus({ ok: false, message: 'Подготовка кэша не удалась.' });
    } finally {
      setIsPreparingPrintCache(false);
    }
  };

  const checkPrintCacheReady = async () => {
    setIsCheckingPrintCache(true);
    setPrintCacheStatus(null);
    try {
      const cache = loadPrintCodesCache();
      if (!cache?.bySupplier) {
        setPrintCacheStatus({ ok: false, message: 'Кэш не найден. Нажмите «Подготовить к печати».' });
        return;
      }

      const supplierIds = suppliers.filter(s => s.wb_api_token).map(s => s.id);
      const supplierSet = new Set(supplierIds);
      const filtered = Object.entries(cache.bySupplier).filter(([sid]) => supplierSet.has(sid));
      const totalCodes = filtered.reduce((sum, [, codes]) => sum + (Array.isArray(codes) ? codes.length : 0), 0);

      if (filtered.length === 0) {
        setPrintCacheStatus({ ok: false, message: 'В кэше нет кодов для текущих поставщиков.' });
        return;
      }

      const preparedText = cache.preparedAt ? new Date(cache.preparedAt).toLocaleString('ru-RU') : 'неизвестно';
      setPrintCacheStatus({
        ok: totalCodes > 0,
        message: totalCodes > 0
          ? `Кэш готов: ${totalCodes} кодов, обновлён ${preparedText}. Можно печатать.`
          : `Кэш найден, но кодов 0 (обновлён ${preparedText}).`,
      });
    } catch {
      setPrintCacheStatus({ ok: false, message: 'Не удалось проверить кэш.' });
    } finally {
      setIsCheckingPrintCache(false);
    }
  };

  const fetchAllProducts = async (targetSupplierId?: string, mergeMode = false) => {
    setLoading(true);
    setError(null);
    const allProducts: WBProduct[] = [];
    const errors: string[] = [];

    const suppliersWithTokens = suppliers.filter(s => s.wb_api_token);

    if (suppliersWithTokens.length === 0) {
      setError('Нет поставщиков с токенами API Wildberries. Добавьте токены в настройках поставщиков.');
      setLoading(false);
      return;
    }

    const suppliersToLoad = targetSupplierId
      ? suppliersWithTokens.filter(s => s.id === targetSupplierId)
      : suppliersWithTokens;

    for (const supplier of suppliersToLoad) {
      try {
        let supplierCards: any[] = [];
        let cursor: any = { limit: 100 };
        let hasMore = true;

        while (hasMore) {
          const response = await fetchWithRetry('https://content-api.wildberries.ru/content/v2/get/cards/list', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': supplier.wb_api_token!.trim()
            },
            body: JSON.stringify({
              settings: {
                cursor,
                filter: { withPhoto: -1 }
              }
            })
          });

          if (!response.ok) {
            const text = await response.text();
            console.error(`WB API Error for ${supplier.name}:`, response.status, text);

            if (text.includes('X-Client-Secret is missing')) {
              throw new Error('Ошибка типа токена. Для загрузки товаров нужен токен "Стандартный" (не "Статистика" и не "Только чтение").');
            }

            throw new Error(`Ошибка ${response.status}: ${text.slice(0, 140)}`);
          }

          const data = await response.json();
          const cards = data.cards || [];
          const cardsWithSupplier = cards.map((card: any) => ({ ...card, supplierId: supplier.id }));
          supplierCards.push(...cardsWithSupplier);

          if (cards.length < 100) {
            hasMore = false;
          } else {
            cursor = {
              limit: 100,
              updatedAt: data.cursor?.updatedAt,
              nmID: data.cursor?.nmID
            };
          }

          if (supplierCards.length > 10000) break;
          await sleep(120);
        }

        allProducts.push(...supplierCards);
        await sleep(250);
      } catch (e: any) {
        console.error(`Failed to fetch for supplier ${supplier.name}`, e);
        errors.push(`${supplier.name}: ${e.message || 'Ошибка загрузки'}`);
      }
    }

    if (errors.length > 0) {
      if (allProducts.length > 0) {
        setError(`Загружено частично. Ошибки: ${errors.join(', ')}`);
      } else {
        setError(`Не удалось загрузить товары: ${errors.join(', ')}`);
      }
    }

    const finalProducts = mergeMode ? mergeProducts(products, allProducts) : allProducts;
    applyProductsState(finalProducts);

    try {
      await saveProductsToDb(allProducts);
    } catch (e: any) {
      console.error('Failed to save WB products to DB', e);
      setError(prev => prev || 'Не удалось сохранить товары WB в базу. Проверьте таблицу wb_products_cache и RLS.');
    }

    setLoading(false);
  };

  // Keep "Все поставщики" selected by default.

  const suppliersSyncKey = useMemo(() => {
    return suppliers
      .filter((s) => s.wb_api_token)
      .map((s) => `${s.id}:${String(s.wb_api_token || '').trim()}`)
      .sort()
      .join('|');
  }, [suppliers]);

  useEffect(() => {
    const cached = loadPrintCodesCache();
    if (cached?.preparedAt) setPrintCachePreparedAt(cached.preparedAt);
  }, []);

  useEffect(() => {
    if (!suppliersSyncKey) return;

    const suppliersWithTokens = suppliers.filter(s => s.wb_api_token);
    const supplierIds = suppliersWithTokens.map(s => s.id);

    if (supplierIds.length === 0) return;

    const init = async () => {
      try {
        // Не мигаем UI при фоновых синках, если уже есть данные
        if (products.length === 0) setLoading(true);
        setError(null);

        const browserCached = loadProductsFromBrowserCache(supplierIds);
        if (browserCached.length > 0 && products.length === 0) {
          applyProductsState(browserCached);
        }

        const dbProducts = await loadProductsFromDb(supplierIds);
        if (dbProducts.length > 0) {
          // Не теряем текущий список, добавляем/обновляем поверх
          applyProductsState(mergeProducts(products, dbProducts));
          setLoading(false);
          return;
        }

        // База пока пустая: если есть данные на экране или в кэше — не очищаем список.
        if (products.length > 0 || browserCached.length > 0) {
          setLoading(false);
          return;
        }

        setLoading(false);
        await fetchAllProducts(undefined, false);
      } catch (e: any) {
        console.error('Failed to load WB products from DB', e);
        setLoading(false);

        const browserCached = loadProductsFromBrowserCache(supplierIds);
        if (browserCached.length > 0 && products.length === 0) {
          applyProductsState(browserCached);
          setError('База временно недоступна. Показаны товары из кэша браузера.');
          return;
        }

        if (products.length === 0) {
          setError('Не удалось загрузить товары WB из базы. Проверьте таблицу wb_products_cache и RLS.');
        }
      }
    };

    init();
  }, [suppliersSyncKey]);

  const commitQuantity = (id: string, value: string) => {
    const qty = Math.max(0, parseInt(value || '0', 10) || 0);
    setQuantities(prev => {
      const current = prev[id] || 0;
      if (current === qty) return prev;
      return {
        ...prev,
        [id]: qty,
      };
    });
  };

  const commitQuantityDeferred = (id: string, value: string) => {
    setTimeout(() => commitQuantity(id, value), 120);
  };

  const updateQuantity = (id: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta),
    }));
  };

  const handleQuantityInput = (_id: string, value: string) => {
    if (!/^\d*$/.test(value)) return;
    // Uncontrolled input: do not commit on every keypress to avoid focus flicker.
  };

  const [printItems, setPrintItems] = useState<{ variant: ProductVariant; honestSignCode?: string; supplierName?: string }[]>([]);

  const normalizeHSCategory = (raw?: string | null) => {
    const value = String(raw || '').trim().toLowerCase();
    if (!value) return '';
    if (value === 'костюмы' || value === 'костюмы спортивные' || value === 'костюмы / костюмы спортивные') {
      return 'костюмы / костюмы спортивные';
    }
    return value;
  };

  const normalizeDataMatrixText = (raw: string) => {
    let value = String(raw || '').trim();
    // Remove control separators that often make scanners return only GTIN
    value = value.replace(/[\u001d\u001e\u001f]/g, '');
    // If code starts with AI(01) and has tail but misses AI(21), inject AI(21)
    if (value.startsWith('01') && value.length > 18) {
      const gtinPart = value.slice(0, 16); // 01 + 14 digits GTIN
      const tail = value.slice(16);
      if (!tail.startsWith('21')) {
        value = `${gtinPart}21${tail}`;
      }
    }
    return value;
  };

  const handlePrint = async (useCacheOnly = false, target: 'print' | 'pc' = 'print') => {
    const variantsToPrint = filteredVariants.flatMap(v => {
      const qty = Math.max(0, quantities[v.id] || 0);
      if (qty <= 0 || !v.barcode) return [] as ProductVariant[];
      return Array(qty).fill(v);
    });

    if (variantsToPrint.length === 0) return;

    // Open preview window synchronously (important for mobile popup blockers).
    // Для отправки на ПК окно не открываем.
    const preview = target === 'pc' ? null : window.open('', 'WBStickerPrintPreview', 'width=980,height=780');
    if (preview) {
      preview.document.write(`
        <html>
          <head><title>Подготовка печати...</title></head>
          <body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;font-family:Arial,sans-serif;color:#374151;background:#f9fafb;">
            <div id="wbPrintProgress">Подготавливаю PDF для печати...</div>
          </body>
        </html>
      `);
      preview.document.close();
    }

    setIsPrinting(true);
    
    // Group variants by supplier to fetch codes efficiently
    const items: { variant: ProductVariant; honestSignCode?: string; supplierName?: string }[] = [];
    const variantsBySupplier: Record<string, ProductVariant[]> = {};
    
    variantsToPrint.forEach(v => {
        const sid = v.product.supplierId || selectedSupplierId;
        if (sid) {
            if (!variantsBySupplier[sid]) variantsBySupplier[sid] = [];
            variantsBySupplier[sid].push(v);
        } else {
            items.push({ variant: v });
        }
    });

    let cachePayload = loadPrintCodesCache();

    if (!cachePayload || !cachePayload.bySupplier) {
      if (useCacheOnly) {
        setIsPrinting(false);
        alert('Кэш печати не подготовлен. Сначала нажмите «Подготовить к печати».');
        return;
      }
      const supplierIds = Object.keys(variantsBySupplier);
      const bySupplier = await fetchCodesBySuppliers(supplierIds);
      cachePayload = { preparedAt: new Date().toISOString(), bySupplier };
      savePrintCodesCache(cachePayload);
    }

    for (const [supplierId, variants] of Object.entries(variantsBySupplier)) {
      const supplier = suppliers.find(s => s.id === supplierId);
      const supplierName = supplier ? supplier.name : '';

      const availableCodes = Array.isArray(cachePayload.bySupplier[supplierId])
        ? [...cachePayload.bySupplier[supplierId]]
        : [];
      const usedCodes = new Set<string>();

      variants.forEach(v => {
        let code: { code: string; category?: string | null } | undefined;

        if (v.barcode) {
          const prefix = '010' + v.barcode;
          code = availableCodes.find(c => c.code.startsWith(prefix) && !usedCodes.has(c.code));
        }

        if (!code && v.product.subjectName) {
          const productCat = normalizeHSCategory(v.product.subjectName);
          const productCatAliases = new Set([
            productCat,
            String(v.product.subjectName || '').trim().toLowerCase(),
          ]);

          if (productCat === 'костюмы / костюмы спортивные') {
            productCatAliases.add('костюмы');
            productCatAliases.add('костюмы спортивные');
          }

          code = availableCodes.find(c => {
            if (!c.category || usedCodes.has(c.code)) return false;
            const dbCatRaw = String(c.category).trim().toLowerCase();
            const dbCatNorm = normalizeHSCategory(dbCatRaw);
            return productCatAliases.has(dbCatRaw) || productCatAliases.has(dbCatNorm);
          });
        }

        if (code) {
          usedCodes.add(code.code);
          items.push({ variant: v, honestSignCode: code.code, supplierName });
        } else {
          items.push({ variant: v, supplierName });
        }
      });

      if (usedCodes.size > 0) {
        cachePayload.bySupplier[supplierId] = availableCodes.filter(c => !usedCodes.has(c.code));
      }
    }

    savePrintCodesCache(cachePayload);
    
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [58, 40]
      });

      const layoutDefaults = {
        withChz: {
          dmX: 1.6, dmY: 1.8, dmSize: 22,
          dmTextX: 1.8, dmTextY: 24.9,
          textX: 24.8, textY: 5.8, titleFont: 8.1, titleGap: 0.0, textFont: 6.9, dataGap: 2.35,
          barcodeX: 24.8, barcodeY: 27.2, barcodeW: 29.0, barcodeH: 7.0, barcodeTextY: 38.35,
        },
        withoutChz: {
          barcodeX: 2.5, barcodeY: 1.3, barcodeW: 53, barcodeH: 9.8, barcodeTextY: 14.3,
          titleX: 2.0, titleY: 16.3, titleFont: 8.7, titleGap: 0.0, textFont: 8.4, dataGap: 2.65,
        }
      };

      let layout = layoutDefaults;
      try {
        let raw: string | null = localStorage.getItem('wb_label_layout_v1');

        // Запрос layout с таймаутом 5с: ресилиент-fetch клиента может тянуть до
        // 35с и держать «Подготавливаю PDF». Если есть localStorage — не ждём сеть.
        const layoutRows = raw ? null : await Promise.race([
          supabase.from('app_settings').select('value').eq('key', 'wb_label_layout_v1').limit(1).then((r) => r.data),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
        ]);

        const layoutRow = Array.isArray(layoutRows) ? layoutRows[0] : null;

        if (layoutRow?.value) {
          raw = String(layoutRow.value);
          localStorage.setItem('wb_label_layout_v1', raw);
        } else {
          raw = localStorage.getItem('wb_label_layout_v1');
        }

        if (raw) {
          const parsed = JSON.parse(raw);
          layout = {
            withChz: { ...layoutDefaults.withChz, ...(parsed?.withChz || {}) },
            withoutChz: { ...layoutDefaults.withoutChz, ...(parsed?.withoutChz || {}) },
          };
        }
      } catch {}

      // Load Fonts (Roboto)
      const fontUrls = [
        { url: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf', name: 'Roboto', style: 'normal' },
        { url: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf', name: 'Roboto', style: 'bold' }
      ];
      
      try {
          await Promise.all(fontUrls.map(async (font) => {
            let base64 = wbFontBase64Cache[font.url];
            if (!base64) {
              // Таймаут: на планшете/слабой сети fetch шрифта без отмены может
              // висеть бесконечно → «вечная подготовка PDF».
              const ac = new AbortController();
              const ft = setTimeout(() => ac.abort(), 8000);
              let res: Response;
              try { res = await fetch(font.url, { signal: ac.signal }); }
              finally { clearTimeout(ft); }
              if (!res.ok) throw new Error(`Failed to load ${font.url}`);
              const blob = await res.blob();
              base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
              wbFontBase64Cache[font.url] = base64;
            }
            doc.addFileToVFS(font.name + '-' + font.style + '.ttf', base64);
            doc.addFont(font.name + '-' + font.style + '.ttf', font.name, font.style);
          }));
          doc.setFont('Roboto');
      } catch (e) {
          console.error("Font loading failed, using default font", e);
          doc.setFont('Helvetica');
          alert("Не удалось загрузить шрифт для кириллицы. Текст может отображаться некорректно.");
      }
      
      const canvas = document.createElement('canvas');

      for (let i = 0; i < items.length; i++) {
        // Прогресс в окне + yield каждые 20 меток: на планшете большой тираж
        // генерируется секунды-десятки, без этого вкладка «висит» без признаков.
        if (i % 20 === 0) {
          try {
            if (preview && !preview.closed) {
              const el = preview.document.getElementById('wbPrintProgress');
              if (el) el.textContent = `Подготавливаю PDF… ${i} / ${items.length}`;
            }
          } catch {}
          await new Promise((r) => setTimeout(r, 0));
        }
        const item = items[i];
        const { variant, honestSignCode, supplierName } = item;
        const { product, size, barcode } = variant;
        const localEdit = localLabelEdits[variant.id];
        const articleText = localEdit?.article || String(product.nmID || '-');
        const modelNumberText = String(getModelNumber(variant) || '').trim();
        const sizeText = localEdit?.size || String(size.techSize || '-');
        const colorText = (localEdit?.color || String(getColor(product) || '-')).slice(0, 16);
        
        if (i > 0) doc.addPage([58, 40], 'landscape');
        
        const cleanBarcode = String(barcode || '').trim();
        const isEan13 = /^\d{13}$/.test(cleanBarcode);

        if (honestSignCode) {
          // Layout #1 (with ЧЗ): like sample — larger DM left, text right, barcode lower-right
          const dmText = normalizeDataMatrixText(honestSignCode);

          try {
            bwipjs.toCanvas(canvas, {
              bcid: 'datamatrix',
              text: dmText,
              binarytext: true,
              parsefnc: false,
              scale: 4,
              padding: 1,
              backgroundcolor: 'ffffff',
            });
            const dmImg = canvas.toDataURL('image/png');
            doc.addImage(dmImg, 'PNG', layout.withChz.dmX, layout.withChz.dmY, layout.withChz.dmSize, layout.withChz.dmSize);

            // Human-readable ЧЗ under DataMatrix (print full code incl. crypto tail)
            doc.setFontSize(3.6);
            doc.setFont('Roboto', 'normal');
            const dmLines = doc.splitTextToSize(dmText, Math.max(16, layout.withChz.dmSize - 0.4));
            doc.text(dmLines, layout.withChz.dmTextX, layout.withChz.dmTextY);
          } catch (e) {
            console.error('DataMatrix render error', e);
          }

          const rightX = layout.withChz.textX;
          let y = layout.withChz.textY;

          doc.setFontSize(layout.withChz.titleFont);
          doc.setFont('Roboto', 'bold');
          const splitTitle = doc.splitTextToSize(product.title || '', 28.8);
          doc.text(splitTitle.slice(0, 2), rightX, y);
          y += Math.min(2, splitTitle.length) * 2.0 + (layout.withChz.titleGap ?? 0);

          doc.setFontSize(layout.withChz.textFont);
          doc.setFont('Roboto', 'normal');
          const dataGap = layout.withChz.dataGap ?? 2.35;
          doc.text(`Артикул: ${articleText}`, rightX, y);
          y += dataGap;
          if (modelNumberText) {
            doc.text(`Модель: ${modelNumberText.slice(0, 18)}`, rightX, y);
            y += dataGap;
          }
          doc.text(`Размер: ${sizeText}`, rightX, y);
          y += dataGap;
          doc.text(`Цвет: ${colorText}`, rightX, y);
          y += dataGap;
          if (supplierName) {
            doc.text(`Поставщик: ${supplierName.slice(0, 18)}`, rightX, y);
          }

          if (cleanBarcode) {
            try {
              bwipjs.toCanvas(canvas, {
                bcid: isEan13 ? 'ean13' : 'code128',
                text: cleanBarcode,
                scale: 4,
                height: 8,
                includetext: false,
                paddingwidth: 0,
                paddingheight: 0,
              });
              const bcImg = canvas.toDataURL('image/png');
              doc.addImage(bcImg, 'PNG', layout.withChz.barcodeX, layout.withChz.barcodeY, layout.withChz.barcodeW, layout.withChz.barcodeH);

              doc.setFont('Helvetica', 'bold');
              doc.setFontSize(10.4);
              const withChzDigitsY = Math.max(layout.withChz.barcodeY + layout.withChz.barcodeH + 1.2, layout.withChz.barcodeTextY);
              doc.text(cleanBarcode, layout.withChz.barcodeX + (layout.withChz.barcodeW / 2), withChzDigitsY, { align: 'center' });
            } catch (e) {
              console.error('Barcode render error', e);
            }
          }
        } else {
          // Layout #2 (without ЧЗ): barcode top + centered text block
          if (cleanBarcode) {
            try {
              bwipjs.toCanvas(canvas, {
                bcid: isEan13 ? 'ean13' : 'code128',
                text: cleanBarcode,
                scale: 4,
                height: 11,
                includetext: false,
                paddingwidth: 0,
                paddingheight: 0,
              });
              const bcImg = canvas.toDataURL('image/png');
              doc.addImage(bcImg, 'PNG', layout.withoutChz.barcodeX, layout.withoutChz.barcodeY, layout.withoutChz.barcodeW, layout.withoutChz.barcodeH);

              doc.setFont('Helvetica', 'bold');
              doc.setFontSize(10.6);
              const withoutChzDigitsY = Math.max(layout.withoutChz.barcodeY + layout.withoutChz.barcodeH + 1.2, layout.withoutChz.barcodeTextY);
              doc.text(cleanBarcode, layout.withoutChz.barcodeX + (layout.withoutChz.barcodeW / 2), withoutChzDigitsY, { align: 'center' });
            } catch (e) {
              console.error('Top barcode render error', e);
            }
          }

          const textX = layout.withoutChz.titleX;
          const textW = Math.max(24, 56 - textX);
          let y = layout.withoutChz.titleY;
          doc.setFont('Roboto', 'bold');
          doc.setFontSize(layout.withoutChz.titleFont);
          const title = doc.splitTextToSize(product.title || '', textW);
          doc.text(title.slice(0, 3), textX, y);
          y += Math.min(3, title.length) * 2.25 + (layout.withoutChz.titleGap ?? 0);

          doc.setFont('Roboto', 'normal');
          doc.setFontSize(layout.withoutChz.textFont);
          const dataGap = layout.withoutChz.dataGap ?? 2.65;
          doc.text(`Артикул: ${articleText}`, textX, y);
          y += dataGap;
          if (modelNumberText) {
            doc.text(`Модель: ${modelNumberText.slice(0, 22)}`, textX, y);
            y += dataGap;
          }
          doc.text(`Размер: ${sizeText}`, textX, y);
          y += dataGap;
          doc.text(`Цвет: ${colorText}`, textX, y);
          y += dataGap;

          if (supplierName) {
            doc.text(`Поставщик: ${supplierName.slice(0, 18)}`, textX, y);
          }
        }
      }

      // Отправка на компьютер: грузим PDF в хранилище и создаём задание печати.
      if (target === 'pc') {
        try {
          const pdfBlob: Blob = doc.output('blob');
          const ts = Date.now();
          const path = `print-jobs/wb-stickers-${ts}.pdf`;
          const up = await supabase.storage.from('print_files').upload(path, pdfBlob, { contentType: 'application/pdf', upsert: true });
          if (up.error) throw up.error;
          const { data: pub } = supabase.storage.from('print_files').getPublicUrl(path);
          const firstSupId = Object.keys(variantsBySupplier)[0] || selectedSupplierId || null;
          const supName = items[0]?.supplierName || '';
          const { error: jobErr } = await supabase.from('print_jobs').insert({
            supplier_id: firstSupId || null,
            file_name: `Стикеры WB ${supName} (${items.length} шт)`,
            file_url: pub?.publicUrl || '',
            file_path: path,
            status: 'pending',
            created_by: 'Планшет',
          });
          if (jobErr) throw jobErr;
          setError(null);
          alert('Файл отправлен на компьютер. Откройте раздел печати на ПК — он распечатается там.');
        } catch (e: any) {
          setError('Не удалось отправить на ПК: ' + (e?.message || 'ошибка'));
        }
        // отметим коды как напечатанные ниже по общему коду
        const usedCodeValues = items.map(i => i.honestSignCode).filter(Boolean) as string[];
        if (usedCodeValues.length > 0) {
          try {
            const { error } = await supabase.from('unified_honest_sign_codes').update({ file_name: 'Напечатанные QR' }).in('code', usedCodeValues);
            if (error) queuePendingPrintedCodes(usedCodeValues);
          } catch { queuePendingPrintedCodes(usedCodeValues); }
        }
        setIsPrinting(false);
        return;
      }

      const blobUrl = doc.output('bloburl');
      if (!isDesktopView) {
        // Планшет/мобильный: прямой redirect popup на blob-URL часто «висит»
        // (iOS Safari/Android Chrome). Пишем в popup страницу со ссылкой на PDF
        // и авто-открытием — даже если авто-открытие заблокировано, есть кнопка.
        const fileName = `wb-stickers-${Date.now()}.pdf`;
        if (preview && !preview.closed) {
          preview.document.open();
          preview.document.write(`
            <html><head><title>PDF готов</title><meta name="viewport" content="width=device-width,initial-scale=1"></head>
            <body style="margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;gap:18px;font-family:Arial,sans-serif;background:#f9fafb;color:#374151;">
              <div style="font-size:16px;">PDF со стикерами готов</div>
              <a id="open" href="${blobUrl}" download="${fileName}" style="padding:14px 28px;background:#4f46e5;color:#fff;border-radius:12px;text-decoration:none;font-size:16px;font-weight:600;">Открыть / скачать PDF</a>
              <div style="font-size:12px;color:#9ca3af;">Если файл не открылся автоматически — нажмите кнопку</div>
              <script>setTimeout(function(){try{document.getElementById('open').click();}catch(e){}},300);</script>
            </body></html>
          `);
          preview.document.close();
        } else {
          doc.save(fileName);
        }
      } else if (preview) {
        preview.document.write(`
          <html>
            <head><title>Предпросмотр печати</title></head>
            <body style="margin:0;background:#f3f4f6;font-family:Arial,sans-serif;">
              <div style="padding:10px;display:flex;justify-content:space-between;align-items:center;background:#fff;border-bottom:1px solid #ddd;">
                <strong>Предпросмотр стикеров 58x40</strong>
                <button onclick="frames['pdfFrame'].focus();frames['pdfFrame'].print();" style="padding:8px 14px;border:none;background:#4f46e5;color:#fff;border-radius:8px;cursor:pointer;">Печать</button>
              </div>
              <iframe name="pdfFrame" src="${blobUrl}" style="width:100%;height:calc(100vh - 52px);border:0;"></iframe>
            </body>
          </html>
        `);
        preview.document.close();
      } else {
        // Fallback for strict mobile browsers that block popups
        doc.save(`wb-stickers-${Date.now()}.pdf`);
      }

      // Move used codes to "Printed QR" (best-effort + offline queue)
      const usedCodeValues = items.map(i => i.honestSignCode).filter(Boolean) as string[];
      if (usedCodeValues.length > 0) {
        try {
          const { error } = await supabase
            .from('unified_honest_sign_codes')
            .update({ file_name: 'Напечатанные QR' })
            .in('code', usedCodeValues);
          if (error) queuePendingPrintedCodes(usedCodeValues);
        } catch {
          queuePendingPrintedCodes(usedCodeValues);
        }
      }

    } catch (err) {
      console.error("PDF generation failed", err);
      alert("Ошибка при создании PDF файла");
    } finally {
      setIsPrinting(false);
      setPrintItems([]);
    }
  };

  const getColor = (product: WBProduct) => {
    if (!product.characteristics) return '-';
    
    const charObj = product.characteristics.find((c) => 
      (c.name && c.name.toLowerCase() === 'цвет') || 
      (c.Name && c.Name.toLowerCase() === 'цвет')
    );
    
    if (charObj) {
      const val = charObj.value ?? charObj.Value;
      return Array.isArray(val) ? (String(val[0] ?? '-')) : String(val ?? '-');
    }

    const charKey = product.characteristics.find((c) => 
      Object.keys(c).some(k => k.toLowerCase() === 'цвет')
    );
    
    if (charKey) {
      const key = Object.keys(charKey).find(k => k.toLowerCase() === 'цвет');
      return key ? String(charKey[key] ?? '-') : '-';
    }

    return '-';
  };

  const getModelEditKey = (variant: ProductVariant) => `model:${variant.product.nmID}`;

  const getModelNumber = (variant: ProductVariant) => (
    localLabelEdits[getModelEditKey(variant)]?.modelNumber ||
    localLabelEdits[variant.id]?.modelNumber ||
    ''
  );

  const normalizeSearchText = useCallback((value: unknown) => String(value || '')
    .toLowerCase()
    .replace(/[\s_]+/g, '')
    .replace(/[а]/g, 'a')
    .replace(/[в]/g, 'b')
    .replace(/[её]/g, 'e')
    .replace(/[к]/g, 'k')
    .replace(/[м]/g, 'm')
    .replace(/[н]/g, 'h')
    .replace(/[о]/g, 'o')
    .replace(/[р]/g, 'p')
    .replace(/[с]/g, 'c')
    .replace(/[т]/g, 't')
    .replace(/[у]/g, 'y')
    .replace(/[х]/g, 'x'), []);

  // Precompute the searchable strings once per products change (heavy regex work),
  // so each keystroke only does cheap substring checks instead of re-normalizing
  // every field of every variant.
  const allVariants = useMemo(() => (
    products.flatMap(p => {
      const brandValue = p.brand || (p.characteristics?.find((c: any) => c.name === 'Бренд')?.value as string | undefined);
      return (p.sizes || []).map(s => {
        const barcode = s.skus?.[0] || '';
        const searchRaw = `${p.title || ''}\n${p.vendorCode || ''}\n${p.nmID || ''}\n${barcode}`.toLowerCase();
        return {
          id: `${p.nmID}-${s.techSize}`,
          product: p,
          size: s,
          barcode,
          brandValue,
          searchRaw,
          searchNorm: normalizeSearchText(searchRaw),
        };
      });
    })
  ), [products, normalizeSearchText]);

  // Defer the heavy filtering off the keystroke path so typing stays responsive.
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const filteredVariants = useMemo(() => {
    const rawQ = deferredSearchQuery.toLowerCase();
    const q = normalizeSearchText(deferredSearchQuery);
    return allVariants.filter(v => {
      if (q) {
        let matchesSearch = v.searchRaw.includes(rawQ) || v.searchNorm.includes(q);
        if (!matchesSearch) {
          // Model number is the only field that can change live (local edits).
          const model = getModelNumber(v);
          if (model) {
            const mRaw = model.toLowerCase();
            matchesSearch = mRaw.includes(rawQ) || normalizeSearchText(model).includes(q);
          }
        }
        if (!matchesSearch) return false;
      }

      const matchesBrand = !selectedBrand || v.brandValue === selectedBrand;
      const matchesCategory = !selectedCategory || v.product.subjectName === selectedCategory;
      const matchesSupplier = !selectedSupplierId || v.product.supplierId === selectedSupplierId;

      return matchesBrand && matchesCategory && matchesSupplier;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allVariants, deferredSearchQuery, normalizeSearchText, selectedBrand, selectedCategory, selectedSupplierId, localLabelEdits]);

  const printCount = useMemo(() => {
    let total = 0;
    for (const v of filteredVariants) {
      if (!v.barcode) continue;
      total += Math.max(0, quantities[v.id] || 0);
    }
    return total;
  }, [filteredVariants, quantities]);

  const getWbProductUrl = (product: WBProduct) => {
    if (product?.nmID) return `https://www.wildberries.ru/catalog/${product.nmID}/detail.aspx`;
    const vc = String(product?.vendorCode || '').trim();
    if (vc) return `https://www.wildberries.ru/catalog/0/search.aspx?search=${encodeURIComponent(vc)}`;
    return 'https://www.wildberries.ru/';
  };

  const commitModelNumber = (variant: ProductVariant, value: string) => {
    const modelNumber = value.trim();
    const key = getModelEditKey(variant);
    const nmID = String(variant.product.nmID || '');

    setLocalLabelEdits((prev) => {
      const next = {
        ...prev,
        [key]: {
          article: nmID,
          size: '',
          color: '',
          ...(prev[key] || {}),
          modelNumber,
        },
      };

      const models: Record<string, string> = {};
      Object.entries(next).forEach(([editKey, editValue]) => {
        if (!editKey.startsWith('model:')) return;
        const id = editKey.replace(/^model:/, '');
        const model = String(editValue?.modelNumber || '').trim();
        if (id && model) models[id] = model;
      });

      const payload = JSON.stringify({ models, updatedAt: new Date().toISOString() });
      supabase
        .from('app_settings')
        .upsert([{ key: WB_MODEL_NUMBERS_SETTINGS_KEY, value: payload }], { onConflict: 'key' })
        .then(({ error }) => {
          if (error) console.warn('Failed to save WB model number to DB', error);
        });

      return next;
    });
  };

  const openEditModal = (variant: ProductVariant) => {
    const current = localLabelEdits[variant.id];
    setEditingVariant(variant);
    setEditDraft({
      article: current?.article || String(variant.product.nmID || ''),
      size: current?.size || String(variant.size.techSize || ''),
      color: current?.color || String(getColor(variant.product) || ''),
      modelNumber: getModelNumber(variant),
    });
  };

  const saveLocalEdit = () => {
    if (!editingVariant) return;
    setLocalLabelEdits((prev) => ({
      ...prev,
      [editingVariant.id]: {
        article: editDraft.article,
        size: editDraft.size,
        color: editDraft.color,
      },
    }));
    setEditingVariant(null);
  };

  // Tailwind breakpoints: md = 768px, 2xl = 1536px. Render only the layout that is
  // actually visible — otherwise React rebuilds the thousands of DOM nodes for the
  // CSS-hidden mobile & tablet lists on every keystroke/quantity change (huge INP).
  const isTabletView = useMediaQuery('(min-width: 768px) and (max-width: 1535px)');
  const isDesktopView = useMediaQuery('(min-width: 1536px)');
  const isMobileView = !isTabletView && !isDesktopView;

  const desktopRowHeight = 118;
  const desktopListHeight = typeof window !== 'undefined'
    ? Math.max(520, Math.min(1200, window.innerHeight - 220))
    : 700;

  // Tablet cards were rendered all at once (filteredVariants.map) — every quantity
  // change re-rendered hundreds of cards and froze the UI. Window them like the
  // desktop table: 1 column on md, 2 columns on lg, only visible rows render.
  const isLargeTablet = useMediaQuery('(min-width: 1024px)');
  const tabletColumns = isLargeTablet ? 2 : 1;
  const tabletRowHeight = 304;
  const tabletListHeight = typeof window !== 'undefined'
    ? Math.max(480, Math.min(1200, window.innerHeight - 240))
    : 700;
  const ProductTabletCard = useCallback(({ variant }: { variant: ProductVariant }) => {
    const qty = quantities[variant.id] || 0;
    return (
    <div className={`group relative h-full overflow-hidden rounded-2xl border bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${qty > 0 ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-slate-200 hover:border-indigo-200'}`}>
      {qty > 0 && (
        <span className="absolute right-2 top-2 z-10 inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white shadow">{qty}</span>
      )}
      <div className="flex h-full gap-3">
        <div className="w-20 shrink-0">
          <div className="h-28 w-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm">
            {variant.product.photos?.[0]?.c246x328 ? (
              <img
                src={variant.product.photos[0].c246x328}
                alt={variant.product.title}
                className="h-full w-full cursor-pointer object-cover transition-transform duration-300 group-hover:scale-105"
                onClick={() => setSelectedImage(variant.product.photos[0].big || variant.product.photos[0].c516x688 || variant.product.photos[0].c246x328)}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-300"><ImageIcon className="h-6 w-6" /></div>
            )}
          </div>
          <div className="mt-2 flex justify-center gap-1.5">
            <button onClick={() => openEditModal(variant)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200 text-amber-700 transition-colors hover:bg-amber-50 active:scale-95" title="Редактировать локально"><Pencil className="h-4 w-4" /></button>
            <a href={getWbProductUrl(variant.product)} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-200 text-indigo-600 transition-colors hover:bg-indigo-50 active:scale-95" title="Открыть на WB"><ExternalLink className="h-4 w-4" /></a>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900" title={variant.product.title}>{variant.product.title || 'Без названия'}</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500">ID: {variant.product.nmID}</span>
            {variant.product.vendorCode && <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500">Арт: {variant.product.vendorCode}</span>}
          </div>
          <input
            type="text"
            defaultValue={getModelNumber(variant)}
            onBlur={(e) => commitModelNumber(variant, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            placeholder="Номер модели"
            title="Номер модели общий для всех размеров этой карточки WB"
          />
          <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-600">
            <div className="min-w-0 truncate">Цвет: <span className="font-medium text-slate-700">{localLabelEdits[variant.id]?.color || getColor(variant.product)}</span></div>
            <span className="shrink-0 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">{localLabelEdits[variant.id]?.size || variant.size.techSize}</span>
          </div>
          <div className="mt-1.5 truncate rounded-md bg-slate-50 px-2 py-1 font-mono text-xs text-slate-500">{variant.barcode || '-'}</div>
          <div className="mt-auto flex items-center justify-end gap-1.5 pt-3">
            <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 p-1">
              <button onClick={() => updateQuantity(variant.id, -1)} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition hover:text-rose-600 active:scale-90"><Minus className="h-4 w-4" /></button>
              <input
                type="text"
                inputMode="numeric"
                defaultValue={String(quantities[variant.id] || 0)}
                onChange={(e) => handleQuantityInput(variant.id, e.target.value)}
                onBlur={(e) => commitQuantityDeferred(variant.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    commitQuantity(variant.id, (e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                className="h-9 w-12 rounded-lg border-0 bg-transparent p-0 text-center text-base font-semibold text-slate-900 outline-none"
              />
              <button onClick={() => updateQuantity(variant.id, 1)} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition hover:text-indigo-600 active:scale-90"><Plus className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  }, [commitModelNumber, commitQuantity, commitQuantityDeferred, getModelNumber, getWbProductUrl, handleQuantityInput, localLabelEdits, openEditModal, quantities, updateQuantity]);

  const TabletRow = useCallback(({ index, style }: ListChildComponentProps) => {
    const start = index * tabletColumns;
    const items = filteredVariants.slice(start, start + tabletColumns);
    if (!items.length) return null;
    return (
      <div style={style} className="px-3">
        <div className={`grid gap-3 ${tabletColumns === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {items.map((variant) => (
            <div key={variant.id} className="h-[292px]">
              <ProductTabletCard variant={variant} />
            </div>
          ))}
        </div>
      </div>
    );
  }, [filteredVariants, tabletColumns, ProductTabletCard]);

  const VirtualizedRow = useCallback(({ index, style }: ListChildComponentProps) => {
    const variant = filteredVariants[index];
    if (!variant) return null;

    const rowQty = quantities[variant.id] || 0;
    return (
      <div style={style} className="px-2 py-1">
        <div className={`grid grid-cols-[64px_1fr_96px_120px_160px_160px_120px] items-center gap-2 group rounded-xl border px-2 transition-all ${rowQty > 0 ? 'border-indigo-200 bg-indigo-50/40' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'}`}>
          <div className="p-2">
            <div className="w-12 h-16 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
              {variant.product.photos?.[0]?.c246x328 ? (
                <img
                  src={variant.product.photos[0].c246x328}
                  alt={variant.product.title}
                  className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                  onClick={() => setSelectedImage(variant.product.photos[0].big || variant.product.photos[0].c516x688 || variant.product.photos[0].c246x328)}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-300"><ImageIcon className="h-6 w-6" /></div>
              )}
            </div>
          </div>
          <div className="min-w-0">
            <div className="font-medium text-slate-900 truncate group-hover:text-indigo-600 transition-colors" title={variant.product.title}>{variant.product.title || 'Без названия'}</div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">ID: {variant.product.nmID}</span>
              {variant.product.vendorCode && <span className="text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">Арт: {variant.product.vendorCode}</span>}
            </div>
            <input
              type="text"
              defaultValue={getModelNumber(variant)}
              onBlur={(e) => commitModelNumber(variant, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              className="mt-2 w-full max-w-xs px-2.5 py-1.5 text-sm border border-slate-200 bg-slate-50 rounded-lg focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
              placeholder="Номер модели"
              title="Номер модели общий для всех размеров этой карточки WB"
            />
          </div>
          <div className="text-sm font-medium text-slate-700">{localLabelEdits[variant.id]?.color || getColor(variant.product)}</div>
          <div><span className="inline-block font-bold text-sm bg-gradient-to-br from-indigo-500 to-violet-500 text-white px-2.5 py-1 rounded-lg shadow-sm">{localLabelEdits[variant.id]?.size || variant.size.techSize}</span></div>
          <div><span className="font-mono text-sm text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">{variant.barcode || '-'}</span></div>
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 p-1">
              <button onClick={() => updateQuantity(variant.id, -1)} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition hover:text-rose-600 active:scale-90"><Minus className="h-4 w-4" /></button>
              <input
                type="text"
                inputMode="numeric"
                defaultValue={String(quantities[variant.id] || 0)}
                onChange={(e) => handleQuantityInput(variant.id, e.target.value)}
                onBlur={(e) => commitQuantityDeferred(variant.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    commitQuantity(variant.id, (e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                className="w-10 text-center p-0 bg-transparent border-0 text-sm font-semibold text-slate-900 outline-none"
              />
              <button onClick={() => updateQuantity(variant.id, 1)} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition hover:text-indigo-600 active:scale-90"><Plus className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="flex justify-center gap-1">
            <button onClick={() => openEditModal(variant)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors active:scale-95" title="Редактировать локально"><Pencil className="h-4 w-4" /></button>
            <a href={getWbProductUrl(variant.product)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors active:scale-95" title="Открыть на WB"><ExternalLink className="h-4 w-4" /></a>
          </div>
        </div>
      </div>
    );
  }, [filteredVariants, quantities, handleQuantityInput, commitQuantity, updateQuantity, localLabelEdits, openEditModal]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col 2xl:h-[calc(100vh-8rem)]">
      <div className="p-4 border-b border-slate-200 bg-white z-10 flex flex-col gap-4 no-print">
        <div className="flex flex-col 2xl:flex-row justify-between items-start 2xl:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-sm">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">Товары Wildberries</h2>
                <div className="mt-0.5 text-sm text-slate-500">Найдено вариантов: <span className="font-semibold text-slate-700">{filteredVariants.length}</span></div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 2xl:flex gap-2 w-full 2xl:w-auto">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`inline-flex min-w-0 items-center justify-center gap-1.5 min-h-[44px] rounded-xl border px-3 py-2 text-xs sm:text-sm 2xl:text-base font-medium leading-tight text-center whitespace-normal shadow-sm transition-all active:scale-[0.97] ${showFilters ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'}`}
                >
                    <Filter className="h-4 w-4 shrink-0" />
                    Фильтры
                </button>
                <button
                    onClick={() => fetchAllProducts(undefined, true)}
                    disabled={loading}
                    className="inline-flex min-w-0 items-center justify-center gap-1.5 min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm 2xl:text-base font-medium leading-tight text-center whitespace-normal text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-[0.97] disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 shrink-0 ${loading ? 'animate-spin' : ''}`} />
                    Обновить
                </button>
                <button
                    onClick={loadProductsFromWarehouseOffline}
                    disabled={loading}
                    className="inline-flex min-w-0 items-center justify-center gap-1.5 min-h-[44px] rounded-xl bg-slate-900 px-3 py-2 text-xs sm:text-sm 2xl:text-base font-medium leading-tight text-center whitespace-normal text-white shadow-sm transition-all hover:bg-slate-800 active:scale-[0.97] disabled:opacity-50"
                >
                    <Database className="h-4 w-4 shrink-0" />
                    Offline-база
                </button>
                <button
                    onClick={preparePrintCache}
                    disabled={isPreparingPrintCache}
                    className="inline-flex min-w-0 items-center justify-center gap-1.5 min-h-[44px] rounded-xl bg-amber-600 px-3 py-2 text-xs sm:text-sm 2xl:text-base font-medium leading-tight text-center whitespace-normal text-white shadow-sm shadow-amber-600/20 transition-all hover:bg-amber-700 active:scale-[0.97] disabled:opacity-50"
                >
                    {isPreparingPrintCache ? <RefreshCw className="h-4 w-4 shrink-0 animate-spin" /> : <Database className="h-4 w-4 shrink-0" />}
                    {isPreparingPrintCache ? 'Подготовка...' : 'Подготовить к печати'}
                </button>
                <button
                    onClick={checkPrintCacheReady}
                    disabled={isCheckingPrintCache}
                    className="inline-flex min-w-0 items-center justify-center gap-1.5 min-h-[44px] rounded-xl bg-sky-600 px-3 py-2 text-xs sm:text-sm 2xl:text-base font-medium leading-tight text-center whitespace-normal text-white shadow-sm shadow-sky-600/20 transition-all hover:bg-sky-700 active:scale-[0.97] disabled:opacity-50"
                >
                    {isCheckingPrintCache ? <RefreshCw className="h-4 w-4 shrink-0 animate-spin" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
                    {isCheckingPrintCache ? 'Проверка...' : 'Проверить кэш'}
                </button>
                <button
                    onClick={() => handlePrint(true)}
                    disabled={printCount === 0}
                    className={`inline-flex min-w-0 items-center justify-center gap-1.5 min-h-[44px] rounded-xl px-3 py-2 text-xs sm:text-sm 2xl:text-base font-medium leading-tight text-center whitespace-normal text-white shadow-sm transition-all active:scale-[0.97] ${printCount > 0 ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-slate-300 cursor-not-allowed'}`}
                >
                    <Printer className="h-4 w-4 shrink-0" />
                    Печать из кэша ({printCount})
                </button>
                <button
                    onClick={() => handlePrint(false)}
                    disabled={printCount === 0}
                    className={`inline-flex min-w-0 items-center justify-center gap-1.5 min-h-[44px] rounded-xl px-3 py-2 text-xs sm:text-sm 2xl:text-base font-medium leading-tight text-center whitespace-normal text-white shadow-sm transition-all active:scale-[0.97] ${printCount > 0 ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20' : 'bg-slate-300 cursor-not-allowed'}`}
                >
                    <Printer className="h-4 w-4 shrink-0" />
                    Печать онлайн ({printCount})
                </button>
                <button
                    onClick={() => handlePrint(false, 'pc')}
                    disabled={printCount === 0}
                    title="Отправить PDF на компьютер — распечатается там (для планшета без принтера)"
                    className={`inline-flex min-w-0 items-center justify-center gap-1.5 min-h-[44px] rounded-xl px-3 py-2 text-xs sm:text-sm 2xl:text-base font-medium leading-tight text-center whitespace-normal text-white shadow-sm transition-all active:scale-[0.97] ${printCount > 0 ? 'bg-violet-600 hover:bg-violet-700 shadow-violet-600/20' : 'bg-slate-300 cursor-not-allowed'}`}
                >
                    <Printer className="h-4 w-4 shrink-0" />
                    На компьютер ({printCount})
                </button>
                <button
                    onClick={() => { setQuantities({}); setPrintItems([]); }}
                    className="inline-flex min-w-0 items-center justify-center gap-1.5 min-h-[44px] rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs sm:text-sm 2xl:text-base font-medium leading-tight text-center whitespace-normal text-rose-700 shadow-sm transition-all hover:bg-rose-50 hover:border-rose-300 active:scale-[0.97]"
                >
                    <Trash2 className="h-4 w-4 shrink-0" />
                    Очистить выбор
                </button>
            </div>
        </div>

        <div className="text-xs text-slate-500">
          Кэш печати: {printCachePreparedAt ? `готов (${new Date(printCachePreparedAt).toLocaleString('ru-RU')})` : 'не подготовлен'}
        </div>
        {printCacheStatus && (
          <div className={`text-xs px-3 py-2 rounded-lg border ${printCacheStatus.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
            {printCacheStatus.message}
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 shadow-sm">
                <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Поставщик</label>
                    <select
                        value={selectedSupplierId}
                        onChange={(e) => setSelectedSupplierId(e.target.value)}
                        className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Все поставщики</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Бренд</label>
                    <select
                        value={selectedBrand}
                        onChange={(e) => setSelectedBrand(e.target.value)}
                        className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Все бренды</option>
                        {brands.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>
                <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Категория</label>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Все категории</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>
        )}

        {/* Search Bar - Full Width */}
        <div className="relative w-full">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск по названию, артикулу, баркоду или ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-10 shadow-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Очистить поиск">
                <X className="h-4 w-4" />
              </button>
            )}
        </div>
      </div>

      <div className="p-0 relative 2xl:flex-1 2xl:overflow-y-auto">
      {error && (
        <div className="bg-red-50 p-4 m-4 rounded-lg flex items-center text-red-700 no-print">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {/* Mobile Cards */}
      {isMobileView && (
      <div className="no-print md:hidden p-3 space-y-3">
        {filteredVariants.map((variant) => {
          const mQty = quantities[variant.id] || 0;
          return (
          <div key={variant.id} className={`relative rounded-2xl border bg-white p-3 shadow-sm transition-all ${mQty > 0 ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-slate-200'}`}>
            {mQty > 0 && (
              <span className="absolute right-2.5 top-2.5 inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white shadow">{mQty}</span>
            )}
            <div className="flex gap-3">
              <div className="w-16 h-20 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                {variant.product.photos?.[0]?.c246x328 ? (
                  <img
                    src={variant.product.photos[0].c246x328}
                    alt={variant.product.title}
                    className="w-full h-full object-cover"
                    onClick={() => setSelectedImage(variant.product.photos[0].big || variant.product.photos[0].c516x688 || variant.product.photos[0].c246x328)}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-300"><ImageIcon className="h-5 w-5" /></div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-900 text-sm line-clamp-2 pr-7">{variant.product.title || 'Без названия'}</div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500">ID: {variant.product.nmID}</span>
                  {variant.product.vendorCode && <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500">Арт: {variant.product.vendorCode}</span>}
                </div>
                <input
                  type="text"
                  defaultValue={getModelNumber(variant)}
                  onBlur={(e) => commitModelNumber(variant, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  }}
                  className="mt-2 w-full px-2.5 py-1.5 text-sm border border-slate-200 bg-slate-50 rounded-lg focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  placeholder="Номер модели"
                  title="Номер модели общий для всех размеров этой карточки WB"
                />
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                  <span>Цвет: <span className="font-medium text-slate-700">{localLabelEdits[variant.id]?.color || getColor(variant.product)}</span></span>
                  <span className="rounded-md bg-gradient-to-br from-indigo-500 to-violet-500 px-2 py-0.5 font-bold text-white shadow-sm">{localLabelEdits[variant.id]?.size || variant.size.techSize}</span>
                </div>
                <div className="text-xs font-mono text-slate-500 mt-1.5 break-all rounded-md bg-slate-50 px-2 py-1">{variant.barcode || '-'}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => openEditModal(variant)} className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-lg border border-amber-200 text-amber-700 bg-amber-50 active:scale-95"><Pencil className="h-3.5 w-3.5 mr-1"/>Редактировать</button>
                <a
                  href={getWbProductUrl(variant.product)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-lg border border-indigo-200 text-indigo-600 active:scale-95"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> WB
                </a>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 p-1">
                <button onClick={() => updateQuantity(variant.id, -1)} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm active:scale-90"><Minus className="h-4 w-4" /></button>
                <input
                  type="text"
                  inputMode="numeric"
                  defaultValue={String(quantities[variant.id] || 0)}
                  onChange={(e) => handleQuantityInput(variant.id, e.target.value)}
                  onBlur={(e) => commitQuantityDeferred(variant.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      commitQuantity(variant.id, (e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  className="w-11 text-center p-0 bg-transparent border-0 text-base font-semibold text-slate-900 outline-none"
                />
                <button onClick={() => updateQuantity(variant.id, 1)} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm active:scale-90"><Plus className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
          );
        })}
        {filteredVariants.length === 0 && !loading && (
          <div className="p-8 text-center text-slate-500 text-sm">Товары не найдены. Проверьте фильтры или нажмите «Обновить».</div>
        )}
        {loading && (
          <div className="p-8 text-center text-slate-500"><Loader2 className="h-7 w-7 mx-auto animate-spin text-indigo-600" /></div>
        )}
      </div>
      )}

      {/* Tablet Cards (virtualized) */}
      {isTabletView && (
      <div className="no-print py-3">
        {loading && <div className="p-12 text-center text-slate-500"><Loader2 className="h-8 w-8 mx-auto animate-spin text-indigo-600" /><p className="mt-2">Загрузка товаров...</p></div>}
        {!loading && filteredVariants.length === 0 && <div className="p-12 text-center text-slate-500"><Package className="h-12 w-12 mx-auto mb-4 text-slate-300" /><p className="text-lg font-medium">Товары не найдены</p></div>}
        {!loading && filteredVariants.length > 0 && (
          <List
            height={tabletListHeight}
            itemCount={Math.ceil(filteredVariants.length / tabletColumns)}
            itemSize={tabletRowHeight}
            width="100%"
          >
            {TabletRow}
          </List>
        )}
      </div>
      )}

      {/* Table View (virtualized) */}
      {isDesktopView && (
      <div className="no-print hidden 2xl:block px-2 pb-2">
        <div className="grid grid-cols-[64px_1fr_96px_120px_160px_160px_120px] items-center gap-2 bg-slate-50 border-y border-slate-200 px-4 py-3 text-sm font-medium text-slate-500">
          <div>Фото</div><div>Наименование</div><div>Цвет</div><div>Размер</div><div>Баркод</div><div className="text-center">Количество</div><div className="text-center">Действия</div>
        </div>
        {loading && <div className="p-12 text-center text-slate-500"><Loader2 className="h-8 w-8 mx-auto animate-spin text-indigo-600" /><p className="mt-2">Загрузка товаров...</p></div>}
        {!loading && filteredVariants.length === 0 && <div className="p-12 text-center text-slate-500"><Package className="h-12 w-12 mx-auto mb-4 text-slate-300" /><p className="text-lg font-medium">Товары не найдены</p></div>}
        {!loading && filteredVariants.length > 0 && (
          <List height={desktopListHeight} itemCount={filteredVariants.length} itemSize={desktopRowHeight} width="100%">
            {VirtualizedRow}
          </List>
        )}
      </div>
      )}

      {/* Print Area (Hidden on screen, used for PDF generation) */}
      <div className={`print-only ${isPrinting ? 'fixed left-0 top-0 z-[-1000]' : 'hidden'}`}>
        {(isPrinting ? printItems : []).map((item, index) => (
          <Sticker key={`${item.variant.id}-${index}`} variant={item.variant} honestSignCode={item.honestSignCode} supplierName={item.supplierName} />
        ))}
      </div>

      {editingVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 backdrop-blur-sm p-4" onClick={() => setEditingVariant(null)}>
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20"><Pencil className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Этикетка</div>
                <h3 className="truncate text-lg font-bold leading-tight">Локальное редактирование</h3>
              </div>
              <button onClick={() => setEditingVariant(null)} className="rounded-xl p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6">
              <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">Изменения сохраняются только на этом устройстве, без записи в базу данных.</p>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Артикул</label>
                  <input type="text" value={editDraft.article} onChange={(e) => setEditDraft(prev => ({ ...prev, article: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 outline-none focus:ring-2 focus:ring-amber-500" placeholder="Артикул" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Размер</label>
                    <input type="text" value={editDraft.size} onChange={(e) => setEditDraft(prev => ({ ...prev, size: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 outline-none focus:ring-2 focus:ring-amber-500" placeholder="Размер" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Цвет</label>
                    <input type="text" value={editDraft.color} onChange={(e) => setEditDraft(prev => ({ ...prev, color: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 outline-none focus:ring-2 focus:ring-amber-500" placeholder="Цвет" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <button onClick={() => setEditingVariant(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Отмена</button>
              <button onClick={saveLocalEdit} className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-700">Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/85 p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-slate-300 transition-colors"
            >
              <X className="h-8 w-8" />
            </button>
            <img 
              src={selectedImage} 
              alt="Full size" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export const WBProducts = React.memo(WBProductsComponent);
