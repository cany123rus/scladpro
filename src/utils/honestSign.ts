/**
 * Работа с кодами Честного знака.
 *
 * Вынесено из WBSupplyManager, чтобы раздел «Поиск ФБС» сканировал ЧЗ ровно
 * теми же правилами. Тонкости здесь неочевидные — про GS-разделитель и его
 * кодирование в Excel, — и две копии этих функций разъехались бы на первой же
 * правке, а расхождение всплыло бы отказом WB принять скан-файл.
 *
 * Управляющие символы записаны escape-последовательностями намеренно: в
 * исходнике они стояли живыми байтами, невидимыми в редакторе, и любая
 * копипаста через буфер их молча теряла.
 */

/** Разделитель GS1 (ASCII 29) — WB принимает КИЗ только с ним. */
export const GS_SEPARATOR = String.fromCharCode(29);

/** GS, RS, US — их сканеры вставляют между группами кода. */
const CONTROL_CHARS = /[]/g;

/**
 * Приводит код к виду, в котором его можно сравнивать.
 *
 * Разделители вырезаются намеренно: сканеры отдают их по-разному, и без
 * нормализации один и тот же код считался бы двумя разными.
 */
export const normalizeDataMatrixText = (raw: string) => {
  let value = String(raw || '').trim();
  value = value.replace(CONTROL_CHARS, '');
  if (value.startsWith('01') && value.length > 18) {
    const gtinPart = value.slice(0, 16);
    const tail = value.slice(16);
    if (!tail.startsWith('21')) {
      value = `${gtinPart}21${tail}`;
    }
  }
  return value;
};

/**
 * Возвращает GS-разделители в код Честного знака.
 *
 * Сканер часто не передаёт символ 29, а normalizeDataMatrixText вырезает его
 * намеренно — чтобы один и тот же код всегда сравнивался одинаково. Для WB
 * разделители обязательны, поэтому их восстанавливаем перед выгрузкой.
 *
 * Хвост кода фиксирован: 91 + ключ проверки (4) + 92 + значение проверки (44),
 * итого 52 символа. По нему однозначно видно, где кончается серийный номер,
 * — угадывать длину серийника не нужно.
 */
export const restoreDataMatrixGs = (raw: string) => {
  const value = String(raw || '').trim().replace(CONTROL_CHARS, '');
  const TAIL = 52;
  // 16 (01+GTIN) + 2 (AI 21) + минимум 1 знак серийника + хвост.
  if (!value.startsWith('01') || value.length < 16 + 2 + 1 + TAIL) return value;

  const head = value.slice(0, value.length - TAIL);
  const tail = value.slice(value.length - TAIL);

  // Форма не та — отдаём как есть: поставить разделитель наугад хуже, чем не поставить.
  if (!head.slice(16).startsWith('21')) return value;
  if (!tail.startsWith('91') || !tail.slice(6).startsWith('92')) return value;

  return `${head}${GS_SEPARATOR}${tail.slice(0, 6)}${GS_SEPARATOR}${tail.slice(6)}`;
};

/**
 * Кодирует GS для ячейки Excel.
 *
 * Символ 29 в XML недопустим, и ExcelJS вырезает его, если положить в ячейку
 * напрямую — файл уходил в WB без разделителей. Escape-форму `_x001D_` (ту же,
 * что использует сам Excel) ExcelJS при записи разворачивает обратно в байт.
 * Проверено чтением готового файла сторонней библиотекой.
 */
export const encodeGsForExcel = (value: string) =>
  String(value || '').split(GS_SEPARATOR).join('_x001D_');

/** Текст стикера без переносов и лишних пробелов. */
export const normalizeScanStickerText = (raw: string) => String(raw || '')
  .replace(/[\r\n\t]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

/**
 * Ключ для поиска строки по отсканированному стикеру.
 *
 * Сканер добавляет префикс символики (`]C1` и подобные) и может отдать код
 * без пробела, тогда как в файле WB он с пробелом. Поэтому сравниваем по
 * цифрам: всё остальное — оформление, а не данные.
 */
export const stickerKey = (raw: string) => normalizeScanStickerText(raw)
  .replace(/^\][A-Za-z0-9]{2}/, '')
  .replace(/\D+/g, '')
  .trim();
