/**
 * Этикетка «ШК + Честный знак» 58×40.
 *
 * Отдельный модуль, потому что печатать её нужно из двух мест: из товаров, где
 * этикетку клеят заранее, и из поставки ФБС, где она идёт следом за стикером
 * WB. Раскладка — та же, что настроена в конструкторе этикеток
 * (app_settings, ключ wb_label_layout_v1): второй копии координат быть не
 * должно, иначе макет разъедется при первой же правке.
 */
import { normalizeDataMatrixText, restoreDataMatrixGs } from './honestSign';

export interface ChzLabelLayout {
  dmX: number;
  dmY: number;
  dmSize: number;
  dmTextX: number;
  dmTextY: number;
  textX: number;
  textY: number;
  titleFont: number;
  titleGap: number;
  textFont: number;
  dataGap: number;
  barcodeX: number;
  barcodeY: number;
  barcodeW: number;
  barcodeH: number;
  barcodeTextY: number;
}

/** Значения по умолчанию — те же, что лежат в настройке на 10.09.2026. */
export const DEFAULT_CHZ_LABEL_LAYOUT: ChzLabelLayout = {
  dmX: 1.34,
  dmY: 2.07,
  dmSize: 24.5,
  dmTextX: 1.19,
  dmTextY: 27.41,
  textX: 26.17,
  textY: 2.96,
  titleFont: 8.1,
  titleGap: 3,
  textFont: 6,
  dataGap: 3.05,
  barcodeX: 29.89,
  barcodeY: 27.41,
  barcodeW: 25.5,
  barcodeH: 6.9,
  barcodeTextY: 37.48,
};

/** «Костюмы» и «Костюмы спортивные» — одна категория, как и в базе кодов. */
export const normalizeHsCategoryName = (raw: string): string => {
  const value = String(raw || '').trim().toLowerCase();
  if (!value) return '';
  if (value === 'костюмы' || value === 'костюмы спортивные' || value === 'костюмы / костюмы спортивные') {
    return 'костюмы / костюмы спортивные';
  }
  return value;
};

export interface ChzPoolItem {
  code: string;
  category: string;
  gender: string;
}

export interface ChzProductMeta {
  gender: string;
  subject: string;
}

/**
 * Подбор марки под товар заказа.
 *
 * Первая же проверка показала, зачем это нужно: марка мужского костюма встала
 * на женский товар, потому что коды брались просто по очереди. Правила:
 *
 *  - у марки указан пол — у товара должен быть ровно такой же. Неизвестный пол
 *    товара тоже не подходит: «наверное, мужской» — не основание клеить марку;
 *  - категории, если обе известны, должны совпадать;
 *  - хотя бы одно совпадение обязательно, иначе это подбор вслепую.
 *
 * Не нашли подходящей — печатаем стикер без ЧЗ. Отсутствие марки заметят и
 * исправят, а чужая марка уедет с товаром молча.
 */
export function matchChzCodeForProduct(
  pool: readonly ChzPoolItem[],
  used: ReadonlySet<string>,
  product: ChzProductMeta | undefined,
): ChzPoolItem | undefined {
  const productGender = String(product?.gender || '').trim().toLowerCase();
  const productSubject = normalizeHsCategoryName(product?.subject || '');

  return pool.find((item) => {
    if (used.has(item.code)) return false;

    const codeGender = String(item.gender || '').trim().toLowerCase();
    const codeCategory = normalizeHsCategoryName(item.category);

    if (codeGender && codeGender !== productGender) return false;
    if (codeCategory && productSubject && codeCategory !== productSubject) return false;

    const genderMatched = Boolean(codeGender && codeGender === productGender);
    const categoryMatched = Boolean(codeCategory && productSubject && codeCategory === productSubject);
    return genderMatched || categoryMatched;
  });
}

export interface ChzLabelData {
  chzCode: string;
  /** Товарный штрихкод (EAN-13 из карточки WB). */
  barcode?: string;
  title?: string;
  article?: string;
  size?: string;
  color?: string;
  supplierName?: string;
}

export function readChzLabelLayout(raw: unknown): ChzLabelLayout {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const withChz = (parsed as any)?.withChz;
    if (!withChz || typeof withChz !== 'object') return DEFAULT_CHZ_LABEL_LAYOUT;
    return { ...DEFAULT_CHZ_LABEL_LAYOUT, ...withChz };
  } catch {
    return DEFAULT_CHZ_LABEL_LAYOUT;
  }
}

/**
 * Рисует одну этикетку на текущей странице документа.
 *
 * Страницу создаёт вызывающий: в поставке ФБС этикетка идёт следом за стикером
 * WB, и порядок страниц решает он, а не мы.
 */
export async function drawChzLabel(
  doc: any,
  bwipjs: any,
  layout: ChzLabelLayout,
  data: ChzLabelData,
  fontName = 'Roboto',
): Promise<void> {
  const canvas = document.createElement('canvas');

  const setFont = (style: 'normal' | 'bold') => {
    try {
      doc.setFont(fontName, style);
    } catch {
      // Шрифт не подгрузился — печатаем тем, что есть: без кириллицы, но с кодом.
    }
  };

  // 1. Честный знак. В символ уходит код с GS-разделителями: без них этикетка
  //    читается строкой на два символа короче настоящей марки.
  const code = normalizeDataMatrixText(String(data.chzCode || ''));
  if (code) {
    try {
      bwipjs.toCanvas(canvas, {
        bcid: 'datamatrix',
        text: restoreDataMatrixGs(code),
        binarytext: true,
        parsefnc: false,
        scale: 4,
        padding: 1,
        includetext: false,
        // Белый фон обязателен: без него символ уходит в PDF с прозрачностью,
        // и что окажется под ним при печати — уже не наша воля.
        backgroundcolor: 'ffffff',
      });
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', layout.dmX, layout.dmY, layout.dmSize, layout.dmSize);

      setFont('normal');
      doc.setFontSize(3.6);
      doc.text(doc.splitTextToSize(code, Math.max(16, layout.dmSize - 0.4)), layout.dmTextX, layout.dmTextY);
    } catch (e) {
      console.warn('Не нарисовали DataMatrix', e);
    }
  }

  // 2. Текст справа.
  let y = layout.textY;
  setFont('bold');
  doc.setFontSize(layout.titleFont);
  doc.text(doc.splitTextToSize(String(data.title || ''), 28.8).slice(0, 2), layout.textX, y);

  y += 4.0 + (layout.titleGap ?? 0);
  setFont('normal');
  doc.setFontSize(layout.textFont);

  const lines = [
    data.article ? `Артикул: ${data.article}` : '',
    data.size ? `Размер: ${data.size}` : '',
    data.color ? `Цвет: ${data.color}` : '',
    data.supplierName ? `Поставщик: ${data.supplierName}` : '',
  ].filter(Boolean);

  for (const line of lines) {
    doc.text(line, layout.textX, y);
    y += layout.dataGap ?? 3;
  }

  // 3. Товарный штрихкод. EAN-13 рисуем только если он и правда EAN-13:
  //    на кривой строке bwip-js падает, и без проверки терялась вся этикетка.
  const barcode = String(data.barcode || '').trim();
  if (barcode) {
    try {
      /*
       * EAN-13 рисуем, только если он и правда сходится по контрольной цифре.
       *
       * bwip-js на неверной цифре бросает исключение, и без запасного варианта
       * штрихкод молча пропадал с этикетки — товар уезжал бы с одной маркой.
       * Проверено на живом примере: 2048525000019 отвергается.
       */
      const drawBarcode = (bcid: string) =>
        bwipjs.toCanvas(canvas, {
          bcid,
          text: barcode,
          scale: 4,
          height: 8,
          includetext: false,
          paddingwidth: 0,
          paddingheight: 0,
          backgroundcolor: 'ffffff',
        });

      if (/^\d{13}$/.test(barcode)) {
        try {
          drawBarcode('ean13');
        } catch {
          drawBarcode('code128');
        }
      } else {
        drawBarcode('code128');
      }
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', layout.barcodeX, layout.barcodeY, layout.barcodeW, layout.barcodeH);

      setFont('bold');
      doc.setFontSize(10.4);
      // Цифры не поднимаем выше самого штрихкода — как в конструкторе.
      const digitsY = Math.max(layout.barcodeY + layout.barcodeH + 1.2, layout.barcodeTextY);
      doc.text(barcode, layout.barcodeX + layout.barcodeW / 2, digitsY, { align: 'center' });
    } catch (e) {
      console.warn('Не нарисовали штрихкод', e);
    }
  }
}
