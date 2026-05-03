#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const DATABASE_BACKUP_TABLES = [
  'app_settings',
  'activity_logs',
  'analytics_shared_reports',
  'analytics_upload_history',
  'analytics_upload_reports_raw',
  'analytics_wb_api_reports',
  'box_inventory_log',
  'boxes',
  'employee_requisites',
  'employees',
  'orders',
  'packaging_purchase_log',
  'packaging_rates',
  'palleting_log',
  'print_files',
  'products',
  'profiles',
  'receptions',
  'supplier_warehouse_costs',
  'suppliers',
  'supplies',
  'supply_items',
  'tasks',
  'temporary_workers_logs',
  'unified_honest_sign_codes',
  'warehouse_money_log',
  'wb_products_cache',
  'work_logs',
  'work_rates',
];

function loadEnv(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i <= 0) continue;
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^['"]|['"]$/g, '');
  }
  return out;
}

function formatDateRu(date) {
  return date.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientBackupError(error) {
  const message = String(error?.message || error || '').toLowerCase();
  return (
    message.includes('fetch failed') ||
    message.includes('statement timeout') ||
    message.includes('web server is down') ||
    message.includes('error code 521') ||
    message.includes('timeout') ||
    message.includes('econnreset')
  );
}

async function withRetry(label, fn, attempts = 5) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isTransientBackupError(error) || attempt === attempts) throw error;
      console.warn(`Retry ${attempt}/${attempts} for ${label}:`, error?.message || error);
      await sleep(attempt * 3000);
    }
  }
  throw lastError;
}

async function readSetting(supabase, key) {
  const { data, error } = await withRetry(`readSetting:${key}`, () => supabase
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle());
  if (error) throw error;
  return data?.value ?? null;
}

async function upsertSetting(supabase, key, value) {
  const { error } = await withRetry(`upsertSetting:${key}`, () => supabase.from('app_settings').upsert({ key, value }));
  if (error) throw error;
}

async function dumpTable(supabase, table) {
  const pageSizeByTable = {
    activity_logs: 200,
    analytics_upload_reports_raw: 3,
    products: 200,
    receptions: 100,
    unified_honest_sign_codes: 200,
    wb_products_cache: 200,
    work_logs: 200,
  };
  const pageSize = pageSizeByTable[table] || 500;
  const rows = [];

  if (table === 'app_settings' || table === 'wb_products_cache') {
    let from = 0;
    while (true) {
      const to = from + pageSize - 1;
      const { data, error } = await withRetry(`${table}:range:${from}`, () => supabase.from(table).select('*').range(from, to));
      if (error) throw new Error(`${table}: ${error.message}`);
      if (!data?.length) break;
      rows.push(...data);
      if (data.length < pageSize) break;
      from += pageSize;
    }
    return rows;
  }

  let lastId = null;
  while (true) {
    let query = supabase.from(table).select('*').order('id', { ascending: true }).limit(pageSize);
    if (lastId) query = query.gt('id', lastId);
    const { data, error } = await withRetry(`${table}:cursor:${lastId || 'start'}`, () => query);
    if (error) {
      if (String(error.message || '').includes('does not exist')) {
        let from = rows.length;
        while (true) {
          const to = from + pageSize - 1;
          const fallback = await withRetry(`${table}:fallback:${from}`, () => supabase.from(table).select('*').range(from, to));
          if (fallback.error) throw new Error(`${table}: ${fallback.error.message}`);
          if (!fallback.data?.length) break;
          rows.push(...fallback.data);
          if (fallback.data.length < pageSize) break;
          from += pageSize;
        }
        break;
      }
      throw new Error(`${table}: ${error.message}`);
    }
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    lastId = data[data.length - 1]?.id ? String(data[data.length - 1].id) : null;
    if (!lastId) break;
  }

  return rows;
}

async function appendBackupLog(supabase, logEntry) {
  let currentLogs = [];
  try {
    const existing = await readSetting(supabase, 'database_backup_logs');
    if (existing) {
      const parsed = typeof existing === 'string' ? JSON.parse(existing) : existing;
      if (Array.isArray(parsed)) currentLogs = parsed;
    }
  } catch (error) {
    console.warn('Failed to read existing database backup logs:', error?.message || error);
  }

  const updated = [logEntry, ...currentLogs].slice(0, 200);
  await upsertSetting(supabase, 'database_backup_logs', JSON.stringify(updated));
}

async function maybeSendToTelegram(supabase, zipPath, summary, now) {
  try {
    const { data, error } = await withRetry('readTelegramBackupSettings', () => supabase
      .from('app_settings')
      .select('key, value')
      .in('key', ['backup_bot_token', 'backup_chat_id']));

    if (error) throw error;

    const botToken = String((data || []).find((row) => row.key === 'backup_bot_token')?.value || '').trim();
    const chatId = String((data || []).find((row) => row.key === 'backup_chat_id')?.value || '').trim();
    if (!botToken || !chatId || !fs.existsSync(zipPath)) return { sent: false, reason: 'missing_settings_or_file' };

    const zipBuffer = fs.readFileSync(zipPath);
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('caption', `Полный бэкап БД\nВремя: ${formatDateRu(now)}\nТаблиц: ${summary.okTables}/${summary.totalTables}\nСтрок: ${summary.totalRows}`);
    formData.append('document', new Blob([zipBuffer], { type: 'application/zip' }), path.basename(zipPath));

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
      method: 'POST',
      body: formData,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.ok === false) {
      return { sent: false, reason: payload?.description || `HTTP ${response.status}` };
    }

    return { sent: true };
  } catch (error) {
    return { sent: false, reason: error?.message || String(error) };
  }
}

const env = { ...process.env, ...loadEnv(path.join(root, '.env.local')) };
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
const backupRoot = path.join(root, 'backups', 'db');
fs.mkdirSync(backupRoot, { recursive: true });

const now = new Date();
const stamp = now.toISOString().replace(/[:]/g, '-').slice(0, 19).replace('T', '_');
const backupDir = path.join(backupRoot, `supabase_${stamp}`);
fs.mkdirSync(backupDir, { recursive: true });

const summary = {
  createdAt: now.toISOString(),
  createdAtRu: formatDateRu(now),
  totalTables: DATABASE_BACKUP_TABLES.length,
  okTables: 0,
  failedTables: 0,
  totalRows: 0,
  tables: {},
};

for (const table of DATABASE_BACKUP_TABLES) {
  try {
    const rows = await dumpTable(supabase, table);
    fs.writeFileSync(path.join(backupDir, `${table}.json`), JSON.stringify(rows, null, 2));
    summary.tables[table] = { ok: true, count: rows.length };
    summary.okTables += 1;
    summary.totalRows += rows.length;
  } catch (error) {
    summary.tables[table] = { ok: false, error: String(error?.message || error) };
    summary.failedTables += 1;
  }
}

fs.writeFileSync(path.join(backupDir, '_summary.json'), JSON.stringify(summary, null, 2));

const zipPath = `${backupDir}.zip`;
const zipResult = spawnSync('/usr/bin/zip', ['-rq', zipPath, '.'], {
  cwd: backupDir,
  encoding: 'utf8',
});
if (zipResult.status !== 0) {
  console.warn('ZIP creation failed:', zipResult.stderr || zipResult.stdout || zipResult.status);
}

const telegram = await maybeSendToTelegram(supabase, zipPath, summary, now);
const scheduleLabel = 'Ежедневно в 09:00 (Europe/Moscow) через launchd';
await upsertSetting(supabase, 'database_backup_schedule', scheduleLabel);

const detailsParts = [
  `Автоматический полный бэкап БД. Таблиц: ${summary.okTables}/${summary.totalTables}`,
  `строк: ${summary.totalRows}`,
  `архив: ${path.basename(zipPath)}`,
];
if (summary.failedTables > 0) detailsParts.push(`ошибок по таблицам: ${summary.failedTables}`);
if (telegram.sent) detailsParts.push('отправлен в Telegram');
else if (telegram.reason && telegram.reason !== 'missing_settings_or_file') detailsParts.push(`Telegram: ${telegram.reason}`);

await appendBackupLog(supabase, {
  version: `Backup ${formatDateRu(now)}`,
  date: now.toLocaleDateString('ru-RU', { timeZone: 'Europe/Moscow' }),
  details: detailsParts.join(', '),
  created_at: now.toISOString(),
  status: summary.failedTables > 0 ? 'warning' : 'success',
  source: 'launchd_auto',
  file_name: path.basename(zipPath),
});

console.log(`BACKUP_OK: ${backupDir}`);
console.log(`BACKUP_ZIP: ${zipPath}`);
console.log(`BACKUP_TABLES_OK: ${summary.okTables}/${summary.totalTables}`);
console.log(`BACKUP_TOTAL_ROWS: ${summary.totalRows}`);
if (telegram.sent) console.log('BACKUP_TELEGRAM: sent');
else if (telegram.reason) console.log(`BACKUP_TELEGRAM: ${telegram.reason}`);
