// ExcelJS loaded lazily — see excelExport.ts for rationale.
let _ExcelJS: any = null;
const loadExcel = async () => {
  if (!_ExcelJS) _ExcelJS = (await import('exceljs/dist/exceljs.min.js')).default;
  return _ExcelJS;
};

export const MAX_EXCEL_FILE_BYTES = 15 * 1024 * 1024; // 15MB
export const MAX_EXCEL_ROWS = 100000;

export const ensureExcelFileSize = (file: File, maxBytes = MAX_EXCEL_FILE_BYTES): string | null => {
  if (file.size > maxBytes) {
    const maxMb = Math.round(maxBytes / 1024 / 1024);
    return `Файл слишком большой. Максимум ${maxMb}MB.`;
  }
  return null;
};

export const ensureExcelRowLimit = (rowsCount: number): string | null => {
  if (rowsCount > MAX_EXCEL_ROWS) {
    return `Слишком много строк: ${rowsCount}. Лимит ${MAX_EXCEL_ROWS}.`;
  }
  return null;
};

type ReadOptions = {
  header?: 1;
  defval?: unknown;
  raw?: boolean;
};

const BLOCKED_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

const toCellValue = (v: unknown) => {
  if (v == null) return '';
  if (typeof v === 'object') {
    if ((v as any).text != null) return String((v as any).text);
    if ((v as any).result != null) return String((v as any).result);
  }
  return String(v);
};

export const readFirstSheetAsJson = async <T = Record<string, unknown>>(
  fileBuffer: ArrayBuffer,
  options: ReadOptions = { defval: '' }
): Promise<T[]> => {
  const ExcelJS = await loadExcel();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(fileBuffer);
  const ws = wb.worksheets[0];
  if (!ws) return [];

  const rows: string[][] = [];
  ws.eachRow({ includeEmpty: true }, (row) => {
    const vals = (row.values as unknown[]).slice(1).map((x) => toCellValue(x));
    rows.push(vals);
  });

  if (options.header === 1) {
    return rows as T[];
  }

  if (!rows.length) return [];

  const headers = rows[0].map((h) => String(h || '').trim());
  const out: Record<string, unknown>[] = [];
  for (let i = 1; i < rows.length; i++) {
    const line = rows[i] || [];
    const obj: Record<string, unknown> = Object.create(null);
    let hasValue = false;

    headers.forEach((key, idx) => {
      const safeKey = String(key || '').trim();
      if (!safeKey || BLOCKED_KEYS.has(safeKey)) return;
      const value = line[idx] ?? options.defval ?? '';
      if (String(value || '').trim() !== '') hasValue = true;
      obj[safeKey] = value;
    });

    if (hasValue) out.push(obj);
  }

  return out as T[];
};

const normalizeHeader = (value: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[._-]+/g, '');

export const ensureRequiredColumns = (
  headers: string[],
  requiredColumns: Array<{ label: string; aliases: string[] }>
): string | null => {
  const normalizedHeaders = new Set(headers.map(normalizeHeader));

  const missing = requiredColumns
    .filter((col) => !col.aliases.some((alias) => normalizedHeaders.has(normalizeHeader(alias))))
    .map((col) => col.label);

  if (missing.length) {
    return `В файле отсутствуют обязательные колонки: ${missing.join(', ')}`;
  }

  return null;
};

export const downloadJsonRowsAsExcel = async (
  rows: Array<Record<string, unknown>>,
  fileName = 'report.xlsx',
  sheetName = 'Sheet1'
): Promise<void> => {
  const ExcelJS = await loadExcel();
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName || 'Sheet1');

  const srcRows = Array.isArray(rows) ? rows : [];
  const first = srcRows[0] || {};
  const headers = Object.keys(first);

  if (headers.length === 0) {
    ws.addRow(['Нет данных']);
  } else {
    ws.columns = headers.map((h) => ({ header: h, key: h, width: Math.min(Math.max(String(h || '').length + 4, 14), 48) }));
    srcRows.forEach((row) => {
      const out: Record<string, unknown> = {};
      headers.forEach((h) => {
        out[h] = (row as any)?.[h] ?? '';
      });
      ws.addRow(out);
    });
  }

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const safe = String(fileName || 'report.xlsx');
  const finalName = safe.endsWith('.xlsx') || safe.endsWith('.xls') ? safe : `${safe}.xlsx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = finalName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
