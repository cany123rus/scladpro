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
  size?: string;
}

export interface ChzProductMeta {
  gender: string;
  subject: string;
  size?: string;
}

/**
 * Размеры сравниваем по написанию, а не по буквам.
 *
 * В карточках WB встречаются «2XL», «2xl» и «XXL» — для человека это один
 * размер, а для строкового сравнения три разных. Приводим к одному виду,
 * иначе марка не подберётся к своему же товару.
 */
export const normalizeHsSize = (raw: string): string => {
  let value = String(raw || '').trim().toLowerCase().replace(/\s+/g, '');
  if (!value) return '';

  // XXL -> 2xl, XXXL -> 3xl и так далее.
  const repeated = value.match(/^(x{2,})l$/);
  if (repeated) value = `${repeated[1].length}xl`;

  return value;
};

/**
 * Подбор марки под товар заказа.
 *
 * Первая же проверка показала, зачем это нужно: марка мужского костюма встала
 * на женский товар, потому что коды брались просто по очереди. Правила:
 *
 *  - у марки указан пол — у товара должен быть ровно такой же. Неизвестный пол
 *    товара тоже не подходит: «наверное, мужской» — не основание клеить марку;
 *  - то же и с размером: указан у марки — должен совпасть с размером задания;
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
  const productSize = normalizeHsSize(product?.size || '');

  return pool.find((item) => {
    if (used.has(item.code)) return false;

    const codeGender = String(item.gender || '').trim().toLowerCase();
    const codeCategory = normalizeHsCategoryName(item.category);
    const codeSize = normalizeHsSize(item.size || '');

    if (codeGender && codeGender !== productGender) return false;
    if (codeSize && codeSize !== productSize) return false;
    if (codeCategory && productSubject && codeCategory !== productSubject) return false;

    const genderMatched = Boolean(codeGender && codeGender === productGender);
    const sizeMatched = Boolean(codeSize && codeSize === productSize);
    const categoryMatched = Boolean(codeCategory && productSubject && codeCategory === productSubject);
    return genderMatched || sizeMatched || categoryMatched;
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

/**
 * Этикетка «ШК + ЧЗ + конец номера стикера».
 *
 * Отличается от обычной одним: справа вверху крупно набраны последние четыре
 * цифры стикера — те самые, что на этикетке WB напечатаны большим кеглем. По
 * ним задание находят глазами в коробке, не поднося сканер к каждой вещи.
 *
 * Геометрия зашита здесь, а не в конструкторе: макет новый, и пока его не
 * обкатали на печати, отдельная копия координат в настройках только мешала бы.
 */
export async function drawChzTailLabel(
  doc: any,
  bwipjs: any,
  data: ChzLabelData & { stickerTail?: string },
  fontName = 'Roboto',
): Promise<void> {
  const canvas = document.createElement('canvas');
  const setFont = (style: 'normal' | 'bold') => {
    try { doc.setFont(fontName, style); } catch { /* нет шрифта — печатаем встроенным */ }
  };

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
        backgroundcolor: 'ffffff',
      });
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', 1.3, 2.0, 24.5, 24.5);

      setFont('normal');
      doc.setFontSize(3.6);
      doc.text(doc.splitTextToSize(code, 24), 1.2, 27.6);
    } catch (e) {
      console.warn('Не нарисовали DataMatrix', e);
    }
  }

  // Хвост номера — самое крупное на этикетке: его читает человек, а не сканер.
  const tail = String(data.stickerTail || '').trim();
  if (tail) {
    setFont('bold');
    doc.setFontSize(20);
    doc.text(tail, 56.5, 11, { align: 'right' });
  }

  setFont('bold');
  doc.setFontSize(6.6);
  doc.text(doc.splitTextToSize(String(data.title || ''), 29).slice(0, 2), 27.5, tail ? 15.5 : 5.5);

  setFont('normal');
  doc.setFontSize(5.6);
  const lines = [
    data.article ? `Арт: ${data.article}` : '',
    data.size ? `Размер: ${data.size}` : '',
  ].filter(Boolean);
  let y = tail ? 21.5 : 13;
  for (const line of lines) {
    doc.text(line, 27.5, y);
    y += 2.9;
  }

  await drawProductBarcode(doc, bwipjs, canvas, String(data.barcode || ''), 29.89, 27.41, 25.5, 6.9, 37.48, setFont);
}

/**
 * Совмещённая этикетка: стикер задания WB и честный знак на одном поле.
 *
 * Стикер WB рисуем сами, а не вклеиваем картинкой: API отдаёт и содержимое
 * кодов (`barcode`, строка вида `*DXPcELUX`), и обе половины номера. Проверено
 * на живой этикетке — центральный QR кодирует ровно эту строку, поэтому свой
 * QR несёт то же, что и оригинал.
 *
 * Чем это отличается от оригинала: у WB по краям ещё четыре служебных кода и
 * логотип, у нас их нет — место ушло под честный знак. Прежде чем переводить
 * на такую этикетку весь склад, её нужно проверить на приёмке одной поставкой.
 */
export async function drawFbsComboLabel(
  doc: any,
  bwipjs: any,
  data: ChzLabelData & { stickerCode?: string; partA?: string; partB?: string },
  fontName = 'Roboto',
): Promise<void> {
  const canvas = document.createElement('canvas');
  const setFont = (style: 'normal' | 'bold') => {
    try { doc.setFont(fontName, style); } catch { /* нет шрифта — печатаем встроенным */ }
  };

  // 1. Честный знак — слева.
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
        backgroundcolor: 'ffffff',
      });
      /*
       * Марку не ужимаем ради красоты макета.
       *
       * В символе 72×72 модуля: на 24 мм это 0,33 мм на модуль — ровно то, чем
       * печатается проверенная этикетка «ШК + ЧЗ». Урезать до 21 мм значит
       * уйти на 0,29 мм, к самой границе допустимого по ГИС МТ, и получить
       * модуль в два с небольшим пикселя термопринтера. Место под остальное
       * забираем откуда угодно, только не отсюда.
       */
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', 1, 1, 24, 24);
    } catch (e) {
      console.warn('Не нарисовали DataMatrix', e);
    }
  }

  // 2. QR задания — справа. Содержимое ровно то, что отдал WB.
  const stickerCode = String(data.stickerCode || '').trim();
  if (stickerCode) {
    try {
      bwipjs.toCanvas(canvas, {
        bcid: 'qrcode',
        text: stickerCode,
        eclevel: 'M',
        scale: 5,
        padding: 0,
        includetext: false,
        backgroundcolor: 'ffffff',
      });
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', 26, 1, 15, 15);
    } catch (e) {
      console.warn('Не нарисовали QR задания', e);
    }
  }

  // 3. Номер задания: мелкая старшая часть и крупная младшая — как у WB.
  const partA = String(data.partA || '').trim();
  const partB = String(data.partB || '').trim();
  if (partA) {
    setFont('normal');
    doc.setFontSize(6.2);
    doc.text(partA, 42.5, 6.5);
  }
  if (partB) {
    setFont('bold');
    doc.setFontSize(12);
    doc.text(partB, 42.5, 14.5);
  }

  // 4. Штрихкод задания во всю ширину — второй способ считать то же значение.
  if (stickerCode) {
    try {
      bwipjs.toCanvas(canvas, {
        bcid: 'code128',
        text: stickerCode,
        scale: 4,
        height: 6,
        includetext: false,
        paddingwidth: 0,
        paddingheight: 0,
        backgroundcolor: 'ffffff',
      });
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', 2, 26, 54, 5.8);
    } catch (e) {
      console.warn('Не нарисовали штрихкод задания', e);
    }
  }

  // 5. Подписи внизу: сам код марки и товар — для разбора руками.
  setFont('normal');
  doc.setFontSize(3.2);
  if (code) doc.text(doc.splitTextToSize(code, 54).slice(0, 2), 2, 34.2);

  doc.setFontSize(5);
  const info = [data.article, data.size].filter(Boolean).join(' · ');
  if (info) doc.text(doc.splitTextToSize(info, 54)[0], 2, 39);
}

/** Товарный штрихкод: EAN-13, если сходится контрольная цифра, иначе code128. */
async function drawProductBarcode(
  doc: any,
  bwipjs: any,
  canvas: HTMLCanvasElement,
  barcode: string,
  x: number,
  y: number,
  w: number,
  h: number,
  textY: number,
  setFont: (style: 'normal' | 'bold') => void,
): Promise<void> {
  const value = String(barcode || '').trim();
  if (!value) return;

  try {
    const draw = (bcid: string) =>
      bwipjs.toCanvas(canvas, {
        bcid,
        text: value,
        scale: 4,
        height: 8,
        includetext: false,
        paddingwidth: 0,
        paddingheight: 0,
        backgroundcolor: 'ffffff',
      });

    if (/^\d{13}$/.test(value)) {
      try { draw('ean13'); } catch { draw('code128'); }
    } else {
      draw('code128');
    }
    doc.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, w, h);

    setFont('bold');
    doc.setFontSize(10.4);
    doc.text(value, x + w / 2, Math.max(y + h + 1.2, textY), { align: 'center' });
  } catch (e) {
    console.warn('Не нарисовали штрихкод', e);
  }
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
