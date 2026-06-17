// Pure helpers and constants extracted from Dashboard.tsx.
// No React/JSX, no module-level lazy-lib vars — safe standalone module.

import type { NotificationType, ToastStyle, ExternalAdsHistoryItem, Product } from './dashboardTypes';

export const getSafeId = () => (globalThis?.crypto && typeof globalThis.crypto.randomUUID === 'function'
  ? globalThis.crypto.randomUUID()
  : `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`);

export const EMP_AVATAR_GRADIENTS = [
  'from-indigo-500 to-violet-500',
  'from-sky-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-fuchsia-500 to-purple-500',
  'from-blue-500 to-indigo-500',
];
export const getEmpInitials = (name: string) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
};
export const getEmpAvatarColor = (key: string) => {
  const s = String(key || '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return EMP_AVATAR_GRADIENTS[h % EMP_AVATAR_GRADIENTS.length];
};

export const getRelationCount = (relation: any) => {
  if (Array.isArray(relation)) return Number(relation?.[0]?.count || 0) || 0;
  return Number(relation?.count || 0) || 0;
};

export const getOfflineBoxItemsCount = (box: any) => {
  const nestedCount = getRelationCount(box?.supply_items);
  const explicitRaw = box?.total_items ?? box?.totalItems ?? box?.items_count ?? box?.itemsCount;
  const explicitCount = Number(explicitRaw);

  if (Number.isFinite(explicitCount) && (explicitCount > 0 || nestedCount === 0)) {
    return explicitCount;
  }

  return nestedCount;
};

export const getOfflineSupplyItemsCount = (supply: any) => {
  const boxes = Array.isArray(supply?.boxes) ? supply.boxes : [];
  const nestedCount = boxes.reduce((sum: number, box: any) => sum + getOfflineBoxItemsCount(box), 0);
  const explicitRaw = supply?.total_items ?? supply?.totalItems ?? supply?.items_count ?? supply?.itemsCount;
  const explicitCount = Number(explicitRaw);

  if (Number.isFinite(explicitCount) && (explicitCount > 0 || nestedCount === 0)) {
    return explicitCount;
  }

  return nestedCount;
};

export const getNotificationToneClass = (type: NotificationType) => {
  if (type === 'error') return 'bg-red-600';
  if (type === 'success') return 'bg-green-600';
  if (type === 'warning') return 'bg-amber-500';
  return 'bg-blue-600';
};

export const getNotificationStyle = (type: NotificationType): ToastStyle => {
  if (type === 'error')
    return { bar: 'bg-rose-500', iconWrap: 'bg-rose-100 text-rose-600', ring: 'ring-rose-100', title: 'Ошибка' };
  if (type === 'warning')
    return { bar: 'bg-amber-500', iconWrap: 'bg-amber-100 text-amber-600', ring: 'ring-amber-100', title: 'Внимание' };
  if (type === 'info')
    return { bar: 'bg-sky-500', iconWrap: 'bg-sky-100 text-sky-600', ring: 'ring-sky-100', title: 'Информация' };
  return { bar: 'bg-emerald-500', iconWrap: 'bg-emerald-100 text-emerald-600', ring: 'ring-emerald-100', title: 'Готово' };
};

export const getNotificationHistoryTextClass = (type: NotificationType) => {
  if (type === 'error') return 'text-red-600';
  if (type === 'success') return 'text-green-600';
  if (type === 'warning') return 'text-amber-600';
  return 'text-blue-600';
};

export const BARTER_RATING_OPTIONS = ['', 'Удовлетворительно', 'Средне', 'Хорошо', 'Отлично'] as const;

export const getBarterRatingClassName = (value: string) => {
  const base = 'oc-select transition-colors';
  if (value === 'Удовлетворительно') return `${base} border-rose-300 bg-rose-50 text-rose-700`;
  if (value === 'Средне') return `${base} border-amber-300 bg-amber-50 text-amber-700`;
  if (value === 'Хорошо') return `${base} border-sky-300 bg-sky-50 text-sky-700`;
  if (value === 'Отлично') return `${base} border-emerald-300 bg-emerald-50 text-emerald-700`;
  return `${base} border-slate-200 bg-white text-slate-700`;
};

export const RATING_SCORE_MAP: Record<string, number> = {
  'Удовлетворительно': 1,
  'Средне': 2,
  'Хорошо': 3,
  'Отлично': 4,
};

export const EXTERNAL_ADS_STATUS_LABELS: Record<string, string> = {
  new: 'Новый',
  contacted: 'Написали',
  in_progress: 'В работе',
  barter_published: 'Вышел бартер',
  ad_published: 'Вышла реклама',
  waiting_stats: 'Ждём статистику',
  completed: 'Завершено',
  waiting: 'Ждём ответ',
  agreed: 'Договорились',
  rejected: 'Отказ',
};

export const EXTERNAL_ADS_STATUS_CLASSES: Record<string, string> = {
  new: 'bg-slate-100 text-slate-700',
  contacted: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-indigo-100 text-indigo-700',
  barter_published: 'bg-cyan-100 text-cyan-700',
  ad_published: 'bg-violet-100 text-violet-700',
  waiting_stats: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  waiting: 'bg-amber-100 text-amber-700',
  agreed: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
};

export const getExternalAdsStatusLabel = (status: string) => EXTERNAL_ADS_STATUS_LABELS[String(status || '').trim()] || 'Новый';
export const getExternalAdsStatusClassName = (status: string) => EXTERNAL_ADS_STATUS_CLASSES[String(status || '').trim()] || 'bg-slate-100 text-slate-700';

export const normalizeExternalAdsStatus = (status: string) => {
  const value = String(status || '').trim();
  if (!value) return 'new';
  if (value === 'agreed') return 'completed';
  if (value === 'waiting') return 'contacted';
  return value;
};

export const getRatingLabelByScore = (score: number) => {
  if (score >= 3.5) return 'Отлично';
  if (score >= 2.5) return 'Хорошо';
  if (score >= 1.5) return 'Средне';
  return 'Удовлетворительно';
};

export const getExternalAdsSummary = (history: ExternalAdsHistoryItem[]) => {
  const safeHistory = Array.isArray(history) ? history : [];
  const barterCount = safeHistory.filter((item) => item?.kind === 'barter').length;
  const adCount = safeHistory.filter((item) => item?.kind === 'ad').length;
  const totalIntegrations = safeHistory.length;
  const rated = safeHistory.filter((item) => Number.isFinite(RATING_SCORE_MAP[String(item?.rating || '')]));
  const averageScore = rated.length
    ? rated.reduce((sum, item) => sum + Number(RATING_SCORE_MAP[String(item?.rating || '')] || 0), 0) / rated.length
    : 0;
  const totalCost = safeHistory.reduce((sum, item) => {
    const value = parseFloat(String(item?.price || '0').replace(/\s+/g, '').replace(',', '.')) || 0;
    return sum + value;
  }, 0);
  const ratingCounts = safeHistory.reduce((acc, item) => {
    const rating = String(item?.rating || '').trim();
    if (!rating) return acc;
    acc[rating] = (acc[rating] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const supplierStats = Object.values(safeHistory.reduce((acc, item) => {
    const key = String(item?.supplier_id || item?.supplier_name || 'unknown');
    if (!acc[key]) {
      acc[key] = { supplierId: String(item?.supplier_id || ''), supplierName: String(item?.supplier_name || 'Поставщик'), count: 0, totalCost: 0 };
    }
    acc[key].count += 1;
    acc[key].totalCost += parseFloat(String(item?.price || '0').replace(/\s+/g, '').replace(',', '.')) || 0;
    return acc;
  }, {} as Record<string, { supplierId: string; supplierName: string; count: number; totalCost: number }>)).sort((a, b) => b.count - a.count || b.totalCost - a.totalCost);
  const ratedSorted = [...rated].sort((a, b) => (RATING_SCORE_MAP[String(b?.rating || '')] || 0) - (RATING_SCORE_MAP[String(a?.rating || '')] || 0));
  const bestResult = ratedSorted[0] || null;
  const worstResult = ratedSorted[ratedSorted.length - 1] || null;

  return {
    barterCount,
    adCount,
    totalIntegrations,
    averageScore,
    averageLabel: averageScore > 0 ? getRatingLabelByScore(averageScore) : '',
    totalCost,
    ratingCounts,
    supplierStats,
    bestResult,
    worstResult,
  };
};

export const normalizeExternalUrl = (rawUrl: string) => {
  try {
    const prepared = String(rawUrl || '').trim();
    if (!prepared) return '';
    const url = new URL(/^https?:\/\//i.test(prepared) ? prepared : `https://${prepared}`);
    url.hash = '';
    url.search = '';
    const normalizedPath = url.pathname.replace(/\/+$/, '');
    return `${url.protocol}//${url.hostname.toLowerCase()}${normalizedPath}`;
  } catch {
    return String(rawUrl || '').trim();
  }
};

export const parseExternalBloggerLink = (rawUrl: string) => {
  try {
    const prepared = String(rawUrl || '').trim();
    if (!prepared) return null;
    const url = new URL(/^https?:\/\//i.test(prepared) ? prepared : `https://${prepared}`);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    const segments = url.pathname.split('/').map((part) => String(part || '').trim()).filter(Boolean);
    const first = segments[0] || '';
    const second = segments[1] || '';

    let platform = '';
    let nickname = '';

    if (host.includes('instagram.com')) {
      platform = 'Instagram';
      nickname = first;
      if (['reel', 'reels', 'p', 'stories', 'tv', 'explore'].includes(first.toLowerCase())) nickname = second;
    } else if (host.includes('tiktok.com')) {
      platform = 'TikTok';
      nickname = first.startsWith('@') ? first.slice(1) : first;
    } else if (host === 't.me' || host.endsWith('.t.me') || host.includes('telegram.me')) {
      platform = 'Telegram';
      nickname = first;
    } else if (host.includes('youtube.com') || host === 'youtu.be') {
      platform = 'YouTube';
      nickname = first.startsWith('@') ? first.slice(1) : (first || second);
    } else if (host.includes('vk.com') || host.includes('vkontakte.ru')) {
      platform = 'VK';
      nickname = first;
    } else if (host.includes('ok.ru')) {
      platform = 'OK';
      nickname = first || second;
    } else {
      platform = host.replace(/^www\./, '');
      nickname = first || host;
    }

    nickname = String(nickname || '').replace(/^@+/, '').trim();
    if (!nickname) return null;

    return {
      platform,
      nickname,
      url: String(rawUrl || '').trim(),
      normalizedUrl: normalizeExternalUrl(rawUrl),
    };
  } catch {
    return null;
  }
};

export const getWbCharacteristicValue = (card: any, names: string[]) => {
  const wanted = new Set(names.map((name) => name.toLowerCase()));
  const chars = Array.isArray(card?.characteristics) ? card.characteristics : [];
  for (const item of chars) {
    const name = String(item?.name || item?.Name || '').trim().toLowerCase();
    if (!wanted.has(name)) continue;
    const value = item?.value ?? item?.Value;
    if (Array.isArray(value)) return value.map((x) => String(x || '').trim()).filter(Boolean).join(', ');
    return String(value || '').trim();
  }
  return '';
};

export const getWbPhotoUrl = (card: any) => {
  const firstPhoto = (Array.isArray(card?.photos) && card.photos[0]) || (Array.isArray(card?.mediaFiles) && card.mediaFiles[0]) || '';
  let src = String(card?.photoUrl || card?.image || card?.image_url || firstPhoto?.big || firstPhoto?.c516x688 || firstPhoto?.c246x328 || firstPhoto?.tm || firstPhoto || '').trim();
  if (src.startsWith('//')) src = `https:${src}`;
  return /^https?:\/\//i.test(src) ? src : '';
};

export const buildFboScanProductCard = (product: Product, card: any, size: any, barcode: string): Product => {
  const color = getWbCharacteristicValue(card, ['цвет']) || product.color || '';
  const modelNumber = String(product.model_number || '').trim();
  const nmId = String(card?.nmID || card?.nmId || product.wb_sku || '').trim();
  return {
    ...product,
    name: String(card?.title || card?.name || product.name || 'Товар'),
    wb_sku: product.wb_sku || nmId,
    barcode: String(barcode || product.barcode || '').trim(),
    size: String(size?.techSize || size?.wbSize || product.size || '').trim(),
    color,
    photo_url: getWbPhotoUrl(card),
    model_number: modelNumber,
    vendor_code: String(card?.vendorCode || card?.article || product.wb_sku || '').trim(),
    nm_id: nmId,
  };
};

export const WAREHOUSE_MONEY_LEHA_PREFIX = '[warehouse_money_owner:leha] ';
export const WAREHOUSE_MONEY_OWNERS = [
  {
    id: 'sasha',
    title: 'Деньги на складе Саша',
    borderClass: 'border-emerald-200 ring-emerald-50',
    titleClass: 'text-emerald-900',
    balanceClass: 'text-emerald-700',
    addButtonClass: 'bg-emerald-600 hover:bg-emerald-700',
    addFilterClass: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50',
    addFilterActiveClass: 'bg-emerald-600 text-white',
  },
  {
    id: 'leha',
    title: 'Деньги на складе Леха',
    borderClass: 'border-sky-200 ring-sky-50',
    titleClass: 'text-sky-900',
    balanceClass: 'text-sky-700',
    addButtonClass: 'bg-sky-600 hover:bg-sky-700',
    addFilterClass: 'border-sky-200 text-sky-700 hover:bg-sky-50',
    addFilterActiveClass: 'bg-sky-600 text-white',
  },
] as const;

export type WarehouseMoneyOwner = typeof WAREHOUSE_MONEY_OWNERS[number]['id'];
export type WarehouseMoneyFilter = 'all' | 'add' | 'writeoff';
export type WarehouseMoneyFormState = Record<WarehouseMoneyOwner, { amount: string; comment: string }>;
export type WarehouseMoneyFilterState = Record<WarehouseMoneyOwner, WarehouseMoneyFilter>;
export type WarehouseMoneyLog = {
  id: string;
  amount: number;
  comment: string;
  created_at: string;
  type?: 'manual' | 'salary';
  employee_id?: string;
  employee_name?: string;
  period_start?: string;
  period_end?: string;
};

export const getEmptyWarehouseMoneyForms = (): WarehouseMoneyFormState => ({
  sasha: { amount: '', comment: '' },
  leha: { amount: '', comment: '' },
});

export const getDefaultWarehouseMoneyFilters = (): WarehouseMoneyFilterState => ({
  sasha: 'all',
  leha: 'all',
});

export const getWarehouseMoneyOwner = (row: Pick<WarehouseMoneyLog, 'comment'>): WarehouseMoneyOwner => (
  String(row?.comment || '').startsWith(WAREHOUSE_MONEY_LEHA_PREFIX) ? 'leha' : 'sasha'
);

export const getWarehouseMoneyDisplayComment = (comment?: string | null) => {
  const value = String(comment || '');
  if (value.startsWith(WAREHOUSE_MONEY_LEHA_PREFIX)) return value.slice(WAREHOUSE_MONEY_LEHA_PREFIX.length).trim();
  return value.trim();
};

export const buildWarehouseMoneyStoredComment = (owner: WarehouseMoneyOwner, comment: string) => {
  const clean = String(comment || '').trim();
  return owner === 'leha' ? WAREHOUSE_MONEY_LEHA_PREFIX + clean : clean;
};

// Delivery / quick-pay payers are limited to two suppliers, each tied to a
// "Деньги на складе" owner so that a payment auto-writes-off from that balance.
export const DELIVERY_PAYER_OWNER_RULES: Array<{ match: RegExp; owner: WarehouseMoneyOwner }> = [
  { match: /власенко/i, owner: 'sasha' },
  { match: /криштафович/i, owner: 'leha' },
];
export const getDeliveryPayerOwner = (supplierName: string): WarehouseMoneyOwner | null => {
  const n = String(supplierName || '');
  for (const rule of DELIVERY_PAYER_OWNER_RULES) if (rule.match.test(n)) return rule.owner;
  return null;
};
export const isDeliveryPayerSupplier = (supplierName: string) => getDeliveryPayerOwner(supplierName) !== null;

export const ASSEMBLY_BUTTONS = [
  { id: 'cw_tab_calendar', label: 'Сборка: вкладка Календарь' },
  { id: 'cw_tab_rates', label: 'Сборка: вкладка Расценки' },
  { id: 'cw_tab_packaging', label: 'Сборка: вкладка Упаковка' },
  { id: 'cw_tab_purchase', label: 'Сборка: вкладка Закуп' },
  { id: 'cw_send_report', label: 'Сборка: кнопка Отправить отчёт' },
  { id: 'cw_report_open', label: 'Сборка: кнопка Отчёт' },
  { id: 'cw_general_report_open', label: 'Сборка: кнопка Общий отчёт' },
  { id: 'cw_rates_save', label: 'Сборка: Расценки - Добавить/Сохранить' },
  { id: 'cw_rates_delete', label: 'Сборка: Расценки - Удалить' },
  { id: 'cw_packaging_save', label: 'Сборка: Упаковка - Добавить/Сохранить' },
  { id: 'cw_packaging_delete', label: 'Сборка: Упаковка - Удалить' },
  { id: 'temp_shift_add', label: 'Сборка: Временные сотрудники - Добавить смену' },
  { id: 'temp_shift_edit', label: 'Сборка: Временные сотрудники - Редактировать' },
  { id: 'temp_shift_delete', label: 'Сборка: Временные сотрудники - Удалить' },
  { id: 'cw_purchase_add', label: 'Сборка: Закуп - Добавить' },
  { id: 'cw_purchase_delete', label: 'Сборка: Закуп - Удалить запись' },
  { id: 'cw_calendar_temp_workers', label: 'Сборка: Календарь - Временные сотрудники' },
  { id: 'cw_calendar_employee_pick', label: 'Сборка: Календарь - Показывать сотрудника в выборе' },
  { id: 'cw_schedule_employee_pick', label: 'Сборка: График - Показывать сотрудника в выборе (админ)' },
  { id: 'cw_schedule_notify_pick', label: 'Сборка: График - Показывать сотрудника в выборе уведомлений Telegram' },
  { id: 'warehouse_telegram_pick', label: 'Склад: Показывать сотрудника в выборе для Telegram' },
  { id: 'cw_calendar_schedule_open', label: 'Сборка: Календарь - Кнопка График' },
  { id: 'cw_calendar_schedule_employee_pick', label: 'Сборка: График - Выбор сотрудника (админ)' },
  { id: 'cw_form_save', label: 'Сборка: Форма - Сохранить/Обновить запись' },
  { id: 'cw_form_edit', label: 'Сборка: Форма - Редактировать запись' },
  { id: 'cw_form_delete', label: 'Сборка: Форма - Удалить запись' },
  { id: 'cw_box_log_edit_submit', label: 'Сборка: Коробки - Сохранить редактирование записи' },
  { id: 'cw_calendar_salary_pay', label: 'Сборка: Календарь - Оплата ЗП (финансовая)' },
  { id: 'supply_scanner_picker', label: 'Поставки: выбор сборщика (бейдж/учёт выработки)' },
] as const;

// Financial / sensitive buttons. Unlike normal buttons (visible by default),
// these are HIDDEN by default for non-admins and must be explicitly granted in
// the Admin Panel → "Права кнопок". Admins always see them.
export const FINANCIAL_DEFAULT_DENY_BUTTONS = new Set<string>([
  'cw_calendar_salary_pay',
  'supply_scanner_picker',
]);

// Assembly analytics: which records count toward "собрано".
// Staff: all work rates EXCEPT time-based, Пик, возвраты. Temp: only ФБО/ФБС
// (and never смена/время/возвраты/пик).
export const isAssemblyExcludedStaffRate = (name?: string | null) => {
  const r = String(name || '').toLowerCase();
  return r.includes('врем') || r.includes('час') || r.includes('time') || r.includes('пик') || r.includes('возврат') || r.includes('смена');
};
export const isAssemblyTempType = (workComment?: string | null) => {
  const c = String(workComment || '').toLowerCase();
  if (c.includes('возврат') || c.includes('пик') || c.includes('смена') || c.includes('врем')) return false;
  return c.includes('фбо') || c.includes('фбс');
};

export const normalizeRoleKey = (role?: string | null) => String(role || '').trim().toLowerCase();

export const ruToEn: Record<string, string> = {
  'й': 'q', 'ц': 'w', 'у': 'e', 'к': 'r', 'е': 't', 'н': 'y', 'г': 'u', 'ш': 'i', 'щ': 'o', 'з': 'p', 'х': '[', 'ъ': ']',
  'ф': 'a', 'ы': 's', 'в': 'd', 'а': 'f', 'п': 'g', 'р': 'h', 'о': 'j', 'л': 'k', 'д': 'l', 'ж': ';', 'э': "'",
  'я': 'z', 'ч': 'x', 'с': 'c', 'м': 'v', 'и': 'b', 'т': 'n', 'ь': 'm', 'б': ',', 'ю': '.', '.': '/'
};

export const fixLayout = (str: string) => {
  return str.split('').map(char => {
    const lower = char.toLowerCase();
    if (ruToEn[lower]) {
      const fixed = ruToEn[lower];
      return char === lower ? fixed : fixed.toUpperCase();
    }
    return char;
  }).join('');
};
