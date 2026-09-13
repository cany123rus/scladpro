/**
 * Печать без скачивания файла и без вкладки.
 *
 * Раньше печать по всему сайту шла через файл: PDF скачивался или открывался
 * в новой вкладке, откуда его отправляли на принтер. Теперь документ уходит в
 * печать из невидимого фрейма, и браузер сразу показывает своё окно печати.
 *
 * Окно печати браузер показывает всегда — это его защита, сайт её не обходит.
 * Совсем без окна печатает Chrome, запущенный с флагом --kiosk-printing: тогда
 * всё уходит на принтер по умолчанию.
 */

type PrintableImage = { file: string; type?: 'png' | 'svg' | string };

const makeFrame = (widthMm: number, heightMm: number) => {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.setAttribute('tabindex', '-1');
  // Не display:none и не нулевой размер: скрытый так фрейм Chrome печатает пустым.
  iframe.style.cssText = [
    'position:fixed',
    'left:-10000px',
    'top:0',
    `width:${widthMm}mm`,
    `height:${heightMm}mm`,
    'border:0',
    'opacity:0',
    'pointer-events:none',
  ].join(';');
  return iframe;
};

// Фрейм живёт, пока открыто окно печати: print() в Chrome не блокирует, и ранняя
// уборка обрывала бы задание.
const removeLater = (iframe: HTMLIFrameElement, url?: string) => {
  setTimeout(() => {
    try { iframe.remove(); } catch { /* уже убран */ }
    if (url) { try { URL.revokeObjectURL(url); } catch { /* уже отозван */ } }
  }, 120_000);
};

/**
 * Документ jsPDF — в окно печати.
 *
 * Если браузер не дал напечатать из фрейма (старый браузер, запрет), PDF
 * открывается во вкладке, как раньше: печать не должна просто пропасть.
 */
export function printPdfDirect(pdf: any, page: { widthMm?: number; heightMm?: number } = {}): Promise<void> {
  return new Promise((resolve) => {
    const url = String(pdf.output('bloburl'));
    const iframe = makeFrame(page.widthMm ?? 210, page.heightMm ?? 297);

    const fallback = () => {
      try { window.open(url, '_blank'); } catch { /* блокировщик */ }
    };

    iframe.onload = () => {
      // Встроенному просмотрщику PDF нужен миг, чтобы отрисовать страницы.
      setTimeout(() => {
        try {
          const win = iframe.contentWindow;
          if (!win) throw new Error('нет окна фрейма');
          win.focus();
          win.print();
        } catch (e) {
          console.warn('печать из фрейма не удалась, открываю PDF во вкладке', e);
          fallback();
        } finally {
          removeLater(iframe, url);
          resolve();
        }
      }, 400);
    };

    iframe.src = url;
    document.body.appendChild(iframe);
  });
}

/**
 * Картинки стикеров (как их отдаёт WB: PNG или SVG в base64) — в окно печати,
 * по одной на страницу заданного размера.
 */
export function printImagesDirect(
  images: readonly PrintableImage[],
  page: { widthMm: number; heightMm: number } = { widthMm: 58, heightMm: 40 },
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!images.length) {
      reject(new Error('Нечего печатать'));
      return;
    }

    const iframe = makeFrame(page.widthMm, page.heightMm);
    const tags = images
      .map((img) => {
        const raw = String(img.file || '');
        const src = raw.startsWith('data:')
          ? raw
          : `data:${img.type === 'svg' ? 'image/svg+xml' : 'image/png'};base64,${raw}`;
        return `<img src="${src}" alt="">`;
      })
      .join('');

    iframe.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><style>
      @page { size: ${page.widthMm}mm ${page.heightMm}mm; margin: 0; }
      html, body { margin: 0; padding: 0; }
      img { display: block; width: ${page.widthMm}mm; height: ${page.heightMm}mm; object-fit: contain;
            page-break-after: always; break-after: page; }
      img:last-child { page-break-after: auto; break-after: auto; }
    </style></head><body>${tags}</body></html>`;

    iframe.onload = async () => {
      try {
        const doc = iframe.contentDocument;
        const list = Array.from(doc?.images || []);
        await Promise.all(list.map((img) => (
          img.complete ? Promise.resolve() : new Promise((r) => { img.onload = r; img.onerror = r; })
        )));
        const win = iframe.contentWindow;
        if (!win) throw new Error('Окно печати не создалось');
        win.focus();
        win.print();
        resolve();
      } catch (e) {
        reject(e);
      } finally {
        removeLater(iframe);
      }
    };

    document.body.appendChild(iframe);
  });
}
