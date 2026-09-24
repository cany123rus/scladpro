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
  // Свитеры, жилеты и кардиганы — одна категория ЧЗ: марки у них общие.
  if (['свитеры', 'свитер', 'жилеты', 'жилет', 'жилетки', 'жилетка', 'кардиганы', 'кардиган', 'свитеры / жилеты', 'свитеры / жилеты / кардиганы'].includes(value)) {
    return 'свитеры / жилеты / кардиганы';
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

/** Настройки макета «ШК + ЧЗ + конец стикера». Правятся в конструкторе. */
export interface ChzTailLayout {
  dmX: number;
  dmY: number;
  dmSize: number;
  dmTextY: number;
  /** Насколько начало номера поднято над концом. Общий блок, одна точка. */
  headGap: number;
  headFont: number;
  tailX: number;
  tailY: number;
  tailFont: number;
  textX: number;
  titleY: number;
  titleFont: number;
  dataY: number;
  dataGap: number;
  textFont: number;
  barcodeX: number;
  barcodeY: number;
  barcodeW: number;
  barcodeH: number;
  barcodeTextY: number;
}

export const DEFAULT_CHZ_TAIL_LAYOUT: ChzTailLayout = {
  dmX: 1.3,
  dmY: 2.0,
  dmSize: 24.5,
  dmTextY: 27.6,
  headGap: 7.8,
  headFont: 7,
  tailX: 56.5,
  tailY: 13,
  tailFont: 18,
  textX: 27.5,
  titleY: 15.5,
  titleFont: 6.6,
  dataY: 21.5,
  dataGap: 2.9,
  textFont: 5.6,
  barcodeX: 29.89,
  barcodeY: 27.41,
  barcodeW: 25.5,
  barcodeH: 6.9,
  barcodeTextY: 37.48,
};

/** Настройки совмещённого макета «стикер задания + ЧЗ». */
export interface FbsComboLayout {
  dmX: number;
  dmY: number;
  qrX: number;
  qrY: number;
  /** Сторона обоих квадратов: марка и QR задания одного размера. */
  symbolSize: number;
  /** Код марки текстом под ней — мелко, в три строки по ширине символа. */
  codeTextX: number;
  codeTextY: number;
  codeTextFont: number;
  /** Начало номера над концом: тянутся вместе, как одна надпись. */
  partGap: number;
  partAFont: number;
  partBX: number;
  partBY: number;
  partBFont: number;
  /**
   * Два маленьких QR задания по бокам от номера — как на стикере WB.
   * Двигаются вместе с номером. 0 — не рисовать.
   */
  sideQrSize: number;
  /** От центра номера до внутреннего края каждого бокового QR, мм. */
  sideQrGap: number;
  /** Центр боковых QR по вертикали относительно линии крупных цифр, мм (минус — выше). */
  sideQrDy: number;
}

export const DEFAULT_FBS_COMBO_LAYOUT: FbsComboLayout = {
  dmX: 1.5,
  dmY: 1,
  qrX: 30,
  qrY: 1,
  /*
   * Оба квадрата по 26 мм.
   *
   * В марке 72×72 модуля против 25×25 у QR задания, поэтому при равной
   * стороне модуль у неё мельче: 0,36 мм — всё равно с запасом против
   * проверенной этикетки, где он 0,33.
   */
  symbolSize: 26,
  codeTextX: 1.5,
  codeTextY: 29.6,
  codeTextFont: 3.4,
  partGap: 6.5,
  partAFont: 6.5,
  partBX: 43,
  partBY: 38,
  partBFont: 12,
  sideQrSize: 6,
  sideQrGap: 7.5,
  sideQrDy: -3.5,
};

export function readChzTailLayout(raw: unknown): ChzTailLayout {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const part = (parsed as any)?.chzTail;
    if (!part || typeof part !== 'object') return DEFAULT_CHZ_TAIL_LAYOUT;
    return { ...DEFAULT_CHZ_TAIL_LAYOUT, ...part };
  } catch {
    return DEFAULT_CHZ_TAIL_LAYOUT;
  }
}

export function readFbsComboLayout(raw: unknown): FbsComboLayout {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const part = (parsed as any)?.fbsCombo;
    if (!part || typeof part !== 'object') return DEFAULT_FBS_COMBO_LAYOUT;
    return { ...DEFAULT_FBS_COMBO_LAYOUT, ...part };
  } catch {
    return DEFAULT_FBS_COMBO_LAYOUT;
  }
}

/**
 * Этикетка «ШК + ЧЗ + конец номера стикера».
 *
 * Отличается от обычной одним: справа вверху крупно набраны последние четыре
 * цифры стикера — те самые, что на этикетке WB напечатаны большим кеглем. По
 * ним задание находят глазами в коробке, не поднося сканер к каждой вещи.
 */
export async function drawChzTailLabel(
  doc: any,
  bwipjs: any,
  layout: ChzTailLayout,
  data: ChzLabelData & { stickerHead?: string; stickerTail?: string },
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
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', layout.dmX, layout.dmY, layout.dmSize, layout.dmSize);

      setFont('normal');
      doc.setFontSize(3.6);
      doc.text(doc.splitTextToSize(code, Math.max(16, layout.dmSize - 0.5)), layout.dmX - 0.1, layout.dmTextY);
    } catch (e) {
      console.warn('Не нарисовали DataMatrix', e);
    }
  }

  /*
   * Номер стикера целиком — только цифры, без кодов задания.
   *
   * Набран как у WB: начало мелко, конец крупно. Сборщик держит вещь и
   * сверяет цифры со стикером, чтобы не наклеить марку на соседний товар —
   * по четырём цифрам это быстро, а полный номер нужен, когда рядом лежат
   * задания с одинаковым концом.
   *
   * Второго машиночитаемого кода тут нет намеренно: сканеру он не нужен, а
   * место отнял бы у марки.
   */
  const head = String(data.stickerHead || '').trim();
  if (head) {
    setFont('normal');
    doc.setFontSize(layout.headFont);
    // Точка одна — у крупных цифр; мелкие просто висят над ними.
    doc.text(head, layout.tailX, layout.tailY - layout.headGap, { align: 'right' });
  }

  const tail = String(data.stickerTail || '').trim();
  if (tail) {
    setFont('bold');
    doc.setFontSize(layout.tailFont);
    doc.text(tail, layout.tailX, layout.tailY, { align: 'right' });
  }

  setFont('bold');
  doc.setFontSize(layout.titleFont);
  doc.text(
    doc.splitTextToSize(String(data.title || ''), 29).slice(0, 2),
    layout.textX,
    tail ? layout.titleY : 5.5,
  );

  setFont('normal');
  doc.setFontSize(layout.textFont);
  const lines = [
    data.article ? `Арт: ${data.article}` : '',
    data.size ? `Размер: ${data.size}` : '',
  ].filter(Boolean);
  let y = tail ? layout.dataY : 13;
  for (const line of lines) {
    doc.text(line, layout.textX, y);
    y += layout.dataGap;
  }

  await drawProductBarcode(
    doc, bwipjs, canvas, String(data.barcode || ''),
    layout.barcodeX, layout.barcodeY, layout.barcodeW, layout.barcodeH, layout.barcodeTextY, setFont,
  );
}

/**
 * Совмещённая этикетка: стикер задания WB и честный знак на одном поле.
 *
 * Стикер WB рисуем сами, а не вклеиваем картинкой: API отдаёт и содержимое
 * кодов (`barcode`, строка вида `*DXPcELUX`), и обе половины номера. Проверено
 * на живой этикетке — центральный QR кодирует ровно эту строку, поэтому свой
 * QR несёт то же, что и оригинал.
 *
 * Чем это отличается от оригинала: у WB по краям ещё служебные коды и логотип,
 * у нас их нет — место ушло под честный знак. 14.09.2026 такие этикетки прошли
 * приёмку WB, поэтому содержимое QR задания не менять: WB сверяет именно его.
 */
export async function drawFbsComboLabel(
  doc: any,
  bwipjs: any,
  layout: FbsComboLayout,
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
       * В символе 72×72 модуля против 25×25 у QR задания. При равной стороне
       * модуль у марки втрое мельче, поэтому сторону держим крупной: на 26 мм
       * это 0,36 мм на модуль — с запасом против проверенной этикетки, где
       * 0,33. Меньше 22 мм уводит к границе допустимого по ГИС МТ.
       */
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', layout.dmX, layout.dmY, layout.symbolSize, layout.symbolSize);
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
      const qrImage = canvas.toDataURL('image/png');
      doc.addImage(qrImage, 'PNG', layout.qrX, layout.qrY, layout.symbolSize, layout.symbolSize);

      /*
       * Два маленьких QR по бокам номера — те же, что у WB вокруг цифр.
       *
       * Содержимое у всех QR на стикере WB одно (проверено на живой этикетке),
       * поэтому это копии большого: сканер у стола ловит любой, даже когда
       * большой QR закрыт рукой или загнулся на упаковке.
       */
      const side = Number(layout.sideQrSize || 0);
      if (side > 0) {
        const top = layout.partBY + Number(layout.sideQrDy || 0) - side / 2;
        const gap = Number(layout.sideQrGap || 0);
        doc.addImage(qrImage, 'PNG', layout.partBX - gap - side, top, side, side);
        doc.addImage(qrImage, 'PNG', layout.partBX + gap, top, side, side);
      }
    } catch (e) {
      console.warn('Не нарисовали QR задания', e);
    }
  }

  /*
   * 3. Под каждым символом — его собственная подпись.
   *
   * Слева код марки целиком, мелко и в три строки по ширине символа — так же,
   * как на обычной этикетке «ШК + ЧЗ». Справа номер задания. Подпись под своим
   * кодом: под чужим сборщик читает её как ошибку.
   */
  if (code) {
    setFont('normal');
    doc.setFontSize(layout.codeTextFont);
    doc.text(
      doc.splitTextToSize(code, Math.max(16, layout.symbolSize - 0.4)).slice(0, 3),
      layout.codeTextX,
      layout.codeTextY,
    );
  }

  // Номер задания: мелкая старшая часть и крупная младшая — как у WB.
  const partA = String(data.partA || '').trim();
  const partB = String(data.partB || '').trim();
  if (partA) {
    setFont('normal');
    doc.setFontSize(layout.partAFont);
    // Та же точка, что и у крупных цифр, только выше на partGap.
    doc.text(partA, layout.partBX, layout.partBY - layout.partGap, { align: 'center' });
  }
  if (partB) {
    setFont('bold');
    doc.setFontSize(layout.partBFont);
    doc.text(partB, layout.partBX, layout.partBY, { align: 'center' });
  }

  /*
   * Больше на этикетке ничего нет.
   *
   * Два символа и две подписи под ними. Полосы штрихкода тут были, но их
   * убрали — QR несёт то же значение, а место лучше отдать марке. Товарного
   * ШК, артикула и размера здесь нет тем более.
   */
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
