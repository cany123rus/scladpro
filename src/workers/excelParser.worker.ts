/// <reference lib="webworker" />
// Parses the first sheet of an .xlsx in a background thread so large reports
// (60k+ rows) don't freeze the UI. ExcelJS is loaded lazily inside the worker.

const BLOCKED_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

const toCellValue = (v: unknown): string => {
  if (v == null) return '';
  if (typeof v === 'object') {
    const o = v as any;
    if (o.text != null) return String(o.text);
    if (o.result != null) return String(o.result);
    if (o.richText && Array.isArray(o.richText)) return o.richText.map((p: any) => p?.text ?? '').join('');
    if (o.hyperlink != null) return String(o.hyperlink);
  }
  return String(v);
};

self.onmessage = async (e: MessageEvent) => {
  const { id, buffer, header } = e.data || {};
  try {
    const mod: any = await import('exceljs/dist/exceljs.min.js');
    const ExcelJS = mod.default || mod;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer);
    const ws = wb.worksheets[0];
    if (!ws) { (self as any).postMessage({ id, rows: [] }); return; }

    const rows: string[][] = [];
    ws.eachRow({ includeEmpty: true }, (row: any) => {
      const vals = (row.values as unknown[]).slice(1).map((x) => toCellValue(x));
      rows.push(vals);
    });

    if (header === 1) { (self as any).postMessage({ id, rows }); return; }
    if (!rows.length) { (self as any).postMessage({ id, rows: [] }); return; }

    const headers = rows[0].map((h) => String(h || '').trim());
    const out: Record<string, unknown>[] = [];
    for (let i = 1; i < rows.length; i++) {
      const line = rows[i] || [];
      const obj: Record<string, unknown> = Object.create(null);
      let hasValue = false;
      for (let idx = 0; idx < headers.length; idx++) {
        const key = headers[idx];
        if (!key || BLOCKED_KEYS.has(key)) continue;
        const value = line[idx] ?? '';
        if (String(value || '').trim() !== '') hasValue = true;
        obj[key] = value;
      }
      if (hasValue) out.push(obj);
    }
    (self as any).postMessage({ id, rows: out });
  } catch (err: any) {
    (self as any).postMessage({ id, error: String(err?.message || err || 'parse failed') });
  }
};
