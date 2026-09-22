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
  Upload,
  Database,
  ShieldCheck
} from 'lucide-react';
/*
 * jsPDF, autoTable, bwip-js и ExcelJS — только по требованию (dashboardLazyLibs).
 * Статический импорт заставлял браузер при каждом открытии раздела ФБС тянуть
 * 2,2 МБ библиотек печати, даже если сегодня только сканируют. html2canvas и
 * jsbarcode были импортированы, но нигде не использовались.
 */
import { ensureBwip, ensureExcel, ensurePdfLibs, lazyLibs } from '../pages/dashboardLazyLibs';
import { supabase } from '../lib/supabase';
import {
  GS_SEPARATOR,
  encodeGsForExcel,
  fixCyrillicKeyboardLayout,
  normalizeDataMatrixText,
  normalizeScanStickerText,
  restoreDataMatrixGs,
} from '../utils/honestSign';
import { explainWbAccess, hasWbScope } from '../utils/wbTokenScopes';
import { buildStickersPdf, fetchStickers, renderStickerImage } from '../utils/stickers';
import { printImagesDirect, printPdfDirect } from '../utils/printDirect';
import FbsChzStockPanel, { notifyChzStockChanged } from './FbsChzStockPanel';
import type { StickerImage } from '../utils/stickers';
import { getWBImageUrl, getWBImageUrls } from '../utils/wbImages';
import {
  DEFAULT_CHZ_LABEL_LAYOUT,
  DEFAULT_CHZ_TAIL_LAYOUT,
  DEFAULT_FBS_COMBO_LAYOUT,
  drawChzLabel,
  drawChzTailLabel,
  drawFbsComboLabel,
  matchChzCodeForProduct,
  normalizeHsCategoryName,
  normalizeHsSize,
  readChzLabelLayout,
  readChzTailLayout,
  readFbsComboLayout,
} from '../utils/chzLabel';
import type { ChzLabelLayout, ChzTailLayout, FbsComboLayout } from '../utils/chzLabel';
import { pgInList } from '../utils/pgFilters';
import {
  deleteFbsOrderCode,
  fetchFbsSupplyScans,
  findFbsOrderByCode,
  logFbsScanReject,
  upsertFbsOrderCode,
} from '../utils/fbsOrderCodes';
import {
  describeSgtinDecision,
  fetchOrdersSgtin,
  removeOrderSgtins,
  sameChzCode,
  sendOrderSgtins,
} from '../utils/wbOrderMeta';
import {
  createSupplyBoxes,
  deleteSupplyBoxes,
  fetchSupplyBoxStickers,
  listSupplyBoxes,
  maxBoxesForOrders,
} from '../utils/wbSupplyBoxes';

/*
 * Подразделы грузятся отдельными чанками.
 *
 * «База заказов» и «Вывод ЧЗ» — большие самостоятельные экраны, но лежали в
 * одном бандле с управлением ФБС и приезжали к каждому, кто просто открыл
 * поставки. Теперь за них платит только тот, кто в них зашёл.
 */
const FbsOrdersDatabase = React.lazy(() =>
  import('./FbsOrdersDatabase').then((m) => ({ default: m.FbsOrdersDatabase })),
);
const ChzWithdrawal = React.lazy(() =>
  import('./ChzWithdrawal').then((m) => ({ default: m.ChzWithdrawal })),
);

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
  /**
   * Код номенклатуры WB. Нужен ради фото: карточки в wb_products_cache есть не
   * у всех товаров, а по nmID адрес картинки на CDN вычисляется всегда.
   * У строк из Excel-файла поставки его нет — там останется пусто.
   */
  nmId?: number;
  stickerDigits: string;
  stickerText: string;
  stickerScanText: string;
}

/**
 * Какой макет печатать из окна скана.
 *
 *  - `chz`      — «ШК + ЧЗ», как раньше;
 *  - `chz_tail` — то же плюс крупный конец номера стикера, чтобы задание
 *                 находили глазами;
 *  - `combo`    — стикер задания и марка на одном поле: рисуем сами из данных
 *                 WB, без картинки-оригинала.
 */
type FbsLabelKind = 'chz' | 'chz_tail' | 'combo';

const FBS_LABEL_KIND_TITLES: Record<FbsLabelKind, string> = {
  chz: 'ШК + ЧЗ',
  chz_tail: 'ШК + ЧЗ + конец стикера',
  combo: 'Совмещённая: стикер + ЧЗ',
};

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

// Адреса фото WB живут в src/utils/wbImages.ts — их использует и «База заказов».

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

/*
 * Функции Честного знака живут в src/utils/honestSign.ts: тем же кодом
 * сканирует раздел «Поиск ФБС». Две копии разъехались бы на первой правке.
 */
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

/**
 * Фото с перебором адресов.
 *
 * Первый кандидат — кэш карточек, дальше идут ссылки на CDN Wildberries.
 * Номер «корзины» CDN вычисляется по диапазону nmID и иногда промахивается на
 * соседнюю, поэтому на ошибке загрузки берём следующий адрес, а не показываем
 * пустую рамку.
 */
const FbsPhoto = ({
  urls,
  className,
  emptyClassName,
}: {
  urls: string[];
  className: string;
  emptyClassName: string;
}) => {
  const [index, setIndex] = useState(0);
  const key = urls.join('|');

  useEffect(() => {
    setIndex(0);
  }, [key]);

  const src = urls[index];
  if (!src) return <div className={emptyClassName} />;

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      className={className}
      onError={() => setIndex((i) => i + 1)}
    />
  );
};

type FbsCueKind = 'sticker' | 'chz' | 'ready' | 'error';

/**
 * Сигналы шагов сканирования.
 *
 * Восходящие ноты означают «дальше», нисходящие — «стоп»; такой набор
 * различается на слух в шуме склада, где отдельный писк теряется.
 * «Готово» не дублируется голосом: фраза перебила бы инструкцию к следующему
 * товару, а на этом месте нужно короткое «принято».
 */
const FBS_CUES: Record<
  FbsCueKind,
  {
    /** Записанный голос — основной звук. */
    sound: string;
    /** Запасной вариант, если файл не проигрался: тон плюс синтезированная речь. */
    notes: ReadonlyArray<{ freq: number; ms: number; at: number }>;
    volume: number;
    phrase?: string;
  }
> = {
  sticker: {
    sound: '/sounds/scan-sticker.mp3',
    notes: [{ freq: 587, ms: 90, at: 0 }],
    volume: 0.22,
    phrase: 'Сканируйте стикер',
  },
  chz: {
    sound: '/sounds/scan-chz.mp3',
    notes: [
      { freq: 523, ms: 80, at: 0 },
      { freq: 784, ms: 110, at: 90 },
    ],
    volume: 0.22,
    phrase: 'Сканируйте честный знак',
  },
  ready: {
    sound: '/sounds/scanned.mp3',
    // Мажорное трезвучие — узнаваемое «готово», как на кассе.
    notes: [
      { freq: 659, ms: 70, at: 0 },
      { freq: 880, ms: 70, at: 75 },
      { freq: 1175, ms: 150, at: 150 },
    ],
    volume: 0.2,
    phrase: 'Товар отсканирован',
  },
  error: {
    sound: '/sounds/error.mp3',
    notes: [
      { freq: 320, ms: 150, at: 0 },
      { freq: 200, ms: 260, at: 150 },
    ],
    volume: 0.28,
    phrase: 'Ошибка, неправильное сканирование',
  },
};

/**
 * Ниже этой длины строка маркой быть не может.
 *
 * Настоящий ЧЗ — DataMatrix на 80+ символов. Порог берём с запасом: он должен
 * отсекать стикер WB (9 символов) и штрихкод товара (13), но не спорить с
 * форматами марок, которых мы не видели.
 */
const MIN_HONEST_SIGN_LENGTH = 20;

type WBSupplyManagerTab = 'fbs' | 'orders_db' | 'chz_withdrawal' | 'supply_order' | 'fbs_calc' | 'fbs_orders' | 'fbo_acceptance';

export const WBSupplyManager = ({
  suppliers = [],
  initialTab = 'fbs',
  embeddedTab,
  sectionActive = true,
  scanCaptureAllowed = true,
  onScanWindowChange,
}: {
  suppliers?: Supplier[];
  initialTab?: WBSupplyManagerTab;
  embeddedTab?: WBSupplyManagerTab;
  /** Раздел ФБС сейчас на экране. false — открыт другой раздел, а ФБС держится в памяти ради плашки скана. */
  sectionActive?: boolean;
  /** Можно ли плашке перехватывать сканер без щелчка в её поле (в разделах со своим сканером — нет). */
  scanCaptureAllowed?: boolean;
  /** Сообщает Dashboard, открыто ли окно скана: пока открыто, раздел не выгружается. */
  onScanWindowChange?: (open: boolean) => void;
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
  const [selectedSupplierIdOrdersDb, setSelectedSupplierIdOrdersDb] = useState<string>('');
  const [selectedSupplierIdSupplyOrder, setSelectedSupplierIdSupplyOrder] = useState<string>('');
  const [selectedSupplierIdCalc, setSelectedSupplierIdCalc] = useState<string>('');
  const [selectedSupplierIdFbsOrders, setSelectedSupplierIdFbsOrders] = useState<string>('');
  const [selectedSupplierIdFboAcceptance, setSelectedSupplierIdFboAcceptance] = useState<string>('');
  const selectedSupplierId = activeTab === 'fbs'
    ? selectedSupplierIdFbs
    : activeTab === 'orders_db' || activeTab === 'chz_withdrawal'
    ? selectedSupplierIdOrdersDb
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
  /*
   * Окно скана свёрнуто в плашку в углу.
   *
   * Поставка, сканы, фильтр и выбор при этом живут дальше — это состояние
   * компонента, а не окна, — и развернуть его можно мгновенно, без повторной
   * загрузки из WB. Сканер в свёрнутом виде тоже работает.
   */
  const [fbsScanMinimized, setFbsScanMinimized] = useState(false);
  // Поставка, для которой открыто окно скана (см. защиту ниже).
  const fbsScanSupplyIdRef = useRef<string | null>(null);

  // Перехват сканера читается из обработчика клавиш — через ref, без переподписки.
  const scanCaptureAllowedRef = useRef(scanCaptureAllowed);
  useEffect(() => { scanCaptureAllowedRef.current = scanCaptureAllowed; }, [scanCaptureAllowed]);

  /*
   * Окно скана открыто — Dashboard держит раздел ФБС в памяти и в других
   * разделах, чтобы свёрнутая плашка жила там же.
   */
  useEffect(() => {
    onScanWindowChange?.(fbsScanModalOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fbsScanModalOpen]);
  useEffect(() => () => onScanWindowChange?.(false), []); // eslint-disable-line react-hooks/exhaustive-deps

  /*
   * Ушли в другой раздел с развёрнутым окном — сворачиваем, а не закрываем.
   *
   * Только в момент ухода: раньше проверка срабатывала постоянно, и развернуть
   * плашку в другом разделе было нельзя — окно тут же сворачивалось обратно.
   */
  const prevSectionActiveRef = useRef(sectionActive);
  useEffect(() => {
    const left = prevSectionActiveRef.current && !sectionActive;
    prevSectionActiveRef.current = sectionActive;
    if (left && fbsScanModalOpen && !fbsScanMinimized) setFbsScanMinimized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionActive]);

  // Свёрнуто ли окно — для обработчика клавиш, без переподписки.
  const fbsScanMinimizedRef = useRef(fbsScanMinimized);
  useEffect(() => { fbsScanMinimizedRef.current = fbsScanMinimized; }, [fbsScanMinimized]);

  // Поставщик, под которым открыт скан (см. защиту в closeFbsScanModal).
  const fbsScanSupplierIdRef = useRef<string | null>(null);
  // Для какой поставки загружены строки скана.
  const fbsScanRowsSupplyRef = useRef<string | null>(null);
  /*
   * Окно «Грузоместа» поставки на ПВЗ.
   *
   * ordersCount — сколько заданий в поставке: WB разрешает грузомест не
   * больше половины. null — ещё считаем, подсказку не показываем.
   */
  const [boxesModal, setBoxesModal] = useState<{
    supplyId: string;
    ids: string[];
    ordersCount: number | null;
    busy: '' | 'load' | 'create' | 'print' | 'delete';
    error: string;
    info: string;
  } | null>(null);
  const [boxesAmount, setBoxesAmount] = useState('1');
  const [fbsScanLoading, setFbsScanLoading] = useState(false);
  /*
   * «Обновить» в окне скана — фоном. Раньше кнопка включала общий режим
   * загрузки, и таблица на всё время ожидания пропадала. Теперь на экране
   * остаются прежние данные, сканировать можно, а новые подменяют таблицу,
   * только когда загрузились и если что-то изменилось.
   */
  const [fbsScanRefreshing, setFbsScanRefreshing] = useState(false);
  const [fbsScanRows, setFbsScanRows] = useState<FbsSupplyScanOrderRow[]>([]);
  const [fbsScansBySticker, setFbsScansBySticker] = useState<Record<string, FbsSupplyScanSavedItem>>({});
  const [fbsScanMode, setFbsScanMode] = useState<'sticker' | 'honest_sign'>('sticker');
  // Отказ «код уже отсканирован» с предложением записать его повторно:
  // возврат и переотправка — обычное дело, а раньше вещь было не отгрузить.
  const [fbsScanOverride, setFbsScanOverride] = useState<{ row: FbsSupplyScanOrderRow; code: string; where: string } | null>(null);
  const [fbsScanOverrideBusy, setFbsScanOverrideBusy] = useState(false);
  // Висит, пока раскладку не переключат: одно исчезающее сообщение сборщик
  // пролистает следующим сканом и продолжит работать «через кириллицу».
  const [fbsLayoutHint, setFbsLayoutHint] = useState(false);
  const [fbsScanInputValue, setFbsScanInputValue] = useState('');
  const [fbsPendingStickerRow, setFbsPendingStickerRow] = useState<FbsSupplyScanOrderRow | null>(null);
  const [fbsScanNotice, setFbsScanNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const fbsScanInputRef = useRef<HTMLInputElement | null>(null);
  // Очередь фоновой записи сканов: сериализует upsert карты, чтобы быстрые сканы не перетирали друг друга.
  const fbsScanSaveQueueRef = useRef<Promise<any>>(Promise.resolve());
  // Актуальная карта сканов для фоновой записи.
  //
  // Состояние React для этого не годится: в замыкании обработчика лежит карта
  // на момент рендера, а сканер вводит код и Enter мгновенно. Два быстрых
  // скана попадали в один рендер, второй строил карту без первого — и запись
  // затирала предыдущий ЧЗ, хотя в интерфейсе он оставался зелёным.
  const fbsScansRef = useRef<Record<string, FbsSupplyScanSavedItem>>({});
  /*
   * Отложенная запись снапшота поставки.
   *
   * Снапшот пишется целиком: на поставке в четыре сотни заданий это полтораста
   * килобайт на каждый скан, то есть десятки мегабайт за смену и круговой рейс
   * в сеть перед каждым следующим товаром. Держим его пачкой — а durable-запись
   * на скан делает строка в fbs_order_codes, она маленькая и уходит сразу.
   * Всё, что не успело попасть в снапшот, возвращается из строк при открытии.
   */
  const fbsScanFlushRef = useRef<{
    timer: ReturnType<typeof setTimeout> | null;
    supplyId: string;
    supplierId: string;
    dirty: boolean;
  }>({ timer: null, supplyId: '', supplierId: '', dirty: false });
  // Строки, чья запись ещё идёт или уже провалилась: без этого «ЧЗ сохранён»
  // загорается до подтверждения от базы.
  const [fbsScanSavingKeys, setFbsScanSavingKeys] = useState<Record<string, true>>({});
  const [fbsScanFailedKeys, setFbsScanFailedKeys] = useState<Record<string, string>>({});
  // Что показывать в листе: всё, только несобранное или только собранное.
  const [fbsScanFilter, setFbsScanFilter] = useState<'all' | 'pending' | 'done' | 'wb_error' | 'wb_missing'>('all');
  /*
   * Сколько строк рисуем.
   *
   * В поставке до четырёхсот заданий, и у каждой строки своё фото — целиком
   * такая таблица кладёт окно на каждом нажатии клавиши. Показываем сотню и
   * добираем по кнопке: сборщик работает сверху вниз и до конца списка
   * доходит редко. На выбор и печать ограничение не влияет — они берут весь
   * список по фильтру.
   */
  const FBS_SCAN_PAGE_SIZE = 100;
  const [fbsScanRenderLimit, setFbsScanRenderLimit] = useState(FBS_SCAN_PAGE_SIZE);
  /*
   * «ЧЗ из базы» при печати стикеров.
   *
   * Код подбирается по категории, полу и размеру, печатается на этикетке и сразу
   * прикрепляется к заданию. Галочка запоминается на рабочем месте.
   */
  /**
   * Отчёт после печати стикеров: какие задания остались без ЧЗ и почему.
   * Показывается окном, а не строкой ошибки: список нужен, пока его разбирают.
   */
  const [chzPrintReport, setChzPrintReport] = useState<null | {
    supplyId: string;
    supplyName: string;
    printed: number;
    withChz: number;
    newChz: number;
    onlyMissing: boolean;
    statusChecked: boolean;
    rows: Array<{
      orderId: string;
      nmId: string;
      sticker: string;
      article: string;
      size: string;
      kind: 'canceled' | 'no_sticker' | 'no_code' | 'no_card' | 'claim_lost';
      reason: string;
      needGender?: boolean;
    }>;
  }>(null);
  /** Пол, выбранный в отчёте печати: nmId → пол либо 'busy' на время записи. */
  const [chzGenderPick, setChzGenderPick] = useState<Record<string, 'male' | 'female' | 'busy'>>({});
  /** Склады отгрузки кабинета — из них берутся названия поставок при сборке. */
  const [wbWarehouses, setWbWarehouses] = useState<Array<{ id: number; name: string }>>([]);
  /*
   * Сборка поставок по складам отгрузки.
   *
   * Задание уезжает с конкретного склада продавца, и в одну поставку WB можно
   * класть только задания одного склада. Раньше поставку на каждый склад
   * создавали руками и руками же разносили задания. Здесь сначала показываем
   * план (склад, сколько заданий, как назовём поставку), а создаём после «да».
   */
  const [assemblePlan, setAssemblePlan] = useState<null | {
    busy: boolean;
    running: boolean;
    done: boolean;
    error?: string;
    groups: Array<{ warehouseId: number; warehouseName: string; orderIds: string[]; supplyName: string; status?: string }>;
  }>(null);

  /** Поставки, отмеченные галочкой, — для выгрузки листов и кодов подряд. */
  const [selectedSupplyIds, setSelectedSupplyIds] = useState<Set<string>>(new Set());
  /** Ход пакетной выгрузки: по какой поставке сейчас идём и что уже не вышло. */
  const [bulkExport, setBulkExport] = useState<null | {
    total: number;
    index: number;
    name: string;
    stage: string;
    errors: string[];
    done: boolean;
  }>(null);
  /*
   * План марок до печати.
   *
   * Печать сразу забирает коды из базы, и увидеть, чего не хватит, можно было
   * только по факту — на уже наклеенных этикетках. Теперь сначала показываем,
   * какому товару какая марка достанется и сколько их в базе, и только потом
   * печатаем. Коды при этом не трогаются: план — чтение, не выдача.
   */
  const [chzPlan, setChzPlan] = useState<null | {
    supplyId: string;
    supplyName: string;
    busy: boolean;
    error?: string;
    total: number;
    alreadyWithChz: number;
    canceled: number;
    statusChecked: boolean;
    groups: Array<{ key: string; category: string; gender: 'male' | 'female'; orders: number; matched: number; freeTotal: number }>;
    noGender: Array<{ nmId: string; article: string; subject: string; count: number }>;
    noCard: Array<{ nmId: string; article: string; count: number }>;
  }>(null);
  const [fbsStickersWithChz, setFbsStickersWithChzState] = useState<boolean>(() => {
    try { return localStorage.getItem('fbs_stickers_with_chz_v1') === '1'; } catch { return false; }
  });
  const setFbsStickersWithChz = (next: boolean) => {
    setFbsStickersWithChzState(next);
    try { localStorage.setItem('fbs_stickers_with_chz_v1', next ? '1' : '0'); } catch { /* приватный режим */ }
  };
  /*
   * Высота панели фильтров — под неё подставляется шапка таблицы.
   *
   * Обе прилипают к верху одного и того же контейнера, и без смещения шапка
   * уезжала под фильтры: на середине списка от неё оставалась половина строки.
   * Считаем высоту живьём, потому что на узком экране кнопки переносятся на
   * вторую строку, и любое зашитое число оказалось бы неверным.
   */
  const fbsFilterBarRef = useRef<HTMLDivElement | null>(null);
  const [fbsFilterBarHeight, setFbsFilterBarHeight] = useState(0);
  // Номер задания, для которого сейчас тянем стикер (потерянный переклеивают).
  const [fbsStickerPrintingId, setFbsStickerPrintingId] = useState<string>('');
  // То же для этикетки ЧЗ: печатается по одной строке из таблицы.
  const [fbsChzPrintingKey, setFbsChzPrintingKey] = useState<string>('');
  /*
   * Марка ЧЗ у WB по номеру задания: что мы отправили и что WB о ней думает.
   *
   * phase: sending — запрос в пути; sent — WB принял, проверка ещё не читалась;
   * wb — прочитано из WB (value + decision); error — WB отказал, message — почему.
   */
  const [fbsWbSgtin, setFbsWbSgtin] = useState<Record<string, {
    phase: 'sending' | 'sent' | 'wb' | 'error';
    value?: string;
    decision?: string;
    message?: string;
  }>>({});
  const [fbsWbSgtinBusy, setFbsWbSgtinBusy] = useState<'' | 'refresh' | 'push'>('');
  /*
   * Отправлять марку в WB сразу после скана.
   *
   * Включено по умолчанию, выключается на рабочем месте: ключ с правом записи
   * есть не у каждого кабинета, и там, где его нет, каждая строка краснела бы
   * отказом WB. Храним локально — у склада свой ПК.
   */
  const [fbsWbAutoSend, setFbsWbAutoSend] = useState<boolean>(() => {
    try {
      return localStorage.getItem('fbs_wb_sgtin_autosend_v1') !== '0';
    } catch {
      return true;
    }
  });
  // Отправка из фоновой очереди скана читает флаг через ref: замыкание устаревает.
  const fbsWbAutoSendRef = useRef(fbsWbAutoSend);
  useEffect(() => { fbsWbAutoSendRef.current = fbsWbAutoSend; }, [fbsWbAutoSend]);
  const fbsWbSgtinQueueRef = useRef<Promise<unknown>>(Promise.resolve());
  const fbsWbRecheckRef = useRef<{ timer: ReturnType<typeof setTimeout> | null; ids: Set<string>; supplierId: string }>({
    timer: null,
    ids: new Set(),
    supplierId: '',
  });
  /*
   * Отмеченные строки для пакетной печати.
   *
   * Ключ — storageKey строки, он же ключ карты сканов: номер задания есть не у
   * всех строк (в файле поставки его может не быть), а storageKey есть всегда.
   */
  const [fbsScanSelection, setFbsScanSelection] = useState<Record<string, true>>({});
  const [fbsScanBulkBusy, setFbsScanBulkBusy] = useState(false);
  // Что кладём в пакет: стикер WB перед каждой этикеткой ЧЗ и лист подбора.
  const [fbsBulkWithStickers, setFbsBulkWithStickers] = useState(true);
  // Меню «Печать (N)»: стикеры, лист подбора или оба.
  const [fbsPrintMenuOpen, setFbsPrintMenuOpen] = useState(false);
  // Макет этикетки. Выбор запоминаем: на рабочем месте он один и тот же.
  const [fbsLabelKind, setFbsLabelKind] = useState<FbsLabelKind>(() => {
    try {
      const saved = localStorage.getItem('fbs_label_kind_v1');
      return saved === 'chz_tail' || saved === 'combo' ? saved : 'chz';
    } catch {
      return 'chz';
    }
  });
  // Голосовые подсказки шагов. Выбор запоминаем: на складе он свой у каждого ПК.
  const [fbsSoundOn, setFbsSoundOn] = useState<boolean>(() => {
    try {
      return localStorage.getItem('fbs_scan_sound_v1') !== '0';
    } catch {
      return true;
    }
  });

  /** Единственная точка правки карты сканов: ref и состояние не должны разъезжаться. */
  const applyFbsScans = (map: Record<string, FbsSupplyScanSavedItem>) => {
    fbsScansRef.current = map;
    setFbsScansBySticker(map);
  };

  /*
   * Звуковые подсказки на складе.
   *
   * Сборщик смотрит на товар и сканер, а не в экран, поэтому смену шага нужно
   * слышать. Короткий тон отличает шаги на слух даже в шуме, фраза говорит,
   * что именно сканировать. Отключается — в тихом помещении голос мешает.
   */
  const audioCtxRef = useRef<AudioContext | null>(null);

  /**
   * Короткий сигнал из нескольких нот.
   *
   * Одиночная синусоида звучит как писк неисправного прибора и теряется в шуме
   * склада. Треугольная волна богаче обертонами, поэтому слышна лучше на той же
   * громкости, а пара-тройка нот подряд читается как осмысленный сигнал:
   * восходящий — «дальше», нисходящий — «стоп».
   */
  const playChime = (notes: ReadonlyArray<{ freq: number; ms: number; at: number }>, volume = 0.22) => {
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ctx = audioCtxRef.current ?? new Ctx();
      audioCtxRef.current = ctx;
      if (ctx.state === 'suspended') void ctx.resume();

      for (const note of notes) {
        const start = ctx.currentTime + note.at / 1000;
        const end = start + note.ms / 1000;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.freq, start);

        // Резкий старт и обрыв дают щелчок: ведём громкость мягко.
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, end);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(end + 0.02);
      }
    } catch {
      /* без звука работать можно, падать из-за него нельзя */
    }
  };

  const speakRu = (text: string) => {
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;
      // Иначе фразы копятся в очереди и отстают от сканера на несколько шагов.
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ru-RU';
      utterance.rate = 1.15;
      synth.speak(utterance);
    } catch {
      /* голос есть не во всех браузерах */
    }
  };

  /*
   * Сигналы шагов.
   *
   * «Готов» звучит по подтверждению записи, а не по нажатию — до этого товар
   * ещё может отвалиться на дубле ЧЗ или отказе базы. Голосом он не
   * дублируется: фраза перебила бы инструкцию к следующему товару, а сборщику
   * на этом месте нужно короткое «принято».
   */
  /** Запасной путь: файл не загрузился или браузер отказался его играть. */
  const fbsCueFallback = (kind: FbsCueKind) => {
    playChime(FBS_CUES[kind].notes, FBS_CUES[kind].volume);
    const phrase = FBS_CUES[kind].phrase;
    if (phrase) speakRu(phrase);
  };

  const cueAudioRef = useRef<Partial<Record<FbsCueKind, HTMLAudioElement>>>({});
  const cuePlayingRef = useRef<HTMLAudioElement | null>(null);

  const fbsCue = (kind: FbsCueKind) => {
    if (!fbsSoundOn) return;
    try {
      let el = cueAudioRef.current[kind];
      if (!el) {
        el = new Audio(FBS_CUES[kind].sound);
        el.preload = 'auto';
        cueAudioRef.current[kind] = el;
      }

      // Предыдущую фразу обрываем: сканер работает быстрее, чем проигрывается
      // голос, и подсказки иначе наложились бы друг на друга.
      const playing = cuePlayingRef.current;
      if (playing && playing !== el) {
        try { playing.pause(); playing.currentTime = 0; } catch { /* уже остановлен */ }
      }

      el.currentTime = 0;
      cuePlayingRef.current = el;
      const started = el.play();
      if (started && typeof started.catch === 'function') {
        started.catch(() => fbsCueFallback(kind));
      }
    } catch {
      fbsCueFallback(kind);
    }
  };

  /**
   * Убрать одну строку из карты — при отказе базы или дубле ЧЗ.
   * Именно одну: возврат всей карты к состоянию «до скана» стирал соседние
   * коды, отсканированные, пока запись стояла в очереди.
   */
  const dropFbsScanEntry = (storageKey: string) => {
    const rest = { ...fbsScansRef.current };
    delete rest[storageKey];
    applyFbsScans(rest);
    setFbsScanSavingKeys((prev) => {
      const next = { ...prev };
      delete next[storageKey];
      return next;
    });
  };
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
  // Фото ещё и по артикулу продавца: в листе сканирования ФБС нет nmId —
  // строки приходят из Excel-файла поставки, где есть только артикул.
  const [calcPhotoByArticle, setCalcPhotoByArticle] = useState<Record<string, string>>({});

  /**
   * Для карты фото — одна ссылка на фото и артикул, а не карточка целиком:
   * у крупного кабинета это 2,3 МБ против сотни килобайт.
   */
  const PHOTO_MAP_SELECT = 'nm_id, photoBig:product_json->photos->0->>big, photoTm:product_json->photos->0->>tm, vendorCode:product_json->>vendorCode';

  /** Из строк wb_products_cache собираем обе карты фото за один проход. */
  const buildPhotoMaps = (cacheRows: any[]) => {
    const byNm: Record<string, string> = {};
    const byArticle: Record<string, string> = {};
    (cacheRows || []).forEach((r: any) => {
      // Строка — либо целая карточка, либо только поля из PHOTO_MAP_SELECT.
      const p = r?.product_json || r || {};
      const nm = String(r?.nm_id || p?.nmID || '').trim();
      const first = (Array.isArray(p?.photos) && p.photos[0]) || r?.photoBig || r?.photoTm || '';
      let src = typeof first === 'string' ? first : (first?.big || first?.tm || first?.c246x328 || '');
      src = String(src || '').trim();
      if (src.startsWith('//')) src = `https:${src}`;
      if (!/^https?:\/\//i.test(src)) return;
      if (nm) byNm[nm] = src;
      const vendorCode = String(p?.vendorCode || '').trim().toLowerCase();
      if (vendorCode) byArticle[vendorCode] = src;
    });
    return { byNm, byArticle };
  };

  /**
   * Откуда брать фото строки листа, по убыванию надёжности.
   *
   * Кэш карточек заполнен не для всех товаров — «ЖилетЧерныйЖнв» и
   * «Поло3а1кор» в нём просто отсутствуют, поэтому у них были пустые рамки.
   * Поэтому последним рубежом идёт CDN Wildberries: адрес картинки считается
   * из самого nmID и не зависит от того, синхронизировали карточки или нет.
   */
  const getFbsRowPhotoCandidates = (row: { article?: string; nmId?: string | number }) => {
    const nm = String(row?.nmId || '').trim();
    const article = String(row?.article || '').trim().toLowerCase();
    return getImageCandidates(
      (nm && calcPhotoByNmId[nm]) || (article && calcPhotoByArticle[article]) || '',
      Number(nm) > 0 ? Number(nm) : undefined,
    );
  };

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

  /*
   * Кабинеты для раздела ФБС — только с доступом к «Маркетплейсу».
   *
   * У «Постельки» токен без этой категории: заказы, поставки и стикеры WB ей
   * не отдаёт, и в выборе поставщика она только мешала. Кабинет без токена
   * (неразобранный) не прячем — решит сервер.
   */
  const fbsSuppliers = useMemo(
    () => suppliers.filter((s) => hasWbScope(String(s.wb_api_token || ''), 'marketplace')),
    [suppliers],
  );
  const fbsSupplierIds = useMemo(() => new Set(fbsSuppliers.map((s) => s.id)), [fbsSuppliers]);

  useEffect(() => {
    if (suppliers.length === 0) return;
    const first = (fbsSuppliers[0] || suppliers[0]).id;
    // Выбранный раньше кабинет без «Маркетплейса» — меняем на первый подходящий.
    const fix = (id: string) => !id || (id !== '__all__' && fbsSuppliers.length > 0 && !fbsSupplierIds.has(id));
    if (fix(selectedSupplierIdFbs)) setSelectedSupplierIdFbs(first);
    if (fix(selectedSupplierIdOrdersDb)) setSelectedSupplierIdOrdersDb(first);
    if (!selectedSupplierIdSupplyOrder) setSelectedSupplierIdSupplyOrder(suppliers[0].id);
    if (fix(selectedSupplierIdCalc)) setSelectedSupplierIdCalc(first);
    if (!selectedSupplierIdFbsOrders) setSelectedSupplierIdFbsOrders('__all__');
    if (!selectedSupplierIdFboAcceptance) setSelectedSupplierIdFboAcceptance('__all__');
  }, [suppliers, fbsSuppliers, fbsSupplierIds, selectedSupplierIdFbs, selectedSupplierIdOrdersDb, selectedSupplierIdSupplyOrder, selectedSupplierIdCalc, selectedSupplierIdFbsOrders, selectedSupplierIdFboAcceptance]);

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
          .select(PHOTO_MAP_SELECT)
          .eq('supplier_id', selectedSupplierId)
          .limit(10000);

        const { byNm, byArticle } = buildPhotoMaps(cacheRows || []);
        setCalcPhotoByNmId(byNm);
        setCalcPhotoByArticle(byArticle);
      } catch {
        setCalcPhotoByNmId({});
        setCalcPhotoByArticle({});
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
    // Тяжёлая (до 4 МБ) — грузим, только когда открыта вкладка «Заказ поставки».
    if (activeTab !== 'supply_order') return;
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
  }, [selectedSupplierId, activeTab]);

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

  /*
   * Держим высоту панели фильтров в состоянии.
   *
   * Панель переносится на две строки, когда окно узкое, и меняет высоту при
   * смене подписи кнопки звука. Наблюдатель ловит это сам — иначе шапка
   * таблицы прилипала бы не на своём месте до следующей перерисовки.
   */
  useEffect(() => {
    const node = fbsFilterBarRef.current;
    if (!node) {
      setFbsFilterBarHeight(0);
      return undefined;
    }

    const measure = () => setFbsFilterBarHeight(node.offsetHeight);
    measure();

    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [fbsScanModalOpen, fbsScanLoading, fbsScanRows.length, fbsSoundOn, fbsScanMinimized]);

  useEffect(() => {
    if (!fbsScanModalOpen || fbsScanLoading) return;
    // В разделе со своим сканером фокус не забираем, пока окно свёрнуто.
    if (!scanCaptureAllowed && fbsScanMinimized) return;
    const timer = setTimeout(() => {
      try {
        fbsScanInputRef.current?.focus({ preventScroll: true });
      } catch {
        fbsScanInputRef.current?.focus();
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [fbsScanModalOpen, fbsScanLoading, fbsScanMode, fbsPendingStickerRow, fbsScanMinimized, scanCaptureAllowed]);

  /*
   * Сканер работает при любом фокусе, пока открыто окно «Скан ЧЗ».
   *
   * Сканер — это клавиатура: символы уходят туда, где стоит курсор. Стоило
   * нажать галочку, вкладку фильтра или кнопку печати — поле скана теряло
   * фокус, и следующий скан пропадал, пока сборщик не щёлкнет в поле мышью.
   *
   * Теперь нажатие любой печатной клавиши вне поля переводит фокус в поле
   * скана, а сам первый символ дописывается вручную: событие уже ушло не
   * туда, и без этого код потерял бы первую букву. Остальные символы сканер
   * доставит в поле сам. Enter вне поля отправляет то, что уже набрано.
   *
   * Не перехватываем, если человек печатает в другом поле (количество
   * грузомест и т. п.), если открыто окно поверх или зажат Ctrl/Alt — это
   * сочетания клавиш, а не скан.
   */
  useEffect(() => {
    if (!fbsScanModalOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const input = fbsScanInputRef.current;
      if (!input || input.disabled) return;
      if (e.defaultPrevented || e.ctrlKey || e.altKey || e.metaKey) return;
      if (boxesModal) return;
      // В разделе со своим сканером (сборка ФБО, поиск ФБС) коды нужны ему —
      // пока окно свёрнуто. Развёрнутое окно закрывает раздел, и сканер его.
      if (!scanCaptureAllowedRef.current && fbsScanMinimizedRef.current) return;

      const target = e.target as HTMLElement | null;
      if (target === input) return;
      const tag = String(target?.tagName || '').toLowerCase();
      const editable = tag === 'textarea'
        || tag === 'select'
        || Boolean(target?.isContentEditable)
        || (tag === 'input' && !['checkbox', 'radio', 'button', 'submit', 'reset', 'file'].includes(String((target as HTMLInputElement).type || '').toLowerCase()));
      if (editable) return;

      if (e.key === 'Enter') {
        if (!String(input.value || '').trim()) return;
        e.preventDefault();
        input.form?.requestSubmit();
        return;
      }

      // Только печатный символ: стрелки, Tab, F5 и прочее оставляем странице.
      if (e.key.length !== 1) return;

      e.preventDefault();
      try {
        input.focus({ preventScroll: true });
      } catch {
        input.focus();
      }
      input.value = `${input.value || ''}${e.key}`;
      // Уведомляем обработчик ввода: он же отправляет скан, если сканер не шлёт Enter.
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [fbsScanModalOpen, boxesModal]);

  // --- API Helpers ---

  const getSupplierToken = () => selectedSupplier?.wb_api_token?.trim();

  const wbFetch = async (url: string, options: RequestInit = {}) => {
    const token = getSupplierToken();
    if (!token) throw new Error('Токен API не найден');

    /*
     * Обречённый запрос не отправляем.
     *
     * Категории доступа лежат в самом токене, поэтому «нет Маркетплейса» видно
     * заранее. Иначе WB отвечает сырым «401 token scope not allowed», и по
     * такому тексту непонятно даже, какой кабинет виноват: 11.08.2026 ошибку
     * от «Постельки» искали в кабинете Власенко, где всё работало.
     */
    if (url.includes('marketplace-api.wildberries.ru')) {
      const problem = explainWbAccess(token, 'marketplace', selectedSupplier?.name);
      if (problem) throw Object.assign(new Error(problem), { noRetry: true });
    }

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
          const err = new Error(`WB API Error: ${res.status} ${text}`);
          (err as any).status = res.status;
          /*
           * Клиентские ошибки не лечатся повтором: 404 и 400 будут теми же и
           * через секунду. Повторяем только сетевые сбои, 429 и 5xx — иначе на
           * каждый мёртвый эндпоинт уходит по три запроса и две секунды ожидания.
           */
          if (res.status >= 400 && res.status < 500 && res.status !== 429 && res.status !== 408) {
            throw Object.assign(err, { noRetry: true });
          }
          throw err;
        }

        if (res.status === 204) return {};
        const text = await res.text();
        return text ? JSON.parse(text) : {};
      } catch (error) {
        clearTimeout(timeout);
        lastError = error;

        if ((error as any)?.noRetry) break;

        if (attempt < 2) {
          /*
           * Сбою на стороне WB даём отлежаться подольше: 700 мс лечат дрожание
           * сети, но не 500 от их сервера. Дольше держать человека у экрана
           * тоже нельзя — если не поднялось за пару секунд, честнее сказать.
           */
          const status = Number((error as any)?.status ?? 0);
          const pause = status >= 500 ? 1500 * (attempt + 1) : 700 * (attempt + 1);
          await new Promise((resolve) => setTimeout(resolve, pause));
          continue;
        }
      }
    }

    // Ответ WB отдаём как есть: «404 path not found» — это не проблема сети,
    // и подменять его советом проверить VPN значит уводить от причины.
    if ((lastError as any)?.noRetry) throw lastError;

    /*
     * 5xx — это ответ сервера WB, а не обрыв связи.
     *
     * Раньше всё, что не 4xx, заворачивалось в «Ошибка сети (Failed to fetch),
     * проверьте интернет/VPN». Человек шёл проверять роутер, хотя WB отдавал
     * честный 500: 07.08.2026 /api/v3/orders так падал у пяти кабинетов из
     * шести, а у шестого работал. Чинить там нечего — надо переждать.
     */
    const status = Number((lastError as any)?.status ?? 0);
    if (status >= 500) {
      throw new Error(
        `Wildberries отвечает ошибкой ${status} — это сбой на их стороне, не у вас. `
        + 'Мы повторили запрос трижды. Попробуйте через несколько минут.',
      );
    }
    if (status === 429) {
      throw new Error('Wildberries ограничил частоту запросов (429). Подождите минуту и повторите.');
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

  /**
   * nmId заказов ФБС за последние days дней — для прогноза расхода ЧЗ.
   * Один элемент — один заказ: в ФБС в задании всегда одна вещь.
   */
  const loadFbsOrderNmIds = async (days: number): Promise<number[]> => {
    const dateFrom = Math.floor(Date.now() / 1000) - days * 86_400;
    const ids: number[] = [];
    let next = 0;
    for (let page = 0; page < 30; page++) {
      const data = await wbFetch(`https://marketplace-api.wildberries.ru/api/v3/orders?limit=1000&next=${next}&dateFrom=${dateFrom}`);
      const batch: any[] = data?.orders || [];
      for (const o of batch) {
        const nm = Number(o?.nmId);
        if (nm > 0) ids.push(nm);
      }
      if (batch.length < 1000 || typeof data?.next !== 'number' || data.next === next) break;
      next = data.next;
    }
    return ids;
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

  /** Жив ли персональный эндпоинт заказов поставки: WB его убрал, но проверяем сами. */
  const directSupplyEndpointDeadRef = useRef(false);

  /*
   * Короткий кэш состава поставки.
   *
   * Лист подбора, групповой лист, стикеры и печать этикеток — каждый тянул
   * поставку из WB заново, хотя человек нажимает их подряд за полминуты. При
   * четырёхстах заданиях это лишняя минута ожидания и лишняя нагрузка на WB.
   * Кэш включается явным `cacheTtlMs` и не касается окна скана и кнопки
   * «Обновить данные» — там свежесть важнее скорости.
   */
  const supplyOrdersCacheRef = useRef<Map<string, { at: number; rows: any[] }>>(new Map());
  /** Полторы минуты — столько живёт одна «сессия печати» у стола. */
  const SUPPLY_ORDERS_CACHE_MS = 90_000;

  const fetchOrdersForSupply = async (
    supplyId: string,
    options?: { enrich?: boolean; fresh?: boolean; cacheTtlMs?: number },
  ) => {
    const ttl = Number(options?.cacheTtlMs || 0);
    const cacheKey = `${supplyId}|${options?.enrich ? 1 : 0}`;
    if (ttl > 0) {
      const hit = supplyOrdersCacheRef.current.get(cacheKey);
      if (hit && Date.now() - hit.at < ttl) return hit.rows;
    }

    const rows = await fetchOrdersForSupplyFromWb(supplyId, options);
    if (ttl > 0 && Array.isArray(rows) && rows.length) {
      supplyOrdersCacheRef.current.set(cacheKey, { at: Date.now(), rows });
    }
    return rows;
  };

  const fetchOrdersForSupplyFromWb = async (supplyId: string, options?: { enrich?: boolean; fresh?: boolean }) => {
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

    /*
     * Персональный эндпоинт поставки /api/v3/supplies/{id}/orders WB убрал —
     * он отвечает 404 «path not found» (проверено 30.07.2026 на живом токене).
     * Пробуем его один раз за сессию: если пути нет, дальше идём сразу списком
     * заказов, а не тратим запрос на каждую поставку.
     */
    let supplyOrders: any[] = [];
    let directCount = 0;
    if (!directSupplyEndpointDeadRef.current) {
      try {
        const direct = await wbFetch(withFresh(`https://marketplace-api.wildberries.ru/api/v3/supplies/${supplyId}/orders`));
        if (Array.isArray(direct?.orders)) {
          directCount = direct.orders.length;
          supplyOrders = direct.orders.map(normalizeSupplyOrder);
        }
      } catch (e) {
        if ((e as any)?.status === 404) {
          directSupplyEndpointDeadRef.current = true;
          console.warn('[WBSupplyManager] WB убрал /supplies/{id}/orders (404) — работаем через список заказов');
        } else {
          console.warn('Direct supply orders endpoint failed, fallback to /orders list');
        }
      }
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

  // Ошибку чтения глотать нельзя: пустая карта вместо реальной выглядит как
  // «ничего не отсканировано», и следующий же скан перезапишет ключ, стерев
  // все сохранённые ЧЗ этой поставки.
  const loadFbsSupplyScanMap = async (supplyId: string, supplierId?: string) => {
    const key = getFbsScanStorageKey(supplyId, supplierId);
    const { data, error } = await supabase.from('app_settings').select('value').eq('key', key).maybeSingle();
    if (error) throw new Error(`Не удалось прочитать сохранённые ЧЗ поставки: ${error.message}`);
    try {
      const parsed = data?.value ? JSON.parse(String(data.value)) : {};
      return parseFbsScanPayload(parsed);
    } catch (e: any) {
      throw new Error(`Сохранённые ЧЗ поставки повреждены: ${e?.message || e}`);
    }
  };

  // supabase-js не бросает исключение на ошибке — он возвращает { error }.
  // Раньше результат не проверялся, поэтому упавший upsert (500 от прокси,
  // RLS, обрыв сети) проходил как успех: в интерфейсе загоралось «ЧЗ
  // сохранён», а в базе кода не было. Проверяем и падаем явно.
  const saveFbsSupplyScanMap = async (supplyId: string, next: Record<string, FbsSupplyScanSavedItem>, supplierId?: string) => {
    const key = getFbsScanStorageKey(supplyId, supplierId);
    const clean = parseFbsScanPayload(next);
    const { error } = await supabase.from('app_settings').upsert([{ key, value: JSON.stringify(clean) }], { onConflict: 'key' });
    if (error) throw new Error(`ЧЗ не сохранён: ${error.message}`);
    return clean;
  };

  /**
   * Дополнить снапшот сканами из базы.
   *
   * Строки пишутся сразу, снапшот — пачкой, поэтому после аварийного закрытия
   * окна снапшот может отставать. Берём из базы то, чего в нём нет, и ставим
   * на свои места. Строку, уже закрытую другим кодом, не трогаем: там сборщик
   * что-то менял руками, и его решение старше нашей догадки.
   */
  const restoreFbsScansFromDb = (
    savedMap: Record<string, FbsSupplyScanSavedItem>,
    dbScans: Array<{ orderId: string; chzCode: string; stickerDigits: string; stickerText: string; article: string; size: string; title: string; scannedAt: string }>,
    rows: FbsSupplyScanOrderRow[],
  ) => {
    const map = { ...(savedMap || {}) };
    if (!dbScans?.length) return { map, added: 0 };

    const knownCodes = new Set(
      Object.values(map)
        .map((item) => normalizeDataMatrixText(String(item?.honestSignCode || '')))
        .filter(Boolean),
    );
    const rowByOrderId = new Map<string, FbsSupplyScanOrderRow>();
    rows.forEach((row) => {
      const id = String(row.orderId || '').trim();
      if (id) rowByOrderId.set(id, row);
    });

    let added = 0;
    for (const scan of dbScans) {
      const code = normalizeDataMatrixText(String(scan.chzCode || ''));
      if (!code || knownCodes.has(code)) continue;

      const orderId = String(scan.orderId || '').trim();
      const row = rowByOrderId.get(orderId);
      const storageKey = row?.storageKey || `order:${orderId}`;
      if (map[storageKey]?.honestSignCode) continue;

      map[storageKey] = {
        storageKey,
        stickerDigits: row?.stickerDigits || scan.stickerDigits || '',
        stickerScanText: row?.stickerScanText || scan.stickerText || '',
        honestSignCode: code,
        updatedAt: scan.scannedAt || new Date().toISOString(),
        orderId,
        title: row?.title || scan.title || '',
        article: row?.article || scan.article || '',
        size: row?.size || scan.size || '',
      };
      knownCodes.add(code);
      added += 1;
    }

    return { map, added };
  };

  /** Записать снапшот прямо сейчас (закрытие окна, уход со страницы). */
  const flushFbsScanMap = async () => {
    const state = fbsScanFlushRef.current;
    if (state.timer) { clearTimeout(state.timer); state.timer = null; }
    if (!state.dirty || !state.supplyId) return;

    const { supplyId, supplierId } = state;
    state.dirty = false;
    try {
      const saved = await saveFbsSupplyScanMap(supplyId, fbsScansRef.current, supplierId);
      // Пока писали, окно могли переключить на другую поставку (закладки):
      // тогда сохранённое принадлежит прежней, и показывать его здесь нельзя.
      if (fbsScanSupplyIdRef.current === supplyId) applyFbsScans(saved);
    } catch (e: any) {
      // Снапшот — кэш, но молчать нельзя: пока он отстаёт, окно на другом
      // рабочем месте покажет поставку без этих сканов.
      state.dirty = true;
      console.error('снапшот поставки не записан', e);
      setFbsScanNotice({
        type: 'error',
        text: `Сканы записаны в базу, но снапшот поставки не сохранился (${e?.message || 'ошибка сети'}). Коды не потеряны — они вернутся при следующем открытии окна.`,
      });
    }
  };

  /** Отложить запись снапшота: сборщик обычно сканирует очередью. */
  const scheduleFbsScanMapSave = (supplyId: string, supplierId: string) => {
    const state = fbsScanFlushRef.current;
    state.supplyId = supplyId;
    state.supplierId = supplierId;
    state.dirty = true;
    if (state.timer) clearTimeout(state.timer);
    state.timer = setTimeout(() => { void flushFbsScanMap(); }, 2500);
  };

  const syncFbsScannedCodesToUnifiedBase = async (codes: string[], supplierId?: string) => {
    const normalizedSupplierId = String(supplierId || selectedSupplierId || '').trim();
    const uniqueCodes = Array.from(new Set((codes || []).map((code) => normalizeDataMatrixText(String(code || '').trim())).filter(Boolean)));
    if (!normalizedSupplierId || uniqueCodes.length === 0) return;

    const nowIso = new Date().toISOString();
    const { data: existing, error: existingError } = await supabase
      .from('unified_honest_sign_codes')
      .select('id, code, supplier_id, category')
      .filter('code', 'in', pgInList(uniqueCodes));

    if (existingError) throw existingError;

    const existingByCode = new Map<string, any>();
    (existing || []).forEach((row: any) => {
      const code = String(row?.code || '').trim();
      if (code) existingByCode.set(code, row);
    });

    const idsToUpdate: string[] = [];
    /** Коды, которые в общей базе числятся за другим кабинетом. */
    const foreignCodes: string[] = [];
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
        return;
      }

      /*
       * Код принадлежит другому кабинету.
       *
       * Чужую строку не трогаем — в таблице уникальный индекс по самому коду,
       * и «перетянуть» её значило бы стереть чужую марку. Но и промолчать
       * нельзя, как было раньше: код не помечался отсканированным, и защита
       * «этот ЧЗ уже использован» на него больше никогда не срабатывала — ту
       * же марку можно было спокойно наклеить на второй товар.
       */
      foreignCodes.push(code);
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

    // Отсканированная марка из базы уменьшила остаток — панель ЧЗ пересчитает сразу.
    if (idsToUpdate.length > 0) notifyChzStockChanged(normalizedSupplierId);

    return { foreignCodes };
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
    return rows.map((row: any, index: number) => {
      const stickerDigits = normalizeStickerDigits(String(row?.stickerDigits || row?.stickerText || ''));
      const stickerText = getSafeStickerText({
        stickerDigits,
        stickerText: row?.stickerText,
      });
      const rawStickerScanText = normalizeScanStickerText(String(row?.stickerScanText || ''));
      const stickerScanText = isGarbageStickerScanText(rawStickerScanText) ? '' : rawStickerScanText;
      // «-» приходит из старых файлов и означает «номера нет». Как идентификатор
      // он бесполезен и опасен: одинаков у всех строк поставки.
      const rawOrderId = String(row?.orderId || '').trim();
      const orderId = rawOrderId === '-' ? '' : rawOrderId;

      const storageKey = normalizeFbsStorageKey({ stickerDigits, stickerScanText, orderId });
      const cleanRow: FbsSupplyScanOrderRow = {
        // Если опознать строку нечем, ключ должен остаться уникальным: иначе все
        // такие строки делят одну запись скана и один скан «закрывает» всю поставку.
        storageKey: storageKey === 'order:' ? `row:${index}` : storageKey,
        orderId,
        title: String(row?.title || '').trim(),
        article: String(row?.article || '').trim(),
        size: String(row?.size || '').trim(),
        // Без этого номенклатура терялась при сохранении листа, и после
        // перезагрузки фото пропадали у всех строк.
        nmId: Number(row?.nmId) > 0 ? Number(row.nmId) : undefined,
        stickerDigits,
        stickerText,
        stickerScanText,
      };
      return cleanRow;
    }).filter((row) => Boolean(row.orderId || row.stickerText || row.stickerScanText || row.article || row.title));
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

  /**
   * Схлопывает только те строки, которые действительно об одном и том же товаре.
   *
   * Раньше ключом был голый orderId, а он мог прийти заглушкой «-» — тогда вся
   * поставка сжималась в одну позицию. Теперь ключ составной, а строка без
   * опознавательных признаков получает собственный ключ по номеру: потерять
   * позицию из списка на сканирование хуже, чем показать возможный дубль.
   */
  const getUniqueFbsScanRows = (rows: FbsSupplyScanOrderRow[]) => {
    const map = new Map<string, FbsSupplyScanOrderRow>();
    sanitizeFbsScanRows(rows || []).forEach((row, index) => {
      const orderId = String(row.orderId || '').trim();
      const sticker = normalizeStickerDigits(String(row.stickerDigits || ''));
      const scan = normalizeScanStickerText(String(row.stickerScanText || ''));

      const parts = [
        orderId && orderId !== '-' ? `order:${orderId}` : '',
        sticker ? `sticker:${sticker}` : '',
        scan ? `scan:${scan}` : '',
      ].filter(Boolean);

      const key = parts.length ? parts.join('|') : `row:${index}:${row.article}:${row.size}`;
      map.set(key, row);
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

  // Выбор живёт в пределах одного открытия окна: на другой поставке он врал бы.
  useEffect(() => {
    setFbsScanSelection({});
  }, [activeSupplyId, fbsScanModalOpen]);

  // Состояние марок у WB — тоже только для открытой поставки.
  useEffect(() => {
    setFbsWbSgtin({});
  }, [activeSupplyId, selectedSupplierId]);

  /** Прочитать, что стоит на заданиях у WB, и статусы проверки. */
  const refreshFbsWbSgtin = async (
    orderIds: string[],
    opts: { silent?: boolean; supplierId?: string } = {},
  ) => {
    const supplierId = opts.supplierId || selectedSupplierId;
    const ids = Array.from(new Set(orderIds.map((id) => String(id || '').trim()).filter((id) => /^\d+$/.test(id))));
    if (!supplierId || !ids.length) return;

    if (!opts.silent) setFbsWbSgtinBusy('refresh');
    try {
      const states = await fetchOrdersSgtin(supplierId, ids);
      setFbsWbSgtin((prev) => {
        const next = { ...prev };
        for (const id of ids) {
          const state = states[id];
          if (!state) continue;
          const current = next[id];
          // Отправка ещё в пути — её исход важнее того, что прочитали до неё.
          if (current?.phase === 'sending') continue;
          // Отказ WB не затираем пустым чтением: иначе причина пропадёт с экрана.
          if (current?.phase === 'error' && !state.value) continue;
          next[id] = { phase: 'wb', value: state.value, decision: state.decision };
        }
        return next;
      });
    } catch (e: any) {
      if (!opts.silent) setFbsScanNotice({ type: 'error', text: `Не прочитали марки из WB: ${e?.message || e}` });
    } finally {
      if (!opts.silent) setFbsWbSgtinBusy('');
    }
  };

  /*
   * Перечитать через полминуты с небольшим.
   *
   * Сразу после привязки WB отвечает `pending`: он сверяет марку с Честным
   * знаком. Чтобы сборщик увидел итог, а не вечное «проверяет», дочитываем
   * статус сами — одной пачкой на все отправленные за это время задания.
   */
  const scheduleFbsWbRecheck = (ids: string[], supplierId: string) => {
    const box = fbsWbRecheckRef.current;
    if (box.supplierId && box.supplierId !== supplierId) box.ids.clear();
    box.supplierId = supplierId;
    ids.forEach((id) => box.ids.add(id));
    if (box.timer) clearTimeout(box.timer);
    box.timer = setTimeout(() => {
      const list = Array.from(box.ids);
      box.ids.clear();
      box.timer = null;
      void refreshFbsWbSgtin(list, { silent: true, supplierId });
    }, 40_000);
  };

  /**
   * Отправить марки в WB на задания.
   *
   * Запросы идут очередью: сканер выдаёт коды быстрее, чем WB их принимает, а
   * параллельные вызовы только упирались бы в лимит. Отказ WB показываем у
   * строки — скан у нас от этого не отменяется: марка отсканирована верно, а
   * отправить её можно повторно или файлом.
   */
  const pushFbsSgtinsToWb = (
    items: Array<{ orderId: string; code: string }>,
    supplierId: string = selectedSupplierId,
  ) => {
    const clean = items
      .map((item) => ({ orderId: String(item.orderId || '').trim(), code: String(item.code || '') }))
      .filter((item) => /^\d+$/.test(item.orderId) && item.code);
    if (!supplierId || !clean.length) return Promise.resolve();

    setFbsWbSgtin((prev) => {
      const next = { ...prev };
      clean.forEach(({ orderId }) => { next[orderId] = { ...next[orderId], phase: 'sending', message: '' }; });
      return next;
    });

    const task = fbsWbSgtinQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        try {
          const results = await sendOrderSgtins(supplierId, clean);
          const byId = new Map(results.map((r) => [String(r.orderId), r]));
          setFbsWbSgtin((prev) => {
            const next = { ...prev };
            clean.forEach(({ orderId, code }) => {
              const r = byId.get(orderId);
              if (r?.ok) {
                next[orderId] = { phase: 'sent', value: code, decision: 'pending' };
              } else {
                next[orderId] = { phase: 'error', message: r?.message || 'WB не ответил на отправку' };
              }
            });
            return next;
          });
          const acceptedIds = results.filter((r) => r.ok).map((r) => String(r.orderId));
          if (acceptedIds.length) scheduleFbsWbRecheck(acceptedIds, supplierId);
          return results;
        } catch (e: any) {
          const message = e?.message || 'Не удалось отправить марку в WB';
          setFbsWbSgtin((prev) => {
            const next = { ...prev };
            clean.forEach(({ orderId }) => { next[orderId] = { phase: 'error', message }; });
            return next;
          });
          return [];
        }
      });

    fbsWbSgtinQueueRef.current = task;
    return task;
  };

  /**
   * «Отправить в WB» по всей поставке.
   *
   * Для заданий, отсканированных до автоотправки, и для тех, где WB отказал.
   * Сначала читаем, что уже стоит у WB, и отправляем только расхождения:
   * перезаписывать совпадающую марку незачем, а лишние запросы WB считает.
   */
  const pushAllFbsSgtinsToWb = async () => {
    const supplierId = selectedSupplierId;
    const withCode = fbsScanRows
      .map((row) => ({
        orderId: String(row.orderId || '').trim(),
        code: String(findFbsScanSavedEntry(row, fbsScansBySticker)?.item?.honestSignCode || ''),
      }))
      .filter((item) => /^\d+$/.test(item.orderId) && item.code);

    if (!withCode.length) {
      setFbsScanNotice({ type: 'info', text: 'В поставке нет отсканированных марок — отправлять нечего.' });
      return;
    }

    setFbsWbSgtinBusy('push');
    try {
      setFbsScanNotice({ type: 'info', text: `Сверяю с WB ${withCode.length} марок…` });
      const states = await fetchOrdersSgtin(supplierId, withCode.map((i) => i.orderId));
      const todo = withCode.filter((item) => {
        const state = states[item.orderId];
        // Нет поля sgtin — марку на это задание поставить нельзя вовсе.
        if (!state) return false;
        return !sameChzCode(state.value, item.code);
      });
      const skipped = withCode.filter((item) => !states[item.orderId]).length;

      setFbsWbSgtin((prev) => {
        const next = { ...prev };
        Object.entries(states).forEach(([id, s]) => { next[id] = { phase: 'wb', value: s.value, decision: s.decision }; });
        return next;
      });

      if (!todo.length) {
        setFbsScanNotice({
          type: 'success',
          text: `У WB уже стоят все марки поставки.${skipped ? ` Заданий, где WB марку не принимает: ${skipped}.` : ''}`,
        });
        return;
      }

      setFbsScanNotice({ type: 'info', text: `Отправляю в WB ${todo.length} марок…` });
      const results = (await pushFbsSgtinsToWb(todo, supplierId)) as Array<{ ok: boolean; message?: string }> | undefined;
      const list = Array.isArray(results) ? results : [];
      const ok = list.filter((r) => r.ok).length;
      const failed = list.length - ok;
      const reason = list.find((r) => !r.ok)?.message;

      setFbsScanNotice({
        type: failed ? 'error' : 'success',
        text: `Отправлено в WB: ${ok} из ${todo.length}.`
          + (failed ? ` Отказ по ${failed}: ${reason || 'см. строки'}.` : ' Статусы проверки подтянутся примерно через минуту.')
          + (skipped ? ` Заданий, где WB марку не принимает: ${skipped}.` : ''),
      });
    } catch (e: any) {
      setFbsScanNotice({ type: 'error', text: `Не отправили марки в WB: ${e?.message || e}` });
    } finally {
      setFbsWbSgtinBusy('');
    }
  };

  /*
   * Досылка марок, которых у WB нет.
   *
   * Отправка при скане срабатывает только в той вкладке, где сканируют, и
   * только если в ней новая версия сайта. 13.09.2026 так и вышло: сборщик
   * сканировал на странице, открытой до обновления, и 16 марок в WB не ушли,
   * пока их не отправили кнопкой. Поэтому любое открытое окно скана с
   * включённой автоотправкой само перечитывает WB раз в минуту и досылает
   * пропущенное — кто бы и где бы ни сканировал.
   *
   * Каждое задание досылаем один раз за открытие окна: если WB отказал, повтор
   * по кругу только сжигал бы лимит (отказ WB считает за десять запросов).
   * Закрытую поставку не трогаем вовсе — WB её марки уже не примет.
   */
  /*
   * Страница устарела: на сайте уже новая версия.
   *
   * Складской ПК держит вкладку открытой сутками, и после выкладки там
   * продолжает работать старый код — так 13.09.2026 марки не ушли в WB при
   * скане. Сверяем главный скрипт этой страницы с тем, что сейчас отдаёт
   * сайт. Адрес /api/… выбран намеренно: service worker его не кэширует, а
   * хостинг отвечает на него тем же index.html.
   */
  const [appOutdated, setAppOutdated] = useState(false);
  useEffect(() => {
    const running = document
      .querySelector('script[type="module"][src*="/assets/index-"]')
      ?.getAttribute('src') || '';
    if (!running) return;

    let stopped = false;
    const check = async () => {
      try {
        const res = await fetch(`/api/app-version?t=${Date.now()}`, { cache: 'no-store' });
        const html = await res.text();
        const live = html.match(/src="(\/assets\/index-[^"]+\.js)"/)?.[1] || '';
        if (!stopped && live && live !== running) setAppOutdated(true);
      } catch {
        // нет сети — проверим в следующий раз
      }
    };
    void check();
    const timer = setInterval(check, 3 * 60_000);
    return () => { stopped = true; clearInterval(timer); };
  }, []);

  const fbsWbCatchUpTriedRef = useRef<Set<string>>(new Set());
  // Таймер перечитывания живёт минутами — строки берёт свежие, а не из замыкания.
  const fbsScanRowsRef = useRef<FbsSupplyScanOrderRow[]>([]);
  useEffect(() => { fbsScanRowsRef.current = fbsScanRows; }, [fbsScanRows]);

  useEffect(() => {
    fbsWbCatchUpTriedRef.current = new Set();
  }, [activeSupplyId, fbsScanModalOpen]);

  useEffect(() => {
    if (!fbsScanModalOpen || !fbsWbAutoSend || fbsWbSgtinBusy) return;
    const supply = supplies.find((s) => s.id === activeSupplyId);
    if (!supply || supply.closedAt) return;

    const todo: Array<{ orderId: string; code: string }> = [];
    for (const row of fbsScanRows) {
      if (getFbsWbIssue(row) !== 'missing') continue;
      const orderId = String(row.orderId || '').trim();
      if (fbsWbCatchUpTriedRef.current.has(orderId)) continue;
      const code = findFbsScanSavedEntry(row, fbsScansBySticker)?.item?.honestSignCode || '';
      if (!code) continue;
      fbsWbCatchUpTriedRef.current.add(orderId);
      todo.push({ orderId, code });
    }
    if (todo.length) void pushFbsSgtinsToWb(todo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fbsWbSgtin, fbsScansBySticker, fbsScanRows, fbsScanModalOpen, fbsWbAutoSend, fbsWbSgtinBusy, activeSupplyId]);

  /*
   * Перечитывание марок у WB.
   *
   * Окно скана живёт свёрнутым во всех разделах, поэтому опрос раз в минуту по
   * всей поставке шёл целый день, даже со скрытой вкладкой. Теперь: раз в
   * 3 минуты, только когда вкладку видно, и только по заданиям, где наша марка
   * есть, а WB её ещё не подтвердил.
   */
  const fbsWbPollIdsRef = useRef<() => string[]>(() => []);
  fbsWbPollIdsRef.current = () => fbsScanRowsRef.current
    .filter((row) => {
      if (!findFbsScanSavedEntry(row, fbsScansBySticker)?.item?.honestSignCode) return false;
      const issue = getFbsWbIssue(row);
      return issue !== 'ok' && issue !== 'bad';
    })
    .map((row) => row.orderId);

  useEffect(() => {
    if (!fbsScanModalOpen || !fbsWbAutoSend) return;
    const timer = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      const ids = fbsWbPollIdsRef.current();
      if (ids.length) void refreshFbsWbSgtin(ids, { silent: true });
    }, 3 * 60_000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fbsScanModalOpen, fbsWbAutoSend, activeSupplyId, selectedSupplierId]);

  /*
   * Хвост отложенного снапшота.
   *
   * Закрыли окно, ушли со страницы, размонтировали раздел — дописываем то, что
   * ещё не успело уйти. Скан от этого не зависит: он уже лежит строкой в базе,
   * но снапшот нужен второму рабочему месту и быстрому открытию.
   */
  useEffect(() => {
    if (fbsScanModalOpen) return;
    void flushFbsScanMap();
  }, [fbsScanModalOpen]);

  // Смена фильтра или состава поставки — снова показываем первую сотню.
  useEffect(() => {
    setFbsScanRenderLimit(FBS_SCAN_PAGE_SIZE);
  }, [fbsScanFilter, fbsScanRows]);

  useEffect(() => {
    const onLeave = () => { void flushFbsScanMap(); };
    window.addEventListener('beforeunload', onLeave);
    return () => {
      window.removeEventListener('beforeunload', onLeave);
      onLeave();
    };
  }, []);

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

  /*
   * Производные списки окна скана.
   *
   * Стоят строго ниже getSafeStickerText не для красоты: useMemo выполняется
   * во время рендера, а цепочка getFbsScanProgressStats → getUniqueFbsScanRows
   * → sanitizeFbsScanRows доходит до него. Объявленные выше, они обращались к
   * ещё не инициализированной константе, и окно падало с «Cannot access before
   * initialization» — ровно при открытии «Скан ЧЗ».
   */

  /**
   * Что с маркой задания у WB — одним словом, для фильтров и сводки.
   *
   *  ok      — WB проверил марку;
   *  wait    — отправляется или WB ещё проверяет;
   *  bad     — WB отказал или проверка не пройдена;
   *  differ  — у WB на задании другая марка, чем у нас;
   *  missing — у нас марка есть, у WB нет;
   *  null    — у нас марки нет или WB о задании ничего не сказал.
   */
  const getFbsWbIssue = (row: FbsSupplyScanOrderRow): 'ok' | 'wait' | 'bad' | 'differ' | 'missing' | null => {
    const ours = findFbsScanSavedEntry(row, fbsScansBySticker)?.item?.honestSignCode || '';
    const wb = fbsWbSgtin[String(row.orderId || '').trim()];
    if (!ours || !wb) return null;
    if (wb.phase === 'error') return 'bad';
    if (wb.phase === 'sending' || wb.phase === 'sent') return 'wait';
    if (!wb.value) return 'missing';
    if (!sameChzCode(wb.value, ours)) return 'differ';
    const { verdict } = describeSgtinDecision(wb.decision || '');
    if (verdict === 'ok') return 'ok';
    if (verdict === 'bad') return 'bad';
    return 'wait';
  };

  /*
   * Строки, которые сейчас видно в таблице.
   *
   * Отдельно от разметки, потому что кнопка «Выбрать все» обязана выбрать
   * ровно то, что человек видит: фильтр стоит на «Не отсканированы», а в
   * выбор попала вся поставка — это уже не выбор, а сюрприз на печати.
   */
  const fbsScanVisibleRows = useMemo(() => {
    return (fbsScanRows || []).filter((row) => {
      if (fbsScanFilter === 'all') return true;
      if (fbsScanFilter === 'wb_error') {
        const issue = getFbsWbIssue(row);
        return issue === 'bad' || issue === 'differ';
      }
      if (fbsScanFilter === 'wb_missing') return getFbsWbIssue(row) === 'missing';
      const done = Boolean(findFbsScanSavedEntry(row, fbsScansBySticker)?.item?.honestSignCode);
      return fbsScanFilter === 'done' ? done : !done;
    });
  }, [fbsScanRows, fbsScanFilter, fbsScansBySticker, fbsWbSgtin]);

  /** Отмеченные строки — в том же порядке, что и в таблице. */
  const fbsScanSelectedRows = useMemo(
    () => (fbsScanRows || []).filter((row) => fbsScanSelection[row.storageKey]),
    [fbsScanRows, fbsScanSelection],
  );

  /*
   * Счётчики прогресса считаем один раз за рендер.
   *
   * Раньше их запрашивали в трёх местах разметки, и каждый вызов заново
   * перебирал поставку и строил карту уникальных строк — на четырёхстах
   * заданиях это три лишних прохода на каждое нажатие клавиши.
   */
  const fbsScanStats = useMemo(
    () => getFbsScanProgressStats(fbsScanRows, fbsScansBySticker),
    [fbsScanRows, fbsScansBySticker],
  );

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
    // Библиотеки печати/Excel грузятся по требованию — не при открытии раздела.
    await ensureExcel();
    const { ExcelJS } = lazyLibs;
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
        // Заглушку «-» здесь ставить нельзя: она одинакова для всех строк,
        // и дальше вся поставка схлопывается в одну позицию по общему ключу.
        const orderId = String(o.id ?? o.orderId ?? o.order_id ?? '').trim();
        const stickerText = formatStickerDigits(stickerDigits);
        const stickerScanText = meta?.stickerScanText || extractAutoStickerScanText(o);
        return {
          storageKey: normalizeFbsStorageKey({ orderId, stickerDigits, stickerScanText }),
          orderId,
          title: String(o.title || 'Без названия'),
          article: String(o.article || o.vendorCode || '-'),
          size: String(o.size || o.techSize || o.wbSize || '-'),
          nmId: Number(o.nmId ?? (o as any).nmID ?? 0) > 0 ? Number(o.nmId ?? (o as any).nmID) : undefined,
          stickerDigits,
          stickerText,
          stickerScanText,
        };
      }));
  };

  const loadPreparedFbsScanRows = async (
    supplyId: string,
    supplierId?: string,
    options?: { forceRefresh?: boolean; ignoreCache?: boolean },
  ) => {
    const forceRefresh = Boolean(options?.forceRefresh);
    const ignoreCache = Boolean(options?.ignoreCache);
    const [sheetRows, sheetMeta] = await Promise.all([
      loadFbsSupplyScanSheetRows(supplyId, supplierId),
      loadFbsSupplyScanSheetMeta(supplyId, supplierId),
    ]);

    const cachedCompleteness = getFbsScanCompletenessStats(sheetRows);
    const canUseCachedSheet = Boolean(
      !ignoreCache
      && sheetRows.length
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

      /*
       * Сверяем кеш с WB по количеству заказов. Поставка живёт: её собрали из
       * шести заказов, а к отгрузке в ней стало пятьдесят семь. Без этой сверки
       * экран сканирования показывал старую шестёрку и человек уезжал с
       * недособранной поставкой.
       */
      const freshCount = await getFreshSupplyOrdersCount(supplyId);
      if (freshCount > 0 && freshCount === cachedCompleteness.totalRows) {
        return { rows: sheetRows, sheetRows, apiRows: [] as FbsSupplyScanOrderRow[], mergedRows: sheetRows, sheetMeta, source: 'cache' as const, freshCount };
      }
      if (freshCount > 0) {
        console.warn('[WBSupplyManager] кеш поставки устарел', {
          supplyId,
          cached: cachedCompleteness.totalRows,
          wb: freshCount,
        });
      }
    }

    const apiRows = await getSupplyOrdersForScan(supplyId);
    const mergedRows = apiRows.length ? mergeFbsScanRows(apiRows, sheetRows) : sheetRows;
    const needsStickerEnrich = mergedRows.some((row) => !normalizeStickerDigits(String(row?.stickerDigits || '')) || !looksReadableStickerScanText(String(row?.stickerScanText || '')));
    const enrichedRows = needsStickerEnrich ? await enrichFbsScanRowsWithStickerMeta(mergedRows) : mergedRows;
    const rows = getUniqueFbsScanRows(enrichedRows);
    return { rows, sheetRows, apiRows, mergedRows, sheetMeta, source: 'wb' as const };
  };

  const openFbsScanModal = async (opts?: { keepMinimized?: boolean }) => {
    if (!activeSupplyId) return;
    setFbsScanMinimized(Boolean(opts?.keepMinimized));
    fbsScanSupplyIdRef.current = activeSupplyId;
    fbsScanSupplierIdRef.current = selectedSupplierId || null;
    setFbsScanModalOpen(true);
    setFbsScanLoading(true);
    setFbsScanMode('sticker');
    clearScanInput();
    setFbsPendingStickerRow(null);
    setFbsScanNotice(null);
    try {
      // forceRefresh: сверяем сохранённый лист с WB по количеству заказов.
      // Это один запрос, а цена ошибки — недособранная поставка.
      const [{ rows, sheetRows, apiRows, mergedRows, sheetMeta, source }, savedMap, dbScans] = await Promise.all([
        loadPreparedFbsScanRows(activeSupplyId, selectedSupplierId, { forceRefresh: true }),
        loadFbsSupplyScanMap(activeSupplyId, selectedSupplierId),
        // Снапшот пишется пачкой и может отставать — строки из базы возвращают
        // хвост, не доехавший до него (закрыли вкладку, оборвалась сеть).
        fetchFbsSupplyScans(selectedSupplierId, activeSupplyId).catch((e) => {
          console.error('не прочитали сканы поставки из базы', e);
          return [];
        }),
      ]);
      fbsScanRowsSupplyRef.current = activeSupplyId;
      setFbsScanRows(rows);
      // Что уже стоит у WB — фоном: окно сканирования ждать этого не должно.
      void refreshFbsWbSgtin(rows.map((r) => r.orderId), { silent: true });

      const restored = restoreFbsScansFromDb(savedMap, dbScans, rows);
      applyFbsScans(restored.map);
      if (restored.added > 0) {
        // Молча дописывать нельзя: расхождение снапшота с базой значит, что в
        // прошлый раз окно закрыли раньше, чем оно успело сохраниться.
        console.warn('[WBSupplyManager] снапшот отставал от базы', restored.added);
        scheduleFbsScanMapSave(activeSupplyId, selectedSupplierId);
      }
      const completeness = getFbsScanCompletenessStats(rows);
      if (source !== 'cache' && (apiRows.length || JSON.stringify(rows) !== JSON.stringify(getUniqueFbsScanRows(mergedRows))) && completeness.isFullyReady) {
        void saveFbsSupplyScanSheetRows(activeSupplyId, rows, selectedSupplierId, 'wb').catch(() => undefined);
      }
      // Видно, что именно произошло: WB отдал мало строк или мы их схлопнули.
      if (apiRows.length && rows.length < apiRows.length) {
        console.warn('[WBSupplyManager] строки поставки схлопнулись при дедупликации', {
          supplyId: activeSupplyId,
          apiRows: apiRows.length,
          mergedRows: mergedRows.length,
          uniqueRows: rows.length,
        });
      }

      if (!rows.length) {
        setFbsScanNotice({ type: 'info', text: 'В поставке пока нет строк для сканирования. Попробую добирать их из WB автоматически, а пока можно скачать шаблон Excel по текущим данным.' });
      } else if (apiRows.length > rows.length) {
        setFbsScanNotice({ type: 'error', text: `WB отдал ${apiRows.length} заданий, а в списке осталось ${rows.length}: часть строк совпала по номеру задания и стикеру. Проверьте поставку — возможно, WB вернул неполные данные.` });
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

  /**
   * Перезабрать состав поставки из WB, минуя сохранённый лист.
   *
   * Нужна отдельной кнопкой: поставка пополняется после того, как лист уже
   * сохранён, и человеку надо иметь способ обновить его в момент сборки, не
   * закрывая экран и не гадая, свежие данные перед ним или нет.
   */
  const refreshFbsScanRowsFromWb = async () => {
    if (!activeSupplyId) return;
    const before = fbsScanRows.length;
    // Человек нажал «обновить» — значит, состав изменился. Кэш печати сбрасываем,
    // иначе следующий лист подбора выйдет по старому составу.
    supplyOrdersCacheRef.current.clear();
    if (fbsScanRefreshing) return;
    const supplyAtStart = activeSupplyId;
    setFbsScanRefreshing(true);
    setFbsScanNotice({ type: 'info', text: 'Обновляю в фоне: состав поставки из WB и сканы с других рабочих мест…' });
    try {
      const [{ rows, apiRows }, savedMap, dbScans] = await Promise.all([
        loadPreparedFbsScanRows(activeSupplyId, selectedSupplierId, { ignoreCache: true }),
        loadFbsSupplyScanMap(activeSupplyId, selectedSupplierId),
        fetchFbsSupplyScans(selectedSupplierId, activeSupplyId).catch((e) => {
          console.error('не прочитали сканы поставки из базы', e);
          return null;
        }),
      ]);

      // Пока грузили, окно переключили на другую поставку — результат не наш.
      if (fbsScanSupplyIdRef.current !== supplyAtStart) return;

      if (!rows.length) {
        // Прежний список не трогаем: пустой ответ WB — не повод его стирать.
        setFbsScanNotice({ type: 'error', text: 'WB не отдал ни одного заказа по этой поставке. Список оставлен прежним — проверьте, что поставка не закрыта.' });
        return;
      }

      // Таблицу подменяем, только если состав действительно изменился.
      const rowsChanged = JSON.stringify(rows) !== JSON.stringify(fbsScanRowsRef.current);
      if (rowsChanged) {
        fbsScanRowsSupplyRef.current = activeSupplyId;
        fbsScanRowsRef.current = rows;
        setFbsScanRows(rows);
      }

      /*
       * Сканы: снапшот — основа, свои несохранённые — поверх, база — правда.
       *
       * Раньше бралась только копия-снапшот. Она пишется с задержкой, поэтому
       * кнопка не показывала сканы с других компьютеров и на миг прятала свои
       * последние. Теперь сводим с базой, как при открытии окна, и убираем
       * сброшенные на другом месте: человек сам попросил актуальную картину.
       */
      const base: Record<string, FbsSupplyScanSavedItem> = { ...(savedMap || {}) };
      const nowMs = Date.now();
      Object.entries(fbsScansRef.current).forEach(([key, item]) => {
        if (!item?.honestSignCode) return;
        const fresh = nowMs - new Date(item.updatedAt || 0).getTime() < 30_000;
        if (fbsScanSavingKeysRef.current[key] || fresh) base[key] = item;
      });
      const scansMap = dbScans ? mergeFbsScanMapWithDb(base, dbScans, rows, true).map : base;
      if (JSON.stringify(scansMap) !== JSON.stringify(fbsScansRef.current)) {
        applyFbsScans(scansMap);
        releaseFbsPendingTakenElsewhere(scansMap);
      }

      const completeness = getFbsScanCompletenessStats(rows);
      // Сохраняем только полный набор: недособранный лист затёр бы прежний.
      if (completeness.isFullyReady) {
        await saveFbsSupplyScanSheetRows(activeSupplyId, rows, selectedSupplierId, 'wb').catch(() => undefined);
      }

      const added = rows.length - before;
      const scanned = Object.values(scansMap).filter((item) => item?.honestSignCode).length;
      if (!completeness.isFullyReady) {
        setFbsScanNotice({
          type: 'error',
          text: `WB отдал ${rows.length} заданий, но не по всем есть стикер: ${completeness.rowsWithSticker}/${completeness.totalRows}. Список обновлён, но файл до полного набора не собрать — повторите обновление позже.`,
        });
      } else if (added > 0) {
        setFbsScanNotice({
          type: 'success',
          text: `Обновлено: было ${before} заданий, стало ${rows.length} (+${added}). Отсканировано ${scanned} — сканы сохранились.`,
        });
      } else if (added < 0) {
        setFbsScanNotice({
          type: 'success',
          text: `Обновлено: было ${before} заданий, стало ${rows.length} — часть заказов из поставки убрали.`,
        });
      } else {
        setFbsScanNotice({
          type: 'success',
          text: `Данные актуальны: ${rows.length} заданий, изменений в WB нет.${apiRows.length ? '' : ' Список взят из сохранённого листа.'}`,
        });
      }
    } catch (e: any) {
      setFbsScanNotice({ type: 'error', text: `Не удалось обновить (${e?.message || 'ошибка'}). На экране прежние данные.` });
    } finally {
      setFbsScanRefreshing(false);
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

  /**
   * Записать ЧЗ, который база считает уже использованным.
   *
   * Проверка на повтор нужна — она ловит пересорт. Но она же ловит возврат и
   * повторную отправку, а это законные случаи. Решение оставляем человеку с
   * товаром в руках и пишем в журнал, кто и что продавил.
   */
  const forceSaveFbsScanEntry = async (row: FbsSupplyScanOrderRow, honestSignCode: string, where: string) => {
    if (!activeSupplyId) return;
    const supplyId = activeSupplyId;
    const supplierId = selectedSupplierId;

    setFbsScanOverrideBusy(true);
    try {
      const next = { ...fbsScansRef.current };
      next[row.storageKey] = {
        storageKey: row.storageKey,
        stickerDigits: row.stickerDigits,
        stickerScanText: row.stickerScanText,
        honestSignCode,
        updatedAt: new Date().toISOString(),
        orderId: row.orderId,
        title: row.title,
        article: row.article,
        size: row.size,
      };
      applyFbsScans(next);

      const saved = await saveFbsSupplyScanMap(supplyId, next, supplierId);
      await syncFbsScannedCodesToUnifiedBase([honestSignCode], supplierId);
      applyFbsScans(saved);

      await upsertFbsOrderCode({
        supplierId,
        supplyId,
        orderId: row.orderId,
        chzCode: honestSignCode,
        stickerDigits: row.stickerDigits,
        stickerText: row.stickerScanText,
        nmId: row.nmId ?? null,
        article: row.article,
        size: row.size,
        title: row.title,
      }).catch((e) => console.error('fbs_order_codes upsert failed', e));

      // Записали под ответственность человека — значит и в WB уходит она.
      if (fbsWbAutoSendRef.current) {
        void pushFbsSgtinsToWb([{ orderId: row.orderId, code: honestSignCode }], supplierId);
      }

      void logFbsScanReject({
        supplierId,
        supplyId,
        orderId: row.orderId,
        rawValue: honestSignCode,
        reason: 'override_duplicate',
        detail: `записан повторно; ранее: ${where}`,
      });

      setFbsScanFailedKeys((prev) => {
        const rest = { ...prev };
        delete rest[row.storageKey];
        return rest;
      });
      setFbsScanOverride(null);
      setFbsScanNotice({ type: 'success', text: `ЧЗ записан для заказа ${row.orderId} повторно — как возврат или переотправка.` });
      fbsCue('ready');
    } catch (e: any) {
      dropFbsScanEntry(row.storageKey);
      fbsCue('error');
      setFbsScanNotice({ type: 'error', text: e?.message || 'Не удалось записать ЧЗ повторно' });
    } finally {
      setFbsScanOverrideBusy(false);
    }
  };

  const resetFbsScannedCode = async (row: FbsSupplyScanOrderRow) => {
    if (!activeSupplyId) return;
    try {
      const next = { ...(fbsScansBySticker || {}) };
      const currentEntry = findFbsScanSavedEntry(row, next);
      const resetCode = normalizeDataMatrixText(String(currentEntry?.item?.honestSignCode || ''));
      if (currentEntry?.key) delete next[currentEntry.key];
      else delete next[row.storageKey];
      const saved = await saveFbsSupplyScanMap(activeSupplyId, next, selectedSupplierId);
      // Из базы заказов строку тоже убираем: иначе она будет утверждать, что на
      // заказе стоит код, который сборщик только что снял.
      await deleteFbsOrderCode(selectedSupplierId, row.orderId).catch((e) => {
        console.error('fbs_order_codes delete failed', e);
      });

      /*
       * И из общей базы кодов — отметку «Отсканировано».
       *
       * Иначе сброс был неполным: марка оставалась в базе как отсканированная,
       * и повторный скан того же кода (сбросили по ошибке, сканируют заново)
       * упирался в «уже отсканирован раньше» и требовал подтверждения.
       *
       * Не удаляем, если тот же код ещё стоит на другом задании — например,
       * записан туда через «Записать всё равно»: там защита от дубля нужна.
       */
      if (resetCode) {
        try {
          const { data: stillUsed } = await supabase
            .from('fbs_order_codes')
            .select('order_id')
            .eq('supplier_id', selectedSupplierId)
            .eq('chz_code', resetCode)
            .neq('order_id', String(row.orderId || ''))
            .limit(1);
          if (!stillUsed?.length) {
            await supabase
              .from('unified_honest_sign_codes')
              .delete()
              .eq('supplier_id', selectedSupplierId)
              .eq('code', resetCode)
              .or('file_name.eq.Отсканировано,status.eq.scanned');
          }
          notifyChzStockChanged(selectedSupplierId);
        } catch (e) {
          console.error('unified_honest_sign_codes reset failed', e);
        }
      }

      applyFbsScans(saved);
      if (fbsPendingStickerRow?.storageKey === row.storageKey) {
        setFbsPendingStickerRow(null);
        setFbsScanMode('sticker');
        clearScanInput();
      }

      /*
       * Сброшенная марка должна уйти и из WB.
       *
       * Сбрасывают, когда марка не та, — оставить её на задании у WB значит
       * отправить вещь с чужим кодом. Снимаем, только если знаем, что марка
       * там есть: лишний запрос на пустое задание WB считает за десять.
       */
      const orderId = String(row.orderId || '').trim();
      const wbState = fbsWbSgtin[orderId];
      if (/^\d+$/.test(orderId) && (wbState?.value || wbState?.phase === 'sent' || wbState?.phase === 'sending')) {
        try {
          const [result] = await removeOrderSgtins(selectedSupplierId, [orderId]);
          if (result && !result.ok) {
            setFbsWbSgtin((prev) => ({ ...prev, [orderId]: { ...prev[orderId], phase: 'error', message: `Марку у WB снять не удалось: ${result.message}` } }));
            setFbsScanNotice({ type: 'error', text: `ЧЗ сброшен у нас, но в WB марка осталась: ${result.message}` });
            return;
          }
          setFbsWbSgtin((prev) => ({ ...prev, [orderId]: { phase: 'wb', value: '', decision: 'optional' } }));
        } catch (e: any) {
          setFbsScanNotice({ type: 'error', text: `ЧЗ сброшен у нас, но в WB марка осталась: ${e?.message || e}` });
          return;
        }
      }

      setFbsScanNotice({ type: 'success', text: `ЧЗ для заказа ${row.orderId} сброшен. Можно сканировать заново.` });
    } catch (e: any) {
      setFbsScanNotice({ type: 'error', text: e?.message || 'Не удалось сбросить ЧЗ' });
    }
  };

  /** Открыть окно грузомест: список у WB и число заданий для подсказки лимита. */
  const openBoxesModal = async (supplyId: string) => {
    if (!supplyId || !selectedSupplierId) return;
    setBoxesAmount('1');
    setBoxesModal({ supplyId, ids: [], ordersCount: null, busy: 'load', error: '', info: '' });

    const [idsResult, ordersResult] = await Promise.allSettled([
      listSupplyBoxes(selectedSupplierId, supplyId),
      fetchOrdersForSupply(supplyId, { enrich: false, cacheTtlMs: 60_000 }),
    ]);

    setBoxesModal((prev) => {
      if (!prev || prev.supplyId !== supplyId) return prev;
      return {
        ...prev,
        busy: '',
        ids: idsResult.status === 'fulfilled' ? idsResult.value : [],
        ordersCount: ordersResult.status === 'fulfilled' ? (ordersResult.value || []).length : null,
        error: idsResult.status === 'rejected' ? `Не прочитали грузоместа: ${idsResult.reason?.message || idsResult.reason}` : '',
      };
    });
  };

  /**
   * Стикеры грузомест одним PDF 58×40 — на тот же термопринтер, что и
   * стикеры заданий. Вкладку открывает вызывающий до первого await.
   */
  /** Стикеры грузомест — сразу в окно печати, без файла и вкладки. */
  const printBoxStickers = async (supplyId: string, ids: string[]) => {
    const stickers = await fetchSupplyBoxStickers(selectedSupplierId, supplyId, ids);
    const images = stickers.filter((s) => s.file).map((s) => ({ file: s.file, type: 'png' as const }));
    if (!images.length) throw new Error('WB не вернул стикеры грузомест');
    await printImagesDirect(images);
    return images.length;
  };

  /** Создать грузоместа у WB и сразу напечатать их стикеры. */
  const createBoxesAndPrint = async () => {
    const modal = boxesModal;
    if (!modal || modal.busy) return;
    const amount = Math.floor(Number(boxesAmount));
    if (!Number.isFinite(amount) || amount < 1 || amount > 1000) {
      setBoxesModal({ ...modal, error: 'Укажите количество от 1 до 1000', info: '' });
      return;
    }

    setBoxesModal({ ...modal, busy: 'create', error: '', info: '' });
    try {
      const created = await createSupplyBoxes(selectedSupplierId, modal.supplyId, amount);
      if (!created.length) throw new Error('WB не вернул номера созданных грузомест');

      // Список перечитываем у WB: так видно и те, что создали в кабинете.
      const ids = await listSupplyBoxes(selectedSupplierId, modal.supplyId).catch(() => [...modal.ids, ...created]);
      setBoxesModal((prev) => (prev ? { ...prev, ids, busy: 'print' } : prev));

      let printed = 0;
      let printError = '';
      try {
        printed = await printBoxStickers(modal.supplyId, created);
      } catch (e: any) {
        printError = e?.message || String(e);
      }

      setBoxesModal((prev) => (prev ? {
        ...prev,
        busy: '',
        error: printError ? `Грузоместа созданы (${created.length}), но стикеры не получены: ${printError}. Нажмите «Печать всех».` : '',
        info: printError ? '' : `Создано грузомест: ${created.length}. Стикеры (${printed}) отправлены в печать.`,
      } : prev));
    } catch (e: any) {
      setBoxesModal((prev) => (prev ? { ...prev, busy: '', error: e?.message || String(e), info: '' } : prev));
    }
  };

  const printAllBoxStickers = async () => {
    const modal = boxesModal;
    if (!modal || modal.busy || !modal.ids.length) return;
    setBoxesModal({ ...modal, busy: 'print', error: '', info: '' });
    try {
      const printed = await printBoxStickers(modal.supplyId, modal.ids);
      setBoxesModal((prev) => (prev ? { ...prev, busy: '', info: `Стикеры (${printed}) отправлены в печать.` } : prev));
    } catch (e: any) {
      setBoxesModal((prev) => (prev ? { ...prev, busy: '', error: e?.message || String(e) } : prev));
    }
  };

  /** Стикер одного грузоместа — когда наклейку испортили или нужна одна коробка. */
  const printOneBoxSticker = async (id: string) => {
    const modal = boxesModal;
    if (!modal || modal.busy) return;
    setBoxesModal({ ...modal, busy: 'print', error: '', info: '' });
    try {
      await printBoxStickers(modal.supplyId, [id]);
      setBoxesModal((prev) => (prev ? { ...prev, busy: '', info: `Стикер ${id} отправлен в печать.` } : prev));
    } catch (e: any) {
      setBoxesModal((prev) => (prev ? { ...prev, busy: '', error: e?.message || String(e) } : prev));
    }
  };

  /** Удалить грузоместо у WB — пока поставка на сборке. */
  const deleteBox = async (id: string) => {
    const modal = boxesModal;
    if (!modal || modal.busy) return;
    if (!window.confirm(`Удалить грузоместо ${id} у WB? Его стикер станет недействительным.`)) return;

    setBoxesModal({ ...modal, busy: 'delete', error: '', info: '' });
    try {
      await deleteSupplyBoxes(selectedSupplierId, modal.supplyId, [id]);
      const ids = await listSupplyBoxes(selectedSupplierId, modal.supplyId).catch(() => modal.ids.filter((x) => x !== id));
      setBoxesModal((prev) => (prev ? { ...prev, ids, busy: '', info: `Грузоместо ${id} удалено.` } : prev));
    } catch (e: any) {
      setBoxesModal((prev) => (prev ? { ...prev, busy: '', error: e?.message || String(e) } : prev));
    }
  };

  /**
   * Стикер одного задания — когда наклейку потеряли или испортили.
   *
   * Берём тот же стикер, что WB отдавал при сборке поставки: перепечатать
   * «похожий» нельзя, на нём свой код, по которому задание и опознаётся.
   */
  const printSingleFbsSticker = async (row: FbsSupplyScanOrderRow) => {
    const orderId = Number(String(row?.orderId || '').trim());
    if (!Number.isFinite(orderId) || orderId <= 0) {
      setFbsScanNotice({ type: 'error', text: 'У строки нет номера задания — стикер запросить не по чему' });
      return;
    }

    const token = getSupplierToken();
    if (!token) {
      setFbsScanNotice({ type: 'error', text: 'Токен API кабинета не найден' });
      return;
    }

    /*
     * Вкладку открываем сейчас, до запроса в WB.
     *
     * Браузер разрешает window.open только пока идёт обработка клика. Если
     * открывать после await, жест уже «истёк» и блокировщик режет окно —
     * поэтому сначала открываем пустую вкладку, а готовый PDF подставляем в неё.
     */
    setFbsStickerPrintingId(String(row.orderId));
    setFbsScanNotice({ type: 'info', text: `Запрашиваю стикер задания ${row.orderId} у WB…` });
    try {
      const stickers = await fetchStickers(token, [orderId]);
      const sticker = stickers.get(orderId);
      if (!sticker) throw new Error('WB не вернул стикер для этого задания');

      await printImagesDirect([sticker]);
      setFbsScanNotice({ type: 'success', text: `Стикер задания ${row.orderId} отправлен в печать.` });
    } catch (e: any) {
      setFbsScanNotice({ type: 'error', text: e?.message || 'Не удалось получить стикер' });
    } finally {
      setFbsStickerPrintingId('');
    }
  };

  /**
   * Шрифт с кириллицей в документ этикеток.
   *
   * Без него jsPDF рисует наименование и «Размер:» кракозябрами: встроенные
   * шрифты стандарта PDF кириллицу не знают. Файл кэшируем на компонент —
   * на пакете в двести этикеток он иначе качался бы каждый раз заново.
   */
  const addChzLabelFont = async (pdf: any) => {
    try {
      if (!cachedPdfFontRef.current) {
        const fontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf';
        const response = await withTimeout(fetch(fontUrl), 7000, 'Таймаут загрузки шрифта');
        const blob = await response.blob();
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        await new Promise((resolve) => { reader.onloadend = () => resolve(reader.result); });
        cachedPdfFontRef.current = (reader.result as string).split(',')[1];
      }
      if (cachedPdfFontRef.current) {
        pdf.addFileToVFS('Roboto-Regular.ttf', cachedPdfFontRef.current);
        pdf.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
        pdf.addFont('Roboto-Regular.ttf', 'Roboto', 'bold');
      }
    } catch (e) {
      console.warn('Шрифт для этикетки ЧЗ не загрузился', e);
    }
  };

  /**
   * Товарный штрихкод по номенклатуре и размеру задания.
   *
   * У карточки размеров несколько, и у каждого свой ШК. Берём тот, что
   * совпал с размером задания; если не совпал ни один, а размер в карточке
   * один — берём его. Иначе штрихкода не будет вовсе: пустое место на
   * этикетке заметят, чужой ШК на вещи — нет.
   */
  const loadChzLabelSkus = async (supplierId: string, nmIds: number[]) => {
    const out = new Map<number, { bySize: Record<string, string>; only: string }>();
    const ids = Array.from(new Set(nmIds.filter((id) => Number.isFinite(id) && id > 0)));
    if (!supplierId || ids.length === 0) return out;

    for (let i = 0; i < ids.length; i += 500) {
      const { data } = await supabase
        .from('wb_products_cache')
        .select('nm_id, sizes:product_json->sizes')
        .eq('supplier_id', supplierId)
        .in('nm_id', ids.slice(i, i + 500));

      (data || []).forEach((row: any) => {
        const sizes = Array.isArray(row?.sizes) ? row.sizes : [];
        const bySize: Record<string, string> = {};
        let only = '';
        sizes.forEach((s: any) => {
          const sku = String(s?.skus?.[0] || '').trim();
          if (!sku) return;
          [s?.techSize, s?.wbSize].forEach((label: any) => {
            const key = normalizeHsSize(String(label || ''));
            if (key) bySize[key] = sku;
          });
        });
        if (sizes.length === 1) only = String(sizes[0]?.skus?.[0] || '').trim();
        out.set(Number(row.nm_id), { bySize, only });
      });
    }

    return out;
  };

  const pickChzLabelBarcode = (
    skus: Map<number, { bySize: Record<string, string>; only: string }>,
    row: FbsSupplyScanOrderRow,
  ) => {
    const card = skus.get(Number(row?.nmId || 0));
    if (!card) return '';
    const key = normalizeHsSize(String(row?.size || ''));
    return (key && card.bySize[key]) || card.only || '';
  };

  /** Последние четыре цифры стикера — крупная надпись на этикетке WB. */
  const getStickerTail = (row: FbsSupplyScanOrderRow) => {
    const digits = normalizeStickerDigits(String(row?.stickerDigits || row?.stickerText || ''));
    return digits.length >= 4 ? digits.slice(-4) : digits;
  };

  /** Начало того же номера — мелкая надпись над крупной, как у WB. */
  const getStickerHead = (row: FbsSupplyScanOrderRow) => {
    const digits = normalizeStickerDigits(String(row?.stickerDigits || row?.stickerText || ''));
    return digits.length > 4 ? digits.slice(0, -4) : '';
  };

  /**
   * PDF с этикетками по строкам поставки.
   *
   * Печатается не «свободная» марка из базы, а та, что уже отсканирована на
   * это задание: этикетку переклеивают на ту же вещь, и код обязан остаться
   * прежним. Какой именно макет — решает `kind`.
   */
  const buildChzLabelsPdf = async (
    items: Array<{ row: FbsSupplyScanOrderRow; code: string }>,
    layouts: { chz: ChzLabelLayout; tail: ChzTailLayout; combo: FbsComboLayout },
    skus: Map<number, { bySize: Record<string, string>; only: string }>,
    stickersByOrderId: Map<number, StickerImage>,
    kind: FbsLabelKind,
  ) => {
    // Библиотеки печати/Excel грузятся по требованию — не при открытии раздела.
    await Promise.all([ensurePdfLibs(), ensureBwip()]);
    const { jsPDF, autoTable, bwipjs } = lazyLibs;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [58, 40], compress: true });
    await addChzLabelFont(pdf);

    // jsPDF создаёт первую страницу сам — считаем её занятой только после
    // первой отрисовки, иначе документ начнётся с пустого листа.
    let pageUsed = false;
    const startPage = () => {
      if (pageUsed) pdf.addPage([58, 40], 'landscape');
      pageUsed = true;
    };

    for (const item of items) {
      const orderId = Number(String(item.row.orderId || '').trim());
      const sticker = Number.isFinite(orderId) ? stickersByOrderId.get(orderId) : undefined;

      // Совмещённая этикетка сама несёт коды задания — отдельная страница со
      // стикером WB для неё была бы вторым экземпляром того же.
      if (sticker && kind !== 'combo') {
        try {
          const data = await renderStickerImage(sticker);
          if (data) {
            startPage();
            pdf.addImage(data, 'PNG', 0, 0, 58, 40);
          }
        } catch (e) {
          console.warn('Стикер не отрисовался', orderId, e);
        }
      }

      startPage();
      try {
        if (kind === 'combo') {
          await drawFbsComboLabel(pdf, bwipjs, layouts.combo, {
            chzCode: item.code,
            stickerCode: String(sticker?.barcode || ''),
            partA: String(sticker?.partA || ''),
            partB: String(sticker?.partB || '') || getStickerTail(item.row),
            article: String(item.row.article || ''),
            size: String(item.row.size || ''),
          });
        } else if (kind === 'chz_tail') {
          await drawChzTailLabel(pdf, bwipjs, layouts.tail, {
            chzCode: item.code,
            barcode: pickChzLabelBarcode(skus, item.row),
            title: String(item.row.title || ''),
            article: String(item.row.article || ''),
            size: String(item.row.size || ''),
            stickerHead: String(sticker?.partA || '') || getStickerHead(item.row),
            stickerTail: String(sticker?.partB || '') || getStickerTail(item.row),
          });
        } else {
          await drawChzLabel(pdf, bwipjs, layouts.chz, {
            chzCode: item.code,
            barcode: pickChzLabelBarcode(skus, item.row),
            title: String(item.row.title || ''),
            article: String(item.row.article || ''),
            size: String(item.row.size || ''),
            supplierName: String(selectedSupplier?.name || ''),
          });
        }
      } catch (e) {
        console.warn('Этикетка не отрисовалась', item.row.orderId, e);
      }
    }

    return pdf;
  };

  /**
   * Общая печать этикеток ЧЗ: и по одной строке, и пакетом.
   *
   * Вкладку под результат открывает вызывающий — до первого await, пока жив
   * жест клика; иначе блокировщик всплывающих окон режет её молча.
   */
  const printChzLabels = async (
    rows: FbsSupplyScanOrderRow[],
    opts: { withStickers: boolean; fileName: string; tab: Window | null; kind?: FbsLabelKind },
  ) => {
    const kind: FbsLabelKind = opts.kind || 'chz';
    const items = rows
      .map((row) => ({
        row,
        code: normalizeDataMatrixText(String(findFbsScanSavedEntry(row, fbsScansBySticker)?.item?.honestSignCode || '')),
      }))
      .filter((item) => item.code);

    if (!items.length) {
      throw new Error('Ни у одной выбранной строки нет отсканированного ЧЗ — печатать нечего');
    }

    const { data: layoutRow } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'wb_label_layout_v1')
      .maybeSingle();
    const layouts = {
      chz: readChzLabelLayout(layoutRow?.value),
      tail: readChzTailLayout(layoutRow?.value),
      combo: readFbsComboLayout(layoutRow?.value),
    };

    const skus = await loadChzLabelSkus(
      selectedSupplierId,
      items.map((item) => Number(item.row.nmId || 0)),
    ).catch(() => new Map<number, { bySize: Record<string, string>; only: string }>());

    /*
     * Совмещённой этикетке данные стикера нужны всегда: она рисует QR и
     * штрихкод задания сама, а их содержимое знает только WB. Остальным
     * макетам стикер нужен, лишь когда его печатают отдельной страницей.
     */
    const needStickers = opts.withStickers || kind === 'combo';

    let stickersByOrderId = new Map<number, StickerImage>();
    if (needStickers) {
      const token = getSupplierToken();
      if (!token) {
        throw new Error(kind === 'combo'
          ? 'Токен API кабинета не найден — совмещённую этикетку без него не собрать'
          : 'Токен API кабинета не найден — снимите галочку «Стикеры WB»');
      }

      const orderIds = Array.from(new Set(
        items
          .map((item) => Number(String(item.row.orderId || '').trim()))
          .filter((id) => Number.isFinite(id) && id > 0),
      ));

      setFbsScanNotice({ type: 'info', text: `Запрашиваю стикеры у WB: 0 из ${orderIds.length}…` });
      stickersByOrderId = await fetchStickers(token, orderIds, (done, total) => {
        setFbsScanNotice({ type: 'info', text: `Запрашиваю стикеры у WB: ${done} из ${total}…` });
      });
    }

    if (kind === 'combo') {
      // Без содержимого кодов совмещённая этикетка — просто картинка с ЧЗ:
      // на приёмке её не примут. Лучше отказать до печати.
      const withCode = items.filter((item) => {
        const st = stickersByOrderId.get(Number(String(item.row.orderId || '').trim()));
        return Boolean(st?.barcode);
      }).length;
      if (withCode === 0) {
        throw new Error('WB не вернул содержимое кодов стикера — совмещённую этикетку печатать нельзя');
      }
    }

    setFbsScanNotice({ type: 'info', text: `Собираю PDF: этикеток ${items.length}…` });
    const pdf = await buildChzLabelsPdf(items, layouts, skus, stickersByOrderId, kind);

    const missingStickers = needStickers
      ? items.filter((item) => !stickersByOrderId.get(Number(String(item.row.orderId || '').trim()))).length
      : 0;
    const skipped = rows.length - items.length;
    const tail = [
      skipped > 0 ? `без ЧЗ пропущено: ${skipped}` : '',
      missingStickers > 0 ? `WB не отдал стикеров: ${missingStickers}` : '',
    ].filter(Boolean).join('; ');

    await printPdfDirect(pdf, { widthMm: 58, heightMm: 40 });

    setFbsScanNotice({
      type: 'success',
      text: `Этикеток ЧЗ: ${items.length}.${tail ? ` (${tail})` : ''} Отправлено в печать.`,
    });
  };

  /** Этикетка ЧЗ одной строки — когда её испортили при упаковке. */
  const printSingleChzLabel = async (row: FbsSupplyScanOrderRow) => {
    setFbsChzPrintingKey(row.storageKey);
    try {
      await printChzLabels([row], {
        withStickers: false,
        fileName: `ЧЗ ${row.orderId || row.storageKey}.pdf`,
        tab: null,
        kind: fbsLabelKind,
      });
    } catch (e: any) {
      setFbsScanNotice({ type: 'error', text: e?.message || 'Не удалось напечатать этикетку ЧЗ' });
    } finally {
      setFbsChzPrintingKey('');
    }
  };

  /**
   * Лист подбора по отмеченным строкам.
   *
   * Отдельный файл, а не страницы в том же PDF: этикетки уходят на
   * термопринтер 58×40, лист — на обычный A4, и печатаются они на разных
   * принтерах.
   */
  const buildSelectedPickingListPdf = async (rows: FbsSupplyScanOrderRow[]) => {
    // Библиотеки печати/Excel грузятся по требованию — не при открытии раздела.
    await ensurePdfLibs();
    const { jsPDF, autoTable } = lazyLibs;
    const doc = new jsPDF();
    await addChzLabelFont(doc);
    try { doc.setFont('Roboto'); } catch {}

    const urls = Array.from(new Set(rows.flatMap((row) => getFbsRowPhotoCandidates(row)).filter(Boolean)));
    const images = await loadImageDataUrls(urls, 6);

    const body = rows.map((row) => {
      const img = getFbsRowPhotoCandidates(row).map((u) => images.get(u) || '').find(Boolean) || '';
      return [
        String(row.orderId || '—'),
        img,
        String(row.title || ''),
        String(row.size || ''),
        String(row.article || ''),
        // Стикер, а не ЧЗ: по листу ходят по складу и сверяют наклейку на
        // вещи. Марка тут только мешала бы — её на полке никто не читает.
        getSafeStickerText(row),
      ];
    });

    const supplyName = supplies.find((s) => s.id === activeSupplyId)?.name || activeSupplyId || '';
    doc.setFontSize(15);
    doc.text(`Лист подбора (выбранные) ${supplyName}`, 14, 18);
    doc.setFontSize(10);
    doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, 14, 24);
    doc.text(`Строк: ${rows.length}`, 100, 24);

    (autoTable as any)(doc, {
      startY: 30,
      head: [['№ задания', 'Фото', 'Наименование', 'Размер', 'Артикул', 'Стикер']],
      body,
      styles: { fontSize: 7, cellPadding: 2, valign: 'middle', font: 'Roboto' },
      headStyles: { font: 'Roboto', fontStyle: 'normal' },
      bodyStyles: { font: 'Roboto', fontStyle: 'normal' },
      rowPageBreak: 'avoid',
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 20, minCellHeight: 24 },
        2: { minCellWidth: 58 },
        3: { cellWidth: 14, halign: 'center' },
        4: { cellWidth: 24 },
        5: { cellWidth: 34 },
      },
      didParseCell: (data: any) => {
        if (data.column.index === 1 && data.section === 'body') {
          data.cell.text = [];
        }
        // Номер задания и ЧЗ — тем же шрифтом, что и в общем листе подбора:
        // по ним ищут в PDF, а подстановки Roboto ломают поиск.
        if (data.section === 'body' && [0, 5].includes(data.column.index)) {
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
              // одна непрогрузившаяся картинка не повод ронять весь лист
            }
          }
        }
      },
    });

    return doc;
  };

  /**
   * Пакетная печать по отмеченным строкам.
   *
   * Что печатать, выбирают в меню у кнопки: стикеры, лист подбора или оба.
   * Раньше это решали две галочки, и одна из них по умолчанию была включена —
   * стикеры выходили, даже когда нужен был только лист.
   */
  const printSelectedFbsRows = async (mode: 'labels' | 'picking' | 'both') => {
    const rows = fbsScanSelectedRows;
    setFbsPrintMenuOpen(false);
    if (!rows.length) {
      setFbsScanNotice({ type: 'error', text: 'Не отмечено ни одной строки' });
      return;
    }

    const withLabels = mode !== 'picking';
    const withPicking = mode !== 'labels';

    setFbsScanBulkBusy(true);
    try {
      /*
       * Лист подбора — всегда файлом, и первым.
       *
       * Два окна печати подряд браузер не показывает: пока открыто окно со
       * стикерами, второе молча пропадало, и «Стикеры + Лист» печатали только
       * стикеры. Файл скачивается без окна, а печатают его, когда удобно.
       */
      if (withPicking) {
        setFbsScanNotice({ type: 'info', text: 'Собираю лист подбора…' });
        const picking = await buildSelectedPickingListPdf(rows);
        picking.save(`Лист подбора ${activeSupplyId || ''} ${rows.length}.pdf`);
        setFbsScanNotice({ type: 'success', text: `Лист подбора на ${rows.length} заданий скачан.` });
      }
      if (withLabels) {
        await printChzLabels(rows, {
          // У совмещённой этикетки стикер уже внутри — второй экземпляр не нужен.
          withStickers: fbsBulkWithStickers && fbsLabelKind !== 'combo',
          fileName: `Этикетки ${activeSupplyId || ''} ${rows.length}.pdf`,
          tab: null,
          kind: fbsLabelKind,
        });
      }
    } catch (e: any) {
      setFbsScanNotice({ type: 'error', text: e?.message || 'Не удалось напечатать выбранное' });
    } finally {
      setFbsScanBulkBusy(false);
    }
  };

  const downloadFbsScanTemplateExcel = async () => {
    // Библиотеки печати/Excel грузятся по требованию — не при открытии раздела.
    await ensureExcel();
    const { ExcelJS } = lazyLibs;
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

  /**
   * Скан-файл для загрузки в WB.
   *
   * Именно CSV, а не Excel: ExcelJS вырезает символ 29 при записи xlsx (XML его
   * не допускает), поэтому из Excel-файла КИЗ уходит без GS-разделителей и WB
   * отвечает «Нет GS-разделителя». В CSV разделитель остаётся байтом как есть.
   */
  const downloadFbsScanResultCsv = async () => {
    if (!activeSupplyId) return;
    try {
      const [{ rows }, savedMap] = await Promise.all([
        loadPreparedFbsScanRows(activeSupplyId, selectedSupplierId),
        loadFbsSupplyScanMap(activeSupplyId, selectedSupplierId),
      ]);
      if (!rows.length) {
        setFbsScanNotice({ type: 'error', text: 'Не удалось сформировать скан файл: в поставке нет строк.' });
        return;
      }
      assertFbsScanRowsReadyForExport(rows, 'скан файл');
      setFbsScanRows(rows);
      applyFbsScans(savedMap);

      const rowsWithKiz = getUniqueFbsScanRows(rows).filter((row) => Boolean(findFbsScanSavedEntry(row, savedMap)?.item?.honestSignCode));
      if (!rowsWithKiz.length) {
        setFbsScanNotice({ type: 'error', text: 'Скан файл пока пустой: нет строк с заполненным КИЗ.' });
        return;
      }

      const escapeCsv = (value: string) => {
        const text = String(value ?? '');
        return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
      };

      let restored = 0;
      const lines = [['№ задания', 'Стикер', 'КИЗ'].join(';')];
      rowsWithKiz.forEach((row) => {
        const rawCode = String(findFbsScanSavedEntry(row, savedMap)?.item?.honestSignCode || '');
        const code = restoreDataMatrixGs(rawCode);
        if (code.includes(GS_SEPARATOR)) restored += 1;
        lines.push([
          escapeCsv(String(row.orderId || '')),
          escapeCsv(String(row.stickerText || '').replace(/_/g, ' ')),
          escapeCsv(code),
        ].join(';'));
      });

      // BOM — чтобы Excel открыл кириллицу правильно, если файл захотят посмотреть.
      const blob = new Blob(['﻿' + lines.join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scan-file-${String(activeSupplyId || 'supply')}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      setFbsScanNotice(restored === rowsWithKiz.length
        ? { type: 'success', text: `Скан файл для WB выгружен: ${rowsWithKiz.length} строк, GS-разделители восстановлены во всех кодах.` }
        : { type: 'error', text: `Скан файл выгружен: ${rowsWithKiz.length} строк, но разделители удалось восстановить только в ${restored}. Остальные коды имеют нестандартную структуру — проверьте их вручную.` });
    } catch (e: any) {
      setFbsScanNotice({ type: 'error', text: e?.message || 'Не удалось скачать скан файл' });
    }
  };

  const downloadFbsScanResultExcel = async () => {
    // Библиотеки печати/Excel грузятся по требованию — не при открытии раздела.
    await ensureExcel();
    const { ExcelJS } = lazyLibs;
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
      applyFbsScans(savedMap);
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
          // GS обязателен для WB, но в ячейку он кладётся только через escape.
          encodeGsForExcel(restoreDataMatrixGs(String(findFbsScanSavedEntry(row, savedMap)?.item?.honestSignCode || ''))),
        ]);
      });
      ws.columns = [
        { width: 18 },
        { width: 18 },
        { width: 60 },
      ];
      ws.getRow(1).font = { bold: true } as any;

      const restored = rowsWithKiz.filter((row) => restoreDataMatrixGs(
        String(findFbsScanSavedEntry(row, savedMap)?.item?.honestSignCode || ''),
      ).includes(GS_SEPARATOR)).length;

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scan-file-${String(activeSupplyId || 'supply')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      setFbsScanNotice(restored === rowsWithKiz.length
        ? { type: 'success', text: `Скан файл выгружен: ${rowsWithKiz.length} строк, GS-разделители проставлены во всех кодах. Файл не открывайте в Excel перед загрузкой — он вырежет разделители.` }
        : { type: 'error', text: `Скан файл выгружен: ${rowsWithKiz.length} строк, но разделители удалось проставить только в ${restored}. Остальные коды имеют нестандартную структуру.` });
    } catch (e: any) {
      setFbsScanNotice({ type: 'error', text: e?.message || 'Не удалось скачать скан файл' });
    }
  };

  // Авто-submit по окончании «пачки» символов сканера (если сканер не шлёт Enter).
  const scanBurstRef = useRef<any>(null);
  const onScanInputBurst = () => {
    if (scanBurstRef.current) clearTimeout(scanBurstRef.current);
    scanBurstRef.current = setTimeout(() => {
      const v = String(fbsScanInputRef.current?.value || '').trim();
      if (v.length >= 4) fbsScanInputRef.current?.form?.requestSubmit();
    }, 140);
  };

  // Очистка поля скана: чистим uncontrolled-input через ref + сбрасываем легаси-состояние.
  const clearScanInput = () => {
    try { if (fbsScanInputRef.current) fbsScanInputRef.current.value = ''; } catch {}
    setFbsScanInputValue('');
  };

  /** Строка поставки по значению стикера — одинаково для обоих шагов сканирования. */
  const findFbsRowByStickerScan = (raw: string): FbsSupplyScanOrderRow | null => {
    const scanText = normalizeScannedStickerLookupKey(raw);
    const stickerDigits = normalizeStickerDigits(raw);
    if (!scanText && !stickerDigits) return null;

    return (
      fbsScanRows.find((item) => {
        const rowScanText = normalizeScannedStickerLookupKey(item.stickerScanText || '');
        if (scanText && rowScanText && rowScanText === scanText) return true;
        if (stickerDigits && item.stickerDigits === stickerDigits) return true;
        if (scanText && normalizeScannedStickerLookupKey(item.stickerText || '') === scanText) return true;
        return false;
      }) || null
    );
  };

  const handleFbsScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (scanBurstRef.current) { clearTimeout(scanBurstRef.current); scanBurstRef.current = null; }
    const typed = String((fbsScanInputRef.current?.value ?? fbsScanInputValue) || '').trim();
    if (!typed) return;

    // Поставка ещё грузится (например, после переключения закладки): строк нет,
    // и скан ушёл бы в «не найдено». Держим его и отправим, когда загрузится.
    if (fbsScanLoading || fbsScanSwitchRef.current) {
      fbsScanQueuedRef.current = typed;
      clearScanInput();
      setFbsScanNotice({ type: 'info', text: 'Поставка загружается — скан обработаю, как только она откроется.' });
      return;
    }

    /*
     * Русская раскладка.
     *
     * Сканер изображает нажатия клавиш, и при русской раскладке код приходит
     * кириллицей — не сходится ни со стикером, ни с маркой. Раньше это выглядело
     * как «товар не сканируется», хотя достаточно было переключить язык.
     * Чиним сами, но говорим об этом: иначе раскладку так и не переключат, а на
     * ТСД и в других окнах она подведёт снова.
     */
    const raw = fixCyrillicKeyboardLayout(typed);
    const layoutFixed = raw !== typed;

    // Новый скан — прежнее предложение «записать всё равно» больше не про него.
    setFbsScanOverride(null);

    if (layoutFixed) {
      setFbsLayoutHint(true);
      void logFbsScanReject({
        supplierId: selectedSupplierId,
        supplyId: activeSupplyId || '',
        orderId: fbsPendingStickerRow?.orderId || '',
        rawValue: typed,
        reason: 'layout_fixed',
        detail: 'скан пришёл в русской раскладке, код исправлен автоматически',
      });
    }

    if (fbsScanMode === 'sticker') {
      const completeness = getFbsScanCompletenessStats(fbsScanRows);
      if (!completeness.isFullyReady) {
        setFbsScanNotice({ type: 'error', text: `Сканирование временно заблокировано: поставка загружена не полностью. Сейчас есть стикеров ${completeness.rowsWithSticker}/${completeness.totalRows}, «Стикер при считывании» ${completeness.rowsWithScanText}/${completeness.totalRows}. Сначала добейся полной загрузки поставки.` });
        void logFbsScanReject({
          supplierId: selectedSupplierId,
          supplyId: activeSupplyId || '',
          rawValue: raw,
          reason: 'supply_not_ready',
          detail: `стикеров ${completeness.rowsWithSticker}/${completeness.totalRows}`,
        });
        clearScanInput();
        return;
      }

      const row = findFbsRowByStickerScan(raw);
      if (!row) {
        // Задание из отложенной поставки — переключаемся туда и продолжаем там.
        const bookmark = findFbsScanBookmarkBySticker(raw);
        if (bookmark) {
          fbsScanReplayStickerRef.current = raw;
          setFbsScanNotice({ type: 'info', text: `Стикер из поставки «${bookmark.supplyName}» (${bookmark.supplierName}) — переключаю скан туда…` });
          clearScanInput();
          switchFbsScanBookmark(bookmark);
          return;
        }
        setFbsScanNotice({ type: 'error', text: 'Стикер не найден в текущей поставке. Проверь файл поставки или сам скан.' });
        void logFbsScanReject({
          supplierId: selectedSupplierId,
          supplyId: activeSupplyId || '',
          rawValue: raw,
          reason: 'sticker_not_found',
          detail: `строк в поставке: ${fbsScanRows.length}`,
        });
        fbsCue('error');
        clearScanInput();
        return;
      }

      /*
       * У задания марка уже есть — второй раз его не сканируем.
       *
       * Иначе повторный скан стикера молча перезаписывал марку: товар из
       * соседней кучи или стикер, поднесённый дважды, заменял верный код.
       * Если марку правда нужно сменить — «Сбросить ЧЗ» в строке задания.
       */
      const alreadyScanned = findFbsScanSavedEntry(row, fbsScansRef.current)?.item?.honestSignCode
        || fbsScanSavingKeysRef.current[row.storageKey];
      if (alreadyScanned) {
        setFbsScanNotice({
          type: 'error',
          text: `У заказа ${row.orderId} ЧЗ уже отсканирован — повторно не сканируется. Сканируйте следующий стикер. Сменить марку: «Сбросить ЧЗ» в строке заказа.`,
        });
        void logFbsScanReject({
          supplierId: selectedSupplierId,
          supplyId: activeSupplyId || '',
          orderId: row.orderId,
          rawValue: raw,
          reason: 'sticker_already_scanned',
          detail: 'у задания уже есть ЧЗ',
        });
        fbsCue('error');
        clearScanInput();
        return;
      }

      setFbsScanNotice({ type: 'success', text: `Найден заказ ${row.orderId}. Теперь сканируйте ЧЗ.` });
      setFbsPendingStickerRow(row);
      setFbsScanMode('honest_sign');
      fbsCue('chz');
      clearScanInput();
      return;
    }

    if (!activeSupplyId || !fbsPendingStickerRow) {
      setFbsScanMode('sticker');
      clearScanInput();
      return;
    }

    const honestSignCode = normalizeDataMatrixText(raw);
    if (!honestSignCode) {
      setFbsScanNotice({ type: 'error', text: 'Не удалось распознать код Честного знака' });
      clearScanInput();
      return;
    }

    /*
     * На этом шаге ждём марку — и только марку.
     *
     * Раньше сюда проходило что угодно. По базе видно, чем это кончалось: из
     * 196 «кодов», которые марками не являются, 107 равны стикеру того же
     * заказа, а 75 — стикеру соседнего. То есть сборщик подносил стикер второй
     * раз (или уже следующий товар), строка закрывалась мусором, настоящая
     * марка не считывалась, а следующий скан приходил в режим ЧЗ и ломал всю
     * цепочку — товар «переставал сканироваться».
     */
    const stickerRow = findFbsRowByStickerScan(raw);
    if (stickerRow) {
      const samePending = stickerRow.storageKey === fbsPendingStickerRow.storageKey;
      const text = samePending
        ? `Это стикер того же заказа ${stickerRow.orderId}, а не честный знак. Найдите на упаковке код маркировки (длинный DataMatrix) и отсканируйте его.`
        : `Это стикер другого заказа (${stickerRow.orderId}). У заказа ${fbsPendingStickerRow.orderId} честный знак ещё не считан — отсканируйте марку с товара в руках или нажмите «Сбросить».`;
      setFbsScanNotice({ type: 'error', text });
      setFbsScanFailedKeys((prev) => ({ ...prev, [fbsPendingStickerRow.storageKey]: text }));
      void logFbsScanReject({
        supplierId: selectedSupplierId,
        supplyId: activeSupplyId || '',
        orderId: fbsPendingStickerRow.orderId,
        rawValue: raw,
        reason: 'sticker_instead_of_chz',
        detail: samePending ? 'стикер того же заказа' : `стикер заказа ${stickerRow.orderId}`,
      });
      fbsCue('error');
      clearScanInput();
      return;
    }

    // Короткая строка маркой быть не может: настоящий ЧЗ — это 80+ символов.
    // Так отсекаются и товарный штрихкод EAN-13, и случайно набранное «1».
    if (honestSignCode.length < MIN_HONEST_SIGN_LENGTH) {
      const text = `Это не похоже на честный знак: в коде ${honestSignCode.length} символов, а в марке их больше ${MIN_HONEST_SIGN_LENGTH}. Похоже, отсканирован штрихкод товара.`;
      setFbsScanNotice({ type: 'error', text });
      void logFbsScanReject({
        supplierId: selectedSupplierId,
        supplyId: activeSupplyId || '',
        orderId: fbsPendingStickerRow.orderId,
        rawValue: raw,
        reason: 'not_a_chz',
        detail: `длина ${honestSignCode.length}`,
      });
      fbsCue('error');
      clearScanInput();
      return;
    }

    // Оптимистично: сразу обновляем UI и освобождаем поле для следующего скана,
    // а запись в БД (dup-проверка + upsert карты + синк) делаем в фоне по очереди.
    const pendingRow = fbsPendingStickerRow;
    const supplyId = activeSupplyId;
    const supplierId = selectedSupplierId;

    /*
     * Дубль внутри этой же поставки.
     *
     * Проверка по базе поставщика есть, но она уходит в фоновую очередь и
     * успевает ответить уже после того, как второй скан принят. Поэтому один
     * и тот же ЧЗ можно было повесить на два задания подряд — а это пересорт:
     * на две вещи уезжает один код маркировки.
     *
     * Здесь сверяемся синхронно с картой текущей поставки — до всякой сети.
     */
    const duplicate = Object.values(fbsScansRef.current).find(
      (item) =>
        item &&
        item.storageKey !== pendingRow.storageKey &&
        normalizeDataMatrixText(String(item.honestSignCode || '')) === honestSignCode,
    );
    if (duplicate) {
      fbsCue('error');
      const where = `${duplicate.orderId || duplicate.storageKey}${duplicate.article ? `, ${duplicate.article}` : ''}`;
      // Помечаем саму строку, а не только всплывающее сообщение: уведомление
      // сменится следующим сканом, а разбираться с дублем сборщик будет по списку.
      setFbsScanFailedKeys((prev) => ({
        ...prev,
        [pendingRow.storageKey]: `Дубль ЧЗ — этот код уже стоит на заказе ${where}. Нужен новый код с товара в руках.`,
      }));
      setFbsScanNotice({
        type: 'error',
        text: `Дубль ЧЗ: код уже отсканирован на заказе ${where}. Отсканируйте новый честный знак — тот, что на товаре в руках.`,
      });
      void logFbsScanReject({
        supplierId,
        supplyId,
        orderId: pendingRow.orderId,
        rawValue: raw,
        reason: 'duplicate_in_supply',
        detail: `код уже на заказе ${where}`,
      });
      clearScanInput();
      return;
    }

    // База — ref, а не состояние: при быстром сканере два скана попадают в один
    // рендер, и карта из замыкания не содержит предыдущий код.
    const next = { ...fbsScansRef.current };
    for (const key of Object.keys(next)) {
      const item = next[key];
      const sameOrder = String(item?.orderId || '').trim() && String(item?.orderId || '').trim() === String(pendingRow.orderId || '').trim();
      const sameSticker = normalizeStickerDigits(String(item?.stickerDigits || '')) && normalizeStickerDigits(String(item?.stickerDigits || '')) === normalizeStickerDigits(String(pendingRow.stickerDigits || ''));
      const sameScan = normalizeScanStickerText(String(item?.stickerScanText || '')) && normalizeScanStickerText(String(item?.stickerScanText || '')) === normalizeScanStickerText(String(pendingRow.stickerScanText || ''));
      if (sameOrder || sameSticker || sameScan) delete next[key];
    }
    next[pendingRow.storageKey] = {
      storageKey: pendingRow.storageKey,
      stickerDigits: pendingRow.stickerDigits,
      stickerScanText: pendingRow.stickerScanText,
      honestSignCode,
      updatedAt: new Date().toISOString(),
      orderId: pendingRow.orderId,
      title: pendingRow.title,
      article: pendingRow.article,
      size: pendingRow.size,
    };

    // мгновенный отклик: строка занята, поле свободно для следующего скана,
    // но статус — «сохраняется», пока база не подтвердит запись.
    applyFbsScans(next);
    setFbsScanSavingKeys((prev) => ({ ...prev, [pendingRow.storageKey]: true }));
    setFbsScanFailedKeys((prev) => {
      const rest = { ...prev };
      delete rest[pendingRow.storageKey];
      return rest;
    });
    setFbsScanNotice({ type: 'success', text: `ЧЗ принят для заказа ${pendingRow.orderId}, сохраняю…` });
    setFbsPendingStickerRow(null);
    setFbsScanMode('sticker');
    // Голос здесь не даём: через мгновение придёт подтверждение записи с
    // «товар отсканирован», и две фразы наложились бы друг на друга.
    clearScanInput();
    setTimeout(() => { try { fbsScanInputRef.current?.focus(); } catch {} }, 0);

    // фоновая запись, сериализованная через очередь (быстрые сканы не перетирают карту)
    fbsScanSaveQueueRef.current = fbsScanSaveQueueRef.current
      .catch(() => {})
      .then(async () => {
        const existsInSupplierScannedBase = await isFbsCodeAlreadyScannedForSupplier(honestSignCode, supplierId);
        if (existsInSupplierScannedBase) {
          dropFbsScanEntry(pendingRow.storageKey);
          fbsCue('error');

          /*
           * Отказ перестал быть тупиком.
           *
           * Код мог быть отсканирован раньше законно: товар вернулся и уезжает
           * снова, или его считали на приёмке ФБО — там пишется та же общая
           * база. Раньше сборщик в такой ситуации просто не мог отправить вещь.
           * Теперь показываем, где код стоял, и даём записать под ответственность.
           */
          const previous = await findFbsOrderByCode(supplierId, honestSignCode).catch(() => null);
          const where = previous
            ? `заказ ${previous.orderId}${previous.article ? `, ${previous.article}` : ''}, поставка ${previous.supplyId || '—'} от ${new Date(previous.scannedAt).toLocaleDateString('ru-RU')}`
            : 'в общей базе кабинета (возможно, приёмка ФБО)';

          setFbsScanNotice({
            type: 'error',
            text: `Этот ЧЗ уже отсканирован раньше: ${where}. Скан отменён. Если это возврат или повторная отправка — нажмите «Записать всё равно».`,
          });
          setFbsScanOverride({ row: pendingRow, code: honestSignCode, where });
          void logFbsScanReject({
            supplierId,
            supplyId,
            orderId: pendingRow.orderId,
            rawValue: honestSignCode,
            reason: 'already_in_supplier_base',
            detail: where,
          });
          return;
        }
        /*
         * Строка в «Базу заказов» — первой.
         *
         * Раньше сначала писался весь снапшот поставки, а строка шла следом и
         * права уронить скан не имела. Теперь порядок обратный: строка и есть
         * запись о скане, и её ошибка отменяет товар. Снапшот стал кэшем и
         * уходит пачкой — из строк он всегда восстановим, из него строки нет.
         */
        await upsertFbsOrderCode({
          supplierId,
          supplyId,
          orderId: pendingRow.orderId,
          chzCode: honestSignCode,
          stickerDigits: pendingRow.stickerDigits,
          stickerText: pendingRow.stickerScanText,
          nmId: pendingRow.nmId ?? null,
          article: pendingRow.article,
          size: pendingRow.size,
          title: pendingRow.title,
        });

        const syncResult = await syncFbsScannedCodesToUnifiedBase([honestSignCode], supplierId);
        const foreignCode = Boolean(syncResult?.foreignCodes?.length);

        /*
         * Марка — сразу в WB, на это задание.
         *
         * Только после того, как скан записан у нас: если отправить раньше, а
         * запись упадёт, у WB останется марка, которой в нашей базе нет. Марку
         * чужого кабинета не отправляем — сначала человек должен её проверить.
         */
        if (fbsWbAutoSendRef.current && !foreignCode) {
          void pushFbsSgtinsToWb([{ orderId: pendingRow.orderId, code: honestSignCode }], supplierId);
        }

        if (foreignCode) {
          setFbsScanNotice({
            type: 'error',
            text: 'Эта марка в общей базе числится за другим кабинетом. Товар записан, но проверьте, тот ли это код: '
              + 'отправлять чужую марку нельзя, а повторно она уже не отловится.',
          });
          void logFbsScanReject({
            supplierId,
            supplyId,
            orderId: pendingRow.orderId,
            rawValue: honestSignCode,
            reason: 'code_of_other_cabinet',
            detail: 'код принадлежит другому поставщику в общей базе',
          });
        }

        // Снапшот — отложенно: сборщик сканирует очередью, и держать его перед
        // каждым товаром на сетевом запросе в полтораста килобайт незачем.
        scheduleFbsScanMapSave(supplyId, supplierId);

        setFbsScanSavingKeys((prev) => {
          const rest = { ...prev };
          delete rest[pendingRow.storageKey];
          return rest;
        });
        // Товар закрыт по-настоящему: код в базе, а не только на экране.
        fbsCue('ready');
      })
      .catch((e: any) => {
        // Откатываем только свою строку: соседние сканы к этой ошибке
        // отношения не имеют, и стирать их нельзя.
        dropFbsScanEntry(pendingRow.storageKey);
        fbsCue('error');
        setFbsScanFailedKeys((prev) => ({
          ...prev,
          [pendingRow.storageKey]: `ЧЗ НЕ сохранён — сканируйте заново (${e?.message || 'ошибка записи'})`,
        }));
        setFbsScanNotice({ type: 'error', text: e?.message || 'Ошибка сохранения ЧЗ (скан отменён)' });
      });
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
      
      // Не выбираем поставку сами, если открыт или открывается скан: список
      // приходит через секунду-две, и подмена поставки выбила бы скан закладки.
      if (!activeSupplyId && !fbsScanSupplyIdRef.current) {
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
    // Библиотеки печати/Excel грузятся по требованию — не при открытии раздела.
    await ensureExcel();
    const { ExcelJS } = lazyLibs;
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
              .select(PHOTO_MAP_SELECT)
              .eq('supplier_id', selectedSupplierId)
              .limit(10000);
            const { byNm, byArticle } = buildPhotoMaps(cacheRows || []);
            setCalcPhotoByNmId(byNm);
            setCalcPhotoByArticle(byArticle);
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
    // Библиотеки печати/Excel грузятся по требованию — не при открытии раздела.
    await ensurePdfLibs();
    const { jsPDF, autoTable } = lazyLibs;
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
    // Библиотеки печати/Excel грузятся по требованию — не при открытии раздела.
    await ensureExcel();
    const { ExcelJS } = lazyLibs;
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

  /**
   * Отменённые задания — по статусам WB.
   *
   * Одна проверка на печать стикеров, выдачу ЧЗ и оба листа подбора: отменённое
   * задание не поедет, и ни марка, ни строка в листе ему не нужны. checked=false
   * значит, что WB статусы не отдал, — тогда ничего не отсекаем, но говорим об этом.
   */
  const fetchCanceledFbsOrders = async (ids: number[]) => {
    const canceled = new Map<number, string>();
    const token = getSupplierToken();
    const clean = Array.from(new Set(ids.filter((id) => Number.isFinite(id) && id > 0)));
    if (!token || !clean.length) return { canceled, checked: false };
    try {
      for (let i = 0; i < clean.length; i += 1000) {
        const res = await withTimeout(fetch('https://marketplace-api.wildberries.ru/api/v3/orders/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: token },
          body: JSON.stringify({ orders: clean.slice(i, i + 1000) }),
        }), 30000, 'Таймаут статусов заданий WB');
        if (!res.ok) throw new Error(`WB статусы: ${res.status}`);
        const json = await res.json();
        for (const st of json?.orders || []) {
          const wbStatus = String(st?.wbStatus || '').toLowerCase();
          const supplierStatus = String(st?.supplierStatus || '').toLowerCase();
          if (supplierStatus === 'cancel' || wbStatus.startsWith('canceled') || wbStatus === 'declined_by_client' || wbStatus === 'defect') {
            canceled.set(Number(st?.id), wbStatus || supplierStatus);
          }
        }
      }
      return { canceled, checked: true };
    } catch (e) {
      console.warn('статусы заданий WB не получены', e);
      return { canceled, checked: false };
    }
  };

  /** Лист подбора поставки. Без аргумента — текущая, с ним — любая (пакетная выгрузка). */
  const generatePickingList = async (supplyIdArg?: string) => {
    // Библиотеки печати/Excel грузятся по требованию — не при открытии раздела.
    await ensurePdfLibs();
    const { jsPDF, autoTable } = lazyLibs;
    const pickingSupplyId = String(supplyIdArg || activeSupplyId || '');
    if (!pickingSupplyId) return;
    setLoading(true);
    try {
      // 1. Fetch orders for this supply via robust resolver with fallback chain
      let supplyOrdersRaw = await withTimeout(fetchOrdersForSupply(pickingSupplyId, { enrich: true, fresh: true, cacheTtlMs: SUPPLY_ORDERS_CACHE_MS }), 30000, 'Таймаут загрузки заказов (1)');
      if (!supplyOrdersRaw || supplyOrdersRaw.length === 0) {
        supplyOrdersRaw = await withTimeout(fetchOrdersForSupply(pickingSupplyId, { enrich: false, fresh: true, cacheTtlMs: SUPPLY_ORDERS_CACHE_MS }), 30000, 'Таймаут загрузки заказов (2)');
      }
      if (!supplyOrdersRaw || supplyOrdersRaw.length === 0) {
        throw new Error('По выбранной поставке не найдены заказы для листа подбора');
      }

      const targetSupplyId = pickingSupplyId.trim().toLowerCase();

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

      const mappedOrders = relaxedFiltered
        .map((o: any) => ({
          ...o,
          title: o.title || o.subject || 'Без названия',
          brand: o.brand || o.brandName || '',
          size: o.size || o.techSize || o.wbSize || '-',
          color: o.color || '-',
          article: o.article || o.vendorCode || '-',
        }));

      // Отменённые задания в лист не попадают: собирать их не нужно.
      const pickingCancel = await fetchCanceledFbsOrders(
        mappedOrders.map((o: any) => Number(o.id ?? o.orderId ?? o.order_id)),
      );
      const supplyOrders = mappedOrders.filter((o: any) => !pickingCancel.canceled.has(Number(o.id ?? o.orderId ?? o.order_id)));
      if (supplyOrders.length === 0) {
        throw new Error('Все задания поставки отменены — лист подбора пуст');
      }

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
      
      const supplyName = supplies.find(s => s.id === pickingSupplyId)?.name || pickingSupplyId;

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
          // Только стикер: по листу сверяют наклейку на вещи, марку там не читают.
          const stickerText = formatStickerDigits(stickerRaw || '');
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
              stickerText
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
          head: [['№ задания', 'Фото', 'Наименование', 'Размер', 'Цвет', 'Артикул', 'Стикер']],
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
      
      doc.save(`Лист подбора ${String(supplyName || '').replace(/[\\/:*?"<>|]+/g, '_')} ${sortedSupplyOrders.length}.pdf`);
      setSuccessMsg(
        `Лист подбора на ${sortedSupplyOrders.length} заказов скачан`
        + (pickingCancel.canceled.size ? `. Отменённые не вошли: ${pickingCancel.canceled.size}` : '')
        + (pickingCancel.checked ? '' : '. Статусы WB не проверены — отменённые могли попасть в лист'),
      );
      setTimeout(() => setSuccessMsg(null), pickingCancel.canceled.size || !pickingCancel.checked ? 8000 : 2500);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateGroupedSupplierPickingList = async () => {
    // Библиотеки печати/Excel грузятся по требованию — не при открытии раздела.
    await ensurePdfLibs();
    const { jsPDF, autoTable } = lazyLibs;
    if (!activeSupplyId) return;
    setLoading(true);
    try {
      // For grouped picking we need the full supply content, not a possibly partial direct payload.
      let supplyOrdersRaw = await withTimeout(fetchOrdersForSupply(activeSupplyId, { enrich: true, fresh: true, cacheTtlMs: SUPPLY_ORDERS_CACHE_MS }), 30000, 'Таймаут загрузки заказов (групп.) 1');
      if (!supplyOrdersRaw || supplyOrdersRaw.length === 0) {
        supplyOrdersRaw = await withTimeout(fetchOrdersForSupply(activeSupplyId, { enrich: false, fresh: true, cacheTtlMs: SUPPLY_ORDERS_CACHE_MS }), 30000, 'Таймаут загрузки заказов (групп.) 2');
      }
      if (!supplyOrdersRaw || supplyOrdersRaw.length === 0) {
        throw new Error('По выбранной поставке не найдены заказы');
      }

      const groupedCancel = await fetchCanceledFbsOrders(
        supplyOrdersRaw.map((o: any) => Number(o.id ?? o.orderId ?? o.order_id)),
      );
      // Отменённые задания в лист не попадают: собирать их не нужно.
      const supplyOrders = supplyOrdersRaw
        .filter((o: any) => !groupedCancel.canceled.has(Number(o.id ?? o.orderId ?? o.order_id)))
        .map((o: any) => ({
          ...o,
          title: o.title || o.subject || 'Без названия',
          size: o.size || o.techSize || o.wbSize || '-',
          color: String(o.color || '-').replace(/[\r\n]+/g, ' / ').replace(/\s{2,}/g, ' ').trim(),
          article: o.article || o.vendorCode || '-',
        }));
      if (supplyOrders.length === 0) {
        throw new Error('Все задания поставки отменены — лист подбора пуст');
      }

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

      doc.save(`Лист подбора (групп.) ${String(supplyName || '').replace(/[\\/:*?"<>|]+/g, '_')} ${rows.length}.pdf`);
      if (groupedCancel.canceled.size || !groupedCancel.checked) {
        setSuccessMsg(
          `Лист подбора (групп.) скачан`
          + (groupedCancel.canceled.size ? `. Отменённые не вошли: ${groupedCancel.canceled.size}` : '')
          + (groupedCancel.checked ? '' : '. Статусы WB не проверены — отменённые могли попасть в лист'),
        );
        setTimeout(() => setSuccessMsg(null), 8000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateSupplyBarcode = async () => {
    // Библиотеки печати/Excel грузятся по требованию — не при открытии раздела.
    await Promise.all([ensurePdfLibs(), ensureBwip()]);
    const { jsPDF, autoTable, bwipjs } = lazyLibs;
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
        await printPdfDirect(doc, { widthMm: 100, heightMm: 60 });

    } catch (err: any) {
        setError(err.message);
    }
  };

  /**
   * Свободные марки кабинета из базы кодов, самые старые первыми.
   *
   * Подходящую заданию марку выбирает matchChzCodeForProduct — по категории,
   * полу и размеру.
   */
  const takeFreeChzCodes = async (
    supplierId: string,
    count: number,
  ): Promise<Array<{ code: string; category: string; gender: string }>> => {
    if (!supplierId || count <= 0) return [];

    /*
     * Вся свободная база поставщика, а не «count × 4 самых старых».
     *
     * Подбор идёт по категории, полу и размеру: если старейшие коды — жилеты,
     * а печатаем костюмы, из урезанной выборки не подошло бы ничего, хотя
     * костюмные коды в базе есть. Постранично: PostgREST отдаёт по 1000.
     */
    const data: any[] = [];
    for (let from = 0; from < 50_000; from += 1000) {
      const { data: page, error } = await supabase
        .from('unified_honest_sign_codes')
        .select('code, category, gender, size')
        .eq('supplier_id', supplierId)
        .neq('file_name', 'Напечатанные QR')
        .neq('file_name', 'Отсканировано')
        .neq('status', 'printed')
        .neq('status', 'scanned')
        .order('created_at', { ascending: true })
        .range(from, from + 999);
      if (error) throw new Error(`Не удалось получить коды из базы: ${error.message}`);
      data.push(...(page || []));
      if (!page || page.length < 1000) break;
    }

    return (data || [])
      .map((r: any) => ({
        code: String(r?.code || '').trim(),
        category: String(r?.category || '').trim(),
        gender: String(r?.gender || '').trim().toLowerCase(),
        size: String(r?.size || '').trim(),
      }))
      .filter((r: any) => r.code);
  };

  /*
   * Пол товара, проставленный вручную.
   *
   * У части предметов (бомберы) продавец не заполняет «Пол» в карточке WB, и
   * подобрать марку не по чему. Тогда пол один раз указывают в отчёте печати —
   * дальше он работает наравне с карточным.
   */
  const chzGenderOverrideKey = (supplierId: string) => `chz_gender_overrides_v1:${supplierId}`;

  const loadChzGenderOverrides = async (supplierId: string): Promise<Record<string, 'male' | 'female'>> => {
    if (!supplierId || supplierId === '__all__') return {};
    try {
      const { data } = await supabase.from('app_settings').select('value').eq('key', chzGenderOverrideKey(supplierId)).maybeSingle();
      const parsed = data?.value ? (typeof data.value === 'string' ? JSON.parse(data.value) : data.value) : null;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  };

  const saveChzGenderOverride = async (supplierId: string, nmId: number, gender: 'male' | 'female') => {
    const current = await loadChzGenderOverrides(supplierId);
    const next = { ...current, [String(nmId)]: gender };
    const { error: saveError } = await supabase
      .from('app_settings')
      .upsert([{ key: chzGenderOverrideKey(supplierId), value: JSON.stringify(next) }], { onConflict: 'key' });
    if (saveError) throw new Error(saveError.message);
    return next;
  };

  const pickChzGender = async (nmId: string, gender: 'male' | 'female') => {
    const id = Number(nmId);
    if (!Number.isFinite(id) || id <= 0) return;
    if (!selectedSupplierId || selectedSupplierId === '__all__') {
      setError('Выберите поставщика, чтобы сохранить пол товара');
      return;
    }
    setChzGenderPick((prev) => ({ ...prev, [nmId]: 'busy' }));
    try {
      await saveChzGenderOverride(selectedSupplierId, id, gender);
      setChzGenderPick((prev) => ({ ...prev, [nmId]: gender }));
    } catch (e: any) {
      setChzGenderPick((prev) => {
        const next = { ...prev };
        delete next[nmId];
        return next;
      });
      setError(`Не удалось сохранить пол товара: ${e?.message || e}`);
    }
  };

  /** Пол и предмет карточки — по ним марка и подбирается под заказ. */
  const loadProductMetaByNmId = async (supplierId: string, nmIds: number[]) => {
    const meta = new Map<number, { gender: string; subject: string; fromWb?: boolean }>();
    const ids = Array.from(new Set(nmIds.filter((id) => Number.isFinite(id) && id > 0)));
    if (!supplierId || ids.length === 0) return meta;

    const toMeta = (card: any) => {
      const genderRaw = (card?.characteristics || []).find((c: any) => String(c?.name || '').trim().toLowerCase() === 'пол');
      const genderValue = String(Array.isArray(genderRaw?.value) ? genderRaw.value[0] : genderRaw?.value || '').trim().toLowerCase();
      return {
        gender: genderValue.startsWith('муж') ? 'male' : genderValue.startsWith('жен') ? 'female' : '',
        subject: String(card?.subjectName || '').trim().toLowerCase(),
      };
    };

    for (let i = 0; i < ids.length; i += 500) {
      const { data } = await supabase
        .from('wb_products_cache')
        .select('nm_id, characteristics:product_json->characteristics, subjectName:product_json->>subjectName')
        .eq('supplier_id', supplierId)
        .in('nm_id', ids.slice(i, i + 500));

      (data || []).forEach((row: any) => {
        meta.set(Number(row.nm_id), toMeta(row));
      });
    }

    /*
     * Карточек нет в кэше или в них не заполнен пол — перечитываем из WB.
     *
     * Кэш обновляется кнопкой «Обновить базу товаров», и новые карточки в нём
     * появляются не сразу: 16.09 девять заданий поставки остались без ЧЗ только
     * потому, что их карточек в кэше ещё не было. Пол берём строго из карточки,
     * ничего не угадываем. Свежую карточку сразу кладём в кэш.
     */
    const token = getSupplierToken();
    const stale = ids.filter((id) => !meta.get(id)?.gender || !meta.get(id)?.subject);
    if (token && hasWbScope(token, 'content') && stale.length) {
      for (const nmId of stale.slice(0, 60)) {
        try {
          let res: Response | null = null;
          for (let attempt = 0; attempt < 4; attempt++) {
            try {
              res = await fetch('https://content-api.wildberries.ru/content/v2/get/cards/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: token },
                body: JSON.stringify({ settings: { cursor: { limit: 100 }, filter: { withPhoto: -1, textSearch: String(nmId) } } }),
              });
              if (res.status !== 429) break;
            } catch {
              // При превышении лимита WB отвечает без CORS-заголовков, и браузер
              // видит это как обрыв сети — ждём и повторяем так же, как на 429.
              res = null;
            }
            await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
          }
          if (!res || !res.ok) continue;
          const json = await res.json();
          const card = (json?.cards || []).find((c: any) => Number(c?.nmID) === nmId);
          if (!card) continue;
          meta.set(nmId, { ...toMeta(card), fromWb: true });
          await supabase
            .from('wb_products_cache')
            .upsert([{ supplier_id: supplierId, nm_id: nmId, product_json: card, updated_at: new Date().toISOString() }], { onConflict: 'supplier_id,nm_id' });
        } catch (e) {
          console.warn('карточка WB не получена', nmId, e);
        }
        // Лимит Content API — 100 запросов в минуту.
        await new Promise((r) => setTimeout(r, 650));
      }
    }

    // Пол с сайта — только там, где карточка его не дала.
    const overrides = await loadChzGenderOverrides(supplierId);
    ids.forEach((id) => {
      const manual = overrides[String(id)];
      if (manual !== 'male' && manual !== 'female') return;
      const current = meta.get(id);
      if (current?.gender) return;
      meta.set(id, { gender: manual, subject: current?.subject || '', fromWb: current?.fromWb });
    });

    return meta;
  };

  /**
   * Закрепляет напечатанные марки за заказами.
   *
   * Марка уже наклеена на вещь, значит сканировать её у стола незачем: пишем
   * связку сразу в карту поставки, и в окне «Скан ЧЗ» задание выглядит
   * закрытым. Одновременно код помечается напечатанным в общей базе, чтобы
   * следующая печать его не выдала повторно — один код на две вещи это
   * пересорт.
   */
  const bindPrintedChzToOrders = async (
    codesByOrderId: Map<number, string>,
    ordersById: Map<number, any>,
    supplyIdArg?: string,
  ) => {
    const supplyId = String(supplyIdArg || activeSupplyId || '');
    if (!supplyId || codesByOrderId.size === 0) return;
    const supplierId = selectedSupplierId;

    try {
      const savedMap = await loadFbsSupplyScanMap(supplyId, supplierId);
      const next = { ...savedMap };
      const nowIso = new Date().toISOString();

      codesByOrderId.forEach((code, orderId) => {
        const order = ordersById.get(orderId) || {};
        const storageKey = `order:${orderId}`;
        next[storageKey] = {
          storageKey,
          stickerDigits: '',
          stickerScanText: '',
          honestSignCode: normalizeDataMatrixText(code),
          updatedAt: nowIso,
          orderId: String(orderId),
          title: String(order?.title || ''),
          article: String(order?.article || ''),
          size: String(order?.size || ''),
        };
      });

      const saved = await saveFbsSupplyScanMap(supplyId, next, supplierId);
      // Экран скана показывает текущую поставку: чужую карту в него не кладём
      // (в пакетной выгрузке коды печатаются сразу по нескольким поставкам).
      if (supplyId === activeSupplyId) applyFbsScans(saved);

      // Напечатанными коды пометили ещё до печати (захват в downloadFBSStickers).

      // И в базу заказов — с пометкой, что связка из печати, а не со сканера.
      for (const [orderId, code] of codesByOrderId.entries()) {
        const order = ordersById.get(orderId) || {};
        await upsertFbsOrderCode({
          supplierId,
          supplyId,
          orderId: String(orderId),
          chzCode: normalizeDataMatrixText(code),
          nmId: Number(order?.nmId || 0) || null,
          article: String(order?.article || ''),
          size: String(order?.size || ''),
          title: String(order?.title || ''),
        }).catch((e) => console.error('fbs_order_codes upsert failed', e));
      }

      // Марка из базы напечатана на этикетке задания — на задание в WB её ставим
      // сразу, без отдельной галочки: сканировать её никто не будет.
      void pushFbsSgtinsToWb(
        Array.from(codesByOrderId.entries()).map(([orderId, code]) => ({ orderId: String(orderId), code })),
        supplierId,
      );

      setSuccessMsg(`ЧЗ из базы прикреплены к заданиям и отправлены в WB: ${codesByOrderId.size}. Сканировать их в «Скан ЧЗ» не нужно.`);
      notifyChzStockChanged(supplierId);
    } catch (e: any) {
      setError(`Этикетки напечатаны, но связка не сохранилась: ${e?.message || e}. Отсканируйте эти коды вручную.`);
    }
  };

  /**
   * Печать стикеров поставки.
   *
   * onlyMissing — «Допечатать без ЧЗ»: только задания, у которых марки ещё нет,
   * чтобы не перепечатывать всю поставку ради пары заданий.
   */
  const downloadFBSStickers = async (opts: { onlyMissing?: boolean; supplyId?: string; asFile?: boolean } = {}) => {
    const onlyMissing = Boolean(opts.onlyMissing);
    /*
     * supplyId и asFile — для пакетной выгрузки нескольких поставок подряд.
     *
     * Печать открывает системное окно, и второе подряд браузер блокирует —
     * поэтому в пакетном режиме стикеры сохраняются файлом, как лист подбора.
     */
    const printSupplyId = String(opts.supplyId || activeSupplyId || '');
    const asFile = Boolean(opts.asFile);
    // Библиотеки печати/Excel грузятся по требованию — не при открытии раздела.
    await Promise.all([ensurePdfLibs(), ensureBwip()]);
    const { jsPDF, autoTable, bwipjs } = lazyLibs;
    if (!printSupplyId) return null;
    setLoading(true);
    try {
      const supplyOrdersRaw = await withTimeout(fetchOrdersForSupply(printSupplyId, { enrich: true, fresh: true, cacheTtlMs: SUPPLY_ORDERS_CACHE_MS }), 30000, 'Таймаут загрузки заказов для стикеров');
      const targetSupplyId = printSupplyId.trim().toLowerCase();
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

      const allOrderIds = Array.from(new Set(
        sortedSupplyOrders
          .map((o: any) => extractSafeOrderId(o))
          .filter((id: number | null): id is number => Number.isFinite(id as number) && (id as number) > 0)
      ));

      if (allOrderIds.length === 0) {
        throw new Error('В поставке не найдены ID заказов для печати стикеров');
      }

      const orderByIdAll = new Map<number, any>();
      sortedSupplyOrders.forEach((o: any) => {
        const id = extractSafeOrderId(o);
        if (id) orderByIdAll.set(id, o);
      });

      /** Строки отчёта — задания, оставшиеся без ЧЗ. */
      const reportRows: NonNullable<typeof chzPrintReport>['rows'] = [];
      const reportRow = (
        orderId: number,
        kind: NonNullable<typeof chzPrintReport>['rows'][number]['kind'],
        reason: string,
        sticker?: any,
        needGender?: boolean,
      ) => {
        const order = orderByIdAll.get(orderId) || {};
        reportRows.push({
          orderId: String(orderId),
          nmId: String(order?.nmId || ''),
          sticker: sticker ? `${String(sticker?.partA || '')} ${String(sticker?.partB || '')}`.trim() : '',
          article: String(order?.article || ''),
          size: String(order?.size || ''),
          kind,
          reason,
          needGender,
        });
      };

      /*
       * Статусы заданий у WB — до выдачи марок.
       *
       * Отменённое задание не поедет: марка на нём сгорела бы, а стикер ушёл бы
       * в корзину. Такие задания не печатаем вовсе и показываем в отчёте. Если
       * WB статусы не отдал, печатаем как раньше — но пишем, что проверки не было.
       */
      const { canceled: canceledMap, checked: statusChecked } = await fetchCanceledFbsOrders(allOrderIds);
      const canceledIds = new Set<number>(canceledMap.keys());
      canceledMap.forEach((status, id) => {
        reportRow(id, 'canceled', `Задание отменено (${status}) — стикер не печатался, марка не выдавалась`);
      });

      const orderIds = allOrderIds.filter((id) => !canceledIds.has(id));
      if (orderIds.length === 0) {
        throw new Error('Все задания поставки отменены — печатать нечего');
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

      orderIds.forEach((id) => {
        if (!stickersByOrderId.has(id)) reportRow(id, 'no_sticker', 'WB не отдал стикер задания — повторите печать позже');
      });

      let orderedStickers = orderIds
        .map((id) => stickersByOrderId.get(id))
        .filter(Boolean);

      /*
       * Марки под этикетки «ШК + ЧЗ».
       *
       * Берём ровно столько, сколько стикеров: одна марка на задание. Если
       * кодов в базе меньше — печатаем сколько есть и говорим об этом, а не
       * молча отдаём половину поставки без маркировки.
       */
      const orderById = orderByIdAll;

      /** Заказ → марка на этикетке (уже прикреплённая или новая). Нет ключа — стикер без ЧЗ. */
      const chzByOrderId = new Map<number, string>();
      /** Только новые марки из базы — их прикрепляем и отправляем в WB после печати. */
      const newChzByOrderId = new Map<number, string>();
      let chzLayout = DEFAULT_CHZ_LABEL_LAYOUT;
      let chzTailLayout = DEFAULT_CHZ_TAIL_LAYOUT;
      let comboLayout = DEFAULT_FBS_COMBO_LAYOUT;
      let unmatchedOrders = 0;
      /*
       * Нехватка марок — предупреждение, а не отказ.
       *
       * Раньше при пустой базе кодов печать обрывалась ошибкой, а при частичной
       * нехватке в совмещённом режиме выходили пустые листы. Стикер WB нужен
       * заданию в любом случае, поэтому печатаем его всегда, а о заданиях без
       * марки говорим после — отдельным сообщением, которое не исчезает само.
       */
      let chzShortage = '';

      /*
       * У задания марка уже есть — печатаем её же, новую из базы не берём.
       *
       * Иначе повторная печать поставки (замялся рулон, потеряли стикер) выдала
       * бы заданию второй код: старый уже наклеен и, возможно, ушёл в WB, а в
       * базе числился бы новый — пересорт и списанный впустую код. Берём и
       * сохранённые сканы окна, и базу заказов: там же привязки с других мест.
       */
      const existingChzByOrderId = new Map<number, string>();
      if (fbsStickersWithChz || onlyMissing) {
        const [savedMap, dbScans] = await Promise.all([
          loadFbsSupplyScanMap(printSupplyId, selectedSupplierId).catch(() => ({} as Record<string, FbsSupplyScanSavedItem>)),
          fetchFbsSupplyScans(selectedSupplierId, printSupplyId).catch(() => []),
        ]);
        for (const item of Object.values(savedMap)) {
          const id = Number(String(item?.orderId || '').trim());
          const code = normalizeDataMatrixText(String(item?.honestSignCode || ''));
          if (id > 0 && code) existingChzByOrderId.set(id, code);
        }
        for (const row of dbScans) {
          const id = Number(String(row?.orderId || '').trim());
          const code = normalizeDataMatrixText(String(row?.chzCode || ''));
          if (id > 0 && code && !existingChzByOrderId.has(id)) existingChzByOrderId.set(id, code);
        }
        if (onlyMissing) {
          // Задания с маркой уже напечатаны — их не трогаем вовсе.
          orderedStickers = orderedStickers.filter((st: any) => !existingChzByOrderId.has(Number(st?.orderId ?? st?.id ?? st?.order_id)));
          if (orderedStickers.length === 0) {
            if (reportRows.length && !asFile) {
              setChzPrintReport({
                supplyId: printSupplyId,
                supplyName: supplies.find((x) => x.id === printSupplyId)?.name || printSupplyId,
                printed: 0,
                withChz: 0,
                newChz: 0,
                onlyMissing: true,
                statusChecked,
                rows: reportRows,
              });
            } else if (!asFile) {
              setSuccessMsg('У всех заданий поставки уже есть ЧЗ — допечатывать нечего.');
            }
            return { supplyId: printSupplyId, printed: 0, withChz: 0, newChz: 0, statusChecked, rows: reportRows };
          }
        }
        for (const sticker of orderedStickers) {
          const orderId = Number(sticker?.orderId ?? sticker?.id ?? sticker?.order_id);
          const code = existingChzByOrderId.get(orderId);
          if (code) chzByOrderId.set(orderId, code);
        }
      }
      const needNewCodes = orderedStickers.filter((st: any) => !chzByOrderId.has(Number(st?.orderId ?? st?.id ?? st?.order_id))).length;

      const pool = fbsStickersWithChz && needNewCodes > 0
        ? await takeFreeChzCodes(selectedSupplierId, needNewCodes)
        : [];
      if (fbsStickersWithChz && needNewCodes > 0 && pool.length === 0) {
        chzShortage = `Свободных марок ЧЗ в базе нет — ${needNewCodes} заданий напечатаны обычными стикерами WB, их нужно сканировать.`;
        for (const st of orderedStickers) {
          const id = Number(st?.orderId ?? st?.id ?? st?.order_id);
          if (!chzByOrderId.has(id)) reportRow(id, 'no_code', 'В базе нет свободных кодов ЧЗ этого поставщика', st);
        }
      }

      if (fbsStickersWithChz && (pool.length > 0 || chzByOrderId.size > 0)) {
        const { data: layoutRow } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'wb_label_layout_v1')
          .maybeSingle();
        chzLayout = readChzLabelLayout(layoutRow?.value);
        chzTailLayout = readChzTailLayout(layoutRow?.value);
        comboLayout = readFbsComboLayout(layoutRow?.value);

        const productMeta = await loadProductMetaByNmId(
          selectedSupplierId,
          Array.from(orderById.values()).map((o: any) => Number(o?.nmId || 0)),
        );

        /*
         * Подбор и захват кодов — в несколько кругов.
         *
         * Код закрепляется за заданием только если он всё ещё свободен. Если
         * закрепить не вышло (его уже взяли), заданию сразу подбирается следующий
         * подходящий код — без отдельной «очереди» и без повторной печати.
         */
        const used = new Set<string>(chzByOrderId.values());
        let toMatch = orderedStickers.filter((st: any) => !chzByOrderId.has(Number(st?.orderId ?? st?.id ?? st?.order_id)));
        for (let round = 0; round < 5 && toMatch.length > 0; round++) {
          const roundCodes = new Map<number, string>();
          for (const sticker of toMatch) {
            const orderId = Number(sticker?.orderId ?? sticker?.id ?? sticker?.order_id);
            const order = orderById.get(orderId);
            if (!order) continue;

            // Размер берём из самого задания: в карточке их несколько, а уехать
            // должен именно тот, что заказали.
            const card = productMeta.get(Number(order?.nmId || 0));
            const match = matchChzCodeForProduct(pool, used, {
              gender: card?.gender || '',
              subject: card?.subject || '',
              size: String(order?.size || ''),
            });
            if (!match) {
              unmatchedOrders += 1;
              if (!card) {
                reportRow(orderId, 'no_card', 'Карточка товара не найдена ни в кэше, ни в WB — неизвестны категория и пол', sticker);
              } else if (!card.gender) {
                reportRow(orderId, 'no_card', `В карточке WB не заполнен «Пол» (${card.subject || 'без категории'}) — укажите пол кнопкой ниже`, sticker, true);
              } else {
                const genderText = card.gender === 'male' ? 'мужской' : card.gender === 'female' ? 'женский' : 'пол не указан';
                reportRow(orderId, 'no_code', `Нет свободного кода: ${card.subject || 'без категории'}, ${genderText}, размер ${String(order?.size || '—')}`, sticker);
              }
              continue;
            }
            used.add(match.code);
            roundCodes.set(orderId, match.code);
          }

          if (roundCodes.size === 0) break;
          const wanted = Array.from(roundCodes.values());
          const claimed = new Set<string>();
          for (let i = 0; i < wanted.length; i += 200) {
            const { data: rows, error: claimError } = await supabase
              .from('unified_honest_sign_codes')
              .update({ file_name: 'Напечатанные QR' })
              .eq('supplier_id', selectedSupplierId)
              .filter('code', 'in', pgInList(wanted.slice(i, i + 200)))
              .neq('file_name', 'Напечатанные QR')
              .neq('file_name', 'Отсканировано')
              .select('code');
            if (claimError) throw new Error(`Не удалось закрепить коды из базы: ${claimError.message}`);
            (rows || []).forEach((r: any) => claimed.add(String(r?.code || '')));
          }
          if (claimed.size > 0) notifyChzStockChanged(selectedSupplierId);

          const lost = new Set<number>();
          for (const [orderId, code] of Array.from(roundCodes.entries())) {
            if (claimed.has(code)) {
              chzByOrderId.set(orderId, code);
              newChzByOrderId.set(orderId, code);
            } else {
              lost.add(orderId); // код занят — в следующем круге возьмём другой
            }
          }
          toMatch = toMatch.filter((st: any) => lost.has(Number(st?.orderId ?? st?.id ?? st?.order_id)));
        }
        // Если и за пять кругов закрепить не вышло — задание уходит на скан.
        for (const sticker of toMatch) {
          const orderId = Number(sticker?.orderId ?? sticker?.id ?? sticker?.order_id);
          if (chzByOrderId.has(orderId) || reportRows.some((r) => r.orderId === String(orderId))) continue;
          unmatchedOrders += 1;
          reportRow(orderId, 'claim_lost', 'Не удалось закрепить код из базы — отсканируйте марку или нажмите «Допечатать без ЧЗ»', sticker);
        }

        if (unmatchedOrders > 0) {
          chzShortage = `ЧЗ из базы: прикреплено ${chzByOrderId.size} из ${orderedStickers.length}. `
            + `${unmatchedOrders} заданий без подходящего кода (категория, пол или размер) напечатаны обычными стикерами WB — их нужно сканировать.`;
        }
      }

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

               // Кириллица на этикетке ЧЗ: без шрифта jsPDF нарисует кракозябры.
               if (fbsStickersWithChz) {
                 try {
                   if (!cachedPdfFontRef.current) {
                     const fontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf';
                     const response = await withTimeout(fetch(fontUrl), 7000, 'Таймаут загрузки шрифта');
                     const blob = await response.blob();
                     const reader = new FileReader();
                     reader.readAsDataURL(blob);
                     await new Promise((resolve) => { reader.onloadend = () => resolve(reader.result); });
                     cachedPdfFontRef.current = (reader.result as string).split(',')[1];
                   }
                   if (cachedPdfFontRef.current) {
                     pdf.addFileToVFS('Roboto-Regular.ttf', cachedPdfFontRef.current);
                     pdf.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
                     pdf.addFont('Roboto-Regular.ttf', 'Roboto', 'bold');
                   }
                 } catch (e) {
                   console.warn('Шрифт для этикетки ЧЗ не загрузился', e);
                 }
               }

               /*
                * Совмещённая этикетка — одна страница на задание.
                *
                * Она сама несёт и QR, и штрихкод задания, поэтому картинка WB
                * рядом была бы вторым экземпляром того же стикера. У остальных
                * макетов порядок прежний: стикер, сразу за ним этикетка.
                */
               const comboMode = fbsStickersWithChz && fbsLabelKind === 'combo';

               for (let i = 0; i < slice.length; i++) {
                 const sticker = slice[i];
                 if (i > 0) pdf.addPage([58, 40], 'landscape');

                 const rawBase64 = String(sticker.file || '');
                 const stickerType = String(sticker.__type || 'svg').toLowerCase();

                 /*
                  * Рисование стикера вынесено в функцию, чтобы прежние
                  * `continue` стали `return`: этикетка ЧЗ должна встать следом
                  * даже за пропущенным стикером, иначе марки съедут на заказ.
                  */
                 const drawSticker = async () => {
                   if (rawBase64.length > 2_000_000) {
                     console.warn('sticker payload too large, skipped', rawBase64.length);
                     return;
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
                     return;
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
                 };

                 const orderId = Number(sticker?.orderId ?? sticker?.id ?? sticker?.order_id);
                 const code = fbsStickersWithChz ? chzByOrderId.get(orderId) : undefined;

                 /*
                  * Совмещённая страница — только когда марка есть.
                  *
                  * Раньше в совмещённом режиме стикер WB не рисовался вовсе, и
                  * заданию, которому марки не хватило, доставался пустой лист:
                  * на складе его наклеить нельзя, а задание без стикера не
                  * примут. Нет марки — печатаем обычный стикер WB, как без
                  * галочки.
                  */
                 const comboPage = comboMode && Boolean(code);

                 if (!comboPage) {
                   try {
                     await drawSticker();
                   } catch (e) {
                     console.warn('sticker render failed, skipped', e);
                   }
                 }

                 // Этикетка ЧЗ идёт следующей страницей — сразу за своим заданием.
                 if (fbsStickersWithChz) {
                   if (code) {
                     const order = orderById.get(orderId) || {};
                     const barcode = String(order?.skus?.[0] || order?.barcode || '');
                     const partA = String(sticker?.partA || '');
                     const partB = String(sticker?.partB || '');
                     if (!comboPage) pdf.addPage([58, 40], 'landscape');
                     try {
                       if (fbsLabelKind === 'combo') {
                         await drawFbsComboLabel(pdf, bwipjs, comboLayout, {
                           chzCode: code,
                           stickerCode: String(sticker?.barcode || ''),
                           partA,
                           partB,
                           article: String(order?.article || ''),
                           size: String(order?.size || ''),
                         });
                       } else if (fbsLabelKind === 'chz_tail') {
                         await drawChzTailLabel(pdf, bwipjs, chzTailLayout, {
                           chzCode: code,
                           barcode,
                           title: String(order?.title || ''),
                           article: String(order?.article || ''),
                           size: String(order?.size || ''),
                           stickerHead: partA,
                           stickerTail: partB,
                         });
                       } else {
                         await drawChzLabel(pdf, bwipjs, chzLayout, {
                           chzCode: code,
                           barcode,
                           title: String(order?.title || ''),
                           article: String(order?.article || ''),
                           size: String(order?.size || ''),
                           supplierName: String(selectedSupplier?.name || ''),
                         });
                       }
                     } catch (e) {
                       console.warn('chz label render failed', e);
                     }
                   }
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

             const printSupplyName = supplies.find((x) => x.id === printSupplyId)?.name || printSupplyId;
             for (const profile of renderProfiles) {
               try {
                 const pdf = await buildPdfForSlice(orderedStickers, profile);
                 if (asFile) {
                   pdf.save(`Коды ${String(printSupplyName).replace(/[\\/:*?"<>|]+/g, '_')} ${orderedStickers.length}.pdf`);
                 } else {
                   await printPdfDirect(pdf, { widthMm: 58, heightMm: 40 });
                 }
                 if (fbsStickersWithChz && newChzByOrderId.size > 0) {
                   await bindPrintedChzToOrders(newChzByOrderId, orderById, printSupplyId);
                 }
                 if (!asFile && (fbsStickersWithChz || reportRows.length)) {
                   setChzPrintReport({
                     supplyId: printSupplyId,
                     supplyName: printSupplyName,
                     printed: orderedStickers.length,
                     withChz: chzByOrderId.size,
                     newChz: newChzByOrderId.size,
                     onlyMissing,
                     statusChecked,
                     rows: reportRows,
                   });
                 } else if (!asFile && chzShortage) {
                   setError(chzShortage);
                 }
                 return {
                   supplyId: printSupplyId,
                   printed: orderedStickers.length,
                   withChz: chzByOrderId.size,
                   newChz: newChzByOrderId.size,
                   statusChecked,
                   rows: reportRows,
                 };
               } catch (e) {
                 console.warn('single stickers pdf failed on profile, trying lighter profile', profile, e);
               }
             }

             throw new Error('Не удалось сформировать единый PDF со стикерами');
      }
      
      throw new Error('Стикеры не найдены');

    } catch (err: any) {
      if (asFile) throw err; // пакетная выгрузка сама решает, что делать с ошибкой
      setError(err.message);
    } finally {
      setLoading(false);
    }
    return null;
  };

  const loadWbWarehouses = async () => {
    const data = await wbFetch('https://marketplace-api.wildberries.ru/api/v3/warehouses');
    const list = Array.isArray(data) ? data : (data?.warehouses || []);
    const mapped = list
      .map((w: any) => ({ id: Number(w?.id), name: String(w?.name || '').trim() }))
      .filter((w: any) => Number.isFinite(w.id) && w.id > 0);
    setWbWarehouses(mapped);
    return mapped as Array<{ id: number; name: string }>;
  };

  /** Добавление заданий в поставку WB: пакетом, с запасными вариантами. */
  const pushOrdersToSupply = async (supplyId: string, orderIds: string[]) => {
    const encoded = encodeURIComponent(String(supplyId));
    for (let i = 0; i < orderIds.length; i += 500) {
      const chunk = orderIds.slice(i, i + 500);
      try {
        await wbFetch(`https://marketplace-api.wildberries.ru/api/v3/supplies/${encoded}/orders`, {
          method: 'PATCH',
          body: JSON.stringify({ orders: chunk }),
        });
        continue;
      } catch (batchError) {
        // По одному: WB иногда не принимает пакет целиком из-за одного задания.
        let ok = 0;
        let lastError: any = batchError;
        for (const orderId of chunk) {
          try {
            await wbFetch(`https://marketplace-api.wildberries.ru/api/v3/supplies/${encoded}/orders/${encodeURIComponent(orderId)}`, { method: 'PATCH' });
            ok += 1;
          } catch (e) {
            lastError = e;
          }
        }
        if (ok === 0) throw lastError;
        if (ok < chunk.length) throw new Error(`добавлено ${ok} из ${chunk.length} заданий`);
      }
    }
  };

  /** План сборки: какие поставки создадим и что в них положим. */
  const openAssemblePlan = async () => {
    setAssemblePlan({ busy: true, running: false, done: false, groups: [] });
    try {
      const warehouses = wbWarehouses.length ? wbWarehouses : await loadWbWarehouses();
      const nameById = new Map(warehouses.map((w) => [w.id, w.name]));

      const fresh = await wbFetch('https://marketplace-api.wildberries.ru/api/v3/orders/new');
      const list: any[] = fresh?.orders || [];
      setOrders(list);
      const free = list.filter((o: any) => !o?.supplyId);
      if (!free.length) throw new Error('Все новые задания уже разложены по поставкам');

      const now = new Date();
      const stamp = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const byWarehouse = new Map<number, any[]>();
      free.forEach((o: any) => {
        const id = Number(o?.warehouseId || 0);
        const arr = byWarehouse.get(id) || [];
        arr.push(o);
        byWarehouse.set(id, arr);
      });

      const groups = Array.from(byWarehouse.entries())
        .map(([warehouseId, arr]) => {
          const warehouseName = nameById.get(warehouseId) || `Склад ${warehouseId}`;
          return {
            warehouseId,
            warehouseName,
            orderIds: arr.map((o: any) => String(o.id)),
            supplyName: `${warehouseName} ${stamp}`,
          };
        })
        .sort((a, b) => b.orderIds.length - a.orderIds.length);

      setAssemblePlan({ busy: false, running: false, done: false, groups });
    } catch (e: any) {
      setAssemblePlan({ busy: false, running: false, done: false, groups: [], error: e?.message || String(e) });
    }
  };

  /** Создание поставок по плану: на каждый склад своя, задания внутрь. */
  const runAssemblePlan = async () => {
    const plan = assemblePlan;
    if (!plan || !plan.groups.length || plan.running) return;
    const groups = plan.groups.map((g) => ({ ...g, status: 'создаю…' }));
    setAssemblePlan({ ...plan, running: true, groups: [...groups] });

    for (const group of groups) {
      try {
        const created = await wbFetch('https://marketplace-api.wildberries.ru/api/v3/supplies', {
          method: 'POST',
          body: JSON.stringify({ name: group.supplyName }),
        });
        const supplyId = String(created?.id || '').trim();
        if (!supplyId) throw new Error('WB не вернул номер поставки');
        await pushOrdersToSupply(supplyId, group.orderIds);
        group.status = `${supplyId} · заданий ${group.orderIds.length}`;
      } catch (e: any) {
        group.status = `ошибка: ${e?.message || e}`;
      }
      setAssemblePlan((prev) => (prev ? { ...prev, groups: [...groups] } : prev));
    }

    setAssemblePlan((prev) => (prev ? { ...prev, running: false, done: true, groups: [...groups] } : prev));
    await fetchSupplies();
    await fetchNewOrders();
  };

  const toggleSupplySelection = (supplyId: string) => {
    setSelectedSupplyIds((prev) => {
      const next = new Set(prev);
      if (next.has(supplyId)) next.delete(supplyId);
      else next.add(supplyId);
      return next;
    });
  };

  /**
   * Листы подбора и коды по отмеченным поставкам — подряд, файлами.
   *
   * Печать открыть подряд нельзя: второе системное окно браузер блокирует.
   * Поэтому на каждую поставку скачиваются два файла — сначала лист подбора,
   * следом коды к нему, — и так по очереди, в порядке списка.
   */
  const runBulkSupplyExport = async () => {
    const ids = supplies.filter((x) => selectedSupplyIds.has(x.id)).map((x) => x.id);
    if (!ids.length) return;

    const errors: string[] = [];
    setBulkExport({ total: ids.length, index: 0, name: '', stage: '', errors: [], done: false });

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const name = supplies.find((x) => x.id === id)?.name || id;

      setBulkExport({ total: ids.length, index: i + 1, name, stage: 'лист подбора', errors: [...errors], done: false });
      try {
        await generatePickingList(id);
      } catch (e: any) {
        errors.push(`${name}: лист — ${e?.message || e}`);
      }
      // Браузеру нужно время между сохранениями, иначе часть файлов теряется.
      await new Promise((r) => setTimeout(r, 900));

      setBulkExport({ total: ids.length, index: i + 1, name, stage: 'коды', errors: [...errors], done: false });
      try {
        await downloadFBSStickers({ supplyId: id, asFile: true });
      } catch (e: any) {
        errors.push(`${name}: коды — ${e?.message || e}`);
      }
      await new Promise((r) => setTimeout(r, 900));
    }

    setBulkExport({ total: ids.length, index: ids.length, name: '', stage: 'готово', errors, done: true });
    if (!errors.length) {
      setSuccessMsg(`Выгружено поставок: ${ids.length} — лист подбора и коды по каждой.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  /**
   * План марок поставки: кому какая марка достанется и сколько их в базе.
   *
   * Повторяет подбор из печати один в один, но ничего не закрепляет — коды
   * остаются свободными до нажатия «Печатать».
   */
  const buildChzPlan = async (supplyId: string) => {
    const supplyName = supplies.find((x) => x.id === supplyId)?.name || supplyId;
    setChzPlan({
      supplyId, supplyName, busy: true, total: 0, alreadyWithChz: 0, canceled: 0,
      statusChecked: false, groups: [], noGender: [], noCard: [],
    });
    try {
      const rawOrders = await withTimeout(
        fetchOrdersForSupply(supplyId, { enrich: true, fresh: true, cacheTtlMs: SUPPLY_ORDERS_CACHE_MS }),
        30000,
        'Таймаут загрузки заказов поставки',
      );
      const target = supplyId.trim().toLowerCase();
      const supplyOrders = (rawOrders || []).filter((o: any) => {
        const candidates = [o?.supplyId, o?.supplyID, o?.supply_id, o?.supply?.id]
          .map((v) => String(v || '').trim().toLowerCase())
          .filter(Boolean);
        return candidates.length === 0 ? true : candidates.some((c) => c === target);
      });
      const orderId = (o: any) => Number(o?.id ?? o?.orderId ?? o?.order_id);
      const ids = Array.from(new Set(supplyOrders.map(orderId).filter((id: number) => Number.isFinite(id) && id > 0)));
      if (!ids.length) throw new Error('В поставке нет заданий');

      const { canceled, checked } = await fetchCanceledFbsOrders(ids);
      const live = supplyOrders.filter((o: any) => !canceled.has(orderId(o)));

      const [savedMap, dbScans] = await Promise.all([
        loadFbsSupplyScanMap(supplyId, selectedSupplierId).catch(() => ({} as Record<string, FbsSupplyScanSavedItem>)),
        fetchFbsSupplyScans(selectedSupplierId, supplyId).catch(() => []),
      ]);
      const withChz = new Set<number>();
      Object.values(savedMap).forEach((item: any) => {
        const id = Number(String(item?.orderId || '').trim());
        if (id > 0 && String(item?.honestSignCode || '').trim()) withChz.add(id);
      });
      (dbScans || []).forEach((row: any) => {
        const id = Number(String(row?.orderId || '').trim());
        if (id > 0 && String(row?.chzCode || '').trim()) withChz.add(id);
      });

      const need = live.filter((o: any) => !withChz.has(orderId(o)));
      const meta = await loadProductMetaByNmId(selectedSupplierId, need.map((o: any) => Number(o?.nmId || 0)));
      const pool = await takeFreeChzCodes(selectedSupplierId, Math.max(need.length, 1));

      const freeBy = new Map<string, number>();
      pool.forEach((c: any) => {
        const key = `${normalizeHsCategoryName(c.category)}|${String(c.gender || '').toLowerCase()}`;
        freeBy.set(key, (freeBy.get(key) || 0) + 1);
      });

      const used = new Set<string>();
      const groups = new Map<string, { key: string; category: string; gender: 'male' | 'female'; orders: number; matched: number; freeTotal: number }>();
      const noGender = new Map<string, { nmId: string; article: string; subject: string; count: number }>();
      const noCard = new Map<string, { nmId: string; article: string; count: number }>();

      for (const o of need) {
        const nmId = String(o?.nmId || '');
        const article = String(o?.article || o?.vendorCode || '—');
        const card = meta.get(Number(o?.nmId || 0));
        if (!card) {
          const row = noCard.get(nmId) || { nmId, article, count: 0 };
          row.count += 1;
          noCard.set(nmId, row);
          continue;
        }
        if (!card.gender) {
          const row = noGender.get(nmId) || { nmId, article, subject: card.subject || '', count: 0 };
          row.count += 1;
          noGender.set(nmId, row);
          continue;
        }
        const category = normalizeHsCategoryName(card.subject || '');
        const key = `${category}|${card.gender}`;
        const group = groups.get(key) || {
          key,
          category: card.subject || 'без категории',
          gender: card.gender as 'male' | 'female',
          orders: 0,
          matched: 0,
          freeTotal: freeBy.get(key) || 0,
        };
        group.orders += 1;
        const match = matchChzCodeForProduct(pool, used, {
          gender: card.gender,
          subject: card.subject,
          size: String(o?.size || ''),
        });
        if (match) {
          used.add(match.code);
          group.matched += 1;
        }
        groups.set(key, group);
      }

      setChzPlan({
        supplyId,
        supplyName,
        busy: false,
        total: live.length,
        alreadyWithChz: live.length - need.length,
        canceled: canceled.size,
        statusChecked: checked,
        groups: Array.from(groups.values()).sort((a, b) => b.orders - a.orders),
        noGender: Array.from(noGender.values()).sort((a, b) => b.count - a.count),
        noCard: Array.from(noCard.values()).sort((a, b) => b.count - a.count),
      });
    } catch (e: any) {
      setChzPlan((prev) => (prev ? { ...prev, busy: false, error: e?.message || String(e) } : prev));
    }
  };

  /** Закрыть окно скана совсем — со сбросом незаконченного шага. */
  const closeFbsScanModal = () => {
    setFbsScanModalOpen(false);
    setFbsScanMinimized(false);
    setFbsPendingStickerRow(null);
    setFbsScanMode('sticker');
    clearScanInput();
    fbsScanSupplyIdRef.current = null;
  };

  /*
   * Закладки сканов: несколько поставок разных кабинетов под рукой.
   *
   * Живой скан всегда один — сканер тоже один, и каждая запись марки берёт
   * поставщика и поставку из состояния раздела. Остальные сканы лежат
   * закладками: щелчок по ярлыку переключает поставщика и поставку и открывает
   * их скан заново. Сканы уже в базе, поэтому переключение занимает секунды.
   * Незаконченный шаг (стикер отсканирован, ЧЗ ещё нет) закладка помнит и
   * восстанавливает, если задание всё ещё без марки.
   *
   * У каждой закладки есть индекс стикеров её поставки. Стикер, которого нет в
   * текущей поставке, ищется по закладкам — и скан сам переключается туда, где
   * это задание. Только на шаге стикера: марку в другую поставку не переносим.
   *
   * Храним в браузере: закладки — рабочее место сборщика, а не общие данные.
   */
  const FBS_SCAN_BOOKMARKS_KEY = 'fbs_scan_bookmarks_v1';
  const FBS_SCAN_BOOKMARKS_MAX = 8;

  type FbsScanBookmark = {
    key: string;
    supplierId: string;
    supplierName: string;
    supplyId: string;
    supplyName: string;
    scanned: number;
    total: number;
    pendingStorageKey?: string;
    /** Нормализованные значения стикеров поставки: «при считывании», текст и цифры. */
    stickerKeys?: string[];
    updatedAt: string;
  };

  const [fbsScanBookmarks, setFbsScanBookmarks] = useState<FbsScanBookmark[]>(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(FBS_SCAN_BOOKMARKS_KEY) || '[]');
      return Array.isArray(parsed) ? parsed.filter((b: any) => b?.supplierId && b?.supplyId) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try { localStorage.setItem(FBS_SCAN_BOOKMARKS_KEY, JSON.stringify(fbsScanBookmarks)); } catch {}
  }, [fbsScanBookmarks]);

  const fbsScanBookmarkKey = (supplierId: string, supplyId: string) => `${supplierId}|${supplyId}`;
  const currentFbsScanBookmarkKey = fbsScanModalOpen && fbsScanSupplierIdRef.current && fbsScanSupplyIdRef.current
    ? fbsScanBookmarkKey(fbsScanSupplierIdRef.current, fbsScanSupplyIdRef.current)
    : '';

  /** Ключи стикеров строк — те же правила, что в findFbsRowByStickerScan. */
  const buildFbsStickerKeys = (rows: FbsSupplyScanOrderRow[]) => {
    const keys = new Set<string>();
    for (const row of rows) {
      const scan = normalizeScannedStickerLookupKey(row.stickerScanText || '');
      const text = normalizeScannedStickerLookupKey(row.stickerText || '');
      if (scan) keys.add(`s:${scan}`);
      if (text) keys.add(`s:${text}`);
      if (row.stickerDigits) keys.add(`d:${row.stickerDigits}`);
    }
    return Array.from(keys);
  };

  /** Закладка (не текущая), в поставке которой есть этот стикер. */
  const findFbsScanBookmarkBySticker = (raw: string): FbsScanBookmark | null => {
    const scanText = normalizeScannedStickerLookupKey(raw);
    const digits = normalizeStickerDigits(raw);
    if (!scanText && !digits) return null;
    return fbsScanBookmarks.find((b) => {
      if (b.key === currentFbsScanBookmarkKey || !b.stickerKeys?.length) return false;
      return (scanText && b.stickerKeys.includes(`s:${scanText}`)) || (digits && b.stickerKeys.includes(`d:${digits}`));
    }) || null;
  };

  // Переключение на закладку: ждём, пока раздел сменит поставщика и поставку.
  const fbsScanSwitchRef = useRef<(FbsScanBookmark & { keepMinimized: boolean }) | null>(null);
  // Незаконченный шаг, который надо вернуть после загрузки строк поставки.
  const fbsScanRestorePendingRef = useRef<string | null>(null);
  // Стикер, ради которого переключились: после загрузки находим по нему заказ.
  const fbsScanReplayStickerRef = useRef<string | null>(null);
  // Шаг только что восстановлен — очередь ждёт, пока он окажется в состоянии.
  const fbsScanStepJustSetRef = useRef(false);
  // Скан, пришедший, пока поставка загружалась: обработаем после загрузки.
  const fbsScanQueuedRef = useRef<string | null>(null);

  // Текущий скан — в закладки, с прогрессом, незаконченным шагом и стикерами.
  useEffect(() => {
    if (embeddedMode || !fbsScanModalOpen || fbsScanLoading || fbsScanSwitchRef.current) return;
    const supplierId = fbsScanSupplierIdRef.current;
    const supplyId = fbsScanSupplyIdRef.current;
    if (!supplierId || !supplyId || supplyId !== activeSupplyId || supplierId !== selectedSupplierId) return;
    if (!fbsScanStats.totalRows) return;

    const key = fbsScanBookmarkKey(supplierId, supplyId);
    const pendingStorageKey = fbsScanMode === 'honest_sign' ? fbsPendingStickerRow?.storageKey : undefined;
    setFbsScanBookmarks((prev) => {
      const old = prev.find((b) => b.key === key);
      const supplyName = supplies.find((x) => x.id === supplyId)?.name || old?.supplyName || supplyId;
      if (old && old.scanned === fbsScanStats.scannedCount && old.total === fbsScanStats.totalRows
        && old.pendingStorageKey === pendingStorageKey && old.supplyName === supplyName && old.stickerKeys?.length) {
        return prev;
      }
      const next: FbsScanBookmark = {
        key,
        supplierId,
        supplierName: suppliers.find((x) => x.id === supplierId)?.name || old?.supplierName || supplierId,
        supplyId,
        supplyName,
        scanned: fbsScanStats.scannedCount,
        total: fbsScanStats.totalRows,
        pendingStorageKey,
        stickerKeys: old && old.total === fbsScanStats.totalRows && old.stickerKeys?.length
          ? old.stickerKeys
          : buildFbsStickerKeys(fbsScanRows),
        updatedAt: new Date().toISOString(),
      };
      return [next, ...prev.filter((b) => b.key !== key)].slice(0, FBS_SCAN_BOOKMARKS_MAX);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fbsScanModalOpen, fbsScanLoading, fbsScanStats.scannedCount, fbsScanStats.totalRows, fbsPendingStickerRow, fbsScanMode, activeSupplyId, selectedSupplierId, supplies]);

  const switchFbsScanBookmark = (bookmark: FbsScanBookmark) => {
    if (bookmark.key === currentFbsScanBookmarkKey) {
      setFbsScanMinimized(false);
      return;
    }
    if (!suppliers.some((x) => x.id === bookmark.supplierId)) {
      setError(`Кабинет закладки «${bookmark.supplierName}» не найден — закладка удалена.`);
      setFbsScanBookmarks((prev) => prev.filter((b) => b.key !== bookmark.key));
      return;
    }

    // Отложенная запись снапшота должна уйти под ключом текущей поставки —
    // до того, как в окне окажутся сканы следующей.
    void flushFbsScanMap();

    const keepMinimized = fbsScanModalOpen ? fbsScanMinimized : false;
    fbsScanSwitchRef.current = { ...bookmark, keepMinimized };
    // Сразу помечаем, чей это скан: защита ниже не должна принять
    // переключение за случайную смену поставки.
    fbsScanSupplierIdRef.current = bookmark.supplierId;
    fbsScanSupplyIdRef.current = bookmark.supplyId;
    setFbsPendingStickerRow(null);
    setFbsScanMode('sticker');
    clearScanInput();
    /*
     * Если кабинет меняется, поставку сейчас не ставим: смена кабинета сама
     * сбрасывает поставку, и сброс пришёлся бы уже после открытия скана —
     * защита приняла бы его за выбор другой поставки и закрыла скан. Поставку
     * поставит эффект ниже, когда кабинет сменится.
     */
    const supplierAlreadyActive = selectedSupplierId === bookmark.supplierId;
    if (!embeddedMode) setActiveTab('fbs');
    setSelectedSupplierIdFbs(bookmark.supplierId);
    if (supplierAlreadyActive) setActiveSupplyId(bookmark.supplyId);
  };

  /*
   * Убрать закладку. Если это текущий скан — окно не закрываем, а открываем
   * следующую закладку (или предыдущую, если убрали последнюю). Закрывается
   * окно, только когда закладок не осталось.
   */
  const removeFbsScanBookmark = (bookmark: FbsScanBookmark) => {
    const index = fbsScanBookmarks.findIndex((b) => b.key === bookmark.key);
    const rest = fbsScanBookmarks.filter((b) => b.key !== bookmark.key);
    setFbsScanBookmarks(rest);
    if (bookmark.key !== currentFbsScanBookmarkKey) return;
    const nextBookmark = rest[index] || rest[index - 1] || null;
    if (nextBookmark) switchFbsScanBookmark(nextBookmark);
    else closeFbsScanModal();
  };

  /*
   * Доводим переключение до конца.
   *
   * Смена поставщика сама сбрасывает выбранную поставку (эффект «Clear data
   * when supplier changes»), поэтому ставим поставку снова, пока она не
   * совпадёт с закладкой, и только тогда открываем скан.
   */
  useEffect(() => {
    const sw = fbsScanSwitchRef.current;
    if (!sw) return;
    if (selectedSupplierId !== sw.supplierId) return;
    if (activeSupplyId !== sw.supplyId) {
      setActiveSupplyId(sw.supplyId);
      return;
    }
    fbsScanSwitchRef.current = null;
    fbsScanRestorePendingRef.current = sw.pendingStorageKey || null;
    void openFbsScanModal({ keepMinimized: sw.keepMinimized });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSupplierId, activeSupplyId]);

  // После загрузки: стикер, ради которого переключились, или незаконченный шаг.
  useEffect(() => {
    if (fbsScanLoading || !fbsScanRows.length) return;

    const replay = fbsScanReplayStickerRef.current;
    if (replay) {
      fbsScanReplayStickerRef.current = null;
      fbsScanRestorePendingRef.current = null;
      const row = findFbsRowByStickerScan(replay);
      if (row && !findFbsScanSavedEntry(row, fbsScansBySticker)?.item?.honestSignCode) {
        fbsScanStepJustSetRef.current = true;
        setFbsPendingStickerRow(row);
        setFbsScanMode('honest_sign');
        fbsCue('chz');
        const supplyName = supplies.find((x) => x.id === activeSupplyId)?.name || activeSupplyId || '';
        setFbsScanNotice({ type: 'success', text: `Переключился на поставку «${supplyName}»: найден заказ ${row.orderId}. Сканируйте ЧЗ.` });
      } else if (row) {
        setFbsScanNotice({ type: 'info', text: `Переключился на поставку заказа ${row.orderId}, но ЧЗ по нему уже отсканирован.` });
      } else {
        setFbsScanNotice({ type: 'error', text: 'Переключился на закладку, но стикера в поставке уже нет — обновите данные.' });
        fbsCue('error');
      }
      return;
    }

    const key = fbsScanRestorePendingRef.current;
    if (!key) return;
    fbsScanRestorePendingRef.current = null;
    const row = fbsScanRows.find((r) => r.storageKey === key);
    if (!row || findFbsScanSavedEntry(row, fbsScansBySticker)?.item?.honestSignCode) return;
    fbsScanStepJustSetRef.current = true;
    setFbsPendingStickerRow(row);
    setFbsScanMode('honest_sign');
    setFbsScanNotice({ type: 'info', text: `Продолжаем: заказ ${row.orderId} ждёт ЧЗ.` });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fbsScanLoading, fbsScanRows]);

  // Скан, пришедший во время загрузки, — отправляем, когда поставка готова.
  useEffect(() => {
    const queued = fbsScanQueuedRef.current;
    const input = fbsScanInputRef.current;
    // Очереди нет — флаг восстановленного шага защищать нечего.
    if (!queued) { fbsScanStepJustSetRef.current = false; return; }
    if (fbsScanLoading || !fbsScanRows.length || !input) return;
    // Строки ещё от прежней поставки (идёт переключение) — ждём новые.
    if (fbsScanSwitchRef.current || fbsScanRowsSupplyRef.current !== activeSupplyId) return;
    // Восстановленный шаг ещё не применился — дождёмся следующего рендера,
    // иначе ЧЗ обработался бы как стикер.
    if (fbsScanStepJustSetRef.current) {
      fbsScanStepJustSetRef.current = false;
      return;
    }
    fbsScanQueuedRef.current = null;
    const timer = setTimeout(() => {
      input.value = queued;
      input.form?.requestSubmit();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fbsScanLoading, fbsScanRows, fbsScanMode, fbsPendingStickerRow, activeSupplyId]);

  /*
   * Скан не должен пережить смену поставки или поставщика.
   *
   * Скан записывается в «активную» поставку под выбранным поставщиком. Пока
   * окно свёрнуто, доступны список поставок и другие вкладки ФБС — у каждой
   * свой выбранный поставщик. Щелчок по другой поставке или переход во
   * вкладку с другим кабинетом молча перевёл бы сканы не туда: марки легли бы
   * на чужие задания или ушли бы под чужим кабинетом. Поэтому такой скан
   * откладываем в закладку и закрываем — вернуться к нему можно одним щелчком.
   */
  useEffect(() => {
    if (!fbsScanModalOpen || fbsScanSwitchRef.current) return;
    const scanSupply = fbsScanSupplyIdRef.current;
    const scanSupplier = fbsScanSupplierIdRef.current;
    const supplyChanged = Boolean(scanSupply) && scanSupply !== activeSupplyId;
    const supplierChanged = Boolean(scanSupplier) && scanSupplier !== selectedSupplierId;
    if (!supplyChanged && !supplierChanged) return;

    const name = fbsScanBookmarks.find((b) => b.supplyId === scanSupply)?.supplyName
      || supplies.find((x) => x.id === scanSupply)?.name
      || scanSupply;
    closeFbsScanModal();
    setSuccessMsg(`Скан поставки «${name}» отложен в закладки: выбрана другая ${supplyChanged ? 'поставка' : 'вкладка с другим кабинетом'}. Отсканированное сохранено.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSupplyId, selectedSupplierId]);

  /*
   * Живые сканы между рабочими местами.
   *
   * Окно «Скан ЧЗ», открытое на двух компьютерах, не видело сканы друг друга
   * до повторного открытия. Теперь открытое окно подписано на строки своей
   * поставки в fbs_order_codes (realtime с фильтром supply_id) — только пока
   * открыто. Опросов нет: пока никто не сканирует, нет ни одного запроса.
   *
   *  - скан на другом месте приходит строкой и сразу отмечается здесь;
   *    свой же скан, вернувшийся эхом, узнаётся по совпадению кода и
   *    пропускается без работы;
   *  - сброс на другом месте приходит событием без данных строки (только id),
   *    поэтому тогда перечитываем сканы поставки одним запросом;
   *  - после переподключения realtime и при возврате во вкладку — та же
   *    сверка, но без удалений: пропущенные события могли быть только
   *    добавлениями, а удалять по неполной картине нельзя.
   */
  const fbsScanSavingKeysRef = useRef(fbsScanSavingKeys);
  useEffect(() => { fbsScanSavingKeysRef.current = fbsScanSavingKeys; }, [fbsScanSavingKeys]);
  const fbsPendingStickerRowRef = useRef(fbsPendingStickerRow);
  useEffect(() => { fbsPendingStickerRowRef.current = fbsPendingStickerRow; }, [fbsPendingStickerRow]);

  /** Ждём ЧЗ по заказу, который уже закрыли на другом месте, — сбрасываем шаг. */
  const releaseFbsPendingTakenElsewhere = (map: Record<string, FbsSupplyScanSavedItem>) => {
    const pending = fbsPendingStickerRowRef.current;
    if (!pending) return;
    const orderId = String(pending.orderId || '').trim();
    const taken = Object.values(map).some((item) => String(item?.orderId || '').trim() === orderId && item?.honestSignCode);
    if (!taken) return;
    setFbsPendingStickerRow(null);
    setFbsScanMode('sticker');
    clearScanInput();
    fbsCue('error');
    setFbsScanNotice({ type: 'error', text: `Заказ ${orderId} уже отсканирован на другом рабочем месте. Отложите товар и сканируйте следующий стикер.` });
  };

  /**
   * Свести карту сканов окна со строками базы (база — источник правды).
   *
   * Коды, заменённые на другом месте, обновляются; сканы с других мест
   * добавляются; с allowRemovals убираются сканы, которых в базе больше нет, —
   * кроме своих, ещё едущих в базу, и совсем свежих (до 30 секунд).
   */
  const mergeFbsScanMapWithDb = (
    current: Record<string, FbsSupplyScanSavedItem>,
    dbScans: Awaited<ReturnType<typeof fetchFbsSupplyScans>>,
    rows: FbsSupplyScanOrderRow[],
    allowRemovals: boolean,
  ) => {
    const dbByOrder = new Map<string, (typeof dbScans)[number]>();
    dbScans.forEach((scan) => {
      const id = String(scan.orderId || '').trim();
      if (id && scan.chzCode) dbByOrder.set(id, scan);
    });

    const next: Record<string, FbsSupplyScanSavedItem> = { ...current };
    let changed = 0;
    const now = Date.now();

    for (const [key, item] of Object.entries(current)) {
      const orderId = String(item?.orderId || '').trim();
      if (!orderId || !item?.honestSignCode) continue;
      const db = dbByOrder.get(orderId);
      if (db) {
        const code = normalizeDataMatrixText(db.chzCode);
        if (code && code !== normalizeDataMatrixText(String(item.honestSignCode))) {
          next[key] = { ...item, honestSignCode: code, updatedAt: db.scannedAt || item.updatedAt };
          changed += 1;
        }
        continue;
      }
      if (!allowRemovals) continue;
      // Свой скан, который ещё едет в базу, не трогаем.
      if (fbsScanSavingKeysRef.current[key]) continue;
      const age = now - new Date(item.updatedAt || 0).getTime();
      if (Number.isFinite(age) && age < 30_000) continue;
      delete next[key];
      changed += 1;
    }

    const restored = restoreFbsScansFromDb(next, dbScans, rows);
    return { map: restored.map, changed: changed + restored.added };
  };

  const reconcileFbsScansWithDb = async (supplierId: string, supplyId: string, allowRemovals: boolean) => {
    const dbScans = await fetchFbsSupplyScans(supplierId, supplyId);
    // Пока ждали ответ, окно могли закрыть или переключить на другую поставку.
    if (fbsScanSupplyIdRef.current !== supplyId || fbsScanSupplierIdRef.current !== supplierId) return;
    if (fbsScanRowsSupplyRef.current !== supplyId) return;

    const merged = mergeFbsScanMapWithDb(fbsScansRef.current, dbScans, fbsScanRowsRef.current, allowRemovals);
    if (!merged.changed) return;
    applyFbsScans(merged.map);
    releaseFbsPendingTakenElsewhere(merged.map);
  };

  useEffect(() => {
    if (embeddedMode || !fbsScanModalOpen || fbsScanLoading) return;
    const supplyId = fbsScanSupplyIdRef.current;
    const supplierId = fbsScanSupplierIdRef.current;
    if (!supplyId || !supplierId || supplyId !== activeSupplyId) return;

    let deleteTimer: ReturnType<typeof setTimeout> | null = null;
    let subscribedOnce = false;

    const applyRemoteRow = (r: any) => {
      if (!r || String(r.supplier_id || '') !== supplierId) return;
      const code = normalizeDataMatrixText(String(r.chz_code || ''));
      const orderId = String(r.order_id || '').trim();
      if (!code || !orderId) return;
      if (fbsScanSupplyIdRef.current !== supplyId) return;

      const current = fbsScansRef.current;
      const existingKey = Object.keys(current).find((k) => String(current[k]?.orderId || '').trim() === orderId);
      // Своё эхо или уже известный скан — ничего не делаем.
      if (existingKey && normalizeDataMatrixText(String(current[existingKey]?.honestSignCode || '')) === code) return;

      const row = fbsScanRowsRef.current.find((x) => String(x.orderId || '').trim() === orderId);
      const storageKey = row?.storageKey || existingKey || `order:${orderId}`;
      const next: Record<string, FbsSupplyScanSavedItem> = { ...current };
      if (existingKey && existingKey !== storageKey) delete next[existingKey];
      next[storageKey] = {
        storageKey,
        stickerDigits: row?.stickerDigits || String(r.sticker_digits || ''),
        stickerScanText: row?.stickerScanText || String(r.sticker_text || ''),
        honestSignCode: code,
        updatedAt: String(r.scanned_at || new Date().toISOString()),
        orderId,
        title: row?.title || String(r.title || ''),
        article: row?.article || String(r.article || ''),
        size: row?.size || String(r.size || ''),
      };
      applyFbsScans(next);
      releaseFbsPendingTakenElsewhere(next);
    };

    const channel = supabase
      .channel(`fbs_scan_live:${supplyId}:${Math.random().toString(36).slice(2, 8)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fbs_order_codes', filter: `supply_id=eq.${supplyId}` },
        (payload: any) => {
          if (payload.eventType === 'DELETE') {
            if (deleteTimer) clearTimeout(deleteTimer);
            deleteTimer = setTimeout(() => {
              void reconcileFbsScansWithDb(supplierId, supplyId, true).catch((e) => console.error('сверка сканов после сброса', e));
            }, 800);
            return;
          }
          applyRemoteRow(payload.new);
        },
      )
      .subscribe((status: string) => {
        if (status !== 'SUBSCRIBED') return;
        // Первая подписка сразу после загрузки — данные свежие. Повторная
        // значит переподключение: за это время события могли пропасть.
        if (subscribedOnce) {
          void reconcileFbsScansWithDb(supplierId, supplyId, false).catch((e) => console.error('сверка сканов после переподключения', e));
        }
        subscribedOnce = true;
      });

    return () => {
      if (deleteTimer) clearTimeout(deleteTimer);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fbsScanModalOpen, fbsScanLoading, activeSupplyId]);

  // Вернулись во вкладку — сверка без удалений, не чаще раза в 15 секунд.
  useEffect(() => {
    if (embeddedMode || !fbsScanModalOpen) return;
    let last = 0;
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - last < 15_000) return;
      const supplyId = fbsScanSupplyIdRef.current;
      const supplierId = fbsScanSupplierIdRef.current;
      if (!supplyId || !supplierId || fbsScanRowsSupplyRef.current !== supplyId) return;
      last = Date.now();
      void reconcileFbsScansWithDb(supplierId, supplyId, false).catch((e) => console.error('сверка сканов при возврате', e));
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fbsScanModalOpen]);

  /** Ярлыки закладок — одни и те же в плашке, в окне и в лотке. */
  const renderFbsScanBookmarks = () => {
    if (embeddedMode || !fbsScanBookmarks.length) return null;
    return (
      <div className="flex flex-wrap gap-1.5">
        {fbsScanBookmarks.map((b) => {
          const current = b.key === currentFbsScanBookmarkKey;
          const done = b.total > 0 && b.scanned >= b.total;
          return (
            <div
              key={b.key}
              className={`inline-flex max-w-full items-center overflow-hidden rounded-lg border text-[11px] ${
                current
                  ? 'border-indigo-500 bg-indigo-600 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-indigo-400'
              }`}
            >
              <button
                type="button"
                onClick={() => switchFbsScanBookmark(b)}
                title={`${b.supplierName} · ${b.supplyName} (${b.supplyId})${b.pendingStorageKey ? ' · есть незаконченный шаг' : ''}`}
                className="flex min-w-0 items-center gap-1 px-2 py-1 text-left"
              >
                <span className="max-w-[90px] truncate font-semibold">{b.supplierName.replace(/^ИП\s+/i, '')}</span>
                <span className="opacity-70">…{b.supplyId.slice(-5)}</span>
                <span className={`tabular-nums ${done ? 'font-bold' : ''}`}>{done ? '✓ ' : ''}{b.scanned}/{b.total}</span>
                {b.pendingStorageKey ? <span title="Незаконченный шаг">⏸</span> : null}
              </button>
              <button
                type="button"
                onClick={() => removeFbsScanBookmark(b)}
                title={current ? 'Убрать закладку и закрыть скан' : 'Убрать закладку'}
                className={`px-1.5 py-1 ${current ? 'hover:bg-indigo-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  /*
   * Поле скана — одно на оба вида окна.
   *
   * В развёрнутом окне оно в левой колонке, в свёрнутом — в плашке в углу.
   * Рисуется ровно в одном месте за раз, поэтому ref переезжает вместе с ним,
   * и весь разбор скана, звук и автоотправка в WB работают одинаково.
   */
  const renderFbsScanForm = (compact: boolean) => (
    <form onSubmit={handleFbsScanSubmit} className={compact ? 'flex gap-2' : 'flex flex-col gap-2'}>
      <input
        ref={fbsScanInputRef}
        type="text"
        defaultValue=""
        onInput={onScanInputBurst}
        inputMode="none"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder={
          fbsScanMode === 'sticker'
            ? (compact ? 'Сканируйте стикер…' : 'Сканируйте значение из колонки «Стикер при считывании»...')
            : (compact ? 'Сканируйте ЧЗ…' : 'Сканируйте код Честного знака...')
        }
        className={compact ? 'min-w-0 flex-1 oc-input !py-1.5 text-sm' : 'flex-1 oc-input'}
        autoFocus
      />
      {!compact && (
        <button
          type="submit"
          disabled={fbsScanLoading}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {fbsScanMode === 'sticker' ? 'Найти строку' : 'Сохранить ЧЗ'}
        </button>
      )}
      {fbsScanMode === 'honest_sign' && (
        <button
          type="button"
          onClick={() => { setFbsPendingStickerRow(null); setFbsScanMode('sticker'); fbsCue('sticker'); clearScanInput(); setFbsScanNotice({ type: 'info', text: 'Скан ЧЗ сброшен. Можно сканировать следующий стикер.' }); }}
          className={compact
            ? 'shrink-0 px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-50'
            : 'px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}
        >
          Сбросить
        </button>
      )}
    </form>
  );

  return (
    <div className={embeddedMode ? 'font-sans text-slate-800' : 'p-3 md:p-6 bg-slate-50 min-h-screen font-sans text-slate-800'}>
      {!embeddedMode && (
        <>
          {/* Шапка: название, поставщик и вкладки — одной карточкой. */}
          <div className="mb-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 p-2.5 text-white shadow-md shadow-violet-500/30">
                  <Truck className="h-6 w-6" />
                </span>
                <div>
                  <h1 className="text-xl font-bold leading-tight text-slate-900">Управление поставками FBS</h1>
                  <p className="text-xs text-slate-500">{selectedSupplier?.name || 'Поставщик не выбран'}</p>
                </div>
              </div>

              {/* Выбор поставщика — только там, где он свой у вкладки ФБС */}
              {(activeTab === 'fbs' || activeTab === 'orders_db' || activeTab === 'chz_withdrawal') && (
                <label className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Поставщик</span>
                  <select
                    className="min-w-[240px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                    value={selectedSupplierId}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (activeTab === 'fbs') setSelectedSupplierIdFbs(value);
                      else if (activeTab === 'orders_db' || activeTab === 'chz_withdrawal') setSelectedSupplierIdOrdersDb(value);
                      else if (activeTab === 'supply_order') setSelectedSupplierIdSupplyOrder(value);
                      else if (activeTab === 'fbs_calc') setSelectedSupplierIdCalc(value);
                    }}
                  >
                    {fbsSuppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <div className="flex gap-1 overflow-x-auto whitespace-nowrap border-t border-slate-100 px-2 py-2">
              {([
                { id: 'fbs', title: 'Управление FBS', Icon: LayoutGrid },
                { id: 'orders_db', title: 'База заказов', Icon: Database },
                { id: 'chz_withdrawal', title: 'Вывод из оборота', Icon: ShieldCheck },
                { id: 'fbs_calc', title: 'ФБС расчет', Icon: Calculator },
                { id: 'fbs_orders', title: 'Заказы ФБС', Icon: FileSpreadsheet },
                { id: 'fbo_acceptance', title: 'Приемка ФБО', Icon: FileSpreadsheet },
              ] as const).map(({ id, title, Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as WBSupplyManagerTab)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                    activeTab === id
                      ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/30'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {title}
                </button>
              ))}
            </div>
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

      {/* Content: База заказов — что уехало с каким ЧЗ */}
      {activeTab === 'orders_db' && (
        <React.Suspense fallback={<div className="p-6 text-slate-500">Загружаю «Базу заказов»…</div>}>
          <FbsOrdersDatabase
            supplierId={selectedSupplierIdOrdersDb}
            supplierName={selectedSupplier?.name}
            wbFetch={wbFetch}
          />
        </React.Suspense>
      )}

      {/* Content: Вывод из оборота — ЧЗ по проданным заказам */}
      {activeTab === 'chz_withdrawal' && (
        <React.Suspense fallback={<div className="p-6 text-slate-500">Загружаю «Вывод ЧЗ»…</div>}>
          <ChzWithdrawal supplierId={selectedSupplierIdOrdersDb} supplierName={selectedSupplier?.name} />
        </React.Suspense>
      )}

      {/* Content: FBS Tab */}
      {activeTab === 'fbs' && (
        <>
        {/* Наличие ЧЗ у выбранного поставщика и прогноз, когда кончится. */}
        {selectedSupplierId && selectedSupplierId !== '__all__' && (
          <FbsChzStockPanel
            supplierId={selectedSupplierId}
            supplierName={selectedSupplier?.name}
            loadOrderNmIds={loadFbsOrderNmIds}
          />
        )}

        {/*
          Две колонки вместо трёх: действие «Добавить в поставку» стояло
          отдельной колонкой посередине и занимало треть экрана ради одной
          кнопки. Теперь это панель внизу списка заказов — рядом с выбором.
        */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

            {/* Новые заказы */}
            <div className="flex min-h-[380px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm 2xl:h-[calc(100vh-10rem)]">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                    <div className="flex items-center gap-3">
                        <span className="rounded-xl bg-blue-100 p-2 text-blue-600"><Package className="h-5 w-5" /></span>
                        <div>
                            <h2 className="font-bold leading-tight text-slate-900">Новые заказы</h2>
                            <div className="text-xs text-slate-500">
                                Всего <span className="tabular-nums">{orders.length}</span> · выбрано <span className="font-semibold tabular-nums text-blue-700">{selectedOrderIds.size}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={toggleAllOrders}
                            disabled={orders.length === 0}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                        >
                            {selectedOrderIds.size === orders.length && orders.length > 0 ? 'Снять все' : 'Выбрать все'}
                        </button>
                        <button
                            onClick={fetchNewOrders}
                            disabled={loading}
                            className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                            title="Обновить заказы"
                        >
                            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                <div className="2xl:flex-1 2xl:overflow-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="w-10 px-4 py-2.5">
                                    <input
                                        type="checkbox"
                                        checked={selectedOrderIds.size === orders.length && orders.length > 0}
                                        onChange={toggleAllOrders}
                                        className="rounded border-slate-300"
                                    />
                                </th>
                                <th className="px-3 py-2.5 font-semibold">Заказ</th>
                                <th className="px-3 py-2.5 font-semibold">Товар</th>
                                <th className="px-3 py-2.5 font-semibold">Дата</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-10 text-center text-slate-400">
                                        Нет новых заказов
                                    </td>
                                </tr>
                            ) : (
                                orders.map(order => {
                                    const checked = selectedOrderIds.has(order.id.toString());
                                    return (
                                    <tr
                                        key={order.id}
                                        className={`cursor-pointer border-b border-slate-100 transition-colors ${checked ? 'bg-blue-50/80' : 'hover:bg-slate-50'}`}
                                        onClick={() => toggleOrderSelection(order.id.toString())}
                                    >
                                        <td className="px-4 py-2.5">
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleOrderSelection(order.id.toString())}
                                                className="rounded border-slate-300"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className="font-mono font-medium text-slate-900">{order.id}</div>
                                            <div className={`text-xs ${order.supplyId ? 'text-violet-600' : 'text-slate-400'}`}>{order.supplyId ? `В поставке: ${order.supplyId}` : 'Не в поставке'}</div>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className="max-w-[220px] truncate font-medium text-slate-800" title={order.article}>{order.article}</div>
                                            <div className="text-xs tabular-nums text-slate-500">{(order.convertedPrice / 100).toLocaleString('ru-RU')} ₽</div>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-2.5 text-xs text-slate-500">
                                            {formatDate(order.createdAt)}
                                        </td>
                                    </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Добавление в поставку — под списком, рядом с выбором */}
                {(() => {
                    const target = supplies.find((x) => x.id === activeSupplyId);
                    const ready = Boolean(activeSupplyId) && selectedOrderIds.size > 0 && !loading;
                    return (
                        <div className="border-t border-slate-100 bg-slate-50/80 p-3">
                            <button
                                onClick={addOrdersToSupply}
                                disabled={!ready}
                                className={`flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3 transition ${
                                    ready
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99]'
                                        : 'cursor-not-allowed bg-slate-200 text-slate-400'
                                }`}
                            >
                                <Plus className="h-5 w-5" />
                                <span className="text-left">
                                    <span className="block font-bold">Добавить в поставку</span>
                                    <span className="block text-xs opacity-80">
                                        {selectedOrderIds.size} {selectedOrderIds.size === 1 ? 'заказ' : 'заказов'} → {target ? target.name : activeSupplyId ? activeSupplyId : 'выберите поставку справа'}
                                    </span>
                                </span>
                            </button>

                            {/* Сборка: по поставке на каждый склад отгрузки, задания внутрь */}
                            <button
                                onClick={() => void openAssemblePlan()}
                                disabled={Boolean(assemblePlan?.busy || assemblePlan?.running)}
                                title="Создать поставку на каждый склад отгрузки и разложить по ним все новые задания"
                                className="mt-2 flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-white shadow-md shadow-violet-500/30 transition hover:from-violet-700 hover:to-fuchsia-700 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300"
                            >
                                <Truck className="h-5 w-5" />
                                <span className="text-left">
                                    <span className="block font-bold">Собрать поставки</span>
                                    <span className="block text-xs opacity-80">по поставке на каждый склад отгрузки</span>
                                </span>
                            </button>
                        </div>
                    );
                })()}
            </div>

            {/* Поставки */}
            <div className="flex min-h-[380px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm 2xl:h-[calc(100vh-10rem)]">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                    <div className="flex items-center gap-3">
                        <span className="rounded-xl bg-violet-100 p-2 text-violet-600"><Truck className="h-5 w-5" /></span>
                        <div>
                            <h2 className="font-bold leading-tight text-slate-900">Поставки</h2>
                            <label className="flex cursor-pointer select-none items-center gap-1.5 text-xs text-slate-500">
                                <input
                                    type="checkbox"
                                    checked={showAllSupplies}
                                    onChange={(e) => setShowAllSupplies(e.target.checked)}
                                    className="h-3.5 w-3.5 rounded border-slate-300"
                                />
                                Показывать закрытые
                            </label>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setSelectedSupplyIds((prev) => (prev.size === supplies.length && supplies.length > 0 ? new Set() : new Set(supplies.map((x) => x.id))))}
                            disabled={supplies.length === 0}
                            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                            title="Отметить все поставки для выгрузки"
                        >
                            {selectedSupplyIds.size === supplies.length && supplies.length > 0 ? 'Снять все' : 'Выбрать все'}
                        </button>
                        <button
                            onClick={() => setShowCreateSupplyModal(true)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
                            title="Создать поставку"
                        >
                            <Plus className="h-4 w-4" /> Новая
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
                            className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                            title="Обновить базу товаров"
                        >
                            <Package className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={fetchSupplies}
                            disabled={loading}
                            className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100"
                            title="Обновить поставки"
                        >
                            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                <div className="2xl:flex-1 2xl:overflow-auto">
                    {supplies.length === 0 ? (
                        <div className="p-10 text-center text-slate-400">Нет поставок</div>
                    ) : (
                        supplies.map(supply => (
                            <div 
                                key={supply.id}
                                onClick={() => setActiveSupplyId(supply.id)}
                                className={`
                                    cursor-pointer border-b border-l-4 border-slate-100 px-4 py-3 transition-colors
                                    ${activeSupplyId === supply.id ? 'border-l-violet-500 bg-violet-50/70' : 'border-l-transparent hover:bg-slate-50'}
                                `}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex min-w-0 items-start gap-2">
                                        {/* Галочка — выбор поставки для выгрузки листов и кодов подряд. */}
                                        <input
                                            type="checkbox"
                                            checked={selectedSupplyIds.has(supply.id)}
                                            onChange={() => toggleSupplySelection(supply.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            title="Отметить для выгрузки листа и кодов"
                                            className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300"
                                        />
                                        <div className="min-w-0">
                                            <div className="truncate font-semibold text-slate-900">{supply.name}</div>
                                            <div className="font-mono text-xs text-slate-400">{supply.id}</div>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 flex-col items-end gap-1">
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${supply.closedAt ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {supply.closedAt ? 'Закрыта' : 'Активна'}
                                        </span>
                                        <span className="text-xs text-slate-400">{formatDate(supply.createdAt)}</span>
                                    </div>
                                </div>
                                
                                {activeSupplyId === supply.id && (
                                    /*
                                     * Действия поставки — одним стилем, по важности.
                                     *
                                     * «Скан ЧЗ» — главное действие у стола: во всю ширину и
                                     * крупнее всех. Печать — вторым рядом, остальное — мельче.
                                     * Цвет у каждой кнопки свой, чтобы находить её глазом, а не
                                     * читая подписи.
                                     */
                                    <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openFbsScanModal(); }}
                                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-base font-extrabold text-white shadow-md shadow-emerald-500/30 ring-1 ring-emerald-600/20 transition hover:from-emerald-600 hover:to-teal-600 active:scale-[0.99]"
                                        >
                                            <CheckSquare className="w-5 h-5" /> Скан ЧЗ
                                        </button>

                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // С марками из базы сначала показываем план, без них печатаем сразу.
                                                    if (fbsStickersWithChz) void buildChzPlan(supply.id);
                                                    else void downloadFBSStickers({ supplyId: supply.id });
                                                }}
                                                title={fbsStickersWithChz ? 'Покажем, какому товару какая марка достанется и сколько их в базе, и только потом печать' : 'Печать стикеров WB'}
                                                className="flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-2 text-sm font-bold text-white shadow-sm shadow-indigo-500/25 transition hover:from-indigo-600 hover:to-violet-600"
                                            >
                                                <Printer className="w-4 h-4" /> {fbsStickersWithChz ? 'Стикеры + ЧЗ' : 'Стикеры'}
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); generatePickingList(); }}
                                                className="flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-blue-500 px-3 py-2 text-sm font-bold text-white shadow-sm shadow-sky-500/25 transition hover:from-sky-600 hover:to-blue-600"
                                            >
                                                <FileText className="w-4 h-4" /> Лист подбора
                                            </button>
                                        </div>

                                        {/* Грузоместа — и здесь, и в окне «Скан ЧЗ»: коробки для ПВЗ
                                            иногда создают до сборки, не открывая окно скана. */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); void openBoxesModal(supply.id); }}
                                            title="Создать грузоместа у WB и напечатать их стикеры — для отгрузки на ПВЗ"
                                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-2 text-sm font-bold text-white shadow-sm shadow-orange-500/25 transition hover:from-orange-600 hover:to-amber-600"
                                        >
                                            <Package className="w-4 h-4" /> Грузоместа
                                        </button>

                                        <div className="grid grid-cols-3 gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); generateGroupedSupplierPickingList(); }}
                                                title="Лист подбора с группировкой по товару"
                                                className="flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-cyan-500 to-sky-500 px-2 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:from-cyan-600 hover:to-sky-600"
                                            >
                                                <List className="w-3.5 h-3.5" /> Лист (групп.)
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); generateSupplyBarcode(); }}
                                                title="Штрихкод поставки"
                                                className="flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-slate-600 to-slate-700 px-2 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:from-slate-700 hover:to-slate-800"
                                            >
                                                <Barcode className="w-3.5 h-3.5" /> ШК
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); downloadFbsScanTemplateExcel(); }}
                                                title="Excel-шаблон для скана"
                                                className="flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:from-amber-600 hover:to-orange-600"
                                            >
                                                <Download className="w-3.5 h-3.5" /> Excel
                                            </button>
                                        </div>

                                        {/* «ЧЗ из базы»: коды из базы прикрепляются к заданиям при печати.
                                            Макет выбирается здесь же, у кнопки печати. */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            <label
                                                title="Каждому заданию подбирается код из базы ЧЗ по категории, полу и размеру: печатается на этикетке, сразу прикрепляется к заданию и уходит в WB. Сканировать такие задания не нужно. Задания, которым код не подошёл, печатаются обычным стикером — их сканируют"
                                                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={fbsStickersWithChz}
                                                    onChange={(e) => setFbsStickersWithChz(e.target.checked)}
                                                    className="w-3.5 h-3.5"
                                                />
                                                ЧЗ из базы
                                            </label>
                                            {fbsStickersWithChz && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); void downloadFBSStickers({ onlyMissing: true }); }}
                                                    title="Напечатать этикетки только тем заданиям, у которых ещё нет ЧЗ. Задания с маркой не перепечатываются"
                                                    className="flex items-center gap-1 rounded-lg border border-indigo-300 bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                                                >
                                                    <Printer className="w-3.5 h-3.5" /> Допечатать без ЧЗ
                                                </button>
                                            )}
                                            {fbsStickersWithChz && (
                                                <select
                                                    value={fbsLabelKind}
                                                    onChange={(e) => {
                                                        const next = e.target.value as FbsLabelKind;
                                                        setFbsLabelKind(next);
                                                        try { localStorage.setItem('fbs_label_kind_v1', next); } catch {}
                                                    }}
                                                    title="Макет этикетки с ЧЗ. Настраивается в разделе «Конструктор этикеток»"
                                                    className="rounded-lg border border-amber-300 bg-white px-2 py-1 text-xs text-amber-800"
                                                >
                                                    {(Object.keys(FBS_LABEL_KIND_TITLES) as FbsLabelKind[]).map((id) => (
                                                        <option key={id} value={id}>{FBS_LABEL_KIND_TITLES[id]}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Пакетная выгрузка по отмеченным поставкам */}
                {selectedSupplyIds.size > 0 && (
                    <div className="space-y-2 border-t border-slate-100 bg-slate-50/80 p-3">
                        <button
                            onClick={() => void runBulkSupplyExport()}
                            disabled={Boolean(bulkExport && !bulkExport.done)}
                            className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-4 py-3 text-white shadow-md shadow-sky-500/30 transition hover:from-sky-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300"
                        >
                            <Download className="h-5 w-5" />
                            <span className="text-left">
                                <span className="block font-bold">Скачать листы и коды ({selectedSupplyIds.size})</span>
                                <span className="block text-xs opacity-80">по каждой поставке: лист подбора, следом файл кодов</span>
                            </span>
                        </button>

                        {bulkExport && (
                            <div className="rounded-xl bg-white px-3 py-2 text-xs text-slate-600 shadow-sm">
                                {bulkExport.done
                                    ? `Готово: ${bulkExport.total} поставок`
                                    : `Поставка ${bulkExport.index} из ${bulkExport.total}: ${bulkExport.name} — ${bulkExport.stage}`}
                                {bulkExport.errors.length > 0 && (
                                    <ul className="mt-1 list-disc pl-4 text-rose-600">
                                        {bulkExport.errors.map((msg, i) => <li key={i}>{msg}</li>)}
                                    </ul>
                                )}
                            </div>
                        )}

                        <button
                            onClick={() => { setSelectedSupplyIds(new Set()); setBulkExport(null); }}
                            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-white"
                        >
                            Снять выбор
                        </button>
                    </div>
                )}
            </div>
        </div>
        </>
      )}

      {chzPrintReport && (() => {
        const r = chzPrintReport;
        const groups: Array<{ kind: string; title: string; tone: string }> = [
          { kind: 'no_code', title: 'Нет подходящего кода в базе — сканировать', tone: 'amber' },
          { kind: 'no_card', title: 'Нет карточки или в ней не указан пол — сканировать', tone: 'amber' },
          { kind: 'claim_lost', title: 'Не удалось закрепить код из базы', tone: 'amber' },
          { kind: 'no_sticker', title: 'WB не отдал стикер', tone: 'rose' },
          { kind: 'canceled', title: 'Отменённые задания — не печатались', tone: 'slate' },
        ];
        const needsChz = r.rows.filter((row) => row.kind !== 'canceled').length;
        return (
          <div className="fixed inset-0 z-[70] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setChzPrintReport(null)}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className={`px-5 py-4 text-white flex items-start justify-between gap-4 ${needsChz ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`}>
                <div>
                  <div className="text-lg font-bold flex items-center gap-2"><Printer className="w-5 h-5" /> {r.onlyMissing ? 'Допечатка без ЧЗ' : 'Печать стикеров'}</div>
                  <div className="text-sm opacity-90">{r.supplyName}</div>
                </div>
                <button onClick={() => setChzPrintReport(null)} className="p-1.5 rounded-lg hover:bg-white/20"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 overflow-auto space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-slate-50 p-3"><div className="text-2xl font-extrabold tabular-nums">{r.printed}</div><div className="text-xs text-slate-500">напечатано</div></div>
                  <div className="rounded-xl bg-emerald-50 p-3"><div className="text-2xl font-extrabold tabular-nums text-emerald-700">{r.withChz}</div><div className="text-xs text-emerald-700">с ЧЗ (новых {r.newChz})</div></div>
                  <div className={`rounded-xl p-3 ${needsChz ? 'bg-amber-50' : 'bg-slate-50'}`}><div className={`text-2xl font-extrabold tabular-nums ${needsChz ? 'text-amber-700' : ''}`}>{needsChz}</div><div className="text-xs text-slate-500">без ЧЗ</div></div>
                </div>
                {!r.statusChecked && (
                  <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">Статусы заданий у WB получить не удалось — отменённые задания могли попасть в печать.</div>
                )}
                {!r.rows.length && (
                  <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Все напечатанные задания получили ЧЗ, отменённых нет.</div>
                )}
                {groups.map((g) => {
                  const rows = r.rows.filter((row) => row.kind === g.kind);
                  if (!rows.length) return null;
                  return (
                    <div key={g.kind}>
                      <div className="mb-1.5 text-sm font-bold text-slate-800">{g.title}: {rows.length}</div>
                      <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
                        {rows.map((row) => (
                          <div key={`${g.kind}-${row.orderId}`} className="px-3 py-2 text-sm">
                            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                              {row.sticker ? <span className="font-mono font-bold text-slate-900">{row.sticker}</span> : null}
                              <span className="font-mono text-xs text-slate-500">задание {row.orderId}</span>
                              <span className="text-slate-700">{[row.article, row.size].filter(Boolean).join(' · ')}</span>
                            </div>
                            <div className="text-xs text-slate-500">{row.reason}</div>
                            {row.needGender && row.nmId && (
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <span className="text-xs text-slate-500">Пол товара:</span>
                                {(['male', 'female'] as const).map((g) => (
                                  <button
                                    key={g}
                                    disabled={chzGenderPick[row.nmId] === 'busy'}
                                    onClick={() => void pickChzGender(row.nmId, g)}
                                    className={`px-2 py-0.5 rounded-lg border text-xs font-semibold transition ${chzGenderPick[row.nmId] === g ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                                  >
                                    {g === 'male' ? 'Мужской' : 'Женский'}
                                  </button>
                                ))}
                                {chzGenderPick[row.nmId] && chzGenderPick[row.nmId] !== 'busy' && (
                                  <span className="text-xs text-emerald-700">сохранено — жмите «Допечатать без ЧЗ»</span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-5 py-3 border-t border-slate-100 flex flex-wrap justify-end gap-2">
                {r.rows.some((row) => row.kind !== 'canceled') && (
                  <button
                    onClick={() => { setChzPrintReport(null); void downloadFBSStickers({ onlyMissing: true }); }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
                  >
                    Допечатать без ЧЗ
                  </button>
                )}
                <button onClick={() => setChzPrintReport(null)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-50">Понятно</button>
              </div>
            </div>
          </div>
        );
      })()}

      {assemblePlan && (() => {
        const plan = assemblePlan;
        const totalOrders = plan.groups.reduce((sum, g) => sum + g.orderIds.length, 0);
        return (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={() => { if (!plan.running) setAssemblePlan(null); }}>
            <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-4 text-white">
                <div>
                  <div className="flex items-center gap-2 text-lg font-bold"><Truck className="h-5 w-5" /> Сборка поставок</div>
                  <div className="text-sm opacity-90">{selectedSupplier?.name || 'кабинет не выбран'}</div>
                </div>
                <button onClick={() => { if (!plan.running) setAssemblePlan(null); }} className="rounded-lg p-1.5 hover:bg-white/20"><X className="h-5 w-5" /></button>
              </div>

              <div className="space-y-3 overflow-auto p-5">
                {plan.busy && <div className="rounded-xl bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">Смотрю новые задания и склады…</div>}
                {plan.error && <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{plan.error}</div>}

                {!plan.busy && !plan.error && plan.groups.length > 0 && (
                  <>
                    <div className="text-sm text-slate-600">
                      {plan.done
                        ? 'Готово. Что получилось:'
                        : `Создам ${plan.groups.length} ${plan.groups.length === 1 ? 'поставку' : 'поставки'} и разложу ${totalOrders} заданий по складам отгрузки.`}
                    </div>
                    <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                      {plan.groups.map((g) => (
                        <div key={g.warehouseId} className="px-3 py-2 text-sm">
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="font-semibold text-slate-800">{g.warehouseName}</span>
                            <span className="tabular-nums text-slate-500">{g.orderIds.length} заданий</span>
                          </div>
                          <div className="text-xs text-slate-500">{g.supplyName}</div>
                          {g.status && (
                            <div className={`mt-0.5 text-xs ${g.status.startsWith('ошибка') ? 'text-rose-600' : 'text-emerald-700'}`}>{g.status}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-3">
                {!plan.done && (
                  <button
                    onClick={() => void runAssemblePlan()}
                    disabled={plan.busy || plan.running || !plan.groups.length}
                    className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-40"
                  >
                    {plan.running ? 'Создаю…' : 'Создать поставки'}
                  </button>
                )}
                <button
                  onClick={() => setAssemblePlan(null)}
                  disabled={plan.running}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  {plan.done ? 'Закрыть' : 'Отмена'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {chzPlan && (() => {
        const plan = chzPlan;
        const willGet = plan.groups.reduce((sum, g) => sum + g.matched, 0);
        const short = plan.groups.reduce((sum, g) => sum + (g.orders - g.matched), 0);
        const noMeta = plan.noGender.reduce((s, r) => s + r.count, 0) + plan.noCard.reduce((s, r) => s + r.count, 0);
        const genderText = (g: string) => (g === 'male' ? 'мужской' : g === 'female' ? 'женский' : '—');
        return (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={() => setChzPlan(null)}>
            <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-4 bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4 text-white">
                <div>
                  <div className="flex items-center gap-2 text-lg font-bold"><CheckSquare className="h-5 w-5" /> Какие марки уйдут в печать</div>
                  <div className="text-sm opacity-90">{plan.supplyName}</div>
                </div>
                <button onClick={() => setChzPlan(null)} className="rounded-lg p-1.5 hover:bg-white/20"><X className="h-5 w-5" /></button>
              </div>

              <div className="space-y-4 overflow-auto p-5">
                {plan.busy && <div className="rounded-xl bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">Считаю план по поставке…</div>}
                {plan.error && <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{plan.error}</div>}

                {!plan.busy && !plan.error && (
                  <>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="rounded-xl bg-slate-50 p-3"><div className="text-2xl font-extrabold tabular-nums">{plan.total}</div><div className="text-xs text-slate-500">заданий</div></div>
                      <div className="rounded-xl bg-slate-50 p-3"><div className="text-2xl font-extrabold tabular-nums">{plan.alreadyWithChz}</div><div className="text-xs text-slate-500">уже с ЧЗ</div></div>
                      <div className="rounded-xl bg-emerald-50 p-3"><div className="text-2xl font-extrabold tabular-nums text-emerald-700">{willGet}</div><div className="text-xs text-emerald-700">получат марку</div></div>
                      <div className={`rounded-xl p-3 ${short + noMeta ? 'bg-amber-50' : 'bg-slate-50'}`}><div className={`text-2xl font-extrabold tabular-nums ${short + noMeta ? 'text-amber-700' : ''}`}>{short + noMeta}</div><div className="text-xs text-slate-500">на скан</div></div>
                    </div>

                    {plan.canceled > 0 && (
                      <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-600">Отменённых заданий: {plan.canceled} — в печать не пойдут.</div>
                    )}
                    {!plan.statusChecked && (
                      <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">Статусы заданий у WB не получены — отменённые могут попасть в печать.</div>
                    )}

                    {plan.groups.length > 0 && (
                      <div className="overflow-hidden rounded-xl border border-slate-200">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold">Категория</th>
                              <th className="px-3 py-2 text-left font-semibold">Пол</th>
                              <th className="px-3 py-2 text-right font-semibold">Заданий</th>
                              <th className="px-3 py-2 text-right font-semibold">Получат</th>
                              <th className="px-3 py-2 text-right font-semibold">Есть в базе</th>
                            </tr>
                          </thead>
                          <tbody>
                            {plan.groups.map((g) => (
                              <tr key={g.key} className="border-t border-slate-100">
                                <td className="px-3 py-2 text-slate-800">{g.category}</td>
                                <td className="px-3 py-2 text-slate-600">{genderText(g.gender)}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{g.orders}</td>
                                <td className={`px-3 py-2 text-right font-semibold tabular-nums ${g.matched < g.orders ? 'text-amber-700' : 'text-emerald-700'}`}>{g.matched}</td>
                                <td className="px-3 py-2 text-right tabular-nums text-slate-600">{g.freeTotal}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {plan.noGender.length > 0 && (
                      <div>
                        <div className="mb-1.5 text-sm font-bold text-slate-800">В карточке WB не указан пол: {plan.noGender.reduce((s, r) => s + r.count, 0)}</div>
                        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                          {plan.noGender.map((row) => (
                            <div key={row.nmId} className="px-3 py-2 text-sm">
                              <div className="flex flex-wrap items-baseline gap-x-3">
                                <span className="font-medium text-slate-800">{row.article}</span>
                                <span className="font-mono text-xs text-slate-500">{row.nmId}</span>
                                <span className="text-xs text-slate-500">{row.subject || 'без категории'} · {row.count} шт.</span>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <span className="text-xs text-slate-500">Пол товара:</span>
                                {(['male', 'female'] as const).map((g) => (
                                  <button
                                    key={g}
                                    disabled={chzGenderPick[row.nmId] === 'busy'}
                                    onClick={() => void pickChzGender(row.nmId, g)}
                                    className={`rounded-lg border px-2 py-0.5 text-xs font-semibold transition ${chzGenderPick[row.nmId] === g ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                                  >
                                    {g === 'male' ? 'Мужской' : 'Женский'}
                                  </button>
                                ))}
                                {chzGenderPick[row.nmId] && chzGenderPick[row.nmId] !== 'busy' && (
                                  <span className="text-xs text-emerald-700">сохранено — нажмите «Пересчитать»</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {plan.noCard.length > 0 && (
                      <div>
                        <div className="mb-1.5 text-sm font-bold text-slate-800">Нет карточки товара: {plan.noCard.reduce((s, r) => s + r.count, 0)}</div>
                        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                          {plan.noCard.map((row) => (
                            <div key={row.nmId} className="px-3 py-2 text-sm">
                              <span className="font-medium text-slate-800">{row.article}</span>
                              <span className="ml-3 font-mono text-xs text-slate-500">{row.nmId}</span>
                              <span className="ml-3 text-xs text-slate-500">{row.count} шт.</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {short > 0 && (
                      <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
                        Кодов не хватит на {short} заданий — они напечатаются обычным стикером WB, марку на них сканируют вручную.
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-3">
                <button
                  onClick={() => void buildChzPlan(plan.supplyId)}
                  disabled={plan.busy}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Пересчитать
                </button>
                <button
                  onClick={() => { const id = plan.supplyId; setChzPlan(null); void downloadFBSStickers({ supplyId: id }); }}
                  disabled={plan.busy || Boolean(plan.error)}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
                >
                  Печатать стикеры
                </button>
                <button onClick={() => setChzPlan(null)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Отмена</button>
              </div>
            </div>
          </div>
        );
      })()}

      {boxesModal && (() => {
        const supply = supplies.find((s) => s.id === boxesModal.supplyId);
        const closed = Boolean(supply?.closedAt);
        const limit = boxesModal.ordersCount === null ? null : maxBoxesForOrders(boxesModal.ordersCount);
        const room = limit === null ? null : Math.max(0, limit - boxesModal.ids.length);
        const busy = boxesModal.busy;

        return (
          // Поверх окна скана: открывается из него и должно быть сверху.
          <div
            className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => { if (!busy) setBoxesModal(null); }}
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="px-5 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-bold flex items-center gap-2"><Package className="w-5 h-5" /> Грузоместа</div>
                  <div className="text-sm opacity-90">{supply?.name || boxesModal.supplyId} · <span className="font-mono">{boxesModal.supplyId}</span></div>
                </div>
                <button onClick={() => { if (!busy) setBoxesModal(null); }} className="p-1.5 rounded-lg hover:bg-white/20">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-auto">
                <div className="text-sm text-slate-600">
                  Грузоместа нужны для поставок на ПВЗ. WB разрешает не больше половины заданий поставки.
                  {boxesModal.ordersCount !== null && (
                    <> Заданий: <b>{boxesModal.ordersCount}</b>, можно до <b>{limit}</b>{room !== null && boxesModal.ids.length > 0 ? <>, осталось <b>{room}</b></> : null}.</>
                  )}
                </div>

                {closed ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Поставка закрыта — новые грузоместа WB не создаст. Стикеры существующих можно перепечатать.
                  </div>
                ) : (
                  <div className="flex items-end gap-2">
                    <label className="flex-1">
                      <span className="block text-xs font-medium text-slate-500 mb-1">Сколько создать</span>
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={boxesAmount}
                        onChange={(e) => setBoxesAmount(e.target.value)}
                        className="oc-input w-full"
                        disabled={Boolean(busy)}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={createBoxesAndPrint}
                      disabled={Boolean(busy)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 text-white font-semibold hover:bg-orange-700 disabled:opacity-50"
                    >
                      {busy === 'create' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      {busy === 'create' ? 'Создаю…' : busy === 'print' ? 'Стикеры…' : 'Создать и напечатать'}
                    </button>
                  </div>
                )}

                {room !== null && !closed && Number(boxesAmount) > room && (
                  <div className="text-xs text-amber-700">
                    Больше, чем разрешит WB ({room}). Запрос, скорее всего, будет отклонён.
                  </div>
                )}

                {boxesModal.error && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{boxesModal.error}</div>
                )}
                {boxesModal.info && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{boxesModal.info}</div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-slate-800">
                      У WB {busy === 'load' ? '…' : `${boxesModal.ids.length}`}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openBoxesModal(boxesModal.supplyId)}
                        disabled={Boolean(busy)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${busy === 'load' ? 'animate-spin' : ''}`} /> Обновить
                      </button>
                      <button
                        type="button"
                        onClick={printAllBoxStickers}
                        disabled={Boolean(busy) || !boxesModal.ids.length}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-orange-300 bg-orange-50 text-xs font-semibold text-orange-700 hover:bg-orange-100 disabled:opacity-40"
                      >
                        <Printer className="w-3.5 h-3.5" /> Печать всех
                      </button>
                    </div>
                  </div>

                  {busy === 'load' ? (
                    <div className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Читаю у WB…</div>
                  ) : !boxesModal.ids.length ? (
                    <div className="text-sm text-slate-400">Грузомест пока нет.</div>
                  ) : (
                    <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 max-h-72 overflow-auto">
                      {boxesModal.ids.map((id, index) => (
                        <div key={id} className="flex items-center justify-between px-3 py-2 text-sm">
                          <span className="font-mono text-slate-700">
                            <span className="text-slate-400 mr-2 tabular-nums">{index + 1}.</span>{id}
                          </span>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => printOneBoxSticker(id)}
                              disabled={Boolean(busy)}
                              title="Напечатать стикер этого грузоместа"
                              className="inline-flex items-center gap-1 rounded-lg border border-orange-300 bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-700 hover:bg-orange-100 disabled:opacity-40"
                            >
                              <Printer className="h-3 w-3" /> Печать
                            </button>
                            {!closed && (
                              <button
                                type="button"
                                onClick={() => deleteBox(id)}
                                disabled={Boolean(busy)}
                                title="Удалить у WB — можно, пока поставка на сборке"
                                className="text-xs text-rose-600 hover:text-rose-700 disabled:opacity-40"
                              >
                                Удалить
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Отложенные сканы при закрытом окне: вернуться к любому одним щелчком. */}
      {!embeddedMode && !fbsScanModalOpen && sectionActive && fbsScanBookmarks.length > 0 && (
        <div className="fixed bottom-4 right-20 z-40 w-[340px] max-w-[calc(100vw-6rem)] rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xl">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <CheckSquare className="h-3.5 w-3.5 text-indigo-600" /> Отложенные сканы ЧЗ
          </div>
          {renderFbsScanBookmarks()}
        </div>
      )}

      {/*
        Свёрнутое окно скана — плашка в правом нижнем углу.

        Держит самое нужное у стола: прогресс, текущий шаг с фото товара,
        последнее сообщение и поле скана. Всё остальное — в развёрнутом окне.
      */}
      {fbsScanModalOpen && fbsScanMinimized && (
        <div className="fixed bottom-4 right-20 z-40 w-[340px] max-w-[calc(100vw-6rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
          <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2 text-white">
            <CheckSquare className="h-4 w-4 shrink-0" />
            <button
              type="button"
              onClick={() => setFbsScanMinimized(false)}
              title="Развернуть окно скана"
              className="min-w-0 flex-1 truncate text-left text-sm font-semibold hover:underline"
            >
              Скан ЧЗ · {supplies.find((s) => s.id === activeSupplyId)?.name || activeSupplyId || '—'}
            </button>
            <button
              type="button"
              onClick={refreshFbsScanRowsFromWb}
              disabled={fbsScanLoading || fbsScanRefreshing}
              title="Обновить: состав поставки из WB и сканы с других рабочих мест"
              className="rounded-md p-1 hover:bg-white/15 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${fbsScanLoading || fbsScanRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setFbsScanMinimized(false)}
              title="Развернуть"
              className="rounded-md p-1 hover:bg-white/15"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={closeFbsScanModal}
              title="Закрыть окно скана"
              className="rounded-md p-1 hover:bg-white/15"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2 p-3">
            {fbsScanBookmarks.length > 1 && renderFbsScanBookmarks()}
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${fbsScanStats.totalRows ? Math.round((fbsScanStats.scannedCount / fbsScanStats.totalRows) * 100) : 0}%` }}
                />
              </div>
              <div className="whitespace-nowrap text-xs tabular-nums text-slate-600">
                <b className="text-slate-900">{fbsScanStats.scannedCount}</b> из {fbsScanStats.totalRows}
              </div>
            </div>

            {fbsScanMode === 'honest_sign' && fbsPendingStickerRow ? (
              <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2 text-amber-900">
                <FbsPhoto
                  urls={getFbsRowPhotoCandidates(fbsPendingStickerRow)}
                  className="h-20 w-16 shrink-0 rounded-md border border-amber-200 bg-white object-contain"
                  emptyClassName="h-20 w-16 shrink-0 rounded-md border border-dashed border-amber-200 bg-white/60"
                />
                <div className="min-w-0 text-xs">
                  <div className="font-bold">2 · Сканируйте ЧЗ</div>
                  <div className="mt-0.5 line-clamp-2 font-medium">{fbsPendingStickerRow.title || '—'}</div>
                  <div className="opacity-80">{[fbsPendingStickerRow.article, fbsPendingStickerRow.size].filter(Boolean).join(' · ')}</div>
                  <div className="font-mono opacity-80">{fbsPendingStickerRow.orderId}</div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-900">
                1 · Сканируйте стикер
              </div>
            )}

            {fbsScanOverride ? (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
                <div className="font-semibold">Код уже использовался: {fbsScanOverride.where}</div>
                <div className="mt-1.5 flex gap-2">
                  <button
                    type="button"
                    disabled={fbsScanOverrideBusy}
                    onClick={() => forceSaveFbsScanEntry(fbsScanOverride.row, fbsScanOverride.code, fbsScanOverride.where)}
                    className="rounded-lg bg-amber-600 px-2 py-1 font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    {fbsScanOverrideBusy ? 'Записываем…' : 'Записать всё равно'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setFbsScanOverride(null); clearScanInput(); }}
                    className="rounded-lg border border-amber-300 bg-white px-2 py-1 hover:bg-amber-100"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : fbsScanNotice ? (
              <div
                className={`line-clamp-3 rounded-xl border px-2.5 py-1.5 text-xs ${
                  fbsScanNotice.type === 'error'
                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : fbsScanNotice.type === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-indigo-200 bg-indigo-50 text-indigo-700'
                }`}
              >
                {fbsScanNotice.text}
              </div>
            ) : null}

            {renderFbsScanForm(true)}
            {!scanCaptureAllowed && (
              <div className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] text-slate-600">
                В этом разделе свой сканер. Чтобы сканировать в ЧЗ, щёлкните в поле выше.
              </div>
            )}
          </div>
        </div>
      )}

      {fbsScanModalOpen && !fbsScanMinimized && (
        /*
         * Окно на весь экран, в две колонки.
         *
         * На мониторах 21–24″ прежняя компоновка «всё сверху, таблица снизу»
         * оставляла таблице треть высоты: шаг с фото, семь кнопок и поле скана
         * съедали остальное. Теперь всё управление — в узкой колонке слева, а
         * таблица занимает всю высоту справа. На узком экране колонки
         * складываются друг под друга, как было.
         */
        // Щелчок мимо окна его сворачивает, а не закрывает: промахнуться мышью
        // у стола легко, и терять из-за этого начатый шаг нельзя.
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-2 lg:p-3" onClick={() => setFbsScanMinimized(true)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full h-full max-w-[1920px] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {fbsScanBookmarks.length > 1 && (
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-2">
                <span className="shrink-0 text-xs font-semibold text-slate-500">Сканы:</span>
                {renderFbsScanBookmarks()}
              </div>
            )}
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <div className="text-lg font-bold text-slate-900 shrink-0">Скан ЧЗ</div>
                <div className="min-w-0 truncate text-sm text-slate-500">
                  {supplies.find((s) => s.id === activeSupplyId)?.name || activeSupplyId || '-'}
                  <span className="ml-2 font-mono text-xs text-slate-400">{activeSupplyId}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {/* Прогресс крупно и в одну строку: главный вопрос у стола — сколько осталось. */}
                <div className="hidden sm:flex items-center gap-3">
                  <div className="h-2.5 w-48 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${fbsScanStats.totalRows ? Math.round((fbsScanStats.scannedCount / fbsScanStats.totalRows) * 100) : 0}%` }}
                    />
                  </div>
                  <div className="text-sm text-slate-700 tabular-nums whitespace-nowrap">
                    <b className="text-slate-900">{fbsScanStats.scannedCount}</b> из {fbsScanStats.totalRows}
                    <span className="ml-2 text-slate-400">осталось {Math.max(0, fbsScanStats.totalRows - fbsScanStats.scannedCount)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFbsScanMinimized(true)}
                  title="Свернуть в угол экрана — сканировать можно и так"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  <span className="text-base leading-none">▁</span> Свернуть
                </button>
                <button onClick={closeFbsScanModal} title="Закрыть окно скана" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
            <div className="lg:w-[420px] xl:w-[460px] shrink-0 overflow-auto p-4 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50 space-y-3">
              {/* Поле скана — первым: курсор живёт в нём, и сборщик смотрит сюда. */}
              {renderFbsScanForm(false)}
              {/* Панель шага — во всю ширину, кнопки под ней.
                  Раньше они делили строку, и пять длинных кнопок сжимали
                  подсказку в колонку шириной в одно слово. */}
              <div className="flex flex-col gap-3">
                <div className={`rounded-xl border px-4 py-3 ${fbsScanMode === 'sticker' ? 'border-blue-200 bg-blue-50 text-blue-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
                  {fbsScanMode === 'sticker' ? (
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-bold">1</div>
                      <div>
                        <div className="text-base font-semibold">Сканируйте стикер при считывании</div>
                        <div className="text-sm opacity-80 mt-0.5">
                          Строка ищется сначала по колонке «Стикер при считывании», затем по обычному номеру стикера.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {/* Крупное фото: на этом шаге сборщик держит вещь в руках
                          и должен успеть заметить, что взял не тот товар.
                          В узкой колонке — над текстом, во всю ширину. */}
                      {fbsPendingStickerRow ? (
                        <FbsPhoto
                          urls={getFbsRowPhotoCandidates(fbsPendingStickerRow)}
                          className="h-72 w-full rounded-lg border border-amber-200 bg-white object-contain"
                          emptyClassName="h-72 w-full rounded-lg border border-dashed border-amber-200 bg-white/60"
                        />
                      ) : null}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800 font-bold">2</div>
                          <div className="text-base font-semibold">Сканируйте ЧЗ</div>
                        </div>
                        {fbsPendingStickerRow?.title ? (
                          <div className="text-lg font-semibold mt-2 leading-snug">{fbsPendingStickerRow.title}</div>
                        ) : null}
                        <div className="text-sm opacity-80 mt-1">
                          {[fbsPendingStickerRow?.article, fbsPendingStickerRow?.size].filter(Boolean).join(' · ')}
                        </div>
                        <div className="mt-3 grid gap-1 text-sm">
                          <div>Заказ <span className="font-mono font-medium">{fbsPendingStickerRow?.orderId || '—'}</span></div>
                          <div>Стикер <span className="font-mono font-medium">{fbsPendingStickerRow?.stickerText || '—'}</span></div>
                          {fbsPendingStickerRow?.stickerScanText ? (
                            <div>При считывании <span className="font-mono font-medium">{fbsPendingStickerRow.stickerScanText}</span></div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {/* Кнопки сеткой в две колонки: в узкой колонке ряд из семи
                    кнопок переносился бы лесенкой разной ширины. */}
                <div className="grid grid-cols-2 gap-2 [&>*]:px-3 [&>*]:py-2 [&>*]:text-[13px]">
                  {/* Первой кнопкой: поставку пополняют во время сборки, и
                      обновление состава нужнее любой выгрузки. */}
                  <button
                    type="button"
                    onClick={refreshFbsScanRowsFromWb}
                    disabled={fbsScanLoading || fbsScanRefreshing}
                    title="Забрать актуальный состав поставки из WB и сканы с других рабочих мест. Отсканированные ЧЗ сохранятся"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-blue-400 bg-blue-100 hover:bg-blue-200 disabled:opacity-50 text-sm font-semibold text-blue-800"
                  >
                    <RefreshCw className={`w-4 h-4 ${fbsScanLoading || fbsScanRefreshing ? 'animate-spin' : ''}`} /> {fbsScanRefreshing ? 'Обновляю…' : 'Обновить данные'}
                  </button>
                  {/* Грузоместа — здесь, в окне сборки: коробки для ПВЗ создают
                      и клеят по ходу сборки поставки, а не заранее. */}
                  {/* Выделена цветом и шириной: среди выгрузок и шаблонов её искали
                      глазами, а нужна она на каждой поставке на ПВЗ. */}
                  <button
                    type="button"
                    onClick={() => activeSupplyId && openBoxesModal(activeSupplyId)}
                    title="Создать грузоместа у WB и напечатать их стикеры — для отгрузки на ПВЗ"
                    className="col-span-2 order-first inline-flex items-center justify-center gap-2 !py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-sm shadow-orange-500/30 !text-base font-bold text-white"
                  >
                    <Package className="w-5 h-5" /> Грузоместа
                  </button>
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
                    title="Excel с GS-разделителями. Не открывайте его перед загрузкой — Excel вырежет разделители"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-emerald-400 bg-emerald-100 hover:bg-emerald-200 text-sm font-semibold text-emerald-800"
                  >
                    <Download className="w-4 h-4" /> Скачать скан файл
                  </button>
                  <button
                    type="button"
                    onClick={downloadFbsScanResultCsv}
                    title="Запасной формат на случай, если WB не примет xlsx"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-sm font-medium text-slate-600"
                  >
                    <Download className="w-4 h-4" /> CSV
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

              {appOutdated && (
                <div className="flex items-center gap-3 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold">Страница устарела — на сайте новая версия</div>
                    <div className="opacity-80 mt-0.5">
                      Сохранённые сканы не пропадут. Обновите страницу, иначе новые функции (отправка марок в WB) здесь не работают.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="ml-auto shrink-0 px-3 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700"
                  >
                    Обновить
                  </button>
                </div>
              )}

              {fbsLayoutHint && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Включена русская раскладка</div>
                    <div className="opacity-80 mt-0.5">
                      Сканер отдаёт коды кириллицей. Мы переводим их обратно, и сканировать можно дальше, но лучше
                      переключить язык на английский (Alt+Shift) — в других окнах такой перевод не сработает.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFbsLayoutHint(false)}
                    className="ml-auto text-amber-500 hover:text-amber-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {fbsScanNotice && (
                <div className={`rounded-xl border px-4 py-3 text-sm ${fbsScanNotice.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : fbsScanNotice.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-indigo-200 bg-indigo-50 text-indigo-700'}`}>
                  {fbsScanNotice.text}
                </div>
              )}

              {/* Выход из тупика «код уже отсканирован»: решает человек с товаром в руках. */}
              {fbsScanOverride && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <div className="font-semibold">Код уже использовался: {fbsScanOverride.where}</div>
                  <div className="mt-1 opacity-80">
                    Так бывает при возврате и повторной отправке. Если товар в руках — тот самый, запишите код повторно.
                    Если это разные вещи — перед вами пересорт, отправлять нельзя.
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={fbsScanOverrideBusy}
                      onClick={() => forceSaveFbsScanEntry(fbsScanOverride.row, fbsScanOverride.code, fbsScanOverride.where)}
                      className="px-3 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-50"
                    >
                      {fbsScanOverrideBusy ? 'Записываем…' : 'Записать всё равно'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setFbsScanOverride(null); clearScanInput(); }}
                      className="px-3 py-2 rounded-lg border border-amber-300 bg-white text-sm text-amber-800 hover:bg-amber-100"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Отступа сверху нет намеренно: липкая панель прилипает к границе
                padding-box, и с `pt-5` она вставала на два десятка пикселей
                ниже края — в этот просвет затекали строки таблицы. */}
            <div className="flex-1 min-w-0 min-h-0 px-5 pb-5 overflow-auto">
              {/* Фильтр по состоянию сборки: на длинной поставке главное —
                  быстро увидеть, что ещё не отсканировано. */}
              {!fbsScanLoading && fbsScanRows.length > 0 && (() => {
                const pendingCount = Math.max(0, fbsScanStats.totalRows - fbsScanStats.scannedCount);
                let wbErrorCount = 0;
                let wbMissingCount = 0;
                for (const row of fbsScanRows) {
                  const issue = getFbsWbIssue(row);
                  if (issue === 'bad' || issue === 'differ') wbErrorCount += 1;
                  else if (issue === 'missing') wbMissingCount += 1;
                }
                const tabs: Array<{ id: typeof fbsScanFilter; label: string; count: number; tone?: 'danger' | 'warn' }> = [
                  { id: 'all', label: 'Все', count: fbsScanStats.totalRows },
                  { id: 'pending', label: 'Не отсканированы', count: pendingCount },
                  { id: 'done', label: 'Отсканированы', count: fbsScanStats.scannedCount },
                  // Вкладки WB — только когда есть что показать или они уже выбраны:
                  // пустая «Ошибка WB (0)» на каждой поставке — лишний шум.
                  ...((wbErrorCount > 0 || fbsScanFilter === 'wb_error')
                    ? [{ id: 'wb_error' as const, label: 'Ошибка ЧЗ в WB', count: wbErrorCount, tone: 'danger' as const }]
                    : []),
                  ...((wbMissingCount > 0 || fbsScanFilter === 'wb_missing')
                    ? [{ id: 'wb_missing' as const, label: 'Не отправлены в WB', count: wbMissingCount, tone: 'warn' as const }]
                    : []),
                ];
                return (
                  // sticky относительно этого скролл-контейнера: список
                  // длинный, а «что осталось» нужно видеть на любой прокрутке.
                  <div
                    ref={fbsFilterBarRef}
                    className="sticky top-0 z-30 -mx-5 mb-3 flex flex-col gap-2 border-b border-slate-200 bg-white/95 px-5 py-3 shadow-[0_2px_6px_-4px_rgba(15,23,42,0.35)] backdrop-blur"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setFbsScanFilter(tab.id)}
                        className={`px-3 py-1.5 rounded-xl text-sm border transition ${
                          fbsScanFilter === tab.id
                            ? tab.tone === 'danger'
                              ? 'border-rose-500 bg-rose-50 text-rose-700 font-semibold'
                              : tab.tone === 'warn'
                                ? 'border-amber-500 bg-amber-50 text-amber-800 font-semibold'
                                : 'border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold'
                            : tab.tone === 'danger'
                              ? 'border-rose-300 bg-white text-rose-700 hover:bg-rose-50'
                              : tab.tone === 'warn'
                                ? 'border-amber-300 bg-white text-amber-800 hover:bg-amber-50'
                                : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {tab.label} <span className="tabular-nums">({tab.count})</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const next = !fbsSoundOn;
                        setFbsSoundOn(next);
                        try { localStorage.setItem('fbs_scan_sound_v1', next ? '1' : '0'); } catch {}
                        // Проверка на слух сразу при включении: иначе непонятно,
                        // работает ли звук на этом рабочем месте.
                        // Напрямую, а не через fbsCue: состояние ещё не
                        // обновилось, и проверка флага съела бы пробный сигнал.
                        if (next) {
                          try {
                            const probe = new Audio(FBS_CUES.ready.sound);
                            probe.play().catch(() => fbsCueFallback('ready'));
                          } catch {
                            fbsCueFallback('ready');
                          }
                        }
                      }}
                      title="Голосовые подсказки: что сканировать на текущем шаге"
                      className={`ml-auto px-3 py-1.5 rounded-xl text-sm border transition ${
                        fbsSoundOn
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                          : 'border-slate-300 bg-white text-slate-500'
                      }`}
                    >
                      {fbsSoundOn ? '🔊 Звук включён' : '🔈 Звук выключен'}
                    </button>
                    </div>

                    {/* Марки в WB: сводка по поставке и ручная отправка. */}
                    {(() => {
                      const counts = { ok: 0, wait: 0, bad: 0, missing: 0, differ: 0 };
                      for (const row of fbsScanRows) {
                        const issue = getFbsWbIssue(row);
                        if (issue) counts[issue] += 1;
                      }

                      return (
                        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2 text-sm">
                          <span className="font-semibold text-slate-700">Марки в WB:</span>
                          <span className="text-emerald-700">✓ {counts.ok}</span>
                          {counts.wait > 0 && <span className="text-sky-700">проверяются {counts.wait}</span>}
                          {counts.missing > 0 && <span className="text-amber-700">не отправлены {counts.missing}</span>}
                          {counts.differ > 0 && <span className="text-rose-700">другая марка {counts.differ}</span>}
                          {counts.bad > 0 && <span className="font-semibold text-rose-700">ошибки {counts.bad}</span>}

                          <label
                            className="ml-2 inline-flex items-center gap-2 text-slate-700"
                            title="Каждая отсканированная марка сразу уходит на задание в WB. Работает, пока задание на сборке"
                          >
                            <input
                              type="checkbox"
                              checked={fbsWbAutoSend}
                              onChange={(e) => {
                                const next = e.target.checked;
                                setFbsWbAutoSend(next);
                                try { localStorage.setItem('fbs_wb_sgtin_autosend_v1', next ? '1' : '0'); } catch {}
                              }}
                              className="h-4 w-4 rounded border-slate-300"
                            />
                            Отправлять в WB сразу при скане
                          </label>

                          <button
                            type="button"
                            onClick={() => refreshFbsWbSgtin(fbsScanRows.map((r) => r.orderId))}
                            disabled={Boolean(fbsWbSgtinBusy)}
                            className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${fbsWbSgtinBusy === 'refresh' ? 'animate-spin' : ''}`} />
                            Проверить в WB
                          </button>
                          <button
                            type="button"
                            onClick={pushAllFbsSgtinsToWb}
                            disabled={Boolean(fbsWbSgtinBusy)}
                            title="Отправить на задания все отсканированные марки, которых у WB нет или там стоит другая"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            {fbsWbSgtinBusy === 'push' ? 'Отправляю…' : 'Отправить всё в WB'}
                          </button>
                        </div>
                      );
                    })()}

                    {/* Пакетная печать. Вторая строка панели, а не отдельный
                        блок: выбор идёт по тому же фильтру, что и вкладки
                        выше, и разносить их по экрану значило бы путать. */}
                    <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          const next: Record<string, true> = {};
                          fbsScanVisibleRows.forEach((row) => { next[row.storageKey] = true; });
                          setFbsScanSelection(next);
                        }}
                        className="px-3 py-1.5 rounded-xl text-sm border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      >
                        Выбрать все <span className="tabular-nums">({fbsScanVisibleRows.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFbsScanSelection({})}
                        disabled={!fbsScanSelectedRows.length}
                        className="px-3 py-1.5 rounded-xl text-sm border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                      >
                        Снять выбор
                      </button>
                      <span className="text-sm text-slate-600">
                        Выбрано: <span className="font-semibold tabular-nums">{fbsScanSelectedRows.length}</span>
                      </span>

                      {/* Макет печати — тот же выбор, что у кнопки «Стикеры» на
                          поставке: одна настройка на рабочее место, меняется в
                          любом из двух мест. */}
                      <label
                        title="Макет этикетки для печати стикеров и ЧЗ. Сами макеты настраиваются в «Конструкторе этикеток»"
                        className="inline-flex items-center gap-1.5 text-sm text-slate-600"
                      >
                        Макет:
                        <select
                          value={fbsLabelKind}
                          onChange={(e) => {
                            const next = e.target.value as FbsLabelKind;
                            setFbsLabelKind(next);
                            try { localStorage.setItem('fbs_label_kind_v1', next); } catch {}
                            // Снимаем фокус: пока он на списке, сканер «печатал» бы
                            // в список, перебирая макеты, вместо поля скана.
                            e.currentTarget.blur();
                          }}
                          className="rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
                        >
                          {(Object.keys(FBS_LABEL_KIND_TITLES) as FbsLabelKind[]).map((id) => (
                            <option key={id} value={id}>{FBS_LABEL_KIND_TITLES[id]}</option>
                          ))}
                        </select>
                      </label>

                      <label
                        className={`inline-flex items-center gap-2 text-sm ${fbsLabelKind === 'combo' ? 'text-slate-400' : 'text-slate-700'}`}
                        title={fbsLabelKind === 'combo' ? 'В совмещённой этикетке стикер уже есть' : 'Стикер WB отдельной страницей перед каждой этикеткой'}
                      >
                        <input
                          type="checkbox"
                          checked={fbsBulkWithStickers && fbsLabelKind !== 'combo'}
                          disabled={fbsLabelKind === 'combo'}
                          onChange={(e) => setFbsBulkWithStickers(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        Стикеры WB
                      </label>
                      {/* «Печать (N)» с меню: что именно печатать, решают в момент
                          печати, а не галочками заранее. */}
                      <div className="relative ml-auto">
                        <button
                          type="button"
                          onClick={() => setFbsPrintMenuOpen((open) => !open)}
                          disabled={!fbsScanSelectedRows.length || fbsScanBulkBusy}
                          aria-haspopup="menu"
                          aria-expanded={fbsPrintMenuOpen}
                          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40"
                        >
                          <Printer className="w-4 h-4" />
                          {fbsScanBulkBusy ? 'Готовлю…' : <>Печать <span className="tabular-nums">({fbsScanSelectedRows.length})</span></>}
                          <span className={`text-xs transition-transform ${fbsPrintMenuOpen ? 'rotate-180' : ''}`}>▾</span>
                        </button>

                        {fbsPrintMenuOpen && (
                          <>
                            {/* Щелчок мимо меню его закрывает. */}
                            <div className="fixed inset-0 z-40" onClick={() => setFbsPrintMenuOpen(false)} />
                            <div
                              role="menu"
                              className="absolute right-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
                            >
                              {([
                                { mode: 'labels', title: 'Стикеры', hint: fbsLabelKind === 'combo' ? 'совмещённая этикетка' : fbsBulkWithStickers ? 'стикер WB + этикетка ЧЗ' : 'этикетки ЧЗ' },
                                { mode: 'picking', title: 'Лист подбора', hint: 'A4, файлом' },
                                { mode: 'both', title: 'Стикеры + Лист', hint: 'печать + файл' },
                              ] as const).map((item) => (
                                <button
                                  key={item.mode}
                                  type="button"
                                  role="menuitem"
                                  onClick={() => printSelectedFbsRows(item.mode)}
                                  className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm text-slate-800 hover:bg-indigo-50"
                                >
                                  <span className="font-semibold">{item.title}</span>
                                  <span className="text-xs text-slate-400">{item.hint}</span>
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {fbsScanLoading ? (
                <div className="text-slate-500">Загрузка заказов поставки...</div>
              ) : !fbsScanRows.length ? (
                <div className="text-slate-500">В этой поставке пока нет заказов со стикерами.</div>
              ) : (
                <div className="rounded-xl border border-slate-200">
                  {/* Своей прокрутки у обёртки нет намеренно: контейнер
                      прокрутки должен быть один — иначе шапка прилипает к
                      обёртке, которая сама уезжает вверх, и толку от sticky
                      никакого. */}
                  <table className="w-full text-sm">
                    {/* Шапка держится наверху: строки высокие из-за фото, и без
                        неё на середине списка непонятно, где какая колонка.
                        Смещаем ровно на высоту панели фильтров, чтобы они не
                        накрывали друг друга. */}
                    <thead
                      style={{ top: fbsFilterBarHeight }}
                      className="sticky z-20 bg-slate-50 text-slate-600 shadow-[0_1px_0_0_#e2e8f0]"
                    >
                      <tr>
                        <th className="px-3 py-2 text-left w-10">
                          {/* Тот же выбор, что и кнопкой в панели: отмечает
                              ровно видимые строки, не всю поставку. */}
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300"
                            title="Выбрать все строки текущего фильтра"
                            checked={fbsScanVisibleRows.length > 0 && fbsScanVisibleRows.every((row) => fbsScanSelection[row.storageKey])}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const next: Record<string, true> = {};
                                fbsScanVisibleRows.forEach((row) => { next[row.storageKey] = true; });
                                setFbsScanSelection(next);
                              } else {
                                setFbsScanSelection({});
                              }
                            }}
                          />
                        </th>
                        {/* Колонка должна быть шире картинки: при w-16 ячейка
                            сжимала фото в вертикальную полоску. */}
                        <th className="px-3 py-2 text-left w-32">Фото</th>
                        <th className="px-3 py-2 text-left">Номер заказа</th>
                        <th className="px-3 py-2 text-left">Стикер</th>
                        <th className="px-3 py-2 text-left">Стикер при считывании</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fbsScanVisibleRows.slice(0, fbsScanRenderLimit).map((row) => {
                        const scan = findFbsScanSavedEntry(row, fbsScansBySticker)?.item;
                        const isActive = fbsPendingStickerRow?.storageKey === row.storageKey;
                        const isSaving = !!fbsScanSavingKeys[row.storageKey];
                        const failedReason = fbsScanFailedKeys[row.storageKey];
                        const finalReadValue = scan?.honestSignCode || row.stickerScanText || '—';
                        return (
                          <tr
                            key={row.storageKey}
                            className={`${failedReason ? 'bg-rose-50' : isSaving ? 'bg-amber-50/70' : scan?.honestSignCode ? 'bg-emerald-50/60' : isActive ? 'bg-amber-50' : 'bg-white'} border-t border-slate-100`}
                          >
                            <td className="px-3 py-2 align-top">
                              <input
                                type="checkbox"
                                className="mt-1 h-4 w-4 rounded border-slate-300"
                                checked={!!fbsScanSelection[row.storageKey]}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setFbsScanSelection((prev) => {
                                    const next = { ...prev };
                                    if (checked) next[row.storageKey] = true;
                                    else delete next[row.storageKey];
                                    return next;
                                  });
                                }}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <FbsPhoto
                                urls={getFbsRowPhotoCandidates(row)}
                                className="h-32 w-24 flex-shrink-0 rounded-lg border border-slate-200 bg-white object-contain"
                                emptyClassName="h-32 w-24 flex-shrink-0 rounded-lg border border-dashed border-slate-200 bg-slate-50"
                              />
                            </td>
                            <td className="px-3 py-2 font-medium text-slate-900 whitespace-nowrap">
                              <div>{row.orderId || '—'}</div>
                              {row.title ? <div className="mt-0.5 text-xs font-normal text-slate-500 max-w-[380px] truncate" title={row.title}>{row.title}</div> : null}
                              <div className="text-[11px] font-normal text-slate-400">{[row.article, row.size].filter(Boolean).join(' · ')}</div>
                            </td>
                            <td className="px-3 py-2 font-mono text-slate-700 whitespace-nowrap">
                              <div>{getSafeStickerText(row)}</div>
                              {/* Стикер иногда теряют или рвут при сборке — тогда его печатают заново. */}
                              <button
                                type="button"
                                onClick={() => printSingleFbsSticker(row)}
                                disabled={fbsStickerPrintingId === String(row.orderId)}
                                title="Напечатать стикер этого задания заново"
                                className="mt-1 inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-sans text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                              >
                                <Printer className="w-3 h-3" />
                                {fbsStickerPrintingId === String(row.orderId) ? 'Готовлю…' : 'Печать стикера'}
                              </button>
                            </td>
                            <td className="px-3 py-2">
                              <div className={`font-mono text-[11px] break-all ${scan?.honestSignCode ? 'text-emerald-700' : 'text-slate-700'}`}>{finalReadValue}</div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                                {failedReason ? (
                                  <span className="text-rose-600 font-medium">{failedReason}</span>
                                ) : isSaving ? (
                                  <span className="text-amber-600">Сохраняю ЧЗ…</span>
                                ) : scan?.honestSignCode ? (
                                  <>
                                    <span className="text-emerald-600">ЧЗ сохранён</span>
                                    {/* Этикетку с маркой рвут и заливают так же,
                                        как стикер, — и переклеить нужно ровно ту
                                        же марку, что уже привязана к заданию. */}
                                    <button
                                      type="button"
                                      onClick={() => printSingleChzLabel(row)}
                                      disabled={fbsChzPrintingKey === row.storageKey}
                                      title="Этикетка «ШК + ЧЗ» этого задания — с уже отсканированной маркой"
                                      className="inline-flex items-center gap-1 rounded-lg border border-indigo-300 bg-indigo-50 px-2 py-0.5 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                                    >
                                      <Printer className="w-3 h-3" />
                                      {fbsChzPrintingKey === row.storageKey ? 'Готовлю…' : 'Печать ЧЗ'}
                                    </button>
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
                              {(() => {
                                /*
                                 * Что с маркой у WB. Отдельной строкой под нашим
                                 * статусом: «сохранён у нас» и «принят WB» —
                                 * разные вещи, и путать их нельзя.
                                 */
                                const wb = fbsWbSgtin[String(row.orderId || '').trim()];
                                if (!wb) return null;

                                if (wb.phase === 'sending') {
                                  return <div className="mt-1 text-[11px] text-sky-600">WB: отправляю марку…</div>;
                                }
                                if (wb.phase === 'error') {
                                  return <div className="mt-1 text-[11px] font-medium text-rose-600">WB не принял: {wb.message}</div>;
                                }

                                const ours = scan?.honestSignCode || '';
                                // У WB другая марка, чем у нас: главное, что нужно увидеть.
                                if (wb.value && ours && !sameChzCode(wb.value, ours)) {
                                  return <div className="mt-1 text-[11px] font-medium text-rose-600">WB: на задании другая марка — отправьте заново</div>;
                                }
                                // У нас марка есть, у WB нет — ещё не отправлена.
                                if (!wb.value && ours) {
                                  return <div className="mt-1 text-[11px] text-amber-600">WB: марка не отправлена</div>;
                                }
                                if (!wb.value) return null;

                                const { verdict, text } = describeSgtinDecision(wb.decision || '');
                                const tone = verdict === 'ok'
                                  ? 'text-emerald-600'
                                  : verdict === 'bad'
                                    ? 'text-rose-600 font-medium'
                                    : 'text-sky-600';
                                return <div className={`mt-1 text-[11px] ${tone}`}>{verdict === 'ok' ? '✓ ' : ''}{text}</div>;
                              })()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {fbsScanVisibleRows.length > fbsScanRenderLimit && (
                    <div className="flex items-center justify-center gap-3 border-t border-slate-100 px-3 py-3 text-sm text-slate-600">
                      <span>
                        Показано {fbsScanRenderLimit} из {fbsScanVisibleRows.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFbsScanRenderLimit((n) => n + FBS_SCAN_PAGE_SIZE)}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-50"
                      >
                        Показать ещё {FBS_SCAN_PAGE_SIZE}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFbsScanRenderLimit(fbsScanVisibleRows.length)}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-slate-500 hover:bg-slate-50"
                      >
                        Все
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
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
              {fbsSuppliers.map((s) => (
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
              {fbsSuppliers.map((s) => (
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








