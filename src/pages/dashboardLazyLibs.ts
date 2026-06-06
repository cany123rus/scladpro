// Lazy-loaded heavy libraries (jsPDF, jspdf-autotable, ExcelJS, bwip-js).
// Pulled in only when a PDF/Excel/barcode action runs, keeping them out of the
// initial dashboard chunk. Access the loaded modules via the `lazyLibs` getter
// object (e.g. `lazyLibs.jsPDF`) AFTER awaiting the matching ensure*() call.

let _jsPDF: any = null;
let _autoTable: any = null;
let _ExcelJS: any = null;
let _bwipjs: any = null;
let _pdfLibsPromise: Promise<void> | null = null;
let _excelPromise: Promise<void> | null = null;
let _bwipPromise: Promise<void> | null = null;

export const ensurePdfLibs = () => {
  if (!_pdfLibsPromise) {
    _pdfLibsPromise = Promise.all([import('jspdf'), import('jspdf-autotable')]).then(([p, a]) => {
      _jsPDF = (p as any).jsPDF;
      _autoTable = (a as any).default;
    });
  }
  return _pdfLibsPromise;
};

export const ensureExcel = () => {
  if (!_excelPromise) {
    _excelPromise = import('exceljs/dist/exceljs.min.js').then((m) => {
      _ExcelJS = (m as any).default;
    });
  }
  return _excelPromise;
};

export const ensureBwip = () => {
  if (!_bwipPromise) {
    _bwipPromise = import('bwip-js').then((m) => {
      _bwipjs = (m as any).default || m;
    });
  }
  return _bwipPromise;
};

export const lazyLibs = {
  get jsPDF() { return _jsPDF; },
  get autoTable() { return _autoTable; },
  get ExcelJS() { return _ExcelJS; },
  get bwipjs() { return _bwipjs; },
};
