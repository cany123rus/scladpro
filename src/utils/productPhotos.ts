/**
 * Картинки товаров для PDF.
 *
 * jsPDF умеет вставлять только data-URL, поэтому фото сначала скачиваем и
 * ужимаем через canvas: оригиналы WB весят по 100–300 КБ, и полсотни таких
 * превращают лист подбора в файл на 15 мегабайт.
 */

const CACHE = new Map<string, string>();

async function toDataUrl(url: string, maxSide: number, quality: number): Promise<string> {
  if (CACHE.has(url)) return CACHE.get(url)!;

  const data = await new Promise<string>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    // Битая или медленная картинка не должна вешать выгрузку целиком.
    const timer = setTimeout(() => resolve(''), 8000);

    img.onload = () => {
      clearTimeout(timer);
      try {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve('');
        // Белая подложка: у PNG с прозрачностью иначе получается чёрный квадрат.
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch {
        resolve('');
      }
    };

    img.onerror = () => {
      clearTimeout(timer);
      resolve('');
    };

    img.src = url;
  });

  CACHE.set(url, data);
  return data;
}

/** Скачивает пачку картинок с ограничением одновременных загрузок. */
export async function loadPhotoDataUrls(
  urls: readonly string[],
  { concurrency = 6, maxSide = 240, quality = 0.72 } = {},
): Promise<Map<string, string>> {
  const unique = [...new Set(urls.filter(Boolean))];
  const out = new Map<string, string>();

  for (let i = 0; i < unique.length; i += concurrency) {
    const part = unique.slice(i, i + concurrency);
    const done = await Promise.all(part.map((u) => toDataUrl(u, maxSide, quality)));
    part.forEach((u, k) => {
      const data = done[k];
      if (data) out.set(u, data);
    });
  }

  return out;
}
