// ExcelJS is heavy (~900KB) — load it lazily so it only enters the bundle
// when an export actually runs, not on initial page load.
let _ExcelJS: any = null;
const loadExcel = async () => {
  if (!_ExcelJS) _ExcelJS = (await import('exceljs/dist/exceljs.min.js')).default;
  return _ExcelJS;
};

type JsonRow = Record<string, unknown>;

type SheetSpec = {
  name: string;
  rows: JsonRow[];
  headers?: string[];
  widths?: number[];
};

const triggerDownload = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  window.URL.revokeObjectURL(url);
};

const normalizeRows = (rows: JsonRow[], headers: string[]) =>
  rows.map((row) => headers.map((h) => row[h] ?? ''));

export const createWorkbookBlob = async (sheets: SheetSpec[]) => {
  const ExcelJS = await loadExcel();
  const wb = new ExcelJS.Workbook();

  sheets.forEach((sheet) => {
    const ws = wb.addWorksheet(sheet.name || 'Sheet1');
    const headers = sheet.headers?.length
      ? sheet.headers
      : Array.from(new Set(sheet.rows.flatMap((r) => Object.keys(r || {}))));

    ws.addRow(headers);
    normalizeRows(sheet.rows, headers).forEach((r) => ws.addRow(r));

    ws.columns.forEach((col, idx) => {
      const width = sheet.widths?.[idx];
      col.width = width || Math.max(12, String(headers[idx] || '').length + 2);
    });
  });

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
};

export const downloadWorkbook = async (fileName: string, sheets: SheetSpec[]) => {
  const blob = await createWorkbookBlob(sheets);
  triggerDownload(blob, fileName);
};

export const downloadAoaWorkbook = async (
  fileName: string,
  sheetName: string,
  rows: Array<Array<string | number | null | undefined>>
) => {
  const ExcelJS = await loadExcel();
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName || 'Sheet1');
  rows.forEach((r) => ws.addRow(r));
  const buffer = await wb.xlsx.writeBuffer();
  triggerDownload(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    fileName
  );
};
