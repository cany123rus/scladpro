// Shared styling helpers for jsPDF reports (modern look: dark header banner,
// KPI chips, striped tables, page footer). All helpers take the jsPDF `doc`
// (with the Roboto font already registered) and use mm units.
type Rgb = number[];

export const SLATE: Rgb = [15, 23, 42];
export const INDIGO: Rgb = [79, 70, 229];
export const EMERALD: Rgb = [16, 185, 129];
export const BLUE: Rgb = [37, 99, 235];
export const VIOLET: Rgb = [124, 58, 237];
export const ROSE: Rgb = [225, 29, 72];
export const TEAL: Rgb = [13, 148, 136];

export function drawReportHeader(
  doc: any,
  opts: { title: string; subtitle?: string; rightLines?: string[]; accent?: Rgb },
): number {
  const pageW = doc.internal.pageSize.getWidth();
  const accent = opts.accent || INDIGO;
  doc.setFillColor(SLATE[0], SLATE[1], SLATE[2]);
  doc.rect(0, 0, pageW, 28, 'F');
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(0, 28, pageW, 1.4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(opts.title, 12, 14);
  if (opts.subtitle) {
    doc.setFontSize(8.5);
    doc.setTextColor(199, 210, 254);
    doc.text(opts.subtitle, 12, 21);
  }
  if (opts.rightLines && opts.rightLines.length) {
    doc.setFontSize(8.5);
    doc.setTextColor(226, 232, 240);
    opts.rightLines.forEach((l, i) => doc.text(l, pageW - 12, 12 + i * 5.5, { align: 'right' }));
  }
  return 34;
}

export function drawMetaLines(doc: any, y: number, lines: string[]): number {
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  lines.forEach((l, i) => doc.text(l, 12, y + i * 5));
  return y + lines.length * 5 + 2;
}

export function drawKpiChips(doc: any, y: number, chips: Array<{ label: string; value: string; rgb: Rgb }>): number {
  if (!chips.length) return y;
  const pageW = doc.internal.pageSize.getWidth();
  const gap = 4;
  const w = (pageW - 24 - gap * (chips.length - 1)) / chips.length;
  let x = 12;
  chips.forEach((c) => {
    doc.setFillColor(c.rgb[0], c.rgb[1], c.rgb[2]);
    doc.roundedRect(x, y, w, 16, 2, 2, 'F');
    doc.setTextColor(226, 232, 240);
    doc.setFontSize(7);
    doc.text(c.label.toUpperCase(), x + 4, y + 6);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10.5);
    doc.text(String(c.value), x + 4, y + 13);
    x += w + gap;
  });
  return y + 20;
}

export function reportFooter(doc: any, brand = 'СкладПро · отчёт') {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  return (data: any) => {
    const page = data?.pageNumber || doc.internal.getNumberOfPages();
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(brand, 12, pageH - 6);
    doc.text('Стр. ' + page, pageW - 12, pageH - 6, { align: 'right' });
  };
}

export function reportTableStyles(headRgb: Rgb) {
  return {
    theme: 'striped',
    styles: { font: 'Roboto', fontSize: 8, cellPadding: 1.8, overflow: 'linebreak', lineColor: [226, 232, 240], lineWidth: 0.1 },
    headStyles: { font: 'Roboto', fillColor: headRgb, textColor: 255, fontStyle: 'normal', fontSize: 8 },
    footStyles: { font: 'Roboto', fillColor: [226, 232, 240], textColor: SLATE, fontStyle: 'normal' },
    bodyStyles: { font: 'Roboto', fontStyle: 'normal' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 10, right: 10 },
  };
}
