const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const XLSX = require('xlsx');
const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable').default;

const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env.local');
const OFFSET_PATH = path.join(__dirname, '.telegram_offset.json');
const HS_CATEGORY_STATE_PATH = path.join(__dirname, '.telegram_hs_category_state.json');
const ACTIVE_SUPPLIER_STATE_PATH = path.join(__dirname, '.telegram_active_supplier_state.json');
const BACKUP_SCRIPT = path.join(__dirname, 'db_backup.ps1');
const TMP_DIR = path.join(__dirname, '.tmp_telegram_exports');

const HS_CATEGORIES_FALLBACK = [
  'Одежда',
  'Обувь',
  'Белье',
  'Костюмы / Костюмы спортивные',
  'Другое',
];

function readEnv(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    env[key] = val;
  }
  return env;
}

const env = readEnv(ENV_PATH);
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabaseHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

async function getSetting(key) {
  const url = `${SUPABASE_URL}/rest/v1/app_settings?select=value&key=eq.${encodeURIComponent(key)}&limit=1`;
  const res = await fetch(url, { headers: supabaseHeaders });
  if (!res.ok) throw new Error(`app_settings HTTP ${res.status}`);
  const data = await res.json();
  return data?.[0]?.value || '';
}

let cachedAdminChatId = '';
let cachedAdminChatAt = 0;

async function getAdminChatId() {
  const now = Date.now();
  if (cachedAdminChatId && now - cachedAdminChatAt < 60_000) return cachedAdminChatId;

  try {
    const fromSettings = String(await getSetting('telegram_admin_chat_id') || '').trim();
    if (fromSettings) {
      cachedAdminChatId = fromSettings;
      cachedAdminChatAt = now;
      return cachedAdminChatId;
    }
  } catch (_) {}

  try {
    const url = `${SUPABASE_URL}/rest/v1/employees?select=telegram_chat_id,role,login&deleted_at=is.null&or=(role.eq.admin,login.eq.admin)&limit=1`;
    const res = await fetch(url, { headers: supabaseHeaders });
    if (res.ok) {
      const rows = await res.json();
      const v = String(rows?.[0]?.telegram_chat_id || '').trim();
      if (v) {
        cachedAdminChatId = v;
        cachedAdminChatAt = now;
        return cachedAdminChatId;
      }
    }
  } catch (_) {}

  return '';
}

async function getEmployeesSummary() {
  const url = `${SUPABASE_URL}/rest/v1/employees?select=full_name,role&deleted_at=is.null`;
  const res = await fetch(url, { headers: supabaseHeaders });
  if (!res.ok) throw new Error(`employees HTTP ${res.status}`);
  const rows = await res.json();
  const names = rows.map((r) => `• ${r.full_name} (${r.role || '—'})`).join('\n');
  return `Сотрудники (${rows.length}):\n${names || '—'}`;
}

async function getStockSummary() {
  const url = `${SUPABASE_URL}/rest/v1/products?select=id&deleted_at=is.null`;
  const res = await fetch(url, { headers: supabaseHeaders });
  if (!res.ok) throw new Error(`products HTTP ${res.status}`);
  const rows = await res.json();
  return `Остатки: активных карточек товаров ${rows.length}.`;
}

async function getReportSummary() {
  const [tasksRes, receptionsRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/tasks?select=id`, { headers: supabaseHeaders }),
    fetch(`${SUPABASE_URL}/rest/v1/receptions?select=id`, { headers: supabaseHeaders }),
  ]);

  if (!tasksRes.ok || !receptionsRes.ok) throw new Error('report query failed');
  const [tasks, receptions] = await Promise.all([tasksRes.json(), receptionsRes.json()]);
  return `Отчет:\n• Задачи: ${tasks.length}\n• Приемки: ${receptions.length}`;
}

function isActiveSupplyStatus(status) {
  const s = String(status || '').toLowerCase().trim();
  // In UI many active supplies have empty/neutral status, so treat empty as active
  if (!s) return true;

  const closedTokens = [
    'done', 'completed', 'closed', 'cancelled', 'canceled', 'finished',
    'архив', 'закрыт', 'закрыта', 'заверш', 'отмен',
  ];
  if (closedTokens.some((k) => s.includes(k))) return false;

  return true;
}

function pickFilesByType(files = []) {
  const fbs = files.find((f) => /fbs|лист\s*подбора|лист(?!.*груп)|picking/i.test(String(f?.name || '')));
  const group = files.find((f) => /груп|group|лист\s*\(груп/i.test(String(f?.name || '')));
  const stickers = files.find((f) => /стикер|sticker|этикет|\bшк\b|qr/i.test(String(f?.name || '')));
  return { fbs, group, stickers };
}

function extractSupplyLinks(supply = {}) {
  const get = (keys) => keys.map((k) => supply?.[k]).find((v) => typeof v === 'string' && /^https?:\/\//i.test(v)) || '';
  return {
    fbs: get(['fbs_list_url', 'picking_list_url', 'list_url', 'sheet_url']),
    group: get(['group_list_url', 'grouped_list_url', 'group_url', 'sheet_group_url']),
    stickers: get(['stickers_url', 'sticker_url', 'shk_url', 'barcode_labels_url']),
  };
}

function resolveSupplyFileUrls(supply, allFiles = []) {
  const latestByType = pickFilesByType(allFiles || []);
  const supplyName = String(supply?.name || '').trim();
  const filesForSupply = (allFiles || []).filter((f) => String(f?.name || '').toLowerCase().includes(supplyName.toLowerCase()));
  const picked = pickFilesByType(filesForSupply);
  const direct = extractSupplyLinks(supply || {});

  return {
    fbs: direct.fbs || (picked.fbs?.url || latestByType.fbs?.url || ''),
    group: direct.group || (picked.group?.url || latestByType.group?.url || ''),
    stickers: direct.stickers || (picked.stickers?.url || latestByType.stickers?.url || ''),
  };
}

async function sendActiveSuppliesWithLinks(token, chatId, supplierId = '', specificSupplyId = '') {
  let supplier = null;

  if (supplierId) {
    const suppliers = await getSuppliersList();
    supplier = suppliers.find((s) => String(s?.id) === String(supplierId)) || null;
  } else {
    const selected = getActiveSupplier(chatId);
    if (selected) {
      const suppliers = await getSuppliersList();
      supplier = suppliers.find((s) => String(s?.id) === String(selected)) || null;
    }
  }

  if (!supplier?.id) supplier = await getSupplierByChatId(chatId);

  if (!supplier?.id) {
    const suppliers = await getSuppliersList();
    if (!suppliers.length) return sendMessage(token, chatId, 'Поставщики не найдены.');
    return sendMessage(token, chatId, 'Выберите поставщика:', getSuppliersInlineKeyboard(suppliers));
  }

  setActiveSupplier(chatId, supplier.id);

  const suppliesUrl = `${SUPABASE_URL}/rest/v1/supplies?select=*&supplier_id=eq.${encodeURIComponent(String(supplier.id))}&deleted_at=is.null&order=created_at.desc&limit=30`;
  const suppliesRes = await fetch(suppliesUrl, { headers: supabaseHeaders });
  if (!suppliesRes.ok) throw new Error(`supplies HTTP ${suppliesRes.status}`);
  const allSupplies = await suppliesRes.json();
  let activeSupplies = (allSupplies || []).filter((s) => isActiveSupplyStatus(s?.status));

  // WB API is source of truth for FBS active supplies; merge and prioritize it.
  const wbActive = await getWbActiveSuppliesForSupplier(supplier);
  if (wbActive.length) {
    const byKey = new Map();
    for (const x of wbActive) byKey.set(String(x.id || x.name), x);
    for (const x of activeSupplies) {
      const k = String(x?.id || x?.name || '');
      if (k && !byKey.has(k)) byKey.set(k, x);
    }
    activeSupplies = Array.from(byKey.values());
  }

  if (!activeSupplies.length && (allSupplies || []).length) activeSupplies = (allSupplies || []).slice(0, 10);
  if (!activeSupplies.length) return sendMessage(token, chatId, 'Активные поставки не найдены.', getKeyboard());

  if (!specificSupplyId) {
    await sendMessage(token, chatId, `Активные поставки: ${activeSupplies.length}. Выберите нужную:`, getSuppliesInlineKeyboard(activeSupplies));
    return;
  }

  const s = activeSupplies.find((x) => String(x?.id) === String(specificSupplyId));
  if (!s) return sendMessage(token, chatId, 'Поставка не найдена или не активна.');

  const filesUrl = `${SUPABASE_URL}/rest/v1/print_files?select=name,url,type,created_at,supplier_id&supplier_id=eq.${encodeURIComponent(String(supplier.id))}&order=created_at.desc&limit=1000`;
  const filesRes = await fetch(filesUrl, { headers: supabaseHeaders });
  const allFiles = filesRes.ok ? (await filesRes.json()) : [];
  const latestByType = pickFilesByType(allFiles || []);

  const supplyName = String(s?.name || '').trim() || `Поставка ${s?.id || ''}`;
  const filesForSupply = (allFiles || []).filter((f) => String(f?.name || '').toLowerCase().includes(supplyName.toLowerCase()));
  const picked = pickFilesByType(filesForSupply);
  const direct = extractSupplyLinks(s || {});

  const fbsUrl = direct.fbs || (picked.fbs?.url || latestByType.fbs?.url || '');
  const groupUrl = direct.group || (picked.group?.url || latestByType.group?.url || '');
  const stickersUrl = direct.stickers || (picked.stickers?.url || latestByType.stickers?.url || '');

  const text = `📦 ${supplyName}\nСтатус: ${String(s?.status || 'open')}\nВыбери нужный формат:`;
  await sendMessage(token, chatId, text, {
    inline_keyboard: [
      [{ text: '📄 Формат лист', callback_data: `fmt:fbs:${String(s?.id || '')}` }],
      [{ text: '📑 Групп лист', callback_data: `fmt:group:${String(s?.id || '')}` }],
      [{ text: '🏷 Стикеры', callback_data: `fmt:stickers:${String(s?.id || '')}` }],
    ]
  });
}

function runBackup() {
  return new Promise((resolve, reject) => {
    execFile('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', BACKUP_SCRIPT], { windowsHide: true }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      const out = `${stdout || ''}`;
      const zipMatch = out.match(/BACKUP_ZIP:\s*(.+)/);
      resolve({ raw: out.trim(), zipPath: zipMatch?.[1]?.trim() || '' });
    });
  });
}

function readOffset() {
  try {
    if (!fs.existsSync(OFFSET_PATH)) return 0;
    const json = JSON.parse(fs.readFileSync(OFFSET_PATH, 'utf8'));
    return Number(json.offset || 0);
  } catch {
    return 0;
  }
}

function saveOffset(offset) {
  fs.writeFileSync(OFFSET_PATH, JSON.stringify({ offset }, null, 2), 'utf8');
}

function readHSCategoryState() {
  try {
    if (!fs.existsSync(HS_CATEGORY_STATE_PATH)) return {};
    return JSON.parse(fs.readFileSync(HS_CATEGORY_STATE_PATH, 'utf8')) || {};
  } catch {
    return {};
  }
}

function saveHSCategoryState(state) {
  fs.writeFileSync(HS_CATEGORY_STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
}

function setPendingCategory(chatId, category) {
  const state = readHSCategoryState();
  state[String(chatId)] = { category, updatedAt: new Date().toISOString() };
  saveHSCategoryState(state);
}

function getPendingCategory(chatId) {
  const state = readHSCategoryState();
  return state?.[String(chatId)]?.category || '';
}

function readActiveSupplierState() {
  try {
    if (!fs.existsSync(ACTIVE_SUPPLIER_STATE_PATH)) return {};
    return JSON.parse(fs.readFileSync(ACTIVE_SUPPLIER_STATE_PATH, 'utf8')) || {};
  } catch {
    return {};
  }
}

function saveActiveSupplierState(state) {
  fs.writeFileSync(ACTIVE_SUPPLIER_STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
}

function setActiveSupplier(chatId, supplierId) {
  const state = readActiveSupplierState();
  state[String(chatId)] = { supplierId: String(supplierId || ''), updatedAt: new Date().toISOString() };
  saveActiveSupplierState(state);
}

function getActiveSupplier(chatId) {
  const state = readActiveSupplierState();
  return state?.[String(chatId)]?.supplierId || '';
}

function normalizeHSCategory(value) {
  const v = String(value || '').trim();
  if (!v) return '';
  const key = v.toLowerCase();
  if (key === 'костюмы' || key === 'костюмы спортивные') return 'Костюмы / Костюмы спортивные';
  return v;
}

function parseCategoryFromCaption(caption) {
  const text = String(caption || '').trim();
  if (!text) return '';
  const m = text.match(/(?:cat|category|категория)\s*[:=]\s*([^\n;]+)/i);
  if (m?.[1]) return normalizeHSCategory(m[1].trim());
  return '';
}

function parseCodesFromBuffer(buffer, fileName) {
  const lower = String(fileName || '').toLowerCase();
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    return rows.map((r) => (r?.[0] ? String(r[0]).trim() : '')).filter(Boolean);
  }

  const text = Buffer.isBuffer(buffer) ? buffer.toString('utf8') : String(buffer || '');
  if (lower.endsWith('.csv')) {
    return text
      .split(/\r?\n/)
      .map((line) => line.split(';')[0]?.split(',')[0]?.trim() || '')
      .filter(Boolean);
  }

  return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function encodeInValues(values) {
  const escaped = values.map((v) => `"${String(v).replace(/"/g, '\\"')}"`).join(',');
  return `(${escaped})`;
}

function ensureTmpDir() {
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
}

function safeFilePart(v) {
  return String(v || 'file').replace(/[^a-zA-Zа-яА-Я0-9._-]+/g, '_').slice(0, 80);
}

function csvEscape(v) {
  const s = String(v ?? '');
  if (/[";,\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function fetchWbOrdersForSupply(wbToken, supplyId) {
  const url = `https://marketplace-api.wildberries.ru/api/v3/supplies/${encodeURIComponent(String(supplyId))}/orders`;
  const res = await fetch(url, { headers: { Authorization: String(wbToken || '').trim() } });
  if (!res.ok) throw new Error(`WB orders HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data?.orders) ? data.orders : [];
}

async function generateSupplyFileForFormat(supplier, supply, fmt) {
  const token = String(supplier?.wb_api_token || '').trim();
  if (!token) throw new Error('У поставщика не задан WB API token');

  const supplyId = String(supply?.name || supply?.id || '').trim();
  if (!supplyId) throw new Error('Не удалось определить ID поставки');

  const orders = await fetchWbOrdersForSupply(token, supplyId);
  if (!orders.length) throw new Error('По поставке не найдены заказы');

  ensureTmpDir();
  const now = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  doc.setFontSize(12);
  doc.text(`Supply: ${supplyId}`, 40, 40);

  if (fmt === 'fbs') {
    const body = orders.map((o) => [
      String(o?.article || o?.vendorCode || '-'),
      String(o?.size || o?.techSize || '-'),
      String(o?.color || o?.colorName || '-'),
      String((Array.isArray(o?.skus) && o.skus[0]) || '-'),
      String(o?.sticker || o?.stickerCode || o?.id || '-'),
    ]);

    autoTable(doc, {
      startY: 56,
      head: [['Article', 'Size', 'Color', 'Barcode', 'Sticker']],
      body,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [33, 150, 243] },
    });

    const filePath = path.join(TMP_DIR, `format_list_${safeFilePart(supplyId)}_${now}.pdf`);
    fs.writeFileSync(filePath, Buffer.from(doc.output('arraybuffer')));
    return { filePath, caption: `Формат лист (PDF): ${supplyId}` };
  }

  if (fmt === 'group') {
    const map = new Map();
    for (const o of orders) {
      const article = String(o?.article || o?.vendorCode || '');
      const size = String(o?.size || o?.techSize || '');
      const color = String(o?.color || o?.colorName || '');
      const key = `${article}__${size}__${color}`;
      map.set(key, (map.get(key) || 0) + 1);
    }

    const body = Array.from(map.entries()).map(([key, qty]) => {
      const [article, size, color] = key.split('__');
      return [article || '-', size || '-', color || '-', String(qty)];
    });

    autoTable(doc, {
      startY: 56,
      head: [['Article', 'Size', 'Color', 'Qty']],
      body,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [76, 175, 80] },
    });

    const filePath = path.join(TMP_DIR, `group_list_${safeFilePart(supplyId)}_${now}.pdf`);
    fs.writeFileSync(filePath, Buffer.from(doc.output('arraybuffer')));
    return { filePath, caption: `Групп лист (PDF): ${supplyId}` };
  }

  // stickers
  const body = orders
    .map((o) => String(o?.sticker || o?.stickerCode || o?.id || '').trim())
    .filter(Boolean)
    .map((s) => [s]);

  autoTable(doc, {
    startY: 56,
    head: [['Sticker']],
    body,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [255, 152, 0] },
  });

  const filePath = path.join(TMP_DIR, `stickers_${safeFilePart(supplyId)}_${now}.pdf`);
  fs.writeFileSync(filePath, Buffer.from(doc.output('arraybuffer')));
  return { filePath, caption: `Стикеры (PDF): ${supplyId}` };
}

async function getSupplierByChatId(chatId) {
  const url = `${SUPABASE_URL}/rest/v1/suppliers?select=id,name,telegram_chat_id,wb_api_token&telegram_chat_id=eq.${encodeURIComponent(String(chatId))}&limit=1`;
  const res = await fetch(url, { headers: supabaseHeaders });
  if (!res.ok) throw new Error(`suppliers HTTP ${res.status}`);
  const rows = await res.json();
  return rows?.[0] || null;
}

async function getSuppliersList() {
  const url = `${SUPABASE_URL}/rest/v1/suppliers?select=id,name,telegram_chat_id,wb_api_token&deleted_at=is.null&order=name.asc&limit=200`;
  const res = await fetch(url, { headers: supabaseHeaders });
  if (!res.ok) throw new Error(`suppliers list HTTP ${res.status}`);
  return (await res.json()) || [];
}

async function getWbActiveSuppliesForSupplier(supplier) {
  const token = String(supplier?.wb_api_token || '').trim();
  if (!token) return [];

  try {
    const res = await fetch('https://marketplace-api.wildberries.ru/api/v3/supplies?limit=1000&next=0', {
      headers: { Authorization: token },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const arr = Array.isArray(data) ? data : (data?.supplies || data?.data || []);

    return (arr || [])
      .filter((x) => {
        const st = String(x?.status || x?.supplyStatus || x?.state || '').toLowerCase();
        const done = x?.done === true || x?.isDone === true;
        if (done) return false;
        if (!st) return true;
        return !['done', 'completed', 'closed', 'cancelled', 'canceled', 'finished'].some((k) => st.includes(k));
      })
      .map((x) => ({
        id: String(x?.id || x?.name || x?.supplyId || x?.barcode || ''),
        name: String(x?.name || x?.id || x?.supplyId || 'WB поставка'),
        status: String(x?.status || x?.supplyStatus || x?.state || 'active'),
      }))
      .filter((x) => x.id || x.name);
  } catch {
    return [];
  }
}

function getSuppliersInlineKeyboard(suppliers = []) {
  const rows = [];
  for (const s of suppliers) {
    rows.push([{ text: `🏷 ${String(s?.name || 'Поставщик')}`, callback_data: `supplier:${String(s?.id || '')}` }]);
  }
  return { inline_keyboard: rows };
}

function getSuppliesInlineKeyboard(supplies = []) {
  const rows = [];
  for (const s of supplies) {
    rows.push([{ text: `📦 ${String(s?.name || s?.id || 'Поставка')}`, callback_data: `supply:${String(s?.id || '')}` }]);
  }
  return { inline_keyboard: rows };
}

async function getSupplierHSCategories(supplier) {
  if (!supplier?.id) return HS_CATEGORIES_FALLBACK;

  const set = new Set();

  // 1) Primary source: WB Content API (same logic as Dashboard)
  if (supplier.wb_api_token) {
    try {
      let cursor = { limit: 100 };
      let page = 0;

      while (page < 40) {
        let response = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          response = await fetch('https://content-api.wildberries.ru/content/v2/get/cards/list', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: String(supplier.wb_api_token).trim(),
            },
            body: JSON.stringify({ settings: { cursor, filter: { withPhoto: -1 } } }),
          });

          if (response.ok) break;
          if (response.status !== 429 && response.status < 500) break;
          await new Promise((r) => setTimeout(r, 500 + attempt * 700));
        }

        if (!response || !response.ok) break;

        const data = await response.json();
        const cards = data?.cards || [];

        for (const c of cards) {
          const subject = normalizeHSCategory(String(c?.subjectName || c?.object || '').trim());
          if (subject) set.add(subject);
        }

        if (!cards.length) break;

        const nextCursor = data?.cursor || {};
        const nextNmId = nextCursor?.nmID ?? nextCursor?.nmId;
        if (!nextCursor?.updatedAt || !nextNmId) break;

        cursor = { limit: 100, updatedAt: nextCursor.updatedAt, nmID: Number(nextNmId) };
        page += 1;
      }
    } catch (_) {
      // ignore WB errors, fallback below
    }
  }

  // 2) Fallback: already loaded HS categories for supplier
  if (set.size === 0) {
    try {
      const url = `${SUPABASE_URL}/rest/v1/unified_honest_sign_codes?select=category&supplier_id=eq.${encodeURIComponent(String(supplier.id))}&category=not.is.null&limit=5000`;
      const res = await fetch(url, { headers: supabaseHeaders });
      if (res.ok) {
        const rows = await res.json();
        for (const r of rows || []) {
          const cat = normalizeHSCategory(String(r?.category || '').trim());
          if (cat) set.add(cat);
        }
      }
    } catch (_) {
      // ignore
    }
  }

  const categories = Array.from(set).sort((a, b) => String(a).localeCompare(String(b), 'ru'));
  return categories.length ? categories : HS_CATEGORIES_FALLBACK;
}

async function insertHonestSignCodes({ supplierId, category, fileName, codes }) {
  const uniqueCodes = Array.from(new Set((codes || []).map((x) => String(x).trim()).filter(Boolean)));
  if (uniqueCodes.length === 0) return { inserted: 0, duplicates: 0 };

  const duplicates = new Set();
  const checkChunkSize = 500;
  for (let i = 0; i < uniqueCodes.length; i += checkChunkSize) {
    const chunk = uniqueCodes.slice(i, i + checkChunkSize);
    const inArg = encodeURIComponent(encodeInValues(chunk));
    const url = `${SUPABASE_URL}/rest/v1/unified_honest_sign_codes?select=code&code=in.${inArg}`;
    const res = await fetch(url, { headers: supabaseHeaders });
    if (!res.ok) throw new Error(`duplicate check HTTP ${res.status}`);
    const rows = await res.json();
    for (const r of rows || []) duplicates.add(String(r.code));
  }

  const toInsert = uniqueCodes
    .filter((code) => !duplicates.has(code))
    .map((code) => ({
      supplier_id: supplierId,
      category,
      code,
      file_name: fileName,
      status: 'new',
    }));

  const insertChunkSize = 1000;
  for (let i = 0; i < toInsert.length; i += insertChunkSize) {
    const chunk = toInsert.slice(i, i + insertChunkSize);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/unified_honest_sign_codes`, {
      method: 'POST',
      headers: { ...supabaseHeaders, Prefer: 'return=minimal' },
      body: JSON.stringify(chunk),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`insert HTTP ${res.status}: ${txt}`);
    }
  }

  return { inserted: toInsert.length, duplicates: duplicates.size };
}

async function downloadTelegramFile(token, fileId) {
  const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`);
  const fileData = await fileRes.json();
  if (!fileData.ok || !fileData.result?.file_path) throw new Error(fileData.description || 'getFile failed');

  const dlUrl = `https://api.telegram.org/file/bot${token}/${fileData.result.file_path}`;
  const docRes = await fetch(dlUrl);
  if (!docRes.ok) throw new Error(`download failed HTTP ${docRes.status}`);
  const arr = await docRes.arrayBuffer();
  return Buffer.from(arr);
}

async function sendMessage(token, chatId, text, keyboard = null, mirrorToAdmin = true) {
  const payload = { chat_id: chatId, text };
  if (keyboard) payload.reply_markup = keyboard;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.description || 'sendMessage failed');

  if (mirrorToAdmin) {
    const adminChatId = await getAdminChatId();
    if (adminChatId && String(adminChatId) !== String(chatId)) {
      const mirrorPayload = {
        chat_id: adminChatId,
        text: `🔁 [mirror ${chatId}]\n${text}`,
      };
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mirrorPayload),
      });
    }
  }
}

async function answerCallback(token, callbackQueryId, text = '') {
  const payload = { callback_query_id: callbackQueryId };
  if (text) payload.text = text;

  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

async function sendDocument(token, chatId, filePath, caption = '', mirrorToAdmin = true) {
  const form = new FormData();
  form.append('chat_id', String(chatId));
  if (caption) form.append('caption', caption);
  form.append('document', new Blob([fs.readFileSync(filePath)]), path.basename(filePath));

  const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
    method: 'POST',
    body: form,
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.description || 'sendDocument failed');

  if (mirrorToAdmin) {
    const adminChatId = await getAdminChatId();
    if (adminChatId && String(adminChatId) !== String(chatId)) {
      const mirrorForm = new FormData();
      mirrorForm.append('chat_id', String(adminChatId));
      mirrorForm.append('caption', `🔁 [mirror ${chatId}] ${caption || ''}`.trim());
      mirrorForm.append('document', new Blob([fs.readFileSync(filePath)]), path.basename(filePath));
      await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
        method: 'POST',
        body: mirrorForm,
      });
    }
  }
}

function getKeyboard() {
  return {
    resize_keyboard: true,
    one_time_keyboard: false,
    keyboard: [
      ['📦 Показать активные поставки'],
    ],
  };
}

function getHSCategoryInlineKeyboard(categories = HS_CATEGORIES_FALLBACK) {
  const list = (categories || []).filter(Boolean);
  const rows = [];
  for (let i = 0; i < list.length; i += 2) {
    const row = list.slice(i, i + 2).map((c) => ({ text: c, callback_data: `hs_cat:${c}` }));
    rows.push(row);
  }
  return { inline_keyboard: rows };
}

async function handleCommand(token, msg) {
  const chatId = msg.chat.id;
  const text = String(msg.text || '').trim();

  if (!text) return;

  if (text === '/start' || text === '/menu') {
    await sendMessage(token, chatId, 'Меню SkladPro готово 👇', getKeyboard());
    const suppliers = await getSuppliersList();
    if (suppliers.length) {
      await sendMessage(token, chatId, 'Сначала выберите поставщика:', getSuppliersInlineKeyboard(suppliers));
    }
    return;
  }

  if (text.includes('📥')) {
    const supplier = await getSupplierByChatId(chatId);
    if (!supplier?.id) {
      await sendMessage(token, chatId, 'Поставщик не найден по этому Telegram chat_id. Привяжите chat_id в карточке поставщика.');
      return;
    }

    const categories = await getSupplierHSCategories(supplier);
    await sendMessage(
      token,
      chatId,
      `Выберите категорию для поставщика «${supplier.name}», затем отправьте файл (CSV/XLSX/XLS/TXT).\nМожно также указать category: <название> в подписи к файлу.`,
      getHSCategoryInlineKeyboard(categories),
    );
    return;
  }

  if (text === '📦 Показать активные поставки' || text.toLowerCase() === 'показать активные поставки') {
    await sendActiveSuppliesWithLinks(token, chatId);
    return;
  }

  await sendMessage(
    token,
    chatId,
    'Я на связи 👌 Нажмите /menu или кнопку в меню, чтобы выбрать действие.',
    getKeyboard(),
  );
}

async function handleCallbackQuery(token, callbackQuery) {
  const data = String(callbackQuery?.data || '');
  const chatId = callbackQuery?.message?.chat?.id;
  if (!chatId || !data) return;

  if (data.startsWith('supplier:')) {
    const supplierId = String(data.slice('supplier:'.length) || '').trim();
    setActiveSupplier(chatId, supplierId);
    const suppliers = await getSuppliersList();
    const selected = suppliers.find((s) => String(s?.id) === String(supplierId));
    await answerCallback(token, callbackQuery.id, 'Поставщик выбран');
    await sendMessage(token, chatId, `Выбран поставщик: ${selected?.name || supplierId}`);
    await sendActiveSuppliesWithLinks(token, chatId, supplierId);
    return;
  }

  if (data.startsWith('supply:')) {
    const supplyId = String(data.slice('supply:'.length) || '').trim();
    await answerCallback(token, callbackQuery.id, 'Поставка выбрана');
    await sendActiveSuppliesWithLinks(token, chatId, getActiveSupplier(chatId), supplyId);
    return;
  }

  if (data.startsWith('fmt:')) {
    const [, fmt, supplyIdRaw] = data.split(':');
    const supplyId = String(supplyIdRaw || '').trim();
    const supplierId = getActiveSupplier(chatId);

    const suppliers = await getSuppliersList();
    const supplier = suppliers.find((x) => String(x?.id) === String(supplierId));
    if (!supplier?.id) {
      await answerCallback(token, callbackQuery.id, 'Сначала выберите поставщика');
      await sendMessage(token, chatId, 'Сначала выберите поставщика через /menu');
      return;
    }

    const suppliesUrl = `${SUPABASE_URL}/rest/v1/supplies?select=*&supplier_id=eq.${encodeURIComponent(String(supplier.id))}&deleted_at=is.null&order=created_at.desc&limit=100`;
    const suppliesRes = await fetch(suppliesUrl, { headers: supabaseHeaders });
    const allSupplies = suppliesRes.ok ? (await suppliesRes.json()) : [];

    let supply = (allSupplies || []).find((x) => String(x?.id) === supplyId) || null;

    // WB supply ids may not exist in local `supplies` table yet.
    if (!supply) {
      const wbActive = await getWbActiveSuppliesForSupplier(supplier);
      const wbSupply = (wbActive || []).find((x) => String(x?.id) === supplyId) || null;
      if (wbSupply) {
        supply = {
          id: String(wbSupply.id || supplyId),
          name: String(wbSupply.name || supplyId),
          status: String(wbSupply.status || 'active'),
        };
      }
    }

    if (!supply) {
      await answerCallback(token, callbackQuery.id, 'Поставка не найдена');
      await sendMessage(token, chatId, 'Поставка не найдена, выберите заново.');
      return;
    }

    const filesUrl = `${SUPABASE_URL}/rest/v1/print_files?select=name,url,type,created_at,supplier_id&supplier_id=eq.${encodeURIComponent(String(supplier.id))}&order=created_at.desc&limit=1000`;
    const filesRes = await fetch(filesUrl, { headers: supabaseHeaders });
    const allFiles = filesRes.ok ? (await filesRes.json()) : [];
    const urls = resolveSupplyFileUrls(supply, allFiles || []);

    const map = {
      fbs: { label: 'Формат лист', url: urls.fbs },
      group: { label: 'Групп лист', url: urls.group },
      stickers: { label: 'Стикеры', url: urls.stickers },
    };
    const picked = map[String(fmt)] || null;
    if (!picked) {
      await answerCallback(token, callbackQuery.id, 'Неизвестный формат');
      return;
    }

    // 1) Try ready file link first
    if (picked.url && /^https?:\/\//i.test(String(picked.url))) {
      await answerCallback(token, callbackQuery.id, 'Готово');
      await sendMessage(token, chatId, `📎 ${picked.label} — ${String(supply?.name || supplyId)}`, {
        inline_keyboard: [[{ text: `Скачать ${picked.label}`, url: String(picked.url) }]]
      });
      return;
    }

    // 2) Generate file on-demand and send to chat
    await answerCallback(token, callbackQuery.id, 'Формирую файл...');
    try {
      const generated = await generateSupplyFileForFormat(supplier, supply, String(fmt));
      await sendDocument(token, chatId, generated.filePath, generated.caption);
      try { fs.unlinkSync(generated.filePath); } catch (_) {}
    } catch (e) {
      const webUrl = `https://sclad-73d4a.web.app?tab=fbs&supplier=${encodeURIComponent(String(supplier.id || ''))}&supply=${encodeURIComponent(String(supply?.id || ''))}`;
      await sendMessage(token, chatId, `⚠️ Не удалось сформировать ${picked.label}: ${e?.message || 'неизвестно'}`, {
        inline_keyboard: [[{ text: `🛠 Сформировать ${picked.label} в SkladPro`, url: webUrl }]]
      });
    }
    return;
  }

  if (data.startsWith('hs_cat:')) {
    const category = normalizeHSCategory(data.slice('hs_cat:'.length));
    setPendingCategory(chatId, category);
    await answerCallback(token, callbackQuery.id, `Категория: ${category}`);
    await sendMessage(token, chatId, `Категория выбрана: ${category}.\nТеперь отправьте файл с кодами.`);
  }
}

async function handleDocument(token, msg) {
  const chatId = msg.chat.id;
  const doc = msg.document;
  if (!doc?.file_id) return;

  let category = parseCategoryFromCaption(msg.caption || '');
  if (!category) category = getPendingCategory(chatId);

  if (!category) {
    await sendMessage(token, chatId, 'Не выбрана категория. Нажмите 📥 Загрузка ЧЗ и выберите кнопку категории, либо добавьте подпись: category: <название категории>');
    return;
  }

  const supplier = await getSupplierByChatId(chatId);
  if (!supplier?.id) {
    await sendMessage(token, chatId, 'Поставщик не найден по этому Telegram chat_id. Привяжите chat_id в карточке поставщика.');
    return;
  }

  await sendMessage(token, chatId, `Обрабатываю файл ${doc.file_name || ''}...`);

  const buffer = await downloadTelegramFile(token, doc.file_id);
  const codes = parseCodesFromBuffer(buffer, doc.file_name || 'telegram_upload.txt');
  if (!codes.length) {
    await sendMessage(token, chatId, 'Файл пуст или коды не найдены.');
    return;
  }

  const result = await insertHonestSignCodes({
    supplierId: supplier.id,
    category,
    fileName: doc.file_name || `telegram_${Date.now()}.txt`,
    codes,
  });

  await sendMessage(
    token,
    chatId,
    `Готово. Загружено кодов: ${result.inserted}. Дубликатов пропущено: ${result.duplicates}. Категория: ${category}`,
    getKeyboard(),
  );
}

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN || await getSetting('telegram_bot_token');
  if (!token) throw new Error('telegram_bot_token is empty in app_settings');

  let offset = readOffset();
  console.log('telegram_menu_handler started, offset:', offset);

  while (true) {
    try {
      const url = `https://api.telegram.org/bot${token}/getUpdates?timeout=25&offset=${offset}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!data.ok) throw new Error(data.description || 'getUpdates failed');

      for (const upd of data.result || []) {
        offset = upd.update_id + 1;
        saveOffset(offset);

        if (upd.message?.text) await handleCommand(token, upd.message);
        if (upd.message?.document) await handleDocument(token, upd.message);
        if (upd.callback_query) await handleCallbackQuery(token, upd.callback_query);
      }
    } catch (e) {
      console.error('loop error:', e.message || e);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
