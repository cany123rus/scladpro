import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Package, 
  RefreshCw, 
  CheckSquare, 
  Square, 
  Plus, 
  FileText, 
  Printer, 
  Barcode, 
  Loader2, 
  AlertCircle,
  Truck,
  Calendar,
  Search,
  Filter,
  Download,
  ShoppingCart,
  X,
  LayoutGrid,
  List,
  Calculator,
  FileSpreadsheet,
  Upload
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import JsBarcode from 'jsbarcode';
import html2canvas from 'html2canvas';
import bwipjs from 'bwip-js';
import ExcelJS from 'exceljs/dist/exceljs.min.js';
import { supabase } from '../lib/supabase';

// --- Types ---

interface Supplier {
  id: string;
  name: string;
  wb_api_token?: string;
}

interface WBOrder {
  id: number;
  rid: string;
  createdAt: string;
  warehouseId: number;
  supplyId: string | null;
  priority: number;
  skus: string[];
  price: number;
  convertedPrice: number;
  currencyCode: number;
  convertedCurrencyCode: number;
  orderUid: string;
  article: string;
  color: string;
  size: string;
  title: string;
  brand?: string;
  sticker?: any;
  nmId?: number;
  photoUrl?: string;
  is_selected?: boolean; // UI state
}

interface WBSupply {
  id: string;
  name: string;
  createdAt: string;
  closedAt: string | null;
  isOpen: boolean;
  done: boolean;
}

interface ProductCard {
  nmID: number;
  vendorCode: string; // article
  title: string;
  description: string;
  brand: string;
  techSize: string;
  wbSize: string;
  photos: { big: string; tm: string; small: string }[];
  dimensions: { length: number; width: number; height: number };
  characteristics: { name: string; value: any }[];
  sizes: { techSize: string; wbSize: string; skus: string[]; chrtID?: number; chrtId?: number; stock?: number; totalStock?: number }[];
}

interface SupplyOrderItem extends ProductCard {
  orderQuantity: number;
  selectedSize: string;
}

interface FbsSupplyScanSavedItem {
  storageKey: string;
  stickerDigits: string;
  stickerScanText?: string;
  honestSignCode: string;
  updatedAt: string;
  orderId?: string;
  title?: string;
  article?: string;
  size?: string;
}

interface FbsSupplyScanOrderRow {
  storageKey: string;
  orderId: string;
  title: string;
  article: string;
  size: string;
  stickerDigits: string;
  stickerText: string;
  stickerScanText: string;
}

interface FbsSupplyScanSheetMeta {
  updatedAt: string;
  totalRows: number;
  rowsWithSticker: number;
  rowsWithScanText: number;
  isFullyReady: boolean;
  source?: 'wb' | 'upload' | 'cache';
}

// --- Helper Functions ---

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('ru-RU');
};

const generateSupplyName = () => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const HH = String(now.getHours()).padStart(2, '0');
  const MM = String(now.getMinutes()).padStart(2, '0');
  return `Поставка_${dd}${mm}${yyyy}_${HH}${MM}`;
};

const getWBImageUrls = (nmId: number) => {
  const vol = ~~(nmId / 100000);
  const part = ~~(nmId / 1000);
  let host = 'basket-01.wbbasket.ru';
  if (vol >= 0 && vol <= 143) host = 'basket-01.wbbasket.ru';
  else if (vol >= 144 && vol <= 287) host = 'basket-02.wbbasket.ru';
  else if (vol >= 288 && vol <= 431) host = 'basket-03.wbbasket.ru';
  else if (vol >= 432 && vol <= 719) host = 'basket-04.wbbasket.ru';
  else if (vol >= 720 && vol <= 1007) host = 'basket-05.wbbasket.ru';
  else if (vol >= 1008 && vol <= 1061) host = 'basket-06.wbbasket.ru';
  else if (vol >= 1062 && vol <= 1115) host = 'basket-07.wbbasket.ru';
  else if (vol >= 1116 && vol <= 1169) host = 'basket-08.wbbasket.ru';
  else if (vol >= 1170 && vol <= 1313) host = 'basket-09.wbbasket.ru';
  else if (vol >= 1314 && vol <= 1601) host = 'basket-10.wbbasket.ru';
  else if (vol >= 1602 && vol <= 1655) host = 'basket-11.wbbasket.ru';
  else if (vol >= 1656 && vol <= 1919) host = 'basket-12.wbbasket.ru';
  else if (vol >= 1920 && vol <= 2045) host = 'basket-13.wbbasket.ru';
  else if (vol >= 2046 && vol <= 2189) host = 'basket-14.wbbasket.ru';
  else if (vol >= 2190 && vol <= 2405) host = 'basket-15.wbbasket.ru';
  else if (vol >= 2406 && vol <= 2621) host = 'basket-16.wbbasket.ru';
  else if (vol >= 2622 && vol <= 2837) host = 'basket-17.wbbasket.ru';
  else if (vol >= 2838 && vol <= 3053) host = 'basket-18.wbbasket.ru';
  else if (vol >= 3054 && vol <= 3269) host = 'basket-19.wbbasket.ru';
  else if (vol >= 3270 && vol <= 3485) host = 'basket-20.wbbasket.ru';
  else if (vol >= 3486 && vol <= 3701) host = 'basket-21.wbbasket.ru';
  else host = 'basket-22.wbbasket.ru';

  const base = `https://${host}/vol${vol}/part${part}/${nmId}/images`;
  return [
    `${base}/c516x688/1.jpg`,
    `${base}/big/1.jpg`,
    `${base}/c516x688/2.jpg`,
    `${base}/big/2.jpg`,
    `${base}/c246x328/1.jpg`,
  ];
};

const getWBImageUrl = (nmId: number) => getWBImageUrls(nmId)[0];

const compareSizeStrings = (a: string, b: string) => {
    const sizeA = String(a || '').toUpperCase();
    const sizeB = String(b || '').toUpperCase();
    
    // Try numeric comparison first
    const numA = parseFloat(sizeA.replace(',', '.'));
    const numB = parseFloat(sizeB.replace(',', '.'));
    
    if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
    }
    
    // Try standard size order
    const order = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', '5XL', '6XL'];
    const indexA = order.indexOf(sizeA);
    const indexB = order.indexOf(sizeB);
    
    if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
    }
    
    if (indexA !== -1) return -1; 
    if (indexB !== -1) return 1;
    
    // Fallback to string comparison
    return sizeA.localeCompare(sizeB);
};

const sortSizes = (sizes: any[]) => {
    return [...sizes].sort((a, b) => {
        return compareSizeStrings(a.techSize || a.size, b.techSize || b.size);
    });
};

const normalizeKey = (v: any) => String(v ?? '').toLowerCase().replace(/\s+/g, '').replace(',', '.').trim();
const normalizeBarcode = (v: any) => {
  const raw = String(v ?? '').trim();
  const digits = raw.replace(/\D+/g, '');
  return digits || raw;
};
const normalizeVendorCode = (v: any) => normalizeKey(v);

// --- Component ---

const normalizeStickerDigits = (value: string) => {
  const digits = String(value || '').replace(/\D+/g, '');
  return digits || '';
};

const pickStickerDigits = (primaryRaw: any, part1Raw?: any, part2Raw?: any) => {
  const primary = normalizeStickerDigits(String(primaryRaw || ''));
  if (primary.length >= 8 && primary.length <= 14) return primary;

  const p1 = normalizeStickerDigits(String(part1Raw || ''));
  const p2 = normalizeStickerDigits(String(part2Raw || ''));

  // Common WB format: part1 (short) + part2 (4 digits)
  if (p1.length >= 4 && p1.length <= 10 && p2.length === 4) return `${p1}${p2}`;

  // Some responses return useful sticker only in part2
  if (p2.length >= 8 && p2.length <= 12) return p2;

  // Last-resort: parse any safe label-like fragment from concatenated text
  const joined = `${String(primaryRaw || '')} ${String(part1Raw || '')} ${String(part2Raw || '')}`;
  const m = joined.match(/(\d{4,10})\D+(\d{4})(?!\d)/);
  if (m) return `${m[1]}${m[2]}`;

  return '';
};

const formatStickerDigits = (digits: string) => {
  const clean = normalizeStickerDigits(digits);
  if (!clean) return '-';
  if (clean.length <= 4) return clean;
  return `${clean.slice(0, -4)}_${clean.slice(-4)}`;
};

const normalizeDataMatrixText = (raw: string) => {
  let value = String(raw || '').trim();
  value = value.replace(/[\u001d\u001e\u001f]/g, '');
  if (value.startsWith('01') && value.length > 18) {
    const gtinPart = value.slice(0, 16);
    const tail = value.slice(16);
    if (!tail.startsWith('21')) {
      value = `${gtinPart}21${tail}`;
    }
  }
  return value;
};

const normalizeScanStickerText = (raw: string) => String(raw || '')
  .replace(/[\r\n\t]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const normalizeScannedStickerLookupText = (raw: string) => normalizeScanStickerText(raw)
  .replace(/^\][A-Za-z0-9]{2}/, '')
  .trim();

const normalizeScannedStickerLookupKey = (raw: string) => normalizeScannedStickerLookupText(raw).toUpperCase();

const extractSvgStickerScanText = (svgBase64: string) => {
  try {
    const svg = atob(String(svgBase64 || ''));
    const decodeEntities = (input: string) => input
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');

    const texts = Array.from(svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/gi))
      .map((m) => decodeEntities(String(m?.[1] || '')).replace(/<[^>]+>/g, ''))
      .map((value) => normalizeScanStickerText(value))
      .filter(Boolean);

    const candidates = texts.filter((value) => {
      if (!value || value.length < 6 || value.length > 32) return false;
      if (/\s/.test(value)) return false;
      if (!/[A-Za-z]/.test(value)) return false;
      if (/^(wildberries|wb)$/i.test(value)) return false;
      return true;
    });

    const preferred = candidates.find((value) => /[*/+=]/.test(value))
      || candidates.find((value) => /[a-z]/.test(value) && /[A-Z]/.test(value))
      || candidates[0];

    return normalizeScanStickerText(preferred || '');
  } catch {
    return '';
  }
};

const isGarbageStickerScanText = (value: string) => {
  const normalized = normalizeScanStickerText(value);
  if (!normalized) return true;
  if (normalized === '[object Object]') return true;
  if (/^\d{10,}\.\d+\.\d+$/.test(normalized)) return true;
  if (/^e[A-Za-z0-9]+\.[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)+$/i.test(normalized)) return true;
  return false;
};

const looksReadableStickerScanText = (value: string) => {
  const normalized = normalizeScanStickerText(value);
  if (!normalized || isGarbageStickerScanText(normalized)) return false;
  if (normalized.startsWith('*')) return true;
  if (/^[A-Za-z0-9/+_-]{6,24}$/.test(normalized) && /[A-Za-z]/.test(normalized)) return true;
  return false;
};

const extractAutoStickerScanText = (order: any) => {
  const fromStickerFile = extractSvgStickerScanText(String(order?.sticker?.file || order?.file || ''));
  if (looksReadableStickerScanText(fromStickerFile)) return fromStickerFile;

  const candidates = [
    order?.stickerScanText,
    order?.sticker_scan_text,
    order?.scanStickerText,
    order?.barcode,
    order?.barcodeText,
    order?.barcode_text,
  ];

  let numericFallback = '';
  for (const candidate of candidates) {
    const value = normalizeScanStickerText(String(candidate ?? ''));
    if (!value || value === '[object Object]') continue;
    if (isGarbageStickerScanText(value)) continue;

    const digits = normalizeStickerDigits(value);
    const formattedDigits = digits ? formatStickerDigits(digits) : '';
    if (digits && (value === digits || value === formattedDigits)) {
      if (!numericFallback) numericFallback = value;
      continue;
    }

    if (looksReadableStickerScanText(value)) return value;
  }

  return numericFallback;
};

const normalizeFbsStorageKey = (row: { stickerDigits?: string; stickerScanText?: string; orderId?: string }) => {
  const stickerDigits = normalizeStickerDigits(String(row?.stickerDigits || ''));
  if (stickerDigits) return `sticker:${stickerDigits}`;
  const stickerScanText = normalizeScanStickerText(String(row?.stickerScanText || ''));
  if (stickerScanText) return `scan:${stickerScanText}`;
  return `order:${String(row?.orderId || '').trim()}`;
};

const normalizeBlockName = (v: string) => String(v || '')
  .toLowerCase()
  .replace(/ё/g, 'е')
  .replace(/["'`’.,;:!?()\[\]{}\\/|+-]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const normalizeNmKey = (v: any) => {
  const s = String(v ?? '').trim();
  const digits = s.replace(/\D+/g, '');
  if (digits) return String(Number(digits));
  return s;
};

const findBlockBySourceName = (source: string, blockByItem: Map<string, string>) => {
  const ns = normalizeBlockName(source || '');
  const nsCompact = ns.replace(/\s+/g, '');
  let grouped = blockByItem.get(ns) || '';
  if (grouped) return grouped;
  for (const [k, blockName] of blockByItem.entries()) {
    const kCompact = String(k || '').replace(/\s+/g, '');
    if (!k) continue;
    if (ns.includes(k) || k.includes(ns) || nsCompact.includes(kCompact) || kCompact.includes(nsCompact)) {
      grouped = blockName;
      break;
    }
  }
  return grouped || source;
};

const withTimeout = async <T,>(p: Promise<T>, ms: number, label = 'Timeout') => {
  return await Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(label)), ms)),
  ]);
};

const getSafeId = () => (globalThis?.crypto && typeof globalThis.crypto.randomUUID === 'function'
  ? globalThis.crypto.randomUUID()
  : `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`);

const getImageCandidates = (photoUrl?: string, nmId?: number, extraUrls: string[] = []) => {
  const list: string[] = [];

  const push = (v?: string) => {
    const s = String(v || '').trim();
    if (!s) return;
    list.push(s);
  };

  push(photoUrl);
  extraUrls.forEach(push);
  if (Number.isFinite(Number(nmId)) && Number(nmId) > 0) {
    try { getWBImageUrls(Number(nmId)).forEach(push); } catch {}
  }

  return Array.from(new Set(list));
};

type WBSupplyManagerTab = 'fbs' | 'supply_order' | 'fbs_calc' | 'fbs_orders' | 'fbo_acceptance';

export const WBSupplyManager = ({
  suppliers = [],
  initialTab = 'fbs',
  embeddedTab,
}: {
  suppliers?: Supplier[];
  initialTab?: WBSupplyManagerTab;
  embeddedTab?: WBSupplyManagerTab;
}) => {
  const forcedTab = embeddedTab || null;
  const embeddedMode = Boolean(forcedTab);

  // --- State ---
  const [activeTab, setActiveTab] = useState<WBSupplyManagerTab>(forcedTab || initialTab);
  const fbsOrdersNamespace = activeTab === 'fbo_acceptance' ? 'fbo_acceptance' : 'fbs_orders';
  const fbsOrdersTabTitle = activeTab === 'fbo_acceptance' ? 'Приемка ФБО' : 'Заказы ФБС';
  const fbsMetricLabel = activeTab === 'fbo_acceptance' ? 'товара' : 'заданий';

  useEffect(() => {
    if (forcedTab && activeTab !== forcedTab) {
      setActiveTab(forcedTab);
    }
  }, [forcedTab, activeTab]);

  useEffect(() => {
    // Do not carry unsaved report between "Заказы ФБС" and "Приемка ФБО"
    if (activeTab === 'fbs_orders' || activeTab === 'fbo_acceptance') {
      setFbsOrdersRows([]);
      setFbsOrdersGroups([]);
      setFbsOrdersPeriod({});
      setFbsOrdersExpanded({});
    }
    // "Загружено N новых заказов" is relevant only in Управление ФБС
    if (activeTab !== 'fbs' && /новых заказ/i.test(String(successMsg || ''))) {
      setSuccessMsg(null);
    }
  }, [activeTab]);
  const [selectedSupplierIdFbs, setSelectedSupplierIdFbs] = useState<string>('');
  const [selectedSupplierIdSupplyOrder, setSelectedSupplierIdSupplyOrder] = useState<string>('');
  const [selectedSupplierIdCalc, setSelectedSupplierIdCalc] = useState<string>('');
  const [selectedSupplierIdFbsOrders, setSelectedSupplierIdFbsOrders] = useState<string>('');
  const [selectedSupplierIdFboAcceptance, setSelectedSupplierIdFboAcceptance] = useState<string>('');
  const selectedSupplierId = activeTab === 'fbs'
    ? selectedSupplierIdFbs
    : activeTab === 'supply_order'
      ? selectedSupplierIdSupplyOrder
      : activeTab === 'fbs_calc'
        ? selectedSupplierIdCalc
        : activeTab === 'fbo_acceptance'
          ? selectedSupplierIdFboAcceptance
          : selectedSupplierIdFbsOrders;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Orders
  const [orders, setOrders] = useState<WBOrder[]>([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());

  // Supplies
  const [supplies, setSupplies] = useState<WBSupply[]>([]);
  const [activeSupplyId, setActiveSupplyId] = useState<string | null>(null);
  const [showCreateSupplyModal, setShowCreateSupplyModal] = useState(false);
  const [newSupplyName, setNewSupplyName] = useState('');
  const [showAllSupplies, setShowAllSupplies] = useState(true);
  const [fbsScanModalOpen, setFbsScanModalOpen] = useState(false);
  const [fbsScanLoading, setFbsScanLoading] = useState(false);
  const [fbsScanRows, setFbsScanRows] = useState<FbsSupplyScanOrderRow[]>([]);
  const [fbsScansBySticker, setFbsScansBySticker] = useState<Record<string, FbsSupplyScanSavedItem>>({});
  const [fbsScanMode, setFbsScanMode] = useState<'sticker' | 'honest_sign'>('sticker');
  const [fbsScanInputValue, setFbsScanInputValue] = useState('');
  const [fbsPendingStickerRow, setFbsPendingStickerRow] = useState<FbsSupplyScanOrderRow | null>(null);
  const [fbsScanNotice, setFbsScanNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const fbsScanInputRef = useRef<HTMLInputElement | null>(null);
  const lastFbsFetchRef = useRef<{ supplierId: string; ts: number } | null>(null);
  const cachedPdfFontRef = useRef<string | null>(null);
  const groupedImageCacheRef = useRef<Map<string, string>>(new Map());
  const pdfImageCacheRef = useRef<Map<string, string>>(new Map());
  const wbStickerMetaCacheRef = useRef<Map<string, { stickerDigits: string; stickerScanText: string }>>(new Map());

  // Supply Order (Заказ поставщику)
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [supplyOrderItems, setSupplyOrderItems] = useState<Record<string, number>>({}); // key: nmId_size, value: quantity
  const [productSearch, setProductSearch] = useState('');
  const [showFilledOrderCards, setShowFilledOrderCards] = useState(false);
  const [generatedOrderPdf, setGeneratedOrderPdf] = useState<{ fileName: string; dataUrl: string; totalQty: number; totalCost: number } | null>(null);
  const [orderHistory, setOrderHistory] = useState<Array<{ id: string; supplierId: string; supplierName: string; createdAt: string; fileName: string; dataUrl: string; totalQty: number; totalCost: number }>>([]);
  const [orderHistoryOpen, setOrderHistoryOpen] = useState(false);
  const [orderPdfNameModalOpen, setOrderPdfNameModalOpen] = useState(false);
  // Порядок товаров в отчёте (nmID -> позиция, 1..N). Пустой = порядок по умолчанию.
  const [orderArrangeOpen, setOrderArrangeOpen] = useState(false);
  const [orderArrangeSeq, setOrderArrangeSeq] = useState<Record<number, number>>({});
  const [orderPdfFileName, setOrderPdfFileName] = useState('');
  const [orderMissingCostsModalOpen, setOrderMissingCostsModalOpen] = useState(false);
  const [pendingOrderExport, setPendingOrderExport] = useState<null | { type: 'pdf'; fileName?: string } | { type: 'excel' }>(null);

  // FBS Orders file calc
  const [fbsOrdersLoading, setFbsOrdersLoading] = useState(false);
  const [fbsOrdersRows, setFbsOrdersRows] = useState<Array<{ wbArticle: string; name: string; sourceName?: string; tasks: number }>>([]);
  const [fbsOrdersGroups, setFbsOrdersGroups] = useState<Array<{ name: string; totalTasks: number; articles: Array<{ wbArticle: string; tasks: number }>; subNames?: Array<{ name: string; totalTasks: number }> }>>([]);
  const [fbsOrdersPeriod, setFbsOrdersPeriod] = useState<{ start?: string; end?: string }>({});
  const [fbsOrdersExpanded, setFbsOrdersExpanded] = useState<Record<string, boolean>>({});
  const [fbsOrdersHistory, setFbsOrdersHistory] = useState<Array<{ id: string; supplierId: string; supplierName: string; createdAt: string; periodStart?: string; periodEnd?: string; warehouseName?: string; supplyDate?: string; boxes?: number; pallets?: number; totalTasks: number; groups: Array<{ name: string; totalTasks: number; subNames?: Array<{ name: string; totalTasks: number }> }> }>>([]);
  const [fbsSaveMetaOpen, setFbsSaveMetaOpen] = useState(false);
  const [fbsSaveMetaEditId, setFbsSaveMetaEditId] = useState<string | null>(null);
  const [fbsSaveBoxes, setFbsSaveBoxes] = useState('');
  const [fbsSavePallets, setFbsSavePallets] = useState('');
  const [fbsSaveWarehouseName, setFbsSaveWarehouseName] = useState('');
  const [fbsSaveSupplyDate, setFbsSaveSupplyDate] = useState('');
  const [fbsOrdersHistoryOpen, setFbsOrdersHistoryOpen] = useState(false);
  const [fbsRenameRulesOpen, setFbsRenameRulesOpen] = useState(false);
  const [fbsRenameRules, setFbsRenameRules] = useState<Array<{ article: string; name: string }>>([]);
  const [fbsBlockGroups, setFbsBlockGroups] = useState<Array<{ name: string; items: string[] }>>([]);
  const [fbsNewBlockName, setFbsNewBlockName] = useState('');
  const [fbsNewBlockItems, setFbsNewBlockItems] = useState<string[]>([]);
  const [fbsEditingBlockName, setFbsEditingBlockName] = useState('');
  const [fbsEditingBlockItems, setFbsEditingBlockItems] = useState<string[]>([]);

  const fbsAllSuppliersSummary = useMemo(() => {
    const blockByItem = new Map<string, string>();
    (fbsBlockGroups || []).forEach((bg: any) => {
      const blockName = String(bg?.name || '').trim();
      if (!blockName) return;
      (Array.isArray(bg?.items) ? bg.items : []).forEach((it: any) => {
        const key = normalizeBlockName(String(it || ''));
        if (key) blockByItem.set(key, blockName);
      });
    });

    const supplierIds = new Set<string>();
    let totalBoxes = 0;
    let totalPallets = 0;
    const acc: Record<string, number> = {};
    (fbsOrdersHistory || []).forEach((h: any) => {
      if (h?.supplierId) supplierIds.add(String(h.supplierId));
      totalBoxes += Number(h?.boxes || 0) || 0;
      totalPallets += Number(h?.pallets || 0) || 0;
      (h?.groups || []).forEach((g: any) => {
        const subNames = Array.isArray(g?.subNames) && g.subNames.length
          ? g.subNames.map((s: any) => ({ name: String(s?.name || '').trim(), totalTasks: Number(s?.totalTasks || 0) }))
          : [{ name: String(g?.name || '').trim(), totalTasks: Number(g?.totalTasks || 0) }];

        subNames.forEach((sn: any) => {
          if (!sn?.name) return;
          const target = findBlockBySourceName(sn.name, blockByItem);
          acc[target] = (acc[target] || 0) + Number(sn.totalTasks || 0);
        });
      });
    });

    const items = Object.entries(acc)
      .sort((a: any, b: any) => Number(b[1]) - Number(a[1]) || String(a[0]).localeCompare(String(b[0]), 'ru'));

    return {
      items,
      total: items.reduce((s, [, total]) => s + Number(total || 0), 0),
      suppliersCount: supplierIds.size,
      blocksCount: items.length,
      totalBoxes,
      totalPallets,
    };
  }, [fbsOrdersHistory, fbsBlockGroups]);

  // FBS Calc
  const [calcSupplyId, setCalcSupplyId] = useState<string>('');
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcRows, setCalcRows] = useState<Array<{ key: string; nmId?: number; article: string; title: string; qty: number; sizes: string[] }>>([]);
  const [calcCostOverrides, setCalcCostOverrides] = useState<Record<string, number>>({});
  const [orderCostOverrides, setOrderCostOverrides] = useState<Record<string, number>>({});
  const [orderCostEditorOpen, setOrderCostEditorOpen] = useState(false);
  const [orderCostEditorValues, setOrderCostEditorValues] = useState<Record<string, string>>({});
  const [calcHistory, setCalcHistory] = useState<Array<{ id: string; supplyId: string; supplyName: string; createdAt: string; totalCost: number; rows: Array<{ key: string; nmId?: number; article: string; title: string; qty: number; sizes: string[] }>; costOverrides: Record<string, number> }>>([]);
  const [calcHistoryOpen, setCalcHistoryOpen] = useState(false);
  const [calcHistoryPeriodStart, setCalcHistoryPeriodStart] = useState('');
  const [calcHistoryPeriodEnd, setCalcHistoryPeriodEnd] = useState('');
  const [calcCostEditorOpen, setCalcCostEditorOpen] = useState(false);
  const [calcCostEditorSearch, setCalcCostEditorSearch] = useState('');
  const [calcCostEditorValues, setCalcCostEditorValues] = useState<Record<string, string>>({});
  const [calcMissingCostOnly, setCalcMissingCostOnly] = useState(false);
  const [calcPhotoByNmId, setCalcPhotoByNmId] = useState<Record<string, string>>({});

  const getCalcCostKeyCandidates = (row: any) => {
    const nmId = String(row?.nmId || '').trim();
    const article = String(row?.article || '').trim();
    const title = String(row?.title || '').trim();
    const key = String(row?.key || '').trim();
    return Array.from(new Set([key, nmId, article ? `article:${article}` : '', title ? `title:${title}` : ''].filter(Boolean)));
  };

  const getCalcStoredCost = (row: any, overrides?: Record<string, number>) => {
    const source = overrides || calcCostOverrides || {};
    for (const candidate of getCalcCostKeyCandidates(row)) {
      const value = Number(source?.[candidate] || 0);
      if (value > 0) return value;
    }
    return 0;
  };

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Orders chart (Supply Order tab)
  const [productChartModal, setProductChartModal] = useState<{ open: boolean; product: ProductCard | null }>({ open: false, product: null });
  const [productChartRange, setProductChartRange] = useState(() => {
    const end = new Date();
    const start = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
    };
  });
  const [productChartData, setProductChartData] = useState<{ date: string; qty: number; bySize: Record<string, number> }[]>([]);
  const [loadingProductChart, setLoadingProductChart] = useState(false);
  const [hiddenChartSizes, setHiddenChartSizes] = useState<string[]>([]);

  // Extract filters
  useEffect(() => {
      if (products.length > 0) {
          const extractedBrands = Array.from(new Set(products.map(p => p.brand || p.characteristics?.find((c: any) => c.name === 'Бренд')?.value).filter(Boolean))) as string[];
          const extractedCategories = Array.from(new Set(products.map(p => (p as any).subjectName).filter(Boolean))) as string[];
          setBrands(extractedBrands.sort());
          setCategories(extractedCategories.sort());
      }
  }, [products]);

  // --- Effects ---

  useEffect(() => {
    if (suppliers.length === 0) return;
    if (!selectedSupplierIdFbs) setSelectedSupplierIdFbs(suppliers[0].id);
    if (!selectedSupplierIdSupplyOrder) setSelectedSupplierIdSupplyOrder(suppliers[0].id);
    if (!selectedSupplierIdCalc) setSelectedSupplierIdCalc(suppliers[0].id);
    if (!selectedSupplierIdFbsOrders) setSelectedSupplierIdFbsOrders('__all__');
    if (!selectedSupplierIdFboAcceptance) setSelectedSupplierIdFboAcceptance('__all__');
  }, [suppliers, selectedSupplierIdFbs, selectedSupplierIdSupplyOrder, selectedSupplierIdCalc, selectedSupplierIdFbsOrders, selectedSupplierIdFboAcceptance]);

  useEffect(() => {
    const loadFbsOrdersMeta = async () => {
      if (!selectedSupplierId) {
        setFbsOrdersHistory([]);
        setFbsRenameRules([]);
        return;
      }
      let historyForInfer: any[] = [];
      try {
        if (selectedSupplierId === '__all__') {
          const keys = (suppliers || []).map((s) => `${fbsOrdersNamespace}_history_v1:${s.id}`);
          const { data } = keys.length ? await supabase.from('app_settings').select('key, value').in('key', keys as any) : { data: [] as any };
          const merged = (data || []).flatMap((row: any) => {
            const parsed = row?.value ? (typeof row.value === 'string' ? JSON.parse(row.value) : row.value) : [];
            return Array.isArray(parsed) ? parsed : [];
          });
          historyForInfer = merged;
          setFbsOrdersHistory(merged);
        } else {
          const key = `${fbsOrdersNamespace}_history_v1:${selectedSupplierId}`;
          const { data } = await supabase.from('app_settings').select('value').eq('key', key).maybeSingle();
          const parsed = data?.value ? (typeof data.value === 'string' ? JSON.parse(data.value) : data.value) : [];
          historyForInfer = Array.isArray(parsed) ? parsed : [];
          setFbsOrdersHistory(historyForInfer);
        }
      } catch {
        historyForInfer = [];
        setFbsOrdersHistory([]);
      }

      try {
        const keyRules = `fbs_common_rename_rules_v1:${selectedSupplierId}`;
        let parsed: any = null;
        if (selectedSupplierId !== '__all__') {
          const { data } = await supabase.from('app_settings').select('value').eq('key', keyRules).maybeSingle();
          parsed = data?.value ? (typeof data.value === 'string' ? JSON.parse(data.value) : data.value) : null;
        }

        // migration with strict priority: FBO rules are source of truth
        const keyFbo = `fbo_acceptance_rename_rules_v1:${selectedSupplierId}`;
        const keyFbs = `fbs_orders_rename_rules_v1:${selectedSupplierId}`;
        const renameKeys = selectedSupplierId === '__all__'
          ? (suppliers || []).flatMap((s) => [`fbo_acceptance_rename_rules_v1:${s.id}`, `fbs_orders_rename_rules_v1:${s.id}`, `fbs_common_rename_rules_v1:${s.id}`])
          : [keyFbo, keyFbs];
        const { data: oldRows } = renameKeys.length ? await supabase.from('app_settings').select('key, value').in('key', renameKeys as any) : { data: [] as any };
        const rowFbo: any = (oldRows || []).find((r: any) => String(r?.key || '') === keyFbo);
        const rowFbs: any = (oldRows || []).find((r: any) => String(r?.key || '') === keyFbs);
        const parsedFbo = rowFbo?.value ? (typeof rowFbo.value === 'string' ? JSON.parse(rowFbo.value) : rowFbo.value) : null;
        const parsedFbs = rowFbs?.value ? (typeof rowFbs.value === 'string' ? JSON.parse(rowFbs.value) : rowFbs.value) : null;

        if (selectedSupplierId === '__all__') {
          const mergedRules = new Map<string, string>();
          (oldRows || []).forEach((row: any) => {
            const parsedRow = row?.value ? (typeof row.value === 'string' ? JSON.parse(row.value) : row.value) : [];
            (Array.isArray(parsedRow) ? parsedRow : []).forEach((r: any) => {
              const article = String(r?.article || '').trim();
              const name = String(r?.name || '').trim();
              if (article && name && !mergedRules.has(article)) mergedRules.set(article, name);
            });
          });
          parsed = Array.from(mergedRules.entries()).map(([article, name]) => ({ article, name }));
        } else if ((!Array.isArray(parsed) || !parsed.length) && Array.isArray(parsedFbo) && parsedFbo.length > 0) {
          parsed = parsedFbo;
          await supabase.from('app_settings').upsert([{ key: keyRules, value: JSON.stringify(parsed) }], { onConflict: 'key' });
        } else if ((!Array.isArray(parsed) || !parsed.length) && Array.isArray(parsedFbs) && parsedFbs.length > 0) {
          parsed = parsedFbs;
          await supabase.from('app_settings').upsert([{ key: keyRules, value: JSON.stringify(parsed) }], { onConflict: 'key' });
        }

        if (Array.isArray(parsed) && parsed.length) {
          setFbsRenameRules(parsed.map((r: any) => ({ article: String(r?.article || ''), name: String(r?.name || '') })));
        } else {
          const supplierName = suppliers.find((s) => String(s.id) === String(selectedSupplierId))?.name || '';
          setFbsRenameRules(getDefaultFbsRenameRules(supplierName));
        }
      } catch {
        const supplierName = suppliers.find((s) => String(s.id) === String(selectedSupplierId))?.name || '';
        setFbsRenameRules(getDefaultFbsRenameRules(supplierName));
      }

      try {
        const keyBlocks = `fbs_common_block_groups_v1:${selectedSupplierId}`;
        let parsedCommon: any = [];
        if (selectedSupplierId !== '__all__') {
          const { data } = await supabase.from('app_settings').select('value').eq('key', keyBlocks).maybeSingle();
          parsedCommon = data?.value ? (typeof data.value === 'string' ? JSON.parse(data.value) : data.value) : [];
        }

        const keyFbo = `fbo_acceptance_block_groups_v1:${selectedSupplierId}`;
        const keyFbs = `fbs_orders_block_groups_v1:${selectedSupplierId}`;
        const blockKeys = selectedSupplierId === '__all__'
          ? (suppliers || []).flatMap((s) => [`fbo_acceptance_block_groups_v1:${s.id}`, `fbs_orders_block_groups_v1:${s.id}`, `fbs_common_block_groups_v1:${s.id}`])
          : [keyFbo, keyFbs];
        const { data: oldRows } = blockKeys.length ? await supabase.from('app_settings').select('key, value').in('key', blockKeys as any) : { data: [] as any };
        const rowFbo: any = (oldRows || []).find((r: any) => String(r?.key || '') === keyFbo);
        const rowFbs: any = (oldRows || []).find((r: any) => String(r?.key || '') === keyFbs);
        const parsedFbo = rowFbo?.value ? (typeof rowFbo.value === 'string' ? JSON.parse(rowFbo.value) : rowFbo.value) : [];
        const parsedFbs = rowFbs?.value ? (typeof rowFbs.value === 'string' ? JSON.parse(rowFbs.value) : rowFbs.value) : [];
        const parsedAllBlockRows = selectedSupplierId === '__all__'
          ? (oldRows || []).flatMap((r: any) => {
              const parsed = r?.value ? (typeof r.value === 'string' ? JSON.parse(r.value) : r.value) : [];
              return Array.isArray(parsed) ? [parsed] : [];
            })
          : [];

        const mergeBlocks = (...lists: any[][]) => {
          const m = new Map<string, { name: string; items: string[] }>();
          lists.forEach((lst) => {
            (Array.isArray(lst) ? lst : []).forEach((x: any) => {
              const name = String(x?.name || '').trim();
              if (!name) return;
              const key = normalizeBlockName(name);
              const items = Array.from(new Set((Array.isArray(x?.items) ? x.items : []).map((i: any) => String(i || '').trim()).filter(Boolean)));
              if (!m.has(key)) {
                m.set(key, { name, items });
              } else {
                const prev = m.get(key)!;
                const mergedItems = Array.from(new Set([...(prev.items || []), ...items]));
                m.set(key, { name: prev.name || name, items: mergedItems });
              }
            });
          });
          return Array.from(m.values());
        };

        let loadedBlocks = (selectedSupplierId === '__all__'
          ? mergeBlocks(...(parsedAllBlockRows as any))
          : mergeBlocks(parsedCommon as any, parsedFbo as any, parsedFbs as any))
          .filter((b: any) => String(b?.name || '').trim() && Array.isArray(b?.items) && b.items.length > 0);

        // Backfill missing block rules from history (if a report contains grouped block with subNames)
        const inferred: Array<{ name: string; items: string[] }> = [];
        (Array.isArray(historyForInfer) ? historyForInfer : []).forEach((h: any) => {
          (h?.groups || []).forEach((g: any) => {
            const gName = String(g?.name || '').trim();
            const sub = Array.isArray(g?.subNames) ? g.subNames.map((s: any) => String(s?.name || '').trim()).filter(Boolean) : [];
            if (!gName || sub.length === 0) return;
            if (!loadedBlocks.some((b) => String(b.name) === gName) && !inferred.some((b) => String(b.name) === gName)) {
              inferred.push({ name: gName, items: Array.from(new Set(sub)) });
            }
          });
        });

        const mergedBlocks = [...loadedBlocks, ...inferred];
        setFbsBlockGroups(mergedBlocks);
        if (selectedSupplierId !== '__all__') {
          await supabase.from('app_settings').upsert([{ key: keyBlocks, value: JSON.stringify(mergedBlocks) }], { onConflict: 'key' });
        }
      } catch {
        setFbsBlockGroups([]);
      }
    };
    loadFbsOrdersMeta();
  }, [selectedSupplierId, suppliers, fbsOrdersNamespace]);

  useEffect(() => {
    const loadCalcMeta = async () => {
      if (!selectedSupplierId) {
        setCalcCostOverrides({});
        setCalcPhotoByNmId({});
        setCalcHistory([]);
        return;
      }

      // 1) load persisted costs from DB
      try {
        const key = `fbs_calc_cost_overrides_v1:${selectedSupplierId}`;
        const { data } = await supabase.from('app_settings').select('value').eq('key', key).maybeSingle();
        const parsed = data?.value ? (typeof data.value === 'string' ? JSON.parse(data.value) : data.value) : {};
        const normalized = parsed && typeof parsed === 'object' ? parsed : {};
        setCalcCostOverrides(normalized);
      } catch {
        setCalcCostOverrides({});
      }

      // 1.1) load saved calc history from DB
      try {
        const key = `fbs_calc_history_v1:${selectedSupplierId}`;
        const { data } = await supabase.from('app_settings').select('value').eq('key', key).maybeSingle();
        const parsed = data?.value ? (typeof data.value === 'string' ? JSON.parse(data.value) : data.value) : [];
        setCalcHistory(Array.isArray(parsed) ? parsed : []);
      } catch {
        setCalcHistory([]);
      }

      // 2) load photo map by nm_id from wb_products_cache (as in WB Products)
      try {
        const { data: cacheRows } = await supabase
          .from('wb_products_cache')
          .select('nm_id, product_json')
          .eq('supplier_id', selectedSupplierId)
          .limit(10000);

        const next: Record<string, string> = {};
        (cacheRows || []).forEach((r: any) => {
          const nm = String(r?.nm_id || r?.product_json?.nmID || '').trim();
          const p = r?.product_json || {};
          const first = (Array.isArray(p?.photos) && p.photos[0]) || '';
          let src = typeof first === 'string' ? first : (first?.big || first?.tm || first?.c246x328 || '');
          src = String(src || '').trim();
          if (src.startsWith('//')) src = `https:${src}`;
          if (nm && /^https?:\/\//i.test(src)) next[nm] = src;
        });
        setCalcPhotoByNmId(next);
      } catch {
        setCalcPhotoByNmId({});
      }
    };

    loadCalcMeta();
  }, [selectedSupplierId]);

  useEffect(() => {
    const persist = async () => {
      if (!selectedSupplierId) return;
      try {
        const key = `fbs_calc_cost_overrides_v1:${selectedSupplierId}`;
        await supabase.from('app_settings').upsert([{ key, value: JSON.stringify(calcCostOverrides || {}) }], { onConflict: 'key' });
      } catch {}
    };
    persist();
  }, [calcCostOverrides, selectedSupplierId]);

  useEffect(() => {
    const loadOrderCosts = async () => {
      if (!selectedSupplierIdSupplyOrder) {
        setOrderCostOverrides({});
        return;
      }
      try {
        const key = `supply_order_cost_overrides_v1:${selectedSupplierIdSupplyOrder}`;
        const { data } = await supabase.from('app_settings').select('value').eq('key', key).maybeSingle();
        const parsed = data?.value ? (typeof data.value === 'string' ? JSON.parse(data.value) : data.value) : {};
        setOrderCostOverrides(parsed && typeof parsed === 'object' ? parsed : {});
      } catch {
        setOrderCostOverrides({});
      }
    };
    loadOrderCosts();
  }, [selectedSupplierIdSupplyOrder]);

  useEffect(() => {
    const loadOrderHistory = async () => {
      if (!selectedSupplierId) {
        setOrderHistory([]);
        return;
      }
      try {
        const key = `supplier_order_history_v1:${selectedSupplierId}`;
        const { data } = await supabase.from('app_settings').select('value').eq('key', key).maybeSingle();
        const parsed = data?.value ? (typeof data.value === 'string' ? JSON.parse(data.value) : data.value) : [];
        setOrderHistory(Array.isArray(parsed) ? parsed : []);
      } catch {
        setOrderHistory([]);
      }
    };
    loadOrderHistory();
  }, [selectedSupplierId]);

  // Track current token to trigger updates
  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);
  const currentToken = selectedSupplier?.wb_api_token;

  // Clear data when supplier changes
  useEffect(() => {
    if (selectedSupplierId) {
      setOrders([]);
      setSupplies([]);
      setActiveSupplyId(null);
      setSelectedOrderIds(new Set());
      setSuccessMsg(null);
      setError(null);
      setProducts([]);
      setSupplyOrderItems({});
      setCalcSupplyId('');
      setCalcRows([]);
      
      // Auto-fetch data for the new supplier if in FBS/FBS Calc tabs (with small TTL cache)
      if (activeTab === 'fbs' || activeTab === 'fbs_calc') {
          const now = Date.now();
          const shouldSkipFetch =
            lastFbsFetchRef.current?.supplierId === selectedSupplierId &&
            now - lastFbsFetchRef.current.ts < 60_000;

          if (shouldSkipFetch) return;

          const timer = setTimeout(() => {
            fetchNewOrders();
            fetchSupplies();
            lastFbsFetchRef.current = { supplierId: selectedSupplierId, ts: Date.now() };
          }, 100);
          return () => clearTimeout(timer);
      }
    }
  }, [selectedSupplierId, currentToken, activeTab]);

  useEffect(() => {
    if (!fbsScanModalOpen || fbsScanLoading) return;
    const timer = setTimeout(() => {
      try {
        fbsScanInputRef.current?.focus({ preventScroll: true });
      } catch {
        fbsScanInputRef.current?.focus();
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [fbsScanModalOpen, fbsScanLoading, fbsScanMode, fbsPendingStickerRow]);

  // --- API Helpers ---

  const getSupplierToken = () => selectedSupplier?.wb_api_token?.trim();

  const wbFetch = async (url: string, options: RequestInit = {}) => {
    const token = getSupplierToken();
    if (!token) throw new Error('Токен API не найден');

    let lastError: unknown;

    for (let attempt = 0; attempt < 3; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      try {
        const res = await fetch(url, {
          ...options,
          cache: 'no-store',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token,
            ...options.headers,
          },
        });

        clearTimeout(timeout);

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`WB API Error: ${res.status} ${text}`);
        }

        if (res.status === 204) return {};
        const text = await res.text();
        return text ? JSON.parse(text) : {};
      } catch (error) {
        clearTimeout(timeout);
        lastError = error;

        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 700 * (attempt + 1)));
          continue;
        }
      }
    }

    const msg = lastError instanceof Error ? lastError.message : String(lastError || 'Unknown network error');
    throw new Error(`Ошибка сети WB API (Failed to fetch): ${msg}. Проверьте интернет/VPN/доступ к marketplace-api.wildberries.ru`);
  };

  const loadImageDataUrls = async (urls: string[], concurrency = 10) => {
    const unique = Array.from(new Set(urls.filter(Boolean)));
    const result = new Map<string, string>();

    // 1) fill from cache
    unique.forEach((u) => {
      const cached = pdfImageCacheRef.current.get(u);
      if (cached) result.set(u, cached);
    });

    const queue = unique.filter((u) => !result.has(u));
    if (queue.length === 0) return result;

    const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
      while (queue.length > 0) {
        const url = queue.shift();
        if (!url) break;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        try {
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeout);
          const blob = await response.blob();

          const pngDataUrl = await new Promise<string>((resolve, reject) => {
            const img = new Image();
            const objUrl = URL.createObjectURL(blob);

            img.onload = () => {
              try {
                const srcW = img.naturalWidth || img.width;
                const srcH = img.naturalHeight || img.height;
                const maxSide = 260; // stronger downscale for faster generation and smaller single PDF
                const scale = Math.min(1, maxSide / Math.max(srcW, srcH));
                const w = Math.max(1, Math.round(srcW * scale));
                const h = Math.max(1, Math.round(srcH * scale));

                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error('Canvas context unavailable');
                ctx.drawImage(img, 0, 0, w, h);
                const out = canvas.toDataURL('image/jpeg', 0.7);
                URL.revokeObjectURL(objUrl);
                resolve(out);
              } catch (e) {
                URL.revokeObjectURL(objUrl);
                reject(e);
              }
            };

            img.onerror = () => {
              URL.revokeObjectURL(objUrl);
              reject(new Error('Image decode failed'));
            };

            img.src = objUrl;
          });

          result.set(url, pngDataUrl);
          pdfImageCacheRef.current.set(url, pngDataUrl);
        } catch {
          clearTimeout(timeout);
          // ignore broken image url
        }
      }
    });

    await Promise.all(workers);
    return result;
  };
  // --- Actions: Orders ---

  const fetchNewOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await wbFetch('https://marketplace-api.wildberries.ru/api/v3/orders/new');
      const newOrders = data.orders || [];
      setOrders(newOrders);
      setSuccessMsg(`Загружено ${newOrders.length} новых заказов`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    const newSet = new Set(selectedOrderIds);
    if (newSet.has(orderId)) {
      newSet.delete(orderId);
    } else {
      newSet.add(orderId);
    }
    setSelectedOrderIds(newSet);
  };

  const toggleAllOrders = () => {
    if (selectedOrderIds.size === orders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(orders.map(o => o.id.toString())));
    }
  };

  // --- Actions: Supplies ---

  const fetchSellerCards = async () => {
    const token = getSupplierToken();
    if (!token) return { map: {}, list: [] };

    const processCards = (allCards: any[]) => {
        const map: Record<string, any> = {};
        allCards.forEach((c: any) => {
            map[c.vendorCode] = c;
            map[`nm_${c.nmID}`] = c;
            if (c.vendorCode) {
                map[c.vendorCode.trim()] = c;
                map[c.vendorCode.toLowerCase().trim()] = c;
            }
        });
        return { map, list: allCards };
    };

    const fetchFromContentApi = async () => {
        let allCards: any[] = [];
        let cursor: any = { limit: 100 };
        let hasMore = true;

        const fetchPage = async (payload: any) => {
            let lastErr: any;
            for (let attempt = 0; attempt < 3; attempt++) {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 15000);
                try {
                    const res = await fetch('https://content-api.wildberries.ru/content/v2/get/cards/list', {
                        method: 'POST',
                        signal: controller.signal,
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': token,
                        },
                        body: JSON.stringify(payload)
                    });
                    clearTimeout(timeout);

                    if (!res.ok) {
                        const text = await res.text();
                        throw new Error(`${res.status} ${text}`);
                    }

                    return await res.json();
                } catch (e: any) {
                    clearTimeout(timeout);
                    lastErr = e;
                    if (attempt < 2) await new Promise(r => setTimeout(r, 700 * (attempt + 1)));
                }
            }
            throw lastErr;
        };

        while (hasMore) {
            const data = await fetchPage({
                settings: {
                    cursor,
                    filter: { withPhoto: -1 }
                }
            });

            const cards = data.cards || [];
            allCards = [...allCards, ...cards];

            if (cards.length < 100) {
                hasMore = false;
            } else {
                cursor = {
                    limit: 100,
                    updatedAt: data.cursor?.updatedAt,
                    nmID: data.cursor?.nmID
                };
            }
            if (allCards.length > 10000) break;
        }
        return allCards;
    };

    try {
        const cards = await fetchFromContentApi();
        return processCards(cards);
    } catch (e: any) {
        console.error("Fetch cards error:", e);
        throw e;
    }
  };

  const fetchPublicProductDetails = async (nmIds: number[]) => {
    if (nmIds.length === 0) return {};
    
    const uniqueIds = Array.from(new Set(nmIds)).filter(id => id);
    const chunks = [];
    const chunkSize = 50; 
    
    for (let i = 0; i < uniqueIds.length; i += chunkSize) {
        chunks.push(uniqueIds.slice(i, i + chunkSize));
    }
    
    const map: Record<number, any> = {};
    
    for (const chunk of chunks) {
        try {
            const idsStr = chunk.join(';');
            const res = await fetch(`https://card.wb.ru/cards/v2/detail?appType=1&curr=rub&dest=-1257786&spp=30&nm=${idsStr}`);
            if (!res.ok) continue;
            const data = await res.json();
            const products = data.data?.products || [];
            
            products.forEach((p: any) => {
                map[p.id] = {
                    nmID: p.id,
                    title: p.name,
                    brand: p.brand,
                    vendorCode: p.root, 
                    photoUrl: '',
                    sizes: p.sizes?.map((s: any) => ({
                        techSize: s.name,
                        wbSize: s.origName,
                        skus: [] 
                    })) || []
                };
            });
        } catch (e) {
            console.error("Public API fetch error:", e);
        }
    }
    return map;
  };

  const fetchStocks = async (productsForLookup: ProductCard[] = []) => {
    type StockBucket = { bySize: Record<string, number>, byBarcode: Record<string, number>, byChrtId: Record<string, number>, total: number };

    const stockMap: Record<number, StockBucket> = {};
    const stockMapByVendorCode: Record<string, StockBucket> = {};
    const analyticsMap: Record<number, StockBucket> = {};
    const analyticsMapByVendorCode: Record<string, StockBucket> = {};
    const statsMap: Record<number, StockBucket> = {};
    const statsMapByVendorCode: Record<string, StockBucket> = {};
    let marketplaceRows = 0;
    let analyticsRows = 0;
    let statsRows = 0;
    const supplierStockCacheKey = `wb_supply_order_stocks_v2:${selectedSupplierId || 'unknown'}`;

    const readCachedStocks = () => {
      try {
        const raw = localStorage.getItem(supplierStockCacheKey);
        if (!raw) return null;
        const cached = JSON.parse(raw);
        const ts = Number(cached?.ts || 0);
        const maxAgeMs = 24 * 60 * 60 * 1000;
        if (!ts || Date.now() - ts > maxAgeMs) return null;
        if (!cached?.byNmId && !cached?.byVendorCode) return null;
        return cached as { byNmId: Record<number, StockBucket>, byVendorCode: Record<string, StockBucket>, meta?: any };
      } catch {
        return null;
      }
    };

    const writeCachedStocks = (payload: { byNmId: Record<number, StockBucket>, byVendorCode: Record<string, StockBucket>, meta?: any }) => {
      try {
        localStorage.setItem(supplierStockCacheKey, JSON.stringify({ ...payload, ts: Date.now() }));
      } catch {
        // ignore cache quota/errors
      }
    };

    const ensureBucket = (target: Record<string | number, StockBucket>, key: string | number) => {
      if (!target[key]) target[key] = { bySize: {}, byBarcode: {}, byChrtId: {}, total: 0 };
      return target[key];
    };

    const applyStocksToMaps = (
      stocks: any[],
      targetByNmId: Record<number, StockBucket>,
      targetByVendorCode: Record<string, StockBucket>,
      counter: 'marketplace' | 'analytics' | 'statistics',
    ) => {
      if (counter === 'marketplace') marketplaceRows += stocks.length;
      else if (counter === 'analytics') analyticsRows += stocks.length;
      else statsRows += stocks.length;

      stocks.forEach((s: any) => {
        const nmId = Number(s.nmId ?? s.nmID ?? s.nm_id ?? s.nm);
        const chrtId = Number(s.chrtId ?? s.chrtID ?? s.chrt_id);
        const vendorKey = normalizeVendorCode(s.vendorCode ?? s.supplierArticle ?? s.article);
        const amount = Number(s.amount ?? s.quantity ?? s.qty ?? s.quantityFull ?? s.inStock ?? s.stock ?? 0) || 0;

        if (!Number.isFinite(nmId) && !vendorKey) return;

        const sizeKeys = Array.from(new Set([
          normalizeKey(s.techSize),
          normalizeKey(s.wbSize),
          normalizeKey(s.size),
          normalizeKey(s.tech_size),
        ].filter(Boolean)));

        const barcodeCandidates = [
          s.barcode,
          ...(Array.isArray(s.barcodes) ? s.barcodes : []),
          ...(Array.isArray(s.skus) ? s.skus : []),
        ].filter(Boolean);

        if (Number.isFinite(nmId)) {
          const bucket = ensureBucket(targetByNmId as unknown as Record<string | number, StockBucket>, nmId);
          bucket.total += amount;
          if (Number.isFinite(chrtId) && chrtId > 0) {
            bucket.byChrtId[String(chrtId)] = (bucket.byChrtId[String(chrtId)] || 0) + amount;
          }
          sizeKeys.forEach((sizeKey) => {
            bucket.bySize[sizeKey] = (bucket.bySize[sizeKey] || 0) + amount;
          });
          barcodeCandidates.forEach((barcode: any) => {
            const barcodeKey = normalizeBarcode(barcode);
            bucket.byBarcode[barcodeKey] = (bucket.byBarcode[barcodeKey] || 0) + amount;
          });
        }

        if (vendorKey) {
          const bucket = ensureBucket(targetByVendorCode as unknown as Record<string | number, StockBucket>, vendorKey);
          bucket.total += amount;
          if (Number.isFinite(chrtId) && chrtId > 0) {
            bucket.byChrtId[String(chrtId)] = (bucket.byChrtId[String(chrtId)] || 0) + amount;
          }
          sizeKeys.forEach((sizeKey) => {
            bucket.bySize[sizeKey] = (bucket.bySize[sizeKey] || 0) + amount;
          });
          barcodeCandidates.forEach((barcode: any) => {
            const barcodeKey = normalizeBarcode(barcode);
            bucket.byBarcode[barcodeKey] = (bucket.byBarcode[barcodeKey] || 0) + amount;
          });
        }
      });
    };

    const mergeMapsByMax = (
      targetByNmId: Record<number, StockBucket>,
      targetByVendorCode: Record<string, StockBucket>,
      sourceByNmId: Record<number, StockBucket>,
      sourceByVendorCode: Record<string, StockBucket>,
    ) => {
      Object.entries(sourceByNmId).forEach(([nmIdKey, sourceBucket]) => {
        const nmId = Number(nmIdKey);
        const targetBucket = ensureBucket(targetByNmId as unknown as Record<string | number, StockBucket>, nmId);
        targetBucket.total = Math.max(targetBucket.total || 0, sourceBucket.total || 0);
        Object.entries(sourceBucket.byChrtId || {}).forEach(([chrtIdKey, amount]) => {
          targetBucket.byChrtId[chrtIdKey] = Math.max(targetBucket.byChrtId[chrtIdKey] || 0, Number(amount) || 0);
        });
        Object.entries(sourceBucket.bySize || {}).forEach(([sizeKey, amount]) => {
          targetBucket.bySize[sizeKey] = Math.max(targetBucket.bySize[sizeKey] || 0, Number(amount) || 0);
        });
        Object.entries(sourceBucket.byBarcode || {}).forEach(([barcodeKey, amount]) => {
          targetBucket.byBarcode[barcodeKey] = Math.max(targetBucket.byBarcode[barcodeKey] || 0, Number(amount) || 0);
        });
      });

      Object.entries(sourceByVendorCode).forEach(([vendorKey, sourceBucket]) => {
        const targetBucket = ensureBucket(targetByVendorCode as unknown as Record<string | number, StockBucket>, vendorKey);
        targetBucket.total = Math.max(targetBucket.total || 0, sourceBucket.total || 0);
        Object.entries(sourceBucket.byChrtId || {}).forEach(([chrtIdKey, amount]) => {
          targetBucket.byChrtId[chrtIdKey] = Math.max(targetBucket.byChrtId[chrtIdKey] || 0, Number(amount) || 0);
        });
        Object.entries(sourceBucket.bySize || {}).forEach(([sizeKey, amount]) => {
          targetBucket.bySize[sizeKey] = Math.max(targetBucket.bySize[sizeKey] || 0, Number(amount) || 0);
        });
        Object.entries(sourceBucket.byBarcode || {}).forEach(([barcodeKey, amount]) => {
          targetBucket.byBarcode[barcodeKey] = Math.max(targetBucket.byBarcode[barcodeKey] || 0, Number(amount) || 0);
        });
      });
    };

    const getNextCursor = (response: any) => response?.nextCursor ?? response?.cursor ?? response?.next ?? null;
    const cursorToKey = (cursor: any) => {
      if (cursor == null) return '';
      if (typeof cursor === 'object') {
        try {
          return JSON.stringify(cursor);
        } catch {
          return String(cursor);
        }
      }
      return String(cursor);
    };

    const buildStocksUrl = (warehouseId: number, cursor?: any) => {
      const url = new URL(`https://marketplace-api.wildberries.ru/api/v3/stocks/${warehouseId}`);
      url.searchParams.set('limit', '1000');

      if (cursor != null && cursor !== '') {
        if (typeof cursor === 'object') {
          Object.entries(cursor).forEach(([key, value]) => {
            if (value == null || value === '') return;
            const normalizedKey = key === 'nmId' ? 'nmID' : key;
            url.searchParams.set(normalizedKey, String(value));
          });
          if (!url.searchParams.has('next') && (cursor as any).next != null) {
            url.searchParams.set('next', String((cursor as any).next));
          }
        } else {
          url.searchParams.set('next', String(cursor));
        }
      }

      return url.toString();
    };

    try {
      const whRes = await wbFetch('https://marketplace-api.wildberries.ru/api/v3/warehouses');
      const warehouses = whRes || [];

      await Promise.all(warehouses.map(async (wh: any) => {
        try {
          const firstRes = await wbFetch(buildStocksUrl(wh.id));
          const firstStocks = firstRes?.stocks || [];
          if (firstStocks.length > 0) applyStocksToMaps(firstStocks, stockMap, stockMapByVendorCode, 'marketplace');

          let nextCursor = getNextCursor(firstRes);
          const seenCursors = new Set<string>();

          for (let page = 0; page < 100 && nextCursor != null && nextCursor !== ''; page++) {
            const cursorKey = cursorToKey(nextCursor);
            if (!cursorKey || seenCursors.has(cursorKey)) break;
            seenCursors.add(cursorKey);

            const paged = await wbFetch(buildStocksUrl(wh.id, nextCursor));
            const stocks = paged?.stocks || [];
            if (stocks.length === 0) break;
            applyStocksToMaps(stocks, stockMap, stockMapByVendorCode, 'marketplace');

            const upcomingCursor = getNextCursor(paged);
            if (cursorToKey(upcomingCursor) === cursorKey) break;
            nextCursor = upcomingCursor;
          }
        } catch {
          // ignore one warehouse failure
        }
      }));
    } catch (e) {
      console.warn('Stocks fetch failed (marketplace):', e);
    }

    // For base WB tokens this endpoint is the reliable source of FBO stocks.
    // It is rate-limited, so call it before analytics and cache successful data.
    try {
      const token = getSupplierToken();
      if (token) {
        const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const res = await fetch(`https://statistics-api.wildberries.ru/api/v1/supplier/stocks?dateFrom=${dateFrom}`, {
          headers: { Authorization: token },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            applyStocksToMaps(data, statsMap, statsMapByVendorCode, 'statistics');
            mergeMapsByMax(stockMap, stockMapByVendorCode, statsMap, statsMapByVendorCode);
          }
        } else {
          console.warn('Stocks fallback failed (statistics):', res.status, await res.text());
        }
      }
    } catch (e) {
      console.warn('Stocks fallback failed (statistics):', e);
    }

    try {
      const token = getSupplierToken();
      const nmIds = Array.from(new Set(
        productsForLookup
          .map((p) => Number(p?.nmID))
          .filter((nmId) => Number.isFinite(nmId) && nmId > 0)
      )).slice(0, 1000);

      // Analytics stocks require a non-base analytics token for some suppliers.
      // If statistics already gave stocks, skip analytics to avoid extra WB limits/noise.
      if (token && nmIds.length > 0 && statsRows === 0) {
        const res = await fetch('https://seller-analytics-api.wildberries.ru/api/analytics/v1/stocks-report/wb-warehouses', {
          method: 'POST',
          headers: {
            Authorization: token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nmIds,
            limit: 250000,
            offset: 0,
          }),
        });
        if (res.ok) {
          const payload = await res.json();
          const items = payload?.data?.items || [];
          if (Array.isArray(items) && items.length > 0) {
            applyStocksToMaps(items, analyticsMap, analyticsMapByVendorCode, 'analytics');
            mergeMapsByMax(stockMap, stockMapByVendorCode, analyticsMap, analyticsMapByVendorCode);
          }
        } else {
          console.warn('Stocks fallback failed (analytics):', res.status, await res.text());
        }
      }
    } catch (e) {
      console.warn('Stocks fallback failed (analytics):', e);
    }

    const meta = { marketplaceRows, analyticsRows, statsRows };
    const hasLiveStocks = marketplaceRows > 0 || analyticsRows > 0 || statsRows > 0;

    if (hasLiveStocks) {
      const payload = { byNmId: stockMap, byVendorCode: stockMapByVendorCode, meta };
      writeCachedStocks(payload);
      return payload;
    }

    const cached = readCachedStocks();
    if (cached) {
      return {
        byNmId: cached.byNmId || {},
        byVendorCode: cached.byVendorCode || {},
        meta: { ...(cached.meta || {}), fromCache: true, marketplaceRows, analyticsRows, statsRows },
      };
    }

    return { byNmId: stockMap, byVendorCode: stockMapByVendorCode, meta };
  };

  const fetchProductsFallback = async () => {
      try {
          let allNmIds = new Set<number>();
          let productMap: Record<number, { vendorCode: string, variants: any[] }> = {};

          const addVariant = (nmId: number, vendorCode: string, techSize: string, wbSize: string = '', skus: string[] = []) => {
              if (!productMap[nmId]) {
                  productMap[nmId] = { vendorCode, variants: [] };
              }
              const exists = productMap[nmId].variants.find(v => v.techSize === techSize);
              if (!exists && techSize) {
                  productMap[nmId].variants.push({ techSize, wbSize: wbSize || techSize, skus });
              }
          };

          // 1. Try Stocks (Marketplace API)
          try {
              const whRes = await wbFetch('https://marketplace-api.wildberries.ru/api/v3/warehouses');
              const warehouses = whRes || [];
              for (const wh of warehouses) {
                  try {
                      const stockRes = await wbFetch(`https://marketplace-api.wildberries.ru/api/v3/stocks/${wh.id}?limit=1000`);
                      const stocks = stockRes.stocks || [];
                      stocks.forEach((s: any) => {
                          allNmIds.add(s.nmId);
                          addVariant(s.nmId, s.vendorCode, s.techSize, s.wbSize, s.barcode ? [s.barcode] : []);
                      });
                  } catch (e) { console.warn(e); }
              }
          } catch (e) { console.warn("Stocks fetch failed", e); }

          // 2. Try Orders (Marketplace API) - Last 90 days
          try {
              const dateFrom = Math.floor(Date.now() / 1000) - (90 * 24 * 60 * 60);
              const ordersRes = await wbFetch(`https://marketplace-api.wildberries.ru/api/v3/orders?limit=1000&next=0&dateFrom=${dateFrom}`);
              const orders = ordersRes.orders || [];
              orders.forEach((o: any) => {
                  if (o.nmId) {
                      allNmIds.add(o.nmId);
                      addVariant(o.nmId, o.article, o.techSize || o.size, '', o.skus || []);
                  }
              });
          } catch (e) { console.warn("Orders fetch failed", e); }

          // 3. Try New Orders (Marketplace API)
          try {
              const newOrdersRes = await wbFetch('https://marketplace-api.wildberries.ru/api/v3/orders/new');
              const newOrders = newOrdersRes.orders || [];
              newOrders.forEach((o: any) => {
                  if (o.nmId) {
                      allNmIds.add(o.nmId);
                      addVariant(o.nmId, o.article, o.techSize || o.size, '', o.skus || []);
                  }
              });
          } catch (e) { console.warn("New orders fetch failed", e); }

          if (allNmIds.size === 0) return [];

          // 3. Fetch details from Public API
          const publicDetails = await fetchPublicProductDetails(Array.from(allNmIds));
          
          // 4. Merge
          return Array.from(allNmIds).map(nmId => {
              const details = publicDetails[nmId];
              const info = productMap[nmId];
              
              const sizes = details?.sizes?.length > 0 ? details.sizes : (info?.variants.length > 0 ? info.variants : [{ techSize: '0', wbSize: '0', skus: [] }]);

              return {
                  nmID: nmId,
                  vendorCode: info?.vendorCode || details?.vendorCode || '',
                  title: details?.title || `Товар ${nmId}`,
                  description: '',
                  brand: details?.brand || '',
                  photos: [{ 
                      big: details?.photoUrl || '', 
                      tm: details?.photoUrl || '', 
                      small: details?.photoUrl || '' 
                  }],
                  sizes: sizes,
                  dimensions: { length: 0, width: 0, height: 0 },
                  characteristics: [],
                  techSize: '0',
                  wbSize: '0'
              };
          });
      } catch (e) {
          console.error("Fallback failed:", e);
          return [];
      }
  };

  const fetchOrdersForSupply = async (supplyId: string, options?: { enrich?: boolean; fresh?: boolean }) => {
    const supply = supplies.find(s => s.id === supplyId);
    const dateFrom = supply
      ? Math.floor(new Date(supply.createdAt).getTime() / 1000) - (365 * 24 * 60 * 60)
      : Math.floor(Date.now() / 1000) - (365 * 24 * 60 * 60);

    const withFresh = (url: string) => {
      if (!options?.fresh) return url;
      const sep = url.includes('?') ? '&' : '?';
      return `${url}${sep}_ts=${Date.now()}`;
    };

    const normalizeSupplyOrder = (o: any) => {
      const nmIdRaw = o?.nmId ?? o?.nmID ?? o?.nm_id ?? o?.nm;
      const nmIdNum = Number(nmIdRaw);
      return {
        ...o,
        id: o?.id ?? o?.orderId ?? o?.order_id ?? o?.rid,
        orderId: o?.orderId ?? o?.id ?? o?.order_id ?? o?.rid,
        order_id: o?.order_id ?? o?.id ?? o?.orderId ?? o?.rid,
        nmId: Number.isFinite(nmIdNum) && nmIdNum > 0 ? nmIdNum : undefined,
        article: o?.article || o?.vendorCode || o?.supplierArticle || o?.supplier_article || '',
        title: o?.title || o?.subject || o?.name || '',
        brand: o?.brand || o?.brandName || '',
        size: o?.size || o?.techSize || o?.tech_size || o?.wbSize || '',
        color: o?.color || o?.colorName || '',
        skus: Array.isArray(o?.skus) ? o.skus : (Array.isArray(o?.skusList) ? o.skusList : []),
      };
    };

    const normalizePart = (v: any) => String(v ?? '').trim().toLowerCase();

    // Important: don't collapse multi-item orders by plain orderId.
    // Use a composite key that keeps per-item lines separate while still allowing merge.
    const getOrderMergeKey = (o: any) => {
      const rid = normalizePart(o?.rid ?? o?.srid ?? o?.rId);
      const orderId = normalizePart(o?.id ?? o?.orderId ?? o?.order_id);
      const nmId = normalizePart(o?.nmId ?? o?.nmID ?? o?.nm_id ?? o?.nm);
      const chrtId = normalizePart(o?.chrtId ?? o?.chrt_id);
      const article = normalizePart(o?.article ?? o?.vendorCode ?? o?.supplierArticle ?? o?.supplier_article);
      const size = normalizePart(o?.size ?? o?.techSize ?? o?.tech_size ?? o?.wbSize);
      const color = normalizePart(o?.color ?? o?.colorName);
      const sku = normalizePart(Array.isArray(o?.skus) && o.skus.length ? o.skus[0] : (Array.isArray(o?.skusList) && o.skusList.length ? o.skusList[0] : ''));

      if (rid) return `rid:${rid}`;
      if (orderId || nmId || chrtId || article || size || color || sku) {
        return `oid:${orderId}|nm:${nmId}|ch:${chrtId}|art:${article}|sz:${size}|clr:${color}|sku:${sku}`;
      }
      return '';
    };

    const fetchOrdersListFallback = async (useDateFrom: boolean = true) => {
      const allOrders: any[] = [];
      let next = 0;

      for (let page = 0; page < 300; page++) {
        const baseUrl = `https://marketplace-api.wildberries.ru/api/v3/orders?limit=1000&next=${next}`;
        const url = useDateFrom ? `${baseUrl}&dateFrom=${dateFrom}` : baseUrl;
        const data = await wbFetch(withFresh(url));
        const batch: any[] = data?.orders || [];
        if (batch.length === 0) break;

        allOrders.push(...batch);

        if (typeof data?.next !== 'number' || data.next === next) break;
        next = data.next;
      }

      const target = String(supplyId || '').trim().toLowerCase();
      const candidateRows = allOrders.map((o) => ({
        o,
        candidates: [o?.supplyId, o?.supplyID, o?.supply_id, o?.supply?.id]
          .map((v) => String(v || '').trim().toLowerCase())
          .filter(Boolean)
      }));

      let matched = candidateRows
        .filter(({ candidates }) => candidates.some((c) => c === target))
        .map(({ o }) => normalizeSupplyOrder(o));

      // Fallback: some WB responses return supply ids in slightly different format.
      if (matched.length === 0 && target) {
        matched = candidateRows
          .filter(({ candidates }) => candidates.some((c) => c.includes(target) || target.includes(c)))
          .map(({ o }) => normalizeSupplyOrder(o));
      }

      // If filtered by dateFrom gave nothing, retry without dateFrom window restrictions
      if (matched.length === 0 && useDateFrom) {
        return fetchOrdersListFallback(false);
      }

      return matched;
    };

    // Try dedicated supply endpoint first for any supply id (including WB-GI-*)
    let supplyOrders: any[] = [];
    let directCount = 0;
    try {
      const direct = await wbFetch(withFresh(`https://marketplace-api.wildberries.ru/api/v3/supplies/${supplyId}/orders`));
      if (Array.isArray(direct?.orders)) {
        directCount = direct.orders.length;
        supplyOrders = direct.orders.map(normalizeSupplyOrder);
      }
    } catch (e) {
      console.warn('Direct supply orders endpoint failed, fallback to /orders list');
    }

    // If endpoint returned sparse items (missing nmId/title/article), enrich by fallback list and merge
    const sparseCount = supplyOrders.filter((o: any) => !o?.nmId && !o?.title && !o?.article).length;
    const directLooksSparse = supplyOrders.length > 0 && (sparseCount / supplyOrders.length) > 0.2;

    const shouldForceFallbackMerge = Boolean(options?.fresh);
    if (supplyOrders.length === 0 || directLooksSparse || shouldForceFallbackMerge) {
      const fallbackOrders = await fetchOrdersListFallback();
      if (supplyOrders.length === 0) {
        supplyOrders = fallbackOrders;
      } else if (fallbackOrders.length > 0) {
        const mergedById = new Map<string, any>();

        // Start from fallback as baseline (often more complete by recency/pagination)
        fallbackOrders.forEach((fo: any, idx: number) => {
          const key = getOrderMergeKey(fo) || `fallback_idx:${idx}`;
          mergedById.set(key, fo);
        });

        // Overlay direct endpoint fields and also include direct-only orders
        supplyOrders.forEach((o: any, idx: number) => {
          const key = getOrderMergeKey(o) || `direct_idx:${idx}`;
          const base = mergedById.get(key) || {};
          mergedById.set(key, {
            ...base,
            ...o,
            nmId: o.nmId || base.nmId,
            article: o.article || base.article,
            title: o.title || base.title,
            brand: o.brand || base.brand,
            size: o.size || base.size,
            color: o.color || base.color,
            skus: (o.skus && o.skus.length ? o.skus : (base.skus || [])),
          });
        });

        supplyOrders = Array.from(mergedById.values());

        if (options?.fresh) {
          console.info('[WBSupplyManager] supply orders merge stats', {
            supplyId,
            directCount,
            fallbackCount: fallbackOrders.length,
            mergedCount: supplyOrders.length,
          });
        }
      }
    }

    if (options?.enrich === false) {
      return supplyOrders;
    }

    // Enrich with product details from Seller API
    let cardsMap: Record<string, any> = {};
    
    if (products.length > 0) {
        products.forEach((c: any) => {
            cardsMap[c.vendorCode] = c;
            cardsMap[`nm_${c.nmID}`] = c;
            if (c.vendorCode) {
                cardsMap[c.vendorCode.trim()] = c;
                cardsMap[c.vendorCode.toLowerCase().trim()] = c;
            }
        });
    }
    
    // If products list is empty, fetch it
    if (products.length === 0) {
        try {
            const { map, list } = await fetchSellerCards();
            cardsMap = map;
            if (list.length > 0) setProducts(list);
        } catch (e: any) {
            console.error("Failed to fetch cards for enrichment:", e);
            // Don't show error yet, try fallback
        }
    }

    // Identify orders missing enrichment
    const missingNmIds = new Set<number>();
    supplyOrders.forEach((o: any) => {
        let card = o.nmId ? cardsMap[`nm_${o.nmId}`] : null;
        if (!card && o.article) {
            card = cardsMap[o.article] || cardsMap[o.article.trim()] || cardsMap[o.article.toLowerCase().trim()];
        }
        if (!card && o.nmId) {
            missingNmIds.add(o.nmId);
        }
    });

    // Fetch from Public API if needed
    let publicDetails: Record<number, any> = {};
    if (missingNmIds.size > 0) {
        try {
            publicDetails = await fetchPublicProductDetails(Array.from(missingNmIds));
        } catch (e) {
            console.error("Public API fallback failed:", e);
        }
    }

    return supplyOrders.map((o: any) => {
        // Try to find card by nmID first (if available in order)
        let card = o.nmId ? cardsMap[`nm_${o.nmId}`] : null;
        
        // Fallback to article
        if (!card && o.article) {
            card = cardsMap[o.article] || cardsMap[o.article.trim()] || cardsMap[o.article.toLowerCase().trim()];
        }

        if (card) {
            // Find the correct size variant by matching SKUs
            let sizeVariant = null;
            if (card.sizes && Array.isArray(o.skus) && o.skus.length > 0) {
                sizeVariant = card.sizes.find((s: any) => s.skus && s.skus.some((sku: string) => o.skus.includes(sku)));
            }

            return {
                ...o,
                nmId: card.nmID,
                title: card.title || card.imtName || o.title,
                brand: card.brand || o.brand,
                size: sizeVariant ? sizeVariant.techSize : (o.techSize || o.wbSize || o.size || card.sizes?.[0]?.techSize),
                color: card.characteristics?.find((c: any) => c.name === 'Цвет')?.value || o.color,
                photoUrl: card.photos?.[0]?.big
            };
        }
        
        // Try Public API details
        const publicCard = o.nmId ? publicDetails[o.nmId] : null;
        if (publicCard) {
             return {
                 ...o,
                 title: publicCard.title || o.title,
                 brand: publicCard.brand || o.brand,
                 photoUrl: publicCard.photoUrl,
                 size: o.size || o.techSize || o.wbSize || '?',
                 color: o.color || '?'
             };
        }
        
        // Return with best effort data if no card found
        return {
            ...o,
            title: o.title || 'Без названия',
            photoUrl: null,
            size: o.size || o.techSize || o.wbSize || '?',
            color: o.color || '?'
        };
    });
  };

  const extractStickerLabel = (order: any) => {
    const stickerObj = order?.sticker;
    let rawStickerId = '';
    let stickerParts: { part1?: string; part2?: string } | null = null;

    if (stickerObj) {
      if (typeof stickerObj === 'string') {
        rawStickerId = stickerObj;
      } else {
        if (stickerObj.wbStickerIdParts?.part1 && stickerObj.wbStickerIdParts?.part2) {
          stickerParts = stickerObj.wbStickerIdParts;
        } else if (stickerObj.wbStickerId) {
          rawStickerId = String(stickerObj.wbStickerId);
        } else if (stickerObj.id) {
          rawStickerId = String(stickerObj.id);
        }
      }
    }

    const rawPrimary = rawStickerId || order?.orderUid || '';
    const digits = stickerParts
      ? pickStickerDigits(rawPrimary, stickerParts.part1, stickerParts.part2)
      : pickStickerDigits(rawPrimary);

    return digits;
  };

  const fetchStickerMeta = async (orderIds: number[]) => {
    const token = getSupplierToken();
    if (!token || orderIds.length === 0) return new Map<number, { stickerDigits: string; stickerScanText: string }>();

    const supplierCacheKey = String(selectedSupplierId || 'unknown').trim() || 'unknown';
    const toCacheKey = (orderId: number) => `${supplierCacheKey}:${orderId}`;
    const meta = new Map<number, { stickerDigits: string; stickerScanText: string }>();
    const missingOrderIds: number[] = [];
    for (const orderId of orderIds) {
      const cached = wbStickerMetaCacheRef.current.get(toCacheKey(orderId));
      if (cached && (cached.stickerDigits || cached.stickerScanText)) {
        meta.set(orderId, cached);
      } else {
        missingOrderIds.push(orderId);
      }
    }
    if (missingOrderIds.length === 0) return meta;

    const chunkSize = 20;
    const chunks: number[][] = [];
    for (let i = 0; i < missingOrderIds.length; i += chunkSize) chunks.push(missingOrderIds.slice(i, i + chunkSize));

    const applyStickers = (stickers: any[]) => {
      for (const st of stickers) {
        const mappedId = Number(st?.orderId ?? st?.id ?? st?.order_id);
        if (!Number.isFinite(mappedId)) continue;
        const stickerDigits = pickStickerDigits(st?.sticker || st?.name || st?.code || '', st?.partA, st?.partB);
        const fromFile = extractSvgStickerScanText(String(st?.file || ''));
        const readableFromFile = looksReadableStickerScanText(fromFile) ? fromFile : '';
        const rawScanText = normalizeScanStickerText(
          String(
            st?.scanStickerText
            || st?.stickerScanText
            || st?.barcode
            || st?.barcodeText
            || readableFromFile
            || ''
          )
        );
        const stickerScanText = looksReadableStickerScanText(rawScanText)
          ? rawScanText
          : readableFromFile;
        const payload = { stickerDigits, stickerScanText };
        meta.set(mappedId, payload);
        wbStickerMetaCacheRef.current.set(toCacheKey(mappedId), payload);
      }
    };

    const fetchChunk = async (chunk: number[]) => {
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          const res = await fetch('https://marketplace-api.wildberries.ru/api/v3/orders/stickers?type=svg&width=58&height=40', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token,
            },
            body: JSON.stringify({ orders: chunk }),
          });
          if (!res.ok) {
            if (attempt === 3) console.warn('fetchStickerMeta chunk non-ok:', res.status, chunk.slice(0, 3));
            await new Promise((r) => setTimeout(r, 350 + attempt * 500));
            continue;
          }
          const data = await res.json();
          const stickers = Array.isArray(data?.stickers) ? data.stickers : [];
          applyStickers(stickers);
          return;
        } catch (e) {
          if (attempt === 3) console.warn('fetchStickerMeta chunk failed:', e);
          await new Promise((r) => setTimeout(r, 350 + attempt * 500));
        }
      }
    };

    const queue = [...chunks];
    const workerCount = Math.min(3, queue.length);
    await Promise.all(Array.from({ length: workerCount }, async () => {
      while (queue.length > 0) {
        const chunk = queue.shift();
        if (!chunk?.length) break;
        await fetchChunk(chunk);
        await new Promise((r) => setTimeout(r, 80));
      }
    }));

    const missingIds = missingOrderIds.filter((id) => !meta.has(id));
    if (missingIds.length) {
      console.warn('fetchStickerMeta missing ids after first pass:', missingIds.length);
      for (let i = 0; i < missingIds.length; i += 10) {
        await fetchChunk(missingIds.slice(i, i + 10));
        await new Promise((r) => setTimeout(r, 180));
      }
    }

    return meta;
  };

  const fetchStickerLabels = async (orderIds: number[]) => {
    const meta = await fetchStickerMeta(orderIds);
    const labels = new Map<number, string>();
    meta.forEach((value, key) => {
      if (value?.stickerDigits) labels.set(key, value.stickerDigits);
    });
    return labels;
  };

  const enrichFbsScanRowsWithStickerMeta = async (rows: FbsSupplyScanOrderRow[]) => {
    const cleanRows = sanitizeFbsScanRows(rows || []);
    const orderIds = Array.from(new Set(
      cleanRows
        .map((row) => Number(row.orderId || ''))
        .filter((id) => Number.isFinite(id) && id > 0)
    ));

    if (!orderIds.length) return cleanRows;

    let meta = new Map<number, { stickerDigits: string; stickerScanText: string }>();
    try {
      meta = await withTimeout(fetchStickerMeta(orderIds), 90000, 'Таймаут дозагрузки стикеров');
    } catch {
      meta = new Map<number, { stickerDigits: string; stickerScanText: string }>();
    }

    if (!meta.size) return cleanRows;

    return sanitizeFbsScanRows(cleanRows.map((row) => {
      const orderIdNum = Number(row.orderId || '');
      const rowMeta = Number.isFinite(orderIdNum) ? meta.get(orderIdNum) : undefined;
      if (!rowMeta) return row;

      const stickerDigits = normalizeStickerDigits(rowMeta.stickerDigits || row.stickerDigits || '');
      const stickerText = getSafeStickerText({
        stickerDigits,
        stickerText: stickerDigits ? formatStickerDigits(stickerDigits) : row.stickerText,
      });
      const stickerScanText = looksReadableStickerScanText(rowMeta.stickerScanText)
        ? rowMeta.stickerScanText
        : looksReadableStickerScanText(row.stickerScanText)
          ? row.stickerScanText
          : '';

      return {
        ...row,
        stickerDigits,
        stickerText,
        stickerScanText,
        storageKey: normalizeFbsStorageKey({ orderId: row.orderId, stickerDigits, stickerScanText }),
      };
    }));
  };

  const getFbsScanStorageKey = (supplyId: string, supplierId?: string) => {
    const safeSupplierId = String(supplierId || selectedSupplierId || 'unknown').trim() || 'unknown';
    return `fbs_supply_scan_chz_v1:${safeSupplierId}:${String(supplyId || '').trim()}`;
  };

  const parseFbsScanPayload = (raw: any): Record<string, FbsSupplyScanSavedItem> => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    const next: Record<string, FbsSupplyScanSavedItem> = {};
    Object.entries(raw).forEach(([entryKey, entryValue]) => {
      const value = entryValue as any;
      const stickerDigits = normalizeStickerDigits(String(value?.stickerDigits || ''));
      const stickerScanText = normalizeScanStickerText(String(value?.stickerScanText || ''));
      const storageKey = String(value?.storageKey || normalizeFbsStorageKey({ stickerDigits, stickerScanText, orderId: value?.orderId || entryKey })) || '';
      const honestSignCode = normalizeDataMatrixText(String(value?.honestSignCode || value?.code || ''));
      if (!storageKey || !honestSignCode) return;
      next[storageKey] = {
        storageKey,
        stickerDigits,
        stickerScanText,
        honestSignCode,
        updatedAt: String(value?.updatedAt || new Date().toISOString()),
        orderId: String(value?.orderId || ''),
        title: String(value?.title || ''),
        article: String(value?.article || ''),
        size: String(value?.size || ''),
      };
    });
    return next;
  };

  const loadFbsSupplyScanMap = async (supplyId: string, supplierId?: string) => {
    const key = getFbsScanStorageKey(supplyId, supplierId);
    try {
      const { data } = await supabase.from('app_settings').select('value').eq('key', key).maybeSingle();
      const parsed = data?.value ? JSON.parse(String(data.value)) : {};
      return parseFbsScanPayload(parsed);
    } catch {
      return {} as Record<string, FbsSupplyScanSavedItem>;
    }
  };

  const saveFbsSupplyScanMap = async (supplyId: string, next: Record<string, FbsSupplyScanSavedItem>, supplierId?: string) => {
    const key = getFbsScanStorageKey(supplyId, supplierId);
    const clean = parseFbsScanPayload(next);
    await supabase.from('app_settings').upsert([{ key, value: JSON.stringify(clean) }], { onConflict: 'key' });
    return clean;
  };

  const syncFbsScannedCodesToUnifiedBase = async (codes: string[], supplierId?: string) => {
    const normalizedSupplierId = String(supplierId || selectedSupplierId || '').trim();
    const uniqueCodes = Array.from(new Set((codes || []).map((code) => normalizeDataMatrixText(String(code || '').trim())).filter(Boolean)));
    if (!normalizedSupplierId || uniqueCodes.length === 0) return;

    const nowIso = new Date().toISOString();
    const { data: existing, error: existingError } = await supabase
      .from('unified_honest_sign_codes')
      .select('id, code, supplier_id, category')
      .in('code', uniqueCodes);

    if (existingError) throw existingError;

    const existingByCode = new Map<string, any>();
    (existing || []).forEach((row: any) => {
      const code = String(row?.code || '').trim();
      if (code) existingByCode.set(code, row);
    });

    const idsToUpdate: string[] = [];
    const toInsert: Array<{ supplier_id: string; category: string; code: string; file_name: string; status: string; created_at: string }> = [];

    uniqueCodes.forEach((code) => {
      const row = existingByCode.get(code);
      if (!row) {
        toInsert.push({
          supplier_id: normalizedSupplierId,
          category: 'Без категории',
          code,
          file_name: 'Отсканировано',
          status: 'scanned',
          created_at: nowIso,
        });
        return;
      }

      const rowSupplierId = String(row?.supplier_id || '').trim();
      if (!rowSupplierId || rowSupplierId === normalizedSupplierId) {
        if (row?.id) idsToUpdate.push(String(row.id));
      }
    });

    if (idsToUpdate.length > 0) {
      const { error } = await supabase
        .from('unified_honest_sign_codes')
        .update({
          supplier_id: normalizedSupplierId,
          file_name: 'Отсканировано',
          status: 'scanned',
          created_at: nowIso,
        })
        .in('id', idsToUpdate);
      if (error) throw error;
    }

    if (toInsert.length > 0) {
      const { error } = await supabase
        .from('unified_honest_sign_codes')
        .insert(toInsert);
      if (error) throw error;
    }
  };

  const isFbsCodeAlreadyScannedForSupplier = async (code: string, supplierId?: string) => {
    const normalizedCode = normalizeDataMatrixText(String(code || '').trim());
    const normalizedSupplierId = String(supplierId || selectedSupplierId || '').trim();
    if (!normalizedCode || !normalizedSupplierId) return false;

    const { data, error } = await supabase
      .from('unified_honest_sign_codes')
      .select('id')
      .eq('supplier_id', normalizedSupplierId)
      .eq('code', normalizedCode)
      .or('file_name.eq.Отсканировано,status.eq.scanned')
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return Boolean(data?.id);
  };

  const getFbsScanSheetStorageKey = (supplyId: string, supplierId?: string) => {
    const safeSupplierId = String(supplierId || selectedSupplierId || 'unknown').trim() || 'unknown';
    return `fbs_supply_scan_sheet_v1:${safeSupplierId}:${String(supplyId || '').trim()}`;
  };

  const getFbsScanSheetMetaStorageKey = (supplyId: string, supplierId?: string) => {
    const safeSupplierId = String(supplierId || selectedSupplierId || 'unknown').trim() || 'unknown';
    return `fbs_supply_scan_sheet_meta_v1:${safeSupplierId}:${String(supplyId || '').trim()}`;
  };

  const sanitizeFbsScanRows = (rows: any[]): FbsSupplyScanOrderRow[] => {
    if (!Array.isArray(rows)) return [];
    return rows.map((row: any) => {
      const stickerDigits = normalizeStickerDigits(String(row?.stickerDigits || row?.stickerText || ''));
      const stickerText = getSafeStickerText({
        stickerDigits,
        stickerText: row?.stickerText,
      });
      const rawStickerScanText = normalizeScanStickerText(String(row?.stickerScanText || ''));
      const stickerScanText = isGarbageStickerScanText(rawStickerScanText) ? '' : rawStickerScanText;
      const orderId = String(row?.orderId || '').trim();
      const cleanRow: FbsSupplyScanOrderRow = {
        storageKey: normalizeFbsStorageKey({ stickerDigits, stickerScanText, orderId }),
        orderId,
        title: String(row?.title || '').trim(),
        article: String(row?.article || '').trim(),
        size: String(row?.size || '').trim(),
        stickerDigits,
        stickerText,
        stickerScanText,
      };
      return cleanRow;
    }).filter((row) => Boolean(row.orderId || row.stickerText || row.stickerScanText));
  };

  const parseFbsSupplyScanSheetMeta = (raw: any): FbsSupplyScanSheetMeta | null => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const totalRows = Math.max(0, Number(raw?.totalRows || 0) || 0);
    const rowsWithSticker = Math.max(0, Number(raw?.rowsWithSticker || 0) || 0);
    const rowsWithScanText = Math.max(0, Number(raw?.rowsWithScanText || 0) || 0);
    const isFullyReady = Boolean(raw?.isFullyReady);
    return {
      updatedAt: String(raw?.updatedAt || ''),
      totalRows,
      rowsWithSticker,
      rowsWithScanText,
      isFullyReady,
      source: raw?.source === 'upload' || raw?.source === 'cache' ? raw.source : 'wb',
    };
  };

  const loadFbsSupplyScanSheetRows = async (supplyId: string, supplierId?: string) => {
    const key = getFbsScanSheetStorageKey(supplyId, supplierId);
    try {
      const { data } = await supabase.from('app_settings').select('value').eq('key', key).maybeSingle();
      const parsed = data?.value ? JSON.parse(String(data.value)) : [];
      return getUniqueFbsScanRows(Array.isArray(parsed) ? parsed : []);
    } catch {
      return [] as FbsSupplyScanOrderRow[];
    }
  };

  const loadFbsSupplyScanSheetMeta = async (supplyId: string, supplierId?: string) => {
    const key = getFbsScanSheetMetaStorageKey(supplyId, supplierId);
    try {
      const { data } = await supabase.from('app_settings').select('value').eq('key', key).maybeSingle();
      const parsed = data?.value ? JSON.parse(String(data.value)) : null;
      return parseFbsSupplyScanSheetMeta(parsed);
    } catch {
      return null;
    }
  };

  const getFbsScanRowMatchKey = (row: Partial<FbsSupplyScanOrderRow>) => {
    const stickerDigits = normalizeStickerDigits(String(row?.stickerDigits || ''));
    if (stickerDigits) return `sticker:${stickerDigits}`;
    const orderId = String(row?.orderId || '').trim();
    if (orderId) return `order:${orderId}`;
    const stickerScanText = normalizeScanStickerText(String(row?.stickerScanText || ''));
    if (stickerScanText) return `scan:${stickerScanText}`;
    return '';
  };

  const getFbsScanLookupKeys = (row: Partial<FbsSupplyScanOrderRow> | Partial<FbsSupplyScanSavedItem>) => {
    const keys = new Set<string>();
    const storageKey = String(row?.storageKey || '').trim();
    if (storageKey) keys.add(storageKey);

    const orderId = String(row?.orderId || '').trim();
    if (orderId) keys.add(`order:${orderId}`);

    const stickerDigits = normalizeStickerDigits(String(row?.stickerDigits || ''));
    if (stickerDigits) keys.add(`sticker:${stickerDigits}`);

    const stickerScanText = normalizeScanStickerText(String(row?.stickerScanText || ''));
    if (stickerScanText) keys.add(`scan:${stickerScanText}`);

    return Array.from(keys).filter(Boolean);
  };

  const findFbsScanSavedEntry = (row: Partial<FbsSupplyScanOrderRow>, scansMap: Record<string, FbsSupplyScanSavedItem>) => {
    const directKeys = getFbsScanLookupKeys(row);
    for (const key of directKeys) {
      const item = scansMap[key];
      if (item) return { key, item };
    }

    const orderId = String(row?.orderId || '').trim();
    if (orderId) {
      const fallback = Object.entries(scansMap).find(([, item]) => String(item?.orderId || '').trim() === orderId);
      if (fallback) return { key: fallback[0], item: fallback[1] };
    }

    return null;
  };

  const getUniqueFbsScanRows = (rows: FbsSupplyScanOrderRow[]) => {
    const map = new Map<string, FbsSupplyScanOrderRow>();
    sanitizeFbsScanRows(rows || []).forEach((row) => {
      const key = String(row.orderId || '').trim() || getFbsScanRowMatchKey(row) || String(row.storageKey || '').trim();
      if (key) map.set(key, row);
    });
    return Array.from(map.values());
  };

  const getFbsScanProgressStats = (rows: FbsSupplyScanOrderRow[], scansMap: Record<string, FbsSupplyScanSavedItem>) => {
    const uniqueRows = getUniqueFbsScanRows(rows || []);
    const scannedCount = uniqueRows.filter((row) => Boolean(findFbsScanSavedEntry(row, scansMap)?.item?.honestSignCode)).length;
    return {
      totalRows: uniqueRows.length,
      scannedCount,
    };
  };

  const getFbsScanCompletenessStats = (rows: FbsSupplyScanOrderRow[]) => {
    const uniqueRows = getUniqueFbsScanRows(rows || []);
    const rowsWithSticker = uniqueRows.filter((row) => Boolean(normalizeStickerDigits(String(row?.stickerDigits || row?.stickerText || '')))).length;
    const rowsWithScanText = uniqueRows.filter((row) => looksReadableStickerScanText(String(row?.stickerScanText || ''))).length;
    return {
      totalRows: uniqueRows.length,
      rowsWithSticker,
      rowsWithScanText,
      missingSticker: Math.max(0, uniqueRows.length - rowsWithSticker),
      missingScanText: Math.max(0, uniqueRows.length - rowsWithScanText),
      isFullyReady: uniqueRows.length > 0 && rowsWithSticker === uniqueRows.length && rowsWithScanText === uniqueRows.length,
    };
  };

  const assertFbsScanRowsReadyForExport = (rows: FbsSupplyScanOrderRow[], contextLabel: string) => {
    const stats = getFbsScanCompletenessStats(rows);
    if (!stats.totalRows) {
      throw new Error(`Не удалось сформировать ${contextLabel}: в поставке нет строк.`);
    }
    if (!stats.isFullyReady) {
      throw new Error(`Не удалось сформировать ${contextLabel}: WB вернул неполные данные по поставке. Получено стикеров ${stats.rowsWithSticker}/${stats.totalRows}, «Стикер при считывании» ${stats.rowsWithScanText}/${stats.totalRows}. Файл не скачан, чтобы не отдать неполный результат.`);
    }
    return stats;
  };

  const hasMeaningfulFbsValue = (value: any) => {
    const text = String(value ?? '').trim();
    if (!text) return false;
    return text !== '-' && text !== '—';
  };

  const getSafeStickerText = (row: Partial<FbsSupplyScanOrderRow>) => {
    const rawStickerText = String(row?.stickerText ?? '').trim();
    const stickerDigits = normalizeStickerDigits(String(row?.stickerDigits || rawStickerText || ''));
    const formatted = formatStickerDigits(stickerDigits);

    if (stickerDigits && formatted && formatted !== '-') {
      if (/^[\d\s_-]+$/.test(rawStickerText) || rawStickerText === formatted.replace(/_/g, ' ') || !hasMeaningfulFbsValue(rawStickerText)) {
        return formatted;
      }
    }

    if (hasMeaningfulFbsValue(rawStickerText)) return rawStickerText;
    if (formatted && formatted !== '-') return formatted;

    if (rawStickerText === '—') return '—';
    return '-';
  };

  const mergeFbsScanRows = (apiRows: FbsSupplyScanOrderRow[], storedRows: FbsSupplyScanOrderRow[]) => {
    const apiClean = sanitizeFbsScanRows(apiRows || []);
    const storedClean = sanitizeFbsScanRows(storedRows || []);
    const storedByKey = new Map<string, FbsSupplyScanOrderRow>();
    storedClean.forEach((row) => {
      const key = getFbsScanRowMatchKey(row);
      if (key) storedByKey.set(key, row);
    });

    const merged: FbsSupplyScanOrderRow[] = apiClean.map((apiRow) => {
      const exact = storedByKey.get(getFbsScanRowMatchKey(apiRow));
      const byOrder = apiRow.orderId ? storedByKey.get(`order:${apiRow.orderId}`) : undefined;
      const storedRow = exact || byOrder;
      if (!storedRow) return apiRow;
      const stickerDigits = apiRow.stickerDigits || storedRow.stickerDigits;
      const stickerText = getSafeStickerText({
        stickerDigits,
        stickerText: hasMeaningfulFbsValue(apiRow.stickerText)
          ? apiRow.stickerText
          : storedRow.stickerText,
      });
      const stickerScanText = looksReadableStickerScanText(apiRow.stickerScanText)
        ? apiRow.stickerScanText
        : looksReadableStickerScanText(storedRow.stickerScanText)
          ? storedRow.stickerScanText
          : '';

      return sanitizeFbsScanRows([{
        ...storedRow,
        ...apiRow,
        orderId: apiRow.orderId || storedRow.orderId,
        title: hasMeaningfulFbsValue(apiRow.title) && apiRow.title !== 'Без названия' ? apiRow.title : storedRow.title || apiRow.title,
        article: hasMeaningfulFbsValue(apiRow.article) ? apiRow.article : storedRow.article || apiRow.article,
        size: hasMeaningfulFbsValue(apiRow.size) ? apiRow.size : storedRow.size || apiRow.size,
        stickerDigits,
        stickerText,
        stickerScanText,
      }])[0] || apiRow;
    });

    const mergedKeys = new Set(merged.map((row) => getFbsScanRowMatchKey(row)).filter(Boolean));
    const extraStored = storedClean.filter((row) => {
      const key = getFbsScanRowMatchKey(row);
      return key && !mergedKeys.has(key);
    });

    return sanitizeFbsScanRows([...merged, ...extraStored]);
  };

  const saveFbsSupplyScanSheetRows = async (supplyId: string, rows: FbsSupplyScanOrderRow[], supplierId?: string, source: 'wb' | 'upload' | 'cache' = 'wb') => {
    const key = getFbsScanSheetStorageKey(supplyId, supplierId);
    const metaKey = getFbsScanSheetMetaStorageKey(supplyId, supplierId);
    const clean = getUniqueFbsScanRows(rows);
    const completeness = getFbsScanCompletenessStats(clean);
    const meta: FbsSupplyScanSheetMeta = {
      updatedAt: new Date().toISOString(),
      totalRows: completeness.totalRows,
      rowsWithSticker: completeness.rowsWithSticker,
      rowsWithScanText: completeness.rowsWithScanText,
      isFullyReady: completeness.isFullyReady,
      source,
    };
    await supabase.from('app_settings').upsert([
      { key, value: JSON.stringify(clean) },
      { key: metaKey, value: JSON.stringify(meta) },
    ], { onConflict: 'key' });
    return clean;
  };

  const parseFbsScanSheetFile = async (file: File) => {
    const workbook = new ExcelJS.Workbook();
    const buf = await file.arrayBuffer();
    await workbook.xlsx.load(buf as ArrayBuffer);
    const ws = workbook.worksheets[0];
    if (!ws) throw new Error('Не удалось прочитать лист Excel');

    const rows: FbsSupplyScanOrderRow[] = [];
    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const orderId = String(row.getCell(1).value ?? '').trim();
      const stickerTextRaw = String(row.getCell(2).value ?? '').trim();
      const stickerScanTextRaw = String(row.getCell(3).value ?? '').trim();
      if (!orderId && !stickerTextRaw && !stickerScanTextRaw) return;
      const stickerDigits = normalizeStickerDigits(stickerTextRaw);
      const stickerText = stickerTextRaw || formatStickerDigits(stickerDigits);
      const stickerScanText = normalizeScanStickerText(stickerScanTextRaw);
      rows.push({
        storageKey: normalizeFbsStorageKey({ orderId, stickerDigits, stickerScanText }),
        orderId,
        title: '',
        article: '',
        size: '',
        stickerDigits,
        stickerText,
        stickerScanText,
      });
    });
    return sanitizeFbsScanRows(rows);
  };

  const filterOrdersForSupplyId = (supplyId: string, supplyOrdersRaw: any[]) => {
    const targetSupplyId = String(supplyId || '').trim().toLowerCase();
    const rows = Array.isArray(supplyOrdersRaw) ? supplyOrdersRaw : [];
    const getCandidates = (o: any) => [o?.supplyId, o?.supplyID, o?.supply_id, o?.supply?.id]
      .map((v) => String(v || '').trim().toLowerCase())
      .filter(Boolean);

    const strictFiltered = rows.filter((o: any) => {
      const candidates = getCandidates(o);
      return candidates.length === 0 ? true : candidates.some((c) => c === targetSupplyId);
    });

    if (strictFiltered.length > 0) return strictFiltered;

    return rows.filter((o: any) => {
      const candidates = getCandidates(o);
      return candidates.length === 0 ? true : candidates.some((c) => c.includes(targetSupplyId) || targetSupplyId.includes(c));
    });
  };

  const getFbsOrderCountKey = (o: any) => String(o?.id ?? o?.orderId ?? o?.order_id ?? o?.rid ?? o?.orderUid ?? '').trim();

  const getFreshSupplyOrdersCount = async (supplyId: string) => {
    const supplyOrdersRaw = await fetchOrdersForSupply(supplyId, { enrich: false, fresh: true });
    if (!supplyOrdersRaw || supplyOrdersRaw.length === 0) return 0;
    const filtered = filterOrdersForSupplyId(supplyId, supplyOrdersRaw);
    const uniqueKeys = new Set(filtered.map(getFbsOrderCountKey).filter(Boolean));
    return uniqueKeys.size || filtered.length;
  };

  const getSupplyOrdersForScan = async (supplyId: string): Promise<FbsSupplyScanOrderRow[]> => {
    let supplyOrdersRaw = await fetchOrdersForSupply(supplyId, { enrich: true, fresh: true });
    if (!supplyOrdersRaw || supplyOrdersRaw.length === 0) {
      supplyOrdersRaw = await fetchOrdersForSupply(supplyId, { enrich: false, fresh: true });
    }
    if (!supplyOrdersRaw || supplyOrdersRaw.length === 0) {
      return [];
    }

    const relaxedFiltered = filterOrdersForSupplyId(supplyId, supplyOrdersRaw);

    const supplyOrders = relaxedFiltered.map((o: any) => ({
      ...o,
      title: o.title || o.subject || 'Без названия',
      size: o.size || o.techSize || o.wbSize || '-',
      article: o.article || o.vendorCode || '-',
    }));

    const orderIds = Array.from(new Set(
      supplyOrders
        .map((o: any) => Number(o.id ?? o.orderId ?? o.order_id))
        .filter((id: number) => Number.isFinite(id) && id > 0)
    ));

    let fetchedStickerMeta = new Map<number, { stickerDigits: string; stickerScanText: string }>();
    try {
      fetchedStickerMeta = await withTimeout(fetchStickerMeta(orderIds), 90000, 'Таймаут загрузки стикеров');
    } catch {
      fetchedStickerMeta = new Map<number, { stickerDigits: string; stickerScanText: string }>();
    }

    const localStickerById = new Map<number, string>();
    for (const o of supplyOrders) {
      const oid = Number(o.id ?? o.orderId ?? o.order_id);
      const digits = extractStickerLabel(o);
      if (Number.isFinite(oid) && digits) localStickerById.set(oid, digits);
    }

    return sanitizeFbsScanRows(sortOrdersForPicking(supplyOrders)
      .map((o: any) => {
        const orderIdNum = Number(o.id ?? o.orderId ?? o.order_id);
        const meta = Number.isFinite(orderIdNum) ? fetchedStickerMeta.get(orderIdNum) : undefined;
        const fromApi = meta?.stickerDigits || '';
        const fromOrder = extractStickerLabel(o);
        const stickerDigits = normalizeStickerDigits(fromApi || fromOrder || localStickerById.get(orderIdNum) || '');
        const orderId = String(o.id ?? o.orderId ?? o.order_id ?? '-');
        const stickerText = formatStickerDigits(stickerDigits);
        const stickerScanText = meta?.stickerScanText || extractAutoStickerScanText(o);
        return {
          storageKey: normalizeFbsStorageKey({ orderId, stickerDigits, stickerScanText }),
          orderId,
          title: String(o.title || 'Без названия'),
          article: String(o.article || o.vendorCode || '-'),
          size: String(o.size || o.techSize || o.wbSize || '-'),
          stickerDigits,
          stickerText,
          stickerScanText,
        };
      }));
  };

  const loadPreparedFbsScanRows = async (supplyId: string, supplierId?: string, options?: { forceRefresh?: boolean }) => {
    const forceRefresh = Boolean(options?.forceRefresh);
    const [sheetRows, sheetMeta] = await Promise.all([
      loadFbsSupplyScanSheetRows(supplyId, supplierId),
      loadFbsSupplyScanSheetMeta(supplyId, supplierId),
    ]);

    const cachedCompleteness = getFbsScanCompletenessStats(sheetRows);
    const canUseCachedSheet = Boolean(
      sheetRows.length
      && sheetMeta?.isFullyReady
      && cachedCompleteness.isFullyReady
      && sheetMeta.totalRows === cachedCompleteness.totalRows
      && sheetMeta.rowsWithSticker === cachedCompleteness.rowsWithSticker
      && sheetMeta.rowsWithScanText === cachedCompleteness.rowsWithScanText
    );

    if (canUseCachedSheet) {
      if (!forceRefresh) {
        return { rows: sheetRows, sheetRows, apiRows: [] as FbsSupplyScanOrderRow[], mergedRows: sheetRows, sheetMeta, source: 'cache' as const };
      }

      const freshCount = await getFreshSupplyOrdersCount(supplyId);
      if (freshCount > 0 && freshCount === cachedCompleteness.totalRows) {
        return { rows: sheetRows, sheetRows, apiRows: [] as FbsSupplyScanOrderRow[], mergedRows: sheetRows, sheetMeta, source: 'cache' as const, freshCount };
      }
    }

    const apiRows = await getSupplyOrdersForScan(supplyId);
    const mergedRows = apiRows.length ? mergeFbsScanRows(apiRows, sheetRows) : sheetRows;
    const needsStickerEnrich = mergedRows.some((row) => !normalizeStickerDigits(String(row?.stickerDigits || '')) || !looksReadableStickerScanText(String(row?.stickerScanText || '')));
    const enrichedRows = needsStickerEnrich ? await enrichFbsScanRowsWithStickerMeta(mergedRows) : mergedRows;
    const rows = getUniqueFbsScanRows(enrichedRows);
    return { rows, sheetRows, apiRows, mergedRows, sheetMeta, source: 'wb' as const };
  };

  const openFbsScanModal = async () => {
    if (!activeSupplyId) return;
    setFbsScanModalOpen(true);
    setFbsScanLoading(true);
    setFbsScanMode('sticker');
    setFbsScanInputValue('');
    setFbsPendingStickerRow(null);
    setFbsScanNotice(null);
    try {
      const [{ rows, sheetRows, apiRows, mergedRows, sheetMeta, source }, savedMap] = await Promise.all([
        loadPreparedFbsScanRows(activeSupplyId, selectedSupplierId),
        loadFbsSupplyScanMap(activeSupplyId, selectedSupplierId),
      ]);
      setFbsScanRows(rows);
      setFbsScansBySticker(savedMap);
      const completeness = getFbsScanCompletenessStats(rows);
      if (source !== 'cache' && (apiRows.length || JSON.stringify(rows) !== JSON.stringify(getUniqueFbsScanRows(mergedRows))) && completeness.isFullyReady) {
        void saveFbsSupplyScanSheetRows(activeSupplyId, rows, selectedSupplierId, 'wb').catch(() => undefined);
      }
      if (!rows.length) {
        setFbsScanNotice({ type: 'info', text: 'В поставке пока нет строк для сканирования. Попробую добирать их из WB автоматически, а пока можно скачать шаблон Excel по текущим данным.' });
      } else if (!completeness.isFullyReady) {
        setFbsScanNotice({ type: 'error', text: `Поставка загружена не полностью: стикеров ${completeness.rowsWithSticker}/${completeness.totalRows}, «Стикер при считывании» ${completeness.rowsWithScanText}/${completeness.totalRows}. Частичный файл больше не будет скачиваться, пока WB не отдаст полный набор.` });
      } else if (source === 'cache') {
        const cacheTime = sheetMeta?.updatedAt ? new Date(sheetMeta.updatedAt).toLocaleString('ru-RU') : '';
        setFbsScanNotice({ type: 'success', text: `Поставка загружена из сохранённой БД-копии: ${rows.length} строк.${cacheTime ? ` Кеш обновлён ${cacheTime}.` : ''}` });
      } else if (apiRows.length) {
        setFbsScanNotice({ type: 'success', text: `Список сформирован автоматически: ${rows.length} строк, все стикеры и значения «Стикер при считывании» заполнены.` });
      } else if (sheetRows.length) {
        setFbsScanNotice({ type: 'success', text: `Загружен шаблон поставки: ${rows.length} строк.` });
      }
    } catch (e: any) {
      setFbsScanNotice({ type: 'error', text: e?.message || 'Ошибка загрузки данных для сканирования ЧЗ' });
    } finally {
      setFbsScanLoading(false);
    }
  };

  const handleFbsScanFileUpload = async (file: File) => {
    if (!activeSupplyId) return;
    setFbsScanLoading(true);
    setFbsScanNotice(null);
    try {
      const uploadedRows = await parseFbsScanSheetFile(file);
      if (!uploadedRows.length) {
        throw new Error('Файл пустой или не содержит строк поставки');
      }

      const enrichedRows = await enrichFbsScanRowsWithStickerMeta(uploadedRows);
      const rows = getUniqueFbsScanRows(enrichedRows);
      const savedRows = await saveFbsSupplyScanSheetRows(activeSupplyId, rows, selectedSupplierId, 'upload');
      setFbsScanRows(savedRows);
      const stats = getFbsScanProgressStats(savedRows, fbsScansBySticker);
      setFbsScanNotice({ type: 'success', text: `Файл поставки загружен без подмены данных: ${stats.totalRows} строк.` });
    } catch (e: any) {
      setFbsScanNotice({ type: 'error', text: e?.message || 'Не удалось загрузить Excel-файл поставки' });
    } finally {
      setFbsScanLoading(false);
    }
  };

  const resetFbsScannedCode = async (row: FbsSupplyScanOrderRow) => {
    if (!activeSupplyId) return;
    try {
      const next = { ...(fbsScansBySticker || {}) };
      const currentEntry = findFbsScanSavedEntry(row, next);
      if (currentEntry?.key) delete next[currentEntry.key];
      else delete next[row.storageKey];
      const saved = await saveFbsSupplyScanMap(activeSupplyId, next, selectedSupplierId);
      setFbsScansBySticker(saved);
      if (fbsPendingStickerRow?.storageKey === row.storageKey) {
        setFbsPendingStickerRow(null);
        setFbsScanMode('sticker');
        setFbsScanInputValue('');
      }
      setFbsScanNotice({ type: 'success', text: `ЧЗ для заказа ${row.orderId} сброшен. Можно сканировать заново.` });
    } catch (e: any) {
      setFbsScanNotice({ type: 'error', text: e?.message || 'Не удалось сбросить ЧЗ' });
    }
  };

  const downloadFbsScanTemplateExcel = async () => {
    if (!activeSupplyId) return;
    try {
      setFbsScanNotice({ type: 'info', text: 'Проверяю количество заказов в WB перед формированием Excel...' });
      const { rows, apiRows, source } = await loadPreparedFbsScanRows(activeSupplyId, selectedSupplierId, { forceRefresh: true });
      if (!rows.length) {
        setFbsScanNotice({ type: 'error', text: 'Не удалось сформировать Excel: в поставке нет строк для сканирования.' });
        return;
      }
      const completeness = assertFbsScanRowsReadyForExport(rows, 'Excel по поставке');
      setFbsScanRows(rows);
      if (source !== 'cache' && apiRows.length) {
        void saveFbsSupplyScanSheetRows(activeSupplyId, rows, selectedSupplierId, 'wb').catch(() => undefined);
      }

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Worksheet');
      ws.addRow(['Номер заказа', 'Стикер', 'Стикер при считывании']);
      rows.forEach((row) => {
        ws.addRow([
          String(row.orderId || ''),
          String(row.stickerText || '').replace(/_/g, ' '),
          String(row.stickerScanText || ''),
        ]);
      });
      ws.columns = [
        { width: 18 },
        { width: 18 },
        { width: 24 },
      ];
      ws.getRow(1).font = { bold: true } as any;

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `supply-list-${String(activeSupplyId || 'supply')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      const stats = getFbsScanProgressStats(rows, fbsScansBySticker);
      setFbsScanNotice({ type: 'success', text: source === 'cache'
        ? `Excel сформирован из кеша: количество заказов не изменилось (${stats.totalRows} строк).`
        : `Excel сформирован по актуальным данным WB: ${stats.totalRows} строк, стикеры ${completeness.rowsWithSticker}/${completeness.totalRows}, «Стикер при считывании» ${completeness.rowsWithScanText}/${completeness.totalRows}.` });
    } catch (e: any) {
      setFbsScanNotice({ type: 'error', text: e?.message || 'Не удалось скачать Excel по поставке' });
    }
  };

  const downloadFbsScanResultExcel = async () => {
    if (!activeSupplyId) return;
    try {
      const [{ rows, apiRows, source }, savedMap] = await Promise.all([
        loadPreparedFbsScanRows(activeSupplyId, selectedSupplierId),
        loadFbsSupplyScanMap(activeSupplyId, selectedSupplierId),
      ]);
      if (!rows.length) {
        setFbsScanNotice({ type: 'error', text: 'Не удалось сформировать скан файл: в поставке нет строк.' });
        return;
      }
      const completeness = assertFbsScanRowsReadyForExport(rows, 'скан файл');
      setFbsScanRows(rows);
      setFbsScansBySticker(savedMap);
      if (source !== 'cache' && apiRows.length) {
        void saveFbsSupplyScanSheetRows(activeSupplyId, rows, selectedSupplierId, 'wb').catch(() => undefined);
      }

      const rowsWithKiz = getUniqueFbsScanRows(rows).filter((row) => Boolean(findFbsScanSavedEntry(row, savedMap)?.item?.honestSignCode));
      if (!rowsWithKiz.length) {
        setFbsScanNotice({ type: 'error', text: 'Скан файл пока пустой: нет строк с заполненным КИЗ.' });
        return;
      }

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Scan');
      ws.addRow(['№ задания', 'Стикер', 'КИЗ']);
      rowsWithKiz.forEach((row) => {
        ws.addRow([
          String(row.orderId || ''),
          String(row.stickerText || '').replace(/_/g, ' '),
          String(findFbsScanSavedEntry(row, savedMap)?.item?.honestSignCode || ''),
        ]);
      });
      ws.columns = [
        { width: 18 },
        { width: 18 },
        { width: 42 },
      ];
      ws.getRow(1).font = { bold: true } as any;

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scan-file-${String(activeSupplyId || 'supply')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      setFbsScanNotice({ type: 'success', text: `Скан файл выгружен: ${rowsWithKiz.length} строк с заполненным КИЗ, данные по поставке полные (${completeness.totalRows}/${completeness.totalRows}).` });
    } catch (e: any) {
      setFbsScanNotice({ type: 'error', text: e?.message || 'Не удалось скачать скан файл' });
    }
  };

  const handleFbsScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = String((fbsScanInputRef.current?.value ?? fbsScanInputValue) || '').trim();
    if (!raw) return;

    if (fbsScanMode === 'sticker') {
      const scanText = normalizeScannedStickerLookupKey(raw);
      const stickerDigits = normalizeStickerDigits(raw);
      const completeness = getFbsScanCompletenessStats(fbsScanRows);
      if (!completeness.isFullyReady) {
        setFbsScanNotice({ type: 'error', text: `Сканирование временно заблокировано: поставка загружена не полностью. Сейчас есть стикеров ${completeness.rowsWithSticker}/${completeness.totalRows}, «Стикер при считывании» ${completeness.rowsWithScanText}/${completeness.totalRows}. Сначала добейся полной загрузки поставки.` });
        setFbsScanInputValue('');
        return;
      }

      const row = fbsScanRows.find((item) => {
        const rowScanText = normalizeScannedStickerLookupKey(item.stickerScanText || '');
        if (scanText && rowScanText && rowScanText === scanText) return true;
        if (stickerDigits && item.stickerDigits === stickerDigits) return true;
        if (scanText && normalizeScannedStickerLookupKey(item.stickerText || '') === scanText) return true;
        return false;
      });
      if (!row) {
        setFbsScanNotice({ type: 'error', text: 'Стикер не найден в текущей поставке. Проверь файл поставки или сам скан.' });
        setFbsScanInputValue('');
        return;
      }
      setFbsScanNotice({ type: 'success', text: `Найден заказ ${row.orderId}. Теперь сканируйте ЧЗ.` });
      setFbsPendingStickerRow(row);
      setFbsScanMode('honest_sign');
      setFbsScanInputValue('');
      return;
    }

    if (!activeSupplyId || !fbsPendingStickerRow) {
      setFbsScanMode('sticker');
      setFbsScanInputValue('');
      return;
    }

    const honestSignCode = normalizeDataMatrixText(raw);
    if (!honestSignCode) {
      setFbsScanNotice({ type: 'error', text: 'Не удалось распознать код Честного знака' });
      setFbsScanInputValue('');
      return;
    }

    try {
      const existsInSupplierScannedBase = await isFbsCodeAlreadyScannedForSupplier(honestSignCode, selectedSupplierId);
      if (existsInSupplierScannedBase) {
        setFbsScanNotice({ type: 'error', text: 'Этот ЧЗ уже есть в базе отсканированных ЧЗ этого поставщика.' });
        setFbsScanInputValue('');
        return;
      }

      const next = { ...fbsScansBySticker };
      for (const key of Object.keys(next)) {
        const item = next[key];
        const sameOrder = String(item?.orderId || '').trim() && String(item?.orderId || '').trim() === String(fbsPendingStickerRow.orderId || '').trim();
        const sameSticker = normalizeStickerDigits(String(item?.stickerDigits || '')) && normalizeStickerDigits(String(item?.stickerDigits || '')) === normalizeStickerDigits(String(fbsPendingStickerRow.stickerDigits || ''));
        const sameScan = normalizeScanStickerText(String(item?.stickerScanText || '')) && normalizeScanStickerText(String(item?.stickerScanText || '')) === normalizeScanStickerText(String(fbsPendingStickerRow.stickerScanText || ''));
        if (sameOrder || sameSticker || sameScan) delete next[key];
      }
      next[fbsPendingStickerRow.storageKey] = {
        storageKey: fbsPendingStickerRow.storageKey,
        stickerDigits: fbsPendingStickerRow.stickerDigits,
        stickerScanText: fbsPendingStickerRow.stickerScanText,
        honestSignCode,
        updatedAt: new Date().toISOString(),
        orderId: fbsPendingStickerRow.orderId,
        title: fbsPendingStickerRow.title,
        article: fbsPendingStickerRow.article,
        size: fbsPendingStickerRow.size,
      };
      const saved = await saveFbsSupplyScanMap(activeSupplyId, next, selectedSupplierId);
      await syncFbsScannedCodesToUnifiedBase([honestSignCode], selectedSupplierId);
      setFbsScansBySticker(saved);
      setFbsScanNotice({ type: 'success', text: `ЧЗ сохранён для заказа ${fbsPendingStickerRow.orderId} и добавлен в базу ЧЗ.` });
      setFbsPendingStickerRow(null);
      setFbsScanMode('sticker');
      setFbsScanInputValue('');
    } catch (e: any) {
      setFbsScanNotice({ type: 'error', text: e?.message || 'Ошибка сохранения ЧЗ' });
    }
  };

  const sortOrdersForPicking = (list: any[]) => {
    return [...list].sort((a: any, b: any) => {
      const articleDiff = String(a.article || '').localeCompare(String(b.article || ''));
      if (articleDiff !== 0) return articleDiff;
      return compareSizeStrings(String(a.size || ''), String(b.size || ''));
    });
  };

  const fetchSupplies = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await wbFetch('https://marketplace-api.wildberries.ru/api/v3/supplies?limit=1000&next=0');
      let suppliesList = data.supplies || [];
      
      suppliesList.sort((a: WBSupply, b: WBSupply) => {
        const aClosed = !!a.closedAt;
        const bClosed = !!b.closedAt;
        if (aClosed !== bClosed) return aClosed ? 1 : -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      if (showAllSupplies) {
        setSupplies(suppliesList);
      } else {
        setSupplies(suppliesList.filter((s: WBSupply) => !s.closedAt));
      }
      
      if (!activeSupplyId) {
        const active = suppliesList.find((s: WBSupply) => !s.closedAt) || suppliesList[0];
        if (active) setActiveSupplyId(active.id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
      if (selectedSupplierId && (activeTab === 'fbs' || activeTab === 'fbs_calc')) fetchSupplies();
  }, [showAllSupplies, activeTab]);

  const createSupply = async () => {
    if (!newSupplyName) return;
    setLoading(true);
    setError(null);
    try {
      const res = await wbFetch('https://marketplace-api.wildberries.ru/api/v3/supplies', {
        method: 'POST',
        body: JSON.stringify({ name: newSupplyName }),
      });
      
      const newId = res.id;
      setSuccessMsg(`Поставка создана: ${newId}`);
      setActiveSupplyId(newId);
      setShowCreateSupplyModal(false);
      fetchSupplies();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addOrdersToSupply = async () => {
    if (!activeSupplyId) {
      setError('Выберите активную поставку');
      return;
    }
    if (selectedOrderIds.size === 0) {
      setError('Выберите заказы для добавления');
      return;
    }
    if (selectedOrderIds.size > 999) {
      setError('Максимум 999 заказов в одной поставке');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const supplyId = encodeURIComponent(String(activeSupplyId));
      const orders = Array.from(selectedOrderIds).map((v) => String(v));

      let done = false;
      let lastErr: any = null;
      let customSuccess: string | null = null;

      // v1: batch PATCH { orders: [...] }
      try {
        await wbFetch(`https://marketplace-api.wildberries.ru/api/v3/supplies/${supplyId}/orders`, {
          method: 'PATCH',
          body: JSON.stringify({ orders }),
        });
        done = true;
      } catch (e1: any) {
        lastErr = e1;

        // v2: batch POST { orders: [...] }
        try {
          await wbFetch(`https://marketplace-api.wildberries.ru/api/v3/supplies/${supplyId}/orders`, {
            method: 'POST',
            body: JSON.stringify({ orders }),
          });
          done = true;
        } catch (e2: any) {
          lastErr = e2;

          // v3: per-order endpoints fallback matrix
          let okCount = 0;
          for (const orderId of orders) {
            const oid = encodeURIComponent(orderId);
            const variants: Array<{ method: 'PATCH' | 'POST'; url: string; body?: any }> = [
              { method: 'PATCH', url: `https://marketplace-api.wildberries.ru/api/v3/supplies/${supplyId}/orders/${oid}` },
              { method: 'POST',  url: `https://marketplace-api.wildberries.ru/api/v3/supplies/${supplyId}/orders/${oid}` },
              { method: 'POST',  url: `https://marketplace-api.wildberries.ru/api/v3/supplies/${supplyId}/orders/${oid}/add` },
              { method: 'PATCH', url: `https://marketplace-api.wildberries.ru/api/v3/supplies/${supplyId}/orders/add`, body: { orderId: orderId } },
            ];

            let added = false;
            for (const v of variants) {
              try {
                await wbFetch(v.url, {
                  method: v.method,
                  ...(v.body ? { body: JSON.stringify(v.body) } : {}),
                });
                added = true;
                okCount += 1;
                break;
              } catch (eTry) {
                lastErr = eTry;
              }
            }

            if (!added) {
              // continue to next order; aggregated result will show partial success/failure
            }
          }

          if (okCount > 0) {
            done = true;
            customSuccess = `Добавлено ${okCount} из ${orders.length} заказов в поставку ${activeSupplyId}`;
          }
        }
      }

      if (!done) throw lastErr || new Error('Не удалось добавить заказы в поставку');

      setSuccessMsg(customSuccess || `Добавлено ${selectedOrderIds.size} заказов в поставку ${activeSupplyId}`);
      setSelectedOrderIds(new Set());
      fetchNewOrders();
    } catch (err: any) {
      const raw = err?.message || 'Ошибка добавления заказов в поставку';
      setError(`Не удалось добавить заказы в поставку WB. ${raw}`);
    } finally {
      setLoading(false);
    }
  };

  // --- Supply Order (Заказ поставщику) ---

  const loadProductsForSupplyOrder = async () => {
      setError(null);

      // Кэш карточек: компонент монтируется заново при каждом заходе на вкладку,
      // а карточки тянулись с WB Content API постранично (десятки запросов) каждый
      // раз — отсюда долгая загрузка. Показываем из localStorage мгновенно, а свежие
      // данные подтягиваем фоном.
      const productsCacheKey = `wb_supply_order_products_v1:${selectedSupplierId || 'unknown'}`;
      let hadCache = false;
      try {
          const raw = localStorage.getItem(productsCacheKey);
          if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed?.products) && parsed.products.length) {
                  setProducts(parsed.products);
                  hadCache = true;
              }
          }
      } catch {}

      if (!hadCache) setLoading(true);
      try {
          let loadedProducts: ProductCard[] = [];
          let fromFallback = false;

          try {
              const { list } = await fetchSellerCards();
              loadedProducts = list;
              setSuccessMsg('Товары загружены (Content API).');
          } catch (e: any) {
              console.error('Seller API failed, switching to fallback:', e);
              loadedProducts = await fetchProductsFallback();
              fromFallback = true;
          }

          if (loadedProducts.length === 0) {
              if (!hadCache) {
                  setProducts([]);
                  setError('Не удалось загрузить товары: WB API временно недоступно');
              }
              return;
          }

          // Fetch stocks and merge
          const stocks = await fetchStocks(loadedProducts);
          const productsWithStock = loadedProducts.map(p => ({
              ...p,
              sizes: p.sizes.map(s => {
                  const nmKey = Number(p.nmID);
                  const vendorKey = normalizeVendorCode(p.vendorCode || '');
                  const stockData = stocks.byNmId[nmKey] || (vendorKey ? stocks.byVendorCode[vendorKey] : undefined);
                  let stock = 0;

                  if (stockData) {
                      const chrtId = Number((s as any).chrtID ?? (s as any).chrtId ?? (s as any).chrt_id);
                      if (Number.isFinite(chrtId) && chrtId > 0 && stockData.byChrtId?.[String(chrtId)] != null) {
                          stock = stockData.byChrtId[String(chrtId)] || 0;
                      }

                      // Try by barcode next
                      if (stock === 0 && s.skus && s.skus.length > 0 && (stockData as any).byBarcode) {
                          for (const sku of s.skus) {
                              const barcodeKey = normalizeBarcode(sku);
                              if ((stockData as any).byBarcode[barcodeKey]) {
                                  stock += (stockData as any).byBarcode[barcodeKey];
                              }
                          }
                      }

                      // If no stock found by barcode, try by size aliases
                      if (stock === 0) {
                          const sizeKeys = Array.from(new Set([
                            normalizeKey(s.techSize),
                            normalizeKey(s.wbSize),
                            normalizeKey((s as any).size),
                          ].filter(Boolean)));

                          for (const k of sizeKeys) {
                            if (stockData.bySize[k]) {
                              stock = stockData.bySize[k];
                              break;
                            }
                          }
                      }
                  }

                  const totalStock = stockData?.total || 0;
                  return { ...s, stock, totalStock };
              })
          }));

          setProducts(productsWithStock);
          try { localStorage.setItem(productsCacheKey, JSON.stringify({ ts: Date.now(), products: productsWithStock })); } catch {}
          if (fromFallback) {
            setSuccessMsg(`Загружено ${productsWithStock.length} товаров (fallback режим)`);
          }
      } catch (e: any) {
          // Если есть кэш — оставляем его на экране, ошибку не показываем.
          if (!hadCache) setError(`Ошибка загрузки товаров: ${e?.message || 'Failed to fetch'}`);
      } finally {
          setLoading(false);
      }
  };

  const resolveOrderSizeForProduct = (order: any, product: ProductCard) => {
      const isLetterSize = (v: string) => /^(XXS|XS|S|M|L|XL|XXL|XXXL|\dXL)$/i.test(v);

      const productSizes = Array.from(new Set(
        (product?.sizes || [])
          .flatMap((s: any) => [String(s?.techSize || ''), String(s?.wbSize || '')])
          .map((v) => String(v || '').replace(/\s+/g, '').toUpperCase().trim())
          .filter((v) => Boolean(v) && isLetterSize(v))
      ));

      // 1) Best match by SKU/barcode to product size map
      const orderSkus = Array.isArray(order?.skus) ? order.skus.map((x: any) => normalizeBarcode(x)) : [];
      if (orderSkus.length > 0 && Array.isArray(product?.sizes)) {
        for (const s of product.sizes as any[]) {
          const sizeSkus = Array.isArray(s?.skus) ? s.skus.map((x: any) => normalizeBarcode(x)) : [];
          const hasSkuMatch = sizeSkus.some((sku: string) => orderSkus.includes(sku));
          if (hasSkuMatch) {
            const sName = String(s?.techSize || s?.wbSize || '').replace(/\s+/g, '').toUpperCase().trim();
            if (sName && isLetterSize(sName)) return sName;
          }
        }
      }

      // 2) Fallback by explicit size fields from order
      const candidateRaw = [order?.techSize, order?.size, order?.wbSize, order?.tech_size]
        .map((v) => String(v ?? '').trim())
        .find(Boolean) || '';

      const cleanCandidate = candidateRaw
        .replace(/^[-–—\s]+/, '')
        .replace(/\s+/g, '')
        .toUpperCase()
        .trim();

      // only letter sizes (M..9XL), ignore numeric buckets like 50/52
      if (!cleanCandidate || !isLetterSize(cleanCandidate)) return '';

      const exact = productSizes.find((sz) => normalizeKey(sz) === normalizeKey(cleanCandidate));
      if (exact) return exact;

      // if product has no size dictionary, still keep valid letter size from order
      if (productSizes.length === 0 && isLetterSize(cleanCandidate)) return cleanCandidate;

      return '';
  };

  const fetchProductOrdersChart = async (product: ProductCard, start: string, end: string) => {
      if (!product) return;
      const startTs = Math.floor(new Date(`${start}T00:00:00`).getTime() / 1000);
      const endDate = new Date(`${end}T23:59:59`);
      const startDate = new Date(`${start}T00:00:00`);

      const dayMap = new Map<string, { qty: number; bySize: Record<string, number> }>();
      const cursorDate = new Date(`${start}T00:00:00`);
      while (cursorDate <= endDate) {
        dayMap.set(cursorDate.toISOString().slice(0, 10), { qty: 0, bySize: {} });
        cursorDate.setDate(cursorDate.getDate() + 1);
      }

      const seenOrders = new Set<string>();

      const appendOrder = (o: any) => {
        const orderDateRaw = o?.createdAt || o?.created_at || o?.date || o?.lastChangeDate || o?.created;
        if (!orderDateRaw) return;

        const orderDate = new Date(orderDateRaw);
        if (orderDate < startDate || orderDate > endDate) return;

        const orderNmId = Number(o?.nmId ?? o?.nmID ?? o?.nm_id ?? 0);
        const orderArticle = String(o?.article || o?.supplierArticle || o?.vendorCode || '').toLowerCase().trim();
        const productArticle = String(product.vendorCode || '').toLowerCase().trim();

        const isMatch = (Number.isFinite(orderNmId) && orderNmId === Number(product.nmID)) || (productArticle && orderArticle === productArticle);
        if (!isMatch) return;

        const key = orderDate.toISOString().slice(0, 10);
        const uniqKey = String(o?.odid || o?.srid || o?.rid || `${key}_${orderNmId}_${orderArticle}_${o?.barcode || ''}_${o?.chrtId || ''}`);
        if (seenOrders.has(uniqKey)) return;
        seenOrders.add(uniqKey);

        const qty = Number(o?.quantity ?? 1) || 1;
        const sizeKey = resolveOrderSizeForProduct(o, product);

        const current = dayMap.get(key) || { qty: 0, bySize: {} };
        current.qty += qty;
        if (sizeKey) {
          current.bySize[sizeKey] = (current.bySize[sizeKey] || 0) + qty;
        }
        dayMap.set(key, current);
      };

      // Main source: marketplace orders
      let next = 0;
      for (let page = 0; page < 20; page++) {
        const data = await wbFetch(`https://marketplace-api.wildberries.ru/api/v3/orders?limit=1000&next=${next}&dateFrom=${startTs}`);
        const batch: any[] = data?.orders || [];
        if (batch.length === 0) break;

        for (const o of batch) appendOrder(o);

        if (typeof data?.next !== 'number' || data.next === next) break;
        next = data.next;
      }

      // Extra source: statistics API (to include marketplace-model orders if absent in main feed)
      try {
        const statsToken = getSupplierToken();
        const statsRes = await fetch(`https://statistics-api.wildberries.ru/api/v1/supplier/orders?dateFrom=${start}`, {
          headers: { Authorization: statsToken || '' },
        });
        if (statsRes.ok) {
          const statsOrders: any[] = await statsRes.json();
          for (const o of statsOrders || []) appendOrder(o);
        }
      } catch (e) {
        console.warn('Statistics orders fetch failed:', e);
      }

      const series = Array.from(dayMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, v]) => ({ date, qty: v.qty, bySize: v.bySize }));

      setProductChartData(series);
  };

  const openProductOrdersChart = async (product: ProductCard) => {
    setProductChartModal({ open: true, product });
    setHiddenChartSizes([]);
    setLoadingProductChart(true);
    try {
      await fetchProductOrdersChart(product, productChartRange.start, productChartRange.end);
    } catch (e: any) {
      setError(`Ошибка загрузки графика: ${e?.message || 'Failed to fetch'}`);
      setProductChartData([]);
    } finally {
      setLoadingProductChart(false);
    }
  };

  useEffect(() => {
      if (activeTab === 'supply_order' && selectedSupplierId) {
          loadProductsForSupplyOrder();
      }
  }, [activeTab, selectedSupplierId]);

  const handleSupplyOrderQuantityChange = (nmId: number, size: string, quantity: number) => {
      const key = `${nmId}_${size}`;
      if (quantity <= 0) {
          const newItems = { ...supplyOrderItems };
          delete newItems[key];
          setSupplyOrderItems(newItems);
      } else {
          setSupplyOrderItems({
              ...supplyOrderItems,
              [key]: quantity
          });
      }
  };

  const buildSupplyOrderItems = () => {
      const groupedItems: Record<number, { product: ProductCard, sizes: { size: string, quantity: number }[] }> = {};

      Object.entries(supplyOrderItems).forEach(([key, quantity]) => {
          const [nmIdStr, size] = key.split('_');
          const nmId = parseInt(nmIdStr);
          const product = products.find(p => p.nmID === nmId);
          if (product && quantity > 0) {
              if (!groupedItems[nmId]) {
                  groupedItems[nmId] = { product, sizes: [] };
              }
              groupedItems[nmId].sizes.push({ size, quantity });
          }
      });

      const result = Object.values(groupedItems).map(item => {
          item.sizes.sort((a, b) => {
              const sizeA = String(a.size).toUpperCase();
              const sizeB = String(b.size).toUpperCase();

              const numA = parseFloat(sizeA.replace(',', '.'));
              const numB = parseFloat(sizeB.replace(',', '.'));

              if (!isNaN(numA) && !isNaN(numB)) return numA - numB;

              const order = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', '5XL', '6XL'];
              const indexA = order.indexOf(sizeA);
              const indexB = order.indexOf(sizeB);

              if (indexA !== -1 && indexB !== -1) return indexA - indexB;
              if (indexA !== -1) return -1;
              if (indexB !== -1) return 1;

              return sizeA.localeCompare(sizeB);
          });
          return item;
      });

      // Применяем заданный пользователем порядок (если есть). Товары с
      // выставленной позицией идут первыми по возрастанию, остальные — после,
      // в исходном порядке.
      const hasSeq = Object.keys(orderArrangeSeq).length > 0;
      if (hasSeq) {
        const baseIndex = new Map<number, number>();
        result.forEach((it, i) => baseIndex.set(it.product.nmID, i));
        result.sort((a, b) => {
          const pa = orderArrangeSeq[a.product.nmID];
          const pb = orderArrangeSeq[b.product.nmID];
          const ka = pa != null ? pa : 1e9 + (baseIndex.get(a.product.nmID) || 0);
          const kb = pb != null ? pb : 1e9 + (baseIndex.get(b.product.nmID) || 0);
          return ka - kb;
        });
      }
      return result;
  };

  const getOrderStoredCost = (row: any, overrides?: Record<string, number>) => {
    const source = overrides || orderCostOverrides || {};
    for (const candidate of getCalcCostKeyCandidates(row)) {
      const value = Number(source?.[candidate] || 0);
      if (value > 0) return value;
    }
    return 0;
  };

  const supplyOrderSummaryRows = useMemo(() => {
    return buildSupplyOrderItems().map((item) => {
      const qty = item.sizes.reduce((sum, s) => sum + Number(s.quantity || 0), 0);
      const costPerUnit = Number(getOrderStoredCost({
        key: String(item.product?.nmID || ''),
        nmId: item.product?.nmID,
        article: item.product?.vendorCode || '',
        title: item.product?.title || '',
      }) || 0);
      return {
        nmId: item.product?.nmID,
        article: item.product?.vendorCode || '',
        title: item.product?.title || '',
        qty,
        sizes: item.sizes,
        costPerUnit,
        totalCost: qty * costPerUnit,
      };
    });
  }, [products, supplyOrderItems, orderCostOverrides]);

  const supplyOrderTotalCost = useMemo(() => {
    return supplyOrderSummaryRows.reduce((sum, row) => sum + Number(row.totalCost || 0), 0);
  }, [supplyOrderSummaryRows]);

  const orderCostItems = useMemo(() => {
    const map = new Map<string, { key: string; nmId?: number; article: string; title: string; qty: number }>();

    supplyOrderSummaryRows.forEach((row) => {
      const key = String(row.nmId || row.article || row.title || '');
      map.set(key, { key, nmId: row.nmId, article: row.article, title: row.title, qty: row.qty });
    });

    return Array.from(map.values());
  }, [supplyOrderSummaryRows]);

  const orderMissingCostItems = useMemo(() => {
    return supplyOrderSummaryRows.filter((row) => Number(row.costPerUnit || 0) <= 0);
  }, [supplyOrderSummaryRows]);

  const parseFbsOrdersFile = async (file: File) => {
      setFbsOrdersLoading(true);
      setError(null);
      try {
        const ab = await file.arrayBuffer();
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(ab as ArrayBuffer);

        const ws = wb.getWorksheet('Сборочные задания') || wb.worksheets[0];
        if (!ws) throw new Error('Не найден лист в файле');

        const header: Record<string, number> = {};
        ws.getRow(1).eachCell((cell, colNumber) => {
          header[String(cell.value || '').trim()] = colNumber;
        });

        const col = (...names: string[]) => names.map((n) => header[n]).find(Boolean) as number | undefined;
        const isFboAcceptance = activeTab === 'fbo_acceptance';

        const cTask = col('№ задания', 'Номер задания', 'ID задания');
        const cName = col('Наименование', 'Название', 'Предмет');
        const cWb = col('Артикул Wildberries', 'Номенклатура', 'Номенклатура WB', 'nmID', 'Артикул WB');
        const cQty = col('Количество', 'Кол-во', 'Колво', 'Штук');
        const cCreated = col('Дата создания', 'Дата', 'Дата приемки');

        if (!cWb) throw new Error('В файле не найдена номенклатура (Артикул Wildberries / Номенклатура)');
        if (!isFboAcceptance && (!cTask || !cName)) throw new Error('В файле нет нужных колонок: № задания / Наименование / Артикул Wildberries');

        const map = new Map<string, { wbArticle: string; name: string; taskSet: Set<string>; qty: number }>();
        let minTs = Number.POSITIVE_INFINITY;
        let maxTs = Number.NEGATIVE_INFINITY;
        let rawTotalQty = 0;
        let skippedRows = 0;

        ws.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;
          const task = String(cTask ? (row.getCell(cTask).value || '') : '').trim();
          const nameRaw = String(cName ? (row.getCell(cName).value || '') : '').trim();
          const wbArticle = String(row.getCell(cWb).value || '').trim();
          const qty = Number(cQty ? row.getCell(cQty).value : 0) || 1;
          if (!wbArticle && !nameRaw) { skippedRows += 1; return; }
          rawTotalQty += Math.max(1, qty);
          const key = `${wbArticle}__${nameRaw || '-'}`;
          if (!map.has(key)) map.set(key, { wbArticle, name: nameRaw || '-', taskSet: new Set<string>(), qty: 0 });
          if (task && task !== '-') map.get(key)!.taskSet.add(task);
          map.get(key)!.qty += Math.max(1, qty);

          if (cCreated) {
            const v: any = row.getCell(cCreated).value;
            let ts = NaN;
            if (v instanceof Date) ts = v.getTime();
            else {
              const s = String(v || '').trim();
              const m = s.match(/(\d{2})\.(\d{2})\.(\d{4})/);
              if (m) {
                const hhmmss = s.match(/(\d{2}):(\d{2})(?::(\d{2}))?/);
                const hh = hhmmss ? Number(hhmmss[1]) : 12;
                const mi = hhmmss ? Number(hhmmss[2]) : 0;
                const ss = hhmmss && hhmmss[3] ? Number(hhmmss[3]) : 0;
                ts = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), hh, mi, ss, 0).getTime();
              } else {
                const t = new Date(s).getTime();
                if (Number.isFinite(t)) ts = t;
              }
            }
            if (Number.isFinite(ts)) {
              if (ts < minTs) minTs = ts;
              if (ts > maxTs) maxTs = ts;
            }
          }
        });

        if (selectedSupplierId) {
          try {
            const nmIds = Array.from(new Set(Array.from(map.values()).map((x) => normalizeNmKey(x.wbArticle)).filter(Boolean)));
            if (nmIds.length) {
              const { data: nmRows } = await supabase
                .from('wb_products_cache')
                .select('nm_id, supplier_id')
                .in('nm_id', nmIds as any)
                .limit(10000);

              const nmToSuppliers = new Map<string, Set<string>>();
              (nmRows || []).forEach((r: any) => {
                const nm = normalizeNmKey(r?.nm_id);
                const sid = String(r?.supplier_id || '').trim();
                if (!nm || !sid) return;
                if (!nmToSuppliers.has(nm)) nmToSuppliers.set(nm, new Set<string>());
                nmToSuppliers.get(nm)!.add(sid);
              });

              const offendersBySupplier = new Map<string, string[]>();
              Array.from(map.values()).forEach((x) => {
                const nm = normalizeNmKey(x.wbArticle);
                const sids = nmToSuppliers.get(nm);
                if (!sids || sids.size === 0) return;
                if (!sids.has(String(selectedSupplierId))) {
                  const ownerSid = Array.from(sids)[0];
                  if (!offendersBySupplier.has(ownerSid)) offendersBySupplier.set(ownerSid, []);
                  const arr = offendersBySupplier.get(ownerSid)!;
                  if (!arr.includes(String(x.wbArticle))) arr.push(String(x.wbArticle));
                }
              });

              if (offendersBySupplier.size > 0) {
                const details = Array.from(offendersBySupplier.keys()).map((sid) => {
                  const sName = suppliers.find((s) => String(s.id) === String(sid))?.name || sid;
                  return sName;
                }).join(', ');
                throw new Error(`В отчете найдены товары не выбранного поставщика: ${details}`);
              }
            }
          } catch (e: any) {
            throw e;
          }
        }

        const rulesMap = new Map<string, string>();
        (fbsRenameRules || []).forEach((r) => {
          const rawArticle = String(r.article || '').trim();
          const rawName = String(r.name || '').trim();
          if (!rawArticle || !rawName) return;
          rulesMap.set(rawArticle, rawName);
          const normalizedArticle = normalizeNmKey(rawArticle);
          if (normalizedArticle) rulesMap.set(normalizedArticle, rawName);
        });

        const blockByItem = new Map<string, string>();
        (fbsBlockGroups || []).forEach((g) => {
          (g.items || []).forEach((it) => {
            const key = normalizeBlockName(String(it || ''));
            if (key) blockByItem.set(key, g.name);
          });
        });

        let fboNameByNm: Record<string, string> = {};
        if (isFboAcceptance) {
          // Use local WB products DB/cache only (no external API calls)
          const local: Record<string, string> = {};
          (products || []).forEach((p: any) => {
            if (!p?.nmID) return;
            const key = normalizeNmKey(p.nmID);
            if (key) local[key] = String(p?.title || '').trim();
          });

          // Also read local DB cache table wb_products_cache
          try {
            const nmIds = Array.from(new Set(Array.from(map.values()).map((x) => normalizeNmKey(x.wbArticle)).filter(Boolean)));
            if (nmIds.length) {
              let q = supabase
                .from('wb_products_cache')
                .select('supplier_id, nm_id, product_json')
                .in('nm_id', nmIds as any)
                .limit(5000);

              if (selectedSupplierId) {
                q = q.eq('supplier_id', selectedSupplierId);
              }

              const { data } = await q;
              (data || []).forEach((r: any) => {
                const k = normalizeNmKey(r?.nm_id);
                const pj = r?.product_json || {};
                const v = String(pj?.title || pj?.name || '').trim();
                if (k && v) local[k] = v;
              });
            }
          } catch {}

          fboNameByNm = local;
        }

        const rows = Array.from(map.values())
          .map((x) => {
            const art = String(x.wbArticle || '').trim();
            const artKey = normalizeNmKey(art);
            const baseName = isFboAcceptance ? (fboNameByNm[artKey] || fboNameByNm[art] || `Номенклатура ${art}`) : x.name;
            const renamed = rulesMap.get(art) || rulesMap.get(artKey) || baseName;
            const grouped = String(renamed || '');
            return { wbArticle: art, name: grouped, sourceName: renamed, tasks: isFboAcceptance ? Number(x.qty || 0) : x.taskSet.size };
          })
          .sort((a, b) => b.tasks - a.tasks || a.wbArticle.localeCompare(b.wbArticle));

        const gMap = new Map<string, { name: string; totalTasks: number; articles: Array<{ wbArticle: string; tasks: number }>; subMap: Map<string, number> }>();
        rows.forEach((r) => {
          const k = String(r.name || 'Без названия').trim();
          if (!gMap.has(k)) gMap.set(k, { name: k, totalTasks: 0, articles: [], subMap: new Map<string, number>() });
          const g = gMap.get(k)!;
          g.totalTasks += Number(r.tasks || 0);
          g.articles.push({ wbArticle: r.wbArticle, tasks: r.tasks });
          const sub = String(r.sourceName || '').trim();
          if (sub && sub !== k) g.subMap.set(sub, (g.subMap.get(sub) || 0) + Number(r.tasks || 0));
        });
        const groups = Array.from(gMap.values())
          .map((g) => ({
            name: g.name,
            totalTasks: g.totalTasks,
            articles: g.articles.sort((a, b) => b.tasks - a.tasks || String(a.wbArticle).localeCompare(String(b.wbArticle))),
            subNames: Array.from(g.subMap.entries()).map(([name, totalTasks]) => ({ name, totalTasks })).sort((a, b) => b.totalTasks - a.totalTasks || a.name.localeCompare(b.name, 'ru')),
          }))
          .sort((a, b) => b.totalTasks - a.totalTasks || a.name.localeCompare(b.name, 'ru'));

        setFbsOrdersRows(rows);
        setFbsOrdersGroups(groups);
        setFbsOrdersPeriod({
          start: Number.isFinite(minTs) ? new Date(minTs).toISOString() : undefined,
          end: Number.isFinite(maxTs) ? new Date(maxTs).toISOString() : undefined,
        });
        const collapsed: Record<string, boolean> = {};
        groups.forEach((g) => { collapsed[g.name] = false; });
        setFbsOrdersExpanded(collapsed);
        const totalInFile = rows.reduce((s, r) => s + Number(r.tasks || 0), 0);
        setSuccessMsg(isFboAcceptance
          ? `Файл обработан: ${rows.length} товаров, групп: ${groups.length}, всего товара: ${rawTotalQty} (в группировке: ${totalInFile}${skippedRows ? `, пропущено строк: ${skippedRows}` : ''})`
          : `Файл обработан: ${rows.length} товаров, групп: ${groups.length}`);
        setTimeout(() => setSuccessMsg(null), 2500);
      } catch (e: any) {
        setFbsOrdersRows([]);
        setFbsOrdersGroups([]);
        setError(e?.message || 'Ошибка обработки файла');
      } finally {
        setFbsOrdersLoading(false);
      }
  };

  const getDefaultFbsRenameRules = (supplierName: string) => {
      if (!/власенко/i.test(String(supplierName || ''))) return [] as Array<{ article: string; name: string }>;
      return [
        { article: '496964459', name: '4в1' },
        { article: '251672375', name: '3в1' },
        { article: '254893303', name: '3в1' },
        { article: '251672374', name: '3в1' },
        { article: '251672373', name: '3в1' },
        { article: '499660900', name: '3в1' },
        { article: '499660899', name: '3в1' },
        { article: '499660897', name: '3в1' },
        { article: '499660896', name: '3в1' },
      ];
  };

  const saveFbsRenameRules = async (rules: Array<{ article: string; name: string }>) => {
      if (!selectedSupplierId) return;
      const clean = (rules || []).map((r) => ({ article: String(r.article || '').trim(), name: String(r.name || '').trim() })).filter((r) => r.article && r.name);
      setFbsRenameRules(clean);
      try {
        const key = `fbs_common_rename_rules_v1:${selectedSupplierId}`;
        await supabase.from('app_settings').upsert([{ key, value: JSON.stringify(clean) }], { onConflict: 'key' });
      } catch {}
  };

  const saveFbsBlockGroups = async (groups: Array<{ name: string; items: string[] }>) => {
      if (!selectedSupplierId) return;
      const clean = (groups || [])
        .map((g) => ({ name: String(g.name || '').trim(), items: Array.from(new Set((g.items || []).map((x) => String(x || '').trim()).filter(Boolean))) }))
        .filter((g) => g.name && g.items.length > 0);
      setFbsBlockGroups(clean);

      // apply immediately to current opened report without re-upload
      const blockByItem = new Map<string, string>();
      clean.forEach((g) => (g.items || []).forEach((it) => {
        const key = normalizeBlockName(String(it || ''));
        if (key) blockByItem.set(key, g.name);
      }));

      if ((fbsOrdersRows || []).length) {
        const regroupedRows = (fbsOrdersRows || []).map((r: any) => {
          const currentName = String(r?.name || '').trim();
          const sourceName = String(r?.sourceName || currentName).trim();
          return { ...r, name: sourceName, sourceName };
        });

        const gMap = new Map<string, { name: string; totalTasks: number; articles: Array<{ wbArticle: string; tasks: number }>; subMap: Map<string, number> }>();
        regroupedRows.forEach((r: any) => {
          const k = String(r?.name || 'Без названия').trim();
          if (!gMap.has(k)) gMap.set(k, { name: k, totalTasks: 0, articles: [], subMap: new Map<string, number>() });
          const g = gMap.get(k)!;
          g.totalTasks += Number(r?.tasks || 0);
          g.articles.push({ wbArticle: String(r?.wbArticle || ''), tasks: Number(r?.tasks || 0) });
          const sub = String(r?.sourceName || '').trim();
          if (sub && sub !== k) g.subMap.set(sub, (g.subMap.get(sub) || 0) + Number(r?.tasks || 0));
        });

        const groupsView = Array.from(gMap.values())
          .map((g) => ({
            name: g.name,
            totalTasks: g.totalTasks,
            articles: g.articles.sort((a, b) => b.tasks - a.tasks || String(a.wbArticle).localeCompare(String(b.wbArticle))),
            subNames: Array.from(g.subMap.entries()).map(([name, totalTasks]) => ({ name, totalTasks })).sort((a, b) => b.totalTasks - a.totalTasks || a.name.localeCompare(b.name, 'ru')),
          }))
          .sort((a, b) => b.totalTasks - a.totalTasks || a.name.localeCompare(b.name, 'ru'));

        setFbsOrdersRows(regroupedRows as any);
        setFbsOrdersGroups(groupsView as any);
        const collapsed: Record<string, boolean> = {};
        groupsView.forEach((g) => { collapsed[g.name] = false; });
        setFbsOrdersExpanded(collapsed);
        const assigned = regroupedRows.filter((r: any) => String(r?.name || '') !== String(r?.sourceName || '')).length;
        setSuccessMsg(`Блоки обновлены: распределено позиций ${assigned}`);
        setTimeout(() => setSuccessMsg(null), 2500);
      } else if ((fbsOrdersGroups || []).length) {
        // opened from history (rows are empty) — regroup by existing group names
        const agg = new Map<string, number>();
        (fbsOrdersGroups || []).forEach((g: any) => {
          const src = String(g?.name || '').trim();
          const target = findBlockBySourceName(src, blockByItem);
          agg.set(target, (agg.get(target) || 0) + Number(g?.totalTasks || 0));
        });
        const groupsView = Array.from(agg.entries())
          .map(([name, totalTasks]) => ({ name, totalTasks, articles: [], subNames: [] as any[] }))
          .sort((a, b) => b.totalTasks - a.totalTasks || a.name.localeCompare(b.name, 'ru'));
        setFbsOrdersGroups(groupsView as any);
        const collapsed: Record<string, boolean> = {};
        groupsView.forEach((g) => { collapsed[g.name] = false; });
        setFbsOrdersExpanded(collapsed);
        setSuccessMsg('Блоки применены к открытому отчету');
        setTimeout(() => setSuccessMsg(null), 2500);
      }

      try {
        const key = `fbs_common_block_groups_v1:${selectedSupplierId}`;
        const { error: upsertErr } = await supabase.from('app_settings').upsert([{ key, value: JSON.stringify(clean) }], { onConflict: 'key' });
        if (upsertErr) throw upsertErr;

        // read-back from DB to avoid stale local state
        const { data: rb } = await supabase.from('app_settings').select('value').eq('key', key).maybeSingle();
        const rbParsed = rb?.value ? (typeof rb.value === 'string' ? JSON.parse(rb.value) : rb.value) : clean;
        const persisted = Array.isArray(rbParsed)
          ? rbParsed.map((x: any) => ({ name: String(x?.name || ''), items: Array.isArray(x?.items) ? x.items.map((i: any) => String(i)) : [] })).filter((x: any) => x.name)
          : clean;
        setFbsBlockGroups(persisted as any);

        // Blocks are kept only as optional rules; do not auto-regroup visible/history reports.
      } catch (e: any) {
        setError(`Не удалось сохранить блоки: ${e?.message || 'неизвестно'}`);
      }
  };

  const syncMissingBlocksFromVisibleData = async () => {
      if (!selectedSupplierId) return;
      const current = Array.isArray(fbsBlockGroups) ? [...fbsBlockGroups] : [];
      const has = new Set(current.map((b: any) => normalizeBlockName(String(b?.name || ''))));
      const inferred: Array<{ name: string; items: string[] }> = [];

      const collectFromGroups = (groups: any[]) => {
        (groups || []).forEach((g: any) => {
          const name = String(g?.name || '').trim();
          const sub = Array.isArray(g?.subNames) ? g.subNames.map((s: any) => String(s?.name || '').trim()).filter(Boolean) : [];
          if (!name || !sub.length) return;
          const nk = normalizeBlockName(name);
          if (has.has(nk)) return;
          has.add(nk);
          inferred.push({ name, items: Array.from(new Set(sub)) });
        });
      };

      collectFromGroups(fbsOrdersGroups as any);
      (fbsOrdersHistory || []).forEach((h: any) => collectFromGroups(h?.groups || []));

      if (inferred.length > 0) {
        const merged = [...current, ...inferred];
        setFbsBlockGroups(merged as any);
        const key = `fbs_common_block_groups_v1:${selectedSupplierId}`;
        await supabase.from('app_settings').upsert([{ key, value: JSON.stringify(merged) }], { onConflict: 'key' });
      }
  };

  const saveFbsOrdersReport = async (meta?: { boxes?: number; pallets?: number; warehouseName?: string; supplyDate?: string }) => {
      if (!selectedSupplierId || !fbsOrdersGroups.length) return;
      const supplierName = suppliers.find((s) => s.id === selectedSupplierId)?.name || selectedSupplierId;
      const item = {
        id: getSafeId(),
        supplierId: selectedSupplierId,
        supplierName,
        createdAt: new Date().toISOString(),
        periodStart: fbsOrdersPeriod.start,
        periodEnd: fbsOrdersPeriod.end,
        warehouseName: String(meta?.warehouseName || '').trim() || undefined,
        supplyDate: String(meta?.supplyDate || '').trim() || undefined,
        boxes: Number(meta?.boxes || 0) || 0,
        pallets: Number(meta?.pallets || 0) || 0,
        totalTasks: fbsOrdersGroups.reduce((s, g) => s + Number(g.totalTasks || 0), 0),
        groups: fbsOrdersGroups.map((g: any) => ({ name: g.name, totalTasks: g.totalTasks, subNames: Array.isArray(g.subNames) ? g.subNames : [] })),
      };

      const fingerprint = JSON.stringify({
        supplierId: item.supplierId,
        periodStart: item.periodStart || '',
        periodEnd: item.periodEnd || '',
        groups: [...item.groups].sort((a, b) => String(a.name).localeCompare(String(b.name))),
      });
      const exists = (fbsOrdersHistory || []).some((h: any) => JSON.stringify({
        supplierId: h.supplierId,
        periodStart: h.periodStart || '',
        periodEnd: h.periodEnd || '',
        groups: [...(h.groups || [])].sort((a, b) => String(a.name).localeCompare(String(b.name))),
      }) === fingerprint);
      if (exists) {
        setSuccessMsg('Такой отчет уже есть в истории (дубль не сохранен)');
        setTimeout(() => setSuccessMsg(null), 2500);
        return;
      }

      const next = [item, ...(fbsOrdersHistory || [])].slice(0, 200);
      setFbsOrdersHistory(next);
      try {
        const key = `${fbsOrdersNamespace}_history_v1:${selectedSupplierId}`;
        await supabase.from('app_settings').upsert([{ key, value: JSON.stringify(next) }], { onConflict: 'key' });
        setSuccessMsg('Отчет сохранен в историю');
        setTimeout(() => setSuccessMsg(null), 2500);
      } catch {}
  };

  const openFbsOrdersHistoryReport = (h: any) => {
    const sourceTotals = new Map<string, number>();
    const sourceTotalsNorm = new Map<string, number>();
    (h?.groups || []).forEach((g: any) => {
      const n = String(g?.name || '').trim();
      const t = Number(g?.totalTasks || 0);
      sourceTotals.set(n, (sourceTotals.get(n) || 0) + t);
      sourceTotalsNorm.set(normalizeBlockName(n), (sourceTotalsNorm.get(normalizeBlockName(n)) || 0) + t);
      (Array.isArray(g?.subNames) ? g.subNames : []).forEach((s: any) => {
        const sn = String(s?.name || '').trim();
        const st = Number(s?.totalTasks || 0);
        if (!sn || !st) return;
        sourceTotals.set(sn, (sourceTotals.get(sn) || 0) + st);
        sourceTotalsNorm.set(normalizeBlockName(sn), (sourceTotalsNorm.get(normalizeBlockName(sn)) || 0) + st);
      });
    });

    const blockByItem = new Map<string, string>();
    (fbsBlockGroups || []).forEach((g: any) => {
      const blockName = String(g?.name || '').trim();
      if (!blockName) return;
      (Array.isArray(g?.items) ? g.items : []).forEach((it: any) => {
        const key = normalizeBlockName(String(it || ''));
        if (key) blockByItem.set(key, blockName);
      });
    });

    const regrouped = new Map<string, { name: string; totalTasks: number; subMap: Map<string, number> }>();
    const pushToGroup = (sourceName: string, total: number) => {
      const cleanSource = String(sourceName || '').trim();
      if (!cleanSource || !total) return;
      const targetName = findBlockBySourceName(cleanSource, blockByItem);
      if (!regrouped.has(targetName)) {
        regrouped.set(targetName, { name: targetName, totalTasks: 0, subMap: new Map<string, number>() });
      }
      const group = regrouped.get(targetName)!;
      group.totalTasks += total;
      if (cleanSource !== targetName) {
        group.subMap.set(cleanSource, (group.subMap.get(cleanSource) || 0) + total);
      }
    };

    (h?.groups || []).forEach((g: any) => {
      const name = String(g?.name || '').trim();
      const total = Number(g?.totalTasks || 0);
      const subNames = Array.isArray(g?.subNames)
        ? g.subNames.map((s: any) => ({ name: String(s?.name || '').trim(), totalTasks: Number(s?.totalTasks || 0) })).filter((s: any) => s.name && s.totalTasks > 0)
        : [];

      if (subNames.length) {
        subNames.forEach((s: any) => pushToGroup(s.name, Number(s.totalTasks || 0)));
      } else if (name) {
        pushToGroup(name, total);
      }
    });

    const groups = Array.from(regrouped.values())
      .map((g) => ({
        name: g.name,
        totalTasks: g.totalTasks,
        subNames: Array.from(g.subMap.entries())
          .map(([name, totalTasks]) => ({ name, totalTasks }))
          .sort((a, b) => b.totalTasks - a.totalTasks || a.name.localeCompare(b.name, 'ru')),
        articles: [],
      }))
      .sort((a: any, b: any) => b.totalTasks - a.totalTasks || a.name.localeCompare(b.name, 'ru'));

    setFbsOrdersGroups(groups as any);
    setFbsOrdersRows([]);
    setFbsOrdersExpanded(Object.fromEntries(groups.map((g: any) => [g.name, false])));
    setFbsOrdersPeriod({ start: h?.periodStart, end: h?.periodEnd });
    setFbsOrdersHistoryOpen(false);
    setSuccessMsg('Отчет открыт из истории');
    setTimeout(() => setSuccessMsg(null), 2000);
  };

  const deleteFbsOrdersHistoryReport = async (id: string) => {
    const next = (fbsOrdersHistory || []).filter((x) => String(x?.id || '') !== String(id));
    setFbsOrdersHistory(next);
    try {
      const key = `${fbsOrdersNamespace}_history_v1:${selectedSupplierId}`;
      await supabase.from('app_settings').upsert([{ key, value: JSON.stringify(next) }], { onConflict: 'key' });
    } catch {}
  };

  const updateFbsOrdersHistoryMeta = async (id: string, meta: { boxes?: number; pallets?: number; warehouseName?: string; supplyDate?: string }) => {
    const next = (fbsOrdersHistory || []).map((x: any) => String(x?.id || '') === String(id)
      ? { ...x, boxes: Number(meta?.boxes || 0) || 0, pallets: Number(meta?.pallets || 0) || 0, warehouseName: String(meta?.warehouseName || '').trim() || undefined, supplyDate: String(meta?.supplyDate || '').trim() || undefined }
      : x);
    setFbsOrdersHistory(next as any);
    try {
      const key = `${fbsOrdersNamespace}_history_v1:${selectedSupplierId}`;
      await supabase.from('app_settings').upsert([{ key, value: JSON.stringify(next) }], { onConflict: 'key' });
      setSuccessMsg('Параметры отчета обновлены');
      setTimeout(() => setSuccessMsg(null), 2000);
    } catch {}
  };

  const loadFbsCalcForSupply = async (supplyId: string) => {
      if (!supplyId) return;
      setCalcLoading(true);
      setError(null);
      try {
        // Always refresh photos from DB source (wb_products_cache) for current supplier
        if (selectedSupplierId) {
          try {
            const { data: cacheRows } = await supabase
              .from('wb_products_cache')
              .select('nm_id, product_json')
              .eq('supplier_id', selectedSupplierId)
              .limit(10000);
            const next: Record<string, string> = {};
            (cacheRows || []).forEach((r: any) => {
              const nm = String(r?.nm_id || r?.product_json?.nmID || '').trim();
              const p = r?.product_json || {};
              const first = (Array.isArray(p?.photos) && p.photos[0]) || '';
              let src = typeof first === 'string' ? first : (first?.big || first?.tm || first?.c246x328 || '');
              src = String(src || '').trim();
              if (src.startsWith('//')) src = `https:${src}`;
              if (nm && /^https?:\/\//i.test(src)) next[nm] = src;
            });
            setCalcPhotoByNmId(next);
          } catch {}
        }

        let supplyOrdersRaw = await fetchOrdersForSupply(supplyId, { enrich: true, fresh: true });
        if (!supplyOrdersRaw.length) {
          supplyOrdersRaw = await fetchOrdersForSupply(supplyId, { enrich: false, fresh: true });
        }

        const groups = new Map<string, { key: string; nmId?: number; article: string; title: string; qty: number; sizes: Set<string> }>();
        for (const o of supplyOrdersRaw || []) {
          const nmId = Number(o?.nmId || 0) || undefined;
          const article = String(o?.article || o?.vendorCode || '-');
          const title = String(o?.title || '-');
          const key = nmId ? String(nmId) : `${article}__${title}`;
          const size = String(o?.size || o?.techSize || '').trim();

          if (!groups.has(key)) {
            groups.set(key, { key, nmId, article, title, qty: 0, sizes: new Set<string>() });
          }
          const g = groups.get(key)!;
          g.qty += 1;
          if (size) g.sizes.add(size);
        }

        const rows = Array.from(groups.values())
          .map((g) => ({ key: g.key, nmId: g.nmId, article: g.article, title: g.title, qty: g.qty, sizes: Array.from(g.sizes).sort(compareSizeStrings) }))
          .sort((a, b) => b.qty - a.qty || String(a.title).localeCompare(String(b.title), 'ru'));

        setCalcRows(rows);
        const missingRows = rows.filter((r) => getCalcStoredCost(r, calcCostOverrides) <= 0);
        if (missingRows.length > 0) {
          const next: Record<string, string> = {};
          rows.forEach((r) => {
            next[r.key] = String(getCalcStoredCost(r, calcCostOverrides) || '');
          });
          setCalcCostEditorValues(next);
          setCalcCostEditorSearch('');
          setCalcMissingCostOnly(true);
          setCalcCostEditorOpen(true);
        }
      } catch (e: any) {
        setCalcRows([]);
        setError(e?.message || 'Ошибка загрузки FBS расчёта');
      } finally {
        setCalcLoading(false);
      }
  };

  const calcMissingCostKeys = new Set((calcRows || []).filter((r) => getCalcStoredCost(r) <= 0).map((r) => r.key));
  const calcCostEditorItems = (calcRows.length ? calcRows : supplyOrderSummaryRows.map((row) => ({ key: String(row.nmId || row.article || row.title || ''), nmId: row.nmId, article: row.article, title: row.title, qty: row.qty, sizes: row.sizes.map((s) => s.size) }))).filter((r) => {
    if (calcRows.length && calcMissingCostOnly && !calcMissingCostKeys.has(r.key)) return false;
    const q = calcCostEditorSearch.trim().toLowerCase();
    if (!q) return true;
    return String(r.title || '').toLowerCase().includes(q) || String(r.nmId || '').includes(q) || String(r.article || '').toLowerCase().includes(q);
  });

  const openCalcCostEditor = (missingOnly = false) => {
    const next: Record<string, string> = {};
    (calcRows || []).forEach((r) => {
      next[r.key] = String(getCalcStoredCost(r) || '');
    });
    setCalcCostEditorValues(next);
    setCalcCostEditorSearch('');
    setCalcMissingCostOnly(missingOnly);
    setCalcCostEditorOpen(true);
  };

  const saveCalcSnapshot = async () => {
    if (!selectedSupplierId || !calcSupplyId || !calcRows.length) return;
    const supplyName = supplies.find((s) => s.id === calcSupplyId)?.name || calcSupplyId;
    const totalCost = calcRows.reduce((s, r) => s + r.qty * Number(getCalcStoredCost(r) || 0), 0);

    const buildFingerprint = (rows: any[], overrides: Record<string, number>, supplyId: string) => {
      const compactRows = (rows || [])
        .map((r: any) => ({ key: String(r?.key || ''), qty: Number(r?.qty || 0), cost: Number(overrides?.[String(r?.key || '')] || 0) }))
        .sort((a, b) => a.key.localeCompare(b.key));
      return JSON.stringify({ supplyId, compactRows });
    };

    const currentFingerprint = buildFingerprint(calcRows, calcCostOverrides, calcSupplyId);
    const isDuplicate = (calcHistory || []).some((h: any) => {
      const fp = buildFingerprint(h?.rows || [], h?.costOverrides || {}, String(h?.supplyId || ''));
      return fp === currentFingerprint;
    });

    if (isDuplicate) {
      setSuccessMsg('Такой расчёт уже есть в истории (дубль не сохранён)');
      setTimeout(() => setSuccessMsg(null), 2500);
      return;
    }

    const item = {
      id: getSafeId(),
      supplyId: calcSupplyId,
      supplyName,
      createdAt: new Date().toISOString(),
      totalCost,
      rows: calcRows,
      costOverrides: calcCostOverrides,
    };
    const next = [item, ...(calcHistory || [])].slice(0, 200);
    setCalcHistory(next);
    try {
      const key = `fbs_calc_history_v1:${selectedSupplierId}`;
      await supabase.from('app_settings').upsert([{ key, value: JSON.stringify(next) }], { onConflict: 'key' });
      setSuccessMsg('Расчёт сохранён в историю');
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch {}
  };

  const openCalcSnapshot = (snap: any) => {
    setCalcSupplyId(String(snap?.supplyId || ''));
    setCalcRows(Array.isArray(snap?.rows) ? snap.rows : []);
    setCalcCostOverrides(snap?.costOverrides && typeof snap.costOverrides === 'object' ? snap.costOverrides : {});
    setCalcHistoryOpen(false);
  };

  const deleteCalcSnapshot = async (id: string) => {
    const next = (calcHistory || []).filter((x) => String(x?.id || '') !== String(id));
    setCalcHistory(next);
    try {
      const key = `fbs_calc_history_v1:${selectedSupplierId}`;
      await supabase.from('app_settings').upsert([{ key, value: JSON.stringify(next) }], { onConflict: 'key' });
      setSuccessMsg('Расчёт удалён из истории');
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch {}
  };

  const saveCalcCostEditor = async () => {
    const next = { ...(calcCostOverrides || {}) };
    Object.entries(calcCostEditorValues || {}).forEach(([k, v]) => {
      const n = Number(String(v || '').replace(',', '.'));
      const row = [...(calcRows || []), ...supplyOrderSummaryRows.map((r) => ({ key: String(r.nmId || r.article || r.title || ''), nmId: r.nmId, article: r.article, title: r.title, qty: r.qty }))].find((r: any) => String(r.key) === String(k));
      const safeValue = Number.isFinite(n) && n >= 0 ? n : 0;
      if (row) {
        getCalcCostKeyCandidates(row).forEach((candidate) => {
          next[candidate] = safeValue;
        });
      } else {
        next[k] = safeValue;
      }
    });

    setCalcCostOverrides(next);

    // Recalculate totals for all saved reports with updated prices
    const historyRecalced = (calcHistory || []).map((h: any) => {
      const totalCost = (h?.rows || []).reduce((sum: number, r: any) => {
        const cost = Number(getCalcStoredCost(r, next) || getCalcStoredCost(r, h?.costOverrides || {}) || 0);
        return sum + Number(r?.qty || 0) * cost;
      }, 0);
      return { ...h, totalCost, costOverrides: { ...(h?.costOverrides || {}), ...next } };
    });
    setCalcHistory(historyRecalced);

    try {
      if (selectedSupplierId) {
        const keyCosts = `fbs_calc_cost_overrides_v1:${selectedSupplierId}`;
        const keyHistory = `fbs_calc_history_v1:${selectedSupplierId}`;
        await supabase.from('app_settings').upsert([{ key: keyCosts, value: JSON.stringify(next) }], { onConflict: 'key' });
        await supabase.from('app_settings').upsert([{ key: keyHistory, value: JSON.stringify(historyRecalced) }], { onConflict: 'key' });
      }
      setSuccessMsg('Себестоимость обновлена, все отчеты пересчитаны');
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch {}

    setCalcCostEditorOpen(false);
  };

  const calcHistorySummaryAll = (calcHistory || []).reduce((s, h) => s + Number(h?.totalCost || 0), 0);

  const getCalcReportDateTs = (h: any) => {
    const name = String(h?.supplyName || '');
    const m = name.match(/(\d{2})\.(\d{2})\.(\d{4})/);
    if (m) {
      const dd = Number(m[1]);
      const mm = Number(m[2]);
      const yyyy = Number(m[3]);
      const ts = new Date(yyyy, mm - 1, dd, 12, 0, 0, 0).getTime();
      if (Number.isFinite(ts)) return ts;
    }
    const fallback = new Date(h?.createdAt || '').getTime();
    return Number.isFinite(fallback) ? fallback : NaN;
  };

  const calcHistoryFiltered = (calcHistory || []).filter((h) => {
    const t = getCalcReportDateTs(h);
    const hasPeriod = Boolean(calcHistoryPeriodStart || calcHistoryPeriodEnd);

    // If period filter is set and date can't be resolved, hide it
    if (hasPeriod && !Number.isFinite(t)) return false;

    if (calcHistoryPeriodStart) {
      const startTs = new Date(`${calcHistoryPeriodStart}T00:00:00`).getTime();
      if (Number.isFinite(startTs) && t < startTs) return false;
    }
    if (calcHistoryPeriodEnd) {
      const endTs = new Date(`${calcHistoryPeriodEnd}T23:59:59`).getTime();
      if (Number.isFinite(endTs) && t > endTs) return false;
    }
    return true;
  }).sort((a, b) => getCalcReportDateTs(b) - getCalcReportDateTs(a));
  const calcHistorySummaryPeriod = calcHistoryFiltered.reduce((s, h) => s + Number(h?.totalCost || 0), 0);

  const fbsSourceNames = Array.from(new Set([
    ...(fbsOrdersRows || []).map((r) => String((r as any).sourceName || r.name || '').trim()),
    ...(fbsOrdersGroups || []).map((g) => String(g.name || '').trim()),
    ...(fbsBlockGroups || []).flatMap((g) => (g.items || []).map((x) => String(x || '').trim())),
  ].filter(Boolean))).sort((a, b) => a.localeCompare(b, 'ru'));
  const fbsUsedBlockItems = new Set((fbsBlockGroups || []).flatMap((g) => (g.items || []).map((x) => normalizeBlockName(String(x || '')))));
  const fbsAvailableSourceNames = fbsSourceNames.filter((nm) => !fbsUsedBlockItems.has(normalizeBlockName(String(nm || ''))) || fbsNewBlockItems.includes(nm) || fbsEditingBlockItems.includes(nm));

  const generateSupplyOrderDocument = async (customFileName?: string) => {
      const itemsToOrder = buildSupplyOrderItems();

      if (itemsToOrder.length === 0) {
          setError("Выберите товары для заказа");
          return;
      }

      if (orderMissingCostItems.length > 0) {
          setPendingOrderExport({ type: 'pdf', fileName: customFileName });
          setOrderMissingCostsModalOpen(true);
          return;
      }

      try {
          const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
          const supplierName = suppliers.find(s => s.id === selectedSupplierIdSupplyOrder)?.name || 'Поставщик';
          const totalQty = itemsToOrder.reduce((sum, item) => sum + item.sizes.reduce((s, i) => s + i.quantity, 0), 0);
          const totalCost = itemsToOrder.reduce((sum, item) => sum + item.sizes.reduce((s, i) => s + (Number(i.quantity || 0) * Number(getOrderStoredCost({
            key: `${item.product?.nmID || ''}_${i.size}`,
            nmId: item.product?.nmID,
            article: item.product?.vendorCode || '',
            title: item.product?.title || '',
          }) || 0)), 0), 0);

          const imageDataByNmId = new Map<number, string>();
          const imageUrls = itemsToOrder
            .map((item) => item.product?.photos?.[0]?.big || item.product?.photos?.[0]?.c516x688 || item.product?.photos?.[0]?.c246x328 || '')
            .filter(Boolean);
          const loadedByUrl = await loadImageDataUrls(imageUrls, 12);
          itemsToOrder.forEach((item) => {
            const imgUrl = item.product?.photos?.[0]?.big || item.product?.photos?.[0]?.c516x688 || item.product?.photos?.[0]?.c246x328 || '';
            const img = imgUrl ? loadedByUrl.get(imgUrl) : undefined;
            if (img) imageDataByNmId.set(item.product.nmID, img);
          });

          // Cyrillic font for correct Russian text rendering
          try {
            if (!cachedPdfFontRef.current) {
              const fontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf';
              const response = await withTimeout(fetch(fontUrl), 7000, 'Таймаут загрузки шрифта');
              const blob = await response.blob();
              const reader = new FileReader();
              reader.readAsDataURL(blob);
              await new Promise((resolve) => {
                reader.onloadend = () => resolve(reader.result);
              });
              cachedPdfFontRef.current = (reader.result as string).split(',')[1];
            }
            if (cachedPdfFontRef.current) {
              doc.addFileToVFS('Roboto-Regular.ttf', cachedPdfFontRef.current);
              doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
              doc.setFont('Roboto');
            }
          } catch (e) {
            console.error('Error loading font for supply order PDF', e);
          }

          doc.setFontSize(14);
          doc.text(`Заказ поставщику: ${supplierName}`, 10, 12);
          doc.setFontSize(10);
          doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, 10, 18);
          doc.text(`Итого товаров: ${totalQty} шт.`, 10, 24);
          doc.text(`Общая сумма: ${totalCost.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽`, 10, 30);

          const body = itemsToOrder.map((item) => {
            const color = String(item.product?.characteristics?.find((c: any) => c?.name === 'Цвет')?.value || '-');
            return [
              String(item.product?.nmID || ''),
              String(item.product?.nmID || '-'),
              String(item.product?.title || '-'),
              color,
              item.sizes.map(s => `${s.size}: ${s.quantity} шт.`).join('\n'),
              String(item.sizes.reduce((sum, s) => sum + s.quantity, 0)),
            ];
          });

          autoTable(doc, {
            startY: 34,
            pageBreak: 'auto',
            rowPageBreak: 'avoid',
            head: [['Фото', 'Артикул', 'Наименование', 'Цвет', 'Размеры', 'Итого']],
            body,
            styles: { font: 'Roboto', fontStyle: 'normal', fontSize: 9, cellPadding: 2, overflow: 'linebreak' },
            headStyles: { font: 'Roboto', fontStyle: 'normal', fillColor: [241, 245, 249], textColor: 30 },
            margin: { left: 8, right: 8 },
            columnStyles: {
              0: { cellWidth: 40, halign: 'center' },
              1: { cellWidth: 28 },
              2: { cellWidth: 92 },
              3: { cellWidth: 28 },
              4: { cellWidth: 42 },
              5: { cellWidth: 12, halign: 'center' },
            },
            didParseCell: (data) => {
              if (data.section === 'body' && data.column.index === 0) {
                data.cell.text = [''];
                data.cell.styles.minCellHeight = 52;
              }
            },
            didDrawCell: (data) => {
              if (data.section === 'body' && data.column.index === 0) {
                const nmId = Number((data.row.raw as any)?.[0] || 0);
                const img = imageDataByNmId.get(nmId);
                if (img) {
                  const pad = 1;
                  const boxW = Math.max(4, data.cell.width - pad * 2);
                  const boxH = Math.max(4, data.cell.height - pad * 2);
                  try {
                    const props = doc.getImageProperties(img as any);
                    const iw = Number(props?.width || boxW);
                    const ih = Number(props?.height || boxH);
                    const scale = Math.min(boxW / iw, boxH / ih);
                    const w = Math.max(4, Math.round(iw * scale));
                    const h = Math.max(4, Math.round(ih * scale));
                    const x = data.cell.x + pad + (boxW - w) / 2;
                    const y = data.cell.y + pad + (boxH - h) / 2;
                    doc.addImage(img, 'JPEG', x, y, w, h, undefined, 'FAST');
                  } catch {
                    try { doc.addImage(img, 'PNG', data.cell.x + pad, data.cell.y + pad, boxW, boxH); } catch {}
                  }
                }
              }
            },
          });

          const normalizedName = String(customFileName || '').trim().replace(/\.pdf$/i, '');
          const fileName = `${normalizedName || `supply_order_${new Date().toISOString().split('T')[0]}_${Date.now()}`}.pdf`;
          const dataUrl = doc.output('dataurlstring');
          const generated = { fileName, dataUrl, totalQty, totalCost };
          setGeneratedOrderPdf(generated);
          doc.save(fileName);

          try {
            const supplierName = suppliers.find(s => s.id === selectedSupplierId)?.name || 'Поставщик';
            const historyItem = {
              id: getSafeId(),
              supplierId: String(selectedSupplierIdSupplyOrder || ''),
              supplierName,
              createdAt: new Date().toISOString(),
              fileName,
              dataUrl,
              totalQty,
              totalCost,
            };
            const nextHistory = [historyItem, ...(orderHistory || [])].slice(0, 100);
            setOrderHistory(nextHistory);
            if (selectedSupplierIdSupplyOrder) {
              const key = `supplier_order_history_v1:${selectedSupplierIdSupplyOrder}`;
              await supabase.from('app_settings').upsert([{ key, value: JSON.stringify(nextHistory) }], { onConflict: 'key' });
            }
          } catch {}
      } catch (e: any) {
          setError(e.message);
      }
  };

  const generateSupplyOrderExcel = async () => {
      const itemsToOrder = buildSupplyOrderItems();
      if (itemsToOrder.length === 0) {
          setError('Выберите товары для заказа');
          return;
      }
      if (orderMissingCostItems.length > 0) {
          setPendingOrderExport({ type: 'excel' });
          setOrderMissingCostsModalOpen(true);
          return;
      }

      try {
          const supplierName = suppliers.find(s => s.id === selectedSupplierIdSupplyOrder)?.name || 'Поставщик';
          const wb = new ExcelJS.Workbook();
          const ws = wb.addWorksheet('Заказ поставщику');

          ws.addRow(['Поставщик', supplierName]);
          ws.addRow(['Дата', new Date().toLocaleDateString('ru-RU')]);
          ws.addRow([]);
          ws.addRow(['Артикул', 'Код номенклатуры', 'Наименование', 'Цвет', 'Размер', 'Количество']);

          itemsToOrder.forEach((item) => {
            item.sizes.forEach((s) => {
              ws.addRow([
                String(item.product?.vendorCode || '-'),
                String(item.product?.nmID || ''),
                String(item.product?.title || '-'),
                String(item.product?.characteristics?.find((c: any) => c?.name === 'Цвет')?.value || '-'),
                String(s.size || ''),
                Number(s.quantity || 0),
              ]);
            });
          });

          ws.columns = [
            { key: 'vendorCode', width: 20 },
            { key: 'nmID', width: 16 },
            { key: 'title', width: 46 },
            { key: 'color', width: 18 },
            { key: 'size', width: 12 },
            { key: 'qty', width: 12 },
          ];

          const headerRow = ws.getRow(4);
          headerRow.font = { bold: true } as any;

          const totalQty = itemsToOrder.reduce((sum, item) => sum + item.sizes.reduce((s, i) => s + i.quantity, 0), 0);
          ws.addRow([]);
          ws.addRow(['Итого, шт.', totalQty]);

          const buffer = await wb.xlsx.writeBuffer();
          const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Заказ_поставщику_${supplierName}_${new Date().toISOString().slice(0,10)}.xlsx`;
          a.click();
          URL.revokeObjectURL(url);
      } catch (e: any) {
          setError(`Ошибка формирования Excel: ${e?.message || 'неизвестно'}`);
      }
  };

  // --- PDF Generation ---

  const generatePickingList = async () => {
    if (!activeSupplyId) return;
    setLoading(true);
    try {
      // 1. Fetch orders for this supply via robust resolver with fallback chain
      let supplyOrdersRaw = await withTimeout(fetchOrdersForSupply(activeSupplyId, { enrich: true, fresh: true }), 30000, 'Таймаут загрузки заказов (1)');
      if (!supplyOrdersRaw || supplyOrdersRaw.length === 0) {
        supplyOrdersRaw = await withTimeout(fetchOrdersForSupply(activeSupplyId, { enrich: false, fresh: true }), 30000, 'Таймаут загрузки заказов (2)');
      }
      if (!supplyOrdersRaw || supplyOrdersRaw.length === 0) {
        throw new Error('По выбранной поставке не найдены заказы для листа подбора');
      }

      const targetSupplyId = String(activeSupplyId || '').trim().toLowerCase();

      const strictFiltered = supplyOrdersRaw.filter((o: any) => {
        const candidates = [o?.supplyId, o?.supplyID, o?.supply_id, o?.supply?.id]
          .map((v) => String(v || '').trim().toLowerCase())
          .filter(Boolean);
        return candidates.length === 0 ? true : candidates.some((c) => c === targetSupplyId);
      });

      const relaxedFiltered = strictFiltered.length > 0 ? strictFiltered : supplyOrdersRaw.filter((o: any) => {
        const candidates = [o?.supplyId, o?.supplyID, o?.supply_id, o?.supply?.id]
          .map((v) => String(v || '').trim().toLowerCase())
          .filter(Boolean);
        return candidates.length === 0 ? true : candidates.some((c) => c.includes(targetSupplyId) || targetSupplyId.includes(c));
      });

      const supplyOrders = relaxedFiltered
        .map((o: any) => ({
          ...o,
          title: o.title || o.subject || 'Без названия',
          brand: o.brand || o.brandName || '',
          size: o.size || o.techSize || o.wbSize || '-',
          color: o.color || '-',
          article: o.article || o.vendorCode || '-',
        }));

      const orderIds = Array.from(new Set(
        supplyOrders
          .map((o: any) => Number(o.id ?? o.orderId ?? o.order_id))
          .filter((id: number) => Number.isFinite(id) && id > 0)
      ));

      // Prefer WB stickers API labels for accuracy (order payload sticker can be stale/mismatched)
      let fetchedStickerLabels = new Map<number, string>();
      try {
        fetchedStickerLabels = await withTimeout(fetchStickerLabels(orderIds), 90000, 'Таймаут загрузки стикеров');
      } catch {
        fetchedStickerLabels = new Map<number, string>();
      }
      const localStickerById = new Map<number, string>();
      for (const o of supplyOrders) {
        const oid = Number(o.id ?? o.orderId ?? o.order_id);
        const digits = extractStickerLabel(o);
        if (Number.isFinite(oid) && digits) localStickerById.set(oid, digits);
      }
      const stickerLabels = new Map<number, string>([...localStickerById.entries(), ...fetchedStickerLabels.entries()]);
      const fbsSupplyScans = await loadFbsSupplyScanMap(activeSupplyId, selectedSupplierId);

      // 2. Sort
      const sortedSupplyOrders = sortOrdersForPicking(supplyOrders);

      const doc = new jsPDF();
      
      // Load Cyrillic font once and reuse for faster repeated exports
      try {
          if (!cachedPdfFontRef.current) {
            const fontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf';
            const response = await withTimeout(fetch(fontUrl), 7000, 'Таймаут загрузки шрифта');
            const blob = await response.blob();
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            await new Promise((resolve) => {
                reader.onloadend = () => resolve(reader.result);
            });
            cachedPdfFontRef.current = (reader.result as string).split(',')[1];
          }

          if (cachedPdfFontRef.current) {
            doc.addFileToVFS('Roboto-Regular.ttf', cachedPdfFontRef.current);
            doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
            doc.setFont('Roboto');
          }
      } catch (e) {
          console.error('Error loading font', e);
      }
      
      const supplyName = supplies.find(s => s.id === activeSupplyId)?.name || activeSupplyId;

      const productPhotoByNmId = new Map<number, string>();
      (products || []).forEach((p: any) => {
        const pid = Number(p?.nmID);
        const pPhoto = p?.photos?.[0]?.big || p?.photos?.[0]?.tm || p?.photos?.[0]?.small || p?.photoUrl || '';
        if (Number.isFinite(pid) && pPhoto) productPhotoByNmId.set(pid, String(pPhoto));
      });

      const uniqueImageUrls = Array.from(new Set(
        sortedSupplyOrders
          .flatMap((o: any) => getImageCandidates(o.photoUrl, o.nmId, [productPhotoByNmId.get(Number(o.nmId)) || '']))
          .filter((u: string) => Boolean(u))
      ));

      // Optimized loader with cache + timeout + downscale/compression
      const imageDataByUrl = await loadImageDataUrls(uniqueImageUrls, 6);

      const tableData = sortedSupplyOrders.map((o: any) => {
          const orderIdNum = Number(o.id ?? o.orderId ?? o.order_id);
          const fromApi = Number.isFinite(orderIdNum) ? stickerLabels.get(orderIdNum) : '';
          const fromOrder = extractStickerLabel(o);
          const stickerRaw = normalizeStickerDigits(fromApi || fromOrder || '');
          const stickerText = formatStickerDigits(stickerRaw || '');
          const scanStorageKey = normalizeFbsStorageKey({ stickerDigits: stickerRaw, orderId: String(o.id ?? o.orderId ?? o.order_id ?? '') });
          const scannedHonestSign = stickerRaw ? String(fbsSupplyScans?.[scanStorageKey]?.honestSignCode || '') : '';
          const stickerOrScanText = scannedHonestSign || stickerText;
          const imgCandidates = getImageCandidates(o.photoUrl, o.nmId, [productPhotoByNmId.get(Number(o.nmId)) || '']);
          const imgData = imgCandidates.map((u) => imageDataByUrl.get(u) || '').find(Boolean) || '';

          const cleanTitle = String(o.title || 'Без названия');
          return [
              o.id ?? o.orderId ?? o.order_id ?? '-',
              imgData,
              cleanTitle,
              o.size,
              o.color,
              o.article,
              stickerOrScanText
          ];
      });

      const rowsPerPage = 10;
      const totalPages = Math.max(1, Math.ceil(tableData.length / rowsPerPage));

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          doc.addPage();
        }

        const start = page * rowsPerPage;
        const end = start + rowsPerPage;
        const pageRows = tableData.slice(start, end);

        doc.setFontSize(16);
        doc.text(`Лист подбора ${supplyName}`, 14, 18);
        doc.setFontSize(10);
        doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, 14, 24);
        doc.text(`Страница ${page + 1} / ${totalPages}`, 160, 24);

        (autoTable as any)(doc, {
          startY: 30,
          head: [['№ задания', 'Фото', 'Наименование', 'Размер', 'Цвет', 'Артикул', 'Стикер / ЧЗ']],
          body: pageRows,
          styles: { fontSize: 8, cellPadding: 2, valign: 'middle', font: 'Roboto' },
          headStyles: { font: 'Roboto', fontStyle: 'normal' },
          bodyStyles: { font: 'Roboto', fontStyle: 'normal' },
          rowPageBreak: 'avoid',
          columnStyles: {
            0: { cellWidth: 18 },
            1: { minCellWidth: 20, minCellHeight: 24 },
            2: { minCellWidth: 64 },
            3: { cellWidth: 14, halign: 'center' },
            4: { cellWidth: 18, halign: 'center' },
            5: { cellWidth: 20 },
            6: { cellWidth: 34 }
          },
          didParseCell: (data: any) => {
            if (data.column.index === 1 && data.section === 'body') {
              data.cell.text = [];
            }

            // Make key searchable fields explicitly plain text with core PDF font
            if (data.section === 'body' && [0, 6].includes(data.column.index)) {
              const raw = Array.isArray(data.cell.text) ? data.cell.text.join(' ') : String(data.cell.text || '');
              data.cell.text = [String(raw).replace(/\s+/g, '').trim()];
              data.cell.styles.font = 'helvetica';
            }
          },
          didDrawCell: (data: any) => {
            if (data.column.index === 1 && data.cell.section === 'body') {
              const img = data.cell.raw;
              if (img) {
                try {
                  const format = String(img).startsWith('data:image/png') ? 'PNG' : 'JPEG';
                  doc.addImage(img, format as 'PNG' | 'JPEG', data.cell.x + 2, data.cell.y + 2, 15, 20);
                } catch {
                  // ignore per-image draw failure
                }
              }
            }
          },
        });
      }
      
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      doc.save(`picking_list_${supplyName}_${sortedSupplyOrders.length}orders_${ts}.pdf`);
      setSuccessMsg(`Лист сформирован: ${sortedSupplyOrders.length} заказов`);
      setTimeout(() => setSuccessMsg(null), 2500);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateGroupedSupplierPickingList = async () => {
    if (!activeSupplyId) return;
    setLoading(true);
    try {
      // For grouped picking we need the full supply content, not a possibly partial direct payload.
      let supplyOrdersRaw = await withTimeout(fetchOrdersForSupply(activeSupplyId, { enrich: true, fresh: true }), 30000, 'Таймаут загрузки заказов (групп.) 1');
      if (!supplyOrdersRaw || supplyOrdersRaw.length === 0) {
        supplyOrdersRaw = await withTimeout(fetchOrdersForSupply(activeSupplyId, { enrich: false, fresh: true }), 30000, 'Таймаут загрузки заказов (групп.) 2');
      }
      if (!supplyOrdersRaw || supplyOrdersRaw.length === 0) {
        throw new Error('По выбранной поставке не найдены заказы');
      }

      const supplyOrders = supplyOrdersRaw.map((o: any) => ({
        ...o,
        title: o.title || o.subject || 'Без названия',
        size: o.size || o.techSize || o.wbSize || '-',
        color: String(o.color || '-').replace(/[\r\n]+/g, ' / ').replace(/\s{2,}/g, ' ').trim(),
        article: o.article || o.vendorCode || '-',
      }));

      type Group = {
        title: string;
        article: string;
        color: string;
        nmId?: number;
        photoUrl: string;
        sizes: Map<string, number>;
        total: number;
      };

      const groups = new Map<string, Group>();
      for (const o of supplyOrders) {
        const key = `${o.article}|${o.color}|${o.title}`;
        if (!groups.has(key)) {
          groups.set(key, {
            title: o.title,
            article: o.article,
            color: o.color,
            nmId: o.nmId,
            photoUrl: o.photoUrl || '',
            sizes: new Map<string, number>(),
            total: 0,
          });
        }
        const g = groups.get(key)!;
        const size = String(o.size || '-');
        g.sizes.set(size, (g.sizes.get(size) || 0) + 1);
        g.total += 1;
      }

      const groupedList = Array.from(groups.values()).sort((a, b) => {
        const titleDiff = String(a.title || '').localeCompare(String(b.title || ''), 'ru');
        if (titleDiff !== 0) return titleDiff;
        return String(a.article || '').localeCompare(String(b.article || ''), 'ru');
      });

      const imageDataByKey = new Map<string, string>();
      const productPhotoByNmId = new Map<number, string>();
      (products || []).forEach((p: any) => {
        const pid = Number(p?.nmID);
        const pPhoto = p?.photos?.[0]?.big || p?.photos?.[0]?.tm || p?.photos?.[0]?.small || p?.photoUrl || '';
        if (Number.isFinite(pid) && pPhoto) productPhotoByNmId.set(pid, String(pPhoto));
      });

      const allCandidateUrls = groupedList.flatMap((g) => getImageCandidates(g.photoUrl, g.nmId, [productPhotoByNmId.get(Number(g.nmId)) || '']));
      const loadedByUrl = await loadImageDataUrls(allCandidateUrls, 8);

      groupedList.forEach((g) => {
        const cacheKey = `${g.article}|${g.color}|${g.title}`;
        if (groupedImageCacheRef.current.has(cacheKey)) {
          imageDataByKey.set(cacheKey, groupedImageCacheRef.current.get(cacheKey)!);
          return;
        }

        const candidates = getImageCandidates(g.photoUrl, g.nmId, [productPhotoByNmId.get(Number(g.nmId)) || '']);
        for (const candidate of candidates) {
          const img = loadedByUrl.get(candidate);
          if (img) {
            groupedImageCacheRef.current.set(cacheKey, img);
            imageDataByKey.set(cacheKey, img);
            break;
          }
        }
      });

      const rows = groupedList.map((g) => {
          const sizesText = Array.from(g.sizes.entries())
            .sort((a, b) => compareSizeStrings(a[0], b[0]))
            .map(([size, qty]) => `${size}: ${qty}`)
            .join('\n');

          const cacheKey = `${g.article}|${g.color}|${g.title}`;
          return [imageDataByKey.get(cacheKey) || '', g.article, g.title, g.color, sizesText, g.total];
      });

      const doc = new jsPDF();

      // Load Cyrillic font to avoid broken text in grouped picking list
      try {
        if (!cachedPdfFontRef.current) {
          const fontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf';
          const response = await withTimeout(fetch(fontUrl), 7000, 'Таймаут загрузки шрифта');
          const blob = await response.blob();
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          await new Promise((resolve) => {
            reader.onloadend = () => resolve(reader.result);
          });
          cachedPdfFontRef.current = (reader.result as string).split(',')[1];
        }

        if (cachedPdfFontRef.current) {
          doc.addFileToVFS('Roboto-Regular.ttf', cachedPdfFontRef.current);
          doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
          doc.setFont('Roboto');
        }
      } catch (e) {
        console.error('Error loading font', e);
      }

      const supplyName = supplies.find(s => s.id === activeSupplyId)?.name || activeSupplyId;
      doc.setFontSize(16);
      doc.text(`Лист подбора (группировка по товару) ${supplyName}`, 14, 20);
      doc.setFontSize(11);
      doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, 14, 28);
      doc.text(`Групп: ${rows.length}`, 14, 34);

      (autoTable as any)(doc, {
        startY: 40,
        head: [['Фото', 'Артикул', 'Наименование', 'Цвет', 'Размеры (кол-во)', 'Итого']],
        body: rows,
        styles: { fontSize: 8, cellPadding: 2, valign: 'middle', font: 'Roboto' },
        headStyles: { font: 'Roboto', fontStyle: 'normal' },
        bodyStyles: { font: 'Roboto', fontStyle: 'normal' },
        rowPageBreak: 'avoid',
        columnStyles: {
          0: { minCellWidth: 20, minCellHeight: 24 },
          1: { cellWidth: 25 },
          2: { minCellWidth: 52 },
          3: { cellWidth: 30, overflow: 'hidden' },
          4: { minCellWidth: 55, overflow: 'linebreak' },
          5: { cellWidth: 15, halign: 'center' },
        },
        didParseCell: (data: any) => {
          if (data.column.index === 0 && data.section === 'body') {
            data.cell.text = [];
          }
        },
        didDrawCell: (data: any) => {
          if (data.column.index === 0 && data.cell.section === 'body') {
            const img = data.cell.raw;
            if (img) {
              try {
                const w = Math.max(10, data.cell.width - 4);
                const h = Math.max(12, data.cell.height - 4);
                const format = String(img).startsWith('data:image/png') ? 'PNG' : 'JPEG';
                doc.addImage(img, format as 'PNG' | 'JPEG', data.cell.x + 2, data.cell.y + 2, w, h);
              } catch {
                // ignore image draw errors
              }
            }
          }
        },
      });

      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      doc.save(`picking_grouped_${supplyName}_${rows.length}groups_${supplyOrders.length}orders_${ts}.pdf`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateSupplyBarcode = async () => {
    if (!activeSupplyId) return;
    
    try {
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: [100, 60]
        });

        const canvas = document.createElement('canvas');
        
        await bwipjs.toCanvas(canvas, {
            bcid: 'code128',
            text: activeSupplyId,
            scale: 3,
            height: 15,
            includetext: true,
            textxalign: 'center',
        });

        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 10, 10, 80, 40);
        doc.save(`supply_barcode_${activeSupplyId}.pdf`);

    } catch (err: any) {
        setError(err.message);
    }
  };

  const downloadFBSStickers = async () => {
    if (!activeSupplyId) return;
    setLoading(true);
    try {
      const supplyOrdersRaw = await withTimeout(fetchOrdersForSupply(activeSupplyId, { enrich: true, fresh: true }), 30000, 'Таймаут загрузки заказов для стикеров');
      const targetSupplyId = String(activeSupplyId || '').trim().toLowerCase();
      const supplyOrders = (supplyOrdersRaw || [])
        .filter((o: any) => {
          const candidates = [o?.supplyId, o?.supplyID, o?.supply_id, o?.supply?.id]
            .map((v) => String(v || '').trim().toLowerCase())
            .filter(Boolean);
          return candidates.length === 0 ? true : candidates.some((c) => c === targetSupplyId);
        })
        .map((o: any) => ({
          ...o,
          title: o.title || o.subject || 'Без названия',
          brand: o.brand || o.brandName || '',
          size: o.size || o.techSize || o.wbSize || '-',
          color: o.color || '-',
          article: o.article || o.vendorCode || '-',
        }));
      const sortedSupplyOrders = sortOrdersForPicking(supplyOrders);

      const extractSafeOrderId = (o: any): number | null => {
        const raw = o?.orderId ?? o?.order_id ?? o?.id;
        const str = String(raw ?? '').trim();
        if (!/^\d+$/.test(str)) return null;
        const id = Number(str);
        if (!Number.isFinite(id) || id <= 0 || !Number.isSafeInteger(id)) return null;
        return id;
      };

      const orderIds = Array.from(new Set(
        sortedSupplyOrders
          .map((o: any) => extractSafeOrderId(o))
          .filter((id: number | null): id is number => Number.isFinite(id as number) && (id as number) > 0)
      ));

      if (orderIds.length === 0) {
        throw new Error('В поставке не найдены ID заказов для печати стикеров');
      }

      const token = getSupplierToken();
      if (!token) throw new Error('Токен API не найден');

      // Chunk requests to avoid 400 error for large lists
      const chunkSize = 100;
      const chunks = [];
      for (let i = 0; i < orderIds.length; i += chunkSize) {
          chunks.push(orderIds.slice(i, i + chunkSize));
      }

      const allStickers: any[] = [];

      const fetchStickerChunk = async (chunk: number[]) => {
        // Try PNG first (faster, no SVG->canvas conversion), fallback to SVG
        for (const type of ['png', 'svg']) {
          const res = await withTimeout(fetch(`https://marketplace-api.wildberries.ru/api/v3/orders/stickers?type=${type}&width=58&height=40`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token,
            },
            body: JSON.stringify({ orders: chunk }),
          }), 45000, `Таймаут WB stickers (${type})`);

          if (!res.ok) {
            // try next format; don't break the whole export on a single chunk error
            continue;
          }

          const data = await res.json();
          if (data.stickers && Array.isArray(data.stickers)) {
            return { type, stickers: data.stickers };
          }
        }

        return { type: 'svg', stickers: [] };
      };

      const settled = await Promise.allSettled(chunks.map(fetchStickerChunk));
      const results = settled
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map((r) => r.value);
      for (const result of results) {
        for (const sticker of result.stickers) {
          allStickers.push({ ...sticker, __type: result.type });
        }
      }

      const stickersByOrderId = new Map<number, any>();
      for (const st of allStickers) {
        const id = Number(st?.orderId ?? st?.id ?? st?.order_id);
        if (Number.isFinite(id) && !stickersByOrderId.has(id)) {
          stickersByOrderId.set(id, st);
        }
      }

      const orderedStickers = orderIds
        .map((id) => stickersByOrderId.get(id))
        .filter(Boolean);
      
      if (orderedStickers.length > 0) {
             setSuccessMsg(`Стикеры WB: получено ${orderedStickers.length} из ${orderIds.length}`);
             setTimeout(() => setSuccessMsg(null), 2500);
             const buildPdfForSlice = async (
               slice: any[],
               opts: { canvasWidth: number; canvasHeight: number; imageType: 'PNG' | 'JPEG'; jpegQuality?: number }
             ) => {
               const pdf = new jsPDF({
                 orientation: 'landscape',
                 unit: 'mm',
                 format: [58, 40],
                 compress: true
               });

               for (let i = 0; i < slice.length; i++) {
                 const sticker = slice[i];
                 if (i > 0) pdf.addPage([58, 40], 'landscape');

                 const rawBase64 = String(sticker.file || '');
                 const stickerType = String(sticker.__type || 'svg').toLowerCase();

                 try {
                   if (rawBase64.length > 2_000_000) {
                     console.warn('sticker payload too large, skipped', rawBase64.length);
                     continue;
                   }

                   const renderToDataUrl = async (srcDataUrl: string) => {
                     const srcImg = new Image();
                     await new Promise((resolve, reject) => {
                       srcImg.onload = resolve;
                       srcImg.onerror = reject;
                       srcImg.src = srcDataUrl;
                     });

                     const normCanvas = document.createElement('canvas');
                     normCanvas.width = opts.canvasWidth;
                     normCanvas.height = opts.canvasHeight;
                     const nctx = normCanvas.getContext('2d');
                     if (!nctx) return null;

                     nctx.imageSmoothingEnabled = false;
                     nctx.fillStyle = 'white';
                     nctx.fillRect(0, 0, normCanvas.width, normCanvas.height);
                     nctx.drawImage(srcImg, 0, 0, normCanvas.width, normCanvas.height);

                     if (opts.imageType === 'JPEG') {
                       return normCanvas.toDataURL('image/jpeg', opts.jpegQuality ?? 0.82);
                     }
                     return normCanvas.toDataURL('image/png');
                   };

                   if (stickerType === 'png') {
                     const pngDataUrl = rawBase64.startsWith('data:') ? rawBase64 : `data:image/png;base64,${rawBase64}`;
                     const normalized = await renderToDataUrl(pngDataUrl);
                     if (normalized) {
                       pdf.addImage(normalized, opts.imageType, 0, 0, 58, 40);
                     }
                     continue;
                   }

                   // SVG fallback (guarded)
                   const svgStr = atob(rawBase64);
                   const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
                   const url = URL.createObjectURL(svgBlob);
                   const normalized = await renderToDataUrl(url);
                   URL.revokeObjectURL(url);

                   if (normalized) {
                     pdf.addImage(normalized, opts.imageType, 0, 0, 58, 40);
                   }
                 } catch (e) {
                   console.warn('sticker render failed, skipped', e);
                 }
               }

               return pdf;
             };

             // User requirement: always export all stickers into one single PDF file.
             const renderProfiles = [
               { canvasWidth: 580, canvasHeight: 400, imageType: 'PNG' as const },
               { canvasWidth: 360, canvasHeight: 248, imageType: 'PNG' as const },
               { canvasWidth: 290, canvasHeight: 200, imageType: 'JPEG' as const, jpegQuality: 0.84 }
             ];

             for (const profile of renderProfiles) {
               try {
                 const pdf = await buildPdfForSlice(orderedStickers, profile);
                 pdf.save(`stickers_fbs_${activeSupplyId}.pdf`);
                 return;
               } catch (e) {
                 console.warn('single stickers pdf failed on profile, trying lighter profile', profile, e);
               }
             }

             throw new Error('Не удалось сформировать единый PDF со стикерами');
      }
      
      throw new Error('Стикеры не найдены');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={embeddedMode ? 'font-sans text-slate-800' : 'p-3 md:p-6 bg-slate-50 min-h-screen font-sans text-slate-800'}>
      {!embeddedMode && (
        <>
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Truck className="w-8 h-8 text-purple-600" />
              Управление поставками FBS
            </h1>
            
            <div className="flex items-center gap-4">
                {/* Supplier Selector (only for Управление FBS) */}
                {(activeTab === 'fbs') && (
                  <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Поставщик:</span>
                      <select 
                          className="border rounded p-2 bg-white shadow-sm"
                          value={selectedSupplierId}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (activeTab === 'fbs') setSelectedSupplierIdFbs(value);
                            else if (activeTab === 'supply_order') setSelectedSupplierIdSupplyOrder(value);
                            else if (activeTab === 'fbs_calc') setSelectedSupplierIdCalc(value);
                          }}
                      >
                          {suppliers.map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                      </select>
                  </div>
                )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b overflow-x-auto whitespace-nowrap">
              <button 
                onClick={() => setActiveTab('fbs')}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === 'fbs' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                  <div className="flex items-center gap-2">
                      <LayoutGrid className="w-4 h-4" />
                      Управление FBS
                  </div>
              </button>
              <button 
                onClick={() => setActiveTab('fbs_calc')}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === 'fbs_calc' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                  <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4" />
                      ФБС расчет
                  </div>
              </button>
              <button 
                onClick={() => setActiveTab('fbs_orders')}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === 'fbs_orders' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                  <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4" />
                      Заказы ФБС
                  </div>
              </button>
              <button 
                onClick={() => setActiveTab('fbo_acceptance')}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === 'fbo_acceptance' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                  <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4" />
                      Приемка ФБО
                  </div>
              </button>
          </div>
        </>
      )}

      {/* Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <div className="flex-1 break-words">{error}</div>
          <button onClick={() => setError(null)} className="px-2">
            <span className="text-2xl">&times;</span>
          </button>
        </div>
      )}
      {successMsg && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 flex items-center gap-2">
          <CheckSquare className="w-5 h-5" />
          {successMsg}
          <button onClick={() => setSuccessMsg(null)} className="px-2">
            <span className="text-2xl">&times;</span>
          </button>
        </div>
      )}

      {/* Content: FBS Tab */}
      {activeTab === 'fbs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: Orders */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-[380px] 2xl:h-[calc(100vh-10rem)]">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h2 className="font-semibold flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-500" />
                        Новые заказы
                    </h2>
                    <button 
                        onClick={fetchNewOrders}
                        disabled={loading}
                        className="p-2 hover:bg-blue-100 rounded-full transition-colors text-blue-600"
                        title="Обновить заказы"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                
                <div className="p-2 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-2">
                        <button onClick={toggleAllOrders} className="text-sm text-slate-600 hover:text-slate-900">
                            {selectedOrderIds.size === orders.length && orders.length > 0 ? 'Снять все' : 'Выбрать все'}
                        </button>
                    </div>
                    <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Выбрано: {selectedOrderIds.size}
                    </span>
                </div>

                <div className="2xl:flex-1 2xl:overflow-auto p-0">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0">
                            <tr>
                                <th className="p-3 w-10">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedOrderIds.size === orders.length && orders.length > 0}
                                        onChange={toggleAllOrders}
                                        className="rounded border-slate-300"
                                    />
                                </th>
                                <th className="p-3">Заказ</th>
                                <th className="p-3">Товар</th>
                                <th className="p-3">Дата</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-500">
                                        Нет новых заказов
                                    </td>
                                </tr>
                            ) : (
                                orders.map(order => (
                                    <tr 
                                        key={order.id} 
                                        className={`border-b hover:bg-slate-50 cursor-pointer ${selectedOrderIds.has(order.id.toString()) ? 'bg-blue-50' : ''}`}
                                        onClick={() => toggleOrderSelection(order.id.toString())}
                                    >
                                        <td className="p-3">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedOrderIds.has(order.id.toString())}
                                                onChange={() => toggleOrderSelection(order.id.toString())}
                                                className="rounded border-slate-300"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </td>
                                        <td className="p-3">
                                            <div className="font-medium">{order.id}</div>
                                            <div className="text-xs text-slate-500">{order.supplyId ? `В поставке: ${order.supplyId}` : 'Не в поставке'}</div>
                                        </td>
                                        <td className="p-3">
                                            <div className="font-medium truncate max-w-[150px]" title={order.article}>{order.article}</div>
                                            <div className="text-xs text-slate-500">{order.convertedPrice / 100} в‚Ѕ</div>
                                        </td>
                                        <td className="p-3 text-xs text-slate-500">
                                            {formatDate(order.createdAt)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Column 2: Actions */}
            <div className="flex flex-col gap-4 justify-center">
                <button 
                    onClick={addOrdersToSupply}
                    disabled={!activeSupplyId || selectedOrderIds.size === 0 || loading}
                    className={`
                        p-4 rounded-xl shadow-sm border flex items-center justify-center gap-3 transition-all
                        ${!activeSupplyId || selectedOrderIds.size === 0 
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                            : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-md transform hover:-translate-y-1'}
                    `}
                >
                    <div className="bg-white/20 p-2 rounded-full">
                        <Plus className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                        <div className="font-bold">Добавить в поставку</div>
                        <div className="text-xs opacity-80">
                            {selectedOrderIds.size} заказов &rarr; {activeSupplyId ? activeSupplyId.slice(0, 8) + '...' : '...'}
                        </div>
                    </div>
                </button>
            </div>

            {/* Column 3: Supplies */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-[380px] 2xl:h-[calc(100vh-10rem)]">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h2 className="font-semibold flex items-center gap-2">
                        <Truck className="w-5 h-5 text-purple-500" />
                        Поставки
                    </h2>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setShowCreateSupplyModal(true)}
                            className="p-2 hover:bg-purple-100 rounded-full transition-colors text-purple-600"
                            title="Создать поставку"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={async () => {
                                setLoading(true);
                                setError(null);
                                try {
                                    let list: ProductCard[] = [];
                                    try {
                                      const fromSeller = await fetchSellerCards();
                                      list = fromSeller.list;
                                    } catch {
                                      list = await fetchProductsFallback();
                                    }

                                    setProducts(list);
                                    if (list.length > 0) {
                                      setSuccessMsg(`Обновлено ${list.length} товаров`);
                                    } else {
                                      setError('Не удалось обновить товары: WB API временно недоступно');
                                    }
                                } catch(e: any) { setError(e?.message || 'Failed to fetch'); }
                                finally { setLoading(false); }
                            }}
                            disabled={loading}
                            className="p-2 hover:bg-blue-100 rounded-full transition-colors text-blue-600"
                            title="Обновить базу товаров"
                        >
                            <Package className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button 
                            onClick={fetchSupplies}
                            disabled={loading}
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
                            title="Обновить"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-white px-4">
                    <input 
                        type="checkbox" 
                        id="showAll"
                        checked={showAllSupplies}
                        onChange={(e) => setShowAllSupplies(e.target.checked)}
                        className="rounded border-slate-300"
                    />
                    <label htmlFor="showAll" className="text-sm text-slate-600 cursor-pointer select-none">
                        Показывать закрытые
                    </label>
                </div>

                <div className="2xl:flex-1 2xl:overflow-auto p-0">
                    {supplies.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">Нет поставок</div>
                    ) : (
                        supplies.map(supply => (
                            <div 
                                key={supply.id}
                                onClick={() => setActiveSupplyId(supply.id)}
                                className={`
                                    p-4 border-b cursor-pointer transition-colors hover:bg-slate-50
                                    ${activeSupplyId === supply.id ? 'bg-purple-50 border-l-4 border-l-purple-500' : 'border-l-4 border-l-transparent'}
                                `}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div className="font-medium text-slate-900">{supply.name}</div>
                                    <div className={`text-xs px-2 py-0.5 rounded-full ${supply.closedAt ? 'bg-slate-200 text-slate-600' : 'bg-green-100 text-green-700'}`}>
                                        {supply.closedAt ? 'Закрыта' : 'Активна'}
                                    </div>
                                </div>
                                <div className="text-xs text-slate-500 font-mono mb-2">{supply.id}</div>
                                <div className="flex justify-between items-center text-xs text-slate-500">
                                    <span>{formatDate(supply.createdAt)}</span>
                                </div>
                                
                                {activeSupplyId === supply.id && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); generatePickingList(); }}
                                            className="flex items-center gap-1 bg-white border border-slate-300 px-2 py-1 rounded text-xs hover:bg-slate-50"
                                        >
                                            <FileText className="w-3 h-3" /> Лист
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); generateGroupedSupplierPickingList(); }}
                                            className="flex items-center gap-1 bg-white border border-slate-300 px-2 py-1 rounded text-xs hover:bg-slate-50"
                                        >
                                            <List className="w-3 h-3" /> Лист (групп.)
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); generateSupplyBarcode(); }}
                                            className="flex items-center gap-1 bg-white border border-slate-300 px-2 py-1 rounded text-xs hover:bg-slate-50"
                                        >
                                            <Barcode className="w-3 h-3" /> ШК
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); downloadFBSStickers(); }}
                                            className="flex items-center gap-1 bg-white border border-slate-300 px-2 py-1 rounded text-xs hover:bg-slate-50"
                                        >
                                            <Printer className="w-3 h-3" /> Стикеры
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); downloadFbsScanTemplateExcel(); }}
                                            className="flex items-center gap-1 bg-white border border-indigo-300 text-indigo-700 px-2 py-1 rounded text-xs hover:bg-indigo-50"
                                        >
                                            <Download className="w-3 h-3" /> Excel для скана
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openFbsScanModal(); }}
                                            className="flex items-center gap-1 bg-white border border-emerald-300 text-emerald-700 px-2 py-1 rounded text-xs hover:bg-emerald-50"
                                        >
                                            <CheckSquare className="w-3 h-3" /> Скан ЧЗ
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      )}

      {fbsScanModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setFbsScanModalOpen(false); setFbsPendingStickerRow(null); setFbsScanMode('sticker'); setFbsScanInputValue(''); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-bold text-slate-900">Скан ЧЗ</div>
                <div className="text-sm text-slate-500">Поставка: {supplies.find((s) => s.id === activeSupplyId)?.name || activeSupplyId || '-'}</div>
                <div className="text-xs text-slate-500 mt-1 space-y-1">
                  {(() => {
                    const stats = getFbsScanProgressStats(fbsScanRows, fbsScansBySticker);
                    return (
                      <>
                        <div>Отсканировано: {stats.scannedCount} из {stats.totalRows}</div>
                        <div>Заменено стикеров в поставке: {stats.scannedCount}</div>
                      </>
                    );
                  })()}
                </div>
              </div>
              <button onClick={() => { setFbsScanModalOpen(false); setFbsPendingStickerRow(null); setFbsScanMode('sticker'); setFbsScanInputValue(''); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 border-b border-slate-100 bg-slate-50 space-y-3">
              <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                <div className={`rounded-xl border px-4 py-3 flex-1 ${fbsScanMode === 'sticker' ? 'border-blue-200 bg-blue-50 text-blue-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
                  {fbsScanMode === 'sticker' ? (
                    <div>
                      <div className="font-semibold">Шаг 1. Сканируйте стикер при считывании</div>
                      <div className="text-sm opacity-80 mt-1">Ищу строку сначала по колонке `Стикер при считывании`, потом по обычному номеру стикера.</div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-semibold">Шаг 2. Сканируйте ЧЗ</div>
                      <div className="text-sm opacity-80 mt-1">Заказ {fbsPendingStickerRow?.orderId}, стикер <span className="font-mono">{fbsPendingStickerRow?.stickerText || '—'}</span>{fbsPendingStickerRow?.stickerScanText ? `, при считывании: ${fbsPendingStickerRow.stickerScanText}` : ''}</div>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={downloadFbsScanTemplateExcel}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-sm font-medium text-indigo-700"
                  >
                    <Download className="w-4 h-4" /> Скачать шаблон Excel
                  </button>
                  <button
                    type="button"
                    onClick={downloadFbsScanResultExcel}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-sm font-medium text-emerald-700"
                  >
                    <Download className="w-4 h-4" /> Скачать скан файл
                  </button>
                  <label className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 cursor-pointer text-sm font-medium text-slate-700">
                    <Upload className="w-4 h-4" /> Загрузить файл поставки
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFbsScanFileUpload(file);
                        e.currentTarget.value = '';
                      }}
                    />
                  </label>
                </div>
              </div>

              {fbsScanNotice && (
                <div className={`rounded-xl border px-4 py-3 text-sm ${fbsScanNotice.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : fbsScanNotice.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-indigo-200 bg-indigo-50 text-indigo-700'}`}>
                  {fbsScanNotice.text}
                </div>
              )}

              <form onSubmit={handleFbsScanSubmit} className="flex flex-col md:flex-row gap-3">
                <input
                  ref={fbsScanInputRef}
                  type="text"
                  value={fbsScanInputValue}
                  onChange={(e) => setFbsScanInputValue(e.target.value)}
                  placeholder={fbsScanMode === 'sticker' ? 'Сканируйте значение из колонки «Стикер при считывании»...' : 'Сканируйте код Честного знака...'}
                  className="flex-1 oc-input"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={fbsScanLoading || !fbsScanInputValue.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {fbsScanMode === 'sticker' ? 'Найти строку' : 'Сохранить ЧЗ'}
                </button>
                {fbsScanMode === 'honest_sign' && (
                  <button
                    type="button"
                    onClick={() => { setFbsPendingStickerRow(null); setFbsScanMode('sticker'); setFbsScanInputValue(''); setFbsScanNotice({ type: 'info', text: 'Скан ЧЗ сброшен. Можно сканировать следующий стикер.' }); }}
                    className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  >
                    Сбросить
                  </button>
                )}
              </form>
            </div>

            <div className="p-5 overflow-auto">
              {fbsScanLoading ? (
                <div className="text-slate-500">Загрузка заказов поставки...</div>
              ) : !fbsScanRows.length ? (
                <div className="text-slate-500">В этой поставке пока нет заказов со стикерами.</div>
              ) : (
                <div className="overflow-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-3 py-2 text-left">Номер заказа</th>
                        <th className="px-3 py-2 text-left">Стикер</th>
                        <th className="px-3 py-2 text-left">Стикер при считывании</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fbsScanRows.map((row) => {
                        const scan = findFbsScanSavedEntry(row, fbsScansBySticker)?.item;
                        const isActive = fbsPendingStickerRow?.storageKey === row.storageKey;
                        const finalReadValue = scan?.honestSignCode || row.stickerScanText || '—';
                        return (
                          <tr
                            key={row.storageKey}
                            className={`${scan?.honestSignCode ? 'bg-emerald-50/60' : isActive ? 'bg-amber-50' : 'bg-white'} border-t border-slate-100`}
                          >
                            <td className="px-3 py-2 font-medium text-slate-900 whitespace-nowrap">{row.orderId || '—'}</td>
                            <td className="px-3 py-2 font-mono text-slate-700 whitespace-nowrap">{getSafeStickerText(row)}</td>
                            <td className="px-3 py-2">
                              <div className={`font-mono text-[11px] break-all ${scan?.honestSignCode ? 'text-emerald-700' : 'text-slate-700'}`}>{finalReadValue}</div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                                {scan?.honestSignCode ? (
                                  <>
                                    <span className="text-emerald-600">ЧЗ сохранён</span>
                                    <button
                                      type="button"
                                      onClick={() => resetFbsScannedCode(row)}
                                      className="inline-flex items-center rounded-lg border border-rose-300 bg-rose-50 px-2 py-0.5 text-rose-700 hover:bg-rose-100"
                                    >
                                      Сбросить ЧЗ
                                    </button>
                                  </>
                                ) : isActive ? (
                                  <span className="text-amber-600">Ждёт ЧЗ</span>
                                ) : !row.stickerScanText ? (
                                  <span className="text-rose-600">Нет значения для считывания</span>
                                ) : (
                                  <span className="text-slate-500">Готов к сканированию</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content: FBS Orders Tab */}
      {(activeTab === 'fbs_orders' || activeTab === 'fbo_acceptance') && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 space-y-4">
          <div className="flex flex-col gap-3">
            <select
              className="w-full md:w-[320px] border rounded-lg p-2 bg-white"
              value={selectedSupplierId}
              onChange={(e) => {
                const value = e.target.value;
                if (activeTab === 'fbo_acceptance') setSelectedSupplierIdFboAcceptance(value);
                else setSelectedSupplierIdFbsOrders(value);
              }}
            >
              <option value="__all__">Все поставщики</option>
              <option value="">Выберите поставщика...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:flex xl:flex-wrap gap-2 md:gap-3">
              <label className="w-full xl:w-auto px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 cursor-pointer inline-flex items-center justify-center gap-2 text-center">
                <Upload className="w-4 h-4 shrink-0" />
                <span>Загрузить файл</span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) parseFbsOrdersFile(f);
                  }}
                />
              </label>
              <button
                onClick={() => { setFbsSaveMetaEditId(null); setFbsSaveBoxes(''); setFbsSavePallets(''); setFbsSaveWarehouseName(''); setFbsSaveSupplyDate(''); setFbsSaveMetaOpen(true); }}
                disabled={!selectedSupplierId || !fbsOrdersGroups.length}
                className="w-full xl:w-auto px-4 py-2 rounded-lg border bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Сохранить отчет
              </button>
              <button
                onClick={async () => { await syncMissingBlocksFromVisibleData(); setFbsRenameRulesOpen(true); }}
                className="w-full xl:w-auto px-4 py-2 rounded-lg border bg-white border-slate-300 text-slate-700"
              >
                Правила названий
              </button>
              <button
                onClick={() => setFbsOrdersHistoryOpen(true)}
                className="w-full xl:w-auto px-4 py-2 rounded-lg border bg-white border-slate-300 text-slate-700"
              >
                {`История ${fbsOrdersTabTitle}`}
              </button>
            </div>
            {fbsOrdersLoading && <div className="text-sm text-slate-500">Обработка файла...</div>}
          </div>

          {fbsAllSuppliersSummary.items.length > 0 && (
            <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-4 text-sm space-y-4 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Общая инфографика</div>
                  <div className="text-lg font-bold text-indigo-950">По всем поставщикам сразу</div>
                  <div className="text-xs text-indigo-700 mt-1">Агрегированная сводка по сохранённым отчётам раздела {fbsOrdersTabTitle}</div>
                </div>
                <div className="rounded-xl border border-indigo-200 bg-white px-4 py-3 min-w-[220px]">
                  <div className="text-[11px] uppercase tracking-wide text-indigo-500">Общий итог</div>
                  <div className="text-2xl font-extrabold text-indigo-900 leading-tight">{fbsAllSuppliersSummary.total.toLocaleString('ru-RU')}</div>
                  <div className="text-xs text-slate-500">{fbsMetricLabel} по всем поставщикам</div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2">
                <div className="rounded-xl border border-indigo-200 bg-white px-4 py-3">
                  <div className="text-[11px] uppercase tracking-wide text-indigo-500">Поставщиков</div>
                  <div className="text-xl font-bold text-indigo-900">{fbsAllSuppliersSummary.suppliersCount}</div>
                </div>
                <div className="rounded-xl border border-indigo-200 bg-white px-4 py-3">
                  <div className="text-[11px] uppercase tracking-wide text-indigo-500">Блоков</div>
                  <div className="text-xl font-bold text-indigo-900">{fbsAllSuppliersSummary.blocksCount}</div>
                </div>
                <div className="rounded-xl border border-indigo-200 bg-white px-4 py-3">
                  <div className="text-[11px] uppercase tracking-wide text-indigo-500">Отчётов в истории</div>
                  <div className="text-xl font-bold text-indigo-900">{(fbsOrdersHistory || []).length}</div>
                </div>
                <div className="rounded-xl border border-indigo-200 bg-white px-4 py-3">
                  <div className="text-[11px] uppercase tracking-wide text-indigo-500">Коробок</div>
                  <div className="text-xl font-bold text-indigo-900">{Number(fbsAllSuppliersSummary.totalBoxes || 0).toLocaleString('ru-RU')}</div>
                </div>
                <div className="rounded-xl border border-indigo-200 bg-white px-4 py-3">
                  <div className="text-[11px] uppercase tracking-wide text-indigo-500">Паллет</div>
                  <div className="text-xl font-bold text-indigo-900">{Number(fbsAllSuppliersSummary.totalPallets || 0).toLocaleString('ru-RU')}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {fbsAllSuppliersSummary.items.map(([name, total]) => (
                  <span key={`all-suppliers-${name}`} className="px-2.5 py-1.5 rounded-xl bg-white border border-indigo-200 text-indigo-900 text-xs shadow-sm">
                    {name}: <b>{Number(total).toLocaleString('ru-RU')}</b>
                  </span>
                ))}
              </div>
            </div>
          )}

          {fbsOrdersGroups.length > 0 && (
            <>
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-sm space-y-1">
                <div>Общая сумма количества {fbsMetricLabel}: <span className="font-semibold text-indigo-800">{fbsOrdersGroups.reduce((s, r) => s + Number(r.totalTasks || 0), 0).toLocaleString('ru-RU')}</span></div>
                <div className="text-xs text-indigo-800">Период отчета: {fbsOrdersPeriod.start ? new Date(fbsOrdersPeriod.start).toLocaleDateString('ru-RU') : '-'} — {fbsOrdersPeriod.end ? new Date(fbsOrdersPeriod.end).toLocaleDateString('ru-RU') : '-'}</div>
              </div>
              <div className="space-y-3">
                {fbsOrdersGroups.map((g, gi) => {
                  const expanded = !!fbsOrdersExpanded[g.name];
                  return (
                    <div key={`g-${gi}`} className="border rounded-xl overflow-hidden">
                      <div className="px-3 py-2 bg-slate-50 border-b flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setFbsOrdersExpanded((prev) => ({ ...prev, [g.name]: !prev[g.name] }))}
                          className="font-medium text-slate-900 hover:text-indigo-700 text-left"
                        >
                          {expanded ? '▼' : '▶'} {g.name || '-'}
                        </button>
                        <div className="text-sm font-semibold text-indigo-700">Заданий: {Number(g.totalTasks || 0).toLocaleString('ru-RU')}</div>
                      </div>
                      {expanded && (
                        <div className="overflow-x-auto">
                          {!!(g.subNames && g.subNames.length) && (
                            <div className="px-3 py-2 border-b bg-indigo-50/40">
                              <div className="text-xs font-medium text-indigo-900 mb-1">Блоки названий внутри:</div>
                              <div className="flex flex-wrap gap-2">
                                {(g.subNames || []).map((sn, sni) => (
                                  <span key={`sn-${gi}-${sni}`} className="px-2 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-800 text-xs">
                                    {sn.name}: <b>{Number(sn.totalTasks || 0).toLocaleString('ru-RU')}</b>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {Array.isArray(g.articles) && g.articles.length > 0 ? (
                            <table className="w-full text-sm min-w-[520px]">
                              <thead className="bg-white text-slate-600">
                                <tr>
                                  <th className="px-3 py-2 text-left">Артикул WB</th>
                                  <th className="px-3 py-2 text-right">Кол-во {fbsMetricLabel}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {g.articles.map((a, ai) => (
                                  <tr key={`a-${gi}-${ai}`} className="border-t">
                                    <td className="px-3 py-2">{a.wbArticle || '-'}</td>
                                    <td className="px-3 py-2 text-right">{Number(a.tasks || 0).toLocaleString('ru-RU')}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="px-3 py-2 text-xs text-slate-500">Детализация по артикулам недоступна для этого отчёта. Используй блоки названий выше.</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {fbsRenameRulesOpen && (
            <div className="fixed inset-0 z-[117] bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-4" onClick={() => setFbsRenameRulesOpen(false)}>
              <div className="w-full max-w-2xl max-h-[90svh] 2xl:max-h-[86vh] overflow-y-auto 2xl:overflow-hidden bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="p-3 sm:p-4 border-b border-slate-200 flex items-center justify-between gap-3">
                  <div className="font-semibold text-slate-900">Правила названий (Артикул → Название)</div>
                  <button type="button" onClick={() => setFbsRenameRulesOpen(false)} className="px-3 py-1.5 text-sm rounded border border-slate-300 hover:bg-slate-50">Закрыть</button>
                </div>
                <div className="p-3 overflow-y-auto max-h-[78vh] sm:max-h-[72vh] space-y-4">
                  <div>
                    <div className="text-sm font-medium text-slate-800 mb-2">Артикул → Название</div>
                    {(fbsRenameRules || []).map((r, i) => (
                      <div key={`rule-${i}`} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 mb-2">
                        <input value={r.article} onChange={(e) => setFbsRenameRules((prev) => prev.map((x, idx) => idx === i ? { ...x, article: e.target.value } : x))} placeholder="Артикул WB" className="oc-input" />
                        <input value={r.name} onChange={(e) => setFbsRenameRules((prev) => prev.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} placeholder="Новое название" className="oc-input" />
                        <button type="button" onClick={() => setFbsRenameRules((prev) => prev.filter((_, idx) => idx !== i))} className="w-full sm:w-auto px-3 py-2 text-sm rounded border border-rose-300 text-rose-700 hover:bg-rose-50">Удалить</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setFbsRenameRules((prev) => [...prev, { article: '', name: '' }])} className="px-3 py-2 text-sm rounded border border-slate-300 hover:bg-slate-50">Добавить правило</button>
                  </div>

                  <div className="border-t pt-3">
                    <div className="text-sm font-medium text-slate-800 mb-2">Редактор блоков названий</div>
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 mb-2">
                      <input value={fbsNewBlockName} onChange={(e) => setFbsNewBlockName(e.target.value)} placeholder="Новое имя блока (например 12х35)" className="oc-input" />
                      <button
                        type="button"
                        onClick={async () => {
                          const name = String(fbsNewBlockName || '').trim();
                          const items = Array.from(new Set((fbsNewBlockItems || []).map((x) => String(x || '').trim()).filter(Boolean)));
                          if (!name) { setError('Введите имя блока'); return; }
                          if (!items.length) { setError('Выберите хотя бы одно наименование для блока'); return; }
                          await saveFbsBlockGroups([...(fbsBlockGroups || []).filter((g) => g.name !== name), { name, items }]);
                          setFbsNewBlockName('');
                          setFbsNewBlockItems([]);
                        }}
                        className="px-3 py-2 text-sm rounded border border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                      >
                        Сохранить блок
                      </button>
                    </div>
                    <div className="max-h-40 overflow-auto border rounded-lg p-2 grid grid-cols-1 md:grid-cols-2 gap-1">
                      {fbsAvailableSourceNames.map((nm) => {
                        const checked = fbsNewBlockItems.includes(nm);
                        return (
                          <label key={`src-${nm}`} className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={checked} onChange={(e) => setFbsNewBlockItems((prev) => e.target.checked ? [...prev, nm] : prev.filter((x) => x !== nm))} />
                            <span className="truncate">{nm}</span>
                          </label>
                        );
                      })}
                    </div>

                    <div className="mt-3 space-y-2">
                      {(fbsBlockGroups || []).map((g, i) => (
                        <div key={`bg-${i}`} className="border rounded-lg p-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-medium text-slate-900">{g.name}</div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setFbsEditingBlockName(g.name);
                                  setFbsEditingBlockItems([...(g.items || [])]);
                                }}
                                className="px-2 py-1 text-xs rounded border border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                              >
                                Редактировать
                              </button>
                              <button type="button" onClick={async () => saveFbsBlockGroups((fbsBlockGroups || []).filter((_, idx) => idx !== i))} className="px-2 py-1 text-xs rounded border border-rose-300 text-rose-700 hover:bg-rose-50">Удалить блок</button>
                            </div>
                          </div>
                          <div className="text-xs text-slate-600 mt-1">{(g.items || []).join(', ')}</div>

                          {fbsEditingBlockName === g.name && (
                            <div className="mt-2 border-t pt-2 space-y-2">
                              <div className="text-xs font-medium text-slate-700">Добавить/убрать блоки названий</div>
                              <div className="max-h-36 overflow-auto border rounded-lg p-2 grid grid-cols-1 md:grid-cols-2 gap-1">
                                {fbsSourceNames
                                  .filter((nm) => {
                                    const key = normalizeBlockName(String(nm || ''));
                                    const usedByOther = (fbsBlockGroups || []).some((bg) => bg.name !== g.name && (bg.items || []).some((it) => normalizeBlockName(String(it || '')) === key));
                                    return !usedByOther || fbsEditingBlockItems.includes(nm);
                                  })
                                  .map((nm) => {
                                    const checked = fbsEditingBlockItems.includes(nm);
                                    return (
                                      <label key={`edit-src-${g.name}-${nm}`} className="flex items-center gap-2 text-sm">
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={(e) => setFbsEditingBlockItems((prev) => e.target.checked ? [...new Set([...prev, nm])] : prev.filter((x) => x !== nm))}
                                        />
                                        <span className="truncate">{nm}</span>
                                      </label>
                                    );
                                  })}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const next = (fbsBlockGroups || []).map((x) => x.name === g.name ? { ...x, items: Array.from(new Set((fbsEditingBlockItems || []).map((z) => String(z || '').trim()).filter(Boolean))) } : x);
                                    await saveFbsBlockGroups(next);
                                    setFbsEditingBlockName('');
                                    setFbsEditingBlockItems([]);
                                  }}
                                  className="px-2 py-1 text-xs rounded border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                >
                                  Сохранить изменения
                                </button>
                                <button type="button" onClick={() => { setFbsEditingBlockName(''); setFbsEditingBlockItems([]); }} className="px-2 py-1 text-xs rounded border border-slate-300 hover:bg-slate-50">Отмена</button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-1 flex items-center gap-2">
                    <button type="button" onClick={async () => { await saveFbsRenameRules(fbsRenameRules); setFbsRenameRulesOpen(false); setSuccessMsg('Правила сохранены'); setTimeout(() => setSuccessMsg(null), 2000); }} className="px-3 py-2 text-sm rounded border border-emerald-300 text-emerald-700 hover:bg-emerald-50">Сохранить всё</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {fbsSaveMetaOpen && (
            <div className="fixed inset-0 z-[118] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setFbsSaveMetaOpen(false)}>
              <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-4" onClick={(e) => e.stopPropagation()}>
                <div className="text-base font-semibold text-slate-900 mb-3">{fbsSaveMetaEditId ? 'Редактировать параметры отчета' : 'Параметры отчета'}</div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-slate-700 mb-1">Количество коробок</label>
                    <input type="number" min="0" value={fbsSaveBoxes} onChange={(e) => setFbsSaveBoxes(e.target.value)} className="oc-input" placeholder="0" />
                  </div>
                  {activeTab === 'fbo_acceptance' && (
                    <>
                      <div>
                        <label className="block text-sm text-slate-700 mb-1">Количество паллет</label>
                        <input type="number" min="0" value={fbsSavePallets} onChange={(e) => setFbsSavePallets(e.target.value)} className="oc-input" placeholder="0" />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-700 mb-1">Название склада</label>
                        <input type="text" value={fbsSaveWarehouseName} onChange={(e) => setFbsSaveWarehouseName(e.target.value)} className="oc-input" placeholder="Например: Коледино" />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-700 mb-1">Дата поставки</label>
                        <input type="date" value={fbsSaveSupplyDate} onChange={(e) => setFbsSaveSupplyDate(e.target.value)} className="oc-input" />
                      </div>
                    </>
                  )}
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setFbsSaveMetaOpen(false)} className="px-3 py-2 text-sm rounded border border-slate-300 hover:bg-slate-50">Отмена</button>
                  <button type="button" onClick={async () => { const pallets = activeTab === 'fbo_acceptance' ? Number(fbsSavePallets || 0) : 0; const meta = { boxes: Number(fbsSaveBoxes || 0), pallets, warehouseName: activeTab === 'fbo_acceptance' ? fbsSaveWarehouseName : '', supplyDate: activeTab === 'fbo_acceptance' ? fbsSaveSupplyDate : '' }; if (fbsSaveMetaEditId) { await updateFbsOrdersHistoryMeta(fbsSaveMetaEditId, meta); } else { await saveFbsOrdersReport(meta); } setFbsSaveMetaOpen(false); }} className="px-3 py-2 text-sm rounded border border-emerald-300 text-emerald-700 hover:bg-emerald-50">Сохранить</button>
                </div>
              </div>
            </div>
          )}

          {fbsOrdersHistoryOpen && (
            <div className="fixed inset-0 z-[118] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setFbsOrdersHistoryOpen(false)}>
              <div className="w-full max-w-3xl max-h-[90svh] 2xl:h-[86vh] overflow-y-auto 2xl:overflow-hidden bg-white rounded-2xl shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-200 space-y-3 shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-900">{`История ${fbsOrdersTabTitle}`}</div>
                    <button type="button" onClick={() => setFbsOrdersHistoryOpen(false)} className="px-3 py-1.5 text-sm rounded border border-slate-300 hover:bg-slate-50">Закрыть</button>
                  </div>
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-sm space-y-3">
                    <div>
                      <div className="font-medium text-indigo-900 mb-1">Общая сумма {fbsMetricLabel} по всем отчётам (по блокам наименований)</div>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const blockByItem = new Map<string, string>();
                          (fbsBlockGroups || []).forEach((bg: any) => {
                            const blockName = String(bg?.name || '').trim();
                            if (!blockName) return;
                            (Array.isArray(bg?.items) ? bg.items : []).forEach((it: any) => {
                              const key = normalizeBlockName(String(it || ''));
                              if (key) blockByItem.set(key, blockName);
                            });
                          });

                          const acc: Record<string, number> = {};
                          (fbsOrdersHistory || []).forEach((h: any) => {
                            (h?.groups || []).forEach((g: any) => {
                              const subNames = Array.isArray(g?.subNames) && g.subNames.length
                                ? g.subNames.map((s: any) => ({ name: String(s?.name || '').trim(), totalTasks: Number(s?.totalTasks || 0) }))
                                : [{ name: String(g?.name || '').trim(), totalTasks: Number(g?.totalTasks || 0) }];

                              subNames.forEach((sn: any) => {
                                if (!sn?.name) return;
                                const target = findBlockBySourceName(sn.name, blockByItem);
                                acc[target] = (acc[target] || 0) + Number(sn.totalTasks || 0);
                              });
                            });
                          });

                          return Object.entries(acc)
                            .sort((a: any, b: any) => Number(b[1]) - Number(a[1]) || String(a[0]).localeCompare(String(b[0]), 'ru'))
                            .map(([name, total]) => (
                              <span key={`sum-${name}`} className="px-2 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-800 text-xs">
                                {name}: <b>{Number(total).toLocaleString('ru-RU')}</b>
                              </span>
                            ));
                        })()}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-800">
                        Всего коробок по всем поставкам: <b>{(fbsOrdersHistory || []).reduce((s: number, h: any) => s + Number(h?.boxes || 0), 0).toLocaleString('ru-RU')}</b>
                      </div>
                      {activeTab === 'fbo_acceptance' && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
                          Всего паллет по всем поставкам: <b>{(fbsOrdersHistory || []).reduce((s: number, h: any) => s + Number(h?.pallets || 0), 0).toLocaleString('ru-RU')}</b>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-3 overflow-auto flex-1 pb-6">
                  {!fbsOrdersHistory.length ? (
                    <div className="text-sm text-slate-500 p-3">История пока пустая</div>
                  ) : (
                    <div className="space-y-2">
                      {fbsOrdersHistory.map((h) => (
                        <div key={h.id} className="border rounded-xl p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <div className="text-sm font-medium text-slate-900">{h.supplierName}</div>
                              <div className="text-xs text-slate-500">{new Date(h.createdAt).toLocaleString('ru-RU')}</div>
                              {activeTab === 'fbo_acceptance' ? (
                                <div className="text-xs text-slate-500">Склад: {h.warehouseName || '-'} • Дата поставки: {h.supplyDate ? new Date(`${h.supplyDate}T12:00:00`).toLocaleDateString('ru-RU') : '-'}</div>
                              ) : (
                                <div className="text-xs text-slate-500">Период: {h.periodStart ? new Date(h.periodStart).toLocaleDateString('ru-RU') : '-'} — {h.periodEnd ? new Date(h.periodEnd).toLocaleDateString('ru-RU') : '-'}</div>
                              )}
                              <div className="text-xs text-slate-500">Коробок: {Number(h.boxes || 0).toLocaleString('ru-RU')}{activeTab === 'fbo_acceptance' ? ` • Паллет: ${Number(h.pallets || 0).toLocaleString('ru-RU')}` : ''}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-semibold text-indigo-700">Всего {fbsMetricLabel}: {Number(h.totalTasks || 0).toLocaleString('ru-RU')}</div>
                              <button type="button" onClick={() => openFbsOrdersHistoryReport(h)} className="px-2 py-1 text-xs rounded border border-indigo-300 text-indigo-700 hover:bg-indigo-50">Открыть отчет</button>
                              <button type="button" onClick={() => { setFbsOrdersHistoryOpen(false); setFbsSaveMetaEditId(String(h.id)); setFbsSaveBoxes(String(Number(h.boxes || 0))); setFbsSavePallets(String(Number(h.pallets || 0))); setFbsSaveWarehouseName(String(h.warehouseName || '')); setFbsSaveSupplyDate(String(h.supplyDate || '')); setTimeout(() => setFbsSaveMetaOpen(true), 0); }} className="px-2 py-1 text-xs rounded border border-amber-300 text-amber-700 hover:bg-amber-50">Редактировать</button>
                              <button type="button" onClick={() => deleteFbsOrdersHistoryReport(h.id)} className="px-2 py-1 text-xs rounded border border-rose-300 text-rose-700 hover:bg-rose-50">Удалить</button>
                            </div>
                          </div>
                          <div className="mt-2 space-y-1">
                            {(() => {
                              const blockByItem = new Map<string, string>();
                              (fbsBlockGroups || []).forEach((bg: any) => {
                                const blockName = String(bg?.name || '').trim();
                                if (!blockName) return;
                                (Array.isArray(bg?.items) ? bg.items : []).forEach((it: any) => {
                                  const key = normalizeBlockName(String(it || ''));
                                  if (key) blockByItem.set(key, blockName);
                                });
                              });

                              const regrouped = new Map<string, number>();
                              (h.groups || []).forEach((g: any) => {
                                const subNames = Array.isArray(g?.subNames) && g.subNames.length
                                  ? g.subNames.map((s: any) => ({ name: String(s?.name || '').trim(), totalTasks: Number(s?.totalTasks || 0) }))
                                  : [{ name: String(g?.name || '').trim(), totalTasks: Number(g?.totalTasks || 0) }];

                                subNames.forEach((sn: any) => {
                                  if (!sn?.name) return;
                                  const target = findBlockBySourceName(sn.name, blockByItem);
                                  regrouped.set(target, (regrouped.get(target) || 0) + Number(sn.totalTasks || 0));
                                });
                              });

                              return Array.from(regrouped.entries())
                                .sort((a, b) => Number(b[1]) - Number(a[1]) || String(a[0]).localeCompare(String(b[0]), 'ru'))
                                .map(([name, total], i: number) => (
                                  <details key={`hist-${h.id}-${i}`} className="border rounded-lg bg-slate-50">
                                    <summary className="cursor-pointer list-none px-3 py-2 flex items-center justify-between text-sm">
                                      <span className="text-slate-900">{name}</span>
                                      <span className="font-semibold text-indigo-700">Заданий: {Number(total || 0).toLocaleString('ru-RU')}</span>
                                    </summary>
                                  </details>
                                ));
                            })()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'supply_order' && (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-4 md:p-5 mb-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <div>
                <div className="font-bold text-slate-900 leading-tight">Заказ товара</div>
                <div className="mt-0.5 text-sm text-slate-500">
                  {generatedOrderPdf
                    ? <>PDF: <span className="font-medium text-slate-700">{generatedOrderPdf.fileName}</span> • Кол-во: <span className="font-semibold text-slate-700">{generatedOrderPdf.totalQty}</span> • Сумма: <span className="font-semibold text-indigo-700">{generatedOrderPdf.totalCost.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽</span></>
                    : <>Кол-во: <span className="font-semibold text-slate-700">{supplyOrderSummaryRows.reduce((sum, row) => sum + Number(row.qty || 0), 0)}</span> • Сумма: <span className="font-semibold text-indigo-700">{supplyOrderTotalCost.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽</span></>}
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => {
                const next: Record<string, string> = {};
                orderCostItems.forEach((row) => {
                  next[row.key] = String(getOrderStoredCost(row) || '');
                });
                setOrderCostEditorValues(next);
                setOrderCostEditorOpen(true);
              }} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-[0.97]">Себестоимость</button>
              <button onClick={() => setOrderHistoryOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-[0.97]">История заказов</button>
              <button onClick={() => setOrderArrangeOpen(true)} disabled={!supplyOrderSummaryRows.length} className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-2 text-sm font-medium text-violet-700 shadow-sm transition-all hover:bg-violet-100 active:scale-[0.97] disabled:opacity-50">Порядок{Object.keys(orderArrangeSeq).length ? ` (${Object.keys(orderArrangeSeq).length})` : ''}</button>
              <button
                onClick={generateSupplyOrderExcel}
                disabled={!supplyOrderSummaryRows.length}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-[0.97] disabled:opacity-50"
              >
                Скачать Excel
              </button>
              <button onClick={() => {
                const supplierName = suppliers.find((s) => s.id === selectedSupplierIdSupplyOrder)?.name || 'Заказ';
                const defaultName = `Заказ_${supplierName}_${new Date().toLocaleDateString('ru-RU').replace(/\./g, '-')}`;
                setOrderPdfFileName(defaultName);
                setOrderPdfNameModalOpen(true);
              }} disabled={!supplyOrderSummaryRows.length} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-[0.97] disabled:opacity-50">Скачать PDF</button>
            </div>
          </div>
          {supplyOrderSummaryRows.length > 0 && (
            <div className="overflow-auto border border-slate-200 rounded-2xl bg-white">
              <table className="w-full text-sm min-w-[760px]">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 text-left">Артикул</th>
                    <th className="px-3 py-2 text-left">Товар</th>
                    <th className="px-3 py-2 text-left">Размеры</th>
                    <th className="px-3 py-2 text-right">Кол-во</th>
                    <th className="px-3 py-2 text-right">Себестоимость</th>
                    <th className="px-3 py-2 text-right">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {supplyOrderSummaryRows.map((row) => (
                    <tr key={`summary-${row.nmId}-${row.article}`} className="border-t border-slate-100 hover:bg-slate-50/60">
                      <td className="px-3 py-2">{row.article || row.nmId || '-'}</td>
                      <td className="px-3 py-2">{row.title || '-'}</td>
                      <td className="px-3 py-2">{row.sizes.map((s) => `${s.size}: ${s.quantity}`).join(', ')}</td>
                      <td className="px-3 py-2 text-right font-medium">{row.qty}</td>
                      <td className="px-3 py-2 text-right">{row.costPerUnit > 0 ? `${row.costPerUnit.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽` : '—'}</td>
                      <td className="px-3 py-2 text-right font-semibold">{row.totalCost > 0 ? `${row.totalCost.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-semibold text-slate-900">
                    <td className="px-3 py-2" colSpan={3}>Итого</td>
                    <td className="px-3 py-2 text-right">{supplyOrderSummaryRows.reduce((sum, row) => sum + Number(row.qty || 0), 0)}</td>
                    <td className="px-3 py-2 text-right">—</td>
                    <td className="px-3 py-2 text-right">{supplyOrderTotalCost.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {orderMissingCostsModalOpen && (
        <div className="fixed inset-0 z-[132] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOrderMissingCostsModalOpen(false)}>
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="text-lg font-bold text-slate-900 mb-2">Заполните себестоимость</div>
            <div className="text-sm text-slate-500 mb-4">Перед скачиванием нужно указать цену для товаров без себестоимости.</div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[60vh] overflow-auto">
              {orderMissingCostItems.map((r) => {
                const code = String(r?.nmId || r?.article || '');
                const photo = calcPhotoByNmId[String(r?.nmId || '')] || '';
                const valueKey = String(r.nmId || r.article || r.title || '');
                return (
                  <div key={`missing-cost-${valueKey}`} className="border border-slate-200 rounded-xl p-3 bg-white">
                    <div className="flex gap-3">
                      {photo ? (
                        <img src={photo} alt={r?.title || code} className="w-20 h-24 object-contain rounded border border-slate-200 bg-white p-1" />
                      ) : (
                        <div className="w-20 h-24 rounded border border-slate-200 bg-slate-100 text-slate-400 text-xs flex items-center justify-center">N/A</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-slate-500">{code || 'Без артикула'}</div>
                        <div className="text-sm text-slate-900 leading-5 break-words">{r?.title || '-'}</div>
                        <div className="mt-1 text-xs text-slate-500">Кол-во: {r.qty}</div>
                        <div className="mt-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={orderCostEditorValues[valueKey] ?? ''}
                            onChange={(e) => setOrderCostEditorValues((prev) => ({ ...prev, [valueKey]: e.target.value }))}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                            placeholder="Себестоимость"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setOrderMissingCostsModalOpen(false)} className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50">Отмена</button>
              <button
                onClick={async () => {
                  const next = { ...(orderCostOverrides || {}) };
                  orderMissingCostItems.forEach((row) => {
                    const key = String(row.nmId || row.article || row.title || '');
                    const raw = orderCostEditorValues[key] ?? '';
                    const n = Number(String(raw || '').replace(',', '.'));
                    const safeValue = Number.isFinite(n) && n >= 0 ? n : 0;
                    getCalcCostKeyCandidates({ key, nmId: row.nmId, article: row.article, title: row.title }).forEach((candidate) => {
                      next[candidate] = safeValue;
                    });
                  });
                  setOrderCostOverrides(next);
                  try {
                    if (selectedSupplierIdSupplyOrder) {
                      const key = `supply_order_cost_overrides_v1:${selectedSupplierIdSupplyOrder}`;
                      await supabase.from('app_settings').upsert([{ key, value: JSON.stringify(next) }], { onConflict: 'key' });
                    }
                  } catch {}
                  setOrderMissingCostsModalOpen(false);
                  const pending = pendingOrderExport;
                  setPendingOrderExport(null);
                  if (pending?.type === 'pdf') {
                    await generateSupplyOrderDocument(pending.fileName);
                  } else if (pending?.type === 'excel') {
                    await generateSupplyOrderExcel();
                  }
                }}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Сохранить цены
              </button>
            </div>
          </div>
        </div>
      )}

      {orderPdfNameModalOpen && (
        <div className="fixed inset-0 z-[131] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOrderPdfNameModalOpen(false)}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="text-lg font-bold text-slate-900 mb-2">Название PDF</div>
            <div className="text-sm text-slate-500 mb-4">Введите название файла для заказа</div>
            <input
              type="text"
              value={orderPdfFileName}
              onChange={(e) => setOrderPdfFileName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-4"
              placeholder="Название файла"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setOrderPdfNameModalOpen(false)} className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50">Отмена</button>
              <button
                onClick={async () => {
                  await generateSupplyOrderDocument(orderPdfFileName);
                  setOrderPdfNameModalOpen(false);
                }}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Сохранить PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {orderArrangeOpen && (() => {
        const items = buildSupplyOrderItems();
        const photoOf = (p: any) => p?.photos?.[0]?.c246x328 || p?.photos?.[0]?.c516x688 || p?.photos?.[0]?.big || '';
        const toggle = (nmId: number) => {
          setOrderArrangeSeq((prev) => {
            const next = { ...prev };
            if (next[nmId] != null) {
              // снять и пере-нумеровать оставшиеся
              delete next[nmId];
              const ordered = Object.entries(next).sort((a, b) => a[1] - b[1]);
              const renum: Record<number, number> = {};
              ordered.forEach(([id], i) => { renum[Number(id)] = i + 1; });
              return renum;
            }
            const maxPos = Object.values(next).reduce((m, v) => Math.max(m, v), 0);
            next[nmId] = maxPos + 1;
            return next;
          });
        };
        return (
          <div className="fixed inset-0 z-[132] bg-slate-900/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setOrderArrangeOpen(false)}>
            <div className="w-full sm:max-w-3xl max-h-[92vh] flex flex-col bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-900">Порядок товаров в отчёте</div>
                  <div className="text-xs text-slate-500 mt-0.5">Нажимайте на фото в нужной последовательности — номер проставится автоматически. Без выбора — порядок по умолчанию.</div>
                </div>
                <button onClick={() => setOrderArrangeOpen(false)} className="shrink-0 w-9 h-9 rounded-full hover:bg-slate-100 text-slate-500 text-lg">✕</button>
              </div>
              <div className="p-4 overflow-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {items.map((it) => {
                    const nmId = it.product.nmID;
                    const pos = orderArrangeSeq[nmId];
                    const photo = photoOf(it.product);
                    const qty = it.sizes.reduce((s, x) => s + x.quantity, 0);
                    return (
                      <button key={nmId} onClick={() => toggle(nmId)} className={`relative text-left rounded-xl border-2 overflow-hidden transition-all ${pos != null ? 'border-violet-500 ring-2 ring-violet-200' : 'border-slate-200 hover:border-slate-300'}`}>
                        <div className="aspect-[3/4] bg-slate-100 flex items-center justify-center overflow-hidden">
                          {photo ? <img src={photo} alt="" className="w-full h-full object-cover" loading="lazy" /> : <span className="text-slate-300 text-xs">нет фото</span>}
                        </div>
                        <div className={`absolute top-1.5 left-1.5 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow ${pos != null ? 'bg-violet-600 text-white' : 'bg-white/80 text-slate-400 border border-slate-300'}`}>{pos != null ? pos : '+'}</div>
                        <div className="p-1.5">
                          <div className="text-[11px] text-slate-700 line-clamp-2 leading-tight" title={it.product.title}>{it.product.title || '-'}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{it.product.nmID} • {qty} шт.</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="p-4 border-t border-slate-200 flex items-center justify-between gap-2">
                <button onClick={() => setOrderArrangeSeq({})} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-sm">Сбросить</button>
                <button onClick={() => setOrderArrangeOpen(false)} className="px-5 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 text-sm font-semibold">Готово</button>
              </div>
            </div>
          </div>
        );
      })()}

      {orderCostEditorOpen && (
        <div className="fixed inset-0 z-[131] bg-slate-900/55 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOrderCostEditorOpen(false)}>
          <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-900">Себестоимость — Заказ товара</div>
                <div className="text-xs text-slate-500 mt-1">Только карточки товаров, которые были в заказах текущего поставщика</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const next = { ...(orderCostOverrides || {}) };
                    orderCostItems.forEach((row) => {
                      const raw = orderCostEditorValues[row.key] ?? '';
                      const n = Number(String(raw || '').replace(',', '.'));
                      const safeValue = Number.isFinite(n) && n >= 0 ? n : 0;
                      getCalcCostKeyCandidates({ key: row.key, nmId: row.nmId, article: row.article, title: row.title }).forEach((candidate) => {
                        next[candidate] = safeValue;
                      });
                    });
                    setOrderCostOverrides(next);
                    try {
                      if (selectedSupplierIdSupplyOrder) {
                        const key = `supply_order_cost_overrides_v1:${selectedSupplierIdSupplyOrder}`;
                        await supabase.from('app_settings').upsert([{ key, value: JSON.stringify(next) }], { onConflict: 'key' });
                      }
                      setSuccessMsg('Себестоимость заказа сохранена');
                      setTimeout(() => setSuccessMsg(null), 2500);
                    } catch {}
                    setOrderCostEditorOpen(false);
                  }}
                  className="px-3 py-2 text-sm rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  Сохранить
                </button>
                <button type="button" onClick={() => setOrderCostEditorOpen(false)} className="px-3 py-2 text-sm rounded-lg border border-slate-300 hover:bg-slate-50">Закрыть</button>
              </div>
            </div>
            <div className="p-4 overflow-auto max-h-[78vh]">
              {orderCostItems.length === 0 ? (
                <div className="text-sm text-slate-500">Нет карточек товаров для настройки себестоимости.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {orderCostItems.map((r) => {
                    const code = String(r?.nmId || r?.article || '');
                    const photo = calcPhotoByNmId[String(r?.nmId || '')] || '';
                    const valueKey = String(r.key || '');
                    return (
                      <div key={`order-cost-${valueKey}`} className="border border-slate-200 rounded-xl p-3 bg-white">
                        <div className="flex gap-3">
                          {photo ? (
                            <img src={photo} alt={r?.title || code} className="w-20 h-24 object-contain rounded border border-slate-200 bg-white p-1" />
                          ) : (
                            <div className="w-20 h-24 rounded border border-slate-200 bg-slate-100 text-slate-400 text-xs flex items-center justify-center">N/A</div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-xs text-slate-500">{code || 'Без артикула'}</div>
                            <div className="text-sm text-slate-900 leading-5 break-words">{r?.title || '-'}</div>
                            <div className="mt-1 text-xs text-slate-500">Кол-во: {r.qty}</div>
                            <div className="mt-2">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={orderCostEditorValues[valueKey] ?? ''}
                                onChange={(e) => setOrderCostEditorValues((prev) => ({ ...prev, [valueKey]: e.target.value }))}
                                className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                                placeholder="Себестоимость"
                              />
                            </div>
                          </div>
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

      {orderHistoryOpen && (
        <div className="fixed inset-0 z-[130] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOrderHistoryOpen(false)}>
          <div className="w-full max-w-3xl max-h-[85vh] overflow-hidden bg-white rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-slate-900">История заказов</div>
                <div className="text-sm text-slate-500">Сохраненные PDF по текущему поставщику</div>
              </div>
              <button onClick={() => setOrderHistoryOpen(false)} className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50">Закрыть</button>
            </div>
            <div className="p-4 overflow-auto max-h-[70vh] space-y-2">
              {!orderHistory.length ? (
                <div className="text-sm text-slate-500">История заказов пока пуста.</div>
              ) : orderHistory.map((item) => (
                <div key={item.id} className="border rounded-xl p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="font-medium text-slate-900">{item.fileName}</div>
                    <div className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString('ru-RU')} • {item.totalQty} шт. • {Number(item.totalCost || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽</div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <a href={item.dataUrl} download={item.fileName} className="px-3 py-2 rounded-lg border border-indigo-300 text-indigo-700 hover:bg-indigo-50">Открыть PDF</a>
                    <button
                      onClick={async () => {
                        const next = (orderHistory || []).filter((x) => String(x.id) !== String(item.id));
                        setOrderHistory(next);
                        try {
                          if (selectedSupplierId) {
                            const key = `supplier_order_history_v1:${selectedSupplierId}`;
                            await supabase.from('app_settings').upsert([{ key, value: JSON.stringify(next) }], { onConflict: 'key' });
                          }
                        } catch {}
                      }}
                      className="px-3 py-2 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content: FBS Calc Tab */}
      {activeTab === 'fbs_calc' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 space-y-4">
          <div>
            <label className="text-xs text-slate-500">Поставщик</label>
            <select
              className="w-full md:w-[420px] border rounded-lg p-2 bg-white"
              value={selectedSupplierIdCalc}
              onChange={(e) => setSelectedSupplierIdCalc(e.target.value)}
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col md:flex-row md:items-end gap-3">
            <div className="flex-1">
              <label className="text-xs text-slate-500">Поставка FBS</label>
              <select
                className="w-full border rounded-lg p-2 bg-white"
                value={calcSupplyId}
                onChange={(e) => setCalcSupplyId(e.target.value)}
              >
                <option value="">Выберите поставку...</option>
                {supplies.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => loadFbsCalcForSupply(calcSupplyId)}
              disabled={!calcSupplyId || calcLoading}
              className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {calcLoading ? 'Загрузка...' : 'Рассчитать'}
            </button>
            <button
              onClick={() => openCalcCostEditor(false)}
              disabled={!calcRows.length}
              className="px-4 py-2 rounded-lg border bg-white border-slate-300 text-slate-700 disabled:opacity-50"
            >
              Редактировать себестоимость
            </button>
            <button
              onClick={saveCalcSnapshot}
              disabled={!calcRows.length || !calcSupplyId}
              className="px-4 py-2 rounded-lg border bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Сохранить расчет
            </button>
            <button
              onClick={() => setCalcHistoryOpen(true)}
              className="px-4 py-2 rounded-lg border bg-white border-slate-300 text-slate-700"
            >
              История расчетов
            </button>
          </div>

          {calcRows.length > 0 && (
            <>
              <div className="text-sm text-slate-700">
                Товаров в групп-листе: <b>{calcRows.length}</b> • Кол-во единиц: <b>{calcRows.reduce((s, r) => s + r.qty, 0)}</b> • Общая себестоимость: <b>{calcRows.reduce((s, r) => s + (r.qty * Number(getCalcStoredCost(r) || 0)), 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽</b>
              </div>
              <div className="overflow-auto border rounded-xl">
                <table className="w-full text-sm min-w-[980px]">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-2 text-left">Фото</th>
                      <th className="px-3 py-2 text-left">Номенклатура</th>
                      <th className="px-3 py-2 text-left">Товар</th>
                      <th className="px-3 py-2 text-left">Размеры</th>
                      <th className="px-3 py-2 text-right">Кол-во</th>
                      <th className="px-3 py-2 text-right">Себестоимость (₽)</th>
                      <th className="px-3 py-2 text-right">Итого (₽)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calcRows.map((r) => {
                      const cost = Number(getCalcStoredCost(r) || 0);
                      const nmKey = String(r.nmId || '');
                      const photo = calcPhotoByNmId[nmKey] || '';
                      return (
                        <tr key={r.key} className="border-t">
                          <td className="px-3 py-2">
                            {photo ? <img src={photo} alt={r.title} className="w-36 h-36 rounded object-cover border" /> : <div className="w-36 h-36 rounded bg-slate-100 border" />}
                          </td>
                          <td className="px-3 py-2">{r.nmId || '-'}</td>
                          <td className="px-3 py-2">{r.title}</td>
                          <td className="px-3 py-2">{r.sizes.join(', ') || '-'}</td>
                          <td className="px-3 py-2 text-right font-medium">{r.qty}</td>
                          <td className="px-3 py-2 text-right">
                            <span className="font-medium">{cost.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}</span>
                          </td>
                          <td className="px-3 py-2 text-right font-semibold">{(r.qty * cost).toLocaleString('ru-RU', { maximumFractionDigits: 2 })}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="text-xs text-slate-500">Редактирование себестоимости работает как в аналитике: вводите стоимость по товару, итог пересчитывается автоматически.</div>
            </>
          )}

          {calcHistoryOpen && (
            <div className="fixed inset-0 z-[118] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setCalcHistoryOpen(false)}>
              <div className="w-full max-w-3xl max-h-[90svh] 2xl:max-h-[86vh] overflow-y-auto 2xl:overflow-hidden bg-white rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-900">История расчетов</div>
                    <button type="button" onClick={() => setCalcHistoryOpen(false)} className="px-3 py-1.5 text-sm rounded border border-slate-300 hover:bg-slate-50">Закрыть</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">Общая сумма по всем отчетам: <span className="font-semibold">{calcHistorySummaryAll.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽</span></div>
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">Сумма за период: <span className="font-semibold">{calcHistorySummaryPeriod.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽</span></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input type="date" value={calcHistoryPeriodStart} onChange={(e) => setCalcHistoryPeriodStart(e.target.value)} className="oc-input" placeholder="Дата начала" />
                    <input type="date" value={calcHistoryPeriodEnd} onChange={(e) => setCalcHistoryPeriodEnd(e.target.value)} className="oc-input" placeholder="Дата конца" />
                    <button type="button" onClick={() => { setCalcHistoryPeriodStart(''); setCalcHistoryPeriodEnd(''); }} className="px-3 py-2 text-sm rounded border border-slate-300 hover:bg-slate-50">Сбросить период</button>
                  </div>
                </div>
                <div className="p-3 overflow-auto max-h-[74vh]">
                  {!calcHistory.length ? (
                    <div className="text-sm text-slate-500 p-3">История пока пустая</div>
                  ) : (
                    <div className="space-y-2">
                      {calcHistoryFiltered.map((h) => (
                        <div key={h.id} className="border rounded-xl p-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-slate-900 truncate">{h.supplyName}</div>
                            <div className="text-xs text-slate-500">Дата отчёта: {(() => { const m = String(h?.supplyName || '').match(/(\d{2}\.\d{2}\.\d{4})/); return m?.[1] || new Date(h.createdAt).toLocaleDateString('ru-RU'); })()} • Позиций: {h.rows?.length || 0}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-semibold text-emerald-700 whitespace-nowrap">{Number(h.totalCost || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽</div>
                            <button type="button" onClick={() => openCalcSnapshot(h)} className="px-3 py-1.5 text-sm rounded border border-indigo-300 text-indigo-700 hover:bg-indigo-50">Открыть</button>
                            <button type="button" onClick={() => deleteCalcSnapshot(h.id)} className="px-3 py-1.5 text-sm rounded border border-rose-300 text-rose-700 hover:bg-rose-50">Удалить</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {calcCostEditorOpen && (
            <div className="fixed inset-0 z-[120] bg-slate-900/55 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setCalcCostEditorOpen(false)}>
              <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900">Редактор себестоимости (ФБС расчёт)</div>
                    {calcMissingCostOnly && <div className="text-xs text-amber-700 mt-1">Показаны только новые товары без сохранённой себестоимости</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={calcCostEditorSearch}
                      onChange={(e) => setCalcCostEditorSearch(e.target.value)}
                      placeholder="Поиск по номенклатуре/названию"
                      className="w-64 px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                    <button type="button" onClick={saveCalcCostEditor} className="px-3 py-2 text-sm rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50">Сохранить</button>
                    <button type="button" onClick={() => setCalcCostEditorOpen(false)} className="px-3 py-2 text-sm rounded-lg border border-slate-300 hover:bg-slate-50">Закрыть</button>
                  </div>
                </div>
                <div className="p-4 overflow-auto max-h-[78vh]">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {calcCostEditorItems.map((r) => {
                      const code = String(r?.nmId || r?.key || '');
                      const photo = calcPhotoByNmId[String(r?.nmId || '')] || '';
                      return (
                        <div key={`calc-edit-${r.key}`} className="border border-slate-200 rounded-xl p-3 bg-white">
                          <div className="flex gap-3">
                            {photo ? (
                              <img src={photo} alt={r?.title || code} className="w-20 h-24 object-contain rounded border border-slate-200 bg-white p-1" />
                            ) : (
                              <div className="w-20 h-24 rounded border border-slate-200 bg-slate-100 text-slate-400 text-xs flex items-center justify-center">N/A</div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-xs text-slate-500">{code}</div>
                              <div className="text-sm text-slate-900 leading-5 break-words">{r?.title || '-'}</div>
                              <div className="mt-1 text-xs text-slate-500">Кол-во: {r.qty}</div>
                              <div className="mt-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={calcCostEditorValues[r.key] ?? ''}
                                  onChange={(e) => setCalcCostEditorValues((prev) => ({ ...prev, [r.key]: e.target.value }))}
                                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                                  placeholder="Себестоимость"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content: Supply Order Tab */}
      {activeTab === 'supply_order' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col min-h-[380px] 2xl:h-[calc(100vh-10rem)] overflow-hidden">
              <div className="p-4 md:p-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-violet-50 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                      <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm">
                              <ShoppingCart className="h-6 w-6" />
                          </div>
                          <div>
                              <h2 className="font-bold text-slate-900 leading-tight">Заказ товара</h2>
                              <label className="text-xs text-slate-500">Поставщик</label>
                              <select
                                  className="mt-1 block w-full md:w-[420px] rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                  value={selectedSupplierIdSupplyOrder}
                                  onChange={(e) => setSelectedSupplierIdSupplyOrder(e.target.value)}
                              >
                                  {suppliers.map((s) => (
                                      <option key={s.id} value={s.id}>{s.name}</option>
                                  ))}
                              </select>
                          </div>
                      </div>
                      <button
                          onClick={() => setShowFilters(!showFilters)}
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium shadow-sm transition-all active:scale-[0.97] ${showFilters ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                          title="Фильтры"
                      >
                          <Filter className="w-4 h-4" /> Фильтры
                      </button>
                  </div>
              </div>

              {/* Filters Bar */}
              {(showFilters || productSearch) && (
                  <div className="p-4 border-b border-slate-100 bg-slate-50/60 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="relative">
                          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                              type="text"
                              placeholder="Поиск по артикулу, номенклатуре (WB) или названию..."
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500"
                              value={productSearch}
                              onChange={(e) => setProductSearch(e.target.value)}
                          />
                      </div>

                      {showFilters && (
                          <>
                              <select
                                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                                  value={selectedBrand}
                                  onChange={(e) => setSelectedBrand(e.target.value)}
                              >
                                  <option value="">Все бренды</option>
                                  {brands.map(b => <option key={b} value={b}>{b}</option>)}
                              </select>

                              <select
                                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                                  value={selectedCategory}
                                  onChange={(e) => setSelectedCategory(e.target.value)}
                              >
                                  <option value="">Все категории</option>
                                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                              <label className="flex items-center gap-2 text-sm text-slate-700">
                                  <input
                                      type="checkbox"
                                      checked={showFilledOrderCards}
                                      onChange={(e) => setShowFilledOrderCards(e.target.checked)}
                                  />
                                  Показать заполненные карточки
                              </label>
                          </>
                      )}
                  </div>
              )}

              <div className="2xl:flex-1 2xl:overflow-auto p-0">
                  <table className="w-full text-sm text-left">
                      <thead className="text-xs font-semibold text-slate-500 uppercase bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                          <tr>
                              <th className="p-3 w-28">Фото</th>
                              <th className="p-3">Артикул / Название</th>
                              <th className="p-3">Размеры и остатки</th>
                              <th className="p-3 w-32">График</th>
                              <th className="p-3 w-32">Заказ</th>
                          </tr>
                      </thead>
                      <tbody>
                          {products
                              .filter(p => {
                                  const searchLower = productSearch.toLowerCase();
                                  const matchesSearch = !productSearch || 
                                      p.vendorCode.toLowerCase().includes(searchLower) || 
                                      p.title.toLowerCase().includes(searchLower) ||
                                      String(p.nmID || '').toLowerCase().includes(searchLower);
                                  const matchesBrand = !selectedBrand || p.brand === selectedBrand || p.characteristics?.find(c => c.name === 'Бренд')?.value === selectedBrand;
                                  const matchesCategory = !selectedCategory || (p as any).subjectName === selectedCategory;
                                  const hasFilledCard = sortSizes(p.sizes).some((size) => Number(supplyOrderItems[`${p.nmID}_${size.techSize}`] || 0) > 0);
                                  const matchesFilledState = showFilledOrderCards ? hasFilledCard : true;
                                  
                                  return matchesSearch && matchesBrand && matchesCategory && matchesFilledState;
                              })
                              .map(product => (
                                  <tr key={product.nmID} className="border-b border-slate-100 hover:bg-indigo-50/30 transition-colors">
                                      <td className="p-3">
                                          <img
                                              src={product.photos?.[0]?.big || product.photos?.[0]?.tm || ''}
                                              alt={product.title}
                                              className="w-24 h-32 object-cover rounded-xl border border-slate-200 shadow-sm"
                                              loading="lazy"
                                          />
                                      </td>
                                      <td className="p-3">
                                          <div className="font-semibold text-slate-900">{product.vendorCode}</div>
                                          <div className="text-xs text-slate-500 mb-1">{product.brand}</div>
                                          <div className="text-xs text-slate-600 line-clamp-2" title={product.title}>{product.title}</div>
                                      </td>
                                      <td className="p-3">
                                          <div className="flex flex-wrap gap-1.5">
                                              {sortSizes(product.sizes).map((size, idx) => (
                                                  <div key={idx} className={`flex flex-col items-center rounded-xl px-2 py-1 min-w-[3.25rem] border ${size.stock ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                                                      <span className="font-bold text-xs text-slate-700">{size.techSize}</span>
                                                      <span className={`text-[10px] ${size.stock ? 'text-emerald-700 font-bold' : 'text-slate-400'}`} title={`По размеру: ${size.stock || 0} • Всего по товару: ${(size as any).totalStock || 0}`}>
                                                          {size.stock || 0} / {(size as any).totalStock || 0}
                                                      </span>
                                                  </div>
                                              ))}
                                          </div>
                                      </td>
                                      <td className="p-3">
                                          <button
                                              onClick={() => openProductOrdersChart(product)}
                                              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-indigo-200 text-indigo-700 hover:bg-indigo-50 bg-white transition-colors active:scale-95"
                                          >
                                              <Calendar className="w-3.5 h-3.5" /> График
                                          </button>
                                      </td>
                                      <td className="p-3">
                                          <div className="flex flex-col gap-2">
                                              {sortSizes(product.sizes).map((size, idx) => {
                                                  const key = `${product.nmID}_${size.techSize}`;
                                                  const qty = supplyOrderItems[key] || 0;
                                                  
                                                  return (
                                                      <div key={idx} className="flex items-center justify-between gap-2 text-xs">
                                                          <span className={`w-8 font-semibold ${qty > 0 ? 'text-indigo-700' : 'text-slate-500'}`}>{size.techSize}:</span>
                                                          <div className={`inline-flex items-center gap-0.5 rounded-full p-0.5 ${qty > 0 ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                                                              <button
                                                                  onClick={() => handleSupplyOrderQuantityChange(product.nmID, size.techSize, qty - 1)}
                                                                  className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition hover:text-rose-600 active:scale-90"
                                                              >
                                                                  −
                                                              </button>
                                                              <input
                                                                  type="text"
                                                                  value={qty || ''}
                                                                  onChange={(e) => {
                                                                      const val = parseInt(e.target.value) || 0;
                                                                      handleSupplyOrderQuantityChange(product.nmID, size.techSize, val);
                                                                  }}
                                                                  className="w-8 bg-transparent text-center font-semibold text-slate-900 focus:outline-none"
                                                                  placeholder="0"
                                                              />
                                                              <button
                                                                  onClick={() => handleSupplyOrderQuantityChange(product.nmID, size.techSize, qty + 1)}
                                                                  className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition hover:text-indigo-600 active:scale-90"
                                                              >
                                                                  +
                                                              </button>
                                                          </div>
                                                      </div>
                                                  );
                                              })}
                                          </div>
                                      </td>
                                  </tr>
                              ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* Product Orders Chart Modal */}
      {productChartModal.open && productChartModal.product && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-[96vw] max-w-[1800px] max-h-[94vh] overflow-auto p-4 md:p-7">
            <div className="flex items-start justify-between mb-4 gap-3">
              <div>
                <h3 className="text-lg font-bold">График заказов товара</h3>
                <div className="text-sm text-slate-600">{productChartModal.product.vendorCode} • {productChartModal.product.title}</div>
              </div>
              <button onClick={() => setProductChartModal({ open: false, product: null })} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              <div>
                <label className="text-xs text-slate-500">С</label>
                <input
                  type="date"
                  value={productChartRange.start}
                  onChange={(e) => setProductChartRange((prev) => ({ ...prev, start: e.target.value }))}
                  className="w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">По</label>
                <input
                  type="date"
                  value={productChartRange.end}
                  onChange={(e) => setProductChartRange((prev) => ({ ...prev, end: e.target.value }))}
                  className="w-full border rounded p-2"
                />
              </div>
              <div className="md:col-span-2 flex items-end">
                <button
                  onClick={async () => {
                    setLoadingProductChart(true);
                    try {
                      await fetchProductOrdersChart(productChartModal.product!, productChartRange.start, productChartRange.end);
                    } catch (e: any) {
                      setError(`Ошибка загрузки графика: ${e?.message || 'Failed to fetch'}`);
                      setProductChartData([]);
                    } finally {
                      setLoadingProductChart(false);
                    }
                  }}
                  className="w-full md:w-auto px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Обновить график
                </button>
              </div>
            </div>

            <div className="border rounded-lg p-3 bg-slate-50">
              {loadingProductChart ? (
                <div className="h-[520px] flex items-center justify-center text-slate-500 text-lg">Загрузка...</div>
              ) : productChartData.length === 0 ? (
                <div className="h-[520px] flex items-center justify-center text-slate-500 text-lg">Нет данных за выбранный период</div>
              ) : (() => {
                const max = Math.max(1, ...productChartData.map((d) => d.qty));
                const w = 1400;
                const h = 520;
                const pad = 48;
                const stepX = productChartData.length > 1 ? (w - pad * 2) / (productChartData.length - 1) : 0;
                const total = productChartData.reduce((s, d) => s + d.qty, 0);

                const productSizes = (productChartModal.product?.sizes || [])
                  .map((s: any) => String(s?.techSize || s?.wbSize || '').trim())
                  .filter(Boolean);

                const sizeNames = Array.from(new Set([
                  ...productSizes,
                  ...productChartData.flatMap((d) => Object.keys(d.bySize || {})),
                ])).filter(Boolean).sort(compareSizeStrings);

                const visibleSizeNames = sizeNames.filter((s) => !hiddenChartSizes.includes(s));

                const palette = ['#4F46E5', '#059669', '#DC2626', '#D97706', '#0891B2', '#7C3AED', '#BE123C', '#334155'];

                return (
                  <div>
                    <div className="text-lg mb-3">Итого заказов за период: <span className="font-bold">{total}</span></div>
                    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[560px] bg-white rounded border">
                      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#CBD5E1" />
                      <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#CBD5E1" />

                      {/* Y axis labels (quantity) */}
                      {[0, 0.25, 0.5, 0.75, 1].map((k) => {
                        const value = Math.round(max * k);
                        const y = h - pad - k * (h - pad * 2);
                        return (
                          <g key={`y-${k}`}>
                            <line x1={pad - 4} y1={y} x2={pad} y2={y} stroke="#94A3B8" />
                            <text x={pad - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#64748B">
                              {value}
                            </text>
                          </g>
                        );
                      })}

                      {/* X axis labels (date) */}
                      {productChartData.map((d, i) => {
                        const labelStep = Math.max(1, Math.ceil(productChartData.length / 10));
                        if (i % labelStep !== 0 && i !== productChartData.length - 1) return null;
                        const x = pad + i * stepX;
                        const dateLabel = new Date(`${d.date}T00:00:00`).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
                        return (
                          <text key={`x-${d.date}-${i}`} x={x} y={h - pad + 14} textAnchor="middle" fontSize="10" fill="#64748B">
                            {dateLabel}
                          </text>
                        );
                      })}

                      {/* Total line */}
                      <polyline
                        fill="none"
                        stroke="#111827"
                        strokeWidth="3"
                        points={productChartData.map((d, i) => {
                          const x = pad + i * stepX;
                          const y = h - pad - (d.qty / max) * (h - pad * 2);
                          return `${x},${y}`;
                        }).join(' ')}
                      />
                      {productChartData.map((d, i) => {
                        const x = pad + i * stepX;
                        const y = h - pad - (d.qty / max) * (h - pad * 2);
                        return (
                          <g key={`total-${d.date}-${i}`}>
                            <circle cx={x} cy={y} r="4.2" fill="#111827" />
                            <circle cx={x} cy={y} r="13" fill="transparent">
                              <title>{`${new Date(`${d.date}T00:00:00`).toLocaleDateString('ru-RU')} • Итого: ${d.qty} шт.`}</title>
                            </circle>
                          </g>
                        );
                      })}

                      {/* Size lines */}
                      {visibleSizeNames.map((sizeName, sizeIdx) => {
                        const color = palette[sizeIdx % palette.length];
                        const points = productChartData.map((d, i) => {
                          const x = pad + i * stepX;
                          const val = d.bySize?.[sizeName] || 0;
                          const y = h - pad - (val / max) * (h - pad * 2);
                          return `${x},${y}`;
                        }).join(' ');

                        return (
                          <g key={sizeName}>
                            <polyline fill="none" stroke={color} strokeWidth="2.6" points={points} />
                            {productChartData.map((d, i) => {
                              const x = pad + i * stepX;
                              const val = d.bySize?.[sizeName] || 0;
                              const y = h - pad - (val / max) * (h - pad * 2);
                              return (
                                <g key={`${sizeName}-${d.date}-${i}`}>
                                  <circle cx={x} cy={y} r="4" fill={color} />
                                  <circle cx={x} cy={y} r="12" fill="transparent">
                                    <title>{`${new Date(`${d.date}T00:00:00`).toLocaleDateString('ru-RU')} • Размер ${sizeName}: ${val} шт.`}</title>
                                  </circle>
                                </g>
                              );
                            })}
                          </g>
                        );
                      })}
                    </svg>

                    <div className="mt-3 flex flex-wrap gap-2 text-sm">
                      <span className="px-3 py-1.5 rounded bg-slate-100 text-slate-800 border">Итого — черный</span>
                      {sizeNames.map((s, i) => {
                        const hidden = hiddenChartSizes.includes(s);
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setHiddenChartSizes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
                            className={`px-3 py-1.5 rounded border transition ${hidden ? 'opacity-40 line-through bg-slate-50' : 'bg-white hover:bg-slate-50'}`}
                            style={{ color: palette[i % palette.length], borderColor: palette[i % palette.length] }}
                            title={hidden ? 'Показать линию размера' : 'Скрыть линию размера'}
                          >
                            Размер {s}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-3 max-h-80 overflow-auto text-sm text-slate-700 grid grid-cols-1 gap-2">
                      {productChartData.map((d) => (
                        <div key={d.date} className="border-b pb-1">
                          <b>{new Date(`${d.date}T00:00:00`).toLocaleDateString('ru-RU')}</b>: {d.qty} шт.
                          <span className="ml-2 text-slate-500">
                            {sizeNames
                              .filter((sz) => !hiddenChartSizes.includes(sz))
                              .map((sz) => `${sz}:${d.bySize?.[sz] || 0}`)
                              .join(' | ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Create Supply Modal */}
      {showCreateSupplyModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Новая поставка</h3>
            <input 
              type="text" 
              placeholder="Название поставки (например: Поставка 25.10)" 
              className="w-full border rounded-lg p-3 mb-4 focus:ring-2 focus:ring-purple-500 outline-none"
              value={newSupplyName}
              onChange={(e) => setNewSupplyName(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowCreateSupplyModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Отмена
              </button>
              <button 
                onClick={createSupply}
                disabled={!newSupplyName || loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Создание...' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};








