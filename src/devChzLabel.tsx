// Временный стенд: рисуем все три макета этикеток тем же кодом, что и печать.
//
// Данные — живые: марка из базы кабинета Власенко, стикер из ответа WB
// (/api/v3/orders/stickers), товарный ШК из карточки. На макет смотрят глазами,
// поэтому подставлять сюда выдуманные строки бессмысленно: длина марки и
// содержимое кода стикера определяют размер символов.
import { jsPDF } from 'jspdf';
import bwipjs from 'bwip-js';
import {
  DEFAULT_CHZ_LABEL_LAYOUT,
  DEFAULT_CHZ_TAIL_LAYOUT,
  DEFAULT_FBS_COMBO_LAYOUT,
  drawChzLabel,
  drawChzTailLabel,
  drawFbsComboLabel,
} from './utils/chzLabel';

const CHZ = '0104640233723909215XH=oFmHzyr,Z91EE1292z8CrXhvLbaNMr/WunGb/KsgNurUHZwN2psSJR8RJd/U=';
const STICKER_CODE = '*DXPcELUX';
const PART_A = '5777837';
const PART_B = '6885';

const log = (text: string) => {
  const el = document.getElementById('log');
  if (el) el.textContent = text;
};

async function run() {
  log('Рисую…');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [58, 40], compress: false });
  try {
    const res = await fetch('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf');
    const blob = await res.blob();
    const b64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result).split(',')[1]);
      reader.readAsDataURL(blob);
    });
    doc.addFileToVFS('Roboto-Regular.ttf', b64);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'bold');
  } catch (e) {
    console.warn('шрифт не загрузился', e);
  }

  const product = {
    chzCode: CHZ,
    barcode: '2054911865119',
    title: 'Костюм спортивный мужской тройка',
    article: 'КостюмТройкаЧёрный',
    size: '2XL',
    supplierName: 'ИП Власенко_И_А',
  };

  await drawChzLabel(doc, bwipjs, DEFAULT_CHZ_LABEL_LAYOUT, product);

  doc.addPage([58, 40], 'landscape');
  await drawChzTailLabel(doc, bwipjs, DEFAULT_CHZ_TAIL_LAYOUT, { ...product, stickerHead: PART_A, stickerTail: PART_B });

  doc.addPage([58, 40], 'landscape');
  await drawFbsComboLabel(doc, bwipjs, DEFAULT_FBS_COMBO_LAYOUT, {
    ...product,
    stickerCode: STICKER_CODE,
    partA: PART_A,
    partB: PART_B,
  });

  const url = doc.output('bloburl') as unknown as string;
  const link = document.getElementById('dl') as HTMLAnchorElement | null;
  if (link) {
    link.href = url;
    link.download = 'labels-test.pdf';
    link.style.display = 'inline-block';
  }

  /*
   * Растеризуем сам PDF, а не «примерно то же» на канвасе.
   *
   * Встроенный просмотрщик PDF есть не в каждом окне, а смотреть нужно на
   * готовый файл: на печать уходит он, и любая разница между предпросмотром и
   * файлом — это ровно тот баг, который ищут на складе.
   */
  const pdfjs = (window as any).pdfjsLib;
  if (pdfjs) {
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const bytes = doc.output('arraybuffer');
    const pdfDoc = await pdfjs.getDocument({ data: bytes }).promise;
    const host = document.getElementById('pages');
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale: 5 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.cssText = 'border:1px solid #cbd5e1;border-radius:8px;margin:0 12px 12px 0;background:#fff';
      host?.appendChild(canvas);
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    }
  }

  log('Готово: 3 страницы — «ШК + ЧЗ», «ШК + ЧЗ + конец стикера», «совмещённая».');
}

run().catch((e) => log(`Ошибка: ${e?.message || e}`));
