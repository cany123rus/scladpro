/**
 * Стикеры сборочных заданий WB.
 *
 * Отдельный модуль, потому что порядок стикеров важен: печатать их надо в том
 * же порядке, в каком собран лист подбора, иначе сборщик берёт товар из одной
 * коробки, а клеит стикер от другой.
 *
 * Тот же API вызывает WBSupplyManager, но там логика вплетена в компонент со
 * своими ref-ами и профилями повторов. Трогать рабочую печать поставок ради
 * общего кода не стал — если она будет переезжать, переезжать ей сюда.
 */

const API = 'https://marketplace-api.wildberries.ru/api/v3/orders/stickers';

export interface StickerImage {
  /** base64 без префикса data:. */
  file: string;
  /** png или svg — от этого зависит, как рисовать. */
  type: 'png' | 'svg';
}

async function withTimeout<T>(p: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const guard = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  try {
    return await Promise.race([p, guard]);
  } finally {
    clearTimeout(timer!);
  }
}

/**
 * Забирает стикеры по номерам заданий.
 *
 * Пачками по сотне: на длинном списке WB отвечает 400. PNG просим первым — его
 * не нужно перегонять через SVG, — а если формат не отдали, берём SVG.
 */
export async function fetchStickers(
  token: string,
  orderIds: readonly number[],
  onProgress?: (done: number, total: number) => void,
): Promise<Map<number, StickerImage>> {
  const out = new Map<number, StickerImage>();
  const chunks: number[][] = [];
  for (let i = 0; i < orderIds.length; i += 100) chunks.push(orderIds.slice(i, i + 100));

  let done = 0;
  for (const chunk of chunks) {
    for (const type of ['png', 'svg'] as const) {
      const res = await withTimeout(
        fetch(`${API}?type=${type}&width=58&height=40`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: token },
          body: JSON.stringify({ orders: chunk }),
        }),
        45_000,
        `Таймаут WB при запросе стикеров (${type})`,
      );

      if (!res.ok) continue;

      const data = await res.json();
      const list = Array.isArray(data?.stickers) ? data.stickers : [];
      for (const st of list) {
        const id = Number(st?.orderId ?? st?.id ?? st?.order_id);
        const file = String(st?.file ?? '');
        if (Number.isFinite(id) && file && !out.has(id)) out.set(id, { file, type });
      }
      if (list.length > 0) break;
    }

    done += chunk.length;
    onProgress?.(Math.min(done, orderIds.length), orderIds.length);
  }

  return out;
}

/** Приводит стикер к data-URL нужного размера через canvas. */
async function render(
  sticker: StickerImage,
  width: number,
  height: number,
  imageType: 'PNG' | 'JPEG',
  quality: number,
): Promise<string | null> {
  const src = sticker.type === 'png'
    ? (sticker.file.startsWith('data:') ? sticker.file : `data:image/png;base64,${sticker.file}`)
    : URL.createObjectURL(new Blob([atob(sticker.file)], { type: 'image/svg+xml;charset=utf-8' }));

  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = src;
    });

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Сглаживание выключено намеренно: штрихкод после интерполяции не читается.
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    return imageType === 'JPEG' ? canvas.toDataURL('image/jpeg', quality) : canvas.toDataURL('image/png');
  } catch {
    return null;
  } finally {
    if (sticker.type !== 'png') URL.revokeObjectURL(src);
  }
}

/**
 * Собирает один PDF: страница 58×40 мм на стикер, порядок — как передали.
 *
 * Профили разрешения перебираются от лучшего к экономному: на нескольких
 * сотнях стикеров браузер упирается в память, и лучше отдать файл похуже,
 * чем не отдать вовсе.
 */
export async function buildStickersPdf(
  JsPdf: any,
  stickers: readonly StickerImage[],
): Promise<any> {
  const profiles = [
    { w: 580, h: 400, type: 'PNG' as const, q: 1 },
    { w: 360, h: 248, type: 'PNG' as const, q: 1 },
    { w: 290, h: 200, type: 'JPEG' as const, q: 0.84 },
  ];

  let lastError: unknown;
  for (const p of profiles) {
    try {
      const pdf = new JsPdf({ orientation: 'landscape', unit: 'mm', format: [58, 40], compress: true });

      for (let i = 0; i < stickers.length; i += 1) {
        if (i > 0) pdf.addPage([58, 40], 'landscape');
        const data = await render(stickers[i]!, p.w, p.h, p.type, p.q);
        if (data) pdf.addImage(data, p.type, 0, 0, 58, 40);
      }

      return pdf;
    } catch (e) {
      lastError = e;
    }
  }

  throw new Error(`Не удалось собрать PDF со стикерами: ${lastError instanceof Error ? lastError.message : lastError}`);
}
